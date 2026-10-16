"""Deterministic private exports; no global or latest-pointer promotion."""
import argparse,gzip,hashlib,json,time
from pathlib import Path
from .inputs import ROOT,read,ro,sha,write_json,Inputs
from ..jobs import JobStore
from ..build import PROJECT
from ..inputs import packed,digest

QUERIES={
 'scope':('SELECT * FROM scope WHERE run_id=? ORDER BY document_id',),
 'dependencies':('SELECT * FROM dependencies WHERE run_id=? ORDER BY document_id,kind,key',),
 'contributors':('SELECT * FROM contributors WHERE run_id=? ORDER BY document_id,ordinal',),
 'statements':('SELECT * FROM statements WHERE run_id=? ORDER BY id',),
 'source_spans':('SELECT p.* FROM statements s JOIN source_spans p ON p.statement_id=s.id WHERE s.run_id=? ORDER BY s.id',),
 'qualifications':('SELECT q.* FROM statements s JOIN qualifications q ON q.statement_id=s.id WHERE s.run_id=? ORDER BY s.id,q.id',),
 'argument_links':('SELECT * FROM argument_links WHERE run_id=? ORDER BY id',),
 'document_results':('SELECT * FROM document_results WHERE run_id=? ORDER BY document_id',),
 'reconstruction_deferrals':('SELECT * FROM reconstruction_deferrals WHERE run_id=? ORDER BY document_id,version_id,block_ordinal',),
 'job_receipts':('SELECT r.run_id,r.scope,j.* FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? ORDER BY r.scope',),
 'checkpoints':('SELECT c.* FROM run_jobs r JOIN checkpoints c ON c.job_id=r.job_id WHERE r.run_id=? ORDER BY c.job_id',),
}

def export_table(db,query,rid,path):
    temp=path.with_suffix(path.suffix+'.tmp');n=0;logical=hashlib.sha256()
    with temp.open('wb') as raw:
        with gzip.GzipFile(filename='',mode='wb',fileobj=raw,mtime=0,compresslevel=6) as f:
            for row in db.execute(query,(rid,)):
                data=(packed(dict(row))+'\n').encode('utf-8');logical.update(data);f.write(data);n+=1
    result={'path':path.name,'rows':n,'sha256':sha(temp),'bytes':temp.stat().st_size,'uncompressed_sha256':logical.hexdigest()}
    if path.exists():
        if sha(path)!=result['sha256']:raise ValueError('Immutable export differs: '+str(path))
        temp.unlink()
    else:temp.replace(path)
    return result

def release():
    summary=read(ROOT/'population.json');verification=read(ROOT/'population-verification.json');quality=read(ROOT/'evaluation/reserved-metrics.json')
    if not verification['ok'] or verification['run_id']!=summary['run_id']:raise ValueError('Matching population verification required')
    rid=summary['run_id'];release_id='kr130-release-'+digest({'run':rid,'verification':sha(ROOT/'population-verification.json'),'quality':sha(ROOT/'evaluation/reserved-metrics.json')})[:24]
    folder=ROOT/'releases'/release_id;folder.mkdir(parents=True,exist_ok=True);manifest_path=folder/'release_manifest.json'
    if manifest_path.exists():
        check_lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
        try:
            check_lease.acquire();m=read(manifest_path)
            for p in m['files']:
                f=folder/p['path']
                if not f.exists() or sha(f)!=p['sha256'] or f.stat().st_size!=p['bytes']:raise ValueError('Existing release changed')
                check_lease.heartbeat()
            print(json.dumps({'release_id':release_id,'unchanged':True,'files':len(m['files'])}));return m
        finally:check_lease.close()
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');db=None;inputs=None;started=time.monotonic()
    try:
        shared.acquire();inputs=Inputs();inputs.check();inputs.check_contract(summary['contract']);db=ro(ROOT/'arguments.sqlite3');files=[]
        for name,(query,) in QUERIES.items():
            proof=export_table(db,query,rid,folder/(name+'.jsonl.gz'));files.append(proof);shared.heartbeat();print(json.dumps({'exported':name,**proof}),flush=True)
        # Ship the exact owned source snapshot for reproducibility.
        source=folder/'code';source.mkdir(exist_ok=True)
        for path in sorted(Path(__file__).parent.iterdir()):
            if path.suffix not in ('.py','.md','.sql'):continue
            target=source/path.name
            if target.exists() and target.read_bytes()!=path.read_bytes():raise ValueError('Immutable source snapshot changed')
            if not target.exists():target.write_bytes(path.read_bytes())
            files.append({'path':'code/'+path.name,'sha256':sha(target),'bytes':target.stat().st_size})
        shared_source=source/'shared-adapters';shared_source.mkdir(exist_ok=True)
        for proof in summary['contract']['shared_code_proofs']:
            path=Path(proof['path']);target=shared_source/path.name
            if sha(path)!=proof['sha256']:raise ValueError('Shared source changed before snapshot')
            if target.exists() and target.read_bytes()!=path.read_bytes():raise ValueError('Immutable shared code snapshot changed')
            if not target.exists():target.write_bytes(path.read_bytes())
            files.append({'path':'code/shared-adapters/'+path.name,'sha256':sha(target),'bytes':target.stat().st_size})
        # The scoped missing parser dependency is part of this processor's
        # reproducible private closure, including its original MIT licence.
        for path in sorted((ROOT/'dependencies').rglob('*')):
            if not path.is_file() or '__pycache__' in path.parts:continue
            relative=path.relative_to(ROOT/'dependencies');target=source/'dependencies'/relative;target.parent.mkdir(parents=True,exist_ok=True)
            if target.exists() and target.read_bytes()!=path.read_bytes():raise ValueError('Immutable dependency snapshot changed')
            if not target.exists():target.write_bytes(path.read_bytes())
            files.append({'path':target.relative_to(folder).as_posix(),'sha256':sha(target),'bytes':target.stat().st_size})
        evidence={'population':ROOT/'population.json','verification':ROOT/'population-verification.json','development_metrics':ROOT/'evaluation/development-metrics.json','reserved_metrics':ROOT/'evaluation/reserved-metrics.json','development_review':ROOT/'evaluation/development-review.json','reserved_review':ROOT/'evaluation/reserved-review.json','evaluation_frozen':ROOT/'evaluation/frozen.json','evaluation_extra_frozen':ROOT/'evaluation/frozen-extra.json','tuning_freeze':ROOT/'evaluation/tuning-complete.json','process_death_recovery':ROOT/'tests/process-death-recovery.json','population_resume':ROOT/'population-resume-proof.json','split_audit':ROOT/'evaluation/split-audit.json','examples':ROOT/'examples.json','environment':ROOT/'environment.json','resource_receipt':ROOT/'resource-receipt.json','calibration_plan':ROOT/'calibration-plan.json','calibration_verification':ROOT/'calibration-verification.json'}
        evidence.update({'dependency_install':ROOT/'dependency-install.json','dependency_resolution':ROOT/'dependency-resolution.json','prior_failed_attempts':ROOT/'failed-attempts.json','representation_diagnostic':ROOT/'representation-diagnostic.json','actual_representation_integration':ROOT/'tests/representation-deferral-integration.json','runtime_launch':ROOT/'runtime-launch.json'})
        for name,path in evidence.items():
            target=folder/(name+'.json');raw=path.read_bytes()
            if target.exists() and target.read_bytes()!=raw:raise ValueError('Immutable receipt changed')
            if not target.exists():target.write_bytes(raw)
            files.append({'path':target.name,'sha256':sha(target),'bytes':target.stat().st_size})
        accepted=quality['summary']['processor']['attribution']['rate']>=.95 and quality['summary']['processor']['qualification_scope']['rate']>=.95
        result={**summary,'release_id':release_id,'capabilities':{'located_surface_argument_candidates':True,'accepted_attribution_and_scope':accepted,'human_review':False,'semantic_models':False,'public_integration':False},'quality_gate':'passed' if accepted else 'failed: retained private candidate extraction only','quality_summary':quality['summary'],'release_path':str(folder),'global_latest_promoted':False,'runtime_export_seconds':time.monotonic()-started}
        write_json(folder/'summary.json',result);files.append({'path':'summary.json','sha256':sha(folder/'summary.json'),'bytes':(folder/'summary.json').stat().st_size})
        manifest={'release_id':release_id,'run_id':rid,'private_only':True,'global_latest_promoted':False,'files':files};write_json(manifest_path,manifest);write_json(ROOT/'delivered-release.json',{'release_id':release_id,'run_id':rid,'release':str(folder),'database':str(ROOT/'arguments.sqlite3'),'capabilities':result['capabilities'],'manifest_sha256':sha(manifest_path),'note':'Task-specific receipt, not a latest selector or global promotion.'})
        print(json.dumps({'release_id':release_id,'release':str(folder),'files':len(files),'bytes':sum(p['bytes'] for p in files),'quality_gate':result['quality_gate']}))
        return manifest
    finally:
        if db:db.close()
        if inputs:inputs.close()
        shared.close()

if __name__=='__main__':release()
