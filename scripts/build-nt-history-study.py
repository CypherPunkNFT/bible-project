#!/usr/bin/env python3
"""Build src/pages/study/nt-history/nt-history-data.json for /study/new-testament-history.

Reads the research record (content/academic-research/43-new-testament-history.json) and refuses to write if:
- a listed verse does not exist in the site's Berean (data/text/bsb), its label does not name its book, chapter and verse,
  or its phrase is not word for word in the Berean at that verse;
- a Bible reference written in the record's prose ("Luke 2:1–2", "John 2:13; 6:4; 11:55", "Acts 24:24, 27") does not exist;
- a quotation marked "(Reference · BSB)" is not word for word the Berean at that reference;
- a verse label the page uses is not in the record's verse list;
- a timeline bar runs backwards, leaves the chart without saying so, or uses a lane the study does not have;
- an anchor (a line the lattice draws across the reigns) has years its record text does not state, or a ruler the verse names
  was not in office at every year of the anchor, or a disputed date (the birth, the cross, Luke 3:1) is not drawn twice;
- a link the page makes leaves the site or names an address the site does not route.
Check marks ({{check:cN}}…{{/check}}) are removed before any text is compared. That proves references, quotations and the shape of
the record; it does not prove any reading or any reckoning right.

Usage: python scripts/build-nt-history-study.py [--site <Website folder>] [--check]
  --check builds in memory and fails if the file on disk differs (stale or missing); it writes nothing.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/43-new-testament-history.json")
FOLDER = Path("src/pages/study/nt-history")
OUTPUT = FOLDER / "nt-history-data.json"
BUDGET_BYTES = 40_000
LANES = ["Rome", "Rulers of Herod's family", "Governors of Judea", "The New Testament"]
CHECK_MARK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
QUOTE = re.compile(r"“([^”]+)” \(([^()]+?) · BSB\)")
# The page's own links. Each must be an address src/App.tsx routes; verse links are made by the page from the verse data.
LINKS = {"academic": "/study/academic", "empires": "/study/israel-among-the-empires", "manuscripts": "/study/manuscripts"}

# The lattice's crossing lines. Each year range says where the record states it (path) and in which words (words); the
# numbers in the words must be the range. "derived" is a range the record states only relative to another ("two years
# earlier"). "alt" measures a ruler's end by his other reckoned end (Herod's 1 BC). "named" are the rulers the verse
# itself names, who must be in office at every year of every range.
ANCHORS = [
    {"id": "birth", "title": "Jesus born", "short": "Born while Herod was king", "verses": ["Matthew 2:1", "Luke 1:5", "Luke 2:1"],
     "named": ["herod", "augustus"], "textPath": ".chronology.birth.anchors[0]",
     "years": [{"label": "Early view", "from": -6, "to": -4, "path": ".chronology.birth.views[0].label", "words": "About 6 to 4 BC"},
               {"label": "Late view", "from": -3, "to": -2, "alt": True, "path": ".chronology.birth.views[1].label", "words": "About 3 to 2 BC"}]},
    {"id": "luke3", "title": "Luke 3:1–2", "short": "Seven names, one year", "verses": ["Luke 3:1", "Luke 3:2"],
     "named": ["tiberius", "pilate", "antipas", "philip"], "textPath": ".chronology.death.anchors[1]",
     "years": [{"label": "From Tiberius's sole rule", "from": 28, "to": 29, "path": ".chronology.death.anchors[1]", "words": "AD 28 or 29"},
               {"label": "From a shared rule", "from": 26, "to": 27, "derived": -2, "path": ".chronology.death.anchors[1]", "words": "two years earlier"}]},
    {"id": "temple46", "title": "Forty-six years", "short": "The temple's years, John 2:20", "verses": ["John 2:20"],
     "named": [], "textPath": ".chronology.death.anchors[2]", "countedFrom": -19,
     "years": [{"label": "Counted from Herod's eighteenth year", "from": 27, "to": 28, "path": ".chronology.death.anchors[2]", "words": "about AD 27 or 28"}]},
    {"id": "cross", "title": "The cross", "short": "Two Fridays, neither chosen", "verses": ["Mark 15:1", "Luke 23:7"],
     "named": ["pilate", "antipas"], "textPath": ".chronology.death.anchors[4]",
     "years": [{"label": "Friday 7 April", "from": 30, "to": 30, "path": ".chronology.death.views[0].label", "words": "AD 30"},
               {"label": "Friday 3 April", "from": 33, "to": 33, "path": ".chronology.death.views[1].label", "words": "AD 33"}]},
    {"id": "agrippa", "title": "Agrippa's death", "short": "Acts 12, a king struck down", "verses": ["Acts 12:1", "Acts 12:23"],
     "named": ["agrippa1"], "textPath": ".paul.fixed[1].evidence",
     "years": [{"label": "Josephus's year", "from": 44, "to": 44, "path": ".paul.fixed[1].when", "words": "AD 44"}]},
    {"id": "gallio", "title": "Gallio", "short": "An inscription at Delphi", "verses": ["Acts 18:2", "Acts 18:12"],
     "named": ["gallio", "claudius"], "textPath": ".paul.fixed[2].evidence",
     "years": [{"label": "His year in office", "from": 51, "to": 52, "path": ".paul.fixed[2].when", "words": "AD 51 or 52"}]},
    {"id": "festus", "title": "Festus", "short": "Felix succeeded, Acts 24:27", "verses": ["Acts 24:27", "Acts 25:1", "Acts 25:13"],
     "named": ["procurators", "agrippa2"], "textPath": ".paul.fixed[4].evidence",
     "years": [{"label": "By most reckonings", "from": 59, "to": 60, "path": ".paul.fixed[4].when", "words": "About AD 59 or 60"}]},
    {"id": "fall", "title": "Jerusalem falls", "short": "Luke 21:20, and Josephus", "verses": ["Luke 21:20"],
     "named": [], "textPath": ".eras[3].steps[3].evidence",
     "years": [{"label": "The temple burned", "from": 70, "to": 70, "path": ".eras[3].steps[3].when", "words": "AD 70"}]},
]
DISPUTED = {"birth", "luke3", "cross"}
# Paul's drawing: the fixed points (from each one's "when") and the usual reckoning built on them (from the reconstruction
# paragraph), each with the words that state its years. "before" draws a point as "before this year".
PAUL_FIXED = [
    {"id": "aretas", "from": 40, "to": 40, "before": True, "words": "Before about AD 40"},
    {"id": "agrippa-fixed", "from": 44, "to": 44, "words": "AD 44"},
    {"id": "gallio", "from": 51, "to": 52, "words": "AD 51 or 52"},
    {"id": "felix", "from": 52, "to": 60, "words": "About AD 52 to 59 or 60"},
    {"id": "festus", "from": 59, "to": 60, "words": "About AD 59 or 60"},
]
PAUL_RECKONED = [
    {"label": "Conversion", "from": 33, "to": 35, "words": "conversion about 33 to 35"},
    {"label": "Council of Acts 15", "from": 48, "to": 49, "words": "Acts 15 about 48 or 49"},
    {"label": "Corinth", "from": 50, "to": 52, "words": "Corinth about 50 to 52"},
    {"label": "Ephesus", "from": 52, "to": 55, "words": "Ephesus about 52 to 55"},
    {"label": "Arrest in Jerusalem", "from": 57, "to": 57, "words": "Jerusalem about 57"},
    {"label": "Rome", "from": 60, "to": 62, "words": "Rome about 60 to 62"},
]


def fail(message: str) -> NoReturn:
    sys.exit(f"build-nt-history-study: {message}")


def plain(text: str) -> str:
    return CHECK_MARK.sub("", text)


def normal(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'").replace("“", "").replace("”", "").replace('"', "")
    return re.sub(r"\s+", " ", text).strip()


def strings(node: object, path: str = "") -> Iterator[tuple[str, str]]:
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for key, value in node.items():
            if key != "checkNotes":
                yield from strings(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from strings(value, f"{path}[{index}]")


def at_path(record: dict, path: str) -> str:
    node: object = record
    for name, index in re.findall(r"\.([A-Za-z]+)|\[(\d+)\]", path):
        try:
            node = node[name] if name else node[int(index)]  # type: ignore[index]
        except (KeyError, IndexError, TypeError):
            fail(f"the record has nothing at {path}")
    if not isinstance(node, str):
        fail(f"expected text at {path}, found {type(node).__name__}")
    return node


class Berean:
    """The site's Berean, read book by book from data/text/bsb on first use."""

    def __init__(self, root: Path, books: dict[str, str]):
        self.root, self.books, self.cache = root, books, {}

    def chapter(self, code: str, chapter: int) -> dict[int, str]:
        if code not in self.cache:
            if not BOOK_CODE.match(code) or not (self.root / code).is_dir():
                fail(f"the Berean has no book {code!r}")
            book: dict[int, dict[int, str]] = {}
            for path in sorted((self.root / code).glob("*.json")):
                for found in json.loads(path.read_text(encoding="utf-8")).values():
                    book[int(found["c"])] = {int(item["n"]): verse_text(item["r"]) for item in found["v"] if item["n"].isdigit()}
            self.cache[code] = book
        return self.cache[code].get(chapter, {})

    def verse(self, code: str, chapter: int, verse: int, where: str) -> str:
        text = self.chapter(code, chapter).get(verse)
        if not text:
            fail(f"{where}: the Berean has no {code} {chapter}:{verse}")
        return text


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in runs)).strip()


def reference_pattern(names: list[str]) -> re.Pattern:
    books = "|".join(re.escape(name) for name in sorted(names, key=len, reverse=True))
    part = r"\d+:\d+(?:[–-]\d+)?(?:, \d+(?:[–-]\d+)?(?![\d:]))*"
    return re.compile(rf"(?<![A-Za-z0-9])({books}) ({part}(?:; {part})*)(?![\d:])")


def expand(code: str, refs: str, where: str) -> list[tuple[str, int, int]]:
    verses: list[tuple[str, int, int]] = []
    for group in refs.split("; "):
        chapter_text, rest = group.split(":", 1)
        chapter = int(chapter_text)
        for piece in rest.split(", "):
            first, _, last = piece.partition("–") if "–" in piece else piece.partition("-")
            start, end = int(first), int(last or first)
            if end < start or end - start > 40:
                fail(f"{where}: the range {group} runs backwards or is implausibly long")
            verses.extend((code, chapter, n) for n in range(start, end + 1))
    return verses


def collect_references(record: dict, pattern: re.Pattern, codes: dict[str, str], bible: Berean) -> tuple[dict, dict]:
    verses: dict[str, dict] = {}
    refs: dict[str, list[str]] = {}

    def add(key: str, found: list[tuple[str, int, int]], where: str) -> None:
        keys = []
        for code, chapter, number in found:
            name = f"{code} {chapter}:{number}"
            verses[name] = {"code": code, "chapter": chapter, "verse": number, "text": bible.verse(code, chapter, number, where)}
            keys.append(name)
        if refs.setdefault(key, keys) != keys:
            fail(f"{where}: the reference {key!r} resolves two ways")

    for entry in record["verses"]:
        code, chapter, number, label = entry["code"], entry["chapter"], entry["verse"], entry["label"]
        name = next((n for n, c in codes.items() if c == code), None)
        if name is None or label != f"{name} {chapter}:{number}":
            fail(f"verse {label!r}: expected the label to read '<book> {chapter}:{number}' for {code}")
        add(label, [(code, chapter, number)], f"verse {label}")
        if entry.get("phrase") and normal(plain(entry["phrase"])) not in normal(verses[f"{code} {chapter}:{number}"]["text"]):
            fail(f"{label}: expected the phrase {entry['phrase']!r}, the Berean has: {verses[f'{code} {chapter}:{number}']['text']}")
    for path, text in strings(record):
        for match in pattern.finditer(plain(text)):
            add(match.group(0), expand(codes[match.group(1)], match.group(2), path), path)
    return verses, refs


def check_quotations(record: dict, pattern: re.Pattern, verses: dict, refs: dict) -> int:
    count = 0
    for path, text in strings(record):
        for quote, reference in QUOTE.findall(plain(text)):
            if not pattern.fullmatch(reference) or reference not in refs:
                fail(f"{path}: the quotation's reference {reference!r} is not a Bible reference this build can read")
            berean = " ".join(verses[key]["text"] for key in refs[reference])
            if normal(quote) not in normal(berean):
                fail(f"{path}: “{quote}” is not word for word the Berean at {reference}, which reads: {berean}")
            count += 1
    return count


def check_labels_used(record: dict) -> None:
    listed = {v["label"] for v in record["verses"]}
    used = set(record["stance"]["verses"]) | set(record["paul"]["verses"])
    used |= {label for row in record["herods"]["rows"] for label in row["nt"]}
    used |= {label for era in record["eras"] for step in era["steps"] for label in step.get("verses", [])}
    used |= {label for anchor in ANCHORS for label in anchor["verses"]}
    if used - listed:
        fail(f"verse labels the page uses are not in the record's verse list: {sorted(used - listed)}")


def row_spans(row: dict) -> list[list[int]]:
    if "ranges" in row:
        return [list(r) for r in row["ranges"]]
    if "points" in row:
        return [[p, p] for p in row["points"]]
    return [[row["start"], row["end"]]]


def row_kind(row: dict) -> str:
    note = row.get("note", "").lower()
    if any(key in row for key in ("endAlt", "ranges", "points", "open")) or "about" in note or "reckon" in note:
        return "reckoned"
    return "fixed"


def check_timeline(record: dict) -> dict[str, dict]:
    timeline = record["timeline"]
    if timeline["lanes"] != LANES:
        fail(f"expected the lanes {LANES}, the record has {timeline['lanes']}")
    rows: dict[str, dict] = {}
    for row in timeline["rows"]:
        if row["id"] in rows or row["lane"] not in LANES:
            fail(f"timeline row {row['id']}: its id repeats or its lane {row['lane']!r} is not one of the four")
        spans = row_spans(row)
        if any(a > b for a, b in spans) or [s[0] for s in spans] != sorted(s[0] for s in spans):
            fail(f"timeline row {row['id']}: a range runs backwards or out of order: {spans}")
        if "endAlt" in row and not row["end"] < row["endAlt"]:
            fail(f"timeline row {row['id']}: its other end {row['endAlt']} should come after {row['end']}")
        low, high = spans[0][0], max(row.get("endAlt", spans[-1][1]), spans[-1][1])
        says_past = any(word in row.get("note", "").lower() for word in ("past the chart", "off the chart"))
        if low < timeline["from"] or (high > timeline["to"] and not says_past):
            fail(f"timeline row {row['id']}: {low} to {high} leaves the chart ({timeline['from']} to {timeline['to']}) without saying so")
        rows[row["id"]] = row
    return rows


def numbers_in(words: str) -> set[int]:
    found = {int(n) for n in re.findall(r"\d+", words)}
    return {-n for n in found} if "BC" in words else found


def in_office(row: dict, year: int, alt: bool) -> bool:
    spans = row_spans(row)
    if alt and "endAlt" in row:
        spans = [[row["start"], row["endAlt"]]]
    return any(a <= year <= b for a, b in spans)


def check_anchors(record: dict, rows: dict[str, dict]) -> list[dict]:
    out = []
    for anchor in ANCHORS:
        at_path(record, anchor["textPath"])
        if anchor["id"] in DISPUTED and len(anchor["years"]) != 2:
            fail(f"anchor {anchor['id']}: a disputed date must be drawn twice, it has {len(anchor['years'])} ranges")
        for span in anchor["years"]:
            text = plain(at_path(record, span["path"]))
            if span["words"] not in text:
                fail(f"anchor {anchor['id']}: expected {span['words']!r} at {span['path']}, the record says: {text}")
            if "derived" in span:
                base = anchor["years"][0]
                if [span["from"], span["to"]] != [base["from"] + span["derived"], base["to"] + span["derived"]]:
                    fail(f"anchor {anchor['id']}: {span['words']!r} should be {base['from']}–{base['to']} moved by {span['derived']}")
            elif numbers_in(span["words"]) != {span["from"], span["to"]}:
                fail(f"anchor {anchor['id']}: the record's words {span['words']!r} do not state {span['from']} to {span['to']}")
            for row_id in anchor["named"]:
                if row_id not in rows:
                    fail(f"anchor {anchor['id']}: ruler {row_id!r} is not on the timeline")
                for year in range(span["from"], span["to"] + 1):
                    if not in_office(rows[row_id], year, span.get("alt", False)):
                        fail(f"anchor {anchor['id']}: {rows[row_id]['name']} was not in office in {year} by the record's own bar")
        out.append({key: value for key, value in anchor.items()})
    return out


def check_paul(record: dict) -> dict:
    fixed = {item["id"]: item for item in record["paul"]["fixed"]}
    if [item["id"] for item in PAUL_FIXED] != list(fixed):
        fail(f"expected Paul's fixed points {[item['id'] for item in PAUL_FIXED]}, the record has {list(fixed)}")
    reconstruction = plain(record["paul"]["reconstruction"])
    for item in PAUL_FIXED + PAUL_RECKONED:
        said = plain(fixed[item["id"]]["when"]) if "id" in item else reconstruction
        if item["words"] not in said:
            fail(f"Paul: expected {item['words']!r}, the record says: {said}")
        numbers = {n for n in numbers_in(item["words"]) if n != 15}
        if not item["from"] <= item["to"] or not {item["from"], item["to"]} <= numbers:
            fail(f"Paul: {item['words']!r} does not state {item['from']} to {item['to']}")
    return {"fixed": PAUL_FIXED, "reckoned": PAUL_RECKONED}


def check_links(site: Path, text: str) -> dict[str, str]:
    routes = set(re.findall(r'path="([^"]+)"', (site / "src/App.tsx").read_text(encoding="utf-8")))
    for name, link in LINKS.items():
        if not re.fullmatch(r"/[a-z0-9/-]+", link) or link not in routes:
            fail(f"link {name}: {link!r} leaves the site or is not an address src/App.tsx routes")
    if "://" in text:
        fail("the record or its data holds an outside link; this page links only inside the site")
    return dict(LINKS)


def axis_year(year: int) -> int:
    """Years on a line with no year zero: 1 BC is followed by AD 1."""
    return year + 1 if year < 0 else year


def build_data(site: Path) -> str:
    raw = (site / RECORD).read_bytes().replace(b"\r\n", b"\n")
    record = json.loads(raw)
    catalog = json.loads((site / "data/catalog.json").read_text(encoding="utf-8"))
    codes = {book["name"]: book["code"] for book in catalog["books"]}
    bible = Berean(site / "data/text/bsb", codes)
    pattern = reference_pattern(list(codes))
    check_labels_used(record)
    verses, refs = collect_references(record, pattern, codes, bible)
    quotations = check_quotations(record, pattern, verses, refs)
    rows = check_timeline(record)
    anchors = check_anchors(record, rows)
    writers = sorted({w["writer"] for w in record["witnesses"]["records"]})
    if len(record["herods"]["rows"]) != 6 or len(writers) != 4:
        fail(f"expected 6 rulers of Herod's family and 4 outside writers, found {len(record['herods']['rows'])} and {len(writers)}")
    if len(record["chronology"]["death"]["views"]) != 2:
        fail("expected the two dates for the cross, both shown")
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "counts": {"years": axis_year(73) - axis_year(-63), "herods": len(record["herods"]["rows"]), "writers": len(writers),
                   "crossDates": len(record["chronology"]["death"]["views"]), "quotations": quotations},
        "kinds": {row_id: row_kind(row) for row_id, row in rows.items()},
        "anchors": anchors,
        "paul": check_paul(record),
        "verses": verses,
        "refs": refs,
        "links": {},
    }
    data["links"] = check_links(site, raw.decode("utf-8") + json.dumps(data, ensure_ascii=False))
    text = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    if len(text.encode("utf-8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf-8'))} bytes, over the {BUDGET_BYTES} budget")
    return text


def write_atomic(out: Path, text: str) -> None:
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--check", action="store_true", help="fail if the data on disk is stale or missing; write nothing")
    args = parser.parse_args()
    site = args.site.resolve()
    out = (site / OUTPUT).resolve()
    if not out.is_relative_to((site / FOLDER).resolve()):
        fail(f"output {out} is outside this study's folder {site / FOLDER}")
    text = build_data(site)
    if args.check:
        current = out.read_text(encoding="utf-8") if out.is_file() else None
        if current != text:
            fail(f"{out} is {'missing' if current is None else 'stale'}: run python scripts/build-nt-history-study.py")
        print(f"up to date: {out}")
        return
    write_atomic(out, text)
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses under {len(data['refs'])} references, "
          f"{data['counts']['quotations']} quotations checked, {len(data['anchors'])} anchors")


if __name__ == "__main__":
    main()
