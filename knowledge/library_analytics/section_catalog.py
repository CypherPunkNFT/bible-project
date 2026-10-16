"""KR-100/101: CPU section catalogue on an immutable LA-02/03 selection.

Run from Website: python -m knowledge.library_analytics.section_catalog --calibrate
then --run. --resume reuses committed jobs; --query TEXT returns sections;
--section VERSION_ID reconstructs witnesses. Nothing touches the live corpus,
vectors, graph, downloads or public reader packages.
"""
import argparse
import hashlib
import io
import json
import os
import sqlite3
import subprocess
import sys
import time
import zipfile
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from .build import PROJECT,readonly,dump,now
from .inputs import packed,digest
from .jobs import JobStore,StaleInput,background_priority
from .section_contract import (VERSION,SCHEMA,SectionWriter,checked_bytes,
    cache_blocks,text_hash,xml_render,html_render,resolve_segment)
from .research_evaluation import questions,TARGETS,VERSION as EVAL_VERSION
from .xml_bridge import entries,stripped_digest


def output(project=PROJECT):
    return Path(project)/'KnowledgeBase/library-knowledge/connected-research'


class Snapshot:
    def __init__(self,project):
        self.project=Path(project);root=self.project/'KnowledgeBase/library-analytics'
        p=json.loads((root/'latest-analytical-release.json').read_text('utf-8-sig'))['parent']
        summary_raw=Path(p['summary']).read_bytes();self.summary=json.loads(summary_raw)
        if self.summary['state']!='complete':raise ValueError('Complete analytical parent required')
        self.parent=p
        self.bundle=self.summary['text_bundle']
        self.products=readonly(Path(p['database']));self.text=readonly(Path(self.bundle['database']))
        row=self.products.execute('SELECT state FROM product_runs WHERE id=?',(p['run_id'],)).fetchone()
        if not row or row[0]!='complete':raise ValueError('Selected analytical generation is not complete')
        self.contract={'processor':VERSION,'evaluation_version':EVAL_VERSION,
            'analytical_parent':p,'analytical_summary_sha256':hashlib.sha256(summary_raw).hexdigest(),
            'text_bundle':self.bundle,'questions_sha256':digest(questions()),'targets':TARGETS,
            'scope':'Every captured descriptor accounted; supported immutable cache and verified XML entry adapters processed.',
            'input_policy':'No live corpus reads; frozen older generation; later intake requires a new run.',
            'coordinate_unit':'Unicode codepoint; half-open intervals','cpu_workers':1,
            'body_copies':False,'vectors_touched':False,'public_output':False}

    def close(self):self.products.close();self.text.close()


def capture(snapshot,db,run):
    parent=snapshot.parent['run_id'];n=0
    links={r['document_id']:dict(r) for r in snapshot.products.execute('''SELECT x.* FROM xml_entry_links x
        JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=? AND x.state='verified-source-entry' ''',(parent,))}
    proofs={}
    for component in snapshot.bundle['run_ids']:
        for r in snapshot.text.execute('SELECT * FROM text_input_files WHERE run_id=?',(component,)):
            proofs[(component,r['document_id'],r['path'])]=dict(r)
    rows=[]
    for row in snapshot.products.execute('SELECT * FROM document_dimensions WHERE run_id=? ORDER BY document_id',(parent,)):
        d=json.loads(row['descriptor_json']);doc=d['document_id']
        if d['status']=='excluded' or d.get('excluded_archive'):
            adapter='none';disposition='excluded';reason='documented-excluded-archive'
        elif doc in links:
            adapter='xml-entry';disposition='supported';reason='verified selected-generation XML entry'
            d['xml_link']=links[doc]
        elif d.get('cache_path'):
            proof=proofs.get((d['text_run_id'],doc,d['cache_path']))
            if proof:
                adapter='cache';disposition='supported';reason='verified captured extraction-cache'
                d['cache_expected_sha256']=proof['sha256']
            else:
                adapter='none';disposition='deferred';reason='cache-proof-unavailable'
        else:
            adapter='none';disposition='deferred';reason='no-immutable-source-text-adapter; live-corpus-adapter-excluded'
        if disposition!='supported':
            d={k:d.get(k) for k in ('document_id','kind','title','language','source_path','source_family',
                'original_sha256','work_id','edition_id','text_run_id','text_job_id','metadata_sha256')}
        rows.append((run,doc,adapter,disposition,reason,packed(d)))
        n+=1
        if len(rows)>=500:
            db.executemany('INSERT INTO research_scope VALUES(?,?,?,?,?,?)',rows);rows.clear()
    if rows:db.executemany('INSERT INTO research_scope VALUES(?,?,?,?,?,?)',rows)
    return n


def register_input(db,run,proof):
    old=db.execute('SELECT sha256,size,mtime_ns FROM research_inputs WHERE run_id=? AND path=?',(run,proof[0])).fetchone()
    if old and tuple(old)!=(proof[1],proof[2],proof[3]):raise StaleInput('Representation changed within run')
    db.execute('INSERT OR IGNORE INTO research_inputs VALUES(?,?,?,?,?)',(run,*proof))


def epub_sections(writer,raw,blocks):
    """Verify native EPUB order and member bodies against the frozen cache."""
    import posixpath
    from urllib.parse import unquote
    from pathlib import PurePosixPath
    from lxml import etree
    parser=etree.XMLParser(resolve_entities=False,no_network=True)
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        container=etree.fromstring(archive.read('META-INF/container.xml'),parser)
        opf=container.xpath("//*[local-name()='rootfile']/@full-path")[0]
        package=etree.fromstring(archive.read(opf),parser)
        manifest={n.get('id'):n for n in package.xpath("//*[local-name()='manifest']/*")}
        spine=package.xpath("//*[local-name()='spine']/*")
        ordered=[(manifest[n.get('idref')],True) for n in spine]
        ordered.extend((n,False) for n in manifest.values() if all(n is not x[0] for x in ordered)
            and n.get('media-type') in ('application/xhtml+xml','text/html'))
        members=[];seen=set()
        for index,(node,in_spine) in enumerate(ordered,1):
            target=posixpath.normpath(str(PurePosixPath(opf).parent/unquote(node.get('href').split('#')[0])))
            if target in seen:continue
            seen.add(target);members.append((index,target,in_spine))
        if len(members)!=len(blocks):raise ValueError('EPUB member/cache population differs')
        position=0;native=0
        # Validate all members before persisting anything to avoid a partially
        # native tree followed by duplicated fallback containers.
        planned=[]
        for block,(index,target,in_spine) in zip(blocks,members):
            locator=f'EPUB section {index}: {target}'
            if block.get('locator')!=locator:raise ValueError('EPUB native member order differs from cache')
            body,headings=html_render(archive.read(target))
            if body!=block['text']:raise ValueError('EPUB member text differs from cache')
            planned.append((block,target,in_spine,position,headings));position+=len(body)
        for block,target,in_spine,position,headings in planned:
            key='epub-member:'+target;end=position+len(block['text'])
            writer.add(key,'epub-spine-item' if in_spine else 'epub-supplementary-item',target,position,end,'document',
                state='verified-native-container; semantic meaning unreviewed',metadata={'member':target,'in_spine':in_spine})
            native+=1
            for h in headings:
                writer.add(key+'/'+h['key'],h['kind'],h['heading'],position+h['start'],position+h['end'],
                    key+'/'+h['parent'] if h['parent'] else key)
                native+=1
            if not headings:writer.candidates(key,position,end,key)
        return native


def document(db,run,d):
    raw,proof=checked_bytes(d['cache_path'],d['cache_expected_sha256']);register_input(db,run,proof)
    blocks=cache_blocks(raw);stream=hashlib.sha256()
    for b in blocks:
        stream.update(packed({'ordinal':b['ordinal'],'locator':b.get('locator'),'sha256':text_hash(b['text']),'id':b.get('id')}).encode())
    if stream.hexdigest()!=d['quality']['body_stream_sha256']:
        raise StaleInput('Block stream differs from selected text generation')
    writer=SectionWriter(db,run,d,proof[1],blocks,'extraction-cache-block',d['cache_path'],proof[1])
    writer.add('document','document-representation',d['title'],0,writer.total,
        state='representation-boundary; no semantic segmentation claim',
        metadata={'recorded_genre':d.get('genre'),'memberships':d.get('memberships',[]),
            'author_label':d.get('author_label'),'credit_and_reader_metadata':d.get('readers',[]),
            'source_family':d.get('source_family'),'language':d.get('language')})
    gaps=[];native_count=0;extra_count=extra_segments=0
    source=Path(d['source_path']);suffix=source.suffix.lower()
    if suffix in ('.xml','.html','.htm','.xhtml'):
        try:
            original,op=checked_bytes(source,d.get('original_sha256'))
            if not d.get('original_sha256'):raise ValueError('Native original hash assertion unavailable')
            if len(original)>64*1024*1024:raise ValueError('Native markup exceeds 64 MiB bound')
            register_input(db,run,op)
            rendered,items=xml_render(original) if suffix=='.xml' else html_render(original)
            aligned=len(blocks)==1 and rendered==blocks[0]['text']
            if aligned:
                target=writer
            else:
                target=SectionWriter(db,run,d,op[1],[{'text':rendered,'ordinal':0,'locator':'native-rendered-source'}],
                    'original-xml-rendered' if suffix=='.xml' else 'original-html-rendered',str(source),op[1])
                target.add('document','document-representation',d['title'],0,len(rendered),
                    state='native-rendering; cache alignment unresolved')
                gaps.append('native-to-cache-text-alignment-unresolved; native offsets remain independently reconstructable')
            target.native(items)
            native_count=len(items)
            if target is not writer:extra_count=target.count;extra_segments=target.segments
        except (ValueError,OSError,RecursionError) as exc:
            if isinstance(exc,StaleInput):raise
            gaps.append('native-markup-deferred:'+type(exc).__name__+':'+str(exc)[:200])
    native_epub=False
    if suffix=='.epub':
        try:
            original,op=checked_bytes(source,d.get('original_sha256'))
            if not d.get('original_sha256'):raise ValueError('Native original hash assertion unavailable')
            register_input(db,run,op);native_count=epub_sections(writer,original,blocks);native_epub=True
        except (ValueError,OSError,zipfile.BadZipFile,KeyError,IndexError) as exc:
            gaps.append('native-epub-deferred:'+type(exc).__name__+':'+str(exc)[:200])
    position=0
    for block in blocks:
        locator=block.get('locator','');end=position+len(block['text'])
        if locator.startswith('EPUB section ') and not native_epub:
            # This is the recorded extractor container, never an invented
            # chapter. Source member verification/native headings are KR-102
            # dependencies when EPUB markup is not captured independently.
            key='epub-container:'+str(block['ordinal'])
            writer.add(key,'epub-container',locator,position,end,'document',
                state='recorded-extraction-container; chapter meaning unreviewed')
            writer.candidates(key,position,end,'epub:'+str(block['ordinal']))
            native_count+=1
        position=end
    candidates=0
    if not native_count:
        candidates=writer.candidates()
        if not candidates:gaps.append('no-supported-internal-boundaries; document representation retained')
    if any(b.get('page') is not None for b in blocks):
        gaps.append('PDF pages retained as span coordinates; heading boundaries remain unreviewed candidates')
    state='native-sections' if native_count else 'candidate-sections' if candidates else 'representation-only'
    db.execute('INSERT OR REPLACE INTO research_documents VALUES(?,?,?,?,?,?,?)',
        (run,d['document_id'],state,'cache',writer.count+extra_count,writer.segments+extra_segments,packed(gaps)))
    return writer.count+extra_count


def xml_asset(db,run,path,descriptors):
    expected=descriptors[0]['xml_link']['asset_sha256'];raw,proof=checked_bytes(path,expected)
    register_input(db,run,proof)
    targets={d['xml_link']['entry_key']:d for d in descriptors};found=set();n=0
    for key,locators,body in entries(Path(path)):
        if key not in targets:continue
        d=targets[key];link=d['xml_link'];found.add(key)
        if stripped_digest(body)!=json.loads(link['evidence_json'])['source_prose_sha256_without_whitespace']:
            raise StaleInput('Entry prose differs from verified selected-generation witness')
        if locators!=json.loads(link['locators_json']):raise StaleInput('Entry native locators differ')
        writer=SectionWriter(db,run,d,proof[1],[{'text':body,'ordinal':0,'locator':key}],
            'original-xml-entry',str(path),proof[1])
        writer.add('entry:'+key,'native-reference-entry',d['title'],0,len(body),
            metadata={'native_locators':locators,'selected_xml_proof':link['evidence_json'],
                'language':d.get('language'),'source_family':d.get('source_family'),
                'memberships':d.get('memberships',[])})
        db.execute('INSERT OR REPLACE INTO research_documents VALUES(?,?,?,?,?,?,?)',
            (run,d['document_id'],'native-sections','xml-entry',writer.count,writer.segments,'[]'))
        n+=writer.count
    if found!=targets.keys():raise ValueError('Missing native entry keys')
    _,after=checked_bytes(path,expected)
    if proof!=after:raise StaleInput('XML asset changed during processing')
    return n


def calibration_scope(db,run):
    selected={};strata={}
    for r in db.execute("SELECT document_id,adapter,descriptor_json FROM research_scope WHERE run_id=? AND disposition='supported' ORDER BY document_id",(run,)):
        d=json.loads(r['descriptor_json']);suffix=Path(d['source_path']).suffix.lower()
        # Two members per available adapter/format/source stratum, including
        # source-defined XML dictionaries. Cap language variation, not scope.
        key=(r['adapter'],suffix,d.get('source_family'),
            d['xml_link']['asset_path'] if r['adapter']=='xml-entry' else None)
        strata[key]=strata.get(key,0)+1
        if strata[key]<=2:selected[r['document_id']]=True
    db.execute('CREATE TEMP TABLE calibration_ids(id TEXT PRIMARY KEY)')
    db.executemany('INSERT INTO calibration_ids VALUES(?)',[(doc,) for doc in selected])
    db.execute("UPDATE research_scope SET disposition='outside-calibration',reason='not selected for source-stratified calibration' WHERE run_id=? AND disposition='supported' AND document_id NOT IN (SELECT id FROM calibration_ids)",(run,))
    db.execute('DROP TABLE calibration_ids')
    return len(selected)


def counts(db,run):
    return {'scope':[dict(r) for r in db.execute('SELECT adapter,disposition,reason,count(*) documents FROM research_scope WHERE run_id=? GROUP BY adapter,disposition,reason',(run,))],
        'documents':[dict(r) for r in db.execute('SELECT adapter,state,count(*) documents FROM research_documents WHERE run_id=? GROUP BY adapter,state',(run,))],
        'section_kinds':[dict(r) for r in db.execute('SELECT s.kind,s.state,count(*) sections FROM sections s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=? GROUP BY s.kind,s.state',(run,))],
        'sections':db.execute('SELECT count(*) FROM run_sections WHERE run_id=?',(run,)).fetchone()[0],
        'segments':db.execute('SELECT count(*) FROM section_segments s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=?',(run,)).fetchone()[0],
        'jobs':[dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(run,))]}


def validation(db,run):
    expected=db.execute("SELECT count(*) FROM research_scope WHERE run_id=? AND disposition='supported'",(run,)).fetchone()[0]
    actual=db.execute('SELECT count(*) FROM research_documents WHERE run_id=?',(run,)).fetchone()[0]
    bad=db.execute("SELECT count(*) FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'",(run,)).fetchone()[0]
    dangling=db.execute('''SELECT count(*) FROM sections s JOIN run_sections r ON r.version_id=s.version_id
        LEFT JOIN sections p ON p.version_id=s.parent_version_id WHERE r.run_id=? AND s.parent_version_id IS NOT NULL AND p.version_id IS NULL''',(run,)).fetchone()[0]
    outside_parent=db.execute('''SELECT count(*) FROM sections s JOIN run_sections r ON r.version_id=s.version_id
        JOIN section_segments c ON c.version_id=s.version_id WHERE r.run_id=? AND s.parent_version_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM section_segments p WHERE p.version_id=s.parent_version_id AND p.coordinate=c.coordinate
        AND p.path=c.path AND p.asset_sha256=c.asset_sha256 AND p.block_ordinal=c.block_ordinal
        AND p.start<=c.start AND p.end>=c.end)''',(run,)).fetchone()[0]
    changed=[]
    for r in db.execute('SELECT * FROM research_inputs WHERE run_id=?',(run,)):
        p=Path(r['path'])
        if not p.is_file() or (p.stat().st_size,p.stat().st_mtime_ns)!=(r['size'],r['mtime_ns']):changed.append(str(p))
    # Each generated span was bounded, hashed and parent-checked inside its
    # atomic writer. Independently reconstruct samples of each coordinate/kind.
    witnesses=[];prepared={}
    groups=db.execute('''SELECT s.kind,g.coordinate,min(s.version_id) version FROM sections s
        JOIN run_sections r ON r.version_id=s.version_id JOIN section_segments g ON g.version_id=s.version_id
        WHERE r.run_id=? GROUP BY s.kind,g.coordinate''',(run,)).fetchall()
    for g in groups:
        for segment in db.execute('SELECT * FROM section_segments WHERE version_id=? ORDER BY ordinal',(g['version'],)):
            try:
                text=resolve_segment(segment,prepared);witnesses.append({'version_id':g['version'],'kind':g['kind'],
                    'coordinate':g['coordinate'],'ordinal':segment['ordinal'],'characters':len(text),'ok':True})
            except (Exception,) as exc:
                witnesses.append({'version_id':g['version'],'coordinate':g['coordinate'],'ok':False,'error':str(exc)})
    integrity=db.execute('PRAGMA quick_check').fetchone()[0]
    return {'ok':expected==actual and not bad and not dangling and not outside_parent and not changed and integrity=='ok' and all(w['ok'] for w in witnesses),
        'expected_supported_documents':expected,'accounted_supported_documents':actual,
        'failed_or_unfinished_jobs':bad,'dangling_parents':dangling,'parent_containment_failures':outside_parent,'changed_input_files':changed,
        'sqlite_quick_check':integrity,'independent_roundtrip_samples':witnesses,
        'every_generated_span':'writer checked half-open bounds, parent containment and source/stream hashes',
        'review':'structural verification only; human boundary/attribution/relevance review remains pending'}


def export(store,run,root,elapsed):
    db=store.db;checks=validation(db,run);record=db.execute('SELECT * FROM research_runs WHERE id=?',(run,)).fetchone()
    folder=root/'releases'/run;folder.mkdir(parents=True,exist_ok=True)
    summary={'run_id':run,'state':'complete' if checks['ok'] else 'needs-review','created_at':now(),
        'contract':json.loads(record['contract_json']),'counts':counts(db,run),'validation':checks,
        'seconds':round(elapsed,2),'database':str(store.path),'live_mutations':0,
        'limits':['Named older input generation; current intake is outside this release.',
            'Document representations, native containers and heading candidates are counted separately.',
            'No exact chunk/reader alignment, argument attribution, concept retrieval or influence claims.',
            'Reserved questions are frozen intents; no relevance scores or gold answers are invented.']}
    manifest=[]
    queries={
        'sections':('SELECT s.* FROM sections s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=? ORDER BY s.document_id,s.native_key',(run,)),
        'section_segments':('SELECT s.* FROM section_segments s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=? ORDER BY s.version_id,s.ordinal',(run,)),
        'documents':('SELECT * FROM research_documents WHERE run_id=? ORDER BY document_id',(run,)),
        'scope_dispositions':('SELECT document_id,adapter,disposition,reason FROM research_scope WHERE run_id=? ORDER BY document_id',(run,)),
        'input_dependencies':('SELECT * FROM research_inputs WHERE run_id=? ORDER BY path',(run,)),
        'failed_jobs':("SELECT j.* FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'",(run,))}
    for name,(sql,args) in queries.items():
        path=folder/(name+'.jsonl');h=hashlib.sha256();n=0
        with path.open('wb') as f:
            for row in db.execute(sql,args):
                raw=(packed(dict(row))+'\n').encode();f.write(raw);h.update(raw);n+=1
        manifest.append({'name':path.name,'sha256':h.hexdigest(),'bytes':path.stat().st_size,'rows':n})
    dump(folder/'summary.json',summary)
    manifest.append({'name':'summary.json','sha256':hashlib.sha256((folder/'summary.json').read_bytes()).hexdigest()})
    dump(folder/'release_manifest.json',{'run_id':run,'files':manifest})
    with db:db.execute('UPDATE research_runs SET state=?,summary_json=? WHERE id=?',(summary['state'],packed(summary),run))
    if checks['ok'] and not summary['contract']['calibration']:
        dump(root/'latest-sections.json',{'run_id':run,'database':str(store.path),'summary':str(folder/'summary.json'),'release':str(folder)})
    dump(root/'section-progress.json',{'phase':'finished','run_id':run,'state':summary['state'],'counts':summary['counts']})
    return summary


def run(project=PROJECT,calibrate=False,resume=False,limit=None):
    root=output(project);background_priority();started=time.monotonic()
    shared=JobStore(Path(project)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    store=snapshot=None;run_id=None
    try:
        shared.acquire();store=JobStore(root/'sections.sqlite3');store.acquire();store.db.executescript(SCHEMA)
        # Acquiring the exclusive live-process lease proves any earlier
        # running run was abandoned. Its committed rows remain historical.
        with store.db:store.db.execute("UPDATE research_runs SET state='interrupted' WHERE state='running'")
        snapshot=Snapshot(project);snapshot.contract['calibration']=calibrate
        run_id='kr101-'+digest(snapshot.contract)[:24]+('-calibration' if calibrate else '')
        if not calibrate:
            calibration_contract={**snapshot.contract,'calibration':True}
            calibration_id='kr101-'+digest(calibration_contract)[:24]+'-calibration'
            cal=store.db.execute('SELECT state FROM research_runs WHERE id=?',(calibration_id,)).fetchone()
            if not cal or cal[0]!='complete':raise ValueError('Matching source-stratified calibration must complete first')
        existing=store.db.execute('SELECT * FROM research_runs WHERE id=?',(run_id,)).fetchone()
        if existing and existing['state']=='complete':
            changed=[]
            for r in store.db.execute('SELECT * FROM research_inputs WHERE run_id=?',(run_id,)):
                p=Path(r['path'])
                if not p.is_file() or (p.stat().st_size,p.stat().st_mtime_ns)!=(r['size'],r['mtime_ns']):changed.append(str(p))
            if changed:
                print(packed({'state':'stale-inputs','run_id':run_id,'changed_input_files':changed}),flush=True);return 2
            print(packed({'state':'complete','run_id':run_id,'unchanged':True}),flush=True);return 0
        if existing and not resume:raise ValueError('Unfinished generation exists; use --resume')
        with store.db:
            store.db.execute('INSERT OR IGNORE INTO research_runs VALUES(?,?,?,?,NULL)',(run_id,'running',now(),packed(snapshot.contract)))
            store.db.execute("UPDATE research_runs SET state='running' WHERE id=?",(run_id,))
        job=digest({'capture':run_id})
        store.register(run_id,job,'section-capture','capture',digest(snapshot.contract),VERSION)
        if store.execute(job,lambda db:capture(snapshot,db,run_id)) in ('failed','stale'):raise RuntimeError('Scope capture failed')
        evaluation=root/'evaluations'/run_id;evaluation.mkdir(parents=True,exist_ok=True)
        question_path=evaluation/'questions.jsonl';question_bytes=''.join(packed(q)+'\n' for q in questions()).encode()
        if not question_path.exists():question_path.write_bytes(question_bytes)
        elif question_path.read_bytes()!=question_bytes:raise StaleInput('Frozen evaluation questions changed')
        dump(evaluation/'contract.json',{'questions':120,'development':72,'reserved':48,'targets':TARGETS,
            'question_file_sha256':hashlib.sha256(question_bytes).hexdigest(),'source_group_split':'sha256(original asset) modulo 5: 0/1 reserved, others development',
            'label_state':'unreviewed; no retrieval release claim'})
        if calibrate:
            job=digest({'calibration-scope':run_id})
            store.register(run_id,job,'section-calibration','calibration-scope',job,VERSION)
            # Scope selection is inside the same result/checkpoint transaction.
            state=store.execute(job,lambda db:calibration_scope(db,run_id))
            if state in ('failed','stale'):raise RuntimeError('Calibration selection failed')
        total=store.db.execute("SELECT count(*) FROM research_scope WHERE run_id=? AND disposition='supported'",(run_id,)).fetchone()[0]
        print(packed({'phase':'sections','run_id':run_id,'supported_documents':total,'calibration':calibrate}),flush=True)
        done=0;states=Counter()
        last=''
        while True:
            rows=store.db.execute("SELECT * FROM research_scope WHERE run_id=? AND adapter='cache' AND disposition='supported' AND document_id>? ORDER BY document_id LIMIT 32",(run_id,last)).fetchall()
            if not rows:break
            last=rows[-1]['document_id']
            registrations=[];work=[]
            for row in rows:
                d=json.loads(row['descriptor_json']);job=digest({'document':d,'processor':VERSION})
                # Include run in result identity: run_sections/document receipts
                # are committed together. Resume reuses the same selected run.
                job=digest({'job':job,'run':run_id})
                registrations.append((run_id,job,'sections','document:'+d['document_id'],job,VERSION))
                work.append((job,lambda db,d=d:document(db,run_id,d)))
                if limit and done+len(work)>=limit:break
            store.register_many(registrations);results=store.execute_many(work)
            states.update(results.values());done+=len(work)
            if done%128==0 or any(state in ('failed','stale') for state in results.values()):
                stamp={'phase':'sections','run_id':run_id,'documents':done,'supported_documents':total,'jobs':dict(states),'seconds':round(time.monotonic()-started,2)}
                dump(root/'section-progress.json',stamp);print(packed(stamp),flush=True);shared.heartbeat()
            if limit and done>=limit:
                with store.db:store.db.execute("UPDATE research_runs SET state='interrupted' WHERE id=?",(run_id,))
                return 0
        assets=[r[0] for r in store.db.execute("SELECT DISTINCT json_extract(descriptor_json,'$.xml_link.asset_path') FROM research_scope WHERE run_id=? AND adapter='xml-entry' AND disposition='supported' ORDER BY 1",(run_id,))]
        for path in assets:
            docs=[json.loads(r[0]) for r in store.db.execute("SELECT descriptor_json FROM research_scope WHERE run_id=? AND adapter='xml-entry' AND disposition='supported' AND json_extract(descriptor_json,'$.xml_link.asset_path')=? ORDER BY document_id",(run_id,path))]
            job=digest({'run':run_id,'asset':path,'docs':docs,'processor':VERSION})
            store.register(run_id,job,'section-entries','xml:'+path,job,VERSION)
            state=store.execute(job,lambda db:xml_asset(db,run_id,path,docs));states[state]+=1;done+=len(docs)
            print(packed({'phase':'xml-entries','run_id':run_id,'asset':Path(path).name,'documents':done,'state':state}),flush=True);shared.heartbeat()
        # Source-window evaluation rows name independent representations. The
        # split cannot leak duplicate original bytes between development/test.
        with (evaluation/'source-windows.jsonl').open('w',encoding='utf-8') as f:
            for row in store.db.execute('''SELECT s.version_id,s.id,s.kind,s.document_id,s.representation_sha256,g.coordinate,
                g.path,g.asset_sha256,g.block_ordinal,g.locator,g.start,g.end,g.span_sha256,
                coalesce(json_extract(q.descriptor_json,'$.xml_link.asset_sha256'),
                json_extract(q.descriptor_json,'$.original_sha256'),s.representation_sha256) independence_group FROM sections s
                JOIN run_sections r ON r.version_id=s.version_id JOIN section_segments g ON g.version_id=s.version_id
                JOIN research_scope q ON q.run_id=r.run_id AND q.document_id=s.document_id
                WHERE r.run_id=? AND g.ordinal=0 ORDER BY s.version_id''',(run_id,)):
                value=dict(row);value['split']='reserved' if int(value['independence_group'][:8],16)%5 in (0,1) else 'development'
                value['review_state']='automatic-boundary-witness; semantic review pending';f.write(packed(value)+'\n')
        print(packed({'phase':'validate-and-export','run_id':run_id,'documents':done}),flush=True)
        summary=export(store,run_id,root,time.monotonic()-started)
        print(packed({'phase':'finished','run_id':run_id,'state':summary['state'],'counts':summary['counts']}),flush=True)
        return 0 if summary['state']=='complete' else 2
    except BaseException as exc:
        if store and run_id:
            with store.db:store.db.execute('UPDATE research_runs SET state=? WHERE id=?',('interrupted' if isinstance(exc,KeyboardInterrupt) else 'failed',run_id))
        raise
    finally:
        if snapshot:snapshot.close()
        if store:store.close()
        shared.close()


def query(project,term=None,version=None,limit=20,include_candidates=False):
    root=output(project);pointer=json.loads((root/'latest-sections.json').read_text('utf-8-sig'))
    db=readonly(Path(pointer['database']))
    try:
        if version:
            row=db.execute('''SELECT s.* FROM sections s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=? AND s.version_id=?''',(pointer['run_id'],version)).fetchone()
            if not row:raise ValueError('Section not in selected release')
            spans=[dict(r) for r in db.execute('SELECT * FROM section_segments WHERE version_id=? ORDER BY ordinal',(version,))]
            prepared={}
            return {'run_id':pointer['run_id'],'section':dict(row),'witnesses':[{**s,'text':resolve_segment(s,prepared)} for s in spans]}
        rows=db.execute('''SELECT s.version_id,s.id,s.document_id,s.kind,s.heading,s.state,s.parent_version_id,s.work_id,s.edition_id
            FROM sections s JOIN run_sections r ON r.version_id=s.version_id WHERE r.run_id=? AND s.kind!='document-representation'
            AND (? OR s.state!='candidate-unreviewed') AND s.heading LIKE ? ORDER BY s.document_id,s.native_key LIMIT ?''',
            (pointer['run_id'],int(include_candidates),'%'+(term or '')+'%',limit)).fetchall()
        return {'run_id':pointer['run_id'],'sections':[dict(r) for r in rows],
            'include_candidates':include_candidates,'query_method':'literal heading substring; no semantic retrieval or relevance claim'}
    finally:db.close()


def launch(args):
    root=output();root.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,'-u','-m',__spec__.name,'--run']
    if args.resume:command.append('--resume')
    flags=0x00000008|0x08000000 if os.name=='nt' else 0
    with (root/'section-run.log').open('ab') as log:
        child=subprocess.Popen(command,cwd=Path(PROJECT)/'Website',stdin=subprocess.DEVNULL,
            stdout=log,stderr=subprocess.STDOUT,creationflags=flags,close_fds=True)
    receipt={'pid':child.pid,'created_at':now(),'command':command,'log':str(root/'section-run.log')}
    dump(root/'section-launch.json',receipt);print(packed(receipt))


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--run',action='store_true');p.add_argument('--calibrate',action='store_true')
    p.add_argument('--resume',action='store_true');p.add_argument('--launch',action='store_true')
    p.add_argument('--limit',type=int);p.add_argument('--query');p.add_argument('--section');p.add_argument('--status',action='store_true')
    p.add_argument('--include-candidates',action='store_true')
    args=p.parse_args()
    if args.launch:launch(args)
    elif args.status:print((output()/'section-progress.json').read_text('utf-8-sig'))
    elif args.query is not None or args.section:print(packed(query(PROJECT,args.query,args.section,include_candidates=args.include_candidates)))
    elif args.run or args.calibrate:raise SystemExit(run(calibrate=args.calibrate,resume=args.resume,limit=args.limit))
    else:p.error('Choose --calibrate, --run, --status, --query or --section')
