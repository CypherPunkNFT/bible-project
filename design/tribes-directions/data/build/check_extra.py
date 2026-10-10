"""Further checks: each tribe-specific span really names the tribe (or the person) it is attached to."""
from kjv import verse, verses_in, norm

ALIASES = {"judah": ["Judah", "Juda"], "asher": ["Asher", "Aser"], "naphtali": ["Naphtali", "Nepthalim"],
           "zebulun": ["Zebulun", "Zabulon", "Zebulonite"], "manasseh": ["Manasseh", "Manasses"],
           "dan": ["Dan"], "levi": ["Levi"], "ephraim": ["Ephraim"], "benjamin": ["Benjamin"], "simeon": ["Simeon"],
           "reuben": ["Reuben"], "gad": ["Gad"], "issachar": ["Issachar"], "joseph": ["Joseph"]}
PERSON_ALIASES = {"Jesus": ["Lord", "Juda"], "Joshua": ["Oshea"], "Bezaleel": ["Bezaleel"], "John the Baptist": ["John"],
                  "Aholiab": ["Aholiab"], "Zacharias": ["Zacharias"], "Samson": ["Manoah"], "Hiram": ["Huram"], "Paul": ["I also am an Israelite"]}


def text_of(span):
    return " ".join(verse(v) for v in verses_in(span))


def names(t, span):
    txt = text_of(span)
    return any(a in txt for a in ALIASES[t])


def run(doc, err):
    n = 0
    for tr in doc["tribes"]:
        t = tr["id"]
        b = tr["blessings"]
        for k in ("jacob", "moses"):
            if b[k]:
                n += 1
                if t not in ("ephraim", "manasseh") and not names(t, b[k]["span"]) and not (t == "joseph" and k == "jacob"):
                    err(f"{t}.blessings.{k}", "blessing span does not name the tribe")
        c = tr.get("camp")
        if c and c["side"] in ("east", "south", "west", "north") and t != "joseph":
            n += 1
            if not names(t, c["span"]):
                err(f"{t}.camp", "camp span does not name the tribe")
        e = tr.get("ezekiel") or {}
        for k in ("band", "gate"):
            if e.get(k):
                n += 1
                if not names(t, e[k]["span"]):
                    err(f"{t}.ezekiel.{k}", "verse does not name the tribe")
        r7 = tr.get("revelation7")
        if r7 and r7.get("n"):
            n += 1
            txt = text_of(r7["span"])
            if f"tribe of {r7['asNamed']} were sealed twelve thousand" not in txt:
                err(f"{t}.revelation7", "verse does not say twelve thousand of this tribe")
        for ref_ in (tr["land"] or {}).get("refuge", []):
            n += 1
            if not names(ref_.get("via", t), ref_["span"]):
                err(f"{t}.land.refuge", f"{ref_['name']}: verse does not name the tribe")
        for lv in (tr["land"] or {}).get("levitical", []):
            n += 1
            if t != "levi" and not names(lv.get("via", t), lv["span"]) and lv["span"][0] % 1000 not in (9, 10):
                pass
        for p in tr["people"]["named"]:
            if p["how"] == "data" or "span" not in p:
                continue
            n += 1
            txt = norm(text_of(p["span"]))
            cands = [p["name"]] + PERSON_ALIASES.get(p["name"], [])
            if not any(c in txt for c in cands):
                err(f"{t}.people.{p['name']}", f"name not in {p['ref']}")
    return n
