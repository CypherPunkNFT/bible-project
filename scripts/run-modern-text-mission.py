"""Durable local mission runner: downloads, checkpoints and refreshes the report.

Network phases are sequential per publisher and stop on access/rate responses.
Separate ministries may run concurrently. No external communications are sent.
"""
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime,timezone
from modern_texts_common import CACHE,REPORT,SITE,write

def now():return datetime.now(timezone.utc).isoformat()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--piper-only',action='store_true');args=parser.parse_args()
    # Owner narrowed the mission: existing full sermon text only for now.
    # PDF acquisition, books, article and interview expansion are deferred.
    phases=[('piper-messages',['collect-modern-texts.py','--source','piper','--kinds','messages'])]
    state=dict(startedAt=now(),pid=__import__('os').getpid(),status='running',phases=[],
      note='Piper existing sermon text only. Rogers PDF collection stopped at owner request; all other acquisition phases deferred.')
    for name,cmd in phases:
        log=CACHE/(name+'.log');log.parent.mkdir(parents=True,exist_ok=True)
        phase=dict(name=name,startedAt=now(),status='running',log=log.relative_to(SITE).as_posix())
        state['phases'].append(phase);write(REPORT/'job-state.json',state)
        with log.open('a',encoding='utf-8') as stream:
            child=subprocess.Popen([sys.executable,'-X','utf8','-u',str(SITE/'scripts'/cmd[0]),*cmd[1:]],cwd=SITE,stdout=stream,stderr=subprocess.STDOUT)
            phase['pid']=child.pid;write(REPORT/'job-state.json',state)
            while child.poll() is None:
                subprocess.run([sys.executable,'-X','utf8',str(SITE/'scripts/report-modern-texts.py')],cwd=SITE,stdout=stream,stderr=subprocess.STDOUT)
                time.sleep(30)
            phase.update(status='process-finished' if child.returncode==0 else 'process-failed',exitCode=child.returncode,finishedAt=now())
            # A zero exit can still contain explicit source gaps or an access stop.
            if 'stopped on access/rate response' in log.read_text(encoding='utf-8').lower():
                phase['status']='source-access-stopped'
                write(REPORT/'job-state.json',state)
                break
        write(REPORT/'job-state.json',state)
    subprocess.run([sys.executable,'-X','utf8',str(SITE/'scripts/enrich-modern-texts.py')],cwd=SITE)
    subprocess.run([sys.executable,'-X','utf8',str(SITE/'scripts/report-modern-texts.py'),'--verify'],cwd=SITE)
    state.update(status='worker-finished-review-gaps',finishedAt=now())
    write(REPORT/'job-state.json',state)

if __name__=='__main__':main()
