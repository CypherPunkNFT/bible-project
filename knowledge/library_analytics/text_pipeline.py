"""LA-02: independent CPU analysis of existing cache blocks/corpus text.

Captured document descriptors are frozen before processing. Read-only corpus
connections for the chunk adapter last only one fetch, allowing intake to own
the live database. Body copies, vector files and graph writers are never used.
"""
import hashlib
import json
import os
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from .build import PROJECT, DEFAULT_OUT, readonly, dump, now
from .inputs import packed, digest
from .jobs import JobStore, StaleInput, background_priority
from .quality import Quality, VERSION as QUALITY_VERSION
from .structure import sections, xml_sections, VERSION as STRUCTURE_VERSION
from .references import ReferenceScanner, VERSION as REFERENCE_VERSION
from .normalize import language
from knowledge.enrichment.citations import CitationParser, boundary_citations

VERSION = 'la02-text-v1'
MAX_BLOCK = 64*1024*1024
SCHEMA = '''
CREATE TABLE IF NOT EXISTS text_runs(id TEXT PRIMARY KEY,state TEXT,created_at REAL,updated_at REAL,
 corpus_path TEXT,scope_json TEXT,parser_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS text_scope(run_id TEXT,document_id TEXT,descriptor_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS document_quality(job_id TEXT,document_id TEXT,status TEXT,characters INTEGER,blocks INTEGER,
 replacement_rate REAL,control_rate REAL,repeated_line_rate REAL,metrics_json TEXT,PRIMARY KEY(job_id,document_id));
CREATE TABLE IF NOT EXISTS document_sections(job_id TEXT,document_id TEXT,ordinal INTEGER,kind TEXT,locator TEXT,label TEXT,evidence_json TEXT,
 PRIMARY KEY(job_id,document_id,ordinal));
CREATE TABLE IF NOT EXISTS literal_references(job_id TEXT,id TEXT,document_id TEXT,book TEXT,chapter INTEGER,verse INTEGER,
 end_chapter INTEGER,end_verse INTEGER,reference_kind TEXT,coordinate TEXT,literal TEXT,evidence_json TEXT,PRIMARY KEY(job_id,id));
CREATE TABLE IF NOT EXISTS reference_rejections(job_id TEXT,id TEXT,document_id TEXT,reason TEXT,evidence_json TEXT,PRIMARY KEY(job_id,id));
CREATE TABLE IF NOT EXISTS reference_coverage(job_id TEXT,document_id TEXT,language TEXT,coverage TEXT,blocks INTEGER,
 accepted INTEGER,rejected INTEGER,PRIMARY KEY(job_id,document_id));
CREATE TABLE IF NOT EXISTS text_processing_gaps(job_id TEXT,document_id TEXT,stage TEXT,reason TEXT,PRIMARY KEY(job_id,document_id,stage,reason));
CREATE TABLE IF NOT EXISTS text_input_files(run_id TEXT,document_id TEXT,path TEXT,sha256 TEXT,size INTEGER,mtime_ns INTEGER,
 PRIMARY KEY(run_id,document_id,path));
'''


def hash_file(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''): h.update(block)
    return h.hexdigest()


def corpus_rows(path,doc):
    """Keyset batches release both transaction and file handle after each fetch."""
    last = 0
    while True:
        db = readonly(Path(path))
        try:
            rows = db.execute('SELECT rowid,id,document_id,text,locator,language FROM chunks INDEXED BY chunks_doc WHERE document_id=? AND rowid>? ORDER BY rowid LIMIT 256',(doc,last)).fetchall()
        finally:
            db.close()
        if not rows: break
        last = rows[-1]['rowid']
        for row in rows: yield dict(row)


def capture(store,run,project,kinds):
    path = Path(project)/'KnowledgeBase/knowledge.sqlite3'
    src = readonly(path)
    with store.db: store.db.execute('DELETE FROM text_scope WHERE run_id=?',(run,))
    expected_chunks = {}
    warehouse_pointer = Path(project)/'KnowledgeBase/library-analytics/latest.json'
    if warehouse_pointer.exists():
        warehouse = readonly(Path(json.loads(warehouse_pointer.read_text())['database']))
        expected_chunks = dict(warehouse.execute('SELECT document_id,chunks FROM chunk_counts'))
        warehouse.close()
    try:
        before = src.execute('PRAGMA data_version').fetchone()[0]
        catalog = json.loads(src.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()[0])
        books = catalog['books']
        bounds = [list(r) for r in src.execute("SELECT lower(book),chapter,max(verse_end) FROM verses WHERE edition='kjv' GROUP BY book,chapter")]
        built = src.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        moves_file = Path(project)/'KnowledgeBase/campaign-coordination/archive-moves.json'
        moves = json.loads(moves_file.read_text(encoding='utf-8-sig')).get('approvedMoves',[]) if moves_file.exists() else []
        excluded = {m['sha256'] for m in moves if m.get('disposition') == 'excluded-author'}
        parser_config = {'books':books,'bounds':bounds,'parser_version':CitationParser.version,
                         'scanner_version':REFERENCE_VERSION,'quality_version':QUALITY_VERSION,'structure_version':STRUCTURE_VERSION}
        last = ''
        count = cached_bytes = 0
        while True:
            rows = src.execute('SELECT id,title,kind,language,source,metadata FROM documents WHERE id>? AND kind IN ('+','.join('?' for _ in kinds)+') ORDER BY id LIMIT 500',[last,*kinds]).fetchall()
            if not rows: break
            last = rows[-1]['id']
            prepared = []
            for row in rows:
                m = json.loads(row['metadata'])
                a = m.get('acquisition') or {}
                cache = m.get('extraction_cache')
                missing_cache = cache if cache and not Path(cache).is_file() else None
                if missing_cache: cache = None
                descriptor = {'document_id':row['id'],'title':row['title'],'kind':row['kind'],'language':row['language'],
                    'source_path':row['source'],'source_family':a.get('source') or '',
                    'original_sha256':m.get('original_sha256'),'cache_path':cache,
                    'missing_cache_path':missing_cache,
                    'work_id':(m.get('work') or {}).get('id'),'edition_id':(m.get('edition') or {}).get('id'),
                    'metadata_sha256':hashlib.sha256(row['metadata'].encode()).hexdigest(),
                    'excluded_archive':m.get('original_sha256') in excluded,
                    'baseline_indexed_chunks':expected_chunks.get(row['id']),
                    'body_adapter':'extraction-cache' if cache else 'corpus-chunks'}
                if cache and Path(cache).is_file(): cached_bytes += Path(cache).stat().st_size
                prepared.append((run,row['id'],packed(descriptor)))
            with store.db: store.db.executemany('INSERT OR REPLACE INTO text_scope VALUES(?,?,?)',prepared)
            count += len(rows)
            if count % 10000 == 0: print(packed({'phase':'capture','documents':count}),flush=True)
        after = src.execute('PRAGMA data_version').fetchone()[0]
        if before != after: raise StaleInput('Corpus changed during scope capture; no mixed scope may be released')
        scope = {'kinds':kinds,'documents':count,'cached_bytes':cached_bytes,'corpus_build':built,
                 'metadata_capture_versions_stable':True,'archive_move_ledger_sha256':hash_file(moves_file) if moves_file.exists() else None,
                 'scope':'Captured document descriptors; future intake is a new generation. Chunk counts are baseline index assertions.'}
        with store.db:
            store.db.execute('UPDATE text_runs SET scope_json=?,parser_json=?,updated_at=? WHERE id=?',(packed(scope),packed(parser_config),time.time(),run))
        return scope,parser_config
    finally:
        src.close()


def blocks(descriptor,corpus_path):
    if descriptor['cache_path']:
        path = Path(descriptor['cache_path'])
        with path.open('rb') as f:
            ordinal = 0
            while True:
                raw = f.readline(MAX_BLOCK+1)
                if not raw: break
                if len(raw)>MAX_BLOCK: raise ValueError('extraction-cache-block-over-64-MiB-bound')
                value = json.loads(raw.decode('utf-8-sig'))
                if not isinstance(value.get('text'),str): raise ValueError('cache-block-has-no-text-string')
                yield {**value,'ordinal':ordinal,'coordinate':'extraction-cache-block','path':str(path)}
                ordinal += 1
    else:
        for ordinal,row in enumerate(corpus_rows(corpus_path,descriptor['document_id'])):
            yield {**row,'ordinal':ordinal,'coordinate':'corpus-chunk','path':str(corpus_path)}


def witness(block,text_hash,start,end):
    return {'coordinate':block['coordinate'],'path':block['path'],'block_ordinal':block['ordinal'],
            'chunk_id':block.get('id'),'locator':block.get('locator',''),
            'text_sha256':text_hash,'start':start,'end':end,'literal':block['text'][start:end]}


def analyse(db,job,descriptor,corpus_path,scanner):
    doc = descriptor['document_id']
    if descriptor['excluded_archive']:
        db.execute('INSERT OR REPLACE INTO document_quality VALUES(?,?,?,?,?,?,?,?,?)',(job,doc,'excluded',0,0,0,0,0,packed({'flags':['documented-excluded-archive']})))
        db.execute('INSERT OR REPLACE INTO reference_coverage VALUES(?,?,?,?,?,?,?)',(job,doc,descriptor['language'],'excluded-archive',0,0,0))
        db.execute('INSERT OR IGNORE INTO text_processing_gaps VALUES(?,?,?,?)',(job,doc,'all','documented-excluded-archive'))
        return 1
    quality = Quality()
    accepted = rejected = ordinal = heading_candidates = 0
    previous = None
    source_digest = hashlib.sha256()
    def save_hit(hit,segments,coordinate):
        nonlocal accepted
        identifier = digest({'doc':doc,'segments':[{k:v for k,v in s.items() if k!='literal'} for s in segments],
                             'reference':[hit['book'],hit['chapter'],hit['verse'],hit['endChapter'],hit['endVerse']]})
        literal = ' … '.join(s['literal'] for s in segments)
        evidence = {'segments':segments,'edition':'unknown','numbering':'unspecified','parser':scanner.parser.version,
                    'scanner':REFERENCE_VERSION,'reference_kind':hit.get('referenceKind','verse'),
                    'range_validation':hit.get('rangeValidation'),'attribution':'literal source citation; speaker and endorsement unresolved'}
        changed = db.execute('INSERT OR IGNORE INTO literal_references VALUES('+','.join('?'*12)+')',
            (job,identifier,doc,hit['book'],hit['chapter'],hit['verse'],hit['endChapter'],hit['endVerse'],
             hit.get('referenceKind','verse'),coordinate,literal,packed(evidence))).rowcount
        accepted += changed
    for block in blocks(descriptor,corpus_path):
        text = block['text']
        text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        source_digest.update(packed({'ordinal':block['ordinal'],'locator':block.get('locator'),'sha256':text_hash,'id':block.get('id')}).encode())
        quality.add(text,text_hash)
        for item in sections(block):
            if item['kind']=='heading-candidate': heading_candidates+=1
            evidence = {**item,'coordinate':block['coordinate'],'path':block['path'],'block_ordinal':block['ordinal'],'text_sha256':text_hash,'chunk_id':block.get('id')}
            db.execute('INSERT OR REPLACE INTO document_sections VALUES(?,?,?,?,?,?,?)',(job,doc,ordinal,item['kind'],item['locator'],item['label'],packed(evidence)))
            ordinal += 1
        hits,failures = scanner.extract(text)
        for hit in hits:
            spans = [witness(block,text_hash,a,b) for a,b in scanner.spans(text,hit)]
            save_hit(hit,spans,block['coordinate'])
        for hit in failures:
            span = witness(block,text_hash,hit['start'],hit['end'])
            identifier = digest({'doc':doc,'span':{k:v for k,v in span.items() if k!='literal'},'reason':hit['reason']})
            evidence = {'segments':[span],'reason':hit['reason'],'parser':scanner.parser.version,'numbering':'unspecified'}
            rejected += db.execute('INSERT OR IGNORE INTO reference_rejections VALUES(?,?,?,?,?)',(job,identifier,doc,hit['reason'],packed(evidence))).rowcount
        if previous and block['coordinate']=='corpus-chunk' and previous['coordinate']=='corpus-chunk' and previous['rowid']+1==block['rowid']:
            for hit in boundary_citations(scanner.parser,previous,block):
                parts = []
                for segment in hit['segments']:
                    origin = previous if segment['chunkId']==previous['id'] else block
                    th = previous['text_hash'] if origin is previous else text_hash
                    parts.append(witness(origin,th,segment['start'],segment['end']))
                save_hit(hit,parts,'corpus-chunk-boundary')
        previous = {**block,'text_hash':text_hash}
    xml,xml_gap = xml_sections(descriptor['source_path'],descriptor['original_sha256'])
    for item in xml:
        db.execute('INSERT OR REPLACE INTO document_sections VALUES(?,?,?,?,?,?,?)',(job,doc,ordinal,item['kind'],item['locator'],item['label'],packed(item)))
        ordinal += 1
    if xml_gap: db.execute('INSERT OR IGNORE INTO text_processing_gaps VALUES(?,?,?,?)',(job,doc,'original-xml-structure',xml_gap))
    result = quality.result()
    result.update(body_stream_sha256=source_digest.hexdigest(),section_records=ordinal,
                  heading_candidates=heading_candidates,heading_density=heading_candidates/max(1,result['nonempty_lines']),
                  metadata_language=descriptor['language'],body_adapter=descriptor['body_adapter'],
                  original_sha256=descriptor['original_sha256'],original_hash_basis='recorded assertion; XML structure requires fresh original hash')
    db.execute('INSERT OR REPLACE INTO document_quality VALUES(?,?,?,?,?,?,?,?,?)',
               (job,doc,'completed',result['characters'],result['blocks'],result['replacement_rate'],result['control_rate'],result['repeated_line_rate'],packed(result)))
    lang = language(descriptor['language'])[0]
    coverage = 'english-and-early-english-alias-grammar' if lang in ('en','enm') else 'english-alias-only; language-specific-citation-coverage-deferred'
    db.execute('INSERT OR REPLACE INTO reference_coverage VALUES(?,?,?,?,?,?,?)',(job,doc,lang,coverage,result['blocks'],accepted,rejected))
    if lang not in ('en','enm'):
        db.execute('INSERT OR IGNORE INTO text_processing_gaps VALUES(?,?,?,?)',(job,doc,'language-specific-citations','unsupported-language-or-numbering:'+lang))
    if not result['blocks']:
        raise ValueError('no-existing-text-blocks')
    return 1


def prepare(descriptor,corpus_path):
    if descriptor['excluded_archive']: return {'excluded_archive':True},[]
    files = []
    cache = descriptor['cache_path']
    if cache:
        path = Path(cache)
        if not path.is_file(): return {'missing_cache':cache},[]
        before = path.stat()
        actual = hash_file(path)
        after = path.stat()
        if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns): raise StaleInput('Cache changed during fingerprinting')
        files.append((str(path),actual,after.st_size,after.st_mtime_ns))
        body = actual
    else:
        h = hashlib.sha256()
        for row in corpus_rows(corpus_path,descriptor['document_id']): h.update(packed(row).encode())
        body = h.hexdigest()
    original = Path(descriptor['source_path'])
    if original.suffix.lower()=='.xml' and original.is_file():
        stat = original.stat()
        if stat.st_size<=MAX_BLOCK:
            fingerprint = hash_file(original)
            files.append((str(original),fingerprint,stat.st_size,stat.st_mtime_ns))
        else:
            fingerprint = 'over-size-bound'
    else:
        fingerprint = 'not-available-or-not-xml'
    return {'body_sha256':body,'original_structure_fingerprint':fingerprint,
            'language':descriptor['language'],'kind':descriptor['kind'],'adapter':descriptor['body_adapter'],
            'coordinate_dependency':{'version':'la02-coordinate-dependencies-v2',
                'cache_path':cache,'source_path':descriptor['source_path'],
                'original_sha256':descriptor['original_sha256'],
                'corpus_path':str(corpus_path) if not cache else None}},files


def job_identity(store,descriptor,prepared,parser_hash):
    """Locators depend on paths/assertions as well as identical text bytes.

    Earlier verified jobs can be reused when their captured coordinate fields
    still match, avoiding a forced replay of unchanged completed populations.
    """
    def identity(value):
        fingerprint = digest({'input':value,'parser':parser_hash,'document_id':descriptor['document_id']})
        job = digest({'task':'text-analysis','fingerprint':fingerprint,'version':VERSION})
        return job,fingerprint
    current = identity(prepared)
    if 'coordinate_dependency' not in prepared: return current
    legacy = identity({k:v for k,v in prepared.items() if k!='coordinate_dependency'})
    row = store.db.execute('SELECT state FROM jobs WHERE id=?',(legacy[0],)).fetchone()
    if row and row['state']=='succeeded':
        for captured in store.db.execute('''SELECT s.descriptor_json,t.corpus_path FROM run_jobs r
            JOIN text_scope s ON s.run_id=r.run_id AND s.document_id=?
            JOIN text_runs t ON t.id=s.run_id WHERE r.job_id=? AND r.scope=?''',
            (descriptor['document_id'],legacy[0],'text:'+descriptor['document_id'])):
            old = json.loads(captured['descriptor_json'])
            if (all(old.get(key)==descriptor.get(key) for key in ('cache_path','source_path','original_sha256'))
                    and (descriptor['cache_path'] or captured['corpus_path']==str(prepared['coordinate_dependency']['corpus_path']))):
                return legacy
    return current


def validate_text(store,run):
    db = store.db
    record = db.execute('SELECT * FROM text_runs WHERE id=?',(run,)).fetchone()
    expected = db.execute('SELECT count(*) FROM text_scope WHERE run_id=?',(run,)).fetchone()[0]
    actual = db.execute('SELECT count(*) FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id WHERE r.run_id=?',(run,)).fetchone()[0]
    states = [dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? GROUP BY j.state',(run,))]
    missing = db.execute('''SELECT count(*) FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id LEFT JOIN reference_coverage c
        ON c.job_id=q.job_id AND c.document_id=q.document_id WHERE r.run_id=? AND c.document_id IS NULL''',(run,)).fetchone()[0]
    mismatched = db.execute('''SELECT count(*) FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? AND
        (c.accepted!=(SELECT count(*) FROM literal_references l WHERE l.job_id=c.job_id AND l.document_id=c.document_id)
        OR c.rejected!=(SELECT count(*) FROM reference_rejections x WHERE x.job_id=c.job_id AND x.document_id=c.document_id))''',(run,)).fetchone()[0]
    changed = []
    for row in db.execute('SELECT * FROM text_input_files WHERE run_id=?',(run,)):
        p = Path(row['path'])
        if not p.exists() or (p.stat().st_size,p.stat().st_mtime_ns)!=(row['size'],row['mtime_ns']): changed.append(row['path'])
    integrity = db.execute('PRAGMA quick_check').fetchone()[0]
    return {'ok':actual==expected and not missing and not mismatched and not changed and integrity=='ok' and all(r['state']=='succeeded' for r in states),
            'expected_documents':expected,'accounted_documents':actual,'job_states':states,'missing_reference_coverage':missing,
            'reference_count_mismatches':mismatched,'changed_input_files':changed,'sqlite_quick_check':integrity,
            'limits':'Selected snapshot; non-English grammar/numbering coverage is partial; literal citations do not imply agreement.'}


def export_text(store,run,root,validation,elapsed=None,progress=None):
    db = store.db
    folder = root/'text-releases'/run
    folder.mkdir(parents=True,exist_ok=True)
    counters = {}
    for table in ('document_quality','document_sections','literal_references','reference_rejections','reference_coverage','text_processing_gaps'):
        with (folder/(table+'.jsonl')).open('w',encoding='utf-8') as f:
            n = 0
            for row in db.execute(f'SELECT t.* FROM {table} t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=?',(run,)):
                f.write(packed(dict(row))+'\n');n+=1
            counters[table] = n
    metrics = dict(db.execute('SELECT sum(q.characters) characters,sum(q.blocks) text_blocks,sum(q.status="completed") completed_documents,sum(q.status="excluded") excluded_documents FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id WHERE r.run_id=?',(run,)).fetchone())
    with (folder/'failed-text-jobs.jsonl').open('w',encoding='utf-8') as f:
        for row in db.execute("SELECT j.scope,j.state,j.error,j.attempts FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'",(run,)):
            f.write(packed(dict(row))+'\n')
    coverage = [dict(r) for r in db.execute('SELECT c.language,c.coverage,count(*) documents,sum(c.accepted) references_found FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? GROUP BY c.language,c.coverage',(run,))]
    gaps = [dict(r) for r in db.execute('SELECT g.stage,g.reason,count(*) documents FROM text_processing_gaps g JOIN run_jobs r ON r.job_id=g.job_id WHERE r.run_id=? GROUP BY g.stage,g.reason',(run,))]
    scope = json.loads(db.execute('SELECT scope_json FROM text_runs WHERE id=?',(run,)).fetchone()[0])
    summary = {'run_id':run,'state':'complete' if validation['ok'] else 'needs-review','created_at':now(),'processor':VERSION,
               'scope':scope,'metrics':metrics,'table_rows':counters,'coverage':coverage,'gaps':gaps,'validation':validation,
               'seconds_this_invocation':elapsed,'jobs_this_invocation':progress,
               'source_coordinates':'Exact extraction-cache block offsets or corpus-chunk offsets; original XML structure uses separately verified XPath locators.',
               'live_mutations':0}
    dump(folder/'summary.json',summary)
    manifest = {'run_id':run,'files':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hash_file(p)} for p in sorted(folder.glob('*')) if p.name!='release_manifest.json']}
    dump(folder/'release_manifest.json',manifest)
    with db: db.execute('UPDATE text_runs SET state=?,summary_json=?,updated_at=? WHERE id=?',(summary['state'],packed(summary),time.time(),run))
    if validation['ok']: dump(root.parent/'latest-text-analysis.json',{'run_id':run,'database':str(store.path),'summary':str(folder/'summary.json'),'release':str(folder)})
    return summary


def run_text(project=PROJECT,root=None,resume=False,kinds=('library_text','library_review'),run_id=None,limit=None):
    root = Path(root or DEFAULT_OUT/'pipeline')
    if not root.resolve().is_relative_to((Path(project)/'KnowledgeBase/library-analytics').resolve()): raise ValueError('Unexpected runtime output')
    background_priority()
    started = time.monotonic()
    store = JobStore(root/'pipeline.sqlite3')
    active = False
    try:
        store.acquire();store.db.executescript(SCHEMA)
        if resume and not run_id:
            row = store.db.execute("SELECT id FROM text_runs WHERE state IN ('running','interrupted','failed') ORDER BY created_at DESC LIMIT 1").fetchone()
            if row: run_id=row['id']
        record = store.db.execute('SELECT * FROM text_runs WHERE id=?',(run_id,)).fetchone() if run_id else None
        if run_id and not record: raise ValueError('Unknown text run')
        if record and record['state']=='complete': raise ValueError('Completed text generations are immutable')
        run_id = run_id or ('la02-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        corpus_path = record['corpus_path'] if record else str(Path(project)/'KnowledgeBase/knowledge.sqlite3')
        with store.db:
            store.db.execute('INSERT OR IGNORE INTO text_runs VALUES(?,?,?,?,?,?,?,NULL)',(run_id,'running',time.time(),time.time(),corpus_path,'{}','{}'))
            store.db.execute("UPDATE text_runs SET state='running' WHERE id=?",(run_id,))
        active = True
        if record and json.loads(record['scope_json']).get('documents'):
            scope,config = json.loads(record['scope_json']),json.loads(record['parser_json'])
        else:
            scope,config = capture(store,run_id,project,list(kinds))
        # Processor changes invalidate results by fingerprint even when resuming
        # a captured, unfinished document population.
        config.update(parser_version=CitationParser.version,scanner_version=REFERENCE_VERSION,
                      quality_version=QUALITY_VERSION,structure_version=STRUCTURE_VERSION)
        with store.db: store.db.execute('UPDATE text_runs SET parser_json=? WHERE id=?',(packed(config),run_id))
        scanner = ReferenceScanner(CitationParser(config['books'],{(b,c):v for b,c,v in config['bounds']}))
        parser_hash = digest(config)
        print(packed({'phase':'analyse','run_id':run_id,'scope':scope}),flush=True)
        last = ''
        done = characters = 0
        progress = {}
        while True:
            rows = store.db.execute('SELECT * FROM text_scope WHERE run_id=? AND document_id>? ORDER BY document_id LIMIT 100',(run_id,last)).fetchall()
            if not rows: break
            last = rows[-1]['document_id']
            for row in rows:
                descriptor = json.loads(row['descriptor_json'])
                preparation_error = None
                try:
                    prepared,files = prepare(descriptor,corpus_path)
                except (OSError,StaleInput,ValueError) as exc:
                    # Local bad/unreadable inputs belong in the same bounded
                    # failure ledger as analysis errors, not a global abort.
                    preparation_error = exc
                    prepared = {'preparation_error':type(exc).__name__,'reason':str(exc),
                                'descriptor_sha256':digest(descriptor)}
                    files = []
                job,fingerprint = job_identity(store,descriptor,prepared,parser_hash)
                store.register(run_id,job,'text-analysis','text:'+descriptor['document_id'],fingerprint,VERSION)
                def writer(db):
                    if preparation_error is not None: raise preparation_error
                    count = analyse(db,job,descriptor,corpus_path,scanner)
                    for p,h,size,mtime in files:
                        path = Path(p)
                        if not path.exists() or (path.stat().st_size,path.stat().st_mtime_ns)!=(size,mtime): raise StaleInput('Body/structure input changed during analysis')
                    if descriptor['body_adapter']=='corpus-chunks':
                        after,_ = prepare(descriptor,corpus_path)
                        if after != prepared: raise StaleInput('Corpus chunk stream changed during analysis')
                    return count
                state = store.execute(job,writer)
                progress[state] = progress.get(state,0)+1
                with store.db:
                    store.db.executemany('INSERT OR REPLACE INTO text_input_files VALUES(?,?,?,?,?,?)',[(run_id,descriptor['document_id'],*f) for f in files])
                done+=1
                metric = store.db.execute('SELECT characters FROM document_quality WHERE job_id=?',(job,)).fetchone()
                if metric: characters+=metric[0]
                if done%100==0 or state in ('failed','stale'):
                    stamp = {'phase':'analyse','run_id':run_id,'documents':done,'expected_documents':scope['documents'],'characters':characters,
                             'jobs':progress,'seconds':round(time.monotonic()-started,2)}
                    dump(root/'text-progress.json',stamp);print(packed(stamp),flush=True)
                if limit and done>=limit:
                    with store.db: store.db.execute("UPDATE text_runs SET state='interrupted',updated_at=? WHERE id=?",(time.time(),run_id))
                    print(packed({'phase':'interrupted-after-calibration','run_id':run_id,'documents':done}),flush=True)
                    return 0
                time.sleep(.001)
        print(packed({'phase':'validate','run_id':run_id}),flush=True)
        validation = validate_text(store,run_id)
        summary = export_text(store,run_id,root,validation,round(time.monotonic()-started,2),progress)
        dump(root/'text-progress.json',{'phase':'finished','run_id':run_id,'state':summary['state'],'metrics':summary['metrics'],'table_rows':summary['table_rows']})
        print(packed({'phase':'finished','run_id':run_id,'state':summary['state'],'metrics':summary['metrics'],'table_rows':summary['table_rows']}),flush=True)
        return 0 if validation['ok'] else 2
    except BaseException as exc:
        if active:
            with store.db: store.db.execute('UPDATE text_runs SET state=?,updated_at=? WHERE id=?',('interrupted' if isinstance(exc,KeyboardInterrupt) else 'failed',time.time(),run_id))
        raise
    finally:
        store.close()
