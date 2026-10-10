# Private research foundation

Phase 1 (M01–M03) of the [knowledge integration plan](../../../Research/KNOWLEDGE-INTEGRATION-MASTER-PLAN.md). The generated [completion report](../../../Research/KNOWLEDGE-INTEGRATION-PHASE-1.md) gives measured counts and remaining gaps.

This reconciles current source metadata for Scholars, Apologetics and Studies. It is not a second full-text or embedding index. It never writes original downloads, the existing library catalogue, existing section authoring data, the main knowledge-base database or public publication selections.

## Run

From `Website/`, using the existing Python environment (Python 3.11+ and `jsonschema`):

```powershell
D:/Python/python.exe -X utf8 -m knowledge.research_foundation.build
D:/Python/python.exe -X utf8 -m unittest knowledge.research_foundation.test_foundation -v
D:/Python/python.exe -X utf8 -m knowledge.research_foundation.verify
```

Run one foundation build at a time. Independent collectors can continue; input hashes and scan start/end times identify the observed snapshot. This is not a filesystem-wide transaction. Validation records inputs whose size or timestamp changed after reading. These require a later refresh when an affected item is selected for a page. Do not launch or alter the main ingest/embedding worker to run these commands.

Generated files live in `KnowledgeBase/Research Foundation/`, outside the public Website repository. Keep them private. `identities.sqlite3` is persistent state, not disposable output: back it up with `registry.sqlite3`. It preserves resource UUIDs across rebuilds. New paths get new resource IDs; a path move is reconciled through recorded bytes/provenance, never by silently rewriting work IDs.

## Inputs and boundaries

The builder reads:

- The canonical library catalogue and base/extended contributor registries.
- Earlier private stocktake observations, followed by current acquisition ledgers and actual source-library file membership. The current reconciliation overlay has last precedence for overlapping fields.
- Historical source records, selected-document metadata from the existing read-only historical search, and current files in all twelve historical categories.
- The organized religious-text folders and their original source manifests; the reviewed full-sermon Graham manifest. Excluded sermon material remains an excluded observation.
- Other `sources/` collections and `KnowledgeBase/reference-texts/`, including Bible editions and atlas support material.
- Existing Scholars profiles/finds, Apologetics source/study/page IDs, BA/BH catalogues, and the R24 Islam claims/source graph.

Technical state is excluded as a source corpus: virtual environments, vector stores, graph outputs/snapshots, watchdog logs, collector status folders, and older superseded intake. `extracted-library/` is the existing importer's derived cache, not another set of independently acquired books. Religious `_Collection/` metadata supplies provenance and is not counted as a religion's sacred texts. Historical root reports and the search database supply metadata; they are not extra ancient documents. Existing Study collection routes/data remain authoritative and will be adapted in M04/T01; this phase does not duplicate or migrate them.

File counts include archives, supporting records, original-language documents, translations and copies. `bodyCandidate` is a file-format hint; it does not establish successful extraction, completeness, English availability or publication permission. Prior historical storage totals are explicitly labelled older observations; current `resourceRecords`/`held` counts come from this scan.

## Identity model

`registry.sqlite3` contains `entities`, `resources`, `relations`, `citations` and `collections`.

- `library:work:<id>`, `library:edition:<id>`, `library:asset:<id>` and `library:author:<id>` retain exact existing IDs and original records.
- `scholars:`, `scholars-find:`, `apologetics:<kind>:`, `historians:`, `archaeology:` and `evidence:` retain their existing IDs separately.
- `islam-research:claim:` and `islam-research:source:` retain R24's claim and endpoint IDs. Endpoint equality does not establish independent testimony.
- `resource:<uuid>` identifies a private file observation; `sermon-entry:<uuid>` identifies one manifest entry. These are not newly asserted work/edition identities.
- `evidence-source:<BA-id>` is an explicit metadata-only source reference where no held source was selected. It does not imply an acquired file.

Exact path links reuse catalogue assets. Matching recorded SHA-256 values establish a byte-match candidate and keep every path/edition ID. Checksums do not identify works or translations. Source URLs and upstream identifiers remain provenance references, not automatic bibliographic merges. Only the specifically reviewed links in [reconciled-links.json](../../content/research/reconciled-links.json) establish the named contributor/context relationships; their bases and AI-assisted attribution are recorded. Joint-person and broader-collection relationships use `includes-person` or context links, never person equality.

`identity-queue.jsonl` lists missing work/edition identity, provenance URL, language and licence metadata per affected resource. `unresolved.json` also retains legacy IDs, older acquisition attempts and missing citation sources. A recovered acquisition attempt is not an unresolved final download failure. `availability-exceptions.json` distinguishes absent recorded paths and empty files. Originals are neither deleted nor renamed.

## Shared evidence contract

[citation.schema.json](../../content/research/citation.schema.json) describes the private record shape. `contract.py` adds behavioral validation, section views, review fingerprints and public projection.

Every citation keeps a stable claim/source identity, exact locator, optional literal quotation, actual claim text, source role, claim kind, competing interpretations, qualification, separate date roles, review attribution/scope, and action-specific permissions. Missing edition identities and unknown dates remain null. Prior AI-assisted alignment status is imported, not promoted to human approval. The original evidence record remains in the registry for its complete audit context. Selected citation files are freshly hashed; changed previously recorded source hashes revoke carried-forward review. Fingerprints detect later changes to the claim, edition, wording, locator, alternatives, limits, dates or source hashes.

`section_view()` produces a copy of the same citation for each section. It does not turn a historical observation into a theological conclusion. A Study author must still supply Scripture-led interpretation; an Apologetics author must still distinguish premises from inferences; Scholars must still name the edition and contributors.

`project_public()` is an explicit allowlist. It requires publication selection and recorded metadata permission. Quotations additionally require an identified edition, exact locator, literal match, current limited review and quotation permission. Unknown/conditional decisions never imply allowed. Full-text permissions never cause this citation exporter to emit full text. Local filesystem paths and private fields are rejected, including paths hidden in prose. Phase 1 selects no records for publication and changes no existing public rights decisions.

Publication permission is not a substitute for content approval. The caller still needs the existing content/compiler/review process, valid public links and an actual approved page selection. Review status `reviewed-limited` refers only to the recorded scope; it is not a truth/authenticity certification.

## Verification and recovery

The test module exercises stable allocation after reopening state, non-merging of equal titles/bytes, all three citation views, edition and rights gates, review invalidation and private-data exclusion. `verify.py` checks the real registry's integrity, canonical-ID count, references, group routes/readiness, metadata queue, all 155 citation records, their source hashes, exact excerpt matches, draft export exclusion and the unchanged archaeology gap queue. It generates the human report only after these checks pass.

The builder prepares `registry.building.sqlite3`, checks it, and atomically replaces the prior registry. A crash leaving that temporary file blocks a later build so the unfinished output can be inspected; the previous completed registry remains intact. JSON reports are individually replaced. If a run fails after the database replacement, rerun the build and verification before treating its reports as one completed generation. Existing output counts alone are not proof that the latest attempted run completed.

The historical-index header contains outdated aggregate review counters; only the entry-level state and independently matched review queue are used. Bulk checksums are retained observations, not a new exhaustive integrity scan. Missing bibliographic metadata, source dates and science acquisitions stay queued for later phases.
