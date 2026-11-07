"""The outside sources held on this PC, read for the Every life in God's image build. Each quotation is searched only
in its own part of its source (one article of the Baptist Faith and Message, one folio of the Talmud), so a phrase
cannot pass on words from elsewhere in the document."""
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between words: quotes, dashes and punctuation do not count."""
    text = text.replace("’", "'").replace("'", "")
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
    parts = re.split(r"\n(?=(?:" + "|".join(ROMAN) + r")\. [A-Z])", raw[start:])
    articles = {}
    for part in parts:
        head = part.strip().split(".", 1)[0]
        if head in ROMAN:
            articles[head] = part
    if len(articles) < 17:
        raise BuildError(f"held Baptist Faith and Message: found {len(articles)} articles, expected at least 17")
    return articles


def talmud_pages(raw: str, pages: dict) -> dict:
    """Folio → its text: every line whose number starts with the folio's prefix ("118." is 59b)."""
    out = {}
    for folio, prefix in pages.items():
        lines = [line for line in raw.splitlines() if line.startswith(prefix)]
        if not lines:
            raise BuildError(f"held Talmud: no lines numbered {prefix} for folio {folio}")
        out[folio] = "\n".join(lines)
    return out


def load_held(sources: dict) -> dict:
    """Source key → {part → normalised words}."""
    held = {}
    for key, spec in sources.items():
        raw = read_project_file(spec["path"])
        split = bfm_articles(raw) if key == "bfm" else talmud_pages(raw, spec["pages"])
        held[key] = {number: words(body) for number, body in split.items()}
    return held


def found_in(held: dict, phrase: str, key: str, part: str, name: str) -> bool:
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
    pieces = [p for p in re.split(r"…|\.\.\.", phrase) if words(p)]
    return all(f" {words(p)} " in f" {body} " for p in pieces)


def check_outside(held: dict, phrase: str, source: tuple) -> None:
    """A quotation with an ellipsis passes when each piece is in the same part."""
    name, key, part = source
    if key is not None and not found_in(held, phrase, key, part, name):
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name}")


def check_differs(held: dict, phrase: str, source: tuple) -> None:
    """An outside quotation the held copy words differently: the study's words must be absent, the held words present."""
    name, key, part, held_words = source
    if found_in(held, phrase, key, part, name):
        raise BuildError(f"OUTSIDE_DIFFERS lists {phrase!r}, but the held copy of {name} has it word for word; remove the entry")
    if not found_in(held, held_words, key, part, name):
        raise BuildError(f"OUTSIDE_DIFFERS gives {held_words!r} as the held wording of {name}, but the held copy does not have it")
