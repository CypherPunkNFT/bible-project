"""How each open catalogue record becomes one record on the Manuscripts page (/study/manuscripts), for
scripts/build-manuscripts.py. Copied from the approved mock-up's build (design/manuscripts-directions/build-data.py) so the
page shows exactly what the mock-up showed: the kinds, dates, contents and holders, the two marked corrections, the
records left out and the summary counts. csntm.json (all rights reserved) is never read."""
import json
import re
from pathlib import Path

from ms_tables import CATHOLIC, CODE_INDEX, ETCBC_BOOK, EXCLUDED, GOSPELS, HOLDERS, NT, OT, PAUL
from ms_text import parse_contents, parse_note_date, wikidata_date

# Pinned tradition -> the kind a non-Greek witness is filed under.
PINNED_KIND = {"hebrew-bible": "hebrew", "latin-vulgate": "latin", "latin-vetus-latina": "latin", "syriac-peshitta": "syriac",
               "coptic": "coptic", "gothic": "gothic", "armenian": "armenian", "ethiopic": "geez"}
GA_KIND = {"papyrus": "papyrus", "majuscule": "majuscule", "minuscule": "minuscule", "lectionary": "lectionary"}
# The corpus's 2026-10-18 Wikidata language cohorts -> kind, most specific first: a Judaeo-Arabic Torah is in both the
# Hebrew and the Arabic cohort and is filed as Arabic; a Samaritan Pentateuch as Samaritan.
COHORT_KIND = [("samaritan", "samaritan"), ("gothic", "gothic"), ("georgian", "georgian"), ("armenian", "armenian"),
               ("church-slavonic", "slavonic"), ("arabic", "arabic"), ("latin", "latin"), ("hebrew-bible", "hebrew")]
# OSIS-style book codes used by the corpus's Syriac records -> this page's codes. A Syriac title names "Samuel" or
# "Kings" for the pair, so the pair is held; a group name expands to its books.
OSIS_BOOKS = {"Gen": ["GEN"], "Exod": ["EXO"], "Lev": ["LEV"], "Num": ["NUM"], "Deut": ["DEU"], "Josh": ["JOS"], "Judg": ["JDG"],
              "Ruth": ["RUT"], "1Sam": ["1SA", "2SA"], "1Kgs": ["1KI", "2KI"], "1Chr": ["1CH", "2CH"], "Ezra": ["EZR"], "Neh": ["NEH"],
              "Esth": ["EST"], "Job": ["JOB"], "Ps": ["PSA"], "Prov": ["PRO"], "Eccl": ["ECC"], "Song": ["SNG"], "Isa": ["ISA"],
              "Jer": ["JER"], "Lam": ["LAM"], "Ezek": ["EZK"], "Dan": ["DAN"], "Minor Prophets": OT[27:39], "Matt": ["MAT"],
              "Mark": ["MRK"], "Luke": ["LUK"], "John": ["JHN"], "Gospels": GOSPELS, "Acts": ["ACT"], "Rom": ["ROM"],
              "1Cor": ["1CO", "2CO"], "Gal": ["GAL"], "Eph": ["EPH"], "Phil": ["PHP"], "Col": ["COL"], "1Thess": ["1TH", "2TH"],
              "1Tim": ["1TI", "2TI"], "Titus": ["TIT"], "Phlm": ["PHM"], "Heb": ["HEB"], "Pauline epistles": PAUL,
              "Catholic epistles": CATHOLIC, "Jas": ["JAS"], "1Pet": ["1PE", "2PE"], "1John": ["1JN", "2JN", "3JN"], "Jude": ["JUD"],
              "Rev": ["REV"]}
# Images held for a collection that show one of its papyri (P. Chester Beatty I is P45; P. Bodmer VIII is P72).
IMAGE_TO_WITNESS = {"Q1070692": ("papyrus", "P45"), "Q664820": ("papyrus", "P72")}
# Two corrections, each with its reason; everything else is shown as the open record has it.
DATE_FIX = {"Q290500": (401, 500, "5th century",
                        "The open record dates it to the 13th century, which belongs to the later text written over it: "
                        "Ephraemi is a palimpsest, its biblical text scraped and overwritten centuries after it was copied.")}
# Dates in the open record that cannot be right: the record is shown undated, with what the source says.
DATE_DROP = {"Q133501306": "the year 18; this Hebrew-Arabic Bible from the Sassoon collection cannot be that old, so the year is set aside"}
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
    elif any(t in rec["traditions"] for t, _k in COHORT_KIND):
        kind = next(k for t, k in COHORT_KIND if t in rec["traditions"])
        lanes += [k for t, k in COHORT_KIND if t in rec["traditions"] and k != kind]
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
    out = {"i": qid, "n": rec["name"] or qid, "k": kind, "L": list(dict.fromkeys(lanes)), "src": "wd"}
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
    if qid in DATE_DROP:
        out["dr"] = DATE_DROP[qid]
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
    add_dss_date(out, rec)
    if "paleohebrew" in (rec["script"] or ""):
        out["sc"] = "palaeo-Hebrew script"
    if "arc" in rec["languages"]:
        out["la"] = "Hebrew and Aramaic"
    elif "grc" in rec["languages"]:
        out["la"] = "Hebrew and Greek"
    return out


def year_label(year: int) -> str:
    """A historical year (no year zero: -30 is 30 BC) as words."""
    return f"{-year} BC" if year < 0 else f"AD {year}"


def span_label(early: int, late: int) -> str:
    if early == late:
        return year_label(early)
    if late < 0:
        return f"{-early}–{-late} BC"
    if early > 0:
        return f"AD {early}–{late}"
    return f"{-early} BC – AD {late}"


DSS_SOURCE = {"wikipedia-qumran": "wq", "wikipedia-dss-carbon": "wc", "popovic-2025": "pp"}


def add_dss_date(out: dict, rec: dict) -> None:
    """The display date the corpus chose for a scroll, by its stated precedence, and how many other claims it holds.

    The corpus writes historical years (-30 is 30 BC); this page counts astronomically (0 is 1 BC), so BC years move up one.
    """
    date = rec.get("date")
    if not date or date.get("earliest") is None:
        return
    early, late = date["earliest"], date["latest"]
    astro = lambda y: y + 1 if y < 0 else y
    label = span_label(early, late)
    if date["basis"] == "palaeographic-period":
        # Kept short for the lists; the source's own wording ("Early Hellenistic; Paleo-Hebrew script") goes in dw.
        label = f"c. {label}"
        out["dw"] = (date["raw"] or "").strip(" |")
    out.update(e=astro(early), l=astro(late), d=label, db=date["basis"], ds=DSS_SOURCE.get(date["display_source"], "wq"),
               dn=len(rec.get("date_claims") or []))


def syriaca_record(rec: dict, problems: dict) -> dict:
    out = {"i": rec["record_id"], "n": rec["name"] or rec["record_id"], "k": "syriac", "L": ["syriac"], "src": "syr", "su": rec["record_url"]}
    date = rec.get("date")
    if date and date.get("earliest") is not None:
        raw = (date["raw"] or "").strip(" .")
        e, late = date["earliest"], date["latest"]
        label = raw if raw and len(raw) <= 28 and re.search(r"\d|cent", raw) else (f"{e}–{late}" if e != late else str(e))
        out.update(e=e, l=late, d=label, db="year" if e == late else "range")
    codes = sorted({CODE_INDEX[c] for b in rec["contents"]["books"] for c in OSIS_BOOKS.get(b, [])})
    if codes:
        out.update(b=codes, bs="catalogue")
    elif re.search(r"lectionar|lessons|evangeliar", rec["contents"]["raw"] or "", re.I):
        out["lect"] = 1
    if rec["contents"]["raw"]:
        out["c"] = clean(rec["contents"]["raw"][:240])
    add_place(out, rec, problems)
    if rec["material"] in ("vellum", "parchment", "paper"):
        out["m"] = "parchment" if rec["material"] == "vellum" else rec["material"]
    return out


def credit_name(qid: str, raw: str) -> str:
    """The Commons author field, cleaned; where it holds a title, a description or a doubled placeholder, 'Unknown author'."""
    garbage = ("Wikimedia Commons", "Unknown author Unknown author", "Anonymous Unknown author", "unknown writer in 3rd century")
    if raw in garbage or qid in ("Q4494220", "Q776755", "Q664820"):
        return "Unknown author"
    return raw.replace(" . Photo:", ". Photo:").strip()



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
        "dssBiblical": sum(1 for r in dss if r.get("b")), "dssFinds": finds, "dssDated": sum(1 for r in dss if "e" in r),
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

