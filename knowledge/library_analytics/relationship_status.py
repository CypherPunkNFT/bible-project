"""Compact read-only progress and owned-process resource receipt."""
import argparse
from pathlib import Path
import json
import time
import psutil
from .relationship_miner import root,status
from .concept_index import read
from .build import readonly
from .jobs import process_identity
from .inputs import packed

def main():
    p=argparse.ArgumentParser();p.add_argument('--record',action='store_true');p.add_argument('--oracle',action='store_true');a=p.parse_args();folder=root();value={}
    if a.oracle:
        oracle=read(folder/'known-pairs-frozen.json')
        print(packed({'seed_queries':len(oracle['attempts']),'unique_seed_windows':len({p['seed_window'] for p in oracle['pairs']}),'pairs':[{'split':p['split'],'left':p['left_window'],'right':p['right_window'],'matching_tokens':p['matching_tokens'],'seed_title':p['seed_proof']['provenance']['title'],'other_title':p['other_proof']['provenance']['title']} for p in oracle['pairs']]}));return
    if (folder/'relationship-progress.json').exists():
        progress=read(folder/'relationship-progress.json');value={k:v for k,v in progress.items() if k not in ('contract','scope')}
    if (folder/'relationships.sqlite3').exists():
        db=readonly(folder/'relationships.sqlite3');owners=[dict(r) for r in db.execute('SELECT * FROM coordinator')]
        if value.get('run_id'):
            value['progress_receipt_processed_documents']=value.get('processed_documents',value.get('counts',{}).get('processed_documents'))
            value.update(status(db,value['run_id']))
            value['document_processing_seconds']=db.execute('SELECT sum(seconds) FROM document_results WHERE run_id=?',(value['run_id'],)).fetchone()[0]
        db.close();value['owners']=owners
        for owner in owners:
            token=process_identity(owner['pid']);owner['observed_token']=token
            if token==owner['process_token']:
                proc=psutil.Process(owner['pid']);owner['rss']=proc.memory_info().rss;owner['cpu']=proc.cpu_times()._asdict();owner['elapsed']=time.time()-proc.create_time()
                owner['io']=proc.io_counters()._asdict()
    value['bytes']={p.name:p.stat().st_size for p in folder.glob('relationships.sqlite3*')}
    value['observed_at_epoch']=time.time()
    memory=psutil.virtual_memory();value['system_memory']={'total':memory.total,'available':memory.available}
    disk=psutil.disk_usage(str(folder));value['output_volume']={'total':disk.total,'free':disk.free}
    if a.record:
        with (folder/'resource-samples.jsonl').open('a',encoding='utf-8') as f:f.write(packed(value)+'\n')
    print(packed(value))

if __name__=='__main__':main()
