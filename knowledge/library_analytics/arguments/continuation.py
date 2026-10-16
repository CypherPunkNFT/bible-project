"""Finite continuation of already implemented owner workflows after KR-130.

Loaded by delivery in the existing detached worker. No scheduler, extra waiter,
model worker, global lease bypass or implementation of later phases is implied.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

import psutil

from .inputs import ROOT, BASE, PROJECT, read, sha, write_json
from ..jobs import JobStore, process_identity

WEBSITE = Path(PROJECT) / 'Website'
CONFIG = ROOT / 'automatic-continuation.json'
STATE = ROOT / 'continuation-state.json'


def require_delivery(config, delivered):
    if delivered.get('run_id') != config['after_kr130_run'] or delivered.get('state') != 'private-candidate-delivery-complete' or delivered.get('release_verification') is not True:
        raise RuntimeError('Matching verified KR-130 private delivery is required')


def require_code(step):
    for proof in step['code_proofs']:
        if sha(proof['path']) != proof['sha256']:
            raise RuntimeError('Queued owner code changed; reconcile before running: ' + proof['path'])


def completion_proofs(step):
    for expected in step.get('required_receipts', []):
        receipt = read(expected['path'])
        for key, value in expected['equals'].items():
            if receipt.get(key) != value:
                raise RuntimeError('Expected completion proof missing/mismatched: ' + expected['path'])


def child_environment(config, family):
    dependency = config.get('recovery_runtime_dependency') if family == 'recovery' else None
    if not dependency:
        return None
    module = Path(dependency['path'])
    if sha(module) != dependency['sha256']:
        raise RuntimeError('Recovery runtime dependency changed')
    env = dict(os.environ)
    # Runtime package directory only; no production source/body fallback.
    env['PYTHONPATH'] = str(module.parent)
    return env


def live_foreign_owner(family):
    markers = ['refresh_run_suite', 'refresh_report'] if family == 'refresh' else ['knowledge.library_analytics.recovery.', 'finish_workstream.py', 'run_workstream.py', 'write_handoff.py']
    matches = []
    for proc in psutil.process_iter(['pid', 'name'], ad_value=None):
        if proc.pid == os.getpid() or (proc.info.get('name') or '').lower() not in ('python.exe', 'pythonw.exe'):
            continue
        try:
            args = proc.cmdline(); cwd = proc.cwd()
        except (psutil.Error, OSError):
            continue
        if str(PROJECT).lower() not in (' '.join(args) + ' ' + cwd).lower():
            continue
        if any(any(marker in arg for marker in markers) for arg in args):
            matches.append({'pid': proc.pid, 'process_token': process_identity(proc.pid), 'command': args})
    return matches


def preserve_recovery_controls(folder):
    # Preserve control receipts and logs before invoking the existing owner,
    # whose historical continuation script may reuse its log filenames.
    work = BASE / 'recovery/kr101-v2-20261014'
    targets = [work / n for n in ('driver-transition.json', 'driver-receipt.json', 'driver-failure.json', 'restore-interrupted.json')]
    targets += list(work.glob('*continuation-*.log'))
    kept = []
    for path in targets:
        if not path.is_file():
            continue
        target = folder / 'preserved-recovery-controls' / path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        original = sha(path)
        if sha(target) != original:
            raise RuntimeError('Prior control receipt preservation failed')
        kept.append({'original': str(path), 'preserved': str(target), 'sha256': original})
    write_json(folder / 'preserved-recovery-controls.json', kept)


def run():
    if not CONFIG.exists() or not read(CONFIG).get('enabled'):
        return
    config = read(CONFIG)
    require_delivery(config, read(ROOT / 'delivery-complete.json'))
    guard = JobStore(ROOT / 'continuation-control.sqlite3')
    folder = ROOT / 'continuations' / str(time.time_ns())
    folder.mkdir(parents=True)
    state = {'pid': os.getpid(), 'process_token': process_identity(os.getpid()), 'state': 'running',
             'started_at_unix': time.time(), 'steps': [], 'execution': str(folder), 'automatic_restart': False}
    acquired = False
    try:
        guard.acquire(); acquired = True
        previous = read(STATE) if STATE.exists() else {}
        write_json(folder / 'previous-state.json', previous)
        prior_steps = {r['label']: r for r in previous.get('steps', [])}
        for step in config['steps']:
            require_code(step)
            prior = prior_steps.get(step['label'])
            if prior and prior.get('state') == 'complete' and prior.get('exit_code') == 0:
                completion_proofs(step)
                record = dict(prior, reused_completed_step=True, reused_from_execution=previous.get('execution'))
                state['steps'].append(record);write_json(STATE, state)
                continue
            owners = live_foreign_owner(step['family'])
            if owners:
                raise RuntimeError('Existing owner preserved; duplicate continuation refused: ' + json.dumps(owners))
            if step['label'] == 'recovery-owner-continuation':
                preserve_recovery_controls(folder)
            record = {'label': step['label'], 'state': 'running', 'command': step['command'], 'started_at_unix': time.time(),
                      'log': str(folder / (step['label'] + '.log'))}
            state['active_step'] = step['label']; state['steps'].append(record);write_json(STATE, state)
            with Path(record['log']).open('ab', buffering=0) as log:
                child = subprocess.Popen(step['command'], cwd=WEBSITE, stdin=subprocess.DEVNULL, stdout=log,
                                         stderr=subprocess.STDOUT, shell=False, close_fds=True,
                                         creationflags=subprocess.CREATE_NO_WINDOW, env=child_environment(config,step['family']))
                record.update(child_pid=child.pid, child_process_token=process_identity(child.pid));write_json(STATE, state)
                code = child.wait()
            record.update(exit_code=code, finished_at_unix=time.time(), state='complete' if code == 0 else 'failed')
            write_json(STATE, state)
            if code:
                raise RuntimeError(f"Continuation failed: {step['label']} (exit {code}); inspect {record['log']}")
            completion_proofs(step)
        state.update(state='implemented-workflows-complete', active_step=None, finished_at_unix=time.time(),
                     next_phase='Phase 2 foundation reconciliation and remaining implementation in the existing TODO order',
                     later_coding_phases_automatically_executed=False)
        write_json(STATE, state);write_json(folder / 'receipt.json', state)
    except BaseException as exc:
        state.update(state='failed', error=str(exc), failed_at_unix=time.time())
        if acquired:write_json(STATE, state)
        write_json(folder / 'failure.json', state)
        raise
    finally:
        guard.close()


def arm():
    # Only existing finite entry points. No speculative next-stage shell commands.
    py = str(Path(PROJECT) / 'KnowledgeBase/.venv/Scripts/python.exe')
    recovery = BASE / 'recovery'
    specs = [
        ('refresh-suite', 'refresh', [py, '-B', '-X', 'utf8', '-u', '-m', 'knowledge.library_analytics.refresh_run_suite'],
         WEBSITE / 'knowledge/library_analytics/refresh_run_suite.py', [{'path': str(BASE / 'refresh/suite-result.json'), 'equals': {'state': 'complete'}}]),
        ('refresh-result-handoff', 'refresh', [py, '-B', '-X', 'utf8', '-m', 'knowledge.library_analytics.refresh_report'],
         WEBSITE / 'knowledge/library_analytics/refresh_report.py', []),
        ('recovery-owner-continuation', 'recovery', [py, '-B', '-X', 'utf8', '-u', str(recovery / 'finish_workstream.py')],
         recovery / 'finish_workstream.py', [{'path': str(recovery / 'kr101-v2-20261014/driver-receipt.json'), 'equals': {'state': 'completed'}},
                                           {'path': str(recovery / 'kr101-v2-20261014/restored/verification.json'), 'equals': {'state': 'local-restore-verified'}}]),
        ('recovery-result-handoff', 'recovery', [py, '-B', '-X', 'utf8', str(recovery / 'write_handoff.py')],
         recovery / 'write_handoff.py', []),
    ]
    steps = [{'label': label, 'family': family, 'command': command,
              'code_proofs': [{'path': str(path), 'sha256': sha(path)}], 'required_receipts': expected}
             for label, family, command, path, expected in specs]
    config = {'enabled': True, 'after_kr130_run': read(ROOT / 'population.json')['run_id'], 'armed_at_unix': time.time(),
              'authorization': 'User: Then auto proceed with everything please',
              'remaining_work_order': str(WEBSITE / 'initiatives/library-knowledge/TODO.md'),
              'scope': 'Existing runnable owner workflows only; further implementation remains in the recorded work order.',
              'steps': steps, 'stop_on_failure': True, 'deployment_authorized': False,
              'new_intake_encoder_scheduler_authorized': False, 'later_coding_phases_automatically_executed': False}
    if CONFIG.exists():
        previous = read(CONFIG)
        if previous.get('enabled') and previous.get('steps') == steps and previous.get('after_kr130_run') == config['after_kr130_run']:
            print(json.dumps({'armed': True, 'unchanged': True, 'after_run': config['after_kr130_run']}))
            return
        if STATE.exists():
            prior = read(STATE)
            if prior.get('pid') and process_identity(prior['pid']) in ('unknown', prior.get('process_token')):
                raise RuntimeError('Existing live/unknown continuation owner; config replacement refused')
    write_json(CONFIG, config)
    write_json(STATE, {'state': 'queued-after-kr130-private-delivery', 'armed_at_unix': config['armed_at_unix'],
                       'steps': [{'label': s['label'], 'state': 'queued'} for s in steps]})
    print(json.dumps({'armed': True, 'after_run': config['after_kr130_run'], 'steps': [s['label'] for s in steps],
                      'runs_in_existing_finite_worker': True, 'scheduler': False, 'new_waiting_process': False}, indent=2))


def status():
    state = read(STATE) if STATE.exists() else {'state': 'not armed', 'steps': []}
    print('\nAUTOMATIC REFINEMENT CONTINUATION')
    print('=' * 72)
    print('State: ' + state['state'])
    known = {s['label']: s for s in state.get('steps', [])}
    configured = read(CONFIG).get('steps', []) if CONFIG.exists() else state.get('steps', [])
    for configured_step in configured:
        step = known.get(configured_step['label'], {'label': configured_step['label'], 'state': 'queued'})
        print(f" {step['state'].upper():12} {step['label']}")
        if step.get('log'):
            print('              log: ' + step['log'])
    if state.get('error'):
        print('Error: ' + state['error'])
    print('Later coding stages follow the existing TODO order; they are not shell jobs.')


def resume_detached():
    config = read(CONFIG);require_delivery(config,read(ROOT/'delivery-complete.json'))
    prior = read(STATE)
    if prior.get('pid') and process_identity(prior['pid']) in ('unknown',prior.get('process_token')):
        raise RuntimeError('Existing live/unknown continuation owner; resume refused')
    for step in config['steps']:require_code(step)
    for family in ('refresh','recovery'):
        if live_foreign_owner(family):raise RuntimeError('Existing live owner preserved: '+family)
    dependency = ROOT/'dependencies/typing_extensions.py'
    prior_config = dict(config)
    config['recovery_runtime_dependency']={'path':str(dependency),'sha256':sha(dependency),'version':'4.15.0',
        'scope':'Child-only runtime package path; no source/evidence fallback or shared environment change.'}
    folder=ROOT/'continuation-launches'/str(time.time_ns());folder.mkdir(parents=True)
    write_json(folder/'before-config.json',prior_config)
    probe_code="import json,typing_extensions;from bs4 import BeautifulSoup;print(json.dumps({'module':typing_extensions.__file__,'html_text':BeautifulSoup('<p>runtime check</p>','html.parser').get_text()}))"
    probe=subprocess.run([sys.executable,'-B','-X','utf8','-c',probe_code],cwd=WEBSITE,env=child_environment(config,'recovery'),
                         capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=20,creationflags=subprocess.CREATE_NO_WINDOW)
    proof={'exit_code':probe.returncode,'stdout':probe.stdout,'stderr':probe.stderr,'scope':'Isolated real BeautifulSoup import/HTML parse; not source-content validation'}
    write_json(folder/'runtime-probe.json',proof)
    if probe.returncode or Path(json.loads(probe.stdout)['module']).resolve()!=dependency.resolve():
        raise RuntimeError('Scoped recovery runtime probe failed')
    write_json(CONFIG,config)
    command=[sys.executable,'-B','-X','utf8','-u','-m','knowledge.library_analytics.arguments.continuation']
    flags=subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP|subprocess.CREATE_BREAKAWAY_FROM_JOB
    with (folder/'worker.log').open('ab',buffering=0) as log:
        proc=subprocess.Popen(command,cwd=WEBSITE,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT,
                              shell=False,close_fds=True,creationflags=flags)
    receipt={'pid':proc.pid,'process_token':process_identity(proc.pid),'command':command,'log':str(folder/'worker.log'),
             'launched_at_unix':time.time(),'prior_state_preserved':prior.get('execution'),'runtime_dependency':config['recovery_runtime_dependency'],
             'completed_steps_rechecked_and_skipped':True,'scheduler':False,'automatic_restart':False}
    write_json(folder/'launch.json',receipt);write_json(ROOT/'continuation-resume-launch.json',receipt)
    print(json.dumps(receipt,indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser();parser.add_argument('--arm', action='store_true');parser.add_argument('--status', action='store_true');parser.add_argument('--resume-detached',action='store_true');args=parser.parse_args()
    if args.arm:arm()
    elif args.status:status()
    elif args.resume_detached:resume_detached()
    else:run()
