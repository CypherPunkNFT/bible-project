# The common question format — what batch 3 adds

Batch 3 uses the record shape job 412 defined in [SCHEMA.md](SCHEMA.md), unchanged,
plus **two fields**. This file describes only the difference; read
[SCHEMA.md](SCHEMA.md) first for everything else.

The batch-2 file [all-questions.json](all-questions.json) is **not** touched by batch 3.
Batch 3 has its own combined file, [all-questions-batch3.json](all-questions-batch3.json),
beside it.

## The two added fields

| Field | Meaning |
|---|---|
| `page` | the printed page number the question appeared on, or `null`. Only the scanned books have it, and only where a running page header could be read — 72,611 of the 96,545 scanned records, which is 75%. It is the page **printed on the paper**, not the position in the PDF, so the two can differ by a few leaves of front matter. |
| `lesson` | the lesson, chapter or topic heading the question sits under, or `null`. In a Sunday school question book this is the unit of teaching — "Lesson XXV", "The End of Saul's Reign" — and it is what groups a run of questions into one sitting. |

Batch-2 records have neither field. A reader handling both batches should treat a
missing key the same as `null`.

## Licence fields: both batches carry the same set

Since the owner's publishing rule of 2026-10-17, batch-3 records carry the same licence
and credit fields as batch 2 — `publishable`, `publishable_reason`, `attribution`,
`attribution_source_id` and `source_url` — so the superset relationship described above
still holds and a reader needs no special case.

Every batch-3 record is `publishable: true`, and none of them requires attribution:
both sources are pre-1929 American imprints in the public domain. The `attribution`
field still carries a courtesy credit, and for the Project Gutenberg source it records
that Project Gutenberg asks *not* to be credited once its boilerplate is stripped —
credit the book instead.

**`publishable` is about the licence, not the text.** It says nothing about whether the
machine-read text is right, which for the 96,545 scanned records is the real constraint.

## Why they are here

The brief for this batch asked for the page, and it earns its place: a question read
off a nineteenth-century scan can be wrong, and the page number plus the page-image PDF
kept beside the text is how anyone checks it against what was actually printed. The
lesson heading came free with the parsing and is the natural way to present these
questions, since that is how the books themselves arrange them.

## One record

```json
{
  "id": "internet-archive-sunday-school-question-books:childsscriptureq00amer:73",
  "source_id": "internet-archive-sunday-school-question-books",
  "bank_id": "childsscriptureq00amer",
  "number": 73,
  "question": "What were their names?",
  "answer": "Sodom, Gomorrah, Admah, and Zeboiim",
  "options": null,
  "reference": "Gen. xiv. 2",
  "page": 10,
  "lesson": "Lesson IIL",
  "licence": "Public domain in the United States: every item was published before 1929. …",
  "licence_class": "public-domain",
  "publishable": true,
  "attribution_required": false,
  "question_origin": "human-written"
}
```

`bank_id` is the Internet Archive item identifier for the scanned books and `pg<number>`
for the Project Gutenberg ones, so every record points back at a fetchable source.

## Reading it safely

Every batch-3 question is `publishable: true`, because every work in the batch was
published before 1929 in the United States and is therefore out of copyright. **That is
a statement about the licence and not about the text.** The 96,545 questions from
[internet-archive-sunday-school-question-books.json](internet-archive-sunday-school-question-books.json)
are machine-read off old paper and a share of them carry misread words. Filtering on
`publishable` is not enough for that source:

```python
import json

data = json.load(open("normalized/all-questions-batch3.json", encoding="utf-8"))

# Clean text, ready to read: human transcriptions, with the printed answer.
clean = [
    q for q in data["questions"]
    if q["source_id"] == "gutenberg-sunday-school-question-books" and q["answer"]
]

# The scanned books: check each against its page image before showing it to anyone.
needs_proofreading = [
    q for q in data["questions"]
    if q["source_id"] == "internet-archive-sunday-school-question-books"
]
```

The page image for any scanned record is the PDF in
`raw/internet-archive-sunday-school-question-books/<bank_id>/<bank_id>.pdf`, and the
`page` field says which leaf to turn to.
