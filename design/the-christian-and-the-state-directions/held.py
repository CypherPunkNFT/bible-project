"""The outside sources held on this PC, read for The Christian and the state build. Each quotation is searched only in its own
part of its source (one article of the Baptist Faith and Message, one chapter of the 1677 confession), so a phrase
cannot pass on words from elsewhere in the document."""
import json
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII",
         "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII"]
# A proof text set into the 1677 confession's line, such as "Joh. 3. 3 5, 6." or "2 Cor. 5. 1, 6, 8."
PROOF_TEXT = re.compile(r"\b(?:[1-3] )?[A-Z][a-z]{1,7}\.(?:\s?\d+[.,]?)+")
PAGE_MARK = re.compile(r"\[Source page[^\]]*\]")


def words(text: str) -> str:
    """Lower-case letters only, one space between words: spelling marks, quotes and punctuation do not count."""
    text = text.replace("ſ", "s").replace("’", "'").replace("'", "")
    return " ".join(re.findall(r"[a-z]+", text.lower()))


def read_project_file(relative: str) -> str:
    full = (PROJECT / relative).resolve()
    if PROJECT.resolve() not in full.parents:
        raise BuildError(f"held source outside the BibleProject folder: {relative}")
    try:
        return full.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {full}: {error}") from error


def bfm_articles(raw: str) -> dict:
    """Article number → its text. Articles start a line with "X. Title" after the catechism that precedes them."""
    start = raw.find("\nI. The Scriptures")
    if start < 0:
        raise BuildError("held Baptist Faith and Message: could not find where article I begins")
    parts = re.split(r"\n(?=(?:" + "|".join(ROMAN[:18]) + r")\. [A-Z])", raw[start:])
    articles = {}
    for part in parts:
        head = part.strip().split(".", 1)[0]
        if head in ROMAN:
            articles[head] = part
    if len(articles) < 17:
        raise BuildError(f"held Baptist Faith and Message: found {len(articles)} articles, expected at least 17")
    return articles


def lbc_chapters(raw: str, key: str) -> dict:
    """Chapter number → its text, from the parts of the held 1677 confession joined in order."""
    try:
        pages = json.loads(raw)
    except ValueError as error:
        raise BuildError(f"held 1677 confession: not valid JSON: {error}") from error
    parts = sorted((k for k in pages if k.split("/")[0] == key), key=lambda k: int(k.split("/")[1]))
    if not parts:
        raise BuildError(f"held 1677 confession: key {key} not found")
    text = "".join(block.get("text", "") for k in parts for block in pages[k].get("blocks", []))
    text = PAGE_MARK.sub(" ", text.replace("ſ", "s"))
    pieces = re.split(r"CHAP\. ([IVXL]+)\.", text)
    chapters = {pieces[i]: pieces[i + 1] for i in range(1, len(pieces) - 1, 2)}
    if "X" not in chapters or "XXXI" not in chapters:
        raise BuildError("held 1677 confession: chapters X and XXXI not found")
    return {number: PROOF_TEXT.sub(" ", body) for number, body in chapters.items()}


def load_held(sources: dict) -> dict:
    """Source key → {part → normalised words}."""
    held = {}
    for key, spec in sources.items():
        raw = read_project_file(spec["path"])
        split = bfm_articles(raw) if key == "bfm" else lbc_chapters(raw, spec["key"])
        held[key] = {number: words(body) for number, body in split.items()}
    return held


def check_outside(held: dict, phrase: str, source: tuple) -> None:
    name, key, part = source
    if key is None:
        return
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
    if f" {words(phrase)} " not in f" {body} ":
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name}")


def check_outside_misquote(held: dict, phrase: str, entry: tuple) -> None:
    """The study's words must NOT be in the held part, and the held wording given as the correction MUST be."""
    name, key, part, held_reading = entry
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside misquote {phrase!r}: {name} has no part {part} in the held copy")
    if f" {words(phrase)} " in f" {body} ":
        raise BuildError(f"OUTSIDE_MISQUOTES lists {phrase!r}, but it is word for word in the held copy of {name}; remove the entry")
    if f" {words(held_reading)} " not in f" {body} ":
        raise BuildError(f"OUTSIDE_MISQUOTES gives {held_reading!r} as the held wording of {name}, but the held copy does not have it")
