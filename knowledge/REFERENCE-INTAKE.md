# Reference intake and source completeness

The October 6 embedding completion covered that snapshot only. On October 7 a
full SHA-256 comparison against its file inventory found **140 new source files,
two changed indexed study files, and no missing indexed source inputs**. The 140
include distribution archives, code and alternate formats, not 140 new books.
The generated Topics collection was also absent from the old importer.

## New searchable inputs

`reference_library.py` imports the following, with original file provenance and
stable record locators. All remain in the separate BibleProject KnowledgeBase.

| Source | Canonical input and granularity |
|---|---|
| ISBE | SWORD zLD, 9,380 headwords; bounds-checked decompression of all blocks |
| Hitchcock | CCEL XML, 2,623 paired names and definitions |
| Smith | CCEL XML, 4,561 paired terms and definitions |
| Fausset and Thayer | Two complete existing OCR texts, explicitly unreviewed; no new OCR |
| Josephus | Four complete Gutenberg texts: Antiquities, Wars, Life, Against Apion |
| Strong Hebrew / Greek | 8,674 / 5,624 entries; original-language words and lexical attributes retained |
| Open Scriptures Hebrew Lexicon | BDB 11,845 entries; HebrewStrong, LexicalIndex, AugIndex and both parts-of-speech tables |
| OpenBible Topics | 6,713 topics with scored references; no copyrighted ESV text |
| Theographic | All eight canonical JSON collections, word-level CSV index and 112 journey features |
| Website Topics | Canonical index and all referenced bundles, including article text and passage links |
| Source documentation | Readmes, field documentation, bibliographies, licences and ISBE module configuration |

The first complete in-memory import produced 152,711 reference records and
190,841 chunks including **5,607 Topics in 55 categories**. Those figures precede
the additional provenance documentation pass; final build totals are in
`coverage.json` under `reference_library`. Do not substitute old handoff counts
for the current generated index.

Theographic's WordIndex has no JSON equivalent. Every row is retained in document
metadata, grouped by verse, with verse text and entity/date annotations searchable.
Its chronology and relationship identifications are labelled as source proposals.
Other CSV exports and JS/DAT/XML alternative editions remain checksummed originals;
their selected canonical representation is indexed once. Legacy lexicon schemas,
code, images and ZIP files are retained as supporting acquisition files, not books.
Empty ISBE source entries are identified explicitly rather than filled in.

## Verification and operation

1. Parse each selected source strictly; reject malformed records or unmatched
   dictionary definitions. Preserve originals. Check input hashes before and after
   reference import to detect concurrent modification.
2. Build the complete corpus in a staging SQLite database. Publish only after
   FTS integrity, foreign-key and Scripture verse-count checks pass.
3. Resume embeddings using unchanged chunk identities; keep existing vectors.
4. `python -m knowledge verify` checks vector parity and hashes **all inventoried
   source inputs**, including those outside `sources/library`. It lists new,
   changed and missing files in `KnowledgeBase/source-drift.json`.
5. `finish-intake.ps1` refreshes again if new/changed acquisitions arrived while
   it ran. Missing inputs stop completion for review. Enrichment stays unstarted.

Launch `knowledge/finish-intake.ps1` as a hidden background process with distinct
stdout/stderr log names. The existing 30-minute watchdog monitors the Bible-only
workers. Completion is established by current `intake-completion.json` and
`embedding-progress.json`, not by process launch or the previous build's report.

Tests cover binary dictionary corruption, XML lexical attributes, external entity
handling, canonical topic bundles, passage references and hash-based source drift.
The full knowledge test suite passed 40 tests before this refresh.
