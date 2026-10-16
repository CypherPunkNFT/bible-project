"""Joined private reading catalogue. Source SQLite and catalogue JSON are read-only.

Build: python scripts/reader_catalog.py --build
Query: python scripts/reader_catalog.py --profile author-r-c-sproul
No corpus, embedding, rights, or source-identity changes are made.
"""
import argparse
from collections import Counter,defaultdict
import hashlib
import json
import os
from pathlib import Path
import sqlite3
from datetime import datetime,timezone

SITE=Path(__file__).resolve().parents[1]
PRIVATE=SITE/'.local/local-library'
CATALOG=PRIVATE/'catalog.sqlite3'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def encode(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
def scalar(v):return v if v is None or isinstance(v,(str,int,float)) else encode(v)
def objects(folder):
 for p in sorted(folder.glob('*.json')):yield read(p)

def build():
 index=read(PRIVATE/'index.json');people=read(SITE/'src/data/teachers/people.json')['people']
 docs=index['documents'];profiles=index['profiles'];catalog=SITE/'content/library/catalog'
 target=PRIVATE/'catalog.build.sqlite3';target.unlink(missing_ok=True)
 db=sqlite3.connect(target)
 db.executescript('''
 CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE works(id TEXT PRIMARY KEY,title TEXT NOT NULL,genre TEXT,json TEXT NOT NULL);
 CREATE TABLE work_creators(work_id TEXT,contributor_id TEXT,role TEXT,PRIMARY KEY(work_id,contributor_id,role));
 CREATE INDEX creators_contributor ON work_creators(contributor_id,work_id);
 CREATE TABLE editions(id TEXT PRIMARY KEY,work_id TEXT,json TEXT NOT NULL);
 CREATE TABLE assets(id TEXT PRIMARY KEY,edition_id TEXT,sha256 TEXT,json TEXT NOT NULL);
 CREATE INDEX assets_hash ON assets(sha256);
 CREATE TABLE files(path TEXT PRIMARY KEY,sha256 TEXT,status TEXT,work_id TEXT,edition_id TEXT,title TEXT,source TEXT,language TEXT,has_cache INTEGER,reader_id TEXT);
 CREATE INDEX files_hash ON files(sha256);
 CREATE TABLE reading_copies(id TEXT PRIMARY KEY,sha256 TEXT,title TEXT,language TEXT,format TEXT,json TEXT NOT NULL);
 CREATE TABLE copy_contributors(copy_id TEXT,contributor_id TEXT,PRIMARY KEY(copy_id,contributor_id));
 CREATE INDEX copies_contributor ON copy_contributors(contributor_id,copy_id);
 CREATE TABLE record_bindings(record_id TEXT,copy_id TEXT,PRIMARY KEY(record_id,copy_id));
 CREATE TABLE profile_shelf(profile_id TEXT,record_id TEXT,readable INTEGER,title TEXT,row_json TEXT,PRIMARY KEY(profile_id,record_id));
 CREATE TABLE issues(kind TEXT,identity TEXT,detail TEXT);
 ''')
 # The intake database already contains the canonical catalogue records.
 # Query it directly instead of independently rebuilding identities from JSON exports.
 source=sqlite3.connect((SITE.parent/'KnowledgeBase/knowledge.sqlite3').as_uri()+'?mode=ro',uri=True)
 source.execute('PRAGMA query_only=ON')
 records=defaultdict(list)
 for kind,raw in source.execute("SELECT kind,metadata FROM library_records WHERE kind IN ('work','edition','asset')"):
  records[kind].append(json.loads(raw))
 source.close()
 works={w['id']:w for w in records['work']}
 memberships=defaultdict(set)
 for w in works.values():
  db.execute('INSERT INTO works VALUES(?,?,?,?)',(w['id'],w['title'],w.get('genre'),encode(w)))
  for c in w.get('creators',[]):
   ident=c.get('authorId');role=c.get('role','author')
   if ident:
    db.execute('INSERT OR IGNORE INTO work_creators VALUES(?,?,?)',(w['id'],ident,role));memberships[ident].add(w['id'])
 editions={e['id']:e for e in records['edition']}
 for e in editions.values():db.execute('INSERT INTO editions VALUES(?,?,?)',(e['id'],e.get('workId'),encode(e)))
 bindings={k:list(v) for k,v in index['bindings'].items()}
 # Consume the existing source-of-truth identity owner, including catalogue-worker fills.
 corrections=SITE/'content/library/identity-corrections.json'
 if corrections.is_file():
  for fill in read(corrections)['records']:
   wid=fill['fields']['workId'];ident='local-'+fill['sha256']
   if wid in works and ident in docs:
    creators={c.get('authorId') for c in works[wid].get('creators',[])}
    if creators.intersection(docs[ident]['authorIds']) and not docs[ident].get('attributionConflict'):
     existing=docs[ident].get('workId')
     if existing in (None,wid):bindings.setdefault(wid,[]).append(ident)
 asset_count=0;issues=Counter();by_source=defaultdict(Counter)
 def issue(kind,ident,detail):
  issues[kind]+=1;db.execute('INSERT INTO issues VALUES(?,?,?)',(kind,ident,encode(detail)))
 for a in records['asset']:
  asset_count+=1;db.execute('INSERT INTO assets VALUES(?,?,?,?)',(a['id'],a.get('editionId'),a.get('sha256'),encode(a)))
  wid=editions.get(a.get('editionId'),{}).get('workId');copy='local-'+str(a.get('sha256'))
  if a.get('editionId') not in editions:issue('asset_missing_edition',a['id'],{'editionId':a.get('editionId')})
  if wid and copy in docs:
   creator_ids={c.get('authorId') for c in works.get(wid,{}).get('creators',[])}
   if creator_ids.intersection(docs[copy]['authorIds']):bindings.setdefault(wid,[]).append(copy)
   else:issue('asset_author_conflict',a['id'],{'workId':wid,'copyId':copy})
 for e in editions.values():
  if e.get('workId') not in works:issue('edition_missing_work',e['id'],{'workId':e.get('workId')})
 copy_works=defaultdict(set)
 for wid,ids in bindings.items():
  if wid in works:
   for ident in ids:copy_works[ident].add(wid)
 for r in docs.values():
  db.execute('INSERT INTO reading_copies VALUES(?,?,?,?,?,?)',(r['id'],r['sha256'],r['title'],r['language'],r['format'],encode(r)))
  for pid in r['authorIds']:db.execute('INSERT OR IGNORE INTO copy_contributors VALUES(?,?)',(r['id'],pid))
  if not copy_works[r['id']]:issue('reading_copy_without_canonical_work',r['id'],{'title':r['title'],'authorIds':r['authorIds']})
  if r.get('attributionConflict'):issue('reading_copy_attribution_conflict',r['id'],{'title':r['title']})
 for ident,ids in bindings.items():
  for copy in dict.fromkeys(ids):db.execute('INSERT OR IGNORE INTO record_bindings VALUES(?,?)',(ident,copy))
 source=sqlite3.connect((SITE.parent/'KnowledgeBase/knowledge.sqlite3').as_uri()+'?mode=ro',uri=True)
 source.execute('PRAGMA query_only=ON');file_count=0
 for path,sha,status,raw in source.execute('SELECT path,sha256,status,metadata FROM library_files'):
  file_count+=1;m=json.loads(raw);a=m.get('acquisition') or {};w=m.get('work') or {};e=m.get('edition') or {}
  wid=w.get('id') or a.get('workId');eid=e.get('id') or a.get('editionId');provider=a.get('source') or 'unrecorded'
  copy='local-'+str(sha);linked=copy in docs
  db.execute('INSERT INTO files VALUES(?,?,?,?,?,?,?,?,?,?)',tuple(scalar(v) for v in (path,sha,status,wid,eid,w.get('title') or a.get('title'),provider,a.get('language'),bool(m.get('extraction_cache')),copy if linked else None)))
  by_source[provider]['files']+=1
  if status=='indexed' and Path(path).suffix.lower() in ('.txt','.xml','.html','.htm','.xhtml','.epub','.pdf'):
   by_source[provider]['indexedBodyFiles']+=1
   if linked:by_source[provider]['profileLinkedFiles']+=1
   if not wid:
    by_source[provider]['withoutWorkId']+=1
   elif wid not in works:issue('intake_unknown_work_id',path,{'workId':wid})
   if not (w.get('creators') or a.get('authorId') or a.get('author') or a.get('authors') or (a.get('sourceMetadata') or {}).get('authors')):
    issue('indexed_body_without_author_metadata',path,{'title':a.get('title'),'authorGroup':a.get('authorGroup'),'source':provider,'linkedByFrontMatter':linked})
 source.close()
 profile_report=[]
 for p in people:
  pid=p['id'];file=SITE/'public/content/teacher-profiles'/f'{pid}.json'
  rows=read(file) if file.is_file() else [];unique={};seen=set()
  present={r.get('workId') for r in rows}
  for wid in sorted(memberships[pid]-present):
   w=works[wid];rows.append({'id':wid,'workId':wid,'title':w['title'],'genre':w.get('genre','text'),'reference':'','readable':False})
  for row in rows:
   candidates=bindings.get(row['id'],[]) or bindings.get(row.get('workId'),[])
   held=next((docs[i] for i in candidates if i in docs and pid in docs[i]['authorIds']),None)
   if held:
    row.update(id=held['id'],readable=True,localReadable=True,language=held['language'],format=held['format'],sharedCollection=held.get('mixedAttribution',False));seen.add(held['id'])
   unique.setdefault(row['id'],row)
  for ident in profiles[pid]:
   if ident in seen:continue
   r=docs[ident]
   unique.setdefault(ident,{'id':ident,'workId':r.get('workId'),'title':r['title'],'genre':r['genre'],'reference':'','readable':True,'localReadable':True,'sourceUrl':r.get('sourceUrl'),'edition':True,'language':r['language'],'format':r['format'],'sharedCollection':r.get('mixedAttribution',False)})
  for row in unique.values():db.execute('INSERT INTO profile_shelf VALUES(?,?,?,?,?)',(pid,row['id'],bool(row.get('readable')),row['title'],encode(row)))
  readable=sum(bool(r.get('readable')) for r in unique.values());unreadable=[r for r in unique.values() if not r.get('readable')]
  for r in unreadable:issue('profile_catalogue_without_reading_copy',r['id'],{'profileId':pid,'title':r['title']})
  counts={'profileId':pid,'name':p['name'],'canonicalWorks':len(memberships[pid]),'readableCopies':readable,'catalogueOnlyRecords':len(unreadable),'heldCopiesWithoutCanonicalWork':sum(not copy_works[i] for i in profiles[pid]),'sharedCollectionCopies':sum(bool(docs[i].get('mixedAttribution')) for i in profiles[pid]),'oldHeldCount':p.get('heldTexts',0)}
  profile_report.append(counts)
 built=datetime.now(timezone.utc).isoformat()
 report={'builtAt':built,'scope':'All canonical works/editions/assets and all intake files; reading shelves cover the existing 52 profiles. Source databases, files, rights and embeddings unchanged. Unlinked files are not assigned by guesswork.','totals':{'canonicalWorks':len(works),'canonicalEditions':len(editions),'canonicalAssets':asset_count,'intakeFiles':file_count,'profileReadingCopies':len(docs),'profiles':len(people)},'issues':dict(issues),'profiles':profile_report,'sources':{k:dict(v) for k,v in sorted(by_source.items())},'counting':'Works, editions, assets and readable file copies are separate entities. Shelf title counts are not verified distinct-work counts.'}
 for key,value in [('builtAt',built),('indexBuiltAt',index['builtAt']),('report',report)]:db.execute('INSERT INTO metadata VALUES(?,?)',(key,encode(value)))
 db.commit();db.close();os.replace(target,CATALOG)
 (PRIVATE/'catalog-audit.json').write_text(encode(report)+'\n',encoding='utf-8')
 lines=['# Reading catalogue audit','',f'Built {built}.','',report['scope'],'','| Profile | Catalogue works | Readable copies | Catalogue only | Held copies without work ID |','|---|---:|---:|---:|---:|']
 for p in profile_report:lines.append(f"| {p['name']} | {p['canonicalWorks']} | {p['readableCopies']} | {p['catalogueOnlyRecords']} | {p['heldCopiesWithoutCanonicalWork']} |")
 lines+=['','## Integrity and linkage issues','']+[f'- {k}: {v:,}' for k,v in issues.items()]
 lines+=['','Detailed issue rows are queryable in `catalog.sqlite3`, table `issues`. No uncertain identity has been silently merged.']
 (PRIVATE/'catalog-audit.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
 print(encode({'totals':report['totals'],'issues':report['issues']}),flush=True)

def query(profile):
 db=sqlite3.connect(CATALOG.as_uri()+'?mode=ro',uri=True)
 # A changed reader snapshot must be reconciled before serving a stale shelf.
 stamp=json.loads(db.execute("SELECT value FROM metadata WHERE key='indexBuiltAt'").fetchone()[0])
 if stamp!=read(PRIVATE/'index.json')['builtAt']:raise ValueError('Reading catalogue is stale; rebuild with scripts/reader_catalog.py --build')
 rows=[json.loads(r[0]) for r in db.execute('SELECT row_json FROM profile_shelf WHERE profile_id=? ORDER BY readable DESC,title COLLATE NOCASE,record_id',(profile,))]
 db.close();return rows

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--build',action='store_true');p.add_argument('--profile');args=p.parse_args()
 if args.build:build()
 elif args.profile:print(encode(query(args.profile)))
 else:p.error('Choose --build or --profile')
