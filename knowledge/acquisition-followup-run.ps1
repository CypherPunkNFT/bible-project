$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$stateFile = Join-Path $bibleState 'acquisition-followup.json'
$run = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
function Write-Run($value) {
    $temporary = "$stateFile.$PID.tmp"
    [IO.File]::WriteAllText($temporary, ($value | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $stateFile -Force
}
Set-Location -LiteralPath $siteRoot
try {
    $run.state = 'running'
    $run | Add-Member -NotePropertyName pid -NotePropertyValue $PID -Force
    Write-Run $run
    & (Join-Path $PSScriptRoot 'finish-intake.ps1') 1> (Join-Path $bibleState "acquisition-followup-$PID.log") 2> (Join-Path $bibleState "acquisition-followup-$PID-error.log")
    $completion = Get-Content (Join-Path $bibleState 'intake-completion.json') -Raw | ConvertFrom-Json
    if ($completion.state -ne 'complete') { throw 'Follow-up did not reach verified completion.' }
    $run.state = 'complete'
    $run | Add-Member -NotePropertyName completed_at -NotePropertyValue ([DateTime]::UtcNow.ToString('o')) -Force
    Write-Run $run
} catch {
    $run.state = 'needs_attention'
    $run | Add-Member -NotePropertyName error -NotePropertyValue $_.Exception.Message -Force
    Write-Run $run
    throw
}
