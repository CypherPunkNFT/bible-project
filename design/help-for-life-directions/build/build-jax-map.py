"""Draws the Jacksonville (Duval County) map for the Help for life mock-ups from US Census Bureau TIGER/Line and
cartographic boundary files (public domain), and writes data/jax-map.json: SVG path strings per layer plus the
projection, so the page can place each help centre from its latitude and longitude.

Inputs (unzipped, one folder per zip, as downloaded from www2.census.gov):
  cb_2025_us_county_500k        county outlines, clipped to the shoreline (GENZ2025)
  tl_2026_12_prisecroads        primary and secondary roads, Florida (TIGER2026)
  tl_2026_12031_roads           all roads, Duval County (TIGER2026), for the faint street texture
  tl_2026_<county>_areawater    area water for Duval and its four neighbours (TIGER2026)
  tl_2026_12_place              incorporated places, Florida (TIGER2026), for the beach-town labels

Needs pyshp and shapely (pass --libs to a folder holding them).
  python -I build-jax-map.py --tiger <unzipped dir> --libs <site-packages dir> --out ../data/jax-map.json
"""
import argparse
import json
import math
import sys
from pathlib import Path

DUVAL = "12031"
NEIGHBOURS = ["12089", "12003", "12019", "12109"]  # Nassau, Baker, Clay, St. Johns
WIDTH = 1000.0
PAD = 0.035  # degrees of margin around the county


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--tiger", required=True, type=Path)
    parser.add_argument("--libs", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    return parser.parse_args()


def main():
    args = parse_args()
    sys.path.insert(0, str(args.libs.resolve()))
    import shapefile  # noqa: E402  (pyshp, from --libs)
    from shapely.geometry import box, shape  # noqa: E402
    from shapely.ops import unary_union  # noqa: E402

    def read(name, keep=lambda rec: True):
        path = args.tiger / name / f"{name}.shp"
        if not path.exists():
            raise SystemExit(f"build-jax-map: missing {path}; expected the unzipped {name}.zip")
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
    lon0, lat0 = (minx + maxx) / 2, (miny + maxy) / 2
    cos0 = math.cos(math.radians(lat0))
    k = WIDTH / ((frame.bounds[2] - frame.bounds[0]) * cos0)
    height = (frame.bounds[3] - frame.bounds[1]) * k
    west, north = frame.bounds[0], frame.bounds[3]

    def xy(lon, lat):
        return (lon - west) * cos0 * k, (north - lat) * k

    def ring_path(coords, digits, closed):
        out, last = [], None
        for lon, lat in coords:
            x, y = xy(lon, lat)
            point = (round(x, digits), round(y, digits))
            if point == last:
                continue
            out.append(point)
            last = point
        if len(out) < 2:
            return ""
        fmt = (lambda v: f"{v:.{digits}f}") if digits else (lambda v: str(int(v)))
        d = "M" + "L".join(f"{fmt(x)},{fmt(y)}" for x, y in out)
        return d + ("Z" if closed else "")

    def path(geom, digits=1, tolerance=0.0):
        if geom.is_empty:
            return ""
        if tolerance:
            geom = geom.simplify(tolerance / k, preserve_topology=True)
        parts = []
        kind = geom.geom_type
        geoms = list(geom.geoms) if kind.startswith("Multi") or kind == "GeometryCollection" else [geom]
        for g in geoms:
            if g.geom_type == "Polygon":
                parts.append(ring_path(g.exterior.coords, digits, True))
                parts.extend(ring_path(i.coords, digits, True) for i in g.interiors)
            elif g.geom_type == "LineString":
                parts.append(ring_path(g.coords, digits, False))
            elif g.geom_type in ("MultiPolygon", "MultiLineString", "GeometryCollection"):
                parts.append(path(g, digits))
        return "".join(p for p in parts if p)

    # Land: Duval itself and the neighbouring counties, cut to the frame.
    neighbours = [g.intersection(frame) for gid, (r, g) in counties.items() if gid != DUVAL and g.intersects(frame)]
    land = {"duval": path(duval, 1, 0.35), "around": path(unary_union(neighbours), 1, 0.5)}

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
    water = path(unary_union(water_parts), 1, 0.7)

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
    streets = []
    for rec, g in read("tl_2026_12031_roads", lambda r: r["MTFCC"] in ("S1400", "S1730")):
        if g.length * k * cos0 < 6:  # drop stubs shorter than about 6 map units
            continue
        streets.append(g)
    roads = {
        "primary": path(unary_union(primary), 1, 0.5),
        "secondary": path(unary_union(secondary), 0, 1.0),
        "streets": path(unary_union(streets), 0, 0.9),
    }

    # One label per interstate, at the midpoint of its longest stretch inside Duval.
    road_labels = []
    for name, geoms in sorted(labels.items()):
        merged = unary_union(geoms).intersection(duval)
        if merged.is_empty:
            continue
        pieces = list(merged.geoms) if hasattr(merged, "geoms") else [merged]
        longest = max(pieces, key=lambda p: p.length)
        mid = longest.interpolate(0.5, normalized=True)
        x, y = xy(mid.x, mid.y)
        road_labels.append({"name": name.replace("I- ", "I-"), "x": round(x, 1), "y": round(y, 1)})

    # Incorporated towns in the frame (the beach towns, Baldwin, Orange Park...), labelled at a point on land: their
    # legal limits run out to sea, so each is cut to the land first.
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

    out = {
        "about": "Duval County, Florida, drawn from US Census Bureau TIGER/Line 2026 and cartographic boundary 2025 files (public domain). See sources.",
        "width": round(WIDTH, 1), "height": round(height, 1),
        "projection": {"west": west, "north": north, "cos": cos0, "k": k},
        "county": {"name": duval_rec["NAMELSAD"], "geoid": duval_rec["GEOID"], "aland": duval_rec["ALAND"], "awater": duval_rec["AWATER"]},
        "land": land, "water": water, "roads": roads,
        "roadLabels": road_labels, "places": places,
        "waterLabels": water_labels,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(out, separators=(",", ":"))
    args.out.write_text(text, encoding="utf-8")
    sizes = {key: len(value) for key, value in {**land, "water": water, **roads}.items()}
    print(f"build-jax-map: wrote {args.out} ({len(text):,} bytes); layer sizes {sizes}; {len(road_labels)} road labels; {len(places)} places")


if __name__ == "__main__":
    main()
