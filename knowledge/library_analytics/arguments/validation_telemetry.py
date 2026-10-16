"""Progress observations only; no validation criteria or fact changes."""
import os
import time

from .inputs import ROOT, write_json
from ..jobs import process_identity


class ValidationProgress:
    def __init__(self, run_id, shared, total=13, path=None):
        self.path = path or ROOT / 'validation-progress.json'
        self.shared = shared
        self.last = 0
        self.value = {'run_id': run_id, 'pid': os.getpid(), 'process_token': process_identity(os.getpid()),
                      'started_at_unix': time.time(), 'state': 'running', 'completed_steps': 0,
                      'total_steps': total, 'completed_checks': {}, 'active_step': None,
                      'sqlite_activity_callbacks': 0, 'percent_of_runtime': None, 'eta': None}

    def emit(self, force=False):
        now = time.monotonic()
        if not force and now - self.last < 2:
            return
        self.value['updated_at_unix'] = time.time()
        write_json(self.path, self.value)
        self.shared.heartbeat()
        self.last = now

    def begin(self, name):
        self.value.update(active_step=name, step_started_at_unix=time.time(), sqlite_activity_callbacks=0)
        self.value.pop('witness_prefix_lookups', None)
        self.emit(True)

    def finish(self, value=None):
        self.value['completed_checks'][self.value['active_step']] = {'result': value, 'finished_at_unix': time.time()}
        self.value['completed_steps'] = len(self.value['completed_checks'])
        self.value['active_step'] = None
        self.emit(True)

    def sql_callback(self):
        self.value['sqlite_activity_callbacks'] += 1
        self.emit()
        return 0

    def witnesses(self, done, expected, passed, failed):
        self.value['witness_prefix_lookups'] = {'completed': done, 'expected': expected, 'witnesses_passed': passed, 'witnesses_failed': failed}
        self.emit()

    def terminal(self, state, error=None):
        self.value.update(state=state, finished_at_unix=time.time())
        if error is not None:
            self.value['error'] = str(error)
        self.emit(True)
