"""RB12 acquisition uses the reviewed RB01 source-preserving collector in isolation."""
import importlib.util
import json
import posixpath
import sys
import zipfile
from pathlib import Path
from urllib.parse import urljoin, unquote
from xml.etree import ElementTree as ET

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rb01collector', SITE / 'scripts/rb01-acquire.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.REPORT = SITE / 'content/library/reports/reformed-baptist-overnight/RB12'
base.CACHE = SITE / '.local/library/run-rb12-2026-10-07'
base.MISSION = 'RB12'
base.ASSET_PREFIX = 'asset-rb12-'
original_extract = base.extract


def epub_text(raw):
    import io
    parts = []
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        container = ET.fromstring(archive.read('META-INF/container.xml'))
        opf = next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'))
        package = ET.fromstring(archive.read(opf))
        items = {e.attrib['id']: e.attrib['href'] for e in package.iter() if e.tag.endswith('item')}
        for e in package.iter():
            if e.tag.endswith('itemref'):
                name = posixpath.normpath(posixpath.join(posixpath.dirname(opf), unquote(items[e.attrib['idref']])))
                doc = base.soup(archive.read(name))
                parts.append('EPUB MEMBER: ' + name + '\n' + (doc.body or doc).get_text('\n', strip=True))
    return '\n\n'.join(parts)


def extract(raw, target):
    if target['format'] == 'xml':
        root = ET.fromstring(raw)
        node = root.find('{http://www.tei-c.org/ns/1.0}text')
        if node is None:
            raise ValueError('Missing TEI text')
        def render(e):
            tag = e.tag.rsplit('}', 1)[-1]
            if tag == 'gap':
                return '[SOURCE GAP: ' + e.attrib.get('reason', 'unspecified') + '; ' + e.attrib.get('extent', 'unspecified extent') + ']'
            if tag == 'pb':
                return '\nSOURCE TEI PAGE: ' + e.attrib.get('n', 'unnumbered') + '; ' + e.attrib.get('facs', '') + '\n'
            if tag == 'g' and e.attrib.get('ref') in ('char:EOLhyphen', 'char:EOLunhyphen'):
                return ''
            value = (e.text or '') + ''.join(render(c) + (c.tail or '') for c in e)
            return '\n' + value + '\n' if tag in ('p', 'head', 'div', 'front', 'body', 'back', 'closer', 'opener') else value
        return render(node).strip()
    if target['format'] == 'pdf':
        import pymupdf
        with pymupdf.open(stream=raw, filetype='pdf') as pdf:
            return '\n\n'.join('SOURCE PDF PAGE: '+str(i+1)+'\n'+p.get_text() for i,p in enumerate(pdf))
    if target['format'] == 'epub':
        return epub_text(raw)
    if target['format'] == 'html' and ('selectorIndex' in target or target.get('selector') == 'document'):
        doc = base.soup(raw)
        node = doc if target.get('selector') == 'document' else doc.select(target['selector'])[target['selectorIndex']]
        for el in node.select('script,style,nav,header,footer'):
            el.decompose()
        for selector in target.get('excludeSelectors', []):
            for el in node.select(selector):
                el.decompose()
        text = node.get_text('\n', strip=True)
    else:
        text = original_extract(raw, target)
    # Normalize download line endings before Windows writes the derivative.
    # This avoids CRCRLF blank-line inflation in offered Gutenberg TXT.
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    if target.get('startAtText'):
        marker = target['startAtText']
        if marker not in text:
            raise ValueError('Missing reviewed start boundary: ' + marker)
        text = text[text.index(marker):]
    if target.get('trimAtText'):
        marker = target['trimAtText']
        if marker not in text:
            raise ValueError('Missing reviewed trim boundary: ' + marker)
        text = text.split(marker, 1)[0].rstrip()
    return text

base.extract = extract


def inspect(urls):
    results = []
    for url in urls:
        try:
            raw, meta = base.fetch(url)
            entry = dict(meta)
            if raw.startswith(b'%PDF'):
                import pymupdf
                with pymupdf.open(stream=raw, filetype='pdf') as pdf:
                    entry.update(pages=len(pdf), pageTextCounts=[len(p.get_text().strip()) for p in pdf],
                                 firstPages='\n'.join(p.get_text() for p in list(pdf)[:4])[:10000])
            elif raw.startswith(b'PK'):
                import io
                with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                    container = ET.fromstring(archive.read('META-INF/container.xml'))
                    opf = next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'))
                    package = ET.fromstring(archive.read(opf))
                    title = next((e.text for e in package.iter() if e.tag.endswith('title')), None)
                entry.update(title=title, firstText=epub_text(raw)[:7000], links=[])
            else:
                doc = base.soup(raw)
                main = doc.select_one('.elementor-widget-theme-post-content') or doc.select_one('.entry-content') or doc.select_one('main') or doc
                entry.update(title=doc.title.get_text(' ', strip=True) if doc.title else None,
                             firstText=main.get_text(' ', strip=True)[:7000],
                             links=[dict(text=a.get_text(' ', strip=True), url=urljoin(url, a['href']))
                                    for a in main.select('a[href]') if not a['href'].startswith(('#', 'javascript:', 'mailto:'))])
            results.append(entry)
            display = {k: v for k, v in entry.items() if k not in ('firstText', 'firstPages', 'links')}
            display['preview'] = entry.get('firstText', entry.get('firstPages', ''))[:4200]
            display['offeredLinks'] = [x for x in entry.get('links', []) if any(t in x['url'].lower() for t in ('.pdf', '.epub', '.xml', 'copyright', 'belief', 'about'))][:45]
            print(json.dumps(display, ensure_ascii=True), flush=True)
        except Exception as exc:
            results.append(dict(url=url, error=str(exc)))
            print('INSPECT FAILED', url, str(exc), flush=True)
    path = base.REPORT / 'discovery-evidence.json'
    prior = json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
    # Keep only metadata in version control; bodies stay in the private HTTP cache.
    base.write(path, prior + [{k: v for k, v in item.items() if k not in ('firstText', 'firstPages')} for item in results])


if __name__ == '__main__':
    if sys.argv[1] == 'inspect':
        inspect(sys.argv[2:])
    elif sys.argv[1] == 'acquire':
        base.acquire()
    elif sys.argv[1] == 'verify':
        base.verify()
    elif sys.argv[1] == 'reextract':
        base.reextract()
