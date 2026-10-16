"""Bound the explicitly authorized live recovery test to a few saved batches."""
import json
import os
import time


class RecoveryTestPause(RuntimeError):
    pass


def check(indexed, stale=0):
    raw = os.environ.get('BIBLE_RECOVERY_TEST_SCOPE')
    if not raw:
        return
    scope = json.loads(raw)
    if stale:
        raise RecoveryTestPause('Recovery test refuses stale-vector reconciliation')
    if time.time() >= scope['deadline'] or indexed >= scope['max_indexed']:
        raise RecoveryTestPause('Controlled recovery test reached its time/vector bound')
