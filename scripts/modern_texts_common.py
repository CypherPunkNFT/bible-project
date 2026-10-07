"""Resumable, source-preserving HTTP helpers for the modern text mission.

Cached research responses are private working evidence, not published assets.
Content promotion requires a source-specific decision in the acquisition script.
"""
import hashlib
import json
import threading
import uuid
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

SITE = Path(__file__).resolve().parents[1]
RUN = 'run-modern-texts-2026-10-05'
CACHE = SITE / '.local/library' / RUN
REPORT = SITE / 'content/library/reports/modern-texts'
UA = 'BibleProjectLibrary/1.0 (noncommercial personal research; source-preserving)'
LOCKS = {}
LAST = {}

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    # Windows scanners/readers can briefly hold the destination open.
    for attempt in range(12):
        try:
            tmp.replace(path)
            return
        except PermissionError:
            if attempt == 11: raise
            time.sleep(.25)

def fetch(url, delay=1.0):
    key = hashlib.sha256(url.encode()).hexdigest()
    path = CACHE / 'http' / (key + '.body')
    meta = path.with_suffix('.json')
    if path.exists() and meta.exists():
        info = json.loads(meta.read_text(encoding='utf-8'))
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != info['sha256']:
            raise ValueError('Cached bytes changed: '+url)
        return data, info
    host = urlparse(url).netloc
    # Host-level minimums also apply to inventory and policy requests.
    delay = max(delay, 10 if 'wacriswell.com' in host else 3 if 'desiringgod.org' in host else 1)
    lock = LOCKS.setdefault(host, threading.Lock())
    with lock:
        time.sleep(max(0, delay-(time.monotonic()-LAST.get(host, 0))))
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=45) as response:
                data = response.read()
                info = dict(url=url, finalUrl=response.url, mimeType=response.headers.get_content_type(),
                            byteCount=len(data), sha256=hashlib.sha256(data).hexdigest(),
                            retrievedAt=datetime.now(timezone.utc).isoformat(),
                            headers=dict(response.headers.items()))
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            write(meta, info)
            return data, info
        finally:
            LAST[host] = time.monotonic()

if __name__ == '__main__':
    import sys
    from bs4 import BeautifulSoup
    for url in sys.argv[1:]:
        try:
            data, info = fetch(url, delay=10 if 'wacriswell' in url else 1)
            soup = BeautifulSoup(data, 'html.parser')
            print(url, info['byteCount'])
            if 'robots.txt' in url or '.xml' in url:
                print(data.decode(errors='replace')[:14000])
            else:
                for el in soup(['script', 'style', 'nav', 'header', 'footer']): el.decompose()
                print(soup.get_text(' ', strip=True)[:22000])
                print('LINKS', [(a.get_text(' ', strip=True), a.get('href')) for a in soup.select('a[href]')][:120])
        except Exception as exc:
            print(url, type(exc).__name__, str(exc))
