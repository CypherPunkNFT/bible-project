"""Reading the Berean for the Angels, demons and spiritual powers mock-up (a copy of The good news mock-up's reader). Every Bible check in build-data.py rests on these."""
import html
import json
import re
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
BSB = WEBSITE / "data/plain/bsb"
BOOKS = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU", "Joshua": "JOS",
    "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
    "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB",
    "Psalm": "PSA", "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Songs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
    "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
    "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL", "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
    "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL",
    "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
    "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
    "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV",
}
CANON = list(BOOKS.values())
REF_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?")


class BuildError(Exception):
    """A check failed; the build exits 1 and data.js is left as it was."""


def fold(text: str) -> str:
    """Compare text regardless of curly or straight quotes and dash kind."""
    return text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}))


def has_words(phrase: str, text: str) -> bool:
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


def typographic(text: str) -> str:
    """Straight quotes in the study text become the curly ones the Berean uses. Runs after the quotation checks."""
    return re.sub(r'"([^"]*)"', "“\\1”", text).replace("'", "’")


def load_bible() -> dict:
    bible = {}
    for code in CANON:
        path = BSB / f"{code}.json"
        try:
            bible[code] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read Berean book {code} at {path}: {error}") from error
    return bible


def held_paragraphs(path: Path, opens: str | None, closes: str | None) -> list:
    """The paragraphs of one held source, limited to the part read, so a quotation cannot pass on text from another book."""
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix == ".json":
            sections = json.loads(raw)["sections"]
            return [fold(re.sub(r"\s+", " ", piece)) for section in sections for piece in (section.get("text") or "").split("\n\n")]
    except (OSError, ValueError, KeyError) as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    raw = re.sub(r"<note.*?</note>", "", raw, flags=re.S)
    pieces = [fold(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", piece)))) for piece in re.split(r"</?(?:p|div\d?|h\d)\b[^>]*>", raw)]
    if not opens:
        return pieces
    start = next((i for i, p in enumerate(pieces) if p.strip().startswith(opens) or f"{opens} Commentary" in p[:60] or opens in p[:40]), None)
    if start is None:
        raise BuildError(f"could not find the part {opens!r} in {path}")
    end = next((i for i in range(start + 1, len(pieces)) if pieces[i].strip().startswith(f"{closes} Commentary") or (closes and closes in pieces[i][:40])), len(pieces))
    return pieces[start:end]


def verses_of(bible: dict, label: str) -> tuple:
    """Every (chapter, verse, text) in a reference. Fails if a verse is missing or the range has a gap."""
    match = REF_RE.fullmatch(label)
    if not match:
        raise BuildError(f"not a whole Scripture reference: {label!r}")
    name, c1, v1, c2, v2 = match.groups()
    code = BOOKS[name]
    c1, v1 = int(c1), int(v1)
    c2, v2 = int(c2) if c2 else c1, int(v2) if v2 else v1
    if (c2, v2) < (c1, v1):
        raise BuildError(f"reference runs backwards: {label}")
    keys = sorted(tuple(map(int, key.split(":"))) for key in bible[code])
    found = [(c, v, bible[code][f"{c}:{v}"]) for c, v in keys if (c1, v1) <= (c, v) <= (c2, v2)]
    if not found or found[0][:2] != (c1, v1) or found[-1][:2] != (c2, v2):
        raise BuildError(f"reference does not resolve in the Berean: {label}")
    for (c_a, v_a, _), (c_b, v_b, _) in zip(found, found[1:]):
        if not ((c_a == c_b and v_b == v_a + 1) or (c_b == c_a + 1 and v_b == 1)):
            raise BuildError(f"gap in {label} between {c_a}:{v_a} and {c_b}:{v_b}")
    return code, found


def ref_id(label: str) -> str:
    name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
    end = f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else "")
    return f"{BOOKS[name]}.{c1}.{v1}{end}"


def plain_text(bible: dict, label: str) -> str:
    _, verses = verses_of(bible, label)
    return fold(" ".join(v[2] for v in verses)).replace('"', "")


def in_verse(bible: dict, label: str, phrase: str) -> None:
    if not has_words(fold(phrase).replace('"', ""), plain_text(bible, label)):
        raise BuildError(f"phrase not found, as whole words, in {label}: {phrase!r}")
