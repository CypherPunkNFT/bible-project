import sys
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'knowledge'))
import bulk_collect as b
R=Path.cwd()/'content/library/reports/reformed-baptist-overnight/RB09';b.REPORT=R
m=b.read(R/'acquisition-manifest.json')
for x in m['files']:
    if x.get('campaignMission')=='RB09' and x['source']=='sword':
        x['author']=b.SWORD_AUTHORS.get(x['sourceId']) or 'CrossWire module edition contributors'
        if x.get('derivedText'):x['derivedText']['author']=x['author']
        provenance=b.CACHE/'provenance/sword'/(Path(x['path']).name+'.json')
        if provenance.exists():b.save(provenance,x)
b.save(R/'acquisition-manifest.json',m)
f=b.read(R/'failed-downloads.json');unique={}
for x in f['items']:
    key=(x['source'],x['sourceId'])
    if key not in unique:unique[key]=x
f['items']=list(unique.values());f['updatedAt']=b.now();b.save(R/'failed-downloads.json',f)
todo=['# RB09 failed-download TODO','',f"{len(unique)} distinct failed/deferred items; no automatic retries.",'']
todo += [f"- [ ] {x['source'].upper()} `{x['sourceId']}`: {x['error']}" for x in f['items']]
todo += ['', 'Full URLs and original errors: `failed-downloads.json`.']
(R/'FAILED-DOWNLOADS-TODO.md').write_text('\n'.join(todo)+'\n',encoding='utf-8')
s=b.read(R/'rerun-summary.json');before=s['embeddingBefore'];after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
completion=b.read(b.ROOT/'KnowledgeBase/intake-completion.json')
s.update(failedDownloads=len(unique),embeddingAfter=after,intake=completion,excludedAuthorItems=41,
    intakeBlocker='Pre-existing TCP acquisition reader holds database; completion job waits for its natural exit')
b.save(R/'rerun-summary.json',s);b.save(R/'embedding-after.json',after)
n=[x for x in m['files'] if x.get('campaignMission')=='RB09' and x.get('countAsBook',True)]
assert len(n)==s['files'] and all(x.get(k) for x in n for k in ['url','sha256','title','author','licence','format'])
lines=['# RB09 re-run: interpreting genres and difficult passages','',
    f"**{s['files']} new originals; {s['bytes']/1e9:.3f} GB; approximately {s['distinctWorksEstimate']} distinct works; 4 sources.** Counts exclude held files, first-run acquisitions and 41 unrelated author matches retained outside intake. Work count uses normalized author/title; edition variants may remain.",'',
    '| Source | Files | GB |','|---|---:|---:|']
for source in ['tcp','sword','ccel','ia']:
    rows=[x for x in n if x['source']==source]
    lines.append(f"| {source.upper()} | {len(rows)} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
lines += ['', '**35 SWORD text exports, 0.061 GB**, additional to originals and not counted as books. '
    f"**{len(unique)} distinct failed/deferred items; 0 export failures; 0 collector blockers.** URLs/errors: `failed-downloads.json`; checklist: `FAILED-DOWNLOADS-TODO.md`. Failed requests were not retried. Originals, contributors and credit metadata retained; no new evidenceOnly flags.",'',
    f"**Passages before: {before['total']:,}. After: {after['total']:,}. Change: {after['total']-before['total']:+,}. Embedded: {before['indexed']:,} → {after['indexed']:,}.** Latest progress snapshot: {after['updated_at']}.",'',
    f"`finish-intake.ps1` ran after downloads. **Processing pending:** completion state `{completion['state']}`; intake PID {completion.get('pid','unknown')} waits for pre-existing TCP reader PID 96980 to release the database. No second embedding worker was started.",
    'Fewer than 100,000 new passages: this batch awaits intake behind the pre-existing database reader, so its downloaded texts have not yet changed the passage total.','',
    'Scope: Fairbairn Typology; Terry Hermeneutics; Angus Bible Handbook; historical Edersheim and Lightfoot catalogues; unheld Josephus editions; screened SWORD Bible dictionaries, topical handbooks and biblical language references. Catholic teaching and liberal theological sources excluded. Existing source text only; no new OCR. Source documentation: `Website/SOURCES.md`; all originals listed in `acquisition-manifest.json`.']
(R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(s['files'],s['bytes'],s['distinctWorksEstimate'],len(unique),completion['state'])
