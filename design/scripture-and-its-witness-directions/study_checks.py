"""The checks behind the drawn figures and the outside quotations of the What the Bible says about itself page.
Every drawn phrase is pinned to a verse or to the study's own words; every count is read from the Berean, not typed."""
import json
import re
from pathlib import Path

from scripture_text import BOOKS, BuildError, fold, ref_id, verses_of

FORMULA = re.compile(r"For it is written|It is also written|It is written")


def verses_with(bible: dict, label: str, word: str) -> list:
    """The references, as "Book c:v", of every verse in a passage that holds a whole word."""
    book = label.rsplit(" ", 1)[0]
    _, verses = verses_of(bible, label)
    return [f"{book} {c}:{v}" for c, v, text in verses if re.search(rf"(?<!\w){word}(?!\w)", text)]


def check_lists(builder, study: dict, text: str, exact_in, nocase_in) -> dict:
    bible, lists = builder.bible, builder.lists

    def pin(label: str, phrase: str, what: str, nocase: bool = False) -> str:
        key = builder.passage(label)
        if not (nocase_in if nocase else exact_in)(phrase, label, bible):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")
        return key

    def said(sentence: str, what: str) -> str:
        if sentence not in text:
            raise BuildError(f"{what}: the study does not say {sentence!r}")
        return sentence

    parts = [p["n"] for p in study["parts"]]
    if list(lists.CONCEPT_OF_PART) != parts or list(lists.CONCEPT_OF_PART.values()) != study["concepts"]:
        raise BuildError("CONCEPT_OF_PART must give parts 01-06 the heading's six concepts, in order")

    tests = [{**t, "r": pin(t["ref"], t["offer"], f"test {t['n']}")} for t in lists.TESTS]
    found = verses_with(bible, lists.WRITTEN_SPAN, "written")
    if found != [w["ref"] for w in lists.WRITTEN]:
        raise BuildError(f"WRITTEN must be every verse of {lists.WRITTEN_SPAN} that holds 'written': the Berean has {found}")
    written = []
    for w in lists.WRITTEN:
        if w["test"] not in {t["n"] for t in tests}:
            raise BuildError(f"{w['ref']}: test {w['test']} is not in TESTS")
        pin(w["who_ref"], w["who_words"], f"{w['ref']} speaker")
        _, around = verses_of(bible, w["around"])
        _, source = verses_of(bible, w["source"])
        if not {(c, v) for c, v, _ in source} <= {(c, v) for c, v, _ in around}:
            raise BuildError(f"{w['ref']}: {w['source']} must lie inside the verses printed round it, {w['around']}")
        for phrase in w["shared"]:
            pin(w["ref"], phrase, f"{w['ref']} shared words", nocase=True)
            pin(w["source"], phrase, f"{w['ref']} shared words", nocase=True)
        formula = FORMULA.search(builder.passages[builder.passage(w["ref"])]["verses"][0][1])
        written.append({**w, "r": builder.passage(w["ref"]), "src": builder.passage(w["source"]),
                        "ar": builder.passage(w["around"]), "formula": formula.group(0),
                        "use": said(w["use"], f"{w['ref']} use")})

    uses = lists.USES
    for word, gloss in uses["items"]:
        pin(uses["ref"], word, "four uses")
        said(gloss, f"gloss of {word!r}")
    uses = {**uses, "r": builder.passage(uses["ref"]), "gr": pin(uses["goal_ref"], uses["goal"], "the goal")}

    if lists.READINGS[0]["chosen"] is not None:
        raise BuildError("the study shows both readings of 2 Peter 1:19 without choosing; the page may not choose")
    readings = []
    for item in lists.READINGS:
        for key in ("a", "b") + (("chosen_words",) if item["chosen"] else ()):
            said(item[key], f"reading of {item['ref']}")
        readings.append({**item, "r": pin(item["ref"], item["words"], "two readings")})

    forty = [{"ref": ref, "words": words, "r": pin(ref, words, "forty")} for ref, words in lists.FORTY]
    said(lists.FORTY_SAYS, "forty")
    chapters = len({key.split(":")[0] for key in bible[BOOKS["Deuteronomy"]]})
    marks = [{"chapter": int(w["source"].split(" ")[1].split(":")[0]), "ref": w["source"], "r": w["src"], "test": w["test"]}
             for w in written if w["who"] == "Jesus"]
    if not all(m["ref"].startswith("Deuteronomy ") for m in marks):
        raise BuildError("the study says all three of Jesus' answers come from Deuteronomy; WRITTEN disagrees")
    said("All three of his answers come from Deuteronomy", "Deuteronomy marks")

    clear = {"says": said(lists.CLEAR["says"], "clear"),
             "pair": [{"ref": ref, "words": words, "r": pin(ref, words, "clear")} for ref, words in lists.CLEAR["pair"]]}

    frame = lists.FRAME
    frame = {**frame, "r": pin(frame["ref"], frame["suffer"], "frame"), "says": said(frame["says"], "frame")}
    pin(frame["ref"], frame["rise"], "frame")
    facts = []
    for fact in lists.FACTS:
        if fact["under"] not in ("suffer", "rise"):
            raise BuildError(f"fact {fact['words']!r}: 'under' must be suffer or rise")
        facts.append({**fact, "r": pin(fact["ref"], fact["words"], "Cleopas's facts")})

    opened_at = verses_with(bible, "Luke 24:1–53", "opened")
    if opened_at != [ref for ref, _, _ in lists.OPENED]:
        raise BuildError(f"OPENED must be every verse of Luke 24 that holds 'opened': the Berean has {opened_at}")
    opened = [{"ref": ref, "words": words, "what": what, "r": pin(ref, words, "opened")} for ref, words, what in lists.OPENED]

    numbers = {"written": len(written), "byJesus": sum(w["who"] == "Jesus" for w in written),
               "byDevil": sum(w["who"] != "Jesus" for w in written), "opened": len(opened), "deutChapters": chapters}
    return {"tests": tests, "written": written, "uses": uses, "readings": readings, "forty": forty,
            "deut": {"chapters": chapters, "marks": marks}, "clear": clear, "facts": facts, "frame": frame,
            "opened": opened, "numbers": numbers}


def held_region(website: Path, item: dict) -> str:
    path = (website / item["path"]).resolve()
    if not path.is_relative_to(website.resolve()):
        raise BuildError(f"held source outside the Website folder: {path}")
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    if "section" in item:
        try:
            sections = {s["id"]: s.get("text") or "" for s in json.loads(raw)["sections"]}
        except (ValueError, KeyError) as error:
            raise BuildError(f"could not read the sections of {path.name}: {error}") from error
        if item["section"] not in sections:
            raise BuildError(f"held source {path.name} has no section {item['section']}")
        return re.sub(r"\s+", " ", sections[item["section"]])
    flat = re.sub(r"\s+", " ", raw)
    start = flat.find(item["marker"])
    end = flat.find(item["until"], start + 1)
    if start < 0 or end < 0:
        raise BuildError(f"could not find {item['marker']!r} to {item['until']!r} in {path.name}")
    return flat[start:end]


def found_in(phrase: str, region: str) -> bool:
    phrase, region = fold(phrase), fold(region)
    return any(v in region for v in (phrase, phrase[:1].upper() + phrase[1:], phrase[:1].lower() + phrase[1:]))


def loose(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[,;:]", "", fold(text))).lower()


def check_outside(lists, text: str, website: Path, app_routes: Path, design_dir: Path) -> list:
    """Each held quotation is in its held copy, letter for letter, or differs only in a way pinned in
    KNOWN_DIFFERENCES; every named list entry is still used; every study link resolves on this PC."""
    notes = []
    for phrase, item in lists.HELD_QUOTES.items():
        if f'"{phrase}"' not in text:
            raise BuildError(f"held quotation no longer in the text: {phrase!r}")
        region = held_region(website, item)
        if found_in(phrase, region):
            continue
        if loose(phrase) in loose(region) and phrase in lists.KNOWN_DIFFERENCES:
            notes.append({"quote": phrase, "source": item["source"], "differs": lists.KNOWN_DIFFERENCES[phrase]})
            continue
        if loose(phrase) in loose(region):
            raise BuildError(f"held quotation {phrase[:60]!r} differs from {item['source']} in punctuation or capitals; "
                             f"compare it and record the difference in KNOWN_DIFFERENCES")
        raise BuildError(f"held quotation {phrase[:60]!r} is not in the held copy of {item['source']}")
    for name in ("NOT_HELD_QUOTES", "OWN_TERMS", "PINNED_SHORT"):
        for phrase in getattr(lists, name):
            if f'"{phrase}"' not in text:
                raise BuildError(f"{name} entry the text no longer quotes: {phrase!r}")
    routes = app_routes.read_text(encoding="utf-8")
    for title, href in lists.STUDY_LINKS.items():
        if f"*{title}*" not in text:
            raise BuildError(f"STUDY_LINKS entry the text no longer names: {title!r}")
        if href and href.startswith("/mockups/"):
            if not (design_dir / href.strip("/").split("/", 1)[1] / "index.html").is_file():
                raise BuildError(f"STUDY_LINKS: no mock-up at {href}")
        elif href and f'path="{href}"' not in routes:
            raise BuildError(f"STUDY_LINKS: {href} is not a route of the site")
    return notes
