"""Reconcile RB01 originals and produce source-located coverage tables, without DB writes."""
import collections
import hashlib
import importlib.util
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urldefrag

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB01'
spec = importlib.util.spec_from_file_location('rb01', SITE / 'scripts/rb01-acquire.py')
rb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rb)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    manifest = json.loads((R / 'acquisition-manifest.json').read_text(encoding='utf-8'))
    targets = json.loads((R / 'targets.json').read_text(encoding='utf-8'))
    files = {a['url']: a for a in manifest['files']}
    units, checks, pdfs = [], [], []
    for a in files.values():
        raw = (SOURCES / a['relativePath']).read_bytes()
        derived = (SITE / a['derivedText']['path']).read_bytes()
        assert sha(raw) == a['sha256'], a['url']
        assert sha(derived) == a['derivedText']['sha256'], a['url']
        checks.append(dict(assetId=a['assetId'], originalHashPassed=True, derivativeHashPassed=True,
                           byteCount=len(raw), wordCount=a['derivedText']['wordCount']))
        if a['format'] == 'pdf':
            import pymupdf
            with pymupdf.open(stream=raw, filetype='pdf') as doc:
                counts = [len(p.get_text().strip()) for p in doc]
                # Private snippets for identity review; never included in public metadata.
                preview = '\n'.join(doc[i].get_text() for i in range(min(4, len(doc))))
                p = rb.CACHE / 'pdf-review' / (a['assetId'] + '.txt')
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(preview, encoding='utf-8')
                pdfs.append(dict(assetId=a['assetId'], url=a['url'], expectedIssue=a.get('expectedIssue'),
                                 pages=len(doc), readablePages=sum(n >= 100 for n in counts),
                                 shortTextPages=[i + 1 for i, n in enumerate(counts) if n < 100],
                                 previewPath=p.relative_to(SITE).as_posix()))
    # Exact table-of-contents links are distinct from unique source files.
    toc = 'https://www.reformedreader.org/rbb/dagg/mottoc.htm'
    raw, meta = rb.fetch(toc)
    doc = BeautifulSoup(raw, 'html.parser')
    dagg = []
    for anchor in doc.select('a[href]'):
        if not re.match(r'^mot(?!toc)', anchor['href']):
            continue
        url = urljoin(toc, anchor['href'])
        base, fragment = urldefrag(url)
        asset = files.get(base)
        present = False
        if asset:
            page = BeautifulSoup((SOURCES / asset['relativePath']).read_bytes(), 'html.parser')
            present = not fragment or bool(page.find(id=fragment) or page.find(attrs={'name': fragment}))
        item = dict(title=anchor.get_text(' ', strip=True), sourceUrl=url,
                    assetId=asset['assetId'] if asset else None, anchorPresent=present,
                    book=int(re.search(r'motb(\d)', base)[1]) if re.search(r'motb(\d)', base) else None)
        dagg.append(item)
    # Structured catechism records remain attributed to their individual works.
    bundle = files.get('https://baptistcatechism.org/baptistcatechism-data.json')
    catechism = {}
    if bundle:
        data = json.loads((SOURCES / bundle['relativePath']).read_bytes())
        for key, record in sorted(data.items()):
            if key.startswith('symbolics-data/catechisms/bc1695/beddome/'):
                number = int(record['baptist'])
                parent = data[f'symbolics-data/catechisms/bc1695/questions/{number:03d}.yml']
                qas = [qa for p in record['paragraphs'] for qa in p['qas']]
                units.append(dict(id=f'rb01-beddome-q{number:03d}',
                                  workId='work-rb01-beddome-exposition', sourceKey=key,
                                  title=parent['question'], question=number, nestedQuestions=len(qas),
                                  parentWorkId='work-l08-baptist', parentQuestion=number,
                                  sourceUrl='https://baptistcatechism.org/beddome/',
                                  assetId=bundle['assetId'],
                                  references=list(dict.fromkeys(qa.get('r', '').strip() for qa in qas if qa.get('r')))))
            if key.startswith('symbolics-data/catechisms/aoc1680/questions/'):
                number = int(record['id'])
                units.append(dict(id=f'rb01-collins-q{number:03d}',
                                  workId='work-rb01-collins-orthodox-catechism', sourceKey=key,
                                  title=record['question'], question=number, assetId=bundle['assetId'],
                                  sourceUrl='https://baptistcatechism.org/baptistcatechism-data.json',
                                  sourceHeidelbergQuestionRelations=record.get('relations', {}).get('heidelberg', []),
                                  references=[s['proofs'] for s in record['segments'] if s.get('proofs')]))
        for work, expected in [('work-rb01-beddome-exposition', 114),
                               ('work-rb01-collins-orthodox-catechism', 152)]:
            rows = [u for u in units if u['workId'] == work]
            assert sorted(u['question'] for u in rows) == list(range(1, expected + 1))
            catechism[work] = dict(numberedUnits=len(rows), sequentialRangePassed=True,
                                  nestedQuestions=sum(u.get('nestedQuestions', 0) for u in rows))
    # Metadata only: bibliography groups logical works, not formats or HTML pages.
    works = collections.defaultdict(list)
    for a in files.values():
        ids = a.get('workIds', [a['workId']])
        for work in ids:
            works[work].append(a)
    identities = {
        'work-rb01-dagg-manual-theology': ('Manual of Theology, Part I', 'John Leadley Dagg'),
        'work-rb01-dagg-church-order': ('A Treatise on Church Order (Manual of Theology, Second Part)', 'John Leadley Dagg'),
        'work-rb01-first-london-confession': ('First London Confession (1644 and 1646 witnesses kept distinct)', 'Seven Particular Baptist congregations'),
        'work-rb01-philadelphia-confession': ('Philadelphia Confession (1742)', 'Philadelphia Baptist Association'),
        'work-rb01-cox-appendix': ('An Appendix to a Confession of Faith (1646)', 'Benjamin Cox'),
        'work-rb01-beddome-exposition': ('A Scriptural Exposition of the Baptist Catechism', 'Benjamin Beddome'),
        'work-rb01-collins-orthodox-catechism': ('An Orthodox Catechism (1680)', 'Hercules Collins'),
        'work-rb01-first-london-editorial-documentation': ('First London Comprehensive Edition: text and editorial documentation (2022)', 'London1644.info editors'),
    }
    bibliography = [dict(workId=work, title=identities.get(work, (assets[0]['title'], ''))[0],
                         author=identities.get(work, ('', assets[0]['author']))[1],
                         assetIds=list(dict.fromkeys(a['assetId'] for a in assets)),
                         sourceUrls=list(dict.fromkeys(a['url'] for a in assets)),
                         scope='Source-first acquisition identity; see admission-decisions.json for teaching scope.')
                    for work, assets in sorted(works.items())]
    missing = [t['url'] for t in targets if t['url'] not in files]
    part2_urls = {a['url'] for a in files.values() if a['workId'] == 'work-rb01-dagg-church-order'}
    expected_part2 = {f'https://founders.org/library/ch-{n}/' for n in range(1, 11)} | {
        f'https://founders.org/library/{name}/' for name in ('preface', 'introduction', 'conclusion', 'appendix')}
    philadelphia_urls = {a['url'] for a in files.values() if a['workId'] == 'work-rb01-philadelphia-confession'}
    expected_philadelphia = {f'https://www.reformedreader.org/ccc/pc{n:02d}.htm' for n in range(1, 35)}
    confession_sequences = {}
    for url in ('https://www.romans45.org/creeds/bc1644.htm', 'https://www.romans45.org/creeds/bc1646.htm'):
        a = files.get(url)
        if a:
            text = (SITE / a['derivedText']['path']).read_text(encoding='utf-8')
            labels = re.findall(r'^([IVXLCDM]+)[.]?\s*$', text, re.M)
            confession_sequences[url] = dict(articleHeadingCount=len(labels[:52]),
                labels=labels[:52], appendixHeadingCount=max(0, len(labels) - 52),
                warning='1644 article at position 36 is printed XXVI instead of XXXVI; do not rewrite source.' if '1644' in url else None)
    cox = next((a for a in files.values() if a['workId'] == 'work-rb01-cox-appendix'), None)
    cox_labels = re.findall(r'^([IVXLCDM]+)[.]\s', (SITE / cox['derivedText']['path']).read_text(encoding='utf-8'), re.M) if cox else []
    rb.write(R / 'confessional-coverage.json', dict(
        daggPart2=dict(chapters=10, components=14, allExpectedFilesPresent=expected_part2 <= part2_urls,
                       missingUrls=sorted(expected_part2 - part2_urls)),
        philadelphia=dict(chapters=34, allExpectedFilesPresent=expected_philadelphia <= philadelphia_urls,
                          missingUrls=sorted(expected_philadelphia - philadelphia_urls)),
        firstLondon=confession_sequences,
        coxAppendix=dict(numberedDeclarations=len(cox_labels), labels=cox_labels),
        note='Structural digital-witness checks, not critical-edition collation. Original numbering errors remain in original bytes.'))
    rb.write(R / 'study-units.json', dict(units=units, note='Source-located metadata and proof references, not new graph edges or embeddings.'))
    rb.write(R / 'bibliography.json', dict(works=bibliography))
    rb.write(R / 'coverage.json', dict(daggPart1=dict(tocUrl=toc, tocSha256=meta['sha256'], entries=dagg,
                        uniqueSourceFiles=len(set(urldefrag(d['sourceUrl'])[0] for d in dagg)),
                        allFilesPresent=all(d['assetId'] for d in dagg),
                        missingAnchors=[d['sourceUrl'] for d in dagg if not d['anchorPresent']]),
                        catechisms=catechism, pdfTextChecks=pdfs))
    rb.write(R / 'validation.json', dict(verifiedAt=datetime.now(timezone.utc).isoformat(),
                 originalFiles=len(files), originalBytes=sum(a['byteCount'] for a in files.values()),
                 logicalWorkRecords=len(works), checks=checks, pendingUrls=missing,
                 newOCR=False, databaseWrites=False, embeddingWorkerStarted=False))
    # A chapter/topic map is not a claim of exhaustive paragraph-by-paragraph coverage.
    chapter_rows = [
        (1, 'Holy Scripture', 104, [6, 14, 21, 27, 33, 40]),
        (2, 'God and the Holy Trinity', 105, [6]),
        (3, "God's Decree", 106, [6, 15, 23, 42]),
        (4, 'Creation', 107, [6]),
        (5, 'Divine Providence', 106, [33]),
        (6, 'The Fall, Sin and Punishment', 107, [14, 21, 29]),
        (7, "God's Covenant", 108, [6, 13, 20]),
        (8, 'Christ the Mediator', 108, [27, 36, 45]),
        (9, 'Free Will', 109, [7]),
        (10, 'Effectual Calling', 109, [18, 28]),
        (11, 'Justification', 110, [4, 12, 22, 32, 40]),
        (12, 'Adoption', 111, [9]),
        (13, 'Sanctification', 111, [16, 24, 36]),
        (14, 'Saving Faith', 112, [6]),
        (15, 'Repentance unto Life and Salvation', 112, [17]),
        (16, 'Good Works', 112, [25, 32]),
        (17, 'Perseverance', 113, [8, 20, 28]),
        (18, 'Assurance', 114, [8]),
        (19, 'The Law of God', 115, [6, 14, 25, 38, 45]),
        (20, 'The Gospel and the Extent of Its Grace', 116, [6, 10, 19, 28]),
        (21, 'Christian Liberty and Liberty of Conscience', 117, []),
        (22, 'Religious Worship and the Sabbath Day', 117, []),
        (23, 'Lawful Oaths and Vows', 117, []),
        (24, 'The Civil Magistrate', 119, []),
        (25, 'Marriage', 119, []),
        (26, 'The Church', 121, [4, 22, 28]),
        (27, 'The Communion of Saints', 122, [10]),
        (28, 'Baptism and the Lord\'s Supper', 122, [18]),
        (29, 'Baptism', 122, [18]),
        (30, 'The Lord\'s Supper', 122, [18]),
        (31, 'The State after Death and the Resurrection', 123, [6, 13, 20]),
        (32, 'The Last Judgment', 123, [20, 40]),
    ]
    article_suffixes = {
        21: 'of-christian-liberty-and-liberty-of-conscience/',
        22: 'chapter-22-biblically-regulated-religious-worship/',
        23: 'by-that-glorious-and-dreadful-name/',
        24: 'of-the-civil-magistrate/',
        25: 'of-marriage-the-1689-baptist-confession/',
    }
    mapping = []
    for chapter, title, issue, pages in chapter_rows:
        assets = [a for a in files.values() if a.get('expectedIssue') == issue]
        if chapter in article_suffixes:
            assets = [a for a in assets if a['url'].endswith(article_suffixes[chapter])]
        elif issue not in (117, 119):
            assets = [a for a in assets if a['format'] == 'pdf']
        locations = [dict(assetId=a['assetId'], url=a['url'], printedArticleStartPages=pages)
                     for a in assets]
        if chapter == 26:
            locations += [dict(assetId=a['assetId'], url=a['url'], printedArticleStartPages=[6])
                          for a in files.values() if a.get('expectedIssue') == 122 and a['format'] == 'pdf']
        mapping.append(dict(chapter=chapter, topic=title, issue=issue, locations=locations,
                            acquired=bool(locations), exhaustiveParagraphCoverageClaimed=False))
    rb.write(R / 'exposition-coverage.json', dict(
        reference='Second London Baptist Confession, 32-chapter numbering',
        evidence='Publisher introductions and contents reviewed against acquired text layers; page numbers are printed article starts.',
        chapters=mapping, allChapterTopicsLocated=all(x['acquired'] for x in mapping),
        limits=[
            'Chapter 11: issue 110 introduction explicitly omits separate discussion of paragraphs 4 and 5.',
            'Chapter 26: issue 121 treats paragraphs 1-6, 10, 14-15; issue 122 completes 7-9 and 11-13.',
            'Chapter 20: proposed modern additions are commentary, not original confession wording.',
            'Incidental book reviews and other journal articles are not independently admitted core teaching works.',
            'A chapter/topic relationship is source-located metadata, not a computed graph edge or theological equivalence.',
        ]))
    print('RB01:', len(files), 'verified originals;', len(works), 'logical records;',
          len(units), 'source-located catechism units;', len(missing), 'pending URLs')


if __name__ == '__main__':
    main()
