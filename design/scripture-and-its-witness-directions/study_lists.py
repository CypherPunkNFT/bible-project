"""The lists the What the Bible says about itself page draws beside the study's own text. build-data.py checks every
phrase here against the Berean or against content.md, so a figure cannot claim words its verse or the study does not
hold. These are this page's choices, not a count of everything the Bible says."""

TRAIL = [("Study", "/study"), ("God & Christian Faith", "/study/theology?area=doctrine")]
TITLE = ("What the Bible says", "about itself")  # ink, then the turn in gold italic
BACK = ("/study/theology?area=doctrine", "Back to God & Christian Faith")
CLOSE_PASSAGE = "Luke 24:13–35"

# The heading's six concepts, one to each part, in order. The build fails if a concept or a part is left over.
CONCEPT_OF_PART = {"01": "Breathed out", "02": "True", "03": "Enough", "04": "Clear", "05": "About Christ",
                   "06": "Opened by the Spirit"}

# ── 00 "It is written": the four times the words are said in Matthew 4:1–11. The build finds every verse there that
# holds "written" and requires exactly these four. "who" is pinned by words in the verse that names the speaker.
# "around" is the verses printed round the quoted line; "shared" are words found, case aside, in both the Matthew
# verse and the source; "use" must be a sentence of content.md, so the page says only what the study says.
TESTS = [
    {"n": 1, "name": "Bread", "art": "stones", "ref": "Matthew 4:3", "offer": "tell these stones to become bread"},
    {"n": 2, "name": "The pinnacle", "art": "pinnacle", "ref": "Matthew 4:6", "offer": "throw Yourself down"},
    {"n": 3, "name": "The kingdoms", "art": "kingdoms", "ref": "Matthew 4:9", "offer": "All this I will give You"},
]
WRITTEN = [
    {"ref": "Matthew 4:4", "test": 1, "who": "Jesus", "who_ref": "Matthew 4:4", "who_words": "Jesus answered",
     "source": "Deuteronomy 8:3", "around": "Deuteronomy 8:2–3",
     "shared": ["on bread alone, but on every word that comes from the mouth of"],
     "use": "Israel had to learn that life comes from God's word. Jesus lives it."},
    {"ref": "Matthew 4:6", "test": 2, "who": "The devil", "who_ref": "Matthew 4:5", "who_words": "the devil took Him",
     "source": "Psalm 91:11–12", "around": "Psalm 91:9–13",
     "shared": ["command His angels concerning", "lift you up in their hands, so that you will not strike your foot against a stone"],
     "use": "The psalm really does promise God's care. What is false is the use: a promise of protection turned into a demand that God put on a show."},
    {"ref": "Matthew 4:7", "test": 2, "who": "Jesus", "who_ref": "Matthew 4:7", "who_words": "Jesus replied",
     "source": "Deuteronomy 6:16", "around": "Deuteronomy 6:16–17", "shared": ["the LORD your God"],
     "use": "Jesus does not deny the psalm. He sets beside it what Scripture says elsewhere:"},
    {"ref": "Matthew 4:10", "test": 3, "who": "Jesus", "who_ref": "Matthew 4:10", "who_words": "Jesus declared",
     "source": "Deuteronomy 6:13", "around": "Deuteronomy 6:12–15", "shared": ["the LORD your God", "serve Him only"],
     "use": "In each test, the words God had already given are enough."},
]
WRITTEN_SPAN = "Matthew 4:1–11"

# ── 01 Four uses, one goal (2 Timothy 3:16–17). Each word is in the verse; each gloss is the study's own words.
USES = {"ref": "2 Timothy 3:16", "goal_ref": "2 Timothy 3:17", "goal": "complete, fully equipped for every good work",
        "items": [("instruction", "teaching what is true"), ("conviction", "showing what is wrong"),
                  ("correction", "setting it right"), ("training in righteousness", "right living before God")]}

# ── 02 Two readings of 2 Peter 1:19 and of 1:20, each in the study's own sentence. 1:19 is shown without choosing,
# as the study does; 1:20 marks the reading the study calls best supported, and only because it says so.
READINGS = [
    {"ref": "2 Peter 1:19", "words": "We also have the word of the prophets as confirmed beyond doubt", "chosen": None,
     "a": "Some hear him saying that what he saw on the mountain confirmed what the prophets had said.",
     "b": "Others hear him saying that the prophets' written word is even firmer ground than his own experience."},
    {"ref": "2 Peter 1:20", "words": "no prophecy of Scripture comes from one’s own interpretation", "chosen": "a",
     "chosen_words": "The best-supported reading",
     "a": "The best-supported reading takes it as being about where prophecy came from.",
     "b": "Others read verse 20 as being about how readers interpret Scripture, and take it to mean that the Bible is read within the church and not by each person alone."},
]

# ── 03 Forty days, forty years; and where in Deuteronomy the three answers come from. The chapter count is read from
# the Berean, not typed.
FORTY = [("Matthew 4:2", "forty days and forty nights"), ("Deuteronomy 8:2", "these forty years")]
FORTY_SAYS = "Israel was hungry in the wilderness for forty years, and Jesus for forty days."

# ── 04 Clear, and hard in places: the two verses the study sets side by side.
CLEAR = {"says": "Clarity does not mean everything is easy.",
         "pair": [("Psalm 119:105", "Your word is a lamp to my feet"),
                  ("2 Peter 3:16", "Some parts of his letters are hard to understand")]}

# ── 05 Every fact, no frame. Cleopas's own facts (Luke 24:20–24), then set under the words of Luke 24:46.
FACTS = [
    {"ref": "Luke 24:20", "words": "delivered Him up to the sentence of death", "under": "suffer"},
    {"ref": "Luke 24:20", "words": "they crucified Him", "under": "suffer"},
    {"ref": "Luke 24:21", "words": "it is the third day", "under": "rise"},
    {"ref": "Luke 24:23", "words": "they did not find His body", "under": "rise"},
    {"ref": "Luke 24:23", "words": "angels, who said that Jesus was alive", "under": "rise"},
    {"ref": "Luke 24:24", "words": "found it just as the women had described", "under": "rise"},
]
FRAME = {"ref": "Luke 24:46", "suffer": "The Christ will suffer", "rise": "rise from the dead on the third day",
         "says": "What they lack is the frame that makes the facts make sense."}

# ── 06 Opened, three times in Luke 24. The build counts "opened" in the chapter and requires exactly these.
OPENED = [("Luke 24:31", "their eyes were opened", "Eyes"), ("Luke 24:32", "opened the Scriptures to us", "The Scriptures"),
          ("Luke 24:45", "He opened their minds to understand the Scriptures", "Minds")]

# Studies the text names in italics. A value starting "/mockups/" needs that folder's index.html on this PC; a value
# starting "/study/" must be a route in src/App.tsx. Studies being designed in this same run are left unlinked, so
# this build never depends on a job in progress.
STUDY_LINKS = {
    "Reading the Bible well: where to start and how to keep going": None,
    "Following Jesus and the Sermon on the Mount": "/mockups/following-jesus-directions/",
    "The book of Psalms": None,
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "Learning to discern": "/mockups/learning-to-discern-directions/",
    "Christ in the Old Testament": "/mockups/christ-in-the-old-testament-directions/",
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "/mockups/what-the-cross-accomplishes-directions/",
    "Witness and the nations: telling others about Jesus": None,
    "The Holy Spirit": "/mockups/the-holy-spirit-directions/",
    "Faith in daily life": "/mockups/faith-in-daily-life-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "The surviving witnesses": "/study/surviving-witnesses",
    "Manuscripts": "/study/manuscripts",
    "How the canon took shape": "/study/how-the-canon-took-shape",
}
# Book titles in italics: named as books, never linked.
BOOK_TITLES = {"1, 2 Peter, Jude", "Jude, 2 Peter", "Jesus and the Eyewitnesses", "The Resurrection of the Son of God",
               "The Case for the Resurrection of Jesus"}

# Quoted words that are not Scripture and are held on this PC. Each is found by script, compared word by word with
# case and punctuation set aside, in its held copy: the BFM after its article heading, a confession in its section.
BFM = "content/questions/sources/normalized/baptist-know-the-truth-catechism.json"
WCF = "data/creeds/doc/westminster-confession-of-faith-1647.b1.json"
LBC = "data/creeds/doc/1689-london-baptist-confession-1677.b1.json"
HELD_QUOTES = {
    "has God for its author, salvation for its end, and truth, without any mixture of error, for its matter":
        {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures", "until": "II. God"},
    "truth, without any mixture of error": {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures", "until": "II. God"},
    "totally true and trustworthy": {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures", "until": "II. God"},
    "the supreme standard by which all human conduct, creeds, and religious opinions should be tried":
        {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures", "until": "II. God"},
    "a testimony to Christ, who is Himself the focus of divine revelation":
        {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures", "until": "II. God"},
    "inspired holy men of old to write the Scriptures": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit", "until": "III. Man"},
    "through illumination He enables men to understand truth": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit", "until": "III. Man"},
    "All things in Scripture are not alike plain in themselves, nor alike clear unto all: yet those things which are necessary to be known, believed, and observed for salvation are so clearly propounded and opened in some place of Scripture or other, that not only the learned, but the unlearned, in a due use of the ordinary means, may attain unto a sufficient understanding of them.":
        {"source": "Westminster Confession of Faith (1647), chapter 1, section 7", "path": WCF, "section": "1.7"},
    "commonly called Apocrypha": {"source": "Westminster Confession of Faith (1647), chapter 1, section 3", "path": WCF, "section": "1.3"},
    "no part of the canon of the Scripture": {"source": "Westminster Confession of Faith (1647), chapter 1, section 3", "path": WCF, "section": "1.3"},
    "the only sufficient, certain, and infallible rule of all saving Knowledge, Faith, and Obedience":
        {"source": "Second London Baptist Confession (1677), chapter 1, section 1", "path": LBC, "section": "1.1"},
}
# Where the study's wording of a held quotation differs from the held copy in punctuation or capitals only. The build
# fails on any difference not named here, so a new one is seen; the README lists these for the owner.
KNOWN_DIFFERENCES = {
    "All things in Scripture are not alike plain in themselves, nor alike clear unto all: yet those things which are necessary to be known, believed, and observed for salvation are so clearly propounded and opened in some place of Scripture or other, that not only the learned, but the unlearned, in a due use of the ordinary means, may attain unto a sufficient understanding of them.":
        "the held 1647 text has a semicolon after \"unto all\", not a colon, and commas round \"for salvation\"",
    "no part of the canon of the Scripture": "the held 1647 text capitalises \"Canon\"",
    "the only sufficient, certain, and infallible rule of all saving Knowledge, Faith, and Obedience":
        "the held 1677 text has no comma after \"Faith\"",
}
# Quoted words not held on this PC: shown with the study's own "to check" mark where it has one, and listed here.
NOT_HELD_QUOTES = {
    "a principle which distinguishes our religion from all others, that we know that God hath spoken to us": "John Calvin, commentary on 2 Timothy 3:16 (not held; the study marks it to check)",
    "does not derive her certainty about all revealed truths from the holy Scriptures alone": "Catechism of the Catholic Church, paragraph 82 (not held; the study marks it to check)",
    "both Scripture and Tradition must be accepted and honored with equal sentiments of devotion and reverence": "Catechism of the Catholic Church, paragraph 82 (not held; the study marks it to check)",
    "the task of giving an authentic interpretation of the Word of God, whether in its written form or in the form of Tradition, has been entrusted to the living teaching office of the Church alone": "Catechism of the Catholic Church, paragraph 85 (not held; the study marks it to check)",
    "breathed out by God": "B. B. Warfield's reading of the Greek word, as the study reports it (not held)",
}
# Quoted words that are the study's own terms or everyday words, not quotations from anywhere.
OWN_TERMS = {"quoting the book to prove the book", "what is written", "inspired", "Moses", "rising", "Messiah",
             "anointed one", "the Law", "good news"}
# Short quotations pinned to the verse that holds them, because a few words could match by chance anywhere.
PINNED_SHORT = {"It is written.": "Matthew 4:4", "Men spoke": "2 Peter 1:21", "For": "2 Peter 1:21",
                "carried along": "2 Peter 1:21", "God-breathed": "2 Timothy 3:16", "The man of God": "2 Timothy 3:17",
                "about Himself": "Luke 24:27", "also written": "Matthew 4:7", "He opened their minds": "Luke 24:45",
                "noble-minded": "Acts 17:11", "repentance and forgiveness of sins": "Luke 24:47"}
# The study's [source:id] notes: who is speaking in each.
SOURCE_MARKS = {"calvin-2tim": "John Calvin, on 2 Timothy 3:16", "wcf": "The Westminster Confession"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles I and II, quoted in short phrases and checked against the copy held on this PC. The site's doctrinal standard."),
    ("The Westminster Confession of Faith (1647)", "Chapter 1, sections 3 and 7, checked word by word against the site's creeds collection."),
    ("The Second London Baptist Confession (1677)", "Chapter 1, section 1, checked word by word against the site's creeds collection."),
    ("John Calvin, commentary on 2 Timothy", "One sentence on 2 Timothy 3:16. Not held on this PC; marked to check."),
    ("The Catechism of the Catholic Church", "Paragraphs 82, 85 and 120, shown as the Roman Catholic view, not this site's. Not held on this PC; marked to check."),
    ("B. B. Warfield; the Chicago Statement on Biblical Inerrancy (1978)", "Named, and reported in the study's own words, not quoted."),
    ("Richard Bauckham; N. T. Wright; Gary Habermas and Michael Licona", "Books named, not quoted."),
]
