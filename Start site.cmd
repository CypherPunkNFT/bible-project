@echo off
rem Double-click: gets the latest work from GitHub, then runs the site and opens it in the browser.
rem Leave this window open while looking at the site. Close it to stop the site.
title Bible Guide site
cd /d "%~dp0"

echo Getting the latest work from GitHub...
git pull
if errorlevel 1 echo Could not get the latest from GitHub. Showing the copy already on this PC.

rem Already running (8930 is the dev port in vite.config.ts): show it instead of starting a second copy.
netstat -ano | findstr /c:"127.0.0.1:8930 " | findstr LISTENING >nul && (
  echo.
  echo The site is already running. Opening it in the browser.
  start "" http://127.0.0.1:8930/
  exit /b 0
)

echo.
echo Checking the site's building blocks...
call bun install
if errorlevel 1 (
  echo Could not install what the site needs. Is Bun installed?
  pause
  exit /b 1
)

echo.
echo Starting the site. The browser opens by itself.
echo To get newer work later, double-click "Update site" and refresh the browser.
call bun run dev --open
pause
