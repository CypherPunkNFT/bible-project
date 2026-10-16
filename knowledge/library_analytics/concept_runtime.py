"""Summarize persisted runtime receipts without acquiring or modifying writer state."""
from collections import defaultdict
from datetime import datetime,timezone
import json
from .concept_index import root,read
from .build import readonly,dump,now
from .inputs import packed

def main():
    folder=root();population=read(folder/'population.json');run=population['run_id']
    attempts={}
    for line in (folder/'concept-run.log').read_text('utf-8',errors='replace').splitlines():
        try:r=json.loads(line)
        except ValueError:continue
        if r.get('run_id')!=run or not r.get('process_token'):continue
        key=(r['pid'],r['process_token']);old=attempts.get(key,{})
        if r.get('seconds_this_attempt',0)>=old.get('seconds_this_attempt',0):attempts[key]=r
    launch=read(folder/'cache-profile-launch.json');last=(launch['pid'],launch['process_token'])
    if last in attempts:attempts[last]['seconds_this_attempt']=population['seconds_this_attempt']
    values=[]
    for (pid,token),r in attempts.items():
        values.append({'pid':pid,'process_token':token,
            'process_started_at':datetime.fromtimestamp((int(token)-116444736000000000)/10000000,timezone.utc).isoformat(),
            'observed_attempt_seconds':r.get('seconds_this_attempt',0),'last_observed_documents':r.get('documents'),
            'last_observed_characters':r.get('characters')})
    db=readonly(folder/'concepts.sqlite3')
    try:
        processing=db.execute('SELECT sum(seconds) FROM document_results WHERE run_id=?',(run,)).fetchone()[0]
    finally:db.close()
    samples=[json.loads(s) for s in (folder/'resource-samples.jsonl').read_text('utf-8').splitlines()]
    samples=[s for s in samples if s.get('progress',{}).get('run_id')==run and s.get('process')]
    value={'run_id':run,'recorded_at':now(),'attempts':values,
        'observed_attempt_seconds_lower_bound':sum(r['observed_attempt_seconds'] for r in values),
        'committed_document_processing_seconds':processing,
        'peak_observed_rss_bytes':max((s['process']['rss'] for s in samples),default=None),
        'bytes':{p.name:p.stat().st_size for p in folder.glob('concepts.sqlite3*')},
        'limits':'Attempt receipts are sampled; interruption tails may be absent. Database bytes include preserved development/calibration generations. Memory is sampled, not a continuous peak. Excludes other-generation calibration and development costs.'}
    dump(folder/'runtime.json',value);print(packed(value))

if __name__=='__main__':main()
