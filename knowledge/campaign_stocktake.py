"""Reconcile held files, acquisition manifests and published intake without rehashing originals."""
import json
import os
import sqlite3
import sys
from collections import Counter, defaultdict
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json


def objects(value, inherited=None):
    if isinstance(value, dict):
        combined = (inherited or {}) | value
        yield combined
        context = {key: combined[key] for key in ('title', 'author', 'source', 'licence', 'language', 'audience', 'contributor', 'credit') if key in combined}
        for item in value.values():
            yield from objects(item, context)
    elif isinstance(value, list):
        for item in value:
            yield from objects(item, inherited)


def safe_path(config, value):
    if not isinstance(value, str) or not value:
        return None
    path = Path(value)
    if not path.is_absolute():
        path = (config['sources_dir'] if value.replace('\\', '/').startswith('library/') else config['site_dir']) / path
    path = path.resolve()
    return path if path.is_relative_to((config['sources_dir'] / 'library').resolve()) else None


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def main():
    config = load()
    state = config['state_dir']
    output = state / 'campaign-stocktake'
    output.mkdir(exist_ok=True)
    root = config['sources_dir'] / 'library'
    published = {}
    with closing(sqlite3.connect(config['db'].as_uri() + '?mode=ro', uri=True, timeout=10)) as db:
        for path, checksum, status, document_id, detail, metadata in db.execute('SELECT * FROM library_files'):
            meta = json.loads(metadata)
            hint = meta.get('acquisition', {})
            asset, work, edition = meta.get('asset', {}), meta.get('work', {}), meta.get('edition', {})
            published[str(Path(path).resolve())] = dict(path=path, sha256=checksum,
                publishedStatus=status, documentId=document_id, detail=detail,
                title=work.get('title') or hint.get('title'),
                author=hint.get('author') or work.get('creators'),
                source=hint.get('source') or asset.get('sourceId'),
                sourceId=hint.get('sourceId') or hint.get('tcpId'),
                url=hint.get('url') or hint.get('finalUrl') or asset.get('canonicalUrl'),
                licence=hint.get('licence') or asset.get('rights'),
                language=hint.get('language') or edition.get('languages'),
                audience=hint.get('audience') or hint.get('audiences') or work.get('audiences'),
                format=hint.get('format') or asset.get('format'),
                contributor=hint.get('contributor'), credit=hint.get('credit'),
                assetId=asset.get('id') or hint.get('assetId'), workId=work.get('id') or hint.get('workId'),
                manifests=hint.get('manifests', []))
    manifests = sorted((SITE / 'content/library/reports').rglob('*manifest*.json'))
    overlay = SITE / 'content/library/reports/campaign-reconciliation/catalogue/acquisition-manifest.json'
    manifests.sort(key=lambda path: (path == overlay, str(path)))
    manifest_errors, manifest_rows, hints = [], 0, {}
    for manifest in manifests:
        try:
            data = read(manifest)
        except (OSError, ValueError) as exc:
            manifest_errors.append(dict(path=str(manifest), error=str(exc)))
            continue
        for row in objects(data):
            if not row.get('sha256'):
                continue
            path = safe_path(config, row.get('relativePath') or row.get('path') or row.get('sourceRelativePath'))
            if not path or not path.is_relative_to(root):
                continue
            manifest_rows += 1
            item = hints.setdefault(str(path), {'manifests': []})
            item['manifests'].append(str(manifest))
            for key in ('sha256', 'title', 'author', 'source', 'sourceId', 'url', 'licence', 'language',
                        'audience', 'audiences', 'format', 'contributor', 'credit', 'campaignMission', 'countAsBook'):
                if row.get(key) is not None:
                    item[key] = row[key]
            if row.get('tcpId'):
                item.update(source='tcp', sourceId=row['tcpId'])
    counts, source_counts, source_bytes = Counter(), defaultdict(Counter), Counter()
    missing_metadata, backlog, gaps, seen = [], [], [], set()
    body_formats = {'.pdf', '.epub', '.txt', '.md', '.html', '.htm', '.xml', '.json', ''}
    auxiliary = {'.jpg', '.png', '.webp', '.css', '.zip'}
    total_bytes = 0
    hashes = set()
    catalog_path = output / 'private-catalog.jsonl'
    temporary = catalog_path.with_suffix('.jsonl.tmp')
    with temporary.open('w', encoding='utf-8') as catalogue:
        for directory, _, names in os.walk(root):
            for name in names:
                path = Path(directory) / name
                if path.suffix.lower() in ('.part', '.tmp'):
                    continue
                try:
                    size = path.stat().st_size
                except OSError:
                    continue
                key = str(path.resolve())
                seen.add(key)
                row = dict(published.get(key, {}))
                hint = hints.get(key, {})
                for field, value in hint.items():
                    if value is not None:
                        if field == 'manifests':
                            row[field] = sorted(set(row.get(field, []) + value))
                        else:
                            row[field] = value
                row.update(path=key, bytes=size)
                source = str(row.get('source') or path.relative_to(root).parts[0])
                row['source'] = source
                is_aux = (path.suffix.lower() in auxiliary or name.endswith('provenance.json')
                          or name == 'metadata.json' or name.endswith('_scandata.xml'))
                body_candidate = not is_aux and path.suffix.lower() in body_formats
                row['bodyCandidate'] = body_candidate
                status = row.get('publishedStatus', 'not_in_snapshot')
                if key in published and hint.get('sha256') and hint['sha256'] != published[key]['sha256']:
                    status = 'changed_since_snapshot'
                row['intakeStatus'] = status
                counts[status] += 1
                source_counts[source][status] += 1
                source_bytes[source] += size
                total_bytes += size
                if row.get('sha256'):
                    hashes.add(row['sha256'])
                if body_candidate:
                    absent = [x for x in ('title', 'author', 'url', 'licence', 'sha256') if not row.get(x)]
                    if absent:
                        missing_metadata.append(dict(path=key, source=source, missing=absent))
                    if status in ('not_in_snapshot', 'changed_since_snapshot'):
                        backlog.append(dict(path=key, source=source, bytes=size, status=status))
                    if status in ('no_text', 'unsupported', 'error', 'deferred_scan'):
                        gaps.append(dict(path=key, source=source, status=status, detail=row.get('detail')))
                catalogue.write(json.dumps(row, ensure_ascii=False) + '\n')
    temporary.replace(catalog_path)
    missing = [dict(path=p, status=r['publishedStatus']) for p, r in published.items() if p not in seen]
    embedding = read(state / 'embedding-progress.json')
    intake = read(state / 'intake-completion.json')
    result = dict(snapshotAt=datetime.now(timezone.utc).isoformat(), libraryFiles=len(seen),
                  GB=round(total_bytes/1e9, 3), statuses=dict(counts), recordedUniqueHashes=len(hashes),
                  manifestFiles=len(manifests), manifestRows=manifest_rows, manifestErrors=manifest_errors,
                  unpublishedBodyCandidates=len(backlog), bodyFilesMissingMetadata=len(missing_metadata),
                  textGaps=len(gaps), missingPublishedFiles=len(missing), embedding=embedding, intake=intake,
                  sources=[dict(source=s, files=sum(c.values()), GB=round(source_bytes[s]/1e9, 3), statuses=dict(c))
                           for s, c in sorted(source_counts.items(), key=lambda item: -sum(item[1].values()))])
    for name, items in [('intake-backlog', backlog), ('metadata-backlog', missing_metadata), ('text-gaps', gaps), ('missing-published-files', missing)]:
        write_json(output / (name + '.json'), {'snapshotAt': result['snapshotAt'], 'items': items})
    write_json(output / 'summary.json', result)
    lines = ['# Download campaign stocktake', '',
             f"Snapshot: {result['snapshotAt']}. **{len(seen):,} held library files; {result['GB']:.3f} GB**. These include metadata, images, archives and duplicates; they are not a book count.", '',
             f"Published corpus: **{embedding['total']:,} passages**; **{embedding['indexed']:,} embedded**, **{embedding['remaining']:,} remaining**. Intake: **{intake['state']}**.", '',
             f"Pending body candidates: **{len(backlog):,}**. Body candidates with missing title/author/URL/licence/hash metadata: **{len(missing_metadata):,}**. Published text gaps: **{len(gaps)}**. Missing previously published library files: **{len(missing)}**.", '',
             '| Source or storage group | Files | GB |', '|---|---:|---:|']
    for row in result['sources']:
        lines.append(f"| {row['source'].replace('|', '/')} | {row['files']:,} | {row['GB']:.3f} |")
    lines += ['', 'Private catalogue: `private-catalog.jsonl`. Detailed queues: `intake-backlog.json`, `metadata-backlog.json`, `text-gaps.json`, `missing-published-files.json`. Recorded hashes are reused; this does not rehash held originals or verify vector parity. File-type candidates can include support files and are not automatically approved books. Existing searchable status describes the published snapshot, not all later changes. No originals, acquisition ledgers or live databases were modified.']
    (output / 'REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('snapshotAt', 'libraryFiles', 'GB', 'statuses', 'manifestFiles', 'unpublishedBodyCandidates', 'bodyFilesMissingMetadata', 'textGaps', 'missingPublishedFiles')}))


if __name__ == '__main__':
    main()
