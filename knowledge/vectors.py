"""Content-addressed, resumable LanceDB indexing with explicit model identity."""
import json
import math
import os
import time
from datetime import datetime, timezone
from .encoder import request_vectors, GPUUnavailable
from .settings import write_json
from .store import connect


def table(config, create=False):
    import lancedb
    import pyarrow as pa
    path = config["vectors"]
    if not create and not path.exists():
        return None
    connection = lancedb.connect(str(path))
    if "passages" in connection.table_names():
        return connection.open_table("passages")
    if not create:
        return None
    schema = pa.schema([pa.field("id", pa.string()), pa.field("vector", pa.list_(pa.float32(), config["embedding"]["dimensions"])),
                        *[pa.field(key, pa.string()) for key in ("kind", "edition", "language", "book")]])
    return connection.create_table("passages", schema=schema)


def vector_ids(vectors):
    return set(vectors.to_lance().to_table(columns=["id"]).column("id").to_pylist()) if vectors is not None else set()


def missing_rows(db, missing, batch_size=64):
    """Fetch only unfinished text through the existing unique passage-ID index.

    Sorting IDs in memory gives deterministic batches without sorting the full
    corpus and its text into a many-gigabyte SQLite temporary file.
    """
    identifiers = sorted(missing)
    for offset in range(0, len(identifiers), batch_size):
        group = identifiers[offset:offset+batch_size]
        rows = list(db.execute('SELECT id,embed_text,kind,edition,language,book FROM chunks WHERE id IN (' +
                              ','.join('?' for _ in group) + ')', group))
        if {row['id'] for row in rows} != set(group) or len(rows) != len(group):
            raise RuntimeError('Pending passage IDs changed during embedding')
        yield from rows


def reconcile_vectors(vectors, present, active, progress, batch_size=100000):
    """Remove obsolete IDs in bounded bulk transactions, retaining valid vectors.

    Each delete scans the table. Small batches repeat that scan hundreds of times
    on the full library. A 100,000-ID bound keeps the predicate below 7 MB.
    """
    if batch_size < 1 or batch_size > 100000:
        raise ValueError("Reconciliation batch size must be between 1 and 100000")
    stale = sorted(present - active)
    # Validate the entire removal set before the first mutation.
    if any(not isinstance(value, str) or len(value) != 64
           or any(char not in "0123456789abcdef" for char in value) for value in stale):
        raise ValueError("Obsolete vector IDs must be SHA-256 hex digests")
    progress(0, len(stale))
    for start in range(0, len(stale), batch_size):
        batch = stale[start:start + batch_size]
        values = ",".join("'" + value + "'" for value in batch)
        vectors.delete(f"id IN ({values})")
        progress(min(start + len(batch), len(stale)), len(stale))
    return present & active


def reconcile_fragment_vectors(vectors, present, active, progress):
    """Locate obsolete rows once, prepare affected fragments, commit once.

    Lance 0.23 reparses a delete predicate for every fragment. Passing the full
    removal list to every fragment is expensive even with a single transaction.
    Each fragment here receives only its own obsolete IDs. Data files are kept;
    deletion metadata is published atomically through Lance's Delete operation.
    """
    from concurrent.futures import ThreadPoolExecutor
    import lance
    stale = present - active
    if any(not isinstance(value, str) or len(value) != 64
           or any(char not in "0123456789abcdef" for char in value) for value in stale):
        raise ValueError("Obsolete vector IDs must be SHA-256 hex digests")
    progress(0, len(stale), reconciliation_phase="locating_obsolete_rows")
    if not stale:
        return present & active
    snapshot = vectors.to_lance()
    by_fragment, located = {}, set()
    scanned, last_report = 0, time.monotonic()
    for batch in snapshot.scanner(columns=["id"], with_row_address=True,
                                  batch_size=8192).to_batches():
        ids = batch.column("id").to_pylist()
        addresses = batch.column("_rowaddr").to_pylist()
        for identifier, address in zip(ids, addresses):
            if identifier in stale:
                by_fragment.setdefault(address >> 32, []).append(identifier)
                located.add(identifier)
        scanned += len(ids)
        if time.monotonic() - last_report >= 10:
            progress(0, len(stale), reconciliation_phase="locating_obsolete_rows",
                     rows_scanned=scanned, stale_located=len(located))
            last_report = time.monotonic()
    if located != stale:
        raise RuntimeError("Obsolete vector locations do not match the removal set")
    work = list(by_fragment.items())
    def prepare(item):
        fragment_id, ids = item
        values = ",".join("'" + value + "'" for value in ids)
        metadata = snapshot.get_fragment(fragment_id).delete(f"id IN ({values})")
        return fragment_id, metadata, len(ids)
    updated, deleted, prepared = [], [], 0
    progress(0, len(stale), reconciliation_phase="preparing_fragment_deletions",
             affected_fragments=len(work), stale_prepared=0)
    with ThreadPoolExecutor(max_workers=16) as pool:
        for fragment_id, metadata, count in pool.map(prepare, work):
            if metadata is None:
                deleted.append(fragment_id)
            else:
                updated.append(metadata)
            prepared += count
            if time.monotonic() - last_report >= 10:
                progress(0, len(stale), reconciliation_phase="preparing_fragment_deletions",
                         affected_fragments=len(work), stale_prepared=prepared)
                last_report = time.monotonic()
    # The complete predicate describes the transaction for conflict detection;
    # the scanner never evaluates it against every fragment.
    values = ",".join("'" + value + "'" for value in sorted(stale))
    operation = lance.LanceOperation.Delete(updated, deleted, f"id IN ({values})")
    progress(0, len(stale), reconciliation_phase="committing_fragment_deletions",
             affected_fragments=len(work), stale_prepared=prepared)
    committed = lance.LanceDataset.commit(snapshot, operation, read_version=snapshot.version)
    vectors.checkout_latest()
    retained = present & active
    if vector_ids(vectors) != retained or vectors.count_rows() != len(retained):
        raise RuntimeError("Reconciliation did not preserve the exact active vector ID set")
    progress(len(stale), len(stale), reconciliation_phase="verified",
             affected_fragments=len(work), vector_version=committed.version,
             valid_vectors_preserved=len(retained))
    return retained


def encode_when_available(config, texts, waiting):
    while True:
        try:
            return request_vectors(config, texts)
        except GPUUnavailable as exc:
            waiting(str(exc))
            time.sleep(30)


def validate_identity(config):
    identity = {key: config["embedding"][key] for key in ("model", "revision", "dimensions", "max_tokens")}
    file = config["state_dir"] / "embedding-model.json"
    if not file.exists() or json.loads(file.read_text("utf-8")) != identity:
        raise RuntimeError("Bible vector model identity does not match this configuration")


def embed_all(config, limit=0, batch_size=None):
    lock = open(config["state_dir"] / "build.lock", "a+b")
    if os.name == "nt":
        import msvcrt
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
    else:
        import fcntl
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    try:
        return _embed_all(config, limit, batch_size)
    finally:
        lock.close()


def _embed_all(config, limit, batch_size):
    cfg = config["embedding"]
    identity = {key: cfg[key] for key in ("model", "revision", "dimensions", "max_tokens")}
    identity_file = config["state_dir"] / "embedding-model.json"
    if identity_file.exists() and json.loads(identity_file.read_text("utf-8")) != identity:
        raise RuntimeError("Existing Bible vectors use a different embedding model; use a separate instance")
    write_json(identity_file, identity)
    vectors = table(config, create=True)
    present = vector_ids(vectors)
    if vectors.count_rows() != len(present):
        raise RuntimeError("Duplicate vector IDs found; refusing to append")
    db = connect(config["db"], readonly=True)
    active = {row[0] for row in db.execute("SELECT id FROM chunks")}
    corpus_build = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
    from .embedding_scope import embedding_only, require_snapshot, require_preservation, PENDING
    require_snapshot(corpus_build)
    require_preservation(len(present-active))
    from .recovery_test_scope import check as check_test_scope
    check_test_scope(len(present), stale=len(present-active))
    reconciliation_started = time.monotonic()
    def reconciliation_progress(removed, stale_total, **detail):
        write_json(config["state_dir"] / "embedding-progress.json", {
            "state": "reconciling", "updated_at": datetime.now(timezone.utc).isoformat(),
            "pid": os.getpid(), "corpus_build": corpus_build, "total": len(active),
            "indexed": len(present & active), "remaining": len(active-present),
            "stale_remaining": stale_total-removed,
            "stale_removed_this_pass": removed,
            "reconciliation_method": "fragment-local-single-commit",
            "reconciliation_seconds": round(time.monotonic()-reconciliation_started, 1), **detail})
        print(f"Reconciled obsolete vectors {removed:,}/{stale_total:,}", flush=True)
    # Deleting old vectors can take several minutes. Replace the previous run's
    # completion timestamp immediately so the watchdog sees this live work.
    present = reconcile_fragment_vectors(vectors, present, active, reconciliation_progress)
    total, initial = len(active), len(present)
    batch_size = max(1, min(batch_size or cfg.get("write_batch_size", cfg["batch_size"]), 64))
    write_json(config["state_dir"] / "embedding-progress.json", {
        "state": "preparing_batches", "updated_at": datetime.now(timezone.utc).isoformat(),
        "pid": os.getpid(), "corpus_build": corpus_build, "total": total,
        "indexed": initial, "remaining": total-initial, "stale_remaining": 0})
    print("Fetching only missing passages by indexed ID; saved vectors and their text are skipped", flush=True)
    cursor = missing_rows(db, active-present, batch_size)
    completed, started, buffer = 0, time.monotonic(), []

    def flush():
        nonlocal completed, buffer
        if not buffer:
            return
        check_test_scope(initial+completed)
        waits = 0
        def waiting(reason):
            nonlocal waits
            write_json(config["state_dir"] / "embedding-progress.json", {
                "state": "waiting_for_gpu", "updated_at": datetime.now(timezone.utc).isoformat(), "pid": os.getpid(),
                "total": total, "indexed": initial+completed, "remaining": total-initial-completed,
                "corpus_build": corpus_build, "reason": reason})
            if waits % 10 == 0:
                print(f"Waiting for GPU availability: {reason}", flush=True)
            waits += 1
        embeddings = encode_when_available(config, [row["embed_text"] for row in buffer], waiting)
        check_test_scope(initial+completed)
        values = [{key: row[key] for key in ("id", "kind", "edition", "language", "book")} | {"vector": vector} for row, vector in zip(buffer, embeddings)]
        vectors.add(values)
        completed += len(buffer)
        elapsed = time.monotonic()-started
        report = {"state": "running", "updated_at": datetime.now(timezone.utc).isoformat(), "pid": os.getpid(),
                  "total": total, "indexed": initial+completed, "remaining": total-initial-completed, "corpus_build": corpus_build,
                  "rate_per_second": round(completed/max(elapsed, .001), 2), "seconds": round(elapsed, 1)}
        write_json(config["state_dir"] / "embedding-progress.json", report)
        if completed % (batch_size*8) == 0 or completed == len(buffer):
            print(f"Vectors {initial+completed:,}/{total:,} · {report['rate_per_second']} chunks/s", flush=True)
        buffer = []

    try:
        for row in cursor:
            if row["id"] in present:
                continue
            buffer.append(dict(row))
            if len(buffer) >= batch_size or (limit and completed+len(buffer) >= limit):
                flush()
            if limit and completed >= limit:
                break
        flush()
        actual = vector_ids(vectors)
        remaining = len(active-actual)
        if remaining == 0 and len(actual) >= 1024 and not embedding_only():
            print("Building cosine search index…", flush=True)
            write_json(config["state_dir"] / "embedding-progress.json", {"state": "optimizing", "indexed": len(actual), "total": total,
                "remaining": 0, "corpus_build": corpus_build, "updated_at": datetime.now(timezone.utc).isoformat()})
            vectors.create_index(metric="cosine", num_partitions=max(1, min(256, int(math.sqrt(total)))), num_sub_vectors=160, replace=True)
        report = {"state": (PENDING if embedding_only() else "complete") if not remaining else "partial", "total": total, "indexed": len(active & actual),
                  "remaining": remaining, "corpus_build": corpus_build, "updated_at": datetime.now(timezone.utc).isoformat(), "seconds": round(time.monotonic()-started, 1)}
        write_json(config["state_dir"] / "embedding-progress.json", report)
        print(json.dumps(report), flush=True)
        if not remaining and not embedding_only():
            from .retrieval import verify
            verification = verify(config)
            verification["corpus_build"] = corpus_build
            verification["verified_at"] = datetime.now(timezone.utc).isoformat()
            write_json(config["state_dir"] / "verification.json", verification)
            print(json.dumps(verification), flush=True)
        return report
    except BaseException as exc:
        write_json(config["state_dir"] / "embedding-progress.json", {"state": "interrupted", "indexed": initial+completed,
            "total": total, "remaining": total-initial-completed, "corpus_build": corpus_build, "error": str(exc), "updated_at": datetime.now(timezone.utc).isoformat()})
        raise
    finally:
        db.close()
