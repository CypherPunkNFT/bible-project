#!/usr/bin/env python3
"""Check the site's own life stories (content/people/stories/*.json; format in that folder's README.md) against the
site's KJV and people.

    D:/Python/python.exe scripts/check-people-stories.py                 # all files
    D:/Python/python.exe scripts/check-people-stories.py apostles.json   # one file
Checks: the shape; every person id has a file in data/study/people (and is not a duplicate record); every paragraph has
verse spans that exist in the KJV; every quotation in double quotes matches the KJV of that paragraph's verses word for
word (punctuation and capitals ignored; "..." may join two pieces of one quotation); `short` is under 30 words; no
confidence words (undoubtedly, surely, clearly, proves, obviously, certainly) or BC/AD dates in our own words.
Exit code 1 when anything fails; each failure names the file, the person and the paragraph.
"""
import bisect
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
STORIES = SITE / "content" / "people" / "stories"
PEOPLE = SITE / "data" / "study" / "people"
sys.path.insert(0, str(SITE / "scripts"))
from bible.people_stories import StoryError, check_story_shape  # noqa: E402

# Reuse the Letters checker's verse loader, as scripts/check-people-pages.py does.
_spec = importlib.util.spec_from_file_location("check_letters", SITE / "scripts" / "check-letters-data.py")
_letters = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_letters)
load_verses = _letters.load_verses

SHORT_MAX_WORDS = 30
BANNED_WORDS = re.compile(r"\b(undoubtedly|surely|clearly|proves?|proved|proven|obviously|certainly)\b", re.IGNORECASE)
DATES = re.compile(r"\b\d+\s*(BC|B\.C\.|BCE|AD|A\.D\.|CE)\b|\b(AD|A\.D\.)\s*\d+", re.IGNORECASE)
QUOTE = re.compile(r"[\"“]([^\"”]+)[\"”]")
ELLIPSIS = re.compile(r"\.\.\.|…")


def load_text() -> dict[int, str]:
    """Verse id -> KJV text (data/plain/kjv/<BOOK>.json, keyed "chapter:verse"), in verse-id order."""
    catalog = json.loads((SITE / "data" / "catalog.json").read_text(encoding="utf-8"))
    text: dict[int, str] = {}
    for book in catalog["books"]:
        file = SITE / "data" / "plain" / "kjv" / f"{book['code']}.json"
        if not file.exists():
            continue
        for key, verse in json.loads(file.read_text(encoding="utf-8")).items():
            chapter, number = key.split(":")
            text[book["num"] * 1_000_000 + int(chapter) * 1_000 + int(number)] = verse
    return dict(sorted(text.items()))


def words(text: str) -> str:
    """Lower case, apostrophes and hyphens dropped, every other mark a space: 'Lord's' == 'lords', 'Bar-jona' == 'barjona';
    the KJV's ligatures and accents spelled plainly: 'Alphæus' == 'Alphaeus'."""
    text = text.lower().replace("æ", "ae").replace("œ", "oe")
    text = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    text = re.sub(r"['’\-]", "", text)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text).split())


def span_text(span: list[int], text: dict[int, str], order: list[int]) -> str:
    """The KJV text of every verse from first to last (a span may cross chapters)."""
    start, end = bisect.bisect_left(order, span[0]), bisect.bisect_right(order, span[1])
    return " ".join(text[v] for v in order[start:end])


def check_paragraph(paragraph: dict, where: str, verses: dict[int, set[int]], text: dict[int, str], order: list[int]) -> list[str]:
    errors: list[str] = []
    for i, (first, last) in enumerate(paragraph["refs"]):
        for verse in (first, last):
            if verse not in verses.get(verse // 1_000_000, set()):
                errors.append(f"{where} refs[{i}]: verse id {verse} is not in the site's KJV")
    if errors:
        return errors
    scripture = words(" ".join(span_text(span, text, order) for span in paragraph["refs"]))
    for quote in QUOTE.findall(paragraph["text"]):
        pieces = [words(piece) for piece in ELLIPSIS.split(quote) if words(piece)]
        at = 0
        for piece in pieces:
            found = f" {scripture} ".find(f" {piece} ", at)
            if found < 0:
                errors.append(f"{where}: the quotation \"{quote}\" does not match the KJV of this paragraph's refs word for word")
                break
            at = found + len(piece)
    errors += check_own_words(paragraph["text"], where)
    return errors


def check_own_words(text: str, where: str) -> list[str]:
    """Our own words (quotations removed): no confidence words, no BC/AD dates."""
    own = QUOTE.sub(" ", text)
    errors = []
    if BANNED_WORDS.search(own):
        errors.append(f"{where}: banned confidence word in our own words: {BANNED_WORDS.search(own).group(0)!r}")
    if DATES.search(own):
        errors.append(f"{where}: a BC/AD date ({DATES.search(own).group(0)!r}); stories are from Scripture only")
    return errors


def check_file(file: Path, verses: dict[int, set[int]], text: dict[int, str], seen: dict[str, str]) -> list[str]:
    order = list(text)
    name = file.name
    try:
        data = json.loads(file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"{name}: not valid JSON — {error}"]
    if not isinstance(data, dict) or set(data) != {"about", "stories"}:
        return [f"{name}: top-level keys must be exactly ['about', 'stories']"]
    if not isinstance(data["about"], str) or not data["about"].strip():
        return [f"{name}: 'about' must say what the file holds and its sources"]
    if not isinstance(data["stories"], dict) or not data["stories"]:
        return [f"{name}: 'stories' must be a non-empty object keyed by person id"]
    errors: list[str] = []
    for person_id, story in data["stories"].items():
        where = f"{name}: {person_id}"
        try:
            check_story_shape(story, where)
        except StoryError as error:
            errors.append(str(error))
            continue
        if person_id in seen:
            errors.append(f"{where}: already has a story in {seen[person_id]}; one story per person")
        seen[person_id] = name
        record = PEOPLE / f"{person_id}.json"
        if not record.exists():
            errors.append(f"{where}: not a person (no {record.relative_to(SITE).as_posix()})")
        elif json.loads(record.read_text(encoding="utf-8")).get("same"):
            errors.append(f"{where}: this record duplicates another person, whose page is shown; put the story there")
        count = len(story["short"].split())
        if count >= SHORT_MAX_WORDS:
            errors.append(f"{where} short: {count} words; keep it under {SHORT_MAX_WORDS}")
        errors += check_own_words(story["short"], f"{where} short")
        for index, paragraph in enumerate(story["paragraphs"]):
            errors += check_paragraph(paragraph, f"{where} paragraph {index + 1}", verses, text, order)
    return errors


def main() -> int:
    verses, text = load_verses(), load_text()
    names = sys.argv[1:]
    files = [STORIES / n for n in names] if names else sorted(STORIES.glob("*.json"))
    if not files:
        print(f"No story files found in {STORIES}")
        return 1
    failures, seen = 0, {}
    for file in files:
        errors = check_file(file, verses, text, seen)
        failures += len(errors)
        print(f"{file.name}: {'OK' if not errors else f'{len(errors)} problem(s)'}")
        for error in errors[:200]:
            print("  " + error)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
