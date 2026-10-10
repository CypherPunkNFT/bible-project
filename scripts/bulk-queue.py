"""Continue the ordered bulk queue after the active TCP harvest; no AI calls."""
import argparse
import json
import msvcrt
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json


def main():
    config = load(); state = config['state_dir']; report = SITE / 'content/library/reports/bulk-acquisition'
    with (state / 'bulk-queue.lock').open('a+b') as lock:
        lock.seek(0)
        try: msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError: return 0
        path = state / 'bulk-queue.json'
        progress = json.loads(path.read_text('utf-8-sig')) if path.exists() else {'completed': [], 'failures': []}
        def status(phase, action):
            progress.update(phase=phase, state=action, pid=os.getpid(), updatedAt=datetime.now(timezone.utc).isoformat())
            write_json(path, progress)
        # The active TCP collector owns its separate lock for the whole harvest.
        status('A: TCP EEBO/ECCO/Evans', 'waiting_for_active_collector')
        last_summary = 0
        while True:
            if time.monotonic() - last_summary >= 300:
                subprocess.run([sys.executable, '-X', 'utf8', str(SITE / 'scripts/bulk-status.py')], cwd=SITE, stdout=subprocess.DEVNULL)
                last_summary = time.monotonic()
            with (state / 'bulk-tcp/collector.lock').open('a+b') as tcp:
                tcp.seek(0)
                try:
                    msvcrt.locking(tcp.fileno(), msvcrt.LK_NBLCK, 1)
                    msvcrt.locking(tcp.fileno(), msvcrt.LK_UNLCK, 1)
                    break
                except OSError: pass
            time.sleep(30)
        python = str(state / '.venv/Scripts/python.exe')
        # Reuse the shared-workspace collection implementation and its official
        # catalogues. No duplicate TCP process and no fixed 20-file test limits.
        phases = [('B: SWORD', 'sword'), ('C: CCEL', 'ccel'), ('D: Internet Archive Princeton', 'ia'), ('E: Gutenberg mirror', 'gutenberg')]
        for label, source in phases:
            if source in progress['completed']: continue
            status(label, 'downloading')
            filt = report / 'filters' / (source + '.json')
            with (state / ('bulk-' + source + '-full.log')).open('ab') as log:
                result = subprocess.run([python, '-X', 'utf8', '-u', 'knowledge/bulk_collect.py', 'collect', '--source', source, '--filter', str(filt), '--limit', '0'], cwd=SITE, stdout=log, stderr=subprocess.STDOUT)
            if result.returncode: progress['failures'].append({'source': source, 'exitCode': result.returncode})
            else: progress['completed'].append(source)
            # An existing completion monitor owns the exclusive intake lock.
            # This invocation exits harmlessly if it is already processing; that
            # monitor detects late files and refreshes again after embeddings.
            launch_intake(SITE, state)
        for source, command in [('monergism', [python, '-X', 'utf8', '-u', 'scripts/collect-expanded-libraries.py', '--source', 'monergism-library']), ('desiring-god', [python, '-X', 'utf8', '-u', 'scripts/collect-piper-books.py'])]:
            if source in progress['completed']: continue
            status('F: ' + source, 'downloading')
            with (state / ('bulk-' + source + '-full.log')).open('ab') as log:
                result = subprocess.run(command, cwd=SITE, stdout=log, stderr=subprocess.STDOUT)
            if result.returncode: progress['failures'].append({'source': source, 'exitCode': result.returncode})
            else: progress['completed'].append(source)
            launch_intake(SITE, state)
        status('A-F', 'downloads_finished_intake_processing')
        while True:
            subprocess.run([python, '-X', 'utf8', str(SITE / 'scripts/bulk-status.py')], cwd=SITE, stdout=subprocess.DEVNULL)
            completion = json.loads((state / 'intake-completion.json').read_text('utf-8-sig'))
            if completion.get('state') == 'complete':
                status('A-F', 'complete'); break
            if completion.get('state') == 'needs_attention':
                status('A-F', 'intake_needs_attention'); break
            time.sleep(60)
    return 0


def launch_intake(site, state):
    # The dedicated PowerShell completion lock guarantees one pipeline. Windows
    # process creation hides the window and survives the parent collector exit.
    with (state / 'bulk-intake-launch.log').open('ab') as log:
        subprocess.Popen(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(site / 'knowledge/finish-intake.ps1')], cwd=site, stdout=log, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS)


if __name__ == '__main__': sys.exit(main())
