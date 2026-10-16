"""Apply only unique exact-title/author work links, with original-hash receipts.
Uses the existing durable identity-fill owner. Never changes the live corpus.
"""
import hashlib,json,os,sqlite3,sys,unicodedata
from collections import defaultdict,Counter
from datetime import datetime,timezone
from pathlib import Path
SITE=Path(__file__).resolve().parents[1];sys.path.insert(0,str(SITE))
from knowledge.library_analytics.jobs import process_identity
PRIVATE=SITE/'.local/local-library';OUT=PRIVATE/'reconciliation';OUT.mkdir(parents=True,exist_ok=True)
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def stamp():return datetime.now(timezone.utc).isoformat()
def write(p,v):
 temp=p.with_suffix('.'+str(os.getpid())+'.tmp');temp.write_text(json.dumps(v,ensure_ascii=False)+'\n',encoding='utf-8');os.replace(temp,p)
def key(v):return ''.join(c for c in unicodedata.normalize('NFKC',v).casefold() if c.isalnum())
def run():
 lock=OUT/'owner.json'
 if lock.exists():
  old=read(lock)
  if process_identity(old['pid']) not in (None,):raise RuntimeError('Catalogue reconciliation already has an owner')
 owner={'pid':os.getpid(),'processToken':process_identity(os.getpid()),'startedAt':stamp()};write(lock,owner)
 counts=Counter();progress=owner|{'state':'running','counts':{},'scope':'All unlinked profile reading copies; exact source-hash or unique exact title plus matching author; no corpus/model/embedding writes'}
 write(OUT/'progress.json',progress)
 try:
  index=read(PRIVATE/'index.json');docs=index['documents'];db=sqlite3.connect((PRIVATE/'catalog.sqlite3').as_uri()+'?mode=ro',uri=True)
  missing=[r[0] for r in db.execute("SELECT identity FROM issues WHERE kind='reading_copy_without_canonical_work'")]
  works={i:json.loads(raw) for i,raw in db.execute('SELECT id,json FROM works')};db.close()
  by_title=defaultdict(set)
  for wid,w in works.items():
   authors=frozenset(c['authorId'] for c in w.get('creators',[]) if c.get('role','author') in ('author','preacher','attributed-author'))
   for title in [w['title'],*w.get('alternateTitles',[])]:
    if isinstance(title,str):by_title[key(title),authors].add(wid)
  identity=SITE/'content/library/identity-corrections.json';before=identity.read_bytes();original=read(identity);fills={r['sha256']:r for r in original['records']};accepted=[]
  with (OUT/'dispositions.jsonl').open('w',encoding='utf-8') as log:
   for ident in missing:
    r=docs[ident];sha=r['sha256'];result={'copyId':ident,'sha256':sha,'title':r['title'],'authorIds':r['authorIds']}
    candidates=by_title.get((key(r['title']),frozenset(r['authorIds'])),set())
    registered=fills.get(sha)
    if registered:candidates={registered['fields']['workId']}
    if r.get('attributionConflict') or r.get('mixedAttribution'):result['state']='attribution-review'
    elif len(candidates)!=1:result['state']='ambiguous' if candidates else 'no-canonical-match'
    else:
     wid=next(iter(candidates));w=works.get(wid)
     if not w or not set(r['authorIds']).intersection(c.get('authorId') for c in w.get('creators',[])):result['state']='author-conflict'
     else:
      source=Path(r['path']).resolve()
      if not source.is_relative_to((SITE.parent/'sources/library').resolve()):raise ValueError('Source outside library')
      with source.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
      if actual!=sha:result['state']='source-hash-changed'
      else:
       result.update(state='registered' if registered else 'linked',workId=wid,originalRehashed=True)
       if not registered:accepted.append({'sha256':sha,'fields':{'workId':wid},'basis':'Unique exact normalized source title and identical canonical author IDs; original bytes rehashed','evidence':{'sourceTitle':r['title'],'authorIds':r['authorIds'],'canonicalWorkId':wid,'checkedAt':stamp()}})
    counts[result['state']]+=1;counts['processed']+=1;log.write(json.dumps(result,ensure_ascii=False)+'\n');log.flush()
    if counts['processed']%25==0:
     progress.update(updatedAt=stamp(),counts=dict(counts),total=len(missing));write(OUT/'progress.json',progress)
  if identity.read_bytes()!=before:raise RuntimeError('Identity source changed; refusing to overwrite another owner')
  (OUT/'identity-source-before.json').write_bytes(before)
  for row in accepted:fills[row['sha256']]=row
  original['records']=[fills[sha] for sha in sorted(fills)]
  if accepted:write(identity,original)
  # Rebuild only private reading joins; the live intake owner incorporates fills later.
  from reader_catalog import build
  build()
  progress.update(state='complete',finishedAt=stamp(),counts=dict(counts),total=len(missing),newDurableWorkLinks=len(accepted),corpusFieldsChanged=0,remainingRequireReview=counts['no-canonical-match']+counts['ambiguous']+counts['attribution-review']+counts['author-conflict']+counts['source-hash-changed'])
  write(OUT/'progress.json',progress);print(json.dumps(progress),flush=True)
 except BaseException as e:
  progress.update(state='failed',updatedAt=stamp(),error=str(e),counts=dict(counts));write(OUT/'progress.json',progress);raise
 finally:lock.unlink(missing_ok=True)
if __name__=='__main__':run()
