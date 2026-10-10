"""Compile the three M04 examples for the existing local-only design preview."""
import argparse
import copy
import json
import re
import sqlite3
from pathlib import Path

from jsonschema import Draft202012Validator

from .build import HISTORY, OUTPUT, PROJECT, SITE, digest, write
from .contract import assert_public, content_fingerprint, fingerprint, http_url, permissions, project_preview, project_public

AUTHORING = SITE / 'content/research/phase-2.json'
REVIEW = OUTPUT / 'phase-2-review.json'
PREVIEW = SITE / 'design/research-phase-2/preview.json'


def read(path):
    return json.loads(path.read_text('utf-8-sig'))


def validate_records(data):
    if data.get('schemaVersion') != 1 or data.get('publication') != 'draft':
        raise ValueError('The prototype collection must remain a version 1 draft')
    all_ids = {}
    for field in ('sources', 'contributors', 'cases', 'lessons'):
        rows = data[field]
        ids = [r['id'] for r in rows]
        if len(set(ids)) != len(ids) or any(not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*', i) for i in ids):
            raise ValueError('Duplicate/invalid IDs in ' + field)
        all_ids[field] = set(ids)
    for source in data['sources']:
        if not set(source['contributors']) <= all_ids['contributors']:
            raise ValueError('Source has unknown contributor')
        if not source['locator'] or not source['editionId'] or not source['workId'] or not source['limitations']:
            raise ValueError('Source must identify its edition, location and scope')
        if not http_url(source['url']) or not http_url(source['rightsUrl']):
            raise ValueError('Source and rights links must be HTTP references')
        if any(not ref['label'] or not http_url(ref['url']) for ref in source['references']):
            raise ValueError('Supporting records need named HTTP references')
    for contributor in data['contributors']:
        if not set(contributor['works']) <= all_ids['sources']:
            raise ValueError('Contributor has unknown work')
    scripture = read(SITE / 'content/apologetics/scripture-index.json')
    books = {b['num']: b for b in scripture['books']}
    routes = {'', 'cases', 'works', 'study'}
    for plural, route in (('sources', 'works'), ('sources', 'evidence'), ('contributors', 'contributors'), ('cases', 'cases'), ('lessons', 'study')):
        routes.update(route + '/' + i for i in all_ids[plural])
    for page in data['cases'] + data['lessons']:
        if not set(page['sourceIds']) <= all_ids['sources']:
            raise ValueError('Unknown page source')
        if page in data['cases'] and page['evidenceId'] not in page['sourceIds']:
            raise ValueError('Case evidence is missing from its linked sources')
        if len({b['id'] for b in page['sections']}) != len(page['sections']):
            raise ValueError('Duplicate paragraph ID')
        for link in page['related']:
            if link['to'] not in routes:
                raise ValueError('Broken related link: ' + link['to'])
        for section in page['sections']:
            if not section['text'] or not section['citations']:
                raise ValueError('Every explanation needs its text and citations')
            for citation in section['citations']:
                if citation['kind'] == 'source':
                    if citation['source'] not in page['sourceIds'] or not citation['locator']:
                        raise ValueError('Unknown source or empty locator')
                elif citation['kind'] == 'scripture':
                    start, end = citation['span']
                    if start > end:
                        raise ValueError('Reversed Scripture range')
                    for value in (start, end):
                        book, chapter, verse = value // 1000000, value // 1000 % 1000, value % 1000
                        if book not in books or not 1 <= chapter <= len(books[book]['chapters']) or not 1 <= verse <= books[book]['chapters'][chapter-1]:
                            raise ValueError('Invalid Scripture span: ' + str(citation))
                else:
                    raise ValueError('Unrecognized citation kind')
    return sorted(routes)


def prepare(data):
    sources = []
    provenance = []
    foundation = {r['id']: r for r in read(OUTPUT / 'citations.json')}
    schema = Draft202012Validator(read(SITE / 'content/research/citation.schema.json'))
    with sqlite3.connect((OUTPUT / 'registry.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
        for source in data['sources']:
            selection = source['selection']
            if selection['kind'] == 'foundation-citation':
                basis = foundation[selection['id']]
                path = Path(basis['private']['sourcePath'])
                extracted = Path(basis['private']['extractedPath'])
                resource = basis['sourceId']
                if digest(path) != basis['private']['sourceSha256']:
                    raise ValueError('Previously reviewed source changed')
                html = path.read_text('utf8')
                if 'Attribution Share-Alike license 3.0' not in html:
                    raise ValueError('Recorded quotation licence is absent from the source credits')
            elif selection['kind'] == 'historical-readable':
                path = (HISTORY / selection['relativePath']).resolve()
                if not path.is_relative_to(HISTORY.resolve()):
                    raise ValueError('Source selection escaped the historical collection')
                extracted = path
                row = db.execute('SELECT id FROM resources WHERE path=?', (str(path),)).fetchone()
                if not row:
                    raise ValueError('Source is not in the Phase 1 registry')
                resource = row[0]
            else:
                raise ValueError('Unknown source selection')
            text = re.sub(r'\s+', ' ', extracted.read_text('utf8')).strip()
            if source['id'] == 'sinaiticus-mark':
                verses = re.findall(r'V-B34K16V(\d+)-34-MARK', text)
                if {int(v) for v in verses} != set(range(1, 9)) or '[pb 77-5r]' not in text or "'type': 'booktitle'" not in text:
                    raise ValueError('Manuscript ending/location check failed')
            quote = source['quote']
            if quote and quote not in text:
                raise ValueError('Quotation is not literal in its named source')
            permission = permissions()
            permission['metadata'] = {'decision': 'allowed', 'evidence': ['Site-authored bibliographic description and attributed reference links, selected for local design review']}
            if quote:
                permission['quote'] = {'decision': 'allowed', 'evidence': [source['rights'], source['rightsUrl']]}
            citation = {'id': 'citation:phase2:' + source['id'], 'claimId': 'research-evidence:' + source['id'],
                        'sourceId': resource, 'editionId': source['editionId'], 'locator': source['locator'], 'quote': quote,
                        'sourceUrl': source['url'], 'sourceRole': source['sourceRole'], 'claimKind': 'historical-observation',
                        'claim': source['description'], 'alternatives': [],
                        'review': {'kind': 'ai-assisted', 'state': 'reviewed-limited',
                                   'scope': 'Codex: source identity, exact location and bounded description checked for the M04 draft; no human publication approval',
                                   'literalMatch': bool(quote), 'contentFingerprint': None},
                        'limits': source['limitations'],
                        'dates': {'objectOrWork': source['period'], 'discovery': None, 'editionPublication': '2012' if quote else None,
                                  'retrieval': '2026-10-09', 'review': '2026-10-09'},
                        'permissions': permission, 'private': {'sourcePath': str(path), 'extractedPath': str(extracted),
                            'sourceSha256': digest(path), 'extractedSha256': digest(extracted)}, 'publication': 'draft'}
            citation['review']['contentFingerprint'] = content_fingerprint(citation)
            schema.validate(citation)
            projection = project_preview(citation)
            if projection is None or project_public(citation) is not None:
                raise ValueError('Draft preview/public boundary failed')
            public = {k: v for k, v in source.items() if k not in ('selection', 'quote')}
            public['citation'] = projection
            sources.append(public)
            provenance.append(citation)
    bundle = {k: copy.deepcopy(v) for k, v in data.items() if k not in ('sources', 'publication')}
    bundle['sources'] = sources
    bundle['scope'] = 'local-design-review'
    assert_public(bundle)
    basis = fingerprint({'authoring': data, 'citations': provenance,
                         'editorialPolicy': digest(SITE / 'content/apologetics/editorial/library.json')})
    return bundle, provenance, basis


def run(review=False):
    data = read(AUTHORING)
    routes = validate_records(data)
    bundle, private, basis = prepare(data)
    if review:
        write(REVIEW, {'kind': 'ai-assisted', 'reviewer': 'Codex', 'date': '2026-10-09', 'basisHash': basis,
                       'scope': 'M04 source/paragraph alignment and literal/location checks; local design review only',
                       'humanAcceptance': None})
    if not REVIEW.exists() or read(REVIEW)['basisHash'] != basis:
        raise ValueError('Draft review is missing or stale. Review changed content/sources before recording --review.')
    write(PREVIEW, bundle)
    write(OUTPUT / 'phase-2-citations.json', private)
    write(OUTPUT / 'phase-2-verification.json', {'passed': True, 'routes': routes, 'sources': len(private),
          'sourceIdsPreservedFromPhase1': [c['sourceId'] for c in private], 'reviewBasis': basis,
          'publiclySelected': 0, 'previewBytes': PREVIEW.stat().st_size, 'privateFieldsExported': False})
    lines = ['# Research examples: content', '', '> Generated by `python -m knowledge.research_foundation.prototypes` from `content/research/phase-2.json`. Local review only.', '']
    lines += ['## Selected routes', ''] + ['- `/review/research' + ('/' + route if route else '') + '`' for route in routes] + ['']
    for group in ('cases', 'lessons'):
        for page in data[group]:
            lines += ['## ' + page['title'], '', page['eyebrow'], '', page['lead'], '']
            if group == 'cases':
                lines += ['**' + page['question'] + '**', '', page['answer'], '']
            else:
                lines += ['Passage: ' + page['passage']['reference'] + ' (KJV, loaded from the existing Bible reader data)', '', 'Aim: ' + page['aim'], '']
            for section in page['sections']:
                lines += ['### ' + section['title'], '', section['text'], '', 'Sources: ' + '; '.join(c.get('reference') or c['source'] + ' · ' + c['locator'] for c in section['citations']), '']
            lines += [page['conclusion'], '']
            lines += ['- ' + item for item in page.get('limits', page.get('questions', []))] + ['']
            lines += ['Related: ' + link['label'] + ' — ' + link['note'] + ' (`' + link['to'] + '`)' for link in page['related']] + ['']
    for source in data['sources']:
        lines += ['## Source: ' + source['title'], '', source['subtitle'], '', source['edition'], '', source['genre'] + ' · ' + source['language'] + ' · ' + source['period'], '', source['description'], '', 'Locator: ' + source['locator'], '']
        if source['quote']:
            lines += ['> ' + source['quote'], '']
        lines += ['- ' + item for item in source['limitations']] + ['', source['rights'], '', 'Original: ' + source['url'], '', 'Rights: ' + source['rightsUrl'], '']
        lines += ['- [' + ref['label'] + '](' + ref['url'] + ')' for ref in source['references']] + ['']
    for contributor in data['contributors']:
        lines += ['## Contributor: ' + contributor['name'], '', contributor['role'], '', contributor['description'], '', contributor['scope'], '', 'Attribution: ' + contributor['sourceLocator'] + ' — ' + contributor['url'], '']
        if contributor['kind'] == 'person':
            lines += ['Faith or tradition: not established in the edition credits reviewed here.', '']
    out = PROJECT / 'Pages/Research Examples'
    out.mkdir(exist_ok=True)
    (out / 'CONTENT.md').write_text('\n'.join(lines), encoding='utf8')
    print(json.dumps({'passed': True, 'sources': len(private), 'pages': len(routes), 'previewBytes': PREVIEW.stat().st_size, 'reviewBasis': basis}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--review', action='store_true', help='Record the implementing assistant review after inspecting the source/content changes')
    run(parser.parse_args().review)
