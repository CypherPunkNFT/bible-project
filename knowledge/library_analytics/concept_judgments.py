"""Translate explicit pooled relevance judgments into per-method ranks."""
import json
from .concept_index import root,read
from .concept_query import normalized_author_labels
from .build import dump
from .inputs import packed

def paired_completion(results,groups):
    if len(groups)<2:return 0
    for pos in range(1,len(results)+1):
        found={r['id'] for r in results[:pos]}
        if all(g&found for g in groups):return pos
    return 0

def main():
    run=read(root()/'population.json')['run_id'];folder=root()/'evaluations'/run
    source=read(folder/'pooled-judgments.json');judgments={j['question_id']:j for j in source['questions']}
    rows=[json.loads(l) for l in (folder/'reserved-results.jsonl').read_text('utf-8').splitlines()];out=[]
    if set(judgments)!={q['id'] for q in rows}:raise ValueError('Explicit dispositions for all questions required')
    for q in rows:
        j=judgments[q['id']];useful=set(j['useful_window_ids']);adequate=set(j.get('adequate_context_window_ids',j['useful_window_ids']))
        pooled={r['id'] for v in q['outputs'].values() for r in v['results']}
        groups=[set(g) for g in j.get('required_evidence_groups',[])]
        if not useful<=pooled or not adequate<=pooled:raise ValueError('Judged window outside frozen pool')
        if any(not g or not g<=useful for g in groups):raise ValueError('Evidence groups must identify reviewed useful windows')
        item={'question_id':q['id'],'reviewer_type':'model-assisted Codex','notes':j['notes'],
            'disposition':j.get('disposition','reviewed'),'failure_classes':j.get('failure_classes',[])}
        if groups:item['required_evidence_groups']=[sorted(g) for g in groups]
        for mode,data in q['outputs'].items():
            ranks=[i for i,r in enumerate(data['results'],1) if r['id'] in useful]
            context=[i for i,r in enumerate(data['results'],1) if r['id'] in adequate]
            completion=0
            if q['family']=='author-comparison':
                requested=[a['selected_label'] for a in q['author_resolution']]
                if len(requested)==2 and all(requested):
                    for pos in range(1,len(data['results'])+1):
                        found=[r for r in data['results'][:pos] if r['id'] in useful]
                        if all(any(normalized_author_labels(label)&normalized_author_labels(r['author_label']) for r in found) for label in requested):completion=pos;break
            elif q['family'] in ('quotations-parallels','multilingual'):
                completion=paired_completion(data['results'],groups)
            elif ranks:completion=min(ranks)
            if item['disposition']=='capability-deferred':completion=0
            item[mode]={'relevant_ranks':ranks,'adequate_context_ranks':context,'success':bool(completion),'completion_rank':completion or None}
        out.append(item)
    value={'reviewer_type':source['reviewer_type'],'review_method':source['review_method'],'questions':out}
    dump(folder/'reserved-judgments.json',value);print(packed({'questions':len(out),'path':str(folder/'reserved-judgments.json')}))
if __name__=='__main__':main()
