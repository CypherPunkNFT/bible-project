"""A. T. Robertson, A Harmony of the Gospels (1922): contents -> parts, sections, sub-items; and his miracles list.

Only facts and his (public-domain) headings are taken. His headings are all capitals; `sentence_case` turns them
into ordinary sentence case, keeping proper names capitalised.
"""

import html
import re

from .study_refs import BOOK_NAME, Verses, parse_refs

GOSPELS = ("MAT", "MRK", "LUK", "JHN")
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11,
         "XII": 12, "XIII": 13, "XIV": 14}

ROW = re.compile(r"<tr>(.*?)</tr>", re.S)
PART = re.compile(r"<b>PART(?: |&nbsp;)([IVX]+):</b>")
SECTION = re.compile(r'href="#section(\w+)"><small>\W*(\w+):</small>')

# Words kept capitalised in sentence case (besides names from the people/place list passed in).
ALWAYS_CAPITAL = {
    "god", "christ", "jesus", "lord", "messiah", "logos", "word", "baptist", "spirit", "holy", "sabbath", "passover",
    "twelve", "seventy", "pharisees", "pharisee", "sadducees", "herodians", "scribes", "sanhedrin", "jews", "jewish",
    "gentiles", "samaritans", "samaritan", "greeks", "galilean", "judean", "perean", "roman", "romans", "temple", "olives",
    "tabernacles", "son", "man", "david", "satan", "beelzebub", "i", "ii", "iii", "supper",
    "sermon", "mount", "olivet", "transfiguration", "gethsemane", "golgotha", "emmaus", "decapolis", "tyre",
    "sidon", "caesarea", "philippi", "bethany", "bethlehem", "nazareth", "capernaum", "jerusalem", "galilee",
    "judea", "perea", "samaria", "jordan", "jericho", "egypt", "sychar", "cana", "nain", "chorazin", "bethsaida",
    "tiberias", "machaerus", "machærus", "zacchaeus", "lazarus", "martha", "mary", "joseph", "peter", "simon", "andrew", "james",
    "john", "philip", "nathanael", "matthew", "levi", "thomas", "judas", "iscariot", "pilate", "herod", "antipas",
    "caiaphas", "annas", "nicodemus", "barabbas", "magdalene", "zacharias", "elisabeth", "elizabeth", "anna",
    "simeon", "gabriel", "elijah", "moses", "abraham", "jonah", "solomon", "luke", "mark", "gospel", "gospels",
    "malchus", "bartimaeus", "jairus", "nathanael", "phoenician", "syrophoenician", "gadarene", "gerasene",
}
SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "with"}


def _text(fragment: str) -> str:
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment).replace("\xa0", " ")).strip()


def sentence_case(title: str, names: set[str]) -> str:
    """'THE BARREN FIG TREE CURSED, AND THE SECOND CLEANSING OF THE TEMPLE' -> 'The barren fig tree cursed, …'."""
    out, start = [], True
    for token in re.split(r"(\W+)", title):
        if not token or not re.match(r"\w", token):
            out.append(token)
            if token and re.search(r"[.:!?(]", token):
                start = True
            continue
        low = token.lower()
        keep = low in ALWAYS_CAPITAL or low in names
        if keep and low in SMALL_WORDS:
            keep = False
        word = low.capitalize() if (start or keep) else low
        out.append("I" if low == "i" else word)
        start = False
    return "".join(out)


def parse_harmony(source: str, verses: Verses, names: set[str]) -> dict:
    """The detailed contents: starts at the second 'PART I:' row (the first is the short list of divisions)."""
    first = source.find("<b>PART I:</b>")
    begin = source.find("<b>PART I:</b>", first + 1)
    end = source.find("</table>", source.find('href="#section184"', begin))
    if first < 0 or begin < 0 or end < 0:
        raise ValueError("Robertson harmony: could not find the detailed contents (second 'PART I:' row to §184)")
    begin = source.rfind("<tr>", 0, begin)
    parts: list[dict] = []
    section: dict | None = None
    pending_title: str | None = None
    for row in ROW.findall(source[begin:end]):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        if len(cells) < 2:
            continue
        if (m := PART.search(row)):
            parts.append({"n": ROMAN[m.group(1)], "title": sentence_case(_text(cells[1]), names), "sections": []})
            section = None
            continue
        if (m := SECTION.search(cells[0])):
            title = re.sub(r"\(\s*(?:CF|COMP)\..*?\)", "", _text(cells[1]), flags=re.I).strip(" ,.")
            section = {"n": m.group(2), "title": sentence_case(title, names), "refs": None, "items": []}
            parts[-1]["sections"].append(section)
            pending_title = None
            continue
        text = _text(cells[1])
        if not text or section is None or text.upper().startswith("SECTIONS"):
            continue
        if re.match(r"^(?:[1-3] )?[A-Z][a-z]+\.? \d", text):  # a reference line
            refs = _split_by_book(parse_refs(text, verses))
            if section["refs"] is None and pending_title is None:
                section["refs"] = refs
            else:
                section["items"].append({"title": pending_title or "", "refs": refs})
                pending_title = None
        else:
            if pending_title is not None:  # a group heading with no references of its own
                section["items"].append({"title": pending_title, "refs": None})
            pending_title = re.sub(r"^\(?(\w)\)\s*|^\d+[:.]\s*", "", text)
    for part in parts:
        for sec in part["sections"]:
            if sec["refs"] is None:
                raise ValueError(f"Robertson harmony: section {sec['n']} has no references")
    return {"parts": parts}


def _split_by_book(ranges: list[list[int]]) -> dict:
    """Gospel ranges under MAT/MRK/LUK/JHN, anything else (Acts, 1 Corinthians) under 'also'."""
    from .books import BOOK_NUMBER

    code_of = {n: c for c, n in BOOK_NUMBER.items()}
    out: dict[str, list] = {}
    for start, end in ranges:
        code = code_of[start // 1_000_000]
        key = code if code in GOSPELS else "also"
        out.setdefault(key, []).append([start, end])
    return out


def parse_miracles(source: str) -> list[dict]:
    """Robertson's 'A List of the Miracles of Jesus': name -> harmony section number."""
    start = source.find('<a name="miracles">')
    stop = source.find("Besides these particular miracles", start)
    if start < 0 or stop < 0:
        raise ValueError("Robertson harmony: miracles list not found")
    found = re.findall(r"([^<>]+?),\s*\W*\s*<a href=\"#section(\w+)\">", source[start:stop])
    items = [{"title": _text(name), "section": number} for name, number in found]
    if not items:
        raise ValueError("Robertson harmony: miracles list is empty")
    return items


def describe(harmony: dict) -> str:
    sections = [s for p in harmony["parts"] for s in p["sections"]]
    gospel_counts = {g: sum(1 for s in sections if g in s["refs"]) for g in GOSPELS}
    return (f"{len(harmony['parts'])} parts, {len(sections)} sections, "
            + ", ".join(f"{BOOK_NAME[g]} in {n}" for g, n in gospel_counts.items()))
