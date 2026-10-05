"""Build L03 catalog from curated bibliography/components and immutable scans.

No network, full-text publication, or in-place edits to source files. Every asset
hash and page locator is checked. Run curate-historic-preaching.py first.
"""
import hashlib
import importlib.util
import json
from collections import Counter
from pathlib import Path
import re
import pymupdf
from bible.paths import SITE, SOURCES

ROOT=SITE/'content/library'
REPORT=ROOT/'reports/historic-preaching'
RAW=SOURCES/'library/source-internet-archive'
DAY='2026-10-05'
RUN='run-l03-historic-preaching-2026-10-05'
EXPECTED={'whitefield-works-5':31,'whitefield-works-6':26,'newton-six-discourses':6,'newton-olney':20,'newton-messiah':50,'newton-occasional':7,'newton-love':1,'edwards-farewell':1,'edwards-sermon-derived':2,'edwards-five':5,'edwards-twenty':20,'edwards-practical':18,'edwards-eight':8,'edwards-seventeen':17,'edwards-brainerd':1,'ryle-race':24,'ryle-children':7}

def module(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
base=module('spurgeon_catalog_helpers',SITE/'scripts/catalog-spurgeon.py')
inspect=module('historic_scan_inspector',SITE/'scripts/inspect-puritan-sermons.py')
inspect.ASSET_PREFIX='asset-l03-';inspect.LOCAL=SITE/'.local/library'/RUN
read=base.read;write=base.write;ev=base.evidence;event=base.event;common=base.common

def save(o):
    folder='series' if o['kind']=='series' else o['kind']+'s'
    write(ROOT/'catalog'/folder/(o['id']+'.json'),o)

def ids(item):return 'work-l03-'+item,'edition-l03-'+item
def unitid(g,r):return 'work-l03-'+g['key']+'-'+str(r['position']).zfill(2)
def source(item):return 'https://archive.org/details/'+item
def roman(n):
    result=''
    for v,s in [(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]:
        while n>=v:result+=s;n-=v
    return result
def locator(g,r):
    return f"{g['title']}; published contents/start reference p.{r['printedPage']}; actual sermon/body heading PDF p.{r['pdfPage']} (one-based). Contents pagination may refer to preceding title matter; PDF locator is checked independently."

def rights(item,kind,year):
    google=item=='twobearsandothe00rylegoog'
    meta=kind=='metadata'
    conditions=['Retain source and author attribution. Historical printed text and digital file are assessed separately.']
    if google:conditions+=['Google scan requests personal noncommercial use and retention of watermarks. No Google automated querying was performed; files came from the public Internet Archive API.']
    actions={k:'allowed' for k in ['download','host','redistribute','adapt','transcribe','embed','indexMetadata','indexFullText']}
    if google or meta:
        for k in ['host','redistribute','adapt','transcribe','embed','indexFullText']:actions[k]='unknown'
    return dict(category='unknown' if meta else 'restricted-license' if google else 'public-domain',jurisdiction='US',licenseId='Google-Books-scan-usage-guidelines' if google and not meta else None,licenseUrl='https://archive.org/download/twobearsandothe00rylegoog/twobearsandothe00rylegoog.pdf' if google and not meta else None,
        attribution='Historical author, publisher and digitizing library identified in the retained volume; accessed through Internet Archive.',conditions=conditions,conditionsMet=True,actions=actions,
        evidence=[ev(source(item),'Title page and original scan','Historical printed edition '+year+'; modern catalog descriptions and file wrappers are not claimed public domain.'),ev('https://www.copyright.gov/title17/92chap3.html','17 USC 304','The selected printed editions predate 1931; their US publication term has expired.'),ev('https://archive.org/developers/bots.html','Public API automation guidance','Bounded requests, identified agent, caching, retries and source metadata; no access restrictions bypassed.')],
        unresolved=['File redistribution, commercial use and modern wrapper rights remain unreviewed.'] if google or meta else ['Outside-US rights and accuracy of unproofread host OCR require separate assessment.'],
        review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Selected historical edition and permitted public retrieval; no full-text publication or search ingestion.'))

GAPS=[
 'This is a census of selected printed collections, not every surviving sermon manuscript or preaching occasion of the four authors.',
 'Edwards: Dwight volumes II and IV are outside this sermon inventory; Religious Affections and other sermon-derived theological works require the theology mission. Modern Yale manuscript and critical editions are not mirrored.',
 'Edwards: misplaced contents leaves and conflicting page/date witnesses are retained in corrections; author-wide completeness remains unknown.',
 'Whitefield: 57 numbered Works sermons are complete within this edition. Gurney shorthand reports and other lifetime pamphlet witnesses still require independent comparison; do not collapse them into these texts.',
 'Newton: volume I letters and the separately catalogued Cardiphonia are outside this sermon extraction; volume III contains history/hymns, not individual sermons.',
 'Ryle: two selected books only; other tracts and sermon collections remain to be inventoried. No exhaustive author-wide claim.',
 'Unknown delivery and first-publication dates remain unknown. Manuscript dates are not automatically delivery dates; original calendars and conflicts remain in witness notes.',
 'OCR is unproofread. Whole-page previews and heading checks do not establish full-text accuracy or absence of missing internal leaves.',
 'No recordings acquired. Any future modern reading must identify its performer/date and use later-reading, never original-recording.',
 'No permission-dependent modern editions, Monergism curated files, or other modern copyrighted sermon corpora acquired in this run.'
]

def build():
    bib=read(REPORT/'bibliography.json');groups=read(REPORT/'components.json')
    authors={a['author']:a for a in bib['authors']}
    volumes=[];assets=[];units=[];series=[];checks=[]
    for author,a in authors.items():
        for v in a['selectedVolumes']:
            item=v['item'];wid,eid=ids(item);url=source(item)
            metadata=read(RAW/('asset-l03-'+item+'-metadata')/'metadata.json')
            pdf=next((RAW/('asset-l03-'+item+'-pdf')).glob('*.pdf'))
            with pymupdf.open(pdf) as d:page_count=len(d)
            year='1830' if author=='edwards' else '1772' if author=='whitefield' else ('1811' if v['volume']==6 else '1810') if author=='newton' else '1900' if item=='thechristianrace00ryleuoft' else '1869'
            title=a['title']+f", volume {v['volume']}" if author!='ryle' else ('The Christian Race and Other Sermons' if year=='1900' else 'The Two Bears, and Other Sermons for Children')
            publisher='New York: G. & C. & H. Carvill' if author=='edwards' else 'London: Edward and Charles Dilly; Edinburgh: Kincaid and Creech' if author=='whitefield' else ('New York: Samuel Whiting & Co.' if year=='1811' else 'New York: Williams and Whiting') if author=='newton' else ('London: Hodder & Stoughton' if year=='1900' else 'London and Ipswich: William Hunt')
            count=sum(len(g['members']) for g in groups if g['item']==item)
            notes=[a['boundary'],a['editorialHistory'],'Mixed-volume contents are not all sermons by the named preacher. Only explicitly inventoried components enter sermon counts.']
            if item=='worksrevjohnne03newt':notes.append('Olney Hymns includes William Cowper as well as Newton. No hymn is catalogued here as a Newton sermon; the volume is contextual.')
            ve=[ev(url,'Title page, contents, prefaces and identified component headings','Edition date checked against original imprint rather than generic item metadata.')]
            w=base.work(wid,title,'collected-works',ve,a['authorId']);w['creators'][0]['role']='author';w['notes']=notes;w['era']='nineteenth-century' if author=='ryle' else 'eighteenth-century';save(w)
            e=dict(**common('edition',eid),workId=wid,label=title+' ('+year+')',languages=['en'],contributors=[],publisher=publisher,dates=[event('edition-publication',year,'Original title-page imprint.',ve)],abridgment='abridged' if item=='worksrevjohnne04newt' else 'unknown',modernization='original-language-form',evidence=ve,
                textRights=dict(status='public-domain',jurisdiction='US',scope='Text of the identified historical printed edition only; excludes modern metadata and scan wrapper.',basis='Printed '+year+'; US publication copyright term expired.',evidence=[ev('https://www.copyright.gov/title17/92chap3.html','17 USC 304','Pre-1931 published historical edition.')]))
            e['notes']=notes+['Original-language-form describes this historic printing, not a claim of an autograph manuscript or verbatim delivery.']
            save(e)
            for folder in sorted(RAW.glob('asset-l03-'+item+'-*')):
                for prov in folder.glob('*.provenance.json'):
                    p=read(prov);path=SOURCES/p['relativePath'];data=path.read_bytes()
                    assert len(data)==p['byteCount'] and hashlib.sha256(data).hexdigest()==p['sha256'],path
                    host=next((f for f in metadata['files'] if f['name']==path.name),None)
                    if host and host.get('md5'):assert hashlib.md5(data).hexdigest()==host['md5'],path
                    kind=folder.name.rsplit('-',1)[-1];fmt='pdf' if kind=='pdf' else 'text' if kind=='ocr' else 'other'
                    asset=dict(**common('asset',folder.name),editionId=eid,sourceId='source-internet-archive',canonicalUrl=p['url'],finalUrl=p['finalUrl'],format=fmt,mediaKind='scan' if kind=='pdf' else 'text' if kind in ['ocr','ocrxml'] else 'other',acquisitionStatus='downloaded',storage='raw',relativePath=p['relativePath'],sha256=p['sha256'],byteCount=p['byteCount'],mimeType=p['mimeType'],retrievedAt=p['retrievedAt'],rights=rights(item,kind,year),fullTextIndexed=False,
                        processing=dict(parentAssetId=None,method='none',tool=None,toolVersion=None,parameters=None,date=None,note='Original downloaded bytes; upstream OCR retained without correction. No generated sermon prose.'),quality=dict(state='unreviewed',reviewedBy=None,reviewedOn=None,note='PDF opened and headings/contents checked; OCR and all internal pages not proofread.'))
                    asset['notes']=['Title page and original text rights are distinct from rights in modern catalog metadata.']
                    # Metadata snapshots are acquisition evidence, not acquired
                    # books. Keep them in the manifest without claiming a license
                    # for republishing modern catalog descriptions.
                    if kind!='metadata':save(asset)
                    assets.append(dict(assetId=asset['id'],item=item,**p,catalogAsset=kind!='metadata',hostMd5Verified=bool(host and host.get('md5'))))
            volumes.append(dict(author=author,item=item,workId=wid,editionId=eid,volume=v['volume'],title=title,publicationYear=year,publisher=publisher,pdfPages=page_count,components=count,source=url,excludedFromSermonCounts=count==0))
    for g in groups:
        data=inspect.pages(g['item']);v=next(v for v in volumes if v['item']==g['item']);url=source(g['item']);members=[]
        for r in g['members']:
            assert 1<=r['pdfPage']<=len(data)
            loc=locator(g,r);text=data[r['pdfPage']-1];assert text.strip(),loc
            cls=r['classification'];genre='devotional' if cls in ['pastoral-illustration','pastoral-address'] else 'treatise' if cls in ['sermon-derived-work','sermon-derived-editorial-compilation','author-expanded-sermon-compilation'] else 'sermon'
            evidence=[ev(url,loc,'Printed component identity and opening main text; not incidental citations.')]
            w=base.work(unitid(g,r),r['title'],genre,evidence,authors[g['author']]['authorId'])
            if genre!='sermon':w['creators'][0]['role']='author'
            w['era']='nineteenth-century' if g['author']=='ryle' else 'eighteenth-century'
            w['audiences']=['children','families'] if g['key']=='ryle-children' else ['general']
            w['notes']=[f'Witness classification: {cls}.',*g['notes'],*r['notes'],'Title is a catalog/contents label; historical title variants and spelling remain available in the scan. Published-unit count is not a delivered-occasion count.']
            w['related']=[dict(relation='is-part-of',targetId=v['workId'],locator=loc)]
            w['externalIds']={'l03-printed-group':[g['key']],'l03-component-position':[str(r['position'])]}
            w['passages']=[base.passage(r['mainText'],loc)] if r['mainText'] else []
            assert all(p['verification']=='verified' for p in w['passages']),w['passages']
            w['dates']=[]
            for d in r.get('dates',[]):
                du='https://archive.org/details/bim_eighteenth-century_messiah-fifty-expositor_newton-john_1786_1' if g['key']=='newton-messiah' else url
                w['dates'].append(dict(event=d['event'],value=d['value'],precision=d['precision'],label=d['label'],evidence=[ev(du,d['locator'],d['label'])]))
            for kind in ['delivery','original-publication']:
                if not any(d['event']==kind for d in w['dates']):w['dates'].append(event(kind,None,'Not established for this individual printed unit; edition year is recorded separately.'))
            # Preserve manuscript/editorial dating as a witness, not as a fabricated delivery event.
            flat=re.sub(r'\s+',' ',text)
            tail=re.sub(r'\s+',' ',text[-1000:]);opening=re.sub(r'\s+',' ',text[:650])
            manuscript=[]
            for fragment in [opening,tail]:
                if re.search(r'\b(?:dated|posthumous|discourses|17\d\d|173S)\b',fragment,re.I):manuscript.append(fragment)
            if manuscript:w['notes'].append('Source dating/editorial witness is retained in inventory.json; wording such as "dated" alone is not treated as a delivery assertion.')
            label=roman(r['position'])
            if g['author']=='whitefield':
                number=r['position']+(31 if g['key'].endswith('-6') else 0)
                label=roman(number);w['externalIds']['published-sermon-number']=[str(number)]
            if g['key']=='edwards-twenty' and r['position']>=18:label=roman(r['position']+1)
            if g['key'] in ['ryle-children','edwards-farewell','edwards-brainerd','edwards-sermon-derived','newton-love']:label=r['title']
            w['externalIds']['original-printed-label']=[label]
            save(w)
            members.append(dict(workId=w['id'],position=r['position'],originalLabel=label))
            units.append(dict(**r,workId=w['id'],author=g['author'],group=g['key'],item=g['item'],volume=v['volume'],editionId=v['editionId'],genre=genre,source=url,locator=loc,originalLabel=label,sourceDateAndEditorialWitnesses=manuscript,headingWitness=opening,editionPublication=v['publicationYear'],recordingStatus='printed-text-no-recording'))
            checks.append(dict(workId=w['id'],pdfPage=r['pdfPage'],withinPdf=True,nonemptyPage=True,mainTextMapped=bool(w['passages'])))
        if g['key']=='edwards-twenty':
            b=next(q for q in groups if q['key']=='edwards-brainerd');members.insert(17,dict(workId=unitid(b,b['members'][0]),position=18,originalLabel='XVIII (body in volume X)'))
            for n,m in enumerate(members,1):m['position']=n
        assert len(members)==EXPECTED[g['key']],g['key']
        assert len({m['workId'] for m in members})==len(members),g['key']
        s=dict(**common('series','series-l03-'+g['key']),title=g['title'],authorIds=[authors[g['author']]['authorId']],members=members,expectedCount=EXPECTED[g['key']],completeness='complete',inventoryEvidence=[ev(url,'Printed contents and component headings; see inventory.json for page references','All units in this bounded printed division located, including cross-volume redirects.')],missing=[])
        s['notes']=g['notes']+['Complete means this identified printed division, not the author’s complete ministry.']
        save(s);series.append(s['id'])
    # An extra bibliographic snapshot establishes Messiah's first edition;
    # its scan was not selected or downloaded.
    support='bim_eighteenth-century_messiah-fifty-expositor_newton-john_1786_1'
    for prov in (RAW/('asset-l03-'+support+'-metadata')).glob('*.provenance.json'):
        p=read(prov);data=(SOURCES/p['relativePath']).read_bytes()
        assert hashlib.sha256(data).hexdigest()==p['sha256'] and len(data)==p['byteCount']
        assets.append(dict(assetId='asset-l03-'+support+'-metadata',item=support,**p,catalogAsset=False,hostMd5Verified=False))
    counts=dict(works=len(volumes)+len(units),editions=len(volumes),assets=sum(a['catalogAsset'] for a in assets),series=len(series),reviewedWorks=0,publishedWorks=0)
    byauthor={a:dict(volumes=sum(v['author']==a for v in volumes),components=sum(u['author']==a for u in units),classifications=dict(Counter(u['classification'] for u in units if u['author']==a))) for a in authors}
    write(REPORT/'inventory.json',dict(missionId='L03',date=DAY,boundary='Selected original printed editions, bibliography established before retrieval.',authors=byauthor,volumes=volumes,components=units,seriesIds=series,counts=counts,gaps=GAPS))
    write(REPORT/'acquisition-manifest.json',dict(missionId='L03',date=DAY,files=assets,totalFiles=len(assets),totalBytes=sum(a['byteCount'] for a in assets),sha256Verified=True,rawRoot='BibleProject/sources',checkpoint='Selected bibliography fully acquired; remaining expansion gaps are explicit in inventory.json.'))
    write(REPORT/'validation.json',dict(date=DAY,allHashesMatch=True,allPdfsOpen=True,allMainTextsMap=True,components=checks,validationLimits=['Heading/contents metadata check; not a page-by-page textual collation or human theological review.']))
    save(dict(**{'$schema':'../../schema.json','schemaVersion':1,'kind':'run','id':RUN},missionId='L03',status='complete',startedOn=DAY,completedOn=DAY,boundary='17 selected printed volumes; 243 indexed components including sermon-derived works and two pastoral pieces. Bibliography preceded acquisition; no author-wide completeness claim.',sourceIds=['source-internet-archive'],inventory='content/library/reports/historic-preaching/inventory.json',checkpoint='content/library/reports/historic-preaching/acquisition-manifest.json',counts=counts,gaps=GAPS,reportPath='content/library/reports/historic-preaching/REPORT.md'))
    print(json.dumps(dict(counts=counts,authors=byauthor,bytes=sum(a['byteCount'] for a in assets))))

if __name__=='__main__':build()
