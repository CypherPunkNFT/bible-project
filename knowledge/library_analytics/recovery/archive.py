"""Dependency-closed CPU recovery of a pinned KR-101 release.

All mutations are confined to the explicit private work root and the existing
global analytics lease. Historical paths stay intact; restoration uses a strict
manifest lookup and never falls back to production. No selected pointer writes.
"""
import argparse
import ast
from contextlib import contextmanager
import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import platform
import shutil
import sqlite3
import subprocess
import sys
import time

from ..jobs import JobStore, StaleInput, background_priority, process_identity

VERSION='recovery-kr101-v2'
RUN='kr101-31239794030518bcb2299a31'
PROJECT=Path(__file__).resolve().parents[4]
PRIVATE=PROJECT/'KnowledgeBase/library-knowledge/connected-research/recovery'
CONNECTED=PROJECT/'KnowledgeBase/library-knowledge/connected-research'
GLOBAL=PROJECT/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3'

def packed(obj):return json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def fingerprint(obj):return hashlib.sha256(packed(obj).encode()).hexdigest()
def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
    return h.hexdigest()
def atomic(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+'.partial')
    with tmp.open('w',encoding='utf-8',newline='\n') as f:
        f.write(packed(value)+'\n');f.flush();os.fsync(f.fileno())
    os.replace(tmp,path)
def ro(path):
    db=sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True)
    db.row_factory=sqlite3.Row
    return db
def within(root,path):
    root=Path(root).resolve();path=Path(path).resolve()
    if not path.is_relative_to(root) or path==root:raise ValueError('Path escapes private root: '+str(path))
    return path
def private(path):return within(PRIVATE,path)

def code_closure():
    """Static local import closure, including imports inside adapter functions.

    Other workstreams' new modules are deliberately not swept into this pin.
    """
    website=PROJECT/'Website';pending=['knowledge.library_analytics.section_catalog',
        'knowledge.library_analytics.section_contract','knowledge.library_analytics.xml_bridge']
    pending.extend('knowledge.library_analytics.recovery.'+p.stem for p in Path(__file__).parent.glob('*.py'))
    seen=set();files=set()
    while pending:
        module=pending.pop()
        if module in seen or not module.startswith('knowledge'):continue
        seen.add(module);base=website.joinpath(*module.split('.'))
        file=base.with_suffix('.py')
        if not file.is_file():file=base/'__init__.py'
        if not file.is_file():continue
        files.add(file)
        parts=module.split('.')
        for i in range(1,len(parts)):
            init=website.joinpath(*parts[:i])/'__init__.py'
            if init.is_file():files.add(init)
        package=module if file.name=='__init__.py' else module.rpartition('.')[0]
        for node in ast.walk(ast.parse(file.read_text(encoding='utf-8-sig'))):
            if isinstance(node,ast.Import):pending.extend(x.name for x in node.names)
            elif isinstance(node,ast.ImportFrom):
                name=importlib.util.resolve_name('.'*node.level+(node.module or ''),package) if node.level else node.module
                if name:
                    pending.append(name)
                    pending.extend(name+'.'+x.name for x in node.names if x.name!='*')
    return sorted(files)

@contextmanager
def ownership(work):
    private(work);background_priority()
    shared=JobStore(GLOBAL);store=None
    try:
        shared.acquire()
        store=JobStore(Path(work)/'jobs.sqlite3');store.acquire()
        store.db.execute('CREATE TABLE IF NOT EXISTS artifacts(path TEXT PRIMARY KEY,sha256 TEXT,bytes INTEGER)')
        store.db.commit()
        yield shared,store
    finally:
        if store:store.close()
        shared.close()

def inventory(work):
    """Pin once. Inputs are release inventories, never mutable latest pointers."""
    work=private(work);work.mkdir(parents=True,exist_ok=True)
    planpath=work/'plan.json'
    if planpath.exists():return read(planpath)
    release=CONNECTED/'releases'/RUN
    summary=read(release/'summary.json');manifest=read(release/'release_manifest.json')
    if summary['run_id']!=RUN or summary['state']!='complete':raise ValueError('Pinned release is incomplete')
    assets={};omissions=[]
    def add(path,expected=None,role='dependency'):
        p=Path(path).resolve()
        if not p.is_relative_to(PROJECT):raise ValueError('Unexpected dependency outside project: '+str(p))
        if not p.is_file():raise FileNotFoundError(p)
        key=str(p)
        if key in assets:
            if expected and assets[key]['sha256']!=expected:raise StaleInput('Conflicting dependency hashes: '+key)
            return
        stat=p.stat();digest=expected or sha(p)
        assets[key]={'source':key,'relative':p.relative_to(PROJECT).as_posix(),'sha256':digest,'bytes':stat.st_size,'mtime_ns':stat.st_mtime_ns,'role':role}
    for item in manifest['files']:add(release/item['name'],item['sha256'],'release-export')
    add(release/'release_manifest.json',role='release-manifest')
    with (release/'input_dependencies.jsonl').open(encoding='utf-8') as f:
        for line in f:
            r=json.loads(line);add(r['path'],r['sha256'],'captured-representation-or-native-source')
    db=ro(CONNECTED/'sections.sqlite3')
    try:
        record=db.execute('SELECT * FROM research_runs WHERE id=?',(RUN,)).fetchone()
        if not record or record['state']!='complete' or json.loads(record['contract_json'])!=summary['contract']:
            raise StaleInput('Database does not contain pinned contract')
        docs=0
        for row in db.execute("SELECT descriptor_json FROM research_scope WHERE run_id=? AND disposition='supported' ORDER BY document_id",(RUN,)):
            d=json.loads(row[0]);docs+=1
            path=d.get('source_path');expected=d.get('original_sha256')
            if path and expected:add(path,expected,'held-original')
            elif d.get('xml_link'):
                x=d['xml_link'];add(x['asset_path'],x['asset_sha256'],'held-original-xml')
            else:omissions.append({'document_id':d['document_id'],'reason':'no original hash asserted in captured descriptor','path':path})
        contract=json.loads(record['contract_json'])
    finally:db.close()
    # Upstream evidence is retained as historical provenance. Captured scope is
    # the operational input boundary; LA processor reruns are outside this set.
    parent=contract['analytical_parent'];bundle=contract['text_bundle']
    for directory in (Path(parent['release']),Path(bundle['summary']).parent):
        for p in directory.rglob('*'):
            if p.is_file():add(p,role='upstream-release-provenance')
    add(parent['summary'],contract['analytical_summary_sha256'],'upstream-summary')
    for component in bundle['run_ids']:
        folder=PROJECT/'KnowledgeBase/library-analytics/pipeline/text-releases'/component
        for p in folder.rglob('*'):
            if p.is_file():add(p,role='upstream-text-provenance')
    for directory in (CONNECTED/'evaluations'/RUN,CONNECTED/'verifications'/RUN):
        for p in directory.rglob('*'):
            if p.is_file():add(p,role='evaluation-or-review-receipt')
    # Keep all Python modules, schemas and contracts, including untracked code.
    # Exclude caches and private runtime outputs; never capture credential files.
    for p in code_closure():add(p,role='code-or-contract')
    for p in Path(__file__).parent.glob('*.md'):add(p,role='code-or-contract')
    for directory in (PROJECT/'Website/initiatives/library-knowledge',):
        for p in directory.rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts and p.suffix.lower() in ('.py','.sql','.json','.md','.txt','.toml','.yaml','.yml'):
                add(p,role='code-or-contract')
    for name in ('SECTIONS.md','SECTIONS-RESULT.md','section-queries.sql','README.md'):
        add(PROJECT/'Website/knowledge/library_analytics'/name,role='code-or-contract')
    for name in ('requirements.txt','requirements-knowledge.txt','pyproject.toml','package.json','package-lock.json','AGENTS.md'):
        p=PROJECT/'Website'/name
        if p.is_file():add(p,role='configuration')
    env={'python':sys.version,'executable':sys.executable,'platform':platform.platform(),'sqlite':sqlite3.sqlite_version,
         'packages':sorted((d.metadata['Name'],d.version) for d in importlib.metadata.distributions()),
         'pid':os.getpid(),'creation_token':process_identity(os.getpid())}
    git={}
    for name,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain','--untracked-files=all','--','Website/knowledge','Website/initiatives/library-knowledge'])]:
        r=subprocess.run(['git','-C',str(PROJECT),*args],capture_output=True,text=True,check=False)
        git[name]={'code':r.returncode,'output':r.stdout,'error':r.stderr}
    plan={'version':VERSION,'run_id':RUN,'supported_documents':docs,'contract':contract,'cpu_only':True,
          'capability':'KR-101 retained facts, frozen scope, located section queries, source reconstruction and adapter replay; not upstream LA regeneration',
          'database':str(CONNECTED/'sections.sqlite3'),'assets':sorted(assets.values(),key=lambda x:x['relative']),
          'omitted_originals':omissions,'excluded':['KR-102/110/120 releases','live corpus and FTS','vectors and model cache','upstream mutable LA databases and regeneration','public website build and reader page packages not consumed by KR-101','secrets'],
          'environment':env,'git':git,'created_at':time.time()}
    from .verify import heading_queries
    source=ro(CONNECTED/'sections.sqlite3')
    try:plan['query_baseline']=heading_queries(source,('assurance','faith','Trinity','prayer','Romans','justification','church','grace','resurrection','covenant','baptism','charity'))
    finally:source.close()
    plan['id']='recovery-'+fingerprint(plan)[:24]
    atomic(planpath,plan)
    print(packed({'phase':'pinned','id':plan['id'],'files':len(assets),'bytes':sum(a['bytes'] for a in assets.values()),'omitted_originals':len(omissions)}),flush=True)
    return plan

def copy_checked(source,target,expected):
    """Atomic copy with both sides hashed; successful checkpoint follows rename."""
    source=Path(source);target=Path(target);target.parent.mkdir(parents=True,exist_ok=True)
    before=source.stat();tmp=target.with_name(target.name+'.partial');h=hashlib.sha256()
    with source.open('rb') as src,tmp.open('wb') as dst:
        for block in iter(lambda:src.read(4*1024*1024),b''):dst.write(block);h.update(block)
        dst.flush();os.fsync(dst.fileno())
    after=source.stat()
    if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns) or h.hexdigest()!=expected:
        raise StaleInput('Changed input rejected: '+str(source))
    if sha(tmp)!=expected:raise IOError('Destination hash mismatch: '+str(target))
    os.replace(tmp,target)
    return target.stat().st_size

def snapshot(source,target):
    """SQLite online backup includes committed WAL without forcing checkpoints."""
    target=Path(target);target.parent.mkdir(parents=True,exist_ok=True)
    tmp=target.with_name(target.name+'.partial')
    if tmp.exists():tmp.unlink()
    src=ro(source);dst=sqlite3.connect(tmp)
    try:
        src.backup(dst,pages=4096,sleep=.05)
        if dst.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise IOError('Snapshot integrity failed')
    finally:dst.close();src.close()
    os.replace(tmp,target)
    return sha(target),target.stat().st_size

def backup(work,stop_after=None):
    work=private(work);started=time.monotonic()
    with ownership(work) as (shared,store):
        plan=inventory(work);dest=work/'backup';dest.mkdir(exist_ok=True)
        pinned=dest/'plan.json'
        if pinned.exists() and read(pinned)!=plan:raise StaleInput('Backup generation changed')
        if not pinned.exists():atomic(pinned,plan)
        run=plan['id'];completed=0
        for i,a in enumerate(plan['assets']):
            target=within(dest/'tree',dest/'tree'/a['relative'])
            job=fingerprint({'run':run,'asset':a})
            store.register(run,job,'recovery-copy',a['source'],a['sha256'],VERSION)
            old=store.db.execute('SELECT state FROM jobs WHERE id=?',(job,)).fetchone()[0]
            if old=='succeeded':
                if not target.is_file() or sha(target)!=a['sha256']:raise IOError('Committed backup asset damaged: '+str(target))
                # Reject source drift even on same-generation resume.
                if not Path(a['source']).is_file() or sha(a['source'])!=a['sha256']:raise StaleInput('Source drift on resume: '+a['source'])
            else:
                def writer(db,a=a,target=target):
                    n=copy_checked(a['source'],target,a['sha256'])
                    db.execute('INSERT OR REPLACE INTO artifacts VALUES(?,?,?)',(a['relative'],a['sha256'],n));return 1
                state=store.execute(job,writer)
                if state not in ('completed','skipped'):raise RuntimeError('Copy failed; inspect jobs.sqlite3: '+a['source'])
                completed+=1
            if i%200==0:
                shared.heartbeat();print(packed({'phase':'copy','done':i+1,'total':len(plan['assets'])}),flush=True)
            if stop_after and i+1>=stop_after:
                atomic(work/'interrupted.json',{'generation':run,'done':i+1,'reason':'requested bounded interruption','seconds':time.monotonic()-started});return
        dbpath=dest/'tree'/Path(plan['database']).relative_to(PROJECT)
        job=fingerprint({'run':run,'sqlite-online-backup':plan['database']})
        store.register(run,job,'recovery-snapshot','sections',job,VERSION)
        def capture(db):
            digest,n=snapshot(plan['database'],dbpath)
            check=ro(dbpath)
            try:
                row=check.execute('SELECT state,contract_json FROM research_runs WHERE id=?',(RUN,)).fetchone()
                if not row or row[0]!='complete' or json.loads(row[1])!=plan['contract']:raise StaleInput('Snapshot changed release')
            finally:check.close()
            db.execute('INSERT OR REPLACE INTO artifacts VALUES(?,?,?)',(dbpath.relative_to(dest/'tree').as_posix(),digest,n));return 1
        state=store.execute(job,capture)
        if state not in ('completed','skipped'):raise RuntimeError('SQLite capture failed')
        artifacts=[dict(r) for r in store.db.execute('SELECT * FROM artifacts ORDER BY path')]
        for a in artifacts:
            p=dest/'tree'/a['path']
            if p.stat().st_size!=a['bytes'] or sha(p)!=a['sha256']:raise IOError('Backup verification failed: '+str(p))
        receipt={'generation':run,'version':VERSION,'run_id':RUN,'cpu_only':True,'state':'local-copy-verified',
                 'independent_destination_approved':False,'files':artifacts,'bytes':sum(a['bytes'] for a in artifacts),
                 'seconds':time.monotonic()-started,'new_copies':completed,'omitted_originals':plan['omitted_originals']}
        if (dest/'receipt.json').exists():
            old=read(dest/'receipt.json')
            if old['files']!=artifacts:raise StaleInput('Completed backup inventory changed')
        else:atomic(dest/'receipt.json',receipt)
        atomic(work/'last-backup-invocation.json',receipt)
        print(packed({k:v for k,v in receipt.items() if k not in ('files','omitted_originals')}),flush=True)

def restore(work,name='restored',stop_after=None):
    work=private(work);started=time.monotonic();dest=within(work,work/name)
    if name in ('backup','tree') or dest.is_relative_to(work/'backup'):raise ValueError('Restore must be separate')
    with ownership(work/'restore-control') as (shared,store):
        receipt=read(work/'backup/receipt.json');plan=read(work/'backup/plan.json')
        binding=dest/'restore-binding.json'
        identity={'generation':receipt['generation'],'inventory_sha256':fingerprint(receipt['files'])}
        if binding.exists() and read(binding)!=identity:raise StaleInput('Different restore generation')
        if not binding.exists():atomic(binding,identity)
        for i,a in enumerate(receipt['files']):
            target=within(dest/'tree',dest/'tree'/a['path']);source=within(work/'backup/tree',work/'backup/tree'/a['path'])
            job=fingerprint({'restore':identity,'target':str(target),'asset':a})
            store.register(receipt['generation'],job,'recovery-restore',str(target),a['sha256'],VERSION)
            def writer(db,a=a,target=target,source=source):
                if not target.exists():copy_checked(source,target,a['sha256'])
                elif sha(target)!=a['sha256']:raise StaleInput('Existing restored file differs: '+str(target))
                db.execute('INSERT OR REPLACE INTO artifacts VALUES(?,?,?)',(str(target),a['sha256'],a['bytes']));return 1
            state=store.execute(job,writer)
            if state not in ('completed','skipped'):raise RuntimeError('Restore failed; inspect restore-control/jobs.sqlite3: '+str(target))
            if state=='skipped' and (not target.is_file() or sha(target)!=a['sha256']):raise StaleInput('Committed restore changed: '+str(target))
            if i%200==0:shared.heartbeat();print(packed({'phase':'restore','done':i+1,'total':len(receipt['files'])}),flush=True)
            if stop_after and i+1>=stop_after:
                atomic(work/'restore-interrupted.json',{'done':i+1,'generation':receipt['generation']});return
        atomic(dest/'restore-receipt.json',{'generation':receipt['generation'],'files':len(receipt['files']),
              'bytes':receipt['bytes'],'seconds':time.monotonic()-started,'state':'hash-verified','root':str(dest)})

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['pin','backup','restore'])
    p.add_argument('--work',type=Path,default=PRIVATE/'kr101-20261014');p.add_argument('--stop-after',type=int);p.add_argument('--name',default='restored')
    args=p.parse_args()
    if args.action=='pin':
        with ownership(args.work):inventory(args.work)
    elif args.action=='backup':backup(args.work,args.stop_after)
    else:restore(args.work,args.name,args.stop_after)

if __name__=='__main__':main()
