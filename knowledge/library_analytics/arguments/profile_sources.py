import json
from collections import Counter
from .inputs import Inputs
from ..section_contract import resolve_segment
def main():
    i=Inputs();shown=Counter()
    for r in i.descriptors():
        if r['disposition']!='supported':continue
        d=json.loads(r['descriptor_json']);a=d.get('author_label') or '';t=d.get('title') or ''
        group=next((g for g in ['aquinas','owen','gill','spurgeon','bunyan','luther','edwards'] if g in (a+' '+t).lower()),None)
        if group is None or shown[group]>=3 or d.get('language')!='en' or d.get('characters',0)<2000:continue
        shown[group]+=1;ss=i.segments(r['document_id']);good=[s for s in ss if s['kind']!='document-representation' and s['state']!='candidate-unreviewed']
        print(json.dumps({'group':group,'id':r['document_id'],'title':t,'author':a,'characters':d.get('characters'),'sections':len(ss),'kinds':dict(Counter(s['kind'] for s in ss)),'text':resolve_segment(good[0],i.prepared)[:800] if good else None},ensure_ascii=False))
    i.close()
if __name__=='__main__':main()
