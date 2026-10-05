"""L14 recommendation integrity and provenance checks; entirely offline."""
import hashlib
import json
from pathlib import Path
import re
import unittest
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1];LIB=SITE/'content/library';OUT=LIB/'reports/study-paths'
def read(p):return json.loads(p.read_text(encoding='utf-8'))

class StudyPaths(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.paths=read(OUT/'paths.json')['paths']
        cls.resources={r['id']:r for r in read(OUT/'resources.json')['resources']}

    def test_requested_paths_and_sequence(self):
        self.assertEqual({p['id'] for p in self.paths},{'new-believers','deeper-theology','apologetic-questions','pastoral-concerns','ministry-preparation'})
        for p in self.paths:
            self.assertEqual([s['position'] for s in p['stages']],[1,2,3])
            for field in ['audience','purpose','preparation','completion','sequenceRationale']:self.assertTrue(p[field])
            for s in p['stages']:
                for field in ['scripture','sermon','reading','purpose','reflection','practice']:self.assertTrue(s[field])
                for field in ['sermon','reading']:
                    r=self.resources[s[field]['resourceId']]
                    self.assertTrue(s[field]['why'])
                    self.assertEqual(r['genre']=='sermon',field=='sermon')

    def test_scripture_endpoints_and_destinations(self):
        books={b['code']:b for b in read(SITE/'content/apologetics/scripture-index.json')['books']}
        refs=[r for p in self.paths for s in p['stages'] for r in s['scripture']]
        refs += [p['preparationScripture'] for p in self.paths if 'preparationScripture' in p]
        self.assertEqual(len(refs),17)
        for r in refs:
            b=books[r['bookCode']];self.assertTrue(1<=r['firstVerse']<=r['lastVerse']<=b['chapters'][r['chapter']-1])
            self.assertEqual(r['start'],b['num']*1000000+r['chapter']*1000+r['firstVerse'])
            self.assertEqual(r['end'],b['num']*1000000+r['chapter']*1000+r['lastVerse'])
            self.assertEqual(r['url'],f"https://bibleproject.io/read/kjv/{b['code']}/{r['chapter']}?v={r['firstVerse']}")

    def test_qualified_attributed_recommendations(self):
        authors={a['id']:a for a in read(LIB/'authors.json')['authors']}
        for p in (LIB/'registry-extensions').glob('*.json'):authors.update({a['id']:a for a in read(p)['authors']})
        for r in self.resources.values():
            w=read(LIB/'catalog/works'/f"{r['workId']}.json")
            a=read(LIB/'catalog/assets'/f"{r['assetId']}.json")
            self.assertEqual(w['role'],'core-teaching');self.assertEqual(a['editionId'],r['editionId'])
            for c in w['creators']:self.assertEqual(authors[c['authorId']]['eligibility'],'eligible')
            for f in ['assignment','reviewedSpan','selectionBasis','limitations','sourceUrl']:self.assertTrue(r[f])
            self.assertEqual(r['verification'],'source-span-checked-for-this-recommendation')
            self.assertEqual(r['rightsSnapshot']['actions'],a['rights']['actions'])

    def test_input_fingerprints_unchanged(self):
        for item in read(OUT/'input-manifest.json')['files']:
            self.assertEqual(hashlib.sha256((SITE/item['path']).read_bytes()).hexdigest(),item['sha256'],item['path'])

    def test_pdf_source_and_selected_page_hashes(self):
        import pymupdf
        cache={}
        for r in self.resources.values():
            if not r['pdfPages']:continue
            aid=r['assetId']
            if aid not in cache:
                a=read(LIB/'catalog/assets'/f'{aid}.json');raw=(SOURCES/a['relativePath']).read_bytes()
                cache[aid]=(hashlib.sha256(raw).hexdigest(),pymupdf.open(stream=raw,filetype='pdf'))
            digest,doc=cache[aid];self.assertEqual(digest,r['rawSha256'])
            txt='\n'.join(doc[p-1].get_text() for p in r['pdfPages'])
            self.assertEqual(hashlib.sha256(txt.encode()).hexdigest(),r['reviewedTextSha256'])

    def test_source_access_and_publication_unchanged(self):
        a=read(OUT/'source-access.json')
        self.assertEqual({x['id'] for x in a['policies']},{'prdl','monergism','desiring-god','mlj-trust'})
        self.assertEqual(a['acquiredFiles'],0);self.assertEqual(a['embeddedMedia'],0)
        self.assertFalse(any('mljtrust.org' in r['sourceUrl'] for r in self.resources.values()))
        for r in self.resources.values():
            w=read(LIB/'catalog/works'/f"{r['workId']}.json")
            self.assertEqual(w['editorialState'],r['catalogEditorialState'])
        self.assertFalse(any('l14' in wid for wid in read(LIB/'publication.json')['workIds']))

    def test_guide_links_and_nonempty_annotations(self):
        for p in OUT.glob('*.md'):
            text=p.read_text(encoding='utf-8')
            for target in re.findall(r'\]\(([^)]+)\)',text):
                if not target.startswith(('https://','http://','#')):self.assertTrue((p.parent/target.split('#')[0]).exists(),(p.name,target))
        for p in self.paths:
            text=(OUT/(p['id']+'.md')).read_text(encoding='utf-8')
            self.assertEqual(text.count('**Reflect:**'),3)
            self.assertEqual(text.count('**Substantial reading:**'),3)
            self.assertEqual(text.count('**Sermon:**'),3)

    def test_honest_counts(self):
        s=read(OUT/'summary.json')
        self.assertEqual(s['sourceSelections'],len(self.resources))
        self.assertEqual(s['uniqueCatalogWorks'],len({r['workId'] for r in self.resources.values()}))
        self.assertEqual(s['uniqueSermons'],13)
        self.assertEqual(sum(s['sermonAssignmentsByAuthor'].values()),15)
        self.assertEqual(s['newAcquiredFiles'],0);self.assertEqual(s['newPublishedWorks'],0)

if __name__=='__main__':unittest.main()
