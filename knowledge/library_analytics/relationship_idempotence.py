"""Actual complete-generation rerun proof; all jobs/checkpoints stay unchanged."""
import hashlib
from .build import readonly,dump
from .concept_index import read,filehash
from .relationship_miner import root,run
from .relationship_cocitations import run as run_joint
from .inputs import packed

def snapshot():
    folder=root();summary=read(folder/'population.json');rid=summary['run_id'];db=readonly(folder/'relationships.sqlite3');h=hashlib.sha256();counts={}
    try:
        queries={'jobs':'SELECT j.*,c.completed_at cp_time,c.rows cp_rows FROM jobs j JOIN run_jobs r ON r.job_id=j.id JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? ORDER BY j.id',
            'documents':'SELECT * FROM document_results WHERE run_id=? ORDER BY document_id',
            'buckets':'SELECT * FROM bucket_results WHERE run_id=? ORDER BY bucket'}
        for name,sql in queries.items():
            counts[name]=0
            for row in db.execute(sql,(rid,)):h.update((packed(dict(row))+'\n').encode());counts[name]+=1
        joint=read(folder/'joint-population.json')
        for name,sql in {'joint_jobs':queries['jobs'],'joint_batches':'SELECT * FROM joint_batches WHERE run_id=? ORDER BY batch','joint_buckets':'SELECT * FROM joint_buckets WHERE run_id=? ORDER BY bucket'}.items():
            counts[name]=0
            for row in db.execute(sql,(joint['run_id'],)):h.update((packed(dict(row))+'\n').encode());counts[name]+=1
        return {'run_id':rid,'joint_run_id':joint['run_id'],'counts':counts,'signature':h.hexdigest(),'summary_sha256':filehash(folder/'population.json'),'summary_mtime_ns':(folder/'population.json').stat().st_mtime_ns,'joint_summary_sha256':filehash(folder/'joint-population.json'),'joint_summary_mtime_ns':(folder/'joint-population.json').stat().st_mtime_ns}
    finally:db.close()

def main():
    before=snapshot();run(resume=True);run_joint(resume=True);after=snapshot();ok=before==after
    dump(root()/'idempotence-verification.json',{'run_id':before['run_id'],'joint_run_id':before['joint_run_id'],'ok':ok,'before':before,'after':after,'scope':'All selected jobs/checkpoints/document results/bucket results and population summary bytes/mtime; coordinator lease activity excluded'})
    print(packed({'ok':ok,**after}))
    if not ok:raise ValueError('Completed generation changed')

if __name__=='__main__':main()
