"""Independent release checksum and row-count verification, without output-store writes."""
import gzip
import json
from .concept_index import root,read,filehash
from .build import dump
from .inputs import packed
from pathlib import Path

def main():
    pointer=read(root()/'latest-concepts.json');folder=Path(pointer['release']);manifest=read(folder/'release_manifest.json');checks=[]
    for f in manifest['files']:
        p=folder/f['path'];h=filehash(p);size=p.stat().st_size
        value={'path':f['path'],'sha256_ok':h==f['sha256'],'size_ok':size==f['bytes'],'bytes':size}
        if 'rows' in f:
            with gzip.open(p,'rb') as stream:count=sum(1 for line in stream)
            value.update(rows=count,rows_ok=count==f['rows'])
        checks.append(value)
        print(packed(value),flush=True)
    result={'run_id':pointer['run_id'],'ok':all(c['sha256_ok'] and c['size_ok'] and c.get('rows_ok',True) for c in checks),
        'files':checks,'total_bytes':sum(c['bytes'] for c in checks)}
    dump(root()/'release-verification.json',result)
    if not result['ok']:raise ValueError('Release verification failed')

if __name__=='__main__':main()
