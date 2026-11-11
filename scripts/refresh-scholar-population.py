"""Refresh stale population metadata; preserve the installed snapshot until generation succeeds."""
import hashlib
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def changed_inputs(root, snapshot):
    changed = []
    for name, expected in snapshot['reconciliation']['inputs'].items():
        if isinstance(expected, str) and name.endswith('.json'):
            source = root / name
            if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest() != expected:
                changed.append(name)
    return changed


def main():
    destination = ROOT / 'public/content/scholar-population'
    snapshot = json.loads((destination / 'index.json').read_text(encoding='utf-8'))
    changed = changed_inputs(ROOT, snapshot)
    if not changed:
        print('Scholar population metadata inputs are current.')
        return
    print('Refreshing scholar population after input changes: ' + ', '.join(changed), flush=True)
    if not (ROOT.parent / 'KnowledgeBase/knowledge.sqlite3').is_file():
        raise RuntimeError('Population inputs changed; reconcile on the source machine before building. Existing snapshot retained.')
    recovery = ROOT / '.local/population-refresh'
    recovery.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='refresh-', dir=recovery))
    generated = stage / 'generated'
    spec = importlib.util.spec_from_file_location('reconcile_population', ROOT / 'scripts/reconcile-scholar-population.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.OUT = generated
    module.main()
    fresh = json.loads((generated / 'index.json').read_text(encoding='utf-8'))
    if changed_inputs(ROOT, fresh):
        raise RuntimeError('Inputs changed during generation; existing population snapshot retained.')
    files = sorted(p for p in generated.rglob('*') if p.is_file())
    # Preserve every overwritten file before installing anything. No old files are deleted.
    for source in files:
        relative = source.relative_to(generated)
        target = destination / relative
        if target.exists():
            backup = stage / 'before' / relative
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup)
    # Publish the manifest last, after its referenced data exists.
    files.sort(key=lambda p: p.name == 'index.json')
    installed = []
    try:
        for source in files:
            target = destination / source.relative_to(generated)
            target.parent.mkdir(parents=True, exist_ok=True)
            installed.append(target)
            shutil.copy2(source, target)
            if target.read_bytes() != source.read_bytes():
                raise RuntimeError('Population installation read-back mismatch: ' + str(target))
    except Exception:
        for target in installed:
            backup = stage / 'before' / target.relative_to(destination)
            if backup.exists():
                shutil.copy2(backup, target)
        raise
    (stage / 'receipt.json').write_text(json.dumps({'changed_inputs': changed, 'installed_files': len(files)}, indent=2), encoding='utf-8')
    print('Population refreshed; generation and backups retained at ' + str(stage))


if __name__ == '__main__':
    main()
