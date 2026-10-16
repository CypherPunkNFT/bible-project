"""Read-only receipt observation; never a dependency or takeover."""
import json,sqlite3
from pathlib import Path
from .inputs import lease_status
def main():
    import psutil
    for r in lease_status():
        p=psutil.Process(r['pid']);args=p.cmdline();out={'pid':r['pid'],'creation_token':r['process_token'],'live_token':r['live_identity'],'command':args,'io':dict(zip(p.io_counters()._fields,p.io_counters()))}
        if '--work' in args:
            root=Path(args[args.index('--work')+1]);path=root/'plan.json'
            if path.exists():
                plan=json.loads(path.read_text('utf-8'));out['plan_top_level']={k:({'count':len(v)} if isinstance(v,(list,dict)) else v) for k,v in plan.items()}
            jobpath=root/'jobs.sqlite3'
            if jobpath.exists():
                jobs=sqlite3.connect('file:'+jobpath.as_posix()+'?mode=ro',uri=True);out['existing_owner_job_states']=[{'state':s,'jobs':n} for s,n in jobs.execute('SELECT state,count(*) FROM jobs GROUP BY state')];jobs.close()
            path=root/'resource-samples.jsonl'
            if path.exists():
                with path.open('rb') as f:
                    f.seek(max(0,path.stat().st_size-12000));lines=f.read().splitlines()
                out['latest_resource_receipt']=json.loads(lines[-1]) if lines else None
        print(json.dumps(out,indent=2))
if __name__=='__main__':main()
