"""Continue LA-02 with reference documents after a validated library run.

A waiting launcher is not a second data writer. It uses the same coordinator
lease when the prior writer has released ownership; failed runs are not retried.
"""
import argparse
import json
import time
from .build import DEFAULT_OUT,PROJECT,readonly,dump,now
from .jobs import background_priority
from .text_pipeline import run_text


def continue_after(run,root=DEFAULT_OUT/'pipeline',project=PROJECT):
    background_priority()
    log = root/'text-continuation.json'
    previous = None
    while True:
        db = readonly(root/'pipeline.sqlite3')
        try:
            row = db.execute('SELECT state,summary_json FROM text_runs WHERE id=?',(run,)).fetchone()
            owned = db.execute('SELECT count(*) FROM coordinator').fetchone()[0]
        finally: db.close()
        if not row: raise ValueError('Unknown prerequisite text run')
        state = row['state']
        if state!=previous:
            dump(log,{'updated_at':now(),'after_run':run,'state':'waiting','prerequisite_state':state})
            print(json.dumps({'phase':'waiting-for-library','run_id':run,'state':state}),flush=True)
            previous = state
        if state in ('needs-review','failed','interrupted'):
            dump(log,{'updated_at':now(),'after_run':run,'state':'pending','reason':'Prerequisite run did not complete successfully; no automatic retry.'})
            return 2
        if state=='complete' and not owned:
            summary = json.loads(row['summary_json'])
            if not summary['validation']['ok']: raise RuntimeError('Prerequisite validation failed')
            break
        time.sleep(5)
    dump(log,{'updated_at':now(),'after_run':run,'state':'running-reference-documents'})
    try:
        result = run_text(project,root,kinds=('reference',))
    except BaseException as exc:
        dump(log,{'updated_at':now(),'after_run':run,'state':'pending',
                  'reason':str(exc),'automatic_retry':False})
        raise
    dump(log,{'updated_at':now(),'after_run':run,'state':'complete' if result==0 else 'needs-review','reference_exit_code':result})
    return result


if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--after-run',required=True)
    args = parser.parse_args()
    raise SystemExit(continue_after(args.after_run))
