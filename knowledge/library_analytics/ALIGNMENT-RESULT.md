# KR-102 alignment: completed supported population

**14 October 2026.** [Contract and commands](ALIGNMENT.md) · [SQL queries](alignment-queries.sql) · [Initiative backlog](../../initiatives/library-knowledge/TODO.md).

Run `kr102-1b03f58bf6e6749f9170bf38` maps the verified KR-101 release `kr101-31239794030518bcb2299a31` to corpus build `2026-10-13T23:47:33.488164+00:00` and captured reader generation `d9f84a4cd33e439ac3e5d10e3c00b3ac7c25d302853a598ef35272e99cb03264`. The full release passed validation and was selected by `latest-alignment.json`. This is completed location processing for its supported historical sections, not whole-library semantic readiness.

| Output | Count |
| --- | ---: |
| Supported documents / XML entries processed | 100,889 / 100,889 |
| Section versions with alignment status | 1,161,753 |
| Captured corpus chunks | 8,104,546 |
| Section-to-chunk overlap pieces | 18,893,464 |
| Section-to-reader page/block pieces | 908,211 |
| Representation alignment maps | 120,083 |
| Successful jobs, including scope capture | 100,890 |
| Failed or unfinished jobs | 0 |

These are overlapping sections and span pieces, not distinct books or independent witnesses. No new source bodies were copied into the derived store.

| Section coverage | Exact | Approximate | Partial | Unresolved |
| --- | ---: | ---: | ---: | ---: |
| Corpus chunk location | 946,176 | 7,481 | 66,592 | 141,504 |
| Reader page/block location | 280,882 | 20 | 0 | 880,851 |

**280,904 sections have a containing-book reading destination; 880,849 have unresolved navigation.** Exact reader coordinates do not imply an exact URL: the existing reader opens at page one and does not consume page/section selectors. The tables retain page index, block index and character offsets for later reader-owner integration. Permission-required or unpublished bodies are not offered as reading destinations. Original hashes constrain reader matches; another edition with the same title is not substituted.

The inherited scope includes **113,557 deferred descriptors** needing immutable-source text adapters and **three documented archive exclusions**. Later acquisitions outside KR-101's selected sections require an upstream refresh. Corpus bindings verified 100,884 documents against document ID and original hash; four supported documents were absent and one had a source-path conflict. Changed prose maps only verified equal islands; 142 corpus representations and two reader representations exceeded the bounded token comparison. Recorded section reasons include 70,524 without a same-source reader record, 13,766 exceeding the bounded token comparison, 1,077 with a missing corpus document, 20 with the source-path conflict and nine without monotone equal prose islands. These reasons can overlap and are not a complete partition of unresolved reader states; unpublished/non-offered bodies are also retained in destination receipts. Unresolved locations are not download failures or embedding holds.

Validation found zero missing section statuses, invalid chunk bounds, coverage overcounts, changed input files or failed jobs; SQLite quick-check passed. **360 independently reconstructed source/target witnesses passed, zero failed**, across nine coordinate/precision strata. Calibration had already passed 181 witnesses on 115 documents and 4,415 sections. **43 focused alignment, section and pipeline tests passed**, covering Unicode offsets, whitespace normalization, page crossings, edition exclusions, changed chunk identities, corpus replacement refusal and atomic recovery. All 12 JSONL exports plus the summary passed independent SHA256 and size verification: 19,128,924,084 bytes total (19.13 GB decimal). A full independent anti-join found zero dangling chunk links across all 18,893,464 pieces. These checks establish deterministic text/location correctness; they do not claim human boundary review, doctrinal endorsement or semantic relevance accuracy. A native assurance heading query returned source segments and exact current chunk offsets; unreviewed heading candidates remain opt-in.

## Outputs and operation

Private root: `KnowledgeBase/library-knowledge/connected-research/alignment/`.

- `alignment.sqlite3`: generation-bound section, chunk, reader, provenance, coverage and job tables.
- `latest-alignment.json`: selected completed release.
- `releases/kr102-1b03f58bf6e6749f9170bf38/`: 12 JSONL tables, `summary.json` and `release_manifest.json`.
- `alignment-progress.json`, `alignment-run.log`, `alignment-error.log`: runtime receipts; population worker finished.
- `release-verification.json`: independent export and referential checks.
- `releases/kr102-b1ed4770a3effb2c65c6b9be-calibration/`: bounded calibration, not the full-population pointer.

Implementation: `alignment_contract.py`, `section_alignment.py`, `test_alignment.py`, `ALIGNMENT.md` and `alignment-queries.sql`. One low-priority CPU worker used the existing analytics lease and atomic document checkpoints. Performance changes retained the same contract and reused committed jobs: indexed source/reader lookups, larger bounded SQLite caches and memory-backed temporary scratch. The summary's 12,822.1 seconds measure the final worker attempt through validation; they are not cumulative campaign time across restarts.

Originals, corpus, vectors, graph, reader packages, credit fields, warnings and public output were preserved. No intake/embedding process was launched by KR-102. Inspect current completion-owner receipts rather than retaining a historical PID as a liveness claim.

**Next: KR-110 — `concept_index.py` and author-constrained question retrieval.** Reuse these section locations, existing topic senses, lexical/reference evidence and explicitly selected vector coverage. Freeze expected evidence before tuning; evaluate useful located results against the baseline on the reserved questions. Lexical/reference processing can proceed while embedding runs. Full-current-vector or public-readiness claims still require their respective completion checks.
