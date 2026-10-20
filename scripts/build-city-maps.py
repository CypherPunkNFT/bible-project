"""Builds the city data the Help for life page (/resources/life) reads, from US Census Bureau files (public domain), for each city in CITIES:

  src/data/resources/<code>-map.json    the zoomable county map: SVG path strings per layer (land, water, roads), labels, and the
                                        projection that places each help centre from its latitude/longitude. Loaded lazily by the
                                        page, so it never touches the main bundle.
  src/data/resources/<code>-facts.json  the sourced facts beside the USA map (county, population, land area), each with the URL
                                        of the file it was read from and the date it was checked.

Every input is checked against the sha256 in scripts/city-map-inputs.json (and in SOURCES.md, "US Census Bureau TIGER/Line and
population estimates"); a file with a different checksum stops the build. A file not yet in that table is refused unless --record
is given, which adds it with the checksum of what was just downloaded (read the table's diff before keeping it).

  py -3.13 -I scripts/build-city-maps.py --downloads <folder> --libs <folder holding pyshp and shapely> [--city jax|mia|tpa|orl] [--fetch] [--record]

--fetch downloads any missing input into --downloads first. Paths are written in relative SVG commands on a 0.1 (or 1) map-unit
grid, which keeps the file compact. Jacksonville's output is the same drawing the page has always had.
"""
import argparse
import csv
import hashlib
import json
import math
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
OUT_DIR = SITE / "src/data/resources"
LOCK = Path(__file__).resolve().parent / "city-map-inputs.json"
CHECKED = "2026-10-20"  # the day the newest files were downloaded and read
LICENCE = "US Government work, public domain"
TIGER = "https://www2.census.gov/geo/tiger"
POPEST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025"
WIDTH = 1000.0
PAD = 0.035  # degrees of margin around the focus box
ASPECT = 0.9  # width / height: land is added above and below until the map is this tall (owner, 2026-10-08)

# code: the file prefix; county: the county the map is about (its line is drawn, its roads are the street texture);
# focus: (west, south, east, north) of what the map frames, or None for the whole county; water: counties whose area water is
# drawn (the focus box must sit inside them or the sea of the map has holes); place: the city's own row in the population file.
CITIES = {
    "jax": {"id": "jacksonville-fl", "name": "Jacksonville", "county": "12031", "focus": (-82.06, 30.09, -81.36, 30.67), "water": ["12031", "12089", "12003", "12019", "12109", "12007"],
            "roads": ["12031", "12019", "12089"], "place": ("35000", "Jacksonville city"), "skip_label": "Jacksonville", "state": "12", "stateName": "Florida", "states": ["12", "13"]},
    "mia": {"id": "miami-fl", "name": "Miami", "county": "12086", "focus": (-80.58, 25.43, -80.08, 25.96), "water": ["12086", "12011", "12087"],
            "roads": ["12086"], "place": ("45000", "Miami city"), "skip_label": None, "state": "12", "stateName": "Florida"},
    "tpa": {"id": "tampa-fl", "name": "Tampa", "county": "12057", "focus": (-82.67, 27.7, -82.07, 28.17), "water": ["12057", "12103", "12101", "12081", "12105", "12049"],
            "roads": ["12057", "12103"], "place": ("71000", "Tampa city"), "skip_label": None, "state": "12", "stateName": "Florida"},
    "orl": {"id": "orlando-fl", "name": "Orlando", "county": "12095", "focus": (-81.6, 28.28, -81.17, 28.71), "water": ["12095", "12117", "12097", "12069", "12105"],
            "roads": ["12095", "12097", "12117"], "place": ("53000", "Orlando city"), "skip_label": None, "state": "12", "stateName": "Florida"},
    "atl": {"id": "atlanta-ga", "name": "Atlanta", "county": "13121", "focus": (-84.64, 33.51, -84.04, 34.07), "water": ["13067", "13151", "13121", "13063", "13247", "13089", "13097", "13057", "13117", "13135", "13113", "13217", "13077", "13015"],
            "roads": ["13067", "13089", "13121", "13135", "13063"], "place": ("04000", "Atlanta city"), "skip_label": None, "state": "13", "stateName": "Georgia"},
    "chs": {"id": "charleston-sc", "name": "Charleston", "county": "45019", "focus": (-80.17, 32.67, -79.72, 33.0), "water": ["45019", "45035", "45015"],
            "roads": ["45019", "45015", "45035"], "place": ("13330", "Charleston city"), "skip_label": None, "state": "45", "stateName": "South Carolina"},
    "clt": {"id": "charlotte-nc", "name": "Charlotte", "county": "37119", "focus": (-81.06, 35.02, -80.53, 35.62), "water": ["37119", "45091", "45057", "37159", "37025", "37179", "37035", "37097", "37109", "37071", "37167"],
            "roads": ["37119", "37097", "37179"], "place": ("12000", "Charlotte city"), "skip_label": None, "state": "37", "stateName": "North Carolina", "states": ["37", "45"]},
    "bna": {"id": "nashville-tn", "name": "Nashville", "county": "47037", "focus": (-87.0, 35.98, -86.45, 36.32), "water": ["47147", "47149", "47165", "47189", "47021", "47187", "47037"],
            "roads": ["47037"], "place": ("52006", "Nashville-Davidson"), "skip_label": None, "state": "47", "stateName": "Tennessee"},
    "mem": {"id": "memphis-tn", "name": "Memphis", "county": "47157", "focus": (-90.2, 34.98, -89.75, 35.25), "water": ["28093", "28033", "47157", "05035"],
            "roads": ["47157"], "place": ("48000", "Memphis city"), "skip_label": None, "state": "47", "stateName": "Tennessee", "states": ["47", "05", "28"]},
    "bhm": {"id": "birmingham-al", "name": "Birmingham", "county": "01073", "focus": (-87.03, 33.33, -86.54, 33.66), "water": ["01115", "01073", "01117", "01127"],
            "roads": ["01073"], "place": ("07000", "Birmingham city"), "skip_label": None, "state": "01", "stateName": "Alabama"},
    "sdf": {"id": "louisville-ky", "name": "Louisville", "county": "21111", "focus": (-85.95, 38.1, -85.45, 38.33), "water": ["18061", "21029", "21111", "21211", "18043", "21215", "21185", "18019"],
            "roads": ["21111"], "place": ("48006", "Louisville/Jefferson County"), "skip_label": None, "state": "21", "stateName": "Kentucky", "states": ["21", "18"]},
    "dal": {"id": "dallas-tx", "name": "Dallas", "county": "48113", "focus": (-97.06, 32.55, -96.51, 33.05), "water": ["48257", "48121", "48397", "48139", "48439", "48085", "48113", "48251"],
            "roads": ["48113"], "place": ("19000", "Dallas city"), "skip_label": None, "state": "48", "stateName": "Texas"},
    "hou": {"id": "houston-tx", "name": "Houston", "county": "48201", "focus": (-95.76, 29.52, -95.11, 30.15), "water": ["48039", "48201", "48157", "48167", "48339", "48291"],
            "roads": ["48201", "48157"], "place": ("35000", "Houston city"), "skip_label": None, "state": "48", "stateName": "Texas"},
    "okc": {"id": "oklahoma-city-ok", "name": "Oklahoma City", "county": "40109", "focus": (-97.78, 35.29, -97.32, 35.73), "water": ["40027", "40087", "40083", "40109", "40017", "40051", "40073"],
            "roads": ["40027", "40109", "40017"], "place": ("55000", "Oklahoma City city"), "skip_label": None, "state": "40", "stateName": "Oklahoma"},
}
FIRST_DAY = {"cb_2025_us_county_500k.zip", "tl_2026_12_prisecroads.zip", "tl_2026_12_place.zip", "tl_2026_12031_roads.zip"} | {f"tl_2026_{c}_areawater.zip" for c in ("12031", "12089", "12003", "12019", "12109")}  # fetched for Jacksonville on 2026-10-08
COUNTY_ZIP, COUNTY_CSV = "cb_2025_us_county_500k.zip", "co-est2025-alldata.csv"
INPUT_URLS = {
    COUNTY_ZIP: f"{TIGER}/GENZ2025/shp/{COUNTY_ZIP}",
    COUNTY_CSV: f"{POPEST}/counties/totals/{COUNTY_CSV}",
}


def states_of(cfg: dict) -> list:
    """The states whose counties, towns and main roads the map draws: the city's own, plus any the frame reaches into."""
    return cfg.get("states") or [cfg["state"]]


def inputs_for(cfg: dict) -> dict:
    """Every file one city's build reads: name -> url."""
    out = dict(INPUT_URLS)
    out[f"sub-est2025_{int(cfg['state'])}.csv"] = f"{POPEST}/cities/totals/sub-est2025_{int(cfg['state'])}.csv"
    for st in states_of(cfg):
        out[f"tl_2026_{st}_prisecroads.zip"] = f"{TIGER}/TIGER2026/PRISECROADS/tl_2026_{st}_prisecroads.zip"
        out[f"tl_2026_{st}_place.zip"] = f"{TIGER}/TIGER2026/PLACE/tl_2026_{st}_place.zip"
    for code in cfg["roads"]:
        out[f"tl_2026_{code}_roads.zip"] = f"{TIGER}/TIGER2026/ROADS/tl_2026_{code}_roads.zip"
    for code in cfg["water"]:
        out[f"tl_2026_{code}_areawater.zip"] = f"{TIGER}/TIGER2026/AREAWATER/tl_2026_{code}_areawater.zip"
    return out


def describe(name: str) -> str:
    if name.startswith("cb_2025"):
        return "Cartographic Boundary File 2025, counties 1:500,000 (shoreline-clipped)"
    if name.startswith("co-est"):
        return "Vintage 2025 county population estimates"
    if name.startswith("sub-est"):
        return f"Vintage 2025 city and town population estimates, state FIPS {name.split('_')[1][:-4]}"
    if name.endswith("prisecroads.zip"):
        return f"TIGER/Line 2026, primary and secondary roads, state FIPS {name.split('_')[2]}"
    if name.endswith("place.zip"):
        return f"TIGER/Line 2026, places, state FIPS {name.split('_')[2]} (town labels)"
    county = name.split("_")[2]
    return f"TIGER/Line 2026, {'all roads' if name.endswith('roads.zip') else 'area water'}, county FIPS {county}"


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--downloads", required=True, type=Path, help="folder holding the zips and CSVs the cities read")
    parser.add_argument("--libs", required=True, type=Path, help="folder holding pyshp (shapefile.py) and shapely")
    parser.add_argument("--city", choices=sorted(CITIES), action="append", help="build only this city (default: all)")
    parser.add_argument("--fetch", action="store_true", help="download any missing input first")
    parser.add_argument("--record", action="store_true", help="add inputs not yet in city-map-inputs.json, with their checksum")
    return parser.parse_args()


def check_inputs(folder: Path, cfg: dict, fetch: bool, record: bool) -> dict:
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    for name, url in inputs_for(cfg).items():
        path = folder / name
        if not path.exists():
            if not fetch:
                raise SystemExit(f"build-city-maps: missing {path}; download it from {url} (or pass --fetch)")
            print(f"build-city-maps: downloading {url}")
            urllib.request.urlretrieve(url, path)  # noqa: S310  (a fixed https census.gov address)
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if name not in lock:
            if not record:
                raise SystemExit(f"build-city-maps: {name} is not in city-map-inputs.json; check it, then run once with --record")
            lock[name] = {"url": url, "what": describe(name), "sha256": actual}
            print(f"build-city-maps: recorded {name} sha256 {actual}")
        elif lock[name]["sha256"] != actual:
            raise SystemExit(f"build-city-maps: {name} has sha256 {actual}, expected {lock[name]['sha256']}; update city-map-inputs.json and SOURCES.md for a new download")
    LOCK.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8", newline="\n")
    return lock


def find_row(path: Path, match) -> dict:
    with path.open(encoding="latin-1", newline="") as handle:
        for row in csv.DictReader(handle):
            if match(row):
                return row
    raise SystemExit(f"build-city-maps: no matching row in {path}")


class Pen:
    """Writes geometry as compact SVG path data: an absolute M per ring, then relative l steps on a fixed grid."""

    def __init__(self, xy):
        self.xy = xy

    @staticmethod
    def number(units: int, digits: int) -> str:
        if not digits:
            return str(units)
        sign, units = ("-" if units < 0 else ""), abs(units)
        whole, frac = divmod(units, 10 ** digits)
        frac_text = f"{frac:0{digits}d}".rstrip("0")
        if not frac_text:
            return f"{sign}{whole}"
        return f"{sign}{whole if whole else ''}.{frac_text}"

    def ring(self, coords, digits: int, closed: bool) -> str:
        scale = 10 ** digits
        points, last = [], None
        for lon, lat in coords:
            x, y = self.xy(lon, lat)
            point = (round(x * scale), round(y * scale))
            if point != last:
                points.append(point)
                last = point
        if len(points) < 2:
            return ""
        out = [f"M{self.number(points[0][0], digits)},{self.number(points[0][1], digits)}l"]
        for (x0, y0), (x1, y1) in zip(points, points[1:]):
            for value in (x1 - x0, y1 - y0):
                text = self.number(value, digits)
                out.append(text if text.startswith("-") or out[-1].endswith("l") else f" {text}")
        return "".join(out) + ("z" if closed else "")

    def path(self, geom, digits: int = 1, tolerance: float = 0.0, k: float = 1.0) -> str:
        if geom.is_empty:
            return ""
        if tolerance:
            geom = geom.simplify(tolerance / k, preserve_topology=True)
        kind = geom.geom_type
        parts = []
        for g in (list(geom.geoms) if kind.startswith("Multi") or kind == "GeometryCollection" else [geom]):
            if g.geom_type == "Polygon":
                parts.append(self.ring(g.exterior.coords, digits, True))
                parts.extend(self.ring(i.coords, digits, True) for i in g.interiors)
            elif g.geom_type == "LineString":
                parts.append(self.ring(g.coords, digits, False))
            elif g.geom_type in ("MultiPolygon", "MultiLineString", "GeometryCollection"):
                parts.append(self.path(g, digits))
        return "".join(p for p in parts if p)


def build(code: str, cfg: dict, tiger: Path, census: Path, lock: dict):
    import shapefile  # noqa: E402  (pyshp, from --libs)
    from shapely.geometry import box, shape  # noqa: E402
    from shapely.ops import unary_union  # noqa: E402

    def read(name, keep=lambda rec: True):
        path = tiger / name / f"{name}.shp"
        with shapefile.Reader(str(path), encoding="utf-8") as reader:
            fields = [f[0] for f in reader.fields[1:]]
            for sr in reader.iterShapeRecords():
                rec = dict(zip(fields, sr.record))
                if keep(rec):
                    yield rec, shape(sr.shape.__geo_interface__)

    counties = {r["GEOID"]: (r, g) for r, g in read("cb_2025_us_county_500k", lambda r: r["STATEFP"] in states_of(cfg))}
    home = cfg["county"]
    if home not in counties:
        raise SystemExit(f"build-city-maps: county {home} not found in cb_2025_us_county_500k")
    county_rec, county = counties[home]
    minx, miny, maxx, maxy = cfg["focus"] or county.bounds
    cos0 = math.cos(math.radians((miny + maxy) / 2))
    # The side margins stay PAD; the top and bottom margins grow until width / height = ASPECT.
    pad_y = max(PAD, (WIDTH / ASPECT / (WIDTH / ((maxx - minx + 2 * PAD) * cos0)) - (maxy - miny)) / 2)
    frame = box(minx - PAD, miny - pad_y, maxx + PAD, maxy + pad_y)
    k = WIDTH / ((frame.bounds[2] - frame.bounds[0]) * cos0)
    height = (frame.bounds[3] - frame.bounds[1]) * k
    west, north = frame.bounds[0], frame.bounds[3]

    def xy(lon, lat):
        return (lon - west) * cos0 * k, (north - lat) * k

    pen = Pen(xy)

    # Land: the county itself and the neighbouring counties, cut to the frame.
    neighbours = [g.intersection(frame) for gid, (r, g) in counties.items() if gid != home and g.intersects(frame)]
    land = {"county": pen.path(county, 1, 0.35, k), "around": pen.path(unary_union(neighbours), 1, 0.5, k)}

    # Water: every area-water polygon in the water counties, larger than a small pond.
    water_parts, water_part_names, river_names = [], [], {}
    min_area = (0.15 / k) ** 2 * 40  # about 40 square map units
    for fips in cfg["water"]:
        for rec, g in read(f"tl_2026_{fips}_areawater"):
            if not g.intersects(frame):
                continue
            g = g.intersection(frame)
            if g.area < min_area:
                continue
            water_parts.append(g)
            name = (rec.get("FULLNAME") or "").strip()
            water_part_names.append(name)
            if name:
                river_names[name] = river_names.get(name, 0) + g.area
    water = pen.path(unary_union(water_parts), 1, 0.7, k)

    # Roads: interstates (S1100) and other primary/secondary roads (S1200), plus the county's local streets as texture.
    primary, secondary, labels = [], [], {}
    for rec, g in (item for st in states_of(cfg) for item in read(f"tl_2026_{st}_prisecroads")):
        if not g.intersects(frame):
            continue
        g = g.intersection(frame)
        (primary if rec["MTFCC"] == "S1100" else secondary).append(g)
        name = (rec.get("FULLNAME") or "").strip()
        if rec["MTFCC"] == "S1100" and name.startswith("I-"):
            labels.setdefault(name, []).append(g)
    streets = [g.intersection(frame) for fips in cfg["roads"] for rec, g in read(f"tl_2026_{fips}_roads", lambda r: r["MTFCC"] in ("S1400", "S1730"))
               if g.intersects(frame) and g.length * k * cos0 >= 6]
    roads = {
        "primary": pen.path(unary_union(primary), 1, 0.5, k),
        "secondary": pen.path(unary_union(secondary), 0, 1.0, k),
        "streets": pen.path(unary_union(streets), 0, 0.9, k),
    }

    # One label per interstate, at the midpoint of its longest stretch inside the frame (and the county).
    road_labels = []
    for name, geoms in sorted(labels.items()):
        merged = unary_union(geoms).intersection(county)
        if merged.is_empty:
            continue
        longest = max(list(merged.geoms) if hasattr(merged, "geoms") else [merged], key=lambda p: p.length)
        mid = longest.interpolate(0.5, normalized=True)
        x, y = xy(mid.x, mid.y)
        road_labels.append({"name": name.replace("I- ", "I-"), "x": round(x, 1), "y": round(y, 1)})

    # Incorporated towns in the frame, labelled at a point on land (their legal limits run out to sea).
    all_land = unary_union([county, *neighbours])
    places = []
    for rec, g in (item for st in states_of(cfg) for item in read(f"tl_2026_{st}_place", lambda r: r["NAME"] != cfg["skip_label"] and r["CLASSFP"].startswith("C"))):
        on_land = g.intersection(all_land).intersection(frame)
        if on_land.is_empty or on_land.area < (3 / k) ** 2:
            continue
        centre = on_land.representative_point()
        x, y = xy(centre.x, centre.y)
        # A name centred this close to the frame's edge would be cut off (or sit under the kind chips at the top).
        if x < 60 or x > WIDTH - 60 or y < 60 or y > height - 15:
            continue
        places.append({"name": rec["NAME"], "x": round(x, 1), "y": round(y, 1), "county": bool(county.contains(centre))})

    # Labels for the largest named waters, at a point inside each one's biggest piece.
    water_labels = []
    for name in sorted(river_names, key=lambda n: -river_names[n])[:5]:
        named = [g for g, n in zip(water_parts, water_part_names) if n == name]
        biggest = max((pp for g in named for pp in (g.geoms if hasattr(g, "geoms") else [g])), key=lambda pp: pp.area)
        centre = biggest.representative_point()
        x, y = xy(centre.x, centre.y)
        water_labels.append({"name": name, "x": round(x, 1), "y": round(y, 1)})

    county_name = county_rec["NAME"] + " County"
    city_map = {
        "about": f"{county_name}, {cfg['stateName']}, drawn from US Census Bureau TIGER/Line 2026 and cartographic boundary 2025 files (public domain). Built by scripts/build-city-maps.py.",
        "city": cfg["id"],
        "width": round(WIDTH, 1), "height": round(height, 1),
        "projection": {"west": west, "north": north, "cos": cos0, "k": k},
        "land": land, "water": water, "roads": roads,
        "roadLabels": road_labels, "places": places, "waterLabels": water_labels,
        "sources": [{"file": name, "url": lock[name]["url"], "what": lock[name]["what"], "sha256": lock[name]["sha256"], "licence": LICENCE, "downloaded": "2026-10-08" if name in FIRST_DAY else CHECKED}
                    for name in inputs_for(cfg) if name.endswith(".zip")],
    }
    return city_map, facts(cfg, county_rec, census)


def facts(cfg: dict, county_rec: dict, census: Path) -> dict:
    fips = cfg["county"]
    county = find_row(census / "co-est2025-alldata.csv", lambda r: r["STATE"] == fips[:2] and r["COUNTY"] == fips[2:] and r["SUMLEV"] == "050")
    place_code, place_name = cfg["place"]
    place = find_row(census / f"sub-est2025_{int(cfg['state'])}.csv", lambda r: r["SUMLEV"] == "162" and r["PLACE"] == place_code)
    if not place["NAME"].startswith(place_name):
        raise SystemExit(f"build-city-maps: expected {place_name} at PLACE {place_code}, found {place['NAME']!r}")
    sq_mi = lambda m2: m2 / 2_589_988.110336  # noqa: E731
    shape_src, county_src, city_src = (inputs_for(cfg)[n] for n in (COUNTY_ZIP, COUNTY_CSV, f"sub-est2025_{int(cfg['state'])}.csv"))
    estimates = "US Census Bureau, Vintage 2025 population estimates"
    boundary = "US Census Bureau, cartographic boundary file 2025"
    rows = [
        {"id": "county", "label": "County", "value": county["CTYNAME"], "note": f"{cfg['stateName']} · FIPS {fips}", "source": shape_src, "by": f"{boundary} (GEOID {fips})"},
        {"id": "county-population", "label": f"{county['CTYNAME']} population", "value": int(county["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": county_src, "by": estimates},
        {"id": "city-population", "label": f"{cfg['name']} city population", "value": int(place["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": city_src, "by": estimates},
        {"id": "land-area", "label": "Land area", "value": round(sq_mi(int(county_rec["ALAND"])), 1), "unit": "sq mi", "note": f"plus {sq_mi(int(county_rec['AWATER'])):.1f} sq mi of water", "source": shape_src, "by": f"{boundary} (ALAND, AWATER)"},
    ]
    checked = "2026-10-08" if cfg["id"] == "jacksonville-fl" else CHECKED
    return {"city": cfg["id"], "checked": checked, "facts": [{**row, "checked": checked} for row in rows]}


def write(name: str, data: dict, compact: bool) -> int:
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    (OUT_DIR / name).write_text(text, encoding="utf-8", newline="\n")
    return len(text.encode("utf-8"))


def main() -> None:
    args = parse_args()
    sys.path.insert(0, str(args.libs.resolve()))
    args.downloads.mkdir(parents=True, exist_ok=True)
    for code in args.city or sorted(CITIES):
        cfg = CITIES[code]
        lock = check_inputs(args.downloads, cfg, args.fetch, args.record)
        with tempfile.TemporaryDirectory(prefix="city-tiger-") as temp:
            tiger = Path(temp)
            for name in inputs_for(cfg):
                if name.endswith(".zip"):
                    with zipfile.ZipFile(args.downloads / name) as archive:
                        archive.extractall(tiger / name.removesuffix(".zip"))
            city_map, city_facts = build(code, cfg, tiger, args.downloads, lock)
        size = write(f"{code}-map.json", city_map, compact=True)
        write(f"{code}-facts.json", city_facts, compact=False)
        layers = {key: len(value) for key, value in {**city_map["land"], "water": city_map["water"], **city_map["roads"]}.items()}
        print(f"build-city-maps: {code}-map.json {size:,} bytes, layers {layers}; {code}-facts.json {len(city_facts['facts'])} facts")


if __name__ == "__main__":
    main()
