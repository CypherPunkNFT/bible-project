"""The home page's verses, taken from our own KJV text at build time (one small file instead of whole books).

The storyline is the Bible's own arc, told in ten movements that Christian traditions broadly share; Luke 24:27 is
the thesis (Christ expounding "all the scriptures" concerning himself).
"""

import json
import re
from pathlib import Path

from .books import BOOK_NUMBER, verse_id
from .study_refs import Verses, parse_refs

HERO = {"word": "John 1:1", "light": "John 1:5"}
THESIS = "Luke 24:27"

# (key, title, one plain sentence, reference)
MOVEMENTS = [
    ("creation", "Creation", "God speaks, and a good world comes to be.", "Genesis 1:1"),
    ("fall", "The fall and the first promise", "Humanity turns from God, and God promises one who will crush the serpent.", "Genesis 3:15"),
    ("covenant", "The covenant with Abraham", "Through one family, a blessing for every family of the earth.", "Genesis 12:3"),
    ("exodus", "The exodus", "The blood of the lamb, and a people brought out of slavery.", "Exodus 12:13"),
    ("kingdom", "The kingdom promised to David", "A son of David, and a throne established for ever.", "2 Samuel 7:16"),
    ("servant", "The suffering servant", "The prophets foresee one wounded for our transgressions.", "Isaiah 53:5"),
    ("incarnation", "The Word made flesh", "God comes to dwell among us, full of grace and truth.", "John 1:14"),
    ("resurrection", "Crucified and risen", "Christ dies for our sins and rises on the third day.", "Luke 24:6"),
    ("church", "The church sent out", "The Spirit is given, and the good news goes to the ends of the earth.", "Acts 1:8"),
    ("new-creation", "All things made new", "A new heaven and a new earth, where God dwells with his people.", "Revelation 21:5"),
]

CODE_OF = {number: code for code, number in BOOK_NUMBER.items()}


def _text(data_root: Path, span: list[int], cache: dict[str, dict]) -> str:
    """The KJV words of a span within one chapter (paragraph marks removed)."""
    code = CODE_OF[span[0] // 1_000_000]
    if code not in cache:
        cache[code] = json.loads((data_root / "plain" / "kjv" / f"{code}.json").read_text(encoding="utf-8"))
    chapter = span[0] // 1000 % 1000
    words = []
    for verse in range(span[0] % 1000, span[1] % 1000 + 1):
        text = cache[code].get(f"{chapter}:{verse}")
        if text is None:
            raise ValueError(f"home: {code} {chapter}:{verse} has no KJV text")
        words.append(re.sub(r"^¶\s*", "", text))
    return " ".join(words)


def build_home(data_root: Path, verses: Verses) -> dict:
    cache: dict[str, dict] = {}

    def one(reference: str) -> dict:
        span = parse_refs(reference, verses)[0]
        if span[0] // 1000 != span[1] // 1000:
            raise ValueError(f"home: {reference} must stay within one chapter")
        return {"ref": reference, "span": span, "text": _text(data_root, span, cache)}

    return {
        "hero": {key: one(ref) for key, ref in HERO.items()},
        "thesis": one(THESIS),
        "movements": [{"key": key, "title": title, "line": line, **one(ref)} for key, title, line, ref in MOVEMENTS],
    }


assert verse_id("GEN", 1, 1) == 1_001_001  # the id scheme this module relies on
