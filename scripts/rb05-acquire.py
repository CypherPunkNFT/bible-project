"""RB05 acquisition uses the reviewed RB01 source-preserving collector in isolation."""
import importlib.util
import json
import sys
from pathlib import Path
from urllib.parse import urljoin

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rb01collector', SITE / 'scripts/rb01-acquire.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.REPORT = SITE / 'content/library/reports/reformed-baptist-overnight/RB05'
base.CACHE = SITE / '.local/library/run-rb05-2026-10-07'
base.MISSION = 'RB05'
base.ASSET_PREFIX = 'asset-rb05-'
original_extract = base.extract


def extract(raw, target):
    if target['format'] == 'pdf':
        import pymupdf
        with pymupdf.open(stream=raw, filetype='pdf') as document:
            return '\n\n'.join('SOURCE PDF PAGE: ' + str(i + 1) + '\n' + page.get_text()
                               for i, page in enumerate(document))
    if target['format'] != 'html':
        raise ValueError('RB05 only reviewed PDF and HTML targets')
    text = original_extract(raw, target)
    if target.get('startTextMarker'):
        text = text[text.index(target['startTextMarker']):]
    if target.get('endTextMarker'):
        text = text[:text.index(target['endTextMarker'])]
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
            print(json.dumps(display, ensure_ascii=False), flush=True)
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
