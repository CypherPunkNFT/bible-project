#!/usr/bin/env python3
"""Build src/pages/study/ot-books/ot-books-data.json for /study/how-the-old-testament-books-were-written.

Reads the research record, removes its check-note markers ({{check:cN}} and {{/check}}) and then:
- finds every Bible reference in the page's strings (a book of the 66 from the site's own book table, then chapter:verse,
  a range, "; ch:v" continuations after it, or a chapter alone) and reads each verse reference's Berean text from
  data/text/bsb, refusing a reference the Berean does not have or a range that runs backwards. The text is checked in
  memory only: the data file holds each reference's bounds (and how many verses past the sheet's first SHEET_VERSES it
  runs), never its words; the page shows the words in the reader's own Bible (src/lib/verses.ts);
- refuses a quotation marked as the Berean ("…" (Isaiah 1:1 · BSB)), a listed phrase, an Isaiah line or a Daniel verse
  that is not word for word in the Berean at its reference;
- refuses a link to another study that is not one of the site's own addresses, and a source address that is not https;
- checks the shape the page relies on: the table's rows and books, unique ids, one supported answer per test, and that
  every check-note marker has its note.
The check notes' own fields (what a mark asked, the words before it was settled) and the record's editorial open questions
are not shown as reading text and are left out of the reference and quotation checks: they quote superseded wording.
That proves the references, the quotations and the record's shape. It does not prove that any reading is right or that a
scholar holds the view given him. A failure stops the build and writes nothing.

Usage: python scripts/build-ot-books-study.py [--site <Website folder>] [--check] [--selftest]
  --check     rebuild in memory and fail if the file on disk differs (stale or missing); writes nothing.
  --selftest  feed the build wrong records in memory and fail unless every one is refused; writes nothing.
"""
import argparse
import copy
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urlsplit

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
from bible.books import BOOKS  # noqa: E402  (the site's fixed book table)

RECORD = Path("content/academic-research/41-how-the-old-testament-books-were-written.json")
OUTPUT = Path("src/pages/study/ot-books/ot-books-data.json")
COLLECTIONS = Path("src/pages/study/hub/collections.ts")
BUDGET_BYTES = 90_000
SHEET_VERSES = 40
NOT_READING_TEXT = {"checkNotes", "openQuestions"}
RULER_BOOKS = ["GEN", "EXO", "LEV", "NUM", "DEU", "ISA", "DAN"]
# The neighbouring studies the page links by name. Only studies whose address exists today: a study still to be built gets
# no link, so a sister page appearing later never makes this data stale.
NEIGHBOURS = {
    "How the canon took shape": "/study/how-the-canon-took-shape",
    "The Dead Sea Scrolls": "/study/dead-sea-scrolls",
    "How Hebrew works": "/study/how-hebrew-works",
}
SITE_PATH = re.compile(r"^/study/[a-z0-9-]+$")
CHECK_MARK = re.compile(r"\{\{check:(c\d+)\}\}([\s\S]*?)\{\{/check\}\}")
TABLE_ROWS, TABLE_BOOKS = 36, 39
PARTS = {"Torah", "Former Prophets", "Latter Prophets", "The Twelve", "Writings"}


class BuildError(Exception):
    """A refusal: the record or the Berean does not support what the page would show."""


def plain(text: str) -> str:
    return CHECK_MARK.sub(lambda m: m.group(2), text)


BIBLE = [(code, name) for code, name, section, _ in BOOKS if section != "apocrypha"]
if len(BIBLE) != 66:
    raise SystemExit(f"build-ot-books-study: expected 66 books in scripts/bible/books.py, found {len(BIBLE)}")
CODE_BY_NAME = {name: code for code, name in BIBLE} | {"Psalm": "PSA"}
NAMES = sorted(CODE_BY_NAME, key=len, reverse=True)
DASH = "[–—-]"
SPAN = rf"(\d+):(\d+)(?:{DASH}(\d+)(?::(\d+))?)?"
CONTINUE = r"(?:; |, | and )" + SPAN + r"(?![\d:])"
BOOK = r"(?<![\w.])(" + "|".join(re.escape(n) for n in NAMES) + r")"
# One reference: a book, then either chapter:verse (with any continuations) or a chapter (or chapters) alone.
CONTINUE_PLAIN = CONTINUE.replace(r"(\d+)", r"\d+")  # the same pattern without its groups, to sit inside REFERENCE
REFERENCE = re.compile(BOOK + r" (?:" + SPAN + r"((?:" + CONTINUE_PLAIN + r")*)" + rf"|(\d+)(?:{DASH}(\d+))?(?![\d:]))")
CONTINUATION = re.compile(CONTINUE)
BOOK_NAME = re.compile(BOOK + r"(?![\w])")


def span_key(name: str, chapter: str, verse: str, end: str | None, end_verse: str | None) -> tuple[str, dict]:
    """The page's key for one verse reference, as the page's own finder writes it (en dash in ranges), and its bounds."""
    c, v = int(chapter), int(verse)
    if end is None:
        return f"{name} {c}:{v}", {"chapter": c, "verse": v, "toChapter": c, "toVerse": v}
    if end_verse is None:
        return f"{name} {c}:{v}–{int(end)}", {"chapter": c, "verse": v, "toChapter": c, "toVerse": int(end)}
    return f"{name} {c}:{v}–{int(end)}:{int(end_verse)}", {"chapter": c, "verse": v, "toChapter": int(end), "toVerse": int(end_verse)}


def chapter_key(name: str, chapter: str, end: str | None) -> tuple[str, dict]:
    c = int(chapter)
    last = int(end) if end else c
    key = f"{name} {c}" if end is None else f"{name} {c}–{last}"
    return key, {"chapter": c, "verse": 0, "toChapter": last, "toVerse": 0}


BARE = re.compile(r"(?<![\w:.])" + SPAN + r"(?![\d:])")


def find_references(text: str, book: str | None = None) -> list[tuple[str, str, dict]]:
    """Every reference in a plain string: (key, book code, bounds). A continuation takes the book named before it; a bare
    "ch:v" outside any named reference takes `book`, where the field says which book its bare references mean."""
    found, claimed = [], []
    for match in REFERENCE.finditer(text):
        name = match.group(1)
        claimed.append(match.span())
        if match.group(7):
            key, bounds = chapter_key(name, match.group(7), match.group(8))
            found.append((match.start(), key, CODE_BY_NAME[name], bounds))
            continue
        key, bounds = span_key(name, *match.group(2, 3, 4, 5))
        found.append((match.start(), key, CODE_BY_NAME[name], bounds))
        for more in CONTINUATION.finditer(match.group(6) or ""):
            key, bounds = span_key(name, *more.group(1, 2, 3, 4))
            found.append((match.start(6) + more.start(), key, CODE_BY_NAME[name], bounds))
    if book:
        for match in BARE.finditer(text):
            if not any(start <= match.start() < end for start, end in claimed):
                key, bounds = span_key(book, *match.group(1, 2, 3, 4))
                found.append((match.start(), key, CODE_BY_NAME[book], bounds))
    return [(key, code, bounds) for _, key, code, bounds in sorted(found, key=lambda item: item[0])]


def first_book(label: str) -> str | None:
    match = BOOK_NAME.match(label)
    return match.group(1) if match else None


def list_index(path: str) -> int:
    return int(re.search(r"\[(\d+)\]", path).group(1))


def bare_book(record: dict, path: str) -> str | None:
    """Which book a field's bare "ch:v" references mean. The page's model.ts (bareBook) states the same rules."""
    if path.startswith(".table.rows["):
        book = record["table"]["rows"][list_index(path)]["book"]
        return book if book in CODE_BY_NAME else None
    if path.startswith(".pentateuch.selfWitness["):
        return first_book(record["pentateuch"]["selfWitness"][list_index(path)]["verse"])
    if path.startswith(".pentateuch.laterHand["):
        return first_book(record["pentateuch"]["laterHand"][list_index(path)]["verses"][0])
    if path.startswith(".isaiah.evidence[") and record["isaiah"]["evidence"][list_index(path)]["id"] == "sirach":
        return None
    if path.startswith(".daniel.evidence[") and record["daniel"]["evidence"][list_index(path)]["id"] == "early-readers":
        return None
    if path.startswith(".claims[") and record["claims"][list_index(path)]["id"] == "cyrus":
        return "Isaiah"
    return {".isaiah.": "Isaiah", ".daniel.": "Daniel", ".darius.": "Daniel"}.get(path[:path.find(".", 1) + 1])


def reading_strings(node: object, path: str = ""):
    """Every string the page shows as reading text, with where it sits in the record."""
    if isinstance(node, str):
        yield path, plain(node)
    elif isinstance(node, dict):
        for key, value in node.items():
            if not (path == "" and key in NOT_READING_TEXT):
                yield from reading_strings(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from reading_strings(value, f"{path}[{index}]")


def verse_text(runs: list) -> str:
    words = "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) and run else "" for run in runs)
    return re.sub(r"\s+", " ", words).strip()


class Berean:
    """The site's Berean, read from data/text/bsb chunk files, each book read once."""

    def __init__(self, root: Path):
        if not root.is_dir():
            raise BuildError(f"expected the Berean under {root}: it is not there")
        self.root, self.books = root, {}

    def book(self, code: str) -> dict[int, dict[int, str]]:
        if code not in self.books:
            chapters: dict[int, dict[int, str]] = {}
            for path in sorted((self.root / code).glob("*.json")):
                for chapter in json.loads(path.read_text(encoding="utf-8")).values():
                    chapters[int(chapter["c"])] = {int(item["n"]): verse_text(item["r"]) for item in chapter["v"] if item["n"].isdigit()}
            if not chapters:
                raise BuildError(f"the Berean has no book {code}")
            self.books[code] = chapters
        return self.books[code]

    def verse(self, code: str, chapter: int, verse: int, key: str) -> str:
        text = self.book(code).get(chapter, {}).get(verse)
        if text is None:
            raise BuildError(f"{key}: the Berean has no {code} {chapter}:{verse}")
        return text

    def span(self, key: str, code: str, bounds: dict) -> list[list]:
        """The verses of a reference in order. A chapter reference only proves its chapters exist and returns no verses."""
        start, end = (bounds["chapter"], bounds["verse"]), (bounds["toChapter"], bounds["toVerse"])
        if end < start:
            raise BuildError(f"{key}: the range runs backwards")
        if bounds["verse"] == 0:
            for chapter in range(start[0], end[0] + 1):
                if chapter not in self.book(code):
                    raise BuildError(f"{key}: the Berean has no {code} chapter {chapter}")
            return []
        self.verse(code, *start, key)
        self.verse(code, *end, key)
        return [[c, n, text] for c in range(start[0], end[0] + 1) for n, text in sorted(self.book(code)[c].items()) if start <= (c, n) <= end]


def words_of(text: str) -> str:
    """Quotation marks, dashes and spacing only are evened out: the words, their case and their punctuation must match."""
    text = text.replace("“", "").replace("”", "").replace("‘", "'").replace("’", "'").replace("—", "–")
    return re.sub(r"\s+", " ", text).strip()


def contains_words(piece: str, verse: str, start: int = 0) -> int:
    """Where `piece` stands in `verse` as whole words (case aside for its first letter), or -1."""
    for candidate in {piece, piece[0].swapcase() + piece[1:]}:
        for match in re.finditer(re.escape(candidate), verse[start:]):
            at, after = start + match.start(), start + match.end()
            if (at == 0 or not verse[at - 1].isalnum()) and (after == len(verse) or not verse[after].isalnum()):
                return after
    return -1


def require_words(quote: str, verse: str, where: str) -> None:
    """A quotation must be the Berean's words; one with an ellipsis must have each part, in order."""
    v, place = words_of(verse), 0
    pieces = [words_of(p).strip(" ,.;:") for p in words_of(quote).split("…")]
    if not any(pieces):
        raise BuildError(f"{where}: an empty quotation")
    for piece in filter(None, pieces):
        place = contains_words(piece, v, place)
        if place < 0:
            raise BuildError(f"{where}: “{quote}” is not word for word in the Berean, which has: {verse}")


BSB_QUOTE = re.compile(r"“([^“”]+)”([^“”().]{0,80})\(([^()]*?) · BSB\)")


def check_inline_quotations(record: dict, strings: list[tuple[str, str]], berean: Berean) -> int:
    """Every “…” (Ref · BSB) in the page's prose: the words must be the Berean's at that reference."""
    checked = 0
    for path, text in strings:
        own = bare_book(record, path)
        matches = list(BSB_QUOTE.finditer(text))
        if len(matches) != text.count("· BSB)"):
            raise BuildError(f"{path}: a Berean citation that does not follow a quotation this build can check: {text[:120]}")
        for match in matches:
            cited = match.group(3).strip()
            if not re.fullmatch(BOOK + " " + SPAN, cited):
                before = [own] if own else [m.group(1) for m in BOOK_NAME.finditer(text, 0, match.start())]
                if not before or not re.fullmatch(SPAN, cited):
                    raise BuildError(f"{path}: cannot tell which book “{match.group(1)}” ({cited} · BSB) quotes")
                cited = f"{before[-1]} {cited}"
            key, code, bounds = find_references(cited)[0]
            require_words(match.group(1), " ".join(line[2] for line in berean.span(key, code, bounds)), f"{path} ({key})")
            checked += 1
    return checked


def single_reference(label: str, where: str) -> tuple[str, str, dict]:
    found = find_references(label)
    if len(found) != 1 or found[0][0] != label or found[0][2]["verse"] == 0:
        raise BuildError(f"{where}: {label!r} is not one Bible reference in the form “Book chapter:verse”")
    return found[0]


def check_structured_verses(record: dict, berean: Berean) -> None:
    for entry in record["verses"]:
        key, code, bounds = single_reference(entry["label"], "verses")
        if (code, bounds["chapter"], bounds["verse"]) != (entry["code"], entry["chapter"], entry["verse"]):
            raise BuildError(f"verses: {key} does not match its code and numbers {entry['code']} {entry['chapter']}:{entry['verse']}")
        if entry.get("phrase"):
            require_words(entry["phrase"], berean.verse(code, bounds["chapter"], bounds["verse"], key), f"verses ({key})")
    p, i, d = record["pentateuch"], record["isaiah"], record["daniel"]
    labels = [*record["stance"]["verses"], *(w["verse"] for w in p["selfWitness"]), *(v for h in p["laterHand"] for v in h["verses"])]
    for label in labels:
        key, code, bounds = single_reference(label, "a verse field")
        berean.span(key, code, bounds)
    for item in [*i["lines"], *d["named"]]:
        key, code, bounds = single_reference(item["verse"], "a quoted line")
        require_words(plain(item["quote"]), " ".join(line[2] for line in berean.span(key, code, bounds)), f"quoted line ({key})")


def safe_https(url: str) -> bool:
    parts = urlsplit(url)
    return parts.scheme == "https" and bool(re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", parts.hostname or "")) and not re.search(r"[\s\x00-\x1f]", url)


def check_links(record: dict, strings: list[tuple[str, str]], neighbours: dict, collections: str) -> dict:
    text = "\n".join(s for _, s in strings)
    for name, path in neighbours.items():
        if not SITE_PATH.match(path):
            raise BuildError(f"the link for {name!r} leaves the site or is not a study address: {path!r}")
        if f'"href": "{path}"' not in collections:
            raise BuildError(f"the link for {name!r} names {path}, which the Academic hub does not list")
        if name not in text:
            raise BuildError(f"the link for {name!r} names a study the record never mentions")
    for source in record["sources"]:
        url = source.get("url", "")
        if url and not safe_https(url):
            raise BuildError(f"source {source['id']}: its address {url!r} is not an https link")
    return dict(sorted(neighbours.items()))


def check_ids(record: dict) -> None:
    p, i, d = record["pentateuch"], record["isaiah"], record["daniel"]
    lists = {"laterHand": p["laterHand"], "pentateuch views": p["views"], "criteria": record["documentary"]["criteria"], "isaiah evidence": i["evidence"],
             "isaiah views": i["views"], "daniel evidence": d["evidence"], "daniel views": d["views"], "darius views": record["darius"]["views"],
             "claims": record["claims"], "sources": record["sources"]}
    for name, items in lists.items():
        ids = [item["id"] for item in items]
        if len(set(ids)) != len(ids) or not all(re.fullmatch(r"[a-z0-9-]+", x) for x in ids):
            raise BuildError(f"{name}: the ids repeat or are not plain words: {ids}")


def check_shape(record: dict, raw_text: str) -> None:
    rows = record["table"]["rows"]
    books = sum(2 if row["book"].startswith("1 and 2 ") else 1 for row in rows)
    if len(rows) != TABLE_ROWS or books != TABLE_BOOKS:
        raise BuildError(f"the table should have {TABLE_ROWS} rows covering {TABLE_BOOKS} books, it has {len(rows)} rows covering {books}")
    for row in rows:
        if row["part"] not in PARTS or not all(row[k] for k in ("says", "tradition", "date", "setting", "differ")):
            raise BuildError(f"table row {row['book']}: its part or one of its five fields is missing")
    check_ids(record)
    for claim in record["claims"]:
        if "test" in claim and sum(1 for option in claim["test"]["options"] if option["right"]) != 1:
            raise BuildError(f"claim {claim['id']}: its test should have exactly one supported answer")
    notes = {note["id"] for note in record["checkNotes"]}
    if len(notes) != len(record["checkNotes"]):
        raise BuildError("checkNotes: the ids repeat")
    missing = sorted(set(re.findall(r"\{\{check:(c\d+)\}\}", raw_text)) - notes, key=lambda x: int(x[1:]))
    if missing:
        raise BuildError(f"check markers with no note: {missing}")
    if raw_text.count("{{check:") != raw_text.count("{{/check}}"):
        raise BuildError("a check marker is opened and not closed")


def collect_refs(record: dict, strings: list[tuple[str, str]], berean: Berean) -> dict:
    refs: dict[str, dict] = {}
    for path, text in strings:
        for key, code, bounds in find_references(text, bare_book(record, path)):
            if key in refs:
                continue
            lines = berean.span(f"{path}: {key}", code, bounds)
            # Bounds only: the words come from the reader's Bible. span() has proved every verse exists in the Berean.
            entry = {"code": code, **bounds}
            if len(lines) > SHEET_VERSES:
                entry["more"] = len(lines) - SHEET_VERSES
            refs[key] = entry
    return dict(sorted(refs.items()))


def build_data(record: dict, raw: bytes, berean: Berean, collections: str, neighbours: dict) -> str:
    raw_text = raw.decode("utf-8")
    strings = list(reading_strings(record))
    check_shape(record, raw_text)
    check_structured_verses(record, berean)
    quotations = check_inline_quotations(record, strings, berean)
    links = check_links(record, strings, neighbours, collections)
    data = {"recordHash": hashlib.sha256(raw).hexdigest(), "books": NAMES, "chapters": {code: len(berean.book(code)) for code in RULER_BOOKS},
            "neighbours": links, "quotationsChecked": quotations, "sheetVerses": SHEET_VERSES, "refs": collect_refs(record, strings, berean)}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        raise BuildError(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    return text


def write_atomic(out: Path, text: str) -> None:
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        for attempt in range(5):
            try:
                os.replace(temp, out)
                break
            except PermissionError:
                if attempt == 4:
                    raise
                time.sleep(0.5)
    finally:
        Path(temp).unlink(missing_ok=True)


def mutate(record: dict, path: list, value: object) -> dict:
    changed = copy.deepcopy(record)
    target = changed
    for step in path[:-1]:
        target = target[step]
    target[path[-1]] = value(target[path[-1]]) if callable(value) else value
    return changed


def wrong_inputs(record: dict) -> list[tuple[str, dict, dict]]:
    def hezekiah(text: str) -> str:
        return text.replace("copied by the men of Hezekiah", "written by the men of Hezekiah")

    return [
        ("an Isaiah line not word for word", mutate(record, ["isaiah", "lines", 0, "quote"], "confirms the word of His servant"), NEIGHBOURS),
        ("a quotation that is only part of a word", mutate(record, ["isaiah", "lines", 2, "quote"], "yrus His anointed"), NEIGHBOURS),
        ("a verse that does not exist", mutate(record, ["pentateuch", "selfWitness", 0, "verse"], "Genesis 51:1"), NEIGHBOURS),
        ("a chapter that does not exist", mutate(record, ["daniel", "namedNote"], lambda s: s + " See Daniel 13."), NEIGHBOURS),
        ("a range that runs backwards", mutate(record, ["stance", "verses", 0], "Daniel 2:21–19"), NEIGHBOURS),
        ("a listed phrase not in its verse", mutate(record, ["verses", 0, "phrase"], "kings of Media and Babylon"), NEIGHBOURS),
        ("an inline Berean quotation changed", mutate(record, ["pentateuch", "views", 1, "reading"], hezekiah), NEIGHBOURS),
        ("a study link that leaves the site", record, {**NEIGHBOURS, "How the canon took shape": "https://example.com/canon"}),
        ("a study link to an address the site does not have", record, {**NEIGHBOURS, "How Hebrew works": "/study/no-such-study"}),
        ("a source address that is not https", mutate(record, ["sources", 1, "url"], "http://bfm.sbc.net/bfm2000/"), NEIGHBOURS),
        ("a test with two supported answers", mutate(record, ["claims", 0, "test", "options", 1, "right"], True), NEIGHBOURS),
        ("a check marker with no note", mutate(record, ["premise"], lambda s: s + " {{check:c999}}x{{/check}}"), NEIGHBOURS),
    ]


def selftest(record: dict, raw: bytes, berean: Berean, collections: str) -> None:
    """Wrong inputs made in memory; each must be refused, and the true record must pass."""
    build_data(record, raw, berean, collections, NEIGHBOURS)
    cases = wrong_inputs(record)
    for name, wrong, links in cases:
        try:
            build_data(wrong, json.dumps(wrong, ensure_ascii=False).encode("utf-8"), berean, collections, links)
        except BuildError as refusal:
            print(f"refused, as it should be: {name}: {refusal}")
            continue
        raise BuildError(f"selftest: the build accepted {name}")
    print(f"selftest: all {len(cases)} wrong inputs were refused, and the true record passes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=SCRIPTS.parent)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    root = args.site.resolve()
    out = root / OUTPUT
    try:
        raw = (root / RECORD).read_bytes()
        record = json.loads(raw)
        berean = Berean(root / "data/text/bsb")
        collections = (root / COLLECTIONS).read_text(encoding="utf-8")
        if args.selftest:
            selftest(record, raw, berean, collections)
            return
        text = build_data(record, raw, berean, collections, NEIGHBOURS)
    except BuildError as refusal:
        raise SystemExit(f"build-ot-books-study: {refusal}")
    if args.check:
        current = out.read_text(encoding="utf-8").replace("\r\n", "\n") if out.is_file() else None
        if current != text:
            raise SystemExit(f"build-ot-books-study: {out} is {'missing' if current is None else 'stale'}: run the build without --check")
        print(f"{out} is current")
        return
    write_atomic(out, text)
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['refs'])} references, {data['quotationsChecked']} inline quotations checked")


if __name__ == "__main__":
    main()
