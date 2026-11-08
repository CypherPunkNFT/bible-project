"""Odd one out: the place and book pools and their fact sheets (design 5.1 and 5.2)."""
from ooo_data import Bible, Catalogue, load_letters, load_paul_places, load_places, names_index
from ooo_model import Item, Prop, Rule

PLACE_FAME = {"easy": 15, "medium": 6, "hard": 3}  # verses needed for each difficulty's pool (design 8)
DOMINANT = 4
# places.json type -> rule id; mountains, hills and ranges are one class (design 5.2, review point 5)
PLACE_CLASSES = {"settlement": "settlement", "region": "region", "mountain": "mountain", "hill": "mountain",
                 "mountain range": "mountain", "river": "river", "island": "island", "body of water": "sea"}
CLASS_WORDS = {"settlement": "A town or city", "region": "A land or region", "mountain": "A mountain or hill",
               "river": "A river", "island": "An island", "sea": "A sea or lake"}
# A rough frame for the land of Israel west of the Jordan, for the rival "outside the land of Israel".
ISRAEL = {"lat": (30.9, 33.35), "lon": (34.2, 35.75)}
BORDERLAND_LAT, BORDERLAND_LON = 33.0, 35.4  # the coast north of Galilee
PLACE_BOOK_RIVALS = {"gospels": range(40, 44), "acts": range(44, 45), "genesis": range(1, 2)}
BOOK_GROUPS = {"law": "Book of the Law", "history": "History book", "poetry": "Poetry and wisdom book",
               "prophets": "Prophet book", "gospels": "Gospel", "acts": "Church history", "letters": "Letter",
               "revelation": "Prophecy"}
DIRECTIONS = {"North", "South", "East", "West"}
MAJOR_PROPHETS = {"ISA", "JER", "LAM", "EZK", "DAN"}


def place_name(entry: dict, labels: dict, index: dict) -> tuple[str, str] | None:
    """(name, label) for a place, or None when a shared name cannot be told apart (design 5.1)."""
    if entry["id"] in labels:
        return labels[entry["id"]]["name"], labels[entry["id"]]["label"]
    others = [count for count, other in index[entry["name"]] if other != entry["id"]]
    if not others or len(entry["verses"]) >= DOMINANT * max(others):
        return entry["name"], entry["name"]
    return None


def usable_place(entry: dict, place_facts: dict) -> bool:
    if entry["type"] not in PLACE_CLASSES or entry["id"] in place_facts["exclude"] or not entry["verses"]:
        return False
    if entry["name"] in DIRECTIONS:
        return False
    # The data files several ports and lands of doubtful site as islands (Tarshish, Ophir, Ezion-geber, Elath).
    return not (entry["type"] == "island" and entry.get("confidence", 0) < 0.5)


def place_values(entry: dict, facts: dict, paul: dict[str, int], name_books: set[int]) -> dict[str, bool | None]:
    """`name_books`: the books naming any place of this name. A player knows "Samaria" from Acts even though the data
    files the city's verses and the region's under two entries."""
    pid, books = entry["id"], name_books
    values: dict[str, bool | None] = {rule: PLACE_CLASSES[entry["type"]] == rule for rule in CLASS_WORDS}
    values["seven-churches"] = pid in facts["sevenChurches"]
    values["philistine-city"] = pid in facts["philistineCities"]
    values["pauls-journeys"] = True if pid in paul else (None if books & set(range(44, 58)) else False)
    values["nt-only"] = min(books) >= 40
    values["ot-only"] = max(books) < 40
    # Low confidence, the Phoenician coast in the north of the frame (Tyre) and the Philistine cities: a reader
    # could argue either way, so "in the land of Israel" is unknown for them.
    if entry.get("confidence", 0) < 0.5 or pid in facts["philistineCities"]:
        values["outside-israel"] = None
    else:
        inside = all(lo <= entry[axis] <= hi for axis, (lo, hi) in ISRAEL.items())
        phoenicia = inside and entry["lat"] > BORDERLAND_LAT and entry["lon"] < BORDERLAND_LON
        values["outside-israel"] = None if phoenicia else not inside
    for name, numbers in PLACE_BOOK_RIVALS.items():
        values[f"book:{name}"] = bool(books & set(numbers))
    return values


def place_props(rules: list[Rule]) -> dict[str, Prop]:
    props = {r.id: Prop(r.id, "place", r.tier, "rule", None, False, r.odd_only, r.odd) for r in rules}
    props["outside-israel"] = Prop("outside-israel", "place", 2, only="is the only one outside the land of Israel",
                                   lacks="is the only one in the land of Israel")
    for name in PLACE_BOOK_RIVALS:
        props[f"book:{name}"] = Prop(f"book:{name}", "place", 3)
    return props


def build_places(facts: dict, rules: list[Rule]) -> tuple[list[Item], dict[str, Prop]]:
    place_facts = facts["places"]
    places = load_places()
    index = names_index(places, "name", lambda p: len(p["verses"]))
    paul = load_paul_places()
    by_id = {p["id"]: p for p in places}
    curated = set(place_facts["sevenChurches"]) | set(place_facts["philistineCities"]) | set(paul)
    items = []
    for entry in sorted(places, key=lambda p: p["id"]):
        entry = {**entry, "type": place_facts["types"].get(entry["id"], entry["type"])}
        if not usable_place(entry, place_facts):
            continue
        count, is_curated = len(entry["verses"]), entry["id"] in curated
        if count < PLACE_FAME["hard"] and not is_curated:
            continue
        named = place_name(entry, place_facts["labels"], index)
        if not named:
            continue
        name_books = {v // 1_000_000 for _, other in index[entry["name"]] for v in by_id[other]["verses"]}
        if entry["id"] in place_facts["labels"]:
            name_books = {v // 1_000_000 for v in entry["verses"]}  # a qualified label names this place alone
        values = place_values(entry, place_facts, paul, name_books)
        proof = {rule: table[entry["id"]] for rule, table in (("seven-churches", place_facts["sevenChurches"]),
                 ("philistine-city", place_facts["philistineCities"]), ("pauls-journeys", paul)) if entry["id"] in table}
        fame = {"easy": count >= PLACE_FAME["easy"],
                "medium": count >= PLACE_FAME["medium"] or is_curated, "hard": True}
        brief = f"{CLASS_WORDS[PLACE_CLASSES[entry['type']]]}, named in {count} verse{'s' if count > 1 else ''}"
        items.append(Item(id=entry["id"], kind="place", name=named[0], label=named[1], brief=brief,
                          href=f"/study/atlas/map?place={entry['id']}", ref=entry["verses"][0], fame=fame,
                          values={k: v for k, v in values.items() if v is not False}, proof=proof))
    return items, place_props([r for r in rules if r.kind == "place"])


def book_group(book: dict, facts: dict) -> str:
    code = book["code"]
    if code in facts["law"]:
        return "law"
    if code in facts["history"]:
        return "history"
    if code == "ACT":
        return "acts"
    return {"epistles": "letters"}.get(book["section"], book["section"])


def book_values(book: dict, group: str, facts: dict, letters: dict, chapters: int) -> dict[str, bool | None]:
    code = book["code"]
    named, to_one = facts["namedAfterPerson"], facts["toOnePerson"]
    author = letters.get(code, {}).get("author", "")
    return {
        "nt-book": book["num"] >= 40, "law": group == "law", "ot-history": group == "history",
        "poetry": group == "poetry", "prophets": group == "prophets", "gospel": code in facts["gospels"],
        "letter": group == "letters", "pauline": author.startswith("Paul"), "one-chapter": chapters == 1,
        "named-person": True if code in named["true"] else None if code in named["unknown"] else False,
        "to-one-person": True if code in to_one["true"] else None if code in to_one["unknown"] else False,
        "group:acts": group == "acts", "group:revelation": group == "revelation",
        "major-prophet": code in MAJOR_PROPHETS, "minor-prophet": group == "prophets" and code not in MAJOR_PROPHETS,
        "general-letter": group == "letters" and not author.startswith("Paul"),
    }


def book_props(rules: list[Rule]) -> dict[str, Prop]:
    props = {r.id: Prop(r.id, "book", r.tier, "rule", None, False, r.odd_only, r.odd) for r in rules}
    extra = {"group:acts": "is the only history of the early church", "group:revelation": "is the only book of Revelation",
             "major-prophet": "is the only one of the major prophets", "minor-prophet": "is the only one of the minor prophets",
             "general-letter": "is the only general letter"}
    for prop_id, phrase in extra.items():
        props[prop_id] = Prop(prop_id, "book", 2, only=phrase)
    return props


def build_books(facts: dict, rules: list[Rule], catalogue: Catalogue, bible: Bible) -> tuple[list[Item], dict[str, Prop]]:
    book_facts, letters = facts["books"], load_letters()
    items = []
    for book in catalogue.books:
        chapters = bible.chapters(book["code"])
        group = book_group(book, book_facts)
        values = book_values(book, group, book_facts, letters, chapters)
        brief = f"{BOOK_GROUPS[group]}, {chapters} chapter{'s' if chapters > 1 else ''}"
        items.append(Item(id=book["code"].lower(), kind="book", name=book["name"], label=book["name"], brief=brief,
                          href=f"/read/bsb/{book['code']}/1", ref=book["num"] * 1_000_000 + 1001,
                          fame={d: True for d in PLACE_FAME}, values={k: v for k, v in values.items() if v is not False}))
    return items, book_props([r for r in rules if r.kind == "book"])
