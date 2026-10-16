"""Disposable hard-exit / same-generation review checkpoint proof.

This is isolated development work, never a production lease recovery.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from .inputs import ROOT,write_json
from .review_catalog import SCHEMA,guard
from ..jobs import JobStore,StaleInput

CONTRACT={'version':'isolated-review-recovery-test-v1','frozenInput':'fixture-input-a'}

def register(store):
    store.db.executescript(SCHEMA);guard(store.db,CONTRACT)
    for i in range(3):store.register('proof','proof-'+str(i),'review-projection','doc-'+str(i),'fixture-input-a','v1')

def writer(i,die=False):
    def write(db):
        doc='doc-'+str(i)
        db.execute('INSERT INTO review_documents VALUES(?,?,?,?,?)',(doc,json.dumps({'id':doc}),4,2,1))
        db.execute('INSERT INTO review_facets VALUES(?,?,?,?,?)',(doc,'statements','{}',4,'{}'))
        db.execute('INSERT INTO review_details VALUES(?,?)',(doc,'{}'))
        if die:os._exit(73)
        return 3
    return write

def child(folder):
    store=JobStore(folder/'jobs.sqlite3');store.acquire();register(store)
    store.execute_many([('proof-0',writer(0))]);store.execute_many([('proof-1',writer(1,True))])

def facts(store):return [list(r) for r in store.db.execute('SELECT id,statements,qualifications,links FROM review_documents ORDER BY id')]

def main():
    p=argparse.ArgumentParser();p.add_argument('--child',type=Path);a=p.parse_args()
    if a.child:child(a.child);return
    folder=ROOT/'review/tests'/('hard-exit-'+str(time.time_ns()));folder.mkdir(parents=True)
    result=subprocess.run([sys.executable,'-B','-X','utf8','-m','knowledge.library_analytics.arguments.review_recovery_proof','--child',str(folder)],cwd=Path(__file__).resolve().parents[3],check=False)
    if result.returncode!=73:raise ValueError('Expected deliberate hard exit 73')
    store=JobStore(folder/'jobs.sqlite3');before={'documents':store.db.execute('SELECT count(*) FROM review_documents').fetchone()[0],'facets':store.db.execute('SELECT count(*) FROM review_facets').fetchone()[0],'details':store.db.execute('SELECT count(*) FROM review_details').fetchone()[0],'checkpoints':store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0]}
    store.acquire();register(store)
    resume=store.execute_many([('proof-'+str(i),writer(i)) for i in range(3)])
    rerun=store.execute_many([('proof-'+str(i),writer(i)) for i in range(3)])
    after=facts(store);rejected=False
    try:guard(store.db,{**CONTRACT,'frozenInput':'changed'})
    except StaleInput:rejected=True
    integrity=store.db.execute('PRAGMA integrity_check').fetchone()[0]
    complete={'documents':store.db.execute('SELECT count(*) FROM review_documents').fetchone()[0],'facets':store.db.execute('SELECT count(*) FROM review_facets').fetchone()[0],'details':store.db.execute('SELECT count(*) FROM review_details').fetchone()[0],'checkpoints':store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0]}
    store.close()
    clean=JobStore(folder/'clean.sqlite3');clean.acquire();register(clean);clean.execute_many([('proof-'+str(i),writer(i)) for i in range(3)]);equivalent=facts(clean)==after;clean.close()
    if before!={'documents':1,'facets':1,'details':1,'checkpoints':1} or complete!={'documents':3,'facets':3,'details':3,'checkpoints':3} or not equivalent or not rejected or integrity!='ok' or set(rerun.values())!={'skipped'}:raise ValueError('Recovery proof failed')
    receipt={'state':'passed','scope':'disposable synthetic metadata projection, existing JobStore; no production owner or source interrupted','hardExit':73,'beforeResume':before,'afterResume':complete,'resume':resume,'idempotence':rerun,'cleanEquivalent':equivalent,'changedInputRejected':rejected,'integrity':integrity,'folder':str(folder)}
    write_json(ROOT/'review/recovery-proof.json',receipt);print(json.dumps(receipt,indent=2))

if __name__=='__main__':main()
