"""The lists the Leviticus page draws beside the study's own text. build-data.py checks every phrase here against the
Berean, the Berean's footnotes, the held source named for it, or the study's own content.md, so a row cannot claim words
its source does not hold. These are this study's choices for drawing, not a count of everything Scripture says."""
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]  # Jarvis/Projects/BibleProject
# Held sources may only be read from these folders, so a path in this file cannot reach anywhere else.
SOURCE_ROOTS = (PROJECT / "sources", PROJECT / "Website/data/creeds", PROJECT / "Website/content/questions/sources")

TITLE = ("Leviticus:", "holiness and sacrifice")
CONCEPTS = ["Offerings", "Priests", "Clean and unclean", "Atonement", "Holiness"]
# The motto is Leviticus 1:1's own words, each line checked in that verse.
MOTTO = {"ref": "Leviticus 1:1", "lines": ["The LORD called", "from the Tent of Meeting."]}

# A short reference such as "(1:4 · BSB)" is Leviticus unless listed here. The build fails if a short reference follows
# a whole reference to another book in the same paragraph, with no "Leviticus" between, and is not listed here, and
# on an entry the text no longer uses.
OTHER_BOOK = {
    ("01", "10:4"): "Hebrews",
    ("03", "10:28"): "Acts",
    ("04", "9:12"): "Hebrews",
    ("04", "10:20"): "Hebrews",
    ("05", "10:37"): "Luke",
}

# Quoted words with no reference beside them (all under three words but the close's), each pinned to the verse that holds them.
PINNED_QUOTES = {
    ("01", "sins defiantly"): "Numbers 15:30",
    ("02", "perfection"): "Hebrews 7:11",
    ("02", "unauthorized"): "Leviticus 10:1",
    ("04", "Scapegoat"): "Leviticus 16:8",
    ("05", "Be holy"): "Leviticus 19:2",
    ("07", "liberty"): "Leviticus 25:10",
    ("close", "Be holy, because I am holy."): "1 Peter 1:16",
}

# Quoted words from the Berean's own footnotes, checked in the footnotes of the verse given (data/text/bsb).
FOOTNOTE_QUOTES = {
    ("03", "thereby expelling all foods"): "Mark 7:19",
    ("04", "as a propitiation"): "Romans 3:25",
    ("04", "to Azazel"): "Leviticus 16:8",
}

# Words the study puts in quotation marks as its own terms, not as a quotation.
OWN_TERMS = {("08", "dispensations")}

# Held copies on this PC. "fixes" corrects a scanning error in the held copy, never the study's words.
SOURCES_HELD = {
    "bfm": {"name": "Baptist Faith and Message 2000 (the article texts held in the site's question sources)",
            "path": PROJECT / "Website/content/questions/sources/normalized/baptist-know-the-truth-catechism.json"},
    "lbc": {"name": "Second London Baptist Confession (1677/1689)",
            "path": PROJECT / "Website/data/creeds/doc/1689-london-baptist-confession-1677.b1.json"},
    "calvin": {"name": "John Calvin, Institutes of the Christian Religion, trans. Henry Beveridge (1846), vol. 3",
               "path": PROJECT / "sources/library/bulk/ia/institutesofchrbeve03calv.txt",
               # The scan breaks "well-known" across a page, with the running head between the halves.
               "fixes": [("wellCHAF XX CHRISTIAN RELIGION 537 known", "well known")]},
    "henry": {"name": "Matthew Henry, Commentary on the Whole Bible, vol. 1 (CCEL)",
              "path": PROJECT / "sources/library/bulk/ccel/henry_mhc1.xml"},
    "bonar": {"name": "Andrew A. Bonar, A Commentary on the Book of Leviticus (1851)",
              "path": PROJECT / "sources/library/bulk/ia/commentaryonbook00bona.txt"},
}

# Quotations from outside Scripture, keyed by the part they stand in. Each must be in its held source within a short
# distance of "near", words that place it in the right chapter or article, so a common phrase cannot pass on text
# from somewhere else.
OUTSIDE_QUOTES = {
    ("02", "Probably they had seen the ill effect of it in Nadab and Abihu."): ("henry", "drink wine nor strong drink"),
    ("03", "Jehovah opens up sin under the figure of leprosy."): ("bonar", "leprosy"),
    ("04", "in His substitutionary death on the cross He made provision for the redemption of men from sin"): ("bfm", "honored the divine law by His personal obedience"),
    ("06", "The first day of the week is the Lord's Day... It commemorates the resurrection of Christ from the dead,"): ("bfm", "Christian institution for regular observance"),
    ("06", "the Christian's conscience under the Lordship of Jesus Christ"): ("bfm", "commemorates the resurrection of Christ"),
    ("08", "honored the divine law by His personal obedience"): ("bfm", "substitutionary death on the cross"),
    ("08", "the well-known division which distributes the whole law of God, as promulgated by Moses, into the moral, the ceremonial, and the judicial law"): ("calvin", "judicial law"),
    ("08", "prefiguring Christ"): ("lbc", "abrogated and taken away"),
    ("08", "abrogated and taken away"): ("lbc", "prefiguring Christ"),
    ("08", "expired together with the state of that people"): ("lbc", "general equity"),
    ("08", "their general equity onely, being of moral use"): ("lbc", "expired together with the state"),
    ("08", "doth for ever bind all"): ("lbc", "moral Law"),
    ("08", "deny that any commonwealth is rightly framed which neglects the law of Moses"): ("calvin", "judicial law"),
}
NEAR_WINDOW = 1500  # characters of the folded source text, either side of the quotation

# The plan of the camp: where each part stands, in the words of the verse that puts it there, and the New Testament
# verse that answers it. "zone" is a place the page draws; each phrase is checked in its verse.
ZONES = ["land", "camp", "court", "holy", "most-holy", "outside"]
PLAN = [
    {"n": "01", "zone": "court", "where": "The altar", "phrase": "sprinkle it on all sides of the altar at the entrance to the Tent of Meeting", "ref": "Leviticus 1:5",
     "nt": "offered for all time one sacrifice for sins", "nt_ref": "Hebrews 10:12"},
    {"n": "02", "zone": "holy", "where": "The entrance to the tent", "phrase": "the assembly gathered at the entrance to the Tent of Meeting", "ref": "Leviticus 8:4",
     "nt": "a holy priesthood", "nt_ref": "1 Peter 2:5"},
    {"n": "03", "zone": "outside", "where": "Outside the camp", "phrase": "He must live alone in a place outside the camp", "ref": "Leviticus 13:46",
     "nt": "reached out His hand and touched the man", "nt_ref": "Mark 1:41"},
    {"n": "04", "zone": "most-holy", "where": "Behind the veil, once a year", "phrase": "not to enter freely into the Most Holy Place behind the veil", "ref": "Leviticus 16:2",
     "nt": "the new and living way opened for us through the curtain", "nt_ref": "Hebrews 10:20"},
    {"n": "05", "zone": "land", "where": "The field", "phrase": "you are not to reap to the very edges of your field", "ref": "Leviticus 19:9",
     "nt": "Love your neighbor as yourself", "nt_ref": "Mark 12:31"},
    {"n": "06", "zone": "camp", "where": "Wherever they lived", "phrase": "wherever you live, it is a Sabbath to the LORD", "ref": "Leviticus 23:3",
     "nt": "These are a shadow of the things to come", "nt_ref": "Colossians 2:17"},
    {"n": "07", "zone": "land", "where": "The whole land", "phrase": "The land must not be sold permanently, because it is Mine", "ref": "Leviticus 25:23",
     "nt": "Today this Scripture is fulfilled in your hearing", "nt_ref": "Luke 4:21"},
]
# The plan's one sentence rests on these: only one man goes behind the veil, once a year.
PLAN_FACTS = [("once a year", "Leviticus 16:34"), ("Tell your brother Aaron not to enter freely", "Leviticus 16:2")]
# The second point of part 04, drawn in the wilderness: the goat sent away, and in the New Testament, outside the gate.
WILDERNESS = {"phrase": "release it into the wilderness", "ref": "Leviticus 16:22",
              "nt": "suffered outside the city gate", "nt_ref": "Hebrews 13:12"}

# Part 06: holy time counted in sevens, each step in its verse's words. "marks" is how many steps the row draws;
# "kind" says whether the seventh is the holy one or seven sevens lead to a fiftieth.
SEVENS = [
    {"unit": "Days", "phrase": "the seventh day is a Sabbath of complete rest", "ref": "Leviticus 23:3", "kind": "seventh"},
    {"unit": "Months", "phrase": "the seventh month", "ref": "Leviticus 23:24", "kind": "seventh"},
    {"unit": "Years", "phrase": "in the seventh year there shall be a Sabbath of complete rest for the land", "ref": "Leviticus 25:4", "kind": "seventh"},
    {"unit": "Weeks", "phrase": "count off fifty days until the day after the seventh Sabbath", "ref": "Leviticus 23:16", "kind": "fiftieth"},
    {"unit": "Years of years", "phrase": "consecrate the fiftieth year and proclaim liberty", "ref": "Leviticus 25:10", "kind": "fiftieth"},
]
SEVEN_TIMES = ("seven times seven years", "Leviticus 25:8")

# Part 08: two verses, three routes. Every phrase is the study's own words, checked in content.md's part 08.
ROUTES = {
    "verses": [{"ref": "Leviticus 19:18", "short": "Love your neighbour", "arrive": "All three keep 19:18"},
               {"ref": "Leviticus 19:19", "short": "Two kinds of material", "arrive": "Christians keep the first and wear blended fabric without guilt"}],
    "families": [
        {"name": "Three kinds of law", "routes": ["19:18 is moral and binds today", "19:19 is ceremonial and fulfilled"]},
        {"name": "Ended as a whole", "routes": ["19:18 binds a Christian because Jesus and Paul repeat it", "19:19 does not, because no one in the New Testament takes it up"]},
        {"name": "Fulfilled in Christ", "routes": ["a command from Leviticus binds Christians as the New Testament takes it up through Christ", "a command from Leviticus binds Christians as the New Testament takes it up through Christ"]},
    ],
    "caption": "They differ more in how they reach a command than in where they arrive, though the Sabbath is one place they arrive differently.",
}

# The close: the same promise to Israel and to a church, and the passage the closing question names.
CLOSE_PAIR = ["Leviticus 26:11–12", "2 Corinthians 6:16"]
PASSAGE_AGAIN = "Leviticus 19:9–18"

# Counted from the Berean when the page is built: New Testament verses that repeat Leviticus 19:18's words.
NEIGHBOUR_PATTERN = r"love your neighbor as yourself"

# Named studies. "Study 26" in the text links to its mock-up; an italic title links where it has a page.
# Study 41 is being designed beside this one in the same run, so its folder may not exist yet: it is listed as pending.
STUDY_LINKS = {"25": "/mockups/what-the-cross-accomplishes-directions/", "26": "/mockups/covenants-and-promises-directions/",
               "41": "/mockups/christ-in-the-old-testament-directions/"}
PENDING_LINKS = {"41"}
STUDY_TITLES = {"Covenants and promises": "/mockups/covenants-and-promises-directions/", "The Ten Commandments": None}

# What each named source is, and what was read (from the study's passage notes).
SOURCES = [
    ["Berean Standard Bible.", "Every quotation and every verse sheet, from the site's own text; the three footnotes quoted are the Berean's."],
    ["The Baptist Faith and Message 2000, Articles II and VIII.", "Checked by script against the article text held in the site's question sources; the official page was not re-read for this build."],
    ["The Second London Baptist Confession (1677, reissued 1689), chapter 19.", "Read directly in the site's creeds collection; old spelling kept."],
    ["John Calvin, Institutes of the Christian Religion 4.20.14, trans. Henry Beveridge (1846).", "Read directly in a public-domain copy held on this PC."],
    ["Matthew Henry, Commentary on the Whole Bible, on Leviticus 10.", "Read directly in the CCEL text held on this PC."],
    ["Andrew A. Bonar, A Commentary on the Book of Leviticus (1851), chapter XIII.", "Read directly in a public-domain copy held on this PC."],
    ["Alfred Edersheim, The Temple: Its Ministry and Services (1874), chapter 14.", "Read directly in the CCEL text; described, not quoted."],
    ["Daniel Scheiderer, \"Progressive Covenantalism and the '1689'\", Baptist Dogmatics (2023).", "Read in a copy held for private reading only; described, not quoted."],
    ["Named, not read for this study:", "Barcellos, In Defense of the Decalogue; Strickland in Five Views on Law and Gospel (1996); Gentry and Wellum, Kingdom through Covenant (2012); Schreiner, 40 Questions About Christians and Biblical Law (2010); Wells and Zaspel, New Covenant Theology (2002); the Scofield Reference Bible (1909); the Baptist Catechism (1693)."],
]
