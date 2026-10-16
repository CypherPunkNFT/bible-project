"""Private LA03 consumer tables from a completed, verified product generation."""
import argparse
import hashlib
import json
import math
import sqlite3
import time
from pathlib import Path
from .build import PROJECT,readonly,dump,now
from .inputs import packed,digest
from .jobs import JobStore,background_priority,StaleInput
from .normalize import language

VERSION='la03-consumers-v1'
SCHEMA='''
CREATE TABLE IF NOT EXISTS consumer_runs(id TEXT PRIMARY KEY,parent_run TEXT,created_at TEXT,state TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS source_collection_aliases(run_id TEXT,source_channel TEXT,collection_id TEXT,rule TEXT,PRIMARY KEY(run_id,source_channel));
CREATE TABLE IF NOT EXISTS collection_contribution(run_id TEXT,collection_id TEXT,kind TEXT,documents INTEGER,characters INTEGER,
 known_works INTEGER,known_editions INTEGER,recorded_original_groups INTEGER,source_channels INTEGER,quality_flagged_documents INTEGER);
CREATE TABLE IF NOT EXISTS collection_chapter_profiles(run_id TEXT,collection_id TEXT,kind TEXT,book TEXT,chapter INTEGER,role TEXT,
 linked_documents INTEGER,eligible_documents INTEGER,document_fraction REAL,range_address_associations INTEGER,associations_per_document REAL);
CREATE TABLE IF NOT EXISTS source_chapter_profiles(run_id TEXT,source_family TEXT,kind TEXT,book TEXT,chapter INTEGER,role TEXT,
 linked_documents INTEGER,eligible_documents INTEGER,document_fraction REAL,range_address_associations INTEGER,associations_per_document REAL);
CREATE TABLE IF NOT EXISTS contributor_chapter_profiles(run_id TEXT,contributor_id TEXT,book TEXT,chapter INTEGER,role TEXT,
 linked_documents INTEGER,eligible_documents INTEGER,document_fraction REAL,range_address_associations INTEGER,associations_per_document REAL);
CREATE TABLE IF NOT EXISTS group_vocabulary(run_id TEXT,group_kind TEXT,group_id TEXT,language TEXT,genre TEXT,term TEXT,
 count INTEGER,document_frequency INTEGER,eligible_documents INTEGER,tracked_tokens INTEGER,token_fraction REAL,
 stratum_document_frequency INTEGER,stratum_documents INTEGER,tfidf REAL,comparison_status TEXT);
CREATE TABLE IF NOT EXISTS xml_reader_links(run_id TEXT,document_id TEXT,asset_sha256 TEXT,reader_id TEXT,route TEXT,state TEXT,basis TEXT);
'''
TABLES=('source_collection_aliases','collection_contribution','collection_chapter_profiles','source_chapter_profiles','contributor_chapter_profiles','group_vocabulary','xml_reader_links')


def file_sha(path):
    with Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()


COLLECTION_ALIASES={
    'ia':'internet-archive','internet-archive':'internet-archive','internet archive':'internet-archive',
    'tcp':'tcp','tcp-bulk':'tcp','text creation partnership official public distribution':'tcp',
    'ccel':'ccel','ccel-expansion':'ccel','ccel-catalog':'ccel','reference-library:ccel':'ccel',
    'sword':'crosswire-sword','crosswire':'crosswire-sword','crosswire-sword':'crosswire-sword',
}


def collections(db,parent,run):
    for row in db.execute('SELECT DISTINCT source_family FROM products.document_dimensions WHERE run_id=?',(parent,)):
        raw=row[0];key=raw.casefold().strip();known=key in COLLECTION_ALIASES
        db.execute('INSERT INTO source_collection_aliases VALUES(?,?,?,?)',(run,raw,COLLECTION_ALIASES[key] if known else 'channel:'+raw,
            'explicit-collection-name-alias; raw-channel-retained' if known else 'unmapped-channel; no inferred collection'))
    db.execute('''INSERT INTO collection_contribution SELECT ?,a.collection_id,d.kind,count(*),sum(d.characters),
        count(DISTINCT CASE WHEN d.work_verified THEN d.work_id END),count(DISTINCT CASE WHEN d.edition_verified THEN d.edition_id END),
        count(DISTINCT d.original_sha),count(DISTINCT d.source_family),sum(d.quality_flags_json!='[]')
        FROM products.document_dimensions d JOIN source_collection_aliases a ON a.run_id=? AND a.source_channel=d.source_family
        WHERE d.run_id=? AND d.status='completed' GROUP BY a.collection_id,d.kind''',(run,run,parent))
    return 1


def coverage(db,parent,run):
    db.execute('''INSERT INTO source_chapter_profiles SELECT ?,s.source_family,s.kind,s.book,s.chapter,s.role,s.documents,d.documents,
        s.documents*1.0/d.documents,s.matches,s.matches*1.0/d.documents FROM products.source_scripture s
        JOIN products.source_contribution d ON d.run_id=s.run_id AND d.source_family=s.source_family AND d.kind=s.kind WHERE s.run_id=?''',(run,parent))
    db.execute('''INSERT INTO contributor_chapter_profiles SELECT ?,s.contributor_id,s.book,s.chapter,s.role,s.documents,d.documents,
        s.documents*1.0/d.documents,s.matches,s.matches*1.0/d.documents FROM products.contributor_scripture s
        JOIN products.contributor_profiles d ON d.run_id=s.run_id AND d.contributor_id=s.contributor_id WHERE s.run_id=?''',(run,parent))
    db.execute('''INSERT INTO collection_chapter_profiles SELECT ?,a.collection_id,s.kind,s.book,s.chapter,s.role,sum(s.documents),d.documents,
        sum(s.documents)*1.0/d.documents,sum(s.matches),sum(s.matches)*1.0/d.documents FROM products.source_scripture s
        JOIN source_collection_aliases a ON a.run_id=? AND a.source_channel=s.source_family
        JOIN collection_contribution d ON d.run_id=a.run_id AND d.collection_id=a.collection_id AND d.kind=s.kind WHERE s.run_id=?
        GROUP BY a.collection_id,s.kind,s.book,s.chapter,s.role''',(run,run,parent))
    return 1


def vocabulary(db,parent,run,group):
    """Rank full tracked counts, never the truncated per-document top-term exports."""
    db.create_function('ln',1,math.log,deterministic=True)
    db.create_function('mapped_language',1,lambda value:int(language(value)[1]!='unmapped' and value not in ('und','mul')),deterministic=True)
    for name in ('eligible','memberships','group_docs','group_terms','strata'):
        db.execute('DROP TABLE IF EXISTS temp.'+name)
    db.execute('''CREATE TEMP TABLE eligible AS SELECT d.document_id,d.source_family,d.language,d.genre,f.job_id,f.tracked_tokens
        FROM products.document_dimensions d JOIN products.run_jobs r ON r.run_id=d.run_id AND r.scope='document:'||d.document_id
        JOIN products.document_features f ON f.job_id=r.job_id WHERE d.run_id=? AND f.vocabulary_complete=1''',(parent,))
    db.execute('CREATE UNIQUE INDEX temp.eligible_job ON eligible(job_id)')
    db.execute('CREATE UNIQUE INDEX temp.eligible_document ON eligible(document_id)')
    db.execute('''CREATE TEMP TABLE strata AS WITH counts AS (
        SELECT language,genre,count(*) documents FROM eligible GROUP BY language,genre
        ) SELECT *,mapped_language(language) AND genre NOT IN ('unknown','text','book') AND documents>=3 comparable FROM counts''')
    db.execute('CREATE UNIQUE INDEX temp.strata_key ON strata(language,genre)')
    if group=='collection':
        db.execute('''CREATE TEMP TABLE memberships AS SELECT e.document_id,a.collection_id group_id FROM eligible e
            JOIN source_collection_aliases a ON a.run_id=? AND a.source_channel=e.source_family''',(run,))
    else:
        db.execute('''CREATE TEMP TABLE memberships AS SELECT DISTINCT c.document_id,c.contributor_id group_id
            FROM products.document_contributors c JOIN eligible e ON e.document_id=c.document_id WHERE c.run_id=?''',(parent,))
    db.execute('CREATE UNIQUE INDEX temp.membership_key ON memberships(document_id,group_id)')
    db.execute('''CREATE TEMP TABLE group_docs AS SELECT m.group_id,e.language,e.genre,count(*) documents,sum(e.tracked_tokens) tracked_tokens
        FROM memberships m JOIN eligible e ON e.document_id=m.document_id GROUP BY m.group_id,e.language,e.genre''')
    db.execute('CREATE UNIQUE INDEX temp.group_docs_key ON group_docs(group_id,language,genre)')
    db.execute('''CREATE TEMP TABLE group_terms AS SELECT m.group_id,e.language,e.genre,v.term,sum(v.count) count,count(*) documents
        FROM eligible e CROSS JOIN products.vocabulary_counts v INDEXED BY vocabulary_order JOIN memberships m ON m.document_id=e.document_id
        WHERE v.job_id=e.job_id
        GROUP BY m.group_id,e.language,e.genre,v.term''')
    db.execute('''INSERT INTO group_vocabulary
        WITH measured AS (
          SELECT t.*,g.documents eligible_documents,g.tracked_tokens,s.documents stratum_documents,
            t.count*1.0/max(1,g.tracked_tokens) token_fraction,s.comparable
          FROM group_terms t JOIN group_docs g USING(group_id,language,genre) JOIN strata s USING(language,genre)
        ), frequency_ranked AS (
          SELECT *,row_number() OVER(PARTITION BY group_id,language,genre ORDER BY count DESC,term) frequency_rank
          FROM measured WHERE NOT comparable
        ), candidates AS (
          SELECT * FROM measured WHERE comparable AND count>=3
          UNION ALL
          SELECT group_id,language,genre,term,count,documents,eligible_documents,tracked_tokens,stratum_documents,token_fraction,comparable
          FROM frequency_ranked WHERE frequency_rank<=64
        ), baseline AS (
          SELECT c.*,b.documents stratum_df FROM candidates c JOIN products.stratum_vocabulary b
            ON b.run_id=? AND b.language=c.language AND b.genre=c.genre AND b.term=c.term
        ), scored AS (
          SELECT *,CASE WHEN comparable THEN token_fraction*(ln((1.0+stratum_documents)/(1.0+stratum_df))+1) END score
          FROM baseline WHERE NOT comparable OR stratum_df<=stratum_documents*.8
        ), ranked AS (
          SELECT *,row_number() OVER(PARTITION BY group_id,language,genre ORDER BY CASE WHEN comparable THEN score ELSE count END DESC,term) rank
          FROM scored
        ) SELECT ?,?,group_id,language,genre,term,count,documents,eligible_documents,tracked_tokens,token_fraction,stratum_df,stratum_documents,score,
          CASE WHEN comparable THEN 'complete-counts; same-recorded-language-genre; df>80%-terms-omitted'
               ELSE 'complete-counts; frequency-only; unresolved-comparison-stratum' END
          FROM ranked WHERE rank<=64''',(parent,run,group))
    return db.execute('SELECT count(*) FROM group_vocabulary WHERE run_id=? AND group_kind=?',(run,group)).fetchone()[0]


def xml_readers(db,parent,run,project,dependencies):
    """Locate a verified entry within a held XML asset; the link is to its book only."""
    assets={r[0] for r in db.execute('''SELECT DISTINCT x.asset_sha256 FROM products.xml_entry_links x
        JOIN products.run_jobs r ON r.job_id=x.job_id WHERE r.run_id=? AND x.state='verified-source-entry' ''',(parent,))}
    records={};root=project/'Website/public/content/teacher-library'
    for name,proof in dependencies.items():
        path=Path(name)
        if path.parent!=root/'records':continue
        raw=path.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=proof['sha256']:raise StaleInput('Reader metadata changed: '+name)
        for ident,r in json.loads(raw.decode('utf-8-sig')).items():
            if r.get('sha256') in assets:records.setdefault(r['sha256'],[]).append(r)
    n=0
    for x in db.execute('''SELECT x.document_id,x.asset_sha256 FROM products.xml_entry_links x
        JOIN products.run_jobs r ON r.job_id=x.job_id WHERE r.run_id=? AND x.state='verified-source-entry' ''',(parent,)):
        for reader in records.get(x['asset_sha256'],[]):
            bundles=reader.get('pageBundles',[]);route=None
            if reader.get('availability')=='on-site-text' and reader.get('pages',0)>0 and bundles:
                p=(root/bundles[0]).resolve()
                if p.is_relative_to(root.resolve()) and p.is_file():route='/teachers/works/'+reader['id']
            db.execute('INSERT INTO xml_reader_links VALUES(?,?,?,?,?,?,?)',(run,x['document_id'],x['asset_sha256'],reader['id'],route,
                'on-site-book-route' if route else 'held-reader-record; route-unverified',
                'verified-XML-entry-body + same-recorded-asset-sha256; whole-book-route-only; no page/offset alignment'))
            n+=1
    return n


def run(project=PROJECT):
    project=Path(project);out=project/'KnowledgeBase/library-analytics';root=out/'pipeline';background_priority()
    pointer=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'));parent=pointer['run_id'];summary=json.loads(Path(pointer['summary']).read_text(encoding='utf-8-sig'))
    if summary['state']!='complete' or not summary['validation']['ok']:raise ValueError('Completed validated parent required')
    source=readonly(Path(pointer['database']))
    try:
        parent_state=source.execute('SELECT state,deps_json FROM product_runs WHERE id=?',(parent,)).fetchone()
        if not parent_state or parent_state['state']!='complete':raise ValueError('Parent database generation is incomplete')
        dependencies=json.loads(parent_state['deps_json'])
    finally:source.close()
    shared=JobStore(root/'pipeline.sqlite3');store=None
    run_id='consumer-'+digest({'parent':parent,'version':VERSION})[:24]
    try:
        shared.acquire();store=JobStore(root/'consumers.sqlite3');store.acquire()
        # URI support must be enabled on the connection for ATTACH mode=ro;
        # otherwise Windows treats "file:" as a literal filename.
        store.db.close();store.db=sqlite3.connect(store.path.resolve().as_uri(),uri=True,timeout=10);store.db.row_factory=sqlite3.Row
        store.db.execute('PRAGMA synchronous=FULL');store.db.execute('PRAGMA cache_size=-16384');store.db.execute('PRAGMA temp_store=FILE')
        store.db.executescript(SCHEMA)
        store.db.execute('ATTACH DATABASE ? AS products',(Path(pointer['database']).resolve().as_uri()+'?mode=ro',))
        with store.db:store.db.execute('INSERT OR IGNORE INTO consumer_runs VALUES(?,?,?,?,NULL)',(run_id,parent,now(),'running'))
        for stage,fn in [('collections',lambda db:collections(db,parent,run_id)),('coverage',lambda db:coverage(db,parent,run_id)),('collection-vocabulary',lambda db:vocabulary(db,parent,run_id,'collection')),
                         ('contributor-vocabulary',lambda db:vocabulary(db,parent,run_id,'contributor')),
                         ('xml-reader-links',lambda db:xml_readers(db,parent,run_id,project,dependencies))]:
            print(packed({'phase':stage,'run_id':run_id}),flush=True)
            job=digest({'stage':stage,'run':run_id,'version':VERSION})
            store.register(run_id,job,'consumer',stage,digest({'parent':parent}),VERSION)
            state=store.execute(job,lambda db:fn(db));shared.heartbeat()
            if state not in ('completed','skipped'):raise RuntimeError('Consumer stage did not complete: '+stage+' '+state)
        db=store.db
        violations={table:db.execute('SELECT count(*) FROM '+table+' WHERE run_id=? AND (linked_documents>eligible_documents OR document_fraction>1 OR document_fraction<0)',(run_id,)).fetchone()[0]
                    for table in ('source_chapter_profiles','contributor_chapter_profiles','collection_chapter_profiles')}
        violations['vocabulary_denominators']=db.execute('''SELECT count(*) FROM group_vocabulary WHERE run_id=? AND
            (document_frequency>eligible_documents OR stratum_document_frequency>stratum_documents OR tracked_tokens<count OR token_fraction>1)''',(run_id,)).fetchone()[0]
        violations['changed_metadata']=sum(not Path(name).is_file() or file_sha(name)!=v['sha256'] for name,v in dependencies.items())
        # The attached parent already passed its own full integrity check.
        # Unqualified quick_check also scans attached databases and temp sorts.
        validation={'ok':not any(violations.values()),'violations':violations,'sqlite_quick_check':db.execute('PRAGMA main.quick_check').fetchone()[0]}
        validation['ok'] &= validation['sqlite_quick_check']=='ok'
        folder=root/'consumer-releases'/run_id;folder.mkdir(parents=True,exist_ok=True);files=[];counts={}
        for table in TABLES:
            p=folder/(table+'.jsonl');h=hashlib.sha256();n=0
            with p.open('wb') as f:
                for row in db.execute('SELECT * FROM '+table+' WHERE run_id=?',(run_id,)):
                    raw=(packed(dict(row))+'\n').encode();f.write(raw);h.update(raw);n+=1
            counts[table]=n;files.append({'name':p.name,'bytes':p.stat().st_size,'rows':n,'sha256':h.hexdigest()})
        result={'run_id':run_id,'parent_run':parent,'processor':VERSION,'state':'complete' if validation['ok'] else 'needs-review',
            'validation':validation,'table_rows':counts,'limits':['Chapter associations are not additive occurrence totals or proof of exposition.',
            'Contributor coverage denominator includes all completed linked corpus kinds; source coverage preserves kind.',
            'Group vocabulary uses full complete tracked lexical counts within recorded language/genre, not truncated work profiles.',
            'Raw-label contributor groups are not resolved people. Frequency differences are not doctrinal classifications.',
            'XML reader links identify the containing asset/book, not an aligned reader page. All outputs remain private.']}
        dump(folder/'summary.json',result);raw=(folder/'summary.json').read_bytes()
        files.append({'name':'summary.json','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
        dump(folder/'release_manifest.json',{'run_id':run_id,'files':files})
        with db:db.execute('UPDATE consumer_runs SET state=?,summary_json=? WHERE id=?',(result['state'],packed(result),run_id))
        if validation['ok']:dump(out/'latest-product-consumers.json',{'run_id':run_id,'parent_run':parent,'database':str(store.path),'release':str(folder),'summary':str(folder/'summary.json')})
        print(packed(result),flush=True);return 0 if validation['ok'] else 2
    finally:
        if store:store.close()
        shared.close()


def status(project=PROJECT):
    """Read the current consumer generation without acquiring a writer lease."""
    root=Path(project)/'KnowledgeBase/library-analytics/pipeline';path=root/'consumers.sqlite3'
    if not path.is_file():return None
    db=readonly(path)
    try:
        db.execute('BEGIN')
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='consumer_runs'").fetchone():return None
        row=db.execute('SELECT id,parent_run,state FROM consumer_runs ORDER BY created_at DESC LIMIT 1').fetchone()
        if not row:return None
        result=dict(row);run=result['id']
        result['stages']=[dict(r) for r in db.execute('SELECT j.scope,j.state,j.error FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=?',(run,))]
        result['coordinator']=dict(db.execute('SELECT * FROM coordinator').fetchone() or {})
        from .product_control import counters
        result['worker_counters']=counters(result['coordinator'])
        result['database_bytes']=path.stat().st_size
        return result
    finally:db.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--project',type=Path,default=PROJECT)
    args=parser.parse_args();raise SystemExit(run(args.project))
