# Bible Project knowledge graphs and analytical enrichment

**Class:** LIVING · **Recorded:** 2026-10-05 · **Status:** Planned; analytical implementation remains open.

**Preferred execution strategy:** [Knowledge base enrichment strategy](ENRICHMENT-STRATEGY.md). Use an LLM to author reusable term libraries and context rules, then execute deterministic Python/FTS5 passes without inference in the bulk run. This refinement prioritizes inexpensive, measurable entity/topic/citation enrichment before selected deeper interpretation. The strategy governs the first implementation of this roadmap.

**Concrete implementation plan (2026-10-06):** [GRAPH-PLAN.md](GRAPH-PLAN.md) now defines the initial storage decision, identity/evidence contracts, first relation vocabulary, pilot scope, numerical review gates and incremental release process. The expanded corpus prerequisite is complete; graph construction remains planned.

This segment strengthens the independent Bible Project knowledge database by extracting, storing and analyzing relationships across Scripture, reference works and the Christian library. The owner selected entity graphs, Scripture-use networks and topic networks as the first priorities, followed by argument mapping and comparative analysis. FTS5 and vector retrieval remain the foundation; these additions make relationships and evidence directly queryable.

The immediate request is to record this direction in the project documents. This documentation update does not execute extraction runs, choose a graph database, acquire more material or publish new website features.

## Project context and boundaries

Implementation lives beside the local search system in `Website/knowledge/`; runtime state belongs to `BibleProject/KnowledgeBase/`. Keep the system independent of the general Fortress knowledge stores. See [the local knowledge README](README.md), [project TODO](../../TODO.md), [project HANDOFF](../../HANDOFF.md) and [the library acquisition backlog](../content/library/BACKLOG.md).

The existing implementation provides SQLite/FTS5, LanceDB embeddings, original verse records, basic recorded cross-references, person relationships and document-to-verse links. These are useful inputs, but do not constitute the richer analytical layers described here. Completion of the initial embeddings and ingestion of the newer library bodies remain separate baseline tasks. Catalog descriptions and source links must not be mistaken for indexed book bodies.

Earlier project notes deferred interconnected analysis under Phase 4. The owner's 2026-10-05 direction now establishes this analytical roadmap. Treat the earlier deferral as historical context for this planning work; the implementation tasks below remain unchecked. Existing source preservation, attribution, numbering and theological editorial rules still apply. Public study trails and website integration retain their own delivery scope.

## Analytical layers and questions

| Task | Layer | Stored output | Example question |
|---|---|---|---|
| K01 | Entity and relationship graph | Stable identities for people, places, events, passages, authors, works, editions, topics and claims; aliases, ambiguous mentions and typed relationships | What connects this passage, these people and the works discussing them? |
| K02 | Scripture use and citation network | Normalized Scripture and work citations, their locations and their use: mention, quotation, substantial exposition, supporting evidence or disputed interpretation | Who substantially explains Romans 4, and how is it used in different arguments? |
| K03 | Hierarchical topic network | Multiple topics per section, broader and narrower concepts, related terms and attributed definitions | Which works discuss this doctrine using different vocabulary, and which particular questions do they address? |
| K04 | Claim and argument graph | Attributed claims, premises, evidence, objections, replies and qualifications, including the role of quoted speakers | Do two authors disagree about the evidence, its interpretation, their definitions or the conclusion? |
| K05 | Quotations and intertextual parallels | Located exact and approximate quotations, reused wording, parallel accounts and candidate allusions, with match evidence | Where does this wording recur, and which matches suggest a connection worth examining? |
| K06 | Graph analysis | Shared citations, similar connection patterns, clusters, connecting passages and explainable paths | Which subjects share sources, and which passages connect otherwise separate discussions? |
| K07 | Original-language lexical analysis | Available lemmas, morphology, contextual senses, phrase patterns and explicit translation alignments | Where is this lemma used, how does its context vary, and how do translations render it? |
| K08 | Comparative and historical analysis | Positions tied to specific works, editions, dates and contexts; documented agreements, disagreements and revisions | How does an interpretation develop, and where does an author qualify an earlier position? |
| K09 | Graph-assisted retrieval | Queries combining full text, vectors, graph traversal and source excerpts, with the connection path returned | Which works interpret this passage differently, and what evidence supports each interpretation? |
| K10 | Analytical evaluation | Reviewed examples, error cases and measured extraction/retrieval results for the layers above | Are the new connections accurate, useful and reproducible compared with the existing search? |

These questions are proposed capabilities, not findings already established in this corpus.

## Entity identity and relationship design

Resolve mentions to canonical entities while retaining the original wording and location. An ambiguous name such as John must remain unresolved when the text does not identify which person is intended. Record competing candidates instead of forcing a merge. Keep work, edition, physical/digital asset, section and text span as separate identities. Reuse existing catalog IDs through an explicit crosswalk.

Scripture references retain their edition and numbering system. Cross-edition alignment is a separate relationship requiring a documented mapping. Missing verses, joined labels, chapter numbering differences and original-language witnesses must survive normalization.

Suggested relationship types include `authored_by`, `part_of`, `mentions`, `occurred_at`, `cites`, `quotes`, `expounds`, `interprets`, `asserts`, `attributes_to`, `supports`, `objects_to`, `replies_to`, `qualifies`, `parallel_to` and `broader_topic`. Define the permitted source and target types, direction, meaning and required evidence before writing each type. A `supports` edge records support within an attributed argument; it does not establish that the argument is true.

Keep the graph storage decision open until the pilot demonstrates needed queries and scale. A graph is a representation of entities and edges; a dedicated graph engine or graph neural network is not a prerequisite. Any graph projection must be reproducible from the source-backed analytical records in this independent instance.

## Evidence carried by every assertion

Each extracted or calculated relationship needs:

- A stable assertion ID, source and target IDs, relationship type, direction and relevant qualifiers.
- The supporting source asset/version and exact text span or page/section/verse locator. Derived graph metrics instead link to their contributing assertions and run inputs.
- The author or speaker whose position is represented, where applicable; quotation, criticism, hypothetical examples and endorsement remain distinguishable.
- A basis label: explicit source statement, deterministic match, model-extracted interpretation, statistical association or proposed connection.
- Extraction method and version, model/prompt identity where used, input hashes and analysis-run ID.
- Review state, reviewer identity/type, uncertainty and rejection/correction history. Model scores and human review status remain separate fields.

Keep observed statements, statistical similarities and theological interpretations distinguishable in storage and queries. Proposed allusions and disagreements remain candidates until the evidence supports their classification. An author quoting an opponent does not thereby hold the quoted position. Absence of a claim from the indexed selection does not establish an author's denial of it.

The project's theological editorial position can guide selection and presentation while the database preserves each source's actual statements and disagreements. Do not rewrite sources into a consensus. Retain existing distinctions between Scripture, commentary, historical testimony and editorial analysis.

## Repeated analysis runs

The enrichment should happen through explicit, repeatable passes whose results are saved for later querying:

1. Select an input snapshot and record which documents have searchable bodies, usable locators and sufficient text quality for this run.
2. Identify mentions and resolve entities, preserving ambiguous cases.
3. Extract Scripture and work citations, normalize their identities, and classify how each citation is used.
4. Assign section-level topics and attributed definitions; preserve multiple topics and differences in terminology.
5. Extract claims, argument structure, objections and replies with their source spans.
6. Detect textual parallels and candidate allusions; distinguish lexical overlap from interpretive connections.
7. Compute graph similarities, clusters and paths from explicitly selected relationship types.
8. Validate, review and publish a versioned analytical result set with coverage and error counts.

Every run records its scope, source hashes, parser/model/configuration versions, created and revised assertions, unresolved candidates, failures and evaluation results. Source edits invalidate dependent assertions; retained history makes previous analyses reproducible. Re-running unchanged inputs must not duplicate entities or edges. Original source files remain unchanged.

## Citation and graph analysis methods

**Co-citation** connects passages or works repeatedly cited together. **Bibliographic coupling** connects works that cite the same sources. Compute these at an explicit unit, such as a sermon, chapter or argument, so a very long book does not create meaningless associations between every reference it contains.

**Shared-neighbor similarity** compares connection patterns. **Community detection** identifies densely connected groups. **Centrality and path analysis** can find frequently connected nodes and passages bridging discussions. Save the chosen algorithm, parameters, graph projection and contributing evidence. A community is a discovered pattern in a particular corpus, not automatically a doctrine or school of interpretation.

Adjust analyses for document length, common references, duplicate editions and unequal author representation. Separate occurrence counts from counts of independent works or witnesses. Frequency and connectivity do not measure theological truth or historical influence. Influence requires direct evidence beyond similarity and chronological possibility.

For intertextual analysis, record exact matching spans, normalization rules, language and candidate direction. A common expression is weaker evidence than a distinctive sustained parallel. Separate an observed quotation from attribution to a specific source edition and from the interpretation of why it was used.

For lexical work, begin with annotations actually present. Strong's identifiers can seed links but do not supply a complete morphological analysis or prove that every occurrence has the same sense. Label added linguistic analyses by method and review state. For historical comparisons, distinguish composition, delivery, edition and translation dates; retain approximate and unknown dates.

## Delivery order and completion evidence

Start with **K01 entities, K02 Scripture use, and K03 topics**, developing the run/evidence contract and K10 evaluation alongside them. Reuse a bounded selection of already indexed Scripture, reference material and actual library bodies. Define expected entities, citations and relationships before processing; report coverage against that selection.

The first pilot is complete when it resolves its selected identities, preserves unresolved mentions, returns citations with correct edition/verse and source locations, distinguishes citation use, and supports section-level topic queries. Example checks should include ambiguous names, quotation of an opposing view, a numbering mismatch and similar vocabulary expressing different positions.

Continue with K04 arguments and K05 parallels; run K06 analytics on validated graph projections. Add K07 lexical and K08 historical analysis as their annotations and edition/date evidence permit. K09 then combines graph traversal with FTS5 and vectors. GraphRAG-style community summaries are optional derived outputs that must resolve to their contributing evidence and become stale when it changes.

For every completed task, record the actual input scope, output counts by evidence/review class, unresolved cases, validation commands and representative queries. Measure entity resolution and citation extraction accuracy, relationship classification errors, and the usefulness of retrieved evidence. Compare graph-assisted results against the existing search. Use measured thresholds established for the pilot; do not equate a successful script run or a larger edge count with better knowledge.

## References for implementation

- [Neo4j node similarity](https://neo4j.com/docs/graph-data-science/current/algorithms/node-similarity/index.html) describes graph similarity algorithms; it is a technical reference, not a graph-engine selection.
- [Neo4j Leiden community detection](https://neo4j.com/docs/graph-data-science/current/algorithms/leiden/) documents one candidate clustering method.
- [Microsoft GraphRAG indexing](https://microsoft.github.io/graphrag/index/overview/) describes extraction and community-report pipelines.
- [Microsoft GraphRAG query overview](https://microsoft.github.io/graphrag/query/overview/) describes retrieval using graph entities, source chunks and derived community reports.

The schema, sequence and evaluation requirements above are this project's proposed design. The referenced tools do not establish biblical or theological conclusions.
