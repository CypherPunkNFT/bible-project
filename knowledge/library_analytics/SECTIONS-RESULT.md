# KR-100/101 execution

**13 October 2026 — full supported-population release complete and verified.** [Operation and contracts](SECTIONS.md) · [Initiative](../../initiatives/library-knowledge/README.md).

This task implements actual section/span processing in `section_contract.py`, `section_catalog.py` and `research_evaluation.py`. Input: analytical parent `la03-20261013T024336384123Z`, text bundle `la02-bundle-3a0a9d446b24028b`, from corpus build `2026-10-07T23:00:34.844772+00:00`. Current intake/new acquisitions are outside this named historical selection.

| Population | Documents |
| --- | ---: |
| Captured extraction caches | 39,181 |
| Source-verified dictionary/lexicon XML entries | 61,708 |
| Supported total | 100,889 |
| Deferred: no supported immutable-source text adapter | 113,557 |
| Documented archive exclusions | 3 |
| Entire selected bundle accounted for | 214,449 |

Final calibration `kr101-a45aae9c470cfb05d56e0d1e-calibration` passed: 113 documents, 4,394 section records, 7,104 spans, 105 successful jobs, zero failed jobs, zero dangling parents and zero parent-containment failures. It covers available source/format strata and all ten shared XML entry assets. Native EPUB spine/member text and heading hierarchy were verified. Root representations, semantic candidates and native containers are distinguished; page coordinates are not labelled chapters.

Twenty-eight relevant tests passed: 16 section/batch tests and 12 existing pipeline regressions. They cover Unicode, nested/repeated headings, inert entities, EPUB order/hierarchy, cross-page spans, changed-source rejection, parent-version invalidation, single-owner refusal, atomic rollback and interrupted group recovery. Interrupted/resumed and uninterrupted fixture processing produced byte-identical section, segment and document exports. A changed frozen input rejects completed-run reuse without changing the historical release. Bounded groups of 32 document jobs reduce checkpoint overhead; failed jobs roll back to their own savepoint and successful facts/checkpoints commit together.

KR-100 freezes 120 fresh question intents (72 development, 48 reserved; six families of 20) and predeclared structural/future retrieval targets. No gold answers, relevance scores or human semantic boundary review are invented. Source-window splits group by original asset identity, preserving the grouping across cache/native representations.

Full run `kr101-31239794030518bcb2299a31` is complete and selected by `latest-sections.json`.

| Delivered or verified | Count/result |
| --- | ---: |
| Supported documents/entries processed | 100,889 / 100,889 |
| Successful jobs | 39,192 |
| Failed/unfinished jobs | 0 |
| Section records | 1,161,753 |
| Native structural units | 720,188 |
| Verified EPUB containers | 81,859 |
| Unreviewed heading candidates | 311,512 |
| Representation roots (not semantic sections) | 48,194 |
| Ordered source spans | 1,469,536 |
| Independently reconstructed witness samples | 2,666; all passed |
| Dangling parents / containment errors / changed dependencies | 0 / 0 / 0 |
| SQLite integrity | `quick_check: ok` |
| Export bytes, excluding manifest | 2,125,617,484 |

Cache document states: 25,346 with native sections/containers, 11,468 with candidate boundaries, and 2,367 representation-only. Roots include 9,015 independent original renderings whose cache alignment remains unresolved. These are overlapping representations, not additional books. The section database is approximately 5.95 GB and also retains earlier calibrations and an interrupted development generation; filter by selected run, never sum generations.

Private outputs under `KnowledgeBase/library-knowledge/connected-research/`: `sections.sqlite3`, `latest-sections.json`, `section-progress.json`, `section-run.log`, `evaluations/<run>/`, `releases/<run>/summary.json`, `release_manifest.json`, and seven hash-bound JSON/JSONL exports. Independent verification rehashed all seven exported artifacts successfully. `verifications/<run>/post-run-verification.json` records that check, immutable rerun reuse and a native assurance-heading query with a hash-verified 11,353-character original-HTML witness. This verification receipt is separate from the immutable release. A real completed rerun returned `complete, unchanged` without repeating source work.

The section worker has finished and released its leases. For a future interrupted run, use cmd.exe from Website: `..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_catalog --run --resume`. A second live owner is refused. Intake/embedding owner PID 41008 and its child are unrelated and remain preserved; inspect their actual completion receipt for current state. The release's `seconds` field measures the final invocation, not the earlier completed work reused after resumption.

The concrete gain is a source-section backbone with durable identities, hierarchy, end boundaries and reconstructable spans. Plain-text rules can mistake sentence lines beginning “part” for headings; these remain unreviewed candidates and default queries exclude them. Native layout also does not establish argument or speaker attribution. Frozen questions/source windows are unjudged evaluation inputs, not completed retrieval assessment.

Remaining KR-102 work: align sections to actual corpus chunks and on-site reader destinations, retaining exact/approximate/containing-book/unresolved states. The 113,557 unsupported immutable-adapter cases, 2,367 representation-only documents and unresolved original/cache relationships remain explicit. New intake requires a new input generation. Interpretive attribution, concept retrieval, influence and public delivery remain separate tasks. This processor never changed originals, corpus, vectors, graph or public content.
