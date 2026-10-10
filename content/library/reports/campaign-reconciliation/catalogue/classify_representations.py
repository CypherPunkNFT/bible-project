"""Label representations from existing manifests and recorded original hashes."""
import json
import runpy
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlsplit

OUT = Path(__file__).resolve().parent
helpers = runpy.run_path(str(OUT / 'reconcile.py'))
read, save = helpers['read'], helpers['save']
SITE = helpers['SITE']
rows = [json.loads(line) for line in (OUT / 'private-catalog.jsonl').open(encoding='utf-8')]
derivatives = {}
for file in (SITE / 'content/library/reports').rglob('*acquisition*manifest*.json'):
    if file.is_relative_to(OUT.parent):
        continue
    try:
        data = read(file)
    except (OSError, ValueError):
        continue
    for row in helpers['objects'](data):
        parent = helpers['path_of'](row)
        child = row.get('derivedText')
        if not parent or not isinstance(child, dict):
            continue
        key = helpers['path_of'](child)
        if key and key != parent and child.get('sha256'):
            derivatives[key] = dict(originalPath=parent, originalSha256=row.get('sha256'))
hashes = defaultdict(list)
for row in rows:
    hashes[row['sha256']].append(row['path'])
secondary = {p for paths in hashes.values() for p in sorted(paths)[1:]}
owned_records = set(read(OUT / 'generated-records.state')['paths'])
by_path = {}
for row in rows:
    key = row['path']
    row['representationType'] = 'duplicate-original' if key in secondary else 'original'
    if '/articles/' in str(row.get('url') or '') or row.get('kind') == 'articles':
        row.update(genre='article', classification='article', countAsBook=False)
        work_path = SITE / 'content/library/catalog/works' / (str(row.get('workId')) + '.json')
        if str(work_path.resolve()) in owned_records:
            work = read(work_path)
            work.update(genre='article', collections=[])
            for creator in work['creators']:
                if creator['role'] == 'preacher':
                    creator['role'] = 'author'
            save(work_path, work)
    if key in secondary:
        row['countAsBook'] = False
    if key in derivatives:
        row.update(derivatives[key], representationType='text-derivative', classification='text-derivative', countAsBook=False)
    if row['source'] == 'source-helloao':
        row.update(classification='commentary-section', countAsBook=False)
    if 'worksheet' in str(row.get('textKind', '')).lower() or 'preview' in str(row.get('textKind', '')).lower() or 'advertisement' in str(row.get('textKind', '')).lower():
        row.update(classification='support-material', countAsBook=False)
    if urlsplit(str(row.get('url') or '')).hostname in ('store.ligonier.org', 'store.thegospelcoalition.org'):
        row.update(classification='catalogue-or-store-page', countAsBook=False)
    by_path[key] = row
with (OUT / 'private-catalog.jsonl').open('w', encoding='utf-8') as stream:
    for row in rows:
        stream.write(json.dumps(row, ensure_ascii=False) + '\n')
manifest = read(OUT / 'acquisition-manifest.json')
outputs = {r['path']:r for r in manifest['files']}
for key, row in by_path.items():
    if key not in outputs and row['representationType'] == 'original' and row['classification'] not in ('commentary-section', 'support-material', 'catalogue-or-store-page'):
        continue
    target = outputs.setdefault(key, {k:row[k] for k in ('path','sha256','title','author','source','url','format','licence') if row.get(k)})
    for field in ('representationType','classification','countAsBook','originalPath','originalSha256'):
        if field in row:
            target[field] = row[field]
manifest['files'] = list(outputs.values())
save(OUT / 'acquisition-manifest.json', manifest)
summary = read(OUT / 'summary.json')
summary.update(manifestFileEntries=len(manifest['files']), classification=dict(Counter(r['classification'] for r in rows)),
               representations=dict(Counter(r['representationType'] for r in rows)))
save(OUT / 'summary.json', summary)
print(json.dumps({k:summary[k] for k in ('manifestFileEntries','classification','representations')}))
