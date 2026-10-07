"""Offline source-specific RB09 genre/passages table. No DB, graph or models."""
import hashlib
import importlib.util
import json
import re
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB09'
sp = importlib.util.spec_from_file_location('shared', SITE/'scripts/map-rb04.py')
shared = importlib.util.module_from_spec(sp); sp.loader.exec_module(shared)
sp = importlib.util.spec_from_file_location('collector', SITE/'scripts/rb09-acquire.py')
r = importlib.util.module_from_spec(sp); sp.loader.exec_module(r)

def read(name): return json.loads((R/name).read_text(encoding='utf-8'))
def sha(raw): return hashlib.sha256(raw).hexdigest()
def write(name, x):
    text = x.rstrip()+'\n' if isinstance(x, str) else json.dumps(x, ensure_ascii=False, indent=2)+'\n'
    (R/name).write_text(text, encoding='utf-8', newline='\n')
def cell(x): return str(x or '').replace('|', ' / ').replace('\n', ' ')

HANDBOOK = [
 (15,'1 Foundations for Interpretation'),(27,'2 Principles for Interpreting the Bible'),
 (39,'3 Complementary Starting Points for Interpretation'),(47,'4 Three Simple Steps in Interpretation'),
 (55,'5 The Three Steps as Perspectives'),(63,'6 Correlation: Comparing Passages'),
 (75,'7 Transmission'),(85,'8 Original Contexts'),(101,'9 Original Communication'),
 (109,'10 Dual Authorship'),(119,'11 Difficulties with Authorship'),(131,'12 Basic Linguistic Structures'),
 (139,'13 Understanding Linguistic Subsystems'),(153,'14 Units in Contrast, Variation, and Distribution'),
 (165,'15 Meaning'),(175,'16 Figurative Language'),(183,'17 Words and Concepts'),
 (197,'18 Discourse'),(207,'19 Genre'),(215,'20 Using Commentaries'),(223,'21 The History of Redemption'),
 (233,'22 Christocentric Interpretation'),(247,'23 Typology'),(257,'24 Additional Stages Reflecting on Typology'),
 (263,'25 Varieties of Analogies'),(275,'26 Varieties of Types'),(285,'27 Antitypes'),(293,'28 Themes'),
 (305,'29 Hermeneutics Outline in Detail'),(311,'30 Alternate Paths of Interpretation'),
 (323,'31 The Fulfillment Approach'),(335,'32 Boundaries for Interpretation'),
 (355,'33 Proverbs 10:1'),(375,'34 Psalm 4:8'),(387,'35 Amos 1:3'),(399,'Conclusion'),
 (403,'Appendix A: Redeeming How We Interpret'),(417,'Appendix B: Secular Views of Meaning'),
 (431,'Appendix C: Interpreting Human Texts'),(435,'Appendix D: Redeemed Analogues to Critical Methods'),
 (441,'Appendix E: Philosophical Hermeneutics'),(445,'Bibliography'),(452,'General Index'),(460,'Scripture Index')]
EDEN = [(13,'Foreword by D. A. Carson'),(16,'Acknowledgment'),(17,'Introduction: The Need'),
 (25,'1 God'),(37,"2 Interpretive Implications of God's Activity"),(51,'3 The Status of the Bible'),
 (57,'4 Interacting with Scientific Claims'),(65,'5 Three Modern Myths in Interpreting Genesis 1'),
 (105,'6 The Genre of Genesis'),(131,'7 Summary of Hermeneutical Principles'),
 (137,'8 Correlations with Providence in Genesis 1'),(171,'9 The Water Above (Gen. 1:6-8)'),
 (187,'10 Correlations with Providence in Genesis 2-3'),(213,'11 Time in Genesis 1'),
 (247,'12 Implications for Modern Views of Genesis 1'),(259,'13 Attitudes and Expectations'),
 (265,'14 The Days of Genesis 1'),(277,'15 Factuality and Literalism'),(287,'Conclusion'),
 (291,'Appendix A: Genesis 1:1 Is the First Event, Not a Summary'),(323,'Appendix B: The Meaning of Accommodation'),
 (341,'Appendix C: A Misunderstanding of Calvin on Genesis 1:6-8 and 1:5'),
 (355,'Appendix D: Multiple Interpretations of Ancient Texts'),(361,'Bibliography'),
 (373,'Subject Index'),(383,'Scripture Index')]
WORKBOOK = [(1,'Course Syllabus'),(5,'Summary of Philippians'),(7,"Lesson 1: God's Word Is a Treasure Mine"),
 (31,'Lesson 2: There Is a Meaning in This Text'),(41,'Lesson 3: Stare at the Fish'),
 (55,'Lesson 4: Query the Text'),(65,'Lesson 5: Scripture Interpreting Scripture'),
 (79,'Lesson 6: Grasping the Flow'),(89,'Lesson 7: Every Word of God Proves True'),
 (101,'Lesson 8: The Blessing of Different Translations'),(115,'Lesson 9: Prophecies, Parables, Proverbs - Oh My!'),
 (131,'Lesson 10: Of Making Many Books There Is No End'),(155,'Lesson 11: Applying the Word'),
 (175,'Lesson 12: Study the Word!'),(183,'Appendix A: The Student, the Fish, and Agassiz'),
 (189,'Appendix B: An Extra Copy of the Text of Philippians'),(195,'Appendix C: Old and New Testament Background Exercises')]

def main():
    new = read('acquisition-manifest.json')['files']; held = read('holdings-audit.json')['files']
    chosen = {a['assetId'] for a in read('duplicate-decisions.json')['alreadyHeldSkipped']}
    chosen |= {a['assetId'] for a in held if a.get('workId')=='work-rb03-keach-parables'}
    # The previously held Book III uses a legacy identifier.
    chosen |= {a['assetId'] for a in held if a.get('author') and 'Keach' in a['author']
               and 'parables' in str(a.get('title')).lower() and a.get('format')=='epub'}
    works = []; new_ids = {a['assetId'] for a in new}
    for a in held+new:
        if a['assetId'] not in chosen|new_ids: continue
        d = a.get('auditDerivative') if a['assetId'] not in new_ids else a['derivedText']
        d = d or a.get('derivedText'); assert d
        raw = (SITE/d['path']).read_bytes(); assert sha(raw)==d['sha256']
        lines = raw.decode('utf-8').splitlines()
        w = {k:a.get(k) for k in ('assetId','workId','title','author','relativePath','url','edition','completeness')}
        w.update(originalSha256=a.get('sha256') or a['actualSha256'],derivative=d,
          status='new-witness' if a['assetId'] in new_ids else 'already-held-reused',locations=[])
        def unit(lo, hi, title, role='authored-argument-with-nested-citations', **extra):
            assert 1<=lo<=hi<=len(lines), (w['title'],lo,hi)
            u = dict(title=title,sourceLabel=lines[lo-1],locator=f'derivative-lines:{lo}-{hi}',
              lineStart=lo,lineEnd=hi,role=role,author=w['author'],**extra)
            w['locations'].append(u); return u
        if a['relativePath'].endswith('.epub'):
            w['locations'] = shared.epub_locations(a)
            for u in w['locations']:u.update(author=w['author'],role='held-source-navigation-requiring-context')
        elif a['format']=='pdf':
            starts=[i+1 for i,s in enumerate(lines) if s.startswith('SOURCE PDF PAGE: ')]
            assert len(starts)==a['expectedSourcePdfPages']
            for i,(lo,hi) in enumerate(zip(starts,[s-1 for s in starts[1:]]+[len(lines)])):
                unit(lo,hi,'Source PDF page '+str(i+1),'source-page-navigation-not-chapter',sourcePdfPage=i+1)
            key=a['workId'].removeprefix('work-rb09-')
            is_hamilton=key.startswith('hamilton-')
            table,offset = ([], -29 if key=='hamilton-seed-woman' else -330) if is_hamilton else (HANDBOOK,1) if key=='poythress-reading-word' else (EDEN,1) if key=='poythress-interpreting-eden' else (WORKBOOK,6)
            w['printedPageOffset']=offset
            if is_hamilton:
                unit(1,len(lines),'Complete offered scholarly essay','authored-essay-with-footnotes-and-quoted-voices',
                  sourcePdfPageStart=1,sourcePdfPageEnd=len(starts),printedPageStart=1-offset,printedPageEnd=len(starts)-offset)
                if key=='hamilton-seed-woman':
                    labels=['Introduction','The Context of Genesis 3:15','The Collective-Singular Seed',
                      'Broken Heads','Broken Enemies','Trampled Underfoot','Licking the Dust','Stricken Serpents',
                      'Saving Smashing','Genesis 3:15 in the New Testament','Conclusion']
                    found=[]
                    for label in labels:
                        ix=next((i+1 for i,s in enumerate(lines) if s.strip()==label),None)
                        assert ix,(key,label)
                        found.append((ix,label))
                    found.sort()
                    for i,(lo,label) in enumerate(found):
                        unit(lo,found[i+1][0]-1 if i+1<len(found) else len(lines),label,
                          'authored-inner-biblical-essay-section-with-source-notes')
            for i,(page,label) in enumerate(table):
                source=page+offset; end=table[i+1][0]+offset-1 if i+1<len(table) else len(starts)
                role='navigation-or-editorial-apparatus' if any(t in label for t in ['Index','Bibliography','Acknowledgment','Syllabus','Summary']) else 'chapter-or-lesson-with-quoted-voices'
                if label.startswith('Foreword'):role='Carson-foreword-not-Poythress-authored'
                if 'Appendix A: The Student' in label:role='historical-study-illustration-not-approved-doctrinal-author'
                u=unit(starts[source-1],starts[end]-1 if end<len(starts) else len(lines),label,role,
                  sourcePdfPageStart=source,sourcePdfPageEnd=end,printedPageStart=page,printedPageEnd=end-offset)
                if label.startswith('Foreword'):u['author']='D. A. Carson'
        else:
            unit(1,len(lines),'Complete offered written body','source-with-quotations-and-metadata')
            node=r.base.soup((SOURCES/a['relativePath']).read_bytes()).select_one(a['selector'])
            headings=[h for h in node.select('h2,h3,h4,h5') if h.get_text(' ',strip=True)]
            starts=[]
            for h in headings:
                label=' '.join(h.get_text(' ',strip=True).split())
                if label.startswith(('Share this','Follow Tom')):continue
                parts=h.get_text('\n',strip=True).splitlines()
                ix=next((i+1 for i in range(len(lines)-len(parts)+1) if lines[i:i+len(parts)]==parts
                         and (not starts or i+1>starts[-1][0])),None)
                if ix:starts.append((ix,label))
            if 'chbc-' in a['workId']:
                keys={
                  'chbc-job':['Introduction to Wisdom Literature','Introduction to Job','We Often Suffer','We Only Sometimes Understand','We Can Always Trust','Conclusion'],
                  'chbc-psalms':['I. What are the Psalms','II. Who Wrote the Psalms, and When?','III.','IV. What Are the Different Kinds of Psalms?','V. How Do the Psalms Point Us to Jesus?','VI. How Do We Read the Psalms as Christians?','Conclusion'],
                  'chbc-proverbs':['Introduction','Context','Outline/Overview of the Book','What are the Proverbs?','How are the Proverbs interpreted?','Context for wise living:','Where is Jesus?','Conclusion'],
                  'chbc-ecclesiastes-song':['Introduction','ECCLESIASTES','Context','THE SONG OF SOLOMON','Conclusion']
                }[a['workId'].removeprefix('work-rb09-')]
                starts=[(i+1,s) for i,s in enumerate(lines) if any(s==k or (k=='III.' and s.startswith(k)) for k in keys)]
            for i,(lo,label) in enumerate(starts):
                hi=starts[i+1][0]-1 if i+1<len(starts) else len(lines)
                unit(lo,hi,label,'written-section-with-nested-quotations')
        works.append(w)
    by={w['workId']:w for w in works if w['status']=='new-witness'}
    def select(key,title_pattern):
        w=by['work-rb09-'+key]
        units=[u for u in w['locations'] if re.search(title_pattern,u['title'],re.I)
               and u['role'] not in {'source-page-navigation-not-chapter'}]
        assert units,(key,title_pattern)
        return dict(assetId=w['assetId'],title=w['title'],originalSha256=w['originalSha256'],
          sourceUrl=w['url'],locations=[{k:u.get(k) for k in ('title','locator','lineStart','lineEnd','sourcePdfPageStart','sourcePdfPageEnd','printedPageStart','printedPageEnd','author','role')} for u in units])
    paths=[]
    def path(key,question,purpose,entries,limits):
        paths.append(dict(id='rb09-'+key,question=question,purpose=purpose,entries=entries,limitations=limits,inferredFromVectors=False))
    path('genre','How does literary genre change the way a passage should be read?',
      'Identify the kind of communication before treating narrative, poetry, proverb, parable or prophecy as the same kind of statement.',
      [select('poythress-reading-word',r'^19 Genre$|^16 Figurative'),select('bethlehem-mining-gods-word',r'^Lesson 9:')],
      'Genre labels guide contextual reading; they do not excuse dismissing historicity or treating every proverb as a universal promise.')
    path('context','How do original historical and literary contexts constrain interpretation?',
      'Read communication to its original hearers alongside surrounding discourse and later biblical development.',
      [select('poythress-reading-word',r'^8 Original Contexts|^9 Original Communication|^18 Discourse'),select('bethlehem-mining-gods-word',r'^Appendix C:|^Lesson 10:'),select('ascol-hermeneutics-preaching',r'^Conviction about Interpretation$')],
      'Methods and background exercises are not a newly acquired comprehensive historical-context database; dates and conjectures retain author attribution.')
    path('parables','How do we interpret parables without inventing meanings for every detail?',
      'Study figurative communication, audience and contextual purpose; compare with held Keach/Pink/Fairbairn treatments.',
      [select('poythress-reading-word',r'^16 Figurative|^19 Genre$|^32 Boundaries'),select('poythress-god-centered',r'Knowing God in interpreting.*parables'),select('bethlehem-mining-gods-word',r'^Lesson 9:')],
      'A particular typological/allegorical interpretation is an author argument, not a mechanically proven cross-reference or unanimous rule.')
    path('poetry','How do Hebrew poetry and different kinds of psalms communicate?',
      'Compare parallelism, poetic images, lament/praise and Christ-centered appropriation with a worked Psalm example.',
      [select('chbc-psalms',r'^I\.|^III\.|^IV\.|^V\.|^VI\.'),select('poythress-reading-word',r'^34 Psalm')],
      'Historical authorship conjectures in the outline remain qualified; superscriptions and cited commentators are separate source claims.')
    path('proverbs','Are proverbial sayings guarantees, general patterns, or statements about God?',
      'Distinguish a saying’s force from legal commands and universal theological statements, then work through Proverbs 10:1.',
      [select('chbc-proverbs',r'^What are|^How are|^Where is Jesus'),select('poythress-reading-word',r'^33 Proverbs')],
      'The course does not make every proverb a fallible generalization: it explicitly distinguishes divine universal truths. Applied claims are attributed.')
    path('job','How should wisdom literature treat suffering and limited human knowledge?',
      'Use the Job overview to distinguish the sufferer, friends, narrative voice and God’s reply.',
      [select('chbc-job',r'^Introduction to Wisdom|^We Often|^We Only|^We Can|^Conclusion')],
      'A whole-book overview is not verse-by-verse coverage or a license to diagnose the cause of an individual’s suffering.')
    path('ecclesiastes-song','How do Ecclesiastes and the Song fit creation, the fall and wisdom?',
      'Read the distinct literary purposes of life under the sun and marriage poetry instead of flattening them into one genre formula.',
      [select('chbc-ecclesiastes-song',r'^ECCLESIASTES$|^THE SONG|^Context$|^Conclusion$')],
      'This is the anonymous institutional lesson’s creation/marriage account; compare held Bridges and typological readings without blending claims.')
    path('prophecy','How do prophetic images, repeated patterns and fulfillment relate?',
      'Compare a worked Amos oracle with Revelation’s schools, symbols and structure.',
      [select('poythress-reading-word',r'^35 Amos|^31 The Fulfillment|^32 Boundaries'),select('poythress-returning-king',r'^Schools of interpretation$|^Content and Style$|^Structure$')],
      'Recapitulation and amillennial arguments remain Poythress positions; they do not become the site’s mandatory eschatology.')
    path('literal-typology','What does literal interpretation mean when Scripture uses types and symbols?',
      'Compare definitions of literalness, OT audience horizons and typological fulfillment.',
      [select('poythress-understanding-dispensationalists',r'^8 WHAT|^9 DISPENSATIONALIST|^10 INTERPRETIVE|^11 THE CHALLENGE|^12 HEBREWS'),select('poythress-reading-word',r'^23 Typology|^27 Antitypes')],
      'The comparison is from conservative Presbyterian covenant theology; historic dispensational models and Baptist models are not homogenized.')
    path('genesis','How should genre, ordinary language and historical claims shape Genesis 1-3?',
      'Examine Genesis genre, the water above, creation-day language and the author’s safeguards for factuality.',
      [select('poythress-interpreting-eden',r'^6 The Genre|^9 The Water|^11 Time|^14 The Days|^15 Factuality|^Appendix A:')],
      'No owner-selected creation-day chronology is inferred; specific cosmology/accommodation arguments are attributed and quoted alternatives remain quotations.')
    path('james-paul','How can apparently conflicting theological words be read in context?',
      'Study word/concept distinctions, including the actual discussion of justification and faith in Paul and James.',
      [select('poythress-reading-word',r'^17 Words and Concepts'),select('bethlehem-mining-gods-word',r'^Lesson 7:')],
      'A concordance match is not shared meaning; preserve each author’s explicit contextual argument before joining doctrine claims.')
    path('practice','How can a reader move from observation to interpretation and application?',
      'Use a full twelve-lesson workbook and the handbook’s practical steps with Philippians as training text.',
      [select('bethlehem-mining-gods-word',r'^Lesson [1-6]:|^Lesson 11:|^Lesson 12:'),select('poythress-reading-word',r'^4 Three Simple|^6 Correlation|^20 Using')],
      'Workbook exercises and quotations are not uniformly verse-by-verse exegesis; supplemental commercial books are not included in this acquisition.')
    path('inner-biblical','How can an interpreter test an inner-biblical or messianic reading against actual texts?',
      'Compare a Baptist scholar\'s Genesis seed/serpent argument and 2006 Song messianic thesis with the genre/marriage overview.',
      [select('hamilton-seed-woman',r'^The Context|^The Collective|^Genesis 3:15 in|^Conclusion'),
       select('hamilton-song-music',r'^Complete offered scholarly'),select('chbc-ecclesiastes-song',r'^THE SONG')],
      'The articles propose arguments, not unanimous exegesis. Preserve manuscript/date distinctions and the relation of ordinary marriage poetry to messianic patterns; the later 2015 commercial Song book is not acquired.')
    coverage=[]
    def cover(key,passage,pattern,kind,limit):
        e=select(key,pattern)
        coverage.append(dict(passage=passage,coverageKind=kind,entry=e,limitations=limit,semanticInference=False))
    cover('poythress-reading-word','Proverbs 10:1',r'^33 Proverbs','sustained-worked-interpretive-example','Printed pp.355-374; no inference of a complete Proverbs commentary.')
    cover('poythress-reading-word','Psalms 4:8',r'^34 Psalm','sustained-worked-interpretive-example','Printed pp.375-386; Hebrew verse numbering differs, as discussed in source.')
    cover('poythress-reading-word','Amos 1:3',r'^35 Amos','sustained-worked-interpretive-example','Printed pp.387-398; wider Amos citations are context, not full-book coverage.')
    cover('poythress-reading-word','1 Samuel 22:1-2',r'^4 Three Simple','method-example','Worked throughout the handbook; this starting section is pp.47-54, not an entire Samuel commentary.')
    cover('poythress-reading-word','Romans 3:28; James 2:24',r'^17 Words','contextual-word-and-concept-discussion','Actual Justification and Faith subsection; source argument, not a generated harmonization.')
    cover('poythress-interpreting-eden','Genesis 1-3',r'^6 The Genre|^8 Correlations|^9 The Water|^10 Correlations|^11 Time|^14 The Days|^15 Factuality','substantial-interpretive-monograph','Selected chapters address these spans; not a full verse-by-verse Genesis commentary.')
    cover('poythress-understanding-dispensationalists','1 Corinthians 15:51-53',r'^7 THE LAST','specific-prophetic-interpretation-argument','Last-trumpet/pretribulation comparison retains actual author position.')
    cover('poythress-understanding-dispensationalists','Hebrews 12:22-24',r'^12 HEBREWS','specific-typology-and-fulfillment-argument','Zion/Jerusalem interpretation is attributed, not a Baptist-model consensus.')
    cover('bethlehem-mining-gods-word','Philippians 1-4',r'^Lesson [1-6]:|^Appendix B:','full-book-training-text-and-study-exercises','Course explicitly is not a Philippians commentary or theology; distinguish ESV text, exercises and interpretation.')
    for key,passage in [('job','Job 1-42'),('psalms','Psalms 1-150'),('proverbs','Proverbs 1-31'),('ecclesiastes-song','Ecclesiastes 1-12; Song of Songs 1-8')]:
        cover('chbc-'+key,passage,r'^Complete offered','whole-book-genre-overview','Overview only; selected passages and quotation voices do not establish exposition of every verse.')
    cover('ascol-hermeneutics-preaching','Proverbs 26:4-5; Matthew 19:3-9',r'^Conviction about Interpretation$','genre-and-context-examples','Examples of wisdom/narrative/didactic reading within one essay; no complete-book claim.')
    cover('hamilton-seed-woman','Genesis 3:15 and its proposed inner-biblical reception',r'^The Context|^The Collective|^Genesis 3:15 in|^Conclusion',
      'substantial-scholarly-inner-biblical-argument','Complete printed pp.30-54; later biblical and extrabiblical citations are author evidence, not automatic exposition/teaching joins.')
    cover('hamilton-song-music','Song of Songs: Davidic shepherd-king, bride and garden motifs',r'^Complete offered scholarly',
      'substantial-scholarly-messianic-genre-argument','WTJ 68 (2006) pp.331-345; author\'s non-allegorical thesis, not exhaustive verse commentary or proof of later book agreement.')
    # Every authored commentary heading is located directly; exclude the front contents.
    w=by['work-rb09-poythress-returning-king']
    commentary_start=max(u['lineStart'] for u in w['locations'] if u['title']=='Commentary')
    for u in w['locations']:
        if u['lineStart']<=commentary_start or not re.search(r'\b\d{1,2}:\d',u['title']):continue
        e=dict(assetId=w['assetId'],title=w['title'],originalSha256=w['originalSha256'],sourceUrl=w['url'],locations=[u])
        coverage.append(dict(passage='Revelation: '+u['title'],coverageKind='authored-commentary-section',entry=e,
          limitations='Author exposition with nested Scripture/other-commentator quotations; overlapping interludes are not distinct additional canonical verses.',semanticInference=False))
    write('chapter-map.json',dict(mission='RB09',works=works,unitCount=sum(len(w['locations']) for w in works),
      note='Source pages, chapters, sections and EPUB navigation are different unit kinds; counts are not all chapters or newly exposed verses.'))
    write('reading-paths.json',dict(mission='RB09',paths=paths))
    write('passage-coverage.json',dict(mission='RB09',entries=coverage,verseCoverageInferred=False,
      note='Explicit examples, source-defined spans and whole-book overviews; never treat bibliography/index references as exposition.'))
    write('bibliography.json',dict(mission='RB09',works=[{k:w.get(k) for k in ('assetId','workId','title','author','url','edition','completeness','status','relativePath','originalSha256')} for w in works],formalCatalogChanged=False))
    write('intake-scope.json',dict(mission='RB09',files=[dict(assetId=a['assetId'],workId=a['workId'],originalSha256=a['sha256'],
      evidenceOnly=True,eligibleForScopedIntake=False,integrated=False,theologicalScope=a['theologicalScope'],rightsCategory=a['rightsCategory'],
      requirements=['Resolve personal-download versus retrieval-system permission before corpus-use admission.',
        'Preserve Scripture quotations, author quotations, scholarly opponents, prefaces, indexes and chapter bylines as distinct roles.',
        'No invented attribution of anonymous institutional curricula; Carson foreword is not Poythress prose.',
        'Deduplicate source witnesses/overlapping quotations; preserve contextual arguments and doctrinal distinctives.',
        'Retain original text-layer glyph diagnostics; decorative leaders/bullets do not license invented word repairs.']) for a in new],
      currentImporterBoundary='Read-only planner supports evidence-only parents, not complete per-quotation/contributor/corpus-license enforcement. No DB/vector/graph job launched.'))
    md=['# RB09: thirteen ways to read with genre and context','',
      'All links lead to identified source witnesses. The table gives study purposes and exact source sections; it does not declare a merged interpretation or exhaustive verse coverage.','',
      '| Study question | Exact source starting points | Benefit and limits |','| --- | --- | --- |']
    for p in paths:
        sources='; '.join('['+cell(e['title'])+']('+e['sourceUrl']+') - '+', '.join(cell(u['title'])+(' (printed pp.'+str(u['printedPageStart'])+'-'+str(u['printedPageEnd'])+')' if u.get('printedPageStart') else ' ('+u['locator']+')') for u in e['locations']) for e in p['entries'])
        md.append('| '+cell(p['question'])+' | '+sources+' | '+cell(p['purpose']+' '+p['limitations'])+' |')
    md += ['', '## Passage coverage, before graph exploration','',
      'See [passage-coverage.json](passage-coverage.json) for each source-specific locator. Full-book overview ranges mean overview scope, not every verse expounded. The handbook has three sustained worked examples; Revelation has actual commentary headings; the workbook explicitly describes Philippians as training material.','',
      '| Passage / source-defined span | Work | Kind and limit |','| --- | --- | --- |']
    for c in coverage:md.append('| '+cell(c['passage'])+' | '+cell(c['entry']['title'])+' | '+cell(c['coverageKind']+'; '+c['limitations'])+' |')
    md += ['', '## Already held and deliberately reused','',
      'Fairbairn Hermeneutical Manual, Prophecy and Typology; Berkhof Sacred Hermeneutics; Pink Interpretation; Piper Reading the Bible Supernaturally; Bridges Proverbs/Ecclesiastes; and the four-book Keach parables witnesses remain distinct existing readings. Exact existing EPUB navigation is retained in [chapter-map.json](chapter-map.json). None are counted as newly downloaded.','',
      'Parents remain held for rights/contributor/quotation-aware intake. No graph edges were inferred and no new material was embedded.']
    write('READING-MAP.md','\n'.join(md))
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'locations;',len(paths),'study questions;',len(coverage),'coverage rows')

if __name__=='__main__':main()
