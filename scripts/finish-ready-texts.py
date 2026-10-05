"""Resume named historical readable-text acquisitions; no OCR or audio processing."""
import argparse
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
OUT = SITE / 'content/library/reports/ready-text-completion'
CACHE = SITE / '.local/library/ready-text-completion'
UA = 'BibleProjectLibrary/1.0 (named historical text acquisition)'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []; self.href = None; self.label = []; self.text = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a': self.href = dict(attrs).get('href'); self.label = []
    def handle_data(self, data):
        self.text.append(data)
        if self.href: self.label.append(data)
    def handle_endtag(self, tag):
        if tag == 'a' and self.href:
            self.links.append((' '.join(self.label).strip(), self.href)); self.href = None


class SermonPage(Page):
    def __init__(self):
        super().__init__(); self.meta = {}; self.depth = 0; self.body = []; self.json_script = False; self.scripts = []; self.script = []
    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs); a = dict(attrs)
        if tag == 'meta' and (a.get('name') or a.get('property')):
            self.meta.setdefault(a.get('name', a.get('property')), []).append(a.get('content'))
        if tag == 'div':
            if self.depth: self.depth += 1
            elif a.get('data-swiftype-name') == 'resource_content': self.depth = 1
        if tag == 'script' and a.get('type') == 'application/ld+json': self.json_script = True; self.script = []
    def handle_data(self, data):
        super().handle_data(data)
        if self.depth: self.body.append(data)
        if self.json_script: self.script.append(data)
    def handle_endtag(self, tag):
        super().handle_endtag(tag)
        if tag == 'div' and self.depth: self.depth -= 1
        if self.depth and tag in ('p', 'blockquote', 'li', 'h2', 'h3'): self.body.append('\n')
        if tag == 'script' and self.json_script:
            self.scripts.append(json.loads(''.join(self.script))); self.json_script = False


def fetch(url, key, content=False, source='evidence'):
    mp = OUT / 'acquisition-manifest.json'
    m = read(mp) if mp.exists() else {'files': [], 'failures': []}
    old = next((f for f in m['files'] if f['url'] == url), None)
    if old:
        raw = Path(old['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == old['sha256']
        return raw, old
    if any(f['url'] == url for f in m['failures']):
        raise RuntimeError('Previously failed URL; inspect before retry: ' + url)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=35) as r:
            raw = r.read(); final = r.url; mime = r.headers.get_content_type()
        path = SOURCES / 'library' / source / ('asset-ready-completion-' + key) / 'original' if content else CACHE / key
        assert not path.exists(), 'Refuse unmanifested overwrite: ' + str(path)
        path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(raw)
        f = dict(key=key, url=url, finalUrl=final, path=str(path), byteCount=len(raw),
                 sha256=hashlib.sha256(raw).hexdigest(), retrievedAt=datetime.now(timezone.utc).isoformat(),
                 mimeType=mime, evidenceOnly=not content)
        if content: f['relativePath'] = path.relative_to(SOURCES).as_posix()
        m['files'].append(f); write(mp, m)
        time.sleep(1)
        return raw, f
    except Exception as exc:
        m['failures'].append(dict(url=url, key=key, error=str(exc))); write(mp, m)
        raise


def discover():
    page = Page(); page.feed((SITE / '.local/library/ready-text-check/puritan-collections.html').read_text(encoding='utf-8'))
    goodwin = [dict(label=t, url=urljoin('https://puritanlibrary.com/', u)) for t, u in page.links if 'goodwin' in (t + u).lower()]
    write(OUT / 'goodwin-directory.json', goodwin); print('Goodwin links', json.dumps(goodwin), flush=True)
    for url, key in [
        ('https://api.github.com/repos/textcreationpartnership/A09339/contents', 'perkins-github-contents.json'),
        ('https://www.truthforlife.org/sitemap.xml', 'begg-sitemap.xml'),
        ('https://www.truthforlife.org/resources/sermon/getting-our-spiritual-bearings/', 'begg-example.html'),
    ]:
        try:
            raw, _ = fetch(url, key)
            if 'github' in key: print(key, raw.decode()[:12000], flush=True)
            elif key.endswith('.xml'): print(key, raw.decode()[:3500], flush=True)
            else: print(key, len(raw), flush=True)
        except Exception as exc: print(key, str(exc), flush=True)
    for p in (SITE / 'content/library/catalog/editions').glob('edition-l08-*.json'):
        if any(x in p.name for x in ['belgic', 'heidelberg', 'dort', 'savoy', 'articles']):
            print(p.name, read(p)['evidence'][0]['url'])


def acquire_historical():
    result_path = OUT / 'historical-results.json'
    results = read(result_path) if result_path.exists() else {}
    def save(key, row):
        results[key] = row; write(result_path, results); print(key, row.get('status'), flush=True)

    if 'perkins' not in results:
        items = read(CACHE / 'perkins-github-contents.json')
        readme_url = next(x['download_url'] for x in items if x['name'] == 'README.md')
        raw, _ = fetch(readme_url, 'perkins-readme.md')
        assert b'CC0' in raw or b'creativecommons.org/publicdomain/zero' in raw
        url = next(x['download_url'] for x in items if x['name'] == 'A09339.xml')
        raw, f = fetch(url, 'perkins-a09339', True, 'source-eebo-tcp')
        root = ET.fromstring(raw); ns = {'t': 'http://www.tei-c.org/ns/1.0'}
        title = ' '.join(root.find('.//t:titleStmt/t:title', ns).itertext())
        body = root.find('t:text', ns)
        assert body is not None and len(' '.join(body.itertext())) > 100000
        pages = [e.attrib for e in body.findall('.//t:pb', ns)]
        save('perkins', dict(status='acquired', title=title, file=f, pageMarkers=len(pages),
                            editorialGaps=len(body.findall('.//t:gap', ns)),
                            headers=' '.join(root.find('t:teiHeader', ns).itertext())[:22000],
                            rights='EEBO-TCP CC0; keep encoding and gap markers. 1600 edition, not the catalogued 1591 impression.'))

    # This host offers a complete seven-chapter HTML edition. Reuse locally
    # captured chapter one and contents if present, without another request.
    index = SITE / '.local/library/ready-text-check/machens-liberalism.html'
    page = Page(); page.feed(index.read_text(encoding='utf-8'))
    chapters = [(label, urljoin('https://www.ccel.org/m/machen/liberalism/home.html', u)) for label, u in page.links if re.fullmatch(r'chr_and_lib_[1-7]\.html', u)]
    assert len(chapters) == 7
    for position, (label, url) in enumerate(chapters, 1):
        key = 'machen-' + str(position)
        if key in results: continue
        raw, f = fetch(url, key, True, 'source-ccel')
        p = Page(); p.feed(raw.decode('utf-8', errors='replace'))
        text = '\n'.join(p.text)
        assert len(text) > 10000 and 'CHRISTIANITY' in text.upper()
        save(key, dict(status='acquired', chapter=position, label=label, file=f,
                      characters=len(text), rights='CCEL personal/educational/nonprofit use; public republication not cleared.',
                      printedPageLabels=sorted(set(re.findall(r'page\s+(\d+)', text, re.I)), key=int)))

    # Promote already-cached, source-checked confessional bodies to acquisition
    # records without downloading them a second time.
    previous = read(SITE / 'content/library/reports/text-backlog/ready-text-acquisition-manifest.json')
    for name in ['belgic', 'heidelberg', 'dort', 'articles', 'savoy']:
        key = 'confession-' + name
        if key in results: continue
        local = SITE / '.local/library/ready-text-check' / ('edition-l08-' + name + '-info.html')
        parent = next(f for f in previous['files'] if Path(f['path']) == local)
        raw = local.read_bytes(); assert hashlib.sha256(raw).hexdigest() == parent['sha256']
        match = re.search(rb'class=[\"\']book-content[\"\']>(.*?)<table[^>]+book_navbar', raw, re.S)
        assert match, key
        body = Page(); body.feed(match[1].decode('utf-8', errors='replace'))
        assert len(' '.join(body.text)) > 1500
        dest = SOURCES / 'library/source-ccel' / ('asset-ready-completion-' + key) / 'original.html'
        if dest.exists(): assert dest.read_bytes() == raw
        else: dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(raw)
        file = dict(parent, path=str(dest), relativePath=dest.relative_to(SOURCES).as_posix(), evidenceOnly=False,
                    reuse='Previously acquired evidence bytes promoted unchanged; no new HTTP request.')
        save(key, dict(status='acquired-partial' if name == 'savoy' else 'acquired', file=file,
                      bodyCharacters=len(' '.join(body.text)),
                      scope='Schaff preface/platform and differences only, not full confession' if name == 'savoy' else 'Complete named document body in Schaff compilation; preserve parallel languages and proofs.',
                      rights='CCEL personal/educational/nonprofit use; public republication not cleared.'))

    # Named twelve-volume inventory from the existing discovery record.
    directory = read(OUT / 'goodwin-directory.json')
    targets = {}
    for row in directory:
        if 'archive.org/download/' in row['url']:
            vol = int(re.search(r'(\d+) of 12', row['label']).group(1))
            targets[vol] = urlparse(row['url']).path.split('/')[2]
    targets[11] = 'worksofthomasgoo11good'  # Princeton Theological Commons identified item.
    for volume, iid in sorted(targets.items()):
        key = 'goodwin-' + str(volume)
        if key in results: continue
        try:
            raw, mf = fetch('https://archive.org/metadata/' + iid, key + '-metadata.json')
            meta = json.loads(raw); md = meta['metadata']
            assert not meta.get('is_dark') and str(md.get('access-restricted-item', '')).lower() != 'true'
            assert 'goodwin' in str(md.get('creator')).lower() and 'works' in md['title'].lower()
            year = re.search(r'\b(18\d\d)\b', str(md.get('date')))
            assert year, 'Historic edition year required'
            offered = next(f for f in meta['files'] if f.get('format') == 'DjVuTXT' and not f.get('private'))
            url = 'https://archive.org/download/' + iid + '/' + offered['name']
            raw, f = fetch(url, key, True, 'source-internet-archive')
            text = raw.decode('utf-8-sig'); assert len(text) > 100000
            save(key, dict(status='acquired', volume=volume, itemId=iid, metadata=md, file=f,
                          sourceFile=offered, characters=len(text), textKind='source-provided-ocr',
                          rights='Identified nineteenth-century edition, public domain in US; unmodified host OCR; no new transcription.',
                          quality='Existing OCR, not proofread. Volume identity and front matter require review.'))
        except Exception as exc:
            save(key, dict(status='needs-review', itemId=iid, volume=volume, error=str(exc)))

    for url, key in [
        ('https://www.truthforlife.org/resources/series/study-in-titus-volume-1/', 'begg-titus-1.html'),
        ('https://www.truthforlife.org/resources/series/a-study-in-titus-volume-2/', 'begg-titus-2.html'),
        ('https://www.truthforlife.org/sitemap-series.xml', 'begg-series.xml'),
    ]:
        raw, f = fetch(url, key)
        if key.endswith('.html'):
            p = Page(); p.feed(raw.decode()); print(key, [(t, u) for t, u in p.links if '/resources/sermon/' in u or ('titus' in u and '/series/' in u)], flush=True)
        else: print(key, len(raw), flush=True)


def savoy_and_begg():
    hp = OUT / 'historical-results.json'; results = read(hp)
    if 'savoy-tcp' not in results:
        root_url = 'https://raw.githubusercontent.com/textcreationpartnership/A89790/master/'
        raw, _ = fetch(root_url + 'README.md', 'savoy-readme.md')
        assert b'CC0' in raw or b'creativecommons.org/publicdomain/zero' in raw
        raw, f = fetch(root_url + 'A89790.xml', 'savoy-a89790', True, 'source-eebo-tcp')
        root = ET.fromstring(raw); ns = {'t': 'http://www.tei-c.org/ns/1.0'}
        text = root.find('t:text', ns)
        headings = [' '.join(e.itertext()) for e in text.findall('.//t:head', ns)]
        results['savoy-tcp'] = dict(status='acquired', file=f, headings=headings,
                                   title=' '.join(root.find('.//t:titleStmt/t:title', ns).itertext()),
                                   header=' '.join(root.find('t:teiHeader', ns).itertext()),
                                   characters=len(' '.join(text.itertext())), pageMarkers=len(text.findall('.//t:pb', ns)),
                                   editorialGaps=len(text.findall('.//t:gap', ns)),
                                   rights='EEBO-TCP CC0; 1659 printing of the 1658 declaration. Preserve preface, confession and order as distinct parts.')
        write(hp, results); print('Savoy CC0 text acquired', flush=True)
    root_url = 'https://www.truthforlife.org'
    for url, key in [
        (root_url + '/about/what-we-believe/', 'begg-beliefs.html'),
        ('https://learn.ligonier.org/teachers/alistair-begg', 'begg-reception.html'),
    ]:
        fetch(url, key)
    raw, robot_file = fetch(root_url + '/robots.txt', 'begg-robots.txt')
    robots = urllib.robotparser.RobotFileParser(); robots.parse(raw.decode().splitlines())
    raw, policy_file = fetch(root_url + '/about/policies/', 'begg-policy.html')
    assert b'You may post written content' in raw
    series = [
        ('1', root_url + '/resources/series/study-in-titus-volume-1/'),
        ('2', root_url + '/resources/series/a-study-in-titus-volume-2/'),
        ('3', root_url + '/resources/series/study-titus-volume-3/'),
    ]
    inventory = []
    for vol, url in series:
        assert robots.can_fetch(UA, url)
        raw, f = fetch(url, 'begg-titus-' + vol + '.html')
        p = Page(); p.feed(raw.decode()); seen = set(); members = []
        for label, href in p.links:
            if re.fullmatch(r'/resources/sermon/[^/?]+/', href) and href not in seen:
                seen.add(href); members.append(dict(url=urljoin(root_url, href), position=len(members) + 1))
        inventory.append(dict(volume=int(vol), url=url, file=f, members=members))
    write(OUT / 'begg-titus-inventory.json', inventory)
    dest = OUT / 'begg-titus-results.json'; records = read(dest) if dest.exists() else {}
    for volume in inventory:
        for member in volume['members']:
            url = member['url']
            if url in records: continue
            assert robots.can_fetch(UA, url)
            key = 'begg-' + urlparse(url).path.strip('/').split('/')[-1]
            raw, f = fetch(url, key, True, 'source-truth-for-life')
            p = SermonPage(); p.feed(raw.decode())
            body = ''.join(p.body).strip()
            def objects(value):
                if isinstance(value, dict):
                    yield value
                    for child in value.values(): yield from objects(child)
                elif isinstance(value, list):
                    for child in value: yield from objects(child)
            people = [x.get('name') for x in objects(p.scripts) if x.get('@type') == 'Person']
            assert 'Alistair Begg' in people, people
            rec = dict(url=url, seriesVolume=volume['volume'], position=member['position'], file=f,
                       metadata=p.meta, structuredMetadata=p.scripts,
                       status='acquired' if len(body.split()) > 500 else 'no-substantial-transcript',
                       words=len(body.split()), authorId='author-alistair-begg', textKind='publisher-sermon-transcript',
                       rights=dict(policyUrl=root_url + '/about/policies/', policySha256=policy_file['sha256'],
                                   robotsSha256=robot_file['sha256'],
                                   requiredCredit='Copyright Truth For Life. Used with Permission. www.truthforlife.org.',
                                   conditions=['Retain unedited content', 'Link original sermon and ministry homepage', 'Retain third-party Scripture notices'],
                                   scope='Private reading acquisition; no public publication performed.'))
            if rec['status'] == 'acquired':
                target = CACHE / 'texts' / (key + '.txt'); target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(body, encoding='utf-8', newline='\n')
                rec['derivedText'] = dict(path=target.relative_to(SITE).as_posix(), sha256=hashlib.sha256(target.read_bytes()).hexdigest())
            records[url] = rec; write(dest, records); print(key, rec['status'], rec['words'], flush=True)


def begg_letters():
    """Finish the source-listed Philippians, Timothy and Philemon series."""
    root_url = 'https://www.truthforlife.org'
    robot_raw, rf = fetch(root_url + '/robots.txt', 'begg-robots.txt')
    robots = urllib.robotparser.RobotFileParser(); robots.parse(robot_raw.decode().splitlines())
    _, pf = fetch(root_url + '/about/policies/', 'begg-policy.html')
    listed = [e.text for e in ET.fromstring((CACHE / 'begg-series.xml').read_bytes()).iter() if e.tag.endswith('loc')]
    urls = sorted(u for u in listed if any(x in u for x in ['timothy', 'philippians', 'philemon']))
    inventory = []
    for url in urls:
        assert robots.can_fetch(UA, url)
        key = 'begg-series-' + urlparse(url).path.strip('/').split('/')[-1]
        raw, f = fetch(url, key)
        p = SermonPage(); p.feed(raw.decode()); seen = set(); members = []
        for label, href in p.links:
            if re.fullmatch(r'/resources/sermon/[^/?]+/', href) and href not in seen:
                seen.add(href); members.append(dict(url=urljoin(root_url, href), position=len(members) + 1))
        inventory.append(dict(url=url, file=f, metadata=p.meta, members=members))
    write(OUT / 'begg-letters-inventory.json', inventory)
    path = OUT / 'begg-letters-results.json'; records = read(path) if path.exists() else {}
    for series in inventory:
        for item in series['members']:
            url = item['url']
            if url in records: continue
            assert robots.can_fetch(UA, url)
            key = 'begg-' + urlparse(url).path.strip('/').split('/')[-1].lower()
            raw, f = fetch(url, key, True, 'source-truth-for-life')
            p = SermonPage(); p.feed(raw.decode()); text = ''.join(p.body).strip()
            def nodes(v):
                if isinstance(v, dict):
                    yield v
                    for x in v.values(): yield from nodes(x)
                elif isinstance(v, list):
                    for x in v: yield from nodes(x)
            authors = [x.get('name') for x in nodes(p.scripts) if x.get('@type') == 'Person']
            status = 'author-review' if 'Alistair Begg' not in authors else 'acquired' if len(text.split()) > 500 else 'no-substantial-transcript'
            row = dict(url=url, seriesUrl=series['url'], position=item['position'], file=f, status=status,
                       authors=authors, metadata=p.meta, structuredMetadata=p.scripts, words=len(text.split()),
                       textKind='publisher-sermon-transcript', authorId='author-alistair-begg',
                       rights=dict(policyUrl=root_url + '/about/policies/', policySha256=pf['sha256'], robotsSha256=rf['sha256'],
                                   requiredCredit='Copyright Truth For Life. Used with Permission. www.truthforlife.org.',
                                   conditions=['Retain unedited content', 'Link original sermon and ministry homepage', 'Retain third-party Scripture notices'],
                                   scope='Private reading acquisition; no public publication performed.'))
            if status == 'acquired':
                target = CACHE / 'texts' / (key + '.txt'); target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text, encoding='utf-8', newline='\n')
                row['derivedText'] = dict(path=target.relative_to(SITE).as_posix(), sha256=hashlib.sha256(target.read_bytes()).hexdigest())
            records[url] = row; write(path, records)
            print(len(records), key, status, flush=True)


if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('--discover', action='store_true'); p.add_argument('--historical', action='store_true'); p.add_argument('--savoy-begg', action='store_true'); p.add_argument('--begg-letters', action='store_true'); args = p.parse_args()
    if args.discover: discover()
    if args.historical: acquire_historical()
    if args.savoy_begg: savoy_and_begg()
    if args.begg_letters: begg_letters()
