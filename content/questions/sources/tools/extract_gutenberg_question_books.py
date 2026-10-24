#!/usr/bin/env python3
"""Pull the questions out of the Project Gutenberg question books.

These are human transcriptions rather than scans, so each one has a reliable
printed shape and gets its own small parser instead of the guesswork the scanned
books need. Reads raw/gutenberg-sunday-school-question-books/pg<N>.txt and writes
extracted/gutenberg-sunday-school-question-books.json, one bank per book.

Gutenberg's own licence boilerplate is cut off at the START and END markers before
anything is parsed, so none of it reaches the extraction.

The raw files are opened read-only and never modified.

Run: python tools/extract_gutenberg_question_books.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from question_book_ocr import looks_like_question, normalise, split_reference, tidy

CORPUS_ROOT = Path(__file__).resolve().parent.parent
SOURCE_ID = "gutenberg-sunday-school-question-books"
RAW = CORPUS_ROOT / "raw" / SOURCE_ID
EXTRACTED = CORPUS_ROOT / "extracted"

START = re.compile(r"\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*", re.I)
END = re.compile(r"\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*", re.I)

BOOKS = {
    9912: {
        "title": "An Explanation of Luther's Small Catechism (Stump, 1907)",
        "parser": "trailing_question_list",
        "published": "1907",
        "note": "Questions are printed as a numbered review list after each section, "
                "with the answers in the exposition above rather than beside them.",
    },
    13274: {
        "title": "A Little Catechism, with Little Verses and Little Sayings for Little "
                 "Children (John Mason, 1692)",
        "parser": "quest_answ",
        "published": "1692 (this transcription from a later printing)",
        "note": "The oldest book in the batch; spelling and capitalisation are the "
                "transcriber's faithful copy of the original.",
    },
    14553: {
        "title": "A Catechism of Christian Doctrine, No. 3 (Baltimore Catechism No. 3, 1885)",
        "parser": "q_a_numbered",
        "published": "1885",
        "note": "The volume job 412 did not take: it holds Nos. 1 and 2, this is No. 3, "
                "the two-year post-confirmation course.",
    },
    14554: {
        "title": "An Explanation of the Baltimore Catechism of Christian Doctrine "
                 "(Kinkead, 1891)",
        "parser": "q_a_starred",
        "published": "1891",
        "note": "Kinkead's explanation restates every Baltimore question and answer and "
                "then comments on it, so the question-and-answer pairs are complete.",
    },
    29067: {
        "title": "Hurlbut's Bible Lessons for Boys and Girls (Jesse Lyman Hurlbut, 1903)",
        "parser": "hurlbut",
        "published": "1903",
        "note": "Story-comprehension questions on the Bible narrative, grouped by lesson, "
                "each with its answer. The closest match in the whole batch to what the "
                "brief asked for.",
    },
    34520: {
        "title": "Bible Readings for the Home Circle (Review and Herald, 1914)",
        "parser": "bible_readings",
        "published": "1888, this edition 1914",
        "note": "Every answer is a quoted scripture with its reference, so this book "
                "yields the highest share of referenced questions in the batch. The "
                "doctrinal slant is Seventh-day Adventist and shows in the topic choice.",
    },
    36081: {
        "title": "Luther's Small Catechism Explained in Questions and Answers "
                 "(Sverdrup, 1900)",
        "parser": "italic_numbered",
        "published": "1900 (translated from the Norwegian)",
        "note": "Each answer is followed by its scripture proofs, which are kept out of "
                "the answer text and recorded as the reference.",
    },
    53465: {
        "title": "Lessons in the Small Catechism of Dr. Martin Luther, Senior Department "
                 "(Mezger, 1912)",
        "parser": "trailing_question_list",
        "published": "1912",
        "note": "Review questions after each lesson, without answers beside them.",
    },
}


def body(text: str) -> str:
    """The book itself, with Gutenberg's header and footer removed."""
    start = START.search(text)
    end = END.search(text)
    return text[start.end() if start else 0 : end.start() if end else len(text)]


def _emit(question: str, answer: str | None, lesson: str | None) -> dict | None:
    question, reference = split_reference(tidy(question))
    if not looks_like_question(question):
        return None
    answer_reference = None
    if answer:
        answer, answer_reference = split_reference(tidy(strip_markup(answer)))
        answer = answer.strip(" .;:") or None
        # A caption where the answer should be is not an answer.
        if answer and ILLUSTRATION.match(answer):
            answer = None
    return {
        "number": 0,
        "question": question,
        "answer": answer,
        "options": None,
        "reference": reference or answer_reference,
        "lesson": lesson,
        "page": None,
    }


def q_a_numbered(text: str) -> list[dict]:
    """Q. 559. What is...? / A. The Canon... - the Baltimore Catechism's shape."""
    pattern = re.compile(
        r"Q\.\s*(\d{1,4})\.\s*(?P<question>.+?\?)\s*\n\s*A\.\s*(?P<answer>.+?)(?=\n\s*\n|\nQ\.)",
        re.DOTALL,
    )
    return [
        record
        for match in pattern.finditer(text)
        if (record := _emit(match.group("question"), match.group("answer"), None))
    ]


def q_a_starred(text: str) -> list[dict]:
    """*122 Q. Which are...? / A. The attributes... - Kinkead's shape."""
    pattern = re.compile(
        r"\*?\d{0,4}\s*Q\.\s*(?P<question>.+?\?)\s*\n\s*A\.\s*(?P<answer>.+?)(?=\n\s*\n)",
        re.DOTALL,
    )
    return [
        record
        for match in pattern.finditer(text)
        if (record := _emit(match.group("question"), match.group("answer"), None))
    ]


def quest_answ(text: str) -> list[dict]:
    """Quest. Who made you? / Answ. GOD. - John Mason's shape."""
    pattern = re.compile(
        r"_?Quest(?:ion)?\._?\s*_?(?P<question>.+?\?)_?\s*\n\s*_?Answ?(?:er)?\._?\s*"
        r"(?P<answer>.+?)(?=\n\s*\n|\n\s*_?Quest)",
        re.DOTALL | re.IGNORECASE,
    )
    return [
        record
        for match in pattern.finditer(text)
        if (record := _emit(match.group("question"), match.group("answer"), None))
    ]


def hurlbut(text: str) -> list[dict]:
    """=8.= With what people...? =The Philistines.= grouped under Lesson headings.

    The transcription carries the pronunciation marks of the printed book as
    bracketed codes inside the words ([)I][s+]'ra-el-[=i]tes); those are stripped
    back to plain letters here, because a question nobody can read is no use.
    """
    # The pronunciation codes contain '=' characters, which are also the marker
    # this book wraps its answers in, so they have to go before anything is
    # matched - otherwise every answer is cut short at its first marked name.
    text = strip_pronunciation(text)
    lesson_pattern = re.compile(r"^Lesson\s+([IVXLC]+)\.\s*(.{0,70})$", re.MULTILINE)
    lessons = [(m.start(), f"Lesson {m.group(1)} {tidy(m.group(2))}".strip())
               for m in lesson_pattern.finditer(text)]
    pattern = re.compile(
        r"=(\d{1,3})\.=\s*(?P<question>.+?\?)\s*=(?P<answer>.+?)=", re.DOTALL
    )
    found = []
    for match in pattern.finditer(text):
        lesson = None
        for position, label in lessons:
            if position < match.start():
                lesson = label
            else:
                break
        record = _emit(match.group("question"), match.group("answer"), lesson)
        if record:
            found.append(record)
    return found


PRONUNCIATION = re.compile(r"\[([^\]]{0,3}?)([A-Za-z])([^\]]{0,3}?)\]")
MARKED_TOKEN = re.compile(r"[\[´`̀-ͯ]")
# Unicode normalisation turns the stress mark into a space plus a combining
# accent, which splits the word in two. Rejoin before anything else is done.
SPLIT_ACCENT = re.compile(r"\s+(?=[̀-ͯ])")
STRESS_MARK = re.compile(r"[̀-ͯ´`]")


def strip_pronunciation(text: str) -> str:
    """Turn the transcriber's pronunciation spelling back into ordinary words.

    Hurlbut's printed book marks every proper name for pronunciation, and the
    transcription carries those marks as bracketed codes wrapped around the very
    letters they describe: J[=e]'sus, [)I][s+]'ra-el-[=i]tes. Deleting the
    brackets deletes the vowels with them, so the letter inside is kept and the
    stress mark and syllable hyphens are dropped - but only inside words that
    were actually marked, so a genuine hyphenated word is left alone.
    """
    restored = []
    for token in SPLIT_ACCENT.sub("", text).split(" "):
        if not MARKED_TOKEN.search(token):
            restored.append(token)
            continue
        token = PRONUNCIATION.sub(r"\2", token)
        token = STRESS_MARK.sub("", token)
        token = re.sub(r"(?<=[A-Za-z])-(?=[A-Za-z])", "", token)
        restored.append(token)
    return " ".join(restored)


MARKUP = re.compile(r"[=_]")
ILLUSTRATION = re.compile(r"^\[?illustration", re.IGNORECASE)


def strip_markup(text: str) -> str:
    """Drop the transcription's bold and italic markers from an answer."""
    return MARKUP.sub("", text).strip()


NUMBERED_LINE = re.compile(r"^\s*(\d{1,3})\.\s+(?P<question>[A-Z].{8,300}\?)\s*$")
# A topic heading, not a hymn-writer's name in capitals and not a roman numeral:
# two or more words, at least one of which is longer than three letters.
TOPIC_LINE = re.compile(r"^([A-Z][A-Z \-']{9,60})$")
ROMAN_ONLY = re.compile(r"^[IVXLCDM \-]+$")


def is_topic(line: str) -> bool:
    line = line.strip()
    if not TOPIC_LINE.match(line) or ROMAN_ONLY.match(line):
        return False
    words = line.split()
    return len(words) >= 2 and any(len(word) > 3 for word in words)
ANSWER_LINE_LIMIT = 8


def _numbered_with_following_answer(
    text: str, track_topics: bool, stop_on_italic: bool
) -> list[dict]:
    """A numbered question on its own line, answered by the lines that follow it.

    Walked line by line rather than matched with one regex: the answers run to
    several lines and a regex that spans them needs nested repetition, which on a
    book this size backtracks until it never finishes.
    """
    lines = text.split("\n")
    found: list[dict] = []
    topic: str | None = None
    index = 0
    while index < len(lines):
        line = lines[index]
        if track_topics and is_topic(line):
            topic = tidy(line)
            index += 1
            continue
        match = NUMBERED_LINE.match(line)
        if not match:
            index += 1
            continue
        answer_lines: list[str] = []
        cursor = index + 1
        while cursor < len(lines) and len(answer_lines) < ANSWER_LINE_LIMIT:
            candidate = lines[cursor]
            if not candidate.strip():
                if answer_lines:
                    break
                cursor += 1
                continue
            if NUMBERED_LINE.match(candidate) or (stop_on_italic and candidate.startswith("_")):
                break
            answer_lines.append(candidate.strip())
            cursor += 1
        record = _emit(match.group("question"), " ".join(answer_lines) or None, topic)
        if record:
            found.append(record)
        index = max(cursor, index + 1)
    return found


def bible_readings(text: str) -> list[dict]:
    """20. What question was asked...? followed by the quoted scripture and reference."""
    return _numbered_with_following_answer(text, track_topics=True, stop_on_italic=False)


def italic_numbered(text: str) -> list[dict]:
    """_120. What is God?_ then the answer, then its scripture proofs - Sverdrup."""
    # The transcription wraps each question in underscores; strip them from the
    # line so the shared numbered-line scanner can see the question.
    plain = re.sub(r"^\s*_\s*(\d{1,3}\..*?)\s*_\s*$", r"\1", text, flags=re.MULTILINE)
    return _numbered_with_following_answer(plain, track_topics=False, stop_on_italic=False)


def trailing_question_list(text: str) -> list[dict]:
    """QUESTIONS.--1. What is...? 2. What does...? - review lists with no answers."""
    block = re.compile(r"QUESTIONS\.?\s*-{0,2}\s*(?P<body>.+?)(?=\n\s*\n\s*\n|\Z)", re.DOTALL)
    item = re.compile(r"(?:^|\s)\d{1,3}\.\s*(?P<question>[A-Z][^?]{8,300}\?)")
    found = []
    for section in block.finditer(text):
        for match in item.finditer(section.group("body")):
            record = _emit(match.group("question"), None, None)
            if record:
                found.append(record)
    return found


PARSERS = {
    "q_a_numbered": q_a_numbered,
    "q_a_starred": q_a_starred,
    "quest_answ": quest_answ,
    "hurlbut": hurlbut,
    "bible_readings": bible_readings,
    "italic_numbered": italic_numbered,
    "trailing_question_list": trailing_question_list,
}


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    banks = []
    for number, spec in BOOKS.items():
        path = RAW / f"pg{number}.txt"
        if not path.is_file():
            print(f"  MISSING {path}", flush=True)
            continue
        text = body(normalise(path.read_text(encoding="utf-8", errors="replace")))
        questions = PARSERS[spec["parser"]](text)
        seen: set[str] = set()
        unique = []
        for record in questions:
            key = re.sub(r"[^a-z]", "", record["question"].lower())
            if key in seen:
                continue
            seen.add(key)
            record["number"] = len(unique) + 1
            unique.append(record)
        banks.append(
            {
                "bank_id": f"pg{number}",
                "title": spec["title"],
                "gutenberg_ebook": number,
                "published": spec["published"],
                "parser": spec["parser"],
                "notes": spec["note"],
                "question_count": len(unique),
                "with_answer": sum(1 for q in unique if q["answer"]),
                "with_reference": sum(1 for q in unique if q["reference"]),
                "questions": unique,
            }
        )
        bank = banks[-1]
        print(
            f"  pg{number:<6} {bank['question_count']:>5} questions  "
            f"ans={bank['with_answer']:>5} ref={bank['with_reference']:>5}  "
            f"{spec['title'][:52]}",
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
    print(f"\n  {len(banks)} books, {sum(b['question_count'] for b in banks):,} questions "
          f"-> {target}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
