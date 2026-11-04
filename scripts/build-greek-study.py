#!/usr/bin/env python3
"""Build src/pages/study/greek/greek-data.json for /study/how-new-testament-greek-works.

Reads STEP Bible's tagged Greek New Testament and its grammar-code notes, the site's Berean text (data/text/bsb) and the research
record. Every featured word must be in its tagged verse, with its tag where the record leans on one, and every Berean phrase in its
verse. That shows the word is there; it does not show a reading is right. A failure stops the build and writes nothing. Only featured
words and counts are written. Counted: words STEP marks as standing in the Nestle-Aland 28th edition.

Usage: python scripts/build-greek-study.py --site <Website folder> --sources <folder holding the STEP Bible files>
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

RECORD = Path("content/academic-research/31-how-new-testament-greek-works.json")
OUTPUT = Path("src/pages/study/greek/greek-data.json")
BUDGET_BYTES = 60_000
# The start of each file's checksum, as the project's sources register records it.
CHECKSUMS = {
    "TAGNT-Mat-Jhn.txt": "ab8eaaeb68e17a1d",
    "TAGNT-Act-Rev.txt": "524e32375361e6d3",
    "TEGMC.txt": "5f0416f7617019a6",
}
ROW = re.compile(r"^([1-3A-Z][A-Za-z0-9]{2})\.(\d+)\.(\d+)(?:\(\d+\.\d+\))?#(\d+)=(\S+)\t")
WORD_CELL = re.compile(r"^(.*) \((.*)\)$")
TAG_CELL = re.compile(r"^(G\d{4,5})[A-Za-z]?=(\S+)")
LINK = re.compile(r"»(\d+):G\d{4,5}")
NOUN = re.compile(r"^N-([NVGDA])([SP])([MFN])")
ARTICLE = re.compile(r"^T-([NVGDA])([SP])([MFN])")
VERB = re.compile(r"^V-2?([PIFARL])[A-Z]([ISOMNP])")
PUNCTUATION = re.compile(r"[,.;:!?··;—–\[\]()⟦⟧¶§]")
STEP_CODE = {"JHN": "Jhn", "ROM": "Rom", "LUK": "Luk", "MAT": "Mat", "JUD": "Jud"}
BOOK_NAME = {"JHN": "John", "ROM": "Romans", "LUK": "Luke", "MAT": "Matthew", "JUD": "Jude"}
TENSE_OF_NAME = {"Present": "P", "Imperfect": "I", "Future": "F", "Aorist": "A", "Perfect": "R", "Pluperfect": "L"}
GRAVE, ACUTE = "̀", "́"
BIDI_CONTROLS = re.compile(r"[‎‏‪-‮⁦-⁩]")


@dataclass(frozen=True)
class Row:
    book: str
    chapter: int
    verse: int
    number: int
    text: str
    sound: str
    gloss: str
    strong: str
    tag: str
    counted: bool
    link: int | None


def fail(message: str) -> NoReturn:
    sys.exit(f"build-greek-study: {message}")


def plain(text: str) -> str:
    """The word alone, in one canonical form: no spaces or punctuation, but the elision mark stays."""
    return unicodedata.normalize("NFC", PUNCTUATION.sub("", text).strip())


def level(word: str) -> str:
    """A grave accent is an acute that has met the next word, so the two are the same spelling for counting forms."""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", plain(word)).replace(GRAVE, ACUTE))


def bare_letters(word: str) -> list[str]:
    """Greek letters only, with no marks, and final sigma counted as sigma."""
    decomposed = unicodedata.normalize("NFD", word).lower()
    return ["σ" if char == "ς" else char for char in decomposed if "α" <= char <= "ω"]


def split_ending(form: str, stem: str) -> str:
    """What follows the stem, cut by letters so that a moved accent does not break the match."""
    want = bare_letters(stem)
    if bare_letters(form)[: len(want)] != want:
        fail(f"expected {form} to begin with the stem {stem}")
    seen, cut = 0, 0
    decomposed = unicodedata.normalize("NFD", form)
    for index, char in enumerate(decomposed):
        if unicodedata.category(char) != "Mn":
            if seen == len(want):
                cut = index
                break
            seen += 1
    else:
        cut = len(decomposed)
    return unicodedata.normalize("NFC", decomposed[cut:])


def check_files(sources: Path) -> dict[str, str]:
    digests = {}
    for name, prefix in CHECKSUMS.items():
        path = sources / name
        if not path.is_file():
            fail(f"expected the STEP Bible file {path}, it is missing")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if not digest.startswith(prefix):
            fail(f"{name}: expected a checksum starting {prefix}, found {digest[:16]}; the file differs from the one registered")
        digests[name] = digest[:16]
    return digests


def read_rows(sources: Path) -> list[Row]:
    rows: list[Row] = []
    for name in CHECKSUMS:
        if not name.startswith("TAGNT"):
            continue
        with (sources / name).open(encoding="utf-8-sig") as stream:
            for line in stream:
                match = ROW.match(line)
                if not match:
                    continue
                book, chapter, verse, number, _ = match.groups()
                cells = line.rstrip("\n").split("\t")
                word, tag = WORD_CELL.match(cells[1]), TAG_CELL.match(cells[3])
                if not word or not tag:
                    fail(f"{book} {chapter}:{verse}#{number}: expected a word and a tag, found {cells[1]!r} and {cells[3]!r}")
                link = LINK.search(cells[10]) if len(cells) > 10 else None
                rows.append(Row(book, int(chapter), int(verse), int(number), word.group(1), word.group(2), cells[2], tag.group(1), tag.group(2),
                                "NA28" in cells[5].split("+"), int(link.group(1)) if link else None))
    if not 135_000 < sum(row.counted for row in rows) < 140_000:
        fail(f"expected about 137,000 words marked as in the Nestle-Aland 28th edition, found {sum(row.counted for row in rows)}")
    return rows


def read_code_notes(sources: Path) -> dict[str, dict[str, str]]:
    """In TEGMC's blocks the code's line is followed by a parsing line, then a line in plain English."""
    lines = (sources / "TEGMC.txt").read_text(encoding="utf-8-sig").splitlines()
    notes: dict[str, dict[str, str]] = {}
    for index, line in enumerate(lines[:-2]):
        match = re.match(r"^([A-Z0-9-]+)\tFunction=", line)
        if match and lines[index + 1].startswith("\t"):
            notes[match.group(1)] = {"parse": lines[index + 1].strip(), "plain": lines[index + 2].strip()}
    if len(notes) < 500:
        fail(f"expected the grammar-code notes to hold hundreds of codes, found {len(notes)}")
    return notes


def code_note(tag: str, notes: dict[str, dict[str, str]], used: dict[str, dict[str, str]]) -> str:
    """The code a word is shown under: STEP's own, or without the title or name mark on its end when only that has a note."""
    code = tag if tag in notes else tag.rsplit("-", 1)[0]
    if code not in notes:
        fail(f"the grammar code {tag} has no note in the code file")
    used[code] = notes[code]
    return code


class Texts:
    def __init__(self, site: Path) -> None:
        self.root = site / "data/text/bsb"
        self.cache: dict[tuple[str, int], dict[str, list]] = {}

    def berean(self, code: str, chapter: int, verse: int, phrase: str | None = None) -> str:
        key = (code, chapter)
        if key not in self.cache:
            found: dict[str, list] = {}
            path = self.root / code
            if not path.is_dir():
                fail(f"expected {path}, it is missing")
            for chapter_file in sorted(path.glob("*.json")):
                for entry in json.loads(chapter_file.read_text(encoding="utf-8")).values():
                    if int(entry["c"]) == chapter:
                        found.update({item["n"]: item["r"] for item in entry["v"]})
            self.cache[key] = found
        runs = self.cache[key].get(str(verse))
        if runs is None:
            fail(f"the Berean text has no {code} {chapter}:{verse}")
        parts = [run if isinstance(run, str) else run[0] if isinstance(run, list) else "" for run in runs]
        text = re.sub(r"\s+", " ", "".join(parts)).strip()
        if phrase and not re.search(rf"\b{re.escape(phrase.lower())}\b", text.lower().replace("’", "'")):
            fail(f"{code} {chapter}:{verse}: expected the phrase {phrase!r}, the Berean has: {text}")
        return text


class Study:
    """What the sections share: the verses, the tagged text and the code notes actually used."""

    def __init__(self, rows: list[Row], texts: Texts, notes: dict[str, dict[str, str]]) -> None:
        self.rows, self.texts, self.notes = rows, texts, notes
        self.verses: dict[str, dict] = {}
        self.used_notes: dict[str, dict[str, str]] = {}
        self.by_verse: dict[tuple[str, int, int], list[Row]] = {}
        for row in rows:
            if row.counted:
                self.by_verse.setdefault((row.book, row.chapter, row.verse), []).append(row)

    def verse_rows(self, code: str, chapter: int, verse: int) -> list[Row]:
        found = self.by_verse.get((STEP_CODE[code], chapter, verse))
        if not found:
            fail(f"STEP's tagged text has no {code} {chapter}:{verse}")
        return found

    def quote(self, code: str, chapter: int, verse: int, phrase: str | None = None) -> str:
        label = f"{BOOK_NAME[code]} {chapter}:{verse}"
        text = self.texts.berean(code, chapter, verse, phrase)
        self.verses[label] = {"code": code, "chapter": chapter, "verse": verse, "text": text}
        return label

    def find(self, item: dict, strong: str | None = None) -> Row:
        code, chapter, verse = item["code"], item["chapter"], item["verse"]
        word = plain(item["form"])
        rows = self.verse_rows(code, chapter, verse)
        found = [row for row in rows if plain(row.text) == word and (strong is None or row.strong == strong)]
        if not found:
            fail(f"expected {word} {strong or ''} in {code} {chapter}:{verse}; the tagged verse has {[plain(row.text) for row in rows]}")
        return found[0]

    def word_data(self, row: Row) -> dict:
        return {"sound": row.sound, "gloss": row.gloss, "code": code_note(row.tag, self.notes, self.used_notes)}


def tally(rows: list[Row], record: dict) -> dict:
    counted = [row for row in rows if row.counted]
    cases: Counter[str] = Counter()
    grid: Counter[str] = Counter()
    letters: Counter[str] = Counter()
    articles = verbs = nouns = odd_verbs = 0
    for row in counted:
        letters.update(bare_letters(row.text))
        noun, verb = NOUN.match(row.tag), VERB.match(row.tag)
        if noun:
            nouns += 1
            cases[noun.group(1)] += 1
        elif ARTICLE.match(row.tag):
            articles += 1
        elif row.tag.startswith("V-"):
            verbs += 1
            if verb:
                grid[verb.group(1) + verb.group(2)] += 1
            else:
                odd_verbs += 1
    if odd_verbs > 50:
        fail(f"expected nearly every verb tag to give a tense and a mood, {odd_verbs} did not")
    wanted = "αβγδεζηθικλμνξοπρστυφχψω"
    if sorted(letters) != sorted(wanted):
        fail(f"expected exactly the twenty-four letters, found {''.join(sorted(letters))}")
    by_id = {letter["id"]: letters[letter["lower"]] for letter in record["letters"]}
    indicative = sum(value for key, value in grid.items() if key[1] == "I")
    return {"words": len(counted), "allRows": len(rows), "nouns": nouns, "verbs": verbs, "articles": articles, "cases": {key: cases[key] for key in "NAGDV"},
            "grid": dict(sorted(grid.items())), "gridTotal": sum(grid.values()), "indicative": indicative, "oddVerbs": odd_verbs, "letters": by_id, "lettersTotal": sum(letters.values())}


def build_letters(record: dict, study: Study) -> dict:
    out = {}
    for letter in record["letters"]:
        item = letter["word"]
        row = study.find(item)
        if bare_letters(item["form"])[0] != bare_letters(letter["lower"])[0]:
            fail(f"{letter['id']}: the word {item['form']} does not begin with {letter['lower']}")
        out[letter["id"]] = {**study.word_data(row), "label": study.quote(item["code"], item["chapter"], item["verse"], item["phrase"])}
    for item in record["practice"]:
        study.find(item)
        study.quote(item["code"], item["chapter"], item["verse"])
    return out


def build_moved(record: dict, study: Study) -> dict:
    moved = record["moved"]
    rows = study.verse_rows(moved["code"], moved["chapter"], moved["verse"])
    units = moved["units"]
    wanted = [plain(word) for word in f"{units['v']['greek']} {units['s']['greek']} {units['o']['greek']}".split()]
    words = [plain(row.text) for row in rows]
    if words[2:7] != wanted or [row.tag for row in rows[2:7]] != ["V-AAI-3S", "T-NSM", "N-NSM-T", "T-ASM", "N-ASM"]:
        fail(f"expected {wanted} as the clause of John 3:16 with its verb and two cases, the tagged verse has {words[:8]}")
    return {"label": study.quote(moved["code"], moved["chapter"], moved["verse"], moved["phrase"])}


def build_nouns(record: dict, rows: list[Row], study: Study) -> dict:
    out = {}
    for noun in record["nouns"]:
        forms: dict[str, Counter[str]] = {}
        examples: dict[tuple[str, str], Row] = {}
        total = 0
        for row in rows:
            match = NOUN.match(row.tag) if row.counted and row.strong == noun["strong"] else None
            if not match:
                continue
            total += 1
            key, word = match.group(1) + match.group(2), level(row.text)
            forms.setdefault(key, Counter())[word] += 1
            held = examples.get((key, word))
            # John and Romans first, because those are the books the page reads.
            if held is None or (held.book not in ("Jhn", "Rom") and row.book in ("Jhn", "Rom")):
                examples[(key, word)] = row
        cells = {}
        for key, found in forms.items():
            if key[0] == "V":
                continue
            word, count = found.most_common(1)[0]
            row = examples[(key, word)]
            code = next((site for site, step in STEP_CODE.items() if step == row.book), None)
            if not code:
                fail(f"{noun['id']}: its form {word} is shown from {row.book}, which this study's verse list does not name")
            cells[key] = {"form": word, "end": split_ending(word, noun["stem"]), "count": count, "all": sum(found.values()), "shown": plain(row.text), "label": study.quote(code, row.chapter, row.verse)}
        if not {"NS", "GS", "DS", "AS"} <= cells.keys():
            fail(f"{noun['id']}: expected all four singular jobs in the text, found {sorted(cells)}")
        out[noun["id"]] = {"total": total, "cells": cells, "vocative": sum(sum(c.values()) for k, c in forms.items() if k[0] == "V")}
    if out["ergon"]["cells"]["NS"]["form"] != out["ergon"]["cells"]["AS"]["form"] or out["ergon"]["cells"]["NP"]["form"] != out["ergon"]["cells"]["AP"]["form"]:
        fail("expected the neuter noun's nominative and accusative to have one form")
    return out


def build_lines(record: dict, study: Study) -> dict:
    lines = {}
    for line in record["lines"]:
        code, chapter, verse = line["code"], line["chapter"], line["verse"]
        rows = study.verse_rows(code, chapter, verse)
        numbers = {row.number: index for index, row in enumerate(rows)}
        words = []
        for row in rows:
            noun, article = NOUN.match(row.tag), ARTICLE.match(row.tag)
            # STEP's link says which noun an article goes with. A link to a word outside the edition counted is left out.
            target = numbers.get(row.link) if article and row.link is not None else None
            words.append({"g": unicodedata.normalize("NFC", row.text.replace("¶", "").strip()), "t": row.sound, "e": row.gloss, "c": code_note(row.tag, study.notes, study.used_notes),
                          "k": (noun or article).group(1) if noun or article else "", **({"to": target} if target is not None else {})})
        lines[line["id"]] = {"words": words, "label": study.quote(code, chapter, verse, line["phrase"])}
    return lines


def build_theos(record: dict, study: Study) -> list[dict]:
    marks = []
    for verse in sorted({row.verse for row in study.rows if row.book == "Jhn" and row.chapter == 1}):
        rows = study.by_verse.get(("Jhn", 1, verse), [])
        for index, row in enumerate(rows):
            if row.strong != "G2316" or not NOUN.match(row.tag):
                continue
            before = rows[index - 1] if index else None
            linked = any(other.link == row.number and ARTICLE.match(other.tag) for other in rows)
            has_article = linked or bool(before and ARTICLE.match(before.tag) and NOUN.match(row.tag).groups() == ARTICLE.match(before.tag).groups())
            marks.append({"verse": verse, "form": plain(row.text), "article": has_article, "case": NOUN.match(row.tag).group(1), "label": study.quote("JHN", 1, verse)})
    without = {mark["verse"] for mark in marks if not mark["article"]}
    if not {1, 6, 12, 13, 18} <= without or not any(mark["article"] for mark in marks if mark["verse"] == 1):
        fail(f"expected θεός without the article in John 1:1, 1:6, 1:12, 1:13 and 1:18, and with it in 1:1; found {marks}")
    clause = [plain(row.text) for row in study.verse_rows("JHN", 1, 1)[-5:]]
    if clause[-4:] != [plain(word) for word in record["harner"]["clauses"][1]["greek"].split()]:
        fail(f"expected Harner's clause B to be John's own, the verse ends {clause}")
    return marks


def build_verb(record: dict, study: Study) -> dict:
    verb = record["verb"]
    forms = {}
    for item in verb["forms"]:
        row = study.find(item, "G0025")
        if "".join(part[0] for part in item["parts"]) != plain(row.text):
            fail(f"{item['id']}: the parts spell {''.join(part[0] for part in item['parts'])}, the word is {plain(row.text)}")
        if not VERB.match(row.tag) or VERB.match(row.tag).group(1) != TENSE_OF_NAME[item["name"]]:
            fail(f"{item['id']}: expected a {item['name']} form, the tag says {row.tag}")
        forms[item["id"]] = {**study.word_data(row), "label": study.quote(item["code"], item["chapter"], item["verse"], item["phrase"])}
    view = verb["viewpoint"]
    words = {plain(row.text): row for row in study.verse_rows(view["code"], view["chapter"], view["verse"])}
    both = [("παριστάνετε", "P"), ("παραστήσατε", "A")]
    for word, tense in both:
        tag = VERB.match(words[word].tag) if word in words else None
        if not tag or tag.group(1) != tense:
            fail(f"expected {word} with tense {tense} in Romans 6:13, the tagged verse has {sorted(words)}")
    return {"forms": forms, "viewpoint": study.quote(view["code"], view["chapter"], view["verse"], view["phrase"])}


def build_rail(record: dict, study: Study) -> dict:
    rail = {}
    for item in record["rail"]:
        row = study.find(item)
        tag = VERB.match(row.tag)
        if not tag or tag.group(1) != TENSE_OF_NAME[item["formName"]]:
            fail(f"{item['id']}: expected a {item['formName']} form, the tag says {row.tag}")
        rail[item["id"]] = {**study.word_data(row), "label": study.quote(item["code"], item["chapter"], item["verse"], item["phrase"])}
    aorists = {}
    for item in record["aoristVerses"]:
        row = study.find(item)
        tag = VERB.match(row.tag)
        if not tag or tag.group(1) != "A":
            fail(f"{item['id']}: expected an aorist form, the tag says {row.tag}")
        aorists[item["id"]] = {**study.word_data(row), "label": study.quote(item["code"], item["chapter"], item["verse"], item["phrase"])}
    once = record["onceForAll"]
    if "ἐφάπαξ" not in [plain(row.text) for row in study.verse_rows(once["code"], once["chapter"], once["verse"])]:
        fail("expected ἐφάπαξ, once for all, in Romans 6:10")
    return {"rail": rail, "aorists": aorists, "onceForAll": study.quote(once["code"], once["chapter"], once["verse"], once["phrase"])}


def build_common(record: dict, rows: list[Row], study: Study) -> dict:
    out = {}
    for key, item in (("luke", record["papyrus"]["luke"]), ("lord", record["papyrus"]["lord"])):
        row = study.find(item, item["strong"])
        out[key] = {**study.word_data(row), "label": study.quote(item["code"], item["chapter"], item["verse"], item["phrase"]),
                    "count": sum(1 for other in rows if other.counted and other.strong == item["strong"])}
    return out


def check_quoted_verses(record: dict, study: Study) -> None:
    """The verses the record's sentences name in passing are quoted too, so that each can open."""
    for code, chapter, verse, phrase in [("JHN", 1, 18, "No one has ever seen God"), ("JHN", 1, 6, "sent from God"), ("JHN", 20, 28, "My God"), ("JHN", 8, 59, None), ("ROM", 8, 18, None), ("ROM", 8, 23, None)]:
        study.quote(code, chapter, verse, phrase)
    for name, claim in record["claims"].items():
        if sum(1 for option in claim["options"] if option["right"]) != 1:
            fail(f"the claim {name} must have exactly one right answer")


def write_atomic(out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text + "\n")
        os.replace(temp, out)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def build(site: Path, sources: Path, output: Path) -> None:
    root = site.resolve()
    out = (root / output).resolve()
    if not out.is_relative_to(root):
        fail(f"output {out} is outside the site folder {root}")
    digests = check_files(sources)
    record = json.loads((root / RECORD).read_text(encoding="utf-8"))
    rows = read_rows(sources)
    study = Study(rows, Texts(root), read_code_notes(sources))
    data = {
        "digests": digests,
        "counts": tally(rows, record),
        "letters": build_letters(record, study),
        "moved": build_moved(record, study),
        "nouns": build_nouns(record, rows, study),
        "lines": build_lines(record, study),
        "theos": build_theos(record, study),
        "verb": build_verb(record, study),
        **build_rail(record, study),
        "common": build_common(record, rows, study),
    }
    check_quoted_verses(record, study)
    data["codes"] = study.used_notes
    data["verses"] = {label: {key: verse[key] for key in ("code", "chapter", "verse")} for label, verse in study.verses.items()}
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if BIDI_CONTROLS.search(text):
        fail("the output holds bidi controls")
    size = len(text.encode("utf-8"))
    if size > BUDGET_BYTES:
        fail(f"the data is {size} bytes, over the {BUDGET_BYTES} budget")
    write_atomic(out, text)
    print(f"wrote {out} ({size} bytes): {len(study.verses)} verses, {len(study.used_notes)} grammar codes")
    print(json.dumps({key: value for key, value in data["counts"].items() if key not in ("letters", "grid")}, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.site, args.sources, args.output)


if __name__ == "__main__":
    main()
