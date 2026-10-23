"""The script's own checks on a question written for the site (question_writing.py): rules, no model. A question
that fails one is rejected, never repaired.
"""

from __future__ import annotations

import re

from question_audit import bible_book, contains
from question_audit_quotes import plain, quotations
from question_choices import FILLER, norm, word_count
from question_model_tags import in_text

CONTEXT = 2  # verses shown either side of a section, for context only
ANSWER_MAX_WORDS = 12
STOP = {"a", "an", "the", "of", "to", "in", "on", "at", "by", "for", "with", "from", "and", "or", "but", "his", "her",
        "their", "its", "he", "she", "they", "it", "him", "them", "was", "were", "is", "are", "be", "been", "as",
        "that", "this", "who", "what", "which", "into", "upon", "out", "up", "not", "no", "so", "had", "has", "have"}
KING_JAMES = re.compile(r"\b(thee|thou|thy|thine|ye|hath|hast|doth|dost|saith|unto|shalt|begat|spake|wilt)\b", re.IGNORECASE)
LEANS = re.compile(r"^\s*(he|she|they|him|her|it|this|these|those|there)\b|\b(this|that|the|these) (passage|section|"
                   r"chapter|story|text|verses?|account)\b", re.IGNORECASE)
NUMBER = re.compile(r"^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|"
                    r"sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|"
                    r"hundred|thousand|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|half|double)$",
                    re.IGNORECASE)
VERSE = re.compile(r"^(\d+):(\d+)(?:-(\d+))?$")


def verse_lines(book: str, start: tuple[int, int], end: tuple[int, int]) -> list[str]:
    verses = bible_book(book)
    return [f"{c}:{v} {text}" for (c, v), text in sorted(verses.items()) if start <= (c, v) <= end]


def context_lines(section: dict) -> tuple[list[str], list[str]]:
    keys = sorted(bible_book(section["book"]))
    first, last = keys.index(section["start"]), keys.index(section["end"])
    before = keys[max(0, first - CONTEXT):first]
    after = keys[last + 1:last + 1 + CONTEXT]
    verses = bible_book(section["book"])
    return ([f"{c}:{v} {verses[(c, v)]}" for c, v in before], [f"{c}:{v} {verses[(c, v)]}" for c, v in after])


def cited_keys(verses: list[str], section: dict) -> list[tuple[int, int]] | None:
    """The cited verses as (chapter, verse), or None if any is malformed or outside the section."""
    keys: list[tuple[int, int]] = []
    present = set(bible_book(section["book"]))
    for text in verses:
        match = VERSE.match(text.strip())
        if not match:
            return None
        c, v1, v2 = int(match.group(1)), int(match.group(2)), int(match.group(3) or match.group(2))
        for v in range(v1, v2 + 1):
            key = (c, v)
            if key not in present or not section["start"] <= key <= tuple(section["end"]):
                return None
            keys.append(key)
    return keys or None


def answer_held(answer: str, cited_text: str) -> bool:
    """The answer's words are in the cited verses: every name (a capitalised word after the first) and every number,
    exactly, and at least half of the rest. Short names count, unlike the tagging check, and "75" is not "seventy-five"."""
    text_words = set(re.findall(r"[a-z0-9]+", cited_text.lower()))
    words = re.findall(r"[A-Za-z0-9]+", answer)
    content = [w for w in words if w.lower() not in STOP]
    if not content:
        return False
    # The first word of a longer answer is capitalised as its start, not as a name.
    names = [w for n, w in enumerate(words) if w[0].isupper() and w.lower() not in STOP and (n or len(words) == 1)]
    if not all(in_text(w.lower(), text_words) for w in names):
        return False
    if not all(w.lower() in text_words for w in content if NUMBER.match(w)):
        return False
    return sum(in_text(w.lower(), text_words) for w in content) * 2 >= len(content)


def gate(text: dict, section: dict, asked: list[str]) -> str | None:
    """Why the question fails the script's checks, or None if it passes."""
    question, answer = text["question"].strip(), text["answer"].strip()
    wrong = [w.strip() for w in text["wrong"]]
    if not question or not answer:
        return "empty question or answer"
    if word_count(answer) > ANSWER_MAX_WORDS:
        return "answer longer than 12 words"
    if len(wrong) != 3 or not all(wrong) or len({norm(w) for w in wrong} | {norm(answer)}) != 4:
        return "not three distinct wrong choices besides the answer"
    if any(FILLER.search(w) for w in wrong):
        return "filler choice"
    keys = cited_keys(text["verses"], section)
    if not keys:
        return "cited verses missing or outside the section"
    verses = bible_book(section["book"])
    if not answer_held(answer, " ".join(verses[k] for k in keys)):
        return "the answer's words are not in the cited verses"
    before, after = context_lines(section)
    whole = plain(" ".join([*(line.split(" ", 1)[1] for line in before + after),
                            *(verses[k] for k in sorted(verses) if section["start"] <= k <= tuple(section["end"]))]))
    # A wrong choice to "what did they say?" is a made-up saying by design, so only the question and the answer
    # must quote the BSB word for word; no part may use King James wording.
    if any(plain(quote) not in whole for part in (question, answer) for quote in quotations(part)):
        return "a quotation not word for word in the BSB text"
    if any(KING_JAMES.search(part) for part in [question, answer, *wrong]):
        return "King James wording"
    if LEANS.search(question):
        return "does not stand alone"
    if contains(norm(question), norm(answer)):
        return "the question contains its answer"
    if word_count(answer) >= max(word_count(w) for w in wrong) + 2:
        return "the right choice is plainly the longest"
    if norm(question) in {norm(a) for a in asked}:
        return "already asked"
    return None
