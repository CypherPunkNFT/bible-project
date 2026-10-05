# Separate hidden process, launched through Win32_Process so it survives the
# short-lived scheduled watchdog check. All output stays in this Bible instance.
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
Set-Location -LiteralPath $siteRoot
# Surviving child services can still hold the old monitor's redirected handles.
# Each recovery uses fresh logs, so a locked prior log cannot prevent startup.
& (Join-Path $PSScriptRoot 'finish-intake.ps1') -Resume 1> (Join-Path $bibleState "intake-recovery-$PID.log") 2> (Join-Path $bibleState "intake-recovery-$PID-error.log")
