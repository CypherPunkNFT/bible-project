#!/usr/bin/env python3
"""Build data.js for the Prayer in the letters mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/prayer-in-the-letters-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference; every
reference resolves with no gap; each quoted phrase is in the reference that follows it (or the one before, if none follows), one paragraph
of its named held source, or the named confession list; each passage's lines join back to exactly its Berean text; each phrase occurs once
in its verse; stations lie inside a phrase of the same kind, in verse order. All this proves the words are there and unaltered. It does not
prove that a label is right, or that a reading is right.
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
CONTENT = WEBSITE / "content/studies/christian-life/prayer-in-the-letters/content.md"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
CCEL = LIBRARY / "source-ccel"
BULK = LIBRARY / "bulk/ccel"
CREEDS = WEBSITE / "data/creeds/doc"
# A quotation must fall inside one paragraph of the named file. These are whole files, not only the comment read; the notes say what was read.
HELD = {
    "calvin-eph": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "calvin-tim": CCEL / "asset-ready-text-edition-l06-calvin-43/calcom43.xml",
    "calvin-cor": CCEL / "asset-ready-text-edition-l06-calvin-40/calcom40.xml",
    "barnes": BULK / "barnes_ntnotes.xml",
    "jfb": BULK / "jamieson_jfb.xml",
    "wesley": BULK / "wesley_notes.xml",
    "boyce": BULK / "boyce_theology.xml",
    "lbc": CREEDS / "1689-london-baptist-confession-1677.b1.json",
    "trent": CREEDS / "council-of-trent-canons-and-decrees-1563.b2.json",
}
SECONDARY = {"barnes": "jfb"}  # the one paragraph that quotes two commentators
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "pc-core.js", "pc-hero.js", "pc-climb.js", "pc-leaf.js", "pc-aimed.js", "pc-try.js", "pc-questions.js", "pc.js"}
EXPECTED_QUESTIONS = 6
EXPECTED_PASSAGES = 9
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, in_verse, load_bible, plain_text,  # noqa: E402
                            ref_id, typographic, verses_of)
from study_lists import (AIMED, CLIMBS, KIND_LABELS, LEAVES, OLDER, QUOTED_CONFESSION, READ_FIRST_OPEN, READING_ORDER, ROLES, SOURCES, TRY)  # noqa: E402

SOURCE_IDS = {source["id"] for source in SOURCES}


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
            names = [source, SECONDARY[source]] if source in SECONDARY else [source]
            if not any(has_phrase(folded, paragraph) for name in names for paragraph in self.held[name]):
                raise BuildError(f"quote not found in one paragraph of {names}: {phrase!r}")
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
    elif kind == "about":  # told in this site's words, so it may quote nothing
        if source not in SOURCE_IDS or '"' in text:
            raise BuildError(f"about needs a listed source and no quotation: {line[:60]}")
        return {"k": "source", "src": source, "runs": builder.runs(text)}
    elif kind != "source" or source not in builder.held:
        raise BuildError(f"unknown tag or held source: {line[:60]}")
    return {"k": "source" if kind == "source" else kind, "src": source, "runs": builder.runs(text, source)}


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
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "ClimbLead": "climbLead", "ClimbReads": "climbReads", "LeafLead": "leafLead",
            "AimedLead": "aimedLead", "AimedReads": "aimedReads", "AimedCare": "aimedCare", "OlderLead": "olderLead", "OlderReads": "olderReads", "TryLead": "tryLead", "TryReads": "tryReads", "QuestionsLead": "questionsLead"},
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
    elif zone == "reading" and sep and part is None and key == "Mark":
        if value not in KIND_LABELS:
            raise BuildError(f"unknown kind to pick out: {value}")
        holder["pick"] = value
    elif zone == "reading" and sep and part is None and key == "Read":
        holder["readLabels"] = [item.strip() for item in value.split(";")]
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


def verse_position(bible: dict, ref: str) -> tuple:
    _, verses = verses_of(bible, ref)
    if len(verses) != 1:
        raise BuildError(f"a phrase must name one verse: {ref}")
    return verses[0]


def find_once(phrase: str, text: str, ref: str) -> int:
    """Where a phrase stands in a verse. Refused if absent or if it occurs twice, because then the wrong one could be marked."""
    pattern = r"(?<!\w)" + re.escape(fold(phrase)) + r"(?!\w)"
    found = [m.start() for m in re.finditer(pattern, fold(text))]
    if len(found) != 1:
        raise BuildError(f"phrase occurs {len(found)} times, not once, in {ref}: {phrase!r}")
    return found[0]


TRAILING = re.compile(r"[,.;:!?”’\"')]*")


def leaf_lines(bible: dict, label: str, leaf: dict) -> list:
    """The passage broken into lines at its phrases. The lines join back to exactly the Berean text, or the build fails."""
    _, verses = verses_of(bible, label)
    inside = {(c, v) for c, v, _ in verses}
    placed = []
    for kind, ref, words in leaf["marks"]:
        if kind not in KIND_LABELS:
            raise BuildError(f"unknown kind {kind} on {label}")
        c, v, text = verse_position(bible, ref)
        if (c, v) not in inside:
            raise BuildError(f"{ref} is outside the passage {label}")
        start = find_once(words, text, ref)
        placed.append((c, v, start, start + len(words), kind))
    placed.sort()
    for first, second in zip(placed, placed[1:]):
        if first[:2] == second[:2] and first[3] > second[2]:
            raise BuildError(f"two phrases overlap in {label} at {first[0]}:{first[1]}")
    lines, plain = [], []
    level = 0
    so_steps = 0

    def flush() -> None:
        if plain:
            lines.append({"k": None, "l": level, "runs": list(plain)})
            plain.clear()
    for c, v, text in verses:
        plain.append({"v": v})
        at = 0
        for pc, pv, start, end, kind in placed:
            if (pc, pv) != (c, v):
                continue
            if start > at:
                plain.append(text[at:start])
            head = list(plain) if all(isinstance(run, dict) for run in plain) else []
            if not head:
                flush()
            else:
                plain.clear()
            if kind == "thanks":
                level, so_steps = 0, 0
            elif kind == "asks":
                level, so_steps = 1, 0
            elif kind == "so":
                so_steps = min(so_steps + 1, 3)
                level = 1 + so_steps
            end += len(TRAILING.match(text, end).group(0))  # a comma or full stop stays on the line it closes, never on a line of its own
            lines.append({"k": kind, "l": level, "runs": head + [text[start:end]]})
            at = end
        if at < len(text):
            plain.append(text[at:])
    flush()
    for line in lines:
        line["runs"] = [run.strip() if isinstance(run, str) else run for run in line["runs"]]
        line["runs"] = [run for run in line["runs"] if run != ""]
    shown = "".join(run for line in lines for run in line["runs"] if isinstance(run, str))
    if re.sub(r"\s", "", shown) != re.sub(r"\s", "", "".join(t for _, _, t in verses)):
        raise BuildError(f"the lines of {label} do not join back to its text")
    return lines


def build_leaf(builder: Builder, label: str) -> dict:
    leaf = LEAVES[label]
    out = {"r": builder.passage(label), "label": label, "role": ROLES[leaf["role"]], "who": builder.runs(leaf["who"]), "sure": builder.runs(leaf["sure"]), "lines": leaf_lines(builder.bible, label, leaf)}
    if leaf.get("note"):
        out["note"] = builder.runs(leaf["note"])
    return out


def build_climb(builder: Builder, climb: dict) -> dict:
    leaf = LEAVES[climb["leaf"]]
    stations, last = [], (0, 0, -1)
    for kind, ref, words in climb["stations"]:
        c, v, text = verse_position(builder.bible, ref)
        here = (c, v, find_once(words, text, ref))
        if here < last:
            raise BuildError(f"{climb['name']}: stations out of verse order at {ref}")
        last = here
        if not any(mark[0] == kind and mark[1] == ref and has_words(fold(words), fold(mark[2])) for mark in leaf["marks"]):
            raise BuildError(f"{climb['name']}: {words!r} is not inside a {kind} phrase of that leaf at {ref}")
        stations.append({"k": kind, "r": builder.passage(ref), "label": ref, "t": typographic(words), "verse": typographic(text)})
    if stations[-1]["k"] != "ends":
        raise BuildError(f"{climb['name']} must finish on where it arrives")
    if "so that" not in fold(plain_text(builder.bible, climb["leaf"])):
        raise BuildError(f"the page says all six say so that; {climb['leaf']} does not")
    return {"id": climb["id"], "name": climb["name"], "reading": climb["reading"], "r": builder.passage(climb["leaf"]), "stations": stations}


def build_aimed(builder: Builder) -> list:
    out = []
    for item in AIMED:
        in_verse(builder.bible, *item["ask"])
        in_verse(builder.bible, *item["aim"])
        out.append({"id": item["id"], "name": item["name"], "r": builder.passage(item["span"]), "span": item["span"],
                    "ask": typographic(item["ask"][1]), "aim": typographic(item["aim"][1])})
    return out


def build_older(builder: Builder) -> list:
    out = []
    for item in OLDER:
        in_verse(builder.bible, *item["old"])
        in_verse(builder.bible, *item["new"])
        if item["shared"]:
            for ref, _ in (item["old"], item["new"]):
                if item["shared"].lower() not in fold(plain_text(builder.bible, ref)).lower():
                    raise BuildError(f"{ref} does not share the words {item['shared']!r}")
        elif item["how"] == "Shares words":
            raise BuildError(f"{item['new'][0]} claims shared words and names none")
        out.append({"oldR": builder.passage(item["old"][0]), "oldLabel": item["old"][0], "oldT": typographic(item["old"][1]),
                    "newR": builder.passage(item["new"][0]), "newLabel": item["new"][0], "newT": typographic(item["new"][1]), "how": typographic(item["how"])})
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
        allowed = 1 if path.name == "pc-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in pc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if href is not None and not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def check_complete(study: dict) -> None:
    required = {"slug", "ask", "hook", "readLabels", "consider", "reflect"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
        for label in reading["readLabels"]:
            if label not in LEAVES:
                raise BuildError(f"reading {reading['slug']} names a passage with no leaf: {label}")
    if [r["slug"] for r in study["readings"]] != READING_ORDER:
        raise BuildError("the readings must follow READING_ORDER")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def figures(builder: Builder, study: dict, leaves: dict, climbs: list) -> dict:
    labels = {label for reading in study["readings"] for label in reading["leaves"]}
    if len(labels) != EXPECTED_PASSAGES or len(climbs) != 6 or len(TRY) != 3 or len(AIMED) != 3 or len(OLDER) != 6:
        raise BuildError("the page says 9 passages, 6 columns, 3 to try, 3 circumstances and 6 older lines; the lists now differ")
    walked = set()
    for label in labels:
        code, verses = verses_of(builder.bible, label)
        walked |= {(code, c, v) for c, v, _ in verses}
    named = sum(1 for label in labels for line in leaves[label]["lines"] if line["k"])
    reported = sum(1 for label in labels if LEAVES[label]["role"] == "reported")
    if reported != 6:
        raise BuildError(f"the page says six reported prayers; found {reported}")
    return {"passages": len(labels), "verses": len(walked), "reported": reported, "instructions": len(labels) - reported, "named": named, "questions": len(study["questions"]),
            "readings": len(study["readings"])}


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
    leaves = {label: build_leaf(builder, label) for label in LEAVES}
    for reading in study["readings"]:
        reading["leaves"] = reading.pop("readLabels")
        reading["restOpen"] = READ_FIRST_OPEN.get(reading["slug"], False)
    climbs = [build_climb(builder, climb) for climb in CLIMBS]
    numbers = figures(builder, study, leaves, climbs)
    data = {"schema": 1, "study": study, "leaves": leaves, "climbs": climbs, "aimed": build_aimed(builder), "older": build_older(builder), "tryLeaves": TRY, "kinds": KIND_LABELS,
            "passages": builder.passages, "sources": [{**s, "name": typographic(s["name"]), "note": typographic(s["note"])} for s in SOURCES], "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.PC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
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
