"""Package public reading copies for static hosting; never read intake or vectors.

Bundles are bounded, content-addressed JSON. Only pages referenced by the public
catalogue are included. Originals and the unpacked extraction cache are retained.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import os
import shutil
import uuid

SITE = Path(__file__).resolve().parents[1]
RAW = SITE / '.local/teacher-library-unpacked'
OUT = SITE / 'public/content/teacher-library'
LIMIT = 2 * 1024 * 1024


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')


def main():
    # One-time migration of the earlier page-per-file build, confined to these
    # exact generated directories. Keep it intact as the extraction cache.
    if not RAW.exists():
        if not (OUT / 'text').is_dir():
            raise SystemExit('Build the acquired library before packing it.')
        RAW.parent.mkdir(parents=True, exist_ok=True)
        OUT.rename(RAW)
    stage = OUT.with_name('teacher-library-stage-' + uuid.uuid4().hex)
    stage.mkdir(parents=True)
    def write(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(encoded(value))
    bundle, size, positions = {}, 2, {}
    page_count = bundle_count = 0
    def flush():
        nonlocal bundle, size, bundle_count
        if not bundle:
            return
        data = encoded(bundle)
        digest = hashlib.sha256(data).hexdigest()
        name = f'pages/{digest}.json'
        target = stage / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        for key in bundle:
            positions[key] = name
        bundle_count += 1
        bundle, size = {}, 2
    records = {}
    for path in sorted((RAW / 'records').glob('*.json')):
        records.update(read(path))
    for rid, record in sorted(records.items()):
        if record['availability'] != 'on-site-text':
            if record['pages']:
                raise ValueError(f'Uncleared text has pages: {rid}')
            continue
        for number in range(record['pages']):
            page = read(RAW / 'text' / rid / f'{number}.json')
            key = f'{rid}/{number}'
            cost = len(encoded({key: page}))
            if cost > LIMIT:
                raise ValueError(f'Reading page exceeds bundle limit: {key}')
            if size + cost > LIMIT:
                flush()
            bundle[key] = page
            size += cost
            page_count += 1
    flush()
    record_shards, contributor_shards = defaultdict(dict), defaultdict(dict)
    for rid, record in records.items():
        record['pageBundles'] = [positions[f'{rid}/{n}'] for n in range(record['pages'])]
        record_shards[hashlib.sha256(rid.encode()).hexdigest()[:2]][rid] = record
    for shard, rows in record_shards.items():
        write(stage / 'records' / (shard + '.json'), rows)
    catalogue = read(RAW / 'catalogue.json')
    for contributor in catalogue['contributors']:
        ident = contributor['id']
        shelf = read(RAW / 'contributors' / (ident + '.json'))
        if any(row['id'] not in records for row in shelf):
            raise ValueError(f'Broken shelf: {ident}')
        contributor_shards[hashlib.sha256(ident.encode()).hexdigest()[:2]][ident] = shelf
    for shard, rows in contributor_shards.items():
        write(stage / 'contributors' / (shard + '.json'), rows)
    catalogue['storage'] = 'packed-v1'
    write(stage / 'catalogue.json', catalogue)
    # Anonymous inscriptions and datasets must be discoverable too; contributor
    # shelves alone hid the majority of acquired records from browsing.
    collections = defaultdict(list)
    for record in records.values():
        collections[record['source']].append(record)
    collection_index = []
    for source, rows in sorted(collections.items()):
        ident = hashlib.sha256(source.encode()).hexdigest()[:16]
        rows.sort(key=lambda r: (r['title'].casefold(), r['id']))
        readable = [r for r in rows if r['availability'] == 'on-site-text']
        collection_index.append({'id': ident, 'source': source, 'records': len(rows),
                                 'readable': len(readable), 'anonymous': sum(not r['authors'] for r in rows)})
        for view, selection in [('all', rows), ('readable', readable)]:
            for start in range(0, len(selection), 1000):
                write(stage / 'collections' / ident / view / f'{start // 1000}.json',
                      [{k: r[k] for k in ['id', 'title', 'authors', 'language', 'source', 'availability', 'genre']}
                       for r in selection[start:start + 1000]])
    write(stage / 'collections/index.json', collection_index)
    assets = list(stage.rglob('*.json'))
    report = {'records': len(records), 'publicReadingCopies': catalogue['onSiteTexts'],
              'readingPages': page_count, 'pageBundles': bundle_count,
              'files': len(assets), 'bytes': sum(p.stat().st_size for p in assets),
              'largestFileBytes': max(p.stat().st_size for p in assets),
              'allReferencesVerified': True, 'storage': 'packed-v1'}
    if report['files'] > 15000 or report['largestFileBytes'] > 25 * 1024 * 1024:
        raise ValueError(f'Package exceeds reserved Pages limits: {report}')
    # Publish the fully validated generated directory, retaining old output until
    # the replacement succeeds. All removal is restricted to this generated root.
    old = OUT.with_name('teacher-library-old-' + uuid.uuid4().hex)
    if OUT.exists():
        OUT.rename(old)
    try:
        stage.rename(OUT)
    except Exception:
        if old.exists():
            old.rename(OUT)
        raise
    if old.exists():
        if old.resolve().parent != OUT.resolve().parent or not old.name.startswith('teacher-library-old-'):
            raise ValueError('Unsafe generated directory')
        shutil.rmtree(old)
    write(SITE.parent / 'Research/Teachers-library-update/package.json', report)
    print(json.dumps(report))


if __name__ == '__main__':
    main()
