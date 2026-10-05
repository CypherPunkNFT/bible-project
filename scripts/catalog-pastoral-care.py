"""Offline, text-first L11 index. No crawling, OCR or PDF processing."""
import hashlib
import importlib.util
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
LIB = SITE/'content/library'
OUT = LIB/'reports/pastoral-care'
spec = importlib.util.spec_from_file_location('helpers', SITE/'scripts/catalog-scripture-studies.py')
h = importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
read, write = h.read, h.write

# Whole chapters/major sections, not isolated quotations. Descriptions are editorial
# reading purposes, not substitutes for the author's complete argument.
SELECTION = [
 ('owen-mortification','i.vi',['sanctification','temptation'],'Believers struggling with sin','Read Owen on the Spirit as the sufficient agent of mortification; retain his distinction between spiritual obedience and merely external remedies.'),
 ('owen-mortification','i.xvii',['sanctification','perseverance'],'Believers struggling with recurring sin','Read the concluding directions in light of the preceding chapters: faith in Christ and the work of the Spirit govern the practical counsel.'),
 ('owen-temptation','i.iv',['temptation'],'Christians facing temptation','Begin with the exposition of watching and praying; Owen addresses the danger of entering temptation, not merely an isolated sinful act.'),
 ('owen-temptation','i.xi',['temptation','perseverance'],'Christians seeking sustained watchfulness','Follow the two questions about keeping Christ\'s word and how it preserves the believer, rather than reducing the chapter to a technique.'),
 ('ryle-holiness','iii.ii',['sanctification'],'Believers and teachers of Christian doctrine','Ryle distinguishes sanctification from justification while treating both as necessary to Christian salvation; do not merge their functions.'),
 ('ryle-holiness','iii.iv',['perseverance','temptation'],'Christians discouraged by spiritual conflict','Read the whole chapter on the Christian fight alongside the earlier treatment of sin, sanctification and holiness.'),
 ('ryle-holiness','iii.v_1',['sanctification','perseverance'],'Believers seeking spiritual growth','Keep the discussion of growth within Ryle\'s wider account of holiness; this is a chapter within that argument.'),
 ('ryle-holiness','iii.vi',['assurance'],'Doubting believers and pastoral helpers','Ryle argues that assurance is biblical and desirable while distinguishing it from saving faith: a believer may be saved without settled assurance.'),
 ('watson-prayer','iii',['prayer'],'Christians learning to pray','Begin with the address to the Father before the petitions; preserve Watson\'s ordered exposition of the Lord\'s Prayer.'),
 ('watson-prayer','viii',['prayer','repentance'],'Those seeking forgiveness and learning to forgive','The fifth petition treats forgiveness, sin and repentance together; its account of repentance includes turning from sin toward God.'),
 ('watson-prayer','ix',['prayer','temptation'],'Christians praying for deliverance','Read the sixth petition as part of the whole prayer, retaining the relationship between temptation and deliverance from evil.'),
 ('boston-crook','ii',['suffering','grief'],'Afflicted Christians; grief readers seeking a broader treatment of loss','Boston interprets affliction through divine providence. Grief is a related reading use, not a claim that this entire part concerns bereavement.'),
 ('boston-crook','iii',['suffering','prayer','perseverance'],'Christians waiting for relief','Prayer, humility and patient waiting belong together; Boston conditions relief in this life on what is good for the believer.'),
 ('boston-crook','iv',['suffering','perseverance'],'Christians in humbling circumstances','Read the account of humbling oneself under God in continuity with the preceding parts, not as an independent diagnosis of someone else\'s suffering.'),
 ('flavel-heart','v.iii.ii',['suffering','grief'],'Christians in adversity; broader support for readers facing loss','Flavel argues that adversity does not cancel God\'s covenant love. This is general adversity counsel, not a dedicated bereavement chapter.'),
 ('flavel-heart','v.iii.ix',['temptation'],'Christians facing temptation','This is one of twelve seasons for keeping the heart; retain that surrounding practical framework.'),
 ('flavel-heart','v.iii.x',['assurance'],'Believers in spiritual darkness and doubt','Flavel addresses the danger of drawing desperate conclusions about one\'s spiritual condition when comfort and evidence seem absent.'),
 ('flavel-heart','v.iii.xii',['suffering','perseverance'],'Sick and dying believers, and those caring for them','The consolation concerns the believer\'s approach to death through Christ; it should not be presented as a promise of physical recovery.'),
 ('gill-practical','ii.iv',['repentance'],'Readers studying repentance and pastoral teachers','Read repentance within Gill\'s account of internal worship, keeping his doctrinal argument and applications together.'),
 ('gill-practical','ii.xvii',['suffering','perseverance'],'Christians enduring affliction and persecution','Gill connects patience with faith, hope and submission; its Christian grounds matter as much as the practical exhortations.'),
 ('gill-practical','iv.vi',['prayer'],'Christians and teachers studying how to pray','Gill argues that the Lord\'s Prayer supplies a directory or model; preserve his reasons rather than silently presenting it as a prescribed verbal formula.'),
 ('gill-practical','v.i',['marriage'],'Husbands, wives and pastoral teachers','Read both spouses\' duties together. Preserve Gill\'s historical account of marital order, mutual obligations and limits rather than extracting commands without their qualifications.'),
 ('gill-practical','v.ii',['parenting'],'Parents, children and family teachers','Read the duties of parents alongside those of children, including the qualifications on obedience and the warning against provoking children. Historical disciplinary advice remains attributed to Gill.'),
]
ANCHORS = {
 'prayer':['Matthew',6,9,6,13], 'assurance':['1 John',5,13,5,13],
 'sanctification':['Romans',8,13,8,13], 'temptation':['Matthew',26,41,26,41],
 'repentance':['Acts',20,21,20,21], 'grief':['2 Corinthians',5,8,5,8],
 'suffering':['1 Peter',5,6,5,7], 'marriage':['Ephesians',5,25,5,33],
 'parenting':['Ephesians',6,1,6,4], 'perseverance':['Hebrews',12,1,12,3],
}

def build():
    books = {b['key']:b for b in read(OUT/'bibliography.json')['works']}
    files = read(OUT/'acquisition-manifest.json')['files']
    xmlfiles = {f['workKey']:f for f in files if f.get('format')=='xml'}
    roots = {}
    for key,f in xmlfiles.items():
        raw=(SOURCES/f['relativePath']).read_bytes()
        assert len(raw)==f['byteCount'] and hashlib.sha256(raw).hexdigest()==f['sha256']
        roots[key]=ET.fromstring(raw)
    records=[]
    def save(r):
        p=LIB/'catalog'/(r['kind']+'s')/(r['id']+'.json')
        write(p,r); records.append(p.relative_to(SITE).as_posix())
    b=books['owen-temptation']
    evidence=[h.ev(b['infoUrl'],'CCEL work and ThML publication history','Historic work published 1658; acquired electronic witness incorporates later editorial transmission.')]
    w=h.base_work(b['workId'],b['title'],b['authorId'],'treatise','post-reformation',evidence,['temptation','perseverance'])
    w['collections']=['christian-life']; save(w)
    e=dict(**h.common('edition',b['editionId']),workId=b['workId'],label='CCEL ThML electronic witness',languages=['en'],contributors=[],publisher='Christian Classics Ethereal Library',dates=[],abridgment='unknown',modernization='unknown',evidence=evidence)
    e['notes']=['Metadata refers to Goold 1850–1853 and later 1965/1967 print transmission. These are not the original publication date; precise print collation remains open.']; save(e)
    for key,f in xmlfiles.items():
        b=books[key]; evidence=[h.ev(b['infoUrl'],'Offered ThML download','Complete named XML file acquired; not fully proofread or collated.')]
        a=h.link_asset(f['assetId'],b['editionId'],b['sourceId'],b['infoUrl'],evidence)
        a.update(finalUrl=f['finalUrl'],format='other',mediaKind='text',acquisitionStatus='downloaded',storage='raw',relativePath=f['relativePath'],sha256=f['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
        a['rights'].update(category='restricted-license',licenseId='CCEL-personal-educational-permission',licenseUrl='https://www.ccel.org/about/copyright.html',conditions=['Personal/educational use; retain notices. Republication and commercial use require separate clearance.'],conditionsMet=True,unresolved=['Historic text and modern electronic additions have different rights; public hosting and full-text indexing remain uncleared.'])
        a['rights']['actions']['download']='allowed'
        a['rights']['evidence'].append(h.ev(a['rights']['licenseUrl'],'CCEL copyright and permissions','Permission-aware named download; not a blanket redistribution license.'))
        a['processing']['note']='Unmodified ThML XML transcription. No OCR or public full-text indexing performed.'
        a['quality'].update(state='issues',reviewedBy='Codex',reviewedOn='2026-10-05',note='XML parses and hashes match. Selected headings/passages reviewed; modern editorial material and transcription errors may remain.'); save(a)
    sections=[]
    for key,ident,concerns,audience,purpose in SELECTION:
        b=books[key]; f=xmlfiles[key]; el=next(e for e in roots[key].iter() if e.get('id')==ident)
        refs=[dict(x.attrib) for x in el.iter('scripRef')]
        sections.append(dict(id='section-l11-'+key+'-'+ident.replace('.','-'),workId=b['workId'],editionId=b['editionId'],authorId=b['authorId'],assetId=f['assetId'],xmlId=ident,title=el.get('title'),url=b['readerBase']+'.'+ident+'.html',concerns=concerns,intendedAudience=audience,audienceBasis='Editorial routing based on section subject and addressed readers; not a verbatim source label.',readingPurpose=purpose,reviewScope='Heading and selected argument passages; not complete paragraph-by-paragraph review.',sourceScriptureReferences=refs,referenceStatus='Source-encoded citations, not independently verified exposition boundaries.',serializedElementSha256=hashlib.sha256(ET.tostring(el,encoding='utf-8')).hexdigest(),hashConvention='Python ElementTree UTF-8 serialization; immutable raw-file hash is in acquisition manifest.'))
    sermons=[]
    for p in sorted((LIB/'catalog/works').glob('*.json')):
        w=read(p)
        if w.get('genre')=='sermon' and w.get('role')=='core-teaching': sermons.append(w)
    concerns=[]
    for name,raw in ANCHORS.items():
        anchor=h.passage(raw,'main-text','Editorial companion selected for the concern, not asserted as every author\'s main text.')
        candidates=[]
        for w in sermons:
            if any(p.get('role')=='main-text' and p.get('verification')=='verified' and isinstance(p.get('start'),int) and isinstance(p.get('end'),int) and p['start']<=anchor['end'] and p['end']>=anchor['start'] for p in w.get('passages',[])):
                candidates.append(w)
        selected=[]; authors=set()
        for w in candidates:
            author=w['creators'][0]['authorId']
            if author not in authors: selected.append(w); authors.add(author)
            if len(selected)==3: break
        if len(selected)<3:
            selected += [w for w in candidates if w not in selected][:3-len(selected)]
        concerns.append(dict(concern=name,subjectId='marriage-family' if name=='marriage' else name,sectionIds=[s['id'] for s in sections if name in s['concerns']],scriptureCompanion=anchor,sermons=[dict(workId=w['id'],title=w['title'],authorIds=[c['authorId'] for c in w['creators']],sourceReferences=w['evidence'],connectionBasis='Verified catalog main-text overlap with editorial companion; sermon body comparison not performed.') for w in selected],limitation='Broader affliction support only; dedicated bereavement transcription still needed.' if name=='grief' else ('No verified main-text match in current catalog.' if not selected else None)))
    write(OUT/'section-index.json',dict(scope='23 selected substantial sections within seven fully downloaded transcribed books; not an exhaustive chapter inventory.',sections=sections))
    write(OUT/'concern-index.json',dict(connectionsAre='Editorial study companions; source citations remain separately attached to sections. No claim that all sermon bodies expound every topic.',concerns=concerns))
    deferred=[dict(title=books['flavel-mourners']['title'],sourceUrl=books['flavel-mourners']['infoUrl'],status='PDF and uncorrected OCR acquired before text-first instruction; further processing deferred.',files=[dict(url=f['url'],relativePath=f['relativePath'],sha256=f['sha256'],format=f['format']) for f in files if f.get('workKey')=='flavel-mourners' and f.get('format') in ['pdf','text']],notes=['1813 edition includes two John Newton appendices; do not attribute those to Flavel.','OCR is not counted among the seven transcribed books. Seek an accessible reliable transcription before resuming scan work.'])]
    write(OUT/'deferred-pdfs.json',dict(items=deferred))
    write(OUT/'record-manifest.json',dict(paths=records))
    lines=['# Pastoral care — text-first collection','', 'Seven complete transcribed books acquired; 23 substantial sections indexed by concern and intended audience. Ten concerns have reading routes. Grief currently has broader affliction readings; a dedicated bereavement transcription remains a gap.','', 'Use the online chapter links below. Original XML files are retained under `BibleProject/sources/library/source-ccel/`; the acquisition manifest records exact paths and hashes. No more downloads, OCR or PDF analysis were performed after the owner requested a text-first approach.','', '## Readable sources','']
    for key in xmlfiles:
        b=books[key]; lines.append(f"- [{b['title']}]({b['infoUrl']}) — complete transcribed source acquired.")
    lines += ['', '## Concern routes','']
    for c in concerns:
        lines += ['### '+c['concern'].capitalize(), '']
        for s in sections:
            if s['id'] in c['sectionIds']:
                lines.append(f"- [{books[next(k for k,b in books.items() if b['workId']==s['workId'])]['title']}: {s['title']}]({s['url']}) — {s['intendedAudience']}. {s['readingPurpose']}")
        lines.append('')
        lines.append('Scripture companion: **'+c['scriptureCompanion']['reference']+'**. Sermon leads: '+('; '.join(f"[{w['title']}](../../catalog/works/{w['workId']}.json)" for w in c['sermons']) or 'No verified main-text match found.')+' These links use catalog main texts, not a fresh sermon-body comparison.')
        if c['limitation']: lines.append(c['limitation'])
        lines.append('')
    lines += ['## PDFs and other deferred material','', '- [Flavel, A Token for Mourners, 1813](https://archive.org/details/tokenformourners00flav): PDF and uncorrected OCR already retained. Further processing deferred. Includes Newton appendices, which require separate attribution. Exact files: [deferred list](deferred-pdfs.json).','', '## Boundaries','', 'The section index preserves original chapter titles, XML identifiers, parent works, authors, source Scripture citations and reproducible hashes. Reading purposes are editorial paraphrases; full chapters retain the original argument. Boston and Flavel\'s providential explanations and Gill\'s household teaching remain attributed historical positions, not a merged interpretation. Modern editorial notes and quoted authors must not be mistaken for the principal author.','', 'These are usable transcriptions, not a claim of flawless proofreading or exhaustive pastoral coverage. Six existing work/edition identities are reused; Owen\'s Of Temptation adds one. CCEL permits specified personal/educational uses; public redistribution of the electronic files is not cleared. [CCEL permissions](https://www.ccel.org/about/copyright.html).','', 'Next work, when requested: add reliable ready-made text for dedicated bereavement care; widen authors only through similarly accessible transcriptions. Keep scan-only candidates on the deferred list.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
    print(json.dumps(dict(transcribedBooks=len(xmlfiles),selectedSections=len(sections),concerns=len(concerns),sermonConnections=sum(len(c['sermons']) for c in concerns),canonicalRecords=len(records))))

if __name__=='__main__': build()
