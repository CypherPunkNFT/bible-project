"""Recovery and identity boundaries; fixtures never touch the real corpus."""
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from .build import DEFAULT_OUT, SCHEMA as WAREHOUSE_SCHEMA, observation, insert, derive, identity_candidates, unresolved_contributors
from .jobs import JobStore
from .inputs import Inputs
from .normalize import language, normalized
from .identities import validate_candidate
from .pipeline import run_pipeline, validate


TEST_ROOT = DEFAULT_OUT / 'test-runtime'
TEST_ROOT.mkdir(parents=True, exist_ok=True)


class JobsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=TEST_ROOT)
        self.path = Path(self.tmp.name) / 'jobs.sqlite3'

    def tearDown(self):
        self.tmp.cleanup()

    def test_second_live_coordinator_is_refused(self):
        first = JobStore(self.path)
        second = JobStore(self.path)
        try:
            first.acquire()
            with self.assertRaises(RuntimeError): second.acquire()
            second.close()
            self.assertEqual(first.db.execute('SELECT owner FROM coordinator').fetchone()[0],first.owner)
        finally:
            first.close()

    def test_results_and_checkpoint_roll_back_together(self):
        store = JobStore(self.path)
        try:
            store.acquire()
            store.db.execute('CREATE TABLE facts(value TEXT)')
            store.register('run','job','test','scope','hash','v1')
            def fail(db):
                db.execute("INSERT INTO facts VALUES('partial')")
                raise ValueError('simulated failure before checkpoint')
            self.assertEqual(store.execute('job',fail),'failed')
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],0)
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],0)
            self.assertEqual(store.execute('job',lambda db:1),'failed')
            self.assertEqual(store.execute('job',lambda db:1,retry_failed=True),'completed')
            self.assertEqual(store.execute('job',lambda db: self.fail('Completed work was rerun')),'skipped')
        finally:
            store.close()

    def test_actual_process_crash_is_recovered_without_partial_result(self):
        code = '''
import os,sys
from knowledge.library_analytics.jobs import JobStore
s=JobStore(sys.argv[1]);s.acquire();s.db.execute('CREATE TABLE facts(value TEXT)')
s.register('run','job','test','scope','hash','v1')
def crash(db):
 db.execute("INSERT INTO facts VALUES('partial')")
 os._exit(23)
s.execute('job',crash)
'''
        child = subprocess.run([sys.executable,'-B','-c',code,str(self.path)],cwd=Path(__file__).resolve().parents[2],capture_output=True)
        self.assertEqual(child.returncode,23,child.stderr.decode(errors='replace'))
        store = JobStore(self.path)
        try:
            store.acquire()
            self.assertEqual(store.db.execute('SELECT state FROM jobs').fetchone()[0],'pending')
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],0)
            def finish(db):
                db.execute("INSERT INTO facts VALUES('complete')")
                return 1
            self.assertEqual(store.execute('job',finish),'completed')
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],1)
            self.assertEqual(store.db.execute('SELECT rows FROM checkpoints').fetchone()[0],1)
        finally:
            store.close()

    def test_keyboard_interrupt_releases_job_for_resume(self):
        first = JobStore(self.path)
        first.acquire()
        first.register('run','job','test','scope','hash','v1')
        def interrupt(db):
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt): first.execute('job',interrupt)
        first.close()
        resumed = JobStore(self.path)
        try:
            resumed.acquire()
            self.assertEqual(resumed.execute('job',lambda db:1),'completed')
        finally:
            resumed.close()


class IdentityTests(unittest.TestCase):
    def setUp(self):
        self.candidate = {'target_layer':'reader','target_id':'r','field':'edition_id','proposed_value':'edition-e',
                          'original_sha':'a'*64,'state':'unique-proposal'}
        self.target = {'original_sha':'a'*64,'work_id':'work-w','edition_id':None,'fingerprint':'target','location':{'id':'r'}}
        self.evidence = {'original_sha':'a'*64,'work_id':'work-w','edition_id':'edition-e','fingerprint':'evidence','location':{'id':'d'}}
        self.records = {'work:work-w':({'kind':'work','id':'work-w'},'wh'),
                        'edition:edition-e':({'kind':'edition','id':'edition-e','workId':'work-w'},'eh')}

    def validate(self):
        return validate_candidate(self.candidate,self.target,self.evidence,lambda k,i:self.records.get(k+':'+i,(None,'missing')))

    def test_accepts_null_field_with_current_hash_and_canonical_binding(self):
        result = self.validate()
        self.assertEqual(result['state'],'accepted')
        self.assertEqual(result['application_route'],'teacher-identity-override')
        self.assertIsNone(self.target['edition_id'])

    def test_rejects_changed_source_and_existing_conflict(self):
        self.evidence['original_sha'] = 'b'*64
        self.assertEqual(self.validate()['state'],'stale')
        self.evidence['original_sha'] = 'a'*64
        self.target['edition_id'] = 'edition-other'
        self.assertEqual(self.validate()['state'],'rejected')

    def test_rejects_wrong_edition_work_binding(self):
        self.records['edition:edition-e'][0]['workId'] = 'work-other'
        self.assertEqual(self.validate()['reason'],'canonical-edition-work-binding-conflict')

    def test_missing_registration_is_unresolved(self):
        del self.records['edition:edition-e']
        self.assertEqual(self.validate()['state'],'unresolved')

    def test_null_hash_and_ambiguous_proposal_never_accept(self):
        self.candidate['original_sha'] = None
        self.assertEqual(self.validate()['state'],'stale')
        self.candidate['state'] = 'ambiguous-proposal'
        self.assertEqual(self.validate()['state'],'rejected')


class NormalizationTests(unittest.TestCase):
    def test_language_equivalents_preserve_historical_and_unmapped_values(self):
        for value in ('en','eng','English','EN','English.'):
            self.assertEqual(language(value)[0],'en')
        self.assertEqual(language('Middle English')[0],'enm')
        self.assertEqual(language('eng; grc')[0],'en;grc')
        self.assertEqual(language('gae'),('gae','unmapped'))
        self.assertEqual(language('syc')[0],'syc')
        self.assertEqual(language('syr')[0],'syr')

    def test_recovery_does_not_choose_between_conflicts(self):
        raw = {'key':'r','layer':'reader','language':'und','title':'','author_label':'','genre':'','source_raw':''}
        result = normalized(raw,{'language':[('English','header'),('Latin','edition')]})
        self.assertEqual(result['language'],'und')
        self.assertIn('language:conflicting-recovery-assertions',result['issues'])


class EndToEndTests(unittest.TestCase):
    def test_full_run_reuses_success_and_preserves_sources(self):
        with tempfile.TemporaryDirectory(dir=TEST_ROOT) as temp:
            project = Path(temp)
            site = project/'Website'
            kb = project/'KnowledgeBase'
            kb.mkdir()
            cat = site/'content/library/catalog'
            for kind in ('works','editions'):(cat/kind).mkdir(parents=True)
            (cat/'works/work-w.json').write_text(json.dumps({'kind':'work','id':'work-w','title':'Held book','genre':'treatise'}))
            (cat/'editions/edition-e.json').write_text(json.dumps({'kind':'edition','id':'edition-e','workId':'work-w','languages':['eng']}))
            c = sqlite3.connect(kb/'knowledge.sqlite3')
            c.execute('CREATE TABLE documents(id TEXT PRIMARY KEY,metadata TEXT,source TEXT,language TEXT,title TEXT,kind TEXT)')
            c.execute('CREATE TABLE library_files(path TEXT PRIMARY KEY,metadata TEXT,sha256 TEXT,status TEXT,document_id TEXT)')
            metadata = json.dumps({'original_sha256':'a'*64,'acquisition':{'language':'English'}})
            c.execute('INSERT INTO documents VALUES(?,?,?,?,?,?)',('doc',metadata,'source','und','Held book','library_text'))
            c.commit();c.close()
            (kb/'Research Foundation').mkdir()
            c = sqlite3.connect(kb/'Research Foundation/registry.sqlite3')
            c.execute('CREATE TABLE resources(id TEXT PRIMARY KEY,record TEXT,sha256 TEXT)');c.close()
            root = site/'public/content/teacher-library/records'
            root.mkdir(parents=True)
            rid = 'held-r'
            shard = hashlib.sha256(rid.encode()).hexdigest()[:2]
            record = {'title':'Held book','sha256':'a'*64,'workId':'work-w','editionId':'edition-e','language':'eng'}
            (root/(shard+'.json')).write_text(json.dumps({rid:record}))
            warehouse = kb/'warehouse.sqlite3'
            c = sqlite3.connect(warehouse);c.row_factory=sqlite3.Row;c.executescript(WAREHOUSE_SCHEMA)
            insert(c,[observation('corpus','doc',title='Held book',original='a'*64,language='und',kind='library_text'),
                      observation('reader',rid,title='Held book',original='a'*64,work='work-w',edition='edition-e',language='eng')])
            derive(c,lambda *a,**k:None);identity_candidates(c);unresolved_contributors(c);c.close()
            output = kb/'library-analytics/pipeline'
            self.assertEqual(run_pipeline(project,output,warehouse=warehouse),0)
            first = json.loads((output/'last-run.json').read_text())
            self.assertEqual(first['jobs_this_invocation']['completed'],4)
            c = sqlite3.connect(output/'pipeline.sqlite3')
            self.assertEqual(c.execute("SELECT count(*) FROM correction_candidates WHERE state='accepted'").fetchone()[0],2)
            self.assertEqual(c.execute("SELECT language FROM normalized_metadata WHERE key='corpus:doc'").fetchone()[0],'en')
            self.assertEqual(run_pipeline(project,output,resume=True,warehouse=warehouse),0)
            second = json.loads((output/'last-run.json').read_text())
            self.assertEqual(second['jobs_this_invocation'],{'skipped':4})
            self.assertEqual(c.execute('SELECT count(*) FROM normalized_metadata').fetchone()[0],2)
            with self.assertRaises(ValueError):
                run_pipeline(project,output,run_id=second['run_id'])
            self.assertEqual(c.execute('SELECT state FROM runs WHERE id=?',(second['run_id'],)).fetchone()[0],'complete')
            c.close()
            c = sqlite3.connect(kb/'knowledge.sqlite3')
            self.assertEqual(c.execute('SELECT metadata FROM documents').fetchone()[0],metadata)
            c.execute('UPDATE documents SET metadata=?', (json.dumps({'original_sha256':'b'*64}),))
            c.commit()
            c.close()
            store = JobStore(output/'pipeline.sqlite3')
            try:
                check = validate(store,second['run_id'],project=project)
                self.assertFalse(check['ok'])
                self.assertEqual(len(check['changed_accepted_candidate_sources']),2)
            finally:
                store.close()


if __name__ == '__main__':
    unittest.main()
