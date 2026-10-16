"""Offline restored-root queries, closure checks and disposable crash drill."""
import argparse
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time

from .archive import (RUN, PRIVATE, VERSION, atomic, fingerprint, ownership,
                      packed, private, read, ro, sha, within)
from ..jobs import JobStore, StaleInput
from ..section_contract import resolve_segment

class Restored:
    def __init__(self,work,name='restored'):
        self.work=private(work);self.root=within(self.work,self.work/name)
        self.plan=read(self.work/'backup/plan.json');self.receipt=read(self.work/'backup/receipt.json')
        self.by_source={str(Path(a['source']).resolve()).casefold():a for a in self.plan['assets']}
        self.dbpath=self.root/'tree'/Path(self.plan['database']).relative_to(Path(self.plan['database']).parents[3])
        # Use the snapshot artifact's actual recorded relative path.
        candidates=[a['path'] for a in self.receipt['files'] if a['path'].endswith('/sections.sqlite3')]
        if len(candidates)!=1:raise ValueError('Ambiguous section database')
        self.dbpath=self.root/'tree'/candidates[0]
    def map(self,path):
        key=str(Path(path).resolve()).casefold()
        if key not in self.by_source:raise FileNotFoundError('Dependency absent from pinned inventory: '+str(path))
        a=self.by_source[key];target=within(self.root/'tree',self.root/'tree'/a['relative'])
        if not target.is_file():raise FileNotFoundError(target)
        return target
    def segment(self,row,prepared=None):
        mapped=dict(row);mapped['path']=str(self.map(mapped['path']))
        return resolve_segment(mapped,prepared)
    def query(self,term,limit=20):
        db=ro(self.dbpath)
        try:return heading_query(db,term,limit)
        finally:db.close()

def heading_query(db,term,limit=20):
    return [dict(r) for r in db.execute('''SELECT s.version_id,s.id,s.document_id,s.kind,s.heading,s.state,s.parent_version_id,s.work_id,s.edition_id
        FROM sections s JOIN run_sections r ON r.version_id=s.version_id
        WHERE r.run_id=? AND s.kind!='document-representation' AND s.state!='candidate-unreviewed'
        AND s.heading LIKE ? ORDER BY s.document_id,s.native_key LIMIT ?''',(RUN,'%'+term+'%',limit))]

def heading_queries(db,terms,limit=20):
    """Same SQLite LIKE/order semantics as individual queries, one source scan."""
    terms=list(terms);flags=','.join('s.heading LIKE ? AS q'+str(i) for i in range(len(terms)))
    where=' OR '.join('s.heading LIKE ?' for _ in terms)
    sql='''SELECT s.version_id,s.id,s.document_id,s.kind,s.heading,s.state,s.parent_version_id,s.work_id,s.edition_id,'''+flags+'''
        FROM sections s JOIN run_sections r ON r.version_id=s.version_id
        WHERE r.run_id=? AND s.kind!='document-representation' AND s.state!='candidate-unreviewed'
        AND ('''+where+''') ORDER BY s.document_id,s.native_key'''
    patterns=['%'+t+'%' for t in terms];result={t:[] for t in terms}
    for row in db.execute(sql,(*patterns,RUN,*patterns)):
        item=dict(row);matched=[item.pop('q'+str(i)) for i in range(len(terms))]
        for term,match in zip(terms,matched):
            if match and len(result[term])<limit:result[term].append(item.copy())
        if all(len(x)>=limit for x in result.values()):break
    return result

def crash_worker(dbpath,payload,mode):
    """Executed as a separate process; hard exit occurs inside writer transaction."""
    store=JobStore(dbpath);store.acquire()
    try:
        store.db.execute('CREATE TABLE IF NOT EXISTS recovery_witnesses(id TEXT PRIMARY KEY,text_sha256 TEXT,characters INTEGER)');store.db.commit()
        rows=read(payload)
        for i,row in enumerate(rows):
            ident=fingerprint(row);store.register('restore-drill',ident,'restored-source-witness',row['version_id']+':'+str(row['ordinal']),ident,VERSION)
            def writer(db):
                if row.get('segment'):
                    body=resolve_segment(row['segment'])
                    if len(body)!=row['characters']:raise StaleInput('Restored witness changed')
                db.execute('INSERT INTO recovery_witnesses VALUES(?,?,?)',(ident,row['span_sha256'],row['characters']))
                if mode=='crash' and i==1:os._exit(73)
                return 1
            state=store.execute(ident,writer)
            if state not in ('completed','skipped'):raise RuntimeError(state)
    finally:store.close()

def drill(restored,witnesses):
    folder=restored.root/'disposable-drill';folder.mkdir(exist_ok=True)
    payload=folder/'witnesses.json';atomic(payload,witnesses[:12])
    resumed=folder/'resumed.sqlite3';reference=folder/'uninterrupted.sqlite3'
    # Keep previous drills; each verification is independently named.
    if resumed.exists() or reference.exists():
        folder=folder/str(time.time_ns());folder.mkdir();payload=folder/'witnesses.json';atomic(payload,witnesses[:12])
        resumed=folder/'resumed.sqlite3';reference=folder/'uninterrupted.sqlite3'
    def run(path,mode):
        r=subprocess.run([sys.executable,'-B','-m','knowledge.library_analytics.recovery.verify','worker','--db',str(path),'--payload',str(payload),'--mode',mode],capture_output=True,text=True)
        return {'code':r.returncode,'stdout':r.stdout[-1500:],'stderr':r.stderr[-1500:]}
    failed=run(resumed,'crash')
    if failed['code']!=73:raise RuntimeError('Crash worker failed unexpectedly: '+packed(failed))
    db=ro(resumed)
    before={'facts':db.execute('SELECT count(*) FROM recovery_witnesses').fetchone()[0],
            'checkpoints':db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],
            'running':db.execute("SELECT count(*) FROM jobs WHERE state='running'").fetchone()[0]};db.close()
    if before!={'facts':1,'checkpoints':1,'running':1}:raise AssertionError(before)
    recovered=run(resumed,'resume');normal=run(reference,'normal');again=run(resumed,'resume')
    if any(x['code']!=0 for x in (recovered,normal,again)):raise RuntimeError(packed([recovered,normal,again]))
    def result(path):
        db=ro(path)
        try:return {'facts':[tuple(r) for r in db.execute('SELECT * FROM recovery_witnesses ORDER BY id')],
                    'checkpoints':[tuple(r) for r in db.execute('SELECT job_id,rows FROM checkpoints ORDER BY job_id')],
                    'integrity':db.execute('PRAGMA integrity_check').fetchone()[0]}
        finally:db.close()
    left=result(resumed);right=result(reference)
    if left!=right:raise AssertionError('Resume differs from uninterrupted')
    receipt={'hard_exit':failed['code'],'before_resume':before,'after_resume_rows':len(left['facts']),
             'equivalent':True,'idempotent':True,'integrity':left['integrity'],'folder':str(folder),
             'scope':'reconstructed restored-source witnesses processed by existing JobStore; no production job interrupted'}
    atomic(folder/'receipt.json',receipt);return receipt

def verify(work,name='restored'):
    started=time.monotonic();restored=Restored(work,name)
    with ownership(restored.work/'verify-control') as (shared,store):
        # Check every copied artifact, not just witness files.
        for i,a in enumerate(restored.receipt['files']):
            p=within(restored.root/'tree',restored.root/'tree'/a['path'])
            if p.stat().st_size!=a['bytes'] or sha(p)!=a['sha256']:raise IOError('Restored artifact mismatch: '+str(p))
            if i%200==0:shared.heartbeat()
        db=ro(restored.dbpath)
        try:
            integrity=[r[0] for r in db.execute('PRAGMA integrity_check')]
            if integrity!=['ok']:raise IOError(packed(integrity))
            counts={name:db.execute(sql,(RUN,)).fetchone()[0] for name,sql in {
                'documents':'SELECT count(*) FROM research_documents WHERE run_id=?',
                'sections':'SELECT count(*) FROM run_sections WHERE run_id=?',
                'segments':'SELECT count(*) FROM section_segments g JOIN run_sections r ON r.version_id=g.version_id WHERE r.run_id=?',
                'scope':'SELECT count(*) FROM research_scope WHERE run_id=?',
                'failed_jobs':"SELECT count(*) FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'"}.items()}
            if counts['documents']!=restored.plan['supported_documents'] or counts['failed_jobs']:raise AssertionError(counts)
            dependencies=0
            for row in db.execute('SELECT * FROM research_inputs WHERE run_id=?',(RUN,)):
                target=restored.map(row['path']);a=restored.by_source[str(Path(row['path']).resolve()).casefold()]
                if a['sha256']!=row['sha256'] or target.stat().st_size!=row['size']:raise StaleInput('Restored dependency conflict')
                dependencies+=1
            # Full production verification's frozen, pre-existing population
            # witnesses cover every available section-kind / coordinate stratum.
            summary_path=next(a for a in restored.plan['assets'] if a['relative'].endswith('/releases/'+RUN+'/summary.json'))
            summary=read(restored.root/'tree'/summary_path['relative'])
            tests=summary['validation']['independent_roundtrip_samples']
            witnesses=[];prepared={}
            for i,test in enumerate(tests):
                row=db.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(test['version_id'],test.get('ordinal',0))).fetchone()
                if row is None:raise ValueError('Frozen witness missing')
                text=restored.segment(row,prepared)
                witnesses.append({'version_id':row['version_id'],'ordinal':row['ordinal'],'coordinate':row['coordinate'],
                                  'original_path':row['path'],'restored_path':str(restored.map(row['path'])),
                                  'locator':row['locator'],'start':row['start'],'end':row['end'],
                                  'span_sha256':row['span_sha256'],'characters':len(text),'sample':text[:240],
                                  'segment':{**dict(row),'path':str(restored.map(row['path']))}})
                if i%100==0:shared.heartbeat();print(packed({'phase':'witnesses','done':i+1,'total':len(tests)}),flush=True)
            terms=['assurance','faith','Trinity','prayer','Romans','justification','church','grace','resurrection','covenant','baptism','charity']
            # Compare against baseline frozen before backup; offline verify
            # intentionally never opens the production database.
            baseline=restored.plan['query_baseline']
            queries=heading_queries(db,terms)
            if queries!=baseline:raise AssertionError('Representative query mismatch')
            orphan=db.execute('''SELECT count(*) FROM sections s JOIN run_sections r ON r.version_id=s.version_id
                LEFT JOIN sections p ON p.version_id=s.parent_version_id WHERE r.run_id=? AND s.parent_version_id IS NOT NULL AND p.version_id IS NULL''',(RUN,)).fetchone()[0]
            if orphan:raise AssertionError('Dangling section parent')
        finally:db.close()
        crash=drill(restored,witnesses)
        atomic(restored.root/'located-witnesses.json',witnesses)
        atomic(restored.root/'query-results.json',queries)
        # Execute the captured code from its restored Website directory. It has
        # no production fallback, no writer and no intake/encoder imports called.
        child=subprocess.run([sys.executable,'-B','-m','knowledge.library_analytics.recovery.offline_check',
            '--root',str(restored.root),'--plan',str(restored.work/'backup/plan.json')],
            cwd=restored.root/'tree/Website',capture_output=True,text=True)
        if child.returncode:raise RuntimeError('Restored-code execution failed: '+child.stderr[-3000:])
        atomic(restored.root/'restored-code-execution.json',json.loads(child.stdout))
        result={'generation':restored.plan['id'],'run_id':RUN,'state':'local-restore-verified','cpu_only':True,
                'integrity':integrity,'counts':counts,'resolved_dependencies':dependencies,'verified_files':len(restored.receipt['files']),
                'located_witnesses':len(witnesses),'query_terms':len(terms),'query_equivalence':True,'dangling_parents':orphan,
                'interruption_resume':crash,'restored_code_execution':True,'seconds':time.monotonic()-started,
                'reviewer_type':'deterministic software verification; no new semantic or human review',
                'claim':'local retained KR-101 recovery only; no independent disk-loss protection or upstream regeneration claim',
                'omitted_originals':restored.plan['omitted_originals']}
        atomic(restored.root/'verification.json',result)
        print(packed({k:v for k,v in result.items() if k!='omitted_originals'}),flush=True)

def baseline(work):
    work=private(work)
    with ownership(work/'baseline-control'):
        from .archive import CONNECTED
        db=ro(CONNECTED/'sections.sqlite3')
        try:rows=heading_queries(db,['assurance','faith','Trinity','prayer','Romans','justification','church','grace','resurrection','covenant','baptism','charity'])
        finally:db.close()
        path=work/'query-baseline.json'
        if path.exists() and read(path)!=rows:raise StaleInput('Frozen baseline changed')
        if not path.exists():atomic(path,rows)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['baseline','verify','query','worker'])
    p.add_argument('--work',type=Path,default=PRIVATE/'kr101-20261014');p.add_argument('--name',default='restored');p.add_argument('--term',default='assurance')
    p.add_argument('--db',type=Path);p.add_argument('--payload',type=Path);p.add_argument('--mode',default='normal')
    a=p.parse_args()
    if a.action=='worker':crash_worker(a.db,a.payload,a.mode)
    elif a.action=='baseline':baseline(a.work)
    elif a.action=='verify':verify(a.work,a.name)
    else:print(packed(Restored(a.work,a.name).query(a.term)))

if __name__=='__main__':main()
