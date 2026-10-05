"""L10: three explicitly offered historic PDFs and bounded private research evidence."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import time
import urllib.robotparser
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]; OUT=SITE/'content/library/reports/islam-studies'
CACHE=SITE/'.local/library/run-l10-islam-studies-2026-10-05'
spec=importlib.util.spec_from_file_location('fetcher',SITE/'scripts/acquire-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
BOOKS={
 'zwemer-god':('The Moslem Doctrine of God','1905','https://www.zwemercenter.com/wp-content/uploads/2017/10/Zwemer-Moslem-Doctrine-of-God-.pdf'),
 'zwemer-christ':('The Moslem Christ','1912','https://www.zwemercenter.com/wp-content/uploads/2017/10/Zwemer-Moslem-Christ.pdf'),
 'zwemer-lectures':('The Disintegration of Islam','1915','https://www.zwemercenter.com/wp-content/uploads/2017/10/Zwemer-Disintegration-of-Islam.pdf')}
EVIDENCE={
 'white-debates':'https://www.aomin.org/aoblog/debate/james-whites-debates-online/',
 'white-sacrifice':'https://www.aomin.org/aoblog/islam/opening-and-closing-statements-shabir-ally-debate/',
 'white-canada':'https://www.aomin.org/aoblog/islam/a-quick-report-from-canada/',
 'white-deity':'https://www.aomin.org/aoblog/debate/did-jesus-claim-deity-debate-with-shabir-ally-in-toronto-canada-3-22-2012/',
 'white-salvation':'https://www.aomin.org/aoblog/debate/sin-and-salvation-debate-with-shabir-ally-at-abu-bakr-siddique-mosque-erasmia-south-africa-10-7-2013/',
 'white-trinity':'https://www.aomin.org/aoblog/debate/debate-trinity-and-tawid-yusuf-bux-university-of-johannesburg-south-africa-10-4-2013/',
 'white-prophecy':'https://www.aomin.org/aoblog/debate/debate-is-muhammad-prophesied-in-the-bible-zakir-hussain-london-9-17-2012/',
 'white-bible-quran':'https://www.aomin.org/aoblog/islam/a-wonderful-evening-at-university-college-dublin/',
 'ally-deity':'https://shabirally.wordpress.com/2012/03/27/did-jesus-claim-deity/',
 'ally-consistency':'https://shabirally.wordpress.com/2008/12/29/on-consistency-in-muslim-christian-debates-3/',
 'piper-cross':'https://www.desiringgod.org/articles/the-great-offense-was-jesus-really-crucified',
 'dg-policy':'https://www.desiringgod.org/permissions',
 'q4157-translations':'https://corpus.quran.com/translation.jsp?chapter=4&verse=157',
 'q4171-translations':'https://corpus.quran.com/translation.jsp?chapter=4&verse=171',
 'q1123-translations':'https://corpus.quran.com/translation.jsp?chapter=112&verse=3'}

def main():
    p=argparse.ArgumentParser(); p.add_argument('--fetch',action='store_true',required=True); p.parse_args()
    h.write(OUT/'acquisition-bibliography.json',dict(date='2026-10-05',books=[dict(key=k,title=v[0],claimedYear=v[1],url=v[2],scope='Verify printed title, contents and sample pages before cataloging') for k,v in BOOKS.items()],
      evidence=EVIDENCE,boundary='Three historic PDFs explicitly offered for reading/download. Modern full texts and recordings remain official links; HTML snapshots are private verification evidence, not public acquired corpora.'))
    mp=OUT/'acquisition-manifest.json'; m=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else dict(files=[],failures=[])
    def fetch(url,path,key,**extra):
        old=next((f for f in m['files'] if f['key']==key),None)
        if old:
            assert hashlib.sha256(path.read_bytes()).hexdigest()==old['sha256']; return old
        if path.exists(): raise ValueError('Unmanifested file: '+str(path))
        r=h.fetch(url,path); r.update(key=key,**extra); m['files'].append(r); h.write(mp,m); return r
    policies={}
    for host in ['www.zwemercenter.com','www.aomin.org','shabirally.wordpress.com','www.desiringgod.org','corpus.quran.com']:
        url='https://'+host+'/robots.txt'; path=CACHE/(host+'-robots.txt')
        try:
            r=fetch(url,path,host+'-robots',evidenceOnly=True)
            if 'html' in r['mimeType'].lower() or r['finalUrl'].rstrip('/')!=url.rstrip('/'):
                raise ValueError('Robots endpoint returned HTML or redirected away; policy unresolved')
            robot=urllib.robotparser.RobotFileParser(); robot.parse(path.read_text(encoding='utf-8').splitlines()); policies[host]=robot
        except Exception as error:
            m['failures'].append(dict(url=url,reason=str(error))); h.write(mp,m)
    from urllib.parse import urlsplit
    for key,(title,year,url) in BOOKS.items():
        robot=policies.get(urlsplit(url).netloc)
        if robot is None or not robot.can_fetch('BibleProjectLibrary',url):
            print('Policy unresolved; left link-only:',key,flush=True); continue
        path=SOURCES/'library/source-zwemer-center'/('asset-l10-'+key+'-pdf')/url.rsplit('/',1)[-1]
        r=fetch(url,path,key,evidenceOnly=False,assetId='asset-l10-'+key+'-pdf',relativePath=path.relative_to(SOURCES).as_posix())
        assert path.read_bytes().startswith(b'%PDF'); print(key,r['byteCount'],flush=True)
    for key,url in EVIDENCE.items():
        robot=policies.get(urlsplit(url).netloc)
        if robot is None or not robot.can_fetch('BibleProjectLibrary',url):
            print('Policy unresolved; use consulted web source:',key,flush=True); continue
        try:
            r=fetch(url,CACHE/(key+'.html'),key,evidenceOnly=True); print(key,r['byteCount'],flush=True)
        except Exception as error:
            m['failures'].append(dict(url=url,reason=str(error))); h.write(mp,m); print('Unresolved',key,str(error),flush=True)
        time.sleep(1)

if __name__=='__main__': main()
