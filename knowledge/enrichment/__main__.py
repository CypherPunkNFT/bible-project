import argparse
import json
from ..settings import load


def main():
    parser=argparse.ArgumentParser(description='Private CPU-only evidence graph; never changes corpus or vectors')
    parser.add_argument('command',choices=('snapshot','pilot','full','resume','validate','samples','review','benchmark','query','status','report','monitor','cancel','clear-cancel','rollback'))
    parser.add_argument('--manifest'); parser.add_argument('--decisions'); parser.add_argument('--pilot',action='store_true')
    parser.add_argument('--kind',choices=('passage','topic','entity','author','bibliography','neighbours','shared','paths','evidence','candidates','directory'))
    parser.add_argument('--id'); parser.add_argument('--other'); parser.add_argument('--book'); parser.add_argument('--chapter',type=int); parser.add_argument('--verse',type=int)
    parser.add_argument('--limit',type=int,default=50); parser.add_argument('--depth',type=int,default=3)
    parser.add_argument('--section'); parser.add_argument('--other-section')
    args=parser.parse_args(); config=load(); root=config['state_dir']/'graph-development'
    from .lifecycle import read
    if args.command=='snapshot':
        from .snapshot import capture
        result=capture(config)
    elif args.command in ('pilot','full','resume'):
        from .snapshot import capture
        from .runner import execute
        previous=read(root/('latest-pilot.json' if args.pilot else 'latest-full.json'),{})
        manifest=read(args.manifest) if args.manifest else previous.get('manifest') if args.command=='resume' else capture(config)
        if not manifest: raise RuntimeError('Supply --manifest to resume an interrupted initial run')
        result=execute(config,manifest,'pilot' if args.command=='pilot' or args.pilot else 'full')
    elif args.command=='review':
        from .quality import accept_reviews
        if not args.decisions: raise ValueError('--decisions is required')
        result=accept_reviews(config,args.decisions)
    elif args.command in ('validate','samples','benchmark'):
        latest=read(root/('latest-pilot.json' if args.pilot else 'latest-full.json'))
        if not latest: raise RuntimeError('No extracted run in requested scope')
        if args.command=='validate':
            from .validation import validate
            result=validate(latest['graphPath'],latest['runId'],config)
        elif args.command=='samples':
            from .quality import review_samples
            result=review_samples(config,latest['graphPath'],latest['runId'])
        else:
            from .quality import benchmark
            result=benchmark(config,latest['graphPath'],latest['runId'])
    elif args.command=='query':
        from .query import open_tables
        tables=open_tables(config,args.pilot)
        try:
            if args.kind=='passage': result=tables.passage(args.book,args.chapter,args.verse,args.limit)
            elif args.kind=='paths': result=tables.paths(args.id,args.other,args.depth)
            elif args.kind=='shared': result=tables.shared(args.id,args.other,args.limit,args.section,args.other_section)
            elif args.kind=='directory': result=tables.directory(args.id or 'topic',args.limit)
            elif args.kind in ('topic','entity','author','bibliography','neighbours','evidence','candidates'): result=getattr(tables,args.kind)(args.id,args.limit)
            else: raise ValueError('A query --kind is required')
        finally: tables.close()
    elif args.command=='monitor':
        from .lifecycle import monitor
        monitor(config); return
    elif args.command in ('report','status'):
        from .lifecycle import report
        result=report(config) if args.command=='report' else read(root/'summary.json',{})
    elif args.command in ('cancel','clear-cancel'):
        marker=root/'cancel.request'; root.mkdir(parents=True,exist_ok=True)
        if args.command=='cancel': marker.write_text('Stop only graph work at the next bounded checkpoint.\n',encoding='utf-8')
        else: marker.unlink(missing_ok=True)
        result={'cancelRequested':marker.exists()}
    else:
        from .lifecycle import rollback
        result=rollback(config)
    print(json.dumps(result,ensure_ascii=True))


if __name__ == '__main__':
    main()
