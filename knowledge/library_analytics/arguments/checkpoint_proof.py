"""Snapshot deterministic committed facts before/after same-generation resume."""
import argparse,hashlib,json
from .inputs import ROOT,ro,read,write_json
from ..inputs import packed
def snapshot(rid,documents=None):
    db=ro(ROOT/'arguments.sqlite3');documents=documents or [r[0] for r in db.execute('SELECT document_id FROM document_results WHERE run_id=? ORDER BY document_id',(rid,))];h=hashlib.sha256();counts={'statements':0,'qualifications':0,'links':0};attempts={}
    for doc in documents:
        for s in db.execute('SELECT * FROM statements WHERE run_id=? AND document_id=? ORDER BY id',(rid,doc)):
            h.update((packed(dict(s))+'\n').encode());counts['statements']+=1
            for q in db.execute('SELECT * FROM qualifications WHERE statement_id=? ORDER BY id',(s['id'],)):h.update((packed(dict(q))+'\n').encode());counts['qualifications']+=1
            for l in db.execute('SELECT * FROM argument_links WHERE source_id=? ORDER BY id',(s['id'],)):h.update((packed(dict(l))+'\n').encode());counts['links']+=1
        r=db.execute('SELECT j.id,j.attempts FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? AND r.scope=?',(rid,'document:'+doc)).fetchone()
        attempts[doc]=dict(r) if r else None
    db.close();return {'run_id':rid,'documents':documents,'facts_sha256':h.hexdigest(),'counts':counts,'attempts':attempts}

def main():
    p=argparse.ArgumentParser();p.add_argument('--capture',action='store_true');p.add_argument('--calibration',action='store_true');p.add_argument('--completed-repeat',action='store_true');a=p.parse_args()
    prefix='calibration' if a.calibration else 'population';before=ROOT/(prefix+'-interruption-snapshot.json')
    if a.capture:
        rid=read(ROOT/'progress.json')['run_id'];s=snapshot(rid);write_json(before,s);print(json.dumps({'run_id':rid,'committed_documents':len(s['documents']),'counts':s['counts'],'facts_sha256':s['facts_sha256']}));return
    b=read(before);now=snapshot(b['run_id'],b['documents']);same=now==b
    result={'run_id':b['run_id'],'actual_interrupted_committed_documents':len(b['documents']),'committed_prefix_unchanged':same,'before':b,'after':now,'completed_repeat_checked':a.completed_repeat,'scope':'Same selected generation; no cross-generation reuse or automatic restart claim.'}
    write_json(ROOT/(prefix+'-resume-proof.json'),result)
    if not same:raise ValueError('Committed facts/attempts changed across resume')
    print(json.dumps({k:result[k] for k in ['run_id','actual_interrupted_committed_documents','committed_prefix_unchanged','completed_repeat_checked']}))
if __name__=='__main__':main()
