"""Builds the data the Help for life mock-ups read, as JavaScript globals (so the pages need no fetch):

  data/life-data.js   window.LIFE: the national lines and ONLY the verified cities from src/data/resources/life.json,
                      plus window.JAX_FACTS: sourced facts about Jacksonville / Duval County
  data/map-data.js    window.US_STATES (src/data/resources/us-states.json) and window.JAX_MAP (data/jax-map.json)
  data/sources.json   every outside file used, with its URL, vintage and sha256

  python -I build-data.py --site <Website dir> --census <dir with co-est2025-alldata.csv, sub-est2025_12.csv>
                          --downloads <dir with the TIGER zips> --us-point $(node project-city.mjs <Website dir> as x,y)
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

CHECKED = "2026-10-08"
HERE = Path(__file__).resolve().parent.parent
TIGER = {
    "cb_2025_us_county_500k.zip": ("https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip", "Cartographic Boundary File 2025, counties 1:500,000 (shoreline-clipped)"),
    "tl_2026_12_prisecroads.zip": ("https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_12_prisecroads.zip", "TIGER/Line 2026, primary and secondary roads, Florida"),
    "tl_2026_12031_roads.zip": ("https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12031_roads.zip", "TIGER/Line 2026, all roads, Duval County"),
    "tl_2026_12_place.zip": ("https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_12_place.zip", "TIGER/Line 2026, places, Florida (town labels)"),
    **{f"tl_2026_{c}_areawater.zip": (f"https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_{c}_areawater.zip", f"TIGER/Line 2026, area water, {n}")
       for c, n in [("12031", "Duval County"), ("12089", "Nassau County"), ("12003", "Baker County"), ("12019", "Clay County"), ("12109", "St. Johns County")]},
}
CENSUS = {
    "co-est2025-alldata.csv": ("https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv", "Vintage 2025 county population estimates"),
    "sub-est2025_12.csv": ("https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_12.csv", "Vintage 2025 city and town population estimates, Florida"),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def find_row(path: Path, match) -> dict:
    with path.open(encoding="latin-1", newline="") as handle:
        for row in csv.DictReader(handle):
            if match(row):
                return row
    raise SystemExit(f"build-data: no matching row in {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, type=Path)
    parser.add_argument("--census", required=True, type=Path)
    parser.add_argument("--downloads", required=True, type=Path)
    parser.add_argument("--us-point", required=True, help="x,y of city hall on the USA map, from project-city.mjs")
    args = parser.parse_args()

    life = json.loads((args.site / "src/data/resources/life.json").read_text(encoding="utf-8"))
    cities = [c for c in life["cities"] if c.get("verified") is True]
    if [c["id"] for c in cities] != ["jacksonville-fl"]:
        raise SystemExit(f"build-data: expected Jacksonville as the only verified city, found {[c['id'] for c in cities]}")
    city = cities[0]

    jax_map = json.loads((HERE / "data/jax-map.json").read_text(encoding="utf-8"))
    county = find_row(args.census / "co-est2025-alldata.csv", lambda r: r["STATE"] == "12" and r["COUNTY"] == "031" and r["SUMLEV"] == "050")
    place = find_row(args.census / "sub-est2025_12.csv", lambda r: r["SUMLEV"] == "162" and r["PLACE"] == "35000")
    sq_mi = lambda m2: m2 / 2_589_988.110336  # noqa: E731
    county_src, city_src = CENSUS["co-est2025-alldata.csv"][0], CENSUS["sub-est2025_12.csv"][0]
    shape_src = TIGER["cb_2025_us_county_500k.zip"][0]
    facts = [
        {"label": "County", "value": county["CTYNAME"], "note": "Florida · FIPS 12031", "source": shape_src, "by": "US Census Bureau, cartographic boundary file 2025 (GEOID 12031)"},
        {"label": "Duval County population", "value": int(county["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": county_src, "by": "US Census Bureau, Vintage 2025 population estimates"},
        {"label": "Jacksonville city population", "value": int(place["POPESTIMATE2025"]), "note": "estimate for July 1, 2025", "source": city_src, "by": "US Census Bureau, Vintage 2025 population estimates"},
        {"label": "April 2020 base", "value": int(county["ESTIMATESBASE2020"]), "note": "the county's estimates base from the 2020 Census", "source": county_src, "by": "US Census Bureau, Vintage 2025 population estimates"},
        {"label": "Land area", "value": round(sq_mi(jax_map["county"]["aland"]), 1), "unit": "sq mi", "note": f"plus {sq_mi(jax_map['county']['awater']):.1f} sq mi of water", "source": shape_src, "by": "US Census Bureau, cartographic boundary file 2025 (ALAND, AWATER)"},
    ]

    out = {"checked": life["checked"], "groups": life["groups"], "city": city}
    js = "// Built by build/build-data.py from src/data/resources/life.json (verified cities only) and Census files.\n"
    js += f"window.LIFE = {json.dumps(out, ensure_ascii=False)};\nwindow.JAX_FACTS = {json.dumps({'checked': CHECKED, 'facts': facts}, ensure_ascii=False)};\n"
    (HERE / "data/life-data.js").write_text(js, encoding="utf-8")

    states = (args.site / "src/data/resources/us-states.json").read_text(encoding="utf-8")
    maps = "// Built by build/build-data.py: the site's USA outline and the Duval County map (build/build-jax-map.py).\n"
    maps += f"window.US_STATES = {states.strip()};\nwindow.JAX_MAP = {json.dumps(jax_map, separators=(',', ':'))};\n"
    x, y = (float(v) for v in args.us_point.split(","))
    maps += f"window.US_POINT = {json.dumps({'x': x, 'y': y})};\n"
    (HERE / "data/map-data.js").write_text(maps, encoding="utf-8")

    sources = []
    for name, (url, what) in TIGER.items():
        sources.append({"file": name, "url": url, "what": what, "sha256": sha256(args.downloads / name), "licence": "US Government work, public domain", "downloaded": CHECKED})
    for name, (url, what) in CENSUS.items():
        sources.append({"file": name, "url": url, "what": what, "sha256": sha256(args.census / name), "licence": "US Government work, public domain", "downloaded": CHECKED})
    (HERE / "data/sources.json").write_text(json.dumps(sources, indent=2), encoding="utf-8")
    print(f"build-data: {len(life['groups'])} groups, {len(city['entries'])} places and {len(city['lines'])} lines in {city['name']}; {len(facts)} facts; {len(sources)} sources")


if __name__ == "__main__":
    main()
