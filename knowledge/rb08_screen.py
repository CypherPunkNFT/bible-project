"""Apply the mission's author and institutional collection list to cached IA rows."""
import hashlib,re
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08'
f=b.read(R/'ia-filter.json');items=b.read(b.CACHE/('ia-'+hashlib.sha256(f['iaQuery'].encode()).hexdigest()[:12]+'.json'))
f.pop('ids',None);f.pop('skipIds',None)
collections=['Princeton','americana','toronto','europeanlibraries','library_of_congress','cdl','bostonpubliclibrary','getty','wellcomelibrary','gutenberg','microfilm','cornell','medicalheritagelibrary']
authors=r'Warfield,?\s*(?:Benjamin|B\.?\s*B\.?)|Benjamin\s+(?:Breck[ei]nridge|B\.?)\s+Warfield|B\.?\s*B\.?\s+Warfield|Hodge,?\s*(?:Charles|Archibald)|(?:Charles|Archibald(?:\s+Alexander)?)\s+Hodge|Paley,?\s*William|William\s+Paley|Butler,?\s*Joseph(?:\W|$)|Joseph\s+Butler|Gaussen,?\s*(?:Louis|L\.|S\.?\s*R\.?\s*L\.?|Fran[çc]ois)|(?:Louis|L\.|Samuel\s+Robert\s+Louis)\s+Gaussen|Owen,?\s*John|John\s+Owen'
journals=r'^(?:the\s+)?(?:biblical repertory|biblical repertory and (?:princeton|theological) review|presbyterian quarterly and princeton review|princeton theological review|presbyterian and reformed review|princeton review)(?:\W|$)'
ids=[]
for x in items:
 if not any(v.casefold() in x.get('collection','').casefold() for v in collections):continue
 if re.search(r'(?:_contents|_index)$',x['sourceId']) or re.search(r'Table of Contents|:\s*Vol(?:ume)?\s*\d+\s+Index\b',x['title'],re.I):continue
 if re.match(r'^(?:the\s+)?princeton review\b',x['title'],re.I) and x.get('date','')[:4]>'1877':continue
 if not b.matches(x,f):continue
 if re.search(authors,x['author'],re.I) or re.search(journals,x['title'],re.I):ids.append(x['sourceId'])
f.update(ids=ids,collections=collections,resumeStatus=True)
old=b.read(R/'ia-acquisition.json',{})
f['skipIds']=list(set(f.get('skipIds',[])+[x['sourceId'] for x in old.get('failures',[])]))
b.save(R/'ia-filter.json',f)
config=b.read(R/'mission.json');config['finalScreens']={'ia':'ia-filter.json'};b.save(R/'mission.json',config)
print('Screened institutional author/periodical IDs',len(ids),'previous failures skipped',len(f['skipIds']))
