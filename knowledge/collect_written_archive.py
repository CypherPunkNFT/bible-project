"""Polite one-attempt collectors for official WordPress written archives and DG."""
import argparse,hashlib,html,json,re,time,urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,wait,FIRST_COMPLETED
from lxml import html as dom
import bulk_collect as b

def parsed(body):return dom.fromstring(body.decode('utf-8','replace') if isinstance(body,bytes) else body)
def cls(name):return 'contains(concat(" ",normalize-space(@class)," ")," '+name+' ")'
def text(fragment):return parsed('<div>'+fragment+'</div>').text_content().strip()
class Written:
 def __init__(self,source,mission):
  self.source=source;b.REPORT=b.SITE/'content/library/reports/reformed-baptist-overnight'/mission
  self.client=b.Client(attempts=1,timeout=20);self.held=b.Holdings()
  self.state={'source':source,'state':'running','startedAt':b.now(),'downloaded':0,'attempted':0,'bytes':0,'heldDuringRun':0,'duplicateHashes':0,'excludedMediaOrNotWritten':0,'failures':[]}
  self.status=b.REPORT/(source+'-acquisition.json')
  previous=b.read(self.status,{})
  if previous:
   self.state.update(previous);self.state['state']='running'
   self.state['failures']=[x for x in previous.get('failures',[]) if not (x['sourceId']=='collection' and ('WinError' in x['error'] or "has no attribute 'decode'" in x['error']))]
  self.update()
 def update(self):self.state['updatedAt']=b.now();b.save(self.status,self.state)
 def failure(self,id,url,error):
  self.state['failures'].append({'sourceId':str(id),'url':url,'error':str(error)})
  print(self.source,id,'FAILED',str(error),flush=True);self.update()
 def save(self,id,title,author,url,body,format='html',**metadata):
  if self.held.held({'source':self.source,'sourceId':str(id),'url':url}):self.state['heldDuringRun']+=1;return
  digest=hashlib.sha256(body).hexdigest()
  if digest in self.held.hashes:self.state['duplicateHashes']+=1;return
  name=re.sub('[^A-Za-z0-9_.-]','_',str(id))+'.'+format
  path=b.RAW/self.source/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(body)
  record={'source':self.source,'sourceId':str(id),'title':title,'author':author,'url':url,'sha256':digest,'bytes':len(body),'format':format,'path':str(path),
    'acquiredAt':b.now(),'language':'en','audience':'adult readers; pastors; scholars','campaignMission':b.REPORT.name,
    'licence':'Copyright retained by author/ministry; publicly offered written material; private local research copy; original notices and credits retained',
    'useScope':'private local import and embedding','privateLocalIndexAuthorized':True,'publicHostingAllowed':False,'publicFullTextIndexAllowed':False,'contributor':author,'credit':self.source,**metadata}
  b.save(b.CACHE/'provenance'/self.source/(name+'.json'),record);b.append_manifest(record)
  self.held.hashes.add(digest);self.held.ids.add((self.source,str(id)))
  self.state['downloaded']+=1;self.state['bytes']+=len(body)
  print(self.source,id,len(body),flush=True)
 def wordpress(self):
  origin={'aomin':'https://www.aomin.org/aoblog','kruger':'https://michaeljkruger.com'}[self.source]
  users=b.read(b.CACHE/('rb08-'+self.source+'-users.json'),[])
  names={x['id']:x['name'] for x in users};names.update({int(k):v for k,v in self.state.get('authorNames',{}).items()});failed_authors=set(self.state.get('failedAuthorIds',[]))
  info_path=b.CACHE/('rb08-'+self.source+'-pagination.json')
  pagination=b.read(info_path)
  if not pagination:
   inventory_url=origin+'/wp-json/wp/v2/posts?per_page=1&_fields=id'
   body,final,headers=self.client.get(inventory_url)
   lower={k.lower():v for k,v in headers.items()}
   pagination={'url':inventory_url,'total':int(lower['x-wp-total']),'pages':(int(lower['x-wp-total'])+99)//100,'acquiredAt':b.now()}
   b.save(info_path,pagination)
  self.state['offeredPosts']=pagination['total'];self.state['cataloguePages']=pagination['pages'];self.update()
  failed_pages={x['sourceId'] for x in self.state['failures']}
  count=0
  for page in range(1,pagination['pages']+1):
   url=origin+'/wp-json/wp/v2/posts?per_page=100&page='+str(page)
   if 'catalogue-page-'+str(page) in failed_pages:continue
   try:posts=json.loads(self.client.cached('rb08-'+self.source+f'-posts-{page:03}.json',url))
   except Exception as error:self.failure('catalogue-page-'+str(page),url,error);continue
   if not isinstance(posts,list):self.failure('catalogue-page-'+str(page),url,'API error: '+str(posts)[:300]);continue
   count+=len(posts)
   for post in posts:
    body=post.get('content',{}).get('rendered','');plain=text(body) if body else ''
    # Source formats identify media announcements. Excerpts and locked posts are never saved.
    media_categories={14,1759,219,1913,1854,1856,1940}
    if post.get('format','standard') in {'video','audio','gallery','link','image'} or (self.source=='aomin' and media_categories.intersection(post.get('categories',[]))) or post.get('content',{}).get('protected') or len(plain.split())<50:
     self.state['excludedMediaOrNotWritten']+=1;continue
    if self.held.held({'source':self.source,'sourceId':str(post['id']),'url':post['link']}):self.state['heldDuringRun']+=1;continue
    author_id=post.get('author')
    if author_id not in names and author_id not in failed_authors:
     author_url=post.get('_links',{}).get('author',[{}])[0].get('href')
     try:
      if not author_url:raise ValueError('author endpoint not supplied')
      person=json.loads(self.client.cached(f'rb08-{self.source}-author-{author_id}.json',author_url))
      names[author_id]=person['name']
     except Exception as error:failed_authors.add(author_id);print('Contributor name unavailable',author_id,str(error),flush=True)
     self.state['authorNames']=names;self.state['failedAuthorIds']=list(failed_authors)
    author=names.get(author_id,('Alpha and Omega Ministries' if self.source=='aomin' else 'Canon Fodder')+f' (author ID {author_id})')
    title=html.unescape(text(post['title']['rendered']))
    original=('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+html.escape(title)+'</title></head><body><article><h1>'+html.escape(title)+'</h1><p>'+html.escape(author)+'</p>'+body+'</article></body></html>').encode('utf-8')
    self.state['attempted']+=1
    metadata={k:v for k,v in post.items() if k not in {'content','excerpt','guid'}}
    self.save(post['id'],title,author,post['link'],original,sourceApi=url,sourceMetadata=metadata,textKind='article',representation='Provider-rendered complete article HTML from official WordPress API')
   self.state['catalogueItems']=count;self.update()
   print(self.source,'catalogue page',page,'items',count,flush=True)
   if len(posts)<100:break
 def dg_inventory(self,kind):
  base='https://www.desiringgod.org/authors/john-piper/'+kind
  first_name={'articles':'rb08-dg-probe.html','messages':'rb08-dg-message-index.html','books':'rb08-dg-books-index.html'}[kind]
  first=self.client.cached(first_name,base);root=parsed(first)
  pages=max([1]+[int(x) for x in re.findall(r'[?&]page=(\d+)',first.decode('utf-8','replace'))])
  items={}
  for page in range(1,pages+1):
   url=base+('?page='+str(page) if page>1 else '')
   if any(x['sourceId']==kind+'-catalogue-'+str(page) for x in self.state['failures']):continue
   try:root=parsed(first if page==1 else self.client.cached(f'rb08-dg-{kind}-index-{page:03}.html',url))
   except Exception as error:self.failure(kind+'-catalogue-'+str(page),url,error);continue
   for card in root.xpath('//*['+cls('card--resource')+']'):
    links=card.xpath('.//a[@href]/@href');titles=card.xpath('.//*['+cls('card--resource__title')+']')
    link=next((x for x in links if urllib.parse.urlsplit(x).path.startswith('/'+kind+'/')),None)
    if not link:continue
    target=urllib.parse.urljoin(base,link);id=urllib.parse.urlsplit(target).path.strip('/')
    items[id]={'source':self.source,'sourceId':id,'title':titles[0].text_content().strip() if titles else id,'author':'John Piper','url':target,'kind':kind}
   print('desiringgod',kind,'catalogue',page,pages,len(items),flush=True)
  b.save(b.CACHE/('rb08-desiringgod-'+kind+'.json'),list(items.values()));return list(items.values())
 def desiringgod(self):
  inventory=[]
  for kind in ['articles','messages','books']:
   try:inventory.extend(self.dg_inventory(kind))
   except Exception as error:self.failure(kind+'-catalogue','https://www.desiringgod.org/authors/john-piper/'+kind,error)
  self.state['catalogueItems']=len(inventory);self.update()
  failed={x['sourceId'] for x in self.state['failures']};pending=[]
  for item in inventory:
   if item['sourceId'] in failed:continue
   if self.held.held(item):self.state['heldDuringRun']+=1;continue
   pending.append(item)
  # Four in-flight requests share one client with starts paced at least two seconds apart.
  self.client.concurrent=True
  iterator=iter(pending)
  with ThreadPoolExecutor(max_workers=4) as pool:
   active={}
   def fill():
    while len(active)<4:
     item=next(iterator,None)
     if item is None:break
     self.state['attempted']+=1;active[pool.submit(self.dg_fetch,item)]=item
   fill()
   while active:
    ready,_=wait(active,return_when=FIRST_COMPLETED)
    for future in ready:
     item=active.pop(future)
     try:
      original,url,format,metadata=future.result()
      self.save(item['sourceId'],item['title'],'John Piper',url,original,format=format,**metadata)
     except Exception as error:self.failure(item['sourceId'],item['url'],error)
     self.update()
    fill()
 def dg_fetch(self,item):
  body,final,headers=self.client.get(item['url']);root=parsed(body)
  metadata={'policyUrl':'https://www.desiringgod.org/permissions'}
  if item['kind']!='books':
   nodes=root.xpath('//*['+cls('resource__body')+']')
   if not nodes or len(nodes[0].text_content().split())<50:raise ValueError('no offered complete written article/transcript')
   return body,item['url'],'html',metadata|{'textKind':'article' if item['kind']=='articles' else 'sermon transcript'}
  offered=[]
  for link in root.xpath('//a[@href]'):
   target=urllib.parse.urljoin(final,link.get('href'));ext=Path(urllib.parse.urlsplit(target).path).suffix.lower()
   if ext in {'.pdf','.epub'} and not re.search('sample|excerpt|preview',link.text_content()+' '+target,re.I):offered.append((ext,target))
  offered.sort(key=lambda x:x[0]!='.epub')
  if not offered:raise ValueError('no offered complete EPUB/PDF')
  ext,url=offered[0];host=urllib.parse.urlsplit(url).netloc
  if host!='desiringgod.org' and not host.endswith('.desiringgod.org'):raise ValueError('unapproved external book download host '+url)
  original,final,headers=self.client.get(url)
  if ext=='.pdf' and not original.startswith(b'%PDF'):raise ValueError('not a PDF original')
  if ext=='.epub' and not original.startswith(b'PK'):raise ValueError('not an EPUB original')
  return original,url,ext[1:],metadata|{'sourcePage':item['url'],'textKind':'book'}
 def run(self):
  try:self.desiringgod() if self.source=='desiringgod' else self.wordpress()
  except Exception as error:self.failure('collection','',error)
  self.state.update(state='complete',completedAt=b.now());self.update()

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',choices=['aomin','kruger','desiringgod'],required=True);p.add_argument('--mission',required=True);a=p.parse_args();Written(a.source,a.mission).run()
