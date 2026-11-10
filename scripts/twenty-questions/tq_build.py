"""Bible twenty questions: build the game files from the pool, the site data and the hand tags (design §5, §4.5).

Reads pool.source.json, tags.source.json, story.source.json, jesus.source.json and the site's people data.
Writes tagged.json (every value with its source, not shipped), build-notes.json (for check.ts's review sheet),
src/data/twenty-questions/twenty-questions.json and twenty-questions-evidence.json (shipped), and
server/twenty-questions-ids.ts (the ids the report endpoint accepts).
Usage: py -3.12 scripts/twenty-questions/tq_build.py   then   node --experimental-strip-types scripts/twenty-questions/check.ts
"""
import hashlib
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tq_data import ERAS, SITE, data_values, load_sources  # noqa: E402
from ooo_data import Bible, Catalogue, bank_tags, load_person, load_slugs, read_json  # noqa: E402

OUT_DIR = SITE / "src" / "data" / "twenty-questions"
LETTERS = {"y": "y", "n": "n", "?": "?", "-": "-"}
REF = re.compile(r"^([1-3]?[A-Z]{2,3}) (\d+):(\d+)( \(context\))?$")  # "(context)": first-person or narrated scene, checked by hand


class Refs:
    """Turns "EXO 4:3" into a verse id and checks it against the BSB text and the person (design §5.4)."""

    def __init__(self):
        self.catalogue = Catalogue()
        self.bible = Bible(self.catalogue)

    def parse(self, text: str) -> int:
        match = REF.match(text.strip())
        if not match or match[1] not in self.catalogue.by_code:
            raise ValueError(f"reference {text!r}: expected a form like 'EXO 4:3' with a book code from data/catalog.json")
        return self.catalogue.by_code[match[1]]["num"] * 1_000_000 + int(match[2]) * 1000 + int(match[3])

    def fits(self, verse: int, person: dict, names: list[str]) -> str | None:
        """None when the verse is real and belongs to the person; otherwise why not."""
        text = self.bible.text(verse)
        if text is None:
            return "not in the BSB text"
        if verse in (person.get("refs") or []) or any(re.search(rf"\b{re.escape(name)}\b", text) for name in names):
            return None
        return "neither in the person's verse list nor naming them"


def names_of(entry: dict, row: dict) -> list[str]:
    words = {row["n"], *row.get("o", []), entry["label"].split(" (")[0]}
    return sorted({w for w in words if w} | {w.split()[0] for w in words if w and w.split()[0][0].isupper()})


def hand_value(tag_rule: dict, pid: str, entry: dict, person: dict, data: dict) -> tuple[str, str | None] | None:
    """The story file's value for one person and tag: listed values first, then the tag's default rule."""
    if pid in tag_rule.get("yes", {}):
        return "y", tag_rule["yes"][pid]
    for letter, key in (("n", "no"), ("?", "unsure")):
        listed = tag_rule.get(key, {})
        if pid in listed:
            return letter, (listed[pid] if isinstance(listed, dict) else None)
    for source in tag_rule.get("yesFrom", []):
        if data.get(source, ("?",))[0] == "y":
            return "y", f"follows from {source}"
    if tag_rule.get("unsureRulers") and data.get("ruler", ("?",))[0] != "n":
        return "?", None  # rulers often fought, built, were killed or captured; left for the model run to settle
    if person.get("e") in tag_rule.get("unsureEra", []):
        return "?", None
    closed = tag_rule.get("closed")
    if closed == "all" or (closed == "tier1" and entry["tier"] == 1):
        return "n", None
    if person.get("e") in tag_rule.get("noEra", []):
        return "n", None
    if tag_rule.get("noMen") and person.get("s") == "M":
        return "n", None
    return None


def person_values(ctx: dict, entry: dict) -> tuple[dict, list]:
    pid, refs, notes = entry["id"], ctx["refs"], []
    row, person = ctx["people"][pid], load_person(pid)
    if pid == ctx["jesus_id"]:
        return {tag: {"v": value[0], "by": "hand", **({"ref": refs.parse(value[1])} if len(value) > 1 and REF.match(value[1])
                                                     else {})} for tag, value in ctx["jesus"].items()}, notes
    values, data = {}, data_values(ctx["src"], pid, person, ctx["pool_ids"])
    for tag, (letter, evidence) in data.items():
        values[tag] = {"v": letter, "by": "data", **({"ref": evidence} if isinstance(evidence, int) else
                                                     {"src": evidence} if evidence else {})}
    for tag in ctx["tags"]:
        rule = ctx["story"]["tags"].get(tag["id"])
        found = hand_value(rule, pid, entry, person, data) if rule else None
        if found is None:
            if tag["source"] == "hand":
                values[tag["id"]] = {"v": "?", "by": "hand"}
            continue
        letter, evidence = found
        value = {"v": letter, "by": "hand"}
        if evidence and not REF.match(evidence):
            value["src"] = evidence  # a hand note ("Acts 4:36 calls him a Levite" style notes stay notes)
        elif letter == "y" and evidence:
            try:
                verse = refs.parse(evidence)
            except ValueError as error:
                raise SystemExit(f"story.source.json, tag {tag['id']}, person {pid}: {error}") from error
            problem = None if evidence.endswith("(context)") else refs.fits(verse, person, names_of(entry, row))
            if evidence.endswith("(context)"):
                notes.append(f"{entry['label']} · {tag['id']}: {evidence} is a context reference (the verse does not name them); kept")
            if problem:
                notes.append(f"{entry['label']} · {tag['id']}: {evidence} {problem}; value dropped to unsure")
                value = {"v": "?", "by": "hand", "dropped": evidence}
            else:
                value["ref"] = verse
        if pid in rule.get("slip", []) and value["v"] in "yn":
            value["slip"] = True
        values[tag["id"]] = value
    return values, notes


# Other names the search finds a person by. The people list's alias field mixes in titles ("Lord", "God" under Jacob) and
# peoples ("Israelite", "Judean"), which would put the wrong person under a search, so those are dropped. Jesus keeps
# his titles: "Christ" and "Messiah" are how many players will look for him. Another person's name stays (Saul is Paul).
NOT_NAMES = {"god", "lord", "christ", "christian", "messiah", "jew", "jewish", "jews", "hebrew"}


def other_names(row: dict, label: str, person_id: str) -> list[str]:
    names = {row["n"], *row.get("o", [])} - {label}
    titles_ok = person_id == "jesus-isa-7-14"
    return sorted(n for n in names if (titles_ok and n != "Christian") or (n.lower() not in NOT_NAMES and not re.search(r"(ites?|itess|ean)$", n)))


def letter_of(value: dict) -> str:
    letter = LETTERS[value["v"]]
    return letter.upper() if value.get("slip") else letter


def fame_order(pool: list[dict], people: dict) -> dict[str, int]:
    tagged, _ = bank_tags()
    asked = lambda entry: tagged.get(people[entry["id"]]["n"], 0)
    ranked = sorted(pool, key=lambda e: (e["tier"], e["id"] != "jesus-isa-7-14", -asked(e), -people[e["id"]]["c"]))
    return {entry["id"]: rank for rank, entry in enumerate(ranked)}


def write_json(path: Path, value, indent=None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=indent, separators=None if indent else (",", ":")) + "\n",
                    encoding="utf-8", newline="\n")


def build() -> None:
    tags = read_json(HERE / "tags.source.json")["tags"]
    pool = read_json(HERE / "pool.source.json")["people"]
    people = {p["id"]: p for p in read_json(SITE / "data" / "study" / "people.json")}
    ctx = {"tags": tags, "people": people, "pool_ids": {e["id"] for e in pool}, "refs": Refs(), "src": load_sources(),
           "story": read_json(HERE / "story.source.json"), "jesus_id": "jesus-isa-7-14",
           "jesus": read_json(HERE / "jesus.source.json")["values"]}
    unknown = sorted(set(ctx["story"]["tags"]) - {t["id"] for t in tags})
    if unknown:
        raise SystemExit(f"story.source.json names tags that tags.source.json does not have: {unknown}")
    for tag, rule in ctx["story"]["tags"].items():
        listed = {key: set(rule.get(key) or ()) for key in ("yes", "no", "unsure", "slip")}
        strays = sorted(set().union(*listed.values()) - ctx["pool_ids"])
        twice = sorted((listed["yes"] & listed["unsure"]) | (listed["yes"] & listed["no"]) | (listed["no"] & listed["unsure"]))
        if strays or twice:
            raise SystemExit(f"story.source.json tag {tag}: ids not in the pool {strays}; ids listed under two values {twice}")
    missing = sorted({t["id"] for t in tags} - set(ctx["jesus"]))
    if missing:
        raise SystemExit(f"jesus.source.json must set every tag by hand (design §3.4); missing: {missing}")
    slugs, fame = load_slugs(), fame_order(pool, people)
    tagged, shipped, evidence, notes = [], [], {}, []
    for entry in pool:
        values, person_notes = person_values(ctx, entry)
        notes += person_notes
        tagged.append({"id": entry["id"], "label": entry["label"], "tier": entry["tier"], "values": values})
        row, person = people[entry["id"]], load_person(entry["id"])
        also = other_names(row, entry["label"], entry["id"])
        shipped.append({"id": entry["id"], "label": entry["label"], "also": also, "t": entry["tier"], "f": fame[entry["id"]],
                        "slug": slugs.get(entry["id"], ""), "b": row.get("b", ""), "s": person.get("short", ""),
                        "v": "".join(letter_of(values[t["id"]]) for t in tags)})
        refs = {t["id"]: values[t["id"]]["ref"] for t in tags if isinstance(values[t["id"]].get("ref"), int)}
        if refs:
            evidence[entry["id"]] = refs
    tag_rows = [{"id": t["id"], "q": t["question"], "g": t["group"], "l": 0 if t["level"] == "everyday" else 1,
                 **({"implies": t["implies"]} if t.get("implies") else {}),
                 **({"excludes": t["excludes"]} if t.get("excludes") else {})} for t in tags]
    digest = hashlib.sha256(json.dumps([tag_rows, shipped], sort_keys=True).encode()).hexdigest()[:10]
    version = f"tq-{digest}"
    write_json(OUT_DIR / "twenty-questions.json", {"version": version, "tags": tag_rows, "people": shipped})
    write_json(OUT_DIR / "twenty-questions-evidence.json", {"version": version, "refs": evidence})
    write_json(HERE / "tagged.json", tagged, indent=1)
    write_json(HERE / "build-notes.json", {"version": version, "droppedRefs": notes, "eras": ERAS}, indent=1)
    write_server_ids(version, [e["id"] for e in pool], [t["id"] for t in tags])
    print(f"twenty-questions.json {version}: {len(shipped)} people × {len(tags)} tags; {len(notes)} refs dropped")


def write_server_ids(version: str, people_ids: list[str], tag_ids: list[str]) -> None:
    lines = ["// Generated by scripts/twenty-questions/tq_build.py: do not edit. The ids the twenty-questions report",
             "// endpoint accepts (design §10.3), kept out of the 100 KB game file so the worker stays small.",
             f"export const TQ_VERSION = {json.dumps(version)};",
             f"export const TQ_PEOPLE: ReadonlySet<string> = new Set({json.dumps(people_ids)});",
             f"export const TQ_TAGS: ReadonlySet<string> = new Set({json.dumps(tag_ids)});", ""]
    (SITE / "server" / "twenty-questions-ids.ts").write_text("\n".join(lines), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    build()
