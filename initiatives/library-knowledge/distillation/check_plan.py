"""Validate planning artifact references and saved baseline; no runtime writes."""
import hashlib
import json
from pathlib import Path
import re

HERE=Path(__file__).resolve().parent
SITE=HERE.parents[2]
docs=[HERE.parent/'CORPUS-DISTILLATION-MASTER-PLAN.md',HERE/'PILOT-PROTOCOL.md']
docs.extend(path for path in (HERE.parent/'EMBEDDING-DISTILLATION-HANDOFF.md',
                             HERE.parent/'DATA-ANALYSIS-HANDOFF.md') if path.exists())
failures=[]
for path in docs:
    body=path.read_text('utf-8')
    for link in re.findall(r'\]\(([^)]+)\)',body):
        if link.startswith(('http://','https://','#')):continue
        target=(path.parent/link.split('#')[0]).resolve()
        if not target.exists():failures.append(dict(document=path.name,missing=link))
baseline=json.loads((HERE/'baseline-2026-10-18.json').read_text('utf-8'))
assert baseline['candidate_count']==21
assert len({c['id'] for c in baseline['candidates']})==21
assert baseline['curation_export']['counts']['pending']==21
assert baseline['verification']['chunks']==baseline['verification']['vectors']==11579535
pilot=docs[1].read_text('utf-8')
for identity in ('ephesians-guide','supper','justification','quotation','editor-voice','caritas'):
    assert identity in {c['id'] for c in baseline['candidates']}
    assert '| `'+identity+'` |' in pilot
runtime=[]
for item in baseline['input_fingerprints']:
    relative=item['path'].replace('\\','/')
    if relative in ('Website/.local/data-analysis/website-candidates.json',
                        'KnowledgeBase/library-knowledge/connected-research/curation/curation-state.json'):
        path=SITE.parent/relative
        runtime.append(dict(path=relative,unchanged=hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256']))
assert len(runtime)==2
print(json.dumps(dict(documents_checked=len(docs),broken_links=failures,candidates=21,pilot_dossiers=6,
                     candidate_projection_checks=runtime),indent=2))
if failures:raise SystemExit(1)
