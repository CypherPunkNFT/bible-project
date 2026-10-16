"""Read-only KR-130 input and ownership inspection."""
import json, sqlite3
from pathlib import Path
from ..build import PROJECT
from ..jobs import process_identity

def main():
    base=Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research'
    for path in [base/'latest-sections.json',base/'alignment/latest-alignment.json']:
        value=json.loads(path.read_text('utf-8'));print(path);print(json.dumps(value,indent=2))
        db=sqlite3.connect('file:'+Path(value['database']).as_posix()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
        print([dict(r) for r in db.execute("SELECT name,sql FROM sqlite_master WHERE type='table'")])
        if 'alignment' not in str(path):
            print('SAMPLE SCOPE', [dict(r) for r in db.execute("SELECT * FROM research_scope WHERE run_id=? AND disposition='supported' LIMIT 4",(value['run_id'],))])
            print('SECTION SAMPLE', [dict(r) for r in db.execute('SELECT * FROM sections LIMIT 2')])
        db.close()
    path=Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3'
    db=sqlite3.connect('file:'+path.as_posix()+'?mode=ro',uri=True)
    for r in db.execute('SELECT * FROM coordinator'):print('LEASE',r,'LIVE',process_identity(r[2]))
    db.close()
if __name__=='__main__':main()
