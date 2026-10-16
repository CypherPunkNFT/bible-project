"""One explicitly authorized resume. Does not enable any recurring supervisor."""
import json
import socket
from .settings import load, write_json
from .native_supervisor import snapshot, read, launch_owner, stamp
from .store import connect


def main():
    config=load();state=config['state_dir']
    rows, unknown=snapshot(config)
    if rows or unknown:raise RuntimeError(f'Cannot start another owner: {rows}, uninspected {unknown}')
    control=read(state/'native-supervisor/control.json')
    if control.get('mode')!='embedding_only' or control.get('enabled') is not False:
        raise RuntimeError('Expected paused embedding-only supervisor')
    with connect(config['db'],readonly=True) as db:
        build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        plan=[tuple(row) for row in db.execute('EXPLAIN QUERY PLAN SELECT id,embed_text,kind,edition,language,book FROM chunks WHERE id IN (?,?)', ('test-a','test-b'))]
    if build!=control['corpus_build'] or not any('INDEX' in str(row) for row in plan):
        raise RuntimeError('Snapshot or indexed lookup preflight failed')
    receipt=dict(at=stamp(),before=read(state/'embedding-progress.json'),query_plan=plan,
                 supervisor_enabled=False, launch=launch_owner(config))
    write_json(state/'embedding-repair-resume.json',receipt)
    print(json.dumps(receipt),flush=True)


if __name__=='__main__':main()
