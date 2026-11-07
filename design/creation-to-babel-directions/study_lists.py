"""The lists the Genesis 1–11 page draws beside the study's own text. build-data.py checks every phrase and number here
against the Berean (and the Berean's own footnotes), so a drawing cannot claim words or numbers its verse does not hold.
These are this study's choices for drawing, not a count of anything beyond what each list says."""

HOME_BOOK = "Genesis"  # a bare reference such as "(5:5 · BSB)" is Genesis unless its sentence names another book first
# Book names the study uses on their own as the subject of a sentence ("Luke ends his list…", "Hebrews says…").
BARE_BOOK_WORDS = ("Luke", "Hebrews")

# Section headings inside a question, and the tier each one is drawn as. Any other heading stops the build.
TIERS = {
    "What the text shows": "text",
    "The views Christians hold": "readings",
    "The readings Christians give": "readings",
    "Where the reading stops": "stops",
    "A reading this study refuses": "refused",
    "Where Scripture takes it": "later",
}

# The heading's three concepts, in gold capitals, and the drawing's two-line motto.
CONCEPTS = ["The text", "Later Scripture", "The readings"]
MOTTO = ["Eleven chapters. Eight questions.", "Read the verse before the view."]

# 01: the days. Each tile's words are checked in its verse. Day seven has no refrain; build-data.py proves the refrain
# is in exactly six verses of Genesis 1 and in none of Genesis 2:1–3.
REFRAIN = "there was evening, and there was morning"
DAYS = [
    {"day": 1, "ref": "Genesis 1:3", "words": "Let there be light", "made": "Light"},
    {"day": 2, "ref": "Genesis 1:6", "words": "Let there be an expanse between the waters", "made": "The sky, between the waters"},
    {"day": 3, "ref": "Genesis 1:9", "words": "so that the dry land may appear", "made": "Dry land and plants"},
    {"day": 4, "ref": "Genesis 1:14", "words": "Let there be lights in the expanse of the sky", "made": "The lights"},
    {"day": 5, "ref": "Genesis 1:20", "words": "Let the waters teem with living creatures, and let birds fly above the earth", "made": "Sea creatures and birds"},
    {"day": 6, "ref": "Genesis 1:24", "words": "Let the earth bring forth living creatures", "made": "Land animals and man"},
    {"day": 7, "ref": "Genesis 2:2", "words": "on that day He rested from all His work", "made": "Rest"},
]

# 04: the ages. Each part is a phrase holding the number, in its verse. Genesis 11 gives two numbers a man (his age when
# his son was born, and the years after); the drawing shows their sum. "open" marks Enoch, whose verse has no death.
AGES = [
    {"name": "Adam", "parts": [("Genesis 5:5", "lived a total of 930 years", 930)]},
    {"name": "Seth", "parts": [("Genesis 5:8", "lived a total of 912 years", 912)]},
    {"name": "Enosh", "parts": [("Genesis 5:11", "lived a total of 905 years", 905)]},
    {"name": "Kenan", "parts": [("Genesis 5:14", "lived a total of 910 years", 910)]},
    {"name": "Mahalalel", "parts": [("Genesis 5:17", "lived a total of 895 years", 895)]},
    {"name": "Jared", "parts": [("Genesis 5:20", "lived a total of 962 years", 962)]},
    {"name": "Enoch", "parts": [("Genesis 5:23", "lived a total of 365 years", 365)], "open": ("Genesis 5:24", "God had taken him away")},
    {"name": "Methuselah", "parts": [("Genesis 5:27", "lived a total of 969 years", 969)]},
    {"name": "Lamech", "parts": [("Genesis 5:31", "lived a total of 777 years", 777)]},
    {"name": "Noah", "parts": [("Genesis 9:29", "lived a total of 950 years", 950)], "flood": True},
    {"name": "Shem", "parts": [("Genesis 11:10", "Shem was 100 years old", 100), ("Genesis 11:11", "Shem lived 500 years", 500)]},
    {"name": "Arphaxad", "parts": [("Genesis 11:12", "Arphaxad was 35 years old", 35), ("Genesis 11:13", "Arphaxad lived 403 years", 403)]},
    {"name": "Shelah", "parts": [("Genesis 11:14", "Shelah was 30 years old", 30), ("Genesis 11:15", "Shelah lived 403 years", 403)]},
    {"name": "Eber", "parts": [("Genesis 11:16", "Eber was 34 years old", 34), ("Genesis 11:17", "Eber lived 430 years", 430)]},
    {"name": "Peleg", "parts": [("Genesis 11:18", "Peleg was 30 years old", 30), ("Genesis 11:19", "Peleg lived 209 years", 209)]},
    {"name": "Reu", "parts": [("Genesis 11:20", "Reu was 32 years old", 32), ("Genesis 11:21", "Reu lived 207 years", 207)]},
    {"name": "Serug", "parts": [("Genesis 11:22", "Serug was 30 years old", 30), ("Genesis 11:23", "Serug lived 200 years", 200)]},
    {"name": "Nahor", "parts": [("Genesis 11:24", "Nahor was 29 years old", 29), ("Genesis 11:25", "Nahor lived 119 years", 119)]},
    {"name": "Terah", "parts": [("Genesis 11:32", "Terah lived 205 years", 205)]},
    {"name": "Abraham", "parts": [("Genesis 25:7", "Abraham lived a total of 175 years", 175)]},
    {"name": "Moses", "parts": [("Deuteronomy 34:7", "a hundred and twenty years old", 120)]},
]
PSALM_90 = {"ref": "Psalm 90:10", "words": "seventy years— or eighty if we are strong", "low": 70, "high": 80}
SEPTUAGINT_NOTE = {"ref": "Genesis 11:13", "has": ["LXX", "Cainan", "adds 100 years"]}

# 06: the flood's calendar, in the narrator's own dates. Months are drawn equal; the text gives month and day only.
FLOOD = [
    {"ref": "Genesis 7:11", "words": "on the seventeenth day of the second month", "year": 600, "month": 2, "day": 17, "what": "The flood begins"},
    {"ref": "Genesis 7:24", "words": "the waters prevailed upon the earth for 150 days", "what": "The waters prevail 150 days", "span": 150},
    {"ref": "Genesis 8:4", "words": "On the seventeenth day of the seventh month", "year": 600, "month": 7, "day": 17, "what": "The ark rests on the mountains of Ararat"},
    {"ref": "Genesis 8:5", "words": "on the first day of the tenth month", "year": 600, "month": 10, "day": 1, "what": "The tops of the mountains are seen"},
    {"ref": "Genesis 8:13", "words": "on the first day of the first month", "year": 601, "month": 1, "day": 1, "what": "The waters have dried up"},
    {"ref": "Genesis 8:14", "words": "By the twenty-seventh day of the second month", "year": 601, "month": 2, "day": 27, "what": "The earth is fully dry"},
]
YEAR_WORDS = [("Genesis 7:11", "In the six hundredth year of Noah", 600), ("Genesis 8:13", "In Noah’s six hundred and first year", 601)]
ARK = {"ref": "Genesis 6:15", "words": "300 cubits long, 50 cubits wide, and 30 cubits high", "long": 300, "wide": 50, "high": 30}

# 08: the three closing lines of Genesis 10 that name languages, and the two "name" verses that face each other.
LANGUAGES = [
    {"ref": "Genesis 10:5", "who": "Japheth", "words": "according to their languages"},
    {"ref": "Genesis 10:20", "who": "Ham", "words": "These are the sons of Ham"},
    {"ref": "Genesis 10:31", "who": "Shem", "words": "These are the sons of Shem"},
]
NAMES = [
    {"ref": "Genesis 11:4", "who": "The builders", "words": "make a name for ourselves"},
    {"ref": "Genesis 12:2", "who": "God, to Abram", "words": "I will make your name great"},
]
THREAD = [
    {"ref": "Genesis 11:8", "words": "the LORD scattered them", "label": "Babel"},
    {"ref": "Genesis 12:3", "words": "all the families of the earth will be blessed through you", "label": "Abram"},
    {"ref": "Acts 2:8", "words": "in his own native language", "label": "Pentecost", "reading": "A reading: Acts does not name Babel."},
    {"ref": "Revelation 7:9", "words": "from every nation and tribe and people and tongue", "label": "The end"},
]

# Facts the study states in its own voice, each tested.
FACTS = [
    {"says": "The curse names Canaan three times (9:25–27).", "in": [("Genesis 9:25", "Canaan"), ("Genesis 9:26", "Canaan"), ("Genesis 9:27", "Canaan")], "not_in": []},
    {"says": "Matthew writes Joram the father of Uzziah, where Chronicles lists Ahaziah, Joash and Amaziah between them.",
     "in": [("Matthew 1:8", "Joram the father of Uzziah"), ("1 Chronicles 3:11–12", "Ahaziah"), ("1 Chronicles 3:11–12", "Joash"), ("1 Chronicles 3:11–12", "Amaziah")],
     "not_in": [("Matthew 1:8", "ahaziah"), ("Matthew 1:8", "joash"), ("Matthew 1:8", "amaziah")]},
    {"says": "The Berean's note at 2 Peter 2:4 cites 1 Enoch.", "notes": [("2 Peter 2:4", "1 Enoch")]},
]

# Quotations of the Berean's own footnotes, each checked against the notes at that verse.
NOTE_QUOTES = {
    "Literally day one": "Genesis 1:5",
    "Hebrew Adam": "Genesis 5:2",
    "approximately 450 feet long, 75 feet wide, and 45 feet high": "Genesis 6:15",
    "Babylonia": "Genesis 11:2",
    "Babylon": "Genesis 11:9",
    "sounds like the Hebrew for confused": "Genesis 11:9",
}

# Bible words quoted again from an earlier part, where the paragraph does not cite the verse again.
RECALLED = {"one man": "Romans 5:12"}

# Quoted words that are not Scripture: phrase -> (where it comes from, the part it may appear in, the held text it is
# checked against). "00" is the opening. A held text is matched by script; None means not held on this PC, compared by
# eye, and the README says so. The held texts are named in passage-notes.md.
HELD_TEXTS = {
    "augustine": "sources/library/source-patristic-ccel/npnf102.txt",
    "justin": "sources/library/source-patristic-ccel/anf01.txt",
    "calvin": "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-01/calcom01.xml",
}
OUTSIDE_QUOTES = {
    "the Creator": ("Baptist Faith and Message 2000, article II", "00", None),
    "Man is the special creation of God": ("Baptist Faith and Message 2000, article III", "00", None),
    "Man is the special creation of God, made in His own image": ("Baptist Faith and Message 2000, article III", "02", None),
    "sinned against God and brought sin into the human race": ("Baptist Faith and Message 2000, article III", "02", None),
    "possesses full dignity and is worthy of respect and Christian love": ("Baptist Faith and Message 2000, article III", "07", None),
    "What kind of days these were it is extremely difficult, or perhaps impossible for us to conceive": ("Augustine, City of God XI.6", "01", "augustine"),
    "not 6000 years have yet passed": ("Augustine, City of God XII.10", "01", "augustine"),
    "that God himself took the space of six days": ("Calvin, Commentaries on Genesis, on 1:5", "01", "calvin"),
    "Because It Had Not Rained": ("Meredith G. Kline, article title (1958)", "01", None),
    "brothers and sisters were united in marriage": ("Augustine, City of God XV.16", "03", "augustine"),
    "there were no human beings but the brothers and sisters born of those two first parents": ("Augustine, City of God XV.16", "03", "augustine"),
    "a time of repentance to be granted to the whole world": ("Calvin, Commentaries on Genesis, on 6:3", "04", "calvin"),
    "one of our years may be supposed to be equal to ten of theirs": ("Augustine, City of God XV.12", "04", "augustine"),
    "Primeval Chronology": ("William Henry Green, article title (1890)", "04", None),
    "transgressed this appointment, and were captivated by love of women": ("Justin Martyr, Second Apology 5", "05", "justin"),
    "the sons of God, who were according to the flesh the sons of Seth": ("Augustine, City of God XV.23", "05", "augustine"),
    "they forsook righteousness": ("Augustine, City of God XV.23", "05", "augustine"),
    "the Chaldean paraphrase": ("Calvin, Commentaries on Genesis, on 6:2", "05", "calvin"),
    "Divine Kingship and Genesis 6:1–4": ("Meredith G. Kline, article title (1962)", "05", None),
    "the curse of Ham": ("the name given to the misreading this study refuses", "07", None),
}

# Labels the page sets on a reading, in the study's own terms: (question, place of the reading in it, from 0) -> label.
VIEW_TAGS = {
    ("02", 0): "The confession’s reading",
    ("02", 2): "Shown so you can recognise it · not this site’s view",
}

# What the study is expected to hold. A change to content.md that alters these stops the build until it is looked at.
EXPECTED = {"parts": 8, "bullets": 23}

# Studies the text names in italics. A study with a mock-up folder links to it; the rest are named only. Fixed here, not
# read from disk, so the build does not change when another study's folder appears or disappears.
STUDY_LINKS = {
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "Angels, demons and spiritual powers": "/mockups/angels-demons-and-spiritual-powers-directions/",
    "In the beginning": None,
}

SOURCES = [
    ("The Berean Standard Bible", "Every verse, every quoted phrase, every number drawn and every footnote quoted, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles II, III and XV, in short phrases. The site's doctrinal standard. Not held in full on this PC: compared by eye."),
    ("Augustine, The City of God (tr. Dods)", "XI.6, XII.10, XV.12, XV.14, XV.16, XV.23. Read directly in the held text."),
    ("Justin Martyr, Second Apology 5", "Read directly in the held text."),
    ("John Calvin, Commentaries on Genesis (tr. King)", "On 1:5, 6:2 and 6:3. Read directly in the held text."),
    ("The modern writers named in each question", "Named for the position each is widely known to hold, by title and year. Not opened for this study; nothing is quoted from them. To be checked before publishing."),
]
