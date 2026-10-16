# LA-02 result — CPU text analysis

**Complete and independently verified.** Bundle `la02-bundle-3a0a9d446b24028b`, completed 2026-10-13T00:10:08.455412+00:00 UTC. Captured corpus build: `2026-10-07T23:00:34.844772+00:00`. All **214,449 documents across 11 current corpus kinds** are accounted for; no processing failures. Catalogue, entity and dataset documents are separate from book holdings.

| Population | Analysed documents | Excluded documents | Characters | Literal reference matches |
| --- | ---: | ---: | ---: | ---: |
| Library text/review | 39,179 | 3 | 11,844,198,998 | 9,209,958 |
| Reference datasets | 152,716 | 0 | 132,730,920 | 677,703 |
| Other corpus records | 22,551 | 0 | 167,913,757 | 318,298 |
| Total | 214,446 | 3 | 12,144,843,675 | 10,205,959 |

**Actual derived data:** 675,157 existing cache/chunk blocks analysed; 4,478,805 structure records; 400,847 reference rejections; 15,578,677 rows across six result tables. Private exports/summaries total **17.29 GB**. The SQLite database retains prior generations: select only this bundle's three component run IDs.

**Quality:** 2,580 documents flagged for review, including 2,560 repetition flags, 11 replacement-character flags, 7 control-character flags and 2 empty-text flags. Flags can overlap and do not diagnose bad OCR. Repetition is a lower-bound metric for 304 documents.

**Unresolved coverage:** 2,457 documents need language-specific citation grammar/numbering; 61,708 document-level original-XML structure gaps remain. These are not counts of missing books/files. 3 documented archive exclusions remain. Held-but-unlinked acquisitions from LA-01 remain outside this corpus snapshot. Match totals include prose references, cross-reference lists, printed indexes and module entry addresses; LA-03 must distinguish their roles before ranking passage discussion.

**Verification:** source counts, reference counts, input-file stat guards and SQLite integrity passed in all three runs. Independent release checks verified 24 files and their row counts. Across 490 sampled documents, 573 reference examples yielded 574 verified source spans and 20 original XML locators, with zero errors. Eleven source excerpts also received bounded interpretation review; no corpus-wide precision percentage is claimed. **25 focused tests passed**, including resume, legacy-result reuse, path changes, failure isolation, exact boundary spans, export tampering and failed-release gates.

**Outputs:** `KnowledgeBase/library-analytics/latest-text-bundle.json` selects the completed generations in `pipeline/pipeline.sqlite3`; the bundle summary and `result.json` are under `pipeline/text-bundles/la02-bundle-3a0a9d446b24028b/`. Each component has six JSONL tables, a failure ledger, summary and checksummed manifest in `pipeline/text-releases/<run-id>/`. Verification receipts are in `pipeline/text-validations/`. Programs and SQL are in `Website/knowledge/library_analytics/`.

**Preservation and next:** no live corpus, vector, graph, reader or canonical metadata was changed. The embedding progress file independently reports complete: 8,458,873 indexed and 0 remaining. LA-03 is next: build role-aware Scripture matrices, contributor/source profiles and reuse candidates from these real tables.
