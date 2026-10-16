"""Frozen located content evaluation, with blind source judgments kept separate."""
import argparse,json,re
from collections import Counter,defaultdict
from .inputs import ROOT,read,sha,write_json
from .extractor import extract
from ..section_contract import resolve_segment,text_hash

def normalize(text):return re.sub(r'\s+',' ',text.replace('ſ','s').casefold()).strip()

def rhetorical(item):
    if item is None:return 'missing'
    if item.get('kind')=='quotation' or item['speaker_role']=='quoted-speaker':return 'quotation'
    return {'reported-statement':'report','objection':'objection','reply':'reply'}.get(item['kind'],'plain')

def candidate(case,prepared):
    # Reconstruct the frozen source span, never evaluate a hallucinated snippet.
    body=resolve_segment(case['source_segment'],prepared)
    a,b=case['start']-case['source_segment']['start'],case['end']-case['source_segment']['start']
    if text_hash(body[a:b])!=case['sentence_sha256']:raise ValueError('Frozen case source changed')
    left=len(body[a:b])-len(body[a:b].lstrip());right=len(body[a:b].rstrip());a+=left;b=case['start']-case['source_segment']['start']+right
    results,stats=extract(body,case['descriptor'].get('author_label'));eligible=[]
    for parent in results:
        for item in [parent,*parent['quotes']]:
            overlap=max(0,min(b,item['end'])-max(a,item['start']))
            if overlap:
                # Retrieval independent of judgments: maximum target overlap,
                # then smallest complete span, then literal quotation child.
                eligible.append((overlap,-(item['end']-item['start']),item['kind']=='quotation',item,parent))
    if not eligible:return None,{'coverage':0,'statistics':stats}
    _,_,_,item,parent=max(eligible,key=lambda x:x[:3]);value=dict(item)
    value['qualifications']=parent['qualifications'];value['coverage']=max(0,min(b,item['end'])-max(a,item['start']))/max(1,b-a)
    value['full_scope_text']=body[parent['start']:parent['end']]
    return value,{'coverage':value['coverage'],'statistics':stats}

def check(item,gold,case,baseline=False):
    if baseline:
        item={'kind':'statement','speaker_label':case['descriptor'].get('author_label'),'speaker_role':'source-author-candidate','endorsement':'candidate-author-assertion','negation':'no-negation-cue','qualifications':[],'coverage':1,'full_scope_text':case['sentence']}
    complete=bool(item) and item.get('coverage',0)>=0.95
    type_ok=complete and rhetorical(item)==gold['type']
    protected=bool(item) and item['endorsement'] in ('unresolved','not-endorsed')
    speaker=gold['speaker']
    if not item:attribution=False
    elif speaker=='source-author':attribution=item['speaker_role']=='source-author-candidate' and item.get('speaker_label')==case['descriptor'].get('author_label')
    elif speaker=='unresolved':attribution=item.get('speaker_label') is None and item['speaker_role']!='source-author-candidate'
    elif speaker in ('editor','institution','provider','scripture'):
        # Named source metadata alone cannot establish these actual roles.
        roles={'editor':['editor-or-provider-unresolved'],'provider':['editor-or-provider-unresolved'],'institution':['institution'],'scripture':['scripture-speaker']}
        attribution=item.get('speaker_role') in roles[speaker]
    else:attribution=bool(item.get('speaker_label')) and normalize(speaker) in normalize(item['speaker_label'])
    attribution=complete and attribution and (not gold['must_protect'] or protected)
    negation=complete and (item['negation']=='negation-cue')==gold['negation']
    required=gold['qualifications'];scope=True
    for literal in required:
        # Source judgments can modernize s/y interchange in their prose reason,
        # but gold witness matching itself records strict literal failure.
        scope=scope and bool(item) and any(normalize(literal) in normalize(q['literal']) for q in item.get('qualifications',[]))
    return {'complete_located_unit':complete,'rhetorical_type':type_ok,'attribution':attribution,'protected_non_author':protected if gold['must_protect'] else None,'negation':negation,'qualification_scope':scope if required else None}

def evaluate(split):
    cases=read(ROOT/'evaluation/frozen.json')['cases']+read(ROOT/'evaluation/frozen-extra.json')['cases']
    review_path=ROOT/'evaluation'/f'{split}-review.json';review=read(review_path);selected=[c for c in cases if c['split']==split]
    if set(c['id'] for c in selected)!=set(review['judgments']):raise ValueError('Incomplete or extra source judgments')
    summary={};results=[];prepared={};strata=defaultdict(Counter)
    for case in selected:
        gold=review['judgments'][case['id']];pred,details=candidate(case,prepared)
        base=check(None,gold,case,True);new=check(pred,gold,case)
        results.append({'case_id':case['id'],'group':case['group'],'category':case['category'],'gold':gold,'prediction':pred,'source_metrics':details,'baseline':base,'processor':new})
        for key,ok in new.items():
            if ok is not None:strata[case['category']][key+'_denominator']+=1;strata[case['category']][key+'_correct']+=int(ok)
    for method in ('baseline','processor'):
        sums={}
        for key in results[0][method]:
            vals=[r[method][key] for r in results if r[method][key] is not None];sums[key]={'correct':sum(vals),'cases':len(vals),'rate':sum(vals)/len(vals) if vals else None}
        summary[method]=sums
    failed=[{'case_id':r['case_id'],'reason':r['gold']['reason'],'failed_metrics':[k for k,v in r['processor'].items() if v is False]} for r in results if any(v is False for v in r['processor'].values())]
    receipt={'split':split,'cases':len(selected),'reviewer':{k:v for k,v in review.items() if k!='judgments'},'review_sha256':sha(review_path),'extractor_sha256':sha(__import__('pathlib').Path(__file__).with_name('extractor.py')),
      'summary':summary,'strata':{k:dict(v) for k,v in strata.items()},'failures':failed,'results':results,
      'limits':['Fresh purposive difficult-source sample; not a random whole-population estimate.','Speaker/role candidate correctness includes required abstention but is separate from theological endorsement.','Reserved documents disjoint from development; repeated work/edition independence reported separately.','Strict gold suffix matching exposes historical spelling and incomplete clause failures; no silent modernization.']}
    write_json(ROOT/'evaluation'/f'{split}-metrics.json',receipt);print(json.dumps({k:receipt[k] for k in ['split','cases','summary']},indent=2))
    return receipt

def main():
    p=argparse.ArgumentParser();p.add_argument('--split',choices=['development','reserved'],required=True);a=p.parse_args();evaluate(a.split)
if __name__=='__main__':main()
