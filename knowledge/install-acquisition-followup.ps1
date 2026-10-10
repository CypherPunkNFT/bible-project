$ErrorActionPreference = 'Stop'
$taskName = 'BibleProject-After14Missions-Refresh'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
if (-not (Test-Path (Join-Path $bibleState 'acquisition-followup-plan.json'))) { throw 'Write and review the follow-up plan first.' }
$command = "& '$($biblePython.Replace("'", "''"))' -m knowledge.acquisition_followup; exit `$LASTEXITCODE"
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $encoded" -WorkingDirectory $siteRoot
$periodic = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Minutes 5)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($periodic, $logon) -Principal $principal -Settings $settings -Description 'After all 14 Bible acquisition mission reports/manifests are complete and writers are idle, rebuild and embed once. No 5 AM restriction. Disables after verified completion.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
