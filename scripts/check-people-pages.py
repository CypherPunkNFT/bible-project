#!/usr/bin/env python3
"""Check the ruler and apostle page data (src/data/people-pages/*.json) against the site's KJV, people, places and
their own citations. The rules come from Research/People/METHODOLOGY.md §7.5; the shapes from people-pages/types.ts.

    D:/Python/python.exe scripts/check-people-pages.py                    # all files
    D:/Python/python.exe scripts/check-people-pages.py rulers-judah.json  # one file
Exit code 1 when anything fails; each failure says where it is and what was expected.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
PAGES = SITE / "src" / "data" / "people-pages"
PEOPLE = SITE / "data" / "study" / "people"

# Reuse the Letters checker's verse loader and tree walker rather than copying them.
_spec = importlib.util.spec_from_file_location("check_letters", SITE / "scripts" / "check-letters-data.py")
_letters = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_letters)
load_verses, walk = _letters.load_verses, _letters.walk

LAYERS = {"scripture", "text", "ancient-record", "early-church", "tradition", "scholars"}
SPAN_LIST_KEYS = {"refs", "passages"}
SPAN_KEYS = {"span"}
RULER_REQUIRED = ["id", "name", "kind", "realm", "title", "tagline", "order", "records", "reign", "dates", "verdictTone",
                  "events", "nation", "prophets", "worldStage", "outside", "twoAccounts", "questions", "notSaid",
                  "places", "passages"]
PROPHET_REQUIRED = ["id", "name", "kind", "era", "title", "tagline", "order", "kings", "call", "how", "message", "words",
                    "signs", "fulfilment", "books", "companions", "places", "ending", "questions", "notSaid", "passages"]
PROPHET_KINDS = {"prophet", "prophetess", "seer", "singer", "false", "nt"}
PROPHET_ERAS = {"wilderness", "judges", "united", "divided", "exile", "nt"}
APOSTLE_REQUIRED = ["id", "name", "otherNames", "title", "tagline", "order", "family", "identifications", "calling",
                    "moments", "acts", "places", "companions", "ending", "writings", "questions", "notSaid", "passages"]
BANNED_WORDS = re.compile(r"\b(undoubtedly|surely|clearly|proves?|obviously|certainly)\b", re.IGNORECASE)
# Sources that may never be cited as evidence (METHODOLOGY.md §6.5).
BANNED_SOURCES = re.compile(r"wikipedia|tipnr|stepbible|step bible", re.IGNORECASE)
DATE_SYSTEMS = {"bible", "thiele-mcfall", "albright", "galil", "ussher", "other"}


def check_file(file: Path, verses: dict[int, set[int]], place_ids: set[str], harmony: set[str]) -> list[str]:
    errors: list[str] = []
    name = file.name
    try:
        data = json.loads(file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"{name}: not valid JSON — {error}"]
    cited = {c.get("id") for c in data.get("citations", [])}
    used: set[str] = set()

    def check_span(span, where):
        if not (isinstance(span, list) and len(span) == 2 and all(isinstance(v, int) for v in span)):
            errors.append(f"{name}{where}: expected [first, last] verse ids, got {span!r}")
            return
        first, last = span
        if first > last:
            errors.append(f"{name}{where}: first verse {first} is after last verse {last}")
        for verse in span:
            if verse not in verses.get(verse // 1_000_000, set()):
                errors.append(f"{name}{where}: verse id {verse} is not in the site's KJV")

    def visit(node, path):
        if not isinstance(node, dict):
            return
        for key in SPAN_LIST_KEYS & node.keys():
            if not isinstance(node[key], list):
                errors.append(f"{name}{path}.{key}: expected a list of spans")
                continue
            for i, span in enumerate(node[key]):
                check_span(span, f"{path}.{key}[{i}]")
        for key in SPAN_KEYS & node.keys():
            check_span(node[key], f"{path}.{key}")
        for cite in node.get("cites", []) or []:
            used.add(cite)
            if cite not in cited:
                errors.append(f"{name}{path}: cites '{cite}', which is not in this file's citations")
        if node.get("placeId") and node["placeId"] not in place_ids:
            errors.append(f"{name}{path}: placeId '{node['placeId']}' is not in data/places.json")
        if node.get("personId") and not (PEOPLE / f"{node['personId']}.json").exists():
            errors.append(f"{name}{path}: personId '{node['personId']}' is not in data/study/people")
        if node.get("harmony") and node["harmony"] not in harmony:
            errors.append(f"{name}{path}: harmony section '{node['harmony']}' is not in data/study/harmony.json")
        if "layer" in node:
            layer = node["layer"]
            if layer not in LAYERS:
                errors.append(f"{name}{path}: layer '{layer}' is not one of {sorted(LAYERS)}")
            elif layer == "scripture" and not node.get("refs"):
                errors.append(f"{name}{path}: a scripture claim needs refs")
            elif layer not in ("scripture", "text") and not node.get("cites"):
                errors.append(f"{name}{path}: a '{layer}' claim needs cites")
            text = node.get("text", "")
            if BANNED_WORDS.search(text):
                errors.append(f"{name}{path}: banned confidence word in our own text: {BANNED_WORDS.search(text).group(0)!r}")
        if "quote" in node and isinstance(node["quote"], dict) and "span" not in node["quote"]:
            errors.append(f"{name}{path}.quote: a quotation needs its span")

    walk(data, "", visit)
    for index, citation in enumerate(data.get("citations", [])):
        for key in ["id", "author", "title", "year", "url"]:
            if not citation.get(key):
                errors.append(f"{name}: citations[{index}] missing '{key}'")
        if BANNED_SOURCES.search(f"{citation.get('title', '')} {citation.get('url', '')}"):
            errors.append(f"{name}: citations[{index}] ({citation.get('id')}) is on the 'not as evidence' list")
        if citation.get("id") not in used:
            errors.append(f"{name}: citation '{citation.get('id')}' is listed but never cited")

    kind_key = next((k for k in ("rulers", "apostles", "prophets") if k in data), None)
    items = data.get(kind_key) if kind_key else None
    required = {"rulers": RULER_REQUIRED, "apostles": APOSTLE_REQUIRED, "prophets": PROPHET_REQUIRED}.get(kind_key, [])
    if kind_key == "prophets":
        for item in items or []:
            where = f"{name}: {item.get('id', '?')}"
            if item.get("kind") not in PROPHET_KINDS:
                errors.append(f"{where}: kind '{item.get('kind')}' is not one of {sorted(PROPHET_KINDS)}")
            if item.get("era") not in PROPHET_ERAS:
                errors.append(f"{where}: era '{item.get('era')}' is not one of {sorted(PROPHET_ERAS)}")
    if not isinstance(items, list) or not items:
        errors.append(f"{name}: expected a non-empty 'rulers', 'apostles' or 'prophets' list")
        return errors
    ids = {item.get("id") for item in items}
    for item in items:
        where = f"{name}: {item.get('id', '?')}"
        for key in required:
            if key not in item:
                errors.append(f"{where} missing '{key}'")
        if not (PEOPLE / f"{item.get('id')}.json").exists():
            errors.append(f"{where}: id is not a person in data/study/people")
        for other in item.get("personIds", []) or []:
            if not (PEOPLE / f"{other}.json").exists():
                errors.append(f"{where}: personIds '{other}' is not in data/study/people")
        for date in item.get("dates", []) or []:
            if date.get("system") not in DATE_SYSTEMS:
                errors.append(f"{where}: date system '{date.get('system')}' is not one of {sorted(DATE_SYSTEMS)}")
            if date.get("from") and date.get("to") and date["to"] > date["from"]:
                errors.append(f"{where}: dates ({date.get('system')}) end {date['to']} BC is before start {date['from']} BC")
            if date.get("system") not in ("bible",) and not date.get("cites"):
                errors.append(f"{where}: dates ({date.get('system')}) need cites")
        for key in ("predecessor", "successor"):
            target = item.get(key)
            if target and target not in ids and not (PEOPLE / f"{target}.json").exists():
                errors.append(f"{where}: {key} '{target}' is neither a ruler here nor a person")
        books = [record.get("book") for record in item.get("records", []) or []]
        if len(books) != len(set(books)):
            errors.append(f"{where}: records repeats a book; Kings and Chronicles are separate entries, never merged")
    return errors


def main() -> int:
    verses = load_verses()
    place_ids = {p["id"] for p in json.loads((SITE / "data" / "places.json").read_text(encoding="utf-8"))}
    harmony = {section["n"] for part in json.loads((SITE / "data" / "study" / "harmony.json").read_text(encoding="utf-8"))["parts"]
               for section in part["sections"]}
    names = sys.argv[1:]
    # index.json is generated from the group files (scripts/build-people-pages-index.py), not a group file itself.
    files = [PAGES / n for n in names] if names else sorted(f for f in PAGES.glob("*.json") if f.name != "index.json")
    if not files:
        print(f"No people-page data files found in {PAGES}")
        return 1
    failures = 0
    for file in files:
        errors = check_file(file, verses, place_ids, harmony)
        failures += len(errors)
        print(f"{file.name}: {'OK' if not errors else f'{len(errors)} problem(s)'}")
        for error in errors[:200]:
            print("  " + error)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
