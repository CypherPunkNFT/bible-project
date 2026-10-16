"""Native, single-instance completion supervision; disabled until explicitly armed.

No downloads, corpus rebuilds, scheduler repair or graph launches are owned here.
The existing completion owner resumes saved vectors and retains its final gates.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timezone

from .settings import load, write_json

INTERVAL = 30
STARTUP = 120
HEARTBEAT = 120
PROGRESS = 1800
BACKOFF = (60, 300, 900)


def read(path):
    return json.loads(path.read_text('utf-8-sig')) if path.exists() else {}


def stamp():
    return datetime.now(timezone.utc).isoformat()


def age(value, now):
    try:
        return now - datetime.fromisoformat(value).timestamp()
    except (ValueError, TypeError):
        return float('inf')


def snapshot(config):
    """Match native command arguments AND instance working directory, not PID alone."""
    import psutil
    rows, unknown = [], []
    for p in psutil.process_iter(['pid', 'name']):
        if (p.info['name'] or '').lower() not in ('python.exe', 'pythonw.exe'):
            continue
        try:
            args = p.cmdline()[1:]
            if args[:1] == ['-u']:
                args = args[1:]
            role = None
            if args in (['-m', 'knowledge.finish_intake', '--resume'], ['-m', 'knowledge.finish_intake', '--refresh']):
                role = 'owner'
            elif len(args) == 3 and args[:2] == ['-m', 'knowledge'] and args[2] in ('embed', 'build', 'verify'):
                role = args[2]
            if role and Path(p.cwd()).resolve() == config['site_dir'].resolve():
                rows.append(dict(pid=p.pid, created=p.create_time(), parent=p.ppid(), role=role))
        except psutil.NoSuchProcess:
            continue
        except psutil.AccessDenied:
            unknown.append(p.pid)
    return rows, unknown


def decide(progress, completion, rows, unknown, now):
    if unknown:
        return 'attention', 'Python process identity could not be inspected'
    if any(r['role'] in ('build', 'verify') for r in rows):
        return 'busy', 'Build or verification owns the corpus; automatic interruption is prohibited'
    owners = [r for r in rows if r['role'] == 'owner']
    workers = [r for r in rows if r['role'] == 'embed']
    # Windows venv launchers and their native child share arguments. Count roots.
    ids = {r['pid'] for r in rows}
    roots = [r for r in owners if r['parent'] not in ids]
    if len(roots) > 1:
        return 'attention', 'Multiple completion owners require review'
    worker_ids = {r['pid'] for r in workers}
    if len([r for r in workers if r['parent'] not in worker_ids]) > 1:
        return 'attention', 'Multiple embedding workers require review'
    if progress.get('state') == 'embedded_pending_verification':
        return 'awaiting_verification', 'Embedding pass finished; final verification requires separate authorization'
    if not owners and not workers:
        if completion.get('state') == 'complete' and progress.get('state') == 'complete':
            return 'complete', 'Completion receipts are terminal; no restart'
        return 'recover', 'Completion owner and embedding worker are absent'
    if any(now - r['created'] < STARTUP for r in rows):
        return 'starting', 'Native process startup grace period'
    if workers and not owners:
        # Never race a surviving writer or launch another owner that could refresh it.
        return 'attention', 'Embedding worker survives without a completion owner'
    owner_ids = {r['pid'] for r in owners}
    if completion.get('pid') not in owner_ids:
        return 'attention', 'Completion checkpoint does not identify the observed owner'
    if workers and progress.get('state') in ('optimizing', 'complete'):
        return 'busy', 'Vector optimization is protected from automatic interruption'
    if age(completion.get('updated_at'), now) > HEARTBEAT:
        return 'recover', 'Completion heartbeat is stale'
    if completion.get('state') == 'embedding':
        if not workers:
            return 'recover', 'Embedding worker is absent while completion expects it'
        if progress.get('pid') not in {r['pid'] for r in workers}:
            return 'attention', 'Embedding checkpoint does not identify the observed worker'
        if age(progress.get('updated_at'), now) > PROGRESS:
            return 'recover', 'Embedding checkpoint is stale'
    return 'healthy', 'Completion heartbeat is current'


def terminate_owned(config, expected):
    """Recheck identity before each termination; never kill encoders or other jobs."""
    import psutil
    current, unknown = snapshot(config)
    if unknown or current != expected:
        raise RuntimeError('Process inventory changed before recovery; no termination attempted')
    if any(r['role'] not in ('owner', 'embed') for r in expected):
        raise RuntimeError('Recovery cannot interrupt build or verification')
    # Stop coordinators first so they cannot launch another child while stopping writers.
    for row in sorted(expected, key=lambda r: r['role'] != 'owner'):
        try:
            p = psutil.Process(row['pid'])
            if abs(p.create_time() - row['created']) > .001:
                raise RuntimeError('PID was reused; recovery stopped')
            p.terminate()
            p.wait(timeout=10)
        except psutil.NoSuchProcess:
            pass
    remaining, unknown = snapshot(config)
    if remaining or unknown:
        raise RuntimeError('Cannot prove all corpus owners exited; replacement not launched')


def launch_owner(config):
    # Existing completion holds finish-intake.lock for its entire lifetime.
    from .finish_intake import hidden_flags
    state = config['state_dir']
    environment = os.environ.copy()
    control = read(state/'native-supervisor/control.json')
    if control.get('mode') not in ('embedding_only', 'verification_only'):
        raise RuntimeError('Recovery requires an explicitly authorized scope')
    for key in ('BIBLE_RECOVERY_TEST_SCOPE', 'BIBLE_EMBED_ONLY', 'BIBLE_EMBED_CORPUS_BUILD', 'BIBLE_VERIFY_ONLY'):
        environment.pop(key, None)
    if control.get('mode') == 'verification_only':
        environment['BIBLE_VERIFY_ONLY'] = '1'
    if control.get('mode') == 'embedding_only':
        if not control.get('corpus_build'):
            raise RuntimeError('Embedding-only recovery requires a pinned corpus snapshot')
        environment.update(BIBLE_EMBED_ONLY='1', BIBLE_EMBED_CORPUS_BUILD=control['corpus_build'])
    scope = control.get('test_scope')
    if scope:
        if time.time() >= scope['deadline']:
            raise RuntimeError('Controlled recovery test authorization expired')
        environment['BIBLE_RECOVERY_TEST_SCOPE'] = json.dumps(scope)
    with (state/'intake-completion.log').open('ab') as output, (state/'intake-completion-error.log').open('ab') as error:
        p = subprocess.Popen([str(state/'.venv/Scripts/python.exe'), '-u', '-m',
                              'knowledge.finish_intake', '--resume'], cwd=config['site_dir'],
                             stdin=subprocess.DEVNULL, stdout=output, stderr=error,
                             creationflags=hidden_flags(), env=environment)
    return dict(pid=p.pid, launched_at=stamp(), mode='resume')


def tick(config, interval=INTERVAL):
    state = config['state_dir']
    folder = state/'native-supervisor'
    control = read(folder/'control.json')
    ledger = read(folder/'recovery.json')
    now = time.time()
    rows, unknown = snapshot(config)
    progress = read(state/'embedding-progress.json')
    completion = read(state/'intake-completion.json')
    action, reason = decide(progress, completion, rows, unknown, now)
    enabled = control.get('enabled') is True and not (state/'watchdog.pause').exists()
    if control.get('test_scope') and now >= control['test_scope']['deadline']:
        enabled = False
    encoder = None
    if control.get('encoder_recovery') is True and action not in ('complete', 'awaiting_verification', 'busy'):
        from . import encoder_recovery
        encoder = encoder_recovery.observe(config, ledger)
        write_json(folder/'recovery.json', ledger)
        if encoder['state'] == 'attention':
            action, reason = 'attention', encoder['reason']
        elif action in ('healthy', 'recover') and (encoder['state'] == 'failed' or
                (encoder['state'] == 'unreachable' and encoder['failures'] >= 3)):
            action, reason = 'recover', 'Instance encoder failed or repeatedly unreachable'
    if enabled and action == 'awaiting_verification' and not rows:
        control = verification_handoff(config, control, progress, completion)
        if control.get('mode') == 'verification_only':
            action, reason = 'recover', 'Authorized final verification and late-acquisition reconciliation'
    report = dict(pid=os.getpid(), updated_at=stamp(), enabled=enabled, observation=action,
                  mode=control.get('mode', 'completion'), run_id=control.get('run_id'),
                  authorized_corpus_build=control.get('corpus_build'),
                  reason=reason, processes=rows, uninspected_python_pids=unknown,
                  attempts=ledger.get('attempts', 0), max_attempts=len(BACKOFF),
                  interval_seconds=interval, heartbeat_timeout_seconds=HEARTBEAT,
                  progress_timeout_seconds=PROGRESS,
                  recovery_test_verified=read(folder/'test-result.json').get('verified') is True)
    report['verification_request'] = control.get('verification_request')
    report['encoder'] = encoder
    if os.name == 'nt':
        import ctypes
        report['console_window'] = bool(ctypes.windll.kernel32.GetConsoleWindow())
    report['state'] = action if enabled else 'paused'
    if action in ('recover', 'attention'):
        alert = dict(active=True, updated_at=stamp(), severity='warning', reason=reason,
                     recovery_enabled=enabled, attempts=ledger.get('attempts', 0))
        if enabled and action == 'recover':
            attempts = ledger.get('attempts', 0)
            if attempts >= len(BACKOFF):
                report['state'] = 'exhausted'
                alert.update(severity='error', reason='Automatic recovery exhausted its three-attempt budget')
            elif now < ledger.get('next_attempt_at', 0):
                report['state'] = 'backoff'
            else:
                # Persist the attempt BEFORE termination/launch so supervisor crashes cannot reset the bound.
                ledger.update(attempts=attempts+1, next_attempt_at=now+BACKOFF[attempts],
                              last_attempt_at=stamp(), reason=reason)
                write_json(folder/'recovery.json', ledger)
                try:
                    # Honor a pause written since the initial observation.
                    if read(folder/'control.json') != control or (state/'watchdog.pause').exists():
                        raise RuntimeError('Recovery paused before mutation')
                    if (read(state/'embedding-progress.json') != progress or
                            read(state/'intake-completion.json') != completion):
                        raise RuntimeError('Checkpoint changed before recovery; deferred without interruption')
                    terminate_owned(config, rows)
                    # A poisoned CUDA process must be replaced before a new owner
                    # starts. A healthy service is left untouched.
                    if encoder is not None and encoder['state'] in ('failed', 'unreachable'):
                        ledger['last_encoder_repair'] = encoder_recovery.repair(config, encoder)
                    if read(folder/'control.json') != control or (state/'watchdog.pause').exists():
                        raise RuntimeError('Recovery paused before owner launch')
                    ledger['last_launch'] = launch_owner(config)
                    report['state'] = 'restarted'
                except Exception as error:
                    ledger['last_error'] = str(error)
                    report.update(state='attention', error=str(error))
                    alert.update(severity='error', reason=str(error))
                write_json(folder/'recovery.json', ledger)
                report['attempts'] = ledger['attempts']
                alert['attempts'] = ledger['attempts']
        write_json(folder/'alert.json', alert)
    else:
        write_json(folder/'alert.json', dict(active=False, updated_at=stamp(), reason=reason))
    write_json(folder/'status.json', report)
    return report


def verification_handoff(config, control, progress, completion):
    """Called under the supervisor lock, only after all corpus processes exit."""
    request = control.get('verification_request', {})
    if control.get('mode') == 'verification_only':
        return control  # A failed launch may be retried within the existing budget.
    if request.get('state') != 'queued':
        return control
    if (request.get('run_id') != control.get('run_id') or
            progress.get('corpus_build') != request.get('corpus_build') or
            progress.get('remaining') != 0 or
            completion.get('state') != 'embedded_pending_verification' or
            completion.get('embedding') != progress):
        raise RuntimeError('Verification handoff receipts do not match the authorized finished pass')
    from .store import connect
    with connect(config['db'], readonly=True) as db:
        build = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
    if build != request['corpus_build']:
        raise RuntimeError('Corpus changed before verification handoff')
    rows, unknown = snapshot(config)
    path = config['state_dir']/'native-supervisor/control.json'
    if rows or unknown or read(path) != control or (config['state_dir']/'watchdog.pause').exists():
        raise RuntimeError('Verification handoff changed during preflight; deferred')
    control = dict(control, mode='verification_only', verification_request=dict(
        request, state='activated', activated_at=stamp()))
    write_json(path, control)
    return control


def run(config, once=False):
    import msvcrt
    folder = config['state_dir']/'native-supervisor'
    folder.mkdir(parents=True, exist_ok=True)
    with (folder/'supervisor.lock').open('a+b') as lock:
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            return
        while True:
            try:
                report = tick(config, interval=60 if once else INTERVAL)
            except Exception as error:
                report = dict(pid=os.getpid(), updated_at=stamp(), state='error', error=str(error))
                write_json(folder/'status.json', report)
                write_json(folder/'alert.json', dict(active=True, severity='error', **report))
            with (folder/'events.jsonl').open('a', encoding='utf-8') as stream:
                stream.write(json.dumps(report)+'\n')
            if once:
                return report
            time.sleep(INTERVAL)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--once', action='store_true')
    parser.add_argument('--launch', action='store_true')
    args = parser.parse_args()
    config = load()
    if args.launch:
        from .finish_intake import hidden_flags
        folder = config['state_dir']/'native-supervisor'
        folder.mkdir(parents=True, exist_ok=True)
        with (folder/'supervisor.log').open('ab') as output:
            p = subprocess.Popen([str(config['state_dir']/'.venv/Scripts/python.exe'), '-u', '-m',
                                  'knowledge.native_supervisor'], cwd=config['site_dir'],
                                 stdin=subprocess.DEVNULL, stdout=output, stderr=output,
                                 creationflags=hidden_flags())
        print(json.dumps(dict(launched_pid=p.pid, launched_at=stamp())))
    else:
        result = run(config, args.once)
        if result and sys.stdout is not None:
            print(json.dumps(result))


if __name__ == '__main__':
    main()
