"""Native completion gates and accepted identity-source refresh integration."""
import json
import pytest
from knowledge.finish_intake import drift_requires_refresh,require_parity
from knowledge.campaign_coordinator import metadata_matches
from knowledge.retrieval import library_ledger_paths


def parity():
    return {'complete':True,'corpus_build':'fixture','sqlite_integrity':'ok','embedding_identity_matches':True,
        'chunks':2,'vectors':2,'missing_vectors':0,'stale_vectors':0,'duplicate_vectors':0,'foreign_key_errors':0}


@pytest.mark.parametrize('field',['missing_vectors','stale_vectors','duplicate_vectors','foreign_key_errors'])
def test_partial_or_missing_parity_counters_cannot_complete(field):
    valid=parity();require_parity(valid)
    with pytest.raises(ValueError):require_parity(valid|{field:1})
    del valid[field]
    with pytest.raises(ValueError):require_parity(valid)


def test_integrity_and_identity_are_mandatory():
    for change in ({'complete':False},{'corpus_build':None},{'sqlite_integrity':'bad'},
                   {'embedding_identity_matches':False},{'chunks':0},{'vectors':1}):
        with pytest.raises(ValueError):require_parity(parity()|change)


def test_late_inputs_require_refresh_and_missing_drift_counters_are_rejected():
    keys=('new_library_files_since_snapshot','changed_library_ledgers_since_snapshot',
        'new_source_files_since_snapshot','changed_source_inputs_since_snapshot',
        'missing_library_files_since_snapshot','missing_source_inputs_since_snapshot')
    zero=dict.fromkeys(keys,0)
    assert not drift_requires_refresh(zero)
    for key in keys:assert drift_requires_refresh(zero|{key:1})
    with pytest.raises(ValueError):drift_requires_refresh({})


def test_hash_bound_fill_can_supersede_preserved_unregistered_legacy_id():
    sha='a'*64;row={'sha256':sha,'workId':'legacy'}
    hint={'workId':'work','legacyCatalogueIds':{'workId':'legacy'}}
    records={'work':{'kind':'work'}};fills={sha:{'fields':{'workId':'work'}}}
    assert metadata_matches(hint,row,'workId',records,fills)
    assert not metadata_matches(hint,row,'workId',records,{})
    assert not metadata_matches(hint,row|{'sha256':'b'*64},'workId',records,fills)
    assert not metadata_matches(hint|{'legacyCatalogueIds':{}},row,'workId',records,fills)
    assert not metadata_matches(hint,row,'workId',{'work':{'kind':'edition'}},fills)


def test_populated_canonical_or_credit_changes_are_not_silently_accepted():
    records={'work':{'kind':'work'},'other':{'kind':'work'}}
    assert not metadata_matches({'workId':'other'},{'workId':'work'},'workId',records)
    assert not metadata_matches({'credit':'changed'},{'credit':'original'},'credit',records)


def test_identity_source_is_part_of_ledger_currentness(tmp_path):
    root=tmp_path/'content/library';(root/'catalog').mkdir(parents=True);(root/'reports').mkdir()
    for file in (root/'catalog/work.json',root/'reports/acquired.json',root/'identity-corrections.json'):
        file.write_text(json.dumps({'fixture':True}),encoding='utf-8')
    paths=library_ledger_paths({'site_dir':tmp_path})
    assert set(paths)=={str(root/'catalog/work.json'),str(root/'reports/acquired.json'),str(root/'identity-corrections.json')}
    (root/'identity-corrections.json').unlink()
    assert len(library_ledger_paths({'site_dir':tmp_path}))==2


def test_later_source_reconciliation_is_preserved_without_holding_text():
    from knowledge.library_identity import apply_hints
    sha='a'*64;corrections={sha:{'fields':{'workId':'old-generic-work'}}}
    source={'sha256':sha,'workId':'specific-sermon','editionId':'sermon-edition',
        'title':'Love, Joy, Peace','credit':'Original credit','publicHostingAllowed':False,'manifests':set()}
    hints={'source.html':dict(source)};conflicts=[]
    apply_hints(hints,{},corrections,'identity-source.json',conflicts)
    assert hints['source.html']==source|{'identityFillConflict':conflicts[0]}
    assert conflicts[0]['proposedFill']=={'workId':'old-generic-work'}
    assert conflicts[0]['sourceIdentities']=={'workId':'specific-sermon','editionId':'sermon-edition'}
    with pytest.raises(ValueError):apply_hints({'source.html':dict(source)},{},corrections,'identity-source.json')


def test_launch_refuses_existing_completion_owner(tmp_path,monkeypatch):
    from knowledge.finish_intake import launch
    monkeypatch.setattr('knowledge.watchdog.inventory',lambda config:{'monitor':[123]})
    with pytest.raises(RuntimeError,match='existing completion'):launch({'state_dir':tmp_path},True)


def test_launcher_uses_native_module_without_shell(tmp_path,monkeypatch):
    from types import SimpleNamespace
    from knowledge.finish_intake import launch
    calls=[]
    monkeypatch.setattr('knowledge.watchdog.inventory',lambda config:{'monitor':[]})
    monkeypatch.setattr('knowledge.finish_intake.subprocess.Popen',lambda args,**kw:calls.append((args,kw)) or SimpleNamespace(pid=123))
    launch({'state_dir':tmp_path,'site_dir':tmp_path},True)
    args,kwargs=calls[0]
    assert args[-3:]==['-m','knowledge.finish_intake','--refresh']
    assert not kwargs.get('shell')
    assert not any('powershell' in str(value).lower() for value in args)


def test_failed_refresh_does_not_start_encoder_or_embedding(tmp_path,monkeypatch):
    from knowledge.finish_intake import Completion
    state=tmp_path/'state';state.mkdir();vectors=state/'saved-vectors';vectors.write_bytes(b'keep original vectors')
    (state/'knowledge.sqlite3').write_bytes(b'keep previous published snapshot')
    job=Completion({'state_dir':state,'site_dir':tmp_path})
    monkeypatch.setattr(job,'wait_existing',lambda:None)
    def failed():raise RuntimeError('fixture refresh failure')
    monkeypatch.setattr(job,'refresh',failed)
    monkeypatch.setattr(job,'encoder',lambda:pytest.fail('failed refresh must not start encoder'))
    monkeypatch.setattr(job,'command',lambda command:pytest.fail('failed refresh must not start embedding'))
    with pytest.raises(RuntimeError,match='fixture refresh'):job.run(True)
    assert vectors.read_bytes()==b'keep original vectors'
    assert (state/'knowledge.sqlite3').read_bytes()==b'keep previous published snapshot'
    assert json.loads((state/'intake-completion.json').read_text())['state']=='needs_attention'


def test_invalid_source_reference_keeps_body_and_other_valid_links(tmp_path):
    from knowledge.documents import TextContext,record
    from knowledge.store import SCHEMA,Writer,connect
    from knowledge.references import parse_reference
    catalog={'books':[{'num':43,'name':'John','code':'JHN'}]}
    value={'text':'Keep the complete source record','citations':[{'reference':'John 19:32-27'},{'reference':'John 19:32-37'}]}
    db=connect(tmp_path/'fixture.sqlite3');db.executescript(SCHEMA)
    writer=Writer(db,{'state_dir':tmp_path,'chunk_chars':1500})
    try:
        record(writer,TextContext(catalog),'fixture','Source',value,'authored_document',tmp_path/'source.json','keep credit')
        assert json.loads(db.execute('SELECT metadata FROM documents').fetchone()[0])==value
        assert 'John 19:32-27' in db.execute('SELECT text FROM chunks').fetchone()[0]
        assert [tuple(row) for row in db.execute('SELECT start,end FROM references_to')]==[(43019032,43019037)]
        assert writer.reference_rejections[0]['jsonPointer']=='/citations/0/reference'
        assert writer.reference_rejections[0]['literal']=='John 19:32-27'
        with pytest.raises(ValueError):parse_reference('John 19:32-27',catalog)
    finally:db.close()


def test_identity_ledger_is_recorded_once_by_library_owner(tmp_path,monkeypatch):
    from types import SimpleNamespace
    from knowledge.documents import import_authored
    from knowledge.library import import_library
    from knowledge.store import SCHEMA,Writer,connect
    from knowledge.library_identity import IDENTITY_FILE
    site=tmp_path/'Website';state=tmp_path/'state';sources=tmp_path/'sources'
    for folder in (site/'content/library/catalog/works',site/'content/library/reports',state,sources/'library'):
        folder.mkdir(parents=True)
    (site/'content/library/catalog/works/w.json').write_text(json.dumps({'id':'w','kind':'work','title':'Work'}))
    (site/'content/library/reports/source.json').write_text(json.dumps({'files':[]}))
    (site/IDENTITY_FILE).write_text(json.dumps({'schemaVersion':1,'records':[{'sha256':'a'*64,'fields':{'workId':'w'}}]}))
    (site/'content/note.json').write_text(json.dumps({'text':'An authored note'}))
    monkeypatch.setattr('knowledge.documents.subprocess.run',lambda *a,**kw:SimpleNamespace(stdout='{}'))
    cfg={'site_dir':site,'state_dir':state,'sources_dir':sources,'chunk_chars':1500}
    db=connect(state/'fixture.sqlite3');db.executescript(SCHEMA);writer=Writer(db,cfg)
    try:
        import_authored(writer,{'books':[]})
        assert not db.execute('SELECT 1 FROM files WHERE path=?',(str((site/IDENTITY_FILE).resolve()),)).fetchone()
        import_library(writer)
        assert db.execute('SELECT status FROM files WHERE path=?',(str((site/IDENTITY_FILE).resolve()),)).fetchone()[0]=='library_metadata'
        recorded={r[0] for r in db.execute("SELECT path FROM files WHERE status='library_metadata'")}
        assert recorded==set(library_ledger_paths(cfg))
        assert not db.execute("SELECT 1 FROM documents WHERE id LIKE '%identity-corrections%'").fetchone()
    finally:db.close()
