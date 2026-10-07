"""Reviewed RB11 complete text offers; global ledger duplicate check, no DB writes."""
import importlib.util,json,re,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
SITE=Path(__file__).resolve().parents[1]
sp=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb11-acquire.py')
r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
R=r.base.REPORT
OFFERS=[
 ('spurgeon-treasury-part1','The Treasury of David: digital part 1, Psalms 1–87','Charles H. Spurgeon','https://www.monergism.com/thethreshold/sdg/spurgeon/Treasury%20of%20DavidVol%201%20-%20C.%20H.%20Spurgeon.epub','epub','source-monergism','Monergism two-part digital edition, part 1; not original seven-volume Volume I. Preface and Psalms 1–87; held digital part 2 supplies Psalms 88–150.','Historic Particular Baptist exposition; distinguish Spurgeon exposition from attributed historical quotations and sermon hints. Quoted authorities are not automatically approved teaching sources. Psalm commentary is not a liturgical requirement or exclusive-psalmody policy.'),
 ('mathis-habits','Habits of Grace: Enjoying Jesus through the Spiritual Disciplines','David Mathis','https://www.desiringgod.org/books/habits-of-grace.epub','epub','source-desiring-god','Crossway 2016; complete official offered EPUB, twenty-one chapters, introduction, epilogue and notes. Endorsements/newsletter/front matter are not author doctrine.','Conservative Baptist means of grace: Scripture, prayer and church fellowship, not merit or mechanical guaranteed results. Christian Hedonism and Cities Church continuationist context are source-specific; ordinance and corporate-worship discussion is attributed rather than a universal Baptist policy.'),
 ('chbc-prayer1','Class 4: Meeting with God through Prayer (Part 1)','Capitol Hill Baptist Church (Core Seminars; individual manuscript writer not identified)','https://www.capitolhillbaptist.org/sermon/class-4-meeting-with-god-through-prayer-part-1/','html','source-capitol-hill-baptist','Meeting with God series; displayed March 26, 2023. Complete written lesson including source quotations; no audio or slides.','Baptist prayer to the Father through the Son by the Spirit, grounded in Christ’s substitutionary mediation; Scripture governs assurance rather than emotions. Retain exact source references, including source spelling Hebrew 9:14; no silent correction.'),
 ('chbc-prayer2','Class 5: Prayer—Hindrances & Practicalities','Capitol Hill Baptist Church (Core Seminars; individual manuscript writer not identified)','https://www.capitolhillbaptist.org/sermon/class-5-prayer-hindrances-practicalities/','html','source-capitol-hill-baptist','Meeting with God series; displayed April 2, 2023. Complete offered written lesson, not a full published book.','Baptist Scripture-grounded pastoral help for prayer, distraction and ordinary habits. The lesson’s distinction between wandering attention and sin is its contextual pastoral judgment, not a blanket moral verdict for every distraction.'),
 ('dever-corporate','On the Use and Importance of Corporate Prayer','Mark Dever (interview; interviewer not identified)','https://www.9marks.org/article/use-and-importance-corporate-prayer/','html','source-9marks','Complete offered interview; current page February 26, 2010; linked 2008 journal context does not establish 2010 interview date.','Baptist corporate prayer and shared dependence on grace; public assurance of pardon from Scripture explicitly distinguished from priestly absolution. CHBC service order, prayer lengths, music and leader choices describe one church, not obligatory Baptist practice. Written and spontaneous prayers both permitted in this argument.'),
 ('hamilton-corporate','A Biblical Theology of Corporate Prayer','James M. Hamilton, Jr. (displayed Jim Hamilton)','https://www.9marks.org/article/biblical-theology-corporate-prayer/','html','source-9marks','Complete offered biblical-theology essay; current page February 25, 2010. Historical 2008 journal context is distinct from this displayed date.','Conservative Baptist OT-to-NT prayer through covenantal mediation and Christ’s sufficient sacrifice. Congregational prayer leaders represent people; they do not replace Christ or constitute a new sacrificial priesthood. Messianic-Psalter and typological conclusions remain Hamilton’s argued interpretation.')
]

def main():
    prior=[]
    for i in json.loads((R/'input-audit.json').read_text('utf-8')):
        p=SITE/i['path']
        if p.suffix!='.json':continue
        d=json.loads(p.read_bytes())
        if isinstance(d,dict):prior.extend(a for a in d.get('files',[]) if isinstance(a,dict))
    targets=[];reviews=[];duplicates=[];decisions=[]
    for slug,title,author,url,fmt,source,edition,scope in OFFERS:
        raw,meta=r.base.fetch(url)
        matches=[dict(assetId=a.get('assetId'),url=a.get('url'),relativePath=a.get('relativePath')) for a in prior if a.get('url')==url or a.get('sha256')==meta['sha256']]
        duplicates.append(dict(url=url,sha256=meta['sha256'],matches=matches));assert not matches,(title,matches)
        selector='article.detail > footer' if source=='source-capitol-hill-baptist' else '.article-content-wrap' if fmt=='html' else None
        t=dict(workId='work-rb11-'+slug,title=title,author=author,url=url,format=fmt,sourceId=source,selector=selector,edition=edition,
          discoveryUrl='https://www.monergism.com/treasury-david-ebook' if slug.startswith('spurgeon') else 'https://www.desiringgod.org/books/habits-of-grace' if slug.startswith('mathis') else 'https://www.9marks.org/journal/corporate-prayer/' if source=='source-9marks' else url,
          completeness='Complete offered digital part, Psalms 1–87; not all original print volumes' if slug.startswith('spurgeon') else 'Complete offered book with front matter, notes and endorsements' if fmt=='epub' else 'Complete offered written lesson/interview/essay body; unrelated navigation excluded',
          evidenceOnly=True,theologicalEligibility='eligible-within-declared-subject-scope',eligibilityEvidence='theological-decisions.json',
          theologicalScope=scope,admissionRole='prayer-worship-source-with-quotation-editorial-and-rights-holds',
          rightsCategory='historical-work-modern-digital-edition-and-quotation-review' if slug.startswith('spurgeon') else 'official-offered-private-reading-no-corpus-license',
          rightsEvidence='Official publisher/ministry offers this exact complete file or readable body. Named private personal reading acquisition only; no republication or systematic retrieval license inferred. Historical Spurgeon text and modern digital edition apparatus/quoted contributors require separate treatment.' if slug.startswith('spurgeon') else 'Official offered download or complete written body. Copyright remains with publisher/author; personal reading witness only. DG permissions explicitly distinguish non-Piper authors and publisher-controlled books. No corpus/redistribution/embedding permission inferred.')
        txt=r.extract(raw,t);words=len(re.findall(r"\b[\w'-]+\b",txt));assert words>1800,(title,words)
        lines=[x for x in txt.splitlines() if len(x)>60]
        t.update(minimumWords=int(words*.98),requiredMarkers=[re.escape(lines[0][:65]),re.escape(lines[-1][-65:])])
        if fmt=='html':assert len(r.base.soup(raw).select(selector))==1
        targets.append(t);reviews.append(dict(workId=t['workId'],source=meta,wordCount=words,replacementCharacters=txt.count('\ufffd'),selector=selector,newOCR=False,imageExtraction=False,quality='Existing complete EPUB spine or exact complete written-body selector; structural verification, not critical textual collation.'))
        decisions.append(dict(workId=t['workId'],decision='eligible-within-declared-subject-scope',actualWorkReview=scope,anchorEvidence='theological-evidence.json',globalAuthorApproval=False,corpusAdmission=False))
    for name,d in [('targets.json',targets),('selected-text-review.json',reviews),('candidate-duplicate-audit.json',dict(priorLedgerRecords=len(prior),candidates=duplicates)),('theological-decisions.json',dict(mission='RB11',decisions=decisions,corpusAdmission=False))]:r.base.write(R/name,d)
    print('PREPARED',len(targets),'complete offered texts;',sum(x['wordCount'] for x in reviews),'words; compared',len(prior),'prior ledger records')
if __name__=='__main__':main()
