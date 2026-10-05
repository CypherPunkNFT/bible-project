"""Build L08 offline. Exact source payloads stay in immutable originals, never harmonized."""
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
from bible.books import BOOKS
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]; LIB=SITE/'content/library'
OUT=LIB/'reports/confessional-standards'; DAY='2026-10-05'
spec=importlib.util.spec_from_file_location('l06',SITE/'scripts/catalog-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
read=h.read; write=h.write; ev=h.ev; common=h.common
BOOKMAP={b[3]:b[1] for b in BOOKS}
BIBLE={b['name']:b for b in read(SITE/'content/apologetics/scripture-index.json')['books']}
CHAPTER_TAGS=['authority-of-scripture','trinity','divine-decrees','creation','providence','fall','covenant-of-grace','christ',
 'moral-responsibility','effectual-calling','justification','adoption','sanctification','faith','repentance','holiness','perseverance','assurance','law-and-gospel']
WCF_TAGS=CHAPTER_TAGS+['ethics','worship','ethics','ethics','marriage-family','church','unity','means-of-grace','baptism','lords-supper','church-discipline','church-government','general-resurrection','judgment']
LBC_TAGS=CHAPTER_TAGS+['evangelism','ethics','worship','ethics','ethics','marriage-family','church-government','unity','means-of-grace','baptism','lords-supper','general-resurrection','judgment']
# Ranges are reviewed navigation categories, not word-frequency assignments or claims of identical teaching.
RANGES={
 'wsc':[(1,1,'worship'),(2,3,'authority-of-scripture'),(4,5,'attributes-of-god'),(6,6,'trinity'),(7,8,'divine-decrees'),(9,9,'creation'),(10,10,'image-of-god'),(11,11,'providence'),(12,12,'covenant-of-works'),(13,19,'fall'),(20,20,'covenant-of-grace'),(21,28,'christ'),(29,32,'effectual-calling'),(33,33,'justification'),(34,34,'adoption'),(35,35,'sanctification'),(36,36,'assurance'),(37,38,'last-things'),(39,44,'law-and-gospel'),(45,62,'worship'),(63,81,'ethics'),(82,84,'fall'),(85,85,'salvation'),(86,86,'faith'),(87,87,'repentance'),(88,93,'means-of-grace'),(94,95,'baptism'),(96,97,'lords-supper'),(98,107,'prayer')],
 'wlc':[(1,1,'worship'),(2,2,'existence-of-god'),(3,6,'authority-of-scripture'),(7,8,'attributes-of-god'),(9,11,'trinity'),(12,14,'divine-decrees'),(15,15,'creation'),(16,16,'angels'),(17,17,'image-of-god'),(18,19,'providence'),(20,20,'covenant-of-works'),(21,29,'fall'),(30,35,'covenant-of-grace'),(36,56,'christ'),(57,60,'salvation'),(61,65,'church'),(66,66,'union-with-christ'),(67,69,'effectual-calling'),(70,71,'justification'),(72,73,'faith'),(74,74,'adoption'),(75,75,'sanctification'),(76,76,'repentance'),(77,78,'sanctification'),(79,79,'perseverance'),(80,81,'assurance'),(82,90,'last-things'),(91,101,'law-and-gospel'),(102,121,'worship'),(122,148,'ethics'),(149,152,'fall'),(153,153,'salvation'),(154,157,'means-of-grace'),(158,160,'preaching'),(161,164,'means-of-grace'),(165,167,'baptism'),(168,175,'lords-supper'),(176,177,'means-of-grace'),(178,196,'prayer')],
 'baptist':[(1,3,'existence-of-god'),(4,6,'authority-of-scripture'),(7,8,'attributes-of-god'),(9,9,'trinity'),(10,11,'divine-decrees'),(12,12,'creation'),(13,13,'image-of-god'),(14,14,'providence'),(15,15,'covenant-of-works'),(16,22,'fall'),(23,23,'election'),(24,31,'christ'),(32,35,'effectual-calling'),(36,36,'justification'),(37,37,'adoption'),(38,38,'sanctification'),(39,39,'assurance'),(40,43,'last-things'),(44,49,'law-and-gospel'),(50,67,'worship'),(68,86,'ethics'),(87,89,'fall'),(90,90,'salvation'),(91,91,'faith'),(92,92,'repentance'),(93,96,'means-of-grace'),(97,101,'baptism'),(102,104,'lords-supper'),(105,114,'prayer')]
}

def qtag(key,n): return next(tag for a,b,tag in RANGES[key] if a<=int(n)<=b)
def date(event,value,label,evidence): return dict(event=event,value=value,precision='year',label=label,evidence=evidence)
def payload_hash(data): return hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def resolve(data,pointer):
    for part in pointer.strip('/').split('/'): data=data[int(part)] if isinstance(data,list) else data[part]
    return data

def normalize(raw,locator):
    """Only explicit OSIS-like references; preserve invalid/ambiguous pieces, never repair."""
    out=[]
    for part in raw.split(','):
        try:
            ends=part.split('-'); parsed=[]
            for i,end in enumerate(ends):
                match=re.fullmatch(r'([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?',end)
                if not match: raise ValueError('Unsupported source syntax')
                book=BOOKMAP[match[1]]; ch=int(match[2]); chapters=BIBLE[book]['chapters']
                if not 1<=ch<=len(chapters): raise ValueError('Chapter outside canonical range')
                verse=int(match[3]) if match[3] else (chapters[ch-1] if i or len(ends)==1 else 1)
                parsed.append((book,ch,verse,match[3] is None))
            first,last=parsed[0],parsed[-1]
            if first[0]!=last[0]: raise ValueError('Cross-book range requires review')
            startverse=1 if first[3] else first[2]
            p=h.passage([first[0],first[1],startverse,last[1],last[2]],'citation',locator)
            out.append(dict(raw=part,status='endpoint-verified',passage=p))
        except (KeyError,ValueError,AssertionError,IndexError) as error:
            out.append(dict(raw=part,status='unresolved',passage=None,reason=str(error) or 'Verse outside canonical range'))
    return out

def build():
    manifest=read(OUT/'acquisition-manifest.json'); sha=manifest['commit']; lsha=manifest['lbcCommit']
    files={f['key']:f for f in manifest['files']}; originals={}
    for key,f in files.items():
        if f.get('relativePath'):
            raw=(SOURCES/f['relativePath']).read_bytes(); assert hashlib.sha256(raw).hexdigest()==f['sha256']
            if f['relativePath'].endswith('.json'): originals[key]=json.loads(raw)
    license_url=f'https://github.com/NonlinearFruit/Creeds.json/blob/{sha}/README.md'
    cc0_url=f'https://github.com/lwalen/lbcf/blob/{lsha}/LICENSE'
    counts=Counter(); records=[]; units=[]; issues=[]; documents=[]; proofs=[]
    def save(r):
        folder={'work':'works','edition':'editions','asset':'assets','series':'series','run':'runs'}[r['kind']]
        assert '-l08-' in r['id']; write(LIB/'catalog'/folder/(r['id']+'.json'),r); records.append(r['id']); counts[folder]+=1
    institutions=[
      ('westminster-assembly','Westminster Assembly',['presbyterian','reformed'],files['wcf']['url'],'Corporate author of the Westminster standards; 1647 historic form distinguished from later American revisions.'),
      ('particular-baptist-assembly','Particular Baptist churches and messengers',['baptist','reformed'],files['lbc']['url'],'Corporate confession and catechism tradition; 1695 catechism attribution to William Collins is retained as source metadata, not an independently verified personal authorship decision.'),
      ('palatinate-church','Reformed church of the Electoral Palatinate',['continental-reformed'], 'https://ccel.org/ccel/schaff/creeds3/creeds3.iv.vi.html','Heidelberg Catechism as a corporate standard; not sole authorship assigned to Ursinus.'),
      ('netherlands-reformed-churches','Reformed churches of the Netherlands',['continental-reformed'],'https://ccel.org/ccel/schaff/creeds3/creeds3.iv.viii.html','Belgic Confession in the revised 1619 received form; original composition associated with Guido de Bres.'),
      ('synod-dort','Synod of Dort',['continental-reformed'],'https://ccel.org/ccel/schaff/creeds3/creeds3.iv.xvi.html','1618–1619 synod; doctrinal heads and rejection of errors must remain distinct.'),
      ('savoy-assembly','Savoy Assembly',['congregational','reformed'],'https://ccel.org/ccel/schaff/creeds3/creeds3.toc.html','1658 Congregational standard; selected host text not acquired.'),
      ('english-convocation','Convocation of the Church of England',['anglican','reformed'],'https://ccel.org/ccel/schaff/creeds3/creeds3.iv.xi.html','1571 English Articles as a historic Protestant standard within broad scope; does not endorse every later Anglican interpretation.')]
    authors=[]
    for key,name,trad,url,note in institutions:
        authors.append(dict(id='author-l08-'+key,entityType='institution',name=name,aliases=[],cohort='historic-confessional-institutions',traditions=trad,
          eligibility='eligible',rationale=note,receptionBasis='Historic ecclesial standard named and reproduced by the cited source; admission is scoped to this document.',
          evidence=[ev(url,'Document heading, attribution and text',note)],distinctives=[],unresolved=['No blanket eligibility judgment concerning later members, revisions or affiliated institutions.'],
          review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Corporate documentary identity and theological scope, not personal authorship.')))
    write(LIB/'registry-extensions/confessional-institutions.json',{'$schema':'../schema.json','schemaVersion':1,'kind':'author-registry','updated':DAY,'authors':authors})
    sources=read(LIB/'sources.json')
    for sid,name,url,policy,note in [
      ('source-creeds-json','Creeds.json historical-document repository','https://github.com/NonlinearFruit/Creeds.json',license_url,'Explicit named-file acquisition at pinned commit via public GitHub endpoints. Unlicense excludes listed texts, notably Savoy; modern translations require independent review.'),
      ('source-lwalen-lbcf','lwalen Second London Baptist Confession repository','https://github.com/lwalen/lbcf',cc0_url,'Named JSON and Markdown witnesses at pinned commit; CC0 dedication. JSON and Markdown are distinct manifestations; proof apparatus is not silently grafted across them.')]:
        r=dict(id=sid,name=name,url=url,role='content-host',automation='approved-endpoint',acquisitionNote=note,
          evidence=[ev(policy,'License/README',note),ev('https://docs.github.com/en/rest/repos/contents','Public repository contents endpoints','Unauthenticated named public content retrieval; no website crawling.')],reviewedOn=DAY)
        sources['sources']=[s for s in sources['sources'] if s['id']!=sid]+[r]
    write(LIB/'sources.json',sources)
    def edition(key,wid,label,evidence,modern='unknown',year=None,publisher=None,abridgment='unknown'):
        eid='edition-l08-'+key
        save(dict(**common('edition',eid),workId=wid,label=label,languages=['en'],contributors=[],publisher=publisher,
          dates=[date('edition-publication',year,year,evidence)] if year else [],abridgment=abridgment,modernization=modern,evidence=evidence)); return eid
    def asset(key,eid,sid,license_kind=None):
        f=files[key]; evidence=[ev(f['url'],'Pinned original','SHA-256 and byte count retained; all original bytes preserved.')]
        a=h.link_asset(f['assetId'],eid,sid,f['url'],evidence)
        a.update(finalUrl=f['finalUrl'],format='pdf' if key=='flavel-1767-pdf' else 'text' if key.endswith('-md') else 'other',mediaKind='scan' if key=='flavel-1767-pdf' else 'text',
          acquisitionStatus='downloaded',storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
        a['processing']['note']='Unmodified source bytes; JSON stored as format other, exact MIME and extension retained. No public search ingestion.'
        a['rights']['actions']['download']='allowed'
        if license_kind:
            url=cc0_url if license_kind=='CC0-1.0' else license_url
            a['rights'].update(category='open-license',licenseId=license_kind,licenseUrl=url,attribution='Historical corporate/individual author; digital witness supplied by '+sid,
              unresolved=['License applies only to named witness; textual accuracy, historic edition matching and public selection remain separate.'],evidence=evidence+[ev(url,'License statement','Selected file is covered; excluded files were not acquired.')])
            a['rights']['actions'].update(host='allowed',redistribute='allowed',adapt='allowed',indexFullText='allowed')
        else:
            a['rights'].update(category='public-domain',jurisdiction='United States',unresolved=['Historic 1767 text; Google/Oxford scan packaging retained for private research, not cleared for public hosting.'])
        if key=='flavel':
            a['rights']['unresolved'].append('Modernization source and translator/editor provenance unresolved; defer republication despite upstream Unlicense declaration.')
            a['rights']['actions'].update(host='unknown',redistribute='unknown',adapt='unknown',indexFullText='unknown')
        a['rights']['review']['scope']='Named-file license and private acquisition reviewed; not a theological or transcription certification.'
        a['quality'].update(state='issues' if key in ['lbc','flavel'] else 'sampled',reviewedBy='Codex',reviewedOn=DAY,note='Structure and selected loci checked. See L08 issues; no complete print collation.')
        save(a)
    for key in ['wcf','wsc','wlc','lbc','baptist','flavel']:
        d=originals[key]; meta=d['Metadata']; wid='work-l08-'+key
        aid='author-john-flavel' if key=='flavel' else 'author-l08-'+('westminster-assembly' if key.startswith('w') else 'particular-baptist-assembly')
        evidence=[ev(files[key]['url'],'Metadata and Data','Pinned digital witness; source edition claim retained without treating it as a diplomatic transcription.')]
        w=h.base_work(wid,meta['Title'],aid,'treatise' if key=='flavel' else 'confession' if key in ['wcf','lbc'] else 'catechism','post-reformation',evidence,['catechesis'])
        w.update(collections=['standards','theology'],role='core-teaching' if key=='flavel' else 'confessional-standard',alternateTitles=meta['AlternativeTitles'])
        if key!='flavel': w['creators'][0]['role']='institution'
        w['dates']=[date('original-publication',meta['Year'],'Upstream historic date; digital manifestation date is separate',evidence)] if key!='flavel' else [date('delivery','1688','Dartmouth Lord’s Day exercises (scan title)',[ev('https://archive.org/details/anexpositionass00flavgoog','PDF p. 6 title leaf','1688 describes exercises; imprint is 1767.')]),date('original-publication','1692','Published edition recorded by National Diet Library',[ev('https://ndlsearch.ndl.go.jp/books/R100000097-I4920000005077205','Publication year','1692 bibliographic record; not the acquired impression.')])]
        if key=='flavel': w['related']=[dict(relation='comments-on',targetId='work-l08-wsc',locator='Westminster Shorter Catechism, with practical inferences')]
        save(w)
        eid=edition(key,wid,'Creeds.json digital witness; upstream historic year '+meta['Year']+'; pinned '+sha[:12],evidence,'modernized' if key=='flavel' else 'unknown')
        asset(key,eid,'source-creeds-json','Unlicense')
        doc=dict(key=key,workId=wid,editionId=eid,assetId=files[key]['assetId'],sourceMetadata=meta,sourceUrl=files[key]['url'],unitCount=0,completeness='Complete supplied Data array; print completeness not established',proofState='structured' if key in ['wcf','wlc','baptist'] else 'embedded-unparsed' if key=='flavel' else 'absent-from-this-witness')
        documents.append(doc); members=[]
        for pos,block in enumerate(d['Data'],1):
            label=str(block.get('Chapter',block.get('Number')))
            tags=[(WCF_TAGS if key=='wcf' else LBC_TAGS)[pos-1]] if key in ['wcf','lbc'] else [qtag(key,label)] if key!='flavel' else ['catechesis']
            # All source proof strings remain attached to their exact paragraph, answer or subquestion.
            parts=block.get('Sections',[block])
            for j,part in enumerate(parts):
                pointer=f'/Data/{pos-1}'+(f'/Sections/{j}' if 'Sections' in block else '')
                unit=dict(id=f'unit-l08-{key}-'+(f'c{label.zfill(2)}-p{str(part["Section"]).zfill(2)}' if 'Sections' in block else f'q{label.zfill(3)}' if key!='flavel' else f'block-{pos:03}'),
                  documentKey=key,editionId=eid,assetId=files[key]['assetId'],pointer=pointer,payloadSha256=payload_hash(part),sourceLabel=label+('.'+str(part['Section']) if 'Section' in part else ''),
                  sourceTitle=block.get('Title'),question=part.get('Question'),answerPointer=pointer+'/Answer' if 'Answer' in part else None,
                  contentPointer=pointer+'/Content' if 'Content' in part else None,markedTextPointer=pointer+('/AnswerWithProofs' if 'AnswerWithProofs' in part else '/ContentWithProofs') if 'AnswerWithProofs' in part or 'ContentWithProofs' in part else None,
                  subjects=tags,proofs=part.get('Proofs',[]),subQuestionCount=len(part.get('SubQuestions',[])))
                units.append(unit); doc['unitCount']+=1
                for proof in part.get('Proofs',[]):
                    for ri,raw in enumerate(proof['References']):
                        result=normalize(raw,unit['id']+' proof '+str(proof['Id']))
                        proofs.append(dict(unitId=unit['id'],proofId=proof['Id'],referencePosition=ri+1,raw=raw,normalizations=result))
                for si,sub in enumerate(part.get('SubQuestions',[])):
                    units.append(dict(id=unit['id']+f'-sub-{si+1:03}',documentKey=key,editionId=eid,assetId=files[key]['assetId'],parentUnitId=unit['id'],pointer=pointer+f'/SubQuestions/{si}',payloadSha256=payload_hash(sub),
                      sourceLabel=str(sub['Number']),question=sub['Question'],answerPointer=pointer+f'/SubQuestions/{si}/Answer',subjects=tags,proofs=[],proofState='Embedded references and quoted verses preserved in original Answer; unparsed'))
            if key=='flavel': continue  # Exposition blocks are witness locators, not inferred independent works.
            ident='work-l08-'+key+('-chapter-' if key in ['wcf','lbc'] else '-question-')+label.zfill(3)
            title=block.get('Title',block.get('Question'))
            s=h.base_work(ident,title,aid,w['genre'],'post-reformation',[ev(files[key]['url'],f'/Data/{pos-1}; original label {label}','Title/question and source order preserved; subject mapping is editorial navigation.')],tags)
            s.update(role='confessional-standard',collections=['standards'],creators=[dict(authorId=aid,role='institution')],related=[dict(relation='is-part-of',targetId=wid,locator=('Chapter ' if 'Chapter' in block else 'Question ')+label)],externalIds={'l08-witness':[eid],'l08-pointer':[f'/Data/{pos-1}']})
            if key=='lbc' and label in ['20','21','25']: s['notes']=['Source chapter heading is erroneous; retained verbatim. Consult parallel CC0 witness and L08 issue register.']
            save(s); members.append(dict(workId=ident,position=pos,originalLabel=label))
        if members:
            series=dict(**common('series','series-l08-'+key),title=meta['Title']+' — supplied ordered inventory',authorIds=[aid],members=members,expectedCount=len(members),completeness='complete',inventoryEvidence=evidence,missing=[])
            series['notes']=['Completeness refers to supplied numbered inventory, not every historic edition or proof apparatus.']; save(series)
    # Two additional digital manifestations of the same Baptist confession, not new root works.
    for key,fmt in [('lbc-cc0-lbcf-json','json'),('lbc-cc0-lbcf-with-scripture-refs-md','md')]:
        eid=edition('lbc-cc0-'+fmt,'work-l08-lbc','lwalen pinned '+lsha[:12]+' '+fmt+' witness; '+('paragraph proof references' if fmt=='md' else 'historic-spelling body'),[ev(files[key]['url'],'Entire named file','Separate manifestation: do not merge punctuation, spelling or proof apparatus.')])
        asset(key,eid,'source-lwalen-lbcf','CC0-1.0')
        text=(SOURCES/files[key]['relativePath']).read_bytes().decode('utf-8-sig')
        if fmt=='json':
            data=originals[key]; rows=[(c,p,content,f'/chapters/{c}/paragraphs/{p}',v['title']) for c,v in data['chapters'].items() for p,content in v['paragraphs'].items()]
        else:
            rows=[]
            for match in re.finditer(r'^## CHAPTER (\d+): ([^\n]+)\n(.*?)(?=^## CHAPTER |\Z)',text,re.M|re.S):
                if match[1]=='12':
                    rows.append(('12','unnumbered',match[3],dict(start=match.start(3),end=match.end(3)),match[2]))
                for pm in re.finditer(r'^[ \t]*(\d+)\. (.*?)(?=^[ \t]*\d+\. |\Z)',match[3],re.M|re.S):
                    start=match.start(3)+pm.start(); end=match.start(3)+pm.end()
                    rows.append((match[1],pm[1],text[start:end],dict(start=start,end=end),match[2]))
        for c,p,content,loc,title in rows:
            unit=dict(id=f'unit-l08-lbc-cc0-{fmt}-c{c.zfill(2)}-p{p.zfill(2)}',documentKey='lbc-cc0-'+fmt,editionId=eid,assetId=files[key]['assetId'],sourceLabel=c+'.'+p,sourceTitle=title,subjects=[LBC_TAGS[int(c)-1]],proofState='paragraph-reference-blocks' if fmt=='md' else 'absent-from-this-witness')
            if fmt=='json': unit.update(pointer=loc,payloadSha256=payload_hash(content),proofs=[])
            else: unit.update(characterSpan=loc,payloadSha256=hashlib.sha256(content.encode()).hexdigest(),proofBlocks=re.findall(r'^\s+\( (.*?)\)\s*$',content,re.M),offsetConvention='Unicode code points after decoding UTF-8-sig; original newline characters preserved')
            units.append(unit)
        documents.append(dict(key='lbc-cc0-'+fmt,workId='work-l08-lbc',editionId=eid,assetId=files[key]['assetId'],sourceUrl=files[key]['url'],unitCount=len(rows),proofState='paragraph-reference-blocks' if fmt=='md' else 'absent-from-this-witness',completeness='Complete supplied chapter/paragraph inventory'))
    eid=edition('flavel-1767','work-l08-flavel','Salisbury: Edward Easton, 1767; Oxford/Google scan',[ev('https://archive.org/details/anexpositionass00flavgoog','PDF p. 6 title leaf (visually inspected)','Imprint MDCCLXVII; 1688 in title describes Dartmouth exercises.')],year='1767',publisher='Edward Easton, Salisbury')
    asset('flavel-1767-pdf',eid,'source-internet-archive')
    by_doc_label={(u['documentKey'],u['sourceLabel']):u for u in units if u['documentKey'].startswith('lbc')}
    crosswalk=[]
    for u in [u for u in units if u['documentKey']=='lbc']:
        label=u['sourceLabel']; other=by_doc_label[('lbc-cc0-json',label)]
        md=by_doc_label[('lbc-cc0-md','12.unnumbered' if label=='12.1' else label)]
        first=resolve(originals['lbc'],u['pointer'])['Content']; second=resolve(originals['lbc-cc0-lbcf-json'],other['pointer'])
        crosswalk.append(dict(locator=label,unitIds=[u['id'],other['id'],md['id']],jsonBodyExactlyEqual=first==second,
          jsonBodyEqualAfterWhitespaceNormalization=' '.join(first.split())==' '.join(second.split()),
          chapterHeadings=[u['sourceTitle'],other['sourceTitle'],md['sourceTitle']],
          matchBasis='Same explicit chapter and paragraph labels' if label!='12.1' else 'Single unnumbered Markdown adoption paragraph aligned editorially to chapter 12 paragraph 1; original label unchanged'))
    write(OUT/'witness-crosswalk.json',dict(workId='work-l08-lbc',method='Structural alignment only. Text and proof apparatus remain edition-specific; differing wording is not automatically a doctrinal disagreement.',paragraphs=crosswalk))
    write(OUT/'inventory.json',dict(schemaVersion=1,date=DAY,documents=documents,units=units,storage='Exact answers, contents, proof markers and nested payloads are in immutable assets; pointers and payload hashes permit lossless retrieval.'))
    write(OUT/'proof-index.json',dict(date=DAY,scope='Structured proofs in the WCF, WLC and 1695 Baptist witness only. CC0 Markdown paragraph proof blocks remain exact unparsed strings; WSC has no proofs; Flavel references remain embedded.',references=proofs))
    write(OUT/'subject-map.json',dict(date=DAY,method='Reviewed chapter and question ranges; navigation links never assert equivalent doctrine.',assignments=[dict(unitId=u['id'],editionId=u['editionId'],subjects=u['subjects']) for u in units]))
    issues.extend([
      dict(documentKey='wcf',kind='edition-distinction',locator='23.3 and 31.2',detail='Acquired text retains historic magistrate/synod powers. It is not the current OPC American-revised form.'),
      dict(documentKey='wsc',kind='missing-apparatus',locator='Questions 1–107',detail='No Proofs or AnswerWithProofs fields. Do not synthesize proofs from WLC, Baptist or current OPC editions.'),
      dict(documentKey='lbc',kind='wrong-headings',locator='Chapters 20, 21, 25',detail='20 is wrongly titled Christian Liberty instead of Gospel; 21 has Consciencey typo; 25 repeats Civil Magistrate instead of Marriage. Parallel CC0 witnesses retain distinct titles. Originals not altered.'),
      dict(documentKey='flavel',kind='date-and-modernization',locator='Metadata.Year; title leaf of 1767 scan',detail='1688 is date of exercises, not scanned edition date. Digital wording is modernized (you/your); source/editor not established; do not identify it as a faithful 1767 transcription.'),
      dict(documentKey='lbc',kind='edition-scope',locator='Entire supplied JSON',detail='1677 composition/publication label and 1689 reception name retained; preface, signatories and baptism appendix are not separate acquired text units.'),
      dict(documentKey='baptist',kind='attribution',locator='Metadata.Authors',detail='Source attributes 1695 witness to William Collins. Do not silently retitle it Keach 1693 or merge with 1794 witnesses.')])
    issues.append(dict(documentKey='lbc-cc0-md',kind='unnumbered-paragraph',locator='Chapter 12',detail='The single adoption paragraph has no printed numeral in Markdown. Preserve unnumbered label; parallel JSON calls it paragraph 1.'))
    for u in units:
        if u.get('markedTextPointer'):
            marked=resolve(originals[u['documentKey']],u['markedTextPointer'])
            markers=set(map(int,re.findall(r'\[(\d+)\]',marked))); ids={p['Id'] for p in u['proofs']}
            if markers!=ids: issues.append(dict(documentKey=u['documentKey'],kind='proof-marker-mismatch',locator=u['id'],detail='Source marker IDs and attached proof IDs differ; preserved as supplied.',markers=sorted(markers),proofIds=sorted(ids)))
    for u in units:
        if u['documentKey']=='flavel' and u['sourceLabel']=='?': issues.append(dict(documentKey='flavel',kind='unnumbered-source-block',locator=u['pointer'],detail='Literal ? retained; no fabricated catechism number.',unitId=u['id']))
    for p in proofs:
        for n in p['normalizations']:
            if n['status']=='unresolved': issues.append(dict(documentKey=p['unitId'].split('-')[2],kind='proof-endpoint-or-syntax',locator=p['unitId'],detail=n['raw'],reason=n['reason']))
    write(OUT/'issues.json',dict(date=DAY,issues=issues))
    # Link-only continental/Congregational/Anglican witnesses; their actual edition boundaries are explicit.
    linked=[
      ('heidelberg','Heidelberg Catechism','palatinate-church','catechism','1563','iv.vi','Questions 1–129; German/English columns; pp. 307–355','Q80 absent in first 1563 edition; later wording and modern translations must remain distinct.'),
      ('belgic','Belgic Confession','netherlands-reformed-churches','confession','1561','iv.viii','Articles I–XXXVII; revised 1619 text, French/English presentation','1619 received form must not be described as an unchanged 1561 first edition. Retain article 36 magistrate wording and later revision history separately.'),
      ('dort','Canons of Dort','synod-dort','confession','1619','iv.xvi','Latin canons and English received text; heads I, II, III/IV, V','Source describes its English text as abridged, omitting rejection-of-errors sections; Latin and English holdings must not be counted as equivalent complete corpora.'),
      ('savoy','Savoy Declaration','savoy-assembly','confession','1658','v.i.i','TOC-listed Savoy section; body retrieval unsuccessful','Exact section coverage not verified. Reformed Standards modern digital text is excluded from Creeds.json Unlicense and was not acquired.'),
      ('articles','Thirty-Nine Articles','english-convocation','confession','1571','iv.xi','1571 English column, parallel 1563 Latin and 1801 American revision','Keep three columns separate. American changes at VIII, XXI and XXXVII are explicit; do not assign 1801 wording to 1571.')]
    holdings=[]
    for key,title,inst,genre,year,path,loc,note in linked:
        url='https://ccel.org/ccel/schaff/creeds3/creeds3.'+path+'.html'; evidence=[ev(url if key!='savoy' else 'https://ccel.org/ccel/schaff/creeds3/creeds3.toc.html',loc,note)]
        wid='work-l08-'+key; w=h.base_work(wid,title,'author-l08-'+inst,genre,'reformation' if int(year)<1600 else 'post-reformation',evidence,['historical-theology'])
        w.update(role='confessional-standard',collections=['standards'],creators=[dict(authorId='author-l08-'+inst,role='institution')],dates=[date('original-publication',year,'Historic document date; CCEL manifestation date unknown',evidence)],notes=[note]); save(w)
        eid=edition(key,wid,'CCEL Schaff compilation witness: '+loc,evidence,abridgment='abridged' if key=='dort' else 'unknown')
        save(h.link_asset('asset-l08-'+key+'-link',eid,'source-ccel',url,evidence))
        holdings.append(dict(workId=wid,editionId=eid,url=url,locator=loc,access='link-only',note=note))
    write(OUT/'linked-holdings.json',dict(holdings=holdings,existingExplanation=dict(workId='work-ursinus-catechism',url='https://ccel.org/ccel/ursinus/catechism/catechism.i.html',scope='Existing prolegomena excerpt only; not full Heidelberg commentary.')))
    summary=dict(date=DAY,counts={k:counts[k] for k in ['works','editions','assets','series']},rootWorks=11,acquiredFiles=9,linkedAdditionalWorks=5,
      digitalWitnesses=len(documents),indexedWitnessUnits=len(units),structuredProofReferences=len(proofs),unresolvedProofPieces=sum(n['status']=='unresolved' for p in proofs for n in p['normalizations']),
      flavelSubQuestions=sum('parentUnitId' in u for u in units),publications=0,scope='Bounded historic standards batch; completeness only against named supplied witnesses.')
    write(OUT/'summary.json',summary)
    write(OUT/'checkpoint.json',dict(status='bounded-batch-complete',jobsRunning=False,next=['Collate WSC proof-bearing historic edition; do not import a different apparatus silently.','Acquire independently identified historic continental and Savoy editions; index their articles/questions and proof apparatus.','Collate Flavel digital modernization against 1767 scan; resolve unnumbered blocks and source omissions.','Review every proof attachment and endpoint exception; endpoint-valid references may still contain source typos.','Expand qualifying explanations by Watson, Ursinus and A. A. Hodge with identified editions.']))
    run=dict(**{k:v for k,v in common('run','run-l08-confessional-standards-2026-10-05').items() if k not in ['editorialState','notes','reviews']},missionId='L08',status='complete',startedOn=DAY,completedOn=DAY,
      boundary=summary['scope'],sourceIds=['source-creeds-json','source-lwalen-lbcf','source-internet-archive','source-ccel'],inventory='content/library/reports/confessional-standards/inventory.json',checkpoint='content/library/reports/confessional-standards/checkpoint.json',counts=dict(summary['counts'],reviewedWorks=0,publishedWorks=0),
      gaps=['Five additional standards are source links only.','WSC proofs missing in acquired witness; Flavel numbering/modernization unresolved.','No full print collation or public publication.'],reportPath='content/library/reports/confessional-standards/REPORT.md')
    save(run); write(OUT/'record-manifest.json',dict(recordIds=records)); print(json.dumps(summary,indent=2))

if __name__=='__main__': build()
