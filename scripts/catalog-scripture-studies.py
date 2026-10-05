"""Build L06 from the dated bibliography and checked section inventory.

--prepare reads retained TOC evidence and scans; normal build is offline and reads
the checked-in facts. Neither mode fetches or republishes source text.
"""
import argparse
import hashlib
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
LIB = SITE / 'content/library'
OUT = LIB / 'reports/scripture-studies'
CACHE = SITE / '.local/library/run-l06-scripture-studies-2026-10-05'
DAY = '2026-10-05'
CCEL = 'https://ccel.org/ccel/calvin/'
INDEX = CCEL+'commentaries/commentaries.i.html'
POLICY = 'https://www.ccel.org/about/copyright.html'
BAKER = 'https://bakerpublishinggroup.com/products/9780801064777_principles-of-biblical-interpretation'
LOGOS = 'https://www.logos.com/product/6691/principles-of-biblical-interpretation-sacred-hermeneutics'
PREVIEW = 'https://biblia.com/api/plugins/embeddedpreview?historybuttons=false&layout=minimal&navigationbox=false&resourceName=LLS%3APRNCINTBERKHOF&sharebutton=false'
GILL = 'https://www.biblestudytools.com/commentaries/gills-exposition-of-the-bible/'
THEMES = ['covenant','promise-fulfillment','typology','kingdom','temple','sacrifice','exile-restoration','new-creation']


def read(path): return json.loads(path.read_text(encoding='utf-8'))
def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
def ev(url, locator, note): return dict(url=url, locator=locator, note=note, checkedOn=DAY)
def common(kind, ident): return {'$schema':'../../schema.json','schemaVersion':1,'kind':kind,'id':ident,'editorialState':'catalogued','notes':[],'reviews':[]}


class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.href=None; self.label=[]
    def handle_starttag(self, tag, attrs):
        if tag=='a': self.href=dict(attrs).get('href'); self.label=[]
    def handle_data(self, data):
        if self.href: self.label.append(data)
    def handle_endtag(self, tag):
        if tag=='a' and self.href:
            self.links.append((' '.join(''.join(self.label).split()),self.href)); self.href=None


def prepare():
    import pymupdf
    # Titles identify volume holdings, not 45 independent biblical books.
    titles = ['Genesis, volume 1 (chapters 1–23)','Genesis, volume 2 (chapters 24–50)']
    titles += ['Harmony of the Law, volume '+str(n) for n in range(1,5)]
    titles += ['Joshua'] + ['Psalms, volume '+str(n) for n in range(1,6)]
    titles += ['Isaiah, volume '+str(n) for n in range(1,5)]
    titles += ['Jeremiah and Lamentations, volume '+str(n) for n in range(1,6)]
    titles += ['Ezekiel, volume '+str(n) for n in range(1,3)]
    titles += ['Daniel, volume '+str(n) for n in range(1,3)]
    titles += ['Hosea','Joel, Amos and Obadiah','Jonah, Micah and Nahum','Habakkuk, Zephaniah and Haggai','Zechariah and Malachi']
    titles += ['Harmony of the Gospels, volume '+str(n) for n in range(1,4)]
    titles += ['John, volume 1','John, volume 2','Acts, volume 1','Acts, volume 2','Romans','Corinthians, volume 1','Corinthians, volume 2','Galatians and Ephesians','Philippians, Colossians and Thessalonians','Timothy, Titus and Philemon','Hebrews','Catholic Epistles']
    parser=Links(); parser.feed((CACHE/'calvin-index.html').read_text(encoding='utf-8'))
    links=[(t,u) for t,u in parser.links if re.fullmatch(r'/ccel/calvin/calcom\d\d.html',u)]
    assert len(links)==len(titles)==45
    bibliography=[]
    for position, ((label,url),title) in enumerate(zip(links,titles),1):
        key=f'calvin-{position:02}'
        bibliography.append(dict(key=key,workId='work-l06-'+key,authorId='author-john-calvin',title='Commentary on '+title,
            genre='commentary',sourceId='source-ccel',url=urljoin('https://ccel.org',url),sourceLabel=label,position=position,
            editionId='edition-l06-'+key,editionLabel='CCEL electronic presentation of Calvin Translation Society text; individual print impression not established',
            year=None,era='reformation',subjects=[],evidence=[ev(INDEX,'Volume link '+str(position)+'; '+label,'Bibliographic holding; not a complete Bible commentary or a fully collated text.')]))
    sections=[]
    for filename, number, prefix, book in [('calvin-genesis1',1,'Genesis','Genesis'),('calvin-isaiah4',16,'Isaiah','Isaiah'),('calvin-hebrews',44,'Heb','Hebrews')]:
        parser=Links(); parser.feed((CACHE/(filename+'.html')).read_text(encoding='utf-8'))
        toc=CCEL+f'calcom{number:02}/calcom{number:02}.toc.html'
        found=[]
        for title,url in parser.links:
            match=re.fullmatch(re.escape(prefix)+r' (\d+):(\d+)(?:-(\d+))?',title)
            if not match: continue
            ch,first,last=map(int,[match[1],match[2],match[3] or match[2]])
            key=f'calvin-{number:02}-{ch:02}-{first:02}'
            record=dict(key=key,workId='work-l06-'+key,parentWorkId=f'work-l06-calvin-{number:02}',
                editionId=f'edition-l06-calvin-{number:02}',authorId='author-john-calvin',title=title.replace('Heb ','Hebrews '),
                kind='commentary-section',genre='commentary',url=urljoin(toc,url),locator='Source commentary heading '+title,
                bookNames=[book],reference=f'{book} {ch}:{first}'+(f'-{last}' if first!=last else ''),
                range=[book,ch,first,ch,last],subjects=[],evidenceLevel='source-heading',
                evidence=[ev(toc,title,'Commentary passage boundary from contents, not a body-review claim. Editorial appendices and Scripture-reference indexes excluded.')])
            if key == 'calvin-01-13-01':
                record['sourceHeading'] = title
                record['title'] = record['reference'] = 'Genesis 13:1-18'
                record['range'] = ['Genesis',13,1,13,18]
                record['evidenceLevel'] = 'source-heading-corrected-against-body'
                record['evidence'].append(ev(record['url'],'Scripture table, verses 1 through 18',
                    'Source heading incorrectly says Genesis 13:1-20. The displayed Scripture ends at verse 18; normalized range retains the source-heading discrepancy explicitly.'))
            if key in {s['key'] for s in found}: raise ValueError('Duplicate section '+key)
            found.append(record)
        sections += found
    vos_titles=['Introductory','The Kingdom and the Old Testament','Kingdom and Kingship; the Kingdom of God and the Kingdom of Heaven',
        'The Present and the Future Kingdom','Current Misconceptions regarding the Present and Future Kingdoms',
        'The Kingdom as the Supremacy of God in the Sphere of Saving Power','The Kingdom in the Sphere of Righteousness',
        'The Kingdom as a State of Blessedness','The Kingdom and the Church','Entrance into the Kingdom: Repentance and Faith','Recapitulation']
    starts=[1,11,25,38,66,80,103,125,140,169,191]
    vos=pymupdf.open(SOURCES/'library/source-internet-archive/asset-l06-vos-pdf/theteachingofjes00vosuoft.pdf')
    for pos,(start,title) in enumerate(zip(starts,vos_titles),1):
        assert 'CHAPTER' in vos[start+9].get_text()
        end=(starts+[195])[pos]-1
        key=f'vos-kingdom-{pos:02}'
        sections.append(dict(key=key,workId='work-l06-'+key,parentWorkId='work-vos-kingdom',editionId='edition-vos-kingdom',
            authorId='author-geerhardus-vos',title=title,kind='biblical-theological-section',genre='treatise',
            url='https://archive.org/details/theteachingofjes00vosuoft/page/n'+str(start+9)+'/mode/2up',
            locator=f'Chapter {pos}; printed pp. {start}–{end}; PDF pp. {start+10}–{end+10} (one-based)',
            printedPages=[start,end],pdfPages=[start+10,end+10],bookNames=[],range=None,subjects=['kingdom','biblical-theology'],
            evidenceLevel='contents-and-heading',evidence=[ev('https://archive.org/details/theteachingofjes00vosuoft','Contents PDF pp. 9–10; chapter opening','All eleven chapter starts checked against the scan; full body and every cited passage not reviewed.')]))
    book_starts=[('Matthew',61,74),('Mark',75,88),('Luke',89,101),('John',102,116),('Acts',117,128),('Romans',144,155),
        ('1 Corinthians',156,166),('2 Corinthians',167,175),('Galatians',176,187),('Ephesians',188,198),('Philippians',199,208),
        ('Colossians',209,217),('1 Thessalonians',218,226),('2 Thessalonians',227,234),('1 Timothy',245,251),('2 Timothy',252,255),
        ('Titus',256,260),('Philemon',261,264),('Hebrews',265,278),('James',279,291),('1 Peter',292,305),('2 Peter',306,315),
        ('1 John',316,324),('2 John and 3 John',325,331),('Jude',332,338),('Revelation',339,352)]
    berk=pymupdf.open(SOURCES/'library/source-internet-archive/asset-l06-berkhof-pdf/newtestamentintr00berk.pdf')
    for pos,(book,start,end) in enumerate(book_starts,1):
        assert book.split()[-1].lower() in berk[start+3].get_text()[:250].lower(), book
        key=f'berkhof-introduction-{pos:02}'
        sections.append(dict(key=key,workId='work-l06-'+key,parentWorkId='work-berkhof-introduction',editionId='edition-berkhof-introduction',
            authorId='author-louis-berkhof',title='Introduction to '+book,kind='book-introduction',genre='treatise',
            url='https://archive.org/details/newtestamentintr00berk/page/n'+str(start+3)+'/mode/2up',
            locator=f'Printed pp. {start}–{end}; PDF pp. {start+4}–{end+4} (one-based)',
            printedPages=[start,end],pdfPages=[start+4,end+4],bookNames=['2 John','3 John'] if book=='2 John and 3 John' else [book],
            range=None,subjects=[],evidenceLevel='contents-and-heading',
            evidence=[ev('https://archive.org/details/newtestamentintr00berk','Contents PDF pp. 10–11; opening of named section','Book-level introduction. No verse-by-verse exposition coverage inferred from its scope.')]))
    sections.append(dict(key='berkhof-prolegomena',workId='work-l06-berkhof-prolegomena',parentWorkId='work-berkhof-introduction',
        editionId='edition-berkhof-introduction',authorId='author-louis-berkhof',title='Prolegomena to New Testament Introduction',
        kind='hermeneutical-section',genre='treatise',url='https://archive.org/details/newtestamentintr00berk/page/n12/mode/2up',
        locator='Printed pp. 9–25; PDF pp. 13–29; especially Leading Principles, pp. 12–13',printedPages=[9,25],pdfPages=[13,29],
        bookNames=[],range=None,subjects=['hermeneutics','canon'],evidenceLevel='selected-body-reviewed',
        evidence=[ev('https://ccel.org/ccel/berkhof/newtestament.iii.html','Prolegomena, Leading Principles','Methods and assumptions read; introductory discipline, not a complete hermeneutics textbook.')]))
    bibliography += [dict(key='gill-exposition',workId='work-l06-gill-exposition',authorId='author-john-gill',title='Exposition of the Old and New Testaments',
        genre='commentary',sourceId='source-bible-study-tools',url=GILL,editionId='edition-l06-gill-exposition',
        editionLabel='Bible Study Tools electronic presentation; underlying print impression not established',year=None,era='eighteenth-century',subjects=[],
        evidence=[ev(GILL,'Author and commentary index','Whole work linked; only two selected verse entries indexed in this mission.')]),
        dict(key='berkhof-hermeneutics',workId='work-l06-berkhof-hermeneutics',authorId='author-louis-berkhof',title='Principles of Biblical Interpretation: Sacred Hermeneutics',
        genre='treatise',sourceId='source-baker-publishing',url=BAKER,editionId='edition-l06-berkhof-hermeneutics',
        editionLabel='Baker text; 1950 copyright, twenty-fourth printing April 1994 as displayed in authorized preview',year='1994',era='twentieth-century',subjects=['hermeneutics'],
        evidence=[ev(PREVIEW,'Copyright leaf and contents','The displayed printing is 1994; 1950 is its copyright date, not a verified first-edition date.'),
                  ev(BAKER,'Publisher title destination','Authorized publisher link, not free full-text access.')])]
    for key,book,ch,verse in [('gill-genesis-17-7','Genesis',17,7),('gill-isaiah-65-17','Isaiah',65,17)]:
        url=GILL+key.removeprefix('gill-')+'.html'
        sections.append(dict(key=key,workId='work-l06-'+key,parentWorkId='work-l06-gill-exposition',editionId='edition-l06-gill-exposition',
            authorId='author-john-gill',title=f'{book} {ch}:{verse}',kind='commentary-section',genre='commentary',url=url,
            locator='Verse entry, all author commentary paragraphs',bookNames=[book],reference=f'{book} {ch}:{verse}',
            range=[book,ch,verse,ch,verse],subjects=[],evidenceLevel='selected-body-reviewed',evidence=[ev(url,'Verse commentary','Selected author text read; website furniture not treated as Gill.')]))
    # Paraphrased navigation labels; exact Roman chapter locators retained.
    for pos,title in enumerate(['Introduction','Jewish interpretation','Christian interpretation history','Nature of Scripture',
                               'Grammatical interpretation','Historical interpretation','Theological interpretation'],1):
        key=f'berkhof-hermeneutics-{pos:02}'
        sections.append(dict(key=key,workId='work-l06-'+key,parentWorkId='work-l06-berkhof-hermeneutics',editionId='edition-l06-berkhof-hermeneutics',
            authorId='author-louis-berkhof',title=title,kind='hermeneutical-section',genre='treatise',url=PREVIEW,
            locator='Contents, chapter '+['I','II','III','IV','V','VI','VII'][pos-1],bookNames=[],range=None,subjects=['hermeneutics'],
            evidenceLevel='contents-only',evidence=[ev(PREVIEW,'Contents, chapter '+str(pos),'Paraphrased navigation label; chapter body is not included in the limited preview or acquired here.')]))
    write(OUT/'bibliography.json',{'checkedOn':DAY,'newHoldings':bibliography,
        'reusedWorks':['work-vos-kingdom','work-berkhof-introduction'],
        'relatedExistingWorks':['work-ryle-matthew','work-l03-edwards-sermon-derived-01'],
        'deduplication':'Existing Vos and Berkhof work/edition records and published reading links are unchanged; new downloaded assets attach to those edition IDs. Ryle and Edwards are pointers, not new acquisitions.'})
    write(OUT/'inventory.json',{'checkedOn':DAY,'sections':sections})
    print('Prepared',len(bibliography),'new holdings;',len(sections),'section records')


def base_work(ident,title,author,genre,era,evidence,subjects=None):
    return dict(**common('work',ident),title=title,alternateTitles=[],creators=[dict(authorId=author,role='author')],
        genre=genre,role='core-teaching',collections=['scripture'],subjects=subjects or [],occasions=[],audiences=['students','pastors','general'],
        depth='unknown',era=era,dates=[],passages=[],related=[],externalIds={},evidence=evidence)


def link_asset(ident,eid,source,url,evidence):
    actions={k:'unknown' for k in ['download','host','redistribute','adapt','transcribe','embed','indexMetadata','indexFullText']}
    actions['indexMetadata']='allowed'
    return dict(**common('asset',ident),editionId=eid,sourceId=source,canonicalUrl=url,finalUrl=None,format='html',mediaKind='text',
        acquisitionStatus='link-only',storage='none',relativePath=None,sha256=None,byteCount=None,mimeType=None,retrievedAt=None,
        rights=dict(category='link-only',jurisdiction=None,licenseId=None,licenseUrl=None,attribution='Author and source credited in the catalog.',
            conditions=[],conditionsMet=False,actions=actions,evidence=evidence,
            unresolved=['No source-file republication, bulk retrieval or full-text indexing grant established.'],
            review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Bibliographic links and source boundaries; not a whole-text clearance.')),
        fullTextIndexed=False,processing=dict(parentAssetId=None,method='none',tool=None,toolVersion=None,parameters=None,date=None,
            note='Source link only; no content copied.'),
        quality=dict(state='unreviewed',reviewedBy=None,reviewedOn=None,note='Bibliographic inventory and selected passages checked; full text not collated.'))


def passage(r, role, locator):
    book,ch,first,endch,last=r
    b=next(b for b in read(SITE/'content/apologetics/scripture-index.json')['books'] if b['name']==book)
    assert 1<=first<=b['chapters'][ch-1] and 1<=last<=b['chapters'][endch-1] and (ch,first)<=(endch,last)
    return dict(reference=f'{book} {ch}:{first}'+(f'-{endch}:{last}' if ch!=endch else f'-{last}' if first!=last else ''),
        numberingSystem='english',role=role,start=b['num']*1000000+ch*1000+first,end=b['num']*1000000+endch*1000+last,
        verification='verified',locator=locator)


def build():
    bibliography=read(OUT/'bibliography.json'); sections=read(OUT/'inventory.json')['sections']
    decisions=read(OUT/'interpretations.json')
    by_key={s['key']:s for s in sections}
    assert all(r['sectionKey'] in by_key and r['authorId']==by_key[r['sectionKey']]['authorId'] for r in decisions['treatments'])
    counts=Counter(); created=[]
    def save(record):
        kind=record['kind']; folder={'work':'works','edition':'editions','asset':'assets','series':'series','run':'runs'}[kind]
        path=LIB/'catalog'/folder/(record['id']+'.json')
        if path.exists() and not ('-l06-' in record['id']): raise ValueError('Refusing to overwrite prior record')
        write(path,record); counts[folder]+=1; created.append(record['id'])
    for b in bibliography['newHoldings']:
        w=base_work(b['workId'],b['title'],b['authorId'],b['genre'],b['era'],b['evidence'],b['subjects'])
        w['notes']=['Holding-level source link; component coverage is separately inventoried. No first-publication date inferred from this electronic manifestation.']
        if b['key']=='berkhof-hermeneutics': w['notes'].append('Publisher link and limited preview only; full book not acquired or offered as free-to-read.')
        save(w)
        e=dict(**common('edition',b['editionId']),workId=b['workId'],label=b['editionLabel'],languages=['en'],contributors=[],
            publisher='CCEL' if b['sourceId']=='source-ccel' else 'Baker' if b['sourceId']=='source-baker-publishing' else 'Bible Study Tools',
            dates=[],abridgment='unknown',modernization='unknown',evidence=b['evidence'])
        if b['year']:
            e['dates']=[dict(event='edition-publication',value=b['year'],precision='year',label='Printing stated by the inspected preview',evidence=b['evidence'][:1])]
        if b['key']=='calvin-44':
            e['notes']=['The source credits translator Rev. John Owen. This contributor is not linked to the seventeenth-century Puritan author-john-owen; authority identification remains separate. Translator/editor footnotes and digital corrections are not attributed to Calvin.']
            e['evidence'].append(ev('https://ccel.org/c/calvin/comment3/comm_vol44/htm/About.htm','Dublin Core translator field','Translator name as supplied by the electronic edition.'))
        save(e)
        evidence=b['evidence']+[ev(POLICY,'Use and republication policy','Nonprofit reading use does not grant republication of CCEL editions.')] if b['sourceId']=='source-ccel' else b['evidence']
        save(link_asset('asset-l06-'+b['key'],b['editionId'],b['sourceId'],b['url'],evidence))
    for s in sections:
        relevant=[r for r in decisions['treatments'] if r['sectionKey']==s['key']]
        tags=list(dict.fromkeys(s['subjects']+[t for r in relevant for t in r['subjects']]))
        w=base_work(s['workId'],s['title'],s['authorId'],s['genre'],
            'reformation' if 'calvin' in s['key'] else 'eighteenth-century' if 'gill' in s['key'] else 'twentieth-century',s['evidence'],tags)
        w['related']=[dict(relation='is-part-of',targetId=s['parentWorkId'],locator=s['locator'])]
        w['externalIds']={'source-section':[s['url']]}
        w['notes']=[f"Section classification: {s['kind']}; evidence level: {s['evidenceLevel']}.",
            'A section is not an additional complete book. Book introduction scope does not imply verse-level exposition.',
            'Theme assessments and comparison claims are AI-assisted metadata; preserve author wording at the source.']
        if s['range']: w['passages'].append(passage(s['range'],'main-text',s['locator']))
        for r in relevant:
            for p in r.get('ranges',[]): w['passages'].append(passage(p,'substantial-exposition',r['locator']))
            w['evidence'].append(ev(r['url'],r['locator'],r['summary']))
        save(w)
    manifest=read(OUT/'acquisition-manifest.json')
    for f in manifest['files']:
        if f['evidenceOnly']: continue
        raw=SOURCES/f['relativePath']
        assert hashlib.sha256(raw.read_bytes()).hexdigest()==f['sha256']
        a=link_asset(f['assetId'],f['editionId'],'source-internet-archive',f['url'],[
            ev('https://archive.org/details/'+f['itemId'],'Retained scan and host file inventory','Identified historic edition, unaltered bytes; host size and MD5 checked.'),
            ev('https://www.copyright.gov/title17/92chap3.html','Copyright duration for historic published works','1903 and 1915 printed editions; scoped United States assessment, modern added material excluded.')])
        a.update(finalUrl=f['finalUrl'],format=f['format'],mediaKind='scan' if f['format']=='pdf' else 'text',acquisitionStatus='downloaded',
            storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
        a['rights'].update(category='public-domain',jurisdiction='United States',attribution='Geerhardus Vos / Louis Berkhof; identified historic edition digitized by the contributing library via Internet Archive.',
            unresolved=['No worldwide copyright conclusion. Host OCR is unproofread; historical text and modern additions must stay distinguished.'])
        a['rights']['actions'].update(download='allowed',host='unknown',redistribute='unknown',adapt='unknown',indexFullText='unknown')
        a['rights']['review']['scope']='Historic edition identity and private acquisition checked. Public packaging and text-quality review remain separate.'
        a['processing']['note']='Original host PDF or OCR retained; no new OCR, full-text index or public copy generated.'
        a['quality']['note']='Title/contents and section starts checked against PDF; complete OCR proofreading not performed.'
        save(a)
    groups=[('calvin-volumes',[b['workId'] for b in bibliography['newHoldings'] if b['key'].startswith('calvin-')],45,'CCEL Calvin volume link inventory',INDEX)]
    for prefix,expected,title,url in [('calvin-01-',23,'Calvin Genesis volume 1 commentary sections',CCEL+'calcom01/calcom01.toc.html'),
        ('calvin-16-',18,'Calvin Isaiah volume 4 commentary sections',CCEL+'calcom16/calcom16.toc.html'),
        ('calvin-44-',67,'Calvin Hebrews commentary sections',CCEL+'calcom44/calcom44.toc.html'),
        ('vos-kingdom-',11,'Vos Kingdom and Church chapters','https://archive.org/details/theteachingofjes00vosuoft'),
        ('berkhof-introduction-',26,'Berkhof New Testament book introductions','https://archive.org/details/newtestamentintr00berk'),
        ('berkhof-hermeneutics-',7,'Berkhof hermeneutics chapter inventory',PREVIEW)]:
        groups.append((prefix.rstrip('-'),[s['workId'] for s in sections if s['key'].startswith(prefix)],expected,title,url))
    for key,ids,expected,title,url in groups:
        assert len(ids)==expected,(key,len(ids),expected)
        s=dict(**common('series','series-l06-'+key),title=title,authorIds=list(dict.fromkeys(
            read(LIB/'catalog/works'/(wid+'.json'))['creators'][0]['authorId'] for wid in ids)),
            members=[dict(workId=wid,position=i,originalLabel='Catalog order '+str(i)) for i,wid in enumerate(ids,1)],expectedCount=expected,
            completeness='complete',inventoryEvidence=[ev(url,'Contents/index boundaries','Complete metadata inventory in this boundary; not full-body review or author-wide completeness.')],missing=[])
        s['notes']=['Appendices, translator notes and bibliographies are excluded from commentary/author-chapter counts.']
        save(s)
    passage_index=[]
    for s in sections:
        w=read(LIB/'catalog/works'/(s['workId']+'.json'))
        passage_index.append(dict(workId=w['id'],parentWorkId=s['parentWorkId'],editionId=s['editionId'],authorId=s['authorId'],
            kind=s['kind'],bookNames=s['bookNames'],passages=w['passages'],locator=s['locator'],url=s['url'],subjects=w['subjects'],evidenceLevel=s['evidenceLevel']))
    write(OUT/'passage-index.json',{'checkedOn':DAY,'rule':'Book-level introductions have bookNames but no inferred exposition ranges. Source headings and body-reviewed ranges are distinct.','sections':passage_index})
    write(OUT/'theme-index.json',{'checkedOn':DAY,'themes':{tag:[r['id'] for r in decisions['treatments'] if tag in r['subjects']] for tag in THEMES}})
    write(OUT/'record-manifest.json',{'recordIds':created})
    summary=dict(checkedOn=DAY,counts={k:counts[k] for k in ['works','editions','assets','series']},newHoldingRecords=len(bibliography['newHoldings']),
        indexedSections=len(sections),sectionKinds=dict(Counter(s['kind'] for s in sections)),reusedWorkAndEditionIdentities=2,
        downloadedContentAssets=4,downloadedContentBytes=sum(f['byteCount'] for f in manifest['files'] if not f['evidenceOnly']),
        linkedHoldings=len(bibliography['newHoldings']),biblicalBooksWithIntroductions=27,bodyTreatmentAssessments=len(decisions['treatments']),
        comparisonQuestions=len(decisions['comparisons']),reviewedWorks=0,publishedWorks=0)
    write(OUT/'summary.json',summary)
    run={'$schema':'../../schema.json','schemaVersion':1,'kind':'run','id':'run-l06-scripture-studies-2026-10-05','missionId':'L06','status':'complete',
        'startedOn':DAY,'completedOn':DAY,'boundary':'45 Calvin volume links, three complete volume section inventories, 26 NT introductions, 11 Vos chapters, two Gill entries, and a bounded hermeneutics inventory; selected body treatments and explicit comparisons.',
        'sourceIds':['source-ccel','source-internet-archive','source-bible-study-tools','source-baker-publishing'],
        'inventory':'content/library/reports/scripture-studies/inventory.json','checkpoint':'content/library/reports/scripture-studies/checkpoint.json',
        'counts':dict(summary['counts'],reviewedWorks=0,publishedWorks=0),
        'gaps':['42 Calvin volumes await component indexing; the edition index is not a 66-book coverage claim.',
                'Berkhof hermeneutics is a publisher link/limited-preview inventory, not acquired full text.',
                'Only selected body passages are classified; complete text quality and theological review remain undone.',
                'Gill underlying print edition and wider passage inventory remain unresolved. No app or search publication.'],
        'reportPath':'content/library/reports/scripture-studies/REPORT.md'}
    save(run)
    write(OUT/'checkpoint.json',dict(status='bounded-batch-complete',lastCompleted='Catalog, passage index and author-specific treatment records',
        next=['Validate exact print witnesses/translators for other Calvin volumes before full-text acquisition.',
              'Index the remaining 42 Calvin volumes from permitted contents sources.',
              'Acquire a cleared full-text hermeneutics edition and add Old Testament book introductions.',
              'Expand commentary authors and specific disagreements; review body evidence before adding exposition tags.'],jobsRunning=False))
    print(json.dumps(summary,indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--prepare',action='store_true'); args=parser.parse_args()
    prepare() if args.prepare else build()
