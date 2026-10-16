"""Finite read-only resource observation of this task's exact native owner."""
import json,time
from .inputs import ROOT,read,write_json
from ..jobs import process_identity
def main():
    import psutil
    state=read(ROOT/'operator-state.json');pid=state['pid'];token=state['process_token'];started=time.time();samples=0;peaks={'rss_bytes':0,'wal_bytes':0,'database_bytes':0};last={};path=ROOT/'resource-samples.jsonl'
    while process_identity(pid)==token:
        p=psutil.Process(pid)
        sizes={}
        for label,suffix in [('database_bytes','arguments.sqlite3'),('wal_bytes','arguments.sqlite3-wal')]:
            f=ROOT/suffix;sizes[label]=f.stat().st_size if f.exists() else 0
        last={'unix_time':time.time(),'pid':pid,'process_token':token,'rss_bytes':p.memory_info().rss,'cpu_user_seconds':p.cpu_times().user,'cpu_system_seconds':p.cpu_times().system,'threads':p.num_threads(),**sizes}
        for k in peaks:peaks[k]=max(peaks[k],last[k])
        with path.open('a',encoding='utf-8') as f:f.write(json.dumps(last)+'\n')
        samples+=1
        write_json(ROOT/'resource-receipt.json',{'observed_pid':pid,'process_token':token,'started_at_unix':started,'samples':samples,'peaks':peaks,'last':last,'finite_monitor':True,'scheduler':False,'includes_global_lease_wait':True})
        if read(ROOT/'operator-state.json').get('state') in ('complete','failed'):break
        time.sleep(30)
    print(json.dumps({'resource_samples':samples,'peaks':peaks,'observed_process_exited_or_task_terminal':True}))
if __name__=='__main__':main()
