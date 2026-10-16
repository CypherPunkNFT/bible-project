"""Use decisions cannot silently become publication or leak captured source bodies."""
import copy
import json
import sqlite3

import pytest

from knowledge.evidence_collections.capture import capture
from knowledge.evidence_collections.contract import sha256_file
from knowledge.evidence_collections.crosswalk import build as crosswalk_build
from knowledge.evidence_collections.eligibility import ACTIONS, build, metadata_preview, verify
from knowledge.tests.test_evidence_crosswalk import crosswalk_sample, reader_fixture, sample, save


@pytest.fixture
def usage_sample(crosswalk_sample, sample, tmp_path):
    cfg, collection, crosswalk_spec, original, registry = crosswalk_sample
    original.write_text('<ThML><ThML.head><electronicEdInfo><DC><DC.Title>Fixture title</DC.Title><DC.Creator scheme="short-form">Fixture Author</DC.Creator></DC></electronicEdInfo></ThML.head><ThML.body>PRIVATE BODY NEVER EXPORTED</ThML.body></ThML>')
    sha = sha256_file(original)
    with sqlite3.connect(cfg['db']) as db:
        meta = json.loads(db.execute('SELECT metadata FROM documents').fetchone()[0])
        meta['original_sha256'] = sha
        db.execute('UPDATE documents SET metadata=?', (json.dumps(meta),))
    with sqlite3.connect(registry) as db: db.execute('UPDATE resources SET sha256=?', (sha,))
    asset = cfg['site_dir']/'content/library/catalog/assets/asset-test.json'
    record = json.loads(asset.read_text()); record['sha256'] = sha; save(asset, record)
    reader_fixture(cfg['site_dir']/'public/content/teacher-library', sha=sha)
    save(collection, capture(cfg, sample[1]))
    crosswalk = tmp_path/'crosswalk.json'; save(crosswalk, crosswalk_build(cfg, [collection], crosswalk_spec))
    uses = {a:dict(decision='allowed',scope='Synthetic fixture only',basis='PRIVATE POLICY NOTES',evidenceIds=['fixture'],conditions=[]) for a in ACTIONS}
    spec = dict(schemaVersion=1,reviewKind='ai-assisted',reviewDate='2026-10-11',publicationSelected=False,
                evidence=[dict(id='fixture',url='https://example.org/policy',checkedOn='2026-10-11',summary='Synthetic fixture; no actual rights finding.')],
                sources=[dict(node='doc',sourceSha256=sha,sourceUrl='https://example.org/source',credit='Fixture Author',
                              privateAnalysis=dict(decision='allowed',basis='Private fixture use authorized'),uses=uses,
                              limits=['Fixture only'],sourceAssertions=[])])
    spec_path = tmp_path/'uses.spec.json'; save(spec_path, spec)
    return cfg, crosswalk, spec_path, collection, registry


def change_spec(path, modify):
    spec = json.loads(path.read_text()); modify(spec); save(path, spec)


def test_reproducible_readonly_and_metadata_allowlist(usage_sample):
    cfg, crosswalk, spec, collection, registry = usage_sample
    inputs = [crosswalk, collection, cfg['db'], registry]
    before = [sha256_file(p) for p in inputs]
    first = build(cfg, crosswalk, spec)
    assert build(cfg, crosswalk, spec) == first and verify(cfg, first)['valid']
    preview = metadata_preview(cfg, first)
    serialized = json.dumps(preview)
    for forbidden in ('PRIVATE BODY','PRIVATE POLICY','privateAnalysis','sourceSha256','fullTextIndexed','neighbors','claimId','sourcePath','D:\\'):
        assert forbidden not in serialized
    assert set(preview['records'][0]) == {'recordId','title','authors','sourceUrl','credit','workId','editionId','catalogueRoute','useDecisions'}
    assert not preview['published'] and first['counts']['publicOutputsWritten'] == 0
    assert [sha256_file(p) for p in inputs] == before


def test_allowed_rights_do_not_resolve_reader_or_content_review(usage_sample):
    cfg, crosswalk, spec, _, _ = usage_sample
    result = build(cfg, crosswalk, spec); row = result['sourceReviews'][0]
    assert row['readiness']['quote']['rightsAllowed']
    assert not row['readiness']['quote']['preparationReady']
    assert 'exact-edition-reading-copy-unavailable' in row['readiness']['quote']['blockers']
    for action in ACTIONS:
        assert not row['readiness'][action]['publicationSelected'] and not row['readiness'][action]['published']
    assert row['readiness']['metadata']['preparationReady']
    assert 'output-specific-review-pending' in row['readiness']['editorial']['blockers']


@pytest.mark.parametrize('decision', ['conditional','denied','unknown'])
def test_public_deferral_never_blocks_private_analysis(usage_sample, decision):
    cfg, crosswalk, spec, _, _ = usage_sample
    def edit(value):
        for use in value['sources'][0]['uses'].values():
            use.update(decision=decision,conditions=['Unresolved fixture condition'] if decision=='conditional' else [])
    change_spec(spec,edit); result=build(cfg,crosswalk,spec)
    assert result['counts']['privateAnalysisAllowed']==1
    assert metadata_preview(cfg,result)['records']==[]
    assert all(not g['rightsAllowed'] for g in result['sourceReviews'][0]['readiness'].values())


@pytest.mark.parametrize('mutation', ['missing-action','wrong-hash','unknown-evidence','unsatisfied-allowed','conditional-no-condition','duplicate-source','publication','private-hold','local-path-credit'])
def test_invalid_or_unsafe_decisions_rejected(usage_sample,mutation):
    cfg,crosswalk,spec,_,_=usage_sample
    def edit(value):
        row=value['sources'][0]
        if mutation=='missing-action':row['uses'].pop('translation')
        elif mutation=='wrong-hash':row['sourceSha256']='0'*64
        elif mutation=='unknown-evidence':row['uses']['quote']['evidenceIds']=['missing']
        elif mutation=='unsatisfied-allowed':row['uses']['quote']['conditions']=['Not yet met']
        elif mutation=='conditional-no-condition':row['uses']['quote']['decision']='conditional'
        elif mutation=='duplicate-source':value['sources'].append(copy.deepcopy(row))
        elif mutation=='publication':value['publicationSelected']=True
        elif mutation=='private-hold':row['privateAnalysis']['decision']='denied'
        else:row['credit']='Credit contains D:/private/secret.txt'
    change_spec(spec,edit)
    with pytest.raises(ValueError):build(cfg,crosswalk,spec)


@pytest.mark.parametrize('dependency', ['decision','spec','crosswalk','original'])
def test_changed_review_or_source_blocks_preview(usage_sample, dependency):
    cfg,crosswalk,spec,_,registry=usage_sample; result=build(cfg,crosswalk,spec)
    if dependency=='decision':result['sourceReviews'][0]['uses']['quote']['decision']='denied'
    elif dependency=='spec':change_spec(spec,lambda v:v.update(reviewDate='2026-10-12'))
    elif dependency=='crosswalk':
        value=json.loads(crosswalk.read_text());value['counts']['selectedDocuments']=100;save(crosswalk,value)
    else:
        with sqlite3.connect(registry) as db:source=db.execute('SELECT path FROM resources').fetchone()[0]
        from pathlib import Path
        Path(source).write_text('Changed original')
    assert not verify(cfg,result)['valid']
    with pytest.raises(ValueError,match='Stale'):metadata_preview(cfg,result)


def test_exact_license_assertion_is_required_to_match(usage_sample):
    cfg,crosswalk,spec,_,_=usage_sample
    change_spec(spec,lambda v:v['sources'][0].update(sourceAssertions=[dict(xpath='./ThML.head/electronicEdInfo/DC/DC.Title',textFingerprint='0'*64)]))
    with pytest.raises(ValueError,match='rights assertion changed'):build(cfg,crosswalk,spec)


def test_other_permissions_do_not_override_metadata_decision(usage_sample):
    cfg,crosswalk,spec,_,_=usage_sample
    change_spec(spec,lambda v:v['sources'][0]['uses']['metadata'].update(decision='denied'))
    result=build(cfg,crosswalk,spec)
    assert metadata_preview(cfg,result)['records']==[]
    for action in ('quote','fullText','translation','editorial'):
        gate=result['sourceReviews'][0]['readiness'][action]
        assert gate['rightsAllowed'] and not gate['preparationReady']
        assert 'source-metadata-use-not-cleared' in gate['blockers']
