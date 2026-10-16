"""Freeze fresh located difficult cases before extractor development/tuning.

Finder is an independent explicit surface-cue sampler, not a gold annotator.
Source documents are partitioned before sampling; no document crosses splits.
"""
import json,re,hashlib
from collections import Counter
from .inputs import Inputs,ROOT,SECTION_RUN,ALIGNMENT_RUN,write_json,sha
from ..section_contract import resolve_segment

CUES={
 'objection':r'\b(?:objection\s*\d*|it (?:may|might) be (?:said|objected)|some (?:say|argue)|you will say)\b',
 'reply':r'\b(?:I answer that|I reply|reply to objection|on the contrary|I respond|answer[.:])',
 'report':r'\b(?:says|saith|said|writes|wrote)\b',
 'qualification':r'\b(?:unless|except|only if|provided that|in so far as|not always|not necessarily)\b',
 'negation':r'\b(?:not|never|neither|cannot)\b',
}
GROUPS=['aquinas','owen','gill','calvin','augustine','chrysostom','spurgeon','baxter','bunyan','flavel','luther','edwards']
SENTENCE=re.compile(r'[^.!?\n]+(?:[.!?]+[\u201d\"]?|\n|$)')

def freeze():
    folder=ROOT/'evaluation';folder.mkdir(parents=True,exist_ok=True)
    target=folder/'frozen.json'
    if target.exists():print('Already frozen',sha(target));return
    inputs=Inputs();chosen={};counts=Counter();cases=[]
    for row in inputs.descriptors():
        if row['disposition']!='supported':continue
        d=json.loads(row['descriptor_json'])
        if d.get('language')!='en':continue
        label=(d.get('author_label') or '').lower();group=next((g for g in GROUPS if g in label),None)
        if not group:continue
        counts[group]+=1
        # First two source descriptors per author: first development, second reserved.
        if counts[group]<=2:chosen[row['document_id']]=(group,'development' if counts[group]==1 else 'reserved',d)
    for doc,(group,split,d) in chosen.items():
        per=Counter();seen=set();prepared={}
        rows=inputs.segments(doc)
        for row in sorted(rows,key=lambda r:r['end']-r['start']):
            if row['kind']=='document-representation' or row['state']=='candidate-unreviewed':continue
            text=resolve_segment(row,prepared)
            for m in SENTENCE.finditer(text):
                sentence=m.group();categories=[k for k,v in CUES.items() if re.search(v,sentence,re.I)]
                if not categories or len(sentence.strip())<45 or len(sentence)>2000:continue
                cat=next((c for c in categories if per[c]<1),None)
                if cat is None:continue
                a,b=row['start']+m.start(),row['start']+m.end();key=(row['path'],row['block_ordinal'],a,b)
                if key in seen:continue
                seen.add(key);per[cat]+=1
                cases.append({'id':'case-'+hashlib.sha256(str(key).encode()).hexdigest()[:20],'split':split,'group':group,'category':cat,
                    'document_id':doc,'version_id':row['version_id'],'segment_ordinal':row['ordinal'],'start':a,'end':b,
                    'sentence':sentence,'context':text[max(0,m.start()-500):min(len(text),m.end()+500)],
                    'sentence_sha256':hashlib.sha256(sentence.encode()).hexdigest(),'source_segment':{k:row[k] for k in ['coordinate','path','asset_sha256','block_ordinal','locator','start','end','block_text_sha256','span_sha256']},
                    'descriptor':d,'expected':None})
            if len(per)==5:break
    plan={'version':'kr130-evaluation-v1','parents':[SECTION_RUN,ALIGNMENT_RUN],'parent_proofs':inputs.proofs,
      'baseline':'Every located sentence with an explicit cue is a statement endorsed by the document author; no objections, quotes, polarity or qualification handling.',
      'reviewer_type':'model-assisted implementation-agent content review; no human or independent reviewer',
      'model':'GPT-6 (session model; exact backend revision unavailable)','prompt_version':'kr130-content-rubric-v1',
      'prompt':'Read exact sentence and neighboring source context. Label rhetorical type, speaker basis, endorsement, lexical negation and explicit qualification cues. Unresolved speaker is acceptable only where source does not establish one. Objections and reports never inherit author endorsement. Scope quality requires retaining actual limiting words and evidence offsets. No doctrinal truth inference.',
      'external_generation_calls':0,'external_generation_cost_usd':0,'session_review_cost':'not exposed by platform',
      'split_rule':'First selected source descriptor per named author development; second reserved. Documents disjoint, works may be repeated editions and are reported; cases freshly sampled, not inherited KR-110/120 gold.',
      'metrics':['exact rhetorical type','non-author/quoted endorsement protection','lexical negation detection','explicit qualification witness recall','correct full attribution including unresolved versus named speaker'],
      'acceptance':'Candidate capability only unless reserved attribution and scope correctness each >=0.95; report failure classes and sample bounds. Location round trips separate from content accuracy.',
      'cases':cases}
    write_json(target,plan);inputs.close();print(json.dumps({'path':str(target),'sha256':sha(target),'cases':len(cases),'splits':dict(Counter(c['split'] for c in cases)),'categories':dict(Counter(c['split']+':'+c['category'] for c in cases))},default=str))

if __name__=='__main__':freeze()
