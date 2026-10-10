"""Offline text readiness and reuse of the held Perkins IA transcription.

Writes only this report directory and sources/library/campaign-reconciliation.
Does not build, embed, OCR, download, change originals, or write extraction caches.
"""
import hashlib
import json
import re
import sqlite3
import sys
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

REPORT = Path(__file__).resolve().parent
SITE = REPORT.parents[4]
ROOT = SITE.parent
STOCK = ROOT / 'KnowledgeBase/campaign-stocktake'
DERIVATIVES = ROOT / 'sources/library/campaign-reconciliation/text'
sys.path.insert(0, str(SITE))
from knowledge.library_extract import extract, derivative_blocks
from lxml import etree
import pymupdf


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.text-task.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def checksum(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    started = datetime.now(timezone.utc).isoformat()
    gap_rows = read(STOCK / 'text-gaps.json')['items']
    gap_paths = {row['path'] for row in gap_rows}
    sword, gap_metadata, sword_manifests = [], {}, set()
    for line in (STOCK / 'private-catalog.jsonl').open(encoding='utf-8'):
        row = json.loads(line)
        if row['path'] in gap_paths:
            gap_metadata[row['path']] = row
        if row.get('source') == 'sword' and row['path'].endswith('.zip'):
            sword.append(row)
            sword_manifests.update(row.get('manifests', []))
    with closing(sqlite3.connect((ROOT / 'KnowledgeBase/knowledge.sqlite3').as_uri() + '?mode=ro', uri=True)) as db:
        current = {row[0]: row[1] for row in db.execute('SELECT path,status FROM library_files')}
    backlog = read(STOCK / 'intake-backlog.json')['items']
    pending, counts, characters, pending_errors = [], Counter(), 0, []
    progress = REPORT / 'progress.json'
    for number, row in enumerate(backlog, 1):
        path = Path(row['path'])
        record = dict(row, publishedStatusNow=current.get(str(path)))
        record['representationKind'] = ('article_or_sermon' if row['source'] in ('aomin', 'kruger')
            else 'journal_issue' if row['source'] == 'foundersjournal' else 'held_work_or_volume_representation')
        record['countAsNewBook'] = False
        try:
            if not path.is_file():
                record['textAvailability'] = 'missing_since_stocktake'
            else:
                blocks, char_count, nonempty = 0, 0, 0
                for block in extract(path):
                    blocks += 1
                    size = len(block['text'].strip())
                    char_count += size
                    nonempty += bool(size)
                record.update(textCharacters=char_count, textBlocks=blocks, nonemptyBlocks=nonempty)
                record['textAvailability'] = 'existing_text_ready' if char_count else 'no_extractable_existing_text'
                characters += char_count
        except Exception as exc:
            record.update(textAvailability='extraction_error', error=str(exc))
            pending_errors.append(record)
        counts[record['textAvailability']] += 1
        pending.append(record)
        if number % 100 == 0 or number == len(backlog):
            save(progress, dict(state='checking_existing_text', processed=number, total=len(backlog), counts=dict(counts)))
            print(f'Existing text {number}/{len(backlog)}: {dict(counts)}', flush=True)
    save(REPORT / 'text-ready-inputs.json', dict(snapshotAt=started, items=pending,
         note='Availability only, not a book count or approval of preview/advertising/support files. Existing import retains extraction locators.'))

    library = ROOT / 'sources/library'
    pdf = library / 'source-internet-archive/asset-l02-WilliamPerkinsWorksVol3-pdf/William-Perkins-Works-vol-3.pdf'
    xml = library / 'source-internet-archive/asset-l02-WilliamPerkinsWorksVol3-ocrxml/William-Perkins-Works-vol-3_djvu.xml'
    txt = library / 'source-internet-archive/asset-l02-WilliamPerkinsWorksVol3-ocr/William-Perkins-Works-vol-3_djvu.txt'
    original_provenance = {str(path): read(Path(str(path) + '.provenance.json')) for path in (pdf, xml, txt)}
    for path in (pdf, xml, txt):
        actual = checksum(path)
        if actual != original_provenance[str(path)]['sha256']:
            raise ValueError('Existing Perkins provenance checksum mismatch: ' + str(path))
    with pymupdf.open(pdf) as document:
        pdf_pages = len(document)
        pdf_metadata = document.metadata
        if any(page.get_text().strip() for page in document):
            raise ValueError('Perkins PDF now has a text layer; reassess derivative priority')
    document = etree.parse(str(xml), etree.XMLParser(resolve_entities=False, no_network=True))
    objects = document.findall('.//OBJECT')
    if len(objects) != pdf_pages:
        raise ValueError('IA transcription and PDF physical page counts differ')
    pages = []
    for index, obj in enumerate(objects):
        expected = f'William-Perkins-Works-vol-3_{index:04d}.djvu'
        if obj.get('usemap') != expected:
            raise ValueError('IA page sequence mismatch')
        lines = [' '.join((word.text or '') for word in line.findall('.//WORD')) for line in obj.findall('.//LINE')]
        text = '\n'.join(lines)
        pages.append(dict(page=index+1, text=text, sourcePageId=obj.get('usemap'),
                          locator=f'PDF page {index+1}', printedPagination='not inferred'))
    target = DERIVATIVES / 'perkins-works-volume-3-existing-ia-ocr'
    target.mkdir(parents=True, exist_ok=True)
    # The provenance suffix keeps page records out of separate body embedding.
    page_file = target / 'page-text.provenance.json'
    text_file = target / 'transcription.txt'
    save(page_file, pages)
    # Exact block joining also lets the standalone TXT deduplicate with originals.
    text_file.write_text('\n'.join(row['text'] for row in pages), encoding='utf-8')
    page_hash, text_hash = checksum(page_file), checksum(text_file)
    derivative = dict(path=str(text_file), sha256=text_hash, bytes=text_file.stat().st_size,
        format='txt', pageText=str(page_file), pageTextSha256=page_hash, countAsBook=False,
        method='Existing IA DjVu WORD text in LINE order; 535 consecutively numbered physical transcription pages match the same IA item PDF; no new OCR',
        sourcePath=str(xml), sourceSha256=original_provenance[str(xml)]['sha256'],
        sourceUrl=original_provenance[str(xml)]['url'], physicalPages=pdf_pages,
        quality='Source-provided historical OCR; spelling and recognition errors preserved; completeness/accuracy of printed prose not certified')
    # Verify the supported derivative adapter actually emits each recorded page.
    recovered_blocks = list(derivative_blocks(text_file, derivative))
    if len(recovered_blocks) != pdf_pages or any(a['text'] != b['text'] or a['page'] != b['page'] for a, b in zip(recovered_blocks, pages)):
        raise ValueError('Importer derivative page roundtrip failed')
    files = []
    for path in (pdf, xml, txt):
        provenance = original_provenance[str(path)]
        files.append(dict(path=str(path), sha256=provenance['sha256'], bytes=path.stat().st_size,
            url=provenance['url'], format=path.suffix[1:], source='source-internet-archive',
            sourceId='WilliamPerkinsWorksVol3', title='The Works of William Perkins, volume 3',
            author='William Perkins', language='en',
            licence='Public-domain historical work; existing Internet Archive scan/transcription notices and contributor metadata retained',
            contributor='Internet Archive; Tony Baxter credited in PDF metadata; original scan/transcription contributors retained',
            credit='Existing source-provided OCR, not a newly produced transcription',
            countAsBook=path == pdf, derivedText=derivative,
            sourceMetadata=dict(originalProvenance=provenance, pdfMetadata=pdf_metadata),
            useScope='private local import and embedding', publicHostingAllowed=False))
    manifest = dict(task='Text availability', createdAt=started, files=files,
        originalFiles=3, distinctWorks=1, newWorksAcquired=0, newDownloads=0, newOCR=0,
        note='Three already-held representations share one derivative to preserve physical page locators and deduplicate extracted bodies. Source OCR was already held; this is availability repair, not newly acquired text.')
    save(REPORT / 'acquisition-manifest.json', manifest)
    # The existing importer prioritizes held OCR ledgers over empty PDF text layers.
    # This directory truthfully records reuse of existing OCR, not an OCR operation.
    save(REPORT / 'existing-ocr-completion/acquisition-manifest.json', manifest)
    save(target / 'provenance.json', dict(derivative=derivative, originals=files,
        noOCRPerformed=True, pageMappingBasis='Same IA item; identical page count; source object filenames numbered 0000 through 0534 in physical sequence'))

    unresolved = []
    for gap in gap_rows:
        if gap['path'] == str(pdf):
            continue
        path = Path(gap['path'])
        with pymupdf.open(path) as document:
            chars = sum(len(page.get_text().strip()) for page in document)
            page_count = len(document)
        record = dict(gap, title=gap_metadata[gap['path']].get('title'), pageCount=page_count,
                      existingTextCharacters=chars, disposition='deferred-no-existing-text',
                      reason='Image-only local PDF; no usable same-edition companion found; no new OCR or download attempted')
        unresolved.append(record)
    unresolved.extend(dict(row, disposition='deferred-without-retry') for row in pending_errors)
    unresolved.extend(dict(row, disposition='deferred-no-existing-text') for row in pending if row['textAvailability'] in ('no_extractable_existing_text', 'missing_since_stocktake'))
    save(REPORT / 'unresolved-text-gaps.json', dict(items=unresolved, noRetries=True))
    # Bunyan is a diagram, not a newly acquired book. Preserve a searchable deferral.
    bunyan = next(row for row in gap_rows if Path(row['path']).name == 'bumsto.pdf')
    bunyan_meta = gap_metadata[bunyan['path']]
    save(REPORT / 'page-dispositions.json', dict(pages=[dict(sourceRelativePath=str(Path(bunyan['path']).relative_to(ROOT/'sources')),
         sourceSha256=bunyan_meta['sha256'], pdfPage=1, disposition='deferred-no-existing-text',
         basis='One-page Bunyan diagram has no existing PDF text layer and no local EPUB/text companion; image retained, no transcription inferred',
         evidence=dict(localFile=bunyan['path'], providerDetailCache=str(ROOT/'sources/bulk-catalogues/chapel-detail-bumsto.json')),
         title=bunyan_meta['title'], author=bunyan_meta['author'], countAsBook=False)]))
    declared_sword = {}
    for manifest_path in sorted(sword_manifests):
        for record in read(Path(manifest_path)).get('files', []):
            if record.get('source') == 'sword' and record.get('derivedText'):
                declared_sword[record['path']] = record['derivedText']
    sword_rows = []
    for row in sword:
        exported = SITE / '.local/library/sword' / (str(row.get('sourceId')) + '.txt')
        declared = declared_sword.get(row['path'], {})
        sword_rows.append(dict(path=row['path'], sourceId=row.get('sourceId'), publishedStatusNow=current.get(row['path']),
                              existingExport=str(exported) if exported.is_file() else None,
                              exportBytes=exported.stat().st_size if exported.is_file() else 0,
                              declaredImporterDerivative=declared.get('path'), recordedDerivativeSha256=declared.get('sha256'),
                              importerLinkReady=bool(declared.get('path') and Path(declared['path']).is_file() and Path(declared['path']).resolve()==exported.resolve()),
                              action='Reuse already held export and collection eligibility decisions; no export or source promotion performed'))
    save(REPORT / 'existing-sword-exports.json', dict(items=sword_rows))
    recovered_chars = sum(len(row['text'].strip()) for row in pages)
    summary = dict(state='complete', completedAt=datetime.now(timezone.utc).isoformat(),
        inputStocktakeAt=read(STOCK/'summary.json')['snapshotAt'], backlogFilesChecked=len(backlog),
        backlogAvailability=dict(counts), backlogExistingTextCharacters=characters,
        backlogAlreadyInPublishedSnapshot=sum(row['publishedStatusNow'] is not None for row in pending),
        sourceGapFilesChecked=3, recoveredGapWorks=1, newWorksAcquired=0, newDownloads=0, newOCR=0,
        originalRepresentationsLinked=3, derivedTextFiles=1, pageLocatorFiles=1,
        physicalPages=pdf_pages, nonemptyTranscriptionPages=sum(bool(row['text'].strip()) for row in pages),
        recoveredTextCharacters=recovered_chars, derivativeBytes=text_file.stat().st_size,
        remainingOriginalGapFiles=2, additionalBacklogGaps=len(unresolved)-2,
        swordPackagesChecked=len(sword_rows), availableSwordExports=sum(bool(row['existingExport']) for row in sword_rows),
        swordImporterLinksReady=sum(row['importerLinkReady'] for row in sword_rows),
        missingSwordImporterLinks=[row['sourceId'] for row in sword_rows if not row['importerLinkReady']],
        intakeStarted=False, embeddingStarted=False,
        paths=dict(manifest=str(REPORT/'acquisition-manifest.json'),
                   priorityManifest=str(REPORT/'existing-ocr-completion/acquisition-manifest.json'),
                   text=str(text_file), pages=str(page_file), readiness=str(REPORT/'text-ready-inputs.json'),
                   unresolved=str(REPORT/'unresolved-text-gaps.json')))
    save(REPORT / 'summary.json', summary)
    todo = ['# Deferred text TODO', '', 'No retries, new downloads, OCR, intake or embedding performed.', '']
    for row in unresolved:
        todo.append(f"- [ ] {row.get('title') or Path(row['path']).name}: {row.get('reason') or row.get('error') or row['textAvailability']} (`{row['path']}`)")
    (REPORT/'FAILED-TEXT-TODO.md').write_text('\n'.join(todo)+'\n', encoding='utf-8')
    lines = ['# Text availability reconciliation', '',
        f"**{len(backlog):,} pending candidates checked; {counts['existing_text_ready']:,} contain existing extractable text; {len(unresolved)-2} additional backlog gaps.** Existing text readiness is not a book count.", '',
        f"Recovered availability for **1 held work**, Perkins volume 3: **{recovered_chars:,} text characters**, **{pdf_pages} physical page locators**, **{summary['nonemptyTranscriptionPages']} nonempty transcription pages**. One TXT derivative plus one page JSON file; three originals share the derivative. **0 new works/downloads/OCR operations**. The source OCR text was already searchable in other held representations; this repairs the scan-only PDF connection and preserves page locators.", '',
        f"**2 original gaps remain:** Bunyan's one-page image diagram; Carson's nine-page image article. Neither has usable existing local same-edition text. The diagram is not counted as a book. No substitution from another edition or inferred transcription.", '',
        f"SWORD: **{len(sword_rows)} held packages**, **{summary['availableSwordExports']} existing exports available**. No additional exports or module promotions; existing source eligibility remains required.", '',
        'Coordinator inputs: `acquisition-manifest.json`, `existing-ocr-completion/acquisition-manifest.json`, `page-dispositions.json`, `text-ready-inputs.json`, `unresolved-text-gaps.json`, `summary.json`. The existing importer requires the established OCR-ledger priority to reuse source-provided OCR over an empty PDF layer; the priority manifest records existing OCR reuse only.', '',
        'Verified: original three source checksums match their provenance; IA object sequence 0000–0534 and PDF page count agree; the importer derivative adapter preserves all 535 page records. Existing OCR errors remain explicit. Original notices/contributors retained. No originals, catalog records, SOURCES.md, live manifests, intake code, databases, workers or schedulers changed. Intake and embedding were not started.']
    (REPORT/'REPORT.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
    save(progress, dict(state='complete', processed=len(backlog), total=len(backlog)))
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
