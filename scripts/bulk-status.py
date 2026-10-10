"""One-page numeric progress in private runtime state; not a corpus source."""
import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json


def main():
    config = load(); state = config['state_dir']; rows = []; failures = 0
    manifests = [SITE / 'content/library/reports/bulk-acquisition/TCP/acquisition-manifest.json', SITE / 'content/library/reports/reformed-baptist-overnight/RB00/acquisition-manifest.json']
    for p in manifests:
        if not p.exists(): continue
        data = json.loads(p.read_text('utf-8-sig'))
        rows.extend(dict(r, source=r.get('source', 'tcp')) for r in data.get('files', []))
        failures += len(data.get('failures', []))
    for p in (SITE / 'content/library/reports/reformed-baptist-overnight/RB00').glob('*-test.json'):
        if 'initial' in p.name: continue
        failures += len(json.loads(p.read_text('utf-8-sig')).get('failures', []))
    offered_rows = []
    baseline_path = state / 'bulk-offered-baseline.json'
    if baseline_path.exists():
        baseline = json.loads(baseline_path.read_text('utf-8-sig'))
        held = set(baseline['sha256'])
        for ledger in baseline['ledgers']:
            p = SITE / ledger
            if not p.exists(): continue
            data = json.loads(p.read_text('utf-8-sig'))
            source = 'monergism' if 'monergism' in p.name else 'desiring-god'
            for record in data.values():
                for asset in record.get('assets', []):
                    if asset.get('sha256') and asset['sha256'] not in held:
                        normalized = dict(asset, source=source, licence=asset.get('licence') or ('Publisher-offered personal/noncommercial reading edition; copyright and contributor credit retained; policy: ' + asset.get('policyUrl', 'see source ledger')), evidenceOnly=False, privateLocalIndexAuthorized=True)
                        rows.append(normalized); offered_rows.append(normalized)
    offered_manifest = SITE / 'content/library/reports/bulk-acquisition/offered-books/acquisition-manifest.json'
    write_json(offered_manifest, {'mission': 'BULK-OFFERED-BOOKS', 'files': offered_rows, 'publicHostingAllowed': False})
    progress = json.loads((state / 'embedding-progress.json').read_text('utf-8-sig'))
    completion = json.loads((state / 'intake-completion.json').read_text('utf-8-sig'))
    before = 1934778; current = progress['total']; done = progress.get('state') == 'complete' and completion.get('state') == 'complete'
    works = {(r['source'], r.get('tcpId') or r.get('sourceId') or r.get('workId') or r.get('assetId')) for r in rows}
    result = {'filesAcquired': len(rows), 'GB': round(sum(r.get('byteCount', r.get('bytes', 0)) for r in rows)/1e9, 3), 'distinctSourceWorkIds': len(works), 'uniqueOriginalHashes': len({r['sha256'] for r in rows}), 'sourcesUsed': sorted({r['source'] for r in rows}), 'failures': failures, 'legacyFilesReleased': 69, 'passageTotalBefore': before, 'passageTotalCurrent': current, 'passageTotalAfterVerifiedIntake': current if done else None, 'passageDelta': current-before, 'processingState': completion.get('state'), 'publicHostingAllowed': False}
    write_json(state / 'bulk-report.json', result)
    lines = ['# Bulk acquisition', '', '| Measure | Count |', '|---|---:|', f'| Files acquired | {len(rows):,} |', f"| GB | {result['GB']:.3f} |", f'| Distinct source work IDs | {len(works):,} |', f"| Unique original hashes | {result['uniqueOriginalHashes']:,} |", f"| Sources used | {len(result['sourcesUsed'])} |", f'| Failures | {failures} |', '| Legacy files released | 69 |', f'| Passage total before | {before:,} |', f'| Passage total current | {current:,} |', f"| Passage total after verified intake | {format(current, ',') if done else 'Pending'} |", f'| Current passage delta | {current-before:,} |']
    if current-before < 100000: lines.extend(['', 'The bulk harvest and local intake are still processing; final passage growth has not yet been measured.'])
    (state / 'bulk-report.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__': main()
