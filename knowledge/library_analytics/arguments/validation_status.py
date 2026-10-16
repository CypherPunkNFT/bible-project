"""One-shot process-identity, activity and nonblocking validation stack check."""
import ast
import hashlib
import json
import re
import shutil
import subprocess
import time
from pathlib import Path

import psutil

from .inputs import ROOT, read, write_json
from ..jobs import process_identity


def frame_progress(source, line):
    tree = ast.parse(source)
    result = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'checks' for t in node.targets) and isinstance(node.value, ast.Dict):
            result['primary_sql_check_count'] = len(node.value.keys)
            if line > node.end_lineno:
                result['primary_sql_checks_completed'] = len(node.value.keys)
            for index, (key, value) in enumerate(zip(node.value.keys, node.value.values)):
                if value.lineno <= line <= value.end_lineno:
                    result.update(current_check=ast.literal_eval(key), primary_sql_checks_completed=index,
                                  primary_sql_check_ordinal=index + 1, ordinal_is_not_time_percentage=True)
        if isinstance(node, ast.Assign) and node.lineno <= line <= node.end_lineno:
            for target in node.targets:
                if isinstance(target, ast.Subscript) and isinstance(target.value, ast.Name) and target.value.id == 'checks' and isinstance(target.slice, ast.Constant):
                    result['current_check'] = target.slice.value
                elif isinstance(target, ast.Name) and target.id == 'kinds':
                    result['current_check'] = 'rhetorical_kind_counts'
        if isinstance(node, ast.For) and isinstance(node.target, ast.Name) and node.target.id == 'kind':
            if node.lineno <= line <= node.end_lineno:
                result['current_check'] = 'source_witness_reconstruction'
            if line > node.end_lineno:
                result['source_reconstruction_loop_finished'] = True
    return result


def main():
    verified_path = ROOT / 'population-verification.json'
    if verified_path.exists():
        verified = read(verified_path)
        population = read(ROOT / 'population.json')
        if verified.get('run_id') == population.get('run_id') and verified.get('ok') is True:
            witnesses = verified.get('witnesses', {})
            print('\nKR-130 VALIDATION: COMPLETED - 100%')
            print('Run: ' + verified['run_id'])
            print(f"Source witnesses: {witnesses.get('passed', '?')} passed, {witnesses.get('failed', '?')} failed")
            print('SQLite integrity: ' + str(verified.get('checks', {}).get('sqlite_quick_check')))
            print('This validates storage/locations; content-quality acceptance is separate.')
            return
    state = read(ROOT / 'operator-state.json')
    pid = state['pid']; token = state['process_token']
    if process_identity(pid) != token:
        print(f'KR-130 worker PID {pid} is stopped or its identity cannot be confirmed.')
        return
    proc = psutil.Process(pid)
    start = time.monotonic(); cpu = sum(proc.cpu_times()[:2]); io = proc.io_counters()
    time.sleep(2)
    cpu_delta = sum(proc.cpu_times()[:2]) - cpu
    latest_io = proc.io_counters(); seconds = time.monotonic() - start
    if process_identity(pid) != token:
        raise RuntimeError('Worker identity changed during observation')
    result = {'observed_at_unix': time.time(), 'pid': pid, 'process_token': token,
              'identity_confirmed': True, 'phase': state.get('phase'),
              'sample_seconds': seconds, 'cpu_seconds_added': cpu_delta,
              'read_bytes_added': latest_io.read_bytes - io.read_bytes,
              'write_bytes_added': latest_io.write_bytes - io.write_bytes,
              'rss_bytes': proc.memory_info().rss,
              'progress_percent': None, 'eta': None}
    spy = shutil.which('py-spy')
    if spy:
        stack = subprocess.run([spy, 'dump', '--pid', str(pid), '--nonblocking', '--full-filenames'],
                               capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=10)
        result['stack_command_exit'] = stack.returncode
        result['stack'] = stack.stdout if stack.returncode == 0 else stack.stderr
        match = re.search(r'\bverify \(([^\r\n]+verify\.py):(\d+)\)', stack.stdout)
        if match:
            path = Path(match[1]); line = int(match[2])
            # A disk edit does not replace code already loaded by an active
            # process. Bind an explicit loaded snapshot before editing verify.
            binding_path = ROOT / 'validation-loaded-code.json'
            binding = read(binding_path) if binding_path.exists() else {}
            if binding.get('pid') == pid and binding.get('process_token') == token:
                path = Path(binding['snapshot'])
                result['source_binding'] = 'explicit pre-edit loaded-code snapshot'
            else:
                result['source_binding'] = 'current disk source; loaded-version equivalence unproved'
            source = path.read_text('utf-8')
            result.update(source_path=str(path), source_sha256=hashlib.sha256(source.encode()).hexdigest(), stack_line=line)
            result.update(frame_progress(source, line))
            # Named-step accounting, never an estimate of scan/runtime fraction.
            current = result.get('current_check')
            finished = {'rhetorical_kind_counts': 9, 'source_witness_reconstruction': 10,
                        'sqlite_quick_check': 11, 'document_sum_statement_count': 12}.get(current)
            if finished is None and result.get('primary_sql_check_count') == 8 and 'primary_sql_check_ordinal' in result:
                finished = result['primary_sql_checks_completed'] + 1
            if finished is not None:
                result.update(validation_steps_completed=finished, validation_step_count=13,
                              check_count_fraction=finished/13)
    progress_path = ROOT / 'validation-progress.json'
    if progress_path.exists():
        progress = read(progress_path)
        if progress.get('pid') == pid and progress.get('process_token') == token:
            result['instrumented_progress'] = progress
            result.update(current_check=progress.get('active_step'), validation_steps_completed=progress.get('completed_steps'),
                          validation_step_count=progress.get('total_steps'))
    write_json(ROOT / 'validation-live-check.json', result)
    print('\n' + '=' * 72)
    print(f" KR-130 VALIDATION | PID {pid} | IDENTITY CONFIRMED")
    print('=' * 72)
    print(' Phase: ' + str(result['phase']))
    if 'validation_steps_completed' in result:
        completed = result['validation_steps_completed'];total = result['validation_step_count']
        print(f" Validation steps finished: {completed} / {total} ({completed/total:.1%} by check count)")
    if result.get('current_check'):
        print(f" Current check: {result['current_check']}")
        if 'primary_sql_checks_completed' in result:
            print(f" Primary SQL checks returned: {result['primary_sql_checks_completed']} / {result['primary_sql_check_count']}")
        if result.get('source_reconstruction_loop_finished'):
            print(' Source witness loop finished. Final validation pass/fail is pending.')
        else:
            print(' Source reconstruction/final integrity work is not yet confirmed complete.')
    elif result.get('instrumented_progress'):
        p = result['instrumented_progress']
        print(f" Current check: {p.get('active_step')} | finished steps: {p.get('completed_steps')} / {p.get('total_steps')}")
    else:
        print(' Current check: unavailable; phase shown above comes from the saved receipt.')
    print(f" Measured over {seconds:.1f}s: CPU +{cpu_delta:.3f}s, read +{result['read_bytes_added']/1048576:,.1f} MiB, write +{result['write_bytes_added']/1048576:,.1f} MiB")
    print(f" Memory: {result['rss_bytes']/1048576:,.1f} MiB")
    print(' Check counts are not elapsed-time percentages. No ETA is established.')
    print(' Full receipt: ' + str(ROOT / 'validation-live-check.json'))
    print('=' * 72)


if __name__ == '__main__':
    main()
