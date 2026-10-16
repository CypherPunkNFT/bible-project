"""Check that development tuning preserved the frozen baseline on repeated questions."""
import json
from .concept_index import root,read
from .build import dump
from .inputs import packed

def rows(path):
    text=path.read_text('utf-8');lines=text.splitlines()
    if text and not text.endswith('\n'):lines=lines[:-1]
    return [json.loads(line) for line in lines]

def signature(q):
    out=q['outputs']['baseline']
    return {'calls':out['calls'],'results':[
        {**{k:r[k] for k in ('id','version_id','start','end','text_sha256','text','context','author_label','work_id','edition_id','language')},
         'lexical':{k:r['components']['lexical'][k] for k in ('rank','score')}} for r in out['results']]}

def main():
    run=read(root()/'population.json')['run_id'];folder=root()/'evaluations'/run
    current={q['id']:q for q in rows(folder/'development-results.jsonl')};checks=[]
    for path in sorted((folder/'development-iterations').glob('*/development-results*.jsonl')):
        for old in rows(path):
            checks.append({'question_id':old['id'],'previous':str(path.relative_to(folder)),
                'unchanged':signature(old)==signature(current[old['id']])})
    value={'run_id':run,'development_questions':len(current),'repeated_baseline_questions':len(checks),
        'ok':len(current)==72 and bool(checks) and all(c['unchanged'] for c in checks),'checks':checks,
        'scope':'Ranked baseline identities, text/coordinates, author/work/edition/language, lexical scores and call constraints unchanged; timings and added diagnostic fields excluded.'}
    dump(folder/'baseline-invariance.json',value);print(packed(value))
    if not value['ok']:raise ValueError('Baseline changed or development incomplete')

if __name__=='__main__':main()
