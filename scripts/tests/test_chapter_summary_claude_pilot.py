"""Pilot bookkeeping: raw submissions kept verbatim, two attempts per stage, validated results never replaced."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_summary_claude_pilot as pilot
import chapter_summary_studio as studio

DRAFT = {'title': 'Praise from the Nations', 'context': '', 'context_references': [],
         'summary_sentences': [{'text': 'All nations and peoples are called to praise the LORD.', 'evidence_verses': [1]},
                               {'text': 'His loving devotion toward us is great, and His faithfulness endures forever.',
                                'evidence_verses': [2]}],
         'outline': [{'verse_start': 1, 'verse_end': 2, 'heading': 'A call and its reason',
                      'text': 'The nations are called to praise because of His great devotion toward us.',
                      'evidence_verses': [1, 2]}],
         'invitation': 'Notice who is called to praise and who receives the devotion.'}


class PilotTests(unittest.TestCase):
    def setUp(self):
        if not (studio.DATA / 'text' / 'bsb' / 'PSA').is_dir():
            self.skipTest('local BSB data not present')
        self.temp = tempfile.TemporaryDirectory()
        self.original_root = pilot.ROOT
        pilot.ROOT = Path(self.temp.name)
        pilot.prepare('test-run', ['PSA:117'])
        self.folder = pilot.ROOT / 'test-run' / 'PSA-117'

    def tearDown(self):
        pilot.ROOT = self.original_root
        self.temp.cleanup()

    def submit(self, stage, payload):
        path = Path(self.temp.name) / f'{stage}.json'
        path.write_text(payload if isinstance(payload, str) else json.dumps(payload), encoding='utf-8')
        return pilot.submit('test-run', 'PSA:117', stage, path, 'unit test')

    def test_prepare_refuses_existing_run(self):
        with self.assertRaises(FileExistsError):
            pilot.prepare('test-run', ['PSA:117'])

    def test_prompt_contains_exact_source(self):
        prompt = (self.folder / 'plan-prompt.txt').read_text(encoding='utf-8')
        self.assertIn(studio.source('PSA', 117)['text'], prompt)
        self.assertIn('section_starts', prompt)

    def test_raw_submission_kept_and_attempts_capped(self):
        self.assertEqual(self.submit('plan', '{"section_starts": [2], "context": []}'), 1)
        self.assertEqual(self.submit('plan', 'not json'), 1)
        stored = json.loads((self.folder / 'plan-2.json').read_text(encoding='utf-8'))
        self.assertEqual(stored['raw'], 'not json')
        self.assertEqual(len(json.loads((self.folder / 'plan-errors.json').read_text(encoding='utf-8'))), 2)
        with self.assertRaisesRegex(ValueError, 'blocked after 2 attempts'):
            self.submit('plan', {'section_starts': [1], 'context': []})

    def test_write_requires_plan_and_draft_never_replaced(self):
        with self.assertRaisesRegex(ValueError, 'no validated plan'):
            self.submit('write', DRAFT)
        self.assertEqual(self.submit('plan', {'section_starts': [1], 'context': []}), 0)
        self.assertIn('Evidence packet', (self.folder / 'write-prompt.txt').read_text(encoding='utf-8'))
        self.assertEqual(self.submit('write', DRAFT), 0)
        draft = json.loads((self.folder / 'draft.json').read_text(encoding='utf-8'))
        self.assertEqual(set(draft), set(studio.SCHEMA['required']))
        with self.assertRaisesRegex(ValueError, 'never replaced'):
            self.submit('write', DRAFT)

    def test_reused_plans_change_only_the_writer_prompt(self):
        self.submit('plan', {'section_starts': [1], 'context': []})
        pilot.WRITER_PROMPTS['test-v2'] = pilot.WRITER_PROMPTS['v1'] + '\nTEST ADDENDUM\n'
        try:
            pilot.prepare('test-run-2', [], 'test-v2', 'test-run')
        finally:
            del pilot.WRITER_PROMPTS['test-v2']
        new = pilot.ROOT / 'test-run-2' / 'PSA-117'
        for name in ('sources.json', 'evidence.json'):
            self.assertEqual((new / name).read_bytes(), (self.folder / name).read_bytes())
        self.assertIn('TEST ADDENDUM', (new / 'write-prompt.txt').read_text(encoding='utf-8'))
        self.assertNotIn('TEST ADDENDUM', (self.folder / 'write-prompt.txt').read_text(encoding='utf-8'))
        manifest = json.loads((pilot.ROOT / 'test-run-2' / 'manifest.json').read_text(encoding='utf-8'))
        self.assertEqual((manifest['writer_prompt'], manifest['plans_reused_from'], manifest['chapters']),
                         ('test-v2', 'test-run', ['PSA:117']))

    def test_length_gate_limits_scale_with_chapter(self):
        self.assertEqual([pilot.summary_word_limit(n) for n in (2, 5, 6, 30, 31, 176)], [70, 70, 150, 150, 180, 180])
        source = studio.source('PSA', 117)
        long_draft = {'summary': ' '.join(['word'] * 71)}
        with self.assertRaisesRegex(ValueError, '71 words; the limit for a 2-verse chapter is 70'):
            pilot.check_summary_length(long_draft, source)
        pilot.check_summary_length({'summary': ' '.join(['word'] * 70)}, source)

    def test_length_gate_applies_only_when_run_enables_it(self):
        self.submit('plan', {'section_starts': [1], 'context': []})
        padded = json.loads(json.dumps(DRAFT))
        padded['summary_sentences'][1]['text'] += ' ' + ' '.join(['indeed'] * 60)
        manifest_path = pilot.ROOT / 'test-run' / 'manifest.json'
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        manifest['summary_length_gate'] = True
        manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
        self.assertEqual(self.submit('write', padded), 1)
        self.assertIn('limit for a 2-verse chapter', (self.folder / 'write-errors.json').read_text(encoding='utf-8'))
        self.assertEqual(self.submit('write', DRAFT), 0)

    def test_gate_versions_are_frozen(self):
        self.assertEqual([pilot.summary_word_limit(n, 'v2') for n in (5, 6, 30, 176)], [70, 200, 200, 200])
        self.assertEqual(pilot.summary_word_limit(30, 'v1'), 150)
        pilot.check_summary_length({'summary': ' '.join(['w'] * 150)}, studio.source('PSA', 119), 'v2')
        with self.assertRaisesRegex(ValueError, 'limit for a 176-verse chapter is 200'):
            pilot.check_summary_length({'summary': ' '.join(['w'] * 201)}, studio.source('PSA', 119), 'v2')
        with self.assertRaisesRegex(ValueError, 'Unknown length gate'):
            pilot.prepare('test-run-x', ['PSA:117'], 'v1', None, 'v9')

    def test_import_into_separate_database_as_drafts(self):
        import chapter_summary_import_pilot as importer
        self.submit('plan', {'section_starts': [1], 'context': []})
        self.submit('write', DRAFT)
        with self.assertRaisesRegex(ValueError, 'curated studio examples'):
            importer.run_import('test-run', studio.OUTPUT)
        target = Path(self.temp.name) / 'claude-db'
        first = importer.run_import('test-run', target)
        self.assertEqual(first['imported'], ['PSA:117'])
        record = studio.Store(target).all()['PSA:117']
        self.assertEqual((record['status'], record['translation'], record['prompt_version']), ('draft', 'bsb', 'claude-pilot-v1'))
        self.assertEqual(record['summary'], ' '.join(s['text'] for s in DRAFT['summary_sentences']))
        studio.validate({k: record[k] for k in studio.SCHEMA['required']}, studio.source('PSA', 117))
        second = importer.run_import('test-run', target)
        self.assertEqual((second['imported'], list(second['skipped'])), ([], ['PSA:117']))
        self.assertEqual(len((target / 'imports.jsonl').read_text(encoding='utf-8').splitlines()), 2)

    def test_revision_run_carries_earlier_draft_and_review(self):
        self.submit('plan', {'section_starts': [1], 'context': []})
        self.submit('write', DRAFT)
        with self.assertRaisesRegex(ValueError, 'no blind review'):
            pilot.prepare('test-rev-0', ['PSA:117'], 'v1', 'test-run', False, True)
        review_dir = pilot.ROOT / 'test-run' / 'blind-review' / 'reviews'
        review_dir.mkdir(parents=True)
        (review_dir.parent / 'KEY-do-not-open-during-review.json').write_text(
            json.dumps({'chapters': {'PSA-117': {'A': {'set': 'claude'}}}}), encoding='utf-8')
        issue = {'severity': 'material', 'field': 'summary', 'quote': 'toward us', 'verses': '2', 'explanation': 'TEST FINDING'}
        (review_dir / 'PSA-117.json').write_text(json.dumps({'drafts': {'A': {'issues': [issue]}}}), encoding='utf-8')
        pilot.prepare('test-rev', ['PSA:117'], 'v1', 'test-run', False, True)
        prompt = (pilot.ROOT / 'test-rev' / 'PSA-117' / 'write-prompt.txt').read_text(encoding='utf-8')
        self.assertIn('REVISION REQUEST', prompt)
        self.assertIn('TEST FINDING', prompt)
        self.assertIn(DRAFT['title'], prompt)
        manifest = json.loads((pilot.ROOT / 'test-rev' / 'manifest.json').read_text(encoding='utf-8'))
        self.assertEqual((manifest['revision_of'], manifest['chapters']), ('test-run', ['PSA:117']))

    def test_citation_outside_outline_range_rejected(self):
        self.submit('plan', {'section_starts': [1, 2], 'context': []})
        bad = json.loads(json.dumps(DRAFT))
        bad['outline'] = [{'verse_start': 1, 'verse_end': 1, 'heading': 'Call', 'text': 'Nations are called to praise.',
                           'evidence_verses': [2]},
                          {'verse_start': 2, 'verse_end': 2, 'heading': 'Reason', 'text': 'His devotion toward us is great.',
                           'evidence_verses': [2]}]
        self.assertEqual(self.submit('write', bad), 1)
        self.assertFalse((self.folder / 'draft.json').exists())


if __name__ == '__main__':
    unittest.main()
