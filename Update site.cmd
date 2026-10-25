@echo off
rem Double-click while the site is running: gets the latest work from GitHub. Then refresh the browser.
title Update Bible Guide site
cd /d "%~dp0"

echo Getting the latest work from GitHub...
git pull
if errorlevel 1 (
  echo.
  echo Could not get the latest work. Nothing was changed.
) else (
  echo.
  echo Done. Refresh the browser to see it.
  echo If the site is not running, double-click "Start site".
)
rem Cloud chats should save straight to main; work left on a claude/ branch is not shown until it is merged.
git fetch --prune --quiet
for /f "delims=" %%b in ('git branch -r --no-merged origin/main --list "origin/claude/*"') do (
  echo.
  echo NOT SHOWN YET: work saved on %%b has not been merged into main.
  echo Ask Claude to merge it, then double-click Update again.
)
echo.
pause
