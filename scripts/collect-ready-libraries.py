"""Acquire explicitly offered reading editions; existing text only, no OCR/model calls."""
import hashlib
import io
import json
import re
import zipfile
import urllib.error
import urllib.robotparser
from urllib.parse import urljoin, urlsplit, quote, unquote
from bs4 import BeautifulSoup
import fitz
from bible.paths import SOURCES
from modern_texts_common import SITE, CACHE, REPORT, UA, fetch, write

MONERGISM = [
 ('Martyn Lloyd-Jones','effectual-calling-regeneration-ebook','transcribed-sermon-compilation'),
 ('Martyn Lloyd-Jones','plight-man-and-power-god-ebook','sermon-book'),
 ('John Murray','covenant-grace-ebook','doctrinal-work'),
 ('J. I. Packer','sola-fide-reformed-doctrine-justification-ebook','essay'),
 ('J. I. Packer','introductory-essay-john-owen%E2%80%99s-death-death-death-christ-christ','introductory-essay'),
 ('Sinclair Ferguson and contributors','pulpit-people-essays-honor-william-still-his-75th-birthday-ebook','edited-anthology'),
]
OUT = REPORT/'ready-library-results.json'
results = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
robots = {}
consecutive_denials = 0

def get(url):
    origin = '{0.scheme}://{0.netloc}'.format(urlsplit(url))
    if origin not in robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            raw,_ = fetch(origin+'/robots.txt')
            rp.parse(raw.decode('utf-8',errors='replace').splitlines())
        except urllib.error.HTTPError as exc:
            if exc.code != 404: raise
            rp.parse([])
        robots[origin] = rp
    rp = robots[origin]
    if not rp.can_fetch(UA,url): raise ValueError('robots disallows '+url)
    return fetch(url, delay=rp.crawl_delay(UA) or 1)

def acquire(author,title,url,page,kind,policy):
    global consecutive_denials
    url = url.replace('http://media.thegospelcoalition.org/','https://media.thegospelcoalition.org/')
    parts=urlsplit(url)
    url=parts._replace(path=quote(unquote(parts.path),safe='/')).geturl()
    # Do not re-request failed or denied file URLs on resume. Other explicitly
    # offered files remain independent acquisition candidates.
    if url in results: return
    record=dict(author=author,title=title,url=url,sourcePage=page,textKind=kind,assets=[])
    try:
        data,meta=get(url)
        consecutive_denials = 0
        ext='epub' if parts.path.lower().endswith('.epub') else 'pdf'
        if ext=='epub':
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                opfs=[n for n in archive.namelist() if n.endswith('.opf')]
                metadata=archive.read(opfs[0]).decode('utf-8',errors='replace') if opfs else ''
                record['editionMetadataXml']=metadata
                content='\n\n'.join(BeautifulSoup(archive.read(n),'html.parser').get_text(' ',strip=True) for n in archive.namelist() if n.endswith(('.html','.xhtml','.htm')))
            pages=None
        else:
            if not data.startswith(b'%PDF'): raise ValueError('Expected PDF')
            doc=fitz.open(stream=data,filetype='pdf')
            pages=len(doc)
            content='\n\n'.join(p.get_text() for p in doc)
        words=len(re.findall(r"\b[\w’'-]+\b",content))
        aid='asset-ready-library-'+hashlib.sha256(url.encode()).hexdigest()[:20]
        folder=SOURCES/'library'/('source-monergism' if 'monergism.com' in url else 'source-gospel-coalition')/aid
        folder.mkdir(parents=True,exist_ok=True)
        original=folder/('original.'+ext)
        original.write_bytes(data)
        text_path=CACHE/'text'/(aid+'.txt');text_path.parent.mkdir(parents=True,exist_ok=True)
        text_path.write_text(content,encoding='utf-8')
        asset=dict(meta,assetId=aid,author=author,title=title,format=ext,relativePath=original.relative_to(SOURCES).as_posix(),
            textKind=kind,sourcePage=page,rightsCategory='restricted-license',useScope='private-noncommercial-reading',
            publicHostingAllowed=False,publicFullTextIndexAllowed=False,policyUrl=policy,
            derivedText=dict(path=text_path.relative_to(SITE).as_posix(),sha256=hashlib.sha256(text_path.read_bytes()).hexdigest(),wordCount=words,
                method='Existing EPUB HTML / PDF text layer; no OCR; no model calls',quality='unreviewed'))
        if pages is not None:asset['pageCount']=pages
        record['assets']=[asset];record['status']='downloaded' if words>=150 else 'no-readable-text'
        write(folder/'provenance.json',asset)
    except Exception as exc:
        record.update(status='error',error=str(exc))
        if isinstance(exc,urllib.error.HTTPError):
            if exc.code==403: consecutive_denials += 1
            if exc.code in (401,429) or consecutive_denials>=3:
                results[url]=record;write(OUT,results);raise
    results[url]=record;write(OUT,results)
    print(author,record['status'],title,flush=True)

def main():
    for author,slug,kind in MONERGISM:
        page='https://www.monergism.com/'+slug
        data,_=get(page);soup=BeautifulSoup(data,'html.parser')
        title=soup.select_one('h1').get_text(' ',strip=True)
        links=[urljoin(page,a['href']) for a in soup.select('a[href]') if a['href'].lower().endswith('.epub') and 'monergism.com/' in urljoin(page,a['href'])]
        if links:acquire(author,title,links[0],page,kind,'https://www.monergism.com/monergism-copyright-permissions')
    inventory=json.loads((REPORT/'carson-library-inventory.json').read_text(encoding='utf-8'))
    seen=set()
    for entry in inventory['links']:
        url=entry['url']
        if not url.lower().endswith('.pdf') or urlsplit(url).netloc!='media.thegospelcoalition.org' or url in seen:continue
        seen.add(url)
        acquire('D. A. Carson',entry['label'],url,inventory['source'],'publication-type-needs-catalog-reconciliation',
            'https://www.thegospelcoalition.org/blogs/justin-taylor/d-carson-publications/')
    print('Finished inventory; review error and no-readable-text rows.',flush=True)

if __name__=='__main__': main()
