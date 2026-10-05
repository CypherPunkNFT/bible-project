"""L13: reproduce the historical collection from immutable, named source files.

Offline only. Unicode offsets refer to UTF-8-sig decoded bytes, with original
newlines retained. An inventory boundary is not a claim of full body review.
"""
import hashlib
import html
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
LIB = SITE / 'content/library'
OUT = LIB / 'reports/historical-lives'
DAY = '2026-10-05'
spec = importlib.util.spec_from_file_location('catalog_helpers', SITE/'scripts/catalog-scripture-studies.py')
h = importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
read, write, ev, common = h.read, h.write, h.ev, h.common

def clean(text):
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', ' ', text)).split())

def roman(value):
    nums = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    return sum((-nums[c] if i+1<len(value) and nums[c]<nums[value[i+1]] else nums[c]) for i,c in enumerate(value))

def build():
    bib = read(OUT/'bibliography.json')
    files = {f['key']:f for f in read(OUT/'acquisition-manifest.json')['files'] if not f.get('evidenceOnly')}
    texts = {}
    for key,f in files.items():
        raw = (SOURCES/f['relativePath']).read_bytes()
        assert len(raw)==f['byteCount'] and hashlib.sha256(raw).hexdigest()==f['sha256'], key
        if f['format']!='pdf': texts[f['editionKey']]=raw.decode('utf-8-sig')
    assert len(files)==12
    by_key = {b['key']:b for b in bib['editions']}
    def url(key):
        b=by_key[key]
        return 'https://www.gutenberg.org/ebooks/'+b['itemId'][2:] if b.get('mirrorUrl') else 'https://archive.org/details/'+b['itemId']
    def tf(key): return next(f for f in files.values() if f['editionKey']==key and f['format']!='pdf')
    def span(key,start,end):
        t=texts[key]; assert 0<=start<end<=len(t)
        return dict(assetId=tf(key)['assetId'],characterSpan=dict(start=start,end=end),
            payloadSha256=hashlib.sha256(t[start:end].encode()).hexdigest(),
            offsetConvention='Unicode code points after UTF-8-sig decode; original newline characters retained')
    def find_span(key,needle,before=120,after=1200,occurrence=0):
        matches=list(re.finditer(needle,texts[key],re.I|re.S)); assert len(matches)>occurrence,(key,needle)
        m=matches[occurrence]; return span(key,max(0,m.start()-before),min(len(texts[key]),m.end()+after))
    records=[]; counts=Counter()
    def save(record):
        kind=record['kind']; folder='series' if kind=='series' else kind+'s'
        write(LIB/'catalog'/folder/(record['id']+'.json'),record)
        records.append(record['id']); counts[folder]+=1
    author_rows = [
        ('david-brainerd','David Brainerd','brainerd-1822','Title and editor advertisement','Diary and public missionary journal writer; Edwards supplies the biographical framework.',[]),
        ('sereno-edwards-dwight','Sereno Edwards Dwight','brainerd-1822','Title and Advertisement','1822 editor who combines Edwards and Brainerd materials; editorial judgments remain attributed.',[]),
        ('andrew-bonar','Andrew A. Bonar','mcheyne-1844','Title page; Rutherford preface','Free Church of Scotland minister identified on title; biographer and editor of two selected Reformed collections.',['presbyterian','reformed']),
        ('robert-murray-mcheyne',"Robert Murray M’Cheyne",'mcheyne-1844','Title and Introductory Letter','Minister of St. Peter’s, Dundee, in a Presbyterian biographical collection; his letters and journal extracts retain his authorship.',['presbyterian','reformed']),
        ('samuel-rutherford','Samuel Rutherford','rutherford-pg42557','Title; Sketch of Samuel Rutherford','Scottish Presbyterian minister; source letters distinguished from Bonar’s biography and notices.',['presbyterian','reformed']),
        ('cuthbert-lennox','Cuthbert Lennox','knox-pg48250','Signed Introductory Note','Editor responsible for this abridged and modernized Knox witness; personal theological eligibility not assessed.',[]),
        ('john-g-paton','John G. Paton','paton-1889-v1','Chapter IV; title and preface','Reformed Presbyterian missionary autobiographical witness, mediated by his brother’s revision.',['presbyterian','reformed']),
        ('james-paton','James Paton','paton-1889-v1','Signed preface','Brother and editor, who discloses rewriting, pruning and expanding the autobiography.',[]),
        ('mrs-john-g-paton','Mrs. John G. Paton','paton-1889-v2','Chapter IX editorial preface, printed pp. 285–286','Named source identity for the author of the family letters; do not assign these letters to John or James. Full personal-name authority reconciliation remains open.',[]),
        ('samuel-miller','Samuel Miller','mcheyne-1844','Title page; Introductory Letter','Princeton contributor of introductory letter, distinct from Bonar’s memoir.',[]),
        ('arthur-pierson','Arthur T. Pierson','paton-1889-v1','Introductory Note','Contributor of evaluative introduction to the acquired Paton volumes; not author of the autobiography.',[]),
    ]
    authors=[]
    for slug,name,key,loc,note,traditions in author_rows:
        authors.append(dict(id='author-l13-'+slug,entityType='person',name=name,aliases=[],cohort='historical-lives-contributors',
            traditions=traditions,eligibility='context-only',rationale=note,
            receptionBasis='Scoped historical-documentary admission in the Reformed/Calvinist collection; this record does not approve an author’s entire teaching corpus.',
            evidence=[ev(url(key),loc,note)],distinctives=[],unresolved=['Core-teaching eligibility and full biographical authority record are outside this documentary batch.'],
            review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Identity, contribution and historical collection fit.')))
    write(LIB/'registry-extensions/historical-lives-authors.json',{'$schema':'../schema.json','schemaVersion':1,'kind':'author-registry','updated':DAY,'authors':authors})
    primary = {'brainerd-1822':'author-jonathan-edwards','mcheyne-1844':'author-l13-andrew-bonar',
        'rutherford-pg42557':'author-l13-samuel-rutherford','knox-pg48250':'author-john-knox',
        **{k:'author-l13-john-g-paton' for k in by_key if k.startswith('paton')}}
    editors = {'brainerd-1822':'sereno-edwards-dwight','mcheyne-1844':'andrew-bonar',
        'rutherford-pg42557':'andrew-bonar','knox-pg48250':'cuthbert-lennox',
        **{k:'james-paton' for k in by_key if k.startswith('paton')}}
    notes={
        'brainerd-1822':'1822 combination of Edwards’s 1749 Life, Brainerd’s diary and previously published Journal; selected and edited testimony, not an uncut manuscript transcription.',
        'mcheyne-1844':'Publisher explicitly omits sermons and some minor writings. Archive year 1844 is an attributed catalog date; title leaf is undated. Introductory letter cites July 1844 review.',
        'rutherford-pg42557':'Third edition, undated Religious Tract Society imprint. Editor reports condensed notices, relocated notes and additions relative to 1863; 365 numbered letters in this witness.',
        'knox-pg48250':'Lennox’s 1905 abridgment modernizes expression and cuts parenthetical material and parts of documents. Four history books plus documentary appendices.',
        'paton-1889-v1':'New illustrated Revell edition, undated title. Prefaces January/February 1889; archive dates item 1889. James rewrote and expanded portions without John’s final revision.',
        'paton-1889-v2':'Undated Revell illustrated edition; preface October 1889, archive year 1889. Editor cuts two planned chapters and presents Mrs. Paton’s letters in fragments.',
        'paton-v3':'Copyright 1898 and editor’s preface February 1898 establish the continuation’s date; archive metadata 1889 conflicts with the book. Includes retrospective historical and mission essays.'}
    documents=[]
    for b in bib['editions']:
        key=b['key']; wid='work-l13-'+key; eid='edition-l13-'+key
        evidence=[ev(url(key),'Title, preface and contents; see inventory and editorial-issues.json',notes[key])]
        w=h.base_work(wid,b['title'],primary[key],b['genre'],'multiple',evidence)
        w.update(role='historical-context',collections=['history'],notes=[notes[key]])
        if key=='brainerd-1822': w['creators'].append(dict(authorId='author-l13-david-brainerd',role='author'))
        save(w)
        dates=[]
        if key in ['brainerd-1822','knox-pg48250','paton-v3']:
            year={'brainerd-1822':'1822','knox-pg48250':'1905','paton-v3':'1898'}[key]
            dates=[dict(event='edition-publication',value=year,precision='year',label=year+'; source title/copyright or signed editorial evidence',evidence=evidence)]
        contributors=[dict(authorId='author-l13-'+editors[key],role='editor')]
        if key=='mcheyne-1844': contributors.append(dict(authorId='author-l13-samuel-miller',role='author'))
        if key in ['paton-1889-v1','paton-1889-v2']: contributors.append(dict(authorId='author-l13-arthur-pierson',role='author'))
        if key=='paton-1889-v2': contributors.append(dict(authorId='author-l13-mrs-john-g-paton',role='author'))
        save(dict(**common('edition',eid),workId=wid,label=b['title']+' — selected witness',languages=['en'],contributors=contributors,
            publisher={'brainerd-1822':'S. Converse, New Haven','mcheyne-1844':'Presbyterian Board of Publication, Philadelphia','rutherford-pg42557':'Religious Tract Society, London','knox-pg48250':'Andrew Melrose, London'}.get(key,'Fleming H. Revell Company'),
            dates=dates,abridgment='abridged' if key in ['mcheyne-1844','knox-pg48250','paton-1889-v2'] else 'unknown',
            modernization='modernized' if key=='knox-pg48250' else 'unknown',evidence=evidence))
        for f in [f for f in files.values() if f['editionKey']==key]:
            sid='source-gutenberg' if f['format']=='html' else 'source-internet-archive'
            a=h.link_asset(f['assetId'],eid,sid,url(key),evidence)
            a.update(finalUrl=f['finalUrl'],format=f['format'],mediaKind='scan' if f['format']=='pdf' else 'text',acquisitionStatus='downloaded',
                storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
            a['processing']['note']='Unmodified acquired file; supplied OCR is not a proofread transcription. Gutenberg notices retained in full.'
            a['rights'].update(category='public-domain',jurisdiction='United States',attribution='Named historical authors, editors and source institutions; electronic notices preserved.',
                unresolved=['Historical text is public domain in the United States; digital packaging and use outside the United States require separate review.','Public hosting and full-text search are not cleared by this private acquisition record.'])
            a['rights']['actions']['download']='allowed'
            a['rights']['evidence'] += [ev(f['url'],'Named public file; immutable manifest','Bounded download from unrestricted identified historic item or Gutenberg mirror; no systematic website crawl.')]
            if sid=='source-gutenberg':
                a['rights']['evidence'].append(ev('https://www.gutenberg.org/policy/robot_access.html','Mirrors and approved retrieval methods','Named static mirror files selected; ordinary website crawling excluded.'))
                a['rights']['conditions']=['Retain Project Gutenberg license and notices if distributing the Gutenberg electronic edition; verify applicable trademark and jurisdiction requirements.']
            a['quality'].update(state='issues',reviewedBy='Codex',reviewedOn=DAY,note='Front matter, structural inventory and selected passages inspected; editorial changes and OCR defects are documented. Full text not collated.')
            save(a)
        documents.append(dict(key=key,workId=wid,editionId=eid,sourceUrl=url(key),sourceCatalogYear=b.get('sourceMetadataYear',b['year']),editionDateBasis=notes[key],assetIds=[f['assetId'] for f in files.values() if f['editionKey']==key]))
    units=[]
    def unit(key,suffix,title,genre,layer,locator,author=None,**extra):
        uid='unit-l13-'+key+'-'+suffix; wid='work-l13-'+key+'-'+suffix
        author=author or primary[key]
        u=dict(id=uid,workId=wid,parentWorkId='work-l13-'+key,editionId='edition-l13-'+key,documentKey=key,
            title=title,genre=genre,testimonyLayer=layer,authorId=author,locator=locator,reviewLevel='structural-inventory',**extra)
        w=h.base_work(wid,title,author,genre,'multiple',[ev(url(key),locator,'Source boundary indexed; testimony layer applies at component level and does not certify each embedded assertion.')])
        w.update(role='historical-context',collections=['history'],related=[dict(relation='is-part-of',targetId=u['parentWorkId'],locator=locator)],
            externalIds={'l13-unit':[uid],'l13-edition':[u['editionId']]},notes=['Testimony layer: '+layer+'. Full body review remains separate.'])
        save(w); units.append(u); return u
    # Entire numbered Rutherford inventory. Editor headings remain editor headings.
    key='rutherford-pg42557'; t=texts[key]
    headings=list(re.finditer(r'<h2\b[^>]*>(.*?)</h2>',t,re.I|re.S))
    letters=[]
    for i,m in enumerate(headings):
        title=clean(m[1]); rm=re.match(r'^([IVXLCDM]+)\s*\.(?:\s*\[\d+\])?\s*[—-]',title)
        if not rm: continue
        n=roman(rm[1]); end=headings[i+1].start() if i+1<len(headings) else len(t)
        body=t[m.end():end]; anchor=re.search(r'(?:id|name)="([^"]+)"',m[1])
        closes=re.findall(r'<p\s+class="close"[^>]*>(.*?)</p>',body,re.I|re.S)
        pages=list(re.finditer(r'(?:id|name)="Page_(\d+)"',t[:m.start()]))
        summaries=re.findall(r'<h3\b[^>]*>(.*?)</h3>',body,re.I|re.S)
        u=unit(key,f'letter-{n:03}',title,'letter','firsthand-letter-with-editorial-apparatus',f'Letter {rm[1]} ({n}); '+(f'HTML #{anchor[1]}' if anchor else 'no heading anchor in source; exact raw span retained'),
            originalLabel=rm[1],position=n,htmlAnchor=anchor[1] if anchor else None,printedPageAtHeading=int(pages[-1][1]) if pages else None,
            editorialHeading=title,editorialSubjectHeadings=[clean(s) for s in summaries],sourceClosingLabels=[clean(c) for c in closes],
            writtenDateNormalized=None,dateNote='Closing labels retained verbatim. No inferred date or calendar conversion; letter composition is not preaching or publication.',**span(key,m.start(),end))
        letters.append(u)
    assert [u['position'] for u in letters]==list(range(1,366)), len(letters)
    save(dict(**common('series','series-l13-rutherford-letters'),title='Rutherford third-edition numbered letters I–CCCLXV',authorIds=[primary[key]],
        members=[dict(workId=u['workId'],position=u['position'],originalLabel=u['originalLabel']) for u in letters],expectedCount=365,completeness='complete',
        inventoryEvidence=[ev(url(key),'Numbered contents and body headings I–CCCLXV','Complete inventory of this supplied edition; not all surviving correspondence or manuscript collation.')],missing=[]))
    paton_keys=['paton-1889-v1','paton-1889-v2','paton-v3']
    save(dict(**common('series','series-l13-paton-autobiography'),title='Paton autobiography: selected three-part printed sequence',authorIds=['author-l13-john-g-paton'],
        members=[dict(workId='work-l13-'+k,position=n,originalLabel=['First Part','Second Part','Volume III'][n-1]) for n,k in enumerate(paton_keys,1)],
        expectedCount=3,completeness='complete',inventoryEvidence=[ev(url(k),'Title leaf and preface','Three numbered parts are acquired; internal editorial omissions remain explicit.') for k in paton_keys],missing=[]))
    # Knox's four books and the separately preserved documentary appendices.
    key='knox-pg48250'; t=texts[key]; hs=list(re.finditer(r'<h2\b[^>]*>(.*?)</h2>',t,re.I|re.S))
    targets=[('BOOK FIRST.','book-1','history','mixed-participant-and-reported-history'),('BOOK SECOND.','book-2','history','mixed-participant-and-reported-history'),
        ('BOOK THIRD.','book-3','history','mixed-participant-and-reported-history'),('BOOK FOURTH.','book-4','history','mixed-participant-and-reported-history'),
        ("KNOX'S CONFESSION.",'confession','confession','embedded-document-in-later-edition'),('THE BOOK OF DISCIPLINE.','discipline','treatise','embedded-document-in-later-edition')]
    for prefix,suffix,genre,layer in targets:
        i,m=next((i,m) for i,m in enumerate(hs) if clean(m[1]).startswith(prefix))
        end=hs[i+1].start(); a=re.search(r'(?:id|name)="([^"]+)"',m[1])
        unit(key,suffix,prefix.title(),genre,layer,'Body heading '+prefix,htmlAnchor=a[1] if a else None,**span(key,m.start(),end))
    # Print contents supply page starts; OCR ranges are corroborating navigational evidence.
    chapter_sets={
        'mcheyne-1844':[(19,'Youth and preparation for the ministry'),(54,'Labours before ordination'),(80,'First years in Dundee'),(117,'Mission to Palestine and the Jews'),(156,'Days of revival'),(189,'Latter days of ministry')],
        'paton-1889-v1':[(3,'Earlier days'),(31,'At school and college'),(53,'In Glasgow City Mission'),(85,'Foreign mission claims'),(101,'The New Hebrides'),(115,'Our island home'),(141,'Mission leaves from Tanna'),(179,'More mission leaves from Tanna'),(243,'Deepening shadows'),(303,'Farewell scenes')],
        'paton-1889-v2':[(1,'The floating of the Dayspring'),(47,'Among the Aborigines'),(73,'To Scotland and back'),(100,'Concerning friends and foes'),(123,'Settlement on Aniwa'),(149,'Face to face with heathenism'),(198,'The light that shineth more and more'),(241,'Pen portraits of Aniwans'),(285,'Letters from Aniwa'),(342,'Last visit to Britain')],
        'paton-v3':[(23,'Round the world for Jesus'),(63,'The home-lands and the islands')]}
    for key,chapters in chapter_sets.items():
        for n,(page,title) in enumerate(chapters,1):
            genre='biography' if key=='mcheyne-1844' else 'autobiography'
            layer='later-biography-with-embedded-firsthand-material' if key=='mcheyne-1844' else 'edited-retrospective-autobiography'
            author=primary[key]
            if key=='paton-1889-v2' and n==9:
                genre='letter'; layer='abridged-firsthand-letters-with-editorial-preface'; author='author-l13-mrs-john-g-paton'
            unit(key,f'chapter-{n:02}',title,genre,layer,f'Chapter {n}; printed p. {page}; contents inventory',author=author,printedStartPage=page,originalLabel=str(n),
                inventoryEvidence=find_span(key,r'CONTENTS',before=0,after=16500 if key.startswith('paton-1889') else 3300))
    for n,(page,title,genre,layer,author) in enumerate([
        (218,'Concluding memorials','biography','later-biographical-compilation','andrew-bonar'),
        (225,'Private correspondence','letter','selected-firsthand-letters','robert-murray-mcheyne'),
        (316,'Pastoral letters','letter','selected-firsthand-letters','robert-murray-mcheyne'),
        (371,'To members of a prayer meeting','letter','firsthand-letter','robert-murray-mcheyne'),
        (375,'Evidence on revivals','history','firsthand-testimony-in-edited-collection','robert-murray-mcheyne'),
        (386,'Songs of Zion','hymn','literary-work-not-historical-testimony','robert-murray-mcheyne')],1):
        unit('mcheyne-1844',f'remains-{n:02}',title,genre,layer,f'Printed p. {page}; contents inventory',author='author-l13-'+author,printedStartPage=page,
            inventoryEvidence=find_span('mcheyne-1844',r'CONTENTS',after=2500))
    # Brainerd's contents are at the END of the scan. Corrupt OCR page numerals stay unresolved.
    br_titles=['Birth and preparation for ministry','Study of theology to licensure','Licensure to missionary commission','Commission to entering Kaunaumeek',
        'Kaunaumeek to ordination','Ordination to Crossweeksung','Crossweeksung and first Journal part','Second Journal part to June 19, 1746',
        'Remarks on doctrine and the work at Crossweeksung','Language, instruction, difficulties and attestations','Close of Journal to end of missionary labours','Last months and death','Edwards’s reflections on the memoirs']
    br_pages=[35,54,70,None,95,149,203,None,None,335,367,394,432]
    br_contents=re.search(r'CONTENTS\.\s+Page\.\s+Advertisement',texts['brainerd-1822'])
    assert br_contents
    for n,(title,page) in enumerate(zip(br_titles,br_pages),1):
        unit('brainerd-1822',f'chapter-{n:02}',title,'journal' if n in [7,8] else 'biography',
            'edited-diary-and-public-journal-with-narration' if n<9 else 'mixed-testimony-and-editorial-interpretation',
            f'Chapter {n}; '+(f'printed p. {page}' if page else 'printed page numeral unresolved in OCR')+'; terminal contents',
            author='author-l13-david-brainerd' if n in [7,8] else 'author-jonathan-edwards',printedStartPage=page,
            inventoryEvidence=span('brainerd-1822',br_contents.start(),len(texts['brainerd-1822'])))
    for suffix,title,page,genre,layer in [('historical-note','Historical note',9,'history','retrospective-reported-history'),('mission-survey','The Gospel in the New Hebrides',11,'history','mixed-retrospective-witness-and-missionary-interpretation')]:
        unit('paton-v3',suffix,title,genre,layer,f'Printed p. {page}; separate introductory essay',printedStartPage=page,
            inventoryEvidence=find_span('paton-v3',r'Historical\s+Note\.',after=4500))
    journal_locator=find_span('brainerd-1822',r'June\s+19\.\s+"\s*Visited\s+my\s+people',before=0,after=1150)
    unit('brainerd-1822','journal-june-19-1746','Journal: June 19, 1746','journal','firsthand-mission-journal-with-theological-interpretation',
        'Chapter VIII, concluding June 19 entry; year supplied by chapter scope',author='author-l13-david-brainerd',
        sourceDateLabel='June 19.',dateContext='1746 from chapter VIII chronological scope; not a publication date',**journal_locator)
    # Claims are scoped assertions about what this source says, not independent historical certification.
    claims=[]; edges=[]; entities={}
    def entity(ident,label,kind):
        if ident in entities: assert entities[ident]['kind']==kind
        entities[ident]=dict(id=ident,label=label,kind=kind); return ident
    for a in authors: entity(a['id'],a['name'],'person')
    entity('author-jonathan-edwards','Jonathan Edwards','person'); entity('author-john-knox','John Knox','person')
    for b in bib['editions']: entity('work-l13-'+b['key'],b['title'],'work')
    for ident,label,kind in [('church-st-peters-dundee','St. Peter’s Church, Dundee','church'),('church-free-scotland','Free Church of Scotland','church'),
        ('movement-scottish-reformation','Scottish Reformation','movement'),('event-rutherford-letter-1','Rutherford letter I, closing label June 6, 1627','event'),
        ('event-brainerd-kaunaumeek','Brainerd mission at Kaunaumeek','event'),('event-brainerd-death','Brainerd’s death, as reported in the 1749 title','event'),
        ('event-paton-aniwa-1867','Aniwa correspondence, source year 1867','event'),('event-paton-continuation-1898','Paton continuation publication, 1898','event'),
        ('movement-new-hebrides-missions','New Hebrides Protestant missions','movement')]: entity(ident,label,kind)
    def claim(slug,key,needle,assertion,layer,loc,relations=(),before=180,after=1300,occurrence=0):
        cid='claim-l13-'+slug
        c=dict(id=cid,documentKey=key,editionId='edition-l13-'+key,assertion=assertion,testimonyLayer=layer,
            verification='source-passage-checked; independent corroboration not claimed',sourceUrl=url(key),locator=loc,
            evidence=find_span(key,needle,before,after,occurrence))
        claims.append(c)
        for source,relation,target in relations:
            assert source in entities and target in entities,(source,target)
            edges.append(dict(source=source,relation=relation,target=target,claimId=cid))
        return cid
    claim('brainerd-composite','brainerd-1822',r'The\s+Diary\s+begins',
        'Dwight says Edwards omitted Journal passages from the 1749 Life, while supplying diary material absent from that Journal. The 1822 editor brings the two publications together.',
        'later-editorial-account','Advertisement, discussion of the 1749 Life and Journal',
        [('author-l13-sereno-edwards-dwight','edited','work-l13-brainerd-1822'),('author-jonathan-edwards','compiled-biographical-narrative','work-l13-brainerd-1822'),('author-l13-david-brainerd','wrote-embedded-diary-and-journal','work-l13-brainerd-1822')],after=7200)
    claim('brainerd-first-publication','brainerd-1822',r'published\s+at\s+Bos-',
        'Dwight reports that Edwards’s Life appeared at Boston in 1749; he reproduces its title reporting Brainerd’s death at Northampton on October 9, 1747.',
        'later-editor-quoting-earlier-title','Advertisement; quoted 1749 title',
        [('author-l13-david-brainerd','subject-of','event-brainerd-death')])
    claim('brainerd-kaunaumeek','brainerd-1822',r'labours\s+at\s+Kaunaumeek\s+commenced',
        'Dwight dates the start of Brainerd’s Kaunaumeek work to April 1, 1743, and describes a subsequent move of the community to Stockbridge.',
        'later-editorial-biographical-account','Advertisement, account of mission stations',
        [('author-l13-david-brainerd','served-at','event-brainerd-kaunaumeek')])
    claim('brainerd-styles-omissions','brainerd-1822',r'Styles',
        'Dwight discusses a Styles abridgment and lists substantial omissions. This is Dwight’s report; the Styles edition has not been acquired or independently collated.',
        'later-editorial-comparison','Advertisement, abridgment discussion',after=6200)
    claim('brainerd-journal-assessment','brainerd-1822',r'June\s+19\.\s+"\s*Visited\s+my\s+people',
        'In the concluding June 19 journal entry Brainerd reports visiting with two correspondents and interprets the preceding year as a work of divine grace. The visit is his reported action; the assessment of spiritual change remains his theological interpretation.',
        'firsthand-mission-journal-with-theological-interpretation','Chapter VIII, concluding June 19 entry; chapter scope ends in 1746',before=0,after=1150)
    claim('mcheyne-omissions','mcheyne-1844',r'FROM\s+a\s+desire\s+to\s+render',
        'The publisher says sermons and some minor writings were omitted to make this reprint portable; some appeared separately.',
        'publisher-editorial-disclosure','Advertisement, printed p. iii; PDF p. 11 visually checked',after=750)
    claim('mcheyne-attributions','mcheyne-1844',r'MINISTER\s+OF\s+ST\.',
        'The title identifies M’Cheyne as minister of St. Peter’s, Dundee, Bonar as a Free Church of Scotland minister at Collace, and Miller as the introductory letter’s author.',
        'edition-title-attribution','Title leaf, PDF p. 9',
        [('author-l13-robert-murray-mcheyne','minister-of','church-st-peters-dundee'),('author-l13-andrew-bonar','minister-in','church-free-scotland'),
         ('author-l13-andrew-bonar','wrote-biography','work-l13-mcheyne-1844'),('author-l13-samuel-miller','contributed-introduction','work-l13-mcheyne-1844')],after=670)
    claim('rutherford-editor-changes','rutherford-pg42557',r'same\s+as\s+that\s+of\s+1863',
        'Bonar reports relocating most footnotes to the glossary, condensing some notices and making small additions relative to 1863. His judgment that nothing important was omitted is not an independent collation.',
        'editorial-disclosure','Preface, comparison with 1863',
        [('author-l13-andrew-bonar','edited','work-l13-rutherford-pg42557')])
    claim('rutherford-letter-one','rutherford-pg42557',r'June\s*6,\s*1627',
        'Letter I’s closing identifies Anwoth and June 6, 1627; the editor heads it as addressed to Marion M’Naught on her daughter’s return.',
        'firsthand-letter-transmitted-in-later-edition','Letter I, closing; compare editorial heading',
        [('author-l13-samuel-rutherford','wrote','event-rutherford-letter-1')],before=1900,after=100)
    claim('knox-abridgment','knox-pg48250',r'meary\s+tale',
        'Lennox discloses omitted parentheses and anecdotes and the retention of essential clauses from letters/documents. He says the Confession and Book of Discipline are retained in full in the appendix.',
        'later-editorial-disclosure','Introductory Note, February 1905',
        [('author-l13-cuthbert-lennox','abridged-and-edited','work-l13-knox-pg48250'),('work-l13-knox-pg48250','narrates','movement-scottish-reformation')],before=500,after=1250)
    claim('paton-v1-revision','paton-1889-v1',r're-write\s+and\s+revise',
        'James Paton says he rewrote, pruned and expanded the manuscript, recast some sections using his own knowledge, and could not submit the final shape to John before publication.',
        'editorial-firsthand-disclosure','Preface, printed pp. v–vi, January 1889',
        [('author-l13-james-paton','edited-and-recast','work-l13-paton-1889-v1'),('author-l13-john-g-paton','supplied-autobiographical-narrative','work-l13-paton-1889-v1')],after=1400)
    claim('paton-v2-omissions','paton-1889-v2',r'Two\s+whole\s+Chapters',
        'James says space forced the omission of chapters on the South Seas labour traffic and annexation/the future of the New Hebrides. He also describes chapter IX’s letters as fragments.',
        'editorial-firsthand-disclosure','Preface, printed pp. v–vii, October 1889',
        [('author-l13-james-paton','abridged','work-l13-paton-1889-v2')],before=900,after=1250)
    claim('paton-letter-authorship','paton-1889-v2',r'portrayed\s+by\s+the\s+graphic',
        'Chapter IX’s editor attributes the family letters to Mrs. John G. Paton and says he has selected fragments for publication without obtaining her consent to this appearance.',
        'editorial-firsthand-disclosure','Chapter IX editorial preface, printed pp. 285–286',
        [('author-l13-mrs-john-g-paton','wrote-embedded-letters','work-l13-paton-1889-v2')],after=1500)
    claim('paton-aniwa-letter','paton-1889-v2',r'It\s+was\s+a\s+blow\s+which\s+Mr\.',
        'In the letter grouped under 1867, Mrs. Paton reports disappointment over assignment to Aniwa rather than Tanna and hopes for future local evangelists; she explicitly says she does not mean half the people are converted.',
        'firsthand-letter-excerpt','Chapter IX, 1867 letter to Rev. Dr. Macdonald, printed pp. 286–287',
        [('author-l13-mrs-john-g-paton','reported-from','event-paton-aniwa-1867'),('event-paton-aniwa-1867','part-of','movement-new-hebrides-missions')],before=200,after=1800)
    claim('paton-v3-date','paton-v3',r'Copyright,\s+1898',
        'The acquired third volume prints copyright 1898; the signed preface is dated February 1898. The archive’s 1889 date is inconsistent with these pages.',
        'edition-primary-publication-evidence','Copyright leaf, PDF p. 8 visually checked; editor preface PDF p. 9',
        [('work-l13-paton-v3','published-in','event-paton-continuation-1898')],before=40,after=3600)
    claim('paton-historical-note','paton-v3',r'Balboa,\s+governor',
        'Paton’s signed Historical Note recounts early European voyages centuries before his life; it is a later historical account, not eyewitness testimony.',
        'later-reported-history','Historical Note, printed pp. 9–10',after=2850)
    claim('paton-mission-assessment','paton-v3',r'In\s+1858\s+the\s+Revs',
        'Paton’s retrospective mission survey dates his party’s arrival on Tanna to 1858 and describes escape in 1862. Its broader claims about conversions, Indigenous peoples and colonial policy are the author’s perspective and require separate corroboration.',
        'retrospective-participant-testimony-with-interpretation','The Gospel in the New Hebrides, printed pp. 15–16',
        [('author-l13-john-g-paton','participated-in','movement-new-hebrides-missions')],after=2200)
    issues=[
        ('brainerd-1822','composite-and-selected','claim-l13-brainerd-composite','Do not equate this chronological composite with the complete original diary manuscripts.'),
        ('brainerd-1822','unacquired-comparison','claim-l13-brainerd-styles-omissions','Styles/Wesley abridgments are discussed by Dwight; independent comparison remains outstanding.'),
        ('mcheyne-1844','explicit-omissions','claim-l13-mcheyne-omissions','Sermons and minor writings omitted; cannot count as complete collected works or add its missing sermons to sermon coverage.'),
        ('rutherford-pg42557','editorial-condensation','claim-l13-rutherford-editor-changes','Notices shortened, notes relocated; exact impression year unresolved. Complete numbered-letter inventory is a narrower claim.'),
        ('knox-pg48250','abridgment-and-modernization','claim-l13-knox-abridgment','Retain cuts and modernized expression explicitly; acquire identified Laing history volumes for a fuller comparison.'),
        ('paton-1889-v1','substantial-editorial-revision','claim-l13-paton-v1-revision','Editor’s prose and witness knowledge are interwoven with John’s retrospective account.'),
        ('paton-1889-v2','omitted-chapters','claim-l13-paton-v2-omissions','Two planned chapters omitted; letter excerpts are not complete letters.'),
        ('paton-1889-v2','distinct-letter-author','claim-l13-paton-letter-authorship','Mrs. Paton authored chapter IX letters; preserve source attribution and editorial consent disclosure.'),
        ('paton-v3','catalog-date-conflict','claim-l13-paton-v3-date','Archive 1889 retained as source metadata; catalog edition date corrected to 1898 from acquired book.'),
        ('paton-v3','perspective-and-corroboration','claim-l13-paton-mission-assessment','Missionary interpretation, racial classifications and colonial claims are historical testimony, not the catalog’s endorsed descriptions.')]
    write(OUT/'inventory.json',dict(date=DAY,documents=documents,units=units,scope='365 Rutherford letters; four Knox books and two appendices; selected print contents at chapter/section level. Embedded individual diary entries and all subordinate letters are not exhaustively indexed.'))
    write(OUT/'historical-claims.json',dict(date=DAY,claims=claims,policy='Each assertion retains the source voice and exact immutable-file span. Verification means source checked, not independently established historical truth.'))
    write(OUT/'connections.json',dict(entities=list(entities.values()),edges=edges,policy='Every relationship requires a claimId; labels alone are not evidence.'))
    write(OUT/'editorial-issues.json',dict(issues=[dict(id=f'issue-l13-{n:02}',documentKey=k,kind=kind,claimId=cid,detail=detail) for n,(k,kind,cid,detail) in enumerate(issues,1)]))
    write(OUT/'reconciliation.json',dict(
        fileDuplicates=[],method='All 12 content SHA-256 values are distinct; PDF and OCR are manifestations of the same seven editions, not new intellectual works.',
        patonRelationship='Three parts of one autobiographical sequence; separately catalogued volume works joined by series-l13-paton-autobiography.',
        possibleExistingComponents=[dict(existingWorkId='work-l03-edwards-brainerd-01',holding='work-l13-brainerd-1822',locator='Funeral sermon, printed p. 473; terminal contents',
            status='Title/occasion match lead; exact textual identity not collated. No additional sermon unit or coverage count created.')],
        excludedComparisons=[dict(url='https://www.gutenberg.org/ebooks/28025',title='The Story of John G. Paton',status='Later recasting/abridgment; link for comparison only, not counted as an acquired copy or equivalent text.')]))
    summary=dict(date=DAY,counts={k:counts[k] for k in ['works','editions','assets','series']},rootWorks=7,acquiredFiles=len(files),acquiredBytes=sum(f['byteCount'] for f in files.values()),
        indexedComponents=len(units),numberedRutherfordLetters=len(letters),sourceCheckedClaims=len(claims),entities=len(entities),sourcedConnections=len(edges),editorialIssues=len(issues),
        bodyReviewedWholeWorks=0,publishedWorks=0,scope='Seven identified historical volumes/electronic editions; bounded documentary collection, not exhaustive Christian history.')
    write(OUT/'summary.json',summary)
    gaps=['Full manuscript/print collation and exhaustive claim extraction remain outstanding.',
        'Brainerd diary-entry segmentation, OCR page corrections and separate first Journal editions remain outstanding.',
        'McCheyne sermons omitted by this edition; acquire a separately identified fuller witness.',
        'Rutherford exact impression date and manuscript comparison unresolved; closing labels preserved without invented dates.',
        'Knox acquired witness is abridged; fuller Laing history edition not yet acquired.',
        'Paton letters are excerpts; missing two planned chapters and full letter collection remain acquisition leads.',
        'Current batch is concentrated in Scottish and Anglo-American sources; wider Reformed church histories, continental lives, Baptist records and Indigenous Christian testimony remain expansion priorities.']
    write(OUT/'checkpoint.json',dict(status='bounded-batch-complete',jobsRunning=False,next=gaps))
    run={k:v for k,v in common('run','run-l13-historical-lives-2026-10-05').items() if k not in ['editorialState','notes','reviews']}
    run.update(missionId='L13',status='complete',startedOn=DAY,completedOn=DAY,boundary=summary['scope'],sourceIds=['source-internet-archive','source-gutenberg'],
        inventory='content/library/reports/historical-lives/inventory.json',checkpoint='content/library/reports/historical-lives/checkpoint.json',
        counts=dict(summary['counts'],reviewedWorks=0,publishedWorks=0),gaps=gaps,reportPath='content/library/reports/historical-lives/REPORT.md')
    save(run); write(OUT/'record-manifest.json',dict(recordIds=records)); print(json.dumps(summary,indent=2))

if __name__=='__main__': build()
