"""Reviewed RB10 offers and work-specific scope; no database/model calls."""
import importlib.util,json,re
from pathlib import Path
SITE=Path(__file__).resolve().parents[1]
sp=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb10-acquire.py')
r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
R=r.base.REPORT
BOOK='https://frame-poythress.org/wp-content/uploads/2017/04/PoythressVernTheLordshipOfChristServingOurSaviorAllOfTheTimeInAllOfLifeWithAllOfOurHeart.pdf'
OFFERS=[
 ('poythress-lordship','The Lordship of Christ: Serving Our Savior All of the Time, in All of Life, with All of Our Heart','Vern S. Poythress',BOOK,'pdf',None,
  'Crossway copyright/first printing 2016; PDF ISBN 9781433549540; complete offered 226-page PDF, twenty chapters and Two Kingdoms appendix',
  'Conservative Presbyterian/Reformed foundation for obedience, ordinary work and neighbor service. Kuyperian cultural/kingdom arguments and Politics chapter are source-specific positions, not Baptist defaults; no partisan commentary selected for the study paths.'),
 ('bingham-conscience','Calibrating the Conscience','Matthew C. Bingham','https://www.9marks.org/article/calibrating-the-conscience/','html','.article-content-wrap',
  'Complete 9Marks authored essay displayed March 19, 2026, with four numbered practical divisions and notes; not a complete Bingham book',
  'Scripture-shaped conscience, conversion, fellowship and self-examination; conscience is fallible, not a replacement for Scripture. Particular essay reviewed, not author-wide approval.'),
 ('lawrence-scrupulous','Pastoring the Scrupulous Conscience','Michael Lawrence','https://www.9marks.org/article/pastoring-the-scrupulous-conscience/','html','.article-content-wrap',
  'Complete 9Marks authored essay in Pastoring and the Conscience, displayed March 25, 2026; two categories, three resources and one posture',
  'Baptist pastoral use of Scripture, grace and gentle care for an oversensitive conscience. Clinical/biological/OCD/medication discussion is author context, not project diagnosis or medical advice; spiritual guilt and clinical symptoms must not be conflated.'),
 ('reju-conscience','Can I Bind the Conscience More in the Counseling Room Than in the Pulpit?','Deepak Reju','https://www.9marks.org/article/can-i-bind-the-conscience-more-in-the-counseling-room-than-in-the-pulpit/','html','.article-content-wrap',
  'Complete 9Marks authored essay in Pastoring and the Conscience, displayed March 2, 2026; schooling example and private/public ministry sections',
  'Baptist practical ethics: distinguish biblical warrant from pastoral prudence; conscience freedom does not make every decision morally neutral. The schooling case illustrates reasoning, not a mandatory education policy.'),
 ('fgb-conscience','Free Grace Broadcaster 261: Conscience','Various; individual article bylines retained','https://www.chapellibrary.org/api/books/download?code=consfg&format=epub','epub',None,
  'Complete offered Chapel Library issue 261; eleven contextual historical articles/excerpts, compiler annotations and notes; internal compilation copyright 2022, not inferred from EPUB export',
  'Reformed/Puritan/Baptist conscience and gospel assurance with seven distinct historical authors: Pink, Sibbes, Perkins, Fenner, Flavel, Ryle and Spurgeon. Excerpts do not establish acquisition of their entire books; differing church/atonement positions remain scoped.'),
 ('fgb-forgiveness','Free Grace Broadcaster 184: Forgiveness','Various; individual article bylines retained','https://www.chapellibrary.org/api/books/download?code=forgfg&format=epub','epub',None,
  'Complete offered Summer 2003 issue 184 in later reformatted EPUB; six articles/excerpts and notes. Invalid OPF date 0101 is not a publication date',
  'Gospel-based forgiveness/repentance and refusal of bitterness. Preserve Adams, Ryle, Spurgeon, MacArthur, Jim Wilson and Flavel as separate voices; conditional reconciliation and unconditional forgiving posture are not merged. Wilson Eph.4-5 treatment is scoped, not author/family-wide theological approval.'),
 ('fgb-good-works','Free Grace Broadcaster 199: Good Works','Various; individual article bylines retained','https://www.chapellibrary.org/api/books/download?code=gworfg&format=epub','epub',None,
  'Complete offered issue 199; nine contextual articles/excerpts; internal compilation copyright 2007. EPUB export metadata 2013-08-01 is not original publication date',
  'Scripture-grounded good works as fruit of grace and justification, not merit earning acceptance. Separate Spurgeon, Lloyd-Jones, Pink, Bonar, Erskine, Manton and Bunyan, and preserve source quotations/editorial notes.')]

def main():
    targets=[];review=[];decisions=[]
    held=json.loads((R/'holdings-audit.json').read_text('utf-8'))['files']
    heldhash={a['actualSha256'] for a in held}
    for slug,title,author,url,fmt,selector,edition,scope in OFFERS:
        raw,meta=r.base.fetch(url)
        assert meta['sha256'] not in heldhash, title
        t=dict(workId='work-rb10-'+slug,title=title,author=author,url=url,format=fmt,selector=selector,
          edition=edition,completeness='Complete offered book' if fmt=='pdf' else 'Complete offered issue; constituent historical/modern excerpts as disclosed, not complete underlying books' if fmt=='epub' else 'Complete offered authored essay including notes; unrelated journal/navigation excluded',
          sourceId='source-frame-poythress' if fmt=='pdf' else 'source-chapel-library' if fmt=='epub' else 'source-9marks',
          discoveryUrl='https://frame-poythress.org/ebooks/' if fmt=='pdf' else 'https://www.chapellibrary.org/book/'+url.split('code=')[1].split('&')[0] if fmt=='epub' else 'https://www.9marks.org/journal/pastoring-and-the-conscience/',
          evidenceOnly=True,theologicalEligibility='eligible-within-declared-subject-scope',eligibilityEvidence='theological-decisions.json',
          theologicalScope=scope,admissionRole='ethical-source-with-contributor-quotation-edition-and-rights-holds',
          rightsCategory='publisher-offered-free-private-reading-no-retrieval-system-license' if fmt=='epub' else 'author-publisher-personal-reading-offer-no-general-corpus-license',
          rightsEvidence='Publisher EPUB explicitly offers worldwide .epub/.mobi/PDF download without charge, retaining compilation/annotation and contributor rights; public book record/client offered format. No general retrieval-system or public redistribution license inferred.' if fmt=='epub' else 'Author ebook desk explicitly permits personal downloading/printing while retaining publisher rights; complete offered PDF copyright restricts storage/retrieval/distribution without permission except applicable law.' if fmt=='pdf' else 'Ministry publishes complete authored essay publicly for reading; conservative named private reading acquisition only. Copyright remains; no systematic corpus or public full-text hosting license inferred.')
        text=r.extract(raw,t);words=len(re.findall(r"\b[\w'-]+\b",text));assert words>1800
        assert 'Go to Journal' not in text
        lines=[s for s in text.splitlines() if len(s)>55]
        t.update(minimumWords=int(words*.97),requiredMarkers=[re.escape(lines[0][:65]),re.escape(lines[-1][-65:])])
        q=dict(workId=t['workId'],source=meta,wordCount=words,replacementCharacters=text.count('\ufffd'),newOCR=False,separateImageAssets=False)
        if fmt=='pdf':
            import pymupdf
            with pymupdf.open(stream=raw,filetype='pdf') as pdf:
                t['expectedSourcePdfPages']=len(pdf);q.update(sourcePages=len(pdf),substantialTextPages=sum(len(p.get_text().strip())>500 for p in pdf),
                  replacementPages=[dict(sourcePdfPage=i+1,count=p.get_text().count('\ufffd')) for i,p in enumerate(pdf) if '\ufffd' in p.get_text()])
        elif fmt=='epub':
            import io,zipfile
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                assert z.testzip() is None
                q['quality']='Valid complete EPUB package/spine; clean existing text, retained compilation/notes. Incidental bundled cover artwork not separately extracted or acquired.'
        else:
            assert len(r.base.soup(raw).select(selector))==1
            q['quality']='Exact complete authored article wrapper, excluding journal-promotion sibling.'
        targets.append(t);review.append(q)
        decisions.append(dict(workId=t['workId'],decision='eligible-within-declared-subject-scope',actualWorkReview=scope,
          anchorsBasis='See theological-evidence.json for primary doctrine and actual-source review; not affiliation-only approval.',
          limits=['Rights and contributor/quotation integration required before any full-body DB admission.',scope],globalAuthorApproval=False))
    r.base.write(R/'targets.json',targets);r.base.write(R/'selected-text-review.json',review)
    r.base.write(R/'theological-decisions.json',dict(mission='RB10',decisions=decisions,globalAuthorApproval=False,corpusIntakeAuthorized=False))
    print('PREPARED',len(targets),'reviewed complete offers;',sum(x['wordCount'] for x in review),'derivative words')
if __name__=='__main__':main()
