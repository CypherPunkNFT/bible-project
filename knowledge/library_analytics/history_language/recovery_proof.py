"""Read-only receipts for actual checkpoint resume and completed-run idempotence."""
import argparse,hashlib,json
from pathlib import Path
from .inputs import OUT,read
from .processor import counts
from ..build import readonly,dump
from ..inputs import packed

def capture(db,run,scopes=None):
 jobs=[dict(r) for r in db.execute('''select j.id,j.scope,j.state,j.attempts,c.completed_at,c.rows from jobs j join run_jobs r on r.job_id=j.id left join checkpoints c on c.job_id=j.id where r.run_id=? and j.state='succeeded' order by j.scope''',(run,))]
 if scopes is None:scopes=[r['scope'] for r in jobs[:16]]
 hashes={}
 for scope in scopes:
  h=hashlib.sha256()
  for table in ['results','witnesses','historical_links','dates','language_alignments','source_annotations','section_bindings','dependencies','deferrals','evaluation_cases']:
   cols=[r['name'] for r in db.execute('pragma table_info('+table+')')];order=','.join(cols)
   for row in db.execute('select * from '+table+' where run_id=? and scope_id=? order by '+order,(run,scope)):h.update((table+packed(dict(row))+'\n').encode('utf-8'))
  hashes[scope]=h.hexdigest()
 return {'run_id':run,'counts':counts(db,run),'succeeded_jobs':jobs,'scope_hashes':hashes}

def main():
 p=argparse.ArgumentParser();p.add_argument('stage',choices=['checkpoint','resumed','complete','idempotent']);a=p.parse_args();active=read(OUT/'active-run.json');run=active['run_id'];db=readonly(Path(active['database']))
 if a.stage in ('checkpoint','complete'):
  value=capture(db,run);dump(OUT/(a.stage+'-before.json'),value);print(packed({'recorded':a.stage,'jobs':len(value['succeeded_jobs']),'counts':value['counts']}))
 else:
  previous=read(OUT/('checkpoint-before.json' if a.stage=='resumed' else 'complete-before.json'));assert previous['run_id']==run
  current=capture(db,run,list(previous['scope_hashes']));byid={r['id']:r for r in current['succeeded_jobs']}
  unchanged_jobs=all(byid.get(r['id'])==r for r in previous['succeeded_jobs']);unchanged_facts=previous['scope_hashes']==current['scope_hashes']
  receipt={'run_id':run,'stage':a.stage,'prior_successful_jobs':len(previous['succeeded_jobs']),'current_successful_jobs':len(current['succeeded_jobs']),'successful_job_receipts_unchanged':unchanged_jobs,'committed_facts_unchanged':unchanged_facts,'counts_unchanged':previous['counts']==current['counts'],'passed':unchanged_jobs and unchanged_facts and (a.stage=='resumed' or previous['counts']==current['counts'])}
  dump(OUT/(a.stage+'-proof.json'),receipt);assert receipt['passed'];print(packed(receipt))
 db.close()
if __name__=='__main__':main()
