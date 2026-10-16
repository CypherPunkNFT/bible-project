"""Inspect or stop this task's read-only development evaluator by process identity."""
import argparse
import psutil
from .jobs import process_identity
from .inputs import packed

def main():
    p=argparse.ArgumentParser();p.add_argument('--stop',type=int);p.add_argument('--token');a=p.parse_args()
    found=[]
    for proc in psutil.process_iter(['pid','cmdline']):
        args=proc.info['cmdline'] or []
        if 'knowledge.library_analytics.concept_evaluate' not in args or 'development' not in args:continue
        token=process_identity(proc.pid);found.append({'pid':proc.pid,'parent_pid':proc.ppid(),'executable':proc.exe(),'process_token':token,'command':args})
        if a.stop==proc.pid:
            if not a.token or token!=a.token:raise ValueError('Process identity mismatch')
            proc.terminate();proc.wait(timeout=10)
            print(packed({'stopped_readonly_development_evaluator':a.stop,'process_token':token}))
            return
    if a.stop:raise ValueError('Matching development evaluator not found')
    print(packed(found))

if __name__=='__main__':main()
