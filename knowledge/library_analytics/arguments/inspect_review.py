"""Bounded metadata inspection for the private review projection."""
import json
from .inputs import ROOT, ro, read, lease_status

def main():
    import sys
    if '--deferrals' in sys.argv:
        db=ro(ROOT/'arguments.sqlite3')
        print([dict(r) for r in db.execute('SELECT * FROM reconstruction_deferrals WHERE run_id=?',('kr130-9ff19bd70babb19631821a6d',))]);db.close();return
    if '--catalog' in sys.argv:
        from ..build import PROJECT
        from pathlib import Path
        b=Path(PROJECT)/'Website/content/library'
        a=read(b/'authors.json')['authors']
        print('authors',json.dumps(a[:3],ensure_ascii=False))
        print('author keys',sorted({k for x in a for k in x}))
        print('works',json.dumps(read(next((b/'catalog/works').glob('*.json'))),ensure_ascii=False))
        print('psutil',__import__('psutil').virtual_memory())
        return
    for name in ['delivered-release.json','delivery-complete.json','population.json']:
        value=read(ROOT/name)
        print(name,json.dumps(value,ensure_ascii=False)[:10000])
    db=ro(ROOT/'arguments.sqlite3')
    for row in db.execute('SELECT descriptor_json,disposition,reason FROM scope WHERE run_id=? AND disposition=? LIMIT 3',('kr130-9ff19bd70babb19631821a6d','supported')):
        print('scope',json.dumps(dict(row),ensure_ascii=False))
    print('statement',dict(db.execute('SELECT id,document_id,kind,speaker_label,speaker_role,attribution_basis,endorsement,negation,state,uncertainty_json,work_id,edition_id FROM statements LIMIT 1').fetchone()))
    print('lease',lease_status())
    from ..build import PROJECT
    from pathlib import Path
    base=Path(PROJECT)/'Website/content/library'
    for name in ['authors.json','sources.json']:
        value=read(base/name)
        print(name,str(value)[:9000])
    manifest=read(Path(read(ROOT/'delivered-release.json')['release'])/'release_manifest.json')
    print('manifest',str(manifest)[:9000])
    for row in db.execute('SELECT descriptor_json FROM scope WHERE run_id=? AND document_id LIKE ? LIMIT 1',('kr130-9ff19bd70babb19631821a6d','xml:%')):print('xml',row[0])
    db.close()
if __name__=='__main__':main()
