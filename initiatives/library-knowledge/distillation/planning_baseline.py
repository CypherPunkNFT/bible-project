"""Small planning audit of saved receipts and candidates; no pipeline/store writes.

Only this folder receives output. No candidate API calls or corpus queries.
"""
import hashlib
import json
from pathlib import Path
import urllib.request
from datetime import datetime, timezone

SITE=Path(__file__).resolve().parents[3]
STATE=SITE.parent/'KnowledgeBase'
HERE=Path(__file__).resolve().parent


def capture(path):
    data=path.read_bytes()
    return json.loads(data.decode('utf-8-sig')),dict(path=str(path.relative_to(SITE.parent)),sha256=hashlib.sha256(data).hexdigest())


def main():
    target=HERE/'baseline-2026-10-18.json'
    if target.exists():
        raise SystemExit('Baseline already captured; preserve it and choose a new dated artifact for another audit.')
    inputs=[]
    def load(path):
        value,identity=capture(path);inputs.append(identity);return value
    verification=load(STATE/'verification.json')
    supervisor=load(STATE/'native-supervisor/status.json')
    catalogue=load(SITE/'.local/data-analysis/website-candidates.json')
    curation_path=STATE/'library-knowledge/connected-research/curation/curation-state.json'
    curation=load(curation_path) if curation_path.exists() else {}
    candidates=[]
    for c in catalogue['candidates']:
        candidates.append({k:c.get(k) for k in ('id','title','track','family','priority','finding','benefit','placement','next','limits','review')}
                         |dict(source_count=len(c.get('sources',[])),evidence_link_count=len(c.get('evidenceLinks',[]))))
    counts={}
    for c in candidates:counts[c['track']]=counts.get(c['track'],0)+1
    page={}
    try:
        with urllib.request.urlopen('http://127.0.0.1:8931/data_analysis/candidates/',timeout=10) as r:
            body=r.read(1000000)
            page=dict(status=r.status,bytes=len(body),sha256=hashlib.sha256(body).hexdigest())
    except Exception as error:page=dict(error=type(error).__name__)
    for rel in ['analysis-desk/README.md','knowledge/library_analytics/candidate_review.py',
                'knowledge/library_analytics/CONCEPTS-RESULT.md','knowledge/library_analytics/RELATIONSHIPS-RESULT.md',
                'knowledge/library_analytics/TEXT-RESULT.md','initiatives/library-knowledge/RETRIEVAL-PILOT.md',
                'initiatives/library-knowledge/KR130-RETIRED.md']:
        path=SITE/rel;data=path.read_bytes();inputs.append(dict(path='Website/'+rel,sha256=hashlib.sha256(data).hexdigest()))
    result=dict(observed_at=datetime.now(timezone.utc).isoformat(),scope='Planning only; saved projections, receipts and candidate HTML',
        snapshot_warning='Files read individually; not a dependency-closed corpus snapshot. Live source reconciliation is separate.',
        verification={k:verification.get(k) for k in ['corpus_build','verified_at','complete','enrichment_ready','chunks','vectors',
          'missing_vectors','stale_vectors','duplicate_vectors','sqlite_integrity','new_source_files_since_snapshot',
          'changed_source_inputs_since_snapshot','new_library_files_since_snapshot','changed_library_ledgers_since_snapshot']},
        supervisor={k:supervisor.get(k) for k in ['updated_at','state','mode','reason','attempts']},
        page=page,candidate_count=len(candidates),tracks=counts,selected_runs=catalogue.get('selectedRuns'),
        audit=catalogue.get('audit'),curation_export=curation,candidates=candidates,input_fingerprints=inputs)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(output=str(target),candidate_count=len(candidates),tracks=counts,page=page,
        verification=result['verification'],supervisor=result['supervisor'],curation_keys=list(curation),
        titles=[dict(id=c['id'],title=c['title'],track=c['track']) for c in candidates]),ensure_ascii=False,indent=2))


if __name__=='__main__':main()
