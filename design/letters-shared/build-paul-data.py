"""Build design/letters-shared/paul-data.js from the site's own data, for the Paul's letters pages of the layouts.

Run from anywhere: python design/letters-shared/build-paul-data.py
"""
import glob
import json
import math
from pathlib import Path

SITE = Path(__file__).resolve().parents[2]
catalog = json.loads((SITE / "data/catalog.json").read_text(encoding="utf-8"))
BOOKS = {b["num"]: b for b in catalog["books"]}
atlas = json.loads((SITE / "src/data/atlas-map.json").read_text(encoding="utf-8"))
places = {p["id"]: p for p in json.loads((SITE / "data/places.json").read_text(encoding="utf-8"))}
paul = json.loads((SITE / "src/data/letters/paul-letters.json").read_text(encoding="utf-8"))


def project(lon, lat):
    """d3 geoMercator with the atlas's scale and translate, so places sit where the Atlas puts them."""
    s, (tx, ty) = atlas["scale"], atlas["translate"]
    return round(s * math.radians(lon) + tx, 2), round(ty - s * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)), 2)


def split(vid):
    return vid // 1_000_000, vid // 1000 % 1000, vid % 1000


def label(span):
    """"Romans 1:16–17" style label for a verse span."""
    (b, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    name = BOOKS[b]["name"]
    if c1 == c2:
        return f"{name} {c1}:{v1}" + (f"–{v2}" if v2 != v1 else "")
    return f"{name} {c1}:{v1}–{c2}:{v2}"


chapters = {}


def chapter(code, c):
    if (code, c) not in chapters:
        for f in glob.glob(str(SITE / f"data/text/kjv/{code}/*.json")):
            for key, ch in json.loads(Path(f).read_text(encoding="utf-8")).items():
                chapters[(code, int(key))] = ch
        chapters.setdefault((code, c), None)
    if chapters[(code, c)] is None:
        raise KeyError(f"no KJV chapter {code} {c}")
    return chapters[(code, c)]


def text(span):
    """The KJV words of a verse span (Strong's tags dropped)."""
    (b, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    words = []
    for c in range(c1, c2 + 1):
        for verse in chapter(BOOKS[b]["code"], c)["v"]:
            n = int(verse["n"])
            if (c > c1 or n >= v1) and (c < c2 or n <= v2):
                words.append("".join(r if isinstance(r, str) else r[0] if isinstance(r, list) else "" for r in verse["r"]))
    return " ".join(w.strip() for w in words).replace("  ", " ")


def chapter_lengths(code):
    out, c = [], 1
    while True:
        try:
            out.append(max(int(v["n"]) for v in chapter(code, c)["v"]))
        except KeyError:
            return out
        c += 1


def verse_count(span, lengths):
    (_, c1, v1), (_, c2, v2) = split(span[0]), split(span[1])
    return sum(lengths[c - 1] for c in range(c1, c2)) - v1 + 1 + v2


refs = lambda spans: [label(s) for s in spans or []]

maps = {}
for m in paul["maps"]:
    if m["id"] in ("journey-1", "journey-2", "journey-3", "voyage-rome", "letter-destinations"):
        pts = [[s["name"], *project(places[s["placeId"]]["lon"], places[s["placeId"]]["lat"])] for s in m["stops"] if s.get("placeId") in places]
        maps[m["id"]] = {"title": m["title"], "years": m.get("years"), "route": bool(m.get("route")), "pts": pts}

letters = []
for letter in paul["letters"]:
    code = BOOKS[split(letter["outline"][0]["span"][0])[0]]["code"]
    lengths = chapter_lengths(code)
    letters.append({
        "code": letter["code"], "name": letter["name"], "verses": letter["verses"], "greekWords": letter["greekWords"],
        "facts": {k: letter[k]["text"] for k in ("author", "recipients", "writtenFrom", "date", "occasion")},
        "themes": [t["text"] for t in letter["themes"]],
        "keyVerses": [{"ref": label(k["span"]), "why": k["why"], "text": text(k["span"])} for k in letter["keyVerses"]],
        "outline": [{"title": o["title"], "ref": label(o["span"]), "kind": o.get("kind"), "verses": verse_count(o["span"], lengths)} for o in letter["outline"]],
        "words": [{k: w.get(k) for k in ("greek", "translit", "strongs", "gloss", "count", "note")} for w in letter["words"]],
        "otQuotes": [{"at": label(q["at"]), "from": label(q["from"]), "note": q.get("note", "")} for q in letter["otQuotes"]],
    })

timelines = {t["id"]: t for t in paul["timelines"]}
networks = {n["id"]: n for n in paul["networks"]}
event = lambda e: {"label": e["label"], "from": e["from"], "to": e.get("to"), "kind": e.get("kind"), "letter": e.get("letter"), "refs": refs(e.get("refs"))}
network = lambda n: {"title": n["title"], "claim": n["claim"]["text"],
                     "nodes": [{"id": x["id"], "label": x["label"], "group": x.get("group"), "note": x.get("note", ""), "refs": refs(x.get("refs"))} for x in n["nodes"]],
                     "edges": [{"from": e["from"], "to": e["to"], "label": e.get("label", "")} for e in n["edges"]]}

par = next(p for p in paul["parallels"] if p["id"] == "ephesians-colossians")
ephcol = {"claim": par["claim"]["text"], "eph": chapter_lengths("EPH"), "col": chapter_lengths("COL"),
          "pairs": [{"left": label(p["left"]), "right": label(p["right"]), "l": [split(x)[1:] for x in p["left"]], "r": [split(x)[1:] for x in p["right"]],
                     "note": p.get("note", ""), "kind": p.get("kind", ""), "weight": p.get("weight", 0), "lt": text(p["left"]), "rt": text(p["right"])} for p in par["pairs"]]}

data = {
    "land": atlas["land"], "maps": maps, "letters": letters, "ephcol": ephcol,
    "life": {"title": timelines["pauls-life"]["title"], "claim": timelines["pauls-life"]["claim"]["text"], "events": [event(e) for e in timelines["pauls-life"]["events"]]},
    "onesimus": {"title": timelines["onesimus"]["title"], "claim": timelines["onesimus"]["claim"]["text"], "events": [event(e) for e in timelines["onesimus"]["events"]]},
    "companions": network(networks["companions"]), "romans16": network(networks["romans-16"]),
    "questions": [{"question": q["question"], "letters": q.get("letters", []), "views": [{"label": v["label"], "holders": v.get("holders", ""), "argument": v["argument"]["text"]} for v in q["views"]]} for q in paul["questions"]],
    "canon": [{"year": c["year"], "label": c["label"], "who": c["who"], "status": c["status"], "claim": c["claim"]["text"]} for c in paul["canon"]],
}
js = "// Generated from the site's data by design/letters-shared/build-paul-data.py. Do not edit by hand.\n"
js += "window.PAUL = " + json.dumps(data, ensure_ascii=False) + ";\n"
(SITE / "design/letters-shared/paul-data.js").write_text(js, encoding="utf-8")
print(f"{len(letters)} letters, {len(data['life']['events'])} life events, {len(data['onesimus']['events'])} Onesimus steps, "
      f"{len(data['companions']['nodes'])} companions, {len(data['romans16']['nodes'])} Romans 16 names, {len(data['questions'])} questions, "
      f"{len(data['canon'])} witnesses, {len(ephcol['pairs'])} Eph/Col pairs; {len(js) // 1024} KB")
