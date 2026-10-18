"""What the hymn scripts share: where things live, the 66 books, the site's own Bible text, and the word handling the
matcher and the item writer both use.

The research corpus (Research/Hymns/normalized) is read only. The pipeline's own in-between files live in
Research/Hymns/pipeline/; the website's page data is written only by scripts/build-hymn-pages.py.
"""

from __future__ import annotations

import json
import re
import sys
from functools import cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bible.books import BOOKS

WEBSITE = Path(__file__).resolve().parents[2]
PROJECT = WEBSITE.parent
CORPUS = PROJECT / "Research" / "Hymns"
NORMALIZED = CORPUS / "normalized" / "hymns"
PIPELINE = CORPUS / "pipeline"
HYMNS_FILE = PIPELINE / "hymns.json"
CANDIDATES_FILE = PIPELINE / "candidates.json"
ITEMS = CORPUS / "llm-items"
ANSWERS = CORPUS / "llm-answers"
CHECKED_FILE = PIPELINE / "checked.json"

# The 66 books of the Protestant canon, in order: (code, name, section, OSIS name).
CANON = [b for b in BOOKS if b[2] != "apocrypha"][:66]
CODE_INDEX = {code: i for i, (code, *_rest) in enumerate(CANON)}
OSIS_TO_CODE = {osis: code for code, _name, _section, osis in CANON}
NAME_OF = {code: name for code, name, _section, _osis in CANON}
SECTION_OF = {code: section for code, _name, section, _osis in CANON}


def write_json(path: Path, data: object, compact: bool = False) -> None:
    """Write UTF-8 JSON with LF line endings, creating the folder."""
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(data, ensure_ascii=False, indent=1)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text + "\n")


def read_json(path: Path) -> object:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


@cache
def bible(translation: str) -> dict[str, dict[str, str]]:
    """The site's plain text of one translation: code → {"chapter:verse": text}, for the 66 books."""
    out: dict[str, dict[str, str]] = {}
    for code, *_rest in CANON:
        path = WEBSITE / "data" / "plain" / translation / f"{code}.json"
        if not path.exists():
            raise FileNotFoundError(f"no {translation} text for {code}: expected {path} (run the site's Bible build first)")
        out[code] = read_json(path)  # type: ignore[assignment]
    return out


def verse_text(translation: str, code: str, chapter: int, verse: int) -> str | None:
    """One verse's text with the KJV's paragraph marks taken out, or None if there is no such verse."""
    text = bible(translation)[code].get(f"{chapter}:{verse}")
    return " ".join(text.replace("¶", "").split()) if text is not None else None


def chapter_verses(translation: str, code: str, chapter: int) -> list[int]:
    """The verse numbers of one chapter, in order."""
    prefix = f"{chapter}:"
    return sorted(int(k[len(prefix):]) for k in bible(translation)[code] if k.startswith(prefix))


def ref_label(code: str, chapter: int, first: int | None = None, last: int | None = None) -> str:
    """"Psalm 23", "1 Chronicles 17:16–17", "John 9:25"."""
    name = "Psalm" if code == "PSA" else NAME_OF[code]
    if first is None:
        return f"{name} {chapter}"
    return f"{name} {chapter}:{first}" + (f"–{last}" if last and last != first else "")


# ── Words ────────────────────────────────────────────────────────────────────────────────────────────────────────────
# Eighteenth-century elisions and spellings, and the KJV's own, made one so that the hymn's "heav'n" meets the
# Bible's "heaven" and "Saviour" meets "Saviour".
ELISIONS = {
    "heav'n": "heaven", "heav'nly": "heavenly", "pow'r": "power", "pow'rs": "powers", "ev'ry": "every", "o'er": "over",
    "e'er": "ever", "ne'er": "never", "th'": "the", "'tis": "it is", "'twas": "it was", "'twill": "it will", "t'": "to",
    "ev'n": "even", "fi'ry": "fiery", "flow'r": "flower", "flow'rs": "flowers", "tow'r": "tower", "show'rs": "showers",
    "spirit's": "spirit", "lord's": "lord", "god's": "god", "christ's": "christ", "saviour's": "saviour", "jesus'": "jesus",
    "wond'rous": "wondrous", "wand'ring": "wandering", "hast'ning": "hastening", "fall'n": "fallen", "giv'n": "given",
    "driv'n": "driven", "forgiv'n": "forgiven", "ris'n": "risen", "e'en": "even", "whate'er": "whatever", "where'er": "wherever",
}
SPELLING = {"savior": "saviour", "honor": "honour", "vail": "veil", "shew": "show", "shewed": "showed", "labor": "labour",
            "neighbor": "neighbour", "sought": "seek", "taught": "teach", "brought": "bring",
            "thought": "think", "bought": "buy", "wrought": "work", "fought": "fight", "spake": "speak", "spoke": "speak",
            "gave": "give", "came": "come", "saw": "see", "knew": "know", "slew": "slay", "slain": "slay", "rose": "rise",
            "arose": "rise", "fell": "fall", "fallen": "fall", "led": "lead", "fled": "flee", "bore": "bear", "born": "bear",
            "borne": "bear", "sang": "sing", "sung": "sing", "wept": "weep", "kept": "keep", "slept": "sleep", "dwelt": "dwell",
            "chose": "choose", "chosen": "choose", "hid": "hide", "hidden": "hide", "lain": "lie", "lay": "lie", "laid": "lay",
            "smote": "smite", "smitten": "smite", "broke": "break", "broken": "break", "shone": "shine", "mine": "my",
            "thine": "thy", "hath": "have", "hast": "have", "doth": "do", "dost": "do", "art": "be", "wast": "be", "wert": "be",
            "saith": "say", "said": "say", "spoken": "speak", "written": "write", "wrote": "write", "given": "give",
            "forgave": "forgive", "forgiven": "forgive", "drawn": "draw", "drew": "draw", "grew": "grow", "grown": "grow",
            "flew": "fly", "flown": "fly", "blest": "bless", "blessed": "bless", "burnt": "burn", "felt": "feel", "dealt": "deal"}
# Words so common they say nothing about which verse a line echoes. "thee", "thou" and "thy" are kept as words (the
# plan's rule), so they still count inside a shared phrase, but not on their own.
STOP = set(["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "he", "her", "him", "his", "i", "if", "in", "into", "is", "it", "its", "me", "my", "no", "nor", "not", "o", "of", "oh", "on", "or", "our", "ours", "shall", "should", "she", "so", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "thou", "thee", "thy", "to", "too", "unto", "up", "us", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "ye", "you", "your", "yea", "all", "also", "am", "do", "did", "have", "had", "has", "let", "may", "might", "must", "shalt", "wilt", "would", "can", "could", "now", "one", "own", "out", "such", "upon", "very", "more", "most", "yet", "lo", "behold", "every", "any", "even", "ever", "how", "here", "thus", "like", "through", "many"])
WORD = re.compile(r"[a-z]+(?:'[a-z]+)*'?|'[a-z]+")


def stem(word: str) -> str:
    """A light stemmer, the same on both sides: "faileth", "failed", "fails" and "fail" all become "fail"."""
    word = SPELLING.get(word, word)
    for suffix, keep in (("eth", 3), ("est", 3), ("edst", 3), ("ings", 3), ("ing", 3), ("ied", 2), ("ies", 2), ("ed", 3),
                         ("es", 3), ("s", 3)):
        if suffix == "s" and word.endswith(("ss", "us", "is")):
            continue
        if word.endswith(suffix) and len(word) - len(suffix) >= keep:
            base = word[: -len(suffix)]
            if suffix in ("ied", "ies"):
                base += "y"
            elif len(base) > 3 and base[-1] == base[-2] and base[-1] not in "ls":
                base = base[:-1]  # "sinned" → "sin"
            return SPELLING.get(base, base)
    return word


STOP |= {stem(w) for w in STOP}  # the stop list as the stemmer leaves it ("thus" stays "thus", "this" "this")


def words(text: str) -> list[str]:
    """Lower-case words with elisions expanded and spellings made one, in order."""
    text = text.lower().replace("’", "'").replace("‘", "'").replace("ſ", "s")
    out: list[str] = []
    for token in WORD.findall(text):
        expanded = ELISIONS.get(token)
        if expanded is None and token.endswith("'d") and len(token) > 3:
            expanded = token[:-2] + "ed"  # "plac'd" → "placed", "lov'd" → "loved"
        for part in (expanded or token.strip("'")).split():
            part = part.replace("'", "")
            if part:
                out.append(part)
    return out


def stems(text: str) -> list[str]:
    return [stem(w) for w in words(text)]
