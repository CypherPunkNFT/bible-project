#!/usr/bin/env python3
"""Build data.js and assets/ for the Manuscripts mock-ups from the open catalogue sources.

Reads Research/Manuscripts/normalized/manuscripts/wikidata.json (CC0 + CC BY-SA) and etcbc-dss.json (CC BY-NC),
the corpus's own pinned identities (tools/wikidata-pinned.json) and image licences (raw/commons/_harvest.json).
csntm.json is all rights reserved and is never opened. Run: python build-data.py
"""
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image

from ms_tables import BOOKS, CATHOLIC, CODE_INDEX, ETCBC_BOOK, EXCLUDED, GOSPELS, HOLDERS, NT, OT, PAUL, WRITTEN
from ms_text import parse_contents, parse_note_date, wikidata_date
from ms_map import land_paths

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[2]
CORPUS = PROJECT / "Research" / "Manuscripts"
ATLAS = PROJECT / "Website" / "node_modules" / "world-atlas" / "land-50m.json"

# Pinned tradition -> the kind a non-Greek witness is filed under.
PINNED_KIND = {"hebrew-bible": "hebrew", "latin-vulgate": "latin", "latin-vetus-latina": "latin", "syriac-peshitta": "syriac",
               "coptic": "coptic", "gothic": "gothic", "armenian": "armenian", "ethiopic": "geez"}
GA_KIND = {"papyrus": "papyrus", "majuscule": "majuscule", "minuscule": "minuscule", "lectionary": "lectionary"}
# Images held for a collection that show one of its papyri (P. Chester Beatty I is P45; P. Bodmer VIII is P72).
IMAGE_TO_WITNESS = {"Q1070692": ("papyrus", "P45"), "Q664820": ("papyrus", "P72")}
# Two corrections, each with its reason; everything else is shown as the open record has it.
DATE_FIX = {"Q290500": (401, 500, "5th century",
                        "The open record dates it to the 13th century, which belongs to the later text written over it: "
                        "Ephraemi is a palimpsest, its biblical text scraped and overwritten centuries after it was copied.")}
BOOKS_FIX = {"Q209285": ([c for c in NT if c not in ("1TI", "2TI", "TIT", "PHM", "REV")],
                         "Vaticanus is recorded as the whole New Testament, but it lacks 1 and 2 Timothy, Titus, Philemon and Revelation.")}
# Contents read from the corpus's pinned-identity notes or the witness's own name, for witnesses whose record has none.
NOTE_BOOKS = [("Gospels", GOSPELS), ("gospels", GOSPELS), ("Coptic Acts", ["ACT"]), ("Pentateuch", OT[:5]),
              ("Codex of the Prophets", ["JOS", "JDG", "1SA", "2SA", "1KI", "2KI", "ISA", "JER", "EZK"] + OT[27:39]), ("Decalogue and Shema", ["EXO", "DEU"]),
              ("near-complete Hebrew Bible", OT), ("base text of BHS", OT), ("oldest complete Latin Vulgate", OT + NT)]


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def holder_ids(text: str | None) -> list[str]:
    if not text:
        return []
    low = text.lower()
    found = [hid for hid, *_mid, keys in HOLDERS if any(k in low for k in keys)]
    return list(dict.fromkeys(found))


def note_books(name: str, note: str | None) -> list[str]:
    hay = f"{name} {note or ''}"
    for needle, codes in NOTE_BOOKS:
        if needle in hay:
            return codes
    return []


def clean(text: str | None) -> str | None:
    if not text:
        return None
    text = text.replace("&ndash;", "–").replace("&mdash;", "—").replace("'''", "").strip(" ,")
    return re.sub(r"\s+", " ", text) or None


def ga_of(rec: dict) -> tuple[str | None, str | None]:
    ga = rec["siglum"]["gregory_aland"]
    if not ga:
        return None, None
    kind = GA_KIND[ga["ga_class"]]
    # Corpus fault: papyri 138-140 were filed as minuscules 138-140 (their keys collide with the real minuscules).
    if kind == "minuscule" and rec["name"].startswith("Papyrus "):
        return "papyrus", f"P{ga['number']}"
    return kind, ga["display"] + (ga.get("suffix") or "")


def wikidata_record(rec: dict, pinned: dict, problems: dict) -> dict | None:
    qid = rec["identifiers"]["wikidata_qid"]
    if qid in EXCLUDED:
        return None
    kind, siglum = ga_of(rec)
    pin = pinned.get(qid)
    lanes = []
    if kind:
        lanes.append(kind)
    elif "greek-ot-septuagint" in rec["traditions"]:
        kind = "lxx"
    elif pin:
        kind = PINNED_KIND[pin["traditions"][0]]
        problems["pinned_traditions_restored"] += 1
    else:
        problems["no_kind"].append(rec["name"])
        return None
    if kind not in lanes:
        lanes.append(kind)
    if "greek-ot-septuagint" in rec["traditions"] and "lxx" not in lanes:
        lanes.append("lxx")
    script = (rec["script"] or "").lower()
    langs = rec["languages"]
    pin_trads = pin["traditions"] if pin else []
    if "lat" in langs or "latin" in script or "latin-vetus-latina" in pin_trads:
        lanes.append("latin")
    if "cop" in langs or "coptic" in script:
        lanes.append("coptic")
    out = {"i": qid, "n": rec["name"], "k": kind, "L": list(dict.fromkeys(lanes)), "src": "wd"}
    if siglum:
        out["g"] = siglum
    elif kind == "lxx":
        rahlfs = [o["value"] for o in rec["siglum"]["other"] if o["system"] == "rahlfs"]
        if rahlfs:
            out["g"] = f"Ra {rahlfs[0]}"
    add_date(out, rec, pin, problems)
    add_contents(out, rec, pin, kind, problems)
    add_place(out, rec, problems)
    if rec["material"] in ("papyrus", "parchment", "vellum", "paper", "leather"):
        out["m"] = "parchment" if rec["material"] == "vellum" else rec["material"]
    if rec["identifiers"].get("wikipedia_title"):
        out["wp"] = rec["identifiers"]["wikipedia_title"]
        out["wr"] = rec["identifiers"].get("wikipedia_revision_id")
    return out


def add_date(out: dict, rec: dict, pin: dict | None, problems: dict) -> None:
    qid = out["i"]
    if qid in DATE_FIX:
        early, late, label, why = DATE_FIX[qid]
        out.update(e=early, l=late, d=label, db="corrected", why=why)
        return
    parsed = wikidata_date(rec["date"])
    if parsed:
        out.update(parsed)
        if parsed.get("db") == "reparsed":
            problems["dates_reparsed"] += 1
        if parsed.get("db") == "century-from-year":
            problems["dates_year_as_century"] += 1
        return
    if rec["date"]:
        problems["dates_unreadable"].append(rec["date"]["raw"])
        if not rec["date"]["raw"].startswith("http"):
            out["dr"] = rec["date"]["raw"]
    if pin and pin.get("note"):
        from_note = parse_note_date(pin["note"])
        if from_note:
            out.update(from_note, db="note")
            problems["dates_from_notes"] += 1


def add_contents(out: dict, rec: dict, pin: dict | None, kind: str, problems: dict) -> None:
    raw = clean(rec["contents"]["raw"])
    if raw:
        out["c"] = raw
    if out["i"] in BOOKS_FIX:
        codes, why = BOOKS_FIX[out["i"]]
        out.update(b=[CODE_INDEX[c] for c in codes], bs="corrected", bwhy=why)
        return
    if kind == "lectionary" or (raw and re.search(r"evangelist|apostol|lectionary", raw, re.I)):
        out["lect"] = 1
        return
    if raw and kind != "lxx":
        books, chapters = parse_contents(raw)
        if books:
            out["b"] = sorted({CODE_INDEX[c] for c in books})
            out["bs"] = "catalogue"
            if chapters:
                out["ch"] = {str(CODE_INDEX[c]): sorted(v) for c, v in chapters.items()}
            return
        problems["contents_unread"].append(raw)
    codes = note_books(rec["name"], pin.get("note") if pin else None)
    if codes:
        out.update(b=sorted(CODE_INDEX[c] for c in codes), bs="note")


def add_place(out: dict, rec: dict, problems: dict) -> None:
    raw = rec["location"]["institution"] or rec["location"]["raw"]
    if raw and raw.strip() in ("?", "unknown", "Unknown", "Private"):
        raw = None
    if raw:
        out["hr"] = raw
        ids = holder_ids(raw)
        if ids:
            out["h"] = ids
        else:
            problems["holders_unplaced"] += 1
    if rec["location"]["shelfmark"]:
        out["sh"] = rec["location"]["shelfmark"]


FIND_LABEL = {"masada": "Masada", "wadi-murabbaat": "Wadi Murabba'at", "nahal-hever": "Nahal Hever", "khirbet-qumran": "Khirbet Qumran",
              "wadi-seiyal": "Wadi Seiyal", "nahal-arugot": "Nahal Arugot", "wadi-sdeir": "Wadi Sdeir", "unprovenanced": "find site not known"}
SCROLL_NAMES = {"1Qisaa": ("Great Isaiah Scroll", "1QIsaᵃ")}


def find_label(slug: str) -> str:
    cave = re.fullmatch(r"qumran-cave-(\d+)", slug)
    return f"Qumran, Cave {cave.group(1)}" if cave else FIND_LABEL.get(slug, slug)


def dss_record(rec: dict, problems: dict) -> dict | None:
    if rec["record_granularity"] != "manuscript":
        problems["dss_plates_left_out"] += 1
        return None
    if rec["find_context"] == "cairo-geniza":
        problems["dss_not_judaean"].append(rec["name"])
        return None
    name, siglum = SCROLL_NAMES.get(rec["name"], (rec["name"], rec["name"]))
    out = {"i": rec["name"], "n": name, "g": siglum, "k": "dss", "L": ["dss"], "src": "dss", "f": find_label(rec["find_context"]),
           "x": [rec["extent"].get("fragments", 0), rec["extent"].get("lines", 0)]}
    books = [ETCBC_BOOK[b] for b in rec["contents"]["books"] if b in ETCBC_BOOK]
    unknown = [b for b in rec["contents"]["books"] if b not in ETCBC_BOOK]
    if unknown:
        raise ValueError(f"etcbc-dss {rec['name']}: book codes {unknown} are not in ETCBC_BOOK; add them before building")
    if books:
        out.update(b=sorted({CODE_INDEX[c] for c in books}), bs="etcbc")
    if "paleohebrew" in (rec["script"] or ""):
        out["sc"] = "palaeo-Hebrew script"
    if "arc" in rec["languages"]:
        out["la"] = "Hebrew and Aramaic"
    elif "grc" in rec["languages"]:
        out["la"] = "Hebrew and Greek"
    return out


def credit_name(qid: str, raw: str) -> str:
    """The Commons author field, cleaned; where it holds a title, a description or a doubled placeholder, 'Unknown author'."""
    garbage = ("Wikimedia Commons", "Unknown author Unknown author", "Anonymous Unknown author", "unknown writer in 3rd century")
    if raw in garbage or qid in ("Q4494220", "Q776755", "Q664820"):
        return "Unknown author"
    return raw.replace(" . Photo:", ". Photo:").strip()


def build_images(by_qid: dict, by_siglum: dict) -> dict:
    harvest = load(CORPUS / "raw" / "commons" / "_harvest.json")
    out_dir = HERE / "assets"
    out_dir.mkdir(exist_ok=True)
    images = {}
    for item in harvest["held"]:
        qid = item["qid"]
        target = by_siglum.get(IMAGE_TO_WITNESS[qid]) if qid in IMAGE_TO_WITNESS else by_qid.get(qid)
        if target is None:
            print(f"  image skipped (its record is left out): {item['commons_file']}")
            continue
        source = CORPUS / "images" / item["stored_as"]
        key = target["i"]
        with Image.open(source) as img:
            img = img.convert("RGB")
            img.thumbnail((560, 560), Image.Resampling.LANCZOS)
            img.save(out_dir / f"{key}.jpg", "JPEG", quality=72, optimize=True, progressive=True)
            width, height = img.size
        target["im"] = key
        images[key] = {"w": width, "h": height, "file": item["commons_file"], "page": item["commons_page"], "lic": item["licence"],
                       "by": credit_name(qid, item["attribution"]), "via": None if qid not in IMAGE_TO_WITNESS else item["name"]}
    write_image_script(out_dir, images)
    return images


def write_image_script(out_dir: Path, images: dict) -> None:
    """The local preview's /mockups/ route serves no .jpg, so the same JPEGs also go into one script as data URIs."""
    lines = ["// The JPEGs in this folder as data URIs, for the local preview (its /mockups/ route serves no .jpg). Built by build-data.py.",
             "window.MS_IMG = {"]
    for key in images:
        encoded = base64.b64encode((out_dir / f"{key}.jpg").read_bytes()).decode("ascii")
        lines.append(f'  "{key}": "data:image/jpeg;base64,{encoded}",')
    lines.append("};")
    (out_dir / "images.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


# Approximate totals in the Kurzgefasste Liste (the official register of Greek New Testament manuscripts), as given in the
# corpus's MANIFEST.md; the page labels them as approximate.
LISTE = {"papyrus": 141, "majuscule": 323, "minuscule": 2900, "lectionary": 2500, "total": 5800}


def summarise(records: list[dict], images: dict) -> dict:
    by_kind: dict[str, int] = {}
    for r in records:
        by_kind[r["k"]] = by_kind.get(r["k"], 0) + 1
    ga: dict[str, set] = {}
    for r in records:
        if r["k"] in GA_KIND.values():
            ga.setdefault(r["k"], set()).add(r.get("g"))
    ga_counts = {k: len(v) for k, v in ga.items()}
    greek_nt = [r for r in records if r["k"] in ("papyrus", "majuscule", "minuscule")]
    dss = [r for r in records if r["k"] == "dss"]
    finds: dict[str, int] = {}
    for r in dss:
        finds[r["f"]] = finds.get(r["f"], 0) + 1
    holders = {h for r in records for h in r.get("h", [])}
    return {
        "records": len(records), "byKind": by_kind, "dated": sum(1 for r in records if "e" in r),
        "ga": ga_counts, "gaTotal": sum(ga_counts.values()), "liste": LISTE,
        "lxxDated": sum(1 for r in records if r["k"] == "lxx" and "e" in r),
        "dssBiblical": sum(1 for r in dss if r.get("b")), "dssFinds": finds,
        "ntWithBooks": sum(1 for r in greek_nt if r.get("b")), "ntRecords": len(greek_nt),
        "withChapters": sum(1 for r in records if r.get("ch")), "lectionaries": sum(1 for r in records if r.get("lect")),
        "holders": len(holders), "withHolder": sum(1 for r in records if r.get("hr")),
        "placed": sum(1 for r in records if r.get("h")), "images": len(images),
        "after1500": sum(1 for r in records if "e" in r and (r["e"] + r["l"]) / 2 > 1500),
    }


def holder_table(records: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for r in records:
        for h in r.get("h", []):
            counts[h] = counts.get(h, 0) + 1
    return [{"id": hid, "name": name, "city": city, "country": country, "lat": lat, "lon": lon, "n": counts[hid]}
            for hid, name, city, country, lat, lon, _keys in HOLDERS if hid in counts]


def main() -> None:
    wikidata = load(CORPUS / "normalized" / "manuscripts" / "wikidata.json")["records"]
    etcbc = load(CORPUS / "normalized" / "manuscripts" / "etcbc-dss.json")["records"]
    pinned = {e["qid"]: e for e in load(CORPUS / "tools" / "wikidata-pinned.json")["entries"] if e.get("qid")}
    problems = {"pinned_traditions_restored": 0, "no_kind": [], "dates_reparsed": 0, "dates_year_as_century": 0,
                "dates_unreadable": [], "dates_from_notes": 0, "contents_unread": [], "holders_unplaced": 0,
                "dss_plates_left_out": 0, "dss_not_judaean": []}
    records = [r for r in (wikidata_record(rec, pinned, problems) for rec in wikidata) if r]
    records += [r for r in (dss_record(rec, problems) for rec in etcbc) if r]
    seen: dict[tuple, str] = {}
    for r in records:
        if r["k"] in GA_KIND.values() and r.get("g"):
            key = (r["k"], r["g"])
            if key in seen:
                print(f"  duplicate siglum {key}: {seen[key]} and {r['n']}")
            seen[key] = r["n"]
    by_qid = {r["i"]: r for r in records if r["src"] == "wd"}
    by_siglum = {(r["k"], r.get("g")): r for r in records if r.get("g")}
    images = build_images(by_qid, by_siglum)
    data = {
        "built": "2026-10-17", "books": [{"code": c, "name": n, "ch": ch, "sec": s} for c, n, ch, s in BOOKS],
        "groups": {"gospels": [CODE_INDEX[c] for c in GOSPELS], "paul": [CODE_INDEX[c] for c in PAUL], "catholic": [CODE_INDEX[c] for c in CATHOLIC]},
        "written": {str(CODE_INDEX[c]): list(v) for c, v in WRITTEN.items()},
        "counts": summarise(records, images), "holders": holder_table(records), "images": images,
        "excluded": [{"n": next((r["name"] for r in wikidata if r["identifiers"]["wikidata_qid"] == q), q), "why": why} for q, why in EXCLUDED.items()],
        "map": land_paths(ATLAS), "records": records,
    }
    text = "// Built by build-data.py from the open Manuscripts corpus (Wikidata CC0 + Wikipedia CC BY-SA; ETCBC CC BY-NC). Do not edit.\n"
    text += "window.MS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (HERE / "data.js").write_text(text, encoding="utf-8")
    report(problems, data)


def report(problems: dict, data: dict) -> None:
    print(f"data.js: {len(data['records'])} records, {len(data['images'])} images, {len(data['holders'])} placed holders")
    print(json.dumps(data["counts"], ensure_ascii=False))
    for key, value in problems.items():
        if isinstance(value, list):
            print(f"  {key}: {len(value)}  e.g. {value[:12]}")
        else:
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
