"""Verify committed joint-reference batches survive an actual same-run resume."""
import argparse
import hashlib
from .build import readonly,dump
from .concept_index import read
from .inputs import packed
from .relationship_miner import root

def signature(db,run,batches,windows):
    h=hashlib.sha256()
    for batch in batches:
        for row in db.execute('SELECT * FROM joint_batches WHERE run_id=? AND batch=?',(run,batch)):
            h.update((packed(dict(row))+'\n').encode())
        for row in db.execute('SELECT j.*,c.completed_at checkpoint_at,c.rows checkpoint_rows FROM jobs j JOIN run_jobs r ON r.job_id=j.id JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? AND r.scope=?',(run,'batch:'+str(batch))):
            h.update((packed(dict(row))+'\n').encode())
    for window in windows:
        for row in db.execute('SELECT * FROM joint_postings INDEXED BY joint_postings_window WHERE run_id=? AND window_id=? ORDER BY feature',(run,window)):
            h.update((packed(dict(row))+'\n').encode())
    return h.hexdigest()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--before',action='store_true');args=parser.parse_args()
    folder=root();db=readonly(folder/'relationships.sqlite3')
    try:
        if args.before:
            progress=read(folder/'joint-progress.json');run=progress['run_id']
            if progress['phase']!='interrupted':raise ValueError('Snapshot requires deliberate checkpoint stop')
            batches=[r[0] for r in db.execute('SELECT batch FROM joint_batches WHERE run_id=? ORDER BY batch',(run,))]
            windows=[r[0] for r in db.execute('SELECT DISTINCT window_id FROM joint_postings WHERE run_id=? ORDER BY window_id',(run,))]
            if not batches or not windows:raise ValueError('Nonempty committed batches required')
            value={'run_id':run,'batches':batches,'windows':windows,'signature':signature(db,run,batches,windows)}
            dump(folder/'joint-resume-before.json',value)
            print(packed({'run_id':run,'committed_batches':len(batches),'posting_windows':len(windows),'signature':value['signature']}))
        else:
            old=read(folder/'joint-resume-before.json');now=signature(db,old['run_id'],old['batches'],old['windows'])
            value={'run_id':old['run_id'],'committed_batches':len(old['batches']),'posting_windows':len(old['windows']),'before':old['signature'],'after':now,'ok':now==old['signature']}
            dump(folder/'joint-resume-verification.json',value);print(packed(value))
            if not value['ok']:raise ValueError('Committed joint facts/checkpoints changed')
    finally:db.close()

if __name__=='__main__':main()
