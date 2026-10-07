> **RB05 correction (7 October 2026):** the held Founders Introduction is signed Stan Reeves and discusses the modern 1689 confession; it is not Dagg's historical introduction. Its identity and metadata-only intake hold are corrected. RB05 acquired the missing *Obedience to Christ* introduction; combine it with the 13 historical RB01 components. [Correction evidence](../RB05/identity-corrections.json), [RB05 report](../RB05/REPORT.md). Dagg’s preface also credits G. W. Samson with the chief Appendix article; that component now has a contributor-aware intake hold. The original report below is the earlier acquisition snapshot.

# RB01 — Baptist doctrinal foundation and confessional explanation

**Closed:** 2026-10-07T06:12:59.925023+00:00. **State:** bounded acquisition complete; further research remains. Approximately one hour of audit, acquisition, review and documentation. No RB01 download worker remains. First clock audit: 05:21:24 UTC; orientation/audit was already underway. This is not a claim that every possible Baptist doctrinal work has been found.

## Actual result

**121 immutable originals** (76,594,405 bytes; 73.05 MiB): **103 HTML, 17 PDF, one JSON**. All originals and private derivatives passed SHA-256 checks. All 121 approved URLs acquired; zero pending URLs or unresolved acquisition failures. No new OCR, audio, model extraction, database rebuild or embedding worker. The separate Bible source tree was used; Fortress's other corpus was not changed.

**26 logical bibliography records:** six wholly new historical works, completion of previously partial Dagg Part I, 18 selected Founders journal issue records, and one editorial comparison document. HTML components, formats and First London witnesses are not counted as separate new books. The JSON package is one original shared by two separately attributed catechism works; incidental standards in that package are not independent new admissions.

| Work | Actual coverage | New coverage / limits |
|---|---|---|
| John L. Dagg, *Manual of Theology*, Part I (1857) | 41 HTML files; all eight books, 25 chapters, preface, introductions/conclusions and appendix; 151,001 extracted words | Completes the previous Book II/*Doctrine of God* excerpt. All TOC file links present; one defective section anchor documented. |
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
| 1 | Holy Scripture | 104 | [p. 6, 14, 21, 27, 33, 40](https://founders.org/wp-content/uploads/2017/06/FoundersJournal104.pdf) |
| 2 | God and the Holy Trinity | 105 | [p. 6](https://founders.org/wp-content/uploads/2016/10/FoundersJournal105.pdf) |
| 3 | God's Decree | 106 | [p. 6, 15, 23, 42](https://founders.org/wp-content/uploads/2017/10/FoundersJournal106r.pdf) |
| 4 | Creation | 107 | [p. 6](https://founders.org/wp-content/uploads/2017/03/FoundersJournal107.pdf) |
| 5 | Divine Providence | 106 | [p. 33](https://founders.org/wp-content/uploads/2017/10/FoundersJournal106r.pdf) |
| 6 | The Fall, Sin and Punishment | 107 | [p. 14, 21, 29](https://founders.org/wp-content/uploads/2017/03/FoundersJournal107.pdf) |
| 7 | God's Covenant | 108 | [p. 6, 13, 20](https://founders.org/wp-content/uploads/2017/12/FoundersJournal108N.pdf) |
| 8 | Christ the Mediator | 108 | [p. 27, 36, 45](https://founders.org/wp-content/uploads/2017/12/FoundersJournal108N.pdf) |
| 9 | Free Will | 109 | [p. 7](https://founders.org/wp-content/uploads/2017/12/FoundersJournal109N.pdf) |
| 10 | Effectual Calling | 109 | [p. 18, 28](https://founders.org/wp-content/uploads/2017/12/FoundersJournal109N.pdf) |
| 11 | Justification | 110 | [p. 4, 12, 22, 32, 40](https://founders.org/wp-content/uploads/2017/10/FoundersJournal110.pdf) |
| 12 | Adoption | 111 | [p. 9](https://founders.org/wp-content/uploads/2018/03/FoundersJournal111.pdf) |
| 13 | Sanctification | 111 | [p. 16, 24, 36](https://founders.org/wp-content/uploads/2018/03/FoundersJournal111.pdf) |
| 14 | Saving Faith | 112 | [p. 6](https://founders.org/wp-content/uploads/2018/06/FoundersJournal112.pdf) |
| 15 | Repentance unto Life and Salvation | 112 | [p. 17](https://founders.org/wp-content/uploads/2018/06/FoundersJournal112.pdf) |
| 16 | Good Works | 112 | [p. 25, 32](https://founders.org/wp-content/uploads/2018/06/FoundersJournal112.pdf) |
| 17 | Perseverance | 113 | [p. 8, 20, 28](https://founders.org/wp-content/uploads/2018/09/FoundersJournal113.pdf) |
| 18 | Assurance | 114 | [p. 8](https://founders.org/wp-content/uploads/2018/12/FoundersJournal109.pdf) |
| 19 | The Law of God | 115 | [p. 6, 14, 25, 38, 45](https://founders.org/wp-content/uploads/2019/04/FoundersJournal115.pdf) |
| 20 | The Gospel and the Extent of Its Grace | 116 | [p. 6, 10, 19, 28](https://founders.org/wp-content/uploads/2019/06/FoundersJournal116.pdf) |
| 21 | Christian Liberty and Liberty of Conscience | 117 | [complete article](https://founders.org/articles/of-christian-liberty-and-liberty-of-conscience/) |
| 22 | Religious Worship and the Sabbath Day | 117 | [complete article](https://founders.org/articles/chapter-22-biblically-regulated-religious-worship/) |
| 23 | Lawful Oaths and Vows | 117 | [complete article](https://founders.org/articles/by-that-glorious-and-dreadful-name/) |
| 24 | The Civil Magistrate | 119 | [complete article](https://founders.org/articles/of-the-civil-magistrate/) |
| 25 | Marriage | 119 | [complete article](https://founders.org/articles/of-marriage-the-1689-baptist-confession/) |
| 26 | The Church | 121 | [p. 4, 22, 28](https://founders.org/wp-content/uploads/2021/04/Founders-Journal-Issue-121-2020-Summer.pdf); [p. 6](https://founders.org/wp-content/uploads/2021/08/Founders-Journal-FULL-PLATE-2020-Fall-.pdf) |
| 27 | The Communion of Saints | 122 | [p. 10](https://founders.org/wp-content/uploads/2021/08/Founders-Journal-FULL-PLATE-2020-Fall-.pdf) |
| 28 | Baptism and the Lord's Supper | 122 | [p. 18](https://founders.org/wp-content/uploads/2021/08/Founders-Journal-FULL-PLATE-2020-Fall-.pdf) |
| 29 | Baptism | 122 | [p. 18](https://founders.org/wp-content/uploads/2021/08/Founders-Journal-FULL-PLATE-2020-Fall-.pdf) |
| 30 | The Lord's Supper | 122 | [p. 18](https://founders.org/wp-content/uploads/2021/08/Founders-Journal-FULL-PLATE-2020-Fall-.pdf) |
| 31 | The State after Death and the Resurrection | 123 | [p. 6, 13, 20](https://founders.org/wp-content/uploads/2022/02/Founders-Journal-FULL-PLATE-2021-Winter.pdf) |
| 32 | The Last Judgment | 123 | [p. 20, 40](https://founders.org/wp-content/uploads/2022/02/Founders-Journal-FULL-PLATE-2021-Winter.pdf) |

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
