"""Publisher journal archives through public bulk catalogues; one attempt per request."""
import html,json,re,hashlib
from urllib.parse import urlencode,urlsplit

def catalogue(source,client,filters):
    import bulk_collect as b
    normalized=b.CACHE/(source+'.json')
    if normalized.exists():return b.read(normalized)
    records=[];page=1
    while True:
        url='https://founders.org/wp-json/wp/v2/media?'+urlencode({
            'per_page':100,'page':page,'media_type':'application','mime_type':'application/pdf','search':'journal'})
        raw=client.cached(f'rb05-founders-journal-media-{page:03}.json',url)
        items=json.loads(raw)
        if not isinstance(items,list):raise RuntimeError('Public journal catalogue returned no media list')
        for item in items:
            target=item.get('source_url','');name=urlsplit(target).path.rsplit('/',1)[-1]
            if not re.search(r'founders[-_ ]*journal',name,re.I):continue
            if re.search(r'cover|preview|sample|advert|order[-_ ]*form',name,re.I):continue
            title=html.unescape(item.get('title',{}).get('rendered','')) or name
            issue=re.search(r'FoundersJournal(\d+)',name,re.I)
            if issue:title='Founders Journal, issue '+str(int(issue[1]))
            records.append(b.row(source,str(item['id']),title,'Founders Ministries; journal editors and article contributors',
                'Baptist churches; ministry; theology; church discipline','en',url=target,format='pdf',
                licence='Publisher freely offered complete journal PDF for private study; copyright and contributor notices retained',
                contributor='Founders Ministries; named contributors in original issue',credit='Founders Journal / Founders Ministries',
                catalogueUrl=url,landingPage=item.get('link'),size=item.get('media_details',{}).get('filesize',0),
                issueNumber=int(issue[1]) if issue else None))
        print(source,'catalogue',page,len(records),flush=True)
        if len(items)<100:break
        page+=1
    b.save(normalized,records);return records

def resolve(record,client):
    """Retain untouched public REST responses and derive the complete HTML-only issue."""
    import bulk_collect as b
    from bulk_ministry import plain
    term=record['termId'];name=f'founders-journal-{term}-posts.json'
    raw=client.cached(name,record['url']);posts=json.loads(raw)
    if not isinstance(posts,list) or not posts or len(posts)==100:raise RuntimeError('No complete public journal article response')
    reviews=[];review_raw=None
    if len(posts)<record['offeredCount']:
        review_url='https://founders.org/wp-json/wp/v2/review?'+urlencode({'journal':term,'per_page':100,'order':'asc'})
        review_raw=client.cached(f'founders-journal-{term}-reviews.json',review_url);reviews=json.loads(review_raw)
    if len(posts)+len(reviews)!=record['offeredCount']:raise RuntimeError('Public issue response does not include every offered article/review; deferred')
    if reviews:
        sha=hashlib.sha256(review_raw).hexdigest();path=b.RAW/'foundersjournal'/f'issue-{term}-reviews-{sha[:16]}.json'
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(review_raw)
        part=record|{'sourceId':record['sourceId']+'-reviews','url':review_url,'path':str(path),'sha256':sha,
            'bytes':len(review_raw),'acquiredAt':b.now(),'campaignMission':b.REPORT.name,'format':'json',
            'part':'Complete issue reviews; companion to full article response','articleCount':len(reviews)}
        b.append_manifest(part);b.save(b.CACHE/'provenance/foundersjournal'/(part['sourceId']+'.json'),part)
    text=record['title']+'\n\n'+'\n\n'.join(plain(p['title']['rendered'])+'\n'+plain(p['content']['rendered']) for p in posts+reviews)
    if len(text.split())<150:raise RuntimeError('Empty issue or catalogue wrapper, not complete reading text')
    path=b.SITE/'.local/library/foundersjournal'/(record['sourceId']+'.txt');path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')
    return record|{'cachedOriginal':str(b.CACHE/name),'articleCount':len(posts)+len(reviews),
        'sourceMetadata':{'articleUrls':[p['link'] for p in posts+reviews],'authorTaxonomyIds':[p.get('author-name',[]) for p in posts+reviews]},
        'derivedText':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,
            'method':'Complete publisher REST article/review HTML text; no OCR; untouched JSON responses retained',
            'title':record['title'],'author':record['author'],'format':'txt','language':'en','licence':record['licence']}}
