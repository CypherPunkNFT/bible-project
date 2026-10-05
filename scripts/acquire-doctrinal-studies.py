"""Explicit, bounded L07 acquisition; immutable originals and private TOC evidence."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import time
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/doctrinal-studies'
CACHE=SITE/'.local/library/run-l07-doctrinal-studies-2026-10-05'
spec=importlib.util.spec_from_file_location('l06_acquisition',SITE/'scripts/acquire-scripture-studies.py')
helper=importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
write=helper.write
ITEMS=[('aa-hodge','outlinesoftheolo00hodguoft','work-aa-hodge-outlines','edition-aa-hodge-outlines','1877'),
       ('warfield','planofsalvation00warf','work-warfield-plan','edition-warfield-plan','1915')]
TOCS={**{f'hodge-{n}':f'https://ccel.org/ccel/hodge/theology{n}/theology{n}.toc.html' for n in (1,2,3)},
      'owen':'https://ccel.org/ccel/owen/just/just.toc.html'}

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--fetch',action='store_true',required=True); parser.parse_args()
    write(OUT/'bibliography.json',{'checkedOn':'2026-10-05','boundary':'Four existing works; full chapter/lecture inventories in selected manifestations',
        'works':[{'workId':'work-hodge-systematic','authorId':'author-charles-hodge','editionIds':[f'edition-hodge-systematic-{n}' for n in (1,2,3)],'access':'source-links','sources':list(TOCS.values())[:3]},
                 {'workId':'work-owen-justification','authorId':'author-john-owen','editionIds':['edition-owen-justification'],'access':'source-links','sources':[TOCS['owen']]},
                 *[{'workId':w,'authorId':'author-a-a-hodge' if key=='aa-hodge' else 'author-b-b-warfield','editionIds':[e],'access':'historical-PDF-and-host-OCR','year':year,'sources':['https://archive.org/details/'+item]} for key,item,w,e,year in ITEMS]],
        'deduplication':'Reuse four root works and six edition identities; no root-work duplication or public publication changes.'})
    mp=OUT/'acquisition-manifest.json'
    m=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {'files':[],'tocEvidence':[],'policyEvidence':[]}
    def fetch(url,path,group,ident,**extra):
        old=next((f for f in m[group] if f['key']==ident),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256']; return old
        if path.exists(): raise ValueError('Original exists without provenance; inspect before resuming: '+str(path))
        result=helper.fetch(url,path)
        result.update(key=ident,**extra); m[group].append(result); write(mp,m); return result
    fetch('https://ccel.org/robots.txt',CACHE/'ccel-robots.txt','policyEvidence','ccel-robots')
    print((CACHE/'ccel-robots.txt').read_text(encoding='utf-8'),flush=True)
    for key,item,w,e,year in ITEMS:
        folder=SOURCES/'library/source-internet-archive'
        meta=folder/('asset-l07-'+key+'-metadata')/(item+'.json')
        fetch('https://archive.org/metadata/'+item,meta,'files',key+'-metadata',evidenceOnly=True,itemId=item)
        data=json.loads(meta.read_text(encoding='utf-8'))
        if data.get('is_dark') or str(data.get('metadata',{}).get('access-restricted-item','')).lower()=='true': raise ValueError('Restricted item')
        print(key,data['metadata'].get('date'),data['metadata'].get('publisher'),flush=True)
        files={f['name']:f for f in data['files']}
        for fmt,suffix in [('pdf','.pdf'),('text','_djvu.txt')]:
            name=item+suffix; aid='asset-l07-'+key+'-'+fmt; path=folder/aid/name
            f=files[name]
            if f.get('private'): raise ValueError('Private file')
            r=fetch('https://archive.org/download/'+item+'/'+name,path,'files',key+'-'+fmt,
                    evidenceOnly=False,itemId=item,assetId=aid,editionId=e,workId=w,format=fmt,
                    relativePath=path.relative_to(SOURCES).as_posix(),hostMd5=f['md5'])
            raw=path.read_bytes(); assert len(raw)==int(f['size']) and hashlib.md5(raw).hexdigest()==f['md5']
            if fmt=='pdf': assert raw.startswith(b'%PDF')
            print(aid,len(raw),flush=True); time.sleep(1)
    for key,url in TOCS.items():
        if not any(f['key']==key for f in m['tocEvidence']): time.sleep(10)
        r=fetch(url,CACHE/(key+'.html'),'tocEvidence',key)
        print(key,r['byteCount'],flush=True)

if __name__=='__main__': main()
