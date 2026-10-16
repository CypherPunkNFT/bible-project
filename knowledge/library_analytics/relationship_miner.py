"""Dependency-bound KR-120 lexical relationship population processor."""
import argparse
from collections import Counter,defaultdict
import hashlib
from itertools import groupby,combinations
import json
import os
from pathlib import Path
import time
from .build import PROJECT,readonly,dump
from .inputs import packed,digest
from .jobs import JobStore,StaleInput,background_priority,process_identity
from .concept_index import read,filehash
from .section_contract import resolve_segment,text_hash
from .relationship_contract import VERSION,CONFIG,SCHEMA,fingerprints

def root():return Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research/relationships'

class Inputs:
    def __init__(self):
        base=root().parent;self.pointer=read(base/'concepts/latest-concepts.json');self.summary=read(self.pointer['summary'])
        manifest=read(Path(self.pointer['release'])/'release_manifest.json')
        proof=next(x for x in manifest['files'] if x['path']=='summary.json')
        if self.summary['run_id']!=self.pointer['run_id'] or filehash(self.pointer['summary'])!=proof['sha256']:raise StaleInput('Parent release mismatch')
        if not self.pointer['capabilities']['located-lexical-reference-candidates']:raise StaleInput('Located candidate parent required')
        self.run=self.pointer['run_id'];self.db=readonly(Path(self.pointer['database']))
        self.parents=self.summary['contract']['parents'];self.sections=readonly(Path(self.parents[0]['database']))
        for db in (self.db,self.sections):
            db.execute('PRAGMA cache_size=-131072');db.execute('PRAGMA mmap_size=4294967296')
        self.prepared={}
        evaluation={'version':'kr120-evaluation-v1','reviewer_type':'model-assisted implementation agent; no human or independent reviewer',
            'splits':'Separate from the already-used KR-110 and LK question splits; deterministic known-pair split and reserved population-pair samples; no reserved tuning',
            'known_pair_oracle':'Independent FTS phrase lookup plus source reconstruction and normalized-token equality; report recall only on discovered frozen known pairs, not exhaustive corpus recall',
            'sample':'Up to 24 wording pairs and 24 co-citation pairs selected deterministically across feature-count and language strata; both full located contexts reviewed',
            'wording_rubric':'Both endpoints reconstruct; matching substantive wording is actually present; distinguish Bible/common formula, same-work edition duplication, editorial boilerplate and distinct-work reuse candidates; no influence or direction without independent evidence',
            'cocitation_rubric':'At least two distinct canonical reference ranges occur in both source windows; review whether the references support a useful shared subject rather than index/apparatus coincidence',
            'promotion':'Structurally verified candidate index only; no author-attributed quotation/influence or semantic capability promotion from lexical equality',
            'quality_reporting':'Raw paired-witness correctness, useful candidate precision, known-pair recall, failures and all bounds/deferrals; synthetic fixtures reported separately'}
        frozen=root()/'evaluation-frozen.json'
        if frozen.exists() and read(frozen)!=evaluation:raise StaleInput('Evaluation freeze changed')
        if not frozen.exists():dump(frozen,evaluation)
        self.contract={'processor':VERSION,'config':CONFIG,'parent':self.pointer,
            'parent_summary_sha256':proof['sha256'],'parent_manifest_sha256':filehash(Path(self.pointer['release'])/'release_manifest.json'),
            'code':{p.name:filehash(p) for p in [Path(__file__),Path(__file__).with_name('relationship_contract.py'),Path(__file__).with_name('section_contract.py')]},
            'source_parent_hashes':self.summary['contract']['parent_summary_hashes'],'evaluation_sha256':filehash(frozen),
            'cross_generation_selective_refresh':'not implemented or claimed; changed inputs create a full new generation',
            'backup_restore':'not tested','public_output':False}
    def check(self):
        if filehash(self.pointer['summary'])!=self.contract['parent_summary_sha256']:raise StaleInput('Changed parent summary')
        if filehash(Path(self.pointer['release'])/'release_manifest.json')!=self.contract['parent_manifest_sha256']:raise StaleInput('Changed parent manifest')
        for p,h in zip(self.parents,self.contract['source_parent_hashes']):
            if filehash(p['summary'])!=h:raise StaleInput('Changed source parent')
        for row in self.sections.execute('SELECT path,size,mtime_ns FROM research_inputs WHERE run_id=?',(self.parents[0]['run_id'],)):
            p=Path(row['path'])
            if not p.exists() or (p.stat().st_size,p.stat().st_mtime_ns)!=(row['size'],row['mtime_ns']):raise StaleInput('Changed source '+str(p))
    def close(self):self.db.close();self.sections.close()

def capture(inputs,db,run,calibration):
    strata=Counter();n=0
    for r in inputs.db.execute('SELECT * FROM documents WHERE run_id=? ORDER BY document_id',(inputs.run,)):
        d=json.loads(r['descriptor_json']);disp=r['disposition']
        key=(r['language'],bool(d.get('xml_link')),Path(d.get('source_path') or '').suffix,d.get('source_family'))
        if calibration and disp=='supported':
            strata[key]+=1
            if strata[key]>2:disp='outside-calibration'
        db.execute('INSERT INTO scope VALUES(?,?,?,?,?,?,?,?,?)',(run,r['document_id'],disp,r['language'],r['work_id'],r['edition_id'],r['independence_group'],r['descriptor_json'],r['fingerprint']));n+=1
    for r in inputs.db.execute('SELECT * FROM dependencies WHERE run_id=?',(inputs.run,)):
        db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(run,r['document_id'],r['kind'],r['key'],r['fingerprint'],r['details_json']))
    return n

def process_document(inputs,db,run,row):
    started=time.monotonic();doc=row['document_id'];counts=Counter();bodies={}
    windows=inputs.db.execute('SELECT * FROM windows WHERE run_id=? AND document_id=? ORDER BY id',(inputs.run,doc)).fetchall()
    refs=defaultdict(list)
    for ref in inputs.db.execute('SELECT r.* FROM windows w CROSS JOIN reference_occurrences r INDEXED BY reference_window ON r.window_id=w.id WHERE w.run_id=? AND w.document_id=?',(inputs.run,doc)):
        refs[ref['window_id']].append(ref)
    for w in windows:
        if w['state']=='candidate-unreviewed' or w['kind']=='document-representation':counts['deferred']+=1;continue
        counts['native']+=1;key=(w['version_id'],w['segment_ordinal'])
        if key not in bodies:
            span=dict(inputs.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',key).fetchone())
            bodies[key]=(span,resolve_segment(span,inputs.prepared))
        span,body=bodies[key];a,b=w['start']-span['start'],w['end']-span['start'];text=body[a:b]
        if not 0<=a<b<=len(body) or text_hash(text)!=w['text_sha256']:raise StaleInput('Changed window '+str(w['id']))
        hits=fingerprints(text,CONFIG['tokens_per_shingle'],CONFIG['winnow_span'])
        if not hits:counts['short']+=1
        posts=[(run,'wording',int(h[:2],16),h,w['id'],doc,row['independence_group'],start+w['start'],end+w['start'],sha,None) for h,start,end,sha in hits]
        seen=set()
        for r in refs[w['id']]:
            feature=packed([r['book'],r['first'],r['last']])
            if feature in seen:continue
            seen.add(feature)
            ra,rb=r['start']-w['start'],r['end']-w['start']
            if not 0<=ra<rb<=len(text) or text[ra:rb]!=r['literal']:raise StaleInput('Reference witness changed')
            posts.append((run,'reference',int(hashlib.sha256(feature.encode()).hexdigest()[:2],16),feature,w['id'],doc,row['independence_group'],r['start'],r['end'],text_hash(r['literal']),r['id']))
        db.executemany('INSERT INTO postings VALUES(?,?,?,?,?,?,?,?,?,?,?)',posts)
        counts['fingerprints']+=len(hits);counts['references']+=len(seen)
    db.execute('INSERT INTO document_results VALUES(?,?,?,?,?,?,?,?)',(run,doc,counts['native'],counts['deferred'],counts['short'],counts['fingerprints'],counts['references'],time.monotonic()-started))
    return counts['fingerprints']+counts['references']

def build_bucket(db,run,bucket):
    started=time.monotonic();features=evidence=frequent=0
    cursor=db.execute('SELECT * FROM postings INDEXED BY postings_bucket WHERE run_id=? AND bucket=? ORDER BY channel,feature',(run,bucket))
    for (channel,feature),iterator in groupby(cursor,key=lambda r:(r['channel'],r['feature'])):
        # Keep bounded representatives while counting every posting; no all-pairs population scan.
        size=0;groups=set();held=[]
        for r in iterator:
            size+=1;groups.add(r['independence_group'])
            if len(held)<=CONFIG['max_postings_per_feature']:held.append(dict(r))
        features+=1
        if size>CONFIG['max_postings_per_feature']:state='frequent-feature-deferred';frequent+=1
        elif len(groups)<2:state='single-independence-group'
        else:state='bounded-candidate-feature'
        db.execute('INSERT INTO feature_stats VALUES(?,?,?,?,?,?)',(run,channel,feature,size,len(groups),state))
        if state!='bounded-candidate-feature':continue
        chosen=[];counts=Counter()
        for r in sorted(held,key=lambda r:(r['independence_group'],r['window_id'])):
            if counts[r['independence_group']]>=CONFIG['max_windows_per_group']:continue
            counts[r['independence_group']]+=1;chosen.append(r)
        for a,b in combinations(chosen,2):
            if a['independence_group']==b['independence_group']:continue
            if a['window_id']>b['window_id']:a,b=b,a
            db.execute('INSERT OR IGNORE INTO pair_evidence VALUES(?,?,?,?,?,?,?,?,?,?,?)',(run,a['window_id'],b['window_id'],channel,feature,a['start'],a['end'],b['start'],b['end'],a['witness_hash'],b['witness_hash']));evidence+=1
    db.execute('INSERT INTO bucket_results VALUES(?,?,?,?,?,?)',(run,bucket,features,evidence,frequent,time.monotonic()-started))
    return evidence

def status(db,run):
    result=dict(db.execute('SELECT count(*) processed_documents,coalesce(sum(native_windows),0) native_windows,coalesce(sum(deferred_windows),0) deferred_windows,coalesce(sum(short_windows),0) short_windows,coalesce(sum(fingerprints),0) fingerprints,coalesce(sum(references_count),0) references_count FROM document_results WHERE run_id=?',(run,)).fetchone())
    result.update(dict(db.execute('SELECT count(*) completed_buckets,coalesce(sum(features),0) feature_keys,coalesce(sum(evidence),0) pair_evidence,coalesce(sum(frequent_deferred),0) frequent_features_deferred FROM bucket_results WHERE run_id=?',(run,)).fetchone()))
    result['jobs']=[dict(r) for r in db.execute('SELECT j.state,count(*) n FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(run,))]
    return result

def run(calibration=False,resume=False,limit=None):
    background_priority();folder=root();folder.mkdir(exist_ok=True);started=time.monotonic();inputs=None;store=None
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        shared.acquire();store=JobStore(folder/'relationships.sqlite3');store.acquire();db=store.db;db.executescript(SCHEMA)
        db.execute('PRAGMA cache_size=-262144');db.execute('PRAGMA temp_store=MEMORY')
        inputs=Inputs();inputs.check();contract={**inputs.contract,'calibration':calibration};rid='kr120-'+digest(contract)[:24]+('-calibration' if calibration else '')
        old=db.execute('SELECT state FROM relationship_runs WHERE id=?',(rid,)).fetchone()
        if old and old[0]=='population-complete':print(packed({'run_id':rid,'unchanged':True}));return
        if old and not resume:raise ValueError('Existing generation requires --resume')
        if not calibration:
            cal='kr120-'+digest({**contract,'calibration':True})[:24]+'-calibration'
            ready=db.execute('SELECT state FROM relationship_runs WHERE id=?',(cal,)).fetchone()
            if not ready or ready[0]!='population-complete':raise ValueError('Matching completed calibration required')
        with db:db.execute('INSERT OR IGNORE INTO relationship_runs VALUES(?,?,?,NULL)',(rid,'running',packed(contract)))
        def job(scope,writer):
            ident=digest({'run':rid,'scope':scope});store.register(rid,ident,'relationship',scope,ident,VERSION)
            result=store.execute(ident,writer)
            if result in ('failed','stale'):raise RuntimeError(packed(dict(db.execute('SELECT * FROM jobs WHERE id=?',(ident,)).fetchone())))
            return result
        job('capture',lambda db:capture(inputs,db,rid,calibration))
        rows=db.execute("SELECT * FROM scope WHERE run_id=? AND disposition='supported' ORDER BY coalesce(json_extract(descriptor_json,'$.xml_link.asset_path'),document_id),document_id",(rid,)).fetchall()
        complete={r[0] for r in db.execute('SELECT document_id FROM document_results WHERE run_id=?',(rid,))}
        processed=0
        def progress(phase,visited):
            receipt={'run_id':rid,'phase':phase,'pid':os.getpid(),'process_token':process_identity(os.getpid()),'visited':visited,'expected_documents':len(rows),'seconds_this_attempt':time.monotonic()-started,**status(db,rid)}
            dump(folder/'relationship-progress.json',receipt);print(packed(receipt),flush=True);shared.heartbeat()
        progress('documents',len(complete))
        for i,row in enumerate(rows):
            if row['document_id'] in complete:continue
            job('document:'+row['document_id'],lambda db,row=row:process_document(inputs,db,rid,row));processed+=1
            if processed%128==0:progress('documents',i+1)
            if (limit and processed>=limit) or (folder/'cancel.request').exists():
                with db:db.execute("UPDATE relationship_runs SET state='interrupted' WHERE id=?",(rid,))
                progress('interrupted',i+1);return
        for bucket in range(256):
            job('bucket:'+str(bucket),lambda db,bucket=bucket:build_bucket(db,rid,bucket))
            if bucket%8==0:progress('pairs',bucket+1)
            if (folder/'cancel.request').exists():progress('interrupted-pairs',bucket+1);return
        inputs.check();counts=status(db,rid);integrity=db.execute('PRAGMA quick_check').fetchone()[0]
        ok=counts['processed_documents']==len(rows) and counts['completed_buckets']==256 and integrity=='ok'
        summary={'run_id':rid,'state':'population-complete' if ok else 'needs-attention','contract':contract,'counts':counts,'sqlite_quick_check':integrity,'seconds_this_attempt':time.monotonic()-started,'database':str(store.path),'scope':[dict(r) for r in db.execute('SELECT disposition,count(*) documents FROM scope WHERE run_id=? GROUP BY disposition',(rid,))],'quality':'pending separate evidence review; no interpreted-relationship promotion'}
        with db:db.execute('UPDATE relationship_runs SET state=?,summary_json=? WHERE id=?',(summary['state'],packed(summary),rid))
        dump(folder/('calibration.json' if calibration else 'population.json'),summary);dump(folder/'relationship-progress.json',summary);print(packed(summary),flush=True)
    finally:
        if inputs:inputs.close()
        if store:store.close()
        shared.close()

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--calibrate',action='store_true');p.add_argument('--run',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--status',action='store_true');a=p.parse_args()
    if a.status:print((root()/'relationship-progress.json').read_text('utf-8'))
    elif a.run or a.calibrate:run(a.calibrate,a.resume,a.limit)
    else:p.error('Select --run, --calibrate or --status')

if __name__=='__main__':main()
