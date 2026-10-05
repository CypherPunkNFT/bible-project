"""L10 offline catalog build: identified sources, bounded comparisons, no media scraping."""
import hashlib
import importlib.util
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]; LIB=SITE/'content/library'; OUT=LIB/'reports/islam-studies'
DAY='2026-10-05'
spec=importlib.util.spec_from_file_location('l06',SITE/'scripts/catalog-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
read=h.read; write=h.write; ev=h.ev; common=h.common
spec=importlib.util.spec_from_file_location('acq',SITE/'scripts/acquire-islam-studies.py')
acq=importlib.util.module_from_spec(spec); spec.loader.exec_module(acq)
URL=acq.EVIDENCE
WHITE='author-james-r-white'; ZWEMER='author-samuel-m-zwemer'; ALLY='author-shabir-ally'
INDEX=URL['white-debates']

def evidence(url,locator,note='Source identity and selected content checked; no whole-work endorsement.'):
    return [ev(url,locator,note)]

def dated(event,value,label,e):
    return dict(event=event,value=value,precision={4:'year',7:'month',10:'day'}[len(value)],label=label,evidence=e)

def register():
    a=read(LIB/'authors.json')
    additions=[
      (WHITE,'James R. White','eligible',['reformed','baptist'],'twenty-first-century',
       'Identifies himself as a Reformed Baptist elder; Baker identifies his ministry as evangelical Reformed. Selected Islam works fit the broader Calvinist collection.',
       evidence(URL['white-sacrifice'],'Opening self-identification')+evidence('https://learn.ligonier.org/teachers/james-white','Institutional teacher bibliography')+evidence('https://bakerpublishinggroup.com/authors/james-r-white/673','Publisher author biography')),
      (ZWEMER,'Samuel Marinus Zwemer','eligible',['reformed','continental-reformed'],'twentieth-century',
       'Reformed missionary and theologian; primary discussion distinguishes Calvinistic decrees from his account of Islamic fatalism. Historical judgments require work-level review.',
       evidence(acq.BOOKS['zwemer-god'][2],'Chapter VII, pp. 93-106; compare pp. 107ff')+evidence('https://www.zwemercenter.com/brief-biography-of-samuel-zwemer/','Biography, Reformed ministry and Calvinist theology')),
      (ALLY,'Shabir Ally','context-only',[],'twenty-first-century','Muslim debate participant; retained for accurate representation of his position, not recommended Christian teaching.',evidence(URL['ally-deity'],'Byline, My Reflections on the Ally-White Debate; posting account nazam44')),
      ('author-yusuf-bux','Yusuf Bux','context-only',[],'twenty-first-century','Muslim participant identified in the official event heading; no Christian author eligibility implied.',evidence(URL['white-trinity'],'Event heading; tag misspells surname Tux')),
      ('author-zakir-hussain','Zakir Hussain','context-only',[],'twenty-first-century','Muslim participant identified in the official event heading; identity scoped to this debate, not namesakes.',evidence(URL['white-prophecy'],'Event heading')),
      ('author-adnan-rashid','Adnan Rashid','context-only',[],'twenty-first-century','Muslim participant identified in the official debate listing; not recommended Christian teaching.',evidence(URL['white-bible-quran'],'Event heading'))]
    for ident,name,status,trad,cohort,reason,e in additions:
        item=dict(id=ident,entityType='person',name=name,aliases=[],cohort=cohort,traditions=trad,eligibility=status,rationale=reason,
          receptionBasis='Institutional bibliography and primary theological evidence identified.' if status=='eligible' else 'Primary debate/attributed article identity only; contextual inclusion.',
          evidence=e,distinctives=[],unresolved=['No blanket approval of all works, political opinions or source rights.'] if status=='eligible' else ['Scope of attribution must remain attached to each source.'],
          review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Initial mission-specific author screening; not independent human theological review.'))
        if not any(x['id']==ident for x in a['authors']): a['authors'].append(item)
    write(LIB/'authors.json',a)
    s=read(LIB/'sources.json')
    for ident,name,url,role,note in [
      ('source-zwemer-center','Zwemer Center for Muslim Studies','https://www.zwemercenter.com/','content-host','Three historic PDFs explicitly offered for reading/download. Download permission is separate from redistribution. Undated Christ impression not cleared for public reuse.'),
      ('source-alpha-omega','Alpha and Omega Ministries','https://www.aomin.org/','publisher','Official debate and article links only. robots.txt returned 404; this is not a prohibition. Script conservatively skipped automated retrieval; no media or transcripts acquired.'),
      ('source-ally-responses','Shabir Ally’s Responses (WordPress)','https://shabirally.wordpress.com/','content-host','Attributed Ally article posted by nazam44. Personal control/authentication unresolved. Private research snapshot only; no public text mirror.'),
      ('source-quran-com','Quran.com','https://quran.com/','content-host','Contextual Muslim primary text and named translations. Link and short attributed comparison only; no translation corpus acquisition.'),
      ('source-quran-corpus','Quranic Arabic Corpus','https://corpus.quran.com/','content-host','Parallel translator display used for short quotation collation. robots endpoint redirected to HTML, so no valid robots policy established; no systematic retrieval authorized.')]:
        if not any(x['id']==ident for x in s['sources']): s['sources'].append(dict(id=ident,name=name,url=url,role=role,automation='manual-only',acquisitionNote=note,evidence=evidence(url,'Source-specific access assessment',note),reviewedOn=DAY))
    write(LIB/'sources.json',s)

def build():
    register()
    files={f['key']:f for f in read(OUT/'acquisition-manifest.json')['files']}
    roots=[]; sections=[]; counts=dict(works=0,editions=0,assets=0,series=0,reviewedWorks=0,publishedWorks=0)
    def add(key,title,author,genre,role,source,url,topics,edition_label,date=None,locator='Source title and bibliographic description',note='',publisher=None):
        wid='work-l10-'+key; eid='edition-l10-'+key; aid='asset-l10-'+key+('-pdf' if key in acq.BOOKS else '-link')
        e=evidence(url,locator,note or 'Bibliographic record checked; full body review remains separate.')
        w=h.base_work(wid,title,author,genre,'twentieth-century' if key.startswith('zwemer') or key=='piper-cross' else 'twenty-first-century',e,['islam']+topics)
        w.update(role=role,collections=['apologetics'],notes=[note] if note else [])
        if date:w['dates']=[dated('delivery' if genre=='debate' else 'original-publication',date,'Source event date' if genre=='debate' else 'Source displayed date; edition history below',e)]
        ed=dict(**common('edition',eid),workId=wid,label=edition_label,languages=['en'],contributors=[],publisher=publisher,dates=[],abridgment='unknown',modernization='unknown',evidence=e)
        asset=h.link_asset(aid,eid,source,url,e)
        root=dict(key=key,workId=wid,editionId=eid,assetId=aid,title=title,genre=genre,role=role,subjects=topics,url=url,evidence=e,reviewScope='Bibliography and selected passages only',completeContentReviewed=False)
        if key in files and key in acq.BOOKS:
            f=files[key]; path=SOURCES/f['relativePath'];assert hashlib.sha256(path.read_bytes()).hexdigest()==f['sha256']
            asset.update(format='pdf',mediaKind='scan',acquisitionStatus='downloaded',storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'),finalUrl=f['finalUrl'])
            asset['rights']['category']='permission-granted' if key=='zwemer-christ' else 'public-domain'
            if key=='zwemer-christ':
                asset['rights']['conditions']=['Host explicitly offers this file for reading and download; permission is scoped to that action, not republication or database reuse.']
                asset['rights']['conditionsMet']=True
            asset['rights']['jurisdiction']=None if key=='zwemer-christ' else 'United States'
            asset['rights']['actions']['download']='allowed'
            asset['rights']['evidence']+=evidence('https://www.zwemercenter.com/items/'+('moslem-doctrine-of-god' if key=='zwemer-god' else 'the-moslem-christ' if key=='zwemer-christ' else 'the-disintegration-of-islam')+'/','Read and download offered by host')
            if key!='zwemer-christ': asset['rights']['evidence']+=evidence('https://www.copyright.gov/circs/circ15a.pdf','Duration of copyright','Identified 1905/1916 historic text; no worldwide or modern-added-material clearance.')
            asset['rights']['unresolved']=['Public hosting, redistribution, OCR quality and any added material require separate review.']
            if key=='zwemer-christ':asset['rights']['unresolved'].append('Undated ATS impression: first-publication lead 1912 is not the date of this scan. Permission required before public reuse unless this manifestation is dated and cleared.')
            asset['processing']['note']='Original offered PDF retained unchanged; no new OCR, public text copy or full-text index.'
            asset['quality']['note']='Title/copyright and contents visually checked; selected prefaces read; full page/quotation collation outstanding.'
            ed.update(modernization='original-language-form')
            if key!='zwemer-christ':ed['dates']=[dated('edition-publication','1905' if key=='zwemer-god' else '1916','Printed copyright; visually verified',e)]
            root['acquired']=True
        else:root['acquired']=False
        for folder,obj in [('works',w),('editions',ed),('assets',asset)]:write(LIB/'catalog'/folder/(obj['id']+'.json'),obj);counts[folder]+=1
        roots.append(root);return w,ed,asset,root
    def save_work(w):write(LIB/'catalog/works'/(w['id']+'.json'),w)
    # Printed source titles retain historic spelling. Historical assertions are not current Muslim self-description.
    bookdata=[
      ('zwemer-god','The Moslem Doctrine of God','treatise','core-teaching',['god','trinity'],'American Tract Society, copyright 1905','1905','PDF pp. 1-6; preface pp. 7-9; contents pp. 11-13','Historical Christian polemic; compare each claim about Islamic belief with Muslim primary sources. Quran quotations use Palmer; tradition quotations need independent collation.'),
      ('zwemer-christ','The Moslem Christ','treatise','core-teaching',['christ','atonement','revelation-prophethood'],'American Tract Society, undated impression',None,'PDF pp. 1-11; introduction pp. 7-15; contents pp. 17-20','Undated scanned impression. Title advertises A Moslem Seeker After God; do not assign the discovery lead 1912 as this edition date. Distinguish Quran, later commentary, and al-Tha‘labi story traditions.'),
      ('zwemer-lectures','The Disintegration of Islam','collected-works','historical-context',['missions','historical-theology'],'Fleming H. Revell, copyright 1916',None,'PDF p. 3 copyright/delivery notice; PDF p. 6 contents','Five missionary lectures delivered at Princeton in October 1915, subsequently New Brunswick and Cairo. Predictions and political descriptions belong to their historical setting, not a current forecast.')]
    chapterdata={
     'zwemer-god':[(15,'There Is No God but Allah'),(23,'Allah, the Divine Essence'),(34,'The Ninety-Nine Beautiful Names of Allah'),(47,'Allah’s Attributes Analyzed and Examined'),(64,'The Relation of Allah to His World'),(77,'Mohammedan Ideas of the Trinity'),(93,'Predestination vs. Fatalism'),(107,'The Completed Idea and Its Insufficiency')],
     'zwemer-christ':[(23,'His Names and Their Significance'),(41,'The Koran Account of His Life, Death, and Translation'),(59,'Jesus Christ According to Tradition, from His Birth to His Public Ministry'),(79,'Jesus Christ According to Tradition, from His Public Ministry to His Second Coming'),(113,'The Person and Character of Jesus Christ'),(135,'His Teaching'),(155,'Jesus Christ Supplanted by Mohammed'),(177,'How to Preach Christ to Moslems Who Know Jesus')],
     'zwemer-lectures':[(17,'The Dead Weight of Tradition'),(63,'The Revolt and Its Failure'),(107,'The Political Collapse'),(141,'The New Islam: Has It a Future?'),(181,'The Present-Day Attitude to Christ and Christianity')]}
    for key,title,genre,role,topics,label,date,loc,note in bookdata:
        w,ed,a,r=add(key,title,ZWEMER,genre,role,'source-zwemer-center',acq.BOOKS[key][2],topics,label,date,loc,note,'Fleming H. Revell' if key.endswith('lectures') else 'American Tract Society')
        if key=='zwemer-lectures':w['dates']=[dated('delivery','1915-10','Princeton delivery; subsequent venues undated',w['evidence'])];save_work(w)
        for i,(page,ctitle) in enumerate(chapterdata[key],1):
            sid=w['id']+f'-s{i:02}'
            locator=f'Chapter/lecture {i}, printed p. {page}; contents in PDF '+('p. 6' if key.endswith('lectures') else 'pp. 5-6' if key=='zwemer-god' else 'pp. 9-11')
            c=h.base_work(sid,ctitle,ZWEMER,'lecture' if key.endswith('lectures') else 'treatise','twentieth-century',evidence(r['url'],locator,'Contents verified; substantial body review not claimed.'),['islam']+topics)
            c.update(role=role,collections=['apologetics'],related=[dict(targetId=w['id'],relation='is-part-of',locator=locator)])
            save_work(c);counts['works']+=1
            sections.append(dict(workId=sid,parentWorkId=w['id'],editionId=ed['id'],assetId=a['id'],position=i,title=ctitle,printedStartPage=page,locator=locator,reviewScope='contents-only',bodyReviewed=False))
    add('white-quran','What Every Christian Needs to Know About the Qur’an',WHITE,'treatise','core-teaching','source-baker-publishing','https://bakerpublishinggroup.com/products/9780764209765_what-every-christian-needs-to-know-about-the-quran',['scripture','revelation-prophethood'],'Bethany House, 2013; ISBN 9780764209765','2013',publisher='Bethany House',note='Publisher source link. Chapter contents and arguments not yet inspected; no full text acquired.')
    debates=[('white-deity','Did Jesus Claim Deity?',ALLY,'2012-03-22',['christ','deity-of-christ'],'Toronto, Canada'),('white-salvation','Sin and Salvation',ALLY,'2013-10-07',['comparative-salvation'],'Abu Bakr Siddique Mosque, Erasmia, South Africa'),('white-trinity','Trinity and Tawhid','author-yusuf-bux','2013-10-04',['god','trinity'],'University of Johannesburg, South Africa'),('white-prophecy','Is Muhammad Prophesied in the Bible?','author-zakir-hussain','2012-09-17',['revelation-prophethood'],'London'),('white-bible-quran','Bible or the Quran?','author-adnan-rashid','2013-02-26',['scripture','revelation-prophethood'],'Dublin; page title names Trinity College, URL slug says University College; unresolved')]
    for key,title,opponent,date,topics,venue in debates:
        w,ed,a,r=add(key,title,WHITE,'debate','historical-context','source-alpha-omega',URL[key],topics,'Official event page; recording manifestation unverified',date,'Official event title and debate index','Mixed-speaker event: Christian and Muslim positions must be attributed separately. Full-event destination preferred; playable completeness, duration and timestamps not verified.')
        w['creators']=[dict(authorId=WHITE,role='speaker'),dict(authorId=opponent,role='speaker')]
        if key=='white-trinity':w['alternateTitles']=['Trinity and Tawid']
        save_work(w)
        r.update(venue=venue,speakers=[WHITE,opponent],deliveryDate=date,availableFormats=['official-event-page'],durationSeconds=None,recordingCompleteness='unverified',timestampedClaims=[],mediaReview='not-viewed')
        if key=='white-deity':r['availableFormats']+=['linked-video','embedded-player'];r['mediaReview']='Official page exposes a named YouTube link and SermonAudio iframe; playback not verified.'
    add('white-sacrifice','Opening and Closing Statements: Shabir Ally Debate',WHITE,'article','core-teaching','source-alpha-omega',URL['white-sacrifice'],['atonement','resurrection-of-christ'],'Author’s printed opening and closing statements','2007-10-25','Opening and closing statements','Author-side statements only, not the complete October 20, 2007 Seattle debate. Historical and theological arguments are distinct; embedded ancient quotations remain secondary until checked against original editions.')
    add('white-canada','A Quick Report from Canada',WHITE,'article','core-teaching','source-alpha-omega',URL['white-canada'],['deity-of-christ','theological-method'],'Author’s retrospective report','2012-03-23','Report on Toronto debate','One participant’s account. Pair with Ally’s response; neither report substitutes for full-event review.')
    add('piper-cross','The Great Offense: Was Jesus Really Crucified?','author-john-piper','article','core-teaching','source-desiring-god',URL['piper-cross'],['atonement','resurrection-of-christ'],'Desiring God displayed article','1994-01-01','Article headings and footnotes','Displayed date is January 1, 1994, but footnote 4 records access on November 26, 2003. Revision history unresolved; displayed date is not proof that the current text existed unchanged in 1994.')
    add('ally-deity','Did Jesus Claim Deity? My Reflections on the Ally-White Debate',ALLY,'article','opposing-position','source-ally-responses',URL['ally-deity'],['deity-of-christ','theological-method'],'Attributed Ally reflection posted by nazam44','2012-03-27','Byline; opening thesis; eight Gospel comparisons; methodological discussion','Contextual Muslim argument. Attributed byline verified; independent authentication of blog control and reported dialogue remains outstanding. Not a recording transcript.')
    write(OUT/'inventory.json',dict(date=DAY,roots=roots,sections=sections,counts=counts,scope='Selected-source batch, not an exhaustive bibliography or a completed debate-content audit.'))
    write(OUT/'checkpoint.json',dict(date=DAY,status='bounded-batch-complete',next=[
      'Review the five official debate destinations manually for playable complete openings, rebuttals, cross-examination, closings and Q&A. Record rendition-specific duration and timestamps only after viewing.',
      'Authenticate Ally article provenance; compare reported dialogue with the Toronto recording. Inspect the linked 2008 consistency article separately.',
      'Date the undated Moslem Christ ATS impression; collate its translations against named Arabic editions. Do not infer all narratives are Quranic.',
      'Acquire or lawfully inspect White’s book and add chapter-level claims with page locators; seek permission before full-text/media indexing.',
      'Expand eligible voices and modern lectures; author concentration is White/Zwemer/Piper. Abdul Saleeb eligibility remains unassessed; Craig app debates remain contextual.',
      'Verify ancient testimonia, Gospel dating and competing exegesis from complete original editions before promoting historical argument maps to reviewed teaching.'
    ],sourceIssues=[dict(sourceId='source-alpha-omega',issue='robots.txt 404; conservative script skipped it. Not a legal prohibition.'),dict(sourceId='source-quran-corpus',issue='robots endpoint returned HTML; three small private research pages retained. Not a valid policy or systematic-retrieval grant.')]))
    run=dict(**{'$schema':'../../schema.json'},schemaVersion=1,kind='run',id='run-l10-islam-studies-2026-10-05',missionId='L10',status='complete',startedOn=DAY,completedOn=DAY,boundary='Selected bibliography, three historic scans, nine sourced question maps; full-debate playback and exhaustive corpus review not completed.',sourceIds=sorted({x['sourceId'] for x in [read(LIB/'catalog/assets'/(r['assetId']+'.json')) for r in roots]}),inventory='content/library/reports/islam-studies/inventory.json',checkpoint='content/library/reports/islam-studies/checkpoint.json',counts=counts,gaps=['Five debate bodies unviewed; duration/completeness unknown.','Modern full texts not acquired; undated scan reuse unresolved.','Historical quotations not all independently collated; no public publication.'],reportPath='content/library/reports/islam-studies/REPORT.md')
    write(LIB/'catalog/runs'/(run['id']+'.json'),run)
    print(counts)

if __name__=='__main__':build()
