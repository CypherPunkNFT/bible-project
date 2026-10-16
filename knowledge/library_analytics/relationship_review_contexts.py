"""Display full frozen contexts without repeating every aligned island literal."""
import argparse
from .relationship_miner import root
from .concept_index import read
from .inputs import packed

def main():
    p=argparse.ArgumentParser();p.add_argument('start',type=int);p.add_argument('--count',type=int,default=4);a=p.parse_args()
    rows=read(root()/'evaluation-pool.json')['samples']
    for i,r in enumerate(rows[a.start:a.start+a.count],a.start):
        print(packed({'index':i,'sample_id':r['sample_id'],'channel':r['sample_channel'],'stratum':r['stratum'],'wording_features':r['wording_features'],'shared_reference_ranges':r['shared_reference_ranges'],'independence':r['independence']}))
        for side in ('left','right'):
            w=r[side]
            print(packed({'side':side,'window':w['id'],'author':w['author_label'],'title':w['provenance'].get('title'),'heading':w['section_heading'],'language':w['language'],'work':w['work_id'],'edition':w['edition_id'],'context':' '.join(w['context'].split())}))
        print(packed({'reference_features':[e['feature'] for e in r['evidence'] if e['channel']=='reference'],'wording_anchors':[e['left_literal'] for e in r['evidence'] if e['channel']=='wording'],'island_tokens':[e['tokens'] for e in r['aligned_islands']]}))

if __name__=='__main__':main()
