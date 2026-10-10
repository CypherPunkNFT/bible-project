param([switch]$Remove, [switch]$Unattended)
$ErrorActionPreference = 'Stop'
$taskName = 'BibleProject-Knowledge-Watchdog'
if ($Remove) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Output 'Bible embedding watchdog removed.'
    exit
}
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$command = "& '$($biblePython.Replace("'", "''"))' -m knowledge.watchdog; exit `$LASTEXITCODE"
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $encoded" -WorkingDirectory $siteRoot
$periodic = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $userId
$watchdogLogon = if ($Unattended) { 'S4U' } else { 'Interactive' }
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType $watchdogLogon -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($periodic, $logon) -Principal $principal -Settings $settings -Description 'Check every minute; verify saved-vector progress after recovery; escalate failed worker restarts to an owned worker/encoder reset; preserve vectors and other GPU jobs.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
