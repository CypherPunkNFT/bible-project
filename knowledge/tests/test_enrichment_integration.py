import json
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path
from knowledge.enrichment.core import checksum, dumps, identity, readonly
from knowledge.enrichment.runner import execute, Cancelled
from knowledge.enrichment.validation import validate
from knowledge.enrichment.query import Tables
from knowledge.enrichment.rules import load_pack


class IntegrationTests(unittest.TestCase):
    def setUp(self):
        base=Path(__file__).resolve().parents[3]/'KnowledgeBase/graph-development/test-runtime'; base.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=base); self.root=Path(self.temp.name); self.config={'state_dir':self.root}
        self.corpus=self.root/'corpus.sqlite3'; self.inputs=self.root/'inputs.sqlite3'
        d=sqlite3.connect(self.corpus)
        d.executescript('''CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE documents(id TEXT PRIMARY KEY,title TEXT,kind TEXT,source TEXT,language TEXT,metadata TEXT);
            CREATE TABLE chunks(rowid INTEGER PRIMARY KEY,id TEXT UNIQUE,document_id TEXT,title TEXT,text TEXT,search_text TEXT,locator TEXT,language TEXT);
            CREATE VIRTUAL TABLE chunks_fts USING fts5(title,search_text,content='chunks',content_rowid='rowid');
            CREATE TABLE verses(book TEXT,chapter INTEGER,verse_end INTEGER,edition TEXT);CREATE TABLE edges(id INTEGER PRIMARY KEY,subject TEXT,relation TEXT,object TEXT,source TEXT,metadata TEXT);
            CREATE TABLE references_to(document_id TEXT,edition TEXT,start INTEGER,end INTEGER,source TEXT);
            CREATE TABLE files(path TEXT PRIMARY KEY,sha256 TEXT);CREATE TABLE library_files(path TEXT PRIMARY KEY,sha256 TEXT,status TEXT,document_id TEXT,metadata TEXT);''')
        d.execute('INSERT INTO meta VALUES(?,?)',('catalog',dumps({'books':[{'num':45,'code':'rom','name':'Romans'}]})))
        d.execute('INSERT INTO meta VALUES(?,?)',('built_at','fixture-v1'))
        d.executemany('INSERT INTO verses VALUES(?,?,?,?)',[('rom',c,32,'kjv') for c in range(1,17)])
        for doc,title in [('d1','A theology sermon'),('d2','A second theology sermon')]:
            source=doc+'.txt'; d.execute('INSERT INTO files VALUES(?,?)',(source,doc+'-sha'))
            meta=dumps({'work':{'id':'w' if doc=='d1' else 'w2'},'edition':{'id':'ed' if doc=='d1' else 'ed2'}})
            d.execute('INSERT INTO documents VALUES(?,?,?,?,?,?)',(doc,title,'library_text',source,'en',meta))
            d.execute('INSERT INTO library_files VALUES(?,?,?,?,?)',(source,doc+'-sha','indexed',doc,'{}'))
        # A second original witness points to the same published document.
        d.execute('INSERT INTO library_files VALUES(?,?,?,?,?)',('duplicate.txt','d1-sha','duplicate','d1','{}'))
        for n,(doc,text,locator) in enumerate([('d1','John Owen teaches justification by faith in Christ, Rom. 4:3.','section · part 1'),
                                             ('d1','And also Rom.','section · part 2'),('d1','5:1. Prayer to God matters.','section · part 3'),
                                             ('d2','Faith in Christ: Rom. 4:3 and Rom. 5:1.','section · part 1')],1):
            d.execute('INSERT INTO chunks VALUES(?,?,?,?,?,?,?,?)',(n,'c'+str(n),doc,'Body',text,text,locator,'en'))
        d.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')"); d.commit(); d.close()
        i=sqlite3.connect(self.inputs)
        i.executescript('CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,metadata TEXT,path TEXT,sha256 TEXT); CREATE TABLE artifacts(path TEXT PRIMARY KEY,sha256 TEXT,metadata TEXT); CREATE TABLE overlays(path TEXT PRIMARY KEY,sha256 TEXT,metadata TEXT);')
        for id,kind,value in [('w','work',{'id':'w','kind':'work','title':'Work','genre':'theology','creators':[{'authorId':'author-owen','role':'author'}]}),
                              ('ed','edition',{'id':'ed','kind':'edition','title':'Edition','workId':'w'}),
                              ('w2','work',{'id':'w2','kind':'work','title':'Second work','genre':'theology','creators':[{'authorId':'author-owen','role':'author'}]}),
                              ('ed2','edition',{'id':'ed2','kind':'edition','title':'Second edition','workId':'w2'})]:
            i.execute('INSERT INTO records VALUES(?,?,?,?,?)',(id,kind,dumps(value),id+'.json',id+'-sha'))
        value={'authors':[{'id':'author-owen','name':'John Owen','aliases':['Owen'],'eligibility':'eligible'}],
               'subjects':[{'id':t,'label':t} for t in dict.fromkeys(r['topic'] for r in load_pack()['rules'])]}
        i.execute('INSERT INTO artifacts VALUES(?,?,?)',('registry.json','registry-sha',dumps(value))); i.commit(); i.close()
        self.manifest=dict(id='fixture-snapshot1',corpusBuild='fixture-v1',corpusPath=str(self.corpus),inputsPath=str(self.inputs),inputsSha256=checksum(self.inputs),artifacts=[],bytes=self.corpus.stat().st_size,archivedBodiesRedacted=True)

    def tearDown(self): self.temp.cleanup()

    def test_real_sqlite_extraction_validation_idempotence_duplicates_queries(self):
        result=execute(self.config,self.manifest)
        checked=validate(result['graphPath'],result['runId'],self.config)
        self.assertTrue(checked['passed'],checked)
        d=readonly(result['graphPath']); before=d.execute('SELECT count(*) FROM assertions').fetchone()[0]
        self.assertEqual(d.execute("SELECT count(*) FROM document_witnesses WHERE status='duplicate'").fetchone()[0],1)
        d.close()
        again=execute(self.config,self.manifest); self.assertEqual(result['runId'],again['runId'])
        tables=Tables(result['graphPath'],result['runId'])
        try:
            hits=tables.passage('rom',5,1); self.assertTrue(hits['rows'])
            evidence=tables.evidence(hits['rows'][0]['assertionId']); self.assertTrue(evidence['rows'])
            self.assertTrue(tables.author('author-owen')['rows'])
            self.assertTrue(tables.topic('justification')['rows'])
            self.assertTrue(tables.entity('author-owen')['rows'])
            self.assertTrue(tables.paths('w','author-owen')['rows'])
            self.assertTrue(tables.shared('d1','d2')['rows'])
            self.assertEqual(tables.db.execute('SELECT count(*) FROM assertions').fetchone()[0],before)
        finally: tables.close()

    def test_cancel_resume_and_changed_deleted_inputs_invalidate_active_results(self):
        marker=self.root/'graph-development/cancel.request'; marker.parent.mkdir(); marker.write_text('cancel')
        with self.assertRaises(Cancelled): execute(self.config,self.manifest)
        marker.unlink(); first=execute(self.config,self.manifest)
        copy=self.root/'corpus2.sqlite3'; shutil.copyfile(self.corpus,copy)
        d=sqlite3.connect(copy)
        for row in d.execute("SELECT rowid,title,search_text FROM chunks WHERE document_id='d1'").fetchall():
            d.execute("INSERT INTO chunks_fts(chunks_fts,rowid,title,search_text) VALUES('delete',?,?,?)",row)
        d.execute("DELETE FROM chunks WHERE document_id='d1'"); d.execute("DELETE FROM documents WHERE id='d1'")
        d.execute("DELETE FROM library_files WHERE document_id='d1'"); d.commit(); d.close()
        changed=self.manifest|dict(id='fixture-snapshot2',corpusPath=str(copy),corpusBuild='fixture-v2')
        second=execute(self.config,changed)
        self.assertNotEqual(first['runId'],second['runId'])
        self.assertTrue(validate(second['graphPath'],second['runId'],self.config)['passed'])
        tables=Tables(second['graphPath'],second['runId'])
        try:
            self.assertEqual(tables.entity('author-owen')['rows'],[])
            self.assertTrue(all(r['documentId']=='d2' for r in tables.passage('rom',4)['rows']))
        finally: tables.close()

    def test_tcp_collection_requires_affirmed_full_author_label(self):
        d=sqlite3.connect(self.corpus)
        source='D:/fixture/source-tcp-bulk/original.xml'
        d.execute('UPDATE documents SET source=?,metadata=? WHERE id=?',(source,dumps({'acquisition':{'author':'Lacroix, François de, 1582-1644.'}}),'d1'))
        d.execute('UPDATE files SET path=? WHERE path=?',(source,'d1.txt')); d.commit(); d.close()
        result=execute(self.config,self.manifest)
        table=Tables(result['graphPath'],result['runId'])
        try:
            self.assertEqual(table.db.execute("SELECT eligible FROM document_map WHERE run_id=? AND document_id='d1'",(result['runId'],)).fetchone()[0],0)
            self.assertTrue(table.candidates('TCP author eligibility unresolved; body extraction deferred')['rows'])
            self.assertTrue(all(r['documentId']!='d1' for r in table.passage('rom',4)['rows']))
        finally: table.close()

    def test_full_run_promotes_passing_topic_rule_and_defers_failed_passes(self):
        from unittest.mock import patch
        from knowledge.settings import write_json
        write_json(self.root/'graph-development/quality-policy.json',dict(reviewComplete=True,
            citationsPassed=False,entitiesPassed=False,passingTopicRules=['justification-1']))
        with patch('knowledge.enrichment.lifecycle.production_gate',return_value=dict(ready=True,corpusBuild='fixture-v1')):
            result=execute(self.config,self.manifest,'full')
        self.assertTrue(validate(result['graphPath'],result['runId'],self.config)['passed'])
        table=Tables(result['graphPath'],result['runId'])
        try:
            counts={r[0]:r[1] for r in table.db.execute('SELECT a.relation,count(*) FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=? GROUP BY a.relation',(result['runId'],))}
            self.assertGreater(counts.get('topic_match',0),0)
            self.assertEqual(counts.get('cites_reference',0),0)
            self.assertEqual(counts.get('mentions_entity',0),0)
            self.assertTrue(table.candidates('body citation extraction deferred by pilot quality gate')['rows'])
            self.assertTrue(table.candidates('body entity extraction deferred by pilot quality gate')['rows'])
        finally: table.close()


if __name__=='__main__': unittest.main()
