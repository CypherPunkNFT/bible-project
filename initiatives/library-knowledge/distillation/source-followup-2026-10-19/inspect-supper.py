import sys,json,hashlib,zipfile,re
from pathlib import Path
from datetime import datetime,timezone
SITE=Path(__file__).resolve().parents[4];sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import html_render,cache_blocks,checked_bytes,text_hash
from lxml import etree
OUT=Path(__file__).resolve().parent
au=json.loads((OUT.parent/'candidate-audit-2026-10-19/audit.json').read_text('utf-8'))
result={'captured_at':datetime.now(timezone.utc).isoformat(),'scope':'Native section/context access only; no argument extraction, corpus or curation writes','records':[]}
for r in au['records']:
 if r['candidate']!='supper':continue
 original,op=checked_bytes(r['original']['path'],r['original']['sha256']);cache,cp=checked_bytes(r['extraction']['path'],r['extraction']['sha256']);blocks=cache_blocks(cache)
 member='Outlines of Theology_split_010.html' if r['source_id']=='4473820' else 'index_split_004.html'
 with zipfile.ZipFile(r['original']['path']) as z:raw=z.read(member)
 body,headings=html_render(raw);block=next(b for b in blocks if b['locator'].endswith(': '+member))
 assert body==block['text'],'Native/cache representation differs'
 tree=etree.fromstring(raw,etree.HTMLParser())
 if r['source_id']=='4473820':
  print('NATIVE HEADINGS',[(h['heading'],h['start'],h['end']) for h in headings]);h=next(h for h in headings if re.match(r'Chapter\s*43\s*:',h['heading']));start=h['start'];end=h['end']
  print('HODGE CHAPTER',start,end,'CHARACTERS',end-start)
  node=next(x for x in tree.xpath('//h3') if '43' in ''.join(x.itertext()));questions=[];cursor=start;expected=1
  for n in node.itersiblings():
   if n.tag=='h3':break
   t=html_render(etree.tostring(n,encoding='utf-8'))[0]
   if not t:continue
   at=body.find(t,cursor)
   assert at>=0,'Native paragraph location failed'
   cursor=at+len(t);m=re.match(r'^(\d+)\s*\.\s*(.*)', ' '.join(t.split()))
   if m and n.xpath('.//strong') and int(m[1])==expected:
    questions.append({'number':expected,'question':' '.join(t.split()),'start':at,'heading_end':cursor});expected+=1
  for i,q in enumerate(questions):q['end']=questions[i+1]['start'] if i+1<len(questions) else end;q['span_sha256']=text_hash(body[q['start']:q['end']])
  print('NATIVE QUESTION HEADINGS',json.dumps(questions,ensure_ascii=False))
  print('HODGE CHAPTER OPENING THROUGH Q5',body[start:questions[5]['start']])
  # Later context is read in separately bounded tool output; no body duplicated in receipt.
  item={'source_id':r['source_id'],'original_sha256':op[1],'cache_sha256':cp[1],'member':member,'native_member_sha256':hashlib.sha256(raw).hexdigest(),'native_cache_equal':True,'locator':block['locator'],'start':start,'end':end,'span_sha256':text_hash(body[start:end]),'questions':questions}
 else:
  h=next(h for h in headings if h['heading'].startswith('2.'));start=h['start'];end=h['end'];print('HENRY SECTION',start,end)
  item={'source_id':r['source_id'],'original_sha256':op[1],'cache_sha256':cp[1],'member':member,'native_member_sha256':hashlib.sha256(raw).hexdigest(),'native_cache_equal':True,'locator':block['locator'],'start':start,'end':end,'span_sha256':text_hash(body[start:end]),'native_headings':[h for h in headings if start<=h['start']<end]}
 result['records'].append(item)


# Refine the native question map after inspecting continuation and voice boundaries.
hodge=next(x for x in result['records'] if x['source_id']=='4473820')
r=next(x for x in au['records'] if x['source_id']=='4473820')
cache,_=checked_bytes(r['extraction']['path'],r['extraction']['sha256']);body=next(b['text'] for b in cache_blocks(cache) if b['locator']==hodge['locator'])
q=hodge['questions'];q12=next(x for x in q if x['number']==12)
continuation_end=body.index('The early fathers',q12['heading_end'])
q12['question']=' '.join(body[q12['start']:continuation_end].split());q12['heading_end']=continuation_end
footer=re.search(r'AUTHORITATIVE STATEMENTS OF\s+CHURCH DOCTRINE',body[hodge['start']:hodge['end']])
assert footer is not None
footer_start=hodge['start']+footer.start();q[-1]['end']=footer_start;q[-1]['span_sha256']=text_hash(body[q[-1]['start']:footer_start])
hodge['question_map_limit']='Native numbered question boundaries only; no extracted arguments or truth/acceptance judgments. Q12 continuation included; Q26 excludes the separately labelled standards block.'
hodge['quoted_standards']={'start':footer_start,'end':hodge['end'],'span_sha256':text_hash(body[footer_start:hodge['end']]),'role':'Quoted church standards as reproduced in this Hodge witness; not Hodge-authored prose, independently checked originals or independent source families.'}
hodge['context_roles']=[{'questions':[1,11],'role':'Opening questions, names, definitions and prescribed use in Hodge’s theological treatment; reported practices are not current site instructions.'},{'questions':[12,14],'role':'Hodge’s historical report and criticism of Roman Catholic teaching; not a neutral or directly checked Catholic account.'},{'questions':[15,16],'role':'Hodge’s descriptions of Lutheran/Reformed positions; source attribution and quoted material must remain visible.'},{'questions':[17,21],'role':'Reported positions on efficacy and Hodge’s replies; do not attribute a reported opponent’s statement to Hodge as assent.'},{'questions':[22,26],'role':'Hodge’s admission/discipline discussion, with embedded quotations; not current guidance for all churches.'}]
hodge['preferred_complete_naming_window']={k:q[2][k] for k in ('start','end','span_sha256')}
hodge['saved_candidate_window']={'start':136732,'end':138532,'issue':'Ends inside question3 before the complete communion explanation and breaking-of-bread item; saved expanded context continues into an incomplete question4.'}
for item in result['records']:
 r=next(x for x in au['records'] if x['source_id']==item['source_id']);folder=SITE/'.local/local-library/pages'/r['original']['sha256'];manifest=json.loads((folder/'manifest.json').read_text('utf-8'));bounds=[];reconstructed=''
 for page in range(manifest['pages']):
  data=json.loads((folder/f'{page}.json').read_text('utf-8'))
  for block in data['blocks']:
   if block['locator']!=item['locator']:continue
   a=len(reconstructed);reconstructed+=block['text'];bounds.append((page,a,len(reconstructed)))
 cache,_=checked_bytes(r['extraction']['path'],r['extraction']['sha256']);expected=next(b['text'] for b in cache_blocks(cache) if b['locator']==item['locator'])
 assert reconstructed==expected
 item['reader_locator_text_matches_native_cache']=True
 def pages(a,b):return sorted({n+1 for n,s,e in bounds if e>a and s<b})
 item['reader_pages']=pages(item['start'],item['end'])
 for unit in item.get('questions',[]):unit['reader_pages']=pages(unit['start'],unit['end'])
 if 'quoted_standards' in item:item['quoted_standards']['reader_pages']=pages(item['quoted_standards']['start'],item['quoted_standards']['end'])
 if 'preferred_complete_naming_window' in item:item['preferred_complete_naming_window']['reader_pages']=pages(item['preferred_complete_naming_window']['start'],item['preferred_complete_naming_window']['end'])

# Native edition notice is a dependency of attribution, not publication clearance.
r=next(r for r in au['records'] if r['source_id']=='2134297')
with zipfile.ZipFile(r['original']['path']) as z:
 raw=z.read('index_split_002.html');notice=html_render(raw)[0]
 cache,_=checked_bytes(r['extraction']['path'],r['extraction']['sha256'])
 block=next(b for b in cache_blocks(cache) if b['locator']=='EPUB section 4: index_split_002.html')
 assert notice==block['text']
 result['henry_edition_notice']={'member':'index_split_002.html','member_sha256':hashlib.sha256(raw).hexdigest(),'text_sha256':text_hash(notice),'native_cache_equal':True,'publisher':'Chapel Library','compilation_copyright_year':2017,'adaptations_declared':['capitalization and punctuation modernized','sentence structure modified','portions omitted'],'source_work_claim':'The Communicant’s Companion, first four chapters','historical_date_claim':'The notice states first published posthumously in 1762; not independently verified in this inspection','public_use':'Notice retained; operational public-use gate unchanged'}

with (OUT/'supper-native-context.json').open('x',encoding='utf-8') as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
