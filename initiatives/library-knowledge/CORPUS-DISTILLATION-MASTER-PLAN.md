# Corpus distillation and candidate quality master plan

18 October 2026. Planning and baseline inspection are authorized and underway. Pipeline implementation, corpus remediation and candidate approval have not started under this plan.

The goal is to turn the held library into a smaller, clearer body of useful, attributable evidence and website proposals. Success means that an owner can understand a candidate, inspect its strongest sources and limitations, and decide whether it improves a real reading task. More embeddings, clusters, extracted statements or candidate cards are processing outputs, not the outcome.

Start by improving the existing [Candidates queue](http://127.0.0.1:8931/data_analysis/candidates/). Reuse its durable decisions and the existing source, retrieval and evidence tools. Add quality findings as reversible annotations; preserve original texts, previous transcriptions, valid vectors and historical evaluations. Embeddings help find and compare passages. Source inspection establishes what a passage actually says; further historical, theological or editorial assessment determines what we may responsibly say about it.

Preserve the owner's 16 October holdings-first direction: begin text-readiness work with A. A. Hodge's *Outlines of Theology*. The existing `supper` candidate provides a concrete test. Establish the held original, usable extraction/OCR, work/edition identity and reader separately before expanding analysis; this plan does not turn that unfinished readiness review into an assumed pass.

This is the next design layer within the [Library Knowledge Initiative](README.md), extending the [evidence contract](EVIDENCE-CONTRACT.md) and existing KR-110/120/140 and LK evidence work. The [single execution backlog](TODO.md) remains authoritative for task status. [Pilot protocol](distillation/PILOT-PROTOCOL.md) expands the first experiment; [planning baseline](distillation/baseline-2026-10-18.json) records inspected inputs and hashes.

## 1 Current position and the first gate

The following are dated observations, not a new claim of a frozen, current corpus release. The baseline was captured on 18 October at about 10:24 PM EDT. The parity receipt was written at 8:19 PM EDT.

| Observation | What it permits | What it does not establish |
| --- | --- | --- |
| Verified snapshot has 11,579,535 chunks and 11,579,535 matching vector IDs; zero missing, stale or duplicate vectors; SQLite integrity is `ok` | Treat that specific embedding pass as completed | Accurate extraction, good scholarship, correct attribution or readiness of later additions |
| The same receipt says `enrichment_ready:false`, with 13 new source files, 2 changed source inputs, 29 new library files and 1 changed library ledger | Identify outstanding source reconciliation as a prerequisite | Add these different counters together as a total of missing documents |
| Completion supervisor is in `verification_only` mode and reports a protected build | Preserve the existing completion owner while planning | Launch another corpus builder, vector writer or bulk semantic job |
| Candidates HTML returns HTTP 200 on the original 8931 preview | Inspect the existing local workflow | Infer that the candidate evidence has been upgraded by the completed embeddings |
| Saved curation export has 21 pending proposals, no approved or integrated items, event sequence 41; opening batch size is 6 | Use those proposals as the initial improvement set | Treat an export as a fresh authoritative database audit or manufacture owner decisions |
| Candidate sources remain pinned to historical KR generations | Reproduce their original evidence and assessments | Silently reinterpret old window IDs or transfer approvals to a new corpus generation |

Before a semantic pilot, obtain a stable manifest through the current source/completion owner: corpus build and exact IDs; model/revision/dimensions; immutable Lance version and index readiness; selected analytics generations; source and extraction hashes; identity crosswalk version; and curation proposal fingerprints. Retain the fragment/index files behind the pinned Lance version and demonstrate a read of that version; a version number alone does not survive cleanup of its dependencies. The old verified snapshot may support a deliberately bounded experiment only if its source dependencies remain available and unchanged. Otherwise wait for reconciliation. The planning baseline is a set of individually read files, not a dependency-closed snapshot.

## 2 What counts as distilled information

Distillation produces evidence packets that retain enough context to check their conclusions. The reusable unit is an answerable reader question with located sources, attributed explanations, limitations and a proposed use. It can serve several destinations without creating independent, drifting copies of the research.

| Unit | Example of useful output | Essential distinction |
| --- | --- | --- |
| Source region | A corrected, located paragraph with its scan and transcription history | Correct text versus a correct claim |
| Reading connection | A passage that substantially discusses Ephesians 4, with a verified reader target | Exposition versus a passing Bible citation |
| Source comparison | Two named works discussing the same question, each with context and differences | Shared subject versus agreement |
| Quotation trail | Named quotation, located witness, edition relation and unresolved direction | Textual resemblance versus demonstrated dependence |
| Language note | Exact lexical entry, language, numbering and scope | A dictionary gloss versus proof of a theological conclusion |
| Editorial candidate | Clear proposed explanation, visitor benefit, existing destination, strongest evidence and blockers | A plausible proposal versus owner approval or completed integration |

Candidate-level attributed notes are in scope for this design. The rejected and deleted [KR-130 argument extraction](KR130-RETIRED.md) stays retired. This plan does not resume its code, releases, argument graph or population-wide extraction. Historical diagrams that still name KR-130 are not current authorization.

## 3 Preserve the working foundations

| Foundation | Reuse | Extension needed |
| --- | --- | --- |
| `knowledge/library_analytics/quality.py` and existing text products | Character, script and repetition measures | Recalibrate on current inputs; add source-confirmed defect classes |
| `section_catalog.py`, `section_alignment.py` and selected KR-101/102 outputs | Section identities, spans, context and reader bindings | Explicit mapping to the chosen new corpus; unresolved mappings stay unresolved |
| `knowledge/retrieval.py` | BM25, semantic and explicit-reference channels; reciprocal-rank fusion | Work/author/quality constraints and measured independence/diversity handling |
| `knowledge/evidence_collections/retrieve.py` | Bounded hybrid pilot, pinned inputs, context expansion and work buckets | A measured scaling path; its small selected scope is not whole-library retrieval |
| `knowledge/evidence_collections/` capture, crosswalk, eligibility and assembly tools | Literal evidence, identity, use conditions and dependency invalidation | New evidence/quality fields through a compatible adapter |
| KR-110/120/140 indexes and saved evaluations | Searchable historical populations and known failures | Semantic enrichment as a separately versioned experiment |
| `candidate_review.py`, `analysis-desk/` and existing local middleware | Proposal revisions, immutable history, idempotent requests, owner decisions and integration receipts | Add evidence dossiers and repair links without a second decision ledger |
| Existing native OCR audit and completion scripts | Source/derived representation workflow | Bounded repair proposals, source checks and selective refresh |

The initial shortlist is an editorial selection from 43 saved positive cases plus the Ephesians packages, not a search over all completed vectors. Existing discovery is bounded CPU/source lookup, adding at most four drafts per request. Completing embeddings does not retroactively improve either mechanism.

## 4 Quality has separate dimensions

Store each assessment with scope, evidence, method/version, reviewer type and uncertainty. Use statuses such as checked, suspected, unresolved and not applicable. Do not collapse everything into a scalar truth score or label cosine distance as confidence.

| Dimension | Questions to answer | Candidate consequence |
| --- | --- | --- |
| Extraction fidelity | Are text, reading order, page coverage and characters faithful to the source? | Repair or choose a verified alternate representation |
| Identity and provenance | Which work, edition, asset, author, editor and translator is this? | Narrow attribution or hold it when the required identity is unresolved |
| Exact location and context | Can we reproduce the span, boundaries and surrounding qualification? | Block unsupported explanation; distinguish containing-book links from exact navigation |
| Speaker and rhetorical role | Is this the author, an opponent being quoted, a concession, a preface or an editorial note? | Attribute correctly or abstain |
| Relevance and usefulness | Does this address the actual reader question, and add something to the website? | Prioritize, narrow or reject the proposal on its merits |
| Independence and reuse | Are these genuinely different works, reprints, translations, quotations or shared apparatus? | Collapse repeated witnesses; report unknown independence explicitly |
| Claim and source suitability | What does the source support, for which purpose, with what limitations or conflicting evidence? | Preserve source position; qualify the site's own conclusion |
| Allowed use and delivery | Which text, metadata, excerpts and derivatives may appear where? Is a usable reading destination available? | Separate private research from public export |
| Review maturity and freshness | Who assessed it, against which inputs, and what changed? | Keep model judgment, independent review and owner decision distinguishable |

Missing original text, changed source hashes, invalid spans and unsupported named-author attribution are hard blockers for the affected use. Possible noise, unusual vocabulary and semantic isolation are review priorities. A high relevance score cannot compensate for a broken source location. A noisy page need not disqualify the entire book.

## 5 Known failures become regression cases

Earlier tests contain concrete errors. Reuse them as diagnostic cases, not fresh hidden tests or current population estimates.

| Retained result | Lesson for the new experiment |
| --- | --- |
| LK-106 hybrid retrieval found useful top-five material for 17/20 reserved questions versus 12/20 lexical; proposed 18/20 gate failed | Keep a lexical baseline and test the marginal benefit of semantics |
| KR-110 found useful material for 25/48 questions versus 23/48 baseline; precision at five fell from 38.75% to 34.17%; semantic coverage was zero | Count useful independent evidence and inspect rank quality, not only completed questions |
| KR-120 reviewed wording usefulness was 3/24 and co-citation 11/24 | Repetition and common references are discovery leads, not verified relationships |
| Older LA text analysis flagged 2,580 documents, predominantly repetition | Reuse the measurements, but do not call the flags verified poor OCR or extrapolate to current holdings |

Required regression cases include publisher boilerplate; generated gap/duplicate-page markers; front matter mistaken for exposition; quoted opponents treated as the author's view; anthology/editor confusion; the same work appearing in several editions; shared Bible quotations mistaken for independent corroboration; concept-sense confusion; and the inherited numbered-book/verse parsing error. Check references against source context: a valid hash does not prove correct canonical interpretation.

Sources: [retrieval pilot](RETRIEVAL-PILOT.md), [concept results](../../knowledge/library_analytics/CONCEPTS-RESULT.md), [relationship results](../../knowledge/library_analytics/RELATIONSHIPS-RESULT.md), [text results](../../knowledge/library_analytics/TEXT-RESULT.md). These historical samples were implementation-agent/model assisted, not independently reviewed whole-population measurements.

## 6 Find and repair unreliable text

Use several cheap signals before selective semantic inspection. Record page/region-level findings and their document context.

1. Reuse existing character/script/repetition metrics and scan metadata. Add missing-page, duplicate-page, page-order, clipping, column-interleaving, footnote-interleaving and abrupt-boundary checks where the source format supports them.
2. Identify navigation, repeated headers/footers, tables of contents, indexes, publisher notices, synthetic gap markers and project-generated commentary. Assign content types. Indexes and apparatus remain available for the tasks they serve; exclude them only from unsuitable prose retrieval views.
3. Compare suspicious text with native XML, page images or another transcription. Check whether different editions really represent the same text before alignment.
4. Prepare a proposed corrected representation with an exact diff, source witness, reviewer and reason. Keep raw OCR and original assets immutable. Never silently rewrite a quotation from a model's preferred wording.
5. Check corrected names, numbers, negation, verse references, Greek/Hebrew diacritics and layout in the source. Preserve historical spelling, long-s and substantive variants. A modern dictionary mismatch is not evidence of corruption.
6. Measure improvement on the inspected regions before promoting the derived text. Character/word error rates require a genuine source-aligned reference transcription; without one, report a heuristic flag rather than an error percentage. [OCR-D evaluation guidance](https://ocr-d.de/en/spec/ocrd_eval.html) distinguishes recognition, reading-order and layout assessment.

Existing `scripts/audit-library-ocr.py`, `complete-library-ocr.py` and `report-library-ocr.py` are the starting points. Recent source repairs already demonstrate why page-level scope matters: reviewed pages can improve while other pages in the same document remain noisy. Do not revive the old PowerShell OCR launcher.

## 7 Use embedding oddities as inspection leads

The embeddings represent the supplied text; OCR faults, repeated apparatus and inserted labels can affect neighbors. No individual coordinate is a readable diagnosis of a defect. The following are experiments to validate, not automatic deletion rules.

| Experiment | Signal | Alternative explanation to protect | Independent check |
| --- | --- | --- | --- |
| Unusual local neighbors | Distant or surprising nearby passages | Rare topic, specialist vocabulary, different language | Source text, metadata and language-specific controls |
| Document discontinuity | Adjacent sections suddenly change subject or language | Legitimate quotation, anthology boundary, bilingual edition | Section headings, page sequence and source image |
| Generic neighbor hubs | One passage matches many unrelated questions | Useful definition or shared Scripture | Boilerplate typing, citation alignment and distinct-work inspection |
| Dense duplicate neighborhood | Many nearly identical passages | Reprints, translations, authorized quotation | Byte/token fingerprints, span alignment and edition relationships |
| Weak or missing semantic match | Lexical hit has poor vector retrieval | Names, citations, unusual script or an embedding limitation | Exact reference and lexical channels |
| Vector integrity anomaly | Wrong shape, nonfinite values or unexpected normalization | Storage/model mismatch | Versioned numerical validation, not editorial inference |

Sample these signals by language, period, format and length. A rare Greek entry must not be compared only with modern English sermons. Nearest-neighbor distances depend on the model and population; calibrate within task and stratum. The current encoder explicitly rejects over-token passages rather than silently truncating them; do not invent silent truncation as an established defect. Context can still be lost through source segmentation or chunk boundaries.

## 8 Deduplicate evidence without erasing witnesses

Keep distinct identities for original work, edition, asset, representation, section and passage. Start with existing byte hashes, normalized token digests and bounded reuse signatures. Verify possible semantic duplicates with literal alignment and bibliographic evidence. Record the relationship and representative-selection reason rather than merging source records automatically.

Distinguish exact duplicate files, repeated pages, alternate transcriptions, editions/translations, quotations, common biblical text and independent discussions. Shared biblical wording should be a separate signal from an author's surrounding exposition. An unresolved work identity contributes unknown independence, not another supporting witness. Citation chains and reprints are not independent corroboration; similarity and chronology alone do not establish influence.

Prefer the best verified representation for a declared task while retaining alternates for research and repair. A cleaner reprint cannot silently replace a materially different earlier edition. Candidate diversity should be reported as verified works/source families and perspectives, not raw result counts. Preserve useful disagreement and minority positions without inventing artificial balance where the held evidence is one-sided.

## 9 Retrieve better evidence before generating prose

Run complementary channels: exact Scripture/reference lookup; lexical and phrase retrieval; semantic retrieval; and work/author/edition-constrained lookup. Fuse candidates, group duplicate witnesses, expand source context and inspect the best evidence before drafting an explanation. Retrieve surrounding material through existing section and span tools; do not treat chunk ends as argument ends.

The current global vector schema filters `kind`, `edition`, `language` and `book`; it does not supply reliable author/work/quality constraints. Fetching a tiny unrestricted top-k and discarding wrong authors afterward is not a substitute for constrained retrieval. Compare designs on the pilot: selected passage-ID membership, sidecar eligibility/work mappings, bounded overfetch, scalar/pre-filter support or an explicitly versioned projection. Choose only after measuring recall, latency, memory and index cost on the installed library version.

Compare lexical-only, existing concept/reference search, vector-only, the unchanged current hybrid retriever, hybrid with quality views/diversity, and optional reranking. The current hybrid baseline is mandatory on the same eligible scope: beating keywords alone is insufficient if an added quality stage makes existing hybrid retrieval worse. Include each component only if its added benefit exceeds its cost. Keep lexical retrieval as a serious baseline: [BEIR](https://arxiv.org/abs/2104.08663) found substantial variation across retrieval tasks, with a robust BM25 baseline and costly reranking tradeoffs. That external benchmark motivates local evaluation; it does not predict this library's scores.

For author positions, ask for the source's own words and preceding/following qualification. For a possible contradiction, first verify speaker, sense, date, referent, edition and scope. For an absent answer, record what was searched and the declared scope; an unsuccessful search does not prove that an author never addressed the topic. Treat retrieved text as evidence, never as instructions to a model or tool. Separate project-generated summaries from primary-source text to prevent circular support.

## 10 Candidate evidence dossier

Extend the existing evidence contract and curation proposals rather than creating a second approval database. Proposed logical groups are below; exact storage/API migration is a later implementation decision.

| Group | Required content |
| --- | --- |
| Reader task | Exact question, audience, destination, intended format, existing-site comparison and expected benefit |
| Source identity | Work/edition/asset IDs, source URL, author/editor/translator/speaker roles, language, dates by role and unresolved conflicts |
| Literal evidence | Source span and text hash, section and chunk mapping, neighboring context, exact available locator, reading route and its actual resolution level |
| Discovery record | Query/seed, retrieval channels/ranks/distances, scope, filters, model/Lance/analytics generations, exclusions and search limits |
| Quality findings | Extraction and contamination flags; source-image check; context sufficiency; identity/attribution checks; uncertainty and method versions |
| Dependence and alternatives | Work families, representative selection, alternate witnesses, supporting/contrary passages and explicitly unsearched gaps |
| Proposed explanation | Attributed finding, qualification, visitor benefit and a clear distinction between quotation, paraphrase and editorial inference |
| Editorial controls | Source-use conditions, required reviewer type, blockers, repair tasks, owner decision fingerprint and revision differences |
| Delivery | Integration work order, actual site path, changed-file/browser evidence and separate publication status |

Every lineage must be traceable: original hash → representation/version → work/edition/asset → source section/span → corpus passage → retrieval run → evidence packet → candidate fingerprint → owner decision → integration receipt. Missing mappings remain explicit. Metadata-only changes may still change today's chunk IDs because titles and locators contribute to identity; assess actual embedding-input and identity consequences before promising vector reuse.

New evidence can strengthen, narrow, split or invalidate a candidate. It should never quietly overwrite the previous proposal. A prior approval remains in history, and an affected substantive revision returns through the existing review rules. Ranking-only diagnostics do not imply owner approval, integration or public clearance.

## 11 Improvements to the existing candidates experience

Retain the six-item review batch, current states, owner notes, revision checks, source marks and separate integration evidence. Plan an additive evidence summary that answers: why was this found; what is checked; what is unresolved; which distinct sources matter; what does this add; and what is the next useful action?

Proposed additions are a source/context comparison panel; optional scan/alternate-transcription view; visible blockers; duplicate-family collapse; work/language/source-type filters; differences since the previous proposal; explicit missing-evidence/contrary-evidence notes; and links to a separate repair queue. Keep raw cosine scores and technical generation details in an expandable disclosure. Show a readable reason such as “publisher preface, author attribution unresolved,” not an unexplained quality percentage.

Preserve the distinction between text repair and editorial merit. A valuable idea with damaged supporting text belongs in “needs text repair,” rather than being passed as an uninteresting idea. A clear passage with poor attribution belongs in “needs attribution review.” These can initially be reason-coded annotations on existing states, avoiding an unnecessary state-machine rewrite.

AI may suggest relevance, a shorter explanation or a next search. It may not enter owner approvals, erase contrary evidence, equate a source statement with fact, or automatically publish. Updating source quality must not manufacture a successful historical evaluation. Do not attach the new full-corpus vectors directly to old hardcoded KR pins; design and verify a generation adapter first.

## 12 The bounded pilot

The [pilot protocol](distillation/PILOT-PROTOCOL.md) defines the first experiment in detail. The proposed design is:

- Desk-audit all 21 existing candidates. Select six varied proposals for shadow enrichment; keep the live queue untouched.
- Inspect 240 documents: 120 probability-sampled, 80 selected for suspected problems, and 40 protected difficult cases. These groups answer different questions and must not be pooled into a corpus-prevalence estimate.
- Inspect at least three distributed regions per selected document, or all available text when fewer than three distinct regions exist, plus targeted source-image checks. Document-level conclusions retain the inspected scope; a few clean pages do not clear an entire book.
- Prepare 120 new reader tasks: 60 development and 60 held-out, grouped by work/source family to reduce edition leakage. Each split proposes 50 answerable and 10 negative/insufficient-evidence tasks with separately scored abstention. Retain old reserved sets only as known regressions.
- Compare retrieval channels on the same tasks and frozen scope, with judged exact locations, relevance, context, attribution, distinct works and abstention. Blindly judge a capped pooled union of final and displaced/filtered evidence; preserve unjudged states instead of treating them as irrelevant.
- Produce six before/after dossiers and at most twelve additional discovery drafts in a private shadow batch. Do not flood the owner queue.

Before selecting the sample, agree the finite eligible frame and its source/language/format coverage. A corpus document record may be a lexicon entry, derived page or representation, not an independent book. Define record and work/asset-cluster sampling explicitly, deduplicate sample membership and account for cluster selection when estimating uncertainty; otherwise report document-record prevalence only. Unknown identity is a sampling stratum, not a reason to drop difficult sources. Publish denominators, selection probabilities and exclusions. Use probability weights only where they are defined. Model-assisted labels and independent source review have separate fields; inability to obtain competent review for a language limits the claim and release scope.

## 13 Proposed acceptance criteria

These are proposed pilot decision rules to freeze before tuning, not achieved performance or universal guarantees. Investigate the baseline first; make any necessary amendments before revealing the held-out results.

| Area | Proposed decision rule |
| --- | --- |
| Source integrity | Every promoted dossier's cited span resolves to the exact recorded source/version; no unresolved critical attribution or fabricated locator |
| Retrieval usefulness | On the proposed 50 answerable held-out tasks, target useful top-five evidence for at least 43. Freeze a ceiling-aware paired gain rule against lexical and the unchanged hybrid baseline after development and before held-out runs; report paired outcomes and uncertainty |
| Negative tasks | On the proposed 10 negative/insufficient-evidence tasks, separately report correct abstention, fabricated answers and unsupported attribution. No known critical unsupported assertion may enter a promoted dossier |
| Ranking | Report precision at five and distinct-work/context scores; do not accept a completion gain that hides a material precision regression |
| Attribution | Zero known critical speaker/endorsement reversals in the six promoted pilot dossiers; report all errors/abstentions in the wider judged set |
| OCR triage | For a high-priority repair flag, target at least 85% confirmed actionable findings on its reviewed sample; report interval and counts, and measure misses in randomly selected unflagged controls |
| Protection against suppression | No silent deletion or automatic rare-language exclusion; report useful material lost by each filter, per stratum, and abstain where calibration is inadequate |
| Candidate benefit | Blind comparison of old/new dossiers on source fidelity, clarity, distinct evidence, missing checks and reviewer time; every claimed improvement names the changed evidence |
| Operations | Declared budgets respected; same-input rerun is stable; interruption/replay and changed-input invalidation tested in disposable stores; last-good release remains usable |

These thresholds concern bounded candidate enrichment only. They do not reopen the failed KR-110 acceptance gate or promote any historical accepted-retrieval pointer. Sixty tasks cannot establish whole-library accuracy or safety for every language. Report confidence intervals at the appropriate work/query level, the number of eligible tasks, and capability-deferred cases. Adjudicate disputed labels without silently redefining relevance. A method that helps only a narrow source/language subset may ship only for that declared subset.

## 14 Delivery phases and stop conditions

| Phase | Deliverable | Exit condition | Stop or revise when |
| --- | --- | --- | --- |
| Planning baseline | This plan, captured receipts, existing-system map and expanded pilot | Clear scope, known failures and no competing approval authority | Inputs/gates are being confused or a retired system is being revived |
| Stable source and generation handoff | Frozen manifest, usable index, source-to-analytics mapping and candidate fingerprints | Current owner releases a coherent snapshot or a bounded unchanged scope is proven | A build owns the corpus, dependencies changed or mappings are guessed |
| Audit and labels | Candidate gap review, 240-document sample and fresh task/label protocol | Reproducible selection and source-checked labels with reviewer types | Sampling frame/rights/language competence cannot support the intended claim |
| Retrieval shadow experiment | Matched baselines, channel ablations and cost report | Local acceptance criteria pass for a declared scope | Semantic/reranking gains disappear, false exclusions rise or budget is exceeded |
| Dossier pilot | Six stronger source-grounded proposals and explicit holds | Source/identity checks and visible before/after benefit | Fluent summaries conceal weak evidence or contradict the source |
| Selective remediation | Small source-approved repair batch with diffs and dependent refresh | Source improvement and exact changed-output impact demonstrated | Names/variants drift, unaffected outputs change or rollback fails |
| Controlled expansion | Bounded annotation/discovery batches using the passing method | Review capacity and quality remain stable | Backlog grows without useful decisions, costs rise or unsupported languages enter |
| Local integration and later release | Owner-selected improvements through existing site routes | Real reader tasks improve and existing editorial/public-use gates pass | Duplicate/low-benefit features, broken reading destinations or missing use clearance |

Planning and read-only baseline capture are the only phases executed in this session. Later phases are sequenced design, not hidden jobs. The current queued source reconciliation continues under its existing owner. No graph expansion is a prerequisite for the first candidate pilot; graph/cluster visualizations must earn their role after evidence quality is measured.

## 15 Compute and operational limits

The completed snapshot's 11,579,535 vectors at 2,560 float32 dimensions contain approximately 118.57 GB of raw values before IDs, metadata and indexes. Whole-corpus all-pairs comparison would involve about 67 trillion pairs. Do not copy the complete matrix into a notebook or start exhaustive pair mining.

Start with existing quality tables and fingerprints, then bounded representative nearest-neighbor queries and source reconstruction for retained IDs. Cache query embeddings and evidence by exact input/method fingerprint. Use a fixed neighbor/output cap and deduplicate candidate pairs before verification. Benchmark approximate-neighbor recall against exact search only on bounded representative scopes initially. The [LanceDB Python reference](https://lancedb.github.io/lancedb/python/python/) describes exact-scan and refinement options; inspect the installed older API and existing index before selecting syntax or parameters.

Initial experiment budgets are ceilings, not runtime estimates: a 12-query smoke test; then the 60 development tasks; at most 50 retained candidates per channel/query before deduplication and 5 final results; bounded source regions; a separately capped reranking/model step; and at most 12 new editorial drafts. Six variants over 60 queries can already produce 1,800 top-five occurrences before deduplication, plus filtered/displaced evidence. The pilot protocol caps the pooled judgment work, uses labels consistently for shared evidence, and marks incomplete evaluations rather than pretending the final five are the total cost. Stop for review if the smoke test exceeds 15 minutes, 16 GB additional RAM or 10 GB scratch, rather than scaling an unexplained slow path. Revise budgets using measurements before the full reserved test. No full text/model pass over every passage by default.

Use the existing shared analytics JobStore lease and one writer for each owned store. Read pinned snapshots, checkpoint small batches atomically, expose cancellation, preserve failure ledgers and release immutable results only after completion. Use native Python/cmd with login disabled; background children must be windowless. Research does not need another recurring watchdog. Preserve the existing embedding/completion supervisor and its protected build/verification phases.

The initial repair rehearsal is capped at 20 documents or 200 source pages, whichever is reached first; propose the exact changed passages and compute estimate before re-embedding. Keep model/revision/dimensions fixed unless a separate semantic generation is deliberately benchmarked. Never mix the local Qwen store with browser-model vectors. Source corrections may alter chunk boundaries/IDs and dependent mappings; “only changed vectors” must be verified, not assumed from a filename or a metadata label.

## 16 Refresh and rollback

The existing curation ledger detects changes to its compiled catalogue/proposal fingerprint; it does not continuously rehash external sources or new quality sidecars. A new reconciliation adapter must compute a dossier dependency digest covering source text, attribution, identity, use conditions, locations, quality policies and generation mappings, then include it in the proposal fingerprint. Changes can then reach the existing stale/review machinery. Prove this with changed-source, changed-quality and changed-attribution fixtures before claiming automatic protection. Previous judgments remain in history. Cross-generation identity resolution and universal selective refresh are not yet proved.

Retrieval also depends on its search population, eligibility policy, work grouping and ranking/index configuration. Adding a source or excluding boilerplate can change an old answer even if its cited text did not change. Version those dependencies, invalidate the appropriate ranking/coverage claims, and preserve previous comparisons. A new ranking alone does not silently alter an owner's approved editorial wording.

Use separate named releases for the pilot and retain a last-good pointer. Rebuildable JSON exports are not a complete backup. Before promoting new store/schema behavior, prove a consistent dependency-closed backup and isolated restoration of curation history and evidence. Test interrupted writes, retry/replay, a changed source, a changed quality rule, a new edition, a removed passage and a repaired page using disposable fixtures. No destructive test belongs in the healthy production corpus.

## 17 Additional refinement avenues

| Avenue | Why it may matter | First bounded test |
| --- | --- | --- |
| Holdings completeness | Missing chapters/pages and uncaptured assets can make good retrieval impossible | Compare selected work inventories with extracted page/section coverage |
| Source-role contamination | Editorial additions and AI-adapted project notes may masquerade as primary material | Trace ten known synthetic/front-matter cases through retrieval and attribution |
| Independent evidence families | Reprints and quotation chains can create false consensus | Review ten dense neighbor groups against work/edition identities |
| Question coverage gaps | A corpus can be large yet weak for a reader's particular question | Record failed tasks as source/repair/identity/retrieval gaps before proposing acquisition |
| Edition and translation differences | Better text may conceal genuine variants | Compare a few confirmed parallel witnesses with source-specific language review |
| Temporal distinctions | Event, composition, delivery, edition and acquisition dates answer different questions | Inspect ten historical candidates without collapsing their date roles |
| Contradiction and qualification | Similar topics can contain opposite positions | Review quoted-opponent and exception cases with surrounding source context |
| Topic organization | A reviewed map can make evidence easier to navigate | Organize a small, inspected neighborhood; allow mixed/unknown labels and overlapping topics |
| Candidate redundancy | A sound candidate may add nothing beyond an existing site treatment | Compare each proposed destination against current content before adding a feature |
| Review capacity | Useful discovery is wasted if the queue becomes unmanageable | Measure minutes per checked dossier and cap new drafts to actual review capacity |

Full-library clustering, automatic taxonomy creation and broad claim extraction are not first deliverables. A later organizational experiment must show interpretable exemplars, boundary cases, rare-topic retention and measurable usefulness. Any future work resembling retired argument extraction requires a new explicit scope and small source-reviewed method.

## 18 Editorial boundaries

Keep private research inclusion separate from public-source use and website placement. Preserve credits, edition distinctions, uncertainty and source-specific cautions. Josephus remains restricted to Scholars under [editorial source rules](../../docs/editorial-sources.md). Do not let better semantic retrieval spread excluded material into general reading pages. Preserve the owner's inclusion and fair-treatment rules for Catholic sources; disagreements must be specific and attributed rather than converted into blanket quality penalties.

Distinguish what a historical source says from whether it is true, sound, current or suitable for a reader. Do not create a universal model-generated credibility score. Names, dates, quotations and doctrinal comparisons deserve source checks appropriate to their intended use. A rights/use field is operational metadata here, not a substitute for the existing source-use decision process.

## 19 Decisions and unresolved choices

| Design decision adopted for the plan | Reason |
| --- | --- |
| Improve current candidates before broad discovery | Immediate useful comparisons and a bounded human-review load |
| Use reversible sidecar quality findings and separate dimensions | Preserve originals and prevent relevance from concealing provenance defects |
| Reuse existing evidence/curation owners | Avoid conflicting decisions, duplicate stores and silent loss of approvals |
| Treat embeddings as discovery tools with independent source checks | Similarity, fluency and frequency cannot certify truth or OCR fidelity |
| Keep KR-130 retired | Preserve the owner's explicit quality rejection and deletion decision |
| Begin in private shadow mode | Establish benefit without changing the live queue, historical tests or public content |

Resolve these during pilot preparation: final eligible generation; supported languages and reviewers; source-family identity coverage; current index recall; candidate adapter/storage extension; exact resource and model-call caps; and final calibrated thresholds. Start with the six selected candidates and proposed samples unless source access makes a case unsuitable; record substitutions before inspecting evaluation outputs.

## 20 Work already completed and the next useful result

**19 October source-only continuation:** The [all-21 selected-source desk audit](distillation/CANDIDATE-READINESS-2026-10-19.md), [six dossier preparation sheets](distillation/SIX-DOSSIER-PREPARATION-2026-10-19.md) and proposed12/12 readiness overlay now exist. These establish source/access prerequisites with explicit holds, not six improved shadow proposals, full source-quality judgment or retrieval feasibility. The existing corpus owner is still building; retain terminal publication/current-source parity and exact target vector/index dependencies before running the proposed comparison. See TODO for the single execution order.

Planning execution has produced a hashed baseline of the 21 candidates, current saved curation state, source reconciliation status and relevant implementation/review documents. Parallel read-only reviews identified reusable tools, known quality failures and the retired-system boundary. The expanded pilot specifies sampling, comparison conditions, six concrete candidate cases, adversarial tests and stop rules.

The next useful result is a source-grounded audit packet showing what is weak in those six candidates and how better evidence would improve them. It is not another bulk run or a claim that the entire corpus has been cleaned. Follow [the pilot protocol](distillation/PILOT-PROTOCOL.md) and the distillation section of [TODO.md](TODO.md) once the generation gate is satisfied.
