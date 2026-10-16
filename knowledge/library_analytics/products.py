"""LA-03 local analytical products; source stores, vectors and UI stay untouched."""
import argparse
import hashlib
import json
import math
import sqlite3
import shutil
import tempfile
import time
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
from .build import PROJECT,DEFAULT_OUT,readonly,dump,now,norm
from .inputs import packed,digest
from .jobs import JobStore,background_priority,StaleInput
from .product_inputs import ProductInputs,BlockReader
from .citation_roles import classify,VERSION as ROLE_VERSION
from .text_features import Features,bible_baseline,VERSION as FEATURE_VERSION
from .xml_bridge import bridge,VERSION as XML_VERSION
from .normalize import language

VERSION='la03-products-v1'
PROFILE_VERSION='la03-profiles-v4'
AGGREGATE_VERSION='la03-aggregate-v2'
SCHEMA='''
CREATE TABLE IF NOT EXISTS product_runs(id TEXT PRIMARY KEY,state TEXT,created_at REAL,updated_at REAL,contract_json TEXT,deps_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS product_metrics(run_id TEXT PRIMARY KEY,updated_at REAL,metrics_json TEXT);
CREATE TABLE IF NOT EXISTS document_dimensions(run_id TEXT,document_id TEXT,text_job_id TEXT,kind TEXT,title TEXT,language TEXT,genre TEXT,
 source_family TEXT,author_label TEXT,original_sha TEXT,work_id TEXT,edition_id TEXT,work_verified INTEGER,edition_verified INTEGER,
 status TEXT,characters INTEGER,literal_matches INTEGER,citation_coverage TEXT,quality_flags_json TEXT,era TEXT,dates_json TEXT,descriptor_json TEXT,
 PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS document_contributors(run_id TEXT,document_id TEXT,contributor_id TEXT,role TEXT,PRIMARY KEY(run_id,document_id,contributor_id,role));
CREATE TABLE IF NOT EXISTS contributor_identities(run_id TEXT,id TEXT,name TEXT,entity_type TEXT,identity_basis TEXT,metadata_json TEXT,PRIMARY KEY(run_id,id));
CREATE TABLE IF NOT EXISTS reader_links(run_id TEXT,document_id TEXT,reader_id TEXT,route TEXT,state TEXT,basis TEXT,PRIMARY KEY(run_id,document_id,reader_id));
CREATE TABLE IF NOT EXISTS document_features(job_id TEXT,document_id TEXT,normalized_sha TEXT,tokens INTEGER,lexical_tokens INTEGER,tracked_tokens INTEGER,
 vocabulary_complete INTEGER,metadata_json TEXT,PRIMARY KEY(job_id,document_id));
CREATE TABLE IF NOT EXISTS vocabulary_counts(job_id TEXT,document_id TEXT,term TEXT,count INTEGER,PRIMARY KEY(job_id,term));
CREATE TABLE IF NOT EXISTS reuse_signatures(job_id TEXT,document_id TEXT,hash TEXT,phrase TEXT,evidence_json TEXT,PRIMARY KEY(job_id,hash));
CREATE TABLE IF NOT EXISTS reference_roles(job_id TEXT,document_id TEXT,text_job_id TEXT,reference_id TEXT,book TEXT,chapter INTEGER,verse INTEGER,
 end_chapter INTEGER,end_verse INTEGER,reference_kind TEXT,role TEXT,rule TEXT,PRIMARY KEY(job_id,reference_id));
CREATE TABLE IF NOT EXISTS document_role_counts(job_id TEXT,document_id TEXT,role TEXT,matches INTEGER,PRIMARY KEY(job_id,role));
CREATE TABLE IF NOT EXISTS xml_assets(job_id TEXT,path TEXT,sha256 TEXT,target_documents INTEGER,verified_entries INTEGER,adapter TEXT,PRIMARY KEY(job_id,path));
CREATE TABLE IF NOT EXISTS xml_entry_links(job_id TEXT,document_id TEXT,asset_path TEXT,asset_sha256 TEXT,entry_key TEXT,locators_json TEXT,state TEXT,evidence_json TEXT,PRIMARY KEY(job_id,document_id));
CREATE TABLE IF NOT EXISTS scripture_matrix(run_id TEXT,document_id TEXT,book TEXT,chapter INTEGER,verse INTEGER,end_chapter INTEGER,end_verse INTEGER,
 reference_kind TEXT,role TEXT,matches INTEGER,sample_reference_id TEXT,text_job_id TEXT);
CREATE TABLE IF NOT EXISTS source_contribution(run_id TEXT,source_family TEXT,kind TEXT,documents INTEGER,characters INTEGER,
 known_works INTEGER,known_editions INTEGER,recorded_original_groups INTEGER,unresolved_work_documents INTEGER,quality_flagged_documents INTEGER);
CREATE TABLE IF NOT EXISTS contributor_profiles(run_id TEXT,contributor_id TEXT,documents INTEGER,characters INTEGER,known_works INTEGER,
 known_editions INTEGER,languages_json TEXT,genres_json TEXT,sources_json TEXT,periods_json TEXT,roles_json TEXT,prose_candidate_matches INTEGER,readable_documents INTEGER);
CREATE TABLE IF NOT EXISTS contributor_scripture(run_id TEXT,contributor_id TEXT,book TEXT,chapter INTEGER,role TEXT,documents INTEGER,matches INTEGER);
CREATE TABLE IF NOT EXISTS source_scripture(run_id TEXT,source_family TEXT,kind TEXT,book TEXT,chapter INTEGER,role TEXT,documents INTEGER,matches INTEGER);
CREATE TABLE IF NOT EXISTS analysis_coverage(run_id TEXT,kind TEXT,language TEXT,status TEXT,documents INTEGER,characters INTEGER,literal_matches INTEGER);
CREATE TABLE IF NOT EXISTS normalized_text_groups(run_id TEXT,normalized_sha TEXT,documents INTEGER,recorded_original_groups INTEGER,known_works INTEGER);
CREATE TABLE IF NOT EXISTS reuse_candidates(run_id TEXT,document_a TEXT,document_b TEXT,shared_informative_signatures INTEGER,signature_overlap REAL,
 candidate_kind TEXT,evidence_hash TEXT,PRIMARY KEY(run_id,document_a,document_b));
CREATE TABLE IF NOT EXISTS stratum_vocabulary(run_id TEXT,language TEXT,genre TEXT,term TEXT,tokens INTEGER,documents INTEGER);
CREATE TABLE IF NOT EXISTS vocabulary_profiles(run_id TEXT,document_id TEXT,term TEXT,count INTEGER,token_fraction REAL,tfidf REAL,comparison_status TEXT);
CREATE TABLE IF NOT EXISTS source_original_contribution(run_id TEXT,source_family TEXT,recorded_originals INTEGER,source_unique_originals INTEGER,shared_originals INTEGER);
CREATE INDEX IF NOT EXISTS document_contrib_identity ON document_contributors(run_id,contributor_id,document_id);
CREATE INDEX IF NOT EXISTS contributor_scripture_key ON contributor_scripture(run_id,contributor_id);
CREATE INDEX IF NOT EXISTS features_job ON document_features(job_id);
CREATE INDEX IF NOT EXISTS vocabulary_order ON vocabulary_counts(job_id,count DESC,term);
'''


def task(store,run,scope,signature,writer):
    job=digest({'scope':scope,'input':signature,'processor':VERSION})
    store.register(run,job,'products',scope,digest(signature),VERSION)
    state=store.execute(job,lambda db:writer(db,job))
    return job,state


def document_batches(db,run):
    """Release each read cursor before committing jobs, allowing WAL checkpoints."""
    for library in (True,False):
        last='';predicate="kind IN ('library_text','library_review')" if library else "kind NOT IN ('library_text','library_review') AND literal_matches>0"
        while True:
            rows=db.execute("SELECT document_id,descriptor_json FROM document_dimensions WHERE run_id=? AND status='completed' AND "+predicate+
                ' AND document_id>? ORDER BY document_id LIMIT 128',(run,last)).fetchall()
            if not rows:break
            last=rows[-1]['document_id']
            for row in rows:yield row


def record_progress(store,run,root,progress):
    with store.db:store.db.execute('INSERT OR REPLACE INTO product_metrics VALUES(?,?,?)',(run,time.time(),packed(progress)))
    try:dump(root/'product-progress.json',progress)
    except OSError as exc:
        # Windows readers can deny an atomic rename. Telemetry must never
        # invalidate committed document results or stop the work queue.
        print(packed({'phase':'progress-copy-warning','run_id':run,'reason':str(exc),'authoritative_progress':'product_metrics in SQLite'}),flush=True)


def capture(inputs,db,run):
    n=0
    for d in inputs.documents():
        reduced={**d,'readers':[{k:r.get(k) for k in ('id','availability','pages','sha256','workId','editionId','licence','credit','reviewWarning')} for r in d['readers']]}
        db.execute('INSERT INTO document_dimensions VALUES('+','.join('?'*22)+')',
            (run,d['document_id'],d['text_job_id'],d['kind'],d['title'],d['language'],d['genre'],d['source_family'],d['author_label'],
             d['original_sha256'],d['work_id'],d['edition_id'],int(d['work_verified']),int(d['edition_verified']),d['status'],d['characters'],
             d['references'],d['citation_coverage'],packed(d['quality'].get('flags',[])),d['era'],packed(d['dates']),packed(reduced)))
        db.executemany('INSERT OR IGNORE INTO document_contributors VALUES(?,?,?,?)',[(run,d['document_id'],ident,role) for ident,role in d['memberships']])
        for r in d['readers']:
            readable=r.get('availability')=='on-site-text' and r.get('pages',0)>0
            bundles=r.get('pageBundles',[])
            exists=False
            if readable and bundles:
                p=(inputs.project/'Website/public/content/teacher-library'/bundles[0]).resolve()
                exists=p.is_relative_to((inputs.project/'Website/public/content/teacher-library').resolve()) and p.is_file()
            state='on-site-route; first-bundle-present' if exists else 'declared-on-site; bundle-unverified' if readable else 'provenance-only'
            db.execute('INSERT INTO reader_links VALUES(?,?,?,?,?,?)',(run,d['document_id'],r['id'],
                '/teachers/works/'+r['id'] if exists else None,state,'same-recorded-original-sha256; route-only, not offset/page alignment'))
        n+=1
        if n%20000==0:print(packed({'phase':'metadata','documents':n}),flush=True)
    for ident,c in inputs.contributors.items():
        db.execute('INSERT INTO contributor_identities VALUES(?,?,?,?,?,?)',(run,ident,c.get('name',''),c.get('entityType') or 'unspecified',c['identity_basis'],packed(c)))
    db.execute('UPDATE product_runs SET deps_json=? WHERE id=?',(packed(inputs.dependencies),run))
    return n


def derive_document(inputs,db,job,d,bible):
    doc=d['document_id'];library=d['kind'] in ('library_text','library_review')
    reader=BlockReader(d,inputs.project/'KnowledgeBase/knowledge.sqlite3')
    f=Features(bible) if library else None;body=hashlib.sha256()
    for b in reader.stream():
        body.update(packed({'ordinal':b['ordinal'],'locator':b.get('locator'),'sha256':b['_sha'],'id':b.get('id')}).encode())
        if f:f.add(b['text'],b['ordinal'])
    if body.hexdigest()!=d['quality'].get('body_stream_sha256'):raise StaleInput('LA02 body stream changed: '+doc)
    if f:
        result=f.result()
        db.execute('INSERT INTO document_features VALUES(?,?,?,?,?,?,?,?)',(job,doc,result['normalized_token_sha256'],result['tokens'],
            result['lexical_tokens'],result['tracked_tokens'],int(result['vocabulary_complete']),packed(result)))
        db.executemany('INSERT INTO vocabulary_counts VALUES(?,?,?,?)',[(job,doc,k,n) for k,n in f.terms.items()])
        db.executemany('INSERT INTO reuse_signatures VALUES(?,?,?,?,?)',[(job,doc,h,e['phrase'],packed(e)) for h,e in f.signatures.items()])
    counts=Counter();rows=[]
    for r in inputs.text.execute('SELECT * FROM literal_references WHERE job_id=?',(d['text_job_id'],)):
        segments=json.loads(r['evidence_json'])['segments']
        for span in segments:reader.get(span)
        role,rule=classify(d['kind'],r['reference_kind'],segments,reader,doc)
        counts[role]+=1
        rows.append((job,doc,d['text_job_id'],r['id'],r['book'],r['chapter'],r['verse'],r['end_chapter'],r['end_verse'],r['reference_kind'],role,rule))
        if len(rows)>=2000:db.executemany('INSERT INTO reference_roles VALUES('+','.join('?'*12)+')',rows);rows.clear()
    if rows:db.executemany('INSERT INTO reference_roles VALUES('+','.join('?'*12)+')',rows)
    if sum(counts.values())!=d['references']:raise ValueError('Reference denominator mismatch')
    db.executemany('INSERT INTO document_role_counts VALUES(?,?,?,?)',[(job,doc,role,n) for role,n in counts.items()])
    reader.unchanged()
    return sum(counts.values())+(len(f.terms) if f else 0)


def xml_stage(inputs,store,run):
    groups=defaultdict(list)
    for component in inputs.pointer['run_ids']:
        for r in inputs.text.execute('''SELECT s.document_id,s.descriptor_json,r.job_id FROM text_scope s
            JOIN run_jobs r ON r.run_id=s.run_id AND r.scope='text:'||s.document_id
            JOIN text_processing_gaps g ON g.job_id=r.job_id AND g.document_id=s.document_id
            WHERE s.run_id=? AND g.stage='original-xml-structure' ''',(component,)):
            d=json.loads(r['descriptor_json']);groups[d['source_path']].append({'document_id':r['document_id'],'text_job_id':r['job_id']})
    for path,targets in sorted(groups.items()):
        p=Path(path)
        if not p.is_file():continue
        stat=p.stat()
        with p.open('rb') as stream:sha=hashlib.file_digest(stream,'sha256').hexdigest()
        inputs.dependencies[path]={'sha256':sha,'size':stat.st_size,'mtime_ns':stat.st_mtime_ns}
        print(packed({'phase':'xml-entry-links','source':p.name,'documents':len(targets)}),flush=True)
        job,state=task(store,run,'xml:'+path,{'sha256':sha,'targets':targets,'version':XML_VERSION},
            lambda db,job:bridge(db,inputs.project,path,targets,sha,job))
        if state in ('failed','stale'):print(packed({'phase':'xml-entry-failure','source':path,'state':state}),flush=True)
    with store.db:store.db.execute('UPDATE product_runs SET deps_json=? WHERE id=?',(packed(inputs.dependencies),run))


def execute_sql(db,statements,params):
    for sql in statements:
        db.execute(sql,params)


def aggregate(db,run):
    # Every table is scoped to this generation; evidence registers stay job-keyed.
    for t in ('scripture_matrix','source_contribution','contributor_profiles','contributor_scripture','source_scripture','analysis_coverage','normalized_text_groups','reuse_candidates','stratum_vocabulary','vocabulary_profiles','source_original_contribution'):
        db.execute('DELETE FROM '+t+' WHERE run_id=?',(run,))
    db.execute('''INSERT INTO scripture_matrix SELECT ?,l.document_id,l.book,l.chapter,l.verse,l.end_chapter,l.end_verse,l.reference_kind,l.role,count(*),min(l.reference_id),l.text_job_id
        FROM reference_roles l JOIN run_jobs r ON r.job_id=l.job_id WHERE r.run_id=?
        GROUP BY l.document_id,l.book,l.chapter,l.verse,l.end_chapter,l.end_verse,l.reference_kind,l.role''',(run,run))
    db.execute('''INSERT INTO source_contribution SELECT run_id,source_family,kind,count(*),sum(characters),
        count(DISTINCT CASE WHEN work_verified THEN work_id END),count(DISTINCT CASE WHEN edition_verified THEN edition_id END),
        count(DISTINCT original_sha),sum(NOT work_verified),sum(quality_flags_json!='[]') FROM document_dimensions
        WHERE run_id=? AND status='completed' GROUP BY source_family,kind''',(run,))
    db.execute('''INSERT INTO analysis_coverage SELECT run_id,kind,language,status,count(*),sum(characters),sum(literal_matches)
        FROM document_dimensions WHERE run_id=? GROUP BY kind,language,status''',(run,))
    db.execute('DROP TABLE IF EXISTS temp.chapter_associations')
    db.execute('CREATE TEMP TABLE chapter_numbers(n INTEGER PRIMARY KEY)')
    maximum=db.execute('SELECT max(end_chapter) FROM scripture_matrix WHERE run_id=?',(run,)).fetchone()[0] or 1
    db.executemany('INSERT INTO chapter_numbers VALUES(?)',[(i,) for i in range(1,maximum+1)])
    db.execute('''CREATE TEMP TABLE chapter_associations AS SELECT m.document_id,m.book,n.n chapter,m.role,m.matches
        FROM scripture_matrix m JOIN chapter_numbers n ON n.n BETWEEN m.chapter AND m.end_chapter WHERE m.run_id=?''',(run,))
    db.execute('CREATE INDEX temp.chapter_assoc_doc ON chapter_associations(document_id)')
    db.execute('''INSERT INTO source_scripture SELECT m.run_id,d.source_family,d.kind,m.book,m.chapter,m.role,count(DISTINCT m.document_id),sum(m.matches)
        FROM (SELECT ? run_id,t.* FROM chapter_associations t) m JOIN document_dimensions d ON d.run_id=m.run_id AND d.document_id=m.document_id
        GROUP BY d.source_family,d.kind,m.book,m.chapter,m.role''',(run,))
    db.execute('''INSERT INTO contributor_scripture SELECT ?,c.contributor_id,m.book,m.chapter,m.role,count(DISTINCT m.document_id),sum(m.matches)
        FROM chapter_associations m JOIN (SELECT DISTINCT document_id,contributor_id FROM document_contributors WHERE run_id=?) c
        ON c.document_id=m.document_id GROUP BY c.contributor_id,m.book,m.chapter,m.role''',(run,run))
    db.execute('''INSERT INTO normalized_text_groups SELECT ?,f.normalized_sha,count(*),count(DISTINCT d.original_sha),count(DISTINCT CASE WHEN d.work_verified THEN d.work_id END)
        FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id
        WHERE r.run_id=? AND f.tokens>0 GROUP BY f.normalized_sha HAVING count(*)>1''',(run,run))
    db.execute('DROP TABLE IF EXISTS temp.lexical_jobs')
    db.execute('''CREATE TEMP TABLE lexical_jobs AS SELECT f.job_id,d.language,d.genre FROM document_features f
        JOIN run_jobs r ON r.job_id=f.job_id JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id
        WHERE r.run_id=? AND f.vocabulary_complete=1''',(run,))
    # Metadata is read once per document, and this index covers term/count.
    # CROSS JOIN fixes the outer loop, preventing 158M document-row lookups.
    db.execute('''INSERT INTO stratum_vocabulary SELECT ?,j.language,j.genre,v.term,sum(v.count),count(*)
        FROM lexical_jobs j CROSS JOIN vocabulary_counts v INDEXED BY vocabulary_order WHERE v.job_id=j.job_id
        GROUP BY j.language,j.genre,v.term''',(run,))
    db.execute('''CREATE INDEX IF NOT EXISTS stratum_vocab_key ON stratum_vocabulary(run_id,language,genre,term)''')
    db.execute('DROP TABLE chapter_numbers')
    # Source-exclusive recorded originals are distinct from unique work identities.
    db.execute('''INSERT INTO source_original_contribution SELECT ?,x.source_family,count(*),sum(n.sources=1),sum(n.sources>1)
        FROM (SELECT DISTINCT source_family,original_sha FROM document_dimensions WHERE run_id=? AND kind IN ('library_text','library_review') AND status='completed' AND original_sha IS NOT NULL) x
        JOIN (SELECT original_sha,count(DISTINCT source_family) sources FROM document_dimensions WHERE run_id=? AND kind IN ('library_text','library_review') AND status='completed' AND original_sha IS NOT NULL GROUP BY original_sha) n
        ON n.original_sha=x.original_sha GROUP BY x.source_family''',(run,run,run))
    return 1


def profiles(db,run):
    print(packed({'phase':'profiles-strata','run_id':run}),flush=True)
    strata={(r['language'],r['genre']):r['docs'] for r in db.execute('''SELECT d.language,d.genre,count(*) docs FROM document_features f
        JOIN run_jobs r ON r.job_id=f.job_id JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id
        WHERE r.run_id=? AND f.vocabulary_complete=1 GROUP BY d.language,d.genre''',(run,))}
    active_stratum=None;baseline={};processed=0
    print(packed({'phase':'profiles-vocabulary','run_id':run}),flush=True)
    for d in db.execute('''SELECT d.*,f.job_id,f.tracked_tokens,f.vocabulary_complete FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id
        JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id WHERE r.run_id=? ORDER BY d.language,d.genre,d.document_id''',(run,)):
        rows=[]
        key=(d['language'],d['genre']);n=strata.get(key,0)
        compatible=d['genre'] not in ('unknown','text','book') and language(d['language'])[1]!='unmapped' and d['language'] not in ('und','mul') and d['vocabulary_complete'] and n>=3
        if compatible:
            if active_stratum!=key:
                baseline={r['term']:r['documents'] for r in db.execute('SELECT term,documents FROM stratum_vocabulary WHERE run_id=? AND language=? AND genre=?',(run,*key))}
                active_stratum=key
            ranked=[]
            for term in db.execute('SELECT term,count FROM vocabulary_counts WHERE job_id=? AND count>=3',(d['job_id'],)):
                df=baseline.get(term['term'],0)
                if df>n*.8:continue
                score=term['count']/max(1,d['tracked_tokens'])*(math.log((1+n)/(1+df))+1)
                ranked.append((score,term['term'],term['count']))
            for score,word,count in sorted(ranked,key=lambda x:(-x[0],x[1]))[:64]:
                rows.append((run,d['document_id'],word,count,count/max(1,d['tracked_tokens']),score,'same-recorded-language-genre; df>80%-terms-omitted'))
        else:
            for term in db.execute('SELECT term,count FROM vocabulary_counts WHERE job_id=? ORDER BY count DESC,term LIMIT 64',(d['job_id'],)):
                rows.append((run,d['document_id'],term['term'],term['count'],term['count']/max(1,d['tracked_tokens']),None,'frequency-only; unresolved-comparison-stratum'))
        db.executemany('INSERT INTO vocabulary_profiles VALUES(?,?,?,?,?,?,?)',rows)
        processed+=1
        if processed%1000==0:print(packed({'phase':'profiles-vocabulary','run_id':run,'documents':processed}),flush=True)
    # Aggregate once, rather than scanning every selected job for every contributor.
    print(packed({'phase':'profiles-memberships','run_id':run}),flush=True)
    db.execute('DROP TABLE IF EXISTS temp.profile_memberships')
    db.execute('CREATE TEMP TABLE profile_memberships AS SELECT DISTINCT document_id,contributor_id FROM document_contributors WHERE run_id=?',(run,))
    db.execute('CREATE UNIQUE INDEX temp.profile_membership_key ON profile_memberships(contributor_id,document_id)')
    db.execute('CREATE INDEX temp.profile_membership_document ON profile_memberships(document_id,contributor_id)')
    print(packed({'phase':'profiles-prose-counts','run_id':run}),flush=True)
    prose_counts={r[0]:r[1] for r in db.execute('''SELECT c.contributor_id,sum(x.matches) FROM document_role_counts x JOIN run_jobs r ON r.job_id=x.job_id
        JOIN profile_memberships c ON c.document_id=x.document_id WHERE r.run_id=? AND x.role IN ('prose_candidate','boundary_prose_candidate')
        GROUP BY c.contributor_id''',(run,))}
    print(packed({'phase':'profiles-reader-counts','run_id':run}),flush=True)
    readable_counts={r[0]:r[1] for r in db.execute('''SELECT c.contributor_id,count(DISTINCT x.document_id) FROM reader_links x
        JOIN profile_memberships c ON c.document_id=x.document_id WHERE x.run_id=? AND x.route IS NOT NULL GROUP BY c.contributor_id''',(run,))}
    # A contributor with several edition roles gets one document membership in counts.
    print(packed({'phase':'profiles-contributors','run_id':run}),flush=True)
    for c in db.execute('SELECT * FROM contributor_identities WHERE run_id=?',(run,)):
        docs=[dict(r) for r in db.execute('''SELECT d.document_id,d.characters,d.work_id,d.edition_id,d.work_verified,d.edition_verified,
            d.language,d.genre,d.source_family,d.era FROM profile_memberships c CROSS JOIN document_dimensions d
            WHERE c.contributor_id=? AND d.run_id=? AND d.document_id=c.document_id AND d.status='completed' ''',(c['id'],run))]
        if not docs:continue
        roles=[r[0] for r in db.execute('SELECT DISTINCT role FROM document_contributors WHERE run_id=? AND contributor_id=? ORDER BY role',(run,c['id']))]
        prose=prose_counts.get(c['id'],0);readable=readable_counts.get(c['id'],0)
        counts=lambda field:packed(dict(Counter(d[field] or 'unknown' for d in docs)))
        db.execute('INSERT INTO contributor_profiles VALUES('+','.join('?'*13)+')',(run,c['id'],len(docs),sum(d['characters'] for d in docs),
            len({d['work_id'] for d in docs if d['work_verified']}),len({d['edition_id'] for d in docs if d['edition_verified']}),
            counts('language'),counts('genre'),counts('source_family'),counts('era'),packed(roles),prose,readable))
    return 1


def reuse(db,run):
    db.execute('DROP TABLE IF EXISTS temp.active_signatures')
    db.execute('''CREATE TEMP TABLE active_signatures AS SELECT s.*,d.language,d.work_id,d.work_verified,f.normalized_sha,f.tokens,
        json_extract(f.metadata_json,'$.retained_signatures') signature_count FROM reuse_signatures s JOIN run_jobs r ON r.job_id=s.job_id
        JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=s.document_id JOIN document_features f ON f.job_id=s.job_id
        WHERE r.run_id=? AND f.tokens>=100 AND json_extract(f.metadata_json,'$.retained_signatures')>=8''',(run,))
    db.execute('CREATE INDEX temp.active_sig_hash ON active_signatures(language,hash,document_id)')
    db.execute('DROP TABLE IF EXISTS temp.informative_hashes')
    db.execute('CREATE TEMP TABLE informative_hashes AS SELECT language,hash,count(*) df FROM active_signatures GROUP BY language,hash HAVING count(*) BETWEEN 2 AND 25')
    db.execute('CREATE UNIQUE INDEX temp.informative_key ON informative_hashes(language,hash)')
    db.execute('''INSERT INTO reuse_candidates SELECT ?,a.document_id,b.document_id,count(*),count(*)*1.0/min(a.signature_count,b.signature_count),
        CASE WHEN a.work_verified AND b.work_verified AND a.work_id=b.work_id THEN 'same-work-edition-candidate' ELSE 'lexical-reuse-candidate' END,min(a.hash)
        FROM informative_hashes h JOIN active_signatures a ON a.hash=h.hash AND a.language=h.language
        JOIN active_signatures b ON b.hash=h.hash AND b.language=h.language AND a.document_id<b.document_id AND a.normalized_sha!=b.normalized_sha
        GROUP BY a.document_id,b.document_id HAVING count(*)>=4''',(run,))
    return 1


TABLES=('document_dimensions','document_contributors','contributor_identities','reader_links','scripture_matrix','source_contribution',
    'contributor_profiles','contributor_scripture','source_scripture','analysis_coverage','normalized_text_groups','reuse_candidates',
    'stratum_vocabulary','vocabulary_profiles','source_original_contribution')


def validate(store,inputs,run):
    db=store.db
    expected=inputs.bundle['table_rows']['literal_references']
    actual=db.execute('SELECT coalesce(sum(matches),0) FROM scripture_matrix WHERE run_id=?',(run,)).fetchone()[0]
    doc_count=db.execute('SELECT count(*) FROM document_dimensions WHERE run_id=?',(run,)).fetchone()[0]
    states=[dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(run,))]
    inherited=json.loads(db.execute('SELECT deps_json FROM product_runs WHERE id=?',(run,)).fetchone()[0])
    changed=[name for name,v in inherited.items() if not Path(name).exists() or (Path(name).stat().st_size,Path(name).stat().st_mtime_ns)!=(v['size'],v['mtime_ns'])]
    integrity=db.execute('PRAGMA main.quick_check').fetchone()[0]
    changed+=inputs.validate_dependencies()
    return {'ok':actual==expected and doc_count==inputs.bundle['table_rows']['document_quality'] and not changed and integrity=='ok'
            and all(r['state']=='succeeded' for r in states),'expected_matches':expected,'matrix_match_sum':actual,
            'documents':doc_count,'job_states':states,'changed_metadata_or_xml_inputs':changed,'sqlite_quick_check':integrity}


def release(store,inputs,run,root,validation):
    db=store.db;folder=root/'product-releases'/run;folder.mkdir(parents=True,exist_ok=True);counts={};manifest=[]
    for table in TABLES:
        record_progress(store,run,root,{'phase':'export','run_id':run,'table':table,'completed_tables':len(counts)})
        p=folder/(table+'.jsonl');h=hashlib.sha256();n=0
        with p.open('wb') as f:
            for row in db.execute('SELECT * FROM '+table+' WHERE run_id=? ORDER BY rowid',(run,)):
                raw=(packed(dict(row))+'\n').encode();f.write(raw);h.update(raw);n+=1
        counts[table]=n;manifest.append({'name':p.name,'rows':n,'bytes':p.stat().st_size,'sha256':h.hexdigest()})
    # Job-keyed tables expose selected version evidence, not other generations.
    for table in ('document_features','reuse_signatures','reference_roles','document_role_counts','xml_assets','xml_entry_links'):
        record_progress(store,run,root,{'phase':'export','run_id':run,'table':table,'completed_tables':len(counts)})
        p=folder/(table+'.jsonl');h=hashlib.sha256();n=0
        with p.open('wb') as f:
            for row in db.execute('SELECT t.* FROM '+table+' t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=?',(run,)):
                raw=(packed(dict(row))+'\n').encode();f.write(raw);h.update(raw);n+=1
        counts[table]=n;manifest.append({'name':p.name,'rows':n,'bytes':p.stat().st_size,'sha256':h.hexdigest()})
    roles=[dict(r) for r in db.execute('SELECT l.role,sum(l.matches) matches,count(*) documents FROM document_role_counts l JOIN run_jobs r ON r.job_id=l.job_id WHERE r.run_id=? GROUP BY l.role',(run,))]
    xml=[dict(r) for r in db.execute('SELECT x.state,count(*) documents FROM xml_entry_links x JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=? GROUP BY x.state',(run,))]
    features=dict(db.execute('''SELECT count(*) documents,sum(f.tokens) tokens,sum(f.vocabulary_complete=0) vocabulary_capped_documents,
        sum(json_extract(f.metadata_json,'$.bible_windows_filtered')) bible_windows_filtered FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id WHERE r.run_id=?''',(run,)).fetchone())
    summary={'run_id':run,'state':'complete' if validation['ok'] else 'needs-review','created_at':now(),'processor':VERSION,'profiles_version':PROFILE_VERSION,'aggregate_version':AGGREGATE_VERSION,
        'text_bundle':inputs.pointer,'validation':validation,'table_rows':counts,'citation_roles':roles,'xml_links':xml,'text_features':features,
        'limits':['Literal prose candidates do not prove exposition, authorship or agreement.','Counts are canonical address-match records, not independent quotations.',
        'Shared reuse fingerprints are candidates; no deletion or automatic merging. Bottom-k content-anchored overlap is not unbiased Jaccard.',
        'KJV phrase filtering is partial; other-language/edition quotations may remain. Common signatures (>25 documents) are excluded from pair generation.',
        'Chapter profiles expand declared address ranges across chapters; they do not establish discussion of every chapter/verse and are not additive occurrence totals.',
        'Vocabulary comparisons require recorded language/genre and complete tracked counts; unresolved strata retain frequency-only profiles.',
        'Reader links are verified at route/first-bundle level, not aligned reader-page offsets. All artifacts are private; no public release is performed.'],
        'live_mutations':0}
    dump(folder/'summary.json',summary)
    raw=(folder/'summary.json').read_bytes();manifest.append({'name':'summary.json','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    dump(folder/'release_manifest.json',{'run_id':run,'files':manifest})
    with db:db.execute('UPDATE product_runs SET state=?,summary_json=?,updated_at=? WHERE id=?',(summary['state'],packed(summary),time.time(),run))
    if validation['ok']:dump(root.parent/'latest-products.json',{'run_id':run,'database':str(store.path),'summary':str(folder/'summary.json'),'release':str(folder)})
    return summary


def run(project=PROJECT,resume=False,limit=None):
    out=Path(project)/'KnowledgeBase/library-analytics';root=out/'pipeline';background_priority()
    shared=JobStore(root/'pipeline.sqlite3');store=None;inputs=None;run_id=None;started=time.monotonic()
    try:
        shared.acquire();store=JobStore(root/'products.sqlite3');store.acquire();store.db.executescript(SCHEMA)
        inputs=ProductInputs(project)
        contract={'text_bundle':inputs.pointer,'role_version':ROLE_VERSION,'feature_version':FEATURE_VERSION,'xml_version':XML_VERSION,'processor':VERSION}
        old=store.db.execute("SELECT * FROM product_runs WHERE state IN ('running','interrupted','failed') ORDER BY created_at DESC LIMIT 1").fetchone() if resume else None
        if old:
            run_id=old['id']
            if json.loads(old['contract_json'])!=contract:raise ValueError('Input contract changed; start a new generation')
            inputs.dependencies.update(json.loads(old['deps_json']))
            if inputs.validate_dependencies():raise StaleInput('Captured metadata changed; start new generation')
        else:run_id='la03-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        with store.db:
            store.db.execute('INSERT OR IGNORE INTO product_runs VALUES(?,?,?,?,?,?,NULL)',(run_id,'running',time.time(),time.time(),packed(contract),'{}'))
            store.db.execute("UPDATE product_runs SET state='running' WHERE id=?",(run_id,))
        print(packed({'phase':'metadata','run_id':run_id}),flush=True)
        task(store,run_id,'metadata',{'generation':run_id,'contract':contract},lambda db,job:capture(inputs,db,run_id))
        xml_stage(inputs,store,run_id)
        corpus=readonly(Path(project)/'KnowledgeBase/knowledge.sqlite3')
        try:bible=bible_baseline(corpus)
        finally:corpus.close()
        bible_signature=digest(sorted(bible))
        print(packed({'phase':'text-products','run_id':run_id,'bible_signature_baseline':len(bible)}),flush=True)
        total=store.db.execute("SELECT count(*) FROM document_dimensions WHERE run_id=? AND status='completed' AND (kind IN ('library_text','library_review') OR literal_matches>0)",(run_id,)).fetchone()[0]
        done=0;states=Counter()
        for row in document_batches(store.db,run_id):
            d=json.loads(row['descriptor_json']);doc=d['document_id']
            signature={'text_job_id':d['text_job_id'],'cache_path':d['cache_path'],'kind':d['kind'],'version':[ROLE_VERSION,FEATURE_VERSION],'bible_signature':bible_signature}
            job,state=task(store,run_id,'document:'+doc,signature,lambda db,job:derive_document(inputs,db,job,d,bible))
            done+=1;states[state]+=1
            if done%50==0 or state in ('failed','stale'):
                progress={'phase':'text-products','run_id':run_id,'documents':done,'expected_documents':total,'jobs':dict(states),'seconds':round(time.monotonic()-started,2)}
                record_progress(store,run_id,root,progress);print(packed(progress),flush=True);shared.heartbeat()
            if limit and done>=limit:
                with store.db:store.db.execute("UPDATE product_runs SET state='interrupted' WHERE id=?",(run_id,))
                print(packed({'phase':'calibration-complete','run_id':run_id,'documents':done,'seconds':round(time.monotonic()-started,2)}),flush=True)
                return 0
        upstream=digest([tuple(r) for r in store.db.execute("SELECT scope,job_id FROM run_jobs WHERE run_id=? AND (scope='metadata' OR scope LIKE 'document:%' OR scope LIKE 'xml:%') ORDER BY scope",(run_id,))])
        previous=upstream
        for stage,fn in [('aggregate',aggregate),('profiles',profiles),('reuse-candidates',reuse)]:
            print(packed({'phase':stage,'run_id':run_id}),flush=True)
            record_progress(store,run_id,root,{'phase':stage,'run_id':run_id,'documents':done,'expected_documents':total,'jobs':dict(states)})
            version=PROFILE_VERSION if stage=='profiles' else AGGREGATE_VERSION if stage=='aggregate' else VERSION
            previous,_=task(store,run_id,stage,{'generation':run_id,'dependencies':previous,'version':version},lambda db,job:fn(db,run_id));shared.heartbeat()
        print(packed({'phase':'validate','run_id':run_id}),flush=True)
        record_progress(store,run_id,root,{'phase':'validate','run_id':run_id,'documents':done,'expected_documents':total,'jobs':dict(states)})
        validation=validate(store,inputs,run_id);summary=release(store,inputs,run_id,root,validation)
        record_progress(store,run_id,root,{'phase':'finished','run_id':run_id,'state':summary['state'],'table_rows':summary['table_rows']})
        print(packed({'phase':'finished','run_id':run_id,'state':summary['state'],'table_rows':summary['table_rows']}),flush=True)
        return 0 if validation['ok'] else 2
    except BaseException as exc:
        if store and run_id:
            with store.db:store.db.execute('UPDATE product_runs SET state=?,updated_at=? WHERE id=?',('interrupted' if isinstance(exc,KeyboardInterrupt) else 'failed',time.time(),run_id))
        raise
    finally:
        if inputs:inputs.close()
        if store:store.close()
        shared.close()


def status(project=PROJECT):
    out=Path(project)/'KnowledgeBase/library-analytics';path=out/'pipeline/products.sqlite3';db=readonly(path)
    try:
        db.execute('BEGIN')
        record=dict(db.execute('SELECT id,state FROM product_runs ORDER BY created_at DESC LIMIT 1').fetchone())
        record['jobs']=[dict(r) for r in db.execute('SELECT j.state,count(*) jobs FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state',(record['id'],))]
        record['features']=dict(db.execute('SELECT count(*) documents,sum(tokens) tokens FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id WHERE r.run_id=?',(record['id'],)).fetchone())
        record['xml']=[dict(r) for r in db.execute('SELECT x.state,count(*) documents FROM xml_entry_links x JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=? GROUP BY x.state',(record['id'],))]
        p=out/'pipeline/product-progress.json';record['progress']=json.loads(p.read_text(encoding='utf-8-sig')) if p.exists() else None
        if db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='product_metrics'").fetchone():
            metric=db.execute('SELECT metrics_json FROM product_metrics WHERE run_id=?',(record['id'],)).fetchone()
            if metric:record['progress']=json.loads(metric[0])
        if (record['state']=='running' and (record.get('progress') or {}).get('phase')=='reuse-candidates'
                and record['jobs'] and all(j['state']=='succeeded' for j in record['jobs'])
                and db.execute("SELECT 1 FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? AND r.scope='reuse-candidates' AND j.state='succeeded'",(record['id'],)).fetchone()):
            # Older live workers did not persist the validation/export phase.
            # Successful final-stage checkpoints establish that derivation ended.
            record['progress']['recorded_phase']='reuse-candidates'
            record['progress']['phase']='completion-checks-and-export'
        folder=out/'pipeline/product-releases'/record['id']
        exports=[(p.name,p.stat()) for p in folder.glob('*.jsonl')] if folder.is_dir() else []
        record['exports']={'files':len(exports),'bytes':sum(s.st_size for _,s in exports),
            'latest_file':max(exports,key=lambda item:item[1].st_mtime_ns)[0] if exports else None}
        if exports and record['state']=='running' and (record.get('progress') or {}).get('phase')=='completion-checks-and-export':
            record['progress']['phase']='export'
        record['database_bytes']=path.stat().st_size;record['disk_free_bytes']=shutil.disk_usage(out).free
        record['temporary_disk_free_bytes']=shutil.disk_usage(tempfile.gettempdir()).free
        record['coordinator']=dict(db.execute('SELECT * FROM coordinator').fetchone() or {})
        from .product_control import counters
        record['worker_counters']=counters(record['coordinator'])
        active=db.execute('''SELECT d.document_id,d.title,d.characters,d.literal_matches,d.kind,d.source_family FROM jobs j
            JOIN run_jobs r ON r.job_id=j.id JOIN document_dimensions d ON d.run_id=r.run_id AND r.scope='document:'||d.document_id
            WHERE r.run_id=? AND j.state='running' LIMIT 1''',(record['id'],)).fetchone()
        record['active_document']=dict(active) if active else None
        from .product_consumers import status as consumer_status
        record['consumer']=consumer_status(project)
        return record
    finally:db.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--resume',action='store_true');parser.add_argument('--limit',type=int);parser.add_argument('--status',action='store_true')
    args=parser.parse_args()
    if args.status:print(packed(status()))
    else:raise SystemExit(run(resume=args.resume,limit=args.limit))
