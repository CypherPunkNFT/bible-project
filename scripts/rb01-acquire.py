"""RB01 bounded acquisition. Immutable originals, resumable cache, no OCR/embedding.

Research: python -X utf8 scripts/rb01-acquire.py inspect URL [URL ...]
Acquire: python -X utf8 scripts/rb01-acquire.py acquire
Verify: python -X utf8 scripts/rb01-acquire.py verify
Only explicitly reviewed targets in RB01/targets.json are promoted to originals.
"""
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urldefrag

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
REPORT = SITE / 'content/library/reports/reformed-baptist-overnight/RB01'
CACHE = SITE / '.local/library/run-rb01-2026-10-07'
UA = 'BibleProjectLibrary/1.0 (noncommercial personal research; source-preserving)'


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def fetch(url, policy=False):
    url = urldefrag(url)[0]
    origin = '{0.scheme}://{0.netloc}'.format(urlsplit(url))
    key = digest(url.encode())
    body = CACHE / 'http' / (key + '.body')
    meta = body.with_suffix('.json')
    if body.exists() and meta.exists():
        data, info = body.read_bytes(), json.loads(meta.read_text(encoding='utf-8'))
        if digest(data) != info['sha256']:
            raise ValueError('Cached bytes changed: ' + url)
        return data, info
    delay = 30 if 'founders.org' in origin else 2
    if not policy:
        rp = urllib.robotparser.RobotFileParser()
        try:
            raw, _ = fetch(origin + '/robots.txt', policy=True)
            rp.parse(raw.decode('utf-8', errors='replace').splitlines())
            if not rp.can_fetch(UA, url):
                raise PermissionError('robots.txt disallows ' + url)
            delay = max(delay, rp.crawl_delay(UA) or rp.crawl_delay('*') or 0)
        except urllib.error.HTTPError as exc:
            if exc.code not in (404, 410):
                raise
    stamp = CACHE / 'hosts' / (digest(origin.encode()) + '.json')
    if stamp.exists():
        last = json.loads(stamp.read_text())['epoch']
        time.sleep(max(0, delay - (time.time() - last)))
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45) as res:
            data = res.read()
            info = dict(url=url, finalUrl=res.url, mimeType=res.headers.get_content_type(),
                        byteCount=len(data), sha256=digest(data),
                        retrievedAt=datetime.now(timezone.utc).isoformat())
        body.parent.mkdir(parents=True, exist_ok=True)
        body.write_bytes(data)
        write(meta, info)
        return data, info
    finally:
        write(stamp, {'epoch': time.time()})


def soup(raw):
    return BeautifulSoup(raw, 'html.parser')


def extract(raw, target):
    if target['format'] == 'html':
        doc = soup(raw)
        node = doc.select_one(target['selector']) if target.get('selector') else doc.body or doc
        if node is None:
            raise ValueError('Missing selected body: ' + target['url'])
        for el in node.select('script,style,nav,header,footer'):
            el.decompose()
        text = node.get_text('\n', strip=True)
    elif target['format'] == 'pdf':
        import fitz
        with fitz.open(stream=raw, filetype='pdf') as doc:
            text = '\n'.join(p.get_text() for p in doc)
    elif target['format'] == 'json' and target.get('includedPrefixes'):
        records = json.loads(raw)
        def ast(node):
            if node.get('type') == 'text':
                return node.get('value', '')
            return ''.join(ast(c) for c in node.get('children', [])) + ('\n' if node.get('tag') in ('p', 'h1', 'h2', 'li') else '')
        parts = []
        for key, record in sorted(records.items()):
            if not any(key.startswith(p) for p in target['includedPrefixes']):
                continue
            parts.append('\nSOURCE RECORD: ' + key)
            if record.get('question'):
                parts.append('Q. ' + record['question'])
                parts.append('A. ' + ' '.join(s['text'] for s in record.get('segments', [])))
                parts.extend('Proof: ' + s['proofs'] for s in record.get('segments', []) if s.get('proofs'))
            if record.get('body'):
                parts.append(ast(record['body']))
            for paragraph in record.get('paragraphs', []):
                for qa in paragraph.get('qas', []):
                    parts.append('Q. ' + qa['q'] + '\nA. ' + qa['a'])
                    parts.append('Scripture quotation: ' + qa.get('v', '') + '\nReference: ' + qa.get('r', ''))
        text = '\n'.join(parts)
    else:
        text = raw.decode('utf-8')
    return text


def acquire():
    manifest_path = REPORT / 'acquisition-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {
        'mission': 'RB01', 'schemaVersion': 1, 'files': [], 'failures': [],
        'publicHostingAllowed': False, 'ingested': False, 'embedded': False}
    targets = json.loads((REPORT / 'targets.json').read_text(encoding='utf-8'))
    if len(sys.argv) > 2:
        targets = [t for t in targets if t['sourceId'] in sys.argv[2:]]
    by_url = {a['url']: a for a in manifest['files']}
    for target in targets:
        if target['url'] in by_url:
            continue
        try:
            raw, meta = fetch(target['url'])
            if target['format'] == 'pdf' and not raw.startswith(b'%PDF'):
                raise ValueError('Not a PDF')
            text = extract(raw, target)
            words = len(re.findall(r'\b[\w\x27-]+\b', text))
            if words < target.get('minimumWords', 150):
                raise ValueError('Insufficient readable text: ' + str(words))
            for marker in target.get('requiredMarkers', []):
                if not re.search(marker, text, re.I):
                    raise ValueError('Missing coverage marker: ' + marker)
            aid = 'asset-rb01-' + digest(target['url'].encode())[:20]
            folder = SOURCES / 'library' / target['sourceId'] / aid
            original = folder / ('original.' + target['format'])
            folder.mkdir(parents=True, exist_ok=True)
            if original.exists():
                if digest(original.read_bytes()) != meta['sha256']:
                    raise ValueError('Refusing to overwrite changed original')
            else:
                with original.open('xb') as stream:
                    stream.write(raw)
            derivative = CACHE / 'text' / (aid + '.txt')
            derivative.parent.mkdir(parents=True, exist_ok=True)
            derivative.write_text(text, encoding='utf-8')
            asset = dict(meta, **{k: v for k, v in target.items() if k != 'url'},
                         assetId=aid, relativePath=original.relative_to(SOURCES).as_posix(),
                         useScope='private-noncommercial-reading', publicHostingAllowed=False,
                         publicFullTextIndexAllowed=False, status='downloaded-readable',
                         derivedText={'path': derivative.relative_to(SITE).as_posix(), 'wordCount': words,
                                      'sha256': digest(derivative.read_bytes()),
                                      'method': 'Existing source text; no OCR or model calls',
                                      'quality': 'structural checks; not critical-edition collation'})
            provenance = folder / 'provenance.json'
            if not provenance.exists():
                write(provenance, asset)
            manifest['files'].append(asset)
            manifest['failures'] = [f for f in manifest['failures'] if f['url'] != target['url']]
            print('ACQUIRED', target['workId'], target['title'], words, flush=True)
        except Exception as exc:
            manifest['failures'].append({'url': target['url'], 'error': type(exc).__name__ + ': ' + str(exc),
                                         'at': datetime.now(timezone.utc).isoformat()})
            print('FAILED', target['url'], str(exc), flush=True)
            if isinstance(exc, urllib.error.HTTPError) and exc.code == 429:
                write(manifest_path, manifest)
                return
        manifest['updatedAt'] = datetime.now(timezone.utc).isoformat()
        write(manifest_path, manifest)


def verify():
    manifest = json.loads((REPORT / 'acquisition-manifest.json').read_text(encoding='utf-8'))
    for a in manifest['files']:
        assert digest((SOURCES / a['relativePath']).read_bytes()) == a['sha256'], a['url']
        d = a['derivedText']
        assert digest((SITE / d['path']).read_bytes()) == d['sha256'], a['url']
    print('VERIFIED', len(manifest['files']), 'immutable originals and derivatives')


def journals():
    """Discover only the selected confessional series, using exact publisher links."""
    inventory = json.loads((REPORT / 'founders-journal-inventory.json').read_text(encoding='utf-8'))
    path = REPORT / 'founders-exposition-inventory.json'
    selected = set(range(104, 118)) | {119, 121, 122, 123}
    results = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for item in inventory['items']:
        match = re.search(r'\((?:Issue )?(\d+)\)', item['title'])
        if not match or int(match[1]) not in selected or match[1] in results:
            continue
        raw, meta = fetch(item['url'])
        doc = soup(raw)
        links = {urljoin(item['url'], a['href']): a.get_text(' ', strip=True)
                 for a in doc.select('a[href]') if '.pdf' in a['href'].lower()}
        articles = {urljoin(item['url'], a['href']): a.get_text(' ', strip=True)
                    for a in doc.select('a[href]') if '/articles/' in a['href'] and '?' not in a['href']}
        results[match[1]] = dict(item, pageSha256=meta['sha256'], pdfs=links, articles=articles)
        write(path, results)
        print('DISCOVERED ISSUE', match[1], list(links), flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'acquire':
        acquire()
    elif sys.argv[1] == 'verify':
        verify()
    elif sys.argv[1] == 'journals':
        journals()
    elif sys.argv[1] == 'inspect':
        for url in sys.argv[2:]:
            try:
                raw, meta = fetch(url)
                doc = soup(raw)
                print('\nURL', url, meta['byteCount'])
                print((doc.select_one('main') or doc).get_text(' ', strip=True)[:6000])
                print('LINKS', [(a.get_text(' ', strip=True), urljoin(url, a['href'])) for a in doc.select('a[href]')][-120:])
            except Exception as exc:
                print('ERROR', url, type(exc).__name__, str(exc))
