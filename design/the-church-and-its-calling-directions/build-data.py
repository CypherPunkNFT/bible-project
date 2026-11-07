#!/usr/bin/env python3
"""Build data.js for The church and its calling mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/the-church-and-its-calling-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference; every reference
resolves with no gap; each quoted phrase is in the reference next to it, one paragraph of its named held source, or the named confession list;
commentary quotations sit in their own verse's note; the word list equals exactly a scan of the Berean New Testament for church and churches, use
by use; a use on the house ring is a church meeting at a house; a use on the many ring is the plural or on a named list; the baptism rows and the
named others cover every verse in Acts with baptize or baptism; the page's stated counts are computed. All this proves the words are there and
unaltered. It does not prove that a ring is right, or that a reading is right.
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
LIBRARY = WEBSITE.parent / "sources/library"
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/the-church-and-its-calling/content.md"
BULK = LIBRARY / "bulk/ccel"
CREEDS = WEBSITE / "data/creeds/doc"
# A quotation must fall inside one paragraph of the named files.
HELD = {
    "barnes": [BULK / "barnes_ntnotes.xml"],
    "jfb": [BULK / "jamieson_jfb.xml"],
    "lbc": [CREEDS / "1689-london-baptist-confession-1677.b1.json"],
    "nh": [CREEDS / "new-hampshire-baptist-confession-1833.b1.json"],
    "wcf": [CREEDS / "westminster-confession-of-faith-1647.b1.json", CREEDS / "westminster-confession-of-faith-1647.b2.json"],
    "trent": [CREEDS / "council-of-trent-canons-and-decrees-1563.b1.json", CREEDS / "council-of-trent-canons-and-decrees-1563.b2.json"],
    "luther": [CREEDS / "luthers-small-catechism-1529.b1.json"],
}
ANCHOR_WINDOW = 6000
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "cc-core.js", "cc-hero.js", "cc-word.js", "cc-readings.js", "cc-water.js", "cc-names.js", "cc-lines.js", "cc-questions.js", "cc.js"}
EXPECTED_QUESTIONS = 6
NEW_TESTAMENT_START = "MAT"
HOUSE_USE = re.compile(r"church that meets at (?:their|her|your) house")
WORD_USE = re.compile(r"\b[Cc]hurch(es)?\b")
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BOOKS, BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, load_bible, plain_text, ref_id, typographic, verses_of)  # noqa: E402
from study_lists import (CLOSE, LINES, MANY_SINGULAR, NAMES, QUOTED_CONFESSION, READING_ORDER, RINGS, ROOMS, SOURCE_ANCHORS, SOURCES, WATER, WATER_OTHER, WORD)  # noqa: E402

SOURCE_IDS = {source["id"] for source in SOURCES}
RING_IDS = [ring["id"] for ring in RINGS]


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages = {}
        self.held = {key: [p for path in paths for p in held_paragraphs(path, None, None)] for key, paths in HELD.items()}
        self.whole = {key: " ".join(self.held[key]) for key in ("barnes", "jfb")}
        self.used_confession = set()

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def runs(self, text: str, source: str | None = None) -> list:
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase against the citation beside it."""
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        references = list(REF_RE.finditer(text))
        for match in references:
            self.passage(match.group(0))
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        for quoted in re.finditer(r'"([^"]+)"', text):
            following = next((m for m in references if m.start() >= quoted.end()), None)
            preceding = next((m for m in reversed(references) if m.end() <= quoted.start()), None)
            self.check_quoted(quoted.group(1), [m.group(0) for m in (following, preceding) if m], source, text)
        text = typographic(text)
        out, last = [], 0
        for match in REF_RE.finditer(text):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": self.passage(match.group(0)), "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    def check_quoted(self, phrase: str, references: list, source: str | None, context: str) -> None:
        folded = fold(phrase)
        if any(has_phrase(folded, plain_text(self.bible, reference)) for reference in references):
            return
        if phrase in QUOTED_CONFESSION:
            self.used_confession.add(phrase)
            return
        if source and source in self.held:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_phrase(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
            if source in self.whole:
                self.check_anchor(source, phrase, folded)
            return
        raise BuildError(f"quoted phrase is not in {references!r} and has no other source: {phrase!r}, in: {context[:90]}")

    def check_anchor(self, source: str, phrase: str, folded: str) -> None:
        anchor = SOURCE_ANCHORS.get(phrase)
        if not anchor:
            raise BuildError(f"commentary quote has no anchor to its own verse's note: {phrase!r}")
        text = self.whole[source]
        for match in re.finditer(re.escape(folded), text):
            if anchor in text[max(0, match.start() - ANCHOR_WINDOW):match.start()]:
                return
        raise BuildError(f"{source} quote is not in the note it is cited to ({anchor}): {phrase!r}")


def tagged_block(builder: Builder, line: str) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z0-9-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "open", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind != "source" or source not in builder.held:
        raise BuildError(f"unknown tag or held source: {line[:60]}")
    if source and source not in SOURCE_IDS:
        raise BuildError(f"source is not listed: {source}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source)}


def block_quote(builder: Builder, lines: list, index: int, quote: str) -> tuple:
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quote at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB":
        raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
    if fold(quote).replace('"', "") != plain_text(builder.bible, label):
        raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
    return {"k": "quote", "t": typographic(quote), "r": builder.passage(label), "label": label}, ref_at + 1


KEYS = {
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "WordLead": "wordLead", "WordReads": "wordReads", "WordCare": "wordCare", "ReadingsLead": "readingsLead",
            "WaterLead": "waterLead", "WaterReads": "waterReads", "WaterCare": "waterCare", "NamesLead": "namesLead", "NamesReads": "namesReads", "NamesCare": "namesCare", "RoomLead": "roomLead", "QuestionsLead": "questionsLead"},
    "reading": {"Ask": "ask", "Hook": "hook"},
    "after": {"Consider": "consider", "Reflect": "reflect"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
STRAY_KEY = re.compile(r"[A-Z][\w']*(?: [\w']+){0,2}: ")


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives its keys)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    question = re.fullmatch(r"## Question ([a-z]+): (.+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        holder = {"n": numbered.group(1), "title": typographic(numbered.group(2)), "parts": []}
        study["readings"].append(holder)
        return "reading", holder
    if question:
        holder = {"id": question.group(1), "title": typographic(question.group(2)), "blocks": []}
        study["questions"].append(holder)
        return "question", holder
    if closing:
        study["closing"] = typographic(closing.group(1))
        return "close", study
    raise BuildError(f"heading not recognised: {line}")


def keyed(builder: Builder, zone: str, holder: dict, part: dict | None, line: str) -> None:
    key, sep, value = line.partition(": ")
    if zone == "reading" and sep and part is None and key == "Slug":
        holder["slug"] = value
    elif zone == "reading" and sep and part is None and key == "Read":
        holder["read"] = [{"r": builder.passage(item.strip()), "t": item.strip()} for item in value.split(";")]
    elif zone == "question" and sep and key == "Text":
        holder["text"] = builder.passage(value)
    elif zone == "close" and sep and key == "Passage":
        holder["passage"] = builder.passage(value)
    elif zone == "reading" and sep and key in KEYS["after"]:
        holder[KEYS["after"][key]] = builder.runs(value)
    elif zone != "question" and sep and part is None and key in KEYS[zone]:
        holder[KEYS[zone][key]] = builder.runs(value)
    elif part is not None and not STRAY_KEY.match(line):
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing, or uses a key this section does not allow: {line[:70]}")


def parse(builder: Builder, lines: list) -> dict:
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": [], "questions": []}
    zone, holder, part, index = "top", study, None, 0
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line.startswith("# "):
            study["title"] = typographic(line[2:])
        elif line.startswith("## "):
            zone, holder = heading(study, line)
            part = None
        elif line.startswith("### "):
            if zone != "reading":
                raise BuildError(f"part outside a reading: {line}")
            part = {"title": typographic(line[4:]), "blocks": []}
            holder["parts"].append(part)
        elif line.startswith("> "):
            block, index = block_quote(builder, lines, index, line[2:])
            if zone == "top":
                study["opening"] = block
            elif part is not None:
                part["blocks"].append(block)
            else:
                raise BuildError(f"block quote outside a part: {line[:60]}")
        elif line.startswith("["):
            target = holder["blocks"] if zone == "question" else (part["blocks"] if part is not None else None)
            if target is None:
                raise BuildError(f"tagged paragraph outside a part or question: {line[:60]}")
            target.append(tagged_block(builder, line))
        else:
            keyed(builder, zone, holder, part, line)
    return study


def phrase_in(builder: Builder, pair: tuple) -> dict:
    """A phrase in one verse, whole words. Returns what the page shows."""
    label, words = pair
    _, verses = verses_of(builder.bible, label)
    if len(verses) != 1:
        raise BuildError(f"a phrase must name one verse: {label}")
    if not has_words(fold(words).replace('"', ""), fold(verses[0][2]).replace('"', "")):
        raise BuildError(f"phrase not found, as whole words, in {label}: {words!r}")
    return {"r": builder.passage(label), "label": label, "t": typographic(words)}


def section_of(code: str) -> str:
    return {"MAT": "gospels", "ACT": "acts", "REV": "revelation"}.get(code, "epistles")


def scan_word(bible: dict) -> dict:
    """Every (book code, chapter:verse) in the New Testament with the word, and how many times, read straight from the Berean."""
    found = {}
    for code in CANON[CANON.index(NEW_TESTAMENT_START):]:
        for key, text in bible[code].items():
            uses = WORD_USE.findall(text)
            if uses:
                found[(code, key)] = uses
    return found


def build_word(builder: Builder) -> list:
    """One entry per use. Fails unless the list is exactly what the scan finds."""
    scanned = scan_word(builder.bible)
    listed, out = set(), []
    for label, rings in WORD:
        code, verses = verses_of(builder.bible, label)
        c, v, text = verses[0]
        key = (code, f"{c}:{v}")
        if key in listed:
            raise BuildError(f"listed twice: {label}")
        listed.add(key)
        forms = scanned.get(key)
        if forms is None or len(forms) != len(rings):
            raise BuildError(f"{label} has {len(forms or [])} uses of the word; the list gives {len(rings)}")
        plural = sum(1 for form in forms if form)
        many = rings.count("many")
        if many != plural and not (label in MANY_SINGULAR and many == 1 and plural == 0):
            raise BuildError(f"{label}: {plural} plural uses but {many} on the many ring, and it is not on the named list")
        if rings.count("house") != len(HOUSE_USE.findall(text)):
            raise BuildError(f"{label}: the house ring must be exactly the uses of a church meeting at a house")
        for ring in rings:
            if ring not in RING_IDS:
                raise BuildError(f"unknown ring {ring} on {label}")
            out.append({"ring": ring, "r": builder.passage(label), "label": label, "sec": section_of(code), "t": typographic(text), "close": typographic(CLOSE[label]) if label in CLOSE else None})
    missing = set(scanned) - listed
    if missing:
        raise BuildError(f"the word list misses verses the Berean has: {sorted(missing)[:6]}")
    previous = None
    for label, _ in WORD:
        code, verses = verses_of(builder.bible, label)
        here = (CANON.index(code), verses[0][0], verses[0][1])
        if previous and here <= previous:
            raise BuildError(f"the word list is out of Bible order at {label}")
        previous = here
    if not set(CLOSE) <= {label for label, _ in WORD}:
        raise BuildError("a close call names a verse that is not in the word list")
    return out


def build_water(builder: Builder) -> list:
    rows, covered = [], set()
    for row in WATER:
        before, water = phrase_in(builder, row["before"]), phrase_in(builder, row["water"])
        covered |= {pair[0].split(" ")[1] for pair in (row["before"], row["water"])}
        rows.append({"id": row["id"], "who": typographic(row["who"]), "before": before, "water": water, "open": typographic(row["open"]) if row.get("open") else None})
    told = {key for key, text in builder.bible["ACT"].items() if re.search(r"baptiz|baptism", text, re.I)}
    uncovered = told - covered - WATER_OTHER
    if uncovered or not WATER_OTHER <= told:
        raise BuildError(f"Acts baptism verses not accounted for: {sorted(uncovered)}; named others that do not mention it: {sorted(WATER_OTHER - told)}")
    return rows


def build_names(builder: Builder) -> list:
    out, last = [], -1
    joined = fold(plain_text(builder.bible, "1 Peter 2:9–10"))
    for item in NAMES:
        name, old = phrase_in(builder, item["name"]), phrase_in(builder, item["old"])
        at = joined.find(fold(item["name"][1]))
        if at <= last:
            raise BuildError(f"the six phrases must follow the verses' order: {item['name'][1]}")
        last = at
        if item["how"] == "Same words" and fold(item["shared"]) != fold(item["old"][1]):
            raise BuildError(f"{item['id']} says same words, and they differ")
        if item.get("shared") and not (has_words(fold(item["shared"]), fold(item["name"][1])) and has_words(fold(item["shared"]), fold(item["old"][1]))):
            raise BuildError(f"{item['id']} does not share {item['shared']!r}")
        out.append({"id": item["id"], "name": name, "old": old, "how": item["how"], "said": typographic(item["said"]),
                    "oldVerse": typographic(plain_text(builder.bible, item["old"][0]))})
    return out


def build_lines(builder: Builder) -> list:
    return [{"id": line["id"], "r": builder.passage(line["verse"]), "label": line["verse"], "t": typographic(plain_text(builder.bible, line["verse"])), "alone": typographic(line["alone"]),
             "room": phrase_in(builder, line["room"]), "answer": builder.runs(line["answer"])} for line in LINES]


def check_code() -> None:
    """The only markup strings allowed are the fixed drawings. Missing page files, inline scripts or handlers fail the build."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: missing {sorted(EXPECTED_JS - found)}, extra {sorted(found - EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function", "javascript:"):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "cc-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in cc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def check_complete(study: dict) -> None:
    required = {"slug", "ask", "hook", "read", "consider", "reflect"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if [r["slug"] for r in study["readings"]] != READING_ORDER or set(ROOMS) != set(READING_ORDER):
        raise BuildError("the readings and rooms must follow READING_ORDER")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def figures(study: dict, word: list, water: list, names: list, lines: list) -> dict:
    """The counts the page states. The prose says some of them in words, so each is tested here."""
    counts = {ring: sum(1 for use in word if use["ring"] == ring) for ring in RING_IDS}
    in_two = sum(1 for use in word if use["ring"] == "all" and use["label"].split(" ")[0] in ("Ephesians", "Colossians"))
    if counts["house"] != 4:
        raise BuildError("the ring's line says the house ring has four uses")
    if in_two * 2 <= counts["all"]:
        raise BuildError("the page says most uses on the widest ring are in Ephesians and Colossians")
    open_rows = [row for row in water if row["open"]]
    if len(water) != 10 or len(open_rows) != 1 or open_rows[0]["id"] != "lydia":
        raise BuildError("the page says ten baptisms, nine with something named before the water, and Lydia's household the one left open")
    if len(names) != 6 or len(lines) != 3 or len(study["readings"]) != 6:
        raise BuildError("the page says six phrases, three lines and six readings")
    verses = len({use["label"] for use in word})
    return {"uses": len(word), "verses": verses, "rings": counts, "people": counts["house"] + counts["place"] + counts["many"], "close": sum(1 for use in word if use["close"]), "closeVerses": len(CLOSE),
            "inTwo": in_two, "baptisms": len(water), "questions": len(study["questions"]), "readings": len(study["readings"])}


def fingerprints() -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    held = [path for paths in HELD.values() for path in paths]
    paths = {CONTENT, HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *held, *(BSB / f"{code}.json" for code in CANON)}
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}


def build_payload() -> tuple:
    builder = Builder(load_bible())
    study = parse(builder, CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n").split("\n"))
    check_complete(study)
    check_code()
    check_sources()
    rooms = {slug: [{**phrase_in(builder, (ref, words)), "note": typographic(note)} for ref, words, note in items] for slug, items in ROOMS.items()}
    word, water, names, lines = build_word(builder), build_water(builder), build_names(builder), build_lines(builder)
    numbers = figures(study, word, water, names, lines)
    if QUOTED_CONFESSION - builder.used_confession:
        raise BuildError(f"listed confession phrases are not used on the page: {sorted(QUOTED_CONFESSION - builder.used_confession)}")
    for source in SOURCES:
        source["name"], source["note"] = typographic(source["name"]), typographic(source["note"])
    data = {"schema": 1, "study": study, "rings": [{**ring, "line": typographic(ring["line"]), "name": typographic(ring["name"])} for ring in RINGS], "word": word, "rooms": rooms, "water": water, "waterOther": [{"r": builder.passage(f"Acts {key}"), "t": f"Acts {key}"} for key in sorted(WATER_OTHER, key=lambda k: [int(n) for n in k.split(":")])], "names": names, "lines": lines, "books": BOOKS,
            "passages": builder.passages, "sources": SOURCES, "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.CC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages)


def write_atomically(target: Path, payload: str) -> None:
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    check_only = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check_only:
        print(f"build-data: FAILED: expected no arguments or --check, received {sys.argv[1:]}", file=sys.stderr)
        return 2
    try:
        payload, numbers, passage_count = build_payload()
        target = HERE / "data.js"
        if check_only:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != payload:
                print(f"build-data: STALE: {target} does not match what its inputs build. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            write_atomically(target, payload)
    except (BuildError, OSError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
