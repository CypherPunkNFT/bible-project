"""Builds js/data-paul.js (run: python design/journeys-directions/build-paul-data.py) from the site's own data (paul-letters.json + places.json),
mirroring src/pages/places/paul-journey.ts. Nothing is added; it only selects and reshapes."""
import json
import pathlib

SITE = pathlib.Path(__file__).resolve().parents[2]  # Website/
OUT = SITE / "design/journeys-directions/js/data-paul.js"

group = json.loads((SITE / "src/data/letters/paul-letters.json").read_text(encoding="utf-8"))
places = {p["id"]: p for p in json.loads((SITE / "data/places.json").read_text(encoding="utf-8"))}
catalog = json.loads((SITE / "data/catalog.json").read_text(encoding="utf-8"))
books = {}
for b in catalog["books"] if isinstance(catalog, dict) and "books" in catalog else catalog:
    books[b.get("num") or b.get("id")] = b.get("name") or b.get("title")

PLACE = {"jerusalem": "a15257a", "damascus": "a69c1d4", "arabia": "a0f4ea8", "tarsus": "a666ea0",
         "antioch": "ae41ab4", "caesarea": "a58735e", "rome": "afc8e7a"}
EARLY = [("At the stoning of Stephen", "jerusalem", "Jerusalem"), ("Conversion on the road to Damascus", "damascus", "Damascus"),
         ("Into Arabia", "arabia", "Arabia"), ("Escape from Damascus", "damascus", "Damascus"),
         ("First visit to Jerusalem", "jerusalem", "Jerusalem"), ("Sent to Tarsus", "tarsus", "Tarsus"),
         ("Barnabas brings him to Antioch", "antioch", "Antioch in Syria"), ("Famine-relief visit to Jerusalem", "jerusalem", "Jerusalem")]
ARREST = [("Arrested in the temple", "jerusalem", "Jerusalem"), ("Two years held at Caesarea", "caesarea", "Caesarea")]
ROME = [("Two years under guard in Rome", "rome", "Rome"), ("Released; further travels", "rome", "Further travels"),
        ("Second Roman imprisonment and death", "rome", "Rome")]


def ref_text(span):
    """[44013001, 44013004] -> 'Acts 13:1-4' (book number from the first two digits)."""
    a, b = span
    book = books.get(a // 1000000, str(a // 1000000))
    ca, va, cb, vb = a // 1000 % 1000, a % 1000, b // 1000 % 1000, b % 1000
    if a == b:
        return f"{book} {ca}:{va}"
    if ca == cb:
        return f"{book} {ca}:{va}\u2013{vb}"
    return f"{book} {ca}:{va}\u2013{cb}:{vb}"


def where(place_id):
    p = places[place_id]
    return [round(p["lon"], 3), round(p["lat"], 3)]


import re
CITES = {c["id"]: c for c in group["citations"]}


def cite_text(cid):
    c = CITES[cid]
    strip = lambda t: re.sub(r"\s*\(.*\)$", "", t)
    return f"{strip(c['author'])}, {strip(c['title'])} ({c['year']})"


def from_timeline(events, steps):
    out = []
    for start, key, name in steps:
        event = next(e for e in events if e["label"].startswith(start))
        cites = event.get("cites") or []
        out.append({"name": name, "at": where(PLACE[key]), "note": event["label"], "refs": [ref_text(r) for r in event.get("refs") or []],
                    "layer": "tradition" if cites else "scripture", "cites": [cite_text(c) for c in cites]})
    return out


def span_years(events, steps):
    chosen = [e for e in events if any(e["label"].startswith(s[0]) for s in steps)]
    return [min(e["from"] for e in chosen), max(e.get("to") or e["from"] for e in chosen)]


def from_map(map_id):
    m = next(x for x in group["maps"] if x["id"] == map_id)
    return {"id": m["id"], "title": m["title"], "years": m.get("years"), "route": bool(m.get("route")), "summary": m["claim"]["text"],
            "stops": [{"name": s["name"], "at": where(s["placeId"]), "note": s.get("note"), "refs": [ref_text(r) for r in s.get("refs") or []],
                       "layer": "scripture" if s.get("refs") else "proposed"} for s in m["stops"]]}


events = next(t for t in group["timelines"] if t["id"] == "pauls-life")["events"]
chapters = [
    {"id": "early-years", "title": "Damascus to Antioch", "years": span_years(events, EARLY), "route": True, "stops": from_timeline(events, EARLY),
     "summary": "From persecutor to apostle. Acts and Paul's own account in Galatians place him in Jerusalem, on the Damascus road, in Arabia, at Tarsus and at Antioch before the first journey."},
    from_map("journey-1"), from_map("journey-2"), from_map("journey-3"),
    {"id": "arrest", "title": "Arrest and Caesarea", "years": span_years(events, ARREST), "route": True, "stops": from_timeline(events, ARREST),
     "summary": "Arrested in the temple at Jerusalem, Paul is held for two years at Caesarea and appeals to Caesar (Acts 21\u201326)."},
    from_map("voyage-rome"),
    {"id": "rome", "title": "Rome, and after Acts", "years": span_years(events, ROME), "route": False, "stops": from_timeline(events, ROME),
     "summary": "Acts ends with Paul two years under guard in Rome. What followed is not told in Scripture: later writers tell of his release, further travels and death in Rome. Those steps are marked as tradition, with their sources."},
]
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("// Paul's journey, generated from paul-letters.json and places.json (the site's own data). Do not edit by hand.\n"
               f"window.PAUL_CHAPTERS = {json.dumps(chapters, ensure_ascii=False, indent=1)};\n", encoding="utf-8")
print("wrote", OUT, sum(len(c["stops"]) for c in chapters), "stops")
for c in chapters:
    print(c["title"], c["years"], [s["name"] for s in c["stops"]])
