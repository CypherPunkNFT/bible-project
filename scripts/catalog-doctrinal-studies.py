"""L07 offline catalog builder. Source citations and editorial reading links stay separate."""
import argparse
from collections import Counter
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urljoin
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/doctrinal-studies'
CACHE=SITE/'.local/library/run-l07-doctrinal-studies-2026-10-05'
DAY='2026-10-05'
spec=importlib.util.spec_from_file_location('l06_catalog',SITE/'scripts/catalog-scripture-studies.py')
helper=importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
read=helper.read; write=helper.write; ev=helper.ev; common=helper.common

# Explicit subject assignments to source-ordered chapters, not keyword predictions.
HODGE_TAGS={
1:['theological-method','theological-method','authority-of-scripture','authority-of-scripture','authority-of-scripture','inspiration',
   'existence-of-god','existence-of-god','existence-of-god','attributes-of-god','attributes-of-god','trinity','deity-of-christ','holy-spirit','divine-decrees','creation','providence','miracles','angels'],
2:['image-of-god','humanity','humanity','humanity','image-of-god','covenant-of-works','fall','original-sin','moral-responsibility',
   'salvation','covenant-of-grace','incarnation','christ','christ','atonement','penal-substitution','atonement','atonement','ascension-intercession','kingdom','incarnation','resurrection-of-christ','effectual-calling'],
3:['regeneration','faith','justification','sanctification','law-and-gospel','means-of-grace','heaven-hell','general-resurrection','return-of-christ','judgment']}
AA=[
('The Being of God',13,'existence-of-god'),('Theology: Its Sources',40,'theological-method'),('The Evidences of Christianity',52,'apologetics'),
('Inspiration',70,'inspiration'),('The Rule of Faith and Practice',81,'authority-of-scripture'),('The Canon of Scripture',93,'canon'),
('The Attributes of God',104,'attributes-of-god'),('The Holy Trinity',132,'trinity'),('The Decrees of God in General',167,'divine-decrees'),
('Predestination',178,'election'),('The Creation of the World',190,'creation'),('Angels',200,'angels'),('Providence',208,'providence'),
('The Original State of Man',220,'image-of-god'),('The Covenant of Works',233,'covenant-of-works'),('The Nature of Sin',238,'fall'),
('Original Sin',252,'original-sin'),('The Doctrine of the Will and of Human Inability',265,'moral-responsibility'),
('The Covenant of Grace',276,'covenant-of-grace'),('The Person of Christ',287,'incarnation'),('Mediatorial Office of Christ',295,'christ'),
('The Atonement',305,'atonement'),('The Intercession of Christ',325,'ascension-intercession'),('Mediatorial Kingship of Christ',327,'kingdom'),
('Effectual Calling',339,'effectual-calling'),('Regeneration',349,'regeneration'),('Faith',359,'faith'),
('Union of Believers with Christ',376,'union-with-christ'),('Repentance',381,'repentance'),('Justification',388,'justification'),
('Adoption',404,'adoption'),('Sanctification',408,'sanctification'),('Perseverance of the Saints',431,'perseverance'),
('Death and the State of the Soul after Death',436,'heaven-hell'),('The Resurrection',446,'general-resurrection'),
('The Second Advent and General Judgment',453,'return-of-christ'),('Heaven and Hell',465,'heaven-hell'),('Sacraments',475,'means-of-grace'),
('Baptism',485,'baptism'),("The Lord's Supper",510,'lords-supper')]

# Companion readings chosen editorially for a topic, never attributed to an unread chapter.
ANCHORS={
'theological-method':('2 Timothy',3,16,3,17,'Scripture as the equipment for teaching'),
'authority-of-scripture':('2 Timothy',3,16,3,17,'Authority and use of Scripture'),
'inspiration':('2 Timothy',3,16,3,17,'Scripture as God-breathed teaching'),
'canon':('Luke',24,44,24,45,'Jesus names the received scriptural divisions'),
'existence-of-god':('Romans',1,19,1,20,'Knowledge of God through his works'),
'apologetics':('1 Peter',3,15,3,16,'Giving a reasoned answer with gentleness'),
'attributes-of-god':('Malachi',3,6,3,6,'Divine constancy'),
'trinity':('Matthew',28,18,28,20,'The Father, Son and Holy Spirit in the baptismal commission'),
'holy-spirit':('John',14,16,14,17,'The promised Spirit and his presence'),
'divine-decrees':('Ephesians',1,4,1,11,'Purpose and election in Christ'),
'creation':('Genesis',1,1,1,3,'God as creator'),
'providence':('Romans',8,28,8,30,'God orders his saving purpose'),
'miracles':('John',20,30,20,31,'Signs and their stated purpose'),
'angels':('Hebrews',1,13,1,14,'Angels as ministering spirits'),
'humanity':('Genesis',2,7,2,7,'Human creaturehood'),
'image-of-god':('Genesis',1,26,1,28,'Humanity in the image of God'),
'covenant-of-works':('Genesis',2,15,2,17,'Command and sanction in Eden; covenant terminology is a theological interpretation'),
'fall':('Romans',5,12,5,19,'Adam, sin and its consequences'),
'original-sin':('Romans',5,12,5,19,'Adam and the human race'),
'moral-responsibility':('John',6,44,6,45,'Human coming and divine drawing'),
'salvation':('Ephesians',2,8,2,10,'Grace, faith and good works'),
'covenant-of-grace':('Hebrews',8,6,8,13,'Christ and the promised new covenant'),
'incarnation':('John',1,14,1,14,'The Word becomes flesh'),
'deity-of-christ':('John',1,1,1,3,'The Word and God'),
'christ':('1 Timothy',2,5,2,6,'The mediator and his ransom'),
'atonement':('Isaiah',53,4,53,6,'The servant bearing sins'),
'penal-substitution':('2 Corinthians',5,21,5,21,'Christ, sin and righteousness'),
'ascension-intercession':('Hebrews',7,24,7,25,'Christ lives to intercede'),
'kingdom':('Psalms',2,6,2,12,'God appoints his king'),
'resurrection-of-christ':('1 Corinthians',15,3,15,8,'Christ died, was buried and rose'),
'effectual-calling':('Romans',8,28,8,30,'Calling within the saving purpose'),
'regeneration':('John',3,3,3,8,'Birth from above and the Spirit'),
'faith':('Ephesians',2,8,2,10,'Faith and grace'),
'justification':('Romans',4,4,4,5,'Faith and the justification of the ungodly'),
'imputation':('2 Corinthians',5,21,5,21,'Sin and righteousness in relation to Christ'),
'sanctification':('1 Thessalonians',4,3,4,7,'God wills the believer’s holiness'),
'law-and-gospel':('Romans',3,19,3,24,'Law, knowledge of sin and justification'),
'means-of-grace':('Acts',2,41,2,42,'Teaching, fellowship, breaking bread and prayer'),
'heaven-hell':('Luke',16,19,16,31,'Account of death and contrasted destinies'),
'general-resurrection':('1 Corinthians',15,20,15,23,'Resurrection in Christ'),
'return-of-christ':('1 Thessalonians',4,13,4,18,'The Lord’s coming and resurrection hope'),
'judgment':('2 Corinthians',5,10,5,10,'The judgment seat of Christ'),
'election':('Ephesians',1,4,1,6,'Election in Christ'),
'union-with-christ':('John',15,1,15,5,'Abiding in Christ'),
'repentance':('Acts',3,19,3,19,'The call to repent'),
'adoption':('Romans',8,15,8,17,'Children and heirs of God'),
'perseverance':('John',10,27,10,29,'Christ keeps his sheep'),
'baptism':('Matthew',28,18,28,20,'Baptism within the commission; mode and subjects remain author-specific'),
'lords-supper':('1 Corinthians',11,23,11,26,'The institution of the Supper'),
}

FURTHER_READINGS={
 'theological-method':('John',5,39,5,40,'Searching Scripture and coming to Christ'),
 'authority-of-scripture':('Isaiah',8,20,8,20,'Testing teaching by revealed testimony'),
 'inspiration':('2 Timothy',3,14,3,17,'The sacred writings and their saving purpose'),
 'apologetics':('Acts',17,22,17,31,'Paul reasons about God, repentance and resurrection'),
 'deity-of-christ':('John',1,14,1,18,'The incarnate Word reveals God'),
 'angels':('Hebrews',1,6,1,6,'Angels commanded to worship the Son'),
 'humanity':('Acts',17,26,17,29,'Common human origin and dependence on God; a related passage, not a resolution of theories of the soul'),
 'image-of-god':('Colossians',3,9,3,11,'Renewal in the image of the Creator; a related application, not original-state exposition'),
 'covenant-of-works':('Romans',5,12,5,19,'Adam and Christ as heads; relation to covenant structure is interpreted differently'),
 'christ':('Galatians',3,19,3,20,'The language of mediation'),
 'justification':('Romans',3,24,3,26,'Justification through redemption in Christ'),
 'sanctification':('John',17,17,17,19,'Christ prays for sanctification in truth'),
 'means-of-grace':('1 Corinthians',11,23,11,26,'The Supper as one particular means; not a complete account of all means'),
}

def section(key,title,root,eid,author,genre,loc,url,tags,**extra):
    return dict(key=key,workId='work-l07-'+key,title=title,rootWorkId=root,parentWorkId=root,editionId=eid,authorId=author,
                genre=genre,locator=loc,url=url,subjects=tags,sourcePassages=[],evidenceLevel='contents-heading',**extra)

def prepare():
    import pymupdf
    rows=[]
    for vol in (1,2,3):
        parser=helper.Links(); parser.feed((CACHE/f'hodge-{vol}.html').read_text(encoding='utf-8'))
        toc=f'https://ccel.org/ccel/hodge/theology{vol}/theology{vol}.toc.html'
        group=''; n=0
        for title,url in parser.links:
            if title=='Introduction' or title.startswith('Part '): group=title
            if title.startswith('Chapter ') or title in ['The Resurrection.','Second Advent.','The Concomitants of the Second Advent.']:
                n+=1
                rows.append(section(f'hodge-v{vol}-{n:02}',title,'work-hodge-systematic',f'edition-hodge-systematic-{vol}',
                    'author-charles-hodge','systematic-theology',f'Volume {vol}; {group}; {title}',urljoin(toc,url),[HODGE_TAGS[vol][n-1]],
                    volume=vol,division=group,position=n,inventoryUrl=toc))
        assert n==len(HODGE_TAGS[vol]),(vol,n)
    parser=helper.Links(); parser.feed((CACHE/'owen.html').read_text(encoding='utf-8'))
    toc='https://ccel.org/ccel/owen/just/just.toc.html'
    owen_tags=['faith','faith','faith','justification','justification','justification','imputation','imputation','justification','justification',
               'law-and-gospel','imputation','covenant-of-grace','justification','faith','justification','justification','justification','sanctification','faith']
    n=0
    for title,url in parser.links:
        if not title.startswith('Chapter '): continue
        n+=1
        s=section(f'owen-{n:02}',title,'work-owen-justification','edition-owen-justification','author-john-owen','treatise',title,
            urljoin(toc,url),list(dict.fromkeys([owen_tags[n-1],'justification'])),position=n,inventoryUrl=toc)
        if n==16: s['sourcePassages']=[dict(range=['Jeremiah',23,6,23,6],role='main-text',locator='Chapter XVI title explicitly names Jeremiah 23:6')]
        rows.append(s)
    assert n==20
    for position,(title,start,tag) in enumerate(AA,1):
        end=AA[position][1]-1 if position<40 else 523
        rows.append(section(f'aa-hodge-{position:02}',title,'work-aa-hodge-outlines','edition-aa-hodge-outlines','author-a-a-hodge',
            'systematic-theology',f'Chapter {position}; printed pp. {start}-{end}; PDF pp. {start+4}-{end+4} (one-based)',
            f'https://archive.org/details/outlinesoftheolo00hodguoft/page/n{start+3}/mode/2up',[tag],position=position,
            printedPages=[start,end],pdfPages=[start+4,end+4],evidenceLevelOverride='scan-contents-and-opening',
            inventoryUrl='https://archive.org/details/outlinesoftheolo00hodguoft/page/n14/mode/2up'))
    warfield=[('The Differing Conceptions',11,33,'salvation',['1 Corinthians',1,30,1,30]),
              ('Autosoterism',37,59,'salvation',['Romans',9,16,9,16]),
              ('Sacerdotalism',63,84,'means-of-grace',['Acts',2,47,2,47]),
              ('Universalism',87,108,'atonement',['Galatians',2,20,2,20]),
              ('Calvinism',111,133,'election',['Acts',13,48,13,48])]
    for position,(title,start,end,tag,ref) in enumerate(warfield,1):
        s=section(f'warfield-{position:02}',title,'work-warfield-plan','edition-warfield-plan','author-b-b-warfield','lecture',
            f'Lecture {position}; printed pp. {start}-{end}; PDF pp. {start+2}-{end+2}; motto PDF p. {start+1}',
            f'https://archive.org/details/planofsalvation00warf/page/n{start+1}/mode/2up',[tag],position=position,
            printedPages=[start,end],pdfPages=[start+2,end+2],evidenceLevelOverride='scan-contents-and-opening',
            inventoryUrl='https://archive.org/details/planofsalvation00warf/page/n8/mode/2up')
        s['sourcePassages']=[dict(range=ref,role='citation',locator=f'Lecture motto; PDF p. {start+1}; a motto does not establish verse-by-verse exposition')]
        rows.append(s)
    # Substantial, source-defined units within the larger chapters.
    mappings=[('Romans iii.–v.',['Romans',3,1,5,21]),('Romans iii. 24–26',['Romans',3,24,3,26]),
        ('Romans iv.',['Romans',4,1,4,25]),('Romans v. 12–21',['Romans',5,12,5,21]),('Romans x. 3, 4',['Romans',10,3,10,4]),
        ('1 Corinthians i. 30',['1 Corinthians',1,30,1,30]),('2 Corinthians v. 21',['2 Corinthians',5,21,5,21]),
        ('Galatians ii. 16',['Galatians',2,16,2,16]),('Ephesians ii. 8–10',['Ephesians',2,8,2,10]),('Philippians iii. 8, 9',['Philippians',3,8,3,9])]
    for position,(label,ref) in enumerate(mappings,1):
        matches=[(t,u) for t,u in parser.links if t==label]; assert len(matches)==1,(label,matches)
        s=section(f'owen-18-s{position:02}',label,'work-owen-justification','edition-owen-justification','author-john-owen','treatise',
            'Chapter XVIII; source subsection '+label,urljoin(toc,matches[0][1]),['justification','imputation'],position=position,inventoryUrl=toc)
        s['parentWorkId']='work-l07-owen-18'
        s['sourcePassages']=[dict(range=ref,role='main-text',locator=s['locator'])]; rows.append(s)
    s=section('hodge-v3-03-s02','Justification is a Forensic Act','work-hodge-systematic','edition-hodge-systematic-3','author-charles-hodge',
        'systematic-theology','Volume III; Part III; chapter XVII; section 2; printed pp. 118ff.',
        'https://ccel.org/ccel/hodge/theology3/theology3.iii.iii.ii.html',['justification'],position=2,
        inventoryUrl='https://ccel.org/ccel/hodge/theology3/theology3.toc.html')
    s['parentWorkId']='work-l07-hodge-v3-03'; rows.append(s)
    s=section('owen-general','General considerations before the doctrine of justification','work-owen-justification','edition-owen-justification',
        'author-john-owen','treatise','General considerations before chapter I','https://ccel.org/ccel/owen/just/just.iv.html',
        ['justification'],position=0,inventoryUrl=toc); rows.append(s)
    # Verify every scanned opening, using retained text witnesses to flag displaced ranges.
    for prefix,item,offset in [('aa-hodge','outlinesoftheolo00hodguoft',4),('warfield','planofsalvation00warf',2)]:
        p=pymupdf.open(SOURCES/f'library/source-internet-archive/asset-l07-{prefix}-pdf/{item}.pdf')
        for s in rows:
            if not s['key'].startswith(prefix+'-'): continue
            opening=p[s['pdfPages'][0]-1].get_text()
            s['openingWitness']=' '.join(opening.split())[:220]
            assert len(opening)>50
            assert 1<=s['pdfPages'][0]<=s['pdfPages'][1]<=len(p)
            s['evidenceLevel']=s.pop('evidenceLevelOverride')
    write(OUT/'inventory.json',{'checkedOn':DAY,'sections':rows,'note':'Chapter display titles may shorten long captions; original CCEL titles and scan locators retain source identity. No appendices or editor prefaces counted as author chapters.'})
    print('Prepared',len(rows),'sections')

def build():
    sections=read(OUT/'inventory.json')['sections']; manifest=read(OUT/'acquisition-manifest.json')
    assessments=read(OUT/'assessments.json')['assessments']
    pairing_reviews=read(OUT/'sermon-pairing-reviews.json')['pairings']
    vocab=read(LIB/'vocabulary.json'); subject_map={s['id']:s for s in vocab['subjects']}
    hierarchy={k:dict(subjectId=k,label=subject_map[k]['label'],parent=subject_map[k]['parent'],definition=subject_map[k]['definition']) for k in ANCHORS}
    # Include each vocabulary ancestor even when it has no direct indexed chapter.
    for key in list(hierarchy):
        parent=hierarchy[key]['parent']
        while parent:
            if parent not in hierarchy: hierarchy[parent]=dict(subjectId=parent,label=subject_map[parent]['label'],parent=subject_map[parent]['parent'],definition=subject_map[parent]['definition'])
            parent=subject_map[parent]['parent']
    for key,node in hierarchy.items():
        node['directSectionIds']=[s['workId'] for s in sections if key in s['subjects']]
        descendant_ids=set(node['directSectionIds'])
        for s in sections:
            for tag in s['subjects']:
                parent=subject_map[tag]['parent']
                while parent:
                    if parent==key: descendant_ids.add(s['workId'])
                    parent=subject_map[parent]['parent']
        node['includingDescendantSectionIds']=sorted(descendant_ids)
    write(OUT/'doctrine-hierarchy.json',{'checkedOn':DAY,'authority':'Shared vocabulary IDs and parent relationships; an editorial browsing arrangement, not an assertion of identical author systems.','nodes':list(hierarchy.values())})
    counts=Counter(editions=0); created=[]
    def save(record):
        folder={'work':'works','asset':'assets','series':'series','run':'runs'}[record['kind']]
        assert '-l07-' in record['id']
        write(LIB/'catalog'/folder/(record['id']+'.json'),record); counts[folder]+=1; created.append(record['id'])
    books=read(SITE/'content/apologetics/scripture-index.json')['books']
    valid={b['num']*1000000+c*1000+v for b in books for c,n in enumerate(b['chapters'],1) for v in range(1,n+1)}
    def psg(r,role,locator): return helper.passage(r,role,locator)
    ordered_verses=sorted(valid)
    verse_positions={n:i for i,n in enumerate(ordered_verses)}
    @lru_cache(maxsize=None)
    def range_span(start,end):
        return frozenset(ordered_verses[verse_positions[start]:verse_positions[end]+1])
    def span(p): return range_span(p['start'],p['end'])
    eligible={a['id'] for a in read(LIB/'authors.json')['authors'] if a['eligibility']=='eligible'}
    sermon_pool=[]; input_hashes={}
    for f in sorted((LIB/'catalog/works').glob('*.json')):
        w=read(f)
        if w['genre']!='sermon' or w['role']!='core-teaching' or not all(c['authorId'] in eligible for c in w['creators'] if c['role'] in ['author','preacher']): continue
        passages=[p for p in w['passages'] if p['role']=='main-text' and p['verification']=='verified' and p['numberingSystem']=='english' and p['start'] in valid and p['end'] in valid]
        if passages:
            sermon_pool.append((w,passages)); input_hashes[w['id']]=hashlib.sha256(f.read_bytes()).hexdigest()
    # Maps record IDs to actual acquisition/source destinations, including parent holdings.
    editions={e['id']:e['workId'] for f in (LIB/'catalog/editions').glob('*.json') if (e:=read(f))}
    urls={}
    assets=[read(f) for f in sorted((LIB/'catalog/assets').glob('*.json'))]
    assets.sort(key=lambda a: {'html':0,'pdf':1}.get(a['format'],2))
    for a in assets:
        urls.setdefault(editions[a['editionId']],[]).append(a['canonicalUrl'])
    connections=[]
    for s in sections:
        assert s['authorId'] in eligible
        evidence=[ev(s['inventoryUrl'],s['locator'],'Identified chapter/section boundary; source context retained. Full-body review is not inferred from contents.')]
        era=read(LIB/'catalog/works'/(s['rootWorkId']+'.json'))['era']
        w=helper.base_work(s['workId'],s['title'],s['authorId'],s['genre'],era,evidence,s['subjects'])
        w['collections']=['theology']; w['externalIds']={'source-section':[s['url']]}
        w['related']=[dict(relation='is-part-of',targetId=s['parentWorkId'],locator=s['locator'])]
        w['notes']=['Section of '+s['rootWorkId']+' in '+s['editionId']+'.',
                    'Editorial Scripture and sermon companions live in the L07 connection index; they are not author citations or doctrinal endorsements.']
        for p in s['sourcePassages']: w['passages'].append(psg(p['range'],p['role'],p['locator']))
        for a in assessments:
            if a['sectionKey']==s['key']:
                evidence.append(ev(a['url'],a['locator'],a['summary']))
                for p in a['passages']: w['passages'].append(psg(p['range'],p['role'],a['locator']))
        if s['key'].startswith('warfield-'):
            w['dates']=[dict(event='delivery',value='1914-06',precision='month',label='Series delivered at Princeton Summer School of Theology, June 1914; no individual lecture day known',evidence=[ev('https://archive.org/details/planofsalvation00warf','Title leaf, PDF p. 5','Series delivery month, distinct from 1915 edition publication.')])]
        save(w)
        anchor=ANCHORS[s['subjects'][0]]
        reading=psg(list(anchor[:5]),'citation','Editorial companion reading for '+s['subjects'][0])
        # Prefer an actual source-assigned passage when available; otherwise the explicitly editorial topic anchor.
        target=[p for p in w['passages'] if p['role'] in ['main-text','substantial-exposition']] or w['passages'] or [reading]
        target_span=set().union(*(span(p) for p in target))
        def find_candidates(target_span,basis):
          candidates=[]
          for sermon,passages in sermon_pool:
            matches=[p for p in passages if span(p)&target_span]
            if matches:
                source=urls.get(sermon['id'],[])
                if not source:
                    for rel in sermon['related']: source+=urls.get(rel['targetId'],[])
                if source:
                    candidates.append(dict(workId=sermon['id'],title=sermon['title'],authorId=sermon['creators'][0]['authorId'],
                        sourceUrl=source[0],matchedMainTexts=matches,overlapVerses=sorted(set().union(*(span(p)&target_span for p in matches))),
                        basis=basis,
                        review='metadata-match-only; sermon argument and doctrinal agreement not inferred'))
          return candidates
        basis='Verified sermon main-text overlap with '+('source-assigned passage' if target!=[reading] else 'editorial companion reading')
        candidates=find_candidates(target_span,basis)
        further=[]
        if not candidates and s['subjects'][0] in FURTHER_READINGS:
            extra=FURTHER_READINGS[s['subjects'][0]]
            alternate=psg(list(extra[:5]),'citation','Editorial further reading for '+s['subjects'][0])
            further=[dict(reference=alternate['reference'],start=alternate['start'],end=alternate['end'],reason=extra[5],
                attribution='Editorial related-topic reading, not an author citation or exact chapter-argument match')]
            target=[alternate]
            candidates=find_candidates(span(alternate),'Verified sermon main-text overlap with editorial related-topic reading')
        selected=[]; seen=set()
        for c in candidates:
            if c['authorId'] not in seen: selected.append(c); seen.add(c['authorId'])
            if len(selected)==3: break
        for c in candidates:
            if len(selected)>=3: break
            if c not in selected: selected.append(c)
        for c in selected:
            reviewed=next((r for r in pairing_reviews if r['sectionWorkId']==w['id'] and r['sermonWorkId']==c['workId']),None)
            if reviewed:
                c['review']='selected-body-connection; see scoped pairing assessment'
                c['pairingReviewId']=reviewed['id']
        connections.append(dict(workId=w['id'],rootWorkId=s['rootWorkId'],parentWorkId=s['parentWorkId'],editionId=s['editionId'],
            authorId=s['authorId'],subjects=s['subjects'],sourceUrl=s['url'],locator=s['locator'],sourcePassages=w['passages'],
            editorialScripture=dict(reference=reading['reference'],start=reading['start'],end=reading['end'],reason=anchor[5],
                attribution='Project editorial companion, not a claim that this chapter cites or expounds this passage'),
            editorialFurtherReadings=further,sermonSearchPassages=target,sermonCandidates=selected,totalMatchingSermons=len(candidates),
            gap=None if selected else 'No eligible catalog sermon with a verified main-text overlap; do not invent a connection.'))
    for f in manifest['files']:
        if f['evidenceOnly']: continue
        raw=SOURCES/f['relativePath']; assert hashlib.sha256(raw.read_bytes()).hexdigest()==f['sha256']
        a=helper.link_asset(f['assetId'],f['editionId'],'source-internet-archive',f['url'],[
            ev('https://archive.org/details/'+f['itemId'],'Retained title/contents leaves','Identified 1877 or 1915 historic edition; original bytes checked against host size and MD5.'),
            ev('https://www.copyright.gov/circs/circ15a.pdf','Duration of copyright','Scoped US assessment of historical published text; later additions excluded.')])
        a.update(finalUrl=f['finalUrl'],format=f['format'],mediaKind='scan' if f['format']=='pdf' else 'text',acquisitionStatus='downloaded',storage='raw',
            relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
        a['rights'].update(category='public-domain',jurisdiction='United States',unresolved=['No worldwide rights conclusion; host OCR unproofread and public packaging not cleared.'])
        a['rights']['actions']['download']='allowed'; a['rights']['review']['scope']='Identified historical edition and private acquisition; no public republication or full-text-index clearance.'
        a['processing']['note']='Unaltered host file; not newly transcribed.'; a['quality']['note']='Title, contents and openings checked; full OCR not proofread.'
        save(a)
    groups=[('hodge-v1',19),('hodge-v2',23),('hodge-v3',10),('aa-hodge',40),('owen',20),('warfield',5)]
    for prefix,expected in groups:
        members=[s for s in sections if re.fullmatch(re.escape(prefix)+r'-\d\d',s['key'])]
        assert len(members)==expected
        r=dict(**common('series','series-l07-'+prefix),title='Chapter/lecture inventory: '+prefix,authorIds=[members[0]['authorId']],
            members=[dict(workId=s['workId'],position=s['position'],originalLabel=s['title']) for s in members],expectedCount=expected,completeness='complete',
            inventoryEvidence=[ev(members[0]['inventoryUrl'],'Contents and source chapter divisions','Complete in this chapter-level boundary; does not imply every subparagraph indexed or body-reviewed.')],missing=[])
        save(r)
    write(OUT/'section-connections.json',{'checkedOn':DAY,'rule':'Connections aid discovery. Editorial companions are separate from source citations; passage overlap is not doctrinal agreement or substantive sermon review.','sections':connections})
    write(OUT/'sermon-input-hashes.json',{'checkedOn':DAY,'workSha256':input_hashes})
    summary=dict(checkedOn=DAY,existingRootWorks=4,existingEditionsReused=6,newSectionWorks=len(sections),
        counts=dict(counts),downloadedContentAssets=4,downloadedContentBytes=sum(f['byteCount'] for f in manifest['files'] if not f['evidenceOnly']),
        doctrineNodes=len(hierarchy),bodyAssessments=len(assessments),selectedBodySermonPairings=len(pairing_reviews),sectionsWithSourcePassages=sum(bool(s['sourcePassages']) for s in connections),
        sectionsWithEditorialScripture=len(connections),sectionsWithSermonCandidates=sum(bool(s['sermonCandidates']) for s in connections),
        sermonCandidateEdges=sum(len(s['sermonCandidates']) for s in connections),uniqueSermonsLinked=len({c['workId'] for s in connections for c in s['sermonCandidates']}),
        unmatchedSectionIds=[s['workId'] for s in connections if not s['sermonCandidates']],reviewedWorks=0,publishedWorks=0)
    write(OUT/'summary.json',summary)
    write(OUT/'checkpoint.json',dict(status='bounded-batch-complete',jobsRunning=False,next=[
        'Review chapter bodies before promoting editorial companions to source citations or exposition.',
        'Expand full texts for Charles Hodge and Owen using identified cleared print witnesses.',
        'Expand eligible systematic authors and preserve edition-specific doctrinal differences.',
        'Review sermon arguments before promoting metadata overlap candidates to recommended pairings.']))
    r=dict(**common('run','run-l07-doctrinal-studies-2026-10-05'),missionId='L07',status='complete',startedOn=DAY,completedOn=DAY,
        boundary='Four existing works: Hodge three volumes, A. A. Hodge 1877, Owen justification, Warfield five lectures; complete chapter inventories and selected substantial units.',
        sourceIds=['source-ccel','source-internet-archive'],inventory='content/library/reports/doctrinal-studies/inventory.json',
        checkpoint='content/library/reports/doctrinal-studies/checkpoint.json',counts=dict(counts,reviewedWorks=0,publishedWorks=0),
        gaps=['Only two whole books acquired. CCEL manifestations remain link-only.','Editorial companions are not verified author citations.','Full theological, textual and sermon-pairing review outstanding.'],
        reportPath='content/library/reports/doctrinal-studies/REPORT.md')
    # Run schema has no editorial-state fields.
    for field in ['editorialState','notes','reviews']: r.pop(field)
    save(r); write(OUT/'record-manifest.json',{'recordIds':created}); print(json.dumps(summary,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--prepare',action='store_true'); args=parser.parse_args()
    prepare() if args.prepare else build()
