"""Isolated SQL/acceptance-equivalence and real callback integration checks."""
import ast
import json
import sqlite3
import tempfile
from pathlib import Path

from .inputs import ROOT, write_json
from .validation_telemetry import ValidationProgress


def sql_constants(tree):
    return {n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)
            and n.value.startswith(('SELECT ', 'PRAGMA '))}


def assignment(tree, name):
    return next(ast.dump(n.value, include_attributes=False) for n in ast.walk(tree)
                if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))


def main():
    before = ast.parse((ROOT / 'validation-loaded-57132.py').read_text('utf-8'))
    after = ast.parse(Path(__file__).with_name('verify.py').read_text('utf-8'))
    assert sql_constants(before) == sql_constants(after), 'Validation SQL changed'
    assert assignment(before, 'ok') == assignment(after, 'ok'), 'Acceptance predicate changed'
    assert assignment(before, 'result') == assignment(after, 'result'), 'Result contract changed'
    class LeaseFixture:
        calls = 0
        def heartbeat(self):
            self.calls += 1
    with tempfile.TemporaryDirectory(prefix='kr130-telemetry-') as folder:
        path = Path(folder) / 'progress.json'
        lease = LeaseFixture(); telemetry = ValidationProgress('isolated-fixture', lease, total=1, path=path)
        db = sqlite3.connect(':memory:')
        telemetry.begin('real_sql_callback')
        db.set_progress_handler(telemetry.sql_callback, 100)
        result = db.execute('WITH RECURSIVE n(x) AS (VALUES(0) UNION ALL SELECT x+1 FROM n WHERE x<9999) SELECT sum(x) FROM n').fetchone()[0]
        assert result == 49995000
        telemetry.finish(result); telemetry.terminal('complete')
        saved = json.loads(path.read_text('utf-8'))
        assert saved['completed_steps'] == saved['total_steps'] == 1
        assert saved['state'] == 'complete' and saved['sqlite_activity_callbacks'] > 0
        assert lease.calls > 0 and saved['completed_checks']['real_sql_callback']['result'] == result
        db.close()
    proof = {'ok': True, 'validation_sql_literals_unchanged': len(sql_constants(after)),
             'acceptance_predicate_unchanged': True, 'result_contract_unchanged': True,
             'real_sqlite_progress_callback_and_atomic_receipt': 'passed',
             'live_population_validation_rerun': False, 'active_worker_restarted': False}
    write_json(ROOT / 'tests/validation-telemetry-check.json', proof)
    print(json.dumps(proof, indent=2))


if __name__ == '__main__':
    main()
