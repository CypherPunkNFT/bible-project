"""Step 1 of the hymns pipeline: the 1,228 distinct hymns in one clean list.

The corpus holds 1,812 hymn texts, but CCEL's combined Watts volume repeats most of the hymns in Project Gutenberg's
separate Watts books. Copies are matched by first line (letters only, British and American spellings made one) and
each hymn is kept once, its words from its own book. For each hymn: its text stanza by stanza, its book and number,
its place in that book, its metre, and the verse printed above it (its heading), resolved against the site's KJV.

The heading comes from CCEL's ThML markup where a copy has it (the corpus's most reliable layer), else from the
Gutenberg heading line. A heading that does not resolve to a real verse is kept as printed and flagged, never fixed.

Reads Research/Hymns/normalized/hymns and raw/ccel/newton_olneyhymns.xml (for the Olney book each hymn is in) and the
site's data/plain/kjv. Writes Research/Hymns/pipeline/hymns.json.

    python scripts/hymns/build-hymns.py
"""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import (
    CORPUS,
    HYMNS_FILE,
    NORMALIZED,
    OSIS_TO_CODE,
    chapter_verses,
    read_json,
    ref_label,
    verse_text,
    write_json,
)

sys.stdout.reconfigure(encoding="utf-8")

# Which copy's words are shown when a hymn is held twice: the separate books first, the combined CCEL edition last.
TEXT_PREFERENCE = ["gutenberg-watts-psalms", "gutenberg-watts-hymns", "ccel-watts-divine-songs", "ccel-olney-hymns", "ccel-watts-psalms-hymns"]
# Which copy's heading is trusted first: CCEL's structured markup, then Gutenberg's printed heading line.
REF_PREFERENCE = ["ccel-olney-hymns", "ccel-watts-divine-songs", "ccel-watts-psalms-hymns", "gutenberg-watts-psalms", "gutenberg-watts-hymns"]
GROUPS = {
    "psalms": ("The Psalms of David Imitated", "Isaac Watts", 1719),
    "hss": ("Hymns and Spiritual Songs", "Isaac Watts", 1707),
    "divine": ("Divine Songs for Children", "Isaac Watts", 1715),
    "newton": ("Olney Hymns", "John Newton", 1779),
    "cowper": ("Olney Hymns", "William Cowper", 1779),
}
OLNEY_BOOKS = {"On Select Passages of Scripture": (1, "Book I · On select passages of Scripture"),
               "On Occasional Subjects.": (2, "Book II · On occasional subjects"),
               "On the Spiritual Life.": (3, "Book III · On the progress and changes of the spiritual life"),
               "From the Complete Works of William Cowper": (4, "From Cowper's collected works")}
HSS_BOOKS = {1: "Book I · Collected from the Holy Scriptures", 2: "Book II · Composed on divine subjects",
             3: "Book III · Prepared for the Lord's Supper"}
METRES = {"8,6,8,6": "Common Metre", "c. m.": "Common Metre", "common metre": "Common Metre", "8,8,8,8": "Long Metre",
          "l. m.": "Long Metre", "long metre": "Long Metre", "6,6,8,6": "Short Metre", "s. m.": "Short Metre", "short metre": "Short Metre"}
METRE_DIGITS = {"Common Metre": "8.6.8.6", "Long Metre": "8.8.8.8", "Short Metre": "6.6.8.6"}
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4}


def first_line_key(line: str) -> str:
    """The same hymn in two editions: letters only, British and American spellings made one ("Saviour" = "Savior")."""
    letters = re.sub(r"[^a-z]", "", line.lower())
    return letters.replace("our", "or").replace("awe", "aw")[:36]


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
    return "psalms" if hymn["id"].startswith("ccel-watts-psalms-hymns-ps-") else "hss"


def olney_books() -> dict[tuple[str, str], str]:
    """(hymn number, first line of its first stanza) → the Olney div1 title it sits in."""
    root = ET.parse(CORPUS / "raw" / "ccel" / "newton_olneyhymns.xml").getroot()
    out: dict[tuple[str, str], str] = {}
    for div in root.iter("div1"):
        for hymn in div.iter("hymn"):
            line = next((" ".join("".join(l.itertext()).split()) for v in hymn.findall("verse") for l in v.findall("l") if "".join(l.itertext()).strip()), "")
            out[(hymn.get("n") or "", first_line_key(line))] = div.get("title") or ""
    return out


def metre(hymn: dict) -> tuple[str, str]:
    """(digits, name): "8.6.8.6", "Common Metre"; either may be empty when the book does not say."""
    raw = (hymn.get("meter") or "").strip()
    name = METRES.get(raw.lower(), "")
    digits = raw.replace(",", ".") if re.fullmatch(r"[\d,.a-zA-Z ]+", raw) and re.search(r"\d", raw) else METRE_DIGITS.get(name, "")
    return digits.strip(". "), name


def place(hymn: dict, group: str, olney: dict) -> dict:
    """The hymn's book within its collection, its printed number, and a sort key for its order in that book."""
    number = (hymn.get("number") or "").strip()
    slug = hymn["source"]["slug"]
    if group in ("newton", "cowper"):
        title = olney.get((number, first_line_key(hymn["verses"][0]["lines"][0])), "")
        if title not in OLNEY_BOOKS:
            raise LookupError(f"{hymn['id']}: no Olney book found for hymn {number!r} (div1 title {title!r})")
        part, label = OLNEY_BOOKS[title]
        n = int(re.match(r"\d+", number or "0").group())
        return {"part": f"olney-{part}", "partLabel": label, "number": str(n), "order": n}
    if group == "psalms":
        if slug == "gutenberg-watts-psalms":
            psalm, _, version = number.partition(":")
            return {"part": "psalms", "partLabel": "The Psalms of David Imitated", "number": number, "order": int(psalm) * 100 + int(version or 1)}
        found = re.search(r"Psalm (\d+)(?:\s+Part (\d+))?", hymn.get("section") or hymn.get("title") or "")
        psalm = int(found.group(1)) if found else 999
        return {"part": "psalms", "partLabel": "The Psalms of David Imitated", "number": f"{psalm}" + (f":{found.group(2)}" if found and found.group(2) else ""),
                "order": psalm * 100 + int(found.group(2) or 1) if found else 99999}
    if group == "divine":
        kind, n = number[:1], int(number[1:] or 0)
        return {"part": "divine-moral" if kind == "S" else "divine", "partLabel": "Moral Songs" if kind == "S" else "Divine Songs",
                "number": str(n), "order": (1000 if kind == "S" else 0) + n}
    if slug == "gutenberg-watts-hymns":
        book, _, n = number.partition(":")
        if not n:  # one record carries no book in its number
            book, n = "0", book
    else:
        roman, _, n = number.partition(".")
        book = str(ROMAN.get(roman, 0))
    book_n = int(book or 0)
    return {"part": f"hss-{book_n}", "partLabel": HSS_BOOKS.get(book_n, "Hymns and Spiritual Songs"), "number": n, "order": book_n * 1000 + int(re.match(r"\d+", n or "0").group() if re.match(r"\d+", n or "") else 0)}


def own_number(copy: dict, ref: dict) -> bool:
    """Divine Songs headings read "Song 9": the song's own number, which the corpus parsed as the Song of Songs."""
    return copy["source"]["slug"] == "ccel-watts-divine-songs" and bool(re.fullmatch(r"Song \d+", ref.get("raw") or ""))


def heading(copies: list[dict]) -> dict | None:
    """The verse printed above the hymn: the first subject or citation in the most trusted copy that has one, with all its
    ranges ("Psalm 44:1-3,8,15-16" is three), each checked against the KJV."""
    for copy in sorted(copies, key=lambda c: REF_PREFERENCE.index(c["source"]["slug"])):
        refs = [r for r in copy.get("scripture_references") or [] if r.get("kind") in ("subject", "citation") and not own_number(copy, r)]
        if not refs:
            continue
        first_raw = refs[0]["raw"]
        ranges, problems = [], []
        for r in (r for r in refs if r["raw"] == first_raw):
            start, end = r.get("start") or {}, r.get("end") or {}
            code = OSIS_TO_CODE.get(start.get("book") or "")
            if not r.get("parsed") or not code or not start.get("chapter"):
                problems.append(f"could not be read as book, chapter and verse ({r.get('note') or 'no parse'})")
                continue
            chapter = int(start["chapter"])
            verses = chapter_verses("kjv", code, chapter)
            if not verses:
                problems.append(f"{ref_label(code, chapter)} does not exist")
                continue
            first = int(start["verse"]) if start.get("verse") else None
            last = int(end["verse"]) if end.get("verse") and int(end.get("chapter") or chapter) == chapter else first
            if first is not None and verse_text("kjv", code, chapter, first) is None:
                problems.append(f"{ref_label(code, chapter, first)} does not exist")
                continue
            if last is not None and last not in verses:
                last = verses[-1] if last > verses[-1] else first
            entry = {"code": code, "chapter": chapter, "first": first, "last": last}
            if entry not in ranges:  # "1 Pet. 1:5, 5" names the same verse twice
                ranges.append(entry)
        if not ranges and not problems:
            continue
        label = None
        if ranges:
            r0 = ranges[0]
            label = ref_label(r0["code"], r0["chapter"], r0["first"], r0["last"])
            if len(ranges) > 1:
                label = f"{ref_label(r0['code'], r0['chapter'])}:" + ", ".join(f"{r['first']}" + (f"–{r['last']}" if r["last"] != r["first"] else "") for r in ranges)
        return {"printed": first_raw, "label": label, "ranges": ranges, "problems": problems, "from": copy["source"]["slug"]}
    return None


def stanzas_of(hymn: dict) -> list[list[str]]:
    out = [[" ".join(line.split()) for line in v["lines"] if line.strip()] for v in hymn["verses"]]
    return [s for s in out if s]


def main() -> None:
    held = [read_json(p) for p in sorted(NORMALIZED.glob("*.json"))]
    held = [h for h in held if h.get("text")]
    olney = olney_books()
    by_first: dict[str, list[dict]] = {}
    for h in held:
        by_first.setdefault(first_line_key(h["first_line"]), []).append(h)

    hymns = []
    for copies in by_first.values():
        copies.sort(key=lambda h: TEXT_PREFERENCE.index(h["source"]["slug"]))
        keep = copies[0]
        group = group_of(keep)
        digits, name = metre(next((c for c in copies if c.get("meter")), keep))
        stanzas = stanzas_of(keep)
        if not stanzas:
            raise ValueError(f"{keep['id']}: no stanzas")
        collection, author_default, year = GROUPS[group]
        hymns.append({
            "id": keep["id"], "firstLine": keep["first_line"].strip(), "title": (keep.get("title") or "").strip(),
            "subject": (keep.get("subject") or "").strip(), "author": keep["author"] or author_default, "year": year,
            "group": group, "collection": collection, **place(keep, group, olney), "metre": digits, "metreName": name,
            "stanzas": stanzas, "heading": heading(copies),
            "copies": [c["id"] for c in copies],
            "source": {k: keep["source"][k] for k in ("slug", "title", "url", "licence", "attribution")},
        })
    hymns.sort(key=lambda h: (list(GROUPS).index(h["group"]), h["order"], h["id"]))
    write_json(HYMNS_FILE, {"schema": "bibleproject.hymns-pipeline/v1", "count": len(hymns), "hymns": hymns})

    headed = [h for h in hymns if h["heading"] and h["heading"]["ranges"]]
    flagged = [h for h in hymns if h["heading"] and h["heading"]["problems"]]
    lines = sum(len(s) for h in hymns for s in h["stanzas"])
    print(f"{len(held)} texts → {len(hymns)} distinct hymns, {lines:,} lines; {len(headed)} with a heading verse; "
          f"{len(flagged)} headings with a part that does not resolve")
    print(dict(Counter(h["group"] for h in hymns)))
    for h in flagged:
        print(f"  flagged: {h['id']}: printed {h['heading']['printed']!r}: {'; '.join(h['heading']['problems'])}")


if __name__ == "__main__":
    main()
