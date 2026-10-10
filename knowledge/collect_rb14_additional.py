"""One-pass official Spanish sermon catalogue and DG/IA translation discovery."""
import json,re,urllib.parse,html
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich,LANG,text

b.REPORT=REPORT
b.SOURCES.append('spurgeon-translations')
sermons={}
for f in (b.ROOT/'sources/library/source-spurgeon-gems').rglob('chs*.pdf'):
    m=re.fullmatch(r'chs(\d+)\.pdf',f.name)
    if m:
        wid='work-spurgeon-sermon-'+m[1].zfill(4)
        if (b.SITE/'content/library/catalog/works'/(wid+'.json')).exists():sermons[int(m[1])]={'workId':wid,'path':str(f)}
client=b.Client(attempts=1,timeout=20)
fail=[];catalog=[]
try:
    url='https://www.spurgeongems.org/espanol/'
    page=client.cached('rb14-spurgeon-spanish.html',url).decode('utf-8','replace')
    for href,title in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',page,re.S|re.I):
        target=urllib.parse.urljoin(url,html.unescape(href))
        m=re.search(r'/schs(\d+)\.pdf$',target,re.I)
        if not m or int(m[1]) not in sermons:continue
        catalog.append(b.row('spurgeon-translations','schs'+m[1],html.unescape(re.sub('<[^>]+>',' ',title)).strip(),
            'Charles H. Spurgeon','Spurgeon sermons','es',url=target,format='pdf',
            licence='Official freely offered translation; source copyright and translator permission notices retained',
            contributor='Spurgeon Gems / Chapel Library',countAsBook=False))
    catalog=list({x['sourceId']:x for x in catalog}.values())
except Exception as e:fail.append({'source':'spurgeon-translations','url':url,'error':str(e)})
b.save(b.CACHE/'rb14-spurgeon-translations.json',catalog)
base=b.acquire
def acquire(x,c):
    record,body=base(x,c)
    if record.get('alreadyHeld'):return record,body
    cache=b.CACHE/'rb14-credit-screen'/('spurgeon-'+x['sourceId']+'.pdf')
    cache.parent.mkdir(parents=True,exist_ok=True);cache.write_bytes(body)
    return enrich(record,body,{},sermons),body
b.acquire=acquire
print('Spanish sermons offered with held originals',len(catalog),flush=True)
if catalog:
    prior=b.read(REPORT/'spurgeon-translations-acquisition.json',{})
    attempted={x['sourceId'] for x in prior.get('failures',[])}
    attempted.update(p.stem.replace('spurgeon-','') for p in (b.CACHE/'rb14-credit-screen').glob('spurgeon-*.pdf'))
    attempted.update(x['sourceId'] for x in b.read(REPORT/'acquisition-manifest.json',{}).get('files',[]) if x['source']=='spurgeon-translations')
    attempted.update(b.read(REPORT/'attempted-spurgeon-ids.json',[]))
    b.save(REPORT/'attempted-spurgeon-ids.json',sorted(attempted))
    result=b.collect('spurgeon-translations',{'cataloguePath':str(b.CACHE/'rb14-spurgeon-translations.json'),'approvedCollection':True,'deferHardDownloads':True,'resumeStatus':True,'skipIds':sorted(attempted)},0)
    fail+=result['failures']
# Official DG language index exposes translations. Preserve named-credit blockers,
# and never infer individual translator identity from a partner organization.
dg=[]
try:
    url='https://www.desiringgod.org/languages'
    page=client.cached('rb14-dg-languages.html',url).decode('utf-8','replace')
    links={urllib.parse.urljoin(url,html.unescape(x)) for x in re.findall(r'href=["\']([^"\']+)["\']',page)}
    targets=[x for x in links if re.search(r'/languages/(spanish|portuguese|chinese|french|russian|arabic|hindi)(?:$|[/?])',x)]
    for target in sorted(targets):
        name=target.rsplit('/',1)[-1];data=client.cached('rb14-dg-language-'+name+'.html',target).decode('utf-8','replace')
        resources={urllib.parse.urljoin(target,html.unescape(x)) for x in re.findall(r'href=["\']([^"\']+)["\']',data) if re.search(r'/(?:articles|books|messages)/',x)}
        dg+=list(resources)
    b.save(b.CACHE/'rb14-dg-translation-resources.json',sorted(set(dg)))
    # Catalogue pages do not credit individuals. These need credit plus a held
    # original before admission; queue, rather than import anonymous resources.
    for target in sorted(set(dg)):fail.append({'source':'desiringgod','url':target,'error':'Individual translator and held-original relationship not supplied by official language catalogue; deferred'})
except Exception as e:fail.append({'source':'desiringgod','url':url,'error':str(e)})
# Historical IA edition catalogue: author list and public-domain date screen.
query='mediatype:texts AND (creator:Bunyan OR creator:Watson OR creator:Owen OR creator:Flavel OR creator:Spurgeon) AND date:[1600-01-01T00:00:00Z TO 1930-12-31T23:59:59Z] AND (language:fre OR language:fra OR language:spa OR language:por OR language:chi OR language:zho OR language:rus OR language:ara OR language:hin)'
try:
    items=b.catalogue('ia',client,{'iaQuery':query})
    b.save(b.CACHE/'rb14-ia-translations.json',items)
    # Named translator must be identified by the repository edition record,
    # not guessed from an additional creator or historical title.
    for x in items:
        fail.append({'source':'ia','sourceId':x['sourceId'],'url':x['url'],'title':x['title'],'error':'Historical translation candidate; named translator and held original require edition metadata; deferred'})
except Exception as e:fail.append({'source':'ia','error':str(e)})
b.save(REPORT/'additional-failed-downloads-todo.json',{'policy':'One attempt; anonymous/unlinked editions excluded','items':fail})
print('Additional discovery complete',len(catalog),len(set(dg)),len(fail),flush=True)
