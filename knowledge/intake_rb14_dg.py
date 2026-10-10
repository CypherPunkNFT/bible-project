"""Intake-only DG catalogue pass: match held landing pages as well as original file URLs."""
import hashlib,re
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich
b.REPORT=REPORT;b.SOURCES.append('desiringgod-translations')
originals={}
for f in (b.SITE/'content/library/reports').rglob('acquisition-manifest.json'):
    if f.parent==REPORT:continue
    ledger=b.read(f,{})
    for row in ledger if isinstance(ledger,list) else ledger.get('files',[]):
        if not isinstance(row,dict) or not row.get('path') or not Path(row['path']).is_file():continue
        for key in ['url','landingPage','sourcePage','canonicalUrl']:
            url=row.get(key)
            if isinstance(url,str) and 'desiringgod.org' in url:
                originals[url.split('?')[0]]=row|{'workId':row.get('workId') or 'work-desiringgod-'+str(row.get('sourceId') or hashlib.sha256(url.encode()).hexdigest()[:16])}
resources=b.read(b.CACHE/'rb14-dg-full-translations.json',{})
selected=[]
prior=b.read(REPORT/'desiringgod-translations-acquisition.json',{})
attempted_urls={x['url'] for x in prior.get('failures',[])}
matched=0
for url,row in resources.items():
    if row['originalUrl'] not in originals:continue
    matched+=1
    if url in attempted_urls:continue
    original=originals[row['originalUrl']]
    selected.append(b.row('desiringgod-translations',hashlib.sha256(url.encode()).hexdigest()[:24],original.get('title') or url,original.get('author') or 'Desiring God authors','Authorized DG translations',row['language'],url=url,format='html',linkedParentCode=row['originalUrl'],licence='Official DG permissions; private local use',countAsBook=False))
b.save(b.CACHE/'rb14-dg-final-held-original-translations.json',selected)
prior=b.read(REPORT/'desiringgod-translations-acquisition.json',{});skip=prior.get('attemptedSourceIds',[])
base=b.acquire
def acquire(row,c):
    record,body=base(row,c)
    if record.get('alreadyHeld'):return record,body
    content=re.search(br'<(?:article|div)[^>]*class=["\'][^"\']*(?:article__body|resource__body|resource__content)[^"\']*["\'][^>]*>([\s\S]+)',body,re.I)
    # Preserve complete offered HTML as the original. Named credit is screened
    # against publisher content, not navigation author profiles.
    from bulk_ministry import plain
    screened=plain(body.decode('utf-8','replace')).encode('utf-8')
    return enrich(record|{'format':'txt'},screened,originals,{})|{'format':'html'},body
b.acquire=acquire
result=b.collect('desiringgod-translations',{'cataloguePath':str(b.CACHE/'rb14-dg-final-held-original-translations.json'),'approvedCollection':True,'deferHardDownloads':True,'batchName':'held-landings','skipIds':skip},0)
b.save(REPORT/'dg-translation-final.json',{'catalogueTranslations':len(resources),'heldOriginalMatches':matched,'downloaded':result['downloaded'],'unlinkedOriginals':len(resources)-matched,'previouslyAttemptedUrlsSkipped':len(attempted_urls),'failures':result['failures']})
print('DG FINAL',len(resources),len(selected),result['downloaded'],flush=True)
