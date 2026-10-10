"""Historical translation editions, downloaded once through the shared IA collector."""
import re,hashlib
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich
b.REPORT=REPORT
client=b.Client(attempts=1,timeout=20)
query='mediatype:texts AND (creator:Bunyan OR creator:Watson OR creator:Owen OR creator:Flavel OR creator:Spurgeon) AND date:[1600-01-01T00:00:00Z TO 1930-12-31T23:59:59Z] AND (language:fre OR language:fra OR language:spa OR language:por OR language:chi OR language:zho OR language:rus OR language:ara OR language:hin)'
originals={}
for key,title,file in [('pilgrim',"Pilgrim's Progress",'bunyan_pilgrim.xml'),('holy-war','Holy War','bunyan_holy_war.xml')]:
    p=b.RAW/'ccel'/file
    if p.exists():originals[key]={'workId':'work-bunyan-'+key,'path':str(p),'sourceId':'bunyan/'+('pilgrim' if key=='pilgrim' else 'holy_war'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
catalog=b.catalogue('ia',client,{'iaQuery':query})
selected=[]
for row in catalog:
    author=row.get('author','');title=row.get('title','')
    if not re.search(r'Bunyan',author,re.I):continue
    key='pilgrim' if re.search(r'pilgrim|p[eè]lerin|peregrin|паломник|путешеств',title,re.I) else 'holy-war' if re.search(r'holy war|guerre sainte|guerra santa',title,re.I) else None
    if key in originals:selected.append(row|{'linkedParentCode':key,'countAsBook':False})
b.save(b.CACHE/'rb14-ia-linked-translations.json',selected)
base=b.acquire
def acquire(row,c):
    record,body=base(row,c)
    if record.get('alreadyHeld'):return record,body
    path=b.CACHE/'rb14-credit-screen'/('ia-'+row['sourceId']+'.'+record['format'])
    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(body)
    return enrich(record,body,originals,{}),body
b.acquire=acquire
b.save(REPORT/'held-bunyan-originals.json',originals)
print('Historical translations screened',len(selected),'from',len(catalog),flush=True)
result=b.collect('ia',{'cataloguePath':str(b.CACHE/'rb14-ia-linked-translations.json'),'approvedCollection':True,'deferHardDownloads':True},0)
print('IA COMPLETE',result['downloaded'],len(result['failures']),flush=True)
