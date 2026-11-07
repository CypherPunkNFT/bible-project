#!/usr/bin/env python3
"""Build data.js for the Prophets in their times mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/prophets-in-their-times-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference;
every reference resolves with no gap; each quoted phrase is in a reference of its paragraph, one paragraph of the right section of
its named held source, or the named confession list; every ruler touched is in its exact words, and every ruler named in an opening
is touched or listed as an ancestor; all 108 record lines are declared; the succession of kings is in its verses; names said to
appear nowhere else are scanned across the Bible. All this proves the words are there. It does not prove that a reading is right,
that a silence is real, or that a man of the same name is another man.
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
CONTENT = WEBSITE / "content/studies/people-of-scripture/prophets-in-their-times/content.md"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
JFB = LIBRARY / "bulk/ccel/jamieson_jfb.xml"
CCEL = LIBRARY / "source-ccel"
# Held source: (file, text that opens the part read, text that closes it). A quotation must be in one paragraph of that part.
HELD = {
    "calvin-hos": (CCEL / "asset-ready-text-edition-l06-calvin-26/calcom26.xml", None, None),
    "calvin-joel": (CCEL / "asset-ready-text-edition-l06-calvin-27/calcom27.xml", "Preface to Joel", "Hear this"),
    "calvin-zec": (CCEL / "asset-ready-text-edition-l06-calvin-30/calcom30.xml", None, None),
    "fausset-hos": (JFB, "HOSEA", "JOEL"),
    "fausset-joel": (JFB, "JOEL", "AMOS"),
}
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"art.js", "theme.js", "pt-core.js", "pt-hero.js", "pt-openings.js", "pt-walk.js", "pt-record.js", "pt.js"}
sys.path.insert(0, str(HERE))
from scripture_text import (BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, in_verse, load_bible, plain_text,  # noqa: E402
                            ref_id, typographic, verses_of)
from study_lists import (ACT_LABELS, ACTS, MARK_LABELS, NOT_NAMED_ELSEWHERE, PAGE_REFERENCES, PROPHETS, QUESTIONS, QUOTED_CONFESSION,  # noqa: E402
                         RECORDS, RULERS, SAME_NAME_BOOKS, SOURCES, SUCCESSION)


class Builder:
    def __init__(self, bible: dict, foundation: str):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_paragraphs(*spec) for key, spec in HELD.items()}
        self.web_quotes = set()

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def runs(self, text: str, source: str | None = None) -> list:
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase."""
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        ids = [self.passage(m.group(0)) for m in REF_RE.finditer(text)]
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        pools = [" ".join(fold(v["t"]) for v in self.passages[i]["verses"]).replace('"', "") for i in ids]
        for phrase in re.findall(r'"([^"]+)"', text):
            self.check_quoted(phrase, pools, source, text)
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

    def check_quoted(self, phrase: str, pools: list, source: str | None, context: str) -> None:
        folded = fold(phrase)
        if any(has_words(folded, pool) for pool in pools):
            return
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of the part read of {source}: {phrase!r}")
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.web_quotes.add(phrase)
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


def tagged_block(builder: Builder, line: str) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "open", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind != "source" or source not in builder.held:
        raise BuildError(f"unknown tag or held source: {line[:60]}")
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
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Frame": "frame", "Selection": "selection"},
    "reading": {"Word": "word", "Ask": "ask", "Hook": "hook"},
    "after": {"Look closely": "look", "Your response": "response"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
STRAY_KEY = re.compile(r"[A-Z][\w']*(?: [\w']+){0,2}: ")


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives its keys)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        holder = {"n": numbered.group(1), "title": typographic(numbered.group(2)), "parts": []}
        study["readings"].append(holder)
        return "reading", holder
    if closing:
        study["closing"] = closing.group(1)
        return "close", study
    raise BuildError(f"heading not recognised: {line}")


def keyed(builder: Builder, zone: str, holder: dict, part: dict | None, line: str) -> None:
    key, sep, value = line.partition(": ")
    if zone == "reading" and sep and part is None and key == "Slug":
        holder["slug"] = value
    elif zone == "reading" and sep and part is None and key == "Read":
        holder["read"] = [builder.passage(item.strip()) for item in value.split(";")]
    elif zone == "close" and sep and key == "Passage":
        holder["passage"] = builder.passage(value)
    elif zone == "reading" and sep and key in KEYS["after"]:
        holder[KEYS["after"][key]] = builder.runs(value)
    elif sep and part is None and key in KEYS[zone]:
        holder[KEYS[zone][key]] = builder.runs(value)
    elif part is not None and not STRAY_KEY.match(line):
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing, or uses a key this section does not allow: {line[:70]}")


def parse(builder: Builder, lines: list) -> dict:
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": []}
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
            if part is None:
                raise BuildError(f"tagged paragraph outside a part: {line[:60]}")
            part["blocks"].append(tagged_block(builder, line))
        else:
            keyed(builder, zone, holder, part, line)
    return study


def segments(text: str, marks: list, label: str) -> list:
    """The opening verse as ordered [{t, k}] pieces, ready for text nodes. A mark not found in order fails the build."""
    out, cursor = [], 0
    folded = fold(text)
    for phrase, kind in marks:
        if kind not in MARK_LABELS:
            raise BuildError(f"unknown mark kind {kind} in {label}")
        match = re.compile(r"(?<!\w)" + re.escape(fold(phrase)) + r"(?!\w)").search(folded, cursor)
        if not match:
            raise BuildError(f"mark not found, in order, in {label}: {phrase!r}")
        if match.start() > cursor:
            out.append({"t": text[cursor:match.start()], "k": None})
        out.append({"t": text[match.start():match.end()], "k": kind})
        cursor = match.end()
    if cursor < len(text):
        out.append({"t": text[cursor:], "k": None})
    return out


def build_prophets(builder: Builder) -> list:
    """Each prophet's opening, and the rulers it touches. Both ways: a touched ruler has its exact words; a named ruler is touched."""
    ruler_ids = {r["id"]: r["name"] for r in RULERS}
    king_words = re.compile(r"\b(king|kings|reign|reigns|days|year)\b", re.I)
    out = []
    for prophet in PROPHETS:
        touched = []
        for ruler, label, span in prophet.get("ladder", []):
            if ruler not in ruler_ids:
                raise BuildError(f"{prophet['id']} touches an unknown ruler {ruler}")
            in_verse(builder.bible, label, span)
            if not has_words(ruler_ids[ruler], span):
                raise BuildError(f"{prophet['id']}: the words for {ruler} do not hold that name: {span!r}")
            if not king_words.search(span):
                role = prophet.get("role")
                if not role:
                    raise BuildError(f"{prophet['id']}: the words for {ruler} do not say he reigned: {span!r}")
                in_verse(builder.bible, *role)
                builder.passage(role[0])
            touched.append({"ruler": ruler, "r": builder.passage(label), "label": label, "words": span})
        opening = plain_text(builder.bible, prophet["opening"])
        names_touched = {ruler_ids[t["ruler"]] for t in touched}
        for name in ruler_ids.values():
            if has_words(name, opening) and name not in names_touched and name not in prophet.get("ancestors", []):
                raise BuildError(f"{prophet['id']}: the opening names the ruler {name}, and the page does not touch him or call him an ancestor")
        for name in prophet.get("ancestors", []):
            if not has_words(f"the son of {name}", opening):
                raise BuildError(f"{prophet['id']}: {name} is listed as an ancestor, and the opening does not say so")
        text = " ".join(v[2] for v in verses_of(builder.bible, prophet["opening"])[1])
        record = {question: record_line(builder, prophet["id"], question) for question in QUESTIONS}
        out.append({"id": prophet["id"], "name": prophet["name"], "person": prophet["person"], "basis": prophet["basis"], "opening": builder.passage(prophet["opening"]),
                    "openingLabel": prophet["opening"], "segments": segments(text, prophet["marks"], prophet["opening"]), "touched": touched,
                    "note": typographic(prophet.get("note", "")), "record": record, "noteRuns": builder.runs(prophet.get("note", ""))})
    return out


def record_line(builder: Builder, prophet: str, question: str) -> dict:
    """One of the 108 lines. An undeclared line fails the build, so a typo can never read as a silence."""
    try:
        line = RECORDS[prophet][question]
    except KeyError as error:
        raise BuildError(f"the record for {prophet} does not declare {question}") from error
    allowed = {"given", "silent"} if question != "remembrance" else {"named", "quoted", "silent"}
    if line["kind"] not in allowed:
        raise BuildError(f"{prophet} {question} has kind {line['kind']}, expected one of {sorted(allowed)}")
    if line["kind"] == "silent":
        return {"kind": "silent", "note": builder.runs(line["note"])}
    in_verse(builder.bible, line["ref"], line["words"])
    return {"kind": line["kind"], "r": builder.passage(line["ref"]), "label": line["ref"], "words": line["words"].replace("'", "’"), "note": builder.runs(line["note"])}


def check_records() -> None:
    if set(RECORDS) != {p["id"] for p in PROPHETS}:
        raise BuildError("the record list and the prophet list are not the same eighteen")
    for prophet, lines in RECORDS.items():
        if set(lines) != set(QUESTIONS):
            raise BuildError(f"the record for {prophet} has the wrong questions: {sorted(lines)}")


def check_succession(bible: dict) -> None:
    for earlier, later, label, phrase in SUCCESSION:
        in_verse(bible, label, phrase)
        text = plain_text(bible, label)
        if not has_words(later, text):
            raise BuildError(f"{label} does not name {later}, after {earlier}")


def check_names(bible: dict) -> list:
    """Names the page says stand alone, scanned across the whole Bible. Any new hit, or a listed hit that has gone, fails."""
    note = []
    for name, (own, others) in NOT_NAMED_ELSEWHERE.items():
        hits = sorted(f"{code} {key}" for code in CANON if code != own for key, text in bible[code].items() if has_words(name, text))
        if hits != sorted(others):
            raise BuildError(f"{name} outside his own book: expected {sorted(others)}, found {hits}")
    for name, (own, books) in SAME_NAME_BOOKS.items():
        hits = {code for code in CANON if code != own for text in bible[code].values() if has_words(name, text)}
        if hits != books:
            raise BuildError(f"men named {name} outside his own book: expected {sorted(books)}, found {sorted(hits)}")
        note.append(f"{name}: {sorted(hits)}")
    return note


def check_facts(bible: dict) -> None:
    """Sentences the page states about the text, tested."""
    in_verse(bible, "Micah 5:2", "Bethlehem")
    in_verse(bible, "Matthew 2:6", "Bethlehem")
    in_verse(bible, "Hosea 11:1", "out of Egypt I called My son")
    in_verse(bible, "Matthew 2:15", "Out of Egypt I called My Son")
    in_verse(bible, "Zechariah 9:9", "riding on a donkey")
    in_verse(bible, "Matthew 21:5", "riding on a donkey")
    in_verse(bible, "Malachi 3:1", "I will send My messenger")
    in_verse(bible, "Matthew 11:10", "I will send My messenger")
    in_verse(bible, "Acts 2:16", "the prophet Joel")
    in_verse(bible, "Hebrews 8:1", "high priest")
    in_verse(bible, "Romans 1:17", "The righteous will live by faith")
    in_verse(bible, "Romans 9:13", "Jacob I loved")
    in_verse(bible, "Malachi 1:2", "Jacob I have loved")
    if "Malachi" in plain_text(bible, "Romans 9:13") or "Habakkuk" in plain_text(bible, "Romans 1:17"):
        raise BuildError("the page says Paul quotes these without giving the name")


def build_acts(builder: Builder) -> list:
    out = []
    for act in ACTS:
        lines = {}
        for key in ACT_LABELS:
            line = act["lines"][key]
            if line is None:
                lines[key] = None
                continue
            in_verse(builder.bible, *line)
            lines[key] = {"r": builder.passage(line[0]), "label": line[0], "words": line[1]}
        out.append({"id": act["id"], "title": act["title"], "ref": builder.passage(act["ref"]), "refLabel": act["ref"], "lines": lines, "unsaid": typographic(act["unsaid"])})
    return out


def check_code() -> None:
    """The only markup strings allowed are the fixed drawings. Missing page files, inline scripts or handlers fail the build."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: missing {sorted(EXPECTED_JS - found)}, extra {sorted(found - EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval("):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "pt-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in pt-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")


def check_people() -> None:
    """Every link to a person's page must be a record the site's prophet list holds."""
    data = json.loads((WEBSITE / "data/study/prophets.json").read_text(encoding="utf-8"))
    records = data if isinstance(data, list) else next(value for value in data.values() if isinstance(value, list))
    known = {record["id"] for record in records}
    missing = [p["person"] for p in PROPHETS if p["person"] not in known]
    if missing:
        raise BuildError(f"person links not found in data/study/prophets.json: {missing}")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if href is not None and not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def figures(builder: Builder, study: dict, prophets: list) -> dict:
    walked = set()
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            walked |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
    lines = [p["record"][q]["kind"] for p in prophets for q in QUESTIONS]
    on_rulers = [p for p in prophets if p["touched"]]
    return {"prophets": len(prophets), "books": sum(p["basis"] == "heading" for p in prophets), "named": sum(p["basis"] == "heading" for p in on_rulers),
            "unnamed": sum(not p["touched"] for p in prophets), "questions": len(QUESTIONS), "verses": len(walked), "lines": len(lines), "silent": lines.count("silent"),
            "calls": sum(p["record"]["calling"]["kind"] != "silent" for p in prophets), "responses": sum(p["record"]["response"]["kind"] != "silent" for p in prophets)}


def fingerprints() -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    paths = [CONTENT, HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *{spec[0] for spec in HELD.values()}, *(BSB / f"{code}.json" for code in CANON)]
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}


def check_complete(study: dict) -> None:
    required = {"slug", "word", "ask", "hook", "read", "look", "response"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if [reading["slug"] for reading in study["readings"]] != QUESTIONS or [reading["n"] for reading in study["readings"]] != [f"{i:02d}" for i in range(1, len(QUESTIONS) + 1)]:
        raise BuildError("the page expects the six questions in order, numbered 01 to 06")
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "close", "way", "invite", "question", "again", "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def build_payload() -> tuple:
    builder = Builder(load_bible(), fold(FOUNDATION.read_text(encoding="utf-8-sig")))
    study = parse(builder, CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n").split("\n"))
    check_complete(study)
    check_records()
    check_succession(builder.bible)
    same_name = check_names(builder.bible)
    check_facts(builder.bible)
    check_code()
    check_sources()
    check_people()
    prophets = build_prophets(builder)
    acts = build_acts(builder)
    for label in PAGE_REFERENCES:
        builder.passage(label)
    numbers = figures(builder, study, prophets)
    if numbers["unnamed"] != 6 or numbers["books"] != 16:
        raise BuildError(f"the page says six openings name no ruler, of sixteen books; found {numbers}")
    data = {"schema": 1, "study": study, "passages": builder.passages, "prophets": prophets, "rulers": RULERS, "markLabels": MARK_LABELS, "questions": QUESTIONS,
            "acts": acts, "actLabels": ACT_LABELS, "succession": [{"r": builder.passage(s[2]), "label": s[2]} for s in SUCCESSION],
            "sources": [{**s, "name": typographic(s["name"]), "note": typographic(s["note"])} for s in SOURCES], "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.PT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.web_quotes), same_name


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
        payload, numbers, passage_count, web_quotes, same_name = build_payload()
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
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages; same-name books {same_name}; "
          f"{len(web_quotes)} quoted phrases not in a held file: {web_quotes}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
