"""Guard doctrine navigation against invented citations, lost context and false sermon matches."""
import hashlib
import json
from pathlib import Path
import sys
import unittest

SITE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(SITE/'scripts'))
from bible.paths import SOURCES
LIB=SITE/'content/library'
OUT=LIB/'reports/doctrinal-studies'
def read(p): return json.loads(p.read_text(encoding='utf-8'))

class DoctrineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=read(OUT/'section-connections.json')['sections']
        cls.inventory=read(OUT/'inventory.json')['sections']
        books=read(SITE/'content/apologetics/scripture-index.json')['books']
        cls.valid={b['num']*1000000+c*1000+v for b in books for c,n in enumerate(b['chapters'],1) for v in range(1,n+1)}

    def test_all_sections_keep_resolving_author_edition_and_parent_context(self):
        eligible={a['id'] for a in read(LIB/'authors.json')['authors'] if a['eligibility']=='eligible'}
        self.assertEqual(len(self.rows),129)
        for s in self.rows:
            self.assertIn(s['authorId'],eligible)
            edition=read(LIB/'catalog/editions'/(s['editionId']+'.json'))
            self.assertEqual(edition['workId'],s['rootWorkId'])
            seen=set(); wid=s['workId']
            while wid!=s['rootWorkId']:
                self.assertNotIn(wid,seen); seen.add(wid)
                work=read(LIB/'catalog/works'/(wid+'.json'))
                parents=[r for r in work['related'] if r['relation']=='is-part-of']
                self.assertEqual(len(parents),1); wid=parents[0]['targetId']

    def test_doctrine_hierarchy_matches_shared_vocabulary_without_cycles(self):
        vocab={s['id']:s for s in read(LIB/'vocabulary.json')['subjects']}
        nodes={s['subjectId']:s for s in read(OUT/'doctrine-hierarchy.json')['nodes']}
        for key,node in nodes.items():
            self.assertEqual(node['parent'],vocab[key]['parent'])
            seen=set()
            while key:
                self.assertNotIn(key,seen); seen.add(key); key=nodes[key]['parent']
        for s in self.rows:
            for tag in s['subjects']: self.assertIn(tag,nodes)

    def test_editorial_readings_do_not_become_author_citations(self):
        inventory={s['workId']:s for s in self.inventory}
        assessments=read(OUT/'assessments.json')['assessments']
        for s in self.rows:
            inv=inventory[s['workId']]
            expected=len(inv['sourcePassages'])+sum(len(a['passages']) for a in assessments if a['sectionKey']==inv['key'])
            work=read(LIB/'catalog/works'/(s['workId']+'.json'))
            self.assertEqual(len(work['passages']),expected)
            self.assertEqual(work['passages'],s['sourcePassages'])
            self.assertIn('not a claim',s['editorialScripture']['attribution'])
            for p in [s['editorialScripture']]+s['editorialFurtherReadings']+s['sourcePassages']:
                self.assertIn(p['start'],self.valid); self.assertIn(p['end'],self.valid)
                self.assertLessEqual(p['start'],p['end'])

    def test_every_sermon_edge_has_real_main_text_overlap_and_a_destination(self):
        for s in self.rows:
            self.assertTrue(s['sermonCandidates'])
            targets={v for p in s['sermonSearchPassages'] for v in self.valid if p['start']<=v<=p['end']}
            for c in s['sermonCandidates']:
                w=read(LIB/'catalog/works'/(c['workId']+'.json'))
                self.assertEqual(w['genre'],'sermon'); self.assertEqual(w['role'],'core-teaching')
                self.assertTrue(c['sourceUrl'].startswith('https://'))
                actual=set()
                for p in c['matchedMainTexts']:
                    self.assertIn(p,w['passages']); self.assertEqual(p['role'],'main-text'); self.assertEqual(p['verification'],'verified')
                    actual.update(v for v in targets if p['start']<=v<=p['end'])
                self.assertTrue(actual); self.assertEqual(actual,set(c['overlapVerses']))

    def test_selected_pairing_reviews_resolve_and_preserve_original_hashes(self):
        for r in read(OUT/'sermon-pairing-reviews.json')['pairings']:
            row=next(s for s in self.rows if s['workId']==r['sectionWorkId'])
            edge=next(c for c in row['sermonCandidates'] if c['workId']==r['sermonWorkId'])
            self.assertEqual(edge['pairingReviewId'],r['id'])
            a=read(LIB/'catalog/assets'/(r['sermonAssetId']+'.json'))
            self.assertEqual(hashlib.sha256((SOURCES/a['relativePath']).read_bytes()).hexdigest(),a['sha256'])
            self.assertTrue(r['limit'] and r['sermonLocator'])

    def test_acquisition_hashes_and_reused_editions(self):
        files=[f for f in read(OUT/'acquisition-manifest.json')['files'] if not f['evidenceOnly']]
        self.assertEqual(len(files),4); self.assertEqual(sum(f['byteCount'] for f in files),35047686)
        for f in files:
            data=(SOURCES/f['relativePath']).read_bytes()
            self.assertEqual(len(data),f['byteCount']); self.assertEqual(hashlib.sha256(data).hexdigest(),f['sha256'])
            self.assertIn(f['editionId'],['edition-aa-hodge-outlines','edition-warfield-plan'])

    def test_complete_chapter_inventories_preserve_unlabelled_eschatology_units(self):
        expected={'hodge-v1':19,'hodge-v2':23,'hodge-v3':10,'aa-hodge':40,'owen':20,'warfield':5}
        for key,count in expected.items():
            s=read(LIB/'catalog/series'/('series-l07-'+key+'.json'))
            self.assertEqual(s['expectedCount'],count); self.assertEqual(len(s['members']),count)
            self.assertEqual([m['position'] for m in s['members']],list(range(1,count+1)))
        eschatology=[s for s in self.inventory if s.get('division')=='Part IV. Eschatology.']
        self.assertEqual(len(eschatology),4)
        self.assertTrue(any(s['title']=='The Resurrection.' for s in eschatology))

    def test_lecture_mottos_are_citations_and_delivery_is_not_publication(self):
        for s in self.inventory:
            if not s['key'].startswith('warfield-'): continue
            w=read(LIB/'catalog/works'/(s['workId']+'.json'))
            self.assertEqual([p['role'] for p in w['passages']],['citation'])
            self.assertEqual(w['dates'][0]['event'],'delivery'); self.assertEqual(w['dates'][0]['value'],'1914-06')
            self.assertEqual(w['dates'][0]['precision'],'month')

if __name__=='__main__': unittest.main()
