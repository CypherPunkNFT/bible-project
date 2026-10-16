"""Preparation refresh never substitutes for published handoff validation."""
import sqlite3

import pytest

from knowledge import campaign_coordinator as coordinator
from knowledge.settings import write_json


def setup_plan(tmp_path):
    config = {'state_dir': tmp_path / 'state', 'site_dir': tmp_path / 'site',
              'db': tmp_path / 'corpus.sqlite3', 'sources_dir': tmp_path / 'sources'}
    source = tmp_path / 'source.md'
    source.write_text('before', encoding='utf-8')
    plan = {'inputs': [{'path': str(source), 'sha256': coordinator.digest(source)}]}
    write_json(config['state_dir'] / 'campaign-coordination/intake-plan.json', plan)
    return config, source, plan


def test_unchanged_plan_does_not_replan(tmp_path, monkeypatch):
    config, _, plan = setup_plan(tmp_path)
    def unexpected(_):
        pytest.fail('Unchanged inputs must not replan')
    monkeypatch.setattr(coordinator, 'prepare', unexpected)
    assert coordinator.current_preparation_plan(config) == plan


def test_changed_plan_propagates_preparation_failure(tmp_path, monkeypatch):
    config, source, _ = setup_plan(tmp_path)
    source.write_text('after', encoding='utf-8')
    def invalid(_):
        raise ValueError('metadata conflict')
    monkeypatch.setattr(coordinator, 'prepare', invalid)
    with pytest.raises(ValueError, match='metadata conflict'):
        coordinator.current_preparation_plan(config)


def test_previously_failed_plan_cannot_bypass_revalidation(tmp_path, monkeypatch):
    config, _, plan = setup_plan(tmp_path)
    plan['metadataConflicts'] = [{'field': 'credit'}]
    write_json(config['state_dir'] / 'campaign-coordination/intake-plan.json', plan)
    def invalid(_):
        raise ValueError('metadata conflict')
    monkeypatch.setattr(coordinator, 'prepare', invalid)
    with pytest.raises(ValueError, match='metadata conflict'):
        coordinator.current_preparation_plan(config)


def test_replanned_inputs_still_require_database_publication(tmp_path, monkeypatch):
    config, source, _ = setup_plan(tmp_path)
    source.write_text('after', encoding='utf-8')
    fresh = {'inputs': [{'path': str(source), 'sha256': coordinator.digest(source)}]}
    calls = []
    def refreshed(_):
        calls.append(True)
        return fresh
    monkeypatch.setattr(coordinator, 'prepare', refreshed)
    _, reports = coordinator.locations(config)
    for relative in ('catalogue/acquisition-manifest.json',
                     'text/existing-ocr-completion/acquisition-manifest.json'):
        write_json(reports / relative, {'files': []})
    write_json(reports / 'text/unresolved-text-gaps.json', {'items': []})
    with sqlite3.connect(config['db']) as db:
        db.executescript('CREATE TABLE library_records(id TEXT,kind TEXT);'
                        'CREATE TABLE files(path TEXT,sha256 TEXT);'
                        'CREATE TABLE library_files(path TEXT,status TEXT);')
    with pytest.raises(ValueError, match='unpublished/conflicting'):
        coordinator.final_handoffs(config)
    result = coordinator.read(config['state_dir'] / 'campaign-coordination/published-handoffs.json')
    assert calls == [True]
    assert result['preparationPublished'] is False
    assert result['conflicts'][0]['reason'] == 'preparation ledger/documentation not in published inventory'
