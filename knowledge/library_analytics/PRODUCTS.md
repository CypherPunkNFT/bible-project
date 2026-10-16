# LA-03 analytical products

The Python processors build private SQLite tables and checksummed JSONL exports from `latest-text-bundle.json`. They account for every record in that LA-02 bundle; full lexical counts and reuse signatures cover its completed `library_text` and `library_review` population. Other kinds receive metadata dimensions and literal-address roles, not an invented book-level vocabulary analysis.

## Operation

From `Website/`:

```powershell
D:\Python\python.exe -B -m knowledge.library_analytics run-products --resume
D:\Python\python.exe -B -m knowledge.library_analytics products-status
D:\Python\python.exe -B -m knowledge.library_analytics.product_delivery
```

`product_delivery` requires a completed parent, builds consumer tables, verifies both releases and writes `latest-analytical-release.json` only after all checks pass. To wait for a specific running parent first, use `--wait-for <run-id>`. It detects a stopped worker and reports pending work; it does not silently restart intake or embedding. Re-running consumer delivery reuses successful stage checkpoints.

If an already running delivery loaded an earlier verifier, `product_delivery --finish-existing <run-id>` waits for that delivery's receipt, then rechecks the same generation with the current verifier. It does not launch another consumer coordinator. `--refresh` performs that recheck immediately on a delivered pair. Completion documentation is promoted only after a verified final receipt exists.

`--report-only` renders documentation from the matching verified receipt without repeating bulk hash checks. It preserves the original verification time and rejects mismatched parent/consumer generations. JSON inputs use UTF-8 explicitly on Windows. Consumer integrity checks target `main` only; the attached parent has its own validated release.

`run-products` without `--resume` creates a new metadata generation and reuses matching completed document jobs. `--limit` is for interruption calibration; it does not promote a partial release. Failed/stale jobs are retained and prevent a completed release. Resume never steals a live coordinator's lease.

`python -B -m knowledge.library_analytics.product_control` interrupts only the process identified by the product database's PID and creation token. On Windows this terminates that analytics process: SQLite rolls back its uncommitted document transaction, and `--resume` recovers the abandoned job. Committed results remain. It never targets the intake, embedding or graph worker. Prefer Ctrl+C in a visible operator terminal for graceful cancellation.

`product_control --scope consumers` targets the consumer coordinator through its own PID/creation-token lease. Re-run `product_delivery` to reuse its committed stage checkpoints.

## Storage and ownership

Runtime databases live under `KnowledgeBase/library-analytics/pipeline/`:

| Store | Contents |
| --- | --- |
| `pipeline.sqlite3` | Existing LA-01/LA-02 facts and common exclusive analytics coordinator lease |
| `products.sqlite3` | Captured dimensions, checkpointed document features, address roles, XML links and LA-03 aggregates |
| `consumers.sqlite3` | Collection aliases, normalized coverage, contributor/collection vocabulary and containing-book XML reader links |

Input connections are read-only. The consumer connection attaches the parent with SQLite `mode=ro`. Original files, canonical registries, extraction caches, corpus, vectors, graph, generated public content and UI remain untouched. The worker uses below-normal CPU priority, bounded document batches, a decoded-block cache and on-disk SQLite sorting. It uses no encoder, model API or all-pairs chunk comparison.

Parent and consumer releases have separate manifests and latest pointers. `latest-analytical-release.json` joins the independently verified pair. Database tables retain historical generations: **never sum them without selecting a run**. Join job-keyed tables through `run_jobs`; run-keyed tables filter `run_id` directly. A verification failure leaves the final analytical pointer unchanged.

## Data contracts

| Table | Grain / interpretation |
| --- | --- |
| `document_dimensions` | One captured corpus document, including non-library kinds and documented archive exclusions; recorded identity assertions and validation flags remain separate |
| `document_contributors`, `contributor_identities` | Existing contributor IDs and roles; unresolved literal author labels remain labelled groups, not invented people |
| `reference_roles` | One selected LA-02 literal-address record with deterministic role/rule and parent evidence ID |
| `document_role_counts` | Document/role counts before chapter expansion |
| `scripture_matrix` | Document + canonical address bounds + reference kind + role; ranges remain ranges, with a source witness ID |
| `source_contribution` | Raw source channel/kind counts, characters, distinct validated existing work/edition IDs and recorded original-hash groups |
| `contributor_profiles` | Distinct completed document memberships, descriptive language/genre/channel/era counts, recorded roles, prose-candidate totals and containing-reader routes |
| `source_scripture`, `contributor_scripture` | Chapter associations produced by expanding declared address ranges across their chapter bounds; **not additive occurrence totals** |
| `analysis_coverage` | Explicit kind/language/status denominators and known citation coverage |
| `document_features`, `vocabulary_counts` | Library document token digest and full tracked lexical term counts, with cap and completeness metadata |
| `stratum_vocabulary`, `vocabulary_profiles` | Language/genre baseline counts and up to 64 descriptive terms per document |
| `normalized_text_groups` | Repeated normalized token-sequence digests; not byte duplicates or merge instructions |
| `reuse_signatures`, `reuse_candidates` | Bounded lexical evidence and likely-reuse pairs, with exact source block positions |
| `xml_assets`, `xml_entry_links` | Fresh original XML asset hashes, importer-compatible entry identities, structural paths and reconstructed-body correspondence states |
| `reader_links` | Same recorded original-hash links to containing books; route and first-bundle existence checks only |
| `source_collection_aliases`, `collection_contribution` | Explicit IA/TCP/CCEL/SWORD name aliases with raw channels retained; unknown channels remain unmapped |
| `source_chapter_profiles`, `collection_chapter_profiles`, `contributor_chapter_profiles` | Chapter associations divided by explicit completed-document denominators; both raw channel and normalized collection views available |
| `group_vocabulary` | Up to 64 terms per contributor/collection + recorded language + genre, computed from full complete lexical counts |
| `xml_reader_links` | Verified XML entry body + same recorded whole-asset hash → containing-book route; no inferred page alignment |

### Address roles

Rules separate SWORD `$$$` entry addresses, `Refs:` lists, isolated addresses, printed indexes, Bible-text addresses, dataset associations, catalogue/entity/documentation addresses and prose/reference-record candidates. A cross-block address stays a separate boundary-prose candidate. Every reference span is checked against its source text before classification.

These are explicit deterministic rules, not validated semantic classifiers. `prose_candidate` does not mean exposition, endorsement, speaker attribution or doctrinal agreement. Whole-library topic coverage cannot be inferred from English/early-English literal address matching; inherited unsupported-language cases remain explicit.

### Vocabulary and normalization

Tokens use Unicode alphanumeric matching plus NFKC/casefold. Numeric tokens remain in the sequence digest but are excluded from lexical counts, as are tokens longer than 40 characters. A document tracks at most 50,000 distinct lexical terms; untracked tokens and completeness are recorded. No stemming, translation, language detection or doctrinal labelling occurs.

For a compatible complete language/genre stratum with at least three documents:

`score = term_count / tracked_tokens × (ln((N + 1) / (document_frequency + 1)) + 1)`.

Distinctive rankings omit terms occurring in more than 80% of the stratum and require a count of at least three. Unmapped language, unknown/text/book genre or insufficient comparison population receives frequency-only terms with a null TF-IDF score. Group scores use the same whole-stratum baseline, with counts aggregated from full complete documents. Capped documents are excluded from group comparisons. Terms absent from top-64 exports still exist in `vocabulary_counts`.

`document_fraction = linked_documents / eligible_documents` controls for collection or contributor size. Source/collection denominators retain corpus kind; contributor denominators include every completed linked kind and are labelled accordingly. A chapter-spanning range contributes to each declared chapter association, so `associations_per_document` is not an independent quotation rate.

### Reuse and XML proof

Reuse retains at most 64 content-anchored 8-token phrase hashes per library document. Known KJV verse windows and selected boilerplate/numeric windows are filtered. Other editions/languages and cross-verse Bible quotations may remain. Candidate generation uses shared retained hashes in same-language buckets of 2–25 documents, at least four shared informative hashes, at least eight retained signatures and at least 100 tokens. Exact normalized digests are grouped separately. Signature overlap is `shared / min(retained signatures)`; it is **not unbiased MinHash/Jaccard**. No automatic merge or deletion occurs.

The ten shared reference XML assets reuse the original importer's entry-key and body adapters. A verified XML link requires the key and equal non-whitespace codepoint digests of reconstructed source text and current corpus entry chunks. That does not assign the containing XML file's SHA256 as a new per-entry original hash. Entry paths are namespace-independent structural locators; printed pages, reader pages and cache offsets are separate coordinates.

## Completion checks

Parent validation reconciles document scope, literal-address matrix totals, selected job states, input stability and SQLite integrity. Final independent verification checks every export hash/byte/row count, reconciles raw roles → document-role totals → matrix totals, reconciles full stored vocabulary rows and token counts against document features, checks lexical population and success checkpoints, rehashes captured metadata/XML and LA-02 input files, and resolves bounded address/reuse source witnesses. Witness checks establish locations, not semantic classification precision.

See [results](PRODUCTS-RESULT.md) and [SQL queries](product-queries.sql). Accepted identity corrections, unresolved holdings links, source-of-truth application and public consumer delivery remain LA-04 work.
