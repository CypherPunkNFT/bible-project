"""Rebuild to a staging database; publish only after coverage and integrity verification."""
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from .bibles import import_bibles
from .documents import import_study, import_authored, import_reference_books, import_project_docs
from .graph import import_cross_references
from .store import SCHEMA, Writer, connect
from .settings import write_json


def inventory(writer):
    """Account for raw originals/duplicates/assets without indexing build caches or credentials."""
    for file in sorted(writer.config["sources_dir"].rglob("*")):
        if not file.is_file() or file.resolve() in writer.seen_files:
            continue
        relative = file.relative_to(writer.config["sources_dir"])
        if "ARCHIVE" in relative.parts:
            status, detail = "archive", "Superseded original retained on disk; not part of current corpus"
        elif file.suffix == ".zip":
            status, detail = "duplicate", "Download archive; extracted originals retained"
        elif file.suffix == ".usfm":
            status, detail = "original", "Bible source; searchable catalog editions use parsed text with numbering/notes. Uncatalogued incomplete editions are not promoted into the reader."
        elif file.suffix in (".jpg", ".png", ".css"):
            status, detail = "asset", "Imagery/style asset, no searchable prose; place records are indexed separately"
        elif file.suffix in (".xml", ".kml", ".geojson", ".jsonl"):
            status, detail = "structured_original", "Original structured source; reference-book text / curated geographical records indexed separately"
        elif file.suffix in (".md", ".txt", ".htm", ".json", ".asc", ".csv"):
            status, detail = "source_record", "Source metadata or alternate representation, retained with checksum"
        else:
            status, detail = "unhandled", "Review this source type before claiming it is searchable"
        writer.file(file, status, detail)


def build(config):
    state = config["state_dir"]
    state.mkdir(parents=True, exist_ok=True)
    lock = open(state / "build.lock", "a+b")
    if os.name == "nt":
        import msvcrt
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
    else:
        import fcntl
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    stage = state / f"build-{os.getpid()}.sqlite3"
    if stage.exists():
        raise RuntimeError(f"Staging database already exists: {stage}")
    started = time.monotonic()
    db = connect(stage)
    try:
        db.executescript(SCHEMA)
        writer = Writer(db, config)
        catalog = import_bibles(writer)
        import_study(writer, catalog)
        import_reference_books(writer)
        import_authored(writer, catalog)
        import_project_docs(writer)
        import_cross_references(writer)
        inventory(writer)
        db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
        db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('integrity-check')")
        db.execute("INSERT INTO meta VALUES('catalog',?)", (json.dumps(catalog, ensure_ascii=False),))
        db.execute("INSERT INTO meta VALUES('built_at',?)", (datetime.now(timezone.utc).isoformat(),))
        db.execute("INSERT INTO meta VALUES('schema_version','1')")
        db.commit()
        integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok" or db.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError(f"Database validation failed: {integrity}")
        report = {
            "built_at": datetime.now(timezone.utc).isoformat(), "seconds": round(time.monotonic()-started, 1),
            "editions": len(catalog["translations"]), "languages": len({x["lang"] for x in catalog["translations"]}),
            "expected_verses": sum(x["verses"] for x in catalog["translations"]),
            "counts": {table: db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in ("documents", "chunks", "verses", "edges", "references_to", "files")},
            "by_kind": [dict(row) for row in db.execute("SELECT kind,COUNT(*) count FROM chunks GROUP BY kind")],
            "source_inventory": [dict(row) for row in db.execute("SELECT status,COUNT(*) count FROM files GROUP BY status")],
            "integrity": integrity,
        }
        if report["counts"]["verses"] != report["expected_verses"]:
            raise RuntimeError("Full corpus verse count failed")
        db.close()
        if config["db"].exists():
            config["db"].replace(state / "knowledge.previous.sqlite3")
        try:
            stage.replace(config["db"])
        except OSError:
            previous = state / "knowledge.previous.sqlite3"
            if previous.exists() and not config["db"].exists():
                previous.replace(config["db"])
            raise
        write_json(state / "coverage.json", report)
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
        return report
    finally:
        db.close()
        lock.close()
