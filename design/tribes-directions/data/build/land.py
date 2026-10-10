"""Territory by script: Atlas places whose verses fall inside each tribe's allotment verses (Joshua 13-19),
plus cities of refuge (Joshua 20:7-8) and Levitical cities (Joshua 21:9-39)."""
import re
from kjv import ref, verses_in, verse, load_places, label

# Each segment: (reference, kind). kind: "border" = the text traces a border; "town" = the text lists cities;
# "note" = other verses inside the allotment (Caleb's portion, a town not taken, the Danite migration).
ALLOTMENT = {
    "reuben": [("JOS 13:15-23", "town")],
    "gad": [("JOS 13:24-28", "town")],
    "manasseh": [("JOS 13:29-31", "town"), ("JOS 17:1-6", "note"), ("JOS 17:7-10", "border"), ("JOS 17:11-13", "town")],
    "judah": [("JOS 15:1-12", "border"), ("JOS 15:13-19", "note"), ("JOS 15:20-62", "town"), ("JOS 15:63", "note")],
    "joseph": [("JOS 16:1-4", "border")],
    "ephraim": [("JOS 16:5-8", "border"), ("JOS 16:9-10", "note")],
    "benjamin": [("JOS 18:11-20", "border"), ("JOS 18:21-28", "town")],
    "simeon": [("JOS 19:1-9", "town")],
    "zebulun": [("JOS 19:10-14", "border"), ("JOS 19:15-16", "town")],
    "issachar": [("JOS 19:17-23", "town")],
    "asher": [("JOS 19:24-31", "town")],
    "naphtali": [("JOS 19:32-34", "border"), ("JOS 19:35-39", "town")],
    "dan": [("JOS 19:40-46", "town"), ("JOS 19:47-48", "note")],
}

# Joseph's page also shows both sons' land.
JOSEPH_INCLUDES = ["ephraim", "manasseh"]

# The verse each tribe's allotment section opens with (used for the page's "spans").
REFUGE = [  # (tribe, place name as KJV gives it, reference)
    ("naphtali", "Kedesh in Galilee", "JOS 20:7"),
    ("ephraim", "Shechem", "JOS 20:7"),
    ("judah", "Kirjath-arba, which is Hebron", "JOS 20:7"),
    ("reuben", "Bezer", "JOS 20:8"),
    ("gad", "Ramoth in Gilead", "JOS 20:8"),
    ("manasseh", "Golan in Bashan", "JOS 20:8"),
]

LEVITICAL = [  # (tribe(s), reference of the city list, Levite family, the count the text gives, reference of the count)
    (["judah", "simeon"], "JOS 21:9-16", "children of Aaron (Kohathites)", 9, "JOS 21:16"),
    (["benjamin"], "JOS 21:17-18", "children of Aaron (Kohathites)", 4, "JOS 21:18"),
    (["ephraim"], "JOS 21:20-22", "the rest of the Kohathites", 4, "JOS 21:22"),
    (["dan"], "JOS 21:23-24", "the rest of the Kohathites", 4, "JOS 21:24"),
    (["manasseh"], "JOS 21:25", "the rest of the Kohathites (west half of Manasseh)", 2, "JOS 21:25"),
    (["manasseh"], "JOS 21:27", "Gershonites (east half of Manasseh)", 2, "JOS 21:27"),
    (["issachar"], "JOS 21:28-29", "Gershonites", 4, "JOS 21:29"),
    (["asher"], "JOS 21:30-31", "Gershonites", 4, "JOS 21:31"),
    (["naphtali"], "JOS 21:32", "Gershonites", 3, "JOS 21:32"),
    (["zebulun"], "JOS 21:34-35", "Merarites", 4, "JOS 21:35"),
    (["reuben"], "JOS 21:36-37", "Merarites", 4, "JOS 21:37"),
    (["gad"], "JOS 21:38-39", "Merarites", 4, "JOS 21:39"),
]

# The counts the text itself gives for a tribe's cities.
TEXT_COUNTS = {
    "judah": [(29, "JOS 15:32", "the uttermost cities toward Edom"), (14, "JOS 15:36", "in the valley (first group)"),
              (16, "JOS 15:41", "second group"), (9, "JOS 15:44", "third group"), (11, "JOS 15:51", "in the mountains (first group)"),
              (9, "JOS 15:54", "second group"), (10, "JOS 15:57", "third group"), (6, "JOS 15:59", "fourth group"),
              (2, "JOS 15:60", "fifth group"), (6, "JOS 15:62", "in the wilderness")],
    "benjamin": [(12, "JOS 18:24", "first group"), (14, "JOS 18:28", "second group")],
    "simeon": [(13, "JOS 19:6", "first group"), (4, "JOS 19:7", "second group")],
    "zebulun": [(12, "JOS 19:15", "cities with their villages")],
    "issachar": [(16, "JOS 19:22", "cities with their villages")],
    "asher": [(22, "JOS 19:30", "cities with their villages")],
    "naphtali": [(19, "JOS 19:38", "fenced cities with their villages")],
}

LOW_CONFIDENCE = 0.3


def place_index():
    by_verse = {}
    for p in load_places():
        for v in p["verses"]:
            by_verse.setdefault(v, []).append(p)
    return by_verse


def towns_in(spans_kinds, by_verse):
    out, seen = [], set()
    for r, kind in spans_kinds:
        span = ref(r)
        for v in verses_in(span):
            for p in by_verse.get(v, []):
                if p["id"] in seen:
                    continue
                seen.add(p["id"])
                town = {"placeId": p["id"], "name": p["name"], "type": p["type"], "lon": p["lon"], "lat": p["lat"],
                        "confidence": p["confidence"], "span": [v, v], "kind": kind}
                if p["lon"] is None or p["lat"] is None:
                    town["noCoordinates"] = True
                if p["confidence"] is not None and p["confidence"] < LOW_CONFIDENCE:
                    town["lowConfidence"] = True
                out.append(town)
    return out


def build_land():
    by_verse = place_index()
    land = {}
    for tribe, segs in ALLOTMENT.items():
        land[tribe] = {
            "spans": [{"span": ref(r), "kind": k, "label": label(ref(r))} for r, k in segs],
            "towns": towns_in(segs, by_verse),
            "textCounts": [{"n": n, "span": ref(r), "what": w} for n, r, w in TEXT_COUNTS.get(tribe, [])],
            "refuge": [],
            "levitical": [],
        }
    land["levi"] = {"spans": [{"span": ref(r), "kind": "none", "label": label(ref(r))} for r in ("JOS 13:14", "JOS 13:33", "JOS 18:7")],
                    "towns": [], "textCounts": [], "refuge": [], "levitical": [],
                    "note": "Levi received no territory: “the LORD God of Israel was their inheritance” (Joshua 13:33). "
                            "Its share was forty-eight cities with their suburbs inside the other tribes (Joshua 21:41)."}
    # Joseph: the joint border plus both sons' land.
    for t in JOSEPH_INCLUDES:
        land["joseph"]["spans"] += land[t]["spans"]
    seen = {x["placeId"] for x in land["joseph"]["towns"]}
    for t in JOSEPH_INCLUDES:
        for town in land[t]["towns"]:
            if town["placeId"] not in seen:
                land["joseph"]["towns"].append(dict(town, via=t))
                seen.add(town["placeId"])
    # Refuge: match the KJV name to an Atlas place named in that verse.
    for tribe, name, r in REFUGE:
        span = ref(r)
        keys = [similar_key(k.split(" in ")[0]) for k in name.replace("which is ", "").split(", ")]
        cands = [p for p in by_verse.get(span[0], []) if any(similar(similar_key(p["name"]), k) for k in keys)]
        entry = {"name": name, "span": span}
        if cands:
            entry.update(placeId=cands[0]["id"], lon=cands[0]["lon"], lat=cands[0]["lat"], confidence=cands[0]["confidence"])
        land[tribe]["refuge"].append(entry)
    for tribes, r, family, n, nr in LEVITICAL:
        span = ref(r)
        cities = [{"placeId": p["id"], "name": p["name"], "lon": p["lon"], "lat": p["lat"], "confidence": p["confidence"],
                   "span": [v, v]}
                  for v in verses_in(span) for p in by_verse.get(v, [])]
        for t in tribes:
            land[t]["levitical"].append({"span": span, "family": family, "count": {"n": n, "span": ref(nr)},
                                         "sharedWith": [x for x in tribes if x != t], "cities": cities})
    for t in JOSEPH_INCLUDES:
        land["joseph"]["refuge"] += [dict(x, via=t) for x in land[t]["refuge"]]
        land["joseph"]["levitical"] += [dict(x, via=t) for x in land[t]["levitical"]]
    # Levi: every Levitical city, by tribe.
    land["levi"]["levitical"] = [{"from": tribes, "span": ref(r), "family": family, "count": {"n": n, "span": ref(nr)}}
                                 for tribes, r, family, n, nr in LEVITICAL]
    land["levi"]["total"] = {"n": 48, "span": ref("JOS 21:41")}
    return land


CAPS_STOP = {"And", "The", "LORD", "God", "Israel", "Jordan", "This", "These", "Now", "Then", "Of", "Out", "For", "Thus",
             "Moses", "Joshua", "Caleb", "Nun", "Jephunneh", "But", "As", "So", "Yet", "Which", "Who", "Give", "What", "All",
             "When", "From", "Unto", "In", "Southward", "Kenaz", "Othniel", "Achsah", "Anak", "Sheshai", "Ahiman",
             "Talmai", "Machir", "Gilead", "Zelophehad", "Hepher", "Manasseh", "Ephraim", "Joseph", "Judah", "Benjamin",
             "Simeon", "Zebulun", "Issachar", "Asher", "Naphtali", "Dan", "Reuben", "Gad", "Levi", "Levites", "Eleazar",
             "Mahlah", "Noah", "Hoglah", "Milcah", "Tirzah", "Abiezer", "Helek", "Asriel", "Shemida",
             "Sihon", "Og", "Amorites", "Midian", "Evi", "Rekem", "Zur", "Hur", "Reba", "Balaam", "Beor", "Jebusites",
             "Jebusite", "Canaanites", "Ammon", "Geshurites", "Maachathites", "Edom", "Arba", "Ephron", "Reubenites",
             "Gadites", "Ephraimites", "Leshem", "Zidon"}


def missing_from_atlas():
    """Capitalised names in allotment verses that no Atlas place covers in that verse (heuristic, for review)."""
    by_verse = place_index()
    out = {}
    for tribe, segs in ALLOTMENT.items():
        for r, kind in segs:
            for v in verses_in(ref(r)):
                names = {p["name"].lower() for p in by_verse.get(v, [])}
                words = re.findall(r"[A-Z][a-z]+(?:-[a-z]+)*", verse(v))
                for w in words:
                    if w in CAPS_STOP:
                        continue
                    if not any(similar(similar_key(w), similar_key(n)) for n in names):
                        out.setdefault(tribe, []).append((w, v))
    return out


def similar_key(name):
    s = name.lower().replace("kirjath", "kiriath").replace("-", "").replace(" ", "")
    return s


def similar(a, b):
    import difflib
    return a == b or a in b or b in a or difflib.SequenceMatcher(None, a, b).ratio() >= 0.75
