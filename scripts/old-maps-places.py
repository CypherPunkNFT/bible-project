# Builds the "Old maps of <place>" bar in the map's place panel (src/components/atlas/PlacePanel.tsx).
#
#   python scripts/old-maps-places.py            (from Website/)
#
# Matches every place on the Atlas map (data/places.json) against the titles of the historical maps
# (Research/HistoricalMaps, filtered as in design/old-maps-directions/build-data.py) and writes, per place that old maps
# name: how many maps, the earliest year, and four dated maps spread from earliest to latest, each with a small picture
# in public/images/old-maps/places/. Owner approved the bar on 2026-10-19 (mock-up ?d=pages, part 3).
from __future__ import annotations

import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

WEBSITE = Path(__file__).resolve().parents[1]
OUT_JSON = WEBSITE / "src" / "components" / "atlas" / "old-maps-by-place.json"
OUT_IMAGES = WEBSITE / "public" / "images" / "old-maps" / "places"
PICKS, SIDE, QUALITY = 4, 220, 70
# Pictures only from maps anyone may reuse without conditions; the count still covers every map of the place.
OPEN_LICENCES = {"Public domain", "No known restrictions", "CC0"}

# Names that are words or other places in map titles ("North", Philadelphia's timeline, Carmel and Ebenezer in the US);
# Asia is the Roman province in Scripture but Ptolemy's "Map of Asia" in the titles.
SKIP_NAMES = {"Asia", "East", "North", "South", "West", "River", "Angle", "Adam", "Philadelphia", "Carmel", "Ebenezer",
              "Goshen", "Media", "India", "Italy", "Samos", "Aram", "Spain"}
# Photographs the corpus files as maps, and American towns that share a biblical name (Babylon and Mount Sinai on Long
# Island, Nineveh in Colesville): fire-insurance plans, county atlases and township plates.
# State and city names are not used: American Bible atlases carry them in their publisher lines.
NOT_A_MAP = (r"\bIMG\b|\bDSC|cable car|photograph|sanborn|fire insurance|soil map|business (notices|directory)|\bres\. of"
             r"|suffolk co|county|township|\btp\b|\[village\]|\bn\.y\.|^part of (town )?babylon|wading river|crystal brook"
             r"|border area|lebanon and vicinity")
# Old and foreign spellings, as a title regex per place name; each also matches the name itself, which it replaces.
ALIASES = {
    "Jerusalem": r"jerusalem|ierusalem|hierosolym|j[ée]rusalem|jerusal[ée]n|hierusalem|jeruzalem",
    "Damascus": r"\bdamas(co|cus|kus)?\b",
    "Bethlehem": r"\bbeth-?le-?h?em\b|\bbethleem\b",
    "Jericho": r"\bh?[ij]ericho\b",
    "Nazareth": r"\bnazar[ae]th",
    "Tyre": r"\btyr(e|us|o)\b",
    "Sidon": r"\b[sz]idon",
    "Joppa": r"\b(joppa|jaffa|ioppe|iaffa|ioppa)\b",
    "Egypt": r"egypt|aegypt|ägypt|[ée]gypte|egipt",
    "Nineveh": r"\bnin[ie]v[eh]h?\b|\bninive\b",
    "Galilee": r"galil(ee|aea|äa|[ée]e)",
    # Not the engravers "Jordan & Halpin" or the Danish mapmaker Marco Iordano.
    "Jordan": r"(?<!marco )\b(jordan|iordan|jourdain)\b(?! &)",
    "Antioch": r"\bantioch",
    "Ephesus": r"\bephes",
    "Canaan": r"\b(canaan|chanaan|kanaan)\b",
    "Mount Sinai": r"\bsina[iy]\b",
    "Lebanon": r"\b(lebanon|libanon|liban)\b",
    "Mount of Olives": r"mount of olives|oliveti|ölberg",
    "Red Sea": r"red sea|mare rubrum|mer rouge|rothe[ns]? meer",
    "Babylon": r"\bbabylon\b|\bbabel\b",
    "Hebron": r"\bhebron\b",
    "Samaria": r"\bsamari",
    "Gaza": r"\bgaza\b",
    "Rome": r"\b(rome|roma)\b",
    "Athens": r"\b(athens|athenae|ath[eè]nes)\b",
    "Cyprus": r"\b(cyprus|cypern|chypre)\b",
    "Crete": r"\b(crete|creta|candia)\b",
    "Zion": r"\bmount zion\b|\bmons sion\b",
}


def load_build_data():
    spec = importlib.util.spec_from_file_location("old_maps_build", WEBSITE / "design" / "old-maps-directions" / "build-data.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def usable_maps(bd) -> list[dict]:
    """Held, publishable map sheets, filtered exactly as the Old maps mock-up filters them, minus photographs."""
    catalogue, detail = bd.load_records()
    rows = []
    for row in catalogue:
        record = detail.get(row["record_id"], {})
        title = row["title"]
        if not row["file"] or row["withheld_reason"] or record.get("record_kind") != "map" or record.get("provenance_caution"):
            continue
        if any(re.search(rule, title, re.I) for rule in (bd.OFF_TOPIC, bd.NOT_A_SHEET, bd.MODERN_DIAGRAM, NOT_A_MAP)):
            continue
        if row["source"] == "wikimedia-commons" and row["year"] is None and row["licence"].startswith("CC") and row["licence"] != "CC0":
            continue
        rows.append({**row, "record": record})
    return rows


def main_places() -> dict[str, dict]:
    """One place per name: where several share it (three Babylons), the one named in the most verses."""
    places = json.loads((WEBSITE / "data" / "places.json").read_text(encoding="utf-8"))
    best: dict[str, dict] = {}
    for place in places:
        name = place["name"]
        if len(name) < 4 or name in SKIP_NAMES:
            continue
        if name not in best or len(place["verses"]) > len(best[name]["verses"]):
            best[name] = place
    return best


def title_rule(name: str) -> re.Pattern:
    """The place's alias rule where it has one (each covers the name itself), else its name as a whole word."""
    return re.compile(ALIASES.get(name, r"\b" + re.escape(name) + r"\b"), re.I)


def spread(rows: list[dict], count: int) -> list[dict]:
    """`count` maps evenly across the years, earliest first."""
    step = max(1.0, len(rows) / count)
    return [rows[int(i * step)] for i in range(min(count, len(rows)))]


def picture(bd, row) -> str | None:
    """A small JPEG of the sheet; an existing one is reused. None (and a log line) when the scan cannot be read."""
    name = re.sub(r"[^a-z0-9]+", "-", row["record_id"].lower()).strip("-")[:80] + ".jpg"
    target = OUT_IMAGES / name
    if not target.exists():
        try:
            image = bd.open_reduced(bd.CORPUS / row["file"], SIDE)
        except Exception as error:  # one unreadable scan must not stop the build; it is logged and left out
            print(f"  skipped picture for {row['record_id']}: {type(error).__name__}: {error}")
            return None
        image.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return f"/images/old-maps/places/{name}"


def entry(bd, rows: list[dict]) -> dict:
    dated = sorted((r for r in rows if r["year"]), key=lambda r: r["year"])
    open_dated = []
    for row in dated:
        _line, licence = bd.credit(row, row["record"], None)
        if licence in OPEN_LICENCES:
            open_dated.append(row)
    # One map per year (the same sheet is often held twice, or several plates of one atlas share a year).
    one_per_year = list({row["year"]: row for row in reversed(open_dated)}.values())[::-1]
    maps = []
    for row in spread(one_per_year, PICKS):
        image = picture(bd, row)
        if image:
            line, licence = bd.credit(row, row["record"], bd.clean_maker(row["cartographer"]))
            maps.append({"year": row["year"], "title": bd.short_title(row["title"], 120), "maker": bd.clean_maker(row["cartographer"]),
                         "credit": f"{line} · {licence}", "url": row["source_url"], "image": image})
    maps.sort(key=lambda m: m["year"])
    return {"count": len(rows), "earliest": dated[0]["year"] if dated else None, "maps": maps}


def main() -> None:
    bd = load_build_data()
    rows = usable_maps(bd)
    places = main_places()
    named: dict[str, list[dict]] = defaultdict(list)
    for name, place in places.items():
        rule = title_rule(name)
        named[place["id"]] = [row for row in rows if rule.search(row["title"])]
    OUT_IMAGES.mkdir(parents=True, exist_ok=True)
    result = {}
    for place_id, matched in sorted(named.items(), key=lambda item: -len(item[1])):
        if not matched:
            continue
        built = entry(bd, matched)
        if built["maps"]:
            result[place_id] = built
            name = next(p["name"] for p in places.values() if p["id"] == place_id)
            print(f"  {built['count']:4} {name:20} from {built['earliest']}  pictures {[m['year'] for m in built['maps']]}")
    used = {Path(m["image"]).name for place in result.values() for m in place["maps"]}
    for leftover in OUT_IMAGES.glob("*.jpg"):
        if leftover.name not in used:
            print(f"  removing unreferenced {leftover.name}")
            leftover.unlink()
    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    size = sum(p.stat().st_size for p in OUT_IMAGES.glob("*.jpg"))
    print(f"{len(rows)} maps · {len(result)} places with old maps · {len(used)} pictures, {size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
