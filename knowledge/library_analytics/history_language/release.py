"""Deterministic private exports and immutable verification; no latest pointer."""
import argparse,gzip,hashlib,json,os,shutil,time
from pathlib import Path
from .inputs import BASE,OUT,read,checked
from .processor import validate_inputs
from .evaluation import resolve_witness
from ..jobs import JobStore,background_priority
from ..build import readonly,dump
from ..inputs import packed
from ..concept_index import filehash

TABLES=['hl_runs','scope','results','dependencies','witnesses','historical_links','dates','language_alignments','source_annotations','section_bindings','deferrals','evaluation_cases','run_jobs','jobs','job_attempts','checkpoints']

def verify(folder):
 manifest=read(folder/'release_manifest.json');files=[]
 for f in manifest['files']:
  p=folder/f['path'];assert p.stat().st_size==f['bytes'] and filehash(p)==f['sha256'],str(p)
  if f['path'].endswith('.jsonl.gz'):
   with gzip.open(p,'rt',encoding='utf-8') as stream:count=sum(1 for line in stream)
   assert count==f['rows'],f['path']
  files.append(f['path'])
 return {'verified':True,'files':len(files),'bytes':sum(f['bytes'] for f in manifest['files']),'run_id':manifest['run_id']}

def export(acquired_shared=None):
 background_priority();start=time.monotonic();active=read(OUT/'active-run.json');run=active['run_id'];folder=OUT/'releases'/run
 shared=acquired_shared or JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3');store=None
 try:
  if acquired_shared is None:shared.acquire()
  store=JobStore(active['database']);store.acquire();db=store.db
  result=read(OUT/'population-result.json')
  if result['run_id']!=run or result['state']!='population-complete':raise ValueError('Incomplete generation')
  contract=json.loads(db.execute('select contract_json from hl_runs where id=?',(run,)).fetchone()[0])
  for name,sha in contract['code'].items():
   source=Path(__file__).parents[1]/name if name=='jobs.py' else Path(__file__).parent/name
   if filehash(source)!=sha:raise ValueError('Processing implementation changed since the selected generation: '+name)
  validate_inputs(read(OUT/'inputs/scope.json'),read(OUT/'inputs/selection.json'))
  if (folder/'release_manifest.json').exists():
   receipt=verify(folder);receipt['unchanged']=True;dump(OUT/'release-verification.json',receipt);print(packed(receipt));return
  folder.mkdir(parents=True,exist_ok=True);files=[]
  for table in TABLES:
   p=folder/(table+'.jsonl.gz');temp=p.with_suffix(p.suffix+'.part');n=0
   cols=[r['name'] for r in db.execute('pragma table_info('+table+')')];primary=[r['name'] for r in sorted(db.execute('pragma table_info('+table+')'),key=lambda r:r['pk']) if r['pk']]
   order=','.join(primary) or ','.join(cols)
   with temp.open('wb') as raw:
    with gzip.GzipFile(filename='',mode='wb',fileobj=raw,mtime=0,compresslevel=5) as stream:
     where='id=?' if table=='hl_runs' else 'run_id=?'
     if table in ('jobs','job_attempts','checkpoints'):
      column='id' if table=='jobs' else 'job_id'
      where=column+' in (select job_id from run_jobs where run_id=?)'
     for row in db.execute('select * from '+table+' where '+where+' order by '+order,(run,)):
      stream.write((packed(dict(row))+'\n').encode('utf-8'));n+=1
   os.replace(temp,p);files.append({'path':p.name,'bytes':p.stat().st_size,'sha256':filehash(p),'rows':n});shared.heartbeat();print(packed({'exported':table,'rows':n}),flush=True)
  # Retain actual frozen inputs, evaluation and exact implementation source.
  for source in [*(OUT/'inputs').glob('*.json'),OUT/'population-result.json',OUT/'population-quality.json',OUT/'calibration-result.json',OUT/'calibration-quality.json',OUT/'attempts.jsonl',OUT/'content-review.json',OUT/'source-verification.json',OUT/'integrity-verification.json',OUT/'coverage.json',OUT/'located-examples.json',OUT/'resumed-proof.json',OUT/'idempotent-proof.json',OUT/'focused-tests.json',OUT/'focused-tests.log',OUT/'environment.json',OUT/'coordinator-reconciliation.json',OUT/'HANDOFF.md',OUT/'RESULT.md',*Path(__file__).parent.glob('*.py'),*Path(__file__).parent.glob('*.sql'),Path(__file__).parent/'README.md',Path(__file__).parents[1]/'jobs.py']:
   if not source.exists():continue
   sub='code' if source.suffix=='.py' else 'inputs' if source.parent.name=='inputs' else 'receipts'
   dest=folder/sub/source.name;dest.parent.mkdir(exist_ok=True);shutil.copyfile(source,dest)
   files.append({'path':dest.relative_to(folder).as_posix(),'bytes':dest.stat().st_size,'sha256':filehash(dest)})
  schema=folder/'schema.sql';schema.write_text('\n'.join(r[0]+';' for r in db.execute("select sql from sqlite_master where sql is not null order by type,name")),encoding='utf-8');files.append({'path':schema.name,'bytes':schema.stat().st_size,'sha256':filehash(schema)})
  dump(folder/'release_manifest.json',{'run_id':run,'scope':'KR-140 private source annotations and structural alignment; no semantic/historical truth promotion','parent_runs':read(OUT/'inputs/selection.json')['parents'],'files':files,'public':False,'latest_promoted':False})
  receipt=verify(folder);receipt.update(seconds=time.monotonic()-start);dump(OUT/'release-verification.json',receipt);print(packed(receipt))
 finally:
  if store:store.close()
  if acquired_shared is None:shared.close()

def witnesses():
 active=read(OUT/'active-run.json');db=readonly(Path(active['database']));cache={};counts={};failures=[]
 for kind in ['unicode-codepoint-file','xml-node-text','json-string','html-pre-text']:
  n=0
  # Independent hash sample, plus all historical/translation witnesses.
  sampling=" and substr(id,-3) in ('000','001','002','003')" if kind in ('xml-node-text','json-string') else ''
  for w in db.execute('select * from witnesses where run_id=? and coordinate=?'+sampling+' order by path,locator',(active['run_id'],kind)):
   try:resolve_witness(w,cache);n+=1
   except Exception as exc:failures.append({'witness':w['id'],'error':str(exc)})
  counts[kind]=n
 receipt={'run_id':active['run_id'],'witnesses_reconstructed':counts,'failures':failures,'passed':not failures};dump(OUT/'source-verification.json',receipt);db.close();print(packed(receipt))

def main():
 p=argparse.ArgumentParser();p.add_argument('--verify',action='store_true');p.add_argument('--witnesses',action='store_true');a=p.parse_args()
 if a.witnesses or a.verify:
  shared=JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3')
  try:
   shared.acquire()
   if a.witnesses:witnesses()
   else:print(packed(verify(OUT/'releases'/read(OUT/'active-run.json')['run_id'])))
  finally:shared.close()
 else:export()
if __name__=='__main__':main()
