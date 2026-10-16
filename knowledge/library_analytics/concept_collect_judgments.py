"""Collect explicit reviewer-authored notes; never infer relevance from matching words."""
import json
from .concept_index import root,read
from .build import dump
from .inputs import packed

def main():
    run=read(root()/'population.json')['run_id'];folder=root()/'evaluations'/run
    questions=[]
    for p in sorted((folder/'review-notes').glob('reserved-*.json')):questions.extend(read(p))
    ids=[q['question_id'] for q in questions]
    expected={json.loads(line)['id'] for line in (folder/'reserved-results.jsonl').read_text('utf-8').splitlines()}
    if len(ids)!=len(set(ids)) or set(ids)!=expected:raise ValueError('Exactly one explicit review per reserved question required')
    value={'reviewer_type':'model-assisted Codex implementation agent; no human or independent reviewer',
        'review_method':'The same Codex agent that implemented retrieval inspected pooled source contexts against the pre-frozen evidence rubrics, with retrieval modes and ranks hidden and stable hash-shuffled ordering. Whitespace was collapsed only for display; original located contexts remain in the frozen results. Explicit useful window IDs, context judgments, failure reasons and capability deferrals were authored per question. This is question-held-out evaluation on the same corpus, not topic- or document-disjoint evaluation. Deterministic source checks are separate; no exhaustive gold spans or recall estimate. All 48 questions remain in the success denominator.',
        'questions':questions}
    dump(folder/'pooled-judgments.json',value);print(packed({'questions':len(questions),'path':str(folder/'pooled-judgments.json')}))

if __name__=='__main__':main()
