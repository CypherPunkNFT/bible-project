"""Full owned-population referential and canonical-identity checks."""
import json
from pathlib import Path
from .inputs import OUT,BASE,read,supplement_entities
from ..jobs import JobStore
from ..build import readonly,dump
from ..inputs import packed

def main(acquired_shared=None):
 shared=acquired_shared or JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3')
 try:
  if acquired_shared is None:shared.acquire()
  active=read(OUT/'active-run.json');run=active['run_id'];db=readonly(Path(active['database']))
  missing=db.execute('''select count(*) from language_alignments a left join witnesses s on s.id=a.source_witness left join witnesses t on t.id=a.target_witness where a.run_id=? and (s.id is null or t.id is null or s.run_id!=a.run_id or t.run_id!=a.run_id or s.scope_id!=a.scope_id or t.scope_id!=a.scope_id)''',(run,)).fetchone()[0]
  invalid=db.execute('select count(*) from witnesses where run_id=? and (start<0 or end<start or end-start!=length(text))',(run,)).fetchone()[0]
  badhistory=db.execute('''select count(*) from historical_links h left join witnesses w on w.id=h.witness_id where h.run_id=? and (w.id is null or h.run_id!=w.run_id or h.scope_id!=w.scope_id)''',(run,)).fetchone()[0]
  allowed={r['id'] for r in read(OUT/'inputs/entities.json')}|{r['id'] for r in supplement_entities()}|{r['id'] for r in read(OUT/'inputs/resources.json')}
  for r in read(OUT/'inputs/citations.json'):allowed.update([r['source_id'],r['claim_id']])
  unknown=[r[0] for r in db.execute('select distinct entity_id from historical_links where run_id=?',(run,)) if r[0] not in allowed]
  jobs=[dict(r) for r in db.execute('''select j.state,count(*) n from jobs j join run_jobs r on r.job_id=j.id where r.run_id=? group by j.state''',(run,))]
  orphan=db.execute('''select count(*) from run_jobs r join jobs j on j.id=r.job_id left join checkpoints c on c.job_id=j.id where r.run_id=? and (j.state!='succeeded' or c.job_id is null)''',(run,)).fetchone()[0]
  expected=len(read(OUT/'inputs/scope.json'));actual=db.execute('select count(*) from results where run_id=?',(run,)).fetchone()[0]
  result={'run_id':run,'eligible_jobs':expected,'completed_results':actual,'dangling_or_mixed_alignment_witnesses':missing,'invalid_witness_bounds':invalid,'dangling_historical_witnesses':badhistory,'invented_canonical_entity_ids':unknown,'incomplete_or_uncheckpointed_jobs':orphan,'job_states':jobs,'sqlite_quick_check':db.execute('pragma quick_check').fetchone()[0]}
  result['passed']=expected==actual and not any((missing,invalid,badhistory,unknown,orphan)) and result['sqlite_quick_check']=='ok';dump(OUT/'integrity-verification.json',result);db.close();assert result['passed'];print(packed(result))
 finally:
  if acquired_shared is None:shared.close()
if __name__=='__main__':main()
