"""Blind pooled evidence presentation; explicit model judgments remain separate inputs."""
import argparse
import json
import re
from .concept_index import root,read
from .inputs import packed,digest

def main(split,start,count,brief=False,partial=False):
    run=read(root()/'population.json')['run_id'];folder=root()/'evaluations'/run
    if partial and split!='development':raise ValueError('Partial inspection is development-only')
    path=folder/(split+'-results'+('.partial' if partial else '')+'.jsonl')
    content=path.read_text('utf-8');lines=content.splitlines()
    if partial and content and not content.endswith('\n'):lines=lines[:-1]
    rows=[json.loads(l) for l in lines]
    for index,q in enumerate(rows[start:start+count],start):
        pooled={r['id']:r for out in q['outputs'].values() for r in out['results']}
        ordered=sorted(pooled.values(),key=lambda r:digest({'question':q['id'],'window':r['id']}))
        print(packed({'index':index,'question_id':q['id'],'family':q['family'],'question':q['retrieval_query'],
            'expected_evidence':q['expected_evidence'],'requested_authors':[a['selected_label'] for a in q['author_resolution']],
            'candidates':[{'window_id':r['id'],'source_author_label':r['author_label'],'attribution_conflicts':r.get('attribution_conflicts'),
                'contributors':r['provenance'].get('memberships'),'work_id':r.get('work_id'),'edition_id':r.get('edition_id'),
                'language':r.get('language'),
                'title':r['provenance']['title'],'genre':r['provenance'].get('genre'),'heading':r['section_heading'],'kind':r['kind'],
                'text':re.sub(r'\s+',' ',r['context'][:350] if brief else r['context']).strip()} for r in ordered]}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('split',choices=['development','reserved']);p.add_argument('start',type=int);p.add_argument('--count',type=int,default=3);p.add_argument('--brief',action='store_true')
    p.add_argument('--partial',action='store_true')
    a=p.parse_args();main(a.split,a.start,a.count,a.brief,a.partial)
