#!/usr/bin/env python3
"""Build data.js for the Who do you say that I am mock-up from the study's content.md, study_lists.py and the Berean text.

Run from Website/: python design/who-do-you-say-that-i-am-directions/build-data.py   (exit 1 and no data.js change if any check fails)
  --check   run the same checks and fail if data.js is not what its inputs build now. Writes nothing.
  --links   also report whether each linked mock-up folder exists. Advisory only: other jobs change those folders.

Checks: every content.md line is placed by a closed set of rules; block quotations are the whole Berean text of their reference; every reference resolves;
each quotation is in the reference its own sentence gives, or the block quotation above it in its part, or on a closed list (a held commentary under its heading
and in the note of its verse, a held creed, the confession with its article, a gloss); each wall line is in its one verse, inside the speech credited to its
speaker; a word's lines are found by search and must equal the list; every number written as a word is checked or listed; what the text says is absent, or only
in one Gospel, is searched for with a control; faults found in the text stay listed until the text is fixed. See build_selftest.py for wrong inputs refused.
This proves the words are there, or are not. It does not prove who a speaker is, that a line is in the right group, or that a reading is right.
"""
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
BULK = WEBSITE.parent / "sources/library/bulk/ccel"
CREEDS = WEBSITE / "data/creeds/doc"
CONTENT = WEBSITE / "content/studies/jesus-christ/who-do-you-say-that-i-am/content.md"
HELD = {"barnes": [BULK / "barnes_ntnotes.xml"], "jfb": [BULK / "jamieson_jfb.xml"], "maclaren": [BULK / "maclaren_matt2.xml", BULK / "maclaren_john2.xml"], "boyce": [BULK / "boyce_theology.xml"],
        "vatican": [CREEDS / "vatican-council-dogmatic-decrees-1870.b1.json"], "nicene": [CREEDS / "nicene-creed-381.b1.json"], "chalcedon": [CREEDS / "chalcedonian-definition-451-schaff.b1.json"]}
EXPECTED_JS = {"theme.js", "art.js", "wy-core.js", "wy-hero.js", "wy-wall.js", "wy-forms.js", "wy-readings.js", "wy-questions.js", "wy.js"}
SCHEMA = 2
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import BSB, CANON, REF_RE, BuildError, fold, held_paragraphs, load_bible, plain_text, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402
from content_parse import Text, clean, has_phrase, parse  # noqa: E402

WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve"}
NUMBER_WORD = re.compile(r"\b(" + "|".join(word for word in WORDS.values() if word != "one") + r")\s+[\w']+", re.I)
LEFTOVER = re.compile(r"\bsw-|SWK|signs and works|wy-changed|changedLead|pairsLead", re.I)


def speeches(verse: str) -> list:
    """The quoted speeches in a verse, in order, by its curly double quotes. A closing mark with no opener means the speech began before this verse."""
    out, start = [], None
    if verse.find("”") != -1 and (verse.find("“") == -1 or verse.find("”") < verse.find("“")):
        start = 0
    for index, mark in enumerate(verse):
        if mark == "“" and start is None:
            start = index + 1
        elif mark == "”" and start is not None:
            out.append(verse[start:index])
            start = None
    if start is not None:
        out.append(verse[start:])
    return out


def verse_key(label: str) -> tuple:
    match = REF_RE.fullmatch(label)
    return int(match.group(2)), int(match.group(3))


def phrase(text: Text, pair: tuple) -> dict:
    """A phrase in one verse, whole words."""
    if not (isinstance(pair, tuple) and len(pair) == 2 and all(isinstance(item, str) for item in pair) and REF_RE.fullmatch(pair[0])):
        raise BuildError(f"expected (one verse, its words), received {pair!r}")
    label, words = pair
    _, verses = verses_of(text.bible, label)
    if len(verses) != 1:
        raise BuildError(f"a phrase must name one verse: {label}")
    if not has_phrase(clean(words), clean(verses[0][2])):
        raise BuildError(f"phrase not found, as whole words, in {label}: {words!r}")
    return {"r": text.passage(label), "label": label, "t": typographic(words)}


def tagged(text: Text, triple: tuple) -> dict:
    who, label, words = triple
    return {"who": typographic(who), **phrase(text, (label, words))}


def build_answers(text: Text) -> list:
    groups, seen, out = {group["id"] for group in L.GROUPS}, set(), []
    for item in L.ANSWERS:
        if item["id"] in seen or item["group"] not in groups or item["how"] not in L.HOW:
            raise BuildError(f"{item['id']}: id given twice, or unknown group or way of saying")
        seen.add(item["id"])
        said = phrase(text, (item["ref"], item["words"]))
        if not item["narrated"]:
            spoken = speeches(verses_of(text.bible, item["ref"])[1][0][2])
            if item["span"] >= len(spoken) or not has_phrase(clean(item["words"]), clean(spoken[item["span"]])):
                raise BuildError(f"{item['id']}: the words are in {item['ref']} but not in the speech credited to {item['who']}: {spoken}")
        read = text.passage(item["read"])
        keys = {(verse["c"], verse["v"]) for verse in text.passages[read]["verses"]}
        if verse_key(item["ref"]) not in keys:
            raise BuildError(f"{item['id']}: the passage {item['read']} does not hold its answer at {item['ref']}")
        following = None
        if item["next"] is not None:
            following = phrase(text, item["next"])
            if verse_key(item["next"][0]) not in keys or verse_key(item["next"][0]) < verse_key(item["ref"]):
                raise BuildError(f"{item['id']}: what came next, at {item['next'][0]}, is outside {item['read']} or before the answer")
        out.append({"id": item["id"], "group": item["group"], "who": typographic(item["who"]), "how": item["how"], "howLabel": L.HOW[item["how"]], "t": said["t"], "r": said["r"], "label": said["label"], "next": following, "read": read})
    for group in L.GROUPS:
        if not any(entry["group"] == group["id"] for entry in out):
            raise BuildError(f"group {group['id']} has no answers")
    return out


def build_lenses(answers: list) -> list:
    by, lenses = {entry["id"]: entry for entry in answers}, []
    for lens in L.WORD_LENSES:
        pattern = re.compile(lens["pattern"])
        found = {entry["id"] for entry in answers if pattern.search(fold(entry["t"]))}
        if found != lens["expect"]:
            raise BuildError(f"word {lens['id']}: search found {sorted(found)}, the list says {sorted(lens['expect'])}")
        if any(pattern.search(control) for control in lens["never"]):
            raise BuildError(f"word {lens['id']}: the search wrongly finds one of {lens['never']}")
        lenses.append({"id": lens["id"], "label": lens["label"], "ids": sorted(found), "groups": len({by[i]["group"] for i in found}), "stated": sum(by[i]["how"] == "said" for i in found)})
    return lenses


def build_forms(text: Text, study: dict) -> dict:
    F, forms = L.FORMS, {}
    for label in L.SECOND_QUESTION_AT:
        if L.SECOND_QUESTION not in clean(plain_text(text.bible, label)):
            raise BuildError(f"the text says the second question is the same in all three Gospels; it is not at {label}")
    rows = [key for key, _ in F["road"]["rows"]]
    forms["road"] = {**F["road"], "columns": [{"book": column["book"], **{key: phrase(text, column[key]) for key in rows}} for column in F["road"]["columns"]]}
    turn = F["turn"]
    gap = verse_key(turn["rebuked"])[1] - verse_key(turn["blessed"])[1]
    if not turn["name"].lower().startswith(WORDS[gap]):
        raise BuildError(f"the turn's name says {turn['name']!r}, and the gap is {gap} verses")
    forms["turn"] = {"kind": turn["kind"], "name": turn["name"], "steps": [tagged(text, step) for step in turn["steps"]]}
    council = F["council"]
    forms["council"] = {**{key: council[key] for key in ("kind", "name", "witnessesTitle")}, "steps": [tagged(text, step) for step in council["steps"]], "witnesses": [tagged(text, item) for item in council["witnesses"]]}
    voice = F["voice"]
    if voice["added"] in clean(plain_text(text.bible, voice["first"][0])) or voice["added"] not in clean(plain_text(text.bible, voice["second"][0])):
        raise BuildError("the form says the second sentence adds Listen to Him! and the first does not have it")
    if any(voice["shared"] not in pair[1] for pair in (voice["first"], voice["second"])):
        raise BuildError("the shared words are not in both sentences")
    forms["voice"] = {**{key: voice[key] for key in ("kind", "name", "firstPlace", "secondPlace", "shared", "added")}, "first": phrase(text, voice["first"]), "second": phrase(text, voice["second"]), "others": [phrase(text, item) for item in voice["others"]]}
    forms["word"] = build_ledger(text, study)
    thomas = F["thomas"]
    forms["thomas"] = {**{key: thomas[key] for key in ("kind", "name", "leftTitle", "rightTitle", "note")}, "rows": [[phrase(text, left), phrase(text, right)] for left, right in thomas["rows"]], "result": phrase(text, thomas["result"])}
    written = F["written"]
    keys = [verse_key(stop[1]) for stop in written["stops"]]
    if keys != sorted(keys):
        raise BuildError("John's answers are not in the order of his book")
    forms["written"] = {"kind": written["kind"], "name": written["name"], "stops": [tagged(text, stop) for stop in written["stops"]], "last": written["last"]}
    return forms


def build_ledger(text: Text, study: dict) -> dict:
    """Part 05: who says it, and to whom. Every verse must be one the reading itself prints or names; the church rows are checked against their own sources."""
    ledger = L.FORMS["word"]
    reading = next(r for r in study["readings"] if r["slug"] == "word")
    held = set()
    for block in [*reading["intro"], *(b for part in reading["parts"] for b in part["blocks"])]:
        for run in [*block.get("runs", []), *(r for item in block.get("items", []) for r in item)]:
            if isinstance(run, dict) and "r" in run:
                held.add(run["r"])
        if block["k"] == "quote":
            held.add(block["r"])
    held |= {item["r"] for item in reading["read"]}
    inside = {(text.passages[key]["code"], v["c"], v["v"]) for key in held for v in text.passages[key]["verses"]}
    rows = []
    for row in ledger["rows"]:
        said = [phrase(text, pair) for pair in row["said"]]
        for item in said:
            if (text.passages[item["r"]]["code"], *verse_key(item["label"])) not in inside:
                raise BuildError(f"the ledger quotes {item['label']}, which reading 05 neither prints nor names")
        if row["gold"] and not any(re.search(rf"\b{row['gold']}\b", item["t"]) for item in said):
            raise BuildError(f"the ledger lights {row['gold']!r}, which is not in its row")
        rows.append({"who": row["who"], "said": said, "gold": row["gold"]})
    for who, words in ledger["church"]:
        if words not in L.QUOTED_CONFESSION and words not in L.OUTSIDE_QUOTES:
            raise BuildError(f"a church row is not on a checked list: {words!r}")
    closing = next((b for part in reading["parts"] for b in part["blocks"] if b["k"] == "p" and ledger["closing"].replace("*", "") in "".join(r if isinstance(r, str) else r.get("t") or r.get("i") or "" for r in b["runs"])), None)
    if closing is None:
        raise BuildError(f"the ledger ends on a sentence the text no longer has: {ledger['closing']!r}")
    return {"kind": "ledger", "name": ledger["name"], "rows": rows, "churchTitle": ledger["churchTitle"], "church": [{"who": who, "t": typographic(words)} for who, words in ledger["church"]], "closing": text.split(ledger["closing"])}


def check_claims(text: Text, raw: str) -> None:
    """What the text says is absent, or only in one Gospel, searched for, with each pattern proved able to find its words where they are."""
    for item in L.ABSENT_BOOKS:
        pattern = re.compile(item["pattern"])
        if item["says"] not in raw or not pattern.search(clean(plain_text(text.bible, item["control"]))):
            raise BuildError(f"the text no longer says {item['says']!r}, or its search cannot find its control {item['control']}")
        for code in item["books"]:
            for place, verse in text.bible[code].items():
                if pattern.search(clean(verse)):
                    raise BuildError(f"the text says {item['says']!r}, and it is at {code} {place}")
    for item in L.ABSENT_RANGES:
        pattern = re.compile(item["pattern"], re.I)
        if item["says"] not in raw or not pattern.search(clean(plain_text(text.bible, item["control"]))):
            raise BuildError(f"the text no longer says {item['says']!r}, or its search cannot find its control {item['control']}")
        if pattern.search(clean(plain_text(text.bible, item["label"]))):
            raise BuildError(f"the text says {item['says']!r}, and {item['pattern']!r} is in {item['label']}")
    for claim in L.ONLY_CLAIMS:
        pattern = re.compile(claim["pattern"])
        if claim["says"] not in raw:
            raise BuildError(f"the text no longer says {claim['says']!r}; take it off ONLY_CLAIMS")
        if not all(pattern.search(plain_text(text.bible, label)) for label in claim["in"]):
            raise BuildError(f"the text says {claim['says']!r}, and the words are not in {claim['in']}")
        if any(pattern.search(plain_text(text.bible, label)) for label in claim["not_in"]):
            raise BuildError(f"the text says {claim['says']!r}, and the words are in one of {claim['not_in']}")
    for words, slug in L.PART_MENTIONS.items():
        number = re.search(r"\d\d", words).group(0)
        if words not in raw or next(s for n, _, s in L.READINGS if n == number) != slug:
            raise BuildError(f"the text's pointer {words!r} is gone, or names a part that is not {slug}")


def computed_counts(study: dict) -> dict:
    habit = study["raw"]["habit"]
    asked = habit.split("ask four things", 1)[-1].split("The Gospels")[0]
    intro = next(r for r in study["readings"] if r["slug"] == "word")["intro"]
    return {"habitQuestions": len(re.findall(r"[A-Z][^.?!]*\?", asked)), "titles": len(study["titles"]),
            "roadColumns": len(L.FORMS["road"]["columns"]), "secondQuestion": len(L.SECOND_QUESTION_AT),
            "turnGap": verse_key(L.FORMS["turn"]["rebuked"])[1] - verse_key(L.FORMS["turn"]["blessed"])[1],
            "churchWords": sum(1 for block in intro for run in block.get("runs", []) if isinstance(run, dict) and "b" in run), "bfmWords": len("fully God, fully man".split())}


def check_counts(text: Text, raw: str, study: dict) -> set:
    """Every number written as a word is on COUNTS and checked there. Returns the known issues it confirmed."""
    covered, confirmed, numbers = [], set(), computed_counts(study)
    for key, rule in L.COUNTS.items():
        places = [m.start() for m in re.finditer(re.escape(key), raw)]
        if not places:
            raise BuildError(f"COUNTS lists {key!r}, which the text no longer has")
        covered += [(start, start + len(key)) for start in places]
        value = next(number for number, word in WORDS.items() if re.search(rf"\b{word}\b", key, re.I))
        kind = rule[0]
        if kind == "computed" and numbers[rule[1]] != value:
            raise BuildError(f"the text says {key!r}, and this build counts {numbers[rule[1]]}")
        if kind == "verse" and not has_phrase(clean(rule[2]), clean(plain_text(text.bible, rule[1]))):
            raise BuildError(f"the text says {key!r}, and {rule[1]} does not say {rule[2]!r}")
        if kind == "known":
            scenes = [r for r in study["readings"] if r["slug"] != "word"]
            if rule[1] not in L.KNOWN_ISSUES or len(scenes) == value:
                raise BuildError(f"{key!r}: the known issue {rule[1]} is not listed, or is no longer true; remove it")
            confirmed.add(rule[1])
    for match in NUMBER_WORD.finditer(raw):
        if not any(start <= match.start() < end for start, end in covered):
            raise BuildError(f"a number in the text is not on COUNTS, so nothing checks it: {match.group(0)!r}")
    return confirmed


def check_notes(text: Text, confirmed: set) -> None:
    """Every [check: ...] note is on CHECK_NOTES, with what this build did. None shows on the page."""
    found = {note for note, _, _, _ in text.notes}
    if found != set(L.CHECK_NOTES):
        raise BuildError(f"check notes differ from CHECK_NOTES: {sorted(found ^ set(L.CHECK_NOTES))}")
    for note, _source, held, issues in text.notes:
        status = L.CHECK_NOTES[note]
        if status == "verified" and not held:
            raise BuildError(f"CHECK_NOTES says {note!r} is verified, and no quotation in its line passed a held-source check")
        if status == "mismatch" and not issues & set(L.KNOWN_ISSUES):
            raise BuildError(f"CHECK_NOTES says {note!r} found a mismatch, and no known issue was confirmed in its line")
    seen = confirmed | text.issues_seen
    if seen != set(L.KNOWN_ISSUES):
        raise BuildError(f"KNOWN_ISSUES entries not confirmed by this build, so no longer true: {sorted(set(L.KNOWN_ISSUES) - seen)}")


def check_complete(study: dict, text: Text) -> None:
    if [r["slug"] for r in study["readings"]] != [slug for _, _, slug in L.READINGS]:
        raise BuildError("the readings are not the expected ones, in order")
    for reading in study["readings"]:
        for key in ("read", "hook", "consider", "reflect"):
            if key not in reading:
                raise BuildError(f"reading {reading['n']} lacks {key}")
    if not study["questions"] or any("text" not in q or not q["blocks"] for q in study["questions"]):
        raise BuildError("a question lacks its passage or its reading")
    for key in ("title", "subtitle", "concepts", "motto", "lead", "habit", "stance", "selection", "words", "titles", "opening", "close", "way", "invite", "question", "again", "passage", "closing"):
        if not study.get(key):
            raise BuildError(f"content.md lacks {key}")
    habit = study["raw"]["habit"]
    for label in (L.READOUT_LABELS["who"], L.READOUT_LABELS["words"]):
        if label not in habit:
            raise BuildError(f"the readout label {label!r} is not one of the Habit's questions")
    unused = (set(L.GLOSSES) | set(L.MENTIONS) | set(L.IMPLIED) | set(L.QUOTED_CONFESSION) | set(L.OUTSIDE_QUOTES) | set(L.SOURCE_PLACES)) - text.used
    if unused:
        raise BuildError(f"listed phrases are not used by the text: {sorted(unused)}")
    for title, href in L.STUDY_LINKS.items():
        if not href.startswith(("../", "/study/")) or "//" in href or ".." in href[3:]:
            raise BuildError(f"study link leaves the site: {title}: {href}")
    for source in L.SOURCES:
        if not source["href"].startswith(("https://", "/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}")


def check_code() -> None:
    """The one innerHTML is in wy-core.js, for the fixed drawings. No inline script, the scripts index.html loads are exactly the js folder, nothing left over."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    page = (HERE / "index.html").read_text(encoding="utf-8")
    loaded = set(re.findall(r'<script src="js/([\w-]+\.js)"', page))
    if found != EXPECTED_JS or loaded != EXPECTED_JS:
        raise BuildError(f"page scripts differ from the expected list: folder {sorted(found ^ EXPECTED_JS)}, index.html {sorted(loaded ^ EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        code = path.read_text(encoding="utf-8")
        allowed = 1 if path.name == "wy-core.js" else 0
        if code.count(".innerHTML") != allowed or "eval(" in code or "document.write" in code or LEFTOVER.search(code):
            raise BuildError(f"{path.name} uses innerHTML, a banned call, or holds something left from an earlier page")
    if LEFTOVER.search((HERE / "css/wy.css").read_text(encoding="utf-8")):
        raise BuildError("wy.css holds something left from an earlier page")
    if re.search(r"\$\{|<script|\bon[a-z]+=", (HERE / "js/art.js").read_text(encoding="utf-8")):
        raise BuildError("art.js must hold fixed drawings only")
    if re.search(r"\bon[a-z]+=", page) or re.search(r"<script(?![^>]*\bsrc=)", page):
        raise BuildError("index.html has inline script or a handler")
    if f"EXPECTED_SCHEMA = {SCHEMA};" not in (HERE / "js/wy-core.js").read_text(encoding="utf-8"):
        raise BuildError(f"wy-core.js does not expect schema {SCHEMA}")


def fingerprints(content: bytes) -> dict:
    """Only this study's own inputs and the fixed held books. The shared creeds folder is left out: a change there that matters changes data.js itself."""
    books = [path for key, paths in HELD.items() if key in ("barnes", "jfb", "maclaren", "boyce") for path in paths]
    paths = {HERE / "build-data.py", HERE / "study_lists.py", HERE / "content_parse.py", HERE / "scripture_text.py", *books, *(BSB / f"{code}.json" for code in CANON)}
    out = {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
    out[CONTENT.relative_to(WEBSITE.parent).as_posix()] = hashlib.sha256(content).hexdigest()
    return out


def tidy(paragraph: str) -> str:
    """Stripped italics leave a space before punctuation in the held notes. Close it so a quotation can be compared."""
    return re.sub(r"\s+", " ", re.sub(r"\s+([,.;:!?])", r"\1", paragraph))


def load_held() -> dict:
    return {key: [tidy(p) for path in paths for p in held_paragraphs(path, None, None)] for key, paths in HELD.items()}


def build_payload(raw_bytes: bytes | None = None, bible: dict | None = None, held: dict | None = None) -> tuple:
    text = Text(bible or load_bible(), held or load_held())
    raw_bytes = CONTENT.read_bytes() if raw_bytes is None else raw_bytes
    raw = raw_bytes.decode("utf-8-sig").replace("\r\n", "\n")
    answers = build_answers(text)
    lenses = build_lenses(answers)
    study = parse(text, raw)
    check_complete(study, text)
    check_claims(text, raw)
    confirmed = check_counts(text, raw, study)
    check_notes(text, confirmed)
    check_code()
    forms = build_forms(text, study)
    study.pop("raw")
    son = next(lens for lens in lenses if lens["id"] == "son")
    numbers = {"answers": len(answers), "groups": len(L.GROUPS), "readings": len(study["readings"]), "questions": len(study["questions"]), "son": len(son["ids"]), "sonGroups": son["groups"]}
    words = {key: WORDS.get(value, str(value)) for key, value in numbers.items()}
    sources = [{**source, "name": typographic(source["name"]), "note": typographic(source["note"])} for source in L.SOURCES]
    data = {"schema": SCHEMA, "study": study, "groups": L.GROUPS, "answers": answers, "lenses": lenses, "readout": L.READOUT_LABELS, "forms": forms, "readingForms": L.READING_FORMS,
            "related": [list(item) for item in L.RELATED], "numbers": numbers, "words": words, "passages": text.passages, "sources": sources, "builtFrom": fingerprints(raw_bytes)}
    return "window.WY = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", numbers, len(text.passages)


def write_atomically(target: Path, payload: str) -> None:
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def report_links() -> None:
    for title, href in L.STUDY_LINKS.items():
        if href.startswith("../"):
            state = "exists" if (HERE.parent / href[3:] / "index.html").is_file() else "MISSING (advisory)"
            print(f"  link {title!r} -> {href}: {state}")


def main() -> int:
    args = sys.argv[1:]
    if any(arg not in ("--check", "--links") for arg in args):
        print(f"build-data: FAILED: expected no arguments, --check or --links, received {args}", file=sys.stderr)
        return 2
    try:
        payload, numbers, passage_count = build_payload()
        target = HERE / "data.js"
        if "--check" in args:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != payload:
                print(f"build-data: STALE: {target} does not match what its inputs build. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            write_atomically(target, payload)
    except (BuildError, OSError, ValueError, KeyError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--links" in args:
        report_links()
    print(f"build-data: {'current' if '--check' in args else 'ok'}. {numbers}; {passage_count} passages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
