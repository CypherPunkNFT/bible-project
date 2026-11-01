"""Corrects misspellings in the source text of the topic and people pages (the list and its rules:
content/translation/english-spelling.json). Applied at build, so a rebuild cannot bring a mistake back."""

import json
import re
from pathlib import Path

SPELLING_FILE = Path(__file__).resolve().parents[2] / "content" / "translation" / "english-spelling.json"
_LIST = json.loads(SPELLING_FILE.read_text(encoding="utf-8"))
WORDS: dict[str, str] = _LIST["words"]
PHRASES: list[list[str]] = _LIST["phrases"]
WHOLE_STRINGS: dict[str, str] = _LIST["whole_strings"]
_WORD = re.compile(r"\b(?:" + "|".join(WORDS) + r")\b", re.IGNORECASE)
_SPACED_APOSTROPHE = re.compile(r"(?<=\w)(['’]) ([sS])\b")
_STRAY_POINT = re.compile(r"(?<= )\.(?=[A-Z][a-z])")
_SPACED_ETC = re.compile(r"& c\b")
# The dictionary closes this bracket too soon, between two links, so no one piece of text holds the slip.
_ISLES_OPENING = "sometimes simply “isles” ("


def _same_capitals(found: str, right: str) -> str:
    if found.isupper():
        return right.upper()
    return right[0].upper() + right[1:] if found[0].isupper() else right


def correct_text(text: str, used: set[str] | None = None) -> str:
    """The text with every listed slip corrected; `used` collects the phrases found, so a stale one can be reported."""
    if text in WHOLE_STRINGS:
        return WHOLE_STRINGS[text]
    for wrong, right in PHRASES:
        if wrong in text:
            text = text.replace(wrong, right)
            if used is not None:
                used.add(wrong)
    text = _WORD.sub(lambda match: _same_capitals(match[0], WORDS[match[0].lower()]), text)
    text = _SPACED_APOSTROPHE.sub(r"\1\2", text)
    return _SPACED_ETC.sub("&c", _STRAY_POINT.sub("", text))


def correct_tree(value, skip_keys: frozenset[str], used: set[str]):
    """A copy of a JSON value with every string corrected, except under the keys named (ids, links)."""
    if isinstance(value, str):
        return correct_text(value, used)
    if isinstance(value, list):
        items = [correct_tree(item, skip_keys, used) for item in value]
        for index, item in enumerate(items[:-2]):
            if isinstance(item, str) and item.endswith(_ISLES_OPENING) and items[index + 2] == "); ":
                items[index + 2] = "; "
        return items
    if isinstance(value, dict):
        return {key: child if key in skip_keys else correct_tree(child, skip_keys, used) for key, child in value.items()}
    return value
