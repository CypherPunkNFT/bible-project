"""Score recorded bounded retrieval judgments; never generates or revises labels."""
import argparse
import statistics
from pathlib import Path

from ..settings import load, write_json
from .contract import sha256_file
from .crosswalk import read


def evaluate(folder):
    folder=Path(folder);results=read(folder/'heldOut-results.json');judgments=read(folder/'judgments.json')
    pool=read(folder/'review-pool.json');freeze=read(folder/'evaluation-freeze.json')
    if judgments['resultsSha256']!=sha256_file(folder/'heldOut-results.json') or judgments['poolSha256']!=sha256_file(folder/'review-pool.json'):
        raise ValueError('Judgments no longer match evaluated results/pool')
    if results['questionsSha256']!=freeze['questionsSha256'] or results['queryVectorsSha256']!=freeze['queryVectorsSha256']:
        raise ValueError('Evaluation inputs changed after freeze')
    expected_implementation=freeze.get('annotationCorrection',{}).get('implementationSha256',freeze['implementationSha256'])
    if results['implementationSha256']!=expected_implementation:
        raise ValueError('Unrecorded implementation change after freeze')
    questions=read(folder/'questions.frozen.json')['heldOut']
    expected={q['id'] for q in questions}
    for records in (results['results'],judgments['judgments'],pool):
        if len(records)!=len(expected) or {q['id'] for q in records}!=expected:
            raise ValueError('Evaluation question coverage differs')
    decisions={j['id']:j for j in judgments['judgments']};pools={p['id']:p for p in pool}
    per_question=[]
    for question in results['results']:
        key=question['id'];judge=decisions[key]
        ids={r['chunkId'] for mode in ('lexical','hybrid') for r in question[mode]['results']}
        if {r['chunkId'] for r in pools[key]['candidates']}!=ids or {r['chunkId'] for r in judge['candidates']}!=ids:
            raise ValueError('Judgment pool must cover exactly both top-five lists')
        if any(type(r['useful']) is not bool for r in judge['candidates']): raise ValueError('Require explicit binary usefulness labels')
        good={r['chunkId'] for r in judge['candidates'] if r['useful']}
        record=dict(id=key,query=question['query'],reviewNote=judge['note'])
        for mode in ('lexical','hybrid'):
            found=[i for i,r in enumerate(question[mode]['results'],1) if r['chunkId'] in good]
            record[mode]=dict(hitAt5=bool(found),firstUsefulRank=min(found) if found else None,
                              reciprocalRank=1/min(found) if found else 0,seconds=question[mode]['seconds'])
        per_question.append(record)
    metrics={}
    for mode in ('lexical','hybrid'):
        hits=sum(q[mode]['hitAt5'] for q in per_question)
        metrics[mode]=dict(usefulTopFive=hits,questions=len(per_question),hitAt5=hits/len(per_question),
                           mrrAt5=statistics.mean(q[mode]['reciprocalRank'] for q in per_question),
                           medianQuerySeconds=statistics.median(q[mode]['seconds'] for q in per_question),
                           misses=[q['id'] for q in per_question if not q[mode]['hitAt5']])
    return dict(schemaVersion=1,reviewKind=judgments['reviewKind'],scope=judgments['scope'],metrics=metrics,
                improvementPercentagePoints=100*(metrics['hybrid']['hitAt5']-metrics['lexical']['hitAt5']),
                proposedReleaseGate=dict(requiredHits=18,questions=20,met=metrics['hybrid']['usefulTopFive']>=18),
                perQuestion=per_question,publication='private',
                limits=['Small English pilot and AI-assisted pooled judgments, not an independent human benchmark.',
                        'Usefulness includes returned immediate context; no exhaustive recall/precision claim.',
                        'Timings exclude snapshot preparation, model inference, disk loading and review.',
                        'The four development questions do not satisfy the proposed 80-question development release target.'])


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--folder',type=Path,required=True)
    args=parser.parse_args();config=load()
    if not args.folder.resolve().is_relative_to((config['state_dir']/'library-knowledge').resolve()):
        parser.error('Outputs must stay private')
    result=evaluate(args.folder);write_json(args.folder/'evaluation.json',result)
    print(result['metrics']);print(result['proposedReleaseGate'])


if __name__=='__main__':main()
