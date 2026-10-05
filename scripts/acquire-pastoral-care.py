"""L11 named-file acquisition, bibliography first; immutable originals, no crawl."""
import argparse
import hashlib
import importlib.util
import json
import time
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/pastoral-care'
spec=importlib.util.spec_from_file_location('fetch_helpers',SITE/'scripts/acquire-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
write=h.write
BOOKS=[
    ('owen-mortification','owen','mort','Of the Mortification of Sin in Believers','work-owen-mortification','edition-owen-mortification',['sanctification','temptation']),
    ('owen-temptation','owen','temptation','Of Temptation','work-l11-owen-temptation','edition-l11-owen-temptation',['temptation','perseverance']),
    ('ryle-holiness','ryle','holiness','Holiness','work-ryle-holiness','edition-ryle-holiness',['assurance','sanctification','perseverance']),
    ('watson-prayer','watson','prayer','The Lord’s Prayer','work-watson-prayer','edition-watson-prayer',['prayer','repentance','temptation']),
    ('boston-crook','boston','crook','The Crook in the Lot','work-boston-crook','edition-boston-crook',['suffering','perseverance']),
    ('flavel-heart','flavel','saintindeed','Keeping the Heart (A Saint Indeed)','work-flavel-heart','edition-flavel-heart',['sanctification','assurance','temptation','suffering']),
    ('gill-practical','gill','practical','A Body of Practical Divinity','work-gill-practical','edition-gill-practical',['prayer','repentance','marriage','parenting','perseverance']),
]

def main():
    p=argparse.ArgumentParser(); p.add_argument('--prepare',action='store_true'); p.add_argument('--fetch',action='store_true'); args=p.parse_args()
    if args.prepare:
        books=[dict(key=k,title=t,authorId='author-'+{'owen':'john-owen','ryle':'j-c-ryle','watson':'thomas-watson','boston':'thomas-boston','flavel':'john-flavel','gill':'john-gill'}[a],
            workId=w,editionId=e,concerns=c,sourceId='source-ccel',format='xml',url=f'https://www.ccel.org/ccel/{a[0]}/{a}/{slug}.xml',
            infoUrl=f'https://www.ccel.org/ccel/{a}/{slug}.html',readerBase=f'https://ccel.org/ccel/{a}/{slug}/{slug}',
            editionNote='Identified CCEL electronic witness; underlying print impression and editorial additions require separate review.') for k,a,slug,t,w,e,c in BOOKS]
        books.append(dict(key='flavel-mourners',title='A Token for Mourners',authorId='author-john-flavel',workId='work-l11-flavel-mourners',
            editionId='edition-l11-flavel-mourners-1813',concerns=['grief','suffering'],sourceId='source-internet-archive',format='scan',itemId='tokenformourners00flav',
            infoUrl='https://archive.org/details/tokenformourners00flav',editionNote='1813 William Fessenden, Brattleborough edition identified by Open Library OL25352651M; verify title and contents after acquisition.'))
        target=OUT/'bibliography.json'
        if target.exists(): raise ValueError('Bibliography already established; edit explicitly rather than overwrite.')
        write(target,dict(date='2026-10-05',scope='Eight named works covering the ten requested pastoral concerns; six existing work/edition identities reused.',works=books,
            access=[dict(source='source-ccel',policy='https://www.ccel.org/about/copyright.html',decision='Named download formats offered by work pages; personal/educational research permitted. No commercial use, republication, or site crawl.'),
                    dict(source='source-internet-archive',decision='Only named unrestricted historical item; inspect metadata, retain original PDF/OCR and verify host hashes.')])); print('Bibliography established')
    if not args.fetch: return
    mp=OUT/'acquisition-manifest.json'; manifest=json.loads(mp.read_text()) if mp.exists() else dict(files=[],failures=[])
    def fetch(url,path,key,**extra):
        old=next((f for f in manifest['files'] if f['key']==key),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256']; return old
        if path.exists(): raise ValueError('Unmanifested original '+str(path))
        data=h.fetch(url,path); data.update(key=key,**extra); manifest['files'].append(data); write(mp,manifest); return data
    books=json.loads((OUT/'bibliography.json').read_text(encoding='utf-8'))['works']
    last=0
    for b in books:
        key=b['key']; sid=b['sourceId']
        if sid=='source-ccel':
            aid='asset-l11-'+key+'-xml'; path=SOURCES/'library'/sid/aid/(b['url'].rsplit('/',1)[-1])
            time.sleep(max(0,10-(time.monotonic()-last)))
            try:
                f=fetch(b['url'],path,key+'-xml',assetId=aid,workKey=key,editionId=b['editionId'],sourceId=sid,format='xml',evidenceOnly=False,relativePath=path.relative_to(SOURCES).as_posix())
                print(key,f['byteCount'],flush=True)
            except Exception as e:
                manifest['failures'].append(dict(key=key,url=b['url'],reason=str(e))); write(mp,manifest); print(key,str(e),flush=True)
            last=time.monotonic()
        else:
            # Owner narrowed acquisition to ready-made transcriptions. Preserve the
            # old manifest/files, but do not resume the former scan/OCR branch.
            print(key, 'deferred: scan/OCR acquisition disabled by text-first scope', flush=True)
            continue
            iid=b['itemId']; path=SOURCES/'library'/sid/('asset-l11-'+key+'-metadata')/(iid+'.json')
            fetch('https://archive.org/metadata/'+iid,path,key+'-metadata',evidenceOnly=True)
            meta=json.loads(path.read_text()); assert meta.get('metadata') and not meta.get('is_dark') and str(meta['metadata'].get('access-restricted-item')).lower()!='true'
            print('IA identity',meta['metadata'].get('title'),meta['metadata'].get('date'),flush=True)
            for suffix,fmt in [('.pdf','pdf'),('_djvu.txt','text')]:
                name=iid+suffix; info=next(f for f in meta['files'] if f['name']==name); assert not info.get('private')
                aid='asset-l11-'+key+'-'+fmt; path=SOURCES/'library'/sid/aid/name
                f=fetch('https://archive.org/download/'+iid+'/'+name,path,key+'-'+fmt,assetId=aid,workKey=key,editionId=b['editionId'],sourceId=sid,format=fmt,evidenceOnly=False,relativePath=path.relative_to(SOURCES).as_posix())
                raw=path.read_bytes(); assert len(raw)==int(info['size']) and hashlib.md5(raw).hexdigest()==info['md5']
                if fmt=='pdf': assert raw.startswith(b'%PDF')
                print(key,fmt,len(raw),flush=True)

if __name__=='__main__': main()
