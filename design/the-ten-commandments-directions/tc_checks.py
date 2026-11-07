"""The checks behind The Ten Commandments page's own drawings, its outside quotations, and the self-test.
Used by build-data.py; every failure raises BuildError and the build writes nothing."""
import difflib
import re
from pathlib import Path

import study_lists as LISTS
from scripture_text import BuildError, fold, has_words, plain_text

TRADITIONS = (2, 3, 4)  # the table's counting columns: Jewish; most Protestants and Orthodox; Catholic and Lutheran


def quote_scope_ok(phrase: str, texts: list) -> bool:
    """A quoted phrase (pieces split at an ellipsis) is in one of the texts, as whole words, ignoring the case of its
    first letter and how quotation marks and apostrophes are drawn."""
    pieces = [p.strip(" ,.") for p in phrase.split("…") if p.strip(" ,.")]
    for piece in pieces:
        folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
        variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
        if not any(has_words(v, t) for v in variants for t in texts):
            return False
    return True


def in_verse(bible: dict, label: str, phrase: str, what: str) -> None:
    if not has_words(fold(phrase).replace('"', ""), plain_text(bible, label)):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")


def counting(rows: list) -> dict:
    """Each tradition's numbers for the table's rows, proved to come to ten: every number 1 to 10 once, in order."""
    ways = {}
    for column in TRADITIONS:
        numbers = []
        for row in rows:
            cell = row["counts"][column - 2]
            if cell == "preface":
                numbers.append([])
            elif re.fullmatch(r"\d+( and \d+)?", cell):
                numbers.append([int(n) for n in cell.split(" and ")])
            else:
                raise BuildError(f"counting table: cannot read {cell!r} in row {row['what']!r}")
        flat = [n for ns in numbers for n in ns]
        if sorted(set(flat)) != list(range(1, 11)) or flat != sorted(flat):
            raise BuildError(f"counting table: the column {column + 1} does not come to ten in order: {flat}")
        ways[column] = numbers
    return ways


def given_twice(bible: dict, row: dict) -> dict:
    """Exodus and Deuteronomy compared verse by verse, word by word. Within a pair of verses a word counts as the same
    where it sits in the same run of matching words; a moved or changed word is marked on both sides. A pair of verses
    that share less than half their words (Exodus 20:11 and Deuteronomy 5:15, the two reasons for the Sabbath) is
    marked whole, so a stray "the LORD" is not shown as a match."""
    ex_verses, dt_verses = verse_words(bible, row["ex"]), verse_words(bible, row["dt"])
    if len(ex_verses) != len(dt_verses):
        raise BuildError(f"given twice: {row['ex']} and {row['dt']} must have the same number of verses")
    key = lambda w: re.sub(r"[^\w]", "", fold(w)).lower()  # noqa: E731
    ex_all, dt_all, ex_marks, dt_marks, whole = [], [], [], [], []
    for ex, dt in zip(ex_verses, dt_verses):
        matcher = difflib.SequenceMatcher(None, [key(w) for w in ex], [key(w) for w in dt], autojunk=False)
        em, dm = [False] * len(ex), [False] * len(dt)
        if matcher.ratio() < 0.5:
            em, dm = [True] * len(ex), [True] * len(dt)
            whole.append(True)
        else:
            for tag, a1, a2, b1, b2 in matcher.get_opcodes():
                if tag != "equal":
                    em[a1:a2] = [True] * (a2 - a1)
                    dm[b1:b2] = [True] * (b2 - b1)
        ex_all += ex; dt_all += dt; ex_marks += em; dt_marks += dm
    return {"n": row["n"], "ex": row["ex"], "dt": row["dt"], "exRuns": merge(ex_all, ex_marks), "dtRuns": merge(dt_all, dt_marks),
            "same": len(dt_all) - sum(dt_marks), "dtWords": len(dt_all), "exWords": len(ex_all), "dtOnly": sum(dt_marks),
            "exOnly": sum(ex_marks), "wholeVerses": sum(whole)}


def verse_words(bible: dict, label: str) -> list:
    from scripture_text import verses_of
    return [v[2].split() for v in verses_of(bible, label)[1]]


def plain_words(bible: dict, label: str) -> list:
    from scripture_text import verses_of
    text = " ".join(v[2] for v in verses_of(bible, label)[1])
    return text.split()


def merge(words: list, marks: list) -> list:
    runs = []
    for word, mark in zip(words, marks):
        if runs and runs[-1][1] == mark:
            runs[-1][0] += " " + word
        else:
            runs.append([word, mark])
    return runs


def check_lists(builder, study: dict, text: str) -> dict:
    bible = builder.bible
    table = next((b for p in study["parts"] for b in p["blocks"] if b["k"] == "table"), None)
    if not table or len(table["rows"]) != len(LISTS.TEN):
        raise BuildError("the counting table must have one row for the preface and one for each of the ten")
    for row, word in zip(table["rows"], LISTS.TEN):
        if word["ex"] != f"Exodus 20:{row['v'].replace('-', '–')}":
            raise BuildError(f"counting table row {row['what']!r} names Exodus 20:{row['v']}, the page's list says {word['ex']}")
        if word["key"].lower() not in plain_text(bible, word["ex"]).lower():
            raise BuildError(f"counting table row {row['what']!r}: {word['key']!r} is not in {word['ex']}")
        builder.passage(word["dt"])
    ways = counting(table["rows"])
    table["ways"] = {str(c): ways[c] for c in TRADITIONS}
    keyed = [{**word, "exR": builder.passage(word["ex"]), "dtR": builder.passage(word["dt"])} for word in LISTS.TEN]
    givings = [{**given_twice(bible, word), "exR": word["exR"], "dtR": word["dtR"]} for word in keyed]
    for heading, numbers in LISTS.GIVEN_UNDER.items():
        if f"\n### {heading}\n" not in text:
            raise BuildError(f"GIVEN_UNDER names a heading the study does not have: {heading!r}")
        if not all(1 <= n <= 10 for n in numbers):
            raise BuildError(f"GIVEN_UNDER {heading!r}: words are numbered 1 to 10")
    lengths = {w["n"]: len(plain_words(bible, w["ex"])) for w in LISTS.TEN if w["n"]}
    if max(lengths, key=lengths.get) != 4 or "is the longest of the ten" not in text:
        raise BuildError(f"the study says the fourth word is the longest; the Berean's word counts are {lengths}")
    check_facts(bible)
    takes = check_takes(builder)
    week = []
    for pin in LISTS.WEEK:
        in_verse(bible, pin["ref"], pin["phrase"], "week line")
        week.append({**pin, "r": builder.passage(pin["ref"])})
    for item in LISTS.PRACTICE:
        if fold(item["phrase"]) not in fold(text):
            raise BuildError(f"practice {item['who']!r}: the study does not say {item['phrase']!r}")
    check_crisis(text)
    same = sum(g["same"] for g in givings)
    total = sum(g["dtWords"] for g in givings)
    numbers = {"words": 10, "ways": len(TRADITIONS), "givenSame": same, "givenTotal": total,
               "dtOnly": sum(g["dtOnly"] for g in givings), "sabbathWords": lengths[4]}
    return {"givings": givings, "givenUnder": LISTS.GIVEN_UNDER, "ten": keyed, "takes": takes, "week": week,
            "practice": LISTS.PRACTICE, "numbers": numbers}


def check_facts(bible: dict) -> None:
    for fact in LISTS.FACTS:
        for label, phrase in fact["in"]:
            if phrase not in plain_text(bible, label):
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should be in {label}")
        for label, phrase in fact["not_in"]:
            if phrase.lower() in plain_text(bible, label).lower():
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should not be in {label}")
    for label, first, second in LISTS.ORDER_FACTS:
        verse = plain_text(bible, label)
        if not 0 <= verse.find(first) < verse.find(second):
            raise BuildError(f"word order: {first!r} should come before {second!r} in {label}")


def check_takes(builder) -> list:
    out = []
    for item in LISTS.TAKES:
        marks = []
        for mark in item["marks"]:
            in_verse(builder.bible, mark["ref"], mark["phrase"], f"part 04, {item['name']}")
            if not all(1 <= n <= 10 for n in mark["words"]):
                raise BuildError(f"part 04, {item['name']}: words are numbered 1 to 10")
            marks.append({**mark, "r": builder.passage(mark["ref"])})
        out.append({**item, "marks": marks})
    return out


def check_crisis(text: str) -> None:
    from scripture_text import WEBSITE
    path = WEBSITE / LISTS.CRISIS_FILE
    try:
        listed = path.read_text(encoding="utf-8")
    except OSError as error:
        raise BuildError(f"could not read the site's list of help lines {path}: {error}") from error
    for number in LISTS.CRISIS:
        whole = re.compile(r"(?<![\w-])" + re.escape(number) + r"(?![\w-])")
        if not whole.search(text):
            raise BuildError(f"crisis line {number} is no longer in the study's care note")
        if not whole.search(listed):
            raise BuildError(f"crisis line {number} is not in the site's checked list {LISTS.CRISIS_FILE}")


def held_window(website: Path, item: dict) -> str:
    path = (website / item["path"]).resolve()
    if not path.is_relative_to(website.resolve()):
        raise BuildError(f"held source outside the Website folder: {path}")
    try:
        held = re.sub(r"\s+", " ", path.read_text(encoding="utf-8", errors="replace"))
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    at = held.find(item["marker"])
    if at < 0:
        raise BuildError(f"marker {item['marker']!r} not found in {path.name}")
    return fold(held[at:at + 1500])


def check_outside(website: Path, text: str) -> None:
    for phrase, item in LISTS.HELD_QUOTES.items():
        if f'"{phrase}' not in text:
            raise BuildError(f"held quotation no longer in the text: {phrase!r}")
        window, wanted = held_window(website, item), fold(phrase)
        if item.get("ignore_case"):
            window, wanted = window.lower(), wanted.lower()
        if wanted not in window:
            raise BuildError(f"held quotation {phrase!r} is not found after {item['marker']!r} in {item['path']}")
    for phrase, item in LISTS.MISMATCHED.items():
        if f'"{phrase}"' not in text:
            raise BuildError(f"MISMATCHED quotation no longer in the text (fixed?): {phrase!r}; remove its entry")
        window = held_window(website, item)
        if fold(phrase.rstrip(".")) in window:
            raise BuildError(f"MISMATCHED quotation now matches {item['source']}: remove its entry so the page stops marking it")
        if fold(item["held"].rstrip(".")) not in window:
            raise BuildError(f"the held reading given for {phrase!r} is not in {item['path']} after {item['marker']!r}")
    for name in ("NOT_HELD_QUOTES", "OWN_TERMS"):
        for phrase in getattr(LISTS, name):
            if f'"{phrase}"' not in text:
                raise BuildError(f"{name} entry the text no longer quotes: {phrase!r}")
    for title in LISTS.STUDY_LINKS:
        if f"*{title.replace('’', chr(39))}*" not in text:
            raise BuildError(f"STUDY_LINKS entry the text no longer names: {title!r}")


def check_issue_tests(bible: dict) -> None:
    for issue in LISTS.ISSUES:
        kind, label, phrase = issue["test"]
        if kind != "not_in_verse":
            raise BuildError(f"unknown issue test {kind!r}")
        if phrase.lower() in plain_text(bible, label).lower():
            raise BuildError(f"the issue {issue['note'][:60]!r} no longer holds ({phrase!r} is in {label}); remove it")


# Wrong inputs, each changed in memory, with the words its refusal must contain.
CASES = [
    ("a changed word in a block quotation", "> but showing loving devotion to a thousand", "> but showing loving devotion to a hundred", "not word for word"),
    ("a block quotation under the wrong reference", "Exodus 20:6 · BSB", "Exodus 20:7 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", '"bow down to them or worship them"', '"bow down to them or serve them"', "quoted words"),
    ("a quotation cited to the wrong verse", 'am a jealous God" (Exodus 20:5)', 'am a jealous God" (Exodus 20:7)', "the verse cited"),
    ("a reference that does not exist", "(Exodus 20:13)", "(Exodus 20:27)", "does not resolve"),
    ("a link that leaves the site", "Read more in *God: who He is and what He does*.", "Read more [here](https://example.com).", "only site links"),
    ("a link to another host written as //host", "Read more in *God: who He is and what He does*.", "Read more [here](//example.com).", "only site links"),
    ("a line the page cannot place", "Motto: Two stones.", "A stray line.\n\nMotto: Two stones.", "outside any section"),
    ("a way of counting that does not come to ten", "| Coveting | 17 | 10 | 10 | 9 and 10 |", "| Coveting | 17 | 10 | 10 | 9 |", "does not come to ten"),
    ("a quotation left open", '"Do this" instead of', '"Do this instead of', "odd number"),
    ("a crisis number that is not on the site's list", "1-800-799-7233", "1-800-799-7234", "crisis line"),
    ("an editor's mark whose problem was fixed in the text", "since Romans 13:9 names them.", "since Romans 13:9 names four of them.", "ISSUES anchor"),
]


def selftest(build, text: str, bible: dict) -> int:
    failures = 0
    try:
        build(text, bible)
        print("selftest: control (the real content.md) builds")
    except BuildError as error:
        print(f"selftest: FAILED: the real content.md does not build: {error}")
        return 1
    for name, old, new, expected in CASES:
        if old not in text:
            print(f"selftest: FAILED: case {name!r} cannot be applied; {old!r} is not in content.md")
            failures += 1
            continue
        try:
            build(text.replace(old, new, 1), bible)
            print(f"selftest: FAILED: {name} was accepted")
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'FAILED, refused for another reason'}: {name}: {str(error).splitlines()[0][:150]}")
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused as expected; nothing written")
    return 1 if failures else 0
