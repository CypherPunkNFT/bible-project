"""Read-only inspection of KR-110 runtime and query plans."""
import json
from pathlib import Path
from .concept_index import root,read
from .build import readonly
def main():
    db=readonly(root()/'concepts.sqlite3')
    print('RUNS',[dict(r) for r in db.execute('SELECT id,state FROM concept_runs')])
    print('JOBS',[dict(r) for r in db.execute('SELECT state,count(*) n FROM jobs GROUP BY state')])
    print('ERRORS',[dict(r) for r in db.execute("SELECT scope,state,error FROM jobs WHERE state IN ('failed','stale') LIMIT 10")])
    print('RECENT',[dict(r) for r in db.execute('SELECT * FROM document_results ORDER BY rowid DESC LIMIT 3')])
    run=db.execute("SELECT id FROM concept_runs WHERE id NOT LIKE '%calibration' ORDER BY rowid DESC LIMIT 1").fetchone()
    if run:
        print('VERIFIED IDENTITIES',dict(db.execute("SELECT count(DISTINCT work_id) works,count(edition_id) edition_documents FROM documents WHERE run_id=? AND disposition='supported'",(run[0],)).fetchone()))
        print('EXPECTED CACHE CHARACTERS',dict(db.execute("SELECT sum(json_extract(descriptor_json,'$.quality.characters')) characters,sum(json_extract(descriptor_json,'$.quality.blocks')) blocks FROM documents WHERE run_id=? AND disposition='supported'",(run[0],)).fetchone()))
    p=read(root().parent/'latest-sections.json');src=readonly(Path(p['database']))
    print('PLAN',[tuple(r) for r in src.execute('''EXPLAIN QUERY PLAN SELECT s.version_id,s.kind,s.state,s.heading,g.* FROM sections s INDEXED BY sections_document
        CROSS JOIN run_sections m ON m.version_id=s.version_id AND m.run_id=?
        CROSS JOIN section_segments g ON g.version_id=s.version_id WHERE s.document_id=?
        ORDER BY g.path,g.coordinate,g.block_ordinal,g.locator,g.start''',(p['run_id'],'example'))])
    db.close();src.close()
if __name__=='__main__':main()
