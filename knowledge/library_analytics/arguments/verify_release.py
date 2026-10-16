"""Independent compressed export/hash/count verification through global lease."""
import gzip,hashlib,json,time
from pathlib import Path
from .inputs import ROOT,read,sha,write_json
from ..jobs import JobStore
from ..build import PROJECT

def main():
    delivered=read(ROOT/'delivered-release.json');folder=Path(delivered['release']);manifest=read(folder/'release_manifest.json');started=time.monotonic();shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        shared.acquire();checks=[];errors=[]
        for p in manifest['files']:
            path=folder/p['path'];proof={'path':p['path'],'size_ok':path.stat().st_size==p['bytes'],'sha256_ok':sha(path)==p['sha256']}
            if p['path'].endswith('.jsonl.gz'):
                n=0;h=hashlib.sha256()
                with gzip.open(path,'rb') as f:
                    for line in f:
                        value=json.loads(line)
                        if not isinstance(value,dict):raise ValueError('Export row is not an object')
                        h.update(line);n+=1
                proof.update({'rows':n,'rows_ok':n==p['rows'],'uncompressed_sha256_ok':h.hexdigest()==p['uncompressed_sha256']})
            if any(v is False for v in proof.values()):errors.append(proof)
            checks.append(proof);shared.heartbeat();print(json.dumps(proof),flush=True)
        result={'release_id':manifest['release_id'],'run_id':manifest['run_id'],'manifest_sha256':sha(folder/'release_manifest.json'),'ok':not errors,'files':len(checks),'bytes':sum(p['bytes'] for p in manifest['files']),'checks':checks,'errors':errors,'seconds':time.monotonic()-started,'reviewer':'independent deterministic decompression/JSON/SHA256/row-count verification; no content acceptance claim'}
        write_json(ROOT/'release-verification.json',result)
        if errors:raise ValueError('Immutable release verification failed')
        print(json.dumps({k:result[k] for k in ['release_id','ok','files','bytes','seconds']}))
    finally:shared.close()
if __name__=='__main__':main()
