"""Bounded operational batching/cache profile; unchanged KR-120 fact semantics."""
import argparse
import sys
from pathlib import Path
from . import relationship_miner as processor
from .jobs import JobStore,process_identity
from .build import dump,now
from .inputs import packed
import os

class ProfileStore(JobStore):
    document_batch=16
    checkpoint_pages=8192
    def __init__(self,path):
        super().__init__(path);self.pending_records=[];self.pending_work=[]
        if Path(path).name=='relationships.sqlite3':
            self.db.execute('PRAGMA cache_size=-524288');self.db.execute('PRAGMA wal_autocheckpoint='+str(self.checkpoint_pages))
    def flush(self):
        if not self.pending_work:return
        super().register_many(self.pending_records)
        result=super().execute_many(self.pending_work,max_jobs=self.document_batch)
        self.pending_records=[];self.pending_work=[]
        if any(s in ('failed','stale') for s in result.values()):raise RuntimeError('Grouped relationship jobs failed: '+packed(result))
    def register(self,run,job_id,task,scope,fingerprint,version):
        if scope.startswith('document:'):
            self.pending_records.append((run,job_id,task,scope,fingerprint,version))
        else:
            self.flush();super().register(run,job_id,task,scope,fingerprint,version)
    def execute(self,job_id,writer,**kwargs):
        if self.pending_records and self.pending_records[-1][1]==job_id:
            self.pending_work.append((job_id,writer))
            if len(self.pending_work)>=self.document_batch:self.flush();return 'completed'
            return 'queued-uncommitted'
        return super().execute(job_id,writer,**kwargs)
    def execute_many(self,work,**kwargs):return super().execute_many(work,**kwargs)
    def close(self):
        # A checkpoint stop must not execute pending callbacks during cleanup.
        self.pending_records=[];self.pending_work=[];super().close()

def main():
    p=argparse.ArgumentParser();p.add_argument('--resume',action='store_true');p.add_argument('--calibrate',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--cache-mib',type=int,default=512);p.add_argument('--document-batch',type=int,choices=(16,32,128,256),default=16);p.add_argument('--checkpoint-pages',type=int,choices=(8192,262144),default=8192);a=p.parse_args()
    if not 256<=a.cache_mib<=16384:p.error('Cache must be bounded to 256..16384 MiB')
    # The processor sets its initial cache after opening. Apply the larger cache
    # at the first atomic callback as an operational, not semantic, change.
    ProfileStore.document_batch=a.document_batch;ProfileStore.checkpoint_pages=a.checkpoint_pages
    original=ProfileStore.execute
    def execute(self,*args,**kwargs):
        if self.path.name=='relationships.sqlite3' and not getattr(self,'profile_ready',False):
            self.db.execute('PRAGMA cache_size=-'+str(a.cache_mib*1024));self.profile_ready=True
        return original(self,*args,**kwargs)
    ProfileStore.execute=execute;processor.JobStore=ProfileStore
    old=processor.root()/'profile-launch.json'
    if old.exists():
        prior=processor.read(old);dump(processor.root()/('profile-launch-'+str(prior['pid'])+'.json'),prior)
    dump(old,{'created_at':now(),'pid':os.getpid(),'process_token':process_identity(os.getpid()),'command':[sys.executable,'-X','utf8','-m',__spec__.name,*sys.argv[1:]],'cwd':str(Path.cwd()),'cache_mib':a.cache_mib,'document_batch':a.document_batch,'wal_autocheckpoint_pages':a.checkpoint_pages,'wrapper_sha256':processor.filehash(__file__),'jobstore_sha256':processor.filehash(Path(__file__).with_name('jobs.py')),'semantics':'Unchanged source/feature/pair rules and job IDs; atomic group commits with per-job savepoints; pending group discarded on checkpoint stop'})
    processor.run(a.calibrate,a.resume,a.limit)

if __name__=='__main__':main()
