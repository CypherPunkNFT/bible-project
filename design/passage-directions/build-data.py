"""Build data.js and images.js for the "A passage through the manuscripts" mock-ups.

Reads the approved Manuscripts mock-up's data.js (itself built from the open corpus: Wikidata CC0 with Wikipedia
CC BY-SA, ETCBC CC BY-NC, Syriaca.org CC BY 3.0; csntm.json is never opened) and keeps only the records that hold
Galatians, Romans or Mark, the three books this study works in. Also embeds those records' pictures as data URIs,
because the local /mockups/ route does not serve .jpg.

    python -B build-data.py
"""
import base64
import collections
import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "manuscripts-directions"
BOOKS = {"galatians": 47, "romans": 44, "mark": 40}
# The witnesses this study discusses by name, by Wikidata id.
KEY = {
    "Q1513469": "P46", "Q152962": "Sinaiticus", "Q209285": "Vaticanus", "Q318233": "Alexandrinus",
    "Q697885": "P45", "Q6870196": "GA 304",
}
KEEP = ["i", "n", "k", "L", "src", "g", "e", "l", "d", "db", "dw", "why", "c", "b", "bs", "bwhy", "hr", "h", "sh",
        "m", "wp", "wr", "im", "ch", "la", "sc", "su"]


def load_ms() -> dict:
    path = SOURCE / "data.js"
    text = path.read_text(encoding="utf-8")
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < 0:
        raise ValueError(f"{path}: expected 'window.MS = {{...}}', found no JSON object")
    return json.loads(text[start:end + 1])


def main() -> None:
    ms = load_ms()
    wanted = set(BOOKS.values())
    records = [{k: r[k] for k in KEEP if k in r} for r in ms["records"] if wanted & set(r.get("b") or [])]
    ids = {r["i"] for r in records}
    missing = [name for qid, name in KEY.items() if qid not in ids]
    if missing:
        raise ValueError(f"key witnesses missing from the open records: {missing}")

    problems = []
    for r in records:
        if "e" in r and r["l"] - r["e"] > 400:
            problems.append(f"{r['n']}: a very wide date ({r['d']}), plotted at its middle")
    p45 = next(r for r in records if r["i"] == "Q697885")
    if p45.get("h") == ["onb"]:
        problems.append("Papyrus 45: the record names the Austrian National Library as holder with the Chester Beatty "
                        "shelfmark BP I; most of its leaves are in the Chester Beatty Library, Dublin")

    holder_ids = {h for r in records for h in r.get("h", [])}
    holders = [h for h in ms["holders"] if h["id"] in holder_ids]
    image_keys = sorted({r["im"] for r in records if "im" in r})
    images = {k: ms["images"][k] for k in image_keys}

    counts = {}
    for case, book in BOOKS.items():
        rs = [r for r in records if book in r.get("b", [])]
        counts[case] = {
            "records": len(rs),
            "dated": sum("e" in r for r in rs),
            "byKind": dict(collections.Counter(r["k"] for r in rs)),
            "withChapters": sum(str(book) in (r.get("ch") or {}) for r in rs),
            "pictured": sum("im" in r for r in rs),
        }
    out = {
        "built": "2026-10-19", "from": ms["built"], "books": ms["books"], "groups": ms["groups"],
        "written": {str(b): ms["written"][str(b)] for b in BOOKS.values()},
        "bookOf": BOOKS, "key": KEY, "counts": counts, "total": len(records),
        "holders": holders, "images": images, "excluded": [], "records": records,
    }
    header = ("// Built by build-data.py from the Manuscripts mock-up's open data (Wikidata CC0 + Wikipedia CC BY-SA; "
              "ETCBC CC BY-NC; Syriaca.org CC BY 3.0): the records holding Galatians, Romans or Mark. Do not edit.\n")
    (HERE / "data.js").write_text(header + "window.MS = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
                                  encoding="utf-8")

    uris = {}
    for key in image_keys:
        jpg = SOURCE / "assets" / f"{key}.jpg"
        if not jpg.exists():
            raise FileNotFoundError(f"picture for {key} expected at {jpg}, not found")
        uris[key] = "data:image/jpeg;base64," + base64.b64encode(jpg.read_bytes()).decode("ascii")
    (HERE / "images.js").write_text("// Pictures from Wikimedia Commons (credits in data.js), as data URIs. Built by build-data.py.\n"
                                    "window.MS_IMG = " + json.dumps(uris) + ";\n", encoding="utf-8")

    print(f"records: {len(records)}; holders: {len(holders)}; pictures: {len(image_keys)}")
    for case, c in counts.items():
        print(f"  {case}: {c}")
    print("data problems:")
    for p in problems:
        print(f"  - {p}")


if __name__ == "__main__":
    main()
