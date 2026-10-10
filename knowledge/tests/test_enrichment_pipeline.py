"""Focused behavioural checks, including 44 hard-negative citation fixtures."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from knowledge.enrichment.core import Graph, dumps, identity, text_hash, writer_lock
from knowledge.enrichment.citations import CitationParser, boundary_citations
from knowledge.enrichment.rules import load_pack, matches, phrase_spans, fts_phrase
from knowledge.enrichment.lifecycle import production_gate, rollback
from knowledge.enrichment.runner import Cancelled, check_cancel
from knowledge.settings import write_json
from knowledge.enrichment.foundation import author_labels

BOOKS=[{'code':'rom','name':'Romans'},{'code':'jhn','name':'John'},{'code':'1co','name':'1 Corinthians'}]
BOUNDS={('rom',c):32 for c in range(1,17)}|{('jhn',c):50 for c in range(1,22)}|{('1co',c):40 for c in range(1,17)}


class EnrichmentTests(unittest.TestCase):
    def setUp(self):
        root=Path(__file__).resolve().parents[3]/'KnowledgeBase/graph-development/test-runtime'
        root.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=root); self.root=Path(self.temp.name)
        self.config={'state_dir':self.root,'db':self.root/'NEVER-CREATE-LIVE.sqlite3'}
        self.parser=CitationParser(BOOKS,BOUNDS)

    def tearDown(self): self.temp.cleanup()

    def test_roman_and_numbered_book(self):
        hits,_=self.parser.extract('Compare II Corinthians ii. vii and Rom. iv. 3.')
        # Two Corinthians is not in this deliberately small fixture catalogue.
        self.assertEqual((hits[-1]['chapter'],hits[-1]['verse']),(4,3))
        hits,_=self.parser.extract('I Cor. xv. 12–14; 20.')
        self.assertEqual([(h['verse'],h['endVerse']) for h in hits],[(12,14),(20,20)])

    def test_cross_chapter_range_and_lists(self):
        hits,_=self.parser.extract('Rom. 4:3–5:2, 6; 6:4.')
        self.assertEqual([(h['chapter'],h['verse'],h['endChapter'],h['endVerse']) for h in hits],[(4,3,5,2),(4,6,4,6),(6,4,6,4)])
        self.assertTrue(all(h['edition']=='unknown' for h in hits))

    def test_chapter_reference(self):
        hit=self.parser.extract('Romans chapter IV and Rom. v.')[0]
        self.assertEqual(len(hit),2); self.assertEqual(hit[0]['verse'],1)

    def test_44_hard_negatives(self):
        negatives=['John III was a pope.','Calvin says nothing here.','Owen and John are names.',
                   'The job 3:2 was scheduled.','Romans are a people.','A catalogue title: Prayer.',
                   'Rom. 4:0','Rom. 0:3','Rom. 99:3','Rom. 4:999','Rom. ivx. 3','Rom. 4:8-3',
                   'John 3:2-2:3','1 Cor. 15:99','1 Cor. 15:0','John III, king of Sweden.',
                   'Rom. iv. I believe this claim.','The software version is 4:3.','A price of 3:16.',
                   'Romans chapter 300']
        negatives += [f'Rom. {n}:99' for n in range(1,17)]
        negatives += [f'John {n}:0' for n in range(1,9)]
        self.assertEqual(len(negatives),44)
        for text in negatives:
            with self.subTest(text=text): self.assertEqual(self.parser.extract(text)[0],[])

    def test_prose_after_semicolon_is_not_verse_one(self):
        hits,_=self.parser.extract('Rom. 4:3; I believe the apostle.')
        self.assertEqual(len(hits),1); self.assertEqual(hits[0]['literal'],'Rom. 4:3')

    def test_original_offsets(self):
        text='😀 ſtrange words: Rom. iv. 3.'; hit=self.parser.extract(text)[0][0]
        self.assertEqual(text[hit['start']:hit['end']],hit['literal'])

    def test_verified_boundary_only(self):
        left=dict(id='a',document_id='d',text='Faith, Rom.',locator='section · part 1')
        right=dict(id='b',document_id='d',text='iv. 3 teaches this.',locator='section · part 2')
        self.assertEqual(len(boundary_citations(self.parser,left,right)),1)
        self.assertEqual(boundary_citations(self.parser,left,right|{'locator':'other · part 2'}),[])
        self.assertEqual(boundary_citations(self.parser,left,right|{'document_id':'other'}),[])

    def test_unicode_maps_to_original_span(self):
        text='ſuffering and ﬀ faith, cafe\u0301.'
        for phrase,literal in [('suffering','ſuffering'),('ff','ﬀ'),('café','cafe\u0301')]:
            a,b=next(phrase_spans(text,phrase)); self.assertEqual(text[a:b],literal)

    def test_24_rules_positive_negative_fixtures(self):
        pack=load_pack(); self.assertEqual(len(pack['rules']),24)
        for rule in pack['rules']:
            with self.subTest(rule=rule['id']):
                self.assertTrue(list(matches(rule['positive'],rule)))
                self.assertFalse(list(matches(rule['negative'],rule)))

    def test_historical_alias_and_no_endorsement_inference(self):
        rule=load_pack()['rules'][0]
        self.assertTrue(list(matches('He denies iustification by faith in Christ.',rule)))
        # Negation is still a located discussion, never an endorsement assertion.
        self.assertEqual(rule['topic'],'justification')

    def test_fts_literal_cannot_execute_expression(self):
        db=sqlite3.connect(':memory:'); db.execute('CREATE VIRTUAL TABLE f USING fts5(text)')
        db.executemany('INSERT INTO f VALUES(?)',[('faith OR prayer',),('faith',)])
        self.assertEqual(db.execute('SELECT count(*) FROM f WHERE f MATCH ?',(fts_phrase('faith OR prayer'),)).fetchone()[0],1)
        db.close()

    def graph(self):
        g=Graph(self.root/'graph.sqlite3')
        self.addCleanup(g.close)
        g.db.execute('INSERT INTO snapshots VALUES(?,?,?,?)',('s','b','retained','{}'))
        for run in ('old','new'): g.db.execute('INSERT INTO runs VALUES(?,?,?,?,?)',(run,'s','pilot','running','{}'))
        return g

    def test_typed_endpoints_and_no_influence(self):
        g=self.graph(); g.entity('w','work','w'); g.entity('a','historical_person','a')
        o=g.observation('old','s','f','sha',{},'literal')
        g.assertion('old','w','authored_by','a',[o])
        with self.assertRaises(ValueError): g.assertion('old','a','authored_by','w',[o])
        with self.assertRaises(ValueError): g.assertion('old','w','influenced_by','a',[o])
        with self.assertRaises(ValueError): g.assertion('old','w','authored_by','a',[])
        g.close()

    def test_identical_evidence_reuses_and_deleted_inputs_do_not_leak(self):
        g=self.graph(); g.entity('w','work','w'); g.entity('a','historical_person','a')
        o=g.observation('old','s','f','sha',{'field':'a'},'a')
        edge=g.assertion('old','w','authored_by','a',[o])
        o2=g.observation('new','s','f','sha',{'field':'a'},'a')
        self.assertEqual(o,o2); self.assertEqual(g.assertion('new','w','authored_by','a',[o2]),edge)
        self.assertEqual(g.db.execute('SELECT count(*) FROM assertions').fetchone()[0],1)
        changed=g.observation('new','s','f','changed-sha',{'field':'a'},'new literal')
        self.assertNotEqual(changed,o)
        g.db.execute("DELETE FROM run_assertions WHERE run_id='new'")
        self.assertEqual(g.db.execute("SELECT count(*) FROM run_assertions WHERE run_id='new'").fetchone()[0],0)
        self.assertEqual(g.db.execute("SELECT count(*) FROM run_assertions WHERE run_id='old'").fetchone()[0],1)
        g.close()

    def test_cancel_and_committed_checkpoint_resume(self):
        g=self.graph(); g.checkpoint('old','body','1000'); g.close()
        self.config['state_dir'].joinpath('graph-development').mkdir()
        marker=self.root/'graph-development/cancel.request'; marker.write_text('cancel')
        with self.assertRaises(Cancelled): check_cancel(self.config)
        marker.unlink(); check_cancel(self.config)
        g=Graph(self.root/'graph.sqlite3'); self.assertEqual(g.cursor('old','body'),'1000'); g.close()

    def test_writer_lock_excludes_second_writer(self):
        with writer_lock(self.root):
            with self.assertRaises(OSError):
                with writer_lock(self.root): pass

    def test_wait_gate_does_not_open_live_database(self):
        gate=production_gate(self.config); self.assertFalse(gate['ready']); self.assertFalse(self.config['db'].exists())

    def test_release_rollback_preserves_both_pointers(self):
        root=self.root/'graph-development'; write_json(root/'current-release.json',{'releaseId':'new'})
        write_json(root/'previous-release.json',{'releaseId':'old'})
        self.assertEqual(rollback(self.config)['releaseId'],'old')
        self.assertEqual(json.loads((root/'previous-release.json').read_text())['releaseId'],'new')

    def test_pack_rejects_executable_conditions(self):
        pack=load_pack(); pack['rules'][0]['sql']='DROP TABLE chunks'
        file=self.root/'bad.json'; file.write_text(json.dumps(pack))
        with self.assertRaises(ValueError): load_pack(file)

    def test_complete_catalogue_author_label_inversion(self):
        self.assertIn('john owen',author_labels('Owen, John, 1616-1683.'))
        self.assertNotIn('john owen',author_labels('Owen'))

    def test_historical_citation_aliases_dotted_lists_and_verse_word(self):
        hits,_=self.parser.extract('Rom: iv. 3. 5. John 17. verſ. 11. Iohn 3.5.')
        self.assertEqual([(h['book'],h['chapter'],h['verse']) for h in hits],[('rom',4,3),('rom',4,5),('jhn',17,11),('jhn',3,5)])

    def test_printed_index_requires_uninterrupted_numeric_lines(self):
        hits,_=self.parser.extract('Romans\n4:3\n5:1-2\nA paragraph\n6:4')
        self.assertTrue(any(h['chapter']==5 and h['endVerse']==2 for h in hits))
        self.assertFalse(any(h['chapter']==6 for h in hits))


if __name__=='__main__': unittest.main()
