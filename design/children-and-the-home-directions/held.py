"""The Baptist Faith and Message 2000, held on this PC, read for the Children and the home build. Each quotation is
searched only in its own article, so a phrase cannot pass on words from elsewhere in the confession or from the
catechism printed before it. (Adapted from the Grief and dying mock-up's reader, keeping only the confession.)"""
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between words: quotes and punctuation do not count."""
    return " ".join(re.findall(r"[a-z]+", text.replace("’", "'").replace("'", "").lower()))


def load_held(sources: dict) -> dict:
    """Source key → {article number → normalised words}."""
    held = {}
    for key, spec in sources.items():
        full = (PROJECT / spec["path"]).resolve()
        if PROJECT.resolve() not in full.parents:
            raise BuildError(f"held source outside the BibleProject folder: {spec['path']}")
        try:
            raw = full.read_text(encoding="utf-8", errors="replace")
        except OSError as error:
            raise BuildError(f"could not read held source {full}: {error}") from error
        start = raw.find("\nI. The Scriptures")
        if start < 0:
            raise BuildError(f"held Baptist Faith and Message: could not find where article I begins in {full}")
        parts = re.split(r"\n(?=(?:" + "|".join(ROMAN) + r")\. [A-Z])", raw[start:])
        articles = {part.strip().split(".", 1)[0]: words(part) for part in parts if part.strip().split(".", 1)[0] in ROMAN}
        if "XVIII" not in articles or len(articles) < 17:
            raise BuildError(f"held Baptist Faith and Message: found articles {sorted(articles)}, expected I to XVIII")
        held[key] = articles
    return held


def check_outside(held: dict, phrase: str, source: tuple) -> None:
    name, key, part = source
    body = held.get(key, {}).get(part)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
    if f" {words(phrase)} " not in f" {body} ":
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name}")
