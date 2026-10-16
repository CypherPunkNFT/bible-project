"""Finite native runner: wait for existing global lease, never bypass it."""
import argparse,json,os,sys,time
from pathlib import Path
from .inputs import ROOT,lease_status,write_json
from .processor import run
from ..jobs import process_identity

def main():
    p=argparse.ArgumentParser();p.add_argument('--calibrate',action='store_true');p.add_argument('--run',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--limit',type=int);a=p.parse_args()
    if not a.calibrate and not a.run:p.error('Select --calibrate or --run')
    started=time.time();receipt={'pid':os.getpid(),'process_token':process_identity(os.getpid()),'started_at_unix':started,'command':[sys.executable,'-X','utf8','-u','-m',__spec__.name,*sys.argv[1:]],'cwd':str(Path.cwd()),'mode':'calibration' if a.calibrate else 'population','scheduler':False}
    while True:
        held=lease_status()
        if any(r['live_identity']=='unknown' or r['live_identity']==r['process_token'] for r in held):
            write_json(ROOT/'queued-worker.json',{**receipt,'state':'waiting-for-global-lease','checked_at_unix':time.time(),'observed_owner':held})
            print(json.dumps({'state':'waiting-for-global-lease','owner':held,'wait_seconds':time.time()-started}),flush=True)
            time.sleep(30);continue
        try:
            write_json(ROOT/'queued-worker.json',{**receipt,'state':'attempting-existing-lease','checked_at_unix':time.time()})
            run(a.calibrate,a.resume,a.limit)
            write_json(ROOT/'queued-worker.json',{**receipt,'state':'exited-successfully','finished_at_unix':time.time()});return
        except RuntimeError as e:
            if 'Analytics coordinator already owned by PID' not in str(e):raise
            time.sleep(30)
if __name__=='__main__':main()
