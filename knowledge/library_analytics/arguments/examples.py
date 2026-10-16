"""Actual reproducible constrained queries, with source witnesses and failures."""
import json,time
from .query import query,located
from .inputs import ROOT,write_json,read,ro,Inputs
CASES=[
 {'query':'faith','kind':'objection','limit':3},
 {'query':'God','kind':'reply','limit':3},
 {'query':'faith','author':'Owen','limit':3},
 {'query':'Christ','author':'Gill','limit':3},
 {'query':'unless','author':'Flavel','limit':3},
 {'query':'God','kind':'quotation','limit':3},
]
def generate_examples():
    results=[]
    for c in CASES:
        started=time.monotonic();r=query(c['query'],kind=c.get('kind'),author=c.get('author'),limit=c['limit']);r['runtime_seconds']=time.monotonic()-started;results.append(r)
        print(json.dumps({'query':r['query'],'constraints':r['constraints'],'results':[{'id':s['id'],'source_title':s['source_metadata'].get('title'),'text':s['text'][:350],'kind':s['kind'],'speaker':s['speaker_label'],'endorsement':s['endorsement'],'qualifications':len(s['qualifications'])} for s in r['results']],'seconds':r['runtime_seconds']},ensure_ascii=False),flush=True)
    rid=read(ROOT/'population.json')['run_id'];db=ro(ROOT/'arguments.sqlite3');inputs=Inputs();links=[]
    sql="SELECT * FROM argument_links WHERE run_id=? AND kind='reply-to-candidate' ORDER BY id LIMIT 3"
    for l in db.execute(sql,(rid,)):
        reply=db.execute('SELECT * FROM statements WHERE id=?',(l['source_id'],)).fetchone();objection=db.execute('SELECT * FROM statements WHERE id=?',(l['target_id'],)).fetchone()
        links.append({'link':dict(l),'reply':located(db,reply,inputs),'objection':located(db,objection,inputs)})
    inputs.close();db.close()
    write_json(ROOT/'examples.json',{'queries':results,'paired_reply_objection_query':{'sql':sql,'run_id':rid,'results':links},'reviewer':'deterministic location checks; candidate usefulness assessed separately','selection':'Fixed actual query recipes; no fabricated passages or exact reader deep links.'})
def main():
    from ..jobs import JobStore
    from ..build import PROJECT
    from pathlib import Path
    lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:lease.acquire();generate_examples()
    finally:lease.close()
if __name__=='__main__':main()
