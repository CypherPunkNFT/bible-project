#!/usr/bin/env python3
"""Build src/pages/study/nt-books/nt-books-data.json for /study/how-the-new-testament-books-were-written.

Reads the research record (content/academic-research/42-how-the-new-testament-books-were-written.json) and the site's
Berean (data/text/bsb). It takes the text of every verse the page shows from the Berean: the record's own verse list,
every reference written in the record's prose (both "Mark 2:10" and, in the reference table, "(16:22)" read against the
row's book), and the synopsis passages. It refuses the build, writing nothing, when:
  - a reference does not exist in the Berean, or a passage runs backwards;
  - a quotation set beside a reference is not word for word in the Berean at that reference (one known mismatch in the
    record is listed in KNOWN_NOT_BEREAN, so it is reported, and the list itself fails once the record changes);
  - a tie in the synopsis is not word for word in each verse it ties;
  - a link leaves the site or names an address the site does not have;
  - the reference table does not hold the twenty-seven books once each in canonical order, or a date in it cannot be
    read as a range;
  - a source id or a count the page depends on is missing.
It proves references, wording and shape. It does not prove that any reading, date or attribution is right.

Usage: python scripts/build-nt-books-study.py [--site <Website folder>] [--check] [--prove-refusals]
"""
import argparse
import copy
import hashlib
import json
import os
import re
import sys
import tempfile
from functools import lru_cache
from pathlib import Path

RECORD = Path("content/academic-research/42-how-the-new-testament-books-were-written.json")
OUTPUT = Path("src/pages/study/nt-books/nt-books-data.json")
APP = Path("src/App.tsx")
BUDGET_BYTES = 120_000
CHECK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")

# The twenty-seven books in canonical order, with the Berean's book codes. Single-chapter books take "Philemon 24".
BOOKS = [("Matthew", "MAT"), ("Mark", "MRK"), ("Luke", "LUK"), ("John", "JHN"), ("Acts", "ACT"), ("Romans", "ROM"),
         ("1 Corinthians", "1CO"), ("2 Corinthians", "2CO"), ("Galatians", "GAL"), ("Ephesians", "EPH"), ("Philippians", "PHP"),
         ("Colossians", "COL"), ("1 Thessalonians", "1TH"), ("2 Thessalonians", "2TH"), ("1 Timothy", "1TI"), ("2 Timothy", "2TI"),
         ("Titus", "TIT"), ("Philemon", "PHM"), ("Hebrews", "HEB"), ("James", "JAS"), ("1 Peter", "1PE"), ("2 Peter", "2PE"),
         ("1 John", "1JN"), ("2 John", "2JN"), ("3 John", "3JN"), ("Jude", "JUD"), ("Revelation", "REV")]
CODE = dict(BOOKS)
ONE_CHAPTER = {"Philemon", "2 John", "3 John", "Jude"}
# Longest names first, so "1 John" is never read as "John". The page's own reader (model.ts) uses the same pattern.
BOOK_NAMES = "|".join(sorted((re.escape(name) for name, _ in BOOKS), key=len, reverse=True))
SPAN = r"\d+:\d+(?:–\d+(?::\d+)?)?"
REF = re.compile(rf"\b({BOOK_NAMES}) ({SPAN}(?:, \d+(?:–\d+)?|; {SPAN})*)")
REF_ONE = re.compile(rf"\b(Philemon|2 John|3 John|Jude) (\d+(?:–\d+)?)(?![\d:])")
# In the reference table a reference sits in brackets after the book's own claim: "(1:1)", "(1:1, 4, 9; 22:8)", "(1)".
TABLE_REF = re.compile(rf"\(({SPAN}(?:, \d+(?:–\d+)?|; {SPAN})*|\d+)\)")

# Quotations set beside a reference are checked against it. One in the record is not the Berean's wording; it is listed,
# shown on the page as the record has it, and reported in the README for the owner. Remove an entry when the record changes.
KNOWN_NOT_BEREAN = {("the first account", "Acts 1:1"): "the Berean reads “In my first book, O Theophilus”"}

# A tie is the same words in each column of a synopsis case. It is checked word for word against each verse it ties.
TIES = {
    "paralytic": {"words": "said to the paralytic", "verses": ["Mark 2:10", "Matthew 9:6", "Luke 5:24"],
                  "note": "The narrator's aside, in the same place in all three"},
    "baptist": {"words": "brood of vipers, who warned you to flee from the coming wrath?", "verses": ["Matthew 3:7", "Luke 3:7"],
                "note": "The sermon's first sentence, the same in both"},
    "inscription": {"words": "THE KING OF THE JEWS", "verses": ["Matthew 27:37", "Mark 15:26", "Luke 23:38", "John 19:19"],
                    "note": "The words all four notices share"},
}
NGRAM = 4

# Links: the record names a study by its title and holds no address. Only an address the site already has is linked.
LINKS = {
    "How the letters came to be": "/study/letters/how-the-letters-came-to-be",
    "How the canon took shape": "/study/how-the-canon-took-shape",
    "The manuscripts of the Bible": "/study/manuscripts",
    "How New Testament Greek works": "/study/how-new-testament-greek-works",
}

COUNTS = {"synoptic.cases": 3, "synoptic.views": 4, "synoptic.layers": 5, "witnesses.records": 5, "quest.stages": 7,
          "claims": 5, "paul.groups": 3, "hebrews.views": 4, "referenceTable": 27}
STATUSES = {"located", "read", "part", "second-hand"}


class BuildError(Exception):
    pass


def fail(message: str):
    raise BuildError(message)


def plain(text: str) -> str:
    return CHECK.sub("", text)


def walk_strings(node, path=""):
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for key, value in node.items():
            if key in {"checkNotes", "verses", "sources", "openQuestions"}:
                continue
            yield from walk_strings(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from walk_strings(value, f"{path}[{index}]")


# --- The Berean ---------------------------------------------------------------------------------------------------

def run_text(run) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) and run and isinstance(run[0], str) else ""


@lru_cache(maxsize=None)
def load_book(bsb: Path, code: str) -> dict:
    chapters: dict[int, dict[int, str]] = {}
    for path in sorted((bsb / code).glob("*.json")):
        for found in json.loads(path.read_text(encoding="utf-8")).values():
            verses = chapters.setdefault(int(found["c"]), {})
            for item in found["v"]:
                if item["n"].isdigit():
                    verses[int(item["n"])] = re.sub(r"\s+", " ", "".join(run_text(r) for r in item["r"])).strip()
    if not chapters:
        fail(f"the Berean has no book {code} under {bsb}")
    return chapters


def verse_text(bsb: Path, book: str, chapter: int, verse: int) -> str:
    if book not in CODE:
        fail(f"{book} {chapter}:{verse}: {book!r} is not a New Testament book this page knows")
    text = load_book(bsb, CODE[book]).get(chapter, {}).get(verse)
    if not text:
        fail(f"the Berean has no {book} {chapter}:{verse}")
    return text


def expand(book: str, spec: str) -> list[tuple[int, int]]:
    """'13:5, 13; 15:37–39' → [(13,5), (13,13), (15,37), (15,38), (15,39)]. Single-chapter books may give verses only."""
    out: list[tuple[int, int]] = []
    chapter = 1 if book in ONE_CHAPTER else None
    for part in spec.split("; "):
        for piece in part.split(", "):
            m = re.fullmatch(r"(?:(\d+):)?(\d+)(?:–(?:(\d+):)?(\d+))?", piece)
            if not m:
                fail(f"{book} {spec}: cannot read {piece!r} as a reference")
            if m.group(1):
                chapter = int(m.group(1))
            if chapter is None:
                fail(f"{book} {spec}: {piece!r} gives no chapter")
            start = (chapter, int(m.group(2)))
            if m.group(4):
                end_chapter = int(m.group(3)) if m.group(3) else chapter
                end = (end_chapter, int(m.group(4)))
                if end < start:
                    fail(f"{book} {spec}: the range {piece!r} runs backwards")
                out.extend(walk_range(book, start, end))
                chapter = end_chapter
            else:
                out.append(start)
    return out


BSB_ROOT: list[Path] = []


def walk_range(book: str, start: tuple[int, int], end: tuple[int, int]) -> list[tuple[int, int]]:
    chapters = load_book(BSB_ROOT[0], CODE[book])
    out = []
    for chapter in range(start[0], end[0] + 1):
        if chapter not in chapters:
            fail(f"the Berean has no {book} {chapter}")
        first = start[1] if chapter == start[0] else 1
        last = end[1] if chapter == end[0] else max(chapters[chapter])
        out.extend((chapter, v) for v in range(first, last + 1))
    return out


def label(book: str, chapter: int, verse: int) -> str:
    return f"{book} {chapter}:{verse}"


def normal(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", re.sub(r"[“”\"…,.;:!?()]", " ", text)).strip()


# --- The record's references ---------------------------------------------------------------------------------------

def find_refs(text: str) -> list[tuple[str, str, str]]:
    """Every reference written in a string: (the words as written, book, spec)."""
    found = [(m.group(0), m.group(1), m.group(2)) for m in REF.finditer(text)]
    found += [(m.group(0), m.group(1), m.group(2)) for m in REF_ONE.finditer(text) if not any(m.group(0) in f[0] for f in found)]
    return found


def collect_refs(record: dict, bsb: Path, verses: dict) -> dict[str, list[str]]:
    refs: dict[str, list[str]] = {}

    def add(key: str, book: str, spec: str):
        labels = []
        for chapter, verse in expand(book, spec):
            text = verse_text(bsb, book, chapter, verse)
            verses[label(book, chapter, verse)] = {"code": CODE[book], "chapter": chapter, "verse": verse, "text": text}
            labels.append(label(book, chapter, verse))
        refs[key] = labels

    for path, text in walk_strings(record):
        if path.startswith(".referenceTable") and path.endswith(".claims"):
            continue
        for words, book, spec in find_refs(plain(text)):
            add(words, book, spec)
    for row in record["referenceTable"]:
        for m in TABLE_REF.finditer(plain(row["claims"])):
            add(f"{row['book']} {m.group(1)}", row["book"], m.group(1))
    return refs


def check_quotations(record: dict, verses: dict, refs: dict) -> tuple[list[dict], list[str]]:
    """A quotation followed within its clause by a bracketed reference must be the Berean's words at that reference."""
    reported, seen, checked = [], set(), []
    pattern = re.compile(r"“([^“”]{1,160})”([^“”().]{0,40})\(([^()]+)\)")
    for path, text in walk_strings(record):
        for m in pattern.finditer(plain(text)):
            quote, inside = m.group(1), m.group(3)
            row = re.match(r"\.referenceTable\[(\d+)\]", path)
            if row and TABLE_REF.fullmatch(f"({inside})"):
                ref_words = f"{record['referenceTable'][int(row.group(1))]['book']} {inside}"
            else:
                matched = find_refs(inside)
                if not matched or not inside.startswith(matched[0][0]):
                    continue
                ref_words = matched[0][0]
            joined = normal(" ".join(verses[v]["text"] for v in refs[ref_words]))
            checked.append(f"“{quote}” ({ref_words})")
            if normal(quote) in joined:
                continue
            known = KNOWN_NOT_BEREAN.get((quote, ref_words))
            if not known:
                fail(f"{path}: the quotation “{quote}” is not the Berean's wording at {ref_words}: {joined[:160]}")
            seen.add((quote, ref_words))
            reported.append({"quote": quote, "ref": ref_words, "berean": known, "at": path})
    stale = set(KNOWN_NOT_BEREAN) - seen
    if stale:
        fail(f"KNOWN_NOT_BEREAN lists {sorted(stale)}, which the record no longer has: remove it from the build")
    return reported, checked


# --- The synopsis ----------------------------------------------------------------------------------------------------

def passage(bsb: Path, written: str, verses: dict) -> dict:
    m = re.fullmatch(rf"({BOOK_NAMES}) ({SPAN})", written)
    if not m:
        fail(f"synopsis passage {written!r} is not one book's chapter and verses")
    book, spec = m.group(1), m.group(2)
    rows = []
    for chapter, verse in expand(book, spec):
        text = verse_text(bsb, book, chapter, verse)
        verses[label(book, chapter, verse)] = {"code": CODE[book], "chapter": chapter, "verse": verse, "text": text}
        rows.append({"label": label(book, chapter, verse), "n": verse, "text": text})
    return {"ref": written, "book": book, "verses": rows}


def tokens(text: str) -> list[str]:
    return re.findall(r"\S+\s*", text)


def key(token: str) -> str:
    return re.sub(r"[^\w']", "", token.lower().replace("’", "'"))


def grams(words: list[str]) -> set[tuple[str, ...]]:
    return {tuple(words[i:i + NGRAM]) for i in range(len(words) - NGRAM + 1)}


def mark_shared(columns: list[dict], tie: dict) -> None:
    """Each word gets a level: 2 if it sits in a run of four words that every other column also has, 1 if some other
    column has it, 0 if none; and `tie` where it is part of the tie phrase in a tied verse."""
    flat = []
    for column in columns:
        cells = [(vi, tok) for vi, v in enumerate(column["verses"]) for tok in tokens(v["text"])]
        flat.append(cells)
    keys = [[key(tok) for _, tok in cells] for cells in flat]
    keys = [[k for k in ks] for ks in keys]
    for ci, cells in enumerate(flat):
        others = [grams([k for k in keys[o] if k]) for o in range(len(flat)) if o != ci]
        words = [(i, k) for i, k in enumerate(keys[ci]) if k]
        level = [0] * len(cells)
        for start in range(len(words) - NGRAM + 1):
            gram = tuple(k for _, k in words[start:start + NGRAM])
            hits = sum(1 for g in others if gram in g)
            if hits:
                value = 2 if hits == len(others) else 1
                for i, _ in words[start:start + NGRAM]:
                    level[i] = max(level[i], value)
        tie_cells = set()
        for vi, v in enumerate(columns[ci]["verses"]):
            if v["label"] in tie["verses"]:
                at = v["text"].find(tie["words"])
                if at < 0:
                    fail(f"synopsis tie: {v['label']} does not hold the words {tie['words']!r} word for word: {v['text']}")
                end, offset = at + len(tie["words"]), 0
                for index, (cvi, tok) in enumerate(cells):
                    if cvi != vi:
                        continue
                    if offset < end and offset + len(tok.rstrip()) > at:
                        tie_cells.add(index)
                    offset += len(tok)
        for vi, v in enumerate(columns[ci]["verses"]):
            v["words"] = [[tok, level[i]] + ([1] if i in tie_cells else []) for i, (cvi, tok) in enumerate(cells) if cvi == vi]
            del v["text"]


def build_synopsis(record: dict, bsb: Path, verses: dict) -> dict:
    out = {}
    for case in record["synoptic"]["cases"]:
        tie = TIES.get(case["id"])
        if not tie:
            fail(f"synopsis case {case['id']!r} has no tie in TIES")
        columns = [passage(bsb, p, verses) for p in case["passages"]]
        tied = [v["label"] for c in columns for v in c["verses"] if v["label"] in tie["verses"]]
        if sorted(tied) != sorted(tie["verses"]):
            fail(f"synopsis case {case['id']}: the tie names {tie['verses']}, the passages hold {tied}")
        mark_shared(columns, tie)
        out[case["id"]] = {"columns": columns, "tie": {"words": tie["words"], "note": tie["note"]}}
    return out


# --- The reference table's dates -------------------------------------------------------------------------------------

DATE_FORMS = [
    (re.compile(r"about (\d{2,3})–(\d{2,3})"), lambda a, b: (int(a), int(b), False)),
    (re.compile(r"(\d{2})s–(\d{2})s"), lambda a, b: (int(a), int(b) + 9, False)),
    (re.compile(r"(\d{2,3})–(\d{2,3})"), lambda a, b: (int(a), int(b), False)),
    (re.compile(r"early (\d{2})s"), lambda a: (int(a), int(a) + 4, False)),
    (re.compile(r"mid-(\d{2})s"), lambda a: (int(a) + 3, int(a) + 7, False)),
    (re.compile(r"(\d{2})s"), lambda a: (int(a), int(a) + 9, False)),
    (re.compile(r"about (\d{2,3})"), lambda a: (int(a) - 2, int(a) + 2, True)),
    (re.compile(r"before (\d{2,3})"), lambda a: (int(a) - 10, int(a), True)),
    (re.compile(r"early second century"), lambda: (100, 130, False)),
]
SIDE_WORDS = {2: ["evangelical", "critical"]}


def read_ranges(words: str) -> list[dict]:
    """Every date form in `words`, left to right, as a range. A form is read once; nothing outside DATE_FORMS is drawn."""
    text, found = re.sub(r"\([^)]*\)", lambda m: " " * len(m.group(0)), words), []
    taken = [False] * len(text)
    for pattern, make in DATE_FORMS:
        for m in pattern.finditer(text):
            if any(taken[m.start():m.end()]):
                continue
            for i in range(m.start(), m.end()):
                taken[i] = True
            start, end, soft = make(*m.groups())
            if start > end:
                fail(f"the date {m.group(0)!r} reads backwards")
            found.append((m.start(), {"from": start, "to": end, "soft": soft, "words": m.group(0)}))
    return [f for _, f in sorted(found, key=lambda pair: pair[0])]


def build_table(record: dict) -> list[dict]:
    rows = record["referenceTable"]
    names = [r["book"] for r in rows]
    if names != [name for name, _ in BOOKS]:
        fail(f"the reference table must hold the 27 books once each in canonical order, it holds {names}")
    out, by_book = [], {}
    for row in rows:
        date = plain(row["date"])
        if date == "with Colossians":
            bars = [dict(b, words="with Colossians") for b in by_book["Colossians"]]
        else:
            parts = date.split(" / ")
            if len(parts) > 2:
                fail(f"{row['book']}: the date {date!r} has more than two views")
            bars = []
            for index, part in enumerate(parts):
                for bar in read_ranges(part):
                    bar["side"] = SIDE_WORDS[2][index] if len(parts) == 2 else "one"
                    bars.append(bar)
        if not bars:
            fail(f"{row['book']}: no range can be read from the date {date!r}")
        for bar in bars:
            if not 30 <= bar["from"] <= bar["to"] <= 135:
                fail(f"{row['book']}: the range {bar['from']}–{bar['to']} falls outside AD 30–135")
        by_book[row["book"]] = bars
        out.append({"book": row["book"], "bars": bars})
    return out


# --- Shape, sources, links -------------------------------------------------------------------------------------------

def dig(record: dict, dotted: str):
    node = record
    for part in dotted.split("."):
        node = node[part]
    return node


def check_shape(record: dict) -> None:
    for dotted, expected in COUNTS.items():
        if len(dig(record, dotted)) != expected:
            fail(f"expected {expected} {dotted}, the record has {len(dig(record, dotted))}")
    letters = [name for group in record["paul"]["groups"] for name in group["letters"]]
    if len(letters) != 13 or len(set(letters)) != 13:
        fail(f"Paul's groups should hold thirteen letters once each, they hold {letters}")
    for claim in record["claims"]:
        if sum(1 for o in claim["test"]["options"] if o["right"]) != 1:
            fail(f"claim {claim['id']}: its test should have exactly one supported answer")
    ids = [s["id"] for s in record["sources"]]
    if len(ids) != len(set(ids)):
        fail(f"the source ids repeat: {ids}")
    for source in record["sources"]:
        if source["status"] not in STATUSES:
            fail(f"source {source['id']}: status {source['status']!r} is not one of {sorted(STATUSES)}")
    for claim in record["claims"]:
        for sid in claim["sources"]:
            if sid not in ids:
                fail(f"claim {claim['id']}: source {sid!r} is not listed")
    notes = {n["id"] for n in record["checkNotes"]}
    for path, text in walk_strings(record):
        for m in re.finditer(r"\{\{check:(c\d+)\}\}", text):
            if m.group(1) not in notes:
                fail(f"{path}: check mark {m.group(1)} has no note")


def app_paths(site: Path) -> list[str]:
    app = (site / APP).read_text(encoding="utf-8")
    return re.findall(r'path="(/[^"]*)"', app)


def build_links(record: dict, site: Path) -> dict:
    paths, titles = app_paths(site), {link["title"] for link in record["links"]}
    out = {}
    for title, href in LINKS.items():
        if title not in titles:
            fail(f"LINKS names {title!r}, which the record's links do not have")
        if not re.fullmatch(r"/[a-z0-9/-]+", href) or "//" in href or ".." in href:
            fail(f"link {title!r}: {href!r} leaves the site or is not a plain site address")
        covered = any(p == href or (p.endswith("/*") and href.startswith(p[:-1])) for p in paths)
        if not covered:
            fail(f"link {title!r}: the site has no address {href}")
        out[title] = href
    return out


# --- Build -----------------------------------------------------------------------------------------------------------

def build_data(record: dict, raw: bytes, site: Path) -> tuple[dict, list[dict]]:
    bsb = site / "data/text/bsb"
    if not bsb.is_dir():
        fail(f"expected the Berean under {bsb}: it is not there")
    BSB_ROOT[:] = [bsb]
    check_shape(record)
    verses: dict = {}
    for entry in record["verses"]:
        book = next((name for name, code in BOOKS if code == entry["code"]), None)
        if not book or entry["label"] != label(book, entry["chapter"], entry["verse"]):
            fail(f"verse {entry['label']!r}: its code {entry['code']} and numbers do not match its label")
        verses[entry["label"]] = {"code": entry["code"], "chapter": entry["chapter"], "verse": entry["verse"],
                                  "text": verse_text(bsb, book, entry["chapter"], entry["verse"])}
    listed = {v["label"] for v in record["verses"]}
    for group in (record["synoptic"]["verses"], record["stance"]["verses"], *[c["verses"] for c in record["claims"]]):
        for name in group:
            if name not in listed:
                fail(f"the verse {name!r} is shown but not in the record's verse list")
    refs = collect_refs(record, bsb, verses)
    synopsis = build_synopsis(record, bsb, verses)
    reported, checked = check_quotations(record, verses, refs)
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "verses": dict(sorted(verses.items())),
        "refs": dict(sorted(refs.items())),
        "synopsis": synopsis,
        "table": build_table(record),
        "links": build_links(record, site),
        "notBerean": reported,
        "quotationsChecked": checked,
    }
    return data, reported


def render(data: dict) -> str:
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    return text + "\n"


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def mutations() -> list[tuple[str, callable]]:
    """Wrong inputs, made in memory, each of which the build must refuse."""
    def misquote(r):
        r["acts"]["evidence"] = r["acts"]["evidence"].replace("(Acts 28:30–31)", "(Acts 28:30–31). Paul writes, “I have finished the race” (Acts 28:31)")

    def missing_verse(r):
        r["gospels"][0]["who"] += " Compare Mark 16:21."

    def backwards(r):
        r["synoptic"]["cases"][1]["passages"][0] = "Matthew 3:10–7"

    def wrong_tie(r):
        r["synoptic"]["cases"][2]["passages"][1] = "Mark 15:27"

    def out_of_order(r):
        table = r["referenceTable"]
        table[5], table[6] = table[6], table[5]

    def unreadable_date(r):
        r["referenceTable"][19]["date"] = "sometime"

    def bad_code(r):
        r["verses"][0]["code"] = "LUX"

    def lost_source(r):
        r["claims"][0]["sources"].append("not-a-source")

    def leaving(r):
        LINKS_BACKUP.update(LINKS)
        LINKS["How the canon took shape"] = "https://example.com/canon"

    return [("a quotation that is not the Berean's", misquote), ("a reference the Berean does not have (Mark 16:21)", missing_verse),
            ("a passage that runs backwards", backwards), ("a synopsis passage without its tie", wrong_tie),
            ("the reference table out of canonical order", out_of_order), ("a date that cannot be read as a range", unreadable_date),
            ("a verse whose book code does not match its label", bad_code), ("a source id the record does not list", lost_source),
            ("a link that leaves the site", leaving)]


LINKS_BACKUP: dict = {}


def prove_refusals(record: dict, raw: bytes, site: Path) -> int:
    failures = 0
    for name, change in mutations():
        trial = copy.deepcopy(record)
        change(trial)
        try:
            build_data(trial, raw, site)
            print(f"NOT REFUSED: {name}")
            failures += 1
        except BuildError as error:
            print(f"refused, as it should: {name}\n    {error}")
        finally:
            if LINKS_BACKUP:
                LINKS.update(LINKS_BACKUP)
                LINKS_BACKUP.clear()
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--check", action="store_true", help="confirm the data file is current; write nothing")
    parser.add_argument("--prove-refusals", action="store_true", help="try wrong inputs in memory; each must be refused")
    args = parser.parse_args()
    site = args.site.resolve()
    out = (site / OUTPUT).resolve()
    if not out.is_relative_to(site):
        print(f"build-nt-books-study: output {out} is outside the site folder {site}", file=sys.stderr)
        return 2
    raw = (site / RECORD).read_bytes()
    record = json.loads(raw)
    if args.prove_refusals:
        failures = prove_refusals(record, raw, site)
        print("every wrong input was refused" if not failures else f"{failures} wrong input(s) were NOT refused")
        return 1 if failures else 0
    try:
        data, reported = build_data(record, raw, site)
        text = render(data)
    except BuildError as error:
        print(f"build-nt-books-study: {error}", file=sys.stderr)
        return 1
    for item in reported:
        print(f"note: the record quotes “{item['quote']}” at {item['ref']}; {item['berean']} ({item['at']})")
    if args.check:
        current = out.read_text(encoding="utf-8") if out.is_file() else ""
        if current != text:
            print(f"build-nt-books-study: {out} is stale or missing; run the build", file=sys.stderr)
            return 1
        print(f"{out} is current")
        return 0
    write_atomic(out, text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses, {len(data['refs'])} references, "
          f"{len(data['synopsis'])} synopsis cases, {len(data['table'])} table rows, {len(data['links'])} links")
    return 0


if __name__ == "__main__":
    sys.exit(main())
