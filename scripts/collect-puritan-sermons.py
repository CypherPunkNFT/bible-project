"""L02: resumable, immutable acquisition of selected historical sermon editions.

No credentials, lending files, modern reprints, or access-control workarounds.
Raw metadata and files retain their hashes and retrieval provenance.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from bible.paths import SOURCES, SITE

LOCAL = SITE / '.local/library/run-l02-puritan-sermons-2026-10-05'
REPORT = SITE / 'content/library/reports/puritan-sermons'
RAW = SOURCES / 'library/source-internet-archive'
ASSET_PREFIX = 'asset-l02-'
UA = 'BibleProjectHistoricalLibrary/1.0 (Codex GPT-6; public historical book research; no model training)'

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def fetch(url, folder, filename):
    folder.mkdir(parents=True, exist_ok=True)
    p = folder / filename
    side = folder / (filename + '.provenance.json')
    if p.exists():
        if not side.exists():
            raise ValueError(f'Existing bytes without provenance: {p}')
        meta = json.loads(side.read_text(encoding='utf-8'))
        if hashlib.sha256(p.read_bytes()).hexdigest() != meta['sha256']:
            raise ValueError(f'Raw hash mismatch: {p}')
        return p
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=180) as r:
                data = r.read()
                meta = dict(url=url, finalUrl=r.url, retrievedAt=datetime.now(timezone.utc).isoformat().replace('+00:00','Z'), sha256=hashlib.sha256(data).hexdigest(), byteCount=len(data), mimeType=r.headers.get_content_type())
            if filename.endswith('.pdf') and not data.startswith(b'%PDF'):
                raise ValueError('Expected PDF bytes')
            p.write_bytes(data)
            try: meta['relativePath'] = p.relative_to(SOURCES).as_posix()
            except ValueError: meta['relativePath'] = p.relative_to(SITE).as_posix()
            write(side, meta)
            time.sleep(.6)
            return p
        except Exception as error:
            if attempt == 2: raise
            retry = getattr(error, 'headers', {}).get('Retry-After', '0')
            time.sleep(max(2 + attempt * 3, int(retry) if str(retry).isdigit() else 0))

def metadata(ident):
    p=fetch('https://archive.org/metadata/'+ident, RAW/(ASSET_PREFIX+ident+'-metadata'), 'metadata.json')
    data=json.loads(p.read_text(encoding='utf-8'))
    if not data.get('metadata'): raise ValueError('No item '+ident)
    return data

def download(ident, pdf=True):
    data=metadata(ident)
    m=data['metadata']
    if m.get('access-restricted-item') in [True,'true'] or m.get('is_dark'):
        raise ValueError('Restricted item: '+ident)
    year=re.search(r'\b(1[5-8]\d{2}|190\d|191\d|192\d)\b',str(m.get('date','')))
    if not year: raise ValueError('Historical edition date requires review: '+ident)
    files=data['files']
    chosen=[f for f in files if f['name'].endswith(('_djvu.txt','_scandata.xml')) and not f.get('private')]
    if pdf:
        candidates=[f for f in files if f['name'].endswith('.pdf') and not f.get('private') and not f['name'].endswith('_bw.pdf')]
        if not candidates: raise ValueError('No public PDF '+ident)
        chosen.append(min(candidates,key=lambda f:int(f.get('size',0))))
    for f in chosen:
        ext='pdf' if f['name'].endswith('.pdf') else 'ocr' if f['name'].endswith('.txt') else 'scandata'
        p=fetch('https://archive.org/download/'+ident+'/'+urllib.parse.quote(f['name']),RAW/(ASSET_PREFIX+ident+'-'+ext),Path(f['name']).name)
        if f.get('md5') and hashlib.md5(p.read_bytes()).hexdigest()!=f['md5']: raise ValueError('Source MD5 mismatch '+str(p))
    print(json.dumps(dict(item=ident,title=m.get('title'),date=m.get('date'),files=len(chosen))),flush=True)

def discover(url):
    p=fetch(url,LOCAL/'discovery',hashlib.sha256(url.encode()).hexdigest()[:12]+'.html')
    text=p.read_text(encoding='utf-8',errors='replace')
    links=re.findall(r'href=[\"\x27]([^\"\x27]+)',text)
    print(json.dumps([x for x in links if 'archive.org/' in x],indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('mode',choices=['metadata','download','discover']); p.add_argument('items',nargs='+'); p.add_argument('--no-pdf',action='store_true'); a=p.parse_args()
    for ident in a.items:
        if a.mode=='discover': discover(ident)
        elif a.mode=='metadata':
            d=metadata(ident); print(json.dumps(dict(item=ident,metadata=d['metadata'],files=[(f['name'],f.get('size')) for f in d['files'] if f['name'].endswith(('.pdf','_djvu.txt','_scandata.xml'))])))
        else: download(ident,not a.no_pdf)
