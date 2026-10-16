import sqlite3
import unittest
from knowledge.vectors import missing_rows


class MissingRowsTests(unittest.TestCase):
    def test_indexed_missing_only_without_full_sort(self):
        db = sqlite3.connect(':memory:')
        self.addCleanup(db.close)
        db.row_factory = sqlite3.Row
        db.execute('CREATE TABLE chunks(id TEXT PRIMARY KEY,embed_text TEXT,kind TEXT,edition TEXT,language TEXT,book TEXT)')
        db.executemany('INSERT INTO chunks VALUES(?,?,?,?,?,?)', [(str(i), 'text'+str(i), '', '', '', '') for i in range(20)])
        trace=[];db.set_trace_callback(trace.append)
        self.assertEqual({r['id'] for r in missing_rows(db, {'3','7','11'}, 2)}, {'3','7','11'})
        self.assertEqual(len(trace), 2)
        self.assertTrue(all('WHERE id IN' in q and 'ORDER BY' not in q for q in trace))
        plan = db.execute('EXPLAIN QUERY PLAN SELECT * FROM chunks WHERE id IN (?,?)', ('3','7')).fetchone()[3]
        self.assertIn('INDEX', plan)

    def test_missing_id_fails_closed(self):
        db = sqlite3.connect(':memory:');self.addCleanup(db.close);db.row_factory=sqlite3.Row
        db.execute('CREATE TABLE chunks(id TEXT PRIMARY KEY,embed_text TEXT,kind TEXT,edition TEXT,language TEXT,book TEXT)')
        with self.assertRaises(RuntimeError):list(missing_rows(db, {'absent'}))


if __name__ == '__main__':unittest.main()
