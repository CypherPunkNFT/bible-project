#!/usr/bin/env python3
"""Build src/pages/study/strongs/strongs-data.json for /study/strongs-numbers.

Reads the site's tagged King James text and Berean text (data/text/) and STEP Bible's brief lexicons
(sources/stepbible/TBESG.txt, TBESH.txt; CC BY 4.0, Tyndale House). Ships only letter ranges and the short
lemma, transliteration and gloss of the numbers the study features; the lexicons' Meaning column is never read
into the output. Every count and sample is asserted against the data, so a wrong one stops the build.

Usage: python scripts/build-strongs-study.py [--site <Website folder>] [--sources <sources/stepbible folder>]
"""
import argparse
import bisect
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from collections.abc import Iterator
from pathlib import Path
from typing import NoReturn

GREEK_LETTERS = [("α", "Alpha"), ("β", "Beta"), ("γ", "Gamma"), ("δ", "Delta"), ("ε", "Epsilon"), ("ζ", "Zeta"), ("η", "Eta"), ("θ", "Theta"),
                 ("ι", "Iota"), ("κ", "Kappa"), ("λ", "Lambda"), ("μ", "Mu"), ("ν", "Nu"), ("ξ", "Xi"), ("ο", "Omicron"), ("π", "Pi"), ("ρ", "Rho"),
                 ("σ", "Sigma"), ("τ", "Tau"), ("υ", "Upsilon"), ("φ", "Phi"), ("χ", "Chi"), ("ψ", "Psi"), ("ω", "Omega")]
HEBREW_LETTERS = [("א", "Aleph"), ("ב", "Bet"), ("ג", "Gimel"), ("ד", "Dalet"), ("ה", "He"), ("ו", "Vav"), ("ז", "Zayin"), ("ח", "Chet"), ("ט", "Tet"),
                  ("י", "Yod"), ("כ", "Kaf"), ("ל", "Lamed"), ("מ", "Mem"), ("נ", "Nun"), ("ס", "Samekh"), ("ע", "Ayin"), ("פ", "Pe"), ("צ", "Tsade"),
                  ("ק", "Qof"), ("ר", "Resh"), ("ש", "Shin"), ("ת", "Tav")]
FINAL_FORMS = {"ς": "σ", "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
GREEK_TOP, HEBREW_TOP = 5624, 8674
GREEK_UNUSED = {2717, *range(3203, 3303)}

# Each featured number: its rendering groups, as (label, pattern over the tagged English, sample verse), where a sample is
# (book, chapter, verse, the Berean's word there, or None where no single word lines up). The first pattern to match takes the tag.
FEATURED = {
    "H7307": [("spirit", r"\bspirits?\b", ("GEN", 1, 2, "Spirit")), ("wind", r"\bwinds?\b", ("EXO", 10, 13, "wind")),
              ("breath", r"\bbreath\b", ("JOB", 12, 10, "breath")), ("mind", r"\bminds?\b", ("GEN", 26, 35, None))],
    "H1697": [("word", r"\bwords?\b", ("GEN", 15, 1, "word")), ("thing", r"\b(no)?things?\b", ("GEN", 18, 14, "anything")),
              ("acts", r"\bacts?\b", ("2CH", 16, 11, "acts")), ("matter", r"\bmatters?\b", ("GEN", 24, 9, "matter")),
              ("chronicles", r"\bchronicles\b", ("1KI", 14, 19, "Chronicles"))],
    "H5315": [("soul", r"\bsouls?\b", ("DEU", 6, 5, "soul")), ("life", r"\b(life|lives)\b", ("EXO", 21, 23, "life")),
              ("person", r"\bpersons?\b", ("NUM", 31, 19, "person")), ("heart or mind", r"\b(heart|mind)s?\b", ("EXO", 23, 9, None)),
              ("creature", r"\bcreatures?\b", ("GEN", 1, 21, "living thing"))],
    "G3056": [("word", r"\bwords?\b", ("JHN", 1, 1, "Word")), ("saying", r"\bsayings?\b", ("JHN", 6, 60, "teaching")),
              ("speech", r"\bspeech\b", ("1CO", 2, 4, "message")), ("account", r"\baccounts?\b", ("MAT", 12, 36, "account")),
              ("matter", r"\bmatter\b", ("ACT", 15, 6, "matter"))],
    "G1411": [("power", r"\bpowers?\b", ("ROM", 1, 16, "power")), ("miracles", r"\bmiracles?\b", ("1CO", 12, 10, "miracles")),
              ("mighty works", r"\b(works?|mighty|wonderful)\b", ("MAT", 11, 20, "miracles")), ("strength", r"\bstrength\b", ("REV", 3, 8, "strength")),
              ("might", r"\bmight\b", ("EPH", 1, 21, "power")), ("virtue", r"\bvirtue\b", ("MRK", 5, 30, "power"))],
}
# G2424's King James English is "Jesus" throughout, so its groups are by who is meant. These verses are read by hand.
JESUS_OTHERS = [("Joshua", ("ACT", 7, 45, "Joshua")), ("Joshua", ("HEB", 4, 8, "Joshua")), ("Jesus called Justus", ("COL", 4, 11, "Jesus"))]
LEMMA_ONLY = ["G25", "G26", "G5368", "G4151", "H430"]
JOHN_21 = [15, 16, 17]
LOVE = re.compile(r"\b(love|loved|loveth|lovest|loving|lovers?)\b")
BUDGET_BYTES = 60_000
OTHER_CAP = 0.2


def fail(message: str) -> NoReturn:
    sys.exit(f"build-strongs-study: {message}")


def plain(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c))


def first_letter(lemma: str, letters: list[tuple[str, str]]) -> str | None:
    wanted = {a for a, _ in letters}
    for c in plain(lemma.split(",")[-1].lower()):
        c = FINAL_FORMS.get(c, c)
        if c in wanted:
            return c
    return None


def read_lexicon(path: Path, prefix: str, top: int) -> dict[int, tuple[str, str, str]]:
    """Each base number's first row: (lemma, transliteration, gloss). Rows may be lettered (H0122a) or sensed (G0001G)."""
    first = {}
    with open(path, encoding="utf-8") as rows:
        for line in rows:
            cols = line.split("\t")
            match = re.fullmatch(prefix + r"(\d{4})[a-zA-Z]?", cols[0].strip()) if len(cols) > 6 else None
            if match and 1 <= int(match[1]) <= top:
                first.setdefault(int(match[1]), (cols[3].strip(), cols[4].strip(), cols[6].strip()))
    return first


def in_order_run(values: list[int]) -> set[int]:
    """Indexes of a longest non-decreasing run (patience sorting): what is not in it is out of alphabetical place."""
    tails, tail_at, before = [], [], [-1] * len(values)
    for i, v in enumerate(values):
        at = bisect.bisect_right(tails, v)
        before[i] = tail_at[at - 1] if at else -1
        if at == len(tails):
            tails.append(v)
            tail_at.append(i)
        else:
            tails[at], tail_at[at] = v, i
    keep, i = set(), tail_at[-1]
    while i >= 0:
        keep.add(i)
        i = before[i]
    return keep


def alphabet_bands(lexicon: dict[int, tuple[str, str, str]], letters: list[tuple[str, str]], top: int) -> tuple[list[dict], list[int], int]:
    """The letter ranges, taken from the longest run in alphabetical order; each number joins the range it falls in."""
    order = {a: i for i, (a, _) in enumerate(letters)}
    numbers = sorted(n for n in lexicon if first_letter(lexicon[n][0], letters))
    values = [order[first_letter(lexicon[n][0], letters)] for n in numbers]
    keep = in_order_run(values)
    exceptions = [numbers[i] for i in range(len(numbers)) if i not in keep]
    starts = {}
    for i in sorted(keep):
        starts.setdefault(values[i], numbers[i])
    bands = []
    for at, (letter, name) in enumerate(letters):
        if at not in starts:
            fail(f"no number starts the letter {name}")
        after = [starts[k] for k in sorted(starts) if k > at]
        first = 1 if at == 0 else starts[at]
        last = after[0] - 1 if after else top
        lemma_text, translit, gloss = lexicon[starts[at]]
        bands.append({"letter": letter, "name": name, "from": first, "to": last, "first": {"n": starts[at], "lemma": lemma_text, "translit": translit, "gloss": gloss}})
    if bands[-1]["to"] != top or any(a["to"] + 1 != b["from"] for a, b in zip(bands, bands[1:])):
        fail("the letter ranges do not run unbroken to the last number")
    return bands, exceptions, len(numbers)


def run_text(run: object) -> str:
    if isinstance(run, str):
        return run
    return run[0] if isinstance(run, list) else ""


def verse_text(runs: list) -> str:
    return re.sub(r"\s+", " ", "".join(run_text(r) for r in runs)).strip()


def book_chapters(root: Path, code: str) -> Iterator[dict]:
    for path in sorted((root / code).glob("*.json")):
        yield from json.loads(path.read_text(encoding="utf-8")).values()


def tagged_places(runs: list) -> list[list[str]]:
    """[number, English] per tag: a tag holding several numbers counts once for each, and its letter suffix is dropped, as in useWordVerses."""
    return [[re.sub(r"[a-z]$", "", number), run[0]] for run in runs if isinstance(run, list) and len(run) == 3 for number in run[2].split()]


def scan_tags(kjv_root: Path) -> dict:
    """The whole tagged text, once: counts by number, renderings, which verses carry which tag, and the love tags."""
    counted, english, love = Counter(), defaultdict(Counter), Counter()
    verses = {}
    for code in [p.name for p in sorted(kjv_root.iterdir()) if p.is_dir()]:
        for chapter in book_chapters(kjv_root, code):
            for verse in chapter["v"]:
                places = tagged_places(verse["r"])
                verses[(code, int(chapter["c"]), int(verse["n"]))] = places
                for number, text in places:
                    clean = re.sub(r"\s+", " ", text.lower()).strip()
                    counted[number] += 1
                    english[number][clean] += 1
                    if number.startswith("G") and LOVE.search(clean):
                        love[number] += 1
    return {"counted": counted, "english": english, "love": love, "verses": verses}


def berean_verse(bsb_root: Path, code: str, chapter: int, verse: int) -> str:
    for found in book_chapters(bsb_root, code):
        if int(found["c"]) == chapter:
            for item in found["v"]:
                if item["n"] == str(verse):
                    return verse_text(item["r"])
    fail(f"the Berean has no {code} {chapter}:{verse}")


def sample_record(tags: dict, bsb_root: Path, number: str, pattern: str, sample: tuple) -> dict:
    code, chapter, verse, berean_word = sample
    places = [text.strip() for n, text in tags["verses"].get((code, chapter, verse), []) if n == number]
    match = next((t for t in places if re.search(pattern, t.lower())), None)
    if not match:
        fail(f"{code} {chapter}:{verse} has no {number} tag matching {pattern}; it has {places}")
    text = berean_verse(bsb_root, code, chapter, verse)
    if berean_word and berean_word.lower() not in text.lower():
        fail(f"{code} {chapter}:{verse}: the Berean has no '{berean_word}': {text}")
    return {"code": code, "chapter": chapter, "verse": verse, "kjv": match, "bsbWord": berean_word}


def rendering_groups(tags: dict, bsb_root: Path, number: str, groups: list[tuple]) -> tuple[list[dict], int]:
    counts = Counter()
    for english, count in tags["english"][number].items():
        label = next((g[0] for g in groups if re.search(g[1], english)), "other")
        counts[label] += count
    total = tags["counted"][number]
    if sum(counts.values()) != total:
        fail(f"{number}: groups sum to {sum(counts.values())}, tags to {total}")
    if counts["other"] / total > OTHER_CAP:
        fail(f"{number}: 'other' holds {counts['other']} of {total}; the groups are too thin: {tags['english'][number].most_common(30)}")
    rows = [{"label": g[0], "count": counts[g[0]], "sample": sample_record(tags, bsb_root, number, g[1], g[2])} for g in groups]
    return sorted(rows, key=lambda r: -r["count"]), counts["other"]


def jesus_groups(tags: dict, bsb_root: Path) -> list[dict]:
    number, total = "G2424", tags["counted"]["G2424"]
    rows = {}
    for label, sample in JESUS_OTHERS:
        record = sample_record(tags, bsb_root, number, r"jesus", sample)
        rows.setdefault(label, {"label": label, "count": 0, "sample": record})["count"] += 1
    rest = total - sum(r["count"] for r in rows.values())
    main = {"label": "Jesus of Nazareth (all the rest)", "count": rest, "sample": sample_record(tags, bsb_root, number, r"jesus", ("JHN", 11, 35, "Jesus"))}
    return [main, *rows.values()]


def lemma(number: str, greek: dict, hebrew: dict) -> dict:
    entry = (greek if number[0] == "G" else hebrew).get(int(number[1:]))
    if not entry:
        fail(f"no lexicon row for {number}")
    return {"id": number, "lang": "greek" if number[0] == "G" else "hebrew", "lemma": entry[0], "translit": entry[1], "gloss": entry[2]}


def build(site: Path, sources: Path) -> None:
    kjv, bsb = site / "data/text/kjv", site / "data/text/bsb"
    greek = read_lexicon(sources / "TBESG.txt", "G", GREEK_TOP)
    hebrew = read_lexicon(sources / "TBESH.txt", "H", HEBREW_TOP)
    missing_greek = set(range(1, GREEK_TOP + 1)) - set(greek)
    if missing_greek != GREEK_UNUSED:
        fail(f"unused Greek numbers differ from 2717 and 3203-3302: {sorted(missing_greek ^ GREEK_UNUSED)[:10]}")
    if len(hebrew) != HEBREW_TOP:
        fail(f"expected a row for all {HEBREW_TOP} Hebrew numbers, found {len(hebrew)}")
    greek_bands, greek_out, greek_read = alphabet_bands(greek, GREEK_LETTERS, GREEK_TOP)
    hebrew_bands, hebrew_out, hebrew_read = alphabet_bands(hebrew, HEBREW_LETTERS, HEBREW_TOP)
    tags = scan_tags(kjv)

    words = []
    for number, groups in FEATURED.items():
        rows, other = rendering_groups(tags, bsb, number, groups)
        words.append({**lemma(number, greek, hebrew), "total": tags["counted"][number], "rows": rows, "other": other})
    words.append({**lemma("G2424", greek, hebrew), "total": tags["counted"]["G2424"], "rows": jesus_groups(tags, bsb), "other": 0})

    john = [{"verse": v, "numbers": [n for n, t in tags["verses"][("JHN", 21, v)] if LOVE.search(t.lower())]} for v in JOHN_21]
    data = {
        "counts": {
            "rawTags": sum(tags["counted"].values()),
            "numbersTagged": {"hebrew": sum(n[0] == "H" for n in tags["counted"]), "greek": sum(n[0] == "G" for n in tags["counted"])},
            "hebrewTop": HEBREW_TOP, "greekTop": GREEK_TOP, "greekUnused": len(GREEK_UNUSED),
        },
        "bands": {"greek": greek_bands, "hebrew": hebrew_bands},
        "outOfPlace": {"greek": {"read": greek_read, "count": len(greek_out), "numbers": greek_out},
                       "hebrew": {"read": hebrew_read, "count": len(hebrew_out), "numbers": hebrew_out}},
        "words": words,
        "lemmas": [lemma(n, greek, hebrew) for n in LEMMA_ONLY],
        "love": {"numbers": [{"id": n, "count": c} for n, c in tags["love"].most_common()], "john21": john},
        "samples": {
            "exodus21": sample_record(tags, bsb, "H430", r"judges", ("EXO", 21, 6, "judges")),
            "john3": sample_record(tags, bsb, "G4151", r"wind", ("JHN", 3, 8, "wind")),
            "exodus10": sample_record(tags, bsb, "H7307", r"wind", ("EXO", 10, 13, "wind")),
            "romans1": sample_record(tags, bsb, "G1411", r"power", ("ROM", 1, 16, "power")),
        },
    }
    out = site / "src/pages/study/strongs/strongs-data.json"
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(text.encode("utf8")) > BUDGET_BYTES:
        fail(f"the data is {len(text.encode('utf8'))} bytes, over the {BUDGET_BYTES} budget")
    out.write_text(text + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(text.encode('utf8'))} bytes): {data['counts']}; Greek out of place {len(greek_out)} of {greek_read}; Hebrew {len(hebrew_out)} of {hebrew_read}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    here = Path(__file__).resolve().parent.parent
    parser.add_argument("--site", type=Path, default=here)
    parser.add_argument("--sources", type=Path, default=here.parent / "sources/stepbible")
    args = parser.parse_args()
    build(args.site, args.sources)


if __name__ == "__main__":
    main()
