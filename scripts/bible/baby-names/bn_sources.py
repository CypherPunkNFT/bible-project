"""Biblical baby names: readers for the sources the build uses (docs/features/baby-names/design.md 3.1).

Every reader returns plain Python data; nothing here decides a meaning or a page (bn_meaning.py, bn_assemble.py).
  - TIPNR (STEP Bible, CC BY 4.0): each person's name lines (English form, Strong's number, original word, verses).
  - The Berean Standard Bible USFM (public domain): the Strong's-tagged proper names in each verse, and the name notes.
  - Strong's dictionaries (public domain text): Open Scriptures' HebrewStrong.xml (only <w>, <source>, <meaning>,
    <usage>) and Ulrik Petersen's public-domain strongsgreek.xml.
  - Hitchcock's Bible Names (1869, public domain text).
  - The US Social Security Administration's national baby-name file (public domain), when it is on this PC.
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from bible.books import BOOK_NUMBER, verse_id  # noqa: E402
from bible.study_people import RECORD, _base_key, _cols, _name_forms, _ref_id, _slug  # noqa: E402
from bible.study_refs import Verses  # noqa: E402

# TIPNR line kinds that name the person; "Name combined", "Mentioned" and the variant lines do not.
NAME_KINDS = {"Named", "Greek", "Aramaic", "Spelled"}
STRONG_BASE = re.compile(r"^([HG])0*(\d+)")


def strong_base(raw: str) -> str:
    """'H0085' / 'G3137J' / 'H5279G' -> 'H85' / 'G3137' / 'H5279' (the plain Strong's number)."""
    match = STRONG_BASE.match(raw.strip())
    if not match:
        raise ValueError(f"baby-names: {raw!r} is not a Strong's number (expected H or G and digits)")
    return f"{match.group(1)}{int(match.group(2))}"


@dataclass
class NameLine:
    kind: str
    forms: list[str]          # every English form TIPNR gives, ESV/NIV first
    strongs: str              # plain Strong's number, 'H5146'
    original: str             # Hebrew or Greek word
    refs: list[int]           # verse ids


@dataclass
class TipnrPerson:
    id: str
    key: str
    lines: list[NameLine] = field(default_factory=list)


def _ordered_forms(column: str) -> list[str]:
    """'Noe =KJV; Noah =ESV,NIV,KJV' -> ['Noah', 'Noe']: the modern translations' form first."""
    parts = [p.strip() for p in column.split(";") if p.strip()]
    modern = [p for p in parts if re.search(r"=\s*[^;]*\b(ESV|NIV)\b", p)]
    rest = [p for p in parts if p not in modern]
    forms: list[str] = []
    for part in modern + rest:
        for form in _name_forms(part):
            if form not in forms:
                forms.append(form)
    return forms


def read_tipnr(source: str, verses: Verses) -> dict[str, TipnrPerson]:
    """person id -> its name lines. Ids are made exactly as study_people.py makes them."""
    people: dict[str, TipnrPerson] = {}
    seen: Counter = Counter()
    for chunk in RECORD.split(source)[1:]:
        chunk = re.split(r"^\$=", chunk, maxsplit=1, flags=re.M)[0]
        lines = [line.rstrip("\r") for line in chunk.split("\n")]
        lines = [line for line in lines[1:] if line.strip("\t ")]
        if not lines or "UnifiedName" in lines[0]:
            continue
        head = _cols(lines[0])
        if len(head) < 9 or "=" not in head[0]:
            continue
        key = head[0].split("=")[0].strip()
        base = _slug(_base_key(key))
        seen[base] += 1  # same name and first verse: study_people.py numbers the later ones -2, -3
        person = TipnrPerson(id=base if seen[base] == 1 else f"{base}-{seen[base]}", key=key)
        for line in lines[1:]:
            if not line.startswith("– "):
                continue
            cols = _cols(line)
            kind = cols[0][2:].strip()
            if kind not in NAME_KINDS or len(cols) < 5 or "«" not in cols[2] or "+" in cols[2]:
                continue
            estrong, _, rest = cols[2].partition("«")
            original = rest.partition("=")[2].strip()
            refs = sorted({vid for ref in cols[4].split(";") if ref.strip() and (vid := _ref_id(ref, verses))})
            forms = _ordered_forms(cols[3])
            if forms and refs:
                person.lines.append(NameLine(kind, forms, strong_base(estrong), original, refs))
        people[person.id] = person
    return people


# ---- Berean Standard Bible USFM -------------------------------------------------------------------------------

USFM_PIECE = re.compile(
    r"\\c (?P<c>\d+)"
    r"|\\v (?P<v>\d+)"
    r"|\\\+?w (?P<word>[^|\\]+)\|strong=\"(?P<strong>[HG]\d+)[a-z]?\"\\\+?w\*"
    r"|\\f \+ (?P<note>.*?)\\f\*",
    re.S,
)
NOTE_MARKER = re.compile(r"\\\+?[a-z]+\d?\*?\s?")
POSSESSIVE = re.compile(r"[’']s?$")


@dataclass
class BereanNote:
    verse: int
    text: str
    word: str      # the tagged word just before the note
    strongs: str   # its Strong's number ('' when none precedes it in the verse)


@dataclass
class Berean:
    # (verse id, Strong's) -> spellings of the capitalised words tagged with it in that verse
    words: dict[tuple[int, str], Counter] = field(default_factory=lambda: defaultdict(Counter))
    notes: list[BereanNote] = field(default_factory=list)


def read_berean(folder: Path) -> Berean:
    berean = Berean()
    files = sorted(folder.glob("*engbsb.usfm"))
    if not files:
        raise FileNotFoundError(f"baby-names: no Berean USFM files (*engbsb.usfm) in {folder}")
    for path in files:
        code = path.name[3:6]
        if code not in BOOK_NUMBER:
            continue  # front matter, glossary
        chapter = verse = 0
        last: tuple[str, str] = ("", "")
        for piece in USFM_PIECE.finditer(path.read_text(encoding="utf-8")):
            if piece.group("c"):
                chapter, verse, last = int(piece.group("c")), 0, ("", "")
            elif piece.group("v"):
                verse, last = int(piece.group("v")), ("", "")
            elif piece.group("word") and verse:
                word = POSSESSIVE.sub("", piece.group("word").strip())
                strongs = strong_base(piece.group("strong"))
                if word[:1].isupper():
                    berean.words[(verse_id(code, chapter, verse), strongs)][word] += 1
                last = (word, strongs)
            elif piece.group("note") and verse:
                text = re.sub(r"\s+", " ", NOTE_MARKER.sub(" ", piece.group("note"))).strip()
                text = re.sub(r"^[\d:.,–-]+\s+", "", text)  # the note's own verse label
                berean.notes.append(BereanNote(verse_id(code, chapter, verse), text, last[0], last[1]))
    return berean


def read_plain_bible(folder: Path) -> dict[int, str]:
    """The site's plain Berean (data/plain/bsb/<BOOK>.json, "chapter:verse" -> words): verse id -> words."""
    verses: dict[int, str] = {}
    for code in BOOK_NUMBER:
        path = folder / f"{code}.json"
        if not path.exists():
            continue  # the Apocrypha, which the Berean does not have
        for key, text in json.loads(path.read_text(encoding="utf-8")).items():
            chapter, _, verse = key.partition(":")
            if chapter.isdigit() and verse.isdigit():
                verses[verse_id(code, int(chapter), int(verse))] = text
    if not verses:
        raise FileNotFoundError(f"baby-names: no plain Berean books in {folder}; build the Bible data first")
    return verses


# ---- Strong's dictionaries ------------------------------------------------------------------------------------

@dataclass
class StrongEntry:
    id: str            # 'H2584'
    word: str          # original script
    translit: str
    is_name: bool      # a proper name ('n-pr…' in Hebrew; capitalised kjv_def in Greek)
    source: str        # derivation text with references written as 'H2603'
    meaning: str       # Hebrew <meaning> + <usage>; Greek strongs_def
    usage: str = ""


def _flat(element: ET.Element | None, ref_attr: str, ref_prefix) -> str:
    """An element's text with every cross-reference written as its Strong's number ('from H2603; favored;')."""
    if element is None:
        return ""
    out = [element.text or ""]
    for child in element:
        ref = child.get(ref_attr)
        if ref is not None and child.tag.split("}")[-1] in ("w", "strongsref"):
            out.append(ref_prefix(child, ref))
        else:
            out.append(_flat(child, ref_attr, ref_prefix))
        out.append(child.tail or "")
    return re.sub(r"\s+", " ", "".join(out)).strip()


def read_hebrew_strongs(path: Path) -> dict[str, StrongEntry]:
    ns = {"s": "http://openscriptures.github.com/morphhb/namespace"}
    entries = {}
    for entry in ET.parse(path).getroot().findall("s:entry", ns):
        w = entry.find("s:w", ns)
        sid = entry.get("id", "")
        ref = lambda _child, value: strong_base(value)  # noqa: E731
        entries[sid] = StrongEntry(
            id=sid, word=(w.text or "") if w is not None else "", translit=w.get("xlit", "") if w is not None else "",
            is_name=(w.get("pos", "") if w is not None else "").startswith("n-pr"),
            source=_flat(entry.find("s:source", ns), "src", ref),
            meaning=_flat(entry.find("s:meaning", ns), "src", ref),
            usage=_flat(entry.find("s:usage", ns), "src", ref),
        )
    return entries


def read_greek_strongs(path: Path) -> dict[str, StrongEntry]:
    def ref(child: ET.Element, value: str) -> str:
        return ("H" if child.get("language") == "HEBREW" else "G") + str(int(value))
    entries = {}
    for entry in ET.parse(path).getroot().iter("entry"):
        sid = "G" + str(int(entry.get("strongs", "0")))
        greek = entry.find("greek")
        kjv = re.sub(r"^:--", "", _flat(entry.find("kjv_def"), "strongs", ref))
        definition = _flat(entry.find("strongs_def"), "strongs", ref)
        entries[sid] = StrongEntry(
            id=sid, word=greek.get("unicode", "") if greek is not None else "",
            translit=greek.get("translit", "") if greek is not None else "",
            is_name=bool(re.search(r"\bthe name of\b|, an? [A-Z]|, a Christian|, an Israelite", definition)) or kjv[:1].isupper(),
            source=_flat(entry.find("strongs_derivation"), "strongs", ref), meaning=definition, usage=kjv,
        )
    return entries


# ---- Hitchcock, SSA -------------------------------------------------------------------------------------------

def read_hitchcock(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    pairs = re.findall(r"<term[^>]*>([^<]+)</term>\s*<def[^>]*>(.*?)</def>", text, re.S)
    found: dict[str, str] = {}
    for term, definition in pairs:
        found.setdefault(term.strip(), re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", definition)).strip())
    return found


@dataclass
class Popularity:
    year: int = 0
    boys: dict[str, int] = field(default_factory=dict)    # name -> rank (1 = most given)
    girls: dict[str, int] = field(default_factory=dict)


def read_ssa(path: Path) -> Popularity:
    """The latest year in the SSA national file (names.zip: yobYYYY.txt lines 'Name,F,count'). Absent file: no ranks."""
    if not path.exists():
        return Popularity()
    with zipfile.ZipFile(path) as archive:
        years = sorted(int(m.group(1)) for n in archive.namelist() if (m := re.fullmatch(r"yob(\d{4})\.txt", n)))
        if not years:
            raise ValueError(f"baby-names: {path} holds no yobYYYY.txt file; is it the SSA national names.zip?")
        rows = archive.read(f"yob{years[-1]}.txt").decode("utf-8").splitlines()
    counts: dict[str, list[tuple[int, str]]] = {"M": [], "F": []}
    for row in rows:
        name, sex, count = row.split(",")
        counts[sex].append((-int(count), name))
    rank = lambda items: {name: i + 1 for i, (_c, name) in enumerate(sorted(items))}  # noqa: E731
    return Popularity(years[-1], rank(counts["M"]), rank(counts["F"]))
