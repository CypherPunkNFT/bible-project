"""R. A. Torrey, The New Topical Text Book (1897): miracles worked through servants of God, and the
"Exemplified" events under "Miracles Through Evil Agents". Christ's miracles come from Robertson instead.

Only Torrey's words and references are used; the reference text is parsed here, never CCEL's markup ids.
"""

import html
import re

from .study_refs import TORREY_OVERRIDES, RefError, Verses, parse_refs

ENTRY = re.compile(r'<p class="(index1|index2)"[^>]*>(.*?)</p>', re.S)

# Hand-checked fixes: (topic, worker, item title) -> corrected reference text, with why.
# Applied even when Torrey's reference resolves, because a misprint can still point at a real verse.
CORRECTIONS: dict[tuple[str, str, str], tuple[str, str]] = {
    ("Miracles Wrought Through Servants of God", "Elisha", "Syrians smitten with blindness"): (
        "2Ki 6:18",
        "Torrey prints 6:20 for both the blinding and the healing; the blinding is 6:18 (\"smite this people, I pray "
        "thee, with blindness\"), the healing 6:20.",
    ),
}


def _text(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def _topic(source: str, name: str) -> str:
    start = source.find(f">{name}</term>")
    if start < 0:
        raise ValueError(f"Torrey: topic {name!r} not found")
    stop = source.find("<term", start + 1)
    return source[start:stop if stop > 0 else None]


def _entries(block: str) -> list[tuple[str, str]]:
    return [(kind, _text(body)) for kind, body in ENTRY.findall(block)]


def _item(topic: str, worker: str, text: str, verses: Verses, corrections_used: list[dict]) -> dict:
    title, sep, refs = text.partition(" — ")
    if not sep:
        raise ValueError(f"Torrey {topic} / {worker}: no ' — ' between title and references in {text!r}")
    title = title.strip().rstrip(".")
    fix = CORRECTIONS.get((topic, worker, title))
    if fix:
        corrections_used.append({"source": "Torrey", "where": f"{worker}: {title}", "printed": refs.strip(" ."),
                                 "corrected": fix[0], "why": fix[1]})
        refs = fix[0]
    try:
        ranges = parse_refs(refs, verses, overrides=TORREY_OVERRIDES)
    except RefError as error:
        raise ValueError(f"Torrey {topic} / {worker} / {title}: {error}") from error
    return {"title": title, "refs": ranges}


def parse_servants(source: str, verses: Verses, corrections_used: list[dict]) -> list[dict]:
    topic = "Miracles Wrought Through Servants of God"
    groups: list[dict] = []
    for kind, text in _entries(_topic(source, topic)):
        # A worker heading is index1, but a few (e.g. "Samson") are tagged index2; a line with no
        # " — references" part is a heading either way.
        if kind == "index1" or " — " not in text:
            groups.append({"who": text.rstrip("."), "items": []})
        elif groups:
            groups[-1]["items"].append(_item(topic, groups[-1]["who"], text, verses, corrections_used))
        else:
            raise ValueError(f"Torrey {topic}: miracle {text!r} before any worker heading")
    return [g for g in groups if g["items"]]


def parse_evil_agents(source: str, verses: Verses, corrections_used: list[dict]) -> list[dict]:
    """Only the 'Exemplified' events; the rest of the topic is teaching about such signs, not events."""
    topic = "Miracles Through Evil Agents"
    items, in_examples = [], False
    for kind, text in _entries(_topic(source, topic)):
        if kind == "index1":
            in_examples = text.rstrip(".").lower() == "exemplified"
        elif in_examples:
            items.append(_item(topic, "Exemplified", text, verses, corrections_used))
    if not items:
        raise ValueError(f"Torrey {topic}: no 'Exemplified' items found")
    return items
