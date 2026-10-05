param([switch]$Refresh, [switch]$Stop, [switch]$NoIndex)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent
$bibleState = [IO.Path]::GetFullPath((Join-Path $siteRoot '../KnowledgeBase'))
$biblePython = Join-Path $bibleState '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $biblePython)) { throw 'Create the Bible knowledge Python environment first; see knowledge/README.md.' }
$ownPattern = [regex]::Escape($biblePython) + '"?\s+-u\s+-m\s+knowledge\s+(encoder|serve|embed)\s*$'
function Own-Processes {
    @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match $ownPattern })
}
function Health($port, $service) {
    try {
        $value = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -TimeoutSec 3
        if ($value.service -ne $service) { throw "Port $port is used by a different service." }
        return $value
    } catch [System.Net.WebException] { return $null }
}
function Start-ServiceProcess($command, $port, $service) {
    if (Health $port $service) { return }
    $job = Start-Process -FilePath $biblePython -ArgumentList @('-u','-m','knowledge',$command) -WorkingDirectory $siteRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $bibleState "$command.log") -RedirectStandardError (Join-Path $bibleState "$command-error.log")
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Seconds 1
        if (Health $port $service) { return }
        if ($job.HasExited) { throw "$command exited; inspect $bibleState/$command-error.log" }
    }
    throw "$command did not become ready; inspect its log."
}
if ($Stop -or $Refresh) {
    foreach ($process in (Own-Processes)) {
        if ($Stop -or $process.CommandLine -notmatch '\sencoder\s*$') {
            Stop-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
    if ($Stop) { Write-Output 'Bible knowledge services stopped. Indexed data is preserved.'; exit }
}
if ($Refresh -or -not (Test-Path -LiteralPath (Join-Path $bibleState 'knowledge.sqlite3'))) {
    Push-Location $siteRoot
    try { & $biblePython -m knowledge build; if ($LASTEXITCODE) { throw 'Corpus build failed; previous database retained.' } }
    finally { Pop-Location }
}
Start-ServiceProcess 'encoder' 8936 'bible-project-encoder'
Start-ServiceProcess 'serve' 8935 'bible-project-knowledge'
if (-not $NoIndex -and -not ((Own-Processes) | Where-Object { $_.CommandLine -match '\sembed\s*$' })) {
    $status = Invoke-RestMethod -Uri 'http://127.0.0.1:8935/api/status' -TimeoutSec 30
    if ($status.embeddings.state -ne 'complete') {
        $job = Start-Process -FilePath $biblePython -ArgumentList @('-u','-m','knowledge','embed') -WorkingDirectory $siteRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $bibleState 'embedding.log') -RedirectStandardError (Join-Path $bibleState 'embedding-error.log')
        $job.Id | Set-Content -LiteralPath (Join-Path $bibleState 'embedding.pid')
        Write-Output 'Semantic indexing is running in the background; finished passages are reused.'
    }
}
Write-Output 'Bible Project knowledge: http://127.0.0.1:8935'
