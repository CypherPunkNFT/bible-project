"""Write a finished Output for every source of every intake: <intake>/output/<source>.csv, one clean table.

The data intake page (scripts/build-data-intake.py) files output/<source>.csv under the source folder of
the same name and shows it as a table. Plain reshaping, no model calls: each table is read from the job's
own prepared data (normalized/, chapter-index.json) where it made some, else from the raw files.
<intake>/output/_status.json records each table's row count and unit, and how it was made.
Bible questions has its own builder (Research/BibleQuizCorpus/tools/build_output.py), run from here too.
Run: py -3.12 scripts/build-intake-outputs.py
"""
from __future__ import annotations

import csv
import html
import json
import re
import subprocess
import sys
from collections.abc import Callable, Iterable, Iterator
from dataclasses import dataclass, field
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
csv.field_size_limit(1 << 30)

PROJECT = Path(__file__).resolve().parents[2]
RESEARCH = PROJECT / "Research"
REFERENCE_LIBRARY = PROJECT / "Data/TheologicalReferenceLibrary"


@dataclass
class Table:
    columns: list[str]
    rows: Iterable[list]
    unit: str
    note: str = ""
    extra: dict = field(default_factory=dict)


def load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def items_of(data: object) -> list[dict]:
    """The record list inside a prepared file, whichever key the job put it under."""
    if isinstance(data, list):
        return data
    return next((v for v in data.values() if isinstance(v, list) and v and isinstance(v[0], dict)), [])


LETTER_OR_SPACE = re.compile(r"[^\W\d_]|\s")


def readable(text: str) -> bool:
    """False for scanning noise: a block where under 60% of the characters are letters or spaces."""
    return bool(text) and len(LETTER_OR_SPACE.findall(text)) >= 0.6 * len(text) and re.search(r"[^\W\d_]{3}", text) is not None


def text_of(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "; ".join(text_of(v) for v in value if text_of(v))
    if isinstance(value, dict):
        return text_of(value.get("display") or value.get("raw") or value.get("name") or value.get("osis") or "")
    return str(value).strip()


def write(intake: Path, source: str, table: Table, status: dict) -> None:
    out = intake / "output"
    out.mkdir(exist_ok=True)
    count = 0
    with (out / f"{source}.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["index", *table.columns])
        for count, row in enumerate(table.rows, 1):
            writer.writerow([count, *row])
    note = table.note
    if table.extra.get("dropped"):
        note += f" {table.extra['dropped'][0]:,} blocks of scanning noise (mostly symbols) were left out."
    status[source] = {"rows": count, "unit": table.unit, "file": f"{source}.csv", **({"note": note.strip()} if note else {})}
    print(f"  {source}: {count:,} {table.unit}")


def run(intake_name: str, tables: dict[str, Callable[[], Table]], intake: Path | None = None) -> None:
    intake = intake or RESEARCH / intake_name
    print(intake_name)
    status: dict[str, dict] = {}
    for source, make in tables.items():
        write(intake, source, make(), status)
    (intake / "output" / "_status.json").write_text(json.dumps(status, indent=1, ensure_ascii=False), encoding="utf-8")


# ── Creeds: one row per article, question or section ──────────────────────────────────────────────

def creeds() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "Creeds"
    by_source: dict[str, list[dict]] = {}
    for path in sorted((folder / "normalized/creeds").glob("*.json")):
        doc = load(path)
        raw = (doc.get("source") or {}).get("raw_file") or ""
        by_source.setdefault(raw.split("/")[1] if raw.startswith("raw/") else "unknown", []).append(doc)

    def rows(docs: list[dict]) -> Iterator[list]:
        for doc in docs:
            for s in doc.get("sections") or []:
                refs = "; ".join(text_of(r) for r in s.get("scripture_references") or [])
                yield [doc.get("title", ""), doc.get("year_label") or doc.get("year") or "", s.get("number") or "",
                       s.get("heading") or "", s.get("question") or "", s.get("text") or "", refs]

    columns = ["document", "year", "number", "heading", "question", "text", "scripture references"]
    return {source: (lambda docs=docs: Table(columns, rows(docs), "sections")) for source, docs in by_source.items()}


# ── Hymns: one row per hymn; Hymnary's verse links; the 1912 Psalter's text blocks ─────────────────

def hymns() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "Hymns"
    by_source: dict[str, list[dict]] = {}
    for path in sorted((folder / "normalized/hymns").glob("*.json")):
        hymn = load(path)
        raw = (hymn.get("source") or {}).get("raw_file") or ""
        by_source.setdefault(raw.split("/")[1] if raw.startswith("raw/") else "unknown", []).append(hymn)
    columns = ["title", "first line", "author", "year", "collection", "number", "text", "scripture references"]

    def hymn_rows(items: list[dict]) -> Iterator[list]:
        for h in items:
            refs = "; ".join(dict.fromkeys(text_of(r.get("raw") if isinstance(r, dict) else r) for r in h.get("scripture_references") or []))
            yield [h.get("title", ""), h.get("first_line", ""), h.get("author", ""), h.get("year", ""), h.get("collection", ""),
                   h.get("number", ""), h.get("text", ""), refs]

    def hymnary() -> Table:
        def rows() -> Iterator[list]:
            for path in sorted((folder / "raw/hymnary").glob("*.json")):
                for first_line, h in load(path).items():
                    yield [path.stem.replace("-", " ").title(), h.get("scripture references", ""), first_line, h.get("title", ""),
                           h.get("author", ""), h.get("meter", ""), h.get("number of hymnals", ""), h.get("text link", "")]
        return Table(["Bible book", "scripture references", "first line", "title", "author", "meter", "hymnals", "link"], rows(),
                     "hymn–verse links", "Hymnary.org's catalogue: which hymns cite which verses. No hymn texts were taken.")

    def psalter() -> Table:
        text = (folder / "raw/archive-org/psalter-1912.txt").read_text(encoding="utf-8", errors="replace")
        blocks = [re.sub(r"\s+", " ", b).strip() for b in re.split(r"\n\s*\n", text)]
        dropped = [sum(1 for b in blocks if len(b) > 1 and not readable(b))]
        return Table(["text"], ([b] for b in blocks if len(b) > 1 and readable(b)), "text blocks",
                     "The scan's own OCR text in blocks, as scanned: page furniture and OCR errors included.", {"dropped": dropped})

    tables: dict[str, Callable[[], Table]] = {s: (lambda items=items: Table(columns, hymn_rows(items), "hymns")) for s, items in by_source.items()}
    tables["hymnary"] = hymnary
    tables["archive-org"] = psalter
    return tables


# ── Artifacts: one row per object ─────────────────────────────────────────────────────────────────

def artifacts() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "Artifacts"
    columns = ["title", "date", "culture", "found at", "material", "museum", "accession number", "description", "licence", "image", "record"]

    def rows(objects: Iterable[dict]) -> Iterator[list]:
        for o in objects:
            image = o.get("image") or {}
            held = image.get("local_path") or ""
            yield [o.get("title", ""), o.get("date_text", ""), o.get("culture", ""), o.get("findspot", ""), o.get("medium", ""),
                   o.get("museum", ""), o.get("accession_number", ""), o.get("description", ""), o.get("licence", ""),
                   held or image.get("url") or image.get("object_page") or "", o.get("record_url", "")]

    def objects(slug: str) -> list[dict]:
        return items_of(load(folder / f"normalized/objects/{slug}.json"))

    notables = items_of(load(folder / "normalized/notables.json"))
    ctij_ids = {p.stem for p in (folder / "raw/oracc-ctij").glob("*.html")}

    def errors() -> Table:
        lines = (folder / "raw/image-downloads/_errors.jsonl").read_text(encoding="utf-8").splitlines()
        records = [json.loads(line) for line in lines if line.strip()]
        return Table(["image address", "what went wrong"], ([r.get("url", ""), r.get("error", "")] for r in records), "failed downloads",
                     "Images the job tried and failed to download; nothing else is in this folder.")

    tables: dict[str, Callable[[], Table]] = {
        slug: (lambda slug=slug: Table(columns, rows(objects(slug)), "objects"))
        for slug in ["art-institute-chicago", "cdli", "cleveland-museum", "europeana", "met-museum", "oracc", "smithsonian"]}
    tables["oracc-ctij"] = lambda: Table(columns, rows(o for o in objects("oracc") if o.get("object_id") in ctij_ids), "objects",
                                         "The CTIJ texts (cuneiform texts mentioning Israelites and Judeans), as recorded in the ORACC objects.")
    tables["wikidata"] = lambda: Table(columns, rows(n for n in notables if n.get("museum_slug") in ("wikidata-notables", "unresolved")), "objects")
    tables["wikidata-notables"] = lambda: Table(columns, rows(n for n in notables if n.get("museum_slug") == "wikidata-notables"), "objects")
    tables["wikimedia-commons"] = lambda: Table(columns, rows(n for n in notables if n.get("museum_slug") == "wikimedia-commons"), "objects")
    tables["image-downloads"] = errors
    return tables


# ── Manuscripts: one row per manuscript ───────────────────────────────────────────────────────────

def manuscripts() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "Manuscripts"
    columns = ["name", "number", "date", "material", "script", "contents", "held at", "shelfmark", "languages", "licence", "record"]
    every: dict[str, dict] = {}

    def rows(records: Iterable[dict]) -> Iterator[list]:
        for m in records:
            siglum = m.get("siglum") or {}
            number = text_of((siglum.get("gregory_aland") or {}).get("display")) or "; ".join(text_of(o.get("value")) for o in siglum.get("other") or [])
            location = m.get("location") or {}
            contents = m.get("contents") or {}
            yield [m.get("name", ""), number, text_of(m.get("date")), m.get("material") or "", m.get("script") or "",
                   contents.get("raw") or "; ".join(contents.get("books") or []), location.get("institution") or location.get("raw") or "",
                   location.get("shelfmark") or "", "; ".join(m.get("languages") or []),
                   "; ".join(text_of(lic.get("name")) for lic in m.get("licences") or []), m.get("record_url", "")]

    tables: dict[str, Callable[[], Table]] = {}
    for slug in ["csntm", "etcbc-dss", "wikidata"]:
        records = items_of(load(folder / f"normalized/manuscripts/{slug}.json"))
        every.update({r.get("identifiers", {}).get("wikidata_qid") or r["record_id"]: r for r in records})
        tables[slug] = lambda records=records: Table(columns, rows(records), "manuscripts")

    def index_rows(name: str, unit: str, note: str) -> Callable[[], Table]:
        def make() -> Table:
            lines = (folder / f"raw/{name}/_index.jsonl").read_text(encoding="utf-8").splitlines()
            records = [json.loads(line) for line in lines if line.strip()]
            return Table(["what was fetched", "address", "saved as", "size", "fetched"],
                         ([r.get("name", ""), r.get("url", ""), r.get("file", ""), r.get("bytes", ""), r.get("retrieved", "")] for r in records),
                         unit, note)
        return make

    tables["wikipedia"] = index_rows("wikipedia", "pages read", "Wikipedia article fetches; what they gave is in the Wikidata manuscripts' fields.")
    tables["commons"] = index_rows("commons", "fetches", "Wikimedia Commons fetches: image details and the images themselves.")

    def images() -> Table:
        def image_rows() -> Iterator[list]:
            for path in sorted((folder / "images").glob("Q*")):
                qid = path.name.split("-", 1)[0]
                m = every.get(qid, {})
                image = m.get("images") or {}
                yield [path.name, m.get("name", ""), qid, image.get("licence") or "", m.get("record_url", "")]
        return Table(["image", "manuscript", "Wikidata id", "licence", "record"], image_rows(), "images")

    def terms() -> Table:
        sources = load(folder / "raw/_terms/recorded-terms.json").get("sources", {})
        return Table(["host", "publisher", "what the terms say"],
                     ([host, t.get("publisher", ""), text_of(t.get("summary") or t.get("verdict") or t.get("quote") or "")] for host, t in sources.items()),
                     "hosts")

    tables["images"] = images
    tables["_terms"] = terms
    return tables


# ── Maps: one row per map ─────────────────────────────────────────────────────────────────────────

def maps() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "HistoricalMaps"
    every = load(folder / "normalized/catalogue.json")["maps"]
    columns = ["title", "map maker", "year", "regions", "biblical subjects", "image", "resolution", "size", "licence", "held by", "record"]

    def rows(source: str) -> Iterator[list]:
        for m in every:
            if m.get("source") == source:
                yield [m.get("title", ""), "; ".join(m.get("cartographer") or []), m.get("year") or "", "; ".join(m.get("region_depicted") or []),
                       "; ".join(m.get("biblical_subjects") or []), m.get("file") or m.get("withheld_reason") or "", m.get("resolution") or "",
                       m.get("bytes") or "", m.get("licence", ""), m.get("holding_institution", ""), m.get("source_url", "")]

    tables = {source: (lambda source=source: Table(columns, rows(source), "maps")) for source in ["wikimedia-commons", "internet-archive", "loc-gm", "nypl"]}

    def terms() -> Table:
        files = sorted(p for p in (folder / "raw/_terms").iterdir() if p.is_file())
        return Table(["file", "size"], ([p.name, p.stat().st_size] for p in files), "files", "The sites' terms pages, saved as read.")

    tables["_terms"] = terms
    return tables


# ── Audio Bible: one row per recording ────────────────────────────────────────────────────────────

def audio() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "Audio"
    index = load(folder / "chapter-index.json")
    columns = ["covers", "file", "minutes", "size", "translation", "reader", "listen"]

    def rows(source: str) -> Iterator[list]:
        for f in sorted((f for f in index["files"].values() if f["source"] == source), key=lambda f: f["section_number"]):
            covers = "; ".join(f"{s['book']} {s['first_chapter']}–{s['last_chapter']}" if s["first_chapter"] != s["last_chapter"]
                               else f"{s['book']} {s['first_chapter']}" for s in f.get("spans") or []) or f.get("section_title", "")
            yield [covers, f["path"], round((f.get("duration_seconds") or 0) / 60, 1), f.get("bytes", ""), f.get("translation_name", ""),
                   f.get("reader", ""), f.get("listen_url", "")]

    tables: dict[str, Callable[[], Table]] = {s: (lambda s=s: Table(columns, rows(s), "recordings")) for s in index["sources"]}

    def catalogue() -> Table:
        def catalogue_rows() -> Iterator[list]:
            for path in sorted((folder / "raw/_catalogue").glob("*.archive-metadata.json")):
                for f in load(path).get("files", []):
                    yield [path.name.split(".")[0], f.get("name", ""), f.get("format", ""), f.get("size", "")]
        return Table(["reading", "file at the Internet Archive", "format", "size"], catalogue_rows(), "files",
                     "Every file each reading has at the Internet Archive, as listed there; only the MP3s were downloaded.")

    tables["_catalogue"] = catalogue
    return tables


# ── Open Bible data: MACULA word by word; Matthew Henry chapter by chapter ────────────────────────

def open_bible_data() -> dict[str, Callable[[], Table]]:
    folder = RESEARCH / "OpenBibleData/raw"

    def macula(path: Path, keep: list[tuple[str, str]], note: str) -> Callable[[], Table]:
        def make() -> Table:
            def rows() -> Iterator[list]:
                with path.open(encoding="utf-8", newline="") as handle:
                    for r in csv.DictReader(handle, delimiter="\t"):
                        yield [(r.get(k) or "").split("!")[0] if k == "ref" else r.get(k) or "" for k, _ in keep]
            return Table([label for _, label in keep], rows(), "words", note)
        return make

    hebrew = next((folder / "macula-hebrew/tree").glob("*/WLC/tsv/macula-hebrew.tsv"))
    greek = next((folder / "macula-greek/tree").glob("*/Nestle1904/tsv/macula-greek-Nestle1904.tsv"))
    keep_h = [("ref", "verse"), ("text", "Hebrew"), ("transliteration", "transliteration"), ("lemma", "root word"),
              ("gloss", "gloss"), ("english", "English"), ("strongnumberx", "Strong's"), ("pos", "part of speech"), ("morph", "grammar")]
    keep_g = [("ref", "verse"), ("text", "Greek"), ("lemma", "root word"), ("gloss", "gloss"), ("english", "English"),
              ("strong", "Strong's"), ("class", "part of speech"), ("morph", "grammar")]

    def henry() -> Table:
        def rows() -> Iterator[list]:
            for path in sorted((folder / "ccel-matthew-henry-commentary").glob("mhc*.xml")):
                text = path.read_text(encoding="utf-8", errors="replace")
                for book_title, book in re.findall(r'<div1[^>]*title="([^"]+)"[^>]*>(.*?)</div1>', text, re.S):
                    for chapter_title, body in re.findall(r'<div2[^>]*title="([^"]+)"[^>]*>(.*?)</div2>', book, re.S):
                        plain = html.unescape(re.sub(r"<[^>]+>", " ", body))
                        yield [path.stem.replace("mhc", "Volume "), book_title, chapter_title, re.sub(r"\s+", " ", plain).strip()]
        return Table(["volume", "book", "chapter", "commentary"], rows(), "chapters", "The commentary's words only; CCEL's own markup is left behind.")

    return {"macula-hebrew": macula(hebrew, keep_h, "One row per Hebrew word of the Old Testament (Westminster Leningrad Codex)."),
            "macula-greek": macula(greek, keep_g, "One row per Greek word of the New Testament (Nestle 1904)."),
            "ccel-matthew-henry-commentary": henry}


# ── Reference books: encyclopedias in passages; the lists as names ──────────────────────────────

PASSAGE = 4000  # characters; the scans' text has no page breaks, so passages are cut at paragraph ends


def pieces(text: str) -> Iterator[tuple[str, str]]:
    """(piece, what joins it to the one before): paragraphs; a paragraph longer than a passage (some scans
    have no blank lines at all) is cut at line ends, then at sentence ends, then hard, and rejoined with a space."""
    for paragraph in re.split(r"\n\s*\n", text):
        if len(paragraph) <= PASSAGE:
            yield paragraph, "\n\n"
            continue
        joiner = "\n\n"
        for line in paragraph.splitlines() if "\n" in paragraph else re.split(r"(?<=[.!?])\s+", paragraph):
            for start in range(0, len(line), PASSAGE):
                yield line[start:start + PASSAGE], joiner
                joiner = " "


def passages(text: str) -> Iterator[str]:
    chunk = ""
    for paragraph, joiner in pieces(text):
        paragraph = re.sub(r"[ \t]+", " ", paragraph).strip()
        if not paragraph:
            continue
        if chunk and len(chunk) + len(paragraph) > PASSAGE:
            yield chunk
            chunk = ""
        chunk = f"{chunk}{joiner}{paragraph}" if chunk else paragraph
    if chunk:
        yield chunk


def reference_library() -> dict[str, Callable[[], Table]]:
    folder = REFERENCE_LIBRARY

    def encyclopedia(name: str) -> Callable[[], Table]:
        def make() -> Table:
            dropped = [0]

            def rows() -> Iterator[list]:
                for path in sorted((folder / "Encyclopedias" / name).glob("*.txt")):
                    volume = path.stem.split("-cyclop")[0].split("-catholic")[0].replace("-", " ").capitalize()
                    for number, passage in enumerate(passages(path.read_text(encoding="utf-8", errors="replace")), 1):
                        if not readable(passage):
                            dropped[0] += 1
                            continue
                        yield [volume, number, " ".join(passage.split()[:8]), passage]
            return Table(["volume", "passage", "opens with", "text"], rows(), "passages",
                         "The scanned text cut into passages of about 4,000 characters at paragraph ends; it has no page or "
                         "article breaks to cut at, and keeps the scan's OCR errors.", {"dropped": dropped})
        return make

    names = load(folder / "Derived/Author-Review/short-lists-by-era.json")
    list_files = {"16a7cd27db8eb06b": "the-great-theologians", "ecbd833abfa5bb0f": "fifty-key-christian-thinkers",
                  "8d18912271b5ca34": "carolina-100-philosophers-and-theologians", "501c6f893bea00e6": "brad-east-153-theologians"}

    def name_list(source_id: str) -> Callable[[], Table]:
        def make() -> Table:
            def rows() -> Iterator[list]:
                for row in names["rows"]:
                    for o in row.get("occurrences") or []:
                        if o.get("sourceId") == source_id:
                            yield [o.get("name", ""), o.get("dates", ""), row.get("eraId", ""), o.get("locator", "")]
            return Table(["name", "dates as listed", "era", "where in the list"], rows(), "names")
        return make

    def lines_of(path: Path) -> Callable[[], Table]:
        def make() -> Table:
            lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
            return Table(["line"], ([line] for line in lines), "lines", "The job's notes on this page; its names were not extracted.")
        return make

    tables: dict[str, Callable[[], Table]] = {name: encyclopedia(name) for name in
                                               ["Catholic-Encyclopedia", "Christian-Biography", "McClintock-Strong", "Schaff-Herzog"]}
    tables.update({stem: name_list(source_id) for source_id, stem in list_files.items()})
    tables["131-christians-everyone-should-know"] = lines_of(folder / "Derived/Publisher-References/131-christians-everyone-should-know.txt")
    return tables


def main() -> None:
    run("Creeds", creeds())
    run("Hymns", hymns())
    run("Artifacts", artifacts())
    run("Manuscripts", manuscripts())
    run("HistoricalMaps", maps())
    run("Audio", audio())
    run("OpenBibleData", open_bible_data())
    run("Reference books", reference_library(), REFERENCE_LIBRARY)
    quiz = RESEARCH / "BibleQuizCorpus/tools/build_output.py"
    print("BibleQuizCorpus")
    subprocess.run([sys.executable, str(quiz)], check=True)


if __name__ == "__main__":
    main()
