"""Tags for the Question Bank: which books a question is tied to, which Testament, and one topic.

Used by build-question-bank.py. Everything here is a fixed rule over the question's own words and references, so a
tag can always be traced to the word that set it; nothing is guessed by a model.

  books      book codes from the question's scripture reference, then any book named outright in its words
  testament  "OT" or "NT", from the first book, else from the topic; null for a catechism question
  topic      one topic id from TOPICS, by the most keyword hits: a word in the question counts 3, in the answer 1,
             the book the reference names 3
"""

from __future__ import annotations

import re

from bible.books import BOOKS, ONE_CHAPTER_BOOKS
from bible.study_refs import RefError, normalise_book

CANON = [code for code, _name, section, _osis in BOOKS if section != "apocrypha"]
SECTION = {code: section for code, _name, section, _osis in BOOKS}
OLD_TESTAMENT = set(CANON[:39])

# The Bible's story for quiz and lesson questions; Christian teaching for catechism questions. Order breaks ties.
TOPICS: dict[str, dict] = {
    "beginnings": {"title": "Creation & the patriarchs", "group": "story", "words": (
        "creation created eden adam eve serpent cain abel seth enoch noah ark flood rainbow babel abraham abram sarah "
        "sarai isaac rebekah ishmael hagar jacob esau rachel leah laban joseph lot sodom gomorrah melchizedek "
        "methuselah patriarch patriarchs birthright coat")},
    "exodus": {"title": "Moses & the Exodus", "group": "story", "words": (
        "moses aaron miriam pharaoh egypt egyptians plague plagues passover red sea sinai manna quail wilderness "
        "tabernacle commandment commandments golden calf burning bush jethro midian levites spies canaan balaam")},
    "kingdom": {"title": "Judges & kings", "group": "story", "words": (
        "joshua jericho rahab gideon samson delilah deborah judge judges ruth naomi boaz samuel eli hannah saul "
        "david goliath jonathan absalom bathsheba uriah solomon temple king kings queen sheba rehoboam jeroboam ahab "
        "jezebel hezekiah josiah philistines israel judah kingdom throne")},
    "prophets": {"title": "Prophets & exile", "group": "story", "words": (
        "prophet prophets elijah elisha isaiah jeremiah ezekiel daniel jonah whale nineveh hosea amos micah "
        "babylon babylonian nebuchadnezzar belshazzar lions furnace exile captivity esther mordecai haman nehemiah "
        "ezra cyrus persia")},
    "wisdom": {"title": "Psalms & wisdom", "group": "story", "words": (
        "psalm psalms proverb proverbs wisdom wise job ecclesiastes song songs shepherd vanity")},
    "jesus": {"title": "Jesus & the Gospels", "group": "story", "words": (
        "jesus christ messiah bethlehem nazareth manger shepherds magi wise men herod mary joseph baptist baptized "
        "disciple disciples apostles parable parables miracle miracles lazarus martha zacchaeus nicodemus galilee "
        "sermon mount crucified crucifixion cross pilate judas gethsemane resurrection risen tomb transfiguration "
        "gospel gospels matthew mark luke john")},
    "church": {"title": "The early church & letters", "group": "story", "words": (
        "paul saul tarsus damascus peter pentecost holy spirit stephen barnabas silas timothy titus philemon "
        "church churches acts epistle letter letters corinth corinthians ephesus galatians romans macedonia "
        "missionary revelation seven churches antioch lydia")},
    "the-bible": {"title": "The Bible itself", "group": "story", "words": (
        "book books testament testaments chapter chapters verse verses written wrote language hebrew greek "
        "aramaic shortest longest canon author")},
    "faith": {"title": "Faith & practice", "group": "story", "words": (
        "faith faithful prayer pray grace salvation sin sins forgiveness forgive repent repentance heaven hell "
        "rapture tongues gifts fruit sanctification holiness righteous righteousness hope tithe fasting "
        "temptation worship believer believers born again eternal")},
    "god": {"title": "God & Scripture", "group": "teaching", "words": (
        "god trinity father persons scripture scriptures word decrees decree creation providence attributes "
        "eternal infinite glory almighty creator")},
    "sin": {"title": "Sin & the fall", "group": "teaching", "words": (
        "sin sins sinful fall fell adam misery corruption guilt original transgression covenant works")},
    "salvation": {"title": "Christ & salvation", "group": "teaching", "words": (
        "christ redeemer mediator salvation saved justification justified sanctification adoption faith repentance "
        "grace elect election redemption atonement righteousness gospel prophet priest offices humiliation exaltation")},
    "law": {"title": "The commandments", "group": "teaching", "words": (
        "commandment commandments law forbidden required duty duties neighbour neighbor sabbath honour honor steal "
        "murder adultery covet witness obey obedience")},
    "prayer": {"title": "Prayer", "group": "teaching", "words": (
        "prayer pray praying petition lord's kingdom come hallowed daily bread temptation amen thanks")},
    "church-life": {"title": "Church & sacraments", "group": "teaching", "words": (
        "church sacrament sacraments baptism baptized supper communion ordinance ordinances ministry minister "
        "preaching worship elders members")},
    "last-things": {"title": "Death & the life to come", "group": "teaching", "words": (
        "death die dead resurrection judgment judgement heaven hell glory eternal life soul souls body bodies "
        "everlasting return")},
}
_WORDS = {topic: set(spec["words"].split()) for topic, spec in TOPICS.items()}

# The book a question is tied to, when it has no topic word of its own (counts twice in the vote).
_BOOK_TOPIC = {**dict.fromkeys(["GEN"], "beginnings"), **dict.fromkeys(["EXO", "LEV", "NUM", "DEU"], "exodus"),
               **dict.fromkeys(CANON[5:14], "kingdom"), **dict.fromkeys(["EZR", "NEH", "EST"], "prophets"),
               **dict.fromkeys(CANON[17:22], "wisdom"), **dict.fromkeys(CANON[22:39], "prophets"),
               **dict.fromkeys(CANON[39:43], "jesus"), **dict.fromkeys(CANON[43:], "church")}
_NT_TOPICS = {"jesus", "church"}

# Books named outright in a question's words. Only names that are not also everyday words or other people: "Acts",
# "Numbers", "Judges", "Job", "Revelation", "Romans" and the Gospel writers are left to the reference.
_NAMED = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Deuteronomy": "DEU", "Joshua": "JOS", "Ruth": "RUT",
    "Esther": "EST", "Nehemiah": "NEH", "Ezra": "EZR", "Psalm": "PSA", "Psalms": "PSA", "Proverbs": "PRO",
    "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Song of Songs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
    "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
    "Haggai": "HAG", "Malachi": "MAL", "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP",
    "Colossians": "COL", "Hebrews": "HEB", "Philemon": "PHM", "Jude": "JUD",
    **{f"{n} {name}": f"{n}{code}" for n in "12" for name, code in [("Samuel", "SA"), ("Kings", "KI"),
       ("Chronicles", "CH"), ("Corinthians", "CO"), ("Thessalonians", "TH"), ("Timothy", "TI"), ("Peter", "PE")]},
    "Book of Acts": "ACT", "book of Numbers": "NUM", "book of Judges": "JDG", "book of Job": "JOB",
    "book of Revelation": "REV", "book of Romans": "ROM", "Gospel of Matthew": "MAT", "Gospel of Mark": "MRK",
    "Gospel of Luke": "LUK", "Gospel of John": "JHN", "book of Matthew": "MAT", "book of Mark": "MRK",
    "book of Luke": "LUK", "book of John": "JHN", "book of James": "JAS",
}
_NAMED_PATTERN = re.compile(r"\b(" + "|".join(sorted(map(re.escape, _NAMED), key=len, reverse=True)) + r")\b",
                            re.IGNORECASE)
_NAMED_LOWER = {name.lower(): code for name, code in _NAMED.items()}
_REF_PIECE = re.compile(r"^\s*((?:[1-3]\s*)?[A-Za-z][A-Za-z ]*?)\.?\s*(\d+)(?:[:.](\d+))?")


def parse_reference(text: str | None) -> list[tuple[str, int, int | None]]:
    """(book, chapter, verse or None) for each piece of a reference string that names its book, in order."""
    found = []
    for piece in re.split(r"[;,]", text or ""):
        match = _REF_PIECE.match(piece)
        if not match:
            continue
        try:
            book = normalise_book(match.group(1))
        except RefError:
            continue
        if book in SECTION and SECTION[book] != "apocrypha":
            chapter, verse = int(match.group(2)), int(match.group(3)) if match.group(3) else None
            if verse is None and book in ONE_CHAPTER_BOOKS:
                chapter, verse = 1, chapter  # "Philemon 13": a one-chapter book is cited by verse alone
            found.append((book, chapter, verse))
    return found


def books_of(question: str, answer: str, reference: str | None) -> list[str]:
    books = [book for book, _c, _v in parse_reference(reference)]
    for match in _NAMED_PATTERN.finditer(f"{question} {answer}"):
        name = match.group(1)
        # Proper names only: "psalm" or "jonah" at lower case is still a match, but "ruth" in "ruthless" is not.
        books.append(_NAMED_LOWER[name.lower()])
    return list(dict.fromkeys(books))


def topic_of(question: str, answer: str, lesson: str | None, kind: str, books: list[str]) -> str | None:
    group = "teaching" if kind == "catechism" else "story"
    asked = set(re.findall(r"[a-z']+", question.lower()))
    told = set(re.findall(r"[a-z']+", f"{answer} {lesson or ''}".lower()))
    scores = {}
    for topic, spec in TOPICS.items():
        if spec["group"] != group:
            continue
        # The question's own words say what it is about; an answer quoting Scripture drifts ("the LORD thy God").
        scores[topic] = 3 * len(asked & _WORDS[topic]) + len(told & _WORDS[topic])
        if group == "story" and books and _BOOK_TOPIC.get(books[0]) == topic:
            scores[topic] += 3
    best = max(scores.values(), default=0)
    return next((topic for topic, score in scores.items() if score == best), None) if best else None


def testament_of(kind: str, books: list[str], topic: str | None) -> str | None:
    if kind == "catechism":
        return None
    if books:
        return "OT" if books[0] in OLD_TESTAMENT else "NT"
    if topic in (None, "the-bible", "faith"):
        return None
    return "NT" if topic in _NT_TOPICS else "OT"


def link_of(reference: str | None) -> dict | None:
    """The first reference as the reader opens it: book code, chapter and (if given) verse."""
    pieces = parse_reference(reference)
    if not pieces:
        return None
    book, chapter, verse = pieces[0]
    return {"book": book, "chapter": chapter, "verse": verse}
