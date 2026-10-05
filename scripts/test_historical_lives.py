"""L13 source-integrity and provenance contracts; no network required."""
import hashlib
import json
import re
import unittest
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/historical-lives'
def read(name): return json.loads((OUT/name).read_text(encoding='utf-8'))

class HistoricalCollectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files={f['assetId']:f for f in read('acquisition-manifest.json')['files'] if f.get('assetId')}
        cls.units=read('inventory.json')['units']; cls.claims=read('historical-claims.json')['claims']
        cls.texts={aid:(SOURCES/f['relativePath']).read_bytes().decode('utf-8-sig') for aid,f in cls.files.items() if f['format']!='pdf'}

    def test_original_files(self):
        self.assertEqual(len(self.files),12)
        self.assertEqual(len({f['sha256'] for f in self.files.values()}),12)
        for f in self.files.values():
            raw=(SOURCES/f['relativePath']).read_bytes()
            self.assertEqual(len(raw),f['byteCount']); self.assertEqual(hashlib.sha256(raw).hexdigest(),f['sha256'])
            if f['format']=='pdf': self.assertTrue(raw.startswith(b'%PDF'))

    def test_all_spans_roundtrip(self):
        def verify(loc):
            t=self.texts[loc['assetId']]; s=loc['characterSpan']
            self.assertTrue(0<=s['start']<s['end']<=len(t))
            self.assertEqual(hashlib.sha256(t[s['start']:s['end']].encode()).hexdigest(),loc['payloadSha256'])
        for u in self.units: verify(u if 'characterSpan' in u else u['inventoryEvidence'])
        for c in self.claims: verify(c['evidence'])

    def test_rutherford_inventory_and_actual_first_date(self):
        letters=[u for u in self.units if u['documentKey']=='rutherford-pg42557']
        self.assertEqual([u['position'] for u in letters],list(range(1,366)))
        self.assertEqual(len({u['htmlAnchor'] for u in letters if u['htmlAnchor']}),362)
        self.assertEqual([u['position'] for u in letters if not u['htmlAnchor']],[55,166,257])
        self.assertIn('June 6, 1627',' '.join(letters[0]['sourceClosingLabels']))
        self.assertTrue(all(u['writtenDateNormalized'] is None for u in letters))
        claim=next(c for c in self.claims if c['id']=='claim-l13-rutherford-letter-one')
        self.assertIn('June 6, 1627',claim['assertion'])

    def test_brainerd_contents_and_journal(self):
        chapters=[u for u in self.units if u['documentKey']=='brainerd-1822' and 'chapter-' in u['id']]
        self.assertEqual(len(chapters),13)
        loc=chapters[0]['inventoryEvidence']; s=loc['characterSpan']; t=self.texts[loc['assetId']][s['start']:s['end']]
        self.assertRegex(t,r'CHAPTER\s+I\.'); self.assertRegex(t,r'CHAPTER\s+XIII\.')
        journal=next(u for u in self.units if 'journal-june-19' in u['id'])
        self.assertEqual(journal['authorId'],'author-l13-david-brainerd')
        self.assertIn('interpretation',journal['testimonyLayer'])

    def test_attribution_and_omissions(self):
        letters=next(u for u in self.units if u['id']=='unit-l13-paton-1889-v2-chapter-09')
        self.assertEqual(letters['authorId'],'author-l13-mrs-john-g-paton')
        self.assertIn('abridged',letters['testimonyLayer'])
        for key in ['mcheyne-1844','knox-pg48250','paton-1889-v2']:
            e=json.loads((SITE/f'content/library/catalog/editions/edition-l13-{key}.json').read_text(encoding='utf-8'))
            self.assertEqual(e['abridgment'],'abridged')

    def test_date_conflict_and_no_invented_imprint(self):
        e=json.loads((SITE/'content/library/catalog/editions/edition-l13-paton-v3.json').read_text())
        self.assertEqual(e['dates'][0]['value'],'1898')
        d=next(d for d in read('inventory.json')['documents'] if d['key']=='paton-v3')
        self.assertEqual(d['sourceCatalogYear'],'1889')
        for key in ['paton-1889-v1','paton-1889-v2','mcheyne-1844','rutherford-pg42557']:
            e=json.loads((SITE/f'content/library/catalog/editions/edition-l13-{key}.json').read_text(encoding='utf-8'))
            self.assertEqual(e['dates'],[])

    def test_graph_and_issue_provenance(self):
        graph=read('connections.json'); ids={e['id'] for e in graph['entities']}; claims={c['id'] for c in self.claims}
        self.assertTrue({'person','work','church','movement','event'}<={e['kind'] for e in graph['entities']})
        for edge in graph['edges']:
            self.assertIn(edge['source'],ids); self.assertIn(edge['target'],ids); self.assertIn(edge['claimId'],claims)
        for issue in read('editorial-issues.json')['issues']: self.assertIn(issue['claimId'],claims)
        self.assertTrue(all(c['locator'] and c['verification'].startswith('source-passage-checked') for c in self.claims))

    def test_canonical_records_not_publication_or_exposition(self):
        for ident in read('record-manifest.json')['recordIds']:
            kind=ident.split('-')[0]; folder='series' if kind=='series' else kind+'s'
            d=json.loads((SITE/'content/library/catalog'/folder/(ident+'.json')).read_text(encoding='utf-8'))
            if kind=='work':
                self.assertEqual(d['editorialState'],'catalogued'); self.assertEqual(d['role'],'historical-context'); self.assertEqual(d['passages'],[])
            if kind=='asset':
                self.assertFalse(d['fullTextIndexed']); self.assertEqual(d['rights']['actions']['download'],'allowed')
                self.assertEqual(d['rights']['actions']['host'],'unknown')
        publication=json.loads((SITE/'content/library/publication.json').read_text())
        self.assertFalse(any(x.startswith('work-l13-') for x in publication['workIds']))

if __name__=='__main__': unittest.main()
