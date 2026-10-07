"""Acquire only the book files offered by John Piper's official ministry.

Samples and full books are explicitly distinct. Download permission does not
authorize public republication. Third-party retailer checkouts are not followed.
"""
import hashlib
import importlib.util
import io
import json
import urllib.error
import re
import fitz
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from pypdf import PdfReader
from modern_texts_common import SITE, REPORT, CACHE, fetch, write, UA
spec=importlib.util.spec_from_file_location('collector',SITE/'scripts/collect-modern-texts.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
spec2=importlib.util.spec_from_file_location('expanded',SITE/'scripts/collect-expanded-libraries.py')
expanded=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(expanded)

def main():
    rp=c.verify_policy('piper')
    base='https://www.desiringgod.org/books'
    data,meta=fetch(base);s=BeautifulSoup(data,'html.parser')
    urls=sorted({urljoin(base,a['href']) for a in s.select('main a[href]') if a['href'].startswith('/books/') and not a['href'].startswith('/books/all')})
    write(REPORT/'piper-books-inventory.json',dict(source=base,sourceSha256=meta['sha256'],
          scope='Links offered on the official book landing page, followed by author filtering; not a complete bibliography',complete=False,urls=urls))
    path=REPORT/'piper-books-results.json';results=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for n,url in enumerate(urls,1):
        if url in results and results[url]['status']!='error':continue
        try:
            if not rp.can_fetch(UA,url):raise ValueError('Robots blocked')
            data,meta=fetch(url);s=BeautifulSoup(data,'html.parser')
            authors=[c.text(x) for x in s.select('.resource__authors--books .js-modal-author-name')]
            rec=dict(url=url,title=c.text(s.select_one('h1.resource__title')),authors=authors,assets=[],status='no-offered-download',sourcePageSha256=meta['sha256'])
            if 'John Piper' not in authors:
                rec['status']='outside-author-scope'
            else:
                offered=s.select('.download-option a[href]')
                full_epubs=[a for a in offered if urlparse(a['href']).path.lower().endswith('.epub') and 'sample' not in c.text(a).lower()]
                for a in full_epubs[:1] or offered:
                    file=urljoin(url,a['href']);suffix=urlparse(file).path.rsplit('.',1)[-1].lower()
                    if suffix not in ['pdf','epub']:continue
                    if urlparse(file).netloc!='www.desiringgod.org' or not rp.can_fetch(UA,file):
                        raise ValueError('Unreviewed file host or robots restriction '+file)
                    label=c.text(a);raw,info=fetch(file)
                    if suffix=='pdf' and not raw.startswith(b'%PDF'):raise ValueError('Not PDF '+file)
                    if suffix=='epub' and not raw.startswith(b'PK'):raise ValueError('Not EPUB '+file)
                    aid=hashlib.sha256(file.encode()).hexdigest()[:20]
                    asset=c.assets_for(raw,info,'piper',aid,suffix)
                    asset.update(title=rec['title'],sourcePage=url,linkLabel=label,
                         author='John Piper',
                         textKind='book-sample' if 'sample' in label.lower() else 'offered-book-edition',
                         note='Publisher exceptions retained: this offered download is a personal reading copy, not an open license.')
                    if suffix=='pdf':
                        doc=fitz.open(stream=raw,filetype='pdf');asset['pageCount']=len(doc)
                        content='\n\n'.join(page.get_text() for page in doc)
                    else:
                        content,edition=expanded.epub_text(raw)
                        asset['editionMetadataXml']=edition
                    text_path=CACHE/'text'/(asset['assetId']+'.txt')
                    text_path.parent.mkdir(parents=True,exist_ok=True)
                    text_path.write_text(content,encoding='utf-8')
                    asset['derivedText']=dict(path=text_path.relative_to(SITE).as_posix(),
                        sha256=hashlib.sha256(text_path.read_bytes()).hexdigest(),
                        wordCount=len(re.findall(r"\b[\w’'-]+\b",content)),
                        method='Offered EPUB spine / PDF text layer; no OCR',quality='unreviewed')
                    write((c.SOURCES/asset['relativePath']).parent/'provenance.json',asset)
                    rec['assets'].append(asset)
                if rec['assets']:rec['status']='downloaded'
            results[url]=rec
        except Exception as exc:
            results[url]=dict(url=url,status='error',error=str(exc),assets=[])
            if isinstance(exc,urllib.error.HTTPError) and exc.code in [403,429]:
                write(path,results);print('Book batch stopped on access/rate response',exc.code,flush=True);return
        write(path,results)
        if n%10==0 or n==len(urls):print('Piper books',n,'/',len(urls),flush=True)

if __name__=='__main__':main()
