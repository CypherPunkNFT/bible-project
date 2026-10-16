"""Joint-reference signatures derived from a completed KR-120 posting generation."""
from collections import Counter
from itertools import groupby,combinations,islice
import argparse
import json
import os
import time
from pathlib import Path
from .relationship_miner import root,Inputs
from .concept_index import read,filehash
from .inputs import packed,digest
from .build import PROJECT,dump
from .jobs import JobStore,background_priority,process_identity

VERSION='kr120-joint-references-v1'
CONFIG={'max_ranges_per_window':12,'max_postings_per_joint_feature':32,'max_windows_per_group':2,
        'ranges':'Distinct exact canonical ranges, selected by retained located witness start; overlapping ranges remain distinct and require review',
        'meaning':'Joint reference association, not shared interpretation or agreement','semantic':False,
        'operational':{'cache_mib':8192,'wal_checkpoint_pages':262144,'windows_per_atomic_batch':1024}}
SCHEMA='''
CREATE INDEX IF NOT EXISTS relationship_dependencies_reverse ON dependencies(run_id,kind,key,document_id);
CREATE INDEX IF NOT EXISTS postings_reference_scan ON postings(run_id,window_id,feature,start,end,independence_group) WHERE channel='reference';
CREATE TABLE IF NOT EXISTS joint_runs(id TEXT PRIMARY KEY,parent_run TEXT,state TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS joint_postings(run_id TEXT,bucket INTEGER,feature TEXT,window_id INTEGER,independence_group TEXT,PRIMARY KEY(run_id,feature,window_id));
CREATE INDEX IF NOT EXISTS joint_postings_bucket ON joint_postings(run_id,bucket,feature,window_id,independence_group);
CREATE INDEX IF NOT EXISTS joint_postings_window ON joint_postings(run_id,window_id);
CREATE TABLE IF NOT EXISTS joint_features(run_id TEXT,feature TEXT,postings INTEGER,groups_count INTEGER,disposition TEXT,PRIMARY KEY(run_id,feature));
CREATE TABLE IF NOT EXISTS joint_pairs(run_id TEXT,left_window INTEGER,right_window INTEGER,feature TEXT,PRIMARY KEY(run_id,left_window,right_window,feature));
CREATE INDEX IF NOT EXISTS joint_pairs_right ON joint_pairs(run_id,right_window);
CREATE TABLE IF NOT EXISTS joint_batches(run_id TEXT,batch INTEGER,windows INTEGER,truncated_windows INTEGER,postings INTEGER,PRIMARY KEY(run_id,batch));
CREATE TABLE IF NOT EXISTS joint_buckets(run_id TEXT,bucket INTEGER,features INTEGER,pairs INTEGER,frequent_deferred INTEGER,PRIMARY KEY(run_id,bucket));
'''

def write_batch(db,run,batch,windows):
    count=truncated=0
    for wid,refs in windows:
        refs=sorted(refs,key=lambda r:(r['start'],r['end'],r['feature']))
        truncated+=len(refs)>CONFIG['max_ranges_per_window'];refs=refs[:CONFIG['max_ranges_per_window']]
        for a,b in combinations(refs,2):
            feature=packed(sorted([a['feature'],b['feature']]))
            db.execute('INSERT INTO joint_postings VALUES(?,?,?,?,?)',(run,int(digest(feature)[:2],16),feature,wid,a['independence_group']));count+=1
    db.execute('INSERT INTO joint_batches VALUES(?,?,?,?,?)',(run,batch,len(windows),truncated,count));return count

def write_bucket(db,run,bucket):
    count=pairs=frequent=0
    stream=db.execute('SELECT * FROM joint_postings INDEXED BY joint_postings_bucket WHERE run_id=? AND bucket=? ORDER BY feature,window_id',(run,bucket))
    for feature,rows in groupby(stream,key=lambda r:r['feature']):
        n=0;groups=set();held=[]
        for r in rows:
            n+=1;groups.add(r['independence_group'])
            if len(held)<=CONFIG['max_postings_per_joint_feature']:held.append(dict(r))
        state='frequent-joint-feature-deferred' if n>CONFIG['max_postings_per_joint_feature'] else 'single-independence-group' if len(groups)<2 else 'bounded-joint-candidate'
        db.execute('INSERT INTO joint_features VALUES(?,?,?,?,?)',(run,feature,n,len(groups),state));count+=1
        if state=='frequent-joint-feature-deferred':frequent+=1
        if state!='bounded-joint-candidate':continue
        chosen=[];counts=Counter()
        for r in sorted(held,key=lambda r:(r['independence_group'],r['window_id'])):
            if counts[r['independence_group']]>=CONFIG['max_windows_per_group']:continue
            counts[r['independence_group']]+=1;chosen.append(r)
        for a,b in combinations(chosen,2):
            if a['independence_group']==b['independence_group']:continue
            left,right=sorted([a['window_id'],b['window_id']]);db.execute('INSERT INTO joint_pairs VALUES(?,?,?,?)',(run,left,right,feature));pairs+=1
    db.execute('INSERT INTO joint_buckets VALUES(?,?,?,?,?)',(run,bucket,count,pairs,frequent));return pairs

def counts(db,run):
    result=dict(db.execute('SELECT count(*) batches,coalesce(sum(windows),0) windows,coalesce(sum(truncated_windows),0) truncated_windows,coalesce(sum(postings),0) postings FROM joint_batches WHERE run_id=?',(run,)).fetchone())
    result.update(dict(db.execute('SELECT count(*) buckets,coalesce(sum(features),0) features,coalesce(sum(pairs),0) pairs,coalesce(sum(frequent_deferred),0) frequent_deferred FROM joint_buckets WHERE run_id=?',(run,)).fetchone()));return result

def run(resume=False,limit=None,calibration=False):
    background_priority();folder=root();parent=read(folder/'population.json')
    if parent['state']!='population-complete':raise ValueError('Completed parent posting generation required')
    inputs=Inputs();inputs.check()
    if inputs.contract!={k:v for k,v in parent['contract'].items() if k!='calibration'}:raise ValueError('Parent dependencies changed')
    oracle=read(folder/'cocitation-known-pairs-frozen.json')
    calibration_windows=sorted({p[k] for p in oracle['pairs'] if p['split']=='development' for k in ('left_window','right_window')})
    contract={'processor':VERSION,'config':CONFIG,'code_sha256':filehash(__file__),'parent_run':parent['run_id'],'parent_summary_sha256':filehash(folder/'population.json'),'parent_contract':parent['contract'],
        'calibration':calibration,'development_calibration_windows':calibration_windows,'calibration_oracle_sha256':filehash(folder/'cocitation-known-pairs-frozen.json')}
    run='kr120-joint-'+digest(contract)[:24];shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');store=None;started=time.monotonic()
    try:
        shared.acquire();store=JobStore(folder/'relationships.sqlite3');store.acquire();db=store.db
        db.execute('PRAGMA cache_size=-'+str(CONFIG['operational']['cache_mib']*1024));db.execute('PRAGMA temp_store=MEMORY')
        db.execute('PRAGMA wal_autocheckpoint='+str(CONFIG['operational']['wal_checkpoint_pages']));db.executescript(SCHEMA)
        if not calibration:
            cal='kr120-joint-'+digest({**contract,'calibration':True})[:24]
            ready=db.execute('SELECT state FROM joint_runs WHERE id=?',(cal,)).fetchone()
            if not ready or ready[0]!='complete':raise ValueError('Matching joint-reference development calibration required')
        old=db.execute('SELECT state FROM joint_runs WHERE id=?',(run,)).fetchone()
        if old and old[0]=='complete':print(packed({'run_id':run,'unchanged':True}));return
        if old and not resume:raise ValueError('Existing joint run requires --resume')
        with db:db.execute('INSERT OR IGNORE INTO joint_runs VALUES(?,?,?,?,NULL)',(run,parent['run_id'],'running',packed(contract)))
        def job(scope,writer):
            ident=digest([run,scope]);store.register(run,ident,'joint-reference',scope,ident,VERSION)
            state=store.execute(ident,writer)
            if state in ('failed','stale'):raise ValueError('Joint-reference job failed: '+scope)
        def progress(phase):
            receipt={'run_id':run,'parent_run':parent['run_id'],'phase':phase,'pid':os.getpid(),'process_token':process_identity(os.getpid()),'seconds':time.monotonic()-started,**counts(db,run)}
            dump(folder/'joint-progress.json',receipt);print(packed(receipt),flush=True);shared.heartbeat()
        # The read cursor sees only the immutable parent postings; all new writes
        # belong to separate dependency-bound joint tables/run IDs.
        where=' AND window_id IN ('+','.join('?' for _ in calibration_windows)+')' if calibration else ''
        args=(parent['run_id'],*calibration_windows) if calibration else (parent['run_id'],)
        stream=db.execute("SELECT window_id,feature,start,end,independence_group FROM postings INDEXED BY postings_reference_scan WHERE run_id=? AND channel='reference'"+where+' ORDER BY window_id',args)
        windows=((wid,[dict(r) for r in rows]) for wid,rows in groupby(stream,key=lambda r:r['window_id']))
        batch=0
        while True:
            rows=list(islice(windows,CONFIG['operational']['windows_per_atomic_batch']))
            if not rows:break
            job('batch:'+str(batch),lambda db,rows=rows,batch=batch:write_batch(db,run,batch,rows));batch+=1
            if batch%16==0:progress('joint-postings')
            if limit and batch>=limit:progress('interrupted');return
        for bucket in range(256):
            job('bucket:'+str(bucket),lambda db,bucket=bucket:write_bucket(db,run,bucket))
            if bucket%16==0:progress('joint-pairs')
        inputs.check();value={'run_id':run,'parent_run':parent['run_id'],'state':'complete','contract':contract,'counts':counts(db,run),'seconds_this_attempt':time.monotonic()-started}
        with db:db.execute('UPDATE joint_runs SET state=?,summary_json=? WHERE id=?',('complete',packed(value),run))
        dump(folder/('joint-calibration.json' if calibration else 'joint-population.json'),value);dump(folder/'joint-progress.json',value);print(packed(value),flush=True)
    finally:
        inputs.close()
        if store:store.close()
        shared.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--resume',action='store_true');p.add_argument('--limit-batches',type=int);p.add_argument('--calibrate',action='store_true');a=p.parse_args();run(a.resume,a.limit_batches,a.calibrate)
