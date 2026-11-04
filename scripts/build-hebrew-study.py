#!/usr/bin/env python3
"""Build src/pages/study/hebrew/hebrew-data.json for /study/how-hebrew-works.

Reads STEP Bible's tagged Hebrew Old Testament and its grammar-code notes, the site's Leningrad text (data/text/wlc) and its
Berean text (data/text/bsb), and the research record. Every featured word must be in its tagged verse and in the site's Leningrad
verse, letters and points, with its Berean phrase present; every guided sound must rebuild its word. That shows the word is there;
it does not show a reading is right. A failure stops the build and writes nothing. Only featured words and counts are written.

Usage: python scripts/build-hebrew-study.py --site <Website folder> --sources <folder holding the STEP Bible files>
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import unicodedata
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/28-how-hebrew-works.json")
OUTPUT = Path("src/pages/study/hebrew/hebrew-data.json")
BUDGET_BYTES = 60_000
# The start of each file's checksum, as the project's sources register records it.
CHECKSUMS = {
    "TAHOT-Gen-Deu.txt": "e9b8546e",
    "TAHOT-Jos-Est.txt": "195fee1dc3653bab",
    "TAHOT-Job-Sng.txt": "bb508af3af07822f",
    "TAHOT-Isa-Mal.txt": "f3ded203d2a74d63",
    "TEHMC.txt": "78779bea824b31d4",
}
ROW = re.compile(r"^([1-3A-Z][A-Za-z0-9]{2})\.(\d+)\.(\d+)(?:\((\d+)\.(\d+)\))?#\d+=(\S+)\t")
BOOKS = [("Gen", "GEN", "Genesis"), ("Exo", "EXO", "Exodus"), ("Lev", "LEV", "Leviticus"), ("Num", "NUM", "Numbers"), ("Deu", "DEU", "Deuteronomy"),
         ("Jos", "JOS", "Joshua"), ("Jdg", "JDG", "Judges"), ("Rut", "RUT", "Ruth"), ("1Sa", "1SA", "1 Samuel"), ("2Sa", "2SA", "2 Samuel"),
         ("1Ki", "1KI", "1 Kings"), ("2Ki", "2KI", "2 Kings"), ("1Ch", "1CH", "1 Chronicles"), ("2Ch", "2CH", "2 Chronicles"), ("Ezr", "EZR", "Ezra"),
         ("Neh", "NEH", "Nehemiah"), ("Est", "EST", "Esther"), ("Job", "JOB", "Job"), ("Psa", "PSA", "Psalms"), ("Pro", "PRO", "Proverbs"),
         ("Ecc", "ECC", "Ecclesiastes"), ("Sng", "SNG", "Song of Songs"), ("Isa", "ISA", "Isaiah"), ("Jer", "JER", "Jeremiah"), ("Lam", "LAM", "Lamentations"),
         ("Ezk", "EZK", "Ezekiel"), ("Dan", "DAN", "Daniel"), ("Hos", "HOS", "Hosea"), ("Jol", "JOL", "Joel"), ("Amo", "AMO", "Amos"),
         ("Oba", "OBA", "Obadiah"), ("Jon", "JON", "Jonah"), ("Mic", "MIC", "Micah"), ("Nam", "NAM", "Nahum"), ("Hab", "HAB", "Habakkuk"),
         ("Zep", "ZEP", "Zephaniah"), ("Hag", "HAG", "Haggai"), ("Zec", "ZEC", "Zechariah"), ("Mal", "MAL", "Malachi")]
SITE_CODE = {step: site for step, site, _ in BOOKS}
FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
BIDI_CONTROLS = re.compile(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069]")
ACCENTS = re.compile(r"[\u0591-\u05af\u05bd\u05c0]")
INVISIBLE = re.compile(r"[\u034f\u200c\u200d]")
POINT_MARKS = re.compile(r"[\u05b0-\u05bc\u05c1\u05c2\u05c7]")
HEBREW_LETTER = re.compile(r"[\u05d0-\u05ea]")


@dataclass(frozen=True)
class Row:
    book: str
    chapter: int
    verse: int
    hebrew_chapter: int
    hebrew_verse: int
    kind: str
    text: str
    sound: str
    gloss: str
    tags: str
    grammar: str


def fail(message: str) -> NoReturn:
    sys.exit(f"build-hebrew-study: {message}")


def plain(text: str) -> str:
    """Drop accents, separators and invisible joiners; keep letters and points, in one canonical order."""
    text = INVISIBLE.sub("", ACCENTS.sub("", text))
    return unicodedata.normalize("NFC", re.sub(r"[/\\\u05be\u05c3\s]", "", text))


def clusters(word: str) -> list[str]:
    return re.findall(r"[\u05d0-\u05ea][^\u05d0-\u05ea]*", word)


def check_files(sources: Path) -> None:
    for name, prefix in CHECKSUMS.items():
        path = sources / name
        if not path.is_file():
            fail(f"expected the STEP Bible file {path}, it is missing")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if not digest.startswith(prefix):
            fail(f"{name}: expected a checksum starting {prefix}, found {digest[:16]}; the file differs from the one registered")


def read_rows(sources: Path) -> list[Row]:
    rows: list[Row] = []
    for name in CHECKSUMS:
        if not name.startswith("TAHOT"):
            continue
        with (sources / name).open(encoding="utf-8-sig") as stream:
            for line in stream:
                match = ROW.match(line)
                if not match:
                    continue
                book, chapter, verse, hebrew_chapter, hebrew_verse, kind = match.groups()
                cells = line.rstrip("\n").split("\t")
                rows.append(Row(book, int(chapter), int(verse), int(hebrew_chapter or chapter), int(hebrew_verse or verse), kind, cells[1], cells[2], cells[3], cells[4], cells[5]))
    return rows


def read_code_notes(sources: Path) -> dict[str, str]:
    """Each code's plain-English explanation is the second line after the code's own line, in TEHMC's blocks."""
    lines = (sources / "TEHMC.txt").read_text(encoding="utf-8-sig").splitlines()
    notes: dict[str, str] = {}
    for index, line in enumerate(lines[:-2]):
        match = re.match(r"^(H[A-Za-z0-9/]+)\tFunction=", line)
        if match and lines[index + 1].startswith("\t\"") and lines[index + 2].startswith("\t"):
            notes[match.group(1)] = lines[index + 2].strip().strip('"')
    if len(notes) < 500:
        fail(f"expected the grammar-code notes to hold hundreds of codes, found {len(notes)}")
    return notes


def counted(row: Row) -> bool:
    """Words from Leningrad or its marginal readings. STEP's restored and supplied words (R, X, V) are set aside."""
    return row.kind[0] in "LQ"


def verbs_in(row: Row) -> list[str]:
    return [part for part in row.grammar[1:].split("/") if part.startswith("V")]


def has_strong(row: Row, strong: str) -> bool:
    return re.search(rf"\{{{strong}[A-Z]?\}}", row.tags) is not None


class Texts:
    def __init__(self, site: Path) -> None:
        self.root = site / "data/text"
        self.cache: dict[tuple[str, str, int], dict[str, list]] = {}

    def verse_runs(self, edition: str, code: str, chapter: int, verse: int) -> list:
        key = (edition, code, chapter)
        if key not in self.cache:
            found: dict[str, list] = {}
            path = self.root / edition / code
            if not path.is_dir():
                fail(f"expected {path}, it is missing")
            for chapter_file in sorted(path.glob("*.json")):
                for entry in json.loads(chapter_file.read_text(encoding="utf-8")).values():
                    if int(entry["c"]) == chapter:
                        found.update({item["n"]: item["r"] for item in entry["v"]})
            self.cache[key] = found
        runs = self.cache[key].get(str(verse))
        if runs is None:
            fail(f"the {edition} text has no {code} {chapter}:{verse}")
        return runs

    def text(self, edition: str, code: str, chapter: int, verse: int) -> str:
        parts = [run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in self.verse_runs(edition, code, chapter, verse)]
        return re.sub(r"\s+", " ", "".join(parts)).strip()

    def berean(self, code: str, chapter: int, verse: int, phrase: str | None = None) -> str:
        text = self.text("bsb", code, chapter, verse)
        if phrase and not re.search(rf"\b{re.escape(phrase.lower())}\b", text.lower().replace("’", "'")):
            fail(f"{code} {chapter}:{verse}: expected the phrase {phrase!r}, the Berean has: {text}")
        return text


def label_for(code: str, chapter: int, verse: int) -> str:
    name = next(name for _, site, name in BOOKS if site == code)
    return f"{'Psalm' if code == 'PSA' else name} {chapter}:{verse}"


def verse_rows(rows_by_verse: dict[tuple[str, int, int], list[Row]], code: str, chapter: int, verse: int) -> list[Row]:
    step = next(step for step, site in SITE_CODE.items() if site == code)
    found = rows_by_verse.get((step, chapter, verse))
    if not found:
        fail(f"STEP's tagged text has no {code} {chapter}:{verse}")
    return found


def leningrad_words(texts: Texts, code: str, chapter: int, verse: int) -> list[str]:
    raw = texts.text("wlc", code, chapter, verse)
    if BIDI_CONTROLS.search(raw):
        fail(f"{code} {chapter}:{verse}: the Leningrad text holds bidi controls")
    words = [plain(word) for word in re.split(r"[\s\u05be\u05c0]+", raw)]
    return [word for word in words if HEBREW_LETTER.search(word) and word not in ("פ", "ס")]


def main_part(grammar: str) -> str:
    parts = grammar[1:].split("/")
    chosen = next((p for p in parts if p[0] in "VN" or p.startswith("A")), parts[0])
    return grammar[0] + chosen


def build_featured(record: dict, rows_by_verse: dict, all_rows: list[Row], texts: Texts, notes: dict[str, str], verses: dict) -> dict:
    strong_counts = Counter()
    for row in all_rows:
        if counted(row):
            for tag in re.findall(r"\{(H\d{4})[A-Z]?\}", row.tags):
                strong_counts[tag] += 1
    featured = {}
    for item in record["featured"]:
        code, chapter, verse = item["code"], item["chapter"], item["verse"]
        word = plain(item["form"])
        rows = [row for row in verse_rows(rows_by_verse, code, chapter, verse) if counted(row) and plain(row.text) == word and has_strong(row, item["strong"])]
        if not rows:
            seen = [(plain(row.text), row.tags) for row in verse_rows(rows_by_verse, code, chapter, verse) if item["strong"] in row.tags]
            fail(f"{item['id']}: expected {word} tagged {item['strong']} in {code} {chapter}:{verse}; the tagged verse has {seen}")
        row = rows[0]
        if word not in leningrad_words(texts, code, row.hebrew_chapter, row.hebrew_verse):
            fail(f"{item['id']}: {word} is not in the site's Leningrad text at {code} {row.hebrew_chapter}:{row.hebrew_verse}")
        label = label_for(code, chapter, verse)
        verses[label] = {"code": code, "chapter": chapter, "verse": verse, "text": texts.berean(code, chapter, verse, item["phrase"])}
        code_key = main_part(row.grammar)
        if code_key not in notes:
            fail(f"{item['id']}: the grammar code {code_key} has no note in the code file")
        stem_code = item.get("stemCode")
        if stem_code:
            if not any(part[1] == stem_code for part in verbs_in(row)):
                fail(f"{item['id']}: expected stem {stem_code}, the tag says {row.grammar}")
        if "root" in item:
            check_root(record, item)
        featured[item["id"]] = {"he": word, "gloss": row.gloss, "code": code_key[1:], "note": notes[code_key], "count": strong_counts[item["strong"]], "label": label}
    return featured


def check_root(record: dict, item: dict) -> None:
    letters = [clusters(item["form"])[index][0] for index in item["root"]]
    letters = [FINALS.get(letter, letter) for letter in letters]
    wanted = {"dbr": "דבר", "lhm": "לחמ"}
    for root in record["roots"]:
        wanted[root["id"]] = "".join(FINALS.get(ch, ch) for ch in root["letters"])
    if "".join(letters) != wanted[item["group"]]:
        fail(f"{item['id']}: its marked letters are {''.join(letters)}, expected {wanted[item['group']]}")


def build_lines(record: dict, rows_by_verse: dict, texts: Texts, verses: dict) -> dict:
    lines = {}
    for line in record["lines"]:
        code, chapter, verse = line["code"], line["chapter"], line["verse"]
        raw = texts.text("wlc", code, chapter, verse)
        words = leningrad_words(texts, code, chapter, verse)
        rows = [row for row in verse_rows(rows_by_verse, code, chapter, verse) if counted(row)]
        if [plain(row.text) for row in rows] != words:
            fail(f"{line['id']}: STEP's tagged words and the site's Leningrad words differ: {[plain(r.text) for r in rows]} / {words}")
        if len(line["words"]) != len(words):
            fail(f"{line['id']}: the record has {len(line['words'])} sound entries for {len(words)} words")
        for entry, word in zip(line["words"], words):
            if "steps" in entry:
                check_steps(line["id"], entry, word)
        tokens = re.findall(r"[^\s\u05be]+\u05be?", raw)
        if len(tokens) != len(words):
            fail(f"{line['id']}: split the verse into {len(tokens)} pieces for {len(words)} words: {tokens}")
        lines[line["id"]] = {"words": [{"he": token, "gloss": row.gloss, "step": row.sound} for token, row in zip(tokens, rows)]}
        verses[line["label"]] = {"code": code, "chapter": chapter, "verse": verse, "text": texts.berean(code, chapter, verse, line["phrase"])}
    return lines


def check_steps(line_id: str, entry: dict, word: str) -> None:
    pieces = clusters(word)
    if len(pieces) != len(entry["steps"]):
        fail(f"{line_id}: {word} has {len(pieces)} letters and {len(entry['steps'])} steps")
    joined = "".join(step[0] for step in entry["steps"])
    if joined != entry["sound"].replace("-", "").lower():
        fail(f"{line_id}: the steps of {word} spell {joined}, the word's sound is {entry['sound']}")


def check_tests(record: dict, rows_by_verse: dict, texts: Texts, verses: dict) -> None:
    for test in record["tests"]:
        code, chapter, verse = test["code"], test["chapter"], test["verse"]
        wanted = [plain(word) for word in re.split(r"[\s\u05be]+", test["line"])]
        words = leningrad_words(texts, code, chapter, verse)
        if words[-len(wanted):] != wanted:
            fail(f"{test['id']}: expected {wanted} to end {code} {chapter}:{verse}, the Leningrad text has {words}")
        verses[test["label"]] = {"code": code, "chapter": chapter, "verse": verse, "text": texts.berean(code, chapter, verse, test["phrase"])}
        rights = [option for option in test["options"] if option["right"]]
        if len(rights) != 1 or len(rights[0]["text"].split()) != len(wanted):
            fail(f"{test['id']}: expected one right option with {len(wanted)} words")


def build_psalm(record: dict, texts: Texts) -> dict:
    out = {}
    for index, letter in enumerate(record["letters"]):
        number = index * 8 + 1
        raw = texts.text("wlc", "PSA", 119, number)
        first = re.split(r"[\s\u05be]", raw)[0]
        if plain(first)[0] != letter["glyph"]:
            fail(f"Psalm 119:{number}: expected it to begin with {letter['glyph']}, the Leningrad text has {first}")
        out[letter["id"]] = {"verse": number, "first": plain(first), "text": texts.berean("PSA", 119, number)}
    return out


def tally(record: dict, rows: list[Row]) -> dict:
    hebrew = [row for row in rows if counted(row) and row.grammar.startswith("H")]
    aramaic = sum(1 for row in rows if counted(row) and row.grammar.startswith("A"))
    set_aside = len(rows) - len(hebrew) - aramaic
    if set_aside > 500:
        fail(f"expected a few hundred words set aside, found {set_aside} of {len(rows)}")
    letters: Counter[str] = Counter()
    marks: Counter[str] = Counter()
    for row in hebrew:
        for char in unicodedata.normalize("NFC", row.text):
            if HEBREW_LETTER.match(char):
                letters[FINALS.get(char, char)] += 1
            elif POINT_MARKS.match(char):
                marks[char] += 1
    vowels = {vowel["id"]: marks[unicodedata.normalize("NFC", vowel["mark"])] for vowel in record["vowels"]}
    if not all(vowels.values()):
        fail(f"expected each vowel point to appear in the text, found {vowels}")
    forms: Counter[str] = Counter()
    per_book: dict[str, Counter[str]] = {step: Counter() for step, _, _ in BOOKS}
    stems: Counter[str] = Counter()
    for row in hebrew:
        for verb in verbs_in(row):
            forms[verb[2]] += 1
            if row.book not in per_book:
                fail(f"unexpected book code {row.book} in STEP's tagged text")
            per_book[row.book][verb[2]] += 1
            if has_strong(row, "H7200"):
                stems[verb[1]] += 1
    wanted = [form["id"] for form in record["forms"]]
    books = [{"name": name, "total": sum(per_book[step].values()), **{form: per_book[step][form] for form in wanted}} for step, _, name in BOOKS]
    return {"hebrewWords": len(hebrew), "aramaicWords": aramaic, "setAside": set_aside, "letterCounts": {letter["id"]: letters[letter["glyph"]] for letter in record["letters"]},
            "lettersTotal": sum(letters.values()), "vowels": vowels, "pointsTotal": sum(marks.values()), "forms": {form: forms[form] for form in wanted}, "verbsTotal": sum(forms.values()),
            "books": books, "seeStems": {stem: stems[stem] for stem in "qNht"}, "seeTotal": sum(stems.values())}


def build_grid(record: dict, rows: list[Row], rows_by_verse: dict, texts: Texts, notes: dict[str, str], verses: dict) -> dict:
    spec = record["grid"]
    cells: dict[str, dict] = {}
    forms: dict[str, Counter[str]] = {}
    examples: dict[tuple[str, str], Row] = {}
    for row in rows:
        if not counted(row) or not row.grammar.startswith("H") or not has_strong(row, spec["strong"]):
            continue
        if re.search(r"/S", row.grammar):
            continue  # object suffixes would hide the verb's own ending
        for verb in verbs_in(row):
            word = plain(row.text)
            forms.setdefault(verb, Counter())[word] += 1
            example = examples.get((verb, word))
            # A psalm's title has no verse number of its own in the Berean, so it cannot be the verse a cell opens.
            if row.verse > 0 and (example is None or (example.book not in ("Gen", "Psa") and row.book in ("Gen", "Psa"))):
                examples[(verb, word)] = row
    for line in spec["rows"]:
        for col in spec["cols"]:
            verb = f"Vq{col['id']}{line['codes'][col['id']]}"
            found = forms.get(verb)
            if not found:
                continue
            word, count = found.most_common(1)[0]
            row = examples[(verb, word)]
            code = SITE_CODE[row.book]
            label = label_for(code, row.chapter, row.verse)
            verses[label] = {"code": code, "chapter": row.chapter, "verse": row.verse, "text": texts.berean(code, row.chapter, row.verse)}
            key = "H" + verb
            if key not in notes:
                fail(f"the grammar code {key} has no note in the code file")
            cells[f"{line['id']}-{col['id']}"] = {"he": word, "count": count, "all": sum(found.values()), "label": label, "step": row.sound, "gloss": row.gloss, "code": verb, "note": notes[key]}
    if len(cells) < 15:
        fail(f"expected most of the grid's cells to be in the text, found {len(cells)}")
    return cells


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
        stream.write(text + "\n")
    os.replace(temp, out)


def build(site: Path, sources: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    check_files(sources)
    record = json.loads((root / RECORD).read_text(encoding="utf-8"))
    rows = read_rows(sources)
    rows_by_verse: dict[tuple[str, int, int], list[Row]] = {}
    for row in rows:
        rows_by_verse.setdefault((row.book, row.chapter, row.verse), []).append(row)
    notes = read_code_notes(sources)
    texts = Texts(root)
    verses: dict[str, dict] = {}
    data = {
        "counts": tally(record, rows),
        "lines": build_lines(record, rows_by_verse, texts, verses),
        "featured": build_featured(record, rows_by_verse, rows, texts, notes, verses),
        "psalm": {letter: {key: value for key, value in stanza.items() if key != "text"} for letter, stanza in build_psalm(record, texts).items()},
        "grid": build_grid(record, rows, rows_by_verse, texts, notes, verses),
    }
    check_tests(record, rows_by_verse, texts, verses)
    data["verses"] = {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in verses.items()}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if BIDI_CONTROLS.search(text):
        fail("the output holds bidi controls")
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({size} bytes): {len(verses)} verses, {len(data['featured'])} featured words, {len(data['grid'])} grid cells")
    print(json.dumps({key: value for key, value in data["counts"].items() if key != "books"}, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.sources, args.output)


if __name__ == "__main__":
    main()
