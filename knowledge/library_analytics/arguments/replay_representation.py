"""Bounded real-document integration test of native-render deferral."""
import json,tempfile
from pathlib import Path
from .inputs import ROOT,Inputs,read,ro,write_json
from .processor import process
from .contract import SCHEMA
from .reconstruct import SCHEMA as RECONSTRUCTION_SCHEMA
from ..jobs import JobStore
def main():
    i=Inputs();old=ro(ROOT/'arguments.sqlite3');f=next(x for x in read(ROOT/'failed-attempts.json')['failed_job_receipts'] if x['error']=='Block text changed');doc=f['scope'].removeprefix('document:');row=dict(old.execute('SELECT * FROM scope WHERE run_id=? AND document_id=?',(f['run_id'],doc)).fetchone());old.close();folder=ROOT/'tests';folder.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=folder) as tmp:
        s=JobStore(Path(tmp)/'replay.sqlite3');s.acquire();s.db.executescript(SCHEMA+RECONSTRUCTION_SCHEMA);s.register('bounded-integration','j','arguments','doc','fp','reconstruction-deferral-test')
        state=s.execute('j',lambda db:process(i,db,'bounded-integration',row));result={'source_document_id':doc,'job_state':state,'statistics':dict(s.db.execute('SELECT * FROM document_results').fetchone()),'deferrals':[dict(x) for x in s.db.execute('SELECT * FROM reconstruction_deferrals')],'proof_scope':'One actual failing document, isolated integration test; full population still required.'}
        if state!='completed' or result['statistics']['statements']<1 or not result['deferrals']:raise RuntimeError('Actual source/cache deferral integration failed')
        s.close();write_json(ROOT/'tests/representation-deferral-integration.json',result);print(json.dumps(result,indent=2))
    i.close()
if __name__=='__main__':main()
