# Library analytics

For the next implementation session, load the initiative's [new-chat context](../../initiatives/library-knowledge/NEW-CHAT-CONTEXT.md) and [KR-110 prompt](../../initiatives/library-knowledge/PROMPT-KR110.txt). New processors and future acquisitions follow the [future-additions protocol](../../initiatives/library-knowledge/FUTURE-ADDITIONS-PROTOCOL.md): reuse existing jobs and proofs, preserve historical releases, and implement scoped refresh/recovery. A universal cross-generation refresh command and verified backup/restore do not exist merely because current runs can resume.

**KR-100/101 section processing implemented:** [Contracts, commands and supported population](SECTIONS.md). Native XML/HTML/EPUB hierarchies and reference entries retain versioned source spans; PDF/plain headings remain candidates. Run receipts select the completed population and account for deferrals. This independent CPU work preserves the running intake and vectors.

**KR-102 chunk/reader alignment complete for its supported population:** [Verified results](ALIGNMENT-RESULT.md), [contract and commands](ALIGNMENT.md), [SQL queries](alignment-queries.sql). All 100,889 supported documents/entries have completed receipts and 1,161,753 section statuses; 18,893,464 chunk overlap pieces and 908,211 reader pieces are exported. Zero failed jobs; 360 population witnesses and 43 focused tests passed. Exact/normalized page locations remain separate from containing-book navigation; the current reader cannot select a page from its URL. The private latest-alignment pointer selects the matching passing release. Next is KR-110 concepts/question retrieval; semantic review and whole-library coverage remain separate.

**Implementation and operation:** [Library Data Pipeline implementation plan](IMPLEMENTATION-PLAN.md) specifies resumable Python jobs, metadata refinement, full-population text analysis, reusable tables and controlled correction batches. It distinguishes delivered stages from the remaining canonical application work.

**LA-01 implemented:** [Metadata refinement results and operation](REFINEMENT-RESULT.md). The local CLI processes normalization, identity candidates, contributor reconciliation and archive proofs with durable jobs. Application is tracked separately under LA-04 below.

**LA-02 complete and verified:** [Measured results](TEXT-RESULT.md), [CPU text-analysis contracts](TEXT-ANALYSIS.md), [analytical queries](text-queries.sql). All 214,449 current corpus documents across eleven kinds are accounted for: 214,446 analysed, three documented exclusions and zero failed jobs. The three releases contain 10,205,959 literal reference matches, 4,478,805 structure records and measured quality/coverage gaps. `KnowledgeBase/library-analytics/latest-text-bundle.json` selects all three populations; individual generations must not be added to unrelated development results.

**LA-03 complete and independently verified:** [Measured results](PRODUCTS-RESULT.md). [Product contracts and operation](PRODUCTS.md), [consumer SQL](product-queries.sql). The CPU worker builds address-role matrices, contributor/source profiles, complete lexical counts, bounded reuse candidates and verified shared-XML entry links. A sequential delivery coordinator builds normalized collection/contributor coverage and vocabulary tables, verifies the releases and promotes `latest-analytical-release.json` only after completion. Use `products-status` for live counts. Source application is reported below; corpus incorporation and public consumers remain LA-04 work.

**LA-04 source application completed and verified:** [Measured changes](APPLICATION-RESULT.md), [operation and recovery](APPLICATION.md). Applied 3,751 reader edition IDs and six source-verified contributor entries representing 159 existing memberships. Registered 8,338 corpus fields through durable source fills; live corpus incorporation remains pending. A repeated full run changed zero files. Corpus reconciliation and delivery through existing UI consumers remain; dated analytical releases are preserved.

```powershell
D:\Python\python.exe -B -m knowledge.library_analytics run --profile cpu --resume
D:\Python\python.exe -B -m knowledge.library_analytics status
D:\Python\python.exe -B -m knowledge.library_analytics validate --run <run-id>
D:\Python\python.exe -B -m knowledge.library_analytics prepare-patches --run <run-id>
```

Runtime state is `KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3`. Validated private releases live in `pipeline/releases/<run-id>/`; `latest-refinement.json` points to the latest successful refinement release and leaves the baseline `latest.json` pointer intact. `--resume` recovers the latest interrupted run; otherwise a new generation reuses successful jobs whose input fingerprints and processor versions match. Input discovery/checks still run. `--run <run-id>` explicitly resumes a selected unfinished generation; completed generations are immutable. Failed jobs remain failed unless inputs or processor versions change; the CLI does not repeatedly retry permanent failures.

`correction-batch.jsonl` is a **dry-run correction contract**, not an existing teacher-override file. LA-04 now groups and rechecks these proposals and writes durable source fills through its existing owners; it handles work-only proposals without inventing editions. No scheduled service is installed by LA-01 or this metadata application.

To query one generation, join derived tables to `run_jobs` on `job_id` and filter `run_id`; the persistent database contains multiple generations and processor versions. For example:

```sql
SELECT t.layer,t.language,count(*) records
FROM normalized_metadata t JOIN run_jobs r ON r.job_id=t.job_id
WHERE r.run_id=:run_id GROUP BY t.layer,t.language;
```

`jobs.py` uses PID plus process creation identity to refuse a second coordinator. Output and checkpoints commit together; dead-process leases and graceful interruptions become pending. Full validation checks persisted file hashes and accepted candidates against current source fingerprints before a new export. The completion state describes the selected snapshot's derived processing and includes unresolved data counts; it does not mean intake, embedding or catalogue application has completed.

A private, CPU-only SQLite warehouse joining the existing resource registry, corpus document metadata, intake inventory and Teachers reader catalogue. It produces real row-level crosswalks and aggregate tables for later UI/data use. It does not read vector files, run an encoder, copy source bodies or write to live input databases.

From Website:

```powershell
D:\Python\python.exe -B knowledge/library_analytics/build.py
D:\Python\python.exe -B knowledge/library_analytics/test_build.py
```

Outputs are versioned under `KnowledgeBase/library-analytics/run-<UTC timestamp>/`. `latest.json` points only to a build whose database and input-consistency checks passed. Each run has `analytics.sqlite3`, `summary.json`, `progress.json` and private JSON/JSONL exports. Failed runs remain unpromoted. A local build lock prevents two instances; a crashed process's lock must be investigated before removal.

The process uses one CPU thread, below-normal Windows priority, bounded batches, a 32 MiB output SQLite cache and on-disk sorting. Input connections are read-only and release each batch's read transaction. Chunk counts use the existing document index without loading chunk bodies. Database data-version/build checks cover the extraction window, and reader input size/mtime checks detect changes to the files consumed. This is a versioned sequential snapshot, not an atomic transaction spanning three systems. Later intake requires a new analytics generation; no claim of final library completeness is made.

## Tables to consume

| Table/view | Unit and purpose |
| --- | --- |
| `observations` | One input record, namespaced by resource/corpus/intake-file/reader; layers overlap and are not additive book counts |
| `hash_coverage` | Counts per recorded original SHA256 across layers; no fresh original-byte verification |
| `reader_crosswalk` | One reader record, with exact recorded-hash corpus/resource match counts and explicit missing/ambiguous states |
| `source_coverage`, `language_coverage`, `genre_coverage` | Layer-specific coverage, unknown fields, recorded-byte groups and declared availability |
| `contributors`, `reader_contributors`, `contributor_coverage` | Existing contributor IDs/roles, work memberships and reader availability |
| `author_label_coverage` | Conservative normalized label groups; labels are not resolved person identities |
| `exact_duplicate_groups` | Repeated recorded original hashes within each layer; never dedup across layers as if they were copies |
| `extracted_body_groups` | Corpus body-hash repetitions, separate from original-byte duplicates |
| `title_author_candidates`, `candidate_members` | Same normalized title/author/language with different recorded hashes; candidates for edition/duplicate review, not merged works |
| `source_overlap`, `source_complementarity` | Recorded-byte overlap/unique contribution among held resource body candidates; not independent-witness counts |
| `quality_issues`, `repair_summary` | Queryable defects and priority-ranked groups; no automatic live repairs |
| `corpus_reader_identity_differences` | Same-hash records whose work/edition metadata disagree or are missing in one layer |
| `identity_backfill_candidates` | Field-level proposals to fill missing work/edition IDs from same-byte counterpart records; unique versus ambiguous proposals, never applied automatically |
| `unresolved_contributors` | Referenced contributor IDs absent from catalogue identity metadata, with affected reader-link counts |
| `chunk_counts`, `reference_counts`, `recorded_reference_coverage` | Existing corpus counts, not a new extraction of textual references |
| `input_files`, `input_streams`, `errors` | Input fingerprints, source row counts and parse failures |

No title/author similarity changes a canonical identity. Null hashes never match. Multiple matches remain multiple. `readable_declared` means the existing catalogue says `on-site-text` and has pages; this build does not validate every reader bundle. Canonical IDs in source snapshots can lag current source files. The warehouse exposes those differences rather than overriding either record.

Source family normalization removes `library:`/`source-` wrappers, with three explicit aliases in `build.py`; raw labels remain available. Language values remain source assertions rather than detected languages. Resource `body_candidate` is the existing format/classification hint, not proof that a complete book was extracted. Teacher records are not necessarily books either.

## Example analytical queries

```sql
-- Held source contribution, preserving unique-byte versus shared-byte counts.
SELECT * FROM source_complementarity ORDER BY hashes_unique_to_source DESC;

-- Declared readable records that do not yet join to a library_text corpus document.
SELECT reader_id,title,source_family,match_state
FROM reader_crosswalk WHERE readable_declared=1 AND corpus_text_matches=0;

-- Largest correction opportunities. Source snapshots remain untouched.
SELECT * FROM repair_summary ORDER BY priority DESC,records DESC;

-- Inspect exact edition metadata differences rather than blindly overwriting them.
SELECT * FROM corpus_reader_identity_differences LIMIT 100;
```

JSON exports are private development inputs, not approved public exports. They contain source metadata and potentially private titles/paths in the database. Public deployment requires selecting allowed fields/use scopes separately. Existing UI components should consume derived outputs through their established data contracts; this task adds no UI.
