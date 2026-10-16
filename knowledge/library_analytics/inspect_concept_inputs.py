"""Read-only KR-110 input inventory."""
import json
from pathlib import Path
from .build import PROJECT, readonly
from .jobs import process_identity

def main():
    project=Path(PROJECT); site=project/'Website'
    for p in (site/'content/library').glob('*.json'):
        v=json.loads(p.read_text('utf-8-sig'))
        if isinstance(v,dict) and 'subjects' in v: print('VOCAB',p, str(v)[:12000])
    for folder in ('knowledge','initiatives'):
        for p in (site/folder).rglob('AGENTS.md'): print(p, p.read_text())
    for p in (site/'knowledge').rglob('*.py'):
        if any(x in p.read_text('utf-8',errors='replace').lower() for x in ('topic_senses','topic-senses','sense_id','topicrules')): print('TOPIC CODE',p)
    root=project/'KnowledgeBase/library-knowledge/connected-research'
    for rel in ('latest-sections.json','alignment/latest-alignment.json'):
        v=json.loads((root/rel).read_text('utf-8-sig'));print(rel,v)
        db=readonly(Path(v['database']))
        print('SUMMARY',Path(v['summary']).read_text()[:7000])
        if rel.startswith('latest'):
            print('DESCRIPTOR', db.execute("SELECT descriptor_json FROM research_scope WHERE run_id=? AND adapter='cache' LIMIT 1",(v['run_id'],)).fetchone()[0])
            print('LANGUAGES',[tuple(r) for r in db.execute("SELECT json_extract(descriptor_json,'$.language'),count(*) FROM research_scope WHERE run_id=? AND disposition='supported' GROUP BY 1",(v['run_id'],))])
        db.close()
    for rel in ('intake-completion.json','embedding-progress.json','graph-development/monitor-state.json'):
        p=project/'KnowledgeBase'/rel
        if p.exists():
            v=json.loads(p.read_text('utf-8-sig'));print(rel,v)
            if v.get('pid'): print('LIVE TOKEN',process_identity(int(v['pid'])))

if __name__=='__main__': main()
