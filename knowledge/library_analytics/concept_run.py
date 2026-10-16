"""Operational SQLite cache profile; unchanged semantic processor and job fingerprints."""
import argparse
from pathlib import Path
import os
import sys
from . import concept_index as processor
from .build import readonly as base_readonly,dump,now
from .jobs import JobStore,process_identity
BASE_STATUS=processor.status
STATUS_CACHE={}

def cached_status(db,run):
    key=(id(db),run,db.total_changes)
    if key not in STATUS_CACHE:
        STATUS_CACHE.clear();STATUS_CACHE[key]=BASE_STATUS(db,run)
    return STATUS_CACHE[key]

PROFILE={'source_cache_mib':256,'derived_cache_mib':512,'source_mmap_bytes':8*1024**3,
    'wal_autocheckpoint_pages':8192,'temp_store':'MEMORY','synchronous':'FULL','workers':1,
    'resume_optimization':'Skip registration rewrites only for exact successful run/scope/job triples under exclusive ownership',
    'semantics':'SQLite access-path/cache settings only; processor, source/rule fingerprints and facts unchanged'}

def cached_readonly(path):
    db=base_readonly(path)
    db.execute('PRAGMA cache_size=-262144');db.execute('PRAGMA mmap_size=8589934592');db.execute('PRAGMA temp_store=MEMORY')
    return db

class CachedStore(JobStore):
    def register_many(self,records):
        if not hasattr(self,'ready_records'):
            self.ready_records={tuple(r) for r in self.db.execute("SELECT r.run_id,r.scope,j.id FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE j.state='succeeded'")}
            self.ready_jobs={r[2] for r in self.ready_records}
        pending=[r for r in records if (r[0],r[3],r[1]) not in self.ready_records]
        if pending:super().register_many(pending)
    def execute_many(self,*args,**kwargs):
        if not getattr(self,'cache_profile_installed',False):
            self.db.execute('PRAGMA cache_size=-524288');self.db.execute('PRAGMA temp_store=MEMORY')
            self.db.execute('PRAGMA wal_autocheckpoint=8192');self.cache_profile_installed=True
        work=args[0];ready=getattr(self,'ready_jobs',set());pending=[w for w in work if w[0] not in ready]
        result={job:'skipped' for job,writer in work if job in ready}
        if pending:result.update(super().execute_many(pending,**kwargs))
        return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--resume',action='store_true');p.add_argument('--calibrate',action='store_true');p.add_argument('--limit',type=int)
    args=p.parse_args()
    # Dependency injection affects connection settings, not input bytes or algorithms.
    processor.readonly=cached_readonly;processor.JobStore=CachedStore;processor.status=cached_status
    receipt={'profile':PROFILE,'pid':os.getpid(),'process_token':process_identity(os.getpid()),'created_at':now(),
        'command':[sys.executable,'-X','utf8','-m',__spec__.name,*sys.argv[1:]],'cwd':str(Path.cwd()),
        'wrapper_sha256':processor.filehash(__file__)}
    dump(processor.root()/'cache-profile-launch.json',receipt)
    processor.run(calibrate=args.calibrate,resume=args.resume,limit=args.limit)

if __name__=='__main__':main()
