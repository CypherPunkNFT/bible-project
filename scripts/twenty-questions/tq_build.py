"""Bible twenty questions: build the game files from the pool, the site data, the corrections and the model values (design §5, §4.5).

Value chain per person and tag (tq_chain.py): Jesus's hand file; a hand correction of a data value (corrections.source.json);
a final data value; the merged model value (model.values.json, written by tq_merge.py from the two BatchRunner passes);
otherwise unsure. Writes tagged.json (every value with its source, not shipped), build-notes.json (for check.ts's review
sheet), src/data/twenty-questions/twenty-questions.json and twenty-questions-evidence.json (shipped), and
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
from tq_chain import JESUS, SITE, asked_tags, load_corrections, settled_values  # noqa: E402
from tq_data import ERAS, load_sources  # noqa: E402
from tq_refs import Refs  # noqa: E402
from ooo_data import bank_tags, load_person, load_slugs, read_json  # noqa: E402

OUT_DIR = SITE / "src" / "data" / "twenty-questions"
LETTERS = {"y": "y", "n": "n", "?": "?", "-": "-"}
MODEL_FILE = HERE / "model.values.json"


def jesus_values(ctx: dict) -> dict:
    values = {}
    for tag, value in ctx["jesus"].items():
        parsed = ctx["refs"].parse(value[1]) if len(value) > 1 else None
        values[tag] = {"v": value[0], "by": "hand", **({"ref": parsed} if parsed else {})}
    return values


def person_values(ctx: dict, entry: dict) -> tuple[dict, list[str]]:
    """Every tag's value for one pool member, with where it came from, plus notes for the review sheet."""
    pid, notes = entry["id"], []
    if pid == JESUS:
        return jesus_values(ctx), notes
    settled = settled_values(ctx["src"], ctx["tags"], entry, ctx["pool_ids"], ctx["corrections"], ctx["refs"])
    model = ctx["model"]["people"].get(pid)
    if model is None:
        raise SystemExit(f"model.values.json has no entry for {entry['label']} ({pid}); run the passes and tq_merge.py first")
    values = dict(settled)
    for tag in asked_tags(ctx["tags"], settled):
        found = model.get(tag["id"])
        if found is None:
            notes.append(f"{entry['label']} · {tag['id']}: the model was never asked (stale model.values.json); unsure")
            values[tag["id"]] = {"v": "?", "by": "model"}
            continue
        value = {"v": found["v"], "by": found["by"]}
        if tag["source"] == "data":
            value["dataWas"] = "?"  # the data stage left this open; check.ts's check 2 refuses a model value anywhere else
        if isinstance(found.get("ref"), int):
            value["ref"] = found["ref"]
        if found.get("why"):
            value["why"] = found["why"]
        if found.get("slip") and found["v"] in "yn":
            value["slip"] = True
        values[tag["id"]] = value
    for tag, people in ctx["corrections"]["slips"].items():
        if pid in people and tag in values and values[tag]["v"] in "yn":
            values[tag]["slip"] = True
            values[tag]["slipBy"] = "hand"
    return values, notes


# Other names the search finds a person by. The people list's alias field mixes in titles ("Lord", "God" under Jacob) and
# peoples ("Israelite", "Judean"), which would put the wrong person under a search, so those are dropped. Jesus keeps
# his titles: "Christ" and "Messiah" are how many players will look for him. Another person's name stays (Saul is Paul).
NOT_NAMES = {"god", "lord", "christ", "christian", "messiah", "jew", "jewish", "jews", "hebrew"}


def other_names(row: dict, label: str, person_id: str) -> list[str]:
    names = {row["n"], *row.get("o", [])} - {label}
    titles_ok = person_id == JESUS
    return sorted(n for n in names if (titles_ok and n != "Christian") or (n.lower() not in NOT_NAMES and not re.search(r"(ites?|itess|ean)$", n)))


def letter_of(value: dict) -> str:
    letter = LETTERS[value["v"]]
    return letter.upper() if value.get("slip") else letter


def fame_order(pool: list[dict], people: dict) -> dict[str, int]:
    tagged, _ = bank_tags()
    asked = lambda entry: tagged.get(people[entry["id"]]["n"], 0)
    ranked = sorted(pool, key=lambda e: (e["tier"], e["id"] != JESUS, -asked(e), -people[e["id"]]["c"]))
    return {entry["id"]: rank for rank, entry in enumerate(ranked)}


def write_json(path: Path, value, indent=None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=indent, separators=None if indent else (",", ":")) + "\n",
                    encoding="utf-8", newline="\n")


def load_context() -> dict:
    tags = read_json(HERE / "tags.source.json")["tags"]
    pool = read_json(HERE / "pool.source.json")["people"]
    if not MODEL_FILE.is_file():
        raise SystemExit(f"{MODEL_FILE.name} is missing: run the BatchRunner passes and tq_merge.py first (design §5.3-§5.4)")
    model = read_json(MODEL_FILE)
    if model.get("pilot"):
        raise SystemExit(f"{MODEL_FILE.name} holds only the pilot; merge the full passes first")
    ctx = {"tags": tags, "pool": pool, "pool_ids": {e["id"] for e in pool}, "refs": Refs(), "src": load_sources(), "model": model,
           "people": {p["id"]: p for p in read_json(SITE / "data" / "study" / "people.json")}, "corrections": load_corrections(),
           "jesus": read_json(HERE / "jesus.source.json")["values"]}
    missing = sorted({t["id"] for t in tags} - set(ctx["jesus"]))
    if missing:
        raise SystemExit(f"jesus.source.json must set every tag by hand (design §3.4); missing: {missing}")
    for tag, people in ctx["corrections"]["slips"].items():
        strays = sorted(set(people) - ctx["pool_ids"])
        if tag not in {t["id"] for t in tags} or strays:
            raise SystemExit(f"corrections.source.json slips for {tag}: unknown tag or ids not in the pool {strays}")
    return ctx


def build() -> None:
    ctx = load_context()
    tags, pool, people = ctx["tags"], ctx["pool"], ctx["people"]
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
    model = ctx["model"]
    write_json(HERE / "build-notes.json", {"version": version, "droppedRefs": notes + model.get("notes", []), "eras": ERAS,
                                           "modelStats": model.get("stats", {}), "disputes": model.get("disputes", {}),
                                           "unresolved": model.get("unresolved", {}), "missingPasses": model.get("missing", [])}, indent=1)
    write_server_ids(version, [e["id"] for e in pool], [t["id"] for t in tags])
    print(f"twenty-questions.json {version}: {len(shipped)} people × {len(tags)} tags; {len(notes)} build notes")


def write_server_ids(version: str, people_ids: list[str], tag_ids: list[str]) -> None:
    lines = ["// Generated by scripts/twenty-questions/tq_build.py: do not edit. The ids the twenty-questions report",
             "// endpoint accepts (design §10.3), kept out of the 100 KB game file so the worker stays small.",
             f"export const TQ_VERSION = {json.dumps(version)};",
             f"export const TQ_PEOPLE: ReadonlySet<string> = new Set({json.dumps(people_ids)});",
             f"export const TQ_TAGS: ReadonlySet<string> = new Set({json.dumps(tag_ids)});", ""]
    (SITE / "server" / "twenty-questions-ids.ts").write_text("\n".join(lines), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    build()
