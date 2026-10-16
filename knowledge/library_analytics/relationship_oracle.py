"""Freeze held-text known pairs using independent phrase lookup, before scoring KR-120."""
import difflib
import hashlib
import json
import argparse
import re
from pathlib import Path
from .build import dump
from .concept_index import read,root as concept_root,filehash
from .concept_query import Retriever,question_evidence_issue
from .relationship_contract import tokens
from .relationship_miner import root
from .inputs import packed,digest

def main(substantive=False):
    target=root()/('substantive-known-pairs-frozen.json' if substantive else 'known-pairs-frozen.json')
    if target.exists():print(packed({'unchanged':True,'sha256':filehash(target)}));return
    if substantive:
        plan={'version':'kr120-substantive-oracle-v1','basis':'Supplementary evaluation only; existing raw known-pair freeze retained unchanged and mining algorithm not tuned',
            'exclude':'Source/candidate windows with copyright/rights/license/download/site/URL boilerplate or existing apparatus/short-prose flags',
            'max_pairs_per_seed':2,'max_seed_windows':256,'target_pairs':32,'minimum_matching_tokens':32,
            'truth':'Substantive wording overlap candidates; common Scripture, same-work editions and quotation attribution still require explicit classification'}
        planpath=root()/'substantive-oracle-plan.json'
        if planpath.exists() and read(planpath)!=plan:raise ValueError('Supplementary oracle plan changed')
        if not planpath.exists():dump(planpath,plan)
    engine=Retriever();selected=read(concept_root()/'latest-concepts.json')
    if engine.run!=selected['run_id']:raise ValueError('Oracle parent mismatch')
    seedfile=Path(selected['release'])/'development-results.jsonl';seedids=set()
    for line in seedfile.read_text('utf-8').splitlines():
        q=json.loads(line)
        for output in q['outputs'].values():seedids.update(r['id'] for r in output['results'])
    ordered=sorted(seedids,key=lambda w:digest(['kr120-oracle-seed-v1',w]));pairs={};attempts=[]
    def row(wid):
        return dict(engine.db.execute('SELECT w.*,d.descriptor_json,d.independence_group,d.work_id,d.language FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=? AND w.id=?',(engine.run,wid)).fetchone())
    try:
        for wid in ordered[:256]:
            source=row(wid);proof=engine.witness(source,300);words=tokens(proof['text'])
            if len(words)<40:continue
            def unsuitable(p):
                return question_evidence_issue(p['section_heading'],p['text']) or re.search(r'copyright|all rights reserved|monergism|truth for life|https?://|www\.|download|terms of use|permission to reproduce|creative commons',p['text'],re.I)
            if substantive and unsuitable(proof):continue
            offset=max(0,len(words)//2-8);phrase=' '.join(t[0] for t in words[offset:offset+16])
            # FTS's phrase matcher is independent of the winnowing/pairing implementation.
            sql='SELECT w.id FROM '+engine.fts+' JOIN windows w ON w.id='+engine.fts+'.rowid JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE '+engine.fts+' MATCH ? AND w.run_id=? AND d.independence_group!=? AND w.kind!=? AND w.state!=? ORDER BY '+engine.fts+'.rank LIMIT 20'
            found=engine.db.execute(sql,('"'+phrase.replace('"','""')+'"',engine.run,source['independence_group'],'document-representation','candidate-unreviewed')).fetchall()
            attempts.append({'seed_window':wid,'phrase':phrase,'candidates':len(found)})
            added=0
            for hit in found:
                other=row(hit['id']);p=engine.witness(other,300);otherwords=tokens(p['text'])
                if substantive and unsuitable(p):continue
                blocks=difflib.SequenceMatcher(None,[t[0] for t in words],[t[0] for t in otherwords],autojunk=False).get_matching_blocks()
                match=max(blocks,key=lambda b:b.size)
                if match.size<(32 if substantive else 16):continue
                key=tuple(sorted([wid,hit['id']]))
                if key in pairs:continue
                pairs[key]={'id':'known-'+digest(key)[:24],'seed_window':wid,'other_window':hit['id'],'left_window':key[0],'right_window':key[1],
                    'matching_tokens':match.size,'seed_start':source['start']+words[match.a][1],'seed_end':source['start']+words[match.a+match.size-1][2],
                    'other_start':other['start']+otherwords[match.b][1],'other_end':other['start']+otherwords[match.b+match.size-1][2],
                    'seed_proof':{**source,**proof},'other_proof':{**other,**p},
                    'truth':'Deterministic located normalized overlap, not reviewed quotation/influence or independent-work truth'}
                added+=1
                if substantive and added>=2:break
                if len(pairs)>=32:break
            print(packed({'seed_queries':len(attempts),'known_pairs':len(pairs)}),flush=True)
            if len(pairs)>=32:break
        values=sorted(pairs.values(),key=lambda p:digest(['kr120-split',p['id']]))
        for i,p in enumerate(values):p['split']='development' if i%2==0 else 'reserved'
        result={'parent_run':engine.run,'method':'Independent FTS 16-token phrase oracle + full source reconstruction + SequenceMatcher normalized token verification',
            'seed_source_sha256':filehash(seedfile),'seed_basis':'Previously observed KR-110 development windows, hash-ordered; separate new relationship pairs, not a claim of unseen documents/topics',
            'limitations':'At most 256 seed windows and 20 phrase candidates per seed; stops at 32 known pairs. Recall conditional on these discovered pairs; does not measure exhaustive library recall or semantic similarity.',
            'supplementary_substantive':substantive,
            'attempts':attempts,'pairs':values}
        dump(target,result);print(packed({'frozen_pairs':len(values),'development':sum(x['split']=='development' for x in values),'reserved':sum(x['split']=='reserved' for x in values),'path':str(target)}))
    finally:engine.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--substantive',action='store_true');a=p.parse_args();main(a.substantive)
