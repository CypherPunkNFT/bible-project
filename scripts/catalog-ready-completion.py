"""Offline catalog registration and readable derivatives for acquired text gaps."""
import copy
import hashlib
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
LIB = SITE / 'content/library'
OUT = LIB / 'reports/ready-text-completion'
CACHE = SITE / '.local/library/ready-text-completion'
spec = importlib.util.spec_from_file_location('helper', SITE / 'scripts/catalog-scripture-studies.py')
h = importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
spec2 = importlib.util.spec_from_file_location('acquirer', SITE / 'scripts/finish-ready-texts.py')
a = importlib.util.module_from_spec(spec2); spec2.loader.exec_module(a)
read, write, ev, common = h.read, h.write, h.ev, h.common
NS = {'t': 'http://www.tei-c.org/ns/1.0'}


def main():
    history = read(OUT / 'historical-results.json')
    sermons = read(OUT / 'begg-titus-results.json')
    additional = read(OUT / 'begg-letters-results.json') if (OUT / 'begg-letters-results.json').exists() else {}
    all_sermons = dict(sermons, **additional)
    bible = {b['name']: b for b in read(SITE / 'content/apologetics/scripture-index.json')['books']}
    bible['Psalm'] = bible['Psalms']
    saved = []
    previous_files = read(OUT / 'catalog-files.json') if (OUT / 'catalog-files.json').exists() else []
    def save(record):
        folder = 'series' if record['kind'] == 'series' else record['kind'] + 's'
        path = LIB / 'catalog' / folder / (record['id'] + '.json')
        write(path, record); saved.append(path.relative_to(SITE).as_posix())
    source_file = LIB / 'sources.json'; registry = read(source_file)
    if not any(s['id'] == 'source-eebo-tcp' for s in registry['sources']):
        registry['sources'].append(dict(id='source-eebo-tcp', name='Early English Books Online Text Creation Partnership',
            url='https://github.com/textcreationpartnership', role='content-host', automation='approved-endpoint',
            acquisitionNote='Named CC0 XML releases on the official TCP repository; inspect each header/license. Preserve page markers, encoded characters and editorial gaps.',
            evidence=[ev('https://github.com/textcreationpartnership/A09339', 'README and TEI availability statement', 'Phase I CC0 keyboarded text; not scan images or a guarantee of completeness.')], reviewedOn='2026-10-05'))
        write(source_file, registry)
    author_file = LIB / 'authors.json'; authors = read(author_file)
    begg = next(x for x in authors['authors'] if x['id'] == 'author-alistair-begg')
    begg.update(eligibility='eligible', rationale='Official ministry doctrine affirms biblical authority, Trinity, substitutionary atonement, bodily resurrection and salvation by faith. Existing grace/election sermon and sustained Ligonier teaching/publishing support the broader Calvinist evangelical scope.',
                receptionBasis='Ligonier author catalog documents conference teaching, Tabletalk contributions and published books; this is substantive institutional reception, not a popularity measure.', unresolved=[])
    for evidence in [
        ev('https://www.truthforlife.org/about/what-we-believe/', 'Thirteen-point ministry statement', 'Scripture, Trinity, substitution, resurrection and faith; broader Calvinist evangelical acquisition screening, not confessional identity with Westminster.'),
        ev('https://learn.ligonier.org/teachers/alistair-begg', 'Author profile, conferences, Tabletalk and published books', 'Documented reception by a Reformed teaching ministry.'),
        ev('https://www.truthforlife.org/about/policies/', 'Web Content', 'Written content may be reused under unedited-content, link and credit conditions; third-party Bible notices retained.')]:
        if evidence['url'] not in [e['url'] for e in begg['evidence']]: begg['evidence'].append(evidence)
    begg['review']['scope'] = 'Acquisition eligibility resolved from doctrine, prior grace teaching, institutional reception and source policy. Individual works remain catalogued, not recommended wholesale.'
    write(author_file, authors)

    template = read(LIB / 'catalog/assets/asset-text-gap-carey-pg11449-txt.json')
    selection_index = []
    def edition(eid, wid, label, evidence, notes=None):
        rec = dict(**common('edition', eid), workId=wid, label=label, languages=['en'], contributors=[],
                   publisher=None, dates=[], abridgment='unknown', modernization='unknown', evidence=evidence)
        rec['notes'] = notes or []; save(rec)
    def asset(key, file, eid, source, fmt, policy, category='restricted-license', note=''):
        raw = (SOURCES / file['relativePath']).read_bytes()
        assert len(raw) == file['byteCount'] and hashlib.sha256(raw).hexdigest() == file['sha256']
        rec = copy.deepcopy(template)
        rec.update(id=Path(file['relativePath']).parent.name, editionId=eid, sourceId=source,
                   canonicalUrl=file['url'], finalUrl=file['finalUrl'], format=fmt,
                   relativePath=file['relativePath'], sha256=file['sha256'], byteCount=file['byteCount'],
                   mimeType=file['mimeType'], retrievedAt=file['retrievedAt'].replace('+00:00', 'Z'))
        rec['rights'].update(category=category, attribution='Original author, host and electronic contributors retained in the unchanged source file.',
                             conditions=[policy], conditionsMet=False,
                             evidence=[ev(file['url'], 'Acquired source and preserved notices', note or policy)],
                             unresolved=['No public full-text publication or whole-work proofreading performed.'])
        rec['rights']['actions'].update(download='allowed', host='unknown', redistribute='unknown', adapt='unknown', transcribe='unknown', indexFullText='unknown')
        if category == 'restricted-license':
            rec['rights'].update(licenseId='source-personal-educational-permission',
                                 licenseUrl='https://www.ccel.org/about/copyright.html' if source == 'source-ccel' else 'https://www.truthforlife.org/about/policies/')
        if source == 'source-eebo-tcp':
            rec['rights'].update(licenseId='CC0-1.0', licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/', jurisdiction='Worldwide', conditionsMet=True)
            rec['rights']['actions'].update(host='allowed', redistribute='allowed', adapt='allowed', transcribe='allowed', indexFullText='allowed')
        rec['processing']['note'] = 'Original acquired bytes unchanged; existing text, no OCR.'
        rec['quality'] = dict(state='issues', reviewedBy='Codex', reviewedOn='2026-10-05', note=note or 'Substantial body verified; not fully proofread or collated.')
        save(rec); return rec['id']

    for key, row in history.items():
        if not row['status'].startswith('acquired'): continue
        f = row['file']; evidence = [ev(f['url'], 'Acquired text and source metadata', row.get('scope', row.get('rights', 'Existing text acquired.')))]
        if key.startswith('goodwin-'):
            n = row['volume']; eid = 'edition-ready-completion-goodwin-' + str(n)
            edition(eid, 'work-goodwin-works', 'Thomas Goodwin, Works, volume ' + str(n) + ' — Nichol nineteenth-century witness', evidence,
                    ['Source item: ' + row['itemId'], 'Volume ' + str(n) + ' verified in item metadata and text front matter; host OCR retains defects.'])
            asset(key, f, eid, 'source-internet-archive', 'text', row['rights'], 'public-domain', 'Source-provided OCR; unproofread; this volume is part of a twelve-volume collected work.')
        elif key.startswith('machen-'):
            eid = 'edition-machen-liberalism'
            asset(key, f, eid, 'source-ccel', 'html', row['rights'], note='Chapter ' + str(row['chapter']) + ' of seven; printed page labels retained, exact editorial transmission not fully collated.')
        elif key.startswith('confession-'):
            eid = 'edition-l08-' + key.removeprefix('confession-')
            asset(key, f, eid, 'source-ccel', 'html', row['rights'], note=row['scope'])
        else:
            eid = 'edition-ready-completion-' + key
            wid = 'work-perkins-golden-chain' if key == 'perkins' else 'work-l08-savoy'
            label = 'Perkins, Golden Chaine with appended treatises, 1600 — EEBO-TCP A09339' if key == 'perkins' else 'Savoy Declaration, 1659 printing — EEBO-TCP A89790'
            edition(eid, wid, label, evidence, ['Retain original spelling, page markers and encoded editorial gaps; distinct from other catalog witnesses.'])
            asset(key, f, eid, 'source-eebo-tcp', 'other', row['rights'], 'open-license', 'Keyboarded XML with ' + str(row['editorialGaps']) + ' encoded gaps. Not a gap-free critical edition.')
            root = ET.fromstring((SOURCES / f['relativePath']).read_bytes())
            body = root.find('t:text', NS)
            def render(e):
                tag = e.tag.rsplit('}', 1)[-1]
                if tag == 'pb': return '\n[Source page ' + e.get('n', '?') + ']\n'
                if tag == 'gap': return '[SOURCE GAP: ' + ' '.join(k + '=' + v for k, v in e.attrib.items()) + ']'
                if tag == 'g': return '[ENCODED CHARACTER: ' + e.get('ref', '?') + ']'
                text = e.text or ''
                for child in e: text += render(child) + (child.tail or '')
                return text + ('\n' if tag in ('p', 'head', 'div', 'div1', 'div2', 'item', 'row') else '')
            text = render(body); target = CACHE / 'texts' / (key + '.txt'); target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding='utf-8', newline='\n')
            divisions = []
            for element in body.iter():
                head = element.find('t:head', NS)
                if head is not None:
                    divisions.append(dict(id=element.get('{http://www.w3.org/XML/1998/namespace}id'),
                                          level=element.tag.rsplit('}', 1)[-1], heading=' '.join(head.itertext()).strip()))
            selection_index.append(dict(key=key, sourceAssetId=Path(f['relativePath']).parent.name,
                                        derivedText=target.relative_to(SITE).as_posix(), sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
                                        pageMarkers=row['pageMarkers'], editorialGaps=row['editorialGaps'], divisions=divisions))

    series = []
    for pos, row in enumerate(all_sermons.values(), 1):
        if row['status'] != 'acquired': continue
        m = row['metadata']; number = m['resource_id_number'][0]
        wid = 'work-ready-begg-' + number; eid = 'edition-ready-begg-' + number
        title = m.get('title', m.get('twitter:title', m['og:title']))[0]
        evidence = [ev(row['url'], 'Transcript, resource metadata and series listing', 'Publisher transcript; preaching/resource date remains separate from web publication date.')]
        work = h.base_work(wid, title, 'author-alistair-begg', 'sermon', 'twenty-first-century', evidence)
        series_label = 'Titus series volume ' + str(row['seriesVolume']) if 'seriesVolume' in row else row['seriesUrl']
        work['collections'] = ['sermons']; work['notes'] = [series_label + ', position ' + str(row['position']) + '.', 'Publisher audio duration: ' + m['audio_duration'][0] + '.']
        for event, field in [('delivery', 'resource_date'), ('upload', 'published_on')]:
            if m.get(field):
                # Preserve the source label without assuming undocumented chronology.
                work['notes'].append(field + ': ' + m[field][0])
                work['dates'].append(dict(event=event, value=m[field][0], precision='day', label='Publisher ' + field, evidence=evidence))
        work['externalIds'] = dict(officialDestination=[row['url']], officialSermonNumber=[number])
        for ref in m['scripture_ref']:
            match = re.fullmatch(r'(.+?) (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?', ref)
            assert match, ref
            book = bible[match[1]]
            ch, start, endch, end = int(match[2]), int(match[3]), int(match[4] or match[2]), int(match[5] or match[3])
            assert 1 <= start <= book['chapters'][ch - 1] and 1 <= end <= book['chapters'][endch - 1]
            work['passages'].append(dict(reference=ref, numberingSystem='english', role='main-text',
                                         start=book['num'] * 1000000 + ch * 1000 + start, end=book['num'] * 1000000 + endch * 1000 + end,
                                         verification='verified', locator=row['url'] + '; source-assigned Scripture metadata'))
        save(work); edition(eid, wid, 'Truth For Life official HTML sermon transcript', evidence)
        asset('begg-' + number, row['file'], eid, 'source-truth-for-life', 'html',
              'Preserve unedited content; credit Truth For Life and link original plus homepage. Preserve third-party Scripture notices.',
              note='Full publisher transcript extracted; not independently compared against audio.')
        if row['url'] in sermons:
            series.append(dict(workId=wid, position=pos, originalLabel='Volume ' + str(row['seriesVolume']) + ', item ' + str(row['position']) + '; sermon ' + number))
    rec = dict(**common('series', 'series-ready-begg-titus'), title='A Study in Titus — three volumes', authorIds=['author-alistair-begg'],
               members=series, expectedCount=17, completeness='complete' if len(series) == 17 else 'partial',
               inventoryEvidence=[ev(x['url'], 'Ordered sermons and available volumes', 'All three source-listed volumes, including chapter 3.') for x in read(OUT / 'begg-titus-inventory.json')], missing=[])
    save(rec)
    if additional:
        for group in read(OUT / 'begg-letters-inventory.json'):
            members = []; missing = []
            for m in group['members']:
                row = additional[m['url']]
                if row['status'] != 'acquired': missing.append(m['url'] + ' — ' + row['status']); continue
                number = row['metadata']['resource_id_number'][0]
                members.append(dict(workId='work-ready-begg-' + number, position=m['position'], originalLabel='Source position ' + str(m['position']) + '; sermon ' + number))
            slug = group['url'].strip('/').split('/')[-1]
            record = dict(**common('series', 'series-ready-begg-' + slug), title=group['metadata'].get('title', group['metadata']['og:title'])[0],
                          authorIds=['author-alistair-begg'], members=members, expectedCount=len(group['members']),
                          completeness='partial' if missing else 'complete', missing=missing,
                          inventoryEvidence=[ev(group['url'], 'Source-listed series members', 'Completeness here concerns acquired publisher transcripts; missing transcript pages remain listed explicitly.')])
            save(record)
    write(OUT / 'encoded-text-index.json', selection_index)
    for old in set(previous_files) - set(saved):
        path = (SITE / old).resolve()
        assert path.is_relative_to((LIB / 'catalog').resolve())
        assert path.stem.startswith(('asset-ready-completion-', 'series-ready-begg-'))
        path.unlink()
    write(OUT / 'catalog-files.json', saved)
    print(json.dumps(dict(catalogRecords=len(saved), historicalFiles=len(history), beggTranscripts=sum(r['status'] == 'acquired' for r in all_sermons.values()), xmlIndexes=len(selection_index))))


if __name__ == '__main__': main()
