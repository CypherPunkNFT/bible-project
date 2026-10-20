"""Integrity checks for the standalone research dataset; no site/corpus writes."""
import copy
import importlib.util
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('connections_builder', Path(__file__).resolve().parents[1] / 'build-knowledge-connections.py')
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)

class KnowledgeConnectionsTests(unittest.TestCase):
    def setUp(self):
        self.data = builder.read(builder.DEST / 'research.json')

    def test_all_fifty_threads_have_connected_evidenced_work_graphs(self):
        builder.validate(self.data)

    def test_missing_evidence_cannot_be_exported(self):
        self.data['connections'][0]['evidence'] = []
        with self.assertRaises(AssertionError):
            builder.validate(self.data)

    def test_missing_endpoint_cannot_be_exported(self):
        self.data['connections'][0]['toWorkId'] = 'unresolved-guessed-id'
        with self.assertRaises(AssertionError):
            builder.validate(self.data)

    def test_four_distinct_nodes_cannot_be_exported(self):
        self.data['chains'][0]['workIds'] = self.data['chains'][0]['workIds'][:4]
        with self.assertRaisesRegex(AssertionError, 'at least 5 distinct nodes'):
            builder.validate(self.data)

    def test_repeated_node_cannot_satisfy_minimum(self):
        original = self.data['chains'][0]['workIds'][:4]
        self.data['chains'][0]['workIds'] = original + [original[-1]]
        with self.assertRaisesRegex(AssertionError, 'at least 5 distinct nodes'):
            builder.validate(self.data)

    def test_same_thread_cannot_be_counted_twice(self):
        self.data['chains'][1]['edgeIds'] = self.data['chains'][0]['edgeIds'][:]
        self.data['chains'][1]['workIds'] = self.data['chains'][0]['workIds'][:]
        with self.assertRaises(AssertionError):
            builder.validate(self.data)

    def test_parallel_inputs_do_not_invent_a_sequence(self):
        chain = next(c for c in self.data['chains'] if c['id'] == 'texts-nestle-comparison')
        edges = {e['id']:e for e in self.data['connections']}
        # Three parallel source editions feed the first Nestle edition;
        # the later revision has separate edges and must not turn them into a line.
        selected = [edges[e] for e in chain['edgeIds'] if edges[e]['toWorkId'] == chain['workIds'][3]]
        self.assertEqual(len({e['toWorkId'] for e in selected}), 1)
        self.assertEqual(len({e['fromWorkId'] for e in selected}), 3)

    def test_existing_five_texts_and_order_are_preserved(self):
        chains = [c for c in self.data['chains'] if c['origin'] == 'existing-five']
        works = {w['id']:w for w in self.data['works']}
        for chain, original in zip(chains, self.data['baselineSnapshot']):
            self.assertEqual(chain['field'], original['field'])
            self.assertEqual([works[w]['title'] for w in chain['workIds']], [n['work'] for n in original['nodes']])

    def test_no_candidate_title_match_claims_a_confirmed_edition(self):
        resolved = builder.enrich(self.data)
        for work in resolved['works']:
            self.assertIsNone(work['libraryRecordId'])
            if work['libraryCandidates']:
                self.assertEqual(work['libraryMatchStatus'], 'candidates-need-edition-review')
        for author in resolved['authors']:
            if author['entityType'] != 'person':
                self.assertIsNone(author['populationId'])

if __name__ == '__main__':
    unittest.main()
