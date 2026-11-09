"""Biblical baby names: one name -> the JSON its page reads (docs/features/baby-names/design.md 3.4, 4.1).

Every sentence here is a fixed template over data fields; nothing adds story details the data does not hold.
"""

import re

from bn_assemble import Name, Original, all_verses, main_original
from bn_meaning import UNCERTAIN_HEADLINE
from bn_sources import Popularity, StrongEntry

from bible.study_refs import format_range

NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
                "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]
LOWER_FIRST = {"The", "A", "An", "One", "Son", "Daughter", "Wife", "Mother", "Father", "Brother", "Sister", "King", "Queen",
               "Prophet", "Priest", "Man", "Woman", "Levite", "Chief", "Leader", "Head", "Descendant", "Ancestor",
               "Follower", "Servant", "Official", "Husband", "Grandson", "Firstborn", "Youngest", "Eldest", "Second",
               "Third", "Disciple", "Apostle", "Judge", "Commander", "Governor", "High", "Last", "First", "Israelite",
               "Christian", "Gatekeeper", "Musician", "Singer", "Warrior", "Ruler", "Captain", "Grandfather", "Uncle",
               "Nephew", "Cousin", "Elder", "Righteous", "Mighty", "Benjamite", "Judahite", "Wealthy", "Faithful"}
GENDER_PHRASE = {"boy": "a boy's name", "girl": "a girl's name", "both": "a boy's and girl's name", "unknown": "a biblical name"}
LABEL_CODE = {"Given in the Bible": "given", "Probable": "probable", "Probable (Strong's says 'probably')": "probable",
              "Uncertain": "uncertain"}
HEADLINE_LABEL = {"given": "Given in the Bible", "probable": "Probable", "uncertain": "Uncertain"}
KEY_VERSES = 6


TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}


def number_word(count: int, capital: bool = False) -> str:
    if count < len(NUMBER_WORDS):
        word = NUMBER_WORDS[count]
    elif count < 100:
        word = TENS[count // 10] + (f"-{NUMBER_WORDS[count % 10]}" if count % 10 else "")
    else:
        word = str(count)
    return word[:1].upper() + word[1:] if capital else word


def describe(text: str) -> str:
    """'The mother of the prophet Samuel.' -> 'the mother of the prophet Samuel' (for use inside a sentence)."""
    text = re.sub(r"\s+", " ", text).strip().rstrip(".")
    first = text.split(" ", 1)[0]
    return text[:1].lower() + text[1:] if first in LOWER_FIRST else text


def people_word(sexes: list[str], count: int) -> str:
    if set(sexes) == {"M"}:
        return "man" if count == 1 else "men"
    if set(sexes) == {"F"}:
        return "woman" if count == 1 else "women"
    return "person" if count == 1 else "people"


def meaning_clause(name: Name, block: Original) -> str:
    # A Greek original is introduced as Greek (its transliteration is the Greek word), whatever language it came from.
    language = "Greek" if block.strongs.startswith("G") else (block.meaning.origin if block.meaning.origin != "other" else "")
    source = f" from the {language} {block.translit}" if language and block.translit else (f" from the {language}" if language else "")
    if block.meaning.headline == UNCERTAIN_HEADLINE:
        return f"{source}; its meaning is uncertain"
    return f"{source}, meaning “{block.meaning.headline}”"


def opening(name: Name, gender: str, bearers: list[dict]) -> str:
    """The first long paragraph: it becomes the search description (design 4.1 item 4)."""
    block = main_original(name) if name.originals else None
    head = f"{name.spelling} is {GENDER_PHRASE[gender]}{meaning_clause(name, block) if block else ''}."
    if not bearers:
        about = name.about or (f"a {name.places[0]['type']}" if name.places else "a name")
        return f"{head} In the Bible, {name.spelling} is {about}, named in {len(all_verses(name))} verses."
    if len(bearers) == 1:
        one = bearers[0]
        first = format_range(one["keyVerses"][0], one["keyVerses"][0]) if one["keyVerses"] else ""
        named = f", first named in {first}" if first else ""
        if one["listedName"] != name.spelling and one["listedName"] and " " not in one["listedName"]:
            return f"{head} In the Bible it is a name of {one['listedName']}: {describe(one['description'])}{named}."
        return f"{head} In the Bible it belongs to one {people_word([one['sex']], 1)}: {describe(one['description'])}{named}."
    word = people_word([b["sex"] for b in bearers], len(bearers))
    best = bearers[0]["summary"].strip()
    known = f" The best known: {best}" if best else ""
    return f"{head} {number_word(len(bearers), True)} {word} in the Bible bear it.{known}"


def used_today(name: Name, gender: str, popularity: Popularity) -> str:
    """One sentence when modern use differs from the Bible ("Ariel: two men in the Bible; today mostly given to girls")."""
    boy, girl = popularity.boys.get(name.spelling), popularity.girls.get(name.spelling)
    if not popularity.year or not (boy or girl):
        return ""
    today = "girl" if girl and (not boy or girl < boy) else "boy"
    if gender in ("boy", "girl") and gender != today:
        bible = "men" if gender == "boy" else "women"
        return f"In the Bible, {name.spelling} is borne by {bible}; in the US today it is given mostly to {today}s."
    return ""


def key_verses(refs: set[int], naming_verse: int | None) -> list[int]:
    """The first appearance, the naming verse, then the first verse in each further book, in Bible order (max 6)."""
    ordered = sorted(refs)
    chosen = [ordered[0]]
    if naming_verse in refs and naming_verse not in chosen:
        chosen.append(naming_verse)
    books = {v // 1_000_000 for v in chosen}
    for verse in ordered:
        if len(chosen) >= KEY_VERSES:
            break
        if verse // 1_000_000 not in books:
            chosen.append(verse)
            books.add(verse // 1_000_000)
    return sorted(chosen)


def opening_text(detail: dict) -> str:
    """The bearer card's story opening: the written story's own one-line summary where there is one, otherwise the
    short summary the person page shows (story paragraphs quote the King James, which the site does not quote here)."""
    story = detail.get("story") or {}
    return (story.get("short") if isinstance(story, dict) else "") or detail.get("short", "") or ""


def bearer_entry(name: Name, pid: str, ctx: dict, naming: dict[str, int], testament: str) -> dict:
    """One person on a name page. 'alsoCalled' lists their other names: the other spellings they have pages under
    (with a slug, so the page can link them) and TIPNR's other forms (no slug)."""
    bearer, detail, row = name.bearers[pid], ctx["details"][pid], ctx["people"][pid]
    pages = {s: slug for s, slug in ctx["person_names"].get(pid, {}).items() if s != name.spelling}
    forms = sorted(f for f in bearer.forms if f not in pages and f != name.spelling and f not in ctx["excluded"])
    also = [{"name": s, "slug": slug} for s, slug in sorted(pages.items())] + [{"name": f} for f in forms]
    return {
        "id": pid, "listedName": row["n"], "description": detail.get("b") or row.get("b", ""),
        "summary": detail.get("short", ""), "opening": opening_text(detail), "sex": detail.get("s", ""),
        "period": row.get("p", ""), "testament": testament, "verseCount": len(bearer.refs),
        "totalVerses": row.get("c", len(bearer.refs)), "keyVerses": key_verses(bearer.refs, naming.get(pid)),
        "alsoCalled": also[:6], "strongs": bearer.strongs, "hasStory": bool(detail.get("story")),
    }


def root_info(strongs: str, lexicon: dict[str, StrongEntry]) -> dict | None:
    entry = lexicon.get(strongs) if strongs else None
    return {"strongs": strongs, "word": entry.word, "translit": entry.translit} if entry else None


def original_entry(block: Original, lexicon: dict[str, StrongEntry], hitchcock: str) -> dict:
    meaning = block.meaning
    return {
        "strongs": block.strongs, "word": block.word, "translit": block.translit,
        "script": "he" if block.strongs.startswith("H") else "grc", "language": meaning.origin,
        "greek": block.greek, "people": block.persons,
        "meaning": {
            "headline": meaning.headline, "label": LABEL_CODE[meaning.label], "labelText": meaning.label,
            "source": meaning.source, "strongsText": meaning.strongs_text, "chain": meaning.chain,
            "bibleNote": meaning.bible_note, "wordplay": meaning.wordplay, "explanation": meaning.explanation,
            "cite": meaning.cite, "root": root_info(meaning.root, lexicon),
        },
        "hitchcock": hitchcock,
    }


def hitchcock_line(name: Name, block: Original, hitchcock: dict[str, str]) -> str:
    """Hitchcock's 1869 meaning, only when it differs from the headline and is not a cross-reference (design 3.3)."""
    old = hitchcock.get(name.spelling, "")
    if not old or re.match(r"^(?:same as|see|the same as)\b", old, re.I):
        return ""
    words = lambda text: set(re.findall(r"[a-z]+", text.lower())) - {"the", "a", "of", "or", "and"}  # noqa: E731
    return "" if words(old) == words(block.meaning.headline) else old
