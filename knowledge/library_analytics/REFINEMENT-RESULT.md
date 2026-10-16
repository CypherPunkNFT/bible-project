# LA-01 delivery: metadata refinement and resumable processing

**Completed and validated, 12 October 2026.** A working Python/SQLite processor now refines the whole selected metadata snapshot and produces evidence-backed correction batches. It runs locally on CPU, with no model calls. Canonical application and broad text analysis are subsequent stages.

Validated generation: `la01-20261012T173430549460Z`. [Current release pointer](../../../KnowledgeBase/library-analytics/latest-refinement.json). Baseline warehouse pointer remains unchanged.

## Results

| Result | Count |
| --- | ---: |
| Input observations processed | 868,686 |
| Records with structured metadata recovery | 21,445 |
| Language fields recovered | 4,132 |
| Author-label fields recovered | 8,280 |
| Genre fields recovered | 13,043 |
| Language values normalized or recovered | 49,380 |
| Existing identity proposals validated | 12,091 |
| Accepted, unapplied identity fields | 12,089 |
| Unresolved identity fields | 2 |
| Missing contributor identities matched to existing source registries | 6 |
| Reader memberships affected by those contributor mappings | 159 |
| Reader/corpus gaps investigated | 9,662 |
| Gaps with current held originals confirmed on disk | 9,652 |
| Gaps without a verified original/corpus link | 10 |
| Excluded archive moves freshly checksum-verified | 3 |
| Failed/stale jobs in the validated generation | 0 |
| Live catalogue/corpus corrections applied | 0 |

Recovery fields overlap records and input layers overlap each other; these are not additive books. The processor derives changes for 622,251 records, including 427,953 source-label normalizations and 494,341 genre-label changes. **465,730 genre changes simply represent previously empty values explicitly as unknown**; do not count those as newly discovered genres. No titles were recovered. Unknown authors remain unknown when evidence is insufficient.

## Actual programs and datasets

Implemented modules: `jobs.py`, `inputs.py`, `normalize.py`, `identities.py`, `pipeline.py`, and `__main__.py`. [Operation and contracts](README.md), [SQL queries](refinement-queries.sql), [remaining implementation](IMPLEMENTATION-PLAN.md).

Private runtime database: `KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3` — **647,020,544 bytes** at verification, with **12 tables**. It retains job history and results across generations; always filter through `run_jobs.run_id` to avoid adding versions together.

Release directory: `KnowledgeBase/library-analytics/pipeline/releases/la01-20261012T173430549460Z/` — approximately **440.7 MB** of private exports:

- `correction-batch.jsonl`: 12,089 null-field correction proposals with expected old values, current target/counterpart fingerprints, canonical bindings and application route. This is a dry-run contract, not an existing teacher-override file.
- `metadata-refinements.jsonl`: changed or flagged observations with raw fields, derived fields and recovery evidence.
- `correction_candidates.jsonl`, `contributor_resolutions.jsonl`, `reader_reconciliation.jsonl`, `archive_move_proofs.jsonl`: complete dispositions and supporting evidence.
- `language-coverage.json`, `summary.json`, `release_manifest.json`: reconciled counts and export checksums.

Full post-run validation receipts are in `KnowledgeBase/library-analytics/pipeline/validations/`. The same commands can verify source fingerprints before a subsequent export.

## Recovery and validation

All **1,089 jobs** in the final generation succeeded: 869 normalization batches, 121 identity batches, 97 reader-reconciliation batches, one contributor batch and one archive batch. The initial full pass took 150.6 seconds. After improving reader reconciliation, the resumed invocation took 123.9 seconds, reused **992 successful jobs** and completed the remaining 97 batches. Rediscovery and input hashing still run when outputs are reused.

The reconciliation revision initially exposed a poor SQLite index choice. Its coordinator alone was stopped after checking its PID and creation token; the corrected query explicitly uses the existing original-hash index. The same generation resumed successfully without losing completed results. The embedding process was not stopped.

**15 focused tests passed:** 12 pipeline tests plus three existing warehouse tests. Coverage includes a real process crash during a transaction, graceful interruption, competing coordinators, rollback of partial results/checkpoints, changed hashes, conflicting canonical bindings, unchanged-result reuse, rejection of mutations to a completed generation and detection of changed candidate inputs during validation.

SQLite integrity passed; expected and actual row counts agree; no orphan checkpoints or invalid accepted candidates were found. Input database versions were stable during processing. Full post-run validation rehashed persisted file dependencies and checked accepted proposals against current target/counterpart fingerprints: **zero changed dependencies and zero changed candidate sources**. Completed generations are immutable. Future intake creates a new generation and selectively reuses matching jobs.

All eight files listed in the release manifest passed byte-count and SHA256 verification; all seven supplied refinement SQL queries executed against the release. `prepare-patches` also passed current-input validation and returned the existing immutable correction release. The analytics coordinator is now idle. Embedding was still advancing at the final status observation: 8,251,941 indexed, 206,932 remaining, at 17:47:04 UTC; this is a dated observation rather than a final-intake total.

## Explicit pending work

1. **Two identity proposals** reference the absent canonical edition `edition-l11-flavel-mourners-1813`; both remain unresolved. No canonical record was fabricated.
2. **Ten CSEL reader records** lack a verified original/corpus link. Their full IDs and titles are retained in `reader_reconciliation.jsonl`; they include letters, the Jonah/Nineveh and Sodom poems, *De civitate dei* and attributed Old/New Testament questions. This is a provenance/linkage gap, not proof that their on-site text has disappeared.
3. **9,652 held originals** still lack a verified corpus-text link: private biblical history 7,709; First1K 1,203; PTA 440; CSEL 270; TCP 22; catenae 8. Their paths exist and current registry hashes agree with reader assertions; these originals were not bulk rehashed. Their intake/linkage remains pending; existence does not prove a queued intake job.
4. **621 raw language assertions** fall outside the first explicit mapping rules. These include valid codes as well as ambiguous or malformed labels; they were retained, not guessed or counted as processor failures.
5. Apply accepted identity corrections and the six contributor mappings through LA-04's source-of-truth mechanisms, preserving contextual eligibility and institutional/person roles. The public catalogue still needs that application.
6. LA-02 text-quality, structure and literal-reference processing has not started. It can use the durable job runner while embedding continues.

Vectors, originals, intake configuration, graph writers and the website deployment were preserved. LA-01 completion concerns this metadata snapshot; it does not declare intake or embedding complete.
