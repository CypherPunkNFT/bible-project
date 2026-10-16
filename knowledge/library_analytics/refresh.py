"""Executable CPU selective refresh: capture, plan, run, compare, query, select.

Every mutation is under the existing global analytics lease and a private
JobStore. All candidate files remain beneath connected-research/refresh.
"""
import argparse
from collections import Counter
from contextlib import contextmanager
import gzip
import json
import os
from pathlib import Path
import sqlite3
import time
from .build import PROJECT,readonly
from .jobs import JobStore,StaleInput,background_priority,process_identity
from .inputs import digest,packed
from .refresh_contract import (SCHEMA,STAGES,VERSION,delta,fingerprints,encode,decode,atomic_json,hash_file,
                               select_candidate,rollback_candidate,verify_export)
from .refresh_processors import Processors,population_native,memory,RUN
from .refresh_capture import capture,code_identity,query_identity,runtime_identity
from .refresh_environment import DEPENDENCIES

ROOT=Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research/refresh'
GLOBAL=Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3'

@contextmanager
def ownership(root=ROOT,global_path=GLOBAL):
    shared=JobStore(global_path);store=None
    try:
        shared.acquire();store=JobStore(Path(root)/'refresh.sqlite3');store.acquire();store.db.executescript(SCHEMA)
        yield shared,store
    finally:
        if store:store.close()
        shared.close()

def read_batch(path):
    raw=gzip.decompress(Path(path).read_bytes());value=json.loads(raw)
    if packed(value).encode()!=raw:raise StaleInput('Noncanonical capture')
    ids=[x['descriptor']['document_id'] for x in value['items']]
    if len(set(ids))!=len(ids):raise ValueError('Duplicate source identities')
    return value,digest(value)

def validate_batch(batch,*,code=True):
    if code and batch['config']['code']!=code_identity():raise StaleInput('Processor code changed; capture a new generation')
    if code and batch['config']['query_code']!=query_identity():raise StaleInput('Query helper code changed')
    if code and batch['config']['runtime']!=runtime_identity():raise StaleInput('Interpreter/parser/SQLite runtime changed')
    paths={}
    for item in batch['items']:
        for p in item['sources']:
            if p['path'] in paths and paths[p['path']]!=p['sha256']:raise StaleInput('Conflicting source proofs')
            paths[p['path']]=p['sha256']
        for reader in item['readers']:
            # Captured catalogue record is immutable input, rather than a
            # dependency on an unrelated mutable record shard. Page bodies
            # still bind to their actual content-addressed reader files.
            for block in reader['blocks']:paths[block['page_path']]=block['page_sha256']
    for path,expected in paths.items():
        if hash_file(path)!=expected:raise StaleInput('Changed input '+path)
    for proof in batch['config']['reader_code']:
        if hash_file(proof['path'])!=proof['sha256']:raise StaleInput('Reader routing code changed')
    for parent in batch['config'].get('parents',{}).values():
        if hash_file(parent['summary'])!=parent['summary_sha256'] or hash_file(Path(parent['release'])/'release_manifest.json')!=parent['manifest_sha256']:
            raise StaleInput('Immutable input release changed')
    return len(paths)

def generation(batch_hash,mode,parent):return 'refresh-'+digest([VERSION,batch_hash,mode,parent])[:24]

def old_items(db,parent):
    if not parent:return {}
    row=db.execute('SELECT state,contract_json FROM refresh_runs WHERE id=?',(parent,)).fetchone()
    if not row or row['state']!='complete':raise ValueError('Complete private parent required')
    return {r['document_id']:json.loads(r['descriptor_json']) for r in db.execute('SELECT * FROM refresh_scope WHERE run_id=?',(parent,))}

def make_plan(db,batch,batch_hash,mode,parent):
    run=generation(batch_hash,mode,parent);previous=old_items(db,parent);current={x['descriptor']['document_id']:x for x in batch['items']}
    changes={doc:delta(previous.get(doc),current.get(doc)) for doc in sorted(previous.keys()|current.keys())}
    old=db.execute('SELECT * FROM refresh_runs WHERE id=?',(run,)).fetchone()
    contract={'version':VERSION,'batch_hash':batch_hash,'mode':mode,'parent':parent,'config':batch['config'],'scope':batch['scope']}
    if old and old['contract_json']!=packed(contract):raise StaleInput('Same-generation contract differs')
    with db:
        db.execute('INSERT OR IGNORE INTO refresh_runs VALUES(?,?,?,?,?,?,NULL)',(run,parent,batch_hash,mode,'planned',packed(contract)))
        for doc,item in current.items():db.execute('INSERT OR IGNORE INTO refresh_scope VALUES(?,?,?,?)',(run,doc,changes[doc],packed(item)))
        for doc,change in changes.items():
            if change=='removed':db.execute('INSERT OR IGNORE INTO tombstones VALUES(?,?,?,?)',(run,doc,parent,'removed from target membership; original preserved'))
    return run,changes

def object_row(db,oid):
    row=db.execute('SELECT * FROM objects WHERE id=?',(oid,)).fetchone()
    if not row:raise StaleInput('Missing immutable object '+oid)
    return row

def dependencies(item,stage,config,parents):
    doc=item['descriptor']['document_id'];result=[]
    if stage=='sections':
        result.extend(('source',p['path'],p['sha256']) for p in item['sources']);result.append(('metadata',doc,digest(item['descriptor'])))
    if stage in ('alignment','concepts'):result.append(('sections',doc,parents['sections']))
    if stage=='alignment':
        result.append(('corpus',doc,digest(item['corpus'])))
        result.extend(('reader',r['record']['id'],digest(r)) for r in item['readers'])
        result.append(('reader-code','routing',digest(config['reader_code'])))
    if stage=='concepts':result.extend([('rules','concepts',digest(config['rules'])),('parser','references',digest(config['parser']))])
    if stage=='relationships':result.extend([('concepts',doc,parents['concepts']),('config','relationships',digest(config['relationships'])),('metadata',doc,digest(item['descriptor']))])
    result.append(('code',stage,digest(config['code'][stage])))
    return result

def perform(root,batch_path,mode='selective',parent=None,limit=None,*,global_path=GLOBAL,code=True):
    background_priority();start=time.monotonic()
    # Validation and all heavy source reads are serialized with analytics.
    with ownership(root,global_path) as (shared,store):
        db=store.db;batch,batch_hash=read_batch(batch_path);source_paths=validate_batch(batch,code=code);run,changes=make_plan(db,batch,batch_hash,mode,parent)
        existing=db.execute('SELECT state FROM refresh_runs WHERE id=?',(run,)).fetchone()[0]
        if existing=='complete':
            summary=json.loads(db.execute('SELECT summary_json FROM refresh_runs WHERE id=?',(run,)).fetchone()[0]);print(packed({'run_id':run,'unchanged':True}),flush=True);return summary
        with db:db.execute("UPDATE refresh_runs SET state='running' WHERE id=?",(run,))
        processor=Processors(batch['config'],batch['items']);processed=0;last=time.monotonic()
        for item in sorted(batch['items'],key=lambda x:(x['descriptor'].get('xml_link',{}).get('asset_path',''),x['descriptor']['document_id'])):
            doc=item['descriptor']['document_id'];parent_ids={};values={}
            for stage in STAGES:
                fp=fingerprints(item,batch['config'],parent_ids)[stage]
                jid=digest([run,doc,stage,fp]);store.register(run,jid,'refresh-'+stage,doc+':'+stage,fp,VERSION)
                def writer(conn):
                    stage_start=time.monotonic();match=None
                    if mode=='selective' and parent:
                        match=conn.execute('SELECT o.* FROM membership m JOIN objects o ON o.id=m.object_id WHERE m.run_id=? AND m.document_id=? AND m.stage=? AND m.fingerprint=?',(parent,doc,stage,fp)).fetchone()
                    if match:
                        value=decode(match);oid=match['id'];action='reused';rows=match['rows']
                    else:
                        value=processor.compute(stage,item,values);oid,payload,rawbytes=encode(value);rows=sum(len(v) for v in value.values());action='recomputed'
                        prior=conn.execute('SELECT o.* FROM computations c JOIN objects o ON o.id=c.object_id WHERE c.stage=? AND c.fingerprint=?',(stage,fp)).fetchone()
                        if prior and prior['id']!=oid:raise StaleInput('Same computation fingerprint produced different facts')
                        if prior:decode(prior)
                        conn.execute('INSERT OR IGNORE INTO objects VALUES(?,?,?,?,?,?)',(oid,stage,fp,payload,rows,rawbytes))
                        conn.execute('INSERT OR IGNORE INTO computations VALUES(?,?,?)',(stage,fp,oid))
                    conn.execute('INSERT INTO membership VALUES(?,?,?,?,?,?,?)',(run,doc,stage,oid,fp,action,time.monotonic()-stage_start))
                    conn.executemany('INSERT INTO reverse_dependencies VALUES(?,?,?,?,?,?)',[(run,doc,stage,*dep) for dep in dependencies(item,stage,batch['config'],parent_ids)])
                    return rows
                result=store.execute(jid,writer)
                if result in ('failed','stale'):
                    with db:db.execute('UPDATE refresh_runs SET state=? WHERE id=?',(result,run))
                    raise RuntimeError(packed(dict(db.execute('SELECT * FROM jobs WHERE id=?',(jid,)).fetchone())))
                row=db.execute('SELECT * FROM membership WHERE run_id=? AND document_id=? AND stage=?',(run,doc,stage)).fetchone()
                parent_ids[stage]=row['object_id'];values[stage]=decode(object_row(db,row['object_id']))
            processed+=1
            if time.monotonic()-last>=10:
                receipt={'run_id':run,'phase':'documents','visited':processed,'expected':len(batch['items']),'pid':os.getpid(),
                         'process_token':process_identity(os.getpid()),'seconds_this_attempt':time.monotonic()-start}
                atomic_json(Path(root)/'progress.json',receipt);print(packed(receipt),flush=True);shared.heartbeat();last=time.monotonic()
            if limit and processed>=limit:
                with db:db.execute("UPDATE refresh_runs SET state='interrupted' WHERE id=?",(run,))
                return {'run_id':run,'state':'interrupted','visited':processed}
        # Entire target membership determines frequencies and old neighbor
        # rankings. No retained pair/score simply inherits a new run label.
        popfp=digest({'members':[(r['document_id'],r['stage'],r['object_id']) for r in db.execute('SELECT * FROM membership WHERE run_id=? ORDER BY document_id,stage',(run,))],
                      'metadata':[(i['descriptor']['document_id'],i['descriptor']) for i in batch['items']],
                      'rules':batch['config']['rules'],'parser':batch['config']['parser'],'relationships':batch['config']['relationships'],'joint':batch['config']['joint'],
                      'reviews':batch['config']['reviews'],'query_code':batch['config']['query_code']})
        jid=digest([run,'population',popfp]);store.register(run,jid,'refresh-population','population',popfp,VERSION)
        def population_writer(conn):
            stamp=time.monotonic();work=Path(root)/'query-stores';work.mkdir(parents=True,exist_ok=True)
            path=work/(run+'.sqlite3.building')
            if path.exists():path.unlink()  # Only this explicitly owned unselected scratch file.
            native=sqlite3.connect(path);native.row_factory=sqlite3.Row;objects=[]
            native.execute('PRAGMA cache_size=-262144');native.execute('PRAGMA synchronous=FULL')
            try:
                for item in batch['items']:
                    doc=item['descriptor']['document_id'];objects.append({r['stage']:decode(object_row(conn,r['object_id'])) for r in conn.execute('SELECT * FROM membership WHERE run_id=? AND document_id=?',(run,doc))})
                products=population_native(native,batch['items'],objects,batch['config'])
                products['queries']=evaluate_queries(native,batch)
                oid,payload,rawbytes=encode(products);rows=sum(len(v) for v in products.values())
                prior=conn.execute("SELECT object_id FROM computations WHERE stage='population' AND fingerprint=?",(popfp,)).fetchone()
                if prior and prior[0]!=oid:raise StaleInput('Population fingerprint produced different facts')
                conn.execute('INSERT OR IGNORE INTO objects VALUES(?,?,?,?,?,?)',(oid,'population',popfp,payload,rows,rawbytes))
                conn.execute('INSERT OR IGNORE INTO computations VALUES(?,?,?)',('population',popfp,oid))
                conn.execute('INSERT INTO population_products VALUES(?,?,?,?)',(run,popfp,oid,time.monotonic()-stamp))
                for item in batch['items']:
                    doc=item['descriptor']['document_id']
                    conn.execute('INSERT INTO reverse_dependencies VALUES(?,?,?,?,?,?)',(run,'__population__','population','metadata',doc,digest(item['descriptor'])))
                    for stage in ('concepts','relationships'):
                        obj=conn.execute('SELECT object_id FROM membership WHERE run_id=? AND document_id=? AND stage=?',(run,doc,stage)).fetchone()[0]
                        conn.execute('INSERT INTO reverse_dependencies VALUES(?,?,?,?,?,?)',(run,'__population__','population',stage,doc,obj))
                conn.executemany('INSERT INTO reverse_dependencies VALUES(?,?,?,?,?,?)',[(run,'__population__','population',kind,key,digest(value)) for kind,key,value in
                    [('review','candidate-decisions',batch['config']['reviews']),('config','joint',batch['config']['joint']),('parser','query',batch['config']['parser'])]])
                native.commit();native.close();native=None;path.replace(work/(run+'.sqlite3'))
                return rows
            finally:
                if native:native.close()
        result=store.execute(jid,population_writer)
        if result in ('failed','stale'):raise RuntimeError(packed(dict(db.execute('SELECT * FROM jobs WHERE id=?',(jid,)).fetchone())))
        validate_batch(batch,code=code)
        products=db.execute('SELECT * FROM population_products WHERE run_id=?',(run,)).fetchone();decode(object_row(db,products['object_id']))
        actions=[dict(r) for r in db.execute('SELECT stage,action,count(*) documents,sum(seconds) seconds FROM membership WHERE run_id=? GROUP BY stage,action',(run,))]
        bad=db.execute("SELECT count(*) FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? AND j.state!='succeeded'",(run,)).fetchone()[0]
        complete=db.execute('SELECT count(*) FROM membership WHERE run_id=?',(run,)).fetchone()[0]==len(batch['items'])*4 and not bad
        summary={'run_id':run,'state':'complete' if complete else 'failed','parent':parent,'mode':mode,'batch':str(Path(batch_path).resolve()),
                 'input_hash':batch_hash,'documents':len(batch['items']),'deltas':dict(Counter(changes.values())),'actions':actions,
                 'source_paths_verified':source_paths,'population_seconds':products['seconds'],'population_object':products['object_id'],
                 'seconds_this_attempt':time.monotonic()-start,'scope':batch['scope'],'database':str(store.path),
                 'quality':'candidate-only; deterministic refresh equivalence is not improved theological retrieval or attribution',
                 'failed_or_unfinished_jobs':bad,'sqlite_quick_check':db.execute('PRAGMA quick_check').fetchone()[0]}
        with db:db.execute('UPDATE refresh_runs SET state=?,summary_json=? WHERE id=?',(summary['state'],packed(summary),run))
        atomic_json(Path(root)/('summary-'+run+'.json'),summary);atomic_json(Path(root)/'progress.json',summary);print(packed(summary),flush=True);return summary

def retriever(native,batch):
    from .concept_query import Retriever
    from .refresh_processors import RUN
    r=Retriever.__new__(Retriever);r.run=RUN;r.db=native;r.sections=native;r.alignment=native;r.srun=RUN;r.arun=RUN
    r.fts='fts_'+RUN.replace('-','_');r.rules=batch['config']['rules']['rules'];r.setup_seconds=0
    p=batch['config']['parser']
    from .references import ReferenceScanner
    from ..enrichment.citations import CitationParser
    r.scanner=ReferenceScanner(CitationParser(p['books'],{(b,c):v for b,c,v in p['bounds']}));r.contract={'semantic':{'enabled':False,'coverage':0}}
    return r

def evaluate_queries(native,batch):
    """Run unchanged query implementation over a stable-ID candidate projection.

    All original 72/48 intents remain frozen. Deterministic equivalence only;
    no fabricated gold relevance or human review is attached.
    """
    from .research_evaluation import questions
    r=retriever(native,batch)
    out=[]
    for q in questions():
        for mode in ('baseline','concept'):
            result=r.search(q.get('question',q.get('query','')),mode=mode)
            result.pop('seconds',None);result.pop('setup_seconds',None);result.pop('query_implementation_sha256',None)
            out.append({'question':q,'mode':mode,'result':result})
    return out

def compare(db,selective,clean):
    rows=[db.execute('SELECT * FROM refresh_runs WHERE id=?',(r,)).fetchone() for r in (selective,clean)]
    if any(not r or r['state']!='complete' for r in rows):raise ValueError('Two completed runs required')
    if rows[0]['input_hash']!=rows[1]['input_hash']:raise ValueError('Different target inputs')
    members=[]
    for run in (selective,clean):members.append([tuple(r) for r in db.execute('SELECT document_id,stage,object_id FROM membership WHERE run_id=? ORDER BY document_id,stage',(run,))])
    pops=[db.execute('SELECT object_id FROM population_products WHERE run_id=?',(r,)).fetchone()[0] for r in (selective,clean)]
    facts_equal=members[0]==members[1];population_equal=decode(object_row(db,pops[0]))==decode(object_row(db,pops[1]))
    reports=[json.loads(r['summary_json']) for r in rows]
    selective_seconds=sum(x['seconds'] for x in reports[0]['actions']);clean_seconds=sum(x['seconds'] for x in reports[1]['actions'])
    return {'ok':facts_equal and population_equal,'selective':selective,'clean':clean,'input_hash':rows[0]['input_hash'],
            'fact_memberships_equal':facts_equal,'memberships_compared':len(members[0]),'population_products_equal':population_equal,
            'selective_document_seconds':selective_seconds,'clean_document_seconds':clean_seconds,
            'document_seconds_saved':clean_seconds-selective_seconds,'document_saving_fraction':1-selective_seconds/clean_seconds if clean_seconds else None,
            'reviewer_type':'deterministic clean rebuild / source witness reconstruction; no human or model relevance judgments',
            'limits':['Candidate-only CPU semantics preserved; no relevance/attribution quality gain claimed.','Global FTS frequencies, rankings and base/joint relationship pairs rebuilt for each target population.']}

def affected(db,kind,key):
    """Trace registered direct and transitive descendants, without recompute."""
    pending=[(kind,key)];visited=set();found={}
    while pending:
        node=pending.pop()
        if node in visited:continue
        visited.add(node)
        for row in db.execute('SELECT * FROM reverse_dependencies WHERE kind=? AND key=?',node):
            r=dict(row);found[(r['run_id'],r['document_id'],r['stage'],r['kind'],r['key'])]=r
            pending.append((r['stage'],r['document_id']))
    return sorted(found.values(),key=packed)

def release(root,run,clean,global_path=GLOBAL):
    with ownership(root,global_path) as (shared,store):
        db=store.db;row=db.execute('SELECT * FROM refresh_runs WHERE id=?',(run,)).fetchone()
        if not row or row['state']!='complete':raise ValueError('Complete candidate required')
        summary=json.loads(row['summary_json']);batch,_=read_batch(summary['batch']);validate_batch(batch)
        evaluation=compare(db,run,clean)
        if not evaluation['ok']:raise ValueError('Equivalence failed; retain last good')
        folder=Path(root)/'releases'/run
        if folder.exists():verify_export(folder);return folder
        temp=Path(root)/'releases'/(run+'.building');temp.mkdir(parents=True,exist_ok=True)
        files=[]
        def write(name,iterator):
            path=temp/name
            with path.open('wb') as f:
                for value in iterator:f.write((packed(value)+'\n').encode())
                f.flush();os.fsync(f.fileno())
            files.append({'path':name,'bytes':path.stat().st_size,'sha256':hash_file(path)})
        for table in ('refresh_scope','membership','reverse_dependencies','tombstones'):
            write(table+'.jsonl',(dict(r) for r in db.execute('SELECT * FROM '+table+' WHERE run_id=? ORDER BY document_id',(run,))))
        ids=[r[0] for r in db.execute('SELECT DISTINCT object_id FROM membership WHERE run_id=? UNION SELECT object_id FROM population_products WHERE run_id=? ORDER BY 1',(run,run))]
        write('objects.jsonl',({'id':oid,'stage':object_row(db,oid)['stage'],'facts':decode(object_row(db,oid))} for oid in ids))
        write('summary.jsonl',[summary]);write('evaluation.jsonl',[evaluation]);write('contract.jsonl',[json.loads(row['contract_json'])])
        # Closed SQLite projection supports arbitrary constrained located
        # queries. It is derived/private and not a dependency-closed backup.
        import shutil
        path=temp/'query.sqlite3';shutil.copyfile(Path(root)/'query-stores'/(run+'.sqlite3'),path)
        files.append({'path':path.name,'bytes':path.stat().st_size,'sha256':hash_file(path)})
        code_root=Path(__file__).parent
        code_files={f:h for group in batch['config']['code'].values() for f,h in group.items()}
        code_files.update(batch['config']['query_code'])
        for name,expected in sorted(code_files.items()):
            source=(code_root/name).resolve()
            if hash_file(source)!=expected:raise StaleInput('Code changed during export')
            relative=source.relative_to(code_root.parent);target=temp/'code'/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
            files.append({'path':target.relative_to(temp).as_posix(),'bytes':target.stat().st_size,'sha256':hash_file(target)})
        source=DEPENDENCIES/'typing_extensions.py';target=temp/'dependencies/typing_extensions.py';target.parent.mkdir(parents=True,exist_ok=True)
        if hash_file(source)!=batch['config']['runtime']['typing_extensions_sha256']:raise StaleInput('Private parser dependency changed')
        shutil.copyfile(source,target);files.append({'path':target.relative_to(temp).as_posix(),'bytes':target.stat().st_size,'sha256':hash_file(target)})
        manifest={'run_id':run,'files':files,'evaluation':evaluation,'capabilities':{'selective-cpu-candidate-refresh':True,'interpreted-evidence':False,'backup-restoration':False},
                  'compatible_release_set':batch['config'].get('parents',{}),'batch_sha256':summary['input_hash'],
                  'input_capture':{'path':summary['batch'],'sha256':hash_file(summary['batch'])}}
        atomic_json(temp/'manifest.json',manifest);verify_export(temp);validate_batch(batch)
        temp.replace(folder);return folder

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=ROOT)
    actions=p.add_mutually_exclusive_group(required=True)
    actions.add_argument('--capture',action='store_true');actions.add_argument('--run',type=Path);actions.add_argument('--plan',type=Path);actions.add_argument('--compare',nargs=2)
    actions.add_argument('--export');actions.add_argument('--select',type=Path);actions.add_argument('--rollback',action='store_true')
    actions.add_argument('--status',action='store_true');actions.add_argument('--query');actions.add_argument('--affected',nargs=2);actions.add_argument('--neighbors',type=int)
    p.add_argument('--mode',choices=['selective','clean'],default='selective');p.add_argument('--parent');p.add_argument('--limit',type=int);p.add_argument('--clean')
    p.add_argument('--cache-count',type=int,default=1000);p.add_argument('--entry-count',type=int,default=1000)
    p.add_argument('--author');p.add_argument('--work');p.add_argument('--language');p.add_argument('--baseline',action='store_true')
    a=p.parse_args();a.root=a.root.resolve()
    if not a.root.is_relative_to(ROOT.resolve()):p.error('Outputs must stay under owned refresh root')
    if a.capture:
        background_priority()
        with ownership(a.root):print(packed(capture(a.root,a.cache_count,a.entry_count)),flush=True)
    elif a.run:perform(a.root,a.run,a.mode,a.parent,a.limit)
    elif a.plan:
        with ownership(a.root) as (_,s):
            batch,batch_hash=read_batch(a.plan)
            validate_batch(batch);run,changes=make_plan(s.db,batch,batch_hash,a.mode,a.parent)
            print(packed({'run_id':run,'deltas':dict(Counter(changes.values())),'scope':batch['scope']}))
    elif a.export:print(release(a.root,a.export,a.clean))
    elif a.select or a.rollback:
        with ownership(a.root):print(packed(select_candidate(a.root,a.select) if a.select else rollback_candidate(a.root)))
    else:
        db=readonly(a.root/'refresh.sqlite3')
        try:
            if a.compare:print(packed(compare(db,*a.compare)))
            elif a.status:print(packed([dict(r) for r in db.execute('SELECT id,parent,mode,state FROM refresh_runs ORDER BY rowid')]))
            elif a.affected:print(packed(affected(db,*a.affected)))
            elif a.query or a.neighbors:
                selected=json.loads((a.root/'candidate.json').read_text('utf-8'));m=verify_export(selected['release'])
                if hash_file(Path(selected['release'])/'manifest.json')!=selected['manifest_sha256']:raise StaleInput('Candidate manifest changed')
                row=db.execute('SELECT summary_json FROM refresh_runs WHERE id=?',(selected['run_id'],)).fetchone();batch,_=read_batch(json.loads(row[0])['batch']);validate_batch(batch)
                native=readonly(Path(selected['release'])/'query.sqlite3')
                try:
                    r=retriever(native,batch)
                    if a.query:result=r.search(a.query,'baseline' if a.baseline else 'concept',a.author,a.work,a.language)
                    else:
                        where,args=r.constraints(a.author,a.work,a.language)
                        candidates=native.execute('''SELECT endpoint,count(*) shared_features FROM (
                          SELECT right_window endpoint FROM pair_evidence WHERE run_id=? AND left_window=?
                          UNION ALL SELECT left_window FROM pair_evidence WHERE run_id=? AND right_window=?
                          UNION ALL SELECT right_window FROM joint_pairs WHERE run_id=? AND left_window=?
                          UNION ALL SELECT left_window FROM joint_pairs WHERE run_id=? AND right_window=?)
                          JOIN windows w ON w.id=endpoint JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id
                          WHERE '''+where+' GROUP BY endpoint ORDER BY shared_features DESC,endpoint LIMIT 5',[RUN,a.neighbors,RUN,a.neighbors,RUN,a.neighbors,RUN,a.neighbors,*args]).fetchall()
                        results=[]
                        for c in candidates:
                            w=dict(native.execute('SELECT w.*,d.descriptor_json FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=?',(c['endpoint'],)).fetchone())
                            results.append({'window_id':c['endpoint'],'shared_features':c['shared_features'],**r.witness(w,500)})
                        result={'window_id':a.neighbors,'results':results,'method':'bounded base/joint feature count; candidate-only; no influence or attribution inference'}
                    result['refresh_run_id']=selected['run_id'];print(packed(result))
                finally:native.close()
        finally:db.close()

if __name__=='__main__':main()
