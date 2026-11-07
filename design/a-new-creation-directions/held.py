"""The outside sources held on this PC, read for the A new creation build. Each quotation is searched only in its own part
of its source (one article of the Baptist Faith and Message, one section of a confession), so a phrase cannot pass on words
from elsewhere in the document. Adapted from the Every life in God's image build."""
import json
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between words: quotes, dashes and punctuation do not count."""
    text = text.replace("’", "'").replace("'", "")
    return " ".join(re.findall(r"[a-z]+", text.lower()))


def project_path(relative: str) -> Path:
    full = (PROJECT / relative).resolve()
    if PROJECT.resolve() not in full.parents:
        raise BuildError(f"held source outside the BibleProject folder: {relative}")
    return full


def read_project_file(relative: str) -> str:
    full = project_path(relative)
    try:
        return full.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {full}: {error}") from error


def bfm_articles(raw: str) -> dict:
    """Article number → its text. Articles start a line with "X. Title" after the catechism that precedes them."""
    start = raw.find("\nI. The Scriptures")
    if start < 0:
        raise BuildError("held Baptist Faith and Message: could not find where article I begins")
    parts = re.split(r"\n(?=(?:" + "|".join(ROMAN) + r")\. [A-Z])", raw[start:])
    articles = {}
    for part in parts:
        head = part.strip().split(".", 1)[0]
        if head in ROMAN:
            articles[head] = part
    if len(articles) < 17:
        raise BuildError(f"held Baptist Faith and Message: found {len(articles)} articles, expected at least 17")
    return articles


def creed_sections(raw: str, name: str) -> dict:
    """Section id → its text, from the site's creed JSON."""
    try:
        return {section["id"]: section.get("text") or "" for section in json.loads(raw)["sections"]}
    except (ValueError, KeyError, TypeError) as error:
        raise BuildError(f"held source {name}: not the expected creed JSON: {error}") from error


def load_held(sources: dict) -> dict:
    """Source key → {part → normalised words}."""
    held = {}
    for key, spec in sources.items():
        raw = read_project_file(spec["path"])
        split = bfm_articles(raw) if spec["kind"] == "bfm" else creed_sections(raw, key)
        held[key] = {number: words(body) for number, body in split.items()}
    return held


def check_outside(held: dict, phrase: str, source: tuple) -> None:
    """The quotation's words, in order, inside the one part of the held source it is attributed to."""
    name, key, part = source
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
    if f" {words(phrase)} " not in f" {body} ":
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name} (part {part})")


def held_paths(sources: dict) -> list:
    return [project_path(spec["path"]) for spec in sources.values()]
