"""Reading the catalogue's free text for build-data.py: dates and contents.

The corpus stores contents only as the catalogue's own words ("Gospels †", "Acts, Cath., Paul", "John 1:1–6:11; …"),
so books and chapters are read from those words here. Anything not understood is left unread, never guessed.
"""
import re

from ms_tables import BOOKS, CATHOLIC, CODE_INDEX, GOSPELS, NT, PAUL

CHAPTERS = {code: ch for code, _name, ch, _sec in BOOKS}


def ordinal(n: int) -> str:
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def century(c: int, bc: bool = False) -> dict:
    if bc:
        return {"e": -c * 100 + 1, "l": -(c - 1) * 100, "d": f"{ordinal(c)} century BC"}
    return {"e": (c - 1) * 100 + 1, "l": c * 100, "d": f"{ordinal(c)} century"}


def reparse_century(raw: str) -> dict | None:
    """Raw strings the corpus left unparsed, such as '6th-century' or '4th / 5th-century'."""
    found = [int(x) for x in re.findall(r"(\d{1,2})(?:st|nd|rd|th)", raw)]
    if not found or any(c < 1 or c > 20 for c in found):
        return None
    lo, hi = century(min(found)), century(max(found))
    label = lo["d"] if lo == hi else f"{ordinal(min(found))}–{ordinal(max(found))} century"
    return {"e": lo["e"], "l": hi["l"], "d": label, "db": "reparsed"}


def wikidata_date(date: dict | None) -> dict | None:
    if not date:
        return None
    raw, basis, e, late = date["raw"] or "", date["basis"], date["earliest"], date["latest"]
    if basis == "unparsed":
        return reparse_century(raw)
    if basis == "explicit-year" and date["source_field"] == "wikidata:P571":
        # Wikidata stores a century as a year: 1000 or 1001 for the tenth or eleventh century. Read it as that century.
        if e % 100 == 0:
            return {**century(e // 100), "db": "century-from-year"}
        if e % 100 == 1:
            return {**century(e // 100 + 1), "db": "century-from-year"}
        return {"e": e, "l": e, "d": f"c. {e}", "db": "year"}
    if basis == "explicit-year":
        return {"e": e, "l": e, "d": str(e), "db": "year"}
    if basis == "century":
        return {**century(date["century_earliest"]), "db": "century"}
    if basis == "century-span":
        a, b = date["century_earliest"], date["century_latest"]
        return {"e": e, "l": late, "d": f"{ordinal(a)}–{ordinal(b)} century", "db": "century"}
    stated = re.search(r"(\d{3,4})\s*[-–]\s*(\d{3,4})", raw.replace("&ndash;", "–"))
    if stated and (int(stated.group(1)), int(stated.group(2))) != (e, late) and int(stated.group(1)) < int(stated.group(2)):
        a, b = int(stated.group(1)), int(stated.group(2))
        return {"e": a, "l": b, "d": f"c. {a}–{b}", "db": "reparsed-range"}
    approx = "c. " if (date.get("note") or "").startswith("approximate") or "c." in raw or "circa" in raw else ""
    return {"e": e, "l": late, "d": f"{approx}{e}–{late}" if e != late else f"{approx}{e}", "db": "range"}


def parse_note_date(note: str) -> dict | None:
    """A date stated in the corpus's pinned-identity note ('dated 1008/1009 by colophon', '6th-century', 'c. 900')."""
    bc = re.search(r"(\d{1,2})(?:st|nd|rd|th)-century BC", note)
    if bc:
        return century(int(bc.group(1)), bc=True)
    colophon = re.search(r"dated (\d{3,4})/(\d{3,4}) by colophon", note)
    if colophon:
        return {"e": int(colophon.group(1)), "l": int(colophon.group(2)), "d": f"{colophon.group(1)}–{colophon.group(2)}, by its colophon"}
    cent = re.search(r"(\d{1,2})(?:st|nd|rd|th)-century", note)
    if cent:
        return century(int(cent.group(1)))
    circa = re.search(r"c\. (\d{3,4})", note)
    if circa:
        year = int(circa.group(1))
        return {"e": year, "l": year, "d": f"c. {year}"}
    return None


SPECIFIC = [
    ("1JN", r"(?:1|first|i) (?:epistle of )?john"), ("2JN", r"(?:2|second|ii) (?:epistle of )?john"), ("3JN", r"(?:3|third|iii) (?:epistle of )?john"),
    ("1PE", r"(?:1|first|i) (?:epistle of )?peter"), ("2PE", r"(?:2|second|ii) (?:epistle of )?peter"),
    ("1CO", r"(?:1|first|i) (?:epistle to the )?(?:corinthians|cor)"), ("2CO", r"(?:2|second|ii) (?:epistle to the )?(?:corinthians|cor)"),
    ("1TH", r"(?:1|first|i) (?:epistle to the )?(?:thessalonians|thess)"), ("2TH", r"(?:2|second|ii) (?:epistle to the )?(?:thessalonians|thess)"),
    ("1TI", r"(?:1|first|i) (?:epistle to )?timothy"), ("2TI", r"(?:2|second|ii) (?:epistle to )?timothy"),
    ("REV", r"(?:book of )?(?:revelation|apocalypse)(?: of john)?"), ("ACT", r"(?:book of )?acts(?: of (?:the )?apostles)?"),
    ("MAT", r"(?:gospel of )?(?:matth?ews?|mathews?|matt)"), ("MRK", r"(?:gospel of )?mark"), ("LUK", r"(?:gospel of )?luke"), ("JHN", r"(?:gospel of )?john"),
    ("ROM", r"(?:epistle to the )?romans"), ("GAL", r"(?:epistle to the )?galatians"), ("EPH", r"(?:epistle to the )?ephesians"),
    ("PHP", r"(?:epistle to the )?philippians"), ("COL", r"(?:epistle to the )?colossians"), ("TIT", r"(?:epistle to )?(?:titus|tit)"),
    ("PHM", r"(?:epistle to )?philemon"), ("HEB", r"(?:epistle to the )?hebrews"), ("JAS", r"(?:epistle of )?james"), ("JUD", r"jude"),
]
SPECIFIC_RE = re.compile("|".join(f"(?P<b{i}>\\b{pattern}\\b)" for i, (_c, pattern) in enumerate(SPECIFIC)))


def group_books(text: str) -> set[str]:
    books: set[str] = set()
    if re.search(r"new testament|\bnt\b", text):
        books |= set(NT)
        if re.search(r"except[^)]*(rev|apocalypse)", text):
            books.discard("REV")
        if re.search(r"except[^)]*gospels", text):
            books -= set(GOSPELS)
    if re.search(r"\bgospels\b|tetraevangel", text):
        books |= set(GOSPELS)
    if re.search(r"\bcath|general epistles|\bce\b|\bge\b|catholic", text):
        books |= set(CATHOLIC)
    if re.search(r"pauline|\bpaul\b", text):
        books |= set(PAUL)
    if re.search(r"\brev\b", text):
        books.add("REV")
    return books


def chapters_in(segment: str, code: str) -> set[int]:
    segment = re.sub(r"\([^)]*\)", " ", segment)
    stop = re.search(r"[a-z]", segment)
    segment = segment[: stop.start()] if stop else segment
    found: set[int] = set()
    for piece in segment.split(";"):
        seen_colon = False
        for part in piece.split(","):
            part = part.strip()
            ref = re.fullmatch(r"(\d+):\d+\s*(?:-\s*(?:(\d+):)?\d+)?", part)
            plain = re.fullmatch(r"(\d+)\s*(?:-\s*(\d+))?", part)
            if ref:
                seen_colon = True
                lo, hi = int(ref.group(1)), int(ref.group(2) or ref.group(1))
            elif plain and not seen_colon:
                lo, hi = int(plain.group(1)), int(plain.group(2) or plain.group(1))
            else:
                continue
            if 1 <= lo <= hi <= CHAPTERS[code]:
                found |= set(range(lo, hi + 1))
    return found


def parse_contents(raw: str) -> tuple[set[str], dict[str, set[int]]]:
    text = raw.lower().replace("–", "-").replace("—", "-").replace("†", " ").replace("+", ";")
    if "glossary" in text:
        return set(), {}
    books = group_books(text)
    chapters: dict[str, set[int]] = {}
    matches = list(SPECIFIC_RE.finditer(text))
    for n, match in enumerate(matches):
        code = SPECIFIC[int(match.lastgroup[1:])][0]
        books.add(code)
        end = matches[n + 1].start() if n + 1 < len(matches) else len(text)
        found = chapters_in(text[match.end():end], code)
        if found:
            chapters.setdefault(code, set()).update(found)
    assert all(code in CODE_INDEX for code in books), f"parse_contents: unknown book code in {books} from {raw!r}"
    return books, chapters
