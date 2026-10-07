"""Lexical, semantic, reference and fused retrieval, with source-grounded result records."""
import json
import hashlib
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from .encoder import request_vectors
from .graph import neighbors
from .store import connect, search_text
from .vectors import table, validate_identity
from .references import parse_reference

FILTERS = {"kind", "edition", "language", "book"}
STOP = set("a an the of to and in on for is are was were be by that this it how what why does do can about with from as i me my we our".split())


def fts_query(query):
    normalized = search_text(query)
    if len(query) >= 2 and query.startswith('"') and query.endswith('"'):
        return '"' + normalized[1:-1].replace('"', '""') + '"'
    terms = [token for token in re.findall(r"[^\W_]+", normalized, re.UNICODE) if token.lower() not in STOP]
    if re.search(r"[\u3400-\u9fff\u3040-\u30ff]", query):
        return '"' + " ".join(terms[:64]) + '"'
    return " AND ".join('"'+term.replace('"', '""')+'"' for term in terms[:32])


def where(filters, alias="c"):
    clauses, values = [], []
    for key, value in filters.items():
        if key not in FILTERS:
            raise ValueError(f"Unknown filter: {key}")
        if value:
            if len(value) > 100:
                raise ValueError("Filter is too long")
            clauses.append(f"{alias}.{key}=?")
            values.append(value)
    return (" AND " + " AND ".join(clauses) if clauses else ""), values


def lexical(db, query, limit, filters):
    match = fts_query(query)
    if not match:
        return []
    clause, values = where(filters)
    return [dict(row) for row in db.execute(
        "SELECT c.*,bm25(chunks_fts,3,1) lexical_score FROM chunks_fts JOIN chunks c ON c.rowid=chunks_fts.rowid "
        f"WHERE chunks_fts MATCH ? {clause} ORDER BY lexical_score LIMIT ?", [match, *values, limit])]


def semantic(config, db, query, limit, filters):
    validate_identity(config)
    vectors = table(config)
    if vectors is None or not vectors.count_rows():
        raise RuntimeError("Semantic index has no vectors yet")
    embedding = request_vectors(config, [query], "query")[0]
    conditions = []
    for key, value in filters.items():
        if value:
            if key not in FILTERS:
                raise ValueError("Unknown filter")
            conditions.append(key + " = '" + value.replace("'", "''") + "'")
    query_builder = vectors.search(embedding).metric("cosine")
    if conditions:
        query_builder = query_builder.where(" AND ".join(conditions), prefilter=True)
    candidates = query_builder.limit(limit*2).to_list()
    result = []
    for candidate in candidates:
        row = db.execute("SELECT * FROM chunks WHERE id=?", (candidate["id"],)).fetchone()
        if row:
            result.append(dict(row) | {"semantic_distance": candidate["_distance"]})
        if len(result) >= limit:
            break
    return result


def reference_hits(db, query, filters, limit):
    catalog = json.loads(db.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()[0])
    parsed = parse_reference(query, catalog)
    if not parsed:
        return [], None
    book, chapter, first, last_chapter, last = parsed
    edition = filters.get("edition") or (next((item["slug"] for item in catalog["translations"] if item["lang"] == filters["language"]), "") if filters.get("language") else "kjv")
    if not edition or (filters.get("book") and filters["book"] != book["code"]):
        return [], {"edition": edition, "book": book["code"], "verses": []}
    exact = db.execute("SELECT * FROM verses WHERE edition=? AND book=? AND chapter*1000+verse_end>=? AND chapter*1000+verse_start<=? ORDER BY chapter,verse_start LIMIT 200",
                       (edition, book["code"], chapter*1000+first, last_chapter*1000+last)).fetchall()
    rows = []
    if filters.get("kind") in (None, "", "bible"):
        selected = filters | {"edition": edition, "book": book["code"], "kind": "bible"}
        clause, values = where(selected)
        rows = [dict(row) for row in db.execute(f"SELECT c.* FROM chunks c WHERE c.chapter*1000+c.verse_end>=? AND c.chapter*1000+c.verse_start<=? {clause} ORDER BY chapter,verse_start LIMIT ?",
                [chapter*1000+first, last_chapter*1000+last, *values, limit])]
    context = {"edition": edition, "book": book["code"], "verses": [dict(row) for row in exact]}
    if edition == "kjv":
        start_id, end_id = book["num"]*1000000+chapter*1000+first, book["num"]*1000000+last_chapter*1000+last
        context["referencing_documents"] = [dict(row) for row in db.execute(
            "SELECT DISTINCT d.id,d.title,d.kind,d.source FROM references_to r JOIN documents d ON d.id=r.document_id WHERE r.edition='kjv' AND r.start<=? AND r.end>=? LIMIT 30", (end_id, start_id))]
        context["connections"] = neighbors(db, f"verse:kjv:{book['code']}:{chapter}:{first}")
    return rows, context


def fuse(lists):
    records, scores, methods = {}, defaultdict(float), defaultdict(list)
    for method, rows in lists.items():
        for rank, row in enumerate(rows, 1):
            id = row["id"]
            records[id] = records.get(id, {}) | row
            scores[id] += 1 / (60+rank)
            methods[id].append(method)
    return [records[id] | {"score": round(scores[id], 6), "methods": methods[id]} for id in sorted(scores, key=lambda id: (-scores[id], id))]


def search(config, query, mode="hybrid", limit=10, **filters):
    if not isinstance(query, str) or not query.strip() or len(query) > 500:
        raise ValueError("Enter between 1 and 500 characters")
    if mode not in ("lexical", "semantic", "hybrid"):
        raise ValueError("Unknown search mode")
    where(filters)  # validates even when a semantic-only request is used
    limit = max(1, min(int(limit), 50))
    started, notices, ranked = time.monotonic(), [], {}
    db = connect(config["db"], readonly=True)
    try:
        refs, context = reference_hits(db, query, filters, limit)
        if refs:
            ranked["reference"] = refs
        if context is None and mode in ("lexical", "hybrid"):
            ranked["lexical"] = lexical(db, query, max(50, limit*5), filters)
        if context is None and mode in ("semantic", "hybrid"):
            try:
                ranked["semantic"] = semantic(config, db, query, max(50, limit*5), filters)
            except Exception as exc:
                notices.append(f"Semantic retrieval unavailable: {exc}")
        results, repeated = [], defaultdict(int)
        for row in fuse(ranked):
            # Keep the list useful when a passage appears in many very similar editions.
            group = (row["book"], row["chapter"], row["verse_start"]) if row["kind"] == "bible" else row["document_id"]
            if repeated[group] >= 3:
                continue
            repeated[group] += 1
            document = dict(db.execute("SELECT * FROM documents WHERE id=?", (row["document_id"],)).fetchone())
            for field in ("search_text", "embed_text", "rowid"):
                row.pop(field, None)
            row["source"] = {key: document[key] for key in ("source", "licence", "title", "metadata")}
            row["url"] = config["reader_url"] + row["link"] if row["link"].startswith("/") else ""
            results.append(row)
            if len(results) == limit:
                break
        return {"query": query, "mode": mode, "results": results, "reference": context, "notices": notices,
                "tiers": {key: len(value) for key, value in ranked.items()}, "seconds": round(time.monotonic()-started, 3)}
    finally:
        db.close()


def status(config):
    if not config["db"].exists():
        return {"state": "not_built"}
    db = connect(config["db"], readonly=True)
    try:
        total = db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
        progress = config["state_dir"] / "embedding-progress.json"
        current = json.loads(progress.read_text("utf-8")) if progress.exists() else {"state": "not_started", "indexed": 0, "remaining": total, "total": total}
        built_at = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if current.get("corpus_build") != built_at and current["state"] != "not_started":
            current = current | {"state": "needs_refresh"}
        elif current["state"] in ("running", "waiting_for_gpu") and (datetime.now(timezone.utc)-datetime.fromisoformat(current["updated_at"])).total_seconds() > 180:
            current = current | {"state": "stalled"}
        coverage = json.loads((config["state_dir"] / "coverage.json").read_text("utf-8"))
        return {"state": "ready", "corpus": coverage, "embeddings": current,
                "kinds": [row[0] for row in db.execute("SELECT DISTINCT kind FROM chunks ORDER BY kind")],
                "editions": [dict(row) for row in db.execute("SELECT edition,language,COUNT(*) chunks FROM chunks WHERE kind='bible' GROUP BY edition,language")],
                "storage": {"sqlite": str(config["db"]), "lancedb": str(config["vectors"]), "independent": True}}
    finally:
        db.close()


def verify(config):
    from .source_audit import source_drift
    from .settings import write_json
    db = connect(config["db"], readonly=True)
    try:
        active = {row[0] for row in db.execute("SELECT id FROM chunks")}
        vectors = table(config)
        # Read one immutable Lance version while the background writer may append batches.
        snapshot = vectors.to_lance() if vectors is not None else None
        actual = set(snapshot.to_table(columns=["id"]).column("id").to_pylist()) if snapshot is not None else set()
        duplicate_vectors = snapshot.count_rows()-len(actual) if snapshot is not None else 0
        integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
        foreign_keys = len(db.execute("PRAGMA foreign_key_check").fetchall())
        try:
            validate_identity(config)
            identity_ok = True
        except (OSError, ValueError, RuntimeError):
            identity_ok = False
        library_row = db.execute("SELECT value FROM meta WHERE key='library_intake'").fetchone()
        library = json.loads(library_row[0]) if library_row else None
        corpus_build = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        progress_file = config["state_dir"] / "embedding-progress.json"
        progress = json.loads(progress_file.read_text("utf-8")) if progress_file.exists() else {}
        job_complete = progress.get("state") == "complete" and progress.get("corpus_build") == corpus_build
        new_files, missing_files, changed_ledgers = [], [], []
        if library:
            imported = {row[0] for row in db.execute("SELECT path FROM library_files")}
            current = {str(path) for path in (config["sources_dir"] / "library").rglob("*") if path.is_file()}
            new_files, missing_files = sorted(current-imported), sorted(imported-current)
            recorded = dict(db.execute("SELECT path,sha256 FROM files WHERE status='library_metadata'"))
            ledger_paths = {str(path): path for folder in ("catalog", "reports") for path in (config["site_dir"] / "content/library" / folder).rglob("*.json")}
            changed_ledgers = sorted(set(recorded) ^ set(ledger_paths))
            for name in set(recorded) & set(ledger_paths):
                with ledger_paths[name].open("rb") as stream:
                    checksum = hashlib.file_digest(stream, "sha256").hexdigest()
                if checksum != recorded[name]:
                    changed_ledgers.append(name)
        drift = source_drift(config, db)
        write_json(config["state_dir"] / "source-drift.json", drift)
        reference_row = db.execute("SELECT value FROM meta WHERE key='reference_intake'").fetchone()
        reference_intake = json.loads(reference_row[0]) if reference_row else None
        complete = actual == active and bool(active) and not duplicate_vectors and integrity == "ok" and not foreign_keys and identity_ok and job_complete
        return {"sqlite_integrity": integrity,
                "foreign_key_errors": foreign_keys, "embedding_identity_matches": identity_ok,
                "corpus_build": corpus_build, "embedding_job_complete": job_complete,
                "chunks": len(active), "vectors": len(actual), "missing_vectors": len(active-actual), "stale_vectors": len(actual-active),
                "verse_count": db.execute("SELECT COUNT(*) FROM verses").fetchone()[0],
                "duplicate_vectors": duplicate_vectors,
                "new_source_files_since_snapshot": len(drift["new"]),
                "changed_source_inputs_since_snapshot": len(drift["changed"]),
                "missing_source_inputs_since_snapshot": len(drift["missing"]),
                "source_files_hash_checked": drift["checked_files"],
                "reference_library": reference_intake,
                "new_library_files_since_snapshot": len(new_files),
                "missing_library_files_since_snapshot": len(missing_files),
                "changed_library_ledgers_since_snapshot": len(changed_ledgers),
                "library": {"files": library["files"], "statuses": library["statuses"], "errors": len(library["errors"]),
                            "missing_catalog_files": len(library.get("missing_catalog_files", []))} if library else None,
                "complete": complete,
                "enrichment_ready": bool(complete and library and reference_intake and not library["errors"] and not library.get("missing_catalog_files")
                    and not drift["new"] and not drift["changed"] and not drift["missing"]
                    and not new_files and not missing_files and not changed_ledgers
                    and not library["statuses"].get("no_text") and not library["statuses"].get("unsupported"))}
    finally:
        db.close()
