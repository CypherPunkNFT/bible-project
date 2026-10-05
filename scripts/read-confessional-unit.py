"""Resolve an L08 witness unit to its exact, hash-checked source payload."""
import argparse
import hashlib
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('standards',Path(__file__).with_name('catalog-confessional-standards.py'))
c=importlib.util.module_from_spec(spec); spec.loader.exec_module(c)

def retrieve(ident):
    units=c.read(c.OUT/'inventory.json')['units']
    unit=next(u for u in units if u['id']==ident)
    asset=c.read(c.LIB/'catalog/assets'/(unit['assetId']+'.json'))
    raw=(c.SOURCES/asset['relativePath']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=asset['sha256']: raise ValueError('Original asset hash mismatch')
    if 'pointer' in unit:
        result=c.resolve(c.json.loads(raw),unit['pointer']); digest=c.payload_hash(result)
    else:
        span=unit['characterSpan']; result=raw.decode('utf-8-sig')[span['start']:span['end']]
        digest=hashlib.sha256(result.encode()).hexdigest()
    if digest!=unit['payloadSha256']: raise ValueError('Unit payload hash mismatch')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('unit_id'); args=p.parse_args()
    print(c.json.dumps(retrieve(args.unit_id),ensure_ascii=False,indent=2))
