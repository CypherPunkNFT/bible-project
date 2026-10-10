import json, collections
from kjv import SITE, verses_in, verse
from land import missing_from_atlas
import people_build
doc = json.loads((SITE / "design/tribes-directions/data/tribes.json").read_text(encoding="utf-8"))
T = {t["id"]: t for t in doc["tribes"]}
print("TOWNS")
owner = collections.defaultdict(list)
for tid, t in T.items():
    if tid in ("joseph", "levi"): continue
    towns = t["land"]["towns"]
    kinds = collections.Counter(x["kind"] for x in towns)
    low = [x["name"] for x in towns if x.get("lowConfidence")]
    settle = [x for x in towns if x["kind"] == "town" and x["type"] == "settlement"]
    tc = sum(c["n"] for c in t["land"]["textCounts"])
    print(f" {tid}: {len(towns)} places ({dict(kinds)}), low<0.3: {len(low)}, settlements in city-list verses: {len(settle)}, text's own count: {tc or '-'}")
    for x in towns:
        owner[x["placeId"]].append((tid, x["name"]))
print("SHARED placeIds across tribes:")
for pid, v in owner.items():
    ts = sorted({a for a, b in v})
    if len(ts) > 1: print("  ", v[0][1], ts)
print("MISSING (heuristic):", {k: [(w, v % 1000000) for w, v in vs] for k, vs in missing_from_atlas().items()})
people_build.build_people(); r = people_build.build_people.report
print("CONFLICTS", r["tag_conflicts"]); print("VARIANTS", r["variants"])
untagged = [(tid, p["name"], p["personId"]) for tid, t in T.items() if tid != "joseph" for p in t["people"]["named"] if p["how"] == "verse" and p.get("personId") and not (p.get("dataTag") or "").startswith("Tribe")]
print("VERSE-NAMED BUT NOT TRIBE-TAGGED", len(untagged), untagged)
print("TAGGED", {tid: (t["people"]["tagged"], t["people"]["taggedUncertain"]) for tid, t in T.items()})
