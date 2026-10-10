"""Finish authorized RB13 downloads, invoke existing intake, report numbers and audiences."""
import json,re,time,subprocess,ctypes
from collections import Counter
from pathlib import Path
import bulk_collect as b
from run_bulk_mission import work_key

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB13';b.REPORT=R
SOURCES=['tcp','ccel','ia','chapel','founders','desiringgod']
STATUS=['tcp-acquisition','ccel-acquisition','ia-acquisition','chapel-acquisition',
    'chapel-acquisition-catalogue-topics','chapel-acquisition-linked-editions','chapel-acquisition-final-linked-editions','founders-acquisition','desiringgod-acquisition']

def report(code):
    manifest=b.read(R/'acquisition-manifest.json',{'files':[]})
    rows=[x for x in manifest['files'] if x.get('campaignMission')=='RB13' and x.get('countAsBook',True)]
    failures=[];blockers=[]
    for name in STATUS:
        s=b.read(R/(name+'.json'),{})
        failures += [x|{'source':s.get('source',name.split('-')[0])} for x in s.get('failures',[])]
    for p in R.glob('*blocker.json'):
        blockers.append(b.read(p))
    known=b.read(R/'previously-failed.json',[])
    skips=[]
    for source in SOURCES:
        f=b.read(R/'filters'/(source+'.json'),{})
        for x in known:
            if x.get('source')==source and x.get('sourceId') in f.get('skipIds',[]):skips.append(x)
    # The list/series endpoints failed, but public sitemap + PDF + individual files succeeded.
    unavailable=[x for x in failures if re.search(r'No complete free|No offered complete|catalogue/index|not a complete book|administrative|book requires',x.get('error',''),re.I)]
    download_failures=[x for x in failures if x not in unavailable]
    endpoints=b.read(R/'catalogue-endpoint-failures.json',{}).get('items',[])
    b.save(R/'failed-downloads.json',{'updatedAt':b.now(),'items':download_failures,
        'unavailableCompleteWorks':unavailable,'sourceBlockers':blockers,'previouslyFailedSkipped':skips,
        'catalogueEndpointFailures':endpoints,
        'policy':'NO RETRIES: failed requests and absent complete editions retained for later collection'})
    todo=['# RB13 failed-download TODO','',f'{len(download_failures)} failed file/metadata requests; {len(unavailable)} absent complete editions/wrappers; {len(blockers)} source blockers. No retries.','']
    todo += [f"- [ ] {x['source'].upper()} `{x['sourceId']}`: {x.get('error')}" for x in download_failures+unavailable]
    todo += [f"- [ ] {x.get('source')} source: {x.get('error')}" for x in blockers]
    todo += ['', 'Full URLs and original errors are in `failed-downloads.json`. Previously failed IDs are excluded by source filters.']
    (R/'FAILED-DOWNLOADS-TODO.md').write_text('\n'.join(todo)+'\n',encoding='utf-8')
    before=b.read(R/'embedding-before.json');after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
    b.save(R/'embedding-after.json',after)
    intake=b.read(b.ROOT/'KnowledgeBase/intake-completion.json',{})
    counts=Counter(x['source'] for x in rows)
    audience=Counter(a for x in rows for a in set(x.get('audiences',[])))
    changed=sum(bool(x.get('adaptationChanges')) for x in rows)
    named_editors=sum(bool(x.get('editor')) for x in rows if x['source'] in {'chapel','founders','desiringgod'})
    modern=sum(x['source'] in {'chapel','founders','desiringgod'} for x in rows)
    works=len({work_key(x) for x in rows})
    lines=['# RB13 - catechisms, new believers, family and children','',
        f"**{len(rows):,} new complete resources; {sum(x['bytes'] for x in rows)/1e9:.3f} GB; {len(counts)} acquisition sources; approximately {works:,} distinct works by normalized author/title.** Held originals, duplicates, samples and catalogue files are excluded. Complete tracts/booklets count as resources; Founders chapters are grouped as whole books.",'',
        '| Source | New resources | GB |','|---|---:|---:|']
    for source in SOURCES:
        z=[x for x in rows if x['source']==source]
        lines.append(f"| {source.upper()} | {len(z):,} | {sum(x['bytes'] for x in z)/1e9:.3f} |")
    lines += ['', '| Audience | Resources |','|---|---:|']
    for a in ['children','youth','new believers','parents','teachers']:lines.append(f'| {a} | {audience[a]:,} |')
    lines += ['Audience counts come from manifest `audiences` fields; multi-audience resources appear in multiple rows. Assignments use provider catalogue/edition metadata and titles, not certified age levels.',
        '',f'Failed requests: **{len(download_failures)}**. Complete editions unavailable/wrappers: **{len(unavailable)}**. Source blockers: **{len(blockers)}**. Prior failed IDs excluded by filters: **{len(skips)}**. Catalogue endpoint failures: **{len(endpoints)}**, superseded by public inventories. TODO: `failed-downloads.json` / `FAILED-DOWNLOADS-TODO.md`. No retries or new evidenceOnly holds.',
        f'Ministry editions with editor/change fields: **{modern}**; named editors: **{named_editors}**; source-stated adaptation/edition notes: **{changed}**. Unstated editor/changes remain null, with status and evidence basis; originals are not locally rewritten.',
        '',f"Passage total before: **{before['total']:,}**. After-command snapshot: **{after['total']:,}**. Change: **{after['total']-before['total']:+,}**. Embedded: **{before['indexed']:,} to {after['indexed']:,}**. Snapshot {after['updated_at']} ({after['state']})."]
    if after['total']-before['total']<100000:
        reason='the shared intake is waiting for a pre-existing source-database reader before incorporating this batch' if intake.get('state')=='waiting_for_source_database_reader' else 'the shared intake has not yet finished incorporating this batch'
        lines.append('Fewer than 100,000 new passages: '+reason+'.')
    lines += ['',f"`finish-intake.ps1` invoked after downloads ({'active in background' if code is None else 'exit '+str(code)}); shared pipeline **{intake.get('state','unknown')}**, exclusive lock protects against a second embedding worker. New-file import/embedding remains pending; passage changes may include other concurrent acquisitions.",
        '', 'Historical selection screens Reformed/Baptist/orthodox Protestant authors and 1800s evangelical Sunday-school/tract publishers. Chapel uses its complete public sitemap plus 2026 PDF catalogue, Founders its complete public book taxonomy and whole-book chapter API, and Desiring God its complete offered book catalogue. No worksheets, previews, advertisements, new OCR or public publication.']
    if intake.get('state')=='waiting_for_source_database_reader':
        lines.insert(-2,'Processing blocker: existing bulk TCP acquisition holds a database reader (PID '+', '.join(str(x['pid']) for x in intake.get('readers',[]))+'); the intake pipeline waits rather than interrupting that job.')
    (R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    summary={'state':'downloads_complete_report_written','updatedAt':b.now(),'files':len(rows),
        'bytes':sum(x['bytes'] for x in rows),'distinctWorksEstimate':works,'sources':dict(counts),
        'audienceResourceCounts':dict(audience),'failedDownloads':len(download_failures),'unavailableCompleteWorks':len(unavailable),
        'blockers':blockers,'embeddingBefore':before,'embeddingAfter':after,'intakeCommandExitCode':code,'intake':intake}
    b.save(R/'rerun-summary.json',summary);b.save(R/'rerun-progress.json',{'state':summary['state'],'updatedAt':b.now()})
    print(json.dumps(summary),flush=True)

def main():
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.OpenProcess.argtypes=[ctypes.c_ulong,ctypes.c_bool,ctypes.c_ulong];kernel.OpenProcess.restype=ctypes.c_void_p
    kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_ulong];kernel.CloseHandle.argtypes=[ctypes.c_void_p]
    processes=b.read(R/'worker-pids.json',[])
    handles={x['status']:kernel.OpenProcess(0x00100000,False,x['pid']) for x in processes}
    try:
        while True:
            active=[]
            for name in STATUS:
                state=b.read(R/(name+'.json'),{}).get('state')
                if state=='complete':continue
                handle=handles.get(name)
                if handle and kernel.WaitForSingleObject(handle,0)==258:active.append(name)
                elif not (R/(name.split('-')[0]+'-catalogue-blocker.json')).exists():
                    b.save(R/(name+'-worker-blocker.json'),{'source':name,'error':'Worker exited without a completed source status; inspect acquisition/error log; no retry'})
            b.save(R/'rerun-progress.json',{'state':'collecting','activeSources':active,'updatedAt':b.now()})
            if not active:break
            time.sleep(10)
    finally:
        for handle in handles.values():
            if handle:kernel.CloseHandle(handle)
    current=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
    print('Intake progress before invocation:',current['state'],current['total'],current['indexed'],flush=True)
    with (R/'finish-intake.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','knowledge/finish-intake.ps1'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    try:code=process.wait(timeout=2)
    except subprocess.TimeoutExpired:code=None
    report(code)

if __name__=='__main__':main()
