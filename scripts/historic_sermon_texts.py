"""Read the sermons and their printed Bible texts out of held historic books (used by catalog-historic-sermons.py).

Two clean-text forms, both hand-typed (no scans, no OCR):
  TCP TEI    <div type="sermon"> with its <head>, often a <bibl> ("CANT. V. I.", "Revel. 3. 20.") and the text quoted
             at the head (in <q>/<epigraph> or leading numbered paragraphs: "3 And it came to passe ...").
  CCEL ThML  Owen's sermons: <div2 title="Sermon I. A vision of ... Acts xvi. 9.">.
Only what the page prints is read: a reference, a chapter named in the heading or title page, the verse numbers printed
in the quoted text. A quotation with no number or reference is never looked up.
"""

import posixpath
import re
import zipfile
from urllib.parse import unquote

import lxml.html
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
    # Modern e-books (Monergism) print their own slips and old forms (job 4b5ae800): "ISIAH 61:1", "PHILLIPIANS 3:8".
    "isaias": "Isaiah", "isiah": "Isaiah", "phillipians": "Philippians", "philippains": "Philippians", "zophoniah": "Zephaniah",
    "sophon": "Zephaniah", "numb": "Numbers", "hose": "Hosea", "song of solomon": "Song of Solomon", "song of songs": "Song of Solomon",
    "revelations": "Revelation", "corinth": "Corinthians", "philipp": "Philippians",
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
    whole = " ".join(raw.strip(" .,").lower().replace("ſ", "s").split())
    if whole in OLD_BOOKS:  # "ISAI" is Isaiah, not "I SAI"
        return OLD_BOOKS[whole]
    m = re.fullmatch(r"(?:(?P<n>[1-3]|I{1,3})(?:\.\s*|\s+))?(?P<book>[A-Za-zſ]+)", raw.strip(" .,"))
    if not m:
        return None
    key = m.group("book").lower().replace("ſ", "s")
    name = OLD_BOOKS.get(key) or OLD_BOOKS.get(key.replace("v", "u")) or m.group("book").replace("ſ", "s")
    prefix = {"I": "1", "II": "2", "III": "3"}.get(m.group("n") or "", m.group("n") or "")
    return f"{prefix} {name}".strip()


REFERENCE = re.compile(r"^\s*(?P<book>(?i:song\s+of\s+(?:solomon|songs))|(?:(?:[1-3]|I{1,3})(?:\.\s*|\s+))?[A-Za-zſ]{2,})\.?,?\s*(?P<rest>.*)$")
FILLER = {"chap", "chapter", "ch", "cap", "ver", "vers", "verse", "verses", "vs", "part", "of", "the"}  # "CANT. 5. part of verse 16."


def printed_reference(text):
    """A printed reference ('CANT. V. I.', 'Hos. 14.1, 2.', 'lOHN 14. chap. 1 verse.', 'Acts xvi. 9.') ->
    (book, chapter, [verse spans]) read exactly as printed, or (None, reason)."""
    text = re.sub(r"&\s*c\b\.?", " ", plain(text).replace("–", "-").replace("—", "-"))  # "&c." is not a Roman 100
    text = text.split("(")[0]  # "MARK 10:21. (Second clause.)": a note after the reference, never a verse
    text = re.sub(r"^\s*St\.\s+(?=[A-Z])", "", text)  # "St. John 10.14."
    m = REFERENCE.match(text)
    if not m:
        return None, f"no book name printed: {text[:60]}"
    book = book_name(m.group("book"))
    numbers, joiner, spans = [], None, []
    for token in re.findall(r"[A-Za-zſ]+|\d+|-|,|;|&", m.group("rest").replace(".", " . ")):
        low = token.lower().replace("ſ", "s")
        if low in FILLER or low in (",", ";", "&", "and") or (token == "v" and numbers):  # "Psal. 112. v. 4.": v is "verse"
            continue
        if low in ("-", "to"):
            joiner = "-"
            continue
        value = number(token) if numbers else number(token) or ordinal(token)  # "Actes. second." prints its chapter in words
        if value is None:
            break  # the words after the reference ("Opens the excellency ...")
        if not numbers:
            numbers.append(value)
        elif joiner and spans:
            start = spans[-1][0]
            if value < start and len(str(value)) < len(str(start)):  # "LUKE 15:20-1" prints 20-21 short
                value = int(str(start)[:-len(str(value))] + str(value))
            if value < start:
                return None, f"a range printed backwards: {text[:60]}"
            spans[-1][1] = value
        else:
            if any(a <= value <= b for a, b in spans):
                return None, f"verse {value} printed twice: {text[:60]}"  # "PSAL. 105. 14, 14.": a misprint, not guessed at
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


def tei_sermons(path, kind="sermon"):
    """Every <div type="sermon"> of a held TCP file, in document order, with what it prints at its head. `kind` reads
    another division type the same way (Goodwin's Christ the Universal Peace-maker prints its sermon as two 'part's)."""
    tree = etree.parse(str(path))
    out = []
    for index, div in enumerate(tree.xpath(f'//t:div[@type="{kind}"]', namespaces=TEI), 1):
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


# Modern hand-typed e-books (Monergism epubs, job 4b5ae800): Boston, Rutherford, Goodwin. Read-only: only the entries the
# package's own spine lists are opened, each capped in size, parsed with entities and the network off.
EPUB_ENTRY_LIMIT = 20 * 1024 * 1024
HEADINGS = ("h1", "h2", "h3", "h4", "h5", "h6")
OPF = "{http://www.idpf.org/2007/opf}"
SAFE_XML = etree.XMLParser(resolve_entities=False, no_network=True)


def _epub_entry(book, name):
    if name not in book.namelist() or book.getinfo(name).file_size > EPUB_ENTRY_LIMIT:
        raise ValueError(f"e-book entry {name!r} is missing or larger than {EPUB_ENTRY_LIMIT} bytes")
    return book.read(name)


def epub_blocks(path):
    """Headings, paragraphs and block quotations of a held e-book in reading order: [(tag, text)]."""
    blocks = []
    with zipfile.ZipFile(path) as book:
        container = etree.fromstring(_epub_entry(book, "META-INF/container.xml"), SAFE_XML)
        opf_name = container.xpath("//*[local-name()='rootfile']/@full-path")[0]
        opf = etree.fromstring(_epub_entry(book, opf_name), SAFE_XML)
        items = {item.get("id"): item.get("href") for item in opf.iter(f"{OPF}item")}
        for ref in opf.iter(f"{OPF}itemref"):
            name = posixpath.normpath(posixpath.join(posixpath.dirname(opf_name), unquote(items[ref.get("idref")])))
            doc = lxml.html.fromstring(_epub_entry(book, name), parser=lxml.html.HTMLParser(no_network=True))
            for element in doc.iter(*HEADINGS, "p", "blockquote"):
                if element.tag != "blockquote" and any(a.tag == "blockquote" for a in element.iterancestors()):
                    continue  # read once, as part of its quotation
                text = plain(element.text_content())
                if text:
                    blocks.append((element.tag, text))
    return blocks


# A reference printed at the end of a quotation: "... in victory. ISAIAH 25:8", "...—LUKE 15:20–21.", "- MARK 10:21. (Second clause.)"
TRAILING = re.compile(r"(?P<dash>[-—–]\s*)?(?P<ref>(?:[1-3]\s*)?(?:(?i:song\s+of\s+solomon)|[A-Za-z]{2,})\.?,?\s+\d+\s*[:.]\s*\d+"
                      r"(?:\s*(?:[-–—,]|&c\.?)\s*\d*)*)\.?\s*(?:\([^)]*\)\.?\s*)?$")
NUMBERED = re.compile(r"^No\.\s*[IVX]+\.?$")  # "No. I" above the quotation of a sermon printed in two parts


def trailing_reference(tag, text):
    """The reference ending a quotation: always in a block quotation; in a paragraph only after a dash and when the
    paragraph is short enough to be the text itself (a sermon paragraph may end citing a verse in passing)."""
    match = TRAILING.search(text)
    if not match or (tag != "blockquote" and (not match.group("dash") or len(text.split()) > 150)):
        return ""
    return match.group("ref")


HEAD_REFERENCE = re.compile(r"^(?:SERMON\s+[IVXLC]+\.?\*?\s*(?:[—–]|\s-\s)\s*|(?:A|THE\s+\w+)\s+SERMON\s+ON\s+)"
                            r"(?P<ref>[^—]*?\d[^—]*?)\.?(?:\s*—\s*PART\s+[IV]+)?$", re.I)  # en dash in a range; em dash before PART


def heading_reference(head):
    """'SERMON I.—Revelation 19:11, 12', 'SERMON XI - CANTICLES 2:14, 17', 'A SERMON ON EPHESIANS 2:14–16—PART I':
    the reference a sermon's heading prints; a title after the dash ('Sermon XII.—Christ's Love') is none."""
    match = HEAD_REFERENCE.match(head)
    return match.group("ref") if match else ""


def epub_sermons(path, heading, tags=("h3",)):
    """Each sermon an e-book marks with a heading matching `heading`: its heading(s), the quotation that opens it, the
    reference printed after a dash in the heading or at the end of that quotation (reset for every sermon: one that
    prints none gets none), and its length."""
    blocks = epub_blocks(path)
    starts = [i for i, (tag, text) in enumerate(blocks) if tag in tags and heading.search(text)]
    out = []
    for k, start in enumerate(starts):
        end = starts[k + 1] if k + 1 < len(starts) else len(blocks)
        heads, at = [blocks[start][1]], start + 1
        while at < end and (blocks[at][0] in HEADINGS or NUMBERED.match(blocks[at][1])):
            heads.append(blocks[at][1])
            at += 1
        tag, lead = blocks[at] if at < end else ("", "")
        bibl = heading_reference(heads[0]) or trailing_reference(tag, lead)
        out.append(dict(index=k + 1, n=None, head=" / ".join(heads), bibl=bibl, lead=lead, leadTag=tag, gaps=0,
                        words=sum(len(text.split()) for _, text in blocks[start:end])))
    return out


def epub_contents(path, pattern):
    """Contents-page lines matching `pattern` ('SERMON I.—EPHESIANS I. 1, 2'), in order."""
    return [text for tag, text in epub_blocks(path) if tag not in HEADINGS and pattern.search(text)]


def tei_verse_units(path):
    """Perkins's Jude: each <div type="verse">, a unit of the exposition with no sermon break printed, with the verse
    numbers it prints: in its heading ('Vers. 22.23.'; 'Vers. 24. Now vnto him ... 25. That is') and at the head of its
    own paragraphs ('Vers. 2.'). Margin notes ('Vers. 5.' cited in passing) are not read."""
    tree = etree.parse(str(path))
    out = []
    for index, div in enumerate(tree.xpath('//t:div[@type="verse"]', namespaces=TEI), 1):
        head = _head_text(div.find("t:head", TEI)) if div.find("t:head", TEI) is not None else ""
        match = re.match(r"Vers\.\s*(\d+(?:\s*[.,]\s*\d+)*)\.?", head)
        printed = [int(n) for n in re.findall(r"\d+", match.group(1))] + verse_numbers(head[match.end():]) if match else []
        for paragraph in div.findall("t:p", TEI):
            opening = re.match(r"Vers\.\s*(\d+)\.", _text(paragraph))
            if opening:
                printed.append(int(opening.group(1)))
        out.append(dict(index=index, n=div.get("n"), head=head, verses=sorted(set(printed)), words=len(_text(div).split())))
    return out
