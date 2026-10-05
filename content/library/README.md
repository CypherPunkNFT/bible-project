# Christian library — collection desk

Established 2026-10-05 at the owner's request. This is the reusable starting point for each future collection mission. The owner will request categories one by one; the backlog is not authorization to run them all.

## Read first

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
| Public website output | A future explicit publication build | Collection records are not automatically deployed or bundled into the app |

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
