"""Matching words for the Leviticus mock-up's build: phrases folded to plain words, the held copies of outside sources,
and the Berean's footnotes. build-data.py checks every quotation through these."""
import html
import json
import re
from pathlib import Path

from scripture_text import BOOKS, BuildError, fold
import study_lists as L

FOOTNOTES = Path(__file__).resolve().parents[2] / "data/text/bsb"


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def pieces(phrase: str) -> list:
    return [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]


class Held:
    """The held copies of outside sources, read once each and folded to words."""

    def __init__(self) -> None:
        self.cache: dict = {}

    def text(self, key: str) -> str:
        if key in self.cache:
            return self.cache[key]
        spec = L.SOURCES_HELD[key]
        path = Path(spec["path"]).resolve()
        if not any(path.is_relative_to(root.resolve()) for root in L.SOURCE_ROOTS):
            raise BuildError(f"held source {key!r} is outside the allowed source folders: {path}")
        raw = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix == ".json":
            found: list = []
            def walk(node) -> None:
                if isinstance(node, str):
                    found.append(node)
                elif isinstance(node, dict):
                    for value in node.values():
                        walk(value)
                elif isinstance(node, list):
                    for value in node:
                        walk(value)
            walk(json.loads(raw))
            raw = "\n".join(found)
        elif path.suffix == ".xml":
            raw = html.unescape(re.sub(r"<[^<>]{0,400}>", " ", raw))
        raw = re.sub(r"\[\d+\]", " ", raw)                    # footnote markers inside a sentence
        raw = re.sub(r"(\w)-[ \t]*\r?\n\s*(\w)", r"\1\2", raw)  # a word broken at a line end
        folded = words(raw)
        for wrong, right in spec.get("fixes", []):
            folded = folded.replace(words(wrong), words(right))
        self.cache[key] = folded
        return folded

    def check(self, phrase: str, key: str, near: str, where: str) -> None:
        text = self.text(key)
        anchors = [m.start() for m in re.finditer(re.escape(words(near)), text)]
        if not anchors:
            raise BuildError(f"{where}: the place-marker {near!r} is not in {L.SOURCES_HELD[key]['name']}")
        for piece in pieces(phrase):
            hits = [m.start() for m in re.finditer(re.escape(words(piece)), text)]
            if not any(abs(h - a) <= L.NEAR_WINDOW for h in hits for a in anchors):
                raise BuildError(f"{where}: outside quotation {piece.strip()!r} is not in {L.SOURCES_HELD[key]['name']} "
                                 f"near {near!r} (found {len(hits)} times elsewhere)")


def footnotes_of(label: str) -> str:
    """The Berean's footnotes on one verse, from the site's marked-up text, folded to words."""
    name, chapter, verse = re.fullmatch(r"(.+) (\d+):(\d+)", label).groups()
    found = []
    for path in sorted((FOOTNOTES / BOOKS[name]).glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        held = book.get(chapter) or {}
        for item in (held.get("v", []) if isinstance(held, dict) else held):
            if isinstance(item, dict) and item.get("n") == verse:
                found += [run["f"] for run in item.get("r", []) if isinstance(run, dict) and "f" in run]
    if not found:
        raise BuildError(f"no Berean footnote found on {label}")
    return words(" ".join(found))
