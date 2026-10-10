"""Read-only metadata-plan check; no build, database writes, extraction or embedding."""
import json
import sys
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent
SITE = OUT.parents[4]
sys.path.insert(0, str(SITE))
from knowledge.library import plan_library
from knowledge.settings import load

config = load()
records, provenance, hints, derivatives, raw_files = plan_library(config)
manifest = json.loads((OUT / 'acquisition-manifest.json').read_text(encoding='utf-8'))
differences, fields = [], Counter()
def normalized(value):
    if isinstance(value, str):
        return ' '.join(value.split())
    return value
for row in manifest['files']:
    actual = hints.get(str(Path(row['path']).resolve()), {})
    for field in ('title', 'author', 'licence', 'sha256', 'workId', 'editionId'):
        if row.get(field) is None:
            continue
        value = actual.get(field)
        if field == 'title':
            asset = actual.get('catalog', {})
            edition = records.get(asset.get('editionId') or actual.get('editionId'), {})
            work = records.get(edition.get('workId') or actual.get('workId'), {})
            value = work.get('title') or value
        if normalized(value) != normalized(row[field]):
            differences.append(dict(path=row['path'], field=field, expected=row[field], planned=value))
            fields[field] += 1
result = dict(mode='read-only metadata plan; no extraction/build/indexing', checkedFiles=len(manifest['files']),
              conflictingFieldCounts=dict(fields), conflictingFiles=len({r['path'] for r in differences}),
              differences=differences)
(OUT / 'importer-plan.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
links = []
for original, selected in derivatives.items():
    links.append({k:v for k,v in dict(originalPath=original, **selected).items() if k in ('originalPath','path','sha256','method','priority','manifest','pageText','pageTextSha256')})
(OUT / 'derivative-links.json').write_text(json.dumps({'items':links,'scope':'Existing selected text derivatives; links retained without extraction or changes'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='differences'}))
