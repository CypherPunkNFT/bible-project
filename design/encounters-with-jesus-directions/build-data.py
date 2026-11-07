#!/usr/bin/env python3
"""Build data.js for the Encounters with Jesus mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/encounters-with-jesus-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference; every reference resolves
with no gap; each quoted phrase is in the reference that cites it, one paragraph of its named held source after its anchor, or the named confession list with
its article; each phrase on a meeting is in a verse inside that meeting's own passage; table counts are computed and written in by this script; a count typed
beside a counted noun fails; details this study says are absent are searched for, with controls proving the search can see such words. All this proves the
words are there, or are not. It does not prove that a meeting is in the right cell or that a reading is right.
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
CONTENT = WEBSITE / "content/studies/jesus-christ/encounters-with-jesus/content.md"
PEOPLE = WEBSITE / "data/study/people"
HELD = {"barnes": [BULK / "barnes_ntnotes.xml"], "jfb": [BULK / "jamieson_jfb.xml"], "maclaren": [BULK / "maclaren_mark.xml", BULK / "maclaren_luke.xml", BULK / "maclaren_john1.xml"]}
ANCHOR_WINDOW = 9000
ANCHOR_AFTER = 300  # a sermon may name the verse just after the sentence quoted
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "en-core.js", "en-hero.js", "en-grid.js", "en-readings.js", "en-forms.js", "en-after.js", "en-test.js", "en-questions.js", "en.js"}
EXPECTED_QUESTIONS = 5
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BOOKS, BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, load_bible, plain_text, ref_id, typographic, verses_of)  # noqa: E402
from study_lists import (ABSENT, CARRY, COLUMNS, CONTROLS, FORMS, GROUP_ART, GROUP_ORDER, MEETINGS, OLDER, QUOTED_CONFESSION, RELATED, ROWS, SOURCE_ANCHORS, SOURCES, TEST, VERDICTS)  # noqa: E402

WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen"}
TYPED_COUNT = re.compile(r"\b(?:" + "|".join(WORDS.values()) + r")\s+(?:meetings?|groups?|questions?|retellings?|sayings|things often)\b", re.I)
ARTICLE_NEAR = re.compile(r"\s*\(Article (\d+)\)")
KING_JAMES = re.compile(r"\b(?:thee|thou|thy|thine|unto|saith|hath|ye)\b")


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


def clean(text: str) -> str:
    return fold(text).replace('"', "")


def tidy_held(text: str) -> str:
    """Stripped italics leave a space before punctuation in the held notes ("By water , here,"). Close it so a quotation can be compared."""
    return re.sub(r"\s+([,.;:!?])", r"\1", text)


def word_of(value: int) -> str:
    if value not in WORDS:
        raise BuildError(f"no word for the count {value}")
    return WORDS[value]


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages = {}
        self.held = {key: [tidy_held(p) for path in paths for p in held_paragraphs(path, None, None)] for key, paths in HELD.items()}
        self.whole = {key: re.sub(r"\s+", " ", " ".join(paragraphs)) for key, paragraphs in self.held.items()}
        self.used_confession = set()
        self.counts = {}

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}), "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def fill(self, text: str) -> str:
        """Counts in the study's text are named, never typed, so they cannot drift from the lists."""
        def one(match: re.Match) -> str:
            if match.group(1) not in self.counts:
                raise BuildError(f"content.md names a count this build does not compute: {match.group(1)}")
            return str(self.counts[match.group(1)])
        return re.sub(r"\{\{(\w+)\}\}", one, text)

    def runs(self, text: str, source: str | None = None, extra: str | None = None) -> list:
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase against the citation that goes with it."""
        text = self.fill(text)
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        if KING_JAMES.search(re.sub(r'"[^"]*"', "", text)):
            raise BuildError(f"older wording in the site's own voice: {text[:90]}")
        references = list(REF_RE.finditer(text))
        for match in references:
            self.passage(match.group(0))
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        for quoted in re.finditer(r'"([^"]+)"', text):
            self.check_quoted(quoted, text, self.citing(references, quoted, text, extra), source)
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

    @staticmethod
    def citing(references: list, quoted: re.Match, text: str, extra: str | None) -> list:
        """A reference after the quotation in its own sentence cites it. With none, the one before does. A further reference proves nothing."""
        following = next((m for m in references if m.start() >= quoted.end()), None)
        if following and not re.search(r"[.!?]\s+[A-Z]", text[quoted.end():following.start()]):
            return [following.group(0)]
        preceding = next((m for m in reversed(references) if m.end() <= quoted.start()), None)
        found = [m.group(0) for m in (preceding, following) if m]
        return [*found, extra] if extra else found

    def check_quoted(self, quoted: re.Match, text: str, references: list, source: str | None) -> None:
        phrase = quoted.group(1)
        folded = fold(phrase)
        if any(has_phrase(folded, clean(plain_text(self.bible, reference))) for reference in references):
            return
        if phrase in QUOTED_CONFESSION:
            near = ARTICLE_NEAR.match(text[quoted.end():])
            if not near or near.group(1) != QUOTED_CONFESSION[phrase]:
                raise BuildError(f"confession phrase is not cited to its own article {QUOTED_CONFESSION[phrase]}: {phrase!r}")
            self.used_confession.add(phrase)
            return
        if source and source in self.held:
            self.check_held(source, phrase, folded)
            return
        raise BuildError(f"quoted phrase is not in {references!r} and has no other source: {phrase!r}, in: {text[:90]}")

    def check_held(self, source: str, phrase: str, folded: str) -> None:
        if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
            raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
        if not any(has_phrase(folded, re.sub(r"\s+", " ", paragraph)) for paragraph in self.held[source]):
            raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
        anchor = SOURCE_ANCHORS.get(phrase)
        if not anchor:
            raise BuildError(f"commentary quote has no anchor to its own verse's note: {phrase!r}")
        text = self.whole[source]
        places = [match.start() for match in re.finditer(re.escape(folded), text)]
        if len(places) != 1:
            raise BuildError(f"{source} quote must occur once in the file, found {len(places)}: {phrase!r}")
        if fold(anchor) not in text[max(0, places[0] - ANCHOR_WINDOW):places[0] + len(folded) + ANCHOR_AFTER]:
            raise BuildError(f"{source} quote is not in the note it is cited to ({anchor}): {phrase!r}")

    def phrase(self, pair: tuple, within: str | None = None) -> dict:
        """A phrase in one verse, whole words, inside the given passage where one is named."""
        label, words = pair
        _, verses = verses_of(self.bible, label)
        if len(verses) != 1:
            raise BuildError(f"a phrase must name one verse: {label}")
        if not has_phrase(clean(words), clean(verses[0][2])):
            raise BuildError(f"phrase not found, as whole words, in {label}: {words!r}")
        if within and ref_contains(self.bible, within, label) is False:
            raise BuildError(f"{label} is outside this meeting's own passage {within}")
        return {"r": self.passage(label), "label": label, "t": typographic(words)}


def ref_contains(bible: dict, outer: str, inner: str) -> bool:
    outer_code, outer_verses = verses_of(bible, outer)
    inner_code, inner_verses = verses_of(bible, inner)
    return outer_code == inner_code and {(c, v) for c, v, _ in inner_verses} <= {(c, v) for c, v, _ in outer_verses}


def tagged_block(builder: Builder, line: str, extra: str | None) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z0-9-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind != "source" or source not in builder.held or source not in {item["id"] for item in SOURCES}:
        raise BuildError(f"unknown tag or held source: {line[:60]}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source, extra)}


def block_quote(builder: Builder, lines: list, index: int, quote: str) -> tuple:
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quote at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB":
        raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
    if clean(quote) != clean(plain_text(builder.bible, label)):
        raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
    return {"k": "quote", "t": typographic(quote), "r": builder.passage(label), "label": label}, ref_at + 1


KEYS = {
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "GridLead": "gridLead", "GridReads": "gridReads", "GridCare": "gridCare", "CarryLead": "carryLead", "ReadingsLead": "readingsLead",
            "AfterLead": "afterLead", "AfterReads": "afterReads", "OlderLead": "olderLead", "TestLead": "testLead", "QuestionsLead": "questionsLead"},
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
            extra = builder.passages[holder["text"]]["label"] if zone == "question" else None
            target.append(tagged_block(builder, line, extra))
        else:
            keyed(builder, zone, holder, part, line)
    return study


def build_meetings(builder: Builder) -> list:
    """Each phrase must be in a verse of the meeting's own passage. Later Scripture must lie outside it."""
    rows, columns, carries, groups, seen = {r["id"] for r in ROWS}, {c["id"] for c in COLUMNS}, {c["id"] for c in CARRY}, set(GROUP_ORDER), set()
    out = []
    for meeting in MEETINGS:
        if meeting["id"] in seen or meeting["row"] not in rows or meeting["column"] not in columns or meeting["group"] not in groups:
            raise BuildError(f"meeting has a repeated id, or an unknown row, column or group: {meeting['id']}")
        seen.add(meeting["id"])
        read = meeting["read"]
        built = {key: meeting[key] for key in ("id", "row", "column", "group", "art")}
        built |= {"name": typographic(meeting["name"]), "who": typographic(meeting["who"]), "read": builder.passage(read), "readLabel": read, "unsaid": builder.runs(meeting["unsaid"])}
        built |= {key: builder.phrase(meeting[key], read) for key in ("first", "said", "end")}
        built["alsoFirst"] = builder.phrase(meeting["alsoFirst"], read) if meeting.get("alsoFirst") else None
        built["asked"] = builder.phrase(meeting["asked"], read) if meeting["asked"] else None
        built["carry"] = [{"id": tag, **builder.phrase((label, words), read)} for tag, label, words in meeting["carry"]]
        if any(item["id"] not in carries for item in built["carry"]):
            raise BuildError(f"unknown carrying tag on {meeting['id']}")
        built["later"] = [builder.phrase(pair) for pair in meeting["later"]]
        if any(ref_contains(builder.bible, read, item["label"]) for item in built["later"]):
            raise BuildError(f"later Scripture on {meeting['id']} is inside its own passage")
        built["laterNote"] = builder.runs(meeting["laterNote"]) if meeting.get("laterNote") else None
        for _, slug in meeting["people"]:
            if not (PEOPLE / f"{slug}.json").exists():
                raise BuildError(f"no person record {slug} for {meeting['id']}")
        built["people"] = [list(item) for item in meeting["people"]]
        out.append(built)
    return out


def build_form(builder: Builder, slug: str) -> dict:
    """Every phrase in a form is checked against its verse, whatever the form's shape."""
    def walk(value):
        if isinstance(value, tuple) and len(value) == 2 and all(isinstance(item, str) for item in value):
            return builder.phrase(value)
        if isinstance(value, tuple) and len(value) == 3 and all(isinstance(item, str) for item in value):
            return {"who": typographic(value[0]), **builder.phrase(value[1:])}
        if isinstance(value, (list, tuple)):
            return [walk(item) for item in value]
        return value
    form = {key: walk(value) for key, value in FORMS[slug].items()}
    if slug == "grief":
        sentence = clean(FORMS[slug]["sentence"])
        for label in ("John 11:21", "John 11:32"):
            if not has_words(sentence, clean(plain_text(builder.bible, label))):
                raise BuildError(f"the sentence the sisters share is not word for word in {label}")
        form["sentenceIn"] = [{"r": builder.passage(label), "label": label} for label in ("John 11:21", "John 11:32")]
    return form


def check_absent(builder: Builder) -> None:
    for label, pattern, why in ABSENT:
        if re.search(pattern, clean(plain_text(builder.bible, label)), re.I):
            raise BuildError(f"the page says {why}, and the pattern {pattern!r} is in {label}")
    for label, word in CONTROLS:
        if not re.search(rf"\b{word}\b", clean(plain_text(builder.bible, label))):
            raise BuildError(f"control failed: {word!r} should be found in {label}")


def count(meetings: list) -> dict:
    by = lambda key, value: sum(1 for m in meetings if m[key] == value)  # noqa: E731
    numbers = {"meetings": len(meetings), "back": sum(1 for m in meetings if m["later"]), "gone": sum(1 for m in meetings if not m["later"]),
               "rows": {r["id"]: by("row", r["id"]) for r in ROWS}, "columns": {c["id"]: by("column", c["id"]) for c in COLUMNS},
               "carry": {c["id"]: sum(1 for m in meetings if any(item["id"] == c["id"] for item in m["carry"])) for c in CARRY}}
    if sum(numbers["rows"].values()) != len(meetings) or sum(numbers["columns"].values()) != len(meetings):
        raise BuildError(f"rows and columns do not add up to the meetings: {numbers}")
    return numbers


def build_counts(numbers: dict) -> dict:
    added = {"bart", "martha", "mary", "thomas"}
    values = {"meetings": numbers["meetings"], "back": numbers["back"], "gone": numbers["gone"], "groups": len(GROUP_ORDER), "sayings": len(TEST), "questions": EXPECTED_QUESTIONS, "drafted": numbers["meetings"] - len(added)}
    out = {key: word_of(value) for key, value in values.items()}
    return out | {key.capitalize(): word.capitalize() for key, word in out.items()}


def check_complete(study: dict, numbers: dict) -> None:
    if [r.get("slug") for r in study["readings"]] != GROUP_ORDER:
        raise BuildError(f"the readings are not the expected groups, in order: {[r.get('slug') for r in study['readings']]}")
    for reading in study["readings"]:
        for key in ("read", "ask", "hook", "consider", "reflect"):
            if key not in reading:
                raise BuildError(f"reading {reading['n']} lacks {key}")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")
    if numbers["back"] + numbers["gone"] != numbers["meetings"]:
        raise BuildError("the meetings seen again and not seen again do not add up")


def check_code() -> None:
    """The one innerHTML is in en-core.js, for the fixed drawings. No inline handlers, no script from elsewhere, and only the expected files."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: {sorted(found ^ EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        allowed = 1 if path.name == "en-core.js" else 0
        if text.count(".innerHTML") != allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('.innerHTML')} times; {allowed} allowed")
        if "eval(" in text or "document.write" in text:
            raise BuildError(f"{path.name} uses a banned call")
    art = (HERE / "js/art.js").read_text(encoding="utf-8")
    if re.search(r"\$\{|<script|\bon[a-z]+=", art):
        raise BuildError("art.js must hold fixed drawings only")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"\bon[a-z]+=", page) or re.search(r"<script(?![^>]*\bsrc=)", page):
        raise BuildError("index.html has inline script or a handler")


def fingerprints(content: bytes) -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    paths = {HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *(path for paths in HELD.values() for path in paths), *(BSB / f"{code}.json" for code in CANON)}
    out = {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
    out[CONTENT.relative_to(WEBSITE.parent).as_posix()] = hashlib.sha256(content).hexdigest()
    return out


def build_payload() -> tuple:
    builder = Builder(load_bible())
    meetings = build_meetings(builder)
    numbers = count(meetings)
    builder.counts = build_counts(numbers)
    check_absent(builder)
    raw = CONTENT.read_bytes()
    text = raw.decode("utf-8-sig").replace("\r\n", "\n")
    if TYPED_COUNT.search(re.sub(r"\{\{\w+\}\}", "", text)):
        raise BuildError(f"a count is typed into content.md, and must be named: {TYPED_COUNT.search(text).group(0)}")
    study = parse(builder, text.split("\n"))
    check_complete(study, numbers)
    check_code()
    for source in SOURCES:
        if not source["href"].startswith("https://"):
            raise BuildError(f"source link must be https: {source['id']}")
    forms = {slug: build_form(builder, slug) for slug in GROUP_ORDER}
    older = [{"by": item["by"], "note": builder.runs(item["note"]), "now": builder.phrase(item["now"]), "then": builder.phrase(item["then"])} for item in OLDER]
    test = [{"id": item["id"], "saying": typographic(item["saying"]), "verdict": item["verdict"], "verdictLabel": VERDICTS[item["verdict"]], "answer": builder.runs(item["answer"])} for item in TEST]
    missing = set(QUOTED_CONFESSION) - builder.used_confession
    if missing:
        raise BuildError(f"listed confession phrases are not used on the page: {sorted(missing)}")
    sources = [{**source, "name": typographic(source["name"]), "note": typographic(source["note"])} for source in SOURCES]
    data = {"schema": 1, "study": study, "meetings": meetings, "rows": ROWS, "columns": COLUMNS, "carry": CARRY, "forms": forms, "groupArt": GROUP_ART, "older": older, "test": test, "verdicts": VERDICTS, "related": [list(item) for item in RELATED],
            "words": builder.counts, "passages": builder.passages, "sources": sources, "numbers": numbers, "builtFrom": fingerprints(raw)}
    payload = "window.EN = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
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
