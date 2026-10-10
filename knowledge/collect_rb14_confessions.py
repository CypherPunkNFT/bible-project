"""Publisher-linked confession/catechism editions; translators must be named."""
from pathlib import Path
import bulk_collect as b
from bulk_translations import REPORT,enrich
b.REPORT=REPORT
held={};originals={}
for f in (b.SITE/'content/library/reports').rglob('acquisition-manifest.json'):
    if f.parent==REPORT:continue
    ledger=b.read(f,{})
    for x in ledger if isinstance(ledger,list) else ledger.get('files',[]):
        if isinstance(x,dict) and x.get('source')=='chapel' and x.get('path') and Path(x['path']).is_file():
            held[x['sourceId']]=x
            if str(x.get('language','en')).lower() in {'en','english'}:originals[x['sourceId']]=x|{'workId':x.get('workId') or 'work-chapel-'+x['sourceId']}
rows=[];fail=[]
for code,parent in [('lbcof','lbco'),('lbcos','lbco'),('cfbas','cfba'),('scats','scat')]:
    detail=b.read(b.CACHE/('chapel-detail-'+code+'.json'),{})
    if not detail:continue
    x=b.row('chapel',code,detail['title'],'; '.join(a['name'] for a in detail.get('authors',[])) or 'Particular Baptist churches (corporate confession authors)',
        'Baptist confession and catechism',detail.get('isoLangCode','').lower(),url='https://www.chapellibrary.org'+detail['pdfUrl'],format='pdf',linkedParentCode=parent,
        licence='Official publisher-offered edition; original and translator notices retained',countAsBook=False)
    old=held.get(code)
    if old:
        try:
            row=enrich(old|x|{'path':old['path'],'sha256':old['sha256'],'format':old['format']},Path(old['path']).read_bytes(),originals,{})
            b.append_manifest(row|{'acquisitionStatus':'held-metadata-linked'},update=True)
        except Exception as e:fail.append({'source':'chapel','sourceId':code,'url':x['url'],'error':str(e)})
    else:rows.append(x)
b.save(b.CACHE/'rb14-chapel-confessions.json',rows)
base=b.acquire
def acquire(x,c):
    row,body=base(x,c)
    if row.get('alreadyHeld'):return row,body
    p=b.CACHE/'rb14-credit-screen'/('chapel-'+x['sourceId']+'.pdf');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body)
    return enrich(row,body,originals,{}),body
b.acquire=acquire
result=b.collect('chapel',{'cataloguePath':str(b.CACHE/'rb14-chapel-confessions.json'),'approvedCollection':True,'deferHardDownloads':True,'batchName':'confessions'},0)
b.save(REPORT/'confessions-failed-downloads-todo.json',{'items':fail+result['failures'],'policy':'No retries; individual translator credits required'})
print('CONFESSIONS COMPLETE',result['downloaded'],len(fail+result['failures']),flush=True)
