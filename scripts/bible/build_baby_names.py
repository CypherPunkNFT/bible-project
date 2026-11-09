#!/usr/bin/env python3
"""Biblical baby names (/baby-names): build every name page's data from the people data and the name sources.

Design: docs/features/baby-names/design.md. No language model is used, at build time or at runtime; every meaning
comes from a hand-checked override, the Berean's own note, or Strong's, by fixed rules (baby-names/bn_meaning.py).
Verse text is never copied: pages fetch it from the Berean files the site already serves.

    py -3.12 scripts/bible/build_baby_names.py                    # write data/baby-names/ and the person-link file
    py -3.12 scripts/bible/build_baby_names.py --sheet DIR        # also write the hand-check sheet (CSV) into DIR
    py -3.12 -m pytest scripts/tests/test_baby_names.py           # the build's own rules

Run it again when TIPNR, the people data or a hand-written file in scripts/bible/baby-names/ changes. The SSA's
national file (names.zip, downloaded by hand from ssa.gov into sources/ssa/) adds US popularity when it is present.
"""

import argparse
import csv
import json
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent / "baby-names"
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1]))

from bible.books import verse_id  # noqa: E402
from bible.paths import SITE, SOURCES  # noqa: E402
from bible.study_refs import Verses  # noqa: E402
from bn_assemble import (BuildError, Name, Original, add_reviewed_identities, all_verses, assign_meanings,  # noqa: E402
                         build_originals, check_slugs, gender_of, group_names, main_original, notes_for_names, slug_of,
                         testament_of, bearer_testament)
from bn_links import aliases, person_links, related_names  # noqa: E402
from bn_meaning import GIVEN, HEADLINE_MAX, PROBABLE, PROBABLE_HEDGED, UNCERTAIN, themes_for  # noqa: E402
from bn_page import bearer_entry, hitchcock_line, opening, original_entry, used_today  # noqa: E402
from bn_sources import (Popularity, read_berean, read_greek_strongs, read_hebrew_strongs, read_hitchcock,  # noqa: E402
                        read_plain_bible, read_ssa, read_tipnr)

OUT = SITE / "data" / "baby-names"
PERSON_LINKS = SITE / "src" / "data" / "baby-names" / "person-links.json"
FULL_MIN_VERSES = 5
SSA_TOP = 1000


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_inputs() -> dict:
    return {key: read_json(HERE / f"{key}.json") for key in
            ("meaning-overrides", "spelling-overrides", "excluded", "extra-names", "cautions", "themes", "page-notes")}


def check_overrides(overrides: dict[str, dict]) -> None:
    """Every override names a headline, a label and a citation (design 3.3 rule 1), and its headline obeys the same
    clean-up rules as an automatic one (rule 5): at most 40 characters, never 'Jehovah'."""
    labels = (GIVEN, PROBABLE, PROBABLE_HEDGED, UNCERTAIN)
    for key, value in overrides.items():
        missing = [f for f in ("headline", "label", "cite") if not str(value.get(f, "")).strip()]
        if missing:
            raise BuildError(f"baby-names: meaning override '{key}' lacks {', '.join(missing)}")
        if value["label"] not in labels:
            raise BuildError(f"baby-names: meaning override '{key}' has label {value['label']!r}; expected one of {labels}")
        if len(value["headline"]) > HEADLINE_MAX or "jehovah" in value["headline"].lower():
            raise BuildError(f"baby-names: meaning override '{key}' headline {value['headline']!r} is over "
                             f"{HEADLINE_MAX} characters or says 'Jehovah'")


def add_extra_names(names: dict[str, Name], extra: list[dict], places: dict[str, dict], plain: dict[int, str],
                    lexicon: dict) -> None:
    """The hand-chosen place and angel names (design 3.2); a name that is also a person joins that page."""
    for item in extra:
        name = names.setdefault(item["name"], Name(item["name"], slug_of(item["name"])))
        name.extra_gender, name.about = item["gender"], item.get("about", "")
        for place_id in item.get("places", []):
            place = places.get(place_id)
            if place is None:
                raise BuildError(f"baby-names: extra name {item['name']} names atlas place {place_id}, not in data/places.json")
            name.places.append({"id": place_id, "name": place["name"], "type": place["type"], "verseIds": sorted(place["verses"])})
        for passage in item.get("passages", []):
            code, _, ref = passage.partition(" ")
            chapter, verse = (int(x) for x in ref.split(":"))
            vid = verse_id(code, chapter, verse)
            if vid not in plain:
                raise BuildError(f"baby-names: extra name {item['name']} passage {passage} is not in the Berean")
            name.passages.append(vid)
        entry = lexicon.get(item["strongs"])
        if entry is None:
            raise BuildError(f"baby-names: extra name {item['name']} gives Strong's {item['strongs']}, which is not in the dictionaries")
        if item["strongs"] not in name.originals:
            name.originals[item["strongs"]] = Original(item["strongs"], entry.word, entry.translit)


def drop_excluded(names: dict[str, Name], excluded: list[dict]) -> set[str]:
    gone = set()
    for entry in excluded:
        if entry.get("formOnly"):
            gone.add(entry["name"])  # never a page and never an alias (a title given as another form of a name)
            continue
        if entry["name"] not in names:
            raise BuildError(f"baby-names: excluded.json lists '{entry['name']}', which no longer makes a page; remove it")
        del names[entry["name"]]
        gone.add(entry["name"])
    return gone


def naming_verses(name: Name) -> dict[str, int]:
    """person id -> the verse where the Bible explains their name, when it does."""
    found = {}
    for block in name.originals.values():
        note = block.meaning.bible_note or block.meaning.wordplay
        if note:
            for pid in block.persons:
                if pid in name.bearers and note["verse"] in name.bearers[pid].refs:
                    found.setdefault(pid, note["verse"])
    return found


def is_full(name: Name, bearers: list[dict], popularity: Popularity) -> bool:
    """Full pages are indexed and in the sitemap; the rest are short pages marked noindex (design 3.2, 6.4)."""
    ranked = min(popularity.boys.get(name.spelling, SSA_TOP + 1), popularity.girls.get(name.spelling, SSA_TOP + 1)) <= SSA_TOP
    explained = any(b.meaning.bible_note for b in name.originals.values())
    return (any(b["verseCount"] >= FULL_MIN_VERSES for b in bearers) or explained or ranked
            or any(b["hasStory"] for b in bearers) or bool(name.extra_gender))  # the hand-chosen names parents use


def build_documents(ctx: dict) -> tuple[list[dict], dict[str, dict]]:
    names, people, details, popularity = ctx["names"], ctx["people"], ctx["details"], ctx["popularity"]
    rows, docs = [], {}
    for name in sorted(names.values(), key=lambda n: n.slug):
        gender, testament = gender_of(name, details), testament_of(name, people, ctx["log"])
        naming = naming_verses(name)
        bearers = sorted((bearer_entry(name, pid, ctx, naming, bearer_testament(pid, people, b.refs, ctx["log"]))
                          for pid, b in name.bearers.items()), key=lambda b: (-b["verseCount"], b["id"]))
        main = main_original(name)
        originals = [original_entry(block, ctx["lexicon"], hitchcock_line(name, block, ctx["hitchcock"]) if block is main else "")
                     for block in sorted(name.originals.values(), key=lambda b: b is not main)]
        full = is_full(name, bearers, popularity)
        others = len(bearers) - 1
        who = (bearers[0]["description"].rstrip(".") + (f" and {others} other{'s' if others > 1 else ''}" if others > 0 else "")) \
            if bearers else ", ".join(p["name"] + f" ({p['type']})" for p in name.places) or "The angel Gabriel"
        row = {"s": name.slug, "n": name.spelling, "g": gender, "t": testament, "m": main.meaning.headline,
               "l": originals[0]["meaning"]["label"], "th": themes_for(main.meaning.headline, ctx["themes"]),
               "w": who, "c": len(all_verses(name)), "f": 1 if full else 0,
               "a": sorted({f for b in name.bearers.values() for f in b.forms if slug_of(f) != name.slug})}
        if len(name.originals) > 1:
            row["x"] = 1  # headline belongs to the best-known bearer: shown "(and others)"
        if popularity.boys.get(name.spelling):
            row["rb"] = popularity.boys[name.spelling]
        if popularity.girls.get(name.spelling):
            row["rg"] = popularity.girls[name.spelling]
        rows.append(row)
        docs[name.slug] = {
            "slug": name.slug, "name": name.spelling, "gender": gender, "testament": testament, "full": full,
            "opening": opening(name, gender, bearers), "usedToday": used_today(name, gender, popularity),
            "ranks": {"boys": row.get("rb"), "girls": row.get("rg"), "year": popularity.year} if popularity.year else None,
            "caution": ctx["cautions"].get(name.spelling, ""), "note": ctx["notes"].get(name.spelling),
            "originals": originals, "bearers": bearers,
            "places": [{k: v for k, v in p.items() if k != "verseIds"} | {"verses": len(p["verseIds"])} for p in name.places],
            "passages": sorted(name.passages), "verses": all_verses(name), "themes": row["th"],
        }
    return rows, docs


def write_outputs(rows: list[dict], docs: dict[str, dict], index_extra: dict, links: dict) -> None:
    staging = OUT.with_name("baby-names.part")
    if staging.exists():
        shutil.rmtree(staging)
    (staging / "names").mkdir(parents=True)
    index = {"version": 1, **index_extra, "names": rows}
    (staging / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for slug, doc in docs.items():
        (staging / "names" / f"{slug}.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    if OUT.exists():
        shutil.rmtree(OUT)
    staging.replace(OUT)
    PERSON_LINKS.parent.mkdir(parents=True, exist_ok=True)
    PERSON_LINKS.write_text(json.dumps(links, ensure_ascii=False, indent=0, sort_keys=True) + "\n", encoding="utf-8")


def write_sheet(folder: Path, rows: list[dict], docs: dict[str, dict], override_keys: set[str]) -> Path:
    """The hand-check sheet (design 3.3): the 150 most popular (or, without SSA data, most mentioned) names, every
    override, and every name the build flagged, with each source side by side."""
    ranked = sorted(rows, key=lambda r: (min(r.get("rb", 99999), r.get("rg", 99999)), -r["c"]))[:150]
    chosen = {r["s"] for r in ranked} | {slug_of(k.split("|")[0]) for k in override_keys}
    path = folder / "baby-names-hand-check.csv"
    with path.open("w", encoding="utf-8", newline="") as out:
        writer = csv.writer(out)
        writer.writerow(["name", "strongs", "headline", "label", "source", "strongs_text", "bible_note", "wordplay", "hitchcock"])
        for slug in sorted(chosen & set(docs)):
            for block in docs[slug]["originals"]:
                m = block["meaning"]
                writer.writerow([docs[slug]["name"], block["strongs"], m["headline"], m["labelText"], m["source"], m["strongsText"],
                                 (m["bibleNote"] or {}).get("text", ""), (m["wordplay"] or {}).get("text", ""), block["hitchcock"]])
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--sheet", type=Path, help="also write the hand-check CSV into this folder")
    args = parser.parse_args()
    inputs, log = load_inputs(), []
    overrides = {k: v for k, v in inputs["meaning-overrides"]["overrides"].items()}
    check_overrides(overrides)
    verses = Verses(SITE / "data")
    people = {p["id"]: p for p in read_json(SITE / "data" / "study" / "people.json")}
    tipnr = read_tipnr((SOURCES / "stepbible" / "TIPNR.txt").read_text(encoding="utf-8"), verses)
    berean, plain = read_berean(SOURCES / "ebible" / "engbsb"), read_plain_bible(SITE / "data" / "plain" / "bsb")
    lexicon = {**read_hebrew_strongs(SOURCES / "openscriptures" / "HebrewLexicon" / "HebrewLexicon-master" / "HebrewStrong.xml"),
               **read_greek_strongs(SOURCES / "openscriptures" / "strongs" / "strongs-master" / "greek" /
                                    "StrongsGreekDictionaryXML_1.4" / "strongsgreek.xml")}
    add_reviewed_identities(tipnr, inputs["spelling-overrides"].get("identities", {}), people, lexicon, plain)
    names = group_names(tipnr, people, berean, plain, inputs["spelling-overrides"]["people"], log,
                        inputs["spelling-overrides"].get("reviewed", {}))
    excluded = drop_excluded(names, inputs["excluded"]["names"])
    places = {p["id"]: p for p in read_json(SITE / "data" / "places.json")}
    for name in names.values():
        build_originals(name, lexicon, tipnr)
    add_extra_names(names, inputs["extra-names"]["names"], places, plain, lexicon)
    check_slugs(names)
    used: set[str] = set()
    assign_meanings(names, lexicon, notes_for_names(berean), overrides, used)
    unused = set(overrides) - used
    if unused:
        raise BuildError(f"baby-names: meaning overrides match no page: {', '.join(sorted(unused))}")
    details = {pid: read_json(SITE / "data" / "study" / "people" / f"{pid}.json") for n in names.values() for pid in n.bearers}
    popularity = read_ssa(SOURCES / "ssa" / "names.zip")
    ctx = {"names": names, "people": people, "details": details, "popularity": popularity, "lexicon": lexicon,
           "hitchcock": read_hitchcock(SOURCES / "ccel" / "hitchcock-bible-names.xml"), "themes": inputs["themes"]["themes"],
           "cautions": inputs["cautions"]["cautions"], "log": log, "excluded": excluded,
           "notes": inputs["page-notes"]["notes"]}
    ctx["person_names"] = {}
    for name in names.values():
        for pid in name.bearers:
            ctx["person_names"].setdefault(pid, {})[name.spelling] = name.slug
    rows, docs = build_documents(ctx)
    by_slug = {r["s"]: r for r in rows}
    for slug, related in related_names(names, by_slug, lexicon).items():
        docs[slug]["related"] = related
    alias_table = aliases(names, people, inputs["spelling-overrides"]["aliases"], excluded)
    themes = [{"id": k, "label": v["label"]} for k, v in inputs["themes"]["themes"].items()]
    write_outputs(rows, docs, {"ssaYear": popularity.year or None, "themes": themes, "aliases": alias_table},
                  person_links(names, people))
    full = sum(r["f"] for r in rows)
    print(f"baby names: {len(rows)} pages ({full} full, {len(rows) - full} short), {len(alias_table)} aliases, "
          f"{len(log)} notes; US popularity {'from ' + str(popularity.year) if popularity.year else 'not available (no sources/ssa/names.zip)'}")
    # A flagged draft with no override is withheld as "Meaning uncertain" (never published as a guess); list them so
    # a source refresh that adds new ones is reviewed (design 3.3 rule 3).
    flagged = sorted(f"{d['name']}|{b['strongs']}" for d in docs.values() for b in d["originals"]
                     if names[d["name"]].originals[b["strongs"]].meaning.needs_check)
    print(f"flagged draft meanings still waiting for a hand-checked override: {len(flagged)}"
          + (f" ({', '.join(flagged)})" if flagged else ""))
    for line in log:
        print(f"  note: {line}")
    if args.sheet:
        print(f"hand-check sheet: {write_sheet(args.sheet, rows, docs, used)}")
        (args.sheet / "baby-names-needs-check.txt").write_text("\n".join(flagged) + "\n", encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except BuildError as error:
        sys.exit(str(error))
