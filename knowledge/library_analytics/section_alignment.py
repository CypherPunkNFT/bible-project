"""KR-102: resumable CPU source-section/chunk/reader alignment; no vector writes."""
import argparse
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path
from urllib.parse import quote
from .build import PROJECT, readonly, dump, now
from .inputs import digest, packed
from .jobs import JobStore, StaleInput, background_priority, process_identity
from .section_contract import checked_bytes, cache_blocks, text_hash, xml_render, html_render
from .xml_bridge import entries
from .alignment_contract import VERSION, SCHEMA, TextMap, bounds, compact


def output(project=PROJECT):
    return Path(project)/'KnowledgeBase/library-knowledge/connected-research/alignment'


def register_input(db, run, proof):
    old = db.execute('SELECT sha256,size,mtime_ns FROM alignment_inputs WHERE run_id=? AND path=?', (run,proof[0])).fetchone()
    if old and tuple(old) != tuple(proof[1:]): raise StaleInput('Input changed within alignment run: '+proof[0])
    db.execute('INSERT OR IGNORE INTO alignment_inputs VALUES(?,?,?,?,?)', (run,*proof))


class Snapshot:
    def __init__(self, project):
        self.project=Path(project); self.site=self.project/'Website'
        self.root=self.project/'KnowledgeBase/library-knowledge/connected-research'
        self.pointer=json.loads((self.root/'latest-sections.json').read_text('utf-8-sig'))
        summary_raw=Path(self.pointer['summary']).read_bytes(); summary=json.loads(summary_raw)
        if summary['state']!='complete': raise ValueError('Verified complete KR-101 release required')
        self.section_run=self.pointer['run_id']; self.sections=readonly(Path(self.pointer['database']))
        self.sections.execute('PRAGMA cache_size=-131072')
        row=self.sections.execute('SELECT state FROM research_runs WHERE id=?',(self.section_run,)).fetchone()
        if not row or row[0]!='complete': raise ValueError('Section generation is not complete')
        self.corpus=self.project/'KnowledgeBase/knowledge.sqlite3'
        stat=self.corpus.stat(); self.corpus_stat=(stat.st_size,stat.st_mtime_ns,stat.st_ino)
        db=readonly(self.corpus)
        try: self.corpus_build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        finally: db.close()
        self.reader_root=self.site/'public/content/teacher-library'
        self.reader_files=[]; self.reader_records=[]
        wanted=set()
        for row in self.sections.execute("SELECT descriptor_json FROM research_scope WHERE run_id=? AND disposition='supported'",(self.section_run,)):
            d=json.loads(row[0]); value=d.get('original_sha256') or (d.get('xml_link') or {}).get('asset_sha256')
            if value: wanted.add(value)
        for path in sorted((self.reader_root/'records').glob('*.json')):
            raw,proof=checked_bytes(path); self.reader_files.append(proof)
            for rid,record in json.loads(raw).items():
                if record.get('sha256') in wanted:
                    self.reader_records.append((rid,record['sha256'],digest(record),packed(record),proof[0],proof[1]))
        if not self.reader_files: raise ValueError('Reader record catalogue missing')
        code_paths=[self.site/'src/pages/teachers/shared/acquired.ts',self.site/'src/pages/teachers/LibraryWorkPage.tsx']
        self.reader_code=[]
        for path in code_paths:
            _,proof=checked_bytes(path); self.reader_code.append(proof)
        self.contract={'processor':VERSION,'section_run':self.section_run,'section_summary_sha256':hashlib.sha256(summary_raw).hexdigest(),
            'section_database':self.pointer['database'],'corpus_build':self.corpus_build,'corpus_path':str(self.corpus),
            'corpus_stat':self.corpus_stat,'reader_generation':digest(self.reader_files+self.reader_code),
            'reader_navigation':'existing containing-book route only; current UI has no page/section URL selector',
            'coordinates':'Unicode codepoints; half-open; normalization removes whitespace only',
            'interpretation':'source boundary and exact prose only; unreviewed headings stay unreviewed',
            'scope':'All supported documents from pinned KR-101, mapped to named newer corpus and reader snapshot',
            'cpu_workers':1,'vectors_touched':False,'corpus_modified':False,'public_output':False,
            'version_specific_reader_files':[{'path':p[0],'sha256':p[1]} for p in self.reader_code]}
        self.files=OrderedDict(); self.xml_cache=OrderedDict()

    def unchanged_corpus(self):
        stat=self.corpus.stat()
        if (stat.st_size,stat.st_mtime_ns,stat.st_ino)!=self.corpus_stat:
            raise StaleInput('Published corpus changed; stop rather than mix generations')

    def current_document(self, descriptor):
        self.unchanged_corpus(); db=readonly(self.corpus)
        try:
            if db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]!=self.corpus_build:
                raise StaleInput('Corpus build changed')
            row=db.execute('SELECT * FROM documents WHERE id=?',(descriptor['document_id'],)).fetchone()
            if not row:return None,[], 'corpus-document-missing'
            record=dict(row); metadata=json.loads(record['metadata'])
            expected=descriptor.get('original_sha256') or (descriptor.get('xml_link') or {}).get('asset_sha256')
            recorded=metadata.get('original_sha256')
            if not recorded:
                file=db.execute('SELECT sha256 FROM files WHERE path=?',(record['source'],)).fetchone()
                recorded=file[0] if file else None
            if expected and recorded!=expected:return record,[], 'corpus-original-hash-conflict-or-unavailable'
            expected_path=(descriptor.get('xml_link') or {}).get('asset_path') or descriptor['source_path']
            if Path(record['source']).resolve()!=Path(expected_path).resolve():
                return record,[], 'corpus-source-path-conflict'
            chunks=[dict(r) for r in db.execute('SELECT id,title,text,locator FROM chunks WHERE document_id=? ORDER BY rowid',(descriptor['document_id'],))]
            for chunk in chunks:
                expected_id=hashlib.sha256(json.dumps([descriptor['document_id'],chunk['locator'],chunk['title']+'\n'+chunk['text']],ensure_ascii=False).encode()).hexdigest()
                if chunk['id']!=expected_id:raise ValueError('Corpus chunk content-address proof failed')
            return record,chunks,'same-document-id-and-source-hash'
        finally:db.close()

    def file(self, path, expected=None):
        path=Path(path); key=str(path)
        if key in self.files:
            payload,proof,cost=self.files.pop(key)
            stat=path.stat()
            if (stat.st_size,stat.st_mtime_ns)!=(proof[2],proof[3]):raise StaleInput('Reader input changed: '+key)
            if expected and proof[1]!=expected:raise StaleInput('Content-addressed input differs')
            self.files[key]=(payload,proof,cost); return payload,proof
        raw,proof=checked_bytes(path,expected);payload=json.loads(raw)
        self.files[key]=(payload,proof,len(raw))
        while sum(v[2] for v in self.files.values())>64*1024*1024 and len(self.files)>1:self.files.popitem(last=False)
        return payload,proof

    def reader_blocks(self, db, run, record):
        result=[]
        for index in range(record['pages']):
            bundle=(record.get('pageBundles') or [])
            part=bundle[index] if index<len(bundle) else None
            if part:
                if not re.fullmatch(r'pages/[a-f0-9]{64}\.json',part):raise ValueError('Invalid reader bundle path')
                path=self.reader_root/part; expected=path.stem
            else:
                path=self.reader_root/'text'/quote(record['id'],safe='')/(str(index)+'.json');expected=None
            payload,proof=self.file(path,expected);register_input(db,run,proof)
            page=payload.get(record['id']+'/'+str(index)) if part else payload
            if not page or not isinstance(page.get('blocks'),list):raise ValueError('Missing reader page')
            for ordinal,block in enumerate(page['blocks']):
                if not isinstance(block.get('text'),str) or not isinstance(block.get('locator'),str):raise ValueError('Invalid reader block')
                result.append({**block,'page_index':index,'block_index':ordinal,'page_path':str(path),'page_sha256':proof[1]})
        return result

    def representation(self, db, run, coordinate, path, asset_hash, locator):
        if coordinate=='extraction-cache-block':
            raw,proof=checked_bytes(path,asset_hash);register_input(db,run,proof)
            return cache_blocks(raw)
        if coordinate in ('original-xml-rendered','original-html-rendered'):
            raw,proof=checked_bytes(path,asset_hash);register_input(db,run,proof)
            text=xml_render(raw)[0] if coordinate=='original-xml-rendered' else html_render(raw)[0]
            return [{'text':text,'ordinal':0,'locator':'native-rendered-source'}]
        if coordinate=='original-xml-entry':
            key=(path,asset_hash)
            if key not in self.xml_cache:
                raw,proof=checked_bytes(path,asset_hash)
                payload={key:text for key,locators,text in entries(Path(path))}
                after=Path(path).stat()
                if (after.st_size,after.st_mtime_ns)!=(proof[2],proof[3]):raise StaleInput('XML changed while reading entries')
                self.xml_cache[key]=(payload,proof)
                while len(self.xml_cache)>2:self.xml_cache.popitem(last=False)
            payload,proof=self.xml_cache[key];register_input(db,run,proof)
            return [{'text':payload[locator],'ordinal':0,'locator':locator}]
        raise ValueError('Unsupported section representation: '+coordinate)

    def close(self):self.sections.close()


def capture(snapshot,db,run,calibrate):
    rows=[(run,r['document_id'],r['adapter'],r['disposition'],r['reason'],r['descriptor_json']) for r in snapshot.sections.execute('SELECT * FROM research_scope WHERE run_id=?',(snapshot.section_run,))]
    db.executemany('INSERT INTO alignment_scope VALUES(?,?,?,?,?,?)',rows)
    for proof in snapshot.reader_files+snapshot.reader_code:register_input(db,run,proof)
    db.executemany('INSERT INTO reader_records VALUES(?,?,?,?,?,?,?)',[(run,*r) for r in snapshot.reader_records])
    if calibrate:
        strata=Counter(); selected=[]
        for row in db.execute("SELECT document_id,adapter,descriptor_json FROM alignment_scope WHERE run_id=? AND disposition='supported' ORDER BY document_id",(run,)):
            d=json.loads(row['descriptor_json'])
            key=(row['adapter'],Path(d['source_path']).suffix.lower(),d.get('source_family'),
                 (d.get('xml_link') or {}).get('asset_path'),bool(d.get('readers')),not bool(d.get('characters')))
            strata[key]+=1
            if strata[key]<=2:selected.append((row['document_id'],))
        db.execute('CREATE TEMP TABLE selected_calibration(id TEXT PRIMARY KEY)')
        db.executemany('INSERT INTO selected_calibration VALUES(?)',selected)
        db.execute("UPDATE alignment_scope SET disposition='outside-calibration',reason='source-stratified calibration selection' WHERE run_id=? AND disposition='supported' AND document_id NOT IN (SELECT id FROM selected_calibration)",(run,))
        db.execute('DROP TABLE selected_calibration')
    return len(rows)


def precision(rows, covered, expected):
    if not rows:return 'unresolved'
    if covered<expected:return 'partial'
    return 'exact' if all(r['state']=='exact' for r in rows) else 'approximate'


def align_document(snapshot, db, run, descriptor):
    doc=descriptor['document_id']; src=snapshot.sections; parent=snapshot.section_run
    sections=[dict(r) for r in src.execute('SELECT s.* FROM sections s INDEXED BY sections_document CROSS JOIN run_sections r ON r.version_id=s.version_id WHERE s.document_id=? AND r.run_id=?',(doc,parent))]
    segments=[dict(r) for r in src.execute('SELECT g.* FROM sections s INDEXED BY sections_document CROSS JOIN run_sections r ON r.version_id=s.version_id CROSS JOIN section_segments g ON g.version_id=s.version_id WHERE s.document_id=? AND r.run_id=? ORDER BY g.version_id,g.ordinal',(doc,parent))]
    coordinates={g['version_id']:g['coordinate'] for g in segments}
    db.executemany('INSERT INTO section_index VALUES(?,?,?,?,?,?,?,?,?)',[(run,s['version_id'],doc,s['kind'],s['heading'],s['state'],s['work_id'],s['edition_id'],coordinates.get(s['version_id'])) for s in sections])
    record,chunks,binding=snapshot.current_document(descriptor)
    if record:
        db.execute('INSERT INTO corpus_documents VALUES(?,?,?,?,?,?)',(run,doc,digest(record),packed(record),digest([(r['id'],text_hash(r['text']),r['locator']) for r in chunks]),binding))
    db.executemany('INSERT INTO corpus_chunks VALUES(?,?,?,?,?,?,?)',[(run,r['id'],doc,r['locator'],len(r['text']),text_hash(r['text']),i) for i,r in enumerate(chunks)])
    target_chunks=bounds(chunks); chunk_text=''.join(r['text'] for r in chunks)
    original=descriptor.get('original_sha256') or (descriptor.get('xml_link') or {}).get('asset_sha256')
    readers=[]; reader_errors=[]
    # A run-only PK scan can appear cheaper because it satisfies ORDER BY,
    # but scans every large reader record once per document. The hash lookup
    # is the identity gate and must precede sorting its handful of candidates.
    for row in db.execute('SELECT * FROM reader_records INDEXED BY reader_original WHERE run_id=? AND original_sha256=? ORDER BY reader_id',(run,original)).fetchall():
        r=json.loads(row['record_json']); route='/teachers/works/'+quote(r['id'],safe='')
        if r.get('availability')!='on-site-text' or not r.get('pages'):
            readers.append({'record':r,'route':route,'blocks':[],'text':'','bounds':[],'reason':'reader-body-not-offered-on-site'})
            continue
        try:
            blocks=snapshot.reader_blocks(db,run,r)
            readers.append({'record':r,'route':route,'blocks':blocks,'text':''.join(b['text'] for b in blocks),'bounds':bounds(blocks),'reason':None})
        except (ValueError,OSError,KeyError) as exc:
            if isinstance(exc,StaleInput):raise
            reader_errors.append({'reader_id':r['id'],'reason':type(exc).__name__+':'+str(exc)})
            readers.append({'record':r,'route':route,'blocks':[],'text':'','bounds':[],'reason':'reader-page-input-unavailable'})
    groups=defaultdict(list)
    for g in segments:groups[(g['coordinate'],g['path'],g['asset_sha256'],g['locator'] if g['coordinate']=='original-xml-entry' else '')].append(g)
    stats={s['version_id']:{'meaningful':0,'chunk_rows':0,'chunk_covered':0,'chunk_exact':True,
        'readers':{},'map_reasons':[]} for s in sections}
    chunk_rows=reader_rows=0; source_checks=0
    for (coordinate,path,asset_hash,entry_locator),group in groups.items():
        blocks=snapshot.representation(db,run,coordinate,path,asset_hash,entry_locator)
        source=''.join(b['text'] for b in blocks); offsets={}; position=0
        for b in blocks:offsets[b['ordinal']]=(position,b);position+=len(b['text'])
        maps={'corpus':TextMap(source,chunk_text,parts=[r['text'] for r in chunks])}
        for reader in readers:
            if reader['blocks']:maps[reader['record']['id']]=TextMap(source,reader['text'],parts=[b['text'] for b in reader['blocks']])
        for target_id,mapping in maps.items():
            db.execute('INSERT INTO alignment_maps VALUES(?,?,?,?,?,?,?,?,?,?)',(run,doc,coordinate,path,asset_hash,'corpus' if target_id=='corpus' else 'reader',doc if target_id=='corpus' else target_id,mapping.method,len(mapping.runs),mapping.reason))
        for g in group:
            version=g['version_id'];stat=stats[version];offset,block=offsets[g['block_ordinal']]
            if text_hash(block['text'])!=g['block_text_sha256'] or not 0<=g['start']<=g['end']<=len(block['text']):raise StaleInput('Section block proof differs')
            witness=block['text'][g['start']:g['end']]
            if text_hash(witness)!=g['span_sha256']:raise StaleInput('Section span proof differs')
            source_checks+=1;stat['meaningful']+=len(compact(witness))
            mapped=list(maps['corpus'].pieces(offset+g['start'],offset+g['end'],target_chunks)) if chunks else []
            values=[]
            for i,p in enumerate(mapped):
                values.append((run,version,g['ordinal'],i,p['target']['id'],p['source_start']-offset,p['source_end']-offset,p['target_start'],p['target_end'],p['state'],p['method'],p['source_span_sha256'],p['target_span_sha256'],p['normalized_sha256'],p['meaningful_characters']))
            db.executemany('INSERT INTO section_chunks VALUES('+','.join('?'*15)+')',values)
            stat['chunk_rows']+=len(mapped); stat['chunk_covered']+=sum(p['meaningful_characters'] for p in mapped)
            stat['chunk_exact'] &= all(p['state']=='exact' for p in mapped)
            chunk_rows+=len(mapped)
            if maps['corpus'].reason:stat['map_reasons'].append(maps['corpus'].reason)
            for reader in readers:
                rid=reader['record']['id']; rs=stat['readers'].setdefault(rid,{'rows':0,'covered':0,'exact':True})
                if not reader['blocks']:continue
                mapping=maps[rid]; mapped=list(mapping.pieces(offset+g['start'],offset+g['end'],reader['bounds']))
                values=[]
                for i,p in enumerate(mapped):
                    b=p['target'];values.append((run,version,g['ordinal'],rid,i,b['page_index'],b['block_index'],p['source_start']-offset,p['source_end']-offset,p['target_start'],p['target_end'],p['state'],p['method'],p['source_span_sha256'],p['target_span_sha256'],p['normalized_sha256'],p['meaningful_characters'],b['page_path'],b['page_sha256']))
                db.executemany('INSERT INTO section_reader_spans VALUES('+','.join('?'*19)+')',values)
                rs['rows']+=len(mapped);rs['covered']+=sum(p['meaningful_characters'] for p in mapped);rs['exact'] &= all(p['state']=='exact' for p in mapped)
                reader_rows+=len(mapped)
                if mapping.reason:stat['map_reasons'].append(mapping.reason)
    for section in sections:
        version=section['version_id'];st=stats[version]
        cs=precision([{'state':'exact' if st['chunk_exact'] else 'approximate'}] if st['chunk_rows'] else [],st['chunk_covered'],st['meaningful'])
        reader_states=[];reader_covered=[];nav='unresolved'
        for reader in readers:
            rid=reader['record']['id'];rs=st['readers'].get(rid,{'rows':0,'covered':0,'exact':True})
            location=precision([{'state':'exact' if rs['exact'] else 'approximate'}] if rs['rows'] else [],rs['covered'],st['meaningful'])
            reader_states.append(location);reader_covered.append(rs['covered'])
            state='containing-book' if reader['blocks'] else 'unresolved'
            if state=='containing-book':nav=state
            db.execute('INSERT INTO section_destinations VALUES(?,?,?,?,?,?,?)',(run,version,rid,state,reader['route'],location,
                'page/block coordinates recorded; reader URL cannot select them' if state=='containing-book' else reader['reason']))
        if not readers:
            db.execute('INSERT INTO section_destinations VALUES(?,?,?,?,?,?,?)',(run,version,'','unresolved',None,'unresolved','no-same-source-bytes-reader-record'))
        best=next((s for s in ('exact','approximate','partial') if s in reader_states),'unresolved')
        reasons=sorted(set(st['map_reasons']+([] if chunks else [binding])+([] if readers else ['no-same-source-bytes-reader-record'])))
        db.execute('INSERT INTO section_alignment_status VALUES(?,?,?,?,?,?,?,?,?)',(run,version,cs,best,nav,st['meaningful'],st['chunk_covered'],max(reader_covered,default=0),packed(reasons)))
    receipt={'source_binding':binding,'corpus_build':snapshot.corpus_build,'section_generation':parent,
        'chunk_capture_sha256':digest([(r['id'],text_hash(r['text']),r['locator']) for r in chunks]),'verified_source_segments':source_checks,
        'recorded_contributors':descriptor.get('memberships',[]),'recorded_readers':descriptor.get('readers',[]),
        'current_reader_ids':[r['record']['id'] for r in readers],'reader_errors':reader_errors,
        'interpretation':'unreviewed source boundaries; no author endorsement or semantic claims',
        'newer_corpus_metadata_sha256':digest(record) if record else None}
    db.execute('INSERT INTO alignment_documents VALUES(?,?,?,?,?,?,?)',(run,doc,'processed' if sections else 'empty-representation',len(sections),chunk_rows,reader_rows,packed(receipt)))
    return chunk_rows+reader_rows+len(sections)


def count_rows(db, run):
    result={table:db.execute('SELECT count(*) FROM '+table+' WHERE run_id=?',(run,)).fetchone()[0] for table in ('alignment_scope','alignment_documents','section_index','corpus_chunks','section_chunks','section_reader_spans','section_destinations','alignment_maps')}
    result['scope']=[dict(r) for r in db.execute('SELECT disposition,reason,count(*) documents FROM alignment_scope WHERE run_id=? GROUP BY disposition,reason',(run,))]
    result['states']=[dict(r) for r in db.execute('SELECT chunk_state,reader_state,navigation_state,count(*) sections FROM section_alignment_status WHERE run_id=? GROUP BY chunk_state,reader_state,navigation_state',(run,))]
    result['map_methods']=[dict(r) for r in db.execute('SELECT target_type,method,reason,count(*) representations FROM alignment_maps WHERE run_id=? GROUP BY target_type,method,reason',(run,))]
    result['jobs']=[dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(run,))]
    return result


def dependencies(db, run):
    changed=[]
    for row in db.execute('SELECT * FROM alignment_inputs WHERE run_id=?',(run,)):
        p=Path(row['path'])
        if not p.is_file() or (p.stat().st_size,p.stat().st_mtime_ns)!=(row['size'],row['mtime_ns']):changed.append(str(p))
    return changed


def validation(snapshot, db, run):
    snapshot.unchanged_corpus()
    expected=db.execute("SELECT count(*) FROM alignment_scope WHERE run_id=? AND disposition='supported'",(run,)).fetchone()[0]
    actual=db.execute('SELECT count(*) FROM alignment_documents WHERE run_id=?',(run,)).fetchone()[0]
    bad=db.execute("SELECT count(*) FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'",(run,)).fetchone()[0]
    missing=db.execute('SELECT count(*) FROM section_index s LEFT JOIN section_alignment_status a USING(run_id,version_id) WHERE s.run_id=? AND a.version_id IS NULL',(run,)).fetchone()[0]
    invalid=db.execute('SELECT count(*) FROM section_chunks s JOIN corpus_chunks c ON c.run_id=s.run_id AND c.id=s.chunk_id WHERE s.run_id=? AND (s.chunk_start<0 OR s.chunk_end>c.characters OR s.chunk_end<=s.chunk_start OR s.source_end<=s.source_start)',(run,)).fetchone()[0]
    over=db.execute('SELECT count(*) FROM section_alignment_status WHERE run_id=? AND (chunk_covered>meaningful_characters OR reader_covered>meaningful_characters)',(run,)).fetchone()[0]
    changed=dependencies(db,run);integrity=db.execute('PRAGMA quick_check').fetchone()[0]
    # Independent source and target reconstruction is implemented by the
    # verifier below; writer checks are not labelled independent accuracy.
    witnesses=verify_witnesses(snapshot,db,run)
    return {'ok':expected==actual and not bad and not missing and not invalid and not over and not changed and integrity=='ok' and witnesses['failed']==0,
        'supported_documents':expected,'processed_documents':actual,'failed_or_unfinished_jobs':bad,'missing_section_status':missing,
        'invalid_chunk_bounds':invalid,'overcounted_coverage':over,'changed_files':changed,'sqlite_quick_check':integrity,
        'independent_witnesses':witnesses,'reviewer':'deterministic source/target reconstruction; semantic/human review not claimed'}


def verify_witnesses(snapshot, db, run):
    """Reopen exact source bytes and independent selected corpus/reader bodies."""
    chosen=[]
    for table in ('section_chunks','section_reader_spans'):
        for state in ('exact','approximate'):
            for coordinate in ('extraction-cache-block','original-xml-rendered','original-html-rendered','original-xml-entry'):
                rows=db.execute('SELECT a.* FROM section_index s CROSS JOIN '+table+' a ON a.run_id=s.run_id AND a.version_id=s.version_id WHERE s.run_id=? AND s.coordinate=? AND a.state=? ORDER BY s.version_id LIMIT 40',(run,coordinate,state)).fetchall()
                chosen.extend((table,dict(r)) for r in rows)
    passed=failed=0;errors=[];strata=Counter();cache={}
    # Sort by source file to avoid reparsing a whole shared XML dictionary for
    # each sampled entry. A single document/representation stays in memory.
    detailed=[]
    for table,row in chosen:
        segment=snapshot.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(row['version_id'],row['segment_ordinal'])).fetchone()
        detailed.append((segment['path'],table,row,dict(segment)))
    corpus=readonly(snapshot.corpus)
    try:
        for path,table,row,g in sorted(detailed,key=lambda v:(v[0],v[3]['coordinate'],v[3]['locator'])):
            try:
                key=(g['path'],g['asset_sha256'],g['coordinate'])
                if key not in cache:
                    raw,_=checked_bytes(g['path'],g['asset_sha256'])
                    if g['coordinate']=='extraction-cache-block':payload=cache_blocks(raw)
                    elif g['coordinate']=='original-xml-rendered':payload=xml_render(raw)[0]
                    elif g['coordinate']=='original-html-rendered':payload=html_render(raw)[0]
                    else:payload={k:text for k,loc,text in entries(Path(g['path']))}
                    cache={key:payload}
                payload=cache[key]
                if g['coordinate']=='extraction-cache-block':source=payload[g['block_ordinal']]['text']
                elif g['coordinate']=='original-xml-entry':source=payload[g['locator']]
                else:source=payload
                left=source[row['source_start']:row['source_end']]
                if table=='section_chunks':
                    target=corpus.execute('SELECT text FROM chunks WHERE id=?',(row['chunk_id'],)).fetchone()
                    if not target:raise ValueError('Named corpus chunk missing')
                    right=target[0][row['chunk_start']:row['chunk_end']]
                else:
                    raw,_=checked_bytes(row['page_path'],row['page_sha256']);page=json.loads(raw)
                    if '/pages/' in row['page_path'].replace('\\','/'):
                        page=page[row['reader_id']+'/'+str(row['page_index'])]
                    target=page['blocks'][row['block_index']]['text']
                    right=target[row['reader_start']:row['reader_end']]
                if text_hash(left)!=row['source_span_sha256'] or text_hash(right)!=row['target_span_sha256']:raise ValueError('Literal witness hash differs')
                if compact(left)!=compact(right) or text_hash(compact(left))!=row['normalized_sha256']:raise ValueError('Normalized witness differs')
                if row['state']=='exact' and left!=right:raise ValueError('Exact witness is not literally equal')
                if not g['start']<=row['source_start']<=row['source_end']<=g['end']:raise ValueError('Witness escapes section')
                passed+=1;strata[(table,row['state'],g['coordinate'])]+=1
            except Exception as exc:
                failed+=1;errors.append({'section':row['version_id'],'table':table,'error':str(exc)})
    finally:corpus.close()
    return {'passed':passed,'failed':failed,'strata':[{'target':t,'state':s,'coordinate':c,'samples':n} for (t,s,c),n in strata.items()],'errors':errors}


def export(snapshot, store, run, root, elapsed):
    db=store.db;checks=validation(snapshot,db,run);counts=count_rows(db,run)
    summary={'run_id':run,'state':'complete' if checks['ok'] else 'failed-validation','processor':VERSION,
        'contract':snapshot.contract,'counts':counts,'validation':checks,'seconds':round(elapsed,1),
        'limits':['Pinned historical sections mapped to a named newer corpus; not sections for all later acquisitions.',
                  'Exact/approximate source locations are separate from containing-book URLs; reader has no page selector.',
                  'Equal prose and source identity do not establish author endorsement or semantic/relevance review.',
                  'No vector, graph, corpus, original-file, reader/UI or public output modifications.']}
    folder=root/'releases'/run;folder.mkdir(parents=True,exist_ok=True)
    tables=('alignment_documents','section_index','corpus_documents','corpus_chunks','reader_records',
            'section_chunks','section_reader_spans','section_destinations','section_alignment_status',
            'alignment_maps','alignment_scope','alignment_inputs')
    manifest=[]
    for table in tables:
        path=folder/(table+'.jsonl');sha=hashlib.sha256();n=0
        with path.open('wb') as f:
            for row in db.execute('SELECT * FROM '+table+' WHERE run_id=?',(run,)):
                raw=(packed(dict(row))+'\n').encode();f.write(raw);sha.update(raw);n+=1
        manifest.append({'path':path.name,'sha256':sha.hexdigest(),'bytes':path.stat().st_size,'rows':n})
    dump(folder/'summary.json',summary)
    raw=(folder/'summary.json').read_bytes();manifest.append({'path':'summary.json','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
    dump(folder/'release_manifest.json',{'run_id':run,'files':manifest})
    with db:db.execute('UPDATE alignment_runs SET state=?,summary_json=? WHERE id=?',(summary['state'],packed(summary),run))
    contract=json.loads(db.execute('SELECT contract_json FROM alignment_runs WHERE id=?',(run,)).fetchone()[0])
    if checks['ok'] and not contract['calibration']:
        dump(root/'latest-alignment.json',{'run_id':run,'database':str(store.path),'summary':str(folder/'summary.json'),'release':str(folder)})
    dump(root/'alignment-progress.json',{'state':summary['state'],'run_id':run,'counts':counts,'pid':os.getpid(),'updated_at':now()})
    return summary


def run(project=PROJECT, calibrate=False, resume=False, limit=None):
    root=output(project);root.mkdir(parents=True,exist_ok=True);background_priority();started=time.monotonic()
    shared=JobStore(Path(project)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    store=snapshot=None;run_id=None
    try:
        shared.acquire();store=JobStore(root/'alignment.sqlite3');store.acquire();store.db.executescript(SCHEMA)
        # These relation indexes exceed the generic ledger's 16 MiB cache.
        # Keep their hot pages in a bounded 512 MiB working set, rather than
        # repeatedly spilling and rereading them inside each atomic group.
        store.db.execute('PRAGMA cache_size=-524288')
        # Per-document savepoints create temporary subjournals. Keep that
        # scratch in RAM; durable facts/checkpoints still use FULL-sync WAL.
        store.db.execute('PRAGMA temp_store=MEMORY')
        snapshot=Snapshot(project);snapshot.contract['calibration']=calibrate
        run_id='kr102-'+digest(snapshot.contract)[:24]+('-calibration' if calibrate else '')
        if not calibrate:
            cal_id='kr102-'+digest({**snapshot.contract,'calibration':True})[:24]+'-calibration'
            row=store.db.execute('SELECT state FROM alignment_runs WHERE id=?',(cal_id,)).fetchone()
            if not row or row[0]!='complete':raise ValueError('Matching calibration must pass before population execution')
        old=store.db.execute('SELECT * FROM alignment_runs WHERE id=?',(run_id,)).fetchone()
        if old and old['state']=='complete':
            if dependencies(store.db,run_id):raise StaleInput('Completed release inputs changed')
            print(packed({'state':'complete','run_id':run_id,'unchanged':True}),flush=True);return 0
        if old and not resume:raise ValueError('Unfinished run exists; use --resume')
        with store.db:
            store.db.execute("UPDATE alignment_runs SET state='interrupted' WHERE state='running'")
            store.db.execute('INSERT OR IGNORE INTO alignment_runs VALUES(?,?,?,?,NULL)',(run_id,'running',now(),packed(snapshot.contract)))
            store.db.execute("UPDATE alignment_runs SET state='running' WHERE id=?",(run_id,))
        job=digest({'run':run_id,'capture':VERSION});store.register(run_id,job,'alignment-capture','capture',job,VERSION)
        result=store.execute(job,lambda db:capture(snapshot,db,run_id,calibrate))
        if result in ('failed','stale'):raise RuntimeError('Alignment capture failed')
        total=store.db.execute("SELECT count(*) FROM alignment_scope WHERE run_id=? AND disposition='supported'",(run_id,)).fetchone()[0]
        done=0;last='';states=Counter();last_report=0
        while True:
            rows=store.db.execute("SELECT * FROM alignment_scope WHERE run_id=? AND disposition='supported' AND document_id>? ORDER BY document_id LIMIT 16",(run_id,last)).fetchall()
            if not rows:break
            last=rows[-1]['document_id'];registrations=[];work=[]
            for row in rows:
                d=json.loads(row['descriptor_json']);job=digest({'run':run_id,'document':d,'version':VERSION})
                registrations.append((run_id,job,'section-alignment','document:'+d['document_id'],job,VERSION))
                work.append((job,lambda db,d=d:align_document(snapshot,db,run_id,d)))
                if limit and done+len(work)>=limit:break
            store.register_many(registrations);states.update(store.execute_many(work).values());done+=len(work)
            if time.monotonic()-last_report>=10 or done==total:
                progress={'state':'running','phase':'aligning','run_id':run_id,'documents':done,'supported_documents':total,
                    'job_attempts':dict(states),'seconds':round(time.monotonic()-started,1),'pid':os.getpid(),
                    'process_token':process_identity(os.getpid()),'updated_at':now(),'cpu_only':True}
                dump(root/'alignment-progress.json',progress);print(packed(progress),flush=True);shared.heartbeat();last_report=time.monotonic()
            if limit and done>=limit:
                with store.db:store.db.execute("UPDATE alignment_runs SET state='interrupted' WHERE id=?",(run_id,))
                print(packed({'state':'interrupted','run_id':run_id,'documents':done}),flush=True);return 0
        print(packed({'state':'validating','run_id':run_id}),flush=True)
        result=export(snapshot,store,run_id,root,time.monotonic()-started)
        print(packed({'state':result['state'],'run_id':run_id,'counts':result['counts'],'validation':result['validation']}),flush=True)
        return 0 if result['state']=='complete' else 2
    except BaseException as exc:
        if store and run_id:
            with store.db:store.db.execute('UPDATE alignment_runs SET state=? WHERE id=?',('interrupted' if isinstance(exc,KeyboardInterrupt) else 'failed',run_id))
        raise
    finally:
        if snapshot:snapshot.close()
        if store:store.close()
        shared.close()


def query(project, term=None, section=None, limit=10, include_candidates=False):
    root=output(project);pointer=json.loads((root/'latest-alignment.json').read_text('utf-8-sig'));db=readonly(Path(pointer['database']))
    sources=None
    try:
        run_id=pointer['run_id']
        contract=json.loads(db.execute('SELECT contract_json FROM alignment_runs WHERE id=?',(run_id,)).fetchone()[0])
        sources=readonly(Path(contract['section_database']))
        if section:
            rows=db.execute('SELECT s.*,a.chunk_state,a.reader_state,a.navigation_state,a.meaningful_characters,a.chunk_covered,a.reader_covered FROM section_index s JOIN section_alignment_status a USING(run_id,version_id) WHERE s.run_id=? AND s.version_id=?',(run_id,section)).fetchall()
        else:
            condition='' if include_candidates else " AND s.state!='candidate-unreviewed' AND s.kind!='document-representation'"
            rows=db.execute('SELECT s.*,a.chunk_state,a.reader_state,a.navigation_state FROM section_index s JOIN section_alignment_status a USING(run_id,version_id) WHERE s.run_id=? AND s.heading LIKE ?'+condition+' ORDER BY s.version_id LIMIT ?',(run_id,'%'+term+'%',limit)).fetchall()
        results=[]
        for row in rows:
            value=dict(row);version=row['version_id']
            source=sources.execute('SELECT s.native_key,s.parent_version_id,s.representation_sha256 FROM sections s JOIN run_sections r ON r.version_id=s.version_id WHERE s.version_id=? AND r.run_id=?',(version,contract['section_run'])).fetchone()
            if not source:raise StaleInput('Section version absent from pinned source generation')
            value['source_identity']=dict(source)
            value['source_segments']=[dict(r) for r in sources.execute('SELECT * FROM section_segments WHERE version_id=? ORDER BY ordinal LIMIT 20',(version,))]
            value['chunks']=[dict(r) for r in db.execute('SELECT * FROM section_chunks WHERE run_id=? AND version_id=? ORDER BY segment_ordinal,piece_ordinal LIMIT 20',(run_id,version))]
            value['reader_locations']=[dict(r) for r in db.execute('SELECT * FROM section_reader_spans WHERE run_id=? AND version_id=? ORDER BY reader_id,page_index,block_index LIMIT 20',(run_id,version))]
            value['destinations']=[dict(r) for r in db.execute('SELECT * FROM section_destinations WHERE run_id=? AND version_id=?',(run_id,version))]
            value['returned_span_limit']=20;results.append(value)
        return {'run_id':run_id,'corpus_build':contract['corpus_build'],'section_run':contract['section_run'],'results':results}
    finally:
        if sources:sources.close()
        db.close()


def launch(args):
    root=output(args.project);root.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,'-u','-m','knowledge.library_analytics.section_alignment','--calibrate' if args.calibrate else '--run','--project',str(args.project)]
    if args.resume:command.append('--resume')
    if args.limit:command.extend(['--limit',str(args.limit)])
    flags=subprocess.CREATE_NO_WINDOW|subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP if os.name=='nt' else 0
    with (root/'alignment-run.log').open('ab') as out,(root/'alignment-error.log').open('ab') as err:
        worker=subprocess.Popen(command,cwd=Path(args.project)/'Website',stdin=subprocess.DEVNULL,stdout=out,stderr=err,creationflags=flags)
    receipt={'launched_pid':worker.pid,'launched_at':now(),'command':command,'stdout':str(root/'alignment-run.log'),'stderr':str(root/'alignment-error.log'),'cpu_only':True}
    dump(root/'alignment-launch.json',receipt);print(packed(receipt),flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',type=Path,default=PROJECT)
    action=parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--run',action='store_true');action.add_argument('--calibrate',action='store_true')
    action.add_argument('--query');action.add_argument('--section');action.add_argument('--status',action='store_true')
    parser.add_argument('--launch',action='store_true');parser.add_argument('--resume',action='store_true');parser.add_argument('--limit',type=int)
    parser.add_argument('--include-candidates',action='store_true')
    args=parser.parse_args()
    if args.launch:
        if not (args.run or args.calibrate):parser.error('--launch requires --run or --calibrate')
        launch(args);return
    if args.run or args.calibrate:raise SystemExit(run(args.project,args.calibrate,args.resume,args.limit))
    if args.status:print((output(args.project)/'alignment-progress.json').read_text('utf-8'));return
    print(packed(query(args.project,args.query,args.section,args.limit or 10,args.include_candidates)))


if __name__=='__main__':main()
