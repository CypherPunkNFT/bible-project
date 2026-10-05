"""Bounded L06 acquisition: two identified historic editions and four TOC witnesses.

No crawl. CCEL HTML is private bibliographic evidence, not a republication asset.
Existing bytes are reused, never overwritten. Run explicitly with --fetch.
"""
import argparse
import hashlib
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
REPORT = SITE / 'content/library/reports/scripture-studies'
CACHE = SITE / '.local/library/run-l06-scripture-studies-2026-10-05'
ITEMS = [
    ('vos', 'theteachingofjes00vosuoft', 'work-vos-kingdom', 'edition-vos-kingdom', '1903', 'The Teaching of Jesus Concerning the Kingdom of God and the Church'),
    ('berkhof', 'newtestamentintr00berk', 'work-berkhof-introduction', 'edition-berkhof-introduction', '1915', 'New Testament Introduction'),
]
TOCS = {
    'calvin-index': 'https://ccel.org/ccel/calvin/commentaries/commentaries.i.html',
    'calvin-hebrews': 'https://ccel.org/ccel/calvin/calcom44/calcom44.toc.html',
    'calvin-isaiah4': 'https://ccel.org/ccel/calvin/calcom16/calcom16.toc.html',
    'calvin-genesis1': 'https://ccel.org/ccel/calvin/calcom01/calcom01.toc.html',
}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def fetch(url, path):
    if path.exists():
        data = path.read_bytes()
        return dict(url=url, finalUrl=None, path=str(path), byteCount=len(data), sha256=hashlib.sha256(data).hexdigest(), reused=True)
    request = urllib.request.Request(url, headers={'User-Agent': 'BibleProjectLibrary/1.0 (bounded scholarly edition research)'})
    with urllib.request.urlopen(request, timeout=55) as response:
        data, final, mime = response.read(), response.url, response.headers.get_content_type()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as handle:
        handle.write(data)
    return dict(url=url, finalUrl=final, path=str(path), byteCount=len(data), sha256=hashlib.sha256(data).hexdigest(),
                retrievedAt=datetime.now(timezone.utc).isoformat(), mimeType=mime, reused=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true', required=True)
    parser.parse_args()
    REPORT.mkdir(parents=True, exist_ok=True)
    manifest_path = REPORT / 'acquisition-manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'files': [], 'tocEvidence': [], 'failures': []}
    write(REPORT / 'acquisition-bibliography.json', {'checkedOn': '2026-10-05', 'boundary': 'Two existing work/edition identities, inventoried before retrieval',
          'editions': [dict(key=k, itemId=i, workId=w, editionId=e, year=y, title=t, url='https://archive.org/details/'+i) for k,i,w,e,y,t in ITEMS]})
    for key, item, wid, eid, year, title in ITEMS:
        meta_aid = 'asset-l06-'+key+'-metadata'
        meta_path = SOURCES / 'library/source-internet-archive' / meta_aid / (item+'.json')
        previous = next((f for f in manifest['files'] if f.get('assetId') == meta_aid), None)
        metadata = fetch('https://archive.org/metadata/'+item, meta_path)
        if previous is None:
            manifest['files'].append(dict(metadata, assetId=meta_aid, evidenceOnly=True, itemId=item))
            write(manifest_path, manifest)
        source = json.loads(meta_path.read_text(encoding='utf-8'))
        if source.get('is_dark') or source.get('metadata', {}).get('access-restricted-item') == 'true':
            raise ValueError('Restricted item: '+item)
        print(key, 'host date', source.get('metadata', {}).get('date'), flush=True)
        files = {f['name']: f for f in source['files']}
        for suffix, fmt in [('.pdf', 'pdf'), ('_djvu.txt', 'text')]:
            name = item+suffix
            if name not in files:
                manifest['failures'].append({'item': item, 'missingFile': name})
                continue
            aid = 'asset-l06-'+key+'-'+fmt
            if any(f.get('assetId') == aid for f in manifest['files']):
                continue
            path = SOURCES / 'library/source-internet-archive' / aid / name
            result = fetch('https://archive.org/download/'+item+'/'+name, path)
            raw = path.read_bytes()
            if len(raw) != int(files[name]['size']) or hashlib.md5(raw).hexdigest() != files[name]['md5']:
                raise ValueError('Host size/MD5 mismatch: '+name)
            if fmt == 'pdf' and not raw.startswith(b'%PDF'):
                raise ValueError('Not a PDF: '+name)
            manifest['files'].append(dict(result, assetId=aid, evidenceOnly=False, itemId=item, workId=wid, editionId=eid,
                                         format=fmt, relativePath=str(path.relative_to(SOURCES)).replace('\\','/'), hostMd5=files[name]['md5']))
            write(manifest_path, manifest)
            print(aid, result['byteCount'], flush=True)
            time.sleep(1)
    last_ccel = 0
    for key, url in TOCS.items():
        if any(f['key'] == key for f in manifest['tocEvidence']):
            continue
        time.sleep(max(0, 10 - (time.monotonic()-last_ccel)))
        try:
            result = fetch(url, CACHE / (key+'.html'))
            manifest['tocEvidence'].append(dict(result, key=key))
            print(key, result['byteCount'], flush=True)
        except Exception as exc:
            manifest['failures'].append({'url': url, 'error': str(exc)})
            print('TOC failure', key, str(exc), flush=True)
        last_ccel = time.monotonic()
        write(manifest_path, manifest)


if __name__ == '__main__':
    main()
