import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from .review_catalog import SCHEMA
from .review_query import query,contains

class ReviewQueryTests(unittest.TestCase):
    def test_metadata_categories_are_literal_parameterized_and_paginated(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/'review.sqlite3';db=sqlite3.connect(p);db.executescript(SCHEMA)
            metadata={'author':'Calvín','source':'TCP','collections':['theology'],'traditions':['reformed']}
            db.execute('INSERT INTO review_documents VALUES(?,?,?,?,?)',('d',json.dumps(metadata),9,3,0))
            db.execute('INSERT INTO review_facets VALUES(?,?,?,?,?)',('d','statements',json.dumps({'kind':'quotation','role':'quoted-speaker'}),9,json.dumps({'id':'arg-1','start':4,'end':9})))
            db.commit();db.close()
            result=query(author='calvin',tradition='reformed',kind='quotation',role='quoted-speaker',database=p,limit=1)
            self.assertEqual(result['returnedGroups'],1);self.assertEqual(result['rows'][0]['n'],9);self.assertFalse(result['contentIncluded'])
            self.assertEqual(query(author="' OR 1=1 --",database=p)['returnedGroups'],0)
            self.assertEqual(query(database=p,offset=1)['returnedGroups'],0)
            self.assertEqual(query(collection='not-theology',database=p)['returnedGroups'],0)
            with self.assertRaises(ValueError):query(table='qualifications',role='quoted-speaker',database=p)

    def test_lookup_normalization(self):
        self.assertTrue(contains('Calvín','calvin'));self.assertFalse(contains('Different','calvin'))

if __name__=='__main__':unittest.main()
