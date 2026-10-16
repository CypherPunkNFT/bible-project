"""Read-only witnesses for real same-generation checkpoint reuse."""
import argparse
import hashlib
from .build import readonly,dump
from .concept_index import root,read
from .inputs import packed

def snapshot(db,run,ids):
    marks=','.join('?' for _ in ids);h=hashlib.sha256()
    for table in ('document_results','windows'):
        for row in db.execute('SELECT * FROM '+table+' WHERE run_id=? AND document_id IN ('+marks+') ORDER BY document_id,rowid',[run,*ids]):
            h.update((packed(dict(row))+'\n').encode())
    jobs=[dict(r) for r in db.execute('SELECT j.id,j.state,j.attempts,c.completed_at,c.rows FROM jobs j JOIN run_jobs r ON r.job_id=j.id JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? AND r.scope IN ('+marks+') ORDER BY j.id',[run,*ids])]
    return {'facts_sha256':h.hexdigest(),'jobs':jobs}

def main(after=False):
    db=readonly(root()/'concepts.sqlite3');path=root()/'resume-check-current.json'
    try:
        if not after:
            run=db.execute("SELECT id FROM concept_runs WHERE state='interrupted' ORDER BY rowid DESC LIMIT 1").fetchone()[0]
            ids=sorted({r[0] for order in ('ASC','DESC') for r in db.execute('SELECT document_id FROM document_results WHERE run_id=? ORDER BY document_id '+order+' LIMIT 128',(run,))})
            value={'run_id':run,'document_ids':ids,**snapshot(db,run,ids)};dump(path,value)
            folder=root()/'verifications'/run;folder.mkdir(parents=True,exist_ok=True);dump(folder/'resume-before.json',value)
            print(packed({'run_id':run,'documents':len(ids),'facts_sha256':value['facts_sha256']}))
        else:
            old=read(path);new=snapshot(db,old['run_id'],old['document_ids'])
            value={'run_id':old['run_id'],'documents':len(old['document_ids']),
                'facts_unchanged':new['facts_sha256']==old['facts_sha256'],'checkpoints_and_attempts_unchanged':new['jobs']==old['jobs'],
                'scope':'stable first/last committed document samples across a real orderly interruption/resume; crash rollback separately covered by JobStore integration tests'}
            dump(root()/'verifications'/old['run_id']/'resume-verification.json',value)
            dump(root()/'resume-verification.json',value);print(packed(value))
            if not all(value[k] for k in ('facts_unchanged','checkpoints_and_attempts_unchanged')):raise ValueError('Resume changed completed jobs')
    finally:db.close()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--after',action='store_true');main(p.parse_args().after)
