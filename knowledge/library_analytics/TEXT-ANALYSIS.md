# LA-02: CPU text analysis

**12 October 2026 — all three populations complete and independently verified.** [Measured results](TEXT-RESULT.md). The completed bundle covers all 214,449 current corpus documents across eleven kinds; held acquisitions outside that corpus snapshot remain separate.

Run: `la02-20261012T210730047404Z`. Captured population: **39,182 documents**, comprising 39,167 library texts and 15 review-labelled texts. Existing extraction caches total **12,270,824,824 bytes**. The baseline index represents the library-text population as 8,030,136 chunks; this processor analyses unfragmented cache blocks rather than reading eight million fragment bodies again. Three documented excluded-author originals are explicitly excluded from text analysis.

## Programs and real data tables

| Module | Output |
| --- | --- |
| `quality.py` | Character/script distributions, replacement/control-character rates, repeated lines/blocks, explicit metric coverage and flags |
| `structure.py` | PDF extraction ordinals, EPUB section locators, raw page markers, heading candidates, and original XML divisions/headings/page breaks with IDs and verified original hashes |
| `references.py` | Numeric candidate scan using the existing `CitationParser`, canonical bounds, exact source spans, chapter/verse/range/index-entry types and rejections |
| `text_pipeline.py` | Frozen scope capture, content fingerprints, durable job execution, validation and private exports |
| `verify_text.py`, `verify_release.py` | Independent bounded witness checks and streaming export hash/count verification |
| `bundle_text.py`, `report_text.py` | Completion finalizer, combined consumer pointer, quality aggregates and measured result report |

Runtime tables added to `KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3`:
`text_runs`, `text_scope`, `document_quality`, `document_sections`, `literal_references`, `reference_rejections`, `reference_coverage`, `text_processing_gaps`, `text_input_files`.

The baseline and LA-01 releases remain intact. Filter all analytical rows through `run_jobs.run_id`; development processor versions and other generations remain in the database and must not be added together.

## Operating commands

From `Website/`:

```powershell
D:\Python\python.exe -B -m knowledge.library_analytics run-text --resume --run <unfinished-run-id>
D:\Python\python.exe -B -m knowledge.library_analytics text-status
D:\Python\python.exe -B -m knowledge.library_analytics validate-text --run la02-20261012T210730047404Z
```

`--limit 100` interrupts after a throughput calibration; resuming processes the entire captured population. Processor-version changes invalidate affected job fingerprints; an unfinished run is not allowed to silently reuse an incompatible extractor. Completed output generations remain separate from this run's working rows.

The explicit corpus-chunk adapter processed **152,716 reference documents**, completed run `la02-20261012T232700486013Z`. Its initial adapter path-type error was fixed before any reference jobs were recorded, and the captured generation was explicitly resumed. A third completed run, `la02-20261013T000348763331Z`, processed the remaining **22,551 documents**: `authored_document`, `bible`, `guide`, `library_catalog`, `person`, `place`, `project_document` and `study`. These are dataset/site documents, not additional book counts. The continuation/finalizer serializes ownership and does not retry failed processing. State is private in `pipeline/text-continuation.json`, `text_runs` and `text-progress.json`.

Private live status: `KnowledgeBase/library-analytics/pipeline/text-progress.json`. Durable process ownership and completed-job checkpoints are in `pipeline.sqlite3`. Successful final output will be under `pipeline/text-releases/<run-id>/`, with `summary.json`, six table exports, a failed-job ledger and checksummed release manifest. `KnowledgeBase/library-analytics/latest-text-analysis.json` is promoted only if the generation passes validation.

## Evidence and interpretation

- Cache references retain the cache path, block ordinal, locator, decoded-text SHA256 and exact Unicode code-point offsets. Printed-index entries retain separate heading and entry witnesses rather than an ever-growing quotation.
- Corpus references retain chunk IDs, text hashes and offsets. Cross-chunk references require the same document and section and preserve two separate spans; synthetic separator whitespace is not claimed as printed text.
- Original XML locators use local tag names and sibling ordinals, with XML IDs where present. They are namespace-independent XPath-style paths: consumers must resolve local names, rather than treating them as namespace-bound XPath expressions. No original-XML-to-cache offset alignment is inferred.
- PDF extraction ordinals, raw printed-page markers and reader-page numbers are distinct. A marker labelled `unlabeled` is unknown pagination, not a confirmed printed-page label. Heading patterns are candidates, not automatically established chapter identities.
- The reference register uses project KJV bounds for validation and retains **unknown edition / unspecified numbering**. Language-specific grammar/numbering beyond English aliases remains explicitly partial; zero matches do not prove an absence of references.
- Repeated-line tracking is bounded at 50,000 distinct hashes per document. Above that bound, the repetition metric is labelled a lower bound. Quality thresholds flag review opportunities; they do not diagnose bad OCR or establish theological positions.
- Original XML structure requires a fresh original hash match and has a 64 MiB input bound. Missing, unsupported or oversized markup is a recorded structural gap; existing cached text can still be analysed. A cache block above the 64 MiB bound is a failed input, retained in the ledger.
- Literal citations do not establish quotation authorship, agreement, doctrinal endorsement or thematic completeness. Public-use decisions remain with existing source policy and the later consumer/application stage.

## Verification and current limitations

The accelerated scanner was compared with the existing parser on 1,000 modern chunks and 500 additional text samples, including historical long-s spellings. Comparisons covered canonical reference tuples and source offsets; they are not a corpus-wide precision estimate. **Ten text tests passed**, including end-to-end recovery, offsets, markup, long whitespace, malformed Unicode ordinals, coordinate dependencies and exact two-chunk boundary evidence. Together with twelve refinement and three warehouse tests, the total is **25 passed**. Windows temporarily refused PowerShell/Node process launches; the command-shell launcher subsequently ran the corrected tests successfully. This was an operating-environment failure, not an approval-review rejection.

Independent sampled witness verification is available through `python -B -m knowledge.library_analytics.verify_text --run <run-id>`. It checks source text hashes, exact slices and original XML local-name paths, while distinguishing a sample check from corpus-wide citation precision. Documents are sampled across source/language/adapter strata before reading references, avoiding a sort of millions of witness rows. Receipts are private under `pipeline/text-validations/`. `verify_release --run <run-id>` independently streams exported bytes and row counts against the producer's checksummed manifest and persisted completion state. Both checks passed for the library release; its post-completion witness sample checked 142 spans and 20 original XML locators without errors.

A bounded interpretation review inspected eleven English, early-English, Latin and Greek examples across seven source families. They contained recognizable Biblical addresses; one Greek SWORD example was a module entry heading, and one CCEL example was a printed index entry. **Literal match counts include these roles.** LA-03 must distinguish entry addresses, index entries and prose/cross-reference occurrences before constructing discussion rankings. This review is qualitative, not a statistical precision estimate. Its private receipt is `text-validations/la02-20261012T210730047404Z-interpretation-review.json`.

`bundle_text --finish --runs <library-run> <reference-run> <other-run>` waits for successful completion, verifies new releases/witnesses and creates the combined private contract and `latest-text-bundle.json`. It requires disjoint document-kind scopes, validated releases, matching verification receipts and post-completion witness checks. The completed bundle is `la02-bundle-3a0a9d446b24028b`. `latest-text-analysis.json` selects just the latest individual generation; consumers needing all populations must use the bundle's component run IDs.

Input fingerprints include cache/corpus paths, original paths and recorded original-hash assertions: identical bytes at a changed path must not reuse obsolete witness locations. Earlier verified jobs are reused only when their captured coordinate fields still match freshly checked inputs. Local preparation errors enter the failed/stale ledger while unrelated documents finish; software/control failures still stop the coordinator. Source bodies remain uncopied.

The scanner preserves unrecognized ordinal witnesses as rejections, isolates each selected reference from unrelated malformed citations, and retains the original parser's overlapping-match behavior. Existing graph data was inspected: its latest pilot scans 120 documents/66,867 chunks and does not establish whole-library coverage. Its pure parser and bounds are reused; the graph writer is not invoked and existing graph observations are preserved.

The Windows priority setter was corrected to use proper handle-width signatures. The active worker was creation-token-verified and set to **BelowNormal**. One CPU worker operates with bounded SQLite cache and per-document atomic result/checkpoint commits. No encoder, vector writer, intake refresh, model call or deployment is started by this package.

**Library results:** 39,179 completed documents, three documented exclusions, 11,844,198,998 characters, 267,049 text blocks, 4,068,849 structure records, 9,209,958 literal reference matches, 361,404 rejections and zero failed jobs. All 39,182 scoped documents are accounted for; counts and SQLite integrity passed. The six data exports plus summary/failure ledger total approximately 15.49 GB. There are 1,312 language-specific citation-coverage gaps and three archive exclusions, rather than failed text processing.

**Completed results:** all 214,449 scoped documents are accounted for: 214,446 analysed, three documented exclusions, zero failed jobs. The selected releases contain 12,144,843,675 characters, 675,157 analysed blocks, 4,478,805 structure records, 10,205,959 literal matches and 400,847 rejections. Independent checks verified 24 output files and their counts; 573 sampled references yielded 574 verified source spans and 20 original XML locators with no errors. Exported data/summaries total 17.29 GB.

**Remaining analytical coverage:** 2,457 documents have partial language-specific citation grammar/numbering coverage; 61,708 document-level original-XML structure gaps are classified `original-xml-hash-not-verified`. These are not counts of missing books or unique files. Quality flags affect 2,580 documents, including two empty-text records. LA-03 must reconcile shared-source/entry identities and distinguish citation roles before discussion rankings. Canonical correction batches remain unapplied; vectors, graph and UI remain unchanged by this package.
