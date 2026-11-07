"""The data behind each figure on the Grief and dying page, computed from the Berean and checked. Every number a figure
shows is found here by script, never typed in."""
import re

from scripture_text import BuildError, fold, has_words


def phrase_in(builder, label: str, phrase: str, what: str) -> str:
    """The phrase is in the verses, as whole words; returns the passage key."""
    key = builder.passage(label)
    text = builder.text_of(key).replace("'", "")
    folded = fold(phrase).replace('"', "").replace("'", "")
    if not folded or not has_words(folded, text):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")
    return key


def voices(builder, L) -> dict:
    rows = []
    for row in L.VOICES:
        if row["to"] not in L.ADDRESSEES or row["section"] not in L.SECTION_NAMES:
            raise BuildError(f"voice {row['who']!r}: unknown addressee {row['to']!r} or section {row['section']!r}")
        rows.append({**row, "r": phrase_in(builder, row["ref"], row["words"], f"voice of {row['who']}")})
    book = lambda row: row["ref"].rsplit(" ", 1)[0]  # noqa: E731
    for name in L.VOICES_FACT["none_to_lord"]:
        if any(book(r) == name and r["to"] == "lord" for r in rows):
            raise BuildError(f"the reading sentence says no {name} voice goes to the Lord, but one does")
    for name in L.VOICES_FACT["some_to_lord"]:
        if not any(book(r) == name and r["to"] == "lord" for r in rows):
            raise BuildError(f"the reading sentence says a {name} voice goes to the Lord, but none does")
    return {"rows": rows, "to": L.ADDRESSEES, "sections": L.SECTION_NAMES, "read": L.VOICES_READ}


def days(builder, L) -> dict:
    rows = []
    for row in L.DAYS:
        count = L.NUMBER_WORDS.get(row["words"].split()[0])
        if count is None:
            raise BuildError(f"days: {row['words']!r} does not start with a number word on NUMBER_WORDS")
        rows.append({**row, "n": count, "r": phrase_in(builder, row["ref"], row["words"], "days of mourning")})
    none = L.NO_COUNT
    key = builder.passage(none["ref"])
    if has_words(none["absent"], builder.text_of(key)):
        raise BuildError(f"days: the page says {none['ref']} gives no number of days, but it has {none['absent']!r}")
    cave = [{**c, "r": phrase_in(builder, c["ref"], c["words"], "the cave")} for c in L.CAVE]
    return {"rows": rows, "none": {**none, "r": key}, "cave": cave}


def song(builder, L) -> dict:
    key = builder.passage(L.SONG["ref"])
    verses = builder.passages[key]["verses"]
    refrain = [int(cv.split(":")[1]) for cv, text in verses if L.SONG["refrain"] in fold(text)]
    if refrain != L.SONG["cited"]:
        raise BuildError(f"the refrain is in verses {refrain} of {L.SONG['ref']}, but the study cites {L.SONG['cited']}")
    cry_key = builder.passage(L.CRY["ref"])
    cry = builder.passages[cry_key]["verses"][0][1]
    spoken = fold(cry).split('"', 1)[1] if '"' in fold(cry) else ""
    count = len(re.findall(r"\b" + re.escape(L.CRY["phrase"]) + r"\b", spoken, flags=re.I))
    if count < 2:
        raise BuildError(f"the cry: {L.CRY['phrase']!r} found {count} times in the words spoken in {L.CRY['ref']}")
    return {"r": key, "refrain": L.SONG["refrain"], "refrainVerses": refrain, "cry": cry_key, "phrase": L.CRY["phrase"], "count": count}


def lament(builder, L) -> dict:
    chapters, total = [], 0
    for number, expected in L.LAMENT["chapters"].items():
        key = builder.passage(f"Lamentations {number}")
        found = len(builder.passages[key]["verses"])
        if found != expected:
            raise BuildError(f"Lamentations {number} has {found} verses in the Berean, the figure expects {expected}")
        chapters.append({"n": number, "r": key, "count": found, "start": total, "alphabet": number not in L.LAMENT["not_alphabet"]})
        total += found
    if len(L.LETTERS) != 22 or L.LAMENT["chapters"][1] != 22 or L.LAMENT["chapters"][3] != 66:
        raise BuildError("the alphabet figure needs 22 letters, 22 verses in chapter 1 and 66 in chapter 3")
    comfort = L.LAMENT["comfort"]
    first = builder.passages[builder.passage(f"Lamentations {comfort['chapter']}")]["verses"]
    hits = [int(cv.split(":")[1]) for cv, text in first if re.search(comfort["pattern"], fold(text))]
    if hits != comfort["expect"]:
        raise BuildError(f"'no one to comfort' is in Lamentations 1:{hits}, the study says {comfort['expect']}")
    exact = [v for v in hits if "no one to comfort" in fold(dict(first)[f"1:{v}"])]
    marks = [{**m, "r": phrase_in(builder, m["ref"], m["words"], f"Lamentations mark {m['id']}")} for m in L.LAMENT["marks"]]
    middle_index = total // 2  # 1-based position of the middle verse (77 of 154)
    position, middle = 0, None
    for chapter in chapters:
        if position + chapter["count"] >= middle_index:
            middle = f"{chapter['n']}:{middle_index - position}"
            break
        position += chapter["count"]
    hope = next(m for m in marks if m["id"] == "hope")
    first_verse, last_verse = (int(x) for x in hope["ref"].split(":")[1].split("–"))
    if not (hope["ref"].startswith(f"Lamentations {middle.split(':')[0]}:") and first_verse <= int(middle.split(":")[1]) <= last_verse):
        raise BuildError(f"the figure says the hope stands at the middle, but the middle verse {middle} is outside {hope['ref']}")
    return {"chapters": chapters, "total": total, "middle": middle, "middleIndex": middle_index, "letters": L.LETTERS,
            "comfort": hits, "comfortExact": exact, "marks": marks}


def luke(builder, L) -> dict:
    men = L.TWO_MEN
    pin = lambda item, what: {**item, "r": phrase_in(builder, item["ref"], item["words"], what)}  # noqa: E731
    two = {"mocks": pin(men["mocks"], "the one who mocks"), "says": [pin(s, "the other man") for s in men["says"]],
           "asks": pin(men["asks"], "the request"), "answer": pin(men["answer"], "the answer")}
    comma = L.COMMA
    phrase_in(builder, comma["ref"], comma["berean"], "the comma, Berean reading")
    words = lambda text: re.findall(r"[A-Za-z]+", text)  # noqa: E731
    if words(comma["moved"]) != words(comma["berean"]) or comma["moved"] == comma["berean"]:
        raise BuildError("the comma reading must have the Berean's words in the same order and differ only in punctuation")
    truly = L.TRULY
    book = builder.bible[{"Luke": "LUK"}[truly["book"]]]
    hits = [cv for cv, text in book.items() if truly["phrase"] in fold(text)]
    today = [cv for cv in hits if truly["with_today"] in fold(book[cv])]
    if today != [truly["only_in"]]:
        raise BuildError(f"'{truly['with_today']}' is in Luke {today}, the page says only {truly['only_in']}")
    truly_refs = [builder.passage(f"Luke {cv}") for cv in sorted(hits, key=lambda cv: tuple(map(int, cv.split(":"))))]
    return {"two": two, "comma": {**comma, "r": builder.passage(comma["ref"])}, "truly": {"phrase": truly["phrase"], "refs": truly_refs, "today": today}}


def now_then(builder, L) -> list:
    return [{**stage, "items": [{"ref": ref, "words": words, "r": phrase_in(builder, ref, words, f"now and then: {stage['name']}")}
                                for ref, words in stage["items"]]} for stage in L.NOW_THEN]


def build_figures(builder, L) -> dict:
    return {"voices": voices(builder, L), "days": days(builder, L), "song": song(builder, L), "lament": lament(builder, L),
            "luke": luke(builder, L), "nowThen": now_then(builder, L)}
