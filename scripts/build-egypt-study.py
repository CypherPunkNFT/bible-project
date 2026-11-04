#!/usr/bin/env python3
"""Build src/pages/study/egypt/egypt-data.json for /study/egypt-beside-israel.

Reads the research record's verse list, and for each entry takes the text from the site's Berean copy (data/text/bsb) and
asserts that it holds the stated phrase. Asserts that each quotation of Scripture the record makes is the Berean's wording,
and that each word matched to a Canaanite word carries the stated Strong's number in the site's tagged King James. From the
held copy of the Oracc edition of the Amarna letters (checked against its registered checksum) it takes the named lines, word
by word, and counts: letters per place, words tagged Canaanite, and the letters using the word Habiru by spelling. That proves
the verses, the counts and the lines quoted; it does not prove any reading. A failure stops the build and writes nothing.

Usage: python scripts/build-egypt-study.py --site <Website folder> --artifacts <Research/Artifacts folder>
"""
import argparse
import hashlib
import io
import json
import os
import re
import sys
import tempfile
import zipfile
from collections import Counter, defaultdict
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/32-egypt-beside-israel.json")
OUTPUT = Path("src/pages/study/egypt/egypt-data.json")
ZIP_NAME = "raw/oracc/aemw-amarna.zip"
CHECKSUMS = "checksums/oracc.sha256"
PROJECT = "aemw/amarna"
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
TEXT_ID = re.compile(r"^P\d{6}$")
QUOTED = re.compile(r"“([^”]+)”")
DAMAGE = re.compile(r"[⸢⸣\[\]]")
EDITORIAL = re.compile(r"\s*(\}\}|\{\{)\s*")
HABIRU = "habiru"
CANAANITE = "qca"
EGYPTIAN = "egy-020"
CLIENT_LETTER = "client letter"
PROVERBS_RULER_VERSES = 70
BUDGET_BYTES = 40_000
# The English of Proverbs 22:20 the record sets against the Berean's, with the number on it.
KJV_THIRTY = (("Proverbs 22:20", "H7991", "things"), "excellent things")


def fail(message: str) -> NoReturn:
    sys.exit(f"build-egypt-study: {message}")


def run_text(run: object) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) else ""


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run_text(r) for r in runs)).strip()


def book_chapters(root: Path, code: str) -> Iterator[dict]:
    for path in sorted((root / code).glob("*.json")):
        yield from json.loads(path.read_text(encoding="utf-8")).values()


def normal(text: str) -> str:
    return text.lower().replace("’", "'").replace("“", "").replace("”", "").replace("‘", "'")


def has_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"\b{re.escape(normal(phrase))}\b", normal(text)) is not None


def find_verse(root: Path, entry: dict) -> list:
    code, chapter, verse = entry["code"], entry["chapter"], entry["verse"]
    if not BOOK_CODE.match(code):
        fail(f"{entry['label']}: book code {code!r} is not three capitals or digits")
    for found in book_chapters(root, code):
        if int(found["c"]) != chapter:
            continue
        for item in found["v"]:
            if item["n"] == str(verse):
                return item["r"]
    fail(f"{root.name} has no {code} {chapter}:{verse} ({entry['label']})")


def read_verse(bsb_root: Path, entry: dict) -> str:
    text = verse_text(find_verse(bsb_root, entry))
    if not has_phrase(text, entry["phrase"]):
        fail(f"{entry['label']}: expected the phrase {entry['phrase']!r}, the Berean has: {text}")
    return text


def tagged_words(runs: list) -> dict[str, str]:
    """Each Strong's number in the verse, with the English the King James prints for it."""
    return {re.sub(r"[a-z]$", "", n): run[0].lower() for run in runs if isinstance(run, list) and len(run) == 3 for n in run[2].split()}


def check_tag(kjv_root: Path, entries: dict[str, dict], label: str, tag: str, english: str) -> None:
    words = tagged_words(find_verse(kjv_root, entries[label]))
    if english not in words.get(tag, ""):
        fail(f"{label}: expected {tag} on the word {english!r}, the tagged King James has {words}")


def check_tags(kjv_root: Path, record: dict) -> None:
    entries = {v["label"]: v for v in record["verses"]}
    for word in record["letters"]["cognates"]:
        check_tag(kjv_root, entries, word["verse"], word["strongs"], word["english"])
    (label, tag, english), phrase = KJV_THIRTY
    check_tag(kjv_root, entries, label, tag, english)
    if not has_phrase(verse_text(find_verse(kjv_root, entries[label])), phrase):
        fail(f"{label}: expected {phrase!r} in the site's King James")


def check_quotes(record: dict, verses: dict[str, dict]) -> None:
    """Quotation marks around Scripture must hold the Berean's own words, in the verses each item names."""
    items = [(f"parting {p['id']}", p["psalm"], p["verses"]) for p in record["partings"]]
    items += [(f"parallel {p['id']} (Israel)", p["behind"]["israel"], p["verses"]) for p in record["parallels"] if "behind" in p]
    items += [("the stance", record["stance"]["body"], record["stance"]["verses"])]
    items += [(f"parallel {p['id']} (limit)", p["limit"], p["verses"]) for p in record["parallels"] if p["id"] == "angry"]
    for name, text, labels in items:
        held = " ".join(normal(verses[label]["text"]) for label in labels)
        for quoted in QUOTED.findall(text):
            if normal(quoted).rstrip(".,") not in held:
                fail(f"{name}: the quotation {quoted!r} is not the Berean's wording in {labels}")


def check_ruler(record: dict) -> None:
    """Each passage's verses must sit where the ruler draws them: 22:17 is place 0, 23:1 place 13, and 24:22 place 69."""
    for p in record["parallels"]:
        if not 0 <= p["firstVerse"] <= p["lastVerse"] < PROVERBS_RULER_VERSES:
            fail(f"parallel {p['id']}: verse places {p['firstVerse']}-{p['lastVerse']} are outside the ruler")
        chapters = [verse.split(" ")[1].split(":")[0] for verse in p["verses"]]
        first = int(p["verses"][0].split(":")[1])
        place = first - 17 if chapters[0] == "22" else first + 12
        if place != p["firstVerse"]:
            fail(f"parallel {p['id']}: {p['verses'][0]} is place {place} on the ruler, the record says {p['firstVerse']}")
        if not 1 <= p["column"] <= record["papyrus"]["columns"]:
            fail(f"parallel {p['id']}: column {p['column']} is not on the papyrus")
    starts = record["papyrus"]["chapters"]
    if len(starts) != 30 or starts != sorted(starts):
        fail(f"the papyrus's chapter table should hold 30 starts in order, it holds {len(starts)}")


def read_held_zip(artifacts: Path) -> zipfile.ZipFile:
    path = artifacts / ZIP_NAME
    if not path.is_file():
        fail(f"expected the held Oracc edition at {path}: it is not there")
    registered = None
    for line in (artifacts / CHECKSUMS).read_text(encoding="utf-8").splitlines():
        parts = line.split(None, 1)
        if len(parts) == 2 and parts[1].strip() == ZIP_NAME:
            registered = parts[0]
    if not registered:
        fail(f"{ZIP_NAME} has no registered checksum in {artifacts / CHECKSUMS}")
    data = path.read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    if actual != registered:
        fail(f"{path}: expected checksum {registered}, found {actual}")
    return zipfile.ZipFile(io.BytesIO(data))


def words_of(node: object, current: list, out: list) -> list:
    """Each word of a text with its line label, walking the edition's tree. Fixed member names only: nothing is extracted to disk."""
    if isinstance(node, dict):
        if node.get("node") == "d" and node.get("type") == "line-start":
            current[0] = node.get("label")
        if node.get("node") == "l":
            out.append((current[0], node))
        for child in node.get("cdl", []):
            words_of(child, current, out)
    return out


def member(archive: zipfile.ZipFile, text_id: str) -> dict | None:
    if not TEXT_ID.match(text_id):
        fail(f"text id {text_id!r} is not the edition's form")
    name = f"{PROJECT}/corpusjson/{text_id}.json"
    return json.loads(archive.read(name)) if name in archive.namelist() else None


def show_word(word: dict) -> dict:
    """The sign string as the page shows it, its gloss, its tagged language, and whether any of it is damaged or restored."""
    form = word.get("f", {})
    raw = EDITORIAL.sub("", word.get("frag", ""))
    pos, gloss = form.get("pos"), form.get("gw")
    if pos == "n":
        gloss = "(number)"
    elif pos == "u" or not gloss:
        gloss = "…"
    elif gloss == "1":
        gloss = "(name)"
    shown: dict = {"t": DAMAGE.sub("", raw), "g": gloss}
    if DAMAGE.search(raw):
        shown["d"] = 1
    language = str(form.get("lang", ""))
    if language.startswith(CANAANITE):
        shown["l"] = "c"
    elif language.startswith(EGYPTIAN):
        shown["l"] = "e"
    return shown


def read_passages(archive: zipfile.ZipFile, record: dict) -> dict:
    out = {}
    for passage in record["letters"]["passages"]:
        tree = member(archive, passage["pid"])
        if tree is None:
            fail(f"{passage['ea']}: {passage['pid']} has no text in the edition")
        lines = defaultdict(list)
        for label, word in words_of(tree, [None], []):
            lines[label].append(word)
        shown = []
        for label in passage["lines"]:
            if label not in lines:
                fail(f"{passage['ea']}: the edition has no line {label!r}")
            shown.append({"label": label, "words": [show_word(w) for w in lines[label]]})
        joined = " ".join(w["t"] for line in shown for w in line["words"])
        for expected in passage["expect"]:
            if expected not in joined:
                fail(f"{passage['ea']}: expected {expected!r} in the named lines, they read: {joined}")
        out[passage["id"]] = shown
    return out


def clean_writer(name: str | None) -> str:
    return re.sub(r"[\[\]]", "", name or "").strip()


def check_cognates(archive: zipfile.ZipFile, record: dict, ids: dict[str, str]) -> None:
    for item in record["letters"]["cognates"]:
        tree = member(archive, ids[item["letter"]])
        found = [w for label, w in words_of(tree, [None], []) if label == item["line"] and item["cuneiform"] in DAMAGE.sub("", w.get("frag", ""))]
        if not found or not str(found[0].get("f", {}).get("lang", "")).startswith(CANAANITE) or found[0]["f"].get("gw") != item["gloss"]:
            fail(f"{item['letter']} {item['line']}: expected {item['cuneiform']!r}, tagged Canaanite and glossed {item['gloss']!r}; found {found}")


def count_letters(archive: zipfile.ZipFile, record: dict) -> dict:
    catalogue = json.loads(archive.read(f"{PROJECT}/catalogue.json"))["members"]
    ids = {entry["designation"]: key for key, entry in catalogue.items()}
    check_cognates(archive, record, ids)
    places, writers, unplaced = Counter(), defaultdict(Counter), 0
    canaanite, egyptian, tagged, spelled, signs, byblos, total, with_text = 0, 0, set(), set(), set(), set(), 0, 0
    for key, entry in catalogue.items():
        total += 1
        tree = member(archive, key)
        if tree is None:
            continue
        with_text += 1
        place = entry.get("provenience", "")
        if entry.get("subgenre") == CLIENT_LETTER:
            places[place] += 1
            writers[place][clean_writer(entry.get("ancient_author"))] += 1
            unplaced += place == "Unknown location"
        for _, word in words_of(tree, [None], []):
            form = word.get("f", {})
            language = str(form.get("lang", ""))
            if language.startswith(CANAANITE):
                canaanite += 1
                tagged.add(key)
            elif language.startswith(EGYPTIAN):
                egyptian += 1
            if form.get("cf") == HABIRU:
                (spelled if "ha-bi" in DAMAGE.sub("", word.get("frag", "")) else signs).add(entry["designation"])
                if place == "Byblos":
                    byblos.add(entry["designation"])
    cities = {}
    for city in record["letters"]["cities"]:
        name = city["provenience"]
        if not places[name]:
            fail(f"city {city['id']}: the edition places no client letter at {name!r}")
        cities[city["id"]] = {"letters": places[name], "writers": [[w, n] for w, n in writers[name].most_common(3) if w and w != "missing"]}
    spelled_from = {catalogue[ids[d]].get("provenience") for d in spelled}
    return {"catalogue": total, "withText": with_text, "clientLetters": sum(places.values()), "unplaced": unplaced, "cities": cities,
            "canaanite": {"words": canaanite, "letters": len(tagged), "egyptianWords": egyptian},
            "habiru": {"letters": len(spelled | signs), "spelled": sorted(spelled), "spelledFrom": sorted(spelled_from), "signsOnly": len(signs - spelled), "fromByblos": len(byblos)}}


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text + "\n")
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def build(site: Path, artifacts: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    raw = (root / RECORD).read_bytes()
    record = json.loads(raw)
    bsb, kjv = root / "data/text/bsb", root / "data/text/kjv"
    if not bsb.is_dir() or not kjv.is_dir():
        fail(f"expected the Bible text under {root / 'data/text'}, found no bsb or kjv folder")
    check_ruler(record)
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    check_quotes(record, verses)
    check_tags(kjv, record)
    archive = read_held_zip(artifacts.resolve())
    data = {"recordHash": hashlib.sha256(raw).hexdigest(), "verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "letters": count_letters(archive, record), "passages": read_passages(archive, record)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({size} bytes): {len(verses)} verses; letters {data['letters']['clientLetters']}; Habiru {data['letters']['habiru']['letters']}; Canaanite words {data['letters']['canaanite']['words']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.artifacts, args.output)


if __name__ == "__main__":
    main()
