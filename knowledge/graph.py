"""Existing, attributed relationships. Similarity never becomes an asserted theological edge."""
import csv
import runpy


def import_cross_references(writer):
    books = runpy.run_path(str(writer.config["site_dir"] / "scripts/bible/books.py"))["BOOKS"]
    names = {item[3]: item[0] for item in books if item[3]}

    def ref(value):
        name, chapter, verse = value.split(".")
        return f"verse:kjv:{names[name]}:{chapter}:{verse}"

    file = writer.config["sources_dir"] / "openbible/cross_references.txt"
    count = 0
    with file.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream, delimiter="\t"):
            start, _, end = row["To Verse"].partition("-")
            writer.edge(ref(row["From Verse"]), "cross_reference", ref(start), file,
                        {"end": ref(end or start), "votes": int(row["Votes"]), "attribution": "OpenBible.info CC-BY", "basis": "source cross-reference; not an independent doctrinal claim"})
            count += 1
    writer.file(file, "relationships", f"{count} directional references, including source votes")
    print(f"Cross-references: {count:,} source relationships", flush=True)


def neighbors(db, subject, limit=30):
    limit = max(1, min(limit, 100))
    direct = db.execute("SELECT * FROM edges WHERE subject=? ORDER BY json_extract(metadata,'$.votes') DESC LIMIT ?", (subject, limit)).fetchall()
    reverse = db.execute("SELECT * FROM edges WHERE object=? ORDER BY json_extract(metadata,'$.votes') DESC LIMIT ?", (subject, limit)).fetchall()
    return {"outgoing": [dict(row) for row in direct], "incoming": [dict(row) for row in reverse]}
