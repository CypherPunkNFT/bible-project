"""Frozen source-annotation oracles; location quality is distinct from interpretation."""
import collections,json,re
from pathlib import Path
from lxml import etree,html
from .inputs import OUT,read,checked,split
from ..build import dump
from ..inputs import digest,packed
from ..section_contract import text_hash

def all_nodes(value,path=''):
 if isinstance(value,dict):
  if value.get('node')=='l' and isinstance(value.get('f'),dict):yield path,value
  for k,v in value.items():
   if k not in ('f','gdl','props'):yield from all_nodes(v,path+'/'+k)
 elif isinstance(value,list):
  for i,v in enumerate(value):yield from all_nodes(v,path+'/'+str(i))

def xml_plain_positions(root):
 positions={};pieces=[];offset=0
 def walk(node):
  nonlocal offset
  start=offset
  if node.text:pieces.append(node.text);offset+=len(node.text)
  for child in node:
   walk(child)
   if child.tail:pieces.append(child.tail);offset+=len(child.tail)
  positions[node]=(start,offset)
 walk(root)
 return ''.join(pieces),positions

def freeze_cases(rows):
 path=OUT/'inputs/quality-cases.json'
 if path.exists():return read(path)
 cases=[]
 for row in rows:
  if not row['paths']:continue
  adapter=row['adapter'];scope=row['id'];proof=row['paths'][-1] if adapter=='historical-citation' else row['paths'][0]
  if any(p.get('error') for p in row['paths']):continue
  # The fixture uses independent all-field traversal and raw source XPath.
  if adapter=='oracc-json' and int(digest(scope)[:8],16)%97!=0:continue
  raw,_=checked(proof['path'],proof['sha256']);items=[]
  if adapter=='historical-citation':
   q=row['record'].get('quote');text=raw.decode('utf-8-sig')
   normalized=' '.join(text.split());needle=' '.join((q or '').split())
   supported=bool(q and needle in normalized)
   items=[{'native':'citation','quote':q,'expected':supported,'source_id':row['record']['sourceId'],'claim_id':row['record']['claimId'],'dates':row['record']['dates'],'baseline':bool(q and q in text)}]
  elif adapter=='lexicon':
   root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True));tree=root.getroottree();docs={d['xml_link']['entry_key'] for d in row['record']};plain,positions=xml_plain_positions(root)
   for i,node in enumerate(root.xpath('//*[local-name()="entry"]')):
    native=node.get('id','')+':'+str(i)
    if native not in docs or int(digest(native)[:8],16)%101!=0:continue
    words=node.xpath('./*[local-name()="w"]');definitions=node.xpath('./*[local-name()="meaning"]') if Path(proof['path']).name=='HebrewStrong.xml' else node.xpath('./*[local-name()="def"]')
    if not definitions and Path(proof['path']).name=='HebrewStrong.xml':definitions=node.xpath('./*[local-name()="usage"]')
    word=words[0] if words else None
    lang=None
    if word is not None:
     for ancestor in [word,node,*node.iterancestors()]:
      lang=ancestor.get('{http://www.w3.org/XML/1998/namespace}lang')
      if lang:break
    lemma=''.join(word.itertext()) if word is not None else None
    baseline=bool(lemma and definitions and plain.find(lemma)==positions[word][0] and all(plain.find(''.join(n.itertext()))==positions[n][0] for n in definitions))
    items.append({'native':native,'expected':bool(words and definitions),'source_locator':tree.getpath(word) if word is not None else None,'source_text':lemma,'source_language':lang or 'und',
     'targets':[{'locator':tree.getpath(n),'text':''.join(n.itertext())} for n in definitions], 'baseline':baseline})
  elif adapter=='oracc-json':
   if not raw.strip():continue
   value=json.loads(raw);tokens=list(all_nodes(value));first_forms={};first_glosses={}
   for pointer,node in tokens:
    f=node['f'];first_forms.setdefault(f.get('form'),pointer);first_glosses.setdefault(f.get('sense') or f.get('gw'),pointer)
   for pointer,node in tokens:
    f=node['f'];form=f.get('form');sense=f.get('sense') or f.get('gw')
    if int(digest(scope+pointer)[:8],16)%101!=0:continue
    field='sense' if f.get('sense') else 'gw'
    items.append({'native':pointer,'expected':bool(form and sense),'source_locator':pointer+'/f/form','source_text':form,'source_language':f.get('lang','und'),'targets':[{'locator':pointer+'/f/'+field,'text':sense}], 'ref':node.get('ref'),'baseline':bool(form and sense and first_forms[form]==pointer and first_glosses[sense]==pointer)})
  elif adapter=='oracc-atf':
   soup=html.fromstring(raw);pres=soup.xpath('//pre')
   if len(pres)!=1:continue
   text=''.join(pres[0].itertext());marker=re.search(r'(?m)^@translation labeled en[^\n]*',text)
   if not marker:continue
   source_lines=re.findall(r"(?m)^([0-9]+[′']?)\.\s*([^\n]+)",text[:marker.start()]);labels=collections.Counter(label.replace('′',"'") for label,_ in source_lines)
   for i,m in enumerate(re.finditer(r'(?m)^@\(([^)]+)\)\s*',text[marker.end():])):
    rawlabel=m.group(1);ends=re.split(r'\s+-\s+',rawlabel);valid=len(ends) in (1,2) and all(labels[e.replace('′',"'")]==1 for e in ends)
    items.append({'native':rawlabel,'expected':valid,'ends':ends,'baseline':bool(valid and len(ends)==1 and i<len(source_lines) and source_lines[i][0]==ends[0]),'source_language':'akk'})
  for item in items:
   item.update(adapter=adapter,scope_id=scope,path=proof['path'],sha256=proof['sha256'],split=split(adapter,scope,'' if adapter=='oracc-atf' else item['native']))
   cases.append(item)
 dump(path,{'contract':'source-annotation-location-v1; no semantic truth oracle','cases':cases,'counts':dict(collections.Counter((c['adapter']+'|'+c['split']) for c in cases))})
 return read(path)

def resolve_witness(w,cache):
 k=(w['path'],w['asset_sha256'],w['coordinate'])
 if k not in cache:
  raw,_=checked(w['path'],w['asset_sha256'])
  if w['coordinate']=='unicode-codepoint-file':v=raw.decode('utf-8-sig')
  elif w['coordinate']=='xml-node-text':v=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True))
  elif w['coordinate']=='json-string':v=json.loads(raw)
  elif w['coordinate']=='html-pre-text':v=''.join(html.fromstring(raw).xpath('//pre')[0].itertext())
  else:raise ValueError('Unknown witness coordinate')
  cache.clear();cache[k]=v
 v=cache[k]
 if w['coordinate']=='xml-node-text':
  # lxml emits namespace-wildcard paths for a default namespace.
  nodes=v.getroottree().xpath(w['locator']);assert len(nodes)==1;v=''.join(nodes[0].itertext())
 elif w['coordinate']=='json-string':
  for part in w['locator'].split('/')[1:]:v=v[int(part)] if isinstance(v,list) else v[part.replace('~1','/').replace('~0','~')]
 value=v[w['start']:w['end']]
 if value!=w['text'] or text_hash(value)!=w['text_sha256']:raise ValueError('Witness did not reconstruct')
 return value

def evaluate(db,run,development_only=False):
 frozen=read(OUT/'inputs/quality-cases.json');adapters={};decisions=[];cache={}
 for c in frozen['cases']:
  if development_only and c['split']!='development':continue
  # Calibration intentionally only evaluates the selected JSON stratum; all other adapters are complete.
  if not db.execute('select 1 from scope where run_id=? and scope_id=?',(run,c['scope_id'])).fetchone():continue
  k=c['adapter']+'|'+c['split'];stats=adapters.setdefault(k,collections.Counter());stats['cases']+=1
  if c['adapter']=='historical-citation':
   rows=db.execute("select h.entity_id,w.* from historical_links h join witnesses w on w.id=h.witness_id where h.run_id=? and h.scope_id=? and h.basis='explicit-citation-claim'",(run,c['scope_id'])).fetchall()
   correct=bool(rows) and all(r['entity_id']==c['claim_id'] and ' '.join(r['text'].split())==' '.join(c['quote'].split()) for r in rows)
   for r in rows:resolve_witness(r,cache)
   date_rows=db.execute("select role,raw from dates where run_id=? and scope_id=? and role!='mentioned-date-unassigned'",(run,c['scope_id'])).fetchall()
   if rows:correct=correct and dict(date_rows)==c['dates']
  else:
   rows=db.execute('''select a.*,s.locator sloc,s.text stxt,s.id sid,t.locator tloc,t.text ttxt,t.id tid from language_alignments a join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where a.run_id=? and a.scope_id=?''',(run,c['scope_id'])).fetchall()
   if c['adapter']=='oracc-atf':
    rows=[r for r in rows if json.loads(r['numbering_json']).get('raw_label')==c['native']]
    correct=bool(rows)
    if correct:
     for r in rows:
      numbering=json.loads(r['numbering_json']);lines=numbering['source_lines']
      correct=correct and lines[0][0].replace('′',"'")==c['ends'][0].replace('′',"'") and lines[-1][0].replace('′',"'")==c['ends'][-1].replace('′',"'")
   else:
    rows=[r for r in rows if r['sloc']==c['source_locator']]
    expected={(t['locator'],t['text']) for t in c['targets']}
    correct=bool(rows) and {(r['tloc'],r['ttxt']) for r in rows}==expected and all(r['stxt']==c['source_text'] and r['source_language']==c['source_language'] for r in rows)
   for r in rows:
    for ident in (r['sid'],r['tid']):resolve_witness(db.execute('select * from witnesses where id=?',(ident,)).fetchone(),cache)
  emitted=bool(rows);expected=c['expected'];safe=(correct if expected else not emitted)
  stats['expected_positive']+=expected;stats['emitted']+=emitted;stats['correct_positive']+=bool(expected and correct);stats['safe_negative']+=bool(not expected and not emitted);stats['failures']+=not safe;stats['baseline_correct']+=bool(expected and c['baseline']);stats['witnesses_reconstructed']+=len(rows)
  decisions.append({'adapter':c['adapter'],'scope_id':c['scope_id'],'native':c['native'],'split':c['split'],'expected_positive':expected,'emitted':emitted,'correct':bool(safe),'baseline_correct':bool(c['baseline'])})
 result={}
 for k,s in adapters.items():
  precision=s['correct_positive']/s['emitted'] if s['emitted'] else 1.0;recall=s['correct_positive']/s['expected_positive'] if s['expected_positive'] else 1.0
  result[k]={**dict(s),'located_precision':precision,'annotation_recall':recall,'gain_correct_located':s['correct_positive']-s['baseline_correct'],'passed':precision>=.98 and recall>=.98 and s['failures']==0}
 receipt={'reviewer':'deterministic independent source-annotation oracle; interpretation pending model-assisted content inspection','adapters':result,'decisions':decisions,'semantic_translation_quality':'not established; lexical senses and labeled groups only','specialist_review':False}
 dump(OUT/('calibration-quality.json' if development_only else 'population-quality.json'),receipt)
 return {k:v for k,v in receipt.items() if k!='decisions'}
