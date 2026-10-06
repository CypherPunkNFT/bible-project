# Bible Project knowledge graph: evidence before inference

**Design checkpoint: 6 October 2026. Status: implementation plan, not a completed graph.**

This is the concrete build plan for [ANALYSIS.md](ANALYSIS.md), using the deterministic strategy in [ENRICHMENT-STRATEGY.md](ENRICHMENT-STRATEGY.md). The graph belongs only to Bible Project. Its purpose is to explain connections between Scripture and the held library, improve retrieval, and make every analytical result inspectable.

## 1. Verified starting point

The completion monitor passed at **9:14 AM Eastern, 6 October 2026**. Its corpus build is `2026-10-06T08:27:52.542399+00:00`.

| Existing resource | Measured scope |
| --- | --- |
| SQLite / FTS5 | 32,312 documents; 1,710,344 searchable chunks |
| LanceDB | 1,710,344 vectors; no missing, duplicate or stale vectors at completion |
| Scripture records | 1,027,939 verses across 37 editions / 17 language codes |
| Recorded relationships | 354,207 rows: 344,799 OpenBible cross-references; 9,408 person-family links |
| Document reference register | 32,259 `references_to` rows |
| Library intake | 30,904 files: 15,480 indexed, 15,418 metadata/assets, 4 duplicates, 2 deferred scans |
| Integrity | SQLite OK, zero foreign-key errors, embedding identity matches |

The current `edges` table is an imported relationship register. It does not establish a rich entity ontology, source-span evidence for every assertion, doctrinal agreement, historical influence, or author-level positions. `references_to` identifies document-level references and uses a default edition in its writer; do not upgrade this to verified edition-specific body citations without checking origin. Family relationships have source attribution, but their existing integer edge IDs are not stable across corpus rebuilds.

The corpus includes catalogue/review/project documents as well as actual source bodies. Default analytical queries must distinguish these. Current chunk IDs depend on document, locator, title and text. Some library locators are transcription-part labels, not printed pages. The graph must preserve that limitation rather than fabricate page numbers. Public metadata bibliography IDs and corpus document IDs also require an explicit crosswalk.

## 2. Questions the first release must answer

1. **Where can I study a passage?** Given Romans 4, show cited sermons, commentary sections and confessional references, identifying which are recorded main-text metadata, literal citations or reviewed exposition.
2. **Which works share a reference pattern?** Compare sections using the same passages, show the shared references, and distinguish independent works from duplicated editions.
3. **Where is a subject discussed in different vocabulary?** Find justification, covenant, assurance, prayer, suffering and resurrection through versioned English term rules, with the exact matching words and surrounding context.
4. **How did we get this connection?** Traverse author → work → edition → source section → Scripture reference, and inspect the evidence at every step.
5. **Where does the evidence stop?** Return unresolved names, unknown reference numbering, incomplete works and ambiguous topic matches without manufacturing a resolution.

These are retrieval and evidence questions. “Who disagrees with whom?”, “Who influenced whom?” and “What does this author believe?” require a later attributed-claim layer. A source citing Romans 4 and James 2 does not by itself establish its interpretation of justification.

## 3. Architecture decision

Start with a separate **`KnowledgeBase/enrichment.sqlite3`**. Keep `knowledge.sqlite3` and LanceDB as read-only inputs during enrichment. Rebuildable graph projections live under `KnowledgeBase/enrichment-runs/`; the authoritative analytical data are located observations, assertions and their provenance. Do not replace the existing `knowledge/graph.py` reader while building this layer.

SQLite supports the initial indexed adjacency queries and bounded recursive traversal. That is a project design choice, not a claim that SQLite will handle every eventual graph workload. A dedicated graph server can be introduced as a projection if measured query latency or graph size warrants it. No new server, graph neural network, remote service or corpus-wide generative indexing is required for the first release. [SQLite recursive queries](https://www.sqlite.org/lang_with.html)

```text
Frozen corpus + catalogues + source manifests
       | read-only IDs, original text, hashes and locators
       v
Versioned terms / citation parser / entity crosswalk
       | deterministic, resumable extraction
       v
Observations + typed assertions + unresolved candidates
       | validated release manifest
       +--> indexed graph projections / relationship analysis
       +--> FTS5 + vector search + bounded graph expansion
                    |
                    v
          passages, source context and explained paths
```

FTS5 performs candidate discovery with scoped phrases, Boolean and proximity expressions; a deterministic matcher maps results back to original text. Full-text token offsets are not original-character offsets. This corpus applies NFKC and CJK segmentation, so offset mapping and original text checks are necessary. [SQLite FTS5](https://www.sqlite.org/fts5.html)

## 4. Identity contract

Use a typed namespace plus an existing stable ID whenever possible. Preserve source IDs in a crosswalk; never merge entities by display name alone.

| Entity | Identity and boundary |
| --- | --- |
| Biblical person / place | Existing TIPNR/place identity with source namespace; similar names remain distinct |
| Historical person / organization | Catalogued author/source IDs; explicitly unresolved candidates when identity is insufficient |
| Work / edition / asset | Three separate identities; a translation or digital scan is not a new author or necessarily a new work |
| Document / chunk / source span | Corpus document/chunk IDs plus corpus build; original-text code-point offsets `[start,end)` within the chunk, chunk text hash and locator |
| Scripture reference | Preserve literal citation, book/range, explicit numbering scheme and edition when known; unknown remains unknown |
| Edition verse / passage | Edition-specific verse ID or range. Cross-edition equivalence requires an explicit alignment assertion |
| Topic | Existing vocabulary ID and sense definition; aliases are language-scoped and versioned |
| Claim | Deferred until attribution/quotation/negation handling is reviewed; a topic match is not a claim |

Document identity is not bibliographic identity. A single work can have multiple editions, assets, derivatives and corpus documents. Exact duplicate content keeps all source witnesses but does not multiply independent-work counts. Unassigned bibliography records remain linked to assets without inventing a work or author.

Entity merges require a recorded decision, reversible alias redirects and affected-assertion revalidation. Do not destructively rewrite historical IDs. Explicitly test different people called John, biblical James versus a historical author, repeated sermon titles, anonymous confessions and modernized reprints.

## 5. Storage contract

The migration and executable SQL are the first implementation deliverable. Planned tables:

| Table | Required content |
| --- | --- |
| `corpus_snapshots` | Build ID, manifest digest, schema version, captured source hashes and scope |
| `runs` | Input snapshot, parser/compiler versions, term-pack digest, limits, counters, start/end, state, checkpoints |
| `entities` / `entity_keys` | Typed identity, display label, source namespace/key, aliases and merge history |
| `observations` | Chunk/document ID, original-text hash, exact span or structured-record locator, literal value, language, source/asset identity and method |
| `assertions` | Subject, relation, object, qualifiers, attribution, basis, review state, producing run and validity state |
| `assertion_evidence` | Many-to-many assertion → observation linkage; no unexplained published edge |
| `candidates` | Competing identities/references, rule evidence and unresolved reason |
| `reviews` | Append-only accept/reject/correct decisions, reviewer type, reason and timestamp |
| `derivations` / `derivation_inputs` | Metric/projection definition, parameters and contributing assertion IDs |
| `releases` / `release_membership` | Validated assertion set, quality report and current published pointer |

Foreign keys enforce local graph integrity. Corpus cross-store references are validated against the recorded snapshot before publication; ordinary cross-file SQL foreign keys cannot provide that guarantee. Index adjacency in both directions by relation, validity and subject/object, plus evidence by chunk and snapshot. Use an explicit allowed-relation/type matrix. Prevent topic hierarchy cycles; permit graph cycles where meaningful.

An observation's identity derives from source snapshot/content identity, original locator/span and extraction rule. An assertion's identity derives from typed endpoints, relation, qualifiers and attribution; repeated supporting sources add evidence rather than duplicate the same assertion. Distinct contradictory attributions coexist. Statistical similarity edges use separate derivation identities and retain their input scope.

Evidence can be either a located text span or a precise structured source record, with file hash, record key and field. Imported OpenBible edges use structured evidence with range/vote data; they must not masquerade as a quotation from Scripture. Store relation meaning separately from method/review state. Useful basis labels: `source_record`, `literal_match`, `rule_candidate`, `reviewed_interpretation`, `statistical_association`.

This provenance model follows the distinction between entities, activities and agents in W3C PROV, without requiring RDF as the runtime store. [W3C PROV-O](https://www.w3.org/TR/prov-o/)

## 6. First-release relationship vocabulary

| Relation | Endpoints and meaning | Automatic promotion allowed? |
| --- | --- | --- |
| `authored_by` | Work → person, according to identified catalogue evidence | Yes, preserving source assertion and uncertainty |
| `edition_of` / `asset_of` / `part_of` | Bibliographic and source containment | Yes, explicit IDs only |
| `source_cross_reference` | Scripture reference → Scripture reference, as recorded by OpenBible | Yes, preserve numbering, direction, range and votes |
| Source family relations | Biblical person → person, retaining original relationship labels/source | Yes after identity validation; no automatic reciprocal additions |
| `cites_reference` | Located source span/section → parsed Scripture reference | Yes only when syntax/range validation passes; numbering can remain unknown |
| `mentions_entity` | Located span → identified entity | Only for unambiguous rules; otherwise candidate |
| `topic_match` | Located section/span → topic sense | Rule evidence only; does not claim author endorsement |
| `broader_topic` | Topic → topic | Reviewed vocabulary edge; no inference from co-occurrence |
| `shares_references` | Section/work → section/work | Derived association with named features and normalization |
| `expounds` / `supports` / `opposes` / `influenced_by` | Interpretive/argument/history claims | No automatic promotion in the first release |

Imported “main text” metadata retains that exact designation. A long citation or frequent reference is not automatically exposition. In quoted controversy, the author, quoted speaker and the source of a claim must remain distinct. The site's Reformed editorial position can organize presentation while preserving the actual positions and limits of every source.

## 7. Execution order and gates

### G0 — Freeze and audit

Read the completion/verification reports again immediately before execution. Record the current corpus build, catalog/manifests and eligible document IDs. Detect changes since the snapshot. Write a read-only input adapter and a graph migration with schema/version checks. Measure baseline FTS/vector answers for the evaluation queries before adding graph expansion.

**Gate:** corpus integrity and vector parity pass; known source coverage/deferrals are recorded; every pilot ID resolves. Planning documents added after the snapshot are not a reason to re-embed all existing chunks, but belong to a later explicit corpus refresh if project-document search is to include them.

### G1 — Explicit foundation

Import known entities, bibliographic structure and the existing source relationship register. Reconcile catalogue and acquisition-only documents. Audit references whose endpoint or numbering cannot be resolved. Keep unresolved rows in candidates. Verify source evidence and deterministic IDs. No prose-based inference yet.

**Gate:** 100% of published edges have valid typed endpoints and retrievable evidence; all dropped/deferred rows have an explicit reason; identical reruns produce identical active results and no duplicate assertions.

### G2 — Bounded extraction pilot

Freeze a manifest of **120 actual source documents**: target 20 each from sermons, commentaries, theology, confessions/reference, apologetics and historical/devotional works. Stratify by author, length, edition and text quality. If a stratum lacks eligible distinct works, report the shortfall rather than fill it with duplicates. Keep catalogues and project prose as separate negative-control material. Use English body text for the initial topic pass; include non-English and numbering-mismatch fixtures as exclusion/alignment tests, not a claim of multilingual topic coverage.

Author an initial **24-rule English pack** across the six questions/topics above, with distinctive phrases, ambiguous alternatives, exclusions, positive examples and hard negatives. The LLM drafts and helps revise these artifacts; deterministic Python validates, compiles and executes them. No model calls or GPU dependency inside the batch. Citation parsing is its own pass; FTS does not substitute for a citation grammar.

Enumerate all matches for each completed pilot rule using keyset pagination, not top-N search results. Scan bounded neighboring text only within the same verified section and record boundary handling. Persist checkpoints by snapshot/rule/document. Budget/time stops must be marked incomplete and resumable. Never execute authored Python/SQL from a term pack.

### G3 — Quality review

Before the pilot, select **300 positive candidate checks** (100 citation, 100 entity, 100 topic), plus **100 independently selected source windows** for missed-match evaluation. Stratify across the pilot; freeze sample IDs and seed. Where fewer eligible positives exist, review all and explicitly report the smaller denominator. Maintain at least 40 hard-negative fixtures for ambiguous names, disputed quotation, negation, ranges, Roman numerals, joined verses and chunk boundaries.

Proposed release targets, to be applied before broad extraction:

- All published evidence spans reproduce the stored literal text from the recorded input; zero silent edition remappings.
- At least 99/100 reviewed literal citations resolve to the correct parsed reference, at least 98/100 entity resolutions are correct, and at least 95/100 topic matches concern the intended sense. Report counts and uncertainty; these samples are not proof of universal accuracy.
- Zero automatic endorsement/influence/contradiction claims from topic or vector similarity.
- At least 90% recall for explicit citations in the independently read windows; report topic/alias misses separately by rule. Recall outside the reviewed scope remains unknown.
- Any systematic error class blocks its rule even when the overall average passes. Retune on a development sample and retest on held-out material; do not repeatedly tune against the acceptance sample.
- Cancellation, resume, changed-source invalidation, duplicate witnesses and rollback tests pass.

Human theological review is needed for interpretive claims in later phases. If only model review is available, record it as model review; it does not satisfy a human-review gate. The first release can remain an explicit-evidence and candidate-topic graph without claiming reviewed interpretation.

### G4 — Controlled scale-up

Promote passing rules only, in batches, to eligible snapshot documents. A first scale checkpoint covers 10,000 additional chunks, then measures runtime, database growth, hit quality and source resolution before the full pass. Report unique works as well as chunks and distinguish duplicate witnesses. Record a projected full-run cost from measured throughput rather than promise an ETA now.

### G5 — Useful graph queries

Ship source-path inspection and passage-to-library lookup first. Add section-level co-citation and shared-reference comparisons after foundational edges pass review. For shared references, compare normalized reference identities, deduplicate within a section, downweight ubiquitous citations and report overlap counts alongside the weighted similarity. Do not mix editions with unknown alignment.

Avoid all-pairs comparison across 1.7 million chunks. Generate candidates through shared-reference/topic indexes; bound large postings and record skipped/truncated computation. Cap exploration paths by depth and edge count, showing when more exist. Use chosen projections for centrality/community detection; do not treat clusters as doctrinal schools or connectivity as theological truth.

Compare graph-assisted retrieval with the frozen FTS/vector baseline on **50 preselected questions**. Judge useful source evidence and misleading paths, not merely more results. Target p95 under two seconds for bounded local graph expansion, measured separately from query embedding; tune only after real timings. Results must return evidence and path explanations, and must fall back to ordinary search when the graph has no supported connection.

## 8. Operational safeguards specific to this corpus

- Bulk runs use one analytical writer, bounded transactions, disk-space checks and explicit cancellation. A stopped run cannot replace the last good release. Publish a validated release pointer atomically; retain the prior release for rollback.
- Read a stable corpus snapshot throughout a run. Do not use immutable SQLite mode on a file another process can swap. Coordinate the initial snapshot with the existing build lock, then release the corpus lock once a consistent retained snapshot is secured; graph extraction must not block normal reading/search.
- Incremental updates follow source/rule dependency hashes. Reuse unchanged observations, invalidate changed/deleted inputs, and rebuild affected derived edges. Original corpus files and vectors remain untouched.
- Keep local-only/rights-restricted material local. Any future public graph API/export needs its own allowlisted projection: neither source snippets nor private acquisition metadata become public merely because they now form graph evidence.
- Add graph status to the local knowledge service only after implementation: snapshot, release, entities/edges by basis, evidence coverage, unresolved cases and failed rules. Stale graph releases must be labelled against newer corpus builds.
- Do not install a watchdog for graph extraction until cancellation and resume semantics exist. The embedding watchdog must not start enrichment automatically.

## 9. Deliverables and next action

1. `knowledge/enrichment/` migrations, input adapter, typed relation registry and validation fixtures.
2. `knowledge/terms/schema.json` and the draft 24-rule pilot pack.
3. `knowledge/enrich.py` validate/plan/run/resume/report interface, with explicit scope and no default full-corpus mutation.
4. Local run manifests, source-backed review samples and acceptance report.
5. A read-only evidence/path API and then a purposeful visual explorer, after query quality is demonstrated.

The next implementation unit is **G0 + G1**, with a small fixture graph first. Completing this plan does not mark G0–G5 or E01–E04 done. Broad topic extraction, argument mapping and GraphRAG community summaries remain gated. Microsoft's GraphRAG documentation describes model-based entity/relationship extraction and community summarization; those are possible later derived layers, not substitutes for the source-backed foundation planned here. [GraphRAG indexing overview](https://microsoft.github.io/graphrag/index/overview/)
