"""Read-only inspection of the declared calibration strata."""
import json
from pathlib import Path
from collections import Counter
from .inputs import Inputs,ROOT,write_json
def main():
    i=Inputs();strata=Counter();first={};n=0
    for row in i.descriptors():
        d=json.loads(row['descriptor_json'])
        if row['disposition']!='supported' or d.get('language')!='en':continue
        key=str((row['adapter'],d.get('source_family'),Path(d.get('source_path') or '').suffix,bool(d.get('readers'))));strata[key]+=1;n+=1
        if key not in first:first[key]={'document_id':row['document_id'],'title':d.get('title'),'xml_link':d.get('xml_link')}
    i.close();result={'declared_supported_documents':n,'strata':[{'stratum':k,'population':v,'calibration_documents':min(2,v),'first':first[k]} for k,v in strata.items()],'calibration_expected_documents':sum(min(2,n) for n in strata.values()),'policy':'Two source-descriptor representatives per adapter/source-family/original-format/reader-presence stratum; content evaluation also uses independently frozen difficult cases.'};write_json(ROOT/'calibration-plan.json',result);print(json.dumps(result,indent=2))
if __name__=='__main__':main()
