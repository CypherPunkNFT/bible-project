#!/usr/bin/env python3
"""Build the site's data from ../../sources into data/ (generated, not committed).

    python scripts/build-data.py            # everything
    python scripts/build-data.py --only kjv # one version (abbreviation, lower case) + shared files

Stops on: a source zip whose checksum differs from sources/SOURCES.md, an unknown book code, an unknown
paragraph marker. Writes into data.new/ and swaps it in only when everything succeeded.
"""

import argparse
import hashlib
import importlib.machinery
import json
import re
import shutil
import sys
import time
import types
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.books import BOOK_NUMBER, BOOKS, EQUIVALENT, SKIPPED_CODES  # noqa: E402
from bible.opendata import read_cross_references, read_places  # noqa: E402
from bible.translations import as_dicts  # noqa: E402
from bible.usfm import parse_book, plain_text  # noqa: E402

SITE = Path(__file__).resolve().parents[1]
SOURCES = SITE.parent / "sources"
OUT_FINAL = SITE / "data"
OUT = SITE / "data.new"
SECTIONS = ["history", "poetry", "prophets", "gospels", "epistles", "revelation", "apocrypha"]


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def recorded_checksums() -> dict[str, str]:
    table = (SOURCES / "SOURCES.md").read_text(encoding="utf-8")
    return {m.group(1): m.group(2) for m in re.finditer(r"^\| \[([\w-]+)\]\([^)]*\) \|.*\| ([0-9a-f]{16}) \|$", table, re.M)}


def check_source(folder: str, zip_path: Path, recorded: dict[str, str]) -> None:
    if folder not in recorded:
        raise SystemExit(f"checksum: {folder} is not listed in sources/SOURCES.md; add it before building")
    actual = hashlib.sha256(zip_path.read_bytes()).hexdigest()[:16]
    if actual != recorded[folder]:
        raise SystemExit(f"checksum: {zip_path} is {actual}, SOURCES.md records {recorded[folder]} — the source changed")


def build_translation(meta: dict, recorded: dict[str, str], warnings: list[str]) -> dict:
    folder = SOURCES / "ebible" / meta["id"]
    check_source(meta["id"], folder / f"{meta['id']}_usfm.zip", recorded)
    slug = meta["abbr"].lower()
    books: dict[str, dict] = {}
    for path in sorted(folder.glob("*.usfm")):
        head = path.read_text(encoding="utf-8-sig")[:200]
        code_match = re.search(r"\\id (\S+)", head)
        code = code_match.group(1) if code_match else None
        if code in SKIPPED_CODES:
            continue
        if code not in BOOK_NUMBER:
            raise SystemExit(f"{path}: unknown book code {code!r}; add it to scripts/bible/books.py or SKIPPED_CODES")
        book = parse_book(path.read_text(encoding="utf-8"), f"{meta['id']}/{path.name}", meta["strongs"], warnings)
        write_json(OUT / "text" / slug / f"{code}.json", book)
        plain = {f"{ch['c']}:{v['n']}": plain_text(v["r"]) for ch in book["chapters"] for v in ch["v"]}
        write_json(OUT / "plain" / slug / f"{code}.json", plain)
        books[code] = {"chapters": [ch["c"] for ch in book["chapters"]],
                       "verses": sum(len(ch["v"]) for ch in book["chapters"]), "_book": book}
    return {**meta, "slug": slug, "books": books}


def numbering_report(entry: dict) -> str:
    books = entry["books"]
    psalm3 = next((len(ch["v"]) for ch in books["PSA"]["_book"]["chapters"] if ch["c"] == "3"), None) if "PSA" in books else None
    mal = len(books["MAL"]["chapters"]) if "MAL" in books else None
    psa = len(books["PSA"]["chapters"]) if "PSA" in books else None
    return f"Psalm 3 verses={psalm3} (KJV 8, Hebrew 9) · Malachi chapters={mal} (KJV 4, Hebrew 3) · Psalms={psa}"


def chapter_words(chapter: dict) -> tuple[int, int]:
    words = red = 0
    for verse in chapter["v"]:
        for run in verse["r"]:
            if isinstance(run, dict):
                continue
            text, flags = (run, "") if isinstance(run, str) else (run[0], run[1])
            count = len(text.split())
            words += count
            red += count if "j" in flags else 0
    return words, red


def build_stats(kjv: dict) -> tuple[dict, list[tuple[str, str]]]:
    """Per-book and per-chapter sizes from the KJV; also the global chapter order used by the arc chart."""
    books, chapter_order = [], []
    for code, name, section, _osis in BOOKS:
        if code not in kjv["books"]:
            continue
        chapters = []
        for chapter in kjv["books"][code]["_book"]["chapters"]:
            words, red = chapter_words(chapter)
            chapters.append([len(chapter["v"]), words, red])
            if section != "apocrypha":
                chapter_order.append((code, chapter["c"]))
        books.append({"code": code, "name": name, "section": section, "chapters": chapters,
                      "verses": sum(c[0] for c in chapters), "words": sum(c[1] for c in chapters),
                      "red": sum(c[2] for c in chapters)})
    return {"source": "KJV", "books": books}, chapter_order


def build_cross_references(chapter_order: list[tuple[str, str]]) -> dict:
    edges = read_cross_references(SOURCES / "openbible" / "cross_references.txt")
    code_of = {number: code for code, number in BOOK_NUMBER.items()}
    lines = ["from_start\tfrom_end\tto_start\tto_end\tsource\tweight"]
    per_book: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    book_pairs: Counter = Counter()
    chapter_index = {(code, int(c)): i for i, (code, c) in enumerate(chapter_order) if c.isdigit()}
    arcs: Counter = Counter()
    for from_start, from_end, to_start, to_end, votes in edges:
        lines.append(f"{from_start}\t{from_end}\t{to_start}\t{to_end}\topenbible\t{votes}")
        book = code_of[from_start // 1_000_000]
        key = f"{from_start // 1000 % 1000}:{from_start % 1000}"
        per_book[book][key].append([to_start, to_end if to_end != to_start else 0, votes])
        target = code_of[to_start // 1_000_000]
        book_pairs[(book, target)] += 1
        a = chapter_index.get((book, from_start // 1000 % 1000))
        b = chapter_index.get((target, to_start // 1000 % 1000))
        if a is not None and b is not None and a != b:
            arcs[(min(a, b), max(a, b))] += 1
    (OUT / "connections").mkdir(parents=True, exist_ok=True)
    (OUT / "connections" / "edges.tsv").write_text("\n".join(lines) + "\n", encoding="utf-8")
    for book, verses in per_book.items():
        write_json(OUT / "xref" / f"{book}.json", {k: sorted(v, key=lambda r: -r[2]) for k, v in verses.items()})
    write_json(OUT / "xref-books.json", [[a, b, n] for (a, b), n in sorted(book_pairs.items())])
    write_json(OUT / "xref-arcs.json", {"chapters": [f"{code} {c}" for code, c in chapter_order],
                                         "arcs": [[a, b, n] for (a, b), n in sorted(arcs.items())]})
    return {"edges": len(edges), "bookPairs": len(book_pairs), "arcs": len(arcs)}


def catalog(entries: list[dict], stamp: str) -> dict:
    return {
        "stamp": stamp,
        "sections": SECTIONS,
        "books": [{"code": c, "num": BOOK_NUMBER[c], "name": n, "section": s} for c, n, s, _o in BOOKS],
        "equivalent": EQUIVALENT,
        "translations": [{k: e[k] for k in ("slug", "abbr", "name", "year", "lang", "dir", "numbering")}
                         | {"books": {code: b["chapters"] for code, b in e["books"].items()},
                            "verses": sum(b["verses"] for b in e["books"].values())} for e in entries],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--only", help="build just this version (lower-case abbreviation) plus shared files")
    args = parser.parse_args()
    started = time.time()
    if OUT.exists():
        shutil.rmtree(OUT)
    recorded, warnings, entries = recorded_checksums(), [], []
    for meta in as_dicts():
        if args.only and meta["abbr"].lower() not in (args.only, "kjv"):
            continue
        entry = build_translation(meta, recorded, warnings)
        entries.append(entry)
        print(f"{entry['abbr']:5} {len(entry['books']):3} books {sum(b['verses'] for b in entry['books'].values()):6} verses · {numbering_report(entry)}")
    kjv = next(e for e in entries if e["abbr"] == "KJV")
    stats, chapter_order = build_stats(kjv)
    write_json(OUT / "stats.json", stats)
    check_source("openbible", SOURCES / "openbible" / "cross-references.zip", recorded)
    print("cross-references:", build_cross_references(chapter_order))
    check_source("openbible-geo", SOURCES / "openbible-geo" / "Bible-Geocoding-Data.zip", recorded)
    places = read_places(SOURCES / "openbible-geo" / "Bible-Geocoding-Data-main" / "data" / "ancient.jsonl")
    write_json(OUT / "places.json", places)
    print(f"places: {len(places)}")
    stamp = hashlib.sha256(str(time.time()).encode()).hexdigest()[:10]
    result = catalog(entries, stamp)
    if args.only:
        result["translations"] = carry_over_other_versions(result["translations"])
    write_json(OUT / "catalog.json", result)
    study_failed = build_study_into_new_data()
    files = [p for p in OUT.rglob("*") if p.is_file()]
    size_mb = sum(p.stat().st_size for p in files) / 1e6
    print(f"warnings: {len(warnings)}", *warnings[:20], sep="\n  ")
    swap_into_place()
    print(f"wrote {len(files)} files, {size_mb:.1f} MB in {time.time() - started:.0f}s")
    if study_failed:
        raise SystemExit(f"the Bible data was rebuilt, but the Study data failed and the previous Study files were "
                         f"kept: {study_failed}")


def build_study_into_new_data() -> str:
    """Run scripts/build-study.py against the NEW KJV/BSB text. On failure keep the live study files instead of
    losing the whole Bible rebuild; returns the error text ("" = success)."""
    loader = importlib.machinery.SourceFileLoader("build_study", str(Path(__file__).with_name("build-study.py")))
    module = types.ModuleType(loader.name)
    module.__file__ = loader.path
    loader.exec_module(module)
    try:
        report = module.build(OUT, OUT / "study")
        print("study:", report["harmony"], "·", report["letters"], "·", report["prophets"])
        return ""
    except (SystemExit, Exception) as error:  # any study failure keeps the Bible rebuild (reported, non-zero exit)
        print(f"STUDY BUILD FAILED: {error}", file=sys.stderr)
        if (OUT_FINAL / "study").exists():
            shutil.copytree(OUT_FINAL / "study", OUT / "study", dirs_exist_ok=True)
        return str(error)


def carry_over_other_versions(built: list[dict]) -> list[dict]:
    """--only: copy every version not rebuilt this run from the live data, and keep its catalogue entry."""
    live = OUT_FINAL / "catalog.json"
    if not live.exists():
        return built
    previous = json.loads(live.read_text(encoding="utf-8"))["translations"]
    built_slugs = {t["slug"] for t in built}
    for entry in previous:
        if entry["slug"] in built_slugs:
            continue
        for kind in ("text", "plain"):
            shutil.copytree(OUT_FINAL / kind / entry["slug"], OUT / kind / entry["slug"])
    by_slug = {t["slug"]: t for t in previous} | {t["slug"]: t for t in built}
    return [by_slug[m["abbr"].lower()] for m in as_dicts() if m["abbr"].lower() in by_slug]


def swap_into_place() -> None:
    """data.new -> data without ever leaving data/ half-deleted: rename the old one aside first."""
    old = SITE / "data.old"
    if old.exists():
        shutil.rmtree(old)
    if OUT_FINAL.exists():
        OUT_FINAL.rename(old)
    OUT.rename(OUT_FINAL)
    if old.exists():
        shutil.rmtree(old, ignore_errors=False)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
