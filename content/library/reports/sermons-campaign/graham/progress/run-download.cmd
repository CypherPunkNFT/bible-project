@echo off
title Graham sermons download
cd /d "C:\Users\lcladm\AppData\Local\Temp\claude\d--FortressOfSolitude\1f4c8b6f-de3f-43c9-863e-86c5b678e845\scratchpad\graham"
"C:\Users\lcladm\AppData\Local\Programs\Python\Python312\python.exe" -X utf8 scan_pages.py raw/scan-urls.txt scan/checkpoint.jsonl scan/keep >> scan-run2.log 2>&1
echo GRAHAM SCAN FINISHED
pause
