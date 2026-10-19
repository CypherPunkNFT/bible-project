"""Build data.js for the "How the canon took shape" mock-ups.

Reads the study's own research file (content/academic-research/04-how-the-canon-took-shape.json, unchanged) and the
manuscripts collection (data/manuscripts/collection.json) for the openly licensed codex pictures and the land outlines.
Adds only what the page needs to draw: each record's span on a time line and its place on a map, both stated as loosely
as the record itself states them, plus the three reasoning questions and trail notes that the live page keeps in code.

Run: python design/canon-directions/build-data.py   (from the Website folder)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent.parent
DOSSIER = SITE / "content" / "academic-research" / "04-how-the-canon-took-shape.json"
COLLECTION = SITE / "data" / "manuscripts" / "collection.json"
OUT = HERE / "data.js"

# Each record on the time line: first year, last year, and how firm the span is.
#   firm     the record gives a year or a short span
#   century  the record gives only a century or a broad period
#   debated  the record says the date is debated or disputed
SPANS = {
    "sirach": (-150, -100, "century"), "qumran": (-300, 70, "century"), "jude": (50, 150, "debated"),
    "justin": (140, 165, "century"), "irenaeus": (170, 200, "century"), "muratorian": (170, 400, "debated"),
    "mishnah": (70, 220, "century"), "eusebius": (300, 340, "century"), "sinaiticus": (300, 400, "century"),
    "athanasius": (367, 367, "firm"), "augustine": (380, 410, "century"), "jerome": (395, 405, "century"),
    "peshitta": (400, 500, "century"), "carthage": (419, 419, "firm"), "alexandrinus": (400, 500, "century"),
    "bava": (300, 600, "debated"), "trent": (1546, 1546, "firm"), "westminster": (1646, 1647, "firm"),
}
# Our grouping of the record's own kind into four lanes; the record's kind is always shown as written.
LANES = [
    ("carried", "Copied and carried", "Scrolls, codices and a translation that hold writings together",
     ["qumran", "sinaiticus", "alexandrinus", "peshitta"]),
    ("used", "Quoted, read and received", "Writings used, read aloud or debated as sacred",
     ["sirach", "jude", "justin", "mishnah"]),
    ("listed", "Argued and listed", "Writers who defend, sort and name the books",
     ["irenaeus", "muratorian", "eusebius", "athanasius", "augustine", "jerome", "bava"]),
    ("decided", "Ruled and confessed", "Councils and confessions that bind a community",
     ["carthage", "trent", "westminster"]),
]
# Where each record belongs on a map, only as precisely as the record names it.
#   point   a named city or site          region  a named region, drawn as a soft area
#   none    the record gives no place (or calls it uncertain); listed beside the map instead
PLACES = {
    "sirach": ("region", 30.4, 30.2, "Egypt"), "qumran": ("point", 35.46, 31.74, "Qumran"),
    "jude": ("none", None, None, "Location uncertain"), "justin": ("point", 12.48, 41.89, "Rome"),
    "irenaeus": ("point", 4.83, 45.76, "Lyons"), "muratorian": ("disputed", 12.48, 41.89, "Rome? (disputed)"),
    "mishnah": ("region", 35.3, 32.6, "Roman Palestine"), "eusebius": ("point", 34.89, 32.5, "Caesarea"),
    "sinaiticus": ("none", None, None, "Production place uncertain"), "athanasius": ("point", 29.92, 31.2, "Alexandria"),
    "augustine": ("region", 8.5, 35.6, "North Africa"), "jerome": ("none", None, None, "Not given in this record"),
    "peshitta": ("region", 39.5, 36.6, "Syriac-speaking churches"), "carthage": ("point", 10.32, 36.85, "Carthage"),
    "alexandrinus": ("none", None, None, "Eastern Mediterranean; now London"), "bava": ("region", 44.4, 32.6, "Babylonia"),
    "trent": ("point", 11.12, 46.07, "Trent"), "westminster": ("point", -0.13, 51.5, "Westminster"),
}
# The surviving codices and papyri pictured on the page, from the manuscripts collection (all public domain there).
# "record" ties a picture to the study record it illustrates; the others stand as surviving witnesses only.
PICTURED = [
    ("Q152962", "sinaiticus"), ("Q209285", None), ("Q318233", "alexandrinus"),
    ("Q1513469", None), ("Q733492", None), ("Q637584", None),
]
NAMES = {
    "irenaeus": "Irenaeus", "jerome": "Jerome", "peshitta": "Peshitta", "alexandrinus": "Codex Alexandrinus",
    "sirach": "Sirach's prologue", "qumran": "Qumran collections", "jude": "Jude", "justin": "Justin",
    "muratorian": "Muratorian fragment", "mishnah": "Mishnah Yadayim", "eusebius": "Eusebius",
    "sinaiticus": "Codex Sinaiticus", "athanasius": "Athanasius", "augustine": "Augustine", "carthage": "African Code",
    "bava": "Bava Batra", "trent": "Council of Trent", "westminster": "Westminster Confession",
}
# Text the live page (src/pages/study/canon/) keeps in code rather than in the research file, copied word for word.
QUESTIONS = [
    {"prompt": "Hermas appears in a biblical codex. What has that established?",
     "answers": ["Every church recognized it as canonical.", "This manuscript transmitted it beside other writings.", "It was forbidden to read it publicly."],
     "correct": 1, "why": "Physical inclusion establishes transmission in this object. A claim about canonical status needs further evidence about the people and setting.",
     "ids": ["sinaiticus", "smithsonian"]},
    {"prompt": "No copy of Esther has been identified at Qumran. Which conclusion is warranted?",
     "answers": ["Esther was rejected by everyone there.", "Esther had not yet been written.", "The surviving finds do not attest a copy."],
     "correct": 2, "why": "This is a statement about survival and identification. It does not, on its own, tell us why a work is absent.", "ids": ["iaa"]},
    {"prompt": "Athanasius recommends a book for instruction. Does that place it in his canon?",
     "answers": ["No: his letter explicitly distinguishes the two categories.", "Yes: recommendation always means canonical.", "Only if it appears in a later printed Bible."],
     "correct": 0, "why": "The source supplies its own distinction. Follow that distinction before applying the categories of another place or period.", "ids": ["athanasius"]},
]
TRAIL_NOTES = {
    "Hermas": "The same work can be copied, read and recommended without being placed in a writer's canon. These are different witnesses, not stages every community passed through.",
    "Esther": "No identified copy at Qumran; an instructional book for Athanasius; canonical in other lists. Missing evidence and explicit exclusion are different claims.",
    "Revelation": "Eusebius preserves contrasting judgments. Later explicit lists show recognition in particular settings, not that every earlier community had agreed.",
}
FINDINGS = [
    "Wisdom and Sirach enter Augustine's canon. Athanasius recommends them for instruction outside his canon; Jerome distinguishes their edifying use from doctrinal authority.",
    "Esther is canonical in Augustine's enumeration and instructional in Athanasius's letter. Jerome's selected prologue does not discuss it: silence here cannot establish exclusion.",
    "Hermas is recommended outside Athanasius's canon. It is not enumerated by Augustine and not addressed in Jerome's selected prologue. Those last two claims are not interchangeable.",
]
MAP_BOX = (-12.0, 25.0, 50.0, 55.5)  # west, south, east, north: Westminster to Babylonia


def project(land: dict, lon: float, lat: float) -> tuple[float, float]:
    return round((lon - land["lon0"]) * land["cos"] * land["k"], 1), round((land["lat1"] - lat) * land["k"], 1)


def pictured(collection: dict) -> list[dict]:
    records = {r["i"]: r for r in collection["records"]}
    out = []
    for qid, record_id in PICTURED:
        r, image = records.get(qid), collection["images"].get(qid)
        if r is None or image is None:
            raise SystemExit(f"build-data: pictured witness {qid} is missing from {COLLECTION} (record or image); expected both")
        out.append({"q": qid, "name": r["n"], "date": r.get("d", ""), "holds": r.get("c", ""), "holder": r.get("hr", ""),
                    "shelf": r.get("sh", ""), "material": r.get("m", ""), "record": record_id, "w": image["w"], "h": image["h"],
                    "file": image["file"], "page": image["page"], "licence": image["lic"], "credit": image["by"]})
    return out


def main() -> None:
    dossier = json.loads(DOSSIER.read_text(encoding="utf-8"))
    collection = json.loads(COLLECTION.read_text(encoding="utf-8"))
    ids = [r["id"] for r in dossier["records"]]
    for table, name in ((SPANS, "SPANS"), (PLACES, "PLACES"), (NAMES, "NAMES")):
        missing = sorted(set(ids) - set(table))
        if missing:
            raise SystemExit(f"build-data: {name} has no entry for records {missing}; every record in {DOSSIER.name} needs one")
    land = collection["map"]
    west, south, east, north = MAP_BOX
    x0, y0 = project(land, west, north)
    x1, y1 = project(land, east, south)
    places = {}
    for rid, (kind, lon, lat, label) in PLACES.items():
        xy = project(land, lon, lat) if lon is not None else None
        places[rid] = {"kind": kind, "label": label, "x": xy[0] if xy else None, "y": xy[1] if xy else None}
    data = {
        "dossier": dossier, "names": NAMES, "questions": QUESTIONS, "trailNotes": TRAIL_NOTES, "findings": FINDINGS,
        "spans": {k: {"from": a, "to": b, "how": h} for k, (a, b, h) in SPANS.items()},
        "lanes": [{"key": k, "label": label, "line": line, "ids": members} for k, label, line, members in LANES],
        "places": places, "pictured": pictured(collection),
        "map": {"box": [x0, y0, round(x1 - x0, 1), round(y1 - y0, 1)], "d": land["d"]},
    }
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(f"// Built by build-data.py from the study's research file and the manuscripts collection. Do not edit.\nwindow.CN = {text};\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB): {len(ids)} records, {len(data['pictured'])} pictures")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
