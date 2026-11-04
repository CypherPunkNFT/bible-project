#!/usr/bin/env python3
"""Build src/pages/study/medieval/medieval-data.json for /study/the-medieval-church.

Reads the research record, takes each listed verse from the site's Berean copy (data/text/bsb) and asserts that it holds the
stated phrase. Checks that every source, picture and verse the record names exists, that every range runs forward, that each
test has one supported answer, and that nothing is said to be written before it began. Cuts the Natural Earth land (from the
world-atlas package) to the mission map's frame and simplifies it. That proves the references and the shape of the record; it
does not prove any reading. A failure stops the build and writes nothing.

Usage: python scripts/build-medieval-study.py --site <Website folder>
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


def fail(message: str) -> NoReturn:
    sys.exit(f"build-medieval-study: {message}")


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


def verse_labels_used(record: dict) -> set[str]:
    used = {record["missionStand"]["verse"], *record["powersStand"]["verses"]}
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
    cited = [*record["pairs"], *record["stations"], *record["rounds"], *record["claims"], *record["parish"]["stations"]]
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
            stream.write(text + "\n")
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def build(site: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    raw = (root / RECORD).read_bytes()
    record = json.loads(raw)
    bsb = root / "data/text/bsb"
    if not bsb.is_dir():
        fail(f"expected the Berean under {bsb}: it is not there")
    sources = {s["id"] for s in record["sources"]}
    check_counts(record)
    check_pairs(record, sources)
    check_stations(record, {p["id"] for p in record["pictures"]})
    check_rounds(record)
    check_article(record)
    check_references(record, sources)
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    data = {"recordHash": hashlib.sha256(raw).hexdigest(), "verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "coast": build_coast(root / LAND)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({size} bytes): {len(verses)} verses; {len(data['coast']['paths'])} land outlines")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.output)


if __name__ == "__main__":
    main()
