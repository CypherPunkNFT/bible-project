"""Read compact progress from completed per-question evaluation records."""
import argparse
import json
from collections import Counter
from .concept_index import root,read
from .inputs import packed

def main():
    p=argparse.ArgumentParser();p.add_argument('split',choices=['development','reserved']);a=p.parse_args()
    run=read(root()/'population.json')['run_id'];folder=root()/'evaluations'/run
    path=folder/(a.split+'-results.jsonl');complete=path.exists()
    if not complete:path=folder/(a.split+'-results.partial.jsonl')
    text=path.read_text('utf-8');lines=text.splitlines()
    if text and not text.endswith('\n'):lines=lines[:-1]
    rows=[json.loads(line) for line in lines]
    print(packed({'run_id':run,'split':a.split,'state':'complete' if complete else 'running-or-interrupted',
        'questions':len(rows),'families':dict(Counter(r['family'] for r in rows)),
        'total_search_seconds':{mode:round(sum(r['outputs'][mode]['seconds'] for r in rows),2) for mode in ('baseline','concept')},
        'last_question_id':rows[-1]['id'] if rows else None}))

if __name__=='__main__':main()
