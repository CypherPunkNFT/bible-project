"""Private campaign handoff checks and reporting; never writes corpus or vectors."""
import argparse
import hashlib
import json
import os
import sqlite3
from collections import Counter
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from .settings import load, write_json

ARCHIVED_NAMES = ('deaconessesinchu0000grif.txt', 'historicdiscours00grif.txt', 'historyoffirstba01grif.txt')


def read(path, default=None):
    return json.loads(path.read_text('utf-8-sig')) if path.exists() else default


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def locations(config):
    return config['state_dir'] / 'campaign-coordination', config['site_dir'] / 'content/library/reports/campaign-reconciliation'


def metadata_matches(hint, row, field, records):
    if field in ('workId', 'editionId') and row.get(field) and records.get(row[field], {}).get('kind') != field[:-2]:
        return not hint.get(field) and hint.get('legacyCatalogueIds', {}).get(field) == row[field]
    return hint.get(field) == row[field]


def archive_moves(config):
    """Only these three exact, manifest-excluded moves may authorize removal."""
    out, reports = locations(config)
    project = config['state_dir'].parent
    manifest_path = reports.parent / 'reformed-baptist-overnight/RB05/acquisition-manifest.json'
    entries = read(manifest_path)['files']
    original_dir = config['sources_dir'] / 'library/bulk/ia'
    archive_dir = project / 'ARCHIVE/RB05-excluded-author'
    allowed = {str((original_dir / name).resolve()): (archive_dir / name).resolve() for name in ARCHIVED_NAMES}
    with closing(sqlite3.connect(config['db'].as_uri() + '?mode=ro', uri=True)) as db:
        recorded = dict(db.execute('SELECT path,sha256 FROM files'))
        library = dict(db.execute('SELECT path,sha256 FROM library_files'))
        missing = {p for p in recorded if not Path(p).is_file()}
        missing.update(p for p in library if not Path(p).is_file())
        unexpected = sorted(missing - allowed.keys())
        proofs = []
        for original in sorted(missing & allowed.keys()):
            archived = allowed[original]
            matches = [row for row in entries if row.get('path') and Path(row['path']).resolve() == archived and row.get('disposition') == 'excluded-author']
            if len(matches) != 1 or not archived.is_file() or not archived.is_relative_to(archive_dir.resolve()):
                raise ValueError(f'Unproven excluded-author archive move: {original}')
            hashes = {recorded.get(original), library.get(original), matches[0].get('sha256'), digest(archived)}
            if None in hashes or len(hashes) != 1:
                raise ValueError(f'Old inventory / manifest / archive checksum mismatch: {original}')
            proofs.append(dict(originalPath=original, archivedPath=str(archived), sha256=hashes.pop(),
                               disposition='excluded-author', manifest=str(manifest_path), originalAbsent=True,
                               publishedInventoryMatched=True, archiveBytesMatched=True))
        result = dict(checkedAt=datetime.now(timezone.utc).isoformat(), approvedMoves=proofs,
                      unexplainedMissingInputs=unexpected, rebuildAllowed=not unexpected)
        # Preserve the exact before-rebuild proof when a later snapshot has no missing paths.
        write_json(out / ('archive-moves.json' if proofs or unexpected else 'archive-moves-after.json'), result)
        if unexpected:
            raise ValueError(f'{len(unexpected)} unexplained missing inputs; inspect campaign-coordination/archive-moves.json')
        return result


def prepare(config):
    from .library import plan_library
    out, reports = locations(config)
    summaries = {name: read(reports / name / 'summary.json') for name in ('catalogue', 'sources', 'text')}
    if summaries['catalogue']['validationErrors'] or summaries['sources']['status'] != 'complete' or summaries['text']['state'] != 'complete':
        raise ValueError('Preparation handoffs are incomplete or invalid')
    records, provenance, hints, derivatives, files = plan_library(config)
    overlay = read(reports / 'catalogue/acquisition-manifest.json')['files']
    conflicts, legacy = [], []
    canonical_variants = 0
    for row in overlay:
        hint = hints[str(Path(row['path']).resolve())]
        for field in ('title', 'author', 'licence', 'sha256', 'workId', 'editionId', 'contributor', 'credit'):
            if row.get(field) is not None and not metadata_matches(hint, row, field, records):
                conflicts.append(dict(path=row['path'], field=field))
        for field in ('workId', 'editionId'):
            if row.get(field) and row[field] not in records:
                if '-reconciled-' in row[field]:
                    conflicts.append(dict(path=row['path'], field=field, reason='unregistered reconciled identity'))
                else:
                    legacy.append(dict(path=row['path'], field=field, identifier=row[field], disposition='retained source identity; not a registered catalogue reference'))
        asset = hint.get('catalog', {})
        edition = records.get(asset.get('editionId') or hint.get('editionId'), {})
        work = records.get(edition.get('workId') or hint.get('workId'), {})
        if work.get('title') and ' '.join(work['title'].split()) != ' '.join(row.get('title', '').split()):
            canonical_variants += 1
    text_rows = read(reports / 'text/existing-ocr-completion/acquisition-manifest.json')['files']
    for row in text_rows:
        selected = derivatives.get(str(Path(row['path']).resolve()), {})
        for field in ('path', 'sha256', 'pageText', 'pageTextSha256'):
            if selected.get(field) != row['derivedText'].get(field):
                conflicts.append(dict(path=row['path'], field='derivative.' + field))
        if selected.get('priority', 0) < 10:
            conflicts.append(dict(path=row['path'], field='derivative priority'))
    bunyan = next(r for r in read(reports / 'text/unresolved-text-gaps.json')['items'] if Path(r['path']).name == 'bumsto.pdf')
    if not any(r.get('disposition', '').startswith('deferred') for r in hints[bunyan['path']].get('page_dispositions', [])):
        conflicts.append(dict(path=bunyan['path'], field='explicit text deferral'))
    inputs = [reports / 'catalogue/acquisition-manifest.json', reports / 'catalogue/validation.json',
              reports / 'sources/source-documentation.json', config['site_dir'] / 'SOURCES.md',
              reports / 'text/acquisition-manifest.json', reports / 'text/existing-ocr-completion/acquisition-manifest.json',
              reports / 'text/page-dispositions.json', reports / 'text/unresolved-text-gaps.json']
    identity = {k: config['embedding'][k] for k in ('model', 'revision', 'dimensions', 'max_tokens')}
    if read(config['state_dir'] / 'embedding-model.json') != identity:
        raise ValueError('Existing vector model identity differs from configuration')
    write_json(out / 'legacy-catalogue-identities.json', {'items': legacy, 'newImportHolds': 0})
    result = dict(checkedAt=datetime.now(timezone.utc).isoformat(), mode='read-only plan; no corpus/vector writes',
                  overlayEntries=len(overlay), metadataConflicts=conflicts, canonicalWorkTitleVariants=canonical_variants,
                  legacyIdentityRepresentations=len(legacy), distinctLegacyIdentities=len({r['identifier'] for r in legacy}),
                  recoveredOriginalLinks=len(text_rows), selectedDerivativeLinks=len(derivatives),
                  heldFilesInPlan=len(files), catalogueKinds=dict(Counter(r.get('kind') for r in records.values())),
                  preparation=summaries, modelIdentity=identity,
                  inputs=[dict(path=str(p), sha256=digest(p), inLibraryPlan=p in provenance) for p in inputs])
    write_json(out / 'intake-plan.json', result)
    if conflicts:
        raise ValueError(f'{len(conflicts)} intake plan conflicts; inspect campaign-coordination/intake-plan.json')
    return result


def final_handoffs(config):
    """Require actual publication of overlays, recovered links and explicit deferrals."""
    out, reports = locations(config)
    plan = read(out / 'intake-plan.json')
    conflicts = []
    for entry in plan['inputs']:
        if digest(Path(entry['path'])) != entry['sha256']:
            conflicts.append(dict(path=entry['path'], reason='preparation input changed; recheck plan'))
    with closing(sqlite3.connect(config['db'].as_uri() + '?mode=ro', uri=True)) as db:
        records = {id: {'kind': kind} for id, kind in db.execute('SELECT id,kind FROM library_records')}
        for entry in plan['inputs']:
            published = db.execute('SELECT sha256 FROM files WHERE path=?', (entry['path'],)).fetchone()
            if not published or published[0] != entry['sha256']:
                conflicts.append(dict(path=entry['path'], reason='preparation ledger/documentation not in published inventory'))
        for row in read(reports / 'catalogue/acquisition-manifest.json')['files']:
            published = db.execute('SELECT sha256,metadata FROM library_files WHERE path=?', (row['path'],)).fetchone()
            if not published or published[0] != row['sha256']:
                conflicts.append(dict(path=row['path'], reason='original absent or changed in published snapshot'))
                continue
            hint = json.loads(published[1])['acquisition']
            for field in ('title', 'author', 'licence', 'sha256', 'workId', 'editionId', 'contributor', 'credit'):
                if row.get(field) is not None and not metadata_matches(hint, row, field, records):
                    conflicts.append(dict(path=row['path'], field=field))
        for row in read(reports / 'text/existing-ocr-completion/acquisition-manifest.json')['files']:
            published = db.execute('SELECT status,metadata,document_id FROM library_files WHERE path=?', (row['path'],)).fetchone()
            metadata = json.loads(published[1]) if published else {}
            selected = metadata.get('derivative') or {}
            if published and published[0] == 'duplicate' and not selected and published[2]:
                canonical = db.execute('SELECT metadata FROM documents WHERE id=?', (published[2],)).fetchone()
                selected = (json.loads(canonical[0]).get('derivative') or {}) if canonical else {}
            if not published or published[0] not in ('indexed', 'duplicate') or any(selected.get(k) != row['derivedText'].get(k) for k in ('path', 'sha256', 'pageText', 'pageTextSha256')):
                conflicts.append(dict(path=row['path'], reason='recovered text link not published'))
        expected = {r['path'] for r in read(reports / 'text/unresolved-text-gaps.json')['items']}
        gaps = [dict(path=p, status=s) for p, s in db.execute("SELECT path,status FROM library_files WHERE status IN ('error','unsupported','no_text','deferred_scan')")]
        if {r['path'] for r in gaps} != expected or any(r['status'] != 'deferred_scan' for r in gaps):
            conflicts.append(dict(reason='unexpected extraction gaps', gaps=gaps))
        for name in ARCHIVED_NAMES:
            path = str((config['sources_dir'] / 'library/bulk/ia' / name).resolve())
            if db.execute('SELECT 1 FROM library_files WHERE path=?', (path,)).fetchone():
                conflicts.append(dict(path=path, reason='excluded body remains in published inventory'))
        for move in read(out / 'archive-moves.json', {}).get('approvedMoves', []):
            if db.execute('SELECT 1 FROM documents WHERE id=?', ('library:text:' + move['sha256'],)).fetchone():
                conflicts.append(dict(path=move['originalPath'], reason='excluded text document remains searchable'))
    result = dict(checkedAt=datetime.now(timezone.utc).isoformat(), preparationPublished=not conflicts,
                  conflicts=conflicts, explicitTextDeferrals=gaps)
    write_json(out / 'published-handoffs.json', result)
    if conflicts:
        raise ValueError(f'{len(conflicts)} unpublished/conflicting preparation outputs; inspect published-handoffs.json')
    return result


def report(config):
    out, reports = locations(config)
    progress = read(config['state_dir'] / 'embedding-progress.json', {})
    completion = read(config['state_dir'] / 'intake-completion.json', {})
    queue = read(config['state_dir'] / 'bulk-queue.json', {})
    stock = read(config['state_dir'] / 'campaign-stocktake/summary.json', {})
    plan = read(out / 'intake-plan.json', {})
    handoffs = read(out / 'published-handoffs.json', {})
    verification = completion.get('verification', {})
    queue_done = queue.get('state') in ('complete', 'downloads_finished_intake_processing', 'intake_needs_attention')
    complete = bool(completion.get('state') == 'complete' and verification.get('complete') and verification.get('enrichment_ready')
                    and handoffs.get('preparationPublished') and queue_done and progress.get('state') == 'complete'
                    and progress.get('corpus_build') == verification.get('corpus_build'))
    summary = dict(updatedAt=datetime.now(timezone.utc).isoformat(), state='verified_complete' if complete else 'pending',
                   embedding=progress, completion=completion, acquisitionQueue=queue, stocktake=stock,
                   intakePlan={k:v for k,v in plan.items() if k not in ('preparation', 'inputs')},
                   publishedHandoffs=handoffs, monitorPid=os.environ.get('BIBLE_CAMPAIGN_MONITOR_PID'),
                   enrichmentStarted=False, publicOriginalsPublished=False)
    if progress.get('state') == 'running' and progress.get('rate_per_second', 0) > 0:
        seconds = progress.get('remaining', 0) / progress['rate_per_second']
        summary['currentPassETA'] = dict(hoursRemaining=round(seconds / 3600, 1),
            estimatedCompletionUTC=(datetime.now(timezone.utc) + timedelta(seconds=seconds)).isoformat(),
            scope='Current embedding pass only; final refresh and later acquisitions are additional')
    write_json(out / 'summary.json', summary)
    catalogue = plan.get('preparation', {}).get('catalogue', {})
    sources = plan.get('preparation', {}).get('sources', {})
    intake = read(config['state_dir'] / 'library-intake-progress.json', {})
    before = read(out / 'embedding-before.json', {})
    failures = []
    for path in sorted(reports.parent.rglob('*failed-downloads.json')):
        ledger = read(path, {})
        entries = ledger.get('items', ledger.get('failures', [])) if isinstance(ledger, dict) else ledger
        failures.append(dict(path=str(path), entries=len(entries) if isinstance(entries, list) else 0))
    write_json(out / 'download-failure-ledgers.json', {'ledgers': failures, 'historicalEntries': sum(r['entries'] for r in failures), 'automaticDownloadRetries': False})
    lines = ['# Campaign intake and embedding coordination', '',
             f"**{'VERIFIED COMPLETE' if complete else 'PENDING — passage/vector parity has not been verified for the final corpus'}**. Updated {summary['updatedAt']}.", '',
             f"Passages: {progress.get('total', 0):,}; saved vectors (worker progress): {progress.get('indexed', 0):,}; remaining: {progress.get('remaining', 0):,}. Before coordination: {before.get('total', 0):,} passages / {before.get('indexed', 0):,} vectors. Worker state: {progress.get('state')}; corpus: {progress.get('corpus_build')}.", '',
             f"Current-pass estimate at the observed rate: {summary.get('currentPassETA', {}).get('hoursRemaining', 'unavailable')} hours. Final refresh and later acquisitions add work; this is not a campaign-completion ETA.", '',
             f"Held library snapshot {stock.get('snapshotAt')}: {stock.get('libraryFiles', 0):,} files, {stock.get('GB', 0)} GB; {stock.get('unpublishedBodyCandidates', 0):,} pending body candidates. Includes support files and representations, not a book count.", '',
             f"Published intake classifications: {json.dumps(intake.get('statuses', {}), sort_keys=True)}. Plan catalogue records by kind: {json.dumps(plan.get('catalogueKinds', {}), sort_keys=True)}.", '',
             f"Catalogue preparation scope: {catalogue.get('bodyFilesConsidered', 0):,} body representations; {catalogue.get('representations', {}).get('original', 0):,} classified original representations and {catalogue.get('representations', {}).get('duplicate-original', 0)} duplicate originals. Sermons/articles/chapters and derivatives are not counted as distinct books.", '',
             f"Reconciliation: {catalogue.get('filesImproved', 0):,} originals improved; {catalogue.get('duplicateHashGroups', 0)} duplicate original groups; 61 source profiles; 5,033 pending files confirmed text-bearing; 1 recovered work / 3 original links / 535 page locators. Final overlay conflicts: {len(plan.get('metadataConflicts', []))}. Canonical-work/resource title variants retained: {plan.get('canonicalWorkTitleVariants', 0)}.", '',
             f"Unresolved: {catalogue.get('unresolvedMetadataFiles', 0)} required-metadata files; {catalogue.get('newAuthorIdentitiesNeeded', 0):,} unmatched author-label variants; {catalogue.get('newSourceIdentitiesNeeded', 0)} source labels/aliases; {sources.get('unresolvedSourceEvidence', 0)} source-evidence gaps; 2 explicit image-only text deferrals. No new rights/evidenceOnly holds, OCR, enrichment or publication.", '',
             f"Legacy source work IDs: {plan.get('distinctLegacyIdentities', 0):,} unregistered identifiers across {plan.get('legacyIdentityRepresentations', 0):,} representations, retained as source metadata rather than dangling catalogue links. These do not prevent private text indexing; authority registration remains pending.", '',
             'Three excluded-author archive moves are checksum-proven in archive-moves.json; the rebuild must remove their bodies. Valid saved vectors and model identity are reused; obsolete passages alone are pruned by the existing content-addressed pipeline.', '',
             f"Completion pipeline: {completion.get('state')}; queue: {queue.get('phase')} / {queue.get('state')}; queue failures: {len(queue.get('failures', []))}. Historical failed-download ledger entries: {sum(r['entries'] for r in failures):,} across {len(failures)} ledgers (may overlap; not unique works). Error: {completion.get('error', 'none')}. Monitor PID: {summary['monitorPid']}.", '',
             'Next: let the current embedding pass finish, wait for acquisition phases to settle, prove missing-input disposition, refresh once, embed only absent passage IDs, and verify parity plus published handoffs. Unknown missing inputs or extraction errors stop completion. Hard download failures remain in the existing TODO ledgers without retries.', '',
             'Runtime outputs here: intake-plan.json, archive-moves.json, published-handoffs.json (after final intake), monitor-state.json, summary.json and this live REPORT.md. Preparation outputs remain under Website/content/library/reports/campaign-reconciliation/{catalogue,sources,text}/. The monitor owns no vector writer.']
    (out / 'REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return {'state': summary['state'], 'passages': progress.get('total'), 'vectors': progress.get('indexed'), 'remaining': progress.get('remaining')}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=('archives', 'prepare', 'final', 'report'))
    args = parser.parse_args()
    config = load()
    result = {'archives': archive_moves, 'prepare': prepare, 'final': final_handoffs, 'report': report}[args.action](config)
    print(json.dumps({k:v for k,v in result.items() if k not in ('preparation', 'inputs', 'metadataConflicts')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
