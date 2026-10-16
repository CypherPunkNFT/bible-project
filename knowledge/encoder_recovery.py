"""Identity-checked recovery of this instance's encoder, never shared encoders."""
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request


def processes(config):
    import psutil
    rows, unknown = [], []
    for p in psutil.process_iter(['pid', 'name']):
        if (p.info['name'] or '').lower() not in ('python.exe', 'pythonw.exe'):
            continue
        try:
            args = p.cmdline()[1:]
            if args[:1] == ['-u']:
                args = args[1:]
            if args == ['-m', 'knowledge', 'encoder'] and Path(p.cwd()).resolve() == config['site_dir'].resolve():
                rows.append(dict(pid=p.pid, parent=p.ppid(), created=p.create_time()))
        except psutil.NoSuchProcess:
            pass
        except psutil.AccessDenied:
            unknown.append(p.pid)
    return rows, unknown


def health(config):
    try:
        try:
            response = urllib.request.urlopen(config['embedding']['daemon_url'].rstrip('/')+'/health', timeout=3)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            value = json.loads(response.read(16384))
            code = response.code
        if value.get('service') != 'bible-project-encoder':
            return dict(state='foreign', reason='Encoder port answers as another service')
        return dict(state='healthy' if code == 200 and not value.get('error') else 'failed', **value)
    except Exception as error:
        return dict(state='unreachable', reason=type(error).__name__)


def observe(config, ledger):
    rows, unknown = processes(config)
    value = health(config)
    ids = {r['pid'] for r in rows}
    roots = [r for r in rows if r['parent'] not in ids]
    identity = sorted((r['pid'], r['created']) for r in rows)
    previous = ledger.get('encoder_observation', {})
    failures = previous.get('failures', 0)+1 if previous.get('identity') == [list(r) for r in identity] else 1
    if value['state'] == 'healthy':
        failures = 0
    ledger['encoder_observation'] = dict(identity=identity, failures=failures, state=value['state'])
    value.update(processes=rows, unknown=unknown, failures=failures)
    if unknown or len(roots) > 1 or value['state'] == 'foreign' or (value.get('pid') is not None and value['pid'] not in ids):
        value.update(state='attention', reason='Cannot prove a single instance-owned encoder')
    elif value['state'] == 'failed' and not rows:
        value.update(state='attention', reason='Failed endpoint has no matching native process')
    return value


def repair(config, observed):
    """Call only after corpus workers exit, under the supervisor's exclusive lock."""
    import psutil
    rows, unknown = processes(config)
    if unknown or rows != observed['processes']:
        raise RuntimeError('Encoder identity changed before repair')
    current = health(config)
    if current['state'] == 'healthy':
        return dict(state='already_healthy')
    ids = {r['pid'] for r in rows}
    if current['state'] == 'foreign' or (current.get('pid') is not None and current['pid'] not in ids):
        raise RuntimeError('Encoder port ownership changed before repair')
    # Stop native children before their venv launchers; no recursive tree killing.
    for row in sorted(rows, key=lambda r: r['parent'] not in ids):
        try:
            p = psutil.Process(row['pid'])
            if abs(p.create_time()-row['created']) > .001:
                raise RuntimeError('Encoder PID was reused; repair refused')
            p.terminate()
            p.wait(10)
        except psutil.NoSuchProcess:
            pass
    remaining, unknown = processes(config)
    if remaining or unknown:
        raise RuntimeError('Cannot prove encoder exit')
    if health(config)['state'] != 'unreachable':
        raise RuntimeError('Encoder endpoint still occupied; no replacement launched')
    state = config['state_dir']
    environment = os.environ.copy()
    for key in ('BIBLE_EMBED_ONLY', 'BIBLE_EMBED_CORPUS_BUILD', 'BIBLE_RECOVERY_TEST_SCOPE', 'BIBLE_VERIFY_ONLY'):
        environment.pop(key, None)
    with (state/'encoder.log').open('ab') as output, (state/'encoder-error.log').open('ab') as error:
        child = subprocess.Popen([str(state/'.venv/Scripts/python.exe'), '-u', '-m', 'knowledge', 'encoder'],
            cwd=config['site_dir'], stdin=subprocess.DEVNULL, stdout=output, stderr=error,
            env=environment, creationflags=subprocess.CREATE_NO_WINDOW)
    for _ in range(30):
        value = health(config)
        if value['state'] == 'healthy':
            actual, unknown = processes(config)
            actual_ids = {r['pid'] for r in actual}
            if unknown or value.get('pid') not in actual_ids or child.pid not in actual_ids:
                raise RuntimeError('Replacement encoder identity could not be verified')
            return dict(state='restarted', launcher_pid=child.pid, pid=value['pid'])
        if child.poll() is not None:
            raise RuntimeError('Replacement encoder exited; inspect encoder-error.log')
        time.sleep(1)
    raise RuntimeError('Replacement encoder readiness timed out')
