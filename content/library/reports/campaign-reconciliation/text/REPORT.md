# Text availability reconciliation

**5,033 pending candidates checked; 5,033 contain existing extractable text; 0 additional backlog gaps.** Existing text readiness is not a book count.

Recovered availability for **1 held work**, Perkins volume 3: **5,749,113 text characters**, **535 physical page locators**, **532 nonempty transcription pages**. One TXT derivative plus one page JSON file; three originals share the derivative. **0 new works/downloads/OCR operations**. The source OCR text was already searchable in other held representations; this repairs the scan-only PDF connection and preserves page locators.

**2 original gaps remain:** Bunyan's one-page image diagram; Carson's nine-page image article. Neither has usable existing local same-edition text. The diagram is not counted as a book. No substitution from another edition or inferred transcription.

SWORD: **102 held packages**, **102 existing exports available, all 102 connected in their existing acquisition manifests**. No additional exports or module promotions; existing source eligibility remains required.

Coordinator inputs: `acquisition-manifest.json`, `existing-ocr-completion/acquisition-manifest.json`, `page-dispositions.json`, `text-ready-inputs.json`, `unresolved-text-gaps.json`, `summary.json`. The existing importer requires the established OCR-ledger priority to reuse source-provided OCR over an empty PDF layer; the priority manifest records existing OCR reuse only.

Verified: original three source checksums match their provenance; IA object sequence 0000–0534 and PDF page count agree; the importer derivative adapter preserves all 535 page records. Existing OCR errors remain explicit. Original notices/contributors retained. No originals, catalog records, SOURCES.md, live manifests, intake code, databases, workers or schedulers changed. Intake and embedding were not started.
