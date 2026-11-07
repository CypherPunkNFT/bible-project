#!/usr/bin/env python3
"""Build data.js for the Bearing witness mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/bearing-witness-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference;
every reference resolves with no gap; each quoted phrase is in a reference of its paragraph, one paragraph of its named held source,
or the named confession list; every phrase in the figures is in its verse as whole words and in one place only. All this proves the
words are there. It does not prove that a reading is right or that a phrase is sorted rightly.
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
CONTENT = WEBSITE / "content/studies/christian-life/bearing-witness/content.md"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
CCEL = LIBRARY / "source-ccel"
CREEDS = WEBSITE / "data/creeds/doc"
# A quotation must fall inside one paragraph of the named file. These are whole files, not only the comment read; the notes say what was read.
HELD = {
    "calvin-1pe": CCEL / "asset-ready-text-edition-l06-calvin-45/calcom45.xml",
    "calvin-col": CCEL / "asset-ready-text-edition-l06-calvin-42/calcom42.xml",
    "calvin-php": CCEL / "asset-ready-text-edition-l06-calvin-42/calcom42.xml",
    "calvin-2ti": CCEL / "asset-ready-text-edition-l06-calvin-43/calcom43.xml",
    "jfb": LIBRARY / "bulk/ccel/jamieson_jfb.xml",
    "abstract": CREEDS / "abstract-of-principles-1858.b1.json",
    "nh": CREEDS / "new-hampshire-baptist-confession-1833.b1.json",
}
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "bw-core.js", "bw-hero.js", "bw-wall.js", "bw-threshold.js", "bw-thread.js", "bw-questions.js", "bw-sort.js", "bw.js"}
LETTERS = {"COL", "EPH", "1CO", "PHP", "1PE", "1TH", "2CO", "2TI"}
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, in_verse, load_bible, plain_text,  # noqa: E402
                            ref_id, typographic, verses_of)
from study_lists import DOORS, NOT_IN_PARAGRAPH, PHRASE_MAP, QUOTED_CONFESSION, READING_ORDER, SORTS, SOURCES, THRESHOLD  # noqa: E402


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
        """A quotation passes on its own paragraph's verses, the named confession list, the figure's two labels, or its named source."""
        folded = fold(phrase)
        if any(has_words(folded, pool) for pool in pools):
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.unchecked_confession.add(phrase)
            return
        if phrase in ("asked", "hoped"):
            return
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


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
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "WallLead": "wallLead", "ThresholdLead": "thresholdLead",
            "ThresholdReads": "thresholdReads", "ThresholdLimit": "thresholdLimit", "DoorsLead": "doorsLead", "DoorsReads": "doorsReads",
            "QuestionsLead": "questionsLead", "SortLead": "sortLead"},
    "reading": {"Word": "word", "Ask": "ask", "Hook": "hook"},
    "after": {"Look closely": "look", "Your response": "response"},
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
        holder["read"] = [builder.passage(item.strip()) for item in value.split(";")]
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


def marked_verses(bible: dict, label: str, marks: list) -> list:
    """Verses as [{v, pieces:[{t, m}]}] with each (phrase, mark) found in order. A mark not found in order fails the build."""
    _, verses = verses_of(bible, label)
    out, waiting = [], list(marks)
    for chapter, verse, text in verses:
        pieces, cursor, folded = [], 0, fold(text)
        while waiting:
            match = re.compile(r"(?<!\w)" + re.escape(fold(waiting[0][0])) + r"(?!\w)").search(folded, cursor)
            if not match:
                break
            if match.start() > cursor:
                pieces.append({"t": text[cursor:match.start()]})
            pieces.append({"t": text[match.start():match.end()], "m": waiting.pop(0)[1]})
            cursor = match.end()
        if cursor < len(text):
            pieces.append({"t": text[cursor:]})
        out.append({"c": chapter, "v": verse, "pieces": pieces})
    if waiting:
        raise BuildError(f"marks not found, in order, in {label}: {[m[0] for m in waiting]}")
    return out


def build_wall(builder: Builder) -> dict:
    label = "Colossians 4:2–6"
    if any(slug not in READING_ORDER for _, _, slug in PHRASE_MAP):
        raise BuildError("a phrase in the Colossians map opens a reading that does not exist")
    for verse, phrase, _ in PHRASE_MAP:
        in_verse(builder.bible, verse, phrase)
    paragraph = plain_text(builder.bible, label).lower()
    for slug, word in NOT_IN_PARAGRAPH.items():
        if word in paragraph:
            raise BuildError(f"the page says {word!r} ({slug}) is not in Colossians 4:2-6, and it is")
    return {"r": builder.passage(label), "label": label, "verses": marked_verses(builder.bible, label, [(phrase, slug) for _, phrase, slug in PHRASE_MAP])}


def phrase_entry(builder: Builder, entry: tuple, row_label: str) -> dict:
    label, words, *flag = entry
    in_verse(builder.bible, label, words)
    row_code, row_verses = verses_of(builder.bible, row_label)
    code, verses = verses_of(builder.bible, label)
    if code != row_code or verses[0][:2] not in {v[:2] for v in row_verses}:
        raise BuildError(f"{label} is outside its row {row_label}")
    return {"r": builder.passage(label), "label": label, "words": words.replace("'", "’"), "flag": flag[0] if flag else None}


def build_threshold(builder: Builder) -> list:
    rows = []
    for row in THRESHOLD:
        seen = set()
        for place in ("speaker", "other", "god"):
            for entry in row[place]:
                if (entry[0], entry[1]) in seen:
                    raise BuildError(f"phrase in two places in {row['id']}: {entry[1]}")
                seen.add((entry[0], entry[1]))
        rows.append({"id": row["id"], "r": builder.passage(row["label"]), "label": row["label"], "name": row["name"],
                     **{place: [phrase_entry(builder, entry, row["label"]) for entry in row[place]] for place in ("speaker", "other", "god")}})
    return rows


def build_doors(builder: Builder) -> list:
    out = []
    for door in DOORS:
        in_verse(builder.bible, door["ref"], door["words"])
        in_verse(builder.bible, door["ref"], door["opener_words"])
        in_verse(builder.bible, door["beside_ref"], door["beside"])
        out.append({"id": door["id"], "r": builder.passage(door["ref"]), "label": door["ref"], "words": door["words"], "head": door["head"], "opener": door["opener"],
                    "beside": door["beside"], "besideR": builder.passage(door["beside_ref"]), "besideLabel": door["beside_ref"], "note": builder.runs(door["note"], "jfb")})
    return out


def build_sorts(builder: Builder) -> list:
    return [{"id": s["id"], "r": builder.passage(s["label"]), "label": s["label"], "verses": marked_verses(builder.bible, s["label"], s["marks"]), "said": builder.runs(s["said"])} for s in SORTS]


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
        allowed = 1 if path.name == "bw-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in bw-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if href is not None and not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def check_complete(study: dict) -> None:
    required = {"slug", "word", "ask", "hook", "read", "look", "response"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if [r["slug"] for r in study["readings"]] != READING_ORDER or [r["n"] for r in study["readings"]] != [f"{i:02d}" for i in range(1, len(READING_ORDER) + 1)]:
        raise BuildError("the page expects the six readings in Colossians' order, numbered 01 to 06")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading")
    if len(study["questions"]) != 5:
        raise BuildError(f"the page says five questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def figures(builder: Builder, study: dict, rows: list) -> dict:
    walked, letters = set(), set()
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            walked |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
            letters.add(passage["code"])
    if letters != LETTERS:
        raise BuildError(f"the page says eight letters; the readings use {sorted(letters)}")
    return {"readings": len(study["readings"]), "letters": len(letters), "verses": len(walked), "rows": len(rows), "doors": len(DOORS), "questions": len(study["questions"]),
            "speaker": sum(len(r["speaker"]) for r in rows), "other": sum(len(r["other"]) for r in rows), "god": sum(len(r["god"]) for r in rows)}


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
    rows = build_threshold(builder)
    numbers = figures(builder, study, rows)
    data = {"schema": 1, "study": study, "wall": build_wall(builder), "threshold": rows, "doors": build_doors(builder), "sorts": build_sorts(builder), "passages": builder.passages,
            "sources": [{**s, "name": typographic(s["name"]), "note": typographic(s["note"])} for s in SOURCES], "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.BW = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
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
