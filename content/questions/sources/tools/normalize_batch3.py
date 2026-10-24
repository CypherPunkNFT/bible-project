#!/usr/bin/env python3
"""Rewrite the batch-3 extractions into the corpus's one common record shape.

Reads extracted/<source>.json for the two batch-3 sources and writes
normalized/<source>.json plus normalized/all-questions-batch3.json. Batch 1 and
batch 2 are not touched: in particular normalized/all-questions.json, which job
412 wrote, is left exactly as it is, and this batch gets its own file beside it.

The shape is job 412's, described in normalized/SCHEMA.md, with two fields added
that these books have and the earlier batches did not: the printed page a question
came from, and the lesson heading it sits under. Those are described in
normalized/SCHEMA-BATCH-3.md.

Run: python tools/normalize_batch3.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

CORPUS_ROOT = Path(__file__).resolve().parent.parent
EXTRACTED = CORPUS_ROOT / "extracted"
NORMALIZED = CORPUS_ROOT / "normalized"

# Both batch-3 sources are works published before 1929 in the United States, so
# both are in the public domain there. What differs is the state of the text.
LICENCE = {
    "internet-archive-sunday-school-question-books": {
        "licence": (
            "Public domain in the United States: every item was published before 1929. "
            "Scanned and hosted by the Internet Archive and its contributing libraries."
        ),
        "licence_class": "public-domain",
        "publishable": True,
        "attribution_required": False,
        "publishable_reason": (
            "Published before 1929 in the United States, so public domain. Publishable; no obligation attached. Courtesy credit to the scanning library and the Internet Archive. The constraint on this source is the quality of the machine-read text, not its terms."
        ),
        "attribution": (
            "Public-domain scans of 67 pre-1929 question books, hosted by the Internet Archive and its contributing libraries. No credit is required; the courtesy credit is the book and the scanning library."
        ),
        "source_url": "https://archive.org/",
        "question_origin": "human-written",
        "note": (
            "Nobody holds rights in these texts. The Internet Archive adds no licence of "
            "its own to a public-domain scan, and 49 of the 67 items carry either an "
            "explicit NOT_IN_COPYRIGHT marking or the Library of Congress's statement "
            "that it knows of no copyright restriction; the rest are silent, which for a "
            "pre-1929 American imprint is the ordinary case rather than a doubt. "
            "Courtesy, not law, suggests crediting the scanning library. "
            "THE REAL CONSTRAINT IS NOT THE LICENCE BUT THE TEXT: this is machine-read "
            "text off nineteenth-century paper, so a share of every bank carries "
            "misread words. Nothing here should go in front of a reader until it has "
            "been checked against the page image, which is why the scan is kept beside "
            "the text."
        ),
    },
    "gutenberg-sunday-school-question-books": {
        "licence": (
            "Public domain in the United States (all eight works published before 1929); "
            "transcriptions supplied by Project Gutenberg, whose boilerplate is stripped"
        ),
        "licence_class": "public-domain",
        "publishable": True,
        "attribution_required": False,
        "publishable_reason": (
            "Published before 1929 in the United States, so public domain. Publishable; no obligation attached. Credit the book rather than Project Gutenberg, whose trademark terms apply only to its own boilerplate, which the extraction strips."
        ),
        "attribution": (
            "Public-domain transcriptions of eight pre-1929 question books, supplied by Project Gutenberg. No credit is required, and Project Gutenberg asks NOT to be credited once its boilerplate is stripped: credit the book itself."
        ),
        "source_url": "https://www.gutenberg.org/",
        "question_origin": "human-written",
        "note": (
            "Project Gutenberg asks that its trademark not be used once its boilerplate "
            "is removed, which is exactly what the extraction does, so credit the book "
            "rather than Project Gutenberg - the same conclusion job 412 reached for the "
            "Baltimore Catechism. These are human transcriptions, not machine-read scans, "
            "so the text is clean and needs no proofreading pass. Readers outside the "
            "United States should check their own term of copyright, as the Gutenberg "
            "header itself warns."
        ),
    },
}


def normalise_source(source_id: str) -> dict:
    document = json.loads((EXTRACTED / f"{source_id}.json").read_text(encoding="utf-8"))
    verdict = LICENCE[source_id]
    records = []
    for bank in document["banks"]:
        for question in bank["questions"]:
            records.append(
                {
                    "id": f"{source_id}:{bank['bank_id']}:{question['number']}",
                    "source_id": source_id,
                    "bank_id": bank["bank_id"],
                    "number": question["number"],
                    "question": question["question"],
                    "answer": question["answer"],
                    "options": question["options"],
                    "reference": question["reference"],
                    "page": question["page"],
                    "lesson": question["lesson"],
                    "licence": verdict["licence"],
                    "licence_class": verdict["licence_class"],
                    "publishable": verdict["publishable"],
                    "publishable_reason": verdict["publishable_reason"],
                    "attribution": verdict["attribution"],
                    "attribution_source_id": source_id,
                    "source_url": verdict["source_url"],
                    "attribution_required": verdict["attribution_required"],
                    "question_origin": verdict["question_origin"],
                }
            )
    return {
        "source_id": source_id,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "schema": "see normalized/SCHEMA.md and normalized/SCHEMA-BATCH-3.md",
        "question_count": len(records),
        "licence_note": verdict["note"],
        "questions": records,
    }


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    NORMALIZED.mkdir(parents=True, exist_ok=True)
    everything = []
    for source_id in LICENCE:
        document = normalise_source(source_id)
        target = NORMALIZED / f"{source_id}.json"
        target.write_text(
            json.dumps(document, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        everything.extend(document["questions"])
        print(f"  {source_id:<46} {document['question_count']:>7,} -> {target.name}", flush=True)

    combined = NORMALIZED / "all-questions-batch3.json"
    combined.write_text(
        json.dumps(
            {
                "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "schema": "see normalized/SCHEMA.md and normalized/SCHEMA-BATCH-3.md",
                "batch": "batch_3",
                "note": (
                    "Batch 3 only. Batch 2 has its own combined file, all-questions.json, "
                    "which this run does not touch."
                ),
                "question_count": len(everything),
                "publishable_count": sum(1 for q in everything if q["publishable"]),
                "with_answer": sum(1 for q in everything if q["answer"]),
                "with_reference": sum(1 for q in everything if q["reference"]),
                "with_page": sum(1 for q in everything if q["page"] is not None),
                "questions": everything,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"\n  {len(everything):,} questions in {combined.name} "
        f"({sum(1 for q in everything if q['answer']):,} with an answer, "
        f"{sum(1 for q in everything if q['reference']):,} with a scripture reference)",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
