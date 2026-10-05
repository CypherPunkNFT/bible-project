"""Named ready-text gaps: three Gutenberg books; existing Zwemer PDF text, never OCR."""
import argparse
import copy
import hashlib
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import pymupdf
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
OUT = SITE / 'content/library/reports/text-gap-batch'
CAT = SITE / 'content/library/catalog'
TARGETS = [
    ('carey', '11449', '11449-0.txt', 'edition-l12-carey', 'work-l12-carey', 'L12'),
    ('charnock', '53527', '53527-0.txt', 'edition-text-gap-charnock-pg53527', 'work-charnock-attributes', 'L07'),
    ('hodge', '19192', '19192.txt', 'edition-hodge-darwinism', 'work-hodge-darwinism', 'L09'),
]


def read(p):
    return json.loads(p.read_text(encoding='utf-8'))


def write(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def evidence(url, locator, note):
    return dict(url=url, locator=locator, note=note, checkedOn='2026-10-05')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true')
    args = parser.parse_args()
    mp = OUT / 'acquisition-manifest.json'
    manifest = read(mp) if mp.exists() else dict(files=[])
    template = read(CAT / 'assets/asset-l13-rutherford-pg42557-html.json')
    for key, number, name, eid, wid, mission in TARGETS:
        aid = 'asset-text-gap-' + key + '-pg' + number + '-txt'
        url = 'https://mirrors.xmission.com/gutenberg/' + '/'.join(number[:-1]) + '/' + number + '/' + name
        dest = SOURCES / 'library/source-gutenberg' / aid / name
        old = next((f for f in manifest['files'] if f['assetId'] == aid), None)
        if old:
            raw = dest.read_bytes()
            assert sha(raw) == old['sha256']
        elif args.fetch:
            assert not dest.exists(), 'Unmanifested original; do not overwrite'
            req = urllib.request.Request(url, headers={'User-Agent': 'BibleProjectLibrary/1.0 (three named Gutenberg text files)'})
            with urllib.request.urlopen(req, timeout=30) as response:
                raw = response.read()
                final = response.url
            text = raw.decode('utf-8-sig')
            assert len(text) > 50000 and 'project gutenberg' in text.lower()
            assert re.search(r'\*\*\*\s*END OF', text, re.I), 'Missing ebook end marker'
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
            old = dict(assetId=aid, editionId=eid, workId=wid, missionId=mission,
                       url=url, finalUrl=final, relativePath=dest.relative_to(SOURCES).as_posix(),
                       sha256=sha(raw), byteCount=len(raw), format='txt', evidenceOnly=False,
                       retrievedAt=datetime.now(timezone.utc).isoformat())
            manifest['files'].append(old)
            write(mp, manifest)
            time.sleep(2)
        else:
            raise RuntimeError('Run with --fetch for first acquisition')
        text = raw.decode('utf-8-sig')
        assert key in text[:15000].lower(), 'Author identity missing from opening'
        canonical = 'https://www.gutenberg.org/ebooks/' + number
        ev = [evidence(canonical, 'Catalog title, ebook number and copyright field',
                       'Source identifies the historical work and public-domain status in the USA.'),
              evidence(url, 'Complete electronic file including header and license',
                       'Named static mirror download. Electronic notices retained; no scan or OCR processing.'),
              evidence('https://www.gutenberg.org/policy/robot_access.html', 'Approved mirror routes',
                       'Use the mirror instead of crawling the ordinary Gutenberg website.')]
        if key == 'charnock':
            edition = dict(**{'$schema': '../../schema.json'}, schemaVersion=1, kind='edition', id=eid,
                           editorialState='catalogued', notes=['Separate electronic witness; not asserted identical to the existing 1840 scan. Both volumes are in this one file.'],
                           reviews=[], workId=wid, label='Project Gutenberg 53527: The Existence and Attributes of God, Volumes 1 and 2',
                           languages=['en'], contributors=[], publisher='Project Gutenberg', dates=[],
                           abridgment='unknown', modernization='unknown', evidence=ev)
            write(CAT / 'editions' / (eid + '.json'), edition)
        asset = copy.deepcopy(template)
        asset.update(id=aid, editionId=eid, canonicalUrl=canonical, finalUrl=old['finalUrl'],
                     format='text', relativePath=old['relativePath'], sha256=old['sha256'],
                     byteCount=old['byteCount'], mimeType='text/plain', retrievedAt=old['retrievedAt'].replace('+00:00', 'Z'))
        asset['rights']['evidence'] = ev
        asset['processing']['note'] = 'Unmodified source-offered text; complete Gutenberg notices retained.'
        asset['quality'] = dict(state='unreviewed', reviewedBy=None, reviewedOn=None,
                                note='Author/title and ebook boundary markers checked. Not fully proofread or collated; historical scientific and religious claims remain attributed to their authors.')
        write(CAT / 'assets' / (aid + '.json'), asset)
        print(key, len(raw), 'bytes: acquired text verified', flush=True)

    # Reuse the three already-acquired L10 books. Extract existing text layers,
    # recording every PDF page, without making an OCR or completeness claim.
    derived = []
    for path in sorted((CAT / 'assets').glob('asset-l10-zwemer-*-pdf.json')):
        asset = read(path)
        if asset['acquisitionStatus'] != 'downloaded':
            continue
        raw = (SOURCES / asset['relativePath']).read_bytes()
        assert sha(raw) == asset['sha256']
        with pymupdf.open(stream=raw, filetype='pdf') as doc:
            pages = [dict(pdfPage=i + 1, text=p.get_text(sort=True)) for i, p in enumerate(doc)]
        folder = SITE / '.local/library/text-gap-batch' / asset['id']
        write(folder / 'pages.json', dict(parentAssetId=asset['id'], parentSha256=asset['sha256'], pages=pages))
        text = '\n\n'.join('[PDF page ' + str(p['pdfPage']) + ']\n' + p['text'] for p in pages)
        (folder / 'readable.txt').write_text(text, encoding='utf-8', newline='\n')
        assert len(text) > 50000
        derived.append(dict(parentAssetId=asset['id'], parentSha256=asset['sha256'],
                            sourceUrl=asset['canonicalUrl'], textPath=(folder / 'readable.txt').relative_to(SITE).as_posix(),
                            pageMapPath=(folder / 'pages.json').relative_to(SITE).as_posix(),
                            sha256=sha((folder / 'readable.txt').read_bytes()), pages=len(pages),
                            lowTextPages=[p['pdfPage'] for p in pages if len(p['text'].strip()) < 80],
                            method='existing-pdf-text-layer', tool='PyMuPDF', toolVersion=pymupdf.VersionBind,
                            characters=len(text), scope='All PDF pages attempted. Blank/image-only pages and text-layer errors remain; no new OCR, proofreading or source-rights promotion.'))
    write(OUT / 'existing-text-extractions.json', derived)
    ready = read(SITE / 'content/library/reports/text-backlog/ready-text-acquisition-manifest.json')
    acquired = [f for f in ready['files'] if not f.get('evidenceOnly', False)]
    for f in acquired:
        p = SOURCES / f['relativePath']
        assert sha(p.read_bytes()) == f['sha256']
    summary = dict(newTextFiles=len(manifest['files']), newBytes=sum(f['byteCount'] for f in manifest['files']),
                   existingPdfTextExtractions=len(derived), reusedCcelTextsVerified=len(acquired),
                   ocrJobs=0, newPdfDownloads=0, fullBooksProofread=0,
                   scope='Three named Gutenberg gaps acquired; three existing Zwemer text layers extracted; shared CCEL acquisitions reused, not reacquired.')
    write(OUT / 'summary.json', summary)
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
