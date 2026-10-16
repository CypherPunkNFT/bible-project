"""Adversarial checks for the evidence boundary; these do not prove semantic accuracy."""
import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_summary_evidence_trial as trial

class EvidenceBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.original_mode = trial.EVIDENCE_MODE
        trial.EVIDENCE_MODE = 'claims'
        self.source = {'verses':[{'number':1,'text':'His loving devotion toward us is great.'},
                                  {'number':2,'text':'His faithfulness endures forever.'}]}
        self.packet = {'sections':[{'verse_start':1,'verse_end':2,'facts':[
            {'claim':'His devotion toward us is great.','verse':1,'quote':'His loving devotion toward us is great.'}]}], 'context':[]}

    def check(self, packet):
        return trial.validate_evidence(packet, self.source, {117:self.source})

    def tearDown(self):
        trial.EVIDENCE_MODE = self.original_mode

    def test_reference_mode_cannot_accept_generated_claims(self):
        trial.EVIDENCE_MODE = 'references'
        with self.assertRaisesRegex(ValueError, 'Unexpected fact'):
            self.check(self.packet)

    def test_reference_mode_hydrates_from_source(self):
        trial.EVIDENCE_MODE = 'references'
        self.packet['sections'][0]['facts'] = [{'verse':1}]
        self.assertEqual(self.check(self.packet)['sections'][0]['facts'][0],
                         {'verse':1, 'source_verse':self.source['verses'][0]['text']})

    def test_full_sections_include_unselected_ending(self):
        trial.EVIDENCE_MODE = 'full_sections'
        packet = {'sections':[{'verse_start':1,'verse_end':2}], 'context':[]}
        result = self.check(packet)
        self.assertEqual([f['verse'] for f in result['sections'][0]['facts']], [1,2])
        self.assertEqual(result['sections'][0]['facts'][1]['source_verse'], self.source['verses'][1]['text'])

    def traced(self):
        return {'title':'A Brief Psalm', 'context':'', 'context_references':[],
                'summary_sentences':[{'text':'The psalm describes great loving devotion and faithfulness that endures forever.', 'evidence_verses':[1,2]}],
                'outline':[{'verse_start':1,'verse_end':2,'heading':'Devotion and Faithfulness',
                            'text':'Great devotion and enduring faithfulness are praised.', 'evidence_verses':[1,2]}],
                'invitation':'Notice the descriptions of devotion and faithfulness.'}

    def test_sentence_cannot_cite_outside_chapter(self):
        raw = self.traced()
        raw['summary_sentences'][0]['evidence_verses'] = [3]
        with self.assertRaisesRegex(ValueError, 'permitted source range'):
            trial.validate_traced_writer(raw,self.packet,self.source,{117:self.source})

    def test_audit_fields_removed_from_reader_format(self):
        result = trial.validate_traced_writer(self.traced(),self.packet,self.source,{117:self.source})
        self.assertEqual(set(result['draft']), set(trial.studio.SCHEMA['required']))
        self.assertNotIn('evidence_verses', result['draft']['outline'][0])
        self.assertEqual(result['support']['summary_sentences'][0]['evidence_verses'], [1,2])

    def test_hydrates_actual_source_not_generated_text(self):
        result = self.check(self.packet)
        self.assertEqual(result['sections'][0]['facts'][0]['source_verse'], self.source['verses'][0]['text'])

    def test_invented_quote_rejected(self):
        self.packet['sections'][0]['facts'][0]['quote'] = 'His loving devotion toward humanity is great.'
        with self.assertRaisesRegex(ValueError, 'does not match'):
            self.check(self.packet)

    def test_quote_from_wrong_verse_rejected(self):
        self.packet['sections'][0]['facts'][0]['verse'] = 2
        with self.assertRaisesRegex(ValueError, 'does not match'):
            self.check(self.packet)

    def test_fact_outside_section_rejected(self):
        self.packet['sections'][0]['verse_end'] = 1
        self.packet['sections'].append({'verse_start':2,'verse_end':2,'facts':[
            {'claim':'His devotion is great.','verse':1,'quote':'His loving devotion toward us is great.'}]})
        with self.assertRaisesRegex(ValueError, 'outside'):
            self.check(self.packet)

    def test_missing_coverage_rejected(self):
        self.packet['sections'][0]['verse_end'] = 1
        with self.assertRaisesRegex(ValueError, 'whole chapter'):
            self.check(self.packet)

    def test_overlap_rejected(self):
        self.packet['sections'].append(copy.deepcopy(self.packet['sections'][0]))
        with self.assertRaisesRegex(ValueError, 'overlapping'):
            self.check(self.packet)

    def test_context_must_be_supplied(self):
        self.packet['context'] = [{'chapter':118, **self.packet['sections'][0]['facts'][0]}]
        with self.assertRaisesRegex(ValueError, 'outside supplied'):
            self.check(self.packet)

    def test_valid_quote_does_not_prove_claim(self):
        self.packet['sections'][0]['facts'][0]['claim'] = 'His love guarantees wealth to everyone.'
        # Deliberately document the limit: semantic review is a separate obligation.
        self.assertEqual(self.check(self.packet)['sections'][0]['facts'][0]['claim'],
                         'His love guarantees wealth to everyone.')

    def test_writer_cannot_expand_context_citation(self):
        draft = {'title':'A Brief Psalm', 'context':'The psalm calls for praise.',
                 'context_references':[{'chapter':117,'verse_start':1,'verse_end':2}],
                 'summary':'The psalm calls the nations to praise the LORD for His faithfulness.',
                 'outline':[{'verse_start':1,'verse_end':2,'heading':'Praise the LORD','text':'His faithfulness endures forever.'}],
                 'invitation':'Notice the reasons given for praise.'}
        packet = copy.deepcopy(self.packet)
        packet['context'] = [{'chapter':117,'verse':1}]
        with self.assertRaisesRegex(ValueError, 'outside its evidence'):
            trial.validate_writer(draft, packet, self.source, {117:self.source})

    def test_writer_cannot_move_section_boundaries(self):
        draft = {'title':'A Brief Psalm', 'context':'', 'context_references':[],
                 'summary':'The psalm calls the nations to praise the LORD for His faithfulness.',
                 'outline':[{'verse_start':1,'verse_end':1,'heading':'Great Devotion','text':'His loving devotion is great.'},
                            {'verse_start':2,'verse_end':2,'heading':'Enduring Faithfulness','text':'His faithfulness endures forever.'}],
                 'invitation':'Notice the reasons given for praise.'}
        with self.assertRaisesRegex(ValueError, 'changed the evidence'):
            trial.validate_writer(draft, self.packet, self.source, {117:self.source})

if __name__ == '__main__':
    unittest.main()
