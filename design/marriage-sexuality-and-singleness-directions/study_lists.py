"""The lists the Sexuality, singleness and divorce page draws beside the study's own text. build-data.py checks every
phrase here against the Berean or the held source named for it, so a row cannot claim words its verse does not hold.
These are this page's choices for drawing, not a count of everything Scripture says."""
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[3]  # Jarvis/Projects/BibleProject
# Held sources may only be read from these folders, so a path in this file cannot reach anywhere else.
SOURCE_ROOTS = (PROJECT / "sources", PROJECT / "Website/content/questions/sources", PROJECT / "Website/data/text/bsb")

TITLE = ("Sexuality, singleness", "and divorce")
CONCEPTS = ["The design", "The body", "Singleness", "Divorce"]
# The motto is Matthew 19:4's own words, each line checked in that verse.
MOTTO = {"ref": "Matthew 19:4", "lines": ["Have you not read", "from the beginning?"]}

# Matthew 19:3–12, the conversation that holds all three of the study's questions, in its own order. Each phrase is
# checked in its verse and must come after the turn before it. "back" marks the turns where Jesus goes back to Genesis.
TURNS = [
    {"who": "Pharisees", "ref": "Matthew 19:3", "t": "Is it lawful for a man to divorce his wife for any reason?", "parts": ["05", "06"]},
    {"who": "Jesus", "ref": "Matthew 19:4–6", "t": "Have you not read that from the beginning the Creator", "parts": ["01"], "back": "Genesis 1:27; 2:24"},
    {"who": "Pharisees", "ref": "Matthew 19:7", "t": "did Moses order a man to give his wife a certificate of divorce", "parts": ["05"]},
    {"who": "Jesus", "ref": "Matthew 19:8", "t": "but it was not this way from the beginning", "parts": ["05"], "back": "Genesis 2:24"},
    {"who": "Jesus", "ref": "Matthew 19:9", "t": "except for sexual immorality", "parts": ["06"]},
    {"who": "Disciples", "ref": "Matthew 19:10", "t": "it is better not to marry", "parts": ["04"]},
    {"who": "Jesus", "ref": "Matthew 19:12", "t": "for the sake of the kingdom of heaven", "parts": ["04"]},
]
TURNS_PASSAGE = "Matthew 19:3–12"
GROUND = [("Genesis 1:27", "male and female"), ("Genesis 2:24", "they will become one flesh")]

# The study's three questions, filled for each part: what it was like from the beginning, the question (or slogan) the
# hard verse answers, and where holiness and grace stand. Every phrase is checked in its verse.
MARGIN = {
    "01": {"beginning": ("Genesis 2:24", "be united to his wife"),
           "asked": ("The Pharisees", "Matthew 19:3", "for any reason"),
           "holiness": ("Matthew 19:6", "what God has joined together, let man not separate"),
           "grace": ("Genesis 2:18", "I will make for him a suitable helper")},
    "02": {"beginning": ("Genesis 2:25", "they were not ashamed"),
           "asked": ("No one asked. A father begins", "Proverbs 5:1", "My son, pay attention to my wisdom"),
           "holiness": ("Hebrews 13:4", "the marriage bed kept undefiled"),
           "grace": ("Proverbs 5:18", "May your fountain be blessed")},
    "03": {"beginning": ("Genesis 2:24", "they will become one flesh"),
           "asked": ("A slogan in Corinth", "1 Corinthians 6:12", "Everything is permissible for me"),
           "holiness": ("1 Corinthians 6:18", "Flee from sexual immorality"),
           "grace": ("1 Corinthians 6:11", "But you were washed")},
    "04": {"beginning": ("Genesis 2:18", "It is not good for the man to be alone"),
           "asked": ("The disciples", "Matthew 19:10", "it is better not to marry"),
           "holiness": ("1 Corinthians 7:35", "undivided devotion to the Lord"),
           "grace": ("Isaiah 56:5", "a name better than that of sons and daughters")},
    "05": {"beginning": ("Matthew 19:8", "it was not this way from the beginning"),
           "asked": ("The Pharisees", "Matthew 19:7", "did Moses order a man to give his wife a certificate of divorce"),
           "holiness": ("Malachi 2:16", "do not break faith"),
           "grace": ("Malachi 2:14", "your companion and your wife by covenant")},
    "06": {"beginning": ("Matthew 19:6", "what God has joined together"),
           "asked": ("The disciples, in the house", "Mark 10:10", "the disciples asked Jesus about this matter"),
           "holiness": ("1 Corinthians 7:11", "remain unmarried or else be reconciled"),
           "grace": ("1 John 1:9", "He is faithful and just to forgive us our sins")},
}

# Part 01: Genesis 2:24 and every place the New Testament quotes it. The set of Berean verses holding "one flesh" must
# be exactly Genesis 2:24 and these verses, so the drawing cannot miss one or add one.
REMEMBERED = {
    "source": "Genesis 2:24",
    "places": [
        {"ref": "Matthew 19:5", "answers": "A question about divorce"},
        {"ref": "Mark 10:7–8", "answers": "The same question, in Mark"},
        {"ref": "1 Corinthians 6:16", "answers": "A visit to a prostitute"},
        {"ref": "Ephesians 5:31", "answers": "Christ and the church"},
    ],
    "also": ["Matthew 19:6"],  # "one flesh" again, Jesus' own conclusion, in the verse after the quotation
}

# Part 02: the Song of Songs as one strip. The verses that hold each refrain are found by search; the lists must match.
SONG = {
    "refrain": {"pattern": r"Do not arouse or awaken love until the time is right", "expect": ["2:7", "3:5", "8:4"],
                "label": "Do not arouse or awaken love until the time is right"},
    "belong": {"pattern": r"My beloved is mine|I belong to my beloved", "expect": ["2:16", "6:3", "7:10"],
               "label": "My beloved is mine / I belong to my beloved"},
}

# Part 03: 1 Corinthians 6:11's turn, "were", and its three verbs, in the verse's own order.
WASHED = {"ref": "1 Corinthians 6:11", "past": "And that is what some of you were", "verbs": ["you were washed", "you were sanctified", "you were justified"]}

# Part 04: Matthew 19:12's three kinds, in the verse's own order.
EUNUCHS = {"ref": "Matthew 19:12", "kinds": [("born that way", "By birth"), ("made that way by men", "By what others did"),
                                             ("live like eunuchs for the sake of the kingdom of heaven", "By choice")]}
DRY_TREE = [("Isaiah 56:3", "I am but a dry tree"), ("Isaiah 56:5", "an everlasting name that will not be cut off")]

# Part 05: Deuteronomy 24:1–4 as case law: the "if" runs through verses 1 to 3, and the command is in verse 4.
CASE = [
    ("Deuteronomy 24:1", "If", "If a man marries a woman", "he may write her a certificate of divorce"),
    ("Deuteronomy 24:2", "If", "If, after leaving his house, she goes and becomes another man's wife", None),
    ("Deuteronomy 24:3", "and", "and the second man hates her", "or if he dies"),
    ("Deuteronomy 24:4", "then", "then the husband who divorced her first may not remarry her", None),
]
ORDER_PERMITTED = [("They asked", "Matthew 19:7", "order"), ("He answered", "Matthew 19:8", "permitted")]

# Part 06: the saying on divorce in each Gospel that gives it. Whether each has the exception is found by search.
ACCOUNTS = ["Matthew 5:32", "Matthew 19:9", "Mark 10:11–12", "Luke 16:18"]
EXCEPTION = "except for sexual immorality"
LORD_I = [("1 Corinthians 7:10", "not I, but the Lord"), ("1 Corinthians 7:12", "I, not the Lord")]
# What all four views agree on: each must be the study's own words in part 06.
AGREE = ["God's design is lifelong", "reconciliation is sought first", "whoever broke faith is called to repent",
         "divorce is not the unforgivable sin"]

# Parts the study text gives no Consider or Reflect. The page leaves the space out and the README asks the owner;
# the build fails once the text gains them, so this list cannot go stale.
NO_QUESTIONS = {"02"}

# A short reference such as "(5:32; 19:9)" takes its book from this table, never from a guess. The build fails on a
# short reference not listed here, and on an entry the text no longer uses.
SHORT_REFS = {("06", "5:32"): "Matthew", ("06", "19:9"): "Matthew"}

# Quoted words of fewer than three words with no reference beside them, each pinned to the verse that holds them.
PINNED_QUOTES = {
    ("01", "one flesh"): "Genesis 2:24",
    ("01", "not ashamed"): "Genesis 2:25",
    ("03", "were"): "1 Corinthians 6:11",
    ("04", "gift"): "1 Corinthians 7:7",
    ("04", "cannot control themselves"): "1 Corinthians 7:9",
    ("05", "some indecency"): "Deuteronomy 24:1",
    ("05", "order"): "Matthew 19:7",
    ("05", "permitted"): "Matthew 19:8",
    ("05", "break faith"): "Malachi 2:16",
    ("close", "Have you not read?"): "Matthew 19:4",
}
# Quoted words that are the study's own, not a quotation from anywhere.
OWN_TERMS = {("02", "no")}

# Held copies on this PC. Paths are those the passage notes record as read.
LIB = PROJECT / "sources/library"
SOURCES_HELD = {
    "bfm": {"name": "Baptist Faith and Message 2000 (text held with the Know the Truth catechism)",
            "path": PROJECT / "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"},
    "bsb_note": {"name": "Berean Standard Bible, its footnote on Malachi 2:16", "path": PROJECT / "Website/data/text/bsb/MAL/0.json"},
    "henry_song": {"name": "Matthew Henry's Concise Commentary, on the Song of Solomon", "path": LIB / "bulk/ccel/henry_mhcc.xml"},
    "henry_matt": {"name": "Matthew Henry, Exposition, on Matthew 19", "path": LIB / "bulk/ccel/henry_mhc5.xml"},
    "henry_cor": {"name": "Matthew Henry, Exposition, on 1 Corinthians 7", "path": LIB / "bulk/ccel/henry_mhc6.xml"},
    "piper_song": {"name": "John Piper, \"Is Sexual Pleasure Essential for Marriage?\" (2015)",
                   "path": LIB / "source-desiring-god/asset-modern-piper-qyxlpjks-html/original.html"},
    "piper_single": {"name": "John Piper, \"How Should Singleness Be Different for Christians?\" (2008)",
                     "path": LIB / "source-desiring-god/asset-modern-piper-0msmcjig-html/original.html"},
    "piper_paper": {"name": "John Piper, \"Divorce & Remarriage: A Position Paper\" (1986)",
                    "path": LIB / "source-desiring-god/asset-modern-piper-wuf18s7s-html/original.html"},
    "bethlehem": {"name": "Bethlehem Baptist Church, \"A Statement on Divorce and Remarriage\" (1989)",
                  "path": LIB / "source-desiring-god/asset-modern-piper-sdt6weel-html/original.html"},
    "gill": {"name": "John Gill, A Body of Practical Divinity", "path": LIB / "source-ccel/asset-l11-gill-practical-xml/practical.xml"},
    "marsh": {"name": "Reagan Marsh, \"Of Marriage: The 1689 Baptist Confession\" (Founders Ministries, 2020)",
              "path": LIB / "source-founders/asset-rb01-4f2a56da315cfd839ec8/original.html"},
    "wcf": {"name": "Westminster Confession of Faith (1646)",
            "path": LIB / "source-creeds-json/asset-l08-wcf-json/westminster_confession_of_faith.json"},
    "criswell": {"name": "W. A. Criswell, \"Michal: The Loneliness of Singles\" (1980)",
                 "path": LIB / "source-criswell/asset-sermons-criswell-15505/original.html"},
}

# Quotations from outside Scripture, keyed by the part they stand in. Each must be in its held source within a short
# distance of "near", words that place it in the right article, chapter or paragraph.
OUTSIDE_QUOTES = {
    ("intro", "the uniting of one man and one woman in covenant commitment for a lifetime"): ("bfm", "XVIII The Family"),
    ("01", "God's unique gift to reveal the union between Christ and His church"): ("bfm", "XVIII The Family"),
    ("02", "a Divine allegory, which represents the love between Christ and his church"): ("henry_song", "Song of Solomon This book is"),
    ("02", "a lavish, celebration of God's gift of sexual pleasure in marriage"): ("piper_song", "an utterly sensual song"),
    ("03", "all forms of sexual immorality, including adultery, homosexuality, and pornography"): ("bfm", "Christians should oppose racism"),
    ("03", "possesses full dignity and is worthy of respect and Christian love"): ("bfm", "every person of every race"),
    ("04", "Continence is a special gift of God to some, and not to others"): ("henry_matt", "affection to the single state"),
    ("04", "singleness is a gift for as long as you have it."): ("piper_single", "increased devotion to the Lord"),
    ("05", "For He hates sending away"): ("bsb_note", "covers his garment with violence"),
    ("06", "such wilful desertion as can no way be remedied"): ("wcf", "nothing but adultery"),
    ("06", "the divorce question as a matter of conscience"): ("marsh", "Savoy and 2LC"),
    ("06", "a New Testament prohibition of all remarriage except in the case where a spouse has died"): ("piper_paper", "solemnity and seriousness"),
    ("06", "indissoluble but by death, excepting in one case, unfaithfulness in the one to the other, by adultery or fornication"): ("gill", "conjugal union"),
    ("06", "the deserted person must be free to marry again"): ("henry_cor", "reconciliation have been tried"),
    ("06", "full freedom to remarry a believer"): ("marsh", "unbeliever's departure"),
    ("06", "Divorce may be permitted when a spouse deserts the relationship, commits adultery, or is dangerously abusive"): ("bethlehem", "The Guidelines"),
    ("06", "more limiting standards for remarriage"): ("bethlehem", "honest and devout differences"),
    ("06", "not to make them normative for the whole body"): ("bethlehem", "honest and devout differences"),
    ("06", "traumatically single by death, or by divorce, or by desertion"): ("criswell", "attitude of the church toward those who are"),
    ("06", "one of infinite sympathy, and understanding, and love, and encouragement"): ("criswell", "attitude of the church toward those who are"),
}
NEAR_WINDOW = 1500  # characters of the folded source text, either side of the quotation

# Studies named in the text. A study with a mock-up on this PC links to it; the rest are named in italics.
STUDY_LINKS = {"05": "/mockups/faith-in-daily-life-directions/", "29": "/mockups/humanity-sin-and-renewal-directions/"}
STUDY_NAMES = {
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "The wisdom books": None,
    "Following Jesus and the Sermon on the Mount": None,
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy; its footnote on Malachi 2:16."),
    ("The Baptist Faith and Message 2000", "Articles III, XV and XVIII, quoted in short phrases. The site's doctrinal standard."),
    ("Matthew Henry", "Exposition, on Matthew 19 and 1 Corinthians 7; Concise Commentary, on the Song of Solomon."),
    ("John Piper and Bethlehem Baptist Church", "The 1986 position paper, the church's 1989 statement, and two Ask Pastor John answers (2008, 2015)."),
    ("John Gill", "A Body of Practical Divinity, on the duties of husband and wife."),
    ("Reagan Marsh", "On chapter 25 of the 1689 Baptist Confession (Founders Ministries, 2020)."),
    ("The Westminster Confession of Faith", "Chapter 24, the paragraph the Baptists left out."),
    ("W. A. Criswell", "\"Michal: The Loneliness of Singles\", a sermon at First Baptist Church, Dallas (1980)."),
    ("John Calvin", "Named, not quoted, for his reading of 1 Corinthians 7:7 and Malachi 2:16."),
]
