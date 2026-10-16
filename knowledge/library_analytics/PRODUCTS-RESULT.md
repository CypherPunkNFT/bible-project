# LA-03 analytical products: verified results

Completed and independently verified 2026-10-13T08:56:04.691126+00:00. Generation `la03-20261013T024336384123Z` consumes the validated LA-02 text bundle. No source metadata, corpus bodies, vectors, graph or UI were changed.

| Measure | Result |
| --- | ---: |
| Corpus records accounted for | 214,449 |
| Analysed / documented archive exclusions | 214,446 / 3 |
| Library documents with full lexical processing | 39,179 |
| Normalized tokens counted | 1,955,819,178 |
| Stored document/term count rows | 158,133,221 |
| Literal address records reconciled | 10,205,959 |
| Scripture matrix rows | 7,115,595 |
| Contributor profiles | 6,506 |
| Recorded source channels | 43 |
| Distinct validated existing work / edition IDs | 11,225 / 3,848 |
| Verified shared-XML entry links | 61,708 |
| XML entries with containing Teachers reader routes | 0 |
| Documents with containing on-site reader routes | 10,179 |
| Normalized token-sequence duplicate groups | 11 |
| Bounded lexical reuse candidates | 32,195 |
| Vocabulary-capped library documents | 159 |
| Known KJV phrase windows filtered from reuse | 504,063 |
| Partial citation-language coverage documents | 2,457 |
| Quality-flagged corpus documents | 2,580 |

## Delivered data

- Product database: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-analytics\pipeline\products.sqlite3`.
- Product exports and checksummed manifest: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-analytics\pipeline\product-releases\la03-20261013T024336384123Z`.
- Consumer database: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-analytics\pipeline\consumers.sqlite3`.
- Consumer exports and checksummed manifest: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-analytics\pipeline\consumer-releases\consumer-bb22e0daaa5ba562800fbe89`.
- Final verification: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-analytics\pipeline\product-releases\la03-20261013T024336384123Z\verification-with-consumers.json`.
- Latest pointers: `latest-products.json`, `latest-product-consumers.json`, `latest-analytical-release.json` under `KnowledgeBase/library-analytics/`.

| Consumer table | Rows |
| --- | ---: |
| `source_collection_aliases` | 43 |
| `collection_contribution` | 55 |
| `collection_chapter_profiles` | 50,347 |
| `source_chapter_profiles` | 53,863 |
| `contributor_chapter_profiles` | 1,134,868 |
| `group_vocabulary` | 472,918 |
| `xml_reader_links` | 0 |

## Address roles

| Role | Matches | Documents containing role |
| --- | ---: | ---: |
| `bible_text_address` | 10,591 | 602 |
| `boundary_prose_candidate` | 3,375 | 698 |
| `catalogue_address` | 4,637 | 3,995 |
| `cross_reference_list` | 81,077 | 5,992 |
| `documentation_address` | 507 | 51 |
| `entity_record_address` | 50,885 | 4,385 |
| `isolated_address` | 390,481 | 20,692 |
| `module_entry_address` | 239,287 | 28 |
| `prose_candidate` | 8,525,127 | 36,454 |
| `reader_voted_association` | 89,840 | 6,711 |
| `reference_record_candidate` | 379,367 | 13,355 |
| `scripture_index` | 227,924 | 269 |
| `source_dataset_association` | 202,861 | 42,555 |

## Verification and remaining limits

All 22 parent release files and 8 consumer release files passed SHA256/byte/row-count checks. All selected jobs have success checkpoints. Raw reference records, per-document role totals and matrix totals reconcile. 26 sampled role witnesses and 12 sampled reuse pairs resolve to their analysed source text. Source metadata and XML hashes remain unchanged.

Unresolved contributor groups: `[{"documents":1640,"entity_type":"unresolved-label","identities":138}]`. These remain raw labels or unknown IDs, not invented people. Canonical bindings retain their evidence basis; checking an existing work/edition ID is not independent authorship verification.

Verified source-entry provenance now covers 61,708 shared XML targets through entry identity plus matching source body; the original LA-02 gap history remains intact. 61,708 of these targets have no verified containing Teachers reader route. Entry-reader delivery remains pending and must use its existing metadata/UI owner. The prior LA-01 holdings gaps (9,652 held originals without a verified corpus-text link, ten unverified CSEL links, 621 unmapped language assertions) remain separate pending work. The 12,089 accepted canonical identity fields and six contributor resolutions remain unapplied; LA-04 owns those changes.

Prose roles are deterministic candidates, not proof of exposition, agreement or quotation authorship. Chapter profiles expand declared ranges and are not additive occurrence counts. Document fractions use explicit denominators to reduce collection-size bias. Group vocabulary uses complete tracked counts and compatible recorded language/genre strata; frequencies do not classify doctrine. Reuse overlap is a bounded content-anchored signature metric, not unbiased Jaccard; KJV filtering is partial and no text is merged or deleted. Reader routes identify containing books, not aligned reader pages.

See [product contracts and operation](PRODUCTS.md) and [analytical SQL](product-queries.sql). Public consumer application remains LA-04; this release is private.
