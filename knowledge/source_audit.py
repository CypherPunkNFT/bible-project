"""Compare the held corpus with the published inventory using content hashes.

New source files are detected even outside the library tree. Generated data is
checked only where consumed by an adapter; caches and reader projections are not
mistaken for additional acquisitions. No timestamps are trusted for equivalence.
"""
from pathlib import Path
from .reference_library import checksum


def source_drift(config, db):
    root = config["sources_dir"].resolve()
    site = config["site_dir"].resolve()
    recorded = {Path(row[0]): row[1] for row in db.execute("SELECT path,sha256 FROM files")
                if Path(row[0]).is_relative_to(root) or
                Path(row[0]).is_relative_to(site / "data") or
                Path(row[0]).is_relative_to(site / "content")}
    current = {p.resolve() for p in root.rglob("*") if p.is_file() and p.suffix.lower() not in ('.part', '.tmp')}
    source_recorded = {p for p in recorded if p.is_relative_to(root)}
    missing = sorted(str(p) for p in recorded if not p.is_file())
    changed = sorted(str(p) for p, expected in recorded.items() if p.is_file() and checksum(p) != expected)
    return {"new": sorted(str(p) for p in current - source_recorded),
            "missing": missing, "changed": changed,
            "checked_files": len(recorded), "new_source_files": len(current - source_recorded)}
