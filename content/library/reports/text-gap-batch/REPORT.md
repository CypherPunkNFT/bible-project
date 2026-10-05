# Ready-text acquisition: remaining named gaps

2026-10-05. Three complete source-offered text files acquired; three existing Zwemer PDF text layers extracted. No new scans, OCR, audio transcription or model transcription. This is a bounded acquisition batch, not completion of the entire library.

## Downloaded text

| Category | Work | Source and exact edition | Local original |
|---|---|---|---|
| L12 ministry | William Carey, *An Enquiry into the Obligations of Christians…* | [Gutenberg 11449](https://www.gutenberg.org/ebooks/11449), complete electronic text with notices | [Read text](../../../../../sources/library/source-gutenberg/asset-text-gap-carey-pg11449-txt/11449-0.txt) |
| L07 doctrine | Stephen Charnock, *The Existence and Attributes of God*, volumes 1 and 2 | [Gutenberg 53527](https://www.gutenberg.org/ebooks/53527), both volumes in one file; separate from the catalog's 1840 scan | [Read text](../../../../../sources/library/source-gutenberg/asset-text-gap-charnock-pg53527-txt/53527-0.txt) |
| L09 apologetics | Charles Hodge, *What Is Darwinism?* | [Gutenberg 19192](https://www.gutenberg.org/ebooks/19192); historical argument, not a current scientific reference | [Read text](../../../../../sources/library/source-gutenberg/asset-text-gap-hodge-pg19192-txt/19192.txt) |

Total: **4,293,407 original bytes**. All three files preserve the source's electronic notices, author identification and end markers. The [acquisition manifest](acquisition-manifest.json) records exact mirror URLs, timestamps, hashes and catalog IDs. Three asset records and one distinct Charnock edition were added; published selections were not changed.

## Existing L10 text made directly readable

| Zwemer work | PDF pages processed | Local extracted text | Pages with fewer than 80 text characters |
|---|---:|---|---|
| *The Moslem Christ* | 107 | [Read text](../../../../.local/library/text-gap-batch/asset-l10-zwemer-christ-pdf/readable.txt) | 70, 95 |
| *The Moslem Doctrine of God* | 62 | [Read text](../../../../.local/library/text-gap-batch/asset-l10-zwemer-god-pdf/readable.txt) | None |
| *The Disintegration of Islam* | 131 | [Read text](../../../../.local/library/text-gap-batch/asset-l10-zwemer-lectures-pdf/readable.txt) | 8, 35, 76 |

Each extraction retains PDF page boundaries and a machine-readable page map. Original PDFs were hash-verified and unchanged. These are existing text layers, which can contain OCR errors, ordering defects or missing image-only content; processing all pages does not prove complete or accurate transcription. The five low-text pages remain flagged, not automatically assigned new OCR. Historical descriptions of Islam remain attributed to Zwemer, with the L10 quotation and contextual-source qualifications unchanged. See [extraction provenance](existing-text-extractions.json).

## Reused bulk sources and remaining work

- **63 shared CCEL transcriptions** were hash-verified locally, including the existing Calvin commentary collection; no duplicate downloads. Their acquisition and permission records remain in the [shared text inventory](../text-backlog/REPORT.md).
- Gutenberg identifies the three acquired ebooks as public domain in the USA. Named files were retrieved from the already-established XMission mirror, following the [documented mirror route](https://www.gutenberg.org/policy/robot_access.html). This batch does not authorize worldwide redistribution or remove Gutenberg notices.
- Modern official transcript inventories and permission-dependent sources remain with the [modern-text source queue](../modern-texts/READY-TEXT-SOURCES.md). Freely readable content is not automatically licensed for bulk copying or republication.
- Books marked excerpt-only, commercial, partial or unresolved in the shared inventory still need appropriate text sources or rights decisions. Existing downloaded OCR still needs selective quality review; no claim of full proofreading is made.

## Resume and verification

Run `python -X utf8 scripts/acquire-text-gap-batch.py` offline to verify saved originals, rebuild catalog records and regenerate local Zwemer text. `--fetch` is only needed for first-time missing named files. The script verifies existing hashes before reuse and never overwrites an unmanifested original. Acquired bytes, source identity, ebook end markers, parent PDF hashes, extracted page counts and all 63 reused CCEL hashes were checked. Full library schema/reference validation passes.

Raw texts stay under `BibleProject/sources`; derived Zwemer text stays under `Website/.local/library/text-gap-batch`. The catalog and this report are committed; the raw and derived corpora are not copied into the public repository.
