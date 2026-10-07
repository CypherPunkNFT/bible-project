"""Reproduce RB02 reading locators from unchanged local originals; no network."""
import importlib.util
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rb02collector', SITE / 'scripts/rb02-acquire.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
base = collector.base
R = base.REPORT
units = []


def add(asset, title, locator, topics, existing=False, **extra):
    units.append(dict(unitId='rb02-unit-' + str(len(units) + 1).zfill(3), title=title,
        assetId=asset.get('assetId'), sourceUrl=asset.get('url'), relativePath=asset['relativePath'],
        originalSha256=asset.get('sha256', asset.get('actualSha256')), locator=locator,
        topics=topics, existingHolding=existing, evidence='body/structure checked; not exhaustive doctrinal review', **extra))


def main():
    manifest = json.loads((R / 'acquisition-manifest.json').read_text(encoding='utf-8'))
    for a in manifest['files']:
        raw = (base.SOURCES / a['relativePath']).read_bytes()
        assert base.digest(raw) == a['sha256']
        if a['format'] == 'pdf':
            import pymupdf
            with pymupdf.open(stream=raw, filetype='pdf') as pdf:
                if 'keach-gold' in a['workId']:
                    toc = ' '.join(p.get_text() for p in list(pdf)[4:9])
                    chapters = re.findall(r'(\d+)\s+[\u2013-]\s+(.*?)\.{3,}\s*(\d+)', toc, re.S)
                    assert [int(x[0]) for x in chapters] == list(range(1, 15))
                    for n, title, page in chapters:
                        title = ' '.join(title.split())
                        assert re.search(r'\b' + n + r'\s+[\u2013-]', pdf[int(page)-1].get_text())
                        add(a, 'Chapter ' + n + ': ' + title, dict(kind='pdf-page', page=int(page)),
                            ['baptism', 'covenants'] if n == '10' else ['baptism', 'communion'] if n == '14' else ['baptism'])
                elif 'booth-apology' in a['workId']:
                    for roman, page in [('I', 7), ('II', 21), ('III', 30), ('IV', 62), ('V', 77), ('VI', 116)]:
                        text = pdf[page-1].get_text()
                        assert 'SECTION ' + roman + '.' in text
                        title_lines = []
                        for line in text.split('SECTION ' + roman + '.', 1)[1].splitlines():
                            line = line.strip()
                            if len(line) >= 3 and len(set(line)) == 1:
                                break
                            if line:
                                title_lines.append(line)
                        title = ' '.join(title_lines)
                        add(a, 'Section ' + roman + ': ' + title, dict(kind='pdf-page', page=page), ['baptism', 'Supper', 'strict-communion'])
                else:
                    sections = [(8, 'Treatise: infants as subjects'), (15, 'Abraham, posterity and covenant objections'),
                        (19, 'What the covenant is, entrance and approved subjects'), (50, 'Acts 2:39 and the promise'),
                        (60, "Reasons of dissent from Antichrist's baptism"), (70, 'Recovery of church and ordinances'),
                        (76, 'Whether baptism forms the church'), (79, 'Causes constituting the church'),
                        (82, 'Personal confession: articles 1-3'), (83, 'Personal confession: articles 4-7'),
                        (84, 'Personal confession: articles 8-10')]
                    for page, title in sections:
                        assert len(pdf[page-1].get_text()) > 500
                        add(a, title, dict(kind='pdf-page', page=page), ['baptism', 'covenants', 'church'])
        elif a.get('xmlKind') == 'tei-tcp':
            doc = ET.fromstring(raw)
            text = next(e for e in doc.iter() if e.tag.split('}')[-1] == 'text')
            chapters = [e for e in text.iter() if e.tag.split('}')[-1] == 'div' and e.attrib.get('type') == 'chapter']
            assert [e.attrib['n'] for e in chapters] == [str(n) for n in range(1, 15)]
            for e in chapters:
                head = next(x for x in e if x.tag.split('}')[-1] == 'head')
                add(a, ' '.join(''.join(head.itertext()).split()),
                    dict(kind='tei-chapter', chapter=e.attrib['n'], xpath=".//tei:body/tei:div[@type='chapter'][@n='" + e.attrib['n'] + "']"),
                    ['baptism', 'covenants'] if e.attrib['n'] == '10' else ['baptism'])
            base.write(R / 'tcp-quality.json', dict(chapters=len(chapters),
                gaps=[e.attrib for e in text.iter() if e.tag.split('}')[-1] == 'gap'],
                pageBreaks=len([e for e in text.iter() if e.tag.split('}')[-1] == 'pb']),
                note='225 encoded source gaps; facsimile pointers may repeat because pages share images. Long-s folded only in private derivative.'))
        elif a['format'] == 'html':
            doc = base.soup(raw)
            node = doc.select_one(a['selector'])
            for selector in a.get('excludeSelectors', []):
                for el in node.select(selector):
                    el.decompose()
            headings = [h.get_text(' ', strip=True) for h in node.select('h1,h2,h3,h4,h5,h6')]
            lines = (SITE / a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
            if not headings:
                headings = [l for l in lines if l.startswith(('Section ', 'How do ', 'What ', 'Defining Terms', 'CBTS &',
                    'The Covenant of Works in', 'Progressive Covenantalism:', 'Keeping Dialogue', 'Our Confessional')) and len(l) < 210]
            for heading in dict.fromkeys(headings):
                line = next((i+1 for i, l in enumerate(lines) if heading == l), None)
                add(a, heading, dict(kind='body-heading', heading=heading, privateDerivedLine=line),
                    ['Supper', 'means-of-grace'] if 'barcellos' in a['workId'] else ['baptism', 'profession', 'age-policy'] if 'children' in a['workId'] else ['covenants', 'model-comparison'])
            if not headings:
                add(a, a['title'], dict(kind='complete-article'), ['covenants', 'model-comparison'])
        elif a['format'] == 'txt':
            lines = raw.decode('utf-8').splitlines()
            headers = []
            for i, line in enumerate(lines):
                if not re.fullmatch(r'\s*(?:CHAPTER|CHATTER)\s+[IVXLCDM]+[.,]?\s*', line):
                    continue
                title_lines = []
                for value in lines[i+1:i+15]:
                    if not value.strip() and title_lines:
                        break
                    if value.strip():
                        title_lines.append(value.strip())
                headers.append((i+1, line.strip() + ' ' + ' '.join(title_lines)))
            assert len(headers) == {1:10, 2:5, 3:5}[a['volume']]
            for line, title in headers:
                add(a, title, dict(kind='original-text-line', line=line, volume=a['volume']), ['baptism', 'covenants', 'argument-and-reply'])
            if a['volume'] == 3:
                for marker in ('REPLY    TO', 'INDEX'):
                    hits = [(i+1, l) for i, l in enumerate(lines) if l.strip() == marker]
                    if hits:
                        add(a, 'Reply to Peter Edwards' if 'REPLY' in marker else 'Index of quoted/referenced authors',
                            dict(kind='original-text-line', line=hits[0][0], volume=3), ['baptism', 'attribution'])
    # Reuse the audit, not new downloads, for existing books and ordinance sections.
    held = json.loads((R / 'holdings-audit.json').read_text(encoding='utf-8'))
    for a in held['files']:
        title = a['title'] or ''
        if a['format'] == 'pdf' and ('Issue 108' in title or 'Issue 122' in title):
            starts = [(6, 'Fred Malone', "Of God's Covenant"), (13, 'Jeff Johnson', 'The Confession of 1689 and Covenant Theology'),
                (20, 'Pascal Denault', 'From the Covenant of Works to the Covenant of Grace')] if '108' in title else [
                (10, 'Scott N. Callaham', 'On the Communion of Saints'), (18, 'Tom Nettles', "Baptism and Lord's Supper: Articles 28-30")]
            import pymupdf
            with pymupdf.open(base.SOURCES / a['relativePath']) as pdf:
                for page, author, heading in starts:
                    assert author in pdf[page-1].get_text()
                    add(a, heading, dict(kind='pdf-page', page=page), ['covenants'] if '108' in title else ['ordinances', 'communion'], existing=True, author=author)
        if title in ('A Discourse of the Covenants', 'Divine Covenants', 'The Everlasting Covenant, A Sweet Cordial for A Drooping Soul'):
            for h in a['epubContents']:
                if title == 'A Discourse of the Covenants' and not h['title'].startswith('CHAP.'):
                    continue
                add(a, h['title'], dict(kind='epub-member', member=h['member'], fragment=h['locator']), ['covenants'], existing=True)
        if a.get('relevantXmlSections'):
            for h in a['relevantXmlSections']:
                add(a, h['title'], dict(kind='xml-id', id=h['id']), ['covenants', 'ordinances'], existing=True)
        if a.get('workId') == 'work-rb01-dagg-church-order' and a['url'].rstrip('/').rsplit('/',1)[-1] in ('ch-1','ch-2','ch-4','ch-5','ch-9'):
            lines = (SITE / a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
            for i, line in enumerate(lines):
                if line.startswith('SECTION '):
                    add(a, line, dict(kind='body-heading', heading=line, privateDerivedLine=i+1), ['baptism', 'church', 'communion'], existing=True)
    base.write(R / 'study-units.json', dict(units=units, note='Witness-specific source locators. Overlapping witnesses and quotations are not unique doctrinal claims.'))
    by_asset = {a['assetId']: a for a in manifest['files']}
    by_asset.update({a['assetId']: a for a in held['files'] if a.get('assetId')})
    def esc(value):
        return str(value).replace('|', '\\|').replace('\n', ' ')
    lines = ['# RB02 reading map', '', 'Source-checked chapter/section locators for new texts and reused holdings. '
        'These are navigation entries, not independently endorsed claims. Witness overlap, quoted opponents, editors and OCR gaps remain distinct.', '',
        '| Witness / acquisition source | Chapter or section | Exact locator | Holding |', '|---|---|---|---|']
    for u in units:
        a = by_asset.get(u['assetId'], {})
        loc = u['locator']
        url = u['sourceUrl'] or ''
        if loc['kind'] == 'pdf-page':
            where = 'PDF page ' + str(loc['page'])
            url += '#page=' + str(loc['page'])
        elif loc['kind'] == 'tei-chapter':
            where = 'TEI body/chapter ' + loc['chapter']
        elif loc['kind'] == 'epub-member':
            where = loc['fragment']
        elif loc['kind'] == 'xml-id':
            where = 'XML id=' + loc['id']
        elif loc['kind'] == 'original-text-line':
            where = 'Vol. ' + str(loc['volume']) + ', original TXT line ' + str(loc['line'])
        else:
            where = 'Body heading; private derivative line ' + str(loc.get('privateDerivedLine', '?'))
        label = a.get('title') or Path(u['relativePath']).name
        lines.append('| [' + esc(label) + '](<' + url + '>) | ' + esc(u['title']) + ' | ' + esc(where) + ' | ' + ('Reused' if u['existingHolding'] else 'New witness') + ' |')
    lines += ['', 'PDF page numbers above are physical pages, checked against article/chapter starts. '
        'TXT line numbers refer to unchanged original bytes decoded as UTF-8 with ordinary line splitting. '
        'Private derivative lines are extraction-specific. EPUB members and XML ids are local witness locators, not invented public URL fragments.', '',
        'Booth volume III chapter VI is OCR-labelled **CHATTER VI** (line 10456). '
        'The transcription retains it; the source table resolves its role from its subject and contents. '
        'The 1829 contents also give printed-page ranges; see COVENANT-MODELS.md and REPORT.md for selected paths.', '']
    (R / 'READING-MAP.md').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print('MAPPED', len(units), 'source-located study units;', sum(not x['existingHolding'] for x in units), 'in newly acquired witnesses')


if __name__ == '__main__':
    main()
