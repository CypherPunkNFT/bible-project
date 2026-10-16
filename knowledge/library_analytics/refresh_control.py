"""Stop only this task's verified idle suite waiter after a code update."""
import json
from pathlib import Path
import psutil
import sys
from .jobs import process_identity
from .build import readonly
from .refresh import ROOT,GLOBAL
from .refresh_contract import atomic_json

def main():
    launch=json.loads((ROOT/'suite-launch.json').read_text('utf-8'));pid=launch['pid']
    if process_identity(pid)!=launch['process_token']:raise RuntimeError('Suite creation identity no longer matches')
    p=psutil.Process(pid);cmd=p.cmdline()
    if '-m' not in cmd or cmd[cmd.index('-m')+1]!='knowledge.library_analytics.refresh_run_suite':raise RuntimeError('Not the owned suite module')
    db=readonly(GLOBAL)
    try:owner=db.execute('SELECT * FROM coordinator').fetchone()
    finally:db.close()
    active=owner and owner['pid']==pid
    if active and '--stop-worker' not in sys.argv:raise RuntimeError('Owned suite is active; refuse idle-waiter stop')
    p.terminate();p.wait(timeout=10)
    atomic_json(ROOT/('owned-worker-interruption.json' if active else 'waiting-suite-restart.json'),{'stopped_pid':pid,'process_token':launch['process_token'],'command':cmd,
         'reason':'Load corrected refresh implementation; uncommitted owned population work is discarded',
         'owned_active_worker':bool(active),'global_owner_observed':dict(owner) if owner else None})
    print('Stopped only the verified owned refresh suite process')

if __name__=='__main__':main()
