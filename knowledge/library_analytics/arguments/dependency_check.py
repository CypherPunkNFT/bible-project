"""Bounded actual HTML reconstruction check after scoped dependency repair."""
import json
from .inputs import ROOT,Inputs,read,write_json,runtime_dependencies,sha
from ..section_contract import resolve_segment
def main():
    failures=read(ROOT/'failed-attempts.json');i=Inputs();checks=[]
    for f in failures['failed_job_receipts']:
        doc=f['scope'].removeprefix('document:');rows=i.segments(doc);n=0
        for r in rows:
            resolve_segment(r,i.prepared);n+=1
        checks.append({'document_id':doc,'source_title':f['source_title'],'reconstructed_segments':n,'ok':True,'previous_error':f['error']})
    i.close();result={'changed_condition':'Installed missing typing_extensions 4.15.0 only under owned arguments/dependencies; global Python and other workstreams untouched.','old_generation':failures['runs'],'runtime_dependencies':runtime_dependencies(),'install_receipt_sha256':sha(ROOT/'dependency-install.json'),'actual_html_checks':checks,'recovery_policy':'Explicit new processor/environment generation; no old fact reuse or hiding earlier failed jobs.','classification_rules_changed':False};write_json(ROOT/'dependency-resolution.json',result);print(json.dumps(result,indent=2))
if __name__=='__main__':main()
