# Historical confessions and catechisms — L08

Verified 2026-10-05. This bounded collection preserves six works in acquired witnesses and catalogs five further standards as source links. It is not a complete historical confessions library, a critical edition, or a public website release.

## Collection and edition boundaries

| Work | Acquired witness | Inventory and limitations |
|---|---|---|
| Westminster Confession | Creeds.json, historic 1647 form claimed by source | 33 chapters, 172 paragraphs; structured proof groups and attachment markers preserved. Chapter 23.3 retains the historic magistrate wording, unlike the current OPC form. No complete scan collation. |
| Westminster Shorter Catechism | Creeds.json, 1647 source claim | All 107 answers; **this file has no proof apparatus**. Proof-bearing editions must be acquired separately. |
| Westminster Larger Catechism | Creeds.json, 1647 source claim | All 196 answers and their structured proof groups. Endpoint checks do not certify that every source citation is correct. |
| Second London Baptist Confession | Creeds.json plus two separate lwalen witnesses | 32 chapters, 160 paragraphs in each. The CC0 Markdown witness supplies 160 paragraph-level proof blocks. JSON spelling and Markdown wording/apparatus remain separate. The 1677 date and 1689 reception title are retained; preface, signatories and baptism appendix are outside this supplied inventory. |
| Baptist Catechism | Creeds.json, **1695 witness** | 114 questions and answers with proofs. Source attribution to William Collins is retained, pending independent attribution review. It is not silently renamed “Keach 1693” or merged with a 1794 catechism. |
| John Flavel, *Exposition of the Assemblies Catechism* | Creeds.json modernized witness; separately acquired Salisbury 1767 scan | 125 source blocks, including 23 labeled `?`, and 1,244 nested questions/answers. They are not 125 numbered Westminster questions. Original wording, unknown labels and nested numbering remain intact. |

Flavel’s **1688** date describes the Dartmouth exercises, as the scanned title leaf states. The [National Diet Library record](https://ndlsearch.ndl.go.jp/books/R100000097-I4920000005077205) records a **1692** publication; the acquired [Oxford/Google scan](https://archive.org/details/anexpositionass00flavgoog) is **1767**, printed and sold by Edward Easton, Salisbury (PDF page 6, visually inspected). The modernized digital witness is not established as a faithful transcription of that impression. Public reuse of its modernization remains on hold despite the upstream license declaration.

Five additional [linked holdings](linked-holdings.json) preserve identified source boundaries:

- **Heidelberg:** Schaff’s German/English presentation, questions 1–129, printed pp. 307–355. Its note identifies the absence of question 80 from the first 1563 edition. No first-edition scan acquired. [Source](https://ccel.org/ccel/schaff/creeds3/creeds3.iv.vi.html)
- **Belgic:** received 1619 revision, articles I–XXXVII, not an unchanged first 1561 text. [Source](https://ccel.org/ccel/schaff/creeds3/creeds3.iv.viii.html)
- **Dort:** Latin and English presentations must remain separate. The source describes the English positive-article text as abridged, omitting rejection-of-errors sections. It cannot stand for the complete canons. [Source](https://ccel.org/ccel/schaff/creeds3/creeds3.iv.xvi.html)
- **Savoy:** a 1658 section is identified in Schaff’s contents, but repeated body retrieval failed. Exact coverage remains unverified. The separately available Reformed Standards text is explicitly excluded from Creeds.json’s reuse grant and was not downloaded. [Contents](https://ccel.org/ccel/schaff/creeds3/creeds3.toc.html)
- **Thirty-Nine Articles:** the linked compilation distinguishes the 1563 Latin, 1571 English and 1801 American columns. Changes at VIII, XXI and XXXVII are not interchangeable wording. [Source](https://ccel.org/ccel/schaff/creeds3/creeds3.iv.xi.html)

The existing Ursinus record `work-ursinus-catechism` remains a **prolegomena excerpt**, not a newly acquired full Heidelberg commentary. Flavel is the substantial acquired explanation in this batch. Watson, Ursinus’s complete commentary and A. A. Hodge’s confessional exposition remain acquisition targets.

## Counts and preservation

- **11 new root works**, 482 numbered chapter/question components, **14 edition records**, **14 asset records** (9 downloaded files, 5 source links), and 5 ordered inventories.
- **8 digital witnesses**, **2,438 indexed witness units**, including Flavel’s 1,244 nested answers. Parallel copies are counted as witnesses, not new root works.
- **4,616 structured source-reference strings** in WCF, WLC and the Baptist Catechism. Comma-separated references expand into endpoint-checked citation spans. All source markers match their attached proof IDs; no endpoint/syntax failures in this batch. These checks do **not** establish citation accuracy or doctrinal adequacy.
- **160 additional exact proof blocks** in the CC0 Baptist Markdown witness remain unparsed. Flavel’s inline Scripture quotations and references remain inside their original answers. The WSC witness has no proofs to index.
- **8 editorial comparisons**, plus a shared subject index and additional continental subject locators. **0 new public publications**, 0 full-text search ingestions, and no claim of full scholarly review.

[Inventory](inventory.json) retains article/paragraph/question labels, original headings, question text, asset/edition IDs, exact answer/content pointers, nested relationships and payload hashes. Full answers and source wording remain in the immutable acquired originals under `BibleProject/sources/library/`; they are not overwritten by editorial summaries. Markdown offsets are Unicode code points after UTF-8-sig decoding, preserving original newlines. Flavel block IDs identify positions in this frozen witness, not invented historic question numbers.

Retrieve any exact unit locally, including its answer and proof attachments:

```powershell
python -X utf8 scripts/read-confessional-unit.py unit-l08-wlc-q166
python -X utf8 scripts/read-confessional-unit.py unit-l08-lbc-cc0-md-c29-p02
```

The reader verifies both the original asset hash and the unit payload hash before returning it. [Acquisition manifest](acquisition-manifest.json) retains SHA-256, byte counts, URLs, retrieval times and both pinned repository commits. Originals are separate from the git catalog and must be included in library backups.

## Related subjects without doctrinal flattening

[Comparisons](comparisons.json) distinguish:

1. **Baptism recipients:** Westminster includes believers’ infants; the Baptist documents require personal profession and exclude infants.
2. **Baptism mode:** Westminster permits pouring/sprinkling; Second London requires immersion.
3. **Covenant formulation:** Westminster explicitly speaks of one covenant under different administrations; Second London emphasizes progressive revelation and the eternal transaction. This does not settle all later Baptist covenant debates.
4. **Church government:** authoritative synodical determinations in Westminster differ from advisory interchurch messengers without jurisdiction in Second London.
5. **Justification:** substantial agreement, with distinct wording concerning Christ’s active and passive obedience; expanded wording is not evidence that the other text denies the claim.
6. **Magistrates:** the acquired historic Westminster form differs materially from the current [OPC text, 23.3](https://www.opc.org/wcf.html).
7. **Heidelberg editions:** question 80 must not be projected into the first 1563 edition.
8. **Anglican editions:** English and American changes remain column-specific.

All acquired chapters/questions have [subject navigation assignments](subject-map.json). These are editorial categories, not harmonized teachings. The [proof index](proof-index.json) treats proof texts as **citations**, never as substantial exposition or sermon coverage. Flavel’s blocks receive the general catechesis tag pending detailed subject review.

The [160-paragraph Baptist witness crosswalk](witness-crosswalk.json) aligns all three copies while preserving their headings, text-equality results and separate proof apparatus. The unnumbered Markdown adoption paragraph has an explicit editorial alignment, not an invented source numeral. A wording difference is not automatically classified as a doctrinal difference.

## Quality and rights exceptions

[Issue register](issues.json) preserves source defects instead of silently repairing them. The Creeds.json Baptist headings at chapters 20, 21 and 25 are wrong or misspelled; the CC0 witnesses provide independently preserved headings. The Markdown chapter 12 paragraph has no numeral and stays `unnumbered`; chapter 22.6 has indentation that the parser handles without dropping it. Flavel’s 23 `?` blocks remain unresolved.

The [Creeds.json license statement](https://github.com/NonlinearFruit/Creeds.json/blob/2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5/README.md) covers selected files under Unlicense and expressly excludes others. The [lwalen license](https://github.com/lwalen/lbcf/blob/235da776742a7956ebb678ec236382813dbe2c33/LICENSE) is CC0. Neither licenses unrelated modern translations. Modern continental translations observed during discovery were not copied into the collection on the strength of an old composition date. Flavel’s historic print text and modernized transcription have separate rights decisions; Google/Oxford scan packaging is retained for research, with public hosting unresolved.

## Verification and continuation

```powershell
python -X utf8 scripts/catalog-confessional-standards.py
python -X utf8 scripts/tests/test_confessional_standards.py
node scripts/validate-library.mjs
```

Tests check all 2,438 source payload round trips, proof attachment/order, numbering and absent apparatus, doctrine comparison targets, license/publication boundaries, and Flavel’s distinct delivery/print dates. The build is offline and reproducible from retained originals; it does not modify `publication.json` or the website.

Resume from [checkpoint](checkpoint.json): acquire a proof-bearing WSC witness; independently identified continental/Savoy texts and complete Dort rejection sections; collate Flavel and source proof readings; expand the qualifying explanation corpus. This batch’s completion concerns the named inventory and acquisitions, not those remaining gaps.
