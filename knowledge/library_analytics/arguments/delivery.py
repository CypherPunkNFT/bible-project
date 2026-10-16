"""Finite private closeout after the complete, verified KR-130 population."""
import json,time
from .inputs import ROOT,read,write_json
from .operator import serialized
from . import examples,report,release,verify_release,diagnose,record_runtime

def main():
    pop=read(ROOT/'population.json');verification=read(ROOT/'population-verification.json')
    if pop['state']!='population-complete' or not verification['ok'] or verification['run_id']!=pop['run_id']:raise ValueError('Complete matching population verification required before closeout')
    started=time.time();diagnose.main();record_runtime.main()
    serialized('located-private-queries',examples.main)
    serialized('immutable-private-exports',release.release)
    serialized('independent-export-verification',verify_release.main)
    serialized('completed-export-idempotence',release.release)
    serialized('task-specific-result-handoff',report.main)
    delivered=read(ROOT/'delivered-release.json');receipt={'run_id':pop['run_id'],'release_id':delivered['release_id'],'state':'private-candidate-delivery-complete','started_at_unix':started,'finished_at_unix':time.time(),'release_verification':read(ROOT/'release-verification.json')['ok'],'accepted_attribution_and_scope':delivered['capabilities']['accepted_attribution_and_scope'],'global_latest_promoted':False,'shared_coordination_files_edited':False,'stopped_after_KR130':True}
    write_json(ROOT/'delivery-complete.json',receipt);print(json.dumps(receipt,indent=2))
    # Explicit later user authorization can attach existing finite owner
    # workflows. This is loaded after the current population verification,
    # without restarting it or installing a separate waiting process.
    from .continuation import run as continue_authorized_workflows
    continue_authorized_workflows()
if __name__=='__main__':main()
