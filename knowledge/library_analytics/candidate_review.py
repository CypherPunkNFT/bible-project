"""Durable owner curation over immutable analytical evidence; no public writer.

The database is authoritative. JSON/Markdown are atomic, rebuildable annotations.
Approvals bind to proposal + evidence fingerprints and never alter source judgments.
"""
from pathlib import Path
from contextlib import contextmanager
import argparse,hashlib,importlib.util,json,sqlite3,sys,time,uuid
from datetime import datetime,timezone
from .jobs import JobStore,StaleInput

SITE=Path(__file__).resolve().parents[2]
PROJECT=SITE.parent
VERSION='candidate-curation-v1'
SCHEMA='''
CREATE TABLE IF NOT EXISTS proposals(id TEXT,fingerprint TEXT,data_json TEXT,created_at TEXT,PRIMARY KEY(id,fingerprint));
CREATE TABLE IF NOT EXISTS items(id TEXT PRIMARY KEY,fingerprint TEXT,revision INTEGER,status TEXT,origin TEXT,seed_fingerprint TEXT,ordinal INTEGER,note TEXT,destination TEXT,integration_evidence TEXT,created_at TEXT,updated_at TEXT);
CREATE TABLE IF NOT EXISTS source_refs(candidate_id TEXT,fingerprint TEXT,track TEXT,run_id TEXT,kind TEXT,source_key TEXT,source_sha TEXT,PRIMARY KEY(candidate_id,fingerprint,track,run_id,kind,source_key));
CREATE INDEX IF NOT EXISTS curation_source_lookup ON source_refs(track,run_id,kind,source_key);
CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY,id TEXT UNIQUE,request_id TEXT,candidate_id TEXT,fingerprint TEXT,revision INTEGER,action TEXT,actor TEXT,from_status TEXT,to_status TEXT,note TEXT,destination TEXT,integration_evidence TEXT,at TEXT);
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,payload_sha TEXT,response_json TEXT);
CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE IF NOT EXISTS discovery_cursors(recipe TEXT PRIMARY KEY,cursor TEXT,exhausted INTEGER,visited INTEGER,batches INTEGER,updated_at TEXT);
'''
STATES=('discovered','pending','approved','needs_work','rejected','integrated','stale')
PINS={'kr110':'kr110-54f0bfca9b30da6cc49b2347','kr120':'kr120-66a741ba22a7025744d3b98d','kr140':'kr140-3092a59f7c3f691bb7cdf4f9'}
def packed(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha(v):return hashlib.sha256((v if isinstance(v,str) else packed(v)).encode()).hexdigest()
def now():return datetime.now(timezone.utc).isoformat()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def atomic(p,v):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);b=(v if isinstance(v,str) else packed(v)+'\n').encode('utf-8')
 if p.exists() and p.read_bytes()==b:return
 tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_bytes(b);tmp.replace(p)
class ReviewError(Exception):
 def __init__(self,message,status=422):super().__init__(message);self.status=status

class Curation:
 def __init__(self,site=SITE,root=None,shared=None):
  self.site=Path(site);self.project=self.site.parent
  self.root=Path(root) if root else self.project/'KnowledgeBase/library-knowledge/connected-research/curation'
  self.path=self.root/'curation.sqlite3'
  self.shared=Path(shared) if shared else self.project/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3'
  self.catalog=self.site/'.local/data-analysis/website-candidates.json';self.fail_before_checkpoint=False
 def ro(self):
  if not self.path.exists():return None
  c=sqlite3.connect(self.path.as_uri()+'?mode=ro',uri=True,timeout=3);c.row_factory=sqlite3.Row;c.execute('PRAGMA query_only=ON');return c
 @contextmanager
 def writer(self):
  common=JobStore(self.shared);store=None
  try:
   common.acquire();store=JobStore(self.path);store.acquire();store.db.executescript(SCHEMA);yield store
  except RuntimeError as e:
   if 'owned by PID' in str(e):raise ReviewError('An analytics writer owns the lease. Nothing was changed; retry after it finishes.',409) from e
   raise
  finally:
   if store:store.close()
   common.close()
 def catalog_data(self):
  d=read(self.catalog)
  if d['selectedRuns']!=PINS:raise ReviewError('The candidate catalogue uses different analysis generations. Reconcile the evidence before syncing.',409)
  return d
 def fingerprint(self,c):
  return sha({k:v for k,v in c.items() if k not in ('_review','reviewState')})
 def seed_refs(self,c,cat):
  refs=[]
  def add(t,run,kind,key,h=''):
   if key:refs.append({'track':t,'run':run,'kind':kind,'key':str(key),'sha256':h})
  t=c.get('track')
  if t:
   for rid in c.get('records') or [c['record']]:add(t,cat['selectedRuns'][t],'review',rid)
  if c.get('origin')=='lk202':
   run=c['chapterGuide']['corpusBuild']
   for r in c['chapterGuide']['connections']:
    if r['relationship']=='located-exposition':add('lk202',run,'connection',r['id'],sha(r))
  elif t in ('kr110','kr120'):
   for p in c['sources']:
    add('kr110',PINS['kr110'],'window',p['id'],p.get('sha256',''))
    add('kr110',PINS['kr110'],'document',p.get('sourceId'),p.get('sha256',''))
   if t=='kr120':add('kr120',PINS['kr120'],'pair',':'.join(str(x) for x in sorted(int(p['id']) for p in c['sources'])))
  elif t=='kr140':
   fast=read(self.project/'KnowledgeBase/library-knowledge/connected-research/history-language/fast-located-examples.json')
   wanted=set(c.get('records') or [c['record']])
   for group in fast.values():
    for r in group.get('results',[]):
     if sha('kr140:'+r['id'])[:24] in wanted:add('kr140',PINS['kr140'],'language',r['id'])
  return refs
 def insert_version(self,db,c,refs,status,origin,ordinal,seed_fp='',previous=None,request_id='sync'):
  fp=self.fingerprint(c);stamp=now();rev=previous['revision']+1 if previous else 1
  db.execute('INSERT OR IGNORE INTO proposals VALUES(?,?,?,?)',(c['id'],fp,packed(c),stamp))
  db.execute('INSERT OR REPLACE INTO items VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(c['id'],fp,rev,status,origin,seed_fp,ordinal,previous['note'] if previous else '',previous['destination'] if previous else c.get('placement',''),'',previous['created_at'] if previous else stamp,stamp))
  db.executemany('INSERT OR IGNORE INTO source_refs VALUES(?,?,?,?,?,?,?)',[(c['id'],fp,r['track'],r['run'],r['kind'],r['key'],r.get('sha256','')) for r in refs])
  self.event(db,request_id,c['id'],fp,rev,'invalidate' if previous else 'created','system',previous['status'] if previous else '',status,'Evidence/proposal changed; prior decision retained in history.' if previous else 'Added to curation.',previous['destination'] if previous else c.get('placement',''),'')
 def event(self,db,req,id,fp,revision,action,actor,before,after,note,destination,evidence):
  db.execute('INSERT INTO events(id,request_id,candidate_id,fingerprint,revision,action,actor,from_status,to_status,note,destination,integration_evidence,at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(uuid.uuid4().hex,req,id,fp,revision,action,actor,before,after,note,destination,evidence,now()))
 def item(self,db,id):
  r=db.execute('SELECT i.*,p.data_json FROM items i JOIN proposals p ON p.id=i.id AND p.fingerprint=i.fingerprint WHERE i.id=?',(id,)).fetchone()
  if not r:raise ReviewError('Unknown curation candidate',404)
  return r
 def mutate(self,p):
  request_id=p.get('requestId','')
  if not isinstance(request_id,str) or not 8<=len(request_id)<=100:raise ReviewError('A valid request identity is required')
  payload_sha=sha(p);old=self.ro()
  if old:
   try:prior=old.execute('SELECT * FROM requests WHERE id=?',(request_id,)).fetchone()
   finally:old.close()
   if prior:
    if prior['payload_sha']!=payload_sha:raise ReviewError('Request identity was already used for a different action',409)
    return json.loads(prior['response_json'])
  with self.writer() as store:
   job=sha({'version':VERSION,'request':request_id});store.register(VERSION,job,'candidate-curation',p['action'],payload_sha,VERSION);errors=[]
   def write(db):
    try:
     # Recheck after ownership to close the concurrent duplicate-request race.
     prior=db.execute('SELECT * FROM requests WHERE id=?',(request_id,)).fetchone()
     if prior:
      if prior['payload_sha']!=payload_sha:raise ReviewError('Request identity collision',409)
      return 0
     result=self.dispatch(db,p)
     db.execute('INSERT INTO requests VALUES(?,?,?)',(request_id,payload_sha,packed(result)))
     if self.fail_before_checkpoint:raise RuntimeError('Injected interruption before checkpoint')
     return result.get('changed',1)
    except Exception as e:errors.append(e);raise
   result=store.execute(job,write,retry_failed=True)
   if result not in ('completed','skipped'):raise errors[0] if errors else ReviewError('Curation transaction failed')
   response=json.loads(store.db.execute('SELECT response_json FROM requests WHERE id=?',(request_id,)).fetchone()[0])
   try:self.export(store.db)
   except (OSError,ReviewError) as e:
    # The SQLite transaction already committed. Never tell the caller it was
    # rolled back merely because a rebuildable presentation export failed.
    response={**response,'committed':True,'warning':'Decision committed in the review ledger; annotation exports need rebuilding. Refresh or synchronize the queue.'}
   return response
 def dispatch(self,db,p):
  action=p['action']
  if action=='sync':
   cat=self.catalog_data();changed=0
   for n,c in enumerate(cat['candidates']):
    fp=self.fingerprint(c);old=db.execute('SELECT * FROM items WHERE id=?',(c['id'],)).fetchone()
    if old and old['seed_fingerprint']==fp:continue
    refs=self.seed_refs(c,cat);status='stale' if old and old['status'] not in ('pending','discovered') else 'pending'
    self.insert_version(db,c,refs,status,'seed',n,fp,old,p['requestId']);changed+=1
   current={c['id'] for c in cat['candidates']}
   for old in db.execute("SELECT * FROM items WHERE origin='seed'").fetchall():
    if old['id'] not in current and old['status']!='stale':
     db.execute("UPDATE items SET status='stale',revision=revision+1,updated_at=? WHERE id=?",(now(),old['id']))
     self.event(db,p['requestId'],old['id'],old['fingerprint'],old['revision']+1,'removed-from-catalog','system',old['status'],'stale','Source proposal removed from current catalogue.',old['destination'],'');changed+=1
   db.execute('INSERT OR REPLACE INTO metadata VALUES(?,?)',('catalog_sha',sha(cat)))
   db.execute('INSERT OR REPLACE INTO metadata VALUES(?,?)',('fingerprint_version','full-proposal-v1'))
   return {'ok':True,'changed':changed,'message':'Catalogue synchronized; existing owner decisions retained for unchanged proposals.'}
  if action in ('decide','prepare'):
   selected=(db.execute("SELECT value FROM metadata WHERE key='catalog_sha'").fetchone() or [''])[0]
   method=(db.execute("SELECT value FROM metadata WHERE key='fingerprint_version'").fetchone() or [''])[0]
   if selected!=sha(self.catalog_data()) or method!='full-proposal-v1':raise ReviewError('The source catalogue changed. Refresh and synchronize before deciding.',409)
   old=self.item(db,p.get('id',''))
   if p.get('expectedRevision')!=old['revision'] or p.get('fingerprint')!=old['fingerprint']:raise ReviewError('This proposal changed in another tab. Refresh before deciding.',409)
   c=json.loads(old['data_json']);note=str(p.get('note',''))[:4000];destination=str(p.get('destination') or old['destination'])[:500]
   if action=='prepare':
    edits=p.get('proposal',{})
    if not isinstance(edits,dict) or set(edits)-{'title','finding','benefit','placement','next','limits','family'}:raise ReviewError('Invalid proposal fields')
    c.update({k:str(v).strip() for k,v in edits.items()})
    if len(c.get('title',''))<8 or len(c.get('finding',''))<40 or len(c.get('benefit',''))<20 or len(c.get('placement',''))<5:raise ReviewError('Supply a clear title, source-backed explanation, visitor benefit and website placement before review.')
    refs=[{'track':r['track'],'run':r['run_id'],'kind':r['kind'],'key':r['source_key'],'sha256':r['source_sha']} for r in db.execute('SELECT * FROM source_refs WHERE candidate_id=? AND fingerprint=?',(old['id'],old['fingerprint']))]
    self.insert_version(db,c,refs,'pending',old['origin'],old['ordinal'],old['seed_fingerprint'],old,p['requestId'])
    db.execute('UPDATE items SET note=?,destination=? WHERE id=?',(note,c['placement'],old['id']))
    # The edit is an owner preparation, never an automatic approval.
    db.execute("UPDATE events SET action='prepared',actor='owner',note=? WHERE request_id=? AND candidate_id=?",(note,p['requestId'],old['id']))
    return {'ok':True,'id':old['id'],'status':'pending','changed':1}
   status=p.get('status');evidence=str(p.get('integrationEvidence',''))[:4000]
   if status not in ('pending','approved','needs_work','rejected','integrated'):raise ReviewError('Invalid owner decision')
   if old['status']=='discovered' and status in ('approved','integrated'):raise ReviewError('Prepare this discovery with an explanation and website purpose before approving it.')
   if status=='integrated':
    if old['status']!='approved':raise ReviewError('Only the currently approved proposal can be marked integrated.')
    if not destination.startswith('/') or destination.startswith('//') or not evidence.strip():raise ReviewError('Record a site path and integration evidence (changed files or verification receipt).')
   if status=='approved' and (not c.get('finding') or not c.get('benefit')):raise ReviewError('The proposal needs a source-backed explanation and visitor benefit.')
   if old['status']==status and old['note']==note and old['destination']==destination and old['integration_evidence']==evidence:return {'ok':True,'id':old['id'],'status':status,'changed':0}
   rev=old['revision']+1
   db.execute('UPDATE items SET status=?,revision=?,note=?,destination=?,integration_evidence=?,updated_at=? WHERE id=?',(status,rev,note,destination,evidence if status=='integrated' else '',now(),old['id']))
   self.event(db,p['requestId'],old['id'],old['fingerprint'],rev,'decision','owner',old['status'],status,note,destination,evidence if status=='integrated' else '')
   return {'ok':True,'id':old['id'],'status':status,'revision':rev,'changed':1,'message':'Approved for integration; publication is a separate action.' if status=='approved' else 'Decision saved.'}
  if action=='nominate':
   c,refs=self.fetch_candidate(p)
   return self.add_discovery(db,c,refs,p['requestId'])
  if action=='discover':return self.discover(db,p)
  raise ReviewError('Unknown curation action')
 def browser_module(self):
  name='_curation_population_browser';spec=importlib.util.spec_from_file_location(name,self.site/'scripts/analysis-population.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
 def fetch_candidate(self,p,module=None):
  t=p.get('track');kind=p.get('kind');key=str(p.get('key',''))
  if t not in PINS or kind not in ('window','pair','language','review'):raise ReviewError('Choose a supported analysis source')
  refs=[{'track':t,'run':PINS[t],'kind':kind,'key':key}];sources=[]
  if kind=='review':
   if len(key)!=24 or any(x not in '0123456789abcdef' for x in key):raise ReviewError('Invalid review identity')
   d=read(self.site/f'.local/data-analysis/{t}/details/{key}.json')
   if t=='kr110':sources=[x for x in d.get('modes',{}).get('concept',[]) if x.get('relevant')][:3] or d.get('modes',{}).get('concept',[])[:2]
   elif t=='kr120':sources=[d['left'],d['right']]
   elif d.get('source'):sources=[{**d[k],'id':key+':'+k,'title':d['title']} for k in ['source','target']]
   elif d.get('text'):sources=[{'id':key,'text':d['text'],'title':d['title'],'sha256':d.get('sha256'),'locator':d.get('locator'),'credits':[],'cautions':d.get('limits',[])}]
   else:raise ReviewError('This record has no source text to prepare. Date metadata alone is not a website content proposal.')
   title=d['title']
  else:
   m=module or self.browser_module()
   try:d=m.main({'track':t,'action':'detail','id':key})
   finally:
    for c in m.connections:c.close()
    m.connections=[]
   sources=[d['source']] if t=='kr110' else [d['left'],d['right']] if t=='kr120' else [d['source'],d['target']]
   title=sources[0].get('title') or sources[0]['text'][:100]
  if not sources:raise ReviewError('No located source text was available')
  for s in sources:
   text=s.get('text','')
   if not text:raise ReviewError('Source text is missing')
   if s.get('sha256') and sha(text)!=s['sha256']:raise ReviewError('Saved source text hash changed; reconcile it before curation.',409)
   s['excerpt']=text.strip()[:650]+('…' if len(text.strip())>650 else '');s['excerptSha256']=sha(s['excerpt'])
   if t in ('kr110','kr120') and str(s.get('id','')).isdigit():
    refs.append({'track':'kr110','run':PINS['kr110'],'kind':'window','key':str(s['id']),'sha256':s.get('sha256','')})
    if s.get('sourceId'):refs.append({'track':'kr110','run':PINS['kr110'],'kind':'document','key':s['sourceId'],'sha256':s.get('sha256','')})
  identity=sha({'refs':refs,'scope':p.get('purpose','')})[:24]
  candidate={'id':'discovery-'+identity,'track':t,'title':title[:250],'family':p.get('family') or ('Language aids' if t=='kr140' else 'Author comparisons' if t=='kr120' else 'Bible reading'),'priority':'Develop later','finding':'','benefit':'','placement':str(p.get('purpose',''))[:500],'format':'Prepare a coherent website item from the identified source evidence.','next':'Check the full context, attribution, edition and reading destination; write the explanation and visitor benefit before owner review.','limits':'Unreviewed discovery. A lexical/reference match is not an approved interpretation, quotation direction or source attribution.','scale':'Undetermined until this source selection forms a useful website item.','novelty':'Newly nominated source material; practical added value remains to be assessed.','sources':sources,'evidenceLinks':[{'href':f'/data_analysis/{t}/'+(f'?record={key}#record-detail' if kind=='review' else '#population-browser'),'label':'Open source analysis'}],'review':'Discovered through bounded CPU/source lookup; no usefulness or publication approval.'}
  return candidate,refs
 def add_discovery(self,db,c,refs,req):
  # Exact source marks and text identities prevent replay across mining recipes.
  source_refs=refs[:1]  # A different pair may legitimately reuse an already selected window.
  for r in source_refs:
   old=db.execute('SELECT i.id FROM source_refs s JOIN items i ON i.id=s.candidate_id AND i.fingerprint=s.fingerprint WHERE s.track=? AND s.run_id=? AND s.kind=? AND s.source_key=? LIMIT 1',(r['track'],r['run'],r['kind'],r['key'])).fetchone()
   if old:return {'ok':True,'id':old['id'],'changed':0,'duplicate':True}
  n=db.execute('SELECT coalesce(max(ordinal),0)+1 FROM items').fetchone()[0]
  self.insert_version(db,c,refs,'discovered','discovery',n,request_id=req)
  return {'ok':True,'id':c['id'],'status':'discovered','changed':1}
 def discover(self,db,p):
  t=p.get('track');q=str(p.get('q','')).strip()[:200]
  if t not in PINS or not q:raise ReviewError('Supply a narrow search and choose an analysis.')
  purpose=str(p.get('purpose','')).strip()[:500]
  if len(purpose)<5:raise ReviewError('State the intended website area or use before mining more material.')
  # Search windows to seed KR-120 links through the existing source browser;
  # full-pair discovery can also be nominated directly from the analysis desk.
  if t=='kr120':raise ReviewError('For passage pairs, use Add to discovery on a selected KR-120 pair. Search the source first in that desk.')
  recipe={k:p.get(k,'') for k in ('track','q','author','title','language','family','purpose')}
  recipe.update({'analysis_run':PINS[t],'discovery_version':VERSION,'query_implementation_sha256':hashlib.sha256((self.site/'scripts/analysis-population.py').read_bytes()).hexdigest()});key=sha(recipe)
  old=db.execute('SELECT * FROM discovery_cursors WHERE recipe=?',(key,)).fetchone()
  if old and old['exhausted']:return {'ok':True,'changed':0,'created':[],'visited':0,'exhausted':True,'message':'This search is exhausted in the selected historical population.'}
  m=self.browser_module();params={'track':t,'q':q,'author':p.get('author',''),'title':p.get('title',''),'language':p.get('language',''),'native':'1','cursor':old['cursor'] if old else ''}
  try:
   result=m.main(params);created=[];visited=0;last=params['cursor'];budget=4;exhausted=not result['next']
   for r in result['records']:
    visited+=1;last=str(r['id']) if t=='kr110' else r.get('cursor') or result.get('next') or last
    kind='window' if t=='kr110' else 'language'
    mapped=db.execute('SELECT 1 FROM source_refs s JOIN items i ON i.id=s.candidate_id AND i.fingerprint=s.fingerprint WHERE s.track=? AND s.run_id=? AND s.kind=? AND s.source_key=? LIMIT 1',(t,PINS[t],kind,str(r['id']))).fetchone()
    if mapped:continue
    c,refs=self.fetch_candidate({'track':t,'kind':kind,'key':r['id'],'purpose':purpose,'family':p.get('family','')},m)
    if t=='kr110':
     source=c['sources'][0]
     if source.get('author') in ('Author unrecorded','Chapel Library contributors') or len(source['text'])<160:continue
     from .concept_query import question_evidence_issue
     if question_evidence_issue(source.get('heading') or '',source['text']):continue
    c['discoveryIdentity']=recipe
    added=self.add_discovery(db,c,refs,p['requestId'])
    if added['changed']:created.append(added['id'])
    if len(created)>=budget:
     exhausted=False;break
   if visited==len(result['records']):last=result.get('next') or last
   # A language scan may have no matches in this portion but still continue.
   if not result['records'] and result.get('next'):last=result['next'];exhausted=False
   db.execute('INSERT OR REPLACE INTO discovery_cursors VALUES(?,?,?,?,?,?)',(key,last,int(exhausted),(old['visited'] if old else 0)+visited,(old['batches'] if old else 0)+1,now()))
   return {'ok':True,'changed':len(created),'created':created,'visited':visited,'exhausted':exhausted,'message':'New source drafts need preparation before owner approval.'}
  finally:
   for c in m.connections:c.close()
 def state_from(self,db,include_data=True):
  items=[]
  for r in db.execute('SELECT i.*,p.data_json FROM items i JOIN proposals p ON p.id=i.id AND p.fingerprint=i.fingerprint ORDER BY i.ordinal,i.id'):
   x=dict(r);data=json.loads(x.pop('data_json'));x['title']=data['title'];x['family']=data.get('family','');x['priority']=data.get('priority','Develop later')
   if include_data:x['data']=data
   items.append(x)
  counts={s:sum(x['status']==s for x in items) for s in STATES}
  return {'items':items,'counts':counts,'pendingBatchSize':6,'sequence':db.execute('SELECT coalesce(max(seq),0) FROM events').fetchone()[0],'catalogSha':(db.execute("SELECT value FROM metadata WHERE key='catalog_sha'").fetchone() or [''])[0]}
 def marks_from(self,db):
  result=[]
  for r in db.execute('SELECT s.*,i.status,i.revision,i.note,i.destination,i.updated_at,p.data_json FROM source_refs s JOIN items i ON i.id=s.candidate_id AND i.fingerprint=s.fingerprint JOIN proposals p ON p.id=i.id AND p.fingerprint=i.fingerprint ORDER BY s.track,s.kind,s.source_key'):
   data=json.loads(r['data_json']);result.append({'track':r['track'],'run':r['run_id'],'kind':r['kind'],'key':r['source_key'],'sourceSha256':r['source_sha'],'candidateId':r['candidate_id'],'title':data['title'],'status':r['status'],'revision':r['revision'],'fingerprint':r['fingerprint'],'note':r['note'],'destination':r['destination'],'at':r['updated_at'],'scope':'Selected evidence only; not whole-work approval.'})
  return result
 def get(self,view='state',id=None):
  db=self.ro()
  if not db:return {'items':[],'counts':{s:0 for s in STATES},'marks':[],'needsSync':True}
  try:
   if view=='marks':
    marks=self.marks_from(db);cat=self.catalog_data();current={c['id']:self.fingerprint(c) for c in cat['candidates']}
    changed={r['id'] for r in db.execute("SELECT id,seed_fingerprint FROM items WHERE origin='seed'") if current.get(r['id'])!=r['seed_fingerprint']}
    for m in marks:
     if m['candidateId'] in changed and m['status'] in ('approved','integrated'):
      m['status']='stale';m['staleReason']='Catalogue evidence/proposal changed; synchronization and owner re-review required.'
    return {'marks':marks,'needsSync':bool(changed)}
   if view=='history':return {'events':[dict(r) for r in db.execute('SELECT * FROM events WHERE candidate_id=? ORDER BY seq DESC LIMIT 100',(id,))]}
   result=self.state_from(db)
   method=(db.execute("SELECT value FROM metadata WHERE key='fingerprint_version'").fetchone() or [''])[0]
   result['needsSync']=result['catalogSha']!=sha(self.catalog_data()) or method!='full-proposal-v1'
   try:result['needsExport']=read(self.root/'latest-curation.json')['sequence']!=result['sequence']
   except (OSError,ValueError,KeyError):result['needsExport']=True
   return result
  finally:db.close()
 def export(self,db):
  state=self.state_from(db,False);marks=self.marks_from(db)
  atomic(self.root/'source-marks.json',{'schema':1,'sequence':state['sequence'],'marks':marks})
  approved=[x for x in state['items'] if x['status'] in ('approved','integrated')]
  work=[]
  for x in approved:
   data=json.loads(self.item(db,x['id'])['data_json']);work.append({**x,'proposal':data,'sourceMarks':[m for m in marks if m['candidateId']==x['id']]})
  atomic(self.root/'integration-queue.json',{'schema':1,'sequence':state['sequence'],'catalogSha':state['catalogSha'],'fingerprintVersion':'full-proposal-v1','scope':'Owner-approved integration work orders; not deployment authorization. Recheck current curation state and source dependencies before implementation.','items':work})
  lines=['# Owner curation and source mapping','',f"Event sequence: {state['sequence']}",'','These annotations concern selected evidence. Historical reports, evaluations and originals are unchanged. Approval means selected for integration; integration and public deployment are separate.','']
  for track in ('kr110','kr120','kr140','lk202'):
   subset=[m for m in marks if m['track']==track]
   lines.extend(['## '+track.upper(),''])
   for m in subset:
    lines.append(f"- **{m['status']}** · `{m['kind']}:{m['key']}` · {m['title']} · candidate `{m['candidateId']}` revision {m['revision']} · run `{m['run']}`")
   if not subset:lines.append('No mapped selections.')
   lines.append('')
  atomic(self.root/'SOURCE-REVIEW.md','\n'.join(lines)+'\n')
  atomic(self.root/'curation-state.json',state)
  # Content-addressed private snapshots accompany the event/proposal history.
  # They are exports, not a dependency-closed database backup or restore proof.
  names=['source-marks.json','integration-queue.json','SOURCE-REVIEW.md','curation-state.json']
  files=[{'name':name,'sha256':hashlib.sha256((self.root/name).read_bytes()).hexdigest(),'bytes':(self.root/name).stat().st_size} for name in names]
  manifest={'schema':1,'sequence':state['sequence'],'catalogSha':state['catalogSha'],'method':VERSION,'implementationSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'files':files,'backupRestoration':'not tested; these snapshots are not a full database backup'}
  identity='curation-release-'+sha(manifest)[:24];release=self.root/'releases'/identity;release.mkdir(parents=True,exist_ok=True)
  for f in files:
   target=release/f['name'];body=(self.root/f['name']).read_bytes()
   if target.exists() and target.read_bytes()!=body:raise ReviewError('Immutable curation export conflict; retain the database and inspect the release.',409)
   if not target.exists():atomic(target,body.decode('utf-8'))
  atomic(release/'manifest.json',manifest)
  atomic(self.root/'latest-curation.json',{'release':identity,'sequence':state['sequence'],'manifestSha256':hashlib.sha256((release/'manifest.json').read_bytes()).hexdigest()})

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=Path,help='Disposable test/restore root; never accepted from the web API');parser.add_argument('--shared',type=Path,help='Disposable shared lease for tests');a=parser.parse_args()
 service=Curation(root=a.root,shared=a.shared)
 try:
  p=json.load(sys.stdin)
  if p.get('action')=='get':result=service.get(p.get('view','state'),p.get('id'))
  else:result=service.mutate(p)
  print(packed(result))
 except Exception as e:
  message=str(e)
  if 'FortressOfSolitude' in message:message='A source dependency could not be read. Check the local operator log.'
  print(packed({'error':message,'status':getattr(e,'status',422)}));sys.exit(1)
if __name__=='__main__':main()
