"""Pieces of scripts/build-apostle-pages.py: KJV verse access for the build, "One moment, several accounts" and "What
readers still ask". Ported from the approved mock-up's build (design/apostle-merged/build/kjv.cjs, accounts.cjs,
questions.cjs); the output is compared with it field for field.
"""
import json
import math
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent.parent
A = re.ASCII  # JavaScript's \b and \w are ASCII-only; matching them keeps the groups the mock-up chose.


def read(rel: str):
    return json.loads((SITE / rel).read_text(encoding="utf-8"))


# ── KJV: plain verse text (the same rule as src/lib/data.ts plainWords) ──
class Kjv:
    def __init__(self):
        catalog = read("data/catalog.json")
        self.cat = next(t for t in catalog["translations"] if t.get("slug") == "kjv" or t.get("id") == "kjv")
        self.books = {b["num"]: b for b in catalog["books"]}
        self.files: dict[Path, dict] = {}

    def labels(self, code: str):
        tb = (self.cat.get("books") or {}).get(code) or (self.cat.get("chapters") or {}).get(code)
        if isinstance(tb, list):
            return [str(x) for x in tb]
        if isinstance(tb, dict) and isinstance(tb.get("chapters"), list):
            return [str(x) for x in tb["chapters"]]
        return None

    def chapter(self, code: str, ch: int) -> dict:
        labels = self.labels(code)
        idx = (labels.index(str(ch)) if str(ch) in labels else -1) if labels else ch - 1
        file = SITE / "data" / "text" / "kjv" / code / f"{math.floor(idx / 5)}.json"
        if file not in self.files:
            self.files[file] = json.loads(file.read_text(encoding="utf-8"))
        c = self.files[file].get(str(ch))
        if not c:
            raise ValueError(f"KJV {code} {ch}: not in {file}")
        return c

    def verse(self, vid: int) -> str:
        b, ch, v = vid // 1_000_000, (vid % 1_000_000) // 1000, vid % 1000
        c = self.chapter(self.books[b]["code"], ch)
        found = next((x for x in c["v"] if int(x["n"]) == v), None)
        if not found:
            raise ValueError(f"KJV {self.books[b]['code']} {ch}:{v} missing")
        parts = []
        for run in found["r"]:
            t = run if isinstance(run, str) else run[0] if isinstance(run, list) and run else ""
            if t:
                parts.append(t)
        return re.sub(r"\s+", " ", "".join(parts)).strip()

    def span(self, ref) -> list[tuple[int, str]]:
        a, b = ref[0], ref[1] if len(ref) > 1 else ref[0]
        book, c1, c2 = a // 1_000_000, (a % 1_000_000) // 1000, (b % 1_000_000) // 1000
        out = []
        for ch in range(c1, c2 + 1):
            for x in self.chapter(self.books[book]["code"], ch)["v"]:
                vid = book * 1_000_000 + ch * 1000 + int(x["n"])
                if a <= vid <= b:
                    out.append((vid, self.verse(vid)))
        return out

    def code_of(self, vid: int) -> str:
        return self.books[vid // 1_000_000]["code"]

    def name_of(self, vid: int) -> str:
        return self.books[vid // 1_000_000]["name"]


# ── One moment, several accounts: the calling when two or more books tell it, then the moments whose passages lie in
#    the most books, then (for the Twelve) the four lists. A spec may name its own choice. ──
LIST_SPAN = {"MAT": [40010002, 40010004], "MRK": [41003016, 41003019], "LUK": [42006014, 42006016], "ACT": [44001013, 44001013]}
ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"]
LIST_ONLY = re.compile(r"^(Mark 3|Luke 6|Acts 1)\b", A)
GENERIC = re.compile(r"^(Chosen as one of the Twelve|Sent out with the Twelve)", A)


def build_accounts(a: dict, key: str, spec: dict, ordered: list[dict], kjv: Kjv, fail) -> list[dict]:
    by_key = {e["key"]: e for e in ordered}
    books_of = lambda refs: {kjv.code_of(r[0]) for r in refs}
    cand = []
    if len(a["calling"]) >= 2 and any(not LIST_ONLY.search(c["label"]) for c in a["calling"]):
        cand.append("call")
    multi = sorted((e for e in ordered if e["type"] == "moment" and len(books_of(e["refs"])) >= 2), key=lambda e: (-len(books_of(e["refs"])), e["i"]))
    cand += [e["key"] for e in multi if not GENERIC.search(e["title"])]
    lists = len(a.get("lists") or []) >= 2
    pick = spec.get("accounts") or cand[: 3 if lists else 4] + (["lists"] if lists else [])
    if len(pick) < 2:
        pick = (pick + [e["key"] for e in multi if GENERIC.search(e["title"])])[:3]

    out = []
    for pid in pick:
        if pid == "call":
            title = "The call, told four times" if key == "paul" else "The call at the tax office" if key == "matthew" else "The call"
            cols = [{"label": c["label"], "spans": [c["quote"]["span"]]} for c in a["calling"]]
        elif pid == "lists":
            title = "One man, four lists"
            cols = [{"label": f"{kjv.name_of(l['span'][0])} {(l['span'][0] % 1_000_000) // 1000} · {ORD[l['position']]}", "spans": [LIST_SPAN[l["book"]]], "mark": l["span"][0]} for l in a["lists"]]
        else:
            e = by_key.get(pid)
            if not e:
                fail(f"{key}: account {pid} unknown")
                continue
            title, by_book = e["title"], {}
            for r in e["refs"]:
                by_book.setdefault(kjv.code_of(r[0]), []).append(r)
            cols = [{"label": kjv.name_of(rs[0][0]), "spans": rs} for rs in by_book.values()]
        done = []
        for c in cols:
            verses = []
            for r in c["spans"]:
                try:
                    verses += [{"id": vid, "text": text} for vid, text in kjv.span(r)[:12]]
                except (OSError, ValueError, KeyError) as error:
                    fail(f"{key} account {pid}: {error}")
            done.append({"label": c["label"], "spans": c["spans"], "mark": c.get("mark"), "book": c["spans"][0][0] // 1_000_000, "verses": verses})
        if len(done) < 2:
            fail(f"{key}: account {pid} has {len(done)} account")
            continue
        out.append({"id": pid, "title": title, "cols": done})
    return out


# ── What readers still ask: his own open questions, the identifications his page relies on, how his story ends
#    (Scripture beside tradition), the reviewed church and Letters questions that concern him, and what Scripture does
#    not say, each placed in one of four groups. Nothing is written here: every question and answer is reviewed text. ──
GROUPS = [
    {"id": "who", "title": "Who he was", "sub": "Names, family and identifications"},
    {"id": "happened", "title": "What happened", "sub": "Readings of the events"},
    {"id": "ended", "title": "How it ended", "sub": "Where he went and how he died"},
    {"id": "writings", "title": "The writings", "sub": "The books that bear his name"},
]
SILENT_WRITINGS = re.compile(r"\b(wrote|writer|letter|book|Gospel that bears|1 John|2 and 3 John)\b", re.I | A)
SILENT_ENDED = re.compile(r"\b(die|died|death|killed|buried|Rome|Spain|India|Armenia|Ephesus|where he went|went after|after Acts 1:13|after Pentecost|later life|how .*died)\b", re.I | A)
SILENT_WHO = re.compile(r"\b(name|names|named|brother|twin|wife|children|age|trade|home|family|epithet|Iscariot|came from|appearance|married|same man|“James the less”|son of|whose)\b", re.I | A)
VIEW_WRITINGS = re.compile(r"\b(wr(o|i)te|letter|Gospel|Revelation|Hebrews)\b", re.I | A)
VIEW_ENDED = re.compile(r"\b(die|death|Rome|preach|work after)\b", re.I | A)
PLAIN_Q = re.compile(r"\s*\((?:Most|In |Older|Earliest|Harmonising|Greek|Order|Scripture does not say|Acts gives|In date)[^)]*\)\.?\s*$", A)


def silent_group(text: str) -> str:
    if SILENT_WRITINGS.search(text):
        return "writings"
    if SILENT_ENDED.search(text):
        return "ended"
    return "who" if SILENT_WHO.search(text) else "happened"


def build_questions(a: dict, spec: dict, qgroup: dict, fail, cite_out: dict) -> dict:
    view_group = lambda q: qgroup.get(q["id"]) or ("writings" if VIEW_WRITINGS.search(q["question"]) else "ended" if VIEW_ENDED.search(q["question"]) else "happened")
    plain = lambda q: PLAIN_Q.sub("", q).strip()
    files: dict[str, dict] = {}
    out = []
    for q in a.get("questions") or []:
        out.append({"id": q["id"], "group": view_group(q), "q": plain(q["question"]), "full": q["question"], "kind": "views", "from": "This page", "views": q["views"]})
    titles, ids = spec.get("ids") or [], a.get("identifications") or []
    if len(titles) != len(ids):
        fail(f"{a['id']}: {len(titles)} identification titles for {len(ids)} identifications")
    for i, c in enumerate(ids):
        out.append({"id": f"id{i}", "group": "who", "q": titles[i] if i < len(titles) else f"Identification {i + 1}", "kind": "answer",
                    "from": "The identifications this page relies on", "views": [{"label": "What the page relies on", "holders": "", "argument": c}]})
    ending = [{"label": "Scripture", "holders": "", "argument": c} for c in (a.get("ending") or {}).get("scripture") or []]
    ending += [{"label": t["who"], "holders": t["when"], "argument": {k: v for k, v in (("text", t.get("text")), ("layer", t.get("layer")), ("cites", t.get("cites"))) if v is not None}}
               for t in (a.get("ending") or {}).get("tradition") or []]
    if ending:
        out.append({"id": "ending", "group": "ended", "q": "How did his story end?", "kind": "ending", "from": "How the story ends: Scripture beside tradition, never blended", "views": ending})
    for x in spec.get("extra") or []:
        path = f"src/data/people-pages/{x['file']}.json" if x["src"] == "church" else f"src/data/letters/{x['file']}.json"
        f = files.setdefault(path, read(path))
        if x["src"] == "church":
            person = next((p for p in f["apostles"] if p["id"] == x["person"]), None)
            q = next((y for y in (person or {}).get("questions") or [] if y["id"] == x["id"]), None)
        else:
            person, q = None, next((y for y in f["questions"] if y["id"] == x["id"]), None)
        if not q:
            fail(f"{a['id']}: question {x['file']}/{x.get('person', '')}/{x['id']} not found")
            continue
        prefix = f"{x['file']}:"
        views = [{**v, "argument": {**v["argument"], "layer": v["argument"].get("layer") or "letters", "cites": [prefix + c for c in v["argument"].get("cites") or []]}} for v in q["views"]]
        for v in views:
            for c in v["argument"]["cites"]:
                cite = next((y for y in f["citations"] if prefix + y["id"] == c), None)
                if cite:
                    cite_out[c] = {**cite, "id": c}
                else:
                    fail(f"{a['id']}: citation {c} not found")
        page = f"{person['name']}’s page" if person else f"the {f.get('title') or 'Letters'} page"
        group = (qgroup.get(q["id"]) or "writings") if x["src"] == "letters" else view_group(q)
        out.append({"id": f"{x['file']}-{x['id']}", "group": group, "q": plain(q["question"]), "full": q["question"], "kind": "views", "from": f"Asked on {page}", "views": views})
    for i, s in enumerate(a.get("notSaid") or []):
        out.append({"id": f"n{i}", "group": silent_group(s), "q": s, "kind": "silent", "from": "What Scripture does not say"})
    if len({q["id"] for q in out}) != len(out):
        fail(f"{a['id']}: duplicate question ids")
    return {"groups": [{**g, "n": sum(1 for q in out if q["group"] == g["id"])} for g in GROUPS], "items": out}
