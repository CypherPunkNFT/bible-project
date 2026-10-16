"""Frozen held-pair recall and reproducible, stratified candidate review pools."""
import argparse
from collections import defaultdict,Counter
import heapq
import json
from .relationship_miner import root
from .relationship_query import Relationships,query_identity
from .concept_index import read,filehash
from .inputs import packed,digest
from .build import dump

def sample():
    target=root()/'evaluation-pool.json'
    if target.exists():
        old=read(target)
        if old['run_id']!=read(root()/'population.json')['run_id'] or old['joint_run_id']!=read(root()/'joint-population.json')['run_id']:raise ValueError('Old evaluation pool belongs to a different generation; preserve/archive it before a new evaluation')
        if old.get('query_identity')!=query_identity():raise ValueError('Old evaluation pool has different query/helper/environment dependencies')
        print(packed({'unchanged':True,'path':str(target)}));return
    engine=Relationships();db=engine.db;run=engine.run
    try:
        db.execute('ATTACH DATABASE ? AS parent',(engine.inputs.pointer['database'],))
        sql='''WITH all_evidence AS (
            SELECT left_window,right_window,channel,feature FROM pair_evidence WHERE run_id=?
            UNION SELECT j.left_window,j.right_window,'reference',x.value FROM joint_pairs j,json_each(j.feature) x WHERE j.run_id=?)
            SELECT p.*,a.language left_language,b.language right_language FROM
            (SELECT left_window,right_window,sum(channel='wording') wording,sum(channel='reference') refs
            FROM all_evidence GROUP BY left_window,right_window) p
            JOIN parent.windows wa ON wa.id=p.left_window JOIN scope a ON a.run_id=? AND a.document_id=wa.document_id
            JOIN parent.windows wb ON wb.id=p.right_window JOIN scope b ON b.run_id=? AND b.document_id=wb.document_id
            WHERE wording>0 OR refs>=2'''
        heaps=defaultdict(list);counts=Counter()
        for row in db.execute(sql,(run,engine.joint,run,run)):
            row=dict(row);lang='en/enm' if row['left_language'] in ('en','enm') and row['right_language'] in ('en','enm') else 'non-English-same' if row['left_language']==row['right_language'] else 'mixed-language-labels'
            for channel,n in [('wording',row['wording']),('cocitation',row['refs'])]:
                if n<(2 if channel=='cocitation' else 1):continue
                stratum=(channel,'single' if n==1 else 'multiple',lang);counts[stratum]+=1
                priority=int(digest(['kr120-population-review-v1',channel,row['left_window'],row['right_window']]),16)
                item=(-priority,row['left_window'],row['right_window']);heap=heaps[stratum]
                if len(heap)<24:heapq.heappush(heap,item)
                elif item>heap[0]:heapq.heapreplace(heap,item)
        samples=[]
        for channel in ('wording','cocitation'):
            lists={k:sorted(v,reverse=True) for k,v in heaps.items() if k[0]==channel};taken=0
            while lists and taken<24:
                for key in sorted(list(lists)):
                    item=lists[key].pop(0);pair=engine.pair(item[1],item[2]);pair['sample_id']=channel+'-'+digest([item[1],item[2]])[:20];pair['sample_channel']=channel;pair['stratum']=key
                    samples.append(pair);taken+=1
                    if not lists[key]:del lists[key]
                    if taken==24:break
        value={'run_id':run,'joint_run_id':engine.joint,'query_identity':engine.query_identity,'query_code_sha256':filehash(__file__.replace('relationship_evaluate.py','relationship_query.py')),
            'method':'Deterministic SHA256 bottom-k within channel/feature-count/language-label strata, round-robin up to 24 per channel; stratified review precision is not an unbiased population estimate',
            'population_strata':[{'stratum':k,'pairs':v} for k,v in sorted(counts.items())],'samples':samples}
        dump(target,value);print(packed({'samples':len(samples),'population_strata':value['population_strata']}))
    finally:engine.close()

def recall(substantive=False):
    engine=Relationships();name='substantive-known-pairs-frozen.json' if substantive else 'known-pairs-frozen.json';frozen=read(root()/name);rows=[]
    try:
        if frozen['parent_run']!=engine.inputs.run:raise ValueError('Known-pair parent mismatch')
        for pair in frozen['pairs']:
            a,b=pair['left_window'],pair['right_window']
            found=engine.db.execute("SELECT count(*) FROM pair_evidence WHERE run_id=? AND left_window=? AND right_window=? AND channel='wording'",(engine.run,a,b)).fetchone()[0]
            common=[dict(r) for r in engine.db.execute('''SELECT a.feature,s.disposition,s.postings FROM postings a INDEXED BY postings_window CROSS JOIN postings b ON b.run_id=a.run_id AND b.channel=a.channel AND b.feature=a.feature
                JOIN feature_stats s ON s.run_id=a.run_id AND s.channel=a.channel AND s.feature=a.feature
                WHERE a.run_id=? AND a.channel='wording' AND a.window_id=? AND b.window_id=?''',(engine.run,a,b))]
            reason='recovered' if found else 'no-common-selected-fingerprint' if not common else 'frequent-feature-deferred' if all(x['disposition']=='frequent-feature-deferred' for x in common) else 'bounded-group-representative-or-other-pair-limit'
            rows.append({'id':pair['id'],'split':pair['split'],'left_window':a,'right_window':b,'matching_tokens':pair['matching_tokens'],'recovered':bool(found),'reason':reason,'shared_features':len(common)})
        metrics={}
        for split in ('development','reserved'):
            values=[r for r in rows if r['split']==split];metrics[split]={'known_pairs':len(values),'recovered':sum(r['recovered'] for r in values),'recall':sum(r['recovered'] for r in values)/len(values) if values else None,'failures':dict(Counter(r['reason'] for r in values if not r['recovered']))}
        value={'run_id':engine.run,'oracle_sha256':filehash(root()/name),'reviewer_type':'deterministic source-verified overlap oracle, not human or semantic review','metrics':metrics,'pairs':rows,'limitations':frozen['limitations'],
            'unique_seed_windows':len({p['seed_window'] for p in frozen['pairs']}),
            'unique_endpoint_documents':len({p[side]['document_id'] for p in frozen['pairs'] for side in ('seed_proof','other_proof')}),
            'dependence_caution':'Pairs can share seed windows, works or passages; they are not independent statistical trials and splits are not document-disjoint.'}
        dump(root()/('substantive-known-pair-recall.json' if substantive else 'known-pair-recall.json'),value);print(packed({k:v for k,v in value.items() if k!='pairs'}))
    finally:engine.close()

def review(start,count):
    pool=read(root()/'evaluation-pool.json')
    for i,p in enumerate(pool['samples'][start:start+count],start):
        print(packed({'index':i,'sample_id':p['sample_id'],'channel':p['sample_channel'],'stratum':p['stratum'],'wording_features':p['wording_features'],'shared_reference_ranges':p['shared_reference_ranges'],'independence':p['independence']}))
        for side in ('left','right'):
            w=p[side];d=w['provenance']
            print(packed({'side':side,'window_id':w['id'],'author_label':w['author_label'],'title':d.get('title'),'heading':w['section_heading'],'language':w['language'],'work_id':w['work_id'],'edition_id':w['edition_id'],'context':' '.join(w['context'].split())}))
        print(packed({'features':[{'channel':e['channel'],'feature':e['feature'],'left':e['left_literal'],'right':e['right_literal']} for e in p['evidence']], 'aligned_islands':p['aligned_islands']}))

def cocitation_recall():
    engine=Relationships();frozen=read(root()/'cocitation-known-pairs-frozen.json');rows=[]
    try:
        if frozen['parent_run']!=engine.inputs.run:raise ValueError('Co-citation oracle parent mismatch')
        for p in frozen['pairs']:
            a,b=p['left_window'],p['right_window']
            features={r[0] for r in engine.db.execute("SELECT feature FROM pair_evidence WHERE run_id=? AND left_window=? AND right_window=? AND channel='reference'",(engine.run,a,b))}
            base_ranges=len(features)
            for r in engine.db.execute('SELECT feature FROM joint_pairs WHERE run_id=? AND left_window=? AND right_window=?',(engine.joint,a,b)):features.update(json.loads(r[0]))
            rows.append({'id':p['id'],'split':p['split'],'left_window':a,'right_window':b,'known_shared_ranges':len(p['shared_ranges']),'base_only_ranges':base_ranges,'base_only_recovered':base_ranges>=2,'recovered_ranges':len(features),'recovered':len(features)>=2,
                'reason':'recovered' if len(features)>=2 else 'bounded-frequency/range-selection/group-representative-miss'})
        metrics={}
        for split in ('development','reserved'):
            selected=[r for r in rows if r['split']==split];metrics[split]={'known_pairs':len(selected),'base_only_recovered':sum(r['base_only_recovered'] for r in selected),'recovered':sum(r['recovered'] for r in selected),'added_recoveries':sum(r['recovered'] and not r['base_only_recovered'] for r in selected),'recall':sum(r['recovered'] for r in selected)/len(selected) if selected else None}
        value={'run_id':engine.run,'joint_run_id':engine.joint,'oracle_sha256':filehash(root()/'cocitation-known-pairs-frozen.json'),'metrics':metrics,'pairs':rows,'unique_seed_windows':len({p['seed_window'] for p in frozen['pairs']}),'limitations':frozen['limitations']}
        dump(root()/'cocitation-known-pair-recall.json',value);print(packed({k:v for k,v in value.items() if k!='pairs'}))
    finally:engine.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sample',action='store_true');p.add_argument('--recall',action='store_true');p.add_argument('--substantive-recall',action='store_true');p.add_argument('--cocitation-recall',action='store_true');p.add_argument('--review',type=int);p.add_argument('--count',type=int,default=2);a=p.parse_args()
    if a.sample:sample()
    elif a.recall:recall()
    elif a.substantive_recall:recall(True)
    elif a.cocitation_recall:cocitation_recall()
    elif a.review is not None:review(a.review,a.count)
    else:p.error('Choose --sample, --recall or --review')
