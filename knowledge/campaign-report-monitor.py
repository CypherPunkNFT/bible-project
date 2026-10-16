"""Keep campaign reports current without relaunching blocked PowerShell recovery.

Completion currently needs attention. This reporter does not own acquisitions,
vectors, builds, or automatic completion retries.
"""
import ctypes
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timezone

SITE = Path(__file__).resolve().parent.parent
STATE = SITE.parent / 'KnowledgeBase'
RUNTIME = STATE / 'campaign-coordination'
PYTHON = STATE / '.venv' / 'Scripts' / 'python.exe'

def write_state(phase, error=None):
    path = RUNTIME / 'monitor-state.json'
    temporary = path.with_name(f'{path.name}.{os.getpid()}.tmp')
    temporary.write_text(json.dumps({'pid': os.getpid(), 'updated_at': datetime.now(timezone.utc).isoformat(),
        'phase': phase, 'launcher': 'native_python', 'automatic_completion_retries': False,
        'error': error}, indent=2), encoding='utf8')
    temporary.replace(path)

def main():
    # Match the original monitor's exclusive Windows file handle.
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    create = kernel.CreateFileW
    create.argtypes = [ctypes.c_wchar_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p,
        ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p]
    create.restype = ctypes.c_void_p
    handle = create(str(RUNTIME / 'monitor.lock'), 0xC0000000, 0, None, 4, 0x80, None)
    if handle == ctypes.c_void_p(-1).value:
        if ctypes.get_last_error() in (32, 33):
            return 0
        raise ctypes.WinError(ctypes.get_last_error())
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    os.environ['BIBLE_CAMPAIGN_MONITOR_PID'] = str(os.getpid())
    try:
        while True:
            subprocess.run([str(PYTHON), '-m', 'knowledge.campaign_coordinator', 'report'],
                cwd=SITE, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
            summary = json.loads((RUNTIME / 'summary.json').read_text(encoding='utf-8-sig'))
            if summary.get('state') == 'verified_complete':
                subprocess.run([str(PYTHON), str(SITE / 'knowledge/campaign_stocktake.py')],
                    cwd=SITE, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
                subprocess.run([str(PYTHON), '-m', 'knowledge.campaign_coordinator', 'report'],
                    cwd=SITE, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
                write_state('verified_complete')
                return 0
            write_state('reporting_completion_needs_attention' if summary.get('completion', {}).get('state') == 'needs_attention'
                else 'monitoring_completion_and_later_acquisitions')
            time.sleep(60)
    except Exception as error:
        write_state('needs_attention', str(error))
        raise
    finally:
        kernel.CloseHandle(handle)

if __name__ == '__main__':
    sys.exit(main())
