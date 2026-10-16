"""Complete, metadata-only KR-130 review projection. Never changes extraction.

Run explicitly; acquires the existing global lease and an owned JobStore.
Each source's categories, witness metadata and checkpoint commit atomically.
No content strings, absolute source paths or permission notes enter the projection.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time

from .inputs import ROOT, PROJECT, read, ro, sha, write_json
from ..jobs import JobStore, StaleInput, background_priority, process_identity

RUN='kr130-9ff19bd70babb19631821a6d'
RELEASE='kr130-release-e4bf8385144e10544428ce5d'
MANIFEST_HASH='f41ef98d6843e37882122f39cf427b2f5394db2398b184932edc06c542cba9d9'
HOME=ROOT/'review'
VERSION='kr130-metadata-review-v1'

def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def digest(v):return hashlib.sha256(compact(v).encode()).hexdigest()

def pin_catalog():
    """Pin existing classification records, exact IDs only; no title/name matching."""
    b=Path(PROJECT)/'Website/content/library'
    paths=[b/'authors.json',b/'sources.json']
    for kind in ['works','editions','assets']:paths.extend(sorted((b/'catalog'/kind).glob('*.json')))
    records={str(p.relative_to(b)).replace('\\','/'):read(p) for p in paths}
    value={'files':{str(p.relative_to(b)).replace('\\','/'):sha(p) for p in paths},'records':records}
    ident=digest(value);target=HOME/'inputs'/('catalog-'+ident+'.json')
    if target.exists():
        if read(target)!=value:raise StaleInput('Pinned catalogue collision')
    else:write_json(target,value)
    return target

class Catalog:
    def __init__(self,value):
        records=value['records'];self.authors={a['id']:a for a in records['authors.json']['authors']}
        self.sources={s['id']:s for s in records['sources.json']['sources']}
        self.works={r['id']:r for p,r in records.items() if p.startswith('catalog/works/')}
        self.editions={r['id']:r for p,r in records.items() if p.startswith('catalog/editions/')}
        self.assets={r['id']:r for p,r in records.items() if p.startswith('catalog/assets/')}

    def describe(self,d,disposition,reason,contributors):
        parts=re.split(r'[\\/]',d.get('source_path') or '')
        source_id=next((p for p in parts if p.startswith('source-')),'unassigned')
        asset_id=next((p for p in parts if p.startswith('asset-')),None)
        asset=self.assets.get(asset_id,{})
        edition_id=d.get('edition_id') or asset.get('editionId')
        edition=self.editions.get(edition_id,{})
        work_id=d.get('work_id') or edition.get('workId')
        work=self.works.get(work_id,{})
        memberships=d.get('memberships') or []
        # Reader membership is explicitly a collection lookup, never proof of speaker.
        ids={m[0] for m in memberships if m and m[0] in self.authors}
        ids.update(c['authorId'] for c in work.get('creators',[]) if c.get('authorId') in self.authors)
        people=[self.authors[k] for k in sorted(ids)]
        source=self.sources.get(source_id,{})
        readers=d.get('readers') or []
        flags=list((d.get('quality') or {}).get('flags') or [])
        if not d.get('author_label'):flags.append('author-not-recorded')
        if not work_id:flags.append('work-unresolved')
        if not edition_id:flags.append('edition-unresolved')
        cautions=list(work.get('reading',{}).get('cautions',[]))
        cautions.extend(r['reviewWarning'] for r in readers if r.get('reviewWarning'))
        return dict(id=d['document_id'],title=d.get('title') or 'Title not recorded',
            author=d.get('author_label') or 'Author not recorded',
            source=source.get('name') or source_id,sourceId=source_id,
            family=d.get('source_family') or 'unknown',sourceUrl=source.get('url') or '',
            language=d.get('language') or 'unknown',genre=d.get('genre') or 'unknown',
            disposition=disposition,reason=reason,workId=work_id,editionId=edition_id,
            assetSha256=d.get('original_sha256'),identityBasis=d.get('identity_basis') or 'unresolved',
            collections=sorted(set(work.get('collections') or ['unassigned'])),
            collectionBasis='exact-work-id' if work.get('collections') else 'unassigned',
            traditions=sorted({t for p in people for t in p.get('traditions',[])}) or ['unassigned'],
            traditionBasis='catalogue creator / recorded membership; not statement attribution' if people else 'unassigned',
            memberships=[{'id':m[0],'basis':m[1] if len(m)>1 else 'unrecorded','label':self.authors.get(m[0],{}).get('name') or m[0]} for m in memberships],
            catalogPeople=[{'id':p['id'],'name':p['name'],'traditions':p.get('traditions',[]),'reviewType':p.get('review',{}).get('kind','unrecorded')} for p in people],
            contributors=contributors,qualityFlags=sorted(set(flags)),cautions=cautions,
            credits=sorted({r['credit'] for r in readers if r.get('credit')}),
            availability=sorted({r['availability'] for r in readers if r.get('availability')}))

def contract(catalog):
    delivered=read(ROOT/'delivered-release.json');done=read(ROOT/'delivery-complete.json')
    m=ROOT/'releases'/RELEASE/'release_manifest.json'
    if delivered['run_id']!=RUN or delivered['release_id']!=RELEASE or sha(m)!=MANIFEST_HASH or not done['release_verification']:
        raise StaleInput('Expected verified pinned KR-130 release')
    p=ROOT/'arguments.sqlite3';s=p.stat()
    return dict(version=VERSION,run=RUN,release=RELEASE,manifest=MANIFEST_HASH,
        database={'size':s.st_size,'mtime_ns':s.st_mtime_ns},catalog=sha(catalog),
        processor=sha(Path(__file__)),jobs=sha(Path(__file__).parents[1]/'jobs.py'))

def guard(db,expected):
    row=db.execute('SELECT value FROM review_meta WHERE key=?',('contract',)).fetchone()
    if row and json.loads(row[0])!=expected:raise StaleInput('Changed projection inputs; use a new generation')
    with db:db.execute('INSERT OR IGNORE INTO review_meta VALUES(?,?)',('contract',compact(expected)))

SCHEMA='''
CREATE TABLE IF NOT EXISTS review_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS review_documents(id TEXT PRIMARY KEY,metadata TEXT NOT NULL,statements INTEGER,qualifications INTEGER,links INTEGER);
CREATE TABLE IF NOT EXISTS review_facets(document_id TEXT,category TEXT,dimensions TEXT,n INTEGER,example TEXT,PRIMARY KEY(document_id,category,dimensions));
CREATE TABLE IF NOT EXISTS review_details(document_id TEXT PRIMARY KEY,value TEXT NOT NULL);
'''

def statement_facet(r):
    return (r['kind'],r['speaker_role'],r['endorsement'],r['negation'],r['attribution_basis'],r['uncertainty_json'])

def statement_example(r):
    return {k:r[k] for k in ['id','version_id','segment_ordinal','start','end','speaker_label','speaker_role','endorsement','negation','attribution_basis']}

def one_document(source,doc,link_index):
    counts=Counter();samples={};link_counts=Counter();link_examples={};total=0;first_qualified=None
    fields='id,version_id,segment_ordinal,start,end,kind,speaker_label,speaker_role,endorsement,negation,attribution_basis,uncertainty_json'
    for r in source.execute('SELECT '+fields+' FROM statements INDEXED BY statements_run_document WHERE run_id=? AND document_id=?',(RUN,doc)):
        key=statement_facet(r);counts[key]+=1;total+=1
        if key not in samples:samples[key]=statement_example(r)
        for link in link_index.get(r['id'],()):
            link_counts[(link['kind'],link['basis'],link['state'])]+=1
            link_examples.setdefault((link['kind'],link['basis'],link['state']),link)
    facets=[]
    for key,n in sorted(counts.items()):
        dims=dict(zip(['kind','role','endorsement','negation','attribution','uncertainty'],key));dims['uncertainty']=json.loads(dims['uncertainty'])
        facets.append((doc,'statements',compact(dims),n,compact(samples[key])))
    for key,n in sorted(link_counts.items()):facets.append((doc,'links',compact(dict(zip(['kind','basis','state'],key))),n,compact(link_examples[key])))
    return total,sum(link_counts.values()),facets

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog',type=Path)
    args=parser.parse_args();HOME.mkdir(parents=True,exist_ok=True)
    catalog_path=args.catalog or pin_catalog();c=contract(catalog_path);generation='review-'+digest(c)[:24]
    folder=HOME/generation;folder.mkdir(exist_ok=True)
    write_json(folder/'contract.json',c)
    global_store=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    store=JobStore(folder/'review.sqlite3');source=None;started=time.time()
    status={'generation':generation,'state':'acquiring-global-lease','pid':__import__('os').getpid(),'process_token':process_identity(__import__('os').getpid()),'startedAt':datetime.now(timezone.utc).isoformat()}
    def progress(**kw):
        status.update(kw);status['updatedAt']=datetime.now(timezone.utc).isoformat();status['seconds']=round(time.time()-started,2)
        write_json(HOME/'progress.json',status)
    try:
        store.db.executescript(SCHEMA);guard(store.db,c)
        global_store.acquire();store.acquire();background_priority()
        source=ro(ROOT/'arguments.sqlite3');catalog=Catalog(read(catalog_path))
        manifest=read(ROOT/'releases'/RELEASE/'release_manifest.json')
        expected_links=next(f['rows'] for f in manifest['files'] if f['path']=='argument_links.jsonl.gz')
        progress(state='running',phase='link-metadata-index',expectedLinks=expected_links)
        # Bounded by released 4.16m records; this machine has >70GiB free.
        # No source text is selected, and target IDs/roles are retained verbatim.
        link_index=defaultdict(list);i=0
        for i,r in enumerate(source.execute('SELECT id,source_id,target_id,kind,basis,state FROM argument_links WHERE run_id=?',(RUN,)),1):
            link_index[r['source_id']].append(dict(r))
            if i%100000==0:progress(indexedLinks=i);global_store.heartbeat()
        if i!=expected_links:raise StaleInput('Pinned link count differs')
        contributors=defaultdict(list)
        for r in source.execute('SELECT document_id,label,role,basis FROM contributors WHERE run_id=? ORDER BY document_id,ordinal',(RUN,)):
            contributors[r['document_id']].append({k:r[k] for k in ['label','role','basis']})
        rows=source.execute('SELECT s.*,r.statements,r.qualifications,r.links FROM scope s LEFT JOIN document_results r ON r.run_id=s.run_id AND r.document_id=s.document_id WHERE s.run_id=? ORDER BY s.document_id',(RUN,)).fetchall()
        pending=[]
        for r in rows:
            doc=r['document_id'];fingerprint=digest([generation,doc,r['fingerprint']]);job='review-doc-'+fingerprint
            pending.append((r,job))
        store.register_many((generation,job,'kr130-review-projection',r['document_id'],generation,VERSION) for r,job in pending)
        done_rows={r['scope'] for r in store.db.execute("SELECT scope FROM jobs WHERE state='succeeded'")}
        completed_statements=sum(r['statements'] or 0 for r in rows if r['document_id'] in done_rows)
        total_statements=sum(r['statements'] or 0 for r in rows)
        progress(phase='source-categories',expectedSources=len(rows),completedSources=len(done_rows),expectedStatements=total_statements,completedStatements=completed_statements)
        def writer_for(row):
            def writer(db):
                doc=row['document_id'];d=json.loads(row['descriptor_json'])
                metadata=catalog.describe(d,row['disposition'],row['reason'],contributors.get(doc,[]))
                n,q,l=row['statements'] or 0,row['qualifications'] or 0,row['links'] or 0
                facets=[];examples={}
                if n:
                    actual,actual_links,facets=one_document(source,doc,link_index)
                    if (actual,actual_links)!=(n,l):raise ValueError(f'Document category reconciliation failed {doc}: {actual}/{n}, links {actual_links}/{l}')
                    if q:
                        witness=source.execute('SELECT q.id,q.statement_id,q.kind,q.start,q.end,q.state FROM statements s INDEXED BY statements_run_document JOIN qualifications q ON q.statement_id=s.id WHERE s.run_id=? AND s.document_id=? LIMIT 1',(RUN,doc)).fetchone()
                        if not witness:raise ValueError('Missing qualification witness')
                        facets.append((doc,'qualifications',compact({'kind':'all-scope-witnesses','state':'candidate'}),q,compact(dict(witness))))
                    # All category examples remain metadata witnesses, not randomly sampled quality evidence.
                    examples={'statements':[json.loads(f[4])|{'dimensions':json.loads(f[2]),'count':f[3]} for f in facets if f[1]=='statements'],
                              'links':[json.loads(f[4])|{'count':f[3]} for f in facets if f[1]=='links'],
                              'qualifications':[json.loads(f[4])|{'count':f[3]} for f in facets if f[1]=='qualifications']}
                    for example in examples['statements']:
                        span=source.execute('SELECT coordinate,block_ordinal,locator,section_start,section_end,asset_sha256 FROM source_spans WHERE statement_id=?',(example['id'],)).fetchone()
                        if span:example['location']=dict(span)
                db.execute('INSERT OR REPLACE INTO review_documents VALUES(?,?,?,?,?)',(doc,compact(metadata),n,q,l))
                db.execute('DELETE FROM review_facets WHERE document_id=?',(doc,))
                db.executemany('INSERT INTO review_facets VALUES(?,?,?,?,?)',facets)
                db.execute('INSERT OR REPLACE INTO review_details VALUES(?,?)',(doc,compact(examples)))
                return len(facets)+1
            return writer
        batch=[]
        for row,job in pending:
            if row['document_id'] in done_rows:continue
            batch.append((row,job))
            if len(batch)<16:continue
            result=store.execute_many([(j,writer_for(r)) for r,j in batch],retry_failed=True)
            if any(v not in ('completed','skipped') for v in result.values()):raise RuntimeError('Projection job failed: '+compact(dict(store.db.execute("SELECT scope,error FROM jobs WHERE state IN ('failed','stale') LIMIT 1").fetchone())))
            completed_statements+=sum(r['statements'] or 0 for r,j in batch);done_rows.update(r['document_id'] for r,j in batch);batch=[]
            progress(completedSources=len(done_rows),completedStatements=completed_statements,statementPercent=round(100*completed_statements/total_statements,2));global_store.heartbeat()
        if batch:
            result=store.execute_many([(j,writer_for(r)) for r,j in batch],retry_failed=True)
            if any(v not in ('completed','skipped') for v in result.values()):raise RuntimeError('Final projection batch failed')
        if contract(catalog_path)!=c:raise StaleInput('Inputs changed during projection')
        totals=dict(store.db.execute('SELECT count(*) sources,sum(statements) statements,sum(qualifications) qualifications,sum(links) links FROM review_documents').fetchone())
        facets={r[0]:r[1] for r in store.db.execute('SELECT category,sum(n) FROM review_facets GROUP BY category')}
        for k in ['statements','qualifications','links']:
            expected=next(f['rows'] for f in manifest['files'] if f['path']==({'links':'argument_links'}.get(k,k)+'.jsonl.gz'))
            if totals[k]!=expected or facets[k]!=expected:raise ValueError('Projection totals do not reconcile: '+k)
        receipt={'generation':generation,'state':'complete','sourceRun':RUN,'sourceRelease':RELEASE,'totals':totals,'facetTotals':facets,'seconds':round(time.time()-started,2),'catalogSha256':c['catalog'],'inputContract':c,'database':str(folder/'review.sqlite3'),'checks':['all scope records projected','per-document statement and link totals reconciled','qualification totals from verified document_results','all three facet totals equal released table row counts','changed input guard passed'],'bodyExported':False}
        write_json(folder/'complete.json',receipt);write_json(HOME/'completed-projection.json',receipt)
        progress(state='complete',phase='verified',completedSources=len(rows),completedStatements=total_statements,statementPercent=100)
        print(compact(receipt),flush=True)
    except Exception as e:
        progress(state='failed',error=str(e));raise
    finally:
        if source:source.close()
        store.close();global_store.close()

if __name__=='__main__':main()
