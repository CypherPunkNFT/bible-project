"""Official DG language catalogue, filtered against held original URLs before fetching."""
import math,re,html,urllib.parse,hashlib,json
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich
b.REPORT=REPORT
b.SOURCES.append('desiringgod-translations')
client=b.Client(attempts=1,timeout=20)
originals={}
for path in (b.SITE/'content/library/reports').rglob('acquisition-manifest.json'):
    if path.parent==REPORT:continue
    ledger=b.read(path,{})
    for row in ledger if isinstance(ledger,list) else ledger.get('files',[]):
        if not isinstance(row,dict) or not row.get('path') or not Path(row['path']).is_file():continue
        url=row.get('url','')
        if 'desiringgod.org' in url:
            root=url.split('?')[0];originals[root]=row|{'workId':row.get('workId') or 'work-desiringgod-'+row.get('sourceId',hashlib.sha256(root.encode()).hexdigest()[:16])}
index=client.cached('rb14-dg-languages.html','https://www.desiringgod.org/languages').decode('utf-8','replace')
languages={'spanish':'es','portuguese':'pt','chinese-simplified':'zh','chinese-traditional':'zh','french':'fr','russian':'ru','arabic':'ar','hindi':'hi'}
resources={};fail=[]
for name,code in languages.items():
    expected=re.search(r'href=["\'][^"\']*/languages/'+name+r'["\'][^>]*>([\s\S]*?)</a>',index,re.I)
    count=re.search(r'\(([\d,]+)\)',re.sub('<[^>]+>',' ',expected[1])) if expected else None
    pages=math.ceil(int(count[1].replace(',',''))/24)+1 if count else 1
    previous=None
    for n in range(1,pages+1):
        url='https://www.desiringgod.org/languages/'+name+('' if n==1 else '?page='+str(n))
        try:
            data=client.cached('rb14-dg-language-'+name+('' if n==1 else '-'+str(n))+'.html',url).decode('utf-8','replace')
            links={urllib.parse.urljoin(url,html.unescape(href)) for href in re.findall(r'href=["\']([^"\']+)["\']',data) if re.search(r'/(articles|books|messages)/',href) and 'lang='+code in html.unescape(href)}
            if not links or links==previous:break
            previous=links
            for target in links:resources[target]={'language':code,'originalUrl':target.split('?')[0]}
            print(name,n,len(resources),flush=True)
        except Exception as e:fail.append({'source':'desiringgod','url':url,'error':str(e)});break
b.save(b.CACHE/'rb14-dg-full-translations.json',resources)
selected=[]
for url,row in resources.items():
    if row['originalUrl'] not in originals:continue
    selected.append(b.row('desiringgod-translations',url.rsplit('/',1)[-1].replace('?','-').replace('=','-'),url.rsplit('/',1)[-1],
        originals[row['originalUrl']].get('author','Desiring God authors'),'Authorized DG translation',row['language'],url=url,format='html',
        linkedParentCode=row['originalUrl'],licence='Official DG content permissions; private local use',countAsBook=False))
b.save(b.CACHE/'rb14-dg-held-original-translations.json',selected)
base=b.acquire
def acquire(row,c):
    record,body=base(row,c)
    if record.get('alreadyHeld'):return record,body
    path=b.CACHE/'rb14-credit-screen'/('dg-'+hashlib.sha256(row['url'].encode()).hexdigest()[:24]+'.html')
    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(body)
    return enrich(record,body,originals,{}),body
b.acquire=acquire
result=b.collect('desiringgod-translations',{'cataloguePath':str(b.CACHE/'rb14-dg-held-original-translations.json'),'approvedCollection':True,'deferHardDownloads':True},0)
b.save(REPORT/'dg-translation-discovery.json',{'catalogueTranslations':len(resources),'heldOriginalMatches':len(selected),'downloaded':result['downloaded'],'unlinkedOriginals':len(resources)-len(selected),'failures':fail+result['failures'],'blocker':'No admission without a held original and an explicit named individual translator credit'})
print('DG COMPLETE',len(resources),len(selected),result['downloaded'],flush=True)
