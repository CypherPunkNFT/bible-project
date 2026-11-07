"""The lists the Money, possessions and generosity page draws beside the study's own text. build-data.py checks every
phrase here against the Berean or against the study's own words, so an address card cannot say what neither holds.
These are this page's choices for drawing the study, not new teaching."""

TITLE = ("Money,", "possessions and generosity")  # ink, then the turn in gold italic; joined they must equal the title

# The site's section colour for each book used here, named in words as well, so colour is never the only carrier.
SECTION_NAMES = {"history": "History · the law and the kings", "poetry": "Poetry & Wisdom", "prophets": "Prophets", "gospels": "Gospels"}

# An address has up to four lines. Each value is (words, source): the source is a verse reference, in which case the
# words must be in that verse, or a section of content.md ("opening", "01"–"07", a question id), in which case the
# words must be the study's own words in that section. Nothing on an address card is new wording.
ADDRESS_FIELDS = {"to": "First spoken to", "under": "Under", "for": "What it was for", "not": "What it does not promise"}

# 00 Lines often heard without their setting. "heard" is how the study says the line is misused, in its own words.
HEARD = [
    {"ref": "Deuteronomy 8:18", "part": "01", "section": "history",
     "line": "it is the LORD your God who gives you the power to gain wealth",
     "heard": ("as if God promises every believer the power to become rich", "01"),
     "to": ("Israel as a nation entering its land", "01"),
     "under": ("His covenant that He swore to your fathers", "Deuteronomy 8:18"),
     "for": ("It tells you where wealth comes from when it comes", "01"),
     "not": ("It does not promise that it will come to you", "01")},
    {"ref": "Malachi 3:10", "part": "04", "section": "prophets",
     "line": "See if I will not open the windows of heaven and pour out for you blessing without measure",
     "heard": ("with a promise that God must repay you more", "04"),
     "to": ("the whole nation", "Malachi 3:9"),
     "under": ("Israel under the covenant God made at Sinai", "04"),
     "for": ("food for those who served there", "04"),
     "not": ("It is not a rate of return", "04")},
    {"ref": "Proverbs 3:10", "part": None, "section": "poetry",
     "line": "then your barns will be filled with plenty",
     "heard": ("A proverb about how life usually goes is sold as a guarantee", "opening"),
     "for": ("how life generally goes under God's hand", "prosperity"),
     "not": ("not guarantees for every case", "prosperity")},
    {"ref": "Luke 16:9", "part": "05", "section": "gospels",
     "line": "use worldly wealth to make friends for yourselves",
     "heard": ("is skipped because one of its characters is dishonest", "opening"),
     "to": ("His disciples", "05"),
     "for": ("use it now for what will last", "05"),
     "not": ("the story still calls the manager dishonest", "05")},
    {"ref": "Mark 12:44", "part": "07", "section": "gospels",
     "line": "she out of her poverty has put in all she had to live on",
     "heard": ("used to press poor people to give what they need to live on", "07"),
     "to": ("His disciples", "07"),
     "for": ("Jesus measures a gift by what it cost the giver", "07"),
     "not": ("He does not command anyone to do the same", "07")},
]

# Each part's address, shown beside its heading. Same rules as above.
PART_ADDRESS = {
    "01": {"section": "history", "to": ("Israel as a nation entering its land", "01"),
           "under": ("His covenant that He swore to your fathers", "Deuteronomy 8:18"),
           "for": ("It tells you where wealth comes from when it comes", "01"),
           "not": ("It does not promise that it will come to you", "01")},
    "02": {"section": "history", "to": ("David prays in front of everyone", "02"),
           "for": ("to build You a house for Your holy Name", "1 Chronicles 29:16"),
           "not": ("The passage sets no amount", "02")},
    "03": {"section": "history", "to": ("each household", "03"),
           "under": ("part of the law God gave Israel, tied to a land, a harvest year and a place of worship", "03"),
           "for": ("so that you may learn to fear the LORD your God always", "Deuteronomy 14:23"),
           "not": ("It is not a price list", "03")},
    "04": {"section": "prophets", "to": ("the whole nation", "Malachi 3:9"),
           "under": ("Israel under the covenant God made at Sinai", "04"),
           "for": ("food for those who served there", "04"),
           "not": ("It is not a rate of return", "04")},
    "05": {"section": "gospels", "to": ("His disciples", "05"),
           "for": ("use it now for what will last", "05"),
           "not": ("Money is not called evil here", "05")},
    "06": {"section": "gospels", "under": ("They have Moses and the prophets", "Luke 16:29"),
           "for": ("what a heart that has not listened to God looks like", "06"),
           "not": ("This story does not teach that the poor are saved because they are poor", "06")},
    "07": {"section": "gospels", "to": ("His disciples", "07"),
           "for": ("Jesus measures a gift by what it cost the giver", "07"),
           "not": ("He does not command anyone to do the same", "07")},
}

# 01 The order of Deuteronomy 8:12–14: four gifts, then "then" and the heart. Proved in this order in the verses.
ORDER = {
    "ref": "Deuteronomy 8:12–14", "turn_ref": "Deuteronomy 8:14",
    "steps": [
        {"words": "when you eat and are satisfied", "kind": "gift"},
        {"words": "when you build fine houses", "kind": "gift"},
        {"words": "when your herds and flocks grow large", "kind": "gift"},
        {"words": "your silver and gold increase", "kind": "gift"},
        {"words": "then your heart will become proud", "kind": "heart"},
        {"words": "you will forget the LORD your God", "kind": "heart"},
    ],
    "read": "Every step up is a gift, and none of them is a sin. The danger comes after them, with the word “then”.",
}

# 02 David's prayer, 1 Chronicles 29:10–19. Words that address God (You, Your, Yours) and words for the givers (I, me,
# my, we, us, our) are counted by script. Every "You" in these verses is David speaking to God (29:10 opens "and
# said:", and no one else speaks before 29:19 ends). "more_you" is the claim the page's sentence makes.
YOURS = {"ref": "1 Chronicles 29:10–19", "more_you": True}

# 03 The tithe through the years, as the study summarises the rabbis' reading, and the four guests of 14:29.
TITHE = {
    "poor_years": "In the third and sixth years of each seven-year cycle it was replaced by the tithe of the poor",
    "poor": [3, 6],
    "three": ("At the end of every three years", "Deuteronomy 14:28"),
    "places": {"feast": ("in the presence of the LORD your God at the place He will choose", "Deuteronomy 14:23"),
               "poor": ("lay it up within your gates", "Deuteronomy 14:28")},
    "guests_ref": "Deuteronomy 14:29",
    "guests": [
        {"word": "the Levite", "why": "no land of his own"},
        {"word": "the foreigner", "why": "far from home"},
        {"word": "the fatherless", "why": "no father"},
        {"word": "the widow", "why": "no husband"},
    ],
}

# 05 The two bills, Luke 16:6–7. Each number is in its verse as a word.
BILLS = [
    {"what": "olive oil", "ref": "Luke 16:6", "was": 100, "was_words": "A hundred measures of olive oil", "now": 50, "now_words": "write fifty"},
    {"what": "wheat", "ref": "Luke 16:7", "was": 100, "was_words": "A hundred measures of wheat", "now": 80, "now_words": "write eighty"},
]

# 06 Luke 16:25, drawn as a crossing, and the thread of the gate back to the law the rich man had.
REVERSAL = {
    "ref": "Luke 16:25",
    "rows": [
        {"who": "The rich man", "then": "you received your good things", "now": "you are in agony"},
        {"who": "Lazarus", "then": "Lazarus received bad things", "now": "he is comforted here"},
    ],
}
GATE = [
    {"ref": "Deuteronomy 14:29", "words": "the widow within your gates may come and eat and be satisfied", "note": "The law: the poor at the gate eat"},
    {"ref": "Luke 16:20", "words": "a beggar named Lazarus lay at his gate", "note": "The rich man's gate"},
    {"ref": "Luke 16:29", "words": "They have Moses and the prophets", "note": "He had the law that told him"},
]

# 07 The coins. Mark gives no amounts for the rich, so the drawing is proportion only and says so.
COINS = {
    "ref": "Mark 12:44",
    "sides": [{"who": "The rich", "words": "they all contributed out of their surplus", "kept": True},
              {"who": "The widow", "words": "she out of her poverty has put in all she had to live on", "kept": False}],
    "gift": "two small copper coins", "gift_ref": "Mark 12:42",
}

# The close: the habit, step by step, in the study's own words, in the order its Way paragraph gives them.
WAY_STEPS = [
    {"n": "1", "name": "The address", "words": "Read the address first"},
    {"n": "2", "name": "God", "words": "ask what it says about God"},
    {"n": "3", "name": "Your heart", "words": "ask what it says about your heart"},
    {"n": "4", "name": "Its limit", "words": "notice what it does not promise"},
    {"n": "5", "name": "Again", "words": "go back and read it again"},
]

# A block quotation that prints a speaker's words without the verse's opening frame. The build proves the frame is
# exactly this and that the rest is word for word. The verse sheet shows the whole verse.
SPOKEN_BLOCKS = {"Luke 16:29": "But Abraham replied,", "Mark 12:43–44": "Jesus called His disciples to Him and said,"}

# Quotations in the study that are not word for word the Berean. A design job may not change the study's words, so
# the page keeps them and marks each with the Berean's wording. The build proves the study's words are NOT in the
# verse and the Berean's are. Every entry must be used.
MISQUOTES = {
    ("02", "comes from Your hand"): ("1 Chronicles 29:16", "from Your hand comes all this abundance"),
    ("04", "does not change"): ("Malachi 3:6", "do not change"),
    ("07", "devour widows' houses"): ("Mark 12:40", "They defraud widows of their houses"),
}

# Studies the text names in italics, each a folder under design/. The build warns for one without index.html.
STUDY_LINKS = {
    "Fear, anxiety and despair": "fear-anxiety-and-despair-directions",
    "Sexuality, singleness and divorce": "marriage-sexuality-and-singleness-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "The hope to come": "the-hope-to-come-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
    "Leviticus: holiness and sacrifice": "the-law-of-moses-and-the-christian-directions",
    "The wisdom books": "the-wisdom-books-directions",
    "Encounters with Jesus": "encounters-with-jesus-directions",
    "Following Jesus and the Sermon on the Mount": "following-jesus-directions",
}
# Every other italic in the text: words explained where they stand, and titles. An italic on no list fails.
ITALIC_TERMS = {"covenant", "ordinances", "remember", "stewardship", "how", "tithe", "ma'aser sheni", "ma'aser ani",
                "ma'aser kesafim", "tzedakah", "repent", "parable", "shrewd", "Hades", "gospel", "denarius",
                "prosperity gospel", "Grace", "Poet and Peasant", "Catholic Biblical Quarterly"}

# Quoted words that are not Scripture: (source shown on the page, held source key or None, the BFM article searched).
OUTSIDE_QUOTES = {
    "God is the source of all blessings, temporal and spiritual; all that we have and are we owe to Him": ("Baptist Faith and Message 2000, article XIII", "bfm", "XIII"),
    "a binding stewardship in their possessions": ("Baptist Faith and Message 2000, article XIII", "bfm", "XIII"),
    "as entrusted to them to use for the glory of God and for helping others": ("Baptist Faith and Message 2000, article XIII", "bfm", "XIII"),
    "should contribute of their means cheerfully, regularly, systematically, proportionately, and liberally for the advancement of the Redeemer's cause on earth": ("Baptist Faith and Message 2000, article XIII", "bfm", "XIII"),
    "every form of greed": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "personal faith in Jesus Christ as Lord": ("Baptist Faith and Message 2000, article IV", "bfm", "IV"),
}
HELD = {"bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"}}

# Quoted words that are the study's own terms or titles, keyed by where they stand. Every entry must be used.
OWN_TERMS = {
    ("03", "first tithe"): "a rabbinic term, named as theirs",
    ("03", "second tithe"): "a rabbinic term, named as theirs",
    ("03", "tithe of the poor"): "a rabbinic term, named as theirs",
    ("04", "storehouse tithing"): "a name some Baptist churches use",
    ("prosperity", "positive confession"): "the name of a teaching",
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles IV, XIII and XV, quoted in short phrases, each found by script in its own article in the copy held on this PC. The site's doctrinal standard."),
    ("Jewish teaching on the tithes; the Talmud, Ta'anit 9a", "Summarised by the study, not quoted. Marked on the page as still to be checked with a Jewish source."),
    ("J. Duncan M. Derrett; Joseph Fitzmyer; Kenneth E. Bailey; Addison G. Wright", "Named for their readings of Luke 16 and Mark 12. Not read for this page, as the study says beside each."),
    ("The Assemblies of God", "A position paper named, not quoted. Marked as still to be checked."),
]
