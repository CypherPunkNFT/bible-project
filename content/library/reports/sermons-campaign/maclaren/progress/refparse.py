"""Parse Maclaren-style printed references ('ACTS i. 1, 2; xxviii. 30, 31', '2 Cor. vii. 1')
and check them against KJV chapter/verse counts read from the local eBible KJV USFM files.
Used only to flag possible misprints; never to supply a missing reference."""
import pathlib
import re

KJV_DIR = pathlib.Path(r"D:\FortressOfSolitude\Jarvis\Projects\BibleProject\sources\ebible\eng-kjv")

CODES = {
    "GEN": "genesis", "EXO": "exodus", "LEV": "leviticus", "NUM": "numbers", "DEU": "deuteronomy",
    "JOS": "joshua", "JDG": "judges", "RUT": "ruth", "1SA": "1samuel", "2SA": "2samuel",
    "1KI": "1kings", "2KI": "2kings", "1CH": "1chronicles", "2CH": "2chronicles", "EZR": "ezra",
    "NEH": "nehemiah", "EST": "esther", "JOB": "job", "PSA": "psalms", "PRO": "proverbs",
    "ECC": "ecclesiastes", "SNG": "songofsolomon", "ISA": "isaiah", "JER": "jeremiah",
    "LAM": "lamentations", "EZK": "ezekiel", "DAN": "daniel", "HOS": "hosea", "JOL": "joel",
    "AMO": "amos", "OBA": "obadiah", "JON": "jonah", "MIC": "micah", "NAM": "nahum",
    "HAB": "habakkuk", "ZEP": "zephaniah", "HAG": "haggai", "ZEC": "zechariah", "MAL": "malachi",
    "MAT": "matthew", "MRK": "mark", "LUK": "luke", "JHN": "john", "ACT": "acts", "ROM": "romans",
    "1CO": "1corinthians", "2CO": "2corinthians", "GAL": "galatians", "EPH": "ephesians",
    "PHP": "philippians", "COL": "colossians", "1TH": "1thessalonians", "2TH": "2thessalonians",
    "1TI": "1timothy", "2TI": "2timothy", "TIT": "titus", "PHM": "philemon", "HEB": "hebrews",
    "JAS": "james", "1PE": "1peter", "2PE": "2peter", "1JN": "1john", "2JN": "2john",
    "3JN": "3john", "JUD": "jude", "REV": "revelation",
}
OVERRIDES = {
    "ps": "psalms", "psa": "psalms", "psalm": "psalms", "phil": "philippians", "philem": "philemon",
    "song": "songofsolomon", "cant": "songofsolomon", "canticles": "songofsolomon",
    "songofsol": "songofsolomon", "eccl": "ecclesiastes", "eccles": "ecclesiastes",
    "judg": "judges", "jas": "james", "mk": "mark", "lk": "luke", "mt": "matthew",
    "jn": "john", "jno": "john", "jude": "jude", "stjohn": "john", "exod": "exodus",
    "ezek": "ezekiel", "zech": "zechariah", "zeph": "zephaniah", "hab": "habakkuk", "hag": "haggai",
}
NUMWORDS = {"i": "1", "ii": "2", "iii": "3", "1": "1", "2": "2", "3": "3", "first": "1",
            "second": "2", "third": "3"}
ROMAN = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100}


def load_counts():
    counts = {}
    for f in KJV_DIR.glob("*.usfm"):
        m = re.match(r"\d+-([0-9A-Z]{3})eng-kjv\.usfm$", f.name)
        if not m or m.group(1) not in CODES:
            continue
        book = {}
        chapter = 0
        for line in f.read_text(encoding="utf-8").splitlines():
            c = re.match(r"\\c\s+(\d+)", line)
            if c:
                chapter = int(c.group(1))
                book[chapter] = 0
            for v in re.finditer(r"\\v\s+(\d+)", line):
                book[chapter] = max(book.get(chapter, 0), int(v.group(1)))
        counts[CODES[m.group(1)]] = book
    return counts


def roman_to_int(s):
    s = s.lower()
    if not s or any(ch not in ROMAN for ch in s):
        return None
    total = 0
    for i, ch in enumerate(s):
        val = ROMAN[ch]
        total += -val if i + 1 < len(s) and ROMAN[s[i + 1]] > val else val
    return total


def resolve_book(prefix, name, names):
    key = re.sub(r"[^a-z]", "", name.lower())
    if not key:
        return None
    num = NUMWORDS.get((prefix or "").strip().lower().rstrip("."), "")
    if key in OVERRIDES and not num:
        return OVERRIDES[key]
    full = num + key
    if full in names:
        return full
    cands = [n for n in names if n.startswith(full) and (bool(num) == n[0].isdigit())]
    return cands[0] if len(cands) == 1 else None


BOOK_RE = re.compile(r"^\s*(?:(I{1,3}|[123]|First|Second|Third)\.?\s+)?((?:St\.?\s+)?[A-Za-z][A-Za-z.]*(?:\s+of\s+[A-Za-z.]+)?)\s*\.?\s*(.*)$", re.I)


def parse_ref(ref, names, default_book=None):
    """Return list of (book, chapter, first_verse, last_verse|None) or [] if unparseable."""
    ref = re.sub(r"\((?:R|A)\.\s*V\.[^)]*\)|\bR\.\s*V\.|\bA\.\s*V\.|\bmargin\b", " ", ref)
    out = []
    book = default_book
    for part in re.split(r";", ref):
        part = part.strip(" .,:)(—–-")
        if not part:
            continue
        m = BOOK_RE.match(part)
        rest = part
        if m and roman_to_int(m.group(2).rstrip(".")) is None:
            b = resolve_book(m.group(1), m.group(2), names)
            if b:
                book, rest = b, m.group(3)
            else:
                return []
        cm = re.match(r"^\s*([ivxlcIVXLC]+)\b\.?\s*(.*)$", rest)
        if cm and book is not None:
            chapter = roman_to_int(cm.group(1))
            verses = cm.group(2)
        elif re.match(r"^\s*\d", rest) and out:
            chapter, verses = out[-1][1], rest  # '; 16-20' continues the previous chapter
        else:
            return []
        nums = re.findall(r"(\d+)(?:\s*[-–]\s*(\d+))?", verses)
        if not nums:
            out.append((book, chapter, None, None))
        for a, b in nums:
            out.append((book, chapter, int(a), int(b) if b else None))
    return out


def check(parsed, counts):
    """Return a list of human-readable problems against KJV versification."""
    problems = []
    for book, ch, v1, v2 in parsed:
        chapters = counts.get(book, {})
        if ch not in chapters:
            problems.append(f"{book} has no chapter {ch} in the KJV")
            continue
        for v in (v1, v2):
            if v is not None and v > chapters[ch]:
                problems.append(f"{book} {ch} has only {chapters[ch]} verses in the KJV (printed verse {v})")
        if v1 and v2 and v2 < v1:
            problems.append(f"verse range {v1}-{v2} runs backwards")
    return problems
