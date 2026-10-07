# RB03 — sustained commentary acquisition and coverage

Completed the bounded October 7 mission after an approximately hour-long audit, acquisition and verification session, starting at **03:10:31 Eastern / 07:10:31 UTC**. The final download completed at **03:56:22 Eastern**. Exact verified state and resumption instructions: [checkpoint.json](checkpoint.json).

**380 immutable originals, 48,360,694 bytes**, with 6,854,454 extracted word tokens across private derivatives. These counts include quotations, front matter and indexes; they are not unique author prose or an exhaustive quality assessment. One retained Gill file is reference-pointer evidence, so **379 originals are candidates for body intake**, subject to the documented scopes. No new OCR, transcription, audio, model jobs, database rebuild or embedding worker was started.

## What was acquired

| Author / work family | New originals | Actual added coverage | Identity and limit |
|---|---:|---|---|
| Matthew Henry, *Commentary on the Whole Bible* | 3 XML; 31,757,951 bytes | Volume II: Joshua–Esther, 249 chapters; III: Job–Song, 243; IV: Isaiah–Malachi, 250 | Completes Old Testament coverage with held Volume I: **39 books / 929 chapter locations**, of which 742 are new. The held broad-title EPUB was only Genesis–Deuteronomy. New Testament volumes V/VI are not acquired. |
| Benjamin Keach, *Exposition of the Parables and Express Similitudes* | 3 EPUB; 1,889,820 bytes | Missing offered Books I, II and IV: 114 sermon headings; reuse III’s 32 | Completes the publisher’s four-book set: **47 parable/similitude divisions, 146 sermon headings**, including the introductory sermon sequence. Volume I has an 1858 Aylott title page and a 1701 author preface. Not a full Gospel commentary or a critically collated print edition. |
| John Gill, selected general Bible exposition | 374 JSON; 14,712,923 bytes | **25 complete offered book chapter sequences**, plus partial Chronicles witnesses, from 27 selected books / 385 requested chapters | Eleven sparse responses rejected; one retained chapter contains only reference pointers and is `evidenceOnly: true`. Not an acquisition of all 66 books, or a claim to commentary on every verse. Underlying print impression/transcription ancestry is unresolved. |

This represents **two completions of held partial works within declared scope and one newly acquired selected Gill subcorpus**, not 380 independent new books. [Source-first bibliography](bibliography.json) retains these distinctions without blanket formal-catalog or author-registry promotion.

The Gill selection is Leviticus, Numbers, Judges, 1/2 Chronicles, Ezra, Nehemiah, Esther, Job, Proverbs, Ecclesiastes, Ezekiel, all twelve minor prophets, Philemon, 2 John and 3 John. All requested source responses were attempted; there are no unattempted requests or unresolved transfer failures.

## Why these additions

Audited **186 actual held originals** and **37 documents/ledgers** before acquisition, including Pink, Gill, Keach, Bridges, Manton, Henry and all **45 numbered Calvin XML volumes**. Henry’s held *Method for Prayer* supplied additional actual-text doctrinal evidence. Earlier sermon percentages measure assigned main texts; they do not establish commentary absence.

The strongest genuine completion gaps were Henry beyond the Pentateuch and Keach beyond offered Book III. Underrepresented historical passages receive sustained Henry exposition and distinct Baptist Gill treatment. Calvin’s held Ezekiel chapter divisions stop at chapter 20, so Gill’s full 48-chapter offered sequence adds later judgment/restoration/temple material. Judges was added within the remaining budget. Ruth already has strong mapped sermon coverage and Henry’s newly acquired complete treatment, so no additional Gill expansion was pursued there.

Pink’s complete offered Hebrews exposition, his John exposition, Manton’s James, Bridges’ Proverbs/Ecclesiastes, Gill’s doctrinal/practical material and Song exposition, and Calvin’s actual offered volumes were reused. Leviticus/Numbers and the minor prophets were not completely devoid of commentary: the Gill additions fill an author/method gap rather than proving all prior conservative exposition absent. Dictionaries, lexicons and Josephus are not new commentary acquisitions here. Full rationale: [GAP-DECISIONS.md](GAP-DECISIONS.md), [held-file audit](holdings-audit.json), [Calvin identities](calvin-held-volumes.json), [Ezekiel boundary](calvin-ezekiel-boundary.json), [reused witnesses](reused-expositions.json).

## Book/chapter table and useful reading starts

[COVERAGE.md](COVERAGE.md) is the book-level table. [chapter-coverage.json](chapter-coverage.json) provides **929 Henry and 374 Gill source-hashed chapter locations**, original paths, XML IDs and offered verse-entry labels. [KEACH-READING-MAP.md](KEACH-READING-MAP.md) provides all 47 division starting passages and actual EPUB locators.

Twelve bounded [editorial reading starts](reading-starts.json) point into the acquired bodies: atonement (Leviticus 16), the bronze serpent (Numbers 21), Cyrus and return (Ezra 1), public Scripture reading (Nehemiah 8), crisis/providence (Esther 4), redeemer/resurrection (Job 19), new heart (Ezekiel 36), temple visions/river (Ezekiel 40/47), glory/shaking (Haggai 2), the pierced one (Zechariah 12), and incarnation/deceiving teachers (2 John). These are attributed reading suggestions, not automatic knowledge-graph edges or an assertion that disputed interpretations are settled.

## Source and theological exceptions

Gill’s offered **1 Chronicles 11** is empty. Chapters **14, 17–19** and **2 Chronicles 3–6, 9–10** contain only very short reference pointers and were rejected as sustained exposition. **1 Chronicles 20** is retained as source-reference evidence, excluded from separate body embedding through the current importer’s `evidenceOnly` flag. [Sparse-response evidence](sparse-chapter-exceptions.json) includes exact URLs, response hashes and private cache locations. A second pass revalidated these same cached responses; it did not hammer the source or turn them into acquired exposition.

There are **866 absent verse-entry labels within acquired Gill chapters**. This is not 866 proven missing discussions: adjacent entries can group material. The figure excludes rejected chapters and does not assert complete verse-by-verse coverage. English Gill metadata also erroneously declares right-to-left direction. Retain the source field but render actual English appropriately.

Eight specific Keach heading/body citation defects were checked against actual sermon incipits, including the axe (3:20 → 3:10), prodigal son (Luke 11 → 15), widow (Matthew 18 → Luke 18), faithful servant (24:25 → 24:45–51), strong man and unclean spirit. [passage-exceptions.json](passage-exceptions.json) preserves the evidence; originals were not rewritten. All 47 starting divisions and their locators were reviewed; no broken NCX fragment targets remain in this map.

[Work-specific admission decisions](admission-decisions.json) record actual-source confidence in the six doctrinal anchors. Gill and Keach provide historical Baptist exposition; their covenant, communion, gospel-offer and eschatological claims remain attributed. Henry is a scoped conservative Protestant exegete; his Genesis 17 circumcision-to-baptism argument is expressly distinguished from the Baptist working reference. His posthumous NT contributor volume remains deferred. Quoted rabbis, church fathers, opponents, modern editors and alternative interpretations are not independently endorsed teaching. This is AI-assisted bounded review, not exhaustive human theological approval or a change to project standards.

## Rights, preservation and verification

Offered source links and current rules were checked. [CCEL permits personal/educational use](https://ccel.org/about/copyright.html) while requiring permission for republication/commercial use. [Monergism permits downloads, study and indexing](https://www.monergism.com/monergism-copyright-permissions) and prohibits file redistribution on external websites/apps/repositories/AI datasets. [HelloAO’s primary documentation](https://bible.helloao.org/docs/) offers API/download access; its Gill inventory uses **Public Domain Mark 1.0, not CC0**. All originals and derivatives remain private. Metadata and source links do not authorize public bodies.

Originals are under the configured `BibleProject/sources/library` tree; derivatives/research bodies are under `Website/.local/library/run-rb03-2026-10-07`. Initial inherited XML extraction retained markup; the three Henry derivatives were replaced with rendered `ThML.body` text, with original hashes unchanged. SHA-256, retrieval times, final URLs, edition/scope and rights evidence are retained in original-adjacent provenance and the [manifest](acquisition-manifest.json). Every acquired URL is listed in [SOURCES.md](../../../../../SOURCES.md).

**380 original/provenance/derivative checks passed**, with **387 total asset and crosswalk checks** in [verification.json](verification.json). A [read-only run of the current intake planner](intake-plan-audit.json) found all 380 sources, correct author/hash-backed derivative selections and the evidence-only record. No DB was opened. Compile checks passed for the seven RB03 scripts. No private full text is committed.

Bounded discovery failures—Grace-ebooks DNS, CrossWire connection refusal, an obsolete Gill URL pointing toward another author, incomplete Archive edition discovery, and lack of a verified Gill repository in the alternate GitHub collection—are recorded in [source-exceptions.json](source-exceptions.json). Commercial/user-uploaded copies were not acquired. Primary offered alternatives supplied the actual batch.

## Checkpoint and next work

All RB03 collectors have exited. Runtime observation did not start, stop or restart any DB/vector worker or scheduler. The pre-existing Bible embedding snapshot reports completion with zero remaining at 07:20 UTC and its intake state is `snapshot_complete_followup_pending`; **that predates RB03 downloads and does not include these new files**. Fortress’s separate daemon was observed and left untouched.

**RB03 is not ingested or embedded.** Follow the newer **RB01–RB14 automatic aggregate gate**, superseding the old eight-mission ending in the original campaign document. Reconcile [intake scopes](intake-scope.json) and [INTAKE-NOTES.md](INTAKE-NOTES.md), especially contributor roles, structured passage joins and citation corrections, before using generic search hits as exposition relationships. Current importer enforcement of every scope is not claimed.

**RB04 is next when requested.** Reuse the newly completed Keach set and audited Gill material before hunting justification/assurance texts. Do not retry unchanged sparse Chronicles witnesses as network errors. Future broader Gill coverage and Henry V/VI require a new bounded acquisition/admission pass. Verification commands and exact remaining/deferred actions are in [checkpoint.json](checkpoint.json). No enrichment or graph generation was launched.
