"""Temporary Windows system-sleep request for this private completion pipeline."""
import ctypes
import json
import os
import time
from datetime import datetime,timezone
from .settings import load,write_json


def main():
    import msvcrt
    state=load()['state_dir']
    with (state/'watchdog-awake.lock').open('a+b') as lock:
        lock.seek(0)
        try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        except OSError:return
        api=ctypes.windll.kernel32.SetThreadExecutionState
        api.argtypes=[ctypes.c_uint];api.restype=ctypes.c_uint
        required=0x80000000|0x00000001  # continuous + system; display may turn off
        if not api(required):raise ctypes.WinError()
        reason='running'
        def read(path):
            try:return json.loads(path.read_text(encoding='utf-8-sig'))
            except (OSError,ValueError):return {}
        try:
            while True:
                if (state/'watchdog.pause').exists():reason='paused';break
                progress=read(state/'embedding-progress.json')
                completion=read(state/'intake-completion.json')
                campaign=read(state/'campaign-coordination/summary.json')
                if progress.get('state')=='complete' and completion.get('state')=='complete' and (not campaign or campaign.get('state')=='verified_complete'):
                    reason='verified_complete';break
                write_json(state/'watchdog-awake.json',dict(pid=os.getpid(),systemSleepBlocked=True,displaySleepAllowed=True,
                    embeddingState=progress.get('state'),indexed=progress.get('indexed'),updated_at=datetime.now(timezone.utc).isoformat()))
                time.sleep(30)
        finally:
            api(0x80000000)
            write_json(state/'watchdog-awake.json',dict(pid=os.getpid(),systemSleepBlocked=False,reason=reason,updated_at=datetime.now(timezone.utc).isoformat()))


if __name__=='__main__':main()
