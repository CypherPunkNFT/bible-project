"""The checks behind every figure the Sexuality, singleness and divorce page draws beside the study's text. Each phrase
in study_lists.py must be in its verse, each order must be the verse's own order, and each count is made from the
Berean on every build. Called by build-data.py; raises BuildError on the first thing that does not hold."""
import re

from scripture_text import BOOKS, BuildError, ref_id

import study_lists as L


def check_drawn(builder, study: dict, text: str, words, phrase_in) -> dict:
    def verse(label: str) -> str:
        return builder.verse_words([builder.passage(label)])[0]

    def need(phrase: str, label: str, what: str) -> None:
        if not phrase_in(phrase, verse(label)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")

    def in_order(label: str, phrases: list, what: str) -> None:
        body, position = verse(label), -1
        for phrase in phrases:
            found = body.find(words(phrase), position + 1)
            if found < 0 and words(phrase) in body:
                raise BuildError(f"{what}: {phrase!r} does not come after the phrase before it in {label}")
            if found < 0:
                raise BuildError(f"{what}: {phrase!r} is not in {label}")
            if found <= position:
                raise BuildError(f"{what}: {phrase!r} does not come after the phrase before it in {label}")
            position = found

    for line in L.MOTTO["lines"]:
        need(line, L.MOTTO["ref"], "motto")
    for label, phrase in L.LORD_I:
        need(phrase, label, "part 06's command and counsel")
    in_order(L.EUNUCHS["ref"], [t for t, _ in L.EUNUCHS["kinds"]], "part 04's three kinds")
    for label, phrase in L.DRY_TREE:
        need(phrase, label, "part 04's dry tree")
    in_order(L.WASHED["ref"], L.WASHED["verbs"], "part 03's three verbs")
    numbers = [p["n"] for p in study["parts"]]
    return {"motto": {**L.MOTTO, "r": builder.passage(L.MOTTO["ref"])},
            "turns": turns(builder, numbers, need, in_order, words),
            "margin": margin(builder, numbers, need),
            "remembered": remembered(builder, need),
            "song": song(builder),
            "eunuchs": {"r": builder.passage(L.EUNUCHS["ref"]), "kinds": [{"t": t, "plain": p} for t, p in L.EUNUCHS["kinds"]],
                        "dry": [{"t": t, "r": builder.passage(label)} for label, t in L.DRY_TREE]},
            "washed": {**L.WASHED, "r": builder.passage(L.WASHED["ref"])},
            "case": case(builder, need),
            "orderPermitted": order_permitted(builder, verse, need, phrase_in),
            "accounts": accounts(builder, verse, phrase_in),
            "lordI": [{"t": t, "r": builder.passage(label)} for label, t in L.LORD_I],
            "agree": agree(study, text, words),
            "views": views(study)}


def turns(builder, numbers: list, need, in_order, words) -> dict:
    """Matthew 19:3–12 in seven turns, in the passage's own order; "from the beginning" counted in the passage."""
    passage = builder.passage(L.TURNS_PASSAGE)
    in_order(L.TURNS_PASSAGE, [turn["t"] for turn in L.TURNS], "the conversation")
    out = []
    for turn in L.TURNS:
        need(turn["t"], turn["ref"], f"turn {turn['ref']}")
        if not set(turn["parts"]) <= set(numbers):
            raise BuildError(f"turn {turn['ref']} leads to parts {turn['parts']}, but the study has {numbers}")
        out.append({**turn, "r": builder.passage(turn["ref"]),
                    "back": [{"t": t, "r": builder.passage(label)} for label, t in L.GROUND if label.split(":")[0] in turn.get("back", "")]
                    if "back" in turn else []})
    count = builder.verse_words([passage])[0].count(words("from the beginning"))
    if count != sum(1 for turn in L.TURNS if "back" in turn):
        raise BuildError(f"the conversation says 'from the beginning' {count} times, but {sum('back' in t for t in L.TURNS)} turns are drawn going back")
    for label, phrase in L.GROUND:
        need(phrase, label, "the ground line")
    return {"r": passage, "items": out, "fromBeginning": count,
            "ground": [{"t": t, "r": builder.passage(label)} for label, t in L.GROUND]}


def margin(builder, numbers: list, need) -> dict:
    if sorted(L.MARGIN) != numbers:
        raise BuildError(f"the three-question rule needs one entry per part: entries {sorted(L.MARGIN)}, parts {numbers}")
    out = {}
    for n, row in L.MARGIN.items():
        for key in ("beginning", "holiness", "grace"):
            need(row[key][1], row[key][0], f"part {n}, {key}")
        who, label, asked = row["asked"]
        need(asked, label, f"part {n}, asked first")
        out[n] = {key: {"t": row[key][1], "r": builder.passage(row[key][0])} for key in ("beginning", "holiness", "grace")}
        out[n]["asked"] = {"who": who, "t": asked, "r": builder.passage(label)}
    return out


def verse_ids(builder, label: str) -> set:
    return {f"{ref_id(label).split('.')[0]}.{cv}" for cv, _ in builder.passages[builder.passage(label)]["verses"]}


def remembered(builder, need) -> dict:
    """Every verse in the Berean with "one flesh" must be Genesis 2:24 or inside a passage the drawing lists."""
    listed = [L.REMEMBERED["source"], *[p["ref"] for p in L.REMEMBERED["places"]], *L.REMEMBERED["also"]]
    for label in listed:
        need("one flesh", label, "one verse remembered")
    found = {f"{code}.{cv}" for code in BOOKS.values() for cv, t in builder.bible[code].items() if "one flesh" in t}
    allowed = set().union(*(verse_ids(builder, label) for label in listed))
    if not found <= allowed:
        raise BuildError(f"one verse remembered: 'one flesh' is also in {sorted(found - allowed)}, which the drawing does not list")
    return {"source": builder.passage(L.REMEMBERED["source"]), "verses": len(found),
            "places": [{**p, "r": builder.passage(p["ref"])} for p in L.REMEMBERED["places"]]}


def song(builder) -> dict:
    """The Song of Songs as a strip of its verses, with the verses holding each refrain found by search."""
    book = builder.bible[BOOKS["Song of Songs"]]
    keys = sorted((tuple(map(int, k.split(":"))) for k in book))
    chapters = {}
    for c, v in keys:
        chapters[c] = max(chapters.get(c, 0), v)
    marks = {}
    for name, spec in L.SONG.items():
        hits = [f"{c}:{v}" for c, v in keys if re.search(spec["pattern"], book[f"{c}:{v}"])]
        if hits != spec["expect"]:
            raise BuildError(f"the Song's {name}: found in {hits}, the drawing says {spec['expect']}")
        marks[name] = {"label": spec["label"], "at": [{"cv": cv, "r": builder.passage(f"Song of Songs {cv}")} for cv in hits]}
    return {"chapters": [chapters[c] for c in sorted(chapters)], "verses": len(keys), "marks": marks}


def case(builder, need) -> list:
    out, last = [], 0
    for label, word, first, second in L.CASE:
        need(first, label, "the case in Deuteronomy 24")
        if second:
            need(second, label, "the case in Deuteronomy 24")
        verse_number = int(label.rsplit(":", 1)[1])
        if verse_number != last + 1:
            raise BuildError(f"the case in Deuteronomy 24 skips or repeats a verse at {label}")
        last = verse_number
        out.append({"word": word, "t": first, "then": second, "r": builder.passage(label)})
    return out


def order_permitted(builder, verse, need, phrase_in) -> list:
    """They asked why Moses would "order"; Jesus says "permitted". Each word is in its own verse and not in the other."""
    (_, label_a, word_a), (_, label_b, word_b) = L.ORDER_PERMITTED
    need(word_a, label_a, "order and permitted")
    need(word_b, label_b, "order and permitted")
    if phrase_in(word_a, verse(label_b)) or phrase_in(word_b, verse(label_a)):
        raise BuildError("order and permitted: the two words must each stand in one verse only")
    return [{"who": who, "t": word, "r": builder.passage(label)} for who, label, word in L.ORDER_PERMITTED]


def accounts(builder, verse, phrase_in) -> dict:
    items = [{"r": builder.passage(label), "label": label, "except": phrase_in(L.EXCEPTION, verse(label))} for label in L.ACCOUNTS]
    with_exception = [i["label"] for i in items if i["except"]]
    if not with_exception or not all(label.startswith("Matthew") for label in with_exception):
        raise BuildError(f"the page says the exception stands only in Matthew; search finds it in {with_exception}")
    return {"items": items, "withException": len(with_exception), "phrase": L.EXCEPTION}


def agree(study: dict, text: str, words) -> list:
    raw = words(next(p for p in re.split(r"\n## ", text) if p.startswith("06 ")))
    for phrase in L.AGREE:
        if words(phrase) not in raw:
            raise BuildError(f"what all four views agree on: {phrase!r} is not in part 06's own words")
    return L.AGREE


def views(study: dict) -> int:
    part = next(p for p in study["parts"] if p["n"] == "06")
    count = sum(len(b["items"]) for s in [{"blocks": part["hook"]}, *part["subs"]] for b in s["blocks"] if b["k"] == "views")
    if count != 4:
        raise BuildError(f"part 06 should set out four views, found {count}")
    return count
