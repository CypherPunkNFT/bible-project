"""One finite authorized KR-130 execution, serialized by existing interfaces."""
import argparse,json,os,time,traceback
from .inputs import ROOT,read,write_json,lease_status
from .processor import run
from .verify import verify
from .checkpoint_proof import snapshot
from ..jobs import process_identity
from ..jobs import JobStore
from ..build import PROJECT
from pathlib import Path

def serialized(label,action):
    printed_at=0;prior_owners=None
    while True:
        held=lease_status()
        if any(r['live_identity']=='unknown' or r['live_identity']==r['process_token'] for r in held):
            write_json(ROOT/'operator-state.json',{'phase':label,'state':'waiting-for-global-lease','pid':os.getpid(),'process_token':process_identity(os.getpid()),'owner':held,'updated_at_unix':time.time()})
            owners=[r['pid'] for r in held]
            if owners!=prior_owners or time.time()-printed_at>=60:
                print(json.dumps({'phase':label,'waiting_for_owner':owners}),flush=True);printed_at=time.time();prior_owners=owners
            time.sleep(5);continue
        try:
            write_json(ROOT/'operator-state.json',{'phase':label,'state':'running','pid':os.getpid(),'process_token':process_identity(os.getpid()),'updated_at_unix':time.time()})
            return action()
        except RuntimeError as exc:
            if 'Analytics coordinator already owned by PID' not in str(exc):raise
            time.sleep(5)

def proof(prefix,complete=False):
    before=ROOT/(prefix+'-interruption-snapshot.json');b=read(before);after=snapshot(b['run_id'],b['documents']);same=b==after
    result={'run_id':b['run_id'],'actual_interrupted_committed_documents':len(b['documents']),'committed_prefix_unchanged':same,'before':b,'after':after,'completed_repeat_checked':complete,'scope':'Actual selected-generation checkpoint/resume; no cross-generation reuse, scheduler or restart claim.'}
    write_json(ROOT/(prefix+'-resume-proof.json'),result)
    if not same:raise RuntimeError('Committed facts/attempts changed across resume')

def checkpoint_snapshot(prefix):
    lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        lease.acquire();p=read(ROOT/'progress.json');value=snapshot(p['run_id']);write_json(ROOT/(prefix+'-interruption-snapshot.json'),value)
    finally:lease.close()

def checkpoint_verify(prefix,complete=False):
    lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:lease.acquire();proof(prefix,complete)
    finally:lease.close()

def archive_previous_receipts():
    # Explicit changed-condition generation only. Source facts and jobs remain
    # in the versioned DB. Preserve exact prior receipts before changing the
    # private working receipts; no shared/latest pointer is involved.
    previous=read(ROOT/'progress.json').get('run_id','no-population') if (ROOT/'progress.json').exists() else 'no-population'
    folder=ROOT/'generation-receipts'/(previous+'-'+str(time.time_ns()));folder.mkdir(parents=True,exist_ok=True)
    names=['progress.json','calibration.json','calibration-verification.json','calibration-interruption-snapshot.json','calibration-resume-proof.json','population.json','population-verification.json','population-interruption-snapshot.json','population-resume-proof.json','population-nonempty-interruption-snapshot.json','population-nonempty-resume-proof.json','resource-receipt.json']
    copied=[]
    for name in names:
        path=ROOT/name
        if not path.exists():continue
        raw=path.read_bytes();target=folder/name;target.write_bytes(raw)
        if target.read_bytes()!=raw:raise RuntimeError('Prior receipt preservation failed')
        path.unlink();copied.append(name)
    write_json(folder/'change.json',{'previous_run_id':previous,'preserved_receipts':copied,'reason':'Explicit new processor/dependency/reconstruction-policy generation; no cross-generation fact reuse.','source_facts_and_jobs_retained':True})

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--new-generation',action='store_true',help='Explicit changed-condition calibration generation; no old fact reuse');args=parser.parse_args()
    started=time.time()
    try:
        if args.new_generation:archive_previous_receipts()
        if not (ROOT/'calibration.json').exists():
            if not (ROOT/'calibration-interruption-snapshot.json').exists():
                serialized('calibration-interruption',lambda:run(True,not args.new_generation,16));serialized('calibration-snapshot',lambda:checkpoint_snapshot('calibration'))
            serialized('calibration-resume',lambda:run(True,True));serialized('calibration-resume-proof',lambda:checkpoint_verify('calibration'))
        if not (ROOT/'calibration-verification.json').exists():serialized('calibration-verification',lambda:verify(True))
        if not (ROOT/'population.json').exists():
            if not (ROOT/'population-interruption-snapshot.json').exists():
                serialized('population-interruption',lambda:run(False,not args.new_generation,62000));serialized('population-snapshot',lambda:checkpoint_snapshot('population'))
            serialized('population-resume',lambda:run(False,True));serialized('population-resume-proof',lambda:checkpoint_verify('population'))
        serialized('completed-population-idempotence',lambda:run(False,True));serialized('completed-idempotence-proof',lambda:checkpoint_verify('population',True))
        if not (ROOT/'population-verification.json').exists():serialized('population-verification',lambda:verify(False))
        write_json(ROOT/'operator-state.json',{'phase':'population-and-verification-delivered','state':'complete','pid':os.getpid(),'process_token':process_identity(os.getpid()),'started_at_unix':started,'finished_at_unix':time.time(),'no_public_integration':True,'next':'Private located queries and immutable exports in same task; do not start another KR stage.'})
        print('KR-130 population and verification complete',flush=True)
    except Exception as exc:
        write_json(ROOT/'operator-state.json',{'state':'failed','error':str(exc),'pid':os.getpid(),'process_token':process_identity(os.getpid()),'started_at_unix':started,'failed_at_unix':time.time()});raise
if __name__=='__main__':main()
