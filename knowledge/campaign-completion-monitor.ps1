param([int]$PriorCompletionPid = 0)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$runtime = Join-Path $bibleState 'campaign-coordination'
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
$env:BIBLE_CAMPAIGN_MONITOR_PID = "$PID"
$monitorLock = $null
$successor = $null
$attempted = $false
Set-Location -LiteralPath $siteRoot

function Write-Monitor($phase, $errorText = $null) {
    $value = @{pid=$PID; updated_at=[DateTime]::UtcNow.ToString('o'); phase=$phase; prior_completion_pid=$PriorCompletionPid; successor_attempted=$attempted; error=$errorText}
    if ($successor) { $value.successor_pid=$successor.Id }
    $path = Join-Path $runtime 'monitor-state.json'
    $tmp = "$path.$PID.tmp"
    [IO.File]::WriteAllText($tmp, ($value | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $tmp -Destination $path -Force
}

try {
    try { $monitorLock = [IO.File]::Open((Join-Path $runtime 'monitor.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None) }
    catch [IO.IOException] { Write-Output 'Campaign report/successor monitor already running.'; exit 0 }
    while ($true) {
        & $biblePython -m knowledge.campaign_coordinator report
        if ($LASTEXITCODE) { throw 'Campaign report update failed.' }
        $summary = Get-Content -LiteralPath (Join-Path $runtime 'summary.json') -Raw | ConvertFrom-Json
        if ($summary.state -eq 'verified_complete') {
            # Final held-file numbers, after all ordered acquisition phases.
            & $biblePython (Join-Path $PSScriptRoot 'campaign_stocktake.py')
            if ($LASTEXITCODE) { throw 'Final stocktake update failed.' }
            & $biblePython -m knowledge.campaign_coordinator report
            if ($LASTEXITCODE) { throw 'Final verified report update failed.' }
            Write-Monitor 'verified_complete'
            break
        }
        $prior = if ($PriorCompletionPid) { Get-CimInstance Win32_Process -Filter "ProcessId=$PriorCompletionPid" } else { $null }
        if ($prior -and $prior.CommandLine -like "*$siteRoot*" -and $prior.CommandLine -match '(watchdog-resume|finish-intake)\.ps1') {
            Write-Monitor 'waiting_for_existing_completion_owner'
        } elseif (-not $attempted) {
            # Loaded PowerShell functions in the old owner cannot adopt file edits.
            # Wait for its natural exit, then use the same exclusive intake lock.
            # No worker, service or acquisition is terminated by this monitor.
            $attempted = $true
            $successor = Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',"`"$(Join-Path $PSScriptRoot 'finish-intake.ps1')`"",'-Resume') -WorkingDirectory $siteRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime "completion-$PID.log") -RedirectStandardError (Join-Path $runtime "completion-$PID-error.log")
            Write-Monitor 'successor_started_under_shared_intake_lock'
        } elseif ($successor -and $successor.HasExited -and $successor.ExitCode) {
            Write-Monitor 'needs_attention' "Successor exited $($successor.ExitCode); inspect completion-$PID-error.log. No automatic failure retries."
        } else { Write-Monitor 'monitoring_completion_and_later_acquisitions' }
        Start-Sleep -Seconds 60
    }
} catch {
    Write-Monitor 'needs_attention' $_.Exception.Message
    throw
} finally { if ($monitorLock) { $monitorLock.Dispose() } }
