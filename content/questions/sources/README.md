# Sources — every question bank we downloaded

The raw material the site's questions come from: every question bank, quiz set, catechism and Sunday school book
downloaded so far, with what was pulled out of each. **Nothing in this folder is on the site as it is.** A question
reaches the site only through the bank build and its checks ([../README.md](../README.md)).

Moved here on 2026-10-24 from `Research/BibleQuizCorpus/`, so that every question lives under
[content/questions/](../README.md).

## What is in each folder

| Folder | What it holds | In git? |
|---|---|---|
| [MANIFEST.md](MANIFEST.md) | **The register**: every source, where it came from, its licence, who wrote the questions, whether it may be published, and its files with checksums. Read this before using any source. | yes |
| [manifest.json](manifest.json) | The same facts for scripts | yes |
| raw/ | The downloads exactly as fetched (1.2 GB): web pages, page scans and their machine-read text, data files | no (too large) |
| extracted/ | Questions pulled out of each download, one file per source | no |
| normalized/ | The same questions in one common record shape ([SCHEMA.md](normalized/SCHEMA.md), [SCHEMA-BATCH-3.md](normalized/SCHEMA-BATCH-3.md)); `all-questions.json` and `all-questions-batch3.json` are what [build-question-bank.py](../../../scripts/build-question-bank.py) reads | the two schema notes only |
| output/ | One spreadsheet (CSV) per source of its finished question list, for the data-intake dashboard | no |
| [tools/](tools/) | The download, extraction and register scripts | yes |
| work/ | Model-run folders for the extraction tools (BatchRunner items and replies) | no |

"Not in git" means it lives only on this PC: the 1.5 GB of downloads would swamp the site's repository. The site never
reads this folder, and the local preview server does not watch it.

## The four batches

| Batch | Downloaded | What | Where it stands |
|---|---|---|---|
| 1 | 2026-10-16 | Open Biblical Dataset, BibleQA, BibleData | BibleQA and BibleData mined into new questions ([../mined/](../mined/README.md)); the Open Biblical Dataset is pastoral answers, not quiz questions |
| 2 | 2026-10-17 | Twelve quiz banks and catechisms (trivia sets, Baptist and Reformed catechisms, the Baltimore Catechism) | In the bank where publishable and in the site's doctrinal scope; Roman Catholic left out (owner, 2026-10-22) |
| 3 | 2026-10-17 | 75 Sunday school question books before 1929 (Internet Archive scans, Project Gutenberg texts) | Typed texts in the bank (Hurlbut, Mezger, Stump); scans held back, as machine-read text needs proofreading |
| 4 | 2026-10-23 | **Children's sources**: Ministry-to-Children lessons, unfoldingWord Open Bible Stories, the Boston *Child's Bible Question Book* (1880), *A Catechism for Little Children* (1864), Boyce's catechism (1885), plus Manly (1864) and the Sunday-School Union book from batch 3 | **Extracted and tagged, 7,326 questions** in [../children/children-batch4.json](../children/README.md); not on the site yet |

Each batch has its own section in [MANIFEST.md](MANIFEST.md), with its findings on licences.

## The tools

| Tool | What it does |
|---|---|
| [fetch_ministry_to_children_lessons.py](tools/fetch_ministry_to_children_lessons.py) | Fetched the 1,528 Ministry-to-Children lesson pages, one request every 2 seconds |
| [extract_trivia.py](tools/extract_trivia.py), [extract_catechisms.py](tools/extract_catechisms.py) | Batch 2: questions out of the quiz banks and catechisms |
| [extract_question_books.py](tools/extract_question_books.py), [extract_gutenberg_question_books.py](tools/extract_gutenberg_question_books.py), [question_book_ocr.py](tools/question_book_ocr.py) | Batch 3: questions out of the scanned and typed books |
| [normalize.py](tools/normalize.py), [normalize_batch3.py](tools/normalize_batch3.py) | Into the common record shape |
| [apply_publishing_rule.py](tools/apply_publishing_rule.py) | Marks each record publishable or not by the owner's rule of 2026-10-17 |
| [build_output.py](tools/build_output.py) | The per-source spreadsheets in output/ |
| [build_manifest.py](tools/build_manifest.py), [build_manifest_batch3.py](tools/build_manifest_batch3.py), [source_metadata.py](tools/source_metadata.py), [source_metadata_batch3.py](tools/source_metadata_batch3.py) | Write the register |
| [children_batch4.py](tools/children_batch4.py) | Batch 4: the children's sources pulled out by Claude Sonnet (scans a section at a time, lessons' review questions) and tagged; see [../children/README.md](../children/README.md) |

Run each from this folder (`python tools/<name>.py`).

## Adding a source

Download it into raw/<source-id>/ with a RETRIEVAL-NOTES.txt (where from, when, the licence as stated), add it to
MANIFEST.md, and extract it. A new bank in normalized/ stops the bank build until it is listed in `BANKS` or
`LEFT_OUT` in [build-question-bank.py](../../../scripts/build-question-bank.py), so nothing is taken in or dropped
without a decision. Every source the site uses must also be on [SOURCES.md](../../../SOURCES.md).
