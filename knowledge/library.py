"""Manifest-backed, private-local incorporation of the held Christian library."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from .bibles import read_json
from .library_extract import extraction_cache, sha256
from .settings import write_json


CONTEXT_KEYS = ("title", "author", "authorId", "authorGroup", "reviewClass", "reviewStatus", "quality", "limitations", "sourcePage", "useScope", "textKind", "rightsCategory", "publicHostingAllowed", "publicFullTextIndexAllowed")


def objects(value, inherited=None):
    if isinstance(value, dict):
        combined = (inherited or {}) | value
        yield combined
        context = {key: combined[key] for key in CONTEXT_KEYS if key in combined}
        for item in value.values():
            yield from objects(item, context)
    elif isinstance(value, list):
        for item in value:
            yield from objects(item, inherited)


def safe_path(config, value, raw=False):
    if not isinstance(value, str) or not value:
        return None
    path = Path(value)
    if not path.is_absolute():
        path = (config["sources_dir"] if raw or value.replace("\\", "/").startswith("library/") else config["site_dir"]) / path
    path = path.resolve()
    allowed = (config["sources_dir"] / "library", config["site_dir"] / ".local/library", config["site_dir"] / "content/library")
    if not any(path.is_relative_to(root.resolve()) for root in allowed):
        return None
    return path


def plan_library(config):
    root = config["site_dir"] / "content/library"
    records, provenance, hints, derivatives, asset_derivatives = {}, [], {}, {}, []
    for file in sorted((root / "catalog").rglob("*.json")):
        value = read_json(file)
        records[value["id"]] = value
        provenance.append(file)
    # Collection ledgers include acquisitions which have not yet been promoted to catalog assets.
    for file in sorted((root / "reports").rglob("*.json")):
        value = read_json(file)
        provenance.append(file)
        for row in objects(value):
            path = safe_path(config, row.get("relativePath") or row.get("path") or row.get("sourceRelativePath"))
            if path and path.is_relative_to(config["sources_dir"] / "library"):
                previous = hints.setdefault(str(path), {})
                for key in (*CONTEXT_KEYS, "sha256", "sourceSha256", "assetId", "editionId", "workId", "url", "canonicalUrl", "finalUrl", "format", "mimeType", "evidenceOnly"):
                    if row.get(key) is not None:
                        previous[key] = row[key]
                previous.setdefault("manifests", set()).add(str(file))
                if row.get("disposition") and row.get("pdfPage"):
                    previous.setdefault("page_dispositions", []).append({key: row.get(key) for key in ("pdfPage", "disposition", "basis", "evidence")})
                item = row.get("derivedText")
                derivative = item if isinstance(item, dict) else {"path": item, "sha256": row.get("derivedSha256")} if isinstance(item, str) else None
                if derivative:
                    derived_path = safe_path(config, derivative.get("path"))
                    if derived_path and derived_path.exists():
                        # Later explicit OCR/font-repair records take precedence over ordinary extraction.
                        priority = 15 if file.name == "font-repair.json" else 10 if "ocr-completion" in str(file) else 1
                        if priority >= derivatives.get(str(path), {}).get("priority", 0):
                            derivatives[str(path)] = derivative | {"path": str(derived_path), "priority": priority, "manifest": str(file)}
            if row.get("sourceAssetId") or row.get("parentAssetId"):
                item = row.get("derivedText") or row.get("textPath")
                if isinstance(item, str):
                    asset_derivatives.append((row.get("sourceAssetId") or row["parentAssetId"], item, row.get("sha256"), str(file)))
    for record in records.values():
        if record.get("kind") != "asset" or not record.get("relativePath"):
            continue
        path = safe_path(config, record["relativePath"], raw=True)
        if path:
            hints.setdefault(str(path), {}).update({"assetId": record["id"], "catalog": record})
    for asset_id, value, checksum, manifest in asset_derivatives:
        asset = records.get(asset_id, {})
        original = safe_path(config, asset.get("relativePath"), raw=True)
        derived = safe_path(config, value)
        if original and derived and derived.exists():
            derivatives[str(original)] = {"path": str(derived), "sha256": checksum, "priority": 2, "manifest": manifest}
    # Explicit repaired font output uses a different ledger shape.
    file = root / "reports/ocr-completion/tgc-font-repair.json"
    if file.exists():
        row = read_json(file)
        path = safe_path(config, row.get("sourceRelativePath"))
        for output in row.get("outputs", []):
            if output["relativePath"].endswith(".txt") and path:
                pages = next((x for x in row["outputs"] if x["relativePath"].endswith(".pages.json")), None)
                derivatives[str(path)] = {"path": str(safe_path(config, output["relativePath"])), "sha256": output["sha256"], "priority": 20, "manifest": str(file),
                    **({"pageText": str(safe_path(config, pages["relativePath"])), "pageTextSha256": pages["sha256"]} if pages else {})}
    raw_files = sorted(path for path in (config["sources_dir"] / "library").rglob("*") if path.is_file())
    # A repaired edition can appear under several acquisition IDs. Reuse the repair
    # only when the original-byte hash proves these are exactly the same source.
    best = {}
    for path, derivative in derivatives.items():
        hint = hints.get(path, {})
        checksum = hint.get("catalog", {}).get("sha256") or hint.get("sourceSha256") or hint.get("sha256")
        if checksum and derivative["priority"] > best.get(checksum, {}).get("priority", 0):
            best[checksum] = derivative
    for path, hint in hints.items():
        checksum = hint.get("catalog", {}).get("sha256") or hint.get("sourceSha256") or hint.get("sha256")
        if checksum in best:
            derivatives[path] = best[checksum]
    return records, provenance, hints, derivatives, raw_files


def catalog_text(value):
    keys = ("title", "label", "name", "alternateTitles", "creators", "workId", "editionId", "genre", "role", "collections", "subjects", "occasions", "audiences", "depth", "era", "dates", "passages", "related", "reading", "description", "summary", "notes", "abridgment", "modernization")
    return "\n".join(f"{key}: {json.dumps(value[key], ensure_ascii=False)}" for key in keys if value.get(key))


def import_library(writer):
    config = writer.config
    records, provenance, hints, derivatives, raw_files = plan_library(config)
    writer.db.executescript("""CREATE TABLE library_files(path TEXT PRIMARY KEY,sha256 TEXT NOT NULL,status TEXT NOT NULL,document_id TEXT,detail TEXT NOT NULL,metadata TEXT NOT NULL);
        CREATE INDEX library_file_status ON library_files(status);
        CREATE TABLE library_records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,metadata TEXT NOT NULL);
        CREATE TABLE library_reports(path TEXT PRIMARY KEY,metadata TEXT NOT NULL);""")
    for file in provenance:
        writer.file(file, "library_metadata", "Catalog or acquisition/quality ledger; full metadata retained on disk")
        if "reports" in file.parts:
            writer.db.execute("INSERT INTO library_reports VALUES(?,?)", (str(file), file.read_text("utf-8-sig")))
    for id, value in records.items():
        writer.db.execute("INSERT INTO library_records VALUES(?,?,?)", (id, value.get("kind", ""), json.dumps(value, ensure_ascii=False)))
        if value.get("kind") not in ("work", "edition", "series"):
            continue
        doc = f"library:catalog:{id}"
        title = value.get("title") or value.get("label") or id
        writer.document(doc, title, "library_catalog", "content/library/catalog", "Catalog description; acquisition and publication status remain separate", metadata=value)
        writer.chunk(doc, title, catalog_text(value), "library_catalog", locator=id)
    by_hash, statuses, errors = {}, Counter(), []
    total_chars, total_blocks, unreadable_pages = 0, 0, []
    for number, file in enumerate(raw_files, 1):
        hint = dict(hints.get(str(file), {}))
        hint["manifests"] = sorted(hint.get("manifests", []))
        asset = hint.get("catalog", {})
        edition = records.get(asset.get("editionId") or hint.get("editionId"), {})
        work = records.get(edition.get("workId") or hint.get("workId"), {})
        title = work.get("title") or hint.get("title") or file.parent.name
        if title.startswith("asset-"):
            title = title.removeprefix("asset-").replace("-", " ")
        original_hash = sha256(file)
        expected = asset.get("sha256") or hint.get("sha256") or hint.get("sourceSha256")
        status, detail, doc = "indexed", "", None
        metadata = {"asset": asset, "edition": edition, "work": work, "acquisition": hint,
                    "original_sha256": original_hash, "scope": "private-local-user-authorized", "public_publication": False}
        suffix = file.suffix.lower()
        try:
            if expected and expected != original_hash:
                raise ValueError("Original checksum does not match acquisition manifest")
            if hint.get("evidenceOnly") or (suffix == ".json" and (file.name.endswith("provenance.json") or file.name == "metadata.json")) or file.name.endswith("_scandata.xml") or suffix in (".jpg", ".png", ".webp", ".css", ".zip"):
                status, detail = "metadata_or_asset", "Acquisition evidence, metadata, image or archive; no separate body embedding"
            elif suffix not in (".pdf", ".epub", ".txt", ".md", ".html", ".htm", ".xml", ".json", ""):
                status, detail = "unsupported", f"Unhandled file type {suffix}"
            elif original_hash in by_hash:
                status, doc, detail = "duplicate", by_hash[original_hash], "Identical original bytes; source identity retained"
            else:
                # EPUB package structure provides section locators and includes non-spine notes.
                derivative = None if suffix == ".epub" else derivatives.get(str(file))
                # Ordinary PDF exports often flatten away pagination. Read the existing
                # text layer page by page; explicit OCR/font repairs still take priority.
                if suffix == ".pdf" and derivative and derivative.get("priority", 0) < 10:
                    derivative = None
                cache, selected, text_hash = extraction_cache(config, file, original_hash, asset.get("format") or hint.get("format", ""), derivative)
                metadata.update({"text_path": str(selected), "text_sha256": text_hash, "extraction_cache": str(cache), "derivative": derivative})
                with cache.open(encoding="utf-8") as stream:
                    blocks = [json.loads(line) for line in stream]
                body_hash = hashlib.sha256("\n".join(block["text"] for block in blocks).encode()).hexdigest()
                if body_hash in by_hash:
                    status, doc, detail = "duplicate", by_hash[body_hash], "Identical extracted body; provenance and edition retained"
                    by_hash[original_hash] = doc
                else:
                    nonempty = [block for block in blocks if block["text"].strip()]
                    if not nonempty:
                        status, detail = "no_text", "No extractable existing text; no OCR performed"
                        dispositions = hint.get("page_dispositions", [])
                        if dispositions and all(x["disposition"].startswith("deferred") or x["disposition"] == "historical-source-text-reused-or-restoration-deferred" for x in dispositions):
                            status, detail = "deferred_scan", "Existing source audit explicitly defers transcription; searchable metadata only, no body text or inferred replacement"
                            doc = "library:deferred:" + original_hash
                            writer.document(doc, title, "library_catalog", file, detail, metadata=metadata)
                            writer.chunk(doc, title, title + "\n" + detail + "\n" + "\n".join(sorted({x["basis"] for x in dispositions if x.get("basis")})), "library_catalog", locator="Source availability and existing review decision")
                    else:
                        doc = "library:text:" + original_hash
                        rights = asset.get("rights", {})
                        credit = rights.get("attribution") or "Private local research copy; source and acquisition conditions retained in metadata"
                        language = (edition.get("languages") or ["en"])[0]
                        review = hint.get("reviewClass", "")
                        quality = hint.get("quality", {})
                        ai_disclosed = isinstance(quality, dict) and quality.get("publisherAiDisclosure")
                        kind = "library_review" if ai_disclosed or "held" in review or "ai-" in review else "library_text"
                        if kind == "library_review":
                            credit += "; review-held edition: publisher AI disclosure or unresolved editorial qualification"
                        writer.document(doc, title, kind, file, credit, language, metadata=metadata)
                        for block in nonempty:
                            writer.chunk(doc, title, block["text"], kind, language, locator=block["locator"])
                        by_hash[original_hash] = by_hash[body_hash] = doc
                        total_chars += sum(len(block["text"]) for block in nonempty)
                        total_blocks += len(nonempty)
                        unreadable_pages.extend({"path": str(file), "page": block["page"]} for block in blocks if block.get("page") and len(block["text"].strip()) < 20)
                if selected != file:
                    writer.file(selected, "library_derivative", "Existing text derivative; original and derivative hashes retained")
        except Exception as exc:
            status, detail = "error", str(exc)
            errors.append({"path": str(file), "error": detail})
            print(f"Library error: {file}: {detail}", flush=True)
        statuses[status] += 1
        writer.file(file, "library_"+status, detail)
        writer.db.execute("INSERT INTO library_files VALUES(?,?,?,?,?,?)", (str(file), original_hash, status, doc, detail, json.dumps(metadata, ensure_ascii=False)))
        if number % 25 == 0 or number == len(raw_files):
            writer.db.commit()
            write_json(config["state_dir"] / "library-intake-progress.json", {"state": "running", "processed": number, "total": len(raw_files), "statuses": dict(statuses)})
            if number % 100 == 0 or number == len(raw_files):
                print(f"Library {number:,}/{len(raw_files):,}: {dict(statuses)}", flush=True)
    missing = []
    for value in records.values():
        if value.get("kind") == "asset" and value.get("acquisitionStatus") == "downloaded":
            path = safe_path(config, value.get("relativePath"), raw=True)
            if not path or not path.exists():
                missing.append(str(path) if path else value["id"] + ": missing or invalid local path")
    report = {"files": len(raw_files), "catalog_records": len(records), "statuses": dict(statuses), "characters": total_chars,
              "text_blocks": total_blocks, "low_text_pdf_pages": unreadable_pages, "errors": errors, "missing_catalog_files": missing,
              "scope": "Locally held files at intake; metadata-only links and future acquisitions are not body texts", "public_publication": False}
    report["deferred_scans"] = [dict(row) for row in writer.db.execute("SELECT path,detail FROM library_files WHERE status='deferred_scan'")]
    writer.db.execute("INSERT INTO meta VALUES('library_intake',?)", (json.dumps(report, ensure_ascii=False),))
    return report
