"""Read-only failed-attempt receipts, retained rather than hidden."""
import json
from .inputs import ROOT,ro,write_json
def main():
    db=ro(ROOT/'arguments.sqlite3');runs=[dict(r) for r in db.execute('SELECT id,state FROM argument_runs')]
    errors=[dict(r) for r in db.execute("SELECT j.*,r.run_id,r.scope FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE j.state IN ('failed','stale')")]
    for r in errors:
        scope=db.execute('SELECT descriptor_json FROM scope WHERE run_id=? AND document_id=?',(r['run_id'],r['scope'].removeprefix('document:'))).fetchone()
        if scope:
            d=json.loads(scope[0]);r['source_title']=d.get('title');r['source_path']=d.get('source_path');r['cache_path']=d.get('cache_path')
    result={'runs':runs,'failed_job_receipts':errors,'preservation':'Prior unsuccessful generation and all atomic succeeded/failed checkpoints retained.'};write_json(ROOT/'failed-attempts.json',result);print(json.dumps(result,indent=2));db.close()
if __name__=='__main__':main()
