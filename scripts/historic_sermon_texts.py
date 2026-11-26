"""Read the sermons and their printed Bible texts out of held historic books (used by catalog-historic-sermons.py).

Two clean-text forms, both hand-typed (no scans, no OCR):
  TCP TEI    <div type="sermon"> with its <head>, often a <bibl> ("CANT. V. I.", "Revel. 3. 20.") and the text quoted
             at the head (in <q>/<epigraph> or leading numbered paragraphs: "3 And it came to passe ...").
  CCEL ThML  Owen's sermons: <div2 title="Sermon I. A vision of ... Acts xvi. 9.">.
Only what the page prints is read: a reference, a chapter named in the heading or title page, the verse numbers printed
in the quoted text. A quotation with no number or reference is never looked up.
"""

import re

from lxml import etree

TEI = {"t": "http://www.tei-c.org/ns/1.0"}

# Sixteenth/seventeenth-century book abbreviations as printed -> a name study_refs knows. Keys are lower case,
# letters only, long s made "s" ("Geueſ." is the printer's slip for "Genes.", kept because it is what A17722 prints).
OLD_BOOKS = {
    "cant": "Song of Solomon", "canticles": "Song of Solomon", "revel": "Revelation", "reuel": "Revelation",
    "apoc": "Revelation", "esay": "Isaiah", "esai": "Isaiah", "esa": "Isaiah", "isai": "Isaiah", "esaie": "Isaiah",
    "math": "Matthew", "mat": "Matthew", "matth": "Matthew", "mathew": "Matthew", "matt": "Matthew",
    "act": "Acts", "actes": "Acts", "colos": "Colossians", "coloss": "Colossians", "ephes": "Ephesians", "ephe": "Ephesians",
    "iere": "Jeremiah", "ierem": "Jeremiah", "ier": "Jeremiah", "ezech": "Ezekiel", "geues": "Genesis",
    "genes": "Genesis", "psal": "Psalms", "psalme": "Psalms", "psalm": "Psalms", "iam": "James", "iames": "James", "iudg": "Judges", "iohn": "John",
    "lohn": "John", "ioh": "John", "iob": "Job", "iosh": "Joshua", "iude": "Jude", "ioel": "Joel", "ionah": "Jonah",
    "philip": "Philippians", "phil": "Philippians", "thes": "Thessalonians", "heb": "Hebrews", "hebr": "Hebrews",
    "deut": "Deuteronomy", "prov": "Proverbs", "eccles": "Ecclesiastes", "eccl": "Ecclesiastes", "luk": "Luke",
    "mar": "Mark", "marke": "Mark", "rom": "Romans", "galat": "Galatians", "gal": "Galatians", "tit": "Titus",
    "pet": "Peter", "cor": "Corinthians", "tim": "Timothy", "sam": "Samuel", "chron": "Chronicles",
}
ROMAN = re.compile(r"^[ivxlc]+$", re.I)
UNITS = {"first": 1, "fyrst": 1, "one": 1, "second": 2, "seconde": 2, "two": 2, "third": 3, "thirde": 3, "three": 3,
         "fourth": 4, "fourthe": 4, "fowerth": 4, "foure": 4, "four": 4, "fift": 5, "fifth": 5, "fiue": 5, "five": 5,
         "sixt": 6, "sixth": 6, "sixte": 6, "six": 6, "seuenth": 7, "seuen": 7, "seventh": 7, "eight": 8, "eighth": 8,
         "eyght": 8, "eyghth": 8, "ninth": 9, "nynth": 9, "nine": 9, "tenth": 10, "eleuenth": 11, "eleventh": 11,
         "twelfth": 12, "twelft": 12, "twelueth": 12, "thirteenth": 13, "thirtenth": 13, "fourteenth": 14,
         "fourtenth": 14, "foureteenth": 14, "fifteenth": 15, "fiftenth": 15, "sixteenth": 16, "sixtenth": 16, "sixeteenth": 16, "sixe": 6, "seuenteenth": 17,
         "seuententh": 17, "seventeenth": 17, "eighteenth": 18, "eightenth": 18, "nineteenth": 19, "ninteenth": 19,
         "nintenth": 19}
TENS = {"twentieth": 20, "twentith": 20, "twenty": 20, "twentie": 20, "thirtieth": 30, "thirtith": 30, "thirty": 30,
        "thirtie": 30, "fortieth": 40, "fortith": 40, "forty": 40, "fortie": 40, "threescore": 60, "fourscore": 80}


def plain(text):
    """Collapse whitespace, long s -> s; the source's own spelling is otherwise kept."""
    return " ".join((text or "").replace("ſ", "s").split())


def roman(token):
    values, total = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100}, 0
    digits = [values[c] for c in token.lower()]
    for i, value in enumerate(digits):
        total += -value if i + 1 < len(digits) and value < digits[i + 1] else value
    return total


def number(token):
    """'14', 'xiv', 'XXX', 'xxj' (a final j is an i) -> int; anything else None."""
    token = token.strip(".,;:")
    if token.isdigit():
        return int(token)
    token = re.sub(r"j$", "i", token, flags=re.I)
    return roman(token) if ROMAN.match(token) else None


def ordinal(words):
    """'third', 'eight', 'xiij.', 'one and twentieth', '21.' -> int, else None."""
    words = re.sub(r"\s+and\s+last$", "", words.lower().replace("ſ", "s").replace("&", "and").strip(" ."))  # "the sixth and last"
    if re.fullmatch(r"\d+|[ivxlcj]+", words):
        return number(words)
    parts = re.split(r"\s+(?:and\s+)?", words)
    total = 0
    for part in parts:
        if part in UNITS:
            total += UNITS[part]
        elif part in TENS:
            total += TENS[part]
        else:
            return None
    return total or None


def chapters_in_heading(head):
    """Chapters named in a heading: 'which is the third vpon the eight Chapter' -> [(8, False)];
    '... the twelfth vpon the fourth Chapter, and the first vpon the fifth Chapter' -> [(4, False), (5, True)].
    The flag says the sermon is the first upon that chapter (so its text begins at verse 1)."""
    found = []
    for match in re.finditer(r"((?:\w+[\s,.]+){0,2}?)(?:vpon|vppon|upon|of)\s+the\s+([\w .&]+?)\s+chap", plain(head), re.I):
        chapter = ordinal(match.group(2))
        if chapter:
            found.append((chapter, bool(re.search(r"\b(?:first|fyrst)\b", match.group(1), re.I))))
    return found


def book_name(raw):
    """A printed book abbreviation ('IERE', 'Geueſ', 'I COR') -> a name study_refs.normalise_book accepts, or None."""
    whole = raw.strip(" .,").lower().replace("ſ", "s")
    if whole in OLD_BOOKS:  # "ISAI" is Isaiah, not "I SAI"
        return OLD_BOOKS[whole]
    m = re.fullmatch(r"(?:(?P<n>[1-3]|I{1,3})(?:\.\s*|\s+))?(?P<book>[A-Za-zſ]+)", raw.strip(" .,"))
    if not m:
        return None
    key = m.group("book").lower().replace("ſ", "s")
    name = OLD_BOOKS.get(key) or OLD_BOOKS.get(key.replace("v", "u")) or m.group("book").replace("ſ", "s")
    prefix = {"I": "1", "II": "2", "III": "3"}.get(m.group("n") or "", m.group("n") or "")
    return f"{prefix} {name}".strip()


REFERENCE = re.compile(r"^\s*(?P<book>(?:(?:[1-3]|I{1,3})(?:\.\s*|\s+))?[A-Za-zſ]{2,})\.?,?\s*(?P<rest>.*)$")
FILLER = {"chap", "chapter", "ch", "cap", "ver", "vers", "verse", "verses", "vs", "part", "of", "the"}  # "CANT. 5. part of verse 16."


def printed_reference(text):
    """A printed reference ('CANT. V. I.', 'Hos. 14.1, 2.', 'lOHN 14. chap. 1 verse.', 'Acts xvi. 9.') ->
    (book, chapter, [verse spans]) read exactly as printed, or (None, reason)."""
    text = re.sub(r"&\s*c\b\.?", " ", plain(text).replace("–", "-").replace("—", "-"))  # "&c." is not a Roman 100
    m = REFERENCE.match(text)
    if not m:
        return None, f"no book name printed: {text[:60]}"
    book = book_name(m.group("book"))
    numbers, joiner, spans = [], None, []
    for token in re.findall(r"[A-Za-zſ]+|\d+|-|,|;|&", m.group("rest").replace(".", " . ")):
        low = token.lower().replace("ſ", "s")
        if low in FILLER or low in (",", ";", "&", "and"):
            continue
        if low in ("-", "to"):
            joiner = "-"
            continue
        value = number(token) or ordinal(token)  # "Actes. second." prints its chapter in words
        if value is None:
            break  # the words after the reference ("Opens the excellency ...")
        if not numbers:
            numbers.append(value)
        elif joiner and spans:
            spans[-1][1] = value
        else:
            spans.append([value, value])
        numbers.append(value)
        joiner = None
    if not book or not numbers:
        return None, f"no chapter printed: {text[:60]}"
    return (book, numbers[0], spans_of([v for a, b in spans for v in range(a, b + 1)])), None


def modern(book, chapter, spans):
    """('Romans', 14, [[7, 8]]) -> 'Romans 14:7-8'; no verses -> 'Romans 14' (the chapter the source prints)."""
    if not spans:
        return f"{book} {chapter}"
    return f"{book} {chapter}:" + ", ".join(str(a) if a == b else f"{a}-{b}" for a, b in spans)


def spans_of(values):
    """[3, 4, 5, 7] -> [[3, 5], [7, 7]]; [37, 41, 42] kept as printed, gaps included: [[37, 37], [41, 42]]."""
    spans = []
    for v in sorted(set(values)):
        if spans and v == spans[-1][1] + 1:
            spans[-1][1] = v
        else:
            spans.append([v, v])
    return spans


VERSE_NUMBER = re.compile(r"(?:^|(?<=[\s\]〉.;:,)]))(\d{1,3})(?=[.▪]?\s*(?:\d|[A-Z&¶〈•\[(]|$))")  # '7▪ But': ▪ is TCP's damaged stop


def verse_numbers(text):
    """Verse numbers printed in a quoted text: '3 And ...', '37.38.39.40. Also', '23 24 Beware'."""
    return [int(n) for n in VERSE_NUMBER.findall(plain(text))]


STOP = set("the and that unto with them they their thee thou thy shall for not his him but which have was all are from this were "
           "will when then what who upon there into also hath said out even before saying you your our".split())


def content_words(text):
    """Words to compare a quotation with the KJV across spelling: 'vnto'/'unto', 'Iesus'/'Jesus', 'sinne'/'sin'."""
    out = set()
    for word in re.findall(r"[a-z]+", plain(text).lower().replace("vv", "w")):
        word = re.sub(r"(.)\1+", r"\1", word.replace("v", "u").replace("j", "i").replace("y", "i")).rstrip("e")
        if len(word) >= 3 and word not in STOP:
            out.add(word)
    return out


def _text(element):
    return plain("".join(element.itertext())) if element is not None else ""


def _head_text(head):
    """A heading's own words, without the margin notes the printer set inside it (Flavel's 'Serm. 9.' running head)."""
    return plain("".join(t for t in head.xpath(".//text()[not(ancestor::t:note)]", namespaces=TEI)))


def _lead(div):
    """The text quoted at the head of a sermon: its <epigraph>/<q>, and the numbered paragraphs that open it (Psalm 119)
    before the first unnumbered paragraph of the sermon itself. Notes and gaps are left out."""
    pieces = []
    for child in div:
        tag = etree.QName(child).localname
        if tag in ("head", "bibl", "opener", "pb", "milestone"):
            continue
        if tag == "div":  # Psalm 119: each eight-verse section opens a <div> of its own
            pieces.append(_lead(child))
            break
        clone = etree.fromstring(etree.tostring(child))
        for drop in clone.xpath(".//t:note | .//t:head", namespaces=TEI):
            drop.getparent().remove(drop)
        if tag in ("epigraph", "q", "quote", "argument"):  # Psalm 119 sets its eight verses as an <argument>
            pieces.append(_text(clone))
            continue
        if tag == "p":
            quoted = clone.find("t:q", TEI)
            text = _text(clone)
            if quoted is not None and text.startswith(_text(quoted)[:20]):
                pieces.append(_text(quoted))
                continue
            if re.match(r"\d", text):
                pieces.append(text)
                continue
        break
    return " ".join(pieces)


def tei_sermons(path):
    """Every <div type="sermon"> of a held TCP file, in document order, with what it prints at its head."""
    tree = etree.parse(str(path))
    out = []
    for index, div in enumerate(tree.xpath('//t:div[@type="sermon"]', namespaces=TEI), 1):
        heads = div.findall("t:head", TEI)
        bibl = div.find("t:bibl", TEI)
        if bibl is None:  # a <bibl> inside the quoted text at the head, as Flavel's and Sibbes's printers set it
            for child in div:
                if etree.QName(child).localname in ("head", "pb", "milestone"):
                    continue
                bibl = child.find(".//t:bibl", TEI) if etree.QName(child).localname != "p" or child.find("t:q", TEI) is not None else None
                break
        parent, lead = div.getparent(), _lead(div)
        if bibl is not None and lead.startswith(_text(bibl)):  # the reference is read on its own, not as verse numbers
            lead = lead[len(_text(bibl)):].lstrip()
        out.append(dict(index=index, n=div.get("n"), parentType=parent.get("type"), parentN=parent.get("n"),
                        head=" / ".join(_head_text(h) for h in heads), bibl=_text(bibl), lead=lead,
                        gaps=len(div.findall(".//t:gap", TEI)), words=len(_text(div).split())))
    return out


def tei_title(path):
    tree = etree.parse(str(path))
    return _text(tree.find(".//t:titleStmt/t:title", TEI)), [_text(a) for a in tree.findall(".//t:titleStmt/t:author", TEI)]


def thml_sermons(path):
    """Owen's CCEL ThML: each <div2> whose title starts 'Sermon', with the <div1> part it sits in."""
    tree = etree.parse(str(path), etree.XMLParser(recover=True, resolve_entities=False, no_network=True))
    out = []
    for part in tree.iter("div1"):
        for div in part.iter("div2"):
            title = plain(div.get("title"))
            if re.match(r"Sermon\b", title):
                out.append(dict(index=len(out) + 1, id=div.get("id"), part=plain(part.get("title")), title=title,
                                words=len(plain("".join(div.itertext())).split())))
    return out
