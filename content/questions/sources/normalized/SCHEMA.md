# The common question format

Every question bank in batch 2 of this corpus is rewritten into the one record shape
described here, so that banks that arrived as a PDF, a MySQL dump, a web page, JSON Lines
and a trivia API can be read with a single piece of code.

**The raw files are never altered.** This folder is written from
[../extracted/](../extracted/), which is itself written from [../raw/](../raw/) by the
scripts in [../tools/](../tools/). Nothing here is processed into questions of our own, and
nothing is wired into the website.

## One record

```json
{
  "id": "danielkorsah-bible-trivia-game:database-seed:52",
  "source_id": "danielkorsah-bible-trivia-game",
  "bank_id": "database-seed",
  "number": 52,
  "question": "What was the name of the bronze serpent Moses made in the wilderness?",
  "answer": "Nehushtan",
  "options": ["Nehushtan", "Seraph", "Leviathan", "Basilisk"],
  "reference": null,
  "licence": "MIT, with a LICENSE file in the repository (Copyright (c) 2026 Daniel Korsah)",
  "licence_class": "open",
  "publishable": true,
  "publishable_reason": "MIT licensed. Publishable, on condition the copyright and permission notice travels with it: Copyright (c) 2025 Eric Sakala.",
  "attribution": "MIT requires the copyright notice and permission notice to be included: Copyright (c) 2025 Eric Sakala.",
  "attribution_source_id": "brianchanda-bible-quiz",
  "source_url": "https://github.com/BRIANCHANDA/Bible-Quiz",
  "attribution_required": true,
  "question_origin": "human-written"
}
```

| Field | Meaning |
|---|---|
| `id` | `source_id:bank_id:number`, unique across the corpus |
| `source_id` | which source it came from; matches the folder name under [../raw/](../raw/) and the key in [../manifest.json](../manifest.json) |
| `bank_id` | which bank within that source, since several sources hold more than one |
| `number` | the question's own number in its bank, as published where the source numbers them |
| `question` | the question text, whitespace collapsed, otherwise as published |
| `answer` | the answer text. For multiple-choice banks this is the correct option resolved from whatever index or letter the source used |
| `options` | the full choice list, or `null` for an open-answer question. A source that supplies only the answer gets `null`, never a one-item list |
| `reference` | scripture reference(s) where the source has them, `null` otherwise. Formatting is the source's own, so these are not yet normalised to one citation style |
| `licence` | what the source states, in short form |
| `licence_class` | `open`, `public-domain`, `copyleft-attribution`, `permission-granted-non-commercial`, or `no-licence-stated`. (Before 2026-10-17 the last of these was `unclear-research-only`; it was renamed because under the owner's publishing rule a missing licence no longer means research-only.) |
| `publishable` | `true` means this text may go on the public website. As of 2026-10-17 every record in the corpus is `true`, so this is a record of the verdict, not a filter that removes anything |
| `publishable_reason` | **the field that matters now.** Why this record is publishable, in the words of the rule that decided it |
| `attribution` | the credit line this record owes, ready to use |
| `attribution_source_id` | whose terms govern the record. Normally the same as `source_id`; it differs for the 244 Hugging Face records that reproduce ministry-to-children.com questions and are therefore governed by that site's CC BY-SA 4.0 |
| `source_url` | where the governing source lives |
| `attribution_required` | whether credit must be given when it is used |
| `question_origin` | `human-written`, `template-generated`, or `ai-generated` |

Fields that only some sources have — difficulty, category, proof-text structures, the
answer exactly as published, the keyword a Bible filter matched on — are **not** dropped.
They stay in that source's file under [../extracted/](../extracted/), which keeps everything
the source gave.

## Reading it safely

[all-questions.json](all-questions.json) holds every batch-2 question in this shape.

**Do not reach for a `publishable` filter: as of the owner's rule of 2026-10-17 it removes
nothing.** All 5,387 batch-2 records and all 102,670 batch-3 records are publishable, and
no record in this corpus is held back on licence grounds. Writing the filter and getting
everything back teaches the wrong lesson, so here is the right one:

> The licences are still mixed. The obligation moved from **excluding** records to
> **crediting** them.

```python
import json

data = json.load(open("normalized/all-questions.json", encoding="utf-8"))

# Every record is publishable; what varies is what it owes.
needs_credit = [q for q in data["questions"] if q["attribution_required"]]
share_alike  = [q for q in data["questions"] if q["licence_class"] == "copyleft-attribution"]
```

As of 2026-10-17, of the 5,387 batch-2 records: **3,869 require attribution** and **794
carry CC BY-SA share-alike**, which anything built from them inherits. Each record names
its own obligation in `attribution`, `attribution_source_id` and `source_url`, so a credit
line can be built from the record alone without joining back to the manifest.

Two further things worth knowing rather than assuming:

- `publishable` describes the **licence**, not the quality of the text. The 96,545
  batch-3 questions read off nineteenth-century page scans are publishable and also
  unproofread; see [SCHEMA-BATCH-3.md](SCHEMA-BATCH-3.md).
- 244 of the 1,290 Hugging Face records reproduce ministry-to-children.com questions
  verbatim. They are governed by that site's CC BY-SA 4.0, not by the uploader's stated
  Apache-2.0, and their `attribution_source_id` says so. The count is asserted in
  [../tools/normalize.py](../tools/normalize.py).

The rule itself, and what it decided for each source, is recorded at the top of
[../manifest.json](../manifest.json) and in [../MANIFEST.md](../MANIFEST.md).
