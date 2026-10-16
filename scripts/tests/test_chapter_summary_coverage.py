"""Deterministic section coverage: ordered starts -> contiguous ranges over the actual source verses.
Coverage guarantees no verse is left out of the evidence; it does not show a section was summarized well."""
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_summary_evidence_trial as trial
import chapter_summary_studio as studio

TRIALS = studio.OUTPUT / 'evidence-first-trials'


def chapter(*labels, empty=()):
    return {'verses': [{'number': str(n), 'text': '' if str(n) in map(str, empty) else f'text {n}'} for n in labels]}


def ranges(sections):
    return [(s['verse_start'], s['verse_end']) for s in sections]


class DeriveSectionsTests(unittest.TestCase):
    def test_contiguous_ends_and_final_verse(self):
        self.assertEqual(ranges(studio.derive_sections(chapter(*range(1, 11)), [1, 4, 8])), [(1, 3), (4, 7), (8, 10)])

    def test_single_start_covers_whole_chapter(self):
        self.assertEqual(ranges(studio.derive_sections(chapter(*range(1, 6)), [1])), [(1, 5)])

    def test_every_verse_its_own_section(self):
        self.assertEqual(ranges(studio.derive_sections(chapter(1, 2, 3), [1, 2, 3])), [(1, 1), (2, 2), (3, 3)])

    def test_omitted_verse_number_is_skipped_not_cited(self):
        # BSB Matthew 17 has no verse 21: a boundary at 22 ends the previous section at 20.
        source = chapter(*[n for n in range(1, 28) if n != 21])
        self.assertEqual(ranges(studio.derive_sections(source, [1, 14, 22])), [(1, 13), (14, 20), (22, 27)])
        with self.assertRaisesRegex(ValueError, 'Verse 21 cannot begin'):
            studio.derive_sections(source, [1, 21])

    def test_combined_label_cannot_be_split(self):
        source = chapter(1, 2, '3-4', 5)
        self.assertEqual(ranges(studio.derive_sections(source, [1, 3])), [(1, 2), (3, 5)])
        self.assertEqual(ranges(studio.derive_sections(source, [1, 5])), [(1, 4), (5, 5)])
        with self.assertRaisesRegex(ValueError, 'Verse 4 cannot begin'):
            studio.derive_sections(source, [1, 4])

    def test_empty_verse_cannot_start_and_is_not_cited(self):
        # WEB Luke 17:36 exists with no text: neither a start nor an end may land on it.
        source = chapter(*range(1, 38), empty=(36,))
        self.assertEqual(ranges(studio.derive_sections(source, [1, 37])), [(1, 35), (37, 37)])
        with self.assertRaisesRegex(ValueError, 'Verse 36 cannot begin'):
            studio.derive_sections(source, [1, 36])

    def test_malformed_start_lists_rejected(self):
        source = chapter(*range(1, 11))
        for starts, message in (([], 'nonempty'), ('1,4', 'nonempty'), ([1, True], 'whole verse'),
                                ([1, 4.0], 'whole verse'), ([1, 5, 4], 'strictly increasing'),
                                ([1, 4, 4], 'strictly increasing'), ([2, 5], 'must start at verse 1'),
                                ([1, 11], 'Verse 11 cannot begin'), ([1, -3], 'strictly increasing')):
            with self.subTest(starts=starts), self.assertRaisesRegex(ValueError, message):
                studio.derive_sections(source, starts)

    def test_unreadable_or_reversed_labels_rejected(self):
        for source in (chapter(1, '2a', 3), chapter(1, '4-3'), chapter(1, 3, 2)):
            with self.subTest(source=source), self.assertRaisesRegex(ValueError, 'label'):
                studio.verse_units(source)

    def test_studio_validate_names_missing_verses(self):
        source = chapter(*range(1, 6))
        draft = {'title': 'A short title', 'context': '', 'context_references': [],
                 'summary': 'A summary paragraph that is long enough to pass the length check here.',
                 'outline': [{'verse_start': 1, 'verse_end': 3, 'heading': 'Opening', 'text': 'Text for the opening.'}],
                 'invitation': 'Notice the opening verses.'}
        with self.assertRaisesRegex(ValueError, r'missing verses \[4, 5\]'):
            studio.validate(draft, source)


class RealSourceTests(unittest.TestCase):
    """Runs over the local BSB corpus (ignored by git); skipped where the data folder is absent."""

    def setUp(self):
        if not (studio.DATA / 'text' / 'bsb').is_dir():
            self.skipTest('local BSB data not present')

    def outline(self, sections):
        return {'title': 'A short title', 'context': '', 'context_references': [],
                'summary': 'A summary paragraph that is long enough to pass the length check here.',
                'outline': [{**s, 'heading': 'Section', 'text': 'Text for this section.'} for s in sections],
                'invitation': 'Notice the movement of the chapter.'}

    def test_every_bsb_chapter_derives_valid_complete_outlines(self):
        count = 0
        for book in studio.books():
            for n in range(1, len(book['chapters']) + 1):
                source = studio.source(book['code'], n)
                firsts = [first for first, _ in studio.verse_units(source)]
                for starts in (firsts[:1], firsts[:studio.SCHEMA['properties']['outline']['maxItems']]):
                    sections = studio.derive_sections(source, starts)
                    studio.validate(self.outline(sections), source)  # raises on any gap, overlap or bad endpoint
                count += 1
        self.assertEqual(count, 1189)

    def test_bsb_omitted_verse_chapter(self):
        source = studio.source('MAT', 17)
        self.assertNotIn(21, studio.verse_numbers(source))
        self.assertEqual(ranges(studio.derive_sections(source, [1, 14, 22]))[1], (14, 20))


class PlanValidationTests(unittest.TestCase):
    def setUp(self):
        self.source = chapter(*range(1, 33))

    def check(self, starts, context=()):
        return trial.validate_plan({'section_starts': starts, 'context': list(context)}, self.source, {5: self.source})

    def test_plan_hydrates_every_verse_once(self):
        packet = self.check([1, 9, 17, 25])
        self.assertEqual(ranges(packet['sections']), [(1, 8), (9, 16), (17, 24), (25, 32)])
        verses = [f['verse'] for s in packet['sections'] for f in s['facts']]
        self.assertEqual(verses, list(range(1, 33)))
        self.assertEqual(packet['sections'][3]['facts'][-1]['source_verse'], 'text 32')

    def test_combined_label_hydrated_once(self):
        source = chapter(1, 2, '3-4', 5)
        packet = trial.validate_plan({'section_starts': [1], 'context': []}, source, {1: source})
        self.assertEqual([f['verse'] for f in packet['sections'][0]['facts']], [1, 2, '3-4', 5])

    def test_lumped_final_section_rejected(self):
        # Round-3 Genesis 5 boundaries: seven 2-3 verse sections, then 21-32 lumped together.
        with self.assertRaisesRegex(ValueError, 'Final section 21-32 has 12 verses'):
            self.check([1, 3, 6, 9, 12, 15, 18, 21])

    def test_balanced_plan_with_long_final_section_accepted(self):
        self.assertEqual(ranges(self.check([1, 11, 21])['sections'])[-1], (21, 32))

    def test_too_many_sections_rejected(self):
        with self.assertRaisesRegex(ValueError, '1-32 section starts'):
            trial.validate_plan({'section_starts': list(range(1, 34)), 'context': []}, chapter(*range(1, 40)), {})

    def test_context_must_be_a_supplied_verse(self):
        with self.assertRaisesRegex(ValueError, 'not in the supplied passage'):
            self.check([1, 17], [{'chapter': 5, 'verse': 40}])
        self.assertEqual(self.check([1, 17], [{'chapter': 5, 'verse': 2}])['context'][0]['source_verse'], 'text 2')


class RoundThreeRegressionTests(unittest.TestCase):
    """Qwen's actual round-3 plans, which were capped at eight sections and stopped early."""

    def plan_from_round3(self, folder):
        path = TRIALS / 'round-3' / folder
        if not path.is_dir():
            self.skipTest('round-3 artifacts not present')
        sources = json.loads((path / 'sources.json').read_text(encoding='utf-8'))
        source = sources['passages'][str(sources['target_chapter'])]
        old = json.loads(json.loads((path / 'extract-2.json').read_text(encoding='utf-8'))['message']['content'])
        return source, [s['verse_start'] for s in old['sections']]

    def test_genesis_5_now_fully_covered_but_flagged_as_lumped(self):
        source, starts = self.plan_from_round3('GEN-5')
        self.assertEqual(studio.derive_sections(source, starts)[-1], {'verse_start': 21, 'verse_end': 32})
        with self.assertRaisesRegex(ValueError, 'Final section 21-32'):
            trial.validate_plan({'section_starts': starts, 'context': []}, source, {})

    def test_psalm_119_now_fully_covered_but_flagged_as_lumped(self):
        source, starts = self.plan_from_round3('PSA-119')
        self.assertEqual(studio.derive_sections(source, starts)[-1], {'verse_start': 113, 'verse_end': 176})
        with self.assertRaisesRegex(ValueError, 'Final section 113-176'):
            trial.validate_plan({'section_starts': starts, 'context': []}, source, {})

    def test_psalm_119_by_stanza_is_accepted(self):
        source, _ = self.plan_from_round3('PSA-119')
        packet = trial.validate_plan({'section_starts': list(range(1, 177, 8)), 'context': []}, source, {})
        self.assertEqual(len(packet['sections']), 22)
        self.assertEqual(packet['sections'][-1]['verse_end'], 176)


if __name__ == '__main__':
    unittest.main()
