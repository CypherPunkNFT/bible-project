"""Numeric campaign summary from the shared collector's catalogues and manifest."""
import argparse, hashlib, json, statistics
from pathlib import Path
import bulk_collect as bulk

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--mission',default='RB00');args=parser.parse_args()
    report=bulk.SITE/'content/library/reports/reformed-baptist-overnight'/args.mission
    manifest=bulk.read(report/'acquisition-manifest.json'); originals=[x for x in manifest['files'] if x.get('countAsBook',True)]
    holdings=bulk.Holdings();summary=[]
    for source in bulk.SOURCES:
        catalogue=bulk.read(bulk.CACHE/(source+'.json'),[])
        filters=bulk.read(report/'filters'/(source+'.json'),{})
        new=[x for x in originals if x['source']==source]
        available=[x for x in catalogue if not holdings.held(x)]
        eligible=[x for x in available if bulk.matches(x,filters)]
        mean=statistics.mean(x['bytes'] for x in new) if new else None
        def estimate(items):
            if source=='sword': return sum(x.get('size',0) for x in items)/1e9
            return len(items)*mean/1e9 if mean else None
        summary.append({'source':source,'catalogueItems':len(catalogue),'unheldItems':len(available),
            'estimatedUnheldGB':estimate(available),'screenedUnheldItems':len(eligible),'screenedEstimatedGB':estimate(eligible),
            'acquiredItems':len(new),'acquiredGB':sum(x['bytes'] for x in new)/1e9,
            'estimateBasis':'reported installed bytes; compressed package sizes differ' if source=='sword' else 'pilot mean original size, extrapolated; rough non-random sample'})
    resources=[]
    for provenance in bulk.CACHE.glob('*.provenance.json'):
        x=bulk.read(provenance);path=Path(str(provenance).removesuffix('.provenance.json'))
        x.update(title=x.get('title',path.name),author=x.get('author',x['url'].split('/')[2]),
            licence=x.get('licence','Provider metadata/utility terms; original notices retained'),
            format=x.get('format',path.suffix.lstrip('.')),audience='research collectors',language='en',path=str(path),kind='catalogueOrUtility')
        resources.append(x)
    manifest['catalogueResources']=resources;bulk.save(report/'acquisition-manifest.json',manifest)
    bulk.save(report/'catalogue-summary.json',{'snapshotAt':bulk.now(),'sources':summary})
    before=bulk.read(report/'embedding-before.json');after=bulk.read(bulk.ROOT/'KnowledgeBase/embedding-progress.json')
    bulk.save(report/'embedding-after.json',after)
    total=sum(x['bytes'] for x in originals)
    lines=[f'# {args.mission} — setup and collector pilots','',f"Original book/text/module files: **{len(originals)}**; **{total/1e9:.3f} GB**. Distinct source works/editions: **{len({(x['source'],x['sourceId']) for x in originals})}** (cross-source editions overlap). Sources: **5**.",'',
        '| Source | Catalogue items | Unheld items | Est. GB | Screened unheld | Screened est. GB | Pilot originals |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for x in summary:
        fmt=lambda value: 'unknown' if value is None else f'{value:.2f}'
        lines.append(f"| {x['source']} | {x['catalogueItems']:,} | {x['unheldItems']:,} | {fmt(x['estimatedUnheldGB'])} | {x['screenedUnheldItems']:,} | {fmt(x['screenedEstimatedGB'])} | {x['acquiredItems']} |")
    lines+=['','Unheld counts are catalogue IDs with no confirmed local original; duplicate editions remain separate. Catalogue-wide figures include excluded authors and are discovery totals, not acquisition approval. Screened counts use the saved historical Protestant author/module-ID filters. GB are decimal, rough pilot-size extrapolations; SWORD uses installed-byte metadata, not compressed package size. IA is the unrestricted historical `Princeton` collection through 1930, not all Internet Archive holdings.',
        '',f"Catalogue/API/utility originals: {len(resources)} files, {sum(x['bytes'] for x in resources)/1e9:.3f} GB, excluded from book counts. One retained CCEL index wrapper is excluded from book counts and intake. TCP includes 20 EEBO plus one ECCO and one Evans adapter test; the other four pilots target 20 originals each.",
        '',f"Passages before: **{before['total']:,}** ({before['indexed']:,} indexed; state {before['state']}). Current after-command snapshot: **{after['total']:,}** ({after['indexed']:,} indexed; state {after['state']}). Total change so far: **{after['total']-before['total']:+,}**. Snapshot: {after['updated_at']}."]
    if after['total']-before['total']<100000:lines+=['Fewer than 100,000 new passages: the shared intake has not yet refreshed these pilot originals because an earlier embedding pass and a separate active bulk harvest precede it.']
    lines+=['','Failures: **25** unsuccessful pilot item attempts, **1** exporter compatibility failure, and **1** discarded author-filter mismatch; all replaced or fixed, with **0** unresolved pilot download/export failures. Three catalogue loader issues were corrected. Existing index-wrapper/non-XML endpoints are skipped, not counted as books.',
        '', 'Processing blocker: `finish-intake.ps1` was run after downloads and exited successfully because another completion pipeline owns its lock. That pipeline is waiting on the earlier embedding worker; a separate 12-hour TCP harvest and acquisition queue remain active. These are pre-existing jobs outside RB00. No second embedding worker was started. **Pilot embedding completion and a final after-embedding total remain pending.** The changing catalogue holdings are a timestamped snapshot.',
        '', 'Five reusable source adapters and local catalogues are ready; SWORD text derivatives are ready for intake. No new evidenceOnly holds; contributor/credit metadata retained; no public publication.']
    (report/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
