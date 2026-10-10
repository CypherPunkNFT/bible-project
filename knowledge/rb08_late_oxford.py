"""Collect later Oxford volumes only with an explicit provider public-domain grant."""
import json,re,sys
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08';b.REPORT=R
query='mediatype:texts AND creator:Warfield AND date:[1931-01-01 TO 1932-12-31] AND NOT access-restricted-item:true'
c=b.Client(attempts=1,timeout=20)
rows=b.catalogue('ia',c,{'iaQuery':query});eligible=[];blocked=[]
for x in rows:
 if not re.search(r'Warfield,?\s*(?:Benjamin|B\.?\s*B\.?)|Benjamin.*Warfield|B\.?\s*B\.?\s*Warfield',x['author'],re.I):continue
 if not any(k in x.get('collection','').lower() for k in ['princeton','americana','toronto','microfilm','cdl','europeanlibraries']):continue
 try:
  metadata=json.loads(c.cached('ia-item-'+x['sourceId']+'.json',x['url']));md=metadata.get('metadata',{})
  licence=str(md.get('licenseurl') or md.get('rights') or '')
  if re.search(r'publicdomain|public domain|creativecommons.org/(?:licenses|publicdomain)',licence,re.I):eligible.append(x['sourceId'])
  else:blocked.append({'sourceId':x['sourceId'],'url':x['url'],'title':x['title'],'reason':'1931-1932 compilation: no explicit provider public-domain or permissive licence in metadata'})
 except Exception as error:blocked.append({'sourceId':x['sourceId'],'url':x['url'],'title':x['title'],'reason':str(error)})
b.save(R/'ia-late-oxford-filter.json',{'iaQuery':query,'ids':eligible,'approvedCollection':False,'deferHardDownloads':True,'batchName':'late-oxford'})
b.save(R/'ia-late-oxford-blockers.json',{'items':blocked,'eligible':eligible})
if eligible:b.collect('ia',b.read(R/'ia-late-oxford-filter.json'),0)
else:b.save(R/'ia-acquisition-late-oxford.json',{'state':'complete','source':'ia','downloaded':0,'failures':[],'catalogueItems':len(rows)})
print('Late Oxford catalogue',len(rows),'explicitly licensed',len(eligible),'deferred',len(blocked),flush=True)
