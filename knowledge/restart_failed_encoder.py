"""One-time encoder repair, preserving the prepared waiting worker. No watchdog."""
import json
import subprocess
import time
import urllib.request
import psutil
from .settings import load, write_json
from .native_supervisor import read, stamp


def main():
    config = load()
    state = config['state_dir']
    progress = read(state/'embedding-progress.json')
    if progress.get('state') != 'waiting_for_gpu':
        raise RuntimeError('Worker is not waiting; refusing interruption')
    worker = psutil.Process(progress['pid'])
    if worker.cmdline()[1:] != ['-u', '-m', 'knowledge', 'embed'] or worker.cwd().lower() != str(config['site_dir']).lower():
        raise RuntimeError('Unexpected worker identity')
    url = config['embedding']['daemon_url']+'/health'
    with urllib.request.urlopen(url, timeout=3) as response:
        health = json.load(response)
    if health.get('service') != 'bible-project-encoder':raise RuntimeError('Wrong service')
    encoder = psutil.Process(health['pid'])
    if encoder.cmdline()[1:] != ['-u', '-m', 'knowledge', 'encoder'] or encoder.cwd().lower() != str(config['site_dir']).lower():
        raise RuntimeError('Unexpected encoder identity')
    receipt = dict(started_at=stamp(), worker_pid=worker.pid, worker_created=worker.create_time(),
                   old_encoder_pid=encoder.pid, before=progress)
    write_json(state/'encoder-repair.json', receipt)
    worker.suspend()
    try:
        encoder.terminate();encoder.wait(15)
        with (state/'encoder.log').open('ab') as output, (state/'encoder-error.log').open('ab') as error:
            child = subprocess.Popen([str(state/'.venv/Scripts/python.exe'), '-u', '-m', 'knowledge', 'encoder'],
                cwd=config['site_dir'], stdin=subprocess.DEVNULL, stdout=output, stderr=error,
                creationflags=subprocess.CREATE_NO_WINDOW)
        receipt['launcher_pid'] = child.pid
        for _ in range(60):
            try:
                with urllib.request.urlopen(url, timeout=2) as response:new = json.load(response)
                if new.get('service') == 'bible-project-encoder' and new['pid'] != encoder.pid:
                    receipt['new_encoder'] = new
                    break
            except Exception:pass
            time.sleep(1)
        else:raise RuntimeError('Replacement encoder did not become ready')
    finally:
        worker.resume()
        receipt['worker_resumed_at'] = stamp()
        write_json(state/'encoder-repair.json', receipt)
    print(json.dumps(receipt), flush=True)


if __name__ == '__main__':main()
