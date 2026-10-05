"""L12 editorial navigation over cited, scoped readings; never a full-text index."""
import importlib.util
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('l12', SITE/'scripts/catalog-ministry-resources.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
OUT, LIB, read, write = c.OUT, c.LIB, c.read, c.write


def build():
    inv = read(OUT/'inventory.json')
    treatments = []

    def add(key, wid, kind, topics, audiences, locator, claim, distinction, url=None, scope='selected-body', asset=None):
        work = read(LIB/'catalog/works'/f'{wid}.json')
        treatments.append(dict(id='l12-'+key, workId=wid, kind=kind,
            topics=topics.split(), audiences=audiences.split(), locator=locator,
            sourceUrl=url or work['evidence'][0]['url'], assetId=asset,
            summary=claim, interpretationBoundary=distinction,
            reviewScope=scope, wholeWorkReviewed=False, reviewedOn=c.DAY,
            reviewer='Codex; AI-assisted source reading, not ecclesial approval'))

    sp = 'asset-l12-spurgeon-lectures-pdf'
    add('college', 'work-l12-spurgeon-lectures', 'historical-practice',
        'sermon-preparation pastoral-ministry', 'pastors elders',
        'Introduction, printed pp. 5–9; PDF pp. 11–15',
        'Spurgeon locates these addresses in Friday meetings at his college and describes its entry requirements and support of students.',
        'A particular nineteenth-century training institution. Its admissions and funding practices are not universal church commands.', asset=sp)
    add('self-watch', 'work-l12-spurgeon-lecture-01', 'theological-principle',
        'pastoral-ministry', 'pastors elders', 'Lecture I, printed pp. 11–12; PDF pp. 17–18',
        'The minister must attend to personal spiritual character because his own life is involved in the service he renders.',
        'Grounded in the lecture’s 1 Timothy 4:16 text; assessment covers the opening, not every later illustration.', asset=sp)
    add('sermon-substance', 'work-l12-spurgeon-lecture-05', 'theological-principle',
        'sermon-preparation', 'pastors small-group-leaders', 'Lecture V, printed pp. 112–113; PDF pp. 118–119',
        'Preaching needs substantive doctrinal content; presentation cannot compensate for an empty message.',
        'Apply to teaching preparation without making every small-group leader an ordained preacher.', asset=sp)
    add('spiritualizing', 'work-l12-spurgeon-lecture-07', 'practical-advice',
        'sermon-preparation', 'pastors small-group-leaders', 'Lecture VII, printed p. 156; PDF p. 162',
        'Spurgeon permits some spiritualizing while opening with a warning to use it sparingly.',
        'Do not present this as a blanket rejection of allegory or a fully reviewed hermeneutical method. Compare the passage’s actual argument before adopting an illustration.', asset=sp)
    add('voice', 'work-l12-spurgeon-lecture-08', 'practical-advice',
        'sermon-preparation', 'pastors small-group-leaders', 'Lecture VIII, printed p. 178; PDF p. 184',
        'Delivery matters, but vocal ability without meaningful content does not supply a sermon.',
        'Historical speaking advice requires adaptation to microphones and current settings; the opening does not validate every later vocal exercise.', asset=sp)
    add('impromptu', 'work-l12-spurgeon-lecture-10', 'practical-advice',
        'sermon-preparation pastoral-ministry', 'pastors elders small-group-leaders', 'Lecture X, printed p. 227; PDF p. 233',
        'Develop the capacity to speak when unexpectedly called upon.',
        'The opening explicitly distinguishes this ability from the debate about written sermons and from routine preaching without preparation.', asset=sp)
    add('fainting', 'work-l12-spurgeon-lecture-11', 'practical-advice',
        'pastoral-ministry', 'pastors elders', 'Lecture XI, printed p. 249; PDF p. 255',
        'Spurgeon acknowledges ministerial discouragement, drawing on his own experience to address fellow workers.',
        'Historical pastoral counsel; no clinical assessment or complete modern care protocol is claimed.', asset=sp)
    add('books', 'work-l12-spurgeon-lecture-13', 'practical-advice',
        'sermon-preparation pastoral-ministry', 'pastors elders', 'Lecture XIII, printed p. 282; PDF p. 288',
        'Churches should consider the preacher’s need for books and sustained intellectual nourishment.',
        'A ministry support recommendation, not a mandatory library size or spending formula.', asset=sp)
    add('perkins-application', 'work-l12-perkins-art-07', 'practical-advice',
        'sermon-preparation discipleship', 'pastors small-group-leaders',
        'The Art of Prophesying, chapter 7; 2019 publisher excerpt, application paragraphs',
        'Application attends to hearers and circumstances; Perkins distinguishes the law’s diagnosis from the gospel’s promise and the Spirit’s enabling work.',
        'Selected modernized excerpt. This is not a transcription of the 1592 edition or a summary of the entire book.',
        url=c.URL['perkins-application'])
    add('calvin-ministry', 'work-l12-calvin-iv-03', 'theological-principle',
        'church-government pastoral-ministry', 'pastors elders', 'Institutes IV.3.1–4; Beveridge translation',
        'God uses human ministers to build up the church; Calvin distinguishes ordinary pastoral and teaching offices from extraordinary callings.',
        'Section 4 allows exceptional evangelists; do not flatten this into an unqualified denial of every extraordinary ministry.')
    add('calvin-sacraments', 'work-l12-calvin-iv-14', 'theological-principle',
        'sacraments worship', 'pastors elders individual-christians', 'Institutes IV.14.1–4; Beveridge translation',
        'A sacramental sign confirms God’s promise and assists weak faith; the accompanying word matters to its meaning.',
        'Later editorial footnotes in the digital edition are not Calvin’s own statements.')
    add('calvin-supper', 'work-l12-calvin-iv-17', 'theological-principle',
        'sacraments worship', 'pastors elders individual-christians', 'Institutes IV.17.1–4; Beveridge translation',
        'The Supper assures believers of nourishment in Christ and directs them to the benefit of his once-offered sacrifice.',
        'Only these opening sections assessed. They do not establish how often any historical congregation actually celebrated communion.')
    add('carey-commission', 'work-l12-carey-01', 'theological-principle',
        'missions evangelism', 'pastors elders individual-christians', 'Enquiry, section I, argument concerning the continuing commission',
        'Carey argues that the commission to teach all nations continues rather than expiring with the apostles.',
        'Preserve the argument for an obligation separately from his proposed organizational means.')
    add('carey-means', 'work-l12-carey-05', 'practical-advice',
        'missions evangelism', 'pastors elders individual-christians', 'Enquiry, section V, prayer, cooperation and financial support',
        'Prayer, cooperative effort and material support are proposed as means for missionary work.',
        'An eighteenth-century proposal; contemporary strategy needs contextual knowledge and local Christian participation.')
    add('carey-world', 'work-l12-carey-03', 'historical-practice',
        'missions', 'pastors elders', 'Enquiry, section III heading and historical setting; table entries not audited',
        'The section surveys the world as represented in this 1792 work.',
        'Discovery classification only: historic population and religion estimates are not verified current statistics. Historical-practice here includes dated descriptions.', scope='section-heading-and-context')
    add('groups-principle', 'work-l12-piper-groups', 'theological-principle',
        'discipleship pastoral-ministry', 'small-group-leaders elders individual-christians',
        'Sections on Hebrews 3:12–13 and 10:23–25: mutual encouragement',
        'Piper argues for believers’ responsibility to encourage one another and stimulate love and good works.',
        'These are supporting passages within a sermon headed Hebrews 13:1–6, not replacement main texts.')
    add('groups-setting', 'work-l12-piper-groups', 'historical-practice',
        'discipleship', 'small-group-leaders elders',
        'Connection Between Hebrews’ Motivation and Small Groups; September 14, 1997',
        'The sermon applies mutual care to Bethlehem’s small-group sign-up occasion.',
        'The source explicitly acknowledges that Hebrews does not name this exact group structure.')
    add('groups-method', 'work-l12-piper-groups', 'practical-advice',
        'discipleship', 'small-group-leaders individual-christians',
        'Dynamics of Small Group Ministry According to Hebrews',
        'The proposed group life joins promises of God to practical care, hospitality and encouragement.',
        'Assess the method by its biblical purpose; official text was sampled, audio was not reviewed.')
    add('ryle-prayer', 'work-l12-ryle-parents-06', 'practical-advice',
        'discipleship worship', 'families', 'Duties of Parents, counsel VI',
        'Parents are urged to cultivate a habit of prayer in their children.',
        'Selected counsel in an unidentified printed witness; no blanket endorsement of all historical disciplinary advice elsewhere in the work.')
    add('ryle-example', 'work-l12-ryle-parents-14', 'practical-advice',
        'discipleship', 'families individual-christians', 'Duties of Parents, counsel XIV',
        'The parent’s example is part of what a child learns.',
        'Read with counsel XVII on dependence on God; this catalog does not guarantee a child’s conversion through a technique.')
    add('worship-standard', 'work-l08-wcf-chapter-021', 'theological-principle',
        'worship discipleship', 'pastors elders families individual-christians',
        'WCF 21.1, 21.5–6; acquired Creeds.json /Data/20/Sections',
        'The confession grounds worship in God’s revealed will and includes Scripture, preaching, hearing, praise and sacraments, with family, private and public worship.',
        'This is a confessional prescription, not evidence that every church historically practiced it identically.', asset='asset-l08-wcf-json')
    add('preach-standard', 'work-l08-wlc-question-159', 'theological-principle',
        'sermon-preparation pastoral-ministry', 'pastors elders small-group-leaders',
        'WLC Q159, answer; acquired Creeds.json /Data/158/Answer',
        'The answer calls for diligent, plain, faithful preaching, adapted to hearers, with love and a purpose of conversion and edification.',
        'Q158 separately concerns approved and called preachers; applying teaching wisdom in a group does not confer that office.', asset='asset-l08-wlc-json')
    add('hear-standard', 'work-l08-wlc-question-160', 'practical-advice',
        'worship discipleship', 'individual-christians families small-group-leaders',
        'WLC Q160, answer; acquired Creeds.json /Data/159/Answer',
        'Hearers prepare, pray, test teaching by Scripture, meditate, discuss and practice it.',
        'Practical direction presented by this standard as a duty; practical-advice does not mean the source treats it as optional.', asset='asset-l08-wlc-json')
    add('baptism-wcf', 'work-l08-wcf-chapter-028', 'theological-principle',
        'sacraments', 'pastors elders families individual-christians', 'WCF 28.3–4; /Data/27/Sections/2–3',
        'WCF includes infants of believing parents and permits pouring or sprinkling without requiring immersion.',
        'Keep its subjects and mode distinct from Second London 29.', asset='asset-l08-wcf-json')
    add('baptism-lbc', 'work-l08-lbc-chapter-029', 'theological-principle',
        'sacraments', 'pastors elders families individual-christians', 'Second London 29.2, 29.4; /Data/28/Sections/1 and 3',
        'Second London restricts subjects to professing repentant believers and requires immersion for due administration.',
        'This is a real disagreement with WCF 28, not interchangeable terminology.', asset='asset-l08-lbc-json')
    add('supper-wcf', 'work-l08-wcf-chapter-029', 'theological-principle',
        'sacraments worship', 'pastors elders individual-christians', 'WCF 29.7; /Data/28/Sections/6',
        'Worthy receivers spiritually receive and feed upon Christ by faith.',
        'The same paragraph denies a corporeal presence in the elements; retain both parts.', asset='asset-l08-wcf-json')
    add('supper-lbc', 'work-l08-lbc-chapter-030', 'theological-principle',
        'sacraments worship', 'pastors elders individual-christians', 'Second London 30.7; /Data/29/Sections/6',
        'Second London also affirms real spiritual feeding on Christ by faith.',
        'Do not recast this Baptist statement as a merely mental memorial to manufacture a contrast.', asset='asset-l08-lbc-json')
    add('polity-wcf', 'work-l08-wcf-chapter-031', 'theological-principle',
        'church-government', 'pastors elders', 'Historic WCF 31.2–4; /Data/30/Sections/1–3',
        'Synods can determine controversies and complaints authoritatively under Scripture, while remaining fallible.',
        'This witness retains the historical magistrate clause in 31.2; later denominational revisions must not be substituted silently.', asset='asset-l08-wcf-json')
    add('polity-lbc', 'work-l08-lbc-chapter-026', 'theological-principle',
        'church-government', 'pastors elders', 'Second London 26.7–8, 26.15; /Data/25/Sections/6–7 and 14',
        'The gathered church has authority with elders and deacons; interchurch messengers give advice without jurisdiction to impose determinations.',
        'Interchurch cooperation is affirmed, so congregational authority must not be confused with isolation.', asset='asset-l08-lbc-json')
    add('soul-winner', 'work-spurgeon-sermon-1292', 'theological-principle',
        'evangelism', 'pastors small-group-leaders individual-christians',
        'Sermon 1292, opening and holy-life discussion; Proverbs 11:30',
        'Spurgeon connects seeking others’ salvation with a holy life rather than mere argumentative skill.',
        'Selected sermon reading; do not confuse this numbered sermon with the later collected book The Soul Winner.',
        url='https://www.spurgeon.org/sermons/the-soul-winner')

    write(OUT/'treatments.json', dict(date=c.DAY, definitions=c.TYPES, assessments=treatments,
        note='Editorial paraphrases tied to specified spans. Tags can describe different functions within one work. No complete-work review or new quotation edition.'))
    by_id = {x['id']: x for x in treatments}
    discoveries = {
        'sermon-preparation':['work-l12-perkins-art','work-l12-spurgeon-lectures','work-l08-wlc-question-158'],
        'pastoral-ministry':['work-l12-perkins-calling','work-l12-piper-brothers'],
        'worship':['work-l12-owen-worship','work-l08-lbc-chapter-022'],
        'sacraments':['work-l12-calvin-iv-16','work-l08-wcf-chapter-027','work-l08-lbc-chapter-028'],
        'church-government':['work-l12-owen-churches','work-l08-wcf-chapter-030'],
        'discipleship':['work-l12-ryle-parents-05','work-l12-ryle-parents-17','work-l03-whitefield-works-5-04'],
        'evangelism':['work-l12-packer','work-spurgeon-sermon-2423'],
        'missions':['work-l12-piper-nations','work-l10-zwemer-lectures'],
    }
    topics=[]
    for topic in c.TOPICS:
        topics.append(dict(id=topic,title=topic.replace('-',' ').title(),
            assessmentIds=[a['id'] for a in treatments if topic in a['topics']],
            furtherReading=[dict(workId=w, status='bibliographic-or-contents-lead; no new whole-body assessment') for w in discoveries[topic]]))
    write(OUT/'topic-map.json',dict(date=c.DAY,topics=topics))
    choices={
        'pastors': [('self-watch','Begin with the minister’s character.'),('preach-standard','Establish the purpose and manner of preaching.'),('perkins-application','Connect exposition to particular hearers.'),('books','Plan resources for sustained preparation.'),('carey-commission','Place local ministry within the church’s mission.')],
        'elders': [('self-watch','Consider the character of those entrusted with ministry.'),('polity-wcf','Study a synodical account of authority.'),('polity-lbc','Compare congregational and interchurch authority.'),('fainting','Discuss support for discouraged ministers.'),('books','Consider practical provision for teaching ministry.')],
        'small-group-leaders':[('groups-principle','Start with mutual encouragement as the purpose.'),('groups-setting','Recognize the historical setting of the proposed structure.'),('groups-method','Evaluate the proposed practice against its purpose.'),('perkins-application','Prepare applications attentive to the hearers.'),('hear-standard','Build discussion around Scripture and obedient hearing.')],
        'families':[('worship-standard','Locate family worship alongside public and private worship.'),('ryle-prayer','Consider how to cultivate prayer.'),('ryle-example','Examine the example adults give.'),('baptism-wcf','Understand the Presbyterian account of children and baptism.'),('baptism-lbc','Compare the Baptist account without erasing disagreement.')],
        'individual-christians':[('hear-standard','Prepare to benefit from preaching.'),('groups-principle','Participate in mutual Christian care.'),('calvin-supper','Study the pastoral purpose of the Supper.'),('soul-winner','Connect witness with Christian character.'),('carey-means','Consider prayer and support for missions.')],
    }
    audiences=[]
    for audience,items in choices.items():
        audiences.append(dict(id=audience, recommendations=[dict(position=i,assessmentId='l12-'+key,
            workId=by_id['l12-'+key]['workId'],purpose=purpose) for i,(key,purpose) in enumerate(items,1)],
            status='Suggested entry points into scoped readings; not a completed curriculum or whole-book endorsement'))
    write(OUT/'audience-map.json',dict(date=c.DAY,audiences=audiences))
    comparisons=[
        dict(id='baptism',question='Who should receive baptism, and by what mode?',assessmentIds=['l12-baptism-wcf','l12-baptism-lbc'],relationship='doctrinal-disagreement',readingRule='Read both numbered statements in their own confessional setting; do not blend the positions.'),
        dict(id='supper',question='Do these Presbyterian and Baptist standards affirm spiritual feeding on Christ?',assessmentIds=['l12-supper-wcf','l12-supper-lbc'],relationship='shared-affirmation',readingRule='Agreement here does not erase their differences on baptism or establish identical wording throughout.'),
        dict(id='government',question='What authority does an interchurch assembly possess?',assessmentIds=['l12-polity-wcf','l12-polity-lbc'],relationship='doctrinal-disagreement',readingRule='Compare authority to determine complaints with advice lacking jurisdiction; keep the historic WCF edition visible.'),
        dict(id='small-groups',question='Is a biblical duty identical with a particular group program?',assessmentIds=['l12-groups-principle','l12-groups-setting','l12-groups-method'],relationship='principle-context-method',readingRule='The same sermon contains an argued duty, a dated implementation and a proposed practice; those are separate claims.'),
    ]
    write(OUT/'comparisons.json',dict(date=c.DAY,comparisons=comparisons))
    lines=['# Ministry reading guide','',
        'Start with a responsibility or audience below. Each link identifies the source and the exact span assessed. These are suggested entry points, not complete-book reviews. For every claim and limitation use [treatments.json](treatments.json); for edition and rights boundaries use [the report](REPORT.md).','',
        'Theological principle means a claim grounded in Scripture or doctrine. Historical practice means a dated description. Practical advice means guidance for carrying out ministry; some sources treat their practical directions as duties. A work can contain all three.','',
        '## By responsibility','']
    for topic in topics:
        lines += [f"### {topic['title']}",'']
        for aid in topic['assessmentIds']:
            a=by_id[aid];w=read(LIB/'catalog/works'/f"{a['workId']}.json")
            lines.append(f"- [{w['title']}]({a['sourceUrl']}) — {a['locator']}. **{a['kind'].replace('-',' ')}**. {a['summary']} {a['interpretationBoundary']}")
        lines += ['', 'Further catalog leads (body assessment still needed): '+', '.join(f"[{read(LIB/'catalog/works'/str(x['workId']+'.json'))['title']}](../../catalog/works/{x['workId']}.json)" for x in topic['furtherReading'])+'.','']
    lines+=['## By audience','']
    for audience in audiences:
        lines += ['### '+audience['id'].replace('-',' ').title(),'']
        for r in audience['recommendations']:
            a=by_id[r['assessmentId']];w=read(LIB/'catalog/works'/f"{a['workId']}.json")
            lines.append(f"{r['position']}. [{w['title']}]({a['sourceUrl']}) — {a['locator']}. {r['purpose']}")
        lines+=['']
    lines+=['## Comparisons to keep explicit','']
    for x in comparisons:
        lines += [f"- **{x['question']}** {x['readingRule']} See "+', '.join(f"[{by_id[k]['locator']}]({by_id[k]['sourceUrl']})" for k in x['assessmentIds'])+'.']
    (OUT/'GUIDE.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
    print(f'{len(treatments)} scoped assessments; {len(topics)} topics; {len(audiences)} audiences; {len(comparisons)} comparisons')


if __name__ == '__main__':
    build()
