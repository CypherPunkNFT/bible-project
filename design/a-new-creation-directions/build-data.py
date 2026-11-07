#!/usr/bin/env python3
"""Build data.js for the A new creation mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/a-new-creation-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference;
every reference resolves with no gap; each quoted phrase is in the reference that follows it in its paragraph (or the one before it, if
none follows), one paragraph of its named held source, or the named confession list; every phrase in the lists is in its stated verse as
whole words. All this proves the words are there. It does not prove that a reading is right or that a pairing is right.
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
CONTENT = WEBSITE / "content/studies/christian-life/a-new-creation/content.md"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
CCEL = LIBRARY / "source-ccel"
BULK = LIBRARY / "bulk/ccel"
CREEDS = WEBSITE / "data/creeds/doc"
# A quotation must fall inside one paragraph of the named file. These are whole files, not only the comment read; the notes say what was read.
HELD = {
    "calvin-2co": CCEL / "asset-ready-text-edition-l06-calvin-40/calcom40.xml",
    "calvin-rom": CCEL / "asset-ready-text-edition-l06-calvin-38/calcom38.xml",
    "calvin-gal": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "calvin-eph": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "jfb": BULK / "jamieson_jfb.xml",
    "wesley": BULK / "wesley_notes.xml",
    "boyce": BULK / "boyce_theology.xml",
    "lbc": CREEDS / "1689-london-baptist-confession-1677.b1.json",
    "methodist": CREEDS / "methodist-articles-of-religion-1784.b1.json",
    "luther": CREEDS / "luthers-small-catechism-1529.b1.json",
}
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "nc-core.js", "nc-hero.js", "nc-figures.js", "nc-fold.js", "nc-more.js", "nc-turn.js", "nc-back.js", "nc-questions.js", "nc.js"}
READING_LETTERS = {"2CO", "EPH", "COL", "JAS", "GAL", "ROM"}
EXPECTED_QUESTIONS = 6
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, in_verse, load_bible, plain_text,  # noqa: E402
                            ref_id, typographic, verses_of)
from study_lists import (BEHOLD_NEW_COUNT, BEHOLDS, FOUR_LINES, LETTERS, LOOK_BACK, MORE_FOLDS, QUOTED_CONFESSION, RAILS, READING_FOLDS,  # noqa: E402
                         READING_ORDER, SOURCES)


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


class Builder:
    def __init__(self, bible: dict, foundation: str):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_paragraphs(path, None, None) for key, path in HELD.items()}
        self.unchecked_confession = set()

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def runs(self, text: str, source: str | None = None) -> list:
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase against the citation it belongs to."""
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
            bound = following or preceding
            self.check_quoted(quoted.group(1), bound.group(0) if bound else None, source, text)
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

    def check_quoted(self, phrase: str, reference: str | None, source: str | None, context: str) -> None:
        folded = fold(phrase)
        if reference and has_phrase(folded, plain_text(self.bible, reference)):
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.unchecked_confession.add(phrase)
            return
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
            return
        raise BuildError(f"quoted phrase is not in {reference!r} and has no other source: {phrase!r}, in: {context[:90]}")


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
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "FoldLead": "foldLead", "BeholdLead": "beholdLead", "BeholdReads": "beholdReads",
            "RailsReads": "railsReads", "LinesLead": "linesLead", "MoreLead": "moreLead", "MoreReads": "moreReads", "TurnLead": "turnLead", "TurnReads": "turnReads", "BackLead": "backLead", "QuestionsLead": "questionsLead"},
    "reading": {"Ask": "ask", "Hook": "hook"},
    "after": {"Consider": "consider", "Reflect": "reflect"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
TOP_SOURCED = {"TurnCalvin": ("turnCalvin", "calvin-rom")}
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
        holder = {"id": question.group(1), "title": typographic(question.group(2).replace('"', "")), "blocks": []}
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
        holder["read"] = [builder.passage(item.strip()) for item in value.split(";")]
    elif zone == "question" and sep and key == "Text":
        holder["text"] = builder.passage(value)
    elif zone == "close" and sep and key == "Passage":
        holder["passage"] = builder.passage(value)
    elif zone == "top" and sep and key in TOP_SOURCED:
        name, source = TOP_SOURCED[key]
        holder[name] = builder.runs(value, source)
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


def position(bible: dict, label: str, words: str) -> tuple:
    """Where a phrase stands, so the page can say when a command comes first."""
    _, verses = verses_of(bible, label)
    chapter, verse, text = verses[0]
    return chapter, verse, fold(text).replace('"', "").find(fold(words).replace('"', ""))


def build_fold(builder: Builder, entry: dict) -> dict:
    for part in ("done", "now"):
        in_verse(builder.bible, *entry[part])
    if entry["join"]:
        in_verse(builder.bible, *entry["join"])
    span_code = verses_of(builder.bible, entry["span"])
    for part in ("done", "now"):
        code, verses = verses_of(builder.bible, entry[part][0])
        if code != span_code[0] or verses[0][:2] not in {v[:2] for v in span_code[1]}:
            raise BuildError(f"{entry[part][0]} is outside the span {entry['span']} of fold {entry['id']}")
    return {"id": entry["id"], "who": entry["who"], "r": builder.passage(entry["span"]), "span": entry["span"],
            "done": typographic(entry["done"][1]), "doneR": builder.passage(entry["done"][0]), "doneLabel": entry["done"][0],
            "now": typographic(entry["now"][1]), "nowR": builder.passage(entry["now"][0]), "nowLabel": entry["now"][0],
            "join": entry["join"][1] if entry["join"] else None,
            "commandFirst": position(builder.bible, *entry["now"]) < position(builder.bible, *entry["done"])}


def verses_before(bible: dict, code: str, label: str) -> tuple:
    _, verses = verses_of(bible, label)
    keys = sorted(tuple(map(int, key.split(":"))) for key in bible[code])
    return keys.index(verses[0][:2]), len(keys)


def build_letter(builder: Builder, letter: dict) -> dict:
    total = len(builder.bible[letter["code"]])
    def mark(label: str, words: str) -> dict:
        in_verse(builder.bible, label, words)
        before, _ = verses_before(builder.bible, letter["code"], label)
        return {"r": builder.passage(label), "label": label, "words": typographic(words), "before": before}
    turn = mark(*letter["turn"]) if letter["turn"] else None
    marks = [mark(*entry) for entry in letter["marks"]]
    if turn and any(m["before"] >= turn["before"] for m in marks):
        raise BuildError(f"{letter['name']}: a command said to be before the turn is not before it")
    return {"name": letter["name"], "total": total, "turn": turn, "marks": marks, "note": letter["note"]}


def count_behold_new(bible: dict) -> int:
    both = 0
    for book in bible.values():
        for text in book.values():
            if re.search(r"\b[Bb]ehold\b", text) and re.search(r"\bnew\b", text):
                both += 1
    return both


def build_beholds(builder: Builder) -> list:
    found = count_behold_new(builder.bible)
    if found != BEHOLD_NEW_COUNT:
        raise BuildError(f"the page says {BEHOLD_NEW_COUNT} verses in the Berean have both Behold and new; found {found}")
    out = []
    for item in BEHOLDS:
        in_verse(builder.bible, item["ref"], item["words"])
        if not re.search(r"\b[Bb]ehold\b", plain_text(builder.bible, item["ref"])):
            raise BuildError(f"{item['ref']} does not say Behold")
        out.append({"r": builder.passage(item["ref"]), "label": item["ref"], "words": item["words"], "tense": item["tense"]})
    return out


def build_rails(builder: Builder) -> dict:
    def groups(name: str) -> list:
        out = []
        for label, words in RAILS[name]:
            for word in words:
                in_verse(builder.bible, label, word)
            out.append({"r": builder.passage(label), "label": label, "words": words})
        return out
    label, words = RAILS["over"]
    in_verse(builder.bible, label, words)
    return {"off": groups("off"), "on": groups("on"), "over": {"r": builder.passage(label), "label": label, "words": words}}


def build_lines(builder: Builder) -> list:
    out = []
    for line in FOUR_LINES:
        for part in ("stop", "instead", "because"):
            in_verse(builder.bible, line["ref"], line[part])
        out.append({**line, "r": builder.passage(line["ref"]), "label": line["ref"]})
    return out


def build_back(builder: Builder) -> list:
    out = []
    for item in LOOK_BACK:
        in_verse(builder.bible, *item["command"])
        in_verse(builder.bible, *item["done"])
        out.append({"id": item["id"], "r": builder.passage(item["span"]), "span": item["span"], "command": item["command"][1], "commandLabel": item["command"][0], "commandR": builder.passage(item["command"][0]),
                    "done": item["done"][1], "doneLabel": item["done"][0], "doneR": builder.passage(item["done"][0]), "said": typographic(item["said"])})
    return out


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
        allowed = 1 if path.name == "nc-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in nc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if href is not None and not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def check_complete(study: dict) -> None:
    required = {"slug", "ask", "hook", "read", "consider", "reflect"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if [r["slug"] for r in study["readings"]] != READING_ORDER or [f["id"] for f in READING_FOLDS] != READING_ORDER:
        raise BuildError("the readings and their folds must follow READING_ORDER")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), "turnCalvin", *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def figures(builder: Builder, study: dict, folds: list, more: list, letters: list) -> dict:
    walked, used = set(), set()
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            walked |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
            used.add(passage["code"])
    if used != READING_LETTERS:
        raise BuildError(f"the page says its readings come from six letters; they use {sorted(used)}")
    joined = sum(1 for f in more if f["join"])
    if len(folds) + len(more) != 14 or len(more) != 8 or joined != 7 or len(letters) != 5 or len(BEHOLDS) != 4:
        raise BuildError("the lead and selection say 14 places (6 and 8), 7 of the 8 with a joining word, 5 letters and 4 Beholds; the lists now differ")
    shares = [round(100 * l["turn"]["before"] / l["total"]) for l in letters if l["turn"]]
    return {"readings": len(study["readings"]), "letters": len(used), "verses": len(walked), "folds": len(folds) + len(more), "low": min(shares), "high": max(shares), "questions": len(study["questions"])}


def fingerprints() -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    paths = {CONTENT, HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *HELD.values(), *(BSB / f"{code}.json" for code in CANON)}
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}


def build_payload() -> tuple:
    builder = Builder(load_bible(), fold(FOUNDATION.read_text(encoding="utf-8-sig")))
    study = parse(builder, CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n").split("\n"))
    check_complete(study)
    check_code()
    check_sources()
    folds = [build_fold(builder, entry) for entry in READING_FOLDS]
    more = [build_fold(builder, entry) for entry in MORE_FOLDS]
    letters = [build_letter(builder, letter) for letter in LETTERS]
    numbers = figures(builder, study, folds, more, letters)
    data = {"schema": 1, "study": study, "folds": folds, "more": more, "letters": letters, "beholds": build_beholds(builder), "rails": build_rails(builder), "lines": build_lines(builder), "back": build_back(builder),
            "passages": builder.passages, "sources": [{**s, "name": typographic(s["name"]), "note": typographic(s["note"])} for s in SOURCES], "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.NC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.unchecked_confession)


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
        payload, numbers, passage_count, unchecked = build_payload()
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
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages; confession phrases not in a file the build reads: {unchecked}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
