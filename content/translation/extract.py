"""Pulls every reader-facing English string out of the site's content files and writes them, in chunks, into the
site-translation repository (../../../SiteTranslation) for the cloud translation sessions.

Which fields are translated is decided by SOURCES below, one entry per kind of content file. Scripture quotations are
left out on purpose (each language's own Bible fills them by reference), and so are book titles, authors, licences
and catalogue metadata. The page code's own text (--pages; what counts as page text is page_rules.py's) and the
Resources files bundled with the code (--resources) are added later as new chunks after the last one. Those modes and
--documents first carry the translation of English edited since the last collection over to the new English, flagged
for a re-check (retarget_collect.py); --dry-run prints what they would do and writes nothing.

Each unique English string of a kind gets one id, sha1(kind + text)[:12], so a repeated label is translated once and
the later import can match translations back by walking the same SOURCES. Usage: python extract.py [--out DIR]
"""
import argparse
import contextlib
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from page_rules import (CODE_LIKE, EDGE_CODE, JSX_EDGE, JSX_TEXT, PAGE_ATTRIBUTE, PAGE_LITERAL,  # noqa: E402,F401
                        PAGE_LITERAL_LENGTH, PAGE_PROPERTY, TEMPLATE, TEMPLATE_VALUE, WORD, balanced, class_like,
                        jsx_prose, strings_in, template_text, translatable, without_comments)

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parents[2]
DEFAULT_OUT = SITE.parents[0] / "SiteTranslation"
CHUNK_WORDS = 4000
CHUNK_STRINGS = 400

# kind, file glob, record-map file (its top-level keys are ids), parents whose child keys are ids,
# paths of plain strings, paths of stanzas (list of lines, joined by "\n"),
# paths of mixed paragraphs (text with Bible references in between, written as {{1}}, {{2}}).
SOURCES = [
    ("person", "data/study/people/*.json", False, (), {
        ".d", ".e", ".t", ".b", ".short", ".article", ".note", ".story.short", ".story.paragraphs[].text"}, set(), set()),
    # The people timeline's one line each is a person's brief or description, so its translations are already there.
    ("person", "data/study/people.json", False, (), {"[].b"}, set(), set()),
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
        ".records[].reading.startingPoint", ".documents[].content.summary", ".documents[].content.description",
        ".documents[].content.setting", ".documents[].content.hinge", ".documents[].content.claim.text",
        ".documents[].content.transcriptCoverage", ".documents[].content.copy.debateIndexNote",
        ".documents[].content.copy.footerText", ".documents[].content.copy.footerTitle", ".documents[].content.lens",
        ".documents[].content.recording.label"}, set(), set()),
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

# Text written into the page code; what counts as on-screen text is page_rules.py's.
PAGE_KIND = "page"
IMPORT = re.compile(r"""\bfrom\s+["'](@/|\.{1,2}/)([^"']+)["']""")


def imported_file(source: Path, prefix: str, name: str) -> Path | None:
    base = SITE / "src" / name if prefix == "@/" else source.parent / (prefix + name)
    for candidate in (Path(f"{base}.tsx"), Path(f"{base}.ts"), base / "index.tsx", base / "index.ts", base):
        if candidate.suffix in {".ts", ".tsx"} and candidate.is_file():
            return candidate.resolve()
    return None


PAGE_SUFFIXES = (".ts", ".tsx", ".js", ".mjs", ".jsx")
GENERATED = "src/generated/"  # written from content/ by the content build (npm run content:build), and not in git
# Files under src/ that are data, not page code, each with why. Their text is a data question (stage 5, job 12).
NOT_PAGE_CODE = {
    "src/pages/places/old-maps-collection/data.js": "generated by build-data.py from Research/HistoricalMaps: the "
    "catalogue of 2,317 old maps (titles as published, many French or Latin, makers, holding libraries), which stays as "
    "published like all catalogue metadata; its few screen labels are data fields",
}


def page_file_skipped(relative: str) -> bool:
    """A path under the site (posix, from SITE) that is not page code: tests, development tools, data files."""
    parts = set(relative.split("/"))
    return (relative.startswith(("src/test/", "src/dev/")) or ".test." in relative.rsplit("/", 1)[-1]
            or "__tests__" in parts or relative in NOT_PAGE_CODE)


def page_files(include_generated: bool = True) -> list[Path]:
    """The page code: every .ts, .tsx, .js, .mjs and .jsx file under src/ outside mock-ups, tests, development tools and
    NOT_PAGE_CODE, with the code the content build writes into src/generated/ (left out by the build check: it is not in
    git), and the mock-up files a real page imports (the homepage's opening lives in pages/mockup/home-openings/)."""
    def skipped(path: Path) -> bool:
        relative = path.relative_to(SITE).as_posix()
        return page_file_skipped(relative) or (not include_generated and relative.startswith(GENERATED))

    files = [p.resolve() for p in sorted((SITE / "src").rglob("*")) if p.suffix in PAGE_SUFFIXES and p.is_file()
             and not skipped(p) and "mockup" not in p.parts]
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


def page_strings(files: list[Path] | None = None) -> list[str]:
    """The page code's on-screen text (page_rules.strings_in), each once: of page_files(), or of the files given."""
    found: dict[str, None] = {}
    for path in page_files() if files is None else files:
        found.update(dict.fromkeys(strings_in(without_comments(path.read_text("utf-8")), path.suffix)))
    return list(found)


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


# Long-form text added after the first extraction as new chunks (--documents), like the Resources above: the debate
# transcripts' spoken paragraphs. Each chunk holds at most DOCUMENT_STRINGS strings and CHUNK_WORDS words, so one
# translation call can carry it. The study drafts (content/studies/*/*/content.md, kind "study") are no longer
# collected (stage 5, job 11): only the draft mock-ups read them, which open on the local preview alone
# (src/pages/mockup/mockup-routes.tsx, MOCKUPS_ENABLED); their 39 translated chunks stay as they are.
DOCUMENTS = [
    ("transcript", "content/apologetics/transcripts/*.txt", lambda text: True),
]
DOCUMENT_STRINGS = 100
LONG_PARAGRAPH_WORDS = 300
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


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


def held_texts(out: Path, kind: str) -> set[str]:
    """The English of every string of a kind already in a chunk."""
    found = set()
    for entry in json.loads((out / "chunks.json").read_text("utf-8")):
        if entry["kind"] == kind:
            found.update(json.loads((out / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"].values())
    return found


def ruled_not_text() -> set[str]:
    """Texts ruled not to be screen text (unregistered-reviewed.json, check "code"): --pages leaves them out."""
    from english_baseline import rulings
    return rulings(Path(__file__).with_name("unregistered-reviewed.json"), SITE)[0]


def append(out: Path, kind: str, texts: list[str], max_strings: int = CHUNK_STRINGS, retarget: bool = False,
           dry_run: bool = False, skip: frozenset[str] = frozenset()) -> list[str]:
    """Adds the strings of a kind not yet in any chunk as new chunks after the last one, so earlier chunk numbers (and
    their translations) never move. Safe to rerun after the sources change. With retarget (extract.py's own modes),
    English edited since the last collection first keeps its translation, flagged for a re-check (retarget_collect.py),
    and the texts collected are recorded for next time. Texts in skip are never appended. With dry_run nothing is
    written. Returns the texts appended (or that would be)."""
    carried = []
    if retarget:
        import retarget_collect
        carried = retarget_collect.carry(out, kind, texts, set(skip), string_id, words, dry_run)
    index = json.loads((out / "chunks.json").read_text("utf-8"))
    known = set()
    for entry in index:
        if entry["kind"] == kind:
            known.update(json.loads((out / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"])
    known.update(pair.new_id for pair in carried)
    fresh = {key: text for text in texts if text not in skip and (key := string_id(kind, text)) not in known}
    total_words = sum(words(t) for t in fresh.values())
    if dry_run:
        print(f"would carry {len(carried)} edited and append {len(fresh)} new {kind} strings, {total_words} words")
        return list(fresh.values())
    number = int(index[-1]["chunk"])
    for kind, strings, total in chunks({kind: fresh}, max_strings):
        number += 1
        name = f"{number:04d}"
        body = {"kind": kind, "strings": strings}
        (out / "in" / f"{name}.json").write_text(json.dumps(body, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")
        index.append({"chunk": name, "kind": kind, "strings": len(strings), "words": total})
    (out / "chunks.json").write_text(json.dumps(index, indent=1) + "\n", "utf-8", newline="\n")
    if retarget:
        retarget_collect.write_snapshot(out, kind, texts, string_id)
    print(f"{len(fresh)} new {kind} strings, {total_words} words; chunks now end at {index[-1]['chunk']}")
    return list(fresh.values())


def shared_lock(out: Path, why: str):
    """The site-translation folder's shared lock (studies/tools/shared_lock.py), so no other chat writes chunks.json
    and in/ meanwhile; no lock where the folder has none (a test's folder)."""
    tool = out / "studies" / "tools" / "shared_lock.py"
    if not tool.exists():
        return contextlib.nullcontext()
    spec = importlib.util.spec_from_file_location("shared_lock", tool)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.held(why)


def collect_more(args) -> None:
    """--pages, --resources, --documents, --sections: each appends with retarget on. The page kind is always collected
    whole (page code, the help lines, the debate section titles), so a text one flag leaves out is never taken as gone."""
    if args.sections or args.pages:
        texts = page_strings() + resource_page_strings() + debate_section_titles() if args.pages else debate_section_titles()
        skip = frozenset(held_texts(args.out, "apologetics") | ruled_not_text()) if args.pages else frozenset()
        append(args.out, PAGE_KIND, list(dict.fromkeys(texts)), retarget=args.pages, dry_run=args.dry_run, skip=skip)
    if args.resources:
        append(args.out, RESOURCE_KIND, resource_strings(), retarget=True, dry_run=args.dry_run)
    if args.documents:
        for kind, pattern, keep in DOCUMENTS:
            append(args.out, kind, document_strings(pattern, keep), DOCUMENT_STRINGS, retarget=True, dry_run=args.dry_run)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="the site-translation repository folder")
    parser.add_argument("--pages", action="store_true", help="append the page code's text as new chunks")
    parser.add_argument("--resources", action="store_true", help="append the Resources files' text as new chunks")
    parser.add_argument("--documents", action="store_true",
                        help="append the debate transcripts as new chunks, at most DOCUMENT_STRINGS each")
    parser.add_argument("--sections", action="store_true", help="append the debate viewer's section titles as page chunks")
    parser.add_argument("--dry-run", action="store_true",
                        help="with --pages, --resources, --documents or --sections: print what would be carried and "
                             "appended, write nothing")
    args = parser.parse_args()
    more = args.sections or args.pages or args.resources or args.documents
    if args.dry_run and not more:
        parser.error("--dry-run needs --pages, --resources, --documents or --sections")
    if args.dry_run:
        collect_more(args)
        return
    if more:
        with shared_lock(args.out, "extract.py appending chunks"):
            collect_more(args)
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
