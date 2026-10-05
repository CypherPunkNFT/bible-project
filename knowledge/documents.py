"""Adapters for study records, reference works, authored content and project documents."""
import json
import re
import subprocess
from pathlib import Path
from .bibles import read_json
from .references import parse_reference


def source_text(file):
    raw = file.read_bytes()
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        # CCEL's historic plain-text downloads contain ISO-8859-1, including §.
        return raw.decode("latin-1")


class TextContext:
    def __init__(self, catalog):
        self.catalog = catalog
        self.books = {book["num"]: book for book in catalog["books"]}

    def ref(self, number):
        book = self.books.get(number // 1000000)
        return f"{book['name']} {number // 1000 % 1000}:{number % 1000}" if book else str(number)

    def text(self, value, key=""):
        if isinstance(value, str):
            return value
        if isinstance(value, list):
            if key in ("v", "verses", "refs", "r") and all(isinstance(x, int) for x in value):
                return "; ".join(self.ref(x) for x in value)
            if len(value) == 2 and all(isinstance(x, int) and x >= 1001001 for x in value):
                return self.ref(value[0]) + " – " + self.ref(value[1])
            return "\n".join(self.text(item, "span" if isinstance(item, list) else key) for item in value)
        if isinstance(value, dict):
            return "\n".join(f"{k}: {self.text(v, k)}" for k, v in value.items() if v is not None)
        if isinstance(value, int) and value >= 1001001 and key in ("start", "end", "first", "f", "verses", "refs", "v"):
            return self.ref(value)
        return str(value) if value is not None else ""

    def refs(self, value, key=""):
        if isinstance(value, str) and key == "reference":
            parsed = parse_reference(value, self.catalog)
            if parsed:
                book, chapter, first, last_chapter, last = parsed
                yield book["num"]*1000000 + chapter*1000 + first, book["num"]*1000000 + last_chapter*1000 + last
        elif isinstance(value, dict):
            if "start" in value and "end" in value and isinstance(value["start"], int):
                yield value["start"], value["end"]
            for k, item in value.items():
                yield from self.refs(item, k)
        elif isinstance(value, list):
            if key in ("v", "verses", "refs", "r") and all(isinstance(x, int) for x in value):
                yield from ((x, x) for x in value if x >= 1001001)
            elif len(value) == 2 and all(isinstance(x, int) and x >= 1001001 for x in value):
                yield value[0], value[1]
            else:
                for item in value:
                    yield from self.refs(item, "span" if isinstance(item, list) else key)


def record(writer, context, id, title, value, kind, path, licence, link=""):
    writer.document(id, title, kind, path, licence, metadata=value if isinstance(value, dict) else {"data": value})
    writer.chunk(id, title, context.text(value), kind, link=link, locator=id)
    for start, end in set(context.refs(value)):
        writer.reference(id, start, end, source=path)


def import_study(writer, catalog):
    context = TextContext(catalog)
    data = writer.config["site_dir"] / "data"
    study = data / "study"
    people = read_json(study / "people.json")
    writer.file(study / "people.json")
    for person in people:
        file = study / "people" / f"{person['id']}.json"
        detail = read_json(file)
        writer.file(file)
        id = f"person:{person['id']}"
        record(writer, context, id, person["n"], {**person, **detail}, "person", file,
               "STEP Bible CC BY 4.0; Bible Project authored descriptions", f"/study/people/{person['id']}")
        for key, relation in (("pa", "parent"), ("si", "sibling"), ("sp", "spouse"), ("ch", "child")):
            for related in detail.get(key, []):
                writer.edge(id, relation, f"person:{related}", file)
    for place in read_json(data / "places.json"):
        record(writer, context, f"place:{place['id']}", place["name"], place, "place", data / "places.json",
               "OpenBible.info CC BY 4.0; coordinates are estimates", f"/study/places?place={place['id']}")
    writer.file(data / "places.json")
    for file in sorted(study.glob("*.json")):
        if file.name == "people.json":
            continue
        writer.file(file)
        value = read_json(file)
        records = []
        if file.stem == "harmony":
            for part in value["parts"]:
                records.extend((f"harmony:{row['n']}", row["title"], {"part": part["title"], **row}, f"/study/gospels#event-{row['n']}") for row in part["sections"])
        elif file.stem == "names":
            records = [(f"name:{group['key']}:{item['id']}", item["name"], {"group": group["label"], **item}, "/study/names") for group in value["groups"] for item in group["names"]]
        elif isinstance(value, list):
            records = [(f"{file.stem}:{item.get('id',item.get('code',i))}", item.get("name", item.get("title", item.get("code", file.stem))), item, f"/study/{file.stem}") for i, item in enumerate(value)]
        else:
            records = [(f"study:{file.stem}:{key}", f"{file.stem.title()} · {key}", item, f"/study/{file.stem}") for key, item in value.items()]
        licence = "Bible Project study data; Robertson public domain / Torrey public domain / STEP Bible CC BY 4.0 / BSB public domain as recorded in SOURCES.md"
        for id, title, item, link in records:
            if file.stem in ("home", "index"):
                link = "/study"
            record(writer, context, id, title, item, "study", file, licence, link)
    print(f"Study: {len(people):,} people, places, harmony, names, letters, miracles and prophets", flush=True)


def import_authored(writer, catalog):
    context = TextContext(catalog)
    site = writer.config["site_dir"]
    process = subprocess.run(["node", str(Path(__file__).with_name("export-content.mjs"))],
                             cwd=site, capture_output=True, text=True, encoding="utf-8", check=True)
    exported = json.loads(process.stdout)
    for file in sorted((site / "src/data").glob("*.ts")):
        if file.stem.startswith("apologetics"):
            writer.file(file)
    for module, exports in exported.items():
        file = site / "src" / "data" / f"{module}.ts"
        writer.file(file)
        for name, values in exports.items():
            if not isinstance(values, (list, dict)) or name == "FOUNDATIONS":
                continue
            entries = list(enumerate(values)) if isinstance(values, list) else list(values.items())
            for key, item in entries:
                if not isinstance(item, dict):
                    continue
                id = f"authored:{module}:{name}:{item.get('id',item.get('event',key))}"
                title = item.get("title", item.get("label", item.get("question", name)))
                if not isinstance(title, str):
                    title = name
                link = "/apologetics" if module.startswith("apologetics") else "/study/gospels" if module in ("gospel-portraits", "chart-insights") else "/study"
                if name == "STUDIES":
                    link = f"/apologetics/study/{item['id']}"
                record(writer, context, id, title, item, "guide", file, "Bible Project authored content; citations and source roles retained", link)
    # The editorial authoring collection can grow independently of published TypeScript exports.
    content = site / "content"
    if content.exists():
        for file in sorted(content.rglob("*.json")):
            if file.is_relative_to(content / "library/catalog") or file.is_relative_to(content / "library/reports"):
                continue  # The library adapter retains these ledgers and indexes actual works.
            value = read_json(file)
            writer.file(file)
            body = value.get("content", {}) if isinstance(value, dict) else {}
            title = body.get("title", file.stem) if isinstance(body, dict) else file.stem
            record(writer, context, f"content:{file.relative_to(content).as_posix()}", title, value, "authored_document", file,
                   "Bible Project authored document; publication/review status retained")


def import_reference_books(writer):
    from bs4 import BeautifulSoup
    sources = writer.config["sources_dir"]
    books = [(sources / "ccel" / "ttt.txt", "Torrey's New Topical Textbook"),
             (sources / "ccel" / "bible.txt", "Nave's Topical Bible"),
             (sources / "ccel" / "ebd2.txt", "Easton's Bible Dictionary"),
             (sources / "gutenberg" / "robertson-harmony-36264-h.htm", "Robertson's Harmony of the Gospels")]
    for file, title in books:
        text = source_text(file)
        if file.suffix == ".htm":
            soup = BeautifulSoup(text, "html.parser")
            for node in soup(["script", "style"]):
                node.decompose()
            text = soup.get_text("\n", strip=True)
        text = re.sub(r"[ \t]+", " ", text)
        id = f"reference:{file.stem}"
        licence = "Underlying book public domain; source edition and licence details in SOURCES.md"
        writer.file(file)
        writer.document(id, title, "reference", file, licence)
        # Heading-adjacent paragraphs retain their position; all source text is indexed.
        writer.chunk(id, title, text, "reference", locator=file.name)
    # TIPNR contains additional places/names beyond the generated people directory.
    file = sources / "stepbible" / "TIPNR.txt"
    writer.file(file)
    writer.document("reference:tipnr", "STEP Bible proper names and references", "reference", file, "STEP Bible CC BY 4.0")
    for i, block in enumerate(file.read_text(encoding="utf-8-sig").split("$")):
        text = re.sub(r"\t+", " | ", block).strip()
        writer.chunk("reference:tipnr", "STEP Bible · " + text.split("\n")[0][:120], text, "reference", locator=f"record {i+1}")
    print("Reference books: Torrey, Nave, Easton, Robertson and full STEP names source", flush=True)


def import_project_docs(writer):
    site = writer.config["site_dir"]
    roots = (site.parent, site)
    files = {file for root in roots for file in root.glob("*.md")}
    for folder in (site / "design", site / "content", site / "knowledge", site.parent / "reference"):
        if folder.exists():
            files.update(folder.rglob("*.md"))
            files.update(folder.rglob("*.txt"))
    for file in sorted(files):
        writer.file(file)
        text = file.read_text(encoding="utf-8-sig")
        id = f"document:{file.relative_to(site.parent).as_posix()}"
        writer.document(id, file.stem, "project_document", file, "Project documentation; not Scripture or a theological source")
        writer.chunk(id, file.stem, text, "project_document", locator=file.name)
