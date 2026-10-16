"""Aggregate explicit reviewer-authored paired-context decisions."""
from collections import Counter
from .relationship_miner import root
from .concept_index import read,filehash
from .build import dump
from .inputs import packed

def main():
    folder=root();pool=read(folder/'evaluation-pool.json');labels=[]
    for path in sorted((folder/'review-notes').glob('review-*.json')):labels.extend(read(path))
    ids=[x['sample_id'] for x in labels];expected={x['sample_id'] for x in pool['samples']}
    if len(set(ids))!=len(ids) or set(ids)!=expected:raise ValueError('Exactly one explicit judgment per sampled pair is required')
    byid={x['sample_id']:x for x in labels};metrics={};strata={};origins={}
    for channel in ('wording','cocitation'):
        rows=[byid[p['sample_id']] for p in pool['samples'] if p['sample_channel']==channel]
        for r in rows:
            if not isinstance(r['useful'],bool) or not r['notes']:raise ValueError('Explicit usefulness and rationale required')
        metrics[channel]={'reviewed':len(rows),'useful':sum(r['useful'] for r in rows),'sample_useful_precision':sum(r['useful'] for r in rows)/len(rows) if rows else None,
            'classifications':dict(Counter(r['classification'] for r in rows)),
            'supported_quoted_author_attribution':sum(bool(r.get('quoted_author_attribution_supported')) for r in rows)}
    for p in pool['samples']:
        key=tuple(p['stratum']);row=strata.setdefault(key,{'stratum':p['stratum'],'reviewed':0,'useful':0})
        row['reviewed']+=1;row['useful']+=byid[p['sample_id']]['useful']
        if p['sample_channel']=='cocitation':
            base_ranges=sum(e['channel']=='reference' and not e.get('joint_run_id') for e in p['evidence'])
            key='requires-joint-signatures' if base_ranges<2 else 'also-supported-by-base-reference-edges'
            row=origins.setdefault(key,{'origin':key,'reviewed':0,'useful':0});row['reviewed']+=1;row['useful']+=byid[p['sample_id']]['useful']
    recall=read(folder/'known-pair-recall.json');substantive=read(folder/'substantive-known-pair-recall.json');cocitation=read(folder/'cocitation-known-pair-recall.json');verification=read(folder/'population-verification.json')
    if any(x['run_id']!=pool['run_id'] for x in (recall,substantive,cocitation,verification)) or not verification['ok']:raise ValueError('Generation/check mismatch')
    if cocitation['joint_run_id']!=pool['joint_run_id'] or verification['joint_run_id']!=pool['joint_run_id']:raise ValueError('Joint generation mismatch')
    result={'run_id':pool['run_id'],'joint_run_id':pool['joint_run_id'],'reviewer_type':'model-assisted Codex implementation agent; no human or independent reviewer',
        'review_method':'Both located source contexts inspected against pre-frozen rubrics; explicit decisions per pair. Stratified deterministic sample, not unbiased population precision. No tuning on reserved pairs.',
        'pool_sha256':filehash(folder/'evaluation-pool.json'),'raw_known_pair_recall':recall['metrics'],'substantive_known_pair_recall':substantive['metrics'],'cocitation_known_pair_recall':cocitation['metrics'],'metrics':metrics,'stratum_metrics':[strata[k] for k in sorted(strata)],'cocitation_origin_metrics':[origins[k] for k in sorted(origins)],'judgments':labels,
        'known_pair_dependence':{'raw_unique_seeds':recall['unique_seed_windows'],'substantive_unique_seeds':substantive['unique_seed_windows'],'caution':substantive['dependence_caution']},
        'capabilities':{'located-lexical-relationship-candidates':True,'reviewed-population-quotation-attribution':False,'verified-population-canonical-reference-mapping':False,'evaluated-population-useful-relationships':False,'influence':False,'semantic-neighbors':False},
        'limitations':['Known-pair recall is limited to independent phrase-search discoveries, not exhaustive corpus recall.','Unknown work independence, common-feature suppression, group representative bounds, unsupported languages and window boundaries remain explicit.','Source checks establish location, not author endorsement or historical influence.','Review found synthetic editorial markers, publisher boilerplate, same-work repeats and inherited canonical reference mismappings. Candidate release does not certify these mappings or population usefulness.']}
    dump(folder/'quality.json',result);print(packed({k:v for k,v in result.items() if k!='judgments'}))

if __name__=='__main__':main()
