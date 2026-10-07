"""Build design/letters-layouts-2/letters-data.js: all four collections of letters, from the site's own data.

Every chart on layout 2's collection pages is drawn from this file (window.LETTERS). Run from anywhere:
    python design/letters-layouts-2/build-letters-data.py
"""
import glob
import json
import math
from pathlib import Path

SITE = Path(__file__).resolve().parents[2]
GROUPS = {"paul": "paul-letters", "hebrews": "hebrews", "general": "general-letters", "john": "john-letters"}
catalog = json.loads((SITE / "data/catalog.json").read_text(encoding="utf-8"))
BOOKS = {b["num"]: b for b in catalog["books"]}
atlas = json.loads((SITE / "src/data/atlas-map.json").read_text(encoding="utf-8"))
places = {p["id"]: p for p in json.loads((SITE / "data/places.json").read_text(encoding="utf-8"))}


def project(lon: float, lat: float) -> tuple[float, float]:
    """d3 geoMercator with the atlas's scale and translate, so places sit where the Atlas puts them."""
    s, (tx, ty) = atlas["scale"], atlas["translate"]
    return round(s * math.radians(lon) + tx, 2), round(ty - s * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)), 2)


def split(vid: int) -> tuple[int, int, int]:
    return vid // 1_000_000, vid // 1000 % 1000, vid % 1000


def label(span: list[int]) -> str:
    """"Romans 1:16–17" style label for a verse span."""
    (b, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    name = BOOKS[b]["name"]
    if c1 == c2:
        return f"{name} {c1}:{v1}" + (f"–{v2}" if v2 != v1 else "")
    return f"{name} {c1}:{v1}–{c2}:{v2}"


_chapters: dict[tuple[str, int], dict | None] = {}


def chapter(code: str, c: int) -> dict:
    if (code, c) not in _chapters:
        for f in glob.glob(str(SITE / f"data/text/kjv/{code}/*.json")):
            for key, ch in json.loads(Path(f).read_text(encoding="utf-8")).items():
                _chapters[(code, int(key))] = ch
        _chapters.setdefault((code, c), None)
    found = _chapters[(code, c)]
    if found is None:
        raise KeyError(f"no KJV chapter {code} {c}")
    return found


def text(span: list[int]) -> str:
    """The KJV words of a verse span (Strong's tags dropped)."""
    (b, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    words = []
    for c in range(c1, c2 + 1):
        for verse in chapter(BOOKS[b]["code"], c)["v"]:
            n = int(verse["n"])
            if (c > c1 or n >= v1) and (c < c2 or n <= v2):
                words.append("".join(r if isinstance(r, str) else r[0] if isinstance(r, list) else "" for r in verse["r"]))
    return " ".join(w.strip() for w in words).replace("  ", " ")


def chapter_lengths(code: str) -> list[int]:
    out, c = [], 1
    while True:
        try:
            out.append(max(int(v["n"]) for v in chapter(code, c)["v"]))
        except KeyError:
            return out
        c += 1


def verse_count(span: list[int]) -> int:
    (b, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    lengths = chapter_lengths(BOOKS[b]["code"])
    return sum(lengths[c - 1] for c in range(c1, c2)) - v1 + 1 + v2


def refs(spans: list | None) -> list[str]:
    return [label(s) for s in spans or []]


def rail(side: dict) -> dict:
    """One rail of a side-by-side chart: its label, the span it covers, and its book's chapter lengths."""
    (b, c1, v1), (_, c2, v2) = split(side["span"][0]), split(side["span"][1])
    return {"label": side["label"], "start": [c1, v1], "end": [c2, v2], "chapters": chapter_lengths(BOOKS[b]["code"]), "verses": verse_count(side["span"])}


def letter(item: dict) -> dict:
    return {
        "code": item["code"], "name": item["name"], "verses": item["verses"], "greekWords": item.get("greekWords"),
        "date": {"from": item["date"].get("from"), "to": item["date"].get("to")},
        "facts": {k: item[k]["text"] for k in ("author", "recipients", "writtenFrom", "date", "occasion")},
        "themes": [t["text"] for t in item["themes"]],
        "keyVerses": [{"ref": label(k["span"]), "why": k["why"], "text": text(k["span"])} for k in item["keyVerses"]],
        "outline": [{"title": o["title"], "ref": label(o["span"]), "kind": o.get("kind"), "verses": verse_count(o["span"])} for o in item["outline"]],
        "words": [{k: w.get(k) for k in ("greek", "translit", "strongs", "gloss", "count", "note")} for w in item["words"]],
        "otQuotes": [{"at": label(q["at"]), "from": label(q["from"]), "note": q.get("note", "")} for q in item["otQuotes"]],
        "people": [{"name": x["name"], "note": x.get("note", ""), "refs": refs(x.get("refs"))} for x in item.get("people", [])],
        "places": [{"name": x["name"], "note": x.get("note", ""), "implied": bool(x.get("implied")), "refs": refs(x.get("refs"))} for x in item.get("places", [])],
    }


def group(data: dict) -> dict:
    claim = lambda x: (x.get("claim") or {}).get("text", "")
    return {
        "title": data["title"], "tagline": data["tagline"],
        "letters": [letter(x) for x in data["letters"]],
        "groupings": [{"label": g["label"], "letters": g["letters"]} for g in data.get("groupings", [])],
        "timelines": {t["id"]: {"title": t["title"], "axis": t.get("axis"), "claim": claim(t),
                                "events": [{"label": e["label"], "from": e["from"], "to": e.get("to"), "kind": e.get("kind"), "letter": e.get("letter"), "refs": refs(e.get("refs"))} for e in t["events"]]}
                      for t in data.get("timelines", [])},
        "maps": {m["id"]: {"title": m["title"], "route": bool(m.get("route")), "years": m.get("years"), "claim": claim(m),
                           "pts": [[s["name"], *project(places[s["placeId"]]["lon"], places[s["placeId"]]["lat"]), s.get("note", ""), s.get("letter", "")] for s in m["stops"] if s.get("placeId") in places]}
                 for m in data.get("maps", [])},
        "networks": {n["id"]: {"title": n["title"], "claim": claim(n),
                               "nodes": [{"id": x["id"], "label": x["label"], "group": x.get("group"), "note": x.get("note", ""), "refs": refs(x.get("refs"))} for x in n["nodes"]],
                               "edges": [{"from": e["from"], "to": e["to"], "label": e.get("label", "")} for e in n["edges"]]}
                     for n in data.get("networks", [])},
        "parallels": {p["id"]: {"title": p["title"], "claim": claim(p), "left": rail(p["left"]), "right": rail(p["right"]),
                                "pairs": [{"l": [split(x)[1:] for x in q["left"]], "r": [split(x)[1:] for x in q["right"]], "left": label(q["left"]), "right": label(q["right"]),
                                           "note": q.get("note", ""), "kind": q.get("kind", ""), "weight": q.get("weight"), "lt": text(q["left"]), "rt": text(q["right"])} for q in p["pairs"]]}
                      for p in data.get("parallels", [])},
        "ladders": {l["id"]: {"title": l["title"], "claim": claim(l), "steps": [{"label": s["label"], "better": s.get("better", ""), "note": s.get("note", ""), "refs": refs(s.get("refs"))} for s in l["steps"]]}
                    for l in data.get("ladders", [])},
        "questions": [{"question": q["question"], "letters": q.get("letters", []), "views": [{"label": v["label"], "holders": v.get("holders", ""), "argument": v["argument"]["text"]} for v in q["views"]]} for q in data["questions"]],
        "canon": [{"year": c["year"], "label": c["label"], "who": c["who"], "status": c["status"], "claim": claim(c)} for c in data["canon"]],
    }


sources = {key: json.loads((SITE / f"src/data/letters/{name}.json").read_text(encoding="utf-8")) for key, name in GROUPS.items()}
out = {"land": atlas["land"], "groups": {key: group(data) for key, data in sources.items()}}


def overview() -> dict:
    """The pages under the Letters home's other three rows: everything across all twenty-one letters."""
    o = json.loads((SITE / "src/data/letters/overview.json").read_text(encoding="utf-8"))
    text_of = lambda c: c["text"] if isinstance(c, dict) else c
    study = json.loads((SITE / "data/study/letters.json").read_text(encoding="utf-8"))
    order = [l["code"] for key in GROUPS for l in sources[key]["letters"]]
    group_of = {l["code"]: key for key in GROUPS for l in sources[key]["letters"]}
    names = {l["code"]: l["name"] for key in GROUPS for l in sources[key]["letters"]}
    flows = []
    for key, data in sources.items():
        title = data["title"]
        merged: dict[str, dict] = {}
        for f in data.get("flows", []):
            if f["id"] != "ot-sources":
                continue
            for link in f["links"]:
                m = merged.setdefault(link["source"], {"source": link["source"], "target": title, "value": 0, "refs": []})
                m["value"] += link["value"]
                m["refs"] += refs(link.get("refs"))
        flows += merged.values()
    return {
        "order": order, "groupOf": group_of, "names": names,
        "nums": {b["code"]: b["num"] for b in catalog["books"]},
        "chapters": {code: chapter_lengths(code) for code in order},
        "intro": [text_of(c) for c in o["intro"]], "collection": [text_of(c) for c in o["collection"]],
        "letterForm": [{"part": f["part"], "claim": f["claim"]["text"], "examples": refs(f.get("examples"))} for f in o["letterForm"]],
        "hands": [{"name": h["name"], "role": h["role"], "letter": h["letter"], "note": h.get("note", ""), "refs": refs(h.get("refs"))} for h in o["hands"]],
        "letterLinks": [{"from": l["from"], "to": l["to"], "label": l.get("label", ""), "claim": l["claim"]["text"]} for l in o["letterLinks"]],
        "sharedPeople": [{"name": x["name"], "letters": x["letters"], "claim": x["claim"]["text"]} for x in o["sharedPeople"]],
        "themes": [{"title": t["title"], "letters": t["letters"], "claim": t["claim"]["text"], "refs": refs(t["claim"].get("refs"))} for t in o["themes"]],
        "questions": [{"question": q["question"], "letters": q.get("letters", []), "views": [{"label": v["label"], "holders": v.get("holders", ""), "argument": v["argument"]["text"]} for v in q["views"]]} for q in o["questions"]],
        "canon": [{"year": c["year"], "label": c["label"], "who": c["who"], "status": c["status"], "claim": c["claim"]["text"]} for c in o["canon"]],
        "sections": {l["code"]: {"verses": l["verses"], "sections": [{"title": x["title"], "ref": label([x["start"], x["end"]]), "verses": x["verses"]} for x in l["sections"]]} for l in study},
        "flows": flows,
    }


out["overview"] = overview()

LETTER_NUMS = range(45, 66)  # Romans to Jude
CHRIST_SUBCATEGORIES = ["titles-and-offices", "person-of-christ", "life-and-ministry", "cross-resurrection-return", "believers-and-christ", "the-church", "prayer", "ordinances-and-fellowship"]
COMPARE_BOOKS = ["MAT", "MRK", "LUK", "JHN", "ACT"]


def runs_text(runs: list) -> str:
    return "".join(r if isinstance(r, str) else r[0] if isinstance(r, list) else "" for r in runs).strip()


def book_chapters(slug: str, code: str) -> dict[int, dict]:
    out = {}
    for f in glob.glob(str(SITE / f"data/text/{slug}/{code}/*.json")):
        for key, ch in json.loads(Path(f).read_text(encoding="utf-8")).items():
            if key.isdigit():
                out[int(key)] = ch
    return out


def verse_text(slug: str, code: str, span: list[int]) -> str:
    (_, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    chapters, words = book_chapters(slug, code), []
    for c in range(c1, c2 + 1):
        for verse in (chapters.get(c) or {}).get("v", []):
            n = int(verse["n"]) if str(verse["n"]).isdigit() else -1
            if (c > c1 or n >= v1) and (c < c2 or n <= v2):
                words.append(runs_text(verse["r"]))
    return " ".join(w for w in words if w)


def topic_points(topic: dict) -> list[dict]:
    """A topic's points (and sub-points) that cite the letters, with only those letter passages."""
    found = []
    for point in topic.get("points", []):
        for item in [point, *point.get("items", [])]:
            spans = [r for r in item.get("refs", []) if split(r[0])[0] in LETTER_NUMS]
            if spans:
                found.append({"text": item["text"] if item is point else f"{point['text']} {item['text']}", "refs": refs(spans)})
    return found


def supers() -> dict:
    """Data for the four ways in across all twenty-one letters."""
    idx = json.loads((SITE / "data/topics/index.json").read_text(encoding="utf-8"))
    bundles: dict[int, dict] = {}
    def topic(tid: str) -> dict:
        f = idx["topics"][tid]["f"]
        if f not in bundles:
            bundles[f] = json.loads((SITE / f"data/topics/t/{f}.json").read_text(encoding="utf-8"))
        return bundles[f][tid]
    subs = {s["id"]: s for c in idx["categories"] for s in c["subcategories"]}
    christ = {}
    for sid in CHRIST_SUBCATEGORIES:
        items = []
        for tid in subs[sid]["topics"]:
            pts = topic_points(topic(tid))
            if pts:
                items.append({"id": tid, "title": idx["topics"][tid]["title"], "points": pts, "n": sum(len(x["refs"]) for x in pts)})
        christ[sid] = {"title": subs[sid]["title"], "topics": sorted(items, key=lambda x: -x["n"])}

    order = out["overview"]["order"]
    counts: dict[str, dict[str, int]] = {}
    for code in order:
        for chapter_list in json.loads((SITE / f"data/topics/books/{code}.json").read_text(encoding="utf-8")).values():
            for tid, n in chapter_list:
                counts.setdefault(tid, {}).setdefault(code, 0)
                counts[tid][code] += n
    top = sorted(counts.items(), key=lambda kv: -sum(kv[1].values()))[:30]
    topics_top = [{"id": tid, "title": idx["topics"][tid]["title"], "total": sum(per.values()), "letters": per} for tid, per in top]

    # Greek: words per letter, and words found in only one New Testament book (a letter), from the Byzantine text.
    nt = [b["code"] for b in catalog["books"] if 40 <= b["num"] <= 66]
    where: dict[str, dict[str, list]] = {}
    greek_words = {}
    for code in nt:
        n = 0
        for c, ch in sorted(book_chapters("byz", code).items()):
            for verse in ch["v"]:
                for r in verse["r"]:
                    if isinstance(r, list) and len(r) == 3 and r[2]:
                        n += 1
                        for sn in r[2].split():
                            where.setdefault(sn, {}).setdefault(code, []).append([r[0].strip(), f"{c}:{verse['n']}"])
        greek_words[code] = n
    only = {code: [] for code in order}
    for sn, books in where.items():
        if len(books) == 1:
            code = next(iter(books))
            if code in only:
                uses = books[code]
                only[code].append({"strongs": sn, "greek": uses[0][0], "refs": [f"{out['overview']['names'][code]} {u[1]}" for u in uses[:4]], "count": len(uses)})
    for code in only:
        only[code].sort(key=lambda w: (-w["count"], w["strongs"]))

    pairs = json.loads((SITE / "data/xref-books.json").read_text(encoding="utf-8"))
    links = {}
    for a, b, n in pairs:
        links[f"{a}|{b}"] = links.get(f"{a}|{b}", 0) + n
    grid = {f"{a}|{b}": links.get(f"{a}|{b}", 0) + links.get(f"{b}|{a}", 0) for a in order for b in order if a != b}
    gospels = {code: {g: links.get(f"{code}|{g}", 0) + links.get(f"{g}|{code}", 0) for g in COMPARE_BOOKS} for code in order}

    letters_by_code = {l["code"]: (key, l) for key, data in sources.items() for l in data["letters"]}
    translations = []
    for t in catalog["translations"]:
        books = dict(t["books"]) if isinstance(t["books"], list) else t["books"]
        verses = {}
        for code in order:
            first = letters_by_code[code][1]["keyVerses"][0]["span"]
            if code in books:
                txt = verse_text(t["slug"], code, first)
                if txt:
                    verses[code] = txt
        translations.append({"slug": t["slug"], "abbr": t["abbr"], "name": t["name"], "year": t.get("year"), "lang": t["lang"], "dir": t.get("dir", "ltr"), "verses": verses})
    key_refs = {code: label(letters_by_code[code][1]["keyVerses"][0]["span"]) for code in order}
    return {"christ": christ, "topicsTop": topics_top, "greekWords": greek_words, "onlyHere": only, "grid": grid, "gospels": gospels, "gospelNames": {g: BOOKS_BY_CODE[g]["name"] for g in COMPARE_BOOKS},
            "translations": translations, "keyRefs": key_refs}


BOOKS_BY_CODE = {b["code"]: b for b in catalog["books"]}
out["supers"] = supers()
sup = out["supers"]
print("greek words check:", {c: (sup["greekWords"][c], next((l.get("greekWords") for d in sources.values() for l in d["letters"] if l["code"] == c), None)) for c in ["ROM", "GAL", "1JN", "HEB", "JUD"]})
print("christ topics:", {k: len(v["topics"]) for k, v in sup["christ"].items()}, "| only-here words:", {c: len(v) for c, v in sup["onlyHere"].items() if v})
print("translations with Romans:", sum(1 for t in sup["translations"] if "ROM" in t["verses"]))
js = "// Generated from the site's data by design/letters-layouts-2/build-letters-data.py. Do not edit by hand.\n"
js += "window.LETTERS = " + json.dumps(out, ensure_ascii=False) + ";\n"
(SITE / "design/letters-layouts-2/letters-data.js").write_text(js, encoding="utf-8")
for key, g in out["groups"].items():
    print(f"{key}: {len(g['letters'])} letters, {len(g['timelines'])} timelines, {len(g['maps'])} maps, {len(g['networks'])} networks, "
          f"{len(g['parallels'])} side-by-sides, {len(g['ladders'])} ladders, {len(g['questions'])} questions, {len(g['canon'])} witnesses")
print(f"{len(js) // 1024} KB")
