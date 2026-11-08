"""Memory card match: check the hand-kept pairs against the site's data and compute what the game ships.

Used by scripts/build-memory-match.py (docs/features/memory-match/design.md sections 4.1, 5 and 6). No model, no
network: the inputs are scripts/memory-match/characters.json and pairs.json, checked against people.json, the plain
BSB text and the question bank. Every rule the design lists as "fails the build" raises BuildError here.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
sys.path.insert(0, str(SITE / "scripts" / "bible"))
from books import BOOKS  # noqa: E402

BOOK_NUM = {code: n for n, (code, *_rest) in enumerate(BOOKS, start=1)}
BOOK_NAME = {code: name for code, name, *_rest in BOOKS}

DECKS = [
    ("beginnings", "In the beginning"), ("judges-kings", "Judges and kings"), ("prophets", "Prophets and exile"),
    ("women", "Women of the Bible"), ("jesus", "Meeting Jesus"), ("church", "The early church"), ("parables", "Parables"),
]
MIXED = "mixed"
BOARD_PAIRS = {"easy": 6, "medium": 9, "hard": 12}
EASY_POOL_CHARACTERS = 10  # design 8: tier 2 tops Easy up to this many distinct characters
HARD_DEEP_PAIRS = 4  # design 8: a Hard board has at least this many pairs of tier 2 or 3
SPEC_PAIR = ("daniel", "the lions' den")
MAX_LABEL = 30
LONG_WORD = 12
SHY = chr(0xAD)  # soft hyphen
STOP_WORDS = {"a", "an", "the", "of", "in", "on", "at", "to", "for", "by", "his", "her", "their", "from", "with", "and",
              "as", "this", "that", "me", "i", "you", "all"}
# Names of the Lord recorded as other names of a person (Barabbas is "Jesus Barabbas" in Matthew 27:17; Jacob's record
# lists "God" from Genesis 32:28). A card that mentions Jesus or God is not naming its own character.
NOT_A_GIVEAWAY = {"jesus", "god"}
TITLE_WORDS = {"the", "king"}  # dropped before a label's first name (design 6.3)
QUOTE = re.compile(r"[“\"]([^”\"]+)[”\"]")
WORD = re.compile("[A-Za-z0-9][A-Za-z0-9" + SHY + "'’-]*")


class BuildError(Exception):
    """A rule in the design is broken: the build stops and says which pair and why."""


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


@dataclass
class Sources:
    """The site data the build checks against, loaded once (or given directly by the tests)."""
    people: dict[str, dict]
    slugs: dict[str, str]  # person id -> readable slug
    bible: dict[str, dict[str, str]]  # BOOK -> {"c:v": text}
    bank_counts: Counter

    @classmethod
    def load(cls) -> Sources:
        people = {p["id"]: p for p in read_json(SITE / "data" / "study" / "people.json")}
        slugs = {pid: slug for slug, pid in read_json(SITE / "src" / "data" / "people-slugs.json")["slugs"].items()}
        bible = {code: read_json(path) for code in BOOK_NUM
                 if (path := SITE / "data" / "plain" / "bsb" / f"{code}.json").exists()}
        bank = read_json(SITE / "data" / "questions" / "bank.json")["questions"]
        return cls(people, slugs, bible, Counter(name for q in bank for name in q.get("people") or []))


# ---- references -------------------------------------------------------------------------------------------------

@dataclass(frozen=True)
class Part:
    book: str
    start: tuple[int, int]
    end: tuple[int, int]


def parse_ref(ref: str) -> list[Part]:
    """'DAN 6:16-23', 'ACT 27:39-28:1', 'EXO 20:1-17; EXO 34:28' -> parts."""
    parts = []
    for piece in ref.split(";"):
        match = re.fullmatch(r"\s*([1-3]?[A-Z]{2,3})\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?\s*", piece)
        if not match or match.group(1) not in BOOK_NUM:
            raise BuildError(f"reference {ref!r}: cannot read {piece.strip()!r} (expected e.g. 'DAN 6:16-23')")
        book, chapter, verse, end_chapter, end_verse = match.groups()
        start = (int(chapter), int(verse))
        end = (int(end_chapter or chapter), int(end_verse or verse)) if end_verse else start
        if end < start:
            raise BuildError(f"reference {ref!r}: the range ends before it starts")
        parts.append(Part(book, start, end))
    return parts


def passage_verses(sources: Sources, ref: str) -> list[tuple[str, int, int, str]]:
    """Every verse in the passage as (book, chapter, verse, text); fails on a verse the BSB does not have."""
    verses = []
    for part in parse_ref(ref):
        text = sources.bible.get(part.book, {})
        for endpoint in (part.start, part.end):
            if f"{endpoint[0]}:{endpoint[1]}" not in text:
                raise BuildError(f"reference {ref!r}: {part.book} {endpoint[0]}:{endpoint[1]} is not in the BSB text")
        for key, words in text.items():
            chapter, verse = (int(n) for n in key.split(":"))
            if part.start <= (chapter, verse) <= part.end:
                verses.append((part.book, chapter, verse, words))
    return verses


def show_ref(ref: str) -> str:
    """'DAN 6:16-23' -> 'Daniel 6:16–23'; 'ACT 27:39-28:1' -> 'Acts 27:39–28:1'."""
    out = []
    for part in parse_ref(ref):
        (c1, v1), (c2, v2) = part.start, part.end
        tail = "" if part.start == part.end else (f"–{v2}" if c1 == c2 else f"–{c2}:{v2}")
        out.append(f"{BOOK_NAME[part.book]} {c1}:{v1}{tail}")
    return "; ".join(out)


def reader_href(sources: Sources, ref: str) -> str:
    """The reader at the passage's first chapter, its verses there highlighted (the form odd-one-out uses)."""
    first = parse_ref(ref)[0]
    chapter = first.start[0]
    in_chapter = [v for book, c, v, _ in passage_verses(sources, ref) if book == first.book and c == chapter]
    low, high = min(in_chapter), max(in_chapter)
    return f"/read/bsb/{first.book}/{chapter}?hl={low}" + (f"-{high}" if high != low else "")


def verse_id(book: str, chapter: int, verse: int) -> int:
    return BOOK_NUM[book] * 1_000_000 + chapter * 1000 + verse


# ---- card text --------------------------------------------------------------------------------------------------

def plain(text: str) -> str:
    """Lower case, no soft hyphens, curly apostrophes straightened, punctuation to spaces, single spaces."""
    text = text.replace(SHY, "").replace("’", "'").lower()
    return " ".join(re.sub(r"[^a-z0-9' -]+", " ", text).replace("'", "").split())


def bare(word: str) -> str:
    """A word without soft hyphens, a possessive 's / ' or surrounding punctuation."""
    word = word.replace(SHY, "").replace("’", "'").strip("'-")
    return re.sub(r"'s?$", "", word)


def content_words(story: str) -> list[str]:
    """Design 6.2: the words two story cards can share, as the browser compares them."""
    out = []
    for raw in WORD.findall(QUOTE.sub(lambda m: m.group(1), story)):
        word = bare(raw).lower()
        if not word or word in STOP_WORDS:
            continue
        if len(word) >= 4 and word.endswith("s") and not word.endswith("ss"):
            word = word[:-1]
        if word not in out:
            out.append(word)
    return out


def first_name(label: str) -> str:
    """Design 6.3: the label's first word after "The" and "King", lower case, without punctuation or possessive."""
    words = [bare(w.rstrip(",.")).lower() for w in label.replace(SHY, "").split()]
    words = [w for w in words if w]
    while len(words) > 1 and words[0] in TITLE_WORDS:
        words = words[1:]
    return words[0]


def check_label_shape(label: str, where: str) -> None:
    """Design 4.1 rule 1: at most 30 characters; a word longer than 12 letters carries soft hyphens."""
    if len(label.replace(SHY, "")) > MAX_LABEL:
        raise BuildError(f"{where}: {label.replace(SHY, '')!r} is longer than {MAX_LABEL} characters")
    for word in label.split():
        if len(bare(word)) > LONG_WORD and SHY not in word:
            raise BuildError(f"{where}: the long word {word!r} needs soft hyphens (\\u00ad) so it breaks cleanly")


def quotations(story: str) -> list[str]:
    return [m.group(1) for m in QUOTE.finditer(story)]


def outside_quotes(story: str) -> str:
    return QUOTE.sub(" ", story)


def capitalised_names(story: str) -> set[str]:
    """Capitalised words in a story label, other than its first word and the text of quotations."""
    words = WORD.findall(outside_quotes(story))
    names = {bare(w) for n, w in enumerate(words) if w[0].isupper() and not (n == 0 and story.lstrip()[0] != "“")}
    return {w for w in names if len(w) > 1 and w.lower() not in NOT_A_GIVEAWAY}


def name_words(label: str) -> set[str]:
    """The capitalised words of a who label that name someone (not "The", "King" or a mention of Jesus)."""
    words = {bare(w.rstrip(",")) for w in label.replace(SHY, "").split()}
    return {w for w in words if w[:1].isupper() and w.lower() not in TITLE_WORDS | NOT_A_GIVEAWAY}


def make_id(who: str, story: str) -> str:
    return "mm-" + hashlib.sha1(f"{who}|{story}".encode()).hexdigest()[:6]
