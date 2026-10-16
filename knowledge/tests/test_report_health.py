from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import tempfile
import unittest

from knowledge import campaign_coordinator as coordinator
from knowledge.report_health import observed_status, process_status
from knowledge.settings import write_json


def check_observation(process, age, state):
    now = datetime.now(timezone.utc)
    original = dict(state='running', pid=123, indexed=8550120, remaining=3029415,
                    rate_per_second=25.11, updated_at=(now-timedelta(seconds=age)).isoformat())
    result = observed_status(original, 'embedding', Path('.'), now,
                             probe=lambda *args: process)
    assert result['state'] == state
    assert result['updated_at'] == original['updated_at']
    assert result['indexed'] == original['indexed']
    assert original['state'] == 'running'
    assert (result['rate_per_second'] is not None) == (state == 'running')


def check_reused_pid():
    with patch('psutil.Process') as process:
        process.return_value.is_running.return_value = True
        process.return_value.create_time.return_value = 200
        assert process_status({'pid': 123, 'process_created': 100}, 'completion', Path('.')) == 'identity_mismatch'


def check_report_removes_previous_eta_without_changing_checkpoints(tmp_path):
    config = dict(state_dir=tmp_path/'state', site_dir=tmp_path/'site')
    checkpoint = dict(state='running', pid=123, updated_at=datetime.now(timezone.utc).isoformat(),
                      total=11579535, indexed=8550120, remaining=3029415, rate_per_second=25.11)
    path = config['state_dir']/'embedding-progress.json'
    write_json(path, checkpoint)
    write_json(config['state_dir']/'intake-completion.json', dict(checkpoint, state='embedding'))
    before = path.read_bytes()
    out, _ = coordinator.locations(config)
    # Exercise report serialization and rendering with a live process, then its disappearance.
    with patch('psutil.Process') as process:
        process.return_value.is_running.return_value = True
        process.return_value.create_time.return_value = 1
        process.return_value.cmdline.return_value = ['python', '-m', 'knowledge', 'embed']
        process.return_value.cwd.return_value = str(config['site_dir'])
        coordinator.report(config)
        assert 'currentPassETA' in coordinator.read(out/'summary.json')
        import psutil
        process.side_effect = psutil.NoSuchProcess(123)
        coordinator.report(config)
    summary = coordinator.read(out/'summary.json')
    assert summary['embedding']['state'] == 'stopped'
    assert summary['completion']['state'] == 'stopped'
    assert 'currentPassETA' not in summary
    assert 'Worker state: stopped' in (out/'REPORT.md').read_text('utf-8')
    assert path.read_bytes() == before


class ReportHealthTests(unittest.TestCase):
    def test_observations(self):
        for process, age, state in [
            ('missing', 1, 'stopped'), ('identity_mismatch', 1, 'stopped'),
            ('alive', 601, 'stale'), ('unknown', 1, 'unknown'), ('alive', 1, 'running')]:
            with self.subTest(process=process, age=age):
                check_observation(process, age, state)

    def test_reused_pid(self):
        check_reused_pid()

    def test_report(self):
        with tempfile.TemporaryDirectory() as folder:
            check_report_removes_previous_eta_without_changing_checkpoints(Path(folder))


if __name__ == '__main__':
    unittest.main()
