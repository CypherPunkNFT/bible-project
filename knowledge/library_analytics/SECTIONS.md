# Connected research: sections and source spans

KR-100/101 extends the existing analytics package with CPU programs and private relational tables. It selects the completed LA-03 generation and its LA-02 bundle. The active intake can replace the live corpus without disturbing this work: these programs never open that corpus or any vector store.

The selected bundle accounts for 214,449 documents. The adapters support 39,181 captured extraction caches (39,179 library documents and two other cached documents) and 61,708 verified source XML entries. Another 113,557 descriptors lack a supported immutable-source text adapter, and three have documented archive exclusions. These are document/entry counts, not books, sections, or embedding chunks. New intake is outside this historical selection.

`section_contract.py` defines stable representation-specific section identities, boundary versions, parents and ordered evidence segments. `section_catalog.py` captures scope, executes durable jobs, calibrates source strata, verifies and exports a release, and reconstructs requested source witnesses. `research_evaluation.py` freezes 120 fresh question intents: six families of 20, with 72 development and 48 reserved. It records future quality targets without inventing gold answers or relevance judgments.

Native TCP/TEI/ThML divisions retain structural XPath, hierarchy and heading. Native HTML headings retain DOM-derived offsets and levels. EPUB containers are verified against manifest/spine order and reconstructed member text; native headings become child sections. Shared dictionary/lexicon entries reuse LA-03's hash-bound entry proofs and existing importer adapters. Plain text and PDF heading patterns remain unreviewed candidates. A PDF page is a coordinate, never a semantic section. A root `document-representation` is counted separately from internal sections. SWORD sources without an immutable adapter remain in the explicit deferred population; binary modules are not pretended to be chapters.

Spans name their representation, file hash, block ordinal or native entry locator, Unicode codepoint interval `[start,end)`, block text hash and selected span hash. Native XML/HTML whose rendering differs from the captured cache retains independent original-rendered coordinates; cache/chunk alignment is explicitly unresolved. Identical heading strings are positioned by traversal, not substring search. Credits, contributor roles, language and unresolved identities remain captured metadata. No statement is automatically attributed to an author or marked endorsed.

From Website, in **cmd.exe**, using the dedicated native environment:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --calibrate
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --run
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --run --resume
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --status
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --query assurance
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --query assurance --include-candidates
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --section SECTION_VERSION_ID
```

`--launch` launches `--run` as a hidden native Python process and records its log/receipt. It installs no scheduler. Only one analytics writer may hold the existing `library-analytics/pipeline/pipeline.sqlite3` lease. The derived section database uses the same JobStore semantics, with bounded groups of at most 32 document jobs: each result and checkpoint commits atomically, per-job savepoints isolate failures, and a process interruption rolls back the uncommitted group. One below-normal-priority CPU worker processes local text. Resume reuses successful jobs; failed/stale inputs stay explicit. `--limit` supports an interrupted calibration/recovery check and does not imply bulk completion.

Private outputs are under `KnowledgeBase/library-knowledge/connected-research/`: `sections.sqlite3`, `section-progress.json`, `evaluations/<run>/`, and `releases/<run>/`. A release includes section and segment JSONL, document receipts, every scope disposition, input dependencies, failed jobs, summary and hash manifest. Only a structurally passing full run promotes `latest-sections.json`; calibration never does. Its report separates native structures, candidate boundaries, representation-only documents, deferrals and failures.

Verification checks all generated bounds and parent containment, exact captured cache/stream hashes, source XML entry proofs, persisted parent containment, document accounting, dependency stability, SQLite integrity and independent round-trip samples for each section-kind/coordinate combination. Focused tests exercise Unicode, repeated headings, nested XML, inert entities, EPUB hierarchy, cross-page spans, source changes, changed-parent invalidation and atomic recovery/owner refusal. Structural verification is separate from human semantic/relevance review.

Query one generation, since the database keeps old versions:

```sql
SELECT s.document_id,s.kind,s.heading,s.state,s.version_id
FROM sections s JOIN run_sections r ON r.version_id=s.version_id
WHERE r.run_id=:run AND s.kind!='document-representation'
  AND s.heading LIKE '%assurance%';

SELECT d.adapter,d.state,count(*) documents
FROM research_documents d WHERE d.run_id=:run GROUP BY d.adapter,d.state;

SELECT disposition,reason,count(*) documents
FROM research_scope WHERE run_id=:run GROUP BY disposition,reason;
```

KR-102 has now aligned this release's supported sections with a named newer corpus and captured reader generation: [verified alignment results](ALIGNMENT-RESULT.md) and [commands](ALIGNMENT.md). Its exact, approximate, partial, containing-book and unresolved states remain explicit. Next is KR-110 concepts/question retrieval. The section release itself remains unchanged and does not claim argument extraction, influence detection, human-reviewed boundaries, public eligibility or current whole-library readiness.

Heading queries default to native/recorded structures. Plain-text candidates require `--include-candidates`: the literal rule can admit ordinary sentence lines beginning “part” or “book,” so a round-tripping span does not establish a real chapter. Native layout also remains separate from semantic review.
