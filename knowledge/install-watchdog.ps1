param([switch]$Remove)
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
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $encoded" -WorkingDirectory $siteRoot
$periodic = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(30) -RepetitionInterval (New-TimeSpan -Minutes 30)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($periodic, $logon) -Principal $principal -Settings $settings -Description 'Check the independent Bible knowledge embedding job every 30 minutes; resume stopped workers, preserve error logs, and leave other GPU jobs alone.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
