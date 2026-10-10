"""Prepare screened RB08 filters and inspect official discovery endpoints once."""
import json,re,shutil
import bulk_collect as b

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08'
R.mkdir(parents=True,exist_ok=True)
if not (R/'embedding-before.json').exists():
    archive=b.ROOT/'ARCHIVE/rb08-initial-20261007';archive.mkdir(parents=True,exist_ok=True)
    for name in ['REPORT.md','acquisition-manifest.json']:
        if (R/name).exists() and not (archive/name).exists():shutil.copy2(R/name,archive/name)
    b.save(R/'embedding-before.json',b.read(b.ROOT/'KnowledgeBase/embedding-progress.json'))
common={'deferHardDownloads':True,'approvedCollection':True}
b.save(R/'tcp-filter.json',common|{'ids':['A90280']})
b.save(R/'ccel-filter.json',common|{'authors':['Butler, Joseph','Hodge, Charles','Hodge, Archibald','Paley, William','Warfield, Benjamin','Gaussen']})
b.save(R/'gutenberg-filter.json',common|{'ids':['3150','14780','19192','20801','53346']})
query='mediatype:texts AND date:[* TO 1930-12-31] AND NOT access-restricted-item:true AND (creator:Warfield OR creator:Gaussen OR creator:"Hodge, Charles" OR creator:"Hodge, Archibald" OR creator:"Paley, William" OR creator:"Butler, Joseph" OR title:"biblical repertory" OR title:"Princeton review" OR title:"Princeton theological review" OR title:"Presbyterian and Reformed review" OR (creator:"Owen, John" AND title:"divine original"))'
b.save(R/'ia-filter.json',common|{'iaQuery':query,'downloadWorkers':4,
    'excludeAuthors':['Warfield, Catherine','Warfield, Louis','Butler, Josephine','Butler, Joseph G'],
    'authorIdentityRules':[{'namePattern':'Warfield','lifeYears':[1851],'requireReligiousSubjectsWhenUndated':True},
      {'namePattern':'Butler','lifeYears':[1692],'requireReligiousSubjectsWhenUndated':True},
      {'namePattern':'Paley','lifeYears':[1743],'requireReligiousSubjectsWhenUndated':True}],
    'excludeTitlePatterns':['New Princeton review','modern Princeton review','Princeton Review.*(?:SAT|GRE|MCAT|LSAT)']})
config={'mission':'RB08','title':'Scripture authority and apologetics','filters':{s:s+'-filter.json' for s in ['tcp','ccel','ia','gutenberg']},
    'scope':'Complete screened historical author and Princeton periodical batches; official written ministry archives. No retries.',
    'availabilityNotes':[]}
b.save(R/'mission.json',config)
client=b.Client(attempts=1,timeout=20)
urls={'aomin':'https://www.aomin.org/aoblog/wp-json/wp/v2/posts?per_page=1',
      'kruger':'https://michaeljkruger.com/wp-json/wp/v2/posts?per_page=1',
      'dg':'https://www.desiringgod.org/authors/john-piper/articles'}
for source,url in urls.items():
    try:
        body=client.cached('rb08-'+source+'-probe'+('.html' if source=='dg' else '.json'),url)
        print(source,len(body),body[:160],flush=True)
    except Exception as error:print(source,type(error).__name__,str(error),flush=True)
