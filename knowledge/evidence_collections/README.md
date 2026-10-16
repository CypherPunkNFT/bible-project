# Private evidence collections

Implementation of [LK-103 through LK-107](../../initiatives/library-knowledge/TODO.md), extending the existing [research citation contract](../research_foundation/README.md). Provides private capture, identity/use verification, bounded retrieval and reproducible collection assembly over existing corpus inputs. Outputs stay under `KnowledgeBase/library-knowledge/`.

## Files

- `collection.schema.json`: version 1 collection envelope. Its citation definition references the existing research schema; `contract.schema()` compiles that reference locally without network retrieval.
- `contract.py`: structural/behavioral validation, review fingerprints, source-context integrity and private publication boundary.
- `capture.py`: explicit selection of 1–50 real chunk spans, canonical IDs where present, original-byte verification, neighboring context and dependency checks.
- `__main__.py`: private capture/verify commands, restricted to outputs under `KnowledgeBase/library-knowledge/`.
- `../tests/test_evidence_collections.py`: isolated regression tests.

## Run from Website

```powershell
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections capture --spec ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\assurance-contract-pilot.spec.json --output ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\assurance-contract-pilot.json
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections verify --collection ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\assurance-contract-pilot.json --output ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\assurance-verification.json
```

Use the corresponding `reported-position-contract-pilot` specification for the Boyce example. Specifications are private selection/review records containing explicit chunk IDs, expected hashes, character offsets and supplied editorial statements. Offsets count Unicode code points, not UTF-8 bytes or printed lines. The tool verifies literal location; it does not independently determine whether a supplied theological interpretation or speaker attribution is correct.

Capture reads a short SQLite transaction and selected original files only. It does not load LanceDB, an encoder or a graph writer. Original bytes are checked before capture and again during verification. Changing an input build, chunk, metadata, adjacent context, original file, schema or implementation marks an existing collection stale; corrections require explicit recapture/review. This is dependency detection, not the full incremental refresh system planned in LK-107/LK-501.

Identity uses existing work/edition/asset IDs from registered corpus metadata; absent IDs remain null. The existing corpus document ID is a source fallback, not a fabricated bibliographic identity. One evidence span can support distinct claim IDs. Review fingerprints are change detectors, not digital signatures or proof of human approval.

The envelope preserves the shared citation's metadata/quotation/full-text permission decisions and adds separate translation/editorial decisions. No permissions are inferred from a licence label or private possession. Version 1 is private-draft-only: `public_projection()` returns no export, and no site route or publication selection is changed. Reader availability stays unverified until LK-104 establishes and checks a route; the source URL remains provenance.

## Real sample

Private artifacts are under `KnowledgeBase/library-knowledge/contract-pilot-20261011/`. Two collections contain three passages from Manton, Flavel and Boyce. They demonstrate direct statements, a reported opposing position with adjacent objections, and segment locators without fabricated page numbers. One canonical work/edition is resolved; two documents retain unresolved work/edition IDs. Three reader targets and edition dates remain unverified/unknown. These limitations do not prevent private capture or embedding.

The selected excerpts do not establish exhaustive topic coverage, human theological approval or a verified description of Catholic teaching from Catholic primary documents. Boyce's account is attributed to Boyce. Citation IDs and locators do not promote a secondary report into independent primary-source verification.

## Identity and reader crosswalk — LK-104

`crosswalk.py` builds a private sidecar; it never edits the captured evidence or its review fingerprint. Exact original hashes bind selected corpus documents to existing research-foundation resource UUIDs. Existing canonical work/edition/asset records and their links are checked. Missing identities remain null with explicit reasons. Source XML header statements retain selectors, attributes and distinct print, first-publication and electronic date roles.

```powershell
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.crosswalk build --collection ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\assurance-contract-pilot.json --collection ..\KnowledgeBase\library-knowledge\contract-pilot-20261011\reported-position-contract-pilot.json --spec ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\crosswalk.spec.json --output ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\crosswalk.json
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.crosswalk verify --crosswalk ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\crosswalk.json --output ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\verification.json
```

The v1 specification contains `candidateResourceIds` (up to 20 existing resource UUIDs) and `reviewedRelations`. A relationship must name two selected node keys, use `same-work-different-edition`, record `reviewKind: ai-assisted`, a review date, basis, limits and exact `headerEvidence` from both originals (`node`, `role`, `text`). This records a supplied bounded review; the program checks its source evidence and identity consistency, not the truth of a literary relationship. No title/URL matching silently merges identities.

`duplicates` separates byte groups, canonical edition groups and reviewed work groups. Keep every original citation and edition when consuming these groups; grouping is for retrieval diversity, not proof of independent witnesses. Missing work identities remain separate. The sidecar does not allocate new catalogue IDs.

Reader inspection checks the full original SHA against the held record, its availability, page contents and content-addressed bundle hashes. A catalogue-only page has a `catalogueRoute` and null `readingRoute`. Readable texts have an on-site `readingRoute`; literal quotation matches, if any, are recorded separately by page/locator. `passageTarget` remains null because the current reader does not support direct page/fragment navigation. Body matching normalizes whitespace only. Reader checks describe the local package; actual preview checks are recorded separately and production is not implied.

Reverification rebuilds only the bounded selection and compares fingerprints. Changes in sources, captures, relevant registry rows, canonical records, source-header evidence, reader bodies or implementation invalidate the sidecar. No encoder, LanceDB or graph writer is opened. CLI output stays under the private `KnowledgeBase/library-knowledge/` directory.

The [completed crosswalk report](../../initiatives/library-knowledge/IDENTITY-CROSSWALK.md) records 3 resolved original/resource bindings, 1 canonical chain, 2 deferred chains, 3 catalogue-only destinations and a separate TCP edition verified over all 7 reading pages. Its asset ID still lacks a canonical asset record. Source-header facts do not retroactively change the captures' unknown dates or rights decisions; later recapture/public eligibility remains explicit work.

## Source-specific use decisions — LK-105

`eligibility.py` implements a private decision sidecar and a metadata-only review projection. It does not modify the original evidence contract, canonical catalogue, ingestion configuration or publication selection. [Completed use review](../../initiatives/library-knowledge/PUBLIC-USE-ELIGIBILITY.md).

```powershell
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.eligibility build --crosswalk ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\crosswalk.json --spec ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\eligibility.spec.json --output ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\eligibility.json
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.eligibility preview --decisions ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\eligibility.json --output ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\metadata-preview.json
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.eligibility verify --decisions ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\eligibility.json --output ..\KnowledgeBase\library-knowledge\eligibility-pilot-20261011\verification.json
```

The v1 review specification names every selected/candidate node exactly once and binds its exact original SHA-256. Each of `metadata`, `quote`, `fullText`, `translation` and `editorial` requires its own `decision`, `scope`, `basis`, `evidenceIds` and `conditions`. Conditional uses require an unmet condition; allowed uses cannot retain unmet conditions. References have URLs, review dates and short evidence summaries. Optional source assertions bind XML selectors to normalized-text fingerprints. `privateAnalysis` remains separately allowed under the owner's lawful-held-material instruction and applicable source terms. `publicationSelected` must be false.

The module validates recorded decisions and dependencies; it does not infer a license from a title, date, work-group relationship or possession. Its AI-assisted review is not a signature or a human/legal approval. Remote policy facts are dated observations and require a fresh review when used later; offline verification only checks recorded local dependencies.

`readiness` distinguishes rights clearance from identity, exact-edition reader alignment and output review. Source metadata must be cleared for any prepared output. No action sets publication selected/published. Original analysis of ideas is distinct from copying expression; translation permission is distinct from editorial permission. The Boyce excerpt remains a reported opposing position.

`metadata_preview()` first verifies all inputs and emits only an allowlist of title, named authors, source URL, credits, existing IDs, catalogue route and use-decision labels. Claims, quotations, contexts, private paths and policy notes never enter that projection. It is a local review artifact, saved under `KnowledgeBase/library-knowledge/`; no public export adapter is enabled. Missing canonical identities remain null and catalogue-only pages are not presented as readable texts.

Four real source reviews contain 11 allowed and 9 conditional public-use decisions. All four remain eligible for private analysis. The three selected CCEL quotations are not ready for public export; the separate TCP transcription has CC0 reuse rights but retains its asset-registration/output-review prerequisites. No existing reader is withdrawn or reclassified.

## Bounded private retrieval — LK-106

`retrieve.py` snapshots up to 20 named documents / 5,000 existing passages, verifies the reviewed crosswalk and reads a pinned existing LanceDB version. It saves selected vectors for CPU cosine ranking. An in-memory FTS5 index uses existing title/search fields; no persistent corpus index is rebuilt. Exact verse overlaps, verse annotations and existing document-level associations are labeled separately. Reciprocal-rank fusion, exact-body deduplication, reviewed work buckets and same-document adjacent context produce five private candidates. Results retain their original source identity and locator; usefulness and publication eligibility require separate review.

For a **new** private run directory, first supply `questions.frozen.json` with `scope.extraDocumentIds`, `development` and `heldOut` question arrays. Freeze questions/rubrics before development. Prepare once, then encode the question set through the existing encoder in small serialized batches. Do not run preparation or encoding over the preserved evaluated `retrieval-pilot-20261011` directory.

```powershell
$run = '..\KnowledgeBase\library-knowledge\your-new-retrieval-run'
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.retrieve prepare --folder $run --crosswalk ..\KnowledgeBase\library-knowledge\crosswalk-pilot-20261011\crosswalk.json
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.retrieve encode --folder $run
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.retrieve development --folder $run
# Record the implementation/input freeze before inspecting held-out results.
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.retrieve heldOut --folder $run
# After explicitly reviewing and recording the pooled candidates:
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.evaluate --folder $run
```

Hybrid queries must already exist in the frozen query-vector cache; arbitrary queries fail explicitly. Model identity, input hashes and corpus build are checked. A later corpus build requires a fresh run; original result files remain historical evidence. Replays use CPU and the cached queries without calling the encoder. Query time excludes preparation and encoding.

`evaluate.py` computes deterministic metrics from explicit binary usefulness labels in `judgments.json`, checking the result/pool/freeze bindings and question coverage. It does not create judgments or certify their correctness. The current pilot evaluator implements the proposed 18-of-20 release gate. Preserve `evaluation-freeze.json`, `review-pool.json` and judgments alongside the inputs and results.

The [completed comparison](../../initiatives/library-knowledge/RETRIEVAL-PILOT.md) measured 17/20 hybrid versus 12/20 keyword-only on a limited AI-assisted review. The release gate remains unmet. All 208 missing selected vectors are from TCP Flavel; private keyword retrieval remains available. Supplemental Bible/study candidates acquire no public-use clearance from this step. LK-107 adds reproducible collection assembly and dependency invalidation.

## Reproducible packages and invalidation — LK-107

`assemble.py` preserves existing capture envelopes and their review fingerprints, attaching scoped crosswalk/use sidecars and optional historical retrieval diagnostics. It creates content-addressed private objects and an atomic manifest with a reverse dependency index. [Real acceptance report](../../initiatives/library-knowledge/REPRODUCIBLE-COLLECTIONS.md).

A recipe is a JSON object with `schemaVersion: 1` and 1–50 uniquely identified `collections`. Each entry needs `id` matching the captured collection, `capturePath`, `crosswalkPath` and `eligibilityPath`. Use absolute input paths. Optional `retrieval` has `folder` for a verified LK-106 run and explicit unique `questionIds` from its held-out results. This links historical diagnostics; it neither reruns search nor changes usefulness labels. Capture selection and review remain explicit upstream tasks.

```powershell
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.assemble build --recipe ..\KnowledgeBase\library-knowledge\assembly-pilot-20261012\recipe.json --folder ..\KnowledgeBase\library-knowledge\assembly-pilot-20261012\release-final
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.assemble check --folder ..\KnowledgeBase\library-knowledge\assembly-pilot-20261012\release-final
```

Unchanged builds reuse files without writes; independent builds with the same inputs are byte-identical. `check` prints `current`, `stale` or `invalid` per collection and changed dependency descriptors, and exits nonzero on failure. It checks source bytes, selected corpus data and immediate neighbors, relevant registry/canonical records, scoped source decisions, frozen retrieval inputs and implementation/schema hashes. Shared dependency reads are cached for that check only. Corpus-build changes deliberately invalidate all affected packages. Checks do not modify review states, captures, live databases, vectors or publication selection.

An unchanged record in a valid shared crosswalk/use/result file does not become stale merely because another record changed. Shared policy or implementation changes do invalidate their dependents. Timing observations are excluded from retrieval fingerprints. Corrupt/missing artifacts fail closed. Dated reader and policy facts are retained; rerun the upstream crosswalk/use workflows before publication, since dependency checks do not monitor remote policies or certify live reader availability.

If a release is stale, inspect the reasons, explicitly correct and review the affected upstream artifacts, then build into a **new** private directory. The assembler refuses to overwrite the old release or auto-approve changed claims. A current check is required before consuming a stored package; the manifest is historical, not a freshness guarantee. Atomic object/manifest creation is supported, but no scheduler, public release adapter or production rollback service is added here.

The real `release-final/` has 2 collections / 3 reviewed passages / 4 historical diagnostic questions with 48 unique dependencies. The initial `release/`, independent rebuild and mutation fixture are development/acceptance artifacts only. The 17/20 retrieval gate, missing canonical chains and exact-edition readers remain unresolved. Next central task: LK-201.

## Ephesians chapter/section connections — LK-202

`connections.py` uses the existing capture, schema and dependency helpers to assemble six private chapter packages from four explicitly selected XML originals. [Completed preparation](../../initiatives/library-knowledge/EPHESIANS-CONNECTIONS.md).

```powershell
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.connections build --spec ..\KnowledgeBase\library-knowledge\ephesians-connections-20261012\spec.json --folder ..\KnowledgeBase\library-knowledge\ephesians-connections-20261012\release-final
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.evidence_collections.connections check --folder ..\KnowledgeBase\library-knowledge\ephesians-connections-20261012\release-final
```

The versioned specification explicitly names Ephesians and the `fergusson`, `calvin-commentary`, `calvin-sermons` and `hodge` document IDs, original hashes and attribution. Named translator assertions must match exact source XML text. These adapters are specific to the inspected editions; unexpected headings/selectors fail rather than guessing a generic cross-source mapping.

Fergusson verse-and-explication elements and Calvin reference-titled commentary sections produce limited source-location captures. Only a unique gap-free prose sample in the right corpus document is accepted. Scripture tables/headings are reference evidence, not author exposition. The known Fergusson 1:6 heading conflict remains unbound. Sermons and Hodge chapter headings remain chapter-only candidates, with no inferred verse scope. Existing verse IDs, canonical identities where present, original wording and adjacent context are retained.

Each package has a normal validated `collection` plus `connections`, source/reader proofs, coverage and dependency hashes. Voice/endorsement is left unresolved for later claim-specific review. The new captures add source-proven translator attribution and seal that initial review; prior captures and live metadata remain untouched. Public reading routes appear only for verified text; page locations are separate from whole-work routes. Private coverage and on-site located coverage are counted separately.

`build` is deterministic and refuses to overwrite different existing artifacts. Use a new private folder after explicit corrections. `check` verifies artifact/dependency integrity and the current chapter's main Bible rows, returning nonzero for stale dependencies. No corpus, references table, graph, vector or public exporter is opened for writing. The new sources' canonical/use sidecars are still pending; LK-105's earlier decisions are not inherited. `release-final/` is the authoritative output; development and reproducibility folders are not additional collections.
