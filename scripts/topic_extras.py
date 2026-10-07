"""Editorial additions to the topics (scripts/build-topics.py), reviewed 2026-10-07:

- Nave's largest entries split by their own capital sub-headings into topics ("MIRACLES OF" under "Jesus, the Christ" becomes
  "The Miracles of Christ"), with Jesus' 50 miracles and 35 parables each a topic of their own;
- the 66 books of the Bible, "how the Bible came to us" and the three temples, as topics carrying Easton's article;
- Nave's 54 "Select readings" as great passages for the Topics home.

Every generated topic says where it goes ("placeAt", a group id in content/topics/taxonomy.json).
"""
import re

# Parent entry -> how its children are named, and where they go unless a rule below says otherwise.
SPLIT = {
    "jesus-the-christ": ("Christ", "person-of-christ"), "god": ("God", "attributes-of-god"), "church": ("the Church", "the-church"),
    "minister-christian": ("Ministers", "ministry-and-mission"), "afflictions-and-adversities": ("Affliction", "trials-and-afflictions"),
    "children": ("Children", "marriage-and-family"), "offerings": ("Offerings", "sacrifices-and-offerings"), "sin": ("Sin", "sins-of-the-heart"),
    "man": ("Man", "sin-and-the-fall"), "sanitation": ("Sanitation", "body-and-health"), "government": ("Government", "government-and-justice"),
    "death": ("Death", "death-and-the-grave"), "music": ("Music", "music-and-instruments"), "faith": ("Faith", "faith-and-repentance"),
    "prayer": ("Prayer", "prayer"), "love": ("Love", "graces-of-the-heart"), "court": ("Courts", "government-and-justice"),
    "character": ("Character", "godly-conduct"), "punishment": ("Punishment", "crime-and-punishment"), "intercession": ("Intercession", "prayer"),
    "idolatry": ("Idolatry", "idolatry-and-false-worship"), "fellowship": ("Fellowship", "ordinances-and-fellowship"), "family": ("The Family", "marriage-and-family"),
}
# Sub-headings that stay with their parent: catch-alls and figurative uses.
KEEP = re.compile(r"^(UNCLASSIFIED|MISCELLANY|FIGURATIVE|SYMBOLICAL|GENERAL SCRIPTURES|OTHER SCRIPTURES)", re.I)
# "INSTANCES OF" and similar continue the sub-heading before them.
CONTINUES = re.compile(r"^(INSTANCES OF|INSTANCES|EXEMPLIFIED|HIS PRESERVING CARE EXEMPLIFIED)", re.I)
# Jesus' and God's sub-headings by subject (first match wins).
RULES = {
    "jesus-the-christ": [
        (r"MIRACLES", "miracles-overview"), (r"PARABLES", "parables-of-jesus"),
        (r"ASCENSION|ATONEMENT|DEATH|PASSION|RESURRECTION|SECOND COMING|SUFFERINGS|KINGDOM|EXALTATION|REDEEMER|SALVATION|REJECTED|DENIAL|PERSECUTIONS", "cross-resurrection-return"),
        (r"^KING$|MESSIAH|NAMES|SAVIOUR|SHEPHERD|SON OF|PRIEST|PROPHET$|TEACHER|CREATOR|MEDIATION|INTERCESSION|IN HIS NAME", "titles-and-offices"),
        (r"HISTORY|BIRTH|GENEALOGY|TEMPTATION|MISSION|PRAYERS|EXAMPLE|COMPASSION|ZEAL|HUMILITY|MEEKNESS|OBEDIENCE|LOVE|SYMPATHY|REVELATIONS BY|PROMISES|PROPHECIES|TYPES", "life-and-ministry"),
        (r"FAITH IN|CONFESSING|RECEIVED|UNION|WORSHIP OF", "believers-and-christ"),
    ],
    "god": [
        (r"CREATOR|GUIDE|JUDGE|KING|PRESERVER|PROVIDENCE|SAVIOUR|WORKS|VOICE|ACCESS|FAVOR|GRACE", "works-of-god"),
        (r"UNITY|PERSONALITY|A SPIRIT|SELF-EXISTENT|INVISIBLE|HUMAN FORMS", "the-godhead"),
    ],
    "minister-christian": [(r"MESSENGERS|MINISTERS OF|OVERSEERS|PASTORS|PREACHERS|SERVANTS|TEACHERS|WATCHMEN|WITNESSES|WORKERS", "ministry-and-mission")],
}
# How a sub-heading reads as a title: "MIRACLES OF" -> "The Miracles of Christ"; "KING" -> "Christ the King".
TITLES = {
    ("jesus-the-christ", "EXAMPLE, AN"): "Christ, Our Example", ("jesus-the-christ", "“IN HIS NAME.”"): "In the Name of Christ",
    ("jesus-the-christ", "RECEIVED"): "Christ Received", ("jesus-the-christ", "REJECTED"): "Christ Rejected", ("jesus-the-christ", "CONFESSING"): "Confessing Christ",
    ("jesus-the-christ", "FAITH IN"): "Faith in Christ", ("jesus-the-christ", "SON OF GOD"): "Christ the Son of God", ("jesus-the-christ", "SON OF MAN"): "Christ the Son of Man",
    ("jesus-the-christ", "SHEPHERD, JESUS THE TRUE"): "Christ the True Shepherd", ("jesus-the-christ", "NAMES, APPELLATIONS, AND TITLES OF"): "The Names and Titles of Christ",
    ("jesus-the-christ", "RELATION OF, TO THE FATHER"): "Christ's Relation to the Father", ("jesus-the-christ", "POWER OF, TO FORGIVE SINS"): "Christ's Power to Forgive Sins",
    ("jesus-the-christ", "UNION OF, WITH THE RIGHTEOUS"): "Christ's Union with the Righteous", ("jesus-the-christ", "DESIGN OF HIS DEATH"): "The Purpose of Christ's Death",
    ("jesus-the-christ", "DEATH OF, VOLUNTARY"): "The Voluntary Death of Christ", ("jesus-the-christ", "OTHER SCRIPTURES RELATING TO HIS MESSIAHSHIP"): "Christ the Messiah: Further Scriptures",
    ("jesus-the-christ", "ONNIPRESENCE OF"): "The Omnipresence of Christ", ("jesus-the-christ", "PROMISES OF, PROPHETIC"): "Christ's Prophetic Promises",
    ("god", "A SPIRIT"): "God Is a Spirit", ("god", "ONNIPRESENT"): "God Is Omnipresent", ("god", "JUDGE, AND HIS JUSTICE"): "God the Judge, and His Justice",
    ("god", "CREATOR OF MAN"): "God the Creator of Man", ("god", "LONGSUFFERING OF, ABUSED"): "God's Longsuffering Abused",
    ("god", "LOVE OF, EXEMPLIFIED"): "The Love of God Exemplified", ("god", "PROVIDENCE OF, OVERRULING INTERPOSITIONS OF THE"): "The Overruling Providence of God",
    ("god", "PROVIDENCE OF, MYSTERIOUS AND MISINTERPRETED"): "The Mysterious Providence of God", ("god", "HUMAN FORMS AND APPEARANCE OF"): "God's Appearances in Human Form",
    ("god", "SYMBOLIZED"): "Symbols of God",
    # Under LOVE, Nave's "OF GOD, LOVE OF" is a link to his "GOD, LOVE OF" (no "See", so it reads as a sub-heading): it is
    # the Love of God topic, not a new one ("The Of God, Love of Love" until 2026-10-07).
    ("love", "OF GOD, LOVE OF"): "The Love of God",
}
ADJECTIVES = {"IMMUTABLE", "IMPARTIAL", "INCOMPREHENSIBLE", "INFINITE", "INVISIBLE", "JEALOUS", "OMNIPOTENT", "OMNISCIENT", "SELF-EXISTENT", "SOVEREIGN",
              "UBIQUITOUS", "UNCHANGEABLE", "UNSEARCHABLE", "TRUTH"}


def capital(text: str) -> bool:
    letters = re.sub(r"[^A-Za-z]", "", text)
    return len(letters) > 2 and letters.isupper()


def reading_case(text: str) -> str:
    small = {"of", "the", "and", "to", "in", "for", "a", "an", "by", "with", "on", "from", "as"}
    words = text.lower().split()
    return " ".join(w if i and w in small else w[:1].upper() + w[1:] for i, w in enumerate(words))


def child_title(parent: str, short: str, head: str) -> str:
    if (parent, head) in TITLES:
        return TITLES[(parent, head)]
    clean = re.sub(r",? INSTANCES OF$", "", head.strip(" .,")).strip(" ,")
    if clean.endswith(" OF"):  # "MIRACLES OF" -> "The Miracles of Christ"
        return f"The {reading_case(clean[:-3])} of {short}"
    match = re.match(r"^(.*) OF, (.*)$", clean)  # "DEATH OF, VOLUNTARY" -> "The Death of Christ: Voluntary"
    if match:
        return f"The {reading_case(match.group(1))} of {short}: {reading_case(match.group(2))}"
    if parent in ("god", "jesus-the-christ") and clean in ADJECTIVES:
        return f"{short} Is {reading_case(clean)}"
    if parent in ("god", "jesus-the-christ") and len(clean.split()) == 1:  # "KING" -> "Christ the King"
        return f"{short} the {reading_case(clean)}"
    return generic_title(short, clean)


PREPOSITIONS = ("IN", "FROM", "TO", "FOR", "AGAINST", "WITH", "BY", "ON", "UNDER")
# Source typos in Nave's headings.
FIXES = {"0F": "OF", "RIGHTEOUSNFSS": "RIGHTEOUSNESS"}


def generic_title(short: str, head: str) -> str:
    """Natural titles for the other parents: "CORRUPTION IN" -> "Corruption in the Church"; "WEAK" -> "Weak Faith";
    "OF THE WICKED" -> "Affliction of the Wicked"; anything else -> "Ministers: Overseers"."""
    head = " ".join(FIXES.get(w, w) for w in head.split())
    head = re.sub(r",? INSTANCES OF$", "", head).strip(" ,")
    noun = short[0].upper() + short[1:]
    words = head.split()
    if words[-1] in PREPOSITIONS and "," not in head:
        return f"{reading_case(' '.join(words[:-1]))} {words[-1].lower()} {short}"
    if words[0] in ("OF", "FOR", "TO", "IN", "WITH", "AGAINST") and len(words) > 1:
        return f"{noun} {reading_case(head)[0].lower()}{reading_case(head)[1:]}"
    if len(words) == 1:
        return f"{reading_case(head)} {short}" if short[0].isupper() or short.startswith("the ") is False else f"{noun} {reading_case(head)}"
    return f"{noun}: {reading_case(head)}"


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"^the ", "", text.lower().replace("’", "").replace("'", ""))).strip("-")


def group_for(parent: str, head: str, default: str) -> str:
    for pattern, group in RULES.get(parent, []):
        if re.search(pattern, head):
            return group
    return default


def split_entries(topics: list[dict], placed_group, forwards: dict[str, str] | None = None) -> list[dict]:
    """Split the SPLIT parents' Nave points at their capital sub-headings. Returns the new child topics (and Jesus' miracles
    and parables); each parent keeps its other points and gains "parts", the ids of its children in order.

    A sub-heading with nothing under it is not made a topic: "ATTRIBUTES OF" under Jesus ("see each one in its alphabetical
    order, below") and "SYMBOLS USED IN" under Music (its terms follow as headings of their own). Its address (live until
    2026-10-07) goes into `forwards` as id -> parent id, for the build to add to the index's aliases."""
    by_id = {t["id"]: t for t in topics}
    by_title = {t["title"].lower(): t for t in topics}
    created: list[dict] = []
    for parent_id, (short, default) in SPLIT.items():
        parent = by_id.get(parent_id)
        if not parent or not parent.get("nave"):
            continue
        keep, parts, current = [], [], None
        for point in parent["nave"]:
            head = point["text"]
            if capital(head) and CONTINUES.match(head) and current is not None:
                current["nave"].append({**point, "text": reading_case(head)})
                continue
            if not capital(head) or KEEP.match(head):
                keep.append(point)
                current = None
                continue
            title = child_title(parent_id, short, head)
            body = {**point, "text": "Scriptures"} if point["refs"] or point.get("items") else None
            existing = by_title.get(title.lower()) or by_title.get(re.sub(r"^the ", "", title.lower())) or by_title.get("the " + title.lower())
            if not existing and slug(title) in by_id and by_id[slug(title)] not in created:  # same address, title worded differently
                existing = by_id[slug(title)]
            if existing and existing["id"] != parent_id:  # "The Love of God" already a Torrey topic: Nave's points join it
                existing.setdefault("nave", [])
                if body:
                    existing["nave"].append(body)
                parts.append(existing["id"])
                current = existing
                continue
            child = {"id": f"{slug(title)}", "title": title, "points": [], "nave": [body] if body else [], "heading": "", "placeAt": group_for(parent_id, head, default), "parent": parent_id}
            if child["id"] in by_id:
                child["id"] = f"{parent_id}-{slug(head)}"
            by_id[child["id"]] = child
            by_title[title.lower()] = child
            created.append(child)
            parts.append(child["id"])
            current = child
        parent["nave"] = keep
        parent["parts"] = list(dict.fromkeys(parts))
    # Jesus' miracles and parables: every one Nave lists becomes its own topic, under the topic that lists them.
    jesus = by_id.get("jesus-the-christ")
    for lister_id in [t for t in (jesus or {}).get("parts", [])]:
        lister = by_id[lister_id]
        for point in lister.get("nave", []):
            items = point.get("items", [])
            kind = "miracle" if re.search(r"miracle", lister["title"], re.I) else "parable" if re.search(r"parable", lister["title"], re.I) else None
            if not kind or not items:
                continue
            if lister in created:
                lister["placeAt"] = "miracles-overview" if kind == "miracle" else "parables-of-jesus"
            lister["parts"] = lister.get("parts", [])
            for item in items:
                title = item["text"].replace("The arriage", "The marriage")
                tid = slug(f"{kind} {title}")
                if tid in by_id:
                    continue
                group = miracle_group(title) if kind == "miracle" else "parables-of-jesus"
                topic = {"id": tid, "title": title, "points": [], "nave": [{"text": "The account", "refs": item["refs"], "see": []}], "heading": "", "placeAt": group, "parent": lister_id}
                by_id[tid] = topic
                created.append(topic)
                lister["parts"].append(tid)
    empty = {t["id"]: t["parent"] for t in created if not t["nave"] and not t.get("parts")}
    if forwards is not None:
        forwards.update(empty)
    for topic in by_id.values():
        if topic.get("parts"):
            topic["parts"] = [part for part in topic["parts"] if part not in empty]
    return [t for t in created if t["id"] not in empty]


def miracle_group(title: str) -> str:
    t = title.lower()
    if re.search(r"rais|lazarus", t):
        return "miracles-raising"
    if re.search(r"demon|spirit of infirmity|epileptic", t):
        return "miracles-demons"
    if re.search(r"heal|cure|lepro|leper|blind|deaf|lame|palsy|paralyz|immobile|withered|dropsy|issue of blood|restor|ear", t):
        return "miracles-healing"
    return "miracles-nature"


# The 66 books: Easton's article for each (books named after a person share that person's article in Easton).
BOOK_ARTICLE = {
    "GEN": "genesis", "EXO": "exodus, book of", "LEV": "leviticus", "NUM": "numbers, book of", "DEU": "deuteronomy", "JOS": "joshua, the book of",
    "JDG": "judges, book of", "RUT": "ruth the book of", "1SA": "samuel, books of", "2SA": "samuel, books of", "1KI": "kings, the books of",
    "2KI": "kings, the books of", "1CH": "chronicles, books of", "2CH": "chronicles, books of", "EZR": "ezra, book of", "NEH": "nehemiah, book of",
    "EST": "esther, book of", "JOB": "job, book of", "PSA": "psalms", "PRO": "proverbs, book of", "ECC": "ecclesiastes", "SNG": "solomon, song of",
    "ISA": "isaiah, the book of", "JER": "jeremiah, book of", "LAM": "lamentations, book of", "EZK": "ezekiel, book of", "DAN": "daniel, book of",
    "HOS": "hosea, prophecies of", "JOL": "joel, book of", "AMO": "amos", "OBA": "obadiah, book of", "JON": "jonah, book of", "MIC": "micah, book of",
    "NAM": "nahum, book of", "HAB": "habakkuk, prophecies of", "ZEP": "zephaniah", "HAG": "haggai, book of", "ZEC": "zechariah", "MAL": "malachi, prophecies of",
    "MAT": "matthew, gospel according to", "MRK": "mark, gospel according to", "LUK": "luke, gospel according to", "JHN": "john, gospel of",
    "ACT": "acts of the apostles", "ROM": "romans, epistle to the", "1CO": "corinthians, first epistle to the", "2CO": "corinthians, second epistle to the",
    "GAL": "galatians, epistle to", "EPH": "ephesians, epistle to", "PHP": "philippians, epistle to", "COL": "colossians, epistle to the",
    "1TH": "thessalonians, epistles to the", "2TH": "thessalonians, epistles to the", "1TI": "timothy, first epistle to", "2TI": "timothy, second epistle to",
    "TIT": "titus, epistle to", "PHM": "philemon, epistle to", "HEB": "hebrews, epistle to", "JAS": "james, epistle of", "1PE": "peter, first epistle of",
    "2PE": "peter, second epistle of", "1JN": "john, first epistle of", "2JN": "john, second epistle of", "3JN": "john, third epistle of",
    "JUD": "jude, epistle of", "REV": "revelation, book of",
}
BOOK_GROUP = {"history": "books-history", "poetry": "books-poetry", "prophets": "books-prophets", "gospels": "books-gospels", "epistles": "books-letters", "revelation": "books-letters"}
LAW = {"GEN", "EXO", "LEV", "NUM", "DEU"}
# How the Bible came to us, and the temples: Easton headword -> (title, group).
ARTICLES = {
    "bible": ("The Bible", "bible-making"), "canon": ("The Canon of Scripture", "bible-making"), "inspiration": ("The Inspiration of Scripture", "bible-making"),
    "testament": ("Testament", "bible-making"), "new testament": ("The New Testament", "bible-making"), "pentateuch": ("The Pentateuch", "bible-making"),
    "samaritan pentateuch": ("The Samaritan Pentateuch", "bible-making"), "apocrypha": ("The Apocrypha", "bible-making"), "version": ("Versions of the Bible", "bible-making"),
    "septuagint": ("The Septuagint", "bible-making"), "sinaiticus codex": ("Codex Sinaiticus", "bible-making"), "vaticanus, codex": ("Codex Vaticanus", "bible-making"),
    "hebrew language": ("The Hebrew Language", "bible-making"), "chaldee language": ("The Chaldee (Aramaic) Language", "bible-making"),
    "temple, solomon’s": ("Solomon's Temple", "tabernacle-and-temple"), "temple, the second": ("The Second Temple", "tabernacle-and-temple"),
    "temple, herod’s": ("Herod's Temple", "tabernacle-and-temple"),
}


def easton_topics(articles: dict, books, existing_titles: set[str]) -> list[dict]:
    """Topics carrying only Easton's article: the 66 books (with "book", the reader's book code) and the ARTICLES list."""
    made = []
    for code, name, section, _osis in books[:66]:
        article = articles.get(BOOK_ARTICLE[code])
        group = "books-law" if code in LAW else BOOK_GROUP[section]
        made.append({"id": f"book-{slug(name)}", "title": f"The Book of {name}" if section != "epistles" else name, "points": [], "nave": [], "heading": "",
                     "dictionary": article or [], "book": code, "placeAt": group})
    for key, (title, group) in ARTICLES.items():
        if key in articles and title.lower() not in existing_titles:
            made.append({"id": slug(title), "title": title, "points": [], "nave": [], "heading": "", "dictionary": articles[key], "placeAt": group})
    return made


def select_readings(entry: dict) -> list[dict]:
    """Nave's "Readings, Select": each capital heading with its passages."""
    readings = []
    for point in entry["points"]:
        refs = point["refs"] or [r for item in point.get("items", []) for r in item["refs"]]
        if capital(point["text"]) and refs:
            readings.append({"title": reading_case(point["text"].replace("’ S", "’S").replace("’ s", "’s")), "refs": refs})
    return readings
