"""The one outside source held on this PC that The wisdom books quotes: the Baptist Faith and Message 2000. Each quotation
is searched only in its own article, so a phrase cannot pass on words from elsewhere in the confession. Adapted from The
Christian and the state build's reader, with the 1677 confession left out because this study does not quote it."""
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between words: quotes and punctuation do not count."""
    text = text.replace("’", "'").replace("'", "")
    return " ".join(re.findall(r"[a-z]+", text.lower()))


def held_path(relative: str) -> Path:
    full = (PROJECT / relative).resolve()
    if PROJECT.resolve() not in full.parents:
        raise BuildError(f"held source outside the BibleProject folder: {relative}")
    return full


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


def load_held(sources: dict) -> dict:
    """Source key → {article → normalised words}."""
    held = {}
    for key, spec in sources.items():
        path = held_path(spec["path"])
        try:
            raw = path.read_text(encoding="utf-8", errors="replace")
        except OSError as error:
            raise BuildError(f"could not read held source {path}: {error}") from error
        held[key] = {number: words(body) for number, body in bfm_articles(raw).items()}
    return held


def check_outside(held: dict, phrase: str, source: tuple) -> None:
    """A held quotation must be word for word in its own article. A source not held (key None) is marked, not checked."""
    name, key, part = source
    if key is None:
        return
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
    if f" {words(phrase)} " not in f" {body} ":
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name}")
