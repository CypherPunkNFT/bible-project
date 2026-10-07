# Modern-preacher holdings audit

Snapshot: October 5, 2026, 8:30 a.m. Eastern. Piper acquisition continued after this snapshot. This report counts files actually present, not inventory URLs, policy pages, bibliographic entries, or prospective acquisitions.

## Recent-preacher collection

| Author | Sermons / messages actually held | Other material | Extracted words | Actual PDF pages |
|---|---|---|---:|---:|
| John Piper | 418 substantial written messages | None in this batch | 1,491,515 | — HTML |
| Adrian Rogers | 277 publisher-labeled transcript PDFs; 3 outline/other PDFs | Outline and supplementary matter included | 2,198,661 | 4,409 |
| Billy Graham / BGEA | 3 published sermon texts | 1 ministry hymn compilation, with other contributors | 16,298 | 72 |
| J. I. Packer | 0 sermon transcripts | 9 article/interview/excerpt PDFs | 18,280 | 26 |
| R. C. Sproul | 0 sermon transcripts | 2 books, each in PDF and EPUB | 24,508 | 148 |
| John MacArthur | 0 | 0 | 0 | 0 |
| W. A. Criswell | 0 | 0 | 0 | 0 |
| Martyn Lloyd-Jones | 0 | 0 | 0 | 0 |
| Sinclair Ferguson | 0 | 0 | 0 | 0 |
| D. A. Carson | 0 | 0 | 0 | 0 |
| Alistair Begg | 0 | 0 | 0 | 0 |
| John Murray | 0 | 0 | 0 | 0 |
| J. Vernon McGee | 0 | 0 | 0 | 0 |

Total: **715 original files, 3,749,262 extracted words, 295 PDFs containing 4,655 pages**. The remaining originals are 418 HTML files and 2 EPUB files. EPUB versions of the two Sproul books are excluded from word totals to avoid counting the same books twice. SHA-256 verification of all 715 originals and existing derivative text files found no mismatches.

“Words” means mechanically counted text tokens, including headings, Scripture quotations, outlines and repeated material. These are not unique words or independently verified author-only prose. HTML has no fixed page count. No estimated pages are substituted for actual PDF pages.

## What the numbers show

1. **The collection is substantial but severely unbalanced.** Piper and Rogers contribute 98.42% of the recent-preacher text. Five author/ministry groups have files; eight rows above have none. Good file volume is not broad author coverage.
2. **Inventory has exceeded acquisition for several important authors.** Criswell's 2,000 discovered URLs are not downloaded sermons. The canonical catalog has 12 Piper asset records, 12 Sproul asset records and one Packer asset record, but none of those records has a local asset path. They must not be added to these holdings as extra downloads.
3. **Piper is the productive ongoing route.** Of the fixed 2,397-entry source inventory, 432 entries had been checked: 418 substantial texts, 12 text gaps and 2 authorship-review cases. That is 17.44% acquired, with 1,965 entries still unchecked at this snapshot. Messages can include sermons, addresses and other occasions; no claim that all are Sunday sermons or verbatim audio transcripts.
4. **Rogers is the largest existing usable text corpus here.** The 280 PDFs already have extracted text, so no new OCR is needed. They came from 276 landing pages. Audio identifiers establish 259 distinct sermon IDs; 17 landing pages still need identity reconciliation. The 277 transcript-document count is not a verified count of 277 unique sermons. Of 619 inventoried pages, 285 were checked, including 9 with no offered download; 334 remain unchecked. Further PDF gathering is stopped.
5. **The smaller holdings are modest.** Packer's nine documents include excerpted interviews and book selections; two Time with God documents derive from the same interview occasion. Sproul has only two short books. Graham has only three sermon publications. None is a complete corpus or complete biblical series.
6. **Attribution needs care.** Of the 16,298 words in the Graham ministry group, 7,229 belong to the three sermon publications and 9,069 to Hymns for the Soul. The latter credits hymn writers, George Beverly Shea and other material: those 9,069 words must not be presented as Billy Graham's sermon words.
7. **Integrity is checked; editorial completeness is not.** No exact-byte duplicates were found in this snapshot, but alternate editions, overlapping excerpts, repeated sermon content, preaching-date completeness and passage coverage have not all been reconciled. These recent acquisitions remain in the staging ledger, not fully integrated into the app's canonical full-text search.

## Small-collection detail

| Author / group | Title | Words | PDF pages |
|---|---|---:|---:|
| Graham | How to Find Christ | 1,564 | 3 |
| Graham | The Only Way | 2,025 | 4 |
| Graham | Prayer | 3,640 | 20 |
| BGEA / multiple contributors | Hymns for the Soul | 9,069 | 45 |
| Packer | Time with God: An Interview with J.I. Packer | 2,911 | 5 |
| Packer and Gary A. Parrett | What Is True Christianity? | 575 | 1 |
| Packer | Mother Teresa: Holiness in the Dark | 5,784 | 7 |
| Packer | Time with God | 1,450 | 2 |
| Packer | A Profound and Biblically Theocentric Theologian | 2,009 | 3 |
| Packer | Self Disclosure & Knowledge | 1,470 | 2 |
| Packer | Paraclete & Spiritual Gifts | 1,550 | 2 |
| Packer | General Revelation & Guilt | 1,045 | 2 |
| Packer | Revelation & Interpretation | 1,486 | 2 |
| Sproul | What Is the Church? | 13,232 | 82 |
| Sproul | What Is the Great Commission? | 11,276 | 66 |

## Earlier twentieth-century authors already acquired in other missions

These belong to the broader library and should not disappear from a report about the 1900s. They are books/lectures, not newly acquired sermon transcripts.

| Author | Held works | Words | PDF pages |
|---|---|---:|---:|
| Louis Berkhof | New Testament Introduction | 118,851 | 360 |
| Geerhardus Vos | The Teaching of Jesus Concerning the Kingdom of God and the Church | 32,796 | 220 |
| B. B. Warfield | The Plan of Salvation | 33,420 | 150 |
| Samuel M. Zwemer | The Moslem Christ; The Moslem Doctrine of God; The Disintegration of Islam | 132,241 | 300 |

These add six works in nine original files, 317,308 words and 1,030 PDF pages. Word counts use the existing source-supplied text/OCR or embedded text layer. No new OCR was performed; text accuracy remains unreviewed. The full paths and individual counts are in [earlier-twentieth-century-holdings.json](earlier-twentieth-century-holdings.json).

Combined snapshot across the two tables: **724 original files, 4,066,570 extracted words and 5,685 PDF pages**. This is not the entire historical library and excludes Spurgeon and other pre-1900 collections.

## Sources and continuation

The focused follow-up has identified existing HTML texts for Begg, Carson, Sproul and Ferguson, plus short Graham transcript clips. See [ready text sources](READY-TEXT-SOURCES.md) for concrete destinations, genre distinctions and current acquisition status. Finding those pages does not increase acquired-file counts.

- [Frozen audit data and per-document counts](holdings-audit.json)
- [Earlier twentieth-century file paths and counts](earlier-twentieth-century-holdings.json)
- [Live acquisition report](REPORT.md)
- [Recent-preacher PDF inventory](PDF-INVENTORY.md)
- [Ready text source queue](READY-TEXT-SOURCES.md)

Original recent-preacher files are in `BibleProject/sources/library/`. Derived text is in `Website/.local/library/run-modern-texts-2026-10-05/text/` and `audit-text/`. The collection manifests preserve exact original paths, URLs, checksums and retrieval timestamps.
