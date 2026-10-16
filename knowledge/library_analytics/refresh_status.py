"""Small read-only owned status summary, with actual creation identities."""
import json
from pathlib import Path
import psutil
from .refresh import ROOT,GLOBAL
from .build import readonly
from .jobs import process_identity

def main():
    value={}
    for name in ('suite-launch.json','progress.json','suite-result.json'):
        p=ROOT/name
        if p.exists():
            r=json.loads(p.read_text('utf-8'));value[name]={k:r[k] for k in ('pid','process_token','run_id','state','phase','visited','expected','documents','seconds_this_attempt','seconds') if k in r}
    p=ROOT/'suite-launch.json'
    if p.exists():
        r=json.loads(p.read_text('utf-8'));token=process_identity(r['pid']);value['owned_suite_alive']=token==r['process_token']
        if token==r['process_token']:
            owner=psutil.Process(r['pid']);value['owned_suite']={'rss':owner.memory_info().rss,'cpu_seconds':sum(owner.cpu_times()[:2]),'command':owner.cmdline()}
    db=readonly(GLOBAL)
    try:value['global_owner']=[{**dict(r),'observed_process_token':process_identity(r['pid'])} for r in db.execute('SELECT * FROM coordinator')]
    finally:db.close()
    if (ROOT/'refresh.sqlite3').exists():
        local=readonly(ROOT/'refresh.sqlite3')
        try:
            row=local.execute('SELECT id,mode,state FROM refresh_runs ORDER BY rowid DESC LIMIT 1').fetchone()
            if row:
                value['latest_private_run']=dict(row)
                value['committed_memberships']=local.execute('SELECT count(*) FROM membership WHERE run_id=?',(row['id'],)).fetchone()[0]
                value['active_jobs']=[dict(r) for r in local.execute("SELECT task,scope FROM jobs WHERE state='running' LIMIT 2")]
        finally:local.close()
    if value.get('progress.json',{}).get('pid')!=value.get('suite-launch.json',{}).get('pid'):
        if 'progress.json' in value:value['previous_progress']=value.pop('progress.json')
        logs=list(ROOT.glob('suite*.log'));log=max(logs,key=lambda p:p.stat().st_mtime) if logs else ROOT/'suite.log'
        if log.exists():
            with log.open('rb') as f:f.seek(max(0,log.stat().st_size-4096));lines=f.read().decode('utf-8','replace').splitlines()
            value['last_log']=lines[-1] if lines else ''
    for owner in value['global_owner']:
        try:
            cmd=psutil.Process(owner['pid']).cmdline()
            if 'knowledge.library_analytics.recovery.archive' in cmd and '--work' in cmd:
                folder=Path(cmd[cmd.index('--work')+1]);logs=list(folder.glob('*.log'))
                log=max(logs,key=lambda p:p.stat().st_mtime)
                with log.open('rb') as f:f.seek(max(0,log.stat().st_size-4096));lines=f.read().decode('utf-8','replace').splitlines()
                value['foreign_owner_last_progress']=lines[-1] if lines else ''
                ledger=readonly(folder/'jobs.sqlite3')
                try:
                    running=[dict(r) for r in ledger.execute("SELECT task,scope FROM jobs WHERE state='running' LIMIT 2")]
                    for row in running:
                        source=Path(row['scope'])
                        if source.is_file():row['bytes']=source.stat().st_size
                    value['foreign_owner_running_jobs']=running
                finally:ledger.close()
        except (OSError,psutil.Error,ValueError):pass
    print(json.dumps(value,ensure_ascii=False))

if __name__=='__main__':main()
