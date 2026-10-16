"""Join validated text populations into one private consumer contract."""
import argparse
import hashlib
import json
import time
from collections import Counter
from pathlib import Path
from .build import DEFAULT_OUT, dump, now, readonly
from .inputs import digest
from .jobs import background_priority


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def bundle(root, runs):
    if not runs or len(set(runs)) != len(runs):
        raise ValueError('Select distinct completed run IDs')
    components = []
    metrics, rows, flags, scripts, coverage, gaps = [Counter() for _ in range(6)]
    flagged = lower_bound = 0
    kinds = set()
    for run in runs:
        folder = root / 'text-releases' / run
        if not folder.resolve().is_relative_to((root / 'text-releases').resolve()):
            raise ValueError('Unexpected release path')
        summary = load(folder / 'summary.json')
        manifest = load(folder / 'release_manifest.json')
        release_receipt = load(root / 'text-validations' / (run + '-release.json'))
        witness_receipt = load(root / 'text-validations' / (run + '-witnesses.json'))
        if summary['run_id'] != run or summary['state'] != 'complete' or not summary['validation']['ok']:
            raise ValueError('Incomplete component: ' + run)
        if not release_receipt['ok'] or release_receipt['run_id'] != run:
            raise ValueError('Release verification missing/failed: ' + run)
        if (not witness_receipt['ok'] or witness_receipt['run_id'] != run
                or witness_receipt['run_state_at_check'] != 'complete'):
            raise ValueError('Post-completion witness verification missing/failed: ' + run)
        if {e['name']: e['sha256'] for e in release_receipt['files']} != {e['name']: e['sha256'] for e in manifest['files']}:
            raise ValueError('Verification does not match release manifest: ' + run)
        selected_kinds = set(summary['scope']['kinds'])
        if kinds & selected_kinds:
            raise ValueError('Overlapping document kinds require explicit reconciliation')
        kinds.update(selected_kinds)
        components.append({'run_id': run, 'kinds': sorted(selected_kinds),
                           'summary': str(folder / 'summary.json'), 'release': str(folder),
                           'release_manifest_sha256': hashlib.sha256((folder / 'release_manifest.json').read_bytes()).hexdigest(),
                           'release_verification': str(root / 'text-validations' / (run + '-release.json')),
                           'witness_verification': str(root / 'text-validations' / (run + '-witnesses.json'))})
        metrics.update(summary['metrics'])
        rows.update(summary['table_rows'])
        for c in summary['coverage']: coverage[c['coverage']] += c['documents']
        for g in summary['gaps']: gaps[g['stage']] += g['documents']
        with (folder / 'document_quality.jsonl').open(encoding='utf-8') as stream:
            for line in stream:
                q = json.loads(line)
                if q['status'] != 'completed': continue
                data = json.loads(q['metrics_json'])
                document_flags = data['flags']
                flagged += bool(document_flags)
                flags.update(document_flags)
                scripts.update(data['scripts'])
                lower_bound += data['repeated_line_metric'] == 'lower-bound'
    builds = {load(Path(c['summary']))['scope']['corpus_build'] for c in components}
    identifier = 'la02-bundle-' + digest({'runs': sorted(runs)})[:16]
    folder = root / 'text-bundles' / identifier
    folder.mkdir(parents=True, exist_ok=True)
    result = {'id': identifier, 'created_at': now(), 'state': 'complete',
              'components': components, 'metrics': dict(metrics), 'table_rows': dict(rows),
              'analysis_coverage': dict(coverage), 'gap_records_by_stage': dict(gaps),
              'quality_summary': {'flagged_documents': flagged, 'flag_counts': dict(flags),
                                  'repeated_line_lower_bound_documents': lower_bound,
                                  'letter_script_counts': dict(scripts)},
              'captured_corpus_builds': sorted(builds),
              'database': str(root / 'pipeline.sqlite3'),
              'selection_contract': 'Join every table through run_jobs and select these component run IDs; do not sum other generations.',
              'limits': 'Sequential captured populations, not all held files or future intake. Quality flags are review candidates. Literal references are not semantic precision or doctrinal endorsements. Language-specific grammars remain partial.'}
    dump(folder / 'summary.json', result)
    pointer = {'id': identifier, 'summary': str(folder / 'summary.json'),
               'database': result['database'], 'run_ids': [c['run_id'] for c in components]}
    dump(root.parent / 'latest-text-bundle.json', pointer)
    continuation = root / 'text-continuation.json'
    if continuation.exists():
        prior = load(continuation)
        if prior.get('after_run') in runs:
            dump(continuation, {'updated_at': now(), 'after_run': prior['after_run'],
                                'state': 'complete', 'bundle': identifier,
                                'completion_source': 'validated-text-bundle'})
    return result


def finish(root, runs):
    """Wait read-only, then verify new releases and publish their bundle."""
    from .verify_release import verify as verify_release
    from .verify_text import verify as verify_witnesses
    previous = None
    while True:
        db = readonly(root / 'pipeline.sqlite3')
        try:
            states = {run: db.execute('SELECT state FROM text_runs WHERE id=?',(run,)).fetchone()[0] for run in runs}
            owned = db.execute('SELECT count(*) FROM coordinator').fetchone()[0]
        finally: db.close()
        if states != previous:
            print(json.dumps({'phase':'waiting-for-completion','runs':states}),flush=True)
            previous = states
        if any(state in ('failed','interrupted','needs-review') for state in states.values()):
            raise RuntimeError('A selected run needs resolution; completion verification will not retry processing')
        if all(state=='complete' for state in states.values()) and not owned: break
        time.sleep(5)
    for run in runs:
        manifest = load(root / 'text-releases' / run / 'release_manifest.json')
        receipt_path = root / 'text-validations' / (run + '-release.json')
        receipt = load(receipt_path) if receipt_path.exists() else {}
        expected = {e['name']: e['sha256'] for e in manifest['files']}
        verified = {e['name']: e['sha256'] for e in receipt.get('files',[])}
        if not receipt.get('ok') or receipt.get('run_id') != run or expected != verified:
            print(json.dumps({'phase':'verify-release','run_id':run}),flush=True)
            if not verify_release(root,run)['ok']: raise RuntimeError('Release verification failed: ' + run)
        witness_path = root / 'text-validations' / (run + '-witnesses.json')
        witness = load(witness_path) if witness_path.exists() else {}
        if (not witness.get('ok') or witness.get('run_id') != run
                or witness.get('run_state_at_check') != 'complete'):
            print(json.dumps({'phase':'verify-source-witnesses','run_id':run}),flush=True)
            if not verify_witnesses(root,run)['ok']: raise RuntimeError('Source witness verification failed: ' + run)
    print(json.dumps({'phase':'bundle','run_ids':runs}),flush=True)
    return bundle(root,runs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT_OUT / 'pipeline')
    parser.add_argument('--runs', nargs='+', required=True)
    parser.add_argument('--finish', action='store_true', help='Wait for completion, verify new releases, then bundle; never retries processing')
    args = parser.parse_args()
    if not args.root.resolve().is_relative_to(DEFAULT_OUT.resolve()):
        parser.error('Unexpected runtime directory')
    background_priority()
    result = finish(args.root,args.runs) if args.finish else bundle(args.root, args.runs)
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
