"""Build metadata-only mission study tables; no publisher text or DB writes."""
import json
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB07'


def read(name):
    return json.loads((R/name).read_text(encoding='utf-8'))


def write(name, value):
    text = json.dumps(value,ensure_ascii=False,indent=2)+'\n' if not isinstance(value,str) else value.rstrip()+'\n'
    (R/name).write_text(text,encoding='utf-8',newline='\n')


def cell(value):
    return str(value or 'Not stated').replace('|',' / ').replace('\n',' ')


def main():
    files=read('acquisition-manifest.json')['files']
    works=read('chapter-map.json')['works']
    by={w['workId']:w for w in works if w['workId']}
    heldfull=next(w for w in works if w['assetId']=='asset-rb04-f9ea063dff9952ca931d')
    evans=by['work-rb07-evans-sermons']
    scopes=[]
    for a in files:
        scopes.append(dict(assetId=a['assetId'],workId=a['workId'],originalSha256=a['sha256'],
            evidenceOnly=True,publicHostingAllowed=False,publicFullTextIndexAllowed=False,
            integrated=False,coreTeachingApproved=False,
            intendedUse='Source-attributed private historical/documentary reading, with selected gospel sermon study after contributor and doctrinal review.',
            holds=['Retain author/editor/translator roles and nested quotations.',
                'Reconcile rights and selected-component rules before aggregate import.',
                'Deduplicate underlying works and passages across witnesses.',
                'Do not turn colonial descriptions, narrator claims or mission counts into current facts.'],
            completeness=a['completeness'],rightsCategory=a['rightsCategory'],rightsEvidence=a['rightsEvidence']))
    write('intake-scope.json',dict(mission='RB07',files=scopes,dbTouched=False,
        importerEnforcementClaimed=False,aggregationGate='Owner-directed post-RB14 intake, not this mission'))
    write('bibliography.json',dict(mission='RB07',sourceFirst=True,registryApproval=False,
        newWitnessCount=len(files),newOriginalCount=len(files),
        countRule='Six book/collection witnesses plus one older partial appendix witness supplying the complete 1805 Agreement. Not seven complete books or seven wholly new underlying works.',
        works=[dict(workId=a['workId'],title=a['title'],author=a['author'],edition=a['edition'],
            completeness=a['completeness'],assetIds=[a['assetId']],url=a['url'],originalSha256=a['sha256']) for a in files]))

    def entry(work, prefixes):
        selected=[]
        for prefix in prefixes:
            matches=[u for u in work['locations'] if u['title'].startswith(prefix)]
            assert matches,(work['title'],prefix)
            selected.extend(matches)
        return dict(assetId=work['assetId'],title=work['title'],originalSha256=work['originalSha256'],
            readingUnits=[{k:u.get(k) for k in ('title','locator','role','date','recipient','componentId')} for u in selected])

    paths=[
      ('Why preach to everyone?', 'Compare duty, gospel invitation and sovereign grace without conflating means with regeneration.',
       'Historical mission documents are not complete confessions; retain Fuller duty-faith distinctions and editor voices.',
       [entry(by['work-l12-carey'],['Section 1.','Section 4.','Section 5.']),entry(heldfull,['Sermon III.','Importance of a Lively']),entry(by['work-rb07-ward-farewell-letters'],['Letter 2.','Letter 3.','Letter 17.'])]),
      ('What gospel was proclaimed?', 'Read sustained Baptist preaching on Christ, atonement, resurrection and justification.',
       'Evans is an English translation, with two translation hands; figurative preaching is not an oral transcript or an exact historical report.',
       [entry(evans,['Sermon 5.','Sermon 8.','Sermon 13.','Sermon 19.','Sermon 21.','Sermon 22.'])]),
      ('What did Carey and his colleagues promise to do?', 'Study the complete 1805 Agreement: persuasion, Christ crucified, local leadership, translation and prayer.',
       'Older institutional transcription contains defects and lacks signatures. Appendix III ends mid-sentence and is not selected for intake.',
       [entry(by['work-rb07-carey-smith-appendix-1885'],['Appendix I.']),entry(by['work-rb07-smith-carey-life'],['Chapter 5.'])]),
      ('How were local churches and leaders developed?', 'Follow local preachers, church growth, trust, translation and missionary training.',
       'Historical terminology, colonial assumptions and reported counts require attribution; do not infer present-day policy from one mission.',
       [entry(by['work-rb07-serampore-letters'],['Native preachers and church growth','Local mission, translation and accounts']),entry(by['work-rb07-ward-farewell-letters'],['Letter 12.','Letter 14.','Letter 15.','Letter 18.']),entry(by['work-rb07-smith-carey-life'],['Chapter 6.','Chapter 14.'])]),
      ('How did churches cooperate across the Atlantic?', 'Use dated correspondence to trace recommendations, travel, support and Baptist missionary responsibility.',
       'Letters concern particular events; quoted third-party dialogue and plate captions must not become the sender\'s own theological assertions.',
       [entry(by['work-rb07-serampore-letters'],['Commendation and funding','Arranging missionary passage','Missionary passage terms','Cooperation for Judson','Commendation of missionary families','Church renewal']),entry(heldfull,['Establishment of the Glasgow'])]),
      ('Why did Judson seek believer baptism?', 'Read the three 1812 letters and Carey\'s October 1812 report before later narration.',
       'These are edited printed witnesses, not autographs. Do not convert their baptism convictions into a complete harmonized covenant system.',
       [entry(by['work-rb07-edward-judson-life'],['Letter acknowledging','Letter requesting','Appeal for Baptist']),entry(by['work-rb07-serampore-letters'],['Judson believer baptism']),entry(by['work-rb07-taylor-luther-rice'],['Chapter 6'])]),
      ('What advice was given to missionary candidates?', 'Compare Judson\'s 1832 advice, Ward\'s student letter and Fuller\'s preaching letters.',
       'Judson letter is June 25, 1832, not 1847; distinguish historical counsel from universally binding requirements.',
       [entry(by['work-rb07-edward-judson-life'],['Appendix D.']),entry(by['work-rb07-ward-farewell-letters'],['Letter 18.']),entry(heldfull,['Thoughts on Preaching'])]),
      ('How did missionaries persevere through loss?', 'Study dated missionary correspondence, captivity and affliction with identifiable narrators.',
       'Memoirs are retrospective and sometimes condensed; heroic narrative, editorial interpretation and firsthand evidence remain separate.',
       [entry(by['work-rb07-edward-judson-life'],['Chapter 7.','Chapter 12.','Appendix A.']),entry(by['work-rb07-serampore-letters'],['Restrictions on missionary labors','Evangelism, vernacular translation and loss']),entry(heldfull,['Pearce chapter IV.'])]),
      ('What place did Scripture translation and prayer have?', 'Read primary translation reports and prayer appeals alongside a later biography.',
       'Publication statistics are dated source claims; linguistic/translation quality cannot be established by a mission report alone.',
       [entry(by['work-rb07-serampore-letters'],['Missionary correspondence and translation','Reception of Chamberlain']),entry(by['work-rb07-ward-farewell-letters'],['Letter 10.','Letter 13.','Letter 26.']),entry(by['work-rb07-smith-carey-life'],['Chapter 10.'])]),
      ('How were missions defended and home churches mobilized?', 'Reuse Fuller\'s three-part Apology, Pearce memoir and Rice\'s account of missionary organization.',
       'Fuller quotes opponents and external testimonies; Rice memoir was institutionally commissioned. Denison\'s closing poem is not Rice autobiography.',
       [entry(heldfull,['Apology for Missions','Memoirs of Samuel Pearce','Pearce chapter II.','Pearce chapter III.']),entry(by['work-rb07-taylor-luther-rice'],['Chapter 7.','Chapter 8.','Chapter 16'])])
    ]
    routes=[dict(question=q,purpose=p,limitations=l,entries=e,inferredFromVectors=False) for q,p,l,e in paths]
    write('reading-paths.json',dict(mission='RB07',paths=routes,dbTouched=False))
    md='# RB07: missions and gospel proclamation reading paths\n\nTen study questions with exact source locations. New text witnesses and already-held Fuller/Carey/Bonar editions are distinguished in the full map. All new parents and 69 private slices remain held for contributor-aware aggregate intake. No graph or DB was changed.\n\n'
    for n,p in enumerate(routes,1):
        md+=f"## {n}. {p['question']}\n\n{p['purpose']}\n\n{p['limitations']}\n\n| Witness | Reading unit | Source location | Voice |\n| --- | --- | --- | --- |\n"
        for e in p['entries']:
            for u in e['readingUnits']:
                md+=f"| {cell(e['title'])} | {cell(u['title'])} | `{u['locator']}` | {cell(u['role'])} |\n"
        md+='\n'
    md+='## Every mapped source unit\n\nChapters, letters, sermons, EPUB navigation and nested documents can overlap; 198 units do not mean 198 new works. Coordinates use immutable source hashes and the derivative hash recorded in [chapter-map.json](chapter-map.json).\n\n'
    for w in works:
        md+=f"### {w['title']}\n\n{w['status']}; {w['author']}. Original `{w['assetId']}`, SHA-256 `{w['originalSha256']}`.\n\n| Unit | Exact location | Voice / role |\n| --- | --- | --- |\n"
        for u in w['locations']:
            md+=f"| {cell(u['title'])} | `{u['locator']}` | {cell(u.get('role') or u.get('kind'))} |\n"
        md+='\n'
    write('READING-MAP.md',md)
    md='# RB07: dated documents before any graph\n\nThese 29 selected document records are source-attributed table entries, not an exhaustive correspondence inventory. Document date differs from edition publication date. OCR uncertainties remain visible. Primary means an attributed author document reproduced in a later witness; it does not mean an autograph has been inspected.\n\n| Date as supported | Author / voice | Recipient | Document | Edition witness | Exact location | Editorial limits |\n| --- | --- | --- | --- | --- | --- | --- |\n'
    wb={w['assetId']:w for w in works}
    for d in sorted(read('document-map.json')['documents'],key=lambda d:(d['date'] or '9999',d['author'])):
        md+='| '+' | '.join(cell(v) for v in [d['date'],d['author'],d['recipient'],d['title'],wb[d['assetId']]['title'],d['locator'],d['editorialContext']])+' |\n'
    md+='\nSerampore collection title says 1800–1816, but the selected 1794 Carey letter falls outside it. One Carey December 1800 day is unreadable; Chamberlain\'s 1812 opening/closing dates conflict. Fuller\'s damaged August 1804 year is corroborated by this edition\'s introduction. The plate caption ANDREW FULLER inside Sutcliff\'s letter is not its byline. The March 1813 signature block places To beside Daniel Sharp in OCR: his role remains unresolved rather than silently becoming a recipient or co-author.\n'
    write('DOCUMENT-TABLE.md',md)
    exceptions=[
      dict(target='Fuller: Last Remains (Belcher, 1856)',status='readable-authorized-body-unverified',url='https://onlinebooks.library.upenn.edu/webbin/book/lookupname?key=Belcher%2C+Joseph%2C+1794-1859',reason='Catalogue route is page images; no readable offered download verified. Do not substitute Morris 1826 or launch OCR.'),
      dict(target='Fuller: Miscellaneous Pieces (Morris, 1826)',status='private-text-inspected-not-promoted',url='https://archive.org/details/miscellaneouspie00full',reason='Substantial overlap with held 1846 works. Audit complete contents before acquisition; not Belcher 1856.'),
      dict(target='Wayland: Judson memoir volume 2',status='TLS-certificate-blocked-alternative-used',url='https://baptiststudiesonline.com/wp-content/uploads/2018/05/Judson-Adoniram-Wayland-Francis-v-2.pdf',reason='Certificate validation failed. No insecure bypass; clean 1883 Edward Judson witness acquired instead, with condensation limits.'),
      dict(target='1802 ordination discourses: Sutcliff, Ryland, Fuller',status='existing-PDF-text-layer-inspected-not-promoted',url='https://careycenter.wmcarey.edu/ryland-fuller-sutcliffe/1802.pdf',reason='56 pages have existing text but rough long-s OCR. Private inspection only; no image rendering/OCR. Cleaner priority material won; Fuller portion overlaps held works.'),
      dict(target='Judson archival correspondence',status='facsimile-only-route-deferred',url='https://sbhla.org/digital-resources/adoniram-judson-correspondence/',reason='No image acquisition. Seek an offered transcription if later needed.'),
      dict(target='Wholesome Words: Serampore Agreement',status='discovery-only-no-reuse-permission-assumed',url='https://www.wholesomewords.org/missions/bcarey13.html',reason='Personal download rules do not authorize electronic republication. Institutional historical witness acquired instead; see copyright page.',termsUrl='https://www.wholesomewords.org/copyright.html'),
      dict(target='Fuller shorthand evening prayer notes, modern first publication',status='modern-editorial-rights-review-needed',url='https://www.gs.edu/journal/volume-1-issue-1-winter-2025/andrew-fullers-shorthand-notes-on-the-conduct-of-evening-prayer-meetings/',reason='Modern translation/editorial work and contributor rights require review. No modern body acquired.'),
      dict(target='Sutcliff: Jealousy for the Lord of Hosts (1791)',status='catalogue-only-clean-body-unverified',url='https://catalog.folger.edu/record/865123',reason='Paired Fuller Danger of Delay held; Sutcliff clean offered body not verified. Do not hunt guessed private URLs.'),
      dict(target='Carey older Smith Appendix III',status='retained-parent-partial-component-excluded',url='https://careycenter.wmcarey.edu/gsmith/append.htm',reason='1867 George Smith memorandum stops mid-sentence. Complete 1805 Agreement and separate 1885 report mapped; do not call the entire appendix complete.'),
      dict(target='Judson advice guessed Baptist History URL',status='404-no-variant-hunt',url='https://baptisthistoryhomepage.com/judson.advice.html',reason='Complete dated 1832 advice acquired in Edward Judson Appendix D instead.'),
      dict(target='Ann Hasseltine Judson primary letters / James D. Knowles memoir',status='late-discovery-not-acquired',
           url='https://www.loc.gov/item/03007916/',edition='Boston: Lincoln & Edmands, 1829; distinguish offered 1832 fifth edition elsewhere.',
           reason='Institutional catalogue confirms title, editor and public-domain status, but clean offered textual body and contributor scope were not verified before closeout. Prefer Ann-authored dated documents; do not add another youthful composite biography without an overlap audit.',
           candidateIdentifier='memoirofmrsannhj00know_2',
           nextAction='Read offered metadata and TXT listings, audit existing Ann quotations in Edward Judson/Bonar, then acquire only useful permitted readable coverage; stop at scan-only routes.')]
    write('source-exceptions.json',dict(mission='RB07',entries=exceptions,noNewOCR=True,noImageAcquisition=True))
    print('DOCUMENTED',len(files),'witness scopes;',len(routes),'study paths;',len(exceptions),'exceptions')


if __name__=='__main__':
    main()
