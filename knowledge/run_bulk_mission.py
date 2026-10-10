"""Run approved source filters concurrently; invoke intake and write a numeric report."""
import argparse, json, re, shutil, subprocess, sys, time, unicodedata
import ctypes
from collections import Counter
from pathlib import Path
import bulk_collect as b

def work_key(x):
    title=unicodedata.normalize('NFKD',x['title']).encode('ascii','ignore').decode().lower().split(':')[0]
    title=re.sub(r'\b(?:vol(?:ume)?|v|part|pt)\.?\s*[ivxlcdm\d]+\b',' ',title)
    title=re.sub(r'[^a-z0-9]+',' ',title).strip()
    author=x['author'].split(';')[0].casefold()
    return author,re.sub(r'^(?:the|an|a) ','',title)

def run(config_path):
    config=b.read(config_path);mission=config['mission']
    if not re.fullmatch(r'RB\d{2}',mission):raise ValueError('Invalid mission ID')
    R=b.SITE/'content/library/reports/reformed-baptist-overnight'/mission;b.REPORT=R
    R.mkdir(parents=True,exist_ok=True)
    if not (R/'embedding-before.json').exists():
        archive=b.ROOT/'ARCHIVE'/(mission.lower()+'-initial-20261007');archive.mkdir(parents=True,exist_ok=True)
        for name in ['REPORT.md','acquisition-manifest.json']:
            if (R/name).exists() and not (archive/name).exists():shutil.copy2(R/name,archive/name)
        b.save(R/'embedding-before.json',b.read(b.ROOT/'KnowledgeBase/embedding-progress.json'))
    b.save(R/'rerun-progress.json',{'state':'collecting','updatedAt':b.now()})
    workers=[];blockers=list(config.get('sourceBlockers',[]))
    if config.get('waitForExisting'):
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.argtypes=[ctypes.c_ulong,ctypes.c_bool,ctypes.c_ulong]
        kernel.OpenProcess.restype=ctypes.c_void_p
        kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_ulong]
        kernel.CloseHandle.argtypes=[ctypes.c_void_p]
        handles={}
        for x in b.read(R/'worker-pids.json',[]):
            handles[x['source']]=kernel.OpenProcess(0x00100000,False,x['pid'])
        try:
            while True:
                active=[]
                for source in config['filters']:
                    status=b.read(R/(source+'-acquisition.json'),{})
                    handle=handles.get(source)
                    if status.get('state')!='complete' and handle and kernel.WaitForSingleObject(handle,0)==258:active.append(source)
                if not active:break
                b.save(R/'rerun-progress.json',{'state':'collecting','activeSources':active,'updatedAt':b.now()})
                time.sleep(10)
        finally:
            for handle in handles.values():
                if handle:kernel.CloseHandle(handle)
    # Independent hosts run alongside one another; each collector keeps its own polite host delays.
    for source,filter_path in config['filters'].items():
        if config.get('finalizeOnly'):
            status=b.read(R/(source+'-acquisition.json'),{})
            if status.get('state')!='complete':blockers.append({'source':source,'exitCode':'not complete','log':source+'-acquisition-error.log'})
            continue
        log=(R/(source+'-acquisition.log')).open('w',encoding='utf-8')
        process=subprocess.Popen([sys.executable,'-X','utf8','-u',str(b.SITE/'knowledge/bulk_collect.py'),
            'collect','--source',source,'--filter',str(R/filter_path),'--limit','0','--mission',mission],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
        workers.append((source,process,log))
    for source,process,log in workers:
        code=process.wait();log.close()
        if code:blockers.append({'source':source,'exitCode':code,'log':source+'-acquisition.log'})
        print(source,'collector exited',code,flush=True)
    manifest=b.read(R/'acquisition-manifest.json',{'files':[]})
    excluded=[]
    for record in manifest['files']:
        screen_path=config.get('finalScreens',{}).get(record.get('source'))
        if not screen_path or record.get('campaignMission')!=mission or not record.get('countAsBook',True):continue
        if b.matches(record,b.read(R/screen_path)):continue
        original=Path(record['path']).resolve()
        if not original.is_relative_to(b.RAW.resolve()):raise ValueError('Unexpected source path during final author screen')
        target=(b.ROOT/'ARCHIVE'/(mission+'-excluded-author')/original.name).resolve()
        if not target.is_relative_to((b.ROOT/'ARCHIVE'/(mission+'-excluded-author')).resolve()):raise ValueError('Unsafe archive target')
        target.parent.mkdir(parents=True,exist_ok=True);shutil.move(original,target)
        record.update(path=str(target),countAsBook=False,disposition='excluded-author',
            reason='Canonical historical author identity not established by supplied creator metadata; retained outside library intake')
        excluded.append(record['sourceId'])
    if excluded:b.save(R/'acquisition-manifest.json',manifest)
    files=manifest['files']
    new=[x for x in files if x.get('campaignMission')==mission and x.get('countAsBook',True)]
    failures=[];export_failures=[]
    failures += [x|{'sourceId':x.get('sourceId','catalogue')} for x in b.read(R/'catalogue-failures.json',{}).get('items',[])]
    for source in config['filters']:
        failures += [x|{'source':source} for x in b.read(R/(source+'-acquisition.json'),{}).get('failures',[])]
    nonbooks=[x for x in failures if x.get('source')=='chapel' and 'administrative material' in x.get('error','')]
    failures=[x for x in failures if x not in nonbooks]
    if nonbooks:b.save(R/'excluded-nonbooks.json',{'items':nonbooks,'reason':'Publisher administrative catalogue; not a book or failed book download'})
    for x in new:
        if x.get('exportError'):export_failures.append({'source':x['source'],'sourceId':x['sourceId'],
            'url':x['url'],'error':x['exportError'],'originalSaved':True})
    known=config.get('previouslyFailed',[])
    b.save(R/'failed-downloads.json',{'updatedAt':b.now(),'items':failures,'exportFailures':export_failures,
        'sourceBlockers':blockers,'previouslyFailed':known,'policy':'No retries; difficult files deferred'})
    todo=['# '+mission+' failed-download TODO','',
        f'{len(failures)} failed/deferred acquisitions; {len(export_failures)} saved originals with failed text export; {len(blockers)} collector/collection blockers; {len(known)} previously failed IDs skipped.','']
    todo += [f"- [ ] {x['source'].upper()} `{x['sourceId']}`: {x.get('error',x.get('reason','previous failure'))}" for x in failures+export_failures+known]
    todo += [f"- [ ] {x['source'].upper()} collector exit {x['exitCode']}: `{x['log']}`" for x in blockers]
    todo += ['', 'Full IDs, URLs and errors: `failed-downloads.json`. No automatic retries.']
    (R/'FAILED-DOWNLOADS-TODO.md').write_text('\n'.join(todo)+'\n',encoding='utf-8')
    before=b.read(R/'embedding-before.json')
    current=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
    print('Intake progress before invocation:',current['state'],current['total'],current['indexed'],flush=True)
    with (R/'finish-intake.log').open('w',encoding='utf-8') as log:
        intake=subprocess.Popen(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','knowledge/finish-intake.ps1'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    try:code=intake.wait(timeout=2)
    except subprocess.TimeoutExpired:code=None
    after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json');b.save(R/'embedding-after.json',after)
    completion=b.read(b.ROOT/'KnowledgeBase/intake-completion.json',{})
    counts=Counter(x['source'] for x in new);works=len({work_key(x) for x in new})
    derived=[x['derivedText'] for x in new if x.get('derivedText')]
    derivative_bytes=sum(x.get('bytes') or Path(x['path']).stat().st_size for x in derived)
    lines=['# '+mission+' re-run - '+config['title'],'',
        f"**{len(new):,} new originals; {sum(x['bytes'] for x in new)/1e9:.3f} GB; {len(counts)} acquisition sources; approximately {works:,} distinct works by normalized author/title.** Edition variants may remain; existing holdings and first-run files excluded from new counts.",'',
        '| Source | New originals | GB |','|---|---:|---:|']
    for source in config['filters']:
        rows=[x for x in new if x['source']==source]
        lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
    lines += ['',f"Text derivatives: **{len(derived)}**, {derivative_bytes/1e9:.3f} GB (not additional works). Failed/deferred acquisitions: **{len(failures)}**; export failures: **{len(export_failures)}**; collector/collection blockers: **{len(blockers)}**; prior failed IDs skipped: **{len(known)}**. TODO: `FAILED-DOWNLOADS-TODO.md` / `failed-downloads.json`. No retries or new evidenceOnly holds; credits retained.",
        '',f"Passage total before: **{before['total']:,}**. After-command snapshot: **{after['total']:,}**. Change: **{after['total']-before['total']:+,}**. Embedded: **{before['indexed']:,} to {after['indexed']:,}**. Snapshot state **{after['state']}**, timestamp {after['updated_at']}."]
    if after['total']-before['total']<100000:
        lines.append('Fewer than 100,000 new passages: major sets are already held, failed requests are deferred without retry, and this batch is not yet fully incorporated by the shared intake.')
    lines += ['',f"`finish-intake.ps1` invoked after downloads ({'running in background' if code is None else 'exit '+str(code)}); shared pipeline state **{completion.get('state','unknown')}**. Exclusive lock prevents a second embedding worker. Import/embedding completion remains pending; concurrent pre-existing acquisitions may affect totals.",'',config['scope']]
    if config.get('availabilityNotes'):lines += [' '.join(config['availabilityNotes'])]
    if nonbooks:lines += [f'Administrative catalogue entries excluded from book and failed-download counts: {len(nonbooks)}.']
    if excluded:lines += [f'Final canonical-author screen excluded {len(excluded)} further unrelated or unresolved creator matches; originals retained outside library intake, not counted as acquired books.']
    (R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    summary={'state':'downloads_complete_report_written','updatedAt':b.now(),'files':len(new),
        'bytes':sum(x['bytes'] for x in new),'distinctWorksEstimate':works,'sources':dict(counts),
        'failedDownloads':len(failures),'exportFailures':len(export_failures),'blockers':blockers,
        'previouslyFailedSkipped':len(known),'derivedTexts':len(derived),'embeddingBefore':before,
        'embeddingAfter':after,'intakeCommandExitCode':code,'intake':completion}
    b.save(R/'rerun-summary.json',summary);b.save(R/'rerun-progress.json',{'state':summary['state'],'updatedAt':b.now()})
    print(json.dumps(summary),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('config',type=Path);args=parser.parse_args();run(args.config)
