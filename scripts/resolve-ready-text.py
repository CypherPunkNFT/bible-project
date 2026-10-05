"""Resolve named existing holdings to ready-made text; never OCR or crawl."""
import argparse
import hashlib
import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse
from html.parser import HTMLParser
import pymupdf
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
OUT=SITE/'content/library/reports/text-backlog'
CACHE=SITE/'.local/library/ready-text-check'
BOOKGENRES={'treatise','commentary','collected-works','devotional','biography','autobiography','history','journal','dictionary','catechism','confession','study-guide'}
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.href=None; self.label=[]; self.text=[]; self.title=[]; self.in_title=False
    def handle_starttag(self,tag,attrs):
        if tag=='a': self.href=dict(attrs).get('href'); self.label=[]
        if tag=='title': self.in_title=True
    def handle_data(self,data):
        self.text.append(data)
        if self.href: self.label.append(data)
        if self.in_title: self.title.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href:
            self.links.append((' '.join(self.label).strip(),self.href)); self.href=None
        if tag=='title': self.in_title=False
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def holdings():
    return [g for g in read(OUT/'inventory.json')['holdings'] if g['genre'] in BOOKGENRES or g['id'].startswith('ia:')]
def local():
    records=[]
    for g in holdings():
        if g['status']!='pdf-text-check-deferred': continue
        checks=[]
        for f in g['files']:
            if f['textKind']!='pdf' or not f['existsLocally']: continue
            path=SOURCES/f['path']
            with pymupdf.open(path) as doc:
                pages=sorted(set([min(2,len(doc)-1),len(doc)//2,max(0,len(doc)-2)]))
                stats=[]
                for i in pages:
                    t=doc[i].get_text()
                    stats.append(dict(pdfPage=i+1,characters=len(t.strip()),words=len(t.split()),sampleSha256=hashlib.sha256(t.encode()).hexdigest()))
                checks.append(dict(path=f['path'],url=f['url'],sha256=hashlib.sha256(path.read_bytes()).hexdigest(),pageCount=len(doc),sampledPages=stats,substantialText=sum(p['words']>80 for p in stats)>=2))
        records.append(dict(holdingId=g['id'],title=g['title'],checks=checks,status='existing-pdf-text-verified' if any(c['substantialText'] for c in checks) else 'pdf-text-partial-or-unresolved',scope='Three page text-layer samples per PDF; no OCR, full collation, or claim of perfect transcription.'))
    write(OUT/'pdf-text-checks.json',dict(date='2026-10-05',records=records))
    print('PDF holdings checked:',len(records),'substantial text:',sum(r['status']=='existing-pdf-text-verified' for r in records),flush=True)

def ccel():
    mp=OUT/'ready-text-acquisition-manifest.json'
    manifest=read(mp) if mp.exists() else dict(files=[],checks=[],failures=[])
    def fetch(url,path,evidence=False):
        old=next((x for x in manifest['files'] if x['url']==url),None)
        if old:
            assert hashlib.sha256(Path(old['path']).read_bytes()).hexdigest()==old['sha256']
            return old
        if path.exists(): raise ValueError('Unmanifested existing file '+str(path))
        time.sleep(1.5)
        req=urllib.request.Request(url,headers={'User-Agent':'BibleProjectLibrary/1.0 (named historical text research)'})
        with urllib.request.urlopen(req,timeout=25) as resp:
            raw=resp.read(); final=resp.url; mime=resp.headers.get_content_type()
        path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(raw)
        f=dict(url=url,finalUrl=final,path=str(path),sha256=hashlib.sha256(raw).hexdigest(),byteCount=len(raw),mimeType=mime,retrievedAt=datetime.now(timezone.utc).isoformat(),evidenceOnly=evidence)
        if not evidence: f['relativePath']=path.relative_to(SOURCES).as_posix()
        manifest['files'].append(f); write(mp,manifest); return f
    for g in holdings():
        if g['status']!='find-existing-text' or any(c['holdingId']==g['id'] for c in manifest['checks']): continue
        urls=[u for u in g['sourceLinks'] if 'ccel.org/ccel/' in u]
        if not urls: continue
        u=urls[0]; parts=urlparse(u).path.split('/')
        author=parts[2]; slug=parts[3].split('.')[0]
        # A chapter in Schaff is not the whole volume; keep the requested document URL.
        specific=author in ['schaff','ursinus']
        info=u if specific else f'https://www.ccel.org/ccel/{author}/{slug}.html'
        try:
            infofile=fetch(info,CACHE/(g['id']+'-info.html'),True)
            soup=Page(); soup.feed(Path(infofile['path']).read_text(encoding='utf-8',errors='replace'))
            links=[(label,urljoin(info,url)) for label,url in soup.links]
            downloads=[url for label,url in links if 'Theological Markup' in label and url.endswith('.xml')]
            if specific:
                text=' '.join(soup.text)
                check=dict(holdingId=g['id'],status='online-document-text-candidate',sourceUrl=info,characters=len(text),pageTitle=' '.join(soup.title),scope='Specific HTML document fetched; body inspection required separately before verification.')
            elif downloads:
                url=downloads[0]
                if not urlparse(url).hostname.endswith('ccel.org'): raise ValueError('Unexpected download host')
                dest=SOURCES/'library/source-ccel'/('asset-ready-text-'+g['id'])/Path(urlparse(url).path).name
                f=fetch(url,dest)
                root=ET.parse(f['path']).getroot(); body=root.find('ThML.body')
                if body is None: raise ValueError('No ThML body')
                text=' '.join(body.itertext())
                assert len(text)>2500,'Insufficient book body'
                title=root.find('.//DC.Title')
                check=dict(holdingId=g['id'],status='ready-transcription-acquired',sourceUrl=info,textUrl=url,relativePath=f['relativePath'],sha256=f['sha256'],characters=len(text),structuralSections=sum(1 for e in body.iter() if re.fullmatch('div[1-6]',e.tag)),sourceTitle=title.text if title is not None else None,scope='Source-offered full ThML book parses; substantial body verified. Not fully proofread or collated against the catalog edition.',rights='CCEL personal/educational permission; no public redistribution clearance.',policyUrl='https://www.ccel.org/about/copyright.html')
            else:
                check=dict(holdingId=g['id'],status='source-needs-followup',sourceUrl=info,reason='No explicit ThML download found; do not infer a full text from a landing page.',offeredLinks=[dict(label=l,url=u) for l,u in links if any(x in l for x in ['Read','Text','HTML'])][:8])
            manifest['checks'].append(check); write(mp,manifest)
            print(g['id'],check['status'],flush=True)
        except Exception as exc:
            manifest['failures'].append(dict(holdingId=g['id'],url=info,error=str(exc))); write(mp,manifest)
            print(g['id'],'FAILED',str(exc),flush=True)

def external():
    # Named primary-source evidence only. No link traversal or bulk book scraping.
    targets={
      'zwemer-christ-index':'https://answeringislam.info/Books/Zwemer/Christ/index.htm',
      'zwemer-christ-body':'https://answeringislam.info/Books/Zwemer/Christ/chap5.htm',
      'zwemer-god-body':'https://answeringislam.info/Books/Zwemer/God/chap1.htm',
      'zwemer-disintegration-metadata':'https://archive.org/metadata/disintegrationof00zwemrich',
      'flavel-mourners-body':'https://christianreader.app/books/a-token-for-mourners/01-epistle-dedicatory',
      'perkins-golden-chain':'https://quod.lib.umich.edu/e/eebo/A09339.0001.001?view=toc',
      'charnock-attributes':'https://www.gutenberg.org/ebooks/53527',
      'carey-enquiry':'https://www.gutenberg.org/ebooks/11449',
      'hodge-darwinism':'https://www.gutenberg.org/ebooks/19192',
      'hodge-outlines':'https://www.theologue.org/AAHodgeTheology/Theology-AAHodge.html',
      'ryle-parents':'https://www.biblebb.com/files/ryle/parentsjc.htm',
      'bullinger-decades':'https://www.onthewing.org/user/Bullinger%20-%20Decades%20-%20Modern.htm',
      'ames-marrow':'https://www.southernpinesbaptist.net/texts/the-marrow-of-sacred-divinity',
      'puritan-collections':'https://puritanlibrary.com/',
      'piper-brothers':'https://www.desiringgod.org/books/brothers-we-are-not-professionals',
      'piper-nations':'https://www.desiringgod.org/books/let-the-nations-be-glad',
      'packer-evangelism':'https://ivpress.org/evangelism-and-the-sovereignty-of-god',
      'turretin-institutes':'https://www.prpbooks.com/book/institutes-of-elenctic-theology',
      'berkhof-hermeneutics':'https://bakerpublishinggroup.com/products/9780801064777_principles-of-biblical-interpretation',
      'perkins-prophesying':'https://www.monergism.com/thethreshold/sdg/perkins_prophesying.html',
      'machens-liberalism':'https://www.ccel.org/m/machen/liberalism/home.html',
      'gill-exposition':'https://www.biblestudytools.com/commentaries/gills-exposition-of-the-bible/genesis-1-1.html',
      'machen-chapter':'https://www.ccel.org/m/machen/liberalism/chr_and_lib_1.html',
      'hodge-outlines-chapter':'https://www.theologue.org/AAHodgeTheology/chapter01.html',
      'perkins-golden-university-record':'https://quod.lib.umich.edu/cgi/i/idresolver/idresolver-nr?id=A09339.0001.001',
      'sibbes-bruised-reed':'https://www.monergism.com/thethreshold/sdg/bruisedreed.html',
      'white-quran-publisher':'https://bakerpublishinggroup.com/products/9780764209765_what-every-christian-needs-to-know-about-the-quran',
    }
    path=OUT/'external-text-checks.json'; data=read(path) if path.exists() else dict(checks=[])
    for key,url in targets.items():
        if any(c['key']==key for c in data['checks']): continue
        dest=CACHE/(key+'.html')
        try:
            if dest.exists(): raise ValueError('Unmanifested cache '+str(dest))
            req=urllib.request.Request(url,headers={'User-Agent':'BibleProjectLibrary/1.0 (named source verification)'})
            with urllib.request.urlopen(req,timeout=20) as r:
                raw=r.read(); final=r.url
            dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(raw)
            page=Page(); page.feed(raw.decode('utf-8',errors='replace'))
            row=dict(key=key,url=url,finalUrl=final,evidencePath=dest.relative_to(SITE).as_posix(),sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),title=' '.join(page.title),textCharacters=len(' '.join(page.text)),links=[dict(label=l,url=urljoin(final,u)) for l,u in page.links if re.search(r'text|epub|read|html|chapter|download|volume|vol\.|txt',l,re.I)][:70],status='fetched-for-inspection')
            if 'metadata' in key:
                meta=json.loads(raw); row.update(metadata=meta.get('metadata'),textFiles=[dict(name=f['name'],format=f.get('format'),size=f.get('size'),private=f.get('private')) for f in meta.get('files',[]) if f['name'].endswith('_djvu.txt')])
            data['checks'].append(row)
            print(key,len(raw),flush=True)
        except Exception as exc:
            data['checks'].append(dict(key=key,url=url,status='fetch-failed',error=str(exc))); print(key,'FAILED',flush=True)
        write(path,data); time.sleep(1)

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--local',action='store_true'); p.add_argument('--ccel',action='store_true'); p.add_argument('--external',action='store_true'); a=p.parse_args()
    if a.local: local()
    if a.ccel: ccel()
    if a.external: external()
