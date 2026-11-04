#!/usr/bin/env python3
"""Build src/pages/study/farming/farming-data.json for /study/the-farming-year.

Reads the research record's verse list, and for each entry takes the text from the site's Berean copy (data/text/bsb) and
asserts that it holds the stated phrase. Asserts that each word the page matches to the stone carries the stated Strong's
number in the site's tagged King James, that each quotation of Scripture in the clock is the Berean's own wording, that the
seasons add up to twelve months in order, and that the stone's lines rebuild the seasons. It counts two Hebrew words as a
cross-check. That proves the verses and the arithmetic; it does not prove any reading. A failure stops the build and writes
nothing.

Usage: python scripts/build-farming-study.py --site <Website folder>
"""
import argparse
import json
import os
import re
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/29-the-farming-year.json")
OUTPUT = Path("src/pages/study/farming/farming-data.json")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
QUOTED = re.compile(r"“([^”]+)”")
THRESHING_FLOOR, HARVEST = "H1637", "H7105"
BUDGET_BYTES = 30_000
MONTHS_IN_YEAR = 12
# The passages the page leans on for a word the stone also uses, beyond each season's own match.
EXTRA_TAGS = (("Ruth 1:22", "H7105", "harvest"), ("Amos 8:2", "H7093", "end"))


def fail(message: str) -> NoReturn:
    sys.exit(f"build-farming-study: {message}")


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


def check_tags(kjv_root: Path, record: dict) -> None:
    entries = {v["label"]: v for v in record["verses"]}
    for season in record["seasons"]:
        same = season["sameWord"]
        if same["verse"] not in entries:
            fail(f"{same['verse']} is matched to season {season['id']} but is not in the record's verse list")
        words = tagged_words(find_verse(kjv_root, entries[same["verse"]]))
        if same["tags"][0] not in words or same["english"] not in words[same["tags"][0]]:
            fail(f"{same['verse']}: expected {same['tags'][0]} on the word {same['english']!r}, the tagged King James has {words}")
        for tag in same["tags"][1:]:
            if tag not in words:
                fail(f"{same['verse']}: expected the Strong's number {tag} in the tagged King James")
    for label, tag, english in EXTRA_TAGS:
        words = tagged_words(find_verse(kjv_root, entries[label]))
        if english not in words.get(tag, ""):
            fail(f"{label}: expected {tag} on the word {english!r}, the tagged King James has {words}")


def check_year(record: dict) -> None:
    running = 0
    for season in record["seasons"]:
        if season["start"] != running:
            fail(f"season {season['id']} starts at {season['start']}, expected {running}")
        running += season["months"]
    if running != MONTHS_IN_YEAR:
        fail(f"the seasons add up to {running} months, expected {MONTHS_IN_YEAR}")


def check_lines(record: dict) -> None:
    """Joined up, the stone's lines must rebuild the eight seasons in order: this is what lets the page show a word broken across two."""
    joined = re.sub(r"\s+", " ", " ".join(line["hebrew"] for line in record["lines"])).replace("ז רע", "זרע")
    seasons = " ".join(s["hebrew"] for s in record["seasons"])
    if joined != seasons:
        fail(f"the stone's lines read {joined!r}, the seasons read {seasons!r}")


def check_quotes(record: dict, verses: dict[str, dict]) -> None:
    for item in record["clock"]:
        held = " ".join(normal(verses[label]["text"]) for label in item["verses"])
        for quoted in QUOTED.findall(item["says"]):
            if normal(quoted).rstrip(".,") not in held:
                fail(f"clock {item['id']}: the quotation {quoted!r} is not the Berean's wording in {item['verses']}")


def count_tag(kjv_root: Path, number: str) -> int:
    """Each tag holding the number counts once; a tag's letter suffix is dropped, as in the Strong's numbers study."""
    total = 0
    for book in sorted(p for p in kjv_root.iterdir() if p.is_dir()):
        for chapter in book_chapters(kjv_root, book.name):
            for verse in chapter["v"]:
                for run in verse["r"]:
                    if isinstance(run, list) and len(run) == 3:
                        total += sum(re.sub(r"[a-z]$", "", n) == number for n in run[2].split())
    return total


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text + "\n")
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def build(site: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    record = json.loads((root / RECORD).read_text(encoding="utf-8"))
    bsb, kjv = root / "data/text/bsb", root / "data/text/kjv"
    if not bsb.is_dir() or not kjv.is_dir():
        fail(f"expected the Bible text under {root / 'data/text'}, found no bsb or kjv folder")
    check_year(record)
    check_lines(record)
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    check_quotes(record, verses)
    check_tags(kjv, record)
    data = {"verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "threshingFloorTags": count_tag(kjv, THRESHING_FLOOR), "harvestTags": count_tag(kjv, HARVEST)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(text.encode("utf-8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf-8'))} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(verses)} verses; {THRESHING_FLOOR} tags {data['threshingFloorTags']}; {HARVEST} tags {data['harvestTags']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.output)


if __name__ == "__main__":
    main()
