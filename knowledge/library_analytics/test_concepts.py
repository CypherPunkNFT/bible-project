import sqlite3
import tempfile
import unittest
import json
from types import SimpleNamespace
from pathlib import Path
from .concept_contract import Matcher,ruleset,evaluation_contract,SCHEMA
from .concept_index import partition,process_document,fts_name
from .section_contract import SCHEMA as SECTION_SCHEMA,SectionWriter,text_hash
from .inputs import packed
from .concept_query import normalized_author_labels,attribution_conflicts,front_matter,question_evidence_issue,focused_expression
from .concept_release import export_jsonl
from .concept_matcher_fast import FastMatcher
from .concept_run import CachedStore
from .jobs import JobStore,StaleInput
from .concept_judgments import paired_completion

class ConceptsTest(unittest.TestCase):
    def test_paired_evidence_requires_both_ends(self):
        results=[{'id':10},{'id':20},{'id':30}]
        self.assertEqual(paired_completion(results,[{10},{30}]),3)
        self.assertEqual(paired_completion(results,[{10},{40}]),0)
        self.assertEqual(paired_completion(results,[{10}]),0)
    def test_question_evidence_filters_apparatus_without_claiming_relevance(self):
        self.assertTrue(question_evidence_issue('div','1:1 1:2 1:3 1:4 '*40))
        self.assertTrue(question_evidence_issue('index_split_001','Table of Contents\nFaith 10\nGrace 20'))
        self.assertTrue(question_evidence_issue('Kadesh','Kadesh means holiness.'))
        prose=('The apostle explains why believers should place their hope in the grace of God and pursue holiness. '
               'This passage connects their conduct with the character of the one who called them and with their redemption through Christ.')
        self.assertIsNone(question_evidence_issue('Hope and holiness',prose))
        self.assertEqual(focused_expression('1 Peter 1 and holiness'),'"peter" AND "holiness"')
    def test_cache_profile_resume_skips_only_successful_jobs(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'jobs.sqlite3';s=JobStore(path);s.acquire()
            s.db.execute('CREATE TABLE facts(value TEXT)')
            record=('run','job','task','scope','fp','v');s.register_many([record])
            def write(db):db.execute("INSERT INTO facts VALUES('complete')");return 1
            s.execute_many([('job',write)]);s.close()
            s=CachedStore(path);s.acquire();before=s.db.total_changes
            s.register_many([record]);self.assertEqual(s.execute_many([('job',write)]),{'job':'skipped'})
            self.assertEqual(before,s.db.total_changes)
            s.register_many([('run','new','task','newscope','newfp','v')])
            self.assertEqual(s.execute_many([('new',write)]),{'new':'completed'})
            self.assertEqual(s.db.execute('SELECT count(*) FROM facts').fetchone()[0],2);s.close()
    def test_fast_matcher_equivalence(self):
        rules=ruleset()['rules'];old=Matcher(rules);fast=FastMatcher(rules)
        texts=['İustification through faith in Chriſt','The full aſſurance of faith in Christ','prayer supplications imputed righteousness of Christ',
            '😀 prayerful prayer to God; insurance policy; legal justification; faıth',
            *[r['positive'] for r in rules if 'positive' in r],*[r['negative'] for r in rules if 'negative' in r]]
        for text in texts:self.assertEqual(old.extract(text,'en'),fast.extract(text,'en'),text)
    def test_author_constraints_do_not_confuse_mentions_or_conflicts(self):
        self.assertTrue(normalized_author_labels('Thomas Manton') & normalized_author_labels('Manton, Thomas (1620-1677) (9 classics)'))
        self.assertFalse(normalized_author_labels('John Owen') & normalized_author_labels('John Gill'))
        self.assertTrue(attribution_conflicts({'author_label':'Sinclair Ferguson','memberships':[['author-john-piper','preacher']]}))
        self.assertFalse(attribution_conflicts({'author_label':'John Piper','memberships':[['author-john-piper','preacher']]}))
        self.assertTrue(front_matter('Contents','Prayer 12'))
        self.assertFalse(front_matter('Prayer','Pray in faith to God.'))
    def test_rules_preserve_hard_negatives_and_language(self):
        rules=ruleset()['pack']['rules'];m=Matcher([{**r,'basis':'contextual'} for r in rules])
        for r in rules:
            self.assertTrue(any(h[1]==r['id'] for h in m.extract(r['positive'],'en')),r['id'])
            self.assertFalse(any(h[1]==r['id'] for h in m.extract(r['negative'],'en')),r['id'])
        self.assertEqual([],m.extract('Prayer to God','la'))
        self.assertTrue(m.extract('Praier to God in Christ','enm'))

    def test_unicode_offsets(self):
        m=Matcher([{'id':'a','topic':'a','phrase':'prayer','basis':'literal'}])
        text='😀 α Prayer to God'
        hit=m.extract(text,'en')[0]
        self.assertEqual(text[hit[2]:hit[3]],'Prayer')

    def test_partition_native_priority_and_bounds(self):
        spans=[dict(version_id='root',kind='document-representation',state='root',start=0,end=5000),
            dict(version_id='native',kind='xml-section',state='native',start=100,end=4500),
            dict(version_id='candidate',kind='heading-candidate',state='candidate-unreviewed',start=200,end=300),
            dict(version_id='child',kind='xml-section',state='native',start=500,end=700)]
        pieces=list(partition(spans))
        self.assertEqual(sum(b-a for s,a,b in pieces),5000)
        self.assertTrue(all(s['start']<=a<b<=s['end'] for s,a,b in pieces))
        self.assertTrue(all(s['version_id']=='native' for s,a,b in pieces if a==200))
        self.assertTrue(any(s['version_id']=='child' for s,a,b in pieces))

    def test_atomic_fts_and_facts_resume_stale(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'test.sqlite3';s=JobStore(path);s.acquire();s.db.executescript(SCHEMA)
            s.register('run','job','test','doc','fp','v')
            def fail(db):
                db.execute("INSERT INTO window_fts(rowid,heading,body) VALUES(1,'','uncommitted')")
                raise StaleInput('changed source')
            self.assertEqual(s.execute_many([('job',fail)])['job'],'stale')
            self.assertEqual(s.db.execute("SELECT count(*) FROM window_fts WHERE window_fts MATCH 'uncommitted'").fetchone()[0],0)
            def success(db):
                db.execute("INSERT INTO window_fts(rowid,heading,body) VALUES(1,'','committed')");return 1
            self.assertEqual(s.execute_many([('job',success)],retry_failed=True)['job'],'completed');s.close()
            s=JobStore(path);s.acquire()
            self.assertEqual(s.execute_many([('job',success)])['job'],'skipped')
            self.assertEqual(s.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],1);s.close()

    def test_eval_split_preserved(self):
        q=evaluation_contract()['questions']
        self.assertEqual(sum(x['split']=='reserved' for x in q),48)
        self.assertEqual(sum(x['split']=='development' for x in q),72)
        self.assertEqual(len({x['id'] for x in q}),120)

    def test_processor_source_change_and_resume_integration(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'source.jsonl';body='Prayer to God. An objection: prayer is vain. Reply: trust Christ.'
            path.write_text(packed({'text':body})+'\n',encoding='utf-8')
            import hashlib
            sha=hashlib.sha256(path.read_bytes()).hexdigest()
            source=sqlite3.connect(':memory:');source.row_factory=sqlite3.Row;source.executescript(SECTION_SCHEMA)
            d={'document_id':'doc','title':'A sermon','language':'en'}
            writer=SectionWriter(source,'parent',d,sha,[{'text':body,'ordinal':0,'locator':'sermon'}],
                'extraction-cache-block',str(path),sha)
            writer.add('native','xml-sermon','Prayer',0,len(body));source.commit()
            inputs=SimpleNamespace(sections=source,srun='parent',prepared={},
                matcher=FastMatcher([{'id':'prayer','topic':'prayer','phrase':'prayer','basis':'candidate'}]),
                scanner=SimpleNamespace(extract=lambda text:([],[])))
            store=JobStore(Path(temp)/'concepts.sqlite3');store.acquire();store.db.executescript(SCHEMA)
            run='kr110-'+'a'*24
            store.db.execute("CREATE VIRTUAL TABLE "+fts_name(run)+" USING fts5(heading,body,content='')")
            row={'document_id':'doc','language':'en','descriptor_json':packed(d)}
            store.register(run,'one','document','doc','fp','v')
            self.assertEqual(store.execute_many([('one',lambda db:process_document(inputs,db,run,row))])['one'],'completed')
            before=[tuple(r) for r in store.db.execute('SELECT * FROM windows')]
            self.assertEqual(store.execute_many([('one',lambda db:process_document(inputs,db,run,row))])['one'],'skipped')
            self.assertEqual(before,[tuple(r) for r in store.db.execute('SELECT * FROM windows')])
            path.write_text(packed({'text':'Changed source'})+'\n',encoding='utf-8');inputs.prepared={}
            store.register(run,'two','document','changed','fp2','v')
            self.assertEqual(store.execute_many([('two',lambda db:process_document(inputs,db,run,row))])['two'],'stale')
            self.assertEqual(before,[tuple(r) for r in store.db.execute('SELECT * FROM windows')])
            store.close();source.close()

    def test_generation_specific_ranking_population(self):
        db=sqlite3.connect(':memory:')
        for table in ('old','new'):db.execute('CREATE VIRTUAL TABLE '+table+' USING fts5(body)')
        db.execute("INSERT INTO old VALUES('prayer faith')");db.execute("INSERT INTO new VALUES('prayer faith')")
        old=db.execute("SELECT bm25(old) FROM old WHERE old MATCH 'prayer'").fetchone()[0]
        db.executemany('INSERT INTO new VALUES(?)',[('faith',)]*20)
        changed=db.execute("SELECT bm25(new) FROM new WHERE new MATCH 'prayer'").fetchone()[0]
        self.assertNotEqual(old,changed)
        newcomer=db.execute("INSERT INTO new VALUES('prayer prayer prayer')").lastrowid
        self.assertEqual(newcomer,db.execute("SELECT rowid FROM new WHERE new MATCH 'prayer' ORDER BY bm25(new) LIMIT 1").fetchone()[0])
        self.assertEqual(old,db.execute("SELECT bm25(old) FROM old WHERE old MATCH 'prayer'").fetchone()[0])
        db.close()

    def test_reproducible_exports(self):
        with tempfile.TemporaryDirectory() as folder:
            db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
            db.execute('CREATE TABLE facts(id INTEGER,value TEXT)')
            db.executemany('INSERT INTO facts VALUES(?,?)',[(1,'α'),(2,'Prayer')])
            a=export_jsonl(db,Path(folder)/'one.gz','SELECT * FROM facts ORDER BY id',())
            b=export_jsonl(db,Path(folder)/'two.gz','SELECT * FROM facts ORDER BY id',())
            self.assertEqual(a['sha256'],b['sha256']);self.assertEqual(a['rows'],2);db.close()

    def test_optimized_rank_retains_weighted_baseline(self):
        db=sqlite3.connect(':memory:')
        db.execute("CREATE VIRTUAL TABLE f USING fts5(heading,body,content='')")
        db.executemany('INSERT INTO f VALUES(?,?)',[('Prayer','Faith in Christ'),('Faith','Prayer prayer'),('Hope','God comforts believers')])
        explicit=db.execute("SELECT rowid,bm25(f,3,1) FROM f WHERE f MATCH 'prayer' ORDER BY 2").fetchall()
        fast=db.execute("SELECT rowid,rank FROM f WHERE f MATCH 'prayer' AND rank MATCH 'bm25(3,1)' ORDER BY rank").fetchall()
        self.assertEqual(explicit,fast)
        self.assertIsNone(db.execute('SELECT body FROM f LIMIT 1').fetchone()[0]);db.close()

if __name__=='__main__':unittest.main()
