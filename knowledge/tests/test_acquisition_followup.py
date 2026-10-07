import json
import os
from datetime import datetime, timezone

from knowledge.acquisition_followup import campaign_gate, check
from knowledge.settings import write_json


def plan(tmp_path):
    return {"campaign_dir": str(tmp_path / 'campaign'),
            "missions": [f'RB{i:02}' for i in range(1, 15)],
            "quiet_seconds": 300, "task_name": "test-followup"}


def finished(value, count):
    from pathlib import Path
    for mission in value['missions'][:count]:
        folder = Path(value['campaign_dir']) / mission
        folder.mkdir(parents=True, exist_ok=True)
        for name, body in [('REPORT.md', 'Final findings and resumable gaps'),
                           ('acquisition-manifest.json', json.dumps({'mission': mission, 'files': []}))]:
            path = folder / name
            path.write_text(body)
            os.utime(path, (1000, 1000))


def test_eight_or_thirteen_missions_never_release_fourteen_mission_gate(tmp_path):
    value = plan(tmp_path)
    finished(value, 8)
    now = datetime.now(timezone.utc)
    assert not campaign_gate(value, now)['ready']
    finished(value, 13)
    assert campaign_gate(value, now)['missing'] == ['RB14']
    finished(value, 14)
    assert campaign_gate(value, now)['ready']


def test_invalid_manifest_and_recent_writes_hold_gate(tmp_path):
    from pathlib import Path
    value = plan(tmp_path); finished(value, 14)
    path = Path(value['campaign_dir']) / 'RB14/acquisition-manifest.json'
    path.write_text('{')
    assert campaign_gate(value, datetime.now(timezone.utc))['invalid']
    path.write_text(json.dumps({'mission': 'RB14', 'files': []}))
    result = campaign_gate(value, datetime.now(timezone.utc))
    assert not result['ready'] and not result['quiet']


def test_current_embedding_is_never_interrupted_and_launch_is_once(tmp_path, monkeypatch):
    from knowledge import acquisition_followup as module
    value = plan(tmp_path); finished(value, 14)
    config = {'state_dir': tmp_path}
    write_json(tmp_path / 'acquisition-followup-plan.json', value)
    processes = {'embed': [123], 'build': [], 'refresh': [], 'monitor': [], 'encoder': [456]}
    monkeypatch.setattr(module, 'inventory', lambda _: processes)
    monkeypatch.setattr(module, 'collectors', lambda: [])
    launches = []
    monkeypatch.setattr(module, 'launch', lambda _: launches.append(True) or 987)
    assert check(config)['state'] == 'waiting_for_current_intake'
    assert not launches
    processes['embed'] = []
    assert check(config)['state'] == 'launching'
    processes['monitor'] = [987]
    check(config)
    assert len(launches) == 1


def test_active_acquisition_holds_even_with_all_reports(tmp_path, monkeypatch):
    from knowledge import acquisition_followup as module
    value = plan(tmp_path); finished(value, 14)
    write_json(tmp_path / 'acquisition-followup-plan.json', value)
    monkeypatch.setattr(module, 'inventory', lambda _: {})
    monkeypatch.setattr(module, 'collectors', lambda: [123])
    monkeypatch.setattr(module, 'launch', lambda _: (_ for _ in ()).throw(AssertionError('early launch')))
    assert check({'state_dir': tmp_path})['state'] == 'waiting_for_acquisition'


def test_watchdog_respects_verified_snapshot_waiting_for_campaign():
    from knowledge.watchdog import decide
    processes = {k: [] for k in ('build', 'refresh', 'embed', 'monitor', 'encoder')}
    assert decide({'state': 'complete'}, {'state': 'snapshot_complete_followup_pending'},
                  processes, datetime.now(timezone.utc)) == 'waiting_for_acquisition'
