"""Build L04 from bounded, manually verified source facts. No network or media retrieval.

Research date: 2026-10-05. Re-running reproduces this inventory, not a fresh source review.
"""
import json
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE / 'content/library'
REPORT = ROOT / 'reports/modern-preaching'
DAY = '2026-10-05'
DG = 'https://www.desiringgod.org/'
LIG = 'https://learn.ligonier.org/'

def read(p):
    return json.loads(p.read_text(encoding='utf-8'))

def write(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')

def ev(url, locator, note):
    return dict(url=url, locator=locator, note=note, checkedOn=DAY)

def common(kind, ident):
    return {'$schema':'../../schema.json', 'schemaVersion':1, 'kind':kind, 'id':ident,
            'editorialState':'catalogued', 'notes':[], 'reviews':[]}

def save(doc):
    write(ROOT/'catalog'/('series' if doc['kind']=='series' else doc['kind']+'s')/(doc['id']+'.json'), doc)

def event(kind, date, note, evidence):
    return dict(event=kind, value=date, precision='day' if date else 'unknown', label=note, evidence=evidence)

# Titles, dates and texts checked against official sermon pages; order against
# the ministry's biblical index and adjacent-message links. Never infer a date
# from weekly spacing: the gaps in Sproul's sequence are intentional.
PIPER = [
 ('Ruth: Sweet and Bitter Providence','ruth-sweet-and-bitter-providence','1984-07-01',1,1957.554626),
 ('Ruth: Under the Wings of God','ruth-under-the-wings-of-god','1984-07-08',2,2144.584),
 ('Ruth: Strategic Righteousness','ruth-strategic-righteousness','1984-07-15',3,1873.33449),
 ('Ruth: the Best Is Yet to Come','ruth-the-best-is-yet-to-come','1984-07-22',4,1879.67),
]
SPROUL = [
 ('Introduction & Background','introduction-and-background','2008-03-30',1,1,1,'49:56'),
 ('Make Your Calling Sure','make-your-calling-sure','2008-04-06',1,1,1,'41:54'),
 ('More Precious Than Gold','more-precious-than-gold','2008-04-20',1,2,4,'45:08'),
 ('Due Diligence','due-diligence','2008-05-04',1,5,11,'45:31'),
 ('Remember These Things','remember-these-things','2008-05-11',1,12,18,'44:15'),
 ('Heed the Prophetic Word','heed-the-prophetic-word','2008-05-18',1,19,21,'50:58'),
 ('False Prophets & Teachers','false-prophets-and-teachers','2008-05-25',2,1,6,'50:04'),
 ('God’s Finite Grace','gods-finite-grace','2008-06-29',2,4,11,'46:07'),
 ('God’s Wrath for Apostates','gods-wrath-for-apostates','2008-07-06',2,12,17,'49:12'),
 ('Empty Words & False Liberty','empty-words-and-false-liberty','2008-07-13',2,18,22,'42:50'),
 ("God's Long-suffering",'gods-long-suffering','2008-07-20',3,1,9,'38:29'),
 ('Be Diligent & Vigilant','be-diligent-and-vigilant','2008-07-27',3,10,18,'48:58'),
]

def build():
    books = {b['name']:b for b in read(SITE/'content/apologetics/scripture-index.json')['books']}
    policies = read(REPORT/'ministry-inventory.json')['ministries']
    policies = {p['sourceId']:p for p in policies}
    rows, all_assets, series_ids = [], [], []
    for author, source, book, title, expected, index, data in [
        ('author-john-piper','source-desiring-god','Ruth','Ruth: Under the Wings of God (1984)',4,DG+'scripture/ruth/messages?sort=newest',PIPER),
        ('author-r-c-sproul','source-ligonier','2 Peter','2 Peter: Saint Andrew’s Chapel sermons (2008)',12,LIG+'scripture/2-peter?type=sermon',SPROUL),
    ]:
        is_dg = source == 'source-desiring-god'
        key = 'piper-ruth-1984' if is_dg else 'sproul-2-peter-2008'
        sid = 'series-l04-'+key
        members = []
        inventory_ev = [ev(index,'Biblical index: dated Ruth messages' if is_dg else 'Sermon filter: 12 results; Scripture order',
            'Only the four July 1984 sermons; excludes 2008 conference deliveries.' if is_dg else 'All twelve source-listed sermons, ordered by source index and adjacent links; book boundaries checked.')]
        if is_dg:
            inventory_ev.append(ev(DG+'messages/'+PIPER[0][1],'Opening paragraph','Announces four Sundays, one chapter each; final sermon identifies the end of the series.'))
        for pos, row in enumerate(data,1):
            sermon_title, slug, date = row[:3]
            if is_dg:
                ch, duration = row[3:]
                start, end = 1, books[book]['chapters'][ch-1]
                reference = f'{book} {ch}'
            else:
                ch, start, end, label = row[3:]
                mm, ss = map(int,label.split(':'))
                duration = mm*60+ss
                reference = f'{book} {ch}:{start}'+(f'–{end}' if end != start else '')
            duration_label = f'{int(duration)//60:02}:{int(duration)%60:02}'
            url = (DG+'messages/' if is_dg else LIG+'sermons/')+slug
            ident = 'l04-'+key+f'-{pos:02}'
            wid, eid = 'work-'+ident, 'edition-'+ident
            evidence = [ev(url,'Sermon heading, date, author and player','Official original-sermon destination; no upload or first-publication date established.'),
                        ev(index,'Scripture index entry','Main text as assigned by the source; not an incidental citation and not a claim of verse-by-verse exposition.')]
            w = dict(**common('work',wid),title=sermon_title,alternateTitles=[],creators=[dict(authorId=author,role='preacher')],
                genre='sermon',role='core-teaching',collections=['sermons'],subjects=[],occasions=['ordinary-worship'],audiences=['general'],depth='unknown',
                era='twentieth-century' if is_dg else 'twenty-first-century',
                dates=[event('delivery',date,'Archive-assigned sermon date; independent service documentation not collated.',evidence[:1]),event('original-publication',None,'Not documented by inspected source.',[])],
                passages=[dict(reference=reference,numberingSystem='english',role='main-text',start=books[book]['num']*1000000+ch*1000+start,
                               end=books[book]['num']*1000000+ch*1000+end,verification='verified',locator=index+'; source-assigned Scripture heading')],
                related=[],externalIds={'officialDestination':[url]},evidence=evidence)
            w['notes']=['Metadata verified; recording has not been listened through or audited for theological content.']
            if is_dg:
                w['notes'].append('Whole-chapter indexing follows the source. Later UCCF messages, Light + Truth edits and book treatments are distinct manifestations, not replacement copies.')
            elif pos <= 2:
                w['notes'].append('2 Peter 1:1 is supplied by the biblical index, absent from the detail-page Scripture label. Introduction may be survey rather than substantial exposition; coverage review required.')
            save(w)
            e = dict(**common('edition',eid),workId=wid,label='Official archive presentation of the original sermon',languages=['en'],contributors=[],
                publisher='Desiring God' if is_dg else 'Ligonier Ministries',dates=[event('upload',None,'Archive upload date is not supplied; do not substitute delivery date.',[])],
                abridgment='unknown',modernization='unknown',evidence=evidence)
            e['notes']=['Recording completeness and correspondence between written text and spoken delivery have not been collated.']
            save(e)
            asset_ids=[]
            for fmt in (['audio','html'] if is_dg else ['audio']):
                aid='asset-'+ident+'-'+fmt
                p=policies[source]
                actions={a:'unknown' for a in ['download','host','redistribute','adapt','transcribe','embed','indexMetadata','indexFullText']}
                actions.update(indexMetadata='allowed',host='denied',redistribute='denied')
                conditions=[]
                if is_dg and fmt=='audio':
                    actions['embed']='conditional'
                    conditions=['Only the complete unaltered original using the source’s own embed; noncommercial use and required attribution.','No app re-upload, transcript ingestion or bulk retrieval is authorized by this record.']
                if not is_dg:
                    actions.update(embed='denied',adapt='denied')
                rights=dict(category='link-only',jurisdiction=None,licenseId=None,licenseUrl=None,
                    attribution='By John Piper. © Desiring God Foundation. Source: desiringGod.org' if is_dg else sermon_title+' by R.C. Sproul. © Ligonier Ministries. Source: '+url,
                    conditions=conditions,conditionsMet=False,actions=actions,evidence=p['policyEvidence'],
                    unresolved=['Project-scale downloads, full-text indexing, transcription and republication require a separate decision or written permission.'],
                    review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Link inventory and source-policy routing; not a grant for systematic retrieval or publication.'))
                a=dict(**common('asset',aid),editionId=eid,sourceId=source,canonicalUrl=url,finalUrl=None,format=fmt,
                    mediaKind='original-recording' if fmt=='audio' else 'text',acquisitionStatus='link-only',storage='none',relativePath=None,
                    sha256=None,byteCount=None,mimeType=None,retrievedAt=None,rights=rights,fullTextIndexed=False,
                    processing=dict(parentAssetId=None,method='none',tool=None,toolVersion=None,parameters=None,date=None,note='Bibliographic facts only; no media or sermon text acquired into the library.'),
                    quality=dict(state='unreviewed',reviewedBy=None,reviewedOn=None,note='Identity and available format checked; complete content not reviewed.'))
                if fmt=='audio':
                    a['recording']=dict(durationSeconds=duration,durationLabel=duration_label,
                        evidence=[ev(url,'Official audio element loaded duration' if is_dg else 'Hydrated official audio player total-time display',
                                     'Seconds read from browser media metadata; display label floors fractional seconds.' if is_dg else 'Minutes:seconds displayed by the player; initial 00:00 placeholder excluded.')],
                        note='Duration of this original archive recording, not an edited podcast or later reading.')
                save(a)
                asset_ids.append(aid);all_assets.append(aid)
            members.append(dict(workId=wid,position=pos,originalLabel=f'Catalog position {pos}; source chronological/Scripture sequence'))
            rows.append(dict(workId=wid,editionId=eid,assetIds=asset_ids,authorId=author,sourceId=source,title=sermon_title,seriesId=sid,
                seriesPosition=pos,positionBasis='Source index, sermon dates and neighboring-message links; ordinal assigned by catalog.',passage=reference,
                date=date,dateKind='archive-assigned-delivery',publicationDate=None,uploadDate=None,durationSeconds=duration,durationLabel=duration_label,
                availableFormats=['MP3 audio','HTML written message'] if is_dg else ['streaming audio'],officialDestination=url,
                acquisitionMethod='manually-curated-metadata-and-official-link',checkedOn=DAY))
        s=dict(**common('series',sid),title=title,authorIds=[author],members=members,expectedCount=expected,completeness='complete',inventoryEvidence=inventory_ev,missing=[])
        s['notes']=['Complete within the specified source-listed series, not an author-wide census or a fully downloaded/reviewed corpus.','Series positions are catalog ordinals, not original sermon numbers.']
        save(s);series_ids.append(sid)
    write(REPORT/'sermon-inventory.json',dict(checkedOn=DAY,method='Bounded individual official-page and player inspection; no crawler, endpoint harvesting or corpus download.',sermons=rows))
    counts=dict(works=len(rows),editions=len(rows),assets=len(all_assets),series=len(series_ids),reviewedWorks=0,publishedWorks=0)
    gaps=['No author-wide completeness claim. Two bounded biblical series are complete as link inventories.',
          'First publication/upload dates and recording completeness remain unknown. Archive-assigned delivery dates retain their source qualification.',
          'Source main texts are verified bibliographic metadata, not a completed substantial-exposition assessment.',
          'No original content files downloaded, no transcript/search ingestion, no website publication.',
          'Ferguson church archive and Murray media require reuse/automation clearance; Packer has no complete biblical sermon series established in the inspected Ligonier collection.',
          'MLJ Trust database retrieval requires prior written permission; no individual-sermon database was harvested.',
          'Begg and Carson remain provisional in the shared author registry and outside core-teaching acquisition.']
    write(REPORT/'summary.json',dict(checkedOn=DAY,counts=counts,ministries=len(policies),eligibleAuthorsMapped=6,completeSeriesInventories=2,
        downloadedAssets=0,downloadedBytes=0,verifiedDurations=16,unknownPublicationDates=16,unknownUploadDates=16,gaps=gaps))
    write(REPORT/'checkpoint.json',dict(checkedOn=DAY,completedSeries=series_ids,assetIds=all_assets,automaticRetrievalEnabled=False,
        nextSteps=['Resolve permission requests in ministry-inventory.json before changing acquisition mode.',
                   'Continue a bounded Desiring God biblical series, preserving original-sermon versus podcast identities.',
                   'Ligonier: extend Saint Andrew’s biblical sermon inventories through official links; do not promote course lectures into sermon counts.',
                   'FPC Columbia: establish Ferguson-only complete 1 John series and broadcaster/platform access terms.',
                   'Packer: locate an authoritative biblical sermon-series inventory; Murray: establish source sequence and repair ambiguous duration labels through the original player.']))
    save_run={'$schema':'../../schema.json','schemaVersion':1,'kind':'run','id':'run-l04-modern-preaching-2026-10-05',
        'missionId':'L04','status':'complete','startedOn':DAY,'completedOn':DAY,
        'boundary':'Five-ministry source/access inventory for six eligible modern-era authors; complete Piper Ruth (1984) and Sproul 2 Peter (2008) source-link pilots. No exhaustive archive acquisition.',
        'sourceIds':list(policies),'inventory':'content/library/reports/modern-preaching/sermon-inventory.json',
        'checkpoint':'content/library/reports/modern-preaching/checkpoint.json','counts':counts,'gaps':gaps,'reportPath':'content/library/reports/modern-preaching/REPORT.md'}
    save(save_run)
    print(json.dumps(counts))

if __name__ == '__main__':
    build()
