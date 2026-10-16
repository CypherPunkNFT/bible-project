"""Substantive same-generation population proof, beyond empty XML index jobs."""
import argparse,json
from pathlib import Path
from .inputs import ROOT,ro,read,write_json
from .checkpoint_proof import snapshot
from ..jobs import JobStore
from ..build import PROJECT

def main():
    p=argparse.ArgumentParser();p.add_argument('--capture',action='store_true');a=p.parse_args();shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        shared.acquire();path=ROOT/'population-nonempty-interruption-snapshot.json'
        if a.capture:
            rid=read(ROOT/'progress.json')['run_id'];db=ro(ROOT/'arguments.sqlite3')
            docs=[r[0] for r in db.execute("SELECT document_id FROM document_results WHERE run_id=? AND document_id LIKE 'library:text:%' AND statements>0 ORDER BY document_id LIMIT 16",(rid,))];db.close()
            if len(docs)<4:raise ValueError('Substantial located prose must be committed before this proof')
            before=snapshot(rid,docs)
            if before['counts']['statements']<100:raise ValueError('Recovery proof requires actual statement/qualification facts')
            write_json(path,before);print(json.dumps({'run_id':rid,'documents':len(docs),'actual_facts':before['counts'],'facts_sha256':before['facts_sha256']}));return
        before=read(path);after=snapshot(before['run_id'],before['documents']);same=before==after
        result={'run_id':before['run_id'],'actual_nonempty_committed_documents':len(before['documents']),'before':before,'after':after,'facts_and_attempts_unchanged':same,'proof':'Actual native population worker interrupted after prose facts existed, then resumed in exactly the same generation; complements first 128 XML index-entry checkpoint and calibration proof.'}
        write_json(ROOT/'population-nonempty-resume-proof.json',result)
        if not same:raise RuntimeError('Substantive committed population facts changed across resume')
        print(json.dumps({k:result[k] for k in ['run_id','actual_nonempty_committed_documents','facts_and_attempts_unchanged']}))
    finally:shared.close()
if __name__=='__main__':main()
