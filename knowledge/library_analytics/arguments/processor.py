"""Global-lease serialized, atomic document processor for pinned KR-130."""
import argparse,hashlib,heapq,json,os,time
from collections import Counter,defaultdict
from pathlib import Path
from .inputs import ROOT,Inputs,SECTION_RUN,ALIGNMENT_RUN,sha,read,write_json,ro
from .contract import VERSION,CONFIG,SCHEMA
from .extractor import extract
from .reconstruct import resolve_segment,NativeRenderUnavailable,POLICY as RECONSTRUCTION_POLICY,SCHEMA as RECONSTRUCTION_SCHEMA
from ..build import PROJECT
from ..inputs import packed,digest
from ..jobs import JobStore,StaleInput,background_priority,process_identity
from ..section_contract import text_hash

def contract(inputs,calibration):
    frozen=ROOT/'evaluation/frozen.json'
    if not frozen.exists():raise ValueError('Freeze evaluation first')
    return {'processor':VERSION,'config':CONFIG,'parents':[SECTION_RUN,ALIGNMENT_RUN],'parent_proofs':inputs.proofs,
      'shared_code_proofs':inputs.code_proofs,
      'runtime_dependencies':inputs.runtime,
      'code':{p.name:sha(p) for p in [Path(__file__),Path(__file__).with_name('extractor.py'),Path(__file__).with_name('contract.py'),Path(__file__).with_name('inputs.py'),Path(__file__).with_name('__init__.py'),Path(__file__).with_name('reconstruct.py')]},
      'reconstruction_policy':RECONSTRUCTION_POLICY,
      'shared_jobstore_sha256':sha(Path(__file__).parent.parent/'jobs.py'),'evaluation_sha256':sha(frozen),'evaluation_extra_sha256':sha(ROOT/'evaluation/frozen-extra.json'),'calibration':calibration}

def capture(inputs,db,rid,calibration):
    strata=Counter();n=0
    for row in inputs.descriptors():
        d=json.loads(row['descriptor_json']);disp=row['disposition'];reason=row['reason']
        if disp=='supported':
            if d.get('language')!='en':disp='deferred';reason='unsupported-language-label'
            else:
                reason='surface-cue English located sections, explicit coarse representation fallback; all other clauses deferred'
                key=(row['adapter'],d.get('source_family'),Path(d.get('source_path') or '').suffix,bool(d.get('readers')))
                strata[str(key)]+=1
                if calibration and strata[str(key)]>2:disp='outside-calibration';reason='stratified calibration limit'
        fp=digest(dict(row))
        db.execute('INSERT INTO scope VALUES(?,?,?,?,?,?)',(rid,row['document_id'],disp,reason,row['descriptor_json'],fp));n+=1
        if disp=='supported':
            for ordinal,m in enumerate(d.get('memberships') or []):
                db.execute('INSERT INTO contributors VALUES(?,?,?,?,?,?)',(rid,row['document_id'],ordinal,m[0],m[1],'captured source contributor membership; role retained verbatim'))
            db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(rid,row['document_id'],'descriptor',row['document_id'],fp,packed({'parent':SECTION_RUN,'metadata_sha256':d.get('metadata_sha256')})))
    for p in inputs.proofs:db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(rid,'','parent-release',p['path'],p['sha256'],packed(p)))
    for p in getattr(inputs,'code_proofs',[]):db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(rid,'','shared-adapter-code',p['path'],p['sha256'],packed(p)))
    return n

def process(inputs,db,rid,row):
    started=time.monotonic();doc=row['document_id'];d=json.loads(row['descriptor_json']);rows=inputs.segments(doc)
    chosen=[r for r in rows if r['state']!='candidate-unreviewed']
    stats=Counter();seen=set();verified_segments=set();sections={r['version_id'] for r in chosen};records=[];sources={};last_objection={};last_reply={};links=[]
    groups=defaultdict(list)
    for r in chosen:groups[(r['path'],r['block_ordinal'],r['locator'],r['coordinate'])].append(r)
    stats['segments']=len(chosen)
    envelopes=[]
    for source_key,group in groups.items():
        high=-1
        for r in sorted(group,key=lambda r:(r['start'],-r['end'])):
            if r['end']<=high:continue
            envelopes.append((source_key,r,group));high=r['end']
    for source_key,envelope,group in sorted(envelopes,key=lambda x:(x[0],x[1]['start'])):
        # Reconstruction hashes the source once per representation; bounded prepared cache.
        sources[envelope['path']]=(envelope['asset_sha256'],envelope['coordinate'])
        try:body=resolve_segment(envelope,inputs.prepared)
        except NativeRenderUnavailable as exc:
            stats['unreconstructable-native-representations']+=1;stats['deferred-native-segments']+=len(group)
            db.execute('INSERT OR IGNORE INTO reconstruction_deferrals VALUES(?,?,?,?,?,?,?,?,?,?,?)',(rid,doc,envelope['version_id'],envelope['coordinate'],envelope['path'],envelope['asset_sha256'],envelope['block_ordinal'],envelope['locator'],envelope['block_text_sha256'],exc.proof['reason'],packed(exc.proof)))
            continue
        records_here,counters=extract(body,d.get('author_label'));stats.update(counters)
        stats['characters']+=len(body)
        ordered=sorted(group,key=lambda r:(r['start'],r['end'],r['version_id'],r['ordinal']));index=0;active=[]
        for item in records_here:
            a,b=envelope['start']+item['start'],envelope['start']+item['end'];key=(*source_key,a,b)
            if key in seen:stats['overlapping_candidate_duplicates']+=1;continue
            seen.add(key)
            ident='arg-'+digest({'run':rid,'doc':doc,'source':key,'hash':text_hash(item['text'])})
            # Smallest whole-clause containment; never stretch a location across gaps.
            # A monotone interval sweep avoids rechecking every section for
            # every clause in long books. Parent clauses never overlap here.
            while index<len(ordered) and ordered[index]['start']<=a:
                candidate=ordered[index];heapq.heappush(active,(candidate['end']-candidate['start'],candidate['kind']=='document-representation',candidate['version_id'],index));index+=1
            while active and ordered[active[0][3]]['end']<b:heapq.heappop(active)
            if not active:raise ValueError('No section contains extracted clause')
            r=ordered[active[0][3]]
            qa,qb=r['start']-envelope['start'],r['end']-envelope['start']
            segment_key=(r['version_id'],r['ordinal'])
            if segment_key not in verified_segments:
                if 0<=qa<=qb<=len(body) and text_hash(body[qa:qb])!=r['span_sha256']:raise StaleInput('Selected section hash changed')
                verified_segments.add(segment_key)
            if r['kind']=='document-representation':item['uncertainty'].append('coarse document/page representation fallback; no native argument boundary')
            record={**item,'id':ident,'start':a,'end':b,'row':r,'source_key':source_key,'envelope_start':envelope['start']};records.append(record)
    for path,(h,coordinate) in sources.items():
        p=Path(path);s=p.stat()
        db.execute('INSERT INTO dependencies VALUES(?,?,?,?,?,?)',(rid,doc,'source',path,h,packed({'size':s.st_size,'mtime_ns':s.st_mtime_ns,'coordinate':coordinate})))
    for item in sorted(records,key=lambda x:(x['source_key'],x['start'],x['end'])):
        r=item['row'];ident=item['id'];context_key=(r['version_id'],item['source_key'])
        def insert(it,identifier,a,b,kind=None):
            db.execute('INSERT INTO statements VALUES('+','.join('?'*19)+')',(identifier,rid,doc,r['version_id'],r['ordinal'],a,b,it['text'],text_hash(it['text']),kind or it['kind'],it['speaker_label'],it['speaker_role'],it['attribution_basis'],it['endorsement'],it['negation'],'rule-candidate',packed(it['uncertainty']),r['work_id'],r['edition_id']))
            db.execute('INSERT INTO source_spans VALUES(?,?,?,?,?,?,?,?,?,?)',(identifier,r['coordinate'],r['path'],r['asset_sha256'],r['block_ordinal'],r['locator'],r['start'],r['end'],r['block_text_sha256'],r['span_sha256']))
            db.execute('INSERT INTO statement_search VALUES(?,?,?)',(identifier,rid,it['text']));stats['statements']+=1
        insert(item,ident,item['start'],item['end'])
        for q in item['qualifications']:
            qa,qb=item['envelope_start']+q['start'],item['envelope_start']+q['end'];qid='qual-'+digest([ident,qa,qb,q['kind']])
            db.execute('INSERT INTO qualifications VALUES(?,?,?,?,?,?,?,?)',(qid,ident,q['kind'],qa,qb,q['literal'],text_hash(q['literal']),'scope-candidate'));stats['qualifications']+=1
        for q in item['quotes']:
            qa,qb=item['envelope_start']+q['start'],item['envelope_start']+q['end'];qid='quote-'+digest([ident,qa,qb])
            insert(q,qid,qa,qb);links.append((ident,qid,'contains-quotation','literal quotation delimiters'))
            # Quoted clauses keep their own limiting witnesses. The parent
            # suffix cannot escape the quotation's exact source interval.
            for limitation in item['qualifications']:
                la=item['envelope_start']+limitation['start'];lb=min(qb,item['envelope_start']+limitation['end'])
                if not qa<=la<lb<=qb:continue
                literal=item['text'][la-item['start']:lb-item['start']]
                lid='qual-'+digest([qid,la,lb,limitation['kind']])
                db.execute('INSERT INTO qualifications VALUES(?,?,?,?,?,?,?,?)',(lid,qid,limitation['kind'],la,lb,literal,text_hash(literal),'scope-candidate'));stats['qualifications']+=1
        if item['kind']=='objection':last_objection[context_key]=(ident,item['start'])
        elif item['kind']=='reply':
            previous=last_objection.get(context_key)
            if previous and 0<=item['start']-previous[1]<=CONFIG['limits']['link_distance']:
                links.append((ident,previous[0],'reply-to-candidate','nearest prior explicit objection in same selected section/source block'))
            last_reply[context_key]=(ident,item['start'])
        elif item['kind']=='premise-candidate':
            previous=last_reply.get(context_key)
            if previous and 0<=item['start']-previous[1]<=CONFIG['limits']['link_distance']:links.append((ident,previous[0],'supports-candidate','because cue following reply; logical relation unreviewed'))
    for a,b,k,basis in links:db.execute('INSERT INTO argument_links VALUES(?,?,?,?,?,?,?)',('link-'+digest([rid,a,b,k]),rid,a,b,k,basis,'structural-candidate'))
    stats['links']=len(links)
    if not chosen:stats['no-supported-internal-section']=1
    stats['included-coarse-representation-segments']=sum(r['kind']=='document-representation' for r in chosen)
    stats['excluded-heading-candidate-segments']=sum(r['state']=='candidate-unreviewed' for r in rows)
    db.execute('INSERT INTO document_results VALUES(?,?,?,?,?,?,?,?,?,?,?)',(rid,doc,len(sections),stats['segments'],stats['characters'],stats['clauses'],stats['statements'],stats['qualifications'],stats['links'],packed({k:v for k,v in stats.items() if k not in ['segments','characters','clauses','statements','qualifications','links']}),time.monotonic()-started))
    return stats['statements']+stats['qualifications']+stats['links']

def counts(db,rid):
    result=dict(db.execute('SELECT count(*) processed_documents,coalesce(sum(sections),0) sections,coalesce(sum(segments),0) segments,coalesce(sum(characters),0) overlapping_section_characters,coalesce(sum(clauses),0) clauses,coalesce(sum(statements),0) statements,coalesce(sum(qualifications),0) qualifications,coalesce(sum(links),0) links,coalesce(sum(seconds),0) processor_seconds FROM document_results WHERE run_id=?',(rid,)).fetchone())
    result['jobs']=[dict(r) for r in db.execute('SELECT state,count(*) n FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY state',(rid,))];return result

def run(calibration=False,resume=False,limit=None):
    ROOT.mkdir(parents=True,exist_ok=True);background_priority();started=time.monotonic();inputs=None;store=None
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        shared.acquire();inputs=Inputs();inputs.check();c=contract(inputs,calibration);rid='kr130-'+digest(c)[:24]+('-calibration' if calibration else '')
        store=JobStore(ROOT/'arguments.sqlite3');store.acquire();db=store.db;db.executescript(SCHEMA+RECONSTRUCTION_SCHEMA);db.execute('PRAGMA cache_size=-262144')
        old=db.execute('SELECT state,contract_json FROM argument_runs WHERE id=?',(rid,)).fetchone()
        if resume:
            recent=db.execute("SELECT id,contract_json FROM argument_runs WHERE json_extract(contract_json,'$.calibration')=? ORDER BY rowid DESC LIMIT 1",(calibration,)).fetchone()
            if recent and json.loads(recent['contract_json'])!=c:raise StaleInput('Changed inputs/code/config: resume refuses generation mixing; explicit new generation required')
        if old and old['state']=='population-complete':print(packed({'run_id':rid,'unchanged':True}));return
        if old and not resume:raise ValueError('Existing generation requires --resume')
        if not calibration:
            cal='kr130-'+digest({**c,'calibration':True})[:24]+'-calibration'
            ready=db.execute('SELECT state FROM argument_runs WHERE id=?',(cal,)).fetchone()
            if not ready or ready[0]!='population-complete':raise ValueError('Matching completed calibration required')
        with db:
            # Correct interrupted failed-attempt metadata without changing old
            # facts/checkpoints or hiding its failed jobs.
            db.execute("UPDATE argument_runs SET state='failed' WHERE state='running' AND id!=? AND EXISTS(SELECT 1 FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=argument_runs.id AND j.state IN ('failed','stale'))",(rid,))
            db.execute('INSERT OR IGNORE INTO argument_runs VALUES(?,?,?,NULL)',(rid,'running',packed(c)))
        def job(scope,writer):
            ident=digest([rid,scope]);store.register(rid,ident,'arguments',scope,ident,VERSION)
            result=store.execute(ident,writer)
            if result in ('failed','stale'):raise RuntimeError(packed(dict(db.execute('SELECT * FROM jobs WHERE id=?',(ident,)).fetchone())))
        job('scope-capture',lambda db:capture(inputs,db,rid,calibration))
        rows=db.execute("SELECT * FROM scope WHERE run_id=? AND disposition='supported' ORDER BY coalesce(json_extract(descriptor_json,'$.xml_link.asset_path'),document_id),document_id",(rid,)).fetchall()
        completed={r[0] for r in db.execute('SELECT document_id FROM document_results WHERE run_id=?',(rid,))};processed=0
        def progress(state):
            receipt={'run_id':rid,'state':state,'pid':os.getpid(),'process_token':process_identity(os.getpid()),'expected_documents':len(rows),'seconds_this_attempt':time.monotonic()-started,**counts(db,rid)}
            write_json(ROOT/'progress.json',receipt);print(packed(receipt),flush=True);shared.heartbeat()
        progress('running')
        pending=[]
        def flush():
            if not pending:return
            records=[];work=[]
            for row in pending:
                scope='document:'+row['document_id'];ident=digest([rid,scope]);records.append((rid,ident,'arguments',scope,ident,VERSION));work.append((ident,lambda db,row=row:process(inputs,db,rid,row)))
            store.register_many(records);result=store.execute_many(work,max_jobs=16)
            pending.clear()
            if any(v in ('failed','stale') for v in result.values()):
                with db:db.execute("UPDATE argument_runs SET state='failed' WHERE id=?",(rid,))
                raise RuntimeError('Atomic argument batch failed: '+packed(result))
        for row in rows:
            if row['document_id'] in completed:continue
            pending.append(row);processed+=1
            if len(pending)==16:flush()
            if processed%128==0:progress('running')
            if (limit and processed>=limit) or (ROOT/'cancel.request').exists():
                flush()
                with db:db.execute("UPDATE argument_runs SET state='interrupted' WHERE id=?",(rid,))
                progress('interrupted');return
        flush()
        inputs.check();summary={'run_id':rid,'state':'population-complete','contract':c,'counts':counts(db,rid),'scope':[dict(r) for r in db.execute('SELECT disposition,reason,count(*) documents FROM scope WHERE run_id=? GROUP BY disposition,reason',(rid,))],'sqlite_quick_check':db.execute('PRAGMA quick_check').fetchone()[0],'seconds_this_attempt':time.monotonic()-started,'database':str(store.path),'quality':'pending content review; all statements remain candidates'}
        if summary['counts']['processed_documents']!=len(rows) or summary['sqlite_quick_check']!='ok':raise RuntimeError('Population/integrity failure')
        with db:db.execute('UPDATE argument_runs SET state=?,summary_json=? WHERE id=?',('population-complete',packed(summary),rid))
        write_json(ROOT/('calibration.json' if calibration else 'population.json'),summary);progress('population-complete')
    finally:
        if store:store.close()
        if inputs:inputs.close()
        shared.close()

def main():
    p=argparse.ArgumentParser();p.add_argument('--calibrate',action='store_true');p.add_argument('--run',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--status',action='store_true');a=p.parse_args()
    if a.status:print((ROOT/'progress.json').read_text('utf-8'))
    elif a.calibrate or a.run:run(a.calibrate,a.resume,a.limit)
    else:p.error('Select --calibrate, --run or --status')
if __name__=='__main__':main()
