"""Audit actual held RB02 works and their internal locators before acquisition."""
import hashlib
import json
import posixpath
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from urllib.parse import unquote

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB02'


def write(name, data):
    R.mkdir(parents=True, exist_ok=True)
    (R / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    paths = [SITE / '../HANDOFF.md', SITE / 'SOURCES.md', SITE / 'content/library/REFORMED-BAPTIST-ACQUISITION.md',
             SITE / 'content/library/CHARTER.md', SITE / 'content/library/CATALOG.md', SITE / 'content/library/authors.json',
             SITE / 'content/library/sources.json']
    paths += [p for p in (SITE / 'content/library/reports').rglob('*manifest.json') if R not in p.parents]
    paths += list((SITE / 'content/library/reports/reformed-baptist-overnight/RB01').glob('*.json'))
    paths += [SITE / 'content/library/reports/reformed-baptist-overnight/RB01/REPORT.md']
    inputs, candidates = [], []
    for path in dict.fromkeys(paths):
        raw = path.read_bytes()
        inputs.append(dict(path=path.relative_to(SITE).as_posix(), sha256=hashlib.sha256(raw).hexdigest(), byteCount=len(raw)))
        if path.suffix == '.json':
            data = json.loads(raw)
            if isinstance(data, dict):
                for a in data.get('files', []):
                    title_author = (str(a.get('title', '')) + ' ' + str(a.get('author', ''))).lower()
                    if (any(t in title_author for t in ('coxe', 'keach', 'booth')) or
                        ('pink' in title_author and 'covenant' in title_author) or
                        ('gill' in title_author and any(t in title_author for t in ('divinity', 'practical religion', 'grace'))) or
                        (a.get('workId') == 'work-rb01-dagg-church-order') or a.get('expectedIssue') in (108, 122)):
                        if a.get('relativePath'):
                            candidates.append(dict(a, ledger=path.relative_to(SITE).as_posix()))
    # The older L11 ledger does not carry the same files-array schema. Check
    # Gill's actual XML witnesses explicitly using RB01's verified identities.
    for name in ('gill-doctrinal-divinity-coverage.json', 'gill-practical-divinity-coverage.json'):
        path = SITE / 'content/library/reports/reformed-baptist-overnight/RB01' / name
        coverage = json.loads(path.read_text(encoding='utf-8'))
        candidates.append(dict(coverage, title='A Body of ' + ('Doctrinal' if 'doctrinal' in name else 'Practical') + ' Divinity',
            author='John Gill', format='xml', ledger=path.relative_to(SITE).as_posix(),
            url='https://ccel.org/ccel/g/gill/' + ('doctrinal' if 'doctrinal' in name else 'practical') + '.xml'))
    held = {}
    for a in candidates:
        key = a['relativePath']
        if key in held:
            continue
        original = SOURCES / key
        if not original.exists():
            continue
        raw = original.read_bytes()
        item = {k: a.get(k) for k in ('assetId', 'workId', 'title', 'author', 'url', 'format', 'relativePath', 'derivedText', 'ledger')}
        item.update(actualSha256=hashlib.sha256(raw).hexdigest(), originalExists=True, byteCount=len(raw))
        if a.get('sha256'):
            assert item['actualSha256'] == a['sha256'], key
        if original.suffix == '.epub':
            toc = []
            with zipfile.ZipFile(original) as archive:
                for name in archive.namelist():
                    if name.endswith('.ncx'):
                        doc = ET.fromstring(archive.read(name))
                        for nav in doc.iter():
                            if nav.tag.endswith('navPoint'):
                                label = next((e.text for e in nav.iter() if e.tag.endswith('text')), None)
                                content = next((e.attrib.get('src') for e in nav if e.tag.endswith('content')), None)
                                member = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote((content or '').split('#')[0])))
                                toc.append(dict(title=label, locator=content, member=member, memberPresent=member in archive.namelist()))
            item['epubContents'] = toc
            item['allTocMembersPresent'] = all(x['memberPresent'] for x in toc)
        if original.suffix == '.xml':
            doc = ET.fromstring(raw)
            sections = []
            for el in doc.iter():
                if el.tag.split('}')[-1].startswith('div') and el.attrib.get('id'):
                    headings = [e for e in el if re.fullmatch(r'h[1-6]', e.tag.split('}')[-1])]
                    if headings:
                        # CCEL puts the chapter number and its subject in separate
                        # sibling headings. Both are needed to identify a topic.
                        label = ' '.join(' '.join(''.join(h.itertext()).split()) for h in headings)
                        if re.search('covenant|baptism|supper|circumcision|ordinance', label, re.I):
                            sections.append(dict(id=el.attrib['id'], title=label))
            item['relevantXmlSections'] = sections
        held[key] = item
    write('input-audit.json', inputs)
    write('holdings-audit.json', dict(sourceRoot=str(SOURCES), files=list(held.values()),
        note='Actual originals and internal TOC/member identities checked. Structural completeness is not exact-edition collation.'))
    registry = json.loads((SITE / 'content/library/authors.json').read_text())
    authors = [a for a in registry['authors'] if re.search('Coxe|Pink|Keach|Booth|Gill|Malone|Denault|Renihan|Wellum|Hicks', json.dumps(a), re.I)]
    write('registry-audit.json', dict(selectedEntries=authors, note='Absence from the global roster is not an acquisition gap or blanket rejection; new work-level evidence is separate.'))
    print('AUDITED', len(held), 'held originals;', len(inputs), 'input documents/ledgers;', len(authors), 'relevant registry entries')
    print('Internal chapter/section locators saved in holdings-audit.json')


if __name__ == '__main__':
    main()
