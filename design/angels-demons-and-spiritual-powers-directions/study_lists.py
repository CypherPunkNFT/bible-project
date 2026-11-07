"""The lists the Angels, demons and spiritual powers page draws beside the study's own text. build-data.py checks every
phrase here against the Berean or the held source named for it, so a row cannot claim words its verse does not hold.
These are this study's choices for drawing, not a count of everything Scripture says."""
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]  # Jarvis/Projects/BibleProject
# Held sources may only be read from these folders, so a path in this file cannot reach anywhere else.
SOURCE_ROOTS = (PROJECT / "sources", PROJECT / "Website/data/creeds")

TITLE = ("Angels, demons and", "spiritual powers")
CONCEPTS = ["Angels", "The adversary", "Demons", "The powers"]
# The motto is 2 Kings 6:17's own words, checked in that verse.
MOTTO = {"ref": "2 Kings 6:17", "lines": ["Open his eyes", "that he may see."]}

# A short reference such as "(16:10 · BSB)" takes its book from this table, never from a guess. The build fails on a
# short reference not listed here, and on an entry the text no longer uses.
SHORT_REFS = {
    ("intro", "6:17"): "2 Kings",
    ("02", "1:5–6"): "Hebrews", ("02", "13:2"): "Hebrews", ("02", "12:5"): "Acts",
    ("03", "16:10"): "Genesis", ("03", "16:13"): "Genesis",
    ("04", "1:9"): "Job", ("04", "1:12"): "Job", ("04", "2:6"): "Job", ("04", "3:1–2"): "Zechariah",
    ("04", "14:4"): "Isaiah", ("04", "14:12"): "Isaiah", ("04", "28:13–14"): "Ezekiel",
    ("05", "1:25"): "Mark", ("05", "1:27"): "Mark", ("05", "1:34"): "Mark", ("05", "4:24"): "Matthew",
    ("06", "12:11"): "Revelation",
    ("07", "6:10–11"): "Ephesians", ("07", "6:14–18"): "Ephesians", ("07", "4:7"): "James",
    ("07", "10:13"): "Daniel", ("07", "10:12"): "Daniel",
}

# Quoted words with no reference beside them, each pinned to the verse that holds them. Checked in that verse.
PINNED_QUOTES = {
    ("intro", "by the finger of God"): "Luke 11:20",
    ("01", "Him"): "Colossians 1:16",
    ("01", "for Him"): "Colossians 1:16",
    ("04", "to accuse"): "Zechariah 3:1",
}

# Held copies on this PC. "fixes" corrects a scanning error in the held copy, never the study's words; each one is
# named in the README.
SOURCES_HELD = {
    "calvin": {"name": "John Calvin, Institutes of the Christian Religion, trans. John Allen (1813), vol. 1",
               "path": PROJECT / "sources/library/bulk/ia/institutesofchr01calv.txt", "fixes": [("chief augel", "chief angel")]},
    "boyce": {"name": "James Petigru Boyce, Abstract of Systematic Theology (1887)",
              "path": PROJECT / "sources/library/bulk/ccel/boyce_theology.xml"},
    "justin": {"name": "Justin Martyr, Dialogue with Trypho (Ante-Nicene Fathers, vol. 1)",
               "path": PROJECT / "sources/patristic-bulk/ccel/anf01.txt"},
    "trinity": {"name": "Augustine, On the Trinity (Nicene and Post-Nicene Fathers, series 1, vol. 3)",
                "path": PROJECT / "sources/patristic-bulk/ccel/npnf103.txt"},
    "doctrine": {"name": "Augustine, On Christian Doctrine (Nicene and Post-Nicene Fathers, series 1, vol. 2)",
                 "path": PROJECT / "sources/patristic-bulk/ccel/npnf102.txt"},
    "jfb": {"name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory (1871)",
            "path": PROJECT / "sources/library/bulk/ccel/jamieson_jfb.xml"},
    "lbc": {"name": "Second London Baptist Confession (1677/1689)",
            "path": PROJECT / "Website/data/creeds/doc/1689-london-baptist-confession-1677.b1.json"},
    "orthodox": {"name": "The Longer Catechism of the Orthodox, Catholic, Eastern Church (1839)",
                 "path": PROJECT / "Website/data/creeds/doc/longer-catechism-of-the-orthodox-church-1839.b1.json"},
    "bfm": {"name": "Baptist Faith and Message 2000", "path": None},
}

# Quotations from outside Scripture, keyed by the part they stand in. Each must be in its held source within a short
# distance of "near", words that place it in the right chapter or question, so a common phrase cannot pass on text
# from somewhere else. "near" may be the phrase's own neighbour in the source. A source with no held copy is listed
# on the page as not checked by script.
OUTSIDE_QUOTES = {
    ("01", "not to Angels, Saints, or any other Creatures"): ("lbc", "religious worship is to be given to God"),
    ("01", "the invisible was created before the visible, and the angels before men"): ("orthodox", "which was created first"),
    ("01", "the greatest part of it"): ("calvin", "celestial hierarchy"),
    ("01", "mere babbling"): ("calvin", "celestial hierarchy"),
    ("01", "we must forsake the vain imaginations ... concerning the nature, orders, and multitude of angels"): ("calvin", "propagated by triflers"),
    ("02", "Has each one of us his guardian angels?"): ("orthodox", "Without doubt"),
    ("02", "Without doubt,"): ("orthodox", "Has each one of us his guardian angels"),
    ("02", "I know not whether this justifies the conclusion, that every one of them has his particular guardian angel"): ("calvin", "always behold the face"),
    ("02", "that they all with one consent watch for our salvation"): ("calvin", "particular guardian angel"),
    ("02", "the scriptural authority for them is wanting"): ("boyce", "were also prevalent among the earlier Christians"),
    ("03", "another God and Lord subject to the Maker of all things; who is also called an Angel"): ("justin", "I shall attempt to persuade you"),
    ("03", "the same chief angel was the Word of God"): ("calvin", "impiety of Servetus"),
    ("03", "though he was not yet incarnate ... descended, as it were, in a mediatorial capacity"): ("calvin", "the same chief angel was the Word of God"),
    ("03", "were wrought by angels"): ("trinity", "in the person of God"),
    ("03", "in the person of God, as ... the prophets also were wont to do"): ("trinity", "were wrought by angels"),
    ("04", "Through the temptation of Satan man transgressed the command of God"): ("bfm", None),
    ("04", "under the figure of the king of Babylon"): ("doctrine", "son of the morning"),
    ("04", "of the devil"): ("doctrine", "under the figure of the king of Babylon"),
    ("04", "to the Babylonian king primarily"): ("jfb", "fallen once bright star"),
    ("04", "probable that pride was the sin of Satan"): ("boyce", "puffed up"),
    ("07", "certain angels are appointed to preside over kingdoms and provinces"): ("calvin", "angel of the Persians"),
}
NEAR_WINDOW = 1500  # characters of the folded source text, either side of the quotation

# Part 01's one line: everything below it is named as created, in the verse given. Checked in that verse.
ONE_LINE = {
    "above": ("All things were created through Him and for Him", "Colossians 1:16"),
    "below": [
        ("things in heaven", "Colossians 1:16"), ("visible and invisible", "Colossians 1:16"),
        ("thrones", "Colossians 1:16"), ("dominions", "Colossians 1:16"), ("rulers", "Colossians 1:16"),
        ("authorities", "Colossians 1:16"), ("the highest heavens with all their host", "Nehemiah 9:6"),
        ("all His angels", "Psalm 148:2"), ("all His heavenly hosts", "Psalm 148:2"), ("sun and moon", "Psalm 148:3"),
        ("all you shining stars", "Psalm 148:3"), ("the morning stars", "Job 38:7"), ("all the sons of God", "Job 38:7"),
    ],
    "rule": ("He gave the command and they were created", "Psalm 148:5"),
}

# Part 06: Colossians 2:13–15 in its own order. The build proves each phrase is in the passage, after the one before.
ORDER = {"ref": "Colossians 2:13–15", "steps": [
    ("God made you alive with Christ", "made alive"),
    ("He forgave us all our trespasses", "forgiven"),
    ("having canceled the debt", "the debt cancelled"),
    ("nailing it to the cross", "nailed to the cross"),
    ("having disarmed the powers and authorities", "the powers disarmed"),
    ("He made a public spectacle of them", "shown up in public"),
    ("triumphing over them by the cross", "the triumph"),
]}

# The edge chart: for each part, one thing the text reveals (in its verse's words) and what it leaves unsaid (this
# site's words). "views" names who the part shows holding a view; each name must be in that part's text, and where
# the part lists views as bullets there must be exactly one name per bullet.
EDGE_ROWS = {
    "01": {"revealed": "All things were created through Him and for Him", "ref": "Colossians 1:16",
           "unsaid": "When angels were made, how many there are, how they are ranked", "views": ["Orthodox Longer Catechism", "Calvin"]},
    "02": {"revealed": "ministering spirits sent to serve", "ref": "Hebrews 1:14",
           "unsaid": "Whether each believer has one guardian angel", "views": ["Orthodox Longer Catechism", "Calvin", "Boyce"]},
    "03": {"revealed": "You are the God who sees me", "ref": "Genesis 16:13",
           "unsaid": "Who the angel of the LORD is", "views": ["Justin Martyr", "Augustine"]},
    "04": {"revealed": "you must spare his life", "ref": "Job 2:6",
           "unsaid": "Where Satan's fall is told, and how a good creature first chose evil", "views": ["Augustine", "Jamieson, Fausset and Brown", "Boyce"]},
    "05": {"revealed": "He commands even the unclean spirits, and they obey Him", "ref": "Mark 1:27",
           "unsaid": "Any method; whether a believer can be troubled by a demon from within", "views": [], "shown": "The texts are shown; no view is chosen"},
    "06": {"revealed": "triumphing over them by the cross", "ref": "Colossians 2:15",
           "unsaid": "How the years between the cross and the end are to be mapped", "views": [], "shown": "Baptists differ; Study 30 lays out their views"},
    "07": {"revealed": "Resist the devil, and he will flee from you", "ref": "James 4:7",
           "unsaid": "How many powers there are, and where", "views": ["Calvin", "Boyce"]},
}

# The close: what Romans 8:38–39 names as unable to separate us, each checked in the passage.
NOT_SEPARATE = {"ref": "Romans 8:38–39", "centre": "the love of God that is in Christ Jesus our Lord",
                "pairs": [["death", "life"], ["angels", "principalities"], ["the present", "the future"], ["any powers"],
                          ["height", "depth"], ["anything else in all creation"]]}

# Counts made from the site's Berean on every build: verses, not occurrences; whole words, any case.
COUNTS = [
    {"name": "Angels", "pattern": r"\b(?:arch)?angels?\b", "rule": "verses with “angel”, “angels” or “archangel”",
     "means": "Scripture's word for God's messengers; “the angel of the LORD” is among them, cherubim are not"},
    {"name": "The adversary", "pattern": r"\b(?:Satan|devil)\b", "rule": "verses naming “Satan” or “the devil”",
     "means": "one creature under many names; “the serpent” and “the evil one” are not counted"},
    {"name": "Demons", "pattern": r"\bdemons?\b", "rule": "verses with “demon” or “demons”, “demon-possessed” included",
     "means": "almost all of them in the Gospels and Acts, where Jesus drives them out"},
]
# Scripture names two holy angels. Each name must be in exactly these verses of the whole Berean.
NAMED_ANGELS = {"Gabriel": ["Daniel 8:16", "Daniel 9:21", "Luke 1:19", "Luke 1:26"],
                "Michael": ["Daniel 10:13", "Daniel 10:21", "Daniel 12:1", "Jude 1:9", "Revelation 12:7"]}
# "Michael" also names men in Numbers, Chronicles and Ezra; only these books are counted for the angel.
MICHAEL_BOOKS = {"DAN", "JUD", "REV"}

# Studies this one names. A mock-up link must point at a folder that holds an index.html; None means "not yet a page".
STUDY_LINKS = {
    "15": None,
    "18": "/mockups/the-signs-and-works-of-jesus-directions/",
    "25": None,
    "30": "/mockups/the-hope-to-come-directions/",
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("Baptist Faith and Message 2000", "Article III, one sentence. The site's doctrinal standard. No copy is held on this PC, so the sentence is not checked by script."),
    ("Second London Baptist Confession (1677/1689)", "Chapter 22, paragraph 2, from the site's creeds collection."),
    ("The Longer Catechism of the Orthodox Church (1839)", "Questions 103 and 106, from the site's creeds collection; shown as Orthodox teaching."),
    ("John Calvin, Institutes (Allen, 1813)", "Book I, chapter 13 section 10; chapter 14 sections 4 and 7."),
    ("James Petigru Boyce, Abstract of Systematic Theology (1887)", "Chapter 18, on guardian angels and the sin of the evil angels."),
    ("Justin Martyr, Dialogue with Trypho", "Chapter 56."),
    ("Augustine, On the Trinity and On Christian Doctrine", "Book III, chapter 11; book III, chapter 37."),
    ("Jamieson, Fausset and Brown (1871)", "On Isaiah 14:12–15."),
]
