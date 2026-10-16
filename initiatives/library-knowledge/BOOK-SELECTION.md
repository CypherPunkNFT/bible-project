# First book selected: Ephesians — LK-201

**12 October 2026.** Ephesians is selected for the first complete-book connected-library pilot. Its six chapters have structural coverage in four held works by three authors, including two existing on-site reading copies. Six chapter samples from Fergusson match both corpus chunks and the actual reader data served at the original local preview. Romans remains a strong subsequent candidate.

This completes book selection, not passage-link creation, theological review or publication. The comparison was deliberately bounded to **12 named held documents**, using original hashes, source structure, selected-document database reads and existing reader packages. No whole-library vector search or exhaustive holdings audit was needed.

## Why this book

| Candidate | KJV chapters / verse rows | Verified structure in the shortlist | Existing on-site exposition in the shortlist |
| --- | ---: | --- | --- |
| **Ephesians** | **6 / 155** | Calvin commentary, Hodge commentary, Fergusson exposition and Calvin sermons cover chapters 1–6 | Fergusson, plus Calvin's 48 sermons |
| Romans | 16 / 433 | Calvin and William Day cover chapters 1–16; Hodge EPUB also held, chapter mapping deferred | Day's paraphrase/commentary |
| Hebrews | 13 / 303 | Calvin covers chapters 1–13; selected Owen TCP volume covers 6–10 | That Owen volume; remaining volumes require separate alignment |

Ephesians provides a smaller complete-book editorial scope while retaining continuous exposition, sermons and comparison sources. Its sources support the proposed passage, topic and author connections. Romans has more existing document associations and substantial commentary holdings; it was not rejected for lack of material. Hebrews is also well supplied, but a multi-volume alignment check would add work before comparable reader coverage is established.

The shortlist is not a ranking of everything we own. In particular, Owen's other held volumes were not counted as missing merely because they were outside this check. IA editions, duplicate downloads, previews and announcements were not counted as independent works. The initial title search was discovery only.

## Selected sources and reader state

| Work | Role | Chapters with structural evidence | Reading state |
| --- | --- | --- | --- |
| James Fergusson, *A brief exposition of Galatians and Ephesians*, TCP A41197 | Primary on-site exposition | 1–6 | 36 reader pages for the combined work |
| John Calvin, *Sermons on Ephesians*, Arthur Golding translation, TCP A17705 | On-site sermon comparison | 1–6; 48 sermon headings | 42 reader pages |
| John Calvin, *Commentary on Galatians and Ephesians*, held CCEL edition | Private commentary comparison | 1–6; 35 reference-titled sections | Catalogue-only for this exact edition |
| Charles Hodge, *Commentary on Ephesians*, held CCEL edition | Private commentary comparison | 1–6 | Catalogue-only for this exact edition |

Calvin's commentary and sermons are distinct works, but **one author**, not two independent authors. These are three historically Reformed authors; the pilot does not claim broad denominational representation or independent textual witnesses. Existing edition identities and translator attribution remain intact; this task allocates no new canonical IDs.

The existing on-site routes are:

- Fergusson: `/teachers/works/held-140823cc0ca835eda48a3dc99d4025ef`
- Calvin sermons: `/teachers/works/held-ec5430010801378dda5e6e5fa89e87b1`

These are whole-work routes. The current reader does not provide verified passage deep links; do not invent page-query or fragment URLs. External URLs remain provenance, not substitute reading destinations.

## Chapter evidence and limits

| Ephesians chapter | Calvin commentary sections | Calvin sermons | Fergusson sample: corpus part / reader page |
| --- | ---: | ---: | --- |
| 1 | 5 | 8 | 466 / 15 |
| 2 | 6 | 7 | 571 / 18 |
| 3 | 4 | 6 | 685 / 22 |
| 4 | 9 | 12 | 770 / 25 |
| 5 | 6 | 9 | 907 / 29 |
| 6 | 5 | 6 | 1031 / 33 |

Reader pages above are one-based; private JSON records zero-based page indices. These samples are chapter-opening explanatory prose, not incidental Scripture citations. They establish that usable exposition exists and is locatable, not that each verse or interpretation has been reviewed. Hodge and Fergusson each have an explicit chapter division for all six chapters.

Fergusson's Ephesians section contains **40 encoded transcription-gap elements**, distributed 8, 8, 6, 8, 2 and 8 across chapters 1–6. Future quotations must retain gaps or use a separately verified parallel source; never silently fill missing words. Early spelling, translator choices, modern editorial additions and exact verse ranges still require review. All **155 verse positions remain unassessed for reviewed connection coverage**; that is not a claim that 155 verses lack sources.

## Indexing and publication gaps

The database records document associations with Romans in **701 documents**, Ephesians in **407**, and Hebrews in **614**. Those are overlapping document-level reference ranges, not exposition counts. **All 12 selected library documents have zero `references_to` rows**, despite explicit commentary structure in their originals. LK-202 must derive and review bounded section references from that structure instead of treating the current reference index as exhaustive.

Barnes and Matthew Henry's Concise SWORD derivatives retain keys for all chapters of all three books. Keys may represent linked or empty entries and are not reviewed exposition coverage. The inspected JFB derivative has block labels without verse keys. All three lack exact-original reader records in this bounded reader check; their private text remains usable. No semantic candidates were generated or promoted during selection.

New publication still requires source-specific use decisions, identities and exact reader alignment. Existing TCP reading copies are preserved; no permission or public export is inferred for new derivatives here. The previous **17/20 retrieval score remains below the 18/20 gate**; fixes must be assessed on fresh reserved questions.

## Verification, outputs and next action

Verified **12 original hashes**, **4 complete local reader packages / 192 pages**, and six unique Fergusson corpus-and-reader matches. The two data bundles containing those samples were fetched successfully from **127.0.0.1:8931** and matched their expected SHA-256 hashes. This verifies served local text data, not production deployment or a full browser interaction audit. KJV verse rows were checked for continuity in all three books. No new per-file test suite was needed for this read-only selection.

Private evidence is under `KnowledgeBase/library-knowledge/book-selection-20261012/`: `selection.json`, `coverage.json`, `reader-preview-verification.json`, `acceptance.json`, `pipeline-after.json` and the reproducible bounded `probe.py`. The probe runs from `Website/` with the existing KnowledgeBase Python environment. Discovery and selected-input snapshots are retained separately; original documents, evaluated retrieval snapshots and prior evidence collections are unchanged.

**Next: LK-202.** Prepare Ephesians chapter/section connections from these held sources. Distinguish main Bible text, explicit citation, located exposition and semantic association; preserve author/translator and opposing-position attribution. Begin with source structure and exact locators, retain unresolved verse coverage and transcription gaps, and reuse the LK-103–107 evidence and dependency workflow. No public export or deployment is part of that preparation.
