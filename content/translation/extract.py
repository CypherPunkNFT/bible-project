"""Pulls every reader-facing English string out of the site's content files and writes them, in chunks, into the
site-translation repository (../../../SiteTranslation) for the cloud translation sessions.

Which fields are translated is decided by SOURCES below, one entry per kind of content file. Scripture quotations are
left out on purpose (each language's own Bible fills them by reference), and so are book titles, authors, licences
and catalogue metadata. Text written into the page code is not here yet: it needs the page code moved into string
files first.

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


def walk(value, path: str, spec: tuple, found: list, depth: int = 0) -> None:
    _, _, record_map, wild_parents, plain, stanzas, mixed = spec
    if isinstance(value, dict):
        parent = path.rsplit(".", 1)[-1]
        for key, child in value.items():
            wild = key.isdigit() or (record_map and depth == 0) or parent in wild_parents
            walk(child, f"{path}.{'*' if wild else key}", spec, found, depth + 1)
    elif isinstance(value, list):
        item_path = path + "[]"
        for item in value:
            if item_path in stanzas and isinstance(item, list) and all(isinstance(line, str) for line in item):
                text = "\n".join(item)
                if translatable(text):
                    found.append(text)
            elif item_path in mixed and isinstance(item, list):
                text = mixed_text(item)
                if text:
                    found.append(text)
            else:
                walk(item, item_path, spec, found, depth + 1)
    elif isinstance(value, str) and path in plain and translatable(value):
        found.append(value)


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
            found: list[str] = []
            walk(json.loads(path.read_text("utf-8")), "", spec, found)
            for text in found:
                strings.setdefault(string_id(kind, text), text)
    kind, pattern = MARKDOWN
    for path in sorted(SITE.glob(pattern)):
        for text in markdown_paragraphs(path.read_text("utf-8")):
            by_kind[kind].setdefault(string_id(kind, text), text)
    return by_kind


def words(text: str) -> int:
    return len(WORD.findall(text))


def chunks(by_kind: dict[str, dict[str, str]]):
    for kind, strings in by_kind.items():
        current, total = {}, 0
        for key, text in strings.items():
            if current and (total + words(text) > CHUNK_WORDS or len(current) >= CHUNK_STRINGS):
                yield kind, current, total
                current, total = {}, 0
            current[key] = text
            total += words(text)
        if current:
            yield kind, current, total


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="the site-translation repository folder")
    args = parser.parse_args()
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
