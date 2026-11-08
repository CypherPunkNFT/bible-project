#!/usr/bin/env python3
"""Build src/pages/study/temple/temple-data.json for /study/the-temple-and-israels-worship.

Reads the research record (content/academic-research/44-the-temple-and-israels-worship.json) and refuses to write if:
- a listed verse does not exist in the site's Berean (data/text/bsb) or its label does not name its book, chapter and verse;
- a Bible reference written in the record's prose ("Exodus 26:16–18", "Mark 13:1–2; Luke 21:5–6", or a bare "(26:22–23)" read
  against the last book named in the same text) does not exist; books the Berean does not hold (1 Maccabees) stay plain words;
- a quotation marked "(Reference · BSB)" is not word for word the Berean at that reference;
- a measurement the plans draw is not stated in the record's own words, or, where Scripture gives it, is not in the Berean's
  words at its verse ("sixty cubits long, twenty cubits wide" at 1 Kings 6:2);
- the twenty-four priestly divisions are not the Berean's names at 1 Chronicles 24:7-18, in order, or Abijah is not eighth;
- a feast's place on the year strip is not stated in its record (a month and day), or a find's place on the platform is not
  named in its record, or a plan type for a parallel site is not in that site's record;
- the two accounts of Titus's council are not two marked sentences, Josephus's and then Severus's;
- a link the page makes leaves the site or names an address the site does not route.
Check marks ({{check:cN}}...{{/check}}) are removed before any text is compared. This proves references, quotations, the numbers
drawn and the shape of the record; it does not prove a reconstruction right.

Usage: python scripts/build-temple-study.py [--site <Website folder>] [--check | --selftest]
  --check     builds in memory and fails if the file on disk differs (stale or missing); writes nothing.
  --selftest  feeds wrong inputs in memory and confirms each is refused; writes nothing.
"""
import argparse
import copy
import hashlib
import json
import os
import re
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path

RECORD = Path("content/academic-research/44-the-temple-and-israels-worship.json")
FOLDER = Path("src/pages/study/temple")
OUTPUT = FOLDER / "temple-data.json"
BUDGET_BYTES = 90_000
CHECK_MARK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
QUOTE = re.compile(r"“([^”]+)” \(([^()]+?) · BSB\)")
BOOK_ALIASES = {"Psalm": "Psalms"}

# The plans, in cubits, east to the right, the inner room's centre at 0,0. Each shape names where its numbers are stated: the
# record's words at a path, and for Scripture the Berean's words at the verse. "inferred" is the record's reckoning, drawn dashed.
SHAPES = [
    {"id": "tab-court", "house": "tabernacle", "part": "Court", "x": -25, "y": -25, "w": 100, "h": 50, "kind": "scripture",
     "path": ".houses[0].evidence", "words": "the court as 100 cubits by 50", "verse": "Exodus 27:18", "phrase": "a hundred cubits long and fifty cubits wide"},
    {"id": "tab-tent", "house": "tabernacle", "part": "Tent", "x": -5, "y": -5, "w": 30, "h": 10, "kind": "inferred",
     "path": ".houses[0].inference", "words": "a tent about 30 cubits long and 10 wide"},
    {"id": "tab-inner", "house": "tabernacle", "part": "Most holy place", "x": -5, "y": -5, "w": 10, "h": 10, "kind": "inferred",
     "path": ".houses[0].inference", "words": "a cube of 10 cubits"},
    {"id": "sol-house", "house": "solomon", "part": "House", "x": -10, "y": -10, "w": 60, "h": 20, "kind": "scripture",
     "path": ".houses[1].evidence", "words": "60 cubits long, 20 wide", "verse": "1 Kings 6:2", "phrase": "sixty cubits long, twenty cubits wide"},
    {"id": "sol-inner", "house": "solomon", "part": "Inner room", "x": -10, "y": -10, "w": 20, "h": 20, "kind": "scripture",
     "path": ".houses[1].evidence", "words": "an inner room 20 cubits every way", "verse": "1 Kings 6:20", "phrase": "twenty cubits long, twenty cubits wide"},
    {"id": "sol-porch", "house": "solomon", "part": "Porch", "x": 50, "y": -10, "w": 10, "h": 20, "kind": "berean",
     "path": ".houses[1].evidence", "words": "a porch in front (6:3)", "verse": "1 Kings 6:3", "phrase": "projecting out ten cubits"},
    {"id": "her-house", "house": "herod", "part": "House, kept to the old size", "x": -10, "y": -10, "w": 60, "h": 20, "kind": "inferred",
     "path": ".houses[3].inference", "words": "Herod kept the sanctuary to the old house's size and line"},
    {"id": "her-square", "house": "herod", "part": "The Mishnah's square", "x": 0, "y": 0, "w": 500, "h": 500, "kind": "mishnah",
     "path": ".houses[3].evidence", "words": "a platform 500 cubits square (Middot 2:1)"},
]
# The second temple has no plan: only the decree's width and height, which are not a builder's survey.
SECOND = {"path": ".houses[2].evidence", "words": "a height and width of 60 cubits", "verse": "Ezra 6:3", "phrase": "sixty cubits high and sixty cubits wide"}
HALL = {"verse": "1 Kings 6:17", "phrase": "forty cubits long"}
FRAMES = [("Exodus 26:16", "a cubit and a half wide"), ("Exodus 26:18", "twenty frames")]
DIVISIONS = ["Jehoiarib", "Jedaiah", "Harim", "Seorim", "Malchijah", "Mijamin", "Hakkoz", "Abijah", "Jeshua", "Shecaniah", "Eliashib", "Jakim",
             "Huppah", "Jeshebeab", "Bilgah", "Immer", "Hezir", "Happizzez", "Pethahiah", "Jehezkel", "Jachin", "Gamul", "Delaiah", "Maaziah"]
# The year strip: months by number. A feast is placed only where its record states the month and day ("words" in its `when`).
# Omer and Shavuot are placed relative to Unleavened Bread, as their records do, and drawn as argued ranges.
FEASTS = [
    {"id": "pesach", "month": 1, "day": 14, "days": 8, "words": "The 14th of the first month, Nisan"},
    {"id": "omer", "month": 1, "day": 16, "days": 7, "argued": True, "words": "The day after the Sabbath of Unleavened Bread"},
    {"id": "shavuot", "month": 3, "day": 5, "days": 7, "argued": True, "words": "Fifty days from the sheaf"},
    {"id": "teruah", "month": 7, "day": 1, "days": 1, "words": "The 1st of the seventh month"},
    {"id": "kippur", "month": 7, "day": 10, "days": 1, "words": "The 10th of the seventh month"},
    {"id": "sukkot", "month": 7, "day": 15, "days": 8, "words": "From the 15th of the seventh month, seven days and an eighth"},
    {"id": "hanukkah", "month": 9, "day": 25, "days": 8, "words": "The 25th of Kislev, eight days", "monthVerse": ("Zechariah 7:1", "ninth month, the month of Chislev")},
]
NOT_COMMANDED = ("hanukkah", "Not commanded in the Old Testament")
# Where each step of the Day of Atonement happens, only where its own text says so.
ZONES = {"cloud": ("inner", "inner room"), "blood": ("inner", "inner room"), "sent": ("wilderness", "wilderness"), "people": ("people", "Israel")}
# Finds placed on the platform's outline, by the side their record names. The others have no place on the platform.
FIND_SIDES = {"western-wall": ("west", "western side"), "robinson": ("southwest", "south-western corner"),
              "trumpeting": ("southwest", "south-western corner"), "eastern-seam": ("east", "eastern wall")}
PLAN_TYPES = {"ain-dara": ("long", "three rooms in a line"), "tayinat": ("long", "long temple of three rooms"),
              "arad": ("broad", "a broad room"), "moza": ("long", "of the long type")}
# The page's own links: record names of neighbouring studies that have a page today. The rest are shown as plain names.
LINKS = {
    "The farming year": "/study/the-farming-year",
    "The world of the New Testament": "/study/world-of-jesus-apostles",
    "New Testament history: from Herod to the fall of Jerusalem": "/study/new-testament-history",
    "How the Old Testament books were written": "/study/how-the-old-testament-books-were-written",
}
SITE_PATH = re.compile(r"/study/[a-z0-9-]+")
WITNESS_WORDS = {"josephus": re.compile(r"\bJosephus\b"), "rabbinic": re.compile(r"\b(Mishnah|Tosefta|Talmud|rabbinic)\b"),
                 "other": re.compile(r"\b(Maccabees|Sulpicius Severus)\b")}
GROUND_WORDS = re.compile(r"\b(found|excavat\w*|inscri\w*|uncovered|sifted|arch|coins?|stones?|walls?)\b", re.I)


class BuildError(Exception):
    pass


def fail(message: str):
    raise BuildError(message)


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
            if key not in ("checkNotes", "sources"):
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


def says(record: dict, path: str, words: str, what: str) -> None:
    text = plain(at_path(record, path))
    if words not in text:
        fail(f"{what}: expected the record to say {words!r} at {path}; it says: {text}")


class Berean:
    """The site's Berean, read book by book from data/text/bsb on first use."""

    def __init__(self, root: Path):
        self.root, self.cache = root, {}

    def holds(self, code: str) -> bool:
        return bool(re.fullmatch(r"[A-Z0-9]{3}", code)) and (self.root / code).is_dir()

    def verse(self, code: str, chapter: int, verse: int, where: str) -> str:
        if code not in self.cache:
            if not self.holds(code):
                fail(f"{where}: the Berean has no book {code!r}")
            book: dict[int, dict[int, str]] = {}
            for path in sorted((self.root / code).glob("*.json")):
                for found in json.loads(path.read_text(encoding="utf-8")).values():
                    book[int(found["c"])] = {int(item["n"]): verse_text(item["r"]) for item in found["v"] if item["n"].isdigit()}
            self.cache[code] = book
        text = self.cache[code].get(chapter, {}).get(verse)
        if not text:
            fail(f"{where}: the Berean has no {code} {chapter}:{verse}")
        return text


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in runs)).strip()


PART = r"\d+:\d+(?:[–-]\d+)?(?:, \d+(?:[–-]\d+)?(?![\d:]))*"
BARE = re.compile(rf"(?<=\()({PART}(?:; {PART})*)(?=[);])")


def reference_pattern(names: list[str]) -> re.Pattern:
    books = "|".join(re.escape(name) for name in sorted(names, key=len, reverse=True))
    return re.compile(rf"(?<![A-Za-z0-9])({books}) ({PART}(?:; {PART})*)(?![\d:–-])")


def expand(code: str, refs: str, where: str) -> list[tuple[str, int, int]]:
    verses: list[tuple[str, int, int]] = []
    for group in refs.split("; "):
        chapter_text, rest = group.split(":", 1)
        for piece in rest.split(", "):
            first, _, last = piece.partition("–") if "–" in piece else piece.partition("-")
            start, end = int(first), int(last or first)
            if end < start or end - start > 40:
                fail(f"{where}: the range {group} runs backwards or is implausibly long")
            verses.extend((code, int(chapter_text), n) for n in range(start, end + 1))
    return verses


def references_in(text: str, pattern: re.Pattern, codes: dict[str, str]) -> Iterator[tuple[str, str, str]]:
    """(key, book, refs) for every reference in the text, a bare "(26:22–23)" read against the last book named before it."""
    found = [(m.start(), m.group(1), m.group(2), m.group(0)) for m in pattern.finditer(text)]
    found += [(m.start(), None, m.group(1), None) for m in BARE.finditer(text)]
    last = None
    for _, book, refs, whole in sorted(found, key=lambda f: f[0]):
        if book:
            last = book
            yield whole, book, refs
        elif last:
            yield f"{last} {refs}", last, refs


def collect(record: dict, pattern: re.Pattern, codes: dict[str, str], bible: Berean) -> tuple[dict, dict]:
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
        book = label.rsplit(" ", 1)[0]
        if codes.get(book) != code or label != f"{book} {chapter}:{number}":
            fail(f"verse {label!r}: expected the label to read '<book> {chapter}:{number}' for {code}")
        add(label, [(code, chapter, number)], f"verse {label}")
    for path, text in strings(record):
        for key, book, part in references_in(plain(text), pattern, codes):
            add(key, expand(codes[book], part, path), path)
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


def berean_says(label: str, phrase: str, pattern: re.Pattern, codes: dict, bible: Berean, verses: dict, refs: dict, what: str) -> None:
    match = pattern.fullmatch(label)
    if not match:
        fail(f"{what}: {label!r} is not a single Bible reference")
    found = expand(codes[match.group(1)], match.group(2), what)
    text = " ".join(bible.verse(c, ch, v, what) for c, ch, v in found)
    if normal(phrase) not in normal(text):
        fail(f"{what}: expected the Berean at {label} to say {phrase!r}; it reads: {text}")
    for code, chapter, number in found:
        verses[f"{code} {chapter}:{number}"] = {"code": code, "chapter": chapter, "verse": number, "text": bible.verse(code, chapter, number, what)}
    refs.setdefault(label, [f"{c} {ch}:{v}" for c, ch, v in found])


def check_shapes(record: dict, shapes: list, berean_check) -> list:
    houses = {h["id"] for h in record["houses"]}
    for shape in shapes:
        if shape["house"] not in houses or shape["kind"] not in ("scripture", "berean", "inferred", "mishnah"):
            fail(f"plan {shape['id']}: house {shape['house']!r} or kind {shape['kind']!r} is not one the page knows")
        says(record, shape["path"], shape["words"], f"plan {shape['id']}")
        if shape["kind"] in ("scripture", "berean"):
            berean_check(shape["verse"], shape["phrase"], f"plan {shape['id']}")
        numbers = {int(n) for n in re.findall(r"\d+", re.sub(r"\([^)]*\)", "", shape["words"]))}
        if shape["kind"] != "berean" and numbers and not numbers <= {shape["w"], shape["h"]}:
            fail(f"plan {shape['id']}: draws {shape['w']} by {shape['h']}, the record's words {shape['words']!r} state {sorted(numbers)}")
    by_id = {s["id"]: s for s in shapes}
    if by_id["tab-tent"]["w"] != 20 * 1.5:
        fail("plan tab-tent: twenty frames a cubit and a half wide make 30 cubits, the plan does not")
    porch, house = by_id["sol-porch"], by_id["sol-house"]
    if porch["x"] != house["x"] + house["w"] or porch["h"] != house["h"]:
        fail("plan sol-porch: the porch must stand in front of the house, across its width")
    return shapes


def check_divisions(names: list[str], bible: Berean) -> list[dict]:
    if len(names) != 24 or names[7] != "Abijah":
        fail(f"expected twenty-four divisions with Abijah eighth, found {len(names)} with {names[7:8]} eighth")
    out = []
    for index, name in enumerate(names):
        verse = 7 + index // 2
        text = bible.verse("1CH", 24, verse, "divisions")
        pair = re.findall(r"(?:lot fell to|to) ([A-Z][a-z]+)", text)
        if len(pair) != 2 or pair[index % 2] != name:
            fail(f"division {index + 1}: expected {name} at 1 Chronicles 24:{verse}, the Berean reads: {text}")
        out.append({"n": index + 1, "name": name, "verse": f"1 Chronicles 24:{verse}"})
    return out


def check_psalms(record: dict) -> list[int]:
    text = record["priesthood"]["records"][2]["evidence"]
    marked = re.search(r"\(Tamid 7:4\): ([\d, and]+?)\{\{/check\}\}", text)
    if not marked:
        fail("psalms of the day: expected the Mishnah's list after '(Tamid 7:4):' inside its check mark")
    numbers = [int(n) for n in re.findall(r"\d+", marked.group(1))]
    if len(numbers) != 7 or numbers[-1] != 92:
        fail(f"psalms of the day: expected seven psalms ending with the Sabbath's 92, found {numbers}")
    return numbers


def check_feasts(record: dict, feasts: list, berean_check) -> list:
    listed = {f["id"]: f for f in record["feasts"]["list"]}
    if [f["id"] for f in feasts] != list(listed):
        fail(f"expected the feasts {[f['id'] for f in feasts]}, the record has {list(listed)}")
    for feast in feasts:
        when = plain(listed[feast["id"]]["when"])
        if feast["words"] not in when:
            fail(f"feast {feast['id']}: expected its record to say {feast['words']!r}; it says: {when}")
        if not 1 <= feast["month"] <= 12 or not 1 <= feast["day"] <= 30:
            fail(f"feast {feast['id']}: month {feast['month']} day {feast['day']} is not on the strip")
        ordinal = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"]
        if not feast.get("argued") and "monthVerse" not in feast and ordinal[feast["month"] - 1] not in when:
            fail(f"feast {feast['id']}: its record does not name month {feast['month']}")
        if "monthVerse" in feast:
            berean_check(*feast["monthVerse"], f"feast {feast['id']}")
    if NOT_COMMANDED[1] not in plain(listed[NOT_COMMANDED[0]]["scripture"]):
        fail(f"feast {NOT_COMMANDED[0]}: expected its record to say {NOT_COMMANDED[1]!r}")
    return [{k: v for k, v in f.items() if k not in ("monthVerse",)} for f in feasts]


def check_atonement(record: dict) -> dict:
    steps = {s["id"]: s for s in record["atonement"]["steps"]}
    if len(steps) != 7:
        fail(f"expected the seven steps of Leviticus 16, found {len(steps)}")
    zones = {}
    for step_id, (zone, word) in ZONES.items():
        if step_id not in steps or word not in plain(steps[step_id]["text"]):
            fail(f"atonement step {step_id}: expected its text to name {word!r}")
        zones[step_id] = zone
    return {step_id: zones.get(step_id, "unstated") for step_id in steps}


def check_accounts(record: dict) -> list[dict]:
    text = record["fall"]["records"][1]["evidence"]
    parts = re.fullmatch(r"(\{\{check:c\d+\}\}[^{]+\{\{/check\}\}\.) (\{\{check:c\d+\}\}[^{]+\{\{/check\}\}\.)", text)
    if not parts or not plain(parts.group(1)).startswith("Josephus") or not plain(parts.group(2)).startswith("Sulpicius Severus"):
        fail(f"Titus's council: expected two marked sentences, Josephus's then Severus's; found: {text}")
    return [{"who": "Josephus", "text": parts.group(1)}, {"who": "Sulpicius Severus", "text": parts.group(2)}]


def check_places(record: dict) -> tuple[dict, dict]:
    finds = {f["id"]: f for f in record["ground"]["finds"]}
    sides = {}
    for find_id, (side, words) in FIND_SIDES.items():
        if find_id not in finds or words not in plain(finds[find_id]["name"] + " " + finds[find_id]["evidence"]):
            fail(f"find {find_id}: expected its record to name the {words!r}")
        sides[find_id] = side
    sites = {s["id"]: s for s in record["parallels"]["sites"]}
    types = {}
    for site_id, (kind, words) in PLAN_TYPES.items():
        if site_id not in sites or words not in plain(sites[site_id]["evidence"]):
            fail(f"site {site_id}: expected its record to describe {words!r}")
        types[site_id] = kind
    if set(sites) != set(PLAN_TYPES):
        fail(f"expected the parallel sites {sorted(PLAN_TYPES)}, the record has {sorted(sites)}")
    return {f: sides.get(f) for f in finds}, types


def witness_tags(record: dict, pattern: re.Pattern) -> dict[str, list[str]]:
    groups = {"house": record["houses"], "site": record["parallels"]["sites"], "find": record["ground"]["finds"],
              "priest": record["priesthood"]["records"], "day": record["offerings"]["day"], "fall": record["fall"]["records"],
              "feast": record["feasts"]["list"]}
    tags = {}
    for group, items in groups.items():
        for item in items:
            text = plain(" ".join(v for k, v in item.items() if isinstance(v, str) and k not in ("id", "ntNote", "today")))
            kinds = ["scripture"] if pattern.search(text) else []
            kinds += [k for k, rx in WITNESS_WORDS.items() if rx.search(text)]
            if group in ("site", "find") or (group in ("priest", "fall") and item["id"] in ("inscriptions", "rome", "city")):
                if not GROUND_WORDS.search(text):
                    fail(f"{group} {item['id']}: tagged as a find in the ground, but its text names no find")
                kinds.append("ground")
            if not kinds:
                fail(f"{group} {item['id']}: no witness named (Scripture, Josephus, the Mishnah or the ground)")
            tags[f"{group}:{item['id']}"] = kinds
    return tags


def site_routes(site: Path) -> set[str]:
    routes = set(re.findall(r'path="(/[^"]*)"', (site / "src/App.tsx").read_text(encoding="utf-8")))
    for route in (site / "src/pages/study").glob("*/route.ts"):
        routes |= set(re.findall(r'export const path = "(/study/[a-z0-9-]+)"', route.read_text(encoding="utf-8")))
    return routes


def check_links(record: dict, site: Path, links: dict, text: str) -> dict:
    routes = site_routes(site)
    named = set(record["links"]["academic"]) | {record["critical"]["link"]}
    for name, path in links.items():
        if not SITE_PATH.fullmatch(path) or path not in routes:
            fail(f"link {name!r}: {path!r} leaves the site or is not an address the site routes")
        if name not in named and name.split(":")[0] not in named:
            fail(f"link {name!r}: the record does not name this study")
    if re.search(r"://|\bwww\.|mailto:|(?<![\w/])//", text):
        fail("the page's data holds an outside link; this page links only inside the site")
    return dict(links)


def timeline(record: dict) -> None:
    line = record["timeline"]
    for row in line["rows"]:
        if row["start"] is None:
            if "Not placed" not in row["note"]:
                fail(f"timeline row {row['id']}: it has no start, so its note must say 'Not placed'")
        elif not line["from"] <= row["start"] <= row["end"] <= line["to"]:
            fail(f"timeline row {row['id']}: {row['start']} to {row['end']} runs backwards or leaves {line['from']} to {line['to']}")


def assemble(site: Path, raw: bytes, shapes=SHAPES, divisions=DIVISIONS, feasts=FEASTS, links=LINKS) -> str:
    raw = raw.replace(b"\r\n", b"\n")
    record = json.loads(raw)
    catalog = json.loads((site / "data/catalog.json").read_text(encoding="utf-8"))
    bible = Berean(site / "data/text/bsb")
    codes = {book["name"]: book["code"] for book in catalog["books"] if bible.holds(book["code"])}
    codes.update({alias: codes[name] for alias, name in BOOK_ALIASES.items()})
    pattern = reference_pattern(list(codes))
    verses, refs = collect(record, pattern, codes, bible)

    def berean_check(label: str, phrase: str, what: str) -> None:
        berean_says(label, phrase, pattern, codes, bible, verses, refs, what)

    quotations = check_quotations(record, pattern, verses, refs)
    plans = check_shapes(record, shapes, berean_check)
    says(record, SECOND["path"], SECOND["words"], "the second temple")
    berean_check(SECOND["verse"], SECOND["phrase"], "the second temple")
    berean_check(HALL["verse"], HALL["phrase"], "Solomon's hall")
    for label, phrase in FRAMES:
        berean_check(label, phrase, "the tabernacle's frames")
    timeline(record)
    finds, types = check_places(record)
    notes = record["checkNotes"]
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "counts": {"houses": len(record["houses"]), "feasts": len(record["feasts"]["list"]), "divisions": len(divisions),
                   "checks": len(notes), "open": sum(1 for n in notes if n["status"] == "open"), "quotations": quotations},
        "plans": plans,
        "decree": {"w": 60, "h": 60, "verse": SECOND["verse"]},
        "hall": {"l": 40, "verse": HALL["verse"]},
        "divisions": check_divisions(divisions, bible),
        "psalms": check_psalms(record),
        "feasts": check_feasts(record, feasts, berean_check),
        "zones": check_atonement(record),
        "accounts": check_accounts(record),
        "finds": finds,
        "types": types,
        "tags": witness_tags(record, pattern),
        "verses": verses,
        "refs": refs,
        "links": {},
    }
    data["links"] = check_links(record, site, links, json.dumps(data, ensure_ascii=False) + json.dumps(links))
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


def selftest(site: Path, raw: bytes, out: Path) -> None:
    """Wrong inputs, each built in memory and each expected to be refused. Nothing is written."""
    record = json.loads(raw)
    before = out.read_bytes() if out.is_file() else None

    def changed(change) -> bytes:
        copy_of = copy.deepcopy(record)
        change(copy_of)
        return json.dumps(copy_of, ensure_ascii=False).encode("utf-8")

    def shape(shape_id: str, **values) -> list:
        return [{**s, **values} if s["id"] == shape_id else s for s in SHAPES]

    def quote(r: dict) -> None:
        r["fall"]["scripture"] += " “Not one stone will be left on another” (Mark 13:2 · BSB)."

    cases = [
        ("a quotation one word off the Berean (Mark 13:2)", lambda: assemble(site, changed(quote))),
        ("a verse that does not exist (Exodus 27:99)", lambda: assemble(site, changed(lambda r: r["houses"][0].update(evidence=r["houses"][0]["evidence"] + " (Exodus 27:99)")))),
        ("a chapter that does not exist (Leviticus 99:1)", lambda: assemble(site, changed(lambda r: r["offerings"].update(kinds=r["offerings"]["kinds"] + " Leviticus 99:1.")))),
        ("a listed verse with the wrong book code", lambda: assemble(site, changed(lambda r: r["verses"][0].update(code="LEV")))),
        ("a bare reference past the end of its chapter ((26:40) after Exodus)", lambda: assemble(site, changed(lambda r: r["houses"][0].update(evidence=r["houses"][0]["evidence"].replace("(26:22–23)", "(26:40)"))))),
        ("Solomon's house drawn 70 cubits long", lambda: assemble(site, raw, shapes=shape("sol-house", w=70))),
        ("the inner room said to be 25 cubits in the Berean", lambda: assemble(site, raw, shapes=shape("sol-inner", phrase="twenty-five cubits long"))),
        ("the court's numbers not in the record's words", lambda: assemble(site, changed(lambda r: r["houses"][0].update(evidence=r["houses"][0]["evidence"].replace("100 cubits by 50", "100 cubits by 60"))))),
        ("two priestly divisions swapped", lambda: assemble(site, raw, divisions=DIVISIONS[:6] + ["Abijah", "Hakkoz"] + DIVISIONS[8:])),
        ("a feast placed on a day its record does not state", lambda: assemble(site, raw, feasts=[{**f, "words": "The 15th of the first month"} if f["id"] == "pesach" else f for f in FEASTS])),
        ("Titus's two accounts merged into one", lambda: assemble(site, changed(lambda r: r["fall"]["records"][1].update(evidence=plain(r["fall"]["records"][1]["evidence"]))))),
        ("a link that leaves the site", lambda: assemble(site, raw, links={**LINKS, "The farming year": "https://example.com/farming"})),
        ("a protocol-relative link", lambda: assemble(site, raw, links={**LINKS, "The farming year": "//example.com/x"})),
        ("a link to a route the site does not have", lambda: assemble(site, raw, links={**LINKS, "The farming year": "/study/no-such-study"})),
        ("a link to a study the record never names", lambda: assemble(site, raw, links={**LINKS, "Egypt beside Israel": "/study/egypt-beside-israel"})),
        ("a timeline bar that runs backwards", lambda: assemble(site, changed(lambda r: r["timeline"]["rows"][1].update(start=-500, end=-966)))),
    ]
    failures = 0
    for name, run in cases:
        try:
            run()
        except BuildError as error:
            print(f"refused, as it should be: {name}\n    {error}")
        else:
            failures += 1
            print(f"NOT REFUSED: {name}")
    assemble(site, raw)
    after = out.read_bytes() if out.is_file() else None
    if after != before:
        fail("the self-test changed the data file on disk; it must write nothing")
    print(f"the real record still builds; {len(cases) - failures} of {len(cases)} wrong inputs refused; nothing written")
    if failures:
        fail(f"{failures} wrong inputs were not refused")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="fail if the data on disk is stale or missing; write nothing")
    mode.add_argument("--selftest", action="store_true", help="try wrong inputs in memory and confirm each is refused; write nothing")
    args = parser.parse_args()
    site = args.site.resolve()
    out = (site / OUTPUT).resolve()
    if not out.is_relative_to((site / FOLDER).resolve()):
        sys.exit(f"build-temple-study: output {out} is outside this study's folder {site / FOLDER}")
    try:
        raw = (site / RECORD).read_bytes()
        if args.selftest:
            selftest(site, raw, out)
            return
        text = assemble(site, raw)
        if args.check:
            current = out.read_text(encoding="utf-8") if out.is_file() else None
            if current != text:
                fail(f"{out} is {'missing' if current is None else 'stale'}: run python scripts/build-temple-study.py")
            print(f"up to date: {out}")
            return
        write_atomic(out, text)
    except BuildError as error:
        sys.exit(f"build-temple-study: {error}")
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses under {len(data['refs'])} references, "
          f"{data['counts']['quotations']} quotations checked, {len(data['plans'])} plan shapes, {len(data['divisions'])} divisions")


if __name__ == "__main__":
    main()
