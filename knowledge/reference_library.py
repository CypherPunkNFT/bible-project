"""Local reference acquisitions: explicit adapters, source locators and checked coverage.

These are attributed source claims, not reviewed theological assertions. Original
files stay untouched. XML is parsed without network access or external entities.
"""
import csv
import hashlib
import json
import struct
import zlib
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

from lxml import etree

from .documents import TextContext, record, source_text
from .store import digest


def checksum(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def xml_root(path):
    return etree.parse(str(path), etree.XMLParser(resolve_entities=False, no_network=True))


def local_name(value):
    return value.rsplit("}", 1)[-1]


def xml_prose(node):
    """Keep inline prose intact, separating actual paragraphs, not every inline tag."""
    out = []
    def walk(el):
        if not isinstance(el.tag, str):
            return
        if local_name(el.tag) in ("p", "div", "item", "list", "sense", "lb"):
            out.append("\n")
        if el.text:
            out.append(el.text)
        for child in el:
            walk(child)
            if child.tail:
                out.append(child.tail)
    walk(node)
    return "".join(out).strip()


def lexical_text(node):
    prose = xml_prose(node)
    # Greek words, pronunciation and Strong/BDB crosswalks often live ONLY in attributes.
    attributes = []
    for el in node.iter():
        if isinstance(el.tag, str) and el.attrib:
            attributes.append(local_name(el.tag) + ": " + "; ".join(
                f"{local_name(k)}={v}" for k, v in el.attrib.items()))
    return prose + "\nLexical attributes:\n" + "\n".join(attributes)


def sword_entries(base):
    """Read a ZIP-compressed SWORD zLD dictionary, checking every binary boundary."""
    files = {ext: Path(str(base) + ext).read_bytes() for ext in (".idx", ".dat", ".zdx", ".zdt")}
    idx, dat, zdx, zdt = (files[x] for x in (".idx", ".dat", ".zdx", ".zdt"))
    if len(idx) % 8 or len(zdx) % 8:
        raise ValueError("Truncated SWORD index")

    def bounded(data, offset, size):
        if offset < 0 or size < 0 or offset + size > len(data):
            raise ValueError("SWORD record outside source bounds")
        return data[offset:offset + size]

    @lru_cache(maxsize=8)
    def block(number):
        offset, size = struct.unpack("<II", bounded(zdx, number * 8, 8))
        raw = zlib.decompress(bounded(zdt, offset, size))
        count, = struct.unpack("<I", bounded(raw, 0, 4))
        bounded(raw, 4, count * 8)
        return raw, count

    for number in range(len(idx) // 8):
        offset, size = struct.unpack_from("<II", idx, number * 8)
        value = bounded(dat, offset, size)
        key, separator, pointer = value.partition(b"\r\n")
        if not separator or len(pointer) != 8:
            raise ValueError(f"Unsupported SWORD pointer at entry {number}")
        block_number, entry_number = struct.unpack("<II", pointer)
        raw, count = block(block_number)
        if entry_number >= count:
            raise ValueError("SWORD entry outside block index")
        start, length = struct.unpack_from("<II", raw, 4 + entry_number * 8)
        if start < 4 + count * 8:
            raise ValueError("SWORD entry overlaps block index")
        yield number, key.decode("utf-8"), bounded(raw, start, length).rstrip(b"\x00").decode("utf-8")


class Intake:
    def __init__(self, writer):
        self.writer = writer
        self.files = []
        self.counts = {}

    def source(self, path):
        path = Path(path)
        self.files.append((path, checksum(path)))
        self.writer.file(path)
        return path

    def add(self, path, key, title, body, licence, metadata=None, kind="reference"):
        if not body.strip():
            raise ValueError(f"Empty source record: {path} / {key}")
        relative = path.relative_to(self.writer.config["sources_dir"]).as_posix()
        identity = f"reference-library:{relative}:{key}"
        self.writer.document(identity, title, kind, path, licence, metadata=metadata)
        self.writer.chunk(identity, title, body, kind, locator=str(key))
        self.counts[relative] = self.counts.get(relative, 0) + 1
        return identity

    def finish(self):
        for path, before in self.files:
            if checksum(path) != before:
                raise RuntimeError(f"Source changed during import: {path}; rebuild required")
        return {"records_by_file": self.counts, "input_files": len(self.files),
                "records": sum(self.counts.values()), "errors": []}


def import_topics(writer, catalog):
    """Follow the current index, never stale per-topic files from older releases."""
    folder = writer.config["site_dir"] / "data/topics"
    index_file = folder / "index.json"
    before = checksum(index_file)
    index = json.loads(index_file.read_text(encoding="utf-8-sig"))
    context = TextContext(catalog)
    writer.file(index_file)
    bundles = {}
    hashes = {}
    for key, summary in index["topics"].items():
        path = folder / "t" / f"{summary['f']}.json"
        if path not in bundles:
            hashes[path] = checksum(path)
            bundles[path] = json.loads(path.read_text(encoding="utf-8-sig"))
            writer.file(path)
        value = bundles[path][key]
        if value["id"] != key:
            raise ValueError(f"Topic identity mismatch: {key}")
        record(writer, context, f"topic:{key}", value["title"], value, "study", path,
               index["source"] + "; individual article attributions retained", f"/topics/{key}")
    record(writer, context, "topics:directory", "Topics: categories, groups and aliases",
           {k: v for k, v in index.items() if k != "topics"}, "study", index_file, index["source"], "/topics")
    for path, expected in {index_file: before, **hashes}.items():
        if checksum(path) != expected:
            raise RuntimeError(f"Topics changed during import: {path}")
    return {"topics": len(index["topics"]), "categories": len(index["categories"]), "bundles": len(bundles)}


def import_reference_library(writer):
    intake = Intake(writer)
    sources = writer.config["sources_dir"]
    pd = "Public-domain underlying work; acquired edition and attribution in SOURCES.md"
    for name, title in (("hitchcock-bible-names.xml", "Hitchcock's Bible Names Dictionary"),
                        ("smith-bibledict.xml", "Smith's Bible Dictionary")):
        path = intake.source(sources / "ccel" / name)
        root = xml_root(path)
        terms = root.xpath('//*[local-name()="term"]')
        definitions = root.xpath('//*[local-name()="def"]')
        used = set()
        for i, term in enumerate(terms):
            definition = term.getnext()
            if definition is None or local_name(definition.tag) != "def":
                raise ValueError(f"Unpaired dictionary term: {path} / {i}")
            used.add(definition)
            label = xml_prose(term)
            intake.add(path, term.get("id", str(i)), f"{title}: {label}",
                       label + "\n" + xml_prose(definition), pd)
        if len(used) != len(definitions):
            raise ValueError(f"Unaccounted dictionary definitions: {path}")

    for name, title, quality in (
        ("gutenberg/josephus-antiquities-2848.txt", "Josephus: Antiquities of the Jews", "Transcribed text"),
        ("gutenberg/josephus-apion-2849.txt", "Josephus: Against Apion", "Transcribed text"),
        ("gutenberg/josephus-life-2846.txt", "Josephus: The Life", "Transcribed text"),
        ("gutenberg/josephus-wars-2850.txt", "Josephus: The Wars of the Jews", "Transcribed text"),
        ("archive-org/fausset-bible-encyclopedia-1900.txt", "Fausset's Bible Encyclopaedia", "Existing unreviewed OCR; recognition errors retained"),
        ("archive-org/thayer-lexicon-1889.txt", "Thayer's Greek Lexicon", "Existing unreviewed OCR; recognition errors retained"),
    ):
        path = intake.source(sources / name)
        intake.add(path, "full-text", title, source_text(path), pd, {"text_quality": quality})

    base = sources / "crosswire/ISBE/modules/lexdict/zld/isbe/isbe"
    for suffix in (".idx", ".dat", ".zdx", ".zdt"):
        intake.source(Path(str(base) + suffix))
    path = Path(str(base) + ".zdt")
    parser = etree.XMLParser(resolve_entities=False, no_network=True)
    for number, key, value in sword_entries(base):
        node = etree.fromstring(value.encode("utf-8"), parser)
        body = xml_prose(node)
        intake.add(path, f"entry-{number}", f"ISBE: {key}", body or
                   f"{key}: this downloaded ISBE entry has no article text.", pd,
                   {"headword": key, "empty_in_source": not bool(body)})

    lex = sources / "openscriptures"
    specs = [
        (lex / "strongs/strongs-master/hebrew/StrongHebrewG.xml", "Strong Hebrew (Open Scriptures)", '//*[local-name()="div" and @type="entry"]', pd),
        (lex / "strongs/strongs-master/greek/StrongsGreekDictionaryXML_1.4/strongsgreek.xml", "Strong Greek", '//*[local-name()="entry"]', pd),
    ]
    for name in ("BrownDriverBriggs", "HebrewStrong", "LexicalIndex", "AugIndex", "BDBPartsOfSpeech", "PartsOfSpeech"):
        tag = "w" if name == "AugIndex" else "POS" if name.endswith("PartsOfSpeech") else "entry"
        specs.append((lex / "HebrewLexicon/HebrewLexicon-master" / (name + ".xml"),
                      name, f'//*[local-name()="{tag}"]', "Open Scriptures Hebrew Lexicon CC BY 4.0; underlying historical works public domain"))
    for path, title, xpath, licence in specs:
        intake.source(path)
        root = xml_root(path)
        for i, node in enumerate(root.xpath(xpath)):
            key = node.get("id", node.get("strongs", node.get("n", node.get("aug", str(i)))))
            intake.add(path, f"{key}:{i}", f"{title}: {key}", lexical_text(node), licence,
                       {"source_entry": key})

    path = intake.source(sources / "openbible-topics/topic-scores.txt")
    topics = defaultdict(list)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        rows = csv.reader(stream, delimiter="\t")
        header = next(rows)
        if header[:2] != ["Topic", "OSIS"]:
            raise ValueError("Unexpected OpenBible Topics header")
        for number, row in enumerate(rows, 2):
            if len(row) != 3 or not row[0] or not row[1]:
                raise ValueError(f"Malformed OpenBible topic at line {number}")
            float(row[2])
            topics[row[0]].append({"osis": row[1], "quality_score": row[2], "line": number})
    for topic, refs in topics.items():
        intake.add(path, digest(topic), f"OpenBible Topics: {topic}",
                   topic + "\nReader-voted reference associations, not exegetical certainty.\n" +
                   "\n".join(f"{r['osis']} (quality score {r['quality_score']})" for r in refs),
                   "OpenBible.info CC BY; references and scores only, no ESV text", {"references": refs})

    import_theographic(intake, sources / "theographic/theographic-bible-metadata-master")
    # Source bibliographies, licence notices and data-field documentation matter
    # for provenance too. Code, alternate exports, and distribution ZIPs stay in
    # the checksum inventory instead of masquerading as additional books.
    for folder in (sources / "theographic", sources / "openscriptures", sources / "crosswire/ISBE"):
        for path in sorted(folder.rglob("*")):
            if path.is_file() and (path.suffix.lower() == ".md" or path.name.lower() in ("license", "readme.txt", "isbe.conf")):
                intake.source(path)
                intake.add(path, "documentation", "Source documentation: " + path.name,
                           source_text(path), "Source documentation; original notices retained",
                           kind="project_document")
    result = intake.finish()
    print(f"Reference library: {result['records']:,} source records from {result['input_files']} inputs", flush=True)
    return result


def import_theographic(intake, root):
    licence = "Robert Rouse / Theographic Bible Metadata, CC BY-SA 4.0"
    collections = {}
    labels = {}
    for path in sorted((root / "json").glob("*.json")):
        intake.source(path)
        values = json.loads(path.read_text(encoding="utf-8-sig"))
        collections[path] = values
        for value in values:
            f = value["fields"]
            label = next((f[k] for k in ("name", "title", "bookName", "osisRef", "termLabel", "chapter", "term") if k in f and isinstance(f[k], str)), value["id"])
            if value["id"] in labels:
                raise ValueError("Duplicate Theographic record identity")
            labels[value["id"]] = label

    def resolved(value):
        if isinstance(value, str):
            return labels.get(value, value)
        if isinstance(value, list):
            return [resolved(v) for v in value]
        if isinstance(value, dict):
            return {k: resolved(v) for k, v in value.items()}
        return value

    note = "Theographic source record. Dates and relationship identifications are the source's proposals, not independent verification.\n"
    for path, values in collections.items():
        for value in values:
            intake.add(path, value["id"], f"Theographic {path.stem}: {labels[value['id']]}",
                       note + json.dumps(resolved(value["fields"]), ensure_ascii=False, indent=2),
                       licence, value)

    # WordIndex has no JSON counterpart. Preserve every original row as metadata,
    # with verse text and the entity/date annotations searchable at verse granularity.
    path = intake.source(root / "CSV/WordIndex.csv")
    verses = defaultdict(list)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        for row in reader:
            if None in row or any(v is None for v in row.values()):
                raise ValueError("Malformed Theographic WordIndex row")
            key = (row["BookID"], row["Chapter"], row["VerseNum"])
            verses[key].append(row)
    for key, rows in verses.items():
        title = f"Theographic word index: book {key[0]}, {key[1]}:{key[2]}"
        text = " ".join(row["Word"] + row["Punc"] for row in rows)
        annotations = [{k: row[k] for k in ("Word", "VersePos", "PersonID", "PlaceID", "YearNum")}
                       for row in rows if row["PersonID"] != "0" or row["PlaceID"] != "0"]
        intake.add(path, ":".join(key), title, note + text + "\nWord annotations: " +
                   json.dumps(annotations, ensure_ascii=False), licence, {"rows": rows})
    geo = intake.source(root / "geo/pauls_journeys_all.geojson")
    value = json.loads(geo.read_text(encoding="utf-8-sig"))
    for i, feature in enumerate(value["features"]):
        intake.add(geo, str(i), f"Theographic: Paul's journeys, feature {i+1}",
                   note + json.dumps(feature["properties"], ensure_ascii=False), licence, feature)
