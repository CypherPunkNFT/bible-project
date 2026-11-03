"""Pulls every reader-facing English string out of the site's content files and writes them, in chunks, into the
site-translation repository (../../../SiteTranslation) for the cloud translation sessions.

Which fields are translated is decided by SOURCES below, one entry per kind of content file. Scripture quotations are
left out on purpose (each language's own Bible fills them by reference), and so are book titles, authors, licences
and catalogue metadata. The page code's own text (--pages) and the Resources files bundled with the code (--resources)
are added later as new chunks after the last one.

Each unique English string of a kind gets one id, sha1(kind + text)[:12], so a repeated label is translated once and
the later import can match translations back by walking the same SOURCES. Usage: python extract.py [--out DIR]
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parents[2]
DEFAULT_OUT = SITE.parents[0] / "SiteTranslation"
CHUNK_WORDS = 4000
CHUNK_STRINGS = 400
WORD = re.compile(r"[^\W\d_]+")

# kind, file glob, record-map file (its top-level keys are ids), parents whose child keys are ids,
# paths of plain strings, paths of stanzas (list of lines, joined by "\n"),
# paths of mixed paragraphs (text with Bible references in between, written as {{1}}, {{2}}).
SOURCES = [
    ("person", "data/study/people/*.json", False, (), {
        ".d", ".e", ".t", ".b", ".short", ".article", ".note", ".story.short", ".story.paragraphs[].text"}, set(), set()),
    ("topic", "data/topics/t/*.json", True, (), {
        ".*.title", ".*.points[].text", ".*.points[].items[].text", ".*.nave[].text", ".*.nave[].items[].text",
        ".*.keyVerses[].point"}, set(), {".*.dictionary[]"}),
    ("topic", "data/topics/index.json", False, ("topics",), {
        ".categories[].title", ".categories[].description", ".categories[].subcategories[].title",
        ".categories[].subcategories[].description", ".topics.*.title"}, set(), set()),
    ("topic", "data/topics/chapters/*.json", False, ("names",), {".names.*"}, set(), set()),
    ("summary", "data/summaries/*.json", False, (), {
        ".notice", ".chapters.*.title", ".chapters.*.summary", ".chapters.*.invitation", ".chapters.*.outline[][]"},
     set(), set()),
    ("question", "data/questions/bank.json", False, ("kinds",), {
        ".questions[].question", ".questions[].answer", ".questions[].answer_choice", ".questions[].options[]",
        ".questions[].lesson", ".questions[].subjects[]", ".questions[].people[]", ".questions[].places[]",
        ".questions[].child.question", ".questions[].child.answer", ".questions[].child.options[]",
        ".questions[].lead_in.question", ".questions[].lead_in.answer", ".kinds.*", ".topics[].title",
        ".books[].name", ".books[].short"}, set(), set()),
    ("museum", "data/museums/*.json", False, (), {
        ".name", ".place", ".lead", ".note", ".why_coming_soon", ".objects[].title", ".objects[].description",
        ".objects[].findspot", ".objects[].period", ".objects[].date", ".objects[].culture", ".objects[].basis_label",
        ".objects[].why", ".objects[].dimensions", ".objects[].catalogue[].scope", ".objects[].catalogue[].supported",
        ".objects[].catalogue[].unsupported", ".objects[].catalogue[].category", ".objects[].catalogue[].name"},
     set(), set()),
    ("creed", "data/creeds/doc/*.json", False, (), {
        ".title", ".tradition", ".yearLabel", ".parts[].label", ".sections[].heading", ".sections[].question",
        ".sections[].text"}, set(), set()),
    ("creed", "data/creeds/index.json", False, (), {
        ".families[].title", ".families[].lead", ".families[].span", ".families[].documents[].title",
        ".families[].documents[].yearLabel", ".families[].documents[].tradition"}, set(), set()),
    ("hymn", "data/hymns/pages/*.json", True, (), {
        ".*.firstLine", ".*.subtitle", ".*.partLabel", ".*.book.label", ".*.book.ticks[].t", ".*.meterName"},
     {".*.stanzas[]"}, set()),
    ("hymn", "data/hymns/texts/*.json", True, (), {".*.title", ".*.subject", ".*.book"}, {".*.stanzas[]"}, set()),
    ("hymn", "data/hymns/by-book/*.json", False, (), {".*.on[].t", ".*.echo[].t"}, set(), set()),
    ("hymn", "data/hymns/collection.json", False, (), {".hymns[].t", ".hymns[].s", ".groups[].label", ".groups[].short"},
     set(), set()),
    ("apologetics", "public/content/apologetics/*.json", False, (), {
        ".documents[].title", ".documents[].content.note", ".documents[].content.sections[].text",
        ".documents[].content.answer.text", ".documents[].content.reasoning[].text", ".documents[].content.reply.text",
        ".documents[].content.rows[].other.text", ".documents[].content.rows[].christian.text",
        ".documents[].content.limit.text", ".documents[].content.conclusion.text", ".records[].reading.summary",
        ".records[].reading.startingPoint"}, set(), set()),
    ("sources", "public/content/sources/directory.json", False, ("records",), {
        ".collections[].label", ".collections[].definition", ".entries[].role", ".entries[].status", ".entries[].kind",
        ".entries[].links[].format", ".entries[].links[].name", ".entries[].citedOn[].page",
        ".entries[].citedOn[].feature", ".records.*.caution"}, set(), set()),
]
MARKDOWN = ("apologetics", "public/content/apologetics/*.md")

# The Resources files bundled with the code (src/data/resources/): help places, phone lines, churches and groups, city
# facts, workbooks. Appended as new chunks (--resources); apply.py writes their translated copies to
# data/i18n/<lang>/resources/, which src/data/resources/index.ts reads. Names, addresses, ids and categories stay
# English: the code keys on them ("No walk-in" addresses go to the page text instead, see resource_page_strings).
RESOURCE_KIND = "resource"
RESOURCES = [
    (RESOURCE_KIND, "src/data/resources/life.json", False, (), {
        ".groups[].title", ".groups[].entries[].summary", ".groups[].entries[].contact[].note",
        ".groups[].entries[].hours", ".groups[].entries[].cost", ".cities[].entries[].summary",
        ".cities[].entries[].contact[].note", ".cities[].entries[].hours", ".cities[].entries[].cost",
        ".cities[].lines[].summary", ".cities[].lines[].contact[].note", ".cities[].lines[].hours",
        ".cities[].lines[].cost"}, set(), set()),
    (RESOURCE_KIND, "src/data/resources/fellowships.json", False, (), {
        ".groups[].title", ".groups[].entries[].summary", ".groups[].entries[].cost",
        ".groups[].entries[].jacksonville"}, set(), set()),
    (RESOURCE_KIND, "src/data/resources/fellowship-cities.json", False, (), {
        ".cities[].places[].name", ".cities[].places[].when", ".cities[].nearby[].name", ".cities[].nearby[].when"},
     set(), set()),
    (RESOURCE_KIND, "src/data/resources/*-facts.json", False, (), {".facts[].label", ".facts[].note", ".facts[].unit"},
     set(), set()),
    (RESOURCE_KIND, "src/data/resources/learning.json", False, (), {
        ".items[].title", ".items[].summary", ".items[].outline.intro", ".items[].outline.parts[].label",
        ".items[].outline.parts[].place", ".items[].outline.sessions[].title", ".items[].outline.sessions[].brief"},
     set(), set()),
]

# Text written into the page code: JSX text between tags, label-like attributes, and prose string literals. The site
# swaps each on screen for its translation (src/components/PageTranslator.tsx), matching the text exactly as shown.
PAGE_KIND = "page"
JSX_TEXT = re.compile(r"(?<![=\-])>([^<>{}]{1,600})<")
# JSX text touching an expression on one side: "}start anywhere<", ">Open the map of {", "} answered<". In plain code
# the same shape catches statements, so EDGE_CODE throws those out.
JSX_EDGE = re.compile(r"(?:\}|(?<![=\-])>)([^<>{}]{1,600})(?=[<{])")
# Also thrown out: the pieces of a template string around its ${...} (one text node on screen, never these pieces),
# and SVG path data ("M0,0 L-4,13 Z").
EDGE_CODE = re.compile(r"[;`]|\(\)|\$$|\$\{|^[MmLlHhVvCcSsQqTtAaZz\d\s.,-]*\d[MmLlHhVvCcSsQqTtAaZz\d\s.,-]*$|^(?:export|function|const|let|var|return|else|if|import|interface|type|case|default|"
                       r"async|await|for|while|try|catch|finally|throw|new|typeof|extends|class|as|satisfies)\b")
# A template string with values in it: each ${...} becomes "{n}", the form the site matches counts by ("{n} scholars").
TEMPLATE = re.compile(r"`([^`\\\n]*\$\{[^`\\\n]*)`")
TEMPLATE_VALUE = re.compile(r"\$\{[^{}]*\}")
IMPORT = re.compile(r"""\bfrom\s+["'](@/|\.{1,2}/)([^"']+)["']""")
PAGE_ATTRIBUTE = re.compile(r'\b(?:aria-label|title|placeholder|alt|label)="([^"\n]{1,300})"')
# One-word labels in data written into the code ({ label: "Study" }), which PAGE_LITERAL's two-word floor skips.
PAGE_PROPERTY = re.compile(r'\b(?:label|title|heading|subtitle|name|text|caption|description|short|kicker|eyebrow)\s*:\s*"([^"\\\n]{2,300})"')
# A single quote touching a word is an apostrophe ("the letter's", "Hebrews'"), not the edge of a string.
# Every string is matched, however short, so that a "nt" cannot put the following quotes out of step; page_strings
# then skips those outside PAGE_LITERAL_LENGTH.
PAGE_LITERAL = re.compile(r'"([^"\\\n]*)"|' + r"(?<![\w'’])'([^'\\\n]*)'(?!\w)|" + r"`([^`$\\\n]*)`")
PAGE_LITERAL_LENGTH = range(3, 401)
CODE_LIKE = re.compile(r"[;=]|=>|&&|\|\||^\W|\",\w+:|\.(tsx?|css|json|svg|png|jpe?g|md)\b|^[\w./@-]+$|\b(?:px|rem|var\(|rgba?\(|hsl)\b"
                       r"|\.\d+m?s\b|\bxM[a-z]+Y[A-Z]|\b(?:translate|scale|rotate)\(|\bMath\.|\bmain h1\b|#root\b")


def class_like(text: str) -> bool:
    tokens = text.split()
    return sum(bool(re.search(r"[-:\[\]/]|^\d", token)) for token in tokens) >= max(1, len(tokens) // 2)


def without_comments(source: str) -> str:
    """The code with its comments blanked, reading strings as strings so a "//" in an address survives. An apostrophe in
    JSX text does not open a string, and a quote left open at the end of its line was not a string."""
    out, position, size = [], 0, len(source)
    while position < size:
        char = source[position]
        pair = source[position:position + 2]
        if pair == "/*":
            end = source.find("*/", position + 2)
            position = size if end < 0 else end + 2
        elif pair == "//" and source[position - 1:position] != ":":
            end = source.find("\n", position)
            position = size if end < 0 else end
        elif char in "\"`" or (char == "'" and not re.match(r"[\w'’]", source[position - 1:position] or " ")):
            end = position + 1
            while end < size and source[end] != char and (char == "`" or source[end] != "\n"):
                end += 2 if source[end] == "\\" else 1
            closed = end < size and source[end] == char
            stop = end + 1 if closed else position + 1
            out.append(source[position:stop])
            position = stop
        else:
            out.append(char)
            position += 1
    return "".join(out)


def imported_file(source: Path, prefix: str, name: str) -> Path | None:
    base = SITE / "src" / name if prefix == "@/" else source.parent / (prefix + name)
    for candidate in (Path(f"{base}.tsx"), Path(f"{base}.ts"), base / "index.tsx", base / "index.ts", base):
        if candidate.suffix in {".ts", ".tsx"} and candidate.is_file():
            return candidate.resolve()
    return None


def page_files() -> list[Path]:
    """The page code: every source file outside mock-ups, tests and generated code, and the mock-up files a real page
    imports (the homepage's opening lives in pages/mockup/home-openings/)."""
    def skipped(path: Path) -> bool:
        return bool({"generated", "dev", "test"} & set(path.parts)) or ".test." in path.name

    files = [p.resolve() for p in sorted((SITE / "src").rglob("*.ts*")) if not skipped(p) and "mockup" not in p.parts]
    seen, queue, borrowed = set(files), list(files), []
    while queue:
        path = queue.pop()
        for prefix, name in IMPORT.findall(path.read_text("utf-8")):
            found = imported_file(path, prefix, name)
            if found and found not in seen and not skipped(found):
                seen.add(found)
                queue.append(found)
                borrowed.append(found)
    return files + sorted(borrowed)


def balanced(text: str) -> bool:
    return text.count("(") == text.count(")") and text.count("[") == text.count("]")


def jsx_prose(text: str) -> bool:
    """JSX text between tags; a semicolon is allowed in a sentence of five words or more ("...be read; every...")."""
    if not translatable(text):
        return False
    if not CODE_LIKE.search(text) or re.fullmatch(r"[A-Z][a-z'’-]+", text):  # a one-word label: <h2>Read</h2>, <th>Date</th>
        return True
    return (len(WORD.findall(text)) >= 5 and bool(re.match(r"[A-Z“‘\"(]", text))
            and not CODE_LIKE.search(text.replace(";", ",")))


def template_text(literal: str) -> str | None:
    text = " ".join(TEMPLATE_VALUE.sub("{n}", literal).split())
    rest = " ".join(text.replace("{n}", " ").split())
    if "$" in rest or "{" in rest or not re.search(r"[A-Za-z]{3}", rest) or EDGE_CODE.search(text.replace("{n}", "0")):
        return None
    one_word = re.fullmatch(r"[A-Za-z]{3,}", rest) and " " in text  # "{n} scholars", not "{n}px"
    return None if (CODE_LIKE.search(rest) and not one_word) or class_like(rest) else text


def page_strings() -> list[str]:
    found: dict[str, None] = {}
    for path in page_files():
        source = without_comments(path.read_text("utf-8"))
        for match in JSX_TEXT.finditer(source):
            text = " ".join(match.group(1).split())
            if jsx_prose(text):
                found.setdefault(text)
        for match in TEMPLATE.finditer(source):
            if text := template_text(match.group(1)):
                found.setdefault(text)
        for match in JSX_EDGE.finditer(source):
            text = " ".join(match.group(1).split())
            if translatable(text) and balanced(text) and not CODE_LIKE.search(text) and not EDGE_CODE.search(text):
                found.setdefault(text)
        for match in PAGE_ATTRIBUTE.finditer(source):
            text = " ".join(match.group(1).split())
            if translatable(text):
                found.setdefault(text)
        for match in PAGE_PROPERTY.finditer(source):
            text = " ".join(match.group(1).split())
            one_word = re.fullmatch(r"[A-Z][a-z'’]+", text)
            if one_word or (re.match(r"[A-Z]", text) and not CODE_LIKE.search(text) and not class_like(text)):
                found.setdefault(text)
        for match in PAGE_LITERAL.finditer(source):
            literal = next(group for group in match.groups() if group is not None)
            text = " ".join(literal.split())
            if (len(literal) in PAGE_LITERAL_LENGTH and len(WORD.findall(text)) >= 2 and re.search(r"[A-Z]|[.?!,]", text)
                    and not CODE_LIKE.search(text) and not class_like(text)):
                found.setdefault(text)
    return list(found)


def translatable(text: str) -> bool:
    text = text.strip()
    return bool(WORD.search(text)) and not text.startswith(("http://", "https://"))


def mixed_text(paragraph: list) -> str | None:
    """A paragraph of text pieces with references between them; references become {{1}}, {{2}}, ..."""
    parts, number = [], 0
    for piece in paragraph:
        if isinstance(piece, str):
            parts.append(piece)
        else:
            number += 1
            parts.append(f"{{{{{number}}}}}")
    text = "".join(parts)
    return text if translatable(text) else None


MARKER = re.compile(r"\{\{(\d+)\}\}")


def rebuild_mixed(paragraph: list, translated: str) -> list:
    """The translated text split back around its {{n}} markers, with the original references put back in place."""
    references = [piece for piece in paragraph if not isinstance(piece, str)]
    parts = MARKER.split(translated)
    numbers = [int(n) for n in parts[1::2]]
    if sorted(numbers) != list(range(1, len(references) + 1)):
        return paragraph
    rebuilt = [parts[0]]
    for number, text in zip(numbers, parts[2::2]):
        rebuilt += [references[number - 1], text]
    return [piece for piece in rebuilt if piece != ""]


def walk(value, path: str, spec: tuple, visit, depth: int = 0):
    """Returns `value` with every translatable string passed through visit(text), which returns the replacement or
    None to keep the English. Extraction visits without replacing; the import replaces."""
    _, _, record_map, wild_parents, plain, stanzas, mixed = spec
    if isinstance(value, dict):
        parent = path.rsplit(".", 1)[-1]
        out = {}
        for key, child in value.items():
            wild = key.isdigit() or (record_map and depth == 0) or parent in wild_parents
            out[key] = walk(child, f"{path}.{'*' if wild else key}", spec, visit, depth + 1)
        return out
    if isinstance(value, list):
        item_path = path + "[]"
        out = []
        for item in value:
            if item_path in stanzas and isinstance(item, list) and all(isinstance(line, str) for line in item):
                text = "\n".join(item)
                new = visit(text) if translatable(text) else None
                out.append(new.split("\n") if new and new.count("\n") == text.count("\n") else item)
            elif item_path in mixed and isinstance(item, list):
                text = mixed_text(item)
                new = visit(text) if text else None
                out.append(rebuild_mixed(item, new) if new else item)
            else:
                out.append(walk(item, item_path, spec, visit, depth + 1))
        return out
    if isinstance(value, str) and path in plain and translatable(value):
        return visit(value) or value
    return value


def markdown_paragraphs(text: str) -> list[str]:
    return [p.strip("\n") for p in re.split(r"\n\s*\n", text) if translatable(p)]


def string_id(kind: str, text: str) -> str:
    return hashlib.sha1(f"{kind}\0{text}".encode("utf-8")).hexdigest()[:12]


def collect() -> dict[str, dict[str, str]]:
    """kind -> {id: English}, in file order, each unique string once."""
    by_kind: dict[str, dict[str, str]] = {}
    for spec in SOURCES:
        kind, pattern = spec[0], spec[1]
        files = sorted(SITE.glob(pattern))
        if not files:
            raise SystemExit(f"no files match {pattern}: the site's data layout changed, update SOURCES")
        strings = by_kind.setdefault(kind, {})
        for path in files:
            walk(json.loads(path.read_text("utf-8")), "", spec,
                 lambda text: strings.setdefault(string_id(kind, text), text) and None)
    kind, pattern = MARKDOWN
    for path in sorted(SITE.glob(pattern)):
        for text in markdown_paragraphs(path.read_text("utf-8")):
            by_kind[kind].setdefault(string_id(kind, text), text)
    return by_kind


def words(text: str) -> int:
    return len(WORD.findall(text))


def chunks(by_kind: dict[str, dict[str, str]], max_strings: int = CHUNK_STRINGS):
    for kind, strings in by_kind.items():
        current, total = {}, 0
        for key, text in strings.items():
            if current and (total + words(text) > CHUNK_WORDS or len(current) >= max_strings):
                yield kind, current, total
                current, total = {}, 0
            current[key] = text
            total += words(text)
        if current:
            yield kind, current, total


def resource_strings() -> list[str]:
    found: dict[str, None] = {}
    for spec in RESOURCES:
        files = sorted(SITE.glob(spec[1]))
        if not files:
            raise SystemExit(f"no files match {spec[1]}: the Resources data layout changed, update RESOURCES")
        for path in files:
            walk(json.loads(path.read_text("utf-8")), "", spec, lambda text: found.setdefault(text))
    return list(found)


def resource_page_strings() -> list[str]:
    """The help lines' "No walk-in address listed (...)": the code reads the English, so the screen swaps it instead."""
    life = json.loads((SITE / "src/data/resources/life.json").read_text("utf-8"))
    lines = [line for city in life["cities"] for line in city.get("lines", [])]
    return list(dict.fromkeys(line["address"] for line in lines if line.get("address", "").startswith("No walk-in")))


def not_scripture(text: str) -> bool:
    """A study's blockquoted Scripture and the verse reference under it stay out, like every other Scripture quotation."""
    return not text.startswith(">") and not VERSE_REFERENCE.fullmatch(text)


# Long-form text added after the first extraction as new chunks (--documents), like the Resources above: the debate
# transcripts' spoken paragraphs and the study pages' own text. Each chunk holds at most DOCUMENT_STRINGS strings and
# CHUNK_WORDS words, so one translation call can carry it.
DOCUMENTS = [
    ("transcript", "content/apologetics/transcripts/*.txt", lambda text: True),
    ("study", "content/studies/*/*/content.md", not_scripture),
]
DOCUMENT_STRINGS = 100
LONG_PARAGRAPH_WORDS = 300
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")
VERSE_REFERENCE = re.compile(r"\d?\s?[A-Za-z][A-Za-z ]*\s\d+:\d+[\d\s,–-]*(?:\s·\s[A-Z]{2,})?")


def paragraphs(text: str) -> list[str]:
    """The blocks of text between blank lines, each cut at sentence ends once it runs past LONG_PARAGRAPH_WORDS."""
    found = []
    for block in re.split(r"\n\s*\n", text):
        block = block.strip()
        if not translatable(block):
            continue
        if words(block) <= LONG_PARAGRAPH_WORDS:
            found.append(block)
            continue
        current: list[str] = []
        for sentence in SENTENCE_END.split(block):
            if current and words(" ".join(current + [sentence])) > LONG_PARAGRAPH_WORDS:
                found.append(" ".join(current))
                current = []
            current.append(sentence)
        found.append(" ".join(current))
    return found


def document_strings(pattern: str, keep) -> list[str]:
    files = sorted(SITE.glob(pattern))
    if not files:
        raise SystemExit(f"no files match {pattern}: the site's content layout changed, update DOCUMENTS")
    found: dict[str, None] = {}
    for path in files:
        for text in paragraphs(path.read_text("utf-8")):
            if keep(text):
                found.setdefault(text)
    return list(found)


def debate_section_titles() -> list[str]:
    """The debate viewer's section titles ("Craig: opening"), kept in the transcripts' index. They are page text, so they
    are appended as page strings and swapped on screen through ui.json."""
    index = json.loads((SITE / "content/apologetics/transcripts/index.json").read_text("utf-8"))
    return list(dict.fromkeys(section["title"] for record in index.values() for section in record["sections"]))


def append(out: Path, kind: str, texts: list[str], max_strings: int = CHUNK_STRINGS) -> None:
    """Adds the strings of a kind not yet in any chunk as new chunks after the last one, so earlier chunk numbers (and
    their translations) never move. Safe to rerun after the sources change."""
    index = json.loads((out / "chunks.json").read_text("utf-8"))
    known = set()
    for entry in index:
        if entry["kind"] == kind:
            known.update(json.loads((out / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"])
    fresh = {key: text for text in texts if (key := string_id(kind, text)) not in known}
    number = int(index[-1]["chunk"])
    for kind, strings, total in chunks({kind: fresh}, max_strings):
        number += 1
        name = f"{number:04d}"
        body = {"kind": kind, "strings": strings}
        (out / "in" / f"{name}.json").write_text(json.dumps(body, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")
        index.append({"chunk": name, "kind": kind, "strings": len(strings), "words": total})
    (out / "chunks.json").write_text(json.dumps(index, indent=1) + "\n", "utf-8", newline="\n")
    print(f"{len(fresh)} new {kind} strings, {sum(words(t) for t in fresh.values())} words; chunks now end at {index[-1]['chunk']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="the site-translation repository folder")
    parser.add_argument("--pages", action="store_true", help="append the page code's text as new chunks")
    parser.add_argument("--resources", action="store_true", help="append the Resources files' text as new chunks")
    parser.add_argument("--documents", action="store_true",
                        help="append the debate transcripts and study pages as new chunks, at most DOCUMENT_STRINGS each")
    parser.add_argument("--sections", action="store_true", help="append the debate viewer's section titles as page chunks")
    args = parser.parse_args()
    if args.sections:
        append(args.out, PAGE_KIND, debate_section_titles())
    if args.pages:
        append(args.out, PAGE_KIND, page_strings() + resource_page_strings())
    if args.resources:
        append(args.out, RESOURCE_KIND, resource_strings())
    if args.documents:
        for kind, pattern, keep in DOCUMENTS:
            append(args.out, kind, document_strings(pattern, keep), DOCUMENT_STRINGS)
    if args.sections or args.pages or args.resources or args.documents:
        return
    target = args.out / "in"
    if target.exists() and any(target.iterdir()):
        raise SystemExit(f"{target} already holds chunks; translations are keyed to them, so move it aside first")
    target.mkdir(parents=True, exist_ok=True)
    index = []
    for number, (kind, strings, total) in enumerate(chunks(collect()), start=1):
        name = f"{number:04d}"
        body = {"kind": kind, "strings": strings}
        (target / f"{name}.json").write_text(json.dumps(body, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")
        index.append({"chunk": name, "kind": kind, "strings": len(strings), "words": total})
    (args.out / "chunks.json").write_text(json.dumps(index, indent=1) + "\n", "utf-8", newline="\n")
    print(len(index), "chunks,", sum(c["words"] for c in index), "English words")
    for kind in dict.fromkeys(c["kind"] for c in index):
        mine = [c for c in index if c["kind"] == kind]
        print(f"  {kind:<12}{len(mine):>5} chunks {sum(c['strings'] for c in mine):>8} strings {sum(c['words'] for c in mine):>9} words")


if __name__ == "__main__":
    main()
