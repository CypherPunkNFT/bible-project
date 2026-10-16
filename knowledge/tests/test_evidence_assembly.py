"""Selective invalidation on disposable sources; never mutate the live corpus."""
import copy
import json
import sqlite3
from pathlib import Path

import pytest

from knowledge.evidence_collections import assemble as module
from knowledge.evidence_collections.capture import capture
from knowledge.evidence_collections.contract import sha256_file
from knowledge.settings import write_json
from knowledge.tests.test_evidence_collections import sample


@pytest.fixture
def assembly(sample, tmp_path, monkeypatch):
    cfg, spec, original = sample
    cfg['state_dir'] = tmp_path / 'KnowledgeBase'
    root = cfg['state_dir'] / 'library-knowledge'
    root.mkdir(parents=True)
    second = tmp_path / 'second.txt'; second.write_text('Second source original')
    with sqlite3.connect(cfg['db']) as db:
        meta = json.loads(db.execute('SELECT metadata FROM documents').fetchone()[0])
        meta['original_sha256'] = sha256_file(second)
        db.execute('INSERT INTO documents VALUES(?,?,?,?)', ('doc2', str(second), 'unknown', json.dumps(meta)))
        rows = db.execute('SELECT * FROM chunks').fetchall()
        db.executemany('INSERT INTO chunks VALUES(?,?,?,?,?,?)', [(r[0]+10, r[1]+'2', 'doc2', *r[3:]) for r in rows])
    captures = []
    for index in range(2):
        choice = copy.deepcopy(spec)
        choice['id'] = f'collection:test{index}'
        if index:
            choice['items'][0]['chunkId'] = 'chosen2'
        result = capture(cfg, choice)
        path = root / f'capture{index}.json'; write_json(path, result)
        captures.append(path)
    nodes = []
    for key, path in [('doc', original), ('doc2', second)]:
        nodes.append(dict(key=key, path=str(path), sha256=sha256_file(path), identity=dict(proofs=[]), resourceMatches=[]))
    cw = dict(nodes=nodes, duplicates=dict(workGroups=[dict(key=n['key'], members=[n['key']]) for n in nodes], policy='Keep editions'), reviewedRelations=[])
    cw_path = root / 'crosswalk.json'; write_json(cw_path, module.sealed(cw))
    use = dict(inputs=dict(crosswalkPath=str(cw_path)), reviewKind='ai-assisted', reviewDate='2026-10-12',
               publication='private', publicationSelected=False, policyEvidence=[dict(id='policy', note='Fixture only')],
               sourceReviews=[dict(node=n['key'], privateAnalysis=dict(decision='allowed'),
                                   uses=dict(quote=dict(decision='conditional', evidenceIds=['policy']))) for n in nodes])
    use_path = root / 'eligibility.json'; write_json(use_path, module.sealed(use))
    # Other modules have their own real fixtures; this isolates assembly behavior.
    monkeypatch.setattr(module, 'verify_crosswalk', lambda *a: dict(valid=True))
    monkeypatch.setattr(module, 'verify_eligibility', lambda *a: dict(valid=True))
    recipe = dict(schemaVersion=1, collections=[dict(id=f'collection:test{i}', capturePath=str(p),
                                                   crosswalkPath=str(cw_path), eligibilityPath=str(use_path)) for i,p in enumerate(captures)])
    recipe_path = root / 'recipe.json'; write_json(recipe_path, recipe)
    folder = root / 'release'
    return cfg, recipe_path, folder, original, second, cw_path, use_path


def states(cfg, folder):
    return {r['id']: r['state'] for r in module.check(cfg, folder)['collections']}


def test_stable_build_preserves_reviews_and_all_bytes(assembly):
    cfg, recipe, folder, *_ = assembly
    before = sha256_file(cfg['db'])
    first = module.build(cfg, recipe, folder)
    files = {p: (sha256_file(p),p.stat().st_mtime_ns) for p in folder.rglob('*.json')}
    second = module.build(cfg, recipe, folder)
    assert first['manifestIntegrity'] == second['manifestIntegrity']
    assert second['state'] == 'reused'
    assert files == {p: (sha256_file(p),p.stat().st_mtime_ns) for p in folder.rglob('*.json')}
    assert sha256_file(cfg['db']) == before
    manifest = module.read(folder / 'manifest.json')
    for entry in manifest['collections']:
        package = module.read(folder / entry['path'])
        original = module.one(module.read(recipe)['collections'], 'id', entry['id'])
        assert package['collection'] == module.read(original['capturePath'])
        assert package['publication'] == 'private'
        assert package['collection']['evidence'][0]['attribution']['role'] == 'reported-opposing-position'
    assert module.check(cfg, folder)['valid']


@pytest.mark.parametrize('target', ['original','chunk','metadata','neighbor','insert-neighbor','missing-chunk','missing-source'])
def test_source_changes_invalidate_only_affected_collection(assembly, target):
    cfg, recipe, folder, original, *_ = assembly
    module.build(cfg, recipe, folder)
    if target == 'original': original.write_text('Changed original')
    elif target == 'missing-source': original.unlink()
    else:
        with sqlite3.connect(cfg['db']) as db:
            if target == 'chunk': db.execute("UPDATE chunks SET text='Changed' WHERE id='chosen'")
            elif target == 'neighbor': db.execute("UPDATE chunks SET text='Changed context' WHERE id='after'")
            elif target == 'metadata': db.execute("UPDATE documents SET metadata='{}' WHERE id='doc'")
            elif target == 'missing-chunk': db.execute("DELETE FROM chunks WHERE id='chosen'")
            else:
                db.execute("UPDATE chunks SET rowid=4 WHERE id='after'")
                db.execute("INSERT INTO chunks VALUES(3,'inserted','doc','Title','Inserted context','part new')")
    assert states(cfg, folder) == {'collection:test0':'stale','collection:test1':'current'}
    with pytest.raises(ValueError, match='stale/invalid'): module.build(cfg, recipe, folder)


@pytest.mark.parametrize('target', ['crosswalk','use','recipe'])
def test_scoped_json_changes_do_not_invalidate_unrelated_collections(assembly, target):
    cfg, recipe, folder, _, _, cw, use = assembly
    module.build(cfg, recipe, folder)
    path = {'crosswalk':cw,'use':use,'recipe':recipe}[target]
    data = module.read(path)
    if target == 'crosswalk': data['nodes'][0]['reviewNote'] = 'Corrected source fact'
    elif target == 'use': data['sourceReviews'][0]['uses']['quote']['decision'] = 'denied'
    else: data['collections'][0]['selectionNote'] = 'Changed editorial selection'
    if target != 'recipe': data = module.sealed({k:v for k,v in data.items() if k!='integrity'})
    write_json(path, data)
    assert states(cfg, folder) == {'collection:test0':'stale','collection:test1':'current'}


def test_shared_build_and_policy_invalidate_dependents(assembly):
    cfg, recipe, folder, _, _, _, use = assembly
    module.build(cfg, recipe, folder)
    data = module.read(use); data['policyEvidence'][0]['note'] = 'Changed shared policy review'
    write_json(use, module.sealed({k:v for k,v in data.items() if k!='integrity'}))
    assert set(states(cfg, folder).values()) == {'stale'}
    with sqlite3.connect(cfg['db']) as db: db.execute("UPDATE meta SET value='next-build'")
    result = module.check(cfg, folder)
    assert all(any(d['descriptor']['kind']=='corpus-build' for d in r['changedDependencies']) for r in result['collections'])


def test_corrupt_object_is_invalid_and_historical_bytes_are_not_overwritten(assembly):
    cfg, recipe, folder, *_ = assembly
    module.build(cfg, recipe, folder)
    manifest = module.read(folder / 'manifest.json')
    path = folder / manifest['collections'][0]['path']; path.write_text('{}')
    assert states(cfg, folder) == {'collection:test0':'invalid','collection:test1':'current'}
    with pytest.raises(ValueError): module.build(cfg, recipe, folder)
    assert path.read_text() == '{}'


def test_failed_build_exposes_no_partial_manifest(assembly, monkeypatch):
    cfg, recipe, folder, *_ = assembly
    actual = module.assemble
    def fail_second(config, path, entry):
        if entry['id'].endswith('1'): raise ValueError('Deliberate failure')
        return actual(config, path, entry)
    monkeypatch.setattr(module, 'assemble', fail_second)
    with pytest.raises(ValueError, match='Deliberate'): module.build(cfg, recipe, folder)
    assert not (folder/'manifest.json').exists()
    assert not list(folder.rglob('*.json'))


def test_public_output_and_duplicate_recipe_rejected(assembly):
    cfg, recipe, folder, *_ = assembly
    with pytest.raises(ValueError, match='private|KnowledgeBase'): module.build(cfg, recipe, cfg['state_dir'].parent/'public')
    data = module.read(recipe); data['collections'].append(data['collections'][0]); write_json(recipe,data)
    with pytest.raises(ValueError, match='uniquely'): module.build(cfg, recipe, folder)


def test_new_release_reproduces_identical_objects_and_manifest(assembly):
    cfg, recipe, folder, *_ = assembly
    module.build(cfg,recipe,folder); other=folder.with_name('release-again')
    module.build(cfg,recipe,other)
    assert {p.relative_to(folder):sha256_file(p) for p in folder.rglob('*.json')} == {p.relative_to(other):sha256_file(p) for p in other.rglob('*.json')}


def test_unrelated_registry_record_does_not_change_evidence(assembly):
    cfg, recipe, folder, *_ = assembly
    module.build(cfg,recipe,folder)
    with sqlite3.connect(cfg['db']) as db: db.execute("INSERT INTO library_records VALUES('unrelated','work')")
    assert module.check(cfg,folder)['valid']


def test_retrieval_projection_ignores_timing_but_tracks_rank_and_review(assembly):
    cfg, _, folder, *_ = assembly
    path=folder.parent/'result.json'
    inputs={k:'fixture' for k in ('questionsSha256','snapshotManifest','queryVectorsSha256','implementationSha256','corpusBuild','vectorVersion','publication')}
    result=dict(id='H01',query='Question',lexical=dict(seconds=1,results=[dict(chunkId='one')]),hybrid=dict(seconds=2,results=[dict(chunkId='two')]))
    data=dict(inputs,results=[result]);write_json(path,data)
    descriptor=dict(kind='retrieval',path=str(path),id='H01')
    first=module.read_dependency(cfg,descriptor)
    data['results'][0]['hybrid']['seconds']=99;write_json(path,data)
    assert module.read_dependency(cfg,descriptor)==first
    data['results'][0]['hybrid']['results'][0]['chunkId']='different';write_json(path,data)
    assert module.read_dependency(cfg,descriptor)!=first


def test_source_change_during_assembly_is_rejected(assembly, monkeypatch):
    cfg, recipe, folder, original, *_ = assembly
    actual = module.dependency
    def change_before_hash(config, kind, **selector):
        if kind=='file' and selector['path']==str(original.resolve()):
            original.write_text('Changed while assembling')
        return actual(config,kind,**selector)
    monkeypatch.setattr(module,'dependency',change_before_hash)
    with pytest.raises(ValueError, match='changed during assembly'):module.build(cfg,recipe,folder)
    assert not (folder/'manifest.json').exists()


def test_reverse_dependencies_and_empty_manifest(assembly):
    cfg, recipe, folder, *_ = assembly
    module.build(cfg,recipe,folder)
    manifest=module.read(folder/'manifest.json')
    expected={}
    for record in manifest['collections']:
        package=module.read(folder/record['path'])
        for dep in package['dependencies']: expected.setdefault(dep['key'],[]).append(record['id'])
    assert manifest['dependents']=={k:sorted(v) for k,v in expected.items()}
    manifest['collections']=[]
    write_json(folder/'manifest.json',module.sealed({k:v for k,v in manifest.items() if k!='integrity'}))
    with pytest.raises(ValueError,match='manifest'):module.check(cfg,folder)
