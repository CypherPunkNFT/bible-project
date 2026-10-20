"""Private, CPU-only held-library reader for the existing loopback preview.

Database access is read-only. Index and reading pages live under .local/local-library,
outside public/ and dist/. No models, vector access, downloads or shared-cache writes.
"""
from __future__ import annotations
import argparse
import collections
from contextlib import contextmanager
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
import zipfile

SITE=Path(__file__).resolve().parents[1]
STATE=SITE.parent/'KnowledgeBase'
SOURCES=SITE.parent/'sources/library'
PRIVATE=SITE/'.local/local-library'
SCOPE=SITE/'scripts/local-reader-scope.json'


def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def now():return datetime.now(timezone.utc).isoformat()
def write(p,value):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
 temp=p.with_suffix(p.suffix+'.'+str(os.getpid())+'.tmp')
 temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');temp.replace(p)


def guarded(raw,roots):
 p=Path(raw).resolve()
 if not any(p.is_relative_to(root.resolve()) for root in roots):raise ValueError('Held file is outside the permitted library directories')
 return p


def digest(path):
 with Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()


@contextmanager
def index_owner():
 """One cooperating index publisher; never reclaim an uncertain/stale owner."""
 PRIVATE.mkdir(parents=True,exist_ok=True)
 lock=PRIVATE/'index-write.lock'
 try:
  with lock.open('x',encoding='utf-8') as stream:
   json.dump({'pid':os.getpid(),'startedAt':now()},stream)
 except FileExistsError:raise ValueError('Another reader-index owner holds index-write.lock; inspect its identity before recovery')
 try:yield
 finally:lock.unlink()


def index_hash():
 path=PRIVATE/'index.json'
 return digest(path) if path.is_file() else None


def publish_index(value,expected):
 """Called under index_owner. Preserve exact prior bytes and reject changed input."""
 path=PRIVATE/'index.json'
 if index_hash()!=expected:raise ValueError('Reader index changed; inspect the new snapshot before applying')
 data=(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
 actual=hashlib.sha256(data).hexdigest()
 if actual==expected:return actual
 if expected:
  backup=PRIVATE/'index-backups'/(expected+'.json');backup.parent.mkdir(exist_ok=True)
  if backup.exists():
   if digest(backup)!=expected:raise ValueError('Reader index backup failed its hash check')
  else:
   with backup.open('xb') as stream:
    stream.write(path.read_bytes());stream.flush();os.fsync(stream.fileno())
   if digest(backup)!=expected:raise ValueError('Reader index changed during backup')
 temp=path.with_suffix('.'+str(os.getpid())+'.tmp')
 try:
  with temp.open('xb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
  if index_hash()!=expected:raise ValueError('Reader index changed before publication')
  temp.replace(path)
 finally:temp.unlink(missing_ok=True)
 return actual


def scoped_record(record_id,sha,expected):
 shard=hashlib.sha256(record_id.encode()).hexdigest()[:2]
 r=read(SITE/'public/content/teacher-library/records'/(shard+'.json'))[record_id]
 fingerprint=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 if fingerprint!=expected or r['sha256']!=sha:raise ValueError('Scoped catalogue record changed; review attribution/use dependencies')
 return r


def scoped_rows():
 """Reviewed exact copies only; existing public metadata supplies names/use notices."""
 scope=read(SCOPE)
 if scope.get('schemaVersion')!=1:raise ValueError('Unsupported private reader scope')
 rows=[];seen=set()
 for item in scope['copies']:
  sha=item['sha256'];ident='local-'+sha
  if not re.fullmatch('[a-f0-9]{64}',sha) or sha in seen:raise ValueError('Invalid/duplicate scoped source identity')
  seen.add(sha)
  if item['recordId']!='held-'+sha[:32]:raise ValueError('Scoped record is not the exact held-source identity')
  source=guarded(SOURCES/item['source'],[SOURCES])
  cache=guarded(STATE/'extracted-library'/item['cache'],[STATE/'extracted-library'])
  if source.suffix.lower()!='.epub':raise ValueError('This reviewed private scope contains EPUB copies only')
  if digest(source)!=sha or digest(cache)!=item['cacheSha256']:raise ValueError('Scoped original or extraction changed; review its dependencies')
  r=scoped_record(item['recordId'],sha,item['recordSha256'])
  if not r['authors'] or not r['contributors']:raise ValueError('Scoped source has no recorded attribution')
  rows.append({'id':ident,'path':str(source),'sha256':sha,'cache':str(cache),'cacheSha256':item['cacheSha256'],
   'status':'reviewed-private-reader-scope','title':r['title'],'authorIds':r['contributors'],'authors':r['authors'],
   **{key:r.get(key) for key in ['workId','editionId','source','sourceId','sourceUrl','language','genre','licence','credit']},
   'mixedAttribution':False,'attributionConflict':bool(r.get('reviewWarning')),'reviewWarning':r.get('reviewWarning'),
   'format':'epub','hasPdf':False,'textPath':None,'textSha256':None,'derivative':None,'documentId':'library:text:'+sha,
   'privateReaderScope':{'recordId':r['id'],'recordSha256':item['recordSha256'],'evidence':item['evidence']}})
 return rows


def merge_reader_scope(index):
 """Do not assign source contributors to invented profile shelves."""
 result=copy.deepcopy(index);added=[];rows=scoped_rows()
 for row in rows:
  ident=row['id'];record_id=row['privateReaderScope']['recordId']
  previous=result['documents'].get(ident)
  if previous is not None and previous!=row:raise ValueError('Scoped copy already has different metadata; review before replacing it')
  if previous is None:result['documents'][ident]=row;added.append(ident)
  binding=result['bindings'].get(record_id)
  if binding is not None and binding!=[ident]:raise ValueError('Scoped reader binding conflicts with an existing copy')
  result['bindings'][record_id]=[ident]
 result['counts']['heldReadingCopies']=len(result['documents'])
 result['privateReaderScope']={'manifestSha256':digest(SCOPE),'copyIds':[r['id'] for r in rows]}
 # builtAt identifies the unchanged profile/intake snapshot used by reader_catalog.py.
 # Do not invalidate all 52 shelves for two additions outside their memberships.
 return result,added


def apply_reader_scope(expected):
 with index_owner():
  if index_hash()!=expected:raise ValueError('Reader index changed; inspect before applying')
  result,added=merge_reader_scope(read(PRIVATE/'index.json'))
  actual=publish_index(result,expected)
  print(json.dumps({'indexSha256':actual,'previousSha256':expected,'added':added,'counts':result['counts']}))


def restore_index(backup_hash,expected):
 if not re.fullmatch('[a-f0-9]{64}',backup_hash):raise ValueError('Invalid reader backup hash')
 with index_owner():
  backup=PRIVATE/'index-backups'/(backup_hash+'.json')
  if digest(backup)!=backup_hash:raise ValueError('Reader backup hash mismatch')
  if index_hash()!=expected:raise ValueError('Reader index changed; inspect before rollback')
  # Restore exact bytes, including the original snapshot timestamp/format.
  current=PRIVATE/'index.json';data=backup.read_bytes();json.loads(data);read(current)
  saved=PRIVATE/'index-backups'/(expected+'.json')
  if not saved.exists():saved.write_bytes(current.read_bytes())
  if digest(saved)!=expected:raise ValueError('Current index rollback backup mismatch')
  temp=PRIVATE/('restore-'+str(os.getpid())+'.tmp')
  try:
   with temp.open('xb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
   if index_hash()!=expected:raise ValueError('Reader index changed before rollback')
   temp.replace(current)
  finally:temp.unlink(missing_ok=True)
  print(json.dumps({'restoredSha256':backup_hash,'previousSha256':expected}))


def recover_group_author(metadata, people):
 """Use an unambiguous acquisition group only when front matter confirms its byline."""
 acq=metadata.get('acquisition') or {}
 group=acq.get('authorGroup')
 if not isinstance(group,str):return None
 compact=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
 candidates=[p for p in people if compact(p.get('short',''))==compact(group)]
 if len(candidates)!=1 or not metadata.get('extraction_cache'):return None
 cache=guarded(metadata['extraction_cache'],[STATE/'extracted-library'])
 if not cache.is_file():return None
 front=''
 with cache.open(encoding='utf-8') as stream:
  for line in stream:
   if line.strip():front+=(json.loads(line).get('text') or '')
   if len(front)>=16000:break
 # Search only the front matter, not incidental mentions anywhere in the body.
 if compact(candidates[0]['name']) not in compact(front[:16000]):return None
 return candidates[0]['id']


def build_index():
 with index_owner():_build_index(index_hash())


def _build_index(expected_index):
 PRIVATE.mkdir(parents=True,exist_ok=True)
 spec=importlib.util.spec_from_file_location('teacher_reference_analysis',SITE/'scripts/analyse-teacher-scripture.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 people=read(SITE/'src/data/teachers/people.json')['people']
 registry,names=module.identities(people)
 profile_ids={p['id'] for p in people}
 catalog={}
 for p in (SITE/'content/library/catalog/works').glob('*.json'):
  w=read(p)
  if any(c.get('authorId') in profile_ids for c in w.get('creators',[])):catalog[w['id']]=w
 docs={};bindings=collections.defaultdict(list);profiles={p['id']:[] for p in people};counts=collections.Counter()
 db=sqlite3.connect((STATE/'knowledge.sqlite3').as_uri()+'?mode=ro',uri=True,timeout=10)
 db.execute('PRAGMA query_only=ON');db.execute('PRAGMA cache_size=-8192')
 started=now()
 for path,sha,status,document,raw in db.execute('SELECT path,sha256,status,document_id,metadata FROM library_files ORDER BY path'):
  counts['intakeFilesExamined']+=1
  if counts['intakeFilesExamined']%10000==0:
   write(PRIVATE/'build-progress.json',{'state':'building','startedAt':started,'updatedAt':now(),**counts})
   print(json.dumps(dict(counts)),flush=True)
  metadata=json.loads(raw);acq=metadata.get('acquisition') or {};work=metadata.get('work') or {}
  authors,primary,mixed,unknown=module.authors_of(metadata,names)
  author_ids=sorted(authors & profile_ids)
  recovered=None
  if not author_ids:
   recovered=recover_group_author(metadata,people)
   if recovered:author_ids=[recovered];counts['frontMatterAuthorLinksRecovered']+=1
  if not author_ids:continue
  source=guarded(path,[SOURCES]);cache=None
  if metadata.get('extraction_cache'):
   candidate=guarded(metadata['extraction_cache'],[STATE/'extracted-library'])
   if candidate.is_file() and candidate.stat().st_size:cache=str(candidate)
  suffix=source.suffix.lower();exists=source.is_file()
  pdf=exists and suffix=='.pdf'
  # An empty scan can still be read as its original PDF; assets/archives are not body text.
  textual=exists and suffix in ('.txt','.xml','.html','.htm','.xhtml','.epub') and status not in ('metadata_or_asset','deferred_scan')
  if not cache and not pdf and not textual:continue
  if not re.fullmatch('[a-f0-9]{64}',sha):continue
  ident='local-'+sha
  wid=work.get('id') or acq.get('workId')
  canonical=catalog.get(wid)
  expected={c['authorId'] for c in canonical.get('creators',[]) if c.get('role','author')=='author'} if canonical else set()
  conflict=bool(expected and set(author_ids)-expected)
  titles=[work.get('title'),acq.get('title'),source.name]
  if recovered:
   titles=[re.sub(r'\s*-\s*FREE CHRISTIAN E-BOOKS\s*$','',str(t)).replace('\u200b','').strip() if t else t for t in titles]
  row={'id':ident,'path':str(source),'sha256':sha,'cache':cache,'status':status,'title':next(x for x in titles if x),'authorIds':author_ids,'authors':[registry.get(i,{}).get('name',i) for i in author_ids],'workId':wid if canonical and not conflict else None,'editionId':(metadata.get('edition') or {}).get('id'),'source':acq.get('source') or acq.get('sourceId') or 'Held library','sourceId':acq.get('sourceId'),'sourceUrl':acq.get('url') or acq.get('canonicalUrl') or acq.get('finalUrl') or next((e.get('url') for e in work.get('evidence',[]) if e.get('url')),None),'language':((metadata.get('edition') or {}).get('languages') or [acq.get('language') or 'und'])[0],'genre':work.get('genre') or acq.get('genre') or 'text','licence':acq.get('licence') or acq.get('rightsCategory') or 'Held local research copy; source conditions retained','credit':acq.get('credit'),'mixedAttribution':mixed,'attributionConflict':conflict,'format':suffix.lstrip('.'),'hasPdf':pdf,'textPath':metadata.get('text_path'),'textSha256':metadata.get('text_sha256'),'derivative':metadata.get('derivative'),'documentId':document}
  if ident in docs:
   previous=docs[ident]
   previous['authorIds']=sorted(set(previous['authorIds'])|set(author_ids))
   if not previous['cache'] and cache:previous.update(row)
  else:docs[ident]=row
  if recovered:row['authorLinkEvidence']='Acquisition authorGroup corroborated by source front matter'
  for author in author_ids:
   if ident not in profiles[author]:profiles[author].append(ident)
  # Held IDs are exact source-hash identities, independent of public-release status.
  bindings['held-'+sha[:32]].append(ident)
  if row['workId']:bindings[row['workId']].append(ident)
 db.close()
 # Bind any other public record IDs by exact original hash, without rewriting those records.
 for p in (SITE/'public/content/teacher-library/records').glob('*.json'):
  for ident,r in read(p).items():
   local='local-'+str(r.get('sha256') or '')
   if local in docs:bindings[ident].append(local)
 def priority(ident):
  r=docs[ident]
  return (bool(r['attributionConflict']),not bool(r['cache']),r['format']=='pdf',r['path'])
 bindings={key:sorted(set(values),key=priority) for key,values in bindings.items()}
 result={'schemaVersion':1,'builtAt':now(),'sourceDatabase':'Read-only intake snapshot','documents':docs,'bindings':bindings,'profiles':profiles,'contributors':{key:p['id'] for p in people for key in [p['id'],p.get('acquiredId')] if key},'counts':{'profiles':len(profiles),'heldReadingCopies':len(docs),'profilesWithContent':sum(bool(x) for x in profiles.values()),**counts},'scope':'Private local reading only; public publication, licences, attribution review and embedding state are unchanged'}
 result,_=merge_reader_scope(result)
 publish_index(result,expected_index)
 write(PRIVATE/'build-progress.json',{'state':'complete','finishedAt':now(),**result['counts']})
 print(json.dumps(result['counts']),flush=True)
 # Keep every profile shelf and its integrity audit on the same source snapshot.
 from reader_catalog import build
 build()


class TextHTML(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.skip=0;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style','nav','noscript'):self.skip+=1
  if not self.skip and tag in ('p','div','h1','h2','h3','h4','li','br','section'):self.parts.append('\n')
 def handle_endtag(self,tag):
  if tag in ('script','style','nav','noscript') and self.skip:self.skip-=1
  if not self.skip and tag in ('p','div','h1','h2','h3','h4','li','section'):self.parts.append('\n')
 def handle_data(self,value):
  if not self.skip:self.parts.append(value)


def text_html(raw):
 parser=TextHTML();parser.feed(raw);return ''.join(parser.parts)


def raw_blocks(row):
 if row.get('cache'):
  cache=guarded(row['cache'],[STATE/'extracted-library'])
  with cache.open(encoding='utf-8') as f:
   for line in f:
    if line.strip():yield json.loads(line)
  return
 source=guarded(row['path'],[SOURCES]);suffix=source.suffix.lower()
 derivative=row.get('derivative') or {}
 if derivative.get('path'):
  selected=guarded(derivative['path'],[SOURCES,SITE/'.local/library'])
  if selected.is_file():
   yield {'locator':'Existing transcription: '+selected.name,'text':selected.read_text(encoding='utf-8-sig',errors='replace')};return
 if suffix=='.xml':
  from lxml import etree
  tree=etree.parse(str(source),etree.XMLParser(resolve_entities=False,no_network=True,recover=True,huge_tree=True))
  root=tree.getroot();bodies=root.xpath('//*[local-name()="body"]');body=bodies[0] if bodies else root
  for e in body.iter():
   if not isinstance(e.tag,str):continue
   tag=etree.QName(e).localname.lower()
   if tag=='pb':e.text='\n[Source page '+(e.get('n') or 'unlabeled')+']\n'
   if tag in ('p','div','div1','div2','head','title','l','br','lb','para'):e.tail='\n'+(e.tail or '')
  yield {'locator':'XML body: '+source.name,'text':''.join(body.itertext())}
 elif suffix=='.epub':
  from lxml import etree
  import posixpath
  from urllib.parse import unquote
  parser=etree.XMLParser(resolve_entities=False,no_network=True)
  with zipfile.ZipFile(source) as z:
   container=etree.fromstring(z.read('META-INF/container.xml'),parser)
   opf=container.xpath('//*[local-name()="rootfile"]/@full-path')[0]
   package=etree.fromstring(z.read(opf),parser)
   manifest={e.get('id'):e for e in package.xpath('//*[local-name()="manifest"]/*')}
   for number,item in enumerate(package.xpath('//*[local-name()="spine"]/*'),1):
    target=posixpath.normpath(posixpath.join(posixpath.dirname(opf),unquote(manifest[item.get('idref')].get('href').split('#')[0])))
    yield {'locator':f'EPUB section {number}: {target}','text':text_html(z.read(target).decode('utf-8',errors='replace'))}
 elif suffix=='.pdf':
  import pymupdf
  with pymupdf.open(source) as doc:
   for n,page in enumerate(doc,1):yield {'locator':f'PDF page {n}','text':page.get_text('text',sort=True)}
 else:
  data=source.read_bytes()
  for encoding in ('utf-8-sig','utf-16' if data[:2] in (b'\xff\xfe',b'\xfe\xff') else 'cp1252'):
   try:text=data.decode(encoding);break
   except UnicodeError:continue
  else:text=data.decode('utf-8',errors='replace')
  yield {'locator':source.name,'text':text_html(text) if suffix in ('.html','.htm','.xhtml') else text}


def prepare(row):
 folder=PRIVATE/'pages'/row['sha256'];manifest=folder/'manifest.json'
 source=guarded(row['path'],[SOURCES])
 stat=source.stat() if source.is_file() else None
 stamp=[stat.st_size,stat.st_mtime_ns] if stat else None
 dependencies=None
 def verify_scoped_dependencies():
  cache=guarded(row['cache'],[STATE/'extracted-library'])
  if digest(source)!=row['sha256'] or digest(cache)!=row['cacheSha256']:raise ValueError('Reviewed reading-copy dependencies changed; inspect before reading')
  scope=row['privateReaderScope'];scoped_record(scope['recordId'],row['sha256'],scope['recordSha256'])
 if row.get('privateReaderScope'):
  # These exceptional copies are dependency-pinned even when reading pages exist.
  verify_scoped_dependencies()
  dependencies={'sourceSha256':row['sha256'],'cacheSha256':row['cacheSha256']}
 def matches(value):return value.get('sourceStamp')==stamp and (dependencies is None or value.get('readerDependencies')==dependencies)
 if manifest.is_file():
  value=read(manifest)
  if matches(value):return value
 folder.mkdir(parents=True,exist_ok=True)
 lock=folder/'prepare.lock'
 for attempt in range(100):
  try:handle=lock.open('x');handle.close();break
  except FileExistsError:
   time.sleep(.1)
   if manifest.is_file() and matches(read(manifest)):return read(manifest)
 else:raise ValueError('This reading copy is still being prepared; try again shortly')
 try:
  if stat:
   with source.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
   if actual!=row['sha256']:raise ValueError('The source has changed since the library index; refresh the local reader index')
  pages=0;current=[];size=0;characters=0
  def flush():
   nonlocal pages,current,size
   if current:write(folder/(str(pages)+'.json'),{'blocks':current});pages+=1;current=[];size=0
  for block in raw_blocks(row):
   text=block.get('text') or ''
   if not text.strip():continue
   characters+=len(text)
   for start in range(0,len(text),12000):
    part=text[start:start+12000]
    if size+len(part)>48000:flush()
    current.append({'locator':block.get('locator') or 'Held text','text':part});size+=len(part)
  flush()
  if dependencies is not None:verify_scoped_dependencies()
  value={'pages':pages,'characters':characters,'sourceStamp':stamp,'preparedAt':now()}
  if dependencies is not None:value['readerDependencies']=dependencies
  write(manifest,value);return value
 finally:lock.unlink(missing_ok=True)


def record(row,prepared):
 return {'id':row['id'],'title':row['title'],'authors':row['authors'],'contributors':row['authorIds'],'language':row['language'],'source':row['source'],'sourceId':row['sourceId'],'sourceUrl':row['sourceUrl'],'licence':row['licence'],'credit':row['credit'],'sha256':row['sha256'],'pages':prepared['pages'],'genre':row['genre'],'workId':row['workId'],'editionId':row['editionId'],'reviewWarning':'Source attribution is unresolved; read this as the recorded edition, not as verified authorship.' if row['attributionConflict'] else None,'availability':'local-text' if prepared['pages'] else 'local-pdf' if row['hasPdf'] else 'text-unavailable','localCopy':True}


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 actions=parser.add_mutually_exclusive_group()
 actions.add_argument('--build-index',action='store_true');actions.add_argument('--apply-reader-scope',action='store_true');actions.add_argument('--restore-index')
 parser.add_argument('--expected-index-sha256');parser.add_argument('--record');parser.add_argument('--page',type=int)
 args=parser.parse_args()
 if args.build_index:build_index();return
 if args.apply_reader_scope or args.restore_index:
  if not args.expected_index_sha256 or not re.fullmatch('[a-f0-9]{64}',args.expected_index_sha256):raise ValueError('An inspected expected index SHA-256 is required')
  if args.apply_reader_scope:apply_reader_scope(args.expected_index_sha256)
  else:restore_index(args.restore_index,args.expected_index_sha256)
  return
 if not args.record or not re.fullmatch('local-[a-f0-9]{64}',args.record):raise ValueError('Invalid local reading-copy identity')
 index=read(PRIVATE/'index.json');row=index['documents'].get(args.record)
 if not row:raise ValueError('No held reading copy for this identity')
 try:prepared=prepare(row)
 except ImportError:
  if not row['hasPdf']:raise
  prepared={'pages':0}
 if args.page is None:print(json.dumps(record(row,prepared),ensure_ascii=True))
 else:
  if args.page<0 or args.page>=prepared['pages']:raise ValueError('Reading page outside this work')
  print(json.dumps(read(PRIVATE/'pages'/row['sha256']/(str(args.page)+'.json')),ensure_ascii=True))


if __name__=='__main__':
 try:main()
 except Exception as exc:print(json.dumps({'error':str(exc)},ensure_ascii=True));sys.exit(1)
