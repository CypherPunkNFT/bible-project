import argparse
import json
import time
import shutil
from datetime import datetime, timezone
from pathlib import Path
from .build import PROJECT, DEFAULT_OUT, dump, now
from .jobs import JobStore, process_identity
from .pipeline import run_pipeline, validate, export_run


def main():
    parser = argparse.ArgumentParser(description='Private CPU library metadata refinement; never writes live corpus or vectors.')
    parser.add_argument('--project',type=Path,default=PROJECT)
    parser.add_argument('--root',type=Path)
    commands = parser.add_subparsers(dest='command',required=True)
    run = commands.add_parser('run')
    run.add_argument('--profile',choices=['cpu'],default='cpu')
    run.add_argument('--resume',action='store_true')
    run.add_argument('--run',dest='run_id')
    run.add_argument('--warehouse',type=Path)
    commands.add_parser('status')
    products_run=commands.add_parser('run-products');products_run.add_argument('--resume',action='store_true');products_run.add_argument('--limit',type=int)
    commands.add_parser('products-status')
    commands.add_parser('build-product-consumers')
    commands.add_parser('verify-products')
    text_run = commands.add_parser('run-text')
    text_run.add_argument('--resume',action='store_true')
    text_run.add_argument('--run',dest='run_id')
    text_run.add_argument('--kinds',nargs='+',choices=['library_text','library_review','reference','authored_document','bible','guide','library_catalog','person','place','project_document','study'],default=['library_text','library_review'])
    text_run.add_argument('--limit',type=int,help='Interrupt after a calibration population; resume processes the entire captured scope')
    commands.add_parser('text-status')
    text_validate = commands.add_parser('validate-text')
    text_validate.add_argument('--run',dest='run_id',required=True)
    for name in ('validate','prepare-patches','export'):
        sub = commands.add_parser(name)
        sub.add_argument('--run',dest='run_id',required=True)
    args = parser.parse_args()
    root = (args.root or args.project / 'KnowledgeBase/library-analytics/pipeline').resolve()
    if not root.is_relative_to((args.project / 'KnowledgeBase/library-analytics').resolve()):
        parser.error('Output must remain in KnowledgeBase/library-analytics')
    if args.command == 'run':
        return run_pipeline(args.project,root,args.resume,args.run_id,args.warehouse)
    if args.command == 'run-text':
        from .text_pipeline import run_text
        return run_text(args.project,root,args.resume,args.kinds,args.run_id,args.limit)
    if args.command=='run-products':
        from .products import run as run_products
        return run_products(args.project,args.resume,args.limit)
    if args.command=='products-status':
        from .products import status as products_status
        print(json.dumps(products_status(args.project),ensure_ascii=True));return 0
    if args.command=='build-product-consumers':
        from .product_consumers import run as consumers
        return consumers(args.project)
    if args.command=='verify-products':
        from .verify_products import verify
        return 0 if verify(args.project)['ok'] else 2
    if not (root / 'pipeline.sqlite3').exists():
        parser.error('Pipeline has not run')
    store = JobStore(root / 'pipeline.sqlite3')
    try:
        if args.command in ('text-status','validate-text'):
            from .text_pipeline import validate_text
            if args.command=='validate-text':
                store.acquire()
                result = validate_text(store,args.run_id)
                print(json.dumps(result,ensure_ascii=True))
                return 0 if result['ok'] else 2
            # All live counters describe the same WAL read snapshot. Without
            # this, completed jobs can advance between separate aggregates.
            store.db.execute('BEGIN')
            record = store.db.execute('SELECT id,state,created_at,updated_at,scope_json FROM text_runs ORDER BY created_at DESC LIMIT 1').fetchone()
            result = dict(record) if record else {'state':'not-started'}
            if record:
                result['scope'] = json.loads(result.pop('scope_json'))
                result['jobs'] = [dict(r) for r in store.db.execute('SELECT j.state,count(*) jobs FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? GROUP BY j.state',(record['id'],))]
                result['metrics'] = dict(store.db.execute('SELECT count(*) documents,sum(q.characters) characters,sum(q.blocks) blocks FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id WHERE r.run_id=?',(record['id'],)).fetchone())
                result['reference_counts'] = dict(store.db.execute('SELECT sum(c.accepted) literal_matches,sum(c.rejected) rejections FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=?',(record['id'],)).fetchone())
            owner = dict(store.db.execute('SELECT * FROM coordinator').fetchone() or {})
            result['coordinator'] = owner
            result['database_bytes'] = store.path.stat().st_size
            result['disk_free_bytes'] = shutil.disk_usage(root).free
            if record:
                result['release_files'] = [{'name':p.name,'bytes':p.stat().st_size} for p in sorted((root/'text-releases'/record['id']).glob('*')) if p.is_file()]
            if owner:
                identity = process_identity(owner['pid'])
                result['coordinator_state'] = 'unknown' if identity=='unknown' else 'live' if identity==owner['process_token'] else 'dead'
            else: result['coordinator_state']='idle'
            print(json.dumps(result,ensure_ascii=True))
            return 0
        if args.command == 'status':
            record = store.db.execute('SELECT * FROM runs ORDER BY created_at DESC LIMIT 1').fetchone()
            if not record:
                print(json.dumps({'state':'not-started'}))
                return 0
            result = {k:record[k] for k in ('id','state','created_at','updated_at','warehouse')}
            result['jobs'] = [dict(r) for r in store.db.execute('SELECT j.task,j.state,count(*) jobs,sum(coalesce(c.rows,0)) completed_rows FROM run_jobs r JOIN jobs j ON j.id=r.job_id LEFT JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? GROUP BY j.task,j.state', (record['id'],))]
            result['coordinator'] = dict(store.db.execute('SELECT * FROM coordinator').fetchone() or {})
            owner = result['coordinator']
            if owner:
                identity = process_identity(owner['pid'])
                result['coordinator_state'] = 'unknown' if identity == 'unknown' else 'live' if identity == owner['process_token'] else 'dead'
                result['heartbeat_age_seconds'] = round(time.time()-owner['heartbeat'],2)
            else:
                result['coordinator_state'] = 'idle'
            print(json.dumps(result,ensure_ascii=True))
            return 0
        store.acquire()
        result = validate(store,args.run_id,project=args.project)
        receipt = root / 'validations' / (args.run_id + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.json')
        receipt.parent.mkdir(parents=True,exist_ok=True)
        dump(receipt, {'run_id':args.run_id,'checked_at':now(),**result})
        if args.command in ('export','prepare-patches'):
            if not result['ok']: raise RuntimeError('Validation failed; refusing export')
            print(json.dumps(export_run(store,args.run_id,root,result),ensure_ascii=True))
        else:
            print(json.dumps(result,ensure_ascii=True))
        return 0 if result['ok'] else 2
    finally:
        store.close()


if __name__ == '__main__':
    raise SystemExit(main())
