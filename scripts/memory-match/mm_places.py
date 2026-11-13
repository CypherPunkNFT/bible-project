"""Memory card match, Places version: check the hand-kept place and event cards and compute the shipped document.

The input is scripts/memory-match/places.json. Each place card names a record in data/places.json; each event is a
pair with a passage, a check word and a tier, held to the same card rules as the people version (design 4.1) through
mm_pairs. Two checks are the Places version's own: the place's name is in the BSB text of the passage, and the place's
record lists at least one verse of the passage, so a card can never point at the wrong Bethlehem. The shipped file has
the people version's shape, so the game draws and deals it with the same code.
"""
from __future__ import annotations

import hashlib
import json
import re

from mm_build import (
    SHY,
    BuildError,
    Sources,
    bare,
    content_words,
    first_name,
    reader_href,
    show_ref,
    verse_id,
)
from mm_pairs import (
    Character,
    Pair,
    check_pair,
    check_shared_names,
    deck_pools,
    symmetric_not_with,
)

# The categories, by period of the story; each event in places.json names its own.
PLACE_DECKS = [("beginnings", "Genesis and the Exodus"), ("land-kings", "The land and the kings"),
               ("jesus", "Where Jesus went"), ("church", "The early church")]
DECK_KEYS = [key for key, _ in PLACE_DECKS]
# Words of a place label that are not its name: "The Valley of Elah" is named by "Elah".
GENERIC = {"the", "mount", "sea", "valley", "of", "river"}


def place_href(record_id: str) -> str:
    return f"/study/atlas/map?place={record_id}"


def name_words(label: str) -> set[str]:
    return {bare(w).lower() for w in label.replace(SHY, "").split()} - GENERIC


def load_places(raw: dict, records: dict[str, dict]) -> dict[str, Character]:
    places = {}
    for key, entry in raw.items():
        where = f"places.json place {key!r}"
        record = records.get(entry.get("place", ""))
        if record is None:
            raise BuildError(f"{where}: place id {entry.get('place')!r} is not in data/places.json")
        character = Character(key, entry["label"], None, href=place_href(record["id"]))
        # "names": other forms the BSB uses for the place ("region of the Gerasenes" for Gerasa).
        character.giveaways = name_words(entry["label"]) | name_words(record["name"]) | {
            n.lower() for n in entry.get("names", [])}
        places[key] = character
    return places


def load_events(raw: list[dict]) -> list[Pair]:
    events = []
    for n, entry in enumerate(raw, start=1):
        try:
            events.append(Pair(entry["place"], entry["event"], entry["ref"], entry["check"], entry["tier"],
                               list(entry["decks"]), list(entry.get("notWith", [])), entry.get("keyVerse")))
        except KeyError as missing:
            raise BuildError(f"places.json event {n}: missing field {missing}") from None
    return events


def check_place_in_passage(event: Pair, place: Character, record: dict, verses: list) -> None:
    """The place's name is in the passage, and its record lists a verse of the passage."""
    where = f"place {event.who} / {event.story!r}"
    text = " ".join(v[3] for v in verses)
    names = place.giveaways
    if not any(re.search(rf"(?<![A-Za-z]){re.escape(name)}(?![a-z])", text, re.IGNORECASE) for name in names):
        raise BuildError(f"{where}: the place's name ({', '.join(sorted(names))}) is not in the BSB text of {event.ref}")
    ids = {verse_id(b, c, v) for b, c, v, _ in verses}
    if not ids & set(record["verses"]):
        raise BuildError(f"{where}: data/places.json record {record['id']} ({record['name']}) lists no verse of "
                         f"{event.ref}; is it the right place record?")


def make_place_id(place: str, event: str) -> str:
    return "mp-" + hashlib.sha1(f"{place}|{event}".encode()).hexdigest()[:6]


def places_document(raw: dict, sources: Sources, records: dict[str, dict]) -> tuple[dict, list[dict]]:
    places = load_places(raw["places"], records)
    events = load_events(raw["events"])
    seen = set()
    for event in events:
        verses = check_pair(event, places, sources, DECK_KEYS)
        check_place_in_passage(event, places[event.who], records[raw["places"][event.who]["place"]], verses)
        if (event.who, event.story) in seen:
            raise BuildError(f"place {event.who} / {event.story!r} is listed twice")
        seen.add((event.who, event.story))
        event.id = make_place_id(event.who, event.story)
    unused = set(places) - {e.who for e in events}
    if unused:
        raise BuildError(f"places.json: places with no event: {', '.join(sorted(unused))}")
    not_with = symmetric_not_with(events)
    check_shared_names(events, places, not_with)
    verse_count = {key: len(records[raw["places"][key]["place"]]["verses"]) for key in places}
    decks = deck_pools(events, places, sources, PLACE_DECKS, fame_of=lambda e: (verse_count[e.who],))
    body = {
        "decks": [{k: v for k, v in d.items() if not k.startswith("_")} for d in decks],
        "characters": {key: {"label": c.label, "href": c.href, "first": first_name(c.label)} for key, c in places.items()},
        "pairs": [{
            "id": e.id, "who": e.who, "story": e.story, "tier": e.tier, "decks": e.decks, "ref": show_ref(e.ref),
            "readerHref": reader_href(sources, e.ref),
            "keyVerse": show_ref(f"{e.key_book} {e.key_chapter}:{e.key_number}"),
            "keyVerseId": verse_id(e.key_book, e.key_chapter, e.key_number),
            "words": content_words(e.story), "notWith": not_with[e.id],
        } for e in events],
    }
    stamp = hashlib.sha1(json.dumps(body, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:12]
    head = {"about": "Memory match, Places. Generated by scripts/build-memory-match.py; do not edit.", "version": 1,
            "stamp": stamp}
    return {**head, **body}, decks

