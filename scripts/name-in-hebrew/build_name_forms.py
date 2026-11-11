"""Build the Strong's spellings the name page (/name-in-hebrew) needs, once, into src/pages/name-in-hebrew/.

Writes two small files (design: docs/features/name-in-hebrew/design.md, "Review"):
  hebrew-behind.json  For each New Testament name whose Greek original Strong's derives from a Hebrew *name*
                      ("of Hebrew origin (H3110)"), that Hebrew name: {"H3110": {"word": "יוֹחָנָן", "name": "Jochanan"}}.
                      Kept only when Strong's tags the Hebrew entry a proper name (pos "n-pr…"), so Melchi's
                      מֶלֶךְ ("king") is left out, and only for name files with no Hebrew original of their own.
  bible-words.json    The Bible words people type as names (God, Lord, Grace, Faith…), each with its Hebrew and Greek
                      word as Strong's spells it. The list itself (numbers, verse, wording) is WORDS below.

Reads the baby-name files (data/baby-names/names/, built by scripts/bible/build_baby_names.py, git-ignored) and the
Strong's dictionaries already registered in SOURCES.md (Open Scriptures HebrewStrong.xml, CC BY 4.0; Ulrik Petersen's
strongsgreek.xml, public domain), through the baby-names build's own readers.

Run: py -3.12 scripts/name-in-hebrew/build_name_forms.py
"""

import json
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[0] / "bible" / "baby-names"))
sys.path.insert(0, str(HERE.parents[0]))

from bible.paths import SITE, sources_dir  # noqa: E402
from bn_sources import read_greek_strongs, read_hebrew_strongs  # noqa: E402

OUT = SITE / "src" / "pages" / "name-in-hebrew"
NAMES = SITE / "data" / "baby-names" / "names"

# kind "god": a name of God or of Christ, shown with no spelling by sound. kind "word": a Bible word people also use as
# a name (Grace, Faith), shown with its Bible word and then by sound. `ref` is a verse that uses the English word in the
# Berean Standard Bible (checked by bible-spelling.test.ts against data/plain/bsb). What the page says about each word is
# in src/pages/name-in-hebrew/word-texts.ts, where the translation collector reads it.
WORDS = [
    {"keys": ["god", "elohim"], "kind": "god", "hebrew": "H430", "greek": "G2316", "ref": "GEN 1:1"},
    {"keys": ["lord", "yahweh", "jehovah", "yhwh"], "kind": "god", "hebrew": "H3068", "greek": "G2962", "ref": "EXO 3:15"},
    {"keys": ["christ", "messiah"], "kind": "god", "hebrew": "H4899", "greek": "G5547", "ref": "JHN 1:41"},
    {"keys": ["christian"], "kind": "word", "hebrew": None, "greek": "G5546", "ref": "ACT 11:26"},
    {"keys": ["grace"], "kind": "word", "hebrew": "H2580", "greek": "G5485", "ref": "EPH 2:8"},
    {"keys": ["faith"], "kind": "word", "hebrew": "H530", "greek": "G4102", "ref": "HEB 11:1"},
    {"keys": ["hope"], "kind": "word", "hebrew": "H8615", "greek": "G1680", "ref": "ROM 15:13"},
    {"keys": ["joy"], "kind": "word", "hebrew": "H8057", "greek": "G5479", "ref": "NEH 8:10"},
    {"keys": ["peace"], "kind": "word", "hebrew": "H7965", "greek": "G1515", "ref": "JHN 14:27"},
    {"keys": ["love"], "kind": "word", "hebrew": "H160", "greek": "G26", "ref": "1JN 4:8"},
    {"keys": ["amen"], "kind": "word", "hebrew": "H543", "greek": "G281", "ref": "REV 22:21"},
    {"keys": ["hosanna"], "kind": "word", "hebrew": None, "greek": "G5614", "ref": "MAT 21:9"},
    {"keys": ["selah"], "kind": "word", "hebrew": "H5542", "greek": None, "ref": "PSA 46:3"},
]


# The English name a Hebrew entry is known by: the first word of Strong's KJV usage ("Jacob.", "Johanan."), except where
# that is an older spelling the Berean Standard Bible does not use.
ENGLISH_NAME = {"H3091": "Joshua", "H5417": "Nethanel", "H6439": "Penuel", "H7018": "Kenan", "H7974": "Shelah", "H8096": "Shimei"}
# God's name is shown as its four letters, unpointed: Strong's prints it with the vowels of "Jehovah" (יְהֹוָה).
WORD_OVERRIDE = {"H3068": "יהוה"}


def first_form(word: str) -> str:
    return unicodedata.normalize("NFC", word.split(", ")[0].strip())


def english_name(code: str, usage: str) -> str:
    return ENGLISH_NAME.get(code) or usage.split(",")[0].split(".")[0].strip()


def hebrew_behind(hebrew: dict) -> dict:
    found = {}
    for path in sorted(NAMES.glob("*.json")):
        document = json.loads(path.read_text(encoding="utf-8"))
        originals = document.get("originals") or []
        if any(original.get("script") == "he" for original in originals):
            continue
        for original in originals:
            chain = [code for code in (original.get("meaning") or {}).get("chain", []) if code.startswith("H")]
            entry = hebrew.get(chain[0]) if chain else None
            if entry and entry.is_name and entry.word:
                found[entry.id] = {"word": first_form(entry.word), "name": english_name(entry.id, entry.usage)}
    return dict(sorted(found.items(), key=lambda item: int(item[0][1:])))


def bible_words(hebrew: dict, greek: dict) -> list:
    words = []
    for spec in WORDS:
        row = {key: spec[key] for key in ("keys", "kind", "ref")}
        for side, lexicon in (("hebrew", hebrew), ("greek", greek)):
            code = spec[side]
            if code is None:
                row[side] = None
                continue
            entry = lexicon.get(code)
            if not entry or not entry.word:
                raise SystemExit(f"build_name_forms: Strong's {code} ({spec['keys'][0]}) has no {side} word in the dictionary")
            row[side] = {"strongs": code, "word": WORD_OVERRIDE.get(code) or first_form(entry.word)}
        words.append(row)
    return words


def main() -> None:
    if not NAMES.is_dir():
        raise SystemExit(f"build_name_forms: {NAMES} is missing; run scripts/bible/build_baby_names.py first")
    sources = sources_dir()
    hebrew = read_hebrew_strongs(sources / "openscriptures" / "HebrewLexicon" / "HebrewLexicon-master" / "HebrewStrong.xml")
    greek = read_greek_strongs(sources / "openscriptures" / "strongs" / "strongs-master" / "greek" /
                               "StrongsGreekDictionaryXML_1.4" / "strongsgreek.xml")
    behind = hebrew_behind(hebrew)
    words = bible_words(hebrew, greek)
    for name, value in (("hebrew-behind.json", behind), ("bible-words.json", words)):
        (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"build_name_forms: {len(behind)} Hebrew names behind Greek ones, {len(words)} Bible words -> {OUT}")


if __name__ == "__main__":
    main()
