"""Import the owner's local additions without rehashing the held collection."""
import collections
import argparse
import importlib.util
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from lxml import etree
import pymupdf

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json
from knowledge.library_extract import sha256, extraction_cache
from knowledge.chunk_cache import prepare


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', action='append', default=[])
    args = parser.parse_args()
    config = load()
    incoming = Path(r'C:\Users\lcladm\Downloads\BibleProjectDonwloads')
    archive = config['sources_dir'] / 'local-downloads-20261010/archive'
    ready = config['sources_dir'] / 'library/source-local-downloads-20261010'
    report = SITE / 'content/library/reports/local-downloads-20261010'
    report.mkdir(parents=True, exist_ok=True)
    before = json.loads((config['state_dir'] / 'embedding-progress.json').read_text('utf-8-sig'))
    spec = importlib.util.spec_from_file_location('csel_local_reader', SITE / 'scripts/acquire-csel.py')
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    hashes = collections.defaultdict(set)
    editions = {}
    held = json.loads((SITE / 'content/library/reports/csel-20261009/acquisition-manifest.json').read_text('utf-8'))['files']
    for row in held:
        hashes[row['sha256']].add(row['path'])
        if row.get('sourceId'):
            editions[row['sourceId'].strip()] = row['path']
    with sqlite3.connect(config['db'].as_uri() + '?mode=ro', uri=True) as db:
        for table in ('files', 'library_files'):
            for path, checksum in db.execute('SELECT path,sha256 FROM ' + table):
                hashes[checksum].add(path)
    catalogue = config['state_dir'] / 'campaign-stocktake/private-catalog.jsonl'
    if catalogue.exists():
        with catalogue.open(encoding='utf-8-sig') as stream:
            for line in stream:
                row = json.loads(line)
                if row.get('sha256') and row.get('path'):
                    hashes[row['sha256']].add(row['path'])
    for path in (SITE / 'content/library/catalog/assets').glob('*.json'):
        row = json.loads(path.read_text('utf-8-sig'))
        if row.get('sha256') and row.get('relativePath'):
            hashes[row['sha256']].add(str(config['sources_dir'] / row['relativePath']))
    release = next((incoming / 'csel-dev-v1.0').iterdir())
    ns = {'t': 'http://www.tei-c.org/ns/1.0', 'c': 'http://chs.harvard.edu/xmlns/cts'}
    def csel_details(path):
        value = reader.metadata(path)
        if not value:
            return None
        # Older release headers sometimes describe the containing volume rather
        # than the actual work. Prefer its exact CTS edition and author group.
        value['upstreamHeaderTitle'] = value['title']
        value['sourceId'] = value['sourceId'].strip()
        cts = path.parent / '__cts__.xml'
        if cts.exists():
            root = etree.parse(str(cts))
            matched = next((node for node in root.findall('c:edition', ns) if (node.get('urn') or '').strip() == value['sourceId']), None)
            label = matched.find('c:label', ns) if matched is not None else root.find('c:title', ns)
            if label is not None:
                value['title'] = reader.text(label)
        group = path.parent.parent / '__cts__.xml'
        if group.exists():
            name = etree.parse(str(group)).find('c:groupname', ns)
            if name is not None:
                value['author'] = reader.text(name)
        if value['author'] == 'Unstated in upstream title statement':
            header = etree.parse(str(path)).find('t:teiHeader', ns)
            value['author'] = reader.text(header.find('.//t:sourceDesc//t:monogr/t:author', ns)) or value['author']
        return value
    rows, failures, prepared = [], [], []
    if args.only and (report / 'acquisition-manifest.json').exists():
        previous = json.loads((report / 'acquisition-manifest.json').read_text('utf-8'))['files']
        rows = [row for row in previous if Path(row.get('originalPath', '')).name not in args.only]
        prepared = [{'path': row['path'], 'sha256': row['sha256'], 'chunks': row['preparedChunks']}
                    for row in rows if row.get('acquisitionStatus') == 'added-body']
    counts = collections.Counter(row['acquisitionStatus'] for row in rows)
    with (report / 'acquisition-manifest.jsonl').open('w', encoding='utf-8') as journal:
        for row in rows:
            journal.write(json.dumps(row, ensure_ascii=False) + '\n')
        for path in sorted(incoming.rglob('*')):
            if not path.is_file() or path.suffix in ('.tmp', '.part'):
                continue
            if args.only and path.name not in args.only:
                continue
            relative = path.relative_to(incoming)
            checksum = sha256(path)
            is_csel = path.is_relative_to(release)
            details = csel_details(path) if is_csel and path.suffix == '.xml' and '/data/' in path.as_posix() and path.name != '__cts__.xml' else None
            row = {'originalPath': str(path), 'url': path.as_uri(), 'sha256': checksum,
                   'bytes': path.stat().st_size, 'title': path.stem, 'author': 'Not stated in source metadata',
                   'licence': 'Original source notices retained; owner-authorized private local indexing, no public publication.',
                   'format': path.suffix.lstrip('.') or 'text', 'language': 'en', 'audience': 'adult readers; scholars',
                   'countAsBook': False, 'publicHostingAllowed': False, 'source': 'User-provided local downloads',
                   'sourceMetadata': {'localOrigin': str(path)}}
            body = False
            if is_csel:
                row.update(source='OpenGreekAndLatin CSEL', title=path.name, author='OpenGreekAndLatin contributors',
                           licence='Repository support; source notices retained; no separate body licence inferred', language='lat',
                           sourceMetadata={'repository': 'https://github.com/OpenGreekAndLatin/csel-dev', 'releaseDirectory': release.name,
                                           'repositoryPath': path.relative_to(release).as_posix(), 'localOrigin': str(path)})
                if details:
                    row.update(details)
                    row.update(countAsBook=True, classification='work_text', source='OpenGreekAndLatin CSEL')
                    body = True
            elif path.suffix.lower() == '.pdf':
                with pymupdf.open(path) as document:
                    metadata = document.metadata
                    beginning = '\n'.join(document[n].get_text() for n in range(min(2, len(document))))
                    row['sourceMetadata'].update(pdfMetadata=metadata, pages=len(document))
                row.update(title=metadata.get('title') or path.stem, author=metadata.get('author') or row['author'])
                if path.name == 'anf01.pdf':
                    row.update(title='ANF01. The Apostolic Fathers with Justin Martyr and Irenaeus',
                               author='Clement; Mathetes; Polycarp; Ignatius; Barnabas; Papias; Justin Martyr; Irenaeus',
                               editor='Philip Schaff', source='CCEL', sourceId='ccel-schaff-anf01-pdf', countAsBook=True,
                               licence='Public-domain original works and historical translations; CCEL edition notices retained',
                               credit='CCEL; Philip Schaff and named translators/editors; Tim Perrine description',
                               canonicalUrl='https://ccel.org/ccel/schaff/anf01.html', textKind='historical-anthology',
                               originalWorkId='ccel-schaff-anf01')
                    body = True
                elif path.name == 'moses-three-forties-a4.pdf':
                    row.update(title='Moses: Three forties', author='Bible Project site-authored learning material',
                               source='Bible Project authored study material', sourceId='bibleproject-moses-three-forties-pdf',
                               textKind='study-workbook', countAsBook=False, audience='individual and group Bible study',
                               credit='Bible Project site; KJV scripture quotations; source statements retained')
                    body = True
                elif path.name == 'WHA31PDF1.pdf':
                    row.update(title='What Did Jesus Do? Understanding the Work of Christ — Study Guide', author='R. C. Sproul',
                               source='Ligonier Ministries', sourceId='ligonier-WHA31PDF1', textKind='study-guide', countAsBook=False,
                               credit='R. C. Sproul; Ligonier Ministries; copyright 2011 and original notices retained',
                               licence='Copyright 2011 Ligonier Ministries; all rights reserved; no reproduction without permission. Owner-authorized private local indexing of this held copy.',
                               audience='individual and group Bible study')
                    body = True
                elif 'Thomas Aquinas' in beginning or path.name == 'summa.pdf':
                    warning = 'Roman Catholic source: review theological claims for doctrinal error against the project standard, including justification, prayer to Mary and Marian sinlessness; evaluate philosophical contributions separately. These are review topics, not a claim that every Catholic author affirms every listed doctrine.'
                    row.update(title='Summa Theologica [Roman Catholic — doctrinal review]', originalTitle='Summa Theologica',
                               author='Thomas Aquinas', source='CCEL', sourceId='ccel-aquinas-summa-pdf', countAsBook=True,
                               textKind='philosophy-and-theology', reviewClass='roman-catholic-doctrinal-review',
                               reviewStatus='Included by explicit owner instruction; doctrinal review required, not a processing hold',
                               limitations=warning, quality={'sourceTradition':'Roman Catholic','doctrinalReviewRequired':True,'warningLabel':warning},
                               credit='Thomas Aquinas; Fathers of the English Dominican Province; CCEL and original edition notices retained. ' + warning,
                               licence='Public-domain historical work and translation; original CCEL edition notices retained; private local indexing authorized.',
                               canonicalUrl='https://ccel.org/ccel/aquinas/summa.html')
                    body = True
                elif 'Invoice' in beginning and 'Cloudflare' in beginning:
                    row.update(title='Unrelated billing invoice', acquisitionStatus='excluded', reason='Billing document, not Bible library content')
                else:
                    row.update(acquisitionStatus='pending', reason='Unidentified local PDF; no guessed metadata or licence')
            if row.get('acquisitionStatus') not in ('excluded', 'pending'):
                existing = [p for p in hashes.get(checksum, []) if Path(p).exists()]
                if existing:
                    row.update(path=existing[0], acquisitionStatus='already-held-sha256', existingPaths=existing)
                elif details and details['sourceId'] in editions and Path(editions[details['sourceId']]).exists():
                    row.update(path=editions[details['sourceId']], acquisitionStatus='already-held-edition-id',
                               existingSha256=next(item['sha256'] for item in held if item.get('path') == editions[details['sourceId']]),
                               reason='Exact CTS edition ID already held in the newer repository release; older bytes remain in the user download folder')
                    # This is a comparison entry, not a claim that older and newer bytes match.
                    row['path'] = str(path)
                    row['existingPath'] = editions[details['sourceId']]
                else:
                    destination = (ready if body else archive) / relative
                    try:
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        if destination.exists():
                            if sha256(destination) != checksum:
                                raise ValueError('Existing destination has different bytes')
                        else:
                            destination.write_bytes(path.read_bytes())
                            if sha256(destination) != checksum:
                                raise ValueError('Input changed during copy')
                        row.update(path=str(destination), acquisitionStatus='added-body' if body else 'archived-support')
                        if body:
                            cache, selected, text_hash = extraction_cache(config, destination, checksum, row['format'])
                            chunk_count = 0
                            with cache.open(encoding='utf-8') as stream:
                                for line in stream:
                                    block = json.loads(line)
                                    if block['text'].strip():
                                        _, n, hit = prepare(config, block['text'], block['locator'])
                                        chunk_count += n
                            row.update(extractionCache=str(cache), extractedTextSha256=text_hash, preparedChunks=chunk_count)
                            prepared.append({'path': str(destination), 'sha256': checksum, 'chunks': chunk_count})
                            # Independent markers avoid racing the bulk worker's source-hashes.json.
                            write_json(config['state_dir'] / 'cpu-preparation/document-markers' / (checksum + '.json'), prepared[-1])
                            provenance = destination.with_name(destination.name + '.provenance.json')
                            write_json(provenance, row)
                            prov = row | {'path': str(provenance), 'sha256': sha256(provenance), 'bytes': provenance.stat().st_size,
                                          'format': 'json', 'classification': 'provenance', 'countAsBook': False,
                                          'acquisitionStatus': 'generated-provenance'}
                            rows.append(prov)
                            journal.write(json.dumps(prov, ensure_ascii=False) + '\n')
                            counts[prov['acquisitionStatus']] += 1
                    except Exception as exc:
                        row.update(acquisitionStatus='failed', error=str(exc))
                        failures.append({'path': str(path), 'error': str(exc)})
            counts[row.get('acquisitionStatus', 'pending')] += 1
            rows.append(row)
            journal.write(json.dumps(row, ensure_ascii=False) + '\n')
            journal.flush()
    after = json.loads((config['state_dir'] / 'embedding-progress.json').read_text('utf-8-sig'))
    write_json(report / 'acquisition-manifest.json', {'date': datetime.now(timezone.utc).isoformat(), 'files': rows})
    write_json(report / 'failed-downloads.json', {'items': failures})
    write_json(report / 'embedding-before.json', before)
    write_json(report / 'embedding-after.json', after)
    summary = {'inputFiles': sum(counts.values()) - counts['generated-provenance'], 'counts': dict(counts),
               'newBodyFiles': counts['added-body'], 'newCselEditionFiles': sum(row.get('source') == 'OpenGreekAndLatin CSEL' and row.get('acquisitionStatus') == 'added-body' for row in rows),
               'newPdfFiles': sum(row.get('format') == 'pdf' and row.get('acquisitionStatus') == 'added-body' for row in rows),
               'copiedBytes': sum(row['bytes'] for row in rows if row.get('acquisitionStatus') in ('added-body', 'archived-support', 'generated-provenance')),
               'preparedChunks': sum(row['chunks'] for row in prepared), 'failures': len(failures),
               'indexedBefore': before['indexed'], 'indexedAfter': after['indexed'], 'newBodiesPendingCorpusRefresh': len(prepared)}
    write_json(report / 'summary.json', summary)
    write_json(config['state_dir'] / 'cpu-preparation/local-downloads-supplement.json', {'files': prepared, 'failures': failures})
    (report / 'REPORT.md').write_text('# Local downloads — 2026-10-10\n\n' +
        f"Input files: {summary['inputFiles']:,}; new body files: {summary['newBodyFiles']}; CSEL edition files: {summary['newCselEditionFiles']}; PDFs: {summary['newPdfFiles']}; bytes copied: {summary['copiedBytes']:,}; prepared chunks: {summary['preparedChunks']:,}; failures: {summary['failures']}.\n\n" +
        'Disposition counts: ' + json.dumps(dict(counts)) + '\n\n' +
        f"Saved embeddings before/after: {before['indexed']:,} / {after['indexed']:,}. The increase belongs to the existing corpus. New originals and CPU caches await the current coordinator’s next corpus refresh.\n\n" +
        'Fewer than 100,000 newly embedded passages: this intake prepares held additions while the current embedding pass continues.\n\n' +
        'CSEL matches use recorded SHA-256 or the exact CTS edition ID, with identifier whitespace trimmed. Older bytes are not asserted equal to newer editions. New edition variants remain distinct. ANF01 is an additional PDF representation of an anthology already held in text; the two study guides are not counted as books. Repository support and volume duplicates stay outside body intake.\n\n' +
        'Excluded: unrelated billing invoice. Aquinas is included under the owner’s 2026-10-10 update allowing Catholic documents with a doctrinal-review warning; the warning is in the title, credit and metadata. Source originals remain untouched.\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
