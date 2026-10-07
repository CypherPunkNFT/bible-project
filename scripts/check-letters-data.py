#!/usr/bin/env python3
"""Check the letter-page data files (src/data/letters/*.json) against the site's own KJV and their own citations.

Every Span ([first, last] verse ids) must name verses that exist in data/text/kjv, with first <= last.
Every citation id used in a Claim must be listed in the file's "citations". Place ids must exist in data/places.json.

    py -3.12 scripts/check-letters-data.py                 # all files
    py -3.12 scripts/check-letters-data.py hebrews.json    # one file
Exit code 1 when anything fails; each failure says where it is and what was expected.
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
LETTERS = SITE / "src" / "data" / "letters"
REQUIRED = ["id", "title", "tagline", "intro", "color", "letters", "questions", "canon", "parallels", "timelines",
            "maps", "networks", "flows", "ladders", "citations"]
# overview.json (the opening of the Letters study) has its own shape: LettersOverview in types.ts.
OVERVIEW_REQUIRED = ["title", "tagline", "intro", "letterForm", "hands", "letterLinks", "sharedPeople", "themes",
                     "collection", "questions", "canon", "citations"]
LETTER_REQUIRED = ["code", "name", "verses", "author", "recipients", "writtenFrom", "date", "occasion", "themes",
                   "keyVerses", "outline", "words", "people", "places", "otQuotes"]


def load_verses() -> dict[int, set[int]]:
    """Verse ids present in the KJV, by book number."""
    catalog = json.loads((SITE / "data" / "catalog.json").read_text(encoding="utf-8"))
    verses: dict[int, set[int]] = {}
    for book in catalog["books"]:
        folder = SITE / "data" / "text" / "kjv" / book["code"]
        if not folder.is_dir():
            continue
        found: set[int] = set()
        for chunk in folder.glob("*.json"):
            for chapter, body in json.loads(chunk.read_text(encoding="utf-8")).items():
                for verse in body.get("v", []):
                    if str(verse.get("n", "")).isdigit():
                        found.add(book["num"] * 1_000_000 + int(chapter) * 1_000 + int(verse["n"]))
        verses[book["num"]] = found
    return verses


def walk(node, path, visit):
    visit(node, path)
    if isinstance(node, dict):
        for key, value in node.items():
            walk(value, f"{path}.{key}", visit)
    elif isinstance(node, list):
        for index, value in enumerate(node):
            walk(value, f"{path}[{index}]", visit)


SPAN_KEYS = {"refs", "span", "at", "from", "left", "right"}


def check_file(file: Path, verses: dict[int, set[int]], place_ids: set[str]) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"{file.name}: not valid JSON — {error}"]
    for key in OVERVIEW_REQUIRED if file.name == "overview.json" else REQUIRED:
        if key not in data:
            errors.append(f"{file.name}: missing top-level key '{key}'")
    for index, letter in enumerate(data.get("letters", [])):
        for key in LETTER_REQUIRED:
            if key not in letter:
                errors.append(f"{file.name}: letters[{index}] ({letter.get('code', '?')}) missing '{key}'")
    cited = {c.get("id") for c in data.get("citations", [])}

    def check_span(span, where):
        if not (isinstance(span, list) and len(span) == 2 and all(isinstance(v, int) for v in span)):
            errors.append(f"{file.name}{where}: expected [first, last] verse ids, got {span!r}")
            return
        first, last = span
        if first > last:
            errors.append(f"{file.name}{where}: first verse {first} is after last verse {last}")
        for verse in span:
            if verse not in verses.get(verse // 1_000_000, set()):
                errors.append(f"{file.name}{where}: verse id {verse} is not in the site's KJV")

    def visit(node, path):
        if not isinstance(node, dict):
            return
        for key in SPAN_KEYS & node.keys():
            value = node[key]
            if key == "refs":
                if not isinstance(value, list):
                    errors.append(f"{file.name}{path}.refs: expected a list of spans")
                    continue
                for i, span in enumerate(value):
                    check_span(span, f"{path}.refs[{i}]")
            elif key in {"left", "right"} and isinstance(value, dict):
                continue  # the axis objects hold their own "span"
            elif key == "from" and isinstance(value, (int, float)):
                continue  # timeline / date years
            elif isinstance(value, list):
                check_span(value, f"{path}.{key}")
        for cite in node.get("cites", []) or []:
            if cite not in cited:
                errors.append(f"{file.name}{path}: cites '{cite}', which is not in this file's citations")
        if "placeId" in node and node["placeId"] not in place_ids:
            errors.append(f"{file.name}{path}: placeId '{node['placeId']}' is not in data/places.json")

    walk(data, "", visit)
    for index, citation in enumerate(data.get("citations", [])):
        for key in ["id", "author", "title", "year", "url"]:
            if not citation.get(key):
                errors.append(f"{file.name}: citations[{index}] missing '{key}'")
    return errors


def main() -> int:
    verses = load_verses()
    place_ids = {p["id"] for p in json.loads((SITE / "data" / "places.json").read_text(encoding="utf-8"))}
    names = sys.argv[1:]
    files = [LETTERS / n for n in names] if names else sorted(LETTERS.glob("*.json"))
    if not files:
        print(f"No letter data files found in {LETTERS}")
        return 1
    failures = 0
    for file in files:
        errors = check_file(file, verses, place_ids)
        failures += len(errors)
        print(f"{file.name}: {'OK' if not errors else f'{len(errors)} problem(s)'}")
        for error in errors[:200]:
            print("  " + error)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
