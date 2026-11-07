"""The book of Psalms as the site's structured Berean holds it: headings, the five book markers, footnotes, the New
Testament citations the Berean's notes mark, and Psalm 119's stanza letters. Every count on the page comes from here.

data/text/bsb/PSA/ holds 30 files (0.json to 29.json), five psalms each, keyed by psalm number. A psalm's heading is
its "t" list (strings, with {"f": note} dicts between them); a verse's runs hold {"f": note} dicts; a verse's "h" list
holds ["ms", "BOOK I"] where a book begins and ["qa", "ALEPH"] where a stanza of Psalm 119 begins.
"""
import json
import re
from pathlib import Path

from scripture_text import BOOKS, BuildError, fold, verses_of

WEBSITE = Path(__file__).resolve().parents[2]
PSA = WEBSITE / "data/text/bsb/PSA"
NT_BOOKS = list(BOOKS)[list(BOOKS).index("Matthew"):]
NT_REF = re.compile(r"(?:(" + "|".join(sorted(map(re.escape, NT_BOOKS), key=len, reverse=True)) + r") )?(\d+):(\d+)(?:[–-](\d+))?")
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
WRITERS = ("David", "Asaph", "sons of Korah", "Solomon", "Moses", "Heman", "Ethan")


def load_chapters() -> dict:
    """All 150 psalms, keyed by number. Fails if a chunk is missing, unreadable or holds the wrong psalms."""
    chapters = {}
    for index in range(30):
        path = PSA / f"{index}.json"
        try:
            chunk = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read the Psalms chunk {path}: {error}") from error
        expected = {str(n) for n in range(index * 5 + 1, index * 5 + 6)}
        if set(chunk) != expected:
            raise BuildError(f"{path.name} should hold psalms {min(expected, key=int)}–{max(expected, key=int)}, found {sorted(chunk, key=int)}")
        for key, chapter in chunk.items():
            if not isinstance(chapter, dict) or not isinstance(chapter.get("v"), list):
                raise BuildError(f"{path.name}: psalm {key} has no verse list")
            chapters[int(key)] = chapter
    return chapters


def heading_of(chapter: dict) -> tuple:
    """(heading text, heading notes). The text is the strings of "t" joined, the notes its {"f"} entries."""
    parts = chapter.get("t") or []
    text = "".join(p for p in parts if isinstance(p, str)).strip()
    notes = [p["f"] for p in parts if isinstance(p, dict) and "f" in p]
    return fold(text), [fold(n) for n in notes]


def notes_of(chapter: dict) -> list:
    """Every footnote in the psalm's verses, as (verse number, note)."""
    found = []
    for verse in chapter["v"]:
        for run in verse.get("r", []):
            if isinstance(run, dict) and "f" in run:
                found.append((int(verse["n"]), fold(run["f"])))
    return found


def cited_in(note: str, bible: dict) -> list:
    """The New Testament passages a note says a verse is "cited in". "See also" passages are dropped; a bare
    chapter:verse takes the book named before it in the same list. Each passage is checked to exist."""
    match = re.search(r"cited in (.*)", note, flags=re.I)
    if not match:
        return []
    listed = re.split(r"[;.]\s*see also|\.\s*(?:[A-Z]|$)|\(see", match.group(1))[0]
    found, book = [], None
    for piece in NT_REF.finditer(listed):
        book = piece.group(1) or book
        if book is None:
            raise BuildError(f"a citation note names no book before {piece.group(0)!r}: {note!r}")
        label = f"{book} {piece.group(2)}:{piece.group(3)}" + (f"–{piece.group(4)}" if piece.group(4) else "")
        verses_of(bible, label)  # fails if the passage does not exist
        found.append(label)
    if not found:
        raise BuildError(f"a citation note lists no passage the build can read: {note!r}")
    return found


def read_psalter(bible: dict) -> list:
    """One record per psalm, in order."""
    chapters = load_chapters()
    if sorted(chapters) != list(range(1, 151)):
        raise BuildError(f"expected psalms 1–150, found {len(chapters)}")
    records, book = [], 0
    for number in range(1, 151):
        chapter = chapters[number]
        for verse in chapter["v"]:
            for kind, text in verse.get("h", []):
                if kind == "ms":
                    roman = text.removeprefix("BOOK ").strip()
                    if ROMAN.get(roman) != book + 1:
                        raise BuildError(f"Psalm {number}: book marker {text!r} out of order after book {book}")
                    book += 1
        heading, heading_notes = heading_of(chapter)
        notes = notes_of(chapter)
        cited = []
        for verse_number, note in notes:
            for label in cited_in(note, bible):
                if label not in [c[1] for c in cited]:
                    cited.append((verse_number, label))
        _, verses = verses_of(bible, f"Psalm {number}:1–{len(chapter['v'])}")
        if len(verses) != len(chapter["v"]):
            raise BuildError(f"Psalm {number}: the two Berean copies disagree on its length")
        named = [w for w in WRITERS if re.search(rf"\b{w}\b", heading)]
        records.append({
            "n": number, "book": book, "verses": len(verses), "heading": heading, "named": named,
            "acrostic": any("acrostic" in n for n in heading_notes + [n for _, n in notes]),
            "cited": cited, "first": verses[0][2],
        })
    if book != 5:
        raise BuildError(f"expected five book markers in the Psalms, found {book}")
    return records


def all_notes(number: int) -> list:
    """Every note in one psalm, heading notes first, for checking a phrase the study quotes from the Berean's notes."""
    chapter = load_chapters()[number]
    return heading_of(chapter)[1] + [n for _, n in notes_of(chapter)]


def stanzas_119() -> list:
    """Psalm 119's stanzas as (letter, first verse, last verse), from the Berean's letter headings."""
    verses = load_chapters()[119]["v"]
    starts = [(h[1].title(), int(v["n"])) for v in verses for h in v.get("h", []) if h[0] == "qa"]
    stanzas = [(letter, first, (starts[i + 1][1] - 1) if i + 1 < len(starts) else len(verses)) for i, (letter, first) in enumerate(starts)]
    if len(stanzas) != 22 or any(last - first != 7 for _, first, last in stanzas):
        raise BuildError(f"Psalm 119 should have 22 stanzas of 8 verses in the Berean, found {[(s[0], s[2] - s[1] + 1) for s in stanzas]}")
    return stanzas
