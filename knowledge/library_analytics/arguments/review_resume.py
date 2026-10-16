"""Resume the unchanged projector with bounded status-only Windows I/O retry.

No aggregate/category function or input contract is patched. This operator
adapter changes only retrying the identical progress JSON atomic replacement.
"""
import json
from pathlib import Path
import shutil
import time
from . import review_catalog
from .inputs import ROOT,read,sha,write_json

def status_writer(original,retries=100,delay=.05):
    def write(path,value):
        if Path(path).resolve()!=(ROOT/'review/progress.json').resolve():return original(path,value)
        for attempt in range(retries):
            try:return original(path,value)
            except PermissionError:
                if attempt+1==retries:raise
                time.sleep(delay)
    return write

def main():
    status=read(ROOT/'review/progress.json');folder=ROOT/'review'/status['generation'];contract=read(folder/'contract.json')
    if sha(Path(review_catalog.__file__))!=contract['processor']:raise ValueError('Original semantic processor changed')
    ident=sha(Path(__file__));archive=folder/'operator-adapters'/('review_resume-'+ident+'.py');archive.parent.mkdir(exist_ok=True)
    if archive.exists() and sha(archive)!=ident:raise ValueError('Operator adapter archive changed')
    if not archive.exists():shutil.copyfile(__file__,archive)
    write_json(folder/'operator-adapters'/('receipt-'+str(time.time_ns())+'.json'),{'generation':status['generation'],'adapterSha256':ident,'semanticProcessorSha256':contract['processor'],'change':'Identical progress.json atomic replacement retries only, bounded to 100 attempts / 5 seconds; no classification, result/checkpoint, input or lease changes','startedAtUnix':time.time()})
    review_catalog.write_json=status_writer(review_catalog.write_json)
    review_catalog.main()

if __name__=='__main__':main()
