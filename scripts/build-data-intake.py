"""Build the data intake catalogues: one per intake (a folder the download jobs filled), plus the card list.

Reads only. The truth is the files on disk: every file under an intake folder is listed with its size
and type, grouped by the source folder it sits in (raw/<source>/...). Each job's own manifest.json adds
what the disk cannot say: the source's title, publisher, address and licence. Manifests differ per job,
so they are searched for any record whose slug or key names the source folder.

Output: Website/intake/catalogue.json (the cards) and Website/intake/<slug>/catalogue.json, served on
the local preview only at /data_intake/ (vite.config.ts, intakePlugin). Run: py -3.12 scripts/build-data-intake.py
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding="utf-8")

SITE = Path(__file__).resolve().parent.parent
PROJECT = SITE.parent
OUT = SITE / "intake"

# Every intake, the folder it lives in, and the orchestrator jobs that filled it.
INTAKES = [
    {"slug": "bible_questions", "title": "Bible questions", "folder": "Website/content/questions/sources", "jobs": [411, 412, 413]},
    {"slug": "open_bible_data", "title": "Open Bible data", "folder": "Research/OpenBibleData", "jobs": [413]},
    {"slug": "creeds", "title": "Creeds & confessions", "folder": "Research/Creeds", "jobs": [415]},
    {"slug": "hymns", "title": "Hymns", "folder": "Research/Hymns", "jobs": [416]},
    {"slug": "artifacts", "title": "Archaeology artifacts", "folder": "Research/Artifacts", "jobs": [417]},
    {"slug": "manuscripts", "title": "Manuscripts", "folder": "Research/Manuscripts", "jobs": [418]},
    {"slug": "audio_bible", "title": "Audio Bible", "folder": "Research/Audio", "jobs": [419]},
    {"slug": "holy_land_maps", "title": "Holy Land maps", "folder": "Research/HistoricalMaps", "jobs": [420]},
    # The reference library's files and outputs, laid out by kind rather than under raw/. Its card stays the
    # reading desk (reference_books), which links here.
    {"slug": "reference_library", "title": "Reference books", "folder": "Data/TheologicalReferenceLibrary", "jobs": [409, 410],
     "source_dirs": ["Encyclopedias", "Publisher-References", "Scholar-Lists"], "card": False},
]
# The existing acquisition desk, now at /data_intake/reference_books/; its card reads its own catalogue.
REFERENCE_BOOKS = {"slug": "reference_books", "title": "Reference books", "jobs": [409, 410],
                   "catalogue": SITE / "public" / "data_acquisition" / "catalogue.json"}

SKIP_DIRS = {"__pycache__", ".git", "node_modules"}
# Folders a job made from its downloads, as opposed to the downloads themselves.
PREPARED = {"normalized": "Prepared · normalized", "extracted": "Prepared · extracted", "notes": "Job's notes",
            "checksums": "Checksums", "tools": "Job's scripts", "logs": "Logs"}
# Source folders whose names say little, in plain words (used when a manifest gives no title).
FOLDER_NAMES = {"loc-gm": "Library of Congress · maps", "nypl": "New York Public Library", "internet-archive": "Internet Archive",
                "archive-org": "Internet Archive", "wikimedia-commons": "Wikimedia Commons", "_terms": "Licence terms",
                "_catalogue": "Catalogue", "commons": "Wikimedia Commons", "csntm": "CSNTM manuscripts",
                "etcbc-dss": "Dead Sea Scrolls (ETCBC)", "wikidata": "Wikidata", "wikipedia": "Wikipedia", "gutenberg": "Project Gutenberg",
                "ccel": "CCEL", "hymnary": "Hymnary.org", "images": "Images",
                # The reference library, named as its reading desk names them (build-data-acquisition.mjs).
                "catholic-encyclopedia": "The Catholic Encyclopedia", "mcclintock-strong": "McClintock & Strong · Cyclopaedia",
                "schaff-herzog": "New Schaff–Herzog Encyclopedia", "christian-biography": "Wace & Piercy · Dictionary of Christian Biography",
                "brad-east-153-theologians": "Brad East · 153 theologians", "carolina-100-philosophers-and-theologians": "100 philosophers and theologians",
                "fifty-key-christian-thinkers": "Fifty Key Christian Thinkers", "the-great-theologians": "The Great Theologians",
                "131-christians-everyone-should-know": "131 Christians Everyone Should Know"}
TYPES = {
    "Text": {".txt", ".md", ".html", ".htm", ".xml", ".tei", ".rtf", ".epub", ".usfm", ".usx", ".osis"},
    "PDF": {".pdf", ".djvu"},
    "Image": {".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff", ".webp", ".jp2", ".svg", ".bmp"},
    "Audio": {".mp3", ".ogg", ".m4a", ".wav", ".flac", ".opus"},
    "Data": {".json", ".jsonl", ".csv", ".tsv", ".yaml", ".yml", ".sqlite", ".db", ".parquet", ".ndjson"},
    "Archive": {".zip", ".gz", ".tar", ".7z", ".bz2", ".xz"},
    "Code": {".py", ".mjs", ".js", ".ts", ".sh", ".sha256", ".log", ".out"},
}
HOSTS = {"archive.org": "Internet Archive", "gutenberg.org": "Project Gutenberg", "github.com": "GitHub",
         "githubusercontent.com": "GitHub", "wikidata.org": "Wikidata", "wikipedia.org": "Wikipedia",
         "wikimedia.org": "Wikimedia Commons", "ccel.org": "CCEL", "librivox.org": "LibriVox", "loc.gov": "Library of Congress",
         "nypl.org": "NYPL", "hymnary.org": "Hymnary.org", "metmuseum.org": "Met Museum", "huggingface.co": "Hugging Face",
         "kaggle.com": "Kaggle", "si.edu": "Smithsonian", "artic.edu": "Art Institute of Chicago",
         "clevelandart.org": "Cleveland Museum of Art", "europeana.eu": "Europeana", "cdli.mpiwg-berlin.mpg.de": "CDLI",
         "cdli.earth": "CDLI", "oracc.museum.upenn.edu": "ORACC", "csntm.org": "CSNTM"}


def file_type(path: Path) -> str:
    ext = path.suffix.lower()
    return next((name for name, exts in TYPES.items() if ext in exts), "Other")


def host_label(url: str | None) -> str:
    if not url:
        return ""
    host = (urlparse(url).hostname or "").removeprefix("www.")
    return next((label for domain, label in HOSTS.items() if host == domain or host.endswith("." + domain)), host)


def source_records(manifest: object) -> dict[str, dict]:
    """Every dict in a manifest that describes a source, keyed by its slug (or by the key it sits under)."""
    found: dict[str, dict] = {}

    def visit(value: object, key: str | None) -> None:
        if isinstance(value, dict):
            named = next((value[k] for k in ("slug", "source") if isinstance(value.get(k), str)), None)
            slug = named or key
            if slug and any(k in value for k in ("url", "title", "publisher", "licence", "license", "source_url", "source_name", "source_urls")):
                found.setdefault(slug.lower(), value)
            for k, v in value.items():
                visit(v, k)
        elif isinstance(value, list):
            for item in value:
                visit(item, None)

    visit(manifest, None)
    return found


def first_text(record: dict, *keys: str) -> str:
    for key in keys:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, list) and value and isinstance(value[0], str):
            return value[0]
        if isinstance(value, dict) and value:  # e.g. "licence": {"name": ...}, or counts per licence
            inner = first_text(value, "name", "label", "id", "summary")
            return inner or " · ".join(list(value)[:3])
    return ""


# Licence wording that makes a source questionable: no licence, unclear or unknown rights, research only,
# non-commercial, all rights reserved, or a licence the job found does not hold up.
QUESTIONABLE = re.compile(
    r"^\s*\"?(?:none|no licen[cs]e)|not licensed|all rights reserved|unclear|unknown|research[- ]only|non-?commercial|"
    r"by-nc|\bnc\b|not redistributable|not cleared|does not survive|may not sell|weaker evidence|usage polic|\"?is_open\"?: false|"
    r"\"?is_non_commercial\"?: true", re.IGNORECASE)
LICENCE_KEYS = re.compile(r"licen[cs]e|rights|publishable|is_open|is_non_commercial", re.IGNORECASE)
NOT_A_SOURCE = {"_terms", "_catalogue", "images", "raw"}


def licence_check(record: dict) -> tuple[bool, str]:
    """(questionable, the wording that says so) from a source record's licence fields only."""
    for key, value in record.items():
        if not LICENCE_KEYS.search(key):
            continue
        if value is False and key == "publishable":
            return True, "Marked not publishable"
        if value is None:
            return True, "No licence recorded"
        if isinstance(value, dict):
            # {"name": "CC BY-NC 4.0", "is_non_commercial": true, ...} reads as its name;
            # {"<licence>": <count>, ...} as the questionable licences with their counts.
            if QUESTIONABLE.search(json.dumps(value, ensure_ascii=False)) and isinstance(value.get("name"), str):
                return True, value["name"]
            counted = [f"{n} × {k}" for k, n in value.items() if QUESTIONABLE.search(str(k))]
            if counted:
                return True, " · ".join(counted)
            continue
        text = str(value)
        found = QUESTIONABLE.search(text)
        if found:
            if len(text) <= 200:
                return True, text
            # A long note: the sentence that says so, not its opening.
            before = text.rfind(". ", 0, found.start())
            end = text.find(". ", found.end())
            return True, text[before + 2 if before >= 0 else 0:end + 1 if end >= 0 else len(text)].strip()[:300]
    if not any(LICENCE_KEYS.search(k) for k in record):
        return True, "No licence recorded"
    return False, ""


def describe(name: str, records: dict[str, dict]) -> dict:
    key = name.lower()
    fallback = FOLDER_NAMES.get(key) or name.replace("-", " ").replace("_", " ").strip().capitalize()
    record = records.get(key)
    if record is None:
        near = [r for slug, r in records.items() if key in slug or slug in key]
        if not near and FOLDER_NAMES.get(key):
            near = [r for r in records.values() if host_label(first_text(r, "url", "archive_url", "source_url", "licence_url")) == FOLDER_NAMES[key]]
        if len(near) > 1:  # one folder holding several sources (e.g. raw/ccel/): name the folder, not one of them
            url = next((u for u in (first_text(r, "url", "archive_url", "source_urls") for r in near) if u.startswith("http")), "")
            flagged = [licence_check(r) for r in near]
            reason = next((why for bad, why in flagged if bad), "")
            return {"title": fallback, "publisher": "", "url": "", "host": host_label(url), "licence": f"{len(near)} works, each with its own licence",
                    "licence_flag": bool(reason), "licence_reason": reason}
        record = near[0] if near else {}
    url = first_text(record, "url", "archive_url", "source_url", "source_urls", "homepage")
    if not re.fullmatch(r"https?://\S+", url):  # some manifests put a description where the address goes
        found = re.search(r"(?:[a-z0-9-]+\.)+[a-z]{2,}", url.lower())
        host = host_label(f"https://{found.group(0)}") if found else ""
        url = ""
    else:
        host = host_label(url)
    flag, reason = licence_check(record) if record or key not in NOT_A_SOURCE else (None, "")
    return {"title": first_text(record, "title", "source_name", "name") or fallback,
            "publisher": first_text(record, "publisher", "provider", "organisation", "organization"),
            "url": url, "host": host, "licence": first_text(record, "licence", "licence_as_stated", "license"),
            "licence_flag": flag, "licence_reason": reason}


def group_of(relative: Path, source_dirs: tuple[str, ...] = ()) -> tuple[str, str, bool]:
    """(group key, folder name, is a download) for a file's path inside the intake."""
    parts = relative.parts
    # Libraries laid out by kind: Encyclopedias/<work>/... or Scholar-Lists/<file> is one source each.
    if parts[0] in source_dirs and len(parts) > 1:
        name = parts[1] if len(parts) > 2 else relative.stem
        return f"source/{name}", name, True
    # output/<source>.csv is that source's finished question list (content/questions/sources/tools/build_output.py).
    if parts[0] == "output" and len(parts) == 2 and relative.suffix == ".csv":
        if relative.stem in ("images", "raw"):  # a flat images/ or raw/ folder is its own group
            return relative.stem, relative.stem, True
        return f"source/{relative.stem}", relative.stem, True
    # A source's downloads may sit in raw/<source>/ and images/<source>/: both are that source.
    if parts[0] in ("raw", "images") and len(parts) > 2:
        return f"source/{parts[1]}", parts[1], True
    if parts[0] in ("raw", "images"):
        # Loose notes the job wrote beside its downloads (LICENCES.md, harvest logs) are the job's, not a source.
        if relative.suffix.lower() in (".md", ".log", ".txt", ".out"):
            return "notes", "notes", False
        return parts[0], "images" if parts[0] == "images" else "raw", True
    if len(parts) > 1:
        return parts[0], parts[0], False
    return "", "Intake folder", False


def build_intake(spec: dict) -> dict:
    root = PROJECT / spec["folder"]
    manifest_path = root / "manifest.json"
    records = source_records(json.loads(manifest_path.read_text(encoding="utf-8"))) if manifest_path.exists() else {}
    receipt = root / "download-receipt.json"
    if not records and receipt.exists():
        # The reference library keeps a download record per file instead of a manifest: one record per work,
        # titled by its folder name, with no licence field (so the licence counts as not recorded).
        for item in json.loads(receipt.read_text(encoding="utf-8"))["items"].values():
            records.setdefault(item["group"].lower(), {"url": item.get("url", "")})
    groups: dict[str, dict] = {}
    files: list[list] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or SKIP_DIRS.intersection(path.parts):
            continue
        relative = path.relative_to(root)
        if relative.parts[0] == "output" and relative.suffix != ".csv":
            continue  # output/_status.json is read below, not listed
        key, name, download = group_of(relative, tuple(spec.get("source_dirs", ())))
        if key not in groups:
            info = describe(name, records) if download and name != "raw" else {"title": PREPARED.get(name, name), "publisher": "", "url": "", "host": "", "licence": ""}
            groups[key] = {"key": key, "download": download, "licence_flag": None, "licence_reason": "", **info, "files": 0, "bytes": 0}
        size = path.stat().st_size
        groups[key]["files"] += 1
        groups[key]["bytes"] += size
        kind = "Output" if relative.parts[0] == "output" else file_type(path)
        groups[key]["pdf_bytes"] = groups[key].get("pdf_bytes", 0) + (size if kind == "PDF" else 0)
        files.append([list(groups).index(key), relative.as_posix(), size, kind])
    # A downloaded source is a scan when most of its bytes are PDFs (scanned books, with their OCR beside
    # them); otherwise it is text & data, ready to use. Text & data is listed first.
    for g in groups.values():
        g["kind"] = ("scan" if g.pop("pdf_bytes", 0) * 2 >= g["bytes"] > 0 else "text") if g["download"] else "made"
    # Why a source has no output, as tools/build_output.py recorded it.
    status_file = root / "output" / "_status.json"
    if status_file.exists():
        for sid, status in json.loads(status_file.read_text(encoding="utf-8")).items():
            key = sid if sid in ("images", "raw") else f"source/{sid}"
            if key in groups:
                groups[key]["output_rows"] = status.get("rows", 0)
                groups[key]["output_unit"] = status.get("unit", "rows")
                groups[key]["output_note"] = status.get("note", "")
    rank = {"text": 0, "scan": 1, "made": 2}
    # Within each group: clear licences (green) first, then unrated, then questionable (red); biggest first.
    licence_rank = {False: 0, None: 1, True: 2}
    sources = sorted(groups.values(), key=lambda g: (rank[g["kind"]], licence_rank[g["licence_flag"]], -g["bytes"]))
    order = {g["key"]: i for i, g in enumerate(sources)}
    keys = list(groups)
    for row in files:
        row[0] = order[keys[row[0]]]
    by_type: dict[str, list[int]] = {}
    for _, _, size, kind in files:
        entry = by_type.setdefault(kind, [0, 0])
        entry[0] += 1
        entry[1] += size
    downloads = [g for g in sources if g["download"]]
    return {"schema": 1, "slug": spec["slug"], "title": spec["title"], "jobs": spec["jobs"], "folder": spec["folder"],
            "has_manifest": manifest_path.exists(),
            "totals": {"sources": len(downloads), "files": len(files), "bytes": sum(f[2] for f in files),
                       "download_files": sum(g["files"] for g in downloads), "download_bytes": sum(g["bytes"] for g in downloads),
                       "text_bytes": sum(g["bytes"] for g in downloads if g["kind"] == "text"),
                       "scan_bytes": sum(g["bytes"] for g in downloads if g["kind"] == "scan"),
                       "scan_sources": sum(g["kind"] == "scan" for g in downloads),
                       "by_type": by_type},
            "sources": sources, "columns": ["source", "path", "bytes", "type"], "files": files}


def reference_books_card() -> dict:
    data = json.loads(REFERENCE_BOOKS["catalogue"].read_text(encoding="utf-8"))
    records = data.get("records", [])
    by_type: dict[str, list[int]] = {}
    for r in records:
        kind = {"TXT": "Text", "PDF": "PDF", "HTML": "Text"}.get(r.get("format", ""), "Other")
        entry = by_type.setdefault(kind, [0, 0])
        entry[0] += 1
        entry[1] += r.get("bytes") or 0
    return {"slug": REFERENCE_BOOKS["slug"], "title": REFERENCE_BOOKS["title"], "jobs": REFERENCE_BOOKS["jobs"],
            "also": {"label": "Files & output", "href": "/data_intake/reference_library/"},
            "sources": len({r.get("group") for r in records}), "files": len(records),
            "bytes": sum(r.get("bytes") or 0 for r in records), "by_type": by_type, "has_manifest": True}


def main() -> None:
    OUT.mkdir(exist_ok=True)
    cards = [reference_books_card()]
    for spec in INTAKES:
        catalogue = build_intake(spec)
        (OUT / spec["slug"]).mkdir(exist_ok=True)
        (OUT / spec["slug"] / "catalogue.json").write_text(json.dumps(catalogue, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        t = catalogue["totals"]
        if spec.get("card") is False:
            print(f"{spec['slug']}: {t['sources']} sources, {t['files']} files (no card of its own)")
            continue
        cards.append({"slug": spec["slug"], "title": spec["title"], "jobs": spec["jobs"], "sources": t["sources"],
                      "files": t["files"], "bytes": t["bytes"], "by_type": t["by_type"], "has_manifest": catalogue["has_manifest"]})
        print(f"{spec['slug']}: {t['sources']} sources, {t['files']} files, {t['bytes'] / 1e9:.2f} GB")
    built = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    (OUT / "catalogue.json").write_text(json.dumps({"schema": 1, "built": built, "intakes": cards}, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
