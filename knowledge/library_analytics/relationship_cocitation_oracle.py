"""Independent known co-citation pairs from the immutable parent reference index."""
from collections import defaultdict
from pathlib import Path
import json
from .build import dump
from .concept_index import read,root as concept_root,filehash
from .concept_query import Retriever,question_evidence_issue
from .relationship_miner import root
from .inputs import packed,digest

def main():
    folder=root();target=folder/'cocitation-known-pairs-frozen.json'
    if target.exists():print(packed({'unchanged':True,'sha256':filehash(target)}));return
    plan={'version':'kr120-cocitation-oracle-v1','source':'Parent exact canonical references, independent of KR-120 features/pairs',
        'seed_order':'SHA256 order of prior KR-110 development windows','max_seeds':256,'max_ranges_per_seed':8,'max_neighbors_per_range':2000,
        'max_pairs_per_seed':2,'target_pairs':32,'minimum_distinct_shared_ranges':2,
        'review':'Both endpoints reconstruct and contain actual parent reference witnesses; shared topic/argument remains separately reviewed'}
    path=folder/'cocitation-oracle-plan.json'
    if path.exists() and read(path)!=plan:raise ValueError('Oracle plan changed')
    if not path.exists():dump(path,plan)
    selected=read(concept_root()/'latest-concepts.json');engine=Retriever();pairs={};attempts=[]
    if engine.run!=selected['run_id']:raise ValueError('Parent mismatch')
    seedfile=Path(selected['release'])/'development-results.jsonl';seedids=set()
    for line in seedfile.read_text('utf-8').splitlines():
        for out in json.loads(line)['outputs'].values():seedids.update(r['id'] for r in out['results'])
    def row(wid):return dict(engine.db.execute('SELECT w.*,d.descriptor_json,d.independence_group FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=? AND w.id=?',(engine.run,wid)).fetchone())
    def refs(wid):return [dict(r) for r in engine.db.execute('SELECT * FROM reference_occurrences WHERE window_id=?',(wid,))]
    try:
        for wid in sorted(seedids,key=lambda w:digest(['kr120-cocitation-seed-v1',w]))[:256]:
            source=row(wid);raw=refs(wid);keys=sorted({(r['book'],r['first'],r['last']) for r in raw})[:8]
            if len(keys)<2:continue
            proof=engine.witness(source,300)
            if question_evidence_issue(proof['section_heading'],proof['text']):continue
            candidates=defaultdict(set)
            for key in keys:
                for hit in engine.db.execute('''SELECT DISTINCT w.id FROM reference_occurrences r INDEXED BY reference_lookup
                    JOIN windows w ON w.id=r.window_id JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id
                    WHERE r.book=? AND r.first=? AND r.last=? AND w.run_id=? AND d.independence_group!=?
                    AND w.kind!='document-representation' AND w.state!='candidate-unreviewed' ORDER BY w.id LIMIT 2000''',(*key,engine.run,source['independence_group'])):candidates[hit[0]].add(key)
            added=0;attempts.append({'seed_window':wid,'ranges':len(keys),'candidate_windows':len(candidates)})
            for other_id,shared in sorted(candidates.items(),key=lambda kv:(-len(kv[1]),kv[0])):
                if len(shared)<2:break
                key=tuple(sorted((wid,other_id)))
                if key in pairs:continue
                other=row(other_id);otherproof=engine.witness(other,300)
                if question_evidence_issue(otherproof['section_heading'],otherproof['text']):continue
                proofs=[]
                for side,w,p,rs in [('seed',source,proof,raw),('other',other,otherproof,refs(other_id))]:
                    located=[]
                    for ref in rs:
                        if (ref['book'],ref['first'],ref['last']) not in shared:continue
                        a,b=ref['start']-w['start'],ref['end']-w['start']
                        if not 0<=a<b<=len(p['text']) or p['text'][a:b]!=ref['literal']:raise ValueError('Reference source mismatch')
                        located.append(ref)
                    proofs.append({'side':side,'window':{**w,**p},'references':located})
                pairs[key]={'id':'known-cocitation-'+digest(key)[:24],'seed_window':wid,'other_window':other_id,'left_window':key[0],'right_window':key[1],
                    'shared_ranges':sorted(shared),'proofs':proofs,'truth':'Source-verified co-occurrence of at least two identical canonical ranges, not automatic shared argument or exposition'}
                added+=1
                if added>=2 or len(pairs)>=32:break
            print(packed({'seed_queries':len(attempts),'known_pairs':len(pairs)}),flush=True)
            if len(pairs)>=32:break
        values=sorted(pairs.values(),key=lambda p:digest(['kr120-cocitation-split',p['id']]))
        for i,p in enumerate(values):p['split']='development' if i%2==0 else 'reserved'
        result={'parent_run':engine.run,'plan':plan,'seed_source_sha256':filehash(seedfile),'pairs':values,'attempts':attempts,
            'limitations':'Bounded independent source-reference oracle; pairs can share seed documents/topics and are not independent trials. No exhaustive population recall or useful-topic truth.'}
        dump(target,result);print(packed({'frozen_pairs':len(values),'path':str(target)}))
    finally:engine.close()

if __name__=='__main__':main()
