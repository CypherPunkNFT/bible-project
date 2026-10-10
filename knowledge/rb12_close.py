import sys,re,collections
sys.path.insert(0,'knowledge');import bulk_collect as b
from run_bulk_mission import work_key
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB12';summary=b.read(R/'rerun-summary.json');new=[x for x in b.read(R/'acquisition-manifest.json')['files'] if x.get('campaignMission')=='RB12' and x.get('countAsBook',True)]
keys=set()
for x in new:
 key=work_key(x)
 if re.search(r'minutes|proceedings|annual register|annual report|circular letter',x['title'],re.I):
  year=re.search(r'\b(?:16|17|18|19)\d{2}\b',str(x.get('sourceMetadata',{}).get('date',x.get('date',''))))
  if year:key=key+(year[0],)
 keys.add(key)
before=b.read(R/'embedding-before.json');after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json');b.save(R/'embedding-after.json',after)
summary.update(distinctWorksEstimate=len(keys),distinctWorksBasis='Normalized author/title; publication year distinguishes dated annual records',embeddingAfter=after,updatedAt=b.now());b.save(R/'rerun-summary.json',summary)
lines=['# RB12 re-run — Baptist history and primary records','',f"**{len(new):,} new originals · {sum(x['bytes'] for x in new)/1e9:.3f} GB · approximately {len(keys):,} distinct works/annual issues · 2 acquisition sources (3 catalogues checked).**",'', '| Source | New files | GB |','|---|---:|---:|']
for source in ['tcp','ccel','ia']:
 rows=[x for x in new if x['source']==source];lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
lines+=['',f"**Failures: {summary['failedDownloads']} requests; prior failed IDs skipped: {summary['previouslyFailedSkipped']}; collection blockers: {len(summary['blockers'])}.** TCP failures: 0; IA failures: 109. No retries. Full failed IDs, URLs and errors: `failed-downloads.json`; checklist: `FAILED-DOWNLOADS-TODO.md`.",'',f"**Shared passage total before → after: {before['total']:,} → {after['total']:,} (+{after['total']-before['total']:,}).** Indexed: {before['indexed']:,} → {after['indexed']:,}; remaining: {after.get('remaining',0):,}. Snapshot: {after.get('updated_at')}; state: **{after['state']}**.",'','These are shared campaign totals, including concurrent missions; the increase is not an RB12-only passage count.', '', '`finish-intake.ps1` ran after downloads (exit 0); the existing completion pipeline owns the exclusive lock. One shared embedding pass remains active; later RB12 inputs await its automatic late-acquisition refresh. Import and embedding completion remain pending.']
if after['indexed']-before['indexed']<100000:lines+=['Fewer than 100,000 newly embedded passages at report time: the shared embedding backlog is still running and late RB12 downloads await its refresh.']
lines+=['','Distinct-work estimate groups normalized author/title and separates dated annual issues; edition variants may remain. Counts exclude previously held originals and first-run files. New originals retain provenance, credit, licence, audience and language metadata; no new evidenceOnly holds. One source entry per source was added to `SOURCES.md`.']
(R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print({'files':len(new),'GB':sum(x['bytes'] for x in new)/1e9,'distinctWorksEstimate':len(keys),'failed':summary['failedDownloads'],'before':before['total'],'after':after['total'],'indexed':after['indexed'],'reportWords':len(' '.join(lines).split())})
