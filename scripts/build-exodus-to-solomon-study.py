#!/usr/bin/env python3
"""Build src/pages/study/exodus-to-solomon/exodus-to-solomon-data.json for /study/israel-from-the-exodus-to-solomon.

Reads the research record (content/academic-research/38-israel-from-the-exodus-to-solomon.json) and refuses to write if:
- a listed verse does not exist in the site's Berean (data/text/bsb), or its label does not name its book, chapter and verse;
- a Bible reference written in the record's prose ("Exodus 6:16–20") does not exist;
- a quotation marked "(Reference · BSB)" is not word for word the Berean at that reference;
- a verse label the page uses (a station's, the stance's, a cord's) is not in the record's verse list;
- a cord's length is not the number its own verse gives in the Berean (480 in 1 Kings 6:1, 430 in Exodus 12:40, 300 in
  Judges 11:26), the shorter stay is not half of 430, or a cord's end is not the year the record states for it;
- a ground bar or an outside record (a nail) runs backwards, leaves the chart, or disagrees with the record's own words for it
  ("about 1550 BC" must fall inside the bar; a bar said to be "13th century" must lie inside that century);
- a link the page makes leaves the site or names an address the site does not route.
Check marks ({{check:cN}}…{{/check}}) are removed before any text is compared. That proves references, quotations, the
cords' arithmetic and that the bars match the record's words; it does not prove any reading, date or scholar's view right.

Usage: python scripts/build-exodus-to-solomon-study.py [--site <Website folder>] [--check]
  --check builds in memory and fails if the file on disk differs (stale or missing); it writes nothing.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/38-israel-from-the-exodus-to-solomon.json")
INDEX = Path("content/academic-research/index.json")
FOLDER = Path("src/pages/study/exodus-to-solomon")
OUTPUT = FOLDER / "exodus-to-solomon-data.json"
BUDGET_BYTES = 40_000
CHECK_MARK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
QUOTE = re.compile(r"“([^”]+)” \(([^()]+?) · BSB\)")
ALIASES = {"Psalm": "PSA"}
STATIONS = ["egypt", "exodus", "conquest", "highlands", "david", "solomon"]
LINKS = {"academic": "/study/academic"}
MAX_RUN_ON = 100
# Each ground bar and outside record, with the record's own words for its date. "about N BC" must fall inside the bar; a
# century ("13th century", "tenth century", "late 11th or early 10th century") must hold the whole bar. A bar with no
# words in years is exempt only with its reason, so none passes unchecked by accident.
GROUND_WORDS = {
    "avaris": {"exempt": "an archaeological period (Middle Bronze Age), rounded by the record itself"},
    "jericho-k": {"path": ".stations[2].records[0].evidence", "words": "about 1550 BC"},
    "jericho-w": {"path": ".stations[2].records[0].evidence", "words": "about 1400 BC"},
    "hazor": {"path": ".stations[2].records[2].evidence", "words": "13th century BC"},
    "villages": {"path": ".stations[3].lead", "words": "from about 1200 BC"},
    "shiloh": {"path": ".stations[3].records[3].evidence", "words": "middle of the 11th century BC"},
    "qeiyafa": {"path": ".stations[4].records[1].evidence", "words": "late 11th or early 10th century BC"},
    "gates": {"ranges": [{"path": ".stations[5].lead", "words": "tenth century BC"},
                         {"path": ".debates[3].views[2].note", "words": "9th-century"}]},
    "merneptah": {"path": ".stations[3].records[1].evidence", "words": "about 1208 BC"},
    "shoshenq": {"path": ".stations[5].records[4].evidence", "words": "about 925 BC"},
}
UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
TENS = {20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety"}
ORDINALS = {"tenth": 10, "ninth": 9, "eleventh": 11, "twelfth": 12, "thirteenth": 13}


def fail(message: str) -> NoReturn:
    sys.exit(f"build-exodus-to-solomon-study: {message}")


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
    """The site's Berean, read book by book from data/text/bsb on first use: each verse's words and its footnotes."""

    def __init__(self, root: Path):
        self.root, self.cache = root, {}

    def chapter(self, code: str, chapter: int) -> dict[int, tuple[str, list[str]]]:
        if code not in self.cache:
            if not BOOK_CODE.match(code) or not (self.root / code).is_dir():
                fail(f"the Berean has no book {code!r}")
            book: dict[int, dict[int, tuple[str, list[str]]]] = {}
            for path in sorted((self.root / code).glob("*.json")):
                for found in json.loads(path.read_text(encoding="utf-8")).values():
                    book[int(found["c"])] = {int(item["n"]): verse_parts(item["r"]) for item in found["v"] if item["n"].isdigit()}
            self.cache[code] = book
        return self.cache[code].get(chapter, {})

    def verse(self, code: str, chapter: int, verse: int, where: str) -> tuple[str, list[str]]:
        found = self.chapter(code, chapter).get(verse)
        if not found or not found[0]:
            fail(f"{where}: the Berean has no {code} {chapter}:{verse}")
        return found


def verse_parts(runs: list) -> tuple[str, list[str]]:
    words = "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in runs)
    notes = [run["f"] for run in runs if isinstance(run, dict) and isinstance(run.get("f"), str)]
    return re.sub(r"\s+", " ", words).strip(), notes


def book_codes(site: Path) -> dict[str, str]:
    catalog = json.loads((site / "data/catalog.json").read_text(encoding="utf-8"))
    return {**{book["name"]: book["code"] for book in catalog["books"]}, **ALIASES}


def reference_pattern(names: list[str]) -> re.Pattern:
    books = "|".join(re.escape(name) for name in sorted(names, key=len, reverse=True))
    part = r"\d+:\d+(?:[–-]\d+)?(?:, \d+(?:[–-]\d+)?(?![\d:]))*"
    return re.compile(rf"(?<![A-Za-z0-9])({books}) ({part}(?:; {part})*)(?![\d:])")


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


def collect_references(record: dict, pattern: re.Pattern, codes: dict[str, str], bible: Berean) -> tuple[dict, dict]:
    verses: dict[str, dict] = {}
    refs: dict[str, list[str]] = {}

    def add(key: str, found: list[tuple[str, int, int]], where: str) -> None:
        keys = []
        for code, chapter, number in found:
            name = f"{code} {chapter}:{number}"
            text, notes = bible.verse(code, chapter, number, where)
            verses[name] = {"code": code, "chapter": chapter, "verse": number, "text": text, "notes": notes}
            keys.append(name)
        if refs.setdefault(key, keys) != keys:
            fail(f"{where}: the reference {key!r} resolves two ways")

    for entry in record["verses"]:
        code, chapter, number, label = entry["code"], entry["chapter"], entry["verse"], entry["label"]
        names = [n for n, c in codes.items() if c == code]
        if not names or label not in {f"{n} {chapter}:{number}" for n in names}:
            fail(f"verse {label!r}: expected the label to read '<book> {chapter}:{number}' for {code}")
        add(label, [(code, chapter, number)], f"verse {label}")
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


def check_stations(record: dict) -> int:
    listed = {v["label"] for v in record["verses"]}
    if [s["id"] for s in record["stations"]] != STATIONS:
        fail(f"expected the stations {STATIONS} in the Bible's order, the record has {[s['id'] for s in record['stations']]}")
    used = set(record["stance"]["verses"]) | {c["verse"] for c in record["timeline"]["cords"] if "verse" in c}
    count = 0
    for station in record["stations"]:
        used |= set(station["verses"])
        ids = [r["id"] for r in station["records"]]
        if len(ids) != len(set(ids)) or not ids:
            fail(f"station {station['id']}: its records are missing or an id repeats: {ids}")
        for item in station["records"]:
            if not all(plain(item.get(part, "")).strip() for part in ("title", "evidence", "inference", "limit")):
                fail(f"station {station['id']}, record {item['id']}: evidence, inference and limit must each be written")
        count += len(ids)
    if used - listed:
        fail(f"verse labels the page uses are not in the record's verse list: {sorted(used - listed)}")
    for debate in record["debates"]:
        if debate.get("notChosen") is not True or len(debate["views"]) < 2:
            fail(f"debate {debate['id']}: every debate is shown with at least two views and none chosen")
    return count


def number_words(n: int) -> set[str]:
    """480 -> {"480", "four hundred and eighty", "four hundred and eightieth"}; enough for the cords' numbers."""
    hundreds, rest = divmod(n, 100)
    tens, units = divmod(rest, 10)
    tail = UNITS[rest] if rest <= 12 else f"{TENS[tens * 10]}{'-' + UNITS[units] if units else ''}"
    words = f"{UNITS[hundreds]} hundred" + (f" and {tail}" if rest else "") if hundreds else tail
    ordinal = re.sub(r"y$", "ieth", words) if words.endswith("y") else words + "th"
    return {str(n), words, ordinal}


def first_number(text: str, where: str) -> int:
    found = re.search(r"\d+", plain(text))
    if not found:
        fail(f"{where}: expected a number of years in {text!r}")
    return int(found.group(0))


def stated_year(text: str, where: str) -> int:
    found = re.search(r"about (\d{3,4}) BC", plain(text))
    if not found:
        fail(f"{where}: expected 'about <year> BC' in {plain(text)!r}")
    return int(found.group(1))


def check_cords(record: dict, verses: dict, refs: dict) -> dict:
    timeline = record["timeline"]
    cords = {c["id"]: c for c in timeline["cords"]}
    if set(cords) != {"480count", "480measure", "430egypt", "215egypt", "300"}:
        fail(f"expected the five cords of the design, the record has {sorted(cords)}")
    lengths = {cid: first_number(c["name"], f"cord {cid}") for cid, c in cords.items()}
    for cid, cord in cords.items():
        # The measure reading names no verse of its own: it reads the same 1 Kings 6:1 as the count.
        verse = cord.get("verse") or (cords["480count"].get("verse", "") if cid == "480measure" else "")
        berean = normal(" ".join(verses[key]["text"] for key in refs.get(verse, [])))
        if not berean or not any(form in berean for form in number_words(lengths[cid] * (2 if cid == "215egypt" else 1))):
            fail(f"cord {cid}: {lengths[cid]} years is not the number the Berean gives at {verse or 'no verse'}: {berean or 'no text'}")
    if lengths["215egypt"] * 2 != lengths["430egypt"]:
        fail(f"cord 215egypt: the shorter stay should be half of {lengths['430egypt']}, the record gives {lengths['215egypt']}")
    peg = cords["480count"]["from"]
    if cords["480measure"]["from"] != peg or f"about {peg} BC" not in plain(record["stations"][1]["lead"]):
        fail(f"both readings of 1 Kings 6:1 must hang from the peg the record states (about {peg} BC)")
    if cords["480count"].get("length") != lengths["480count"]:
        fail(f"cord 480count: its length {cords['480count'].get('length')} is not the {lengths['480count']} its name gives")
    early, late = peg + lengths["480count"], stated_year(cords["480measure"]["note"], "cord 480measure")
    for year, cord_id, view in ((early, "480count", 0), (late, "480measure", 1)):
        if stated_year(cords[cord_id]["note"], f"cord {cord_id}") != year or stated_year(record["debates"][0]["views"][view]["name"], "debate") != year:
            fail(f"cord {cord_id}: its end, about {year} BC, is not the year its note and the exodus-date view both state")
    if not peg < late < early:
        fail(f"the late date ({late}) must fall between the peg ({peg}) and the early date ({early})")
    generations = re.search(r"\b(" + "|".join(UNITS[1:]) + r") generations", cords["480measure"]["name"])
    hangs = []
    for exodus, year in (("count", early), ("measure", late)):
        hangs.append({"exodus": exodus, "reading": "egypt", "egypt": [year + lengths["430egypt"], year]})
        hangs.append({"exodus": exodus, "reading": "canaan", "egypt": [year + lengths["215egypt"], year],
                      "canaan": [year + lengths["430egypt"], year + lengths["215egypt"]]})
    for hang in hangs:
        if hang["egypt"][0] > timeline["from"] or ("canaan" in hang and hang["canaan"][0] > timeline["from"]):
            fail(f"the 430 years hung from about {hang['egypt'][1]} BC run off the chart's start ({timeline['from']} BC)")
    return {"peg": peg, "exodus": {"count": early, "measure": late}, "lengths": lengths, "hangs": hangs,
            "generations": UNITS.index(generations.group(1)) if generations else 0}


def century_span(words: str) -> tuple[int, int] | None:
    numbers = [int(n) for n in re.findall(r"(\d+)(?:st|nd|rd|th)", words)] + [ORDINALS[w] for w in re.findall(r"[a-z]+", words) if w in ORDINALS]
    if not numbers or "centur" not in words:
        return None
    return max(numbers) * 100, (min(numbers) - 1) * 100


def check_words(record: dict, bar_id: str, start: int, end: int, path: str, words: str) -> None:
    text = plain(at_path(record, path))
    if words not in text:
        fail(f"bar {bar_id}: expected {words!r} at {path}, the record says: {text}")
    span = century_span(words)
    about = re.search(r"about (\d{3,4})", words)
    if about and not start >= int(about.group(1)) >= end:
        fail(f"bar {bar_id}: the record says {words!r}, outside the bar {start}–{end} BC")
    if span and not span[0] >= start >= end >= span[1]:
        fail(f"bar {bar_id}: {start}–{end} BC is not inside the record's {words!r} ({span[0]}–{span[1]})")
    if not about and not span:
        fail(f"bar {bar_id}: the words {words!r} give no year this build can test")


def check_ground(record: dict) -> tuple[dict[str, list[list[int]]], dict[str, int]]:
    """The bars, and the drawn chart: the record's 1900 to 900 BC, run on past 900 only as far as a bar needs (the low dating
    of the gates ends about 850 BC), never more than MAX_RUN_ON years, so no bar is cut short and the page can say so."""
    timeline = record["timeline"]
    bars: dict[str, list[list[int]]] = {}
    drawn_to = min([timeline["to"]] + [r[1] for b in timeline["ground"] + timeline["fixed"] for r in (b.get("ranges") or [[b["start"], b["end"]]])])
    for bar in timeline["ground"] + timeline["fixed"]:
        spans = [list(r) for r in bar["ranges"]] if "ranges" in bar else [[bar["start"], bar["end"]]]
        if bar["id"] in bars or bar["id"] not in GROUND_WORDS:
            fail(f"bar {bar['id']}: its id repeats or it has no entry in GROUND_WORDS (words or a stated exemption)")
        for start, end in spans:
            if start < end or start > timeline["from"] or end < timeline["to"] - MAX_RUN_ON:
                fail(f"bar {bar['id']}: {start}–{end} BC runs backwards or leaves the chart ({timeline['from']}–{timeline['to']} BC, "
                     f"run on at most {MAX_RUN_ON} years)")
        rule = GROUND_WORDS[bar["id"]]
        if "ranges" in rule:
            if len(rule["ranges"]) != len(spans):
                fail(f"bar {bar['id']}: it has {len(spans)} ranges and {len(rule['ranges'])} sets of words")
            for (start, end), each in zip(spans, rule["ranges"]):
                check_words(record, bar["id"], start, end, each["path"], each["words"])
        elif "path" in rule:
            check_words(record, bar["id"], spans[0][0], spans[0][1], rule["path"], rule["words"])
        elif not rule.get("exempt"):
            fail(f"bar {bar['id']}: no words and no stated exemption")
        bars[bar["id"]] = spans
    return bars, {"from": timeline["from"], "to": timeline["to"], "drawnTo": drawn_to}


def served_routes(site: Path) -> set[str]:
    routes = set(re.findall(r'path="([^"]+)"', (site / "src/App.tsx").read_text(encoding="utf-8")))
    for route in (site / "src/pages/study").glob("*/route.ts"):
        routes |= set(re.findall(r'export const path = "([^"]+)"', route.read_text(encoding="utf-8")))
    return routes


def check_links(site: Path, record: dict, text: str) -> tuple[dict[str, str], list[dict]]:
    routes = served_routes(site)
    for name, link in LINKS.items():
        if not re.fullmatch(r"/[a-z0-9/-]+", link) or link not in routes:
            fail(f"link {name}: {link!r} leaves the site or is not an address the site routes")
    studies = {s.get("order"): s for s in json.loads((site / INDEX).read_text(encoding="utf-8"))["studies"]}
    neighbours = []
    for item in record["neighbours"]:
        order = re.search(r"\((\d+)\)", item["study"])
        study = studies.get(int(order.group(1))) if order else None
        # The index's route where it gives one; otherwise the address its research file's name implies (32-egypt-beside-israel.json
        # -> /study/egypt-beside-israel). Either is linked only if the site serves it.
        implied = "/study/" + re.sub(r"^\d+-|\.json$", "", study.get("file") or study.get("dossier") or "") if study else ""
        route = (study.get("route") or implied) if study else ""
        if route and (not re.fullmatch(r"/study/[a-z0-9-]+", route) or route not in routes):
            route = ""  # an index route the site does not serve is shown without a link, never refused
        neighbours.append({"study": item["study"], "order": int(order.group(1)) if order else 0,
                           "siteTitle": study["title"] if study else "", "route": route})
    if "://" in text:
        fail("the record or its data holds an outside link; this page links only inside the site")
    return dict(LINKS), neighbours


def build_data(site: Path) -> str:
    raw = (site / RECORD).read_bytes().removeprefix(b"\xef\xbb\xbf").replace(b"\r\n", b"\n")
    record = json.loads(raw)
    codes = book_codes(site)
    bible = Berean(site / "data/text/bsb")
    pattern = reference_pattern(list(codes))
    records = check_stations(record)
    verses, refs = collect_references(record, pattern, codes, bible)
    quotations = check_quotations(record, pattern, verses, refs)
    cords = check_cords(record, verses, refs)
    bars, chart = check_ground(record)
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "counts": {"spans": len({c["verse"] for c in record["timeline"]["cords"] if "verse" in c}), "nails": len(record["timeline"]["fixed"]),
                   "stations": len(record["stations"]), "records": records, "debates": len(record["debates"]), "quotations": quotations},
        "cords": cords,
        "bars": bars,
        "chart": chart,
        "verses": verses,
        "refs": refs,
        "links": {},
        "neighbours": [],
    }
    data["links"], data["neighbours"] = check_links(site, record, raw.decode("utf-8") + json.dumps(data, ensure_ascii=False))
    if data["counts"]["spans"] != 3 or data["counts"]["nails"] != 2:
        fail(f"expected 3 spans of Scripture and 2 nails, found {data['counts']['spans']} and {data['counts']['nails']}")
    text = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    if len(text.encode("utf-8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf-8'))} bytes, over the {BUDGET_BYTES} budget")
    return text


def write_atomic(out: Path, text: str) -> None:
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        for attempt in range(5):
            try:
                os.replace(temp, out)
                break
            except PermissionError:
                if attempt == 4:
                    raise
                time.sleep(0.4)  # Windows: a reader (the test runner, an editor) may hold the file for a moment
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
            fail(f"{out} is {'missing' if current is None else 'stale'}: run python scripts/build-exodus-to-solomon-study.py")
        print(f"up to date: {out}")
        return
    write_atomic(out, text)
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses under {len(data['refs'])} references, "
          f"{data['counts']['records']} records in {data['counts']['stations']} stations, exodus cords at about "
          f"{data['cords']['exodus']['count']} and {data['cords']['exodus']['measure']} BC")


if __name__ == "__main__":
    main()
