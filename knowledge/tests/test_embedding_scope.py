import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import Mock, patch

from knowledge.embedding_scope import PENDING, require_snapshot, require_preservation
from knowledge import vectors, native_supervisor, finish_intake
from knowledge.settings import write_json


class EmbeddingScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.environment = patch.dict(os.environ, {'BIBLE_EMBED_ONLY': '1', 'BIBLE_EMBED_CORPUS_BUILD': 'snapshot'})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def test_snapshot_and_preservation_guards(self):
        require_snapshot('snapshot')
        require_preservation(0)
        with self.assertRaises(RuntimeError):
            require_snapshot('different')
        with self.assertRaises(RuntimeError):
            require_preservation(1)

    def test_embedding_saves_missing_rows_then_stops_before_index_and_verification(self):
        db = sqlite3.connect(':memory:')
        db.row_factory = sqlite3.Row
        db.executescript("CREATE TABLE chunks(id TEXT,embed_text TEXT,kind TEXT,edition TEXT,language TEXT,book TEXT);"
                         "CREATE TABLE meta(key TEXT,value TEXT); INSERT INTO meta VALUES('built_at','snapshot');"
                         "INSERT INTO chunks VALUES('old','saved','study','','en',''),('new','missing','study','','en','');")
        saved = {'old'}
        fake = Mock()
        fake.count_rows.side_effect = lambda: len(saved)
        fake.add.side_effect = lambda rows: saved.update(r['id'] for r in rows)
        config = dict(state_dir=self.root, db=self.root/'unused', embedding=dict(model='test', revision='test', dimensions=2, max_tokens=10, batch_size=2))
        with patch.object(vectors, 'table', return_value=fake), patch.object(vectors, 'connect', return_value=db), \
             patch.object(vectors, 'vector_ids', side_effect=lambda table: set(saved)), \
             patch.object(vectors, 'reconcile_fragment_vectors', side_effect=lambda table, present, active, progress: present & active), \
             patch.object(vectors, 'encode_when_available', return_value=[[0.1, 0.2]]) as encode, \
             patch('knowledge.retrieval.verify') as verify:
            result = vectors._embed_all(config, 0, None)
        self.assertEqual(saved, {'old', 'new'})
        self.assertEqual(result['state'], PENDING)
        self.assertEqual(result['remaining'], 0)
        self.assertEqual(encode.call_args.args[1], ['missing'])
        fake.create_index.assert_not_called()
        verify.assert_not_called()

    def test_owner_stops_without_refresh_or_final_handoffs(self):
        config = dict(state_dir=self.root, site_dir=self.root/'site')
        owner = finish_intake.Completion(config)
        def command(name):
            self.assertEqual(name, 'embed')
            write_json(self.root/'embedding-progress.json', dict(state=PENDING, remaining=0))
        with patch.object(owner, 'wait_existing'), patch.object(owner, 'encoder'), \
             patch.object(owner, 'command', side_effect=command), patch.object(owner, 'wait_acquisitions') as wait, \
             patch.object(finish_intake, 'require_parity') as verify, patch('knowledge.campaign_coordinator.report'):
            owner.run(refresh=False)
        self.assertEqual(finish_intake.read(self.root/'intake-completion.json')['state'], PENDING)
        wait.assert_not_called()
        verify.assert_not_called()

    def test_supervisor_does_not_restart_finished_embedding_only_pass(self):
        action, _ = native_supervisor.decide({'state': PENDING}, {'state': 'embedding'}, [], [], 100)
        self.assertEqual(action, 'awaiting_verification')
        # The worker can finish just before its owner notices and exits.
        action, _ = native_supervisor.decide({'state': PENDING}, {'state': 'embedding'},
                                             [dict(pid=1, parent=0, created=1, role='owner')], [], 1000)
        self.assertEqual(action, 'awaiting_verification')


if __name__ == '__main__':
    unittest.main()
