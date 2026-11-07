"""The drawings beside the Learning to discern text, checked: each phrase in its verse, each label matched to the
text it stands for. Called by build-data.py, which passes in its word-matching helpers."""
from scripture_text import BuildError, ref_id
import study_lists as L


def part_list(study: dict, n: str) -> list:
    lists = [b for sub in next(p for p in study["parts"] if p["n"] == n)["subs"] for b in sub["blocks"] if b["k"] == "list"]
    if len(lists) != 1:
        raise BuildError(f"part {n} should hold one list, found {len(lists)}")
    return lists[0]["items"]


def check_drawn(builder, study: dict, text: str, words, phrase_in) -> dict:
    """Every drawing beside the text: each phrase in its verse, each label matched to the text it stands for."""
    plain = words(text)
    checks = []
    for c in L.CHECKS:
        if not phrase_in(c["from_text"], plain):
            raise BuildError(f"check {c['n']}: its question {c['from_text']!r} is not in content.md")
        checks.append({**c, "verses": [{"r": builder.require(r, p, f"check {c['n']}"), "t": p} for r, p in c["verses"]]})
    part, together = L.TOGETHER
    if not phrase_in(together, plain):
        raise BuildError(f"part {part} is drawn as two questions together, but content.md no longer says {together!r}")
    clauses = {"items": [{"r": builder.require(r, a, "1 John drawing"), "t": a, "then": builder.require(r, b, "1 John drawing") and b}
                         for r, a, b in L.CLAUSES],
               "ground": {"r": builder.require(*L.GROUND, "1 John drawing"), "t": L.GROUND[1]}}
    m = L.MESSENGERS
    messengers = {"who": [{"r": builder.require(r, p, "Galatians drawing"), "t": p, "gloss": g} for r, p, g in m["who"]],
                  "line": [{"r": builder.require(r, p, "Galatians drawing"), "t": p} for r, p in m["line"]],
                  "verdict": {"r": builder.require(*m["verdict"], "Galatians drawing"), "t": m["verdict"][1]}}
    steps = [builder.passage(label) for label, _ in L.WIDEN]
    for (small, _), (big, _) in zip(L.WIDEN, L.WIDEN[1:]):
        if builder.text_of(ref_id(small)).strip() not in builder.text_of(ref_id(big)):
            raise BuildError(f"Acts drawing: {big} does not hold {small}, so it is not a wider view of it")
    widen = {"steps": [{"r": k, "t": t} for k, (_, t) in zip(steps, L.WIDEN)], "focus": steps[0],
             "halves": [{"r": builder.require(r, p, "Acts drawing"), "t": p, "label": lab} for r, p, lab in L.HALVES]}
    w = L.WISDOM
    above = builder.text_of(builder.passage(w["above_ref"]))
    order = [above.find(words(q)) for q in [w["first"], *w["then"]]]
    if -1 in order or order != sorted(order):
        raise BuildError(f"James drawing: the qualities are not all in {w['above_ref']} in this order")
    wisdom = {"below": [{"r": builder.require(r, p, "James drawing"), "t": p} for r, p in w["below"]],
              "above": builder.passage(w["above_ref"]), "first": w["first"], "then": w["then"]}
    labels = [item["label"] for item in part_list(study, "05")]
    if labels != [label for label, _, _ in L.MARKS]:
        raise BuildError(f"2 Peter drawing: the marks {[x for x, _, _ in L.MARKS]} do not match part 05's list {labels}")
    marks = {"r": builder.passage(L.MARKS_REF),
             "items": [{"label": lab, "r": builder.require(r, p, "2 Peter drawing"), "t": p} for lab, r, p in L.MARKS]}
    listen = []
    for item in part_list(study, "06"):
        if item["label"] not in L.LISTEN:
            raise BuildError(f"part 06 asks about {item['label']!r}, which LISTEN does not place")
        goes = L.LISTEN[item["label"]]
        if goes:
            cited = [run["r"] for run in item["runs"] if isinstance(run, dict) and "r" in run]
            home = [builder.text_of(r["r"]) for r in next(p for p in study["parts"] if p["n"] == goes)["readings"]]
            if not any(builder.text_of(c).strip() in h for c in cited for h in home):
                raise BuildError(f"part 06 sends {item['label']!r} back to part {goes}, but cites no verse in its main readings")
        listen.append({"label": item["label"], "part": goes})
    if [x["label"] for x in listen] != list(L.LISTEN):
        raise BuildError(f"part 06's questions {[x['label'] for x in listen]} do not match LISTEN {list(L.LISTEN)}")
    return {"checks": checks, "partChecks": L.PART_CHECKS, "together": {"part": part, "t": together}, "clauses": clauses,
            "messengers": messengers, "widen": widen, "wisdom": wisdom, "marks": marks, "listen": listen}
