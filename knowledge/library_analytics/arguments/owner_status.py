"""Read-only identities/resources for the actual analytics owner."""
import json,shutil
from .inputs import lease_status,ROOT
if __name__=='__main__':
    output={'lease':lease_status(),'disk':dict(zip(['total','used','free'],shutil.disk_usage(ROOT)))}
    try:
        import psutil
        for r in output['lease']:
            p=psutil.Process(r['pid']);r['command']=p.cmdline();r['cpu_times']=list(p.cpu_times());r['memory_rss']=p.memory_info().rss;r['created_at']=p.create_time()
            r['io']=dict(zip(p.io_counters()._fields,p.io_counters()));r['children']=[{'pid':c.pid,'command':c.cmdline(),'cpu_times':list(c.cpu_times())} for c in p.children()]
    except (ImportError,Exception) as e:output['process_details_error']=str(e)
    print(json.dumps(output,indent=2))
