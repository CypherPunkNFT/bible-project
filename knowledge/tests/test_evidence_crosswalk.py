"""Identity, duplicate and reader boundaries; all databases are disposable fixtures."""
import copy
import hashlib
import json
import sqlite3

import pytest

from knowledge.evidence_collections.capture import capture
from knowledge.evidence_collections.contract import sha256_file
from knowledge.evidence_collections.crosswalk import (
    build, catalogue_identity, duplicate_groups, reader_check, source_header, verify,
)
from knowledge.tests.test_evidence_collections import sample  # shared tiny corpus fixture


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value), encoding='utf-8')


def reader_fixture(tmp_path, sha='a'*64, **overrides):
    rid = 'held-' + sha[:32]
    record = dict(id=rid, sha256=sha, availability='permission-required', pages=0, pageBundles=[])
    record.update(overrides)
    shard = tmp_path/'records'/(hashlib.sha256(rid.encode()).hexdigest()[:2]+'.json')
    save(shard, {rid: record})
    return rid, record, shard


@pytest.fixture
def crosswalk_sample(sample, tmp_path):
    cfg, spec, source = sample
    cfg = dict(cfg, site_dir=tmp_path/'site', state_dir=tmp_path/'state')
    # Match the project's source-relative asset convention.
    original = tmp_path/'sources/source.txt'; original.parent.mkdir(); original.write_bytes(source.read_bytes())
    with sqlite3.connect(cfg['db']) as db:
        db.execute('UPDATE documents SET source=?', (str(original),))
    catalogue = cfg['site_dir']/'content/library/catalog'
    for kind, extra in [('work', {}), ('edition', {'workId':'work-test'}),
                        ('asset', {'editionId':'edition-test','sha256':sha256_file(original),'relativePath':'source.txt'})]:
        save(catalogue/(kind+'s')/(kind+'-test.json'), dict(id=kind+'-test', kind=kind, **extra))
    for filename in ('shared/acquired.ts', 'LibraryWorkPage.tsx'):
        path = cfg['site_dir']/'src/pages/teachers'/filename
        path.parent.mkdir(parents=True, exist_ok=True); path.write_text('fixture reader source')
    registry = cfg['state_dir']/'Research Foundation/registry.sqlite3'; registry.parent.mkdir(parents=True)
    with sqlite3.connect(registry) as db:
        db.execute('CREATE TABLE resources(id TEXT,path TEXT,sha256 TEXT,record TEXT)')
        db.execute('INSERT INTO resources VALUES(?,?,?,?)', ('resource:test',str(original),sha256_file(original),'{}'))
    reader_fixture(cfg['site_dir']/'public/content/teacher-library', sha=sha256_file(original))
    collection_path = tmp_path/'collection.json'; save(collection_path, capture(cfg, spec))
    spec_path = tmp_path/'crosswalk.spec.json'; save(spec_path, dict(schemaVersion=1,candidateResourceIds=[],reviewedRelations=[]))
    return cfg, collection_path, spec_path, original, registry


def test_crosswalk_is_reproducible_and_preserves_captures_and_databases(crosswalk_sample):
    cfg, collection, spec, _, registry = crosswalk_sample
    paths = [collection, cfg['db'], registry]; before = [sha256_file(p) for p in paths]
    result = build(cfg, [collection], spec)
    assert build(cfg, [collection], spec) == result
    assert verify(cfg, result)['valid']
    assert [sha256_file(p) for p in paths] == before
    assert result['counts']['selectedCanonicalChainsResolved'] == 1
    assert result['nodes'][0]['reader']['readingRoute'] is None
    assert result['publication'] == 'private'


@pytest.mark.parametrize('change', ['source','registry','catalogue','reader','spec','output'])
def test_selected_dependency_changes_invalidate_crosswalk(crosswalk_sample, change):
    cfg, collection, spec, original, registry = crosswalk_sample
    result = build(cfg, [collection], spec)
    if change == 'source': original.write_text('changed source')
    elif change == 'registry':
        with sqlite3.connect(registry) as db: db.execute("UPDATE resources SET record='changed'")
    elif change == 'catalogue':
        save(cfg['site_dir']/'content/library/catalog/works/work-test.json', dict(id='work-test',kind='work',title='Changed title'))
    elif change == 'reader':
        reader_fixture(cfg['site_dir']/'public/content/teacher-library',sha=sha256_file(original),availability='not-published')
    elif change == 'spec': save(spec, dict(schemaVersion=1,candidateResourceIds=['resource:absent']))
    else: result['nodes'][0]['reader']['readingRoute'] = '/invented'
    assert not verify(cfg, result)['valid']


def test_same_bytes_and_titles_never_merge_work_or_edition_identities():
    nodes = [dict(key=k, sha256='same', title='Same title', identity=dict(workId='work-'+k,editionId='edition-'+k)) for k in ('a','b')]
    groups = duplicate_groups(nodes, [])
    assert len(groups['byteGroups']) == 1
    assert len(groups['editionGroups']) == len(groups['workGroups']) == 2
    nodes[1]['sha256'] = 'different'
    reviewed = duplicate_groups(nodes, [dict(left='a',right='b')])
    assert len(reviewed['workGroups']) == 1
    assert len(reviewed['editionGroups']) == len(reviewed['byteGroups']) == 2


def test_unregistered_and_conflicting_canonical_identities(tmp_path):
    result = catalogue_identity(tmp_path, dict(workId='missing'))
    assert result['workId'] is None and result['status'] == 'deferred'
    path = tmp_path/'content/library/catalog/editions/edition-test.json'
    save(path, dict(id='edition-test',kind='edition',workId='another-work'))
    with pytest.raises(ValueError,match='chain conflicts'):
        catalogue_identity(tmp_path,dict(editionId='edition-test'))
    with pytest.raises(ValueError,match='Invalid catalogue'):
        catalogue_identity(tmp_path,dict(workId='../outside'))


@pytest.mark.parametrize('mode', ['missing','metadata','hash-mismatch','missing-page','empty-page','unsafe-bundle','corrupt-bundle'])
def test_catalogue_or_broken_body_is_never_a_readable_citation(tmp_path,mode):
    sha='a'*64
    if mode == 'missing': assert reader_check(tmp_path,sha)['readingRoute'] is None; return
    rid, record, shard = reader_fixture(tmp_path,availability='on-site-text',pages=1)
    if mode == 'metadata': record['availability']='permission-required'
    elif mode == 'hash-mismatch': record['sha256']='a'*32+'b'*32
    elif mode == 'empty-page': save(tmp_path/'text'/rid/'0.json',dict(blocks=[]))
    elif mode == 'unsafe-bundle': record['pageBundles']=['../../elsewhere.json']
    elif mode == 'corrupt-bundle':
        record['pageBundles']=['pages/'+'b'*64+'.json']
        save(tmp_path/record['pageBundles'][0],{rid+'/0':dict(blocks=[dict(text='actual text',locator='part 1')])})
    save(shard,{rid:record})
    result=reader_check(tmp_path,sha,'actual text')
    assert result['readingRoute'] is None and result['passageTarget'] is None


def test_readable_bundle_and_quote_location_do_not_invent_deep_link(tmp_path):
    sha='a'*64;rid, record, shard=reader_fixture(tmp_path,availability='on-site-text',pages=1)
    data=json.dumps({rid+'/0':dict(blocks=[dict(text='A source\n quotation.',locator='part 1')])}).encode()
    bundle='pages/'+hashlib.sha256(data).hexdigest()+'.json'
    file=tmp_path/bundle;file.parent.mkdir();file.write_bytes(data)
    record['pageBundles']=[bundle];save(shard,{rid:record})
    result=reader_check(tmp_path,sha,'source quotation.')
    assert result['status']=='readable-local-package' and result['passageStatus']=='located-no-deep-link'
    assert len(result['literalMatches'])==1
    assert result['readingRoute']=='/teachers/works/'+rid and result['passageTarget'] is None
    missing=reader_check(tmp_path,sha,'Not actually in this edition')
    assert missing['passageStatus']=='quote-not-found' and missing['literalMatches']==[]


def test_date_roles_and_editorial_statements_are_kept_separate(tmp_path):
    file=tmp_path/'source.xml'
    file.write_text('<ThML><ThML.head><generalInfo><firstPublished>1667</firstPublished></generalInfo><printSourceInfo><published>1826</published></printSourceInfo><electronicEdInfo><editorialComments>Compared editions</editorialComments><DC><DC.Date>2011-04-28</DC.Date></DC></electronicEdInfo></ThML.head></ThML>')
    fields={f['role']:f['text'] for f in source_header(file)['fields']}
    assert fields==dict(firstPublicationStatement='1667',printSourceStatement='1826',electronicDateStatement='2011-04-28',editorialStatement='Compared editions')


def test_relationship_requires_source_bound_review(crosswalk_sample):
    cfg, collection, spec, _, _ = crosswalk_sample
    save(spec,dict(schemaVersion=1,reviewedRelations=[dict(kind='same-work-different-edition')]))
    with pytest.raises(ValueError,match='scoped relationship review'):
        build(cfg,[collection],spec)
