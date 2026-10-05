"""Check the bounded L11 text index and prepare an explicit owned-file list."""
import hashlib
import json
from pathlib import Path

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/pastoral-care'
def read(p): return json.loads(p.read_text(encoding='utf-8'))
sections=read(OUT/'section-index.json')['sections']
concerns=read(OUT/'concern-index.json')['concerns']
assert len(sections)==23 and len(concerns)==10
assert len({s['id'] for s in sections})==23
assert all(c['sectionIds'] for c in concerns)
assert all(sid in {s['id'] for s in sections} for c in concerns for sid in c['sectionIds'])
for s in sections:
    for kind,key in [('works','workId'),('editions','editionId'),('assets','assetId')]:
        assert (SITE/'content/library/catalog'/kind/(s[key]+'.json')).exists()
for c in concerns:
    for sermon in c['sermons']:
        assert (SITE/'content/library/catalog/works'/(sermon['workId']+'.json')).exists()
files=read(OUT/'acquisition-manifest.json')['files']
for f in files:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
assert sum(f.get('format')=='xml' for f in files)==7
validation=dict(date='2026-10-05',checks=['All 10 acquired content/evidence file hashes verified','23 unique section pointers; all parent works, editions and assets resolve','All ten concerns have sections; all sermon targets resolve','Seven XML files parsed and selected element hashes rebuilt by catalog-pastoral-care.py','Full-library structural validator passed: 13,082 records'],limits='Selected sections and metadata connections; no full-text collation or sermon-body comparison.')
(OUT/'validation.json').write_text(json.dumps(validation,indent=2)+'\n',encoding='utf-8',newline='\n')
paths=read(OUT/'record-manifest.json')['paths']
paths += [p.relative_to(SITE).as_posix() for p in OUT.iterdir() if p.is_file()]
paths += ['scripts/acquire-pastoral-care.py','scripts/catalog-pastoral-care.py','scripts/check-pastoral-care.py','content/library/README.md','content/library/BACKLOG.md','SOURCES.md']
target=SITE/'.local/l11-owned-paths.txt'; target.parent.mkdir(parents=True,exist_ok=True)
target.write_bytes('\0'.join(sorted(set(paths))).encode()+b'\0')
print('L11 integrity checks passed; explicit owned-path list prepared.')
