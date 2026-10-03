# Serves the BUILT Bible Project site at http://127.0.0.1:8931 for scheduled task "BibleProjectWebsite"
# (at logon and every 5 minutes, hidden). Copied from the CypherPunk NFT site's start-preview.ps1.
#
# It serves dist/ as last built (`bun run build`); if dist/ is missing it builds once first.
# Safe to run twice: if something already listens on 8921 it logs that and exits instead of starting a
# second server (vite's strictPort would refuse anyway, less clearly).
$ErrorActionPreference = "Stop"
$site = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $site ".logs"
$log = Join-Path $logDir "preview.log"
$port = 8931
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Log([string]$message) {
    Add-Content -Path $log -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message" -Encoding utf8
}

$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Log "port $port already in use by process $($listening[0].OwningProcess); not starting a second server"
    exit 0
}

# The real program, not npm's bun.ps1 / bun.cmd wrappers on PATH.
$bun = Join-Path $env:APPDATA "npm\node_modules\bun\bin\bun.exe"
if (-not (Test-Path $bun)) {
    Write-Log "bun.exe not found at $bun; cannot start the site. Expected bun installed with npm -g."
    exit 1
}

Set-Location $site
if (-not (Test-Path (Join-Path $site "dist\index.html"))) {
    Write-Log "no build found in dist\; building once before serving"
    & cmd.exe /d /c "`"$bun`" run build >> `"$log`" 2>&1"
    if ($LASTEXITCODE -ne 0) {
        Write-Log "build failed (exit $LASTEXITCODE); see the lines above. Not serving."
        exit 1
    }
}

Write-Log "serving dist\ on http://127.0.0.1:$port with $bun"
# Through cmd, not PowerShell's own redirection: Windows PowerShell 5.1 turns a program's stderr lines
# into errors, and with ErrorActionPreference=Stop the first one would kill the script (TaxVantage, 2026-09-24).
& cmd.exe /d /c "`"$bun`" run preview >> `"$log`" 2>&1"
Write-Log "the site stopped (exit $LASTEXITCODE)"
