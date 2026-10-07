"""Download offered Packer PDFs and identified Graham/Sproul reading editions.

This is a private reading acquisition. No store checkout, account creation,
permission request, public upload or audio transcription is performed.
"""
import hashlib
import importlib.util
import io
import json
import re
import urllib.robotparser
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from pypdf import PdfReader
from modern_texts_common import CACHE, REPORT, SITE, fetch, write, UA

spec=importlib.util.spec_from_file_location('collector',SITE/'scripts/collect-modern-texts.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
c.SOURCE_IDS.update(packer='source-cs-lewis-institute',graham='source-billy-graham',sproul='source-free-christian-ebooks')
c.POLICIES.update(packer='https://www.cslewisinstitute.org/resources/revelation-interpretation/',
                 graham='https://billygraham.org/copyright',
                 sproul='https://www.freechristianebooks.org/dl-what-is-the-church.html')

def get(url):
    d,m=fetch(url)
    return BeautifulSoup(d,'html.parser'),m

def download(source,url,label,sourcepage,kind):
    data,meta=fetch(url)
    suffix=urlparse(url).path.rsplit('.',1)[-1].lower()
    if suffix=='pdf' and not data.startswith(b'%PDF'): raise ValueError('Not a PDF '+url)
    if suffix=='epub' and not data.startswith(b'PK'): raise ValueError('Not an EPUB '+url)
    aid=hashlib.sha256(url.encode()).hexdigest()[:20]
    asset=c.assets_for(data,meta,source,aid,suffix)
    asset.update(sourcePage=sourcepage,title=label,textKind=kind)
    if suffix=='pdf':
        reader=PdfReader(io.BytesIO(data));asset['pageCount']=len(reader.pages)
        # Original PDF is the acquired reading copy; text is only inspected for QA.
        first='\n'.join(p.extract_text() or '' for p in reader.pages[:2])
        asset['titlePageVerified']=bool(re.search({'packer':r'Packer','graham':r'Graham','sproul':r'Sproul'}[source],first,re.I))
    return asset

def packer():
    base='https://www.cslewisinstitute.org/resources-category/j-i-packer/'
    robots,rm=fetch('https://www.cslewisinstitute.org/robots.txt')
    rp=urllib.robotparser.RobotFileParser();rp.parse(robots.decode().splitlines())
    items={};pages=1;page=1
    while page<=pages:
        url=base+('page/'+str(page)+'/' if page>1 else '')
        s,m=get(url)
        for a in s.select('a[href]'):
            href=urljoin(url,a['href'].strip())
            match=re.search(r'/j-i-packer/page/(\d+)/',href)
            if match:pages=max(pages,int(match[1]))
            if '/resources/' in href and urlparse(href).netloc=='www.cslewisinstitute.org':
                items[href]=dict(url=href,title=a.get_text(' ',strip=True),indexUrl=url)
        page+=1
    write(REPORT/'packer-inventory.json',dict(pages=pages,complete=True,items=list(items.values())))
    results={}
    for url,item in items.items():
        try:
            if not rp.can_fetch(UA,url):raise ValueError('Robots blocked')
            s,m=get(url);alltext=s.get_text(' ',strip=True)
            if 'Electronic copies of the PDF files may be duplicated' not in alltext:
                results[url]=dict(item,status='permission-review',assets=[]);continue
            # Only explicitly labeled main print-friendly links; exclude sidebar PDFs.
            pdfs={urljoin(url,a['href']) for a in s.select('a[href]') if '.pdf' in a['href'].lower() and 'print' in a.get_text().lower()}
            rec=dict(item,title=c.text(s.select_one('h1')),status='no-offered-pdf',assets=[],
                     policyEvidenceUrl=url,sourcePageSha256=m['sha256'],
                     note='Articles/interviews may include coauthors. No claim of a full sermon transcript or sole authorship.')
            for pdf in pdfs:
                if not rp.can_fetch(UA,pdf):raise ValueError('Robots blocked PDF')
                rec['assets'].append(download('packer',pdf,rec['title'],url,'article-or-interview'))
            if rec['assets']:rec['status']='downloaded'
            results[url]=rec
        except Exception as exc:results[url]=dict(item,status='error',error=str(exc),assets=[])
        write(REPORT/'packer-results.json',results)
        print('Packer',len(results),'/',len(items),results[url]['status'],flush=True)
    write(REPORT/'packer-results.json',results)

GRAHAM=[
 ('How to Find Christ','https://static.billygraham.org/-/bgm-cdn/2015/04/Billy-Graham-Sermon-How-to-Find-Christ.pdf','1958 Hour of Decision'),
 ('The Only Way','https://static.billygraham.org/-/bgm-cdn/2015/04/Billy-Graham-Sermon-The-Only-Way.pdf','1984'),
 ('Prayer','https://static.billygraham.org/cms-uploads/2026/3/22328_Don_Min_Christian_Guidance_Prayer_Sermon_FINAL_Digital_6cc2b365b1.pdf',None),
 ('Hymns for the Soul','https://static.billygraham.org/cms-uploads/2025/2/18757_Hymns_for_the_Soul_8c68899dee.pdf',None),
]

def graham():
    s,m=get(c.POLICIES['graham'])
    if 'does not prohibit personal use' not in s.get_text():raise ValueError('Graham policy changed')
    write(REPORT/'graham-inventory.json',dict(complete=False,scope='Discovered official sermon PDFs and hymn writing, not an author-wide bibliography',
          policy=m,items=[dict(title=t,url=u,sourceDateWitness=d) for t,u,d in GRAHAM]))
    results={}
    for title,url,date in GRAHAM:
        try:
            asset=download('graham',url,title,url,'published-sermon-or-devotional-not-collated-with-audio')
            results[url]=dict(title=title,url=url,sourceDateWitness=date,status='downloaded',assets=[asset])
        except Exception as exc:results[url]=dict(url=url,title=title,status='error',error=str(exc),assets=[])
        write(REPORT/'graham-results.json',results)
    print('Graham PDFs',len(results),flush=True)

def sproul():
    base='https://www.freechristianebooks.org'
    robots,rm=fetch(base+'/robots.txt');rp=urllib.robotparser.RobotFileParser();rp.parse(robots.decode().splitlines())
    s,m=get(base+'/by-author.html')
    # The observed author section contains exactly these two titles.
    links=[urljoin(base,a['href']) for a in s.select('a[href]') if any(x in a['href'] for x in ['dl-what-is-the-church','dl-what-the-great-commission'])]
    results={}
    for url in sorted(set(links)):
        try:
            s,m=get(url);t=s.get_text(' ',strip=True)
            if 'special permission of' not in t or 'Ligonier Ministries' not in t:raise ValueError('Distribution permission not stated')
            rec=dict(url=url,title=c.text(s.select_one('title')),status='downloaded',assets=[],
                     authorizationBasis='Distributor states special permission of Ligonier; no independent grant letter inspected',
                     policyEvidenceSha256=m['sha256'])
            for file in sorted({urljoin(url,a['href']) for a in s.select('a[href]') if urlparse(a['href']).path.lower().endswith(('.pdf','.epub'))}):
                if not rp.can_fetch(UA,file):raise ValueError('Robots blocked')
                rec['assets'].append(download('sproul',file,rec['title'],url,'book'))
            results[url]=rec
        except Exception as exc:results[url]=dict(url=url,status='error',error=str(exc),assets=[])
        write(REPORT/'sproul-results.json',results)
    print('Sproul authorized distributor holdings',len(results),flush=True)

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--source',choices=['packer','graham','sproul'],required=True)
    globals()[p.parse_args().source]()
