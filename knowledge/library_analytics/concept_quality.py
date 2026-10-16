"""Aggregate explicit reserved judgments without inventing relevance from text matches."""
from collections import Counter,defaultdict
import json
import math
import statistics
from .concept_index import root,read,filehash
from .build import dump
from .inputs import packed

def main():
    pop=read(root()/'population.json');folder=root()/'evaluations'/pop['run_id']
    rows=[json.loads(l) for l in (folder/'reserved-results.jsonl').read_text('utf-8').splitlines()]
    labels=read(folder/'reserved-judgments.json');byid={r['question_id']:r for r in labels['questions']}
    if set(byid)!={q['id'] for q in rows}:raise ValueError('All 48 reserved questions require explicit disposition')
    metrics={};family=defaultdict(lambda:defaultdict(list));failure=Counter();questions=[]
    reviewed_questions=sum(j.get('disposition')!='capability-deferred' for j in byid.values())
    for mode in ('baseline','concept'):
        timings=sorted(q['outputs'][mode]['seconds'] for q in rows)
        success=precision=reciprocal=context_good=0;returned=conflicts=known=unknown=0
        for q in rows:
            j=byid[q['id']];m=j[mode];results=q['outputs'][mode]['results'];returned+=len(results)
            ranks=m['relevant_ranks']
            if any(not 1<=i<=len(results) for i in ranks):raise ValueError('Judged nonexistent result')
            success+=bool(m['success']);precision+=len(ranks)
            reciprocal+=1/m['completion_rank'] if m['success'] else 0
            context_good+=len(m.get('adequate_context_ranks',[]))
            conflicts+=sum(bool(r.get('attribution_conflicts')) for r in results)
            known+=len({r['work_id'] for r in results if r['work_id']})
            unknown+=sum(not r['work_id'] for r in results)
            family[q['family']][mode].append(bool(m['success']))
            if mode=='concept':failure.update(j.get('failure_classes',[]))
        metrics[mode]={'questions':48,'useful_success_at_5':success,'success_rate':success/48,
            'relevant_results':precision,'precision_at_5':precision/(48*5),'mean_reciprocal_completion_rank':reciprocal/48,
            'precision_denominator':'48 questions x 5 slots; capability deferrals and missing results score zero, not judged irrelevant passages',
            'reviewed_questions':reviewed_questions,'reviewed_question_precision_at_5':precision/max(1,reviewed_questions*5),
            'returned_results':returned,'adequate_context_results':context_good,
            'query_seconds_total':sum(timings),'query_seconds_median':statistics.median(timings),
            'query_seconds_p95':timings[math.ceil(.95*len(timings))-1],
            'timing_scope':'Search and result reconstruction; author comparison sums its separate constrained calls; excludes one-time engine setup',
            'known_work_groups_summed_per_question':known,'results_with_unresolved_work_identity':unknown,
            'results_with_conflicting_author_metadata':conflicts,
            'location_hash_checks':'every returned window freshly reconstructed; deterministic, not relevance',
            'speaker_attribution':'unresolved candidates; no author-endorsement precision claim'}
    for q in rows:questions.append({**byid[q['id']],'family':q['family'],'query':q['retrieval_query']})
    delta={'useful_questions':metrics['concept']['useful_success_at_5']-metrics['baseline']['useful_success_at_5'],
        'precision_at_5':metrics['concept']['precision_at_5']-metrics['baseline']['precision_at_5'],
        'mean_reciprocal_completion_rank':metrics['concept']['mean_reciprocal_completion_rank']-metrics['baseline']['mean_reciprocal_completion_rank']}
    value={'run_id':pop['run_id'],'reviewer_type':labels['reviewer_type'],'review_method':labels['review_method'],
        'judgments_sha256':filehash(folder/'reserved-judgments.json'),'results_sha256':filehash(folder/'reserved-results.jsonl'),
        'metrics':metrics,'gains':delta,'by_family':{f:{m:{'successes':sum(v),'questions':len(v)} for m,v in modes.items()} for f,modes in family.items()},
        'failure_classes':dict(failure),'deferred_questions':sum(j.get('disposition')=='capability-deferred' for j in byid.values()),
        'release_gate_passed':False,'release_gate_reason':'Requires >=0.85 useful questions and >=0.95 location AND attribution precision; candidate retrieval does not establish speaker/endorsement attribution precision.',
        'questions':questions,'recall':'Not measured: no exhaustive gold span set','human_review':False}
    dump(folder/'quality.json',value);print(packed({k:v for k,v in value.items() if k!='questions'}))

if __name__=='__main__':main()
