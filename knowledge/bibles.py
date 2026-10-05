"""Import every catalogued edition, including notes and original verse numbering."""
import json
import re


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def verse_bounds(label):
    match = re.match(r"^(\d+)(?:[-–](\d+))?", str(label))
    return (int(match[1]), int(match[2] or match[1])) if match else (0, 0)


def runs_text(runs):
    return "".join(run if isinstance(run, str) else run[0] if isinstance(run, list) else " " if "b" in run else "" for run in runs).strip()


def import_bibles(writer):
    root = writer.config["site_dir"] / "data"
    catalog = read_json(root / "catalog.json")
    writer.file(root / "catalog.json")
    books = {book["code"]: book for book in catalog["books"]}
    for version in catalog["translations"]:
        slug = version["slug"]
        expected, imported = version["verses"], 0
        licence = json.dumps(version.get("credit"), ensure_ascii=False) if version.get("credit") else "Public domain per eBible.org; see SOURCES.md for edition-specific notes"
        for code, chapter_labels in version["books"].items():
            book = books[code]
            directory = root / "text" / slug / code
            doc = f"bible:{slug}:{code}"
            title = f"{book['name']} — {version['name']} ({version['abbr']})"
            writer.document(doc, title, "bible", directory, licence, version["lang"], slug,
                            {"numbering": version["numbering"], "book": book, "year": version["year"], "direction": version["dir"]})
            chapters = {}
            for file in sorted(directory.glob("*.json")):
                chapters.update(read_json(file))
                writer.file(file)
            if set(chapters) != set(chapter_labels):
                raise ValueError(f"Chapter coverage mismatch: {slug}/{code}")
            for chapter_label in chapter_labels:
                chapter = chapters[chapter_label]
                chapter_n = int(chapter_label)
                pending, size = [], 0

                def flush():
                    nonlocal pending, size
                    if not pending:
                        return
                    first, last = pending[0][0], pending[-1][1]
                    heading = f"{book['name']} {chapter_label}:{first}–{last} · {version['abbr']}"
                    writer.chunk(doc, heading, "\n".join(item[2] for item in pending), "bible", version["lang"], slug,
                                 code, chapter_n, first, last, f"/read/{slug}/{code}/{chapter_label}?hl={first}-{last}", f"{chapter_label}:{first}-{last}")
                    pending, size = [], 0

                for verse in chapter["v"]:
                    imported += 1
                    start, end = verse_bounds(verse["n"])
                    text = runs_text(verse["r"])
                    notes = [run["f"] for run in verse["r"] if isinstance(run, dict) and "f" in run]
                    strong = sorted({run[2] for run in verse["r"] if isinstance(run, list) and len(run) > 2})
                    writer.db.execute("INSERT INTO verses VALUES(?,?,?,?,?,?,?,?,?)", (
                        f"verse:{slug}:{code}:{chapter_label}:{verse['n']}", slug, code, chapter_n, verse["n"], start, end, text,
                        json.dumps({"notes": notes, "headings": verse.get("h", []), "strong": strong}, ensure_ascii=False)))
                    line = f"{chapter_label}:{verse['n']} {text}"
                    if pending and size + len(line) + 1 > writer.config["chunk_chars"]:
                        flush()
                    pending.append((start, end, line))
                    size += len(line) + 1
                    for i, note in enumerate(notes):
                        writer.chunk(doc, f"{book['name']} {chapter_label}:{verse['n']} · {version['abbr']} footnote", note,
                                     "bible_note", version["lang"], slug, code, chapter_n, start, end,
                                     f"/read/{slug}/{code}/{chapter_label}?hl={start}-{end}", f"{chapter_label}:{verse['n']}:note:{i}")
                    for i, heading in enumerate(verse.get("h", [])):
                        writer.chunk(doc, f"{book['name']} {chapter_label}:{verse['n']} · {version['abbr']} heading", heading[1],
                                     "bible_note", version["lang"], slug, code, chapter_n, start, end,
                                     f"/read/{slug}/{code}/{chapter_label}?hl={start}-{end}", f"{chapter_label}:{verse['n']}:heading:{i}")
                flush()
                extra = "\n".join([runs_text(chapter.get("t", [])), *[h[1] for h in chapter.get("e", [])]]).strip()
                if extra:
                    writer.chunk(doc, f"{book['name']} {chapter_label} · {version['abbr']} title/colophon", extra, "bible_note",
                                 version["lang"], slug, code, chapter_n, link=f"/read/{slug}/{code}/{chapter_label}", locator=f"{chapter_label}:extra")
        if imported != expected:
            raise ValueError(f"Verse coverage mismatch for {slug}: catalog {expected}, imported {imported}")
        writer.db.commit()
        print(f"Bible {version['abbr']}: {imported:,} verses verified", flush=True)
    return catalog
