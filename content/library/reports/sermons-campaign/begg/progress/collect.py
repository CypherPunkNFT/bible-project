"""Hold every Alistair Begg sermon page in Truth For Life's sermon sitemap that the library does not hold yet.

The 5 October collector (scripts/collect-expanded-libraries.py --source begg) kept only pages with a transcript;
this one also keeps the audio-only pages, whose metadata still states the main text (scripture_ref). Terms and
robots.txt read first: ../TERMS.md. Pages are saved byte for byte with provenance.json, as the held source-begg
pages are, under sources/library/source-truth-for-life/asset-sermons-begg-<Truth For Life sermon ID>/.

Held means: an address any Begg work or held page is known by, or a Truth For Life sermon ID a held page shows.
Each folder is built in a staging folder outside the library and renamed into place whole, provenance last.
Checkpoint: checkpoint.json here, rewritten after every address; a run first re-reads the saved folders from disk.
Stops on 401/403/429/503 or a robots refusal (exit 2), or 3 failures in a row (exit 3); never works around one.

Usage (from Website/): python -X utf8 content/library/reports/sermons-campaign/begg/progress/collect.py --limit 400
                       python -X utf8 content/library/reports/sermons-campaign/begg/progress/collect.py --manifest
"""
import argparse
import hashlib
import html
import http.client
import importlib.util
import json
import os
import re
import shutil
import sys
import time
from collections import Counter
import urllib.error
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[5]
sys.path.insert(0, str(SITE / "scripts"))
_spec = importlib.util.spec_from_file_location("sermon_passages", SITE / "scripts" / "sermon-passages.py")
sp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sp)

LIBRARY = sp.HELD / "source-truth-for-life"
RUN = SITE / ".local" / "library" / "run-begg-archive-20261126"
STAGING = RUN / "staging"
SITEMAP = HERE.parent / "raw" / "terms" / "sitemap-sermons.xml"
CHECKPOINT = HERE / "checkpoint.json"
LOCK = HERE / "collect.lock"
MANIFEST = HERE.parent / "acquisition-manifest.json"
UA = "BibleProjectLibrary/1.0 (noncommercial personal research; source-preserving)"
POLICY = "https://www.truthforlife.org/about/policies/"
DELAY = 2.0  # robots.txt declares no Crawl-delay for "*"; the 5 October run used 1 s
STOP = {401, 403, 429, 503}
NOT_A_SERMON = re.compile(r"\b(Q\s*&\s*A|Q and A|Questions? and Answers?|Panel|Interview)\b", re.I)
SERMON_ID = re.compile(r'class="?post-id[^>]*>[^<]*\(ID:\s*(\d+)\)')
RESOURCE_ID = re.compile(r"name=resource_id data-type=integer content=(\d+)")  # database number; a few pages show no "(ID: N)"


def save_json(path, value):
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(value, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    replace(tmp, path)


def replace(source, target):
    for attempt in range(6):  # Windows: an indexer or scanner can hold a file open for a moment
        try:
            return os.replace(source, target)
        except PermissionError:
            if attempt == 5:
                raise
            time.sleep(0.5 * (attempt + 1))


def page_id(text):
    found = SERMON_ID.search(text)
    return found.group(1) if found else None


def page_key(text):
    """The page's sermon number ("0150"), else "r" + its database number ("r2804"): what its folder and work are named by."""
    found = RESOURCE_ID.search(text)
    return page_id(text) or (f"r{found.group(1)}" if found else None)


def held_sets():
    """(addresses, Truth For Life sermon IDs) the library already holds for Begg."""
    works, addresses = sp.load_works()
    held = {a for a, w in addresses.items() if works[w][0] == "begg"}
    ids = {n for _name, work in works.values() if _name == "begg" for n in (work.get("externalIds") or {}).get("officialSermonNumber", [])}
    for address, _asset, _url, text in sp.held_pages(["source-begg", "source-truth-for-life"], Counter()):
        held.add(address)
        ids.update({page_id(text), page_key(text), f"r{m.group(1)}" if (m := RESOURCE_ID.search(text)) else None})
    ids.discard(None)
    return held, ids


def reconcile(checkpoint):
    """Folders already saved count as saved even if the run stopped before its checkpoint write."""
    for folder in sorted(LIBRARY.glob("asset-sermons-begg-*")):
        prov_file = folder / "provenance.json"
        if not prov_file.exists():
            sys.exit(f"{folder} has no provenance.json: a folder is only renamed into place complete; inspect it by hand")
        prov = json.loads(prov_file.read_text(encoding="utf-8"))
        if hashlib.sha256((folder / "original.html").read_bytes()).hexdigest() != prov["sha256"]:
            sys.exit(f"{folder}: original.html no longer matches its recorded sha256")
        record = checkpoint.get(prov["url"], {})
        if record.get("status") != "saved":
            checkpoint[prov["url"]] = dict(status="saved", assetId=prov["assetId"], sermonId=prov["assetId"].removeprefix("asset-sermons-begg-"), title=prov["title"],
                                           finalUrl=prov["finalUrl"], note="recovered from disk")
    if STAGING.exists():
        shutil.rmtree(STAGING)  # only unfinished staging copies live here, never held folders


def robots():
    request = urllib.request.Request("https://www.truthforlife.org/robots.txt", headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=45) as response:
        parser = urllib.robotparser.RobotFileParser()
        parser.parse(response.read().decode("utf-8", errors="replace").splitlines())
    return parser


def fetch(url, last):
    time.sleep(max(0.0, DELAY - (time.monotonic() - last)))
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return response.status, response.read(), response.headers, response.url
    except urllib.error.HTTPError as error:
        return error.code, b"", error.headers, url


def read_page(body, headers):
    text = body.decode(headers.get_content_charset() or "utf-8", errors="replace")
    soup = BeautifulSoup(text, "html.parser")
    authors = [" ".join(html.unescape(a.get_text(" ", strip=True)).split()) for a in soup.select(".post-author")]
    meta = {m.get("name"): m.get("content") for m in soup.select("meta[name]")
            if m.get("name") in ("resource_date", "published_on", "series_title", "scripture_ref", "audio_duration")}
    transcript = soup.select_one("#transcript .copy")
    return dict(text=text, title=" ".join(soup.select_one("h1").get_text(" ", strip=True).split()) if soup.select_one("h1") else "",
                authors=[a.removeprefix("by ").strip() for a in authors], meta=meta, sermonId=page_id(text), key=page_key(text),
                resourceId=(RESOURCE_ID.search(text) or [None, None])[1],
                transcript=transcript.get_text(" ", strip=True) if transcript else "")


def save(url, final, body, headers, page):
    asset_id = f"asset-sermons-begg-{page['key']}"
    target = LIBRARY / asset_id
    if target.exists():
        sys.exit(f"refusing to overwrite {target}")
    stage = STAGING / asset_id
    stage.mkdir(parents=True)
    (stage / "original.html").write_bytes(body)
    words = len(re.findall(r"\b[\w’'-]+\b", page["transcript"]))
    prov = dict(url=url, finalUrl=final, mimeType=headers.get_content_type(), byteCount=len(body),
                sha256=hashlib.sha256(body).hexdigest(), retrievedAt=datetime.now(timezone.utc).isoformat(),
                headers=dict(headers.items()), assetId=asset_id, author="Alistair Begg", title=page["title"], format="html",
                relativePath=f"library/source-truth-for-life/{asset_id}/original.html", sourcePage=url,
                textKind="official-sermon-transcript" if words >= 150 else "official-sermon-page-no-transcript",
                transcriptOffered=words >= 150, tflSermonId=page["sermonId"], tflResourceId=page["resourceId"], sourceMetadata=page["meta"],
                rightsCategory="restricted-license", useScope="private-noncommercial-reading", publicHostingAllowed=False,
                publicFullTextIndexAllowed=False, policyUrl=POLICY)
    if words >= 150:
        text_file = RUN / "text" / f"{asset_id}.txt"
        text_file.parent.mkdir(parents=True, exist_ok=True)
        text_file.write_text(page["transcript"], encoding="utf-8")
        prov["derivedText"] = dict(path=text_file.relative_to(SITE).as_posix(), wordCount=words,
                                   sha256=hashlib.sha256(text_file.read_bytes()).hexdigest(),
                                   method="Existing publisher text; no OCR; no model calls", quality="unreviewed")
    (stage / "provenance.json").write_text(json.dumps(prov, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    replace(stage, target)
    return asset_id, prov


def classify(url, status, body, headers, final, held, ids):
    """(status, page or None): only a well-formed Truth For Life sermon page can be anything but "unparsed"."""
    if status in (404, 410):
        return "gone", None
    parts = urlsplit(final)
    if status != 200 or headers.get_content_type() != "text/html" or parts.netloc != "www.truthforlife.org" \
            or not parts.path.startswith("/resources/sermon/"):
        return "unparsed", None
    page = read_page(body, headers)
    if not page["authors"]:
        return "unparsed", page
    if page["authors"] != ["Alistair Begg"]:  # other speakers' pages may lack the "(ID: N)" line
        return ("joint-speakers" if any("Begg" in a for a in page["authors"]) else "other-speaker"), page
    if not page["key"]:
        return "unparsed", page
    if sp.norm(final) in held or ({page["sermonId"], page["key"], page["resourceId"] and f"r{page['resourceId']}"} - {None}) & ids:
        return "already-held", page
    if NOT_A_SERMON.search(f"{page['title']} {page['meta'].get('series_title') or ''} {parts.path.replace('-', ' ')}"):
        return "needs-review-not-a-sermon", page
    return "begg", page


def collect(limit):
    checkpoint = json.loads(CHECKPOINT.read_text(encoding="utf-8")) if CHECKPOINT.exists() else {}
    reconcile(checkpoint)
    save_json(CHECKPOINT, checkpoint)
    held, ids = held_sets()
    rules = robots()
    urls = [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>", SITEMAP.read_text(encoding="utf-8"))]
    done, failures, last = 0, 0, 0.0
    for url in urls:
        record = checkpoint.get(url, {})
        if sp.norm(url) in held or record.get("status") not in (None, "unparsed", "error"):
            continue
        if record.get("attempts", 0) >= 3:
            continue
        if not rules.can_fetch(UA, url):
            checkpoint[url] = dict(status="robots-disallowed")
            save_json(CHECKPOINT, checkpoint)
            print("robots.txt disallows", url, flush=True)
            return 2
        try:
            status, body, headers, final = fetch(url, last)
        except (urllib.error.URLError, OSError, http.client.HTTPException) as error:
            status, body, headers, final = None, b"", None, url
            problem = str(error)
        last = time.monotonic()
        if status in STOP:
            checkpoint[url] = dict(record, status="blocked", httpStatus=status, retryAfter=headers.get("Retry-After"),
                                   at=datetime.now(timezone.utc).isoformat())
            save_json(CHECKPOINT, checkpoint)
            print(f"STOP: HTTP {status} at {url}; Retry-After {headers.get('Retry-After')}", flush=True)
            return 2
        if status is None or status >= 500:
            kind, page = "error", None
            problem = problem if status is None else f"HTTP {status}"
        else:
            kind, page = classify(url, status, body, headers, final, held, ids)
            problem = None if kind != "unparsed" else f"HTTP {status}, {final}, not a well-formed sermon page"
        entry = dict(status=kind, finalUrl=final, httpStatus=status, attempts=record.get("attempts", 0) + 1)
        if page:
            entry.update(title=page["title"], authors=page["authors"], sermonId=page["sermonId"] or page["key"])
        if problem:
            entry["problem"] = problem
        if kind == "begg":
            asset_id, prov = save(url, final, body, headers, page)
            entry.update(status="saved", assetId=asset_id, transcriptOffered=prov["transcriptOffered"])
            held.update({sp.norm(url), sp.norm(final)})
            ids.update({page["sermonId"], page["key"]} - {None})
        checkpoint[url] = entry
        save_json(CHECKPOINT, checkpoint)
        failures = failures + 1 if kind in ("error", "unparsed") else 0
        done += 1
        print(f"{done} {entry['status']} {entry.get('sermonId')} {url}", flush=True)
        if failures >= 3:
            print("STOP: three failures in a row", flush=True)
            return 3
        if limit and done >= limit:
            break
    return 0


AUDIO = re.compile(r'name=resource_audio_url data-type=enum content="?([^" >]+)')


def same_sermon(folders):
    """{assetId: assetId kept}: Truth For Life keeps some sermons twice ("0562" and "562", or a page with no number
    that plays "0150-alwaysabounding.mp3"). One sermon number or one audio file is one sermon; the page stating a text
    and a sermon number is kept."""
    rows = []
    for folder in folders:
        prov = json.loads((folder / "provenance.json").read_text(encoding="utf-8"))
        audio = AUDIO.search((folder / "original.html").read_text(encoding="utf-8", errors="replace"))
        keys = {("number", int(prov["tflSermonId"])) if prov["tflSermonId"] else None,
                ("audio", audio.group(1).rsplit("/", 1)[-1].lower()) if audio else None} - {None}
        rows.append((not prov["sourceMetadata"].get("scripture_ref"), not prov["tflSermonId"], prov["assetId"], keys))
    kept, copies = {}, {}
    for *_rank, asset_id, keys in sorted(rows):
        first = next((kept[k] for k in keys if k in kept), None)
        if first:
            copies[asset_id] = first
        for k in keys:
            kept.setdefault(k, first or asset_id)
    return copies


def manifest():
    """One entry per saved Begg sermon page, read from the held folders (not from the checkpoint alone)."""
    sermons, duplicates = [], []
    folders = sorted(LIBRARY.glob("asset-sermons-begg-*"))
    copies = same_sermon(folders)
    for folder in folders:
        prov = json.loads((folder / "provenance.json").read_text(encoding="utf-8"))
        if prov["assetId"] in copies:
            duplicates.append(dict(assetId=prov["assetId"], url=prov["url"], title=prov["title"], sameSermonAs=copies[prov["assetId"]]))
            continue
        meta = prov["sourceMetadata"]
        key = prov["assetId"].removeprefix("asset-sermons-begg-")
        notes = [f"Truth For Life sermon ID {prov['tflSermonId']}." if prov["tflSermonId"] else
                 f"The page shows no Truth For Life sermon ID; its database number is {prov['tflResourceId']}."]
        if meta.get("audio_duration"):
            notes.append(f"Publisher audio duration: {meta['audio_duration']}.")
        if not prov["transcriptOffered"]:
            notes.append("Truth For Life offers this sermon as audio/video only: the held page carries its metadata, no transcript.")
        date = meta.get("resource_date")
        sermons.append(dict(
            number=int(key) if key.isdigit() else key, title=prov["title"], url=prov["url"], assetId=prov["assetId"],
            sermonId=prov["tflSermonId"], transcriptOffered=prov["transcriptOffered"],
            locator="Truth For Life sermon page", series=meta.get("series_title") and f"Series: {meta['series_title']}",
            date=dict(value=date, precision="day", label="Publisher resource_date") if date else None,
            era="twentieth-century" if date and date < "2001" else "twenty-first-century" if date else "unknown",
            scriptureRef=meta.get("scripture_ref"), mainText=None, notes=" ".join(notes)))
    save_json(MANIFEST, dict(
        termsSummary="Truth For Life copyright policy (read 2026-11-26): sermons may be duplicated and distributed unaltered, free and "
                     "credited; written web content may be posted unedited with links and credit; permissions may be revoked or modified. "
                     "robots.txt: no Crawl-delay for '*', only query-string listings and /flashdrive/ disallowed. Private noncommercial "
                     "reading; no public hosting; the site links to the original. Full quotes in TERMS.md.",
        passages="Main texts are placed by scripts/sermon-passages.py from each held page's scripture_ref (passage-overlays/begg.json); "
                 "scriptureRef here is a copy for reading only.",
        counts=dict(sermons=len(sermons), withTranscript=sum(s["transcriptOffered"] for s in sermons), secondPagesOfOneSermon=len(duplicates)),
        sermons=sermons, secondPagesOfOneSermon=duplicates))
    print("manifest:", len(sermons), "sermons;", len(duplicates), "second pages of one sermon")


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--limit", type=int, help="batch size: addresses requested this run")
    parser.add_argument("--manifest", action="store_true", help="write ../acquisition-manifest.json from the held folders; no requests")
    args = parser.parse_args()
    if args.manifest:
        return manifest()
    try:
        lock = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        sys.exit(f"another run holds {LOCK} (delete it only if no collect.py process is running)")
    os.write(lock, str(os.getpid()).encode())
    os.close(lock)
    try:
        code = collect(args.limit)
    finally:
        LOCK.unlink()
    sys.exit(code)


if __name__ == "__main__":
    main()
