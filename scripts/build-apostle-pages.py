#!/usr/bin/env python3
"""Build src/data/apostle-pages/: the view data for the apostle pages (/people/:id/mission) of the Twelve, Matthias and
Paul, one small file per apostle, loaded only when that page opens (src/components/apostle-page/data.ts).

    py -3.12 scripts/build-apostle-pages.py          # writes the files (the site build runs it with the people pages)
    py -3.12 scripts/build-apostle-pages.py --check  # exit 1 if any file is out of date or any check fails

Nothing is written by hand. It reads the reviewed apostle records (src/data/people-pages/apostles-1.json and
apostles-2.json), how each is presented (content/people/apostle-pages.json: titles, chapters, the landing's line), the
person files (data/study/people/, whose refs are the verses that name each person), the harmony, the places, the
Atlas's own land projection (src/data/atlas-map.json), the church and Letters questions, and the KJV. Who was with him
is not curated: a companion is "with" a record when a verse naming the companion (from that person's own file) falls
inside the record's passages. Every line quoted on the landing is checked against its KJV verse word for word, and the
build fails on any mismatch or any missing record. Ported from the approved mock-up's build
(design/apostle-merged/build/extract.cjs); parts are in scripts/bible/apostle_parts.py.

data/ (the KJV, places, study) is generated and git-ignored; the output is committed, so when data/ is missing the
files are left as they are.
"""
import json
import math
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SITE / "scripts"))
from bible.apostle_parts import Kjv, build_accounts, build_questions, read  # noqa: E402

OUT = SITE / "src" / "data" / "apostle-pages"
SPEC = SITE / "content" / "people" / "apostle-pages.json"
SHORT = {"jamesz": "James", "johnz": "John", "jamesa": "James", "simonz": "Simon", "iscariot": "Judas"}
EPITHET = {"jamesz": "son of Zebedee", "johnz": "son of Zebedee", "jamesa": "son of Alphaeus", "simonz": "the Zealot", "iscariot": "Iscariot"}
DEFAULT_PERIODS = [
    {"n": "I", "title": "Before the call", "sub": "Home, trade and family"}, {"n": "II", "title": "With Jesus", "sub": "The Gospels, in the harmony’s order"},
    {"n": "III", "title": "The church in Acts", "sub": "Acts and the letters"}, {"n": "IV", "title": "After Scripture", "sub": "Tradition, by who said it and when"},
]
JERUSALEM = "a15257a"
DIRECTIONS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]


def js_round(x: float) -> int:
    return math.floor(x + 0.5)


def fixed(x: float, digits: int = 2):
    """JavaScript's +x.toFixed(2): a number, written without ".0" when whole."""
    v = float(f"{x:.{digits}f}")
    return int(v) if v.is_integer() else v


def in_any(v: int, refs: list) -> bool:
    return any(r[0] <= v <= (r[1] if len(r) > 1 else r[0]) for r in refs)


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("’", "'").replace("‘", "'").replace("æ", "ae")).strip().lower()


class Verses:
    """Every verse a page quotes, by id; failures are collected, never raised."""

    def __init__(self, kjv: Kjv, fail):
        self.kjv, self.fail, self.all = kjv, fail, {}

    def add(self, vid: int):
        if vid not in self.all:
            try:
                self.all[vid] = self.kjv.verse(vid)
            except (OSError, ValueError, KeyError) as error:
                self.fail(f"verse {vid}: {error}")
        return self.all.get(vid)

    def add_span(self, ref, cap: int = 12) -> None:
        try:
            for vid, text in self.kjv.span(ref)[:cap]:
                self.all[vid] = text
        except (OSError, ValueError, KeyError) as error:
            self.fail(f"span {ref}: {error}")


class Context:
    """The shared look-ups: spec, harmony order, places, the Atlas projection, person refs."""

    def __init__(self, fail):
        self.fail = fail
        self.spec = json.loads(SPEC.read_text(encoding="utf-8"))
        self.people = self.spec["people"]
        self.twelve = self.spec["order"][:12]
        self.kjv = Kjv()
        self.places = {p["id"]: p for p in read("data/places.json")}
        self.atlas = read("src/data/atlas-map.json")
        harmony = read("data/study/harmony.json")
        self.sections = [{"n": s["n"], "title": s["title"]} for part in harmony["parts"] for s in part["sections"]]
        self.ord_of = {str(s["n"]): i for i, s in enumerate(self.sections)}
        self.refs_cache: dict[str, list[int]] = {}
        self.icon_rules = [(re.compile(src, re.I | re.ASCII), name) for src, name in self.spec["iconRules"]]

    def refs_of(self, key: str) -> list[int]:
        if key not in self.refs_cache:
            try:
                self.refs_cache[key] = read(f"data/study/people/{self.people[key][0]}.json").get("refs") or []
            except (OSError, ValueError) as error:
                self.fail(f"person {key}: {error}")
                self.refs_cache[key] = []
        return self.refs_cache[key]

    def icon_for(self, title: str) -> str:
        return next((name for rule, name in self.icon_rules if rule.search(title or "")), "eye")

    def ll(self, place_id):
        p = self.places.get(place_id)
        return [p["lon"], p["lat"]] if p and isinstance(p.get("lon"), (int, float)) and math.isfinite(p["lon"]) else None

    def project(self, lon_lat):
        """The Atlas's Mercator (d3 geoMercator with the scale and translate atlas-map.json was drawn with)."""
        r, (lon, lat), a = math.pi / 180, lon_lat, self.atlas
        return [fixed(a["scale"] * lon * r + a["translate"][0]), fixed(a["translate"][1] - a["scale"] * math.log(math.tan(math.pi / 4 + (lat * r) / 2)))]

    def from_jerusalem(self, p):
        jer, rad, radius = self.ll(JERUSALEM), math.pi / 180, 6371
        d_lat, d_lon = (p[1] - jer[1]) * rad, (p[0] - jer[0]) * rad
        h = math.sin(d_lat / 2) ** 2 + math.cos(jer[1] * rad) * math.cos(p[1] * rad) * math.sin(d_lon / 2) ** 2
        y = math.sin(d_lon) * math.cos(p[1] * rad)
        x = math.cos(jer[1] * rad) * math.sin(p[1] * rad) - math.sin(jer[1] * rad) * math.cos(p[1] * rad) * math.cos(d_lon)
        bearing = (math.atan2(y, x) / rad + 360) % 360
        return {"km": js_round((2 * radius * math.asin(math.sqrt(h))) / 5) * 5, "dir": DIRECTIONS[js_round(bearing / 45) % 8]}


def records(ctx: Context, key: str, a: dict, spec: dict) -> list[dict]:
    """His records in story order: facts, moments (in the harmony's order), Acts and the letters, tradition."""
    fail, entries = ctx.fail, []
    paths = (["home"] if a.get("home") else []) + (["trade"] if a.get("trade") else []) + [f"family.{i}" for i in range(len(a["family"]))]
    for path in paths:
        c, title = (a["family"][int(path.split(".")[1])] if path.startswith("family.") else a[path]), spec["facts"].get(path)
        if not title:
            fail(f"{key}: no title for fact {path}")
            continue
        entries.append(clean({"key": f"fact.{path}", "type": "fact", "title": title, "text": c.get("text"), "layer": c.get("layer"), "refs": c.get("refs") or [], "cites": c.get("cites") or []}))
    for i, m in enumerate(a["moments"]):
        e = {"key": f"m{i}", "type": "moment", "title": m["label"], "refs": m["refs"], "layer": "scripture"}
        if m.get("harmony") is not None:
            o = ctx.ord_of.get(str(m["harmony"]))
            if o is None:
                fail(f"{key} m{i}: harmony {m['harmony']} not found")
            else:
                e["h"] = {"ord": o, "n": m["harmony"], "title": ctx.sections[o]["title"]}
        entries.append(e)
    if len(spec["acts"]) != len(a["acts"]):
        fail(f"{key}: {len(spec['acts'])} act titles for {len(a['acts'])} acts")
    for i, c in enumerate(a["acts"]):
        entries.append(clean({"key": f"a{i}", "type": "act", "title": spec["acts"][i] if i < len(spec["acts"]) else None, "text": c.get("text"), "layer": c.get("layer"), "refs": c.get("refs") or [], "cites": c.get("cites") or []}))
    for i, t in enumerate(a["ending"]["tradition"]):
        entries.append(clean({"key": f"t{i}", "type": "trad", "title": t["who"], "text": t.get("text"), "layer": t.get("layer"), "who": t["who"], "when": t["when"], "refs": [], "cites": t.get("cites") or []}))
    if spec.get("order"):
        by_key = {e["key"]: e for e in entries}
        ordered = [by_key[k] for k in spec["order"] if k in by_key]
        for k in spec["order"]:
            if k not in by_key:
                fail(f"{key}: order names unknown {k}")
        left = [e for e in entries if e["key"] not in spec["order"]]
        if any(e["type"] != "trad" for e in left):
            fail(f"{key}: order leaves out {[e['key'] for e in left if e['type'] != 'trad']}")
        return ordered + left
    moments = sorted((e for e in entries if e["type"] == "moment"), key=lambda e: e.get("h", {}).get("ord", 0))
    return [e for e in entries if e["type"] == "fact"] + moments + [e for e in entries if e["type"] == "act"] + [e for e in entries if e["type"] == "trad"]


def period_of(spec: dict, e: dict) -> int:
    rule = spec.get("periodOf")
    if rule:
        if e["type"] == "fact" or e["key"] in rule["1"]:
            return 1
        return 2 if e["key"] in rule["2"] else 4 if e["type"] == "trad" else 3
    return {"fact": 1, "moment": 2, "act": 3}.get(e["type"], 4)


def clean(d: dict) -> dict:
    """JSON.stringify drops undefined fields; the mock-up's data does too."""
    return {k: v for k, v in d.items() if v is not None}


def heat_of(ctx: Context, refs: list[int], verses: Verses) -> dict:
    """Verses that name him, per chapter, per book; the first verse of each chapter is kept to quote."""
    heat: dict = {}
    for v in refs:
        code, ch = ctx.kjv.code_of(v), str((v % 1_000_000) // 1000)
        book = heat.setdefault(code, {"name": ctx.kjv.name_of(v), "num": v // 1_000_000, "chapters": len(ctx.kjv.cat["books"][code]), "counts": {}, "first": {}})
        book["counts"][ch] = book["counts"].get(ch, 0) + 1
        if ch not in book["first"]:
            book["first"][ch] = v
            verses.add(v)
    return heat


def check_line(ctx: Context, key: str, verses: Verses, line) -> dict:
    vid, phrase = line
    text = verses.add(vid) or ""
    if norm(phrase) not in norm(text):
        ctx.fail(f'{key}: "{phrase}" is not in {vid}: "{text}"')
    return {"v": vid, "t": phrase}


def build_one(ctx: Context, key: str, a: dict, group: dict) -> dict:
    spec, pid, fail = ctx.spec["persons"][key], ctx.people[key][0], ctx.fail
    person, verses = read(f"data/study/people/{pid}.json"), Verses(ctx.kjv, fail)
    named = set(person.get("refs") or [])
    ordered = records(ctx, key, a, spec)
    gospel_acts = [k for k in ctx.twelve if k != key] + ["matthias", "paul"] + ctx.spec["gospelPool"] + ctx.spec["actsPool"]
    pool = [k for k in (ctx.spec["paulPool"] if spec.get("pool") == "paul" else gospel_acts) if k != key and k in ctx.people]
    for i, e in enumerate(ordered):
        e["i"], e["period"] = i, period_of(spec, e)
        e["icon"] = "tradition" if e["type"] == "trad" else "people" if e["type"] == "fact" else ctx.icon_for(e["title"])
        for r in e["refs"]:
            verses.add_span(r)
        # The first verse (passage by passage) that names him, else the start of the first passage.
        inside = [v for r in e["refs"] for v in sorted(x for x in verses.all if r[0] <= x <= (r[1] if len(r) > 1 else r[0]))]
        e["lead"] = next((v for v in inside if v in named), e["refs"][0][0] if e["refs"] else None)
        if e["lead"]:
            verses.add(e["lead"])
        e["places"] = [pi for pi, p in enumerate(a["places"]) if any(in_any(r[0], e["refs"]) for r in p.get("refs") or [])]
        e["with"] = {}
        if e.get("layer") != "text" and e["type"] != "trad":
            for k in pool:
                if k in (spec.get("notWith") or {}).get(e["key"], []):
                    continue
                hits = [v for v in ctx.refs_of(k) if in_any(v, e["refs"])][:3]
                if hits:
                    e["with"][k] = hits
                    for v in hits:
                        verses.add(v)
    rows = [{"key": k, "id": ctx.people[k][0], "name": ctx.people[k][1], "twelve": k in ctx.twelve or k == "matthias", "n": sum(1 for e in ordered if k in e["with"])} for k in pool]
    rows = [r for r in rows if r["n"] > 0]
    periods = [{**p, **((spec.get("periods") or {}).get(str(i + 1)) or {}), "entries": [e["key"] for e in ordered if e["period"] == i + 1]} for i, p in enumerate(DEFAULT_PERIODS)]

    heat = heat_of(ctx, person.get("refs") or [], verses)
    alt = []
    for other in a.get("personIds") or []:
        refs = read(f"data/study/people/{other}.json").get("refs") or []
        name = next((v[1] for v in ctx.people.values() if v[0] == other), other)
        alt.append({"id": other, "name": name, "heat": heat_of(ctx, refs, verses), "count": len(refs)})

    places = []
    for pi, p in enumerate(a["places"]):
        pos = ctx.ll(p["placeId"]) if p.get("placeId") else None
        for r in p.get("refs") or []:
            verses.add(r[0])
        kind = "tradition" if p.get("tradition") else ctx.spec["placeKind"].get(p.get("placeId") or "") or ("city" if pos else "unpinned")
        places.append({"name": p["name"], "placeId": p.get("placeId"), "refs": p.get("refs") or [], "note": p.get("note"), "tradition": bool(p.get("tradition")), "ll": pos,
                       "xy": ctx.project(pos) if pos else None, "kind": kind, "from": ctx.from_jerusalem(pos) if pos and p.get("placeId") != JERUSALEM else None,
                       "entries": [e["key"] for e in ordered if pi in e["places"]]})

    accounts = build_accounts(a, key, spec, ordered, ctx.kjv, fail)
    landing_spec = spec["landing"]
    landing = {"art": landing_spec["art"], "line": check_line(ctx, key, verses, landing_spec["line"]),
               "also": check_line(ctx, key, verses, landing_spec["also"]) if landing_spec.get("also") else None, "note": landing_spec.get("note")}
    by_key = {e["key"]: e for e in ordered}
    chapters = []
    for ci, ch in enumerate(spec["chapters"]):
        slides = []
        for s in ch["slides"]:
            e = by_key.get(s["e"])
            if not e:
                fail(f"{key}: chapter slide names unknown {s['e']}")
                continue
            if s.get("v"):
                verses.add(s["v"])
                if e["refs"] and not in_any(s["v"], e["refs"]):
                    fail(f"{key}: slide verse {s['v']} is outside {s['e']}")
            slides.append({"entry": s["e"], "art": s["art"], "v": s.get("v") or e.get("lead")})
        chapters.append({"n": ["I", "II", "III"][ci], "period": ci + 1, "title": ch["title"], "slides": slides})
    for c in a["calling"]:
        verses.add_span(c["quote"]["span"])
    for l in a.get("lists") or []:
        verses.add(l["span"][0])
    for c in a["ending"]["scripture"]:
        for r in c.get("refs") or []:
            verses.add_span(r, 4)

    extra: dict = {}
    questions = build_questions(a, spec, ctx.spec["questionGroups"], fail, extra)
    used: set[str] = set()
    walk_cites(a, used)
    citations = [c for c in group["citations"] if c["id"] in used] + list(extra.values())
    return {
        "key": key, "id": pid, "name": a["name"], "short": SHORT.get(key, ctx.people[key][1]), "epithet": EPITHET.get(key), "names": spec["names"],
        "otherNames": a["otherNames"], "title": a["title"], "tagline": a["tagline"], "story": (person.get("story") or {}).get("short"), "verseCount": len(named),
        "alt": alt, "periods": periods, "entries": ordered, "rows": rows, "heat": heat, "accounts": accounts, "places": places, "lists": a.get("lists") or [],
        "companions": a["companions"], "ending": a["ending"], "questions": questions, "notSaid": a["notSaid"], "citations": citations, "landing": landing,
        "chapters": chapters, "verses": {str(k): v for k, v in sorted(verses.all.items())},
    }


def walk_cites(node, used: set[str]) -> None:
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "cites" and isinstance(v, list):
                used.update(v)
            walk_cites(v, used)
    elif isinstance(node, list):
        for v in node:
            walk_cites(v, used)


def build(problems: list[str]) -> dict[str, str]:
    ctx = Context(problems.append)
    groups = [read("src/data/people-pages/apostles-1.json"), read("src/data/people-pages/apostles-2.json")]
    found = {a["id"]: (a, g) for g in groups for a in g["apostles"]}
    files, index = {}, []
    for key in ctx.spec["order"]:
        pid = ctx.people[key][0]
        if pid not in found:
            problems.append(f"{key}: no apostle record {pid}")
            continue
        out = build_one(ctx, key, *found[pid])
        files[f"{pid}.json"] = json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n"
        index.append({"key": key, "id": pid, "name": ctx.people[key][1], "short": out["short"]})
    books = [[b["num"], b["code"], b["name"]] for b in sorted(ctx.kjv.books.values(), key=lambda b: b["num"])]
    files["books.json"] = json.dumps(books, ensure_ascii=False, separators=(",", ":")) + "\n"
    files["index.json"] = json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n"
    return files


def main() -> int:
    check = "--check" in sys.argv
    if not (SITE / "data" / "study" / "people").is_dir() or not (SITE / "data" / "text" / "kjv").is_dir():
        print(f"warning: data/study or data/text/kjv is missing (run scripts/build-data.py); {OUT.relative_to(SITE)} left as it is")
        return 0
    problems: list[str] = []
    files = build(problems)
    for problem in problems:
        print(f"error: {problem}")
    if problems:
        print(f"{len(problems)} problem(s): {OUT.relative_to(SITE)} not written")
        return 1
    if check:
        stale = [n for n, t in files.items() if not (OUT / n).exists() or (OUT / n).read_text(encoding="utf-8") != t]
        extra = sorted(f.name for f in OUT.glob("*.json") if f.name not in files) if OUT.is_dir() else []
        if stale or extra:
            print(f"{OUT.relative_to(SITE)} is out of date ({', '.join(stale + extra)}); run scripts/build-apostle-pages.py")
            return 1
        print(f"{OUT.relative_to(SITE)} is up to date; every landing line matches the KJV word for word")
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    changed = 0
    for name, text in files.items():
        target = OUT / name
        if not target.exists() or target.read_text(encoding="utf-8") != text:
            target.write_text(text, encoding="utf-8", newline="\n")
            changed += 1
    print(f"Wrote {OUT.relative_to(SITE)}: {len(files) - 2} apostles ({changed} file(s) changed); every landing line matches the KJV word for word")
    return 0


if __name__ == "__main__":
    sys.exit(main())
