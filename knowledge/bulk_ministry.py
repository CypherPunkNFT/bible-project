"""Shared official Founders/DG catalogue collectors; public channels, complete works only."""
import hashlib, html, json, re, zipfile, io
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,urlencode

def backend():
    import bulk_collect as b
    return b

def plain(value):return html.unescape(re.sub(r'<[^>]+>',' ',value or '')).strip()

class Links(HTMLParser):
    def __init__(self,text):
        super().__init__();self.links=[];self.active=None;self.feed(text)
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.active=[dict(attrs).get('href',''),'']
    def handle_data(self,data):
        if self.active is not None:self.active[1]+=data
    def handle_endtag(self,tag):
        if tag=='a' and self.active is not None:self.links.append(tuple(self.active));self.active=None

def catalogue(source,client,filters):
    b=backend();path=b.CACHE/(source+'.json')
    if path.exists():return b.read(path)
    rows=[]
    if source=='desiringgod':
        url='https://www.desiringgod.org/books/all'
        raw=client.cached('rb13-dg-books.html',url).decode('utf-8','replace')
        links=Links(raw).links
        seen=set()
        for href,label in links:
            if not re.fullmatch(r'/books/[a-z0-9-]+',href) or href.endswith('/all') or href in seen:continue
            seen.add(href)
            rows.append(b.row(source,href.rsplit('/',1)[-1],plain(label) or href.rsplit('/',1)[-1],
                'Desiring God contributors','','en',url=urljoin(url,href),format='pdf',
                licence='Publisher-offered free complete electronic edition for private personal/noncommercial use; source notices retained',
                policyUrl='https://www.desiringgod.org/permissions',contributor='Desiring God; book contributors retained'))
    elif source=='founders':
        page=1
        while True:
            url='https://founders.org/wp-json/wp/v2/library-book?'+urlencode({'per_page':100,'page':page})
            name='rb13-founders-books-'+f'{page:03}'+'.json'
            data=json.loads(client.cached(name,url))
            if not isinstance(data,list):raise RuntimeError('Founders public taxonomy did not return book records')
            for term in data:
                rows.append(b.row(source,str(term['id']),plain(term['name']),'Founders Ministries; named historical authors retained in source text',
                    plain(term.get('description','')),'en',url=term.get('link') or 'https://founders.org/library/',format='json',
                    termId=term['id'],description=plain(term.get('description','')),
                    licence='Official publicly offered complete library text; underlying historical works public domain; edition notices retained; private local use',
                    contributor='Founders Ministries',sourceMetadata=term))
            if len(data)<100:break
            page+=1
    b.save(path,rows);return rows

def resolve(record,client):
    b=backend();source=record['source']
    if source=='desiringgod':
        page=client.cached('dg-book-'+record['sourceId']+'.html',record['url']).decode('utf-8','replace')
        offered=[]
        for href,label in Links(page).links:
            target=urljoin(record['url'],html.unescape(href));parts=urlsplit(target)
            if parts.netloc not in {'cdn.desiringgod.org','www.desiringgod.org','desiringgod.org'}:continue
            if not parts.path.lower().endswith(('.pdf','.epub')):continue
            if re.search(r'sample|preview|excerpt|worksheet|study.guide',target+' '+label,re.I):continue
            offered.append(target)
        if not offered:raise RuntimeError('No complete free PDF/EPUB offered; samples/retailer links excluded')
        offered=list(dict.fromkeys(offered));offered.sort(key=lambda x:not urlsplit(x).path.endswith('.epub'))
        title=re.search(r'<h1\b[^>]*>(.*?)</h1>',page,re.I|re.S)
        authors=re.findall(r'class=["\'][^"\']*js-modal-author-name[^"\']*["\'][^>]*>(.*?)</',page,re.S)
        description=re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)',page,re.I)
        return record|{'landingPage':record['url'],'url':offered[0],'format':Path(urlsplit(offered[0]).path).suffix[1:],
            'title':plain(title[1]) if title else record['title'],'author':'; '.join(plain(x) for x in authors) or record['author'],
            'description':html.unescape(description[1]) if description else ''}
    if source=='founders':
        url='https://founders.org/wp-json/wp/v2/library?'+urlencode({'library-book':record['termId'],'per_page':100,'order':'asc'})
        name='founders-work-'+record['sourceId']+'.json';raw=client.cached(name,url);chapters=json.loads(raw)
        if not isinstance(chapters,list) or not chapters:raise RuntimeError('No offered complete text chapters')
        if len(chapters)==100:raise RuntimeError('Book requires additional chapter pages; deferred without retry rather than counted incomplete')
        bodies=[]
        for x in chapters:
            content=x.get('content',{}).get('rendered','')
            if content:bodies.append(plain(x.get('title',{}).get('rendered',''))+'\n'+plain(content))
        text='\n\n'.join(bodies)
        if len(text.split())<150:raise RuntimeError('Catalogue/index wrapper, not complete offered reading text')
        path=b.SITE/'.local/library/founders'/(record['sourceId']+'.txt');path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(text,encoding='utf-8')
        return record|{'landingPage':record['url'],'url':url,'cachedOriginal':str(b.CACHE/name),'format':'json',
            'chapterCount':len(chapters),'derivedText':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'bytes':path.stat().st_size,'method':'Official complete book REST chapter HTML text; no OCR; original JSON retained',
                'title':record['title'],'author':record['author'],'format':'txt','language':'en','licence':record['licence']}}
    return record
