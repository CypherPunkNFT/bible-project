import sys,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB06'
with (R/'tcp-alias.log').open('w',encoding='utf-8') as out:
 p=subprocess.run([sys.executable,'-X','utf8','-u',str(b.SITE/'knowledge/bulk_collect.py'),'collect','--source','tcp','--filter',str(R/'tcp-alias-filter.json'),'--limit','0','--mission','RB06'],stdout=out,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
main=b.read(R/'tcp-acquisition.json');extra=b.read(R/'tcp-acquisition-aliases.json',{})
for k in ['eligibleItems','unheldBefore','attempted','downloaded','duplicateHashes','heldDuringRun','bytes']:main[k]=main.get(k,0)+extra.get(k,0)
main['failures']+=extra.get('failures',[]);main['sampleSizes']+=extra.get('sampleSizes',[]);main['updatedAt']=b.now();b.save(R/'tcp-acquisition.json',main)
b.save(R/'tcp-supplemental-completion.json',{'state':'complete','exitCode':p.returncode,'updatedAt':b.now()})
