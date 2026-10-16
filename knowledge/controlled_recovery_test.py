"""Run only the authorized bounded interruption test, then disable recovery."""
import hashlib
import json
import os
import time
import argparse
from datetime import datetime, timezone

from . import native_supervisor as supervisor
from .settings import load, write_json


def manifest(config):
    from .vectors import table
    vectors = table(config)
    dataset = vectors.to_lance()
    fragments = {}
    for fragment in dataset.get_fragments():
        metadata = fragment.metadata
        fragments[str(metadata.id)] = hashlib.sha256(json.dumps(metadata.to_json(), sort_keys=True).encode()).hexdigest()
    return dict(version=dataset.version, rows=vectors.count_rows(), fragments=fragments)


def stop_workers(rows):
    import psutil
    # Kill the actual encoder client first, then any surviving venv launcher.
    workers = [r for r in rows if r['role'] == 'embed']
    for row in sorted(workers, key=lambda r: r['parent'] not in {p['pid'] for p in workers}):
        try:
            p = psutil.Process(row['pid'])
            if abs(p.create_time()-row['created']) > .001:
                raise RuntimeError('Worker PID changed before controlled interruption')
            p.terminate()
            p.wait(timeout=10)
        except psutil.NoSuchProcess:
            pass


def main():
    import msvcrt
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adopt-current', action='store_true', help='Transfer observation of a paused, bounded test without restarting its worker')
    args = parser.parse_args()
    config = load()
    state = config['state_dir']
    runtime = state/'native-supervisor'
    control_path = runtime/'control.json'
    adopted = None
    existing = supervisor.read(control_path)
    if args.adopt_current:
        import psutil
        if existing.get('enabled') or not existing.get('test_scope'):
            raise RuntimeError('Only an unarmed bounded test may be adopted')
        rows, unknown = supervisor.snapshot(config)
        ids = {r['pid'] for r in rows}
        roots = [r for r in rows if r['role'] == 'owner' and r['parent'] not in ids]
        if unknown or len(roots) != 1 or any(r['role'] not in ('owner', 'embed') for r in rows):
            raise RuntimeError('Adoption requires exactly one identifiable completion tree')
        root = roots[0]
        owner = psutil.Process(root['pid'])
        scope = json.loads(owner.environ().get('BIBLE_RECOVERY_TEST_SCOPE', '{}'))
        if scope.get('test_id') != existing['test_scope']['test_id']:
            raise RuntimeError('Owner is not part of this bounded test')
        excluded = {os.getpid(), *[p.pid for p in psutil.Process().parents()]}
        controllers = []
        for p in psutil.process_iter(['pid', 'name']):
            if p.pid in excluded or (p.info['name'] or '').lower() not in ('python.exe', 'pythonw.exe'):
                continue
            try:
                command = p.cmdline()[1:]
                if command in (['-m', 'knowledge.controlled_recovery_test'], ['-m', 'knowledge.controlled_recovery_test', '--adopt-current']) and p.cwd() == str(config['site_dir']):
                    controllers.append(p)
            except psutil.NoSuchProcess:
                pass
        controller_ids = {p.pid for p in controllers}
        if not controllers or len([p for p in controllers if p.ppid() not in controller_ids]) != 1:
            raise RuntimeError('Original observer identity could not be proved')
        adopted = dict(original_observers=[dict(pid=p.pid, created=p.create_time()) for p in controllers],
                       adopted_at=supervisor.stamp(), initial_owner=root)
        # Only the observer exits. Its worker remains protected by the original vector/time cap.
        for controller in sorted(controllers, key=lambda p: p.ppid() not in controller_ids):
            try:
                controller.terminate()
                controller.wait(timeout=10)
            except psutil.NoSuchProcess:
                pass
        test_id = scope['test_id']
    else:
        test_id = datetime.now(timezone.utc).strftime('recovery-test-%Y%m%dT%H%M%SZ')
    folder = runtime/test_id
    folder.mkdir(exist_ok=bool(adopted))
    result = dict(test_id=test_id, started_at=supervisor.stamp(), verified=False)
    with (runtime/'test.lock').open('a+b') as lock:
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        original_control = supervisor.read(control_path)
        rows, unknown = supervisor.snapshot(config)
        if (rows and not adopted) or unknown or original_control.get('enabled') or (state/'watchdog.pause').exists():
            raise RuntimeError('Test requires paused recovery, no corpus owners, and no legacy pause')
        if not adopted:
            write_json(folder/'before.json', dict(control=original_control,
                   progress=supervisor.read(state/'embedding-progress.json'),
                   completion=supervisor.read(state/'intake-completion.json'),
                   recovery=supervisor.read(runtime/'recovery.json')))
        baseline_attempts = supervisor.read(runtime/'recovery.json').get('attempts', 0)
        if baseline_attempts:
            raise RuntimeError('Review existing recovery attempts before testing')
        initial = supervisor.read(folder/'vectors-before.json') if adopted else manifest(config)
        if not adopted:
            write_json(folder/'vectors-before.json', initial)
        deadline = time.time()+3600
        scope = dict(deadline=deadline, max_indexed=initial['rows']+1024, test_id=test_id)
        control = dict(enabled=False, reason='Bounded controlled-interruption test only', test_scope=scope)
        result['initial_rows'] = initial['rows']
        write_json(control_path, control)
        try:
            launched = dict(pid=adopted['initial_owner']['pid'], adopted=True) if adopted else supervisor.launch_owner(config)
            if adopted:
                result['observation_transfer'] = adopted
                write_json(folder/'observation-transfer.json', adopted)
            result['initial_launch'] = launched
            print(json.dumps(dict(phase='initial_owner_launched', **launched, baseline_rows=initial['rows'])), flush=True)
            samples = supervisor.read(folder/'observations.json') if adopted else []
            last_print = 0

            def wait_for_progress(threshold, label):
                nonlocal last_print
                while time.time() < deadline:
                    rows, unknown = supervisor.snapshot(config)
                    if unknown:
                        raise RuntimeError('Cannot inspect all Python owners')
                    ids = {r['pid'] for r in rows}
                    roots = [r for r in rows if r['role'] == 'owner' and r['parent'] not in ids]
                    workers = [r for r in rows if r['role'] == 'embed' and not any(
                        other['pid'] == r['parent'] and other['role'] == 'embed' for other in rows)]
                    if len(roots) > 1 or len(workers) > 1 or any(r['role'] in ('build', 'verify') for r in rows):
                        raise RuntimeError('Unexpected duplicate owner, writer, build or verification')
                    progress = supervisor.read(state/'embedding-progress.json')
                    sample = dict(at=supervisor.stamp(), phase=label, owner_roots=roots,
                                  worker_roots=workers, checkpoint=progress)
                    samples.append(sample)
                    write_json(folder/'observations.json', samples)
                    prepared_initial = (label == 'await_initial_saved_batch' and progress.get('state') == 'preparing_batches'
                                        and progress.get('indexed') == initial['rows'] and progress.get('stale_remaining') == 0)
                    saved_new_batch = progress.get('state') == 'running' and progress.get('indexed', 0) > threshold
                    if (progress.get('pid') in {r['pid'] for r in rows if r['role'] == 'embed'}
                            and (prepared_initial or saved_new_batch)):
                        if len(roots) != 1 or len(workers) != 1:
                            raise RuntimeError('Progress did not have exactly one completion owner and writer')
                        return rows, progress
                    if time.time()-last_print >= 15:
                        print(json.dumps(dict(phase=label, owner_roots=len(roots), worker_roots=len(workers),
                                              worker_state=progress.get('state'), indexed=progress.get('indexed'))), flush=True)
                        last_print = time.time()
                    time.sleep(2)
                raise TimeoutError('Bounded recovery test exceeded its time allowance')

            rows, progress = wait_for_progress(initial['rows'], 'await_initial_saved_batch')
            result['pre_interruption_checkpoint'] = progress
            result['interrupted_processes'] = rows
            stop_workers(rows)
            result['interrupted_at'] = supervisor.stamp()
            # The completion owner must observe the killed child and exit normally.
            for _ in range(20):
                rows, unknown = supervisor.snapshot(config)
                if not rows and not unknown:
                    break
                time.sleep(2)
            else:
                raise RuntimeError('Completion owner did not exit after worker interruption')
            interrupted = manifest(config)
            write_json(folder/'vectors-at-interruption.json', interrupted)
            result['interruption_rows'] = interrupted['rows']
            result['completion_after_interruption'] = supervisor.read(state/'intake-completion.json')
            if interrupted['rows'] >= scope['max_indexed']:
                raise RuntimeError('Test vector budget exhausted before replacement')
            control['enabled'] = True
            write_json(control_path, control)
            result['recovery_armed_at'] = supervisor.stamp()
            print(json.dumps(dict(phase='await_scheduled_recovery', rows=interrupted['rows'])), flush=True)
            rows, recovered_progress = wait_for_progress(interrupted['rows'], 'await_replacement_saved_batch')
            result['replacement_checkpoint'] = recovered_progress
            result['replacement_processes'] = rows
            recovery = supervisor.read(runtime/'recovery.json')
            result['recovery'] = recovery
            if recovery.get('attempts') != baseline_attempts+1:
                raise RuntimeError('Expected exactly one automatic recovery attempt')
            if recovered_progress['pid'] == progress['pid']:
                raise RuntimeError('Replacement worker PID did not change')
            result['candidate_pass'] = True
        except BaseException as error:
            result['error'] = str(error)
            raise
        finally:
            # Disable first, then acquire the same lock as the scheduled supervisor.
            write_json(control_path, dict(enabled=False, reason='Controlled-interruption test ended; full resumption awaits authorization'))
            with (runtime/'supervisor.lock').open('a+b') as supervisor_lock:
                for _ in range(60):
                    supervisor_lock.seek(0)
                    try:
                        msvcrt.locking(supervisor_lock.fileno(), msvcrt.LK_NBLCK, 1)
                        break
                    except OSError:
                        time.sleep(1)
                else:
                    raise RuntimeError('Could not acquire supervisor lock for test cleanup')
                rows, unknown = supervisor.snapshot(config)
                if unknown:
                    raise RuntimeError('Cannot prove process identities during test cleanup')
                supervisor.terminate_owned(config, rows)
            final = manifest(config)
            write_json(folder/'vectors-after.json', final)
            result['final_rows'] = final['rows']
            result['all_prior_fragments_unchanged'] = all(final['fragments'].get(k) == v for k, v in initial['fragments'].items())
            result['remaining_processes'], result['uninspected_python_pids'] = supervisor.snapshot(config)
            result['ended_at'] = supervisor.stamp()
            result['verified'] = bool(result.get('candidate_pass') and result['all_prior_fragments_unchanged']
                                      and final['rows'] > result.get('interruption_rows', final['rows'])
                                      and not result['remaining_processes'] and not result['uninspected_python_pids'])
            result['scope'] = 'One live worker interruption and scheduled native recovery; full passage-ID/integrity verification remains pending'
            write_json(folder/'result.json', result)
            write_json(runtime/'test-result.json', result)
            from .campaign_coordinator import report
            report(config)
            print(json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
