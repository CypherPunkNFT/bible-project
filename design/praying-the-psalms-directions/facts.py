"""The counts The book of Psalms states, recomputed from the Berean, and the figures the page draws beside the text.
Nothing here is typed in: each number is counted, and each phrase a figure shows is checked in its verse."""
import re

from scripture_text import BuildError, fold, has_words, plain_text
import study_lists as lists


def compute(bible: dict, psalms: list, stanzas: list) -> dict:
    named = lambda who: sorted(p["n"] for p in psalms if who in p["named"])  # noqa: E731
    chapters = {code: len({key.split(":")[0] for key in bible[code]}) for code in bible}
    sizes = {}
    for code in bible:
        for key in bible[code]:
            sizes[(code, key.split(":")[0])] = sizes.get((code, key.split(":")[0]), 0) + 1
    longest = max(sizes.items(), key=lambda pair: pair[1])
    frame = [p["n"] for p in psalms[-5:] if p["first"].startswith("Hallelujah!") and plain_text(bible, f"Psalm {p['n']}:{p['verses']}").endswith("Hallelujah!")]
    counts = {p["n"]: len(p["cited"]) for p in psalms}
    return {
        "most_chapters": max(chapters, key=chapters.get) == "PSA" and sorted(chapters.values())[-2] < chapters["PSA"],
        "hallelujah_frame": frame,
        "book1_unheaded": [p["n"] for p in psalms if p["book"] == 1 and not p["heading"]],
        "headed": sum(1 for p in psalms if p["heading"]),
        "David": len(named("David")), "Asaph": named("Asaph"), "sons of Korah": named("sons of Korah"),
        "Solomon": named("Solomon"), "Moses": named("Moses"), "Heman_Ethan": sorted(named("Heman") + named("Ethan")),
        "events": sum(1 for n in lists.EVENTS if "David" in psalms[n - 1]["named"]),
        "choirmaster": sum(1 for p in psalms if "For the choirmaster" in p["heading"]),
        "ascents": [p["n"] for p in psalms if "A song of ascents" in p["heading"]],
        "acrostics": [p["n"] for p in psalms if p["acrostic"]],
        "longest_119": longest[0] == ("PSA", "119"),
        "stanzas_119": len(stanzas) if psalms[118]["verses"] == 176 else 0,
        "cited_psalms": sum(1 for c in counts.values() if c),
        "cited_118": counts[118], "cited_110": counts[110], "cited_16": counts[16],
        "cited_five": sorted(n for n, c in counts.items() if c == 5),
    }


def check_claims(bible: dict, psalms: list, text: str, stanzas: list) -> dict:
    """Every count the text states must still be in the text, word for word, and must equal the count made now."""
    facts = compute(bible, psalms, stanzas)
    for claim in lists.CLAIMS:
        if claim["says"] not in text:
            raise BuildError(f"the study no longer says {claim['says']!r}; update CLAIMS in study_lists.py")
        if facts[claim["fact"]] != claim["value"]:
            raise BuildError(f"the study says {claim['says']!r}, but the Berean gives {facts[claim['fact']]!r}")
    for n in lists.EVENTS:
        if "David" not in psalms[n - 1]["named"]:
            raise BuildError(f"Psalm {n} is listed as a day in David's life, but its heading does not name David")
    return facts


def in_verse(bible: dict, label: str, words: str, where: str) -> None:
    if not has_words(fold(words).replace('"', ""), plain_text(bible, label)):
        raise BuildError(f"{where}: {words!r} is not in {label}")


def closings(builder, bible: dict, psalms: list) -> list:
    books = []
    for book in range(1, 6):
        members = [p["n"] for p in psalms if p["book"] == book]
        label = lists.CLOSINGS[book - 1]
        number = int(re.match(r"Psalm (\d+):", label).group(1))
        if number != members[-1]:
            raise BuildError(f"{label} is given as the close of Book {book}, but that book ends with Psalm {members[-1]}")
        needed = "hallelujah" if book == 5 else "blessed be"
        if needed not in plain_text(bible, label).lower():
            raise BuildError(f"the close of Book {book}, {label}, should hold {needed!r}")
        books.append({"n": book, "first": members[0], "last": members[-1], "closing": builder.passage(label),
                      "text": plain_text(bible, label)})
    return books


def extras(builder, bible: dict, psalms: list, stanzas: list) -> dict:
    """The figures beside the text: the five closings, the gate, Psalm 13, Psalm 119's stanzas, the most quoted."""
    gate = lists.GATE
    for label, words in (gate["open"], gate["close"]):
        in_verse(bible, label, words, "the gate")
    for _, words in gate["steps"]:
        in_verse(bible, "Psalm 1:1", words, "the gate's steps")
    shape = []
    for stage in lists.PSALM_13:
        in_verse(bible, stage["ref"], stage["words"], "Psalm 13's shape")
        shape.append({**stage, "r": builder.passage(stage["ref"])})
    if [s["ref"] for s in lists.PSALM_13] != ["Psalm 13:1–2", "Psalm 13:3–4", "Psalm 13:5–6"] or psalms[12]["verses"] != 6:
        raise BuildError("Psalm 13's three movements must cover its six verses in order")
    letters = [{"letter": letter, "first": first, "last": last, "r": builder.passage(f"Psalm 119:{first}–{last}")} for letter, first, last in stanzas]
    ranked = sorted((p for p in psalms if len(p["cited"]) >= 3), key=lambda p: (-len(p["cited"]), p["n"]))
    groups = {
        "books": [{"id": "gate", "label": "The gate", "psalms": [p["n"] for p in psalms[:2] if not p["heading"]]}]
        + [{"id": f"b{b['n']}", "label": f"Book {'I II III IV V'.split()[b['n'] - 1]}", "psalms": list(range(b["first"], b["last"] + 1))} for b in closings(builder, bible, psalms)],
        "writers": [{"id": w.split()[-1].lower(), "label": w[:1].upper() + w[1:], "psalms": [p["n"] for p in psalms if w in p["named"]]} for w in ("David", "Asaph", "sons of Korah", "Solomon", "Moses", "Heman", "Ethan")]
        + [{"id": "unnamed", "label": "Heading, no name", "psalms": [p["n"] for p in psalms if p["heading"] and not p["named"]]},
           {"id": "none", "label": "No heading", "psalms": [p["n"] for p in psalms if not p["heading"]]}],
        "marks": [{"id": "ascents", "label": "A song of ascents", "psalms": [p["n"] for p in psalms if "A song of ascents" in p["heading"]]},
                  {"id": "events", "label": "A day in David's life", "psalms": list(lists.EVENTS)},
                  {"id": "acrostic", "label": "An alphabet poem", "psalms": [p["n"] for p in psalms if p["acrostic"]]},
                  {"id": "hallelujah", "label": "Opens and closes with Hallelujah", "psalms": [146, 147, 148, 149, 150]}],
        "nt": [{"id": "many", "label": "5 or more passages", "psalms": [p["n"] for p in psalms if len(p["cited"]) >= 5]},
               {"id": "some", "label": "2 to 4 passages", "psalms": [p["n"] for p in psalms if 2 <= len(p["cited"]) <= 4]},
               {"id": "one", "label": "1 passage", "psalms": [p["n"] for p in psalms if len(p["cited"]) == 1]}],
    }
    return {
        "books": closings(builder, bible, psalms),
        "groups": groups,
        "gate": {"open": [builder.passage(gate["open"][0]), gate["open"][1]], "close": [builder.passage(gate["close"][0]), gate["close"][1]], "steps": gate["steps"]},
        "psalm13": shape,
        "stanzas": letters,
        "ranked": [{"n": p["n"], "count": len(p["cited"])} for p in ranked],
        "events": [{"n": n, "heading": psalms[n - 1]["heading"]} for n in lists.EVENTS],
        "numbers": {"psalms": len(psalms), "books": 5, "headed": sum(1 for p in psalms if p["heading"]),
                    "cited": sum(1 for p in psalms if p["cited"]), "pairs": sum(len(p["cited"]) for p in psalms),
                    "verses": sum(p["verses"] for p in psalms), "longest": psalms[118]["verses"], "shortest": min(p["verses"] for p in psalms)},
        "reader": "/read/bsb/PSA/",
    }
