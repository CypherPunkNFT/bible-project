"""Throttled fetcher. Usage: python fetch.py URL OUTFILE
Writes body to OUTFILE (must not exist) and OUTFILE.meta.json with status/headers/finalUrl.
ccel.org spaced >=10.5 s (robots.txt Crawl-delay: 10); other hosts >=2.5 s.
Exits 2 on 429/403/5xx.
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


def throttle(host):
    stamp = HERE / f".last_{host.replace(':', '_')}"
    gap = 10.5 if "ccel.org" in host else 2.5
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
        with urllib.request.urlopen(req, timeout=120) as r:
            body = r.read()
            status, headers, final = r.status, dict(r.headers), r.geturl()
    except urllib.error.HTTPError as e:
        body = e.read()
        status, headers, final = e.code, dict(e.headers), url
    meta = {"url": url, "finalUrl": final, "status": status, "headers": headers,
            "byteCount": len(body), "sha256": hashlib.sha256(body).hexdigest(),
            "retrievedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(body)
    pathlib.Path(str(out) + ".meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(status, len(body), final)
    if status in (429, 403) or status >= 500:
        sys.exit(2)
    return meta


if __name__ == "__main__":
    fetch(sys.argv[1], sys.argv[2])
