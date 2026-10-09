"""Throttled fetcher shared by every Graham acquisition script.

CLI: python -X utf8 fetch.py URL OUTFILE   (OUTFILE must not exist)
Throttle: >= 2.5 s between requests to the same host, across processes
(throttle.json guarded by an exclusive lock file).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
THROTTLE = HERE / "throttle.json"
LOCK = HERE / "throttle.lock"
UA = "BibleProject-library/1.0 (private noncommercial study)"
GAP = 2.5


class Blocked(Exception):
    """Raised on HTTP 429/403 or a captcha/challenge page: caller must stop."""


def _acquire_lock():
    for _ in range(600):
        try:
            return os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            if time.time() - LOCK.stat().st_mtime > 60:
                LOCK.unlink(missing_ok=True)
            time.sleep(0.1)
    raise RuntimeError(f"could not acquire {LOCK} after 60 s")


def wait_for_host(host):
    """Block until this host's gap has elapsed, then stamp the slot (cross-process)."""
    while True:
        fd = _acquire_lock()
        try:
            state = json.loads(THROTTLE.read_text("utf-8")) if THROTTLE.exists() else {}
            delta = time.time() - state.get(host, 0)
            if delta >= GAP:
                state[host] = time.time()
                THROTTLE.write_text(json.dumps(state), "utf-8")
                return
        finally:
            os.close(fd)
            LOCK.unlink(missing_ok=True)
        time.sleep(GAP - delta + 0.05)


def fetch(url, timeout=60):
    """Return (status, finalUrl, headers dict, body bytes). Raises Blocked on 429/403/captcha."""
    host = urlparse(url).netloc
    wait_for_host(host)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status, final = resp.status, resp.geturl()
            headers, body = dict(resp.headers.items()), resp.read()
    except urllib.error.HTTPError as err:
        status, final = err.code, url
        headers = dict(err.headers.items()) if err.headers else {}
        body = err.read() if err.fp else b""
    if status in (429, 403):
        raise Blocked(f"HTTP {status} at {url}")
    head = body[:4000].lower()
    markers = (b"captcha", b"cf-challenge", b"just a moment...", b"cf-turnstile",
               b"<title>human check", b"verify you\xe2\x80\x99re human", b"verify you're human")
    if any(m in head for m in markers):
        raise Blocked(f"challenge page at {url}")
    return status, final, headers, body


def main():
    url, out = sys.argv[1], Path(sys.argv[2])
    if out.exists():
        raise SystemExit(f"refusing to overwrite {out}")
    status, final, headers, body = fetch(url)
    out.write_bytes(body)
    print(json.dumps({"status": status, "finalUrl": final, "bytes": len(body),
                      "contentType": headers.get("Content-Type")}, indent=1))


if __name__ == "__main__":
    main()
