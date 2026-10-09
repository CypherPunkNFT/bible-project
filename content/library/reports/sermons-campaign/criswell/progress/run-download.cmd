@echo off
title Criswell sermons download
cd /d "C:\Users\lcladm\AppData\Local\Temp\claude\d--FortressOfSolitude\1f4c8b6f-de3f-43c9-863e-86c5b678e845\scratchpad\criswell"
"C:\Users\lcladm\AppData\Local\Programs\Python\Python312\python.exe" -X utf8 -I fetch.py >> run3.out 2>&1
echo CRISWELL FINISHED
pause
