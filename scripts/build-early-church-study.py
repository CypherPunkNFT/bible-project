#!/usr/bin/env python3
"""Build src/pages/study/early-church/early-church-data.json for /study/the-early-church.

Reads the research record (content/academic-research/21-the-early-church.json) and refuses to write if:
- a listed verse does not exist in the site's Berean (data/text/bsb), its label does not name its book, chapter and verse, or its
  phrase is not word for word in the Berean at that verse;
- a Bible reference written anywhere in the record's text does not exist, or a verse label a record uses is not in the verse list;
- a quotation marked "(Reference · BSB)" is not word for word the Berean there, or Scripture is quoted with no "· BSB" mark;
- a quotation the site holds the text of (Schaff's Chalcedonian Definition, Philaret's catechism, the Westminster and 1689
  confessions; table HELD) is not at its place in the record or not word for word in the held document;
- a record has no date span, a span's words are not in the record's own date, or its numbers are not the words' numbers;
  an argued alternative date's words are not in the record; a span before 250 is drawn as firm without a year the record states;
- a figure in the opening bar disagrees with what it counts, or the reception rows' words are not in the council records;
- the two accounts of 312 are not sentences of the Milvian Bridge record;
- a link the page makes leaves the site or names an address the site does not route (an empty route is kept as "no link").
The verse words are read and checked in memory; the file holds each verse's book, chapter and verse, never its words.
Check marks ({{check:cN}}…{{/check}}) are removed before any text is compared. That proves references, quotations and the record's
shape; it does not prove any reading or any date right, and it cannot check the early writers, whose texts are not held.

Usage: python scripts/build-early-church-study.py [--site <Website folder>] [--check]
  --check builds in memory and fails if the file on disk differs (stale or missing); it writes nothing.
"""
import argparse
import hashlib
import json
import math
import os
import re
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/21-the-early-church.json")
FOLDER = Path("src/pages/study/early-church")
OUTPUT = FOLDER / "early-church-data.json"
LAND = Path("node_modules/world-atlas/land-50m.json")
BUDGET_BYTES = 60_000
FIRST, LAST = 64, 451
CHECK_MARK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
SLUG = re.compile(r"^[a-z0-9-]+$")
ROUTE = re.compile(r"^/[a-z0-9-]+(?:/[a-z0-9-]+)*$")
QUOTE = re.compile(r"“(.+?)” \(([^()]+?) · BSB\)")
CITED = re.compile(r"” \(([^()]+)\)")
PARTS = ["after-apostles", "martyrs", "defenders", "teachers", "constantine", "desert", "councils", "augustine"]
COUNCILS = ["nicaea", "constantinople", "ephesus", "chalcedon"]
# The page's own links, besides the record's.
LINKS = {"academic": "/study/academic", "creeds": "/study/creeds"}

# Every record's date as the case draws it. "words" must be in the record's own "when"; its numbers are the span's ends.
# kind: year (a year the record states), day (it states a day), about (an estimate), argued, unknown (no date given), and
# "open" draws an arrow past the end ("and after", "from about"). A century in words is drawn as its thirds
# ("late first" 67–100, "early second" 100–133), and the page says so.
SPANS = {
    "nero": (64, 64, "64", "year"),
    "clement": (96, 96, "About 96", "about"),
    "didache": (67, 133, "Late first or early second century", "argued"),
    "ignatius": (110, 110, "about 110", "about"),
    "polycarp": (155, 156, "155/156", "argued"),
    "pliny": (112, 112, "About 112", "about"),
    "perpetua": (203, 203, "203", "year"),
    "decius": (250, 260, "250; then Valerian, 257 to 260", "year"),
    "diocletian": (303, 311, "303 to 311", "year"),
    "justin": (150, 165, "about 150 to 155; died about 165", "about"),
    "diognetus": (100, 300, "Second or third century; not known", "unknown"),
    "irenaeus": (180, 180, "about 180", "about"),
    "tertullian": (196, 220, "about 196 to about 220", "about"),
    "origen": (185, 254, "About 185 to about 254", "about"),
    "baptism-practice": (100, 253, "About 100 to 253", "about"),
    "canon-note": (367, 367, "To 367 and after", "open"),
    "milvian": (312, 312, "28 October 312", "day"),
    "milan": (313, 313, "313", "year"),
    "theodosius": (380, 380, "380 and after", "open"),
    "antony": (251, 356, "About 251 to 356", "about"),
    "pachomius": (320, 320, "From about 320", "open"),
    "nicaea": (325, 325, "325", "year"),
    "constantinople": (381, 381, "381", "year"),
    "ephesus": (431, 431, "431", "year"),
    "chalcedon": (451, 451, "451", "year"),
    "augustine-life": (354, 430, "354 to 430", "year"),
    "pelagius": (411, 431, "About 411 to 431", "about"),
}
CENTURY_WORDS = {"Late first or early second century": (67, 133), "Second or third century; not known": (100, 300)}
# Ranges drawn in two pieces (Decius in 250, Valerian 257 to 260).
PIECES = {"decius": [[250, 250], [257, 260]]}
# Argued alternatives, drawn fainter with who holds them. "field" is where in the record the words stand.
ALTERNATIVES = {
    "clement": [{"from": FIRST, "to": 70, "words": "before 70, among them John A. T. Robinson", "holder": "John A. T. Robinson: before 70", "field": "limit", "openStart": True}],
    "didache": [{"from": 50, "to": 150, "words": "from about 50 to well into the second century", "holder": "Proposals: about 50 to well into the second century", "field": "limit", "openStart": True}],
    "ignatius": [{"from": 140, "to": 149, "words": "has argued for the 140s", "holder": "Timothy Barnes: the 140s", "field": "limit"}],
    "polycarp": [{"from": 167, "to": 167, "words": "167 from Eusebius' Chronicle", "holder": "Eusebius' Chronicle: 167", "field": "limit"}],
}
# Quotations whose very text the site holds: (record path, words, held document id, the document's name on the page).
SCHAFF_451 = ("chalcedonian-definition-451-schaff", "Schaff's Chalcedonian Definition")
HELD = [
    (".parts[6].records[3].quote.words", "to be acknowledged in two natures, inconfusedly, unchangeably, indivisibly, inseparably", *SCHAFF_451),
    (".parts[6].records[2].quote.words", "born of the Virgin Mary, the Mother of God, according to the Manhood", *SCHAFF_451),
    (".creedPath.steps[2].evidence", "in both forms", *SCHAFF_451),
    (".creedPath.steps[2].evidence", "this wise and saving Creed would be sufficient for the full acknowledgment and confirmation of the true religion", *SCHAFF_451),
    (".creedPath.steps[3].evidence", "the third Œcumenical Council in its seventh canon forbade the composition of any new Creed", "longer-catechism-of-the-orthodox-church-1839", "Philaret's Longer Catechism"),
    (".creedPath.steps[3].evidence", "may err, and many have erred", "westminster-confession-of-faith-1647", "the Westminster Confession"),
    (".creedPath.steps[3].evidence", "to be used as a help", "westminster-confession-of-faith-1647", "the Westminster Confession"),
    (".creedPath.steps[3].evidence", "all Decrees of Councels", "1689-london-baptist-confession-1677", "the Second London Baptist Confession"),
    (".creedPath.steps[3].evidence", "no other but the Holy Scripture delivered by the Spirit", "1689-london-baptist-confession-1677", "the Second London Baptist Confession"),
]
# Which families of churches receive which of the four councils, each stated in the record's words.
RECEPTION = [
    {"id": "east", "name": "The Church of the East", "receives": ["nicaea", "constantinople"],
     "path": ".parts[6].records[2].evidence", "words": "did not receive Ephesus or the councils after it", "who": ".parts[6].records[2].today"},
    {"id": "oriental", "name": "The Oriental Orthodox churches", "receives": ["nicaea", "constantinople", "ephesus"],
     "path": ".parts[6].records[3].today", "words": "Malankara Orthodox churches did not receive it", "who": ".parts[6].records[3].today"},
    {"id": "chalcedonian", "name": "Eastern Orthodox, Roman Catholic and most Protestant churches", "receives": COUNCILS,
     "path": ".parts[6].records[3].today", "words": "the Eastern Orthodox, Roman Catholic and most Protestant churches confess its definition", "who": ""},
]
# The two accounts of 312, side by side: each a sentence of the Milvian Bridge record, from its first words to its reference.
ACCOUNTS = [
    {"id": "lactantius", "writer": "Lactantius", "start": "Lactantius, writing within a few years", "end": "(On the Deaths of the Persecutors 44)."},
    {"id": "eusebius", "writer": "Eusebius", "start": "Eusebius, writing after Constantine's death in 337", "end": "(Life of Constantine 1.28 to 29)."},
]
# The small map: where the councils met, and a city standing for each region the record says did not receive them
# (a label at a city, never a border). Modern coordinates of the sites, to a tenth of a degree.
LON0, LON1, LAT0, LAT1 = 20.0, 50.0, 28.5, 44.5
WIDTH = 560.0
COS = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = WIDTH / ((LON1 - LON0) * COS)
SIMPLIFY = 2.2
PLACES = [
    {"id": "nicaea", "label": "Nicaea", "lon": 29.7, "lat": 40.4, "kind": "council", "words": ""},
    {"id": "constantinople", "label": "Constantinople", "lon": 29.0, "lat": 41.0, "kind": "council", "words": ""},
    {"id": "ephesus", "label": "Ephesus", "lon": 27.3, "lat": 37.9, "kind": "council", "words": ""},
    {"id": "chalcedon", "label": "Chalcedon", "lon": 29.0, "lat": 41.0, "kind": "council", "words": ""},
    {"id": "persia", "label": "Persian empire", "lon": 44.6, "lat": 33.1, "kind": "east", "words": "The church in the Persian empire"},
    {"id": "egypt", "label": "Egypt", "lon": 29.9, "lat": 31.2, "kind": "oriental", "words": "The churches of Egypt"},
    {"id": "syria", "label": "Syria", "lon": 36.2, "lat": 36.2, "kind": "oriental", "words": "much of Syria"},
    {"id": "armenia", "label": "Armenia", "lon": 44.3, "lat": 40.2, "kind": "oriental", "words": "later Armenia and Ethiopia"},
]
PLACE_TEXT = ".parts[6].records"


def fail(message: str) -> NoReturn:
    sys.exit(f"build-early-church-study: {message}")


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


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in runs)).strip()


class Berean:
    """The site's Berean, read book by book from data/text/bsb on first use."""

    def __init__(self, root: Path):
        self.root, self.cache = root, {}

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
        berean = verses[f"{code} {chapter}:{number}"]["text"]
        if entry.get("phrase") and normal(plain(entry["phrase"])) not in normal(berean):
            fail(f"{label}: expected the phrase {entry['phrase']!r}, the Berean has: {berean}")
    for path, text in strings(record):
        for match in pattern.finditer(plain(text)):
            add(match.group(0), expand(codes[match.group(1)], match.group(2), path), path)
    return verses, refs


def check_quotations(record: dict, pattern: re.Pattern, verses: dict, refs: dict) -> int:
    count = 0
    for path, text in strings(record):
        words = plain(text)
        for cited in CITED.findall(words):
            if pattern.match(cited) and not cited.endswith(" · BSB"):
                fail(f"{path}: Scripture is quoted at ({cited}) without the “· BSB” mark, so it cannot be checked")
        for quote, reference in QUOTE.findall(words):
            if not pattern.fullmatch(reference) or reference not in refs:
                fail(f"{path}: the quotation's reference {reference!r} is not a Bible reference this build can read")
            berean = " ".join(verses[key]["text"] for key in refs[reference])
            if normal(quote) not in normal(berean):
                fail(f"{path}: “{quote}” is not word for word the Berean at {reference}, which reads: {berean}")
            count += 1
    return count


def check_labels_used(record: dict) -> None:
    listed = {v["label"] for v in record["verses"]}
    used = set(record["stance"]["verses"]) | {label for step in record["creedPath"]["steps"] for label in step["verses"]}
    used |= {label for part in record["parts"] for rec in part["records"] for label in rec["verses"]}
    if used - listed:
        fail(f"verse labels the page uses are not in the record's verse list: {sorted(used - listed)}")


def held_text(site: Path, doc: str) -> str:
    if not SLUG.match(doc):
        fail(f"held document {doc!r} is not a plain id")
    folder = (site / "data/creeds/doc").resolve()
    files = sorted(p for p in folder.iterdir() if re.fullmatch(rf"{re.escape(doc)}\.b\d+\.json", p.name))
    texts = [section.get("text", "") for path in files for section in json.loads(path.read_text(encoding="utf-8")).get("sections", [])]
    text = re.sub(r"\[[^\]]*\]\s*", "", " ".join(t for t in texts if isinstance(t, str)))
    if not text.strip():
        fail(f"the site holds no text for {doc} under {folder}")
    return text


def check_held(site: Path, record: dict) -> dict[str, list[dict]]:
    held: dict[str, list[dict]] = {}
    cache: dict[str, str] = {}
    for path, words, doc, title in HELD:
        if normal(words) not in normal(plain(at_path(record, path))):
            fail(f"{path}: expected the quotation “{words}”, the record says: {plain(at_path(record, path))}")
        cache.setdefault(doc, normal(held_text(site, doc)))
        if normal(words) not in cache[doc]:
            fail(f"{path}: “{words}” is not word for word in the site's held text of {doc}")
        held.setdefault(path, []).append({"words": words, "doc": doc, "title": title})
    return held


def year_numbers(words: str, kind: str) -> set[int]:
    """The years the words state; a day ("28 October 312") states its year last."""
    numbers = [int(n) for n in re.findall(r"\d+", words)]
    return {numbers[-1]} if kind == "day" and numbers else set(numbers)


def records_by_id(record: dict) -> dict[str, dict]:
    if [p["id"] for p in record["parts"]] != PARTS:
        fail(f"expected the parts {PARTS}, the record has {[p['id'] for p in record['parts']]}")
    found: dict[str, dict] = {}
    for part in record["parts"]:
        for rec in part["records"]:
            if rec["id"] in found or not SLUG.match(rec["id"]):
                fail(f"record id {rec['id']!r} repeats or is not a plain id")
            found[rec["id"]] = rec
    if [r["id"] for r in record["parts"][6]["records"]] != COUNCILS:
        fail(f"expected the councils {COUNCILS} in part 07")
    return found


def check_spans(records: dict[str, dict]) -> tuple[dict, dict]:
    if set(SPANS) != set(records):
        fail(f"every record needs one date span: missing {sorted(set(records) - set(SPANS))}, unknown {sorted(set(SPANS) - set(records))}")
    spans: dict[str, dict] = {}
    for rec_id, (start, end, words, kind) in SPANS.items():
        when = plain(records[rec_id]["when"])
        if words.lower() not in when.lower():
            fail(f"record {rec_id}: expected the date words {words!r}, its date reads {when!r}")
        if not FIRST <= start <= end <= LAST and kind != "unknown":
            fail(f"record {rec_id}: {start} to {end} runs backwards or leaves the case ({FIRST} to {LAST})")
        if words in CENTURY_WORDS:
            if CENTURY_WORDS[words] != (start, end):
                fail(f"record {rec_id}: {words!r} is drawn as {CENTURY_WORDS[words]}, not {start} to {end}")
        elif not {start, end} <= (stated := year_numbers(words, kind)) or not all(start <= n <= end for n in stated):
            fail(f"record {rec_id}: the words {words!r} do not state {start} to {end}")
        if kind in ("year", "day") and start < 250 and not re.search(r"(?<!\d)\d{2,3}(?!\d)", when):
            fail(f"record {rec_id}: a firm date before 250 needs a year the record states")
        if kind == "about" and not re.search(r"\babout\b", when, re.I):
            fail(f"record {rec_id}: drawn as an estimate, but its date does not say “about”")
        spans[rec_id] = {"from": start, "to": end, "kind": kind, "words": words, **({"pieces": PIECES[rec_id]} if rec_id in PIECES else {})}
    alternatives: dict[str, list[dict]] = {}
    for rec_id, alts in ALTERNATIVES.items():
        for alt in alts:
            text = plain(records[rec_id][alt["field"]])
            if alt["words"] not in text:
                fail(f"record {rec_id}: expected the alternative {alt['words']!r} in its {alt['field']}, it says: {text}")
            if alt["from"] > alt["to"]:
                fail(f"record {rec_id}: the alternative {alt['words']!r} runs backwards")
        alternatives[rec_id] = [{key: alt[key] for key in ("from", "to", "holder", "openStart") if key in alt} for alt in alts]
    return spans, alternatives


def check_figures(record: dict, records: dict[str, dict]) -> dict[str, int]:
    values = [f["value"] for f in record["figures"]]
    counts = {"years": LAST - FIRST, "councils": len(COUNCILS), "ignatius": 7, "received": len(RECEPTION[1]["receives"])}
    if "Seven letters" not in records["ignatius"]["kind"]:
        fail(f"the figure of 7 letters of Ignatius expects his record to say “Seven letters”, it says {records['ignatius']['kind']!r}")
    if values != [str(counts["years"]), str(counts["councils"]), str(counts["ignatius"]), str(counts["received"])]:
        fail(f"the opening figures {values} disagree with what they count: {counts}")
    return counts


def check_reception(record: dict) -> list[dict]:
    rows = []
    for row in RECEPTION:
        text = plain(at_path(record, row["path"]))
        if row["words"] not in text:
            fail(f"reception row {row['id']}: expected {row['words']!r} at {row['path']}, the record says: {text}")
        if any(c not in COUNCILS for c in row["receives"]):
            fail(f"reception row {row['id']}: names a council this study does not tell")
        rows.append({key: row[key] for key in ("id", "name", "receives", "who")})
    return rows


def check_accounts(records: dict[str, dict]) -> list[dict]:
    evidence = records["milvian"]["evidence"]
    out = []
    for account in ACCOUNTS:
        start = evidence.find(account["start"])
        end = evidence.find(account["end"], max(start, 0))
        if start < 0 or end < 0:
            fail(f"the account of {account['writer']} is not a sentence of the Milvian Bridge record: {evidence}")
        sentence = evidence[start:end + len(account["end"])]
        if "{{" in sentence:
            fail(f"the account of {account['writer']} would cut a check mark in two")
        out.append({"id": account["id"], "writer": account["writer"], "text": sentence})
    return out


def site_routes(site: Path) -> set[str]:
    routes = set(re.findall(r'path="([^"]+)"', (site / "src/App.tsx").read_text(encoding="utf-8")))
    for path in sorted((site / "src/pages/study").glob("*/route.ts")):
        try:
            found = re.search(r'export const path = "([^"]+)"', path.read_text(encoding="utf-8"))
        except OSError as error:
            fail(f"could not read {path} while listing the site's addresses: {error}")
        if found:
            routes.add(found.group(1))
    return routes


def check_route(site: Path, routes: set[str], route: str, where: str) -> str:
    if not ROUTE.match(route):
        fail(f"{where}: {route!r} leaves the site or is not a plain address")
    if route in routes:
        return route
    folders = {"/study/creeds/": (site / "data/creeds/doc", "{}.json"), "/study/theology-articles/": (site / "src/pages/study/theology-articles/articles", "{}.ts")}
    for prefix, (folder, name) in folders.items():
        slug = route.removeprefix(prefix)
        if route.startswith(prefix) and SLUG.match(slug):
            target = (folder / name.format(slug)).resolve()
            if target.is_relative_to(folder.resolve()) and target.is_file():
                return route
    fail(f"{where}: {route!r} is not an address the site routes")


def check_links(site: Path, record: dict) -> list[str]:
    routes = site_routes(site)
    allowed = {check_route(site, routes, link, f"page link {name}") for name, link in LINKS.items()}
    for path, text in strings(record):
        if path.endswith(".route") and text:
            allowed.add(check_route(site, routes, text, path))
    for source in record["sources"]:
        url = source.get("url", "")
        if url.startswith("/"):
            allowed.add(check_route(site, routes, url, f"source {source['id']}"))
    return sorted(allowed)


def project(lon: float, lat: float) -> tuple[float, float]:
    lon = min(max(lon, LON0 - 1), LON1 + 1)
    lat = min(max(lat, LAT0 - 1), LAT1 + 1)
    return (lon - LON0) * COS * SCALE, (LAT1 - lat) * SCALE


def decode_arcs(topo: dict) -> list[list[tuple[float, float]]]:
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * sx + tx, y * sy + ty))
        arcs.append(points)
    return arcs


def ring_path(ring: list[int], arcs: list) -> str:
    points: list[tuple[float, float]] = []
    for index in ring:
        arc = arcs[index] if index >= 0 else list(reversed(arcs[~index]))
        points.extend(arc if not points else arc[1:])
    if not any(LON0 <= lon <= LON1 and LAT0 <= lat <= LAT1 for lon, lat in points):
        return ""
    kept: list[tuple[float, float]] = []
    for lon, lat in points:
        x, y = project(lon, lat)
        if not kept or abs(x - kept[-1][0]) + abs(y - kept[-1][1]) > SIMPLIFY:
            kept.append((x, y))
    if len(kept) < 4:
        return ""
    return "M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in kept) + "Z"


def build_map(site: Path, record: dict) -> dict:
    land = site / LAND
    if not land.is_file():
        fail(f"expected the land outline at {land}: run npm install in the site folder")
    topo = json.loads(land.read_text(encoding="utf-8"))
    arcs = decode_arcs(topo)
    paths = []
    for geometry in topo["objects"]["land"]["geometries"]:
        for polygon in geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]:
            if path := ring_path(polygon[0], arcs):
                paths.append(path)
    if not paths:
        fail(f"no land from {land} falls inside the map's frame")
    council_text = " ".join(plain(s) for p, s in strings(record) if p.startswith(PLACE_TEXT))
    places = []
    for place in PLACES:
        if place["words"] and place["words"] not in council_text:
            fail(f"map place {place['id']}: expected the record's councils to say {place['words']!r}")
        x, y = project(place["lon"], place["lat"])
        places.append({"id": place["id"], "label": place["label"], "kind": place["kind"], "x": round(x, 1), "y": round(y, 1)})
    return {"width": WIDTH, "height": round((LAT1 - LAT0) * SCALE, 1), "paths": paths, "places": places}


def build_data(site: Path) -> str:
    raw = (site / RECORD).read_bytes().replace(b"\r\n", b"\n")
    record = json.loads(raw)
    catalog = json.loads((site / "data/catalog.json").read_text(encoding="utf-8"))
    codes = {book["name"]: book["code"] for book in catalog["books"]}
    pattern = reference_pattern(list(codes))
    records = records_by_id(record)
    check_labels_used(record)
    verses, refs = collect_references(record, pattern, codes, Berean(site / "data/text/bsb"))
    quotations = check_quotations(record, pattern, verses, refs)
    held = check_held(site, record)
    spans, alternatives = check_spans(records)
    counts = check_figures(record, records)
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "counts": {**counts, "quotations": quotations, "held": len(HELD)},
        "spans": spans,
        "alternatives": alternatives,
        "accounts": check_accounts(records),
        "held": held,
        "reception": check_reception(record),
        "map": build_map(site, record),
        "unchecked": [s["id"] for s in record["sources"] if s["status"] == "check"],
        # Verse ids only: the words were checked above and the page shows them in the reader's Bible (src/lib/verses.ts).
        "verses": {name: {key: verse[key] for key in ("code", "chapter", "verse")} for name, verse in verses.items()},
        "refs": refs,
        "routes": check_links(site, record),
    }
    text = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    if "://" in text:
        fail("the generated data holds an outside link; this page links only inside the site")
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
        current = out.read_bytes().replace(b"\r\n", b"\n").decode("utf-8") if out.is_file() else None
        if current != text:
            fail(f"{out} is {'missing' if current is None else 'stale'}: run python scripts/build-early-church-study.py")
        print(f"up to date: {out}")
        return
    write_atomic(out, text)
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses under {len(data['refs'])} references, "
          f"{data['counts']['quotations']} Berean quotations and {data['counts']['held']} held-text quotations checked, "
          f"{len(data['spans'])} date spans, {len(data['routes'])} internal links")


if __name__ == "__main__":
    main()
