"""Independent local citation search while the existing embedding intake runs.

This uses a separate SQLite file and never writes the main knowledge database.
Run: python -m knowledge.historical_search build | search "Christus" | verify
"""
import argparse,hashlib,json,re,sqlite3,unicodedata
from pathlib import Path
from collections import Counter
import pymupdf

COLLECTION=Path(__file__).resolve().parents[2]/'KnowledgeBase/Biblical Historical Sources'
DB=COLLECTION/'historical-search.sqlite3'
def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def plain(text):return ''.join(c for c in unicodedata.normalize('NFKD',text) if not unicodedata.combining(c))
def documents():
 manifest=json.loads((COLLECTION/'acquisition-manifest.json').read_text('utf8'))['records']
 linked={};pdftext=set();yielded=set()
 for r in manifest:
  if r['status'] not in ('acquired','reused'):continue
  if r['status']=='reused':p=Path(r['existing_absolute_path'])
  elif r.get('kind')=='pdf':
   p=COLLECTION/r['relative_path']
   if r.get('readable_text_path'):pdftext.add((COLLECTION/r['readable_text_path']).resolve())
  elif r.get('readable_text_path') and r.get('kind')!='tf':p=COLLECTION/r['readable_text_path']
  else:continue
  linked[p.resolve()]=r
 for p in sorted(set(COLLECTION.rglob('*.txt'))|set(linked)):
  if p.resolve() in pdftext or p.name.endswith('.reference.txt'):continue
  rel=p.relative_to(COLLECTION).as_posix() if p.is_relative_to(COLLECTION) else str(p)
  parts=p.parts
  if p.is_relative_to(COLLECTION) and len(p.relative_to(COLLECTION).parts)==1:continue
  if 'Unpacked' in parts and '12 Biblical Language Data' not in parts:continue
  if '12 Biblical Language Data' in parts:
   if any('old' in x.lower() for x in parts) or 'TIPNR' in p.name or 'TTESV' in p.name:continue
   if p.name.lower().startswith(('readme','license')):continue
  r=linked.get(p.resolve(),{})
  category=r.get('category') or (p.relative_to(COLLECTION).parts[0] if p.is_relative_to(COLLECTION) else '01 Ancient Histories')
  metadata={'title':r.get('title') or p.stem,'category':category,'source_url':r.get('source_url'),'licence':r.get('license'),'scope':r.get('scope'),'path':str(p),'sha256':sha(p),'kind': 'pdf' if p.suffix=='.pdf' else 'text','original_path':str(COLLECTION/r['relative_path']) if r.get('relative_path') else str(p),'original_sha256':r.get('sha256'),'language':'en','text_kind':'historical edition or scholarly source'}
  if metadata['kind']=='pdf':
   def blocks(file=p):
    with pymupdf.open(file) as doc:
     for n,page in enumerate(doc,1):yield f'PDF page {n}',page.get_text('text')
   source=blocks()
  else:
   text=p.read_text('utf8',errors='replace')
   header=text[:2500]
   metadata['title']=r.get('title') or (text.splitlines()[0] if text.splitlines() else p.stem)
   match=re.search(r'(?im)^SOURCE: (\S+)',header)
   if match:metadata['source_url']=match.group(1)
   language=re.search(r'(?im)^LANGUAGE: (.+)',header)
   if language:metadata['language']=language.group(1)
   original=re.search(r'(?im)^SOURCE XML: (.+)',header)
   if original:metadata['original_path']=original.group(1)
   original_hash=re.search(r'(?im)^SOURCE XML SHA256: (.+)',header)
   if original_hash:metadata['original_sha256']=original_hash.group(1)
   if 'Papyri Corpus' in parts:metadata.update(licence='CC BY 3.0; Papyri.info / DDbDP and named translation contributors',scope='Published documentary edition or translation; not proof of a biblical narrative')
   elif '12 Biblical Language Data' in parts:metadata.update(language='mul',text_kind='editorial lexical or morphology aid',licence='CC BY 4.0; STEP Bible / Tyndale House and contributors; file notices retained',scope='Lexical, morphological or tagged-text aid; editorial annotations are not ancient manuscript evidence')
   elif 'Readable Scroll Transcriptions' in parts:metadata.update(language='mul',text_kind='original-language manuscript transcription',licence='CC BY-NC 4.0; Abegg, Bowley, Cook / ETCBC',scope='Original-language manuscript transcription, not English translation')
   elif 'Readable Cuneiform Editions' in parts:
    metadata.update(language='mul',text_kind='cuneiform transliteration with glosses',scope='Transliteration and lexical glosses; not continuous English translation')
    ident=re.match(r'(\S+)\s+([PQ]\d{6})',metadata['title'])
    if ident:metadata['source_url']='https://oracc.museum.upenn.edu/'+ident.group(1)+'/'+ident.group(2)+'/html'
   elif 'Readable Ugaritic Editions' in parts:metadata.update(language='uga',text_kind='original-language Ugaritic transcription')
   elif 'Published English Translations' in parts:metadata.update(language='en',text_kind='published English translation')
   elif 'Evidence Cards' in parts:metadata.update(text_kind='editorial evidence review card',scope='Research assessment and source quotation; preserve status and limits. This card is not an ancient primary source.')
   elif 'Codex Sinaiticus' in parts:metadata.update(language='grc',text_kind='manuscript transcription')
   elif 'Samaritan Pentateuch' in parts:metadata.update(language='he',text_kind='manuscript transcription')
   elif 'Peshitta Syriac witnesses' in parts or p.name=='Peshitta verse export.txt':metadata.update(language='syr',text_kind='Syriac biblical edition')
   elif p.name=='LXX verse export.txt':metadata.update(language='grc',text_kind='Greek Septuagint edition')
   elif p.name=='Vulgate verse export.txt':metadata.update(language='la',text_kind='Latin Vulgate edition')
   if not metadata.get('licence'):
    m=re.search(r'(?im)^(?:LICENSE|LICENCE|License): (.+)',header)
    metadata['licence']=m.group(1) if m else 'Private research copy; source notices and original edition retained'
   source=[('Text',text)]
  if p.resolve() not in yielded:yielded.add(p.resolve());yield metadata,source
def split_blocks(locator,text):
 # Offsets address exact stored extraction, with raw text unaltered.
 start=0
 while start<len(text):
  end=min(start+2200,len(text))
  if end<len(text):
   boundary=text.rfind('\n',start+800,end)
   if boundary>start:end=boundary+1
  chunk=text[start:end]
  if chunk.strip():yield locator+f'; characters {start}-{end}',start,end,chunk
  start=end
def build():
 temp=DB.with_suffix('.building.sqlite3')
 if temp.exists():raise RuntimeError('A prior build exists; inspect it before starting another')
 con=sqlite3.connect(temp)
 con.executescript('''PRAGMA journal_mode=OFF; CREATE TABLE documents(id INTEGER PRIMARY KEY,metadata TEXT NOT NULL);
 CREATE TABLE passages(id INTEGER PRIMARY KEY,document_id INTEGER NOT NULL,locator TEXT,start INTEGER,end INTEGER,text TEXT);
 CREATE INDEX passages_document_id ON passages(document_id);
 CREATE VIRTUAL TABLE fulltext USING fts5(title,text,tokenize="unicode61 remove_diacritics 2");''')
 counts=Counter();n=0;passages=0;empty=[]
 for meta,blocks in documents():
  n+=1;counts[meta['category']]+=1
  con.execute('INSERT INTO documents VALUES(?,?)',(n,json.dumps(meta,ensure_ascii=False)))
  before=passages
  for locator,text in blocks:
   for loc,start,end,chunk in split_blocks(locator,text):
    passages+=1;con.execute('INSERT INTO passages VALUES(?,?,?,?,?,?)',(passages,n,loc,start,end,chunk));con.execute('INSERT INTO fulltext(rowid,title,text) VALUES(?,?,?)',(passages,plain(meta['title']),plain(chunk)))
  if passages==before:empty.append({'path':meta['path'],'title':meta['title']})
  if n%5000==0:con.commit();print('INDEXED',n,passages,flush=True)
 con.commit();con.execute("INSERT INTO fulltext(fulltext) VALUES('optimize')");con.commit();con.close();temp.replace(DB)
 report={'documents':n,'passages':passages,'by_category':dict(counts),'database':str(DB),'documents_without_extractable_text':empty,'mode':'Immediate local lexical citation search; main semantic intake remains queued in existing pipeline','raw_quotations':'Search returns exact extracted text, source path/hash and page or character locator. Extraction is not claim authentication.'}
 (COLLECTION/'search-status.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report,indent=2))
def refresh(category=None):
 # Refresh changed derivatives atomically; immutable upstream originals are untouched.
 con=sqlite3.connect(DB);changed=0
 con.execute('CREATE INDEX IF NOT EXISTS passages_document_id ON passages(document_id)')
 next_id=con.execute('SELECT coalesce(max(id),0) FROM passages').fetchone()[0]
 try:
  for ident,raw in con.execute('SELECT id,metadata FROM documents').fetchall():
   meta=json.loads(raw)
   if category and category.lower() not in meta['category'].lower():continue
   p=Path(meta['path']);checksum=sha(p)
   if checksum==meta['sha256']:continue
   if meta['kind']=='pdf':
    with pymupdf.open(p) as doc:blocks=[(f'PDF page {n}',page.get_text('text')) for n,page in enumerate(doc,1)]
   else:blocks=[('Text',p.read_text('utf8',errors='replace'))]
   con.execute('DELETE FROM fulltext WHERE rowid IN (SELECT id FROM passages WHERE document_id=?)',(ident,))
   con.execute('DELETE FROM passages WHERE document_id=?',(ident,))
   meta['sha256']=checksum
   con.execute('UPDATE documents SET metadata=? WHERE id=?',(json.dumps(meta,ensure_ascii=False),ident))
   for locator,text in blocks:
    for loc,start,end,chunk in split_blocks(locator,text):
     next_id+=1;con.execute('INSERT INTO passages VALUES(?,?,?,?,?,?)',(next_id,ident,loc,start,end,chunk));con.execute('INSERT INTO fulltext(rowid,title,text) VALUES(?,?,?)',(next_id,plain(meta['title']),plain(chunk)))
   changed+=1
  con.commit()
  status=json.loads((COLLECTION/'search-status.json').read_text('utf8'));status['passages']=con.execute('SELECT count(*) FROM passages').fetchone()[0];status['refreshed_changed_documents']=changed
  (COLLECTION/'search-status.json').write_text(json.dumps(status,indent=2),encoding='utf8')
  print({'refreshed_documents':changed,'passages':status['passages']})
 finally:con.close()

def search(query,limit=5,category=None):
 terms=re.findall(r'\w+',plain(query),re.UNICODE)
 if not terms:return []
 expression=' AND '.join('"'+t+'"' for t in terms)
 con=sqlite3.connect(f'file:{DB.as_posix()}?mode=ro',uri=True);con.row_factory=sqlite3.Row
 rows=con.execute('''SELECT p.*,d.metadata,bm25(fulltext) score FROM fulltext JOIN passages p ON p.id=fulltext.rowid JOIN documents d ON d.id=p.document_id WHERE fulltext MATCH ? AND (? IS NULL OR lower(json_extract(d.metadata,'$.category')) LIKE ?) ORDER BY score LIMIT ?''',(expression,category,'%'+category.lower()+'%' if category else None,limit)).fetchall();out=[]
 for row in rows:
  meta=json.loads(row['metadata'])
  if category and category.lower() not in meta['category'].lower():continue
  out.append(meta|{'locator':row['locator'],'quote':row['text'],'character_start':row['start'],'character_end':row['end'],'score':row['score']})
  if len(out)>=limit:break
 con.close();return out
def verify():
 results=[]
 for q,expected in [('Christus','Tacitus'),('brother of Jesus','Josephus'),('Menahem',''),('Bethesda',''),('λόγος','')]:
  hits=search(q,10,'01 Ancient Histories' if expected else None);passed=bool(hits) and (not expected or any(expected.lower() in x['title'].lower() for x in hits))
  checked=[]
  for hit in hits[:3]:
   p=Path(hit['path']);ok=sha(p)==hit['sha256']
   if hit['kind']=='text':ok=ok and p.read_text('utf8',errors='replace')[hit['character_start']:hit['character_end']]==hit['quote']
   else:
    page=int(re.search(r'PDF page (\d+)',hit['locator']).group(1))
    with pymupdf.open(p) as doc:ok=ok and doc[page-1].get_text('text')[hit['character_start']:hit['character_end']]==hit['quote']
   checked.append(ok)
  results.append({'query':q,'expected_title':expected,'retrieval_passed':passed,'literal_citations_passed':all(checked) and bool(checked),'top_titles':[x['title'] for x in hits[:3]]})
 report={'checks':results,'passed':all(r['retrieval_passed'] and r['literal_citations_passed'] for r in results)}
 (COLLECTION/'search-verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8');print(json.dumps(report,indent=2,ensure_ascii=False))
 if not report['passed']:raise SystemExit(1)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('command',choices=['build','refresh','search','verify']);parser.add_argument('query',nargs='?',default='');parser.add_argument('--limit',type=int,default=5);parser.add_argument('--category');args=parser.parse_args()
 if args.command=='build':build()
 elif args.command=='verify':verify()
 elif args.command=='refresh':refresh(args.category)
 else:print(json.dumps(search(args.query,args.limit,args.category),indent=2,ensure_ascii=False))
