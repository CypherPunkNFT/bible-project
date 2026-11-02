"""No file but the Bibles themselves may hold a verse's wording: everything else stores verse ids (src/lib/verses.ts).

Looks for every whole verse of the Berean, the King James, the World English and the American Standard, ten words or
longer, in the site's code and data, where a text is nothing but that verse. Scripture quoted inside a sentence stays:
historic documents (creeds, dictionaries, the teachers' works) and the site's own sentences quote it in their own way.

  py -3.12 scripts/check-verse-wording.py           # fails if a whole verse is found
  py -3.12 scripts/check-verse-wording.py --sample 200 --from DIR   # the proof: 200 Berean verses from the old data DIR
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[1]
BIBLES = ("bsb", "kjv", "web", "asv")
ROOTS = ("src", "data")
EXTENSIONS = {".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".html", ".txt", ".md"}
# The Bibles themselves and what is made from them for the reader and for search; the home page banners' own short
# wording in each language; historic documents, which quote in
# their own words; the translation table, whose keys are English the code once held; the question bank, whose quiz sets
# are drawn elsewhere; design mock-ups, which are never released; tests.
ALLOWED = re.compile(
    r"^(data/(plain|text|search|questions|summaries)/"
    r"|data/creeds/doc/"
    r"|data/i18n/[^/]+/(creeds/doc/|ui\.json)"
    r"|src/data/teachers/"
    r"|src/generated/"
    r"|src/components/home/(banner-verses|emblem-designs)\.tsx"
    r"|src/pages/mockup/"
    r"|src/components/home/mockups/"
    r"|src/pages/EmblemMockupsPage)"
    r"|\.test\.tsx?$"
)
SKIPPED_KEYS = {"dictionary"}
# Sentences of the site's own that happen to run word for word with a verse in some Bible.
OWN_SENTENCES = {"He killed James the brother of John with the sword."}
WORD = re.compile(r"[^\W_]+")
MINIMUM_WORDS = 10
KEY_WORDS = 8
SHORTEST_VERSE_TEXT = 2 * MINIMUM_WORDS - 1
SCAN_WORKERS = 12
_worker_index: dict[tuple[str, ...], list[tuple[str, list[str]]]] = {}


def words_of(text: str) -> list[str]:
    return WORD.findall(text.lower().replace("’", "").replace("'", "").replace("\\n", " "))


def bible_verses(slug: str) -> dict[str, str]:
    verses: dict[str, str] = {}
    for path in sorted((WEBSITE / "data" / "plain" / slug).glob("*.json")):
        for key, text in json.loads(path.read_text(encoding="utf-8")).items():
            if isinstance(text, str):
                verses[f"{slug} {path.stem} {key}"] = text
    return verses


def verse_index() -> dict[tuple[str, ...], list[tuple[str, list[str]]]]:
    index: dict[tuple[str, ...], list[tuple[str, list[str]]]] = {}
    for slug in BIBLES:
        for name, text in bible_verses(slug).items():
            words = words_of(text)
            if len(words) >= MINIMUM_WORDS:
                index.setdefault(tuple(words[:KEY_WORDS]), []).append((name, words))
    return index


def files_to_scan() -> list[Path]:
    found: list[Path] = []
    for root in ROOTS:
        for path in (WEBSITE / root).rglob("*"):
            if path.suffix in EXTENSIONS and path.is_file() and not ALLOWED.search(path.relative_to(WEBSITE).as_posix()):
                found.append(path)
    return found


def strings_in(path: Path) -> list[str]:
    """Each text of a data file, each line of a code file: the units a verse could stand alone in."""
    raw = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix != ".json":
        return re.findall(r"""["'`>]([^"`<>]{40,})["'`<]""", raw)
    found: list[str] = []
    def walk(node: object) -> None:
        if isinstance(node, str) and node not in OWN_SENTENCES:
            found.append(node)
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for key, item in node.items():
                if key not in SKIPPED_KEYS:
                    walk(item)
    walk(json.loads(raw))
    return found


def whole_verses_in(path: Path, index: dict[tuple[str, ...], list[tuple[str, list[str]]]]) -> list[str]:
    hits: list[str] = []
    for text in strings_in(path):
        # A text that is nothing but a verse starts with that verse's key, and ten words need at least 19 characters.
        if len(text) < SHORTEST_VERSE_TEXT:
            continue
        words = words_of(text)
        for name, verse in index.get(tuple(words[:KEY_WORDS]), ()):
            if words == verse:
                hits.append(name)
    return hits


def _start_scan_worker() -> None:
    global _worker_index
    _worker_index = verse_index()


def _verses_in_file(path: Path) -> list[str]:
    return whole_verses_in(path, _worker_index)


def check_all() -> int:
    files = files_to_scan()
    counts: Counter[str] = Counter()
    example: dict[str, str] = {}
    # Reading 24,000 JSON files is pure computing, so it shares out among the processors. map keeps the files' order.
    with ProcessPoolExecutor(max_workers=min(SCAN_WORKERS, os.cpu_count() or 1), initializer=_start_scan_worker) as pool:
        results = list(pool.map(_verses_in_file, files, chunksize=64))
    for path, hits in zip(files, results):
        if hits:
            where = path.relative_to(WEBSITE).as_posix()
            counts[where] = len(hits)
            example[where] = hits[0]
    for where, count in counts.most_common():
        print(f"{count:6} {where}  e.g. {example[where]}")
    print(f"{sum(counts.values())} whole verses in {len(counts)} files; expected none (ids only, words from the reader's Bible)")
    return 1 if counts else 0


def old_data_verses(folder: Path, berean: dict[str, str]) -> list[str]:
    """Berean verses the old files really held: the sample is drawn from what used to be copied."""
    by_text = {" ".join(words_of(text)): text for text in berean.values()}
    found: set[str] = set()
    def walk(node: object) -> None:
        if isinstance(node, str):
            key = " ".join(words_of(node))
            if key in by_text and len(key.split()) >= MINIMUM_WORDS:
                found.add(by_text[key])
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for item in node.values():
                walk(item)
    for path in sorted(folder.rglob("*.json")):
        walk(json.loads(path.read_text(encoding="utf-8")))
    return sorted(found)


def prove(count: int, folder: Path) -> int:
    berean = bible_verses("bsb")
    pool = old_data_verses(folder, berean)
    if len(pool) < count:
        raise SystemExit(f"proof: asked for {count} verses, the old data at {folder} holds only {len(pool)}")
    sample = random.Random(20261101).sample(pool, count)
    texts = {path: path.read_text(encoding="utf-8", errors="replace") for path in files_to_scan()}
    missing_from_bible = [text for text in sample if text not in berean.values()]
    found: Counter[str] = Counter()
    for verse in sample:
        for path, text in texts.items():
            if verse in text:
                found[path.relative_to(WEBSITE).as_posix()] += 1
    print(f"{count} Berean verses from {len(pool)} found in the old data; files scanned: {len(texts)}")
    print(f"sampled verses not in data/plain/bsb: {len(missing_from_bible)}")
    print(f"sampled verses found word for word outside the Bibles: {sum(found.values())}")
    for where, hits in found.most_common(40):
        print(f"{hits:6} {where}")
    return 1 if found or missing_from_bible else 0


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample", type=int)
    parser.add_argument("--from", dest="folder", type=Path)
    arguments = parser.parse_args()
    if arguments.sample:
        if not arguments.folder:
            parser.error("--sample needs --from DIR")
        return prove(arguments.sample, arguments.folder)
    return check_all()


if __name__ == "__main__":
    sys.exit(main())
