#!/usr/bin/env python3
"""Build src/data/letters/browse.json: what the Letters study's "Across all twenty-one" pages need beyond the four
collection files and overview.json.

- Torrey's topics for Christ, the church and prayer, keeping only the passages in the twenty-one letters
- the Topics that cite the letters most (from data/topics/books/)
- Greek word counts and words found in only one New Testament book (Byzantine text, by Strong's number)
- cross-reference counts between the letters, and to the Gospels and Acts (data/xref-books.json)
- each letter's first key verse in every translation on the site that has it

Spans are [first, last] verse ids (book * 1_000_000 + chapter * 1_000 + verse), as in src/data/letters/types.ts.
Run from the Website folder:  python scripts/build-letters-browse.py
"""
import glob
import json
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
GROUP_FILES = ["paul-letters", "hebrews", "general-letters", "john-letters"]
LETTER_BOOKS = range(45, 66)  # Romans to Jude
CHRIST_SUBCATEGORIES = ["titles-and-offices", "person-of-christ", "life-and-ministry", "cross-resurrection-return",
                        "believers-and-christ", "the-church", "prayer", "ordinances-and-fellowship"]
GOSPELS_AND_ACTS = ["MAT", "MRK", "LUK", "JHN", "ACT"]

catalog = json.loads((SITE / "data/catalog.json").read_text(encoding="utf-8"))
BOOKS = {b["code"]: b for b in catalog["books"]}
groups = [json.loads((SITE / f"src/data/letters/{name}.json").read_text(encoding="utf-8")) for name in GROUP_FILES]
letters = {l["code"]: l for g in groups for l in g["letters"]}
order = [l["code"] for g in groups for l in g["letters"]]


def book_of(verse_id: int) -> int:
    return verse_id // 1_000_000


def chapters(slug: str, code: str) -> dict[int, dict]:
    out = {}
    for f in glob.glob(str(SITE / f"data/text/{slug}/{code}/*.json")):
        for key, ch in json.loads(Path(f).read_text(encoding="utf-8")).items():
            if key.isdigit():
                out[int(key)] = ch
    return out


def runs_text(runs: list) -> str:
    return "".join(r if isinstance(r, str) else r[0] if isinstance(r, list) else "" for r in runs).strip()


def verse_text(slug: str, code: str, span: list[int]) -> str:
    c1, v1, c2, v2 = span[0] // 1000 % 1000, span[0] % 1000, span[1] // 1000 % 1000, span[1] % 1000
    by_chapter, words = chapters(slug, code), []
    for c in range(c1, c2 + 1):
        for verse in (by_chapter.get(c) or {}).get("v", []):
            n = int(verse["n"]) if str(verse["n"]).isdigit() else -1
            if (c > c1 or n >= v1) and (c < c2 or n <= v2):
                words.append(runs_text(verse["r"]))
    return " ".join(w for w in words if w)


def topic_points(topic: dict) -> list[dict]:
    """A topic's points and sub-points that cite the letters, keeping only those passages."""
    found = []
    for point in topic.get("points", []):
        for item in [point, *point.get("items", [])]:
            spans = [r for r in item.get("refs", []) if book_of(r[0]) in LETTER_BOOKS]
            if spans:
                text = item["text"] if item is point else f"{point['text']} {item['text']}"
                found.append({"text": text, "refs": spans})
    return found


def christ_topics() -> dict:
    idx = json.loads((SITE / "data/topics/index.json").read_text(encoding="utf-8"))
    bundles: dict[int, dict] = {}

    def topic(tid: str) -> dict:
        f = idx["topics"][tid]["f"]
        if f not in bundles:
            bundles[f] = json.loads((SITE / f"data/topics/t/{f}.json").read_text(encoding="utf-8"))
        return bundles[f][tid]

    subs = {s["id"]: s for c in idx["categories"] for s in c["subcategories"]}
    out = {}
    for sid in CHRIST_SUBCATEGORIES:
        items = []
        for tid in subs[sid]["topics"]:
            points = topic_points(topic(tid))
            if points:
                items.append({"id": tid, "title": idx["topics"][tid]["title"], "points": points, "n": sum(len(p["refs"]) for p in points)})
        out[sid] = {"title": subs[sid]["title"], "topics": sorted(items, key=lambda x: -x["n"])}
    return out, idx


def top_topics(idx: dict) -> list[dict]:
    counts: dict[str, dict[str, int]] = {}
    for code in order:
        for per_chapter in json.loads((SITE / f"data/topics/books/{code}.json").read_text(encoding="utf-8")).values():
            for tid, n in per_chapter:
                counts.setdefault(tid, {}).setdefault(code, 0)
                counts[tid][code] += n
    ranked = sorted(counts.items(), key=lambda kv: -sum(kv[1].values()))[:30]
    return [{"id": tid, "title": idx["topics"][tid]["title"], "total": sum(per.values()), "letters": per} for tid, per in ranked]


def greek() -> tuple[dict, dict]:
    """Greek words per letter, and the Strong's numbers only one New Testament book uses (a letter)."""
    nt = [b["code"] for b in catalog["books"] if 40 <= b["num"] <= 66]
    where: dict[str, dict[str, list]] = {}
    counts = {}
    for code in nt:
        n = 0
        for c, ch in sorted(chapters("byz", code).items()):
            for verse in ch["v"]:
                vid = BOOKS[code]["num"] * 1_000_000 + c * 1000 + int(verse["n"])
                for r in verse["r"]:
                    if isinstance(r, list) and len(r) == 3 and r[2]:
                        n += 1
                        for number in r[2].split():
                            where.setdefault(number, {}).setdefault(code, []).append((r[0].strip(), vid))
        counts[code] = n
    only = {code: [] for code in order}
    for number, books in where.items():
        if len(books) == 1:
            code = next(iter(books))
            if code in only:
                uses = books[code]
                only[code].append({"strongs": number, "greek": uses[0][0], "count": len(uses), "refs": [[v, v] for _, v in uses[:4]]})
    for code in only:
        only[code].sort(key=lambda w: (-w["count"], w["strongs"]))
    return counts, only


def cross_references() -> tuple[dict, dict]:
    links: dict[str, int] = {}
    for a, b, n in json.loads((SITE / "data/xref-books.json").read_text(encoding="utf-8")):
        links[f"{a}|{b}"] = links.get(f"{a}|{b}", 0) + n
    both = lambda a, b: links.get(f"{a}|{b}", 0) + links.get(f"{b}|{a}", 0)
    grid = {f"{a}|{b}": both(a, b) for a in order for b in order if a != b}
    gospels = {code: {g: both(code, g) for g in GOSPELS_AND_ACTS} for code in order}
    return grid, gospels


def translations() -> list[dict]:
    out = []
    for t in catalog["translations"]:
        books = dict(t["books"]) if isinstance(t["books"], list) else t["books"]
        verses = {}
        for code in order:
            if code in books:
                text = verse_text(t["slug"], code, letters[code]["keyVerses"][0]["span"])
                if text:
                    verses[code] = text
        if verses:
            out.append({"slug": t["slug"], "abbr": t["abbr"], "name": t["name"], "year": t.get("year"), "lang": t["lang"], "dir": t.get("dir", "ltr"), "verses": verses})
    return out


def main() -> None:
    christ, idx = christ_topics()
    counts, only = greek()
    grid, gospels = cross_references()
    data = {
        "christ": christ,
        "topicsTop": top_topics(idx),
        "greekWords": {code: counts[code] for code in order},
        "onlyHere": only,
        "grid": grid,
        "gospels": gospels,
        "gospelNames": {g: BOOKS[g]["name"] for g in GOSPELS_AND_ACTS},
        "translations": translations(),
    }
    out = SITE / "src/data/letters/browse.json"
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    mismatched = {c: (counts[c], letters[c].get("greekWords")) for c in order if letters[c].get("greekWords") not in (None, counts[c])}
    print(f"wrote {out.relative_to(SITE)} ({out.stat().st_size // 1024} KB): {sum(len(s['topics']) for s in christ.values())} Christ topics, "
          f"{sum(len(v) for v in only.values())} only-here words, {len(data['translations'])} translations")
    print(f"Greek counts that differ from the letter files (the pages keep the files' figures): {mismatched}")


if __name__ == "__main__":
    main()
