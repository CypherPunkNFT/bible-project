#!/usr/bin/env python3
"""Build data.js for The shape of Scripture mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/the-shape-of-scripture-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed; block quotes equal the whole Berean text of their reference; every reference
resolves with no gap; each quoted phrase is in a reference of its paragraph, one paragraph of its named held source, or the
named confession list; form lines rejoin to the exact Berean text; marks, steps and try-it references hold their words, as
whole words; the page's stated facts are tested; only art.js may use innerHTML. All this proves the words are there. It
does not prove that a reading is right, or that a writer meant a link.
"""
import hashlib
import html
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
LIBRARY = WEBSITE.parent / "sources/library"
CONTENT = WEBSITE / "content/studies/explore-the-bible/the-shape-of-scripture/content.md"
BSB = WEBSITE / "data/plain/bsb"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
HELD_XML = {
    "maclaren": LIBRARY / "source-ccel/asset-sermons-maclaren-expositions-gen-num/original.xml",
    "calvin-psalms": LIBRARY / "source-ccel/asset-ready-text-edition-l06-calvin-08/calcom08.xml",
    "calvin-isaiah": LIBRARY / "source-ccel/asset-ready-text-edition-l06-calvin-13/calcom13.xml",
    "henry-rev": LIBRARY / "bulk/ccel/henry_mhc6.xml",
    "jfb": LIBRARY / "bulk/ccel/jamieson_jfb.xml",
}
HELD_CREEDS = {"london": WEBSITE / "data/creeds/doc/1689-london-baptist-confession-1677.b1.json"}
FRAME_FILES = [WEBSITE / "design/authors-directions/shared/frame.css", WEBSITE / "design/authors-directions/shared/frame.js",
               WEBSITE / "design/authors-directions/teachers/teachers.css", WEBSITE / "design/manuscripts-directions/css/ms.css"]
BOOKS = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU", "Joshua": "JOS",
    "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
    "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB",
    "Psalm": "PSA", "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Songs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
    "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
    "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL", "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
    "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL",
    "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
    "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
    "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV",
}
CANON = list(BOOKS.values())
BOOK_NAMES = {code: name for name, code in BOOKS.items()}
REF_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?")
MIN_SOURCE_QUOTE_WORDS = 3
sys.path.insert(0, str(HERE))
from study_lists import FORMS, KINDS, MARKS, PARTS, STEPS, TRY, PAGE_REFERENCES, QUOTED_CONFESSION, SOURCES  # noqa: E402


class BuildError(Exception):
    pass


def fold(text):
    """Compare text regardless of curly or straight quotes and dash kind."""
    return text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}))


def has_words(phrase, text):
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


def load_bible():
    bible = {}
    for code in CANON:
        path = BSB / f"{code}.json"
        try:
            bible[code] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read Berean book {code} at {path}: {error}") from error
    return bible


def held_xml(path):
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    raw = re.sub(r"<note.*?</note>", "", raw, flags=re.S)
    pieces = re.split(r"</?(?:p|div\d?|h\d)\b[^>]*>", raw)
    return [fold(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", piece)))) for piece in pieces]


def held_creed(path):
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise BuildError(f"could not read held creed {path}: {error}") from error
    return [fold(section.get("text", "")) for section in document["sections"]]


def verses_of(bible, label):
    """Every (chapter, verse, text) in a reference. Fails if a verse is missing or the range has a gap."""
    match = REF_RE.fullmatch(label)
    if not match:
        raise BuildError(f"not a whole Scripture reference: {label!r}")
    name, c1, v1, c2, v2 = match.groups()
    code = BOOKS[name]
    c1, v1 = int(c1), int(v1)
    c2, v2 = int(c2) if c2 else c1, int(v2) if v2 else v1
    if (c2, v2) < (c1, v1):
        raise BuildError(f"reference runs backwards: {label}")
    keys = sorted(tuple(map(int, key.split(":"))) for key in bible[code])
    found = [(c, v, bible[code][f"{c}:{v}"]) for c, v in keys if (c1, v1) <= (c, v) <= (c2, v2)]
    if not found or found[0][:2] != (c1, v1) or found[-1][:2] != (c2, v2):
        raise BuildError(f"reference does not resolve in the Berean: {label}")
    for (c_a, v_a, _), (c_b, v_b, _) in zip(found, found[1:]):
        if not ((c_a == c_b and v_b == v_a + 1) or (c_b == c_a + 1 and v_b == 1)):
            raise BuildError(f"gap in {label} between {c_a}:{v_a} and {c_b}:{v_b}")
    return code, found


def ref_id(label):
    name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
    end = f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else "")
    return f"{BOOKS[name]}.{c1}.{v1}{end}"


def plain_text(bible, label):
    _, verses = verses_of(bible, label)
    return fold(" ".join(v[2] for v in verses)).replace('"', "")


def in_verse(bible, label, phrase):
    if not has_words(fold(phrase).replace('"', ""), plain_text(bible, label)):
        raise BuildError(f"phrase not found, as whole words, in {label}: {phrase!r}")


class Builder:
    def __init__(self, bible, foundation):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_xml(path) for key, path in HELD_XML.items()}
        self.held.update({key: held_creed(path) for key, path in HELD_CREEDS.items()})
        self.web_quotes = set()

    def passage(self, label):
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def runs(self, text, source=None):
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase."""
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        matches = list(REF_RE.finditer(text))
        ids = [self.passage(m.group(0)) for m in matches]
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        pools = [" ".join(fold(v["t"]) for v in self.passages[i]["verses"]).replace('"', "") for i in ids]
        for phrase in re.findall(r'"([^"]+)"', text):
            self.check_quoted(phrase, pools, source, text)
        out, last = [], 0
        for match, identity in zip(matches, ids):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": identity, "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    def check_quoted(self, phrase, pools, source, context):
        folded = fold(phrase)
        if any(has_words(folded, pool) for pool in pools):
            return
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of its named source {source}: {phrase!r}")
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.web_quotes.add(phrase)
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


TAGGED = {"care", "open", "source"}


def tagged_block(builder, line):
    tag = re.match(r"\[([a-z]+)(?::([a-z-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind not in TAGGED or (kind == "source") != bool(source) or (source and source not in builder.held):
        raise BuildError(f"bad tag or unknown source: {line[:60]}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source)}


def block_quote(builder, lines, index, quote):
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quote at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB":
        raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
    if fold(quote).replace('"', "") != plain_text(builder.bible, label):
        raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
    return {"k": "quote", "t": quote, "r": builder.passage(label), "label": label}, ref_at + 1


KEYS_TOP = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "Frame": "frame", "Mixed": "mixed",
            "Steps": "steps", "Try": "try", "Way": "way", "Close": "close", "Invite": "invite", "Question": "question", "Again": "again"}
KEYS_READING = {"Short": "short", "Hook": "hook", "Line": "line", "Name": "name", "Form": "form", "Hearers": "hearers", "Link": "link",
                "Own": "own", "Look closely": "look", "Your response": "response"}


def parse(builder, lines):
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": []}
    reading = part = None
    index, zone = 0, "top"
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("## "):
            heading = re.fullmatch(r"## (\d\d) (.+)", line)
            part = None
            if heading:
                reading = {"n": heading.group(1), "title": heading.group(2), "parts": []}
                study["readings"].append(reading)
                zone = "reading"
            else:
                reading, zone, study["closing"] = None, "close", line[3:]
        elif line.startswith("### "):
            if reading is None:
                raise BuildError(f"part outside a reading: {line}")
            part = {"title": line[4:], "blocks": []}
            reading["parts"].append(part)
        elif line.startswith("> "):
            block, index = block_quote(builder, lines, index, line[2:])
            if part is None:
                study["opening"] = block
            else:
                part["blocks"].append(block)
        elif line.startswith("["):
            if part is None:
                raise BuildError(f"tagged paragraph outside a part: {line[:60]}")
            part["blocks"].append(tagged_block(builder, line))
        else:
            keyed(builder, study, reading, part, zone, line)
    return study


def keyed(builder, study, reading, part, zone, line):
    key, sep, value = line.partition(": ")
    if sep and key == "Slug" and reading is not None:
        reading["slug"] = value
    elif sep and key == "Read" and reading is not None:
        reading["read"] = [builder.passage(item.strip()) for item in value.split(";")]
    elif sep and key == "Passage" and zone == "close":
        study["passage"] = builder.passage(value)
    elif sep and key in KEYS_READING and reading is not None and (part is None or key in ("Look closely", "Your response")):
        reading[KEYS_READING[key]] = builder.runs(value)
    elif sep and key in KEYS_TOP and part is None and zone in ("top", "close"):
        study[KEYS_TOP[key]] = builder.runs(value)
    elif part is not None:
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing: {line[:70]}")


def split_marks(line, marks):
    """A line into plain strings and {m: text} for each marked phrase, in order; first-come when phrases overlap."""
    pattern = "|".join(sorted(map(re.escape, marks), key=len, reverse=True))
    if not pattern:
        return [line], set()
    out, last, used = [], 0, set()
    for match in re.finditer(r"(?<!\w)(?:" + pattern + r")(?!\w)", line):
        if match.start() > last:
            out.append(line[last:match.start()])
        out.append({"m": match.group(0)})
        used.add(match.group(0))
        last = match.end()
    if last < len(line):
        out.append(line[last:])
    return out, used


def build_forms(builder):
    forms = {}
    for slug, blocks in FORMS.items():
        forms[slug] = []
        for block in blocks:
            zones = []
            for zone in block["zones"]:
                if fold(" ".join(zone["lines"])).replace('"', "") != plain_text(builder.bible, zone["ref"]):
                    raise BuildError(f"form lines do not rejoin to the whole Berean text of {zone['ref']}")
                lines, used = [], set()
                for line in zone["lines"]:
                    runs, found = split_marks(line, zone["marks"])
                    lines.append(runs)
                    used |= found
                if used != set(zone["marks"]):
                    raise BuildError(f"marks not found in {zone['ref']}: {set(zone['marks']) - used}")
                zones.append({"label": zone["label"], "r": builder.passage(zone["ref"]), "lines": lines})
            forms[slug].append({"type": block["type"], "caption": block["caption"], "tone": block.get("tone"), "zones": zones})
    return forms


def part_of(code):
    at = CANON.index(code)
    for part in PARTS:
        if CANON.index(part["first"]) <= at <= CANON.index(part["last"]):
            return part["id"]
    raise BuildError(f"book {code} is in no part")


def build_marks(builder):
    out = {}
    if set(MARKS) != {kind["id"] for kind in KINDS}:
        raise BuildError("the kinds and the marks do not line up")
    for kind in KINDS:
        rows = []
        for label, word, line in MARKS[kind["id"]]:
            in_verse(builder.bible, label, word)
            code = BOOKS[REF_RE.fullmatch(label).group(1)]
            if code in kind["home"]:
                raise BuildError(f"{label} is in a book where {kind['id']} is at home, so it proves nothing")
            rows.append({"r": builder.passage(label), "label": label, "code": code, "line": line})
        out[kind["id"]] = rows
    return out


STOP_PHRASES = {"the lord", "the lord said", "moses said", "god", "lord"}


def build_steps(builder):
    ids = [part["id"] for part in PARTS]
    rows = []
    seen = set()
    for later, earlier, later_ref, later_text, earlier_ref, earlier_text, kind, line in STEPS:
        if ids.index(later) <= ids.index(earlier) or (later, earlier) in seen:
            raise BuildError(f"a step must run from a later part to an earlier one, once: {later}, {earlier}")
        seen.add((later, earlier))
        for label, part in ((later_ref, later), (earlier_ref, earlier)):
            if part_of(BOOKS[REF_RE.fullmatch(label).group(1)]) != part:
                raise BuildError(f"{label} is not in the part {part}")
        if later_text.lower() in STOP_PHRASES or earlier_text.lower() in STOP_PHRASES:
            raise BuildError(f"phrase too common to show a link: {later_ref}")
        in_verse(builder.bible, later_ref, later_text)
        in_verse(builder.bible, earlier_ref, earlier_text)
        if kind in ("retells", "shares"):
            in_verse(builder.bible, earlier_ref, later_text)
        elif kind != "names":
            raise BuildError(f"unknown step kind {kind!r}")
        rows.append({"id": f"{later}-{earlier}", "later": later, "earlier": earlier, "kind": kind, "line": line,
                     "laterR": builder.passage(later_ref), "laterLabel": later_ref, "laterText": later_text,
                     "earlierR": builder.passage(earlier_ref), "earlierLabel": earlier_ref, "earlierText": earlier_text})
    wanted = len(ids) * (len(ids) - 1) // 2
    if len(rows) != wanted:
        raise BuildError(f"the staircase needs {wanted} steps, has {len(rows)}")
    return rows


def build_try(builder):
    rows = []
    for item in TRY:
        if item["answer"] not in item["options"]:
            raise BuildError(f"the answer is not among the options for {item['ref']}")
        rows.append({**item, "r": builder.passage(item["ref"])})
    in_verse(builder.bible, "Jeremiah 29:1", "letter")
    in_verse(builder.bible, "Jeremiah 29:7", "Seek the prosperity of the city")
    in_verse(builder.bible, "Luke 1:55", "to Abraham and his descendants")
    return rows


def check_facts(bible):
    """Sentences the page states about the text, tested. Revelation has no quotation formula; Psalm 13 says How long four times."""
    revelation = " ".join(bible["REV"].values()).lower()
    for formula in ("it is written", "scripture says", "as the prophet"):
        if formula in revelation:
            raise BuildError(f"the page says Revelation uses no quotation formula, and it has {formula!r}")
    if plain_text(bible, "Psalm 13:1-2").count("How long") != 4:
        raise BuildError("the page says How long comes four times in Psalm 13:1-2")
    if "But" not in plain_text(bible, "Psalm 13:5"):
        raise BuildError("the page says Psalm 13 turns on But")
    in_verse(bible, "1 Corinthians 3:19", "As it is written")
    in_verse(bible, "Job 5:13", "He catches the wise in their craftiness")
    in_verse(bible, "Mark 1:1", "the gospel of Jesus Christ")


def check_code():
    """The only markup strings allowed are the fixed drawings; a page file with innerHTML outside art() fails the build."""
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval("):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "ss-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in ss-core.js may, once")


def figures(builder, study, marks, steps):
    walked = set()
    for reading in study["readings"]:
        count = set()
        for identity in reading["read"]:
            passage = builder.passages[identity]
            count |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
        reading["verseCount"] = len(count)
        walked |= count
    all_marks = [row for rows in marks.values() for row in rows]
    return {
        "divisions": len(study["readings"]), "books": len(CANON), "verses": len(walked), "kinds": len(marks), "marks": len(all_marks),
        "markBooks": len({row["code"] for row in all_marks}), "steps": len(steps),
        "names": sum(row["kind"] == "names" for row in steps), "retells": sum(row["kind"] == "retells" for row in steps),
        "shares": sum(row["kind"] == "shares" for row in steps),
    }


def fingerprints():
    paths = [CONTENT, FOUNDATION, HERE / "build-data.py", HERE / "study_lists.py", *HELD_XML.values(), *HELD_CREEDS.values(), *FRAME_FILES,
             *(BSB / f"{code}.json" for code in CANON)]
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}


def build_payload():
    builder = Builder(load_bible(), fold(FOUNDATION.read_text(encoding="utf-8")))
    study = parse(builder, CONTENT.read_text(encoding="utf-8").splitlines())
    required = {"slug", "short", "hook", "line", "read", "name", "form", "hearers", "link", "own", "look", "response"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if set(FORMS) != {reading["slug"] for reading in study["readings"]}:
        raise BuildError("the forms and the readings do not line up")
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "mixed", "steps", "try", "close", "way", "invite", "question", "again", "passage"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")
    check_facts(builder.bible)
    check_code()
    forms = build_forms(builder)
    marks = build_marks(builder)
    steps = build_steps(builder)
    practice = build_try(builder)
    for label in PAGE_REFERENCES:
        builder.passage(label)
    numbers = figures(builder, study, marks, steps)
    bible_books = [{"code": code, "name": BOOK_NAMES[code], "part": part_of(code)} for code in CANON]
    data = {"study": study, "passages": builder.passages, "forms": forms, "kinds": KINDS, "marks": marks, "parts": PARTS, "steps": steps,
            "practice": practice, "books": bible_books, "sources": SOURCES, "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.SS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.web_quotes)


def write_atomically(target, payload):
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    check_only = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check_only:
        print(f"build-data: FAILED: expected no arguments or --check, received {sys.argv[1:]}", file=sys.stderr)
        return 2
    try:
        payload, numbers, passage_count, web_quotes = build_payload()
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
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages; "
          f"{len(web_quotes)} quoted phrases from web sources not checked by this script: {web_quotes}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
