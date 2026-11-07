"""The lines across the fold, Ephesians' four lines and the close's pairs, for the A new creation build. Every phrase is
checked in its stated verse as whole words, and every line inside its span. `builder` is build-data.py's Builder."""
from typing import Any

import study_lists as L
from scripture_text import REF_RE, BuildError, fold, in_verse, typographic, verses_of


def position(bible: dict, label: str, words: str) -> tuple:
    """Where a phrase stands, so the page can say when the command comes first."""
    _, verses = verses_of(bible, label)
    chapter, verse, text = verses[0]
    at = fold(text).replace('"', "").find(fold(words).replace('"', ""))
    if at < 0:
        raise BuildError(f"could not place {words!r} in {label}")
    return chapter, verse, at


def build_fold(builder: Any, entry: dict, inside: str | None = None) -> dict:
    """One line across the fold. Its phrases are in their verses and inside its span; a part's line is inside that part's reading."""
    pieces = [entry["done"], entry["now"]] + ([entry["join"]] if entry["join"] else [])
    span_code, span_verses = verses_of(builder.bible, entry["span"])
    keys = {v[:2] for v in span_verses}
    for label, words in pieces:
        in_verse(builder.bible, label, words)
        code, verses = verses_of(builder.bible, label)
        if code != span_code or verses[0][:2] not in keys:
            raise BuildError(f"{label} is outside the span {entry['span']} of its fold")
    if inside is not None:
        holder = builder.passages[inside]
        if span_code != holder["code"] or not keys <= {(v["c"], v["v"]) for v in holder["verses"]}:
            raise BuildError(f"the fold at {entry['span']} is not inside its part's reading {holder['label']}")
    return {"r": builder.passage(entry["span"]), "span": entry["span"], "who": entry["who"],
            "done": typographic(entry["done"][1]), "now": typographic(entry["now"][1]), "join": entry["join"][1] if entry["join"] else None,
            "commandFirst": position(builder.bible, *entry["now"]) < position(builder.bible, *entry["done"])}


def part_folds(builder: Any, study: dict) -> list:
    """One line per part, each inside one of that part's own main readings."""
    if len(L.PART_FOLDS) != len(study["parts"]):
        raise BuildError(f"PART_FOLDS has {len(L.PART_FOLDS)} lines for {len(study['parts'])} parts")
    out = []
    for entry, part in zip(L.PART_FOLDS, study["parts"]):
        code = verses_of(builder.bible, entry["span"])[0]
        homes = [r for r in part["readings"] if builder.passages[r]["code"] == code]
        if not homes:
            raise BuildError(f"part {part['n']}: its fold at {entry['span']} is in none of its main readings")
        errors = []
        for home in homes:
            try:
                out.append(build_fold(builder, entry, home))
                break
            except BuildError as error:
                errors.append(str(error))
        else:
            raise BuildError(f"part {part['n']}: {errors[-1]}")
    return out


def text_folds(builder: Any, study: dict) -> list:
    """The places FoldReads names, compared with TEXT_FOLDS by their joining verse, in order."""
    raw = study["foldReadsRaw"]
    named = [m.group(0) for m in REF_RE.finditer(raw) if raw[m.end():m.end() + 3] == ' ("']
    listed = [entry["join"][0] for entry in L.TEXT_FOLDS]
    if named != listed:
        raise BuildError(f"FoldReads names the places {named}; TEXT_FOLDS has {listed}")
    return [build_fold(builder, entry) for entry in L.TEXT_FOLDS]


def build_lines(builder: Any, study: dict) -> list:
    if L.LINES_PART not in {p["n"] for p in study["parts"]}:
        raise BuildError(f"LINES_PART {L.LINES_PART} is not a part of the text")
    out = []
    for line in L.FOUR_LINES:
        for key in ("stop", "instead", "because"):
            in_verse(builder.bible, line["ref"], line[key])
        out.append({key: typographic(line[key]) for key in ("stop", "instead", "because")} | {"r": builder.passage(line["ref"]), "label": line["ref"]})
    return out


def close_pairs(builder: Any, close: dict) -> None:
    """The close's list of what God has done, each with what it means to live, drawn as a fold. Rebuilt and compared, so no
    word is lost; the count must match CLOSE_PAIR_REFS."""
    raw = close.pop("raw")
    head, sep, rest = raw.rpartition(": ")
    if not sep or not rest.endswith("."):
        raise BuildError(f"the Close paragraph is not 'intro: a, so b; ...; y, so z.': {raw[:80]!r}")
    items = [item.split(", so ") for item in rest[:-1].split("; ")]
    if any(len(item) != 2 for item in items) or len(items) != len(L.CLOSE_PAIR_REFS):
        raise BuildError(f"the Close paragraph has {len(items)} pairs, or one without ', so '; CLOSE_PAIR_REFS has {len(L.CLOSE_PAIR_REFS)}")
    if head + ": " + "; ".join(f"{a}, so {b}" for a, b in items) + "." != raw:
        raise BuildError("the Close paragraph does not rebuild from its pairs")
    close["intro"] = builder.runs(head + ":", [])
    close["pairs"] = [{"done": typographic(a), "now": typographic(b), "r": builder.passage(ref), "label": ref}
                      for (a, b), ref in zip(items, L.CLOSE_PAIR_REFS)]
