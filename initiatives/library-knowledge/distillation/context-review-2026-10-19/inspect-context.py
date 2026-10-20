"""Bounded native/source/reader context inspection. No current corpus or models.
Writes only context-review-2026-10-19/native-context.json; refuses overwrite.
"""
import hashlib,json,re,sys,zipfile
from pathlib import Path
from datetime import datetime,timezone
OUT=Path(__file__).resolve().parent;SITE=OUT.parents[3];sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import checked_bytes,cache_blocks,html_render,xml_render,text_hash
from lxml import etree
au=json.loads((OUT.parent/'candidate-audit-2026-10-19/audit.json').read_text('utf-8'))
cat=json.loads((SITE/'.local/data-analysis/website-candidates.json').read_text('utf-8'))
index=json.loads((SITE/'.local/local-library/index.json').read_text('utf-8'))
inputs={}
def checked(p,h=None):
 p=Path(p).resolve()
 if not p.is_relative_to(SITE.parent.resolve()) or p.stat().st_size>128*1024*1024:raise ValueError('Input path/size outside bound')
 raw,proof=checked_bytes(p,h);inputs[str(p)]={'sha256':proof[1],'bytes':proof[2],'mtime_ns':proof[3]};return raw

def reader_spans(r,locator,units,expected):
 folder=SITE/'.local/local-library/pages'/r['original']['sha256'];m=json.loads(checked(folder/'manifest.json'));text='';bounds=[]
 for page in range(m['pages']):
  value=json.loads(checked(folder/f'{page}.json'))
  for block in value['blocks']:
   if block['locator']!=locator:continue
   a=len(text);text+=block['text'];bounds.append((page,a,len(text)))
 assert text==expected,'Reader locator differs from native/cache'
 for u in units:
  u['reader_pages']=sorted({page+1 for page,a,b in bounds if b>u['start'] and a<u['end']})
  u['reader_links']=['/teachers/works/held-'+r['original']['sha256'][:32]+'?page='+str(n) for n in u['reader_pages']]
  u['span_sha256']=text_hash(text[u['start']:u['end']])
 return True

result={'captured_at':datetime.now(timezone.utc).isoformat(),'purpose':'Source/role/context readiness annotations, not candidate revisions or a retrieval experiment','coordinate_unit':'Unicode codepoint, half-open intervals within the specified locator','records':[],'semantic_queries':0,'model_calls':0}
for sid,member in [('4014056','abstract_split_006.html'),('6448057','bodydivinity_split_022.html'),('6336875','EPUB/chapter-02.xhtml')]:
 r=next(x for x in au['records'] if x['source_id']==sid);source=checked(r['original']['path'],r['original']['sha256']);cache=checked(r['extraction']['path'],r['extraction']['sha256']);blocks=cache_blocks(cache)
 with zipfile.ZipFile(r['original']['path']) as z:raw=z.read(member)
 body,heads=html_render(raw);block=next(b for b in blocks if b['locator'].endswith(': '+member));assert body==block['text'],'Native EPUB/cache differs'
 tree=etree.fromstring(raw,etree.HTMLParser());rec={'source_id':sid,'original':r['original'],'extraction':r['extraction'],'member':member,'member_sha256':hashlib.sha256(raw).hexdigest(),'locator':block['locator'],'native_cache_equal':True,'units':[]}
 if sid=='4014056':
  h=next(x for x in heads if x['heading']=='JUSTIFICATION');rec['units']=[{'kind':'complete catechism subsection','start':h['start'],'end':h['end'],'native_heading':h['heading']}]
  work=next(x for x in heads if x['heading']=='A Brief Catechism of Bible Doctrine');rec['nested_work']={'title':work['heading'],'start':work['start'],'byline_present':'BY DR. JAMES P. BOYCE, D. D' in body[:250],'byline_span_sha256':text_hash(body[:body.index('CATECHISM',100)]),'container_title':'Abstract of Systematic Theology','identity_limit':'Source-level contained-work distinction; no global work/edition ID is assigned.'}
 elif sid=='6448057':
  h=next(x for x in heads if x['heading']=='Of Justification');start=body.index('5a5. Fifthly, nor faith, or act of believing;');end=body.index('5a6. Sixthly,',start)
  rec['chapter']={k:h[k] for k in ('heading','start','end')};rec['units']=[{'kind':'complete source-numbered faith subsection 5a5 with a-f','start':start,'end':end,'native_heading':'5a5. Fifthly, nor faith, or act of believing'}]
  candidates=[n for n in tree.xpath('//p') if ' '.join(''.join(n.itertext()).split()).startswith('5a5. Fifthly')];assert len(candidates)==1;rec['native_paragraph_xpath']=tree.getroottree().getpath(candidates[0]);rec['saved_window_issue']='Current36000:37800 begins mid-sentence, crosses section5 and5a1, and ends before the full faith discussion at5a5. Proposed source window only; no live change.'
 else:
  matches=[n for n in tree.xpath('//aside') if 'vocatio' in ''.join(n.itertext()) and 'vacatio' in ''.join(n.itertext())];assert len(matches)==1;note=matches[0];text=html_render(etree.tostring(note,encoding='utf-8'))[0];start=body.index(text);assert body.count(text)==1
  rec['units']=[{'kind':'complete conjectural editorial note, including role signature/backlink','start':start,'end':start+len(text),'native_xpath':tree.getroottree().getpath(note),'native_id':note.get('id'),'role_marker':'Ed.','conjectural_reading':'vocatio / vacatio; retain hypothesis rather than silently emend source'}]
  with zipfile.ZipFile(r['original']['path']) as z:
   rec['paratext']=[]
   for name in ['EPUB/title.xhtml','EPUB/copyright.xhtml','EPUB/translator-preface.xhtml']:
    raw=z.read(name);t=html_render(raw)[0];b=next(b for b in blocks if b['locator'].endswith(': '+name));assert t==b['text'];entry={'member':name,'sha256':hashlib.sha256(raw).hexdigest(),'text_sha256':text_hash(t),'native_cache_equal':True}
    if name.endswith('/title.xhtml'):entry['named_credit']='Translated by the Rev. John King, M.A.';assert entry['named_credit'] in t
    if name.endswith('/translator-preface.xhtml'):
     a=t.index('On the mode in which');b=t.index('As it was possible that a doubt might exist',a);entry['role_evidence_span']={'start':a,'end':b,'sha256':text_hash(t[a:b])};entry['claim']='The preface self-describes the Editor as translator and says he appended notes and may disagree with the author; edition-level role evidence.'
    if name.endswith('/copyright.xhtml'):entry['use_gate']='2026 Monergism wrapper/use restrictions retained; not independently cleared for public output.'
    rec['paratext'].append(entry)
  other=next(v for v in index['documents'].values() if Path(v['path']).name=='calcom01.xml');raw=checked(other['path'],other['sha256']);t=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True,recover=True));notes=t.xpath('//*[local-name()="note" and contains(.,"vocatio") and contains(.,"vacatio")]');assert len(notes)==1
  etext=' '.join(''.join(note.xpath('.//*[contains(@class,"footnote-text")]')[0].itertext()).split());xtext=' '.join(''.join(notes[0].itertext()).split());assert etext==xtext,'Alternate note wording differs beyond whitespace'
  rec['alternate_held_note']={'original_path':other['path'],'sha256':other['sha256'],'xpath':t.getroottree().getpath(notes[0]),'native_id':notes[0].get('id'),'normalized_note_sha256':text_hash(xtext),'whitespace_only_match':True,'translator_assertions':[{'xpath':t.getroottree().getpath(n),'text':' '.join(''.join(n.itertext()).split())} for n in t.xpath('//*[local-name()="DC.Creator" and @sub="Translator"]') if ''.join(n.itertext()).strip()],'independence':'Alternate representation of the same note/translation, not independent doctrinal corroboration.'}
 rec['reader_locator_matches']=reader_spans(r,rec['locator'],rec['units'],body);result['records'].append(rec)

r=next(x for x in au['records'] if x['source_id']=='1048479');raw=checked(r['original']['path'],r['original']['sha256']);cache=cache_blocks(checked(r['extraction']['path'],r['extraction']['sha256']));body,items=xml_render(raw);assert len(cache)==1 and body==cache[0]['text'];tree=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True,recover=True));section=tree.xpath('//*[@id="xx.ii"]')[0];table=section.xpath('./table')[0];comment=section.xpath('./div[@id="Bible:1Cor.13.4"]')[0];sec=next(i for i in items if i.get('native_id')=='xx.ii');ci=next(i for i in items if i.get('native_id')=='Bible:1Cor.13.4')
selected=next(s for c in cat['candidates'] if c['id']=='caritas' for s in c['sources']);assert body[selected['start']:selected['end']]==selected['text']
rec={'source_id':'1048479','original':r['original'],'extraction':r['extraction'],'locator':cache[0]['locator'],'native_cache_equal':True,'native_section':sec,'units':[{'kind':'selected heading and parallel Scripture table; not commentary prose','start':selected['start'],'end':selected['end'],'native_table_xpath':tree.getroottree().getpath(table),'native_table_sha256':hashlib.sha256(etree.tostring(table,encoding='utf-8')).hexdigest()},{'kind':'adjacent translated commentary on verse4 with embedded editorial notes','start':ci['start'],'end':ci['end'],'native_xpath':tree.getroottree().getpath(comment),'embedded_note_ids':[n.get('id') for n in comment.xpath('.//note')]}],'translator_assertions':[{'xpath':tree.getroottree().getpath(n),'text':' '.join(''.join(n.itertext()).split())} for n in tree.xpath('//*[local-name()="DC.Creator" and @sub="Translator"]') if ''.join(n.itertext()).strip()],'native_title_credit':[{'xpath':tree.getroottree().getpath(n),'text':' '.join(''.join(n.itertext()).split())} for n in tree.xpath('//*[contains(text(),"BY THE REV. JOHN PRINGLE")]')],'column_roles':{'english':'Printed English Scripture column; precise Bible-version attribution is not newly verified here.','latin':'Printed Latin Scripture column; no universal sense rule or independently verified translation authorship.','commentary':'Separate translated commentary begins Love is patient and contains Ed. notes.'},'literal_join':'Caritaspatiens is present in the original XML verse4 line as well as the cache; retained, not silently corrected.'}
rec['reader_locator_matches']=reader_spans(r,rec['locator'],rec['units'],body);result['records'].append(rec)
for name in ['knowledge/library_analytics/section_contract.py','knowledge/library_analytics/inputs.py','scripts/local_library.py']:checked(SITE/name)
checked(__file__)
result['inputs']=inputs;result['input_bytes']=sum(x['bytes'] for x in inputs.values());result['changed_input_stats']=[p for p,v in inputs.items() if (Path(p).stat().st_size,Path(p).stat().st_mtime_ns)!=(v['bytes'],v['mtime_ns'])]
with (OUT/'native-context.json').open('x',encoding='utf-8') as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({'sources':len(result['records']),'native_cache_equal':all(r['native_cache_equal'] for r in result['records']),'reader_locator_matches':all(r['reader_locator_matches'] for r in result['records']),'units':[{'source':r['source_id'],'units':r['units']} for r in result['records']],'inputs':len(inputs),'unique_input_bytes':result['input_bytes'],'changed_inputs':result['changed_input_stats']},ensure_ascii=False))
