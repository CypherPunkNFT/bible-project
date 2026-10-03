"""The Bible Project's own fixed book table.

Book numbers here are permanent: they form the first two digits of every canonical verse id
(BBCCCVVV). eBible's file-name prefixes (02-GEN, 70-MAT) are sort order only and are never used.
Sections are the owner's reading-chart colour bands.
"""

# (USFM code, English name, section, OpenBible/OSIS name or None)
BOOKS = [
    ("GEN", "Genesis", "history", "Gen"),
    ("EXO", "Exodus", "history", "Exod"),
    ("LEV", "Leviticus", "history", "Lev"),
    ("NUM", "Numbers", "history", "Num"),
    ("DEU", "Deuteronomy", "history", "Deut"),
    ("JOS", "Joshua", "history", "Josh"),
    ("JDG", "Judges", "history", "Judg"),
    ("RUT", "Ruth", "history", "Ruth"),
    ("1SA", "1 Samuel", "history", "1Sam"),
    ("2SA", "2 Samuel", "history", "2Sam"),
    ("1KI", "1 Kings", "history", "1Kgs"),
    ("2KI", "2 Kings", "history", "2Kgs"),
    ("1CH", "1 Chronicles", "history", "1Chr"),
    ("2CH", "2 Chronicles", "history", "2Chr"),
    ("EZR", "Ezra", "history", "Ezra"),
    ("NEH", "Nehemiah", "history", "Neh"),
    ("EST", "Esther", "history", "Esth"),
    ("JOB", "Job", "poetry", "Job"),
    ("PSA", "Psalms", "poetry", "Ps"),
    ("PRO", "Proverbs", "poetry", "Prov"),
    ("ECC", "Ecclesiastes", "poetry", "Eccl"),
    ("SNG", "Song of Songs", "poetry", "Song"),
    ("ISA", "Isaiah", "prophets", "Isa"),
    ("JER", "Jeremiah", "prophets", "Jer"),
    ("LAM", "Lamentations", "prophets", "Lam"),
    ("EZK", "Ezekiel", "prophets", "Ezek"),
    ("DAN", "Daniel", "prophets", "Dan"),
    ("HOS", "Hosea", "prophets", "Hos"),
    ("JOL", "Joel", "prophets", "Joel"),
    ("AMO", "Amos", "prophets", "Amos"),
    ("OBA", "Obadiah", "prophets", "Obad"),
    ("JON", "Jonah", "prophets", "Jonah"),
    ("MIC", "Micah", "prophets", "Mic"),
    ("NAM", "Nahum", "prophets", "Nah"),
    ("HAB", "Habakkuk", "prophets", "Hab"),
    ("ZEP", "Zephaniah", "prophets", "Zeph"),
    ("HAG", "Haggai", "prophets", "Hag"),
    ("ZEC", "Zechariah", "prophets", "Zech"),
    ("MAL", "Malachi", "prophets", "Mal"),
    ("MAT", "Matthew", "gospels", "Matt"),
    ("MRK", "Mark", "gospels", "Mark"),
    ("LUK", "Luke", "gospels", "Luke"),
    ("JHN", "John", "gospels", "John"),
    ("ACT", "Acts", "gospels", "Acts"),
    ("ROM", "Romans", "epistles", "Rom"),
    ("1CO", "1 Corinthians", "epistles", "1Cor"),
    ("2CO", "2 Corinthians", "epistles", "2Cor"),
    ("GAL", "Galatians", "epistles", "Gal"),
    ("EPH", "Ephesians", "epistles", "Eph"),
    ("PHP", "Philippians", "epistles", "Phil"),
    ("COL", "Colossians", "epistles", "Col"),
    ("1TH", "1 Thessalonians", "epistles", "1Thess"),
    ("2TH", "2 Thessalonians", "epistles", "2Thess"),
    ("1TI", "1 Timothy", "epistles", "1Tim"),
    ("2TI", "2 Timothy", "epistles", "2Tim"),
    ("TIT", "Titus", "epistles", "Titus"),
    ("PHM", "Philemon", "epistles", "Phlm"),
    ("HEB", "Hebrews", "epistles", "Heb"),
    ("JAS", "James", "epistles", "Jas"),
    ("1PE", "1 Peter", "epistles", "1Pet"),
    ("2PE", "2 Peter", "epistles", "2Pet"),
    ("1JN", "1 John", "epistles", "1John"),
    ("2JN", "2 John", "epistles", "2John"),
    ("3JN", "3 John", "epistles", "3John"),
    ("JUD", "Jude", "epistles", "Jude"),
    ("REV", "Revelation", "revelation", "Rev"),
    # Apocrypha / Deuterocanon, in the KJV-1611 order, then books only some traditions carry.
    ("1ES", "1 Esdras", "apocrypha", None),
    ("2ES", "2 Esdras", "apocrypha", None),
    ("TOB", "Tobit", "apocrypha", None),
    ("JDT", "Judith", "apocrypha", None),
    ("ESG", "Esther (Greek)", "apocrypha", None),
    ("WIS", "Wisdom of Solomon", "apocrypha", None),
    ("SIR", "Sirach", "apocrypha", None),
    ("BAR", "Baruch", "apocrypha", None),
    ("LJE", "Letter of Jeremiah", "apocrypha", None),
    ("S3Y", "Song of the Three Young Men", "apocrypha", None),
    ("SUS", "Susanna", "apocrypha", None),
    ("BEL", "Bel and the Dragon", "apocrypha", None),
    ("MAN", "Prayer of Manasseh", "apocrypha", None),
    ("1MA", "1 Maccabees", "apocrypha", None),
    ("2MA", "2 Maccabees", "apocrypha", None),
    ("3MA", "3 Maccabees", "apocrypha", None),
    ("4MA", "4 Maccabees", "apocrypha", None),
    ("PS2", "Psalm 151", "apocrypha", None),
    ("DAG", "Daniel (Greek)", "apocrypha", None),
]

# Front matter, introductions, glossaries and back matter: skipped on purpose.
SKIPPED_CODES = {"FRT", "INT", "BAK", "OTH", "GLO", "XXA", "XXB", "XXC"}

# When a version lacks a book, the reader may offer this stand-in (Brenton's Greek Daniel and Esther).
EQUIVALENT = {"DAN": "DAG", "DAG": "DAN", "EST": "ESG", "ESG": "EST"}

BOOK_NUMBER = {code: index + 1 for index, (code, _name, _section, _osis) in enumerate(BOOKS)}
OSIS_TO_CODE = {osis: code for code, _name, _section, osis in BOOKS if osis}


def verse_id(book_code: str, chapter: int, verse: int) -> int:
    """Canonical verse id BBCCCVVV, e.g. Daniel 2:34 -> 27002034."""
    if book_code not in BOOK_NUMBER:
        raise ValueError(f"verse_id: unknown book code {book_code!r}; expected one of the BOOKS table")
    if not (0 < chapter < 1000 and 0 <= verse < 1000):
        raise ValueError(f"verse_id: chapter {chapter} / verse {verse} out of range for {book_code}")
    return BOOK_NUMBER[book_code] * 1_000_000 + chapter * 1000 + verse
