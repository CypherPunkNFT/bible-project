import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone

from knowledge import native_supervisor as supervisor
from knowledge.settings import write_json


class NativeSupervisorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.config = dict(state_dir=Path(self.temp.name), site_dir=Path(self.temp.name)/'site')
        self.folder = self.config['state_dir']/'native-supervisor'
        self.now = 10000
        self.owner = dict(pid=1, parent=0, created=100, role='owner')
        self.worker = dict(pid=2, parent=1, created=100, role='embed')
        self.completion = dict(pid=1, state='embedding', updated_at=self.at(9990))
        self.progress = dict(pid=2, state='running', updated_at=self.at(9990))

    def at(self, seconds):
        return datetime.fromtimestamp(seconds, timezone.utc).isoformat()

    def decision(self, rows, unknown=None):
        return supervisor.decide(self.progress, self.completion, rows, unknown or [], self.now)[0]

    def test_missing_owner_and_worker(self):
        self.assertEqual(self.decision([]), 'recover')

    def test_stale_heartbeats(self):
        rows = [self.owner, self.worker]
        self.assertEqual(self.decision(rows), 'healthy')
        self.completion['updated_at'] = self.at(9800)
        self.assertEqual(self.decision(rows), 'recover')
        self.completion['updated_at'] = self.at(9990)
        self.progress['updated_at'] = self.at(8000)
        self.assertEqual(self.decision(rows), 'recover')
        self.progress['state'] = 'optimizing'
        self.assertEqual(self.decision(rows), 'busy')

    def test_protected_cases(self):
        self.assertEqual(self.decision([self.worker]), 'attention')
        self.assertEqual(self.decision([], [99]), 'attention')
        self.assertEqual(self.decision([dict(self.worker, role='build')]), 'busy')
        self.assertEqual(self.decision([dict(self.worker, role='verify')]), 'busy')
        self.assertEqual(self.decision([dict(self.owner, created=9999)]), 'starting')
        self.completion['state'] = self.progress['state'] = 'complete'
        self.assertEqual(self.decision([]), 'complete')

    def test_paused_cannot_launch_or_terminate(self):
        with patch.object(supervisor, 'snapshot', return_value=([], [])), \
             patch.object(supervisor, 'terminate_owned') as stop, \
             patch.object(supervisor, 'launch_owner') as launch:
            result = supervisor.tick(self.config)
            self.assertEqual(result['state'], 'paused')
            stop.assert_not_called()
            launch.assert_not_called()
            self.assertTrue(supervisor.read(self.folder/'alert.json')['active'])

    def test_attempt_budget_persists_across_ticks_and_backoff(self):
        write_json(self.folder/'control.json', {'enabled': True})
        with patch.object(supervisor, 'snapshot', return_value=([], [])), \
             patch.object(supervisor, 'terminate_owned'), \
             patch.object(supervisor, 'launch_owner', side_effect=RuntimeError('simulated launch failure')) as launch, \
             patch.object(supervisor.time, 'time', return_value=10000) as clock:
            self.assertEqual(supervisor.tick(self.config)['state'], 'attention')
            self.assertEqual(supervisor.tick(self.config)['state'], 'backoff')
            clock.return_value = 11000
            supervisor.tick(self.config)
            clock.return_value = 12000
            supervisor.tick(self.config)
            clock.return_value = 14000
            self.assertEqual(supervisor.tick(self.config)['state'], 'exhausted')
            self.assertEqual(launch.call_count, 3)
            self.assertEqual(supervisor.read(self.folder/'recovery.json')['attempts'], 3)
            self.assertEqual(supervisor.read(self.folder/'alert.json')['severity'], 'error')

    def test_legacy_pause_is_honored(self):
        write_json(self.folder/'control.json', {'enabled': True})
        (self.config['state_dir']/'watchdog.pause').touch()
        with patch.object(supervisor, 'snapshot', return_value=([], [])), patch.object(supervisor, 'launch_owner') as launch:
            self.assertEqual(supervisor.tick(self.config)['state'], 'paused')
            launch.assert_not_called()

    def test_reused_pid_is_not_terminated(self):
        with patch.object(supervisor, 'snapshot', return_value=([self.owner], [])), patch('psutil.Process') as process:
            process.return_value.create_time.return_value = 101
            with self.assertRaisesRegex(RuntimeError, 'PID was reused'):
                supervisor.terminate_owned(self.config, [self.owner])
            process.return_value.terminate.assert_not_called()

    def test_changed_inventory_prevents_termination(self):
        with patch.object(supervisor, 'snapshot', return_value=([self.worker], [])), patch('psutil.Process') as process:
            with self.assertRaisesRegex(RuntimeError, 'inventory changed'):
                supervisor.terminate_owned(self.config, [self.owner])
            process.assert_not_called()


if __name__ == '__main__':
    unittest.main()
