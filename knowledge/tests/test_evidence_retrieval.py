import json
import sqlite3

import numpy as np
import pytest

from knowledge.evidence_collections.contract import sha256_file
from knowledge.evidence_collections.retrieve import (
    Retriever, lexical_expression, load_snapshot, rank, reference_candidates,
)
from knowledge.settings import write_json


def row(key, doc='doc', text=None, **extra):
    return dict(id=key,document_id=doc,title='Fixture',text=text or key,locator='part '+key,
                kind='library',edition='',book='',chapter=0,verse_start=0,verse_end=0,**extra)


def test_work_diversity_and_duplicate_body_preserve_edition():
    rows={k:row(k,doc=d,text=t) for k,d,t in [('a','edition-a','Same text'),('b','edition-b','Same  text'),('c','edition-b','Different text'),('d','edition-a','Third text'),('e','other','Another work')]}
    result=rank({'lexical':[{'id':k} for k in rows]},rows,{'edition-a':'work','edition-b':'work'})
    assert [r['chunkId'] for r in result]==['a','c','e']
    assert result[1]['documentId']=='edition-b'


def test_unknown_works_not_merged_and_ties_stable():
    rows={k:row(k,doc=k) for k in ('a','b','c')}
    channels={'lexical':[{'id':'a'},{'id':'b'}],'semantic':[{'id':'b'},{'id':'a'}]}
    result=rank(channels,rows,{})
    assert [r['chunkId'] for r in result]==['a','b']
    assert len(result[0]['channels'])==2


def test_reference_channel_keeps_document_association_distinct():
    catalog={'books':[{'name':'Romans','code':'ROM','num':45}]}
    bible=row('bible');bible.update(kind='bible',edition='kjv',book='ROM',chapter=8,verse_start=13,verse_end=24)
    other=row('guide','guide');irrelevant=row('wrong')
    refs=[dict(document_id='guide',edition='kjv',start=45008015,end=45008017)]
    results=reference_candidates([bible,other,irrelevant],refs,catalog,'Romans 8:15-17')
    assert results==[dict(id='bible',referenceKind='exact-verse-overlap'),dict(id='guide',referenceKind='document-association-only')]
    assert reference_candidates([bible],refs,catalog,'Not a reference')==[]
    with pytest.raises(ValueError):reference_candidates([bible],refs,catalog,'Romans 8:17-15')
    note=dict(bible,id='note',locator='8:15:note:0')
    assert reference_candidates([note],[],catalog,'Romans 8:15')[0]['referenceKind']=='verse-annotation-association'


def test_lexical_tokens_cannot_inject_fts_operators():
    assert lexical_expression('the and is')==''
    expression=lexical_expression('faith OR grace* -"works"')
    assert '*' not in expression and '-' not in expression
    assert '"faith"' in expression and '"works"' in expression


@pytest.fixture
def engine(tmp_path):
    db_path=tmp_path/'corpus.sqlite3'
    with sqlite3.connect(db_path) as db:
        db.executescript('CREATE TABLE meta(key TEXT,value TEXT); CREATE TABLE chunks(rowid INTEGER PRIMARY KEY,id TEXT,document_id TEXT,title TEXT,search_text TEXT); CREATE INDEX chunks_doc ON chunks(document_id); CREATE VIRTUAL TABLE chunks_fts USING fts5(title,search_text,content=chunks,content_rowid=rowid);')
        db.execute("INSERT INTO meta VALUES('built_at','v1')")
        db.executemany('INSERT INTO chunks VALUES(?,?,?,?,?)',[(1,'a','doc','Fixture','grace assurance'),(2,'b','doc','Fixture','faith hope'),(3,'c','other','Fixture','unrelated')])
        db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
    rows=[row('a',text='grace assurance'),row('b',text='faith hope'),row('c','other',text='unrelated')]
    model=dict(model='fixture',revision='fixture',dimensions=2,max_tokens=10)
    snapshot=dict(chunks=rows,documents=['doc','other'],corpusBuild='v1',vectorModel=model,catalog={'books':[]},references=[],workGroups={})
    write_json(tmp_path/'snapshot.json',snapshot);write_json(tmp_path/'questions.frozen.json',{})
    np.savez_compressed(tmp_path/'selected-vectors.npz',ids=np.array(['a','b']),vectors=np.array([[1.,0.],[0.,1.]],dtype=np.float32))
    manifest=dict(snapshotSha256=sha256_file(tmp_path/'snapshot.json'),vectorsSha256=sha256_file(tmp_path/'selected-vectors.npz'),questionsSha256=sha256_file(tmp_path/'questions.frozen.json'))
    write_json(tmp_path/'snapshot-manifest.json',manifest)
    write_json(tmp_path/'query-vectors.json',dict(model=model,questionsSha256=manifest['questionsSha256'],queries=[dict(query='grace',vector=[1.,0.])]))
    return {'db':db_path},tmp_path


def test_readonly_search_context_and_partial_vectors(engine):
    config,folder=engine;before=sha256_file(config['db']);retriever=Retriever(config,folder)
    result=retriever.search('grace')
    assert result['results'][0]['chunkId']=='a'
    assert result['results'][0]['context'][0]['chunkId']=='b'
    assert all(c['documentId']==r['documentId'] for r in result['results'] for c in r['context'])
    assert sha256_file(config['db'])==before
    assert retriever.search('unrelated','lexical')['results'][0]['chunkId']=='c'
    assert all(r['publication']=='private' for r in result['results'])


@pytest.mark.parametrize('failure',['snapshot','queries','build','query-value'])
def test_changed_inputs_and_invalid_vectors_fail_closed(engine,failure):
    cfg,folder=engine
    if failure=='snapshot':
        (folder/'snapshot.json').write_text('{}')
        with pytest.raises(ValueError,match='dependency'):load_snapshot(folder)
        return
    if failure in ('queries','query-value'):
        path=folder/'query-vectors.json';data=json.loads(path.read_text())
        if failure=='queries':data['model']['revision']='different'
        else:data['queries'][0]['vector']=[float('nan'),0]
        write_json(path,data)
    else:
        with sqlite3.connect(cfg['db']) as db:db.execute("UPDATE meta SET value='v2'")
    with pytest.raises(ValueError):Retriever(cfg,folder).search('grace')


def test_unprepared_query_never_silently_calls_an_encoder(engine):
    cfg,folder=engine
    with pytest.raises(ValueError,match='frozen'):Retriever(cfg,folder).search('a brand new query')
