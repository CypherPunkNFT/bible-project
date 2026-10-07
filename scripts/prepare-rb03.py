"""Prepare the bounded reviewed RB03 queue from retained primary discovery."""
import hashlib
import importlib.util
import json
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit', SITE / 'scripts/audit-rb03.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
R = audit.R


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def main():
    held = read('holdings-audit.json')['files']
    old = next(x for x in held if x.get('assetId') == 'asset-expanded-04e882193bfa6532d3fa')
    p = audit.CACHE / 'probe/keach-3.epub'
    text, toc = audit.read_epub(p)
    parity = [x['title'] for x in old['epubContents']] == [x['title'] for x in toc]
    assert parity
    audit.write(R / 'keach-reuse-identity.json', dict(heldAssetId=old['assetId'], heldSha256=old['actualSha256'],
        offeredVolume=3, offeredSha256=hashlib.sha256(p.read_bytes()).hexdigest(), tocTitleParity=parity,
        newWitnessAcquired=False, reason='All 36 TOC labels, 32 sermons and four parables match. Reuse the held Volume III witness; not a new work.'))
    discovery = read('discovery-evidence.json')
    targets = []
    for n in [2, 3, 4]:
        page = next(x for x in discovery if x.get('url') == f'https://ccel.org/ccel/henry/mhc{n}.html')
        url = next(x['url'] for x in page['links'] if x['url'].endswith('.xml'))
        targets.append(dict(workId='work-rb03-henry-complete-commentary', title=f'Commentary on the Whole Bible, Volume {n}',
            author='Matthew Henry', url=url, sourceId='source-ccel', format='xml',
            edition='CCEL ThML transcription of historic complete commentary; exact print impression not established',
            volume=n, completeness='complete-offered-volume', rightsCategory='historic-text-CCEL-personal-educational-use',
            rightsEvidence='Primary CCEL copyright policy permits personal/educational/nonprofit use; added material may retain copyright. Public republication/commercial use requires permission. Offered XML resolved from actual volume page; private noncommercial use only.',
            sourcePage=page['url'], policyUrl='https://ccel.org/about/copyright.html', minimumWords=300000,
            requiredMarkers=['CHAP.'], admissionRole='scoped-Reformed-exegesis-non-Baptist'))
    volumes = read('keach-volume-discovery.json')
    for n in [1, 2, 4]:
        x = volumes[n - 1]
        targets.append(dict(workId='work-rb03-keach-parables', title=f'Exposition of the Parables and Express Similitudes, offered Volume {n}',
            author='Benjamin Keach', url=x['url'], sourceId='source-monergism-library', format='epub',
            edition='Monergism four-volume electronic arrangement of historic Keach exposition; source preface dated 1701',
            volume=n, completeness='complete-offered-volume', rightsCategory='historic-text-modern-electronic-packaging',
            rightsEvidence='Historic Keach text; publisher explicitly offers these full EPUB volumes for free reading. Copyright retained for modern electronic packaging/editorial additions; no public republication inferred. One rate-limited private download per missing volume; robots permits offered path.',
            sourcePage='https://www.monergism.com/exposition-parables-ebook', policyUrl='https://www.monergism.com/about-us',
            minimumWords=80000, requiredMarkers=['SERMON'], admissionRole='historical-Baptist-sustained-parable-exegesis'))
    books = read('gill-offered-books.json')['data']['books']
    by_id = {x['id']: x for x in books}
    chosen = ['LEV', 'NUM', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PRO', 'ECC',
        'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'PHM', '2JN', '3JN',
        'JDG', 'EZK']
    for bid in chosen:
        book = by_id[bid]
        for chapter in range(1, book['numberOfChapters'] + 1):
            url = 'https://bible.helloao.org' + book['firstChapterApiLink'].rsplit('/', 1)[0] + '/' + str(chapter) + '.json'
            targets.append(dict(workId='work-rb03-gill-exposition-selected-books', title=f'Gill Exposition: {book["name"]} {chapter}',
                author='John Gill', url=url, sourceId='source-helloao', format='json', jsonKind='helloao-commentary-chapter',
                bookId=bid, bookName=book['name'], chapter=chapter, expectedBookChapters=book['numberOfChapters'],
                edition='HelloAO John Gill JSON electronic witness; underlying print impression unspecified',
                completeness='complete-offered-chapter-component-of-selected-book', rightsCategory='historic-text-Public-Domain-Mark-1.0',
                rightsEvidence='Primary API inventory explicitly labels Gill with CC Public Domain Mark 1.0; publisher docs offer API/downloads with no usage/key limits. PDM is a status mark, not a new copyright license. Source print impression/transcription lineage unresolved; private source-preserving acquisition only.',
                sourcePage='https://bible.helloao.org/docs/guide/making-requests.html', policyUrl='https://bible.helloao.org/docs/',
                minimumWords=20, requiredMarkers=['John Gill'], admissionRole='historical-Baptist-sustained-book-exegesis'))
    audit.write(R / 'targets.json', targets)
    print('PREPARED', len(targets), 'targets;', len(targets) - 6, 'Gill chapters in', len(chosen), 'selected complete books; six missing volume witnesses')


if __name__ == '__main__':
    main()
