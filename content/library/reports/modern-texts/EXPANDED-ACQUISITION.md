# Expanded ready-text acquisition campaign

Snapshot: 2026-10-05T13:52:52.462463+00:00. Downloads continue; consult [live report](REPORT.md) and [worker state](expanded-job-state.json).

The owner authorized broad collection from credible sources. Originals are private reading copies; source records and recommendation decisions remain separate. No OCR, audio transcription, purchases, permission emails, or public full-text publication are part of this campaign.

## Actual holdings in the modern/expanded acquisition ledgers

| Collection | Saved original files | Extracted words | PDF pages |
|---|---:|---:|---:|
| John Piper messages and writings | 1,875 | 7,471,519 | 0 |
| John Piper book editions | 31 | 1,755,038 | 2,145 |
| Adrian Rogers | 542 | 3,696,958 | 7,729 |
| J. I. Packer | 9 | 18,280 | 26 |
| Billy Graham | 4 | 16,298 | 72 |
| R. C. Sproul books | 4 | 24,508 | 148 |
| Ready author libraries (individual authors in manifest) | 382 | 2,778,425 | 4,911 |
| Alistair Begg official sermon transcripts | 211 | 1,258,137 | 0 |
| Monergism curated reading editions (author review pending) | 31 | 3,724,099 | 0 |
| CCEL additional historical author editions | 9 | 1,605,548 | 0 |

Total in these ledgers: **3,098 files**, **22,348,810 extracted words**, **15,031 PDF pages**. These are not totals for the entire Bible Project library. File counts include retained low-text originals; records, sermons, unique works and editions are not interchangeable. HTML/EPUB pages are not invented. The live report separates status, samples and duplicates.

## Source execution and remaining boundaries

- **Carson / TGC:** inventory processed: 369 readable files, seven low/no-text files, three failed URLs. The ten book download links are included; do not describe all publications as books or sermons.
- **Monergism:** 1,571 author-index hyperlinks resolve to 1,568 unique book pages and 472 index author labels (labels need identity reconciliation). Running EPUB-first acquisition, round robin by author. Offered download URL deduplication avoids already-held copies. Source curation justifies acquisition screening, not automatic admission of every author or work to recommended Reformed teaching. One URL containing literal spaces needs a repair pass; URL encoding was corrected for subsequent requests.
- **Piper / Desiring God:** current offered-book downloads are running. The supervisor then resumes the unfinished 2,397-message inventory and collects author articles/interviews. A Windows file replacement failure interrupted the earlier sermon run; unique temporary names and bounded file-lock retry now protect checkpoints. This was not an access restriction. Books keep sample labels; EPUB is preferred when offered. The landing-page book inventory is not claimed as a complete bibliography.
- **Rogers / Love Worth Finding:** resumed all 619 inventoried transcript/outline pages. Existing PDF text layers only; outlines remain distinguishable from transcripts.
- **Begg / Truth For Life:** running through 3,067 official clean sermon sitemap URLs. Only explicitly attributed Begg pages with a substantial transcript are acquired; no-transcript and other-author pages remain explicit gaps. Passage, date, publication date, series label and duration are preserved from page metadata when supplied. Series position is not inferred.
- **CCEL:** 229 work-page candidates from 17 existing eligible historical author indexes. Offered complete ThML XML is preferred; previously acquired editions are reused by canonical URL path. This is additional acquisition, not the first CCEL holdings. Edition/translation review and detailed section indexing remain separate.
- **Ligonier:** user is willing to create a free account. Await sign-in confirmation to obtain the $0 Crucial Questions EPUBs through the official store workflow. No account was created and no checkout was submitted.
- **McGee / Thru the Bible:** current website moved to a public app. Its current Terms and Conditions prohibit automated scraping. Bulk retrieval requires permission review; no attempt to bypass this restriction and no permission message sent. See [access decision](ttb-current-access-decision.json).
- **MacArthur / Logos:** commercial sermon package remains a licensed acquisition/export question. No purchase or purported bulk export was performed.
- **Lloyd-Jones / MLJ Trust:** no systematic retrieval under its restrictive database terms. Separately offered eligible Monergism editions are in the reading-copy collection.
- **Graham / Criswell:** existing bounded holdings and inventories are retained. No newly verified complete authorized text dump; not counted as acquired bulk corpora.

## Durability and verification

- Collectors use cached source bytes, durable JSON ledgers, originals, source URLs, SHA-256 hashes and derived readable text. EPUB text follows spine order; no per-document model calls are used.
- Site robots and crawl delays are observed. Access/rate responses stop collection; absent text and errors are recorded instead of invented.
- [New-collection verification](expanded-validation-snapshot.json) checked every original and derived file then present in the Begg, Monergism and CCEL expansion ledgers with zero checksum issues. Later files are checked by the live reporter for existence/size; the supervisor schedules a full hash check when workers finish.
- [Collector](../../../../scripts/collect-expanded-libraries.py) runs with --source begg, monergism-library, or ccel-expansion. Failed entries require review before retry. Scripts live under Website/scripts; background process IDs and logs are in expanded-job-state.json.
- Remaining catalog work: reconcile same-work editions, author identity variants, publication genres, book samples, source-specific rights, series completeness and core recommendation eligibility. Acquired text is not automatically published or presented as reviewed teaching.
