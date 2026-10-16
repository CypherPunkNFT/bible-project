"""Small adversarial fixtures for analytical counting and matching semantics."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from build import SCHEMA, observation, insert, derive, ingest_readers, sha, family, unresolved_contributors, identity_candidates

class AnalyticsTests(unittest.TestCase):
    def test_hash_matching_is_not_title_matching_or_book_count(self):
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA)
        h='a'*64;j='b'*64
        insert(db,[observation('resource','r1',title='A book',author='Author',language='en',source='source-ccel',original=h,body_candidate=True,availability='held'),
                   observation('resource','r2',title='A book',author='Author',language='en',source='source-tcp-bulk',original=h,body_candidate=True,availability='held'),
                   observation('reader','s1',title='A book',author='Author',language='en',source='ccel',original=h,readable=True,pages=2,work='work-known'),
                   observation('reader','s2',title='A book',author='Author',language='en',source='ccel',original=j),
                   observation('reader','s3',title='A book',author='Author',language='en',source='ccel'),
                   observation('corpus','d1',original=h,kind='library_text'),
                   observation('corpus','d2',original=h,kind='library_catalog')])
        derive(db,lambda *a,**k:None)
        states=dict(db.execute('SELECT reader_id,match_state FROM reader_crosswalk'))
        self.assertEqual(states,{'s1':'multiple-recorded-hash-matches','s2':'no-corpus-hash-match','s3':'missing-recorded-hash'})
        self.assertEqual(db.execute('SELECT corpus_text_matches FROM reader_crosswalk WHERE reader_id="s1"').fetchone()[0],1)
        self.assertEqual(db.execute('SELECT count(*) FROM exact_duplicate_groups WHERE layer="resource"').fetchone()[0],1)
        self.assertEqual(db.execute('SELECT shared_recorded_hashes FROM source_overlap').fetchone()[0],1)
        self.assertEqual(db.execute('SELECT sum(hashes_unique_to_source) FROM source_complementarity').fetchone()[0],0)
        self.assertEqual(db.execute('SELECT count(*) FROM title_author_candidates WHERE layer="reader"').fetchone()[0],1)
        self.assertEqual(db.execute('SELECT count(*) FROM candidate_members').fetchone()[0],3) # includes unknown-hash member for review, never merge
        identity_candidates(db)
        self.assertEqual(db.execute('SELECT count(*) FROM identity_backfill_candidates WHERE state="unique-proposal"').fetchone()[0],2)
        self.assertEqual(db.execute('SELECT count(*) FROM observations WHERE layer="corpus" AND work_id IS NULL').fetchone()[0],2)
        db.close()

    def test_reader_contract_and_role_membership(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);root=p/'Website/public/content/teacher-library';(root/'records').mkdir(parents=True)
            records={'held-1':{'title':'A','availability':'on-site-text','pages':2,'contributors':['c1'],'authors':['Name']},
                     'held-2':{'title':'B','availability':'permission-required','pages':0,'contributors':['c1','missing-contributor']}}
            (root/'records/00.json').write_text(json.dumps(records))
            (root/'catalogue.json').write_text(json.dumps({'contributors':[{'id':'c1','name':'Name','roles':['translator']}]}))
            db=sqlite3.connect(':memory:');db.executescript(SCHEMA);ingest_readers(db,p,lambda *a,**k:None)
            self.assertEqual(db.execute('SELECT sum(readable_declared) FROM observations').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM reader_contributors').fetchone()[0],3)
            unresolved_contributors(db)
            self.assertEqual(db.execute('SELECT reader_links FROM unresolved_contributors').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT roles_json FROM contributors').fetchone()[0],'["translator"]')
            db.close()

    def test_hash_validation_and_explicit_source_aliases(self):
        self.assertIsNone(sha(''))
        self.assertIsNone(sha('a'*63))
        self.assertEqual(sha('A'*64),'a'*64)
        self.assertEqual(family('library:source-ccel-expansion'),'ccel')
        self.assertEqual(family('unmapped-name'),'unmapped-name')

if __name__=='__main__':unittest.main()
