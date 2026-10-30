#!/usr/bin/env python3
"""Build data.js for the Covenants and promises mock-up from the study's content.md and the Berean text.

Run: python design/covenants-and-promises-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not exactly what its inputs build now. Writes nothing.

Checks: every line of content.md is consumed; block quotes equal the whole Berean text of their reference; every
Scripture reference resolves with no gap, and no chapter:verse is left unrecognised; each quoted phrase is in one
reference of its paragraph, or one paragraph of its named held source, or on the named confession list; a paragraph
tagged own: (a restricted source, told in this site's words) may quote Scripture only; each later-Scripture line comes
after its origin, and its kind is proved by its wording; the page's stated facts are tested. Counts come from here.
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
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/covenants-and-promises/content.md"
BSB = WEBSITE / "data/plain/bsb"
CCEL = WEBSITE.parent / "sources/library/source-ccel"
CREEDS = WEBSITE / "data/creeds/doc"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
HELD_XML = {
    "calvin-gen": CCEL / "asset-ready-text-edition-l06-calvin-01/calcom01.xml",
    "calvin-jer": CCEL / "asset-ready-text-edition-l06-calvin-20/calcom20.xml",
    "calvin-rom": CCEL / "asset-ready-text-edition-l06-calvin-38/calcom38.xml",
    "calvin-gal": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "calvin-heb": CCEL / "asset-ready-text-edition-l06-calvin-44/calcom44.xml",
    "maclaren-gen": CCEL / "asset-sermons-maclaren-expositions-gen-num/original.xml",
}
HELD_CREEDS = {
    "london": [CREEDS / "1689-london-baptist-confession-1677.b1.json"],
    "westminster": [CREEDS / "westminster-confession-of-faith-1647.b1.json", CREEDS / "westminster-confession-of-faith-1647.b2.json"],
}
QUOTING = {*HELD_XML, *HELD_CREEDS}
OWN_WORDS = {"scheiderer", "semrad", "criswell", "wellum"}
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
SECTIONS = [("history", "History", "GEN", "EST"), ("poetry", "Poetry & Wisdom", "JOB", "SNG"), ("prophets", "Prophets", "ISA", "MAL"),
            ("gospels", "Gospels & Acts", "MAT", "ACT"), ("epistles", "Epistles", "ROM", "JUD"), ("revelation", "Revelation", "REV", "REV")]
REF_RE = re.compile(
    r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?"
)
MIN_SOURCE_QUOTE_WORDS = 3
from study_lists import QUOTED_CONFESSION, LINES, LOOSE, COVENANT_NAMES, STOP_WORDS, LETTER_QUOTES_NOT_DRAWN, LETTER_BOOKS, FACTS, PUBLIC_DOMAIN, SOURCES


class BuildError(Exception):
    pass


def fold(text):
    """Compare text regardless of curly or straight quotes and dash kind. One character in, one character out."""
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


def held_creed(paths):
    out = []
    for path in paths:
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read held creed {path}: {error}") from error
        out += [fold(section.get("text", "")) for section in document["sections"]]
    return out


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


class Builder:
    def __init__(self, bible, foundation):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_xml(path) for key, path in HELD_XML.items()}
        self.held.update({key: held_creed(paths) for key, paths in HELD_CREEDS.items()})
        self.web_quotes = set()

    def passage(self, label):
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {
                "label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses],
            }
        return identity

    def runs(self, text, source=None, own_words=False):
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase."""
        matches = list(REF_RE.finditer(text))
        ids = [self.passage(m.group(0)) for m in matches]
        if re.search(r"\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        pools = [" ".join(fold(v["t"]) for v in self.passages[i]["verses"]).replace('"', "") for i in ids]
        for phrase in re.findall(r'"([^"]+)"', text):
            self.check_quoted(phrase, pools, source, own_words, text)
        out, last = [], 0
        for match, identity in zip(matches, ids):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": identity, "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    def check_quoted(self, phrase, pools, source, own_words, context):
        folded = fold(phrase)
        if any(has_words(folded, pool) for pool in pools):
            return
        if own_words:
            raise BuildError(f"a restricted source is told in this site's words, yet this is quoted and is not Scripture: {phrase!r}")
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words, too short to tie to it: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of its named source {source}: {phrase!r}")
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.web_quotes.add(phrase)
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


def tagged_block(builder, line):
    tag = re.match(r"\[([a-z]+)(?::([a-z-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind == "own":
        if source not in OWN_WORDS:
            raise BuildError(f"unknown restricted source: {source}")
        return {"k": "own", "src": source, "runs": builder.runs(text, own_words=True)}
    if source and source not in QUOTING:
        raise BuildError(f"unknown source tag: {source}")
    if kind == "source" and not source:
        raise BuildError(f"source paragraph names no source: {line[:50]}")
    if kind not in ("source", "care", "other", "open"):
        raise BuildError(f"unknown paragraph kind: {kind}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source)}


def block_quote(builder, lines, index, quote):
    """A block quote and the '<reference> · BSB' line after it. Returns the block and the next line's index."""
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quote at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB":
        raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
    _, verses = verses_of(builder.bible, label)
    if fold(quote).replace('"', "") != fold(" ".join(v[2] for v in verses)).replace('"', ""):
        raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
    return {"k": "quote", "t": quote, "r": builder.passage(label), "label": label}, ref_at + 1


KEYS_TOP = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "Frame": "frame",
            "Way": "way", "Close": "close", "Question": "question", "Again": "again"}
KEYS_READING = {"Hook": "hook", "Line": "line", "Setting": "setting", "Speaks": "speaks", "To whom": "whom",
                "Promised": "promised", "Asked": "asked", "Sign": "sign", "Look closely": "look", "Your response": "response"}


def parse(builder, lines):
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": [], "maps": []}
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
            elif line.startswith("## Maps: "):
                reading, zone, study["mapsTitle"] = None, "maps", line[9:]
            else:
                reading, zone, study["closing"] = None, "close", line[3:]
        elif line.startswith("### "):
            part = {"title": line[4:], "blocks": []}
            (reading["parts"] if zone == "reading" else study["maps"]).append(part)
        elif line.startswith("> "):
            block, index = block_quote(builder, lines, index, line[2:])
            if part is not None:
                part["blocks"].append(block)
            else:
                study["opening"] = block
        elif line.startswith("["):
            if part is None:
                raise BuildError(f"tagged paragraph outside a part: {line[:60]}")
            part["blocks"].append(tagged_block(builder, line))
        else:
            parse_keyed(builder, study, reading, part, zone, line)
    return study


def parse_keyed(builder, study, reading, part, zone, line):
    key, sep, value = line.partition(": ")
    if sep and key == "Slug" and reading is not None:
        reading["slug"] = value
    elif sep and key == "Read" and reading is not None:
        reading["read"] = [builder.passage(item.strip()) for item in value.split(";")]
    elif sep and key == "Passage" and zone == "close":
        study["passage"] = builder.passage(value)
    elif sep and key in KEYS_READING and reading is not None:
        reading[KEYS_READING[key]] = builder.runs(value)
    elif sep and key == "Lead" and zone == "maps":
        study["mapsLead"] = builder.runs(value)
    elif sep and key in KEYS_TOP and part is None and zone in ("top", "close"):
        study[KEYS_TOP[key]] = builder.runs(value)
    elif part is not None:
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing: {line[:70]}")


def positions(bible):
    """Each book's first verse as a count of verses from the start of the Bible, and the total."""
    start, total = {}, 0
    for code in CANON:
        start[code] = total
        total += len(bible[code])
    return start, total


def place(bible, start, total, code, chapter, verse):
    keys = sorted(tuple(map(int, key.split(":"))) for key in bible[code])
    return (start[code] + keys.index((chapter, verse))) / total


def section_of(code):
    at = CANON.index(code)
    for slug, name, first, last in SECTIONS:
        if CANON.index(first) <= at <= CANON.index(last):
            return slug, name
    raise BuildError(f"book {code} is in no section")


def inside_marks(text):
    """The part of a verse inside quotation marks. A quotation may run on into the next verse, so a closing mark is optional."""
    opening = re.search(r"[“‘]", text)
    if not opening:
        return ""
    closing = max(text.rfind("”"), text.rfind("’"))
    return text[opening.end():closing] if closing > opening.start() else text[opening.end():]


def shares_run(older, later):
    tokens = lambda text: re.sub(r"[^a-z' ]", " ", fold(text).lower()).split()
    older_words = " " + " ".join(tokens(older)) + " "
    words = tokens(inside_marks(later))
    return any(" " + " ".join(words[i:i + 3]) + " " in older_words and set(words[i:i + 3]) - STOP_WORDS for i in range(len(words) - 2))


def build_lines(builder):
    start, total = positions(builder.bible)
    out = []
    for covenant, origin, later, kind, word in LINES:
        code_a, verses_a = verses_of(builder.bible, origin)
        code_b, verses_b = verses_of(builder.bible, later)
        a = place(builder.bible, start, total, code_a, *verses_a[0][:2])
        b = place(builder.bible, start, total, code_b, *verses_b[0][:2])
        if b <= a:
            raise BuildError(f"{later} does not come after {origin}")
        text_b = verses_b[0][2]
        if kind == "quoted":
            if not inside_marks(text_b):
                raise BuildError(f"{later} has no quotation mark in the Berean, so it cannot be shown as a quotation")
            if later not in LOOSE and not shares_run(" ".join(v[2] for v in verses_a), text_b):
                raise BuildError(f"{origin} and {later} share no run of three words with a content word, inside the quotation marks")
        elif not word or not has_words(word.lower(), fold(text_b).lower()):
            raise BuildError(f"{later} does not contain the word that proves its kind: {word!r}")
        section, section_name = section_of(code_b)
        out.append({"id": f"line-{len(out) + 1}", "covenant": covenant, "kind": kind, "origin": builder.passage(origin), "originLabel": origin,
                    "later": builder.passage(later), "laterLabel": later, "a": round(a, 5), "b": round(b, 5),
                    "section": section, "sectionName": section_name, "loose": later in LOOSE})
    return out


def check_letter_quotes(builder, study, lines):
    """Every quotation mark in a walked letter is a drawn line or a named exception."""
    drawn = {line["laterLabel"] for line in lines} | set(LETTER_QUOTES_NOT_DRAWN)
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            if passage["code"] not in LETTER_BOOKS:
                continue
            for verse in passage["verses"]:
                label = f"{BOOK_NAMES[passage['code']]} {verse['c']}:{verse['v']}"
                if "“" in verse["t"] and label not in drawn:
                    raise BuildError(f"{label} has a quotation mark but is neither a line nor a named exception")


def check_facts(bible):
    for label, reference, word, wanted in FACTS:
        _, verses = verses_of(bible, reference)
        found = has_words(word, fold(" ".join(v[2] for v in verses)).lower())
        if found != wanted:
            raise BuildError(f"the page says {label}, but {word!r} in {reference} is {'found' if found else 'absent'}")


def check_noah(bible):
    """The page says no verse after Genesis 9 has both Noah's name and the word covenant. Scan the whole Berean to prove it."""
    hits = []
    for code in CANON:
        for key, text in bible[code].items():
            if re.search(r"\bNoah\b", text) and re.search(r"\bcovenant\b", text, re.I):
                if not (code == "GEN" and int(key.split(":")[0]) <= 9):
                    hits.append(f"{code} {key}")
    if hits:
        raise BuildError(f"the page says no later verse has both Noah and covenant; found {hits}")


def word_count(bible):
    verses, books = 0, set()
    for code in CANON:
        count = sum(1 for text in bible[code].values() if re.search(r"\bcovenants?\b", text, re.I))
        verses += count
        if count:
            books.add(code)
    return verses, len(books)


def figures(builder, study, lines):
    walked = set()
    for reading in study["readings"]:
        count = set()
        for identity in reading["read"]:
            passage = builder.passages[identity]
            count |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
        reading["verseCount"] = len(count)
        walked |= count
    word_verses, word_books = word_count(builder.bible)
    nt_start = CANON.index("MAT")
    return {
        "covenants": len(COVENANT_NAMES), "readings": len(study["readings"]), "verses": len(walked), "lines": len(lines),
        "quoted": sum(line["kind"] == "quoted" for line in lines), "names": sum(line["kind"] == "names" for line in lines),
        "recalls": sum(line["kind"] == "recalls" for line in lines),
        "reachNT": sum(CANON.index(builder.passages[line["later"]]["code"]) >= nt_start for line in lines),
        "perCovenant": {key: sum(line["covenant"] == key for line in lines) for key in COVENANT_NAMES},
        "wordVerses": word_verses, "wordBooks": word_books, "totalBooks": len(CANON),
    }


def axis(bible):
    start, total = positions(bible)
    return [{"slug": slug, "name": name, "a": round(start[first] / total, 5), "b": round((start[last] + len(bible[last])) / total, 5)}
            for slug, name, first, last in SECTIONS]


def fingerprints(builder):
    """sha256 of every file this data.js was built from, so a stale data.js can be told from a current one."""
    creed_paths = [path for paths in HELD_CREEDS.values() for path in paths]
    paths = [CONTENT, FOUNDATION, *HELD_XML.values(), *creed_paths, *(BSB / f"{code}.json" for code in CANON)]
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}


def build_payload():
    """Read and check everything. Returns (the text of data.js, the figures, the passage count, phrases not checked here)."""
    builder = Builder(load_bible(), fold(FOUNDATION.read_text(encoding="utf-8")))
    study = parse(builder, CONTENT.read_text(encoding="utf-8").splitlines())
    required = {"slug", "hook", "line", "read", "setting", "speaks", "whom", "promised", "asked", "sign", "look", "response"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if {r["slug"] for r in study["readings"]} != set(COVENANT_NAMES) | {"heirs"}:
        raise BuildError("the readings do not match the five covenants plus the heirs")
    check_facts(builder.bible)
    check_noah(builder.bible)
    lines = build_lines(builder)
    check_letter_quotes(builder, study, lines)
    numbers = figures(builder, study, lines)
    not_drawn = [{"r": builder.passage(label), "label": label, "why": why} for label, why in LETTER_QUOTES_NOT_DRAWN.items()]
    data = {"study": study, "notDrawn": not_drawn, "passages": builder.passages, "lines": lines, "covenants": COVENANT_NAMES, "axis": axis(builder.bible),
            "sources": SOURCES, "numbers": numbers, "builtFrom": fingerprints(builder)}
    payload = "window.CP = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.web_quotes)


def write_atomically(target, payload):
    """Write beside the target under a name no other run shares, swap it in, and never leave the temporary file behind."""
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
