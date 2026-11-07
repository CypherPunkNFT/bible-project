"""Finding Scripture references in the Genesis 1–11 study text, the Berean's footnotes, and the held outside texts.

The study writes most references bare, as Genesis does not need naming in a study of Genesis: "(5:5 · BSB)". A bare
reference belongs to the nearest book named earlier in the same sentence, or else to Genesis. Every reference found
here is later resolved against the Berean by verses_of, which fails if the verse does not exist, so a wrongly resolved
reference stops the build rather than passing.
"""
import html
import json
import re
from pathlib import Path

from scripture_text import BOOKS, BuildError, fold

NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
SINGLE_CHAPTER = ("Obadiah", "Philemon", "2 John", "3 John", "Jude")
# A chapter-and-verse reference, with or without its book; or a verse of a one-chapter book ("Jude 14").
REF = re.compile(
    rf"(?:\b(?P<book>{NAMES}) )?(?<![\d:.])(?P<c1>\d+):(?P<v1>\d+)(?:–(?:(?P<c2>\d+):)?(?P<v2>\d+))?(?![\d:])"
    rf"|\b(?P<sbook>{'|'.join(SINGLE_CHAPTER)}) (?P<sv1>\d+)(?:–(?P<sv2>\d+))?(?![\d:])")
# Inside brackets only: ", 19" or ", 6:1" or ", 31–32" continues the reference before it.
CONTINUE = re.compile(r", (?:(?P<c>\d+):)?(?P<v>\d+)(?:–(?P<v2>\d+))?(?=[,)\s·;])")
# A sentence ends at . ? or ! (with any closing quote or bracket) before a capital, but not after an initial ("G. Kline").
SENTENCE_END = re.compile(r"(?<!\b[A-Z])[.?!][\"”’')]*\s+(?=[\"“(*]?[A-Z0-9])")
CHAPTER_VERSE = re.compile(r"\d+:\d+")


def book_mentions(home: str, bare_words: tuple) -> re.Pattern:
    words = "|".join(map(re.escape, bare_words))
    return re.compile(rf"\b(?P<named>{NAMES})(?= \d)" + (rf"|\b(?P<bare>{words})\b" if words else ""))


def sentence_start(text: str, position: int) -> int:
    start = 0
    for match in SENTENCE_END.finditer(text, 0, position):
        start = match.end()
    return start


def in_brackets(text: str, position: int) -> bool:
    opened = text.rfind("(", 0, position)
    return opened != -1 and text.rfind(")", opened, position) == -1


def find_refs(text: str, home: str, bare_words: tuple) -> list:
    """Every reference in a raw line: (start, end, label for the Berean, text as written). Labels use the en dash."""
    mentions = book_mentions(home, bare_words)
    found = []
    for match in REF.finditer(text):
        if match.group("sbook"):
            book, chapter = match.group("sbook"), "1"
            tail = f"–{match.group('sv2')}" if match.group("sv2") else ""
            found.append((match.start(), match.end(), f"{book} 1:{match.group('sv1')}{tail}", match.group(0)))
            continue
        book = match.group("book")
        if not book:
            named = [m.group("named") or m.group("bare") for m in mentions.finditer(text, sentence_start(text, match.start()), match.start())]
            book = named[-1] if named else home
        chapter = match.group("c1")
        tail = ""
        if match.group("v2"):
            tail = f"–{match.group('c2')}:{match.group('v2')}" if match.group("c2") else f"–{match.group('v2')}"
        found.append((match.start(), match.end(), f"{book} {chapter}:{match.group('v1')}{tail}", match.group(0)))
        chapter = match.group("c2") or chapter
        end = match.end()
        if not in_brackets(text, match.start()):
            continue
        while (more := CONTINUE.match(text, end)):
            chapter = more.group("c") or chapter
            tail = f"–{more.group('v2')}" if more.group("v2") else ""
            found.append((more.start() + 2, more.end(), f"{book} {chapter}:{more.group('v')}{tail}", more.group(0)[2:]))
            end = more.end()
    return found


def reading_list(body: str) -> list:
    """Main readings: "Genesis 3:20; 4:1–2, 14–17; Leviticus 18:9." Book and chapter carry across ";" and ","."""
    labels, book, chapter = [], None, None
    for piece in body.rstrip(".").split(";"):
        for item in piece.strip().split(", "):
            match = re.fullmatch(rf"(?:(?P<book>{NAMES}) )?(?:(?P<c>\d+):)?(?P<v>\d+(?:–(?:\d+:)?\d+)?)", item.strip())
            if not match:
                raise BuildError(f"main readings: cannot read {item!r} in {body!r}")
            book = match.group("book") or book
            if book is None:
                raise BuildError(f"main readings: {item!r} has no book before it in {body!r}")
            if book in SINGLE_CHAPTER:
                chapter = "1"
            elif match.group("c"):
                chapter = match.group("c")
            elif chapter is None or match.group("book"):
                raise BuildError(f"main readings: {item!r} has no chapter in {body!r}")
            labels.append(f"{book} {chapter}:{match.group('v')}")
    return labels


def footnotes(website: Path, label_code: str, chapter: int, verse: int) -> list:
    """The Berean's footnotes on one verse, from the site's text files (five chapters a file). Fails loudly."""
    if chapter < 1 or verse < 1:
        raise BuildError(f"footnotes: chapter and verse must be 1 or more, got {chapter}:{verse}")
    path = website / "data/text/bsb" / label_code / f"{(chapter - 1) // 5}.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise BuildError(f"footnotes: could not read {path}: {error}") from error
    if str(chapter) not in data:
        raise BuildError(f"footnotes: chapter {chapter} is not in {path}")
    for item in data[str(chapter)]["v"]:
        if item.get("n") == str(verse):
            return [fold(run["f"]) for run in item.get("r", []) if isinstance(run, dict) and "f" in run]
    raise BuildError(f"footnotes: verse {chapter}:{verse} is not in {path}")


def held_text(path: Path) -> str:
    """A held outside text, tags removed, quotes and dashes folded, spaces collapsed, for whole-phrase matching."""
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    return re.sub(r"\s+", " ", fold(html.unescape(re.sub(r"<[^>]+>", " ", raw))))
