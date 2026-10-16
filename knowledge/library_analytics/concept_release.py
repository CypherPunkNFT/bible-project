"""Immutable reproducible exports and structural verification for KR-110."""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import shutil
import time
from .build import PROJECT,dump,readonly,now
from .concept_index import root,read,filehash,Inputs,fts_name
from .concept_query import Retriever
from .inputs import packed,digest
from .jobs import JobStore

def verify(calibration=False):
    engine=Retriever(calibration=calibration);db=engine.db
    try:
        # One witness for each populated language/kind/state, sampled by stable ID,
        # plus first/last windows. These are deterministic source checks, not relevance.
        samples=[r[0] for r in db.execute('''SELECT min(w.id) FROM windows w JOIN documents d
            ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=?
            GROUP BY d.language,w.kind,w.state''',(engine.run,))]
        samples+=list(db.execute('SELECT min(id),max(id) FROM windows WHERE run_id=?',(engine.run,)).fetchone())
        witnesses=[]
        for wid in sorted(set(x for x in samples if x is not None)):
            row=dict(db.execute('SELECT w.*,d.descriptor_json FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=?',(wid,)).fetchone())
            try:
                w=engine.witness(row,100);witnesses.append({'window_id':wid,'version_id':row['version_id'],
                    'coordinate':w['source_span']['coordinate'],'kind':row['kind'],'state':row['state'],'ok':True})
            except Exception as e:witnesses.append({'window_id':wid,'ok':False,'error':str(e)})
        bad=db.execute('''SELECT count(*) FROM concept_occurrences o JOIN windows w ON w.id=o.window_id
            WHERE w.run_id=? AND (o.start<w.start OR o.end>w.end OR o.start>=o.end)''',(engine.run,)).fetchone()[0]
        bad_refs=db.execute('''SELECT count(*) FROM reference_occurrences o JOIN windows w ON w.id=o.window_id
            WHERE w.run_id=? AND (o.start<w.start OR o.end>w.end OR o.start>=o.end)''',(engine.run,)).fetchone()[0]
        token_rows=db.execute('SELECT count(*) FROM '+fts_name(engine.run)).fetchone()[0]
        windows=db.execute('SELECT count(*) FROM windows WHERE run_id=?',(engine.run,)).fetchone()[0]
        value={'run_id':engine.run,'reviewer_type':'deterministic source/hash/constraint verification',
            'ok':not bad and not bad_refs and token_rows==windows and all(w['ok'] for w in witnesses),
            'concept_bounds_failures':bad,'reference_bounds_failures':bad_refs,'token_rows':token_rows,'windows':windows,
            'witnesses':witnesses,'passed':sum(w['ok'] for w in witnesses),'failed':sum(not w['ok'] for w in witnesses)}
        dump(root()/('calibration-verification.json' if calibration else 'population-verification.json'),value)
        print(packed({k:v for k,v in value.items() if k!='witnesses'}),flush=True);return value
    finally:engine.close()

def export_jsonl(db,path,sql,args):
    count=0
    with path.open('wb') as raw:
        with gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0,compresslevel=1) as f:
            for row in db.execute(sql,args):f.write((packed(dict(row))+'\n').encode());count+=1
    return {'path':path.name,'rows':count,'bytes':path.stat().st_size,'sha256':filehash(path)}

def release():
    folder=root();summary=read(folder/'population.json');run=summary['run_id']
    checks=read(folder/'population-verification.json')
    if checks['run_id']!=run or not checks['ok']:raise ValueError('Passing population verification required')
    evaluation=folder/'evaluations'/run
    quality=read(evaluation/'quality.json')
    if quality['run_id']!=run:raise ValueError('Evaluation generation mismatch')
    method=read(evaluation/'method-frozen.json')
    if method['query_code_sha256']!=filehash(Path(__file__).with_name('concept_query.py')):raise ValueError('Query code changed after evaluation freeze')
    if quality['results_sha256']!=filehash(evaluation/'reserved-results.jsonl'):raise ValueError('Reserved evidence changed after review')
    if quality['judgments_sha256']!=filehash(evaluation/'reserved-judgments.json'):raise ValueError('Reserved judgments changed')
    target=folder/'releases'/run
    if (target/'release_manifest.json').exists():
        manifest=read(target/'release_manifest.json')
        for f in manifest['files']:
            if filehash(target/f['path'])!=f['sha256']:raise ValueError('Existing immutable release changed')
        print(packed({'unchanged':True,'run_id':run}));return
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');store=None;inputs=None
    try:
        shared.acquire();store=JobStore(folder/'concepts.sqlite3');store.acquire();inputs=Inputs();inputs.check_dependencies()
        if any(inputs.contract[k]!=summary['contract'][k] for k in ('code','rules_sha256','parents')):raise ValueError('Index dependencies changed')
        target.mkdir(parents=True,exist_ok=True);manifest=[]
        db=store.db
        with db:db.execute("UPDATE concept_runs SET state='interrupted' WHERE state='running' AND id<>?",(run,))
        db.executescript('''CREATE TABLE IF NOT EXISTS question_evidence(run_id TEXT,question_id TEXT,split TEXT,method TEXT,
            rank INTEGER,window_id INTEGER,components_json TEXT,judgment_json TEXT,PRIMARY KEY(run_id,question_id,method,rank));''')
        judgments={r['question_id']:r for r in quality['questions']}
        with db:
            for split in ('development','reserved'):
                for line in (evaluation/(split+'-results.jsonl')).read_text('utf-8').splitlines():
                    q=json.loads(line)
                    for mode,data in q['outputs'].items():
                        for rank,result in enumerate(data['results'],1):
                            db.execute('INSERT OR IGNORE INTO question_evidence VALUES(?,?,?,?,?,?,?,?)',
                                (run,q['id'],split,mode,rank,result['id'],packed(result['components']),packed(judgments.get(q['id'],{'state':'development-unreviewed'}))))
        queries={
            'documents':('SELECT * FROM documents WHERE run_id=? ORDER BY document_id',(run,)),
            'contributors':('SELECT * FROM contributors WHERE run_id=? ORDER BY document_id,contributor_id,role',(run,)),
            'sections':('SELECT * FROM concept_sections WHERE run_id=? ORDER BY version_id',(run,)),
            'windows':('SELECT * FROM windows WHERE run_id=? ORDER BY id',(run,)),
            'concept_occurrences':('SELECT o.* FROM windows w JOIN concept_occurrences o ON o.window_id=w.id WHERE w.run_id=? ORDER BY o.id',(run,)),
            'reference_occurrences':('SELECT o.* FROM windows w JOIN reference_occurrences o ON o.window_id=w.id WHERE w.run_id=? ORDER BY o.id',(run,)),
            'document_results':('SELECT * FROM document_results WHERE run_id=? ORDER BY document_id',(run,)),
            'dependencies':('SELECT * FROM dependencies WHERE run_id=? ORDER BY document_id,kind,key',(run,)),
            'rules':('SELECT * FROM rules WHERE run_id=? ORDER BY rule_id',(run,)),
            'question_evidence':('SELECT * FROM question_evidence WHERE run_id=? ORDER BY question_id,method,rank',(run,)),
            'jobs':('SELECT j.* FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? ORDER BY j.id',(run,))}
        for name,(sql,args) in queries.items():
            manifest.append(export_jsonl(db,target/(name+'.jsonl.gz'),sql,args));shared.heartbeat()
            print(packed({'export':name,**manifest[-1]}),flush=True)
        summary={**summary,'quality':quality['metrics'],'capabilities':{'located-lexical-reference-candidates':True,
            'evaluated-question-retrieval':quality['release_gate_passed'],'semantic':False},'verification':checks,
            'release_policy':'Private located candidate index; failed retrieval capability not promoted',
            'exports':'Deterministic gzip JSONL; FTS reconstructs from windows and hash-verified parent sources, never an independent backup',
            'known_independent_works':db.execute("SELECT count(DISTINCT work_id) FROM documents WHERE run_id=? AND disposition='supported'",(run,)).fetchone()[0],
            'unresolved_work_documents':db.execute("SELECT count(*) FROM documents WHERE run_id=? AND disposition='supported' AND work_id IS NULL",(run,)).fetchone()[0]}
        dump(target/'summary.json',summary)
        for src in [folder/'evaluation-frozen.json',folder/'population-verification.json',folder/'coverage.json',folder/'runtime.json',folder/'matcher-equivalence.json',folder/'resume-verification.json',folder/'cache-profile-launch.json',folder/'resource-samples.jsonl',folder/'query-examples.json',folder/'tests.log',evaluation/'method-frozen.json',evaluation/'quality.json',evaluation/'pooled-judgments.json',evaluation/'reserved-judgments.json',evaluation/'reserved-results.jsonl',evaluation/'development-results.jsonl']:
            shutil.copyfile(src,target/src.name)
        shutil.copyfile(folder/'idempotence-verification.json',target/'idempotence-verification.json')
        shutil.copyfile(evaluation/'baseline-invariance.json',target/'baseline-invariance.json')
        if (evaluation/'development-iterations').exists():
            shutil.copytree(evaluation/'development-iterations',target/'development-iterations',dirs_exist_ok=True)
        code=target/'code';code.mkdir(exist_ok=True)
        shutil.copyfile(Path(__file__).with_name('concept_idempotence.py'),code/'concept_idempotence.py')
        shutil.copyfile(Path(__file__).with_name('concept_collect_judgments.py'),code/'concept_collect_judgments.py')
        shutil.copyfile(Path(__file__).with_name('concept_eval_status.py'),code/'concept_eval_status.py')
        shutil.copyfile(Path(__file__).with_name('concept_baseline_check.py'),code/'concept_baseline_check.py')
        for name in ('CONCEPTS.md','concept-queries.sql'):
            shutil.copyfile(Path(__file__).with_name(name),target/name)
        for name in ('concept_index.py','concept_contract.py','concept_matcher_fast.py','concept_run.py','concept_query.py','concept_evaluate.py','concept_review.py','concept_judgments.py','concept_quality.py','concept_release.py','concept_storage.py','concept_examples.py','concept_coverage.py','concept_runtime.py','concept_verify_release.py','test_concepts.py'):
            shutil.copyfile(Path(__file__).with_name(name),code/name)
        for p in sorted(target.rglob('*')):
            if p.is_file() and p.suffix!='.gz' and p.name!='release_manifest.json':manifest.append({'path':str(p.relative_to(target)),'bytes':p.stat().st_size,'sha256':filehash(p)})
        dump(target/'release_manifest.json',{'run_id':run,'files':manifest,'parent_releases':summary['contract']['parents']})
        pointer={'run_id':run,'database':str(store.path),'release':str(target),'summary':str(target/'summary.json'),
            'capabilities':summary['capabilities']}
        old=folder/'latest-concepts.json'
        if old.exists():dump(folder/'previous-concepts.json',read(old))
        dump(old,pointer)
        if quality['release_gate_passed']:dump(folder/'latest-retrieval.json',pointer)
        print(packed(pointer),flush=True)
    finally:
        if inputs:inputs.close()
        if store:store.close()
        shared.close()

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--verify',action='store_true');p.add_argument('--calibration',action='store_true');p.add_argument('--export',action='store_true')
    a=p.parse_args()
    if a.verify:verify(a.calibration)
    elif a.export:release()
    else:p.error('Choose --verify or --export')
