#!/usr/bin/env python3
"""Build src/pages/study/church-reading/church-reading-data.json for /study/how-the-church-has-read-the-bible.

Reads the research record's verse list, and for each entry takes the text from the site's Berean copy (data/text/bsb) and
asserts that it holds the stated phrase. Asserts that Galatians 4:21-31 runs unbroken, that each reader's phrase occurs exactly
once in the verse the reader fastens on and that different phrases never overlap, that the readers' letters and dates run in
order, that the Greek word behind verse 24 is tagged once in the site's King James, that quoted Scripture is the Berean's
wording, and that the 1689 Confession's wording is as the site holds it. That proves the verses and the counts; it does not
prove any reading. A failure stops the build and writes nothing.

Usage: python scripts/build-church-reading-study.py --site <Website folder>
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

RECORD = Path("content/academic-research/30-how-the-church-has-read-the-bible.json")
OUTPUT = Path("src/pages/study/church-reading/church-reading-data.json")
CONFESSION = Path("data/creeds/doc/1689-london-baptist-confession-1677.b1.json")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
GREEK_TAG = "G238"
BUDGET_BYTES = 12_000
PASSAGE = [f"Galatians 4:{verse}" for verse in range(21, 32)]
READERS_EACH_MARGIN = 6
# Scripture quoted inside the record's own prose, each with the verse that holds it.
SCRIPTURE_QUOTES = (
    ("Galatians 4:21", "you who want to be under the law"),
    ("Galatians 4:31", "brothers"),
    ("Psalm 147:12", "Exalt the LORD, O Jerusalem"),
    ("1 Corinthians 10:11", "these things"),
)
CONFESSION_QUOTES = ("not manifold but one", "must be searched by other places that speak more clearly")


def fail(message: str) -> NoReturn:
    sys.exit(f"build-church-reading-study: {message}")


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
    if normal(entry["phrase"]) not in normal(text):
        fail(f"{entry['label']}: expected the phrase {entry['phrase']!r}, the Berean has: {text}")
    return text


def check_passage(record: dict) -> None:
    labels = [v["label"] for v in record["verses"]]
    if labels[: len(PASSAGE)] != PASSAGE:
        fail(f"the record's verses must open with {PASSAGE}, it has {labels[:len(PASSAGE)]}")


def check_readers(record: dict) -> None:
    readers, lanes = record["readers"], {lane["id"] for lane in record["lanes"]}
    marks = [r["mark"] for r in readers]
    if marks != sorted(marks) or len(set(marks)) != len(marks):
        fail(f"the readers' letters must run in order without a repeat, they run {marks}")
    starts = [r["from"] for r in readers]
    if starts != sorted(starts):
        fail(f"the readers must run in date order, they start at {starts}")
    questions = {q["id"] for q in record["questions"]}
    for reader in readers:
        if reader["from"] > reader["to"]:
            fail(f"{reader['id']}: its range runs backwards, {reader['from']} to {reader['to']}")
        if reader["lane"] not in lanes:
            fail(f"{reader['id']}: lane {reader['lane']!r} is not one of {sorted(lanes)}")
        if set(reader["answers"]) != questions:
            fail(f"{reader['id']}: answers {sorted(reader['answers'])}, the questions are {sorted(questions)}")
    for side in ("left", "right"):
        count = sum(r["side"] == side for r in readers)
        if count != READERS_EACH_MARGIN:
            fail(f"the {side} margin holds {count} readers, expected {READERS_EACH_MARGIN}")


def check_phrases(record: dict, verses: dict[str, dict]) -> None:
    """Readers may share one phrase; different phrases must each sit once in the verse and never overlap."""
    spans: dict[str, set[tuple[int, int]]] = {}
    for reader in record["readers"]:
        label, phrase = reader["fasten"]["verse"], normal(reader["fasten"]["phrase"])
        if label not in PASSAGE:
            fail(f"{reader['id']}: fastens on {label}, outside the passage")
        text = normal(verses[label]["text"])
        if text.count(phrase) != 1:
            fail(f"{reader['id']}: {phrase!r} occurs {text.count(phrase)} times in {label}, expected once: {text}")
        start = text.index(phrase)
        spans.setdefault(label, set()).add((start, start + len(phrase)))
    for label, found in spans.items():
        ordered = sorted(found)
        for (_, end), (start, _) in zip(ordered, ordered[1:]):
            if start < end:
                fail(f"{label}: two different phrases overlap at {ordered}")


def check_quotes(verses: dict[str, dict], confession_text: str) -> None:
    for label, quoted in SCRIPTURE_QUOTES:
        if normal(quoted) not in normal(verses[label]["text"]):
            fail(f"{label}: the quotation {quoted!r} is not the Berean's wording: {verses[label]['text']}")
    for quoted in CONFESSION_QUOTES:
        if quoted not in confession_text:
            fail(f"the 1689 Confession as held at {CONFESSION} does not contain {quoted!r}")


def count_tag(root: Path, number: str) -> list[tuple[str, str]]:
    """Each run tagged with the number, as (book chapter:verse, the word the translation prints)."""
    found = []
    for book in sorted(p for p in root.iterdir() if p.is_dir()):
        for chapter in book_chapters(root, book.name):
            for verse in chapter["v"]:
                for run in verse["r"]:
                    if isinstance(run, list) and len(run) == 3 and number in [re.sub(r"[a-z]$", "", n) for n in run[2].split()]:
                        found.append((f"{book.name} {chapter['c']}:{verse['n']}", run[0].strip()))
    return found


def read_word(kjv: Path, greek: Path) -> dict:
    tagged = count_tag(kjv, GREEK_TAG)
    if [where for where, _ in tagged] != ["GAL 4:24"]:
        fail(f"expected {GREEK_TAG} once, at GAL 4:24, the tagged King James has {tagged}")
    in_greek = [word for where, word in count_tag(greek, GREEK_TAG) if where == "GAL 4:24"]
    if len(in_greek) != 1:
        fail(f"expected {GREEK_TAG} once in the Greek at GAL 4:24, it has {in_greek}")
    return {"tag": GREEK_TAG, "times": len(tagged), "kingJames": tagged[0][1], "greek": in_greek[0]}


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
    bsb, kjv, greek = root / "data/text/bsb", root / "data/text/kjv", root / "data/text/tr"
    for folder in (bsb, kjv, greek):
        if not folder.is_dir():
            fail(f"expected the Bible text at {folder}, found no folder")
    check_passage(record)
    check_readers(record)
    verses = {v["label"]: {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"], "text": read_verse(bsb, v)} for v in record["verses"]}
    check_phrases(record, verses)
    check_quotes(verses, (root / CONFESSION).read_text(encoding="utf-8"))
    data = {"verses": {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}, "word": read_word(kjv, greek)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({size} bytes): {len(verses)} verses; {GREEK_TAG} {data['word']['times']} time, {data['word']['greek']} / {data['word']['kingJames']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.output)


if __name__ == "__main__":
    main()
