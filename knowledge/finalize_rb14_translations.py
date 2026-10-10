"""Local-only credit recovery and numeric RB14 report; never re-downloads."""
import json,re,collections
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich
b.REPORT=REPORT
b.SOURCES.append('spurgeon-translations')
originals={};sermons={};held={}
for f in (b.SITE/'content/library/reports').rglob('acquisition-manifest.json'):
    if f.parent==REPORT:continue
    ledger=b.read(f,{})
    for x in ledger if isinstance(ledger,list) else ledger.get('files',[]):
        if not isinstance(x,dict) or not x.get('path') or not Path(x['path']).is_file():continue
        held[(x.get('source'),x.get('sourceId'))]=x
        if x.get('source')=='chapel' and str(x.get('language','en')).lower() in {'en','english'}:
            originals[x['sourceId']]=x|{'workId':x.get('workId') or 'work-chapel-'+x['sourceId']}
for f in (b.ROOT/'sources/library/source-spurgeon-gems').rglob('chs*.pdf'):
    m=re.fullmatch(r'chs(\d+)\.pdf',f.name)
    if m:
        wid='work-spurgeon-sermon-'+m[1].zfill(4)
        if (b.SITE/'content/library/catalog/works'/(wid+'.json')).exists():sermons[int(m[1])]={'workId':wid,'path':str(f)}
failures=[];local=[]
for x in b.read(b.CACHE/'rb14-spurgeon-translations.json',[]):
    p=b.CACHE/'rb14-credit-screen'/('spurgeon-'+x['sourceId']+'.pdf')
    if not p.exists():continue
    try:local.append(enrich(x,p.read_bytes(),{},sermons)|{'cachedOriginal':str(p)})
    except Exception as e:failures.append({'source':x['source'],'sourceId':x['sourceId'],'url':x['url'],'error':str(e)})
b.save(b.CACHE/'rb14-spurgeon-local-credits.json',local)
b.collect('spurgeon-translations',{'cataloguePath':str(b.CACHE/'rb14-spurgeon-local-credits.json'),'approvedCollection':True,'deferHardDownloads':True,'batchName':'local-credits'},0)
for x in b.read(b.CACHE/'rb14-chapel-translations.json',[]):
    old=held.get(('chapel',x['sourceId']))
    if not old:continue
    try:
        row=enrich(old|x|{'path':old['path'],'sha256':old['sha256'],'format':old['format']},Path(old['path']).read_bytes(),originals,sermons)
        b.append_manifest(row|{'acquisitionStatus':'held-metadata-linked','campaignMission':'RB14'},update=True)
    except Exception as e:failures.append({'source':'chapel','sourceId':x['sourceId'],'url':x['url'],'error':str(e)})
# Existing historical translations are screened locally too, without a second request.
bunyan=b.read(REPORT/'held-bunyan-originals.json',{})
for x in b.read(b.CACHE/'rb14-ia-translations.json',[]):
    if not re.search(r'Bunyan',x.get('author',''),re.I):continue
    key='pilgrim' if re.search(r'pilgrim|p[eèé]lerin|peregrin|puteshestvie|viagem.*christ',x.get('title',''),re.I) else None
    old=held.get(('ia',x['sourceId']))
    if not old or key not in bunyan:continue
    try:
        row=enrich(old|{'linkedParentCode':key},Path(old['path']).read_bytes(),bunyan,{})
        b.append_manifest(row|{'acquisitionStatus':'held-metadata-linked','campaignMission':'RB14'},update=True)
    except Exception as e:failures.append({'source':'ia','sourceId':x['sourceId'],'url':x['url'],'error':str(e)})
manifest=b.read(REPORT/'acquisition-manifest.json',{'mission':'RB14','files':[]})
admitted={(r['source'],r['sourceId']) for r in manifest['files']}
for path in [REPORT/'failed-downloads-todo.json',REPORT/'additional-failed-downloads-todo.json',REPORT/'ia-failed-downloads.json',REPORT/'spurgeon-translations-failed-downloads.json',REPORT/'confessions-failed-downloads-todo.json']:
    failures+=b.read(path,{}).get('items',[])
for name in ['dg-translation-discovery.json','dg-translation-final.json']:
    failures+=b.read(REPORT/name,{}).get('failures',[])
for failure in failures:
    if failure.get('source'):continue
    url=failure.get('url','')
    for host,source in [('archive.org','ia'),('spurgeongems.org','spurgeon-translations'),('chapellibrary.org','chapel'),('desiringgod.org','desiringgod')]:
        if host in url:failure['source']=source;break
ia_eligible={x['sourceId'] for x in b.read(b.CACHE/'rb14-ia-translations.json',[]) if re.search(r'Bunyan|Spurgeon,\s*(?:C\.|Charles)|Watson,\s*Thomas|Owen,\s*John|Flavel,\s*John',x.get('author',''),re.I)}
failures=[x for x in failures if x.get('source')!='ia' or not x.get('sourceId') or x['sourceId'] in ia_eligible]
failures=[x for x in failures if not (x.get('source')=='desiringgod' and 'not supplied by official language catalogue' in x.get('error',''))]
failures=[x for x in failures if (x.get('source'),x.get('sourceId')) not in admitted and not any(r['sourceId']==x.get('sourceId') for r in manifest['files'])]
failures=list({(x.get('source'),x.get('sourceId') or x.get('url')):x for x in failures}.values())
b.save(REPORT/'failed-downloads-todo.json',{'policy':'No network retries; local screening recovery removed resolved candidates','items':failures})
registry={r['originalWorkId']:{k:r.get(k) for k in ['originalWorkId','originalPath','originalSourceId','originalSha256']} for r in manifest['files']}
b.save(REPORT/'held-original-work-links.json',registry)
new=[r for r in manifest['files'] if r.get('acquisitionStatus')!='held-metadata-linked']
summary={'newTranslationFiles':len(new),'heldTranslationsLinked':len(manifest['files'])-len(new),'newBooks':0,'distinctHeldOriginalWorks':len(registry),'GB':sum(r.get('bytes',0) for r in new)/1e9,'sources':dict(collections.Counter(r['source'] for r in manifest['files'])),'languages':dict(collections.Counter(r['language'] for r in manifest['files'])),'failuresAndDeferred':len(failures)}
b.save(REPORT/'translation-summary.json',summary)
print(json.dumps(summary),flush=True)
