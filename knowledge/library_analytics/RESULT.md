# First analytics warehouse — 12 October 2026

**Built and validated:** a separate 1.39 GB SQLite database, **26 tables**, two analytical views and **13 JSON/JSONL exports**. One CPU worker processed existing metadata and indexed counts; no source bodies or vectors were copied. This is a usable data product, not a proposal or UI prototype.

Latest generation: [latest.json](../../../KnowledgeBase/library-analytics/latest.json). Run: `KnowledgeBase/library-analytics/run-20261012T154246Z/`. It contains `analytics.sqlite3`, `summary.json`, `findings.json` and `exports/`.

| Input layer | Records processed |
| --- | ---: |
| Corpus documents | 214,449 |
| Registered resources | 439,063 |
| Intake-file records | 65,375 |
| Reader catalogue | 149,799 |
| **Total input observations** | **868,686** |

These overlapping layers are not additive books. The builder also aggregates **8,458,873 existing chunks**, recorded references and **8,471 contributor identities**. It preserves original identifiers and makes missing/ambiguous joins explicit.

## Concrete findings and reusable outputs

- **12,091 identity backfill proposals:** 8,335 corpus work IDs, 5 corpus edition IDs and 3,751 reader edition IDs. Each is supported by a same-recorded-hash counterpart and has one proposed value. No conflicting non-empty work/edition IDs were found in those matched pairs. Registration/current-input checks remain necessary before applying proposals; no live metadata was changed.
- **6 missing contributor metadata identities**, affecting **159 reader memberships**, retained in `unresolved_contributors`. The largest affects 148 records. Existing IDs were preserved; no names or identities were invented.
- **38,551 reader records** have one corpus original-hash match; **104,181** have no such match; **7,067** have no recorded original hash. This describes the join, not proven absence of their content: late intake, alternative representations and other identity paths can matter.
- **19,841 reader records** declare on-site text; **9,662** lack a same-original-hash `library_text` corpus match. Historical material accounts for 7,709, First1K for 1,203, PTA for 440, CSEL for 280, TCP for 22 and catenae for 8. These are explicit reconciliation candidates, not a directive to download or re-embed everything.
- **93,151 resource hash groups** contain repeated recorded originals. Separate **1,375 reader title/author/language groups** contain different recorded hashes and may represent editions or duplicates. These counts overlap other layers; none proves safe file deletion or independent works. Historical collection/category overlap dominates the source-overlap table and can reflect multiple catalogue views or archive-move records.
- Source, language, genre and contributor coverage, source complementarity, existing reference coverage and ranked metadata defect groups are available as tables and exports. Eight practical queries are in [queries.sql](queries.sql).

## Validation and operation

SQLite integrity checks passed. Source database versions/build remained stable during extraction; all 257 reader/catalogue input files passed change checks. **Zero parse errors, zero duplicate observation keys**, and source/language/genre aggregate totals each reconcile to all 868,686 observations. All 159 unresolved contributor memberships are accounted for explicitly. Three adversarial fixture tests cover exact versus candidate matches, ambiguous matches, declared availability, missing contributor metadata and non-destructive identity proposals.

The first development run failed on a contributor-file shape mismatch and was never promoted; its artifacts remain in `run-20261012T153902Z/`. Use `latest.json`, not the first run found on disk. The corrected generation initially surfaced missing contributor metadata; those source defects were preserved in a dedicated table before completion. No integrity failures were waived.

Embedding status advanced from **8,131,429 to 8,135,141** during the corrected build. These are dated status-file observations, not a liveness guarantee or final-intake claim. Live corpus, source registry, original files, vectors, graph jobs, website routes and publication state were unchanged.

The database is a versioned snapshot of the current inputs. Source hashes are recorded assertions; originals and all reader bodies were not rehashed/revalidated. Current canonical files can be newer than corpus metadata. Public export eligibility is separate. Future intake requires a new generation; it does not invalidate the usefulness of these scoped measurements now.
