"""Reproducible held-data calibration/population/equivalence candidate suite.

Serialized through existing leases; no intake, encoder, graph, public writer,
scheduler or production pointer. Re-running resumes the same frozen inputs.
"""
from collections import Counter
from contextlib import contextmanager
import json
import os
from pathlib import Path
import sqlite3
import sys
import threading
import time
import psutil
from .build import readonly
from .inputs import digest,packed
from .jobs import process_identity
from .refresh import ROOT,ownership,read_batch,perform,compare,release,validate_batch,affected
from .refresh_capture import frozen_write,code_identity,query_identity,runtime_identity
from .refresh_contract import atomic_json,hash_file,select_candidate,rollback_candidate,verify_export

def execute(call):
    # A competing owner is preserved. Wait only for the same live-owner lease
    # rejection, not arbitrary processor failures; operator can stop this
    # owned process without affecting another worker.
    waits=0
    while True:
        try:return call()
        except RuntimeError as exc:
            if 'Analytics coordinator already owned by PID' not in str(exc):raise
            if waits%15==0:print(packed({'phase':'waiting-for-global-lease','reason':str(exc)}),flush=True)
            waits+=1;time.sleep(2)

@contextmanager
def resources():
    stop=threading.Event();path=ROOT/('resources-'+str(os.getpid())+'.jsonl');p=psutil.Process()
    def sample():
        with path.open('a',encoding='utf-8') as f:
            while True:
                files={}
                for candidate in [ROOT/'refresh.sqlite3',ROOT/'refresh.sqlite3-wal',*list((ROOT/'query-stores').glob('*'))]:
                    try:files[str(candidate.relative_to(ROOT))]=candidate.stat().st_size
                    except OSError:pass
                f.write(packed({'time':time.time(),'rss':p.memory_info().rss,'cpu_seconds':sum(p.cpu_times()[:2]),'files':files})+'\n');f.flush()
                if stop.wait(10):break
    thread=threading.Thread(target=sample,daemon=True);thread.start()
    try:yield path
    finally:stop.set();thread.join()

def freeze_inputs():
    receipt=json.loads((ROOT/'capture.json').read_text('utf-8'));frozen=ROOT/'suite-inputs.json'
    current_code=code_identity();current_query=query_identity();current_runtime=runtime_identity()
    if frozen.exists():
        old=json.loads(frozen.read_text('utf-8'))
        target,_=read_batch(old['target']['path'])
        if target['config']['code']==current_code and target['config']['query_code']==current_query and target['config']['runtime']==current_runtime:return old
    out={}
    for label in ('baseline','target'):
        captured=receipt[label]
        if hash_file(captured['path'])!=captured['sha256']:raise ValueError('Capture bytes changed')
        value,_=read_batch(captured['path']);value['config']['code']=current_code;value['config']['query_code']=current_query;value['config']['runtime']=current_runtime
        value['config']['reader_code']=[{'path':p['path'],'sha256':hash_file(p['path'])} for p in value['config']['reader_code']]
        value['scope']['capture_semantic_sha256']=captured['semantic_sha256']
        validate_batch(value)
        out[label]=frozen_write(ROOT/'inputs'/('suite-'+label+'-'+digest(value)[:24]+'.json.gz'),value)
        if label=='target':target=value
    # Calibration covers each captured adapter/format/family and normalized
    # language stratum plus each XML asset, using deterministic source split.
    strata=Counter();chosen=[]
    for item in target['items']:
        d=item['descriptor'];key=(item['adapter'],Path(d.get('source_path','')).suffix,d.get('language'),d.get('source_family'),d.get('xml_link',{}).get('asset_path'))
        strata[key]+=1
        if strata[key]<=2:chosen.append(item)
    calibration={**target,'items':chosen,'scope':{**target['scope'],'type':'held source-stratified calibration','documents':len(chosen)}}
    out['calibration']=frozen_write(ROOT/'inputs'/('calibration-'+digest(calibration)[:24]+'.json.gz'),calibration)
    out['evaluation']={'reviewer_type':'deterministic native processor, source witness and clean rebuild equivalence; no human or model relevance judgments',
       'frozen_intents':120,'development':72,'reserved':48,'threshold':'all target document/stage objects, frequencies, pair rows and all frozen query results equal clean rebuild; no source/hash violations',
       'no_tuning':'Native extraction/ranking rules retained; original KR/LK judgments/splits are neither replaced nor promoted.','candidate_only':True}
    atomic_json(frozen,out);atomic_json(ROOT/'evaluation-frozen.json',out['evaluation']);return out

def committed_signature(run):
    db=readonly(ROOT/'refresh.sqlite3')
    try:
        members=[dict(r) for r in db.execute('SELECT * FROM membership WHERE run_id=? ORDER BY document_id,stage',(run,))]
        checks=[dict(r) for r in db.execute('SELECT j.id,j.attempts,c.completed_at,c.rows FROM run_jobs r JOIN jobs j ON j.id=r.job_id JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? ORDER BY j.id',(run,))]
        return {'membership':members,'checkpoints':checks,'sha256':digest([members,checks])}
    finally:db.close()

def main():
    started=time.monotonic();launch={'pid':os.getpid(),'process_token':process_identity(os.getpid()),'command':[sys.executable,*sys.argv],
        'cwd':str(Path.cwd()),'started_at':time.time(),'root':str(ROOT),'cpu_only':True}
    atomic_json(ROOT/'suite-launch.json',launch)
    with resources() as resource_path:
        def frozen():
            with ownership():return freeze_inputs()
        inputs=execute(frozen)
        calibration=execute(lambda:perform(ROOT,inputs['calibration']['path'],'clean'))
        if calibration['state']!='complete':raise RuntimeError('Calibration failed')
        baseline=execute(lambda:perform(ROOT,inputs['baseline']['path'],'clean'))
        # Establish a verified preceding candidate inside the owned root.
        base_release=execute(lambda:release(ROOT,baseline['run_id'],baseline['run_id']))
        def select_base():
            with ownership():select_candidate(ROOT,base_release)
        execute(select_base)
        pause_started=time.monotonic();paused=execute(lambda:perform(ROOT,inputs['target']['path'],'selective',baseline['run_id'],limit=32));pause_seconds=time.monotonic()-pause_started
        before=committed_signature(paused['run_id']);atomic_json(ROOT/'held-resume-before.json',before)
        selective=execute(lambda:perform(ROOT,inputs['target']['path'],'selective',baseline['run_id']))
        after=committed_signature(selective['run_id'])
        member_map={(r['document_id'],r['stage']):r for r in after['membership']};checkpoint_map={r['id']:r for r in after['checkpoints']}
        resume={'run_id':selective['run_id'],'committed_memberships':len(before['membership']),'committed_checkpoints':len(before['checkpoints']),
                'paused_attempt_seconds_including_lease_wait':pause_seconds,
                'same_memberships':all(member_map[(r['document_id'],r['stage'])]==r for r in before['membership']),
                'same_checkpoints_attempts':all(checkpoint_map[r['id']]==r for r in before['checkpoints'])}
        resume['ok']=resume['same_memberships'] and resume['same_checkpoints_attempts'];atomic_json(ROOT/'held-resume.json',resume)
        if not resume['ok']:raise RuntimeError('Held resume proof failed')
        clean=execute(lambda:perform(ROOT,inputs['target']['path'],'clean'))
        db=readonly(ROOT/'refresh.sqlite3')
        try:evaluation=compare(db,selective['run_id'],clean['run_id'])
        finally:db.close()
        atomic_json(ROOT/'held-equivalence.json',evaluation)
        if not evaluation['ok']:raise RuntimeError('Held selective/clean mismatch')
        candidate=execute(lambda:release(ROOT,selective['run_id'],clean['run_id']))
        def select_and_rollback():
            with ownership():
                first=select_candidate(ROOT,candidate);rollback=rollback_candidate(ROOT);second=select_candidate(ROOT,candidate)
                return {'selected':first['run_id'],'rollback':rollback['run_id'],'selected_again':second['run_id'],
                        'ok':first['run_id']==second['run_id'] and rollback['run_id']==baseline['run_id']}
        selection=execute(select_and_rollback);atomic_json(ROOT/'held-rollback.json',selection)
        final_before=committed_signature(selective['run_id']);summary_hash=hash_file(ROOT/('summary-'+selective['run_id']+'.json'))
        repeat=execute(lambda:perform(ROOT,inputs['target']['path'],'selective',baseline['run_id']))
        final_after=committed_signature(selective['run_id'])
        idempotence={'run_id':selective['run_id'],'same_facts_jobs_checkpoints':final_before['sha256']==final_after['sha256'],
                     'same_summary_bytes':hash_file(ROOT/('summary-'+selective['run_id']+'.json'))==summary_hash}
        idempotence['ok']=all(v for k,v in idempotence.items() if k!='run_id');atomic_json(ROOT/'held-idempotence.json',idempotence)
        verified=verify_export(candidate)
        atomic_json(ROOT/'suite-result.json',{'state':'complete','calibration':calibration,'baseline':baseline,'selective':selective,'clean':clean,
                    'equivalence':evaluation,'resume':resume,'selection':selection,'idempotence':idempotence,
                    'release':str(candidate),'export_files':len(verified['files']),'export_bytes':sum(p['bytes'] for p in verified['files']),
                    'resource_samples':str(resource_path),'seconds':time.monotonic()-started,'launch':launch})
        print(packed({'state':'complete','run_id':selective['run_id'],'release':str(candidate),'seconds':time.monotonic()-started}),flush=True)

if __name__=='__main__':main()
