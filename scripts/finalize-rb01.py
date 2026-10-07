"""Close the reviewed RB01 batch; metadata/docs only, never import or embed."""
import collections
import json
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB01'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def write(name, value):
    (R / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    m, v, coverage, exposition = map(read, ['acquisition-manifest.json', 'validation.json', 'coverage.json', 'exposition-coverage.json'])
    assert len(m['files']) == len({a['url'] for a in m['files']}) == v['originalFiles'] == 121
    assert not v['pendingUrls'] and not m['failures']
    assert coverage['daggPart1']['allFilesPresent']
    assert exposition['allChapterTopicsLocated']
    structural = read('confessional-coverage.json')
    assert structural['daggPart2']['allExpectedFilesPresent']
    assert structural['philadelphia']['allExpectedFilesPresent']
    assert structural['coxAppendix']['numberedDeclarations'] == 22
    assert all(x['articleHeadingCount'] == 52 for x in structural['firstLondon'].values())
    assert all(x['originalHashPassed'] and x['derivativeHashPassed'] for x in v['checks'])
    now = datetime.now(timezone.utc).isoformat()
    by_url = {a['url']: a for a in m['files']}
    by_work = collections.defaultdict(list)
    for a in m['files']:
        by_work[a['workId']].append(a)
    issues = [
        dict(id='dagg-anchor', url='https://www.reformedreader.org/rbb/dagg/motb3c3.htm#sec4',
             finding='TOC anchor sec4 is missing; the body contains Moral Government under a duplicated sec3 anchor.',
             action='Use the Book III/chapter III/section heading locator; never change original bytes.'),
        dict(id='first-london-rr-date', url='https://www.reformedreader.org/ccc/h.htm',
             finding='Page title calls this 1644, printed heading says 1646, and wording/omitted front matter do not establish a pure dated witness.',
             action='Evidence-only uncertain witness. Use the distinct Romans45 1644 and 1646 transcriptions for dated comparisons.'),
        dict(id='first-london-1644-number', url='https://www.romans45.org/creeds/bc1644.htm',
             finding='All 52 article positions are present, but position 36 is labelled XXVI instead of XXXVI; article 43 also lacks the usual trailing period.',
             action='Preserve the offered transcription. Use position plus heading/body locator and flag the numbering typo in comparisons.'),
        dict(id='first-london-composite', url='https://www.london1644.info/documents/1LCF-EN-CompEd-Documentation-A4-Paper.pdf',
             finding='2022 editorial composite and documentation combine historical versions and include an additional Lord\'s Supper article.',
             action='Editorial comparison only; not an untouched 1644/1646 confession or the project\'s working doctrinal standard.'),
        dict(id='founders-106-toc', url=next(a['url'] for a in m['files'] if a.get('expectedIssue') == 106),
             finding='Contents labels Decree of God as chapter 7; editor introduction identifies chapters 3 and 5. Original 1689 chapter 7 is covenant.',
             action='Map decree to 3 and providence to 5, retaining publisher typo as source evidence.'),
        dict(id='founders-113-cover', url=next(a['url'] for a in m['files'] if a.get('expectedIssue') == 113),
             finding='Cover prints ISSUE 112 although publisher issue page and offered filename identify 113. Summer 2018 and perseverance contents differ from true Spring 2018 issue 112.',
             action='Record publisher identity 113 with cover-number conflict; do not silently rewrite the cover.'),
        dict(id='founders-114-filename', url=next(a['url'] for a in m['files'] if a.get('expectedIssue') == 114),
             finding='Offered filename is FoundersJournal109.pdf; cover and body identify Fall 2018, issue 114, Assurance.',
             action='Keep exact source URL; catalogue as 114 with filename warning, not a duplicate of true issue 109.'),
        dict(id='founders-110-limits', url=next(a['url'] for a in m['files'] if a.get('expectedIssue') == 110),
             finding='Editor explicitly omits separate discussion of justification paragraphs 4 and 5.',
             action='Chapter coverage is substantial, not exhaustive paragraph coverage.'),
        dict(id='founders-117-119-format', url='https://founders.org/journal/journal-22414/',
             finding='No offered PDF found on reviewed issue 117/119 pages. Complete offered HTML articles acquired instead (4 and 5 respectively).',
             action='Do not claim complete print issues; issue 119 includes one incidental book review, not a new complete book.'),
        dict(id='pdf-text-layer', url='https://www.london1644.info/documents/1LCF-EN-CompEd-Documentation-A4-Paper.pdf',
             finding='MuPDF warns about missing graphics resource a0; all 34 pages have substantial readable text. Other short pages are covers or final blank/header page.',
             action='No OCR needed for this batch; graphics fidelity is not certified.'),
        dict(id='html-encoding', url='https://founders.org/',
             finding='Automatic charset detection misread some valid UTF-8. Private derivatives rebuilt from identical originals, preferring valid UTF-8.',
             action='Final derivative hashes and word counts are in the manifest; original hashes remain unchanged.'),
    ]
    write('source-exceptions.json', dict(reviewedAt=now, issues=issues))
    scopes = []
    for a in m['files']:
        role = 'selected-historical-Baptist-teaching'
        if a.get('expectedIssue'):
            role = 'selected-confession-exposition-with-incidental-journal-context'
        if a['url'] in ['https://www.reformedreader.org/ccc/h.htm', 'https://www.london1644.info/documents/1LCF-EN-CompEd-Documentation-A4-Paper.pdf']:
            role = 'edition-comparison-evidence-only'
        if a['url'] == 'https://founders.org/articles/the-puritans-a-transatlantic-history/':
            role = 'incidental-review-not-core-teaching-or-complete-reviewed-book'
        scopes.append(dict(assetId=a['assetId'], url=a['url'], role=role,
                           includedPrefixes=a.get('includedPrefixes'),
                           publicHostingAllowed=False,
                           review='admission-decisions.json; source-exceptions.json',
                           componentReviewRequired=bool(a.get('expectedIssue'))))
    write('intake-scope.json', dict(files=scopes,
        implementationStatus='Metadata contract only; not a claim that the current importer enforces these scopes.',
        requiredBeforeAggregateImport=[
            'Keep the shared JSON bundled original; extract only reviewed Beddome and Collins prefixes into separately attributed work records.',
            'Use bibliography work identities, not one logical book per HTML page or per format.',
            'Carry evidence-only and historical-difference labels into retrieval; no blanket author/contributor approval.',
            'Classify journal components before treating incidental reviews/editorial proposals as core teaching.',
            'Merge this batch into the one post-campaign intake; reuse unchanged vectors. No RB01 worker launch.',
        ]))
    checkpoint = dict(mission='RB01', state='bounded-acquisition-complete', closedAt=now,
        clockAuditStart='2026-10-07T05:21:24Z',
        timingNote='Orientation/audit was already underway at first clock reading; approximately one hour including final review/documentation.',
        actualOriginalFiles=121, logicalBibliographicRecords=26, whollyNewHistoricWorks=6,
        completedPreviouslyPartialWorks=['work-rb01-dagg-manual-theology'],
        pendingUrls=[], activeRB01Collector=False, imported=False, embedded=False,
        sourceRoot=str(ROOT / 'sources'),
        derivativeRoot=str(SITE / '.local/library/run-rb01-2026-10-07/text'),
        exactNextActions=[
            'RB02: read RB01 REPORT, bibliography, admission decisions and intake scopes before fetching. Reuse acquired Dagg Church Order, Cox appendix and 1689 ordinance exposition; reuse existing Coxe, Pink and Gill. Audit new Booth/Keach gaps.',
            'If resuming RB01 itself, run the verification commands below first. There are no unfinished approved URLs to retry. New candidates need explicit reviewed targets and source policies.',
            'Remaining RB01 research: authorized complete modern Waldron/Renihan explanations, exact printed-edition collation, independent source/contributor review and paragraph-level coverage (including justification 11:4-5).',
            'After all 14 owner-authorized missions, follow the newer HANDOFF / knowledge/ACQUISITION-FOLLOWUP.md gate. Reconcile source-first identities and scopes before aggregate DB/vector import. This run did not start that import.',
        ],
        commands=[
            'python -u -X utf8 scripts/rb01-acquire.py verify',
            'python -u -X utf8 scripts/report-rb01.py',
            'python -u -X utf8 scripts/rb01-acquire.py acquire',
        ],
        commandNote='Run from Website. Acquire is idempotent and currently has zero pending targets; it does not launch OCR or embedding.')
    write('checkpoint.json', checkpoint)
    m['closedAt'] = now
    m['state'] = 'bounded-acquisition-complete'
    m['sourceExceptions'] = 'source-exceptions.json'
    m['intakeScope'] = 'intake-scope.json'
    write('acquisition-manifest.json', m)
    rows = []
    for x in exposition['chapters']:
        locations = []
        for loc in x['locations']:
            label = ('p. ' + ', '.join(map(str, loc['printedArticleStartPages']))) if loc['printedArticleStartPages'] else 'complete article'
            locations.append(f"[{label}]({loc['url']})")
        rows.append(f"| {x['chapter']} | {x['topic']} | {x['issue']} | {'; '.join(locations)} |")
    report = f'''# RB01 — Baptist doctrinal foundation and confessional explanation

**Closed:** {now}. **State:** bounded acquisition complete; further research remains. Approximately one hour of audit, acquisition, review and documentation. No RB01 download worker remains. First clock audit: 05:21:24 UTC; orientation/audit was already underway. This is not a claim that every possible Baptist doctrinal work has been found.

## Actual result

**121 immutable originals** ({v['originalBytes']:,} bytes; {v['originalBytes']/1048576:.2f} MiB): **103 HTML, 17 PDF, one JSON**. All originals and private derivatives passed SHA-256 checks. All 121 approved URLs acquired; zero pending URLs or unresolved acquisition failures. No new OCR, audio, model extraction, database rebuild or embedding worker. The separate Bible source tree was used; Fortress's other corpus was not changed.

**26 logical bibliography records:** six wholly new historical works, completion of previously partial Dagg Part I, 18 selected Founders journal issue records, and one editorial comparison document. HTML components, formats and First London witnesses are not counted as separate new books. The JSON package is one original shared by two separately attributed catechism works; incidental standards in that package are not independent new admissions.

| Work | Actual coverage | New coverage / limits |
|---|---|---|
| John L. Dagg, *Manual of Theology*, Part I (1857) | 41 HTML files; all eight books, 25 chapters, preface, introductions/conclusions and appendix; {sum(a['derivedText']['wordCount'] for a in by_work['work-rb01-dagg-manual-theology']):,} extracted words | Completes the previous Book II/*Doctrine of God* excerpt. All TOC file links present; one defective section anchor documented. |
| Dagg, *A Treatise on Church Order*, Second Part (1858) | 14 HTML files; chapters 1–10, preface, introduction, conclusion and appendix | New complete offered digital witness. Historic communion/polity positions remain identified. RB05 should reuse it. |
| *Philadelphia Confession* (1742) | Chapters 1–34, each as its own offered HTML source | New complete chapter sequence; singing and laying-on-of-hands chapters are preserved, not silently equated to the 32-chapter 1689. |
| *First London Confession* | Distinct offered 1644 and 1646 Romans45 transcriptions; 1644 preface/signatories retained; 1646 includes Cox appendix; plus an uncertain Reformed Reader witness | One historical work with separate witnesses. No critical-edition certification; the Reformed Reader date conflict is evidence-only. |
| Benjamin Cox, *An Appendix to a Confession of Faith* (1646) | Standalone 22 declarations, also present inside the 1646 confession witness | One work, not two. Benjamin Cox is not Nehemiah Coxe. |
| Benjamin Beddome, *A Scriptural Exposition of the Baptist Catechism* | All 114 numbered units, **2,611 nested question/answer records**, Scripture references; full HTML companion and offered structured JSON | New sustained doctrinal explanation. 266 source-located catechism units total when combined with Collins; 109/114 parent-question headings match after normalization, five minor variants reviewed. |
| Hercules Collins, *An Orthodox Catechism* (1680) | All 152 numbered questions, preface and singing appendix in the offered structured JSON | New complete offered numbered witness. Heidelberg-derived wording and questions 79–82 on laying on hands remain visible; not mechanically harmonized to 1689. The Reformed Reader excerpt was not treated as complete. |
| Founders 1689 exposition | 16 complete offered issue PDFs; four complete web articles for issue 117, five for 119 | 18 issue records; web article sets are **not** claimed as complete print issues. One issue-119 book review is incidental context, not a complete new book/core teaching admission. |
| London1644.info Comprehensive Edition documentation (2022) | 34-page PDF, readable existing text layer | Editorial composite/textual evidence only; not a pure historic confession or the project's doctrinal standard. |

Exact final word counts, byte counts, retrieval timestamps, source/final URLs, edition claims, rights evidence, paths and hashes are in [the acquisition manifest](acquisition-manifest.json). Counts include overlapping witnesses and companion formats; no unique-word count is claimed.

## Existing holdings audited and deliberately reused

- Boyce's *Abstract of Systematic Theology* EPUB: actual chapters I–XLII (42), with the *Brief Catechism of Bible Doctrine* and *Abstract of Principles* already inside it. No duplicate acquisition needed.
- Gill's *Doctrinal Divinity*: seven books / 107 chapters. *Practical Divinity*: five books / 49 chapters. Original files verified, alongside held *Cause of God and Truth* and treatises. This mission did not re-download Gill.
- Existing Second London witnesses: 32 chapters / 160 paragraphs, proof-reference variants and an EPUB containing foreword, signatories and baptism appendix. Existing Baptist Catechism: all 114 questions with proofs. These were not counted anew from the shared JSON package.
- Keach holdings, including *Glory of a True Church*, were reviewed. Its complete ending is present; RB05 should reuse it. A Cox mention inside Keach's short confession did not establish a held Cox appendix.
- Existing Savoy completion, A. A. Hodge's Westminster explanation and larger bibliography/manifests were checked before deciding these Baptist gaps. A catalogue absence alone was never treated as a missing original.

Evidence: [holdings audit](holdings-audit.json), [confession audit](confession-holdings-audit.json), [new confessional sequences](confessional-coverage.json), [Gill doctrinal coverage](gill-doctrinal-divinity-coverage.json), [Gill practical coverage](gill-practical-divinity-coverage.json), [input audit](input-audit.json). Existing assets remain existing acquisitions, even when newly understood here.

## 1689 explanation map — table before graph

These are **chapter/topic locations**, not a claim of exhaustive paragraph commentary or theological equivalence. PDF pages are printed article starts. The church chapter spans issues 121 and 122. Providence is in 106, not simply bundled into 107. All 32 chapter topics have an acquired location.

| 1689 chapter | Topic | Primary issue | Acquired reading location |
|---|---|---|---|
{chr(10).join(rows)}

Issue 110 explicitly omits separate treatment of justification paragraphs 4 and 5. Issue 116 includes a proposed expansion of chapter 20; proposed modern wording remains commentary, not original confession wording. Each writer's contribution is retained in the source; the journal's doctrinal statement does not grant universal approval to every contributor or reviewed book. [Machine-readable map](exposition-coverage.json); [source-located catechism units](study-units.json).

## Selection, source evidence and rights

The work-level screening used the six doctrinal anchors in the shared protocol. [Admission decisions](admission-decisions.json) preserve actual source locators for Dagg, Beddome and Collins (Scripture, Trinity, Christ's two natures, satisfaction/atonement, faith/grace and bodily resurrection), confession identities, historical differences and Founders' confessional basis. These are bounded AI-assisted decisions, not independent human certification or global author-registry approval.

- [The Reformed Reader Dagg contents](https://www.reformedreader.org/rbb/dagg/mottoc.htm) provides the offered Part I structure. [Founders Church Order contents](https://founders.org/library-book/a-treatise-on-church-order/) supplies Part II. Historic underlying text does not automatically clear a host's electronic packaging for public republication.
- [SVRBC beliefs](https://svrbc.org/beliefs/) and the actual catechism text support the bounded doctrinal selection. [BaptistCatechism.org copyright/download terms](https://baptistcatechism.org/copyright) explicitly offer the whole JSON and CC0 original transcription/markup. The exceptions for ESV quotations and music were reviewed; no music/audio acquired. Only reviewed Beddome/Collins prefixes are extracted here; other bundled standards remain incidental package context.
- [Founders' stated basis](https://founders.org/about/) is the 1689 confession and Abstract of Principles. Exact offered journal links were discovered through the public issue inventory and each issue page; PDF downloads were not guessed. Copyright remains reserved. These are bounded private noncommercial reading copies, not public body-hosting clearance or whole-site mirroring.
- [London1644.info download terms](https://www.london1644.info/en/downloads_en.html) distinguish unchanged offered downloads from other uses. Its modern composite stays editorial evidence.

The collector honored robots rules and Founders' 30-second crawl delay, used one acquisition worker and a persisted cache, and verified every original before reuse. No paywall, login or restriction was bypassed. Originals remain outside the Git website tree; private derivatives remain under `.local/library/run-rb01-2026-10-07/text/`. All acquired URLs are listed individually in [SOURCES.md](../../../../../SOURCES.md#rb01-baptist-doctrinal-and-confessional-acquisition-2026-10-07).

## Defects, failures and remaining gaps

[Source exceptions](source-exceptions.json) records the missing Dagg anchor, uncertain Reformed Reader First London date, editorial composite, issue-106 chapter-number typo, issue-113 cover-number conflict and issue-114 filename mismatch. These source defects were not corrected in original bytes. PDF text checks cover every page; short pages are covers or the final header-only page of issue 123, not an unresolved scan-only body. The London1644 PDF emits a graphics-resource warning but has coherent text on all pages. Graphics fidelity and exact printed-edition collation remain unverified.

Two complete editorial introductions initially failed a 300-word heuristic (226 / 258 words); their actual endings and genre were reviewed, a 200-word threshold plus content markers applied, and both acquired from cached bytes. Failures are resolved, not hidden missing downloads. An old Founders Dagg URL returned 404 during discovery; a legitimate offered source was used instead. No unresolved 429 retry was pursued.

Sam Waldron's modern exposition and James Renihan's modern symbolics remain commercial/authorized-free-text discovery gaps. Publisher samples/syllabus references do not count as complete acquired books. [Decision queue](discovery-queue.json). Further independent contributor review, historical-edition collation and paragraph-level indexing remain work, not claims of completion.

## Exact resumption checkpoint

[checkpoint.json](checkpoint.json) records zero pending approved URLs, local source/derivative roots and exact next actions. From `Website`:

```powershell
python -u -X utf8 scripts/rb01-acquire.py verify
python -u -X utf8 scripts/report-rb01.py
```

`python -u -X utf8 scripts/rb01-acquire.py acquire` is idempotent and currently has nothing pending. Add only separately reviewed eligible targets for any future expansion. Do not rerun author-wide downloads or count formats as new works.

**Next mission:** RB02, reusing acquired Dagg Church Order, Cox appendix and 1689 ordinance explanations alongside existing Coxe, Pink and Gill. Audit Booth/Keach work-specific gaps next.

**DB boundary:** no RB01 import or embedding was started. The newer owner-authorized **14-mission** follow-up in HANDOFF / `knowledge/ACQUISITION-FOLLOWUP.md` supersedes the original eight-mission timing. Before aggregate import, reconcile source-first bibliography and [intake-scope.json](intake-scope.json): split the bundled JSON by reviewed prefixes, carry evidence-only/difference labels, and classify incidental journal components. That file is a metadata contract, **not** a claim that the current importer already enforces it. Reuse unchanged vectors during the one post-campaign intake.
'''
    # REPORT.md is deliberately the last completion artifact: scheduled intake
    # must not interpret a partially documented batch as finished.
    block = '\n## RB01 Baptist doctrinal and confessional acquisition (2026-10-07)\n\n'
    block += '**Actual private holdings:** 121 verified originals (103 HTML, 17 PDF, one JSON); six wholly new historical works, completion of Dagg Part I, 18 selected Founders issue records, one editorial comparison document. [Mission report](content/library/reports/reformed-baptist-overnight/RB01/REPORT.md), [full provenance/hash ledger](content/library/reports/reformed-baptist-overnight/RB01/acquisition-manifest.json), [32-chapter explanation map](content/library/reports/reformed-baptist-overnight/RB01/exposition-coverage.json), [admission decisions](content/library/reports/reformed-baptist-overnight/RB01/admission-decisions.json), [rights and intake scope](content/library/reports/reformed-baptist-overnight/RB01/intake-scope.json). Downloaded and readable, not newly embedded.\n\n'
    block += 'Dagg: complete offered Part I and Church Order. New Philadelphia (34 chapters), distinct First London witnesses, Cox appendix, Beddome exposition (114 units / 2,611 nested Q&A), Collins Orthodox Catechism (152 questions). Founders: 16 full offered PDFs plus complete HTML article sets for 117/119; not 18 complete print issues. Boyce, Gill and existing 1689/Baptist Catechism holdings reused. Editorial composites, uncertain dates, modern chapter expansions and incidental reviews retain their labels. Historic text/public reading does not imply public republication clearance; no raw bodies hosted.\n\n'
    block += '<details>\n<summary>Every acquired original and its source (121 files)</summary>\n\n| Work/component as acquired | Exact source URL | Format / completeness |\n|---|---|---|\n'
    for a in m['files']:
        title = ' '.join(a['title'].split()).replace('|', '\\|')
        block += f"| {title} | [Source]({a['url']}) | {a['format']} · {a['completeness']} |\n"
    block += '\n</details>\n'
    sources = SITE / 'SOURCES.md'
    old = sources.read_text(encoding='utf-8')
    marker = '\n## RB01 Baptist doctrinal and confessional acquisition (2026-10-07)\n'
    start, end = '<!-- RB01 sources:start -->', '<!-- RB01 sources:end -->'
    block = start + '\n' + block + '\n' + end + '\n'
    if start in old:
        stop = old.index(end, old.index(start)) + len(end)
        sources.write_text(old[:old.index(start)] + block.rstrip() + old[stop:], encoding='utf-8', newline='\n')
    else:
        assert marker not in old, 'Unbounded existing RB01 section: review before replacing.'
        sources.write_text(old.rstrip() + '\n\n' + block, encoding='utf-8', newline='\n')
    backlog = SITE / 'content/library/BACKLOG.md'
    text = backlog.read_text(encoding='utf-8')
    entry = '**RB01 executed (2026-10-07):** [Verified acquisition and exact checkpoint](reports/reformed-baptist-overnight/RB01/REPORT.md): 121 readable originals, six new historical works, completed Dagg Part I, 18 selected Founders issue records and one editorial comparison. Boyce/Gill/1689 duplicates avoided. All chapter topics located; paragraph/edition/contributor review remains. No RB01 DB/embedding launch. RB02 should reuse Dagg Church Order, Cox appendix and ordinance explanations. Follow newer 14-mission aggregate-intake gate.\n\n'
    if '**RB01 executed (2026-10-07):**' not in text:
        backlog.write_text(text.replace('# Acquisition backlog\n\n', '# Acquisition backlog\n\n' + entry, 1), encoding='utf-8', newline='\n')
    todo = ROOT / 'TODO.md'
    text = todo.read_text(encoding='utf-8')
    entry = '- [x] Execute RB01 Baptist doctrinal/confessional acquisition (2026-10-07): 121 hash-verified readable originals; full Dagg both parts, Beddome/Collins, historical confessions and 1689 explanation series. [Report and exact resumption checkpoint](Website/content/library/reports/reformed-baptist-overnight/RB01/REPORT.md). Six new historic works plus completed partial Dagg; no new embedding claim.\n- [ ] Continue RB02–RB14, reusing RB01 holdings. Before one aggregate intake, reconcile the [work identities and bounded intake scopes](Website/content/library/reports/reformed-baptist-overnight/RB01/intake-scope.json); preserve historical differences, evidence-only witnesses and incidental-review labels.\n\n'
    if '- [x] Execute RB01 Baptist' not in text:
        first, rest = text.split('\n', 1)
        todo.write_text(first + '\n\n' + entry + rest.lstrip('\n'), encoding='utf-8', newline='\n')
    handoff = ROOT / 'HANDOFF.md'
    text = handoff.read_text(encoding='utf-8')
    entry = '## 2026-10-07: RB01 acquired, verified and checkpointed\n\n121 immutable readable originals (103 HTML, 17 PDF, one JSON); six wholly new historical works, completion of previously partial Dagg Part I, 18 selected Founders issue records and one editorial comparison document. Dagg both parts complete as offered, Beddome 114/2,611 nested Q&A, Collins 152; all 32 1689 chapter topics have source locations, not exhaustive paragraph commentary. Boyce/Gill/1689/Catechism complete holdings audited and reused. [Full report](Website/content/library/reports/reformed-baptist-overnight/RB01/REPORT.md), [exact checkpoint](Website/content/library/reports/reformed-baptist-overnight/RB01/checkpoint.json), [source/edition exceptions](Website/content/library/reports/reformed-baptist-overnight/RB01/source-exceptions.json). All source URLs listed in Website/SOURCES.md. No active RB01 collector; no RB01 DB/vector worker started.\n\nRB02 next: reuse Dagg Church Order, Cox appendix and ordinance explanations; audit existing Coxe/Pink/Gill before Booth/Keach expansion. Follow the newer **14-mission** automatic aggregate intake contract below. [Intake scopes](Website/content/library/reports/reformed-baptist-overnight/RB01/intake-scope.json) must be reconciled before treating bundled standards, editorial composites or incidental reviews as teaching records; current importer enforcement is not claimed. Modern Waldron/Renihan complete books remain authorized-source gaps. Source-first bibliography is not a blanket author-registry approval.\n\n'
    if '## 2026-10-07: RB01 acquired, verified and checkpointed' not in text:
        text = entry + text
    text = text.replace('Campaign is prepared, not executed.', 'RB01 bounded acquisition executed; later missions retain their own states. See the RB01 report/checkpoint above.')
    handoff.write_text(text, encoding='utf-8', newline='\n')
    (R / 'REPORT.md').write_text(report, encoding='utf-8', newline='\n')
    print('RB01 closed:', now, '121 originals; SOURCES/BACKLOG/TODO/HANDOFF updated.')


if __name__ == '__main__':
    main()
