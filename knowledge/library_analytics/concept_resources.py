"""One-shot resource receipt; no background coordinator or store writer."""
from pathlib import Path
import os
import time
import psutil
from .concept_index import root,read
from .inputs import packed
from .build import now
from .jobs import process_identity

def main():
    folder=root();progress=read(folder/'concept-progress.json');pid=progress.get('pid')
    record={'observed_at':now(),'progress':progress,'process':None,
        'bytes':{p.name:p.stat().st_size for p in folder.glob('concepts.sqlite3*')},
        'host_memory':{'total':psutil.virtual_memory().total,'available':psutil.virtual_memory().available}}
    if pid and process_identity(pid)==progress.get('process_token'):
        p=psutil.Process(pid)
        record['process']={'pid':pid,'created_at':p.create_time(),'rss':p.memory_info().rss,
            'cpu_seconds':sum(p.cpu_times()[:2]),'threads':p.num_threads(),'io':p.io_counters()._asdict()}
    with (folder/'resource-samples.jsonl').open('a',encoding='utf-8') as f:f.write(packed(record)+'\n')
    print(packed(record))

if __name__=='__main__':main()
