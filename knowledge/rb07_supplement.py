import sys,time,re,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB07';b.REPORT=R
original=b.read(R/'ia-filter.json');oldcat=b.catalogue('ia',b.Client(attempts=1,timeout=20),original)
oldids={x['sourceId'] for x in oldcat if b.matches(x,original)}
branches=original['anyOf']
named=dict(branches[0]);named['authors']=named['authors']+['Charles Spurgeon','Spurgeon, C. H.','Whitfield, George','George Whitfield','Emily Chubbuck','Chubbuck, Emily','Forrester, Fanny','Fanny Forrester']
named['authorIdentityRules']=named['authorIdentityRules']+[{'namePattern':'Whitfield','lifeYears':[1714,1770]},{'namePattern':'Forrester|Chubbuck','lifeYears':[1817,1854]}]
named['authorTitleRules']=named['authorTitleRules']+[{'namePattern':'Forrester|Chubbuck','titlePattern':'memoir|life|letter|judson|mission'}]
editor={'authors':['Belcher, Joseph','Joseph Belcher','Fuller, Andrew Gunton','Andrew Gunton Fuller'],'primaryAuthorOnly':True,'authorMustStart':True,'includeTitlePattern':r'(?:works|memoir|life).*Andrew Fuller|Fuller.*works|works.*Fuller','authorIdentityRules':[{'namePattern':'Belcher','lifeYears':[1794,1859]},{'namePattern':'Gunton','lifeYears':[1799,1884]}]}
serial={'approvedCollection':True,'includeTitlePattern':r'^(?:The\s+)?(?:Metropolitan Tabernacle Pulpit|New Park Street Pulpit)|periodical accounts relative to (?:the Baptist Missionary Society|a society instituted.*gospel|the society.*propagat.*gospel)'}
f={'deferHardDownloads':True,'downloadWorkers':3,'batchName':'additional','skipIds':original['skipIds'],'anyOf':[named,editor,serial],
'iaQuery':'mediatype:texts AND date:[1600-01-01T00:00:00Z TO 1930-12-31T23:59:59Z] AND (title:"Metropolitan Tabernacle Pulpit" OR title:"New Park Street Pulpit" OR (title:Spurgeon AND title:sermons) OR title:"Periodical Accounts" OR creator:"Charles Spurgeon" OR creator:"Spurgeon, C. H." OR creator:"Whitfield, George" OR creator:"Fanny Forrester" OR creator:"Forrester, Fanny" OR creator:"Emily Chubbuck" OR (creator:"Joseph Belcher" AND title:Fuller) OR (creator:"Andrew Gunton Fuller" AND title:Fuller))'}
try:
 cat=b.catalogue('ia',b.Client(attempts=1,timeout=20),f)
 f['ids']=[x['sourceId'] for x in cat if x['sourceId'] not in oldids and b.matches(x,f)]
 b.save(R/'ia-additional-filter.json',f);print('Disjoint additional series/author IDs',len(f['ids']),flush=True)
 if not f['ids']:b.save(R/'supplemental-completion.json',{'state':'complete','newIds':0});sys.exit(0)
 while b.read(R/'ia-acquisition.json',{}).get('state')!='complete':time.sleep(10)
 with (R/'ia-additional.log').open('w',encoding='utf-8') as out:
  p=subprocess.run([sys.executable,'-X','utf8','-u',str(b.SITE/'knowledge/bulk_collect.py'),'collect','--source','ia','--filter',str(R/'ia-additional-filter.json'),'--limit','0','--mission','RB07'],stdout=out,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 main=b.read(R/'ia-acquisition.json');extra=b.read(R/'ia-acquisition-additional.json',{})
 for k in ['eligibleItems','unheldBefore','attempted','downloaded','duplicateHashes','heldDuringRun','bytes']:main[k]=main.get(k,0)+extra.get(k,0)
 main['failures']+=extra.get('failures',[]);main['sampleSizes']+=extra.get('sampleSizes',[]);main['updatedAt']=b.now();b.save(R/'ia-acquisition.json',main)
 b.save(R/'supplemental-completion.json',{'state':'complete','exitCode':p.returncode,'newIds':len(f['ids']),'updatedAt':b.now()})
except Exception as e:
 b.save(R/'catalogue-failures.json',{'items':[{'source':'ia','sourceId':'additional-catalogue','url':'https://archive.org/services/search/v1/scrape','error':str(e)}]})
 b.save(R/'supplemental-completion.json',{'state':'failed','error':str(e),'policy':'No retries'})
 raise
