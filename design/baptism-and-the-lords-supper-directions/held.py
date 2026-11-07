"""The outside sources held on this PC, read for the Baptism and the Lord's Supper build. Each quotation is searched
only in its own part (one article of the Baptist Faith and Message, one section of a confession, one commentary note),
so a phrase cannot pass on words from elsewhere in the document. Words are compared as lower-case letters only:
punctuation, quotation marks and capitals do not count, spelling does."""
import json
import re
from pathlib import Path

from scripture_text import BuildError, held_paragraphs

WEBSITE = Path(__file__).resolve().parents[2]
PROJECT = WEBSITE.parent  # the BibleProject folder
CREEDS = PROJECT / "Research/Creeds/normalized/creeds"
CCEL = PROJECT / "sources/library/bulk/ccel"
HELD = {
    "bfm": WEBSITE / "content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt",
    "lbc": CREEDS / "1689-london-baptist-confession-1677.json",
    "nh": CREEDS / "new-hampshire-baptist-confession-1833.json",
    "wcf": CREEDS / "westminster-confession-of-faith-1647.json",
    "trent": CREEDS / "council-of-trent-canons-and-decrees-1563.json",
    "luther": CREEDS / "luthers-small-catechism-1529.json",
    "orthodox": CREEDS / "longer-catechism-of-the-orthodox-church-1839.json",
    "barnes": CCEL / "barnes_ntnotes.xml",
    "jfb": CCEL / "jamieson_jfb.xml",
}
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str, spellings: dict | None = None) -> str:
    """Lower-case letters only, one space between words; old spellings read as the study modernises them."""
    text = text.replace("ſ", "s").replace("’", "'").replace("'", "")
    found = re.findall(r"[a-z]+", text.lower())
    return " ".join((spellings or {}).get(w, w) for w in found)


def bfm_articles(raw: str) -> dict:
    """Article number -> its text. Articles start a line with "X. Title" after the catechism that precedes them."""
    start = raw.find("\nI. The Scriptures")
    if start < 0:
        raise BuildError("held Baptist Faith and Message: could not find where article I begins")
    parts = re.split(r"\n(?=(?:" + "|".join(ROMAN) + r")\. [A-Z])", raw[start:])
    articles = {part.strip().split(".", 1)[0]: part for part in parts if part.strip().split(".", 1)[0] in ROMAN}
    if "VII" not in articles or len(articles) < 17:
        raise BuildError(f"held Baptist Faith and Message: found {len(articles)} articles, expected at least 17 including VII")
    return articles


def creed_sections(path: Path) -> dict:
    """Section id ("29.2") -> its text, from one document of the normalised creeds collection."""
    try:
        sections = json.loads(path.read_text(encoding="utf-8"))["sections"]
    except (OSError, ValueError, KeyError) as error:
        raise BuildError(f"could not read held creed {path}: {error}") from error
    return {str(s.get("id")): s.get("text") or "" for s in sections}


class Held:
    """Loads each source once, on first use."""

    def __init__(self, spellings: dict) -> None:
        self.spellings = spellings
        self.cache: dict = {}

    def parts(self, key: str):
        if key not in self.cache:
            path = HELD.get(key)
            if path is None:
                raise BuildError(f"no held source is named {key!r}")
            if key == "bfm":
                self.cache[key] = bfm_articles(path.read_text(encoding="utf-8", errors="replace"))
            elif path.suffix == ".json":
                self.cache[key] = creed_sections(path)
            else:
                self.cache[key] = held_paragraphs(path, None, None)
        return self.cache[key]

    def check(self, phrase: str, source: tuple) -> bool:
        """True if checked; False if the source is not held. Raises if it is held and the words are not in its part."""
        name, key, part = source
        if key is None:
            return False
        held = self.parts(key)
        pieces = [f" {words(p, self.spellings)} " for p in re.split(r"\.\.\.|…", phrase) if words(p)]
        if isinstance(held, list):  # a commentary: the paragraph must also hold the note's own words
            bodies = [p for p in held if part in p]
            if not bodies:
                raise BuildError(f"outside quotation {phrase!r}: no paragraph of {name} holds {part!r}")
        elif part is None:
            bodies = list(held.values())
        elif part in held:
            bodies = [held[part]]
        else:
            raise BuildError(f"outside quotation {phrase!r}: {name} has no part {part} in the held copy")
        for body in bodies:
            text = f" {words(body, self.spellings)} "
            if all(piece in text for piece in pieces):
                return True
        raise BuildError(f"outside quotation {phrase!r} is not in the held copy of {name}" + (f" ({part})" if part else ""))


def proof_texts(key: str, part: str) -> list:
    """The Bible references a held confession prints under one section (as OSIS, e.g. "Col.2.11-Col.2.12")."""
    try:
        sections = json.loads(HELD[key].read_text(encoding="utf-8"))["sections"]
    except (OSError, ValueError, KeyError) as error:
        raise BuildError(f"could not read held creed {key}: {error}") from error
    found = [s for s in sections if str(s.get("id")) == part]
    if not found:
        raise BuildError(f"held creed {key} has no section {part}")
    return [r.get("osis") for r in found[0].get("scripture_references", [])]
