"""The figures of the Reading the Bible well mock-up, checked against the Berean before they are drawn. Each figure
returns only what the page needs; a phrase a figure shows must be in its verse, and a count is computed, never typed."""
from scripture_text import BOOKS, CANON, BuildError
import study_lists as L

NAMES = {code: name for name, code in BOOKS.items()}


def shelf(builder) -> dict:
    """The 66 books in the Berean's order, each as tall as its chapters, coloured by its part of the Bible."""
    starts = {code: (key, name) for code, key, name in L.DIVISIONS}
    named = {p["book"] for p in builder.passages.values()}
    books, division = [], None
    for code in CANON:
        division = starts.get(code, division)
        if division is None:
            raise BuildError(f"the shelf's divisions do not start at Genesis (first is {L.DIVISIONS[0][0]})")
        chapters = len({cv.split(":")[0] for cv in builder.bible[code]})
        books.append({"code": code, "name": NAMES[code], "ch": chapters, "div": division[0],
                      "walked": L.WALKED.get(code), "named": code in named})
    if len(books) != 66 or set(L.WALKED) - named:
        raise BuildError(f"the shelf needs 66 books and every walked book cited on the page; walked but not cited: {sorted(set(L.WALKED) - named)}")
    return {"books": books, "divisions": [[key, name] for _, key, name in L.DIVISIONS]}


def john(builder, text: str) -> dict:
    chapters = sorted({int(cv.split(":")[0]) for cv in builder.bible["JHN"]})
    if chapters != list(range(1, 22)):
        raise BuildError(f"John should have 21 chapters in the Berean, found {len(chapters)}")
    if L.JOHN_QUESTION not in text:
        raise BuildError(f"the day's question {L.JOHN_QUESTION!r} is not in content.md word for word")
    days = []
    for n in chapters:
        key = builder.passage(f"John {n}")
        note = L.JOHN_DAYS.get(n)
        if note:
            if note[1] not in text:
                raise BuildError(f"John day {n}: the note's reference {note[1]} is not one the study names")
            note = {"t": note[0], "r": builder.passage(note[1]), "says": note[2]}
        days.append({"n": n, "r": key, "verses": len(builder.passages[key]["cvs"]), "note": note})
    return {"days": days, "question": L.JOHN_QUESTION}


def weeks() -> dict:
    marks = L.WEEKS_EXAMPLE
    if len(marks) != 42 or set(marks) - {"0", "1"}:
        raise BuildError("the six-week example must be 42 marks of 0 and 1")
    returns = sum(1 for a, b in zip(marks, marks[1:]) if a == "0" and b == "1")
    return {"marks": marks, "read": marks.count("1"), "returns": returns, "longest": max(map(len, marks.split("0")))}


def reader(builder, text: str, noted: dict) -> dict:
    key = builder.passage(L.READER_SAMPLE)
    cvs = builder.passages[key]["cvs"]
    part = text.split("## 03 ", 1)[1].split("\n## ", 1)[0]
    labels = []
    for kind, label, name, words_from_text, note in L.READER_LABELS:
        cv = label.split(" ")[-1]
        if cv not in cvs:
            raise BuildError(f"reader label {name!r}: {label} is not in the sample {L.READER_SAMPLE}")
        if words_from_text not in part:
            raise BuildError(f"reader label {name!r}: {words_from_text!r} is not in part 03 of the study")
        if kind == "heading" and not noted.get(cv):
            raise BuildError(f"reader label {name!r}: {label} has no editors' heading in the Berean")
        if kind == "chapter" and not cv.endswith(":1"):
            raise BuildError(f"reader label {name!r}: {label} does not begin a chapter")
        if kind == "lord" and "LORD" not in builder.bible["JON"][cv]:
            raise BuildError(f"reader label {name!r}: {label} does not print LORD")
        labels.append({"k": kind, "cv": cv, "name": name, "means": words_from_text, "note": note})
    return {"r": key, "heads": {cv: noted[cv] for cv in cvs if noted.get(cv)}, "labels": labels}


def jonah(builder, text: str, words, phrase_in) -> dict:
    whole = builder.passage("Jonah 1–4")
    cvs = builder.passages[whole]["cvs"]
    per_chapter = [sum(1 for cv in cvs if cv.startswith(f"{c}:")) for c in range(1, 5)]
    steps = {}
    for label, phrase, level in L.DESCENT:
        builder.require(label, phrase, "Jonah's direction of travel")
        steps[label.split(" ")[1]] = {"t": phrase, "level": level, "r": builder.passage(label)}
    if [lv for _, _, lv in L.DESCENT][-1] != 0 or any(b >= a for a, b in zip([0] + [lv for _, _, lv in L.DESCENT[:-1]], [lv for _, _, lv in L.DESCENT[:-1]])):
        raise BuildError("Jonah's line must go only down until it comes back to dry land")
    level, line = 0, []
    for cv in cvs:
        level = steps[cv]["level"] if cv in steps else level
        line.append({"cv": cv, "level": level})
    appointed = []
    for label, thing, drawing in L.APPOINTED:
        builder.require(label, "appointed", "the four things God appointed")
        appointed.append({"r": builder.require(label, thing, "the four things God appointed"), "cv": label.split(" ")[1], "t": thing, "draw": drawing})
    command, places = L.SAME_COMMAND
    for label in places:
        builder.require(label, command, "the same command opening both halves")
    reason_at, reason, back_to, back_words = L.REASON
    end_text = builder.bible["JON"][L.OPEN_END.split(" ")[1]].rstrip("”\"' ")
    if not end_text.endswith("?") or L.OPEN_END.split(" ")[1] != cvs[-1]:
        raise BuildError(f"the book is drawn ending on a question at {L.OPEN_END}; the Berean's last verse does not")
    fish = [cv for cv in cvs if phrase_in(L.FISH_WORD, words(builder.bible["JON"][cv]))]
    message = "Forty more days and Nineveh will be overturned"
    builder.require("Jonah 3:4", message, "Jonah's message")
    if len(message.split()) != 8 or "eight words in the Berean" not in text:
        raise BuildError("the study says Jonah's message is eight words in the Berean; the count or the sentence differs")
    shared_keys = [builder.passage(label) for label in L.SHARED_VERSES]
    shared = [{"t": w, "in": [phrase_in(w, builder.text_of(k)) for k in shared_keys]} for w in L.SHARED_WORDS]
    if not all(row["in"][-1] for row in shared):
        raise BuildError(f"every shared phrase must be in {L.SHARED_VERSES[-1]}: {[r['t'] for r in shared if not r['in'][-1]]}")
    return {
        "jonah": {"r": whole, "line": line, "chapters": per_chapter, "steps": [{"cv": cv, **s} for cv, s in steps.items()],
                  "appointed": appointed, "command": {"t": command, "at": [p.split(" ")[1] for p in places], "r": [builder.passage(p) for p in places]},
                  "reason": {"at": reason_at.split(" ")[1], "t": reason, "r": builder.require(reason_at, reason, "Jonah's reason"),
                             "back": back_to.split(" ")[1], "backT": back_words, "backR": builder.require(back_to, back_words, "Jonah's flight")},
                  "end": cvs[-1], "fish": fish},
        "shared": {"verses": shared_keys, "rows": shared},
    }


def letter(builder) -> dict:
    key = builder.passage(L.LETTER)
    cvs = builder.passages[key]["cvs"]
    focus = L.LETTER_FOCUS.split(":")[-1]
    if f"29:{focus}" not in cvs:
        raise BuildError(f"{L.LETTER_FOCUS} is not inside the letter {L.LETTER}")
    notes = []
    for label, note, phrase in L.LETTER_NOTES:
        if label.split(" ")[1] not in cvs:
            raise BuildError(f"letter note {note!r}: {label} is not inside {L.LETTER}")
        notes.append({"cv": label.split(" ")[1], "t": note, "phrase": phrase, "r": builder.require(label, phrase, f"letter note {note!r}")})
    years = []
    for label, phrase, number, who in L.YEARS:
        said = next((n for word, n in L.NUMBER_WORDS.items() if word in phrase.lower().split()), None)
        if said != number:
            raise BuildError(f"years: {phrase!r} in {label} says {said}, not {number}")
        years.append({"r": builder.require(label, phrase, "two years or seventy"), "t": phrase, "n": number, "who": who})
    return {"letter": {"r": key, "focus": f"29:{focus}", "before": cvs.index(f"29:{focus}"), "notes": notes}, "years": years}


def check_figures(builder, study: dict, text: str, noted: dict, words, phrase_in) -> dict:
    parts = {p["n"]: p for p in study["parts"]}
    count_steps = lambda n: sum(len(b["items"]) for b in parts[n]["blocks"] if b["k"] == "steps")  # noqa: E731
    if count_steps("02") != 5 or count_steps("06") != 6:
        raise BuildError(f"the page draws five daily steps and six questions; content.md has {count_steps('02')} and {count_steps('06')}")
    out = {"john": john(builder, text), "weeks": weeks(), "reader": reader(builder, text, noted)}
    out.update(jonah(builder, text, words, phrase_in))
    out.update(letter(builder))
    out["shelf"] = shelf(builder)  # last, so every book the page cites is known
    out["numbers"] = {"johnChapters": len(out["john"]["days"]), "jonahVerses": len(out["jonah"]["line"]),
                      "fishVerses": len(out["jonah"]["fish"]), "years": [y["n"] for y in out["years"]],
                      "letterBefore": out["letter"]["before"]}
    return out
