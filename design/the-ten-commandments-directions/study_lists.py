"""The lists The Ten Commandments page draws beside the study's own text. build-data.py checks every phrase here: Bible
phrases against the Berean, outside phrases against the site's held copies, the study's own phrases against content.md.
These are this page's choices for drawing the study, not a count of anything beyond what each says."""

CREEDS = "data/creeds/doc"
BFM = "content/questions/sources/normalized/baptist-know-the-truth-catechism.json"
LUTHER = f"{CREEDS}/luthers-small-catechism-1529.b1.json"
BAPTIST_CATECHISM = f"{CREEDS}/1695-baptist-catechism-1695.b1.json"
LONDON = f"{CREEDS}/1689-london-baptist-confession-1677.b1.json"

# The page's title split for the heading: the title in ink, its turn in gold italic.
TITLE = ("The Ten", "Commandments")

# The ten words, with the preface, in the rows of the study's own table. Each row's Exodus and Deuteronomy verses
# are compared word for word ("given twice"); "key" must be in the Exodus verse the table names; "stone" is the
# Christian two-table reading the study teaches (1 = love for God, 2 = love for neighbour), the site's reading.
TEN = [
    {"n": 0, "short": "Preface", "ex": "Exodus 20:2", "dt": "Deuteronomy 5:6", "key": "brought you out", "stone": 0},
    {"n": 1, "short": "No other gods", "ex": "Exodus 20:3", "dt": "Deuteronomy 5:7", "key": "no other gods", "stone": 1},
    {"n": 2, "short": "No idol", "ex": "Exodus 20:4–6", "dt": "Deuteronomy 5:8–10", "key": "idol", "stone": 1},
    {"n": 3, "short": "The name", "ex": "Exodus 20:7", "dt": "Deuteronomy 5:11", "key": "name of the LORD", "stone": 1},
    {"n": 4, "short": "The Sabbath", "ex": "Exodus 20:8–11", "dt": "Deuteronomy 5:12–15", "key": "Sabbath", "stone": 1},
    {"n": 5, "short": "Father and mother", "ex": "Exodus 20:12", "dt": "Deuteronomy 5:16", "key": "father and mother", "stone": 2},
    {"n": 6, "short": "Murder", "ex": "Exodus 20:13", "dt": "Deuteronomy 5:17", "key": "murder", "stone": 2},
    {"n": 7, "short": "Adultery", "ex": "Exodus 20:14", "dt": "Deuteronomy 5:18", "key": "adultery", "stone": 2},
    {"n": 8, "short": "Stealing", "ex": "Exodus 20:15", "dt": "Deuteronomy 5:19", "key": "steal", "stone": 2},
    {"n": 9, "short": "False witness", "ex": "Exodus 20:16", "dt": "Deuteronomy 5:20", "key": "false witness", "stone": 2},
    {"n": 10, "short": "Coveting", "ex": "Exodus 20:17", "dt": "Deuteronomy 5:21", "key": "covet", "stone": 2},
]

# Which study subheading carries which word's "given twice" line. The Sabbath's goes to part 05, where the study
# reads its two reasons. Every heading named here must be in content.md.
GIVEN_UNDER = {
    "No other gods": [1], "No idol": [2], "The name": [3], "Two reasons for one day": [4], "Father and mother": [5],
    "Life": [6], "Marriage and property": [7, 8], "Truth": [9], "The heart": [10],
}

# Part 04: which of the ten words each passage takes up. Every phrase must be in its verse. The grouping of
# Matthew 22 over the two stones is the study's reading ("Here are the two tables, in Jesus' own words").
TAKES = [
    {"id": "mt5", "name": "Matthew 5", "colour": "gospels", "line": "Two words followed into the heart.",
     "marks": [{"words": [6], "ref": "Matthew 5:21", "phrase": "Do not murder"},
               {"words": [7], "ref": "Matthew 5:27", "phrase": "Do not commit adultery"}]},
    {"id": "mt22", "name": "Matthew 22", "colour": "gospels", "line": "Two loves over the two stones, as the study reads them.",
     "marks": [{"words": [1, 2, 3, 4], "ref": "Matthew 22:37", "phrase": "Love the Lord your God"},
               {"words": [5, 6, 7, 8, 9, 10], "ref": "Matthew 22:39", "phrase": "Love your neighbor as yourself"}]},
    {"id": "rom13", "name": "Romans 13:9", "colour": "epistles", "line": "Four words named, and “any other commandments”.",
     "marks": [{"words": [7], "ref": "Romans 13:9", "phrase": "Do not commit adultery"},
               {"words": [6], "ref": "Romans 13:9", "phrase": "Do not murder"},
               {"words": [8], "ref": "Romans 13:9", "phrase": "Do not steal"},
               {"words": [10], "ref": "Romans 13:9", "phrase": "Do not covet"}]},
]

# Part 05: the verses set at the day they speak of. "phrase" must be in the verse. Revelation 1:10 says "the Lord's
# day"; placing it on the first day is the study's reading, and the page says so.
WEEK = [
    {"day": 7, "ref": "Genesis 2:3", "phrase": "blessed the seventh day", "say": "Creation: the seventh day blessed"},
    {"day": 7, "ref": "Exodus 20:11", "phrase": "on the seventh day He rested", "say": "Sinai: rest, because God rested"},
    {"day": 7, "ref": "Deuteronomy 5:15", "phrase": "Remember that you were a slave", "say": "Moab: rest, because God rescued"},
    {"day": 7, "ref": "Mark 2:28", "phrase": "Lord even of the Sabbath", "say": "Galilee: the Son of Man, Lord of the day"},
    {"day": 1, "ref": "Acts 20:7", "phrase": "On the first day of the week", "say": "Troas: the church breaks bread"},
    {"day": 1, "ref": "1 Corinthians 16:2", "phrase": "On the first day of every week", "say": "Corinth: the weekly gift set aside"},
    {"day": 1, "ref": "Revelation 1:10", "phrase": "On the Lord’s day", "say": "Patmos: “the Lord’s day”, read by the study as the first", "reading": True},
]

# Part 05: the practices the study names, each set at the day it keeps. "phrase" must be in content.md, so the page
# says nothing about a group that the study does not. Shown, not ranked.
PRACTICE = [
    {"day": 7, "who": "Jewish Shabbat", "phrase": "begins at sundown on Friday", "kind": "Jewish practice"},
    {"day": 7, "who": "Seventh Day Baptists", "phrase": "keep the seventh day as the Sabbath", "kind": "Another tradition"},
    {"day": 7, "who": "Seventh-day Adventists", "phrase": "binds Christians to keep the seventh day", "kind": "Another tradition"},
    {"day": 1, "who": "Second London Confession, 1677 and 1689", "phrase": "as the Christian Sabbath", "kind": "Baptist"},
    {"day": 1, "who": "Baptist Faith and Message, 1925 and 1963", "phrase": "resting from secular employments", "kind": "Baptist"},
    {"day": 1, "who": "Baptist Faith and Message, 2000", "phrase": "a Christian institution for regular observance", "kind": "Baptist, and this site's confession"},
]

# Studies the text names in italics. A fixed list, so the output never depends on what other jobs have built; build-data.py
# only warns if a linked mock-up is missing. Studies being designed alongside this one are named, not linked.
STUDY_LINKS = {
    "God: who He is and what He does": "/mockups/knowing-god-directions/",
    "Covenants and promises": "/mockups/covenants-and-promises-directions/",
    "Following Jesus and the Sermon on the Mount": "/mockups/following-jesus-directions/",
    "Leviticus: holiness and sacrifice": "/mockups/the-law-of-moses-and-the-christian-directions/",
    "Sexuality, singleness and divorce": "/mockups/marriage-sexuality-and-singleness-directions/",
    "Money, possessions and generosity": None,
    "Children and the home": None,
    "Every life in God’s image": None,
    "Faith in daily life": "/mockups/faith-in-daily-life-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "Saved by grace: how God forgives and changes us": "/mockups/grace-faith-and-salvation-directions/",
    "Genesis 1–11: the questions readers bring": "/mockups/creation-to-babel-directions/",
    "Encounters with Jesus": "/mockups/encounters-with-jesus-directions/",
    "Christ in the Old Testament": "/mockups/christ-in-the-old-testament-directions/",
}

# Quoted words found in the site's held copy of their source, within 1,500 characters after the marker.
HELD_QUOTES = {
    "the preface to the ten commandments": {"source": "The Baptist Catechism (the site's copy is dated 1695), question 48", "path": BAPTIST_CATECHISM,
                                            "marker": "What is the Preface to the Ten Commandments?", "ignore_case": True},
    "There is no salvation apart from personal faith in Jesus Christ as Lord": {"source": "Baptist Faith and Message 2000, article IV", "path": BFM, "marker": "IV. Salvation"},
    "truth, without any mixture of error": {"source": "Baptist Faith and Message 2000, article I", "path": BFM, "marker": "I. The Scriptures"},
    "a Christian institution for regular observance": {"source": "Baptist Faith and Message 2000, article VIII", "path": BFM, "marker": "VIII. The Lord's Day"},
    "commemorates the resurrection of Christ from the dead": {"source": "Baptist Faith and Message 2000, article VIII", "path": BFM, "marker": "VIII. The Lord's Day"},
    "commensurate with the Christian's conscience under the Lordship of Jesus Christ": {"source": "Baptist Faith and Message 2000, article VIII", "path": BFM, "marker": "VIII. The Lord's Day"},
    "as the Christian Sabbath": {"source": "Second London Baptist Confession, chapter 22, paragraph 7", "path": LONDON, "marker": '"id":"22.7"'},
}

# Quoted words whose source is not held on this PC, so they are compared by eye, not by script. The README says so.
NOT_HELD_QUOTES = {
    "resting from secular employments": "Baptist Faith and Message 1963, article VIII (not held on this PC)",
    "a palace in time": "Abraham Joshua Heschel, The Sabbath, 1951 (not held on this PC)",
    "The Sabbath": "Seventh-day Adventist Fundamental Beliefs, the title of belief 20 (not held on this PC)",
    "The beneficent Creator, after the six days of Creation, rested on the seventh day and instituted the Sabbath for all people as a memorial of Creation.":
        "Seventh-day Adventist Fundamental Beliefs, belief 20 (not held on this PC)",
}

# Quoted words that do NOT match their held source as the study gives them. The page marks each one for the editor
# with the held reading; the build fails if a mismatch is fixed, so the mark cannot outlive the problem.
MISMATCHED = {
    "We should fear, love, and trust in God above all things.": {
        "source": "Luther's Small Catechism, the First Commandment", "path": LUTHER, "marker": "The First Commandment.",
        "held": "We should fear and love God, and trust in him, above all things."},
    "We should fear and love God that we may not hurt nor harm our neighbor in his body, but help and befriend him in every bodily need.": {
        "source": "Luther's Small Catechism, the Fifth Commandment", "path": LUTHER, "marker": "The Fifth Commandment.",
        "held": "We should so fear and love God as not to do our neighbor any injury or harm in his body, but help and befriend him in all bodily troubles."},
    "defend him, think and speak well of him, and put the best construction on everything.": {
        "source": "Luther's Small Catechism, the Eighth Commandment", "path": LUTHER, "marker": "The Eighth Commandment.",
        "held": "but defend him, speak well of him, and make the best of all he does."},
}

# Quoted words that are not the Berean and are not a source: the study's own terms, a literal rendering, or a word
# mentioned as a word. Each says why it is here.
OWN_TERMS = {
    "the ten words": "the Hebrew's literal wording; the Berean writes Ten Commandments (a fact the build tests)",
    "ten words": "the meaning of Decalogue and of the Hebrew name",
    "the ten utterances": "a rendering of Aseret ha-Dibrot",
    "no idols": "the study's short name for the second word",
    "No other gods": "the study's name for the first word, in a paragraph about counting; the words are Exodus 20:3's",
    "Do this": "the study's own contrast",
    "I brought you out": "the study's short form of Exodus 20:2",
    "two tables": "the traditional Christian name",
    "table": "an older English word for tablet",
    "kill": "a word mentioned as a word; the build tests it is not in Exodus 20:13",
    "in the passage about Abiathar": "a proposed reading of Mark 2:26, not a quotation",
    "the passage about the bush": "a wording of Mark 12:26 from other English Bibles; flagged below, because the Berean reads differently",
}

# Problems the build found in the study's text, shown to the editor as a mark after the anchor. The build fails if a
# problem is gone (the test no longer holds), so a mark cannot outlive what it reports. The text is not changed here.
ISSUES = [
    {"anchor": "since Romans 13:9 names them.", "test": ("not_in_verse", "Romans 13:9", "false witness"),
     "note": "The Berean's Romans 13:9 names four of these five: adultery, murder, stealing and coveting. It does not name false witness."},
    {"anchor": "the passage about the bush\"", "test": ("not_in_verse", "Mark 12:26", "passage"),
     "note": "The Berean's Mark 12:26 reads “about the burning bush”, not “the passage about the bush”. The point stands in other translations; the quotation is not the Berean's."},
]

# Facts the study states, each tested against the Berean.
FACTS = [
    {"says": "The Berean writes Ten Commandments where the Hebrew says ten words.",
     "in": [("Exodus 34:28", "Ten Commandments"), ("Deuteronomy 4:13", "Ten Commandments"), ("Deuteronomy 10:4", "Ten Commandments")], "not_in": []},
    {"says": "Exodus says Remember; Deuteronomy says Observe.",
     "in": [("Exodus 20:8", "Remember"), ("Deuteronomy 5:12", "Observe")], "not_in": [("Exodus 20:8", "observe"), ("Deuteronomy 5:12", "remember")]},
    {"says": "Deuteronomy adds 'and that it may go well with you'.",
     "in": [("Deuteronomy 5:16", "that it may go well with you")], "not_in": [("Exodus 20:12", "go well")]},
    {"says": "Deuteronomy adds 'field' to the house.", "in": [("Deuteronomy 5:21", "field")], "not_in": [("Exodus 20:17", "field")]},
    {"says": "The Berean writes murder, not kill.", "in": [("Exodus 20:13", "murder")], "not_in": [("Exodus 20:13", "kill")]},
    {"says": "Three or four generations against a thousand.", "in": [("Exodus 20:5", "third and fourth"), ("Exodus 20:6", "thousand")], "not_in": []},
    {"says": "Mark names Abiathar; 1 Samuel 21 names Ahimelech.", "in": [("Mark 2:26", "Abiathar"), ("1 Samuel 21:1", "Ahimelech")], "not_in": [("1 Samuel 21:1–6", "Abiathar")]},
    {"says": "Abiathar escaped to David soon afterwards.", "in": [("1 Samuel 22:20", "Abiathar")], "not_in": []},
]
# Word order facts: in each verse, the first word comes before the second.
ORDER_FACTS = [("Exodus 20:17", "house", "wife"), ("Deuteronomy 5:21", "wife", "house")]

# Crisis lines in the care note, each found as a whole number in the site's checked list of help lines.
CRISIS_FILE = "src/data/resources/life.json"
CRISIS = ["1-800-799-7233", "1-800-422-4453", "988", "024", "800 911 2000", "188"]

SOURCES = [
    ("The Berean Standard Bible", "Every verse and every quoted Bible phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles I, IV and VIII, quoted in short phrases and checked against the site's held copy. The site's doctrinal standard."),
    ("The Baptist Catechism", "One phrase, “the preface to the ten commandments”, found in question 48 of the site's copy."),
    ("Second London Baptist Confession", "One phrase, “as the Christian Sabbath”, found in chapter 22, paragraph 7 of the site's copy."),
    ("Luther's Small Catechism", "Three explanations, shown as Lutheran teaching. Not yet matched to the site's copy: each is marked."),
    ("Baptist Faith and Message 1963; Seventh-day Adventist Fundamental Beliefs; Heschel, The Sabbath", "Quoted in the study, not held on this PC; compared by eye only."),
    ("Maimonides, Philo, Josephus, Augustine, the Mishnah, the Talmud, the Mekhilta, Targum Onkelos, Kline, Lane", "Named, not quoted. Each claim carries the study's own check note."),
]
