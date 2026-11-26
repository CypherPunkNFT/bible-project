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


REPORTS = SITE / 'content/library/reports/ready-text-completion'
ACCESS_STOP = REPORTS / 'piper-access-stop.json'
POLICY_URLS = ['https://www.desiringgod.org/robots.txt', 'https://www.desiringgod.org/permissions']


class UncachedRequestRefused(BaseException):
    """A BaseException so the collector's per-item `except Exception` cannot record it and carry on."""


last_request = 0
min_delay = 3.0
live_allowed = None  # with --only-errors: the only addresses that may reach the network


def cached(url):
    path = shared.CACHE / 'http' / (hashlib.sha256(url.encode()).hexdigest() + '.body')
    return path if path.exists() and path.with_suffix('.json').exists() else None


def paced_fetch(url, delay=1.0):
    """Same verified cache; conservative sequential pacing and access stops."""
    global last_request
    key = hashlib.sha256(url.encode()).hexdigest()
    path = shared.CACHE / 'http' / (key + '.body'); meta = path.with_suffix('.json')
    if path.exists() and meta.exists():
        data = path.read_bytes(); info = json.loads(meta.read_text(encoding='utf-8'))
        if hashlib.sha256(data).hexdigest() != info['sha256']:
            raise ValueError('Cached bytes changed: ' + url)
        return data, info
    if live_allowed is not None and url not in live_allowed:
        raise UncachedRequestRefused('--only-errors: refused a request not in the retry list: ' + url)
    time.sleep(max(0, max(min_delay, 3.0, delay) - (time.monotonic() - last_request)))
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
            safe_write(ACCESS_STOP,
                       dict(url=url, code=exc.code, retryAfter=exc.headers.get('Retry-After'),
                            checkedAt=datetime.now(timezone.utc).isoformat(), action='Stopped; no automatic retries.'))
        raise
    finally:
        last_request = time.monotonic()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume-after-cooldown', action='store_true')
    parser.add_argument('--delay', type=float, default=3.0, help='seconds between live requests (never below 3)')
    parser.add_argument('--only-errors', action='store_true',
                        help='live requests only for message pages recorded as error; every other address must already be cached')
    args = parser.parse_args()
    state = REPORTS / 'piper-resume.json'
    previous = json.loads(state.read_text(encoding='utf-8')) if state.exists() else {}
    if (previous.get('status') == 'review-access-stop' or ACCESS_STOP.exists()) and not args.resume_after_cooldown:
        raise SystemExit('Prior access/rate stop retained. Review source cooldown before using --resume-after-cooldown; no request made.')
    min_delay = max(3.0, args.delay)
    results_path = shared.REPORT / 'piper-results.json'
    items = json.loads((shared.REPORT / 'piper-messages-inventory.json').read_text(encoding='utf-8'))['items']
    if args.only_errors:
        # Preflight: everything the collector will read is cached, except the message pages it retries.
        before = json.loads(results_path.read_text(encoding='utf-8'))
        live_allowed = {url for url, record in before.items() if record.get('status') == 'error' and '/messages/' in url}
        needed = POLICY_URLS + sorted({x['indexUrl'] for x in items}) + [x['url'] for x in items if x['url'] not in before]
        uncached = [url for url in needed if not cached(url)]
        if uncached:
            raise SystemExit('--only-errors preflight: not cached, so no request made: ' + ', '.join(uncached[:10]))
        print('Live requests allowed:', sorted(live_allowed), 'delay', min_delay, 's', flush=True)
    lock = REPORTS / 'piper-resume.lock'
    try:
        lock.open('x').close()
    except FileExistsError:
        raise SystemExit(f'Another Piper run holds {lock}; if none is running, delete it after checking. No request made.')
    shared.write = safe_write
    shared.fetch = paced_fetch
    stop_existed = ACCESS_STOP.exists()
    try:
        spec = importlib.util.spec_from_file_location('collector', SITE / 'scripts/collect-modern-texts.py')
        collector = importlib.util.module_from_spec(spec); spec.loader.exec_module(collector)
        safe_write(state, dict(pid=os.getpid(), status='running', delaySeconds=min_delay, onlyErrors=args.only_errors, previous=previous,
                               reason='Cached URLs and originals reused; live requests paced and stopped on 403/429.'))
        collector.collect_piper(['messages'])
        results = json.loads(results_path.read_text(encoding='utf-8'))
        missing = [x['url'] for x in items if x['url'] not in results]
        errors = {x['url']: results[x['url']].get('error') for x in items if results.get(x['url'], {}).get('status') == 'error'}
        stopped = ACCESS_STOP.exists() and not stop_existed
        status = 'review-access-stop' if stopped or missing else 'inventory-processed-with-errors' if errors else 'inventory-processed'
        safe_write(state, dict(pid=os.getpid(), status=status, checkedAt=datetime.now(timezone.utc).isoformat(), delaySeconds=min_delay,
                               expected=len(items), processed=len(results), missing=missing, errors=errors))
    except BaseException as exc:  # UncachedRequestRefused and Ctrl+C too: never leave "running" behind
        safe_write(state, dict(pid=os.getpid(), status='interrupted' if isinstance(exc, KeyboardInterrupt) else 'failed',
                               error=f'{type(exc).__name__}: {exc}', checkedAt=datetime.now(timezone.utc).isoformat(), previous=previous))
        raise
    finally:
        lock.unlink()
