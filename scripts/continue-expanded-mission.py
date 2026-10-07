"""Queue DG phases after its current worker, and maintain campaign accounting."""
import ctypes
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from modern_texts_common import CACHE,REPORT,SITE,write

def alive(pid):
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.OpenProcess.restype=ctypes.c_void_p
    kernel.GetExitCodeProcess.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_ulong)]
    kernel.CloseHandle.argtypes=[ctypes.c_void_p]
    handle=kernel.OpenProcess(0x1000,False,pid)
    if not handle:return False
    code=ctypes.c_ulong()
    try:return bool(kernel.GetExitCodeProcess(handle,ctypes.byref(code))) and code.value==259
    finally:kernel.CloseHandle(handle)

def now():return datetime.now(timezone.utc).isoformat()

def main():
    state=dict(startedAt=now(),pid=os.getpid(),status='waiting-for-existing-DG-runner',
        workers={'piper-message-runner':44368,'rogers':7564,'begg':60616,'monergism-library':15032,'ccel-expansion':40648},
        phases=[],scope='Owner authorized broad existing-readable-text acquisition; no OCR, no public republication')
    path=REPORT/'expanded-job-state.json'
    write(path,state)
    # Avoid DG host overlap and the original runner's report/metadata writes.
    while alive(44368) or alive(27884):
        state['checkedAt']=now();write(path,state)
        if not alive(44368):subprocess.run([sys.executable,'-X','utf8','scripts/report-modern-texts.py'],cwd=SITE)
        time.sleep(30)
    phases=[('piper-messages-resume',['collect-modern-texts.py','--source','piper','--kinds','messages']),
            ('piper-books',['collect-piper-books.py']),
            ('piper-articles-interviews',['collect-modern-texts.py','--source','piper','--kinds','articles','interviews'])]
    for name,cmd in phases:
        log=CACHE/(name+'-expanded.log')
        phase=dict(name=name,status='running',startedAt=now(),log=log.relative_to(SITE).as_posix())
        state['status']='running';state['phases'].append(phase)
        with log.open('a',encoding='utf-8') as stream:
            proc=subprocess.Popen([sys.executable,'-X','utf8','-u',str(SITE/'scripts'/cmd[0]),*cmd[1:]],cwd=SITE,stdout=stream,stderr=subprocess.STDOUT)
            phase['pid']=proc.pid;write(path,state)
            while proc.poll() is None:
                subprocess.run([sys.executable,'-X','utf8','scripts/report-modern-texts.py'],cwd=SITE,stdout=stream,stderr=subprocess.STDOUT)
                time.sleep(30)
            phase.update(status='process-finished' if proc.returncode==0 else 'process-failed',exitCode=proc.returncode,finishedAt=now())
            if proc.returncode or 'stopped on access/rate response' in log.read_text(encoding='utf-8').lower():
                phase['status']='stopped-review-required';write(path,state);break
        write(path,state)
    while any(alive(pid) for name,pid in state['workers'].items() if name!='piper-message-runner'):
        state['checkedAt']=now();write(path,state)
        subprocess.run([sys.executable,'-X','utf8','scripts/report-modern-texts.py'],cwd=SITE)
        time.sleep(30)
    subprocess.run([sys.executable,'-X','utf8','scripts/report-modern-texts.py','--verify'],cwd=SITE)
    state.update(status='workers-finished-review-gaps',finishedAt=now());write(path,state)

if __name__=='__main__':main()
