"""Collect full papers offered through an approved ministry/author's resource pages."""
import argparse,hashlib,html,json,re,time,urllib.parse
from pathlib import Path
from collect_written_archive import Written,parsed,text
import bulk_collect as b

class Papers(Written):
 def __init__(self,source,mission):
  self.source=source;b.REPORT=b.SITE/'content/library/reports/reformed-baptist-overnight'/mission
  self.client=b.Client(attempts=1,timeout=20);self.held=b.Holdings()
  self.state={'source':source,'state':'running','startedAt':b.now(),'downloaded':0,'attempted':0,'bytes':0,'heldDuringRun':0,'duplicateHashes':0,'excludedMediaOrNotWritten':0,'failures':[]}
  self.status=b.REPORT/(source+'-papers-acquisition.json')
  previous=b.read(self.status,{})
  if previous:
   self.state.update(previous);self.state['state']='running'
   self.state['failures']=[x for x in previous.get('failures',[]) if not (x['sourceId']=='paper-catalogue' and "'str' object has no attribute 'get'" in x['error'])]
  self.update()
 def run(self):
  origin={'aomin':'https://www.aomin.org/aoblog','kruger':'https://michaeljkruger.com'}[self.source]
  documents={};count=0
  try:
   for page in range(1,50):
    url=origin+'/wp-json/wp/v2/pages?per_page=100&page='+str(page)
    rows=json.loads(self.client.cached('rb08-'+self.source+f'-pages-{page:03}.json',url));count+=len(rows)
    for row in rows:
     title=text(row['title']['rendered']);fragment=row.get('content',{}).get('rendered','')
     if row.get('content',{}).get('protected') or not fragment:continue
     root=parsed('<div>'+fragment+'</div>')
     if self.source=='aomin' and '/store/' not in row['link'] and re.search(r'Statement of Faith|Responses to|Baptism in the Early Church',title,re.I):
      original=('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+html.escape(title)+'</title></head><body><article><h1>'+html.escape(title)+'</h1>'+fragment+'</article></body></html>').encode('utf-8')
      self.save('page-'+str(row['id']),title,'Alpha and Omega Ministries',row['link'],original,sourceApi=url,textKind='ministry written page',sourceMetadata={'authorId':row.get('author')})
      self.update()
     # Curated writing/resource collections; never stores, forms or media indexes.
     if not re.search(r'articles|papers|resources|writings|publications|free books',title,re.I):continue
     for anchor in root.xpath('//a[@href]'):
      target=urllib.parse.urljoin(row['link'],anchor.get('href'));parts=urllib.parse.urlsplit(target)
      host=parts.netloc.lower()
      external_articles={'www.thegospelcoalition.org','themelios.thegospelcoalition.org','www.crossway.org','www.reformation21.org','www.ligonier.org','tabletalkmagazine.com','www.risenmotherhood.com'}
      is_pdf=parts.path.lower().endswith('.pdf')
      is_article=self.source=='kruger' and host in external_articles and bool(re.search(r'/(?:articles?|reviews?|blogs?|shelf-life)(?:/|$)',parts.path,re.I))
      if not is_pdf and not is_article:continue
      label=anchor.text_content().strip()
      if re.search(r'worksheet|flyer|advert|preview|sample|excerpt|promotional',target+' '+label,re.I):continue
      allowed={'www.aomin.org','aomin.org'} if self.source=='aomin' else {'michaeljkruger.com','www.michaeljkruger.com','5mt.michaeljkruger.com','rts.edu','cdn.rts.edu','www.tyndalebulletin.org','tyndalebulletin.org','www.tyndalehouse.com','www.etsjets.org'}|external_articles
      if host not in allowed:continue
      if not label or len(label)<8 or label.lower() in {'download pdf','read article'}:
       parent=anchor.getparent();label=(parent.text_content().strip() if parent is not None else '')[:500]
      if not label:label=urllib.parse.unquote(Path(parts.path).stem).replace('-',' ').replace('_',' ')
      documents[target]={'url':target,'title':label,'sourcePage':row['link'],'author':'Michael J. Kruger' if self.source=='kruger' else 'Alpha and Omega Ministries','format':'pdf' if is_pdf else 'html'}
    if len(rows)<100:break
   # Wait for that source's complete API pass before enumerating its offered paper links.
   while b.read(b.REPORT/(self.source+'-acquisition.json'),{}).get('state')!='complete':time.sleep(10)
   # Ministry-authored PDFs linked in its complete written-post archive are also official offers.
   for cache in sorted(b.CACHE.glob('rb08-'+self.source+'-posts-*.json')):
    if not re.fullmatch('rb08-'+self.source+r'-posts-\d+\.json',cache.name):continue
    for post in b.read(cache,[]):
     if post.get('format','standard') in {'video','audio','gallery','link','image'}:continue
     fragment=post.get('content',{}).get('rendered','')
     if not fragment:continue
     root=parsed('<div>'+fragment+'</div>')
     for anchor in root.xpath('//a[@href]'):
      target=urllib.parse.urljoin(post['link'],anchor.get('href'));parts=urllib.parse.urlsplit(target)
      host=parts.netloc.lower();label=anchor.text_content().strip()
      if not parts.path.lower().endswith('.pdf') or host not in ({'www.aomin.org','aomin.org'} if self.source=='aomin' else {'michaeljkruger.com','www.michaeljkruger.com'}):continue
      if re.search(r'worksheet|flyer|advert|preview|sample|excerpt|promotional',target+' '+label,re.I):continue
      if not re.search(r'white|webster|samson' if self.source=='aomin' else r'kruger',target+' '+label,re.I):continue
      documents.setdefault(target,{'url':target,'title':label if len(label)>8 else urllib.parse.unquote(Path(parts.path).stem).replace('-',' ').replace('_',' '),'sourcePage':post['link'],'author':'Michael J. Kruger' if self.source=='kruger' else 'Alpha and Omega Ministries','format':'pdf'})
   b.save(b.CACHE/('rb08-'+self.source+'-offered-papers.json'),list(documents.values()))
   self.state.update(cataloguePages=count,offeredPapers=len(documents));self.update()
   for url,item in documents.items():
    id='paper-'+hashlib.sha256(url.encode()).hexdigest()[:20]
    if any(x['sourceId']==id for x in self.state['failures']):continue
    if self.held.held({'source':self.source,'sourceId':id,'url':url}):self.state['heldDuringRun']+=1;continue
    self.state['attempted']+=1
    try:
     self.client.prepare(url)
     host=urllib.parse.urlsplit(url).netloc;rules=self.client.robots[host]
     crawl_delay=rules.crawl_delay(b.UA) or rules.crawl_delay('*') or 0
     if crawl_delay>60:raise RuntimeError(f'Deferred collection crawl-delay {crawl_delay}s; no file request attempted; collect later under the published rate')
     body,final,headers=self.client.get(url)
     if item['format']=='pdf' and not body.startswith(b'%PDF-'):raise ValueError('not an offered PDF original')
     if item['format']=='html':
      root=parsed(body);headings=root.xpath('//h1')
      if headings:item['title']=headings[0].text_content().strip()
      if len(root.text_content().split())<100:raise ValueError('no offered complete written article')
     author=item['author']
     if 'BookReviews' in url:author='Evangelical Theological Society review contributors; Michael J. Kruger'
     self.save(id,item['title'],author,url,body,format=item['format'],sourcePage=item['sourcePage'],finalUrl=final,textKind='offered article/paper',catalogueUrl=origin+'/wp-json/wp/v2/pages',credit=urllib.parse.urlsplit(url).netloc)
    except Exception as error:self.failure(id,url,error)
    self.update()
  except Exception as error:self.failure('paper-catalogue',origin+'/wp-json/wp/v2/pages',error)
  self.state.update(state='complete',completedAt=b.now());self.update()

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',choices=['aomin','kruger'],required=True);p.add_argument('--mission',required=True);a=p.parse_args();Papers(a.source,a.mission).run()
