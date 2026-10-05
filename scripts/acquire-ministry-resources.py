"""L12: one identified historic lecture volume, original scan and host OCR only."""
import argparse
import hashlib
import importlib.util
from pathlib import Path
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];OUT=SITE/'content/library/reports/ministry-resources'
spec=importlib.util.spec_from_file_location('acq',SITE/'scripts/acquire-scripture-studies.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
ITEM='lecturestomystud00spurrich'

def main():
    p=argparse.ArgumentParser();p.add_argument('--fetch',action='store_true',required=True);p.parse_args()
    h.write(OUT/'acquisition-bibliography.json',dict(date='2026-10-05',title='Lectures to My Students, first series',author='Charles Haddon Spurgeon',editionLead='Sheldon & Co., New York, 1875; verify against scan',itemId=ITEM,url='https://archive.org/details/'+ITEM,scope='One historical volume; thirteen lectures expected from the first-series contents. PDF and host OCR are two manifestations, not two works.'))
    mp=OUT/'acquisition-manifest.json'
    import json
    m=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else dict(files=[],failures=[])
    def get(url,path,aid,**extra):
        old=next((f for f in m['files'] if f['assetId']==aid),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256'];return old
        f=h.fetch(url,path);f.update(assetId=aid,**extra);m['files'].append(f);h.write(mp,m);return f
    cache=SITE/'.local/library/run-l12-ministry-resources-2026-10-05'
    meta=get('https://archive.org/metadata/'+ITEM,cache/(ITEM+'.json'),'asset-l12-spurgeon-metadata',evidenceOnly=True)
    data=json.loads(Path(meta['path']).read_text(encoding='utf-8'))
    assert not data.get('is_dark') and data.get('metadata',{}).get('access-restricted-item')!='true'
    fs={f['name']:f for f in data['files']}
    for suffix,fmt in [('.pdf','pdf'),('_djvu.txt','text')]:
        name=ITEM+suffix; f=fs[name];aid='asset-l12-spurgeon-lectures-'+fmt
        path=SOURCES/'library/source-internet-archive'/aid/name
        r=get('https://archive.org/download/'+ITEM+'/'+name,path,aid,evidenceOnly=False,format=fmt,relativePath=path.relative_to(SOURCES).as_posix(),hostMd5=f['md5'])
        raw=path.read_bytes();assert len(raw)==int(f['size']) and hashlib.md5(raw).hexdigest()==f['md5']
        if fmt=='pdf':assert raw.startswith(b'%PDF')
        print(aid,r['byteCount'],flush=True)

if __name__=='__main__':main()
