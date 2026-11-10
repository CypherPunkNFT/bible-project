"""Bible twenty questions: tag values read straight from the site's people data, no model (design §5.2, stage 1).

Each value is (letter, evidence): letter y / n / ?, evidence a verse id (int) or a source note (str) or None.
Doubt always gives ?, never n: unsure never costs a player the game. Story and place tags are not set here.
"""
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
sys.path.insert(0, str(SITE / "scripts" / "odd-one-out"))
from ooo_data import read_json  # noqa: E402
from ooo_people import NATIONS, PeopleFacts, curated_values, group_values, role_values  # noqa: E402

ERAS = ["Before the Flood", "Patriarchs", "Egypt and Wilderness", "Conquest", "Judges", "United Monarchy",
        "Divided Monarchy", "Exile and Return", "New Testament"]
ERA_TAGS = ["era-flood", "era-patriarchs", "era-exodus", "era-conquest", "era-judges", "era-first-kings", "era-divided",
            "era-exile", "new-testament"]
NT = "New Testament"
# Book groups by book number. The narrative groups use the era rule; the rest are yes only when hand-listed.
BOOK_GROUPS = {
    "in-genesis": (range(1, 2), {"Before the Flood": 1, "Patriarchs": 1}),
    "in-law": (range(2, 6), {"Egypt and Wilderness": 1}),
    "in-joshua-ruth": (range(6, 9), {"Conquest": 1, "Judges": 1}),
    "in-samuel-kings": (range(9, 13), {"Judges": 5, "United Monarchy": 1, "Divided Monarchy": 1, "Exile and Return": 2}),
    "in-chronicles": (range(13, 15), {"United Monarchy": 1, "Divided Monarchy": 1, "Exile and Return": 2}),
    "in-ezra-esther": (range(15, 18), {"Exile and Return": 1}),
    "in-poetry": (range(18, 23), {}),
    "in-prophets": (range(23, 40), {}),
    "in-gospels": (range(40, 44), {NT: 1}),
    "in-acts": (range(44, 45), {NT: 1}),
    "in-letters": (range(45, 66), {}),
    "in-revelation": (range(66, 67), {}),
}
BOOK_NAMED = {  # a book of the Bible carries their name (design §4.2); "?" where only tradition ties the name to them
    "joshua-exo-17-9": "y", "ruth-rut-1-4": "y", "samuel-1sa-1-20": "y", "ezra-ezr-7-1": "y", "nehemiah-neh-1-1": "y",
    "esther-est-2-7": "y", "job-job-1-1": "y", "isaiah-2ki-19-2": "y", "jeremiah-2ch-35-25": "y", "ezekiel-ezk-1-3": "y",
    "daniel-ezk-14-14": "y", "hosea-hos-1-1": "y", "joel-jol-1-1": "y", "amos-amo-1-1": "y", "obadiah-oba-1-1": "y",
    "jonah-2ki-14-25": "y", "micah-jer-26-18": "y", "nahum-nam-1-1": "y", "habakkuk-hab-1-1": "y", "zephaniah-zep-1-1": "y",
    "haggai-ezr-5-1": "y", "zechariah-ezr-5-1": "y", "malachi-mal-1-1": "y", "matthew-mat-9-9": "y", "mark-act-12-12": "y",
    "luke-2co-13-13": "y", "john-mat-4-21": "y", "timothy-act-16-1": "y", "titus-2co-2-13": "y", "philemon-phm-1-1": "y",
    "peter-mat-4-18": "y", "solomon-2sa-5-14": "?", "james-mat-13-55": "?", "james-mat-4-21": "?", "james-mat-10-3": "?",
    "jude-mat-13-55": "?", "judas-mat-10-3": "?",
}
LETTER_WRITER = {"paul-act-7-58": ("y", 45001001), "peter-mat-4-18": ("y", 60001001), "jude-mat-13-55": ("y", 65001001),
                 "james-mat-13-55": ("?", None), "james-mat-4-21": ("?", None), "james-mat-10-3": ("?", None),
                 "judas-mat-10-3": ("?", None), "timothy-act-16-1": ("?", None), "silas-act-15-22": ("?", None),
                 "john-mat-4-21": ("?", None)}


def load_reigns() -> dict[str, dict]:
    """Rulers of Israel and Judah from the people-pages: realm, reign length and the verse that gives it."""
    reigns = {}
    for stem in ("rulers-israel", "rulers-judah"):
        for ruler in read_json(SITE / "src" / "data" / "people-pages" / f"{stem}.json")["rulers"]:
            length = next((r["length"] for r in ruler.get("records", []) if r.get("book") == "kings" and r.get("length")), None)
            reigns[ruler["id"]] = {"realm": ruler.get("realm"), "years": (length or {}).get("years"),
                                   "span": ((length or {}).get("span") or [None])[0]}
    return reigns


REIGNS = load_reigns()


def reign_values(pid: str, person: dict) -> dict:
    """ruled-judah, ruled-north, long-reign, in-1-kings, in-2-kings (design §5.5: separating tags for the kings)."""
    reign, counts, era = REIGNS.get(pid), book_counts(person), person.get("e", "")
    out = {}
    if reign:
        out["ruled-judah"] = ("y", reign["span"] or "people-pages: rulers-judah") if reign["realm"] == "judah" else ("n", None)
        out["ruled-north"] = ("y", reign["span"] or "people-pages: rulers-israel") if reign["realm"] == "israel" else ("n", None)
        years = reign["years"]
        out["long-reign"] = ("?", None) if years is None else (("y", reign["span"]) if years >= 20 else ("n", None))
    else:
        out["ruled-judah"] = out["ruled-north"] = ("n", None)
        out["long-reign"] = ("n", None) if pid not in UNITED else ("y", "1 Kings 2:11 / 11:42 / 1 Samuel 13:1")
    for tag, book in (("in-1-kings", 11), ("in-2-kings", 12)):
        named = counts.get(book, 0)
        if not named:
            out[tag] = ("n", None)
        elif reign and reign["span"]:
            out[tag] = ("y", reign["span"]) if reign["span"] // 1_000_000 == book else ("?", None)
        elif era in ("United Monarchy", "Divided Monarchy", "Exile and Return") and named >= 5 and not reign:
            out[tag] = ("y", first_ref_in(person, range(book, book + 1)) or "people data: books")
        else:
            out[tag] = ("?", None)
    return out


UNITED = {"saul-1sa-9-2": None, "david-rut-4-17": None, "solomon-2sa-5-14": None}


def tri(value) -> tuple[str, object]:
    return ("y" if value else "?" if value is None else "n"), None


def book_counts(person: dict) -> dict[int, int]:
    raw = person.get("k") or {}
    return {int(book): count for book, count in raw.items()}


def first_ref_in(person: dict, books: range) -> int | None:
    return next((ref for ref in person.get("refs") or [] if ref // 1_000_000 in books), None)


def era_values(pid: str, person: dict, unsure_era: set) -> dict:
    era = person.get("e", "")
    if pid in unsure_era or era not in ERAS:
        return {tag: ("?", None) for tag in ERA_TAGS}
    at = ERAS.index(era)
    out = {}
    for index, tag in enumerate(ERA_TAGS):
        if index == at:
            out[tag] = ("y", "people data: era")
        elif abs(index - at) == 1 and min(index, at) >= 2 and NT not in (era, ERAS[index]):
            out[tag] = ("?", None)  # neighbouring periods from the Exodus on overlap in a life (Joshua, Samuel)
        else:
            out[tag] = ("n", None)
    return out


def nation_values(pid: str, person: dict, ooo_foreign) -> dict:
    """israelite / foreign. Before Jacob's sons both are unsure (design §4.2); NT tribes in the data are unreliable."""
    era, tribe = person.get("e", ""), (person.get("t") or "").lstrip(">").strip()
    nation = re.sub(r"^Tribe of ", "", tribe)
    if tribe in NATIONS or nation in NATIONS:
        return {"israelite": ("n", None), "foreign": ("y", f"people data: {nation}")}
    if era == NT or era == "Before the Flood" or "?" in tribe:
        return {"israelite": ("?", None), "foreign": ("?", None)}
    if tribe.startswith("Tribe of") or tribe == "Israel":
        return {"israelite": ("y", f"people data: {tribe}"), "foreign": ("n", None)}
    if ooo_foreign is True:
        return {"israelite": ("n", None), "foreign": ("y", "odd-one-out nation table")}
    return {"israelite": ("?", None), "foreign": ("?", None)}


def tribe_values(person: dict) -> dict:
    tribe = (person.get("t") or "").strip()
    if person.get("e") == NT or not tribe.startswith("Tribe of") or "?" in tribe:
        known_other = bool(tribe) and person.get("e") != NT and "?" not in tribe and tribe not in ("Early Patriarch", "Israel")
        letter = "n" if known_other else "?"
        return {"tribe-judah": (letter, None), "tribe-benjamin": (letter, None), "levite": (letter, None)}
    name = tribe.removeprefix("Tribe of ").strip()
    pick = lambda wanted: ("y", f"people data: {tribe}") if name == wanted else ("n", None)
    return {"tribe-judah": pick("Judah"), "tribe-benjamin": pick("Benjamin"), "levite": pick("Levi")}


def book_values(person: dict) -> dict:
    counts, era = book_counts(person), person.get("e", "")
    out = {}
    for tag, (books, eras) in BOOK_GROUPS.items():
        named = sum(counts.get(book, 0) for book in books)
        if not named:
            out[tag] = ("n", None)
        elif era in eras and named >= eras[era]:
            out[tag] = ("y", first_ref_in(person, books) or "people data: books")
        else:
            out[tag] = ("?", None)  # only mentioned there, or a group decided by hand
    return out


def role_tags(src: PeopleFacts, pid: str, person: dict) -> dict:
    roles, groups = role_values(src, pid, person), group_values(src, pid)
    curated, proof = curated_values(src, pid, person)
    ruler = roles["monarch"]
    over_israel = bool(groups["king-judah"] or groups["king-israel"]) or pid in ("saul-1sa-9-2", "david-rut-4-17",
                                                                               "solomon-2sa-5-14", "ish-bosheth-2sa-2-8")
    out = {
        "ruler": tri(ruler), "pharaoh": tri(groups["pharaoh"]), "roman": tri(groups["roman"]), "herod": tri(groups["herod"]),
        "ruler-israel": ("y", "people-pages: rulers") if over_israel else tri(None if ruler is None else False),
        "ruler-foreign": tri(None if ruler is None else (bool(ruler) and not over_israel)),
        "prophet": tri(roles["prophet"]), "priest": tri(roles["priest"]), "judge": tri(roles["judge"]),
        "the-twelve": tri(groups["the-twelve"] or pid == "matthias-act-1-23"),
        "followed-jesus": tri(curated["followed-jesus"]), "pauls-companion": tri(curated["pauls-companion"]),
        "son-of-jacob": tri(curated["son-of-jacob"]), "son-of-david": tri(curated["son-of-david"]),
    }
    for rule, tag in (("followed-jesus", "followed-jesus"), ("pauls-companion", "pauls-companion"), ("priest", "priest")):
        if rule in proof and out[tag][0] == "y":
            ref = proof[rule]
            out[tag] = ("y", ref[0] if isinstance(ref, list) else ref)
    return out


def family_values(person: dict, pool_ids: set) -> dict:
    siblings = person.get("si") or []
    sibling = ("y", "people data: siblings") if set(siblings) & pool_ids else ("n", None) if siblings else ("?", None)
    return {"married": ("y", "people data: spouse") if person.get("sp") else ("?", None),
            "children": ("y", "people data: children") if person.get("ch") else ("?", None),
            "famous-sibling": sibling}


def data_values(src: PeopleFacts, pid: str, person: dict, pool_ids: set) -> dict:
    """Every data-owned tag for one person."""
    values = {"woman": {"F": ("y", "people data: sex"), "M": ("n", None)}.get(person.get("s"), ("?", None))}
    values.update(era_values(pid, person, set(src.facts["unsure"]["era"])))
    values.update(nation_values(pid, person, src.facts["nation"].get(pid)))
    values.update(tribe_values(person))
    values.update(role_tags(src, pid, person))
    values.update(family_values(person, pool_ids))
    values.update(book_values(person))
    values.update(reign_values(pid, person))
    values["book-named"] = (BOOK_NAMED.get(pid, "n"), "hand table: book names" if BOOK_NAMED.get(pid) == "y" else None)
    values["letter-writer"] = LETTER_WRITER.get(pid, ("n", None))
    gospels, church = values["in-gospels"][0], [values[t][0] for t in ("in-acts", "in-letters", "in-revelation")]
    is_nt = person.get("e") == NT
    values["era-gospels"] = (gospels, values["in-gospels"][1]) if is_nt else ("n", None)
    values["era-church"] = (("y", None) if "y" in church else ("n", None) if set(church) == {"n"} else ("?", None)) if is_nt \
        else ("n", None)
    return values


def load_sources() -> PeopleFacts:
    return PeopleFacts(read_json(SITE / "scripts" / "odd-one-out" / "facts.json"))
