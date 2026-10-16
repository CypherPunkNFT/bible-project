"""Focused operational tests; all fixtures live in this workstream's root."""
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from . import archive as a
from ..jobs import JobStore,StaleInput
from .verify import drill,heading_queries,heading_query

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        a.PRIVATE.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=a.PRIVATE,prefix='test-')
        self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def test_atomic_copy_and_changed_source(self):
        source=self.root/'source';source.write_bytes(b'original')
        target=self.root/'target';expected=a.sha(source)
        a.copy_checked(source,target,expected);self.assertEqual(target.read_bytes(),b'original')
        source.write_bytes(b'changed')
        with self.assertRaises(StaleInput):a.copy_checked(source,target,expected)
        self.assertEqual(target.read_bytes(),b'original')
    def test_online_backup_committed_wal(self):
        source=self.root/'live.sqlite3';db=sqlite3.connect(source)
        db.execute('PRAGMA journal_mode=WAL');db.execute('PRAGMA wal_autocheckpoint=0')
        db.execute('CREATE TABLE facts(id PRIMARY KEY,text)');db.execute("INSERT INTO facts VALUES(1,'WAL only')");db.commit()
        self.assertTrue(Path(str(source)+'-wal').stat().st_size>0)
        target=self.root/'snapshot.sqlite3';a.snapshot(source,target)
        check=a.ro(target);self.assertEqual(check.execute('SELECT text FROM facts').fetchone()[0],'WAL only');check.close();db.close()
    def test_paths_escape_and_production_refused(self):
        with self.assertRaises(ValueError):a.within(self.root,self.root/'../outside')
        with self.assertRaises(ValueError):a.private(a.PROJECT/'KnowledgeBase/knowledge.sqlite3')
    def test_existing_jobstore_lease_refuses_live_owner(self):
        first=JobStore(self.root/'jobs.sqlite3');second=JobStore(self.root/'jobs.sqlite3')
        try:
            first.acquire()
            with self.assertRaises(RuntimeError):second.acquire()
        finally:second.close();first.close()
    def test_crash_resume_and_idempotence(self):
        class Restored:pass
        r=Restored();r.root=self.root
        rows=[{'version_id':'fixture-'+str(i),'ordinal':0,'span_sha256':str(i),'characters':i+1} for i in range(12)]
        result=drill(r,rows)
        self.assertTrue(result['equivalent']);self.assertEqual(result['after_resume_rows'],12)
    def test_batched_queries_equal_operator_semantics(self):
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
        db.execute('CREATE TABLE sections(version_id,id,document_id,kind,heading,state,parent_version_id,work_id,edition_id,native_key)')
        db.execute('CREATE TABLE run_sections(run_id,version_id)')
        for i,text in enumerate(('FAITH and grace','Prayer','faith','GrAce','excluded faith')):
            db.execute('INSERT INTO sections VALUES(?,?,?,?,?,?,?,?,?,?)',(str(i),str(i),str(i),'chapter',text,'candidate-unreviewed' if i==4 else 'native',None,None,None,str(i)))
            db.execute('INSERT INTO run_sections VALUES(?,?)',(a.RUN,str(i)))
        terms=['faith','grace','Prayer','absent'];self.assertEqual(heading_queries(db,terms),{term:heading_query(db,term) for term in terms});db.close()
    def test_restore_checkpoint_resume_and_changed_output(self):
        work=self.root/'work';source=work/'backup/tree/a.txt';source.parent.mkdir(parents=True);source.write_bytes(b'original')
        a.atomic(work/'backup/plan.json',{})
        a.atomic(work/'backup/receipt.json',{'generation':'fixture','bytes':8,'files':[{'path':'a.txt','sha256':a.sha(source),'bytes':8}]})
        with patch.object(a,'GLOBAL',self.root/'global.sqlite3'):
            a.restore(work,stop_after=1);a.restore(work)
            target=work/'restored/tree/a.txt';self.assertEqual(target.read_bytes(),b'original')
            check=sqlite3.connect(work/'restore-control/jobs.sqlite3')
            self.assertEqual(check.execute('SELECT state,attempts FROM jobs').fetchall(),[('succeeded',1)]);check.close()
            target.write_bytes(b'changed')
            with self.assertRaises(StaleInput):a.restore(work)

if __name__=='__main__':unittest.main()
