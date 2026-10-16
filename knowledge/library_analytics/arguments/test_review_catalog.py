"""Isolated projection tests; never open production inputs or the global lease."""
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from .review_catalog import Catalog, RUN, SCHEMA, guard, one_document
from ..jobs import JobStore, StaleInput

class ReviewProjectionTests(unittest.TestCase):
    def test_exact_membership_and_roles_never_resolve_speaker(self):
        c=Catalog({'records':{'authors.json':{'authors':[{'id':'a','name':'A','traditions':['catholic'],'review':{'kind':'ai-assisted'}}]},'sources.json':{'sources':[]},'catalog/works/w.json':{'id':'w','collections':['theology'],'creators':[{'authorId':'a','role':'editor'}],'reading':{'cautions':['Claim-specific Catholic review required']}}}})
        d={'document_id':'d','title':'A title','author_label':'Different name','memberships':[['a','reader-membership']],'work_id':'w'}
        got=c.describe(d,'supported','test',[{'label':'T','role':'translator','basis':'recorded'}])
        self.assertEqual(got['author'],'Different name');self.assertEqual(got['traditions'],['catholic']);self.assertEqual(got['collections'],['theology'])
        self.assertIn('not statement attribution',got['traditionBasis']);self.assertEqual(got['contributors'][0]['role'],'translator');self.assertTrue(got['cautions'])
        d['work_id']='other';d['memberships']=[];got=c.describe(d,'supported','test',[])
        self.assertEqual(got['collections'],['unassigned']);self.assertEqual(got['traditions'],['unassigned'])

    def test_full_category_and_link_counts_preserve_negation_and_role(self):
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
        db.executescript('''CREATE TABLE statements(id,run_id,document_id,version_id,segment_ordinal,start,end,kind,speaker_label,speaker_role,endorsement,negation,attribution_basis,uncertainty_json);CREATE INDEX statements_run_document ON statements(run_id,document_id);''')
        rows=[('a','quotation','quoted-speaker','unresolved','no-negation-cue'),('b','objection','objector','not-endorsed','negation-cue'),('c','reply','source-author-candidate','author-assertion-candidate','no-negation-cue'),('d','statement','editor','unresolved','negation-cue')]
        for i,kind,role,end,n in rows:db.execute('INSERT INTO statements VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(i,RUN,'doc','v',0,1,20,kind,'label',role,end,n,'recorded','["candidate"]'))
        links={'a':[{'id':'l','kind':'contains-quotation','basis':'local','state':'candidate','source_id':'a','target_id':'b'}]}
        total,linkcount,facets=one_document(db,'doc',links)
        self.assertEqual((total,linkcount),(4,1));self.assertEqual(sum(f[3] for f in facets if f[1]=='statements'),4)
        dimensions=[json.loads(f[2]) for f in facets];self.assertTrue(any(d.get('role')=='editor' and d['negation']=='negation-cue' for d in dimensions));self.assertFalse(any('text' in f[4] for f in facets))
        db.close()

    def test_changed_input_rejection(self):
        db=sqlite3.connect(':memory:');db.executescript(SCHEMA);guard(db,{'generation':'a'});guard(db,{'generation':'a'})
        with self.assertRaises(StaleInput):guard(db,{'generation':'b'})
        db.close()

    def test_checkpoint_and_projection_rollback_and_idempotence(self):
        with tempfile.TemporaryDirectory() as root:
            store=JobStore(Path(root)/'jobs.sqlite3');store.acquire();store.db.executescript(SCHEMA)
            store.register('r','j','projection','doc','f','v')
            def fail(db):db.execute("INSERT INTO review_meta VALUES('partial','no')");raise ValueError('interrupted')
            self.assertEqual(store.execute('j',fail),'failed');self.assertIsNone(store.db.execute("SELECT * FROM review_meta WHERE key='partial'").fetchone());self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],0)
            def good(db):db.execute("INSERT INTO review_meta VALUES('complete','yes')");return 1
            self.assertEqual(store.execute('j',good,retry_failed=True),'completed');self.assertEqual(store.execute('j',good),'skipped');self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],1);store.close()

    def test_live_identity_cannot_be_bypassed(self):
        with tempfile.TemporaryDirectory() as root:
            one=JobStore(Path(root)/'jobs.sqlite3');two=JobStore(Path(root)/'jobs.sqlite3')
            try:
                one.acquire()
                with self.assertRaisesRegex(RuntimeError,'already owned'):two.acquire()
            finally:two.close();one.close()

if __name__=='__main__':unittest.main()
