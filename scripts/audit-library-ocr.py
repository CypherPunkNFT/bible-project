"""Read-only, resumable audit of every acquired library PDF; never performs OCR.

Low text and encoding flags are review leads, not proof that a page needs OCR.
Page details stay private locally; the report records counts and suspect pages.
"""
import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import statistics

from bible.paths import SITE, SOURCES

VERSION = 1
CACHE = SITE / '.local/library/ocr-completion/audit'
OUT = SITE / 'content/library/reports/ocr-completion/pdf-audit.json'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temp.replace(path)


def audit(pathstr):
    import pymupdf
    pymupdf.TOOLS.mupdf_display_errors(False)
    pymupdf.TOOLS.mupdf_display_warnings(False)
    path = Path(pathstr)
    relative = path.relative_to(SOURCES).as_posix()
    stat = path.stat()
    key = hashlib.sha256(relative.encode()).hexdigest()
    cached = CACHE / (key + '.json')
    if cached.exists():
        old = read(cached)
        if old.get('auditVersion') == VERSION and old.get('byteCount') == stat.st_size and old.get('mtimeNs') == stat.st_mtime_ns:
            result = dict(old)
            result.pop('pageDetails', None)
            return result
    result = dict(relativePath=relative, auditVersion=VERSION, byteCount=stat.st_size,
                  mtimeNs=stat.st_mtime_ns, pageDetailsPath=cached.relative_to(SITE).as_posix())
    try:
        with path.open('rb') as handle:
            result['sha256'] = hashlib.file_digest(handle, 'sha256').hexdigest()
        with pymupdf.open(path) as doc:
            result.update(pageCount=len(doc), pdfMetadata=doc.metadata, encrypted=bool(doc.needs_pass))
            pages = []
            for i, page in enumerate(doc):
                try:
                    text = page.get_text('text')
                    alpha = sum(c.isalnum() for c in text)
                    letters = sum(c.isalpha() for c in text)
                    bad = sum(c == '\ufffd' or '\ue000' <= c <= '\uf8ff' for c in text)
                    tokens = re.findall(r'\b[^\W\d_]+\b', text)
                    single_ratio = sum(len(t) == 1 for t in tokens) / max(1, len(tokens))
                    flags = []
                    if alpha < 80:
                        flags.append('low-text')
                    if bad >= 5 and bad / max(1, len(text)) > .01:
                        flags.append('replacement-or-private-use-glyphs')
                    if len(tokens) >= 80 and single_ratio > .5:
                        flags.append('fragmented-single-letter-tokens')
                    infos = page.get_image_info()
                    area = max(1, page.rect.width * page.rect.height)
                    max_image = max((pymupdf.Rect(v['bbox']).get_area() / area for v in infos), default=0)
                    row = dict(page=i + 1, characters=len(text), alphanumeric=alpha, letters=letters,
                               wordTokens=len(text.split()), imageCount=len(infos),
                               largestImagePageFraction=round(min(max_image, 1), 4),
                               suspectGlyphs=bad, singleLetterTokenFraction=round(single_ratio, 4), flags=flags)
                    if flags:
                        row['textPreview'] = ' '.join(text.split())[:200]
                    pages.append(row)
                except Exception as exc:
                    pages.append(dict(page=i + 1, flags=['page-read-error'], error=str(exc)))
            ok = [p for p in pages if 'alphanumeric' in p]
            low = [p for p in ok if p['alphanumeric'] < 80]
            garbled = [p for p in ok if any(f != 'low-text' for f in p['flags'])]
            result.update(status='audited', extractedCharacters=sum(p['characters'] for p in ok),
                          extractedWordTokens=sum(p['wordTokens'] for p in ok),
                          medianAlphanumericPerPage=statistics.median([p['alphanumeric'] for p in ok]) if ok else 0,
                          zeroTextPages=[p['page'] for p in ok if p['alphanumeric'] == 0],
                          lowTextPages=[p['page'] for p in low],
                          lowTextWithLargeImagePages=[p['page'] for p in low if p['largestImagePageFraction'] >= .35],
                          encodingOrFragmentationPages=[p['page'] for p in garbled],
                          pageErrors=[p for p in pages if 'error' in p],
                          suspectPages=[p for p in pages if p['flags']], pageDetails=pages)
            if result['pageErrors']:
                result['status'] = 'partial-page-errors'
    except Exception as exc:
        result.update(status='error', error=str(exc))
    write(cached, result)
    result.pop('pageDetails', None)
    return result


def metadata():
    catalog = SITE / 'content/library/catalog'
    works = {r['id']: r for p in (catalog / 'works').glob('*.json') if (r := read(p))}
    editions = {r['id']: r for p in (catalog / 'editions').glob('*.json') if (r := read(p))}
    index = {}
    for p in (catalog / 'assets').glob('*.json'):
        asset = read(p)
        rel = asset.get('relativePath') or ''
        if rel.lower().endswith('.pdf'):
            edition = editions.get(asset.get('editionId'), {})
            work = works.get(edition.get('workId'), {})
            index.setdefault(rel.replace('\\', '/'), []).append(dict(
                assetId=asset['id'], editionId=asset.get('editionId'), title=work.get('title'),
                sourceUrl=asset.get('canonicalUrl'), rightsCategory=(asset.get('rights') or {}).get('category'),
                permittedActions=(asset.get('rights') or {}).get('actions'),
                rightsEvidenceUrls=[v.get('url') for v in (asset.get('rights') or {}).get('evidence', [])],
                catalogRecord=p.relative_to(SITE).as_posix()))
    return index


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=2, choices=(1, 2, 3))
    args = parser.parse_args()
    started = datetime.now(timezone.utc).isoformat()
    paths = sorted(p for p in (SOURCES / 'library').rglob('*') if p.is_file() and p.suffix.lower() == '.pdf')
    print(json.dumps(dict(pdfFiles=len(paths), sourceRoot=str(SOURCES), workers=args.workers)), flush=True)
    refs = metadata()
    results = []
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        jobs = {pool.submit(audit, str(p)): p for p in paths}
        for future in as_completed(jobs):
            try:
                row = future.result()
            except Exception as exc:
                row = dict(relativePath=jobs[future].relative_to(SOURCES).as_posix(), status='worker-error', error=str(exc))
            row['catalogReferences'] = refs.get(row['relativePath'], [])
            # Full metadata and text snippets remain in the local evidence cache.
            row.pop('mtimeNs', None)
            row['pdfMetadata'] = {k: v for k, v in (row.get('pdfMetadata') or {}).items() if k in ('title', 'author', 'creationDate') and v}
            for page in row.get('suspectPages', []):
                page.pop('textPreview', None)
            results.append(row)
            if len(results) % 250 == 0 or len(results) == len(paths):
                print(json.dumps(dict(audited=len(results), total=len(paths),
                    pages=sum(r.get('pageCount', 0) for r in results),
                    lowTextPages=sum(len(r.get('lowTextPages', [])) for r in results),
                    errors=sum(r['status'] != 'audited' for r in results))), flush=True)
    by_source = {}
    for r in results:
        source = r['relativePath'].split('/')[1]
        c = by_source.setdefault(source, Counter())
        c.update(files=1, pages=r.get('pageCount', 0), lowTextPages=len(r.get('lowTextPages', [])),
                 largeImageLowTextPages=len(r.get('lowTextWithLargeImagePages', [])),
                 encodingOrFragmentationPages=len(r.get('encodingOrFragmentationPages', [])),
                 errors=int(r['status'] != 'audited'))
    summary = dict(pdfFiles=len(results), pageCount=sum(r.get('pageCount', 0) for r in results),
                   documentsWithLowText=sum(bool(r.get('lowTextPages')) for r in results),
                   lowTextPages=sum(len(r.get('lowTextPages', [])) for r in results),
                   lowTextWithLargeImagePages=sum(len(r.get('lowTextWithLargeImagePages', [])) for r in results),
                   encodingOrFragmentationPages=sum(len(r.get('encodingOrFragmentationPages', [])) for r in results),
                   errors=sum(r['status'] != 'audited' for r in results))
    write(OUT, dict(auditVersion=VERSION, startedAt=started, completedAt=datetime.now(timezone.utc).isoformat(),
                   sourceRoot=str(SOURCES), scope='Every .pdf file under resolved sources/library at start of run.',
                   method='PyMuPDF page-by-page existing text and placed-image inspection; no rendering, downloads or OCR.',
                   limitations=['Flags are review candidates, not confirmed missing content. Blank, image, title and separator pages are expected.',
                                'Existing text may contain OCR errors that these structural checks cannot detect; this is not proofreading.',
                                'A PDF with text can still contain untranslated images or omitted text within a page.',
                                'Exact edition and rights are retained where canonical asset records exist; unlinked acquisitions require their source manifest.'],
                   summary=summary, bySource=by_source, documents=sorted(results, key=lambda r: r['relativePath'])))
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
