"""Odd one out: the people pool and each person's fact sheet (design 5.1 and 5.2)."""
import re

from ooo_data import (bank_tags, load_apostle_ids, load_people, load_people_pages, load_person, load_prophets,
                      load_slugs, names_index)
from ooo_model import Item, Prop, Rule

FAME = {"easy": 60, "medium": 20, "hard": 8}  # mentions needed for each difficulty's pool (design 8)
ASKED = 3  # questions in the bank that must name a person before it counts towards Easy fame
FAMOUS_ANCHOR = 60  # family links count as rivals only to someone this well known (see the build notes)
DOMINANT = 4  # a shared name stays bare when its bearer has this many times the mentions of the next one
NT = "New Testament"
ERAS = {
    "Before the Flood": "from before the Flood", "Patriarchs": "from the time of the patriarchs",
    "Egypt and Wilderness": "from the time of the Exodus", "Conquest": "from the time of the conquest",
    "Judges": "from the time of the judges", "United Monarchy": "from the time of the united kingdom",
    "Divided Monarchy": "from the time of the divided kingdom", "Exile and Return": "from the time of the exile and return",
    NT: None,  # said already by the "new-testament" rule
}
NATIONS = {"Edom", "Canaan", "Egypt", "Arabia", "Ammon", "Syria", "Moab", "Mesopotamia", "Persia", "Persian",
           "Assyria", "Italy", "Midian", "Philistia", "Ethiopia", "Cush", "Sinai"}
MONARCH_ROLES = {"King", "Queen", "Pharaoh", "Emperor"}
ROLE_RIVALS = ("Levite", "Warrior", "Singer", "Giant")
RULING_QUEENS = {"athaliah-2ki-8-26", "queen-of-sheba-1ki-10-1", "candace-act-8-27"}  # queens who reigned, not consorts
UNITED_KINGDOM = {"saul-1sa-9-2", "ish-bosheth-2sa-2-8", "david-rut-4-17", "solomon-2sa-5-14"}
EXCLUDED_IDS = {"jesus-isa-7-14"}
BOOK_RIVALS = {"gospels": range(40, 44), "acts": range(44, 45), "law": range(1, 6), "genesis": range(1, 2)}
RELATIONS = {"pa": ("child", "is the only child of {}"), "ch": ("parent", "is the only parent of {}"),
             "si": ("sibling", "is the only brother or sister of {}"), "sp": ("spouse", "is the only husband or wife of {}")}


class PeopleFacts:
    """Everything the person fact sheets are read from, loaded once."""

    def __init__(self, facts: dict):
        self.facts = facts["people"]
        self.people = {p["id"]: p for p in load_people()}
        self.names = names_index([p for p in self.people.values() if not p.get("g")], "n", lambda p: p["c"])
        self.groups: dict[str, list[tuple[str, dict]]] = {}
        for stem, members in load_people_pages().items():
            for member in members:
                self.groups.setdefault(member["id"], []).append((stem, member))
        self.apostles = set(load_apostle_ids())
        self.prophets = load_prophets()
        self.slugs = load_slugs()
        tagged, _ = bank_tags()
        self.asked = {name for name, count in tagged.items() if count >= ASKED and len(self.names.get(name, [])) == 1}
        follow = self.facts["followedJesus"]
        self.curated = (set(self.groups) | self.apostles | set(follow["true"]) | set(self.facts["priests"]) |
                        set(self.facts["paulsCompanions"]) | set(self.facts["otBookNamed"]["true"]))

    def group_kinds(self, person_id: str) -> set[str]:
        return {member.get("kind") or stem for stem, member in self.groups.get(person_id, [])}

    def in_group(self, person_id: str, stem: str) -> dict | None:
        return next((member for s, member in self.groups.get(person_id, []) if s == stem), None)

    def display_name(self, person_id: str) -> str:
        label = self.facts["labels"].get(person_id)
        return label["name"] if label else self.people[person_id]["n"]


def resolve_label(src: PeopleFacts, entry: dict) -> tuple[str, str] | None:
    """(name, label) for a person, or None when a shared name cannot be told apart (design 6.4, 14)."""
    curated = src.facts["labels"].get(entry["id"])
    if curated:
        return curated["name"], curated["label"]
    others = [count for count, other in src.names.get(entry["n"], []) if other != entry["id"]]
    if not others or entry["c"] >= DOMINANT * max(others):
        return entry["n"], entry["n"]
    for _, member in src.groups.get(entry["id"], []):
        name = member.get("name", "")
        if name and name != entry["n"] and name not in src.names:
            return entry["n"], name
    return None


def in_pool(src: PeopleFacts, entry: dict) -> bool:
    if entry.get("g") or entry["id"] in EXCLUDED_IDS or entry["id"] in src.facts["exclude"]:
        return False
    if not re.fullmatch(r"[A-Z][A-Za-z'\- ]*", entry["n"]) or " and " in entry["n"]:
        return False
    return entry["c"] >= FAME["hard"] or entry["id"] in src.curated


def role_of(person: dict) -> str:
    return person.get("d", "").split(" living at the time")[0].strip()


def tri(true: bool, unknown: bool) -> bool | None:
    return True if true else (None if unknown else False)


def role_values(src: PeopleFacts, pid: str, person: dict) -> dict[str, bool | None]:
    """The tier-1 role rules: monarch, prophet, apostle, judge, priest (conservative: doubt means unknown)."""
    role, brief, kinds = role_of(person), person.get("b", ""), src.group_kinds(pid)
    unknown_roles = src.facts["unknownRoles"]
    prophet = src.prophets.get(pid, {}).get("kind")
    out = {
        "monarch": tri(role in MONARCH_ROLES - {"Queen"} or bool(kinds & {"king", "foreign"}) or pid in RULING_QUEENS,
                       role == "Queen" or bool(kinds & {"queen", "herod", "governor", "roman", "leader"}) or
                       bool(re.search(r"\b(king|queen|pharaoh|ruler|emperor|tetrarch|governor|prince)", brief, re.I))),
        "prophet": tri(role in ("Prophet", "Prophetess") or prophet in ("prophet", "writing", "nt") or
                       bool(kinds & {"prophet", "prophetess", "seer", "nt"}),
                       prophet == "false" or bool(kinds & {"false", "singer"}) or pid in unknown_roles["prophet"] or
                       bool(re.search(r"prophe|seer", brief, re.I))),
        "apostle": tri(pid in src.apostles, pid in unknown_roles["apostle"] or bool(re.search(r"apostle", brief, re.I))),
        "judge": tri(role == "Judge" or "judge" in kinds, "leader" in kinds or bool(re.search(r"judge", brief, re.I))),
        "priest": tri(role in ("Priest", "High Priest") or pid in src.facts["priests"],
                      role == "Levite" or bool(re.search(r"priest", brief, re.I))),
    }
    for role, table in unknown_roles.items():
        if pid in table:
            out[role] = None
    return out


def group_values(src: PeopleFacts, pid: str) -> dict[str, bool | None]:
    """The tier-2 group rules from the people-pages rulers and the apostle pages."""
    judah, israel = src.in_group(pid, "rulers-judah"), src.in_group(pid, "rulers-israel")
    persia, assyria = src.in_group(pid, "rulers-persia"), src.in_group(pid, "rulers-assyria-babylon")
    egypt = src.in_group(pid, "rulers-egypt")
    united = pid in UNITED_KINGDOM
    return {
        "the-twelve": pid in src.apostles and pid not in ("matthias-act-1-23", "paul-act-7-58"),
        "king-judah": tri(judah is not None, united),
        "king-israel": tri(israel is not None, united),
        "herod": src.in_group(pid, "rulers-herods") is not None,
        "roman": src.in_group(pid, "rulers-rome") is not None,
        "persian-king": bool(persia and persia.get("kind") == "foreign"),
        "assyrian-king": bool(assyria and assyria.get("realm") == "assyria"),
        "babylonian-king": bool(assyria and assyria.get("realm") == "babylon"),
        "pharaoh": tri(bool(egypt and egypt.get("realm") == "egypt" and "tirhakah" not in pid), bool(egypt)),
    }


def curated_values(src: PeopleFacts, pid: str, person: dict) -> tuple[dict[str, bool | None], dict[str, int]]:
    """Rules from facts.json and prophets.json, with the verse that shows each true fact."""
    facts, era = src.facts, person.get("e", "")
    follow, companions, books = facts["followedJesus"], facts["paulsCompanions"], facts["otBookNamed"]
    writing = src.prophets.get(pid, {}).get("kind") == "writing"
    gospels_only = era == NT and set(map(int, person.get("k", {}))) <= set(range(40, 44))
    values = {
        "followed-jesus": True if pid in follow["true"] else False if pid in follow["false"] or era != NT else None,
        "writing-prophet": writing,
        "ot-book": tri(writing or pid in books["true"], pid in books["unknown"]),
        "pauls-companion": True if pid in companions else False if era != NT or gospels_only else None,
        "son-of-jacob": person.get("s") == "M" and "israel-gen-25-26" in person.get("pa", []),
        "son-of-david": person.get("s") == "M" and "david-rut-4-17" in person.get("pa", []),
    }
    proof = {}
    for rule, table in (("followed-jesus", follow["true"]), ("pauls-companion", companions),
                        ("ot-book", books["true"]), ("priest", facts["priests"])):
        if pid in table:
            proof[rule] = table[pid]
    if writing:
        anchor = src.prophets[pid].get("anchor") or [src.prophets[pid].get("first")]
        if anchor[0]:
            proof["writing-prophet"] = proof["ot-book"] = anchor[0]
    return values, proof


def rival_values(src: PeopleFacts, pid: str, person: dict) -> dict[str, bool | None]:
    """Rival-only facts: era, tribe or nation, books named in, minor roles, family links to famous people."""
    out: dict[str, bool | None] = {}
    era = "" if pid in src.facts["unsure"]["era"] else person.get("e", "")
    for name in ERAS:
        out[f"era:{name}"] = None if not era else era == name
    tribe = person.get("t", "").lstrip(">").strip()
    nation = re.sub(r"^Tribe of ", "", tribe)
    for value in tribe_values(src):
        out[f"tribe:{value}"] = None if (not tribe or "?" in tribe) else nation == value
    out["foreign"] = None if (not tribe or "?" in tribe) else nation in NATIONS
    out["foreign"] = src.facts["nation"].get(pid, out["foreign"])
    books = set(map(int, person.get("k", {})))
    for name, numbers in BOOK_RIVALS.items():
        out[f"book:{name}"] = bool(books & set(numbers))
    for role in ROLE_RIVALS:
        out[f"role:{role}"] = role_of(person) == role
    for key, (relation, _) in RELATIONS.items():
        for other in person.get(key, []):
            if is_anchor(src, other, relation):
                out[f"rel:{relation}:{other}"] = True
    return {key: value for key, value in out.items() if value is not False}


def is_anchor(src: PeopleFacts, person_id: str, relation: str) -> bool:
    if relation == "child" and person_id in ("israel-gen-25-26", "david-rut-4-17"):
        return False  # sons of Jacob and of David are rules of their own
    entry = src.people.get(person_id)
    return bool(entry) and entry["c"] >= FAMOUS_ANCHOR


_TRIBES: list[str] = []


def tribe_values(src: PeopleFacts) -> list[str]:
    if not _TRIBES:
        found = set()
        for pid, entry in src.people.items():
            if entry["c"] >= FAME["hard"]:
                found.add(re.sub(r"^Tribe of ", "", load_person(pid).get("t", "").lstrip(">").strip()))
        _TRIBES.extend(sorted(value for value in found if value and "?" not in value))
    return _TRIBES


def person_props(src: PeopleFacts, rules: list[Rule]) -> dict[str, Prop]:
    props = {r.id: Prop(r.id, "person", r.tier, "rule", r.anchor, False, r.odd_only, r.odd) for r in rules}
    for name, phrase in ERAS.items():
        props[f"era:{name}"] = Prop(f"era:{name}", "person", 2, only=f"is the only one {phrase}" if phrase else "")
    for value in tribe_values(src):
        props[f"tribe:{value}"] = Prop(f"tribe:{value}", "person", 3)
    props["foreign"] = Prop("foreign", "person", 2, only="is the only one who was not an Israelite",
                            lacks="is the only Israelite")
    for name in BOOK_RIVALS:
        props[f"book:{name}"] = Prop(f"book:{name}", "person", 3)
    for role in ROLE_RIVALS:
        props[f"role:{role}"] = Prop(f"role:{role}", "person", 3)
    return props


def relation_prop(src: PeopleFacts, prop_id: str) -> Prop:
    _, relation, anchor = prop_id.split(":", 2)
    phrase = next(p for r, p in RELATIONS.values() if r == relation).format(src.display_name(anchor))
    return Prop(prop_id, "person", 2, anchor=anchor, only=phrase)


def build_people(facts: dict, rules: list[Rule]) -> tuple[list[Item], dict[str, Prop]]:
    src = PeopleFacts(facts)
    props = person_props(src, [r for r in rules if r.kind == "person"])
    items = []
    for entry in sorted(src.people.values(), key=lambda p: p["id"]):
        named = in_pool(src, entry) and resolve_label(src, entry)
        if not named:
            continue
        person = load_person(entry["id"])
        if person.get("s") not in ("M", "F") or person.get("e", "") not in ERAS:
            continue  # an unknown tier-1 fact leaves the pool (design 6.2 point 3)
        items.append(make_person(src, entry, person, named))
    for item in items:
        for prop_id in item.values:
            if prop_id.startswith("rel:") and prop_id not in props:
                props[prop_id] = relation_prop(src, prop_id)
    return items, props


def make_person(src: PeopleFacts, entry: dict, person: dict, named: tuple[str, str]) -> Item:
    pid = entry["id"]
    values: dict[str, bool | None] = {"woman": person["s"] == "F", "new-testament": person["e"] == NT}
    values.update(role_values(src, pid, person))
    values.update(group_values(src, pid))
    curated, proof = curated_values(src, pid, person)
    values.update(curated)
    values.update(rival_values(src, pid, person))
    for rule, ids in src.facts["unsure"].items():
        if rule != "about" and rule != "era" and pid in ids:
            values[rule] = None
    curated_member = pid in src.curated
    fame = {"easy": entry["c"] >= FAME["easy"] or entry["n"] in src.asked,
            "medium": entry["c"] >= FAME["medium"] or curated_member,
            "hard": entry["c"] >= FAME["hard"] or curated_member}
    aliases = frozenset(entry.get("o", [])) | ({entry["n"]} if entry["n"] != named[0] else frozenset())
    return Item(id=pid, kind="person", name=named[0], label=named[1], brief=person.get("b") or entry["b"],
                href=f"/people/{src.slugs.get(pid, pid)}", ref=person.get("f") or person["refs"][0], fame=fame,
                aliases=aliases, values={k: v for k, v in values.items() if v is not False}, proof=proof)
