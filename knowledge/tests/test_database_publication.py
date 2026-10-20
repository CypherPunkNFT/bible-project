"""Disposable real-SQLite and failure-injection regressions; stdlib-only runner."""
import json
import os
import sqlite3
import subprocess
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

from knowledge import ingest,store
from knowledge.finish_intake import Completion
from knowledge.settings import write_json


def sharing_error():
    error=PermissionError('fixture Windows sharing violation');error.winerror=32
    return error


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.folder=tempfile.TemporaryDirectory(prefix='bible-publication-')
        self.addCleanup(self.folder.cleanup)
        self.state=Path(self.folder.name)
        self.current=self.state/'knowledge.sqlite3';self.current.write_bytes(b'current')
        self.previous=self.state/'knowledge.previous.sqlite3';self.previous.write_bytes(b'previous')
        self.stage=self.state/'build-123.sqlite3';self.stage.write_bytes(b'new validated fixture')
        self.addCleanup(patch.stopall)
        patch('knowledge.ingest.time.sleep',lambda seconds:None).start()
        patch('knowledge.database_lock_owners.bounded_lock_owners',return_value={'holders':[{'pid':123,'process_created':456}]}).start()
        self.replace=Path.replace

    def receipt(self):return json.loads((self.state/'database-publication.json').read_text())

    def test_success_rotates_previous_only_after_stage_is_published(self):
        def inspected(source,target):
            if source.name.startswith('knowledge.rollback-'):
                self.assertEqual(self.current.read_bytes(),b'new validated fixture')
                self.assertEqual(self.previous.read_bytes(),b'previous')
            return self.replace(source,target)
        with patch.object(Path,'replace',inspected):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(self.current.read_bytes(),b'new validated fixture')
        self.assertEqual(self.previous.read_bytes(),b'current')
        self.assertEqual(self.receipt()['state'],'complete')

    def test_transient_sharing_violation_is_retried(self):
        tries=[]
        def locked(source,target):
            if source==self.current and len(tries)<2:
                tries.append(1);raise sharing_error()
            return self.replace(source,target)
        with patch.object(Path,'replace',locked):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(len(tries),2)
        self.assertEqual(self.current.read_bytes(),b'new validated fixture')

    def test_persistent_first_rename_failure_keeps_all_originals(self):
        tries=[]
        def locked(source,target):
            if source==self.current:tries.append(1);raise sharing_error()
            return self.replace(source,target)
        with patch.object(Path,'replace',locked),self.assertRaisesRegex(RuntimeError,'publication failed'):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(len(tries),31)
        self.assertEqual(self.current.read_bytes(),b'current')
        self.assertEqual(self.previous.read_bytes(),b'previous')
        self.assertEqual(self.stage.read_bytes(),b'new validated fixture')
        self.assertEqual(self.receipt()['lock_owners']['holders'][0]['process_created'],456)

    def test_stage_publish_failure_restores_current_without_overwriting_previous(self):
        def locked(source,target):
            if source==self.stage:raise sharing_error()
            return self.replace(source,target)
        with patch.object(Path,'replace',locked),self.assertRaisesRegex(RuntimeError,'publication failed'):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(self.current.read_bytes(),b'current')
        self.assertEqual(self.previous.read_bytes(),b'previous')
        self.assertTrue(self.stage.exists())
        self.assertEqual(self.receipt()['state'],'restored')

    def test_blocked_rollback_retains_identity_bound_backup_and_stage(self):
        def locked(source,target):
            if source==self.stage or source.name.startswith('knowledge.rollback-'):raise sharing_error()
            return self.replace(source,target)
        with patch.object(Path,'replace',locked),self.assertRaises(RuntimeError):
            ingest.publish_database(self.stage,self.current,self.state)
        receipt=self.receipt()
        self.assertEqual(receipt['state'],'recovery_required')
        backup=Path(receipt['rollback'])
        self.assertEqual(backup.read_bytes(),b'current')
        self.assertEqual(ingest._file_identity(backup),receipt['original_identity'])
        self.assertEqual(self.previous.read_bytes(),b'previous')
        self.assertTrue(self.stage.exists())
        with self.assertRaisesRegex(RuntimeError,'identity-checked recovery'):
            ingest.publish_database(self.stage,self.current,self.state)

    def test_nonsharing_failure_is_not_retried(self):
        tries=[]
        def denied(source,target):
            if source==self.current:tries.append(1);raise PermissionError('fixture access denied')
            return self.replace(source,target)
        with patch.object(Path,'replace',denied),self.assertRaises(RuntimeError):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(len(tries),1)

    def test_interrupted_prepared_receipt_is_not_overwritten_when_current_is_absent(self):
        original=ingest._file_identity(self.current)
        backup=self.state/'knowledge.rollback-crash.sqlite3';self.current.rename(backup)
        receipt={'state':'prepared','original_identity':original,'rollback':str(backup)}
        write_json(self.state/'database-publication.json',receipt)
        with self.assertRaisesRegex(RuntimeError,'identity-checked recovery'):
            ingest.publish_database(self.stage,self.current,self.state)
        self.assertEqual(self.receipt(),receipt)
        self.assertEqual(backup.read_bytes(),b'current')
        self.assertEqual(self.previous.read_bytes(),b'previous')

    def test_locked_previous_keeps_both_backups_and_reports_success(self):
        def locked(source,target):
            if source.name.startswith('knowledge.rollback-') and target==self.previous:raise sharing_error()
            return self.replace(source,target)
        with patch.object(Path,'replace',locked):
            ingest.publish_database(self.stage,self.current,self.state)
        receipt=self.receipt()
        self.assertEqual(receipt['state'],'complete')
        self.assertEqual(Path(receipt['last_good']).read_bytes(),b'current')
        self.assertEqual(self.previous.read_bytes(),b'previous')
        self.assertEqual(self.current.read_bytes(),b'new validated fixture')

    def test_outside_stage_is_rejected_without_changes(self):
        with self.assertRaises(ValueError):
            ingest.publish_database(self.state.parent/'build-123.sqlite3',self.current,self.state)
        self.assertEqual(self.current.read_bytes(),b'current')
        self.assertFalse((self.state/'database-publication.json').exists())


class CompletionConnectionTests(unittest.TestCase):
    def test_restart_manager_diagnostic_timeout_is_bounded_and_windowless(self):
        from knowledge.database_lock_owners import bounded_lock_owners
        with patch('knowledge.database_lock_owners.subprocess.run',side_effect=subprocess.TimeoutExpired(['fixture'],5)) as run:
            result=bounded_lock_owners([Path(tempfile.gettempdir())/'fixture.sqlite3'])
        self.assertFalse(result['available'])
        self.assertEqual(result['timeout_seconds'],5)
        self.assertEqual(run.call_args.kwargs['timeout'],5)
        self.assertEqual(run.call_args.kwargs['creationflags'],subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
        self.assertNotIn('shell',run.call_args.kwargs)

    def test_restart_manager_diagnostic_failure_returns_without_masking_publication(self):
        from types import SimpleNamespace
        from knowledge.database_lock_owners import bounded_lock_owners
        with patch('knowledge.database_lock_owners.subprocess.run',return_value=SimpleNamespace(returncode=1,stderr='fixture failed')):
            result=bounded_lock_owners([Path(tempfile.gettempdir())/'fixture.sqlite3'])
        self.assertFalse(result['available'])
        self.assertEqual(result['exit_code'],1)

    @unittest.skipUnless(os.name=='nt','Restart Manager is Windows-only')
    def test_restart_manager_reports_disposable_sqlite_holder_identity(self):
        import psutil
        from knowledge.database_lock_owners import bounded_lock_owners
        with tempfile.TemporaryDirectory(prefix='bible-lock-owner-') as folder:
            file=Path(folder)/'fixture.sqlite3';db=sqlite3.connect(file)
            try:
                db.execute('CREATE TABLE fixture(value TEXT)');db.commit()
                result=bounded_lock_owners([file])
                if not result.get('available'):
                    self.skipTest('Restart Manager unavailable: '+result.get('reason','unknown'))
                own=[row for row in result['holders'] if row['pid']==os.getpid()]
                self.assertEqual(len(own),1)
                self.assertTrue(own[0]['identity_matches'])
                self.assertAlmostEqual(own[0]['process_created'],psutil.Process().create_time(),places=2)
            finally:db.close()

    @unittest.skipUnless(os.name=='nt','native completion is Windows-only')
    def test_published_connection_closes_before_late_source_refresh(self):
        with tempfile.TemporaryDirectory(prefix='bible-completion-close-') as folder,ExitStack() as patches:
            state=Path(folder);current=state/'knowledge.sqlite3'
            seed=sqlite3.connect(current)
            seed.execute('CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT)')
            seed.execute("INSERT INTO meta VALUES('built_at','fixture')");seed.commit();seed.close()
            saved=state/'saved-vectors';saved.write_bytes(b'preserve saved vectors')
            verification={'complete':True,'corpus_build':'fixture','sqlite_integrity':'ok',
                'embedding_identity_matches':True,'chunks':2,'vectors':2,'missing_vectors':0,
                'stale_vectors':0,'duplicate_vectors':0,'foreign_key_errors':0,
                **dict.fromkeys(('new_library_files_since_snapshot','changed_library_ledgers_since_snapshot',
                    'new_source_files_since_snapshot','changed_source_inputs_since_snapshot',
                    'missing_library_files_since_snapshot','missing_source_inputs_since_snapshot'),0)}
            verification['new_source_files_since_snapshot']=1
            write_json(state/'verification.json',verification)
            write_json(state/'embedding-progress.json',{'state':'complete','corpus_build':'fixture'})
            connections=[];original=store.connect
            def track(*args,**kwargs):
                db=original(*args,**kwargs);connections.append(db);return db
            patches.enter_context(patch.object(store,'connect',track))
            patches.enter_context(patch.dict(os.environ,{'BIBLE_VERIFY_ONLY':'1'}))
            os.environ.pop('BIBLE_EMBED_ONLY',None)
            patches.enter_context(patch('knowledge.campaign_coordinator.archive_moves',lambda config:None))
            patches.enter_context(patch('knowledge.finish_intake.ctypes.windll.kernel32.SetThreadExecutionState',lambda flag:None))
            job=Completion({'state_dir':state,'site_dir':state,'db':current})
            for method in ('wait_existing','wait_acquisitions','encoder'):
                patches.enter_context(patch.object(job,method,lambda:None))
            commands=[];patches.enter_context(patch.object(job,'command',commands.append))
            def refresh():
                self.assertEqual(len(connections),1)
                with self.assertRaisesRegex(sqlite3.ProgrammingError,'closed'):
                    connections[0].execute('SELECT 1')
                moved=state/'fixture-previous.sqlite3';current.rename(moved);moved.rename(current)
                raise RuntimeError('fixture stopped after safe refresh entry')
            patches.enter_context(patch.object(job,'refresh',refresh))
            try:
                with self.assertRaisesRegex(RuntimeError,'safe refresh entry'):job.run(False)
            finally:
                for db in connections:db.close()
            self.assertEqual(commands,['embed','verify'])
            self.assertEqual(saved.read_bytes(),b'preserve saved vectors')
            self.assertTrue(current.exists())


if __name__=='__main__':unittest.main()
