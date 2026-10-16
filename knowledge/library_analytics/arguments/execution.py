"""Finite manual KR-130 resume through private delivery, with durable launch/exit receipts.

No scheduler, retries, shared-code changes, or global lease bypass. Windows
breakaway avoids tying this manually authorized worker to a terminal tool job.
"""
import argparse
import json
import os
import subprocess
import sys
import time
import traceback
from pathlib import Path

from .inputs import ROOT, read, write_json, ro, Inputs
from ..jobs import JobStore, process_identity


def alive(state):
    if not state.get('pid'):
        return False
    token = process_identity(state['pid'])
    return token == 'unknown' or token == state.get('process_token')


def preflight():
    # Parent checks only; the processor itself repeats authoritative source,
    # generation and global-lease validation before any processing writes.
    for filename in ('operator-state.json', 'execution-state.json'):
        path = ROOT / filename
        if path.exists() and alive(read(path)):
            raise RuntimeError('Existing/unknown live KR-130 owner: ' + filename)
    progress = read(ROOT / 'progress.json')
    db = ro(ROOT / 'arguments.sqlite3')
    try:
        row = db.execute('SELECT contract_json,state FROM argument_runs WHERE id=?', (progress['run_id'],)).fetchone()
        if row is None:
            raise RuntimeError('Saved generation missing')
        contract = json.loads(row['contract_json'])
        inputs = Inputs()
        try:
            inputs.check(verify_sources=False)
            inputs.check_contract(contract)
        finally:
            inputs.close()
        committed = db.execute('SELECT count(*) FROM document_results WHERE run_id=?', (progress['run_id'],)).fetchone()[0]
        jobs = [dict(r) for r in db.execute('SELECT j.state,count(*) n FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? GROUP BY j.state', (progress['run_id'],))]
        result = {'run_id': progress['run_id'], 'committed_documents': committed, 'job_states': jobs,
                  'code_runtime_parent_identity_checks': 'passed',
                  'source_revalidation': 'processor performs full source checks under global lease before resume',
                  'prior_exit_cause': 'unconfirmed; no terminal exception receipt survived',
                  'no_new_generation': True, 'time_unix': time.time()}
        write_json(ROOT / 'resume-preflight.json', result)
        return result
    finally:
        db.close()


def worker(folder):
    # Reuse existing ownership semantics for this finite private orchestration.
    guard = JobStore(ROOT / 'execution-control.sqlite3')
    state = {'pid': os.getpid(), 'process_token': process_identity(os.getpid()),
             'started_at_unix': time.time(), 'log': str(folder / 'worker.log'),
             'manual_finite_execution': True, 'scheduler': False, 'automatic_restart': False}
    acquired = False
    try:
        guard.acquire(); acquired = True
        state.update(state='running', phase='same-generation-resume')
        write_json(ROOT / 'execution-state.json', state)
        sys.argv = ['arguments.operator']
        from .operator import main as population
        population()
        state.update(phase='private-delivery', updated_at_unix=time.time())
        write_json(ROOT / 'execution-state.json', state)
        from .delivery import main as delivery
        delivery()
        state.update(state='complete', phase='task-handoff-delivered', finished_at_unix=time.time())
        write_json(ROOT / 'execution-state.json', state)
    except BaseException as exc:
        state.update(state='failed', error=repr(exc), finished_at_unix=time.time())
        write_json(folder / 'failure.json', state)
        if acquired:
            write_json(ROOT / 'execution-state.json', state)
        traceback.print_exc()
        raise
    finally:
        guard.close()
        write_json(folder / 'exit.json', state)


def launch():
    checked = preflight()
    folder = ROOT / 'executions' / ('resume-' + str(time.time_ns()))
    folder.mkdir(parents=True)
    write_json(folder / 'before.json', checked)
    command = [sys.executable, '-B', '-X', 'utf8', '-u', '-m',
               'knowledge.library_analytics.arguments.execution', '--worker', str(folder)]
    flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_BREAKAWAY_FROM_JOB
    with (folder / 'worker.log').open('ab', buffering=0) as log:
        proc = subprocess.Popen(command, cwd=Path(__file__).resolve().parents[3],
                                stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT,
                                shell=False, close_fds=True, creationflags=flags)
    launched = {'pid': proc.pid, 'process_token': process_identity(proc.pid), 'command': command,
                'log': str(folder / 'worker.log'), 'creation_flags': flags,
                'breakaway_from_terminal_job': True, 'started_at_unix': time.time(),
                'run_id': checked['run_id'], 'committed_documents_before': checked['committed_documents'],
                'finite_population_and_delivery': True}
    write_json(ROOT / 'execution-launch.json', launched)
    write_json(folder / 'launch.json', launched)
    print(json.dumps(launched, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--worker', type=Path)
    parser.add_argument('--preflight', action='store_true')
    args = parser.parse_args()
    if args.worker:
        worker(args.worker)
    elif args.preflight:
        print(json.dumps(preflight(), indent=2))
    else:
        launch()


if __name__ == '__main__':
    main()
