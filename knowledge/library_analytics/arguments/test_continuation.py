"""Finite owner continuation must preserve gates, code identities and failures."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from . import continuation as c
from .inputs import sha


class ContinuationTests(unittest.TestCase):
    def test_matching_verified_delivery_required(self):
        config = {'after_kr130_run': 'wanted'}
        for delivered in ({}, {'run_id': 'wrong', 'state': 'private-candidate-delivery-complete', 'release_verification': True},
                          {'run_id': 'wanted', 'state': 'private-candidate-delivery-complete', 'release_verification': False}):
            with self.assertRaises(RuntimeError):c.require_delivery(config, delivered)
        c.require_delivery(config, {'run_id': 'wanted', 'state': 'private-candidate-delivery-complete', 'release_verification': True})

    def test_changed_owner_code_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'owner.py';source.write_text('original', encoding='utf-8')
            step = {'code_proofs': [{'path': str(source), 'sha256': sha(source)}]}
            source.write_text('changed', encoding='utf-8')
            with self.assertRaises(RuntimeError):c.require_code(step)

    def test_real_child_failure_stops_subsequent_steps(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory);(folder / 'population.json').write_text('{}', encoding='utf-8')
            (folder / 'delivery-complete.json').write_text(json.dumps({'run_id': 'wanted', 'state': 'private-candidate-delivery-complete', 'release_verification': True}), encoding='utf-8')
            good = folder / 'first.py';bad = folder / 'failed.py';later = folder / 'never.py'
            good.write_text('from pathlib import Path\nPath("first-ran").touch()\n', encoding='utf-8')
            bad.write_text('raise SystemExit(3)\n', encoding='utf-8')
            later.write_text('from pathlib import Path\nPath("should-not-exist").touch()\n', encoding='utf-8')
            steps = [{'label': p.stem, 'family': 'refresh', 'command': [sys.executable, '-B', str(p)],
                      'code_proofs': [{'path': str(p), 'sha256': sha(p)}]} for p in (good, bad, later)]
            config = folder / 'config.json';state = folder / 'state.json'
            config.write_text(json.dumps({'enabled': True, 'after_kr130_run': 'wanted', 'steps': steps}), encoding='utf-8')
            with patch.multiple(c, ROOT=folder, CONFIG=config, STATE=state, WEBSITE=folder), patch.object(c, 'live_foreign_owner', return_value=[]):
                with self.assertRaisesRegex(RuntimeError, 'exit 3'):c.run()
                with self.assertRaisesRegex(RuntimeError, 'exit 3'):c.run()
            self.assertTrue((folder / 'first-ran').exists());self.assertFalse((folder / 'should-not-exist').exists())
            result = json.loads(state.read_text('utf-8'))
            self.assertEqual(result['state'], 'failed');self.assertEqual([s['state'] for s in result['steps']], ['complete', 'failed'])
            self.assertTrue(result['steps'][0]['reused_completed_step'])

    def test_runtime_dependency_is_child_scoped_and_hash_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            module=Path(directory)/'typing_extensions.py';module.write_text('fixture',encoding='utf-8')
            config={'recovery_runtime_dependency':{'path':str(module),'sha256':sha(module)}}
            self.assertIsNone(c.child_environment(config,'refresh'))
            self.assertEqual(c.child_environment(config,'recovery')['PYTHONPATH'],directory)
            module.write_text('changed',encoding='utf-8')
            with self.assertRaises(RuntimeError):c.child_environment(config,'recovery')


if __name__ == '__main__':unittest.main()
