"""Contract boundary tests; synthetic publication permissions never alter actual selections."""
import copy
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from jsonschema import Draft202012Validator

from . import build
from .contract import assert_public, content_fingerprint, permissions, project_public, section_view, validate_citation


def sample():
    citation = {'id': 'citation:test', 'claimId': 'claim:test', 'sourceId': 'resource:test',
                'editionId': 'library:edition:synthetic-test', 'locator': 'Book 1, section 2', 'quote': 'A test quotation.',
                'sourceUrl': 'https://example.org/edition', 'sourceRole': 'Published edition',
                'claimKind': 'historical-observation', 'claim': 'This source contains this statement.',
                'alternatives': [{'interpretation': 'A different interpretation', 'sourceUrl': 'https://example.org/other',
                                  'accessScope': 'abstract only', 'reviewState': 'pending'}],
                'review': {'kind': 'ai-assisted', 'state': 'reviewed-limited', 'scope': 'Synthetic fixture only',
                           'literalMatch': True, 'contentFingerprint': None}, 'limits': ['Not an eyewitness account.'],
                'dates': {'objectOrWork': 'first century', 'discovery': None, 'editionPublication': '1900',
                          'retrieval': '2026-10-09', 'review': '2026-10-09'},
                'permissions': permissions(), 'private': {'sourcePath': 'D:\\private\\edition.txt',
                    'sourceSha256': 'a' * 64, 'extractedSha256': 'b' * 64, 'fullText': 'PRIVATE BODY'}, 'publication': 'draft'}
    citation['review']['contentFingerprint'] = content_fingerprint(citation)
    return citation


def selected():
    row = sample()
    row['publication'] = 'published'
    for action in ('metadata', 'quote'):
        row['permissions'][action] = {'decision': 'allowed', 'evidence': ['Synthetic unit test permission; not a real rights decision']}
    return row


class CitationTests(unittest.TestCase):
    def test_three_sections_preserve_exact_source_context(self):
        row = sample()
        for section in ('scholars', 'apologetics', 'studies'):
            view = section_view(row, section)
            self.assertEqual(view['citation'], row)
            view['citation']['limits'].append('Mutation must not affect original')
            self.assertEqual(len(row['limits']), 1)

    def test_json_schema(self):
        schema = json.loads((build.SITE / 'content/research/citation.schema.json').read_text('utf8'))
        Draft202012Validator.check_schema(schema)
        Draft202012Validator(schema).validate(sample())

    def test_drafts_and_unknown_rights_not_exported(self):
        self.assertIsNone(project_public(sample()))
        row = sample()
        row['publication'] = 'published'
        self.assertIsNone(project_public(row))

    def test_no_private_body_or_path_exported(self):
        row = selected()
        row['permissions']['fullText'] = {'decision': 'allowed', 'evidence': ['Synthetic fixture']}
        public = project_public(row)
        self.assertEqual(public['quote'], row['quote'])
        self.assertEqual(public['alternatives'], row['alternatives'])
        self.assertNotIn('PRIVATE', json.dumps(public))
        self.assertNotIn('private', public)
        assert_public(public)

    def test_quote_rights_separate_and_conditional_not_allowed(self):
        for state in ('unknown', 'conditional', 'denied'):
            row = selected()
            row['permissions']['quote']['decision'] = state
            self.assertIsNone(project_public(row)['quote'])

    def test_quote_requires_identified_edition_and_review(self):
        row = selected()
        row['editionId'] = None
        row['review']['contentFingerprint'] = content_fingerprint(row)
        self.assertIsNone(project_public(row)['quote'])
        row = selected()
        row['review']['state'] = 'pending'
        self.assertIsNone(project_public(row)['quote'])

    def test_changed_claim_locator_quote_or_source_stales_review(self):
        for field in ('claim', 'quote', 'locator', 'sourceId', 'editionId'):
            row = selected()
            row[field] += ' changed'
            self.assertIsNone(project_public(row)['quote'])
            self.assertEqual(project_public(row)['review']['state'], 'stale')
        row = selected()
        row['private']['sourceSha256'] = 'c' * 64
        self.assertIsNone(project_public(row)['quote'])
        self.assertEqual(project_public(row)['review']['state'], 'stale')

    def test_paths_cannot_hide_in_public_prose(self):
        for value in ('See D:\\secret\\file.txt', 'file:///etc/secret', '/home/user/source', '\\\\server\\share'):
            row = selected()
            row['limits'].append(value)
            with self.assertRaises(ValueError):
                project_public(row)

    def test_contract_rejects_missing_locator_and_unsubstantiated_permission(self):
        row = sample()
        row['locator'] = None
        with self.assertRaises(ValueError):
            validate_citation(row)
        row = selected()
        row['permissions']['quote']['evidence'] = 'Unstructured text is not an evidence list'
        with self.assertRaises(ValueError):
            validate_citation(row)
        row = selected()
        row['permissions']['quote']['evidence'] = []
        with self.assertRaises(ValueError):
            validate_citation(row)

    def test_unsafe_url_and_extra_public_field_rejected(self):
        row = sample()
        row['sourceUrl'] = 'https://user:secret@example.org/edition'
        with self.assertRaises(ValueError):
            validate_citation(row)
        with self.assertRaises(ValueError):
            assert_public({'nested': {'fullText': 'body'}})


class RegistryTests(unittest.TestCase):
    def test_ids_survive_restart_and_titles_do_not_merge_editions(self):
        with tempfile.TemporaryDirectory() as temporary, patch.object(build, 'OUTPUT', Path(temporary)):
            first = build.Builder()
            ident = first.allocate('file:stable-origin')
            a = first.entity('library:edition', 'edition-a', 'edition', 'Same title', {'translation': 'A'}, 'fixture')
            b = first.entity('library:edition', 'edition-b', 'edition', 'Same title', {'translation': 'B'}, 'fixture')
            self.assertNotEqual(a, b)
            first.ids.commit()
            first.ids.close()
            second = build.Builder()
            self.assertEqual(second.allocate('file:stable-origin'), ident)
            self.assertNotEqual(second.allocate('file:different-origin'), ident)
            second.ids.close()

    def test_matching_bytes_preserve_both_assets_and_paths(self):
        with tempfile.TemporaryDirectory() as temporary, patch.object(build, 'OUTPUT', Path(temporary)), patch.object(build, 'SOURCES', Path(temporary)):
            builder = build.Builder()
            builder.group('test', 'Test', builder.routes['library'], 'Fixture')
            for number in (1, 2):
                p = Path(temporary) / f'edition-{number}.txt'
                p.write_text('Identical bytes', encoding='utf8')
                asset = builder.entity('library:asset', f'asset-{number}', 'asset', 'Same title', {}, 'fixture')
                builder.catalog_by_hash['a' * 64].append(asset)
                builder.catalog_by_path[build.key(p)].append(asset)
                builder.file(p, 'test', {'sha256': 'a' * 64})
            builder.reconcile()
            self.assertEqual(len(builder.files), 2)
            self.assertEqual(len({r['id'] for r in builder.files.values()}), 2)
            for row in builder.files.values():
                self.assertEqual(len(row['canonicalAssets']), 1)
                self.assertEqual(len(row['sameRecordedBytesAsAssets']), 2)
            builder.ids.close()


if __name__ == '__main__':
    unittest.main()
