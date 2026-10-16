"""Persist the actual task owner command/identity and aggregate progress log."""
import json,time
from .inputs import ROOT,read,write_json,lease_status
from ..jobs import process_identity
def main():
    import psutil
    state=read(ROOT/'operator-state.json');pid=state['pid'];live=process_identity(pid);value={'observed_at_unix':time.time(),'phase':state.get('phase'),'pid':pid,'process_token':state['process_token'],'live_identity':live,'global_lease':lease_status(),'progress':read(ROOT/'progress.json') if (ROOT/'progress.json').exists() else None,'progress_path':str(ROOT/'progress.json'),'resource_log':str(ROOT/'resource-samples.jsonl'),'aggregate_log':str(ROOT/'runtime-attempts.jsonl'),'resume_command':'..\\KnowledgeBase\\.venv\\Scripts\\python.exe -B -X utf8 -m knowledge.library_analytics.arguments.operator'}
    if live==state['process_token']:
        p=psutil.Process(pid);value.update({'actual_command':p.cmdline(),'cwd':p.cwd(),'cpu_times':list(p.cpu_times()),'rss_bytes':p.memory_info().rss})
    elif (ROOT/'runtime-launch.json').exists():
        prior=read(ROOT/'runtime-launch.json')
        if prior.get('pid')==pid and prior.get('process_token')==state['process_token']:
            for key in ['actual_command','cwd']:
                if key in prior:value[key]=prior[key]
            value['command_previously_observed_at_unix']=prior['observed_at_unix']
    with (ROOT/'runtime-attempts.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(value)+'\n')
    write_json(ROOT/'runtime-launch.json',value);print(json.dumps(value,indent=2))
if __name__=='__main__':main()
