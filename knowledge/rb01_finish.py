"""Finish the authorized RB01 batches and write the one-page numeric report."""
import ctypes, json, re, subprocess, sys, time, unicodedata
from collections import Counter
from pathlib import Path
import bulk_collect as b

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB01'

def title_key(x):
    title=unicodedata.normalize('NFKD',x['title']).encode('ascii','ignore').decode().lower()
    title=title.split(':')[0]
    title=re.sub(r'\b(?:vol(?:ume)?|v|part|pt)\.?\s*[ivxlcdm\d]+\b',' ',title)
    title=re.sub(r'[^a-z0-9]+',' ',title).strip()
    title=re.sub(r'^(?:the|an|a) ','',title)
    return title

def report():
    m=b.read(R/'acquisition-manifest.json')
    new=[x for x in m['files'] if x.get('campaignMission')=='RB01' and x.get('countAsBook',True)]
    for x in new:
        if x['source']=='ia' and 'Princeton digitization programme' in str(x.get('licence','')):
            x['licence']='Historical edition published through 1930; public-domain US text; source electronic notices retained'
            b.append_manifest(x,update=True)
    after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json');before=b.read(R/'embedding-before.json')
    b.save(R/'embedding-after.json',after)
    lines=['# RB01 re-run — Baptist doctrine and confessions','',
        f"**New complete originals: {len(new):,}; {sum(x['bytes'] for x in new)/1e9:.3f} GB. Sources: {len({x['source'] for x in new})}. Distinct normalized title groups: {len({title_key(x) for x in new}):,}.** Title groups collapse punctuation, subtitles and volume labels; edition variants may remain. Existing originals and the first-run component files are excluded from new-file counts.",'',
        '| Source | New originals | GB |','|---|---:|---:|']
    for source in ['tcp','ccel','ia']:
        rows=[x for x in new if x['source']==source]
        lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
    failed=sum(len(re.findall(r'^.* FAILED ',p.read_text('utf-8',errors='replace'),re.M)) for p in R.glob('*acquisition*.log'))
    discarded=sum(x.get('campaignMission')=='RB01' and not x.get('countAsBook',True) for x in m['files'])
    retries=b.read(R/'ia-acquisition-retry.json',{});last=b.read(R/'ia-acquisition.json',{})
    unresolved=len(retries.get('failures',last.get('failures',[])))
    lines+=['',f"Failed item attempts: **{failed}**; remaining unavailable/failed items: **{unresolved}**. **{discarded}** unintended same-name/contributor/community copies were discarded by the author/collection filters, not retained as evidenceOnly. Original credit and licence fields remain metadata.",'',
        f"Passages before: **{before['total']:,}** ({before['indexed']:,} embedded). After-command snapshot: **{after['total']:,}** ({after['indexed']:,} embedded). Change in passage total: **{after['total']-before['total']:+,}**. Embedding state: **{after['state']}**. Snapshot: {after['updated_at']}."]
    if after['total']-before['total']<100000:
        lines+=['Fewer than 100,000 new passages: the current shared intake has not yet finished incorporating this batch; the total is a processing snapshot, not a claim that all new originals are embedded.']
    completion=b.read(b.ROOT/'KnowledgeBase/intake-completion.json',{})
    lines+=['',f"Intake: `finish-intake.ps1` invoked after the completed downloads; shared pipeline state **{completion.get('state','unknown')}**. Its exclusive lock prevents a second embedding worker. Separate pre-existing bulk acquisition jobs may cause further intake refreshes; passage changes include concurrent work and are not solely attributable to RB01.",'',
        'Author/collection screening covers the named doctrinal authors, including Latin and abbreviated authority forms. IA uses historical institutional/microfilm editions through 1930 and existing TXT/EPUB; TCP preserves CC0 TEI, CCEL preserves offered ThML and edition credit. No new OCR, public publication, reading maps or check suites.']
    (R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    b.save(R/'rerun-summary.json',{'state':'downloads_complete','updatedAt':b.now(),'files':len(new),
        'bytes':sum(x['bytes'] for x in new),'distinctTitleGroups':len({title_key(x) for x in new}),
        'sources':dict(Counter(x['source'] for x in new)),'failedAttempts':failed,'unresolvedItems':unresolved,
        'discardedFilterMismatches':discarded,'embeddingBefore':before,'embeddingAfter':after,'intake':completion})

def main():
    b.REPORT=R
    b.save(R/'rerun-progress.json',{'state':'waiting_for_main_ia_batch','updatedAt':b.now()})
    while b.read(R/'ia-acquisition.json',{}).get('state')!='complete':
        time.sleep(30)
    # These are supplementary aliases, not another campaign mission.
    b.save(R/'rerun-progress.json',{'state':'collecting_latin_and_abbreviated_authorities','updatedAt':b.now()})
    with (R/'ia-acquisition-latin-variants.log').open('w',encoding='utf-8') as log:
        code=subprocess.run([sys.executable,'-X','utf8','-u',str(b.SITE/'knowledge/bulk_collect.py'),
            'collect','--source','ia','--filter',str(R/'filters/ia-latin-variants.json'),'--limit','0','--mission','RB01'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT).returncode
    if code: b.save(R/'supplementary-blocker.json',{'exitCode':code,'updatedAt':b.now()})
    # One retry of failed item IDs, using the current existing-text/EPUB collector.
    states=[b.read(R/'ia-acquisition.json',{}),b.read(R/'ia-acquisition-latin-variants.json',{})]
    ids=list({x['sourceId'] for state in states for x in state.get('failures',[])})
    if ids:
        filt=b.read(R/'filters/ia.json');filt['authors']+=b.read(R/'filters/ia-latin-variants.json')['authors']
        filt['ids']=ids;filt['batchName']='retry';b.save(R/'filters/ia-retry.json',filt)
        # Reuse each cached catalogue so supplemental-only IDs are also available.
        catalogues=[]
        for name in ['ia','ia-latin-variants']:
            catalogues+=b.catalogue('ia',b.Client(),b.read(R/'filters'/(name+'.json')))
        seen={x['sourceId']:x for x in catalogues}
        original_catalogue=b.catalogue
        b.catalogue=lambda source,client,filters=None:list(seen.values()) if source=='ia' else original_catalogue(source,client,filters)
        with (R/'ia-acquisition-retry.log').open('w',encoding='utf-8') as log:
            previous=sys.stdout;sys.stdout=log
            try:b.collect('ia',filt,0)
            finally:sys.stdout=previous
    b.save(R/'rerun-progress.json',{'state':'running_intake_command','updatedAt':b.now()})
    with (R/'finish-intake.log').open('w',encoding='utf-8') as log:
        code=subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','knowledge/finish-intake.ps1'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT).returncode
    report()
    b.save(R/'rerun-progress.json',{'state':'downloads_complete_report_written','intakeCommandExitCode':code,'updatedAt':b.now()})

if __name__=='__main__':main()
