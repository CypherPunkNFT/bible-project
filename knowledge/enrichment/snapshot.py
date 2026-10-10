"""Retain corpus and metadata without writing to live inputs or GPU/build locks."""
import json
import shutil
import sqlite3
import time
from contextlib import closing
from pathlib import Path
from .core import checksum, dumps, identity, now, readonly, writer_lock
from ..settings import write_json


def redact(config, manifest):
    """Remove checksum-proven excluded bodies from the owned analytical snapshot."""
    if manifest.get('archivedBodiesRedacted'):
        return manifest
    path=Path(manifest['corpusPath'])
    moves=json.loads((config['state_dir']/'campaign-coordination/archive-moves.json').read_text('utf-8'))['approvedMoves']
    with closing(sqlite3.connect(path)) as db:
        db.execute('PRAGMA secure_delete=ON')
        docs=set()
        for move in moves:
            docs.update(r[0] for r in db.execute('SELECT document_id FROM library_files WHERE sha256=?',(move['sha256'],)) if r[0])
            docs.add('library:text:'+move['sha256'])
        removed=0
        for doc in docs:
            rows=db.execute('SELECT rowid,title,search_text FROM chunks WHERE document_id=?',(doc,)).fetchall()
            for row in rows:
                db.execute("INSERT INTO chunks_fts(chunks_fts,rowid,title,search_text) VALUES('delete',?,?,?)",row)
            removed+=len(rows)
            db.execute('DELETE FROM chunks WHERE document_id=?',(doc,))
            db.execute('DELETE FROM references_to WHERE document_id=?',(doc,))
            db.execute('DELETE FROM documents WHERE id=?',(doc,))
        for move in moves:
            db.execute('DELETE FROM library_files WHERE sha256=?',(move['sha256'],))
            db.execute('DELETE FROM files WHERE sha256=?',(move['sha256'],))
        db.execute('CREATE INDEX IF NOT EXISTS graph_snapshot_edge_identity ON edges(subject,relation,object,source)')
        db.commit()
        if db.execute('PRAGMA foreign_key_check').fetchone(): raise RuntimeError('Snapshot redaction broke foreign keys')
    manifest=manifest|dict(archivedBodiesRedacted=True,excludedHashes=[r['sha256'] for r in moves],removedBodyChunks=removed,
                            bytes=path.stat().st_size,scope='retained private input; excluded source bodies removed; source corpus untouched')
    write_json(path.parent/'manifest.json',manifest)
    return manifest


def capture(config):
    state = config['state_dir']
    with writer_lock(state, 'snapshot.lock'):
        with closing(readonly(config['db'])) as live:
            build = live.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
            id = identity('snapshot', build)
            root = state / 'graph-input-snapshots' / id.replace(':', '-')
            manifest_path = root / 'manifest.json'
            if manifest_path.exists():
                return redact(config,json.loads(manifest_path.read_text('utf-8')))
            root.mkdir(parents=True, exist_ok=True)
            size = config['db'].stat().st_size
            if shutil.disk_usage(state).free < size + 5_000_000_000:
                raise RuntimeError('Insufficient disk space for retained graph input plus 5 GB reserve')
            destination = root / 'corpus.sqlite3'
            temporary = root / 'corpus.partial.sqlite3'
            start, last = time.monotonic(), [0]
            with closing(sqlite3.connect(temporary)) as frozen:
                def progress(status, remaining, total):
                    if time.monotonic() - last[0] > 2:
                        write_json(state / 'graph-development/snapshot-progress.json', dict(state='copying', snapshot=id, pid=__import__('os').getpid(), updatedAt=now(), pagesRemaining=remaining, pagesTotal=total))
                        last[0] = time.monotonic()
                live.backup(frozen, pages=1024, progress=progress, sleep=.01)
                if frozen.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0] != build:
                    raise RuntimeError('Corpus changed while obtaining retained snapshot')
            temporary.replace(destination)
        # Live handle is now CLOSED. All longer analysis uses retained inputs.
        with closing(readonly(destination)) as frozen:
            write_json(state / 'graph-development/snapshot-progress.json',dict(state='checking_retained_integrity',snapshot=id,updatedAt=now()))
            integrity = frozen.execute('PRAGMA quick_check').fetchone()[0]
            if integrity != 'ok' or frozen.execute('PRAGMA foreign_key_check').fetchone():
                raise RuntimeError('Retained corpus failed integrity/foreign-key check')
        inputs_path = root / 'inputs.sqlite3'
        artifacts = []
        with closing(sqlite3.connect(inputs_path)) as inputs:
            inputs.executescript('CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT,metadata TEXT,path TEXT,sha256 TEXT);CREATE TABLE IF NOT EXISTS overlays(path TEXT PRIMARY KEY,sha256 TEXT,metadata TEXT);CREATE TABLE IF NOT EXISTS artifacts(path TEXT PRIMARY KEY,sha256 TEXT,metadata TEXT);')
            catalog = config['site_dir'] / 'content/library'
            for number, file in enumerate(sorted((catalog / 'catalog').rglob('*.json')), 1):
                value = json.loads(file.read_text('utf-8-sig'))
                inputs.execute('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?)', (value['id'], value['kind'], dumps(value), str(file), checksum(file)))
                if number % 1000 == 0:
                    inputs.commit()
                    write_json(state / 'graph-development/snapshot-progress.json', dict(state='freezing_metadata', snapshot=id, records=number, updatedAt=now()))
            files = [catalog / name for name in ('authors.json', 'sources.json', 'vocabulary.json')]
            files.extend(sorted((catalog / 'registry-extensions').rglob('*.json')))
            files += [catalog / 'reports/campaign-reconciliation/catalogue/acquisition-manifest.json', state / 'campaign-coordination/archive-moves.json']
            for file in files:
                if not file.is_file():
                    continue
                value = json.loads(file.read_text('utf-8-sig'))
                sha = checksum(file)
                artifacts.append(dict(path=str(file), sha256=sha))
                if file.name == 'acquisition-manifest.json':
                    for row in value.get('files', []):
                        if row.get('path') and row.get('sha256'):
                            inputs.execute('INSERT OR REPLACE INTO overlays VALUES(?,?,?)', (row['path'], row['sha256'], dumps(row)))
                else:
                    inputs.execute('INSERT OR REPLACE INTO artifacts VALUES(?,?,?)', (str(file), sha, dumps(value)))
            inputs.commit()
        result = dict(id=id, corpusBuild=build, corpusPath=str(destination), inputsPath=str(inputs_path), capturedAt=now(), integrity=integrity,
                      bytes=destination.stat().st_size, inputsSha256=checksum(inputs_path), artifacts=artifacts, seconds=round(time.monotonic()-start, 1), scope='retained private read-only graph input')
        write_json(manifest_path, result)
        write_json(state / 'graph-development/snapshot-progress.json', dict(state='complete', snapshot=id, updatedAt=now()))
        return redact(config,result)
