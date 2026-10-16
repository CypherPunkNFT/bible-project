# KR-102: source sections, corpus chunks and reader locations

This CPU processor joins a pinned, completed KR-101 section release to a named published corpus and a captured reader metadata generation. It writes private relational tables and reproducible exports under `KnowledgeBase/library-knowledge/connected-research/alignment/`. It does not write the corpus, vectors, graph, original sources, reader packages or UI.

The input population is every supported document/entry in the selected KR-101 release, with the inherited deferred and excluded populations accounted separately. Later acquisitions without KR-101 sections are outside this run. A corpus source path/hash conflict or missing document remains an unresolved alignment; matching titles or work IDs never substitutes for source identity. Reader candidates must have the same recorded original file hash. Different editions remain distinct, even when they share a work or title.

`alignment_contract.py` defines Unicode codepoint maps and tables. `section_alignment.py` captures scope/readers, runs durable document jobs, validates and exports a release, and supplies section-to-chunk/reader queries. It reuses the existing global analytics lease and JobStore checkpoints, with facts and checkpoints committed together in groups of at most 16 jobs. One below-normal-priority worker performs local text analysis. Successful resume jobs are reused; a changed corpus generation stops the run. Original/cache and reader-file dependencies bind the output to the selected bytes.

## Alignment and coverage

Literal identity and ordered chunk/reader parts retain exact character offsets. Whitespace-only normalization removes whitespace and changes neither case, accents nor punctuation; those maps remain **approximate**. A bounded equal-token-island fallback handles changed prose. It maps only unchanged monotone islands and retains omitted/changed content as partial or unresolved. It never interpolates a passage through a missing paragraph. Non-whitespace changes exceeding the 30,000-token comparison bound remain explicitly unresolved. These bounds prevent whole-book quadratic character comparisons.

Every mapped piece records source and target intervals, source/target literal hashes, a non-whitespace witness hash, method and precision. Source intervals stay within their KR-101 segment. Corpus chunks are checked against the existing content-address formula, so a changed title/boundary produces new chunk IDs rather than stale links. Coverage measures non-whitespace codepoints; omitted inter-chunk whitespace does not pretend missing prose. Reader coverage uses the best same-source reader, never sums duplicate copies. Native structures and unreviewed heading candidates keep their original states; exact prose alignment does not validate a candidate as a real chapter or imply author endorsement.

## Reader URLs are separate from reader coordinates

The current acquired reader opens at page one and does not consume a page/section selector from its URL. Verified reader spans therefore record page index, block index and character range, plus the page file hash. Navigation uses only the existing `/teachers/works/<id>` route, labelled **containing-book**. No invented `?page=` link, anchor or external reading destination is emitted. A permission-required/not-published reader has no offered body and remains unresolved as a reading destination. Source URLs, licence, credit and doctrinal warnings remain provenance metadata. Reader coordinates are ready for a later reader-owner integration; this processor does not alter that interface.

## Operation

From `Website/`, in native cmd.exe:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --calibrate
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --run --launch
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --run --resume --launch
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --status
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --query assurance
..\KnowledgeBase\.venv\Scripts\python.exe -m knowledge.library_analytics.section_alignment --section SECTION_VERSION_ID
```

Calibration selects source/format/adapter/reader/empty-text strata before population execution. It never promotes a release as population completion. `--limit` interrupts after the requested documents and needs `--resume`; it is for recovery/calibration, not a substitute for the full run. Heading queries exclude document roots and unreviewed candidates by default; `--include-candidates` opts in explicitly. Query responses cap detailed spans at 20 and say so. SQL accesses the complete population without that presentation limit.

Outputs include `alignment.sqlite3`, `alignment-progress.json`, launch/log receipts and `releases/<run>/`. Completed, structurally passing full runs promote `latest-alignment.json`. Release exports include document receipts, section-chunk pieces, section-reader pieces, navigation destinations, coverage/status, map methods/reasons, full inherited scope and file dependencies, followed by a summary and SHA256 manifest. No body copies are added to the derived database.

## Tables and checks

| Table | Purpose |
| --- | --- |
| `alignment_scope` | Entire selected KR-101 descriptor population, including inherited deferrals/exclusions |
| `section_index` | Selected section versions and retained kind/review/identity state |
| `corpus_documents`, `corpus_chunks` | Named-generation metadata and content-address/body-hash proofs |
| `alignment_maps` | Representation-specific method, matched islands and unresolved reason |
| `section_chunks` | Source segment to exact or normalized corpus chunk intervals |
| `section_reader_spans` | Source segment to page/block/character coordinates and page-file proof |
| `section_destinations` | Honest existing route and separate location/navigation state |
| `section_alignment_status` | Precision, covered/expected codepoints and unresolved reasons per section |
| `alignment_documents`, `alignment_inputs` | Atomic document completion receipts and source dependencies |

Validation requires supported-document and section accounting, completed jobs, bounded spans, no coverage overcount, stable dependencies/corpus generation and SQLite integrity. It independently reopens selected original/cache bytes and actual named-generation chunk or reader-page bodies across coordinate/precision strata, checking each side's literal hash and exact/normalized equality. This measures deterministic location correctness; it does not claim human semantic review or relevance accuracy. Focused tests exercise Unicode and whitespace edges, repeated prose, cross-page sections, title/ID changes, missing prose, normalization, different-source editions, nonpublic readers, corpus replacement and atomic failure/resume.

Final embedding is not a dependency for these text/location tables. Vector mining, public export and full-current-library claims retain their separate coverage, identity, permission and quality gates.
