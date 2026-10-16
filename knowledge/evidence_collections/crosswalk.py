"""Read-only, bounded identity/reader reconciliation beside immutable evidence captures."""
import argparse
import hashlib
import json
import re
import sqlite3
import xml.etree.ElementTree as ET
from itertools import combinations
from pathlib import Path
from urllib.parse import quote

from jsonschema.exceptions import ValidationError

from ..research_foundation.contract import fingerprint
from ..settings import load, write_json
from .capture import verify as verify_collection
from .contract import sha256_file


def read(path):
    return json.loads(Path(path).read_text('utf-8-sig'))


def normalized(text):
    return ' '.join(text.split())


def source_header(path):
    """Retain source statements and date roles; never infer an edition from a year."""
    try:
        root = ET.parse(path).getroot()  # ElementTree never fetches external DTDs.
    except (ET.ParseError, UnicodeError):
        return {'status': 'deferred', 'reason': 'Unsupported or unparseable XML header', 'fields': []}
    if root.tag == 'ThML':
        selectors = {
            'title': './ThML.head/electronicEdInfo/DC/DC.Title',
            'creator': './ThML.head/electronicEdInfo/DC/DC.Creator',
            'printSourceStatement': './ThML.head/printSourceInfo/published',
            'firstPublicationStatement': './ThML.head/generalInfo/firstPublished',
            'electronicDateStatement': './ThML.head/electronicEdInfo/DC/DC.Date',
            'editorialStatement': './ThML.head/electronicEdInfo/editorialComments',
            'revisionStatement': './ThML.head/electronicEdInfo/revisionHistory',
            'contributor': './ThML.head/electronicEdInfo/DC/DC.Contributor',
            'rightsStatement': './ThML.head/electronicEdInfo/DC/DC.Rights',
        }
    elif root.tag == '{http://www.tei-c.org/ns/1.0}TEI':
        selectors = {
            'title': './{*}teiHeader/{*}fileDesc/{*}titleStmt/{*}title',
            'creator': './{*}teiHeader/{*}fileDesc/{*}titleStmt/{*}author',
            'printSourceStatement': './{*}teiHeader/{*}fileDesc/{*}sourceDesc/{*}biblFull/{*}publicationStmt',
            'electronicDateStatement': './{*}teiHeader/{*}fileDesc/{*}publicationStmt/{*}date',
        }
    else:
        return {'status': 'deferred', 'reason': 'Unsupported XML vocabulary', 'fields': []}
    fields = []
    for role, xpath in selectors.items():
        for index, element in enumerate(root.findall(xpath)):
            text = normalized(''.join(element.itertext()))
            if text:
                fields.append(dict(role=role, xpath=xpath, matchIndex=index,
                                   text=text, attributes=element.attrib))
    return {'status': 'source-statements', 'fields': fields,
            'limit': 'Recorded header assertions, not independent bibliographic or rights clearance.'}


def catalogue_identity(site, claims):
    """Validate existing IDs and their chain without allocating or merging identities."""
    values = {}; proofs = []; reasons = []
    for kind in ('work', 'edition', 'asset'):
        key = kind + 'Id'; value = claims.get(key)
        values[key] = None
        if not value:
            reasons.append(key + ': not recorded'); continue
        if not re.fullmatch(r'[a-zA-Z0-9_-]+', value):
            raise ValueError('Invalid catalogue identifier')
        path = site / 'content/library/catalog' / (kind + 's') / (value + '.json')
        if not path.is_file():
            reasons.append(key + ': recorded ID has no catalogue record'); continue
        record = read(path)
        if record.get('id') != value or record.get('kind') != kind:
            raise ValueError('Catalogue identity/type mismatch')
        values[key] = value
        proofs.append(dict(kind=kind, path=str(path), sha256=sha256_file(path), record=record))
    records = {p['kind']: p['record'] for p in proofs}
    if 'edition' in records and records['edition'].get('workId') != values['workId']:
        raise ValueError('Edition/work chain conflicts')
    if 'asset' in records and records['asset'].get('editionId') != values['editionId']:
        raise ValueError('Asset/edition chain conflicts')
    return dict(**values, status='resolved' if all(values.values()) else 'deferred',
                reasons=reasons, proofs=proofs)


def reader_check(package, sha, literal=None):
    """A catalogue entry or a SPA response alone is never a readable citation."""
    rid = 'held-' + sha[:32]
    shard = hashlib.sha256(rid.encode()).hexdigest()[:2]
    path = package / 'records' / (shard + '.json')
    record = read(path).get(rid) if path.is_file() else None
    result = dict(recordId=rid, catalogueRoute=None, readingRoute=None, passageTarget=None,
                  scope='local-package-only', status='deferred', reason='Record missing',
                  recordFingerprint=None, pageProofs=[])
    if not record:
        return result
    result['recordFingerprint'] = fingerprint(record)
    if record.get('id') != rid or record.get('sha256') != sha:
        result['reason'] = 'Record ID/original hash mismatch'; return result
    result['catalogueRoute'] = '/teachers/works/' + quote(rid, safe='')
    result['availability'] = record.get('availability')
    result['recordIdentity'] = {k: record.get(k) for k in ('workId', 'editionId')}
    if record.get('availability') != 'on-site-text':
        result.update(status='catalogue-only', reason='Text not offered: ' + str(record.get('availability')))
        return result
    count = record.get('pages')
    if type(count) is not int or not 1 <= count <= 500:
        result['reason'] = 'Missing pages or exceeds bounded 500-page inspection'; return result
    matches = []; cache = {}
    for page in range(count):
        bundles = record.get('pageBundles') or []
        part = bundles[page] if page < len(bundles) else None
        if part:
            if not re.fullmatch(r'pages/[a-f0-9]{64}\.json', part):
                result['reason'] = 'Unsafe page bundle path'; return result
            file = package / part
        else:
            file = package / 'text' / rid / (str(page) + '.json')
        if not file.is_file():
            result['reason'] = 'Missing reader page'; return result
        if file not in cache:
            file_hash = sha256_file(file)
            if part and file_hash != file.stem:
                result['reason'] = 'Reader bundle content hash mismatch'; return result
            cache[file] = (read(file), file_hash)
        data, file_hash = cache[file]
        content = data.get(f'{rid}/{page}') if part else data
        blocks = content.get('blocks') if isinstance(content, dict) else None
        if not isinstance(blocks, list) or not blocks or any(
            not isinstance(b, dict) or not isinstance(b.get('text'), str)
            or not isinstance(b.get('locator'), str) for b in blocks
        ) or not any(b['text'].strip() for b in blocks):
            result['reason'] = 'Empty or malformed reader body'; return result
        result['pageProofs'].append(dict(page=page, path=str(file), sha256=file_hash))
        for block in blocks:
            if literal and normalized(literal) in normalized(block['text']):
                matches.append(dict(page=page, locator=block['locator'], blockFingerprint=fingerprint(block)))
    result.update(status='readable-local-package', readingRoute=result['catalogueRoute'], reason=None,
                  pages=count, literalMatches=matches)
    # The existing UI has Previous/Next controls, but no page/fragment deep-link support.
    # Report page locations separately; do not invent a ?page= or #fragment URL.
    if literal:
        result['passageStatus'] = 'located-no-deep-link' if matches else 'quote-not-found'
    return result


def duplicate_groups(nodes, reviewed):
    """Bytes, canonical editions and reviewed work relations are distinct dimensions."""
    parents = {n['key']: n['key'] for n in nodes}
    def root(key):
        while parents[key] != key:
            key = parents[key]
        return key
    def join(a, b):
        a, b = root(a), root(b)
        parents[max(a, b)] = min(a, b)
    for a, b in combinations(nodes, 2):
        if a['identity']['workId'] and a['identity']['workId'] == b['identity']['workId']:
            join(a['key'], b['key'])
    for relation in reviewed:
        join(relation['left'], relation['right'])
    def groups(key):
        values = {}
        for n in nodes:
            value = key(n)
            if value:
                values.setdefault(value, []).append(n['key'])
        return [dict(key=k, members=sorted(v)) for k, v in sorted(values.items())]
    return dict(byteGroups=groups(lambda n: n['sha256']),
                editionGroups=groups(lambda n: n['identity']['editionId']),
                workGroups=groups(lambda n: root(n['key'])),
                policy='Retain every edition and citation. Equal bytes do not prove work identity; unknowns remain separate. Work groups are not independent witness counts.')


def build(config, collection_paths, spec_path):
    spec = read(spec_path)
    if spec.get('schemaVersion') != 1 or not 1 <= len(collection_paths) <= 10:
        raise ValueError('Require crosswalk spec v1 and 1–10 collections')
    candidate_ids = spec.get('candidateResourceIds', [])
    if len(candidate_ids) > 20 or len(set(candidate_ids)) != len(candidate_ids):
        raise ValueError('Select at most 20 unique candidate resources')
    site = config['site_dir']; package = site / 'public/content/teacher-library'
    selected = {}; inputs = []
    for path in sorted(map(Path, collection_paths)):
        collection = read(path); check = verify_collection(config, collection)
        if not check['valid']:
            raise ValueError('Stale collection: ' + str(check['staleReasons']))
        inputs.append(dict(path=str(path.resolve()), sha256=sha256_file(path), integrity=collection['integrity']))
        for item in collection['evidence']:
            key = item['anchor']['documentId']
            selected.setdefault(key, []).append(item)
    if len(selected) > 50:
        raise ValueError('Select at most 50 source documents')
    registry = config['state_dir'] / 'Research Foundation/registry.sqlite3'
    db = sqlite3.connect(registry.resolve().as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    nodes = []
    try:
        db.execute('BEGIN')
        for key, evidence in sorted(selected.items()):
            first = evidence[0]; private = first['citation']['private']
            path = Path(private['sourcePath']); sha = private['sourceSha256']
            if any(e['identity'] != first['identity'] or e['citation']['private']['sourceSha256'] != sha for e in evidence):
                raise ValueError('Conflicting captures of the same source')
            resources = [dict(r) for r in db.execute('SELECT * FROM resources WHERE sha256=? OR path=? ORDER BY id', (sha, str(path)))]
            nodes.append(make_node(site, package, key, path, sha, first['identity'], resources, evidence))
        for key in sorted(candidate_ids):
            row = db.execute('SELECT * FROM resources WHERE id=?', (key,)).fetchone()
            if row is None:
                raise ValueError('Unknown candidate resource')
            record = json.loads(row['record'])
            nodes.append(make_node(site, package, key, Path(row['path']), row['sha256'], record.get('metadata', {}), [dict(row)], []))
    finally:
        db.close()
    by_key = {n['key']: n for n in nodes}
    reviewed = []
    for relation in spec.get('reviewedRelations', []):
        if relation.get('kind') != 'same-work-different-edition' or relation.get('reviewKind') != 'ai-assisted' or not relation.get('basis') or not relation.get('limits'):
            raise ValueError('Require explicit scoped relationship review')
        a, b = (by_key[relation[k]] for k in ('left', 'right'))
        if a['key'] == b['key'] or a['sha256'] == b['sha256']:
            raise ValueError('A different-edition relation requires different source bytes')
        if a['identity']['editionId'] and a['identity']['editionId'] == b['identity']['editionId']:
            raise ValueError('Different-edition relation conflicts with canonical identity')
        assertions = relation.get('headerEvidence', [])
        if {x['node'] for x in assertions} != {a['key'], b['key']}:
            raise ValueError('Relationship must cite both source headers')
        for assertion in assertions:
            if not any(f['role'] == assertion['role'] and f['text'] == assertion['text'] for f in by_key[assertion['node']]['header']['fields']):
                raise ValueError('Reviewed source-header evidence changed')
        reviewed.append(relation)
    grouping = duplicate_groups(nodes, reviewed)
    selected_nodes = [n for n in nodes if n['selected']]
    result = dict(schemaVersion=1, publication='private',
        inputs=dict(collections=inputs, specPath=str(Path(spec_path).resolve()), specSha256=sha256_file(spec_path),
                    implementationSha256=sha256_file(__file__), registry=str(registry), readerPackage=str(package),
                    readerCodeHashes={str(p.relative_to(site)): sha256_file(p) for p in (
                        site/'src/pages/teachers/shared/acquired.ts', site/'src/pages/teachers/LibraryWorkPage.tsx')}),
        nodes=nodes, reviewedRelations=reviewed, duplicates=grouping,
        counts=dict(selectedDocuments=len(selected_nodes), candidateDocuments=len(nodes)-len(selected_nodes),
            selectedCanonicalChainsResolved=sum(n['identity']['status']=='resolved' for n in selected_nodes),
            selectedCanonicalChainsDeferred=sum(n['identity']['status']=='deferred' for n in selected_nodes),
            selectedResourceBindingsDeferred=sum(n['resourceStatus']=='deferred' for n in selected_nodes),
            candidateCanonicalChainsDeferred=sum(n['identity']['status']=='deferred' for n in nodes if not n['selected']),
            selectedReaderTextsAvailable=sum(n['reader']['status']=='readable-local-package' for n in selected_nodes),
            selectedReaderTextsDeferred=sum(n['reader']['status']!='readable-local-package' for n in selected_nodes),
            candidateReaderTextsAvailable=sum(n['reader']['status']=='readable-local-package' for n in nodes if not n['selected']),
            verifiedExtraByteCopies=sum(max(0, len(n['resourceMatches'])-1) for n in nodes),
            groupingBuckets=len(grouping['workGroups']), reviewedWorkRelations=len(reviewed)),
        limits=['Bounded selected resources only; no exhaustive catalogue or duplicate audit.',
                'Sidecar leaves original evidence/review fingerprints unchanged. Use source-bound header facts separately.',
                'Local package checks do not certify live deployment, publication permission, or direct passage navigation.',
                'Deferred canonical IDs require explicit catalogue registration; reader deferrals pass to LK-105.',
                'No corpus, vector, identity registry, publication selection or original-file writes.'])
    result['integrity'] = fingerprint(result)
    return result


def make_node(site, package, key, path, sha, claims, resources, evidence):
    if not path.is_file() or sha256_file(path) != sha:
        raise ValueError('Original bytes missing or changed')
    matches = []; conflicts = []
    for resource in resources:
        other = Path(resource['path'])
        if resource['sha256'] != sha or not other.is_file() or sha256_file(other) != sha:
            conflicts.append(dict(id=resource['id'], reason='Registry bytes/path missing or conflicting'))
        else:
            matches.append(dict(id=resource['id'], path=str(other),
                                match='exact-path-and-bytes' if other.resolve() == path.resolve() else 'equal-bytes-only',
                                registryRowFingerprint=fingerprint(resource)))
    identity = catalogue_identity(site, claims)
    asset = next((p['record'] for p in identity['proofs'] if p['kind']=='asset'), None)
    if asset and (asset.get('sha256') != sha or not asset.get('relativePath') or
                  (site.parent/'sources'/asset['relativePath']).resolve() != path.resolve()):
        raise ValueError('Canonical asset does not bind to the selected source')
    readers = [reader_check(package, sha, e['citation']['quote']) for e in evidence]
    reader = readers[0] if readers else reader_check(package, sha)
    return dict(key=key, selected=bool(evidence), path=str(path), sha256=sha,
                evidenceIds=sorted({e['id'] for e in evidence}),
                sourceBinding='verified-original-bytes', resourceMatches=matches, resourceConflicts=conflicts,
                resourceStatus='resolved' if any(m['match']=='exact-path-and-bytes' for m in matches) and not conflicts else 'deferred',
                recordedIdentity={k: claims.get(k) for k in ('workId', 'editionId', 'assetId')},
                identity=identity, header=source_header(path), reader=reader,
                passageChecks=[dict(evidenceId=e['id'], reader=r) for e, r in zip(evidence, readers)])


def verify(config, output):
    if output.get('integrity') != fingerprint({k:v for k,v in output.items() if k!='integrity'}):
        return dict(valid=False, reasons=['Crosswalk changed since reconciliation'])
    try:
        current = build(config, [x['path'] for x in output['inputs']['collections']], output['inputs']['specPath'])
        valid = current == output
        return dict(valid=valid, reasons=[] if valid else ['Selected inputs, source headers, identities, reader package or implementation changed'])
    except (ValueError, OSError, KeyError, sqlite3.Error, ValidationError) as error:
        return dict(valid=False, reasons=[str(error)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('build', 'verify'))
    parser.add_argument('--collection', type=Path, action='append', default=[])
    parser.add_argument('--spec', type=Path)
    parser.add_argument('--crosswalk', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(); config = load()
    if not args.output.resolve().is_relative_to((config['state_dir']/'library-knowledge').resolve()):
        parser.error('Output must stay under KnowledgeBase/library-knowledge')
    if args.output.resolve() in {p.resolve() for p in args.collection + [p for p in (args.spec, args.crosswalk) if p]}:
        parser.error('Output must not overwrite an input')
    if args.action == 'build':
        if not args.spec or not args.collection:
            parser.error('--spec and --collection required')
        result = build(config, args.collection, args.spec)
    else:
        if not args.crosswalk:
            parser.error('--crosswalk required')
        result = verify(config, read(args.crosswalk))
    write_json(args.output, result)
    print(json.dumps(result.get('counts', result)))
    if args.action == 'verify' and not result['valid']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
