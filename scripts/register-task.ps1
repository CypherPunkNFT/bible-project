# Registers scheduled task "BibleProjectWebsite": runs scripts/start-preview.ps1 at logon and every 5 minutes,
# so the always-on copy on http://127.0.0.1:8931 comes back by itself if it stops. start-preview.ps1 exits at
# once when the port is already served, so the repeat is cheap. Same settings as task "CypherpunkWebsite".
# Run once:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-task.ps1
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "start-preview.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$atLogon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$every5 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "BibleProjectWebsite" -Action $action -Trigger @($atLogon, $every5) -Settings $settings -Force | Out-Null
Write-Output "registered BibleProjectWebsite -> $script"
