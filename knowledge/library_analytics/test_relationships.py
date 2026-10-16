import hashlib
import sqlite3
import unittest
import tempfile
from pathlib import Path
from types import SimpleNamespace
from .relationship_contract import fingerprints,tokens,SCHEMA
from .relationship_miner import build_bucket,process_document
from .section_contract import SCHEMA as SECTION_SCHEMA,SectionWriter,text_hash
from .concept_contract import SCHEMA as CONCEPT_SCHEMA
from .jobs import JobStore
from .inputs import packed
from .relationship_run import ProfileStore
from .relationship_cocitations import SCHEMA as JOINT_SCHEMA,write_batch,write_bucket
from .relationship_query_equivalence import queries

class RelationshipTests(unittest.TestCase):
    def test_neighbor_endpoint_queries_preserve_counts_and_deduplicate_joint_refs(self):
        db=self.database();db.executescript(JOINT_SCHEMA)
        def edge(a,b,channel,feature):db.execute('INSERT INTO pair_evidence VALUES(?,?,?,?,?,?,?,?,?,?,?)',('run',a,b,channel,feature,0,1,0,1,'h','h'))
        for a,b,feature in [(1,10,'a'),(1,10,'b'),(10,20,'c')]:edge(a,b,'wording',feature)
        for a,b,feature in [(1,10,'r1'),(1,10,'r2'),(10,20,'r4'),(10,30,'r6')]:edge(a,b,'reference',feature)
        db.execute('INSERT INTO joint_pairs VALUES(?,?,?,?)',('joint',1,10,packed(['r1','r3'])))
        db.execute('INSERT INTO joint_pairs VALUES(?,?,?,?)',('joint',10,20,packed(['r4','r5'])))
        sql=queries(Path(__file__).with_name('relationship_query.py'))
        self.assertEqual([tuple(r) for r in db.execute(sql['wording'],('run',10,'wording','run',10,'wording',1))],[(1,10,2),(10,20,1)])
        self.assertEqual([tuple(r) for r in db.execute(sql['cocitation'],('run',10,'run',10,'joint',10,'joint',10))],[(1,10,3),(10,20,2)])
    def test_neighbor_scan_bound_preserves_highest_rank_across_directions(self):
        db=self.database()
        for left in range(1,202):db.execute('INSERT INTO pair_evidence VALUES(?,?,?,?,?,?,?,?,?,?,?)',('run',left,500,'wording','f',0,1,0,1,'h','h'))
        for feature in ('f','g','h'):db.execute('INSERT INTO pair_evidence VALUES(?,?,?,?,?,?,?,?,?,?,?)',('run',500,700,'wording',feature,0,1,0,1,'h','h'))
        sql=queries(Path(__file__).with_name('relationship_query.py'))['wording']
        rows=[tuple(r) for r in db.execute(sql,('run',500,'wording','run',500,'wording',1))]
        self.assertEqual(len(rows),200);self.assertEqual(rows[0],(500,700,3));self.assertEqual(rows[-1],(199,500,1))
    def test_large_batch_default_bound_and_process_abort_rollback(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'relationships.sqlite3';store=JobStore(path);store.acquire();store.db.execute('CREATE TABLE facts(id INTEGER PRIMARY KEY)')
            records=[('run',str(i),'relationship','document:'+str(i),str(i),'v') for i in range(256)]
            store.register_many(records)
            def write(db,i):
                db.execute('INSERT INTO facts VALUES(?)',(i,))
                if i==255:raise KeyboardInterrupt('Simulated process abort before group commit')
                return 1
            work=[(str(i),lambda db,i=i:write(db,i)) for i in range(256)]
            with self.assertRaises(ValueError):store.execute_many(work)
            with self.assertRaises(ValueError):store.execute_many(work,max_jobs=257)
            with self.assertRaises(KeyboardInterrupt):store.execute_many(work,max_jobs=256)
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],0)
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],0)
            store.close();store=JobStore(path);store.acquire()
            work=[(str(i),lambda db,i=i:db.execute('INSERT INTO facts VALUES(?)',(i,)).rowcount) for i in range(256)]
            self.assertEqual(set(store.execute_many(work,max_jobs=256).values()),{'completed'})
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],256)
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],256)
            self.assertEqual(set(store.execute_many(work,max_jobs=256).values()),{'skipped'});store.close()
    def test_large_profile_discards_only_uncommitted_tail(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'relationships.sqlite3';store=ProfileStore(path);store.document_batch=256;store.acquire();store.db.execute('CREATE TABLE facts(id INTEGER PRIMARY KEY)')
            for i in range(257):
                store.register('run',str(i),'relationship','document:'+str(i),str(i),'v')
                store.execute(str(i),lambda db,i=i:db.execute('INSERT INTO facts VALUES(?)',(i,)).rowcount)
            store.close();store=JobStore(path);store.acquire()
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],256)
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],256);store.close()
    def test_joint_citations_use_combination_not_individual_frequency(self):
        db=self.database();db.executescript(JOINT_SCHEMA)
        def ref(key,start,group):return {'feature':key,'start':start,'end':start+3,'independence_group':group}
        windows=[(1,[ref('[1,1001,1001]',0,'a'),ref('[2,2001,2001]',10,'a')]),
            (2,[ref('[1,1001,1001]',0,'b'),ref('[2,2001,2001]',10,'b')])]
        with db:write_batch(db,'joint',0,windows)
        bucket=db.execute('SELECT bucket FROM joint_postings LIMIT 1').fetchone()[0]
        with db:write_bucket(db,'joint',bucket)
        self.assertEqual(db.execute('SELECT count(*) FROM joint_pairs').fetchone()[0],1)
        self.assertEqual(tuple(db.execute('SELECT left_window,right_window FROM joint_pairs').fetchone()),(1,2))
    def test_profile_batches_atomically_and_discards_uncommitted_tail(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'relationships.sqlite3';store=ProfileStore(path);store.acquire();store.db.execute('CREATE TABLE facts(id INTEGER PRIMARY KEY)')
            for i in range(17):
                store.register('run',str(i),'relationship','document:'+str(i),str(i),'v')
                store.execute(str(i),lambda db,i=i:db.execute('INSERT INTO facts VALUES(?)',(i,)).rowcount)
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],16)
            store.close();store=ProfileStore(path);store.acquire()
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],16)
            store.register('run','16','relationship','document:16','16','v')
            store.execute('16',lambda db:db.execute('INSERT INTO facts VALUES(16)').rowcount)
            store.register('run','bucket','relationship','bucket:0','bucket','v')
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],17);store.close()
    def test_normalized_offsets_and_long_s(self):
        a='Faith, ſure hope — '+' '.join('word'+str(i) for i in range(120))
        b=a.upper().replace(',',';').replace('—','  ')
        self.assertEqual([x[0] for x in fingerprints(a)],[x[0] for x in fingerprints(b)])
        for key,start,end,sha in fingerprints(a):
            self.assertEqual(sha,hashlib.sha256(a[start:end].encode()).hexdigest())
            self.assertEqual(key,hashlib.sha256(' '.join(t[0] for t in tokens(a[start:end])).encode()).hexdigest())
    def test_short_and_unsegmented_scope(self):
        self.assertEqual(fingerprints('one two'),[])
        self.assertEqual(fingerprints('中文文本無空格'),[])
    def test_guaranteed_shared_long_run(self):
        common=' '.join('token'+str(i) for i in range(100))
        a={x[0] for x in fingerprints('prefix different '+common+' ending one')}
        b={x[0] for x in fingerprints('other opening '+common+' ending two')}
        self.assertTrue(a&b)
    def test_not_semantic_or_accent_normalization(self):
        self.assertNotEqual(tokens('café')[0][0],tokens('cafe')[0][0])
        self.assertEqual(fingerprints('God loves his people'),[])
    def database(self):
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA);self.addCleanup(db.close);return db
    def add(self,db,wid,group,feature='f',channel='wording'):
        db.execute('INSERT INTO postings VALUES(?,?,?,?,?,?,?,?,?,?,?)',('run',channel,0,feature,wid,str(wid),group,0,100,'hash',None))
    def test_pairs_separate_independence_groups(self):
        db=self.database()
        for wid,group in [(1,'a'),(2,'a'),(3,'b')]:self.add(db,wid,group)
        build_bucket(db,'run',0)
        self.assertEqual([(r[0],r[1]) for r in db.execute('SELECT left_window,right_window FROM pair_evidence')],[(1,3),(2,3)])
    def test_common_feature_is_explicitly_deferred(self):
        db=self.database()
        for wid in range(33):self.add(db,wid,str(wid))
        build_bucket(db,'run',0)
        self.assertEqual(db.execute('SELECT count(*) FROM pair_evidence').fetchone()[0],0)
        self.assertEqual(db.execute('SELECT disposition FROM feature_stats').fetchone()[0],'frequent-feature-deferred')
    def test_new_population_recomputes_old_feature_eligibility(self):
        db=self.database()
        for wid in range(32):self.add(db,wid,str(wid))
        build_bucket(db,'run',0)
        old=db.execute('SELECT count(*) FROM pair_evidence WHERE run_id=?',('run',)).fetchone()[0]
        self.assertGreater(old,0)
        db.execute("INSERT INTO postings SELECT 'new',channel,bucket,feature,window_id,document_id,independence_group,start,end,witness_hash,parent_reference_id FROM postings WHERE run_id='run'")
        db.execute("INSERT INTO postings VALUES('new','wording',0,'f',33,'33','33',0,100,'hash',NULL)")
        build_bucket(db,'new',0)
        self.assertEqual(db.execute("SELECT count(*) FROM pair_evidence WHERE run_id='new'").fetchone()[0],0)
        self.assertEqual(db.execute("SELECT count(*) FROM pair_evidence WHERE run_id='run'").fetchone()[0],old)
    def test_group_representative_bound(self):
        db=self.database()
        for wid in range(10):self.add(db,wid,'a' if wid<9 else 'b')
        build_bucket(db,'run',0)
        self.assertEqual(db.execute('SELECT count(*) FROM pair_evidence').fetchone()[0],2)
    def test_pair_transaction_rollback(self):
        db=self.database();self.add(db,1,'a');self.add(db,2,'b');db.commit()
        with self.assertRaises(RuntimeError):
            with db:build_bucket(db,'run',0);raise RuntimeError('crash')
        self.assertEqual(db.execute('SELECT count(*) FROM pair_evidence').fetchone()[0],0)
        self.assertEqual(db.execute('SELECT count(*) FROM bucket_results').fetchone()[0],0)
        with db:build_bucket(db,'run',0)
        self.assertEqual(db.execute('SELECT count(*) FROM pair_evidence').fetchone()[0],1)
    def test_source_change_atomicity_and_resume(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'source.jsonl';body=' '.join('word'+str(i) for i in range(120))
            path.write_text(packed({'text':body})+'\n',encoding='utf-8');sha=hashlib.sha256(path.read_bytes()).hexdigest()
            source=sqlite3.connect(':memory:');source.row_factory=sqlite3.Row;source.executescript(SECTION_SCHEMA)
            writer=SectionWriter(source,'sections',{'document_id':'doc'},sha,[{'text':body,'ordinal':0,'locator':'fixture'}],'extraction-cache-block',str(path),sha)
            version=writer.add('native','xml-sermon','A sermon',0,len(body));source.commit()
            parent=sqlite3.connect(':memory:');parent.row_factory=sqlite3.Row;parent.executescript(CONCEPT_SCHEMA)
            parent.execute('CREATE INDEX reference_window ON reference_occurrences(window_id)')
            parent.execute('INSERT INTO windows VALUES(?,?,?,?,?,?,?,?,?,?)',(1,'parent','doc',version,0,0,len(body),text_hash(body),'xml-sermon','native-structure'));parent.commit()
            inputs=SimpleNamespace(db=parent,sections=source,run='parent',prepared={})
            row={'document_id':'doc','independence_group':'group'}
            store=JobStore(Path(temp)/'relationships.sqlite3');store.acquire();store.db.executescript(SCHEMA)
            store.register('run','one','document','doc','hash','v')
            self.assertEqual(store.execute('one',lambda db:process_document(inputs,db,'run',row)),'completed')
            before=[tuple(r) for r in store.db.execute('SELECT * FROM postings')]
            self.assertTrue(before)
            self.assertEqual(store.execute('one',lambda db:process_document(inputs,db,'run',row)),'skipped')
            path.write_text(packed({'text':'changed'})+'\n',encoding='utf-8');inputs.prepared={}
            store.register('run','two','document','changed','other','v')
            self.assertEqual(store.execute('two',lambda db:process_document(inputs,db,'run',row)),'stale')
            self.assertEqual(before,[tuple(r) for r in store.db.execute('SELECT * FROM postings')])
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],1)
            store.close();parent.close();source.close()

if __name__=='__main__':unittest.main()
