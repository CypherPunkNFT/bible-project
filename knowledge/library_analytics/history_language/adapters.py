"""Literal/reference/structural adapters. No embeddings or inferred influence."""
import collections,hashlib,json,re,time
from pathlib import Path
from lxml import etree,html
from .inputs import checked,split
from .contract import SRUN,ARUN
from ..inputs import digest,packed
from ..jobs import StaleInput
from ..section_contract import text_hash

def key(*parts):return 'hl-'+digest(parts)
def defer(db,run,scope,reason,record=None):
 db.execute('insert or replace into deferrals values(?,?,?,?)',(run,scope,reason,packed(record or {})))
def witness(db,run,row,proof,coordinate,locator,text,start=0,end=None,metadata=None):
 end=len(text) if end is None else end
 if not 0<=start<=end<=len(text):raise ValueError('Invalid source span')
 literal=text[start:end];wid=key(run,row['id'],proof['path'],coordinate,locator,start,end)
 resource=row.get('resource');rid=resource['id'] if resource else None
 db.execute('insert or ignore into witnesses values(?,?,?,?,?,?,?,?,?,?,?,?,?)',
  (wid,run,row['id'],rid,proof['path'],proof['sha256'],coordinate,locator,start,end,text_hash(literal),literal,packed(metadata or {})))
 return wid
def align(db,run,row,sw,tw,sl,tl,relation,numbering,credits,record,state='source-annotation'):
 ident=key(run,row['id'],sw,tw,relation)
 db.execute('insert into language_alignments values(?,?,?,?,?,?,?,?,?,?,?,?)',
  (ident,run,row['id'],sw,tw,sl,tl,relation,state,packed(numbering),packed(credits),packed(record)))
 return ident
def case(db,run,row,native,expected):
 cid=key(run,'eval',row['id'],native)
 sp=split(row['adapter'],row['id'],'' if row['adapter']=='oracc-atf' else native)
 db.execute('insert or ignore into evaluation_cases values(?,?,?,?,?,?)',(cid,run,row['adapter'],sp,row['id'],packed(expected)))

def normalize_with_map(text):
 chars=[];bounds=[];space=False
 for i,c in enumerate(text):
  if c.isspace():
   if not space:chars.append(' ');bounds.append(i)
   space=True
  else:chars.append(c);bounds.append(i);space=False
 return ''.join(chars),bounds
def quote_locations(text,quote):
 if not quote:return []
 exact=[(m.start(),m.end(),'exact') for m in re.finditer(re.escape(quote),text)]
 if exact:return exact
 norm,coords=normalize_with_map(text);q=' '.join(quote.split());matches=[]
 for m in re.finditer(re.escape(q),norm):
  if m.end()>m.start():matches.append((coords[m.start()],coords[m.end()-1]+1,'whitespace-normalized'))
 return matches

#: Shortest title a namespace may offer as a mention key. The curated Scripture dictionary earns 4
#: because at 6 it cannot reach David, Egypt, Edom, Ekron, Gaza, Tyre, Ahaz, Peter or the tribe Judah;
#: below 4 it would reach Pharaoh 'So', which matches the English word. See SUPPLEMENT_CRITERIA.
MENTION_MIN={'scripture-entities':4}
def mention_patterns(entities):
 """Compile the mention keys once. The title set now exceeds the interpreter's regex cache, so
 building the pattern inside the per-witness loop would recompile every title for every span."""
 patterns=[]
 for e in entities:
  if e['namespace']=='evidence':continue
  title=e['title']
  if len(title)<MENTION_MIN.get(e['namespace'],6):continue
  patterns.append((re.compile(r'(?<!\w)'+re.escape(title)+r'(?!\w)',re.I),e['id']))
 return patterns

def historical(db,run,row,context):
 rec=row['record'];proofs={p['path']:p for p in row['paths']};priv=rec['private']
 path=priv.get('extractedPath');proof=proofs.get(path)
 if not proof or proof.get('error'):
  defer(db,run,row['id'],'missing-or-changed-extracted-source',{'proof':proof});return
 raw,_=checked(path,proof['sha256']);text=raw.decode('utf-8-sig');quote=rec.get('quote')
 locations=quote_locations(text,quote)
 expected={'quote':quote,'source_id':rec['sourceId'],'claim_id':rec['claimId'],'raw_exact':bool(quote and quote in text),'expected_literal':bool(locations),'date_roles':rec['dates']}
 case(db,run,row,'citation',expected)
 if not locations:
  defer(db,run,row['id'],'quote-absent-or-not-literal',{'quote_present':bool(quote),'locator':rec['locator']});return
 if 'entity_patterns' not in context:context['entity_patterns']=mention_patterns(context['entities'])
 for a,b,method in locations:
  wid=witness(db,run,row,proof,'unicode-codepoint-file','extractedPath',text,a,b,{'citation_locator':rec['locator'],'precision':method,'not_primary_edition':True})
  targets=[(rec['claimId'],'explicit-citation-claim'),(rec['sourceId'],'explicit-citation-source')]
  targets += [(r['source_id'],'explicit-assesses-claim') for r in context['relations'] if r['relation']=='assesses' and r['target_id']==rec['claimId']]
  for target,basis in targets:
   db.execute('insert into historical_links values(?,?,?,?,?,?,?,?,?)',(key(run,row['id'],wid,target,basis),run,row['id'],target,wid,basis,'located-source-annotation','[]',packed(rec)))
  # Full-name matches retain every candidate ID and never assert person equality.
  mentions=collections.defaultdict(list)
  for pattern,entity_id in context['entity_patterns']:
   for m in pattern.finditer(text[a:b]):mentions[(m.start(),m.end(),m.group())].append(entity_id)
  for (start,end,literal),ids in mentions.items():
   ids=list(dict.fromkeys(ids))
   for target in ids:
    db.execute('insert into historical_links values(?,?,?,?,?,?,?,?,?)',(key(run,row['id'],wid,target,start,end),run,row['id'],target,wid,'full-title-lexical-mention','candidate-ambiguous',packed(ids),packed({'literal':literal,'start':a+start,'end':a+end,'identity':'unresolved; a title occurrence does not prove referent identity'})))
  for role,value in rec['dates'].items():
   db.execute('insert into dates values(?,?,?,?,?,?,?,?)',(key(run,row['id'],wid,role),run,row['id'],wid,role,value,'recorded' if value else 'unknown',packed({'dateStatus':priv.get('dateStatus'),'no_role_conversion':True})))
  # Mentioned chronology is distinct from edition/discovery/composition roles.
  for m in re.finditer(r'(?<!\w)(?:c\.\s*)?\d{1,4}(?:\s*[-–/]\s*\d{1,4})?\s*(?:BCE|BC|CE|AD)\b',text[a:b]):
   db.execute('insert into dates values(?,?,?,?,?,?,?,?)',(key(run,row['id'],wid,'mention',m.start()),run,row['id'],wid,'mentioned-date-unassigned',m.group(),'specialist-role-deferred',packed({'start':a+m.start(),'end':a+m.end(),'range_normalization':None})))
 defer(db,run,row['id'],'source-claim-specialist-review',{'review':rec['review'],'limits':rec['limits'],'alternatives':rec['alternatives']})
 bind_source(db,run,row,context)

def bind_source(db,run,row,context):
 matches=[]
 for p in row['paths']:
  matches+=context['source_docs'].get((p['path'],p['sha256']),[])
 if not matches:
  defer(db,run,row['id'],'no-pinned-KR101-document-binding',{'section_run':SRUN,'alignment_run':ARUN,'basis':'Exact path+source hash; no title substitution'})
  return
 for doc in sorted(set(matches)):bind_document(db,run,row['id'],doc,context)

def bind_document(db,run,scope,doc,context):
 sections=context['sections'];alignment=context['alignment']
 for s in sections.execute('''select s.version_id,s.kind,s.state from sections s indexed by sections_document join run_sections r on r.version_id=s.version_id and r.run_id=? where s.document_id=?''',(SRUN,doc)):
  status=alignment.execute('select * from section_alignment_status where run_id=? and version_id=?',(ARUN,s['version_id'])).fetchone()
  destinations=[dict(r) for r in alignment.execute('select * from section_destinations where run_id=? and version_id=?',(ARUN,s['version_id']))]
  db.execute('insert or ignore into section_bindings values(?,?,?,?,?,?)',(run,scope,doc,s['version_id'],'pinned-section',packed({'section':dict(s),'alignment':dict(status) if status else None,'destinations':destinations})))

XMLLANG='{http://www.w3.org/XML/1998/namespace}lang'
def node_text(node):return ''.join(node.itertext())
def lexicon(db,run,row,context):
 proof=row['paths'][0];raw,_=checked(proof['path'],proof['sha256'])
 root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True));tree=root.getroottree()
 docs={d['xml_link']['entry_key']:d for d in row['record']};name=Path(proof['path']).name
 entries=root.xpath('//*[local-name()="entry"]');seen=set()
 for i,node in enumerate(entries):
  native=node.get('id','')+':'+str(i)
  if native not in docs:continue
  seen.add(native);d=docs[native];words=node.xpath('./*[local-name()="w"]')
  if not words:
   defer(db,run,row['id'],native+':headword-missing');continue
  word=words[0];lemma=node_text(word);language=word.get(XMLLANG)
  if not language:
   for ancestor in [node,*node.iterancestors()]:
    if ancestor.get(XMLLANG):language=ancestor.get(XMLLANG);break
  candidates=node.xpath('./*[local-name()="meaning"]') if name=='HebrewStrong.xml' else node.xpath('./*[local-name()="def"]')
  relation='lexicon-definition'
  if not candidates and name=='HebrewStrong.xml':candidates=node.xpath('./*[local-name()="usage"]');relation='lexicon-usage-list'
  expected={'native_key':native,'document_id':d['document_id'],'lemma':lemma,'definitions':[node_text(n) for n in candidates],'source_language':language,'count':len(candidates)}
  case(db,run,row,native,expected)
  if not candidates:
   defer(db,run,row['id'],native+':definition-missing',{'document_id':d['document_id']});continue
  if not language:language='und';defer(db,run,row['id'],native+':language-unassigned')
  sw=witness(db,run,row,proof,'xml-node-text',tree.getpath(word),lemma,metadata={'entry_key':native,'original_language':language,'word_attributes':dict(word.attrib)})
  for definition in candidates:
   gloss=node_text(definition)
   if not gloss.strip():continue
   tw=witness(db,run,row,proof,'xml-node-text',tree.getpath(definition),gloss,metadata={'entry_key':native,'language':'en','role':'editorial gloss; not verse translation'})
   xrefs=[dict(x.attrib) for x in node.xpath('./*[local-name()="xref"]')]
   align(db,run,row,sw,tw,language,'en',relation,{'native_entry':node.get('id'),'entry_key':native,'xref_namespaces_preserved':xrefs},
    {'source_registry':json.loads(row['resource']['record']) if row.get('resource') else None,'translator':None,'scope':'Source author/editor credits retained; translator not inferred'},
    {'document_id':d['document_id'],'definition_scope':'same editorial entry; alternative glosses retained','uncertainty':'Lexical sense selection in any passage requires specialist review'})
  bind_document(db,run,row['id'],d['document_id'],context)
 for native in docs.keys()-seen:raise StaleInput('Pinned lexical entry missing: '+native)

def json_tokens(value,path=''):
 if isinstance(value,dict):
  if value.get('node')=='l' and isinstance(value.get('f'),dict):yield path,value
  for field in ('cdl','choices'):
   for i,child in enumerate(value.get(field,[])):yield from json_tokens(child,path+'/'+field+'/'+str(i))

def oracc_json(db,run,row,context):
 proof=row['paths'][0];raw,_=checked(proof['path'],proof['sha256'])
 if not raw.strip():defer(db,run,row['id'],'empty-held-corpusjson');return
 value=json.loads(raw);count=0;names=0
 if value.get('type')!='cdl':defer(db,run,row['id'],'unsupported-json-root',{'keys':list(value)[:20]});return
 for pointer,node in json_tokens(value):
  f=node['f'];form=f.get('form');language=f.get('lang','und')
  gloss=f.get('sense') or f.get('gw');expected={'pointer':pointer,'ref':node.get('ref'),'form':form,'sense':gloss,'source_language':language,'supported':bool(form and gloss)}
  # Store bounded frozen evaluation samples at native token level, selected by hash.
  if int(digest(row['id']+pointer)[:8],16)%101==0:case(db,run,row,pointer,expected)
  if not form or not gloss:continue
  sw=witness(db,run,row,proof,'json-string',pointer+'/f/form',form,metadata={'source_ref':node.get('ref'),'source_token_id':node.get('id'),'language':language})
  field='sense' if f.get('sense') else 'gw'
  tw=witness(db,run,row,proof,'json-string',pointer+'/f/'+field,gloss,metadata={'language':'en','role':'editorial lexical sense; not a running translation'})
  numbering={'project':value.get('project'),'textid':value.get('textid'),'token_id':node.get('id'),'ref':node.get('ref'),'sig':node.get('sig')}
  annotation={k:f.get(k) for k in ('cf','gw','sense','norm','pos','epos','lang')};annotation.update(inst=node.get('inst'),props=node.get('props'),gdl=f.get('gdl'))
  align(db,run,row,sw,tw,language,'en','oracc-lexical-annotation',numbering,
   {'license':value.get('license'),'license_url':value.get('license-url'),'source':value.get('source'),'translator':None,'credit':row['record'].get('metadata',{}).get('credit')},
   {'annotation':{k:v for k,v in annotation.items() if k!='gdl'},'text_translation':False,'uncertainty':'Guideword is an editorial lexical aid; token restoration and deity/person/place ambiguity remain in source annotation'})
  if str(f.get('pos','')).endswith('N') and f.get('pos') not in ('N','AN'):
   names+=1
   db.execute('insert into source_annotations values(?,?,?,?,?,?)',(key(run,row['id'],pointer,'name'),run,row['id'],sw,node.get('ref'),packed(annotation)))
  count+=1
 if not count:defer(db,run,row['id'],'no-paired-token-gloss')
 defer(db,run,row['id'],'running-translation-not-in-corpusjson',{'lexical_pairs':count,'name_annotations':names,'no_canonical_entity_merge':True})
 bind_source(db,run,row,context)

LINE=re.compile(r"(?m)^([0-9]+[′']?)\.\s*([^\n]+)")
GROUP=re.compile(r'(?m)^@\(([^)]+)\)\s*')
def atf_groups(text):
 marker=re.search(r'(?m)^@translation\s+labeled\s+en\b[^\n]*',text)
 if not marker:return [],['no-explicit-labeled-English-translation']
 source=text[:marker.start()];lines=list(LINE.finditer(source));lookup=collections.defaultdict(list)
 norm=lambda s:s.strip().replace('′',"'")
 for m in lines:lookup[norm(m.group(1))].append(m)
 groups=list(GROUP.finditer(text,marker.end()));result=[];failures=[]
 for i,m in enumerate(groups):
  label=m.group(1);parts=re.split(r'\s+-\s+',label)
  if len(parts) not in (1,2) or any(len(lookup[norm(p)])!=1 for p in parts):failures.append({'label':label,'reason':'nonunique-or-unsupported-source-label'});continue
  first=lookup[norm(parts[0])][0];last=lookup[norm(parts[-1])][0]
  if first.start()>last.start():failures.append({'label':label,'reason':'reversed-label-range'});continue
  end=groups[i+1].start() if i+1<len(groups) else len(text)
  boundary=re.search(r'(?m)^(?:\$|@)[^\n]*',text[m.end():end])
  if boundary:end=m.end()+boundary.start()
  while end>m.end() and text[end-1].isspace():end-=1
  selected=[x for x in lines if first.start()<=x.start()<=last.start()]
  result.append({'label':label,'source_start':first.start(2),'source_end':last.end(2),'target_start':m.end(),'target_end':end,'line_spans':[(x.group(1),x.start(2),x.end(2)) for x in selected]})
 return result,failures

def oracc_atf(db,run,row,context):
 proof=row['paths'][0];raw,_=checked(proof['path'],proof['sha256']);soup=html.fromstring(raw);pres=soup.xpath('//pre')
 if len(pres)!=1:defer(db,run,row['id'],'not-one-native-ATF-block',{'pre_count':len(pres)});return
 text=node_text(pres[0]);groups,failures=atf_groups(text)
 credits=[node_text(p) for p in soup.xpath('//p') if 'Created by' in node_text(p) or 'Lemmatized by' in node_text(p)]
 language=re.search(r'(?m)^#atf:\s*lang\s+(\S+)',text);language=language.group(1) if language else 'und'
 case(db,run,row,'edition',{'groups':groups,'failures':failures,'source_language':language,'credits':credits})
 for g in groups:
  sw=witness(db,run,row,proof,'html-pre-text','pre[1]',text,g['source_start'],g['source_end'],{'line_spans':g['line_spans'],'markup':'ATF; includes intervening editorial annotations'})
  tw=witness(db,run,row,proof,'html-pre-text','pre[1]',text,g['target_start'],g['target_end'],{'markup':'English translation with retained ATF markup'})
  align(db,run,row,sw,tw,language,'en','explicit-labeled-translation-group',{'raw_label':g['label'],'source_lines':g['line_spans'],'system':'native ATF; no biblical verse-number conversion'},
   {'literal_credit_statements':credits,'translator':'Not separated from edition creators unless source explicitly states role'},
   {'method':'Explicit source translation range only; many source lines to one English block','word_alignment':False,'uncertainty':'Restorations, lacunae, notes and competing readings retained in raw ATF; no semantic validation'},'structural-translation-candidate')
 for i,reason in enumerate(failures):defer(db,run,row['id'],'translation-group-'+str(i),reason)
 if not groups:defer(db,run,row['id'],'no-supported-translation-groups')
 bind_source(db,run,row,context)

ADAPTERS={'historical-citation':historical,'lexicon':lexicon,'oracc-json':oracc_json,'oracc-atf':oracc_atf}
