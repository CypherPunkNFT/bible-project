# Catalog and acquisition conventions

Version 1 · 2026-10-05. Machine contract: [schema.json](schema.json). Controlled identifiers: [vocabulary.json](vocabulary.json).

## Identity and levels

Use UTF-8, LF line endings, two-space JSON indentation and a trailing newline. Every catalog file has `$schema`, `schemaVersion: 1`, `kind` and an immutable `id`. All IDs use lowercase ASCII words separated by hyphens and a kind prefix, e.g. `author-john-owen`, `work-spurgeon-sermon-0001`, `edition-spurgeon-sermon-0001-1855-en`, `asset-spurgeon-sermon-0001-scan-a`. These are illustrative IDs, not acquired records.

Do not derive identity solely from a title, URL, array position or file checksum. Titles and URLs change; several files can represent one edition. Never reuse an ID for a different entity. Correct an existing record without silently changing its identity. Registry aliases preserve name variants; merged duplicates leave a documented crosswalk in the run report.

| Record | Required core information | Important distinctions |
|---|---|---|
| Author | ID, name/aliases, tradition tags, eligibility, rationale, evidence, reception basis, questions, AI/human review | Eligibility concerns an author; individual doctrinal positions require evidence |
| Source | ID, organization/site, canonical URL, source role, policy evidence, automation status, acquisition note | Discovery catalog and actual content host can have different terms |
| Work | ID, title, creator IDs, genre, teaching role, collection/subject IDs, original date, passages, relationships, evidence, editorial state | One sermon is a work; an anthology is a separate work containing it |
| Edition | ID, work ID, edition label, languages, translators/editors, publisher/year, abridgment/modernization state, evidence | Translation, abridgment, revised text and publisher apparatus can have different rights |
| Asset | ID, edition/source IDs, canonical URL, format, rights decision, acquisition state, file/hash or link, quality, processing provenance | Scan, EPUB, OCR, transcript, original audio and later reading are distinct assets |
| Series | ID, title, author IDs, ordered members with original labels, known inventory, completeness status, evidence | Preserve combined numbers such as 7–8 and gaps; do not infer a preached sequence from upload dates |
| Run | ID, mission ID, status, boundaries, source inventory, checkpoint, unique-record counts, missing items and report | A completed run is not proof that the entire author's corpus is complete |

Unknown scalar values use `null`; empty arrays mean none recorded, not proof of absence. Dates preserve a source label plus precision (`day`, `month`, `year`, `circa`, `range`, `unknown`). Distinguish preaching, original publication, edition publication, upload and retrieval dates. Use BCP 47 language tags (`en`, `fr`, `la`, etc.). Store uncertain attribution in evidence notes rather than asserting authorship.

Creators are typed: `author`, `preacher`, `editor`, `translator`, `speaker`, `narrator`, `institution`. Add institution records to the registry with `entityType: institution` when collecting corporate confessions. A narrator does not become the sermon author. A debate work may have contextual speakers; core-teaching authors must be acquisition-eligible.

Mission-specific contextual contributors may be stored as schema-valid author registries in `registry-extensions/`. The validator combines these with `authors.json` and rejects duplicate IDs across registries. This keeps guest preachers and explicitly unidentified document authors distinct from the core selection roster. Anonymous placeholders identify one document's unresolved attribution; they do not assert a shared historical person. The Spurgeon mission supplies the first such extension.

## Classification

The eight collection IDs are browsing shelves, not eight copies of each work. Subjects are hierarchical IDs with definitions and aliases. Genre, occasion, audience, depth, era, tradition and format are independent facets. A sermon on assurance remains genre `sermon` even when also shelved in theology and Christian life.

Use the most specific supported subjects, normally 1–5. Add a new term only when it is materially different from existing terms; update the vocabulary definition and aliases in the same change. Preserve deprecated IDs with a replacement mapping in a later schema version. Never auto-tag every Scripture mention as substantial treatment.

## Scripture and locators

Use existing book codes and canonical IDs from `scripts/bible/books.py` and the project's `BBCCCVVV` integer convention. Each passage stores its displayed reference, numbering system, role (`main-text`, `substantial-exposition`, `citation`), and start/end IDs when verified. Unknown or unmapped spans remain null and are excluded from coverage statistics. Check endpoints against the appropriate edition's data; do not apply KJV numbering to Hebrew, Greek or Vulgate numbering by assumption.

Preserve page/volume/chapter/paragraph/sermon-number locators. Audio timestamps must come from the actual identified recording; published text headings are not timestamps. A known main verse does not establish all secondary references. Existing Apologetics source IDs are linked through `externalIds` or `related` records, never silently renamed.

## Rights are recorded per asset

The public Reformed reading selection additionally records `edition.textRights`: status, jurisdiction,
component scope, reasoning and evidence for the historical text. This does not replace `asset.rights`.
A historic English text can be public domain while the host's downloadable PDF remains link-only for
our purposes. `work.reading` supplies a short sourced description, a starting point, cautions and study
IDs. [REFORMED-READING.md](REFORMED-READING.md) describes the explicit publication manifest and review gate.

`rights.category` describes the basis, while `rights.actions` states what the evidence supports. A historical author's death date does not license a modern translation, recording, transcription, introduction or typeset edition.

| Category | Meaning |
|---|---|
| `public-domain` | Documented public-domain basis for this edition/component in a named jurisdiction |
| `open-license` | Identified license allowing the intended reuse; keep license URL/version and obligations |
| `permission-granted` | Specific grant covers the named material and proposed actions; preserve conditions/expiry |
| `restricted-license` | Published conditions permit only specified uses, e.g. noncommercial or unchanged redistribution |
| `link-only` | Catalog/source link is the available route; no full-text or media republication grant established |
| `unknown` | Unresolved; metadata research only until a usable basis is recorded |
| `restricted` | Source expressly bars the intended action; do not perform it |

Actions are separately `allowed`, `conditional`, `denied` or `unknown`: `download`, `host`, `redistribute`, `adapt`, `transcribe`, `embed`, `indexMetadata`, `indexFullText`. `conditional` is not authorization until recorded conditions have been met. Automation is separately `unreviewed`, `manual-only`, `approved-endpoint`, or `prohibited` in the source registry. Robots directives, permitted APIs, bulk endpoints and rate limits must be checked at acquisition time; open content rights do not automatically authorize crawling.

Record evidence URLs/locators, review date, reviewer, jurisdiction, attribution, license identifier, restrictions and unresolved questions. Recheck policies before each new batch. A current verified asset decision may narrow or explicitly supersede a source default; explain why. Keep permission letters private and reference a redacted summary. Do not contact anyone on the owner's behalf without an explicit request.

The intended project use is free access on a public website, with potentially separate searchable metadata and full-text indexing. Do not classify NC/ND material as unrestricted open content. This register is operational research, not a legal opinion. Unknown material never enters the public content bundle. Existing rights decisions for already-used Bible data are not retroactively rewritten here.

## Acquisition workflow

1. Read the charter and the requested mission; inspect git status and active source paths. Preserve other sessions' edits.
2. Confirm author/work fit. Record a bounded bibliography or source inventory, including what is unavailable.
3. Check host policies and the actual edition. Choose a permitted route: full content, approved embed, metadata/link, or unresolved queue.
4. Download eligible assets into a new immutable asset folder. Record original URL, final URL, retrieval time, byte count, MIME type and the complete SHA-256. Never overwrite existing raw bytes.
5. Derive text only when permitted. Record parent asset, tool/version, parameters, date and content hash; label OCR, human transcript, ASR and editorial summary distinctly.
6. Sample text against the source, inspect title pages/contents, verify locators, and check series membership and Bible references. Machine output starts `unreviewed`.
7. Validate schema, references, vocabulary and deduplication. Review the actual content and rights separately from automated checks.
8. Update run counts/checkpoint/gaps, source manifest and [../../SOURCES.md](../../SOURCES.md) with a concise pointer for acquired material. Leave large catalogs here rather than duplicating them in SOURCES.md.
9. Stop at the requested category boundary and report verified totals and remaining gaps. A later prompt resumes the next mission.

## Publication and knowledge integration

Modern recordings may include optional `asset.recording` metadata: `durationSeconds` (positive number or null), `durationLabel` (source/display label or null), evidence and a note. This describes the specific recording manifestation, never an article reading-time estimate. Preserve ambiguous labels with null seconds until resolved. Original recordings, later readings, podcast edits and written messages need separate identities/format records. Link-only records retain null local paths, hashes, byte counts and retrieval timestamps. A manual metadata check belongs in evidence `checkedOn`, not a fabricated media acquisition date. See [L04](reports/modern-preaching/REPORT.md).

Canonical files remain here; `.local/` derivatives and `KnowledgeBase/` search state are rebuildable outputs. An eventual adapter should use namespaced IDs such as `library:work:<work-id>`; chunks must retain edition/asset ID, locator, source URL, rights and text hash. Search indexes may include only the actions authorized for their actual contents: metadata permission is not full-text indexing permission.

Connect existing Apologetics sources by a crosswalk. Preserve its reviewed content, source roles and review hashes; generated TypeScript/public exports are not editable inputs. This mission does not implement the adapter or add the collection to production. Plan pagination and bundled indexes before publishing at scale; the existing Pages release checks enforce a finite file budget.
