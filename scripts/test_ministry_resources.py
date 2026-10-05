"""L12 source-integrity and evidence-boundary checks."""
import hashlib
import json
from pathlib import Path
import unittest
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/ministry-resources'
def read(path):return json.loads(path.read_text(encoding='utf-8'))

class MinistryResources(unittest.TestCase):
    def test_responsibilities_and_audiences_have_evidence(self):
        assessments={a['id']:a for a in read(OUT/'treatments.json')['assessments']}
        topics=read(OUT/'topic-map.json')['topics']
        self.assertEqual({x['id'] for x in topics},{'sermon-preparation','pastoral-ministry','worship','sacraments','church-government','discipleship','evangelism','missions'})
        for topic in topics:
            self.assertTrue(topic['assessmentIds'])
            for key in topic['assessmentIds']:self.assertIn(topic['id'],assessments[key]['topics'])
            for lead in topic['furtherReading']:self.assertTrue((LIB/'catalog/works'/f"{lead['workId']}.json").exists())
        audiences=read(OUT/'audience-map.json')['audiences']
        self.assertEqual({x['id'] for x in audiences},{'pastors','elders','small-group-leaders','families','individual-christians'})
        for audience in audiences:
            for r in audience['recommendations']:
                a=assessments[r['assessmentId']]
                self.assertEqual(a['workId'],r['workId'])
                self.assertIn(audience['id'],a['audiences'])
                self.assertTrue(r['purpose'])

    def test_attribution_and_scoped_readings(self):
        data=read(OUT/'treatments.json')
        self.assertEqual(set(data['definitions']),{'theological-principle','historical-practice','practical-advice'})
        for a in data['assessments']:
            self.assertIn(a['kind'],data['definitions'])
            self.assertTrue(a['locator']);self.assertTrue(a['interpretationBoundary'])
            self.assertTrue(a['sourceUrl'].startswith('https://'))
            self.assertFalse(a['wholeWorkReviewed'])
            self.assertTrue((LIB/'catalog/works'/f"{a['workId']}.json").exists())
            if a['assetId']:self.assertTrue((LIB/'catalog/assets'/f"{a['assetId']}.json").exists())
        self.assertFalse(any(a['workId']=='work-l12-owen-churches' for a in data['assessments']))
        self.assertFalse(any(a['workId']=='work-l12-packer' for a in data['assessments']))

    def test_acquired_originals_and_rights(self):
        files=[f for f in read(OUT/'acquisition-manifest.json')['files'] if not f['evidenceOnly']]
        self.assertEqual(len(files),2)
        self.assertEqual(sum(f['byteCount'] for f in files),17600369)
        for f in files:
            raw=(SOURCES/f['relativePath']).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(),f['sha256'])
            self.assertEqual(hashlib.md5(raw).hexdigest(),f['hostMd5'])
            self.assertEqual(len(raw),f['byteCount'])
        for p in (LIB/'catalog/assets').glob('asset-l12-*.json'):
            a=read(p)
            self.assertFalse(a['fullTextIndexed'])
            self.assertEqual(a['rights']['actions']['host'],'unknown')
            if a['id'].endswith('-link'):
                self.assertEqual(a['acquisitionStatus'],'link-only')
                self.assertIsNone(a['relativePath'])

    def test_spurgeon_source_locators_and_inventory(self):
        series=read(LIB/'catalog/series/series-l12-spurgeon-first.json')
        self.assertEqual(len(series['members']),13)
        self.assertEqual(series['expectedCount'],13)
        self.assertEqual([x['position'] for x in series['members']],list(range(1,14)))
        sections={s['workId']:s for s in read(OUT/'inventory.json')['sections']}
        for number,page in [(2,35),(5,112),(10,227)]:
            s=sections[f'work-l12-spurgeon-lecture-{number:02}']
            self.assertEqual(s['printedStartPage'],page)
            self.assertEqual(s['pdfStartPage'],page+6)
        for member in series['members']:
            w=read(LIB/'catalog/works'/f"{member['workId']}.json")
            self.assertFalse(any(d['event']=='delivery' for d in w['dates']))

    def test_eligibility_and_no_editorial_promotion(self):
        authors={a['id']:a for a in read(LIB/'authors.json')['authors']}
        for p in (LIB/'registry-extensions').glob('*.json'):
            authors.update({a['id']:a for a in read(p)['authors']})
        for p in (LIB/'catalog/works').glob('work-l12-*.json'):
            w=read(p)
            self.assertEqual(w['editorialState'],'catalogued')
            for creator in w['creators']:self.assertEqual(authors[creator['authorId']]['eligibility'],'eligible')
        self.assertEqual(read(LIB/'catalog/works/work-l10-zwemer-lectures.json')['role'],'historical-context')

    def test_comparison_positions_resolve_separately(self):
        assessments={a['id']:a for a in read(OUT/'treatments.json')['assessments']}
        comps={x['id']:x for x in read(OUT/'comparisons.json')['comparisons']}
        for comp in comps.values():
            for key in comp['assessmentIds']:self.assertIn(key,assessments)
        self.assertEqual(comps['baptism']['relationship'],'doctrinal-disagreement')
        self.assertEqual(comps['supper']['relationship'],'shared-affirmation')
        group=[assessments[x] for x in comps['small-groups']['assessmentIds']]
        self.assertEqual(len({x['workId'] for x in group}),1)
        self.assertEqual(len({x['kind'] for x in group}),3)

    def test_counts_reuse_and_parentage(self):
        inv=read(OUT/'inventory.json')
        self.assertEqual(len(inv['roots']),10);self.assertEqual(len(inv['sections']),50)
        self.assertEqual(len(inv['reused']),18)
        for folder,n in [('works',60),('editions',10),('assets',11),('series',1)]:
            self.assertEqual(len(list((LIB/'catalog'/folder).glob('*-l12-*.json'))),n)
        for s in inv['sections']:
            parent=read(LIB/'catalog/works'/f"{s['parentWorkId']}.json")
            self.assertEqual(parent['kind'],'work')
            self.assertFalse(s['fullSectionReviewed'])
        self.assertEqual(inv['counts']['reviewedWorks'],0)
        self.assertEqual(inv['counts']['publishedWorks'],0)

    def test_sermon_main_text_and_date(self):
        w=read(LIB/'catalog/works/work-l12-piper-groups.json')
        self.assertEqual(w['dates'][0]['value'],'1997-09-14')
        self.assertEqual(w['dates'][0]['event'],'delivery')
        self.assertEqual(len(w['passages']),1)
        self.assertEqual(w['passages'][0]['role'],'main-text')

if __name__=='__main__':unittest.main()
