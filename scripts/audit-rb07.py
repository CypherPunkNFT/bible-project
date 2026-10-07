"""Audit actual RB07 missions/primary-history holdings; no network or database writes.

Surname matches are discovery context, not author identity or doctrinal approval.
For example, Francis Fuller is not Andrew Fuller; Andrew Murray is not John Murray.
"""
import hashlib
import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path
from urllib.parse import unquote
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB07'
CACHE = SITE / '.local/library/run-rb07-2026-10-07'


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def read_epub(rawpath):
    texts, contents = [], []
    with zipfile.ZipFile(rawpath) as archive:
        container = ET.fromstring(archive.read('META-INF/container.xml'))
        opf = next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'))
        package = ET.fromstring(archive.read(opf))
        items = {e.attrib['id']: e.attrib['href'] for e in package.iter() if e.tag.endswith('item')}
        for e in package.iter():
            if e.tag.endswith('itemref'):
                member = posixpath.normpath(posixpath.join(posixpath.dirname(opf), unquote(items[e.attrib['idref']])))
                soup = BeautifulSoup(archive.read(member), 'html.parser')
                texts.append('EPUB MEMBER: ' + member + '\n' + (soup.body or soup).get_text('\n', strip=True))
        for member in archive.namelist():
            if member.endswith('.ncx'):
                doc = ET.fromstring(archive.read(member))
                for nav in doc.iter():
                    if nav.tag.endswith('navPoint'):
                        label = next((e.text for e in nav.iter() if e.tag.endswith('text')), None)
                        src = next((e.attrib.get('src') for e in nav if e.tag.endswith('content')), '')
                        name = posixpath.normpath(posixpath.join(posixpath.dirname(member), unquote(src.split('#')[0])))
                        contents.append(dict(title=label, locator=src, member=name, memberPresent=name in archive.namelist()))
    return '\n\n'.join(texts), contents


def relevant(a):
    author = str(a.get('author', ''))
    title = str(a.get('title', ''))
    return bool(re.search(r'Fuller|Carey|Judson|Pearce|Ryland|Sutcliff|Knibb|Marshman|William Ward|Ward, William|Oncken|Brainerd|Luther Rice|Rice, Luther|Robert Hall|Hall, Robert|Beddome|Christmas Evans|Evans, Christmas', author + ' ' + title + ' ' + str(a.get('workId', '')), re.I))


def main():
    inputs, candidates = [], {}
    catalog = {w['id']: w for p in (SITE/'content/library/catalog/works').glob('*.json') for w in [json.loads(p.read_text(encoding='utf-8'))]}
    legacy = {w['key']: w for w in json.loads((SITE/'content/library/reports/pastoral-care/bibliography.json').read_text(encoding='utf-8'))['works']}
    author_names = {a['id']: a['name'] for a in json.loads((SITE/'content/library/authors.json').read_text(encoding='utf-8'))['authors']}
    paths = [SITE / '../HANDOFF.md', SITE / 'SOURCES.md', SITE / 'content/library/REFORMED-BAPTIST-ACQUISITION.md',
        SITE / 'content/library/authors.json', SITE / 'content/library/sources.json', SITE / 'content/library/CHARTER.md', SITE / 'content/library/CATALOG.md', SITE / 'content/library/reports/pastoral-care/bibliography.json', SITE / 'content/library/reports/pastoral-care/concern-index.json', SITE / 'content/library/reports/pastoral-care/section-index.json', SITE / 'content/library/reports/pastoral-care/deferred-pdfs.json']
    paths += [p for p in (SITE / 'content/library/reports').rglob('*manifest.json') if R not in p.parents]
    paths += [SITE / 'content/library/reports' / name / 'REPORT.md' for name in ('sermon-coverage', 'scripture-studies', 'text-backlog', 'text-gap-batch', 'reformed-baptist-overnight/RB01', 'reformed-baptist-overnight/RB02', 'reformed-baptist-overnight/RB03', 'reformed-baptist-overnight/RB04', 'reformed-baptist-overnight/RB05', 'reformed-baptist-overnight/RB06', 'pastoral-care')]
    paths += [SITE / 'content/library/reports/sermon-coverage/book-coverage.json']
    for p in dict.fromkeys(paths):
        raw = p.read_bytes()
        inputs.append(dict(path=p.relative_to(SITE).as_posix(), sha256=hashlib.sha256(raw).hexdigest(), byteCount=len(raw)))
        if p.suffix != '.json':
            continue
        d = json.loads(raw)
        if not isinstance(d, dict):
            continue
        for a in d.get('files', []):
            if isinstance(a, dict) and a.get('workKey') in legacy:
                w=legacy[a['workKey']]
                a=dict(a, title=w['title'], author=author_names[w['authorId']], workId=w['workId'], identityBasis='pastoral-care/bibliography.json workKey and author registry')
            if not isinstance(a, dict):
                continue
            local = SOURCES / a['relativePath'] if a.get('relativePath') else Path(a['path']) if a.get('path') else None
            if not local or not local.resolve().is_relative_to(SOURCES.resolve()) or not local.is_file():
                continue
            # Older ready-text ledgers carry edition identifiers, not title/author.
            if 'calcom' in str(a.get('url', '')) and local.suffix == '.xml':
                a = dict(a, author='John Calvin', title='Calvin commentary ' + a['url'].rsplit('/', 1)[-1])
            if a.get('workId') in catalog and not a.get('title'):
                w = catalog[a['workId']]
                a = dict(a, title=w['title'], author='; '.join(author_names.get(c['authorId'], c['authorId']) for c in w.get('creators', [])))
            if relevant(a):
                candidates[str(local.resolve())] = dict(a, relativePath=local.relative_to(SOURCES).as_posix(), ledger=p.relative_to(SITE).as_posix())
    results = []
    for name, a in candidates.items():
        p = Path(name)
        raw = p.read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        if a.get('sha256'):
            assert a['sha256'] == sha, name
        record = {k: a.get(k) for k in ('assetId', 'workId', 'editionId', 'title', 'author', 'url', 'relativePath', 'ledger', 'sourceId', 'edition', 'completeness', 'evidenceOnly', 'rightsCategory', 'rightsEvidence', 'admissionRole', 'derivedText')}
        record.update(actualSha256=sha, byteCount=len(raw), originalExists=True, format=p.suffix[1:])
        text, contents = '', []
        if p.suffix == '.epub':
            text, contents = read_epub(p)
            record.update(epubContents=contents, allTocMembersPresent=all(x['memberPresent'] for x in contents))
        elif p.suffix == '.xml':
            doc = ET.fromstring(raw)
            text = '\n'.join(' '.join(''.join(e.itertext()).split()) for e in doc.iter() if e.tag.split('}')[-1] in ('p', 'h1', 'h2', 'h3', 'h4'))
            for e in doc.iter():
                if e.tag.split('}')[-1].startswith('div') and e.attrib.get('id'):
                    heads = [h for h in e if re.fullmatch('h[1-6]', h.tag.split('}')[-1])]
                    if heads:
                        contents.append(dict(id=e.attrib['id'], title=' '.join(' '.join(''.join(h.itertext()).split()) for h in heads)))
            record['xmlContents'] = contents
        elif p.suffix == '.txt':
            text = raw.decode('utf-8-sig')
        if text:
            key = a.get('assetId') or sha[:20]
            path = CACHE / 'audit-text' / (key + '.txt')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8', newline='\n')
            record['auditDerivative'] = dict(path=path.relative_to(SITE).as_posix(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), wordCount=len(re.findall(r'\b\w+\b', text)), method='Existing source text only; no new OCR')
        results.append(record)
    write(R / 'input-audit.json', inputs)
    write(R / 'holdings-audit.json', dict(sourceRoot=str(SOURCES), files=results, note='Point-in-time audit of originals and internal structure. Bodies are private; headings alone do not establish full theological or verse-level review.'))
    registry = json.loads((SITE / 'content/library/authors.json').read_text(encoding='utf-8'))
    write(R / 'registry-audit.json', dict(selectedEntries=[a for a in registry['authors'] if re.search('Fuller|Carey|Judson|Pearce|Ryland|Sutcliff|Knibb|Marshman|Ward|Oncken|Brainerd|Rice|Bonar|Piper|Beddome|Hall|Evans', a['name'])], globalRegistryChanged=False))
    print('AUDITED', len(results), 'actual originals and', len(inputs), 'input documents/ledgers')
    print('Surname discovery matches require exact identity review; no global author approvals changed.')


if __name__ == '__main__':
    main()
