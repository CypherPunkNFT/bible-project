"""Evidence and attribution regressions for section 02."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

def read(path):
    return json.loads((ROOT / path).read_text('utf-8-sig'))

class FeatureUsageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = read('content/teachers/feature-usage.json')
        cls.features = {f['id']: f for f in cls.data['features']}

    def test_evidence_is_current(self):
        for path, expected in self.data['inputs'].items():
            self.assertEqual(hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), expected, path)

    def test_westcott_actual_commentary_not_first_profile_book(self):
        works = [s for s in self.features['letters']['sources'] if 'Westcott' in s['author']]
        self.assertTrue(any('Hebrews' in s['title'] for s in works))
        self.assertFalse(any('Original Greek' in s['title'] for s in works))

    def test_direct_inputs_preserve_traceable_links(self):
        for feature in read('content/teachers/feature-inputs.json'):
            sources = self.features[feature['id']]['sources']
            for row in feature['rows']:
                match = [s for s in sources if s['kind'] == 'data' and s['author'] == row['author'] and s['title'] == row['title']]
                self.assertEqual(len(match), 1)
                self.assertEqual(match[0]['url'], row['url'])
                self.assertEqual(match[0]['uses'][0]['address'], feature['address'])

    def test_all_registered_citations_represented(self):
        def walk(v):
            if isinstance(v, dict):
                yield v
                for child in v.values(): yield from walk(child)
            elif isinstance(v, list):
                for child in v: yield from walk(child)
        registry = read('content/feature-citations.json')
        for feature in registry['features']:
            sources = self.features[feature['id']]['sources']
            for page in feature['pages']:
                for obj in walk(read(page['file'])):
                    for c in obj.get('citations', []):
                        if not isinstance(c, dict) or not c.get('author') or not c.get('url'): continue
                        self.assertTrue(any(s['author'] == c['author'] and s['title'] == c['title'] and s['url'] == c['url'] and any(u['evidence'] == page['file'] and u['citationId'] == c['id'] for u in s['uses']) for s in sources), c)

    def test_no_plans_or_holdings_inferred(self):
        for feature in self.features.values():
            for source in feature['sources']:
                self.assertIn(source['kind'], ['data', 'citation', 'bibliography'])
                self.assertTrue(source['uses'])
                self.assertTrue(all(u['address'].startswith('/') and u['evidence'] in self.data['inputs'] for u in source['uses']))

if __name__ == '__main__': unittest.main()
