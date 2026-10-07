"""Resume offered readable editions and official transcripts. No OCR or model calls.

Separate source ledgers preserve inventories, failures, private-use restrictions,
and acquisition-only author screening. Run one worker per source.
"""
import argparse
import collections
import hashlib
import importlib.util
import io
import json
import re
import urllib.error
import zipfile
from urllib.parse import urljoin, urlsplit, quote, unquote
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
from bible.paths import SOURCES
from modern_texts_common import SITE, CACHE, REPORT, write

spec = importlib.util.spec_from_file_location('ready', SITE/'scripts/collect-ready-libraries.py')
ready = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ready)
def get(url):
    parts=urlsplit(url)
    return ready.get(parts._replace(path=quote(unquote(parts.path),safe='/')).geturl())
POLICIES = {
    'monergism-library': 'https://www.monergism.com/monergism-copyright-permissions',
    'begg': 'https://www.truthforlife.org/about/policies/',
    'ccel-expansion': 'https://ccel.org/about/copyright.html',
}

def txt(node):
    return node.get_text(' ', strip=True) if node else ''

def existing_assets():
    found = {}
    # Include all existing mission provenance, not only the modern ledgers.
    for path in (SOURCES/'library').rglob('provenance.json'):
        try:
            obj = json.loads(path.read_text(encoding='utf-8'))
            if obj.get('url') and obj.get('relativePath') and (SOURCES/obj['relativePath']).is_file():
                found[obj['url']] = obj
        except (ValueError, OSError):
            continue
    return found

def ccel_held():
    held = {}
    for p in (SITE/'content/library/reports').rglob('*manifest.json'):
        try: obj = json.loads(p.read_text(encoding='utf-8'))
        except (OSError, ValueError): continue
        for asset in obj.get('files', []) if isinstance(obj,dict) else []:
            if isinstance(asset,dict) and 'ccel.org' in asset.get('url','') and asset.get('relativePath'):
                if (SOURCES/asset['relativePath']).is_file():
                    held[urlsplit(asset['url']).path] = asset
    return held

def save_asset(source, record, url, raw, meta, content, fmt, **extra):
    aid = 'asset-expanded-'+hashlib.sha256(url.encode()).hexdigest()[:20]
    folder = SOURCES/'library'/('source-'+source)/aid
    folder.mkdir(parents=True, exist_ok=True)
    original = folder/('original.'+fmt)
    original.write_bytes(raw)
    path = CACHE/'text'/(aid+'.txt')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')
    words = len(re.findall(r"\b[\w’'-]+\b", content))
    asset = dict(meta, assetId=aid, author=record['author'], title=record['title'], format=fmt,
        relativePath=original.relative_to(SOURCES).as_posix(), sourcePage=record['url'],
        textKind=record['textKind'], rightsCategory='restricted-license',
        useScope='private-noncommercial-reading', publicHostingAllowed=False,
        publicFullTextIndexAllowed=False, policyUrl=POLICIES[source],
        derivedText=dict(path=path.relative_to(SITE).as_posix(), wordCount=words,
            sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
            method='Existing publisher text; no OCR; no model calls', quality='unreviewed'), **extra)
    write(folder/'provenance.json', asset)
    record['assets'] = [asset]
    record['status'] = 'downloaded' if words >= 150 else 'no-readable-text'
    return asset

def epub_text(raw):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        container = ET.fromstring(z.read('META-INF/container.xml'))
        opf = container.find('.//{*}rootfile').attrib['full-path']
        root = ET.fromstring(z.read(opf))
        manifest = {n.attrib['id']: n.attrib for n in root.findall('.//{*}manifest/{*}item')}
        content = []
        for item in root.findall('.//{*}spine/{*}itemref'):
            entry = manifest[item.attrib['idref']]
            if entry.get('media-type') not in ('application/xhtml+xml', 'text/html'): continue
            name = urljoin(opf, entry['href']).split('#')[0]
            from urllib.parse import unquote
            page = BeautifulSoup(z.read(unquote(name)), 'html.parser')
            for el in page.select('script,style'): el.decompose()
            content.append(txt(page.body or page))
        return '\n\n'.join(content), z.read(opf).decode('utf-8', errors='replace')

def monergism_inventory():
    url = 'https://www.monergism.com/1100-free-ebooks-listed-alphabetically-author'
    raw, meta = get(url)
    soup = BeautifulSoup(raw, 'html.parser', from_encoding='utf-8')
    listing = max(soup.select('.field-item.even p'), key=lambda p: len(p.select('a[href]')))
    rows, prefix, seen = [], '', set()
    for item in listing.children:
        if getattr(item, 'name', None) == 'br': prefix = ''; continue
        if getattr(item, 'name', None) == 'a':
            link = urljoin(url, item.get('href', ''))
            if link not in seen and urlsplit(link).hostname in ('monergism.com', 'www.monergism.com'):
                author = ' '.join(prefix.split()).strip(' ,;')
                rows.append(dict(author=author or 'Unresolved index attribution', title=txt(item), url=link,
                    textKind='offered-ebook-edition', eligibility='source-curated-acquisition-only',
                    recommendationStatus='review-required', attributionBasis='Monergism author index; edition metadata retained for reconciliation'))
                seen.add(link)
        else:
            prefix += txt(item) if getattr(item, 'name', None) else str(item)
    if len(rows) < 100: raise ValueError('Index structure changed; refusing incomplete inventory')
    # Round robin by author to broaden the library before collecting deep runs.
    groups = collections.defaultdict(collections.deque)
    for row in rows: groups[row['author']].append(row)
    ordered = []
    while any(groups.values()):
        for group in groups.values():
            if group: ordered.append(group.popleft())
    return dict(source=url, sourceSha256=meta['sha256'], authors=len(groups), entries=ordered,
        scope='All links in the publisher-curated author ebook index; acquisition does not confer core eligibility')

def begg_inventory():
    url = 'https://www.truthforlife.org/sitemap-sermons.xml'
    raw, meta = get(url)
    links = sorted({x.text for x in ET.fromstring(raw).findall('{*}url/{*}loc')})
    return dict(source=url, sourceSha256=meta['sha256'], entries=[dict(url=u, author='Alistair Begg',
        title='', textKind='official-sermon-transcript') for u in links],
        scope='Official sermon sitemap; each page must contain a transcript and explicit Alistair Begg attribution')

def ccel_inventory():
    # Author slugs are drawn from existing catalog sources, not guessed URLs.
    authors = dict(alexander_a='Archibald Alexander', bavinck='Herman Bavinck',
        berkhof='Louis Berkhof', boston='Thomas Boston', calvin='John Calvin',
        charnock='Stephen Charnock', edwards='Jonathan Edwards', flavel='John Flavel',
        gill='John Gill', hodge='Charles Hodge', knox='John Knox', kuyper='Abraham Kuyper',
        owen='John Owen', ryle='J. C. Ryle', spurgeon='Charles Haddon Spurgeon',
        ursinus='Zacharias Ursinus', watson='Thomas Watson')
    rows, issues = [], []
    for slug, name in authors.items():
        page = 'https://ccel.org/ccel/'+slug
        try:
            raw, meta = get(page)
            soup = BeautifulSoup(raw, 'html.parser')
            seen = set()
            for a in soup.select('a[href]'):
                link = urljoin(page,a['href']); parts = urlsplit(link).path.strip('/').split('/')
                if len(parts) < 3 or parts[:2] != ['ccel',slug]: continue
                work = parts[2].split('.')[0]
                if work in seen: continue
                seen.add(work)
                rows.append(dict(author=name,title=txt(a),url=f'https://ccel.org/ccel/{slug}/{work}.html',
                    textKind='offered-ThML-edition', authorIndex=page, authorIndexSha256=meta['sha256'],
                    eligibility='existing-registry-author; work-and-edition-review-required'))
        except urllib.error.HTTPError as exc:
            if exc.code in (401,403,429): raise
            issues.append(dict(url=page,error=str(exc)))
    return dict(entries=rows,issues=issues,scope='Work links offered by 17 existing eligible historical author indexes; not a complete author bibliography')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', choices=list(POLICIES), required=True)
    parser.add_argument('--limit', type=int)
    args = parser.parse_args()
    source = args.source
    policy, policy_meta = get(POLICIES[source])
    write(REPORT/(source+'-policy-evidence.json'), dict(policy_meta,
        decision='Offered editions/transcripts acquired as private noncommercial reading copies; no public hosting or AI training',
        policyUrl=POLICIES[source]))
    inventory = {'monergism-library':monergism_inventory,'begg':begg_inventory,'ccel-expansion':ccel_inventory}[source]()
    write(REPORT/(source+'-inventory.json'), inventory)
    path = REPORT/(source+'-results.json')
    results = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    held = existing_assets()
    held_ccel = ccel_held() if source == 'ccel-expansion' else {}
    denials, processed = 0, 0
    for entry in inventory['entries']:
        url = entry['url']
        if url in results: continue  # Failures require explicit review, not endless retries.
        record = dict(entry, assets=[])
        halt = False
        try:
            raw, meta = get(url)
            soup = BeautifulSoup(raw, 'html.parser', from_encoding='utf-8')
            if source == 'begg':
                record['title'] = txt(soup.select_one('h1'))
                author = txt(soup.select_one('.post-author')).removeprefix('by ').strip()
                record['author'] = author
                record['sourceMetadata'] = {m.get('name'):m.get('content') for m in soup.select('meta[name]')
                    if m.get('name') in ('resource_date','published_on','audio_duration','series_title','scripture_title','resource_id')}
                body = soup.select_one('#transcript .copy')
                if author != 'Alistair Begg': record['status'] = 'author-review-required'
                elif not body: record['status'] = 'no-transcript-offered'
                else: save_asset(source, record, url, raw, meta, txt(body), 'html')
            elif source == 'ccel-expansion':
                links = sorted({urljoin(url,a['href']) for a in soup.select('a[href]')
                    if urlsplit(urljoin(url,a['href'])).hostname in ('ccel.org','www.ccel.org')
                    and urlsplit(a['href']).path.endswith('.xml') and 'Theological Markup' in txt(a)})
                if not links: record['status'] = 'no-offered-ThML'
                else:
                    file = links[0]; old = held_ccel.get(urlsplit(file).path)
                    if old:
                        record.update(status='already-held',existingPath=old['relativePath'])
                    else:
                        data, info = get(file)
                        root = ET.fromstring(data)
                        body = root.find('ThML.body')
                        if body is None: raise ValueError('No ThML body')
                        title = root.find('.//DC.Title')
                        if title is not None: record['title'] = ''.join(title.itertext())
                        record['editionMetadata'] = {tag:[''.join(n.itertext()) for n in root.iter(tag)]
                            for tag in ('DC.Creator','DC.Date','DC.Publisher','DC.Rights','DC.Language')}
                        asset = save_asset(source,record,file,data,info,'\n'.join(body.itertext()),'xml')
                        held_ccel[urlsplit(file).path] = asset
            else:
                record['pageTitle'] = txt(soup.select_one('h1'))
                links = sorted({urljoin(url,a['href']) for a in soup.select('a[href]')
                    if urlsplit(urljoin(url,a['href'])).hostname in ('www.monergism.com','monergism.com')
                    and urlsplit(a['href']).path.lower().endswith('.epub')})
                if not links: record['status'] = 'no-offered-epub'
                else:
                    file = links[0]
                    record['offeredEditions'] = links
                    if file in held:
                        record.update(status='already-held', existingAssetId=held[file]['assetId'], existingPath=held[file]['relativePath'])
                    else:
                        data, info = get(file)
                        content, edition = epub_text(data)
                        record['editionMetadataXml'] = edition
                        asset = save_asset(source, record, file, data, info, content, 'epub')
                        held[file] = asset
            denials = 0
        except Exception as exc:
            record.update(status='error', error=str(exc))
            if isinstance(exc, urllib.error.HTTPError):
                denials = denials+1 if exc.code == 403 else 0
                halt = exc.code in (401,429) or denials >= 3
        results[url] = record
        write(path, results)
        processed += 1
        print(source, len(results), '/', len(inventory['entries']), record['status'], record.get('author'), record.get('title'), flush=True)
        if halt: raise RuntimeError('Stopped on source access/rate response; review required')
        if args.limit and processed >= args.limit: break

if __name__ == '__main__': main()
