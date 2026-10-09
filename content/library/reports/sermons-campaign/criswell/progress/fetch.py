"""Fetch every W. A. Criswell sermon page listed in the site's own sitemap, in order, resumably.

Run: python -X utf8 -I fetch.py [--limit N]
Obeys robots.txt Crawl-delay: 10 (one request every >= 10 s). Stops on 429/403/503 or a challenge page.
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from parse_page import parse_sermon  # noqa: E402

UA = "BibleProject-library/1.0 (private noncommercial study)"
DELAY = 10.5
LIBRARY = Path(r"D:\FortressOfSolitude\Jarvis\Projects\BibleProject\sources\library\source-criswell")
SITEMAPS = [HERE / "raw" / f"sm-posts-sermons-{n}.xml" for n in (1, 2, 3)]
CHECKPOINT = HERE / "checkpoint.json"
MANIFEST = HERE / "manifest.json"
LOG = HERE / "fetch.log"
POLICY_URL = "https://wacriswell.com/privacy-policy/"
STOP_STATUSES = {401, 403, 429, 503}
TERMS_SUMMARY = (
    "robots.txt allows everything except /wp-admin/ with Crawl-delay: 10 (obeyed: >=10 s per request). "
    "The site publishes no terms-of-use page and no copyright or licence notice; its only legal page is the "
    "Privacy Policy, which names the W. A. Criswell Foundation. With no licence granted, transcripts are held "
    "as all-rights-reserved (restricted-license) for private noncommercial reading only; no public hosting, "
    "no public full-text index. Full quotes in TERMS.md."
)


def log(message):
    line = f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {message}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def write_json_atomic(path, data):
    temporary = path.with_suffix(".tmp")
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=1)
    os.replace(temporary, path)


def load_urls():
    urls = []
    for sitemap in SITEMAPS:
        urls += re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8"))
    if len(urls) != len(set(urls)):
        raise SystemExit(f"sitemap has duplicate URLs: {len(urls)} total, {len(set(urls))} unique")
    return urls


def load_checkpoint():
    if CHECKPOINT.exists():
        return json.loads(CHECKPOINT.read_text(encoding="utf-8"))
    return {"done": {}, "failed": {}, "stoppedBecause": None}


def save_state(state, urls):
    state["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_json_atomic(CHECKPOINT, state)
    sermons = sorted(state["done"].values(), key=lambda entry: entry["number"])
    manifest = {
        "source": "W. A. Criswell Sermon Library, https://wacriswell.com/ (enumerated from wp-sitemap.xml sermon sitemaps)",
        "termsSummary": TERMS_SUMMARY,
        "sermons": sermons,
        "failed": [dict(url=url, **info) for url, info in state["failed"].items()],
        "stoppedBecause": state.get("stoppedBecause"),
        "counts": {
            "enumerated": len(urls),
            "held": len(sermons),
            "failed": len(state["failed"]),
            "remaining": len(urls) - len(sermons) - len(state["failed"]),
            "withStatedReference": sum(1 for s in sermons if s["mainText"]),
            "withDate": sum(1 for s in sermons if s["date"]),
            "withSeries": sum(1 for s in sermons if s["series"]),
            "flaggedMisprint": sum(1 for s in sermons if "misprint" in (s["notes"] or "")),
        },
    }
    write_json_atomic(MANIFEST, manifest)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status, response.geturl(), dict(response.headers.items()), response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.geturl(), dict(error.headers.items()), error.read()


def asset_id_for(url, parsed):
    if parsed["postId"]:
        return f"asset-sermons-criswell-{parsed['postId']}"
    year, slug = re.search(r"/sermons/(\d{4})/([^/]+)/?$", url).groups()
    return f"asset-sermons-criswell-{year}-{slug}"


def hold(url, number, final_url, headers, body):
    parsed = parse_sermon(body.decode("utf-8", errors="replace"))
    asset_id = asset_id_for(url, parsed)
    folder = LIBRARY / asset_id
    if folder.exists():
        existing = folder / "provenance.json"
        if existing.exists() and json.loads(existing.read_text(encoding="utf-8")).get("url") == url:
            log(f"already held, adopting: {asset_id}")
        else:
            raise FileExistsError(f"folder {folder} exists but does not belong to {url}")
    else:
        folder.mkdir(parents=True)
        headers = {k: v for k, v in headers.items() if k.lower() != "set-cookie"}
        provenance = {
            "url": url,
            "finalUrl": final_url,
            "mimeType": headers.get("Content-Type", "").split(";")[0].strip() or None,
            "byteCount": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "retrievedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "headers": headers,
            "assetId": asset_id,
            "author": "W. A. Criswell",
            "title": parsed["title"],
            "format": "html",
            "relativePath": f"library/source-criswell/{asset_id}/original.html",
            "sourcePage": url,
            "textKind": "official-sermon-transcript",
            "rightsCategory": "restricted-license",
            "useScope": "private-noncommercial-reading",
            "publicHostingAllowed": False,
            "publicFullTextIndexAllowed": False,
            "policyUrl": POLICY_URL,
        }
        with open(folder / "original.html", "xb") as handle:
            handle.write(body)
        with open(folder / "provenance.json", "x", encoding="utf-8") as handle:
            json.dump(provenance, handle, ensure_ascii=False, indent=2)
    notes = parsed["notes"] or []
    if not parsed["mainText"]:
        notes.append("no Scripture field on the page")
    if final_url != url:
        notes.append(f"redirected to {final_url}")
    return {
        "number": number, "title": parsed["title"], "url": url, "assetId": asset_id,
        "mainText": parsed["mainText"], "mainTextLocator": parsed["mainTextLocator"],
        "date": parsed["date"], "place": None, "series": parsed["series"],
        "notes": "; ".join(notes) if notes else None,
    }


def is_challenge(body):
    head = body[:20000].decode("utf-8", errors="replace")
    return "cf-chl" in head or "Just a moment..." in head or "challenge-platform" in head and "sermonTitle" not in head


def main():
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    urls = load_urls()
    state = load_checkpoint()
    state["stoppedBecause"] = None
    fetched, last_request = 0, 0.0
    for index, url in enumerate(urls):
        if url in state["done"] or url in state["failed"]:
            continue
        if limit is not None and fetched >= limit:
            state["stoppedBecause"] = f"--limit {limit} reached (test run)"
            break
        for attempt in range(3):
            time.sleep(max(0.0, last_request + DELAY - time.time()))
            try:
                status, final_url, headers, body = fetch(url)
                last_request = time.time()  # delay counted from the END of the previous response
                break
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as error:
                log(f"network error on {url} (attempt {attempt + 1}/3): {error!r}")
                time.sleep(60)
        else:
            state["stoppedBecause"] = f"network errors x3 on {url}"
            break
        fetched += 1
        if status in STOP_STATUSES or is_challenge(body):
            state["stoppedBecause"] = f"HTTP {status} / block on {url}"
            log(state["stoppedBecause"])
            break
        if status != 200:
            state["failed"][url] = {"number": index + 1, "status": status, "reason": f"HTTP {status}"}
            log(f"[{index + 1}/{len(urls)}] HTTP {status} {url}")
        else:
            try:
                entry = hold(url, index + 1, final_url, headers, body)
                state["done"][url] = entry
                log(f"[{index + 1}/{len(urls)}] ok {entry['assetId']} | {entry['mainText']} | {entry['title']}")
            except FileExistsError as error:
                state["failed"][url] = {"number": index + 1, "status": status, "reason": str(error)}
                log(f"[{index + 1}/{len(urls)}] CONFLICT {error}")
        save_state(state, urls)
    else:
        state["stoppedBecause"] = "completed: every sitemap URL attempted"
    save_state(state, urls)
    log(f"finished: {state['stoppedBecause']}")


if __name__ == "__main__":
    main()
