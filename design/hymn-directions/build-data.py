"""Write shared/data.js for the hymn mock-ups from the real hymns corpus and the site's own Bible text.

Reads only: Research/Hymns (Olney Hymns, Hymnary's scripture links) and Website/data/text/kjv. Run from
anywhere: py -3.12 design/hymn-directions/build-data.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
HYMNS = SITE.parent / "Research/Hymns"
HYMN_ID = "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound"

# The 66 books in order: (name, reader code, section tone from the site's palette).
BOOKS = [(n, c, s) for s, books in [
    ("history", [("Genesis", "GEN"), ("Exodus", "EXO"), ("Leviticus", "LEV"), ("Numbers", "NUM"), ("Deuteronomy", "DEU"), ("Joshua", "JOS"),
                 ("Judges", "JDG"), ("Ruth", "RUT"), ("1 Samuel", "1SA"), ("2 Samuel", "2SA"), ("1 Kings", "1KI"), ("2 Kings", "2KI"),
                 ("1 Chronicles", "1CH"), ("2 Chronicles", "2CH"), ("Ezra", "EZR"), ("Nehemiah", "NEH"), ("Esther", "EST")]),
    ("poetry", [("Job", "JOB"), ("Psalms", "PSA"), ("Proverbs", "PRO"), ("Ecclesiastes", "ECC"), ("Song of Solomon", "SNG")]),
    ("prophets", [("Isaiah", "ISA"), ("Jeremiah", "JER"), ("Lamentations", "LAM"), ("Ezekiel", "EZK"), ("Daniel", "DAN"), ("Hosea", "HOS"),
                  ("Joel", "JOL"), ("Amos", "AMO"), ("Obadiah", "OBA"), ("Jonah", "JON"), ("Micah", "MIC"), ("Nahum", "NAM"),
                  ("Habakkuk", "HAB"), ("Zephaniah", "ZEP"), ("Haggai", "HAG"), ("Zechariah", "ZEC"), ("Malachi", "MAL")]),
    ("gospels", [("Matthew", "MAT"), ("Mark", "MRK"), ("Luke", "LUK"), ("John", "JHN")]),
    ("acts", [("Acts", "ACT")]),
    ("epistles", [("Romans", "ROM"), ("1 Corinthians", "1CO"), ("2 Corinthians", "2CO"), ("Galatians", "GAL"), ("Ephesians", "EPH"),
                  ("Philippians", "PHP"), ("Colossians", "COL"), ("1 Thessalonians", "1TH"), ("2 Thessalonians", "2TH"), ("1 Timothy", "1TI"),
                  ("2 Timothy", "2TI"), ("Titus", "TIT"), ("Philemon", "PHM"), ("Hebrews", "HEB"), ("James", "JAS"), ("1 Peter", "1PE"),
                  ("2 Peter", "2PE"), ("1 John", "1JN"), ("2 John", "2JN"), ("3 John", "3JN"), ("Jude", "JUD")]),
    ("revelation", [("Revelation", "REV")]),
] for n, c in books]
BY_NAME = {n.lower(): (n, c, s) for n, c, s in BOOKS}
BY_NAME["psalm"] = BY_NAME["psalms"]
ROMAN = {"i": "1", "ii": "2", "iii": "3"}


def book_of(name: str) -> tuple[str, str, str] | None:
    words = name.strip().lower().split()
    if words and words[0] in ROMAN:
        words[0] = ROMAN[words[0]]
    return BY_NAME.get(" ".join(words))


def verses(code: str, chapter: int, first: int, last: int) -> list[dict]:
    for path in sorted((SITE / f"data/text/kjv/{code}").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if str(chapter) in data:
            out = []
            for v in data[str(chapter)]["v"]:
                if first <= int(v["n"]) <= last:
                    words = "".join(p if isinstance(p, str) else p[0] if isinstance(p, list) else "" for p in v["r"])
                    out.append({"n": int(v["n"]), "text": " ".join(words.replace("¶", "").split())})
            return out
    raise LookupError(f"no KJV text for {code} {chapter}:{first}-{last}")


def passage(label: str, code: str, chapter: int, first: int, last: int | None = None) -> dict:
    return {"ref": label, "code": code, "chapter": chapter, "verses": verses(code, chapter, first, last or first)}


SHOWN_VERSES = 4  # verses of a placed passage carried in the data; the reader holds the rest


def placed_passage(book: str, code: str, ref: str) -> dict:
    """One passage hymnal editors tie the hymn to ("17:16-17", "15:11-32", or a whole chapter "2"), with its first verses."""
    found = re.match(r"^(\d+)(?::(\d+)(?:[-–](\d+))?)?$", ref.strip())
    if not found:
        raise ValueError(f"placed passage {book} {ref!r}: expected chapter, chapter:verse or chapter:verse-verse")
    chapter = int(found.group(1))
    first = int(found.group(2) or 1)
    last = int(found.group(3) or found.group(2) or 0)
    whole = found.group(2) is None
    held = verses(code, chapter, first, 999 if whole else last)
    label = f"{'Psalm' if book == 'Psalms' else book} {ref.replace('-', '–')}"
    return {"ref": ref, "label": label, "code": code, "chapter": chapter, "first": first, "whole": whole,
            "count": len(held), "verses": held[:SHOWN_VERSES]}


hymn = json.loads((HYMNS / f"normalized/hymns/{HYMN_ID}.json").read_text(encoding="utf-8"))
stanzas = [s.split("\n") for s in hymn["text"].split("\n\n")]

# Each echo: the line (stanza, line in stanza) and a verse hymnal editors attach to this hymn (Hymnary.org) that it echoes.
ECHOES = [
    (0, 2, passage("Luke 15:24", "LUK", 15, 24), "he was lost, and is found"),
    (0, 3, passage("John 9:25", "JHN", 9, 25), "whereas I was blind, now I see"),
    (1, 0, passage("Titus 2:11–12", "TIT", 2, 11, 12), "the grace of God … teaching us"),
    (2, 2, passage("1 Samuel 7:12", "1SA", 7, 12), "Hitherto hath the LORD helped us"),
    (2, 2, passage("1 Chronicles 17:16", "1CH", 17, 16), "that thou hast brought me hitherto"),
    (3, 1, passage("Psalm 119:114", "PSA", 119, 114), "I hope in thy word"),
    (3, 2, passage("Psalm 119:57", "PSA", 119, 57), "Thou art my portion, O LORD"),
    (4, 0, passage("Psalm 73:26", "PSA", 73, 26), "My flesh and my heart faileth"),
    (4, 2, passage("Hebrews 6:19", "HEB", 6, 19), "that within the veil"),
    (5, 0, passage("2 Peter 3:10", "2PE", 3, 10), "the elements shall melt"),
    (5, 1, passage("Revelation 22:5", "REV", 22, 5), "neither light of the sun"),
]

# Where hymnal editors place it: every passage Hymnary links to the hymn, grouped by book in Bible order.
record = json.loads((HYMNS / "normalized/scripture-index/hymnary-amazing-grace-how-sweet-the-sound.json").read_text(encoding="utf-8"))
placed: dict[str, list[str]] = {}
for ref in record.get("scripture_references") or []:
    raw = ref.get("raw") or ""
    found = re.match(r"^((?:[123] )?[A-Za-z ]+?)\s+(\d.*)$", raw)
    book = book_of(found.group(1)) if found else None
    if book:
        placed.setdefault(book[0], [])
        if found.group(2) not in placed[book[0]]:
            placed[book[0]].append(found.group(2))
hymnals = None
for path in (HYMNS / "raw/hymnary").glob("*.json"):
    for first_line, h in json.loads(path.read_text(encoding="utf-8")).items():
        if first_line.lower().startswith("amazing grace! (how sweet"):
            hymnals = int(h.get("number of hymnals") or 0) or hymnals

# Olney Hymns Book I ("On select passages of Scripture"), which runs through the Bible in order.
book1 = []
for path in (HYMNS / "normalized/hymns").glob("ccel-olney-hymns-*.json"):
    h = json.loads(path.read_text(encoding="utf-8"))
    found_book = book_of(h.get("book") or "")
    number = re.match(r"\d+", h.get("number") or "")
    if found_book and number:
        book1.append({"n": int(number.group()), "title": h["title"], "author": h["author"], "book": found_book[0], "tone": found_book[2]})
book1.sort(key=lambda h: h["n"])

data = {
    "id": HYMN_ID, "title": hymn["title"], "author": hymn["author"], "authorDates": "1725–1807", "year": hymn["year"],
    "collection": "Olney Hymns", "bookOfCollection": "Book I · On select passages of Scripture", "number": int(hymn["number"]),
    "meter": "8.6.8.6", "meterName": "Common Metre", "stanzas": stanzas,
    "heading": {"label": "1 Chronicles 17:16–17", "passage": passage("1 Chronicles 17:16–17", "1CH", 17, 16, 17)},
    "echoes": [{"stanza": stanza, "line": line, "words": words, **found} for stanza, line, found, words in ECHOES],
    "hymnals": hymnals,
    "placed": [{"book": n, "code": c, "tone": s, "refs": [placed_passage(n, c, r) for r in placed[n]]} for n, c, s in BOOKS if n in placed],
    "book1": book1,
    "olneyAuthors": {"John Newton": 281, "William Cowper": 68},
    "source": {"title": hymn["source"]["title"], "url": hymn["source"]["url"], "licence": hymn["source"]["licence"],
               "hymnary": "https://hymnary.org/text/amazing_grace_how_sweet_the_sound"},
}
(HERE / "shared").mkdir(exist_ok=True)
(HERE / "shared/data.js").write_text(
    "// Generated by build-data.py from Research/Hymns and Website/data/text/kjv. Do not edit by hand.\n"
    f"window.HYMN = {json.dumps(data, ensure_ascii=False, indent=1)};\n", encoding="utf-8")
print(f"stanzas {len(stanzas)}, echoes {len(ECHOES)}, books placed {len(data['placed'])}, passages "
      f"{sum(len(p['refs']) for p in data['placed'])}, hymnals {hymnals}, Book I hymns {len(book1)}")
