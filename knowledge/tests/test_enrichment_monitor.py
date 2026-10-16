"""Graph-only recovery and fail-closed completion gates, on isolated fixtures."""
import json
import sqlite3
from pathlib import Path

import pytest

from knowledge.enrichment import lifecycle as life
from knowledge.enrichment.core import checksum, writer_lock
from knowledge.settings import write_json


class EndPoll(BaseException):
    pass


def config(tmp_path):
    return {'state_dir': tmp_path, 'db': tmp_path / 'corpus.sqlite3'}


def test_read_recovers_from_temporary_windows_access(tmp_path, monkeypatch):
    path=tmp_path/'progress.json'; path.write_text('{"state":"running"}')
    original=Path.read_text; attempts=[]
    def flaky(self,*args,**kwargs):
        attempts.append(True)
        if len(attempts)<3: raise PermissionError('sharing collision')
        return original(self,*args,**kwargs)
    monkeypatch.setattr(Path,'read_text',flaky)
    monkeypatch.setattr(life.time,'sleep',lambda _:None)
    assert life.read(path)['state']=='running'
    assert len(attempts)==3


def test_read_access_budget_and_invalid_json(tmp_path, monkeypatch):
    path=tmp_path/'progress.json'; path.write_text('{')
    with pytest.raises(json.JSONDecodeError): life.read(path,{})
    attempts=[]
    def denied(*args,**kwargs):
        attempts.append(True); raise PermissionError('denied')
    monkeypatch.setattr(Path,'read_text',denied)
    monkeypatch.setattr(life.time,'sleep',lambda _:None)
    with pytest.raises(PermissionError): life.read(path,{})
    assert len(attempts)==6


def test_monitor_recovers_next_poll_without_opening_corpus(tmp_path, monkeypatch):
    cfg=config(tmp_path); attempts=[]; states=[]
    def gate(_):
        attempts.append(True)
        if len(attempts)==1: raise PermissionError('temporary status lock')
        return {'ready':False,'reasons':['embedding incomplete'],'corpusBuild':None}
    monkeypatch.setattr(life,'production_gate',gate)
    monkeypatch.setattr(life,'report',lambda *args:None)
    def sleep(_):
        states.append(life.read(tmp_path/'graph-development/monitor-state.json'))
        if len(states)==2: raise EndPoll()
    monkeypatch.setattr(life.time,'sleep',sleep)
    with pytest.raises(EndPoll): life.monitor(cfg)
    assert states[0]['state']=='retrying_status_access'
    assert states[0]['gate']['ready'] is False
    assert states[1]['state']=='waiting_for_verified_intake'
    assert 'error' not in states[1]
    assert states[1]['consecutiveAccessFailures']==0
    assert not cfg['db'].exists()


def test_monitor_persistent_access_stops_at_ten_polls(tmp_path, monkeypatch):
    calls=[]
    def gate(_):
        calls.append(True); raise PermissionError('persistent denial')
    monkeypatch.setattr(life,'production_gate',gate)
    monkeypatch.setattr(life.time,'sleep',lambda _:None)
    monkeypatch.setattr(life,'report',lambda *args:pytest.fail('Error handling must not reread status'))
    life.monitor(config(tmp_path))
    status=life.read(tmp_path/'graph-development/monitor-state.json')
    assert len(calls)==10
    assert status['state']=='needs_attention'
    assert status['gate']['ready'] is False


def test_monitor_malformed_status_stops_without_retry(tmp_path,monkeypatch):
    write_json(tmp_path/'campaign-coordination/summary.json',{'state':'pending'})
    (tmp_path/'embedding-progress.json').write_text('{')
    monkeypatch.setattr(life.time,'sleep',lambda _:pytest.fail('Invalid JSON must not loop'))
    life.monitor(config(tmp_path))
    status=life.read(tmp_path/'graph-development/monitor-state.json')
    assert status['state']=='needs_attention'
    assert status['gate']['ready'] is False


def test_duplicate_monitor_cannot_replace_owner_state(tmp_path):
    path=tmp_path/'graph-development/monitor-state.json'
    write_json(path,{'pid':123,'state':'waiting_for_verified_intake'})
    before=path.read_bytes()
    with writer_lock(tmp_path,'monitor.lock'):
        with pytest.raises(OSError): life.monitor(config(tmp_path))
    assert path.read_bytes()==before


def test_cancel_remains_graph_only(tmp_path,monkeypatch):
    path=tmp_path/'graph-development';path.mkdir()
    (path/'cancel.request').write_text('cancel')
    monkeypatch.setattr(life,'production_gate',lambda _:pytest.fail('Cancelled before gate'))
    life.monitor(config(tmp_path))
    assert life.read(path/'monitor-state.json')['state']=='cancelled'


def ready_fixture(tmp_path):
    cfg=config(tmp_path);coord=tmp_path/'campaign-coordination'
    source=tmp_path/'source.md';source.write_text('source evidence')
    verify=dict(complete=True,enrichment_ready=True,corpus_build='build-1',
                sqlite_integrity='ok',embedding_identity_matches=True,chunks=3,vectors=3)
    for key in ('missing_vectors','stale_vectors','duplicate_vectors','foreign_key_errors',
                'missing_library_files_since_snapshot','new_library_files_since_snapshot',
                'changed_library_ledgers_since_snapshot','new_source_files_since_snapshot',
                'changed_source_inputs_since_snapshot','missing_source_inputs_since_snapshot'):
        verify[key]=0
    write_json(coord/'summary.json',{'state':'verified_complete'})
    write_json(tmp_path/'intake-completion.json',{'state':'complete','verification':verify})
    write_json(tmp_path/'embedding-progress.json',{'state':'complete','remaining':0,'corpus_build':'build-1'})
    write_json(coord/'published-handoffs.json',{'preparationPublished':True,'conflicts':[],'explicitTextDeferrals':[]})
    write_json(coord/'intake-plan.json',{'inputs':[{'path':str(source),'sha256':checksum(source)}]})
    with sqlite3.connect(cfg['db']) as db:
        db.executescript('CREATE TABLE meta(key TEXT,value TEXT); CREATE TABLE files(path TEXT,sha256 TEXT);'
                        'CREATE TABLE library_files(path TEXT,status TEXT,sha256 TEXT); CREATE TABLE documents(id TEXT);')
        db.execute('INSERT INTO meta VALUES(?,?)',('built_at','build-1'))
        db.execute('INSERT INTO files VALUES(?,?)',(str(source),checksum(source)))
    return cfg,verify,source


def test_gate_verifies_actual_build_and_source_hash(tmp_path):
    cfg,_,source=ready_fixture(tmp_path)
    assert life.production_gate(cfg)['ready'] is True
    source.write_text('changed')
    assert life.production_gate(cfg)['ready'] is False
    source.write_text('source evidence')
    with sqlite3.connect(cfg['db']) as db:db.execute("UPDATE meta SET value='different'")
    assert life.production_gate(cfg)['ready'] is False


@pytest.mark.parametrize('field',['missing_vectors','new_source_files_since_snapshot','chunks','corpus_build'])
def test_gate_missing_completion_fields_never_open_database(tmp_path,monkeypatch,field):
    cfg,verify,_=ready_fixture(tmp_path);verify.pop(field)
    write_json(tmp_path/'intake-completion.json',{'state':'complete','verification':verify})
    monkeypatch.setattr(life,'readonly',lambda _:pytest.fail('Incomplete gate must not open DB'))
    assert life.production_gate(cfg)['ready'] is False


def test_gate_requires_preparation_plan(tmp_path):
    cfg,_,_=ready_fixture(tmp_path)
    (tmp_path/'campaign-coordination/intake-plan.json').unlink()
    assert life.production_gate(cfg)['ready'] is False


def test_monitor_full_transition_order_and_no_retry_after_extraction_failure(tmp_path,monkeypatch):
    from knowledge.enrichment import snapshot,runner,validation
    cfg=config(tmp_path);events=[]
    write_json(tmp_path/'graph-development/quality-policy.json',{'reviewComplete':True})
    monkeypatch.setattr(life,'production_gate',lambda _:dict(ready=True,corpusBuild='build-1'))
    monkeypatch.setattr(snapshot,'capture',lambda _:(events.append('snapshot') or {'corpusBuild':'build-1'}))
    monkeypatch.setattr(life,'independent_parity',lambda *args:events.append('parity'))
    def execute(*args):
        events.append('execute');raise PermissionError('graph output unavailable')
    monkeypatch.setattr(runner,'execute',execute)
    monkeypatch.setattr(validation,'validate',lambda *args:pytest.fail('Failed extraction cannot validate'))
    monkeypatch.setattr(life.time,'sleep',lambda _:pytest.fail('Never blindly retry extraction'))
    life.monitor(cfg)
    assert events==['snapshot','parity','execute']
    assert life.read(tmp_path/'graph-development/monitor-state.json')['state']=='needs_attention'


def test_monitor_full_success_publishes_only_after_validation(tmp_path,monkeypatch):
    from knowledge.enrichment import snapshot,runner,validation
    events=[];cfg=config(tmp_path)
    write_json(tmp_path/'graph-development/quality-policy.json',{'reviewComplete':True})
    monkeypatch.setattr(life,'production_gate',lambda _:dict(ready=True,corpusBuild='build-1'))
    monkeypatch.setattr(snapshot,'capture',lambda _:(events.append('snapshot') or {}))
    monkeypatch.setattr(life,'independent_parity',lambda *args:events.append('parity'))
    monkeypatch.setattr(runner,'execute',lambda *args:(events.append('execute') or {'graphPath':'fixture','runId':'run'}))
    monkeypatch.setattr(validation,'validate',lambda *args:(events.append('validate') or {'passed':True}))
    monkeypatch.setattr(life,'publish',lambda *args:(events.append('publish') or {'releaseId':'fixture'}))
    monkeypatch.setattr(life,'report',lambda *args:None)
    life.monitor(cfg)
    assert events==['snapshot','parity','execute','validate','publish']
    assert life.read(tmp_path/'graph-development/monitor-state.json')['state']=='private_release_validated'
