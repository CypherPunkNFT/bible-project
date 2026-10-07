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
    stale = list(present-active)
    def reconciliation_progress(removed):
        write_json(config["state_dir"] / "embedding-progress.json", {
            "state": "reconciling", "updated_at": datetime.now(timezone.utc).isoformat(),
            "pid": os.getpid(), "corpus_build": corpus_build, "total": len(active),
            "indexed": len(present & active), "remaining": len(active-present),
            "stale_remaining": len(stale)-removed})
    # Deleting old vectors can take several minutes. Replace the previous run's
    # completion timestamp immediately so the watchdog sees this live work.
    reconciliation_progress(0)
    for i in range(0, len(stale), 500):
        # IDs are our SHA-256 hex digests, never query/user text.
        values = ",".join("'"+value+"'" for value in stale[i:i+500])
        vectors.delete(f"id IN ({values})")
        reconciliation_progress(min(i+500, len(stale)))
    present &= active
    total, initial = len(active), len(present)
    batch_size = max(1, min(batch_size or cfg.get("write_batch_size", cfg["batch_size"]), 64))
    cursor = db.execute("SELECT id,embed_text,kind,edition,language,book FROM chunks ORDER BY CASE kind WHEN 'guide' THEN 0 WHEN 'study' THEN 1 WHEN 'person' THEN 2 WHEN 'place' THEN 3 WHEN 'bible' THEN 4 ELSE 5 END, CASE edition WHEN 'kjv' THEN 0 WHEN 'bsb' THEN 1 ELSE 2 END, rowid")
    completed, started, buffer = 0, time.monotonic(), []

    def flush():
        nonlocal completed, buffer
        if not buffer:
            return
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
        if remaining == 0 and len(actual) >= 1024:
            print("Building cosine search index…", flush=True)
            write_json(config["state_dir"] / "embedding-progress.json", {"state": "optimizing", "indexed": len(actual), "total": total,
                "remaining": 0, "corpus_build": corpus_build, "updated_at": datetime.now(timezone.utc).isoformat()})
            vectors.create_index(metric="cosine", num_partitions=max(1, min(256, int(math.sqrt(total)))), num_sub_vectors=160, replace=True)
        report = {"state": "complete" if not remaining else "partial", "total": total, "indexed": len(active & actual),
                  "remaining": remaining, "corpus_build": corpus_build, "updated_at": datetime.now(timezone.utc).isoformat(), "seconds": round(time.monotonic()-started, 1)}
        write_json(config["state_dir"] / "embedding-progress.json", report)
        print(json.dumps(report), flush=True)
        if not remaining:
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
