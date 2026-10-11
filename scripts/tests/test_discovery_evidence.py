import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[2]
def read(path): return json.loads((ROOT / path).read_text('utf-8-sig'))
def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values(): yield from walk(child)
    elif isinstance(value, list):
        for child in value: yield from walk(child)

class DiscoveryEvidenceTests(unittest.TestCase):
    def test_every_case_has_sources_and_known_researchers(self):
        cases = read('content/teachers/discovery-evidence.json')['cases']
        data = read('src/data/teachers/scholars.json')
        self.assertEqual(set(cases), {f['id'] for f in data['finds']})
        people = {s['id'] for s in data['scholars']}
        for find in data['finds']:
            self.assertTrue(set(find['by']) <= people)
            record = cases[find['id']]
            self.assertTrue(record['role'] and record['date'] and record['context'])
            self.assertTrue(record['sources'])
            self.assertTrue(all(s['url'].startswith('https://') for s in record['sources']))

    def test_site_claims_are_supported_by_actual_cited_passages(self):
        for record in read('content/teachers/discovery-evidence.json')['cases'].values():
            if 'site' not in record: continue
            site = record['site']
            objects = list(walk(read(site['evidence'])))
            self.assertTrue(any(site['match'] in o.get('text', '') and site['citation'] in o.get('cites', []) for o in objects), site['label'])
            self.assertTrue(any(c.get('id') == site['citation'] and c.get('url') == site['sourceUrl'] for o in objects for c in o.get('citations', []) if isinstance(c,dict)))

    def test_finder_and_research_period_are_not_conflated(self):
        cases = read('content/teachers/discovery-evidence.json')['cases']
        self.assertIn('not the original finder', cases['dead-sea-scrolls']['role'])
        self.assertEqual(cases['asia-minor']['year'], 1880)
        self.assertIn('not a single discovery', cases['asia-minor']['context'])
        self.assertIn('disputed', cases['sinaiticus']['context'])

if __name__ == '__main__': unittest.main()
