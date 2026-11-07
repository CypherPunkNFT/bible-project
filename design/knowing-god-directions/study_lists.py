"""The lists the Knowing God page draws beside the study's own text. build-data.py checks every phrase here against
the Berean or a held source, so a line cannot claim words its verse or source does not hold. These are this page's
choices, not counts, except where a list says it is a census and the build proves it."""
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]  # Jarvis/Projects/BibleProject

# The Way paragraph's own pairs: what God is said to be, and what He is doing in the same passage. "word" and each
# "deed" must be in the Way paragraph as written; "verse" must be in the verse at "ref", inside that part's main readings.
# "providence" and "Creator" have no verse of their own: they are the study's words (see OWN_TERMS).
PAIRS = [
    {"word": "I AM", "ref": "Exodus 3:14", "verse": "I AM WHO I AM",
     "deeds": [{"part": "01", "deed": "I have seen", "ref": "Exodus 3:7", "verse": "I have indeed seen the affliction of My people"}]},
    {"word": "Holy", "ref": "Isaiah 6:3", "verse": "Holy, holy, holy is the LORD of Hosts",
     "deeds": [{"part": "02", "deed": "a coal from the altar", "ref": "Isaiah 6:6", "verse": "a glowing coal that he had taken with tongs from the altar"}]},
    {"word": "Gracious", "ref": "Exodus 34:6", "verse": "compassionate and gracious",
     "deeds": [{"part": "03", "deed": "new tablets", "ref": "Exodus 34:1", "verse": "Chisel out two stone tablets like the originals"}]},
    {"word": "Great and awesome", "ref": "Deuteronomy 10:17", "verse": "the great, mighty, and awesome God",
     "deeds": [{"part": "04", "deed": "a widow's bread", "ref": "Deuteronomy 10:18", "verse": "He executes justice for the fatherless and widow"}]},
    {"word": "Love", "ref": "1 John 4:8", "verse": "God is love",
     "deeds": [{"part": "05", "deed": "a Son sent", "ref": "1 John 4:10", "verse": "sent His Son as the atoning sacrifice for our sins"}]},
    {"word": "Creator", "ref": "Acts 17:24", "verse": "The God who made the world and everything in it",
     "deeds": [{"part": "07", "deed": "breath given to everyone", "ref": "Acts 17:25", "verse": "He Himself gives everyone life and breath and everything else"}]},
    {"word": "providence", "ref": None, "verse": None,
     "deeds": [{"part": "08", "deed": "a sparrow", "ref": "Matthew 10:29", "verse": "not one of them will fall to the ground apart from the will of your Father"},
               {"part": "09", "deed": "a famine survived", "ref": "Genesis 50:20", "verse": "to preserve the lives of many people"}]},
]

# A census, proved by the build: every verse of the Berean holding these words, split by who they are said of.
ECHO_PHRASE = "slow to anger"
ECHO_OF_GOD = [
    {"ref": "Exodus 34:6", "who": "The LORD proclaims His own name to Moses.", "context": ("Exodus 34:5", "proclaimed His name")},
    {"ref": "Numbers 14:18", "who": "Moses prays the words back, asking pardon for the people.", "context": ("Numbers 14:19", "Pardon, I pray, the iniquity of this people")},
    {"ref": "Nehemiah 9:17", "who": "The Levites confess Israel's history to God.", "context": ("Nehemiah 9:5", "Then the Levites")},
    {"ref": "Psalm 86:15", "who": "A prayer from someone poor and needy.", "context": ("Psalm 86:1", "for I am poor and needy")},
    {"ref": "Psalm 103:8", "who": "Praise from someone whose sins are forgiven.", "context": ("Psalm 103:3", "He who forgives all your iniquities")},
    {"ref": "Psalm 145:8", "who": "Praise one generation passes to the next.", "context": ("Psalm 145:4", "One generation will commend Your works to the next")},
    {"ref": "Joel 2:13", "who": "A call to return to the LORD.", "context": ("Joel 2:12", "return to Me with all your heart")},
    {"ref": "Jonah 4:2", "who": "Jonah complains that God has spared Nineveh.", "context": ("Jonah 4:11", "the great city of Nineveh")},
    {"ref": "Nahum 1:3", "who": "A warning to Nineveh: the guilty are not cleared.", "context": ("Nahum 1:1", "the burden against Nineveh")},
]
ECHO_OF_PEOPLE = ["Proverbs 15:18", "Proverbs 16:32", "James 1:19"]
# The words of Exodus 34:6-7 the page underlines in each echo, as regular expressions. Each must match Exodus 34:6-7.
ECHO_WORDS = [r"compassionate", r"gracious", r"slow to anger", r"loving devotion", r"faithfulness", r"forgiv\w*",
              r"iniquity", r"guilty unpunished"]
# What the rule misses: verses with the same pairing of words but not "slow to anger". Each is checked both ways.
ECHO_MISSES = [("Nehemiah 9:31", "gracious and compassionate"), ("Psalm 111:4", "gracious and compassionate")]

# The only block quotations allowed to print part of a verse: the reference and the words the part starts with. The
# part must run, in the Berean's own words and case, from there to the end of the verse.
PARTIAL_QUOTES = {"Exodus 34:6": "The LORD, the LORD God"}

# Studies the text names in italics after "Read more in". A study with a mock-up on this PC links to it; the rest are
# named only, because they are not pages yet.
STUDY_LINKS = {
    "Angels, demons and spiritual powers": "/mockups/angels-demons-and-spiritual-powers-directions/",
    "Every life in God's image": None,
    "The cross, the empty tomb and the throne": "/mockups/what-the-cross-accomplishes-directions/",
    "Fear, anxiety and despair": None,
    "Who do you say that I am? Who Jesus really is": "/mockups/who-do-you-say-that-i-am-directions/",
    "Genesis 1–11: the questions readers bring": "/mockups/creation-to-babel-directions/",
    "Chosen and kept: can I be sure?": None,
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
}

# Held copies on this PC. Every path must sit inside the BibleProject folder.
LIB = PROJECT / "sources/library"
HELD = {
    "bfm": {"name": "Baptist Faith and Message 2000 (text held with the Know the Truth catechism)",
            "path": PROJECT / "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt",
            "from": "II. God", "to": "B. God the Son"},
    "wsc": {"name": "Westminster Shorter Catechism (1647), question 9",
            "path": LIB / "source-creeds-json/asset-l08-wsc-json/westminster_shorter_catechism.json", "number": 9},
    "bcat": {"name": "The Baptist Catechism (1695), question 12",
             "path": LIB / "source-creeds-json/asset-l08-baptist-json/1695_baptist_catechism.json", "number": 12},
    "lbc": {"name": "Second London Baptist Confession (1677/1689), chapter 3, paragraph 1",
            "path": LIB / "source-creeds-json/asset-l08-lbc-json/london_baptist_1689.json", "chapter": "3", "section": "1"},
    "heid": {"name": "Heidelberg Catechism (1563), question 27, in the translation held from CCEL",
             "path": LIB / "source-ccel/asset-ready-completion-confession-heidelberg/original.html",
             "from": "What dost thou understand by the Providence of God", "to": "What does it profit us to know"},
}

# Quoted words that are not Scripture, each found by the build in the named held source.
OUTSIDE_QUOTES = {
    "as Father, Son, and Holy Spirit": "bfm",
    "extends to all things, past, present, and future, including the future decisions of His free creatures": "bfm",
    "reigns with providential care over His universe, His creatures, and the flow of the stream of human history according to the purposes of His grace.": "bfm",
    "What is the work of creation?": "wsc",
    "God's making all things of nothing, by the word of his power, in the space of six days, and all very good.": "wsc",
    "neither the author of sin": "lbc",
}
# Quoted words that are not Scripture and are NOT matched in the held copy. The page marks them "Not yet confirmed",
# the build proves they are still not in the held copy (so this list cannot go stale silently), and the README says so.
UNMATCHED_OUTSIDE = {
    "as it were by his hand, he upholds and governs heaven, earth, and all creatures; so that herbs and grass, rain and drought, fruitful and barren years, meat and drink, health and sickness, riches and poverty, yea, and all things come, not by chance, but by his fatherly hand.":
        ("heid", "The held translation reads differently; the study's own note asks for it to be confirmed."),
}
# One fact the page's own voice relies on: the Baptist Catechism gives the same answer as the Westminster one.
SAME_ANSWER = ("wsc", "bcat")

# Quoted words that are the study's own terms, glosses or renderings, not quotations of a verse.
OWN_TERMS = {
    "I will be who I will be": "an alternative rendering of the Hebrew, named as such in the text",
    "my Lord": "the meaning of Adonai", "the Name": "the meaning of HaShem", "burning ones": "the meaning of seraphim",
    "sanctification": "the meaning of Kedushah", "love is God": "the reversal the text rejects",
    "Creator": "the study's word for the God of Acts 17:24", "providence": "the study's word, defined in part 08",
    "Great and awesome": "shortened from Deuteronomy 10:17; the build checks the words in order",
    "I have seen": "shortened from Exodus 3:7; the build checks the words in order",
    "unknown god": "the reader's own, after the inscription of Acts 17:23, TO AN UNKNOWN GOD",
}
# Shortened quotations: every word must be in the verse, in this order.
SHORTENED = {"Great and awesome": "Deuteronomy 10:17", "I have seen": "Exodus 3:7"}

# Quotations in content.md that are NOT word for word the Berean. This page may not change the study's words, so each
# is shown with the Berean's own words beside it, and the build proves both halves: the study's words are not in the
# verse, and the Berean's are. The README asks the owner to correct content.md; then the entry is removed.
MISQUOTED = {"on the far side of the wilderness": ("Exodus 3:1", "to the far side of the wilderness")}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Article II, quoted in three phrases and checked against the held copy; articles V and XVII named. The site's doctrinal standard."),
    ("Westminster Shorter Catechism (1647)", "Question 9, quoted and checked against the held copy. Presbyterian and Reformed."),
    ("The Baptist Catechism (1695)", "Question 12, named as giving the same answer; the build compares the two."),
    ("Second London Baptist Confession (1677/1689)", "Chapter 3, paragraph 1, quoted in one phrase and checked."),
    ("Heidelberg Catechism (1563)", "Question 27, quoted in a translation not held on this PC; marked not yet confirmed."),
    ("The Babylonian Talmud, Berakhot 9b; Aratus; Epimenides", "Named, not quoted; the study marks each for checking."),
]
