"""Private, CPU-only held-library reader for the existing loopback preview.

Database access is read-only. Index and reading pages live under .local/local-library,
outside public/ and dist/. No models, vector access, downloads or shared-cache writes.
"""
from __future__ import annotations
import argparse
import collections
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
 write(PRIVATE/'index.json',result)
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
 if manifest.is_file():
  value=read(manifest)
  if value.get('sourceStamp')==stamp:return value
 folder.mkdir(parents=True,exist_ok=True)
 lock=folder/'prepare.lock'
 for attempt in range(100):
  try:handle=lock.open('x');handle.close();break
  except FileExistsError:
   time.sleep(.1)
   if manifest.is_file() and read(manifest).get('sourceStamp')==stamp:return read(manifest)
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
  value={'pages':pages,'characters':characters,'sourceStamp':stamp,'preparedAt':now()}
  write(manifest,value);return value
 finally:lock.unlink(missing_ok=True)


def record(row,prepared):
 return {'id':row['id'],'title':row['title'],'authors':row['authors'],'contributors':row['authorIds'],'language':row['language'],'source':row['source'],'sourceId':row['sourceId'],'sourceUrl':row['sourceUrl'],'licence':row['licence'],'credit':row['credit'],'sha256':row['sha256'],'pages':prepared['pages'],'genre':row['genre'],'workId':row['workId'],'editionId':row['editionId'],'reviewWarning':'Source attribution is unresolved; read this as the recorded edition, not as verified authorship.' if row['attributionConflict'] else None,'availability':'local-text' if prepared['pages'] else 'local-pdf' if row['hasPdf'] else 'text-unavailable','localCopy':True}


def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--build-index',action='store_true');parser.add_argument('--record');parser.add_argument('--page',type=int)
 args=parser.parse_args()
 if args.build_index:build_index();return
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
