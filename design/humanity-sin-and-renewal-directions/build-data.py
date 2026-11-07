#!/usr/bin/env python3
"""Build data.js for the Humanity, sin and renewal mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/humanity-sin-and-renewal-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their
reference; every reference resolves with no gap; each quoted phrase is in a reference of its paragraph, one paragraph of its
named held source, or the named confession list; the body, leaves, garden and image lists hold their words in their verses;
the page's stated facts are tested; only art() may use innerHTML. All this proves the words are there. It does not prove that
a reading is right, or that a writer meant a link.
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
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/humanity-sin-and-renewal/content.md"
BSB = WEBSITE / "data/plain/bsb"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
HELD_XML = {
    "boyce": LIBRARY / "bulk/ccel/boyce_theology.xml",
    "calvin-gen": LIBRARY / "source-ccel/asset-ready-text-edition-l06-calvin-01/calcom01.xml",
    "henry-gen": LIBRARY / "bulk/ccel/henry_mhc1.xml",
}
CREEDS = WEBSITE / "data/creeds/doc"
HELD_CREEDS = {
    "abstract": CREEDS / "abstract-of-principles-1858.b1.json",
    "london": CREEDS / "1689-london-baptist-confession-1677.b1.json",
    "westminster": CREEDS / "westminster-confession-of-faith-1647.b1.json",
    "trent": CREEDS / "council-of-trent-canons-and-decrees-1563.b1.json",
    "orthodox": CREEDS / "longer-catechism-of-the-orthodox-church-1839.b1.json",
}
OWN_WORDS = {"traditional"}  # rights restricted: told in this site's words, so it may quote only Scripture
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
REF_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?")
MIN_SOURCE_QUOTE_WORDS = 3
sys.path.insert(0, str(HERE))
from study_lists import BODY, BODY_ANCHOR, GARDEN, IMAGE_STATES, LEAVES, LEAVES_ALSO, PAGE_REFERENCES, QUOTED_CONFESSION, SOURCES  # noqa: E402


class BuildError(Exception):
    """A check failed; the build exits 1 and data.js is left as it was."""


def fold(text: str) -> str:
    """Compare text regardless of curly or straight quotes and dash kind."""
    return text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}))


def has_words(phrase: str, text: str) -> bool:
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


def typographic(text: str) -> str:
    """Straight quotes in the study text become the curly ones the Berean uses. Runs after the quotation checks."""
    return re.sub(r'"([^"]*)"', "“\\1”", text).replace("'", "’")


def load_bible() -> dict:
    bible = {}
    for code in CANON:
        path = BSB / f"{code}.json"
        try:
            bible[code] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read Berean book {code} at {path}: {error}") from error
    return bible


def held_xml(path: Path) -> list:
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    raw = re.sub(r"<note.*?</note>", "", raw, flags=re.S)
    pieces = re.split(r"</?(?:p|div\d?|h\d)\b[^>]*>", raw)
    return [fold(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", piece)))) for piece in pieces]


def held_creed(path: Path) -> list:
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise BuildError(f"could not read held creed {path}: {error}") from error
    return [re.sub(r"\s+", " ", fold(section.get("text", ""))) for section in document["sections"]]


def verses_of(bible: dict, label: str) -> tuple:
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


def ref_id(label: str) -> str:
    name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
    end = f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else "")
    return f"{BOOKS[name]}.{c1}.{v1}{end}"


def plain_text(bible: dict, label: str) -> str:
    _, verses = verses_of(bible, label)
    return fold(" ".join(v[2] for v in verses)).replace('"', "")


def in_verse(bible: dict, label: str, phrase: str) -> None:
    if not has_words(fold(phrase).replace('"', ""), plain_text(bible, label)):
        raise BuildError(f"phrase not found, as whole words, in {label}: {phrase!r}")


class Builder:
    def __init__(self, bible: dict, foundation: str):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_xml(path) for key, path in HELD_XML.items()}
        self.held.update({key: held_creed(path) for key, path in HELD_CREEDS.items()})
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
        matches = list(REF_RE.finditer(text))
        ids = [self.passage(m.group(0)) for m in matches]
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
        if source in OWN_WORDS:
            raise BuildError(f"a restricted source may quote only Scripture, and this is not in a cited verse: {phrase!r}")
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


def tagged_block(builder: Builder, line: str) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "open", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind in ("source", "other"):
        if source not in builder.held:
            raise BuildError(f"unknown held source: {line[:60]}")
    elif kind != "own" or source not in OWN_WORDS:
        raise BuildError(f"unknown tag: {line[:60]}")
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
    "reading": {"Hook": "hook", "Line": "line", "Setting": "setting", "Honours": "honours", "Refuses": "refuses", "Points to": "points"},
    "after": {"Look closely": "look", "Your response": "response"},
    "part": {"Lead": "lead"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
STRAY_KEY = re.compile(r"[A-Z][\w']*(?: [\w']+){0,2}: ")


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives its keys)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    part = re.fullmatch(r"## Part: ([a-z]+) \| ([^|]+) \| ([^|]+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        holder = {"n": numbered.group(1), "title": typographic(numbered.group(2)), "parts": []}
        study["readings"].append(holder)
        return "reading", holder
    if part:
        holder = {"id": part.group(1), "title": part.group(2), "turn": part.group(3), "parts": []}
        study["views"][part.group(1)] = holder
        return "part", holder
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
    study = {"readings": [], "views": {}}
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
            if zone not in ("reading", "part"):
                raise BuildError(f"part outside a reading or view: {line}")
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


def build_body(builder: Builder) -> dict:
    rows = []
    for row in BODY:
        sin_ref, sin_text = row["sin"]
        in_verse(builder.bible, sin_ref, sin_text)
        if not has_words(row["word"], sin_text):
            raise BuildError(f"the word {row['word']!r} is not in the line for {row['id']}")
        from_ref, from_text = row["from"]
        in_verse(builder.bible, from_ref, from_text)
        out = {"id": row["id"], "part": row["part"], "x": row["x"], "y": row["y"], "sinR": builder.passage(sin_ref), "sinLabel": sin_ref,
               "sinText": sin_text, "fromR": builder.passage(from_ref), "fromLabel": from_ref, "fromText": from_text, "newKind": "none"}
        if row["new"]:
            new_ref, new_text = row["new"]
            in_verse(builder.bible, new_ref, new_text)
            same = row["newWord"] is not None and row["newWord"].rstrip("s") == row["word"].rstrip("s") and has_words(row["newWord"], new_text)
            if row["newWord"] is not None and not same:
                raise BuildError(f"{row['id']} claims the same word, and {row['newWord']!r} is not the same word in {new_ref}")
            out.update({"newR": builder.passage(new_ref), "newLabel": new_ref, "newText": new_text, "newKind": "same" if same else "other"})
        rows.append(out)
    anchor_ref, anchor_a, anchor_b = BODY_ANCHOR
    for phrase in (anchor_a, anchor_b):
        in_verse(builder.bible, anchor_ref, phrase)
    return {"rows": rows, "anchor": {"r": builder.passage(anchor_ref), "label": anchor_ref, "sin": anchor_a, "renewed": anchor_b}}


def build_leaves(builder: Builder, rows: list) -> list:
    out = []
    for row in rows:
        for phrase in (row["hinge"], row["left"], row["right"]):
            in_verse(builder.bible, row["ref"], phrase)
        out.append({**row, "left": typographic(row["left"]), "right": typographic(row["right"]), "r": builder.passage(row["ref"]), "label": row["ref"]})
    return out


def build_garden(builder: Builder) -> dict:
    def rows(entries: list) -> list:
        out = []
        for who, label, phrase in entries:
            if label:
                in_verse(builder.bible, label, phrase)
            out.append({"who": who, "r": builder.passage(label) if label else None, "label": label, "text": phrase})
        return out
    then_ref, then_text = GARDEN["then"]
    in_verse(builder.bible, then_ref, then_text)
    return {"asked": rows(GARDEN["asked"]), "spoken": rows(GARDEN["spoken"]), "then": {"r": builder.passage(then_ref), "label": then_ref, "text": then_text}}


def build_image(builder: Builder) -> list:
    out = []
    for state in IMAGE_STATES:
        places = []
        for label, phrase in state["places"]:
            in_verse(builder.bible, label, phrase)
            places.append({"r": builder.passage(label), "label": label, "text": typographic(phrase)})
        out.append({**state, "line": typographic(state["line"]), "places": places})
    return out


def check_facts(bible: dict) -> None:
    """Sentences the page states about the text, tested."""
    romans5 = plain_text(bible, "Romans 5:15-20")
    if romans5.count("how much more") != 2 or romans5.count("all the more") != 1:
        raise BuildError("the page says how much more comes twice and all the more once in Romans 5:15-20")
    in_verse(bible, "Genesis 3:14", "to the serpent")
    in_verse(bible, "Genesis 3:16", "To the woman He said")
    in_verse(bible, "Genesis 3:17", "to Adam He said")
    in_verse(bible, "Genesis 3:13", "The serpent deceived me")
    in_verse(bible, "Romans 3:12", "worthless")
    in_verse(bible, "Psalm 14:3", "corrupt")
    in_verse(bible, "Ecclesiastes 7:20", "no righteous man")


def check_code() -> None:
    """The only markup strings allowed are the fixed drawings; a page file with innerHTML outside art() fails the build."""
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval("):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "hs-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in hs-core.js may, once")


def check_sources() -> None:
    for source in SOURCES:
        href = source["href"]
        if href is not None and not (href.startswith("https://") or href.startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {href}")


def figures(builder: Builder, study: dict, body: dict, leaves: list, image: list) -> dict:
    walked = set()
    for reading in study["readings"]:
        count = set()
        for identity in reading["read"]:
            passage = builder.passages[identity]
            count |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
        reading["verseCount"] = len(count)
        walked |= count
    return {"passages": len(study["readings"]), "verses": len(walked), "bodyParts": len(body["rows"]),
            "sameWord": sum(row["newKind"] == "same" for row in body["rows"]), "contrasts": len(leaves),
            "stepRows": sum(row["step"] for row in leaves), "states": len(image), "places": sum(len(s["places"]) for s in image)}


def fingerprints() -> dict:
    paths = [CONTENT, FOUNDATION, HERE / "build-data.py", HERE / "study_lists.py", *HELD_XML.values(), *HELD_CREEDS.values(), *FRAME_FILES,
             *(BSB / f"{code}.json" for code in CANON)]
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}


def check_complete(study: dict) -> None:
    required = {"slug", "hook", "line", "read", "setting", "honours", "refuses", "points", "look", "response"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"passage {reading['n']} lacks {sorted(missing)}")
    if len(study["readings"]) != 6 or set(study["views"]) != {"reach", "image"}:
        raise BuildError("the page expects six passages and the two views reach and image")
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "close", "way", "invite", "question", "again", "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def build_payload() -> tuple:
    builder = Builder(load_bible(), fold(FOUNDATION.read_text(encoding="utf-8-sig")))
    study = parse(builder, CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n").split("\n"))
    check_complete(study)
    check_facts(builder.bible)
    check_code()
    check_sources()
    body = build_body(builder)
    leaves = build_leaves(builder, LEAVES)
    also = build_leaves(builder, LEAVES_ALSO)
    garden = build_garden(builder)
    image = build_image(builder)
    for label in PAGE_REFERENCES:
        builder.passage(label)
    numbers = figures(builder, study, body, leaves, image)
    data = {"study": study, "passages": builder.passages, "body": body, "leaves": leaves, "leavesAlso": also, "garden": garden, "image": image,
            "sources": [{**s, "name": typographic(s["name"]), "note": typographic(s["note"])} for s in SOURCES], "numbers": numbers, "builtFrom": fingerprints()}
    payload = "window.HS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.web_quotes)


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
