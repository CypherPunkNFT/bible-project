"""Cards for the Odd one out deck mock-ups (/games/odd-one-out_mockup..4, owner 2026-11-12).

One card for every item that is the odd one out of at least one set: a person, place or book, with one sentence,
the book that names it most, how many verses name it, its era (people), its point on the map (places) or its place
in the canon (books). Built only from the site's own data; no new source. Writes
src/pages/games/odd-one-out/deck/cards.json (moved from the mock-up's folder when the deck went into the game, 2026-11-12). Run from Website/: py -3.12 scripts/mockup_odd_deck_cards.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
SETS = SITE / "src" / "data" / "odd-one-out" / "sets.json"
PEOPLE = SITE / "data" / "study" / "people.json"
PERSON_DIR = SITE / "data" / "study" / "people"
PLACES = SITE / "data" / "places.json"
OUT = SITE / "src" / "pages" / "games" / "odd-one-out" / "deck" / "cards.json"


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"Could not read {path}: {error}") from error


def section(book: int) -> str:
    """The site's book-section colour name for a book number (1-66)."""
    if book <= 17:
        return "history"
    if book <= 22:
        return "poetry"
    if book <= 39:
        return "prophets"
    if book <= 43:
        return "gospels"
    if book == 44:
        return "acts"
    if book <= 65:
        return "epistles"
    return "revelation"


def split_ref(ref: int) -> tuple[int, int, int]:
    return ref // 1_000_000, ref // 1000 % 1000, ref % 1000


def top_book(counts: Counter[int], names: list[str]) -> dict:
    book, verses = max(counts.items(), key=lambda pair: (pair[1], -pair[0]))
    return {"book": names[book - 1], "n": verses, "sec": section(book)}


def place_type(raw: str) -> str:
    return {"river": "River", "mountain": "Mountain", "region": "Region", "settlement": "Town or city",
            "body of water": "Sea or lake", "spring": "Spring", "valley": "Valley"}.get(raw, raw.capitalize() or "Place")


def person_card(item_id: str, item: dict, row: dict, names: list[str]) -> dict:
    detail = read_json(PERSON_DIR / f"{item_id}.json")
    counts = Counter({int(book): n for book, n in detail.get("k", {}).items()})
    if not counts:
        raise SystemExit(f"{item_id}: the person file has no verses by book (field k)")
    line = (detail.get("short") or item["brief"]).strip()
    return {"kind": "person", "line": line, "top": top_book(counts, names), "verses": row.get("c", sum(counts.values())),
            "era": row.get("p", "")}


def place_card(item: dict, place: dict, names: list[str]) -> dict:
    refs = place.get("verses") or [item["ref"]]
    counts = Counter(split_ref(ref)[0] for ref in refs)
    book, chapter, verse = split_ref(min(refs))
    kind = place_type(place.get("type", ""))
    return {"kind": "place", "line": f"{kind}, first named in {names[book - 1]} {chapter}:{verse}.",
            "top": top_book(counts, names), "verses": len(refs),
            "at": [round(place["lon"], 2), round(place["lat"], 2)], "type": kind}


def book_card(item: dict, names: list[str]) -> dict:
    book = split_ref(item["ref"])[0]
    match = re.search(r"(\d+) chapters?", item["brief"])
    if not match:
        raise SystemExit(f"{item['label']}: expected 'N chapters' in its brief, got {item['brief']!r}")
    genre = item["brief"].split(",")[0]
    testament = "Old Testament" if book <= 39 else "New Testament"
    return {"kind": "book", "line": f"{genre} of the {testament}, {match.group(1)} chapters.",
            "top": {"book": names[book - 1], "n": 0, "sec": section(book)}, "verses": 0,
            "canon": book, "chapters": int(match.group(1)), "genre": genre}


def main() -> None:
    sets = read_json(SETS)
    names = [name for _, name in sets["books"]]
    if len(names) != 66:
        raise SystemExit(f"sets.json books: expected 66, found {len(names)}")
    people = {row["id"]: row for row in read_json(PEOPLE)}
    places = {row["id"]: row for row in read_json(PLACES)}
    odd_ids = sorted({entry["odd"] for entry in sets["sets"]})
    cards = []
    for item_id in odd_ids:
        item = sets["items"][item_id]
        if item["kind"] == "person":
            body = person_card(item_id, item, people.get(item_id, {}), names)
        elif item["kind"] == "place":
            body = place_card(item, places[item_id], names)
        else:
            body = book_card(item, names)
        cards.append({"id": item_id, "name": item["label"], "href": item["href"], **body})
    # Every place on the site as a faint dot, so a place card's map has the land's shape without a coastline file.
    dots = sorted({(round(p["lon"], 1), round(p["lat"], 1)) for p in places.values()
                   if 29 <= p["lon"] <= 49 and 27 <= p["lat"] <= 38})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    document = {"about": "Mock-up data, generated by scripts/mockup_odd_deck_cards.py; do not edit.",
                "cards": cards, "dots": [list(d) for d in dots]}
    OUT.write_text(json.dumps(document, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    kinds = Counter(card["kind"] for card in cards)
    print(f"Wrote {len(cards)} cards ({dict(kinds)}) and {len(dots)} map dots to {OUT.relative_to(SITE)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
