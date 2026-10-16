# KR-110 concept indexing and located retrieval

The private CPU processor consumes the pinned completed KR-101/102 releases. It accounts for all 100,889 supported documents/entries, retaining the inherited 113,557 adapter deferrals and three exclusions. It writes only `KnowledgeBase/library-knowledge/connected-research/concepts/` and uses the existing global analytics lease plus a local JobStore lease. It launches no intake, encoder, scheduler, graph writer or deployment.

Run from Website in `cmd.exe` with login disabled, using the existing native environment:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_index --calibrate
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_storage
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_release --verify --calibration
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_run
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_run --resume
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_index --status
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_query assurance --language en
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_query justification --author "John Owen" --language en
```

`--work` accepts an existing verified work ID. Author constraints accept an existing author ID with an explicit author role or a complete source author label, including normalized forename/surname ordering. They do not match names mentioned in prose. Contradictions between a label and recorded author/preacher identity fail closed for constrained queries and remain visible in unconstrained results. Reader membership is never promoted to an author role. Missing or uncertain work identities remain unresolved; source-byte groups are deduplication buckets, not proven independent works.

`concept_run` delegates to the same processor with a measured operational SQLite profile: 256 MiB source caches, a 512 MiB derived cache, read-only memory mapping and in-memory temporary sorts. FULL-synchronous transactions and the one-writer leases remain unchanged. It skips registration/status rewrites only for exact successful job memberships while no facts have changed. Its settings, command and process creation token are saved in `cache-profile-launch.json`. The basic `concept_index --run [--resume]` command remains valid with smaller caches. Cache tuning does not create a semantic generation; processor/rule/source changes do.

`--include-candidates` explicitly admits unreviewed inferred headings. `--include-documents` admits representation-only fallback windows; these are coarser than sections. Defaults exclude both. Native structure is not a semantic review. Context stays inside the verified section segment and has exact Unicode codepoint, half-open coordinates. Reader routes retain KR-102's containing-book or unresolved status; there are no invented page URLs. Credits, editions, roles, restrictions and Catholic cautions remain in source metadata. Private results are not public-use decisions.

The source text is partitioned into bounded windows assigned to the smallest native containing section, then an explicitly labelled candidate/document fallback. All original section IDs remain available in `concept_sections`. Windows store source offsets and hashes; an FTS5 contentless index stores searchable tokens rather than another body copy. The source section/segment is the authority for reconstruction. Parent sections can be found through KR-101's containment hierarchy. Artificial window boundaries may extend to finish a located phrase/reference without crossing the selected section.

`concept_occurrences` reuses canonical IDs and definitions from `content/library/vocabulary.json`. It records literal vocabulary candidates separately from the existing contextual English rules in `enrichment/terms/english-v1.json`. English/early-English rules do not silently become Latin/Greek models. General Unicode lexical search covers the selected text; language-specific topic grammar outside English/early English is deferred. Literal references reuse the existing canonical-bounds scanner and retain reference kind, exact witness and unresolved numbering/edition interpretation. A citation does not establish exposition, agreement or endorsement. Inter-window reference spans are retained when their section contains them; cross-source-block concepts/references are not inferred.

Question retrieval reports separate BM25, joint-term, passage-heading, expanded-vocabulary, located-concept and literal-reference ranks, combining them by weighted reciprocal rank fusion. Development review exposed short dictionary entries, numerical reference indexes and broad topic matches displacing passage evidence. Query v2 consequently weights joint terms 2.5, passage headings 2, literal references 1.25, raw lexical matches 1, expansion 0.5 and concept occurrences 0.35. Concept mode requires at least 160 codepoints and 35 alphabetic word forms, filters detected contents/navigation/reference apparatus, and diversifies at two windows per known work or explicitly unresolved source-byte group. This substantive-prose policy can omit useful short definitions or quotations; it is not a relevance classifier. The frozen baseline retains its original population, constraints and lexical BM25 rules, without these new filters. Every generation has a separate FTS table: new populations recompute BM25 statistics instead of contaminating older generations. No semantic candidates are produced in this CPU release; selected model/build/vector identity is null and semantic coverage is zero, explicitly deferred.

The evaluation freeze preserves the original 72 development / 48 reserved split. Expected evidence criteria and baseline are frozen before tuning; result judgments must name their actual reviewer type. Location checks do not count as relevance. History, quotation/reuse and language-correspondence questions remain in the denominator even where KR-120/140 capabilities are absent. A failed useful-evidence gate must not produce `latest-retrieval.json`.

The passage-heading channel matches book/chapter phrases; it does not prove that a passage falls inside a requested verse range. The literal-reference channel separately uses canonical overlap bounds. Prose-length and apparatus filters were developed on the recorded development examples; they can omit useful short evidence or text in scripts without whitespace word segmentation. Language constraints preserve recorded language labels and are not translation alignment.

Each document's facts, token inserts and checkpoint commit together, in groups of at most 16 with per-job savepoints. Same-generation resume checks parent source dependencies and reuses successful jobs. A source/rule/code/parent change produces a separate generation; changed source bytes are rejected rather than silently rebound. Reverse dependency rows name metadata, sections and source files. Population and rules/code are also release dependencies. This implementation rebuilds changed generations completely: cross-generation selective reuse, automatic refresh and backup restoration are not claimed.

Create `concepts/cancel.request` to stop at a committed group boundary; remove that task-specific marker before explicit resume. No other owner is stopped. `--limit N` supports a controlled checkpoint interruption. Process identity, generation and counters are in `concept-progress.json`; job attempts and checkpoints are durable SQLite tables. The processor uses below-normal priority and one writer. Restricted Python may not expose the existing native HTML/XML dependencies; use the authorized native execution environment rather than changing installed packages or antivirus settings.

After population completion:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_release --verify
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_coverage
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_examples
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_evaluate development
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_baseline_check
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_evaluate reserved
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_review reserved 0 --count 3
```

Review the complete reserved pool in batches, saving explicit useful window IDs, context judgments, reasons and dispositions to `evaluations/<run>/pooled-judgments.json`. The display hides retrieval mode and rank; judgments must assess the frozen evidence rubric. Do not generate relevance labels from lexical hits. Both methods use the same recorded judgments. Development iterations may use `--new-development` before reserved evaluation begins; the prior method and development outputs are archived. Once any reserved output exists, tuning is rejected.

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_collect_judgments
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_judgments
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_quality
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_resume_check --after
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_idempotence
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_runtime
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_release --export
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.concept_verify_release
```

Explicit relevance judgments and their quality receipt are required before export. Exports use deterministic gzip JSONL, pinned parents, source/code fingerprints and checksums. The candidate-index pointer and evaluated-retrieval pointer are separate capabilities. Existing immutable releases remain intact. Reconstructing the contentless FTS requires the window offsets, section store and exact parent source bytes; JSONL files alone are not a dependency-closed backup.

The collector requires exactly one reviewer-authored record per reserved question from `review-notes/reserved-*.json`. This run used model-assisted review by the implementation agent, with no human or independent reviewer. Paired evidence may occupy one window when that window physically contains both language passages; overlapping evidence groups record that fact without inventing a second source. Local bilingual quotations do not establish global alignment. Composite anthology author labels and ambiguous surnames remain attribution risks despite metadata conflict checks.
