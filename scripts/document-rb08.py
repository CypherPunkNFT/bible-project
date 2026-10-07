"""Document RB08 source-supported eligibility and acquisition exceptions."""
import json
from pathlib import Path

SITE=Path(__file__).resolve().parents[1]
R=SITE/'content/library/reports/reformed-baptist-overnight/RB08'
def write(name,data):
    (R/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def main():
    discovery=json.loads((R/'discovery-evidence.json').read_text(encoding='utf-8'))
    def evidence(url,role):
        x=next(x for x in discovery if x['url']==url and 'sha256' in x)
        return {**{k:x[k] for k in ('url','finalUrl','retrievedAt','sha256')},'role':role}
    white=[evidence('https://www.aomin.org/aoblog/statement-of-faith/','Primary ministry confession: Scripture authority, one God/three coequal eternal persons, substitutionary completed redemption, regeneration and justification by grace through faith alone.'),
           evidence('https://www.aomin.org/aoblog/about/','Primary ministry biography identifies James White, his ministry and ecclesial context; qualifications are source claims, not independent accreditation assessment.'),
           evidence('https://www.aomin.org/aoblog/jehovahs-witnesses/we-chatted-with-a-jw-last-night/','White explicitly defends Christ raising his body and bodily resurrection through John 2:18-21; doctrinal evidence only, not a substantial new study acquisition.'),
           evidence('https://www.aomin.org/aoblog/reformed-baptist-issues/72704-an-interesting-expansion-in-the-lbcf-1689/','White defends the 1689 justification wording; distinguish quoted Waldron and confession from White prose.')]
    kruger=[evidence('https://rts.edu/about/purpose/','Institutional purpose affirms inerrant sixty-six books and faculty teaching Westminster Confession and Catechisms; WCF chapters 2,8,11 ground Trinity, two natures, substitution, bodily resurrection and grace/faith justification.'),
            evidence('https://rts.edu/people/dr-michael-j-kruger/','Primary faculty biography identifies the NT/canon scholar and his author site; Presbyterian/Reformed context, not a Baptist polity authority.')]
    decisions=[dict(author='James White',decision='eligible-within-declared-subject-scope',scope='Selected written biblical Trinity, Christology and Gospel-reliability/Islam arguments only.',
        coreAnchors={'Scripture':'AOM Scripture confession','Trinity':'AOM confession and Brief Definition article','ChristDeityAndHumanity':'Selected Chalcedon/Oneness essay and Ego Eimi exegesis','SubstitutionaryAtonement':'AOM redemption confession','BodilyResurrection':'White John 2 response, 2004-01-18','GraceThroughFaithAlone':'AOM Salvation confession'},evidence=white,
        limits=['No blanket author/ministry approval or adoption of every contemporary controversy, rhetorical generalization or historical claim.',
          'Oneness/JW/Muslim/liberal scholars appear only as quotations within a Christian response, not acquired opposing teaching works.',
          'Long Chalcedon essay contains historical creed/scholar/opponent voices; those require separate quotation roles.',
          'Internal Ego Eimi note says around 1990; site January 1 metadata is not exact original publication proof.']),
      dict(author='Michael J. Kruger',decision='eligible-within-declared-subject-scope',scope='Selected canon/Scripture scholarship and presuppositional apologetics; conservative Presbyterian Reformed context.',
        coreAnchors={'Scripture':'RTS purpose and actual selected essay','Trinity':'RTS Reformed Westminster chapter 2 context','ChristDeityAndHumanity':'Westminster chapter 8 institutional context','SubstitutionaryAtonement':'Westminster chapter 8 institutional context','BodilyResurrection':'Westminster 8.4 institutional context','GraceThroughFaithAlone':'Westminster chapter 11 institutional context'},evidence=kruger,
        limits=['Presbyterian baptism and polity are not our Baptist default; these selected works do not establish an ordinance policy.',
          'Ten facts is a complete popular article series, not Canon Revisited or an exhaustive scholarly canon monograph.',
          'First-century dating/apostolicity and second-century Muratorian dating are Kruger positions; date of extant fragment differs from composition of its list.',
          'Canon series acknowledges disputed books and use of noncanonical works; do not erase these qualifications.',
          'Church fathers and modern scholars quoted in arguments remain source-attributed citations, not individual author registry approvals.',
          'Presuppositional method is an argued Christian approach, not proof that other conservative methods are heretical or banned.',
          'TMS hosts the essay; that does not adopt the publisher entire dispensational theology.'])]
    write('theological-decisions.json',dict(mission='RB08',decisions=decisions,globalAuthorApproval=False,
        corpusIntakeAuthorized=False,publicHostingAllowed=False,decisionMeaning='The identified study subject is eligible; rights, voice segmentation and importer enforcement are independent holds.'))
    exceptions=[
      dict(target='Kruger: Resurrection of Jesus roundtable',url='https://5mt.michaeljkruger.com/2012/07/A-Roundtable-Discussion-with-Michael-Licona-on-The-Resurrection-of-Jesus.pdf',status='403-forbidden-deferred',reason='Offered faculty link returned 403; no bypass, no scan or URL-variant hunt. Scholarly roundtable would require contributor and disputed inerrancy review.'),
      dict(target='Kruger: Manuscripts, Scribes and Book Production',url='https://5mt.michaeljkruger.com/2012/02/Manuscripts-and-Scribes-Chapter.pdf',status='403-forbidden-deferred',reason='Offered faculty link returned 403. No repeated attempts, OCR or image acquisition.'),
      dict(target='TGC Carson HTML discovery',url='https://www.thegospelcoalition.org/carson-center/',status='crawl-delay-deferred-held-texts-reused',reason='Current robots specifies 600-second crawl delay; stopped own waiting inspection instead of bypassing the rule. Existing author desk already holds 377 relevant records, not all Carson-authored.'),
      dict(target='AOM transcript desk',url='https://www.aomin.org/aoblog/transcripts/',status='no-substantial-written-body',reason='Desk had no actual full transcripts. No audio/video or transcription jobs.'),
      dict(target='White: Scripture Alone / Forgotten Trinity / What Every Christian Needs to Know About the Quran',status='commercial-complete-book-gaps',reason='No authorized free complete edition verified. Selected author-offered substantial essays add coverage without pretending to replace these books.'),
      dict(target='Kruger: Canon Revisited / Question of Canon / Surviving Religion 101',status='commercial-complete-book-gaps',reason='No authorized full free books verified. Complete popular ten-part series and offered 2001 journal essay are different works.'),
      dict(target='White: NT transmission 2004 initial posts',status='inspected-not-promoted-incomplete-series',url='https://www.aomin.org/aoblog/islam/islamic-apologetics-and-new-testament-transmission-a-rebuttal/',reason='First installment and #2 point forward; not a verified complete series. Prefer complete 2012 two-part argument.'),
      dict(target='Carson desk: A Christian Perspective on Islam',status='held-attribution-correction-required',assetId='asset-ready-library-53250b31337562f206aa',url='https://media.thegospelcoalition.org/documents/cci/Moucarry.pdf',reason='Actual Chawkat Moucarry essay, not Carson. Repository desk label is not author identity. Work-level eligibility unresolved; not selected as approved teaching or blindly imported.'),
      dict(target='Modern resurrection evidence monograph',status='remaining-depth-gap',reason='Held orthodox theological exposition supplies doctrine; it does not equal a newly verified comprehensive modern historical-resurrection study. Continue legitimate author/publisher offered text discovery.'),
      dict(target='Modern trauma/suffering care and Christian/Islam comparative scholarship',status='remaining-depth-gap',reason='Held Piper and selected White essays are useful but do not establish complete modern care or comparative religion coverage. No Muslim primary-text expansion under this campaign.')]
    write('source-exceptions.json',dict(mission='RB08',entries=exceptions,noNewOCR=True,noImageAcquisition=True))
    print('DOCUMENTED',len(decisions),'scoped author decisions;',len(exceptions),'exceptions')

if __name__=='__main__':main()
