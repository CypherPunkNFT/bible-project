"""Confirm an authorized resumed pass is saving vectors; never stop its workers."""
import json
import time
from datetime import datetime
import psutil
from .settings import load, write_json
from .native_supervisor import read, snapshot, stamp


if __name__ == '__main__':
    config = load()
    state = config['state_dir']
    runtime = state/'native-supervisor'
    run = read(runtime/'active-embedding-run.json')
    deadline = time.time()+1800
    while time.time() < deadline:
        rows, unknown = snapshot(config)
        owners = [r for r in rows if r['role'] == 'owner']
        workers = [r for r in rows if r['role'] == 'embed']
        owner_ids = {r['pid'] for r in owners}
        worker_ids = {r['pid'] for r in workers}
        roots = [r for r in owners if r['parent'] not in owner_ids]
        writer_roots = [r for r in workers if r['parent'] not in worker_ids]
        if unknown or len(roots) > 1 or len(writer_roots) > 1 or any(r['role'] in ('build', 'verify') for r in rows):
            raise RuntimeError('Unexpected process inventory while confirming embedding-only resumption')
        process_details = []
        for row in rows:
            process = psutil.Process(row['pid'])
            environment = process.environ()
            if (environment.get('BIBLE_EMBED_ONLY') != '1' or
                    environment.get('BIBLE_EMBED_CORPUS_BUILD') != run['corpus_build'] or
                    environment.get('BIBLE_RECOVERY_TEST_SCOPE')):
                raise RuntimeError('Resumed process does not carry the authorized embedding-only scope')
            process_details.append(dict(**row, priority=int(process.nice()), io_priority=int(process.ionice())))
        progress = read(state/'embedding-progress.json')
        current = progress.get('pid') in worker_ids
        health = read(runtime/'status.json')
        print(json.dumps(dict(at=stamp(), owners=len(roots), writers=len(writer_roots),
                              state=progress.get('state') if current else 'loading_saved_vectors',
                              indexed=progress.get('indexed'), supervisor=health.get('state'))), flush=True)
        if (current and progress.get('state') == 'running' and progress.get('indexed', 0) >= run['initial_vectors']+256
                and health.get('enabled') and health.get('state') == 'healthy'
                and time.time()-datetime.fromisoformat(health['updated_at']).timestamp() < 120):
            from .vectors import table
            vectors = table(config)
            count = vectors.count_rows()
            if count < progress['indexed']:
                raise RuntimeError('Saved row count is below the worker checkpoint')
            if any(row['priority'] != int(psutil.NORMAL_PRIORITY_CLASS) or row['io_priority'] != int(psutil.IOPRIO_NORMAL) for row in process_details):
                raise RuntimeError('Scheduled replacement did not inherit normal CPU and I/O priority')
            result = dict(confirmed_at=stamp(), run_id=run['run_id'], started=True,
                          checkpoint=progress, saved_rows=count, saved_since_resume=count-run['initial_vectors'],
                          processes=process_details, supervisor=health,
                          recovery=read(runtime/'recovery.json'), mode='embedding_only',
                          final_verification_started=False, graph_started=False)
            write_json(runtime/run['run_id']/'resumed.json', result)
            from .campaign_coordinator import report
            report(config)
            print(json.dumps(result), flush=True)
            break
        time.sleep(20)
    else:
        raise TimeoutError('Resumed job did not produce confirmed progress within 30 minutes; workers were not stopped')
