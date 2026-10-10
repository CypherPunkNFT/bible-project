param([int]$ExistingLauncherPid = 0, [switch]$Resume)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
$embeddingPattern = [regex]::Escape($biblePython) + '"?\s+-u\s+-m\s+knowledge\s+embed\s*$'
$completionLock = $null

function Write-Completion($value) {
    $path = Join-Path $bibleState 'intake-completion.json'
    $temporary = "$path.$PID.tmp"
    [IO.File]::WriteAllText($temporary, ($value | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $path -Force
}

function Refresh-Corpus {
    Wait-Acquisitions
    # Recheck the published inventory before any rebuild, including initial runs.
    # Only exact, checksum-proven RB05 moves may disappear; unknown loss blocks it.
    & $biblePython -m knowledge.campaign_coordinator archives
    if ($LASTEXITCODE) { throw 'Missing-input reconciliation failed; inspect campaign-coordination/archive-moves.json.' }
    # Existing acquisition readers finish naturally; never terminate a harvest.
    do {
        $readerJson = & $biblePython (Join-Path $PSScriptRoot 'database_lock_owners.py')
        if ($LASTEXITCODE) { throw 'Could not inspect source database readers before publication.' }
        $readerInfo = ($readerJson -join "`n") | ConvertFrom-Json
        $pendingSourceReaders = @($readerInfo.holders | Where-Object {
            $readerProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.pid)"
            $readerProcess -and $readerProcess.CommandLine -match 'scripts[/\\]bulk-tcp\.py'
        })
        if ($pendingSourceReaders.Count) {
            Write-Completion @{state='waiting_for_source_database_reader'; pid=$PID; updated_at=[DateTime]::UtcNow.ToString('o'); readers=$pendingSourceReaders}
            Start-Sleep -Seconds 20
        }
    } while ($pendingSourceReaders.Count)
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start.ps1') -Refresh
    if ($LASTEXITCODE) { throw 'Corpus refresh failed; inspect the completion log. Previous published database is preserved.' }
}

function Wait-Acquisitions {
    do {
        $harvests = @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object {
            $_.CommandLine -like "*$(Split-Path $siteRoot -Parent)*" -and $_.CommandLine -match '(bulk_collect\.py\s+collect|bulk-tcp\.py|collect-expanded-libraries\.py|collect-piper-books\.py|knowledge\.patristic_collect\s+collect)'
        })
        $queueActive = $false
        $queuePath = Join-Path $bibleState 'bulk-queue.json'
        if (Test-Path -LiteralPath $queuePath) {
            $queue = Get-Content -LiteralPath $queuePath -Raw | ConvertFrom-Json
            $queueProcess = if ($queue.pid) { Get-CimInstance Win32_Process -Filter "ProcessId=$($queue.pid)" } else { $null }
            $queueActive = $queueProcess -and $queueProcess.CommandLine -match 'scripts[/\\]bulk-queue\.py' -and $queue.state -in @('downloading','waiting_for_active_collector')
        }
        if ($harvests.Count -or $queueActive) {
            Write-Completion @{state='waiting_for_acquisitions'; pid=$PID; updated_at=[DateTime]::UtcNow.ToString('o'); harvest_pids=@($harvests.ProcessId)}
            Start-Sleep -Seconds 20
        }
    } while ($harvests.Count -or $queueActive)
}

Push-Location $siteRoot
try {
    # One completion pipeline for this instance. Existing embeddings finish first.
    try { $completionLock = [IO.File]::Open((Join-Path $bibleState 'finish-intake.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None) }
    catch [IO.IOException] { Write-Output 'Another Bible intake completion pipeline already owns the lock.'; exit 0 }
    do {
        $existingWorkers = @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match $embeddingPattern })
        if ($existingWorkers.Count) {
            Write-Completion @{state='waiting_for_current_embeddings'; pid=$PID; updated_at=[DateTime]::UtcNow.ToString('o')}
            Start-Sleep -Seconds 20
        }
    } while ($existingWorkers.Count)
    # This is a one-time completion job, not a scheduler or acquisition worker.
    Write-Completion @{state='running'; pid=$PID; started_at=[DateTime]::UtcNow.ToString('o')}
    if ($ExistingLauncherPid) {
        $launcher = Get-CimInstance Win32_Process -Filter "ProcessId=$ExistingLauncherPid"
        if ($launcher) {
            if ($launcher.CommandLine -notmatch 'knowledge[/\\]start\.ps1\s+-Refresh') { throw 'Refusing to attach to an unrelated process.' }
            $process = Get-Process -Id $ExistingLauncherPid
            $process.WaitForExit()
            if ($process.ExitCode) { throw 'Attached intake launcher failed; inspect intake-build-error.log.' }
        }
    } elseif ($Resume) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start.ps1')
        if ($LASTEXITCODE) { throw 'Could not resume the Bible instance.' }
    } else { Refresh-Corpus }
    while ($true) {
        # Wait for this Bible instance only; never stop or query another corpus.
        do {
            $workers = @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match $embeddingPattern })
            if ($workers.Count) { Start-Sleep -Seconds 20 }
        } while ($workers.Count)
        Wait-Acquisitions
        Write-Completion @{state='verifying'; pid=$PID; updated_at=[DateTime]::UtcNow.ToString('o')}
        $json = & $biblePython -m knowledge verify
        if ($LASTEXITCODE) { throw 'Corpus verification command failed.' }
        $verification = ($json -join "`n") | ConvertFrom-Json
        if (-not $verification.complete) { throw 'Embedding pass is incomplete or failed verification; inspect embedding-error.log and resume the instance.' }
        & $biblePython -m knowledge.campaign_coordinator archives
        if ($LASTEXITCODE) { throw 'Unexplained missing published inputs; rebuild/completion refused. Inspect campaign-coordination/archive-moves.json.' }
        if ($verification.new_library_files_since_snapshot -gt 0 -or $verification.changed_library_ledgers_since_snapshot -gt 0 -or $verification.new_source_files_since_snapshot -gt 0 -or $verification.changed_source_inputs_since_snapshot -gt 0 -or $verification.missing_library_files_since_snapshot -gt 0 -or $verification.missing_source_inputs_since_snapshot -gt 0) {
            Write-Output "Found $($verification.new_library_files_since_snapshot) later acquisition files and $($verification.changed_library_ledgers_since_snapshot) changed ledgers. Refreshing and reusing saved vectors."
            Write-Output "Full source audit: $($verification.new_source_files_since_snapshot) new files; $($verification.changed_source_inputs_since_snapshot) changed inputs. See source-drift.json."
            Write-Completion @{state='refreshing_late_acquisitions'; pid=$PID; verification=$verification}
            Refresh-Corpus
            continue
        }
        if (-not $verification.enrichment_ready) { throw 'Text coverage has unresolved gaps. Enrichment remains blocked; inspect library-intake.json.' }
        if (Test-Path -LiteralPath (Join-Path $bibleState 'campaign-coordination/intake-plan.json')) {
            & $biblePython -m knowledge.campaign_coordinator final
            if ($LASTEXITCODE) { throw 'Preparation outputs were not fully incorporated; inspect campaign-coordination/published-handoffs.json.' }
        }
        Write-Completion @{state='complete'; completed_at=[DateTime]::UtcNow.ToString('o'); verification=$verification; enrichment_started=$false}
        if (Test-Path -LiteralPath (Join-Path $siteRoot 'scripts/bulk-status.py')) {
            & $biblePython (Join-Path $siteRoot 'scripts/bulk-status.py')
        }
        Write-Output ($verification | ConvertTo-Json -Depth 12)
        Write-Output 'Held-text incorporation and embeddings verified. Enrichment has not been started.'
        break
    }
} catch {
    Write-Completion @{state='needs_attention'; updated_at=[DateTime]::UtcNow.ToString('o'); error=$_.Exception.Message; enrichment_started=$false}
    throw
} finally { if ($completionLock) { $completionLock.Dispose() }; Pop-Location }
