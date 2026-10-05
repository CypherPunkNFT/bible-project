# Library OCR completion

Audited **4,737 acquired PDFs / 121,755 pages**, with **0 read errors**. Ran **3 local OCR workers** and recovered **21 approved pages in 10 documents**, yielding **9,901 OCR words**. Filesystem PDF count still matches the audit snapshot: **True**.

This completes the identified straightforward printed-text OCR jobs in the acquired-PDF snapshot. It does not certify every word or mean every cataloged work has been acquired. No new books or scans were downloaded. Original PDFs and old derived texts remain unchanged. Output is for the existing private reading scope; no public hosting or search permissions changed.

## Recovered reading text

| Work | Recovered PDF pages | Reading file |
|---|---|---|
| D. A. Carson review of Ridderbos, Matthew, and Newman and Stine, A Translator's Handbook on the Gospel of Matthew | 1, 2 | [TXT](../../../../.local/library/ocr-completion/text/pdf-1523c061fd472c758959/readable.txt) |
| Recent Reprints (D. A. C.) | 1, 2 | [TXT](../../../../.local/library/ocr-completion/text/pdf-40c0bf2b5d99f136b651/readable.txt) |
| Living by the Sermon on the Mount (Don Carson) | 1, 2, 3 | [TXT](../../../../.local/library/ocr-completion/text/pdf-86c7725bf5191e6f6098/readable.txt) |
| Book review: N. T. Wright, The New Testament and the People of God | 3 | [TXT](../../../../.local/library/ocr-completion/text/pdf-bb3cfa01b905d7437b20/readable.txt) |
| Recent Reprints | 1 | [TXT](../../../../.local/library/ocr-completion/text/pdf-575e6db50433605d3bca/readable.txt) |
| Paul's mission and prayer (Donald A. Carson) | 1, 2, 3, 4, 5, 6 | [TXT](../../../../.local/library/ocr-completion/text/pdf-aa42a3fe34d5344164a7/readable.txt) |
| D. A. Carson article - final bibliography page | 11 | [TXT](../../../../.local/library/ocr-completion/text/pdf-0dc92ab496fa83408c01/readable.txt) |
| Cross | 224 | [TXT](../../../../.local/library/ocr-completion/text/pdf-b8727e42fde3477c68de/readable.txt) |
| The Future of Justification | 7, 8, 240 | [TXT](../../../../.local/library/ocr-completion/font-repair/readable.txt) |
| The Supremacy of Christ in a Postmodern World | 192 | [TXT](../../../../.local/library/ocr-completion/text/pdf-2da4f5257286ae4fa90d/readable.txt) |

## Font repairs

- The Future of Justification: [repair evidence](font-repair.json) and [reading text](../../../../.local/library/ocr-completion/font-repair/readable.txt). These repairs preserve readable source text without re-OCR of the whole work.
- Christian Truths in a Postmodern World: [repair evidence](tgc-font-repair.json) and [reading text](../../../../.local/library/ocr-completion/font-repair/carson-christian-truth-postmodern-world.normalized.txt). These repairs preserve readable source text without re-OCR of the whole work.

## What remains outside this pass

- Historical Internet Archive scans: reuse the existing OCR and clean alternate editions in [the crosswalk](text-alternatives.json); difficult exact-edition restoration remains deferred. A low-text historical page is not automatically an OCR assignment.
- One nine-page Carson chapter with grainy mixed English/Greek, two copies of one dense rotated-header matrix, one Arabic names chart, and one music-score/lyrics layout remain explicitly deferred. See [page decisions](page-dispositions.json).
- Covers, photographs, blank pages, chapter dividers and sparse final outline pages were distinguished from missing prose. Repeated Rogers cover templates were classified by wording and position with representative visual checks; other named suspect groups were visually reviewed.
- Minor pre-existing OCR errors, punctuation, diacritics, table relationships and ordinary proofreading remain. This is recovery of identified text gaps, not scholarly collation.

## Verification and reuse

Every recovered page retains original-PDF hash, physical page number, rendered-image hash, OCR engine/language, region geometry and derived-text hash. Multi-column magazine regions were corrected and rerun after boundary QA. [TGC quality review](tgc-ocr-quality.json) records remaining limits; selected source-verified corrections affect only new derived reading text.

[Full audit](pdf-audit.json) · [Page dispositions](page-dispositions.json) · [OCR results](ocr-results.json) · [Reproducible decisions](ocr-decisions.json) · [Summary](summary.json)

Rebuild recovery with `python -X utf8 scripts/complete-library-ocr.py --decisions content/library/reports/ocr-completion/ocr-decisions.json --workers 3`; Windows English OCR is required. Existing successful OCR regions are reused. The complete PDF audit is resumable via `scripts/audit-library-ocr.py`.
