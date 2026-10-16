import json
import os
import unittest
from unittest.mock import patch

from knowledge.recovery_test_scope import check, RecoveryTestPause


class RecoveryTestScopeTests(unittest.TestCase):
    def test_normal_runs_are_unaffected(self):
        with patch.dict(os.environ, {}, clear=True):
            check(999, stale=3)

    def test_test_run_bounds(self):
        with patch.dict(os.environ, {'BIBLE_RECOVERY_TEST_SCOPE': json.dumps({'deadline': 200, 'max_indexed': 100})}), patch('time.time', return_value=100):
            check(99)
            with self.assertRaises(RecoveryTestPause):
                check(100)
            with self.assertRaises(RecoveryTestPause):
                check(1, stale=1)
        with patch.dict(os.environ, {'BIBLE_RECOVERY_TEST_SCOPE': json.dumps({'deadline': 50, 'max_indexed': 100})}), patch('time.time', return_value=100):
            with self.assertRaises(RecoveryTestPause):
                check(1)


if __name__ == '__main__':
    unittest.main()
