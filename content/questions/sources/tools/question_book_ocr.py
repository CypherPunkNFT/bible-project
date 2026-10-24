#!/usr/bin/env python3
"""Shared parsing helpers for the batch-3 question books.

These books arrive as machine-read (OCR) text of nineteenth-century scans, or as
Project Gutenberg transcriptions. Both need the same three things: the text tidied
without losing line structure, a judgement about whether a candidate really is a
question, and the scripture reference pulled out of the tail of a line.

Nothing here writes to disk, and nothing here reaches the network.

Used by extract_question_books.py and extract_gutenberg_question_books.py.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter

# A question has to start like a question. Nineteenth-century question books ask in
# the imperative as often as the interrogative ("Repeat the king's address"), so the
# imperatives are here too.
OPENERS = (
    "what", "who", "whom", "whose", "when", "where", "why", "how", "which",
    "did", "do", "does", "was", "were", "is", "are", "am", "can", "could",
    "should", "would", "will", "shall", "has", "have", "had", "may", "might",
    "must", "ought", "if", "in", "on", "at", "by", "for", "from", "to", "of",
    "with", "after", "before", "upon", "under", "against", "between", "about",
    "name", "state", "repeat", "rehearse", "tell", "give", "mention", "relate",
    "describe", "explain", "recite", "quote", "say", "show", "prove", "point",
    "whither", "whence", "wherefore", "wherein", "whereof", "whereby", "wherewith",
)

# The characters an English question is made of. Anything much outside this set is
# machine-read noise rather than text.
CLEAN_CHARS = re.compile(r"[A-Za-z0-9 ,;:'’‘“”\".!?()\[\]/\-]")

# Characters that never occur in nineteenth-century English prose. One of these in
# a candidate means the reader misread the page, so the whole candidate goes.
GARBAGE_CHARS = re.compile(r"[\^|~@#%&*_{}<>\\+=¡-¿†-‰]")

# Scripture reference at the end of a line, in either the roman-numeral style the
# older books use (Judg. iv. 17) or the arabic style (Judg. 4:17; 30 : 8).
BOOK_WORD = r"(?:[1-3]\s*)?[A-Z][A-Za-z]{1,11}\.?"
ROMAN_REF = rf"{BOOK_WORD}\s+[ivxlcIVXLC]{{1,7}}\.?\s*[\d,\s.—-]{{1,24}}"
ARABIC_REF = rf"{BOOK_WORD}\s*\d{{1,3}}\s*[:.]\s*\d{{1,3}}(?:\s*[,-]\s*\d{{1,3}})*"
BARE_REF = r"\d{1,3}\s*:\s*\d{1,3}(?:\s*[,-]\s*\d{1,3})*"
REFERENCE_TAIL = re.compile(
    rf"(?:[—\-]+\s*)?((?:{ARABIC_REF}|{ROMAN_REF}|{BARE_REF})\s*\.?)\s*$"
)
# The same reference, but sitting at the start of what follows a question mark:
# "...interpretation of the writing? 5 : 26, 27, 28. What was the fate..."
REFERENCE_HEAD = re.compile(
    rf"^\s*(?:[—\-]+\s*)?((?:{ARABIC_REF}|{ROMAN_REF}|{BARE_REF})\s*\.?)"
)

# A lesson, chapter or section heading. These group the questions in nearly every
# book in this batch.
HEADING = re.compile(
    r"^\s*(LESSON|Lesson|CHAPTER|Chapter|SECTION|Section|PART|Part|QUARTER|STUDY|Study)"
    r"\s+([IVXLCDM]+|\d{1,3})\b[.:—\- ]*(.{0,80})$"
)

MAX_QUESTION_CHARS = 400
MIN_QUESTION_CHARS = 20
MIN_QUESTION_WORDS = 4


def normalise(text: str) -> str:
    """Tidy machine-read text without losing its lines.

    Rejoins words the scanner split across a line break, collapses the double
    spacing the Internet Archive's text layer uses, and flattens the curly quotes
    and long dashes so later matching has one shape to deal with.
    """
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # A word broken by a hyphen at the end of a line is one word.
    text = re.sub(r"([A-Za-z])[‐-―-]\s*\n\s*([a-z])", r"\1\2", text)
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(lines)


def _alpha_signature(line: str) -> str:
    """The letters of a line, lowercased, with digits and punctuation dropped.

    Two printings of the same running header differ only in the page number and in
    how badly the scanner read them, so the letters alone identify the header.
    """
    return re.sub(r"[^a-z]", "", line.lower())


def find_running_headers(lines: list[str], min_repeats: int = 12) -> set[str]:
    """The set of alpha-signatures that look like a repeated page header.

    A header is short, carries a page number, repeats many times, and - the rule
    that keeps real content safe - never contains a question mark.
    """
    counts: Counter[str] = Counter()
    for line in lines:
        if len(line) > 80 or "?" in line or not re.search(r"\d", line):
            continue
        signature = _alpha_signature(line)
        if 4 <= len(signature) <= 48:
            counts[signature] += 1
    return {signature for signature, count in counts.items() if count >= min_repeats}


def page_numbers(lines: list[str], headers: set[str]) -> list[int | None]:
    """The printed page each line sits on, as far as the headers reveal it.

    Lines before the first readable header get None rather than a guess.
    """
    pages: list[int | None] = []
    current: int | None = None
    for line in lines:
        if len(line) <= 80 and "?" not in line and _alpha_signature(line) in headers:
            found = re.findall(r"\b(\d{1,4})\b", line)
            if found:
                # The page number is the first or last number on the header line;
                # the smaller of the two is almost never a year or a verse.
                candidates = [int(found[0]), int(found[-1])]
                plausible = [c for c in candidates if 1 <= c <= 2000]
                if plausible:
                    current = plausible[0]
        pages.append(current)
    return pages


def is_header(line: str, headers: set[str]) -> bool:
    return len(line) <= 80 and "?" not in line and _alpha_signature(line) in headers


def split_reference(text: str) -> tuple[str, str | None]:
    """Separate a trailing scripture reference from the text it follows."""
    match = REFERENCE_TAIL.search(text)
    if not match:
        return text.strip(), None
    reference = match.group(1).strip().rstrip(".,;")
    body = text[: match.start()].strip().rstrip("—-").strip()
    # A reference is only a reference if something is left in front of it.
    if len(body) < MIN_QUESTION_CHARS or not reference:
        return text.strip(), None
    return body, reference


def leading_reference(text: str) -> str | None:
    """A scripture reference printed immediately after a question's question mark."""
    match = REFERENCE_HEAD.match(text)
    if not match:
        return None
    reference = match.group(1).strip().rstrip(".,;")
    # A lone number is a question number or a page number, not a reference.
    if not reference or not re.search(r"[:.]\s*\d|[ivxlc]", reference, re.IGNORECASE):
        return None
    return reference


def noise_ratio(text: str) -> float:
    """The share of characters that are not part of ordinary English text."""
    if not text:
        return 1.0
    clean = len(CLEAN_CHARS.findall(text))
    return 1.0 - clean / len(text)


def orphan_letters(text: str) -> int:
    """Single-letter words that are not real words - a reliable mark of bad scanning."""
    return sum(
        1
        for word in re.findall(r"\b[A-Za-z]\b", text)
        if word.lower() not in {"a", "i", "o"}
    )


# In these scans the question mark is the character the reader gets wrong most
# often, coming back as 1, 7, l, I, P, ^ or r. Left alone it glues two or three
# questions into one record, so it is worth recovering - but only where the shape
# around it is unmistakable: a standalone confusable, sitting after a word, with
# the next question's opening capital in sight (possibly behind a reference).
QUESTION_MARK_OCR = re.compile(
    r"(?<=[a-z\)\]\"'])\s+([17lIP^r])\s*(?=[\s\d:,.;—-]{0,24}[A-Z][a-z])"
)


def recover_question_marks(text: str) -> tuple[str, int]:
    """Put back the question marks the scanner mis-read. Returns the count too.

    Over-recovery is the safe direction to err in: an extra split produces a
    fragment, and a fragment is thrown out by the quality gate. A missed one
    silently welds two questions into a single unusable record.
    """
    recovered = 0

    def replace(_match: re.Match[str]) -> str:
        nonlocal recovered
        recovered += 1
        return "?"

    return QUESTION_MARK_OCR.sub(replace, text), recovered


# A question-and-answer marker left stranded inside a candidate means the match
# ran across a whole answer to reach the next question mark.
STRANDED_MARKER = re.compile(r"(?:^|\s)[QA]\s*[.:]\s*")


def after_last_marker(text: str) -> str:
    """Whatever follows the last stranded Q. or A. marker in a candidate."""
    matches = list(STRANDED_MARKER.finditer(text))
    return text[matches[-1].end():] if matches else text


def trim_to_opener(text: str, max_skip_words: int = 16) -> str:
    """Drop whatever precedes the question itself on the same run of text.

    Between one question mark and the next these books print the answer's
    scripture reference, a verse number, a page number or the tail of a note. The
    question proper starts at the first capitalised interrogative or imperative,
    so that is where the record starts. If no such word turns up early on, the
    text is returned untouched and the quality gate decides its fate.
    """
    words = text.split()
    for index, word in enumerate(words[:max_skip_words]):
        bare = re.sub(r"[^A-Za-z]", "", word)
        if bare and bare[0].isupper() and bare.lower() in OPENERS:
            return " ".join(words[index:])
    return text


def looks_like_question(text: str, allow_imperative: bool = True) -> bool:
    """Whether a candidate is clean enough and shaped enough to keep."""
    text = text.strip()
    if not (MIN_QUESTION_CHARS <= len(text) <= MAX_QUESTION_CHARS):
        return False
    words = text.split()
    if len(words) < MIN_QUESTION_WORDS:
        return False
    first = re.sub(r"[^A-Za-z]", "", words[0]).lower()
    if not first:
        return False
    if first not in OPENERS:
        return False
    if not allow_imperative and first in {
        "name", "state", "repeat", "rehearse", "tell", "give", "mention",
        "relate", "describe", "explain", "recite", "quote", "say", "show",
    }:
        return False
    if GARBAGE_CHARS.search(text):
        return False
    if noise_ratio(text) > 0.06:
        return False
    if orphan_letters(text) > 2:
        return False
    # A line that is mostly capitals is a heading the scanner ran into the text.
    letters = [c for c in text if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.6:
        return False
    return True


def tidy(text: str) -> str:
    """Collapse whitespace and trim the punctuation left over from line joins."""
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,;:.?!])", r"\1", text)
    return text.strip(" —-|")


def heading_of(line: str) -> str | None:
    """The lesson or chapter heading a line announces, or None."""
    match = HEADING.match(line)
    if not match:
        return None
    label = f"{match.group(1).title()} {match.group(2)}"
    trailing = tidy(match.group(3) or "")
    # A heading line that runs on into a sentence is not a heading.
    if len(trailing) > 60:
        return None
    return f"{label} {trailing}".strip()
