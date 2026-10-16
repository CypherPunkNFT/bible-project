"""Stream-check finished private text releases without opening source bodies."""
import argparse
import hashlib
import json
from pathlib import Path
from .build import DEFAULT_OUT, dump, now, readonly
from .jobs import background_priority


def verify(root, run):
    folder = root / 'text-releases' / run
    if not folder.resolve().is_relative_to((root / 'text-releases').resolve()):
        raise ValueError('Unexpected release path')
    summary = json.loads((folder / 'summary.json').read_text(encoding='utf-8'))
    manifest = json.loads((folder / 'release_manifest.json').read_text(encoding='utf-8'))
    errors, files = [], []
    if summary['run_id'] != run or manifest['run_id'] != run:
        errors.append('release-run-id-mismatch')
    if summary['state'] != 'complete' or not summary['validation']['ok']:
        errors.append('release-not-complete-and-validated')
    expected = {name + '.jsonl' for name in summary['table_rows']}
    expected.update(('summary.json', 'failed-text-jobs.jsonl'))
    listed = [entry['name'] for entry in manifest['files']]
    if len(set(listed)) != len(listed) or set(listed) != expected:
        errors.append('manifest-file-set-mismatch')
    for entry in manifest['files']:
        if Path(entry['name']).name != entry['name']:
            errors.append('invalid-file-name:' + entry['name'])
            continue
        path = folder / entry['name']
        h = hashlib.sha256()
        size = rows = 0
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
                h.update(block)
                size += len(block)
                rows += block.count(b'\n')
        result = {'name': path.name, 'bytes': size, 'sha256': h.hexdigest()}
        if size != entry['bytes'] or result['sha256'] != entry['sha256']:
            errors.append('file-checksum-or-size-mismatch:' + path.name)
        if path.suffix == '.jsonl':
            result['rows'] = rows
            expected_rows = summary['table_rows'].get(path.stem, 0)
            if rows != expected_rows:
                errors.append('export-row-count-mismatch:' + path.name)
        files.append(result)
    db = readonly(root / 'pipeline.sqlite3')
    try:
        record = db.execute('SELECT state,summary_json FROM text_runs WHERE id=?', (run,)).fetchone()
        if not record or record['state'] != 'complete' or json.loads(record['summary_json']) != summary:
            errors.append('persisted-release-state-mismatch')
    finally:
        db.close()
    result = {'run_id': run, 'checked_at': now(), 'ok': not errors,
              'files': files, 'errors': errors,
              'limits': 'Release bytes/counts and persisted completion; input consistency and text-location checks have separate receipts.'}
    output = root / 'text-validations' / (run + '-release.json')
    output.parent.mkdir(exist_ok=True)
    dump(output, result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT_OUT / 'pipeline')
    parser.add_argument('--run', required=True)
    args = parser.parse_args()
    background_priority()
    if not args.root.resolve().is_relative_to(DEFAULT_OUT.resolve()):
        parser.error('Unexpected runtime directory')
    result = verify(args.root, args.run)
    print(json.dumps(result))
    return 0 if result['ok'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
