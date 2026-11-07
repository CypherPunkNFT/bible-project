"""The Reading the Bible well mock-up's own lists: what each figure draws, and the named exceptions to the quotation
checks. Every Bible phrase here is checked by build-data.py against the Berean at its reference; nothing here is
shown without that check."""
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
PROJECT = WEBSITE.parent

TITLE = ("Reading the Bible", "well")
TRAIL = ("Explore the Bible", "/study/explore")

# Studies the text names in italics: a mock-up on this PC, or None (named in italics, not yet a page).
STUDY_NAMES = {
    "The shape of Scripture": "/mockups/the-shape-of-scripture-directions/",
    "The story of the Bible: from the garden to the city": None,
    "The signs and works of Jesus": "/mockups/the-signs-and-works-of-jesus-directions/",
    "Who do you say that I am? Who Jesus really is": "/mockups/who-do-you-say-that-i-am-directions/",
    "Learning to discern": "/mockups/learning-to-discern-directions/",
    "Connections in Scripture": None,
    "Fear, anxiety and despair": None,
    "Christ in the Old Testament": "/mockups/christ-in-the-old-testament-directions/",
    "The Christian and the state": None,
    "Reading Daniel and Revelation": "/mockups/reading-daniel-and-revelation-directions/",
    "Life together: belonging to a church": "/mockups/life-together-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
}

# Words the study uses as its own terms, not as quotations: (part, phrase).
OWN_TERMS = {("01", "good news"), ("03", "Lord"), ("03", "master"), ("05", "you"), ("05", "all of you"), ("06", "you")}

# Short quotations (under three words) with no reference beside them, pinned to the verse they come from.
PINNED_QUOTES = {
    ("01", "the Christ"): "John 20:31",
    ("02", "every day"): "Acts 17:11",
    ("05", "plans"): "Jeremiah 29:11",
    ("05", "Yes"): "2 Corinthians 1:20",
    ("05", "build houses"): "Jeremiah 29:5",
}

# A short reference such as "4:6" names its book here, by part, never by guess.
SHORT_REFS = {("04", "1:17"): "Jonah", ("04", "4:6"): "Jonah", ("04", "4:7"): "Jonah", ("04", "4:8"): "Jonah",
              ("04", "2:2"): "Jonah", ("04", "4:2"): "Jonah"}
NOT_SCRIPTURE = ("Avot ",)  # "Mishnah, Avot 3:2" is a tractate and saying, not a Bible reference

# Quoted words from outside Scripture: (part, phrase) -> (where it is from, held source key or None).
SOURCE_ROOTS = [PROJECT]
SOURCES_HELD = {
    "foundation": {"name": "the site's doctrinal foundation, which quotes the Baptist Faith and Message 2000",
                   "path": PROJECT / "DOCTRINAL-FOUNDATION.md"},
}
OUTSIDE_QUOTES = {
    ("04", "truth, without any mixture of error"): ("Baptist Faith and Message 2000, article I", "foundation"),
    ("close", "There is no salvation apart from personal faith in Jesus Christ as Lord."): ("Baptist Faith and Message 2000, article IV", "foundation"),
}

# Which part reads which book: the five books the shelf lights. Code -> part anchor.
WALKED = {"PSA": "opening", "JHN": "01", "ACT": "02", "JON": "04", "JER": "05"}
# The site's six section colours (STUDY-STANDARD rule 20), by the first book of each run in the Berean's order.
DIVISIONS = [("GEN", "history", "History"), ("JOB", "poetry", "Poetry & Wisdom"), ("ISA", "prophets", "Prophets"),
             ("MAT", "gospels", "Gospels & Acts"), ("ROM", "epistles", "Epistles"), ("REV", "revelation", "Revelation")]
# Each part's colour: the colour of the book it opens (03 and 06 open no one book).
PART_TONE = {"01": "gospels", "02": "gospels", "03": "poetry", "04": "prophets", "05": "prophets", "06": "poetry"}

# Part 01: John as three weeks. Notes on two days, each a phrase the study's own text says.
JOHN_DAYS = {1: ("The opening", "John 1:1–18", "read on, and come back to it"),
             20: ("The purpose", "John 20:30–31", "why John wrote")}
JOHN_QUESTION = "What does this chapter show me about who Jesus is?"

# Part 02: an example of six weeks, one mark a day ("1" read, "0" missed). Labelled on the page as an example.
WEEKS_EXAMPLE = "111110111111110011111111011111111100111111"

# Part 03: a sample of the reader, and what each label points at. Each label's words are in the study's part 03.
READER_SAMPLE = "Jonah 1:15–2:2"
READER_LABELS = [
    ("heading", "Jonah 2:1", "A heading", "added by editors to help you find your way", "They are not part of the text."),
    ("chapter", "Jonah 2:1", "A chapter number", "Chapter numbers were added in the early 1200s", "The scene runs straight across it."),
    ("verse", "Jonah 1:17", "A verse number", "useful addresses", "Read across them too."),
    ("lord", "Jonah 1:16", "LORD in capitals", "God's personal name", "“Lord” in ordinary letters means “master”."),
]

# Part 04: Jonah's direction of travel. Each step: verse, its words, the level from there on (0 is dry ground).
DESCENT = [
    ("Jonah 1:3", "went down to Joppa", -1),
    ("Jonah 1:5", "gone down to the lowest part of the vessel", -2),
    ("Jonah 1:15", "cast him into the sea", -3),
    ("Jonah 2:3", "into the heart of the seas", -4),
    ("Jonah 2:6", "To the roots of the mountains I descended", -5),
    ("Jonah 2:10", "onto dry land", 0),
]
APPOINTED = [("Jonah 1:17", "great fish", "fish"), ("Jonah 4:6", "vine", "vine"), ("Jonah 4:7", "worm", "worm"),
             ("Jonah 4:8", "scorching east wind", "wind")]
SAME_COMMAND = ("Get up! Go to the great city of Nineveh", ["Jonah 1:2", "Jonah 3:2"])
REASON = ("Jonah 4:2", "This is why I was so quick to flee toward Tarshish", "Jonah 1:3", "flee to Tarshish")
OPEN_END = "Jonah 4:11"
FISH_WORD = "fish"
# The words Jonah used in 4:2, looked for in the two older verses the study names. Presence is found, not typed.
SHARED_WORDS = ["gracious", "compassionate", "slow to anger", "abounding in loving devotion", "relents from sending disaster"]
SHARED_VERSES = ["Exodus 34:6", "Joel 2:13", "Jonah 4:2"]

# Part 05: the letter around the verse. (verse, note on the page, the verse's own words that the note stands for).
LETTER = "Jeremiah 29:1–14"
LETTER_FOCUS = "Jeremiah 29:11"
LETTER_NOTES = [
    ("Jeremiah 29:1", "Sent to the exiles in Babylon", "the surviving elders among the exiles"),
    ("Jeremiah 29:5", "Build. Plant. Settle.", "Build houses and settle down"),
    ("Jeremiah 29:7", "Pray for the city", "Pray to the LORD on its behalf"),
    ("Jeremiah 29:8", "Do not be deceived", "Do not be deceived"),
    ("Jeremiah 29:10", "Seventy years first", "seventy years"),
    ("Jeremiah 29:11", "The promise", "a future and a hope"),
    ("Jeremiah 29:13", "Seek Me and find Me", "You will seek Me and find Me"),
]
YEARS = [("Jeremiah 28:3", "Within two years", 2, "Hananiah"), ("Jeremiah 29:10", "seventy years", 70, "The letter")]
NUMBER_WORDS = {"two": 2, "seventy": 70}

SOURCES = [
    ("Berean Standard Bible.", "Every verse on the page, from the site's own copy (data/plain/bsb); the editors' headings in the reader sample from the site's noted copy (data/text/bsb)."),
    ("Baptist Faith and Message 2000.", "Articles I and IV, quoted in the study; checked against the site's record of the confession in DOCTRINAL-FOUNDATION.md, not against the published text."),
    ("Babylonian Talmud, Megillah 31a; Mishnah, Avot 3:2.", "Named in the study for the Yom Kippur reading of Jonah and for Rabbi Hanina's saying; not quoted, not held on this PC, and still marked to check."),
    ("Crisis lines.", "The numbers in part 04 are the study's, each still marked to check before publishing."),
]
