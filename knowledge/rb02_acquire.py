"""RB02 bulk acquisition; failed downloads are deferred, never retried automatically."""
import hashlib, json, re, shutil, subprocess
from collections import Counter
from pathlib import Path
import bulk_collect as b
from rb01_finish import title_key

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB02'
b.REPORT=R
AUTHORS=['Tombes, John','John Tombes','Spilsbury, John','John Spilsbury','Spilsbery, John','John Spilsbery',
    'Kiffin, William','William Kiffin','Keach, Benjamin','Benjamin Keach',
    'Coxe, Nehemiah','Nehemiah Coxe','Cox, Benjamin','Benjamin Cox',
    'Booth, Abraham','Abraham Booth','Denne, Henry','Henry Denne','Danvers, Henry','Henry Danvers',
    'Witsius, Herman','Witsius, Hermann','Witsius, Hermannus','Herman Witsius','Hermannus Witsius',
    'Wits, Herman','Ball, John','John Ball','Owen, John','John Owen']
RULES=[{'namePattern':r'Owen,?\s+John|John\s+Owen','lifeYears':[1616,1683],
        'requireReligiousSubjectsWhenUndated':True},
    {'namePattern':r'Ball,?\s+John|John\s+Ball','lifeYears':[1585,1640],
        'requireReligiousSubjectsWhenUndated':True}]
COLLECTIONS=['Princeton','americana','toronto','europeanlibraries','library_of_congress','cdl',
    'bostonpubliclibrary','getty','wellcomelibrary','biodiversity','gutenberg','microfilm']
BASE={'authors':AUTHORS,'primaryAuthorOnly':True,'authorIdentityRules':RULES,'deferHardDownloads':True}

def setup():
    R.mkdir(parents=True,exist_ok=True)
    if not (R/'embedding-before.json').exists():
        archive=b.ROOT/'ARCHIVE'/'rb02-initial-20261007';archive.mkdir(parents=True,exist_ok=True)
        for name in ['REPORT.md','acquisition-manifest.json']:
            if (R/name).exists() and not (archive/name).exists():shutil.copy2(R/name,archive/name)
        b.save(R/'embedding-before.json',b.read(b.ROOT/'KnowledgeBase/embedding-progress.json'))
    b.save(R/'filters/tcp.json',BASE)
    b.save(R/'filters/ccel.json',BASE)
    # Broad official metadata search, then author/collection/topic selection locally.
    ia=BASE|{'collections':COLLECTIONS,'iaQuery':
        'mediatype:texts AND date:[1600-01-01 TO 1899-12-31] AND NOT access-restricted-item:true AND ('+
        ' OR '.join('creator:'+json.dumps(x,ensure_ascii=False) for x in AUTHORS)+')'}
    b.save(R/'filters/ia.json',ia)
    sources=b.SITE/'SOURCES.md'
    heading='## RB02 re-run: covenants, baptism and ordinances - bulk channels'
    if heading not in sources.read_text('utf-8-sig'):
        with sources.open('a',encoding='utf-8') as out:
            out.write('\n\n'+heading+'\n\n'
                '- **TCP:** official [EEBO/ECCO/Evans catalogue and repositories](https://github.com/textcreationpartnership/Texts); complete named-author corpus, including Spilsbery and Benjamin Cox authority forms; CC0 TEI originals and contributor headers retained. Held IDs and hashes skipped.\n'
                '- **CCEL:** [complete author catalogue](https://ccel.org/index/author), offered ThML for the named authors, under [CCEL edition terms](https://ccel.org/about/copyright.html); credits retained and robots crawl delay respected.\n'
                '- **Internet Archive:** official search/metadata/download channels; institutional and official microfilm editions dated 1600-1899 for the named authors and mission topics, plus Witsius covenant works, Owen on Hebrews, and Ball on the covenant. Existing TXT/EPUB only; contributor/sponsor/edition notices retained. No new OCR or restricted access.\n\n'
                'Originals: `content/library/reports/reformed-baptist-overnight/RB02/acquisition-manifest.json`. Numeric report: `REPORT.md`. Difficult requests are deferred in `failed-downloads.json`; private local import and embedding only.\n')

def collect():
    b.save(R/'rerun-progress.json',{'state':'collecting','updatedAt':b.now()})
    for source in ['tcp','ccel','ia']:
        filt=b.read(R/'filters'/(source+'.json'))
        try:
            if source=='ia':
                rows=b.catalogue(source,b.Client(attempts=1,timeout=20),filt)
                topical=re.compile(r'bapti|baptiz|paedo|pædo|infant|covenant|foeder|oeconom|econom|supper|communion|ordinance|sacrament|hebrew|federal',re.I)
                selected=[]
                for x in rows:
                    if not b.matches(x,filt):continue
                    primary=x['author'].split(';')[0]
                    if re.search(r'Owen,?\s+John|John\s+Owen',primary,re.I):
                        include=bool(re.search(r'hebrew',x['title'],re.I))
                    elif re.search(r'Ball,?\s+John|John\s+Ball',primary,re.I):
                        include=bool(re.search(r'covenant',x['title']+' '+x.get('subjects',''),re.I))
                    else:
                        include=bool(topical.search(x['title']+' '+x.get('subjects','')))
                    if include:selected.append(x['sourceId'])
                # IDs are derived from catalogue topic metadata, not per-work admission audits.
                filt['ids']=selected or ['__no_topic_matches__']
                b.save(R/'filters/ia-selected.json',filt)
            with (R/(source+'-acquisition.log')).open('w',encoding='utf-8') as log:
                import sys
                previous=sys.stdout;sys.stdout=log
                try:outcome=b.collect(source,filt,0)
                finally:sys.stdout=previous
            print(source,outcome['downloaded'],'new originals;',len(outcome['failures']),'deferred failures',flush=True)
        except Exception as e:
            b.save(R/(source+'-catalogue-blocker.json'),{'source':source,'error':str(e),'updatedAt':b.now()})
            print(source,'deferred source error:',str(e),flush=True)

def finish():
    manifest=b.read(R/'acquisition-manifest.json',{'files':[]})
    new=[x for x in manifest['files'] if x.get('campaignMission')=='RB02' and x.get('countAsBook',True)]
    failures=[];blockers=[]
    for source in ['tcp','ccel','ia']:
        for status in R.glob(source+'-acquisition*.json'):
            failures += [x|{'source':source} for x in b.read(status,{}).get('failures',[])]
        blocker=b.read(R/(source+'-catalogue-blocker.json'))
        if blocker:blockers.append(blocker)
    b.save(R/'failed-downloads.json',{'updatedAt':b.now(),'items':failures,'sourceBlockers':blockers,
        'policy':'One attempt; difficult requests deferred, no automatic retry'})
    todo=['# RB02 failed-download TODO','',f'{len(failures)} failed item requests; {len(blockers)} source blockers. IDs, URLs and errors: `failed-downloads.json`.','']
    todo += [f"- [ ] {x['source'].upper()} `{x['sourceId']}`: {x['error']}" for x in failures]
    todo += [f"- [ ] {x['source'].upper()} catalogue: {x['error']}" for x in blockers]
    (R/'FAILED-DOWNLOADS-TODO.md').write_text('\n'.join(todo)+'\n',encoding='utf-8')
    before=b.read(R/'embedding-before.json')
    current=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json')
    print('Intake progress before command:',current['state'],current['total'],current['indexed'],flush=True)
    with (R/'finish-intake.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','knowledge/finish-intake.ps1'],
            cwd=b.SITE,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    try:code=process.wait(timeout=2)
    except subprocess.TimeoutExpired:code=None
    after=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json');b.save(R/'embedding-after.json',after)
    completion=b.read(b.ROOT/'KnowledgeBase/intake-completion.json',{})
    works=len({(x['author'].split(';')[0],title_key(x)) for x in new})
    counts=Counter(x['source'] for x in new)
    lines=['# RB02 re-run - covenants, baptism and ordinances','',
        f"**{len(new):,} new originals; {sum(x['bytes'] for x in new)/1e9:.3f} GB; {len(counts)} acquisition sources; approximately {works:,} distinct works by normalized author/title.** Edition variants may remain; existing holdings and first-run files excluded from new counts.",'',
        '| Source | New originals | GB |','|---|---:|---:|']
    for source in ['tcp','ccel','ia']:
        rows=[x for x in new if x['source']==source]
        lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
    lines += ['',f'Failed downloads: **{len(failures)}**, deferred without retries. Source blockers: **{len(blockers)}**. See `FAILED-DOWNLOADS-TODO.md` and `failed-downloads.json`. No new evidenceOnly holds; credits and provenance retained.',
        '',f"Passage total before: **{before['total']:,}**. After-command snapshot: **{after['total']:,}**. Change: **{after['total']-before['total']:+,}**. Embedded: **{before['indexed']:,} to {after['indexed']:,}**. Snapshot state **{after['state']}**, timestamp {after['updated_at']}."]
    if after['total']-before['total']<100000:
        lines.append('Fewer than 100,000 new passages: many named-author originals are already held, failed requests are deferred, and the active shared intake has not yet incorporated this mission completely.')
    lines += ['',f"`finish-intake.ps1` invoked after downloads ({'running in background' if code is None else 'exit '+str(code)}); shared pipeline state **{completion.get('state','unknown')}**. Exclusive lock prevents a second embedding worker. Import/embedding completion remains pending; concurrent pre-existing acquisition jobs may affect totals.",
        '', 'TCP runs through every unheld catalogue match for the named historical authors, across EEBO/ECCO/Evans, plus topic matches from Knollys, Norcott, Stennett, Grantham, Collins, Bunyan and Gill. IA supplements the 1600-1899 institutional/microfilm catalogue by author and topic metadata; Owen is restricted to Hebrews and Ball to covenant texts. CCEL offered author editions are checked by held IDs/hashes. No new OCR, reading maps, or check suites.']
    (R/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    summary={'state':'downloads_complete_report_written','updatedAt':b.now(),'files':len(new),
        'bytes':sum(x['bytes'] for x in new),'distinctWorksEstimate':works,'sources':dict(counts),
        'failures':len(failures),'blockers':blockers,'embeddingBefore':before,'embeddingAfter':after,
        'intakeCommandExitCode':code,'intake':completion}
    b.save(R/'rerun-summary.json',summary);b.save(R/'rerun-progress.json',{'state':summary['state'],'updatedAt':b.now()})
    print(json.dumps(summary),flush=True)

if __name__=='__main__':
    setup();collect();finish()
