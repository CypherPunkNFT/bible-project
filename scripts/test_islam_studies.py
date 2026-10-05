"""Integrity checks for L10 evidence boundaries and retained source facts."""
import hashlib
import html
import json
from pathlib import Path
import re
import unittest

SITE=Path(__file__).resolve().parents[1]; LIB=SITE/'content/library'; OUT=LIB/'reports/islam-studies'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def plain(t):
    t=re.sub(r'<(script|style)\b.*?</\1>','',t,flags=re.S)
    return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',t)))

class IslamStudies(unittest.TestCase):
    def test_nine_questions_with_both_positions(self):
        qs=read(OUT/'questions.json')['questions']
        self.assertEqual({q['topic'] for q in qs},{'god','trinity','christ','crucifixion','resurrection','scripture','revelation','salvation','prophethood'})
        for q in qs:
            for key in ['christianClaim','muslimClaim','premises','seriousObjection','christianResponse','christianEvidence','muslimEvidence','scripture','limitations']:self.assertTrue(q[key])
            self.assertFalse(q['winnerDeclared'])
            for e in q['muslimEvidence']:self.assertEqual(e['role'],'opposing-position')
    def test_references_resolve(self):
        for q in read(OUT/'questions.json')['questions']:
            ids=q['relatedHoldingIds']+[e['workId'] for e in q['christianEvidence']+q['muslimEvidence'] if 'workId' in e]
            for wid in ids:self.assertTrue((LIB/'catalog/works'/(wid+'.json')).exists(),wid)
        for x in read(OUT/'app-crosswalk.json')['links']:self.assertTrue((SITE/x['appPath']).exists(),x)
    def test_author_and_role_boundaries(self):
        authors={a['id']:a for a in read(LIB/'authors.json')['authors']}
        for p in (LIB/'catalog/works').glob('work-l10-*.json'):
            w=read(p)
            if w['role']=='core-teaching':
                for a in w['creators']:self.assertEqual(authors[a['authorId']]['eligibility'],'eligible')
            self.assertEqual(w['editorialState'],'catalogued')
        self.assertEqual(read(LIB/'catalog/works/work-l10-ally-deity.json')['role'],'opposing-position')
        self.assertEqual(read(LIB/'catalog/works/work-l10-zwemer-lectures.json')['role'],'historical-context')
    def test_quotes_are_present_in_retained_sources(self):
        files={f['key']:f for f in read(OUT/'acquisition-manifest.json')['files']}
        totals={}
        for q in read(OUT/'quotation-audit.json')['verifiedExcerpts']:
            f=files[q['evidenceKey']];p=Path(f['path'])
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),q['evidenceSha256'])
            self.assertIn(q['exactExcerpt'],plain(p.read_text(encoding='utf-8')))
            totals[q['url']]=totals.get(q['url'],0)+len(q['exactExcerpt'].split())
        self.assertTrue(all(n<=25 for n in totals.values()))
    def test_acquired_originals_and_reuse_boundaries(self):
        files=[f for f in read(OUT/'acquisition-manifest.json')['files'] if not f['evidenceOnly']]
        self.assertEqual(len(files),3);self.assertEqual(sum(f['byteCount'] for f in files),22060863)
        for f in files:
            data=Path(f['path']).read_bytes();self.assertEqual(hashlib.sha256(data).hexdigest(),f['sha256']);self.assertEqual(len(data),f['byteCount'])
            a=read(LIB/'catalog/assets'/(f['assetId']+'.json'))
            self.assertEqual(a['rights']['actions']['download'],'allowed');self.assertEqual(a['rights']['actions']['host'],'unknown');self.assertFalse(a['fullTextIndexed'])
        a=read(LIB/'catalog/assets/asset-l10-zwemer-christ-pdf.json')
        self.assertEqual(a['rights']['category'],'permission-granted')
        self.assertEqual(read(LIB/'catalog/editions/edition-l10-zwemer-christ.json')['dates'],[])
    def test_lecture_dates_and_corrected_ocr_page_starts(self):
        w=read(LIB/'catalog/works/work-l10-zwemer-lectures.json');e=read(LIB/'catalog/editions/edition-l10-zwemer-lectures.json')
        self.assertEqual(w['dates'][0]['value'],'1915-10');self.assertEqual(e['dates'][0]['value'],'1916')
        sections=read(OUT/'inventory.json')['sections'];self.assertEqual(len(sections),21)
        self.assertEqual(next(s for s in sections if s['workId']=='work-l10-zwemer-god-s01')['printedStartPage'],15)
        self.assertEqual(next(s for s in sections if s['workId']=='work-l10-zwemer-christ-s06')['printedStartPage'],135)
        self.assertTrue(all(not s['bodyReviewed'] for s in sections))
    def test_no_invented_debate_playback(self):
        debates=[r for r in read(OUT/'inventory.json')['roots'] if r['genre']=='debate'];self.assertEqual(len(debates),5)
        for r in debates:
            self.assertIsNone(r['durationSeconds']);self.assertEqual(r['recordingCompleteness'],'unverified');self.assertEqual(r['timestampedClaims'],[]);self.assertFalse(r['completeContentReviewed'])
    def test_exact_inventory_counts(self):
        inv=read(OUT/'inventory.json');self.assertEqual(len(inv['roots']),13)
        for folder,n in [('works',34),('editions',13),('assets',13)]:self.assertEqual(len(list((LIB/'catalog'/folder).glob('*-l10-*.json'))),n)
        self.assertEqual(inv['counts']['reviewedWorks'],0);self.assertEqual(inv['counts']['publishedWorks'],0)

if __name__=='__main__':unittest.main()
