"""Memory card match: check every who card and pair, then compute the shipped document (design 4.1, 5.2, 5.4, 8).

Pure functions over the inputs and a Sources object, so the tests can feed small made-up data.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field

import mm_build
from mm_build import (
    BOARD_PAIRS,
    DECKS,
    EASY_POOL_CHARACTERS,
    MIXED,
    NOT_A_GIVEAWAY,
    SHY,
    SPEC_PAIR,
    WORD,
    BuildError,
    Sources,
    bare,
    capitalised_names,
    check_label_shape,
    content_words,
    first_name,
    make_id,
    name_words,
    outside_quotes,
    parse_ref,
    passage_verses,
    plain,
    quotations,
    reader_href,
    show_ref,
    verse_id,
)

DECK_KEYS = [key for key, _ in DECKS]


@dataclass
class Character:
    key: str
    label: str
    person: str | None
    group: bool = False
    parable: bool = False
    href: str | None = None
    giveaways: set[str] = field(default_factory=set)  # lower-case words a story card must not contain


@dataclass
class Pair:
    who: str
    story: str
    ref: str
    check: str
    tier: int
    decks: list[str]
    not_with: list[str]
    key_verse: str | None = None
    id: str = ""
    key_book: str = ""
    key_chapter: int = 0
    key_number: int = 0


def load_characters(raw: dict, sources: Sources) -> dict[str, Character]:
    characters = {}
    for key, entry in raw.items():
        label = entry["label"]
        where = f"characters.json {key!r}"
        check_label_shape(label, where)
        person_id = entry.get("person")
        character = Character(key, label, person_id, bool(entry.get("group")), bool(entry.get("parable")))
        words = {w.lower() for w in name_words(label)}
        if person_id is not None:
            person = sources.people.get(person_id)
            if person is None:
                raise BuildError(f"{where}: person {person_id!r} is not in data/study/people.json")
            names = {person["n"], *person.get("o", []), *person["n"].split()}
            if not {bare(w.rstrip(",")) for w in label.replace(SHY, "").split()} & names:
                raise BuildError(f"{where}: no word of the label {label!r} is {person_id}'s name or other names "
                                 f"({', '.join(sorted(names))})")
            character.href = f"/people/{sources.slugs.get(person_id, person_id)}"
            words |= {n.lower() for name in names for n in name.split()}
        character.giveaways = words - NOT_A_GIVEAWAY
        characters[key] = character
    return characters


def load_pairs(raw: list[dict]) -> list[Pair]:
    pairs = []
    for n, entry in enumerate(raw, start=1):
        try:
            pairs.append(Pair(entry["who"], entry["story"], entry["ref"], entry["check"], entry["tier"],
                              list(entry["decks"]), list(entry.get("notWith", [])), entry.get("keyVerse")))
        except KeyError as missing:
            raise BuildError(f"pairs.json entry {n}: missing field {missing}") from None
    return pairs


def check_story_text(pair: Pair, character: Character, passage_text: str) -> None:
    """Design 4.1 rules 1-3 and 6 for one story label."""
    where = f"pair {pair.who} / {pair.story!r}"
    check_label_shape(pair.story, where)
    first = pair.story.lstrip()[0]
    if first.isupper():
        word = bare(WORD.findall(pair.story)[0])
        if not re.search(rf"\b{re.escape(word)}", passage_text):
            raise BuildError(f"{where}: a story label starts in lower case unless it begins with a proper noun or a "
                             f"quotation, and {word!r} is not capitalised in {pair.ref}")
    own = {bare(w).lower() for w in WORD.findall(outside_quotes(pair.story))} & character.giveaways
    if own:
        raise BuildError(f"{where}: the story names its own character ({', '.join(sorted(own))})")
    for quote in quotations(pair.story):
        if plain(quote) not in plain(passage_text):
            raise BuildError(f"{where}: the quotation {quote!r} is not BSB wording in {pair.ref}")


def check_pair(pair: Pair, characters: dict[str, Character], sources: Sources) -> None:
    """Everything the design fails the build on for one pair; sets its key verse."""
    where = f"pair {pair.who} / {pair.story!r}"
    character = characters.get(pair.who)
    if character is None:
        raise BuildError(f"{where}: unknown who card {pair.who!r} (not in characters.json)")
    if pair.tier not in (1, 2, 3):
        raise BuildError(f"{where}: tier must be 1, 2 or 3, not {pair.tier!r}")
    unknown_decks = [d for d in pair.decks if d not in DECK_KEYS]
    if not pair.decks or unknown_decks:
        raise BuildError(f"{where}: decks must be some of {', '.join(DECK_KEYS)}; got {pair.decks!r}")
    verses = passage_verses(sources, pair.ref)
    text = " ".join(v[3] for v in verses)
    check_story_text(pair, character, text)
    pattern = re.compile(rf"(?<![A-Za-z]){re.escape(pair.check)}", re.IGNORECASE)
    if not pattern.search(text):
        raise BuildError(f"{where}: the check word {pair.check!r} is not in the BSB text of {pair.ref}")
    if pair.key_verse:
        parts = parse_ref(pair.key_verse)
        if len(parts) != 1 or parts[0].start != parts[0].end:
            raise BuildError(f"{where}: keyVerse {pair.key_verse!r} must be one verse")
        key = (parts[0].book, *parts[0].start)
        if key not in {(b, c, v) for b, c, v, _ in verses}:
            raise BuildError(f"{where}: keyVerse {pair.key_verse} lies outside the passage {pair.ref}")
    else:
        key = next((b, c, v) for b, c, v, words in verses if pattern.search(words))
    pair.key_book, pair.key_chapter, pair.key_number = key
    for other in pair.not_with:
        if other not in characters:
            raise BuildError(f"{where}: notWith names {other!r}, which is not a who card")
        if other == pair.who:
            raise BuildError(f"{where}: notWith names the pair's own character")


def symmetric_not_with(pairs: list[Pair]) -> dict[str, list[str]]:
    """Each pair's final notWith. A link is between two characters, whichever pair names it (design 6.1, "listing a
    link on one side is enough"), so every pair of either character carries the other."""
    links: dict[str, set[str]] = {}
    for pair in pairs:
        for other in pair.not_with:
            links.setdefault(pair.who, set()).add(other)
            links.setdefault(other, set()).add(pair.who)
    return {pair.id: sorted(links.get(pair.who, set())) for pair in pairs}


def check_shared_names(pairs: list[Pair], characters: dict[str, Character], not_with: dict[str, list[str]]) -> None:
    """Design 4.1 rule 4: a capitalised word in a story that is in another who label needs a notWith link."""
    for pair in pairs:
        names = capitalised_names(pair.story)
        for key, character in characters.items():
            shared = names & name_words(character.label)
            if key != pair.who and shared and key not in not_with[pair.id]:
                raise BuildError(f"pair {pair.who} / {pair.story!r}: {', '.join(sorted(shared))} is also in the who "
                                 f"card {character.label.replace(SHY, '')!r}; add {key!r} to its notWith")


def check_all(characters: dict[str, Character], pairs: list[Pair], sources: Sources) -> dict[str, list[str]]:
    seen = set()
    for pair in pairs:
        check_pair(pair, characters, sources)
        if (pair.who, pair.story) in seen:
            raise BuildError(f"pair {pair.who} / {pair.story!r} is listed twice")
        seen.add((pair.who, pair.story))
        pair.id = make_id(pair.who, pair.story)
    if len({p.id for p in pairs}) != len(pairs):
        raise BuildError("two pairs hash to the same id; reword one story")
    spec = [p for p in pairs if (p.who, p.story) == SPEC_PAIR]
    if not spec or spec[0].tier != 1:
        raise BuildError("the spec's pair, Daniel / the lions' den, must be in pairs.json at tier 1")
    not_with = symmetric_not_with(pairs)
    check_shared_names(pairs, characters, not_with)
    return not_with


def fame(pair: Pair, characters: dict[str, Character], sources: Sources) -> tuple[int, int]:
    """(question-bank count, mention count) for the person behind a pair; 0, 0 for a group or parable figure."""
    person = sources.people.get(characters[pair.who].person or "")
    return (sources.bank_counts.get(person["n"], 0), person.get("c", 0)) if person else (0, 0)


def deck_pools(pairs: list[Pair], characters: dict[str, Character], sources: Sources) -> list[dict]:
    """Design 4 and 8: per deck, the Easy top-up and which difficulties have enough characters to be offered."""
    decks = []
    for key, title in [(MIXED, "Mixed"), *DECKS]:
        members = [p for p in pairs if key == MIXED or key in p.decks]
        easy = [p for p in members if p.tier == 1]
        extra = []
        candidates = sorted((p for p in members if p.tier == 2),
                            key=lambda p: (*(-n for n in fame(p, characters, sources)), p.id))
        for pair in candidates:
            if len({p.who for p in easy + extra}) >= EASY_POOL_CHARACTERS:
                break
            if pair.who not in {p.who for p in easy + extra}:
                extra.append(pair)
        pools = {"easy": easy + extra, "medium": [p for p in members if p.tier <= 2], "hard": members}
        offered = {}
        for difficulty, pool in pools.items():
            enough = len({p.who for p in pool}) >= BOARD_PAIRS[difficulty] + 3
            if difficulty == "hard":
                enough = enough and len({p.who for p in pool if p.tier >= 2}) >= mm_build.HARD_DEEP_PAIRS
            offered[difficulty] = enough
        if key == MIXED and not all(offered.values()):
            raise BuildError(f"the Mixed deck must be offered at every difficulty; offered: {offered}")
        decks.append({"key": key, "title": title, "offered": offered, "easyExtra": [p.id for p in extra],
                      "_pools": pools})
    return decks


def document(characters: dict[str, Character], pairs: list[Pair], sources: Sources) -> tuple[dict, list[dict]]:
    """The shipped file (design 5.4) and the decks with their pools, for the review sheet."""
    not_with = check_all(characters, pairs, sources)
    decks = deck_pools(pairs, characters, sources)
    used = {p.who for p in pairs}
    shipped_characters = {}
    for key, c in characters.items():
        if key not in used:
            continue
        entry: dict = {"label": c.label, "href": c.href, "first": first_name(c.label)}
        if c.group:
            entry["group"] = True
        if c.parable:
            entry["parable"] = True
        shipped_characters[key] = entry
    shipped_pairs = [{
        "id": p.id, "who": p.who, "story": p.story, "tier": p.tier, "decks": p.decks, "ref": show_ref(p.ref),
        "readerHref": reader_href(sources, p.ref),
        "keyVerse": show_ref(f"{p.key_book} {p.key_chapter}:{p.key_number}"),
        "keyVerseId": verse_id(p.key_book, p.key_chapter, p.key_number),
        "words": content_words(p.story), "notWith": not_with[p.id],
    } for p in pairs]
    body = {"decks": [{k: v for k, v in d.items() if not k.startswith("_")} for d in decks],
            "characters": shipped_characters, "pairs": shipped_pairs}
    stamp = hashlib.sha1(json.dumps(body, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:12]
    head = {"about": "Memory match pairs. Generated by scripts/build-memory-match.py; do not edit.", "version": 1,
            "stamp": stamp}
    return {**head, **body}, decks
