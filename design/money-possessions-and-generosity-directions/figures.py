"""Figures for the Money, possessions and generosity page, built and proved from study_lists.py. Each figure's words
are checked against the Berean or against the study's own text, so a figure cannot say what its source does not."""
import re

from scripture_text import BuildError, fold, has_words

YOU_WORDS = {"you", "your", "yours"}
WE_WORDS = {"i", "me", "my", "we", "us", "our"}


def clean(text: str) -> str:
    """Words only, for searching the study's own prose: markdown, curly quotes and spacing do not count."""
    text = fold(text).replace("*", "").replace('"', "").replace("'", "")
    return " ".join(text.split())


def section_texts(text: str) -> dict:
    """Each section of content.md (opening, 01–07, each question id, close) → its plain prose."""
    sections, name, lines = {}, "opening", []
    for line in text.splitlines():
        head = re.match(r"## (?:Question ([a-z]+):|(\d\d) |(Close):)", line)
        if head:
            sections[name] = clean(" ".join(lines))
            name, lines = (head.group(1) or head.group(2) or "close").lower(), []
        else:
            lines.append(line)
    sections[name] = clean(" ".join(lines))
    return sections


def prove_words(builder, phrase: str, source: str, sections: dict, what: str) -> str | None:
    """A phrase is either in its verse (source is a reference) or in the study's text for that section. Returns the
    verse key, or None for the study's own words."""
    if source in sections:
        if clean(phrase) not in sections[source]:
            raise BuildError(f"{what}: {phrase!r} is not the study's own words in section {source}")
        return None
    key = builder.passage(source)
    if not has_words(fold(phrase).replace('"', "").replace("'", ""), builder.text_of(key).replace("'", "")):
        raise BuildError(f"{what}: {phrase!r} is not in {source}")
    return key


def address(builder, lists, item: dict, sections: dict, what: str) -> list:
    """An address card's lines, each field proved: [field, label, words, verse key or None]."""
    lines = []
    for field in lists.ADDRESS_FIELDS:
        if field in item:
            words, source = item[field]
            lines.append([field, lists.ADDRESS_FIELDS[field], words, prove_words(builder, words, source, sections, f"{what} {field}")])
    if not lines:
        raise BuildError(f"{what}: an address with no lines")
    return lines


def heard(builder, lists, sections: dict) -> list:
    """00: lines often heard without their setting. The line, how it is heard, and its address."""
    rows = []
    for item in lists.HEARD:
        key = prove_words(builder, item["line"], item["ref"], sections, f"heard {item['ref']}")
        prove_words(builder, item["heard"][0], item["heard"][1], sections, f"heard {item['ref']} (how it is heard)")
        rows.append({"r": key, "label": item["ref"], "line": item["line"], "heard": item["heard"][0],
                     "section": item["section"], "part": item.get("part"), "lines": address(builder, lists, item, sections, f"heard {item['ref']}")})
    return rows


def part_addresses(builder, lists, study: dict, sections: dict) -> dict:
    numbers = [p["n"] for p in study["parts"]]
    if sorted(lists.PART_ADDRESS) != numbers:
        raise BuildError(f"PART_ADDRESS covers parts {sorted(lists.PART_ADDRESS)}; the study has {numbers}")
    return {n: {"section": item["section"], "lines": address(builder, lists, item, sections, f"part {n} address")}
            for n, item in lists.PART_ADDRESS.items()}


def order(builder, lists) -> dict:
    """01: the gifts of Deuteronomy 8:12–13 come first, in this order, and then the proud heart (8:14)."""
    spec = lists.ORDER
    text = builder.text_of(builder.passage(spec["ref"])).replace("'", "")
    at = -1
    for step in spec["steps"]:
        found = re.search(r"(?<!\w)" + re.escape(fold(step["words"])) + r"(?!\w)", text[at + 1:])
        if not found:
            raise BuildError(f"Deuteronomy 8 order: {step['words']!r} is not in {spec['ref']} after the step before it")
        at += 1 + found.start()
    turn = spec["steps"].index(next(s for s in spec["steps"] if s["kind"] == "heart"))
    if any(s["kind"] != "gift" for s in spec["steps"][:turn]) or any(s["kind"] != "heart" for s in spec["steps"][turn:]):
        raise BuildError("Deuteronomy 8 order: every gift must come before the heart's steps")
    heart_verse = builder.text_of(builder.passage(spec["turn_ref"])).replace("'", "")
    for step in spec["steps"]:  # the heart's steps are the words of 8:14, which opens "then"; the gifts are not
        if has_words(fold(step["words"]), heart_verse) != (step["kind"] == "heart"):
            raise BuildError(f"Deuteronomy 8 order: {step['words']!r} is marked {step['kind']}, but the heart's steps are exactly those in {spec['turn_ref']}")
    return {"r": builder.passage(spec["ref"]), "label": spec["ref"], "steps": spec["steps"], "read": spec["read"]}


def yours(builder, lists) -> dict:
    """02: in David's prayer, the words that address God against the words for the givers, counted by script."""
    spec = lists.YOURS
    key = builder.passage(spec["ref"])
    verses, you, we = [], 0, 0
    for cv, text in builder.passages[key]["verses"]:
        words = re.findall(r"[A-Za-z]+", fold(text).replace("'", ""))
        marks = ["y" if w.lower() in YOU_WORDS else "w" if w.lower() in WE_WORDS else "" for w in words]
        you, we = you + marks.count("y"), we + marks.count("w")
        verses.append({"v": cv, "y": marks.count("y"), "w": marks.count("w")})
    if (you > we) != spec["more_you"]:
        raise BuildError(f"David's prayer: {you} words for God and {we} for the givers, but YOURS says more_you={spec['more_you']}")
    return {"r": key, "label": spec["ref"], "verses": verses, "you": you, "we": we}


def tithe_years(builder, lists, sections: dict) -> dict:
    """03: the six years of the rabbis' count, from the study's words, and the four named guests in 14:29."""
    spec = lists.TITHE
    prove_words(builder, spec["poor_years"], "03", sections, "tithe years")
    prove_words(builder, spec["three"][0], spec["three"][1], sections, "tithe years")
    years = []
    for year in range(1, 7):
        kind = "poor" if year in spec["poor"] else "feast"
        years.append({"year": year, "kind": kind})
    if [y["year"] for y in years if y["kind"] == "poor"] != [3, 6]:
        raise BuildError("tithe years: the study names the third and sixth years for the poor")
    guests = []
    for guest in spec["guests"]:
        prove_words(builder, guest["word"], spec["guests_ref"], sections, "the guests of Deuteronomy 14:29")
        guests.append(guest)
    for kind, (words, ref) in spec["places"].items():
        prove_words(builder, words, ref, sections, f"tithe years ({kind})")
    return {"years": years, "guests": guests, "guestsRef": builder.passage(spec["guests_ref"]), "places": spec["places"],
            "threeRef": builder.passage(spec["three"][1]), "three": spec["three"][0]}


def bills(builder, lists) -> list:
    """05: the two bills the manager rewrites, each number in its verse."""
    rows = []
    for bill in lists.BILLS:
        for words in (bill["was_words"], bill["now_words"]):
            prove_words(builder, words, bill["ref"], {}, "Luke 16 bills")
        if not 0 < bill["now"] < bill["was"]:
            raise BuildError(f"Luke 16 bills: {bill['what']} must be cut, {bill['was']} to {bill['now']}")
        rows.append({**bill, "r": builder.passage(bill["ref"])})
    return rows


def reversal(builder, lists) -> dict:
    """06: Luke 16:25's four phrases, and the gate thread back to Deuteronomy 14."""
    spec = lists.REVERSAL
    for row in spec["rows"]:
        for words in (row["then"], row["now"]):
            prove_words(builder, words, spec["ref"], {}, "Luke 16:25 reversal")
    thread = []
    for step in lists.GATE:
        thread.append({**step, "r": prove_words(builder, step["words"], step["ref"], {}, "the gate thread")})
    return {"r": builder.passage(spec["ref"]), "label": spec["ref"], "rows": spec["rows"], "gate": thread}


def coins(builder, lists) -> dict:
    spec = lists.COINS
    for side in spec["sides"]:
        prove_words(builder, side["words"], spec["ref"], {}, "Mark 12 coins")
    prove_words(builder, spec["gift"], spec["gift_ref"], {}, "Mark 12 coins")
    return {**spec, "r": builder.passage(spec["ref"]), "giftR": builder.passage(spec["gift_ref"])}


def way(lists, sections: dict) -> list:
    """The close: the habit's steps, each the study's own words in its Way paragraph, in order."""
    text, at = sections["close"], -1
    for step in lists.WAY_STEPS:
        found = text.find(clean(step["words"]), at + 1)
        if found < 0:
            raise BuildError(f"the habit's step {step['words']!r} is not in the close's Way paragraph after the step before it")
        at = found
    return lists.WAY_STEPS


def build_figures(builder, lists, study: dict, text: str) -> dict:
    sections = section_texts(text)
    return {"heard": heard(builder, lists, sections), "address": part_addresses(builder, lists, study, sections),
            "order": order(builder, lists), "yours": yours(builder, lists), "tithe": tithe_years(builder, lists, sections),
            "bills": bills(builder, lists), "reversal": reversal(builder, lists), "coins": coins(builder, lists),
            "way": way(lists, sections), "sections": lists.SECTION_NAMES}
