"""CPU-only, private analytical warehouse over existing library metadata.

Stdlib only. Reads live inputs in bounded batches; never opens the vector store.
Publishes a pointer only after integrity checks and unchanged-input checks pass.
"""
import argparse
import hashlib
import json
import os
import re
import sqlite3
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]
DEFAULT_OUT = PROJECT / 'KnowledgeBase/library-analytics'
BATCH = 1000

def now():
    return datetime.now(timezone.utc).isoformat()

def dump(path, value):
    temp=path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(path)

def norm(value):
    return ' '.join(re.findall(r'[^\W_]+',unicodedata.normalize('NFKC',str(value or '')).casefold()))

def text(value):
    if isinstance(value,str): return value.strip()
    if isinstance(value,list): return '; '.join(text(v) for v in value if text(v))
    return ''

def sha(value):
    return value.lower() if isinstance(value,str) and re.fullmatch('[a-fA-F0-9]{64}',value) else None

ALIASES={'tcp-bulk':'tcp','ccel-expansion':'ccel','ccel-catalog':'ccel'}
def family(value):
    raw=text(value)
    cleaned=raw.removeprefix('library:').removeprefix('source-')
    return ALIASES.get(cleaned,cleaned) or 'unknown'

def readonly(path):
    db=sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True,timeout=5)
    db.row_factory=sqlite3.Row
    db.execute('PRAGMA query_only=ON');db.execute('PRAGMA cache_size=-8192')
    return db

SCHEMA='''
CREATE TABLE observations(
 key TEXT PRIMARY KEY,layer TEXT NOT NULL,native_id TEXT NOT NULL,title TEXT,title_key TEXT,
 author_label TEXT,author_key TEXT,language TEXT,source_raw TEXT,source_family TEXT,source_item_id TEXT,
 original_sha TEXT,body_sha TEXT,work_id TEXT,edition_id TEXT,asset_id TEXT,kind TEXT,genre TEXT,
 availability TEXT,body_candidate INTEGER,readable_declared INTEGER,pages INTEGER,bytes INTEGER,
 path TEXT,reader_route TEXT,metadata_sha TEXT);
CREATE TABLE reader_contributors(reader_id TEXT,contributor_id TEXT,PRIMARY KEY(reader_id,contributor_id));
CREATE TABLE contributors(id TEXT PRIMARY KEY,name TEXT,side TEXT,roles_json TEXT,profile_id TEXT);
CREATE TABLE chunk_counts(document_id TEXT PRIMARY KEY,chunks INTEGER NOT NULL);
CREATE TABLE reference_counts(document_id TEXT PRIMARY KEY,recorded_references INTEGER NOT NULL);
CREATE TABLE input_files(path TEXT PRIMARY KEY,sha256 TEXT,bytes INTEGER,mtime_ns INTEGER);
CREATE TABLE input_streams(name TEXT PRIMARY KEY,rows INTEGER,sha256 TEXT);
CREATE TABLE errors(input TEXT,identity TEXT,error TEXT);
'''

def observation(layer, ident, *, title='',author='',language='',source='',source_item=None,
                original=None,body=None,work=None,edition=None,asset=None,kind='',genre='',availability='',
                body_candidate=False,readable=False,pages=0,size=None,path=None,route=None,metadata=''):
    return (layer+':'+ident,layer,ident,text(title),norm(title),text(author),norm(author),text(language) or 'und',
        text(source),family(source),text(source_item) or None,sha(original),sha(body),work,edition,asset,kind,text(genre),
        text(availability),int(bool(body_candidate)),int(bool(readable)),pages or 0,size,path,route,
        hashlib.sha256(metadata.encode('utf-8')).hexdigest())

def insert(db, rows):
    db.executemany('INSERT INTO observations VALUES('+','.join('?'*26)+')',rows)

def batch_rows(src, table):
    last=0
    while True:
        rows=src.execute(f'SELECT rowid AS input_rowid,* FROM {table} WHERE rowid>? ORDER BY rowid LIMIT ?',(last,BATCH)).fetchall()
        if not rows:break
        last=rows[-1]['input_rowid']
        yield rows

def stream_ingest(src, db, table, convert, log):
    h=hashlib.sha256(); count=0
    for batch in batch_rows(src,table):
        records=[]
        for r in batch:
            h.update(json.dumps(dict(r),ensure_ascii=False,sort_keys=True).encode());h.update(b'\n')
            try:records.append(convert(r))
            except Exception as exc:db.execute('INSERT INTO errors VALUES(?,?,?)',(table,str(r['input_rowid']),str(exc)))
        insert(db,records);count+=len(batch);db.commit()
        if count%25000==0:log(table,rows=count)
        time.sleep(.005)
    db.execute('INSERT INTO input_streams VALUES(?,?,?)',(table,count,h.hexdigest()));db.commit();log(table,rows=count)

def document(r):
    m=json.loads(r['metadata']);a=m.get('acquisition') or {}; w=m.get('work') or {};e=m.get('edition') or {};asset=m.get('asset') or {}
    return observation('corpus',r['id'],title=r['title'],author=a.get('author'),language=r['language'],
        source=a.get('source') or asset.get('sourceId'),source_item=a.get('sourceId'),original=m.get('original_sha256'),
        body=m.get('text_sha256'),work=w.get('id'),edition=e.get('id'),asset=asset.get('id'),kind=r['kind'],
        genre=a.get('textKind') or w.get('type'),availability='in-corpus',body_candidate=r['kind'] in ('library_text','reference'),
        path=r['source'],metadata=r['metadata'])

def resource(r):
    rec=json.loads(r['record']);m=rec.get('metadata') or {}
    return observation('resource',r['id'],title=m.get('title'),author=m.get('author') or m.get('contributor'),
        language=m.get('language'),source=m.get('source') or r['group_id'],source_item=m.get('sourceId'),original=r['sha256'],
        work=m.get('workId'),edition=m.get('editionId'),asset=m.get('assetId'),kind=rec.get('format') or 'resource',
        genre=m.get('textKind') or m.get('genre'),availability=r['availability'],body_candidate=rec.get('bodyCandidate',False),
        size=rec.get('bytes'),path=r['path'],metadata=r['record'])

def inventory(r):
    m=json.loads(r['metadata']);a=m.get('acquisition') or {};w=m.get('work') or {};e=m.get('edition') or {};asset=m.get('asset') or {}
    return observation('intake-file',r['path'],title=a.get('title') or w.get('title'),author=a.get('author'),language=a.get('language'),
        source=a.get('source') or asset.get('sourceId'),source_item=a.get('sourceId'),original=r['sha256'],
        work=w.get('id'),edition=e.get('id'),asset=asset.get('id'),kind='intake-file',genre=a.get('textKind'),
        availability=r['status'],body_candidate=r['status'] in ('indexed','duplicate'),path=r['path'],metadata=r['metadata'])

def read_file(path,db):
    before=path.stat(); data=path.read_bytes();after=path.stat()
    if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):raise ValueError('Input changed while reading: '+str(path))
    db.execute('INSERT INTO input_files VALUES(?,?,?,?)',(str(path),hashlib.sha256(data).hexdigest(),after.st_size,after.st_mtime_ns))
    return json.loads(data.decode('utf-8-sig'))

def ingest_readers(db,project,log):
    root=project/'Website/public/content/teacher-library'
    for idx,path in enumerate(sorted((root/'records').glob('*.json')),1):
        records=read_file(path,db); batch=[]
        for rid,r in records.items():
            batch.append(observation('reader',rid,title=r.get('title'),author=r.get('authors'),language=r.get('language'),
                source=r.get('source'),source_item=r.get('sourceId'),original=r.get('sha256'),work=r.get('workId'),edition=r.get('editionId'),
                kind='reader-record',genre=r.get('genre'),availability=r.get('availability'),body_candidate=True,
                readable=r.get('availability')=='on-site-text' and r.get('pages',0)>0,pages=r.get('pages'),
                route='/teachers/works/'+rid,metadata=json.dumps(r,ensure_ascii=False,sort_keys=True)))
            db.executemany('INSERT INTO reader_contributors VALUES(?,?)',[(rid,c) for c in set(r.get('contributors',[]))])
        insert(db,batch);db.commit()
        if idx%32==0:log('reader-shards',shards=idx)
        time.sleep(.005)
    # Contributor shards are work lists. Identity metadata lives in catalogue.json.
    for c in read_file(root/'catalogue.json',db)['contributors']:
        db.execute('INSERT INTO contributors VALUES(?,?,?,?,?)',(c['id'],c.get('name'),c.get('side'),json.dumps(c.get('roles',[])),c.get('profileId')))
    db.commit()

def aggregate_index(src,db,table,value,log):
    last='';n=0
    while True:
        rows=src.execute(f'SELECT document_id,count(*) n FROM {table} WHERE document_id>? GROUP BY document_id ORDER BY document_id LIMIT ?',(last,BATCH)).fetchall()
        if not rows:break
        last=rows[-1]['document_id'];n+=len(rows)
        db.executemany(f'INSERT INTO {value} VALUES(?,?)',[(r['document_id'],r['n']) for r in rows]);db.commit()
        if n%25000==0:log(value,documents=n)
        time.sleep(.01)
    log(value,documents=n)

def derive(db,log):
    statements=[
    ('indexes', '''CREATE INDEX obs_hash ON observations(original_sha); CREATE INDEX obs_layer ON observations(layer);
        CREATE INDEX obs_body_hash ON observations(body_sha); CREATE INDEX obs_candidate ON observations(layer,title_key,author_key,language);
        CREATE INDEX obs_source ON observations(source_family); CREATE INDEX obs_native ON observations(layer,native_id);'''),
    ('hash-coverage', '''CREATE TABLE hash_coverage AS SELECT original_sha,
        sum(layer='resource') resource_records,sum(layer='corpus') corpus_documents,sum(layer='reader') reader_records,
        sum(layer='intake-file') intake_files,sum(layer='corpus' AND kind='library_text') corpus_text_documents,
        sum(layer='reader' AND readable_declared=1) readable_records,
        count(distinct CASE WHEN layer='resource' THEN source_family END) resource_source_families
        FROM observations WHERE original_sha IS NOT NULL GROUP BY original_sha;
        CREATE UNIQUE INDEX hash_coverage_key ON hash_coverage(original_sha);
        CREATE TABLE reader_crosswalk AS SELECT o.native_id reader_id,o.title,o.original_sha,o.source_family,o.work_id,o.edition_id,
        o.availability,o.pages,o.readable_declared,o.reader_route,
        coalesce(h.resource_records,0) resource_matches,coalesce(h.corpus_documents,0) corpus_matches,
        coalesce(h.corpus_text_documents,0) corpus_text_matches,
        CASE WHEN o.original_sha IS NULL THEN 'missing-recorded-hash'
             WHEN coalesce(h.corpus_documents,0)=0 THEN 'no-corpus-hash-match'
             WHEN h.corpus_documents=1 THEN 'unique-recorded-hash-match' ELSE 'multiple-recorded-hash-matches' END match_state,
        'recorded-original-sha256; bytes not rehashed' match_basis
        FROM observations o LEFT JOIN hash_coverage h USING(original_sha) WHERE o.layer='reader';
        CREATE UNIQUE INDEX reader_crosswalk_id ON reader_crosswalk(reader_id);'''),
    ('coverage-tables', '''CREATE TABLE source_coverage AS SELECT o.layer,o.source_family,count(*) records,
        count(distinct o.original_sha) recorded_byte_groups,sum(o.original_sha IS NULL) missing_hash,
        sum(o.body_candidate) body_candidates,sum(o.readable_declared) readable_declared,
        sum(o.work_id IS NOT NULL) with_work_id,sum(o.edition_id IS NOT NULL) with_edition_id,
        sum(o.author_key='') missing_author,sum(o.language IN ('und','unknown','')) missing_language,
        sum(CASE WHEN o.layer='resource' AND o.availability='held' THEN 1 ELSE 0 END) held_resources,
        sum(CASE WHEN o.layer='resource' THEN o.bytes ELSE NULL END) observed_resource_bytes,
        sum(CASE WHEN o.layer='corpus' THEN coalesce(c.chunks,0) ELSE 0 END) chunks
        FROM observations o LEFT JOIN chunk_counts c ON o.layer='corpus' AND c.document_id=o.native_id GROUP BY o.layer,o.source_family;
        CREATE TABLE language_coverage AS SELECT layer,language,count(*) records,count(distinct original_sha) recorded_byte_groups,
        sum(body_candidate) body_candidates,sum(readable_declared) readable_declared FROM observations GROUP BY layer,language;
        CREATE TABLE genre_coverage AS SELECT layer,kind,genre,count(*) records,sum(body_candidate) body_candidates FROM observations GROUP BY layer,kind,genre;
        CREATE TABLE author_label_coverage AS SELECT layer,author_key,min(author_label) example_label,count(*) records,
        count(distinct original_sha) recorded_byte_groups,count(distinct source_family) sources,sum(readable_declared) readable_declared
        FROM observations WHERE author_key<>'' GROUP BY layer,author_key;
        CREATE TABLE contributor_coverage AS SELECT c.id,c.name,c.side,c.roles_json,c.profile_id,count(rc.reader_id) reader_records,
        sum(coalesce(r.readable_declared,0)) readable_records,count(distinct r.original_sha) recorded_byte_groups
        FROM contributors c LEFT JOIN reader_contributors rc ON c.id=rc.contributor_id
        LEFT JOIN reader_crosswalk r ON r.reader_id=rc.reader_id GROUP BY c.id;'''),
    ('duplicates', '''CREATE TABLE exact_duplicate_groups AS SELECT layer,original_sha,count(*) records,
        count(distinct path) recorded_paths,count(distinct source_family) sources,min(title) example_title
        FROM observations WHERE original_sha IS NOT NULL GROUP BY layer,original_sha HAVING count(*)>1;
        CREATE TABLE extracted_body_groups AS SELECT body_sha,count(*) corpus_documents,count(distinct original_sha) original_byte_groups,min(title) example_title
        FROM observations WHERE layer='corpus' AND body_sha IS NOT NULL GROUP BY body_sha HAVING count(*)>1;
        CREATE TABLE title_author_candidates AS SELECT layer,title_key,author_key,language,count(*) records,
        count(distinct original_sha) original_byte_groups,count(distinct work_id) known_work_ids,min(title) example_title,min(author_label) example_author
        FROM observations WHERE title_key<>'' AND author_key<>'' AND language NOT IN ('und','unknown','')
        AND (layer='reader' OR (layer='resource' AND body_candidate=1)) GROUP BY layer,title_key,author_key,language
        HAVING count(distinct original_sha)>1;
        CREATE VIEW candidate_members AS SELECT o.key,o.layer,o.native_id,o.title,o.author_label,o.language,o.original_sha,o.work_id,o.edition_id
        FROM observations o JOIN title_author_candidates c ON o.layer=c.layer AND o.title_key=c.title_key AND o.author_key=c.author_key AND o.language=c.language;'''),
    ('complementarity', '''CREATE TABLE source_hashes AS SELECT DISTINCT source_family,original_sha FROM observations
        WHERE layer='resource' AND availability='held' AND body_candidate=1 AND original_sha IS NOT NULL;
        CREATE INDEX source_hashes_key ON source_hashes(original_sha,source_family);
        CREATE TABLE source_overlap AS SELECT a.source_family source_a,b.source_family source_b,count(*) shared_recorded_hashes
        FROM source_hashes a JOIN source_hashes b ON a.original_sha=b.original_sha AND a.source_family<b.source_family
        GROUP BY a.source_family,b.source_family;
        CREATE TABLE source_complementarity AS SELECT s.source_family,count(*) held_body_recorded_hashes,
        sum(n.sources=1) hashes_unique_to_source,sum(n.sources>1) hashes_shared_with_other_sources
        FROM source_hashes s JOIN (SELECT original_sha,count(*) sources FROM source_hashes GROUP BY original_sha) n USING(original_sha)
        GROUP BY s.source_family;'''),
    ('repair-opportunities', '''CREATE TABLE quality_issues AS SELECT key,'missing-original-hash' issue,70 priority FROM observations WHERE original_sha IS NULL AND body_candidate=1
        UNION ALL SELECT key,'missing-title',90 FROM observations WHERE title_key='' AND body_candidate=1
        UNION ALL SELECT key,'missing-author-label',60 FROM observations WHERE author_key='' AND body_candidate=1
        UNION ALL SELECT key,'missing-language',50 FROM observations WHERE language IN ('und','unknown','') AND body_candidate=1
        UNION ALL SELECT key,'missing-canonical-work',40 FROM observations WHERE work_id IS NULL AND body_candidate=1
        UNION ALL SELECT 'reader:'||reader_id,'readable-declared-without-corpus-hash-match',85 FROM reader_crosswalk WHERE readable_declared=1 AND corpus_text_matches=0
        UNION ALL SELECT 'reader:'||reader_id,'ambiguous-corpus-hash-match',65 FROM reader_crosswalk WHERE corpus_matches>1;
        CREATE INDEX quality_issue_key ON quality_issues(key);
        CREATE TABLE repair_summary AS SELECT o.layer,o.source_family,q.issue,q.priority,count(*) records,
        count(distinct o.original_sha) recorded_byte_groups FROM quality_issues q JOIN observations o USING(key)
        GROUP BY o.layer,o.source_family,q.issue,q.priority;
        CREATE TABLE recorded_reference_coverage AS SELECT o.source_family,o.kind,count(*) documents,
        sum(coalesce(r.recorded_references,0)) recorded_references,sum(coalesce(r.recorded_references,0)>0) documents_with_recorded_references
        FROM observations o LEFT JOIN reference_counts r ON o.layer='corpus' AND o.native_id=r.document_id WHERE o.layer='corpus' GROUP BY o.source_family,o.kind;
        CREATE VIEW corpus_reader_identity_differences AS SELECT c.native_id document_id,r.native_id reader_id,c.original_sha,
        c.work_id corpus_work_id,r.work_id reader_work_id,c.edition_id corpus_edition_id,r.edition_id reader_edition_id
        FROM observations c JOIN observations r ON c.original_sha=r.original_sha AND c.layer='corpus' AND r.layer='reader'
        WHERE c.original_sha IS NOT NULL AND (coalesce(c.work_id,'')<>coalesce(r.work_id,'') OR coalesce(c.edition_id,'')<>coalesce(r.edition_id,''));''')]
    for name,sql in statements:
        log(name);db.executescript(sql);db.commit()

def rows(db,sql):return [dict(r) for r in db.execute(sql)]

def unresolved_contributors(db):
    db.execute('''CREATE TABLE unresolved_contributors AS
        SELECT rc.contributor_id,count(*) reader_links,
        'Referenced by reader records but absent from catalogue contributor metadata' reason
        FROM reader_contributors rc LEFT JOIN contributors c ON c.id=rc.contributor_id
        WHERE c.id IS NULL GROUP BY rc.contributor_id''')
    db.commit()

def identity_candidates(db):
    db.executescript('''CREATE TABLE identity_backfill_candidates AS
      WITH candidates AS (
        SELECT 'corpus' target_layer,document_id target_id,'work_id' field,reader_work_id proposed_value,
          reader_id evidence_record,original_sha FROM corpus_reader_identity_differences WHERE corpus_work_id IS NULL AND reader_work_id IS NOT NULL
        UNION ALL SELECT 'corpus',document_id,'edition_id',reader_edition_id,reader_id,original_sha
          FROM corpus_reader_identity_differences WHERE corpus_edition_id IS NULL AND reader_edition_id IS NOT NULL
        UNION ALL SELECT 'reader',reader_id,'work_id',corpus_work_id,document_id,original_sha
          FROM corpus_reader_identity_differences WHERE reader_work_id IS NULL AND corpus_work_id IS NOT NULL
        UNION ALL SELECT 'reader',reader_id,'edition_id',corpus_edition_id,document_id,original_sha
          FROM corpus_reader_identity_differences WHERE reader_edition_id IS NULL AND corpus_edition_id IS NOT NULL
      ), grouped AS (
        SELECT target_layer,target_id,field,proposed_value,original_sha,count(distinct evidence_record) evidence_records,
          min(evidence_record) example_evidence_record FROM candidates
          GROUP BY target_layer,target_id,field,proposed_value,original_sha
      )
      SELECT g.*,CASE WHEN count(*) OVER (PARTITION BY target_layer,target_id,field)=1
        THEN 'unique-proposal' ELSE 'ambiguous-proposal' END state,
        'Recorded same-byte metadata assertion; canonical registration and current inputs must be checked before application' limitation
      FROM grouped g;''')
    db.commit()

def build(project,output):
    output.mkdir(parents=True,exist_ok=True)
    lock=output/'build.lock'
    fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    os.write(fd,str(os.getpid()).encode());os.close(fd)
    run=output/('run-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));run.mkdir()
    log_file=run/'progress.json'
    def log(phase,**values):
        dump(log_file,dict(state='running',phase=phase,updatedAt=now(),pid=os.getpid(),**values))
        print(json.dumps(dict(phase=phase,**values)),flush=True)
    src=reg=db=None
    try:
        # One CPU thread, bounded SQLite cache, on-disk temporary sorts.
        if os.name=='nt':
            import ctypes
            ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
        before=json.loads((project/'KnowledgeBase/embedding-progress.json').read_text(encoding='utf-8-sig'))
        src=readonly(project/'KnowledgeBase/knowledge.sqlite3'); reg=readonly(project/'KnowledgeBase/Research Foundation/registry.sqlite3')
        initial=dict(corpusBuild=src.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0],
            corpusDataVersion=src.execute('PRAGMA data_version').fetchone()[0],registryDataVersion=reg.execute('PRAGMA data_version').fetchone()[0])
        db=sqlite3.connect(run/'analytics.sqlite3');db.row_factory=sqlite3.Row
        db.execute('PRAGMA cache_size=-32768');db.execute('PRAGMA temp_store=FILE');db.execute('PRAGMA threads=1');db.executescript(SCHEMA)
        stream_ingest(src,db,'documents',document,log)
        stream_ingest(reg,db,'resources',resource,log)
        stream_ingest(src,db,'library_files',inventory,log)
        ingest_readers(db,project,log)
        aggregate_index(src,db,'chunks','chunk_counts',log)
        aggregate_index(src,db,'references_to','reference_counts',log)
        final=dict(corpusBuild=src.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0],
            corpusDataVersion=src.execute('PRAGMA data_version').fetchone()[0],registryDataVersion=reg.execute('PRAGMA data_version').fetchone()[0])
        src.close();src=None;reg.close();reg=None
        derive(db,log)
        unresolved_contributors(db)
        identity_candidates(db)
        changed_files=[]
        for r in db.execute('SELECT * FROM input_files'):
            p=Path(r['path'])
            if not p.exists() or (p.stat().st_size,p.stat().st_mtime_ns)!=(r['bytes'],r['mtime_ns']):changed_files.append(str(p))
        integrity=db.execute('PRAGMA quick_check').fetchone()[0]
        error_count=db.execute('SELECT count(*) FROM errors').fetchone()[0]
        missing_contributors=db.execute('SELECT count(*) FROM reader_contributors rc LEFT JOIN contributors c ON c.id=rc.contributor_id WHERE c.id IS NULL').fetchone()[0]
        validation=dict(sqliteQuickCheck=integrity,inputVersionsStable=initial==final,changedReaderInputs=changed_files,parseErrors=error_count,
            unmappedReaderContributorLinks=missing_contributors,
            unmappedContributorIdentities=db.execute('SELECT count(*) FROM unresolved_contributors').fetchone()[0],
            unmappedContributorLinksAccountedFor=db.execute('SELECT coalesce(sum(reader_links),0) FROM unresolved_contributors').fetchone()[0]==missing_contributors,
            readerCrosswalkRows=db.execute('SELECT count(*) FROM reader_crosswalk').fetchone()[0],
            readerObservationRows=db.execute("SELECT count(*) FROM observations WHERE layer='reader'").fetchone()[0],
            chunkTotal=db.execute('SELECT sum(chunks) FROM chunk_counts').fetchone()[0],
            duplicateObservationKeys=db.execute('SELECT count(*)-count(distinct key) FROM observations').fetchone()[0])
        summary=dict(createdAt=now(),inputVersions=dict(before=initial,after=final),
            observationCounts=rows(db,'SELECT layer,count(*) records FROM observations GROUP BY layer'),
            tables=rows(db,"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"),
            readerMatches=rows(db,'SELECT match_state,count(*) records FROM reader_crosswalk GROUP BY match_state'),
            readerAvailability=rows(db,'SELECT availability,count(*) records,sum(readable_declared) readable_declared FROM reader_crosswalk GROUP BY availability'),
            duplicates=rows(db,'SELECT layer,count(*) groups,sum(records) member_records,sum(records-1) repeated_records FROM exact_duplicate_groups GROUP BY layer'),
            editionCandidates=rows(db,'SELECT layer,count(*) groups,sum(records) records FROM title_author_candidates GROUP BY layer'),
            validation=validation,
            limits=['Input scopes overlap; counts are not additive books.','Hashes are recorded assertions, not fresh verification of original bytes.',
                    'Reader availability is declared metadata; text bundles not rescanned.','Title/author/language groups are candidates, never identity merges.',
                    'Same bytes shared across sources do not establish independent witnesses.','No vector coverage measured; current corpus excludes pending intake.',
                    'Source buckets include registry collection groups and unmerged provider labels; overlap can reflect multiple catalogue views.',
                    'Contributor labels are not canonical identities; missing canonical records remain missing.'])
        export=run/'exports';export.mkdir()
        for table in ['source_coverage','language_coverage','genre_coverage','contributor_coverage','source_overlap','source_complementarity','repair_summary','recorded_reference_coverage','unresolved_contributors']:
            dump(export/(table+'.json'),rows(db,'SELECT * FROM '+table+' ORDER BY 1,2'))
        # Row-level consumable exports are private JSONL; no source body text.
        for table in ['reader_crosswalk','exact_duplicate_groups','title_author_candidates','identity_backfill_candidates']:
            with (export/(table+'.jsonl')).open('w',encoding='utf-8') as f:
                for row in db.execute('SELECT * FROM '+table):f.write(json.dumps(dict(row),ensure_ascii=False)+'\n')
        db.commit();db.close();db=None
        after=json.loads((project/'KnowledgeBase/embedding-progress.json').read_text(encoding='utf-8-sig'))
        summary['embeddingObservation']=dict(before=before,after=after,note='Status-file observations only; no embedding operations.')
        summary['databaseBytes']=(run/'analytics.sqlite3').stat().st_size
        ok=integrity=='ok' and initial==final and not changed_files and not error_count and validation['unmappedContributorLinksAccountedFor'] and validation['readerCrosswalkRows']==validation['readerObservationRows']
        summary['state']='complete' if ok else 'needs-review'
        dump(run/'summary.json',summary)
        dump(log_file,dict(state=summary['state'],updatedAt=now(),run=str(run)))
        if ok:dump(output/'latest.json',dict(run=run.name,database=str(run/'analytics.sqlite3'),summary=str(run/'summary.json')))
        print(json.dumps(dict(state=summary['state'],run=str(run),counts=summary['observationCounts'],validation=validation)),flush=True)
        return 0 if ok else 2
    except Exception as exc:
        dump(log_file,dict(state='failed',updatedAt=now(),error=str(exc)));raise
    finally:
        for conn in (src,reg,db):
            if conn is not None:conn.close()
        lock.unlink(missing_ok=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',type=Path,default=PROJECT)
    parser.add_argument('--output',type=Path,default=DEFAULT_OUT)
    a=parser.parse_args()
    # Never allow output inside source, public, corpus or vector locations.
    approved=(a.project/'KnowledgeBase/library-analytics').resolve()
    if not a.output.resolve().is_relative_to(approved):parser.error('Output must be under KnowledgeBase/library-analytics')
    raise SystemExit(build(a.project.resolve(),a.output.resolve()))
