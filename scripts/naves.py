"""Parse Orville J. Nave's *Topical Bible* (1896/1903, public domain; CCEL edition, sources/ccel/bible.xml).

Each entry becomes {"id", "title", "points": [{"text", "refs", "see", "items"?}]}, the same shape as the Torrey topics
(scripts/build-topics.py). Only the book's facts are used (headings, wording of the points, verse references); CCEL's
markup is not republished (Website/SOURCES.md).

Nave's layout: <term> is the heading (in capitals), <p class="index2"> a point, index3/index4 its sub-points. Points open
with a bullet (U+2014 in the source, garbled to U+FFFD by CCEL) and sub-points with ".".
"""
import html
import re
from pathlib import Path

NAVE = Path(__file__).resolve().parents[2] / "sources" / "ccel" / "bible.xml"

SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "unto", "upon", "with"}
BULLETS = "�—–-.:;, "


def clean(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def title_case(raw: str) -> str:
    """Nave's capitals in reading case: "ANGEL OF THE CHURCHES" -> "Angel of the Churches"; "GUR-BAAL" -> "Gur-baal" (the KJV's
    own hyphenated form); words already in lower or mixed case ("MINISTER, Christian") are kept."""
    words = []
    for index, word in enumerate(raw.split()):
        if not word.isupper():
            words.append(word)
            continue
        bare = word.strip("(),;:").lower()
        if index and bare in SMALL_WORDS:
            words.append(word.lower())
            continue
        lead = re.match(r"^\W*", word).group(0)
        body = word[len(lead):].lower()
        words.append(lead + body[:1].upper() + body[1:])
    return " ".join(words)


def topic_id(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"^the ", "", title.lower())).strip("-")


def span(parsed: str, osis_to_code, verse_id) -> list[int] | None:
    """CCEL's "|John|10|7|0|0" (book, chapter, verse, end chapter, end verse; 0 = none) -> [start id, end id]."""
    book, chapter, verse, end_chapter, end_verse = (parsed.strip("|").split("|") + ["0"] * 5)[:5]
    code = osis_to_code.get(book)
    if not code or chapter == "0":
        return None
    try:
        return _span(code, chapter, verse, end_chapter, end_verse, verse_id)
    except ValueError:  # a reference CCEL parsed impossibly is dropped rather than stopping the build
        return None


def _span(code: str, chapter: str, verse: str, end_chapter: str, end_verse: str, verse_id) -> list[int]:
    start = verse_id(code, int(chapter), int(verse) or 1)
    if end_chapter == "0" and end_verse == "0":
        return [start, start]  # a whole chapter ("1Ch 24") links to its first verse, as Torrey's topics do
    return [start, verse_id(code, int(end_chapter) if end_chapter != "0" else int(chapter), int(end_verse) or 1)]


def entry_line(paragraph: str, osis_to_code, verse_id) -> dict:
    refs = [s for s in (span(p, osis_to_code, verse_id) for p in re.findall(r'parsed="([^"]+)"', paragraph)) if s]
    words = clean(re.split(r"<scripRef", paragraph, maxsplit=1)[0]).lstrip(BULLETS).strip()
    see = []
    match = re.search(r"\bSee(?: also)?\s+(.+)$", words)
    if match:  # "See AARON", "Of the altar .See ALTAR", "See TEMPLE, DEDICATION OF"
        see = [title_case(s.strip(" .")) for s in re.split(r"\s*;\s*", match.group(1)) if s.strip(" .")]
        words = words[: match.start()].rstrip(" .:;,")
    return {"text": words.rstrip(" .:;,"), "refs": refs, "see": see}


def parse(osis_to_code, verse_id) -> list[dict]:
    text = NAVE.read_text(encoding="utf-8", errors="replace")
    entries = re.findall(r'<term id="[^"]+">(.*?)</term>\s*<def[^>]*>(.*?)</def>', text, re.S)
    topics, seen = [], {}
    for raw, body in entries:
        title = title_case(clean(raw))
        tid = topic_id(title)
        seen[tid] = seen.get(tid, 0) + 1
        if seen[tid] > 1:
            tid = f"{tid}-{seen[tid]}"
        points: list[dict] = []
        for level, paragraph in re.findall(r'<p class="index([1234])"[^>]*>(.*?)</p>', body, re.S):
            line = entry_line(paragraph, osis_to_code, verse_id)
            if not (line["text"] or line["refs"] or line["see"]):
                continue
            if level in "34" and points:  # a sub-point (".For the golden calf") under the point above it
                points[-1].setdefault("items", []).append({"text": line["text"], "refs": line["refs"]})
                points[-1]["see"] += line["see"]
            else:
                points.append(line)
        topics.append({"id": tid, "title": title, "points": points})
    if len(topics) < 5000:
        raise SystemExit(f"naves: only {len(topics)} entries parsed from {NAVE}; expected about 5,322")
    return topics
