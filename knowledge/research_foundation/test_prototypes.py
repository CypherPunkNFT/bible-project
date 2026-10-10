"""Guard the prototype's reference integrity and draft/public boundary."""
import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from . import prototypes
from .contract import project_preview, project_public
from .test_foundation import selected


class PrototypeTests(unittest.TestCase):
    def setUp(self):
        self.data = prototypes.read(prototypes.AUTHORING)

    def test_all_fourteen_selected_routes_are_real(self):
        routes = prototypes.validate_records(self.data)
        self.assertEqual(len(routes), 14)
        self.assertIn('study/prayer-under-pressure', routes)

    def test_broken_source_case_and_related_links_rejected(self):
        for mutate in (
            lambda d: d['cases'][0].update(evidenceId='missing'),
            lambda d: d['cases'][0]['related'][0].update(to='works/missing'),
            lambda d: d['sources'][0]['contributors'].append('missing'),
            lambda d: d['sources'][0].update(url='file:///private'),
        ):
            data = copy.deepcopy(self.data)
            mutate(data)
            with self.assertRaises(ValueError):
                prototypes.validate_records(data)

    def test_invalid_verse_and_unlinked_block_source_rejected(self):
        data = copy.deepcopy(self.data)
        data['lessons'][0]['sections'][0]['citations'][0]['span'] = [12019999, 12019999]
        with self.assertRaises(ValueError):
            prototypes.validate_records(data)
        data = copy.deepcopy(self.data)
        data['cases'][0]['sections'][0]['citations'] = [{'kind': 'source', 'source': 'sinaiticus-mark', 'locator': '16:8'}]
        with self.assertRaises(ValueError):
            prototypes.validate_records(data)

    def test_preview_does_not_publish_and_retains_quote_gate(self):
        row = selected()
        row['publication'] = 'draft'
        self.assertIsNone(project_public(row))
        self.assertEqual(project_preview(row)['quote'], row['quote'])
        self.assertNotIn('private', project_preview(row))
        row['permissions']['quote']['decision'] = 'unknown'
        self.assertIsNone(project_preview(row)['quote'])

    def test_changed_source_or_locator_stales_preview_quote(self):
        for mutate in (lambda r: r.update(locator='different location'),
                       lambda r: r['private'].update(sourceSha256='c' * 64)):
            row = selected()
            row['publication'] = 'draft'
            mutate(row)
            self.assertIsNone(project_preview(row)['quote'])
            self.assertEqual(project_preview(row)['review']['state'], 'stale')

    def test_missing_or_stale_review_cannot_write_preview(self):
        with tempfile.TemporaryDirectory() as directory:
            review = Path(directory) / 'review.json'
            preview = Path(directory) / 'preview.json'
            with patch.object(prototypes, 'REVIEW', review), patch.object(prototypes, 'PREVIEW', preview), patch.object(prototypes, 'prepare', return_value=({}, [], 'changed-source-or-authoring')):
                with self.assertRaisesRegex(ValueError, 'missing or stale'):
                    prototypes.run()
                review.write_text('{"basisHash":"earlier-review"}', encoding='utf8')
                with self.assertRaisesRegex(ValueError, 'missing or stale'):
                    prototypes.run()
                self.assertFalse(preview.exists())


if __name__ == '__main__':
    unittest.main()
