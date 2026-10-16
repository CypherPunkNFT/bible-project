"""Immutable private KR-120 tables, dependencies and quality receipts."""
import argparse
from pathlib import Path
import shutil
import gzip
from .build import PROJECT,dump
from .concept_index import read,filehash
from .concept_release import export_jsonl
from .relationship_miner import root,Inputs
from .relationship_query import query_identity
from .jobs import JobStore,background_priority
from .inputs import packed,digest

def release():
    background_priority();folder=root();summary=read(folder/'population.json');run=summary['run_id'];quality=read(folder/'quality.json');checks=read(folder/'population-verification.json');joint=read(folder/'joint-population.json')
    if summary['state']!='population-complete' or not checks['ok'] or checks['run_id']!=run or quality['run_id']!=run:raise ValueError('Complete verified population and reviewed quality required')
    if joint['state']!='complete' or joint['parent_run']!=run or quality['joint_run_id']!=joint['run_id'] or checks['joint_run_id']!=joint['run_id']:raise ValueError('Joint-reference release mismatch')
    for name,expected in [('resume-verification.json',run),('joint-resume-verification.json',joint['run_id']),('idempotence-verification.json',run)]:
        receipt=read(folder/name)
        if not receipt['ok'] or receipt['run_id']!=expected:raise ValueError('Restart/idempotence receipt mismatch: '+name)
    if joint['contract']['code_sha256']!=filehash(Path(__file__).with_name('relationship_cocitations.py')):raise ValueError('Joint code changed')
    if quality['pool_sha256']!=filehash(folder/'evaluation-pool.json'):raise ValueError('Reviewed evidence changed')
    pool=read(folder/'evaluation-pool.json')
    if pool['query_code_sha256']!=filehash(Path(__file__).with_name('relationship_query.py')):raise ValueError('Query code changed after evaluation')
    if pool.get('query_identity')!=query_identity():raise ValueError('Query/helper/environment dependencies changed after evaluation')
    equivalent=read(folder/'query-equivalence.json');plans=read(folder/'query-plans.json')
    if not equivalent['ok'] or equivalent['run_id']!=run or equivalent['joint_run_id']!=joint['run_id'] or equivalent['after_code_sha256']!=pool['query_code_sha256']:raise ValueError('Query equivalence proof mismatch')
    if plans['run_id']!=run or plans['query_code_sha256']!=pool['query_code_sha256']:raise ValueError('Query plan generation mismatch')
    release_id='kr120-release-'+digest({'base_run':run,'joint_run':joint['run_id'],'query':pool['query_code_sha256'],'quality_sha256':filehash(folder/'quality.json')})[:24]
    target=folder/'releases'/release_id
    if (target/'release_manifest.json').exists():
        manifest=read(target/'release_manifest.json')
        for f in manifest['files']:
            if filehash(target/f['path'])!=f['sha256']:raise ValueError('Immutable release changed')
        print(packed({'run_id':run,'unchanged':True}));return
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');store=inputs=None
    try:
        shared.acquire();store=JobStore(folder/'relationships.sqlite3');store.acquire();inputs=Inputs();inputs.check()
        store.db.execute('PRAGMA cache_size=-8388608');store.db.execute('PRAGMA temp_store=MEMORY')
        if inputs.contract!={k:v for k,v in summary['contract'].items() if k!='calibration'}:raise ValueError('Dependency/code mismatch')
        target.mkdir(parents=True,exist_ok=True);files=[]
        for table,order in [('scope','document_id'),('dependencies','document_id,kind,key'),('document_results','document_id'),('postings','channel,feature,window_id'),('feature_stats','channel,feature'),('pair_evidence','left_window,right_window,channel,feature'),('bucket_results','bucket')]:
            value=export_jsonl(store.db,target/(table+'.jsonl.gz'),'SELECT * FROM '+table+' WHERE run_id=? ORDER BY '+order,(run,));files.append(value);shared.heartbeat();print(packed(value),flush=True)
        files.append(export_jsonl(store.db,target/'jobs.jsonl.gz','SELECT j.* FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? ORDER BY j.id',(run,)))
        files.append(export_jsonl(store.db,target/'checkpoints.jsonl.gz','SELECT c.* FROM checkpoints c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? ORDER BY c.job_id',(run,)))
        for table,order in [('joint_postings','feature,window_id'),('joint_features','feature'),('joint_pairs','left_window,right_window,feature'),('joint_batches','batch'),('joint_buckets','bucket')]:
            value=export_jsonl(store.db,target/(table+'.jsonl.gz'),'SELECT * FROM '+table+' WHERE run_id=? ORDER BY '+order,(joint['run_id'],));files.append(value);shared.heartbeat();print(packed(value),flush=True)
        files.append(export_jsonl(store.db,target/'joint_jobs.jsonl.gz','SELECT j.* FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? ORDER BY j.id',(joint['run_id'],)))
        files.append(export_jsonl(store.db,target/'joint_checkpoints.jsonl.gz','SELECT c.* FROM checkpoints c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? ORDER BY c.job_id',(joint['run_id'],)))
        dump(target/'summary.json',{**summary,'joint_stage':joint,'quality_metrics':quality['metrics'],'capabilities':quality['capabilities'],'exports':'Deterministic gzip JSONL; pinned parent sources required; not a dependency-closed backup'})
        for name in ('evaluation-frozen.json','calibration.json','calibration-verification.json','population-verification.json','known-pairs-frozen.json','known-pair-recall.json','evaluation-pool.json','quality.json','resume-verification.json','idempotence-verification.json','runtime.json','coverage.json','tests.log','query-examples.json'):
            shutil.copyfile(folder/name,target/name)
        for name in ('substantive-oracle-plan.json','substantive-known-pairs-frozen.json','substantive-known-pair-recall.json','profile-launch.json','resource-samples.jsonl'):
            shutil.copyfile(folder/name,target/name)
        for name in ('joint-calibration.json','joint-calibration-verification.json','joint-population.json','joint-resume-before.json','joint-resume-verification.json','cocitation-oracle-plan.json','cocitation-known-pairs-frozen.json','cocitation-known-pair-recall.json'):
            shutil.copyfile(folder/name,target/name)
        for p in folder.glob('resume-*-kr120-*.json'):shutil.copyfile(p,target/p.name)
        for p in folder.glob('profile-launch-*.json'):shutil.copyfile(p,target/p.name)
        for name in ('population.log','joint-population.log','shared-job-regression.log'):
            shutil.copyfile(folder/name,target/name)
        for name in ('query-before-index-fix.py','calibration-query-plans.json','calibration-query-equivalence.json','query-plans.json','query-equivalence.json'):
            shutil.copyfile(folder/name,target/name)
        for name in ('readonly-check-costs-before-cache.jsonl','readonly-check-index-plans.jsonl','population-verification.log','runtime-coverage.log'):
            shutil.copyfile(folder/name,target/name)
        if (folder/'review-notes').exists():shutil.copytree(folder/'review-notes',target/'review-notes',dirs_exist_ok=True)
        code=target/'code';code.mkdir(exist_ok=True)
        for path in sorted(Path(__file__).parent.glob('relationship_*.py')):shutil.copyfile(path,code/path.name)
        for name in ('jobs.py','test_relationships.py','RELATIONSHIPS.md','relationship-queries.sql'):
            shutil.copyfile(Path(__file__).with_name(name),code/name)
        for name,expected_hash in pool['query_identity']['files'].items():
            source=Path(__file__).parent.parent/name;destination=code/'dependencies'/name
            if filehash(source)!=expected_hash:raise ValueError('Query helper changed while copying: '+name)
            destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,destination)
        for p in sorted(target.rglob('*')):
            if p.is_file() and p.suffix!='.gz' and p.name!='release_manifest.json':files.append({'path':str(p.relative_to(target)),'bytes':p.stat().st_size,'sha256':filehash(p)})
        # Export can be long: recheck dependencies before publishing a pointer.
        current=Inputs()
        try:
            current.check()
            if current.contract!=inputs.contract:raise ValueError('Dependencies/code changed during export')
        finally:current.close()
        if joint['contract']['code_sha256']!=filehash(Path(__file__).with_name('relationship_cocitations.py')) or pool['query_code_sha256']!=filehash(Path(__file__).with_name('relationship_query.py')):raise ValueError('Joint/query code changed during export')
        if pool['query_identity']!=query_identity():raise ValueError('Query/helper/environment dependencies changed during export')
        dump(target/'release_manifest.json',{'release_id':release_id,'run_id':run,'joint_run_id':joint['run_id'],'files':files,'parent':summary['contract']['parent']})
        pointer={'release_id':release_id,'run_id':run,'joint_run_id':joint['run_id'],'query_identity':pool['query_identity'],'database':str(store.path),'release':str(target),'summary':str(target/'summary.json'),'capabilities':quality['capabilities']}
        if (folder/'latest-relationships.json').exists():dump(folder/'previous-relationships.json',read(folder/'latest-relationships.json'))
        dump(folder/'latest-relationships.json',pointer);print(packed(pointer),flush=True)
    finally:
        if inputs:inputs.close()
        if store:store.close()
        shared.close()

def verify_export():
    folder=root();pointer=read(folder/'latest-relationships.json');target=Path(pointer['release']);manifest=read(target/'release_manifest.json');checks=[]
    for f in manifest['files']:
        p=target/f['path'];row={'path':f['path'],'sha256_ok':filehash(p)==f['sha256'],'size_ok':p.stat().st_size==f['bytes']}
        if 'rows' in f:
            with gzip.open(p,'rb') as stream:n=sum(1 for _ in stream)
            row.update(rows=n,rows_ok=n==f['rows'])
        checks.append(row);print(packed(row),flush=True)
    result={'run_id':pointer['run_id'],'ok':all(r['sha256_ok'] and r['size_ok'] and r.get('rows_ok',True) for r in checks),'files':checks,'total_bytes':sum(f['bytes'] for f in manifest['files'])}
    dump(folder/'release-verification.json',result)
    if not result['ok']:raise ValueError('Export verification failed')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--export',action='store_true');p.add_argument('--verify',action='store_true');a=p.parse_args()
    if a.export:release()
    elif a.verify:verify_export()
    else:p.error('Choose --export or --verify')
