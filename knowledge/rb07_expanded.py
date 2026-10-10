import sys,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB07';workers=[]
for source,fp in b.read(R/'expanded-batches.json').items():
 log=(R/(source+'-expanded.log')).open('w',encoding='utf-8')
 p=subprocess.Popen([sys.executable,'-X','utf8','-u',str(b.SITE/'knowledge/bulk_collect.py'),'collect','--source',source,'--filter',str(R/fp),'--limit','0','--mission','RB07'],stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW);workers.append((source,p,log))
for source,p,log in workers:
 code=p.wait();log.close();main=b.read(R/(source+'-acquisition.json'));extra=b.read(R/(source+'-acquisition-expanded.json'),{})
 for k in ['eligibleItems','unheldBefore','attempted','downloaded','duplicateHashes','heldDuringRun','bytes']:main[k]=main.get(k,0)+extra.get(k,0)
 main['failures']+=extra.get('failures',[]);main['sampleSizes']+=extra.get('sampleSizes',[]);main['updatedAt']=b.now();b.save(R/(source+'-acquisition.json'),main)
 print(source,'expanded exit',code,flush=True)
b.save(R/'expanded-completion.json',{'state':'complete','updatedAt':b.now()})
