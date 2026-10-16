"""Compare committed facts, attempts and checkpoints across actual KR-120 resume."""
import argparse
import hashlib
from collections import defaultdict
from .build import readonly,dump
from .inputs import packed
from .concept_index import read
from .relationship_miner import root

def signature(db,run,docs):
    h=hashlib.sha256()
    # One population scan, rather than one scan for each sampled document.
    selected=defaultdict(list)
    marks=','.join('?' for _ in docs)
    for row in db.execute('SELECT * FROM postings WHERE run_id=? AND document_id IN ('+marks+') ORDER BY document_id,channel,feature,window_id',(run,*docs)):
        selected[row['document_id']].append(dict(row))
    for doc in docs:
        for r in db.execute('SELECT * FROM document_results WHERE run_id=? AND document_id=?',(run,doc)):h.update((packed(dict(r))+'\n').encode())
        for r in selected[doc]:h.update((packed(r)+'\n').encode())
        for r in db.execute('SELECT j.*,c.completed_at checkpoint_at,c.rows checkpoint_rows FROM jobs j JOIN run_jobs r ON r.job_id=j.id JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? AND r.scope=?',(run,'document:'+doc)):h.update((packed(dict(r))+'\n').encode())
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser();p.add_argument('--before',action='store_true');p.add_argument('--nonempty',action='store_true');a=p.parse_args();folder=root();db=readonly(folder/'relationships.sqlite3')
    try:
        if a.before:
            if (folder/'resume-before.json').exists():
                prior=read(folder/'resume-before.json');dump(folder/('resume-before-'+prior['run_id']+'-'+prior['signature'][:12]+'.json'),prior)
            if (folder/'resume-verification.json').exists():
                prior=read(folder/'resume-verification.json');dump(folder/('resume-verification-'+prior['run_id']+'-'+prior['before'][:12]+'.json'),prior)
            run=read(folder/'relationship-progress.json')['run_id'];docs=[r[0] for r in db.execute('SELECT document_id FROM document_results WHERE run_id=?'+(' AND fingerprints>0' if a.nonempty else '')+' ORDER BY document_id LIMIT 256',(run,))]
            if not docs:raise ValueError('Need committed documents')
            value={'run_id':run,'documents':docs,'signature':signature(db,run,docs)};dump(folder/'resume-before.json',value)
            print(packed({'run_id':run,'committed_documents':len(docs),'signature':value['signature']}))
        else:
            old=read(folder/'resume-before.json');now=signature(db,old['run_id'],old['documents']);ok=now==old['signature']
            dump(folder/'resume-verification.json',{'run_id':old['run_id'],'committed_documents':len(old['documents']),'before':old['signature'],'after':now,'ok':ok})
            print(packed({'ok':ok,'committed_documents':len(old['documents'])}))
            if not ok:raise ValueError('Committed facts/checkpoints changed')
    finally:db.close()

if __name__=='__main__':main()
