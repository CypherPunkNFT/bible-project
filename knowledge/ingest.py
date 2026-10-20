"""Rebuild to a staging database; publish only after coverage and integrity verification."""
import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from .store import SCHEMA, Writer, connect
from .settings import write_json


def _replace_shared(source, target, attempts=31):
    """Wait at most 15 seconds for a transient Windows sharing/lock violation."""
    for attempt in range(attempts):
        try:
            source.replace(target)
            return
        except OSError as error:
            if getattr(error, 'winerror', None) not in (32, 33) or attempt == attempts - 1:
                raise
            time.sleep(.5)


def _file_identity(path):
    if not path.exists():return None
    info=path.stat()
    return {'device':info.st_dev,'inode':info.st_ino,'bytes':info.st_size,'mtime_ns':info.st_mtime_ns}


def _require_no_pending_publication(state,current):
    file=state/'database-publication.json'
    if not file.exists():return
    prior=json.loads(file.read_text('utf-8'))
    # An interrupted process may leave only its pre-rename receipt.  Never erase
    # the recovery map if the original was moved and the new file is still absent.
    if prior.get('state')=='recovery_required' or (prior.get('state')=='prepared'
            and prior.get('original_identity') is not None and not current.exists()):
        raise RuntimeError('Previous publication needs identity-checked recovery; inspect database-publication.json')


def publish_database(stage, current, state):
    """Publish under the caller's build.lock, retaining every last-good copy on failure.

    No database is opened here.  A fresh build has already passed SQLite/coverage
    validation.  The receipt identifies retained files if even rollback is blocked.
    """
    stage,current,state=Path(stage).resolve(),Path(current).resolve(),Path(state).resolve()
    if current != state/'knowledge.sqlite3' or stage.parent != state or not stage.name.startswith('build-') or stage.suffix != '.sqlite3':
        raise ValueError('Database publication paths must remain in the dedicated build directory')
    receipt_path=state/'database-publication.json'
    _require_no_pending_publication(state,current)
    backup=state/('knowledge.rollback-'+uuid.uuid4().hex+'.sqlite3')
    receipt={'state':'prepared','pid':os.getpid(),'prepared_at':datetime.now(timezone.utc).isoformat(),
        'stage':str(stage),'current':str(current),'rollback':str(backup),
        'stage_identity':_file_identity(stage),'original_identity':_file_identity(current),
        'previous':str(state/'knowledge.previous.sqlite3'),'vectors_modified':False}
    if receipt['stage_identity'] is None:raise FileNotFoundError(stage)
    write_json(receipt_path,receipt)
    moved=False
    try:
        if receipt['original_identity'] is not None:
            # A unique target retains knowledge.previous until the new stage is
            # published; a failed publication cannot overwrite that older backup.
            _replace_shared(current,backup);moved=True
        _replace_shared(stage,current)
    except OSError as error:
        receipt.update(state='failed',error=str(error),winerror=getattr(error,'winerror',None))
        if moved:
            try:
                if current.exists():raise RuntimeError('Unexpected published file; refusing rollback overwrite')
                if _file_identity(backup)!=receipt['original_identity']:raise RuntimeError('Rollback identity changed')
                _replace_shared(backup,current)
                receipt['state']='restored'
            except (OSError,RuntimeError) as rollback_error:
                receipt.update(state='recovery_required',rollback_error=str(rollback_error))
        try:
            from .database_lock_owners import bounded_lock_owners
            receipt['lock_owners']=bounded_lock_owners([current,stage,backup,state/'knowledge.previous.sqlite3'])
        except Exception as diagnostic_error:
            receipt['lock_owner_diagnostic_error']=str(diagnostic_error)
        write_json(receipt_path,receipt)
        raise RuntimeError('Database publication failed; retained files and lock diagnostics: '+str(receipt_path)) from error
    receipt.update(state='complete',published_at=datetime.now(timezone.utc).isoformat())
    if moved:
        try:
            _replace_shared(backup,state/'knowledge.previous.sqlite3')
            receipt['last_good']=str(state/'knowledge.previous.sqlite3')
        except OSError as rotation_error:
            # The new validated database is already published.  Keep the unique
            # old copy rather than misreporting failure or deleting either backup.
            receipt.update(last_good=str(backup),backup_rotation_deferred=str(rotation_error))
    write_json(receipt_path,receipt)
    return receipt


def inventory(writer):
    """Account for raw originals/duplicates/assets without indexing build caches or credentials."""
    for file in sorted(writer.config["sources_dir"].rglob("*")):
        if not file.is_file() or file.suffix.lower() in ('.part', '.tmp') or file.resolve() in writer.seen_files:
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
    # Loading publication/rollback helpers must not initialize source extractors.
    from .bibles import import_bibles
    from .documents import import_study, import_authored, import_reference_books, import_project_docs
    from .graph import import_cross_references
    from .library import import_library
    from .reference_library import import_reference_library, import_topics
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
    try:
        _require_no_pending_publication(state,Path(config['db']))
    except BaseException:
        lock.close();raise
    stage = state / f"build-{os.getpid()}.sqlite3"
    if stage.exists():
        raise RuntimeError(f"Staging database already exists: {stage}")
    started = time.monotonic()
    db = connect(stage)
    try:
        db.executescript(SCHEMA)
        # Large random chunk-ID indexes otherwise thrash SQLite's small default cache.
        db.execute("PRAGMA cache_size=-131072")
        writer = Writer(db, config)
        catalog = import_bibles(writer)
        import_study(writer, catalog)
        import_reference_books(writer)
        references = import_reference_library(writer)
        references["topics"] = import_topics(writer, catalog)
        db.execute("INSERT INTO meta VALUES('reference_intake',?)", (json.dumps(references),))
        import_authored(writer, catalog)
        import_project_docs(writer)
        import_cross_references(writer)
        library = import_library(writer)
        if library["errors"] or library["missing_catalog_files"]:
            write_json(state / "library-intake-errors.json", library)
            raise RuntimeError("Library intake has unresolved errors; inspect library-intake-errors.json. Previous database retained.")
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
            "reference_library": references,
            "library": {key: value for key, value in library.items() if key != "low_text_pdf_pages"},
        }
        if report["counts"]["verses"] != report["expected_verses"]:
            raise RuntimeError("Full corpus verse count failed")
        db.close()
        publish_database(stage,config["db"],state)
        write_json(state / "coverage.json", report)
        write_json(state / "library-intake.json", library)
        write_json(state / "library-intake-progress.json", {"state": "complete", "processed": library["files"], "total": library["files"], "statuses": library["statuses"]})
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
        return report
    finally:
        db.close()
        lock.close()
