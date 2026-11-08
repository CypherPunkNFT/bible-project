#!/usr/bin/env python3
"""Odd one out (the /games/odd-one-out puzzle): build every set once, ahead of time, from the site's own data.

Four people, places or books; one does not belong. The sets are built around a near-miss odd item and each one is
rejected if any property we can compute singles out a different item (docs/features/odd-one-out/design.md). No
language model is used. Curated inputs live in scripts/odd-one-out/ (rules, facts, seed sets, veto list).

    py -3.12 scripts/build-odd-one-out.py           # write the sets, the fact table and the review sheet
    py -3.12 scripts/build-odd-one-out.py --check   # fail if any of them is out of date
"""
import argparse
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent / "odd-one-out"))

from ooo_construct import BuildError, build_kind, check_veto  # noqa: E402
from ooo_data import HERE, SITE, Bible, Catalogue, read_json  # noqa: E402
from ooo_model import KINDS, Rule  # noqa: E402
from ooo_output import counts, dumps, facts_table, review_sheet, sets_document, write_lines  # noqa: E402
from ooo_people import build_people  # noqa: E402
from ooo_places_books import build_books, build_places  # noqa: E402

OUT_SETS = SITE / "src" / "data" / "odd-one-out" / "sets.json"
OUT_FACTS = SITE / "src" / "data" / "odd-one-out" / "facts-table.json"
OUT_SHEET = SITE / "docs" / "features" / "odd-one-out" / "review-sheet.md"


def load_rules() -> list[Rule]:
    rules = []
    for raw in read_json(HERE / "rules.json")["rules"]:
        key = tuple(raw["keyRef"]) if raw.get("keyRef") else None
        rules.append(Rule(raw["id"], raw["kind"], raw["tier"], raw["easy"], raw["members"], raw["odd"],
                          raw.get("oddOnly", ""), raw.get("others", ""), key, raw.get("anchor")))
    if len({r.id for r in rules}) != len(rules):
        raise BuildError("rules.json repeats a rule id")
    return rules


def check_labels(facts: dict, people_ids: set[str], place_ids: set[str]) -> None:
    """A label override for an id that does not exist is a typo the build must not hide (design 5.1)."""
    for section, known in (("people", people_ids), ("places", place_ids)):
        for key in ("labels", "exclude"):
            missing = sorted(k for k in facts[section][key] if k != "about" and k not in known)
            if missing:
                raise BuildError(f"facts.json {section}.{key} names ids that do not exist: {', '.join(missing)}")


def build() -> dict[Path, str]:
    """Run the whole build in memory and return each output file's text."""
    facts = read_json(HERE / "facts.json")
    for section in ("people", "places"):
        facts[section]["labels"].pop("about", None)
        facts[section]["exclude"].pop("about", None)
    rules = load_rules()
    seeds = read_json(HERE / "seed-sets.json")["sets"]
    veto = read_json(HERE / "veto.json")["veto"]
    catalogue = Catalogue()
    bible = Bible(catalogue)
    book_words = catalogue.name_words()
    people, people_props = build_people(facts, rules)
    places, place_props = build_places(facts, rules)
    books, book_props = build_books(facts, rules, catalogue, bible)
    check_labels(facts, {p["id"] for p in read_json(SITE / "data" / "study" / "people.json")},
                 {p["id"] for p in read_json(SITE / "data" / "places.json")})
    pools = {"person": (people, people_props), "place": (places, place_props), "book": (books, book_props)}
    builders = [build_kind(kind, *pools[kind], rules, book_words, seeds, veto) for kind in KINDS]
    check_veto(veto, builders)
    document = sets_document(builders, rules, catalogue, bible)
    used = {i for s in document["sets"] for i in s["items"]}
    return {OUT_SETS: write_lines(document), OUT_FACTS: dumps(facts_table(builders, used, book_words)) + "\n",
            OUT_SHEET: review_sheet(document)}


def stale_outputs(outputs: dict[Path, str]) -> list[Path]:
    """Output files missing or different from a fresh build."""
    return [path for path, text in outputs.items()
            if not path.exists() or path.read_text(encoding="utf-8") != text]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="fail if the committed output is out of date")
    args = parser.parse_args()
    try:
        outputs = build()
    except BuildError as error:
        print(f"build-odd-one-out: {error}", file=sys.stderr)
        return 1
    if args.check:
        stale = stale_outputs(outputs)
        for path in stale:
            print(f"build-odd-one-out: {path.relative_to(SITE)} is out of date; run py -3.12 scripts/build-odd-one-out.py",
                  file=sys.stderr)
        return 1 if stale else 0
    for path, text in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")
    document = json.loads(outputs[OUT_SETS])
    print(f"build-odd-one-out: {len(document['sets'])} sets")
    for kind, row in counts(document).items():
        print(f"  {kind}: " + ", ".join(f"{d} {n}" for d, n in row.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
