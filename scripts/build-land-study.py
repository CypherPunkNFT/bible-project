#!/usr/bin/env python3
"""Build src/pages/study/land/land-data.json for /study/the-land-of-the-bible.

Reads the research record, takes every verse it names (in any `verses` list) from the site's Berean copy (data/text/bsb), and
refuses the build if a reference does not exist, a book name is not one the catalogue knows, or a quotation the page shows
is not word for word the Berean at its reference. It checks the record's shape (eight points running west to east, the
counts the page draws, one supported answer per test, two placements per disputed site, every cited source listed), works
out the page's figures from the record's own numbers, and checks every rainfall figure against the record's words. It cuts
the small map of section 06 from the Natural Earth coast (world-atlas) and the site's places data (OpenBible.info), with
fixed sites only: a proposed site is never given coordinates. Every link must be one of the site's own routes.

That proves the references, the quotations and the arithmetic; it does not prove any reading of the ground. A failure stops
the build and writes nothing.

Usage: python scripts/build-land-study.py [--site <Website folder>] [--check] [--selftest]
"""
import argparse
import copy
import hashlib
import json
import math
import os
import re
import sys
import tempfile
import unicodedata
from pathlib import Path

RECORD = Path("content/academic-research/40-the-land-of-the-bible.json")
OUTPUT = Path("src/pages/study/land/land-data.json")
CATALOG = Path("data/catalog.json")
PLACES = Path("data/places.json")
COAST = Path("node_modules/world-atlas/land-10m.json")
APP = Path("src/App.tsx")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
LABEL = re.compile(r"^(.+) (\d{1,3}):(\d{1,3})$")
MARKER = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
BANDS = ("coast", "shephelah", "hills", "rift", "east")
COUNTS = {"transect.points": 8, "regions": 8, "roads.items": 4, "water.items": 4, "battles.items": 6, "climate.rains": 3, "claims": 4}
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
BUDGET_BYTES = 60_000

# The quotations the page itself shows, each checked word for word against the Berean (only quote marks and spaces evened).
# "way" marks the verses section 02 sets under "up" or "down"; the phrase must hold that word.
PHRASES = {
    "Luke 2:4": ("Joseph also went up from Nazareth in Galilee to Judea", "up"),
    "Luke 2:42": ("they went up according to the custom of the Feast", "up"),
    "Mark 10:32": ("they were going up the road to Jerusalem", "up"),
    "2 Chronicles 2:16": ("Then you can take them up to Jerusalem.", "up"),
    "Joshua 7:2": ("Go up and spy out the land.", "up"),
    "Numbers 13:17": ("Go up through the Negev and into the hill country.", "up"),
    "Deuteronomy 34:1": ("Moses went up from the plains of Moab to Mount Nebo", "up"),
    "Luke 10:30": ("A man was going down from Jerusalem to Jericho", "down"),
    "Jonah 1:3": ("He went down to Joppa", "down"),
    "1 Kings 1:33": ("take him down to Gihon", "down"),
    "Genesis 12:10": ("Abram went down to Egypt", "down"),
    "Genesis 37:25": ("on their way down to Egypt", "down"),
    "Deuteronomy 11:10": ("where you sowed your seed and irrigated on foot, like a vegetable garden", ""),
    "Deuteronomy 11:11": ("a land of mountains and valleys that drinks in the rain from heaven", ""),
    "Deuteronomy 11:14": ("the autumn and spring rains", ""),
    "1 Kings 18:44": ("There is a cloud as small as a man's hand rising from the sea.", ""),
    "Luke 12:54": ("As soon as you see a cloud rising in the west", ""),
}

# The site's own pages the record names by title. A title with no settled route is left out and shown without a link.
LINKS = {
    "The Old maps collection": "/study/atlas/old-maps",
    "Home and household in Old Testament Israel (27)": "/study/home-and-household",
    "The farming year (29)": "/study/the-farming-year",
}
ATLAS_IDS = {"/study/atlas/old-maps": ("src/pages/places/old-maps.tsx", 'id: "old-maps"')}

# The rainfall figures the page prints, each of which must stand in the record's words as written here.
RAIN = [("galilee", "Upper Galilee", 800, "Upper Galilee about 800", "about 800 or more"), ("ridge", "Jerusalem", 550, "Jerusalem about 550", "about 550"),
        ("beersheba", "Beersheba", 200, "Beersheba about 200", "about 200"), ("jericho", "Jericho", 150, "Jericho about 150", "about 150"),
        ("deadsea", "The Dead Sea shore", 100, "the Dead Sea shore under 100", "under 100")]

# Section 06: the map's frame, and its fixed sites by their id in data/places.json. Bethel is left out on purpose: where Ai
# lies is argued partly through where Bethel lies.
LON0, LON1, LAT0, LAT1 = 34.15, 36.25, 30.9, 33.4
MAP_WIDTH = 300.0
COS = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = MAP_WIDTH / ((LON1 - LON0) * COS)
FIXED = {"jerusalem": "a15257a", "joppa": "ae023a9", "jericho": "a231f80", "beersheba": "ad2f6c2", "hebron": "a85151a", "shechem": "adf74d4",
         "megiddo": "a8554e3", "lachish": "a3cc590", "capernaum": "af2161c", "dan": "a513646"}
LAKES = {"galilee": ("a562fcc", 0.055, 0.1), "deadsea": ("abed304", 0.075, 0.33)}
NEBO = "aefaa2d"
# Proposed sites: placed only from the record's words, as offsets in kilometres from a fixed point or a lake's end.
RINGS = [
    ("ai", "et-Tell", "jerusalem", 2.5, 16.0), ("ai", "Khirbet el-Maqatir", "jerusalem", -4.5, 16.5),
    ("sodom", "A site at the south-east end of the Dead Sea, such as Bab edh-Dhra", "deadsea:south", 9.0, 0.0),
    ("sodom", "Tall el-Hammam, north-east of the Dead Sea", "deadsea:north", 9.0, 8.0),
]
LABELS = [("Coast", 34.66, 31.55), ("Shephelah", 34.93, 31.8), ("Hill country", 35.2, 32.42), ("Rift", 35.53, 32.0), ("East of the Jordan", 35.93, 32.15),
          ("Negev", 34.86, 31.0), ("Galilee", 35.3, 33.0), ("Jezreel", 35.18, 32.68)]


class BuildError(Exception):
    pass


def fail(message: str):
    raise BuildError(message)


def plain(text: str) -> str:
    return MARKER.sub("", text)


def even(text: str) -> str:
    """Quote marks and spaces evened, nothing else: case and words must match."""
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"')):
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text).strip()


def folded(text: str) -> str:
    text = unicodedata.normalize("NFKD", plain(text)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\b(tall|tell|tel|khirbet|kh)\b|[^a-z]", "", text)


def get(record: dict, dotted: str):
    value = record
    for part in dotted.split("."):
        value = value[part]
    return value


def verse_lists(node, found: list[str]) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "verses" and isinstance(value, list) and all(isinstance(v, str) for v in value):
                found.extend(value)
            else:
                verse_lists(value, found)
    elif isinstance(node, list):
        for item in node:
            verse_lists(item, found)


def run_text(run) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) and run and isinstance(run[0], str) else ""


def load_book(bsb: Path, code: str, cache: dict) -> dict:
    if code not in cache:
        if not BOOK_CODE.match(code):
            fail(f"book code {code!r} is not three capitals or digits")
        chapters: dict = {}
        for path in sorted((bsb / code).glob("*.json")):
            for found in json.loads(path.read_text(encoding="utf-8")).values():
                chapters[int(found["c"])] = {item["n"]: re.sub(r"\s+", " ", "".join(run_text(r) for r in item["r"])).strip() for item in found["v"]}
        if not chapters:
            fail(f"the Berean has no book {code}")
        cache[code] = chapters
    return cache[code]


def read_verses(record: dict, site: Path) -> dict:
    books = {b["name"]: b["code"] for b in json.loads((site / CATALOG).read_text(encoding="utf-8"))["books"]}
    books["Psalm"] = books.get("Psalms", "PSA")
    labels: list[str] = []
    verse_lists(record, labels)
    listed = {v["label"]: v for v in record["verses"]}
    labels.extend(listed)
    cache: dict = {}
    verses = {}
    for label in sorted(set(labels)):
        match = LABEL.match(label)
        if not match:
            fail(f"{label!r} is not a reference of the form 'Book 1:2'")
        name, chapter, verse = match[1], int(match[2]), int(match[3])
        if name not in books:
            fail(f"{label}: the catalogue has no book named {name!r}")
        code = books[name]
        entry = listed.get(label)
        if entry and (entry["code"] != code or entry["chapter"] != chapter or entry["verse"] != verse):
            fail(f"{label}: the record lists it as {entry['code']} {entry['chapter']}:{entry['verse']}, the catalogue reads {code} {chapter}:{verse}")
        text = load_book(site / "data/text/bsb", code, cache).get(chapter, {}).get(str(verse))
        if not text:
            fail(f"the Berean has no {label} ({code} {chapter}:{verse})")
        if entry and entry.get("phrase") and even(plain(entry["phrase"])) not in even(text):
            fail(f"{label}: the record's phrase {entry['phrase']!r} is not in the Berean, which has: {text}")
        verses[label] = {"code": code, "chapter": chapter, "verse": verse, "text": text}
    return verses


def check_phrases(verses: dict, phrases: dict) -> dict:
    out = {}
    for label, (phrase, way) in phrases.items():
        if label not in verses:
            fail(f"{label}: quoted by the page but not named in the record")
        if even(plain(phrase)) not in even(verses[label]["text"]):
            fail(f"{label}: expected the words {phrase!r}, the Berean has: {verses[label]['text']}")
        if way and not re.search(rf"\b{way}\b", phrase):
            fail(f"{label}: set under {way!r}, but the quotation does not say {way!r}")
        out[label] = {"phrase": even(phrase), "way": way}
    return out


def check_shape(record: dict) -> None:
    for name, expected in COUNTS.items():
        if len(get(record, name)) != expected:
            fail(f"expected {expected} {name}, the record has {len(get(record, name))}")
    points = record["transect"]["points"]
    kms = [p["km"] for p in points]
    if any(b <= a for a, b in zip(kms, kms[1:])):
        fail(f"the transect's points must run west to east, their kilometres run {kms}")
    for point in points:
        if point["band"] not in BANDS or not isinstance(point["elevation"], (int, float)):
            fail(f"transect point {point['id']}: band {point['band']!r} or elevation {point['elevation']!r} is not usable")
    for rain in record["climate"]["rains"]:
        words = [w for w in re.findall(r"[a-z]+", rain["months"].lower()) if w != "to"]
        if len(words) != 2 or any(w not in MONTHS for w in words):
            fail(f"rain {rain['id']}: months {rain['months']!r} is not 'Month to Month'")
    for site in record["disputedSites"]["items"]:
        if len(site["placements"]) < 2:
            fail(f"disputed site {site['id']}: the page shows both placements, the record has {len(site['placements'])}")
    for claim in record["claims"]:
        if sum(1 for option in claim["test"]["options"] if option["right"]) != 1:
            fail(f"claim {claim['id']}: its test should have exactly one supported answer")
    sources = {s["id"] for s in record["sources"]}
    for group in ("regions", "claims", "roads.items", "water.items", "faith.items"):
        for item in get(record, group):
            for source in item.get("sources", []):
                if source not in sources:
                    fail(f"{group} {item['id']}: source {source!r} is not listed")
    for name in ("climate.sources",):
        for source in get(record, name):
            if source not in sources:
                fail(f"{name}: source {source!r} is not listed")
    notes = {n["id"] for n in record["checkNotes"]}
    used = set(re.findall(r"\{\{check:(c\d+)\}\}", json.dumps(record, ensure_ascii=False)))
    if used - notes:
        fail(f"check marks with no note: {sorted(used - notes)}")


def site_routes(site: Path) -> set[str]:
    return set(re.findall(r'path="(/[^"]*)"', (site / APP).read_text(encoding="utf-8")))


def check_link(path: str, routes: set[str], site: Path) -> None:
    if not path.startswith("/") or any(bad in path for bad in ("//", "\\", ":", "..", "%")):
        fail(f"link {path!r} leaves the site or is not a plain site path")
    if path in ATLAS_IDS:
        file, needle = ATLAS_IDS[path]
        if needle not in (site / file).read_text(encoding="utf-8"):
            fail(f"link {path!r}: the atlas destination is not in {file}")
    elif path not in routes:
        fail(f"link {path!r} is not one of the site's routes in {APP}")


def build_links(record: dict, site: Path, links: dict) -> dict:
    routes = site_routes(site)
    titles = {l["title"] for l in record["links"]}
    for group in ("regions", "roads.items", "water.items", "battles.items", "trade.items", "faith.items", "disputedSites.items"):
        titles |= {item["link"] for item in get(record, group) if item.get("link")}
    out = {}
    for title, path in links.items():
        if title not in titles:
            fail(f"link title {title!r} is not one the record uses")
        check_link(path, routes, site)
        out[title] = path
    return out


def figures(record: dict) -> dict:
    point = {p["id"]: p for p in record["transect"]["points"]}
    for needed in ("sea", "ridge", "jericho", "deadsea", "plateau"):
        if needed not in point:
            fail(f"the transect has no point {needed!r}")
    drop = point["ridge"]["elevation"] - point["deadsea"]["elevation"]
    drop_km = point["deadsea"]["km"] - point["ridge"]["km"]
    if not 1100 <= drop <= 1300 or drop_km >= 40:
        fail(f"the figure 'about 1,200 metres in under 40 kilometres' does not follow from the record: {drop} m in {drop_km} km")
    gradient = plain(record["climate"]["gradient"]["evidence"])
    rain = []
    for key, place, value, words, shown in RAIN:
        if words not in gradient:
            fail(f"rainfall for {place}: expected the record to say {words!r}; it says: {gradient}")
        rain.append({"id": key, "place": place, "mm": value, "words": shown})
    ratio = RAIN[0][2] / RAIN[2][2]
    return {
        "drop": {"metres": round(drop, -2), "km": drop_km, "exact": drop},
        "climb": {"metres": point["ridge"]["elevation"] - point["jericho"]["elevation"], "km": point["jericho"]["km"] - point["ridge"]["km"]},
        "rise": point["ridge"]["elevation"] - point["sea"]["elevation"],
        "rain": rain, "rainRatio": round(ratio),
        "regions": len(record["regions"]), "battles": len(record["battles"]["items"]),
    }


def project(lon: float, lat: float) -> tuple[float, float]:
    return round((lon - LON0) * COS * SCALE, 1), round((LAT1 - lat) * SCALE, 1)


def coast_paths(site: Path) -> tuple[str, str]:
    path = site / COAST
    if not path.is_file():
        fail(f"expected the coast outline at {path}: run npm install in the site folder")
    topo = json.loads(path.read_text(encoding="utf-8"))
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    best: list[tuple[float, float]] = []
    for arc in topo["arcs"]:
        x = y = 0
        run: list[tuple[float, float]] = []
        for dx, dy in arc:
            x += dx
            y += dy
            lon, lat = x * sx + tx, y * sy + ty
            if LON0 - .05 <= lon <= LON1 and LAT0 - .05 <= lat <= LAT1 + .05:
                run.append((lon, lat))
            elif run:
                best = max(best, run, key=len)
                run = []
        best = max(best, run, key=len)
    if len(best) < 20:
        fail(f"no usable coast from {path} falls inside the map's frame")
    if best[0][1] > best[-1][1]:
        best.reverse()  # south to north
    kept: list[tuple[float, float]] = []
    for lon, lat in best:
        x, y = project(lon, lat)
        if not kept or abs(x - kept[-1][0]) + abs(y - kept[-1][1]) > 1.6:
            kept.append((x, y))
    width, height = project(LON1, LAT0)
    # The coast runs south to north, from the frame's west edge to its top; the land is closed round the frame's east side.
    coast = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in kept)
    land = coast + f"L{width:.1f} {min(kept[-1][1], 0):.1f}L{width:.1f} {height:.1f}L{kept[0][0]:.1f} {height:.1f}Z"
    return land, coast


def build_map(record: dict, site: Path, fixed: dict, rings: list) -> dict:
    places = {p["id"]: p for p in json.loads((site / PLACES).read_text(encoding="utf-8"))}
    proposed = set()
    for item in record["disputedSites"]["items"]:
        proposed.add(folded(item["name"]))
        for placement in item["placements"]:
            where = plain(placement["site"])
            proposed.add(folded(where.split(",")[0]))
            if " such as " in where:
                proposed.add(folded(where.split(" such as ")[1]))
    width, height = project(LON1, LAT0)
    points = {}
    for key, place_id in fixed.items():
        place = places.get(place_id)
        if not place:
            fail(f"map point {key}: data/places.json has no place {place_id}")
        if folded(place["name"]) in proposed or folded(key) in proposed:
            fail(f"map point {key} ({place['name']}) is a proposed site: proposed sites are drawn as rings, never as points")
        x, y = project(place["lon"], place["lat"])
        if not (0 <= x <= width and 0 <= y <= height):
            fail(f"map point {key} falls outside the map at {x}, {y}")
        points[key] = {"name": place["name"], "x": x, "y": y}
    lakes = {}
    for key, (place_id, rx, ry) in LAKES.items():
        place = places.get(place_id)
        if not place:
            fail(f"lake {key}: data/places.json has no place {place_id}")
        x, y = project(place["lon"], place["lat"])
        lakes[key] = {"x": x, "y": y, "rx": round(rx * COS * SCALE, 1), "ry": round(ry * SCALE, 1)}
    km = SCALE / 111.0
    anchors = {**{k: (v["x"], v["y"]) for k, v in points.items()},
               "deadsea:south": (lakes["deadsea"]["x"], lakes["deadsea"]["y"] + lakes["deadsea"]["ry"]),
               "deadsea:north": (lakes["deadsea"]["x"], lakes["deadsea"]["y"] - lakes["deadsea"]["ry"])}
    placed = []
    for site_id, name, anchor, east, north in rings:
        if site_id not in {i["id"] for i in record["disputedSites"]["items"]}:
            fail(f"ring {name!r}: {site_id!r} is not a disputed site in the record")
        ax, ay = anchors[anchor]
        placed.append({"site": site_id, "name": name, "x": round(ax + east * km, 1), "y": round(ay - north * km, 1)})
    nebo = places.get(NEBO)
    if not nebo:
        fail(f"the slice's east end: data/places.json has no place {NEBO}")
    line = [project(places[FIXED["joppa"]]["lon"], places[FIXED["joppa"]]["lat"]), (points["jerusalem"]["x"], points["jerusalem"]["y"]), project(nebo["lon"], nebo["lat"])]
    labels = [{"name": n, "x": project(lon, lat)[0], "y": project(lon, lat)[1]} for n, lon, lat in LABELS]
    land, coast = coast_paths(site)
    return {"width": width, "height": height, "land": land, "coast": coast, "points": points, "lakes": lakes, "rings": placed, "slice": line, "labels": labels,
            "kmPx": round(km, 3)}


def assemble(site: Path, raw: bytes, phrases=PHRASES, links=LINKS, fixed=FIXED, rings=RINGS) -> str:
    record = json.loads(raw)
    check_shape(record)
    verses = read_verses(record, site)
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "verses": verses,
        "phrases": check_phrases(verses, phrases),
        "links": build_links(record, site, links),
        "figures": figures(record),
        "map": build_map(record, site, fixed, rings),
    }
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
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


def selftest(site: Path, raw: bytes) -> None:
    """Wrong inputs, each built in memory and each expected to be refused. Nothing is written."""
    record = json.loads(raw)

    def with_record(change):
        changed = copy.deepcopy(record)
        change(changed)
        return json.dumps(changed).encode("utf-8")

    cases = [
        ("a quotation one word off the Berean", lambda: assemble(site, raw, phrases={**PHRASES, "Luke 10:30": ("A man was going up from Jerusalem to Jericho", "up")})),
        ("a quotation with a changed capital", lambda: assemble(site, raw, phrases={**PHRASES, "Deuteronomy 11:11": ("a land of mountains and valleys that drinks in the rain from Heaven", "")})),
        ("a verse that does not exist (Jonah 1:99)", lambda: assemble(site, with_record(lambda r: r["regions"][0]["verses"].append("Jonah 1:99")))),
        ("a chapter that does not exist (Joshua 99:1)", lambda: assemble(site, with_record(lambda r: r["battles"]["items"][0]["verses"].append("Joshua 99:1")))),
        ("a book the catalogue does not know (Hezekiah 1:1)", lambda: assemble(site, with_record(lambda r: r["water"]["items"][0]["verses"].append("Hezekiah 1:1")))),
        ("a record phrase that is not the Berean", lambda: assemble(site, with_record(lambda r: r["verses"][0].update(phrase="irrigated by foot")))),
        ("a link that leaves the site", lambda: assemble(site, raw, links={**LINKS, "The farming year (29)": "https://example.com/farming"})),
        ("a link to a route the site does not have", lambda: assemble(site, raw, links={**LINKS, "The farming year (29)": "/study/no-such-study"})),
        ("a protocol-relative link", lambda: assemble(site, raw, links={**LINKS, "The farming year (29)": "//example.com/x"})),
        ("a proposed site drawn as a point (Sodom)", lambda: assemble(site, raw, fixed={**FIXED, "sodom": "a0aa664"})),
        ("a proposed site drawn as a point (Ai at et-Tell)", lambda: assemble(site, raw, fixed={**FIXED, "ai": "a7e13e1"})),
        ("transect points out of order", lambda: assemble(site, with_record(lambda r: r["transect"]["points"][2].update(km=5)))),
        ("a test with two supported answers", lambda: assemble(site, with_record(lambda r: r["claims"][0]["test"]["options"][0].update(right=True)))),
        ("a rainfall figure the record does not hold", lambda: assemble(site, with_record(lambda r: r["climate"]["gradient"].update(evidence=r["climate"]["gradient"]["evidence"].replace("about 550", "about 600"))))),
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
    print(f"the real record still builds; {len(cases) - failures} of {len(cases)} wrong inputs refused")
    if failures:
        raise BuildError(f"{failures} wrong inputs were not refused")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--check", action="store_true", help="fail if the data on disk is not what this build would write; writes nothing")
    parser.add_argument("--selftest", action="store_true", help="try wrong inputs in memory and confirm each is refused; writes nothing")
    args = parser.parse_args()
    site = args.site.resolve()
    out = (site / OUTPUT).resolve()
    if not out.is_relative_to(site):
        sys.exit(f"build-land-study: output {out} is outside the site folder {site}")
    try:
        raw = (site / RECORD).read_bytes()
        if args.selftest:
            selftest(site, raw)
            return
        text = assemble(site, raw)
        if args.check:
            current = out.read_bytes() if out.is_file() else b""
            if current != text.encode("utf-8"):
                raise BuildError(f"{out} is stale or missing: run python scripts/build-land-study.py")
            print(f"{out} is up to date")
            return
        write_atomic(out, text)
        data = json.loads(text)
        print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses, {len(data['phrases'])} quotations, "
              f"{len(data['links'])} links, {len(data['map']['points'])} fixed points, {len(data['map']['rings'])} rings")
    except BuildError as error:
        sys.exit(f"build-land-study: {error}")


if __name__ == "__main__":
    main()
