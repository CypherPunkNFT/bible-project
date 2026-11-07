"""The figures the Fear, anxiety and despair page draws beside the study's text. Every phrase is checked in its verse,
and every count and distance is computed from the Berean, never typed. Called by build-data.py."""
import re

import study_lists as L
from scripture_text import BOOKS, REF_RE, BuildError


def position(bible: dict, label: str) -> tuple:
    """(book code, index of the reference's first verse in the book's own order)."""
    name, c, v = REF_RE.fullmatch(label).groups()[:3]
    code = BOOKS[name]
    keys = sorted(tuple(map(int, k.split(":"))) for k in bible[code])
    return code, keys.index((int(c), int(v)))


def distance(bible: dict, start: str, end: str) -> int:
    """How many verses later `end` comes than `start`, in reading order. Both must be in the same book."""
    (code_a, a), (code_b, b) = position(bible, start), position(bible, end)
    if code_a != code_b or b < a:
        raise BuildError(f"distance from {start} to {end}: the second must follow the first in the same book")
    return b - a


def rows(builder) -> list:
    out = []
    for row in L.ROWS:
        cry = builder.require(row["cry_ref"], row["cry"], f"row {row['who']}, the cry")
        if row["next_ref"]:
            nxt = builder.require(row["next_ref"], row["next"], f"row {row['who']}, what comes next")
            gap = distance(builder.bible, row["cry_ref"], row["next_ref"])
            chapters = int(row["next_ref"].split(" ")[-1].split(":")[0]) - int(row["cry_ref"].split(" ")[-1].split(":")[0])
        else:
            nxt = builder.require(row["end"], row["next"], f"row {row['who']}, the last line")
            gap, chapters = distance(builder.bible, row["cry_ref"], row["end"]), 0
            name, chapter, verse = REF_RE.fullmatch(row["end"]).groups()[:3]
            if max(int(k.split(":")[1]) for k in builder.bible[BOOKS[name]] if k.split(":")[0] == chapter) != int(verse):
                raise BuildError(f"row {row['who']}: {row['end']} is not the last verse of its chapter")
        out.append({**{k: row[k] for k in ("id", "who", "part", "cry", "next", "actor")}, "cr": cry, "nr": nxt,
                    "gap": gap, "chapters": chapters, "turns": row["next_ref"] is not None})
    if [r["gap"] for r in out if r["id"] == "david"] != [0]:
        raise BuildError("Psalm 56:3 holds the fear and the trust in one verse; its distance must be 0")
    return out


def match(builder) -> dict:
    M = L.MATCH
    for said, answer in M["pairs"]:
        builder.require(M["cry"], said, "part 01, Moses' words")
        builder.require(M["answer"], answer, "part 01, God's answer")
    return {"cry": builder.passage(M["cry"]), "answer": builder.passage(M["answer"]), "pairs": [list(p) for p in M["pairs"]]}


def care(builder, bible: dict) -> list:
    steps = [{"r": builder.require(label, phrase, f"part 02, {name}"), "t": phrase, "name": name} for label, phrase, name in L.CARE]
    order = [position(bible, label)[1] for label, _, _ in L.CARE]
    if order != sorted(order):
        raise BuildError("part 02: the steps of God's care must be in the order the verses tell them")
    return steps


def swing(builder) -> dict:
    S = L.SWING
    rng = builder.passage(S["range"])
    marks = {label.split(":")[1]: {"r": builder.require(label, phrase, "part 03, Jeremiah"), "t": phrase, "name": name} for label, phrase, name in S["marks"]}
    verses = [{"v": cv.split(":")[1], **marks.get(cv.split(":")[1], {})} for cv, _ in builder.passages[rng]["verses"]]
    if "17" in marks:
        raise BuildError("part 03: Jeremiah 20:17 is deliberately not quoted (safe messaging); it may not be marked")
    if distance(builder.bible, *S["adjacent"]) != 1:
        raise BuildError("part 03: the praise and the curse must be neighbouring verses")
    return {"r": rng, "verses": verses}


def refrain(builder, phrase_in, words) -> dict:
    R, D = L.REFRAIN, L.DARK
    rng = builder.passage(R["range"])
    found = [cv for cv, text in builder.passages[rng]["verses"] if phrase_in(R["words"], words(text))]
    if len(found) != R["times"]:
        raise BuildError(f"part 04: the refrain comes {len(found)} times in {R['range']}, not {R['times']}")
    dark = builder.passage(D["range"])
    trust = [{"r": builder.require(label, phrase, "part 04, Psalm 88"), "t": phrase, "v": label.split(" ")[1]} for label, phrase in D["trust"]]
    return {"r": rng, "refrain": found, "words": R["words"], "dark": dark, "trust": trust}


def though(builder) -> dict:
    T = L.THOUGH
    key = builder.require(T["ref"], T["lead"], "part 05, Psalm 46")
    for clause in T["clauses"]:
        builder.require(T["ref"], clause, "part 05, Psalm 46")
    words_, refs = T["refrain"]
    label, fear, trust = T["afraid"]
    return {"r": key, "lead": T["lead"], "clauses": T["clauses"],
            "refrain": {"t": words_, "rs": [builder.require(r, words_, "part 05, refrain") for r in refs]},
            "afraid": {"r": builder.require(label, f"{fear}, {trust}", "part 05, Psalm 56"), "fear": fear, "trust": trust}}


def reasons(builder, words) -> dict:
    R = L.REASONS
    items = []
    for label, command, reason in R["items"]:
        items.append({"r": builder.require(label, f"{command} {reason}", "part 06, a command and its reason"), "command": command, "reason": reason})
    total = 0
    for rng in R["ranges"]:
        text = words(" ".join(t for _, t in builder.passages[builder.passage(rng)]["verses"]))
        total += len(re.findall(r" do not (?:fear|be afraid) ", text))
    if total != len(items):
        raise BuildError(f"part 06: the readings hold {total} commands not to fear; REASONS lists {len(items)}")
    label, phrase = R["when"]
    return {"items": items, "when": {"r": builder.require(label, phrase, "part 06, when"), "t": phrase}}


def check_drawn(builder, study: dict, text: str, words, phrase_in) -> dict:
    bible = builder.bible
    motto = [{"r": builder.require(label, phrase, "the motto"), "t": phrase} for label, phrase in L.MOTTO_FROM]
    label, phrase, count = L.ELDERS
    if count != 70 or "seventy" not in phrase:
        raise BuildError("the elders count must be the seventy of Numbers 11:16")
    elders = {"r": builder.require(label, phrase, "the elders"), "n": count}
    return {"rows": rows(builder), "match": match(builder), "care": care(builder, bible), "swing": swing(builder),
            "refrain": refrain(builder, phrase_in, words), "though": though(builder), "reasons": reasons(builder, words),
            "motto": motto, "elders": elders}
