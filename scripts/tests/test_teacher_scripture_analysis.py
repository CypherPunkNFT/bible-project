import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'analyse-teacher-scripture.py'
spec = importlib.util.spec_from_file_location('teacher_analysis', SCRIPT)
analysis = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analysis)


class TeacherScriptureAnalysisTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.verses = analysis.Verses(analysis.SITE / 'data')

    def refs(self, text):
        return list(analysis.reference_evidence(text, self.verses))

    def test_historical_roman_reference_preserves_range(self):
        row = self.refs('TEXT: Rom. viii. 28, 29.\nWe now consider the words.')[0]
        self.assertEqual(row['normalizedReference'], 'Romans 8:28,29')
        self.assertEqual(row['ranges'], [[45008028,45008028],[45008029,45008029]])
        self.assertEqual(row['classification'], 'heading-candidate')

    def test_numbered_book_and_cross_chapter(self):
        row = self.refs('I Corinthians xii. 31-xiii. 3')[0]
        self.assertEqual(row['ranges'], [[46012031,46013003]])

    def test_citation_is_not_promoted_to_main_text(self):
        row = self.refs('This argument uses John 3:16 to illustrate the point.')[0]
        self.assertEqual(row['classification'], 'citation')
        self.assertEqual(row['reviewStatus'], 'unreviewed')

    def test_invalid_and_reversed_ranges_rejected(self):
        for text in ['John 3:99', 'John 3:20-16', 'Psalms 151:1']:
            self.assertEqual(self.refs(text)[0]['verseValidation'], 'rejected')

    def test_open_ended_reference_is_not_guessed(self):
        self.assertEqual(self.refs('Romans 8:28 ff.')[0]['verseValidation'], 'rejected')

    def test_names_in_description_do_not_create_authorship(self):
        ids, _, _, _ = analysis.authors_of({'acquisition':{'author':'Other Writer','description':'Quotes Thomas Watson frequently'}}, {'thomaswatson':'author-thomas-watson'})
        self.assertEqual(ids, set())

    def test_mixed_author_parent_requires_review(self):
        ids, _, mixed, unresolved = analysis.authors_of({'acquisition':{'author':'Sibbes, Richard, 1577-1635; Other Author'}}, {'richardsibbes':'author-richard-sibbes'})
        self.assertEqual(ids, {'author-richard-sibbes'})
        self.assertTrue(mixed)
        self.assertEqual(unresolved, ['Other Author'])

    def test_malformed_roman_rejected(self):
        self.assertEqual(self.refs('Romans iiii. 1')[0]['verseValidation'], 'rejected')


if __name__ == '__main__':
    unittest.main()
