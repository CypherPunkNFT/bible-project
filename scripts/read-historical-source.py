"""Display a retained L13 unit/claim source span after verifying both hashes."""
import argparse
import hashlib
import json
from pathlib import Path
from bible.paths import SOURCES

OUT=Path(__file__).resolve().parents[1]/'content/library/reports/historical-lives'

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('id'); args=p.parse_args()
    rows=[]
    for filename,key in [('historical-claims.json','claims'),('inventory.json','units')]:
        rows+=json.loads((OUT/filename).read_text(encoding='utf-8'))[key]
    row=next((r for r in rows if r['id']==args.id),None)
    if row is None: p.error('Unknown L13 claim or unit ID')
    loc=row.get('evidence',row if 'characterSpan' in row else row.get('inventoryEvidence'))
    if not loc or 'characterSpan' not in loc: p.error('No retained character span; use the printed locator in inventory.json')
    f=next(f for f in json.loads((OUT/'acquisition-manifest.json').read_text())['files'] if f.get('assetId')==loc['assetId'])
    raw=(SOURCES/f['relativePath']).read_bytes()
    if len(raw)!=f['byteCount'] or hashlib.sha256(raw).hexdigest()!=f['sha256']: raise ValueError('Original file integrity mismatch')
    text=raw.decode('utf-8-sig'); s=loc['characterSpan']; selected=text[s['start']:s['end']]
    if hashlib.sha256(selected.encode()).hexdigest()!=loc['payloadSha256']: raise ValueError('Source span integrity mismatch')
    print(row['id']+' — '+row['locator']); print(selected)

if __name__=='__main__': main()
