"""Builds the Jacksonville data the Help for life page (/resources/life) reads, from US Census Bureau files (public domain):

  src/data/resources/jax-map.json    the zoomable Duval County map: SVG path strings per layer (land, water, roads),
                                     labels, and the projection that places each help centre from its latitude/longitude.
                                     Loaded lazily by the page, so it never touches the main bundle.
  src/data/resources/jax-facts.json  the sourced facts beside the USA map (county, population, land area), each with the
                                     URL of the file it was read from and the date it was checked.

Every input is checked against the sha256 recorded below (and in SOURCES.md, "US Census Bureau TIGER/Line and
population estimates"); a new download with a different checksum stops the build until this table is updated.

  py -3.13 -I scripts/build-jax-map.py --downloads <dir with the zips and CSVs> --libs <dir holding pyshp and shapely>

Paths are written in relative SVG commands on a 0.1 (or 1) map-unit grid, which keeps the file compact; the drawing is
the same as the design mock-up's (design/help-for-life-directions/build/build-jax-map.py).
"""
import argparse
import csv
import hashlib
import json
import math
import sys
import tempfile
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
OUT_DIR = SITE / "src/data/resources"
CHECKED = "2026-10-08"  # the day these files were downloaded and read
LICENCE = "US Government work, public domain"
TIGER = "https://www2.census.gov/geo/tiger"
POPEST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025"
INPUTS = {
    "cb_2025_us_county_500k.zip": (f"{TIGER}/GENZ2025/shp/cb_2025_us_county_500k.zip", "Cartographic Boundary File 2025, counties 1:500,000 (shoreline-clipped)", "aa976c00b181939755d0da757f4c7c2dc0103c3b3b4530fb2a91c2bb62fc777c"),
    "tl_2026_12_prisecroads.zip": (f"{TIGER}/TIGER2026/PRISECROADS/tl_2026_12_prisecroads.zip", "TIGER/Line 2026, primary and secondary roads, Florida", "05d6fbc00795555ce9b909a10a3f05d83067f449ffab6d5210a46b97319ab324"),
    "tl_2026_12031_roads.zip": (f"{TIGER}/TIGER2026/ROADS/tl_2026_12031_roads.zip", "TIGER/Line 2026, all roads, Duval County", "8d29fc4a6f40f7d6246aa351239325ac0e10c02cc858fb8e0f400e75cecb7577"),
    "tl_2026_12_place.zip": (f"{TIGER}/TIGER2026/PLACE/tl_2026_12_place.zip", "TIGER/Line 2026, places, Florida (town labels)", "38a86feeb17300f9991d5c89b5fb1d61c42823cc4bacb1f7f0738605a22ed8ec"),
    "tl_2026_12031_areawater.zip": (f"{TIGER}/TIGER2026/AREAWATER/tl_2026_12031_areawater.zip", "TIGER/Line 2026, area water, Duval County", "bbb7f8b5f0f8d52d1585e7b0fdf28064907bb64242f70123416d64aba2c5e8d3"),
    "tl_2026_12089_areawater.zip": (f"{TIGER}/TIGER2026/AREAWATER/tl_2026_12089_areawater.zip", "TIGER/Line 2026, area water, Nassau County", "9cd005ef5b1f581296d8301054d789a989b333845d73bd3d8c7b25bfe8a89ec7"),
    "tl_2026_12003_areawater.zip": (f"{TIGER}/TIGER2026/AREAWATER/tl_2026_12003_areawater.zip", "TIGER/Line 2026, area water, Baker County", "9be0c494112ae281a82c463df738050ebcbbfbf4afba19293914ff98bc876a95"),
    "tl_2026_12019_areawater.zip": (f"{TIGER}/TIGER2026/AREAWATER/tl_2026_12019_areawater.zip", "TIGER/Line 2026, area water, Clay County", "52bf3a5a92dfbaa75c2360d2caa7589977457625b43a79755340a31b4685fd94"),
    "tl_2026_12109_areawater.zip": (f"{TIGER}/TIGER2026/AREAWATER/tl_2026_12109_areawater.zip", "TIGER/Line 2026, area water, St. Johns County", "dfcfa9924dbc721a4dc0ce1eca8f533a5c00df41396855c3880f00dafec5d2b6"),
    "co-est2025-alldata.csv": (f"{POPEST}/counties/totals/co-est2025-alldata.csv", "Vintage 2025 county population estimates", "4f5a499d851e2cb48fd7a5405e5a9235453a8a66933657aacd10df0e264f35d5"),
    "sub-est2025_12.csv": (f"{POPEST}/cities/totals/sub-est2025_12.csv", "Vintage 2025 city and town population estimates, Florida", "7742b3514362d7b2a7c5301cb9e6e722eec40d8a76a817ba6e12ab073f21dab9"),
}
DUVAL = "12031"
NEIGHBOURS = ["12089", "12003", "12019", "12109"]  # Nassau, Baker, Clay, St. Johns
WIDTH = 1000.0
PAD = 0.035  # degrees of margin around the county


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--downloads", required=True, type=Path, help="folder holding the zips and CSVs listed in INPUTS")
    parser.add_argument("--libs", required=True, type=Path, help="folder holding pyshp (shapefile.py) and shapely")
    return parser.parse_args()


def check_inputs(folder: Path) -> None:
    for name, (url, _what, expected) in INPUTS.items():
        path = folder / name
        if not path.exists():
            raise SystemExit(f"build-jax-map: missing {path}; download it from {url}")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise SystemExit(f"build-jax-map: {name} has sha256 {actual}, expected {expected}; update INPUTS and SOURCES.md for a new download")


def find_row(path: Path, match) -> dict:
    with path.open(encoding="latin-1", newline="") as handle:
        for row in csv.DictReader(handle):
            if match(row):
                return row
    raise SystemExit(f"build-jax-map: no matching row in {path}")


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


def build(tiger: Path, census: Path):
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

    counties = {r["GEOID"]: (r, g) for r, g in read("cb_2025_us_county_500k", lambda r: r["STATEFP"] in ("12", "13"))}
    if DUVAL not in counties:
        raise SystemExit("build-jax-map: Duval County (GEOID 12031) not found in cb_2025_us_county_500k")
    duval_rec, duval = counties[DUVAL]
    minx, miny, maxx, maxy = duval.bounds
    frame = box(minx - PAD, miny - PAD, maxx + PAD, maxy + PAD)
    cos0 = math.cos(math.radians((miny + maxy) / 2))
    k = WIDTH / ((frame.bounds[2] - frame.bounds[0]) * cos0)
    height = (frame.bounds[3] - frame.bounds[1]) * k
    west, north = frame.bounds[0], frame.bounds[3]

    def xy(lon, lat):
        return (lon - west) * cos0 * k, (north - lat) * k

    pen = Pen(xy)

    # Land: Duval itself and the neighbouring counties, cut to the frame.
    neighbours = [g.intersection(frame) for gid, (r, g) in counties.items() if gid != DUVAL and g.intersects(frame)]
    land = {"duval": pen.path(duval, 1, 0.35, k), "around": pen.path(unary_union(neighbours), 1, 0.5, k)}

    # Water: every area-water polygon in Duval and its neighbours, larger than a small pond.
    water_parts, water_part_names, river_names = [], [], {}
    min_area = (0.15 / k) ** 2 * 40  # about 40 square map units
    for code in [DUVAL, *NEIGHBOURS]:
        for rec, g in read(f"tl_2026_{code}_areawater"):
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

    # Roads: interstates (S1100) and other primary/secondary roads (S1200), plus Duval's local streets as texture.
    primary, secondary, labels = [], [], {}
    for rec, g in read("tl_2026_12_prisecroads"):
        if not g.intersects(frame):
            continue
        g = g.intersection(frame)
        (primary if rec["MTFCC"] == "S1100" else secondary).append(g)
        name = (rec.get("FULLNAME") or "").strip()
        if rec["MTFCC"] == "S1100" and name.startswith("I-"):
            labels.setdefault(name, []).append(g)
    streets = [g for rec, g in read("tl_2026_12031_roads", lambda r: r["MTFCC"] in ("S1400", "S1730")) if g.length * k * cos0 >= 6]
    roads = {
        "primary": pen.path(unary_union(primary), 1, 0.5, k),
        "secondary": pen.path(unary_union(secondary), 0, 1.0, k),
        "streets": pen.path(unary_union(streets), 0, 0.9, k),
    }

    # One label per interstate, at the midpoint of its longest stretch inside Duval.
    road_labels = []
    for name, geoms in sorted(labels.items()):
        merged = unary_union(geoms).intersection(duval)
        if merged.is_empty:
            continue
        longest = max(list(merged.geoms) if hasattr(merged, "geoms") else [merged], key=lambda p: p.length)
        mid = longest.interpolate(0.5, normalized=True)
        x, y = xy(mid.x, mid.y)
        road_labels.append({"name": name.replace("I- ", "I-"), "x": round(x, 1), "y": round(y, 1)})

    # Incorporated towns in the frame, labelled at a point on land (their legal limits run out to sea).
    all_land = unary_union([duval, *neighbours])
    places = []
    for rec, g in read("tl_2026_12_place", lambda r: r["NAME"] != "Jacksonville" and r["CLASSFP"].startswith("C")):
        on_land = g.intersection(all_land).intersection(frame)
        if on_land.is_empty or on_land.area < (3 / k) ** 2:
            continue
        centre = on_land.representative_point()
        x, y = xy(centre.x, centre.y)
        places.append({"name": rec["NAME"], "x": round(x, 1), "y": round(y, 1), "duval": bool(duval.contains(centre))})

    # Labels for the largest named waters, at a point inside each one's biggest piece.
    water_labels = []
    for name in sorted(river_names, key=lambda n: -river_names[n])[:5]:
        named = [g for g, n in zip(water_parts, water_part_names) if n == name]
        biggest = max((pp for g in named for pp in (g.geoms if hasattr(g, "geoms") else [g])), key=lambda pp: pp.area)
        centre = biggest.representative_point()
        x, y = xy(centre.x, centre.y)
        water_labels.append({"name": name, "x": round(x, 1), "y": round(y, 1)})

    jax_map = {
        "about": "Duval County, Florida, drawn from US Census Bureau TIGER/Line 2026 and cartographic boundary 2025 files (public domain). Built by scripts/build-jax-map.py.",
        "city": "jacksonville-fl",
        "width": round(WIDTH, 1), "height": round(height, 1),
        "projection": {"west": west, "north": north, "cos": cos0, "k": k},
        "land": land, "water": water, "roads": roads,
        "roadLabels": road_labels, "places": places, "waterLabels": water_labels,
        "sources": [{"file": name, "url": url, "what": what, "sha256": sha, "licence": LICENCE, "downloaded": CHECKED}
                    for name, (url, what, sha) in INPUTS.items() if name.endswith(".zip")],
    }
    return jax_map, facts(duval_rec, census)


def facts(duval_rec: dict, census: Path) -> dict:
    county = find_row(census / "co-est2025-alldata.csv", lambda r: r["STATE"] == "12" and r["COUNTY"] == "031" and r["SUMLEV"] == "050")
    place = find_row(census / "sub-est2025_12.csv", lambda r: r["SUMLEV"] == "162" and r["PLACE"] == "35000")
    if place["NAME"] != "Jacksonville city":
        raise SystemExit(f"build-jax-map: expected Jacksonville city at PLACE 35000, found {place['NAME']!r}")
    sq_mi = lambda m2: m2 / 2_589_988.110336  # noqa: E731
    shape_src, county_src, city_src = (INPUTS[n][0] for n in ("cb_2025_us_county_500k.zip", "co-est2025-alldata.csv", "sub-est2025_12.csv"))
    estimates = "US Census Bureau, Vintage 2025 population estimates"
    boundary = "US Census Bureau, cartographic boundary file 2025"
    rows = [
        {"id": "county", "label": "County", "value": county["CTYNAME"], "note": "Florida · FIPS 12031", "source": shape_src, "by": f"{boundary} (GEOID 12031)"},
        {"id": "county-population", "label": "Duval County population", "value": int(county["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": county_src, "by": estimates},
        {"id": "city-population", "label": "Jacksonville city population", "value": int(place["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": city_src, "by": estimates},
        {"id": "land-area", "label": "Land area", "value": round(sq_mi(int(duval_rec["ALAND"])), 1), "unit": "sq mi", "note": f"plus {sq_mi(int(duval_rec['AWATER'])):.1f} sq mi of water", "source": shape_src, "by": f"{boundary} (ALAND, AWATER)"},
    ]
    return {"city": "jacksonville-fl", "checked": CHECKED, "facts": [{**row, "checked": CHECKED} for row in rows]}


def write(name: str, data: dict, compact: bool) -> int:
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    (OUT_DIR / name).write_text(text, encoding="utf-8", newline="\n")
    return len(text.encode("utf-8"))


def main() -> None:
    args = parse_args()
    check_inputs(args.downloads)
    sys.path.insert(0, str(args.libs.resolve()))
    with tempfile.TemporaryDirectory(prefix="jax-tiger-") as temp:
        tiger = Path(temp)
        for name in INPUTS:
            if name.endswith(".zip"):
                with zipfile.ZipFile(args.downloads / name) as archive:
                    archive.extractall(tiger / name.removesuffix(".zip"))
        jax_map, jax_facts = build(tiger, args.downloads)
    size = write("jax-map.json", jax_map, compact=True)
    write("jax-facts.json", jax_facts, compact=False)
    layers = {key: len(value) for key, value in {**jax_map["land"], "water": jax_map["water"], **jax_map["roads"]}.items()}
    print(f"build-jax-map: jax-map.json {size:,} bytes, layers {layers}; jax-facts.json {len(jax_facts['facts'])} facts")


if __name__ == "__main__":
    main()
