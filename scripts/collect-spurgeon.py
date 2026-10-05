"""L01: reproducible Spurgeon Gems inventory and immutable permitted PDF acquisition."""
import argparse
import concurrent.futures
import hashlib
import json
import re
import sys
import threading
import time
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
RAW = SOURCES / 'library/source-spurgeon-gems'
LOCAL = SITE / '.local/library/run-l01-spurgeon-2026-10-05'
REPORT = SITE / 'content/library/reports/spurgeon'
BASE = 'https://www.spurgeongems.org/'
AGENT = 'BibleProjectLibrary/1.0 (noncommercial scholarly catalog; rate-limited)'
LOCK = threading.Lock()
LAST = 0.0


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8', newline='\n')


def acquire(url, asset_id, filename, delay=0.35):
    global LAST
    folder = RAW / asset_id
    file = folder / filename
    meta = folder / 'provenance.json'
    if file.exists() and meta.exists():
        record = json.loads(meta.read_text(encoding='utf8'))
        if hashlib.sha256(file.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError(f'Immutable source changed: {file}')
        return record
    if file.exists() or meta.exists():
        raise ValueError(f'Incomplete prior acquisition needs inspection: {folder}')
    error = None
    for attempt in range(3):
        try:
            with LOCK:
                time.sleep(max(0, LAST + delay - time.monotonic()))
                LAST = time.monotonic()
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': AGENT}), timeout=60) as response:
                data = response.read()
                record = {'url': url, 'finalUrl': response.url, 'retrievedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z'), 'sha256': hashlib.sha256(data).hexdigest(), 'byteCount': len(data), 'mimeType': response.headers.get_content_type(), 'relativePath': file.relative_to(SOURCES).as_posix(), 'assetId':asset_id}
            if filename.endswith('.pdf') and not data.startswith(b'%PDF-'):
                raise ValueError(f'Not PDF: {url}')
            folder.mkdir(parents=True, exist_ok=True)
            with file.open('xb') as out:
                out.write(data)
            write_json(meta, record)
            return record
        except Exception as exc:
            error = str(exc)
            if attempt < 2:
                time.sleep(2 ** (attempt + 1))
    return {'url': url, 'assetId': asset_id, 'error': error}


def discover():
    for slug, endpoint, filename in [('robots','robots.txt','robots.txt'),('policy','about-us/','about.html'),('inventory','spurgeon-sermons/','index.html')]:
        rec=acquire(BASE+endpoint, 'asset-spurgeon-gems-'+slug+'-2026-10-05', filename)
        if 'error' in rec: raise RuntimeError(rec)
    robot=urllib.robotparser.RobotFileParser()
    robot.parse((RAW/'asset-spurgeon-gems-robots-2026-10-05/robots.txt').read_text().splitlines())
    html=(RAW/'asset-spurgeon-gems-inventory-2026-10-05/index.html').read_bytes()
    soup=BeautifulSoup(html,'html.parser')
    volumes=[]; current=None; entries=[]; supplements=[]
    for tag in soup.find_all(['h2','h3','h4','a']):
        text=' '.join(tag.get_text(' ',strip=True).split())
        vm=re.match(r'Volume\s+(\d+),\s*Sermons\s+(\d+)\s*[-–]\s*(\d+)\s*\((\d{4})\)',text)
        if vm:
            n,start,end,year=map(int,vm.groups()); current={'volume':n,'start':start,'end':end,'publicationYear':year,'heading':text}; volumes.append(current)
        elif tag.name=='a' and current and tag.get('href','').lower().endswith('.pdf'):
            url=urljoin(BASE,tag['href'])
            if not robot.can_fetch(AGENT,url): raise RuntimeError('Robots excludes '+url)
            match=re.match(r'^(\d+(?:[A-Za-z]|\s*[-–]\s*(?:\d+|[A-Za-z]))?)\s*[-–]\s*(.+)$',text)
            item={'volume':current['volume'],'indexLabel':text,'url':url}
            if match:
                label,title=match.groups(); label=re.sub(r'\s+','',label).replace('–','-')
                item.update(numberLabel=label,title=title,assetId='asset-spurgeon-gems-'+Path(urlparse(url).path).stem.lower().replace('_','-'))
                entries.append(item)
            else:
                supplements.append(item)
    if len(volumes)!=63 or len(entries)<3500: raise ValueError(f'Unexpected inventory {len(volumes)}, {len(entries)}')
    REPORT.mkdir(parents=True,exist_ok=True)
    write_json(REPORT/'inventory.json',{'source':BASE+'spurgeon-sermons/','snapshotAssetId':'asset-spurgeon-gems-inventory-2026-10-05','volumes':volumes,'sermons':entries,'supplementaryEntries':supplements})
    print(json.dumps({'volumes':len(volumes),'sermonEntries':len(entries),'supplements':len(supplements),'otherLinks':[(a.get_text(' ',strip=True),a.get('href')) for a in soup.find_all('a') if any(s in a.get('href','') for s in ['.zip','chstix','index'])]},ensure_ascii=True),flush=True)


def fetch(limit=None, support=False):
    inventory=json.loads((REPORT/'inventory.json').read_text(encoding='utf8'))
    entries=inventory['sermons'][:limit]
    if support:
        entries = [r for r in inventory['sermons'] if re.search(r'[A-Za-z]', r['numberLabel'])]
        entries += [{**r, 'assetId': 'asset-spurgeon-gems-'+Path(urlparse(r['url']).path).stem.lower()} for r in inventory['supplementaryEntries']]
        entries += [{'url':BASE+name+'.pdf','assetId':'asset-spurgeon-gems-'+name.replace('_','-')} for name in ['chstix','sindex_ot','sindex_nt']]
        # Whole-volume route confirmed by the linked volume 1 PDF at
        # https://www.spurgeonrepreached.com/sermons/; PDF title pages are checked
        # during reconciliation. These are a separate edition from individual PDFs.
        volume_links=[BASE+f'chsbm{v["volume"]}.pdf' for v in inventory['volumes']]
        entries += [{'url':u,'assetId':'asset-spurgeon-gems-'+Path(urlparse(u).path).stem} for u in volume_links]
    unique={row['url']:row for row in entries}
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        jobs={pool.submit(acquire,r['url'],r['assetId'],Path(urlparse(r['url']).path).name):r for r in unique.values()}
        for job in concurrent.futures.as_completed(jobs):
            result=job.result(); results.append(result)
            if len(results)%50==0 or 'error' in result:
                write_json(LOCAL/('support-checkpoint.json' if support else 'download-checkpoint.json'),results)
                print(json.dumps({'processed':len(results),'total':len(unique),'errors':sum('error' in r for r in results),'last':result['url']}),flush=True)
    write_json(LOCAL/('support-checkpoint.json' if support else 'download-checkpoint.json'),results)
    print(json.dumps({'complete':len(results),'errors':sum('error' in r for r in results)}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('command',choices=['discover','fetch','support']); parser.add_argument('--limit',type=int); args=parser.parse_args()
    discover() if args.command=='discover' else fetch(args.limit, args.command=='support')
