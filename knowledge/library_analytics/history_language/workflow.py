"""One manual foreground serialized run, with bounded lease waiting; no scheduler."""
import sys,time,argparse
from .inputs import OUT,BASE,owners,read
from .processor import run
from ..jobs import JobStore
from ..inputs import packed

def proof(stage):
 from . import recovery_proof
 old=sys.argv;sys.argv=['recovery_proof',stage]
 try:recovery_proof.main()
 finally:sys.argv=old

def blocking(observed):
 """Rows that genuinely hold the lease: a live owner, or one that cannot be inspected.

 A row left behind by a dead process is exactly what JobStore.acquire() recovers safely, so treating
 every row as blocking would wait out the whole limit for a lease nobody holds.
 """
 return [r for r in observed if r['observed_token']=='unknown' or r['observed_token']==r['process_token']]

def lease(wait_seconds):
 """Wait for the existing global lease to free. Never forces, and never opens the shared store for
 writing while an owner is live -- constructing a JobStore writes to it."""
 start=time.monotonic();announced=0.0
 while True:
  held=blocking(owners())
  if not held:
   candidate=JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3')
   try:candidate.acquire();return candidate
   except RuntimeError:candidate.close()
  waited=time.monotonic()-start
  if waited>=wait_seconds:raise RuntimeError('Lease wait limit reached; existing owner preserved')
  if waited-announced>=30 or not announced:
   announced=waited;print(packed({'phase':'waiting-for-global-lease','owners':held,'seconds':round(waited)}),flush=True)
  time.sleep(5)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--new-generation',action='store_true')
 parser.add_argument('--wait-seconds',type=int,default=900);args=parser.parse_args()
 shared=lease(args.wait_seconds)
 try:
  run('prepare',acquired_shared=shared)
  run('calibrate',resume=True,new_generation=args.new_generation,acquired_shared=shared)
  calibration=read(OUT/'calibration-result.json')
  if not calibration['passed']:raise RuntimeError('Calibration failed; inspect development cases')
  active=OUT/'active-run.json'
  # The checkpoint and resume receipts must describe this generation. An earlier generation's pointer
  # and capture files are not this run's evidence, so the stages are gated on the contract identity.
  started=active.exists() and read(active)['contract_sha256']==calibration['contract_sha256']
  if not started:
   run('population',limit=16,new_generation=args.new_generation,acquired_shared=shared);proof('checkpoint')
  run('population',resume=True,new_generation=args.new_generation,acquired_shared=shared)
  checkpoint=OUT/'checkpoint-before.json'
  if checkpoint.exists() and read(checkpoint)['run_id']==read(active)['run_id']:proof('resumed')
  proof('complete');run('population',resume=True,new_generation=args.new_generation,acquired_shared=shared);proof('idempotent')
 finally:shared.close()
if __name__=='__main__':main()
