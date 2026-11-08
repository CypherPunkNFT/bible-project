"""Odd one out: read the site's existing data (design section 3). Nothing here writes."""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
DATA = SITE / "data"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def split_ref(verse_id: int) -> tuple[int, int, int]:
    return verse_id // 1_000_000, verse_id // 1000 % 1000, verse_id % 1000


class Catalogue:
    """The 66 books of the Protestant canon (the Apocrypha is left out, design 5.1)."""

    def __init__(self):
        books = [b for b in read_json(DATA / "catalog.json")["books"] if b["num"] <= 66]
        self.books = sorted(books, key=lambda b: b["num"])
        self.by_num = {b["num"]: b for b in self.books}
        self.by_code = {b["code"]: b for b in self.books}

    def name_words(self) -> set[str]:
        """Book names without their number: 'John', 'Peter', 'Samuel', 'Song of Songs'."""
        return {re.sub(r"^\d\s+", "", b["name"]) for b in self.books}


class Bible:
    """The BSB text, for chapter counts, verse checks and the key-verse quotes (design 5.5)."""

    def __init__(self, catalogue: Catalogue, root: Path = DATA / "text" / "bsb"):
        self.catalogue = catalogue
        self.root = root
        self._books: dict[str, dict[int, dict[int, str]]] = {}

    def book(self, code: str) -> dict[int, dict[int, str]]:
        if code not in self._books:
            chapters: dict[int, dict[int, str]] = {}
            files = sorted((self.root / code).glob("*.json"))
            if not files:
                raise FileNotFoundError(f"BSB text for {code} not found under {self.root}")
            for path in files:
                for number, chapter in read_json(path).items():
                    verses = {int(v["n"]): "".join(t for t in v["r"] if isinstance(t, str)) for v in chapter["v"]
                              if str(v["n"]).isdigit()}
                    chapters[int(number)] = {n: re.sub(r"\s+", " ", text).strip() for n, text in verses.items()}
            self._books[code] = chapters
        return self._books[code]

    def code(self, verse_id: int) -> str:
        num = split_ref(verse_id)[0]
        if num not in self.catalogue.by_num:
            raise ValueError(f"verse id {verse_id}: book {num} is not one of the 66 books")
        return self.catalogue.by_num[num]["code"]

    def chapters(self, code: str) -> int:
        return len(self.book(code))

    def text(self, verse_id: int) -> str | None:
        _, chapter, verse = split_ref(verse_id)
        return self.book(self.code(verse_id)).get(chapter, {}).get(verse)

    def quote(self, start: int, end: int) -> str:
        """One short BSB quote of at most two verses in one chapter."""
        if start // 1000 != end // 1000 or not 0 <= end - start <= 1:
            raise ValueError(f"key verse {start}-{end}: expected one or two verses in one chapter")
        parts = [self.text(v) for v in range(start, end + 1)]
        if any(part is None for part in parts):
            raise ValueError(f"key verse {start}-{end}: not found in the BSB text")
        return " ".join(parts)


def load_people() -> list[dict]:
    return read_json(DATA / "study" / "people.json")


def load_person(person_id: str) -> dict:
    return read_json(DATA / "study" / "people" / f"{person_id}.json")


def load_places() -> list[dict]:
    return read_json(DATA / "places.json")


def load_people_pages() -> dict[str, list[dict]]:
    """Group file name -> its member entries (rulers, prophets, apostles) from src/data/people-pages."""
    groups = {}
    for path in sorted((SITE / "src" / "data" / "people-pages").glob("*.json")):
        if path.stem == "index":
            continue
        data = read_json(path)
        groups[path.stem] = [m for key in ("rulers", "prophets", "apostles") for m in data.get(key, [])]
    return groups


def load_apostle_ids() -> list[str]:
    folder = SITE / "src" / "data" / "apostle-pages"
    return sorted(p.stem for p in folder.glob("*.json") if p.stem not in ("index", "books"))


def load_paul_places() -> dict[str, int]:
    """Place id -> first verse, for the places on Paul's apostle page (traditions left out)."""
    page = read_json(SITE / "src" / "data" / "apostle-pages" / "paul-act-7-58.json")
    return {p["placeId"]: p["refs"][0][0] for p in page["places"] if not p.get("tradition") and p.get("refs")}


def load_prophets() -> dict[str, dict]:
    return {p["id"]: p for p in read_json(DATA / "study" / "prophets.json")}


def load_letters() -> dict[str, dict]:
    return {letter["code"]: letter for letter in read_json(DATA / "study" / "letters.json")}


def load_slugs() -> dict[str, str]:
    """Person id -> readable address segment."""
    slugs = read_json(SITE / "src" / "data" / "people-slugs.json")["slugs"]
    return {person_id: slug for slug, person_id in slugs.items()}


def bank_tags() -> tuple[Counter, Counter]:
    """How often each display name is tagged in the question bank, for people and for places (a fame signal)."""
    people, places = Counter(), Counter()
    for question in read_json(DATA / "questions" / "bank.json")["questions"]:
        people.update(set(question.get("people") or []))
        places.update(set(question.get("places") or []))
    return people, places


def names_index(entries: list[dict], name_key: str, count) -> dict[str, list[tuple[int, str]]]:
    """Name -> [(mentions, id)] over every entry, to spot shared names."""
    index: dict[str, list[tuple[int, str]]] = defaultdict(list)
    for entry in entries:
        index[entry[name_key]].append((count(entry), entry["id"]))
    return index
