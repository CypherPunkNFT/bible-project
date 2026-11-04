#!/usr/bin/env python3
"""Build src/pages/study/home/home-data.json for /study/home-and-household.

Reads the research record's verse list, and for each entry takes the text from the site's Berean copy (data/text/bsb) and
asserts that it holds the stated phrase. That proves the verse exists and carries the phrase; it does not prove the reading.
Counts the Hebrew word for bread (H3899) in the site's tagged King James as a cross-check beside the published figure.
A failure stops the build and writes nothing.

Usage: python scripts/build-home-study.py --site <Website folder>
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

RECORD = Path("content/academic-research/27-home-and-household.json")
OUTPUT = Path("src/pages/study/home/home-data.json")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
BREAD = "H3899"
BUDGET_BYTES = 20_000


def fail(message: str) -> NoReturn:
    sys.exit(f"build-home-study: {message}")


def run_text(run: object) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) else ""


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run_text(r) for r in runs)).strip()


def book_chapters(root: Path, code: str) -> Iterator[dict]:
    for path in sorted((root / code).glob("*.json")):
        yield from json.loads(path.read_text(encoding="utf-8")).values()


def has_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"\b{re.escape(phrase.lower())}\b", text.lower().replace("’", "'")) is not None


def read_verse(bsb_root: Path, entry: dict) -> str:
    code, chapter, verse, phrase = entry["code"], entry["chapter"], entry["verse"], entry["phrase"]
    if not BOOK_CODE.match(code):
        fail(f"{entry['label']}: book code {code!r} is not three capitals or digits")
    for found in book_chapters(bsb_root, code):
        if int(found["c"]) != chapter:
            continue
        for item in found["v"]:
            if item["n"] == str(verse):
                text = verse_text(item["r"])
                if not has_phrase(text, phrase):
                    fail(f"{entry['label']}: expected the phrase {phrase!r}, the Berean has: {text}")
                return text
    fail(f"the Berean has no {code} {chapter}:{verse} ({entry['label']})")


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
    with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
        stream.write(text + "\n")
    os.replace(temp, out)


def build(site: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    record = json.loads((root / RECORD).read_text(encoding="utf-8"))
    bsb, kjv = root / "data/text/bsb", root / "data/text/kjv"
    if not bsb.is_dir() or not kjv.is_dir():
        fail(f"expected the Bible text under {root / 'data/text'}, found no bsb or kjv folder")
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    data = {"verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "breadTags": count_tag(kjv, BREAD)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(text.encode("utf-8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf-8'))} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(verses)} verses; {BREAD} tags {data['breadTags']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.output)


if __name__ == "__main__":
    main()
