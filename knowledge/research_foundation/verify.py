"""Read-only validation of the private registry, plus generated Phase 1 reports."""
import json
import re
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from jsonschema import Draft202012Validator

from .build import HISTORY, OUTPUT, PROJECT, SITE, digest, write
from .contract import content_fingerprint, project_public, section_view, validate_citation


def read(path):
    return json.loads(path.read_text('utf-8-sig'))


def verify():
    failures, warnings = [], []
    summary = read(OUTPUT / 'summary.json')
    citations = read(OUTPUT / 'citations.json')
    schema = Draft202012Validator(read(SITE / 'content/research/citation.schema.json'))
    groups = read(OUTPUT / 'collection-map.json')
    group_ids = {g['id'] for g in groups}
    ids = set()
    with sqlite3.connect((OUTPUT / 'registry.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
        integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
        if integrity != 'ok':
            failures.append('SQLite integrity: ' + integrity)
        for table in ('entities', 'resources'):
            ids.update(r[0] for r in db.execute(f'SELECT id FROM {table}'))
        dangling = db.execute('''SELECT COUNT(*) FROM relations r
            LEFT JOIN entities e1 ON e1.id=r.source_id LEFT JOIN resources f1 ON f1.id=r.source_id
            LEFT JOIN entities e2 ON e2.id=r.target_id LEFT JOIN resources f2 ON f2.id=r.target_id
            WHERE (e1.id IS NULL AND f1.id IS NULL) OR (e2.id IS NULL AND f2.id IS NULL)''').fetchone()[0]
        if dangling:
            failures.append(f'{dangling} dangling relations')
        namespaces = dict(db.execute('SELECT namespace,COUNT(*) FROM entities GROUP BY namespace'))
        if db.execute('SELECT COUNT(*) FROM resources').fetchone()[0] != summary['resourceRecords']:
            failures.append('Resource summary mismatch')
        for (group,) in db.execute('SELECT DISTINCT group_id FROM resources'):
            if group not in group_ids:
                failures.append('Unmapped collection: ' + group)
        invalid_original_ids = 0
        for ident, namespace, original in db.execute("SELECT id,namespace,original_id FROM entities WHERE namespace LIKE 'library:%'"):
            if ident != namespace + ':' + original:
                invalid_original_ids += 1
        if invalid_original_ids:
            failures.append('Original canonical IDs changed')
        missing = [json.loads(r[0]) for r in db.execute("SELECT record FROM resources WHERE availability != 'held'")]
        languages = Counter()
        held = Counter()
        byte_counts = Counter()
        for group, availability, record in db.execute('SELECT group_id,availability,record FROM resources'):
            row = json.loads(record)
            if availability == 'held':
                held[group] += 1
                byte_counts[group] += row['bytes']
            if row['metadata'].get('language'):
                languages[str(row['metadata']['language'])] += 1
        record_count = db.execute('SELECT COUNT(*) FROM entities').fetchone()[0]
        reconciled_links = db.execute("SELECT COUNT(*) FROM relations WHERE json_extract(record,'$.status') LIKE 'ai-assisted record reconciliation%'").fetchone()[0]
        queue_type_counts = Counter()
        for line in (OUTPUT / 'identity-queue.jsonl').open(encoding='utf8'):
            row = json.loads(line)
            if row['id'] not in ids:
                failures.append('Queue references unknown resource: ' + row['id'])
            queue_type_counts.update(row['missing'])
        if dict(queue_type_counts) != summary['metadataGapCounts']:
            failures.append('Metadata queue summary differs from actual queue')

    for group in groups:
        route = group['destinations']
        sections = [route['primary'], *route['secondary']]
        if len(set(sections)) != len(sections) or not set(sections) <= {'scholars', 'apologetics', 'studies'}:
            failures.append('Invalid destination: ' + group['id'])
        if 'readiness' not in group:
            failures.append('Missing collection readiness: ' + group['id'])

    literal_count = 0
    for citation in citations:
        schema.validate(citation)
        validate_citation(citation)
        for field in ('claimId', 'sourceId'):
            if citation[field] not in ids:
                failures.append('Dangling citation: ' + citation['id'])
        for section in ('scholars', 'apologetics', 'studies'):
            if section_view(citation, section)['citation'] != citation:
                failures.append('Citation round trip changed content: ' + citation['id'])
        private = citation['private']
        for path_key, hash_key in (('sourcePath', 'sourceSha256'), ('extractedPath', 'extractedSha256')):
            if private.get(path_key) and private.get(hash_key):
                if digest(Path(private[path_key])) != private[hash_key]:
                    failures.append('Changed citation file: ' + citation['id'])
        if citation['review']['literalMatch']:
            text = re.sub(r'\s+', ' ', Path(private['extractedPath']).read_text('utf8', errors='replace')).strip()
            if citation['quote'] not in text:
                failures.append('Quotation no longer matches: ' + citation['id'])
            literal_count += 1
        if citation['review']['state'] == 'reviewed-limited' and citation['review']['contentFingerprint'] != content_fingerprint(citation):
            failures.append('Stale citation fingerprint: ' + citation['id'])
        if project_public(citation) is not None:
            failures.append('Unselected private citation entered public export')

    evidence = read(HISTORY / 'evidence-index.json')['entries']
    current_reviews = read(HISTORY / 'evidence-review-status.json')
    review_queue = []
    pilot = {'BA-003': 'Israel and Judah', 'BA-005': 'Israel and Judah', 'BA-011': 'Israel and Judah',
             'BA-015': 'Hezekiah and Assyria', 'BA-018': 'Israel and Judah', 'BA-088': 'Dead Sea Scrolls',
             'BA-089': 'Dead Sea Scrolls', 'BA-090': 'Manuscript comparisons', 'BA-094': 'Manuscript comparisons',
             'BA-095': 'Manuscript comparisons', 'BA-096': 'Manuscript comparisons', 'BA-097': 'Documentary papyri'}
    for gap in current_reviews['remaining_quote_alignment_gaps']:
        review_queue.append(gap | {'priority': 'pilot dependency' if gap['id'] in pilot else 'later corpus batch',
                                  'pilotPackage': pilot.get(gap['id']), 'nextAction': 'Locate/inspect the named edition, select an exact relevant passage and reassess the narrowly stated claim'})
    review_queue.sort(key=lambda r: (r['priority'] != 'pilot dependency', r['id']))
    pending_ba = {c['claimId'].split(':')[-1] for c in citations if c['claimId'].startswith('evidence:BA-') and c['review']['state'] != 'reviewed-limited'}
    source_queue = {r['id'] for r in current_reviews['remaining_quote_alignment_gaps']}
    if pending_ba != source_queue:
        failures.append('Archaeology queue changed during contract conversion: ' + str(sorted(pending_ba ^ source_queue)))
    changes = []
    snapshots = read(OUTPUT / 'input-snapshots.json')
    catalog_inputs = 0
    for row in snapshots:
        path = Path(row['path'])
        if path.is_relative_to(SITE / 'content/library/catalog'):
            catalog_inputs += 1
        stat = path.stat() if path.exists() else None
        if not stat or stat.st_size != row['bytes'] or (row.get('mtimeNs') and stat.st_mtime_ns != row['mtimeNs']):
            changes.append({'path': str(path), 'status': 'changed after it was read; this report is a timestamped inventory snapshot'})
    canonical_records = sum(v for k, v in namespaces.items() if k.startswith('library:') and k != 'library:author')
    if canonical_records != catalog_inputs:
        failures.append('Catalog identity preservation count differs from captured inputs')
    warnings.extend(changes)
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'passed': not failures, 'failures': failures,
              'sqliteIntegrity': integrity, 'sourceGroups': len(groups), 'entityRecords': record_count,
              'canonicalCatalogRecordsPreserved': canonical_records, 'canonicalContributorsPreserved': namespaces.get('library:author'),
              'reconciledRecordLinks': reconciled_links, 'danglingRelations': dangling, 'citationsValidated': len(citations),
              'literalQuotationsRechecked': literal_count, 'sectionRoundTrips': len(citations) * 3,
              'unselectedPublicCitations': 0, 'archaeologyGapsPreserved': len(review_queue),
              'inputSnapshots': len(snapshots), 'inputsChangedAfterRead': warnings,
              'verificationLimits': ['Bulk file hashes are recorded observations, not a fresh byte-by-byte integrity audit.',
                                     'Citation files were rehashed and literal quotations rechecked; alignment review is imported AI-assisted work.',
                                     'The actively growing library is not frozen. Counts describe this scan interval, not a transaction across every collector.',
                                     'No main semantic-index, browser-rendering or public-site readiness claim is made.']}
    write(OUTPUT / 'verification.json', report)
    write(OUTPUT / 'archaeology-review-queue.json', review_queue)
    write(OUTPUT / 'availability-exceptions.json', [{'id': r['id'], 'path': r['path'], 'group': r['group'], 'availability': r['availability'],
           'nextAction': 'Preserve original record; inspect duplicate audit and acquisition ledger for an alternate representation'} for r in missing])
    if failures:
        raise RuntimeError(json.dumps(failures))
    render_report(summary, report, groups, review_queue)
    print(json.dumps(report, indent=2))


def render_report(summary, verification, groups, review_queue):
    by_id = {g['id']: g for g in groups}
    religions = [g for g in groups if g['id'].startswith('religion:')]
    history = [g for g in groups if g['id'].startswith('history:')]
    text = [
        '# Phase 1 — collection and research foundation', '',
        '**M01, M02 and M03 complete.** This is the private data foundation for Scholars, Apologetics and Studies. Phase 2 page prototypes and public release remain separate work.', '',
        f"Inventory scan: {summary['startedAt']} to {summary['completedAt']}. Validation: {verification['checkedAt']}.", '',
        '## What is ready', '',
        f"- **{summary['sourceGroups']:,} collection groups** have destination, source role, availability and readiness records.",
        f"- **{summary['resourceRecords']:,} file records**, of which **{summary['availability'].get('held',0):,}** were present and nonempty at inspection. These include staged copies, fragments, editions, archives and supporting files; they are not a book count.",
        f"- **{verification['canonicalCatalogRecordsPreserved']:,} existing catalogue records** and **{verification['canonicalContributorsPreserved']} contributor IDs** preserved. The catalogue separates works, editions, assets, series and acquisition runs.",
        f"- **{summary['duplicateRecordedByteGroups']:,} groups with matching recorded bytes** have a disposition: retain provenance and all canonical identities; no originals deleted and no editions merged merely by title or checksum.",
        f"- **{verification['reconciledRecordLinks']} explicit cross-section identity/context links** reconciled, alongside the existing catalogue and citation relationships.",
        f"- **{verification['citationsValidated']} historical evidence citations** validated; **{verification['literalQuotationsRechecked']} exact excerpts** rechecked against held text and **{verification['sectionRoundTrips']} lossless section round trips** passed.",
        '- Private source files and the main semantic database remain in their existing locations. No new page or full text was published.', '',
        '## Where the collection goes', '',
        '| Section | Primary responsibility | Shared links |',
        '|---|---|---|',
        '| Scholars | People, works, named editions, corpora and attribution | Evidence cases and passage-led teaching |',
        '| Apologetics | Historical/scientific premises, objections, alternatives and bounded conclusions | Exact sources, contributors and related theology |',
        '| Studies | Scripture, interpretation, doctrine and application | Contextual evidence and clearly attributed scholarship |', '',
        'All collection assignments are in [collection-map.json](../KnowledgeBase/Research%20Foundation/collection-map.json). They are candidate uses, not a claim that each record is ready for all three sections.', '',
        '### Held historical collections', '',
        '| Collection | File records | Primary destination |', '|---|---:|---|'
    ]
    for g in history:
        text.append(f"| {g['label']} | {g['counts'].get('resourceRecords',0):,} | {g['destinations']['primary'].title()} |")
    text += ['', 'The existing historical search selects 92,926 documents and 258,692 passages. Its selected documents are distinct from stored archives, source snapshots, extracted editions and extra copies. Archaeological cards are editorial assessments; they are not new ancient witnesses.', '',
             '### Religious texts and preaching', '', '| Collection | Held file records | Main use |', '|---|---:|---|']
    for g in religions:
        text.append(f"| {g['label']} | {g['counts'].get('held',0):,} | Apologetics, with edition-aware comparative references |")
    text += [f"| Billy Graham | {by_id['sermons:billy-graham']['counts'].get('held',0):,} | Studies: 30 transcript entries, two representations each |", '',
             'The seven religion folders remain under the requested `False Religions` directory. Source traditions and translations remain explicit; none becomes a Christian teaching authority. The Islam dossier retains 698 claims, 522 source endpoints and 966 original citation observations. A URL is not an independent witness. The 30 Graham entries are the held full-published-text transcript collection; snippets and catalogue listings are excluded from that total.', '',
             '## Identity and evidence rules', '',
             'Existing work, edition, asset, author, BA, BH and section IDs are retained in their original namespaces. Persistent resource UUIDs describe held files. ORACC project/document references, papyrological references and Gutenberg identifiers are retained when supplied. Same title, same author label, same URL or same bytes alone never collapses two editions. Joint-person entries remain joint; corpus documents and fragments remain documents/fragments.', '',
             'The citation contract keeps the actual claim, source role, exact quote and locator, competing interpretations, uncertainty, distinct date roles, review scope and separate metadata/quotation/full-text permissions. A quotation requires an identified edition, a current review and explicit quotation permission before public projection. Unknown or conditional permission is not treated as allowed. Review fingerprints include the claim, citation and source hashes. The three demonstration records are Hezekiah, disputed Jericho chronology and Josephus on James; all three preserve the same citation in Scholars, Apologetics and Studies.', '',
             'Phase 1 imports earlier limited alignment reviews as AI-assisted reviews. It does not invent human acceptance or independently authenticate ancient texts. Some current snippets still need cleaner selection and more precise locators before reader-facing use. The 155 citation records remain drafts; no public export is selected.', '',
             '## Gaps retained for the next phase', '',
             f"- **{len(review_queue)} archaeology quotation/alignment gaps** remain: 13 candidate excerpts and 28 without a selected exact excerpt. The queue is prioritized by pilot dependency.",
             '- **91 modern source-publication dates** remain unknown. Object/work dates, discovery dates and modern edition dates have separate fields; missing dates stay null.',
             f"- **{summary['availability'].get('missing-recorded-path',0)} recorded paths are missing** and **{summary['availability'].get('empty-file',0)} are empty**. These are record-level exceptions, not a count of irrecoverable works. The seven known empty cuneiform attempts retain acquired alternates in the historical collection.",
             '- The older evidence-index header still says 140 pending; the foundation uses the current entry-level reviews and independently checks the 41-gap queue.',
             '- Bulk acquired files without canonical edition identities have explicit queue records. Metadata gaps do not mean their text is missing. Established catalogue records and staged source copies remain distinct.',
             '- Dedicated science-methods and cosmology acquisition/review remains necessary. Existing maps, imagery and theological discussions do not substitute for scientific datasets.', '',
             '| Metadata task | File records affected (overlapping) |', '|---|---:|---|']
    for name, count in summary['metadataGapCounts'].items():
        text.append(f'| {name} | {count:,} |')
    text += ['', '## Verification and next handoff', '',
             f"SQLite integrity: **{verification['sqliteIntegrity']}**. Dangling retained relations: **{verification['danglingRelations']}**. All canonical records read into this snapshot retained their IDs. Twelve automated tests cover identity stability, edition separation, citation integrity, stale reviews and public-export boundaries. The full registry verification passed.", '',
             f"Inputs changed after being read: **{len(verification['inputsChangedAfterRead'])}**. These are recorded in the verification report because other collectors can continue working. Bulk checksums are retained from source ledgers; only the selected citation files were freshly rehashed during this phase.", '',
             '**Next: Phase 2 / M04.** Build the shared templates and three complete reader-facing examples: a historical case, a manuscript case and a Scripture-led theological lesson. Use the existing design decisions. Catalogue and source review can be completed for the selected examples without first resolving unrelated bulk metadata gaps. Preserve the existing 25 Apologetics study IDs, URLs and saved-note references until the planned migration is implemented and tested.', '',
             '## Files and commands', '',
             '- [Registry](../KnowledgeBase/Research%20Foundation/registry.sqlite3), [collection map](../KnowledgeBase/Research%20Foundation/collection-map.json), [summary](../KnowledgeBase/Research%20Foundation/summary.json).',
             '- [Identity crosswalk](../KnowledgeBase/Research%20Foundation/identity-crosswalk.jsonl), [identity queue](../KnowledgeBase/Research%20Foundation/identity-queue.jsonl), [duplicate audit](../KnowledgeBase/Research%20Foundation/duplicate-audit.json).',
             '- [Citations](../KnowledgeBase/Research%20Foundation/citations.json), [three section examples](../KnowledgeBase/Research%20Foundation/private-roundtrip-examples.json), [archaeology queue](../KnowledgeBase/Research%20Foundation/archaeology-review-queue.json).',
             '- [Validation](../KnowledgeBase/Research%20Foundation/verification.json), [availability exceptions](../KnowledgeBase/Research%20Foundation/availability-exceptions.json), [other unresolved observations](../KnowledgeBase/Research%20Foundation/unresolved.json).',
             '- [Implementation and operating guide](../Website/knowledge/research_foundation/README.md), [shared schema](../Website/content/research/citation.schema.json), [master plan](KNOWLEDGE-INTEGRATION-MASTER-PLAN.md).', '',
             'Run from `Website/`:', '', '```powershell',
             'D:/Python/python.exe -X utf8 -m knowledge.research_foundation.build',
             'D:/Python/python.exe -X utf8 -m unittest knowledge.research_foundation.test_foundation -v',
             'D:/Python/python.exe -X utf8 -m knowledge.research_foundation.verify', '```', '']
    (PROJECT / 'Research/KNOWLEDGE-INTEGRATION-PHASE-1.md').write_text('\n'.join(text), encoding='utf8')


if __name__ == '__main__':
    verify()
