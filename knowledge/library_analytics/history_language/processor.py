"""KR-140 isolated native operator: prepare, calibrate, run/resume and query."""
import argparse,collections,json,os,sys,time
from pathlib import Path
from .inputs import OUT,BASE,read,freeze,pin_sources,checked,owners,supplement_entities
from .contract import VERSION,SCHEMA,SRUN,ARUN,CRITERIA
from .adapters import ADAPTERS,defer
from ..jobs import JobStore,StaleInput,background_priority,process_identity
from ..build import readonly,dump,now
from ..inputs import digest,packed
from ..concept_index import filehash

def semantics(selection):
 code={p.name:filehash(p) for p in [Path(__file__),Path(__file__).with_name('adapters.py'),Path(__file__).with_name('contract.py'),Path(__file__).with_name('inputs.py'),Path(__file__).with_name('evaluation.py'),Path(__file__).with_name('scripture_entities.py'),Path(__file__).parents[1]/'jobs.py']}
 return {'processor':VERSION,'selection':selection,'scope_sha256':filehash(OUT/'inputs/scope.json'),'criteria':CRITERIA,'code':code,'vectors':None,'public':False,'global_latest_promotion':False}

def context(selection):
 sections=readonly(Path(selection['parents'][0]['database']));alignment=readonly(Path(selection['parents'][1]['database']));sources=collections.defaultdict(list)
 # One linear capture of selected descriptors; all per-document location queries use indexes.
 for r in sections.execute('select document_id,descriptor_json from research_scope where run_id=? and disposition=?',(SRUN,'supported')):
  d=json.loads(r['descriptor_json']);path=d.get('source_path');sha=d.get('original_sha256')
  if path and sha:sources[(path,sha)].append(r['document_id'])
  x=d.get('xml_link') or {}
  if x.get('asset_path'):sources[(x['asset_path'],x['asset_sha256'])].append(r['document_id'])
 return {'sections':sections,'alignment':alignment,'source_docs':sources,'entities':entity_dictionary(),'relations':read(OUT/'inputs/relations.json')}

def entity_dictionary():
 """Registry-selected entities plus the curated Scripture supplement, as one list of distinct ids.

 The two sources share a namespace name, so an id in both would silently double every mention link
 for it and collide on the historical_links primary key. That is a real ambiguity, not something to
 resolve by picking a winner.
 """
 registry=read(OUT/'inputs/entities.json');supplement=supplement_entities();seen={r['id'] for r in registry}
 clash=sorted(r['id'] for r in supplement if r['id'] in seen)
 if clash:raise StaleInput('Registry and curated supplement both define entity ids: '+', '.join(clash[:5]))
 return registry+supplement

def validate_inputs(rows,selection):
 for p in selection['parents']:
  if filehash(p['summary'])!=p['summary_sha256'] or filehash(Path(p['release'])/'release_manifest.json')!=p['manifest_sha256']:raise StaleInput('Pinned release changed')
 checked_count=0
 for r in rows:
  for p in r['paths']:
   if p.get('error'):continue
   raw,sha=checked(p['path'],p['sha256']);checked_count+=1
 return checked_count

def counts(db,run):
 tables=['scope','results','witnesses','historical_links','dates','language_alignments','source_annotations','section_bindings','dependencies','deferrals','evaluation_cases']
 return {t:db.execute('select count(*) from '+t+' where run_id=?',(run,)).fetchone()[0] for t in tables}

def process_row(db,run,row,ctx):
 start=time.monotonic()
 errors=[p for p in row['paths'] if p.get('error')]
 if errors:defer(db,run,row['id'],'frozen-source-unavailable-or-changed',errors);state='deferred'
 else:
  for p in row['paths']:
   checked(p['path'],p['sha256'])
   db.execute('insert or ignore into dependencies values(?,?,?,?,?)',(run,row['id'],p['path'],p['sha256'],p['size']))
  ADAPTERS[row['adapter']](db,run,row,ctx)
  for p in row['paths']:checked(p['path'],p['sha256'])
  state='processed'
 c={t:db.execute('select count(*) from '+t+' where run_id=? and scope_id=?',(run,row['id'])).fetchone()[0] for t in ['witnesses','historical_links','language_alignments']}
 db.execute('insert into results values(?,?,?,?,?)',(run,row['id'],state,packed(c),time.monotonic()-start))
 return sum(c.values())

def run(mode,resume=False,limit=None,new_generation=False,acquired_shared=None):
 background_priority();OUT.mkdir(parents=True,exist_ok=True);start=time.monotonic();shared=acquired_shared or JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3');store=None;ctx=None
 dump(OUT/'owner-observation.json',{'time':now(),'analytics_owners':owners(),'requested':mode})
 attempt={'time':now(),'mode':mode,'resume':resume,'limit':limit,'pid':os.getpid(),'process_token':process_identity(os.getpid())}
 try:
  if acquired_shared is None:shared.acquire()
  selection=freeze();rows=pin_sources()
  if mode=='prepare':
   from .evaluation import freeze_cases
   freeze_cases(rows);print(packed({'prepared':True,'counts':selection['counts'],'scope':len(rows)}));return
  from .evaluation import freeze_cases
  freeze_cases(rows)
  contract=semantics(selection);contract['fixtures_sha256']=filehash(OUT/'inputs/quality-cases.json')
  cal=mode=='calibrate';rid='kr140-'+digest(contract)[:24]+('-calibration' if cal else '')
  active=OUT/('calibration-active.json' if cal else 'active-run.json')
  if active.exists() and read(active)['run_id']!=rid and not new_generation:raise StaleInput('Code/input generation differs from active run; preserve prior outputs and explicitly use --new-generation')
  if not cal:
   cfile=OUT/'calibration-result.json'
   if not cfile.exists() or read(cfile)['contract_sha256']!=digest(contract) or not read(cfile)['passed']:raise RuntimeError('Matching passing development calibration required')
  selected=rows
  if cal:
   selected=[r for r in rows if r['adapter'] in ('historical-citation','lexicon','oracc-atf') or int(digest(r['id'])[:8],16)%97==0]
  validate_inputs(rows,selection);shared.heartbeat()
  store=JobStore(OUT/'history-language.sqlite3');store.acquire();db=store.db;db.executescript(SCHEMA)
  prior=db.execute('select * from hl_runs where id=?',(rid,)).fetchone()
  if prior and prior['state']=='population-complete':
   print(packed({'run_id':rid,'unchanged':True,'counts':counts(db,rid)}));return
  if prior and not resume:raise RuntimeError('Incomplete generation requires --resume')
  dump(active,{'run_id':rid,'database':str(store.path),'contract_sha256':digest(contract)})
  with db:db.execute('insert or ignore into hl_runs values(?,?,?,NULL)',(rid,packed(contract),'running'))
  ctx=context(selection);shared.heartbeat()
  dump(OUT/'launch.json',{'pid':os.getpid(),'process_token':process_identity(os.getpid()),'time':now(),'command':[sys.executable,'-X','utf8','-m',__spec__.name,*sys.argv[1:]],'cwd':str(Path.cwd()),'run_id':rid})
  for offset in range(0,len(selected),16):
   batch=selected[offset:offset+16]
   if limit:batch=batch[:max(0,limit-offset)]
   if not batch:break
   work=[];records=[]
   with db:
    for row in batch:
     fp=digest(row);job=digest({'run':rid,'scope':row['id'],'input':fp});records.append((rid,job,'history-language',row['id'],fp,VERSION))
     db.execute('insert or ignore into scope values(?,?,?,?)',(rid,row['id'],row['adapter'],packed(row)))
     work.append((job,lambda conn,row=row:process_row(conn,rid,row,ctx)))
   store.register_many(records);outcomes=store.execute_many(work)
   if any(v in ('failed','stale') for v in outcomes.values()):
    errors=[dict(r) for r in db.execute("select j.scope,j.state,j.error from jobs j join run_jobs r on r.job_id=j.id where r.run_id=? and j.state in ('failed','stale')",(rid,))];dump(OUT/'errors.json',errors);raise RuntimeError(packed(errors[:10]))
   if offset%128==0 or offset+len(batch)>=len(selected) or limit:
    progress={'run_id':rid,'phase':'processing','visited':offset+len(batch),'eligible':len(selected),'seconds_this_attempt':round(time.monotonic()-start,3),'counts':counts(db,rid),'pid':os.getpid(),'process_token':process_identity(os.getpid())}
    dump(OUT/'progress.json',progress);print(packed(progress),flush=True);shared.heartbeat()
   if (limit and offset+len(batch)>=limit) or (OUT/'cancel.request').exists():
    with db:db.execute("update hl_runs set state='interrupted' where id=?",(rid,))
    return
  validate_inputs(rows,selection);shared.heartbeat()
  c=counts(db,rid);integrity=db.execute('pragma quick_check').fetchone()[0]
  if integrity!='ok' or c['results']!=len(selected):raise RuntimeError('Population accounting/integrity failed')
  from .evaluation import evaluate
  quality=evaluate(db,rid,development_only=cal)
  passed=all(x['passed'] for x in quality['adapters'].values())
  summary={'run_id':rid,'state':'population-complete','contract_sha256':digest(contract),'counts':c,'eligible':len(selected),'quality':quality,'seconds_this_attempt':time.monotonic()-start,'integrity':integrity,'scope_by_adapter':[dict(r) for r in db.execute('select adapter,count(*) n from scope where run_id=? group by adapter',(rid,))],'failures':0,'passed':passed,'releases_promoted':False}
  with db:db.execute('update hl_runs set state=?,summary_json=? where id=?',('population-complete',packed(summary),rid))
  dump(OUT/('calibration-result.json' if cal else 'population-result.json'),summary);dump(OUT/'progress.json',summary);print(packed(summary),flush=True)
 finally:
  attempt.update(seconds=time.monotonic()-start)
  with (OUT/'attempts.jsonl').open('a',encoding='utf-8') as stream:stream.write(packed(attempt)+'\n')
  if ctx:ctx['sections'].close();ctx['alignment'].close()
  if store:store.close()
  if acquired_shared is None:shared.close()

def query(term,kind='all',limit=10):
 active=read(OUT/'active-run.json');run=active['run_id'];db=readonly(Path(active['database']));result={'run_id':run,'term':term,'historical':[],'language':[]}
 if kind in ('all','history'):
  result['historical']=[dict(r) for r in db.execute('''select h.*,w.path,w.asset_sha256,w.coordinate,w.locator,w.start,w.end,w.text from historical_links h join witnesses w on w.id=h.witness_id where h.run_id=? and (h.entity_id=? or w.text like ?) order by h.state,h.id limit ?''',(run,term,'%'+term+'%',limit))]
 if kind in ('all','language'):
  result['language']=[dict(r) for r in db.execute('''select a.*,s.path,s.asset_sha256,s.locator source_locator,s.start source_start,s.end source_end,s.text source_text,t.locator target_locator,t.start target_start,t.end target_end,t.text target_text from language_alignments a join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where a.run_id=? and (s.text=? or t.text like ? or a.numbering_json like ?) order by a.relation,a.id limit ?''',(run,term,'%'+term+'%','%'+term+'%',limit))]
 for group in ('historical','language'):
   for r in result[group]:
    r['section_bindings']=[dict(b) for b in db.execute('select * from section_bindings where run_id=? and scope_id=? limit 5',(run,r['scope_id']))]
    r['deferrals']=[dict(b) for b in db.execute('select reason,record_json from deferrals where run_id=? and scope_id=? limit 10',(run,r['scope_id']))]
 db.close();return result

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--prepare',action='store_true');p.add_argument('--calibrate',action='store_true');p.add_argument('--run',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--new-generation',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--status',action='store_true');p.add_argument('--query');p.add_argument('--kind',choices=['all','history','language'],default='all');a=p.parse_args()
 if a.query:print(packed(query(a.query,a.kind)))
 elif a.status:print(packed({'owners':owners(),'progress':read(OUT/'progress.json') if (OUT/'progress.json').exists() else None}))
 else:run('prepare' if a.prepare else 'calibrate' if a.calibrate else 'population',a.resume,a.limit,a.new_generation)
if __name__=='__main__':main()
