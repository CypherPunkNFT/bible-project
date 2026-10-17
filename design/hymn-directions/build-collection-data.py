"""Write shared/collection-data.js for the Hymns collection mock-up: every distinct hymn whose words are held, filed by
its book (or hand), with the Bible chapter it is written on.

The hymns corpus holds 1,812 hymn texts, but CCEL's combined Watts edition repeats most of the hymns in Project
Gutenberg's separate Watts books, so they are matched by first line and each hymn kept once, from its own book.
Reads only Research/Hymns and design/authors-directions/shared/authors-data.js (for the 66 books and their chapters).
Run: py -3.12 design/hymn-directions/build-collection-data.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
HYMNS = SITE.parent / "Research/Hymns/normalized/hymns"

# The books (or hands) on the page, in the order they are listed.
GROUPS = [
    {"id": "psalms", "label": "The Psalms of David Imitated", "short": "Psalms Imitated", "who": "Isaac Watts", "year": 1719, "tone": "--poetry"},
    {"id": "hss", "label": "Hymns and Spiritual Songs", "short": "Hymns & Songs", "who": "Isaac Watts", "year": 1707, "tone": "--epistles"},
    {"id": "divine", "label": "Divine Songs for Children", "short": "Divine Songs", "who": "Isaac Watts", "year": 1715, "tone": "--acts"},
    {"id": "newton", "label": "Olney Hymns · John Newton", "short": "Newton", "who": "John Newton", "year": 1779, "tone": "--history"},
    {"id": "cowper", "label": "Olney Hymns · William Cowper", "short": "Cowper", "who": "William Cowper", "year": 1779, "tone": "--prophets"},
]
# Which source wins when the same hymn is held twice: the separate books first, the combined CCEL edition last.
PREFERENCE = ["gutenberg-watts-psalms", "gutenberg-watts-hymns", "ccel-watts-divine-songs", "ccel-olney-hymns", "ccel-watts-psalms-hymns"]
OSIS = {"Gen": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU", "Josh": "JOS", "Judg": "JDG", "Ruth": "RUT", "1Sam": "1SA",
        "2Sam": "2SA", "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH", "2Chr": "2CH", "Ezra": "EZR", "Neh": "NEH", "Esth": "EST", "Job": "JOB",
        "Ps": "PSA", "Prov": "PRO", "Eccl": "ECC", "Song": "SNG", "Isa": "ISA", "Jer": "JER", "Lam": "LAM", "Ezek": "EZK", "Dan": "DAN",
        "Hos": "HOS", "Joel": "JOL", "Amos": "AMO", "Obad": "OBA", "Jonah": "JON", "Mic": "MIC", "Nah": "NAM", "Hab": "HAB", "Zeph": "ZEP",
        "Hag": "HAG", "Zech": "ZEC", "Mal": "MAL", "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT", "Rom": "ROM",
        "1Cor": "1CO", "2Cor": "2CO", "Gal": "GAL", "Eph": "EPH", "Phil": "PHP", "Col": "COL", "1Thess": "1TH", "2Thess": "2TH",
        "1Tim": "1TI", "2Tim": "2TI", "Titus": "TIT", "Phlm": "PHM", "Heb": "HEB", "Jas": "JAS", "1Pet": "1PE", "2Pet": "2PE", "1John": "1JN",
        "2John": "2JN", "3John": "3JN", "Jude": "JUD", "Rev": "REV"}


def first_line_key(line: str) -> str:
    """The same hymn in two editions: letters only, British and American spellings made one ("Saviour" = "Savior")."""
    letters = re.sub(r"[^a-z]", "", line.lower())
    return letters.replace("our", "or").replace("awe", "aw")[:36]


def books_of_bible() -> list[dict]:
    text = (SITE / "design/authors-directions/shared/authors-data.js").read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"):text.rindex("}") + 1])
    return [{"code": b["code"], "name": b["name"], "section": b["section"], "chapters": b["chapters"]} for b in data["books"]]


def group_of(hymn: dict) -> str:
    slug = hymn["source"]["slug"]
    if slug == "ccel-olney-hymns":
        return "newton" if hymn["author"] == "John Newton" else "cowper"
    if slug == "ccel-watts-divine-songs":
        return "divine"
    if slug == "gutenberg-watts-psalms":
        return "psalms"
    if slug == "gutenberg-watts-hymns":
        return "hss"
    return "psalms" if re.search(r"psalm", f"{hymn.get('book') or ''} {hymn.get('title') or ''}", re.I) else "hss"


def main_ref(hymn: dict, index: dict[str, int], books: list[dict]) -> tuple[int, str] | None:
    """The hymn's main text: its first citation that names a chapter, as book·chapter·verse in one number, and a label."""
    for r in hymn.get("scripture_references") or []:
        start = r.get("start") or {}
        code = OSIS.get(start.get("book") or "")
        if r.get("parsed") and code in index and start.get("chapter"):
            b, chapter, verse = index[code], int(start["chapter"]), int(start.get("verse") or 1)
            if chapter <= len(books[b]["chapters"]):
                name = "Psalm" if code == "PSA" else books[b]["name"]
                return (b + 1) * 1_000_000 + chapter * 1000 + verse, f"{name} {chapter}" + (f":{start['verse']}" if start.get("verse") else "")
    return None


books = books_of_bible()
index = {b["code"]: i for i, b in enumerate(books)}
held = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(HYMNS.glob("*.json"))]
held = [h for h in held if h.get("text")]
by_first: dict[str, list[dict]] = {}
for h in held:
    by_first.setdefault(first_line_key(h["first_line"]), []).append(h)

hymns = []
for copies in by_first.values():
    copies.sort(key=lambda h: PREFERENCE.index(h["source"]["slug"]))
    keep = copies[0]
    ref = next((r for r in (main_ref(c, index, books) for c in copies) if r), None)
    hymns.append({"id": keep["id"], "t": keep["first_line"], "s": keep.get("subject") or "", "g": group_of(keep), "a": keep["author"], "y": keep["year"],
                  "m": keep.get("meter") or "", "v": ref[0] if ref else 0, "r": ref[1] if ref else "", "copies": len(copies)})
hymns.sort(key=lambda h: (h["v"] or 10**10, h["t"]))
out = {"books": books, "groups": GROUPS, "hymns": hymns,
       "counts": {"records": len(held), "distinct": len(hymns), "withChapter": sum(1 for h in hymns if h["v"]),
                  "heldTwice": sum(1 for h in hymns if h["copies"] > 1)}}
(HERE / "shared/collection-data.js").write_text(
    "// Generated by build-collection-data.py from Research/Hymns. Do not edit by hand.\n"
    f"window.HYMNS = {json.dumps(out, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
print(out["counts"], Counter(h["g"] for h in hymns), Counter(h["g"] for h in hymns if h["v"]))
