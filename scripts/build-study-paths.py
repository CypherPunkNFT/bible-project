"""Build L14 annotated paths from existing catalog identities. No network or acquisition."""
import hashlib
import importlib.util
import json
from pathlib import Path
from collections import Counter
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/study-paths'
DAY='2026-10-05'
spec=importlib.util.spec_from_file_location('catalog_helpers',SITE/'scripts/catalog-scripture-studies.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
read,write=h.read,h.write


def build():
    resources={};inputs={}
    def load(path):
        inputs[path.relative_to(SITE).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
        return read(path)
    authors={a['id']:a for a in load(LIB/'authors.json')['authors']}
    for p in sorted((LIB/'registry-extensions').glob('*.json')):
        authors.update({a['id']:a for a in load(p)['authors']})
    canon=load(SITE/'content/apologetics/scripture-index.json')

    def resource(key,wid,aid,url,assignment,review,basis,limit,pages=None,prior=None):
        w=load(LIB/'catalog/works'/f'{wid}.json')
        a=load(LIB/'catalog/assets'/f'{aid}.json')
        ed=load(LIB/'catalog/editions'/f"{a['editionId']}.json")
        assert w['role']=='core-teaching'
        assert all(authors[x['authorId']]['eligibility']=='eligible' for x in w['creators'])
        # Resolve edition ownership through real containment, never title similarity.
        def ancestors(work,seen=None):
            seen=set() if seen is None else seen
            if work['id'] in seen:return seen
            seen.add(work['id'])
            for rel in work.get('related',[]):
                if rel['relation']=='is-part-of':ancestors(load(LIB/'catalog/works'/f"{rel['targetId']}.json"),seen)
            return seen
        assert ed['workId'] in ancestors(w),(wid,ed['id'])
        r=dict(id=key,workId=wid,editionId=ed['id'],assetId=aid,sourceId=a['sourceId'],
            title=w['title'],authors=[authors[x['authorId']]['name'] for x in w['creators']],
            genre=w['genre'],role=w['role'],sourceUrl=url,assignment=assignment,
            editionLabel=ed['label'],reviewedSpan=review,selectionBasis=basis,limitations=limit,
            verification='source-span-checked-for-this-recommendation',checkedOn=DAY,
            reviewType='AI-assisted; not external theological approval or whole-work certification',
            access='Read at source; this path does not redistribute the work',
            catalogEditorialState=w['editorialState'],sourceMainTexts=w.get('passages',[]),
            rightsSnapshot=dict(category=a['rights']['category'],actions=a['rights']['actions']),
            priorEvidence=prior or [],pdfPages=pages or [],rawSha256=None,reviewedTextSha256=None)
        for path in r['priorEvidence']:load(SITE/path)
        if pages:
            import pymupdf
            raw=(SOURCES/a['relativePath']).read_bytes()
            assert hashlib.sha256(raw).hexdigest()==a['sha256']
            doc=pymupdf.open(stream=raw,filetype='pdf')
            assert all(1<=p<=len(doc) for p in pages)
            txt='\n'.join(doc[p-1].get_text() for p in pages)
            r.update(rawSha256=a['sha256'],reviewedTextSha256=hashlib.sha256(txt.encode()).hexdigest())
        resources[key]=r
        return key

    def sermon(number,pages,basis,limit='',prior=None):
        return resource('sermon-'+str(number),f'work-spurgeon-sermon-{number:04}',
            f'asset-spurgeon-gems-chs{number}',f'https://www.spurgeongems.org/sermon/chs{number}.pdf#page={pages[0]}',
            'Sermon excerpt, PDF '+('page '+str(pages[0]) if len(pages)==1 else f'pages {pages[0]}–{pages[-1]}'),
            'The assigned PDF pages; original file hash checked',basis,
            limit or 'The linked file contains the whole sermon; the assigned and assessed excerpt is narrower.',pages,prior)

    sermon(126,[4],'Explains justification as a declarative act, distinguishing it from pardon.',
        'The main text is Romans 3:24. Connections to other passages are editorial doctrinal companions.',
        ['content/library/reports/doctrinal-studies/sermon-pairing-reviews.json'])
    sermon(460,[1,2],'Presents repentance and faith as Christ’s summons, including the troubled hearer’s warrant to trust him.',
        'Main text Mark 1:15. Connections to other biblical books are thematic companions, not exposition of those books.')
    sermon(310,[2,3],'Explains Christ’s sinlessness and representative bearing of sin.',
        'Selected argument, not endorsement of every historical analogy in the sermon.',
        ['content/library/reports/doctrinal-studies/sermon-pairing-reviews.json'])
    sermon(15,[1,2],'Shows what Spurgeon affirms about divine authorship and the response he seeks from Christian hearers.',
        'He explicitly declines to develop external proofs here. His hostile description of unbelievers is not the conversational model proposed by this path.')
    sermon(1067,[5],'Distinguishes helpful natural illustrations from evidence sufficient to establish resurrection.',
        'This excerpt does not prove that Jesus rose. Elsewhere the sermon includes Spurgeon’s disputed millennial interpretation, not adopted by this path.')
    sermon(1653,[1,2],'Explains why bodily resurrection belongs to the gospel and cannot be reduced to a metaphor.',
        'A nineteenth-century theological sermon, not an additional first-century eyewitness.')
    sermon(1148,[1,2],'Explains walking in truth and a pastor’s concern for spiritual children.',
        'Its main text is 3 John 1:4. The pairing with 1 Timothy is about ministry character, not identical passage exposition.',
        ['content/library/reports/sermon-coverage/assessments.json'])
    sermon(1503,[1,2],'Distinguishes understanding Scripture from merely passing one’s eyes over its words.',
        'Main text Matthew 12:3–7. Historical polemical descriptions are the preacher’s, not independent research about other traditions.')
    sermon(1292,[1,2],'Joins personal Christian character to purposeful witness and service.',
        'Main text Proverbs 11:30; this numbered sermon is distinct from the later Soul Winner anthology.')
    resource('sermon-groups','work-l12-piper-groups','asset-l12-piper-groups-link',
        'https://www.desiringgod.org/messages/small-group-life-in-the-power-of-gods-promises',
        'Written sermon sections on mutual encouragement and the dynamics of group ministry',
        'Hebrews 3:12–13 and 10:23–25 discussion; connection to the 1997 group program',
        'Connects Christian promises with concrete mutual care.',
        'Main text Hebrews 13:1–6. His Bethlehem group structure is an application, not a format prescribed by Hebrews. Audio not reviewed.',
        prior=['content/library/reports/ministry-resources/treatments.json'])
    resource('sermon-ruth','work-l04-piper-ruth-1984-01','asset-l04-piper-ruth-1984-01-html',
        'https://www.desiringgod.org/messages/ruth-sweet-and-bitter-providence',
        'Written sermon, focusing on Naomi’s misery, Ruth’s faithfulness and the signs of mercy',
        'Opening purpose and sections The Work of God in the Darkest of Times through Ruth’s Faithfulness',
        'Reads grief and faithful companionship within the unfolding Ruth narrative.',
        'The recommendation rests on written sections, not audio playback. Do not use its interpretation of Naomi to diagnose a particular sufferer’s guilt or promise an earthly happy ending.')
    resource('sermon-newton','work-l03-newton-olney-20','asset-l03-worksrevjohnne02newt-pdf',
        'https://archive.org/details/worksrevjohnne02newt/page/n596/mode/2up',
        'Of the Assurance of Faith, opening and first proposition; printed pp. 583–586, PDF pp. 597–600',
        'Assigned opening pages and proposition I',
        'Distinguishes genuine but weak faith from the fuller comfort of assurance.',
        '1810 posthumous collected witness; individual delivery date unknown. Source main text 1 John 5:19; assigned Scripture includes its broader context.',[597,598,599,600])
    resource('sermon-whitefield','work-l03-whitefield-works-5-04','asset-l03-worksofreverendg05whit-pdf',
        'https://archive.org/details/worksofreverendg05whit/page/n61/mode/2up',
        'The Great Duty of Family-Religion, opening; printed pp. 52–54, PDF pp. 62–64',
        'Assigned opening pages, outline and instruction/prayer argument',
        'Connects public profession with responsibility for the spiritual life of a household.',
        '1772 posthumous printed sermon. Its household-governor language and severe responsibility rhetoric require historical context; parents cannot manufacture another person’s faith.',[62,63,64])

    for key,section,title,basis in [
        ('reading-grace','iv','God Justifieth the Ungodly','Addresses the fear that one must become worthy before coming to Christ.'),
        ('reading-repentance','xvi','Repentance Must Go With Forgiveness','Explains why forgiveness and turning from sin belong together within grace.'),
        ('reading-new-life','xiv','Regeneration and the Holy Spirit','Holds together the Spirit’s work and the call to trust Christ in John 3.'),
        ('reading-perseverance','xx','Why Saints Persevere','Locates continuing hope in God’s faithfulness and fellowship with Christ.')]:
        resource(key,'work-spurgeon-grace','asset-spurgeon-grace',f'https://ccel.org/ccel/spurgeon/grace/grace.{section}.html',
            'All of Grace, complete chapter '+title,'Named chapter body at CCEL',basis,
            'Historic English digital witness; no full-text copy or new critical edition is supplied.')
    resource('reading-hodge','work-l07-hodge-v3-03-s02','asset-hodge-systematic-3',
        'https://ccel.org/ccel/hodge/theology3/theology3.iii.iii.ii.html',
        'Systematic Theology III, chapter XVII, section 2; printed pp. 118–121',
        'Opening argument on the forensic meaning of justification',
        'Provides the precise doctrinal distinction needed after hearing the accessible courtroom explanation.',
        'Only the assigned opening is assessed. Hodge’s descriptions of opponents are attributed polemic.',
        prior=['content/library/reports/doctrinal-studies/assessments.json'])
    resource('reading-owen-substitution','work-l07-owen-18-s07','asset-owen-justification',
        'https://ccel.org/ccel/owen/just/just.xxii.vii.html',
        'Justification, chapter XVIII, 2 Corinthians 5:21 treatment; printed pp. 347–351',
        'Assigned discussion of imputation and Christ’s sinlessness',
        'Moves from the sermon’s account to a sustained explanation of Paul’s wording.',
        'Owen’s argument is retained as his interpretation; later footnotes have distinct authorship.',
        prior=['content/library/reports/doctrinal-studies/assessments.json'])
    resource('reading-owen-james','work-l07-owen-20','asset-owen-justification',
        'https://ccel.org/ccel/owen/just/just.xxiv.html',
        'Justification, chapter XX; printed pp. 392–397 on James 2',
        'Selected body argument contrasting acceptance before God and evidence of living faith',
        'Tests whether a confession of grace can be detached from obedience.',
        'This is Owen’s reconciliation of Paul and James, not a claim that every tradition agrees.',
        prior=['content/library/reports/doctrinal-studies/assessments.json'])
    resource('reading-inspiration','work-l07-aa-hodge-04','asset-l07-aa-hodge-pdf',
        'https://archive.org/details/outlinesoftheolo00hodguoft/page/n73/mode/2up',
        'Outlines of Theology, 1877, chapter IV, questions 1–5; printed pp. 70–72, PDF pp. 74–76',
        'Definitions and distinctions in questions 1–5',
        'Distinguishes inspiration, revelation and spiritual illumination before debating the claim.',
        'A doctrinal definition, not by itself independent proof of scriptural authority.',[74,75,76])
    resource('reading-miracles','work-alexander-evidences','asset-alexander-evidences',
        'https://ccel.org/ccel/alexander_a/evidences/evidences.ii.vi.html',
        'Evidences of the Christian Religion, complete chapter V; printed pp. 68–73',
        'Chapter V body, including the stated limit that it argues reasonableness rather than necessity',
        'Separates a miracle’s possibility under theism from a claim that one occurred.',
        'The argument assumes God’s existence; its historical generalizations about peoples and religions are not endorsed or independently verified here.')
    resource('reading-resurrection','work-alexander-evidences','asset-alexander-evidences',
        'https://ccel.org/ccel/alexander_a/evidences/evidences.ii.viii.html',
        'Chapter VII, discussion of Paul’s testimony; printed pp. 109–111',
        'Passage beginning with Paul as a former opponent and proceeding through his appeal to witnesses and early Christian belief',
        'Offers a historical argument to examine alongside Paul’s actual words.',
        'Paul’s report of many witnesses is one surviving report, not hundreds of independent documents. General early Christian belief is not identical with eyewitness testimony. The nearby Josephus footnote and current textual scholarship are outside this assessment.')
    resource('reading-discouragement','work-l12-spurgeon-lecture-11','asset-l12-spurgeon-lectures-pdf',
        'https://archive.org/details/lecturestomystud00spurrich/page/n254/mode/2up',
        'The Minister’s Fainting Fits, printed pp. 249–251; PDF pp. 255–257',
        'Opening reflection on discouragement and bodily weakness',
        'Shows that a fruitful minister can acknowledge weakness and sorrow.',
        'Written to ministers; application to other readers is editorial. Historical physiology is not present-day clinical guidance.',[255,256,257])
    resource('reading-family','work-l12-ryle-parents','asset-l12-ryle-parents-link',
        'https://www.monergism.com/duties-parents',
        'The Duties of Parents, counsels V and VI on Scripture and prayer',
        'Counsel V and the opening practical argument of VI; also the source’s admission that parents cannot convert children',
        'Turns a general call to household care into Scripture reading and prayer.',
        'Underlying print impression unestablished. These selected counsels do not endorse every disciplinary practice elsewhere in the work.',
        prior=['content/library/reports/ministry-resources/treatments.json'])
    resource('reading-character','work-l12-spurgeon-lecture-01','asset-l12-spurgeon-lectures-pdf',
        'https://archive.org/details/lecturestomystud00spurrich/page/n16/mode/2up',
        'The Minister’s Self-watch, printed pp. 11–12; PDF pp. 17–18',
        'Opening explanation of the minister’s own spiritual life',
        'Places character before technique and treats the teacher’s life as part of ministry.',
        'Initial college address excerpt; neither a credential nor a full account of ordination.',[17,18])
    resource('reading-application','work-l12-perkins-art-07','asset-l12-perkins-link',
        'https://banneroftruth.org/uk/resources/book-excerpts/2019/how-to-use-and-apply-doctrines/',
        'The Art of Prophesying, chapter 7; complete authorized publisher excerpt on use and application',
        'Application paragraphs, including law, gospel and the circumstances of hearers',
        'Gives a concrete way to move from an explained passage to an appropriate application.',
        'Modernized excerpt, not the full chapter or a reusable transcription of the 1592 text.',
        prior=['content/library/reports/ministry-resources/treatments.json'])
    resource('reading-mission','work-l12-carey','asset-l12-carey-link',
        'https://www.gutenberg.org/cache/epub/11449/pg11449-images.html',
        'An Enquiry, sections I and V on the continuing commission and means of mission',
        'Continuing-commission argument and prayer/cooperation/support proposals',
        'Connects theological obligation to deliberate, shared action.',
        '1792 context. Distinguish the commission from Carey’s proposed organization; historical demographics and colonial assumptions are not current mission research.',
        prior=['content/library/reports/ministry-resources/treatments.json'])

    def scripture(book,ch,start,end,why):
        b=next(b for b in canon['books'] if b['name']==book)
        assert 1<=ch<=len(b['chapters']) and 1<=start<=end<=b['chapters'][ch-1]
        return dict(reference=f'{book} {ch}:{start}–{end}',bookCode=b['code'],chapter=ch,
            firstVerse=start,lastVerse=end,start=b['num']*1000000+ch*1000+start,
            end=b['num']*1000000+ch*1000+end,
            url=f"https://bibleproject.io/read/kjv/{b['code']}/{ch}?v={start}",
            why=why,selection='editorial-assignment',endpointVerification='existing KJV canon index')
    def step(title,purpose,refs,sermonKey,sermonWhy,readingKey,readingWhy,question,practice):
        return dict(title=title,purpose=purpose,scripture=[scripture(*r) for r in refs],
            sermon=dict(resourceId=sermonKey,why=sermonWhy),
            reading=dict(resourceId=readingKey,why=readingWhy),reflection=question,practice=practice)
    paths=[
      dict(id='new-believers',title='Grace and the beginning of Christian life',audience='New believers and Christians revisiting the foundations',
        purpose='Learn to receive salvation as grace, respond in repentance and faith, and grow with other believers.',
        preparation='No prior theological reading required. Work through difficult words with a trusted Christian or church leader.',
        completion='Explain the difference between receiving Christ and earning acceptance, then name one practice of mutual Christian care.',
        stages=[
          step('Receive grace','Begin with what God gives before asking what you must achieve.',
            [('Romans',3,21,31,'Places faith, Christ’s redemption and boasting within Paul’s argument.')],
            'sermon-126','The courtroom explanation makes justification easier to distinguish from self-improvement.',
            'reading-grace','A complete chapter addresses the fear that an unworthy person cannot come to Christ.',
            'What is the ground of acceptance, and what place does faith have?',
            'Write a two-sentence account of grace without making your progress its price.'),
          step('Respond with repentance and faith','Consider how turning to Christ changes your relation to sin.',
            [('Mark',1,14,15,'Read Jesus’ call in the setting of his announcement of God’s kingdom.')],
            'sermon-460','Explains why the call to repent and believe also gives the troubled hearer warrant to come.',
            'reading-repentance','Shows why forgiveness and repentance belong together without treating repentance as a payment.',
            'How does repentance differ from trying to buy forgiveness?',
            'Name one concrete wrong to confess and one faithful response to practice.'),
          step('Grow in new life and fellowship','Move from an isolated decision toward dependence on the Spirit and mutual care.',
            [('John',3,1,21,'Read new birth and believing together within Jesus’ conversation.'),('Hebrews',10,19,25,'Connect access to God with drawing near, hope and encouragement.')],
            'sermon-groups','Shows how Christian encouragement can become practical care while leaving room for different church arrangements.',
            'reading-new-life','Keeps the new birth grounded in God’s work and directs the reader to Christ.',
            'Which duties are in Hebrews, and which group arrangements are proposed ways of practicing them?',
            'Arrange one conversation about Scripture and one act of encouragement in your church.')]),
      dict(id='deeper-theology',title='Christ and justification in deeper study',audience='Readers ready for sustained doctrinal argument',
        purpose='Study Christ’s representative work, the meaning of justification, and the evidence of living faith in sequence.',
        preparation='Begin after the grace path or equivalent grounding. Read the older prose slowly and define terms from the author’s argument.',
        completion='Distinguish substitution, justification and the fruits of faith without separating salvation from holiness.',
        stages=[
          step('Christ as the sinless representative','Establish whose work bears the weight of reconciliation.',
            [('2 Corinthians',5,14,21,'Read verse 21 within Paul’s ministry-of-reconciliation argument.')],
            'sermon-310','Introduces the contrast between Christ’s personal sinlessness and his bearing of sin.',
            'reading-owen-substitution','Supplies a longer exegetical argument after the sermon’s explanation.',
            'How does Owen distinguish bearing sin from becoming morally sinful?',
            'Outline the argument with the biblical wording beside each inference.'),
          step('Justification and sanctification','Clarify a change in standing before God and a change within the believer.',
            [('Romans',4,1,8,'Examine Paul’s use of Abraham, faith and the forgiveness of sins.')],
            'sermon-126','Return to the courtroom illustration now with more precise questions about its scope.',
            'reading-hodge','Explains the declarative character of justification while distinguishing it from inward renewal.',
            'Where does the analogy clarify Paul, and where might an analogy oversimplify?',
            'Write separate definitions of justification and sanctification, then explain their relation.'),
          step('Living faith and obedient action','Test whether your account can take James’s warning seriously.',
            [('James',2,14,26,'Follow James’s examples and his contrast between dead and living faith.')],
            'sermon-460','A thematic companion recalls that the gospel calls for repentance as well as belief; it is not a commentary on James.',
            'reading-owen-james','Offers Owen’s sustained reconciliation of Paul and James for evaluation against both texts.',
            'Does Owen distinguish the ground of acceptance from its evidence convincingly?',
            'Explain his position fairly, then identify the strongest question you would ask him.')]),
      dict(id='apologetic-questions',title='Scripture miracles and resurrection',audience='Christians learning to examine and explain foundational truth claims',
        purpose='Define the claim, distinguish possibility from evidence, and then examine a specific resurrection argument.',
        preparation='Use a notebook with separate columns for source statement, author inference and your own question. Read 1 Peter 3:15–16 as a posture for discussion.',
        completion='Present a claim and its reasons while stating what the evidence does and does not establish.',
        stages=[
          step('What does inspiration mean','Understand the doctrine before deciding whether an argument supports it.',
            [('2 Timothy',3,14,17,'Locate inspiration within the passage’s emphasis on salvation, teaching and formation.')],
            'sermon-15','Hear the doctrine preached to Christian hearers; the sermon itself says it is not developing external proofs.',
            'reading-inspiration','Clarifies terms that are easily confused in conversations about the Bible.',
            'Which statements define inspiration, and which would need further evidence for a questioning reader?',
            'Give a fair definition before offering an argument; avoid caricaturing the person who disagrees.'),
          step('Could a miracle occur','Separate a philosophical objection from a historical investigation.',
            [('Acts',26,1,8,'Read Paul’s resurrection question within his defense before Agrippa.')],
            'sermon-1067','Its treatment of natural analogies helps separate illustration from proof.',
            'reading-miracles','Alexander argues that revelation and divine intervention are reasonable if God exists; he states the limit of that argument.',
            'What must Alexander assume, and what further evidence would establish a particular event?',
            'State the strongest objection to the argument and a reply that does not assume the conclusion.'),
          step('What supports the resurrection claim','Examine a historical argument without confusing theological importance with proof.',
            [('1 Corinthians',15,1,19,'Read Paul’s report, named appearances and reasoning about the consequences of denial.')],
            'sermon-1653','Explains why the claim is bodily and central to the gospel; it is a later interpretation of the evidence.',
            'reading-resurrection','Lets you inspect Alexander’s use of Paul and early Christian belief rather than merely repeat his conclusion.',
            'What is directly reported, what is inferred, and which alternative explanation requires examination?',
            'Draft a respectful answer distinguishing Paul’s testimony, Alexander’s inference and your remaining research question.')]),
      dict(id='pastoral-concerns',title='Grief assurance and care at home',audience='Christians facing sorrow or doubt and those accompanying them',
        purpose='Practice patient listening, ground assurance in Christ, and carry care into ordinary household life.',
        preparation='Take one stage at a time with someone you trust. These readings offer spiritual companionship, not a complete response to every crisis.',
        completion='Offer encouragement that neither promises a quick resolution nor makes spiritual confidence a condition of being heard.',
        stages=[
          step('Make room for sorrow','Attend to grief before reaching for an explanation of another person’s experience.',
            [('Ruth',1,1,22,'Notice bereavement, Naomi’s words and Ruth’s companionship before the later resolution.')],
            'sermon-ruth','Provides a narrative account of grief and mercy to discuss, while requiring care with its applications.',
            'reading-discouragement','An experienced preacher’s admission of weakness resists the assumption that usefulness requires constant emotional strength.',
            'Which promises can you offer, and which explanations of a particular loss would go beyond what you know?',
            'Listen without correcting the person’s first expression of grief; offer one specific form of practical help.'),
          step('Distinguish weak faith from no faith','Consider assurance without requiring an unwavering emotional state.',
            [('1 John',5,1,21,'Read the testimony to the Son, the purpose of assurance, and Newton’s main text in context.')],
            'sermon-newton','Explicitly rejects making full assurance essential to the existence of genuine faith.',
            'reading-perseverance','Directs hope toward God’s faithfulness and union with Christ.',
            'How can you encourage trust without demanding that someone first feel certain?',
            'Identify one promise in the text and discuss it without measuring faith by the intensity of a feeling.'),
          step('Care through Scripture prayer and example','Move from general concern to sustained household practices.',
            [('Joshua',24,14,24,'Read the household declaration within covenant commitment and the people’s response.')],
            'sermon-whitefield','Brings household instruction and prayer into view alongside public worship.',
            'reading-family','Provides sustained counsel on introducing Scripture and prayer to children.',
            'What can a caregiver faithfully do, and what belongs to God rather than parental control?',
            'Choose a short, sustainable time for Scripture and prayer; readers without children can consider how to support a family without taking over its responsibilities.')]),
      dict(id='ministry-preparation',title='Character teaching and mission in ministry',audience='Prospective pastors elders teachers and group leaders',
        purpose='Put character before technique, learn responsible application, and connect preparation to service and mission.',
        preparation='Study within the oversight of your church. Completing a path does not establish a call, qualification or office.',
        completion='Prepare a short passage-based lesson, invite correction, and identify one accountable opportunity to serve.',
        stages=[
          step('Watch your life and teaching','Begin with the person who serves rather than a collection of methods.',
            [('1 Timothy',4,6,16,'Hold example, doctrine, public reading and perseverance together.')],
            'sermon-1148','Connects a pastor’s joy to people walking in truth, rather than the teacher’s prominence.',
            'reading-character','Explains why the minister’s inward life belongs to the work itself.',
            'What would people who know you well say about the relation between your teaching and conduct?',
            'Ask a trusted church leader for one concrete area of growth and a way to follow it up.'),
          step('Understand before applying','Learn to explain a passage and address real hearers responsibly.',
            [('2 Timothy',4,1,5,'Read the charge to preach alongside patience, teaching and endurance.')],
            'sermon-1503','Challenges the equation of frequent reading with genuine understanding.',
            'reading-application','Shows how application takes account of hearers while preserving the relation of law and gospel.',
            'Does your application arise from the passage, and how would it differ for two different hearers?',
            'Prepare a ten-minute lesson with a text summary, main claim and two reasoned applications; invite review.'),
          step('Serve and participate in mission','Let preparation lead to faithful witness in cooperation with others.',
            [('Matthew',28,16,20,'Read disciple-making under Christ’s authority and promised presence.')],
            'sermon-1292','Joins character and intentional witness, rather than treating evangelism as technique alone.',
            'reading-mission','Provides a substantial historical argument for continuing obligation and shared practical means.',
            'Which parts of Carey’s proposal express an enduring obligation, and which are context-dependent methods?',
            'Plan one act of service or witness with your church, including whom to learn from and how to evaluate it.')])
    ]
    # Preparation itself contains a Scripture recommendation, so give it a source as well.
    paths[2]['preparationScripture']=scripture('1 Peter',3,15,16,'Sets a posture of gentleness and respect for answering questions.')
    for path in paths:
        for n,s in enumerate(path['stages'],1):s.update(position=n,id=f"{path['id']}-{n}")
        path.update(sequenceRationale=path['purpose'],pace='Three stages, usually one stage per week; take longer where useful. This is a suggested pace, not measured reading time.',
            reviewStatus='Assigned selections and rationale checked; AI-assisted editorial guide',sourceRepublished=False)

    policies=[
        dict(id='prdl',url='https://www.prdl.org/about.php',locator='Purpose',decision='Discovery catalog; follow the actual holding to its host. No hosted corpus inferred.'),
        dict(id='monergism',url='https://www.monergism.com/monergism-copyright-permissions',locator='Copyright and Permissions',decision='Use source links and annotations. Do not redistribute curated files to the app, repository or corpus.'),
        dict(id='desiring-god',url='https://www.desiringgod.org/permissions',locator='Resources by John Piper and Exceptions',decision='Link to official messages. No wholesale text copying, media reupload or assumption that a book license covers reuse elsewhere.'),
        dict(id='mlj-trust',url='https://www.mljtrust.org/terms-use/',locator='Terms of Use, Intellectual Property',decision='Systematic collection/database retrieval prohibited. No MLJ retrieval, transcription or inclusion was performed for these paths.')]
    write(OUT/'source-access.json',dict(checkedOn=DAY,policies=policies,acquiredFiles=0,embeddedMedia=0))
    write(OUT/'resources.json',dict(date=DAY,resources=list(resources.values()),verificationDefinition='Bibliographic identity, edition relationship and specific source span support the recommendation. Not a claim of complete-work review.'))
    write(OUT/'paths.json',dict(schemaVersion=1,date=DAY,paths=paths))
    write(OUT/'input-manifest.json',dict(date=DAY,files=[dict(path=k,sha256=v) for k,v in sorted(inputs.items())]))
    sermons=[resources[s['sermon']['resourceId']] for p in paths for s in p['stages']]
    summary=dict(paths=len(paths),stages=sum(len(p['stages']) for p in paths),
        scriptureAssignments=sum(len(s['scripture']) for p in paths for s in p['stages'])+1,
        sermonAssignments=len(sermons),substantialReadingAssignments=len(sermons),
        uniqueSermons=len({s['workId'] for s in sermons}),uniqueCatalogWorks=len({r['workId'] for r in resources.values()}),
        sourceSelections=len(resources),sermonAssignmentsByAuthor=dict(Counter(a for s in sermons for a in s['authors'])),
        newAcquiredFiles=0,newPublishedWorks=0)
    write(OUT/'summary.json',summary)
    write(OUT/'checkpoint.json',dict(status='five-path-batch-complete',next=[
        'Human pastoral/theological review before public integration; these guides currently live at the collection desk.',
        'Expand apologetics beyond inspiration, miracles and resurrection when further catalog arguments are body-reviewed. No completed Islam curriculum is claimed.',
        'Broaden sermon authors as more suitable selections receive scoped review; do not add an unverified recommendation merely for diversity.',
        'Further family, grief and ministry paths may draw on later completed missions; unfinished concurrent acquisitions were not used.',
        'If input hashes change, recheck recommendations before regenerating; no source permissions are broadened by this path builder.']))
    for path in paths:
        lines=['# '+path['title'],'',path['purpose'],'','**For:** '+path['audience'],
            '',path['preparation'],'',path['pace'],'',
            'Read Scripture first, then the assigned sermon selection and substantial reading. Annotations and exercises are this library’s editorial guidance. Sources open at their hosts; page references distinguish assigned excerpts from whole works.','']
        if path.get('preparationScripture'):
            b=path['preparationScripture'];lines += [f"Begin with [{b['reference']}]({b['url']}). {b['why']}",'']
        for s in path['stages']:
            lines+=['## '+str(s['position'])+' '+s['title'],'',s['purpose'],'']
            for b in s['scripture']:lines += [f"**Scripture:** [{b['reference']}]({b['url']}). {b['why']}",'']
            for field,label in [('sermon','Sermon'),('reading','Substantial reading')]:
                a=s[field];r=resources[a['resourceId']]
                lines += [f"**{label}:** {', '.join(r['authors'])}, [{r['title']}]({r['sourceUrl']}). {r['assignment']}.",
                    '',a['why'],'', '**Reading note:** '+r['limitations'],'']
            lines+=['**Reflect:** '+s['reflection'],'','**Put it into practice:** '+s['practice'],'']
        lines+=['## When you finish','',path['completion'],'',
            'Return to the [five-path overview](PATHS.md). The [source register](resources.json) records edition identities, exact review scope and access conditions.','']
        (OUT/(path['id']+'.md')).write_text('\n'.join(lines),encoding='utf-8',newline='\n')
    lines=['# Annotated Christian study paths','',
        'Choose a path for your present question or responsibility. Each has three ordered stages combining Scripture, a sermon selection and a substantial reading. The order and exercises are editorial recommendations, with sources and edition limits made visible.','',
        '| Path | Sequence | Intended outcome |','|---|---|---|']
    for p in paths:lines += [f"| [{p['title']}]({p['id']}.md) | {' → '.join(s['title'] for s in p['stages'])} | {p['completion']} |"]
    lines+=['','## How to use the paths','',
        'A stage can occupy a week or several shorter meetings. Read the biblical context before the commentary. For older prose, write down unfamiliar terms and ask how the author’s conclusion follows from the passage. Discuss disagreements fairly. Completing a reading plan is not a measure of someone’s standing with God.','',
        'Sermon excerpts are clearly labeled; the links also provide their larger context. Substantial readings are named chapters, multi-page arguments or grouped sections, rather than collections of detached quotations. Theological explanations are distinguished from historical evidence and practical applications.','',
        'Verification concerns the particular passages supporting each recommendation. It does not certify every statement in the whole source. Four preachers appear in the sermon selections; Spurgeon remains prominent because the current verified catalog is concentrated in his work.','',
        'These are local collection guides. They do not add source texts to the public website. See the [collection report](REPORT.md), [selection register](resources.json) and [source permissions](source-access.json).','']
    (OUT/'PATHS.md').write_text('\n'.join(lines),encoding='utf-8',newline='\n')
    run=dict(**{'$schema':'../../schema.json'},schemaVersion=1,kind='run',id='run-l14-study-paths-2026-10-05',
        missionId='L14',status='complete',startedOn=DAY,completedOn=DAY,
        boundary='Five annotated local study paths; selected-source review and editorial sequencing, not public integration or whole-work certification.',
        sourceIds=sorted({r['sourceId'] for r in resources.values()}),inventory='content/library/reports/study-paths/paths.json',
        checkpoint='content/library/reports/study-paths/checkpoint.json',
        counts=dict(works=0,editions=0,assets=0,series=0,reviewedWorks=0,publishedWorks=0),
        gaps=read(OUT/'checkpoint.json')['next'],reportPath='content/library/reports/study-paths/REPORT.md')
    write(LIB/'catalog/runs'/f"{run['id']}.json",run)
    print(json.dumps(summary,ensure_ascii=False))


if __name__=='__main__':build()
