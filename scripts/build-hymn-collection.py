"""Write the Hymns pages' data into data/hymns/ from the hymns corpus (Research/Hymns), read-only.

  data/hymns/collection.json        every distinct hymn, its book and main chapter (the /study/hymns page)
  data/hymns/songs/<id>.json        the full study of one hymn (Amazing Grace, for now)
  data/hymns/texts/<group>.json     the words of every hymn, one file per hymn book (the plain hymn pages)

The collection and the Amazing Grace study are made by the approved mock-ups' own builders
(design/hymn-directions/build-collection-data.py and build-data.py), so the page shows exactly what was approved, with
one change the owner decided (Pages/Study/hymns/PLAN.md, section 6 point 3): the verses are SHOWN in the Berean
Standard Bible. The echoes were found in the King James wording these authors read; each verse is then re-read from the
site's own data/text/bsb, and each short quotation beside a line is the BSB's own words, checked to be in that verse.
(The individual hymn pages' pipeline is a separate one, scripts/hymns/.)
Run: py -3.12 scripts/build-hymn-collection.py   (or: npm run hymns)
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


# The short quotation set beside each echoing line, in the BSB's words (the mock-up quoted the KJV). Parts joined by " … "
# must each be found in the passage's BSB text, or the build stops.
BSB_WORDS = {
    "Luke 15:24": "He was lost and is found",
    "John 9:25": "I was blind, but now I see",
    "Titus 2:11–12": "the grace of God … instructs us",
    "1 Samuel 7:12": "Thus far the LORD has helped us",
    "1 Chronicles 17:16": "that You have brought me this far",
    "Psalm 119:114": "I put my hope in Your word",
    "Psalm 119:57": "The LORD is my portion",
    "Psalm 73:26": "My flesh and my heart may fail",
    "Hebrews 6:19": "behind the curtain",
    "2 Peter 3:10": "the elements will be destroyed by fire",
    "Revelation 22:5": "no need for the light of a lamp or of the sun",
}


def bsb_verse(code: str, chapter: int, number: int) -> str:
    """One verse of the site's BSB, as plain text (the same reading as the mock-up's KJV)."""
    for path in sorted((SITE / f"data/text/bsb/{code}").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if str(chapter) in data:
            for v in data[str(chapter)]["v"]:
                if int(v["n"]) == number:
                    words = "".join(p if isinstance(p, str) else p[0] if isinstance(p, list) else "" for p in v["r"])
                    return " ".join(words.replace("¶", "").split())
    raise LookupError(f"no BSB text for {code} {chapter}:{number} in data/text/bsb")


def to_bsb(song: dict) -> dict:
    """Every verse the song page shows, re-read from the BSB; every echo's quotation in the BSB's words."""
    passages = [song["heading"]["passage"], *song["echoes"], *(r for b in song["placed"] for r in b["refs"])]
    for p in passages:
        for v in p["verses"]:
            v["text"] = bsb_verse(p["code"], p["chapter"], v["n"])
    for e in song["echoes"]:
        words = BSB_WORDS.get(e["ref"])
        if words is None:
            raise KeyError(f"echo {e['ref']}: no BSB quotation in BSB_WORDS; add the BSB's own words for it")
        text = " ".join(v["text"] for v in e["verses"])
        for part in words.split(" … "):
            if part not in text:
                raise ValueError(f"echo {e['ref']}: {part!r} is not in its BSB text: {text!r}")
        e["words"] = words
    song["translation"] = "BSB"
    return song


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
    song = to_bsb(run_builder("build-data.py", "data"))
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
