# Christian library — collection desk

**Ready-text completion and sermon checkpoint (2026-10-05):** [Results and exact remaining work](reports/ready-text-completion/REPORT.md): Perkins CC0 XML, all twelve Goodwin volumes, all seven Machen chapters and remaining confessional witnesses acquired; 80 Begg transcripts across five biblical books, with 22 absent transcripts recorded. Piper has 1,885 verified written messages; acquisition stopped on HTTP 429 with 491 unresolved destinations. Check this checkpoint before restarting a worker or repeating downloads. No new OCR or audio transcription.

**Historical ready-text batch (2026-10-05):** [Report](reports/historical-text-corpora/REPORT.md) · [Open acquired EPUBs and extracted TXT files](reports/historical-text-corpora/FILES.md). A centralized author index supplied 428 titles across 29 eligible authors; 91 EPUB editions were downloaded across 23 authors. The primary reading batch contains 79 editions and 24,036,037 extracted words (overlapping material included); 12 publisher-disclosed AI transcription/translation editions are held separately for review. Edwards's two-volume, Whitefield's six-volume and Owen's seven-volume Hebrews sets are acquired. No scans, new OCR or audio transcription. Private reading copies only under source terms; check this ledger before further acquisition and preserve existing canonical edition records.

**LIBRARY DOWNLOADS · MASTER CATEGORY INDEX · CROSS-CHAT HANDOFF:** [All collection categories and mission status (L00–L15)](BACKLOG.md) · [Actual text/download inventory](reports/text-backlog/REPORT.md). Use these mission IDs across chats, reports and checkpoints; check the category's latest acquisition manifest before starting work. Reuse existing readable text, acquire permitted missing text, and reserve transcription for books genuinely unavailable as usable text. Category entries and source links are not completed downloads.

Established 2026-10-05 at the owner's request. This is the reusable starting point for each future collection mission. The owner will request categories one by one; the backlog is not authorization to run them all.

## Published Reformed reading selection

The owner-requested theology/apologetics expansion is now connected to the website through an explicit
[publication manifest](publication.json): 46 works, 30 authors and 48 identified reading editions.
See [REFORMED-READING.md](REFORMED-READING.md) for the author list, edition findings, publication review
and generated Markdown/JSON catalogue. This publishes metadata and reading links; it does not ingest
the books or authorize other collection missions. The broader desk and its acquired collections remain
separate from the selected website publication.

## Read first

The latest [Christianity and Islam collection](reports/islam-studies/REPORT.md) catalogs 13 primary holdings and 21 chapters/lectures from White, Zwemer and Piper, with contextual Muslim contributions distinctly labeled. Three historical PDFs are acquired; modern sources remain links. [Nine question maps](reports/islam-studies/QUESTIONS.md) preserve claims, premises, objections, replies and precise source locators, with five collated translation excerpts. Five official debate listings await playback/completeness review. Edition-date conflicts, secondhand quotations, translation limits and source permissions remain explicit; no public publication changed.

1. [CHARTER.md](CHARTER.md): theological scope, author eligibility and editorial decisions.
2. [CATALOG.md](CATALOG.md): shared metadata, identity, Scripture, rights and acquisition conventions.
3. [AUTHORS.md](AUTHORS.md): readable initial roster and unresolved questions; [authors.json](authors.json) is the editable registry.
4. [vocabulary.json](vocabulary.json): collection, subject, tradition, genre and other controlled IDs.
5. [sources.json](sources.json): source discovery and rights/access findings, with evidence URLs.
6. [BACKLOG.md](BACKLOG.md) and [MISSION-TEMPLATE.md](MISSION-TEMPLATE.md): bounded collecting missions and the handoff format.

## Storage map

| Material | Canonical location | Rule |
|---|---|---|
| This charter, author/source registries and vocabulary | `Website/content/library/` | Version-controlled collection inputs |
| Future catalog records | `Website/content/library/catalog/{works,editions,assets,series,runs}/<id>.json` | One record per file, validated against [schema.json](schema.json); create folders as needed |
| Original downloaded bytes | `<resolved sources>/library/<source-id>/<asset-id>/<original-filename>` | Immutable; new bytes mean a new asset and SHA-256 |
| Converted text, OCR, transcripts and review exports | `Website/.local/library/<run-id>/` | Derived working files; preserve the original and record processing history |
| Private permission correspondence | `Website/.local/library/permissions/` | Keep personal details out of the public repository; publish a safe grant summary and evidence reference |
| Current Apologetics teaching guides | `Website/content/apologetics/` | Existing separate editorial schema and review process; do not move or overwrite |
| Search/database/vector state | `BibleProject/KnowledgeBase/` through `Website/knowledge/` | Existing search instance; future adapter must consume reviewed records with stable IDs and rights filters |
| Public website output | Explicit `publication.json` selection, built through the Apologetics content pipeline | Only selected and reviewed metadata/reading links are deployed; see REFORMED-READING.md |

In this workspace the project root is `D:/FortressOfSolitude/Jarvis/Projects/BibleProject`.
Resolve raw storage using `Website/scripts/bible/paths.py`: `BIBLE_SOURCES`, then `Website/sources/` if present, otherwise `BibleProject/sources/`. Check that resolution before every acquisition. Do not create `Website/sources/` casually: doing so changes the source root for the existing Bible pipeline.

`Website/knowledge/config.json` currently uses the sibling `sources/` and `KnowledgeBase/` directories. Its in-progress SQLite build is owned by the knowledge pipeline. This collection desk supplies provenance and acquisition inputs; it does not replace that corpus database. A library adapter is a future integration task, not implemented by this charter.

The current `/library` route is the Bible reading chart and versions page. This folder does not rename that page or create a new route. App code is MIT; acquired content retains its own rights.

## Validation and readable roster

From `Website/`:

```powershell
node scripts/validate-library.mjs
node scripts/validate-library.mjs --write-author-view
```

The first command reads and validates the registries and any catalog records. The second also refreshes `AUTHORS.md` from the registry. Validation checks structure and relationships; it cannot certify theology, legal status, transcription accuracy, or source completeness.

## State at establishment

The charter, initial roster, vocabulary, source notes and mission backlog are the deliverables. No sermons, books or recordings have been acquired by this mission. Existing Bible/study sources and Apologetics records remain under their current conventions. Acquisition starts when the owner requests its category.

## Spurgeon acquisition

The owner subsequently requested the published Spurgeon sermon inventory. Its [report](reports/spurgeon/REPORT.md), [counts](reports/spurgeon/summary.json), and [reconciliation register](reports/spurgeon/reconciliation.json) cover the 63-volume pulpit set and distinguish individual PDFs from whole-volume editions. Contextual contributors are recorded separately in `registry-extensions/`. See the run record for acquisition completion and the report for remaining metadata review.

## Edwards, Whitefield, Newton and Ryle acquisition

The [historic preaching report](reports/historic-preaching/REPORT.md) covers 17 selected volumes and 243 classified components. Bibliography, precise scan locators, original main texts, publication and delivery witnesses, editorial compilations, and remaining gaps accompany the immutable source files. These records are catalogued and excluded from public publication selection. The separate [Puritan acquisition checkpoint](reports/puritan-sermons/REPORT.md) remains unfinished; it was preserved when the owner selected this historic preaching category.

## Modern preaching sources

The later [modern text acquisition](reports/modern-texts/REPORT.md) downloads actual private reading copies and records hashes, extracted text and source gaps. The owner has narrowed its active scope to existing full HTML sermon texts; PDF collection and broad discovery are stopped. See the [PDF inventory](reports/modern-texts/PDF-INVENTORY.md), [source queue](reports/modern-texts/SOURCE-QUEUE.md), and [live job state](reports/modern-texts/job-state.json). These staged holdings are separate from the older L04 link inventory and are not published in the app.

The [L04 source report](reports/modern-preaching/REPORT.md) maps five ministries for six eligible authors. Piper’s Ruth (1984) and Sproul’s 2 Peter (2008) supply two complete bounded inventories: 16 sermons with passages, dates, order, recording durations and official links; 20 format-specific link records. Source policies, permission-dependent collections, eligibility holds and exact resumption steps accompany the catalog. No media/text corpus was downloaded or added to public publication by this batch.

## Sermon coverage

The [L05 coverage report](reports/sermon-coverage/REPORT.md) audits 3,795 core sermon units across all 66 books. Its verse/chapter maps measure source-assigned main texts, with substantial exposition and incidental citations kept in a separate assessed layer. The report documents 354 chapters without a mapped main text, 121 unresolved assignments, strong preacher concentration, bounded series completeness, unfinished collections, and four verified gap-resource discoveries. Reproduce it with `python -X utf8 scripts/analyze-sermon-coverage.py`; exact input hashes, review locators and machine-readable gaps accompany the report. No discovery record has been added to the coverage numerator or public publication selection.

## Commentaries and biblical theology

The [L06 collection report](reports/scripture-studies/REPORT.md) adds 47 linked holdings and 155 sections: Calvin passage inventories, all 27 NT books in Berkhof's 26 introductions, Vos's 11 chapters, selected Gill entries, and a bounded hermeneutics inventory. Two historical books were acquired as four original PDF/OCR files, reusing existing work and edition identities. [Passage indexing](reports/scripture-studies/passage-index.json) distinguishes source headings, introductions and body-reviewed exposition; [theme indexing](reports/scripture-studies/theme-index.json) covers all eight requested subjects. Nine selected assessments and two comparison questions retain each author's interpretation and its limits. Full-text clearance, wider acquisition and publication remain separate; the report identifies exact gaps and source corrections.

## Systematic theology and doctrine

The [L07 report](reports/doctrinal-studies/REPORT.md) indexes 129 chapters, lectures and substantial sections across Charles Hodge, A. A. Hodge, Owen and Warfield. A [shared doctrine hierarchy](reports/doctrinal-studies/doctrine-hierarchy.json) has 54 nodes; every section retains its parent and edition and has [Scripture and sermon connections](reports/doctrinal-studies/section-connections.json). Editorial companions remain distinct from the 19 sections with source-verified Scripture assignments. Two historical books were acquired as four PDF/OCR files. Of 322 links to existing sermons, two have scoped body comparisons; the remainder are metadata study leads. Wider acquisition and full review remain in the checkpoint; no public publication changed.

## Historical confessions and catechisms

The [L08 report](reports/confessional-standards/REPORT.md) preserves Westminster, Second London, the 1695 Baptist Catechism and Flavel's explanation in nine acquired files, with five additional standards linked. Its 2,438 witness units preserve exact answer/content pointers, numbering, nested questions and proof attachments; 4,616 structured references are indexed as citations. Eight comparisons distinguish doctrinal disagreement, shared claims and edition changes. Use `scripts/read-confessional-unit.py` to retrieve hash-checked original answers. Missing WSC proofs, Baptist heading errors, Flavel modernization/numbering, and continental/Savoy acquisition gaps remain explicit. No public publication changed.

## Pastoral care: text first

The library-wide [master text-source list](reports/text-backlog/REPORT.md) now records verified follow-up: all 77 PDF candidates checked (76 with substantial sampled text; one with an existing alternative edition), 63 additional complete CCEL transcriptions acquired including all 45 Calvin commentary volumes, and explicit source decisions for all 84 previously unacquired book holdings. Partial works, commercial access, failed retrieval and existing OCR remain distinct. [Machine-readable decisions](reports/text-backlog/text-resolutions.json) supersede the earlier format-only backlog; no new OCR was performed.

The [L11 reading index](reports/pastoral-care/REPORT.md) provides seven acquired transcribed books, 23 substantial sections, ten concern routes and 19 catalog-based sermon connections. Original XML identifiers and Scripture citations remain attached to each section; editorial companions are labeled separately. Dedicated bereavement transcription is still a gap. The [deferred PDF list](reports/pastoral-care/deferred-pdfs.json) retains the already-acquired Flavel scan/OCR without further processing. Per the owner's instruction, prioritize ready-made readable transcriptions and list scan-only candidates for later. Rebuild offline with `python -X utf8 scripts/catalog-pastoral-care.py`.

## Preaching, church ministry and missions

The [L12 report](reports/ministry-resources/REPORT.md) gathers ten new root holdings, 50 components and 18 reused work references across eight responsibilities. Spurgeon's first lecture series was acquired as two original PDF/OCR files; nine further holdings remain source links. The [reading guide](reports/ministry-resources/GUIDE.md) offers entry points for five audiences. Thirty scoped assessments distinguish theological principles, historical practices and practical advice; four comparisons preserve baptism/polity differences, shared teaching on the Supper, and the distinction between mutual care and a particular group structure. Bibliographic-only leads, modern rights limits and remaining acquisition/review work stay explicit. No public selection changed.

## Annotated study paths

The [five study paths](reports/study-paths/PATHS.md) serve new believers, deeper theology, apologetic questions, pastoral concerns and ministry preparation. Fifteen ordered stages combine Scripture, sermon selections and substantial readings, with reasons, precise source locations, reflection and practice. They reuse 24 catalog works without new downloads or publication changes. The [report](reports/study-paths/REPORT.md) records verification limits and the continuing concentration on Spurgeon. Eight integrity tests pass.

## History, lives and missionary testimony

The [L13 report](reports/historical-lives/REPORT.md) covers Brainerd, M’Cheyne, Rutherford, Knox and the three Paton parts: seven identified editions, 12 acquired files and 421 indexed components, including all 365 numbered Rutherford letters. Seventeen selected source-checked assertions support a graph connecting people, works, churches, movements and events. Ten editorial issues preserve abridgments, mixed authorship, missing material and Paton’s corrected 1898 continuation date. Firsthand letters/journals, retrospective autobiography and later interpretation retain distinct labels. Use `scripts/read-historical-source.py` for hash-checked source spans. Full collation, wider collection and public selection remain in the checkpoint.

Browse the [edition/component inventory](reports/historical-lives/inventory.json), [attributed historical claims](reports/historical-lives/historical-claims.json), [people/church/event connections](reports/historical-lives/connections.json), and [omissions and editorial issues](reports/historical-lives/editorial-issues.json). The current full-library check and all eight L13 integrity tests pass; the original acquisition and later recheck remain separately recorded in [validation evidence](reports/historical-lives/validation.json).
