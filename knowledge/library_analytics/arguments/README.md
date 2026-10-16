# KR-130 private surface argument processor

This package extracts actual located statement, reported speech, quotation, objection, reply, premise/conclusion cue and qualification candidates from the pinned KR-101/102 sources. It stores Python/SQLite results under `KnowledgeBase/library-knowledge/connected-research/arguments/`. It selects neither KR-110/120, embeddings nor concurrent refresh outputs.

Inputs are `kr101-31239794030518bcb2299a31` and `kr102-1b03f58bf6e6749f9170bf38`, with their immutable summaries/manifests checked. Every parent descriptor is accounted for. Processing supports exactly the source language label `en`: 98,733 documents/XML entries. This is a source assertion, not detected English. Other labels and inherited missing adapters remain deferred. Later acquisitions belong to a later coordinator generation.

All non-candidate located section spans are eligible, including document/page representation fallback, which stays explicitly coarse. Native sections are preferred when they contain the complete clause. Unreviewed headings never supply a boundary. Overlapping candidates within one representation are deduplicated, but independent representations retain their own coordinates. No work/edition identity is invented.

The processor uses explicit English surface cues, with 3,000-codepoint clause bounds. Unmarked, short, oversized and representation-only empty prose are accounted for in document receipts. Lexical negation is not logical inversion. Qualifications retain literal limiting suffixes, offsets and hashes. Closed quotation subspans and structurally adjacent objection/reply links retain their own roles and uncertainty. Links are candidate relations, not evidence that a premise logically supports a conclusion. Missing premises, implicit objections and historical quotation source resolution remain unsupported.

Document author labels, contributor memberships, editor/translator labels, credit, licence and Catholic caution metadata survive in scope and query responses. A reader membership never becomes an author role. Explicit locally named reported/quoted speakers retain their source labels; pronouns remain unresolved. A source author label is a candidate attribution basis, never proof of narrator identity. Ordinary narration, reports and quotes have unresolved endorsement; an explicit first-person assertion/reply can be an author-assertion candidate. Objections are marked not endorsed. Public/editorial approval is separate.

The 121 fresh difficult cases are frozen separately from existing evaluations: 51 development and 70 reserved, across disjoint source documents. Baseline criteria were frozen before tuning; source-context review is by the implementation model, not a human or independent reviewer. Exact backend model revision and session cost are not exposed. There are zero external generation calls, zero external API cost and no generation model dependency. `evaluation/` contains source cases, judgments, metrics and the pre-reserved tuning freeze. Read the task-specific result for measured failures; candidate table counts do not establish attribution quality.

Run from `Website/` through `C:\Windows\System32\cmd.exe` with shell login disabled:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.lease_runner --calibrate
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.lease_runner --calibrate --resume
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.lease_runner --run
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.lease_runner --run --resume
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments --status
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.query --query faith --kind objection --author Owen
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.query --query unless --author Flavel
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.verify
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.arguments.release
```

`lease_runner` is a finite native worker that waits for the existing global analytics lease; it installs no scheduler. `processor` itself refuses competing owners via the existing JobStore. Facts and checkpoints commit together in groups of at most 16 documents. Same-generation resume skips committed document jobs; completed reruns return unchanged. Changed summaries, manifests, source file identity or rule/code/config fingerprints reject generation mixing. Source bytes are SHA256-checked when reconstructed, while the complete pinned source stat index also guards skipped jobs. There is no cross-generation reuse, refresh integration, automatic restart or backup/restore claim.

To request a graceful population checkpoint, place `cancel.request` only in the owned arguments output directory, then remove that request before the explicit `--resume` command. `--limit` is a recovery test boundary, not population completion. Completed historical tables and releases are retained. A new rule/input generation requires its own matching calibration; it never mutates an earlier generation.

Tables: `scope`, `dependencies`, `contributors`, `statements`, `source_spans`, `qualifications`, `argument_links`, `document_results`, existing job/checkpoint tables, and the private FTS5 `statement_search`. Filter every query by exact `run_id`. `queries.sql` gives working recipes. Python queries reconstruct source text and qualifications, return original metadata, available KR-102 chunk pieces and honest containing-book destinations. Detailed chunk pieces are bounded to 20; complete pieces remain available from the pinned KR-102 tables. No fabricated page/section URL is emitted.

FTS selects literal matching clauses. Query ordering uses whole-clause length and immutable ID, so historical/calibration rows cannot contaminate results through global BM25 frequencies. This is an inspectable query, not an accepted relevance-ranking or answer-generation capability.

The first calibration attempt exposed the environment's missing `typing_extensions` HTML-parser dependency. That attempt and its atomic failure receipts are retained. Version 4.15.0 was installed only under the owned private `arguments/dependencies/`, with wheel/hash/install metadata and the MIT licence preserved. The corrected environment is an explicit new generation with no old-fact reuse. Runtime/parser versions and the owned dependency's source hash participate in generation identity.

The first population attempt also exposed a pinned native HTML rendering whose source bytes still match but whose rendered block hash no longer reconstructs. `reconstruct.py` records this representation in `reconstruction_deferrals`; it accepts no approximate replacement. Exact captured-cache sections of that document remain eligible. A genuinely changed source file still raises `StaleInput` and rejects the job. Earlier attempted generations, failed jobs and exact working receipts are retained under the versioned database and `generation-receipts/`. This is representation coverage loss, not a text-import hold or a correction to KR-101/102.

Exports are deterministic compressed JSONL ordered by primary identity, with SHA256, row counts and logical uncompressed hashes. Source-code snapshots, dependencies, quality and recovery receipts accompany the private versioned release. `delivered-release.json` is a task receipt inside owned outputs, not a global/latest promotion. Shared coordination files, original sources, corpus, vectors, graph, website, schedulers and other workstreams are outside ownership.
