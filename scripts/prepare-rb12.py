"""Reviewed historical witnesses, edition-specific rights, global duplicate screen."""
import importlib.util,json,re,sys
from pathlib import Path
from urllib.parse import urljoin
SITE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SITE/'scripts'))
s=importlib.util.spec_from_file_location('rb',SITE/'scripts/rb12-acquire.py')
r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
R=r.base.REPORT

def main():
    prior=[]
    for i in json.loads((R/'input-audit.json').read_text('utf-8')):
        p=SITE/i['path']
        if p.suffix=='.json':
            d=json.loads(p.read_bytes())
            if isinstance(d,dict):prior.extend(a for a in d.get('files',[]) if isinstance(a,dict))
    offers=[]
    def offer(slug,title,author,url,fmt,source,edition,scope,role,rights,discovery,**extra):
        offers.append(dict(workId='work-rb12-'+slug,title=title,author=author,url=url,format=fmt,sourceId=source,edition=edition,
          theologicalScope=scope,admissionRole=role,rightsEvidence=rights,discoveryUrl=discovery,**extra))
    idx='https://www.reformedreader.org/history/ivimey/volume1/contents.htm'
    raw,_=r.base.fetch(idx);doc=r.base.soup(raw)
    for a in doc.select('a[href]'):
        label=a.get_text(' ',strip=True);url=urljoin(idx,a['href']).replace('http://www.reformedreader.org/','https://www.reformedreader.org/')
        if label=='Preface' or re.fullmatch(r'Chapter [IVX]+',label) or label=='Notes':
            offer('ivimey-v1','A History of the English Baptists, Volume I: '+label,'Joseph Ivimey; publisher-added biography attributed to Baptist Encyclopedia (1881)',url,'html','source-reformed-reader',
              '1811 London printed for the author; offered Volume I web transcription, one of four historical volumes. Front matter includes later 1881 biography with conflicting death dates; retain as editorial material.',
              'Historic Calvinistic Baptist historiography, not a manuscript or proof of unbroken ancient Baptist succession. Separate quoted records, author conclusions, polemic, General Baptist subjects and later publisher biography. Early ancestry claims require corroboration.',
              'dated-historical-study-with-embedded-primary-quotations',
              '1811 underlying text is historical public-domain material. Reformed Reader web edition carries Copyright 1999 All Rights Reserved; private personal reading of these explicitly offered pages only, no corpus/republication license inferred.',idx,
              selector='td',selectorIndex=8,logicalWorkKey='ivimey-history-v1',completeness='Complete offered '+label+' of Volume I; other historical volumes not acquired; Gill supplement is a separate authored work',sourceLabel=label)
    gill=next(a for a in doc.select('a[href]') if 'infantbaptism.htm' in a['href'])
    offer('gill-ivimey-prefix','John Gill prefixed extract: antiquity of infant baptism and the Waldenses','John Gill; Joseph Ivimey, 1811 volume compiler',urljoin(idx,gill['href']),'html','source-reformed-reader',
      'Extract from The Divine Right of Infant Baptism Examined and Disproved, explicitly prefixed by Ivimey to his 1811 Volume I; offered transcription. This is not the whole Gill treatise and not an Ivimey-authored chapter.',
      'Historic Particular Baptist doctrinal-historical argument; patristic/Waldensian claims require corroboration. Attribution remains Gill, not Ivimey; an historical argument for believer baptism is not proof of institutional Baptist succession.',
      'separately-authored-prefixed-historical-theological-excerpt',
      'Historical underlying public-domain excerpt; Reformed Reader web edition carries Copyright 1999 All Rights Reserved. Offered private reading only; no corpus/republication license inferred.',idx,
      selector='td',selectorIndex=8,logicalWorkKey='ivimey-history-v1',completeness='Complete offered prefixed Gill excerpt; not whole Gill treatise',sourceLabel='Gill prefixed excerpt')
    pidx='https://baptisthistoryhomepage.com/phila.minutes.a.index.html'
    raw,_=r.base.fetch(pidx);doc=r.base.soup(raw);seen=set();queue=[]
    for a in doc.select('a[href]'):
        url=urljoin(pidx,a['href'])
        if any(x in url for x in ('phila.minutes.a.title','phila.minutes.contents','phila.minutes.preface','phila.early.ch.histories','phila.minutes.1707-1768','philadelphia.minutes.','philadelphia.minuts.','1785.cl.phila','1786.cl.phila','1801.cl.phila')):
            queue.append((url,a.get_text(' ',strip=True)))
    while queue:
        url,label=queue.pop(0)
        if url in seen:continue
        seen.add(url);raw,_=r.base.fetch(url);doc=r.base.soup(raw)
        for a in doc.select('a[href]'):
            link=urljoin(url,a['href'])
            if 'phila.minutes.1707-1768-' in link and link not in seen:queue.append((link,'Early records continuation'))
        offer('philadelphia-minutes','Minutes of the Philadelphia Baptist Association: '+label,'Philadelphia Baptist Association; A. D. Gillette, editor (1851); Jim Duvall, web transcription',url,'html','source-baptist-history-homepage',
          '1851 Gillette edition, Philadelphia American Baptist Publication Society; publisher-offered selected web transcripts. Early records are retrospective summaries and later minutes/circulars are dated documents. Website cites a 2001 reprint where stated.',
          'Regular/Particular Baptist associational historical evidence. Doctrinal circulars and local decisions remain attributed to their year, writer and association; no blanket endorsement of every member, practice or Landmark material elsewhere on the repository.',
          'primary-association-record-through-1851-editor-and-web-transcriber',
          'Underlying 1851 printed records are historical public-domain text, openly offered by the Baptist History Homepage for reading. Modern transcription/reprint rights are distinct; private reading only, no blanket corpus or public-hosting permission.',pidx,
          selector='document',excludeSelectors=['head'],logicalWorkKey='philadelphia-minutes-selected-1851',completeness='Complete offered readable page, not the entire 1707-1807 volume; any image-only statistics are not acquired',sourceLabel=label)
    offer('broadmead-1847','The Records of a Church of Christ, Meeting in Broadmead, Bristol, 1640-1687','Edward Terrill and unidentified continuators; Edward Bean Underhill, editor',
      'https://archive.org/download/cu31924029452277/cu31924029452277_djvu.txt','txt','source-internet-archive',
      '1847 London J. Haddon for Hanserd Knollys Society; Cornell University Library copy; already offered ABBYY OCR TXT. xcvi + 526 printed pages. Underhill modernized, chronologically inserted manuscript notes and correspondence; not a diplomatic transcription.',
      'Primary local-church evidence mediated by a nineteenth-century Baptist editor. The initially mixed/open membership congregation must not be relabeled Particular Baptist for its entire life. Retain narrator, editor and appended correspondence separately; OCR dates/names need corroboration.',
      'primary-church-record-edited-witness',
      '1847 underlying printed text; Cornell copy explicitly states no known US copyright restrictions on the text. Archive exact FULL TEXT download, existing OCR only; no new OCR, image or scan assets.',
      'https://archive.org/metadata/cu31924029452277',logicalWorkKey='broadmead-records',completeness='Full offered existing OCR TXT witness including introduction, records, appendices and index; not independently collated against manuscript',minimumWords=180000)
    offer('broadmead-1974','The Records of a Church of Christ in Bristol, 1640-1687: Hayden edition','Edward Terrill and continuators; Roger Hayden, editor',
      'https://archive.org/download/bristol-record-society-27/bristol-record-society-27_djvu.txt','txt','source-bristol-record-society',
      'Bristol Record Society Volume XXVII, 1974, Roger Hayden; copyright retained. Official society offers older volumes in its Archive collection; existing OCR TXT, original spelling/editorial method and scholarly introduction. A second edition witness of the same records, not a second unique work.',
      'Historical critical/editorial companion only; no global theological approval of Hayden or the society. Introduction distinguishes Underhill insertions, later Haycroft edition and surviving manuscript; use to qualify dates, wording and provenance of the primary records.',
      'historical-editorial-companion-not-default-theological-teaching',
      'Copyright Roger Hayden 1974 retained. Bristol Record Society expressly distributes older volumes free through its official Archive collection. Exact offered TXT acquired for private reading; no systematic retrieval, embedding or public redistribution permission inferred.',
      'https://bristolrecordsociety.org/publications/bristol-record-society-publications/',logicalWorkKey='broadmead-records',completeness='Full offered existing OCR TXT witness; cover/margin garbage remains source text, not a critical collation',minimumWords=120000)
    offer('kiffin-autobiography','Remarkable Passages in the Life of William Kiffin','William Kiffin; William Orme, introduction, notes and additions; William H. Gross, modern editor',
      'https://www.onthewing.org/user/Kiffin%20-%20Remarkable%20Passages.pdf','pdf','source-on-the-wing',
      '1823 London Burton and Smith edition; formatted, lightly modernized and annotated William H. Gross, February 2021; 62 PDF pages. Eight autobiographical chapters plus separate Orme introduction and notes, embedded letters and epitaph.',
      'Particular Baptist autobiographical historical evidence; retain self-report versus Orme 1823 interpretation and Gross 2021 modernization/annotations. Political judgments, providential claims and embedded letters are attributed, not independently confirmed. Reuse held Sober Discourse for communion doctrine.',
      'primary-autobiographical-edited-witness',
      'On the Wing Copyright.html explicitly offers free personal use and no copyright restriction on its modernized public-domain work product, with no sale/modification/fundraising/false attribution. Preserve the edition unmodified; private text extraction only. Clean existing text PDF, no OCR or separate images.',
      'https://www.onthewing.org/Classics.html',logicalWorkKey='kiffin-remarkable-passages',completeness='Complete offered 62-page modernization with editorial additions, not the autograph manuscript',minimumWords=22000)
    for id,slug,title,author,edition in [
      ('A47565','knollys-life','The Life and Death of Mr. Hanserd Knollys; with Last Legacy','Hanserd Knollys; William Kiffin, epistle and continuation','1692 London John Harris, Wing K715 / ESTC R25128; Knollys own account to 1672, Kiffin continuation, last legacy. TCP 2011-04 Phase 2; Huntington Library witness; 18 encoded illegible fragments.'),
      ('A88025','kiffin-lord-mayor','A Letter Sent to the Lord Mayor of London concerning arrests and a forged manifesto','William Kiffin, George Gosfright, Benjamin Hewling and Thomas Lomes','London Henry Hills, printed 1659 [i.e. 1660], Wing L1623 / ESTC R211646; actual letter dateline February 28, 1659, old-style year (1660 with year beginning January). No day/calendar conversion imposed. TCP 2008-09 Phase 1; one encoded illegible fragment.')]:
        api='https://api.github.com/repos/textcreationpartnership/'+id+'/contents';raw,_=r.base.fetch(api);f=next(x for x in json.loads(raw) if x['name']==id+'.xml')
        offer(slug,title,author,f['download_url'],'xml','source-eebo-tcp',edition,
          'Baptist primary historical self-report/letter; preserve edition metadata, multiple hands, dates, marked illegibilities and original long-s. No images downloaded, no new transcription, and no universal approval of reported miraculous or political interpretations.',
          'primary-keyboarded-historical-document',
          ('The actual TCP XML availability statement dedicates the keyboarded encoded edition to CC0 1.0, explicitly excluding associated page images/supplementary files.' if id=='A47565' else 'The actual TCP XML availability statement permits reuse under Creative Commons 0 1.0 Universal, including copying, modification, distribution and performance without permission. This is permission for the keyboarded text, not a separate page-image acquisition.')+' Offered through official Text Creation Partnership repository. Public hosting still not authorized by this mission.',api,
          logicalWorkKey=slug,completeness='Complete offered keyboarded XML text with visible source-gap markers; source transcription has declared lacunae',minimumWords=600)
    offer('belyea-origins','Origins of the Particular Baptists','Gordon L. Belyea',
      'https://www.thegospelcoalition.org/themelios/article/origins-of-the-particular-baptists/','html','source-tgc-themelios',
      'Themelios 32.3, May 2007, pp. 40-67; complete current publisher HTML essay and footnotes. Source-period bio identifies Bowmanville Baptist pastor and Wycliffe doctoral candidate; not a current appointment claim.',
      'Sourced conservative evangelical Baptist historical argument distinguishing General and Particular origins, Puritan roots and disputed Anabaptist influence. Historical study within subject only; its conclusions remain argued positions, not consensus or blanket approval of every cited scholar. Uncertain 1633 rebaptism and Kiffin Manuscript attribution must remain uncertain.',
      'qualified-modern-historical-study-with-citation-boundaries',
      'Official full offered Themelios article, copyright retained by author/journal; private personal reading witness only. No corpus or redistribution license inferred. Unrelated journal articles excluded from the derivative.',
      'https://www.thegospelcoalition.org/themelios/issue/32-3/',selector='.deck-block',logicalWorkKey='belyea-origins',completeness='Complete offered essay, all 75 rendered endnotes and period author biography; not whole journal issue',minimumWords=9000)
    targets=[];reviews=[];dups=[]
    for t in offers:
        if t['url'].endswith('phila.minutes.preface.html'):
            t['author']='H. G. Jones, preface author; A. D. Gillette, edition editor; Jim Duvall, web transcription'
        elif t['logicalWorkKey']=='ivimey-history-v1' and t.get('sourceLabel') not in ['Preface','Gill prefixed excerpt']:
            t['author']='Joseph Ivimey'
        raw,meta=r.base.fetch(t['url']);matches=[dict(assetId=a.get('assetId'),url=a.get('url'),relativePath=a.get('relativePath')) for a in prior if a.get('url')==t['url'] or a.get('sha256')==meta['sha256']]
        dups.append(dict(url=t['url'],sha256=meta['sha256'],matches=matches));assert not matches,(t['title'],matches)
        t.update(evidenceOnly=True,theologicalEligibility='eligible-as-scoped-historical-evidence-not-global-doctrine',eligibilityEvidence='theological-decisions.json',rightsCategory='edition-specific-historical-private-reading')
        if t['logicalWorkKey']=='ivimey-history-v1':
            cells=r.base.soup(raw).select('td')
            t['selectorIndex']=max(range(len(cells)),key=lambda i:len(cells[i].get_text(' ',strip=True)))
            if len(cells[t['selectorIndex']].get_text(' ',strip=True))<3000:
                del t['selectorIndex'];t['selector']='html'
                txt=r.extract(raw,t)
                t['startAtText']=next(x for x in txt.splitlines() if x.startswith('CHAPTER '))
                assert '\nVolume I\n' in txt
                t['trimAtText']='\nVolume I\n'
        if t['sourceId']=='source-baptist-history-homepage':
            txt=r.extract(raw,t)
            if 'Baptist History Homepage\n' in txt:
                t['startAtText']=txt.split('Baptist History Homepage\n',1)[1].splitlines()[0]
            for marker in ['\nContinue to\n','\nMore\nMinutes of Philadelphia Association','\nMinutes of Philadelphia Association\nBaptist History Homepage','\nBaptist History Homepage']:
                if marker in r.extract(raw,t):t['trimAtText']=marker;break
        txt=r.extract(raw,t);words=len(re.findall(r"\b[\w'-]+\b",txt));assert words>=t.get('minimumWords',15),(t['title'],words)
        lines=[x.strip() for x in txt.splitlines() if len(x.strip())>35]
        assert lines,t['title'];t['minimumWords']=max(15,int(words*.98));t['requiredMarkers']=[re.escape(lines[0][:45]),re.escape(lines[-1][-45:])]
        images=[]
        if t['format']=='html':
            doc=r.base.soup(raw);node=doc if t['selector']=='document' else doc.select(t['selector'])[t.get('selectorIndex',0)];assert node is not None
            images=[dict(alt=i.get('alt',''),src=i.get('src','')) for i in node.select('img[src]')]
        reviews.append(dict(workId=t['workId'],source=meta,wordCount=words,replacementCharacters=txt.count('\ufffd'),selector=t.get('selector'),selectorIndex=t.get('selectorIndex'),startAtText=t.get('startAtText'),trimAtText=t.get('trimAtText'),unacquiredImageReferences=images,noNewOCR=True,imageExtraction=False))
        targets.append(t)
    r.base.write(R/'targets.json',targets);r.base.write(R/'selected-text-review.json',reviews)
    r.base.write(R/'candidate-duplicate-audit.json',dict(priorLedgerRecords=len(prior),candidates=dups))
    r.base.write(R/'theological-decisions.json',dict(mission='RB12',globalAuthorApproval=False,corpusAdmission=False,decisions=[dict(workId=t['workId'],url=t['url'],decision=t['theologicalEligibility'],actualWorkReview=t['theologicalScope'],evidence='theological-evidence.json') for t in targets]))
    print('PREPARED',len(targets),'readable historical witnesses;',sum(x['wordCount'] for x in reviews),'words;',len(prior),'prior ledger records screened')
if __name__=='__main__':main()
