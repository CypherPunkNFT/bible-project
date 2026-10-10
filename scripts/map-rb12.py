"""Offline historical document tables. Exact derivative locators; no inferred graph."""
import hashlib,importlib.util,json,re
from pathlib import Path
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];R=SITE/'content/library/reports/reformed-baptist-overnight/RB12'
CACHE=SITE/'.local/library/run-rb12-2026-10-07'
def read(n):return json.loads((R/n).read_text('utf-8'))
def write(n,d):(R/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def sha(b):return hashlib.sha256(b).hexdigest()

def main():
    acq=read('acquisition-manifest.json')['files'];held=read('holdings-audit.json')['files']
    works=[];documents=[];components=[];by={}
    def addwork(a,status):
        d=a.get('auditDerivative') or a.get('derivedText') or a.get('derivative')
        assert d and sha((SITE/d['path']).read_bytes())==d['sha256'],a['assetId']
        w={k:a.get(k) for k in ['assetId','workId','title','author','edition','url','relativePath','completeness','logicalWorkKey']}
        w.update(originalSha256=a.get('actualSha256',a.get('sha256',a.get('originalSha256'))),derivative=d,status=status,locations=[],parentIntakeHeld=True)
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256']
        works.append(w);by[w['assetId']]=w;return w
    def unit(w,lo,hi,title,role,date=None,author=None,note=None,prepare=False,sourcePage=None):
        ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();assert 1<=lo<=hi<=len(ls)
        txt='\n'.join(ls[lo-1:hi])+'\n';uid='unit-rb12-'+sha((w['assetId']+':'+str(lo)+':'+str(hi)+':'+title).encode())[:20]
        u=dict(unitId=uid,title=title,role=role,sourceLabel=ls[lo-1],locator=f'derivative-lines:{lo}-{hi}',lineStart=lo,lineEnd=hi,date=date,author=author or w['author'],editorialContext=note,sourcePage=sourcePage,readableWords=len(re.findall(r"\b[\w'-]+\b",txt)))
        w['locations'].append(u)
        if prepare:
            p=CACHE/'components'/(uid+'.txt');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(txt,encoding='utf-8',newline='\n')
            components.append(dict(componentId=uid,parentAssetId=w['assetId'],parentSha256=w['originalSha256'],sourceLocator=u['locator'],lineStart=lo,lineEnd=hi,title=title,role=role,date=date,author=u['author'],editorialContext=note,derivedText=dict(path=p.relative_to(SITE).as_posix(),sha256=sha(p.read_bytes()),wordCount=u['readableWords']),evidenceOnly=True,eligibleForScopedIntake=False,integrated=False,publicHostingAllowed=False))
        return u
    def doc(w,u,kind,institution=None,dateCertainty='source-stated',note=None):
        documents.append(dict(assetId=w['assetId'],originalSha256=w['originalSha256'],sourceUrl=w['url'],**u,documentKind=kind,institution=institution,dateCertainty=dateCertainty,qualification=note,historicalEvidenceNotTheologicalEndorsement=True))
    for a in acq:
        w=addwork(a,'new-readable-witness');ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();n=len(ls);key=a['logicalWorkKey']
        u=unit(w,1,n,a['title'],a['admissionRole'],note=a['theologicalScope'])
        if key=='ivimey-history-v1':
            match=next((x for x in ls[:30] if re.search(r'A\.D\.',x)),None)
            if match:
                u['date']=match;doc(w,u,'later-historical-narrative',dateCertainty='chapter-period-not-document-date',note='1811 author narrative covering '+match+'; embedded quotations require separate attribution.')
            elif a['sourceLabel']=='Preface':
                start=next(i+1 for i,x in enumerate(ls) if x.strip()=='PREFACE')
                unit(w,1,start-1,'Later publisher biography of Ivimey','publisher-editorial-biography',date='1881',note='Heading says 1773-1830; narrative says death February 8, 1834. Do not harmonize silently.')
                v=unit(w,start,n,'Ivimey preface','author-historiographical-program',date='1811',author='Joseph Ivimey');doc(w,v,'later-historiography')
        elif key=='philadelphia-minutes-selected-1851':
            url=a['url'].rsplit('/',1)[-1]
            if '1707-1768' in url:
                starts=[(i+1,x.strip()) for i,x in enumerate(ls) if re.fullmatch(r'17\d\d',x.strip())]
                for i,(lo,yr) in enumerate(starts):
                    hi=starts[i+1][0]-1 if i+1<len(starts) else n
                    v=unit(w,lo,hi,'Philadelphia association record '+yr,'edited-association-record',date=yr,author='Philadelphia Baptist Association; 1851 Gillette edition',note='Early years are collected/summarized records, not a verbatim surviving contemporary minute book. Image-only tables excluded.',prepare=yr in ['1707','1712','1724','1749','1765'])
                    doc(w,v,'association-record','Philadelphia Baptist Association')
            elif re.search(r'philadelphia\.minu(?:te|t)s\.17',url):
                yr=re.search(r'(17\d\d)',url).group(1)
                assert yr in '\n'.join(ls[:8]),(url,yr)
                lo=next((i+1 for i,x in enumerate(ls) if x.startswith('MINUTES OF THE PHILADELPHIA')),1)
                v=unit(w,lo,n,'Philadelphia association minutes '+yr+(' (fall)' if '1774b' in url else ' (spring)' if url=='philadelphia.minutes.1774.html' else ''),'contemporary-meeting-record-through-later-editor',date=yr,note='Printed page numbers and contributor signatures retained. Some statistical pages remain image-only and are not acquired.')
                doc(w,v,'association-minutes','Philadelphia Baptist Association')
                if yr in ['1776','1778']:
                    at=next(i+1 for i,x in enumerate(ls) if x.strip()=='1777');end=next(i for i in range(at,n) if 'Ed' in ls[i])+1
                    z=unit(w,at,end,'Gillette note: no association meeting in 1777','1851-editorial-explanation',date='1777',author='A. D. Gillette',note='1851 editor reports no meeting because of war/occupation; repeated on 1776 and 1778 pages, not two documents or missing minutes.')
                    doc(w,z,'later-editorial-note','Philadelphia Baptist Association',note='Repeated witness of the same editorial explanation; do not count as a 1777 meeting.')
            elif url in ['1785.cl.phila.html','1786.cl.phila.html','1801.cl.phila.html']:
                yr=url[:4];names={'1785':'William Rogers','1786':'Thomas Ustick','1801':'James Ewing'};topic={'1785':'Justification / confession chapter XI','1786':'Adoption / confession chapter XII','1801':'Centenary retrospective and future counsel'}
                v=unit(w,1,n,'Philadelphia '+yr+' circular: '+topic[yr],'signed-doctrinal-historical-circular',date=yr,author=names[yr],note='1786 title is supplied by modern web transcription; historical theological statements remain source-specific.',prepare=True);doc(w,v,'association-circular','Philadelphia Baptist Association')
            else:doc(w,u,'1851-editorial-front-matter-or-early-church-history','Philadelphia Baptist Association',dateCertainty='printed-edition-1851-not-event-date')
        elif a['workId'].endswith('kiffin-autobiography'):
            pages=[(i+1,int(x.split(': ')[1])) for i,x in enumerate(ls) if x.startswith('SOURCE PDF PAGE: ')]
            for i,(lo,pnum) in enumerate(pages):unit(w,lo,pages[i+1][0]-1 if i+1<len(pages) else n,'Kiffin offered PDF page '+str(pnum),'edition-page',sourcePage=pnum)
            def pdfsection(first,last,title,role,author):
                lo=next(x for x,p in pages if p==first);hi=next(x for x,p in pages if p==last+1)-1 if last<62 else n
                v=unit(w,lo,hi,title,role,author=author,note='Source PDF pagination is the 2021 edition, not 1823 printed pagination.',prepare=True,sourcePage=f'{first}-{last}');doc(w,v,role)
            pdfsection(5,10,'Orme introduction','1823-editorial-introduction','William Orme')
            for first,last,title in [(11,14,'Early experiences'),(15,17,'Religious changes'),(18,19,'Business adventures'),(20,21,'Political hazard'),(22,23,'Dangers from Buckingham'),(24,27,'Domestic troubles'),(28,35,'Grandsons and embedded Hewling family letters'),(36,38,'Public conduct and concluding address')]:pdfsection(first,last,'Kiffin: '+title,'autobiographical-self-report-with-embedded-quotes','William Kiffin; embedded correspondents where stated')
            pdfsection(39,62,'Orme notes and additions','1823-editorial-notes-with-quoted-records','William Orme; Gross annotations 2021')
        elif a['workId'].endswith('knollys-life'):
            starts={}
            for label,needle in [('reader','THE EPISTLE TO THE READER.'),('life','THE LIFE and DEATH OF Mr.'),('continuation','Thus far was written with his own hand;'),('legacy',"Mr. Knollys's laſt Legacy to the Church"),('advertisements','Books Printed for John Harris')]:
                matches=[i+1 for i,x in enumerate(ls) if needle in x];assert len(matches)==1,(label,matches);starts[label]=matches[0]
            for lo,hi,title,author,role,date in [(starts['reader'],starts['life']-1,'Kiffin epistle to the reader','William Kiffin','editorial-primary-epistle','1692 publication; death stated September 19, 1691'),(starts['life'],starts['continuation']-1,'Knollys own life account to 1672','Hanserd Knollys','autobiographical-primary-account','to 1672'),(starts['continuation'],starts['legacy']-1,'Kiffin continuation / lost remainder notice','William Kiffin / editorial continuation','editorial-continuation','1691 death / 1692 publication'),(starts['legacy'],starts['advertisements']-1,'Knollys last legacy to the church','Hanserd Knollys','primary-pastoral-letter','shortly before death, 1691')]:
                v=unit(w,lo,hi,title,role,date=date,author=author,note='Title promises own account to 1672; continuation explicitly says the later author manuscript cannot be found. 18 encoded source gaps retained; advertisements/bookplate excluded from these units.',prepare=True);doc(w,v,role,dateCertainty='edition-stated-with-known-manuscript-loss')
            unit(w,starts['advertisements'],n,'John Harris publisher advertisements','unapproved-publisher-advertisement',date='1692')
        elif a['workId'].endswith('kiffin-lord-mayor'):
            u.update(date='1659-02-28 old-style year [1660 with January year start]');doc(w,u,'joint-primary-letter','London civic authorities',note='No Julian/Gregorian day conversion imposed; damaged imprint year remains source gap.')
        elif a['workId'].endswith('belyea-origins'):
            headings=['Introduction','The First Particular Baptists','The JLJ Church, Southwark','Baptism','Particular Baptists, Particular Beliefs','Origins','Anabaptist Origins','The 1644 Confession and Anabaptist Influence','Puritan Roots','Further Considerations','Mechanisms','Motivations','Conclusion']
            starts=[(i+1,x) for i,x in enumerate(ls) if x in headings]
            for i,(lo,title) in enumerate(starts):
                hi=starts[i+1][0]-1 if i+1<len(starts) else next(j+1 for j,x in enumerate(ls) if x=='[1]')-1
                v=unit(w,lo,hi,'Belyea: '+title,'qualified-modern-historical-argument',date='2007-05',note='Citation numbers and footnotes remain in full derivative. Argument is not an endorsed consensus.',prepare=title in ['The JLJ Church, Southwark','The 1644 Confession and Anabaptist Influence','Conclusion']);doc(w,v,'modern-historical-study')
        elif a['workId'].endswith('broadmead-1847'):
            for lo,hi,title,role in [(356,4008,'Underhill historical introduction','1847-editorial-history'),(4009,26696,'Broadmead records through Underhill','edited-primary-church-record'),(26697,28075,'Underhill addenda','1847-editorial-addenda-with-correspondence'),(28076,n,'1847 index','edition-index')]:
                v=unit(w,lo,hi,title,role,date='1640-1687 record period / 1847 edition',note='Exact offered OCR line ranges; no claim of manuscript-critical accuracy or unchanged chronological arrangement.');doc(w,v,role,'Broadmead congregation',dateCertainty='record-period-versus-edition')
            v=unit(w,4680,4754,'Broadmead account of the five-person 1640 gathering','edited-primary-foundation-account',date='1640',note='Terrill retrospective account in Underhill edition; mixed beginnings are not assumed to be fully Particular Baptist.',prepare=True);doc(w,v,'foundation-account','Broadmead congregation')
        elif a['workId'].endswith('broadmead-1974'):
            for lo,hi,title,role in [(151,4598,'Hayden introduction and editorial/historical context','1974-historical-editorial-study'),(4599,15752,'Broadmead record text, Hayden edition','primary-record-through-modern-edition'),(15753,16326,'Hayden appendices and selected bibliography','1974-editorial-record-and-bibliography'),(16327,n,'1974 indices and residual cover OCR','edition-index-not-primary-narrative')]:
                v=unit(w,lo,hi,title,role,date='1640-1687 record period / 1974 edition',note='Modern copyright retained, official offered private reading. Existing OCR has marginal/cover noise; do not use for unverified exact quotations.');doc(w,v,role,'Broadmead congregation',dateCertainty='record-period-versus-edition')
            v=unit(w,151,239,'Hayden on editions, Underhill insertions and lost correspondence','1974-editorial-comparison',date='1974',author='Roger Hayden',prepare=True);doc(w,v,'editorial-comparison','Broadmead congregation')
    # Reuse every RB07 mapped witness; verify its original and derivative anew.
    rb7=json.loads((R.parent/'RB07/chapter-map.json').read_text('utf-8'))
    for old in rb7['works']:
        if old['assetId'] in by:continue
        w=addwork(old,'already-held-RB07-reused');w['locations']=old['locations'];w['logicalWorkKey']='reused-RB07-'+old['assetId']
    rb7docs=json.loads((R.parent/'RB07/document-map.json').read_text('utf-8'))
    if isinstance(rb7docs,dict):documents.extend(dict(x,rb07Reused=True) for x in rb7docs.get('documents',rb7docs.get('entries',[])))
    # Historical confession spine and Kiffin communion boundary, already acquired.
    selected=[a for a in held if a['assetId'] in ['asset-expanded-986603d125b04ec6fc5b','asset-expanded-6ba00115206a755c14be','asset-expanded-3c8355adae1237a03b56','asset-rb01-73f2404c1011ff4e3d74','asset-rb01-65ea07423bdf6b36e33f','asset-rb01-3e0cb1c80d942a8d817d'] or (a.get('title') or '').startswith('Philadelphia Confession:')]
    for a in selected:
        if a['assetId'] in by:continue
        w=addwork(a,'already-held-confessional-spine-reused');ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines()
        v=unit(w,1,len(ls),w['title'],'held-confessional-or-doctrinal-comparison',note='Historic doctrine already held; edition and ordinance/covenant/communion differences remain distinct. No new download.');doc(w,v,'held-confessional-comparison',dateCertainty='consult-source-edition-not-assumed-modern-date')
        if a['assetId']=='asset-expanded-986603d125b04ec6fc5b':
            starts=[(i+1,x) for i,x in enumerate(ls) if re.match(r'CHAPTER \d+;',x)]
            for i,(lo,title) in enumerate(starts):
                unit(w,lo,starts[i+1][0]-1 if i+1<len(starts) else len(ls),title,'working-confessional-chapter',note='Held Second London digital witness; later foreword/signatories/appendix remain distinguishable in full source.')
    groups={}
    for a in acq:groups.setdefault(a['logicalWorkKey'],[]).append(a)
    group_titles={'ivimey-history-v1':'A History of the English Baptists, Volume I (1811), offered components with Gill prefixed excerpt','philadelphia-minutes-selected-1851':'Minutes of the Philadelphia Baptist Association (1851 Gillette edition): selected offered records and circulars'}
    group_scopes={'ivimey-history-v1':'Offered preface/front matter, ten chapters, notes and separately authored Gill prefixed historical excerpt; not Gill\'s whole treatise or Ivimey Volumes II-IV. Later publisher biography remains separately attributed.','philadelphia-minutes-selected-1851':'Twenty-seven offered readable pages: editorial front matter, early church histories, early-record parts, selected later minutes and three circulars; not the full 1707-1807 volume. Image-only statistics excluded.','broadmead-records':'Two overlapping offered existing OCR TXT editions: Underhill 1847 and Hayden 1974. Both preserve records with distinct editorial additions; not independently collated against the manuscript.'}
    write('bibliography.json',dict(mission='RB12',sourceFirst=True,registryApproval=False,newOriginalCount=len(acq),logicalWorkCount=len(groups),newEditionWitnesses=8,countRule='Seven logical work/collection groups; Broadmead has two editions, Ivimey thirteen physical HTML parts including the separately authored Gill prefix, Philadelphia twenty-seven selected pages. Not 46 books or a complete Philadelphia century.',works=[dict(logicalWorkKey=k,title=group_titles.get(k,v[0]['title']),authors=sorted(set(a['author'] for a in v)),assetIds=[a['assetId'] for a in v],originalFiles=len(v),originalBytes=sum(a['byteCount'] for a in v),readableWords=sum(a['derivedText']['wordCount'] for a in v),editionCount=2 if k=='broadmead-records' else 1,scope=group_scopes.get(k,v[0]['completeness'])) for k,v in groups.items()]))
    write('chapter-map.json',dict(mission='RB12',schemaVersion=1,works=works,historicalEvidenceNotGlobalEndorsement=True))
    write('document-table.json',dict(mission='RB12',documents=documents,qualification='Reading units and dated witnesses, not independently verified historical events; repeated editorial notes and edition overlaps are explicit.'))
    write('selected-components.json',dict(mission='RB12',components=components,integrated=False))
    write('intake-scope.json',dict(mission='RB12',files=[dict(assetId=a['assetId'],workId=a['workId'],sha256=a['sha256'],evidenceOnly=True,eligibleForScopedIntake=False,integrated=False,embedded=False,publicHostingAllowed=False,theologicalScope=a['theologicalScope'],rightsEvidence=a['rightsEvidence'],requiredActions=['Resolve work/edition identity and historical author/editor roles','Reconcile RB07 and confession/record overlaps','Exclude advertisements and unrelated modern contributor recommendations','Resolve exact text/corpus/FTS/vector rights per edition','Carry OCR/source gaps and uncertain dates/names into citations','Respect post-RB14 aggregate intake gate']) for a in acq]))
    rows=['# RB12 historical document table','','Exact derivative-line locators are relative to the hashed witness in [chapter-map.json](chapter-map.json). Roles distinguish author, editor, self-report and later study. Dates are source assertions, not independently proven events. RB07 documents are reused without new downloads.','','| Date / period | Document / reading unit | Role / author | Institution | Witness and locator |','|---|---|---|---|---|']
    for d in documents:
        rows.append('| '+' | '.join(str(x or '\u2014').replace('|','/').replace('\n',' ') for x in [d.get('date'),d['title'],d.get('role','')+' / '+str(d.get('author','')),d.get('institution'),d['assetId']+' / '+d['locator']])+' |')
    (R/'DOCUMENT-TABLE.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n')
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'locations;',len(documents),'document rows;',len(components),'private exact components;',len(groups),'logical groups')
if __name__=='__main__':main()
