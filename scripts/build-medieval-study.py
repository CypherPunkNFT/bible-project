#!/usr/bin/env python3
"""Build src/pages/study/medieval/medieval-data.json for /study/the-medieval-church.

Reads the research record, takes each listed verse from the site's Berean copy (data/text/bsb) and asserts that it holds the
stated phrase, and that every inline quotation marked "· BSB" is word for word the Berean at its reference. Checks that every
source, picture and verse the record names exists, that every range runs forward, that each test has one supported answer, and
that nothing is said to be written before it began. Reads the check-note markers ({{check:cN}}…{{/check}}) the way the page does
and refuses a marker outside the reading fields, a marker without its note, a note without its marker, a malformed note, and any
marker inside a Bible quotation; every text check runs on the words with the markers removed. Refuses a route that leaves the
site, and a source or picture link that is not https. Cuts the Natural Earth land (from the world-atlas package) to the mission
map's frame and simplifies it. That proves the references and the shape of the record; it does not prove any reading.

Exit codes: 0 built (or, with --check, up to date); 1 with --check, the data is stale; 2 refused, and nothing was written.
Usage: python scripts/build-medieval-study.py [--site <Website folder>] [--check]
"""
import argparse
import hashlib
import json
import math
import os
import re
import sys
import tempfile
import time
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/33-the-medieval-church.json")
OUTPUT = Path("src/pages/study/medieval/medieval-data.json")
LAND = Path("node_modules/world-atlas/land-50m.json")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
LON0, LON1, LAT0, LAT1 = -28.0, 27.0, 46.0, 68.0
WIDTH = 640.0
COS = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = WIDTH / ((LON1 - LON0) * COS)
SIMPLIFY = 2.4
BUDGET_BYTES = 40_000
TILTS = {"pope", "level", "king"}
STATUSES = {"read", "part", "second-hand", "located"}
COUNTS = {"fields": 4, "pairs": 11, "ways": 4, "stations": 11, "rounds": 11, "claims": 4}
SPLIT_STEPS, CRUSADE_EVENTS = 7, 9
SPLIT_KINDS = {"strain", "break", "wound", "union"}
CRUSADE_GROUPS = ("crusade", "inquisition")
FIRST_YEAR, LAST_YEAR, SPLIT_LAST = 451, 1350, 1460
NOTE_STATUSES = {"confirmed", "corrected", "link", "open"}
# The page's own reader (src/pages/study/check-notes/checked.ts) uses this pattern: lazy, no nesting.
MARKER = re.compile(r"\{\{check:(c\d+)\}\}([\s\S]*?)\{\{/check\}\}")
NOTE_ID = re.compile(r"^c\d+$")
# Markers may stand only in fields the page shows through <Checked> as reading text.
READING_FIELDS = {"text", "inference", "limit", "evidence", "note", "rule", "record", "stand", "lead"}
# ...and never in these, which the page shows inside a control, a drawing or a quotation.
NO_MARKERS = re.compile(r"^\.(fields|ways|pictures|sources|verses|article\.parts)|^\.claims\[\d+\]\.test")
COUNTED_FIELDS = READING_FIELDS | {"head", "quote", "what", "says", "claim", "why", "name", "question"}
INLINE_BSB = re.compile(r"“([^”]{3,})”\s*\(((?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)? \d+:\d+) · BSB\)")
INTERNAL_ROUTE = re.compile(r"^/(?![/\\])")
HTTPS = re.compile(r"^https://[a-z0-9.-]+\.[a-z]{2,}/", re.I)


class Refused(Exception):
    """The record breaks one of this script's rules; nothing is written."""


def fail(message: str) -> NoReturn:
    raise Refused(message)


def plain(text: str) -> str:
    """The text as a reader sees it: every check-note marker removed, its words kept."""
    return MARKER.sub(lambda m: m.group(2), text)


def walk(value: object, path: str = "") -> Iterator[tuple[str, str, str]]:
    """Every string in the record, with its path and the key that holds it."""
    if isinstance(value, str):
        yield path, re.sub(r"\[\d+\]$", "", path).rsplit(".", 1)[-1], value
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from walk(item, f"{path}[{index}]")
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from walk(item, f"{path}.{key}")


def run_text(run: object) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) else ""


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run_text(r) for r in runs)).strip()


def book_chapters(root: Path, code: str) -> Iterator[dict]:
    for path in sorted((root / code).glob("*.json")):
        yield from json.loads(path.read_text(encoding="utf-8")).values()


def normal(text: str) -> str:
    return text.lower().replace("’", "'").replace("“", "").replace("”", "").replace("‘", "'")


def read_verse(bsb_root: Path, entry: dict) -> str:
    code, chapter, verse = entry["code"], entry["chapter"], entry["verse"]
    if not BOOK_CODE.match(code):
        fail(f"{entry['label']}: book code {code!r} is not three capitals or digits")
    if "{{" in entry["phrase"]:
        fail(f"{entry['label']}: a check-note marker inside a Bible phrase")
    for found in book_chapters(bsb_root, code):
        if int(found["c"]) != chapter:
            continue
        for item in found["v"]:
            if item["n"] == str(verse):
                text = verse_text(item["r"])
                if normal(entry["phrase"]) not in normal(text):
                    fail(f"{entry['label']}: expected the phrase {entry['phrase']!r}, the Berean has: {text}")
                return text
    fail(f"the Berean has no {code} {chapter}:{verse} ({entry['label']})")


def check_counts(record: dict) -> None:
    for name, expected in COUNTS.items():
        if len(record[name]) != expected:
            fail(f"expected {expected} {name}, the record has {len(record[name])}")
    for name in ("pairs", "stations", "rounds", "sources", "pictures"):
        ids = [item["id"] for item in record[name]]
        if len(set(ids)) != len(ids):
            fail(f"{name}: the ids repeat: {ids}")


def check_pairs(record: dict, sources: set[str]) -> None:
    fields = {f["id"] for f in record["fields"]}
    for pair in record["pairs"]:
        if pair["field"] not in fields or pair["link"] not in {"same", "beside"}:
            fail(f"pair {pair['id']}: field {pair['field']!r} or link {pair['link']!r} is not one this study has")
        for side in (pair["declared"], pair["followed"]):
            if side["from"] > side["to"]:
                fail(f"pair {pair['id']}: a range runs backwards: {side['from']} to {side['to']}")
            if side["source"] not in sources:
                fail(f"pair {pair['id']}: source {side['source']!r} is not listed")
            if not side["quote"] and not side.get("what"):
                fail(f"pair {pair['id']}: the side by {side['who']!r} has neither a quotation nor a statement")
        if pair["declared"]["from"] > pair["followed"]["from"]:
            fail(f"pair {pair['id']}: what is set beside the decree starts before it")


def check_stations(record: dict, pictures: set[str]) -> None:
    ways = {w["id"] for w in record["ways"]}
    for station in record["stations"]:
        name = station["id"]
        if station["way"] not in ways:
            fail(f"station {name}: way {station['way']!r} is not one this study has")
        if not station["from"] <= station["to"] or station["written"] < station["from"]:
            fail(f"station {name}: from {station['from']}, to {station['to']}, written {station['written']} do not run forward")
        if not (LON0 < station["lon"] < LON1 and LAT0 < station["lat"] < LAT1):
            fail(f"station {name}: {station['lon']}, {station['lat']} is outside the map's frame")
        if "picture" in station and station["picture"] not in pictures:
            fail(f"station {name}: picture {station['picture']!r} is not listed")


def check_rounds(record: dict) -> None:
    years = [r["year"] for r in record["rounds"]]
    if years != sorted(years):
        fail(f"the rounds should run in order of year, they run {years}")
    for item in record["rounds"]:
        if item["tilt"] not in TILTS or not item["why"] or not item["limit"]:
            fail(f"round {item['id']}: tilt {item['tilt']!r} needs a why and a limit")


def check_article(record: dict) -> None:
    parts = {p["id"]: p for p in record["article"]["parts"]}
    for part in parts.values():
        if "answers" in part and parts.get(part["answers"], {}).get("answeredBy") != part["id"]:
            fail(f"article part {part['id']}: its objection does not name it back")
    for step in record["ladder"]["steps"]:
        if step["from"] >= step["to"]:
            fail(f"ladder step {step['id']}: {step['from']} to {step['to']} runs backwards")


def need(item: dict, keys: tuple[str, ...], what: str) -> None:
    for key in keys:
        if key not in item:
            fail(f"{what} {item.get('id', '?')}: missing {key!r}")


def check_split(record: dict) -> None:
    steps = record.get("split", {}).get("steps")
    if not isinstance(steps, list) or len(steps) != SPLIT_STEPS:
        fail(f"expected {SPLIT_STEPS} steps between East and West, the record has {len(steps) if isinstance(steps, list) else 'none'}")
    for step in steps:
        need(step, ("id", "year", "to", "when", "kind", "head", "text", "inference", "limit", "sources"), "split step")
        if step["kind"] not in SPLIT_KINDS:
            fail(f"split step {step['id']}: kind {step['kind']!r} is not one of {sorted(SPLIT_KINDS)}")
        if not FIRST_YEAR <= step["year"] <= step["to"] <= SPLIT_LAST:
            fail(f"split step {step['id']}: {step['year']} to {step['to']} does not run forward inside {FIRST_YEAR} to {SPLIT_LAST}")
    years = [step["year"] for step in steps]
    if years != sorted(years):
        fail(f"the steps between East and West should run in order of year, they run {years}")


def check_crusade(record: dict) -> None:
    crusade = record.get("crusade", {})
    events, sides = crusade.get("events"), {side["id"] for side in crusade.get("sides", [])}
    if not isinstance(events, list) or len(events) != CRUSADE_EVENTS:
        fail(f"expected {CRUSADE_EVENTS} crusade and inquisition events, the record has {len(events) if isinstance(events, list) else 'none'}")
    for event in events:
        need(event, ("id", "group", "year", "to", "when", "head", "text", "inference", "limit", "witnesses", "sources"), "event")
        if event["group"] not in CRUSADE_GROUPS:
            fail(f"event {event['id']}: group {event['group']!r} is not one of {list(CRUSADE_GROUPS)}")
        if not FIRST_YEAR <= event["year"] <= event["to"] <= LAST_YEAR:
            fail(f"event {event['id']}: {event['year']} to {event['to']} does not run forward inside {FIRST_YEAR} to {LAST_YEAR} (1350 to 1517 is study 24's)")
        if not event["witnesses"]:
            fail(f"event {event['id']}: no witness is named")
        for witness in event["witnesses"]:
            if witness.get("side") not in sides:
                fail(f"event {event['id']}: witness side {witness.get('side')!r} is not one of {sorted(sides)}")
            if not isinstance(witness.get("written"), int) or witness["written"] < event["year"]:
                fail(f"event {event['id']}: {witness.get('who')!r} is said to write before the event began")
    for group in CRUSADE_GROUPS:
        years = [e["year"] for e in events if e["group"] == group]
        if years != sorted(years):
            fail(f"the {group} events should run in order of year, they run {years}")


def notes_by_id(notes: object) -> dict[str, dict]:
    if not isinstance(notes, list):
        fail("checkNotes should be a list")
    by_id: dict[str, dict] = {}
    for note in notes:
        if not isinstance(note, dict) or not NOTE_ID.match(str(note.get("id", ""))):
            fail(f"check note {note!r}: its id should be c and a number")
        for key in ("path", "was", "before", "after", "note"):
            if not isinstance(note.get(key), str):
                fail(f"check note {note['id']}: {key} should be text, it is {note.get(key)!r}")
        if note.get("status") not in NOTE_STATUSES or not isinstance(note.get("marker"), bool):
            fail(f"check note {note['id']}: status {note.get('status')!r} or marker {note.get('marker')!r} is not allowed")
        for edit in note.get("fieldEdits") or []:
            if not isinstance(edit, dict) or not isinstance(edit.get("path"), str):
                fail(f"check note {note['id']}: a field edit has no path")
        if note["id"] in by_id:
            fail(f"check note {note['id']}: the id repeats")
        by_id[note["id"]] = note
    return by_id


def check_markers(record: dict) -> None:
    by_id = notes_by_id(record.get("checkNotes", []))
    seen: dict[str, str] = {}
    for path, key, text in walk({k: v for k, v in record.items() if k != "checkNotes"}):
        found = MARKER.findall(text)
        if found and (key not in READING_FIELDS or NO_MARKERS.match(path)):
            fail(f"{path}: a check-note marker in {key!r}, which the page does not show as reading text")
        for quote, _ref in INLINE_BSB.findall(text):
            if "{{" in quote:
                fail(f"{path}: a check-note marker inside a Bible quotation")
        left = plain(text)
        if "{{" in left or "}}" in left:
            fail(f"{path}: a malformed check-note marker: {text[:90]!r}")
        for note_id, _words in found:
            if note_id not in by_id:
                fail(f"{path}: marker {note_id} has no note")
            if note_id in seen:
                fail(f"{path}: marker {note_id} is also used at {seen[note_id]}")
            seen[note_id] = path
            if by_id[note_id]["marker"] and by_id[note_id]["path"] != path:
                fail(f"check note {note_id}: its path says {by_id[note_id]['path']}, the marker is at {path}")
    for note_id, note in by_id.items():
        if note["marker"] and note_id not in seen:
            fail(f"check note {note_id}: its marker is not in the record")


def check_links(record: dict) -> None:
    for path, key, text in walk(record):
        if key == "route" and text and not INTERNAL_ROUTE.match(text):
            fail(f"{path}: the route {text!r} leaves the site")
    for source in record["sources"]:
        if source["id"] != "scripture" and not HTTPS.match(source["url"]):
            fail(f"source {source['id']}: {source['url']!r} is not an https link")
    for picture in record["pictures"]:
        links = [picture["href"], picture["licenceUrl"]] + ([picture["record"]["href"]] if "record" in picture else [])
        for link in links:
            if not HTTPS.match(link):
                fail(f"picture {picture['id']}: {link!r} is not an https link")


def check_inline_quotes(record: dict, verses: dict[str, str]) -> None:
    for path, _key, text in walk(record):
        for quote, ref in INLINE_BSB.findall(plain(text)):
            if ref not in verses:
                fail(f"{path}: the quotation ({ref} · BSB) is not a verse the record lists")
            if normal(quote) not in normal(verses[ref]):
                fail(f"{path}: “{quote}” is not word for word the Berean at {ref}: {verses[ref]}")


def verse_labels_used(record: dict) -> set[str]:
    used = {record["missionStand"]["verse"], *record["powersStand"]["verses"]}
    used |= {*record["split"]["stand"]["verses"], *record["crusade"]["stand"]["verses"]}
    used |= {e["verse"] for e in record["crusade"]["events"] if "verse" in e}
    used |= {r["verse"] for r in record["rounds"] if "verse" in r}
    used |= {p["verse"] for p in record["article"]["parts"] if "verse" in p}
    used |= {v for s in record["parish"]["stations"] for v in s.get("standVerses", [])}
    return used


def check_references(record: dict, sources: set[str]) -> None:
    pictures = {p["id"] for p in record["pictures"]}
    listed = {v["label"] for v in record["verses"]}
    used = verse_labels_used(record)
    if used != listed:
        fail(f"the verses used and the verses listed differ: {sorted(used ^ listed)}")
    cited = [*record["pairs"], *record["stations"], *record["rounds"], *record["claims"], *record["parish"]["stations"],
             *record["split"]["steps"], *record["crusade"]["events"], {"id": "crusade debate", **record["crusade"]["debate"]}]
    for item in cited:
        for source in item["sources"]:
            if source not in sources:
                fail(f"{item['id']}: source {source!r} is not listed")
        if "picture" in item and item["picture"] not in pictures:
            fail(f"{item['id']}: picture {item['picture']!r} is not listed")
    for source in record["sources"]:
        if source["status"] not in STATUSES:
            fail(f"source {source['id']}: status {source['status']!r} is not one of {sorted(STATUSES)}")
    for claim in record["claims"]:
        if sum(1 for option in claim["test"]["options"] if option["right"]) != 1:
            fail(f"claim {claim['id']}: its test should have exactly one supported answer")


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


def build_coast(land_path: Path) -> dict:
    if not land_path.is_file():
        fail(f"expected the land outline at {land_path}: run npm install in the site folder")
    topo = json.loads(land_path.read_text(encoding="utf-8"))
    arcs = decode_arcs(topo)
    paths: list[str] = []
    for geometry in topo["objects"]["land"]["geometries"]:
        polygons = geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]
        for polygon in polygons:
            path = ring_path(polygon[0], arcs)
            if path:
                paths.append(path)
    if not paths:
        fail(f"no land from {land_path} falls inside the frame")
    height = (LAT1 - LAT0) * SCALE
    return {"width": WIDTH, "height": round(height, 1), "lon0": LON0, "lat1": LAT1, "x": round(COS * SCALE, 5), "y": round(SCALE, 5), "paths": paths}


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        for attempt in range(5):
            try:
                os.replace(temp, out)
                return
            except PermissionError as error:
                # On Windows a reader holding the file (the portable build) can block the swap for a moment.
                if attempt == 4:
                    fail(f"could not replace {out}: {error}")
                time.sleep(0.5)
    finally:
        Path(temp).unlink(missing_ok=True)


def build_data(root: Path, raw: bytes, record: dict) -> tuple[str, str]:
    """Checks the record and returns the data's text and a summary. Writes nothing."""
    bsb = root / "data/text/bsb"
    if not bsb.is_dir():
        fail(f"expected the Berean under {bsb}: it is not there")
    sources = {s["id"] for s in record["sources"]}
    check_counts(record)
    check_pairs(record, sources)
    check_stations(record, {p["id"] for p in record["pictures"]})
    check_rounds(record)
    check_article(record)
    check_split(record)
    check_crusade(record)
    check_markers(record)
    check_links(record)
    check_references(record, sources)
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    check_inline_quotes(record, {label: verse["text"] for label, verse in verses.items()})
    data = {"recordHash": hashlib.sha256(raw).hexdigest(), "verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "coast": build_coast(root / LAND)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    words = len(re.findall(r"[A-Za-z]+", " ".join(plain(t) for _p, key, t in walk(record) if key in COUNTED_FIELDS)))
    return text + "\n", f"{size} bytes: {len(verses)} verses; {len(data['coast']['paths'])} land outlines; {len(record['checkNotes'])} check notes; about {words:,} words of reading text"


def build(site: Path, output: Path) -> tuple[Path, str, str]:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    raw = (root / RECORD).read_bytes()
    return (out, *build_data(root, raw, json.loads(raw)))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--check", action="store_true", help="rebuild in memory and compare with the file; write nothing")
    args = parser.parse_args()
    try:
        out, text, summary = build(args.site, args.output)
        if args.check:
            current = out.read_bytes() if out.is_file() else b""
            if current != text.encode("utf-8"):
                print(f"build-medieval-study: {out} is stale: run python scripts/build-medieval-study.py", file=sys.stderr)
                sys.exit(1)
            print(f"up to date: {out} ({summary})")
            return
        write_atomic(out, text)
        print(f"wrote {out} ({summary})")
    except (Refused, KeyError, TypeError, ValueError) as error:
        detail = f"the record is missing {error}" if isinstance(error, KeyError) else str(error)
        print(f"build-medieval-study: refused, nothing written: {detail}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
