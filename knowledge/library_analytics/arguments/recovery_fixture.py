"""Disposable real process-death fixture for the shared atomic job interface."""
import argparse,os,json,subprocess,sys,tempfile
from pathlib import Path
from .inputs import ROOT,write_json
from ..jobs import JobStore

def child(path):
    s=JobStore(path);s.acquire();s.db.execute('CREATE TABLE IF NOT EXISTS facts(id TEXT PRIMARY KEY,value TEXT)')
    s.register('fixture','committed','arguments','first','fp1','fixture-v1')
    s.execute('committed',lambda db:(db.execute("INSERT INTO facts VALUES('first','kept')"),1)[1])
    s.register('fixture','interrupted','arguments','second','fp2','fixture-v1')
    def interrupted(db):
        db.execute("INSERT INTO facts VALUES('partial','must roll back')")
        os._exit(23)
    s.execute('interrupted',interrupted)

def verify():
    folder=ROOT/'tests';folder.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=folder) as tmp:
        p=Path(tmp)/'crash.sqlite3'
        child_result=subprocess.run([sys.executable,'-X','utf8','-m',__spec__.name,'--child',str(p)],creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),capture_output=True,text=True)
        if child_result.returncode!=23:raise RuntimeError('Crash fixture child did not reach atomic write: '+child_result.stderr)
        s=JobStore(p);before=[tuple(r) for r in s.db.execute('SELECT * FROM facts')];s.acquire()
        if before!=[('first','kept')]:raise ValueError('Uncommitted facts survived crash')
        def finish(db):db.execute("INSERT INTO facts VALUES('second','resumed')");return 1
        result=s.execute('interrupted',finish);rerun=s.execute('interrupted',finish)
        attempts=[dict(r) for r in s.db.execute('SELECT * FROM job_attempts ORDER BY id')]
        facts=[tuple(r) for r in s.db.execute('SELECT * FROM facts ORDER BY id')]
        checkpoints=[dict(r) for r in s.db.execute('SELECT * FROM checkpoints ORDER BY job_id')]
        if result!='completed' or rerun!='skipped' or facts!=[('first','kept'),('second','resumed')]:raise ValueError('Actual resume/idempotence failure')
        s.close()
        receipt={'actual_child_exit_code':23,'facts_before_recovery':before,'facts_after_recovery':facts,'attempts':attempts,'checkpoints':checkpoints,'resumed':result,'repeat':rerun,'proof_scope':'Disposable real process death through existing JobStore; population proof recorded separately.','global_lease_bypassed':False,'isolated_small_fixture':True}
        write_json(ROOT/'tests/process-death-recovery.json',receipt);print(json.dumps(receipt,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--child');a=p.parse_args();child(a.child) if a.child else verify()
