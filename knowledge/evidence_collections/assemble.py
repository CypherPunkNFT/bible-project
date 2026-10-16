"""Reproducible private evidence packages and selective dependency invalidation.

No encoder, LanceDB, corpus writer, automatic review or public exporter is used.
Existing captures are preserved verbatim inside content-addressed packages.
"""
import argparse
import json
import sqlite3
from pathlib import Path

from jsonschema.exceptions import ValidationError

from ..research_foundation.contract import fingerprint
from ..settings import load, write_json
from ..store import connect
from .capture import verify as verify_capture
from .contract import implementation_hashes, sha256_file, validate
from .crosswalk import read, verify as verify_crosswalk
from .eligibility import verify as verify_eligibility
from .evaluate import evaluate

ERRORS = (OSError, ValueError, KeyError, TypeError, sqlite3.Error, ValidationError)


def private_path(config, path):
    path = Path(path).resolve()
    if not path.is_relative_to((config['state_dir'] / 'library-knowledge').resolve()):
        raise ValueError('Output must stay under KnowledgeBase/library-knowledge')
    return path


def sealed(value):
    return dict(value, integrity=fingerprint(value))


def check_seal(value):
    if value.get('integrity') != fingerprint({k: v for k, v in value.items() if k != 'integrity'}):
        raise ValueError('Artifact integrity differs')


def one(rows, key, value):
    matches = [r for r in rows if r[key] == value]
    if len(matches) != 1:
        raise ValueError('Required unique record absent or duplicated: ' + str(value))
    return matches[0]


def crosswalk_slice(data, keys):
    check_seal(data)
    groups = [g for g in data['duplicates']['workGroups'] if set(g['members']) & set(keys)]
    related = set(keys) | {k for g in groups for k in g['members']}
    return dict(nodes=[one(data['nodes'], 'key', k) for k in sorted(related)],
                workGroups=groups,
                reviewedRelations=[r for r in data['reviewedRelations'] if {r['left'], r['right']} & related],
                policy=data['duplicates']['policy'])


def eligibility_slice(data, keys):
    check_seal(data)
    reviews = [one(data['sourceReviews'], 'node', k) for k in sorted(keys)]
    evidence_ids = {e for r in reviews for a in r['uses'].values() for e in a['evidenceIds']}
    return dict(reviewKind=data['reviewKind'], reviewDate=data['reviewDate'],
                publicationSelected=data['publicationSelected'], publication=data['publication'],
                sourceReviews=reviews, policyEvidence=[one(data['policyEvidence'], 'id', e) for e in sorted(evidence_ids)])


def read_dependency(config, descriptor):
    """Only fixed read-only projections; never execute SQL supplied by a manifest."""
    kind = descriptor['kind']
    if kind == 'file':
        return sha256_file(descriptor['path'])
    if kind in ('recipe', 'crosswalk', 'eligibility', 'retrieval', 'judgment'):
        data = read(descriptor['path'])
        if kind == 'recipe':
            return one(data['collections'], 'id', descriptor['id'])
        if kind == 'crosswalk':
            return crosswalk_slice(data, descriptor['keys'])
        if kind == 'eligibility':
            return eligibility_slice(data, descriptor['keys'])
        if kind == 'judgment':
            return dict(reviewKind=data['reviewKind'], scope=data['scope'],
                        judgment=one(data['judgments'], 'id', descriptor['id']))
        record = one(data['results'], 'id', descriptor['id'])
        # Elapsed timings are observations, not evidence or ranking dependencies.
        return dict(inputs={k: data[k] for k in ('questionsSha256', 'snapshotManifest', 'queryVectorsSha256',
                                               'implementationSha256', 'corpusBuild', 'vectorVersion', 'publication')},
                    question={k: v for k, v in record.items() if k not in ('lexical', 'hybrid')},
                    methods={m: {k: v for k, v in record[m].items() if k != 'seconds'} for m in ('lexical', 'hybrid')})
    if kind not in ('corpus-build', 'corpus-evidence', 'resource'):
        raise ValueError('Unknown dependency kind')
    db = connect(Path(descriptor['path']) if kind == 'resource' else config['db'], readonly=True)
    try:
        db.execute('BEGIN')
        if kind == 'corpus-build':
            return db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if kind == 'resource':
            row = db.execute('SELECT * FROM resources WHERE id=?', (descriptor['id'],)).fetchone()
            return dict(row) if row else None
        row = db.execute('SELECT c.*,d.source,d.licence,d.metadata FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.id=?',
                         (descriptor['id'],)).fetchone()
        if row is None:
            return None
        neighbors = []
        for comparison, order in (('<', 'DESC'), ('>', 'ASC')):
            other = db.execute(f'SELECT id,text,locator FROM chunks WHERE document_id=? AND rowid{comparison}? ORDER BY rowid {order} LIMIT 1',
                               (row['document_id'], row['rowid'])).fetchone()
            if other:
                neighbors.append(dict(other))
        metadata = json.loads(row['metadata'])
        records = []
        for key in ('work', 'edition', 'asset'):
            identifier = (metadata.get(key) or {}).get('id')
            if identifier:
                record = db.execute('SELECT * FROM library_records WHERE id=?', (identifier,)).fetchone()
                records.append(dict(record) if record else None)
        return dict(chunk=dict(row), neighbors=neighbors, canonicalRecords=records)
    finally:
        db.close()


def dependency(config, kind, **selector):
    descriptor = dict(kind=kind, **selector)
    return dict(key=fingerprint(descriptor), descriptor=descriptor,
                fingerprint=fingerprint(read_dependency(config, descriptor)))


def implementation_dependencies(config):
    site = Path(__file__).resolve().parents[2]
    paths = [site / p for p in implementation_hashes()]
    paths += [Path(__file__), Path(__file__).with_name('crosswalk.py'), Path(__file__).with_name('eligibility.py'),
              Path(__file__).with_name('evaluate.py'), site / 'knowledge/store.py']
    return [dependency(config, 'file', path=str(p.resolve())) for p in paths]


def assemble(config, recipe_path, entry):
    capture = validate(read(entry['capturePath']))
    if capture['id'] != entry['id']:
        raise ValueError('Recipe and captured collection identity differ')
    check = verify_capture(config, capture)
    if not check['valid']:
        raise ValueError('Capture requires explicit recapture/review: ' + str(check['staleReasons']))
    cw = read(entry['crosswalkPath']); uses = read(entry['eligibilityPath'])
    for label, result in (('Crosswalk', verify_crosswalk(config, cw)), ('Use decisions', verify_eligibility(config, uses))):
        if not result['valid']:
            raise ValueError(label + ' requires reconciliation: ' + str(result['reasons']))
    if Path(uses['inputs']['crosswalkPath']).resolve() != Path(entry['crosswalkPath']).resolve():
        raise ValueError('Use decisions refer to another crosswalk')
    keys = sorted({i['anchor']['documentId'] for i in capture['evidence']})
    cw_part = crosswalk_slice(cw, keys); use_part = eligibility_slice(uses, keys)
    if any(r['privateAnalysis']['decision'] != 'allowed' for r in use_part['sourceReviews']):
        raise ValueError('Private analysis decision absent')
    deps = implementation_dependencies(config)
    deps += [dependency(config, 'recipe', path=str(Path(recipe_path).resolve()), id=entry['id']),
             dependency(config, 'file', path=str(Path(entry['capturePath']).resolve())),
             dependency(config, 'crosswalk', path=str(Path(entry['crosswalkPath']).resolve()), keys=keys),
             dependency(config, 'eligibility', path=str(Path(entry['eligibilityPath']).resolve()), keys=keys),
             dependency(config, 'corpus-build')]
    for item in capture['evidence']:
        deps.append(dependency(config, 'corpus-evidence', id=item['anchor']['chunkId']))
    for node in cw_part['nodes']:
        deps.append(dependency(config, 'file', path=str(Path(node['path']).resolve())))
        for proof in node['identity']['proofs']:
            deps.append(dependency(config, 'file', path=str(Path(proof['path']).resolve())))
        for match in node['resourceMatches']:
            deps.append(dependency(config, 'resource', path=cw['inputs']['registry'], id=match['id']))
            deps.append(dependency(config, 'file', path=str(Path(match['path']).resolve())))
    discovery = []
    if entry.get('retrieval'):
        retrieval = entry['retrieval']; folder = Path(retrieval['folder']).resolve()
        # Check the recorded evaluation bindings without rerunning search or changing labels.
        evaluate(folder)
        results = read(folder / 'heldOut-results.json'); judgments = read(folder / 'judgments.json')
        for name, expected in [('snapshot.json', results['snapshotManifest']['snapshotSha256']),
                               ('selected-vectors.npz', results['snapshotManifest']['vectorsSha256']),
                               ('questions.frozen.json', results['questionsSha256']),
                               ('query-vectors.json', results['queryVectorsSha256'])]:
            if sha256_file(folder / name) != expected:
                raise ValueError('Frozen retrieval dependency changed: ' + name)
            deps.append(dependency(config, 'file', path=str(folder / name)))
        deps.append(dependency(config, 'file', path=str(folder / 'evaluation-freeze.json')))
        if results['corpusBuild'] != capture['inputs']['corpusBuild']:
            raise ValueError('Retrieval and capture corpus builds differ')
        question_ids = retrieval['questionIds']
        if not question_ids or len(question_ids) != len(set(question_ids)):
            raise ValueError('Explicit unique retrieval questions required')
        for identifier in sorted(question_ids):
            result = one(results['results'], 'id', identifier)
            judgment = one(judgments['judgments'], 'id', identifier)
            selected = {i['anchor']['chunkId'] for i in capture['evidence']}
            methods = {}
            for mode in ('lexical', 'hybrid'):
                methods[mode] = [dict(chunkId=r['chunkId'], documentId=r['documentId'], rank=rank,
                                     score=r['score'], selectedEvidence=r['chunkId'] in selected,
                                     usefulness=one(judgment['candidates'], 'chunkId', r['chunkId'])['useful'])
                                 for rank, r in enumerate(result[mode]['results'], 1)]
            discovery.append(dict(questionId=identifier, query=result['query'], methods=methods,
                                  reviewKind=judgments['reviewKind'], note=judgment['note'],
                                  role='Historical retrieval diagnostic; never claim or attribution approval',
                                  selectedEvidenceAbsentFromTopFive=sorted(selected - {r['chunkId'] for m in methods.values() for r in m})))
            deps += [dependency(config, 'retrieval', path=str(folder / 'heldOut-results.json'), id=identifier),
                     dependency(config, 'judgment', path=str(folder / 'judgments.json'), id=identifier)]
        if read(folder / 'heldOut-results.json') != results or read(folder / 'judgments.json') != judgments:
            raise ValueError('Retrieval review changed during assembly')
    # Bind dependency reads to the content actually copied, rather than silently
    # accepting newer bytes if an upstream worker changed an input mid-build.
    if read(entry['capturePath']) != capture or not verify_capture(config, capture)['valid']:
        raise ValueError('Capture changed during assembly')
    if crosswalk_slice(read(entry['crosswalkPath']), keys) != cw_part or eligibility_slice(read(entry['eligibilityPath']), keys) != use_part:
        raise ValueError('Source decisions changed during assembly')
    for node in cw_part['nodes']:
        if sha256_file(node['path']) != node['sha256']:
            raise ValueError('Original bytes changed during assembly')
    dependencies = sorted({d['key']: d for d in deps}.values(), key=lambda d: d['key'])
    return sealed(dict(schemaVersion=1, kind='private-evidence-package', id=entry['id'],
                       collection=capture, sourceCrosswalk=cw_part, useDecisions=use_part,
                       discovery=discovery, dependencies=dependencies, publication='private',
                       reviewPolicy='Preserve captured reviews; changed dependencies require explicit reconciliation/review.',
                       limits=['Recorded reader/use decisions are dated; verify their upstream workflows before any publication.',
                               'Candidate usefulness does not establish an attributed claim or expand the reviewed capture.',
                               'A corpus build change requires revalidation even if selected text appears unchanged.']))


def package_check(config, package, cache=None):
    check_seal(package)
    validate(package['collection'])
    if package['publication'] != 'private' or package['id'] != package['collection']['id']:
        raise ValueError('Package identity/publication boundary differs')
    cache = {} if cache is None else cache
    changed = []
    for dep in package['dependencies']:
        descriptor = dep['descriptor']; key = fingerprint(descriptor)
        if dep['key'] != key:
            raise ValueError('Dependency key differs')
        if key not in cache:
            try:
                cache[key] = dict(fingerprint=fingerprint(read_dependency(config, descriptor)), error=None)
            except ERRORS as error:
                cache[key] = dict(fingerprint=None, error=str(error))
        current = cache[key]
        if current['fingerprint'] != dep['fingerprint']:
            changed.append(dict(key=key, descriptor=descriptor, expected=dep['fingerprint'],
                                actual=current['fingerprint'], error=current['error']))
    return dict(id=package['id'], state='stale' if changed else 'current', changedDependencies=changed)


def check(config, folder):
    folder = private_path(config, folder)
    manifest = read(folder / 'manifest.json'); check_seal(manifest)
    entries = manifest['collections']
    if manifest.get('schemaVersion') != 1 or manifest.get('publication') != 'private' or not entries or len({e['id'] for e in entries}) != len(entries):
        raise ValueError('Invalid private release manifest')
    cache = {}; rows = []
    for entry in manifest['collections']:
        try:
            path = (folder / entry['path']).resolve()
            if not path.is_relative_to(folder) or sha256_file(path) != entry['sha256']:
                raise ValueError('Package path/hash differs')
            package = read(path)
            if package['id'] != entry['id'] or package['integrity'] != entry['integrity']:
                raise ValueError('Manifest package binding differs')
            rows.append(package_check(config, package, cache))
        except ERRORS as error:
            rows.append(dict(id=entry['id'], state='invalid', changedDependencies=[], error=str(error)))
    return dict(schemaVersion=1, valid=all(r['state']=='current' for r in rows),
                counts={s: sum(r['state']==s for r in rows) for s in ('current', 'stale', 'invalid')},
                collections=rows, publicExported=False, vectorsModified=False, corpusModified=False)


def build(config, recipe_path, folder):
    folder = private_path(config, folder); recipe_path = Path(recipe_path).resolve()
    recipe = read(recipe_path)
    entries = recipe['collections']
    if recipe.get('schemaVersion') != 1 or not 1 <= len(entries) <= 50 or len({e['id'] for e in entries}) != len(entries):
        raise ValueError('Require 1–50 uniquely identified collection recipes')
    # Existing releases are immutable. A current run is a no-op; a stale one
    # requires a new folder and explicit upstream correction, never auto-review.
    if (folder / 'manifest.json').exists():
        manifest = read(folder / 'manifest.json'); check_seal(manifest)
        if manifest['recipePath'] != str(recipe_path) or sorted(e['id'] for e in entries) != sorted(e['id'] for e in manifest['collections']):
            raise ValueError('Existing release has a different recipe; use a new private folder')
        result = check(config, folder)
        if not result['valid']:
            raise ValueError('Existing release is stale/invalid; inspect check, reconcile dependencies and use a new private folder')
        return dict(state='reused', collections=len(entries), manifestIntegrity=manifest['integrity'])
    # Build everything before changing the release pointer. A failed assembly
    # leaves no visible partial manifest. Object writes are atomic and immutable.
    packages = [assemble(config, recipe_path, entry) for entry in sorted(entries, key=lambda e:e['id'])]
    protected = {recipe_path}
    for package in packages:
        protected.update(Path(d['descriptor']['path']).resolve() for d in package['dependencies'] if 'path' in d['descriptor'])
        state = package_check(config, package)
        if state['state'] != 'current':
            raise ValueError('Dependencies changed during assembly')
    records = []; reverse = {}
    for package in packages:
        target = folder / 'objects' / (package['integrity'] + '.json')
        if target.resolve() in protected or (folder / 'manifest.json').resolve() in protected:
            raise ValueError('Output would overwrite an input')
        if target.exists():
            if read(target) != package:
                raise ValueError('Immutable object collision')
        else:
            write_json(target, package)
        records.append(dict(id=package['id'], path=target.relative_to(folder).as_posix(),
                            sha256=sha256_file(target), integrity=package['integrity']))
        for dep in package['dependencies']:
            reverse.setdefault(dep['key'], []).append(package['id'])
    manifest = sealed(dict(schemaVersion=1, kind='private-evidence-release', publication='private',
                           recipePath=str(recipe_path), collections=records,
                           dependents={k: sorted(v) for k, v in sorted(reverse.items())}))
    write_json(folder / 'manifest.json', manifest)
    return dict(state='created', collections=len(entries), manifestIntegrity=manifest['integrity'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('build', 'check'))
    parser.add_argument('--recipe', type=Path)
    parser.add_argument('--folder', type=Path, required=True)
    args = parser.parse_args(); config = load()
    if args.action == 'build':
        if not args.recipe:
            parser.error('--recipe required')
        result = build(config, args.recipe, args.folder)
    else:
        result = check(config, args.folder)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.action == 'check' and not result['valid']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
