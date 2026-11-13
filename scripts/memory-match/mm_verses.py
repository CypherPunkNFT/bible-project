"""Memory card match, Verses version: the first half of a well-known verse pairs with its second half.

The verses are verse completion's hand-picked pool (src/data/verse-completion/pool.json, one-verse passages only), so
this version adds no list of its own beyond scripts/memory-match/verses.json, which drops a verse that splits badly.
The site keeps no verse wording in its data (scripts/check-verse-wording.py): the shipped file holds each verse's id and
the word where it splits, and the game splits the BSB text in the browser the same way (verse-cards.ts). The review
sheet, under docs/, shows every split so a person can read them.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field

from mm_build import BOOK_NUM, SITE, BuildError, Sources, content_words, read_json, show_ref
from mm_pairs import deck_pools

VERSE_DECKS = [("old-testament", "Old Testament"), ("new-testament", "New Testament")]
POOL = SITE / "src" / "data" / "verse-completion" / "pool.json"
MAX_HALF = 48  # characters in either half; longer halves make a card too tall on a phone
MAX_HALF_HARD = 40  # Hard deals 24 cards, so its verses are shorter still
MIN_WORDS = 3  # in either half
JOINING = {"and", "but", "for", "that", "so", "because", "who", "which", "when", "if"}
# Double quotation marks, an opening single mark, and a closing single mark after punctuation (an apostrophe follows a
# letter and stays): a verse that opens or closes a speech has only one of its pair.
QUOTE_MARKS = re.compile("[“”\"‘]|(?<=[.,!?;:—])’")


def clean(text: str) -> str:
    """As src/lib/verses.ts cleans a verse: no leading pilcrow, single spaces."""
    return re.sub(r"\s+", " ", re.sub(r"^¶\s*", "", text)).strip()


def split_point(words: list[str]) -> int | None:
    """The word the second half starts at: the pause (, ; : — . ? !) nearest the middle by characters, inside the
    middle half of the verse; failing that, a joining word ("and", "but", "for"...) inside the middle third."""
    total = len(" ".join(words))
    best: tuple[float, int] | None = None
    for low, high, pause in ((0.25, 0.75, True), (0.35, 0.65, False)):
        for i in range(MIN_WORDS, len(words) - MIN_WORDS + 1):
            at = len(" ".join(words[:i]))
            if not low * total <= at <= high * total:
                continue
            here = bool(re.search(r"[,;:—.?!]$", words[i - 1])) if pause else (
                words[i].lower() in JOINING and words[i - 1].lower() not in JOINING | {"the", "a", "an"})
            if here and (best is None or abs(at - total / 2) < best[0]):
                best = (abs(at - total / 2), i)
        if best:
            return best[1]
    return None


def verse_words(text: str) -> list[str]:
    """The verse's words as the game splits them (verse-cards.ts): cleaned, without double quotation marks (a verse
    that opens a speech has no closing mark), single spaces."""
    return clean(QUOTE_MARKS.sub("", clean(text))).split(" ")


def halves(text: str, split: int) -> tuple[str, str]:
    words = verse_words(text)
    return " ".join(words[:split]), " ".join(words[split:])


def opening(text: str) -> str:
    return " ".join(re.sub(r"[^a-z' ]", "", text.lower()).split()[:2])


@dataclass
class VersePair:
    id: str
    who: str
    verse: int
    book: str
    chapter: int
    number: int
    tier: int
    decks: list[str]
    split: int
    first: str
    second: str
    hard: bool
    not_with: set[str] = field(default_factory=set)


def load_verses(sources: Sources, excluded: dict[str, str]) -> tuple[list[VersePair], list[tuple[str, str]]]:
    """The pool's one-verse passages that split well, and the ones left out with the reason."""
    codes = {n: code for code, n in BOOK_NUM.items()}
    pairs, left_out = [], []
    for passage in read_json(POOL)["passages"]:
        if passage["from"] != passage["to"]:
            continue
        vid = passage["from"]
        book, chapter, number = codes[vid // 1_000_000], vid // 1000 % 1000, vid % 1000
        text = sources.bible.get(book, {}).get(f"{chapter}:{number}")
        if text is None:
            raise BuildError(f"verse completion passage {passage['id']}: {book} {chapter}:{number} is not in the BSB")
        if passage["id"] in excluded:
            left_out.append((passage["id"], excluded[passage["id"]]))
            continue
        split = split_point(verse_words(text))
        if split is None:
            left_out.append((passage["id"], "no pause near the middle"))
            continue
        first, second = halves(text, split)
        longest = max(len(first), len(second))
        if longest > MAX_HALF:
            left_out.append((passage["id"], f"a half of {longest} characters"))
            continue
        key = "mv-" + hashlib.sha1(str(vid).encode()).hexdigest()[:6]
        deck = "old-testament" if passage["testament"] == "ot" else "new-testament"
        pairs.append(VersePair(key, key, vid, book, chapter, number, passage["tier"], [deck], split, first, second,
                               longest <= MAX_HALF_HARD))
    unknown = set(excluded) - {p["id"] for p in read_json(POOL)["passages"]}
    if unknown:
        raise BuildError(f"verses.json excludes passages verse completion does not have: {', '.join(sorted(unknown))}")
    return pairs, left_out


def link_lookalikes(pairs: list[VersePair]) -> None:
    """Two verses whose first halves, or whose second halves, open with the same two words could be crossed ("Blessed
    are the merciful" / "Blessed are the pure in heart"), so they never share a board."""
    for side in ("first", "second"):
        groups: dict[str, list[VersePair]] = {}
        for pair in pairs:
            groups.setdefault(opening(getattr(pair, side)), []).append(pair)
        for group in groups.values():
            for pair in group:
                pair.not_with |= {other.who for other in group if other is not pair}


def verses_document(raw: dict, sources: Sources) -> tuple[dict, list[dict], list[VersePair], list[tuple[str, str]]]:
    pairs, left_out = load_verses(sources, raw.get("exclude", {}))
    if len({p.id for p in pairs}) != len(pairs):
        raise BuildError("two verses hash to the same id")
    link_lookalikes(pairs)
    decks = deck_pools(pairs, {}, sources, VERSE_DECKS, fame_of=lambda p: (0,), fits_hard=lambda p: p.hard)
    body = {
        "decks": [{k: v for k, v in d.items() if not k.startswith("_")} for d in decks],
        "verses": [{
            "id": p.id, "verseId": p.verse, "split": p.split, "tier": p.tier, "decks": p.decks,
            "ref": show_ref(f"{p.book} {p.chapter}:{p.number}"),
            "readerHref": f"/read/bsb/{p.book}/{p.chapter}?hl={p.number}",
            "words": content_words(p.second), "notWith": sorted(p.not_with),
            **({} if p.hard else {"notOnHard": True}),
        } for p in pairs],
    }
    stamp = hashlib.sha1(json.dumps(body, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:12]
    head = {"about": "Memory match, Verses: verse ids and split points only; the words come from the BSB in the "
                     "browser. Generated by scripts/build-memory-match.py; do not edit.", "version": 1, "stamp": stamp}
    return {**head, **body}, decks, pairs, left_out

