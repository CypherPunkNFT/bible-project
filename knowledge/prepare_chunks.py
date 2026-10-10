"""Prepare new library text on CPU; never publish a corpus or touch vectors."""
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from .chunk_cache import prepare
from .library import plan_library
from .library_extract import extraction_cache, sha256
from .settings import load, write_json
from .store import connect


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()
    config = load()
    root = config['state_dir'] / 'cpu-preparation'
    root.mkdir(exist_ok=True)
    lock = (root / 'prepare.lock').open('a+b')
    if os.name == 'nt':
        import msvcrt
        import ctypes
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
        if not kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x4000):
            raise ctypes.WinError(ctypes.get_last_error())
    else:
        import fcntl
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        os.nice(10)
    status = {'state': 'planning', 'pid': os.getpid(), 'started_at': datetime.now(timezone.utc).isoformat(),
              'processed': 0, 'preparedFiles': 0, 'preparedChunks': 0, 'reusedBlocks': 0, 'failures': 0,
              'cpuOnly': True, 'priority': 'below-normal', 'liveCorpusModified': False, 'vectorsModified': False}
    try:
        prepared_ids = set(json.loads((root / 'source-hashes.json').read_text('utf-8')))
    except (OSError, ValueError):
        prepared_ids = set()
    def publish():
        status['updated_at'] = datetime.now(timezone.utc).isoformat()
        write_json(root / 'progress.json', status)
    publish()
    try:
        records, provenance, hints, derivatives, files = plan_library(config)
        with connect(config['db'], readonly=True) as db:
            held = {row['path']: row['sha256'] for row in db.execute('SELECT path,sha256 FROM library_files')}
        targets = []
        for path in files:
            hint = hints.get(str(path), {})
            expected = hint.get('catalog', {}).get('sha256') or hint.get('sha256') or hint.get('sourceSha256')
            if str(path) in held and (not expected or expected == held[str(path)]):
                continue
            if path.name.endswith('provenance.json') or path.name == 'metadata.json' or path.name.endswith('_scandata.xml'):
                continue
            if path.suffix.lower() not in ('.pdf', '.epub', '.txt', '.md', '.html', '.htm', '.xml', '.json', '') and str(path) not in derivatives:
                continue
            targets.append(path)
        # User-added transcripts first, then the rest of the unpublished library.
        targets.sort(key=lambda p: ('yt-transcripts' not in str(p), str(p)))
        if args.limit:
            targets = targets[:args.limit]
        status.update(state='running', total=len(targets), skippedPublishedFiles=len(held))
        publish()
        with (root / 'manifest.jsonl').open('a', encoding='utf-8') as journal:
            for path in targets:
                hint = hints.get(str(path), {})
                asset = hint.get('catalog', {})
                try:
                    checksum = sha256(path)
                    expected = asset.get('sha256') or hint.get('sha256') or hint.get('sourceSha256')
                    if expected and expected != checksum:
                        raise ValueError('Original does not match recorded acquisition hash')
                    derivative = None if path.suffix.lower() == '.epub' else derivatives.get(str(path))
                    if path.suffix.lower() == '.pdf' and derivative and derivative.get('priority', 0) < 10:
                        derivative = None
                    cache, selected, text_hash = extraction_cache(config, path, checksum, asset.get('format') or hint.get('format', ''), derivative)
                    count, caches, reused = 0, [], 0
                    with cache.open(encoding='utf-8') as stream:
                        for line in stream:
                            block = json.loads(line)
                            if not block['text'].strip():
                                continue
                            prepared, n, hit = prepare(config, block['text'], block['locator'])
                            count += n
                            reused += int(hit)
                            caches.append(str(prepared))
                    row = {'path': str(path), 'sha256': checksum, 'extractionCache': str(cache),
                           'chunkCaches': caches, 'chunks': count, 'status': 'prepared' if count else 'no_existing_text',
                           'textSha256': text_hash}
                    status['preparedFiles'] += int(count > 0)
                    status['preparedChunks'] += count
                    status['reusedBlocks'] += reused
                    if count:
                        prepared_ids.add('library:text:' + checksum)
                except Exception as exc:
                    row = {'path': str(path), 'status': 'failed', 'error': str(exc)}
                    status['failures'] += 1
                journal.write(json.dumps(row, ensure_ascii=False) + '\n')
                journal.flush()
                status['processed'] += 1
                status['currentFile'] = str(path)
                publish()
                if status['processed'] % 25 == 0:
                    write_json(root / 'source-hashes.json', sorted(prepared_ids))
                    print(json.dumps(status), flush=True)
        status['state'] = 'complete' if not status['failures'] else 'complete_with_failures'
    except Exception as exc:
        status.update(state='failed', error=str(exc))
        raise
    finally:
        write_json(root / 'source-hashes.json', sorted(prepared_ids))
        publish()
        lock.close()
    print(json.dumps(status), flush=True)


if __name__ == '__main__':
    main()
