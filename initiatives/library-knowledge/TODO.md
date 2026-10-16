# Initiative to-do

**Current backlog · 14 October 2026.** [Home](README.md) · [Design](DESIGN.md) · [Handoff protocol](HANDOFF.md) · [Sufficiency review](REVIEW-2026-10-13.md).

The active analytical direction is the KR connected-research sequence below. Earlier LK tasks remain the product/pilot backlog. LA tasks identify completed or pending analytics-package work. Keep one task ledger here; do not create a competing checklist. Independent read-only development can proceed on a named supported snapshot. Full-library vector/graph claims and public delivery retain their relevant source/parity/quality checks.

## Delivered analytics and current owner work

### Ordered continuation requested 15 October 2026

The owner requested phases 2–7 one at a time. This is the work order, not an executable FIFO queue. The existing analytics lease serializes workers but has no central waiter registry or guaranteed order. Future coding/evaluation stages require an active implementation session. No dispatcher, scheduler or worker was installed by recording this order.

| Order | Task | Entry / completion gate |
| --- | --- | --- |
| Existing owners | KR-130 delivery and refresh implementation | Preserve both owners and their current lease behavior. Require final verification, exports and handoffs, not only population counters. Collect completed KR-140 and recovery receipts for reconciliation. |
| 1 | Phase 2: foundation reconciliation | Refresh proofs delivered; integrate only completed workstreams. Verify selective refresh against clean rebuild, recovery and compatible generations. Do not edit another live chat's owned code. |
| 2 | Phase 3a: KR-110 retrieval remediation | Phase 2 passes. Freeze fresh development/reserved evaluation, implement supported-population corrections and report quality gates. Preserve historical failures. |
| 3 | Phase 3b: KR-120 CPU quality/reference remediation | KR-110 remediation handoff recorded. Correct supported duplicate/boilerplate/reference errors on coherent inputs; evaluate without retuning exposed reserved cases. |
| 4 | Phase 4: semantic retrieval and neighbors | Accepted prerequisites for each capability plus a consistent pinned vector/model/build snapshot and measured coverage. No new embedding owner or encoder. Missing dependencies block the relevant capability. |
| 5 | Phase 5: KR-150 evidence compilation | Consume only evaluated inputs needed by each product. Integrate/test KR-130/140 refresh adapters before using them. Failed attribution or other quality gates require remediation or explicit exclusion. |
| 6 | Phase 6: KR-160 local integration/release preparation | Relevant KR-150 products and source/public-use checks pass. Verify routes, attribution, device cost and PC-independent operation. No production deployment authorized by this queue. |
| 7 | Phase 7: KR-170 operational acceptance | Compatible integrated releases exist. Prove refresh, interruption/resume, rollback and dependency-closed isolated restore; update backup coverage. Off-device protection requires an actual independently recoverable destination. |

Advance after the prior handoff and the next item's prerequisites pass. On failure retain last-good releases and record the blocker; do not automatically run downstream stages. A scoped CPU-only KR-150 product may bypass unavailable semantics only with that missing capability explicit, without marking Phase 4 complete. Existing embedding/completion recovery remains separately owned and outside this order. Full task definitions and the entire KR/LK backlog below remain intact.

- [x] LA-01: Durable metadata refinement and correction proposals. [Results](../../knowledge/library_analytics/REFINEMENT-RESULT.md).
- [x] LA-02: Supported CPU text populations complete and independently verified. [Results](../../knowledge/library_analytics/TEXT-RESULT.md).
- [x] LA-03: Bulk descriptive products and private consumer tables complete for the selected snapshot. [Results](../../knowledge/library_analytics/PRODUCTS-RESULT.md).
- [x] LA-04 source application: 3,751 reader edition fields and six contributor entries applied; repeated run changes zero files. [Results](../../knowledge/library_analytics/APPLICATION-RESULT.md). This checkbox does not mark live corpus incorporation, reconciliation or UI delivery complete.
- [x] KR-000: Record the sufficiency review, full connected-research design, current backlog and cross-session handoff. Documentation only; subsequent KR-100/101 implementation is recorded below.
- [x] KR-100/101: Supported section/span backbone complete and verified: 100,889 documents/entries, 1,161,753 section records, 1,469,536 spans; zero failed jobs. [Execution and limitations](../../knowledge/library_analytics/SECTIONS-RESULT.md).
- [x] KR-102: Supported chunk/reader alignment complete and location-verified: 18,893,464 chunk pieces, 908,211 reader pieces, zero failed jobs; explicit unresolved states and containing-book navigation. [Execution and limitations](../../knowledge/library_analytics/ALIGNMENT-RESULT.md).
- [ ] KR-090: Existing owner incorporates 8,338 registered corpus fields and reconciles the 9,652 held-original gaps plus ten CSEL cases. Preserve documented archive moves and source distinctions; report actual incorporations, remaining linkage states, corpus build and vector-ID implications. Two Flavel proposals remain excluded until evidence resolves them. Do not start this owner pipeline as a side effect of KR-100/101.

  **Working, 13 October 2026:** The owner explicitly requested the remaining intake/embedding. One native `knowledge.finish_intake --refresh` pipeline passed archive/preparation checks and entered the staged build. Latest actual PID, child and phase are in `KnowledgeBase/intake-completion.json`; launcher receipt is `native-intake-launch.json`. New corpus totals, incorporation and final vector parity remain pending. Conflicting fill-only proposals preserve existing source identities and are deferred in `library-identity-conflicts.json` with no text import holds. Do not infer all 8,338 proposal fields were applied. Source/metadata/current analytical refresh checks remain after the build; no KR-100/101 processor was started by this launch.

## Active implementation: connected research

KR-100/101/102 and KR-110 modules now exist and their declared supported populations are complete. KR-110 retrieval acceptance remains failed. KR-120 CPU candidate delivery is complete; semantic neighbors and useful-population interpretation remain deferred. Later module names remain design responsibilities. Use the handoff protocol for working/partial/failed states and preserve selected historical releases when adopting newer inputs.

| Task | Status | Concrete implementation and acceptance | Depends on |
| --- | --- | --- | --- |
| KR-100 | Complete for selected setup — 13 October 2026 | Named LA-02/03 scope captured; 120 question intents frozen (72 development / 48 reserved), original-source evaluation splits and release targets recorded. KR-110 subsequently recorded model-assisted reserved relevance judgments; exhaustive gold spans, independent review and semantic evaluation remain unperformed. [Execution](../../knowledge/library_analytics/SECTIONS-RESULT.md). | Existing manifests and current owner boundaries |
| KR-101 | Population-complete for supported snapshot — 13 October 2026 | Native/recorded section/span tables and query implemented; 100,889 documents/entries, 1,161,753 records, 1,469,536 spans; all 39,192 jobs succeeded. 28 tests; 2,666 round-trip witnesses passed. 113,557 adapter deferrals, 2,367 representation-only cases and 3 archive exclusions remain explicit. [Execution](../../knowledge/library_analytics/SECTIONS-RESULT.md). | KR-100 |
| KR-102 | Population-complete and location-verified · 14 October | 100,889 supported documents/entries; 1,161,753 section statuses; 18,893,464 chunk overlap pieces; 908,211 reader pieces. Zero failed jobs; 360 population witnesses passed; 43 focused tests. Exact/approximate/partial/unresolved states and containing-book navigation remain distinct. Corpus/vector/graph/public writers preserved. [Results and remaining coverage](../../knowledge/library_analytics/ALIGNMENT-RESULT.md). | KR-101 |
| KR-110 | Delivered candidate index; retrieval gate failed · 14 October 2026 | [KR-110 results](../../knowledge/library_analytics/CONCEPTS-RESULT.md): generation `kr110-54f0bfca9b30da6cc49b2347`; all 100,889 supported documents, 7,920,214 windows, 12,456,231 concepts, 9,531,563 references. 42 tests and 2,818 source witnesses pass; actual resume/idempotence verified. Reserved model-assisted implementation-agent review: useful 25/48 versus baseline 23/48; P@5 34.17% versus 38.75%; 13 capability deferrals. No human/independent review; attribution precision unestablished. Candidate-only release; semantic coverage zero. Acceptance remediation remains unresolved. KR-120 CPU candidate delivery is recorded below. | Pinned KR-101/102; no semantic selection |
| KR-120 | Delivered CPU candidate index; semantic/interpretation deferred · 14 October 2026 | KR-120 CPU candidate delivery complete, 14 October 2026. [Results](../../knowledge/library_analytics/RELATIONSHIPS-RESULT.md) and [operator commands](../../knowledge/library_analytics/RELATIONSHIPS.md). All 100,889 supported documents/XML entries are accounted; 3,248,544 native/recorded windows yielded 19,414,258 wording postings and 4,360,894 reference postings. Joint indexing covers all 1,220,007 reference-bearing windows, with 9,160,913 postings and 11,437,451 paired evidence rows. Reserved substantive-overlap recall is 16/16; co-citation recovery is 9/16 versus 2/16 base-only (+7). Model-assisted implementation-agent review found 3/24 useful wording and 11/24 useful co-citation pairs; no human/independent review. Structural verification, actual base/joint resume, completed-run idempotence, indexed-query equivalence and immutable export verification passed. Thirty-six focused tests plus five shared-job compatibility tests pass. Candidate capability only: reprints, boilerplate, synthetic markers and inherited reference-mapping errors prevent population interpretation/attribution claims. Semantic processing is deferred; this processor selects no vectors. Cross-generation selective refresh and backup restoration remain unproved. Private output: `KnowledgeBase/library-knowledge/connected-research/relationships/`; selected release `kr120-release-79570e88c09eb13201a515ae` via `latest-relationships.json`. Full counts, 16 reproducible table exports, actual located/constrained queries, reviewer decisions and runtime/temporary-WAL costs are in the result and release receipts. Both population workers finished and released leases. No intake/embedding/graph/public/scheduler owner was started or replaced. Stop after this KR-120 handoff; KR-130 is the next roadmap stage and requires new authorization. | Pinned KR-101/102 and KR-110 located features; no vector dependency for these channels |
| KR-130 | Open | Implement argument_extract for attributed statements, quotations, objections, replies and qualifications. Selective model work records cost/method/review; fresh difficult cases establish attribution/scope quality before scale. | KR-101/102; KR-110/120 candidates where used |
| KR-140 | Open | Implement historical_links/language_alignment through existing research IDs and source annotations. Preserve date roles, numbering, translations and competing interpretations; execute passing adapters across supported strata. | KR-101/102 and relevant held source coverage |
| KR-150 | Open | Extend evidence_compiler/assembler to passage dossiers, question evidence sets, comparisons and recommendations. One research set feeds multiple projections; dependencies, exclusions, roles and destinations survive reproducible compilation. | KR-101/102 and whichever KR-110–140 inputs each product needs |
| KR-160 | Open | Evaluate and integrate permitted data with existing reader/Teachers/Study/search owners. Refresh current metadata snapshots; validate on-site destinations, author attribution, public fields, PC-independent operation and query/device cost. | Product-specific evaluated inputs; KR-090/current-source checks for a full-current-scope release |
| KR-170 | Open | Prove interrupted/resumed equivalence and selective descendant refresh after source/rule/review changes. Record compute/storage cost and retain last good release. Build these mechanisms within each processor; this final task verifies end-to-end operation. | Passing processor/compiler releases |

### Required continuing-operation work

[FUTURE-ADDITIONS-PROTOCOL.md](FUTURE-ADDITIONS-PROTOCOL.md) defines the acceptance contract for these existing tasks. Code and outputs persist locally; this does not establish automated new-source processing or verified backup. [NEW-CHAT-CONTEXT.md](NEW-CHAT-CONTEXT.md) and [PROMPT-KR110.txt](PROMPT-KR110.txt) transfer the full roadmap to the next session.

- [ ] KR-110–150: Each processor records scoped dependencies, atomic facts/checkpoints, idempotence, explicit deferrals and recovery; no postponed repeatability or silent version mixing.
- [ ] KR-170 / LK-501: Source delta classification and compatible refresh planning through existing owners; no universal new-files orchestration currently exists.
- [ ] KR-170 / LK-501: General reverse dependencies and verified cross-generation fact reuse; new/changed/moved/removed source cases update affected current results without mutating history.
- [ ] KR-110/120 / KR-170: New sources and vector coverage revalidate affected old rankings/neighbors and population-dependent statistics, rather than only append new rows.
- [ ] KR-150/160 / LK-501: Compatible stage manifests, atomic promotion, last-good retention and tested rollback; stale interpretations/reviews require affected upstream reconciliation.
- [ ] KR-170 / LK-501: Protect required code including presently untracked files, create a consistent off-device dependency-closed backup through the appropriate owner, and prove isolated restoration. No such backup/restore was verified here.
- [ ] KR-170 / LK-502–504: Prove unchanged rerun, crash/resume equivalence, source-change selectivity and restoration; record compute/storage costs and actual delivered usefulness. Native scheduled recovery remains its separate owner task and is not enabled by these docs.

## Existing product backlog and bounded history

LK-101 through LK-107 and LK-201–202 remain completed for their bounded scope. Older “next” labels below describe historical order; current completion is through the KR-120 CPU candidate stage; later execution requires authorization. LK-203/204/205 and later products consume the deeper systems where required. Existing evaluated snapshots and exclusions remain intact. Earlier [parallel preparation](parallel-preparation/README.md) is background material; its correction handoff explains the previous drift toward proposals.

## D0 — planning

- [x] LK-001: Establish the initiative folder, visual plan and seven workstream READMEs.
- [x] LK-002: Record observed baseline, evidence contract, pilot, decisions and ownership boundaries.
- [x] LK-003: Link the initiative from project and website READMEs, global backlog, handoff and integration master plan.

## D1 — foundation

- [x] LK-101: Inspect current coordinator, intake, embedding and graph states; record which snapshot can support a bounded pilot. [Handoff check](HANDOFF-CHECK.md): current corpus is suitable only as an explicitly bounded partial snapshot; late acquisitions and final graph remain pending. Refreshed the full preparation plan and verified archived moves without rebuilding the corpus.
- [x] LK-102: Resolve the graph monitor's documented permission failure through its existing owner/pipeline; confirm current quality-policy restrictions. [Recovery record](GRAPH-RECOVERY.md): bounded status-access retries, stricter gates, one graph-only monitor, 40 tests/68 subtests passed. Final extraction remains gated; 12 reviewed topic rules eligible, body citations/entities deferred.
- [x] LK-103: Implement the evidence-collection schema using existing identifiers. [Real pilot](EVIDENCE-PILOT.md): shared research-citation contract extended; two private collections/three source passages cover direct statements, an opposing position and uncertain page locations. 27 tests pass; two work/edition identities and three reader targets remain explicitly unresolved for LK-104. No graph IDs invented and no public export.
- [x] LK-104: Build source/body/edition/reader crosswalk and work-level duplicate handling for pilot inputs. [Verified crosswalk](IDENTITY-CROSSWALK.md): all 3 source/resource bindings verified, 1 canonical chain resolved, 2 explicitly deferred; 3 exact-edition reading destinations deferred. Separate TCP Flavel edition verified across 7 preview pages, with a reviewed work relationship preserving editions. 46 tests pass; immutable evidence and running pipelines preserved.
- [x] LK-105: Define public-export eligibility separately from private analytical inclusion. [Use decisions](PUBLIC-USE-ELIGIBILITY.md): 4 sources, 20 scoped decisions (11 allowed / 9 conditional); private analysis allowed for all 4; metadata-only preview verified without private bodies/claims/paths. 66 tests pass. CCEL republication remains conditional, TCP transcription reuse allowed under CC0; identity/reader/output-review gates remain separate. No public output or pipeline changes.
- [x] LK-106: Implement bounded retrieval combining FTS5, existing vectors and recorded references; deduplicate, expand context and rank candidates. [Measured comparison](RETRIEVAL-PILOT.md): 3,896 passages / 3,688 existing vectors; hybrid useful top-five results for 17/20 questions versus 12/20 keyword-only, with AI-assisted pooled judgments. 78 tests pass. The proposed 18/20 release gate is not met; three retrieval misses, 208 missing vectors and limited reference coverage remain explicit. Private snapshot/results only; existing pipelines preserved.
- [x] LK-107: Build reproducible evidence collections with dependency hashes and invalidation. [Verified assembly](REPRODUCIBLE-COLLECTIONS.md): 2 packages preserve 3 reviewed passages and 4 historical retrieval diagnostics; 48 unique dependencies. Independent builds are byte-identical and unchanged reruns write nothing. A changed disposable Boyce source invalidates only its dependent collection. 98 tests pass; 32 upstream artifacts unchanged. Stale releases require explicit reconciliation and a new private directory; no automatic review or publication. Next: LK-201.

## D2 — connected library

- [x] LK-201: Select a pilot Bible book after a cheap coverage check. [Ephesians selected](BOOK-SELECTION.md): bounded 12-document comparison with Romans and Hebrews; four Ephesians works / three authors cover all six chapters structurally, with two on-site texts. Six chapter samples match corpus and served reader data. Verified 12 original hashes and four local reader packages. Verse-level review, 40 Fergusson transcription gaps, missing recorded references and public-use gates remain explicit. Next: LK-202.
- [x] LK-202: Prepare chapter/section passage connections, distinguishing citation, main text, topical match and reviewed exposition. [Ephesians connections](EPHESIANS-CONNECTIONS.md): 6 reproducible private packages, 180 located samples across 155 verse IDs (154 with on-site samples), 54 chapter candidates and 1 quarantined numbering conflict. Exact selectors, offsets, neighboring context, translators and gap counts preserved; source-location review is separate from doctrinal approval. 110 tests pass; no reference-index, vector or public writes. New source crosswalk/use reviews remain pending. Next: LK-203.
- [ ] LK-203: Prepare 25 proposed topic collections with narrower questions, aliases and diverse relevant independent works.
- [ ] LK-204: Enrich existing acquired author/scholar shelves with useful themes and held-text destinations; preserve section order and avoid duplicate announcement banners.
- [ ] LK-205: Prepare sermon links with verified speaker, reference and segment locations; use timestamps only where available.

## D3 — pilot publication

- [ ] LK-301: Curate 100 proposed reader questions; reserve 20 for retrieval evaluation before tuning.
- [ ] LK-302: Produce reviewed answers/comparisons from evidence collections, retaining attribution and qualifications.
- [ ] LK-303: Build a compact browser index of public collection descriptions with the browser model; preserve the existing pack until quality is measured.
- [ ] LK-304: Integrate reader, topic and author destinations through existing routes, with accessible tables and source links.
- [ ] LK-305: Validate source accuracy, routing, public eligibility, mobile cost and usefulness against [pilot gates](PILOT.md).
- [ ] LK-306: Prepare a versioned pilot release and rollback; publish only under the applicable release authorization, then verify production and PC-independent operation.

## D4/D5 — expanded products

- [ ] LK-401: Build courses, lessons, printable materials and practical-life guides reusing reviewed evidence.
- [ ] LK-402: Produce editorial packets and a manageable publication queue; protect canonical answers from diverging copies.
- [ ] LK-403: Add careful attributed doctrinal comparisons, including the owner's Catholic-material presentation requirements.
- [ ] LK-404: Prepare church-history, archaeology and place/period dossiers with supported dates and competing interpretations.
- [ ] LK-405: Pilot multilingual term packs, original-language tools, translation alignments and fathers' reading aids.
- [ ] LK-406: Detect quotations/parallels and separately review proposed dependence or influence.
- [ ] LK-407: Build useful timeline, atlas, argument and topic views from validated tabular evidence.
- [ ] LK-408: Explore optional subject packs, device-local reading paths and permitted research exports after measured demand.

## D6 — continuing operation

- [ ] LK-501: Implement source-hash dependency refresh, atomic publication and rollback.
- [ ] LK-502: Maintain quality evaluation by genre/language, duplicate rates and distinct-work coverage.
- [ ] LK-503: Feed extraction and subject gaps into the existing acquisition backlog, without launching duplicate collectors.
- [ ] LK-504: Report delivered products, unresolved counts, compute cost and real reader benefit for each expansion.

Do not create per-file check suites or repetitive paperwork. Use reusable automated checks and focused content review where the outcome warrants it.
