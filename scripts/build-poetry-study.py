#!/usr/bin/env python3
"""Build src/pages/study/poetry/poetry-data.json for /study/hebrew-poetry-and-biblical-narrative.

The owner asked for the Hebrew and the Berean wording quoted together, line beside line where the parallel is the point.
This build reads the research record (content/academic-research/13-hebrew-poetry-and-biblical-narrative.json), the site's
Berean (data/text/bsb) and the site's Leningrad Hebrew (data/text/wlc), and refuses to write if:
- a verse in the record's list does not carry exactly the Berean's words and poetic lines at its reference, or (Old
  Testament) exactly the Leningrad Hebrew at its Hebrew verse, or names the wrong Hebrew verse number;
- a Bible reference in the record does not exist, or a quotation marked "(Reference · BSB)" is not word for word the Berean;
- a Hebrew line division does not join back into its verse, ends a line on a word without a pausing (disjunctive) accent,
  gives a different number of lines from the Berean, or sets apart a psalm title the Berean's superscription does not name;
- a shape the page draws over the Hebrew (the folds of Genesis 9:6 and Isaiah 6:10, the returning words, the flood's
  day-counts, the alphabet columns, the figures) is not in the held text;
- a link the page makes leaves the site or names an address the site does not route.
Check marks ({{check:cN}}…{{/check}}) are removed before any text is compared. That proves the wording, the references and
that each drawn shape is in the text; it does not prove that any reading of a pattern is right.

Usage: python scripts/build-poetry-study.py [--site <Website folder>] [--check]
  --check builds in memory and fails if the file on disk differs (stale or missing); it writes nothing.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import unicodedata
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

RECORD = Path("content/academic-research/13-hebrew-poetry-and-biblical-narrative.json")
FOLDER = Path("src/pages/study/poetry")
OUTPUT = FOLDER / "poetry-data.json"
BUDGET_BYTES = 160_000
CHECK_MARK = re.compile(r"\{\{check:c\d+\}\}|\{\{/check\}\}")
QUOTE = re.compile(r"“([^”]+)” \(([^()]+?) · BSB\)")
BOOK_CODE = re.compile(r"^[A-Z0-9]{3}$")
NT = {"MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT",
      "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"}
ALIASES = {"Psalm": "PSA"}
POETIC = {"PSA", "PRO", "JOB"}
ALPHABET = "אבגדהוזחטיכלמנסעפצקרשת"
NAMES = ["alef", "bet", "gimel", "dalet", "he", "waw", "zayin", "het", "tet", "yod", "kaf", "lamed", "mem", "nun", "samekh",
         "ayin", "pe", "tsade", "qof", "resh", "shin", "tav"]
FINALS = str.maketrans("ךםןףץ", "כמנפצ")
PASEQ, ATNACH, REVIA = "׀", "֑", "֗"
# Pausing accents. The three poetic books (Psalms, Proverbs, Job) use their own system, in which the mark that is tipcha
# in prose (U+0596) is tarha, a joining accent, and the zarqa shape (U+0598) is tsinnorit, also joining.
DISJUNCTIVE = {
    "prose": set("֑֖֛֚֮֒֓֔֕֗֘֙֜֞֟֠֡"),
    "poetic": set("֑֭֮֗֝֡֫"),
}
# Chapters whose Hebrew and Berean counts differ only at the end: verses up to this number are numbered alike. (Nahum's
# Berean 1:15 is the Hebrew 2:1.)
SAME_NUMBERS = {("NAM", 1): 14}
# A psalm title the Hebrew counts inside verse 1, and the superscription the Berean prints over the psalm for it.
TITLES = {"מזמור לדוד": "A Psalm of David.", "לדוד": "Of David."}

# Line divisions the atnach alone cannot give: the consonants of the last word of each line but the last. "title" is a
# heading set apart above the pair; "nun" marks Psalm 145:13, whose Berean lines 3-4 have no Hebrew in the Leningrad text.
LINES: dict[str, dict] = {
    "Proverbs 10:1": {"title": "משלי שלמה", "ends": ["ישמח־אב"]},
    "Isaiah 1:3": {"ends": ["קנהו", "בעליו", "ידע"]},
    "Psalm 29:1": {"title": "מזמור לדוד", "ends": ["אלים"]},
    "Judges 5:27": {"ends": ["נפל", "שכב", "נפל"]},
    "Genesis 9:6": {"ends": ["האדם", "ישפך", "אלהים"]},
    "Isaiah 6:10": {"ends": ["הזה", "השע", "בעיניו", "ישמע", "יבין"]},
    "Psalm 8:1": {"ends": ["אדנינו", "בכל־הארץ", "הודך"]},
    "Psalm 103:1": {"title": "לדוד", "ends": ["את־יהוה"]},
    "Psalm 103:22": {"ends": ["כל־מעשיו", "ממשלתו"]},
    "Psalm 42:5": {"ends": ["נפשי", "עלי", "אודנו"]},
    "Psalm 42:11": {"ends": ["נפשי", "עלי", "אודנו"]},
    "Psalm 43:5": {"ends": ["נפשי", "עלי", "אודנו"]},
    "Psalm 145:13": {"nun": True},
    "Lamentations 3:1": {"ends": ["עני"]},
    "Lamentations 5:1": {"ends": ["לנו"]},
}
# Verses the page shows as Hebrew-and-Berean pairs in its sections: each must divide.
PAIRED = ["Psalm 19:1", "Psalm 19:2", "Proverbs 10:1", "Proverbs 10:2", "Proverbs 10:3", "Isaiah 1:3", "Psalm 29:1",
          "Psalm 29:2", "Judges 5:27", "Genesis 9:6", "Isaiah 6:10", "Psalm 8:1", "Psalm 8:9", "Psalm 103:1", "Psalm 103:22",
          "Psalm 42:5", "Psalm 42:11", "Psalm 43:5", "Psalm 107:8", "Psalm 119:1", "Psalm 145:13", "Proverbs 31:10",
          "Lamentations 3:1", "Lamentations 5:1"]

# 02 The folds the page draws over the words. Genesis 9:6: the six Hebrew words of its first half, paired outside in by
# shared consonants, with the record's own English for each. Isaiah 6:10: three organs out, three back, in both languages.
GEN96 = {"label": "Genesis 9:6", "words": 6, "pairs": [[0, 5, "שפך"], [1, 4, "דמ"], [2, 3, "אדמ"]],
         "glosses": ["sheds", "blood", "of man", "by man", "his blood", "will be shed"], "lookPath": ".patterns.items[0].look"}
ISA610 = {"label": "Isaiah 6:10", "hebrew": ["לב", "אזנ", "עינ", "עינ", "אזנ", "לבב"], "english": ["hearts", "ears", "eyes", "eyes", "ears", "hearts"]}
# Wenham's day-counts in the flood, as the record's check note c6 gives them, each at the verse where the Berean says it.
FLOOD = [("Genesis 7:4", "seven days", "7"), ("Genesis 7:10", "seven days", "7"), ("Genesis 7:17", "forty days", "40"),
         ("Genesis 7:24", "150 days", "150"), ("Genesis 8:1", "God remembered Noah", "centre"), ("Genesis 8:3", "150 days", "150"),
         ("Genesis 8:6", "forty days", "40"), ("Genesis 8:10", "seven more days", "7"), ("Genesis 8:12", "seven more days", "7")]
FLOOD_SPAN = ("Genesis 6:9", "Genesis 9:19")
# 04 Words that return: the words lit in each verse, Hebrew by consonants and the Berean's own word.
THREADS = {
    "recognize": [("Genesis 37:32", ["הכר־נא"], "Examine"), ("Genesis 37:33", ["ויכירה"], "recognized"),
                  ("Genesis 38:25", ["הכר־נא"], "examine"), ("Genesis 38:26", ["ויכר"], "recognized")],
    "good": [(f"Genesis 1:{n}", ["טוב"], "good") for n in (4, 10, 12, 18, 21, 25, 31)],
    "refrains-judges": [(f"Judges {ref}", ["הרע", "בעיני", "יהוה"], "evil in the sight of the LORD") for ref in ("2:11", "3:7", "3:12", "4:1", "6:1", "10:6", "13:1")]
                       + [(f"Judges {ref}", ["אין", "מלך", "בישראל"], "no king in Israel") for ref in ("17:6", "18:1")]
                       # 19:1 turns the words round: "and a king there was none in Israel".
                       + [("Judges 19:1", ["ומלך", "אין", "בישראל"], "no king in Israel"), ("Judges 21:25", ["אין", "מלך", "בישראל"], "no king in Israel")],
}
# 03 The alphabet poems drawn as a column, computed from the Leningrad text. unit: "verse" (one per letter), "verses:N"
# (N per letter), "half" (split at the atnach, and at a revia before it). skip: title words before the first letter.
# expect: what the build must find, or it refuses: missing letters, an extra closing letter, a swapped pair.
ACROSTICS = [
    {"poem": 1, "label": "Psalm 25", "code": "PSA", "chapter": 25, "first": 1, "last": 22, "unit": "verse", "skip": 1,
     "expect": {"missing": ["waw", "qof"], "extra": "pe", "second": ["bet"], "repeat": ["resh"]}},
    {"poem": 2, "label": "Psalm 34", "code": "PSA", "chapter": 34, "first": 2, "last": 23, "unit": "verse", "skip": 0,
     "expect": {"missing": ["waw"], "extra": "pe"}},
    {"poem": 4, "label": "Psalm 111", "code": "PSA", "chapter": 111, "first": 1, "last": 10, "unit": "half", "skip": 2, "expect": {}},
    {"poem": 5, "label": "Psalm 112", "code": "PSA", "chapter": 112, "first": 1, "last": 10, "unit": "half", "skip": 2, "expect": {}},
    {"poem": 6, "label": "Psalm 119", "code": "PSA", "chapter": 119, "first": 1, "last": 176, "unit": "verses:8", "skip": 0, "expect": {}},
    {"poem": 7, "label": "Psalm 145", "code": "PSA", "chapter": 145, "first": 1, "last": 21, "unit": "verse", "skip": 2, "expect": {"missing": ["nun"]}},
    {"poem": 8, "label": "Proverbs 31", "code": "PRO", "chapter": 31, "first": 10, "last": 31, "unit": "verse", "skip": 0, "expect": {}},
    {"poem": 9, "label": "Lamentations 1", "code": "LAM", "chapter": 1, "first": 1, "last": 22, "unit": "verse", "skip": 0, "expect": {}},
    {"poem": 9, "label": "Lamentations 2", "code": "LAM", "chapter": 2, "first": 1, "last": 22, "unit": "verse", "skip": 0, "expect": {"swap": ["ayin", "pe"]}},
    {"poem": 9, "label": "Lamentations 4", "code": "LAM", "chapter": 4, "first": 1, "last": 22, "unit": "verse", "skip": 0, "expect": {"swap": ["ayin", "pe"]}},
    {"poem": 10, "label": "Lamentations 3", "code": "LAM", "chapter": 3, "first": 1, "last": 66, "unit": "verses:3", "skip": 0, "expect": {"swap": ["ayin", "pe"]}},
]
NOT_DRAWN = {0: "Psalms 9 and 10 run the alphabet with gaps and verses between the letters, so no column is computed from their verse openings.",
             3: "Psalm 37 gives most letters two verses, and some of its letters stand after an opening “and”, so no column is computed from its verse openings."}
# The page's own links: each must be an address the site routes.
LINKS = {"academic": "/study/academic", "hebrew": "/study/how-hebrew-works", "greek": "/study/how-new-testament-greek-works",
         "otBooks": "/study/how-the-old-testament-books-were-written", "ntBooks": "/study/how-the-new-testament-books-were-written",
         "churchReading": "/study/how-the-church-has-read-the-bible"}
LINK_TITLES = {"How Hebrew works": "hebrew", "How New Testament Greek works": "greek", "How the Old Testament books were written": "otBooks",
               "How the New Testament books were written": "ntBooks"}


def fail(message: str) -> NoReturn:
    sys.exit(f"build-poetry-study: {message}")


def plain(text: str) -> str:
    return CHECK_MARK.sub("", text)


def normal(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'").replace("“", "").replace("”", "").replace('"', "")
    return re.sub(r"\s+", " ", text).strip()


def skeleton(text: str) -> str:
    """Hebrew consonants only (final forms made ordinary), keeping the maqaf and spaces between words."""
    kept = "".join(ch for ch in unicodedata.normalize("NFC", text) if "א" <= ch <= "ת" or ch in " ־")
    return re.sub(r" +", " ", kept.translate(FINALS)).strip()


def letter_of(text: str) -> str:
    found = skeleton(text).replace("־", "").replace(" ", "")
    return found[:1]


def strings(node: object, path: str = "") -> Iterator[tuple[str, str]]:
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for key, value in node.items():
            if key not in ("checkNotes", "verses"):
                yield from strings(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from strings(value, f"{path}[{index}]")


def at_path(record: dict, path: str) -> str:
    node: object = record
    for name, index in re.findall(r"\.([A-Za-z0-9]+)|\[(\d+)\]", path):
        try:
            node = node[name] if name else node[int(index)]  # type: ignore[index]
        except (KeyError, IndexError, TypeError):
            fail(f"the record has nothing at {path}")
    if not isinstance(node, str):
        fail(f"expected text at {path}, found {type(node).__name__}")
    return node


def berean_lines(runs: list) -> list[str]:
    """A verse split at its poetic line breaks ({'b': 'q1'} and the like); footnotes and other markers dropped.
    The same reading as the record's own add_poetry_text.py, so the two can be compared."""
    out, current = [], ""
    for run in runs:
        if isinstance(run, dict) and str(run.get("b", "")).startswith("q"):
            out.append(current)
            current = ""
        elif isinstance(run, str):
            current += run
        elif isinstance(run, list) and run and isinstance(run[0], str):
            current += run[0]
    out.append(current)
    return [re.sub(r"\s+", " ", line).strip() for line in out if line.strip()]


class Edition:
    """One of the site's held texts (bsb or wlc), read chapter by chapter on first use."""

    def __init__(self, root: Path, name: str):
        self.root, self.name, self.cache = root / name, name, {}

    def chapter(self, code: str, chapter: int) -> dict:
        key = (code, chapter)
        if key not in self.cache:
            folder = self.root / code
            if not BOOK_CODE.match(code) or not folder.is_dir():
                fail(f"the {self.name} text has no book {code!r}")
            found = {"verses": {}, "title": None}
            for path in sorted(folder.glob("*.json")):
                for entry in json.loads(path.read_text(encoding="utf-8")).values():
                    if int(entry["c"]) == chapter:
                        found["verses"] = {int(v["n"]): v["r"] for v in entry["v"] if str(v["n"]).isdigit()}
                        title = "".join(part for part in entry.get("t") or [] if isinstance(part, str))
                        found["title"] = re.sub(r"\s+", " ", title).strip() or None
            self.cache[key] = found
        return self.cache[key]

    def runs(self, code: str, chapter: int, verse: int, where: str) -> list:
        runs = self.chapter(code, chapter)["verses"].get(verse)
        if runs is None:
            fail(f"{where}: the {self.name} text has no {code} {chapter}:{verse}")
        return runs


class Texts:
    def __init__(self, site: Path):
        self.bsb, self.wlc = Edition(site / "data/text", "bsb"), Edition(site / "data/text", "wlc")

    def hebrew_number(self, code: str, chapter: int, verse: int, where: str) -> int:
        hebrew, english = self.wlc.chapter(code, chapter)["verses"], self.bsb.chapter(code, chapter)["verses"]
        if (code, chapter) in SAME_NUMBERS and verse <= SAME_NUMBERS[(code, chapter)]:
            return verse
        offset = len(hebrew) - len(english)
        if offset and not self.bsb.chapter(code, chapter)["title"]:
            fail(f"{where}: {code} {chapter}'s Hebrew counts {offset} more verses, but the Berean prints no title for it to hold")
        if offset and code != "PSA":
            fail(f"{where}: {code} {chapter} has {len(hebrew)} Hebrew verses and {len(english)} Berean; it needs a hand mapping")
        if not 0 <= offset <= 2 or not hebrew or max(hebrew) - offset != max(english):
            fail(f"{where}: {code} {chapter}: the Hebrew and Berean verse counts do not line up ({len(hebrew)}, {len(english)})")
        return verse + offset

    def hebrew(self, code: str, chapter: int, verse: int, where: str) -> tuple[str, int]:
        number = self.hebrew_number(code, chapter, verse, where)
        text = " ".join(berean_lines(self.wlc.runs(code, chapter, number, where)))
        text = re.sub(r"(?:^|\s)[פס׆](?=\s|$)", "", text).strip()  # scribal paragraph signs and the inverted nun, not words
        return unicodedata.normalize("NFC", text), number

    def verse(self, code: str, chapter: int, verse: int, where: str) -> dict:
        lines = berean_lines(self.bsb.runs(code, chapter, verse, where))
        if not lines:
            fail(f"{where}: the Berean's {code} {chapter}:{verse} is empty")
        out = {"code": code, "chapter": chapter, "verse": verse, "lines": lines, "hebrew": None}
        if code not in NT:
            out["hebrew"], number = self.hebrew(code, chapter, verse, where)
            if number != verse:
                out["hebrewVerse"] = number
        return out


def reference_pattern(names: list[str]) -> re.Pattern:
    books = "|".join(re.escape(name) for name in sorted(names, key=len, reverse=True))
    part = r"\d+:\d+(?:[–-]\d+)?(?:, \d+(?:[–-]\d+)?(?![\d:]))*"
    return re.compile(rf"(?<![A-Za-z0-9])({books}) ({part}(?:; {part})*)(?![\d:])")


def expand(code: str, refs: str, where: str) -> list[tuple[str, int, int]]:
    verses: list[tuple[str, int, int]] = []
    for group in refs.split("; "):
        chapter_text, rest = group.split(":", 1)
        chapter = int(chapter_text)
        for piece in rest.split(", "):
            first, _, last = piece.partition("–") if "–" in piece else piece.partition("-")
            start, end = int(first), int(last or first)
            if end < start or end - start > 40:
                fail(f"{where}: the range {group} runs backwards or is implausibly long")
            verses.extend((code, chapter, n) for n in range(start, end + 1))
    return verses


class Collector:
    """Every verse the page can show, keyed "PSA 19:1", and every reference label mapped to its verses."""

    def __init__(self, texts: Texts, codes: dict[str, str]):
        self.texts, self.codes, self.verses, self.refs = texts, codes, {}, {}
        self.pattern = reference_pattern(list(codes))

    def add(self, label: str, found: list[tuple[str, int, int]], where: str) -> list[str]:
        keys = []
        for code, chapter, number in found:
            key = f"{code} {chapter}:{number}"
            if key not in self.verses:
                self.verses[key] = self.texts.verse(code, chapter, number, where)
            keys.append(key)
        if self.refs.setdefault(label, keys) != keys:
            fail(f"{where}: the reference {label!r} resolves two ways")
        return keys

    def label(self, label: str, where: str) -> str:
        match = self.pattern.fullmatch(label)
        if not match:
            fail(f"{where}: {label!r} is not a Bible reference this build can read")
        keys = self.add(label, expand(self.codes[match.group(1)], match.group(2), where), where)
        return keys[0]

    def prose(self, record: dict) -> None:
        for path, text in strings(record):
            for match in self.pattern.finditer(plain(text)):
                self.add(match.group(0), expand(self.codes[match.group(1)], match.group(2), path), path)


def check_listed(record: dict, collector: Collector) -> None:
    """The record's verse list must carry exactly the held Berean and Hebrew."""
    for entry in record["verses"]["list"]:
        label, where = entry["label"], f"verse {entry['label']}"
        key = collector.label(label, where)
        held = collector.verses[key]
        if (entry["code"], entry["chapter"], entry["verse"]) != (held["code"], held["chapter"], held["verse"]):
            fail(f"{where}: the label reads {key}, the entry says {entry['code']} {entry['chapter']}:{entry['verse']}")
        if entry["bsbLines"] != held["lines"]:
            fail(f"{where}: the Berean lines differ from the held Berean. Record: {entry['bsbLines']} Held: {held['lines']}")
        if entry["bsb"] != " ".join(held["lines"]):
            fail(f"{where}: the Berean wording differs from the held Berean. Record: {entry['bsb']!r}")
        if held["hebrew"] is None:
            if "hebrew" in entry:
                fail(f"{where}: a New Testament verse carries Hebrew")
            continue
        if unicodedata.normalize("NFC", entry.get("hebrew", "")) != held["hebrew"]:
            fail(f"{where}: the Hebrew differs from the Leningrad text. Record: {entry.get('hebrew')!r} Held: {held['hebrew']!r}")
        if entry.get("hebrewVerse", entry["verse"]) != held.get("hebrewVerse", held["verse"]):
            fail(f"{where}: the record gives Hebrew verse {entry.get('hebrewVerse')}, the Leningrad text's is {held.get('hebrewVerse', held['verse'])}")


def check_quotations(record: dict, collector: Collector) -> int:
    count = 0
    for path, text in strings(record):
        for quote, reference in QUOTE.findall(plain(text)):
            if reference not in collector.refs:
                fail(f"{path}: the quotation's reference {reference!r} is not a Bible reference this build can read")
            berean = " ".join(" ".join(collector.verses[k]["lines"]) for k in collector.refs[reference])
            if normal(quote) not in normal(berean):
                fail(f"{path}: “{quote}” is not word for word the Berean at {reference}, which reads: {berean}")
            count += 1
    return count


def pausing(tokens: list[str], index: int, code: str) -> bool:
    if index == len(tokens) - 1 or tokens[index + 1] == PASEQ:
        return True
    marks = DISJUNCTIVE["poetic" if code in POETIC else "prose"]
    return any(ch in marks for ch in tokens[index])


def take_title(tokens: list[str], title: str, where: str) -> tuple[list[str], list[str]]:
    taken: list[str] = []
    while tokens and skeleton(" ".join(taken)) != skeleton(title):
        taken.append(tokens.pop(0))
        if len(taken) > 4:
            fail(f"{where}: the verse does not begin with the title {title!r}")
    while tokens and tokens[0] == PASEQ:
        taken.append(tokens.pop(0))
    return taken, tokens


def divide(label: str, verse: dict, title_of_chapter: str | None) -> dict:
    """The Hebrew verse cut into lines beside the Berean's, at pausing accents only."""
    code, where = verse["code"], f"Hebrew lines of {label}"
    rule = LINES.get(label, {})
    tokens = verse["hebrew"].split(" ")
    english = list(verse["lines"])
    out: dict = {}
    if "title" in rule:
        taken, tokens = take_title(tokens, rule["title"], where)
        if code == "PSA":
            if TITLES.get(rule["title"]) != title_of_chapter or verse["verse"] != 1 or "hebrewVerse" in verse:
                fail(f"{where}: the title {rule['title']!r} should match the Berean superscription, which is {title_of_chapter!r}")
            out["title"] = {"he": " ".join(taken), "en": title_of_chapter}
        else:
            out["title"] = {"he": " ".join(taken), "en": english.pop(0)}
    if "ends" in rule:
        cuts, start = [], 0
        for end in rule["ends"]:
            index = next((i for i in range(start, len(tokens)) if skeleton(tokens[i]) == skeleton(end)), None)
            if index is None:
                fail(f"{where}: no word {end!r} after word {start}")
            cuts.append(index)
            start = index + 1
    elif rule.get("nun") or len(english) == 2:
        atnach = [i for i, token in enumerate(tokens) if ATNACH in token]
        if len(atnach) != 1:
            fail(f"{where}: expected one atnach to divide at, found {len(atnach)}")
        cuts = atnach
    else:
        fail(f"{where}: the Berean has {len(english)} lines and the build has no division for its Hebrew")
    for index in cuts:
        if not pausing(tokens, index, code):
            fail(f"{where}: a line would end on {tokens[index]!r}, which carries no pausing accent")
    hebrew_lines, start = [], 0
    for index in cuts + [len(tokens) - 1]:
        hebrew_lines.append(" ".join(tokens[start:index + 1]))
        start = index + 1
    if " ".join(([out["title"]["he"]] if "title" in out else []) + hebrew_lines) != verse["hebrew"]:
        fail(f"{where}: the lines do not join back into the verse")
    if rule.get("nun"):
        if len(english) != 4 or len(hebrew_lines) != 2:
            fail(f"{where}: expected four Berean lines over two Hebrew, the nun line missing from the Leningrad text")
        hebrew_lines += [None, None]
    elif len(hebrew_lines) != len(english):
        fail(f"{where}: {len(hebrew_lines)} Hebrew lines beside {len(english)} Berean lines")
    out["rows"] = [{"en": en, "he": he} for en, he in zip(english, hebrew_lines)]
    return out


def pair_all(collector: Collector) -> dict[str, dict]:
    pairs = {}
    for label in PAIRED:
        key = collector.label(label, f"paired verse {label}")
        verse = collector.verses[key]
        title = collector.texts.bsb.chapter(verse["code"], verse["chapter"])["title"]
        pairs[key] = divide(label, verse, title)
    for label in LINES:
        if label not in PAIRED:
            fail(f"a line division is given for {label}, which the page does not pair")
    return pairs


def same_word(token: str, word: str) -> bool:
    """A Hebrew word matches by its consonants, alone or as one part of a maqaf-joined group."""
    held, wanted = skeleton(token), skeleton(word)
    return held == wanted or held.startswith(wanted + "־") or wanted in held.split("־")


def find_word(verse: dict, consonants: str, where: str) -> int:
    for index, token in enumerate(verse["hebrew"].split(" ")):
        if skeleton(consonants) in skeleton(token):
            return index
    fail(f"{where}: the Hebrew has no word with {consonants!r}")


def folds(collector: Collector, record: dict) -> dict:
    gen = collector.verses[collector.label(GEN96["label"], "fold")]
    tokens = gen["hebrew"].split(" ")[:GEN96["words"]]
    for a, b, root in GEN96["pairs"]:
        if skeleton(root) not in skeleton(tokens[a]) or skeleton(root) not in skeleton(tokens[b]):
            fail(f"Genesis 9:6 fold: words {a + 1} and {b + 1} ({tokens[a]}, {tokens[b]}) do not share {root!r}")
    look = plain(at_path(record, GEN96["lookPath"]))
    for gloss in GEN96["glosses"]:
        if gloss not in look:
            fail(f"Genesis 9:6 fold: the record's description does not give the word {gloss!r}: {look}")
    isa = collector.verses[collector.label(ISA610["label"], "fold")]
    he_tokens = isa["hebrew"].split(" ")
    he_at, start = [], 0
    for root in ISA610["hebrew"]:
        index = next((i for i in range(start, len(he_tokens)) if skeleton(root) in skeleton(he_tokens[i])), None)
        if index is None:
            fail(f"Isaiah 6:10 fold: no {root!r} after word {start} in the Hebrew")
        he_at.append(index)
        start = index + 1
    words = re.findall(r"[A-Za-z]+", " ".join(isa["lines"]))
    en_at, start = [], 0
    for word in ISA610["english"]:
        index = next((i for i in range(start, len(words)) if words[i].lower() == word), None)
        if index is None:
            fail(f"Isaiah 6:10 fold: the Berean has no {word!r} after word {start}")
        en_at.append(word)
        start = index + 1
    flood = []
    for label, words_said, count in FLOOD:
        verse = collector.verses[collector.label(label, "flood")]
        if words_said.lower() not in " ".join(verse["lines"]).lower():
            fail(f"flood day-count: the Berean at {label} does not say {words_said!r}")
        flood.append({"ref": label, "words": words_said, "count": count})
    counts = [f["count"] for f in flood]
    if counts != counts[::-1] or counts[len(counts) // 2] != "centre":
        fail(f"flood day-counts: expected a mirror around the centre, found {counts}")
    for label in FLOOD_SPAN:
        collector.label(label, "flood span")
    # Where each day-count stands in the whole story (Genesis 6:9 to 9:19), counted in Berean verses, for the test of the whole.
    span = [(c, n) for c in range(6, 10) for n in sorted(collector.texts.bsb.chapter("GEN", c)["verses"])
            if (c, n) >= (6, 9) and (c, n) <= (9, 19)]
    for item in flood:
        chapter, number = (int(x) for x in item["ref"].split(" ")[1].split(":"))
        item["at"] = span.index((chapter, number))
    return {"gen96": {"words": tokens, "pairs": [p[:2] for p in GEN96["pairs"]], "glosses": GEN96["glosses"]},
            "isa610": {"hebrew": he_at, "english": en_at}, "flood": flood, "floodSpan": list(FLOOD_SPAN), "floodVerses": len(span)}


def refrain_differences(collector: Collector) -> dict[str, list[int]]:
    """Which Hebrew words of each refrain differ from the first one's (Psalm 42:5), by consonants."""
    keys = [collector.label(label, "refrain") for label in ("Psalm 42:5", "Psalm 42:11", "Psalm 43:5")]
    base = [skeleton(t) for t in collector.verses[keys[0]]["hebrew"].split(" ")]
    out = {}
    for key in keys:
        words = [skeleton(t) for t in collector.verses[key]["hebrew"].split(" ")]
        out[key] = [i for i, w in enumerate(words) if w not in base]
    if out[keys[0]] or not out[keys[1]] or out[keys[1]] != out[keys[2]]:
        fail(f"refrain: expected 42:11 and 43:5 to differ from 42:5 in the same words, found {out}")
    return out


def threads(collector: Collector, record: dict) -> dict:
    ids = [item["id"] for item in record["keyWords"]["items"]]
    if sorted(ids) != sorted(THREADS):
        fail(f"key words: the record has {ids}, the build draws {sorted(THREADS)}")
    out = {}
    for thread_id, rows in THREADS.items():
        examples = next(item["examples"] for item in record["keyWords"]["items"] if item["id"] == thread_id)
        drawn = []
        for label, hebrew, english in rows:
            key = collector.label(label, f"key word {thread_id}")
            verse = collector.verses[key]
            if english.lower() not in " ".join(verse["lines"]).lower():
                fail(f"key word {thread_id}: the Berean at {label} does not have {english!r}")
            tokens = verse["hebrew"].split(" ")
            word = []
            for wanted in hebrew:
                index = next((i for i, t in enumerate(tokens) if same_word(t, wanted)), None)
                if index is None:
                    fail(f"key word {thread_id}: the Hebrew at {label} has no word {wanted!r}")
                word.append(index)
            drawn.append({"ref": label, "key": key, "en": english, "he": word})
        missing = [label for label in examples if label not in {row[0] for row in rows}]
        if missing:
            fail(f"key word {thread_id}: the record's examples {missing} are not drawn")
        out[thread_id] = drawn
    genesis1 = collector.texts.bsb.chapter("GEN", 1)["verses"]
    good = [n for n, runs in genesis1.items() if "good" in " ".join(berean_lines(runs)).lower()]
    hebrew1 = collector.texts.wlc.chapter("GEN", 1)["verses"]
    tov = [n for n, runs in hebrew1.items() if "טוב" in skeleton(" ".join(berean_lines(runs)))]
    if good != [4, 10, 12, 18, 21, 25, 31] or tov != good or skeleton("מאד") not in skeleton(collector.verses["GEN 1:31"]["hebrew"]):
        fail(f"Genesis 1: expected seven verdicts at 4, 10, 12, 18, 21, 25, 31 in both texts, the last with מאד; Berean {good}, Hebrew {tov}")
    judges = collector.texts.bsb
    evil = [f"{c}:{n}" for c in range(1, 22) for n, runs in judges.chapter("JDG", c)["verses"].items()
            if "evil in the sight of the lord" in " ".join(berean_lines(runs)).lower()]
    king = [f"{c}:{n}" for c in range(1, 22) for n, runs in judges.chapter("JDG", c)["verses"].items()
            if "no king in israel" in " ".join(berean_lines(runs)).lower()]
    if king != ["17:6", "18:1", "19:1", "21:25"]:
        fail(f"Judges: the record says 'no king in Israel' stands at 17:6, 18:1, 19:1, 21:25; the Berean has it at {king}")
    return {"rows": out, "verdicts": len(good), "judgesEvil": evil, "judgesKing": king}


def units(texts: Texts, spec: dict) -> list[tuple[int, str, list[str]]]:
    """(verse, first letter, its words) for each unit of an alphabet poem, read from the Leningrad text."""
    out = []
    for number in range(spec["first"], spec["last"] + 1):
        runs = texts.wlc.runs(spec["code"], spec["chapter"], number, spec["label"])
        tokens = unicodedata.normalize("NFC", " ".join(berean_lines(runs))).split(" ")
        tokens = [t for t in tokens if skeleton(t) and t not in ("פ", "ס")]
        if number == spec["first"]:
            tokens = tokens[spec["skip"]:]
        pieces = [tokens]
        if spec["unit"] == "half":
            atnach = next((i for i, t in enumerate(tokens) if ATNACH in t), None)
            if atnach is None:
                fail(f"{spec['label']}:{number}: no atnach to divide its half-lines at")
            revia = [i for i, t in enumerate(tokens[:atnach]) if REVIA in t]
            cuts = ([revia[-1]] if revia and number >= spec["last"] - 1 else []) + [atnach]
            pieces, start = [], 0
            for cut in cuts:
                pieces.append(tokens[start:cut + 1])
                start = cut + 1
            pieces.append(tokens[start:])
        out.extend((number, letter_of(piece[0]), piece) for piece in pieces)
    return out


def letter_named(name: str) -> str:
    return ALPHABET[NAMES.index(name)]


def acrostic(texts: Texts, spec: dict) -> dict:
    """Align a poem's openings to the alphabet. Only the irregularities the spec names are allowed; anything else refuses."""
    found = units(texts, spec)
    per = int(spec["unit"].split(":")[1]) if spec["unit"].startswith("verses:") else 1
    groups = [found[i:i + per] for i in range(0, len(found), per)]
    for group in groups:
        if len({letter for _, letter, _ in group}) != 1:
            fail(f"{spec['label']}: verses {group[0][0]}–{group[-1][0]} should share one letter, found {[g[1] for g in group]}")
    expect = spec["expect"]
    missing = {letter_named(n) for n in expect.get("missing", [])}
    second = {letter_named(n) for n in expect.get("second", [])}
    repeat = {letter_named(n) for n in expect.get("repeat", [])}
    order = list(ALPHABET)
    if "swap" in expect:
        i, j = (order.index(letter_named(n)) for n in expect["swap"])
        order[i], order[j] = order[j], order[i]
    slots: dict[str, dict | None] = {}
    extra, repeats, position, last = None, [], 0, None
    for verse, letter, words in (g[0] for g in groups):
        expected = order[position] if position < len(order) else None
        if letter == expected:
            slots[letter] = {"verse": verse, "word": words[0]}
            position += 1
        elif expected in second and len(words) > 1 and letter_of(words[1]) == expected:
            slots[expected] = {"verse": verse, "word": words[1], "second": True}
            position += 1
        elif expected in missing and position + 1 < len(order) and letter == order[position + 1]:
            slots[expected] = None
            slots[letter] = {"verse": verse, "word": words[0]}
            position += 2
        elif letter == last and letter in repeat:
            repeats.append({"verse": verse, "letter": letter})
        elif expected is None and "extra" in expect and letter == letter_named(expect["extra"]) and extra is None:
            extra = {"verse": verse, "letter": letter}
        else:
            fail(f"{spec['label']}: verse {verse} begins with {letter}, expected {expected}")
        last = letter
    if position != len(order):
        fail(f"{spec['label']}: the poem ends before the letter {order[position]}")
    gaps = sorted(NAMES[ALPHABET.index(l)] for l, s in slots.items() if s is None)
    if gaps != sorted(expect.get("missing", [])) or bool(extra) != ("extra" in expect) or len(repeats) != len(repeat):
        fail(f"{spec['label']}: expected {expect}, found gaps {gaps}, extra {extra}, repeats {repeats}")
    letters = [{"letter": l, "name": NAMES[ALPHABET.index(l)], **(slots[l] or {"verse": None})} for l in order]
    offset = len(texts.wlc.chapter(spec["code"], spec["chapter"])["verses"]) - len(texts.bsb.chapter(spec["code"], spec["chapter"])["verses"])
    return {"poem": spec["poem"], "label": spec["label"], "code": spec["code"], "chapter": spec["chapter"], "per": per, "offset": offset,
            "unit": spec["unit"], "letters": letters, "extra": extra, "repeats": repeats, "units": len(found)}


def acrostics(texts: Texts, record: dict) -> dict:
    poems = record["acrostics"]["poems"]
    columns = [acrostic(texts, spec) for spec in ACROSTICS]
    drawn = {c["poem"] for c in columns}
    if drawn | set(NOT_DRAWN) != set(range(len(poems))) or drawn & set(NOT_DRAWN):
        fail(f"alphabet poems: every one of the record's {len(poems)} poems must be drawn or say why not")
    for column in columns:
        name = poems[column["poem"]]["ref"]
        if not name.startswith(column["label"].split(" ")[0][:5]):
            fail(f"alphabet poems: column {column['label']} is filed under {name!r}")
    lam5 = units(texts, {"label": "Lamentations 5", "code": "LAM", "chapter": 5, "first": 1, "last": 22, "unit": "verse", "skip": 0})
    if len(texts.wlc.chapter("LAM", 5)["verses"]) != 22 or [u[1] for u in lam5] == list(ALPHABET):
        fail("Lamentations 5: expected twenty-two verses out of alphabetic order")
    psalm119 = (len(texts.bsb.chapter("PSA", 119)["verses"]), len(texts.wlc.chapter("PSA", 119)["verses"]))
    lam3 = len(texts.wlc.chapter("LAM", 3)["verses"])
    if psalm119 != (176, 176) or lam3 != 66:
        fail(f"expected Psalm 119 to have 176 verses in both texts and Lamentations 3 66; found {psalm119} and {lam3}")
    return {"columns": columns, "notDrawn": {str(k): v for k, v in NOT_DRAWN.items()},
            "lamentations5": [{"verse": v, "letter": l} for v, l, _ in lam5], "psalm119": psalm119[0], "lamentations3": lam3}


def routes(site: Path) -> set[str]:
    found = set(re.findall(r'path="([^"]+)"', (site / "src/App.tsx").read_text(encoding="utf-8")))
    for route in (site / "src/pages/study").glob("*/route.ts"):
        found |= set(re.findall(r'export const path = "([^"]+)"', route.read_text(encoding="utf-8")))
    return found


def check_links(site: Path, record: dict, text: str) -> dict:
    known = routes(site)
    for name, link in LINKS.items():
        if not re.fullmatch(r"/[a-z0-9/-]+", link) or link not in known:
            fail(f"link {name}: {link!r} leaves the site or is not an address the site routes")
    named = record["links"]["theology"] + record["links"]["academic"]
    linked = {title: LINKS[LINK_TITLES[title]] for title in named if title in LINK_TITLES}
    if "://" in text:
        fail("the record or its data holds an outside link; this page links only inside the site")
    return {"pages": dict(LINKS), "studies": linked}


def build_data(site: Path) -> str:
    raw = (site / RECORD).read_bytes().replace(b"\r\n", b"\n")
    record = json.loads(raw)
    catalog = json.loads((site / "data/catalog.json").read_text(encoding="utf-8"))
    codes = {book["name"]: book["code"] for book in catalog["books"]} | ALIASES
    texts = Texts(site)
    collector = Collector(texts, codes)
    check_listed(record, collector)
    collector.prose(record)
    for section in ("kinds",):
        for item in record["parallelism"][section]:
            for label in item["examples"]:
                collector.label(label, f"parallelism {item['id']}")
    for group in (record["patterns"]["items"], record["keyWords"]["items"], record["storyteller"]["tools"], record["greek"]["items"]):
        for item in group:
            for label in item["examples"]:
                collector.label(label, f"examples of {item['id']}")
    for claim in record["claims"]:
        for label in claim["verses"]:
            collector.label(label, f"claim {claim['id']}")
    for label in record["stance"]["verses"]:
        collector.label(label, "stance")
    quotations = check_quotations(record, collector)
    data = {
        "recordHash": hashlib.sha256(raw).hexdigest(),
        "pairs": pair_all(collector),
        "folds": folds(collector, record),
        "refrain": refrain_differences(collector),
        "threads": threads(collector, record),
        "acrostics": acrostics(texts, record),
        "verses": collector.verses,
        "refs": collector.refs,
        "links": {},
    }
    data["counts"] = {"letters": len(ALPHABET), "poems": len(record["acrostics"]["poems"]), "psalm119": data["acrostics"]["psalm119"],
                      "verdicts": data["threads"]["verdicts"], "quotations": quotations}
    data["links"] = check_links(site, record, raw.decode("utf-8") + json.dumps(data, ensure_ascii=False))
    text = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    if len(text.encode("utf-8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf-8'))} bytes, over the {BUDGET_BYTES} budget")
    return text


def write_atomic(out: Path, text: str) -> None:
    handle, temp = tempfile.mkstemp(dir=out.parent, suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
        os.replace(temp, out)
    finally:
        Path(temp).unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--check", action="store_true", help="fail if the data on disk is stale or missing; write nothing")
    args = parser.parse_args()
    site = args.site.resolve()
    out = (site / OUTPUT).resolve()
    if not out.is_relative_to((site / FOLDER).resolve()):
        fail(f"output {out} is outside this study's folder {site / FOLDER}")
    text = build_data(site)
    if args.check:
        current = out.read_text(encoding="utf-8") if out.is_file() else None
        if current != text:
            fail(f"{out} is {'missing' if current is None else 'stale'}: run python scripts/build-poetry-study.py")
        print(f"up to date: {out}")
        return
    write_atomic(out, text)
    data = json.loads(text)
    print(f"wrote {out} ({len(text.encode('utf-8'))} bytes): {len(data['verses'])} verses under {len(data['refs'])} references, "
          f"{len(data['pairs'])} Hebrew-Berean pairs, {len(data['acrostics']['columns'])} alphabet columns, "
          f"{data['counts']['quotations']} quotations checked")


if __name__ == "__main__":
    main()
