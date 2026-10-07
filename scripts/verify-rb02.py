"""Verify RB02 crosswalks and immutable study witnesses locally; no network."""
import hashlib
import importlib.util
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE / 'scripts'))
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB02'
spec = importlib.util.spec_from_file_location('collector', SITE / 'scripts/rb02-acquire.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def main():
    m = read('acquisition-manifest.json')
    files = m['files']
    targets = read('targets.json')
    targets = targets.get('targets', targets) if isinstance(targets, dict) else targets
    works = read('bibliography.json')['works']
    scopes = read('intake-scope.json')['files']
    units = read('study-units.json')['units']
    decisions = read('admission-decisions.json')['decisions']
    checks = []

    def check(name, condition):
        assert condition, name
        checks.append(dict(name=name, passed=True))

    ids = {a['assetId'] for a in files}
    urls = {a['url'] for a in files}
    workids = {a['workId'] for a in files}
    check('RB02 identity and unique originals', m['mission'] == 'RB02' and len(files) == len(ids) == len(urls) == 15)
    check('Target/manifest source parity', {t['url'] for t in targets} == urls)
    check('Ten logical works and exact asset coverage', len(works) == 10 and {w['workId'] for w in works} == workids and {i for w in works for i in w['assetIds']} == ids)
    check('Fifteen exact intake scopes', len(scopes) == 15 and {s['assetId'] for s in scopes} == ids)
    check('Work-specific decisions cover every acquired work', {w for d in decisions for w in d['workIds']} == workids)
    check('No public hosting or premature ingestion/embedding', all(not s['publicHostingAllowed'] and not s['publicFullTextIndexAllowed'] and not s['ingested'] and not s['embedded'] for s in scopes))
    for a in files:
        p = (c.base.SOURCES / a['relativePath']).resolve()
        check('Original ' + a['assetId'], p.is_relative_to(c.base.SOURCES.resolve()) and hashlib.sha256(p.read_bytes()).hexdigest() == a['sha256'])
    for u in units:
        p = c.base.SOURCES / u['relativePath']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == u['originalSha256'], u['unitId']
    check('184 source-hashed study locations, 120 new and 64 reused', len(units) == 184 and sum(not u['existingHolding'] for u in units) == 120)
    check('Every acquired asset has reading locations', {u['assetId'] for u in units if not u['existingHolding']} == ids)
    for name in ['COVENANT-MODELS.md', 'READING-MAP.md']:
        for target in re.findall(r'\]\(([^)]+)\)', (R / name).read_text(encoding='utf-8')):
            target = target.strip('<>')
            if not target.startswith(('https://', 'http://', '#')):
                assert (R / target.split('#')[0]).exists(), (name, target)
    check('Valid local links in study/comparison tables', True)
    c.base.verify()
    result = dict(mission='RB02', checkedAt=datetime.now(timezone.utc).isoformat(), result='passed', checks=checks,
        collectorVerification='15 immutable originals, provenance and private derivative hashes verified',
        reviewLimit='Structural/hash checks and bounded doctrinal sampling; not exhaustive human review or OCR collation.')
    c.base.write(R / 'validation.json', result)
    print('VERIFIED', len(checks), 'crosswalk/hash checks')


if __name__ == '__main__':
    main()
