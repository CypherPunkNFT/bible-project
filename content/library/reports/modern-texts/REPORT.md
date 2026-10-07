# Modern sermon texts and works acquisition

This collection preserves actual source files for private, noncommercial reading. It is separate from permission to host full text in the Bible Project app. The current counts below are regenerated from downloaded-file records and checked against files on disk.

**Current owner-directed scope: existing readable text first, acquired where permitted.** Piper HTML and offered EPUB/searchable-PDF library editions are being collected. New scans, OCR and audio transcription are deferred. See [author libraries](AUTHOR-LIBRARIES.md), [acquired PDF list](PDF-INVENTORY.md) and [source queue](SOURCE-QUEUE.md).

Updated 2026-10-05T22:24:15.368813+00:00. See [live job state](job-state.json) for running and finished phases.

| Collection | Records downloaded | Unique original files | PDF pages | Extracted words |
|---|---:|---:|---:|---:|
| John Piper messages and writings | 7,205 | 7,205 | 0 | 14,312,626 |
| John Piper book editions | 107 | 108 | 5,891 | 4,982,983 |
| Adrian Rogers | 609 | 610 | 8,718 | 4,140,132 |
| J. I. Packer | 9 | 9 | 26 | 18,280 |
| Billy Graham | 4 | 4 | 72 | 16,298 |
| R. C. Sproul books | 2 | 4 | 148 | 24,508 |
| Ready author libraries (individual authors in manifest) | 375 | 382 | 4,911 | 2,778,425 |
| Alistair Begg official sermon transcripts | 1,482 | 1,482 | 0 | 8,861,785 |
| Monergism curated reading editions (author review pending) | 1,478 | 1,478 | 0 | 153,300,724 |
| CCEL additional historical author editions | 145 | 146 | 0 | 37,575,953 |

Total: **11,428 original files**, **11,427 distinct file checksums**, **2,284,549,070 bytes**, **19,766 PDF pages** and **11,426 extracted text files**. Provenance sidecars, index pages and policy evidence are excluded from these content totals.

## Corpus boundaries and gaps

- Piper: the official author message inventory contains 2,397 entries. Short player descriptions are recorded as text gaps. Manuscripts are not asserted to reproduce delivery word for word. Articles, interviews and book downloads have separate inventories when their phases run. Coauthor cases require review.
- Rogers: 619 official transcript/outline landing pages. Several pages can offer the same PDF. The source manifests retain that relationship; file totals deduplicate repeated URLs. Publisher-labeled transcripts, outlines and uncertain classifications remain distinguishable.
- Packer: 27 entries in the C. S. Lewis Institute author category. Offered main PDF links are collected; audio-only entries and missing grants remain explicit. Article and interview PDFs are not counted as sermons. Coauthors and excerpts require work-level review.
- Graham: four identified official sermon/devotional PDFs. This is a discovery set, not a complete bibliography or a transcript counterpart to the audio archive. The research center holds further transcripts and manuscripts.
- Sproul: two titles offered by a distributor that states special permission from Ligonier. PDF and EPUB are two formats of the same book. The wider Crucial Questions store offer requires its download/checkout workflow; sermon transcript corpus permission remains unresolved.
- Criswell: the first official sitemap provides 2,000 sermon URLs; the advertised second and third sermon sitemap URLs returned 404. The public REST request returned 401. The complete 4,093-entry search archive has not been reconciled. Bulk text acquisition rights remain unresolved.
- MacArthur: the legacy policy expressly permits specified sermon-series transcript uses. Its content links redirect to the current site, whose wildcard robots rule disallows crawling. No bulk crawl or alternate-host workaround is enabled.
- Lloyd-Jones: the Trust states that text rights belong to publishers and its terms restrict systematic retrieval for a database. No transcript corpus has been acquired from that archive.

## Rights and editorial status

All acquired copies remain outside public publication. Personal-copy permissions do not establish public full-text hosting, public search, model-training or redistribution rights. See the [source queue](SOURCE-QUEUE.md) for unresolved access. No permission request has been sent. Selection of Graham, Rogers and Criswell for this acquisition does not silently change the broader Calvinist core-teaching roster.

Book samples are labeled `book-sample` and excluded from any assertion of complete book editions. Website dates, preaching dates printed inside PDFs, archive date labels and retrieval timestamps are kept distinct. Sermon audio has not been retranscribed by AI.

## Storage and verification

Original bytes: `BibleProject/sources/library/<source-id>/<asset-id>/`. Each file has its URL, retrieval time, byte count and SHA-256 in the [manifest](acquisition-manifest.json). Derived reading text is under `Website/.local/library/run-modern-texts-2026-10-05/text/`. Original bytes are never overwritten.

Source inventories and results are saved beside this report. Run `python -X utf8 scripts/report-modern-texts.py --verify` to check all original and derivative hashes. Run `python -X utf8 scripts/enrich-modern-texts.py` after the workers finish to regenerate Scripture and printed-date metadata without further downloads.

This acquisition ledger is a staging catalog, not a claim that every work has been integrated into the canonical catalog or the app search database. Record counts and extracted word totals are not counts of unique sermons or unique words.
