"""Bible twenty questions: verse references from the model passes and the hand files (design §5.3, §5.4).

Parses "Mark 9:4", "1 Kgs 2:11", "Exo.2.3-10", "EXO 4:3" and the like into a verse id (BBCCCVVV), and checks that a verse
belongs to the person: it lies in their verse list, or in a chapter of it, or (only when their first name is unique in the
people list) its BSB text names them. Ranges keep their first verse. Chapter-only references do not parse.
"""
import re
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
sys.path.insert(0, str(SITE / "scripts" / "odd-one-out"))
from ooo_data import Bible, Catalogue, load_people  # noqa: E402

ALIASES = {  # lower-case, no spaces or dots -> catalogue code; the catalogue's own names and codes are added at load
    "gen": "GEN", "ge": "GEN", "exod": "EXO", "exo": "EXO", "ex": "EXO", "lev": "LEV", "le": "LEV", "num": "NUM", "nu": "NUM",
    "deut": "DEU", "deu": "DEU", "dt": "DEU", "josh": "JOS", "jos": "JOS", "judg": "JDG", "jdg": "JDG", "jg": "JDG", "ru": "RUT",
    "rut": "RUT", "1sam": "1SA", "1sa": "1SA", "1sm": "1SA", "2sam": "2SA", "2sa": "2SA", "2sm": "2SA", "1kgs": "1KI", "1ki": "1KI",
    "1kg": "1KI", "2kgs": "2KI", "2ki": "2KI", "2kg": "2KI", "1chr": "1CH", "1chron": "1CH", "1ch": "1CH", "2chr": "2CH",
    "2chron": "2CH", "2ch": "2CH", "ezr": "EZR", "neh": "NEH", "ne": "NEH", "esth": "EST", "est": "EST", "es": "EST", "jb": "JOB",
    "ps": "PSA", "psa": "PSA", "psalm": "PSA", "pss": "PSA", "prov": "PRO", "pro": "PRO", "pr": "PRO", "eccl": "ECC", "ecc": "ECC",
    "ec": "ECC", "qoh": "ECC", "song": "SNG", "sng": "SNG", "songofsolomon": "SNG", "songofsongs": "SNG", "sos": "SNG", "canticles": "SNG",
    "isa": "ISA", "is": "ISA", "jer": "JER", "je": "JER", "lam": "LAM", "la": "LAM", "ezek": "EZK", "ezk": "EZK", "eze": "EZK",
    "dan": "DAN", "da": "DAN", "hos": "HOS", "ho": "HOS", "jol": "JOL", "joe": "JOL", "am": "AMO", "amo": "AMO", "obad": "OBA",
    "oba": "OBA", "ob": "OBA", "jon": "JON", "jnh": "JON", "mic": "MIC", "mi": "MIC", "nah": "NAM", "nam": "NAM", "na": "NAM",
    "hab": "HAB", "zeph": "ZEP", "zep": "ZEP", "hag": "HAG", "hg": "HAG", "zech": "ZEC", "zec": "ZEC", "zc": "ZEC", "mal": "MAL",
    "ml": "MAL", "matt": "MAT", "mat": "MAT", "mt": "MAT", "mrk": "MRK", "mk": "MRK", "mr": "MRK", "luk": "LUK", "lk": "LUK",
    "lu": "LUK", "jhn": "JHN", "jn": "JHN", "joh": "JHN", "act": "ACT", "ac": "ACT", "rom": "ROM", "ro": "ROM", "1cor": "1CO",
    "1co": "1CO", "2cor": "2CO", "2co": "2CO", "gal": "GAL", "ga": "GAL", "eph": "EPH", "phil": "PHP", "php": "PHP", "phlp": "PHP",
    "col": "COL", "1thess": "1TH", "1thes": "1TH", "1th": "1TH", "2thess": "2TH", "2thes": "2TH", "2th": "2TH", "1tim": "1TI",
    "1ti": "1TI", "2tim": "2TI", "2ti": "2TI", "tit": "TIT", "ti": "TIT", "philem": "PHM", "phlm": "PHM", "phm": "PHM", "heb": "HEB",
    "jas": "JAS", "jam": "JAS", "1pet": "1PE", "1pe": "1PE", "1pt": "1PE", "2pet": "2PE", "2pe": "2PE", "2pt": "2PE", "1jn": "1JN",
    "1john": "1JN", "1jo": "1JN", "2jn": "2JN", "2john": "2JN", "3jn": "3JN", "3john": "3JN", "jud": "JUD", "jde": "JUD",
    "rev": "REV", "re": "REV", "revelations": "REV", "apocalypse": "REV",
}
ROMAN = {"i": "1", "ii": "2", "iii": "3", "first": "1", "second": "2", "third": "3", "1st": "1", "2nd": "2", "3rd": "3"}
PARTS = re.compile(r"^\s*(?:(\d|i{1,3}|1st|2nd|3rd|first|second|third)\s*)?([a-z][a-z ]*?)\s*[. ]\s*(\d{1,3})\s*[:.]\s*(\d{1,3})"
                   r"(?:\s*[-–—]\s*\d{1,3}(?:\s*[:.]\s*\d{1,3})?)?\s*[a-c]?\s*(?:\(.*\))?\s*$", re.IGNORECASE)
SINGLE_CHAPTER = {"OBA", "PHM", "2JN", "3JN", "JUD"}


class Refs:
    """Turns a reference string into a verse id and checks it against the BSB text and the person (design §5.4)."""

    def __init__(self):
        self.catalogue = Catalogue()
        self.bible = Bible(self.catalogue)
        self.by_name = dict(ALIASES)
        for code, book in self.catalogue.by_code.items():
            self.by_name[squash(book["name"])] = code
            self.by_name[code.lower()] = code
        first_names = Counter(person["n"].split()[0] for person in load_people())
        self.unique_first = {name for name, count in first_names.items() if count == 1}

    def parse(self, text: str) -> int | None:
        """A verse id, or None when the text is not one verse reference ("Obadiah 1" counts as Obadiah 1:1)."""
        if not text or not isinstance(text, str):
            return None
        clean = text.strip().rstrip(".;,")
        match = PARTS.match(clean)
        if not match:
            single = re.match(r"^\s*(obadiah|oba|philemon|phlm|phm|2 ?john|2jn|3 ?john|3jn|jude|jud)\s+(\d{1,2})\s*$", clean, re.IGNORECASE)
            if not single:
                return None
            code = self.by_name.get(squash(single[1]))
            return self._verse(code, 1, int(single[2])) if code in SINGLE_CHAPTER else None
        number, name, chapter, verse = match.groups()
        key = (ROMAN.get(number.lower(), number) if number else "") + squash(name)
        code = self.by_name.get(key)
        if code is None:
            return None
        return self._verse(code, int(chapter), int(verse))

    def _verse(self, code: str, chapter: int, verse: int) -> int | None:
        if not (1 <= chapter < 1000 and 1 <= verse < 1000):
            return None
        verse_id = self.catalogue.by_code[code]["num"] * 1_000_000 + chapter * 1000 + verse
        return verse_id if self.bible.text(verse_id) is not None else None

    def fits(self, verse: int, person: dict, names: list[str], own_books: set[int] = frozenset()) -> str | None:
        """None when the verse is real and belongs to the person; otherwise why not. own_books: letters they wrote."""
        text = self.bible.text(verse)
        if text is None:
            return "not in the BSB text"
        refs = person.get("refs") or []
        if verse in refs or any(verse // 1000 == ref // 1000 for ref in refs) or verse // 1_000_000 in own_books:
            return None
        first = names[0].split()[0] if names else ""
        if first in self.unique_first and any(re.search(rf"\b{re.escape(name)}\b", text) for name in names if name):
            return None
        return "outside the person's verses" + ("" if first in self.unique_first else f" (other people are called {first}, so the name alone is not enough)")

    def label(self, verse: int) -> str:
        book = self.catalogue.by_code[self.bible.code(verse)]["name"]
        return f"{book} {verse // 1000 % 1000}:{verse % 1000}"


# Letters that open with the person's name as writer (data tag letter-writer = yes): their own words count as their verses.
OWN_LETTERS = {"paul-act-7-58": set(range(45, 58)), "peter-mat-4-18": {60, 61}, "jude-mat-13-55": {65}}


def squash(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def names_of(label: str, row: dict) -> list[str]:
    """The names a verse may use for the person: the people-list name first, then other names and the label's first word."""
    main = row["n"]
    others = {*row.get("o", []), label.split(" (")[0]}
    firsts = {w.split()[0] for w in (main, *others) if w and w.split()[0][0].isupper()}
    return [main, *sorted((others | firsts) - {main})]
