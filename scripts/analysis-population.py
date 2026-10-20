"""Read-only, bounded browsing of the three retained analytical populations.

JSON request on stdin, JSON response on stdout. Never runs a processor or writes a store.
Cursor order is stored identity, not relevance. Historical generation pins are deliberate.
"""
from pathlib import Path
import sys,json,sqlite3,time,re,hashlib
SITE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import resolve_segment,text_hash

BASE=SITE.parent/'KnowledgeBase/library-knowledge/connected-research'
PINS={'kr110':'kr110-54f0bfca9b30da6cc49b2347','kr120':'kr120-66a741ba22a7025744d3b98d','joint':'kr120-joint-cd46d0e4e3023ae1fcf41938','kr140':'kr140-3092a59f7c3f691bb7cdf4f9'}
connections=[]
started=time.monotonic()
def db(rel):
 c=sqlite3.connect((BASE/rel).as_uri()+'?mode=ro',uri=True,timeout=2);c.row_factory=sqlite3.Row
 c.execute('PRAGMA query_only=ON');c.execute('PRAGMA cache_size=-16384');c.execute('PRAGMA temp_store=MEMORY')
 c.set_progress_handler(lambda:time.monotonic()-started>14,10000);connections.append(c);return c
def read(rel):return json.loads((BASE/rel).read_text('utf-8'))
def clean(v):
 if isinstance(v,dict):return {k:clean(x) for k,x in v.items() if k not in ('path','paths','source_path','cache_path','sourcePath','extractedPath','private','source_registry')}
 if isinstance(v,list):return [clean(x) for x in v]
 if isinstance(v,str) and ('FortressOfSolitude' in v or '\\Users\\' in v):return 'Private source file'
 return v
def number(v,default=0):
 try:n=int(v or default)
 except (ValueError,TypeError):raise ValueError('Invalid numeric identifier')
 if n<0:raise ValueError('Invalid numeric identifier')
 return n
def term(v):return str(v or '').strip()[:200]
def cur(p,default):
 if not p.get('cursor'):return default
 v=json.loads(p['cursor'])
 if not isinstance(v,list) or len(v)!=len(default):raise ValueError('Invalid cursor')
 return v
def window_meta(c,wid):
 r=c.execute('SELECT w.*,d.author_label,d.language,d.work_id,d.edition_id,d.descriptor_json FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=? AND w.run_id=?',(wid,PINS['kr110'])).fetchone()
 if not r:raise ValueError('Source window not in the selected generation')
 return dict(r)
def summary(r):
 d=json.loads(r['descriptor_json'])
 return {'id':str(r['id']),'title':d.get('title') or r['document_id'],'author':r['author_label'] or 'Author unrecorded','language':r['language'],'state':r['state'],'kind':r['kind'],'workId':r['work_id'],'editionId':r['edition_id']}
def source(c,s,wid):
 r=window_meta(c,number(wid));d=json.loads(r['descriptor_json'])
 span=s.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(r['version_id'],r['segment_ordinal'])).fetchone()
 if not span:raise ValueError('Selected source segment unavailable')
 span=dict(span);body=resolve_segment(span,{})
 a,b=r['start']-span['start'],r['end']-span['start'];literal=body[a:b]
 if not 0<=a<b<=len(body) or text_hash(literal)!=r['text_sha256']:raise ValueError('Source has changed; saved window hash no longer matches')
 h=s.execute('SELECT heading FROM sections WHERE version_id=?',(r['version_id'],)).fetchone()
 readers=d.get('readers',[])
 return {**summary(r),'heading':h[0] if h else '', 'text':literal,'context':body[max(0,a-500):min(len(body),b+500)],'locator':span.get('locator') or 'Recorded source segment','start':r['start'],'end':r['end'],'sha256':r['text_sha256'],'sourceId':r['document_id'],'credits':list(dict.fromkeys(x['credit'] for x in readers if x.get('credit'))),'cautions':list(dict.fromkeys(x['reviewWarning'] for x in readers if x.get('reviewWarning'))),'licences':list(dict.fromkeys(x['licence'] for x in readers if x.get('licence'))),'reader':next(('/teachers/works/'+x['id'] for x in readers if x.get('id')),None),'attribution':'Source metadata is not sentence-level speaker or endorsement verification.'}
def windows(p,c):
 f='fts_kr110_54f0bfca9b30da6cc49b2347';args=[];where=['w.run_id=?'];args.append(PINS['kr110'])
 after=number(p.get('cursor'));where.append('f.rowid>?');args.append(after)
 q=term(p.get('q'))
 if q:
  words=re.findall(r'[^\W_]+',q,re.UNICODE)[:12]
  if not words:raise ValueError('Enter a word to search')
  where.append(f+' MATCH ?');args.append(' AND '.join('"'+w+'"' for w in words))
 for key,col in [('author','author_label'),('work','work_id'),('language','language')]:
  value=term(p.get(key))
  if value:
   if key=='author':where.append('instr(lower(COALESCE(d.author_label,\'\')),lower(?))>0')
   else:where.append('d.'+col+'=?')
   args.append(value)
 if term(p.get('title')):where.append("instr(lower(json_extract(d.descriptor_json,'$.title')),lower(?))>0");args.append(term(p['title']))
 if p.get('native')=='1':where.extend(["w.state!='candidate-unreviewed'","w.kind!='document-representation'"])
 if p.get('concept'):
  where.append('EXISTS(SELECT 1 FROM concept_occurrences o WHERE o.window_id=w.id AND o.concept_id=?)');args.append(term(p['concept']))
 if not q and (term(p.get('author')) or term(p.get('title')) or term(p.get('work'))):
  # Resolve small catalogue constraints first, then use windows_doc. Starting
  # from all window rowids would make a late-alphabet work expensive to reach.
  predicates=['d.run_id=?'];da=[PINS['kr110']]
  for key,col in [('author','author_label'),('title',None),('work','work_id'),('language','language')]:
   v=term(p.get(key))
   if not v:continue
   predicates.append("instr(lower(COALESCE(d.author_label,'')),lower(?))>0" if key=='author' else "instr(lower(json_extract(d.descriptor_json,'$.title')),lower(?))>0" if key=='title' else 'd.'+col+'=?');da.append(v)
  extras=''
  ea=[]
  if p.get('native')=='1':extras+=" AND w.state!='candidate-unreviewed' AND w.kind!='document-representation'"
  if p.get('concept'):extras+=' AND EXISTS(SELECT 1 FROM concept_occurrences o WHERE o.window_id=w.id AND o.concept_id=?)';ea.append(term(p['concept']))
  rows=c.execute('SELECT w.*,d.author_label,d.language,d.work_id,d.edition_id,d.descriptor_json FROM documents d CROSS JOIN windows w INDEXED BY windows_doc ON w.run_id=d.run_id AND w.document_id=d.document_id WHERE '+' AND '.join(predicates)+' AND w.id>?'+extras+' ORDER BY w.id LIMIT 21',[*da,after,*ea]).fetchall()
 elif not q and p.get('concept'):
  extra='';ea=[]
  if p.get('native')=='1':extra+=" AND w.state!='candidate-unreviewed' AND w.kind!='document-representation'"
  if p.get('language'):extra+=' AND d.language=?';ea.append(term(p['language']))
  rows=c.execute('SELECT w.*,d.author_label,d.language,d.work_id,d.edition_id,d.descriptor_json FROM (SELECT DISTINCT window_id FROM concept_occurrences WHERE concept_id=? AND window_id>?) o CROSS JOIN windows w ON w.id=o.window_id CROSS JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=?'+extra+' ORDER BY w.id LIMIT 21',[term(p['concept']),after,PINS['kr110'],*ea]).fetchall()
 else:
  rows=c.execute('SELECT w.*,d.author_label,d.language,d.work_id,d.edition_id,d.descriptor_json FROM '+f+' f CROSS JOIN windows w ON w.id=f.rowid CROSS JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE '+' AND '.join(where)+' ORDER BY f.rowid LIMIT 21',args).fetchall()
 return {'records':[summary(dict(r)) for r in rows[:20]],'next':str(rows[19]['id']) if len(rows)>20 else None,'order':'Stored window ID; exact word matching, not relevance ranking','query':q}
def pairs(p,c,r):
 channel=term(p.get('channel')) or 'wording'
 if channel not in ('wording','reference','reference-base'):raise ValueError('Choose wording or reference pairs')
 left,right=cur(p,[0,0]);left=number(left);right=number(right)
 seed=number(p.get('seed'));args=[]
 if seed:
  # Both endpoint directions use the existing primary/reverse indexes. Each arm is bounded.
  table='joint_pairs' if channel=='reference' else 'pair_evidence';run=PINS['joint'] if channel=='reference' else PINS['kr120'];extra=" AND channel='"+('wording' if channel=='wording' else 'reference')+"'" if channel!='reference' else ''
  a=r.execute('SELECT DISTINCT left_window,right_window FROM '+table+' WHERE run_id=? AND left_window=? AND (left_window,right_window)>(?,?)'+extra+' ORDER BY left_window,right_window LIMIT 21',(run,seed,left,right)).fetchall()
  reverse='joint_pairs_right' if channel=='reference' else 'pairs_right'
  b=r.execute('SELECT DISTINCT left_window,right_window FROM '+table+' INDEXED BY '+reverse+' WHERE run_id=? AND right_window=? AND (left_window,right_window)>(?,?)'+extra+' ORDER BY left_window,right_window LIMIT 21',(run,seed,left,right)).fetchall()
  rows=sorted(set(tuple(x) for x in [*a,*b]))[:21]
 else:
  table='joint_pairs' if channel=='reference' else 'pair_evidence';run=PINS['joint'] if channel=='reference' else PINS['kr120'];extra=" AND channel='"+('wording' if channel=='wording' else 'reference')+"'" if channel!='reference' else ''
  rows=[tuple(x) for x in r.execute('SELECT DISTINCT left_window,right_window FROM '+table+' WHERE run_id=? AND (left_window,right_window)>(?,?)'+extra+' ORDER BY left_window,right_window LIMIT 21',(run,left,right))]
 out=[]
 for a,b in rows[:20]:
  aa=summary(window_meta(c,a));bb=summary(window_meta(c,b));out.append({'id':str(a)+':'+str(b),'title':aa['title']+' ↔ '+bb['title'],'author':aa['author']+' · '+bb['author'],'left':aa,'right':bb,'channel':channel,'state':'Unreviewed candidate'})
 return {'records':out,'next':json.dumps(rows[19]) if len(rows)>20 else None,'order':'Unique endpoint pairs in stored ID order; no influence or agreement inferred','channel':channel}
def pair_detail(p,c,r,s):
 a,b=sorted(number(x) for x in str(p['id']).split(':'))
 evidence=[dict(x) for x in r.execute('SELECT channel,feature,left_start,left_end,right_start,right_end,left_hash,right_hash FROM pair_evidence WHERE run_id=? AND left_window=? AND right_window=?',(PINS['kr120'],a,b))]
 joint=[json.loads(x[0]) for x in r.execute('SELECT feature FROM joint_pairs WHERE run_id=? AND left_window=? AND right_window=?',(PINS['joint'],a,b))]
 if not evidence and not joint:raise ValueError('Pair not present in the selected generation')
 aa=source(c,s,a);bb=source(c,s,b)
 for e in evidence:
  for side,w in [('left',aa),('right',bb)]:
   lit=w['text'][e[side+'_start']-w['start']:e[side+'_end']-w['start']]
   if text_hash(lit)!=e[side+'_hash']:raise ValueError('Pair witness hash mismatch')
   e[side+'_literal']=lit
   if e['channel']=='wording' and not w.get('highlight'):w['highlight']=lit
 return {'id':str(a)+':'+str(b),'left':aa,'right':bb,'evidence':evidence,'sharedReferenceGroups':joint,'outcome':'Unreviewed candidate','note':'This pair comes from the full stored population. It has no inherited usefulness judgment unless separately present in the saved review. A match is a lead to inspect, not an established quotation or influence.'}
def languages(p,h):
 scope,rowid=cur(p,['',0]);rowid=number(rowid)
 where=['a.run_id=?','(a.scope_id,a.rowid)>(?,?)'];args=[PINS['kr140'],str(scope),rowid]
 family=term(p.get('family'))
 if family=='hebrew':where.append('a.scope_id=?');args.append('lexicon:HebrewStrong.xml')
 elif family=='aramaic':where.append('a.scope_id=?');args.append('lexicon:LexicalIndex.xml')
 elif family=='oracc':where.append("a.scope_id>='resource:' AND a.scope_id<'resource;' ")
 elif family not in ('','all'):raise ValueError('Invalid language collection')
 if term(p.get('scope')):where.append('a.scope_id=?');args.append(term(p['scope']))
 if term(p.get('language')):where.append('a.source_language=?');args.append(term(p['language']))
 q=term(p.get('q')).casefold();rows=[];scanned=0;exhausted=False;last=[scope,rowid]
 # There is no retained full-text index over the language table. Search bounded
 # indexed portions and return a continuation, never a false corpus-wide zero.
 sql='SELECT a.rowid rid,a.id,a.scope_id,a.relation,a.source_language,a.numbering_json,w.text original,t.text aid,w.locator FROM language_alignments a INDEXED BY languages_scope CROSS JOIN witnesses w ON w.id=a.source_witness AND w.run_id=a.run_id CROSS JOIN witnesses t ON t.id=a.target_witness AND t.run_id=a.run_id WHERE '+' AND '.join(where)+' ORDER BY a.scope_id,a.rowid LIMIT ?'
 while len(rows)<20 and time.monotonic()-started<7:
  args[1:3]=last;batch=h.execute(sql,[*args,512 if q else 21]).fetchall()
  for r in batch:
   last=[r['scope_id'],r['rid']];scanned+=1
   if not q or q in (r['original']+' '+r['aid']+' '+r['numbering_json']).casefold():rows.append(r)
   if len(rows)>=20:break
  if len(rows)>=20:break
  if len(batch)<(512 if q else 21):exhausted=True;break
 continuation=None if exhausted else json.dumps(last)
 return {'records':[{'id':r['id'],'title':r['original'][:140]+' → '+r['aid'][:180],'author':r['scope_id'],'scope':r['scope_id'],'language':r['source_language'],'relation':r['relation'],'state':'Source annotation','preview':r['aid'][:300],'cursor':json.dumps([r['scope_id'],r['rid']])} for r in rows],'next':continuation,'scanned':scanned,'searchIncomplete':bool(q and continuation),'order':'Source collection and stored row order; English aids are editorial glosses, not certified translations'}
def language_detail(p,h):
 a=h.execute('SELECT * FROM language_alignments WHERE id=? AND run_id=?',(term(p['id']),PINS['kr140'])).fetchone()
 if not a:raise ValueError('Language record not in the selected generation')
 a=dict(a);out={'id':a['id'],'relation':a['relation'],'scope':a['scope_id'],'outcome':'Source annotation','note':'Recorded editorial connection. Specialist contextual interpretation has not been established for this record.','record':json.loads(a['record_json']),'credits':json.loads(a['credits_json']),'numbering':json.loads(a['numbering_json'])}
 for side,key,lang in [('source','source_witness','source_language'),('target','target_witness','target_language')]:
  w=h.execute('SELECT * FROM witnesses WHERE id=? AND run_id=?',(a[key],PINS['kr140'])).fetchone()
  if not w or text_hash(w['text'])!=w['text_sha256']:raise ValueError('Stored witness hash mismatch')
  out[side]={'id':w['id'],'text':w['text'],'title':a['scope_id'],'language':a[lang],'locator':w['locator'],'start':w['start'],'end':w['end'],'sha256':w['text_sha256'],'sourceId':w['resource_id'],'credits':[out['credits'].get('scope','')],'attribution':'Saved editorial witness; hash check covers the stored text, not fresh verification of the original asset.'}
 return out
def main(p):
 track=p.get('track');action=p.get('action','list')
 if track not in ('kr110','kr120','kr140'):raise ValueError('Unknown retained analysis')
 if action not in ('list','detail','sources','facets'):raise ValueError('Unknown browse action')
 c=db('concepts/concepts.sqlite3') if track in ('kr110','kr120') else None
 if track=='kr110':
  if read('concepts/population.json')['run_id']!=PINS[track]:raise ValueError('Selected concepts changed; browser needs explicit rebind')
  if action=='facets':return {'concepts':[x[0] for x in c.execute('SELECT DISTINCT concept_id FROM rules WHERE run_id=? ORDER BY concept_id',(PINS[track],))]}
  if action=='detail':
   s=db('sections.sqlite3');w=source(c,s,p['id']);occ=[dict(x) for x in c.execute('SELECT concept_id,literal,basis,ambiguity,start,end FROM concept_occurrences WHERE window_id=?',(number(p['id']),))];refs=[dict(x) for x in c.execute('SELECT book,first,last,literal,reference_kind,start,end FROM reference_occurrences WHERE window_id=?',(number(p['id']),))]
   out={'source':w,'concepts':occ,'references':refs,'outcome':'Unreviewed candidate','note':'Located lexical/reference index record; this is not a generated answer or a quality-reviewed conclusion.'}
  else:out=windows(p,c)
 elif track=='kr120':
  if read('relationships/population.json')['run_id']!=PINS[track] or read('relationships/joint-population.json')['run_id']!=PINS['joint']:raise ValueError('Selected relationships changed; browser needs explicit rebind')
  r=db('relationships/relationships.sqlite3')
  if action=='detail':out=pair_detail(p,c,r,db('sections.sqlite3'))
  elif action=='sources':out=windows({**p,'native':'1'},c)
  else:out=pairs(p,c,r)
 else:
  if read('history-language/population-result.json')['run_id']!=PINS[track]:raise ValueError('Selected history generation changed; browser needs explicit rebind')
  h=db('history-language/history-language.sqlite3');out=language_detail(p,h) if action=='detail' else languages(p,h)
 return clean({**out,'run':PINS[track],'seconds':round(time.monotonic()-started,3),'review':'Population candidates are not quality judgments'})
if __name__=='__main__':
 try:
  p=json.load(sys.stdin);out=main(p);print(json.dumps(out,ensure_ascii=False,separators=(',',':')))
 except Exception as e:
  message='Search exceeded the bounded query budget. Narrow the source, author, language or collection.' if isinstance(e,sqlite3.OperationalError) and 'interrupted' in str(e) else str(e)
  print(json.dumps({'error':clean(message)},ensure_ascii=False));sys.exit(1)
 finally:
  for c in connections:c.close()
