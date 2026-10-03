"""English Bible references -> canonical verse-id ranges, checked against our own KJV text.

Handles the styles the study sources use:
  Robertson  "Matt. 21:1-11, 14-17", "Luke 3:19-20; 4:14", "Matt. 9:35-11:1", "Luke 12.", "Matt. 5-7", "Matt. 24, 25"
  Torrey     "Mt 9:5-13", "Ex 4:9,30", "1Sa 28:7-14"
  Faith page "Matthew 6:26,32", "Song of Solomon 2:1"
"""

import json
import re
from pathlib import Path

from .books import BOOK_NUMBER, BOOKS, verse_id

_NAMES = {
    "GEN": "gen genesis ge gn", "EXO": "exo exod exodus ex", "LEV": "lev leviticus le lv", "NUM": "num numbers nu nm",
    "DEU": "deu deut deuteronomy de dt", "JOS": "jos josh joshua", "JDG": "jdg judg judges jg",
    "RUT": "rut ruth ru", "1SA": "1sa 1sam 1samuel", "2SA": "2sa 2sam 2samuel", "1KI": "1ki 1kgs 1kings",
    "2KI": "2ki 2kgs 2kings", "1CH": "1ch 1chr 1chron 1chronicles", "2CH": "2ch 2chr 2chron 2chronicles",
    "EZR": "ezr ezra", "NEH": "neh nehemiah ne", "EST": "est esth esther es", "JOB": "job jb",
    "PSA": "psa ps psalm psalms pss", "PRO": "pro prov proverbs pr", "ECC": "ecc eccl ecclesiastes ec",
    "SNG": "sng song songofsolomon songofsongs so ss canticles", "ISA": "isa isaiah is",
    "JER": "jer jeremiah je", "LAM": "lam lamentations la", "EZK": "ezk ezek ezekiel eze",
    "DAN": "dan daniel da dn", "HOS": "hos hosea ho", "JOL": "jol joel joe", "AMO": "amo amos am",
    "OBA": "oba obad obadiah ob", "JON": "jon jonah", "MIC": "mic micah mi", "NAM": "nam nah nahum na",
    "HAB": "hab habakkuk", "ZEP": "zep zeph zephaniah", "HAG": "hag haggai", "ZEC": "zec zech zechariah",
    "MAL": "mal malachi", "MAT": "mat matt matthew mt", "MRK": "mrk mark mr mk", "LUK": "luk luke lu lk",
    "JHN": "jhn john joh jn", "ACT": "act acts ac", "ROM": "rom romans ro", "1CO": "1co 1cor 1corinthians",
    "2CO": "2co 2cor 2corinthians", "GAL": "gal galatians ga", "EPH": "eph ephesians",
    "PHP": "php phil philippians", "COL": "col colossians", "1TH": "1th 1thess 1thessalonians",
    "2TH": "2th 2thess 2thessalonians", "1TI": "1ti 1tim 1timothy", "2TI": "2ti 2tim 2timothy",
    "TIT": "tit titus", "PHM": "phm phlm philem philemon", "HEB": "heb hebrews", "JAS": "jas james ja",
    "1PE": "1pe 1pet 1peter", "2PE": "2pe 2pet 2peter", "1JN": "1jn 1jo 1john", "2JN": "2jn 2jo 2john",
    "3JN": "3jn 3jo 3john", "JUD": "jud jude", "REV": "rev revelation re",
}
BOOK_BY_NAME: dict[str, str] = {}
for _code, _forms in _NAMES.items():
    for _form in _forms.split():
        if _form in BOOK_BY_NAME and BOOK_BY_NAME[_form] != _code:
            raise ValueError(f"study_refs: book name {_form!r} maps to both {BOOK_BY_NAME[_form]} and {_code}")
        BOOK_BY_NAME[_form] = _code
# "jud" is Jude in OSIS-style lists but Judges in Torrey ("Jud 4:4" = Deborah). Torrey passes its own table.
TORREY_OVERRIDES = {"jud": "JDG", "jdj": "JDG", "jude": "JUD"}

BOOK_NAME = {code: name for code, name, _section, _osis in BOOKS}


class RefError(ValueError):
    pass


def normalise_book(raw: str, overrides: dict[str, str] | None = None) -> str:
    raw = re.sub(r"^(I{1,3})\s+(?=[A-Z])", lambda m: str(len(m.group(1))), raw.strip())  # "I John" -> "1John"
    key = re.sub(r"[\s.]", "", raw).lower()
    if overrides and key in overrides:
        return overrides[key]
    if key not in BOOK_BY_NAME:
        raise RefError(f"unknown book name {raw!r}")
    return BOOK_BY_NAME[key]


class Verses:
    """Chapter sizes from our own KJV plain text: the authority every reference is checked against."""

    def __init__(self, data_root: Path):
        self.sizes: dict[str, dict[int, int]] = {}
        for code in BOOK_NUMBER:
            path = data_root / "plain" / "kjv" / f"{code}.json"
            if not path.exists():
                continue
            chapters: dict[int, int] = {}
            for key in json.loads(path.read_text(encoding="utf-8")):
                chapter, _, verse = key.partition(":")
                if chapter.isdigit() and verse.isdigit():
                    chapters[int(chapter)] = max(chapters.get(int(chapter), 0), int(verse))
            self.sizes[code] = chapters
        if "GEN" not in self.sizes or "REV" not in self.sizes:
            raise RefError(f"no KJV plain text under {data_root / 'plain' / 'kjv'}; build the Bible data first")

    def last_verse(self, code: str, chapter: int) -> int:
        size = self.sizes.get(code, {}).get(chapter)
        if not size:
            raise RefError(f"{BOOK_NAME.get(code, code)} has no chapter {chapter} in the KJV")
        return size

    def check(self, code: str, chapter: int, verse: int) -> int:
        if verse < 1 or verse > self.last_verse(code, chapter):
            raise RefError(f"{BOOK_NAME[code]} {chapter}:{verse} does not exist in the KJV")
        return verse_id(code, chapter, verse)


BOOK_PREFIX = re.compile(r"^\s*((?:[1-3]|I{1,3})\s*[A-Za-z][A-Za-z. ]*?|[A-Za-z][A-Za-z. ]*?)\.?\s+(?=\d)")


def parse_refs(text: str, verses: Verses, book: str | None = None, overrides: dict[str, str] | None = None) -> list[list[int]]:
    """'Mark 6:30-44; Matt. 14:13-21' -> [[start, end], ...] in the order written."""
    ranges: list[list[int]] = []
    chapter: int | None = None
    for part in re.split(r";", text.strip().rstrip(".")):
        part = part.strip()
        if not part:
            continue
        match = BOOK_PREFIX.match(part)
        if match:
            book = normalise_book(match.group(1), overrides)
            part = part[match.end():]
            chapter = None
        if book is None:
            raise RefError(f"reference {text!r}: no book before {part!r}")
        has_verse = ":" in part
        for piece in [p.strip() for p in part.split(",") if p.strip()]:
            piece = piece.rstrip(". ")
            following = re.search(r"\s*(f{1,2})$", piece)
            if following and following.group(1) == "ff":
                raise RefError(f"reference {text!r}: 'ff.' (and following) has no end verse")
            piece = piece[: following.start()] if following else piece
            span = _piece(piece, book, chapter if has_verse else None, verses)
            if following:  # "4:23 f." = 4:23-24
                span = [span[0], verses.check(book, span[1] // 1000 % 1000, span[1] % 1000 + 1)]
            ranges.append(span)
            if ":" in piece:
                chapter = int(piece.split(":")[0])
                if "-" in piece and ":" in piece.split("-")[1]:
                    chapter = int(piece.split("-")[1].split(":")[0])
            elif not has_verse:
                chapter = None
    return ranges


def _piece(piece: str, book: str, chapter: int | None, verses: Verses) -> list[int]:
    m = re.fullmatch(r"(\d+):(\d+)(?:-(\d+)(?::(\d+))?)?", piece)
    if m:
        c1, v1 = int(m.group(1)), int(m.group(2))
        if m.group(4):
            c2, v2 = int(m.group(3)), int(m.group(4))
        elif m.group(3):
            c2, v2 = c1, int(m.group(3))
        else:
            c2, v2 = c1, v1
        return [verses.check(book, c1, v1), verses.check(book, c2, v2)]
    m = re.fullmatch(r"(\d+)(?:-(\d+))?", piece)
    if m and chapter is not None:  # a bare number after a verse = more verses in the same chapter
        v1, v2 = int(m.group(1)), int(m.group(2) or m.group(1))
        return [verses.check(book, chapter, v1), verses.check(book, chapter, v2)]
    if m:  # whole chapters: "Luke 12", "Matt. 5-7"
        c1, c2 = int(m.group(1)), int(m.group(2) or m.group(1))
        return [verses.check(book, c1, 1), verses.check(book, c2, verses.last_verse(book, c2))]
    raise RefError(f"cannot read reference piece {piece!r} in {BOOK_NAME[book]}")


def format_range(start: int, end: int) -> str:
    """[27002034, 27002035] -> 'Daniel 2:34-35' (for build reports and tests)."""
    code = next(c for c, n in BOOK_NUMBER.items() if n == start // 1_000_000)
    c1, v1, c2, v2 = start // 1000 % 1000, start % 1000, end // 1000 % 1000, end % 1000
    tail = "" if start == end else (f"-{v2}" if c1 == c2 else f"-{c2}:{v2}")
    return f"{BOOK_NAME[code]} {c1}:{v1}{tail}"
