#!/usr/bin/env python3
"""Download the approved rows of the open-workbooks table into Research/Resources/OpenWorkbooks/files/.

    python scripts/fetch-open-workbooks.py            # every approved row not yet downloaded
    python scripts/fetch-open-workbooks.py --plan     # say what would be fetched, download nothing

Where a file comes from, in order: the row's "fetch" list (set by hand for multi-file titles), its downloadUrl,
or its landing page when that is an Internet Archive item (the item's PDF) or a Project Gutenberg book (its EPUB
and its HTML, which open-workbooks.mjs later prints to PDF). Each file is checked (a PDF must start with %PDF),
then its size and SHA-256 go into the row and into files/manifest.json, and the row becomes "downloaded".
A row nothing can be found for is left "approved" and listed at the end.
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
HOME = PROJECT / "Research" / "Resources" / "OpenWorkbooks"
TABLE = HOME / "open-workbooks.json"
FILES = HOME / "files"
USER_AGENT = "bible-guide-open-workbooks/1.0 (+https://bibleguide.io)"


def get(url: str, timeout: int = 180):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(request, timeout=timeout)


def archive_pdf(item: str) -> str:
    """The Internet Archive item's own PDF: its searchable "Text PDF" when there is one."""
    with get(f"https://archive.org/metadata/{item}") as response:
        meta = json.load(response)
    pdfs = [f for f in meta.get("files", []) if f["name"].lower().endswith(".pdf")]
    if not pdfs:
        raise ValueError(f"archive.org item {item} has no PDF (files: {[f['name'] for f in meta.get('files', [])][:8]})")
    best = next((f for f in pdfs if f.get("format") == "Text PDF"), pdfs[0])
    return f"https://archive.org/download/{item}/{urllib.parse.quote(best['name'])}"


def plan(row: dict) -> list[str]:
    if row.get("fetch"):
        return row["fetch"]
    for url in (row.get("downloadUrl"), row.get("sourcePage")):
        if not url:
            continue
        if m := re.match(r"https?://archive\.org/details/([^/?#]+)", url):
            return [archive_pdf(m.group(1))]
        if m := re.match(r"https?://www\.gutenberg\.org/ebooks/(\d+)", url):
            n = m.group(1)
            return [f"https://www.gutenberg.org/cache/epub/{n}/pg{n}-images-3.epub", f"https://www.gutenberg.org/cache/epub/{n}/pg{n}-h.zip"]
        if url == row.get("downloadUrl"):
            return [url]
    return []


def file_name(url: str, index: int) -> str:
    path = urllib.parse.urlparse(url)
    name = Path(urllib.parse.unquote(path.path)).name or f"file-{index}"
    if code := urllib.parse.parse_qs(path.query).get("code"):  # chapellibrary.org/api/books/download?code=fwor&format=pdf
        name = f"{code[0]}.pdf"
    return re.sub(r"[^\w.\-]+", "_", name)[:120]


def fetch(url: str, target: Path) -> dict:
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + ".part")
    with get(url) as response, partial.open("wb") as out:
        shutil.copyfileobj(response, out)
        kind = response.headers.get("Content-Type", "")
    head = partial.read_bytes()[:5]
    if target.suffix.lower() == ".pdf" and head != b"%PDF-":
        partial.unlink()
        raise ValueError(f"{url} did not return a PDF (Content-Type {kind!r}, starts {head!r})")
    if "html" in kind and target.suffix.lower() not in (".htm", ".html"):
        partial.unlink()
        raise ValueError(f"{url} returned a web page, not a file (Content-Type {kind!r})")
    partial.replace(target)
    data = target.read_bytes()
    return {"name": target.name, "url": url, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "fetched": date.today().isoformat()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--plan", action="store_true", help="list what would be fetched without downloading")
    args = parser.parse_args()
    rows = json.loads(TABLE.read_text(encoding="utf-8"))
    missing, failed = [], []
    # A link-only row (a web-page series, a picture library) is shown with a link to its maker and never fetched.
    for row in (r for r in rows if r["status"] == "approved" and not r.get("linkOnly")):
        try:
            urls = plan(row)
        except Exception as error:  # a failed lookup is reported, never silently skipped
            failed.append(f"{row['id']}: lookup failed: {error}")
            continue
        if not urls:
            missing.append(row["id"])
            continue
        if args.plan:
            print(f"{row['id'][:60]:60} {len(urls)} file(s): {urls[0]}")
            continue
        try:
            row["files"] = [fetch(url, FILES / row["id"] / file_name(url, i)) for i, url in enumerate(urls)]
            row["status"] = "downloaded"
            print(f"ok   {row['id'][:60]:60} {sum(f['bytes'] for f in row['files']) / 1e6:7.1f} MB", flush=True)
        except Exception as error:
            failed.append(f"{row['id']}: {error}")
            print(f"FAIL {row['id'][:60]}: {error}", flush=True)
        TABLE.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        time.sleep(1)
    if not args.plan:
        manifest = {r["id"]: r["files"] for r in rows if r.get("files")}
        (FILES / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"\nno source found for {len(missing)}: {', '.join(missing)}" if missing else "\nevery approved row has a source")
    if failed:
        print(f"{len(failed)} failed:\n  " + "\n  ".join(failed))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
