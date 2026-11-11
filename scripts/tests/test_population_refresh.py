"""A provenance change must refresh derived population data, never silently restamp it."""
import hashlib
import importlib.util

from pathlib import Path

spec = importlib.util.spec_from_file_location('population_refresh', Path(__file__).parents[1] / 'refresh-scholar-population.py')
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


def test_detects_modified_and_missing_inputs(tmp_path):
    source = tmp_path / 'usage.json'
    source.write_bytes(b'original')
    snapshot = {'reconciliation': {'inputs': {'usage.json': hashlib.sha256(source.read_bytes()).hexdigest(), 'intake': {'scope': 'read-only'}}}}
    assert refresh.changed_inputs(tmp_path, snapshot) == []
    source.write_bytes(b'updated')
    assert refresh.changed_inputs(tmp_path, snapshot) == ['usage.json']
    source.unlink()
    assert refresh.changed_inputs(tmp_path, snapshot) == ['usage.json']
