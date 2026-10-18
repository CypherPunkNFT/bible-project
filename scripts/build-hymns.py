"""Write the Hymns pages' data into data/hymns/ from the hymns corpus (Research/Hymns), read-only.

  data/hymns/collection.json        every distinct hymn, its book and main chapter (the /study/hymns page)
  data/hymns/songs/<id>.json        the full study of one hymn (Amazing Grace, for now)
  data/hymns/texts/<group>.json     the words of every hymn, one file per hymn book (the plain hymn pages)

The collection and the Amazing Grace study are made by the approved mock-ups' own builders
(design/hymn-directions/build-collection-data.py and build-data.py), so the page shows exactly what was approved.
Run: py -3.12 scripts/build-hymns.py   (or: npm run hymns)
"""
from __future__ import annotations

import json
import runpy
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parents[1]
DESIGN = SITE / "design/hymn-directions"
HYMNS = SITE.parent / "Research/Hymns/normalized/hymns"
OUT = SITE / "data/hymns"


def run_builder(name: str, result: str) -> dict:
    """Run one mock-up builder and return the dict it built (it also refreshes its mock-up data file, unchanged)."""
    values = runpy.run_path(str(DESIGN / name), run_name="__main__")
    if result not in values or not isinstance(values[result], dict):
        raise RuntimeError(f"{name}: expected a dict named {result!r} after running it, found {type(values.get(result)).__name__}")
    return values[result]


def write(path: Path, data: object) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8", newline="\n")
    return len(text.encode("utf-8"))


def words_of(hymn: dict) -> dict:
    """What a plain hymn page shows: the stanzas as printed, its facts, every passage it cites, and its source."""
    stanzas = [v["lines"] for v in hymn.get("verses") or [] if v.get("lines")]
    if not stanzas:
        stanzas = [block.split("\n") for block in hymn["text"].split("\n\n") if block.strip()]
    source = hymn["source"]
    return {
        "title": hymn.get("title") or "", "book": hymn.get("book") or "", "number": hymn.get("number") or "",
        "meter": hymn.get("meter") or "", "subject": hymn.get("subject") or "", "stanzas": stanzas,
        "refs": [r["raw"] for r in hymn.get("scripture_references") or [] if r.get("raw")],
        "source": {"title": source.get("title") or "", "url": source.get("url") or "", "licence": source.get("licence") or ""},
    }


def main() -> None:
    collection = run_builder("build-collection-data.py", "out")
    song = run_builder("build-data.py", "data")
    held = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in HYMNS.glob("*.json")}
    texts: dict[str, dict[str, dict]] = {g["id"]: {} for g in collection["groups"]}
    for hymn in collection["hymns"]:
        record = held.get(hymn["id"])
        if record is None:
            raise LookupError(f"collection hymn {hymn['id']} has no record in {HYMNS}")
        texts[hymn["g"]][hymn["id"]] = words_of(record)

    sizes = {"collection.json": write(OUT / "collection.json", collection),
             f"songs/{song['id']}.json": write(OUT / "songs" / f"{song['id']}.json", song)}
    for group, entries in texts.items():
        sizes[f"texts/{group}.json"] = write(OUT / "texts" / f"{group}.json", entries)
    for name, size in sizes.items():
        print(f"{name}: {size:,} bytes")
    print(f"{len(collection['hymns'])} hymns, {sum(len(t) for t in texts.values())} with words")


if __name__ == "__main__":
    main()
