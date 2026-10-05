"""Resume the existing collector with bounded retries for Windows checkpoint locks."""
import importlib.util
import json
import os
import sys
import time
import hashlib
import urllib.request
import urllib.error
import argparse
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE / '.local/library/ready-text-completion/python-deps'))
import modern_texts_common as shared


def safe_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.' + str(os.getpid()) + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    for attempt in range(30):
        try:
            temporary.replace(path)
            return
        except PermissionError:
            if attempt == 29: raise
            time.sleep(.2)


last_request = 0
def paced_fetch(url, delay=1.0):
    """Same verified cache; conservative sequential pacing and access stops."""
    global last_request
    key = hashlib.sha256(url.encode()).hexdigest()
    path = shared.CACHE / 'http' / (key + '.body'); meta = path.with_suffix('.json')
    if path.exists() and meta.exists():
        data = path.read_bytes(); info = json.loads(meta.read_text(encoding='utf-8'))
        assert hashlib.sha256(data).hexdigest() == info['sha256']
        return data, info
    time.sleep(max(0, max(3.0, delay) - (time.monotonic() - last_request)))
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': shared.UA}), timeout=45) as response:
            data = response.read()
            info = dict(url=url, finalUrl=response.url, mimeType=response.headers.get_content_type(),
                        byteCount=len(data), sha256=hashlib.sha256(data).hexdigest(),
                        retrievedAt=datetime.now(timezone.utc).isoformat())
        path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data); safe_write(meta, info)
        return data, info
    except urllib.error.HTTPError as exc:
        if exc.code in (403, 429):
            safe_write(SITE / 'content/library/reports/ready-text-completion/piper-access-stop.json',
                       dict(url=url, code=exc.code, retryAfter=exc.headers.get('Retry-After'),
                            checkedAt=datetime.now(timezone.utc).isoformat(), action='Stopped; no automatic retries.'))
        raise
    finally:
        last_request = time.monotonic()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume-after-cooldown', action='store_true')
    args = parser.parse_args()
    state = SITE / 'content/library/reports/ready-text-completion/piper-resume.json'
    if state.exists() and json.loads(state.read_text())['status'] == 'review-access-stop' and not args.resume_after_cooldown:
        raise SystemExit('Prior access/rate stop retained. Review source cooldown before using --resume-after-cooldown; no request made.')
    shared.write = safe_write
    shared.fetch = paced_fetch
    spec = importlib.util.spec_from_file_location('collector', SITE / 'scripts/collect-modern-texts.py')
    collector = importlib.util.module_from_spec(spec); spec.loader.exec_module(collector)
    safe_write(state, dict(pid=os.getpid(), status='running', reason='Previous worker stopped on Windows checkpoint rename; cached URLs and originals reused.'))
    try:
        collector.collect_piper(['messages'])
        inventory = shared.REPORT / 'piper-messages-inventory.json'
        results = json.loads((shared.REPORT / 'piper-results.json').read_text(encoding='utf-8'))
        items = json.loads(inventory.read_text(encoding='utf-8'))['items']
        missing = [x['url'] for x in items if x['url'] not in results]
        safe_write(state, dict(pid=os.getpid(), status='inventory-processed' if not missing else 'review-access-stop', expected=len(items), processed=len(results), missing=missing))
    except Exception as exc:
        safe_write(state, dict(pid=os.getpid(), status='failed', error=str(exc)))
        raise
