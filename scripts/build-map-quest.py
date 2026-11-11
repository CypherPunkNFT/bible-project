"""Map quest: the game's places, built from OpenBible's raw geocoding file (docs/features/map-quest/design.md §3-§5, §7).

The atlas's data/places.json keeps only each place's first proposed site; the game also needs the other credible
sites (a pin is scored against the nearest), so it reads the raw ancient.jsonl that build-data.py reads.

  py -3.12 scripts/build-map-quest.py                     rebuild places, disputed sites and the daily schedule
  py -3.12 scripts/build-map-quest.py --epoch 2026-11-07  (first build only) the date of Daily Five puzzle #1

Writes src/data/map-quest/places.json, disputed.json and, through scripts/build-map-quest-daily.ts, daily.json.
Hand-kept choices live in src/data/map-quest/curation.json. All three outputs are swapped in together, only after
every step succeeded. Run by hand when the data or curation changes (not part of prebuild). Reads files only.
"""

import argparse
import json
import math
import os
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.opendata import osis_to_id, read_places  # noqa: E402
from bible.paths import SOURCES  # noqa: E402

SITE = Path(__file__).resolve().parents[1]
RAW = SOURCES / "openbible-geo" / "Bible-Geocoding-Data-main" / "data" / "ancient.jsonl"
OUT = SITE / "src" / "data" / "map-quest"
JOURNEYS = SITE / "src" / "data" / "letters" / "paul-letters.json"
DAILY_SCRIPT = SITE / "scripts" / "build-map-quest-daily.ts"

POINT_TYPES = {"settlement", "mountain", "hill", "island", "spring", "well", "campsite"}
CREDIBLE_FLOOR, CREDIBLE_SHARE, CREDIBLE_TOTAL = 50, 0.2, 300
DISPUTE_KM = 25  # credible sites farther apart than this: out of normal play (§4.2); same-name merge radius (§3.4)
ALIAS_KM = 0.5
STANDARD_VERSES = 5
HOLY_BOX = (33.8, 29.4, 36.9, 33.6)  # west, south, east, north
BOUNDS = (-12, 8, 73, 49)  # street-style.ts BOUNDS: the map cannot show anything outside it
MIN_POOL = 300
EARTH_KM = 6371.0088


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * EARTH_KM * math.asin(math.sqrt(h))


def plain(text: str) -> str:
    """OpenBible descriptions mark modern places up as <modern id=...>Name</modern>."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or "")).strip()


def candidates(row: dict) -> list[dict]:
    """Every proposed site that has a point, in OpenBible's own order (index = position in identifications[])."""
    found = []
    for index, ident in enumerate(row.get("identifications") or []):
        lonlat = ((ident.get("resolutions") or [{}])[0]).get("lonlat")
        if not lonlat:
            continue
        lon, lat = (round(float(value), 4) for value in lonlat.split(","))
        votes = (ident.get("score") or {}).get("vote_total", 0)
        found.append({"index": index, "name": plain(ident.get("description", "")), "lon": lon, "lat": lat, "votes": votes})
    return found


def credible(sites: list[dict]) -> list[dict]:
    """Sites with at least max(50, 20% of the best) votes; when none reach that, the best one alone."""
    if not sites:
        return []
    best = max(site["votes"] for site in sites)
    kept = [site for site in sites if site["votes"] >= max(CREDIBLE_FLOOR, CREDIBLE_SHARE * best)]
    return kept or [max(sites, key=lambda site: site["votes"])]


def spread_km(sites: list[dict]) -> float:
    return max((haversine_km((a["lon"], a["lat"]), (b["lon"], b["lat"])) for a in sites for b in sites), default=0.0)


def verse_ids(row: dict) -> list[int]:
    ids = set()
    for verse in row.get("verses") or []:
        try:
            ids.add(osis_to_id(verse["osis"]))
        except (KeyError, ValueError):
            continue  # a handful of refs use book names outside the 66-book table (as opendata.read_places)
    return sorted(ids)


def read_candidates(rows: list[dict]) -> list[dict]:
    """Filters 1-2 (§3): point-like places with a credible location and at least one verse."""
    kept = []
    for row in rows:
        types = set(row.get("types") or [])
        if not types & POINT_TYPES or types - POINT_TYPES - {"special"}:
            continue
        sites = candidates(row)
        first = (row.get("identifications") or [{}])[0]
        if not sites or sites[0]["index"] != 0 or not first.get("resolutions"):
            continue  # no point for the first proposed site: the atlas skips these too
        good = credible(sites)
        if sum(site["votes"] for site in good) < CREDIBLE_TOTAL:
            continue
        verses = verse_ids(row)
        if not verses:
            continue
        # The atlas shows the first site in OpenBible's list; keep that point when it is credible.
        main = sites[0] if sites[0] in good else max(good, key=lambda site: site["votes"])
        kept.append({
            "id": row["id"], "name": re.sub(r" \d+$", "", row["friendly_id"]), "lon": main["lon"], "lat": main["lat"],
            "alts": [[site["lon"], site["lat"]] for site in good if site is not main],
            "wide": spread_km(good) > DISPUTE_KM, "verses": verses,
        })
    return kept


def one_per_name(places: list[dict]) -> list[dict]:
    """Filter 4: keep the most-mentioned place of each name; a same-name record within 25 km is the same place in
    another period, so its verses join the kept one (Jericho 2 brings the Gospel verses to Jericho)."""
    by_name = defaultdict(list)
    for place in places:
        by_name[place["name"]].append(place)
    kept = []
    for group in by_name.values():
        group.sort(key=lambda p: (-len(p["verses"]), p["id"]))
        main = dict(group[0])
        for other in group[1:]:
            if haversine_km((main["lon"], main["lat"]), (other["lon"], other["lat"])) <= DISPUTE_KM:
                main["verses"] = sorted(set(main["verses"]) | set(other["verses"]))
        kept.append(main)
    return kept


def drop_aliases(places: list[dict]) -> list[dict]:
    """Filter 5: a place within 0.5 km of a better-known one is another name for the same spot (Zion, Luz)."""
    ranked = sorted(places, key=lambda p: (-len(p["verses"]), p["id"]))
    kept: list[dict] = []
    for place in ranked:
        if all(haversine_km((place["lon"], place["lat"]), (k["lon"], k["lat"])) > ALIAS_KM for k in kept):
            kept.append(place)
    return kept


def era_tags(verses: list[int], journey: bool) -> list[str]:
    """§5.2: a place is in an era when one of its verses falls in that era's chapters."""
    eras = []
    books = {(v // 1_000_000, v // 1000 % 1000) for v in verses}
    if any(book == 1 and 11 <= chapter <= 50 for book, chapter in books):
        eras.append("abraham")
    if any(book in (2, 4, 5, 6, 7) for book, _ in books):
        eras.append("exodus")
    if any(9 <= book <= 14 for book, _ in books):
        eras.append("kingdoms")
    if any(40 <= book <= 43 for book, _ in books):
        eras.append("jesus")
    if journey or any(book == 44 and chapter >= 13 for book, chapter in books):
        eras.append("paul")
    return eras


def journey_ids(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {stop["placeId"] for journey in data.get("maps", []) for stop in journey.get("stops", []) if stop.get("placeId")}


def inside(box: tuple[float, float, float, float], lon: float, lat: float) -> bool:
    west, south, east, north = box
    return west <= lon <= east and south <= lat <= north


class CurationError(ValueError):
    pass


def playable_places(rows: list[dict], curation: dict, atlas_ids: set[str], journeys: set[str]) -> list[dict]:
    """Filters 1-6 and the record shape of §3."""
    excluded = set(curation.get("exclude", []))
    forced = set(curation.get("forceDisputed", []))
    named = one_per_name([p for p in read_candidates(rows) if p["id"] not in excluded])
    # A widely disputed name leaves normal play whole: a lesser same-name place is never asked in its stead.
    normal = [p for p in named if not p["wide"] and p["id"] not in forced]
    places = drop_aliases(normal)
    beginner = {entry["id"]: entry.get("verse") for entry in curation.get("beginner", [])}
    by_id = {p["id"]: p for p in places}
    for place_id in beginner:
        if place_id not in by_id:
            raise CurationError(f"curation.json beginner id {place_id!r} is not a playable place (filtered out by §3); remove it or fix the data")
    records = []
    for place in sorted(places, key=lambda p: p["id"]):
        verses = place["verses"]
        tier = 1 if place["id"] in beginner else 2 if len(verses) >= STANDARD_VERSES else 3
        verse = beginner.get(place["id"]) or verses[0]
        if verse not in verses:
            raise CurationError(f"curation.json beginner verse {verse} for {place['id']!r} does not name the place; expected one of {verses[:8]}")
        if not inside(BOUNDS, place["lon"], place["lat"]):
            continue  # outside the map: the player could never reach it
        records.append({
            "id": place["id"], "name": place["name"], "lon": place["lon"], "lat": place["lat"], "alts": place["alts"],
            "tier": tier, "scope": "holy" if inside(HOLY_BOX, place["lon"], place["lat"]) else "wider",
            "eras": era_tags(verses, place["id"] in journeys), "verseCount": len(verses), "verse": verse,
            "atlas": place["id"] in atlas_ids,
        })
    return records


def disputed_places(rows: list[dict], curation: dict) -> list[dict]:
    """§4.3: the Disputed sites mode, from curation's list. Every candidate is one of OpenBible's, picked by index."""
    by_id = {row["id"]: row for row in rows}
    found = []
    for entry in curation.get("disputed", []):
        row = by_id.get(entry["id"])
        if row is None:
            raise CurationError(f"curation.json disputed id {entry['id']!r} is not in {RAW.name}")
        sites = {site["index"]: site for site in candidates(row)}
        missing = [index for index in entry["candidates"] if index not in sites]
        if missing or len(entry["candidates"]) < 2:
            raise CurationError(f"curation.json disputed {entry['id']!r}: needs 2+ candidates with a point; indexes without one: {missing}")
        verses = verse_ids(row)
        verse = entry.get("verse") or verses[0]
        if verse not in verses:
            raise CurationError(f"curation.json disputed verse {verse} for {entry['id']!r} does not name the place")
        found.append({
            "id": row["id"], "name": entry.get("name") or re.sub(r" \d+$", "", row["friendly_id"]),
            "sites": [{"name": sites[i]["name"], "lon": sites[i]["lon"], "lat": sites[i]["lat"]} for i in entry["candidates"]],
            "note": entry["note"], "verse": verse, "verseCount": len(verses),
            "source": f"https://www.openbible.info/geo/ancient/{row['id']}/{row.get('url_slug', '')}".rstrip("/"),
        })
    return found


def check_pool(places: list[dict]) -> list[str]:
    problems = []
    if len(places) < MIN_POOL:
        problems.append(f"only {len(places)} playable places; expected at least {MIN_POOL}")
    for tier in (1, 2, 3):
        if not any(p["tier"] == tier for p in places):
            problems.append(f"tier {tier} is empty")
    return problems


def report(places: list[dict], disputed: list[dict]) -> None:
    count = lambda test: sum(1 for p in places if test(p))  # noqa: E731
    print(f"playable places: {len(places)} (holy {count(lambda p: p['scope'] == 'holy')}, wider {count(lambda p: p['scope'] == 'wider')})")
    print("tiers: " + ", ".join(f"{t}: {count(lambda p, t=t: p['tier'] == t)}" for t in (1, 2, 3)))
    print("eras: " + ", ".join(f"{e}: {count(lambda p, e=e: e in p['eras'])}" for e in ("abraham", "exodus", "kingdoms", "jesus", "paul")))
    print(f"with more than one credible site: {count(lambda p: bool(p['alts']))}; disputed-mode places: {len(disputed)}")


def write_lines(path: Path, records: list[dict]) -> None:
    """One record per line: readable diffs, small file."""
    body = ",\n".join(json.dumps(record, ensure_ascii=False, separators=(",", ":")) for record in records)
    path.write_text(f"[\n{body}\n]\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--epoch", help="date of Daily Five puzzle #1 (YYYY-MM-DD); only when daily.json does not exist yet")
    args = parser.parse_args()
    rows = [json.loads(line) for line in RAW.read_text(encoding="utf-8").splitlines() if line.strip()]
    curation = json.loads((OUT / "curation.json").read_text(encoding="utf-8"))
    atlas_ids = {place["id"] for place in read_places(RAW)}
    try:
        places = playable_places(rows, curation, atlas_ids, journey_ids(JOURNEYS))
        disputed = disputed_places(rows, curation)
    except CurationError as error:
        print(f"map quest: {error}", file=sys.stderr)
        return 1
    report(places, disputed)
    problems = check_pool(places)
    if problems:
        print("map quest: refusing to write: " + "; ".join(problems), file=sys.stderr)
        return 1
    staged = {name: OUT / f".{name}.new" for name in ("places.json", "disputed.json", "daily.json")}
    write_lines(staged["places.json"], places)
    write_lines(staged["disputed.json"], disputed)
    command = ["node", "--experimental-strip-types", "--no-warnings", str(DAILY_SCRIPT),
               "--places", str(staged["places.json"]), "--existing", str(OUT / "daily.json"), "--out", str(staged["daily.json"])]
    if args.epoch:
        command += ["--epoch", args.epoch]
    result = subprocess.run(command, cwd=SITE, check=False)
    if result.returncode != 0:
        for path in staged.values():
            path.unlink(missing_ok=True)
        print(f"map quest: the daily schedule step failed (exit {result.returncode}); nothing was changed", file=sys.stderr)
        return 1
    for name, path in staged.items():
        os.replace(path, OUT / name)
    print(f"wrote {', '.join(staged)} to {OUT.relative_to(SITE).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
