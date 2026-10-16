# Library Knowledge Initiative

**Updated 14 October 2026.** Turn the acquired library into connected, inspectable research data and prepared website resources. Connect a question to relevant source sections, explain their relationships, identify who asserts what, and lead the reader to the held text. Prepared outputs must work while the owner's PC is off.

The existing metadata and analytical pipeline is substantial groundwork. Completion of that processing does not establish completion of the connected research system. The [sufficiency review](REVIEW-2026-10-13.md) records the gap; the [design](DESIGN.md) defines the next implementation.

## Start here

| Document | Purpose |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Current system design: units, six processing systems, data contracts, dependencies, evaluation and delivery |
| [TODO.md](TODO.md) | Single execution backlog with completed work, actionable tasks and acceptance conditions |
| [HANDOFF.md](HANDOFF.md) | Full protocol for resuming, claiming work, recording results and handing over unfinished jobs |
| [NEW-CHAT-CONTEXT.md](NEW-CHAT-CONTEXT.md) · [historical KR-110 prompt](PROMPT-KR110.txt) | Updated delivery state, failed retrieval acceptance and all remaining tracks; no automatic next-stage authorization |
| [FUTURE-ADDITIONS-PROTOCOL.md](FUTURE-ADDITIONS-PROTOCOL.md) | Repeat processing for new/changed sources, dependency refresh, checkpoints, immutable releases, backup/restore and implementation gaps |
| [REVIEW-2026-10-13.md](REVIEW-2026-10-13.md) | Dated assessment of what exists, where it is shallow and what would count as deeper capability |
| [DECISIONS.md](DECISIONS.md) | Owner direction, established engineering decisions and choices still open |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Existing storage, vector/browser boundaries and offline delivery architecture |
| [EVIDENCE-CONTRACT.md](EVIDENCE-CONTRACT.md) | Attribution, locations, review, provenance, public use and invalidation |
| [PLAN.md](PLAN.md) | Broad opportunity portfolio and original visual delivery sequence |
| [PILOT.md](PILOT.md) | Earlier bounded public-pilot specification; its release gates remain applicable to that pilot |
| [BASELINE.md](BASELINE.md) | Historical 11 October setup observations; read the current review first |
| [HANDOFF-HISTORY.md](HANDOFF-HISTORY.md) | Preserved earlier pilot handoffs and receipts; historical “next” instructions are not current sequencing |

DESIGN.md and the current sections of TODO.md/HANDOFF.md govern the deeper analytical work. Existing source/evidence contracts and source-owner rules remain authoritative in their domains. The central backlog retains earlier LK IDs and adds KR IDs for connected research; the analytics package retains its LA IDs. Do not create another competing initiative or checklist.

## What is delivered

| Delivery | Measured result | Evidence |
| --- | --- | --- |
| Baseline warehouse | 868,686 overlapping observations, coverage/overlap tables and identity candidates | [Warehouse results](../../knowledge/library_analytics/RESULT.md) |
| LA-01 metadata refinement | 21,445 records with recovered metadata; 12,089 accepted field proposals; six contributor mappings | [Refinement results](../../knowledge/library_analytics/REFINEMENT-RESULT.md) |
| LA-02 CPU text processing | 214,449 corpus documents accounted for, including 39,179 analysed library documents; 10,205,959 literal reference records | [Text results](../../knowledge/library_analytics/TEXT-RESULT.md) |
| LA-03 analytical products | Full tracked lexical counts; 7,115,595 Scripture matrix rows; 6,506 contributor profiles; 32,195 bounded reuse candidates | [Products](../../knowledge/library_analytics/PRODUCTS-RESULT.md), [contracts](../../knowledge/library_analytics/PRODUCTS.md) |
| LA-04 source application | 3,751 reader edition IDs applied; six contributor entries covering 159 existing memberships; 8,338 corpus fields registered, pending owner incorporation | [Application result](../../knowledge/library_analytics/APPLICATION-RESULT.md) |
| KR-100/101 section backbone | 100,889 supported documents/entries; 1,161,753 section records; 1,469,536 spans; zero failed jobs; explicit adapter/semantic deferrals | [Section execution](../../knowledge/library_analytics/SECTIONS-RESULT.md), [operation](../../knowledge/library_analytics/SECTIONS.md) |
| KR-102 chunk/reader alignment | 18,893,464 chunk overlap pieces; 908,211 reader pieces; all 100,889 supported inputs accounted; 360 location witnesses passed | [Alignment results](../../knowledge/library_analytics/ALIGNMENT-RESULT.md), [operation](../../knowledge/library_analytics/ALIGNMENT.md) |
| Bounded evidence/retrieval work | Located captures, reproducible packages, source crosswalks and a small hybrid retrieval comparison | [Evidence pilot](EVIDENCE-PILOT.md), [retrieval comparison](RETRIEVAL-PILOT.md), [reproducible collections](REPRODUCIBLE-COLLECTIONS.md) |
| Ephesians source connections | 180 located samples and 54 chapter candidates; location work does not establish author endorsement | [Ephesians connections](EPHESIANS-CONNECTIONS.md) |

These populations overlap. Documents, reference entries, books, editions, source files and chunks are different units. Historical releases remain immutable. Source application changed reader metadata, so earlier analytical releases must be labelled by generation rather than presented as fresh whole-library results.

## What we are building

~~~mermaid
flowchart TD
    A[Held texts, catalogues and source datasets] --> B[Versioned identities and section locations]
    V[Existing vectors and FTS5] --> C[Concept and question discovery]
    B --> C
    B --> D[Citation, quotation and historical relationships]
    C --> E[Attributed claims and arguments]
    D --> E
    C --> F[Reusable evidence compiler]
    D --> F
    E --> F
    F --> G[Question and passage dossiers]
    F --> H[Author comparisons and research tables]
    F --> I[Compact search and recommendations]
    G --> J[Existing website: PC-independent outputs]
    H --> J
    I --> J
~~~

1. **Section and location backbone:** identify actual sermons, commentary entries, chapters and articles; connect their boundaries to chunks, source spans and reader destinations.
2. **Concept and question index:** discover discussions across terminology variants and languages, combining lexical/reference evidence with existing semantic vectors.
3. **Relationship mining:** connect sections through citations, candidate quotations, aligned reuse and semantic neighbors, preserving independent-work counts.
4. **Attributed arguments:** distinguish author statements, quoted speakers, premises, objections, replies and qualifications with supporting text.
5. **Historical and multilingual integration:** connect people, places, events, finds, date roles, original-language terminology and supported translation relationships.
6. **Offline evidence compiler:** produce versioned passage dossiers, question evidence sets, comparisons and compact exports from shared research records.

KR-100/101's section/span backbone and KR-102's chunk/reader alignment are complete for their selected supported snapshots. KR-110/120 now provide private CPU candidate indexes; argument, history/language, compiler and consumer delivery remain pending, and candidate usefulness is limited by their recorded evaluations. Exact data locations are separate from reader navigation: the current reader offers a containing-book route without a page selector. Python and SQL do routine processing. Selective model analysis may assist difficult interpretation within an explicit scope and cost budget; the batch architecture does not require a model call for every chunk.

## Questions that establish value

- Where do several independent works explain Romans 4, and where can I read the actual discussion?
- How do Gill, Owen and Aquinas define faith, works and justification, including quoted objections and replies?
- Which sermons give practical counsel on assurance or suffering without using the same modern keywords?
- Which passages are quotations or sustained textual parallels, and what remains uncertain about their source?
- How do a historical claim, its dated evidence, the relevant place and competing interpretations connect?
- Which Latin or Greek discussion corresponds to a held translation, and how well is that alignment supported?

These are evaluation targets. A larger term table, a successful script or a graph visualization does not answer them by itself.

## Next implementation

**KR-110 candidate index delivered; retrieval acceptance failed.** [KR-110 results](../../knowledge/library_analytics/CONCEPTS-RESULT.md) records the full supported population, constrained located queries and reserved baseline evaluation. Useful completion improved from 23/48 to 25/48 while precision at five fell from 38.75% to 34.17%; 13 questions are capability-deferred. This is model-assisted implementation-agent review, not human or independent review. Semantic coverage is zero. KR-120 was subsequently authorized and delivered as a CPU candidate index. [KR-120 results](../../knowledge/library_analytics/RELATIONSHIPS-RESULT.md) record the full supported run, weak wording precision, improved reserved co-citation recovery and unresolved reference/identity errors. Stop after KR-120; KR-130 requires a new task authorization.

After KR-110, the active sequence is KR-120 relationships and parallels, KR-130 attributed arguments, KR-140 history/languages, KR-150 evidence compilation, KR-160 existing-site integration and KR-170 end-to-end recovery/refresh verification. KR-120 and KR-140 can consume KR-102 independently; products need only their declared inputs. KR-090 intake/embedding and source-gap reconciliation remain a separate owner track. The [single backlog](TODO.md) records exact acceptance and dependencies, including subsequent topic, author, sermon, learning and discovery products.

**Continue in a new chat:** use [PROMPT-KR110.txt](PROMPT-KR110.txt), which loads the [complete saved context](NEW-CHAT-CONTEXT.md). **For future additions:** apply the [refresh/recovery protocol](FUTURE-ADDITIONS-PROTOCOL.md). Current code, facts and release files persist locally; same-generation resume is implemented. Automatic cross-generation selective refresh, verified off-device backup/restoration and the remaining KR processors still need implementation. The protocol makes those requirements part of each processor's acceptance, with integrated proof in KR-170.

**KR-100** captured the selected generation, ownership, fresh question/source-window splits and release targets. **KR-090** tracks the running source-owner completion work separately. The section processor uses the frozen LA-02/03 snapshot and preserves intake and vectors; full-current-library claims require their corresponding completion checks.

## Ownership and locations

| Location | Role |
| --- | --- |
| Website/initiatives/library-knowledge/ | This initiative's design, backlog, decisions and handoff |
| Website/knowledge/library_analytics/ | Existing resumable bulk analytics; preferred home for new bulk section/concept/relationship processors |
| Website/knowledge/evidence_collections/ | Existing capture, retrieval, evidence packaging and dependency tools |
| Website/knowledge/enrichment/ | Existing graph writer, relation contracts and graph quality gates |
| Website/knowledge/research_foundation/ | Historical/research identities, sources and citation contracts |
| KnowledgeBase/library-analytics/ | Existing private analytics databases and releases |
| KnowledgeBase/library-knowledge/ | Existing private evidence packages; connected-research/ holds section databases, evaluation inputs and releases |
| Website/content/ and existing UI/build owners | Approved source metadata, editorial selections and permitted delivery |

Preserve originals, credits, Catholic-material warnings, work/edition distinctions and existing vectors. Keep private analysis separate from public export. Reading destinations use held on-site texts where permitted; external links supply provenance. Josephus remains restricted to Scholars under current editorial rules. Only the existing preview at http://127.0.0.1:8931 is used for website review.

## Workstreams and related plans

| Workstream | Scope |
| --- | --- |
| [W1 Foundation](workstreams/foundation/README.md) | Identities, source sections, evidence and provenance |
| [W2 Scripture/topics](workstreams/scripture-topics/README.md) | Passage, concept, author and sermon connections |
| [W3 Editorial/learning](workstreams/editorial-learning/README.md) | Attributed comparisons, answers, lessons and reuse |
| [W4 Discovery](workstreams/search-discovery/README.md) | Offline semantic mining and compact discovery |
| [W5 Research](workstreams/research/README.md) | History, languages, quotations and source comparisons |
| [W6 Visual exploration](workstreams/visual-exploration/README.md) | Evidence tables and useful views of connected data |
| [W7 Delivery](workstreams/delivery/README.md) | Evaluation, incremental refresh and website delivery |

The [integration master plan](../../../Research/KNOWLEDGE-INTEGRATION-MASTER-PLAN.md), [analytical roadmap](../../knowledge/ANALYSIS.md), [graph plan](../../knowledge/GRAPH-PLAN.md) and [Study plan](../../../Pages/Study/PLAN.md) retain their respective source, graph and page ownership. Earlier [parallel preparation](parallel-preparation/README.md) is background preparation; read its [correction handoff](parallel-preparation/SESSION-CORRECTION-HANDOFF.md) before reusing that work. It does not substitute for the data systems specified here.
