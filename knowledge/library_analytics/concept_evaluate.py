"""Frozen split retrieval runs; judgments are separate from automated location checks."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
from .concept_index import root,read,filehash
from .concept_query import Retriever
from .build import dump,now
from .inputs import digest,packed

def intent(question):
    prefixes=['Find held sections explaining ','Locate and compare ','Find attributed sermon sections addressing ',
        'Locate evidence for ','Locate held evidence for ','Locate source sections for ']
    suffixes=['; distinguish exposition',', preserving objections',', with their surrounding','; distinguish quotation',
        ', separating event',', preserving language']
    text=question
    for prefix in prefixes:
        if text.startswith(prefix):text=text[len(prefix):];break
    for suffix in suffixes:
        if suffix in text:text=text.split(suffix)[0];break
    return text

def author_choices(engine,names):
    labels=[dict(r) for r in engine.db.execute("SELECT author_label,count(*) n FROM documents WHERE run_id=? AND disposition='supported' AND author_label IS NOT NULL GROUP BY author_label",(engine.run,))]
    result=[]
    for name in names:
        words=re.findall(r'\w+',name.casefold())
        matches=[r for r in labels if all(re.search(r'\b'+re.escape(w)+r'\b',r['author_label'].casefold()) for w in words)]
        matches.sort(key=lambda r:(-r['n'],r['author_label']))
        result.append({'requested':name,'selected_label':matches[0]['author_label'] if matches else None,
            'alternatives':matches,'basis':'most represented complete source author label containing requested name tokens; candidate identity, not canonical resolution'})
    return result

def execute(split,calibration=False,new_development=False):
    folder=root();frozen=read(folder/'evaluation-frozen.json');engine=Retriever(calibration=calibration)
    target=folder/'evaluations'/engine.run;target.mkdir(parents=True,exist_ok=True)
    definition={'index_run':engine.run,'query_code_sha256':filehash(Path(__file__).with_name('concept_query.py')),
        'evaluation_code_sha256':filehash(__file__),'frozen_sha256':filehash(folder/'evaluation-frozen.json'),
        'reviewer':'model-assisted Codex for explicit judgments; deterministic for constraints/hash checks; no human review',
        'created_at':now()}
    method=target/'method-frozen.json'
    if new_development:
        if split!='development' or (target/'reserved-results.jsonl').exists() or (target/'reserved-results.partial.jsonl').exists():
            raise ValueError('Development revision is forbidden after reserved evaluation begins')
        if method.exists():
            old=read(method);archive=target/'development-iterations'/digest(old);archive.mkdir(parents=True,exist_ok=True)
            for name in ('method-frozen.json','development-results.jsonl','development-results.partial.jsonl'):
                src=target/name
                if src.exists():
                    if (archive/name).exists():raise ValueError('Development archive already exists')
                    src.replace(archive/name)
    if method.exists():
        old=read(method)
        if any(old[k]!=definition[k] for k in ('index_run','query_code_sha256','evaluation_code_sha256','frozen_sha256')):
            raise ValueError('Frozen evaluation method changed; preserve reserved run')
    else:
        if split=='reserved':raise ValueError('Freeze method on development first')
        dump(method,definition)
    output=target/(split+'-results.jsonl')
    if output.exists():raise ValueError('Evaluation output exists; immutable')
    temp=output.with_suffix('.partial.jsonl')
    try:
        with temp.open('w',encoding='utf-8') as f:
            for q in frozen['questions']:
                if q['split']!=split:continue
                query=intent(q['question']);constraints=[];author_records=[]
                if q['family']=='author-comparison' and ' on ' in query:
                    people,topic=query.split(' on ',1);names=people.split(' and ')
                    author_records=author_choices(engine,names)
                    constraints=[(topic,a['selected_label']) for a in author_records if a['selected_label']]
                else:constraints=[(query,None)]
                outputs={}
                for mode in ('baseline','concept'):
                    calls=[engine.search(text,mode,author=author) for text,author in constraints]
                    # Alternate authors, up to five, so an author comparison cannot
                    # silently spend every slot on the more numerous author's work.
                    combined=[]
                    for pos in range(5):
                        for call in calls:
                            if len(call['results'])>pos and len(combined)<5:combined.append(call['results'][pos])
                    outputs[mode]={'results':combined,'seconds':sum(c['seconds'] for c in calls),
                        'calls':[{'query':c['query'],'constraints':c['constraints'],'channels':c['channels']} for c in calls]}
                value={**q,'retrieval_query':query,'author_resolution':author_records,'outputs':outputs,
                    'judgment_state':'pending explicit relevance assessment'}
                f.write(packed(value)+'\n');f.flush();print(packed({'split':split,'id':q['id'],'family':q['family'],'counts':{k:len(v['results']) for k,v in outputs.items()}}),flush=True)
        temp.replace(output)
    finally:engine.close()

def review_batch(split,start,count):
    population=read(root()/'population.json');p=root()/'evaluations'/population['run_id']/(split+'-results.jsonl')
    rows=[json.loads(line) for line in p.read_text('utf-8').splitlines()]
    for q in rows[start:start+count]:
        print(packed({'id':q['id'],'family':q['family'],'question':q['retrieval_query'],'authors':q['author_resolution'],
            'results':{mode:[{'id':r['id'],'author':r['author_label'],'title':r['provenance']['title'],
                'heading':r['section_heading'],'kind':r['kind'],'work':r['work_id'],'text':r['context']}
                for r in data['results']] for mode,data in q['outputs'].items()}}))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('split',choices=['development','reserved'])
    p.add_argument('--calibration',action='store_true');p.add_argument('--new-development',action='store_true');p.add_argument('--review',type=int);p.add_argument('--count',type=int,default=4)
    a=p.parse_args()
    if a.review is not None:review_batch(a.split,a.review,a.count)
    else:execute(a.split,a.calibration,a.new_development)
