"""Read-only refresh integration inventory; no worker or lease acquisition."""
import json
import sqlite3
import sys
from pathlib import Path
from .build import PROJECT, readonly

ROOT=Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research/refresh'

def main():
    if '--lease' in sys.argv:
        from .jobs import process_identity
        import psutil
        db=readonly(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
        rows=[dict(r) for r in db.execute('SELECT * FROM coordinator')];db.close()
        for row in rows:
            row['observed_process_token']=process_identity(row['pid'])
            try:
                p=psutil.Process(row['pid']);row['command']=p.cmdline();row['created_at']=p.create_time();row['rss']=p.memory_info().rss
            except psutil.Error as exc:row['process_inspection_error']=str(exc)
        print(json.dumps(rows,ensure_ascii=False));return
    base=ROOT.parent
    out={}
    for name,path in [('sections',base/'latest-sections.json'),('alignment',base/'alignment/latest-alignment.json'),('concepts',base/'concepts/latest-concepts.json'),('relationships',base/'relationships/latest-relationships.json')]:
        p=json.loads(path.read_text('utf-8-sig'));s=json.loads(Path(p['summary']).read_text('utf-8-sig'))
        db=readonly(Path(p['database']))
        out[name]={'pointer':p,'contract':s.get('contract'), 'schema':[dict(r) for r in db.execute("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE '%fts%'")]}
        if name=='sections':
            out[name]['calibration']=[dict(r) for r in db.execute("SELECT * FROM research_runs WHERE id LIKE '%calibration'")]
            out[name]['supported_strata']=[dict(r) for r in db.execute("SELECT adapter,json_extract(descriptor_json,'$.language') language,count(*) n FROM research_scope WHERE run_id=? AND disposition='supported' GROUP BY 1,2",(p['run_id'],))]
        db.close()
    lease=readonly(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    out['global_lease']=[dict(r) for r in lease.execute('SELECT * FROM coordinator')];lease.close()
    corpus=readonly(Path(PROJECT)/'KnowledgeBase/knowledge.sqlite3')
    out['corpus_build']=corpus.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0];corpus.close()
    ROOT.mkdir(parents=True,exist_ok=True)
    (ROOT/'inspection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'global_lease':out['global_lease'],'corpus_build':out['corpus_build'],'strata':out['sections']['supported_strata']},ensure_ascii=False))

if __name__=='__main__':main()
