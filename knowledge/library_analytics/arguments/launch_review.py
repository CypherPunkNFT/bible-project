"""Launch one finite projection process, without a shell or scheduler."""
import argparse, subprocess, sys
from pathlib import Path
from .inputs import ROOT,write_json,read,sha
from ..jobs import process_identity

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--resume',action='store_true');args=parser.parse_args()
    folder=ROOT/'review';folder.mkdir(exist_ok=True)
    command=[sys.executable,'-B','-X','utf8','-m','knowledge.library_analytics.arguments.review_catalog']
    if args.resume:
        status=read(folder/'progress.json')
        if process_identity(status['pid']) in (status['process_token'],'unknown'):raise RuntimeError('Existing review worker identity may still be live')
        contract=read(folder/status['generation']/'contract.json')
        catalogs=[p for p in (folder/'inputs').glob('catalog-*.json') if sha(p)==contract['catalog']]
        if len(catalogs)!=1:raise RuntimeError('Exact pinned classification snapshot required')
        from .review_catalog import contract as current_contract
        if current_contract(catalogs[0])!=contract:raise RuntimeError('Changed projection input/code rejected; same-generation resume requires the exact original contract')
        command[-1]='knowledge.library_analytics.arguments.review_resume'
        command.extend(['--catalog',str(catalogs[0])])
        for name in ['resume-launch.json','launch.json']:
            previous=folder/name
            if previous.exists():write_json(folder/'launch-history'/(previous.stem+'-'+sha(previous)+'.json'),read(previous))
        write_json(folder/'resume-launch.json',{'generation':status['generation'],'committedProgressBeforeResume':status,'reason':'Windows denied progress JSON atomic replace; original processor unchanged','catalogSha256':contract['catalog']})
    with (folder/'worker.log').open('ab') as out:
        child=subprocess.Popen(command,
            cwd=Path(__file__).resolve().parents[3],stdout=out,stderr=out,
            creationflags=subprocess.CREATE_NO_WINDOW|subprocess.DETACHED_PROCESS)
    write_json(folder/'launch.json',{'pid':child.pid,'command':'python -B -X utf8 -m knowledge.library_analytics.arguments.review_catalog','finite':True})
    print('Started finite metadata projection PID',child.pid)
