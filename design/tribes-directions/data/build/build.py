"""Assemble Website/design/tribes-directions/data/tribes.json from core.py, lists.py, land.py and (when present)
narrative.py / people_build.py. Run check.py afterwards."""
import json
from datetime import date

import core
from kjv import ref, span_text, label, SITE
from land import build_land
from lists import LISTS

OUT = SITE / "design" / "tribes-directions" / "data" / "tribes.json"


def q(r, text=None):
    span = ref(r)
    return {"text": text if text is not None else span_text(span), "span": span, "ref": label(span)}


def son(t):
    pid, order, mother, mother_id, named_by, birth, words = core.SONS[t]
    return {"personId": pid, "order": order, "mother": {"name": mother, "personId": mother_id}, "namedBy": named_by,
            "birth": {"span": ref(birth), "ref": label(ref(birth))},
            "nameQuote": q(core.NAME_QUOTE_SPAN[t], words)}


def blessings(t):
    jr, mr = core.JACOB.get(t), core.MOSES.get(t)
    out = {"jacob": q(jr, core.BLESSING_TEXT.get(("jacob", t))) if jr else None,
           "moses": q(mr, core.BLESSING_TEXT.get(("moses", t))) if mr else None,
           "note": core.BLESSING_NOTES.get(t)}
    return out


def census(t):
    if t == "joseph":
        return {"first": None, "second": None, "note": core.CENSUS_NOTES["joseph"],
                "parts": {"ephraim": census("ephraim"), "manasseh": census("manasseh")}}
    if t not in core.CENSUS:
        return None
    (n1, r1), (n2, r2) = core.CENSUS[t]
    out = {"first": {"n": n1, "span": ref(r1), "ref": label(ref(r1))},
           "second": {"n": n2, "span": ref(r2), "ref": label(ref(r2))},
           "change": {"n": n2 - n1, "note": "Our own arithmetic: the second figure minus the first."},
           "note": core.CENSUS_NOTES.get(t)}
    if t == "levi":
        out["basis"] = "males from a month old and upward"
    else:
        out["basis"] = "men from twenty years old and upward, able to go to war"
    return out


def camp(t):
    if t in core.CAMP:
        side, pos, r = core.CAMP[t]
        return {"side": side, "position": pos, "standard": pos == 1, "span": ref(r), "ref": label(ref(r))}
    if t == "levi":
        return {"side": "centre", "position": None, "standard": False, "span": ref("NUM 2:17"), "ref": label(ref("NUM 2:17")),
                "note": "The Levites camp around the tabernacle in the midst of the four camps (Numbers 1:53; 2:17), clan by clan (Numbers 3:23–38)."}
    if t == "joseph":
        return {"side": "west", "position": None, "standard": False, "span": ref("NUM 2:18-21"), "ref": label(ref("NUM 2:18-21")),
                "note": "Joseph camps as two tribes on the west: Ephraim, whose standard it is, and Manasseh beside him (Numbers 2:18–21)."}
    return None


def person_named(name_ref):
    name, r = name_ref
    return {"name": name, "span": ref(r), "ref": label(ref(r))}


def prince(t):
    if t in core.PRINCES:
        out = person_named(core.PRINCES[t])
    elif t == "joseph":
        out = {"name": "Elishama the son of Ammihud (Ephraim); Gamaliel the son of Pedahzur (Manasseh)", "span": ref("NUM 1:10"),
               "ref": label(ref("NUM 1:10"))}
    else:
        out = {"name": None, "span": ref("NUM 1:47-49"), "ref": label(ref("NUM 1:47-49"))}
    out["note"] = core.PRINCE_NOTES.get(t)
    return out


def offering(t):
    if t not in core.OFFERING:
        return None
    day, r = core.OFFERING[t]
    return {"day": day, "dayWord": core.DAY_WORDS[day], "span": ref(r), "ref": label(ref(r))}


def spy(t):
    if t in core.SPIES:
        out = person_named(core.SPIES[t])
    elif t == "joseph":
        out = {"name": "Gaddi the son of Susi", "span": ref("NUM 13:11"), "ref": label(ref("NUM 13:11"))}
    else:
        out = {"name": None, "span": ref("NUM 13:4-15"), "ref": label(ref("NUM 13:4-15"))}
    out["note"] = core.SPY_NOTES.get(t)
    return out


def divider(t):
    return person_named(core.DIVIDERS[t]) if t in core.DIVIDERS else None


def build_lists():
    out = []
    for item in LISTS:
        order = []
        for t, r, as_named in item["cells"]:
            order.append(t)
        present = set(order)
        twelve = ["reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad", "asher", "issachar", "zebulun",
                  "joseph", "benjamin", "ephraim", "manasseh"]
        out.append({
            "id": item["id"], "label": item["label"], "span": ref(item["ref"]), "ref": label(ref(item["ref"])),
            "order": order,
            "cells": [{"tribe": t, "span": ref(r), "ref": label(ref(r)), "asNamed": a} for t, r, a in item["cells"]],
            "groups": [{"label": g, "tribes": ts} for g, ts in item.get("groups", [])],
            "absent": [t for t in twelve if t not in present],
            "doubled": sorted({t for t in order if order.count(t) > 1}),
            "notes": item["notes"],
        })
    return out


def camp_layout():
    return {
        "source": {"span": ref("NUM 2:1-34"), "ref": label(ref("NUM 2:1-34"))},
        "sides": [{"side": s, "standard": std, "tribes": [t for t, v in core.CAMP.items() if v[0] == s],
                   "total": {"n": n, "span": ref(r), "ref": label(ref(r))},
                   "marchRank": rank, "marchWords": q(r, words)}
                  for s, std, n, r, rank, words in core.CAMP_SIDES],
        "levites": [{"side": s, "who": who, **q(r, words)} for s, who, r, words in core.LEVITE_CAMP],
        "centre": q("NUM 2:17", "Then the tabernacle of the congregation shall set forward with the camp of the Levites in the midst of the camp"),
        "total": {"n": 603550, "span": ref("NUM 2:32"), "ref": label(ref("NUM 2:32"))},
        "note": "Numbers 2 gives the side and the order within each side; it gives no distances or shapes. Any drawing of the camp as a square is a convention.",
    }


def march_order():
    return {"span": ref("NUM 10:11-28"), "ref": label(ref("NUM 10:11-28")),
            "date": q("NUM 10:11", "on the twentieth day of the second month, in the second year"),
            "steps": [dict({k: v for k, v in s.items() if k != "span"}, span=ref(s["span"]), ref=label(ref(s["span"])))
                      for s in core.MARCH]}


def main():
    land = build_land()
    try:
        import narrative
    except ImportError:
        narrative = None
    try:
        import people_build
        people = people_build.build_people()
    except ImportError:
        people = {}
    tribes = []
    for t in core.TRIBE_IDS:
        entry = {
            "id": t, "name": core.NAMES[t],
            "son": son(t) if t in core.SONS else None,
            "blessings": blessings(t),
            "census": census(t),
            "camp": camp(t),
            "prince": prince(t),
            "offeringDay": offering(t),
            "spy": spy(t),
            "divider": divider(t),
            "land": land.get(t),
            "people": people.get(t, {"tagged": None, "named": []}),
        }
        if t in ("ephraim", "manasseh", "joseph"):
            entry["adoption"] = q(core.ADOPTION[0], core.ADOPTION[1])
        if narrative:
            entry.update(narrative.for_tribe(t))
        else:
            entry.update({"story": [], "fate": [], "nt": [], "ezekiel": None, "revelation7": None, "tradition": []})
        tribes.append(entry)
    doc = {
        "about": {"title": "The twelve tribes: data for the design mock-ups", "built": date.today().isoformat(),
                  "status": "Draft — checked by script", "text": "KJV (the site's text)",
                  "spans": "[first, last] verse ids: book × 1,000,000 + chapter × 1,000 + verse",
                  "layers": ["scripture", "text", "tradition", "scholars"],
                  "record": "Research/People/tribes-data.md"},
        "tribes": tribes,
        "lists": build_lists(),
        "campLayout": camp_layout(),
        "marchOrder": march_order(),
        "censusTotals": {k: {"n": n, "span": ref(r), "ref": label(ref(r))} for k, (n, r) in core.CENSUS_TOTALS.items()},
    }
    if narrative:
        doc.update(narrative.top_level())
    else:
        doc.update({"kingdom": None, "views": [], "sources": []})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
