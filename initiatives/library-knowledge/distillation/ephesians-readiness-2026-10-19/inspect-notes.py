"""Pin complete native commentary units and separate embedded note intervals.
Source readiness only. No retrieval or live corpus/curation access.
"""
import ast,hashlib,json,re,sys,xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime,timezone
OUT=Path(__file__).resolve().parent;SITE=OUT.parents[3];sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import checked_bytes,xml_render
proof=json.loads((OUT/'source-reader-check.json').read_text('utf-8'))
source=next(s for s in proof['sources'] if s['role']=='calvin-commentary')
raw,stamp=checked_bytes(source['path'],source['sha256']);root=ET.fromstring(raw);body,bounds=xml_render(raw)
folder=SITE/'.local/local-library/pages'/source['sha256'];manifest=json.loads((folder/'manifest.json').read_text())
reader=''.join(b['text'] for n in range(manifest['pages']) for b in json.loads((folder/f'{n}.json').read_text('utf-8'))['blocks'])
assert reader==body,'Complete native rendering differs from retained reader stream'
impl=(SITE/'knowledge/evidence_collections/connections.py').read_text('utf-8');mod=ast.parse(impl)
helpers=[n for n in mod.body if isinstance(n,ast.FunctionDef) and n.name in ('normalized','locate')]
env={'re':re,'digest':lambda t:hashlib.sha256(t.encode()).hexdigest()};exec(compile(ast.Module(body=helpers,type_ignores=[]),'existing-pure-locator','exec'),env)
notes=[]
labels={'Ephesians 2:1-3':'Unsigned bilingual gloss; no personal note credit independently established.','Ephesians 2:4-7':'The overlapping note explicitly attributes its quotation to Chandler. That name is retained as a source label; the individual/work and quotation accuracy are not independently verified.','Ephesians 6:1-4':'The overlapping note explicitly attributes its quotation to Bloomfield. That name is retained as a source label; the individual/work and quotation accuracy are not independently verified.'}
for c in proof['connections']:
 if not c.get('embedded_notes_overlapping_sample'):continue
 element=root.find(c['selector']);paragraph=[n for n in element if n.get('class')=='Commentary'][c['native_paragraph_ordinal']-1];pid=paragraph.get('id')
 found=[b for b in bounds if b['native_id']==pid];assert len(found)==1;unit=found[0];text=body[unit['start']:unit['end']]
 item={'connection_id':c['id'],'heading':c['heading'],'native_id':pid,'complete_commentary_unit':{'start':unit['start'],'end':unit['end'],'sha256':hashlib.sha256(text.encode()).hexdigest(),'chars':len(text),'includes_embedded_notes':True},'overlapping_note_observation':labels[c['heading']],'note_intervals':[],'reader_links':c['current_reader_links'],'live_proposal_changed':False}
 for note in paragraph.iter('note'):
  nt=' '.join(''.join(note.itertext()).split());hits=env['locate'](nt,[{'id':pid,'text':text,'locator':pid}]);assert len(hits)==1
  a=unit['start']+hits[0]['start'];b=unit['start']+hits[0]['end'];item['note_intervals'].append({'native_id':note.get('id'),'start':a,'end':b,'sha256':hashlib.sha256(body[a:b].encode()).hexdigest(),'normalized_text_sha256':hashlib.sha256(nt.encode()).hexdigest(),'closing_text':nt[-110:],'overlaps_saved_sample':any(n['native_id']==note.get('id') for n in c['embedded_notes_overlapping_sample'])})
 assert item['note_intervals'];notes.append(item)
assert len(notes)==3
out={'captured_at':datetime.now(timezone.utc).isoformat(),'source_path':source['path'],'source_sha256':source['sha256'],'coordinate_unit':'Unicode codepoints, half-open, within exact complete xml_render/source reader stream; not chunk offsets','native_reader_stream_equal':True,'units':notes,'proposed_remedy':'Inspect each complete unit with notes separated before quoting/summarizing. Preserve note signatures and unsigned roles. Do not silently join commentator text across omitted notes or promote a locating sample into an approved answer.','queries':0,'model_calls':0}
with (OUT/'note-boundaries.json').open('x',encoding='utf-8',newline='\n') as f:json.dump(out,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({'units':len(notes),'unit_lengths':[n['complete_commentary_unit']['chars'] for n in notes],'notes':[len(n['note_intervals']) for n in notes],'native_reader_stream_equal':True}))
