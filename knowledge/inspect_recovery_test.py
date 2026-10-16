"""Read-only diagnostics for the bounded recovery test."""
import json
import psutil
import urllib.request
from .settings import load
from .native_supervisor import snapshot, read, stamp

if __name__ == '__main__':
    config = load()
    rows, unknown = snapshot(config)
    for row in rows:
        try:
            p = psutil.Process(row['pid'])
            row.update(cpu_seconds=sum(p.cpu_times()[:2]), rss_gb=round(p.memory_info().rss/1e9, 2), status=p.status(), io=p.io_counters()._asdict(), priority=int(p.nice()), io_priority=int(p.ionice()))
        except psutil.NoSuchProcess:
            row['exited'] = True
    logs = {}
    for name in ('embedding.log', 'embedding-error.log', 'intake-completion-error.log'):
        path = config['state_dir']/name
        with path.open('rb') as stream:
            stream.seek(max(0, path.stat().st_size-1800))
            logs[name] = stream.read().decode('utf-8', errors='replace')
    with urllib.request.urlopen(config['embedding']['daemon_url'].rstrip('/')+'/health', timeout=5) as response:
        health = json.load(response)
    print(json.dumps(dict(at=stamp(), processes=rows, unknown=unknown, encoder=health,
                         progress=read(config['state_dir']/'embedding-progress.json')), indent=2))
