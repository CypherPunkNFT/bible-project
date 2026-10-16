"""Arm the verified native supervisor for the authorized current-corpus pass only."""
import json
import msvcrt
import sqlite3
import subprocess
from datetime import datetime, timezone
from xml.etree import ElementTree

from .settings import load, write_json
from .native_supervisor import read, snapshot, stamp
from .vectors import table


if __name__ == '__main__':
    config = load()
    state = config['state_dir']
    runtime = state/'native-supervisor'
    run_id = datetime.now(timezone.utc).strftime('embedding-only-%Y%m%dT%H%M%SZ')
    folder = runtime/run_id
    with (runtime/'supervisor.lock').open('a+b') as lock:
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        rows, unknown = snapshot(config)
        control = read(runtime/'control.json')
        if rows or unknown or control.get('enabled'):
            raise RuntimeError('Resume requires no existing corpus owners and paused recovery')
        if (state/'watchdog.pause').exists():
            raise RuntimeError('An explicit legacy pause exists; review its scope before resumption')
        test = read(runtime/'test-result.json')
        if not test.get('verified'):
            raise RuntimeError('Live recovery test has not passed')
        task = subprocess.run(['schtasks', '/Query', '/TN', 'BibleProject-Native-Completion-Supervisor', '/XML'], capture_output=True, check=True)
        raw = task.stdout
        xml = raw.decode('utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig')
        root = ElementTree.fromstring(xml)
        ns = {'t': 'http://schemas.microsoft.com/windows/2004/02/mit/task'}
        if (root.findtext('.//t:Priority', namespaces=ns) != '4' or
                root.findtext('.//t:Command', namespaces=ns) != str(state/'.venv/Scripts/python.exe') or
                root.findtext('.//t:Arguments', namespaces=ns) != '-m knowledge.native_supervisor --once' or
                root.findtext('.//t:Settings/t:Enabled', default='true', namespaces=ns) != 'true'):
            raise RuntimeError('Registered native supervisor task does not match the verified setup')
        with sqlite3.connect(config['db'].as_uri()+'?mode=ro', uri=True) as db:
            build = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
            total = db.execute('SELECT count(*) FROM chunks').fetchone()[0]
        vectors = table(config)
        indexed = vectors.count_rows()
        if indexed != test['final_rows'] or build != test['replacement_checkpoint']['corpus_build']:
            raise RuntimeError('Corpus/vector checkpoint changed since the recovery test; review before arming')
        folder.mkdir()
        write_json(folder/'before.json', dict(control=control, recovery=read(runtime/'recovery.json'),
                   embedding=read(state/'embedding-progress.json'), completion=read(state/'intake-completion.json')))
        (folder/'registered-task.xml').write_text(xml, encoding='utf-16')
        receipt = dict(run_id=run_id, armed_at=stamp(), mode='embedding_only', corpus_build=build,
                       total=total, initial_vectors=indexed, remaining=total-indexed,
                       scope='Current corpus embeddings only; no refresh, optimization, final verification, graph or mining',
                       recovery_test=test['test_id'], prior_recovery_ledger=str(folder/'before.json'))
        # Archive the test's attempt ledger before beginning this separately authorized run.
        write_json(runtime/'recovery.json', dict(attempts=0, run_id=run_id, previous_ledger=str(folder/'before.json')))
        write_json(runtime/'control.json', dict(enabled=True, mode='embedding_only', corpus_build=build,
                   run_id=run_id, reason='Owner authorized step 4 only: resume current-corpus embedding'))
        write_json(folder/'armed.json', receipt)
        write_json(runtime/'active-embedding-run.json', receipt)
        print(json.dumps(receipt))
