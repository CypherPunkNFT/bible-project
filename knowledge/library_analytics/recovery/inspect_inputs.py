"""Read-only discovery for the recovery workstream."""
from pathlib import Path
import json, shutil, sqlite3

def main():
    project=Path(__file__).resolve().parents[4]
    root=project/'KnowledgeBase/library-knowledge/connected-research'
    db=sqlite3.connect((root/'sections.sqlite3').as_uri()+'?mode=ro',uri=True); db.row_factory=sqlite3.Row
    run='kr101-31239794030518bcb2299a31'
    for table in ('research_scope','research_inputs','section_segments'):
        print('TABLE',table,dict(db.execute('SELECT * FROM '+table+' LIMIT 1').fetchone()))
    print('DEPENDENCIES',dict(db.execute('SELECT count(*) n,sum(size) bytes FROM research_inputs WHERE run_id=?',(run,)).fetchone()))
    s=json.loads((root/f'releases/{run}/summary.json').read_text())
    print('CONTRACT',s['contract'])
    print('GLOBAL LEASE',sqlite3.connect((project/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3').as_uri()+'?mode=ro',uri=True).execute('SELECT * FROM coordinator').fetchall())
    print('ORIGINAL_FIELDS',db.execute("SELECT json_extract(descriptor_json,'$.source_path'),json_extract(descriptor_json,'$.original_sha256'),json_extract(descriptor_json,'$.cache_path') FROM research_scope WHERE run_id=? AND adapter='cache' LIMIT 2",(run,)).fetchall())
    print('RECOVER',[x.name for x in Path('D:/FortressOfSolitude/Jarvis/Tools/FortressRecover').iterdir()])
    print('DRIVES',[(str(x),shutil.disk_usage(x)) for x in [Path(c+':/') for c in 'CEFGHI'] if x.exists()])

if __name__=='__main__':main()
