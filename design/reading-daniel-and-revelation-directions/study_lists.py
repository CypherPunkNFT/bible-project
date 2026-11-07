"""The lists the Reading Daniel and Revelation page draws beside the study's own text. build-data.py checks every phrase
here against the Berean, the Berean's own notes and headings, or the held copy of the outside source named for it, so a
row cannot claim words its verse or source does not hold. These are this page's choices for drawing, not a count of
everything the two books say."""
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]  # Jarvis/Projects/BibleProject
# Held sources may only be read from these folders, so a path in this file cannot reach anywhere else.
SOURCE_ROOTS = (PROJECT / "sources", PROJECT / "Website/data/creeds", PROJECT / "DOCTRINAL-FOUNDATION.md")

TITLE = ("Reading Daniel", "and Revelation")
CONCEPTS = ["Visions", "Pictures", "Numbers", "The throne"]
# The motto is Daniel 7:9's own words, checked in that verse: the drawing is the sea of Daniel 7 below, with the beasts
# rising, and the throne of fire above it, set while they rise. Nothing is drawn on the throne.
MOTTO = {"ref": "Daniel 7:9", "lines": ["As I continued to watch,", "thrones were set in place."]}

# A short reference such as "(7:15 · BSB)" takes its book from this table, never from a guess. Where one section uses
# the same short reference for two books, the value maps a word found just before it to the book. The build fails on a
# short reference not listed here, and on an entry the text no longer uses.
DAN, REV = "Daniel", "Revelation"
SHORT_REFS = {
    ("01", "7:15"): DAN, ("01", "2:4"): DAN, ("01", "1:21"): DAN, ("01", "1:3"): REV, ("01", "1:4"): REV, ("01", "1:11"): REV,
    ("01", "1:1"): {"Jehoiakim": DAN, "soon come to pass": REV},
    ("02", "8:20–21"): DAN, ("02", "12:9"): REV, ("02", "5:8"): REV, ("02", "5:5–6"): REV, ("02", "7:4"): REV,
    ("02", "7:9"): REV, ("02", "5:6"): REV,
    ("03", "1:13"): REV, ("03", "10:10"): REV, ("03", "15:3"): REV, ("03", "1:7"): REV,
    ("04", "1:11"): REV, ("04", "5:1"): REV, ("04", "8:6"): REV, ("04", "16:1"): REV, ("04", "5:6"): REV, ("04", "7:5–8"): REV,
    ("04", "21:12"): REV, ("04", "21:16–17"): REV, ("04", "12:7"): DAN, ("04", "11:2"): REV, ("04", "13:5"): REV,
    ("04", "11:3"): REV, ("04", "12:6"): REV, ("04", "12:14"): REV, ("04", "9:24"): DAN, ("04", "9:24–25"): DAN, ("04", "9:26"): DAN,
    ("05", "2:34–35"): DAN, ("05", "2:44"): DAN, ("05", "4:25"): DAN, ("05", "7:13–14"): DAN, ("05", "7:18"): DAN,
    ("05", "2:38"): DAN, ("05", "8:20–21"): DAN, ("05", "5:6"): REV, ("05", "13:2"): REV, ("05", "13:5"): REV,
    ("05", "13:7"): REV, ("05", "13:4"): REV, ("05", "17:14"): REV,
    ("06", "1:1"): REV, ("06", "1:3"): REV, ("06", "22:10"): REV, ("06", "1:19"): REV, ("06", "4:1"): REV, ("06", "13:1–8"): REV,
    ("07", "6:10"): {"knees": DAN, "How long": REV},
    ("07", "2:7"): REV, ("07", "6:11"): REV, ("07", "12:11"): REV, ("07", "13:10"): REV, ("07", "19:10"): REV,
    ("close", "22:20"): REV,
}

# A whole chapter named without a verse ("Daniel 7") opens that whole chapter. Only these books are linked this way.
CHAPTER_BOOKS = ("Daniel", "Revelation", "Zechariah", "2 Thessalonians")

# Quoted words that are the Berean's own footnote, not its verse text: each is checked in the notes of the verse named.
BEREAN_NOTES = {
    ("01", "the original text from this point of Daniel 2:4 through Daniel 7:28 is in Aramaic"): "Daniel 2:4",
    ("04", "Seventy sevens"): "Daniel 9:24",
    ("04", "some manuscripts"): "Revelation 13:18",
    ("06", "Or suddenly or quickly"): "Revelation 1:1",
}

# Quoted words with no reference beside them, each pinned to the verse that holds them. Checked in that verse.
PINNED_QUOTES = {
    ("05", "was given"): "Revelation 13:2–7",
}

# Words the study quotes as a phrase that is not Scripture's: each carries the check that makes its claim true.
OWN_TERMS = {
    ("03", "as it is written"): {"absent_from": "Revelation"},  # "Revelation never once says 'as it is written'"
}

# Held copies on this PC. Each outside quotation must be found, as words, in its source.
SOURCES_HELD = {
    "irenaeus": {"name": "Irenaeus, Against Heresies (Ante-Nicene Fathers, vol. 1)",
                 "path": PROJECT / "sources/library/source-patristic-ccel/anf01.txt"},
    "calvin24": {"name": "John Calvin, Commentaries on Daniel, vol. 1 (trans. Myers)",
                 "path": PROJECT / "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-24/calcom24.xml"},
    "calvin25": {"name": "John Calvin, Commentaries on Daniel, vol. 2 (trans. Myers)",
                 "path": PROJECT / "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-25/calcom25.xml"},
    "warfield": {"name": "B. B. Warfield, The Millennium and the Apocalypse (1904)",
                 "path": PROJECT / "sources/library/bulk/ia/millenniumapocal00warf.txt"},
    "barnes": {"name": "Albert Barnes, Notes on the New Testament",
               "path": PROJECT / "sources/library/bulk/ccel/barnes_ntnotes.xml"},
    "lbc": {"name": "Second London Baptist Confession (1677/1689)",
            "path": PROJECT / "Website/data/creeds/doc/1689-london-baptist-confession-1677.b1.json"},
    "criswell": {"name": "W. A. Criswell, \"For the Time Is at Hand\" (1961)",
                 "path": PROJECT / "sources/library/source-criswell/asset-sermons-criswell-14395/original.html"},
    # Not the confession itself: the site's own record of its wording. The README says so.
    "bfm": {"name": "Baptist Faith and Message 2000, as recorded in the site's doctrinal foundation",
            "path": PROJECT / "DOCTRINAL-FOUNDATION.md"},
}

# Quotations from outside Scripture, keyed by the part they stand in, each to its held source.
OUTSIDE_QUOTES = {
    ("01", "truth, without any mixture of error"): "bfm",
    ("02", "The descriptions are descriptions not of the real occurrences themselves, but of symbols of the real occurrences"): "warfield",
    ("02", "we are to avoid pressing details"): "warfield",
    ("02", "spiritualizing"): "criswell",
    ("04", "did not terminate till the baptism of Christ"): "calvin25",
    ("04", "all the most approved and ancient copies"): "irenaeus",
    ("04", "It is therefore more certain, and less hazardous, to await the fulfilment of the prophecy, than to be making surmises"): "irenaeus",
    ("05", "not for the king's sake so much as for the consolation and support of the remnant of the faithful"): "calvin24",
    ("06", "For the Time Is at Hand"): "criswell",
    ("06", "persecuting and heathen Rome"): "barnes",
    ("06", "towards the end of Domitian's reign"): "irenaeus",
    ("06", "that antichrist, that man of sin"): "lbc",
    ("06", "repeating with progressive clearness, fullness and richness the whole history"): "warfield",
    ("06", "not for knowledge's own sake"): "warfield",
    ("06", "to make known unto action"): "warfield",
    ("06", "personally and visibly"): "bfm",
}

# ── The two books, chapter by chapter (the chart under the heading) ──
# Words counted in every verse of both books. A count of words, not a reading: Daniel 4's beasts are animals of the field.
CHART_WORDS = {"throne": r"\bthrones?\b", "beast": r"\bbeasts?\b"}
# Places the study's own text marks, each with its words checked in the verse.
CHART_MARKS = [
    {"ref": "Daniel 7:3", "t": "four great beasts came up out of the sea", "label": "Beasts from the sea"},
    {"ref": "Daniel 7:9", "t": "thrones were set in place", "label": "Thrones set"},
    {"ref": "Daniel 12:4", "t": "seal the book", "label": "Sealed", "seal": "shut"},
    {"ref": "Revelation 1:11", "t": "send it to the seven churches", "label": "Seven churches"},
    {"ref": "Revelation 4:1", "t": "a door standing open in heaven", "label": "Door open"},
    {"ref": "Revelation 13:1", "t": "a beast with ten horns and seven heads rising out of the sea", "label": "Beast from the sea"},
    {"ref": "Revelation 22:10", "t": "Do not seal up the words of prophecy", "label": "Left open", "seal": "open"},
]

# ── 01 What kind of writing ──
NAMES = [
    {"name": "An unveiling", "t": "the revelation of Jesus Christ", "ref": "Revelation 1:1"},
    {"name": "A prophecy", "t": "the words of this prophecy", "ref": "Revelation 1:3"},
    {"name": "A letter", "t": "Grace and peace to you", "ref": "Revelation 1:4"},
]
HALVES = [
    {"name": "Stories told about Daniel", "from": 1, "to": 6, "t": "Daniel, Hananiah, Mishael, and Azariah", "ref": "Daniel 1:6"},
    {"name": "Visions told by Daniel", "from": 7, "to": 12, "t": "I, Daniel", "ref": "Daniel 7:15"},
]
ARAMAIC = {"note_ref": "Daniel 2:4", "note_says": "through Daniel 7:28", "from": "2:4", "to": "7:28"}

# ── 02 Pictures that explain themselves ──
# One small drawing per self-explaining picture, in the order of the part's list.
KEY_GLYPHS = ["beasts", "ram", "stars", "dragon", "bowl"]
HEARD_SEEN = [
    {"heard": "the Lion of the tribe of Judah", "hr": "Revelation 5:5", "seen": "a Lamb who appeared to have been slain", "sr": "Revelation 5:6"},
    {"heard": "the number of those who were sealed, 144,000", "hr": "Revelation 7:4", "seen": "a multitude too large to count", "sr": "Revelation 7:9"},
]
UNEXPLAINED = [
    {"t": "on its back it had four wings like those of a bird", "ref": "Daniel 7:6"},
    {"t": "Seal up what the seven thunders have said", "ref": "Revelation 10:4"},
]

# ── 03 Old pictures in a new vision ──
# "how" is worked out by the build: "heading" or "note" if the Berean's own heading or footnote at or beside the
# Revelation verse names the older passage; otherwise "side", read side by side.
ECHOES = [
    {"name": "Beasts merged", "rev": "like a leopard, with the feet of a bear and the mouth of a lion", "rr": "Revelation 13:2",
     "old": "It was like a leopard", "or": "Daniel 7:6", "look": ["Revelation 13:1"], "names": "Daniel 7"},
    {"name": "White as wool", "rev": "white like wool, as white as snow", "rr": "Revelation 1:14",
     "old": "white as snow, and the hair of His head was like pure wool", "or": "Daniel 7:9", "look": [], "names": "Daniel 7:9"},
    {"name": "Four faces", "rev": "like a lion, the second like a calf", "rr": "Revelation 4:7",
     "old": "the face of a lion on the right side, the face of an ox", "or": "Ezekiel 1:10", "look": [], "names": "Ezekiel 1:10"},
    {"name": "The sweet scroll", "rev": "as sweet as honey in my mouth", "rr": "Revelation 10:10",
     "old": "it was as sweet as honey in my mouth", "or": "Ezekiel 3:3", "look": ["Revelation 10:9"], "names": "Ezekiel 3:3"},
    {"name": "Olive trees", "rev": "the two olive trees and the two lampstands", "rr": "Revelation 11:4",
     "old": "two olive trees beside it", "or": "Zechariah 4:3", "look": ["Revelation 11:4"], "names": "Zechariah 4:14"},
    {"name": "Water to blood", "rev": "it turned to blood", "rr": "Revelation 16:3",
     "old": "all the water was turned to blood", "or": "Exodus 7:20", "look": [], "names": "Exodus 7:20"},
    {"name": "With the clouds", "rev": "He is coming with the clouds", "rr": "Revelation 1:7",
     "old": "coming with the clouds of heaven", "or": "Daniel 7:13", "look": ["Revelation 1:7"], "names": "Daniel 7:13"},
    {"name": "Pierced", "rev": "even those who pierced Him", "rr": "Revelation 1:7",
     "old": "the One they have pierced", "or": "Zechariah 12:10", "look": ["Revelation 1:7"], "names": "Zechariah 12:10"},
]

# ── 04 Numbers that speak ──
HALF_SEVEN = [
    {"form": "a time, and times, and half a time", "refs": ["Daniel 7:25", "Daniel 12:7", "Revelation 12:14"], "units": [1, 2, 0.5]},
    {"form": "42 months", "refs": ["Revelation 11:2", "Revelation 13:5"], "count": 42},
    {"form": "1,260 days", "refs": ["Revelation 11:3", "Revelation 12:6"], "count": 1260},
]
DAYS_IN_MONTH = 30  # the study's own arithmetic: "42 months of 30 days"
WEEKS = {"ref": "Daniel 9:25", "t": "seven weeks and sixty-two weeks", "split": [7, 62],
         "last_ref": "Daniel 9:27", "last": "for one week", "cut_ref": "Daniel 9:26", "cut": "the Messiah will be cut off"}
# The two readings of the weeks, in the study's words (part 04), each checked in the part's text.
WEEK_READINGS = [
    {"who": "John Calvin", "shape": "joined", "says": "fulfilled at Christ's first coming"},
    {"who": "W. A. Criswell", "shape": "gap", "says": "the seventieth week is still to come"},
]

# ── 05 Beasts and thrones ──
STATUE = [
    {"part": "Head", "metal": "pure gold", "ref": "Daniel 2:32", "means": "You are that head of gold", "mr": "Daniel 2:38"},
    {"part": "Chest and arms", "metal": "silver", "ref": "Daniel 2:32", "means": "another kingdom, inferior to yours", "mr": "Daniel 2:39"},
    {"part": "Belly and thighs", "metal": "bronze", "ref": "Daniel 2:32", "means": "a third kingdom, one of bronze", "mr": "Daniel 2:39"},
    {"part": "Legs", "metal": "iron", "ref": "Daniel 2:33", "means": "a fourth kingdom as strong as iron", "mr": "Daniel 2:40"},
    {"part": "Feet", "metal": "part iron and part clay", "ref": "Daniel 2:33", "means": "this will be a divided kingdom", "mr": "Daniel 2:41"},
]
STONE = {"t": "a stone was cut out, but not by human hands", "ref": "Daniel 2:34",
         "means": "a kingdom that will never be destroyed", "mr": "Daniel 2:44"}
# Which four kingdoms: each name must be in part 05's text. None means the reading's holders, as the study reports
# them, are not given a name for that kingdom on this page.
EMPIRES = [
    {"who": "Calvin, like Jerome", "names": ["Babylon", "Persia", "Greece", "Rome"]},
    {"who": "The second-century date", "names": ["Babylon", None, None, "the Greek kingdoms"]},
]
GIVEN = [
    {"t": "the dragon gave the beast his power and his throne", "ref": "Revelation 13:2"},
    {"t": "The beast was given a mouth", "ref": "Revelation 13:5"},
    {"t": "authority to act for 42 months", "ref": "Revelation 13:5"},
    {"t": "the beast was permitted to wage war against the saints", "ref": "Revelation 13:7"},
    {"t": "it was given authority over every tribe", "ref": "Revelation 13:7"},
]

# ── 06 Four ways to read Revelation ──
# Each "beast" phrase and each holder is checked in part 06's own text.
FOUR_WAYS = [
    {"way": "Mostly past", "beast": "the persecuting Roman Empire", "holder": "Moses Stuart"},
    {"way": "The church's history", "beast": "the papacy", "holder": "Second London Baptist Confession"},
    {"way": "Mostly future", "beast": "a world ruler still to come", "holder": "Criswell"},
    {"way": "The whole age", "beast": "every power that demands the worship that belongs to God", "holder": "Warfield"},
]
SHARED = ["the beast is real", "it is opposed to Christ", "it is permitted and limited", "it falls"]

# ── 07 Written to comfort ──
# The seven churches of Revelation 1:11 and Patmos (1:9). Positions are the modern sites, rounded; only the points and
# the order of the letters are drawn, with no coastline. Each city's name is checked in its letter's first verse and
# each promise in its verse, which must speak of the one who overcomes.
PATMOS = {"name": "Patmos", "lat": 37.32, "lon": 26.55, "ref": "Revelation 1:9"}
CHURCHES = [
    {"name": "Ephesus", "lat": 37.94, "lon": 27.34, "opens": "Revelation 2:1", "promise": "the right to eat from the tree of life", "ref": "Revelation 2:7"},
    {"name": "Smyrna", "lat": 38.42, "lon": 27.14, "opens": "Revelation 2:8", "promise": "will not be harmed by the second death", "ref": "Revelation 2:11"},
    {"name": "Pergamum", "lat": 39.13, "lon": 27.18, "opens": "Revelation 2:12", "promise": "a white stone inscribed with a new name", "ref": "Revelation 2:17"},
    {"name": "Thyatira", "lat": 38.92, "lon": 27.84, "opens": "Revelation 2:18", "promise": "I will give authority over the nations", "ref": "Revelation 2:26"},
    {"name": "Sardis", "lat": 38.49, "lon": 28.04, "opens": "Revelation 3:1", "promise": "will be dressed in white", "ref": "Revelation 3:5"},
    {"name": "Philadelphia", "lat": 38.35, "lon": 28.52, "opens": "Revelation 3:7", "promise": "a pillar in the temple of My God", "ref": "Revelation 3:12"},
    {"name": "Laodicea", "lat": 37.84, "lon": 29.11, "opens": "Revelation 3:14", "promise": "the right to sit with Me on My throne", "ref": "Revelation 3:21"},
]

# Named studies: "Study N" in the text, and studies named by title in italics. None: not a page yet, shown in italics.
STUDY_LINKS = {
    "30": "/mockups/the-hope-to-come-directions/",
    "12": "/mockups/who-do-you-say-that-i-am-directions/",  # Names and titles of Jesus is being merged into this study
}
STUDY_TITLES = {"The Christian and the state": None}

SOURCES = [
    ("The Berean Standard Bible", "Every verse, quoted phrase and footnote, checked by script against the site's copy; the headings that pair Revelation 13 with Daniel 7 are the Berean's."),
    ("Irenaeus, Against Heresies", "Book 5, chapter 30 (Ante-Nicene Fathers, vol. 1, CCEL text): 666, the three names, the date of the vision."),
    ("John Calvin, Commentaries on Daniel (trans. Thomas Myers)", "Vol. 1 on Daniel 2; vol. 2 on Daniel 9:24–25 (CCEL texts)."),
    ("B. B. Warfield, The Millennium and the Apocalypse (1904)", "Pages 600–601, from the Internet Archive scan's OCR text; page images not seen."),
    ("W. A. Criswell, sermons at First Baptist Dallas", "\"For the Time Is at Hand\" (1961), \"The One Hundred Forty-Four Thousand\" (1962), \"The Times of the Gentiles\" (1967). Rights reserved: told in the site's words, one word and one title quoted."),
    ("Albert Barnes, Notes on the New Testament", "On Revelation 1:1, for Moses Stuart's reading. Stuart's own commentary was not read."),
    ("Second London Baptist Confession (1677/1689)", "Chapter 26, paragraph 4, from the site's creeds collection."),
    ("Baptist Faith and Message 2000", "Articles I and X, two phrases, checked against the site's doctrinal foundation, not against the confession's own published text."),
    ("Joseph Angus", "Not read: named only as Criswell cites him."),
]
