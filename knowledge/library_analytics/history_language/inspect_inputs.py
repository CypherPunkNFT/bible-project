import json, sqlite3
from pathlib import Path
from ..jobs import process_identity

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'KnowledgeBase'
OUT=BASE/'library-knowledge/connected-research/history-language'

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    result={}
    for name,path in [('research',BASE/'Research Foundation/registry.sqlite3'),('sections',BASE/'library-knowledge/connected-research/sections.sqlite3'),('alignment',BASE/'library-knowledge/connected-research/alignment/alignment.sqlite3'),('lease',BASE/'library-analytics/pipeline/pipeline.sqlite3')]:
        db=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
        tables=[r[0] for r in db.execute("select name from sqlite_master where type='table'")]
        result[name]={'path':str(path),'schema':[r[0] for r in db.execute("select sql from sqlite_master where type='table'")]}
        samples={}
        for table in tables:
            if table.startswith('sqlite_'):continue
            samples[table]=[dict(r) for r in db.execute('select * from "'+table+'" limit 2')]
        result[name]['samples']=samples
        if 'coordinator' in tables:
            result[name]['owners']=[dict(r) | {'observed_token':process_identity(r['pid'])} for r in db.execute('select * from coordinator')]
        db.close()
    (OUT/'inspection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    for name,value in result.items():
        print(name,json.dumps(value,ensure_ascii=False)[:25000])

if __name__=='__main__':main()
