"""The figures of the Chosen and kept page, checked: every drawn phrase is in its verse (whole words, exact case), every
sentence said to be the study's is in content.md, and every count is computed, not typed. Called by build-data.py."""
import json
import re

from scripture_text import BuildError, plain_text, verses_of


def plain(runs: list) -> str:
    return "".join(r if isinstance(r, str) else r.get("t", r.get("b", r.get("i", ""))) for r in runs)


def check(builder, study: dict, text: str, exact_in, typographic) -> dict:
    bible, lists = builder.bible, builder.lists
    flat = re.sub(r"\*+", "", text)

    def pin(label: str, words: str, what: str) -> dict:
        key = builder.passage(label)
        if not exact_in(words, label, bible):
            raise BuildError(f"{what}: {words!r} is not in {label}")
        return {"r": key, "label": builder.passages[key]["label"], "words": typographic(words)}

    def said(words: str, what: str) -> str:
        if words not in flat:
            raise BuildError(f"{what}: the study does not say {words!r}")
        return typographic(words)

    parts = {p["n"]: p for p in study["parts"]}
    close_text = " ".join(plain(b["runs"]) for b in study["close"]["blocks"] if b["k"] == "p")
    ids = [p["id"] for p in lists.PURPOSES]
    purposes = [{**p, "says": said(p["says"], f"purpose {p['id']}"), "misread": said(p["misread"], "misreading") if p["misread"] else None}
                for p in lists.PURPOSES]
    if set(lists.PURPOSE_OF_PART) != set(parts):
        raise BuildError("PURPOSE_OF_PART must name every part, and only the parts")
    purpose_of = {}
    for n, (kinds, sentence) in lists.PURPOSE_OF_PART.items():
        if not kinds or any(k not in ids for k in kinds):
            raise BuildError(f"part {n}: unknown purpose {kinds}")
        if typographic(sentence) not in close_text:
            raise BuildError(f"part {n}: the close does not say {sentence!r}")
        purpose_of[n] = {"kinds": kinds, "close": typographic(sentence)}
    if {k for v in purpose_of.values() for k in v["kinds"]} != set(ids):
        raise BuildError("every purpose must be the purpose of at least one part")

    # 01 Ephesians 1:3-14
    said(lists.STANZA_SENTENCE, "the three movements")
    stanzas = []
    for name, label in lists.STANZAS:
        if name.lower() not in lists.STANZA_SENTENCE.lower():
            raise BuildError(f"movement {name!r} is not named in the study's sentence")
        key = builder.passage(label)
        stanzas.append({"name": name, "r": key, "label": label, "verses": [cv for cv, _ in builder.passages[key]["verses"]]})
    whole = verses_of(bible, "Ephesians 1:3–14")[1]
    if [v for s in stanzas for v in s["verses"]] != [f"{c}:{v}" for c, v, _ in whole]:
        raise BuildError("the three movements must cover Ephesians 1:3-14 in order, with no gap or overlap")
    refrain = [pin(label, words, "refrain") for label, words in lists.REFRAIN]
    in_him = [{"cv": f"{c}:{v}", "words": m.group(0)} for c, v, words in whole for m in re.finditer(lists.IN_HIM, words)]

    # 02 Romans 8
    said(lists.CHAIN_SENTENCE, "the five links")
    chain = [{"verb": verb, **pin(label, words, "chain")} for verb, label, words in lists.CHAIN]
    if ", ".join(c["verb"] for c in chain) != lists.CHAIN_SENTENCE:
        raise BuildError("the chain's verbs must be the study's five, in its order")
    dangers = []
    for label, words in lists.DANGERS:
        dangers += [{"words": w, **{k: v for k, v in pin(label, w, "dangers").items() if k != "words"}} for w in words]
    love = pin(*lists.LOVE, "the love of God")

    # 03 Romans 9
    objections = []
    for item in lists.OBJECTIONS:
        ask = pin(item["ask_ref"], item["ask"], "objection") if item["ask_ref"] else {"words": said(item["ask"], "objection")}
        objections.append({"ask": ask, "answer": pin(*item["answer"], "answer")})
    if not any(b["k"] == "h3" and b["t"] == lists.READINGS_HEAD for b in parts["03"]["blocks"]):
        raise BuildError(f"part 03 has no sub-head {lists.READINGS_HEAD!r}")

    # 04 John 6 and 10
    for words in lists.HALVES_SENTENCE:
        said(words, "the two halves")
    halves = [{"side": side, **pin(label, words, "John 6:37 half")} for side, label, words in lists.HALVES]
    said(lists.HANDS_SENTENCE, "the two hands")
    hands = [{"name": name, **pin(label, words, "hand")} for name, label, words in lists.HANDS]
    held = pin(*lists.HELD, "held")

    # 05 Hebrews 6
    rain = pin(*lists.RAIN, "rain")
    fields = [{"name": f["name"], "grows": pin(f["ref"], f["grows"], "field"), "end": pin(f["ref"], f["end"], "field")} for f in lists.FIELDS]
    turn = pin(*lists.TURN, "the turn")
    views = next((b for b in parts["05"]["blocks"] if b["k"] == "ol"), None)
    if not views or len(views["items"]) != 4:
        raise BuildError("part 05 must list four readings of Hebrews 6")
    other = [i for i, item in enumerate(views["items"]) if lists.OTHER_TRADITION in plain(item)]
    if len(other) != 1:
        raise BuildError(f"exactly one of part 05's readings must name the {lists.OTHER_TRADITION} tradition")
    if "Christians read these verses in four main ways" not in flat:
        raise BuildError("part 05 must say it lists four ways")

    # 06 1 John 5
    ground = [{"head": said(g["head"], "assurance"), "lines": [pin(label, words, "assurance") for label, words in g["lines"]]} for g in lists.GROUND]
    said(lists.GROUND_NOTE, "signs, not the price")
    purpose_line = pin(*lists.PURPOSE_LINE, "1 John 5:13")

    # 07 Mark 3
    first = [{"name": name, **pin(label, words, "Mark 3")} for name, label, words in lists.FIRST]
    restored = [{"name": name, **pin(label, words, "restored")} for name, label, words in lists.RESTORED]
    seven = " ".join(plain(b.get("runs", [])) for b in parts["07"]["blocks"])
    for item in restored:
        if item["name"] not in seven:
            raise BuildError(f"part 07 does not name {item['name']}")

    # The close: fears and the promises that answer them
    fears = []
    for fear in lists.FEARS:
        part = parts.get(fear["part"])
        if not part:
            raise BuildError(f"fear: no part {fear['part']}")
        words = said(fear["says"], "fear")
        in_part = " ".join(plain(b.get("runs", [])) for b in part["blocks"]) + plain(part["reflect"]) + plain(part["consider"])
        if words not in in_part:
            raise BuildError(f"fear {fear['says']!r} is not in part {fear['part']}")
        promise = pin(*fear["promise"], "promise")
        if not covers(builder, part, promise["r"]):
            raise BuildError(f"fear {fear['says']!r}: part {fear['part']} never cites {fear['promise'][0]}")
        fears.append({"part": fear["part"], "says": words, "promise": promise})

    readings = [r for p in study["parts"] for r in p["readings"]]
    if len(readings) != lists.READINGS_CLAIMED or "The study walks eight passages" not in flat:
        raise BuildError(f"eight passages: the study must say 'The study walks eight passages', READINGS_CLAIMED must be 8 "
                         f"(it is {lists.READINGS_CLAIMED}), and parts 01-07 must have 8 main readings (they have {len(readings)})")
    secs = [builder.passages[r]["sec"] for r in readings]
    one_promise = sorted({f["part"] for f in fears if f["promise"]["r"] == "JHN.6.37"})
    numbers = {"readings": len(readings), "letters": secs.count("epistles"), "gospels": secs.count("gospels"),
               "purposes": len(purposes), "fears": len(fears), "inHim": len(in_him), "inHimVerses": len({h["cv"] for h in in_him}),
               "dangers": len(dangers), "johnSixPromise": len(one_promise)}
    return {"purposes": purposes, "purposeOf": purpose_of, "stanzas": stanzas, "refrain": refrain, "inHim": in_him,
            "chain": chain, "dangers": dangers, "love": love, "objections": objections, "halves": halves, "hands": hands,
            "held": held, "rain": rain, "fields": fields, "turn": turn, "otherView": other[0], "ground": ground,
            "purposeLine": purpose_line, "first": first, "restored": restored, "fears": fears,
            "sec": {p["n"]: builder.passages[p["readings"][0]]["sec"] for p in study["parts"]}, "numbers": numbers}


def covers(builder, part: dict, key: str) -> bool:
    """The part cites, prints or reads a passage that holds the one verse `key` names."""
    book, verse = builder.passages[key]["label"].rsplit(" ", 1)
    cited = set(re.findall(r'"r": "([^"]+)"', json.dumps(part, ensure_ascii=False))) | set(part["readings"])
    return any(builder.passages[k]["label"].rsplit(" ", 1)[0] == book and verse in [cv for cv, _ in builder.passages[k]["verses"]]
               for k in cited)
