"""L08 bounded acquisition of explicitly licensed historical confessional witnesses."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/confessional-standards'
CACHE=SITE/'.local/library/run-l08-confessional-standards-2026-10-05'
spec=importlib.util.spec_from_file_location('l06',SITE/'scripts/acquire-scripture-studies.py')
helper=importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
write=helper.write
FILES={
 'wcf':'westminster_confession_of_faith.json',
 'wsc':'westminster_shorter_catechism.json',
 'wlc':'westminster_larger_catechism.json',
 'lbc':'london_baptist_1689.json',
 'baptist':'1695_baptist_catechism.json',
 'flavel':'exposition_of_the_assemblies_catechism.json',
}

def main():
    p=argparse.ArgumentParser(); p.add_argument('--fetch',action='store_true',required=True); p.parse_args()
    write(OUT/'bibliography.json',{'date':'2026-10-05','scope':'Six named historic English texts; digital witnesses must be inspected for edition variants.',
      'repository':'https://github.com/NonlinearFruit/Creeds.json','selectedFiles':FILES,
      'excluded':'Savoy Declaration is explicitly excluded from repository Unlicense; continental translations await edition and rights review.',
      'method':'Pin repository commit; retain unmodified JSON and README rights statement; inspect all numbering, questions, answers and proof attachments before cataloging.'})
    mp=OUT/'acquisition-manifest.json'
    m=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {'files':[]}
    def fetch(url,path,key,**extra):
        old=next((f for f in m['files'] if f['key']==key),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256']; return old
        if path.exists(): raise ValueError('Unmanifested original: '+str(path))
        r=helper.fetch(url,path); r.update(key=key,**extra); m['files'].append(r); write(mp,m); return r
    fetch('https://api.github.com/repos/NonlinearFruit/Creeds.json/commits/master',CACHE/'commit.json','commit',evidenceOnly=True)
    sha=json.loads((CACHE/'commit.json').read_text(encoding='utf-8'))['sha']
    m['commit']=sha; write(mp,m)
    base='https://raw.githubusercontent.com/NonlinearFruit/Creeds.json/'+sha+'/'
    folder=SOURCES/'library/source-creeds-json'
    fetch(base+'README.md',folder/'license-evidence/README.md','license',evidenceOnly=True)
    fetch('https://api.github.com/repos/NonlinearFruit/Creeds.json/git/trees/'+sha+'?recursive=1',CACHE/'tree.json','tree',evidenceOnly=True)
    for key,name in FILES.items():
        path=folder/('asset-l08-'+key+'-json')/name
        r=fetch(base+'creeds/'+name,path,key,evidenceOnly=False,assetId='asset-l08-'+key+'-json',relativePath=path.relative_to(SOURCES).as_posix())
        print(key,r['byteCount'],flush=True)
    fetch('https://api.github.com/repos/lwalen/lbcf/commits/HEAD',CACHE/'lbc-commit.json','lbc-commit',evidenceOnly=True)
    lsha=json.loads((CACHE/'lbc-commit.json').read_text(encoding='utf-8'))['sha']
    m['lbcCommit']=lsha; write(mp,m)
    lbase='https://raw.githubusercontent.com/lwalen/lbcf/'+lsha+'/'
    for name in ['LICENSE','README.md','lbcf.json','lbcf_with_scripture_refs.md']:
        key='lbc-cc0-'+name.replace('.','-').replace('_','-').lower()
        path=SOURCES/'library/source-lwalen-lbcf'/('asset-l08-'+key)/name
        r=fetch(lbase+name,path,key,evidenceOnly=name in ['LICENSE','README.md'],assetId='asset-l08-'+key,relativePath=path.relative_to(SOURCES).as_posix())
        print(key,r['byteCount'],flush=True)
    fetch('https://archive.org/metadata/anexpositionass00flavgoog',CACHE/'flavel-metadata.json','flavel-metadata',evidenceOnly=True)
    meta=json.loads((CACHE/'flavel-metadata.json').read_text(encoding='utf-8'))
    name='anexpositionass00flavgoog.pdf'
    info=next(f for f in meta['files'] if f['name']==name)
    assert not info.get('private') and meta['metadata']['date']=='1767'
    path=SOURCES/'library/source-internet-archive/asset-l08-flavel-1767-pdf'/name
    fetch('https://archive.org/download/anexpositionass00flavgoog/'+name,path,'flavel-1767-pdf',evidenceOnly=False,
          assetId='asset-l08-flavel-1767-pdf',relativePath=path.relative_to(SOURCES).as_posix(),hostMd5=info['md5'])
    assert path.read_bytes().startswith(b'%PDF') and hashlib.md5(path.read_bytes()).hexdigest()==info['md5']
    print('Pinned commit',sha,flush=True)

if __name__=='__main__': main()
