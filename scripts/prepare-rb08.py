"""Prepare reviewed, limited RB08 targets from cached primary-source evidence."""
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
spec=importlib.util.spec_from_file_location('rb08',Path(__file__).with_name('rb08-acquire.py'))
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

def main():
    rows=json.loads((r.base.REPORT/'selected-text-review.json').read_text(encoding='utf-8'))
    targets=[]
    for i,x in enumerate(rows):
        assert 'error' not in x
        is_white=x['author']=='James White'
        raw,meta=r.base.fetch(x['url'])
        text=r.extract(raw,dict(format='html',selector=x['selector'],excludeSelectors=['.tags','.article-tags']))
        lines=[s for s in text.splitlines() if len(s)>60]
        published=next((z['published'] for z in x['dates'] if z.get('published')),None)
        assert published
        if is_white:
            work=['ego-eimi','brief-trinity','chalcedon-oneness','redaction-islam','redaction-islam'][i]
            url=x['url'];source='source-alpha-omega-ministries'
            scope='Baptist/Reformed biblical apologetics within the identified article subject; opponent quotations and rhetorical claims are attributed, not project teaching.'
            edition='Author/ministry offered HTML; displayed publication '+published[:10]
            if i==0: edition+='; internal note says first published around 1990, so January 1 is a website date, not a verified first-publication day'
        else:
            work='kruger-ten-canon-facts';url=x['url'];source='source-canon-fodder'
            scope='Conservative Presbyterian/Reformed canon scholarship only; Westminster institutional context. Not Baptist ordinance/polity authority or endorsement of every historical dating claim.'
            edition='Canon Fodder author-offered HTML; published '+published[:10]+'; part '+str(i-4)+' of complete ten-part series'
        targets.append(dict(sourceId=source,workId='work-rb08-'+work,title=x['title'],author=x['author'],url=url,
            discoveryUrl='https://michaeljkruger.com/the-complete-series-ten-basic-facts-about-the-nt-canon-that-every-christian-should-memorize/' if not is_white else url,
            format='html',selector=x['selector'],excludeSelectors=['.tags','.article-tags'],edition=edition,
            publicationDate=published[:10],seriesPart=(i-4 if not is_white else (i-2 if i in (3,4) else None)),
            completeness='Complete offered article body and its footnotes; series component, not a complete book',
            minimumWords=max(300,int(x['wordCount']*.85)),requiredMarkers=[re.escape(lines[0][:65]),re.escape(lines[-1][-65:])],
            evidenceOnly=True,admissionRole='source-attributed-apologetic-scholarship-with-nested-quotes-pending-intake-enforcement',
            theologicalEligibility='eligible-within-declared-subject-scope',theologicalScope=scope,
            eligibilityEvidence='theological-decisions.json',
            rightsCategory='modern-author-offered-reading-private-limited-selection-no-public-license',
            rightsEvidence='Public author/ministry-offered complete article at '+x['finalUrl']+'; robots respected; copyright retained. No blanket bulk, redistribution, public full-text search or retrieval-system license established. Limited private reading witness; later corpus-use rights review required.'))
    targets.append(dict(sourceId='source-masters-seminary-journal',workId='work-rb08-kruger-sufficiency-apologetics',
        title='The Sufficiency of Scripture in Apologetics',author='Michael J. Kruger',
        url='https://tyndale.tms.edu/wp-content/uploads/2021/09/tmsj12k.pdf',
        discoveryUrl='https://tms.edu/educational-resources/journal/archive/',format='pdf',
        edition="The Master's Seminary Journal 12/1 (Spring 2001), printed pages 69-87; 19-page offered text-layer PDF",
        publicationDate='2001',completeness='Complete 19-page journal essay including abstract and numbered footnotes; not a full book or the entire issue',
        minimumWords=8500,requiredMarkers=['THE SUFFICIENCY OF SCRIPTURE','Michael J. Kruger','SOURCE PDF PAGE: 19'],
        evidenceOnly=True,admissionRole='source-attributed-presuppositional-apologetics-with-scholar-quotes-pending-intake-enforcement',
        theologicalEligibility='eligible-within-declared-subject-scope',
        theologicalScope='Kruger argues for Scripture-sufficient presuppositional apologetics. Conservative Reformed method, not the sole permitted Christian apologetic method; no adoption of publisher dispensational system.',
        eligibilityEvidence='theological-decisions.json',
        rightsCategory='publisher-offered-modern-journal-PDF-private-study-rights-review',
        rightsEvidence='Official journal archive lists this essay; offered PDF has existing text on all 19 pages. Copyright retained; no general public hosting/corpus retrieval license inferred.'))
    targets.append(dict(sourceId='source-tyndale-bulletin',workId='work-rb08-kruger-definition-canon',
        title="The Definition of the Term 'Canon': Exclusive or Multi-Dimensional?",author='Michael J. Kruger',
        url='https://www.tyndalebulletin.org/article/29324-the-definition-of-the-term-canon-exclusive-or-multi-dimensional.pdf',
        discoveryUrl='https://www.tyndalebulletin.org/article/29324-the-definition-of-the-term-canon-exclusive-or-multi-dimensional',
        format='pdf',edition='Tyndale Bulletin 63/1 (2012), printed pages 1-20; DOI 10.53751/001c.29324; current publisher-offered 20-page text-layer PDF',
        publicationDate='2012-05-01',completeness='Complete offered scholarly essay with numbered footnotes; XML is abstract-only and HTML lacks full body, so clean existing PDF text is used',
        minimumWords=8500,requiredMarkers=['THE DEFINITION OF THE TERM','Michael J. Kruger','SOURCE PDF PAGE: 20','ontological'],
        evidenceOnly=True,admissionRole='source-attributed-canon-definition-scholarship-with-quoted-voices-pending-intake-enforcement',
        theologicalEligibility='eligible-within-declared-subject-scope',eligibilityEvidence='theological-decisions.json',
        theologicalScope='Conservative Reformed canon study: exclusive, functional and ontological definitions are analytically distinct. Recognition of a fixed list is distinguished from use and divine giving; historical scholar quotes are not approved opposing teaching sources.',
        rightsCategory='publisher-pre2021-noncommercial-download-indexing-software-use-with-credit',
        rightsEvidence='https://www.tyndalebulletin.org/about current policy for volume 71 (2020) and earlier expressly permits noncommercial reading, download, copying, search, indexing and passing full texts to software with credit. This 2012 vol.63 essay falls under that policy; do not mislabel it the post-2021 CC license. Commercial reuse or distribution of derivative works requires permission. No public text hosting requested.'))
    r.base.write(r.base.REPORT/'targets.json',targets)
    print('PREPARED',len(targets),'text targets; theological scope resolved, intake held')

if __name__=='__main__':main()
