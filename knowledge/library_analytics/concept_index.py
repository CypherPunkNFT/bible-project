"""Reusable CPU concept index on pinned KR-101/102 sections; no upstream writers."""
import argparse
from collections import Counter,defaultdict
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import time

from .build import PROJECT,readonly,dump,now
from .inputs import digest,packed
from .jobs import JobStore,StaleInput,background_priority,process_identity
from .section_contract import resolve_segment,text_hash
from .concept_contract import VERSION,WINDOW,SCHEMA,ruleset,evaluation_contract
from .concept_matcher_fast import FastMatcher as Matcher
from .normalize import language
from .references import ReferenceScanner
from ..enrichment.citations import CitationParser

def root(project=PROJECT): return Path(project)/'KnowledgeBase/library-knowledge/connected-research/concepts'
def read(p): return json.loads(Path(p).read_text('utf-8-sig'))
def fts_name(run):
    if not re.fullmatch(r'kr110-[a-f0-9]{24}(?:-calibration)?',run):raise ValueError('Invalid generation')
    return 'fts_'+run.replace('-','_')
def filehash(p):
    h=hashlib.sha256()
    with Path(p).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def freeze(project=PROJECT):
    folder=root(project);folder.mkdir(parents=True,exist_ok=True)
    value=evaluation_contract();p=folder/'evaluation-frozen.json'
    if p.exists() and read(p)!=value: raise StaleInput('Evaluation freeze changed')
    if not p.exists(): dump(p,value)
    return filehash(p)

class Inputs:
    def __init__(self,project=PROJECT):
        self.project=Path(project); base=root(project).parent
        self.pointers=[read(base/'latest-sections.json'),read(base/'alignment/latest-alignment.json')]
        self.summaries=[read(p['summary']) for p in self.pointers]
        for p,s in zip(self.pointers,self.summaries):
            if s['state']!='complete' or s['run_id']!=p['run_id']: raise StaleInput('Incomplete/mismatched parent')
            manifest=read(Path(p['release'])/'release_manifest.json')
            proof=next(f for f in manifest['files'] if f.get('name',f.get('path'))=='summary.json')
            if proof['sha256']!=filehash(p['summary']): raise StaleInput('Parent summary hash mismatch')
        self.srun,self.arun=[p['run_id'] for p in self.pointers]
        if self.summaries[1]['contract']['section_run']!=self.srun: raise StaleInput('Incompatible parent releases')
        self.sections=readonly(Path(self.pointers[0]['database']))
        self.alignment=readonly(Path(self.pointers[1]['database']))
        self.rules=ruleset(project); self.matcher=Matcher(self.rules['rules'])
        parent=self.summaries[0]['contract']['text_bundle']
        db=readonly(Path(parent['database']))
        try: parser=read_json_column(db,'SELECT parser_json FROM text_runs WHERE id=?',(parent['run_ids'][0],))
        finally: db.close()
        self.parser_config=parser
        self.scanner=ReferenceScanner(CitationParser(parser['books'],{(b,c):v for b,c,v in parser['bounds']}))
        code={p.name:filehash(p) for p in [Path(__file__),Path(__file__).with_name('concept_contract.py'),
            Path(__file__).with_name('references.py'),Path(__file__).with_name('section_contract.py'),Path(__file__).with_name('concept_matcher_fast.py'),
            Path(__file__).parent.parent/'enrichment/citations.py',Path(__file__).with_name('normalize.py')]}
        self.contract={'processor':VERSION,'code':code,'parents':self.pointers,
            'parent_summary_hashes':[filehash(p['summary']) for p in self.pointers],
            'rules_sha256':digest(self.rules),'parser_sha256':digest(parser),'evaluation_sha256':freeze(project),
            'window_codepoints':WINDOW,'scope':'All supported KR-101 documents and their verified source representations; explicit candidate and document fallbacks',
            'semantic':{'enabled':False,'selected_vector_model':None,'selected_vector_build':None,'selected_vector_version':None,
                'coverage':0,'reason':'No query encoder or validated selected vector snapshot used; lexical/reference release only'},
            'corpus_build':self.summaries[1]['contract']['corpus_build'],
            'reader_generation':self.summaries[1]['contract']['reader_generation'],
            'ranking_population_dependency':'All selected windows affect BM25; every generation rebuilds token index and rankings',
            'cross_generation_reuse':'not implemented or claimed; changed parent/rules/code creates separate complete rebuild',
            'backup_restore':'not tested','public_output':False}
        self.prepared={}
    def close(self): self.sections.close();self.alignment.close()
    def check_dependencies(self):
        changed=[]
        for r in self.sections.execute('SELECT * FROM research_inputs WHERE run_id=?',(self.srun,)):
            p=Path(r['path'])
            if not p.is_file() or (p.stat().st_size,p.stat().st_mtime_ns)!=(r['size'],r['mtime_ns']): changed.append(str(p))
        if changed: raise StaleInput('Changed/missing parent sources: '+packed(changed[:30]))
        for p,h in zip(self.pointers,self.contract['parent_summary_hashes']):
            if filehash(p['summary'])!=h: raise StaleInput('Pinned parent release changed')
        if digest(ruleset(self.project))!=self.contract['rules_sha256']: raise StaleInput('Rules changed during run')

def read_json_column(db,sql,args): return json.loads(db.execute(sql,args).fetchone()[0])

def capture(inputs,db,run,calibrate):
    count=0;strata=Counter()
    for r in inputs.sections.execute('SELECT * FROM research_scope WHERE run_id=? ORDER BY document_id',(inputs.srun,)):
        d=json.loads(r['descriptor_json']);doc=r['document_id'];disp=r['disposition']
        lang=language(d.get('language'))[0]
        key=(r['adapter'],Path(d.get('source_path') or '').suffix,lang,d.get('source_family'))
        if calibrate and disp=='supported':
            strata[key]+=1
            if strata[key]>2:disp='outside-calibration'
        work=d.get('work_id') if d.get('work_verified') else None
        edition=d.get('edition_id') if d.get('edition_verified') else None
        original=d.get('original_sha256') or d.get('xml_link',{}).get('asset_sha256')
        group=work or original or doc
        basis='verified-work' if work else 'source-byte-group; work independence unresolved' if original else 'document; independence unresolved'
        fp=digest({'descriptor':d,'section_run':inputs.srun,'rules':inputs.contract['rules_sha256'],
            'code':inputs.contract['code'],'parser':inputs.contract['parser_sha256']})
        db.execute('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            (run,doc,disp,lang,d.get('author_label'),work,edition,group,basis,packed(d),fp))
        for member,role in d.get('memberships',[]):
            db.execute('INSERT OR IGNORE INTO contributors VALUES(?,?,?,?)',(run,doc,member,role))
        db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(run,doc,'metadata',doc,digest(d),'{}'))
        count+=1
        if count%25000==0:print(packed({'phase':'capture-documents','count':count}),flush=True)
    for number,r in enumerate(inputs.sections.execute('''SELECT s.* FROM sections s JOIN run_sections m ON m.version_id=s.version_id
        WHERE m.run_id=?''',(inputs.srun,)),1):
        db.execute('INSERT INTO concept_sections VALUES(?,?,?,?,?,?)',(run,r['version_id'],r['document_id'],r['kind'],r['state'],r['heading']))
        if number%200000==0:print(packed({'phase':'capture-sections','count':number}),flush=True)
    for r in inputs.rules['rules']:
        db.execute('INSERT INTO rules VALUES(?,?,?,?)',(run,r['id'],r['topic'],packed(r)))
    return count

def partition(segments):
    """Disjoint source intervals assigned to smallest native section, then explicit fallback."""
    boundaries=sorted({x for s in segments for x in (s['start'],s['end'])})
    events=defaultdict(list)
    for i,s in enumerate(segments): events[s['start']].append((True,i));events[s['end']].append((False,i))
    active=set()
    for start,end in zip(boundaries,boundaries[1:]):
        for add,i in events[start]:
            if add:active.add(i)
            else:active.discard(i)
        if not active or end<=start:continue
        s=min((segments[i] for i in active),key=lambda s:(s['kind']=='document-representation',s['state']=='candidate-unreviewed',s['end']-s['start'],s['version_id']))
        for a in range(start,end,WINDOW): yield s,a,min(a+WINDOW,end)

def process_document(inputs,db,run,row):
    started=time.monotonic();doc=row['document_id'];d=json.loads(row['descriptor_json'])
    sections=[dict(r) for r in inputs.sections.execute('''SELECT s.version_id,s.kind,s.state,s.heading,g.* FROM sections s INDEXED BY sections_document
        CROSS JOIN run_sections m ON m.version_id=s.version_id AND m.run_id=?
        CROSS JOIN section_segments g ON g.version_id=s.version_id WHERE s.document_id=?
        ORDER BY g.path,g.coordinate,g.block_ordinal,g.locator,g.start''',(inputs.srun,doc))]
    groups=defaultdict(list)
    for s in sections:groups[(s['path'],s['asset_sha256'],s['coordinate'],s['block_ordinal'],s['locator'])].append(s)
    counts=Counter();proofs={}
    for key,spans in groups.items():
        # Reconstruct once per block/entry. KR-101 hashes verify every indexed interval.
        first=max(spans,key=lambda s:s['end']-s['start'])
        resolve_segment(first,inputs.prepared)
        payload=inputs.prepared[(key[0],key[1],key[2])]
        if key[2]=='extraction-cache-block': text=payload[key[3]]['text']
        elif key[2]=='original-xml-entry':text=payload[key[4]]
        else:text=payload
        if text_hash(text)!=first['block_text_sha256']:raise StaleInput('Source block hash changed')
        stat=Path(key[0]).stat();proofs[key[0]]=(key[1],stat.st_size,stat.st_mtime_ns)
        for s in spans:
            if not 0<=s['start']<=s['end']<=len(text) or text_hash(text[s['start']:s['end']])!=s['span_sha256']:
                raise StaleInput('Section span proof changed')
        # Scan once across full source block so terms/references crossing window boundaries survive.
        hits=inputs.matcher.extract(text,row['language'])
        refs,rejections=inputs.scanner.extract(text); counts['rejections']+=len(rejections)
        hits.sort(key=lambda h:h[2]);refs.sort(key=lambda h:h['start']);hi=ri=0
        for s,a,b in partition(spans):
            # Extend within section for a hit crossing the artificial window end.
            selected_hits=[]; selected_refs=[]
            while hi<len(hits) and hits[hi][2]<b:
                h=hits[hi];hi+=1
                if h[2]>=a and h[3]<=s['end']:selected_hits.append(h)
            while ri<len(refs) and refs[ri]['start']<b:
                h=refs[ri];ri+=1
                if h['start']>=a and h['end']<=s['end']:selected_refs.append(h)
            end=max([b]+[h[3] for h in selected_hits]+[h['end'] for h in selected_refs])
            body=text[a:end]
            wid=db.execute('INSERT INTO windows(run_id,document_id,version_id,segment_ordinal,start,end,text_sha256,kind,state) VALUES(?,?,?,?,?,?,?,?,?)',
                (run,doc,s['version_id'],s['ordinal'],a,end,text_hash(body),s['kind'],s['state'])).lastrowid
            db.execute('INSERT INTO '+fts_name(run)+'(rowid,heading,body) VALUES(?,?,?)',(wid,s['heading'],body))
            db.executemany('INSERT INTO concept_occurrences(window_id,concept_id,rule_id,start,end,literal,basis,ambiguity) VALUES(?,?,?,?,?,?,?,?)',[(wid,*h) for h in selected_hits])
            db.executemany('INSERT INTO reference_occurrences(window_id,book,first,last,start,end,literal,reference_kind) VALUES(?,?,?,?,?,?,?,?)',
                [(wid,h['book'],h['chapter']*1000+h['verse'],h['endChapter']*1000+h['endVerse'],h['start'],h['end'],text[h['start']:h['end']],h.get('referenceKind','verse')) for h in selected_refs])
            counts.update(windows=1,concepts=len(selected_hits),references=len(selected_refs),characters=end-a)
    for path,(sha,size,mtime) in proofs.items():
        st=Path(path).stat()
        if (st.st_size,st.st_mtime_ns)!=(size,mtime):raise StaleInput('Source changed during document')
        db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(run,doc,'source',path,sha,packed({'size':size,'mtime_ns':mtime})))
    for s in sections:
        db.execute('INSERT OR IGNORE INTO dependencies VALUES(?,?,?,?,?,?)',(run,doc,'section',s['version_id'],s['version_id'],'{}'))
    disposition='processed' if counts['windows'] else 'empty-no-located-text'
    if row['language'] not in ('en','enm'):disposition+='; topic-language-deferred; English-reference-grammar-only'
    db.execute('INSERT INTO document_results VALUES(?,?,?,?,?,?,?,?,?)',
        (run,doc,counts['windows'],counts['concepts'],counts['references'],counts['rejections'],counts['characters'],time.monotonic()-started,disposition))
    return counts['windows']

def status(db,run):
    result=dict(db.execute('SELECT count(*) documents,coalesce(sum(windows),0) windows,coalesce(sum(concepts),0) concepts,coalesce(sum(references_count),0) references_count,coalesce(sum(rejections),0) rejected_references,coalesce(sum(characters),0) characters FROM document_results WHERE run_id=?',(run,)).fetchone())
    result['expected_documents']=db.execute("SELECT count(*) FROM documents WHERE run_id=? AND disposition='supported'",(run,)).fetchone()[0]
    result['jobs']=[dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(run,))]
    return result

def run(project=PROJECT,calibrate=False,resume=False,limit=None):
    background_priority();folder=root(project);folder.mkdir(parents=True,exist_ok=True);start=time.monotonic()
    shared=JobStore(Path(project)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');store=inputs=None
    try:
        shared.acquire();store=JobStore(folder/'concepts.sqlite3');store.acquire();store.db.executescript(SCHEMA)
        store.db.execute('PRAGMA cache_size=-65536');inputs=Inputs(project);inputs.check_dependencies()
        contract={**inputs.contract,'calibration':calibrate};run_id='kr110-'+digest(contract)[:24]+('-calibration' if calibrate else '')
        store.db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS "+fts_name(run_id)+" USING fts5(heading,body,content='',tokenize='unicode61 remove_diacritics 2')")
        if not calibrate:
            cal='kr110-'+digest({**contract,'calibration':True})[:24]+'-calibration'
            record=store.db.execute('SELECT state FROM concept_runs WHERE id=?',(cal,)).fetchone()
            if not record or record[0]!='population-complete':raise ValueError('Matching calibration required')
        old=store.db.execute('SELECT * FROM concept_runs WHERE id=?',(run_id,)).fetchone()
        if old and old['state']=='population-complete': print(packed({'run_id':run_id,'unchanged':True}));return
        if old and not resume:raise ValueError('Existing incomplete generation; use --resume')
        with store.db:
            store.db.execute('INSERT OR IGNORE INTO concept_runs VALUES(?,?,?,NULL)',(run_id,'running',packed(contract)))
            store.db.execute("UPDATE concept_runs SET state='running' WHERE id=?",(run_id,))
        job=digest({'capture':run_id});store.register(run_id,job,'concept-capture','capture',job,VERSION)
        if store.execute(job,lambda db:capture(inputs,db,run_id,calibrate)) in ('failed','stale'):raise RuntimeError('Capture failed')
        print(packed({'phase':'index','run_id':run_id,'pid':os.getpid(),'process_token':process_identity(os.getpid())}),flush=True)
        # XML entries sorted by asset retain one parsed source, rather than parsing it per entry.
        rows=store.db.execute("SELECT * FROM documents WHERE run_id=? AND disposition='supported' ORDER BY coalesce(json_extract(descriptor_json,'$.xml_link.asset_path'),document_id),document_id",(run_id,)).fetchall()
        for offset in range(0,len(rows),16):
            batch=rows[offset:offset+16]
            if limit:batch=batch[:max(0,limit-offset)]
            if not batch:break
            jobs=[(r,digest({'run':run_id,'document':r['document_id'],'fingerprint':r['fingerprint']})) for r in batch]
            store.register_many([(run_id,j,'concept-document',r['document_id'],r['fingerprint'],VERSION) for r,j in jobs])
            results=store.execute_many([(j,lambda db,r=r:process_document(inputs,db,run_id,r)) for r,j in jobs])
            if any(s in ('failed','stale') for s in results.values()):
                print(packed({'errors':[dict(r) for r in store.db.execute("SELECT scope,state,error FROM jobs WHERE state IN ('failed','stale')")]}),flush=True)
            if offset%128==0 or offset+len(batch)>=len(rows):
                receipt={'run_id':run_id,'phase':'index','pid':os.getpid(),'process_token':process_identity(os.getpid()),
                    'visited':offset+len(batch),'seconds_this_attempt':round(time.monotonic()-start,2),**status(store.db,run_id)}
                dump(folder/'concept-progress.json',receipt);print(packed(receipt),flush=True);shared.heartbeat()
            if (folder/'cancel.request').exists() or (limit and offset+len(batch)>=limit):
                with store.db:store.db.execute("UPDATE concept_runs SET state='interrupted' WHERE id=?",(run_id,))
                return
        inputs.check_dependencies();counts=status(store.db,run_id)
        ok=counts['documents']==counts['expected_documents'] and all(j['state']=='succeeded' for j in counts['jobs'])
        integrity=store.db.execute('PRAGMA quick_check').fetchone()[0];ok=ok and integrity=='ok'
        summary={'run_id':run_id,'state':'population-complete' if ok else 'needs-attention','contract':contract,'counts':counts,
            'sqlite_quick_check':integrity,'seconds_this_attempt':time.monotonic()-start,'database':str(store.path),
            'retrieval_quality':'pending separate frozen-question assessment; no retrieval promotion',
            'scope':[dict(r) for r in store.db.execute('SELECT disposition,language,count(*) documents FROM documents WHERE run_id=? GROUP BY disposition,language',(run_id,))]}
        with store.db:store.db.execute('UPDATE concept_runs SET state=?,summary_json=? WHERE id=?',(summary['state'],packed(summary),run_id))
        dump(folder/('calibration.json' if calibrate else 'population.json'),summary)
        dump(folder/'concept-progress.json',summary);print(packed({'phase':'finished','run_id':run_id,'state':summary['state'],'counts':counts}),flush=True)
    finally:
        if inputs:inputs.close()
        if store:store.close()
        shared.close()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--freeze',action='store_true');p.add_argument('--calibrate',action='store_true');p.add_argument('--run',action='store_true')
    p.add_argument('--resume',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--status',action='store_true')
    a=p.parse_args()
    if a.freeze:print(freeze())
    elif a.status:print((root()/'concept-progress.json').read_text())
    elif a.run or a.calibrate:run(calibrate=a.calibrate,resume=a.resume,limit=a.limit)
    else:p.error('Choose --freeze, --calibrate, --run or --status')

if __name__=='__main__':main()
