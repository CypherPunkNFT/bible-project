"""Manually invoked closeout after queued checks; no scheduler or other stage."""
import time
from .inputs import OUT,BASE,read,owners
from ..jobs import JobStore
from ..inputs import packed
from ..build import dump

def main():
 required=['integrity-verification.json','source-verification.json','coverage.json','located-examples.json','content-review.json']
 for i in range(360):
  missing=[n for n in required if not (OUT/n).exists()]
  if not missing:break
  if i%6==0:print(packed({'phase':'waiting-for-owned-checks','missing':missing}),flush=True)
  time.sleep(5)
 else:raise RuntimeError('Owned checks did not finish within this invocation')
 assert read(OUT/'integrity-verification.json')['passed'] and read(OUT/'source-verification.json')['passed']
 from . import report,release
 report.main();shared=None
 for i in range(360):
  if owners():
   if i%6==0:print(packed({'phase':'waiting-for-global-export-lease','owners':owners()}),flush=True)
   time.sleep(5);continue
  candidate=JobStore(BASE/'library-analytics/pipeline/pipeline.sqlite3')
  try:candidate.acquire();shared=candidate;break
  except RuntimeError:candidate.close();time.sleep(5)
 if shared is None:raise RuntimeError('Export lease wait limit reached; owner preserved')
 try:
  release.export(acquired_shared=shared);release.export(acquired_shared=shared)
  receipt=read(OUT/'release-verification.json');dump(OUT/'closeout.json',{'run_id':receipt['run_id'],'complete':True,'verified_files':receipt['files'],'export_bytes':receipt['bytes'],'repeated_export_unchanged':receipt['unchanged'],'global_latest_promoted':False})
  print(packed(read(OUT/'closeout.json')),flush=True)
 finally:shared.close()
if __name__=='__main__':main()
