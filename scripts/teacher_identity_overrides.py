"""Source-hash-bound metadata corrections; never changes text or availability."""
import json
from pathlib import Path

def load_overrides(site):
    import sys
    if str(Path(site)) not in sys.path:sys.path.insert(0,str(Path(site)))
    from knowledge.library_identity import load_identities
    path=Path(site)/'content/teachers/edition-identities.json'
    data=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'records':[]}
    rows={r['sha256']:r for r in data['records']}
    if len(rows)!=len(data['records']): raise ValueError('Duplicate identity override hash')
    forbidden={'availability','pages','pageBundles','licence','licenseUrl','sourceUrl','sha256','id'}
    for sha,row in rows.items():
        if len(sha)!=64 or any(c not in '0123456789abcdef' for c in sha): raise ValueError('Invalid original hash')
        if forbidden.intersection(row['fields']): raise ValueError('Identity override cannot change text, rights or routing')
        for kind in ['work','edition']:
            record=json.loads((Path(site)/f'content/library/catalog/{kind}s/{row["fields"][kind+"Id"]}.json').read_text(encoding='utf-8'))
            if record['id']!=row['fields'][kind+'Id']: raise ValueError('Canonical identity mismatch')
            if kind=='edition' and record['workId']!=row['fields']['workId']: raise ValueError('Broken edition/work binding')
    for sha,row in load_identities(site).items():
        if sha in rows:
            for k,v in row['fields'].items():
                if rows[sha]['fields'].get(k) not in (None,'',v):raise ValueError('Conflicting identity owners')
                rows[sha]['fields'][k]=v
        else:rows[sha]={'sha256':sha,'fields':row['fields'],'credits':[],'evidence':row.get('evidence',[]),'fillOnly':True}
    return rows

def apply_record(record, overrides):
    row=overrides.get(record.get('sha256'))
    if row and row.get('fillOnly'):
        from knowledge.library_identity import fill_identity
        return fill_identity(record,overrides)
    return record | row['fields'] if row else record

def apply_package(folder, overrides):
    """Update selected records and shelf metadata, preserving all page bundles."""
    import hashlib
    folder=Path(folder)
    if not (folder/'records').is_dir(): return []
    changes=[]
    def write(path,value):
        text=json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n'
        if path.read_text(encoding='utf-8')!=text:
            path.write_text(text,encoding='utf-8',newline='\n');changes.append(str(path))
    # General fills can describe corpus-only originals and need no author credit
    # or paired edition. Match existing records by their recorded hash in one pass.
    fills={sha:row for sha,row in overrides.items() if row.get('fillOnly')}
    if fills:
        for path in sorted((folder/'records').glob('*.json')):
            rows=json.loads(path.read_text(encoding='utf-8'));dirty=False
            for rid,before in rows.items():
                after=apply_record(before,fills)
                if after!=before:rows[rid]=after;dirty=True
            if dirty:write(path,rows)
    for sha,override in overrides.items():
        if override.get('fillOnly'):continue
        rid='held-'+sha[:32]; shard=hashlib.sha256(rid.encode()).hexdigest()[:2]
        path=folder/f'records/{shard}.json'
        if not path.exists(): raise ValueError('Missing selected record shard')
        rows=json.loads(path.read_text(encoding='utf-8'));before=rows[rid]
        if before['sha256']!=sha: raise ValueError('Original hash mismatch')
        after=apply_record(before,overrides)
        # No membership change: translators keep their existing shelves, and
        # unresolved contributor identities remain display credits only.
        if set(after['contributors'])!=set(before['contributors']): raise ValueError('Contributor membership change needs explicit reconciliation')
        rows[rid]=after;write(path,rows)
        for cid in after['contributors']:
            packed=folder/f'contributors/{hashlib.sha256(cid.encode()).hexdigest()[:2]}.json'
            unpacked=folder/f'contributors/{cid}.json'
            cp=unpacked if unpacked.exists() else packed
            if not cp.exists(): raise ValueError('Missing contributor shelf')
            data=json.loads(cp.read_text(encoding='utf-8'));items=data if isinstance(data,list) else data[cid]
            matched=[r for r in items if r['id']==rid]
            if len(matched)!=1: raise ValueError('Missing or duplicated selected shelf row')
            matched[0].update({k:after[k] for k in ['title','language','source','availability','genre']})
            write(cp,data)
    path=folder/'catalogue.json';data=json.loads(path.read_text(encoding='utf-8'))
    for row in overrides.values():
        for credit in row['credits']:
            if not credit['contributorId']: continue
            entry=next(c for c in data['contributors'] if c['id']==credit['contributorId'])
            entry['roles']=sorted(set(entry['roles']+[credit['role']]))
    write(path,data)
    return changes

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--package',type=Path,action='append',required=True)
    args=parser.parse_args();site=Path(__file__).resolve().parents[1];overrides=load_overrides(site)
    allowed=[site/'public/content/teacher-library',site/'.local/teacher-library-unpacked',site/'dist/content/teacher-library']
    for folder in args.package:
        if folder.resolve() not in [p.resolve() for p in allowed]: raise ValueError('Unexpected generated package directory')
        print(json.dumps({'package':str(folder),'changed':len(apply_package(folder,overrides))}))
