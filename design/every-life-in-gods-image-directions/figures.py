"""The figures of the Every life in God's image page, built from study_lists.py and checked against the Berean and the
study's own text. Every count on the page is made here, by script, never typed."""
import re

from scripture_text import BuildError, fold, has_words, plain_text


def plain(runs: list) -> str:
    """The text of a paragraph's runs, as read."""
    return "".join(run if isinstance(run, str) else run.get("t", run.get("b", run.get("i", ""))) for run in runs)


def split_on(text: str, pattern: str) -> list:
    """Text → [[piece, lit], …], lit where the pattern matches."""
    out, last = [], 0
    for match in re.finditer(pattern, text):
        if match.start() > last:
            out.append([text[last:match.start()], False])
        out.append([match.group(0), True])
        last = match.end()
    if last < len(text):
        out.append([text[last:], False])
    return out


def twice(builder, lists) -> dict:
    spec = lists.TWICE
    rows = []
    for row in spec["rows"]:
        key = builder.passage(row["ref"])
        text = plain_text(builder.bible, row["ref"])
        if spec["phrase"] not in text:
            raise BuildError(f"said twice: {spec['phrase']!r} is not in {row['ref']}")
        rows.append({**row, "r": key, "parts": split_on(text, re.escape(spec["phrase"]))})
    absent = spec["not_named"]
    text = plain_text(builder.bible, absent["ref"]).lower()
    for word in absent["words"]:
        if has_words(word, text):
            raise BuildError(f"said twice: the study says {absent['ref']} does not name {word!r}, but it does")
    return {"phrase": spec["phrase"], "rows": rows, "notNamed": absent["words"], "nr": builder.passage(absent["ref"])}


def check_mark(builder, room: dict, mark: dict, content: str) -> dict:
    where = f"room {room['part']}, mark {mark['label']!r}"
    if "ref" in mark:
        key = builder.passage(mark["ref"])
        if not has_words(fold(mark["words"]).replace('"', ""), builder.text_of(key)):
            raise BuildError(f"{where}: {mark['words']!r} is not in {mark['ref']}")
        out = {**mark, "r": key}
    elif fold(mark.get("study", "")) and fold(mark["study"]) in content:
        out = dict(mark)
    else:
        raise BuildError(f"{where}: its words are neither a verse's (ref) nor in the study's content.md (study)")
    if mark.get("silent") and fold(mark.get("why", "")) not in content:
        raise BuildError(f"{where}: the reason it cannot speak is not in the study's own words: {mark.get('why')!r}")
    if mark["kind"] not in ("person", "thing", "words"):
        raise BuildError(f"{where}: unknown kind {mark['kind']!r}")
    if not (0 <= mark["x"] <= 640 and 0 <= mark["y"] <= 320):
        raise BuildError(f"{where}: ({mark['x']}, {mark['y']}) is outside the 640 by 320 room")
    return out


def rooms(builder, lists, content: str, study: dict) -> list:
    way = fold(plain(study["close"]["way"]))
    parts = {p["n"]: p for p in study["parts"]}
    out = []
    for room in lists.ROOMS:
        if room["part"] not in parts:
            raise BuildError(f"room {room['part']}: the study has no part {room['part']}")
        marks = [check_mark(builder, room, mark, content) for mark in room["marks"]]
        silent = [m for m in marks if m.get("silent")]
        if len(silent) != 1:
            raise BuildError(f"room {room['part']}: {len(silent)} marks are the one who cannot speak; there must be exactly one")
        if fold(room["silent_name"]) not in way:
            raise BuildError(f"room {room['part']}: {room['silent_name']!r} is not one of the people the close's Way paragraph names")
        applied = lists.APPLIED.get(room["part"])
        if applied and fold(applied) not in content:
            raise BuildError(f"room {room['part']}: the note {applied!r} is not in the study's own words")
        out.append({**room, "marks": marks, "applied": applied})
    for act in lists.CLOSE_ACTS:
        if fold(act) not in way:
            raise BuildError(f"close: {act!r} is not in the Way paragraph")
    return out


def table(builder, lists, content: str) -> dict:
    spec = lists.TABLE
    key = builder.passage(spec["chapter"])
    verses = []
    for cv, text in builder.passages[key]["verses"]:
        verse = int(cv.split(":")[1])
        has_table = has_words(spec["table"], text)
        verses.append({"v": verse, "table": has_table, "always": has_table and has_words(spec["always"], text),
                       "lame": spec["lame"] in text})
    at_table = [v["v"] for v in verses if v["table"]]
    always = [v["v"] for v in verses if v["always"]]
    lame = [v["v"] for v in verses if v["lame"]]
    if at_table != spec["study_cites"]:
        raise BuildError(f"2 Samuel 9: the verses with {spec['table']!r} are {at_table}, but the study cites {spec['study_cites']}")
    if lame != [3, 13]:
        raise BuildError(f"2 Samuel 9: the study says the chapter names his feet at its beginning and end; found {lame}")
    note = None
    if spec["study_says"] in content:
        if len(at_table) == 3:
            raise BuildError("2 Samuel 9: the study's count now matches the verses; remove the editor's note")
        note = (f"The study says {spec['study_says'].removeprefix('the chapter says ')} and cites {len(at_table)} verses. "
                f"The Berean sets him at the table in {len(at_table)} verses ({', '.join(map(str, at_table))}); "
                f"“always” stands beside it in {len(always)} ({', '.join(map(str, always))}).")
    return {"r": key, "verses": verses, "atTable": at_table, "always": always, "lame": lame, "note": note}


def speaker(builder, lists) -> dict:
    spec = lists.SPEAKER
    key = builder.passage(spec["ref"])
    pattern = r"\b(?:" + "|".join(map(re.escape, spec["words"])) + r")\b"
    verses, count = [], 0
    for cv, text in builder.passages[key]["verses"]:
        parts = split_on(text, pattern)
        count += sum(1 for _, lit in parts if lit)
        verses.append({"cv": cv, "parts": parts})
    if count < 1:
        raise BuildError(f"Psalm 139: no first-person words found in {spec['ref']}")
    return {"r": key, "count": count, "verses": verses}


def mouth(builder, lists) -> dict:
    spec = lists.MOUTH
    key = builder.passage(spec["ref"])
    count = plain_text(builder.bible, spec["ref"]).count(spec["phrase"])
    if count != spec["expect"]:
        raise BuildError(f"Proverbs 31: {spec['phrase']!r} is in {spec['ref']} {count} times, not {spec['expect']}")
    return {"r": key, "phrase": spec["phrase"], "count": count}


def build_figures(builder, lists, content: str, study: dict) -> dict:
    content = fold(content)
    return {"twice": twice(builder, lists), "rooms": rooms(builder, lists, content, study),
            "table": table(builder, lists, content), "speaker": speaker(builder, lists), "mouth": mouth(builder, lists)}
