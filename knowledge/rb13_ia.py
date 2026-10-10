"""Complete RB13 IA catalogue selection by approved authors/publishers; no retries."""
import re
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB13';b.REPORT=R
authors=b.read(R/'authors.json')
publishers=['American Sunday-School Union','American Sunday School Union','Religious Tract Society',
    'Presbyterian Board of Publication','Baptist Sunday School','Baptist Sunday-School',
    'American Tract Society','Sunday School Union','Sunday-School Union']
topic=r'catechis|catechet|divine songs|child|young|youth|family|families|ignorant|instruction|repent|faith|gospel|baptis|membership|obedien|christian life|token|sunday.?school|sabbath.?school|bible lesson|scripture lesson'
terms=['catechis*','catechet*','"Sunday school"','"Sabbath school"','"Bible lessons"','"Scripture lessons"',
    '"family instruction"','"family religion"','"children"','"Divine songs"','"gospel"','"repentance"',
    '"faith"','"baptism"','"church membership"','"Christian obedience"','"Thoughts for young men"','"Instruction for the ignorant"']
criteria=' OR '.join('title:'+x for x in terms)+' OR subject:catechis* OR subject:"Sunday schools"'
creator=' OR '.join('creator:'+b.json.dumps(x) for x in authors)
publisher=' OR '.join('publisher:'+b.json.dumps(x) for x in publishers)
query='mediatype:texts AND date:[1500-01-01 TO 1899-12-31] AND NOT access-restricted-item:true AND ('+criteria+') AND ('+creator+' OR '+publisher+')'
f={'iaQuery':query,'approvedCollection':True,'deferHardDownloads':True,'downloadWorkers':4,
    'audienceProfile':'rb13','primaryAuthorOnly':True}
known=b.read(R/'previously-failed.json',[])
f['skipIds']=[x['sourceId'] for x in known if x.get('source')=='ia']
b.save(R/'filters/ia-discovery.json',f)
try:
    rows=b.catalogue('ia',b.Client(attempts=1,timeout=20),f)
    screen={'authors':authors,'primaryAuthorOnly':True,
        'authorIdentityRules':[{'namePattern':r'Owen,?\s+John','lifeYears':[1616,1683],
            'requireReligiousSubjectsWhenUndated':True},{'namePattern':r'Gill,?\s+John','lifeYears':[1697,1771],
            'requireReligiousSubjectsWhenUndated':True}]}
    institutions=['Princeton','americana','toronto','europeanlibraries','library_of_congress','cdl',
        'bostonpubliclibrary','getty','wellcomelibrary','biodiversity','gutenberg','microfilm','robarts','duke']
    ids=[]
    for x in rows:
        author_ok=b.matches(x,screen)
        publisher_ok=any(p.lower() in x.get('publisher','').lower() for p in publishers)
        historical_year=re.search(r'\b(\d{4})\b',x.get('date',''))
        nineteenth=historical_year and 1800<=int(historical_year[1])<=1899
        subject=x['title']+' '+x.get('subjects','')
        teaching=bool(re.search(topic,subject,re.I))
        if not author_ok and not (publisher_ok and nineteenth and teaching):continue
        if not any(c.lower() in x.get('collection','').lower() for c in institutions):continue
        if x['sourceId'] in f['skipIds']:continue
        ids.append(x['sourceId'])
    f['ids']=ids or ['__no_matches__'];b.save(R/'filters/ia.json',f)
    print('IA selected',len(ids),'catalogue',len(rows),flush=True)
    result=b.collect('ia',f,0);print('IA complete',result['downloaded'],flush=True)
except Exception as e:
    b.save(R/'ia-catalogue-blocker.json',{'source':'ia','url':'https://archive.org/services/search/v1/scrape',
        'error':str(e),'retry':False,'updatedAt':b.now()})
    print('IA source failed; deferred without retry:',str(e),flush=True)
