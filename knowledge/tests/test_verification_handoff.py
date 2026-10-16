import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from knowledge import native_supervisor as s
from knowledge.settings import write_json


class HandoffTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.state = Path(self.tmp.name)
        self.config = dict(state_dir=self.state, db=self.state/'db', site_dir=self.state)
        self.control = dict(enabled=True, mode='embedding_only', run_id='run',
                            verification_request=dict(state='queued', run_id='run', corpus_build='build'))
        self.progress = dict(state='embedded_pending_verification', corpus_build='build', remaining=0)
        self.completion = dict(state='embedded_pending_verification', embedding=self.progress)
        write_json(self.state/'native-supervisor/control.json', self.control)

    def test_gate_and_idempotence(self):
        db = MagicMock()
        db.__enter__.return_value.execute.return_value.fetchone.return_value = ['build']
        with patch('knowledge.store.connect', return_value=db), patch.object(s, 'snapshot', return_value=([], [])):
            result = s.verification_handoff(self.config, self.control, self.progress, self.completion)
            self.assertEqual(result['mode'], 'verification_only')
            self.assertEqual(s.verification_handoff(self.config, result, self.progress, self.completion), result)

    def test_wrong_or_unfinished_receipts_refused(self):
        for changes in ({'remaining': 1}, {'corpus_build': 'other'}):
            with self.assertRaises(RuntimeError):
                s.verification_handoff(self.config, self.control, self.progress | changes, self.completion)

    def test_live_owner_prevents_transition(self):
        with patch.object(s, 'snapshot', return_value=([dict(role='owner', pid=1, parent=0, created=0)], [])), \
                patch.object(s, 'verification_handoff') as handoff:
            write_json(self.state/'embedding-progress.json', self.progress)
            write_json(self.state/'intake-completion.json', self.completion)
            s.tick(self.config)
            handoff.assert_not_called()

    def test_running_pass_never_launches_verification(self):
        progress = dict(state='running', pid=2, updated_at=s.stamp())
        completion = dict(state='embedding', pid=1, updated_at=s.stamp())
        rows = [dict(role='owner', pid=1, parent=0, created=0), dict(role='embed', pid=2, parent=1, created=0)]
        write_json(self.state/'embedding-progress.json', progress)
        write_json(self.state/'intake-completion.json', completion)
        with patch.object(s, 'snapshot', return_value=(rows, [])), patch.object(s, 'launch_owner') as launch:
            self.assertEqual(s.tick(self.config)['state'], 'healthy')
            launch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
