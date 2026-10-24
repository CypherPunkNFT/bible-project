#!/usr/bin/env python3
"""Pull the questions out of the scanned Internet Archive question books.

Reads the machine-read text under
raw/internet-archive-sunday-school-question-books/<item>/<item>_djvu.txt and writes
one extraction document to extracted/internet-archive-sunday-school-question-books.json,
with one bank per book.

Three shapes of question book appear in this batch, and each book is tried against
all three; the shape that yields the most questions that survive the quality gate
wins, and which one won is recorded with the bank.

  question-and-answer   Q. Who made the world? A. God made the world. Gen. i. 1.
  numbered              12. What did the king say?
  bare interrogative    What was Daniel's interpretation of the writing? 5 : 26.

The raw files are opened read-only and never modified.

Run: python tools/extract_question_books.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from question_book_ocr import (
    MAX_QUESTION_CHARS,
    after_last_marker,
    find_running_headers,
    leading_reference,
    heading_of,
    is_header,
    looks_like_question,
    normalise,
    page_numbers,
    recover_question_marks,
    split_reference,
    tidy,
    trim_to_opener,
)

CORPUS_ROOT = Path(__file__).resolve().parent.parent
SOURCE_ID = "internet-archive-sunday-school-question-books"
RAW = CORPUS_ROOT / "raw" / SOURCE_ID
EXTRACTED = CORPUS_ROOT / "extracted"
SAFE_IDENTIFIER = re.compile(r"^[A-Za-z0-9._-]+$")

# Q. ... ? A. ... up to the next Q. Bounded so a runaway match cannot walk the
# whole book, and run over one paragraph at a time rather than the whole text.
QA_PATTERN = re.compile(
    r"\bQ\s*[.:]\s*(?P<question>.{10,%d}?[?])\s*A\s*[.:]\s*(?P<answer>.{2,%d}?)"
    r"(?=\s*\bQ\s*[.:]|\s*$)" % (MAX_QUESTION_CHARS, MAX_QUESTION_CHARS),
    re.DOTALL,
)
NUMBERED_PATTERN = re.compile(
    r"(?:^|\s)(?P<number>\d{1,3})\s*[.)]\s*(?P<question>[A-Z].{10,%d}?[?])" % MAX_QUESTION_CHARS,
    re.DOTALL,
)
# A sentence that ends in a question mark, starting after the previous one ended.
BARE_PATTERN = re.compile(r"(?P<question>[^?]{10,%d}?[?])" % MAX_QUESTION_CHARS, re.DOTALL)


def read_book(identifier: str) -> tuple[list[str], list[int | None]]:
    """The book's lines and the printed page each one sits on."""
    if not SAFE_IDENTIFIER.match(identifier):
        raise ValueError(f"refusing unusual item identifier: {identifier!r}")
    folder = RAW / identifier
    matches = sorted(folder.glob("*_djvu.txt")) or sorted(folder.glob("*.txt"))
    if not matches:
        raise FileNotFoundError(f"no machine-read text under {folder}")
    text = normalise(matches[0].read_text(encoding="utf-8", errors="replace"))
    lines = text.split("\n")
    headers = find_running_headers(lines)
    return lines, page_numbers(lines, headers), headers


MAX_BLOCK_LINES = 60


def page_blocks(
    lines: list[str], pages: list[int | None], headers: set[str]
) -> list[tuple[str, int | None, str | None]]:
    """One block per printed page, carrying that page and the heading it falls under.

    Blocking by page rather than by blank line matters: in a question-and-answer
    book the scanner puts a blank line between the question and its answer, so a
    block that stops at the first blank line can never pair them up. A page is the
    smallest unit that reliably holds a whole question.

    Where no page number could be read, the block breaks on the next heading, or
    after MAX_BLOCK_LINES lines so a book with neither cannot become one block.
    """
    blocks: list[tuple[str, int | None, str | None]] = []
    buffer: list[str] = []
    block_page: int | None = None
    heading: str | None = None
    recovered = 0

    def flush() -> None:
        nonlocal buffer, recovered
        if buffer:
            text, count = recover_question_marks(" ".join(buffer))
            recovered += count
            blocks.append((text, block_page, heading))
            buffer = []

    for line, page in zip(lines, pages):
        if not line:
            continue
        if is_header(line, headers):
            continue
        found = heading_of(line)
        if found:
            flush()
            heading = found
            block_page = page
            continue
        if buffer and (page != block_page or len(buffer) >= MAX_BLOCK_LINES):
            flush()
        if not buffer:
            block_page = page
        buffer.append(line)
    flush()
    return blocks, recovered


def _record(
    question: str, answer: str | None, following: str, page, heading, number: int
) -> dict | None:
    """One question record, or None if it does not survive the quality gate.

    `following` is the text that comes straight after the question mark, which is
    where these books print the scripture reference.
    """
    question, reference = split_reference(
        trim_to_opener(after_last_marker(tidy(question)))
    )
    if not looks_like_question(question):
        return None
    if not reference:
        reference = leading_reference(following)
    if answer:
        answer, answer_reference = split_reference(tidy(answer))
        answer = answer.strip(" .;:") or None
        if answer and len(answer) > 600:
            answer = None
        reference = reference or answer_reference
    return {
        "number": number,
        "question": question,
        "answer": answer,
        "options": None,
        "reference": reference,
        "lesson": heading,
        "page": page,
    }


PATTERNS = {"qa": QA_PATTERN, "numbered": NUMBERED_PATTERN, "bare": BARE_PATTERN}
REFERENCE_WINDOW = 60


def extract(blocks, style: str) -> list[dict]:
    """Every question the chosen shape finds, in reading order."""
    pattern = PATTERNS[style]
    found: list[dict] = []
    seen: set[str] = set()
    for text, page, heading in blocks:
        for match in pattern.finditer(text):
            answer = match.groupdict().get("answer")
            following = text[match.end() : match.end() + REFERENCE_WINDOW]
            record = _record(
                match.group("question"), answer, following, page, heading, len(found) + 1
            )
            if not record:
                continue
            key = re.sub(r"[^a-z]", "", record["question"].lower())
            if key in seen:
                continue
            seen.add(key)
            record["number"] = len(found) + 1
            found.append(record)
    return found


def style_score(questions: list[dict]) -> int:
    """How much a shape is worth, not merely how much it finds.

    A question that comes with the answer the book printed is a complete record;
    one without is half a record, useful only to whoever already knows the answer.
    So an answered question counts twice. Picking on raw count alone threw away
    1,478 answered questions from the American Sunday School Union's own
    question-book in exchange for 177 unanswered ones - a clearly worse corpus
    that nonetheless scored higher.
    """
    return len(questions) + sum(1 for q in questions if q["answer"])


def extract_book(identifier: str) -> dict:
    lines, pages, headers = read_book(identifier)
    blocks, recovered_marks = page_blocks(lines, pages, headers)
    attempts = {style: extract(blocks, style) for style in ("qa", "numbered", "bare")}
    style = max(attempts, key=lambda s: style_score(attempts[s]))
    questions = attempts[style]
    for position, record in enumerate(questions, start=1):
        record["number"] = position
    with_page = sum(1 for q in questions if q["page"] is not None)
    with_reference = sum(1 for q in questions if q["reference"])
    with_answer = sum(1 for q in questions if q["answer"])
    raw_candidates = sum(len(PATTERNS[style].findall(text)) for text, _, _ in blocks)
    return {
        "bank_id": identifier,
        "question_count": len(questions),
        "style": style,
        "style_counts": {s: len(v) for s, v in attempts.items()},
        "candidates_before_quality_gate": raw_candidates,
        "question_marks_recovered_from_ocr": recovered_marks,
        "kept_share": round(len(questions) / raw_candidates, 3) if raw_candidates else 0.0,
        "with_page": with_page,
        "with_reference": with_reference,
        "with_answer": with_answer,
        "questions": questions,
    }


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not RAW.is_dir():
        raise SystemExit(f"nothing downloaded yet at {RAW}")
    banks = []
    for folder in sorted(p for p in RAW.iterdir() if p.is_dir()):
        try:
            bank = extract_book(folder.name)
        except Exception as error:  # noqa: BLE001 - one bad scan must not stop the run
            print(f"  FAILED {folder.name}: {error}", flush=True)
            continue
        banks.append(bank)
        print(
            f"  {folder.name[:40]:<40} {bank['question_count']:>5} kept  "
            f"({bank['kept_share']:>5.0%} of {bank['candidates_before_quality_gate']:>5})  "
            f"style={bank['style']:<9} ref={bank['with_reference']:>5} "
            f"ans={bank['with_answer']:>5} pg={bank['with_page']:>5}",
            flush=True,
        )

    EXTRACTED.mkdir(parents=True, exist_ok=True)
    target = EXTRACTED / f"{SOURCE_ID}.json"
    target.write_text(
        json.dumps(
            {
                "source_id": SOURCE_ID,
                "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "bank_count": len(banks),
                "question_count": sum(b["question_count"] for b in banks),
                "banks": banks,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"\n  {len(banks)} books, {sum(b['question_count'] for b in banks):,} questions "
        f"-> {target}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
