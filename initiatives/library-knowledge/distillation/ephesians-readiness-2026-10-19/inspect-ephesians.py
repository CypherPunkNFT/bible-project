"""Bounded source-only recheck of the six retained Ephesians packages.
No corpus/vector/index connection, retrieval, candidate mutation or public write.
Only this directory receives new proof files; existing receipts refuse overwrite.
"""
import ast,hashlib,json,re,sys,time,xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
OUT=Path(__file__).resolve().parent
SITE=OUT.parents[3];PROJECT=SITE.parent
sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import checked_bytes
from knowledge.research_foundation.contract import fingerprint
started=time.monotonic();inputs={};MAX_SECONDS=120;MAX_BYTES=256*1024*1024

def checked(p,expected=None):
 p=Path(p).resolve()
 if not p.is_relative_to(PROJECT.resolve()) or p.stat().st_size>64*1024*1024:raise ValueError('Input outside bounded project scope')
 if time.monotonic()-started>MAX_SECONDS:raise TimeoutError('Time bound')
 raw,proof=checked_bytes(p,expected)
 old=inputs.get(str(p));new={'sha256':proof[1],'bytes':proof[2],'mtime_ns':proof[3]}
 if old and old!=new:raise ValueError('Input changed during check')
 inputs[str(p)]=new
 if sum(x['bytes'] for x in inputs.values())>MAX_BYTES:raise ValueError('Byte bound')
 return raw

def load(p,expected=None):return json.loads(checked(p,expected))
def write(name,value):
 with (OUT/name).open('x',encoding='utf-8',newline='\n') as f:json.dump(value,f,ensure_ascii=False,indent=2);f.write('\n')

# Reuse only the existing pure structural helpers without importing any store owner.
implementation=SITE/'knowledge/evidence_collections/connections.py'
source=checked(implementation).decode('utf-8');tree=ast.parse(source)
helpers=['normalized','before_gap','heading_verses','source_sections','locate']
selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in helpers or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ('NS','MAX_VERSES') for t in n.targets)]
env={'re':re,'digest':lambda text:hashlib.sha256(text.encode('utf-8')).hexdigest()};exec(compile(ast.Module(body=selected,type_ignores=[]),str(implementation),'exec'),env)
normalized=env['normalized'];before_gap=env['before_gap'];source_sections=env['source_sections'];NS=env['NS']
cat=load(SITE/'.local/data-analysis/website-candidates.json');index=load(SITE/'.local/local-library/index.json')
paths=[p for p in cat['inputSha256'] if '/release-final/objects/' in p]
assert len(paths)==6
packages=[load(PROJECT/p,cat['inputSha256'][p]) for p in paths]
assert sorted(p['chapter'] for p in packages)==list(range(1,7))
all_connections=[c for p in packages for c in p['connections']]
assert len(all_connections)==235 and len({c['id'] for c in all_connections})==235
sources={s['role']:s for p in packages for s in p['sources']}
assert len(sources)==4
roots={};sections={};reader={};source_proofs=[]
for role,s in sources.items():
 raw=checked(s['sourcePath'],s['sha256']);root=ET.fromstring(raw);roots[role]=root
 native=list(source_sections(role,root));sections[role]={x['selector']:x for x in native}
 assertions=[]
 for a in s['attribution'].get('assertions',[]):
  texts=[normalized(''.join(e.itertext())) for e in root.findall(a['xpath'])]
  assert texts==a['expectedTexts'],'Attribution assertion changed'
  assertions.append({'xpath':a['xpath'],'texts':texts,'match':True})
 rid='held-'+s['sha256'][:32];shard=hashlib.sha256(rid.encode()).hexdigest()[:2]
 public=load(SITE/'public/content/teacher-library/records'/f'{shard}.json')[rid]
 assert public['sha256']==s['sha256']
 rp={'record_id':rid,'route':'/teachers/works/'+rid,'public_availability':public.get('availability'),'public_pages':public.get('pages'),'public_work_id':public.get('workId'),'public_edition_id':public.get('editionId'),'pages':[],'source_sha256':s['sha256']}
 private=index['documents'].get('local-'+s['sha256'])
 if private:
  assert private['sha256']==s['sha256'] and Path(private['path']).resolve()==Path(s['sourcePath']).resolve()
  rp['private_binding']='local-'+s['sha256'];folder=SITE/'.local/local-library/pages'/s['sha256']
  if (folder/'manifest.json').exists():
   manifest=load(folder/'manifest.json');stamp=Path(s['sourcePath']).stat();assert manifest['sourceStamp']==[stamp.st_size,stamp.st_mtime_ns]
   assert manifest['pages']<=300
   rp['mode']='prepared-private';rp['manifest']=manifest
   rp['pages']=[{'page':n,'content':load(folder/f'{n}.json'),'path':str(folder/f'{n}.json')} for n in range(manifest['pages'])]
  else:rp['mode']='private-copy-unprepared'
 elif public.get('pages',0)>0:
  rp['mode']='public-fallback';assert public['pages']<=300
  bundles={}
  for n in range(public['pages']):
   rel=public['pageBundles'][n];p=SITE/'public/content/teacher-library'/rel
   if rel not in bundles:bundles[rel]=load(p,Path(rel).stem)
   rp['pages'].append({'page':n,'content':bundles[rel][f'{rid}/{n}'],'path':str(p)})
 else:rp['mode']='catalogue-only'
 reader[role]=rp
 header=root.find('./ThML.head') if role in ('calvin-commentary','hodge') else root.find('./{*}teiHeader')
 header_excerpt=normalized(''.join(header.itertext()))[:2000] if header is not None else None
 source_proofs.append({'role':role,'sha256':s['sha256'],'path':s['sourcePath'],'native_sections':len(native),'attribution':s['attribution'],'attribution_assertions':assertions,'header_excerpt':header_excerpt,'reader':{k:v for k,v in rp.items() if k not in ('pages','manifest')},'prepared_page_count':len(rp['pages']),'identity_limit':'Named source author/translator, not a new canonical identity, full-section interpretation or public-use clearance.'})

rows=[]
for p in packages:
 evidence={e['id']:e for e in p['collection']['evidence']}
 for c in p['connections']:
  role=c['sourceRole'];root=roots[role];matches=root.findall(c['selector']);assert len(matches)==1
  e=matches[0];assert fingerprint(ET.tostring(e,encoding='unicode'))==c['sourceElementSha256'],'Native element fingerprint differs'
  native=sections[role][c['selector']]
  assert (native['chapter'],native['heading'],native['verses'],native['granularity'])==(c['chapter'],c['heading'],c['verses'],c['granularity'])
  gaps=sum(n.tag==NS+'gap' for n in e.iter());assert gaps==c['gapCount']
  r={'id':c['id'],'chapter':c['chapter'],'role':role,'relationship':c['relationship'],'selector':c['selector'],'heading':c['heading'],'source_element_fingerprint':c['sourceElementSha256'],'native_fingerprint_matches':True,'heading_structure_matches':True,'gap_count':gaps,'verse_ids':c['verseIds'],'saved_reader_route':c['readerRoute'],'saved_reader_locations':c['readerLocations'],'current_reader_links':[]}
  if c['relationship']=='located-exposition':
   ev=evidence[c['evidenceId']];sample=c['sample'];assert normalized(ev['citation']['quote'])==sample
   paragraphs=e.findall('./{*}p') if role=='fergusson' else [n for n in e if n.get('class')=='Commentary']
   intact=[before_gap(n) for n in paragraphs]
   hits=[n for n,text in enumerate(intact) if sample in text]
   assert len(hits)==1,'Sample not unique in gap-free native prose prefixes'
   body=ev['citation']['private']['fullText'];a,b=ev['anchor']['start'],ev['anchor']['end'];assert 0<=a<b<=len(body)
   assert body[a:b]==ev['citation']['quote'] and normalized(body[a:b])==sample,'Retained historical capture differs'
   r.update(sample=sample,sample_sha256=hashlib.sha256(sample.encode()).hexdigest(),native_prose_prefix_match=True,historical_retained_context_match=True,historical_chunk_id=ev['anchor']['chunkId'],historical_offset={'start':a,'end':b,'unit':ev['anchor']['offsetUnit']},native_paragraph_ordinal=hits[0]+1)
   # Inspect inline note boundaries in the exact native locating interval.
   paragraph=paragraphs[hits[0]];raw_paragraph=''.join(paragraph.itertext())
   native_hits=env['locate'](sample,[{'id':'native-paragraph','text':raw_paragraph,'locator':c['selector']}]);assert len(native_hits)==1
   na,nb=native_hits[0]['start'],native_hits[0]['end'];parts=[];note_ranges=[];cursor=[0]
   def visit(node):
    start=cursor[0];parts.append(node.text or '');cursor[0]+=len(node.text or '')
    for child in node:
     visit(child);parts.append(child.tail or '');cursor[0]+=len(child.tail or '')
    if node.tag.rsplit('}',1)[-1]=='note':
     nt=''.join(node.itertext());note_ranges.append({'native_id':node.get('id'),'start':start,'end':cursor[0],'signature':'Ed.' if re.search(r'\bEd\.',nt) else 'unsigned/other','text_sha256':hashlib.sha256(nt.encode()).hexdigest(),'text':normalized(nt)})
   visit(paragraph);assert ''.join(parts)==raw_paragraph
   overlaps=[n for n in note_ranges if n['end']>na and n['start']<nb]
   r['native_sample_interval']={'start':na,'end':nb,'unit':'Unicode codepoints; within native commentary paragraph itertext'}
   r['embedded_notes_overlapping_sample']=overlaps
   r['note_role_limit']='Do not attribute embedded note text to the commentator; an Ed. signature does not independently identify the individual.' if overlaps else None
   rp=reader[role];page_hits=[]
   for page in rp['pages']:
    for block in page['content']['blocks']:
     if sample in normalized(block['text']):page_hits.append({'page':page['page'],'locator':block['locator']})
   if not page_hits:
    joined='';bounds=[]
    for page in rp['pages']:
     for block in page['content']['blocks']:
      start=len(joined);joined+=block['text'];bounds.append((start,len(joined),page['page'],block['locator']))
    crossing=env['locate'](sample,[{'id':'retained-reader','text':joined,'locator':rp['route']}])
    assert len(crossing)==1,'Sample missing or ambiguous across retained reader blocks: '+c['id']
    ra,rb=crossing[0]['start'],crossing[0]['end']
    page_hits=[]
    for ba,bb,pn,loc in bounds:
     hit={'page':pn,'locator':loc}
     if bb>ra and ba<rb and hit not in page_hits:page_hits.append(hit)
    r['reader_sample_crosses_blocks']=True
   else:assert len(page_hits)==1,'Ambiguous retained reading passage'
   if role=='fergusson':assert page_hits==c['readerLocations'],'Saved Fergusson page/locator drift'
   r['reader_locations']=page_hits;r['current_reader_links']=[rp['route']+'?page='+str(h['page']+1) for h in page_hits]
   r['reader_match']='whitespace-only; no spelling, punctuation or gap normalization'
   r['voice_limit']='Location sample only. Local endorsement, objections and full interpretation remain unadjudicated.'
  elif c['relationship']=='reference-conflict':
   assert c['verseIds']==[] and c['evidenceId'] is None and c['readerLocations']==[]
   assert role=='fergusson' and c['chapter']==1 and c['ordinal']==5
   r['issue']=c['issue'];r['suggested_reference']=c['suggestedReference'];r['mapping_withheld']=True
  else:
   assert c['relationship']=='structural-candidate' and c['evidenceId'] is None and not c['verseIds']
   r['scope_limit']='Chapter heading only; no verse or passage/voice approval.'
  rows.append(r)
# Validate historical public page proofs even where a prepared private copy now takes precedence.
historical_proofs={}
for s in sources.values():
 for proof in s['reader']['pageProofs']:
  key=(proof['path'],proof['sha256'])
  if key not in historical_proofs:checked(proof['path'],proof['sha256']);historical_proofs[key]=True
for p,proof in inputs.items():
 stat=Path(p).stat();assert stat.st_size==proof['bytes'] and stat.st_mtime_ns==proof['mtime_ns'],'Input changed before closeout'
summary={'connections':len(rows),'native_element_matches':sum(r['native_fingerprint_matches'] for r in rows),'located_native_prose_matches':sum(r.get('native_prose_prefix_match',False) for r in rows),'located_retained_context_matches':sum(r.get('historical_retained_context_match',False) for r in rows),'located_exact_reader_matches':sum(bool(r['current_reader_links']) for r in rows),'relationships':dict(Counter(r['relationship'] for r in rows)),'roles':dict(Counter(r['role'] for r in rows)),'gap_counts_by_role':{role:sum(r['gap_count'] for r in rows if r['role']==role) for role in sources},'samples_intersecting_embedded_notes':sum(bool(r.get('embedded_notes_overlapping_sample')) for r in rows),'historical_page_bundle_proofs':len(historical_proofs),'input_files':len(inputs),'input_bytes':sum(x['bytes'] for x in inputs.values()),'elapsed_seconds':round(time.monotonic()-started,3)}
result={'captured_at':datetime.now(timezone.utc).isoformat(),'purpose':'Source/reader readiness only; no corpus freshness, interpretation or retrieval certification','historical_corpus_builds':sorted({p['collection']['inputs']['corpusBuild'] for p in packages}),'package_paths':paths,'helper_implementation_sha256':hashlib.sha256(source.encode()).hexdigest(),'summary':summary,'sources':source_proofs,'connections':rows,'inputs':inputs,'queries':0,'model_calls':0,'current_corpus_opened':False,'curation_writes':0,'public_use':'Output-specific review still required; originals, public permission fields and historical packages unchanged.'}
write('source-reader-check.json',result)
print(json.dumps(summary))
