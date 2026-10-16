"""Snapshot this review's code/dependencies into its private generation directory."""
from pathlib import Path
import shutil
from .inputs import ROOT,read,sha,write_json

def main():
    status=read(ROOT/'review/progress.json');folder=ROOT/'review'/status['generation']
    expected=read(folder/'contract.json');package=Path(__file__).parent
    if sha(package/'review_catalog.py')!=expected['processor'] or sha(package.parent/'jobs.py')!=expected['jobs']:raise ValueError('Projection implementation changed')
    paths=[p for p in package.glob('*.py') if p.name.startswith(('review_','test_review_','launch_review','verify_review_'))]
    paths.extend([package/'inputs.py',package/'__init__.py',package.parent/'jobs.py'])
    records=[]
    for path in paths:
        name=('arguments/' if path.parent==package else '')+path.name
        destination=folder/'code'/name;destination.parent.mkdir(parents=True,exist_ok=True)
        if destination.exists() and sha(destination)!=sha(path):raise ValueError('Refusing to overwrite an archived code identity: '+name)
        if not destination.exists():shutil.copyfile(path,destination)
        records.append({'name':name,'sha256':sha(destination),'bytes':destination.stat().st_size})
    value={'generation':status['generation'],'processorSha256':expected['processor'],'sharedJobStoreSha256':expected['jobs'],'files':records,
        'runtime':'Existing BibleProject Python 3.13 / SQLite 3.50 environment and pinned arguments dependencies; no generation model or embeddings',
        'scope':'Reproducibility source snapshot, not a claim of a standalone restore or cross-generation reuse'}
    write_json(folder/'code-manifest.json',value);print('Archived',len(records),'review implementation/dependency source files in',folder/'code')

if __name__=='__main__':main()
