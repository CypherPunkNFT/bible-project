"""Additional frozen coarse-location stratum; original freeze retained intact.

Frozen before development tuning. Uses source sampling, never extractor output.
"""
import re,json,hashlib
from collections import Counter
from .freeze import CUES,GROUPS
from .inputs import Inputs,ROOT,write_json,read,sha
from ..section_contract import resolve_segment

def main():
    path=ROOT/'evaluation/frozen-extra.json'
    if path.exists():print('Already frozen',sha(path));return
    i=Inputs();old=read(ROOT/'evaluation/frozen.json');used={c['document_id'] for c in old['cases']};counts=Counter();chosen=[];cases=[]
    for r in i.descriptors():
        d=json.loads(r['descriptor_json'])
        if r['disposition']!='supported' or d.get('language')!='en' or d.get('characters',0)<2000 or r['document_id'] in used:continue
        a=(d.get('author_label') or '').lower();g=next((g for g in GROUPS if g in a),None)
        if g is None or counts[g]>=2:continue
        counts[g]+=1;chosen.append((r['document_id'],d,g,'development' if counts[g]==1 else 'reserved'))
    for doc,d,g,split in chosen:
        seen=set();per=Counter()
        for r in sorted(i.segments(doc),key=lambda r:(r['end']-r['start'])):
            if r['state']=='candidate-unreviewed':continue
            text=resolve_segment(r,i.prepared)
            # Preserve line wrapping inside a punctuated sentence.
            for m in re.finditer(r'[^.!?]+(?:[.!?]+[”\"]?|$)',text):
                t=m.group();cats=[k for k,p in CUES.items() if re.search(p,t.replace('ſ','s'),re.I)];cat=next((c for c in cats if per[c]<1),None)
                if cat is None or not 45<len(t)<2000:continue
                a,b=r['start']+m.start(),r['start']+m.end();key=(r['path'],r['block_ordinal'],a,b)
                if key in seen:continue
                seen.add(key);per[cat]+=1
                cases.append({'id':'case-'+hashlib.sha256(str(key).encode()).hexdigest()[:20],'split':split,'group':g,'category':cat,'stratum':'coarse-location-source-expansion','document_id':doc,'version_id':r['version_id'],'segment_ordinal':r['ordinal'],'start':a,'end':b,'sentence':t,'context':text[max(0,m.start()-500):min(len(text),m.end()+500)],'sentence_sha256':hashlib.sha256(t.encode()).hexdigest(),'source_segment':{k:r[k] for k in ['coordinate','path','asset_sha256','block_ordinal','locator','start','end','block_text_sha256','span_sha256']},'descriptor':d,'expected':None})
            if len(per)==5:break
    write_json(path,{**{k:v for k,v in old.items() if k!='cases'},'version':'kr130-evaluation-extra-v1','original_freeze_sha256':sha(ROOT/'evaluation/frozen.json'),'cases':cases});i.close()
    print(json.dumps({'cases':len(cases),'splits':dict(Counter(c['split'] for c in cases)),'sha256':sha(path)}))
if __name__=='__main__':main()
