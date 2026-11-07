"""The data behind the Genesis 1–11 drawings, each phrase and number checked in its verse before it is drawn."""
from pathlib import Path

from scripture_text import CANON, BuildError, fold, has_words, plain_text, verses_of
from study_refs import footnotes

WEBSITE = Path(__file__).resolve().parents[2]

ORDINALS = {"first": 1, "second": 2, "seventh": 7, "tenth": 10, "seventeenth": 17, "twenty-seventh": 27}
NUMBER_WORDS = {"a hundred and twenty": 120, "six hundredth": 600, "six hundred and first": 601}


def said(builder, label: str, words: str, what: str) -> str:
    """Fail unless the words are in the verse, as whole words. Returns the passage key."""
    if not has_words(fold(words).replace('"', ""), plain_text(builder.bible, label)):
        raise BuildError(f"{what}: {words!r} is not in {label}")
    return builder.passage(label)


def holds_number(phrase: str, number: int, what: str) -> None:
    if str(number) not in phrase and NUMBER_WORDS.get(next((w for w in NUMBER_WORDS if w in fold(phrase)), ""), None) != number:
        raise BuildError(f"{what}: the phrase {phrase!r} does not state {number}")


def days(builder, lists) -> list:
    genesis_1 = [(c, v) for c, v, text in verses_of(builder.bible, "Genesis 1:1–31")[1] if lists.REFRAIN in fold(text)]
    if len(genesis_1) != 6:
        raise BuildError(f"the refrain {lists.REFRAIN!r} should close six days in Genesis 1; found {len(genesis_1)}")
    if lists.REFRAIN in plain_text(builder.bible, "Genesis 2:1–3"):
        raise BuildError("the seventh day should have no refrain, but Genesis 2:1–3 holds it")
    if [d["day"] for d in lists.DAYS] != list(range(1, 8)):
        raise BuildError("the days must run 1 to 7")
    return [{**d, "r": said(builder, d["ref"], d["words"], f"day {d['day']}")} for d in lists.DAYS] + \
        [{"refrain": lists.REFRAIN, "verses": [f"{c}:{v}" for c, v in genesis_1], "r": builder.passage("Genesis 1:1–2:3")}]


def ages(builder, lists) -> dict:
    rows = []
    for person in lists.AGES:
        parts = []
        for label, phrase, number in person["parts"]:
            holds_number(phrase, number, person["name"])
            parts.append({"r": said(builder, label, phrase, person["name"]), "n": number})
        last = person["parts"][-1][0]
        died = "died" in plain_text(builder.bible, last)
        row = {"name": person["name"], "years": sum(p["n"] for p in parts), "parts": parts, "died": died, "flood": person.get("flood", False)}
        if "open" in person:
            label, phrase = person["open"]
            if died or "died" in plain_text(builder.bible, label):
                raise BuildError(f"{person['name']}: drawn without a death, but {last} or {label} says he died")
            row["open"] = {"r": said(builder, label, phrase, person["name"]), "t": phrase}
        rows.append(row)
    psalm = lists.PSALM_90
    note = lists.SEPTUAGINT_NOTE
    code, [(c, v, _)] = verses_of(builder.bible, note["ref"])
    notes = " ".join(footnotes(WEBSITE, code, c, v))
    for words in note["has"]:
        if words not in notes:
            raise BuildError(f"the Berean's note at {note['ref']} should mention {words!r}")
    return {"rows": rows, "psalm": {**psalm, "r": said(builder, psalm["ref"], psalm["words"], "Psalm 90")},
            "noteRef": builder.passage(note["ref"])}


def flood(builder, lists) -> dict:
    marks = []
    for item in lists.FLOOD:
        key = said(builder, item["ref"], item["words"], "flood calendar")
        if "span" in item:
            holds_number(item["words"], item["span"], "flood calendar")
        else:
            words = fold(item["words"]).lower()
            day = next((n for w, n in ORDINALS.items() if f"the {w} day of" in words), None)
            month = next((n for w, n in ORDINALS.items() if f"the {w} month" in words), None)
            if (day, month) != (item["day"], item["month"]):
                raise BuildError(f"flood calendar: {item['words']!r} is not day {item['day']} of month {item['month']}")
        marks.append({**item, "r": key})
    for label, phrase, year in lists.YEAR_WORDS:
        holds_number(phrase, year, "flood year")
        said(builder, label, phrase, "flood year")
    ark = lists.ARK
    for size in ("long", "wide", "high"):
        holds_number(ark["words"], ark[size], "the ark")
    return {"marks": marks, "ark": {**ark, "r": said(builder, ark["ref"], ark["words"], "the ark")}}


def nations(builder, lists) -> dict:
    holding = [f"Genesis 10:{v}" for c, v, text in verses_of(builder.bible, "Genesis 10:1–32")[1] if "languages" in text]
    if holding != [item["ref"] for item in lists.LANGUAGES]:
        raise BuildError(f"Genesis 10 names languages in {holding}, not in {[i['ref'] for i in lists.LANGUAGES]}")
    return {"languages": [{**i, "r": said(builder, i["ref"], i["words"], "languages")} for i in lists.LANGUAGES],
            "names": [{**i, "r": said(builder, i["ref"], i["words"], "a name")} for i in lists.NAMES],
            "thread": [{**i, "r": said(builder, i["ref"], i["words"], "the thread")} for i in lists.THREAD]}


def facts(builder, lists) -> None:
    for fact in lists.FACTS:
        for label, phrase in fact.get("in", []):
            if phrase not in plain_text(builder.bible, label):
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should be in {label}")
        for label, phrase in fact.get("not_in", []):
            if phrase in plain_text(builder.bible, label).lower():
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should not be in {label}")
        for label, phrase in fact.get("notes", []):
            code, [(c, v, _)] = verses_of(builder.bible, label)
            if not any(phrase in note for note in footnotes(WEBSITE, code, c, v)):
                raise BuildError(f"fact {fact['says']!r}: the Berean's note at {label} should hold {phrase!r}")


def check_graphics(builder, lists) -> dict:
    facts(builder, lists)
    return {"days": days(builder, lists), "ages": ages(builder, lists), "flood": flood(builder, lists), "nations": nations(builder, lists)}


def later_refs(builder, keys: list) -> list:
    """References beyond Genesis 1–11, once each, in Bible order."""
    def place(key):
        code, verses = verses_of(builder.bible, builder.passages[key]["ref"])
        return CANON.index(code), verses[0][0], verses[0][1]
    def verses(key):
        code, found = verses_of(builder.bible, builder.passages[key]["ref"])
        return {(code, c, v) for c, v, _ in found}
    beyond = {k for k in keys if (lambda p: p[0] > 0 or p[1] > 11)(place(k))}
    # A passage inside a wider one listed here (Romans 5:12 inside Romans 5:12–19) is shown once, as the wider one.
    outer = {k for k in beyond if not any(o != k and verses(k) < verses(o) for o in beyond)}
    return sorted(outer, key=lambda k: (*place(k), -len(verses(k))))


def chapter_band(builder, parts: list) -> dict:
    """Genesis 1:1–12:1 as one line of verses; each question as the runs of verses its Genesis readings cover."""
    span = verses_of(builder.bible, "Genesis 1:1–12:1")[1]
    index = {(c, v): i for i, (c, v, _) in enumerate(span)}
    chapters = []
    for c, v, _ in span:
        if chapters and chapters[-1][0] == c:
            chapters[-1][1] += 1
        else:
            chapters.append([c, 1])
    questions, lanes = [], []
    for part in parts:
        covered = set()
        for key in part["readings"]:
            code, verses = verses_of(builder.bible, builder.passages[key]["ref"])
            if code == "GEN":
                covered |= {index[(c, v)] for c, v, _ in verses if (c, v) in index}
        runs = []
        for i in sorted(covered):
            if runs and runs[-1][1] == i - 1:
                runs[-1][1] = i
            else:
                runs.append([i, i])
        if not runs:
            raise BuildError(f"question {part['n']} reads nothing in Genesis 1:1–12:1, so it has no place on the band")
        lane = next((n for n, end in enumerate(lanes) if end < runs[0][0]), len(lanes))
        lanes[lane:lane + 1] = [runs[-1][1]]
        questions.append({"n": part["n"], "lane": lane, "runs": runs})
    return {"chapters": chapters, "verses": len(span) - 1, "questions": questions, "lanes": len(lanes)}
