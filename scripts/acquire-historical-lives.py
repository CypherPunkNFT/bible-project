"""L13 named historical editions: bibliography first, immutable originals, no crawler."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import urllib.parse
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/historical-lives'
CACHE=SITE/'.local/library/run-l13-historical-lives-2026-10-05'
spec=importlib.util.spec_from_file_location('fetch_helper',SITE/'scripts/acquire-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
write=h.write

def main():
    p=argparse.ArgumentParser(); p.add_argument('--discover',action='store_true'); p.add_argument('--fetch',action='store_true'); args=p.parse_args()
    mp=OUT/'acquisition-manifest.json'; m=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {'files':[],'failures':[]}
    def fetch(url,path,key,**extra):
        old=next((f for f in m['files'] if f['key']==key),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256']; return old
        if path.exists(): raise ValueError('Unmanifested original: '+str(path))
        result=h.fetch(url,path); result.update(key=key,**extra); m['files'].append(result); write(mp,m); return result
    if args.discover:
        queries={'brainerd':'title:("memoirs" AND "Brainerd") AND year:1822',
                 'mcheyne':'title:("memoir" AND "remains") AND creator:("Bonar") AND year:[1844 TO 1900]'}
        write(OUT/'discovery-plan.json',dict(date='2026-10-05',queries=queries,scope='Named historic editions only; inspect metadata and front matter before acquiring content.'))
        for key,q in queries.items():
            url='https://archive.org/advancedsearch.php?'+urllib.parse.urlencode({'q':q,'output':'json','rows':8,'fl[]':['identifier','title','date']},doseq=True)
            fetch(url,CACHE/(key+'-search.json'),key+'-search',evidenceOnly=True)
            print(key,json.loads((CACHE/(key+'-search.json')).read_text())['response']['docs'],flush=True)
    if args.fetch:
        bibliography=json.loads((OUT/'bibliography.json').read_text(encoding='utf-8'))
        for item in bibliography['editions']:
            key=item['key']; iid=item['itemId']; base='https://archive.org/'
            if item.get('mirrorUrl'):
                aid='asset-l13-'+key+'-html'; name=item['mirrorUrl'].rsplit('/',1)[1]
                path=SOURCES/'library/source-gutenberg'/aid/name
                fetch(item['mirrorUrl'],path,key+'-html',evidenceOnly=False,assetId=aid,relativePath=path.relative_to(SOURCES).as_posix(),format='html',editionKey=key)
                print(aid,path.stat().st_size,flush=True); continue
            folder=SOURCES/'library/source-internet-archive'
            meta=folder/('asset-l13-'+key+'-metadata')/(iid+'.json')
            fetch(base+'metadata/'+iid,meta,key+'-metadata',evidenceOnly=True,itemId=iid)
            data=json.loads(meta.read_text(encoding='utf-8'))
            if not data.get('metadata'):
                failure=dict(key=key,url=base+'metadata/'+iid,reason='No item metadata; candidate is not an identified content holding.')
                if failure not in m['failures']: m['failures'].append(failure); write(mp,m)
                print('Unavailable candidate',iid,flush=True); continue
            if data.get('is_dark') or str(data.get('metadata',{}).get('access-restricted-item','')).lower()=='true': raise ValueError('Restricted item '+iid)
            print(key,data['metadata'].get('title'),data['metadata'].get('date'),flush=True)
            for fmt,name in item.get('files',[]):
                info=next(f for f in data['files'] if f['name']==name)
                if info.get('private'): raise ValueError('Private asset')
                aid='asset-l13-'+key+'-'+fmt; path=folder/aid/name
                result=fetch(base+'download/'+iid+'/'+name,path,key+'-'+fmt,evidenceOnly=False,itemId=iid,assetId=aid,relativePath=path.relative_to(SOURCES).as_posix(),format=fmt,editionKey=key)
                raw=path.read_bytes(); assert len(raw)==int(info['size']) and hashlib.md5(raw).hexdigest()==info['md5']
                if fmt=='pdf': assert raw.startswith(b'%PDF')
                print(aid,result['byteCount'],flush=True)
            if not item.get('files'): print([(f['name'],f.get('size')) for f in data['files'] if f['name'].endswith(('.pdf','_djvu.txt'))],flush=True)

if __name__=='__main__': main()
