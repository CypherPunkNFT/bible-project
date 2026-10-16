"""Verify removal semantics and the large predicate on disposable Lance tables."""
import hashlib

import pytest

from knowledge.vectors import reconcile_vectors, reconcile_fragment_vectors, vector_ids


def digest(value):
    return hashlib.sha256(str(value).encode()).hexdigest()


class Recorder:
    def __init__(self):
        self.deletions = []

    def delete(self, predicate):
        self.deletions.append(predicate)


def test_bulk_transactions_keep_active_ids():
    kept = {digest("kept")}
    stale = {digest(i) for i in range(100001)}
    target = Recorder()
    progress = []
    assert reconcile_vectors(target, kept | stale, kept,
                             lambda *args: progress.append(args)) == kept
    assert len(target.deletions) == 2
    assert progress == [(0, 100001), (100000, 100001), (100001, 100001)]
    assert all(next(iter(kept)) not in query for query in target.deletions)


def test_invalid_ids_fail_before_any_deletion():
    target = Recorder()
    with pytest.raises(ValueError, match="SHA-256"):
        reconcile_vectors(target, {digest(1), "' OR true"}, set(), lambda *args: None)
    assert target.deletions == []


def test_failed_commit_does_not_report_removal():
    class Failed:
        def delete(self, predicate):
            raise RuntimeError("uncommitted")
    progress = []
    with pytest.raises(RuntimeError, match="uncommitted"):
        reconcile_vectors(Failed(), {digest(1)}, set(), lambda *args: progress.append(args))
    assert progress == [(0, 1)]


def test_real_lance_bulk_delete_retains_vectors_and_restart_is_idempotent(tmp_path):
    import lancedb
    import pyarrow as pa
    connection = lancedb.connect(str(tmp_path / "vectors"))
    records = [{"id": digest(i), "vector": [float(i), 1.0, 2.0, 3.0], "kind": "library"}
               for i in range(200)]
    target = connection.create_table("passages", pa.Table.from_pylist(records))
    active = {digest(i) for i in range(0, 200, 2)} | {digest("future")}
    # Absent stale IDs exercise the full 100,000-ID predicate parser.
    present = vector_ids(target) | {digest(i) for i in range(200, 100100)}
    assert len(present - active) == 100000
    progress = []
    kept = reconcile_vectors(target, present, active, lambda *args: progress.append(args))
    expected = [row for row in records if row["id"] in active]
    actual = target.to_lance().to_table().to_pylist()
    assert sorted(actual, key=lambda row: row["id"]) == sorted(expected, key=lambda row: row["id"])
    assert vector_ids(target) == kept
    assert progress == [(0, 100000), (100000, 100000)]
    restart_progress = []
    assert reconcile_vectors(target, vector_ids(target), active,
                             lambda *args: restart_progress.append(args)) == kept
    assert restart_progress == [(0, 0)]
    assert target.count_rows() == 100


def fragmented_table(tmp_path):
    import lancedb
    import pyarrow as pa
    connection = lancedb.connect(str(tmp_path / "fragments"))
    rows = [{"id": digest(i), "vector": [float(i), 1.0, 2.0, 3.0], "kind": "library"}
            for i in range(300)]
    target = connection.create_table("passages", pa.Table.from_pylist(rows[:100]))
    for start in (100, 200):
        target.add(pa.Table.from_pylist(rows[start:start + 100]))
    target.delete(f"id = '{digest(101)}'")
    return target, [row for row in rows if row["id"] != digest(101)]


def test_fragment_commit_preserves_exact_vectors_prior_deletions_and_resume(tmp_path):
    target, rows = fragmented_table(tmp_path)
    # First fragment fully removed, second partially removed, third untouched.
    active = {row['id'] for row in rows if row['vector'][0] >= 200
              or (row['vector'][0] >= 100 and row['vector'][0] % 2 == 0)}
    progress = []
    kept = reconcile_fragment_vectors(target, vector_ids(target), active,
                                      lambda removed, total, **detail: progress.append((removed, total, detail)))
    expected = [row for row in rows if row["id"] in active]
    actual = target.to_lance().to_table().to_pylist()
    assert sorted(actual, key=lambda row: row["id"]) == sorted(expected, key=lambda row: row["id"])
    assert kept == active
    assert progress[-1][0] == 149
    assert progress[-1][2]['valid_vectors_preserved'] == 150
    assert progress[-1][2]['affected_fragments'] == 2
    version = target.to_lance().version
    assert reconcile_fragment_vectors(target, kept, active, lambda *args, **kwargs: None) == kept
    assert target.to_lance().version == version


def test_uncommitted_fragment_preparation_preserves_published_vectors(tmp_path, monkeypatch):
    import lance
    target, rows = fragmented_table(tmp_path)
    present = vector_ids(target)
    active = present - {digest(0), digest(200)}
    version = target.to_lance().version
    def fail(*args, **kwargs):
        raise RuntimeError("fixture commit failed")
    monkeypatch.setattr(lance.LanceDataset, 'commit', fail)
    with pytest.raises(RuntimeError, match="fixture commit failed"):
        reconcile_fragment_vectors(target, present, active, lambda *args, **kwargs: None)
    target.checkout_latest()
    assert target.to_lance().version == version
    assert vector_ids(target) == present
    assert target.to_lance().to_table().to_pylist() == rows


def test_missing_locations_fail_before_fragment_preparation(tmp_path):
    target, rows = fragmented_table(tmp_path)
    version = target.to_lance().version
    with pytest.raises(RuntimeError, match="locations"):
        reconcile_fragment_vectors(target, vector_ids(target) | {digest('absent')},
                                   set(), lambda *args, **kwargs: None)
    assert target.to_lance().version == version
    assert target.to_lance().to_table().to_pylist() == rows
