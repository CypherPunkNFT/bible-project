"""Acquire offered modern texts for private, noncommercial reading.

No public republication or app indexing is performed. Original source bytes,
source identifiers and download/processing provenance are preserved separately.
Run --source piper or rogers; reruns reuse verified cached responses and assets.
"""
import argparse
import hashlib
import io
import json
import re
import urllib.robotparser
import urllib.error
from urllib.parse import urljoin, urlparse, quote, unquote
from bs4 import BeautifulSoup
from bible.paths import SOURCES
from modern_texts_common import CACHE, REPORT, RUN, SITE, UA, fetch, write

POLICIES = {
    'piper': 'https://www.desiringgod.org/permissions',
    'rogers': 'https://www.lwf.org/about-us/contact-us/copyright-information',
}
HOSTS = {'piper': 'https://www.desiringgod.org', 'rogers': 'https://www.lwf.org'}
SOURCE_IDS = {'piper': 'source-desiring-god', 'rogers': 'source-love-worth-finding'}

def soup(url):
    data, info = fetch(url, delay=.5)
    return BeautifulSoup(data, 'html.parser'), info

def text(el):
    return el.get_text(' ', strip=True) if el else None

def assets_for(data, info, source, identity, suffix, extracted=None):
    aid = 'asset-modern-'+source+'-'+re.sub('[^a-z0-9-]', '-', identity.lower())[:90]+'-'+suffix
    path = SOURCES/'library'/SOURCE_IDS[source]/aid/('original.'+suffix)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if hashlib.sha256(path.read_bytes()).hexdigest() != info['sha256']:
            raise ValueError('Refusing changed original: '+str(path))
    else:
        with path.open('xb') as f: f.write(data)
    result = {k:info[k] for k in ['url','finalUrl','mimeType','byteCount','sha256','retrievedAt']}
    result.update(assetId=aid, relativePath=path.relative_to(SOURCES).as_posix(), format=suffix,
                  rightsCategory='restricted-license', useScope='private-noncommercial-reading',
                  publicHostingAllowed=False, publicFullTextIndexAllowed=False, policyUrl=POLICIES[source])
    if extracted is not None:
        out = CACHE/'text'/(aid+'.txt')
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(extracted, encoding='utf-8', newline='\n')
        result['derivedText'] = dict(path=out.relative_to(SITE).as_posix(),
              sha256=hashlib.sha256(out.read_bytes()).hexdigest(),
              wordCount=len(re.findall(r"\b[\w’'-]+\b", extracted)),
              method=('pypdf text extraction; no OCR or generated content' if suffix=='pdf' else 'BeautifulSoup text extraction; no generated content'), quality='unreviewed')
    write(path.parent/'provenance.json', result)
    return result

def verify_policy(source):
    root=HOSTS[source]
    data, meta=fetch(root+'/robots.txt')
    rp=urllib.robotparser.RobotFileParser();rp.parse(data.decode().splitlines())
    policy, pm=fetch(POLICIES[source])
    content=BeautifulSoup(policy,'html.parser').get_text(' ',strip=True)
    required = 'personal or noncommercial' if source=='piper' else 'personal, non-commercial use'
    if required not in content: raise ValueError('Policy changed; review before acquisition')
    write(REPORT/(source+'-access.json'),dict(policy=pm,robots=meta,checkedOn='2026-10-05',
          decision='Private noncommercial copies only; public hosting and app full-text search not authorized.',
          note='User explicitly authorized downloads of all named authors. This does not amend core-teaching eligibility.'))
    return rp

def piper_inventory(kinds):
    found={}
    for kind in kinds:
        base=HOSTS['piper']+'/authors/john-piper/'+kind
        page=1; pages=1
        while page<=pages:
            url=base+(('?page='+str(page)) if page>1 else '')
            s,meta=soup(url)
            for a in s.select('.pagination a[href]'):
                match=re.search(r'page=(\d+)', a['href'])
                if match: pages=max(pages,int(match[1]))
            cards=s.select('.card--resource')
            if not cards: raise ValueError('No resource cards in index '+url)
            for card in cards:
                a=card.select_one('a[href]')
                if not a: continue
                href=urljoin(url,a['href'])
                if urlparse(href).path.split('/')[1] != kind: continue
                found[href]=dict(url=href,source='piper',kind=kind,
                     title=text(card.select_one('.card--resource__title')),
                     subtitle=text(card.select_one('.card--resource__subtitle')),
                     dateLabel=text(card.select_one('.card--resource__date')),
                     indexUrl=url,indexSha256=meta['sha256'])
            write(REPORT/('piper-'+kind+'-inventory.json'),dict(index=base,lastPage=pages,
                  pagesRead=page,complete=page==pages,items=[v for v in found.values() if v['kind']==kind]))
            if page%10==0 or page==pages: print('Piper inventory',kind,page,'/',pages,'items',len(found),flush=True)
            page+=1
    return list(found.values())

def collect_piper(kinds):
    rp=verify_policy('piper')
    items=piper_inventory(kinds)
    path=REPORT/'piper-results.json'
    results=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for n,item in enumerate(items,1):
        url=item['url']
        if url in results and results[url].get('status')!='error': continue
        try:
            if not rp.can_fetch(UA,url): raise ValueError('Robots disallows '+url)
            data,meta=fetch(url,delay=.5);s=BeautifulSoup(data,'html.parser')
            main=s.select_one('main[data-resource-id]')
            authors=[text(x) for x in s.select('.resource__author .js-modal-author-name')]
            if authors != ['John Piper']:
                results[url]=dict(item,status='author-review',authors=authors)
            else:
                body=s.select_one('.resource__body')
                bodytext=body.get_text('\n',strip=True) if body else ''
                title=text(s.select_one('h1'))
                date=s.select_one('time.resource__date')
                rec=dict(item,title=title,sourceResourceId=main.get('data-resource-id') if main else None,
                     authors=authors,dateLabel=text(date),dateAttributes=dict(date.attrs) if date else {},
                     dateMeaning='Source resource date; preaching/publication not independently collated',
                     scripture=[text(x) for x in s.select('a[data-grouping-type="Scripture"]')],
                     sourceSeries=[dict(label=text(x),url=urljoin(url,x['href'])) for x in s.select('a[data-grouping-type="Series"]')],
                     media=[dict(x.attrs) for x in s.select('audio,video')],
                     availableDownloads=[dict(label=text(a),url=urljoin(url,a['href'])) for a in s.select('a[href]') if any(x in a['href'] for x in ['/download/','.pdf','.epub'])],
                     textKind='written-message-not-verified-verbatim' if item['kind']=='messages' else item['kind'],
                     assets=[])
                if len(bodytext.split())>=150:
                    ident=rec['sourceResourceId'] or hashlib.sha256(url.encode()).hexdigest()[:16]
                    rec['assets']=[assets_for(data,meta,'piper',ident,'html',
                         title+'\n'+url+'\nBy John Piper. © Desiring God Foundation.\nPrivate noncommercial reading copy.\n\n'+bodytext)]
                    rec['status']='downloaded';rec['bodyWordCount']=len(bodytext.split())
                else:
                    rec['status']='no-substantial-text';rec['bodyWordCount']=len(bodytext.split())
                results[url]=rec
        except Exception as exc:
            results[url]=dict(item,status='error',error=str(exc))
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (403,429):
                write(path,results)
                print('Stopped Piper on access/rate response',exc.code,url,flush=True)
                return
        write(path,results)
        if n%25==0 or n==len(items): print('Piper texts',n,'/',len(items), 'downloaded',sum(x.get('status')=='downloaded' for x in results.values()),flush=True)

def collect_rogers():
    rp=verify_policy('rogers')
    root=HOSTS['rogers']
    data,meta=fetch(root+'/sitemaps-1-sitemap.xml')
    indexes=[x.text for x in BeautifulSoup(data,'xml').select('loc') if 'section-sermonOutlines' in x.text]
    items=[]
    for url in indexes:
        data,meta=fetch(url)
        items.extend(dict(url=x.text,source='rogers',indexUrl=url,indexSha256=meta['sha256']) for x in BeautifulSoup(data,'xml').select('loc'))
    write(REPORT/'rogers-inventory.json',dict(indexes=indexes,complete=True,items=items))
    print('Rogers indexed',len(items),flush=True)
    path=REPORT/'rogers-results.json';results=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for n,item in enumerate(items,1):
        url=item['url']
        if url in results and results[url].get('status')!='error': continue
        try:
            if not rp.can_fetch(UA,url): raise ValueError('Robots disallows '+url)
            s,meta=soup(url)
            links={urljoin(url,a['href']):text(a) for a in s.select('a[href]') if '.pdf' in a['href'].lower() and any(t in (text(a) or '').lower() for t in ['transcript','outline'])}
            rec=dict(item,title=text(s.select_one('h1')),status='no-download',assets=[],
                     sourcePageSha256=meta['sha256'],publicationDateMeaning='Website date is not inferred to be preaching date',
                     mediaLinks=[dict(url=urljoin(url,a['href']),label=text(a)) for a in s.select('a[href]') if '/sermons/' in a['href']])
            for pdf,label in links.items():
                if not rp.can_fetch(UA,pdf): raise ValueError('Robots disallows '+pdf)
                pdf=quote(pdf,safe=':/?=&%')
                data,pm=fetch(pdf,delay=.5)
                if not data.startswith(b'%PDF'): raise ValueError('Expected PDF '+pdf)
                from pypdf import PdfReader
                reader=PdfReader(io.BytesIO(data))
                first='\n'.join(p.extract_text() or '' for p in reader.pages[:3])
                full='\n'.join(p.extract_text() or '' for p in reader.pages)
                # File label and document heading must support a full-transcript claim.
                has_transcript=bool(re.search(r'SERMON\s+TRANSCRIPT',full,re.I)) or ('transcript' in label.lower() and len(full.split())>=1500)
                aid=hashlib.sha256(pdf.encode()).hexdigest()[:20]
                asset=assets_for(data,pm,'rogers',aid,'pdf',full)
                asset.update(pageCount=len(reader.pages),linkLabel=label,
                    textKind='transcript-with-possible-outline' if has_transcript else 'outline-or-other-needs-review',
                    printedSermonNumbers=sorted(set(re.findall(r'(?:SERMON\s+REFERENCE|SERMON\s*#|#)\s*:?\s*(\d{3,5})',first,re.I))))
                asset['derivedText']['method']='pypdf text extraction; no OCR or generated content'
                rec['assets'].append(asset)
            if rec['assets']: rec['status']='downloaded'
            results[url]=rec
        except Exception as exc:
            results[url]=dict(item,status='error',error=str(exc))
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (403,429):
                write(path,results)
                print('Stopped Rogers on access/rate response',exc.code,url,flush=True)
                return
        write(path,results)
        if n%25==0 or n==len(items): print('Rogers texts',n,'/',len(items),'downloaded',sum(x.get('status')=='downloaded' for x in results.values()),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',choices=['piper','rogers'],required=True)
    p.add_argument('--kinds',nargs='+',default=['messages'],choices=['messages','articles','interviews'])
    args=p.parse_args()
    if args.source=='piper': collect_piper(args.kinds)
    else: collect_rogers()
