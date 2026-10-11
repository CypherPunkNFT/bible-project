import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-scholar-foundation.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class SourceDates(unittest.TestCase):
    def test_bce_is_not_converted_to_ce(self):
        dates = audit.parse_date('Cicero, 106-43 B.C.')
        self.assertEqual((dates['born'], dates['died'], dates['era']), (-106, -43, 'ancient'))

    def test_death_is_not_treated_as_birth(self):
        dates = audit.parse_date('Example, d. 1502')
        self.assertEqual(dates['died'], 1502)
        self.assertIsNone(dates['era'])
        self.assertNotIn('born', dates)

    def test_floruit_and_birth_keep_their_roles(self):
        self.assertEqual(audit.parse_date('Example, fl. 1640')['floruit'], 1640)
        self.assertEqual(audit.parse_date('Example, b. 1949')['born'], 1949)
        dates = audit.parse_date('Example, fl. 1640-1670')
        self.assertEqual(dates['floruit'], 1640)
        self.assertNotIn('born', dates)
        self.assertIsNone(audit.parse_date('Example, d. 1640-1642'))

    def test_ambiguous_and_impossible_dates_require_review(self):
        for label in ['Example, 15th cent.', 'Example, 1500', 'Example, 1600-1500', 'Example, 1000-1800', 'Example, 0-70', 'Example, 1900-2090', 'Example, 1500 or 1501']:
            with self.subTest(label=label):
                self.assertIsNone(audit.parse_date(label))

    def test_uncertainty_is_preserved(self):
        self.assertTrue(audit.parse_date('Example, ca. 1600-1670?')['approximate'])


if __name__ == '__main__':
    unittest.main()
