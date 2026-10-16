"""Bounded read-only refinement receipt audit; no population queries or lease use."""
import argparse
import hashlib
import json
import time
from pathlib import Path

from .inputs import ROOT, BASE, SECTION_RUN, ALIGNMENT_RUN, Inputs, write_json


PATHS = {
    'sections': [f'releases/{SECTION_RUN}/summary.json'],
    'alignment': [f'alignment/releases/{ALIGNMENT_RUN}/summary.json', 'alignment/release-verification.json'],
    'concepts': ['concepts/population.json', 'concepts/population-verification.json', 'concepts/release-verification.json',
                 'concepts/evaluations/kr110-54f0bfca9b30da6cc49b2347/quality.json'],
    'relationships': ['relationships/population.json', 'relationships/joint-population.json',
                      'relationships/population-verification.json', 'relationships/release-verification.json', 'relationships/quality.json'],
    'arguments': ['arguments/population.json', 'arguments/population-verification.json', 'arguments/delivery-complete.json',
                  'arguments/release-verification.json', 'arguments/evaluation/reserved-metrics.json',
                  'arguments/validation-live-check.json', 'arguments/operator-state.json', 'arguments/execution-state.json'],
    'history_language': ['history-language/population-result.json', 'history-language/integrity-verification.json',
                        'history-language/release-verification.json', 'history-language/closeout.json', 'history-language/content-review.json'],
    'refresh': ['refresh/progress.json', 'refresh/suite-launch.json', 'refresh/suite-result.json', 'refresh/held-equivalence.json',
                'refresh/held-resume.json', 'refresh/held-idempotence.json', 'refresh/held-rollback.json'],
    'continuation': ['arguments/continuation-state.json', 'arguments/continuation-resume-launch.json'],
    'embedding': ['../../embedding-progress.json', '../../intake-completion.json'],
    'recovery': ['recovery/operational-checks.json', 'recovery/kr101-v2-20261014/restored/restore-receipt.json',
                 'recovery/kr101-v2-20261014/restored/verification.json', 'recovery/kr101-v2-20261014/driver-receipt.json'],
}

FIELDS = {'run_id', 'id', 'release_id', 'state', 'phase', 'ok', 'passed', 'verified', 'complete', 'counts',
          'checks', 'summary', 'quality', 'quality_summary', 'quality_gate', 'capabilities', 'total', 'cases',
          'files', 'bytes', 'verified_files', 'export_bytes', 'global_latest_promoted', 'repeated_export_unchanged',
          'reviewer', 'reviewer_type', 'reviewed_cases', 'useful_within_declared_scope', 'limited_or_failed_cases',
          'current_check', 'primary_sql_checks_completed', 'primary_sql_check_count', 'source_reconstruction_loop_finished',
          'observed_at_unix', 'sample_seconds', 'cpu_seconds_added', 'read_bytes_added', 'write_bytes_added',
          'identity_confirmed', 'pid', 'process_token', 'seconds', 'seconds_this_attempt', 'documents', 'mode',
          'failed_or_unfinished_jobs', 'eligible', 'scope', 'coverage', 'baseline', 'processor'}


def compact(value, depth=0):
    if depth >= 5:
        return '<nested data omitted>'
    if isinstance(value, dict):
        return {k: compact(v, depth+1) for k, v in value.items() if k in FIELDS or depth > 0}
    if isinstance(value, list):
        return {'items': len(value), 'first': [compact(v, depth+1) for v in value[:4]]}
    return value


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--quiet',action='store_true');args=parser.parse_args()
    result = {'observed_at_unix': time.time(), 'method': 'saved receipts and live status observations; no full validation or bulk export rehash rerun',
              'owner_changes': False, 'population_queries_run': False, 'global_lease_acquired': False, 'stages': {}}
    inputs = Inputs()
    try:
        inputs.check(verify_sources=False)
        result['pinned_parent_manifest_summary_checks'] = inputs.proofs
    finally:
        inputs.close()
    for stage, paths in PATHS.items():
        records = []
        for relative in paths:
            path = BASE / relative
            entry = {'path': str(path), 'exists': path.exists()}
            if path.exists():
                stat = path.stat(); entry.update(bytes=stat.st_size, modified_at_unix=stat.st_mtime)
                if stat.st_size <= 8 * 1024 * 1024:
                    raw = path.read_bytes(); entry['sha256'] = hashlib.sha256(raw).hexdigest()
                    try:
                        entry['recorded'] = compact(json.loads(raw.decode('utf-8-sig')))
                    except (ValueError, UnicodeError) as exc:
                        entry['error'] = str(exc)
                else:
                    entry['read_deferred'] = 'large receipt; existence/stat only to avoid bulk scanning alongside owner'
            records.append(entry)
        result['stages'][stage] = records
    result['owned_store_sizes'] = {p.name: p.stat().st_size for p in (ROOT/'arguments.sqlite3', ROOT/'arguments.sqlite3-wal') if p.exists()}
    prior=ROOT/'refinement-receipt-audit.json'
    if prior.exists():
        old=json.loads(prior.read_text('utf-8'));folder=ROOT/'audits';folder.mkdir(exist_ok=True)
        archived=folder/(str(old.get('observed_at_unix','unknown'))+'.json')
        if not archived.exists():archived.write_bytes(prior.read_bytes())
    write_json(prior, result)
    if not args.quiet:print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
