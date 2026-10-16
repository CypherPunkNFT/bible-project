"""Evidence boundaries on tiny fixtures; no use of the live corpus or vectors."""
import copy
import json
import sqlite3

import pytest
from jsonschema import Draft202012Validator, ValidationError

from knowledge.evidence_collections.capture import capture, verify
from knowledge.evidence_collections.contract import public_projection, schema, seal, sha256_file, validate
from knowledge.store import digest


@pytest.fixture
def sample(tmp_path):
    source=tmp_path/'source.txt';source.write_text('Original source fixture.')
    cfg={'db':tmp_path/'corpus.sqlite3'}
    text='The author reports: Others say works earn salvation. He rejects that claim.'
    meta={'original_sha256':sha256_file(source),'acquisition':{'author':'Fixture Author','url':'https://example.org/source'},
          'work':{'id':'work-test','creators':[{'authorId':'author-test','role':'author'}]},
          'edition':{'id':'edition-test'},'asset':{'id':'asset-test','sourceId':'source-test'}}
    with sqlite3.connect(cfg['db']) as db:
        db.executescript('CREATE TABLE meta(key TEXT,value TEXT);'
                        'CREATE TABLE documents(id TEXT,source TEXT,licence TEXT,metadata TEXT);'
                        'CREATE TABLE chunks(rowid INTEGER PRIMARY KEY,id TEXT,document_id TEXT,title TEXT,text TEXT,locator TEXT);'
                        'CREATE TABLE library_records(id TEXT,kind TEXT);')
        db.execute('INSERT INTO meta VALUES(?,?)',('built_at','fixture-build'))
        db.execute('INSERT INTO documents VALUES(?,?,?,?)',('doc',str(source),'unknown',json.dumps(meta)))
        db.executemany('INSERT INTO library_records VALUES(?,?)',[(k+'-test',k) for k in ('work','edition','asset')])
        db.executemany('INSERT INTO chunks VALUES(?,?,?,?,?,?)',[(1,'before','doc','Title','Previous context.','part 1'),(2,'chosen','doc','Title',text,'part 2'),(3,'after','doc','Title','Following context.','part 3')])
    quote='Others say works earn salvation.';start=text.index(quote)
    spec=dict(id='collection:fixture',title='Fixture',question='What is attributed to others?',language='en',audience=['test'],scope='Fixture only',topicIds=[],corpusBuild='fixture-build',reviewDate='2026-10-11',items=[dict(chunkId='chosen',expectedChunkSha256=digest(text),start=start,end=start+len(quote),speakerLabel='Others as reported by the author',role='reported-opposing-position',basis='reported-position',attributionEvidence='Source expressly says Others and rejects the claim.',claim='The author reports and rejects this position.',reviewScope='Synthetic fixture, no actual theological finding',limits=['Reported position, not author endorsement.'])])
    return cfg,spec,source


def test_schema_capture_reproducible_and_readonly(sample):
    cfg,spec,_=sample
    Draft202012Validator.check_schema(schema())
    before=sha256_file(cfg['db']);first=capture(cfg,spec);second=capture(cfg,spec)
    assert first==second
    assert sha256_file(cfg['db'])==before
    assert verify(cfg,first)['valid']
    item=first['evidence'][0]
    assert len(item['citation']['private']['neighbors'])==2
    assert item['identity']['editionId']=='edition-test'
    assert item['attribution']['speakerId'] is None
    assert public_projection(first) is None


def test_unknown_identity_and_dates_are_not_invented(sample):
    cfg,spec,_=sample
    with sqlite3.connect(cfg['db']) as db:
        m=json.loads(db.execute('SELECT metadata FROM documents').fetchone()[0])
        for k in ('work','edition','asset'):m.pop(k)
        db.execute('UPDATE documents SET metadata=?',(json.dumps(m),))
    c=capture(cfg,spec);item=c['evidence'][0]
    assert item['identity']['workId'] is None
    assert item['citation']['sourceId']=='doc'
    assert item['citation']['dates']['editionPublication'] is None
    assert c['coverage']['unresolvedWorkDocuments']==1


def test_distinct_claims_share_evidence_without_sharing_claim_identity(sample):
    cfg,spec,_=sample;first=capture(cfg,spec)
    other=copy.deepcopy(spec);other['items'][0]['claim']='A different editorial claim about this span.'
    second=capture(cfg,other)
    assert first['evidence'][0]['id']==second['evidence'][0]['id']
    assert first['evidence'][0]['citation']['claimId']!=second['evidence'][0]['citation']['claimId']


@pytest.mark.parametrize('target',['source','metadata','chunk','neighbor','build'])
def test_changed_dependencies_mark_stale(sample,target):
    cfg,spec,source=sample;c=capture(cfg,spec)
    if target=='source':source.write_text('changed source')
    else:
        with sqlite3.connect(cfg['db']) as db:
            if target=='metadata':db.execute("UPDATE documents SET metadata='{}'")
            elif target=='chunk':db.execute("UPDATE chunks SET text='Changed' WHERE id='chosen'")
            elif target=='neighbor':db.execute("UPDATE chunks SET text='Changed' WHERE id='after'")
            else:db.execute("UPDATE meta SET value='new-build'")
    assert not verify(cfg,c)['valid']


def test_attribution_edit_invalidates_review(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    c['evidence'][0]['attribution']['speakerLabel']='A different speaker'
    with pytest.raises(ValueError,match='review'):validate(c)


def test_opponent_cannot_be_marked_as_literal_author_statement(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    c['evidence'][0]['basis']='literal-quotation'
    with pytest.raises(ValueError,match='endorsement'):validate(seal(c))


def test_context_tampering_rejected_even_after_reseal(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    c['evidence'][0]['citation']['private']['neighbors'][0]['text']='Invented context'
    with pytest.raises(ValueError,match='context'):validate(seal(c))


def test_quote_tampering_rejected(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    c['evidence'][0]['citation']['quote']='Invented quotation'
    with pytest.raises(ValueError,match='quotation'):validate(seal(c))


def test_duplicate_evidence_and_forged_canonical_identity(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    duplicate=copy.deepcopy(c);duplicate['evidence'].append(copy.deepcopy(duplicate['evidence'][0]))
    with pytest.raises(ValueError,match='Duplicate'):validate(seal(duplicate))
    c['evidence'][0]['identity']['workId']='work-invented'
    assert not verify(cfg,seal(c))['valid']


def test_external_reader_and_publication_rejected(sample):
    cfg,spec,_=sample;c=capture(cfg,spec)
    c['evidence'][0]['reader']={'status':'verified-on-site','route':'https://example.org/read'}
    with pytest.raises(ValueError,match='on-site'):validate(seal(c))
    c=capture(cfg,spec);c['publication']='published'
    with pytest.raises(ValidationError):public_projection(seal(c))


def test_wrong_span_hash_or_source_never_capture(sample):
    cfg,spec,source=sample
    bad=copy.deepcopy(spec);bad['items'][0]['end']=100000
    with pytest.raises(ValueError,match='Span'):capture(cfg,bad)
    bad=copy.deepcopy(spec);bad['items'][0]['expectedChunkSha256']='0'*64
    with pytest.raises(ValueError,match='chunk changed'):capture(cfg,bad)
    source.write_text('changed')
    with pytest.raises(ValueError,match='Original'):capture(cfg,spec)
