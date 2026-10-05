"""Evidence-boundary regressions for the L06 passage and theme inventory."""
import hashlib
import json
from pathlib import Path
import sys
import unittest

SITE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SITE / 'scripts'))
from bible.paths import SOURCES

LIB = SITE / 'content/library'
OUT = LIB / 'reports/scripture-studies'
def read(p): return json.loads(p.read_text(encoding='utf-8'))

class ScriptureStudiesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sections = read(OUT/'inventory.json')['sections']
        cls.index = read(OUT/'passage-index.json')['sections']
        cls.decisions = read(OUT/'interpretations.json')
        cls.books = read(SITE/'content/apologetics/scripture-index.json')['books']

    def test_all_passage_endpoints_exist(self):
        valid = {b['num']*1000000+c*1000+v for b in self.books
                 for c,n in enumerate(b['chapters'],1) for v in range(1,n+1)}
        for s in self.index:
            for p in s['passages']:
                self.assertIn(p['start'],valid)
                self.assertIn(p['end'],valid)
                self.assertLessEqual(p['start'],p['end'])

    def test_source_heading_error_preserved_and_corrected(self):
        s=next(s for s in self.sections if s['key']=='calvin-01-13-01')
        self.assertEqual(s['sourceHeading'],'Genesis 13:1-20')
        self.assertEqual(s['range'],['Genesis',13,1,13,18])
        self.assertTrue(any('displayed Scripture ends at verse 18' in e['note'] for e in s['evidence']))

    def test_hebrews_inventory_covers_book_without_claiming_body_review(self):
        rows=[s for s in self.sections if s['key'].startswith('calvin-44-')]
        actual={(s['range'][1],v) for s in rows for v in range(s['range'][2],s['range'][4]+1)}
        book=next(b for b in self.books if b['name']=='Hebrews')
        expected={(c,v) for c,n in enumerate(book['chapters'],1) for v in range(1,n+1)}
        self.assertEqual(len(rows),67)
        self.assertEqual(actual,expected)
        self.assertTrue(all(s['evidenceLevel']=='source-heading' for s in rows))

    def test_introductions_cover_27_books_without_exposition_inflation(self):
        rows=[s for s in self.index if s['kind']=='book-introduction']
        self.assertEqual(len(rows),26)
        self.assertEqual({b for s in rows for b in s['bookNames']},{b['name'] for b in self.books[39:]})
        self.assertTrue(all(s['passages']==[] for s in rows))
        self.assertEqual(sum(s['bookNames']==['2 John','3 John'] for s in rows),1)

    def test_themes_and_comparisons_keep_eligible_author_identity(self):
        treatments={r['id']:r for r in self.decisions['treatments']}
        sections={s['key']:s for s in self.sections}
        eligible={a['id'] for a in read(LIB/'authors.json')['authors'] if a['eligibility']=='eligible'}
        themes=read(OUT/'theme-index.json')['themes']
        self.assertEqual(set(themes),{'covenant','promise-fulfillment','typology','kingdom','temple','sacrifice','exile-restoration','new-creation'})
        for tag,ids in themes.items():
            self.assertTrue(ids)
            for ident in ids: self.assertIn(tag,treatments[ident]['subjects'])
        for r in treatments.values():
            self.assertEqual(r['authorId'],sections[r['sectionKey']]['authorId'])
            self.assertIn(r['authorId'],eligible)
            self.assertTrue(r['locator'] and r['limit'])
        for c in self.decisions['comparisons']:
            self.assertEqual(len({treatments[i]['authorId'] for i in c['treatmentIds']}),2)
            self.assertTrue(c['difference'] and c['limits'])

    def test_substantial_exposition_requires_body_assessment(self):
        expected={('work-l06-'+r['sectionKey'],r['locator']) for r in self.decisions['treatments'] if r['ranges']}
        actual={(s['workId'],p['locator']) for s in self.index for p in s['passages'] if p['role']=='substantial-exposition'}
        self.assertEqual(actual,expected)

    def test_acquired_originals_and_edition_reuse(self):
        files=[f for f in read(OUT/'acquisition-manifest.json')['files'] if not f['evidenceOnly']]
        self.assertEqual(len(files),4)
        self.assertEqual(sum(f['byteCount'] for f in files),25927121)
        for f in files:
            data=(SOURCES/f['relativePath']).read_bytes()
            self.assertEqual(len(data),f['byteCount'])
            self.assertEqual(hashlib.sha256(data).hexdigest(),f['sha256'])
            self.assertIn(f['editionId'],{'edition-vos-kingdom','edition-berkhof-introduction'})
        for s in self.sections:
            self.assertTrue((LIB/'catalog/works'/(s['parentWorkId']+'.json')).exists())
            self.assertTrue((LIB/'catalog/editions'/(s['editionId']+'.json')).exists())

if __name__=='__main__': unittest.main()
