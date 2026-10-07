"""Source-hashed RB03 chapter inventories; no inferred semantic/verse coverage."""
import hashlib
import importlib.util
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET

from bible.books import BOOKS
from bible.study_refs import normalise_book

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit', SITE / 'scripts/audit-rb03.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
R = audit.R
NAMES = {code: name for code, name, _section, _osis in BOOKS[:66]}


def book_code(title):
    title = re.sub(r'^First ', '1 ', title)
    title = re.sub(r'^Second ', '2 ', title)
    return normalise_book(title)


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def identity(asset):
    return dict(assetId=asset.get('assetId'), original=asset['relativePath'],
                originalSha256=asset.get('sha256', asset.get('actualSha256')), sourceUrl=asset.get('url'))


def roman(value):
    table = dict(I=1, V=5, X=10, L=50, C=100, D=500, M=1000)
    values = [table[x] for x in value.upper()]
    return sum(-x if i + 1 < len(values) and x < values[i + 1] else x for i, x in enumerate(values))


def main():
    manifest = read('acquisition-manifest.json')
    held = read('holdings-audit.json')['files']
    baseline = json.loads((SITE / 'content/library/reports/sermon-coverage/book-coverage.json').read_text(encoding='utf-8'))
    canonical = {normalise_book(b['book']): b for b in baseline['books']}
    chapters, volume_inventory = [], []
    henry_old = next(x for x in held if x.get('assetId') == 'asset-expanded-d927e402ddabccd2b416')
    current = None
    for toc in henry_old['epubContents']:
        try:
            current = normalise_book(toc['title'])
        except ValueError:
            pass
        match = re.fullmatch(r'Chapter (\d+)', toc['title'] or '')
        if match and current:
            chapters.append(dict(**identity(henry_old), author='Matthew Henry', bookId=current,
                chapter=int(match[1]), locator=toc['locator'], coverageKind='chapter-exposition-structure',
                provenance='reused', volume=1))
    for asset in manifest['files']:
        rawpath = audit.SOURCES / asset['relativePath']
        assert hashlib.sha256(rawpath.read_bytes()).hexdigest() == asset['sha256']
        if asset['format'] == 'xml':
            document = ET.parse(rawpath)
            start = len(chapters)
            for book in document.iter('div1'):
                try:
                    code = book_code(book.attrib.get('title', ''))
                except ValueError:
                    continue
                for node in book.findall('div2'):
                    title = node.attrib.get('title', '')
                    match = re.fullmatch(r'Chapter ([IVXLCDM]+)', title, flags=re.I)
                    if match:
                        chapters.append(dict(**identity(asset), author='Matthew Henry', bookId=code,
                            chapter=roman(match[1]), locator=node.attrib['id'], xmlTitle=title,
                            chapterWordCount=len(re.findall(r'\b\w+\b', ' '.join(node.itertext()))),
                            coverageKind='chapter-exposition-structure', provenance='new', volume=asset['volume']))
            volume_inventory.append(dict(**identity(asset), author='Matthew Henry', volume=asset['volume'],
                                         chapterCount=len(chapters) - start))
        elif asset['format'] == 'json':
            data = json.loads(rawpath.read_text(encoding='utf-8'))
            code, chapter = asset['bookId'], asset['chapter']
            expected = canonical[code]['chapters'][chapter - 1]['verseCount']
            entries = [e for e in data['chapter']['content'] if e.get('type') == 'verse']
            numbers = [e['number'] for e in entries]
            def flatten(value):
                if isinstance(value, str):
                    return value
                if isinstance(value, list):
                    return ''.join(flatten(v) for v in value)
                if isinstance(value, dict):
                    return flatten(value.get('text', value.get('content', '')))
                return ''
            texts = [flatten(e.get('content', '')).strip() for e in entries]
            pointer_only = bool(texts) and all(t.lower().startswith('see ') and len(t) < 240 for t in texts)
            assert len(numbers) == len(set(numbers)), asset['url']
            assert all(isinstance(n, int) and 1 <= n <= expected for n in numbers), asset['url']
            chapters.append(dict(**identity(asset), author='John Gill', bookId=code, chapter=chapter,
                locator='chapter.content[type=verse].number', coverageKind='offered-verse-labelled-commentary',
                provenance='new', canonicalVerseCount=expected, offeredVerseEntryCount=len(numbers),
                contentRole='cross-reference-pointers-only' if pointer_only else 'verse-labelled-commentary',
                expositionBodyWords=sum(len(re.findall(r'\b\w+\b', t)) for t in texts),
                entryNumbers=numbers, absentEntryNumbers=sorted(set(range(1, expected + 1)) - set(numbers)),
                emptyEntryNumbers=[e['number'] for e in entries if not e.get('content')],
                note='Absent entry labels are not automatically absent discussion: inspect neighbouring grouped exposition.'))
        elif asset['format'] == 'epub':
            _text, toc = audit.read_epub(rawpath)
            volume_inventory.append(dict(**identity(asset), author='Benjamin Keach', volume=asset['volume'],
                contents=toc, sermonHeadingCount=sum(bool(re.match(r'SERMON\b', t['title'] or '', re.I)) for t in toc),
                allTocMembersPresent=all(t['memberPresent'] for t in toc),
                warning='TOC includes erroneous passage labels. Do not use headings alone as normalized Scripture authority.'))
    keach_old = next(x for x in held if x.get('assetId') == 'asset-expanded-04e882193bfa6532d3fa')
    volume_inventory.append(dict(**identity(keach_old), author='Benjamin Keach', volume=3,
        contents=keach_old['epubContents'], provenance='reused', sermonHeadingCount=32))
    book_rows = []
    for code, canonical_book in canonical.items():
        row = dict(bookId=code, bookName=canonical_book['book'], canonicalChapters=canonical_book['chapterCount'],
            existingSermonMainTextPercent=canonical_book['mainTextPercent'], existingSermonUnits=canonical_book['unitCount'])
        selected = [t for t in read('targets.json') if t.get('bookId') == code]
        row['gillSelectedForThisMission'] = bool(selected)
        for author, prefix in [('Matthew Henry', 'henry'), ('John Gill', 'gill')]:
            mapped = [c for c in chapters if c['bookId'] == code and c['author'] == author]
            numbers = sorted(c['chapter'] for c in mapped)
            assert len(numbers) == len(set(numbers)), (code, author)
            row[prefix + 'Chapters'] = numbers
            row[prefix + 'CompleteChapterSequence'] = numbers == list(range(1, row['canonicalChapters'] + 1))
            row[prefix + 'NewChapters'] = sum(c['provenance'] == 'new' for c in mapped)
            if prefix == 'gill' and mapped:
                row['gillOfferedVerseEntries'] = sum(c['offeredVerseEntryCount'] for c in mapped)
                row['gillAbsentEntryLabels'] = sum(len(c['absentEntryNumbers']) for c in mapped)
                row['gillPointerOnlyChapters'] = [c['chapter'] for c in mapped if c['contentRole'] == 'cross-reference-pointers-only']
        if selected:
            row['gillUnacquiredChapters'] = sorted(set(t['chapter'] for t in selected) - set(row['gillChapters']))
        book_rows.append(row)
    summary = dict(mission='RB03', snapshot=manifest['updatedAt'], acquisitionFiles=len(manifest['files']),
        newHenryChapters=sum(c['author'] == 'Matthew Henry' and c['provenance'] == 'new' for c in chapters),
        reusedHenryChapters=sum(c['author'] == 'Matthew Henry' and c['provenance'] == 'reused' for c in chapters),
        gillChapters=sum(c['author'] == 'John Gill' for c in chapters),
        gillCompleteBooks=sum(b['gillCompleteChapterSequence'] for b in book_rows),
        henryCompleteBooks=sum(b['henryCompleteChapterSequence'] for b in book_rows),
        gillAbsentVerseEntryLabels=sum(b.get('gillAbsentEntryLabels', 0) for b in book_rows),
        gillPointerOnlyChapters=sum(len(b.get('gillPointerOnlyChapters', [])) for b in book_rows),
        note='Structural readable coverage, not exhaustive human-reviewed exegesis, verse completeness or DB ingestion.')
    audit.write(R / 'chapter-coverage.json', dict(summary=summary, chapters=chapters))
    audit.write(R / 'book-coverage.json', dict(metric=summary['note'], books=book_rows))
    audit.write(R / 'volume-coverage.json', dict(volumes=volume_inventory))
    lines = ['# RB03 book and chapter coverage', '',
        'The sermon percentage is a historical main-text metadata metric. It does not measure commentary or incidental citations. Henry and Gill columns are actual source-hashed chapter inventories; they do not assert equal exegetical depth or coverage of every verse.', '',
        '| Book | Sermon main-text % | Henry chapters (new / held) | Gill chapters | Gill absent verse labels |',
        '|---|---:|---|---|---:|']
    for b in book_rows:
        if not (b['henryChapters'] or b['gillChapters']):
            continue
        def span(numbers):
            if not numbers:
                return '\u2014'
            return f'1\u2013{numbers[-1]}' if numbers == list(range(1, numbers[-1] + 1)) else ', '.join(map(str, numbers))
        lines.append(f"| {b['bookName']} | {b['existingSermonMainTextPercent']} | {span(b['henryChapters'])} ({b['henryNewChapters']} / {len(b['henryChapters'])-b['henryNewChapters']}) | {span(b['gillChapters'])} | {b.get('gillAbsentEntryLabels', '\u2014')} |")
    lines += ['', 'Henry volumes I\u2013IV together cover the Old Testament chapter sequence. Only II\u2013IV are new. His New Testament volumes were not acquired. Gill is a deliberately selected book subset, not a whole-Bible acquisition.', '',
        'Exact chapter IDs, original paths, SHA-256 values, verse-entry numbers and omissions are in [chapter-coverage.json](chapter-coverage.json). Selected but unacquired Gill chapters are listed in [book-coverage.json](book-coverage.json); bodyless and reference-only responses are not filled exposition gaps. Keach\u2019s volumes and individual sermon TOC locators are in [volume-coverage.json](volume-coverage.json); passage labels need the separate exception review.', '']
    (R / 'COVERAGE.md').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
