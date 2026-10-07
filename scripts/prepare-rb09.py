"""Prepare only reviewed complete RB09 texts from cached offered sources."""
import importlib.util,json,re,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
sp=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('rb09-acquire.py'))
r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)

def main():
    fp='https://frame-poythress.org/'
    rows=[
      ('poythress-god-centered','God-Centered Biblical Interpretation','Vern S. Poythress',fp+'ebooks/god-centered-biblical-interpretation/','html','1999 P&R author/publisher-authorized complete HTML edition; 18 numbered chapters and bibliography'),
      ('poythress-returning-king','The Returning King: A Guide to the Book of Revelation','Vern S. Poythress',fp+'ebooks/the-returning-king/','html','2000 P&R complete author/publisher-authorized HTML; introduction and twelve commentary divisions'),
      ('poythress-understanding-dispensationalists','Understanding Dispensationalists','Vern S. Poythress',fp+'ebooks/understanding-dispensationalists/','html','Author-offered HTML carrying summer 1986 opening and POSTSCRIPT 1993; fourteen chapters, bibliography and second-edition postscript. Do not date the whole witness as 1986.'),
      ('poythress-reading-word','Reading the Word of God in the Presence of God: A Handbook for Biblical Interpretation','Vern S. Poythress',fp+'wp-content/uploads/2016/09/PoythressVernReadingTheWordOfGodInThePresenceOfGodAHandbookForBiblicalInterpretation.pdf','pdf','Crossway 2016; first printing stated; PDF ISBN 9781433543258; 466 source PDF pages'),
      ('poythress-interpreting-eden','Interpreting Eden: A Guide to Faithfully Reading and Understanding Genesis 1-3','Vern S. Poythress',fp+'wp-content/uploads/2021/10/Poythress-Vern-Interpreting-Eden-A-Guide-To-Faithfully-Reading-And-Understanding-Genesis-1-3.pdf','pdf','Crossway copyright/first printing 2019; offered file includes 2021 production timestamps; PDF ISBN 9781433558740; 393 source pages, not a verified new 2021 edition'),
      ('bethlehem-mining-gods-word',"Mining God's Word: How to Study the Bible - Student Workbook",'Bethlehem College & Seminary (institutional curriculum; individual writer not identified)', 'https://bcsmn.edu/wp-content/uploads/2017/03/MGW-Student-Guide-FINAL.pdf','pdf','Copyright 2016 Bethlehem College & Seminary; complete offered 204-page student workbook, twelve lessons and three appendices'),
      ('ascol-hermeneutics-preaching','Hermeneutics and Expository Preaching','Tom Ascol','https://founders.org/articles/hermeneutics-and-expository-preaching/','html','Complete offered article; internal note identifies September/October 2015 Expositor; current page displays May 7, 2020. Site JSON uploader Hannah Ascol is not the displayed author.'),
    ]
    for slug,title,url,date in [
      ('job','Class 11: Job','https://www.capitolhillbaptist.org/sermon/class-11-job','2014-08-03'),
      ('psalms','Class 12: Psalms','https://www.capitolhillbaptist.org/sermon/class-12-psalms/','2014-08-03'),
      ('proverbs','Class 13: Proverbs','https://www.capitolhillbaptist.org/sermon/class-13-proverbs/','2014-08-03'),
      ('ecclesiastes-song','Class 14: Ecclesiastes & Song of Songs','https://www.capitolhillbaptist.org/sermon/class-14-ecclesiastes-song-of-songs/','2024-12-01')]:
        rows.append(('chbc-'+slug,title,'Capitol Hill Baptist Church (Core Seminars; individual manuscript writer not identified)',url,'html','Complete offered written lesson in Old Testament Overview; displayed lesson date '+date+'; not media, handout PDF or a full verse-by-verse commentary'))
    rows.extend([
      ('hamilton-seed-woman','The Skull Crushing Seed of the Woman: Inner-Biblical Interpretation of Genesis 3:15','James M. Hamilton, Jr.','http://jimhamilton.info/wp-content/uploads/2008/04/hamilton_sbjt_10-2.pdf','pdf','Author-offered SBJT 10/2 article, printed pp.30-54; complete 25-page essay with 101 notes; historic displayed Southwestern faculty affiliation retained separately from current Southern biography'),
      ('hamilton-song-music','The Messianic Music of the Song of Songs: A Non-Allegorical Interpretation','James M. Hamilton, Jr.','http://jimhamilton.files.wordpress.com/2006/10/hamilton-article-from-wtj_fall06_topress-3.pdf','pdf','WTJ 68 (2006), printed pp.331-345; complete 15-page author-offered typeset/prepress-named witness with 78 notes; not the later 2015 commercial Song monograph')
    ])
    targets=[];review=[]
    for slug,title,author,url,fmt,edition in rows:
        raw,meta=r.base.fetch(url)
        poy=slug.startswith('poythress');bcs=slug.startswith('bethlehem');chbc=slug.startswith('chbc')
        selector='.entry-content' if poy else 'article.detail > footer' if chbc else '.elementor-widget-theme-post-content'
        target=dict(sourceId='source-frame-poythress' if poy else 'source-bethlehem-curriculum' if bcs else 'source-capitol-hill-baptist' if chbc else 'source-founders-ministries',
          workId='work-rb09-'+slug,title=title,author=author,url=url,format=fmt,edition=edition,
          discoveryUrl=fp+'ebooks/' if poy else 'https://bcsmn.edu/profile/mining-gods-word-pdf-download/' if bcs else 'https://www.capitolhillbaptist.org/resources/core-seminars/series/old-testament-overview/' if chbc else url,
          selector=selector if fmt=='html' else None,excludeSelectors=['.sharedaddy','.jp-relatedposts'],
          completeness='Complete offered book body and offered apparatus; not a critical collation of print indexes' if poy else 'Complete offered student workbook; cited supplemental textbooks are not included' if bcs else 'Complete offered written lesson, including source quotations and notes' if chbc else 'Complete offered essay body, including original-publication note',
          evidenceOnly=True,theologicalEligibility='eligible-within-declared-subject-scope',eligibilityEvidence='theological-decisions.json',
          admissionRole='source-attributed-hermeneutics-with-contributor-quotation-and-rights-holds',
          theologicalScope='Conservative Presbyterian/Reformed interpretation and exegesis; covenant/ordinance, amillennial, creation-day and multiperspectival positions attributed, not Baptist defaults.' if poy else 'Reformed soteriology and baptistic practice; genre/inductive-study curriculum only. Continuationist affections and optional outside textbooks not globally approved.' if bcs else 'Conservative Baptist written genre overview; actual quotations and uncertain source bylines require separate roles; no blanket approval of every named authority.' if chbc else 'Confessional Reformed Baptist Scripture/genre/authorial-intent essay; legal/political analogies are author context, not project legal guidance.',
          rightsCategory='author-publisher-explicit-personal-download-no-retrieval-license' if poy else 'ministry-offered-modern-text-private-personal-study-no-public-corpus-license',
          rightsEvidence='Author ebook desk explicitly permits downloading/printing electronic files for personal use; publication rights retained. Specific HTML books state publisher permission for internet posting. No retrieval-system, redistribution or public full-text hosting permission inferred.' if poy else 'Institutional download desk explicitly offers complete student workbook; copyright 2016/all rights reserved. Private reading download only; modification, redistribution and corpus/retrieval use need separate permission.' if bcs else 'Official ministry offers complete written lesson/article publicly; copyright retained. Limited private reading witness; no bulk, redistribution or public full-text retrieval permission established.')
        if slug=='ascol-hermeneutics-preaching':target['trimAtText']='Follow Tom Ascol:'
        if slug.startswith('hamilton-'):
            target.update(sourceId='source-james-hamilton-scholarship',discoveryUrl='https://www.sbts.edu/faculty/james-m-hamilton/',
              selector=None,completeness='Complete offered scholarly essay with source footnotes; not a full commentary/book or entire journal issue',
              theologicalScope='Conservative Southern Baptist inner-biblical/typological exegesis; specific seed/serpent or Song messianic thesis attributed, not consensus or project doctrine. Cited opponents, ancient documents and later scholarship remain quotations.',
              rightsCategory='author-offered-journal-essay-personal-reading-corpus-use-review',
              rightsEvidence='Exact author-hosted full PDF publicly offered through official Southern faculty article bibliography; existing clean text layer. Private reading witness only; journal/author rights retained, no general retrieval-system, modification or republication license established.')
        text=r.extract(raw,target);words=len(re.findall(r"\b[\w'-]+\b",text))
        assert words>1500,(slug,words)
        lines=[s for s in text.splitlines() if len(s)>45]
        target['minimumWords']=int(words*.97)
        target['requiredMarkers']=[re.escape(lines[0][:65]),re.escape(lines[-1][-65:])]
        if fmt=='pdf':
            import pymupdf
            with pymupdf.open(stream=raw,filetype='pdf') as pdf:
                target['expectedSourcePdfPages']=len(pdf)
                review.append(dict(workId=target['workId'],**meta,wordCount=words,replacementCharacters=text.count('\ufffd'),
                 pageTextCounts=[len(p.get_text().strip()) for p in pdf],replacementPages=[dict(sourcePdfPage=i+1,count=p.get_text().count('\ufffd')) for i,p in enumerate(pdf) if '\ufffd' in p.get_text()],
                 assessment='Existing substantial prose text throughout; replacement glyphs are contents/index leaders or section bullets, not missing prose words. No new OCR, rendering or separate images.'))
        else:
            assert len(r.base.soup(raw).select(selector))==1
            assert 'Share this:' not in text and 'Leave a Reply' not in text
            review.append(dict(workId=target['workId'],**meta,wordCount=words,replacementCharacters=text.count('\ufffd'),selector=selector,selection='Complete offered authored/written body, excluding unrelated navigation and social controls'))
        targets.append(target)
    r.base.write(r.base.REPORT/'targets.json',targets)
    r.base.write(r.base.REPORT/'selected-text-review.json',review)
    print('PREPARED',len(targets),'complete offered targets;',sum(x['wordCount'] for x in review),'source derivative words')
if __name__=='__main__':main()
