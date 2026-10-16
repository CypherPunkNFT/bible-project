"""One 60-second checkpoint delta; no mutations to the embedding job."""
import json
import time
from .settings import load
from .native_supervisor import read, stamp

path = load()['state_dir']/'embedding-progress.json'
start = read(path)
started_at = stamp()
clock = time.monotonic()
print(json.dumps(dict(sample='start', observed_at=started_at, checkpoint=start)), flush=True)
time.sleep(60)
end = read(path)
elapsed = time.monotonic()-clock
print(json.dumps(dict(sample='end', observed_at=stamp(), checkpoint=end,
    elapsed_seconds=elapsed, new_vectors=end['indexed']-start['indexed'],
    vectors_per_second=(end['indexed']-start['indexed'])/elapsed,
    same_worker=start.get('pid')==end.get('pid'),
    same_corpus=start.get('corpus_build')==end.get('corpus_build'))), flush=True)
