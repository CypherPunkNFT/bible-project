"""Close RB01 at the user's time cutoff, preserving a resumable download TODO."""
import json, re, subprocess, sys
from collections import Counter
import bulk_collect as b
from rb01_finish import title_key

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB01'
b.REPORT=R
manifest=b.read(R/'acquisition-manifest.json')
new=[x for x in manifest['files'] if x.get('campaignMission')=='RB01' and x.get('countAsBook',True)]
for x in new:
    if x['source']=='ia' and 'Princeton digitization programme' in str(x.get('licence','')):
        x['licence']='Historical edition published through 1930; public-domain US text; source electronic notices retained'
        b.append_manifest(x,update=True)

filters=b.read(R/'filters/ia.json')
items=b.catalogue('ia',b.Client(),filters)  # Reuse the already loaded local catalogue.
holdings=b.Holdings()
failures={}
for path in R.glob('ia-acquisition*.json'):
    for item in b.read(path,{}).get('failures',[]):
        failures[item['sourceId']]=item['error']
pending=[]
for item in items:
    if b.matches(item,filters) and not holdings.held(item):
        source_id=item['sourceId']
        pending.append({'source':'ia','sourceId':source_id,'title':item['title'],
            'author':item['author'],'url':item['url'],
            'status':'failed' if source_id in failures else 'unattempted',
            'reason':failures.get(source_id,'Deferred at user time cutoff; not a failed request')})
failed=[x for x in pending if x['status']=='failed']
b.save(R/'failed-downloads.json',{'updatedAt':b.now(),'reason':'User requested time cutoff and failed-download TODO',
    'failedItems':len(failed),'unattemptedItems':len(pending)-len(failed),'items':pending,
    'deferredDiscovery':[{'source':'ia','filter':'filters/ia-latin-variants.json',
        'reason':'Supplementary Latin/abbreviated authority search not run before time cutoff'}]})
todo=['# RB01 download TODO','',f'Failed requests: {len(failed)}. Unattempted catalogue items: {len(pending)-len(failed)}.',
    'Unattempted items are deferred work, not download failures. Full IDs, metadata URLs and errors are in `failed-downloads.json`.',
    'The supplementary Latin/abbreviated authority search is also deferred (`filters/ia-latin-variants.json`).','']
todo += [f"- [ ] `{x['sourceId']}` — {x['reason']}" for x in failed]
todo += ['', 'Resume through the shared collector using `filters/ia.json`; held IDs and hashes are skipped. Do not retry hard failures during the next run unless requested.']
(R/'FAILED-DOWNLOADS-TODO.md').write_text('\n'.join(todo)+'\n',encoding='utf-8')
state=b.read(R/'ia-acquisition.json');state.update(state='deferred_at_user_time_cutoff',updatedAt=b.now(),
    deferredItems=len(pending),failedDownloadTodo='failed-downloads.json')
b.save(R/'ia-acquisition.json',state)

before=b.read(R/'embedding-before.json')
# Read progress before invoking intake; the script's exclusive lock protects the existing worker.
current=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
print('Embedding before intake invocation:',current['state'],current['total'],current['indexed'],flush=True)
code=None
if '--report-only' not in sys.argv:
    with (R/'finish-intake.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','knowledge/finish-intake.ps1'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    try: code=process.wait(timeout=2)
    except subprocess.TimeoutExpired: pass
after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json');b.save(R/'embedding-after.json',after)
completion=b.read(b.ROOT/'KnowledgeBase/intake-completion.json',{})
by_source=Counter(x['source'] for x in new)
failed_attempts=sum(len(re.findall(r'^.* FAILED ',p.read_text('utf-8',errors='replace'),re.M)) for p in R.glob('*acquisition*.log'))
discarded=sum(x.get('campaignMission')=='RB01' and not x.get('countAsBook',True) for x in manifest['files'])
lines=['# RB01 re-run — Baptist doctrine and confessions','',
    f"**{len(new):,} new originals; {sum(x['bytes'] for x in new)/1e9:.3f} GB; {len(by_source)} sources; approximately {len({title_key(x) for x in new}):,} distinct works by normalized title.** Edition/subtitle variants may remain; existing holdings and first-run component files are excluded.",'',
    '| Source | New originals | GB |','|---|---:|---:|']
for source in ['tcp','ccel','ia']:
    rows=[x for x in new if x['source']==source]
    lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
lines += ['', f'Failed request events: **{failed_attempts}**; unresolved failed items: **{len(failed)}**; unattempted IA items deferred at the user time cutoff: **{len(pending)-len(failed)}**. Supplementary author-alias discovery is deferred. See `FAILED-DOWNLOADS-TODO.md` and `failed-downloads.json`; this run does not claim exhaustive acquisition.',
    f'Author/contributor/collection mismatches discarded: **{discarded}**. No new evidenceOnly holds; retained originals preserve credits and provenance.', '',
    f"Passage total before: **{before['total']:,}**. After-command snapshot: **{after['total']:,}**. Change: **{after['total']-before['total']:+,}**. Embedded: **{before['indexed']:,} → {after['indexed']:,}**. Embedding snapshot state: **{after['state']}**, timestamp {after['updated_at']}."]
if after['total']-before['total']<100000:
    lines.append('Fewer than 100,000 new passages: acquisition was curtailed at the user time cutoff, and the existing shared intake has not yet finished incorporating this batch.')
lines += ['', f"`finish-intake.ps1` invoked after stopping downloads ({'still running' if code is None else 'exit '+str(code)}); pipeline state **{completion.get('state','unknown')}**. Its lock prevents a second embedding worker. Downloads are saved; completion of their import and embedding remains pending. Concurrent pre-existing acquisitions may also affect passage totals.",
    '', 'Collection/author screening: named historical doctrinal authors; TCP CC0 TEI, CCEL offered ThML, and institutional/microfilm IA editions through 1930 using existing TXT/EPUB. Originals and provenance are listed in `acquisition-manifest.json`; source entries are in `Website/SOURCES.md`.']
(R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
summary={'state':'closed_at_user_time_cutoff','updatedAt':b.now(),'files':len(new),'bytes':sum(x['bytes'] for x in new),
    'distinctWorksEstimate':len({title_key(x) for x in new}),'sources':dict(by_source),
    'failedItems':len(failed),'unattemptedDeferredItems':len(pending)-len(failed),
    'embeddingBefore':before,'embeddingAfter':after,'intakeCommandExitCode':code,'intake':completion}
b.save(R/'rerun-summary.json',summary)
b.save(R/'rerun-progress.json',{'state':'closed_at_user_time_cutoff_report_written','updatedAt':b.now()})
print(json.dumps(summary,ensure_ascii=False),flush=True)
