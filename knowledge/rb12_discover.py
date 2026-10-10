import sys,re
sys.path.insert(0,'knowledge');import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB12'
rows=b.catalogue('ia',b.Client(attempts=1,timeout=20),b.read(R/'ia-discovery-filter.json'))
institutions=['Princeton','americana','toronto','europeanlibraries','library_of_congress','cdl','bostonpubliclibrary','getty','wellcomelibrary','biodiversity','gutenberg','microfilm','robarts','duke','baptist','andersonuniversity','northcarolina','nclive','wakeforest','unc']
auth=r'(?:Crosby, Thomas|Thomas Crosby|Ivimey, Joseph|Joseph Ivimey|Backus, Isaac|Isaac Backus|Benedict, David|David Benedict|Cathcart, William|William Cathcart|Rippon, John|John Rippon|Kiffin, William|William Kiffin|Knollys, Hanserd|Hanserd Knollys|Keach, Benjamin|Benjamin Keach|Collins, Hercules|Hercules Collins)'
selected=[]
for x in rows:
 col=x.get('collection','').lower()
 if not any(v.lower() in col for v in institutions):continue
 if re.search(r'community|folkscanomy',col) and not re.search(r'Princeton|americana|toronto|library_of_congress|bostonpubliclibrary|robarts|duke|wakeforest|unc',col,re.I):continue
 title=x['title'];author=x['author'];subject=x.get('subjects','')
 historical_author=re.search(auth,author,re.I) and re.search(r'baptist|church|religio|gospel|christ|memoir|communion',title+' '+subject,re.I)
 records=re.search(r'baptist',title+' '+author+' '+x.get('publisher',''),re.I) and re.search(r'association|convention|annual register|church.*(?:record|book)|confession',title+' '+author,re.I)
 if not (historical_author or records):continue
 if re.search(r'Cathcart.*1755|Crosby.*(?:1840|1635)|Benedict.*1817',author,re.I):continue
 selected.append(x)
b.save(b.CACHE/'rb12-ia-screened.json',selected)
config=b.read(R/'mission-config.json');eligible={s:set(x['sourceId'] for x in (selected if s=='ia' else b.read(b.CACHE/'rb12-tcp-screened.json') if s=='tcp' else [])) for s in ['ia','tcp','ccel']}
known=[x for x in config['previouslyFailed'] if x['sourceId'] in eligible[x['source']]]
config['previouslyFailed']=known;b.save(R/'mission-config.json',config)
b.save(R/'ia-filter.json',{'approvedCollection':True,'cataloguePath':str(b.CACHE/'rb12-ia-screened.json'),'deferHardDownloads':True,'downloadWorkers':4,'skipIds':[x['sourceId'] for x in known if x['source']=='ia']})
print('IA search items',len(rows),'institutional Baptist selection',len(selected),'prior failures excluded',len(known),flush=True)
from collections import Counter
print(Counter(x['author'].split(';')[0] for x in selected).most_common(12),flush=True)
