"""Verify unchanged completed-run metadata, results and all checkpoint records."""
import hashlib
from .concept_index import root,read,run,filehash
from .build import readonly,dump
from .inputs import packed

def snapshot():
    folder=root();pop=read(folder/'population.json')
    if pop['state']!='population-complete':raise ValueError('Completed population required')
    db=readonly(folder/'concepts.sqlite3');proofs={}
    try:
        queries={
            'document_results':'SELECT * FROM document_results WHERE run_id=? ORDER BY document_id',
            'jobs':'SELECT j.* FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? ORDER BY j.id',
            'checkpoints':'SELECT c.* FROM checkpoints c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? ORDER BY c.job_id'}
        for name,sql in queries.items():
            h=hashlib.sha256();count=0
            for r in db.execute(sql,(pop['run_id'],)):
                h.update((packed(dict(r))+'\n').encode());count+=1
            proofs[name]={'rows':count,'sha256':h.hexdigest()}
        proofs['population']={'sha256':filehash(folder/'population.json'),'mtime_ns':(folder/'population.json').stat().st_mtime_ns}
        return {'run_id':pop['run_id'],'proofs':proofs}
    finally:db.close()

def main():
    before=snapshot();run(resume=True);after=snapshot()
    value={'run_id':before['run_id'],'unchanged':before==after,'before':before,'after':after,
        'scope':'Completed processor rerun; all selected document result/job/checkpoint records and population file hash/mtime unchanged. Source-location facts separately verified.'}
    dump(root()/'idempotence-verification.json',value);print(packed(value))
    if not value['unchanged']:raise ValueError('Completed rerun changed persisted results')

if __name__=='__main__':main()
