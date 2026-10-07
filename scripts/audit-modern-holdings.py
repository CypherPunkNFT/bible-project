"""Offline holdings snapshot; no requests, OCR, or model calls."""
import collections
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader
from bs4 import BeautifulSoup
from bible.paths import SOURCES
from modern_texts_common import SITE, CACHE, REPORT, write

NAMES = {'piper': 'John Piper', 'rogers': 'Adrian Rogers', 'graham': 'Billy Graham',
         'packer': 'J. I. Packer', 'sproul': 'R. C. Sproul'}


def main():
    snapshots = {s: json.loads((REPORT / (s+'-results.json')).read_text(encoding='utf-8')) for s in NAMES}
    rows = []
    documents = []
    issues = []
    for source, records in snapshots.items():
        assets = {}
        for r in records.values():
            title = r.get('title', '')
            if source == 'packer' and not title:
                cached = CACHE / 'http' / (hashlib.sha256(r['url'].encode()).hexdigest()+'.body')
                if cached.exists():
                    soup = BeautifulSoup(cached.read_bytes(), 'html.parser')
                    tag = soup.find('meta', property='og:title')
                    title = tag.get('content', '') if tag else soup.title.get_text() if soup.title else ''
            for a in r.get('assets', []):
                assets[a['assetId']] = dict(a, catalogTitle=title or a.get('title') or r['url'], sourceRecord=r['url'])
        for a in assets.values():
            original = SOURCES/a['relativePath']
            if not original.is_file():
                issues.append('Missing '+str(original)); continue
            if hashlib.sha256(original.read_bytes()).hexdigest() != a['sha256']:
                issues.append('Hash mismatch '+str(original))
            if a.get('derivedText'):
                path = SITE/a['derivedText']['path']
                data = path.read_bytes()
                if hashlib.sha256(data).hexdigest() != a['derivedText']['sha256']:
                    issues.append('Text hash mismatch '+str(path))
                a['auditedWords'] = len(re.findall(r"\b[\w’'-]+\b", data.decode('utf-8')))
            elif a['format'] == 'pdf':
                reader = PdfReader(original)
                content = '\n\n'.join(page.extract_text() or '' for page in reader.pages)
                a['auditedWords'] = len(re.findall(r"\b[\w’'-]+\b", content))
                path = CACHE / 'audit-text' / (a['assetId']+'.txt')
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
                a['auditTextPath'] = str(path.relative_to(SITE))
                a['auditedPages'] = len(reader.pages)
                a['auditTextMethod'] = 'Existing PDF text layer; no OCR; no new download'
                a['firstWords'] = content[:450]
            else:
                a['auditedWords'] = 0
                a['wordCountNote'] = 'Alternate EPUB format of a book counted from its PDF; not counted twice'
            a['authorGroup'] = source
        ids = collections.defaultdict(list)
        unresolved = []
        if source == 'rogers':
            for r in records.values():
                if not r.get('assets'): continue
                nums = set(re.findall(r'Audio\s*#\s*(\d+)', ' '.join(m.get('label','') for m in r.get('mediaLinks',[]))))
                if len(nums) == 1:
                    ids[next(iter(nums))].append(r['url'])
                else: unresolved.append(r['url'])
        rows.append(dict(source=source, name=NAMES[source], recordsWithFiles=sum(bool(r.get('assets')) for r in records.values()),
                         originalFiles=len(assets), words=sum(a.get('auditedWords',0) for a in assets.values()),
                         pdfPages=sum(a.get('auditedPages',a.get('pageCount',0)) for a in assets.values()),
                         formats=dict(collections.Counter(a['format'] for a in assets.values())),
                         classifications=dict(collections.Counter(a.get('textKind','unspecified') for a in assets.values())),
                         statuses=dict(collections.Counter(r['status'] for r in records.values())),
                         sermonIds=sorted(ids), sermonIdentityUnresolved=unresolved,
                         repeatedSermonIds={n:urls for n,urls in ids.items() if len(urls)>1}))
        documents.extend(assets.values())
    # Look across the canonical catalog too: source records are not acquisitions.
    catalog = SITE/'content/library/catalog'
    works = {x['id']:x for p in (catalog/'works').glob('*.json') for x in [json.loads(p.read_text(encoding='utf-8'))]}
    editions = {x['id']:x for p in (catalog/'editions').glob('*.json') for x in [json.loads(p.read_text(encoding='utf-8'))]}
    modern = ['john-piper','adrian-rogers','billy-graham','j-i-packer','r-c-sproul','john-macarthur','w-a-criswell',
              'martyn-lloyd-jones','sinclair-ferguson','john-murray','d-a-carson','alistair-begg','j-vernon-mcgee']
    crosscheck = {a:dict(linkedAssets=0, localAssets=[]) for a in modern}
    for p in (catalog/'assets').glob('*.json'):
        a = json.loads(p.read_text(encoding='utf-8'))
        w = works.get(editions.get(a.get('editionId'),{}).get('workId'),{})
        for c in w.get('creators',[]):
            aid = c.get('authorId','').removeprefix('author-')
            if aid not in crosscheck: continue
            crosscheck[aid]['linkedAssets'] += 1
            if a.get('relativePath'):
                crosscheck[aid]['localAssets'].append(dict(id=a['id'],path=a['relativePath'],status=a.get('acquisitionStatus'),exists=(SOURCES/a['relativePath']).is_file()))
    result = dict(asOf=datetime.now(timezone.utc).isoformat(), rows=rows, documents=documents, canonicalCrosscheck=crosscheck,
                  totalWords=sum(r['words'] for r in rows), totalFiles=len(documents), totalPdfPages=sum(r['pdfPages'] for r in rows),
                  validationIssues=issues, method='SHA-256 checked originals and existing derived texts. Regex word tokens include headers, quotations, outlines and repeated matter. EPUB alternate formats excluded from word totals. No HTML page estimates.')
    write(REPORT/'holdings-audit.json', result)
    print(json.dumps({k:v for k,v in result.items() if k!='documents'}, ensure_ascii=False))
    print(json.dumps([dict(author=a['authorGroup'], title=a['catalogTitle'], words=a.get('auditedWords'),pages=a.get('auditedPages'),firstWords=a.get('firstWords')) for a in documents if a['authorGroup'] in ['graham','packer','sproul']],ensure_ascii=False))


if __name__ == '__main__':
    main()
