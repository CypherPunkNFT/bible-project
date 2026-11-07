"""The checks for what the page draws beside the study's text (the two signs, the part 03 river, the back-and-forward
strips, the order of Acts 2:41-42) and for the outside quotations. Used by build-data.py; split out to keep it short."""
from __future__ import annotations  # "Builder" in the hints lives in build-data.py

import json
import re

from held import Held, proof_texts
from page_checks import phrase_in
from scripture_text import BuildError, typographic

NUMBER_WORDS = {"seven": 7, "eight": 8, "nine": 9, "ten": 10, "Ten": 10, "eleven": 11}


def curl(text: str) -> str:
    """Straight quotes to curly for the page: an opening single quote turns the right way, then the shared rules."""
    return typographic(re.sub(r"(^|[\s\"(])'(?=\w)", r"\1‘", text))


def check_signs(builder: Builder, lists: dict, text: str) -> list:
    signs = []
    for sign in lists["SIGNS"]:
        if sign["study_says"] not in text:
            raise BuildError(f"sign {sign['id']}: the study's sentence is not in content.md: {sign['study_says']!r}")
        signs.append({"id": sign["id"], "name": sign["name"], "rhythm": sign["rhythm"], "says": curl(sign["study_says"]),
                      "points": [phrase_in(builder, *p, f"sign {sign['id']}, what it points to") for p in sign["points"]],
                      "before": phrase_in(builder, *sign["before"], f"sign {sign['id']}, what came before")})
    return signs


def check_panel(builder: Builder, lists: dict, part: dict) -> list:
    """Each row's name stands in its own text; each household mark is proved in its verse, or proved left open."""
    rows, kinds = part.get("panel", []), lists["PANEL"]
    if len(rows) != len(kinds):
        raise BuildError(f"the panel has {len(rows)} rows in content.md but {len(kinds)} in study_lists.py")
    said = [NUMBER_WORDS[w] for w in re.findall(r"(\w+) (?:baptisms|times Acts says)", json.dumps([part["panelLead"], part["hook"]], ensure_ascii=False)) if w in NUMBER_WORDS]
    if not said or any(n != len(rows) for n in said):
        raise BuildError(f"the study counts {said} baptisms, but its panel has {len(rows)} rows")
    for row, kind in zip(rows, kinds):
        if kind["word"] not in row["rawBefore"]:
            raise BuildError(f"panel row {row['n']}: {kind['word']!r} is not in the row's text, so it cannot be named {kind['kind']!r}")
        row["kind"] = kind["kind"]
        house = kind.get("household")
        if house == "silent":
            # Open only if no verse of the row says the household believed: "household" then "believ" in one sentence,
            # with no quotation between (Acts 16:15 has "household" and Lydia's own "a believer" across a quote mark).
            verses = [text for _, text in builder.passages[row["r"]]["verses"]]
            if any(re.search(r"household[^.“”\"?!;]{0,80}?\bbeliev", v) for v in verses) or not any("household" in v for v in verses):
                raise BuildError(f"panel row {row['n']}: drawn as a household the passage leaves open, but {row['label']} does not bear that out")
            row["household"] = {"open": True}
        elif house:
            mark = phrase_in(builder, *house, f"panel row {row['n']}, the household")
            if builder.passages[mark["r"]]["verses"][0][0] not in {cv for cv, _ in builder.passages[row["r"]]["verses"]}:
                raise BuildError(f"panel row {row['n']}: the household verse {house[0]} is outside {row['label']}")
            row["household"] = mark
        del row["rawBefore"], row["rawAfter"]
    return rows


def check_lists(builder: Builder, lists: dict, text: str, study: dict) -> dict:
    parts = {p["n"]: p for p in study["parts"]}
    panel_parts = [p for p in study["parts"] if p.get("panel")]
    if len(panel_parts) != 1:
        raise BuildError(f"one part should hold the panel, found {len(panel_parts)}")
    out = {"signs": check_signs(builder, lists, text), "panel": check_panel(builder, lists, panel_parts[0]), "directions": [], "order": None}
    for item in lists["DIRECTIONS"]:
        part = parts.get(item["part"])
        if not part or not any(b["k"] == "quote" and b["label"] == item["after"] for b in part["blocks"]):
            raise BuildError(f"direction strip: part {item['part']} has no block quotation of {item['after']}")
        out["directions"].append({"part": item["part"], "after": item["after"], "back": phrase_in(builder, *item["back"], "looking back"),
                                  "forward": phrase_in(builder, *item["forward"], "looking forward")})
    order = lists["ORDER"]
    if order["study_says"] not in text:
        raise BuildError(f"the order: the study's sentence is not in content.md: {order['study_says']!r}")
    out["order"] = {"part": order["part"], "says": curl(order["study_says"]),
                    "steps": [{"name": name, **phrase_in(builder, label, phrase, f"the order, {name}")} for name, label, phrase in order["steps"]]}
    return out


def check_outside(builder: Builder, lists: dict) -> dict:
    unused = sorted(set(lists["OUTSIDE_QUOTES"]) - builder.outside_used) + sorted((set(lists["OWN_TERMS"]) | set(lists["NEGATED_ON_PURPOSE"])) - builder.terms_used)
    if unused:
        raise BuildError(f"listed quotations the study does not use (remove them from study_lists.py): {unused}")
    held = Held(lists["OLD_SPELLINGS"])
    for kind, what, key, part, says in lists["HELD_FACTS"]:
        if kind == "proof" and what not in proof_texts(key, part):
            raise BuildError(f"held fact {says!r}: {what} is not among the references printed under {key} {part}")
        if kind == "words":
            held.check(what, (says, key, part))
    return {phrase: {"source": source[0], "compared": held.check(phrase, source)} for phrase, source in sorted(lists["OUTSIDE_QUOTES"].items())}
