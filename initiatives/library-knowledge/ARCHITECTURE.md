# Architecture

[Home](README.md) · [Evidence contract](EVIDENCE-CONTRACT.md)

**Updated 14 October 2026:** [KR-100/101's section/span release](../../knowledge/library_analytics/SECTIONS-RESULT.md) and [KR-102's chunk/reader alignment](../../knowledge/library_analytics/ALIGNMENT-RESULT.md) are complete for their supported snapshots. [DESIGN.md](DESIGN.md) specifies the remaining concept, relationship, argument, historical/language and evidence-compilation systems. This document describes storage and delivery foundations.

## Existing systems to reuse

- `Website/knowledge/`: local SQLite/FTS5 retrieval, Qwen embedding pipeline, existing graph/enrichment implementation.
- `KnowledgeBase/`: private runtime data, corpus/vector versions and coordinator state. Never create another competing ingestion or vector writer.
- `Website/content/library/`: catalogue IDs, authors, works, editions, assets and source provenance.
- `Website/scripts/build-meaning-pack.py` and `src/lib/meaning/`: the independent Granite browser model and downloadable search pack.
- Existing reader routes, Teachers acquired sections, Study branches, topic collections, research examples and source directory.

## Offline pipeline

1. Select a consistent corpus/graph/vector snapshot and record actual coverage. Current-pass embedding completion does not prove pending intake is complete.
2. Resolve source identities, work/edition relationships and available body locations. Preserve originals and existing vectors.
3. Retrieve candidates using exact references, FTS5 and vector similarity. Combine rankings using a measured method; never compare raw lexical and cosine scores as if calibrated alike.
4. Collapse duplicate editions and overlapping chunks for ranking, retaining edition-specific locators. Retrieve adjacent source context before interpretation.
5. Use optional reranking and selective model analysis on bounded candidates. Do not run generation across every chunk by default.
6. Save evidence collections, including exclusions, attribution, input hashes, methods and review state.
7. Generate dependent editorial and discovery artifacts. Export only material eligible for its particular public use.
8. Publish immutable versioned assets and switch a manifest after validation; keep a previous release for rollback.

Avoid all-pairs comparison of millions of chunks. Use topic/verse anchors, section summaries, approximate-neighbor retrieval and bounded candidate sets. Cap simultaneous CPU, disk and GPU load based on measurements; preparation must not starve active embedding.

## Serving without the owner's PC

| Output | Delivery | Visitor computation |
| --- | --- | --- |
| Answers, lessons, comparisons | Site pages and versioned data | Rendering and filters |
| Passage/author recommendations | Sharded ID lists and explanations | Lookup by current page |
| Evidence tables and maps | Small subject/place/period bundles | Filters and selected visual projections |
| Meaning discovery | Compact Granite embeddings plus current browser engine | Encode query locally and rank the installed pack |
| Large optional subjects | Separately downloadable packs | Search only selected packs |
| Exact names/references/titles | Suitable public lexical indexes | Lightweight lookup; hosting choice remains open |

The local Qwen vectors are 2,560-dimensional; the current Granite browser vectors are 384-dimensional. They are incompatible spaces. Use Qwen to discover material, then encode the selected public descriptions using the browser model. Never truncate Qwen vectors and treat them as Granite vectors.

Do not ship the full corpus of millions of chunks to every browser. Measure pack size, startup, memory and relevance before selecting compression or sharding. Offline prepared answers cannot guarantee a newly researched response to arbitrary questions; distinguish a matched prepared answer from live generation.

## Proposed storage ownership

| Path | Role | State |
| --- | --- | --- |
| `Website/initiatives/library-knowledge/` | Versioned plans and contracts | Created |
| `Website/knowledge/` | Reused implementation; add modules only as needed | Existing |
| `KnowledgeBase/library-analytics/` | Existing warehouse, bulk processors, private product/consumer releases and application receipts | Existing |
| `KnowledgeBase/library-knowledge/` | Private capture/retrieval/Ephesians packages; connected-research/ contains section and alignment DBs, evaluation fixtures and immutable releases | Section/span and chunk/reader alignment populations complete for selected supported inputs; deeper processors remain |
| `Website/content/library-knowledge/` | Possible editorial/public export input path; reuse existing owners/contracts where appropriate | Proposed delivery choice, not established by this design |
| `Website/data/library-knowledge/` | Possible generated public bundle path; finalize through the existing build owner | Proposed delivery choice, not established by this design |

The bounded LK-103/LK-107 evidence schemas and packages already exist. Reuse them; KR-101–150 extend section/relationship/compiler contracts. Public output paths are finalized through existing website consumers in KR-160. Do not place private source bodies in the public repository. A documentation folder is not a public content export.

## Current systems versus proposed processing

Existing analytics store document-level facts and source witnesses. KR-100/101 adds stable section identities, native hierarchy and versioned source spans. [SECTIONS.md](../../knowledge/library_analytics/SECTIONS.md) contains executable commands and actual tables. KR-102 adds generation-bound chunk overlaps, reader coordinates, honest navigation states and text/location witnesses; [ALIGNMENT.md](../../knowledge/library_analytics/ALIGNMENT.md) describes queries and recovery. Further typed relationships remain proposed. Graph projection uses the existing enrichment owner and does not replace evidence tables.

Prefer existing SQLite stores and indexed read projections first. A separate analytical engine or graph service needs a measured query/storage benefit. The current review observed a full-table query plan for a representative Scripture lookup; verify access patterns, indices and latency before serving interactive consumers. Large row counts do not imply a query is ready for a page.

Snapshot-based section/lexical analysis can proceed independently of final vector completion. Semantic mining records valid vector coverage for its selected scope. Full-current-corpus delivery requires the pending source-owner incorporation and relevant source/vector/graph checks; do not apply a blanket graph gate to every independent CPU job.

## Incremental operation

Every output depends on source hashes, corpus build, catalogue IDs, rule/model versions and editorial revision. Changes invalidate only affected descendants. Refresh must preserve historical provenance, remove stale published references, update search manifests and retain rollback. A PC is needed for the next refresh, not for visitors to use the last release.
