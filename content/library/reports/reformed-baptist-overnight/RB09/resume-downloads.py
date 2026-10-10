import sys, subprocess, shutil
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'knowledge'))
import bulk_collect as b
R=Path.cwd()/'content/library/reports/reformed-baptist-overnight/RB09'
b.REPORT=R
f=b.read(R/'filters/ia.json'); s=b.read(R/'ia-acquisition.json')
holdings=b.Holdings()
pending=[x for x in b.catalogue('ia',b.Client(attempts=1,timeout=20),f) if b.matches(x,f) and not holdings.held(x)]
if pending:
    x=pending[0]
    s['failures'].append({'sourceId':x['sourceId'],'url':x['url'],'title':x['title'],'author':x['author'],'error':'Interrupted while enabling shared-rate-limit concurrency; deferred without retry'})
    f.setdefault('skipIds',[]).append(x['sourceId'])
f['skipIds']+= [x['sourceId'] for x in s['failures']]
f['downloadWorkers']=4; f['resumeStatus']=True
f['excludeAuthors']=['Botanist','(Firm)','Nursery','Seed Trade']
f['authorIdentityRules'].append({'namePattern':r'^Josephus|^Flavius Josephus','allowedPattern':r'^(?:Flavius Josephus|Josephus(?:,?\s+Flavius|,?\s+(?:ca\.?\s*)?37)|Josephus\.?$)'})
b.save(R/'filters/ia.json',f); b.save(R/'ia-acquisition.json',s)
m=b.read(R/'acquisition-manifest.json'); excluded=[]
for record in m['files']:
    if record.get('campaignMission')!='RB09' or record.get('source')!='ia' or not record.get('countAsBook',True) or b.matches(record,f):continue
    original=Path(record['path']).resolve()
    if not original.is_relative_to(b.RAW.resolve()):raise ValueError('Unexpected source path')
    target=(b.ROOT/'ARCHIVE/RB09-excluded-author'/original.name).resolve()
    if not target.is_relative_to((b.ROOT/'ARCHIVE/RB09-excluded-author').resolve()):raise ValueError('Unsafe archive target')
    target.parent.mkdir(parents=True,exist_ok=True);shutil.move(original,target)
    record.update(path=str(target),countAsBook=False,disposition='excluded-author',reason='Unrelated primary author; retained outside intake')
    excluded.append(record['sourceId'])
b.save(R/'acquisition-manifest.json',m); b.save(R/'excluded-author-ids.json',excluded)
with (R/'ia-screened-acquisition.log').open('w',encoding='utf-8') as log:
    p=subprocess.Popen([sys.executable,'-X','utf8','-u','knowledge/bulk_collect.py','collect','--source','ia','--filter',str(R/'filters/ia.json'),'--limit','0','--mission','RB09'],stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
c=b.read(R/'mission.json');c.update(waitForExisting=True,finalizeOnly=True)
b.save(R/'mission-resume.json',c)
b.save(R/'worker-pids.json',[{'source':'ia','pid':p.pid}])
with (R/'rerun-screened.log').open('w',encoding='utf-8') as log:
    controller=subprocess.Popen([sys.executable,'-X','utf8','-u','knowledge/run_bulk_mission.py',str(R/'mission-resume.json')],stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
print('IA',p.pid,'controller',controller.pid,'deferred',pending[0]['sourceId'] if pending else 'none')
