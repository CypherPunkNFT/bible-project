"""Source-supported RB09 scope decisions; no global author approval or DB writes."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]/'content/library/reports/reformed-baptist-overnight/RB09'
def write(name,x):(R/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def main():
    ds=json.loads((R/'discovery-evidence.json').read_text(encoding='utf-8'))
    def ev(url,role):
        e=next(x for x in ds if x['url']==url and x.get('sha256'))
        return {k:e[k] for k in ('url','finalUrl','sha256','retrievedAt')}|dict(role=role)
    anchors=['Scripture authority','Trinity','Christ deity and humanity','substitutionary atonement','bodily resurrection','salvation by grace through faith alone']
    decisions=[
      dict(author='Vern S. Poythress',decision='eligible-within-declared-subject-scope',
        evidence=[ev('https://frame-poythress.org/about/vern-poythress-full-bio/','Own biography: ordained Reformed Presbyterian teaching elder in 1981; now PCA context. Childhood Baptist baptism is not present Baptist identification.'),
          ev('https://www.wts.edu/about/mission-values','Current primary institutional statement: inerrant Word and Westminster Standards; WCF chapters 2,8,11 ground the six anchors. Presbyterian polity expressly identified.'),
          ev('https://frame-poythress.org/ebooks/god-centered-biblical-interpretation/','Actual full argument: Trinity, divine/human word, Christ-centered redemption and interpretation; not endorsement based only on reputation.'),
          ev('https://frame-poythress.org/ebooks/the-returning-king/','Actual resurrection and Lamb redemption exposition in Revelation; conservative source argument, not a prophetical consensus claim.'),
          ev('https://frame-poythress.org/ebooks/','Explicit personal-use ebook downloads; print/publication rights retained.')],
        sixAnchors=anchors,scope='Five selected complete interpretation/Genesis/Revelation/dispensational-comparison books only.',
        limits=['Conservative Presbyterian Reformed scope, not Baptist ordinance/polity/covenant defaults.',
          'Multiperspectival methodology, recapitulation/amillennial readings and creation-day discussions stay attributed positions.',
          'Historic dispensational claims address specific Scofield/Ryrie eras; postscript 1993 does not represent all current dispensational models.',
          'Critically discussed liberal/Catholic/opponent scholarship is quoted inside a selected conservative work, not separately acquired or approved teaching.',
          'Internet posting/personal download permission does not authorize a retrieval system or full-text republication.']),
      dict(author='Bethlehem College & Seminary (institutional curriculum)',decision='eligible-within-declared-subject-scope',
        evidence=[ev('https://bcsmn.edu/affirmation-of-faith/','Primary confession summary and offered full affirmation: Reformed soteriology, baptistic practice, Trinity/incarnation, inerrant Scripture, substitutionary redemption, faith-alone imputed righteousness and bodily resurrection.'),
          ev('https://bcsmn.edu/wp-content/uploads/2023/04/affirmationOfFaith.pdf','Full offered confession inspected as theological evidence only; actual Christ redemption/resurrection anchors retained.'),
          ev('https://bcsmn.edu/profile/mining-gods-word-pdf-download/','Official complete student workbook offer; twelve-week inductive study with Philippians as training text.')],
        sixAnchors=anchors,scope='Complete 2016 Mining Gods Word student workbook: observation/interpretation/application, genres and background exercises.',
        limits=['No named individual curriculum writer established; institution/copyright owner recorded without inventing a Piper byline.',
          'Confession allows a range of continuationist and eschatological perspectives; curriculum does not set project positions on these.',
          'Quoted authors, Scripture editions and supplemental books are separate roles; Living by the Book and study Bibles were not acquired.',
          'Appendix Agassiz narrative is study-method illustration, not independently approved theology.',
          'Official offered download supports personal reading, not blanket corpus modification/retrieval rights.']),
      dict(author='Capitol Hill Baptist Church (Core Seminars)',decision='eligible-within-declared-subject-scope',
        evidence=[ev('https://www.capitolhillbaptist.org/about-us/what-we-believe/statement-of-faith/','Primary New Hampshire-style Baptist confession: sections I Scripture, II Trinity, IV divine-human mediator/substitution and exaltation, V grace/faith, VII regeneration, VIII justification and XVIII resurrection/judgment.'),
          ev('https://www.capitolhillbaptist.org/resources/core-seminars/series/old-testament-overview/','Official offered written curriculum and four observed lesson identities.'),
          ev('https://www.capitolhillbaptist.org/sermon/class-13-proverbs/','Actual general-truth versus divine-universal-truth distinction; attributed genre argument, not all Proverbs reduced to fallible promises.')],
        sixAnchors=anchors,scope='Complete written Job/Psalms/Proverbs/Ecclesiastes-and-Song lessons only; not the whole course or full commentaries.',
        limits=['Individual manuscript writer not identified on the offered pages; institution recorded, not assumed Mark Dever authorship.',
          'Quoted Dever, Goldsworthy, Dempster, Drew and other material must remain distinct from the anonymous lesson voice.',
          'Do not use Job overview as diagnosis of a sufferer?s sin or generalized prosperity promise.',
          'Song as creation/marriage poetry and Christ application is one attributed account; compare held typological exposition rather than merge them.',
          'Lesson dating is page display metadata, not proven original composition.']),
      dict(author='Tom Ascol',decision='eligible-within-declared-subject-scope',
        evidence=[ev('https://founders.org/about/','Primary Founders institutional context and president identity; project already holds offered 1689 explanations for chapters 1,2,8,11 and associated confessional evidence.'),
          ev('https://founders.org/articles/hermeneutics-and-expository-preaching/','Actual visible byline Tom Ascol, internal original-publication note, Scripture-authority and authorial-intent argument.')],
        sixAnchors=anchors,scope='One complete Reformed Baptist interpretation/preaching essay.',
        limits=['Site schema uploader Hannah Ascol is not the displayed author; retain metadata conflict with evidence.',
          'Original Expositor Sept/Oct 2015 differs from current website publication date May 7, 2020.',
          'Political/legal opening analogy is the author?s historical framing, not project legal guidance.',
          'No blanket global author or every ministry work approval.'])]
    decisions.append(dict(author='James M. Hamilton, Jr.',decision='eligible-within-declared-subject-scope',
      evidence=[ev('https://www.sbts.edu/faculty/james-m-hamilton/','Primary faculty biography identifies Southern Baptist scholar/pastor and actually offers both full essay URLs; exact author identity and current ministry context.'),
        ev('https://www.sbts.edu/about/abstract/','Primary Abstract of Principles: Scripture, Trinity, mediator substitution, regeneration, faith/justification and resurrection; institutional confessional context, not blanket approval of every graduate.'),
        ev('http://jimhamilton.info/wp-content/uploads/2008/04/hamilton_sbjt_10-2.pdf','Actual Genesis 3:15 essay tests a messianic hypothesis against biblical evidence, acknowledges disputed readings, locates Jesus fulfillment; full article not preview.'),
        ev('http://jimhamilton.files.wordpress.com/2006/10/hamilton-article-from-wtj_fall06_topress-3.pdf','Actual 2006 non-allegorical messianic Song argument; dated thesis must not be conflated with later 2015 book title or CHBC marriage outline.')],
      sixAnchors=anchors,scope='Two complete offered Genesis/inner-biblical and Song/genre scholarly essays only.',
      limits=['Article-era Southwestern/Havard faculty context differs from current Southern/Kenwood biography; retain dates.',
        'Later 2015 commercial book is titled allegorical/Christological; that title alone does not establish its detailed relation to the 2006 non-allegorical argument. Do not merge editions or claim the book acquired.',
        'OT messianic/seed and Davidic shepherd-king interpretations are tested author arguments, not generated graph facts or consensus exegesis.',
        'Ancient extrabiblical and progressive/Catholic scholarship appear as citations within a conservative article; no opposing teaching corpus or individual approvals created.',
        'Footnote transliterations, ligatures and tight typeset spacing require source-aware handling; no new OCR or invented word repair.',
        'Author-offered personal scholarly reading does not authorize bulk/corpus retrieval rights.']))
    write('theological-decisions.json',dict(mission='RB09',decisions=decisions,globalAuthorApproval=False,corpusIntakeAuthorized=False,publicHostingAllowed=False,
      decisionMeaning='Confidence in selected study subject and identified source, separate from rights and quotation/contributor importer holds.'))
    held=json.loads((R/'holdings-audit.json').read_text(encoding='utf-8'))['files']
    skip=[dict(assetId=a['assetId'],title=a['title'],author=a['author'],url=a['url'],originalSha256=a['actualSha256'],reason='Actual readable original exists; reuse structure/text instead of a duplicate download.') for a in held if a['assetId'] in {
      'asset-expanded-2e7cff70efc9728065e3','asset-expanded-bede8529c25db7c1bf7f','asset-expanded-a324900ed738ce2a8443','asset-expanded-24fb8d7f0aee7dff4ace',
      'asset-expanded-faa06243f7dfba014bf4','asset-expanded-fefd8e8cc890b2f8f917','asset-expanded-58b3aab777acd4a6db14','asset-modern-piper-6f0d782ec82c5b1f56cf-epub'}]
    write('duplicate-decisions.json',dict(mission='RB09',alreadyHeldSkipped=skip,scope='819 matching actual originals checked; not an exhaustive reading of every book. No Poythress book, Bethlehem workbook or selected lesson/article original identified in recorded ledgers.'))
    exceptions=[dict(target='MBTS parable summary',url='https://cbs.mbts.edu/2018/08/21/a-call-for-discernment-interpreting-the-parables/',status='discovery-only-short-summary',reason='435-word complete summary of commercial Invitation to Biblical Interpretation; not a full book/substantial replacement, no promotion.'),
      dict(target='WTS beliefs route',url='https://www.wts.edu/beliefs',status='404-route-deferred',reason='Primary current mission-values page verified instead; no repeated dead-route variants.'),
      dict(target='BCS curriculum generic route',url='https://bcsmn.edu/curriculum/',status='redirected-to-video-not-acquired',reason='Redirects to unrelated video archive; actual institutional workbook offer independently verified. No media acquisition.'),
      dict(target='Commercial hermeneutics books',status='remaining-complete-book-gaps',reason='Carson Exegetical Fallacies, Kostenberger/Patterson Invitation to Biblical Interpretation and other commercial manuals are not satisfied by previews; no unauthorized full edition acquired.'),
      dict(target='Modern historical/context depth',status='remaining-specialist-gaps',reason='Method/books and selected overview lessons do not equal a new comprehensive ANE/Second Temple historical-context corpus. Existing Josephus/lexicons remain background witnesses, not new commentary.'),
      dict(target='PDF navigation glyphs',status='text-layer-usable-not-ocr',reason='Poythress replacement glyphs confined to decorative contents/index leaders; workbook replacements are section bullets. Prose is substantial existing text. Preserve exact raw extraction and diagnose locations; do not fabricate glyph repairs or count diagrams as acquired text.')]
    exceptions.extend([dict(target='Hamilton generic articles route',url='https://jimhamilton.info/articles/',status='404-discovery-route',reason='Exact full essay links were instead verified from current official Southern faculty page; no dead-route retries.'),dict(target='Southern generic confessional-documents route',url='https://www.sbts.edu/about/confessional-documents/',status='404-discovery-route',reason='Actual primary Abstract of Principles page verified; no need for alternate route guesses.')])
    write('source-exceptions.json',dict(mission='RB09',entries=exceptions,noNewOCR=True,noImageAcquisition=True))
    print('DOCUMENTED',len(decisions),'scoped source decisions;',len(skip),'specific duplicate skips;',len(exceptions),'exceptions')
if __name__=='__main__':main()
