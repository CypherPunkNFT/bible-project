"""Checks for the lists in study_lists.py, the crisis lines and the page's own files. Used by build-data.py.
Every phrase is compared with the Berean exactly as the site holds it (curly quotes and all), in the verse named."""
import re
from pathlib import Path

from scripture_text import BuildError, verses_of


def verse_text(builder, label: str) -> tuple:
    """(book code, "c:v", raw text) of a single verse; refuses a range."""
    code, verses = verses_of(builder.bible, label)
    if len(verses) != 1:
        raise BuildError(f"a list entry must name one verse, found {label}")
    c, v, text = verses[0]
    return code, f"{c}:{v}", text


def phrase_in(builder, label: str, phrase: str, what: str, once: bool = True) -> dict:
    code, cv, text = verse_text(builder, label)
    count = len(re.findall(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text))
    if count == 0 or (once and count > 1):
        raise BuildError(f"{what}: {phrase!r} should be in {label} {'exactly once' if once else ''}, found {count} times")
    return {"r": builder.passage(label), "label": label, "phrase": phrase, "verse": f"{code} {cv}"}


def check_chart(builder, lists: dict) -> tuple:
    kinds, verbs, chart = lists["KINDS"], [], []
    for column in lists["VERB_CHART"]:
        hinge = None
        if column["hinge"]:
            label, phrase = column["hinge"]
            hinge = phrase_in(builder, label, phrase, f"the turn in part {column['part']}")
            if not verse_text(builder, label)[2].startswith("But ") or not phrase.startswith("But"):
                raise BuildError(f"the turn in part {column['part']} should be a verse that begins with “But”: {label}")
        ids = []
        for entry in column["verbs"]:
            label, phrase, who = entry[:3]
            if who not in kinds:
                raise BuildError(f"verb {phrase!r}: unknown kind {who!r}")
            verb = phrase_in(builder, label, phrase, f"verb in part {column['part']}")
            verb |= {"id": f"v{len(verbs) + 1}", "part": column["part"], "who": who, "note": entry[3] if len(entry) > 3 else None}
            verbs.append(verb)
            ids.append(verb["id"])
        chart.append({"part": column["part"], "reading": builder.passage(column["reading"]), "hinge": hinge,
                      "noTurn": lists["NO_TURN"].get(column["part"]), "verbs": ids})
    return verbs, chart


def check_prayers(builder, lists: dict) -> list:
    """Each prayer is the words inside the quotation marks of its verses; the marked words are found by the script."""
    prayers = []
    for prayer in lists["PRAYERS"]:
        _, verses = verses_of(builder.bible, prayer["ref"])
        joined = " ".join(v[2] for v in verses)
        found = re.search(r"‘(.+?)’(?=[\s”]|$)", joined)
        if not found:
            raise BuildError(f"no quoted prayer found in {prayer['ref']}")
        words, segments, last = found.group(1), [], 0
        for mark in re.finditer(prayer["mark"], words):
            segments += [[words[last:mark.start()], 0], [mark.group(0), 1]]
            last = mark.end()
        segments.append([words[last:], 0])
        if "".join(s[0] for s in segments) != words:
            raise BuildError(f"the prayer in {prayer['ref']} did not split back into its own words")
        prayers.append({"who": prayer["who"], "r": builder.passage(prayer["ref"]), "label": prayer["ref"],
                        "segments": [s for s in segments if s[0]], "count": sum(s[1] for s in segments)})
    if prayers[0]["count"] < 1:
        raise BuildError("the Pharisee's prayer should hold “I” at least once")
    return prayers


def check_abraham(builder, lists: dict) -> dict:
    a = lists["ABRAHAM"]
    out = {"believed": phrase_in(builder, *a["believed"], "Abraham believed"),
           "quotedBy": [phrase_in(builder, *q, "quoted by") for q in a["quoted_by"]],
           "offered": phrase_in(builder, *a["offered"], "Abraham offered"),
           "pointedBy": phrase_in(builder, *a["pointed_by"], "pointed to by"), "ages": []}
    for label, phrase, years in a["ages"]:
        out["ages"].append(phrase_in(builder, label, phrase, "Abraham's age") | {"years": years})
    if [x["years"] for x in out["ages"]] != sorted(x["years"] for x in out["ages"]):
        raise BuildError("Abraham's ages should run in order")
    return out


def check_lists(builder, lists: dict, study: dict) -> dict:
    verbs, chart = check_chart(builder, lists)
    chain = [phrase_in(builder, label, phrase, "Romans 8 chain", once=False) for label, phrase in lists["CHAIN"]]
    two = [phrase_in(builder, label, phrase, "Philippians 2 verbs") | {"who": who} for label, phrase, who in lists["TWO_VERBS"]]
    god_count = sum(1 for v in verbs if v["who"] in ("god", "passive")) + len(chain) + sum(1 for v in two if v["who"] == "god")
    return {"verbs": verbs, "chart": chart, "prayers": check_prayers(builder, lists),
            "declaring": [phrase_in(builder, *d, "Romans 4 word") for d in lists["DECLARING"]],
            "standing": [phrase_in(builder, *s, "Galatians 4:7 standing") for s in lists["STANDING"]],
            "abraham": check_abraham(builder, lists), "chain": chain, "twoVerbs": two, "godCount": god_count}


def mark_verses(builder, verbs: list, chain: list, two: list) -> dict:
    """Where each marked verb sits in its verse: {"EPH 2:5": [[start, end, who, id], ...]}; spans proven by slicing."""
    marks: dict = {}
    entries = [(v["verse"], v["phrase"], v["who"], v["id"], True) for v in verbs]
    entries += [(c["verse"], c["phrase"], "god", f"c{i}", False) for i, c in enumerate(chain)]
    entries += [(t["verse"], t["phrase"], t["who"], f"t{i}", True) for i, t in enumerate(two)]
    for verse, phrase, who, ident, _ in entries:
        code, cv = verse.split(" ")
        text = builder.bible[code][cv]
        for found in re.finditer(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text):
            if text[found.start():found.end()] != phrase:
                raise BuildError(f"mark for {phrase!r} does not slice back to itself in {verse}")
            marks.setdefault(verse, []).append([found.start(), found.end(), who, ident])
    for verse, spans in marks.items():
        spans.sort()
        for (_, end, _, a), (start, _, _, b) in zip(spans, spans[1:]):
            if start < end:
                raise BuildError(f"two marked verbs overlap in {verse} ({a}, {b})")
    return marks


def check_crisis(text: str, crisis: list, life: dict) -> dict:
    """Each crisis number is in the care note beside its country, and in the site's checked list under the entry named."""
    entries = {e["id"]: e for group in life["groups"] for e in group.get("entries", [])}
    held, unverified = [], []
    for country, number, entry_id in crisis:
        if not re.search(rf"In (?:the )?{re.escape(country)}[^.]*?{re.escape(number)}", text):
            raise BuildError(f"crisis line: {number} is not given for {country} in content.md")
        if entry_id is None:
            unverified.append({"country": country, "number": number})
            continue
        entry = entries.get(entry_id)
        if not entry or number not in {c.get("value") for c in entry.get("contact", [])}:
            raise BuildError(f"crisis line: {country} {number} is not in life.json under {entry_id!r}")
        held.append({"country": country, "number": number, "entry": entry_id, "checked": entry.get("checked") or life.get("checked")})
    return {"held": held, "unverified": unverified}


def check_page_files(folder: Path) -> list:
    """Every file index.html loads exists, and the shared frame still defines what the page calls."""
    html = (folder / "index.html").read_text(encoding="utf-8")
    missing = [ref for ref in re.findall(r'(?:src|href)="([^"#?:]+)"', html) if not (folder / ref).resolve().exists()]
    frame = folder.parent / "authors-directions/shared/frame.js"
    if frame.exists() and not all(word in frame.read_text(encoding="utf-8") for word in ("Frame", "icon")):
        missing.append("frame.js no longer defines Frame and icon")
    return missing
