"""The outside source held on this PC for the Witness and the nations build: the Baptist Faith and Message 2000. Each
quotation is searched only in the article the study names for it, so a phrase cannot pass on words from elsewhere in
the confession. Adapted from the Christian and the state build; that folder is not changed."""
import re
from pathlib import Path

from scripture_text import BuildError

PROJECT = Path(__file__).resolve().parents[3]  # the BibleProject folder
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between words: quotes and punctuation do not count."""
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


def load_held(path: str) -> dict:
    """Article number → its normalised words."""
    return {number: words(body) for number, body in bfm_articles(read_project_file(path)).items()}


def check_outside(held: dict, phrase: str, article: str) -> None:
    body = held.get(article)
    if body is None:
        raise BuildError(f"outside quotation {phrase!r}: the held Baptist Faith and Message has no article {article}")
    if f" {words(phrase)} " not in f" {body} ":
        raise BuildError(f"outside quotation {phrase!r} is not in article {article} of the held Baptist Faith and Message")
