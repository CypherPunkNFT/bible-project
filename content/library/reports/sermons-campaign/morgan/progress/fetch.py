"""Throttled fetcher for the Morgan acquisition.

Usage: python fetch.py URL OUTFILE
Writes body to OUTFILE (refuses if it exists) and OUTFILE.meta.json (status, headers,
finalUrl, sha256, retrievedAt). Per-host throttle: 10.5 s for ccel.org and archive.org (both robots.txt say Crawl-delay: 10),
3 s otherwise. Exits 2 on 403/429/5xx so callers stop.
"""
import datetime
import hashlib
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

HERE = pathlib.Path(__file__).resolve().parent
UA = "BibleProject-library/1.0 (private noncommercial study)"
DEFAULT_GAP = 3.0


def throttle(host):
    stamp = HERE / f".last_{host.replace(':', '_')}"
    gap = 10.5 if ("ccel.org" in host or "archive.org" in host) else DEFAULT_GAP
    if stamp.exists():
        wait = gap - (time.time() - float(stamp.read_text()))
        if wait > 0:
            time.sleep(wait)
    stamp.write_text(str(time.time()))


def fetch(url, out):
    out = pathlib.Path(out)
    if out.exists():
        raise SystemExit(f"refusing to overwrite existing file {out}")
    throttle(urlparse(url).netloc)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read()
            status, headers, final = resp.status, dict(resp.headers), resp.geturl()
    except urllib.error.HTTPError as err:
        body = err.read()
        status, headers, final = err.code, dict(err.headers), url
    meta = {
        "url": url, "finalUrl": final, "status": status, "headers": headers,
        "byteCount": len(body), "sha256": hashlib.sha256(body).hexdigest(),
        "retrievedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(body)
    pathlib.Path(str(out) + ".meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(status, len(body), final)
    if status in (403, 429):
        sys.exit(2)
    if status >= 400:
        sys.exit(3)
    return meta


if __name__ == "__main__":
    fetch(sys.argv[1], sys.argv[2])
