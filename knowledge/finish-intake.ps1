param([int]$ExistingLauncherPid = 0, [switch]$Resume)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
$embeddingPattern = [regex]::Escape($biblePython) + '"?\s+-u\s+-m\s+knowledge\s+embed\s*$'

function Write-Completion($value) {
    $path = Join-Path $bibleState 'intake-completion.json'
    $temporary = "$path.$PID.tmp"
    [IO.File]::WriteAllText($temporary, ($value | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $path -Force
}

function Refresh-Corpus {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start.ps1') -Refresh
    if ($LASTEXITCODE) { throw 'Corpus refresh failed; inspect the completion log. Previous published database is preserved.' }
}

Push-Location $siteRoot
try {
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
        $json = & $biblePython -m knowledge verify
        if ($LASTEXITCODE) { throw 'Corpus verification command failed.' }
        $verification = ($json -join "`n") | ConvertFrom-Json
        if (-not $verification.complete) { throw 'Embedding pass is incomplete or failed verification; inspect embedding-error.log and resume the instance.' }
        if ($verification.missing_library_files_since_snapshot -gt 0) { throw 'Previously imported originals are missing. Inspect the source collection before refreshing.' }
        if ($verification.missing_source_inputs_since_snapshot -gt 0) { throw 'Previously indexed source inputs are missing. Inspect source-drift.json before refreshing.' }
        if ($verification.new_library_files_since_snapshot -gt 0 -or $verification.changed_library_ledgers_since_snapshot -gt 0 -or $verification.new_source_files_since_snapshot -gt 0 -or $verification.changed_source_inputs_since_snapshot -gt 0) {
            Write-Output "Found $($verification.new_library_files_since_snapshot) later acquisition files and $($verification.changed_library_ledgers_since_snapshot) changed ledgers. Refreshing and reusing saved vectors."
            Write-Output "Full source audit: $($verification.new_source_files_since_snapshot) new files; $($verification.changed_source_inputs_since_snapshot) changed inputs. See source-drift.json."
            Write-Completion @{state='refreshing_late_acquisitions'; pid=$PID; verification=$verification}
            Refresh-Corpus
            continue
        }
        if (-not $verification.enrichment_ready) { throw 'Text coverage has unresolved gaps. Enrichment remains blocked; inspect library-intake.json.' }
        Write-Completion @{state='complete'; completed_at=[DateTime]::UtcNow.ToString('o'); verification=$verification; enrichment_started=$false}
        Write-Output ($verification | ConvertTo-Json -Depth 12)
        Write-Output 'Held-text incorporation and embeddings verified. Enrichment has not been started.'
        break
    }
} catch {
    Write-Completion @{state='needs_attention'; updated_at=[DateTime]::UtcNow.ToString('o'); error=$_.Exception.Message; enrichment_started=$false}
    throw
} finally { Pop-Location }
