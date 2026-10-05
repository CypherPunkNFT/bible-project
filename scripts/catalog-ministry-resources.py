"""L12 offline bibliography and section catalog. Reuses existing canonical identities."""
import hashlib
import importlib.util
from pathlib import Path
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];LIB=SITE/'content/library';OUT=LIB/'reports/ministry-resources';DAY='2026-10-05'
spec=importlib.util.spec_from_file_location('l06',SITE/'scripts/catalog-scripture-studies.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
read=h.read;write=h.write;ev=h.ev;common=h.common
URL={
 'spurgeon-lectures':'https://archive.org/details/lecturestomystud00spurrich',
 'perkins':'https://banneroftruth.org/us/store/church-ministry/the-art-of-prophesying/?attribute_pa_binding=paperback',
 'perkins-application':'https://banneroftruth.org/uk/resources/book-excerpts/2019/how-to-use-and-apply-doctrines/',
 'owen-churches':'https://www.ccel.org/ccel/owen/evangelicalchurches.html',
 'owen-worship':'https://www.ccel.org/ccel/owen/worship.html',
 'carey':'https://www.gutenberg.org/cache/epub/11449/pg11449-images.html',
 'packer':'https://ivpress.org/evangelism-and-the-sovereignty-of-god',
 'piper-brothers':'https://www.desiringgod.org/books/brothers-we-are-not-professionals',
 'piper-nations':'https://www.desiringgod.org/books/let-the-nations-be-glad',
 'piper-groups':'https://www.desiringgod.org/messages/small-group-life-in-the-power-of-gods-promises',
 'ryle-parents':'https://www.monergism.com/duties-parents'}
TYPES={
 'theological-principle':'A claim the author grounds in Scripture or doctrine as binding or enduring; record the argument and confessional differences.',
 'historical-practice':'A description of a dated institution, custom, event or implementation; description alone does not establish a universal command.',
 'practical-advice':'A prudential recommendation about how to carry out ministry; distinguish the proposed method from its theological purpose.'}
TOPICS=['sermon-preparation','pastoral-ministry','worship','sacraments','church-government','discipleship','evangelism','missions']
AUDIENCES=['pastors','elders','small-group-leaders','families','individual-christians']

def evidence(url,loc,note='Bibliographic identity and stated locator checked; whole-text review not implied.'):
    return [ev(url,loc,note)]
def date(event,value,label,e):return dict(event=event,value=value,precision='day' if len(value)==10 else 'year',label=label,evidence=e)

def build():
    registry=read(LIB/'authors.json')
    all_authors=registry['authors'][:]
    for p in (LIB/'registry-extensions').glob('*.json'):all_authors+=read(p)['authors']
    if not any(a['id']=='author-william-carey' for a in all_authors):
        e=evidence(URL['carey'],'1792 title; introduction and sections I, V','Primary missionary argument and identity.')+evidence('https://www.sbts.edu/news/patterson-mohler-calvinism-shouldnt-divide-southern-baptists/','Mohler discussion of Carey and Calvinist missions','Institutional account supports theological placement; not endorsement of every institutional statement.')
        write(LIB/'registry-extensions/ministry-authors.json',{'$schema':'../schema.json','schemaVersion':1,'kind':'author-registry','updated':DAY,'authors':[dict(id='author-william-carey',entityType='person',name='William Carey',aliases=[],cohort='eighteenth-century',traditions=['baptist','calvinist-evangelical'],eligibility='eligible',rationale='Particular Baptist missionary in the Calvinist evangelical tradition; selected work joins divine agency to the church’s obligation to use means.',receptionBasis='Primary Enquiry and Southern Seminary institutional historical assessment.',evidence=e,distinctives=[],unresolved=['Historical demographic claims and colonial-era vocabulary require contextual review; no blanket approval of all later editions.'],review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Initial work-scoped bibliographic and theological screening.'))]})
    sources=read(LIB/'sources.json')
    if not any(s['id']=='source-intervarsity-press' for s in sources['sources']):
        sources['sources'].append(dict(id='source-intervarsity-press',name='InterVarsity Press',url='https://ivpress.org/',role='publisher',automation='manual-only',acquisitionNote='Bibliographic and contents links only. Modern book not acquired or licensed for republication.',evidence=evidence(URL['packer'],'Publisher title, edition, ISBN and contents'),reviewedOn=DAY));write(LIB/'sources.json',sources)
    roots=[];sections=[];created=[]
    def put(folder,obj):write(LIB/'catalog'/folder/(obj['id']+'.json'),obj);created.append((folder,obj['id']))
    def add(key,title,author,genre,era,subjects,audiences,source,label,publisher=None,edition_date=None,note='',original_date=None):
        wid='work-l12-'+key;eid='edition-l12-'+key;e=evidence(URL[key],label,note or 'Identified source; no full-text acquisition or whole-body review implied.')
        w=h.base_work(wid,title,author,genre,era,e,subjects);w.update(collections=['ministry'],audiences=audiences,notes=[note] if note else [])
        if original_date:w['dates']=[date('original-publication',original_date,'Source original publication label',e)]
        ed=dict(**common('edition',eid),workId=wid,label=label,languages=['en'],contributors=[],publisher=publisher,dates=[date('edition-publication',edition_date,label,e)] if edition_date else [],abridgment='unknown',modernization='unknown',evidence=e)
        put('works',w);put('editions',ed)
        asset=h.link_asset('asset-l12-'+key+'-link',eid,source,URL[key],e)
        if key!='spurgeon-lectures':put('assets',asset)
        roots.append(dict(key=key,workId=wid,editionId=eid,title=title,url=URL[key],sourceId=source,acquisition='acquired-scan-and-host-ocr' if key=='spurgeon-lectures' else 'link-only',reviewScope='Bibliography and selected locators; see assessments for body review',notes=note))
        return wid,eid
    def section(parent,eid,key,title,author,genre,era,subjects,audiences,loc,url,kind,scope='contents-only',page=None,pdf=None):
        wid='work-l12-'+key;w=h.base_work(wid,title,author,genre,era,evidence(url,loc),subjects)
        w.update(collections=['ministry'],audiences=audiences,related=[dict(relation='is-part-of',targetId=parent,locator=loc)])
        put('works',w);sections.append(dict(workId=wid,parentWorkId=parent,editionId=eid,title=title,locator=loc,url=url,primaryTreatment=kind,classificationEvidence=scope,printedStartPage=page,pdfStartPage=pdf,fullSectionReviewed=False));return wid
    pastors=['pastors','elders','ministry-leaders'];general=['general','ministry-leaders'];family=['families','general']
    sp,sped=add('spurgeon-lectures','Lectures to My Students: First Series','author-charles-spurgeon','collected-works','nineteenth-century',['preaching','pastoral-care'],pastors,'source-internet-archive','Sheldon & Company, New York; host catalog dates 1875','Sheldon & Company','1875','Title page is undated; 1875 comes from library metadata. Thirteen selected college addresses, not a dated delivery sequence. Other series are not included.')
    lecturedata=[(11,'The Minister’s Self-watch','theological-principle'),(35,'The Call to the Ministry','theological-principle'),(66,'The Preacher’s Private Prayer','theological-principle'),(84,'Our Public Prayer','practical-advice'),(112,'Sermons—Their Matter','theological-principle'),(130,'On the Choice of a Text','practical-advice'),(156,'On Spiritualizing','practical-advice'),(178,'On the Voice','practical-advice'),(205,'Attention','practical-advice'),(227,'The Faculty of Impromptu Speech','practical-advice'),(249,'The Minister’s Fainting Fits','practical-advice'),(268,'The Minister’s Ordinary Conversation','practical-advice'),(282,'To Workers with Slender Apparatus','practical-advice')]
    ids=[]
    for i,(page,title,kind) in enumerate(lecturedata,1):ids.append(section(sp,sped,f'spurgeon-lecture-{i:02}',title,'author-charles-spurgeon','lecture','nineteenth-century',['preaching','pastoral-care'],pastors,f'Lecture {i}; printed pp. {page}-{lecturedata[i][0]-1 if i<len(lecturedata) else 297}; PDF p. {page+6}',URL['spurgeon-lectures'],kind,'contents-and-opening-checked',page,page+6))
    series=dict(**common('series','series-l12-spurgeon-first'),title='Lectures to My Students: First Series',authorIds=['author-charles-spurgeon'],members=[dict(workId=wid,position=i,originalLabel=f'Lecture {i}') for i,wid in enumerate(ids,1)],expectedCount=13,completeness='complete',inventoryEvidence=evidence(URL['spurgeon-lectures'],'Printed contents pp. 3-4, PDF pp. 9-10','Complete thirteen-lecture inventory of this first-series witness only.'),missing=[])
    put('series',series)
    for f in read(OUT/'acquisition-manifest.json')['files']:
        if f['evidenceOnly']:continue
        raw=(SOURCES/f['relativePath']).read_bytes();assert hashlib.sha256(raw).hexdigest()==f['sha256']
        a=h.link_asset(f['assetId'],sped,'source-internet-archive',f['url'],evidence(URL['spurgeon-lectures'],'Host inventory and identified historic edition'))
        a.update(format=f['format'],mediaKind='scan' if f['format']=='pdf' else 'text',acquisitionStatus='downloaded',storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'),finalUrl=f['finalUrl'])
        a['rights'].update(category='public-domain',jurisdiction='United States',unresolved=['Public packaging and OCR proofreading remain separate; no worldwide clearance.'])
        a['rights']['actions']['download']='allowed';a['rights']['evidence']+=evidence('https://www.copyright.gov/circs/circ15a.pdf','Historic published works; identified 1875 edition')
        a['processing']['note']='Original host scan or host-generated OCR, unchanged. No new OCR or search index created.'
        a['quality']['note']='Title and contents visually inspected; all thirteen opening pages located. Host OCR misreads several page numbers and words.';put('assets',a)
    pk,pke=add('perkins','The Art of Prophesying and The Calling of the Ministry','author-william-perkins','collected-works','post-reformation',['preaching','pastoral-care'],pastors,'source-banner-of-truth','Banner of Truth, 2021; ISBN 9781800401037','Banner of Truth','2021-09-10','Two historical works in a modern edition. Publisher lists original dates 1592 and 1605; modernization explicitly noted in its chapter-7 excerpt. Modern wording is not cleared for reuse.')
    for part,title,original,chapters in [
      ('art','The Art of Prophesying','1592',[(7,'The Art of Prophecy'),(9,'The Word of God'),(12,'The Contents of Scripture'),(22,'The Interpretation of Scripture'),(29,'Principles for Expounding Scripture'),(46,'Rightly Handling the Word of God'),(52,'Use and Application'),(61,'Varieties of Application'),(66,'The Use of the Memory'),(68,'Preaching the Word')]),
      ('calling','The Calling of the Ministry','1605',[(81,'The Titles of True Ministers'),(89,'The Scarcity of True Ministers'),(97,'The Office of True Ministers'),(104,'The Blessing of the Work of True Ministers'),(110,'The Commission and Authority of True Ministers'),(121,'The Vision of God'),(150,'Divine Consolation'),(168,'Renewed and Recommissioned')])]:
        parent=section(pk,pke,'perkins-'+part,title,'author-william-perkins','treatise','post-reformation',['preaching','pastoral-care'],pastors,'Publisher contents, named component',URL['perkins'],'theological-principle')
        pw=read(LIB/'catalog/works'/(parent+'.json'));pw['dates']=[date('original-publication',original,'Publisher’s historical date for this component',pw['evidence'])];write(LIB/'catalog/works'/(parent+'.json'),pw)
        for i,(page,title) in enumerate(chapters,1):
            label=str(i) if part=='art' or i<=5 else str(i-5)
            section(parent,pke,f'perkins-{part}-{i:02}',title,'author-william-perkins','treatise','post-reformation',['preaching'],pastors,f'{part.title()}, '+('second sequence, ' if part=='calling' and i>5 else '')+f'chapter {label}, p. {page}',URL['perkins'],'practical-advice' if part=='art' and i>=7 else 'theological-principle',page=page)
    add('owen-churches','Inquiry into the Original, Nature, Institution, Power, Order, and Communion of Evangelical Churches','author-john-owen','treatise','post-reformation',['church-government','church-discipline'],pastors,'source-ccel','CCEL digital presentation; underlying edition not established in this batch',note='Congregational ecclesiology. Whole contents inventory and posthumous publication history require follow-up; CCEL identifies the Congregational subject; prefatory material was encountered, but its authorship is not established. No chapter-level argument is attributed from that preface.')
    add('owen-worship','A Brief Instruction in the Worship of God and Discipline of the Churches of the New Testament','author-john-owen','catechism','post-reformation',['worship','church-government','discipleship'],pastors+['general'],'source-ccel','CCEL digital presentation; title page p. 445',note='Individual author’s catechetical explanation, not a corporate confessional standard. Question sequence not fully inventoried in this batch.')
    ca,cae=add('carey','An Enquiry into the Obligations of Christians to Use Means for the Conversion of the Heathens','author-william-carey','treatise','eighteenth-century',['missions','evangelism'],['pastors','elders','ministry-leaders','general'],'source-gutenberg','Project Gutenberg ebook 11449; historical title dates 1792; digital release 2004-03-01',note='Five sections; historical title retained. Tables describe Carey’s world, not present demographics. Catalog and HTML display different digital update dates; no fixed modern revision date asserted.',original_date='1792')
    for i,(title,kind) in enumerate([('Continuing obligation of the commission','theological-principle'),('Earlier missionary undertakings','historical-practice'),('Religious state of the world','historical-practice'),('Practicability of further missionary work','practical-advice'),('Duty of Christians and means to be used','practical-advice')],1):section(ca,cae,f'carey-{i:02}',title,'author-william-carey','treatise','eighteenth-century',['missions'],general,f'Section {i}; editorial short label, original heading retained at source',URL['carey'],kind,'selected-body-checked' if i in [1,4,5] else 'section-heading')
    pa,pae=add('packer','Evangelism and the Sovereignty of God','author-j-i-packer','treatise','twentieth-century',['evangelism','divine-decrees'],general+['pastors'],'source-intervarsity-press','IVP revised edition, 2012; ISBN 9780830837991','InterVarsity Press','2012-01-16',note='Publisher bibliography and four chapter headings only. Modern text and added foreword not acquired.')
    for i,title in enumerate(['Divine Sovereignty','Divine Sovereignty and Human Responsibility','Evangelism','Divine Sovereignty and Evangelism'],1):section(pa,pae,f'packer-{i:02}',title,'author-j-i-packer','treatise','twentieth-century',['evangelism'],general,f'Publisher contents, chapter {i}; page unknown',URL['packer'],'theological-principle')
    add('piper-brothers','Brothers, We Are Not Professionals: A Plea to Pastors for Radical Ministry','author-john-piper','treatise','twenty-first-century',['pastoral-care','ministry'],pastors,'source-desiring-god','2013 revised edition','B&H','2013',note='Official book source; whole chapter inventory and comparison with first edition remain open. Do not merge with the multi-author Still Not Professionals volume.')
    add('piper-nations','Let the Nations Be Glad! The Supremacy of God in Missions','author-john-piper','treatise','twenty-first-century',['missions','worship'],general+['pastors'],'source-desiring-god','2022 edition on official book page','Baker Books','2022',note='Official book source; edition date is not first publication. No full text or chapter inventory acquired.')
    gr,gre=add('piper-groups','Small Group Life in the Power of God’s Promises','author-john-piper','sermon','twentieth-century',['discipleship','pastoral-care'],general+['elders'],'source-desiring-god','Official sermon text and audio destination, September 14, 1997',note='Selected written sections inspected. Bethlehem’s small-group implementation is distinguished from the biblical duty of mutual encouragement. Audio not listened to; duration unknown.')
    w=read(LIB/'catalog/works'/(gr+'.json'));w['dates']=[date('delivery','1997-09-14','Official message date',w['evidence'])];w['passages']=[h.passage(['Hebrews',13,1,13,6],'main-text','Official message heading')];write(LIB/'catalog/works'/(gr+'.json'),w)
    ry,rye=add('ryle-parents','The Duties of Parents','author-j-c-ryle','treatise','nineteenth-century',['family-worship','discipleship','parenting'],family,'source-monergism','Monergism HTML presentation; underlying printed edition not established',note='Seventeen numbered counsels visible; four selected sections indexed. Historical discipline practices and the author’s interpretation of Proverbs 22:6 need explicit contextual review; no outcome guarantee supplied by this catalog.')
    for num,title in [(5,'Knowledge of the Bible'),(6,'A habit of prayer'),(14,'Parents’ example'),(17,'Prayer for God’s blessing')]:section(ry,rye,f'ryle-parents-{num:02}',title,'author-j-c-ryle','treatise','nineteenth-century',['family-worship','discipleship'],family,f'Counsel {num}; editorial short label',URL['ryle-parents'],'practical-advice','selected-body-checked')
    for num,roman,title,subjects in [(3,'iv','Teachers and Ministers of the Church',['church-government','ministry']),(14,'xv','Of the Sacraments',['means-of-grace']),(16,'xvii','Paedobaptism',['baptism']),(17,'xviii','The Lord’s Supper',['lords-supper'])]:
        section('work-calvin-institutes','edition-calvin-institutes',f'calvin-iv-{num:02}',title,'author-john-calvin','treatise','reformation',subjects,pastors+['general'],f'Institutes IV.{num}; Beveridge translation; whole chapter link, selected paragraphs only','https://www.ccel.org/ccel/calvin/institutes.vi.'+roman+'.html','theological-principle','selected-body-checked')
    reused=[]
    for prefix,nums in [('wcf',[21,27,28,29,30,31]),('lbc',[22,26,28,29,30])]:
        for n in nums:
            wid=f'work-l08-{prefix}-chapter-{n:03}';w=read(LIB/'catalog/works'/(wid+'.json'));reused.append(dict(workId=wid,title=w['title'],locator=f'{prefix.upper()} chapter {n}',reason='Existing acquired standard; preserves its own wording and polity.'))
    for wid in ['work-l08-wlc-question-158','work-l08-wlc-question-159','work-l08-wlc-question-160','work-spurgeon-sermon-1292','work-spurgeon-sermon-2423','work-l03-whitefield-works-5-04','work-l10-zwemer-lectures']:
        w=read(LIB/'catalog/works'/(wid+'.json'));reused.append(dict(workId=wid,title=w['title'],locator=w['evidence'][0]['locator'],reason='Existing source reused without creating duplicate work/edition or acquisition totals.'))
    counts={folder:sum(1 for f,_ in created if f==folder) for folder in ['works','editions','assets','series']};counts.update(reviewedWorks=0,publishedWorks=0)
    write(OUT/'inventory.json',dict(date=DAY,roots=roots,sections=sections,reused=reused,counts=counts,classificationDefinitions=TYPES,coverageScope='Selected bibliographies; complete first-series Spurgeon contents and selected other contents, not an exhaustive ministry corpus.'))
    write(OUT/'checkpoint.json',dict(date=DAY,status='bounded-batch-complete',next=[
      'Collate all Spurgeon lecture pages and expand second/third series as distinct volumes; never infer delivery dates from the 1875 catalog date.',
      'Identify historical editions of both Perkins works and Owen’s church/worship treatises; inventory their full components and publication history before acquisition.',
      'Retrieve Carey via a permitted Gutenberg harvest/mirror route or identified historic scan. Ordinary-site automated acquisition was not used.',
      'Expand modern qualified polity and discipleship voices; inspect complete Packer/Piper books under appropriate rights before chapter argument summaries.',
      'Add qualified modern safeguarding, conflict resolution and church-administration resources; historic advice is not a complete operational manual.',
      'Review Ryle’s discipline and promise interpretation; retain disagreement rather than silently modernizing.',
      'Public integration remains a separate mission; no media transcription, full-text indexing or publication performed.'
    ]))
    run=dict(**{'$schema':'../../schema.json'},schemaVersion=1,kind='run',id='run-l12-ministry-resources-2026-10-05',missionId='L12',status='complete',startedOn=DAY,completedOn=DAY,boundary='Eight ministry areas; selected works, audience maps, treatment distinctions and one acquired first-series volume.',sourceIds=sorted({r['sourceId'] for r in roots}),inventory='content/library/reports/ministry-resources/inventory.json',checkpoint='content/library/reports/ministry-resources/checkpoint.json',counts=counts,gaps=['Modern books remain authorized links.','Only selected bodies reviewed; OCR and historic practice require contextual checks.','No public publication or full-text index.'],reportPath='content/library/reports/ministry-resources/REPORT.md');put('runs',run)
    print(counts,'root holdings',len(roots),'sections',len(sections),'reused',len(reused))

if __name__=='__main__':build()
