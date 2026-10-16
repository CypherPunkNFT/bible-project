"""One manually invoked verification/export batch, respecting the global lease."""
import argparse,time
from .inputs import OUT,BASE,owners
from ..jobs import JobStore
from ..inputs import packed

def main():
 p=argparse.ArgumentParser();p.add_argument('--checks',action='store_true');a=p.parse_args();start=time.monotonic();shared=None
 for attempt in range(180):
  observed=owners()
  if observed:
   if attempt%6==0:print(packed({'phase':'waiting-for-global-lease','owners':observed,'seconds':round(time.monotonic()-start)}),flush=True)
   time.sleep(5);continue
  candidate=JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3')
  try:candidate.acquire();shared=candidate;break
  except RuntimeError:candidate.close();time.sleep(5)
 if shared is None:raise RuntimeError('Lease wait limit reached; existing owner preserved')
 try:
  from . import integrity,release,examples
  integrity.main(acquired_shared=shared);shared.heartbeat();release.witnesses();shared.heartbeat();examples.main()
 finally:shared.close()
if __name__=='__main__':main()
