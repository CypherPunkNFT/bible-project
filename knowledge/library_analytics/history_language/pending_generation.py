"""Prepare a new implementation generation without taking the global analytics lease.

Everything here reads shared data read-only and writes only inside the private KR-140 output
directory, so it is safe to run while another analytics track holds the lease. It freezes the curated
Scripture-identity supplement, works out the run id the next population will use, and copies the
current generation's pointers aside so starting the new one cannot lose them.

It does not acquire the lease, does not wait, and does not populate anything. `workflow.py` does that
once the lease frees.
"""
import argparse
import shutil
from typing import Any

from .inputs import OUT, read, freeze, pin_sources
from .contract import VERSION, SUPPLEMENT_CRITERIA
from .processor import semantics
from ..build import dump
from ..concept_index import filehash
from ..inputs import digest, packed
from ..jobs import background_priority

#: Pointers and receipts that name exactly one generation and are rewritten when the next one starts.
GENERATION_FILES = ('active-run.json', 'calibration-active.json', 'calibration-result.json',
                    'calibration-quality.json', 'population-result.json', 'population-quality.json',
                    'progress.json', 'launch.json', 'checkpoint-before.json', 'complete-before.json',
                    'resumed-proof.json', 'idempotent-proof.json', 'integrity-verification.json',
                    'source-verification.json', 'release-verification.json')


def archive_current() -> dict[str, Any]:
    """Copy the active generation's pointers into generations/<run>/. Additive: never overwrites."""
    active = OUT / 'active-run.json'
    if not active.exists():
        return {'archived_run': None, 'files': []}
    run = read(active)['run_id']
    folder = OUT / 'generations' / run
    folder.mkdir(parents=True, exist_ok=True)
    copied = []
    for name in GENERATION_FILES:
        source = OUT / name
        destination = folder / name
        if not source.exists() or destination.exists():
            continue
        shutil.copyfile(source, destination)
        copied.append({'name': name, 'sha256': filehash(destination)})
    return {'archived_run': run, 'folder': str(folder), 'files': copied,
            'release': str(OUT / 'releases' / run), 'note': 'Copies only; the originals are untouched'}


def contract_identity() -> tuple[dict[str, Any] | None, str | None]:
    """Reproduce exactly what processor.run() hashes, so the recorded run id is the real one."""
    fixtures = OUT / 'inputs/quality-cases.json'
    if not fixtures.exists():
        return None, None
    contract = semantics(freeze())
    contract['fixtures_sha256'] = filehash(fixtures)
    return contract, 'kr140-' + digest(contract)[:24]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--status', action='store_true', help='re-read the recorded descriptor only')
    arguments = parser.parse_args()
    if arguments.status:
        print(packed(read(OUT / 'pending-generation.json')))
        return
    background_priority()
    archived = archive_current()
    selection = freeze()
    rows = pin_sources()
    contract, run_id = contract_identity()
    pending = {
        'processor': VERSION,
        'supplement': {'namespace': selection['supplement']['namespace'],
                       'counts': selection['supplement']['counts'],
                       'criteria': SUPPLEMENT_CRITERIA,
                       'sources': [{'project_path': s['project_path'], 'role': s['role'],
                                    'sha256': s['sha256'], 'bytes': s['bytes']}
                                   for s in selection['supplement']['sources']],
                       'merged_person_records': selection['supplement']['merged_person_records'],
                       'frozen_files': selection['supplement']['frozen_files']},
        'entity_inputs': {'registry_rows': selection['counts']['entities.json'],
                          'curated_rows': selection['supplement']['counts']['entities'],
                          'namespaces': 'registry historians/archaeology/scholars/scholars-find/evidence plus curated scripture-entities'},
        'scope_rows': len(rows),
        'run_id': run_id,
        'contract_sha256': digest(contract) if contract else None,
        'blocked_on': None if run_id else 'inputs/quality-cases.json is frozen by --prepare, which needs the global lease',
        'retains_existing_facts': True,
        'mutates_existing_run': False,
        'preserved_generation': archived,
        'remaining_steps': ['processor --prepare', 'processor --calibrate --new-generation',
                            'processor --run --new-generation'],
        'runner': 'knowledge.library_analytics.history_language.workflow --new-generation',
        'lease': 'Not acquired here. The runner waits for the existing owner to finish and never forces it.',
        'stop': 'Create cancel.request in this directory to stop after the current atomic group',
        'not_performed': ['global latest pointer promotion', 'release export', 'public output',
                          'registry write', 'evaluation of the new dictionary'],
    }
    dump(OUT / 'pending-generation.json', pending)
    print(packed(pending))


if __name__ == '__main__':
    main()
