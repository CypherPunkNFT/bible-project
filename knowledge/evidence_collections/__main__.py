import argparse
import json
from pathlib import Path

from ..settings import load, write_json
from .capture import capture, verify


def main():
    parser=argparse.ArgumentParser(description='Private bounded evidence capture; never writes corpus or vectors')
    parser.add_argument('action',choices=('capture','verify'))
    parser.add_argument('--spec',type=Path)
    parser.add_argument('--collection',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();config=load()
    allowed=(config['state_dir']/'library-knowledge').resolve()
    if not args.output.resolve().is_relative_to(allowed):parser.error('Output must stay under KnowledgeBase/library-knowledge')
    if args.action=='capture':
        if not args.spec:parser.error('--spec required')
        result=capture(config,json.loads(args.spec.read_text('utf-8-sig')))
        check=verify(config,result)
        if not check['valid']:raise RuntimeError(check['staleReasons'])
        write_json(args.output,result)
        print(json.dumps({'output':str(args.output),'evidenceItems':len(result['evidence']),'integrity':result['integrity'],'publicExported':False}))
    else:
        if not args.collection:parser.error('--collection required')
        result=verify(config,json.loads(args.collection.read_text('utf-8-sig')))
        write_json(args.output,result);print(json.dumps(result))
        if not result['valid']:raise SystemExit(1)


if __name__=='__main__':main()
