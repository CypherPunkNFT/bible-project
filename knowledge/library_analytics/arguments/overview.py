"""Read-only, one-shot BibleProject process/receipt overview. No worker control."""
import json
import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path

import psutil

from .inputs import ROOT, BASE, PROJECT, lease_status, write_json
from ..jobs import process_identity

PROJECT = Path(PROJECT)
KB = PROJECT / 'KnowledgeBase'


def read(path):
    try:
        return json.loads(Path(path).read_text('utf-8-sig'))
    except (OSError, ValueError):
        return {}


def age(path):
    try:
        seconds = max(0, int(time.time() - Path(path).stat().st_mtime))
        return f'{seconds}s old' if seconds < 120 else f'{seconds // 60}m old'
    except OSError:
        return 'no receipt'


def size(n):
    for unit in ('B', 'KiB', 'MiB', 'GiB', 'TiB'):
        if abs(n) < 1024 or unit == 'TiB':
            return f'{n:,.1f} {unit}'
        n /= 1024


def duration(n):
    n = max(0, int(n))
    return f'{n // 3600}h {(n % 3600) // 60:02}m' if n >= 3600 else f'{n // 60}m {n % 60:02}s'


def meter(done, total):
    if not total:
        return 'no numeric total published'
    ratio = min(1, max(0, done / total))
    full = int(ratio * 24)
    return f"[{'#' * full}{'-' * (24 - full)}] {ratio:5.1%}  {done:,} / {total:,}"


def label(command):
    if '-m' in command:
        i = command.index('-m') + 1
        return ' '.join(command[i:]).replace('knowledge.library_analytics.', '').replace('knowledge.', '')
    for i, part in enumerate(command[1:], 1):
        if part.lower().endswith(('.py', '.mjs', '.js', '.exe')):
            try:
                script = str(Path(part).relative_to(PROJECT))
            except ValueError:
                script = Path(part).name
            return ' '.join([script, *command[i + 1:]])
    return ' '.join(command[1:]) or Path(command[0]).name


def sample(proc):
    try:
        cpu = proc.cpu_times()
        io = proc.io_counters()
        return {'cpu': cpu.user + cpu.system, 'read': io.read_bytes, 'write': io.write_bytes,
                'rss': proc.memory_info().rss}
    except (psutil.Error, OSError):
        return None


def inventory():
    found = {}
    prefix = str(PROJECT).lower()
    for proc in psutil.process_iter(['pid', 'ppid', 'name', 'create_time'], ad_value=None):
        info = proc.info
        if proc.pid == os.getpid() or (info.get('name') or '').lower() not in ('python.exe', 'pythonw.exe', 'node.exe', 'cmd.exe'):
            continue
        try:
            command = proc.cmdline()
            cwd = proc.cwd()
        except (psutil.Error, OSError):
            continue
        if not command:
            continue
        # Match this project's paths/cwd; do not conflate other Jarvis projects.
        if prefix not in (' '.join(command) + ' ' + cwd).lower():
            continue
        if 'knowledge.library_analytics.arguments.overview' in command:
            continue
        first = sample(proc)
        if first:
            found[proc.pid] = {'pid': proc.pid, 'ppid': info['ppid'], 'name': info['name'],
                               'command': command, 'cwd': cwd, 'created': info['create_time'], 'first': first,
                               'label': label(command), '_process': proc}
    started = time.monotonic()
    time.sleep(1)
    elapsed = time.monotonic() - started
    for row in found.values():
        last = sample(row.pop('_process'))
        if not last:
            row.update(activity='exited during sample', cpu_percent=0, read_rate=0, write_rate=0)
            continue
        first = row['first']
        cpu = max(0, last['cpu'] - first['cpu'])
        rd = max(0, last['read'] - first['read'])
        wr = max(0, last['write'] - first['write'])
        row.update(last=last, cpu_percent=100 * cpu / elapsed, read_rate=rd / elapsed,
                   write_rate=wr / elapsed, activity='I/O active' if rd + wr else 'CPU active' if cpu > .005 else 'idle sample')
    return sorted(found.values(), key=lambda r: r['pid'])


def tail(folder, pattern):
    files = list(folder.glob(pattern)) if folder.exists() else []
    if not files:
        return None, {}
    path = max(files, key=lambda p: p.stat().st_mtime_ns)
    with path.open('rb') as stream:
        stream.seek(max(0, path.stat().st_size - 16384))
        lines = stream.read().decode('utf-8', 'replace').splitlines()
    for line in reversed(lines):
        try:
            value = json.loads(line)
            if isinstance(value, dict):
                return path, value
        except ValueError:
            pass
    return path, {}


def job_counts(path):
    if not path.exists():
        return {}
    db = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, timeout=.5)
    try:
        db.execute('PRAGMA query_only=ON')
        return dict(db.execute('SELECT state,count(*) FROM jobs GROUP BY state'))
    finally:
        db.close()


def main():
    print('Checking BibleProject processes and saved checkpoints...', flush=True)
    rows = inventory()
    by_pid = {r['pid']: r for r in rows}
    owners = lease_status()
    live_owners = [r for r in owners if r.get('live_identity') == 'unknown' or r.get('live_identity') == r.get('process_token')]
    owner = live_owners[0] if live_owners else {}
    owner_pid = owner.get('pid')
    lines = []
    details = {}
    def out(text=''):
        lines.append(text)
    def section(name):
        out(); out(name); out('-' * 100)
    out('=' * 100)
    out(' BIBLEPROJECT | LIVE WORKERS + SAVED PROGRESS | ' + datetime.now().strftime('%Y-%m-%d %I:%M:%S %p'))
    out('=' * 100)
    current = by_pid.get(owner_pid)
    out(f" ANALYTICS LEASE: PID {owner_pid} | {current['label'] if current else 'identity unconfirmed'}" if owner_pid else ' ANALYTICS LEASE: free')
    if current:
        out(f" Owner activity: {current['activity']} | read {size(current['read_rate'])}/s | write {size(current['write_rate'])}/s")
    out(' One-second live sample. Percentages below use saved checkpoints; no overall ETA is invented.')

    section(' BACKUP / RESTORE')
    recovery = [r for r in rows if any(x in ' '.join(r['command']) for x in ('recovery.archive','recovery.verify'))]
    if not recovery:
        out(' No live archive worker found.')
        folder = BASE / 'recovery/kr101-v2-20261014'
        restored = read(folder / 'restored/restore-receipt.json')
        checked = read(folder / 'restored/verification.json')
        if restored:
            out(f" Saved restore: {restored.get('state', '?')} | {restored.get('files', 0):,} files | {size(restored.get('bytes', 0))}")
            out(f" Restore receipt: {age(folder / 'restored/restore-receipt.json')}")
        if checked:
            out(' Restore verification: ' + str(checked.get('state', checked.get('ok', checked.get('passed', 'receipt present')))))
        details['recovery_saved'] = {'restore': restored, 'verification': checked}
    for row in recovery:
        args = row['command']
        folder = Path(args[args.index('--work') + 1]) if '--work' in args else BASE / 'recovery/kr101-v2-20261014'
        module = 'knowledge.library_analytics.recovery.archive' if 'knowledge.library_analytics.recovery.archive' in args else 'knowledge.library_analytics.recovery.verify'
        action = args[args.index(module) + 1] if module in args else 'archive'
        logpath, progress = tail(folder, '*.log')
        out(f" PID {row['pid']} | {action.upper()} | {row['activity']} | running for {duration(time.time() - row['created'])}")
        if 'done' in progress and 'total' in progress:
            out(' Files: ' + meter(progress['done'], progress['total']))
        out(f" Latest checkpoint: {progress.get('phase', 'not published')} | {age(logpath) if logpath else 'no log'}")
        control = folder / ('restore-control/jobs.sqlite3' if action == 'restore' else 'verify-control/jobs.sqlite3' if action == 'verify' else 'jobs.sqlite3')
        try:
            counts = job_counts(control)
            out(' Ledger: ' + ', '.join(f'{k}={v:,}' for k, v in counts.items()))
        except (sqlite3.Error, OSError) as exc:
            counts = {}; out(f' Ledger unavailable: {exc}')
        out(f" Process I/O since launch (includes reads/hashes): read {size(row.get('last', row['first'])['read'])}, written {size(row.get('last', row['first'])['write'])}")
        details['recovery'] = {'pid': row['pid'], 'progress': progress, 'job_counts': counts, 'log': str(logpath)}

    section(' REFRESH')
    folder = BASE / 'refresh'
    launch = read(folder / 'suite-launch.json')
    progress = read(folder / 'progress.json')
    suite = read(folder / 'suite-result.json')
    live = by_pid.get(launch.get('pid'))
    logpath, log = tail(folder, 'suite*.log')
    if suite.get('state') == 'complete':
        out(f" COMPLETED | target {suite.get('selective', {}).get('documents', '?')} documents | selective/clean equivalence, rollback and idempotence recorded")
        out(f" Export: {suite.get('export_files', '?')} files | {size(suite.get('export_bytes', 0))}")
    elif live:
        waiting = log.get('phase') == 'waiting-for-global-lease' and owner_pid and owner_pid != live['pid']
        out(f" PID {live['pid']} | {'WAITING for lease held by PID ' + str(owner_pid) if waiting else live['activity']}")
    else:
        out(' Recorded suite worker is not live. Saved progress is historical.')
    same = bool(live and progress.get('pid') == live['pid'] and (not progress.get('process_token') or progress.get('process_token') == launch.get('process_token')))
    if progress.get('state') == 'complete' and 'documents' in progress:
        out(f" Last completed batch: {progress['documents']:,} documents | {progress.get('mode', '?')} | {progress.get('run_id', '?')}")
        out(f" Failed/unfinished jobs in that batch: {progress.get('failed_or_unfinished_jobs', '?')} | receipt {age(folder / 'progress.json')}")
    elif progress:
        out(f" {'Current' if same else 'Previous attempt'} checkpoint (PID {progress.get('pid')}): " + meter(progress.get('visited', 0), progress.get('expected', 0)))
        out(f" Phase: {progress.get('phase', progress.get('state', '?'))} | receipt {age(folder / 'progress.json')}")
    if log and suite.get('state') != 'complete':
        out(f" Latest log: {log.get('phase', log.get('state', '?'))} | {age(logpath)}")
    details['refresh'] = {'launch': launch, 'progress': progress, 'progress_matches_live_worker': same, 'log': log}

    section(' KR-130 ARGUMENTS')
    state = read(ROOT / 'operator-state.json'); progress = read(ROOT / 'progress.json'); plan = read(ROOT / 'calibration-plan.json')
    delivered = read(ROOT / 'delivery-complete.json')
    live = by_pid.get(state.get('pid'))
    identity = process_identity(state['pid']) if state.get('pid') else None
    live = live if identity == state.get('process_token') else None
    status = state.get('state', 'unknown').upper()
    if delivered.get('state') == 'private-candidate-delivery-complete':
        status = 'COMPLETED - private candidate release'
    elif not live and identity != 'unknown' and status in ('RUNNING', 'WAITING-FOR-GLOBAL-LEASE'):
        status = 'STOPPED - stale running receipt'
    out(f" PID {state.get('pid', '-')} | {status} | {'alive' if live else 'not live'}")
    out(' Phase: ' + (delivered.get('state') or state.get('phase', '?')) + ' | receipt ' + age(ROOT / ('delivery-complete.json' if delivered else 'operator-state.json')))
    calibration = str(progress.get('run_id', '')).endswith('-calibration')
    cal = read(ROOT / 'calibration.json')
    out(' Calibration: ' + meter(cal.get('counts', cal).get('processed_documents', progress.get('processed_documents', 0) if calibration else 0), plan.get('calibration_expected_documents', 0)))
    pop = read(ROOT / 'population.json')
    out(' Population:  ' + meter(pop.get('counts', pop).get('processed_documents', 0 if calibration else progress.get('processed_documents', 0)), plan.get('declared_supported_documents', 0)))
    out(' Exports/handoff: ' + ('delivered' if read(ROOT / 'delivery-complete.json') else 'pending'))
    details['arguments'] = {'state': state, 'progress': progress}
    continuation = read(ROOT / 'continuation-state.json')
    if continuation:
        section(' AUTOMATIC CONTINUATION')
        out(' State: ' + continuation.get('state', '?'))
        for step in continuation.get('steps', []):
            out(f" {step.get('state', '?').upper():12} {step.get('label', '?')}")
        if continuation.get('error'):out(' Error: ' + continuation['error'])
        details['continuation'] = continuation

    section(' KR-140 HISTORY / LANGUAGE')
    folder = BASE / 'history-language'; progress = read(folder / 'progress.json')
    active = [r for r in rows if 'history_language' in ' '.join(r['command'])]
    for row in active:
        out(f" PID {row['pid']} | {row['activity']} | {row['label']}")
    if not active:
        out(' No live history/language worker found.')
    if progress:
        total = progress.get('eligible', 0); done = progress.get('visited', total if progress.get('state') == 'population-complete' else 0)
        out(' Saved population: ' + meter(done, total))
        out(f" State: {progress.get('state', progress.get('phase', '?'))} | receipt {age(folder / 'progress.json')}")
        if 'passed' in progress:
            out(f" Processor's recorded 'passed' flag: {progress['passed']} (not independent review)")
    else:
        out(' No progress receipt found.')
    details['history_language'] = progress

    section(' EMBEDDING / INTAKE (separate owner; does not use this analytics lease)')
    progress = read(KB / 'embedding-progress.json'); intake = read(KB / 'intake-completion.json')
    if progress:
        out(' Vectors saved: ' + meter(progress.get('indexed', 0), progress.get('total', 0)))
        out(f" Remaining: {progress.get('remaining', 0):,} | receipt PID {progress.get('pid')} | {age(KB / 'embedding-progress.json')}")
        out(f" Recorded rate: {progress.get('rate_per_second', '?')} vectors/s | state: {progress.get('state', '?')}")
        out(' Receipt PID live: ' + ('yes' if progress.get('pid') in by_pid else 'no; see actual embedding process tree below'))
    out(f" Intake state: {intake.get('state', 'no receipt')} | owner PID {intake.get('pid', '-')} | child PID {intake.get('child_pid', '-')} | {age(KB / 'intake-completion.json')}")
    details['embedding'] = progress; details['intake'] = intake

    section(' ALL MATCHING LIVE PROJECT PROCESSES (parents, workers, monitors, preview)')
    out(f" {'PID':>6} {'PARENT':>6} {'UPTIME':>9} {'CPU*':>7} {'RAM':>11} {'READ/s':>12} {'WRITE/s':>12}  ACTIVITY")
    for row in rows:
        last = row.get('last', row['first'])
        out(f" {row['pid']:>6} {row['ppid']:>6} {duration(time.time()-row['created']):>9} {row['cpu_percent']:>6.1f}% {size(last['rss']):>11} {size(row['read_rate']):>12} {size(row['write_rate']):>12}  {row['activity']}")
        out('        ' + row['label'])
        if row['label'] == 'finish_workstream.py':
            out('        cwd: ' + row['cwd'])
    out(); out(' CPU*: 100% = one busy CPU core. Idle for one second does not establish a stall.')
    out(' Scope: accessible Python/Node/CMD processes whose command or cwd names BibleProject.')
    out(' One-shot read-only status. No worker control or lease acquisition.')
    out('=' * 100)
    text = '\n'.join(lines) + '\n'
    write_json(ROOT / 'all-processes-snapshot.json', {'observed_at_unix': time.time(), 'lease': owners, 'processes': rows, 'receipts': details})
    (ROOT / 'all-processes-snapshot.txt').write_text(text, encoding='utf-8')
    print(text)


if __name__ == '__main__':
    main()
