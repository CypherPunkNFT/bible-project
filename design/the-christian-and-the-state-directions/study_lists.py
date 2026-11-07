"""The lists The Christian and the state page draws beside the study's own text. build-data.py checks every Berean
phrase here against its verse, and every phrase taken from the study against content.md, so a figure cannot claim
words its source does not hold. These are this page's choices, not a count of every verse about government.

"label" is always the page's own short name for an item; "words" is always the Berean's own wording at "ref".
"added": True marks a verse the study does not cite, added by this page; the page says so beside it."""

TITLE = ("The Christian", "and the state")  # ink, then the turn in gold italic; joined they must equal the title

# 00 Whose is it? The ruler's coin inside God's larger circle. "col": ruler (inside the coin), god (in the ring
# around it), or cross (a line drawn across the coin's edge; "from" says which way). "part" is the part that reads it.
ITEMS = [
    {"id": "caesar", "col": "ruler", "label": "What is Caesar's", "words": "Give to Caesar what is Caesar's", "ref": "Mark 12:17", "part": "03"},
    {"id": "submit", "col": "ruler", "label": "Submission", "words": "Everyone must submit himself to the governing authorities", "ref": "Romans 13:1", "part": "03"},
    {"id": "taxes", "col": "ruler", "label": "Taxes", "words": "taxes to whom taxes are due", "ref": "Romans 13:7", "part": "03"},
    {"id": "honor", "col": "ruler", "label": "Honor", "words": "honor the king", "ref": "1 Peter 2:17", "part": "03"},
    {"id": "prayer", "col": "ruler", "label": "Prayers for rulers", "words": "for kings and all those in authority", "ref": "1 Timothy 2:2", "part": "03"},
    {"id": "god", "col": "god", "label": "What is God's", "words": "to God what is God's", "ref": "Mark 12:17", "part": "03"},
    {"id": "fear", "col": "god", "label": "Fear", "words": "fear God", "ref": "1 Peter 2:17", "part": "03"},
    {"id": "worship", "col": "god", "label": "Worship", "words": "we will not serve your gods or worship the golden statue", "ref": "Daniel 3:18", "part": "04"},
    {"id": "prayer-god", "col": "god", "label": "Prayer to God", "words": "prayed, and gave thanks to his God", "ref": "Daniel 6:10", "part": "04"},
    {"id": "conscience", "col": "god", "label": "Conscience", "words": "Judge for yourselves whether it is right in God's sight", "ref": "Acts 4:19", "part": "05"},
    {"id": "gospel", "col": "god", "label": "The gospel", "words": "we cannot stop speaking about what we have seen and heard", "ref": "Acts 4:20", "part": "04"},
    {"id": "battles", "col": "cross", "from": "god", "label": "The trust that belongs to God, handed to a king",
     "words": "to fight our battles", "ref": "1 Samuel 8:20", "part": "01"},
    {"id": "silence", "col": "cross", "from": "ruler", "label": "Silence about Jesus, commanded by a council and refused",
     "words": "commanded them not to speak or teach at all in the name of Jesus", "ref": "Acts 4:18", "part": "04"},
]
COLUMNS = {"ruler": "Owed the ruler", "god": "God's alone", "cross": "Across the line"}
# The one sentence that reads the figure. The page's own words.
ITEMS_READ = ("Everything the ruler is owed sits inside what belongs to God. The two dashed lines are where a passage "
              "goes wrong: a people hands God's work to a king, or a ruler claims what is God's.")

# How the two columns stand in each part: a short name and one line. The page's own words, shown as such.
STATES = {
    "01": ("Handed over", "The people give a king the work God had been doing for them."),
    "02": ("Fenced in", "The king sits under the same book as the people he rules."),
    "03": ("At peace", "The ruler is owed real things, and giving them is part of obeying God."),
    "04": ("In collision", "A ruler forbids what God commands, and God's column wins."),
    "05": ("Out of reach", "No ruler may rule over the conscience."),
    "06": ("Remade", "When God judges between the nations, the sword itself is remade."),
}

# 01 "He will take": the verb Samuel repeats, each time with what is taken. The build counts "take" in the warning
# itself and requires exactly this many rows, and the study's own "six times".
TAKE_RANGE = "1 Samuel 8:11–17"
TAKES = [
    {"label": "Sons, for his chariots", "words": "He will take your sons", "ref": "1 Samuel 8:11"},
    {"label": "Daughters, for his kitchens", "words": "he will take your daughters to be perfumers, cooks, and bakers", "ref": "1 Samuel 8:13"},
    {"label": "The best of the land", "words": "He will take the best of your fields and vineyards and olive groves", "ref": "1 Samuel 8:14"},
    {"label": "A tenth of the harvest", "words": "He will take a tenth of your grain and grape harvest", "ref": "1 Samuel 8:15"},
    {"label": "Servants and cattle", "words": "he will take your menservants and maidservants and your best cattle and donkeys", "ref": "1 Samuel 8:16"},
    {"label": "A tenth of the flocks", "words": "He will take a tenth of your flocks", "ref": "1 Samuel 8:17"},
]
TAKE_END = {"words": "you yourselves will become his slaves", "ref": "1 Samuel 8:17"}
TAKE_STUDY = "The word comes six times"  # must be in content.md, and six must equal len(TAKES)
BATTLES = {"asked": {"words": "to fight our battles", "ref": "1 Samuel 8:20"},
           "before": {"words": "The LORD will fight for you", "ref": "Exodus 14:14", "added": True}}

# 02 Three limits on the king, set against Solomon's record. "shown" is what the page prints large; the build derives
# it from the record's own words (digits, or number words through NUMBER_WORDS) so it cannot drift from the verse.
NUMBER_WORDS = {"seven hundred": 700, "three hundred": 300}
LIMITS = [
    {"label": "Horses", "means": "military power", "limit": {"words": "must not acquire many horses", "ref": "Deuteronomy 17:16"},
     "record": {"words": "Solomon accumulated 1,400 chariots and 12,000 horses", "ref": "1 Kings 10:26", "added": True},
     "shown": [("12,000", "12,000 horses"), ("1,400", "1,400 chariots")]},
    {"label": "Wives", "means": "alliances and pride", "limit": {"words": "must not take many wives", "ref": "Deuteronomy 17:17"},
     "record": {"words": "seven hundred wives of royal birth and three hundred concubines", "ref": "1 Kings 11:3", "added": True},
     "shown": [("700", "seven hundred wives"), ("300", "three hundred concubines")]},
    {"label": "Silver and gold", "means": "wealth", "limit": {"words": "must not accumulate for himself large amounts of silver and gold", "ref": "Deuteronomy 17:17"},
     "record": {"words": "The weight of gold that came to Solomon each year was 666 talents", "ref": "1 Kings 10:14", "added": True},
     "shown": [("666", "666 talents")]},
]
LIMIT_RANGE = "Deuteronomy 17:16–17"  # "must not" is counted here and must equal len(LIMITS)
HEART = {"warned": {"words": "lest his heart go astray", "ref": "Deuteronomy 17:17"},
         "happened": {"words": "his wives turned his heart away", "ref": "1 Kings 11:3", "added": True},
         "scroll": {"words": "Then his heart will not be exalted above his countrymen", "ref": "Deuteronomy 17:20"}}

# 03 What the first column holds. "verb" must be a word of "words"; "to" is whom it is owed, in the verse's words
# ("to_ref" when the whom is in the next verse).
OWED = [
    {"verb": "Give", "words": "Give to Caesar what is Caesar's", "ref": "Mark 12:17", "to": "Caesar"},
    {"verb": "submit", "words": "Everyone must submit himself to the governing authorities", "ref": "Romans 13:1", "to": "the governing authorities"},
    {"verb": "Pay", "words": "Pay everyone what you owe him: taxes to whom taxes are due", "ref": "Romans 13:7", "to": "to whom taxes are due"},
    {"verb": "honor", "words": "honor the king", "ref": "1 Peter 2:17", "to": "the king"},
    {"verb": "prayers", "words": "petitions, prayers, intercessions, and thanksgiving be offered for everyone", "ref": "1 Timothy 2:1",
     "to": "for kings and all those in authority", "to_ref": "1 Timothy 2:2"},
    {"verb": "Seek", "words": "Seek the prosperity of the city", "ref": "Jeremiah 29:7", "to": "the city to which I have sent you as exiles"},
]
OWED_READ = "Every verb here gives the ruler, or the city, something real. None of them is worship."

# 04 Three times a ruler claimed God's column. Each command against its answer, in the verses' words.
COLLISIONS = [
    {"ruler": "The council", "where": "Jerusalem",
     "command": {"words": "commanded them not to speak or teach at all in the name of Jesus", "ref": "Acts 4:18"},
     "answer": {"words": "we cannot stop speaking about what we have seen and heard", "ref": "Acts 4:20"},
     "manner": {"words": "Rulers and elders of the people!", "ref": "Acts 4:8"},
     "after": {"words": "After further threats they let them go", "ref": "Acts 4:21"}},
    {"ruler": "King Nebuchadnezzar", "where": "Babylon",
     "command": {"words": "you must fall down and worship the golden statue", "ref": "Daniel 3:5", "added": True},
     "answer": {"words": "we will not serve your gods or worship the golden statue you have set up", "ref": "Daniel 3:18"},
     "manner": {"words": "But even if He does not", "ref": "Daniel 3:18"}},
    {"ruler": "King Darius", "where": "Babylon", "ruler_ref": "Daniel 6:9",
     "command": {"words": "anyone who petitions any god or man except you, O king, will be thrown into the den of lions", "ref": "Daniel 6:7", "added": True},
     "answer": {"words": "got down on his knees, prayed, and gave thanks to his God, just as he had done before", "ref": "Daniel 6:10"},
     "manner": {"words": "the windows of his upper room opened toward Jerusalem", "ref": "Daniel 6:10"}},
]

# 05 Who wrote what about the ruler and religion. Every "year" and "who" must be in part 05's own text, and "check"
# must be the start of one of that part's own [check: ...] notes, which the figure shows beside the date.
DATES = [
    {"year": "1612", "who": "Thomas Helwys", "kind": "baptist", "what": "Writes to King James I that the king may not judge between God and man.",
     "check": "Helwys' original wording"},
    {"year": "1646", "who": "The Westminster Confession of Faith", "kind": "reformed", "what": "Gives the civil ruler a duty to suppress blasphemies and heresies.",
     "check": "wording of Westminster Confession 23.3"},
    {"year": "1788", "who": "American Presbyterians", "kind": "reformed", "what": "Revise that chapter.", "check": "year of the American revision"},
    {"year": "1908", "who": "E. Y. Mullins", "kind": "baptist", "what": "Names soul competency in The Axioms of Religion.", "check": "Mullins' exact wording"},
    {"year": "1965", "who": "the Second Vatican Council", "kind": "catholic", "what": "Declares in Dignitatis Humanae a right to religious freedom.",
     "check": "wording of the official English translation"},
    {"year": "2000", "who": "The Baptist Faith and Message 2000", "kind": "baptist", "what": "Article XVII: God alone is Lord of the conscience; church and state separate.",
     "check": "confirm paraphrase against the current text of article XVII"},
]
KINDS = {"baptist": "Baptist", "reformed": "Presbyterian and Reformed", "catholic": "Roman Catholic"}

# 06 Isaiah 2:2–4 in its own order. The build proves each phrase is in the passage and that they come in this order.
ISAIAH_RANGE = "Isaiah 2:2–4"
ISAIAH = [
    {"label": "The nations come", "words": "all nations will stream to it", "ref": "Isaiah 2:2"},
    {"label": "They learn", "words": "He will teach us His ways", "ref": "Isaiah 2:3"},
    {"label": "God judges", "words": "He will judge between the nations", "ref": "Isaiah 2:4"},
    {"label": "The swords are remade", "words": "They will beat their swords into plowshares", "ref": "Isaiah 2:4"},
]
# The two Christian answers on war, and what both agree. Every phrase is taken word for word from part 06 of the study.
VIEWS = {
    "just": {"name": "The just-war tradition", "lines": ["war is always tragic but may sometimes be right, as a last resort, to protect the innocent against grave wrong",
                                                       "It reads Jesus' words in Matthew 5 as governing personal revenge",
                                                       "Most Southern Baptists hold this view"],
             "tests": ["a just cause", "lawful authority", "right intention", "last resort", "a reasonable hope of success",
                       "force in proportion to the wrong", "sparing those who are not fighting"]},
    "peace": {"name": "Pacifism", "lines": ["Christians should not take part in war or use deadly force",
                                            "It reads Matthew 5:38–48 as Christ's command to His followers in every setting",
                                            "It is a minority view among Baptists"],
              "tests": ["the Mennonites", "the Amish", "the Hutterites", "the Church of the Brethren"]},
    "both": ["War is never good in itself", "Christians must love their enemies and pray for them",
             "Revenge is forbidden to the believer", "Peace is the goal, and Isaiah 2 is the end of the story"],
}

# Studies the text names in italics, each a folder under design/. data.js never depends on whether the folder exists;
# the build prints a warning for one without index.html. Every entry must be used.
STUDY_LINKS = {
    "Christ in the Old Testament": "christ-in-the-old-testament-directions",
    "Leviticus: holiness and sacrifice": "the-law-of-moses-and-the-christian-directions",
    "Encounters with Jesus": "encounters-with-jesus-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
    "Prayer across Scripture: learning to pray": "prayer-in-the-letters-directions",
    "Reading the Bible well: where to start and how to keep going": "books-in-their-settings-directions",
    "Reading Daniel and Revelation": "reading-daniel-and-revelation-directions",
    "Life together: belonging to a church": "life-together-directions",
    "Following Jesus and the Sermon on the Mount": "following-jesus-directions",
    "The hope to come": "the-hope-to-come-directions",
}
# Every other italic in the text: a word explained where it stands, an emphasis, or a title. Every entry must be used.
ITALIC_TERMS = {"torah", "for", "The Axioms of Religion", "A Short Declaration of the Mystery of Iniquity",
                "Dignitatis Humanae", "Confession of Faith in a Mennonite Perspective"}

# Quoted words that are not Scripture: (source shown on the page, held source key or None, the part of it searched).
# None means not held on this PC: the build marks the quotation on the page as not yet compared, and fails if it
# cannot place that mark. A trailing full stop inside the quotation marks is ignored for the lookup.
OUTSIDE_QUOTES = {
    "God alone is Lord of the conscience": ("Baptist Faith and Message 2000, article XVII", "bfm", "XVII"),
    "A free church in a free state is the Christian ideal": ("Baptist Faith and Message 2000, article XVII", "bfm", "XVII"),
    "on principles of righteousness": ("Baptist Faith and Message 2000, article XVI", "bfm", "XVI"),
    "our accountability to each other under the Word of God": ("Baptist Faith and Message 2000, preamble", None, None),
    "that all blasphemies and heresies be suppressed": ("Westminster Confession of Faith (1646), chapter 23", None, None),
    "that the human person has a right to religious freedom": ("Second Vatican Council, Dignitatis Humanae (1965), section 2", None, None),
    "engage in just wars": ("Augsburg Confession (1530), article 16", None, None),
    "the sword is ordained of God outside the perfection of Christ": ("Schleitheim Confession (1527), article 6", None, None),
}
# Outside quotations that differ from the held copy. The page keeps the study's words and marks the held wording.
# The build proves the study's words are NOT in the held part and the held wording IS, so an entry can neither hide
# a real match nor give a wrong correction. Every entry must be used.
OUTSIDE_MISQUOTES = {
    "may lawfully now, under the New Testament, wage war upon just and necessary occasion":
        ("Second London Baptist Confession (1677), chapter 24", "lbc", "XXIV",
         "may lawfully now under the New Testament wage war upon just and necessary occasions"),
}
# Held sources, relative to the BibleProject folder. "bfm" is a text file whose articles start "X. Title"; "lbc" is
# the Text Creation Partnership's 1677 confession (A34255, CC0), held in parts under one key in a library page file.
HELD = {
    "bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"},
    "lbc": {"path": "Website/public/content/teacher-library/pages/cb8d39754a612df2924fe02750d9e7d3b6bb47e673dbad6df312f8929919cbf4.json",
            "key": "held-c2323649049725fade9d6516655dab79"},
}

# Quoted words that are the study's own terms, keyed by the section they stand in. Every entry must be used.
OWN_TERMS = {
    ("opening", "the state"): "the study's definition of its subject",
    ("opening", "Caesar"): "a title, explained where it stands",
    ("03", "approve of everything"): "the study's own words for what submission does not mean",
    ("06", "enemy"): "the study's word in its question to the reader",
}

# What each [source:…] note in the text is labelled on the page.
SOURCE_LABELS = {"helwys": "An early Baptist"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles XVI and XVII, quoted in short phrases, each found by script in its own article in the copy held on this PC. The site's doctrinal standard. Its preamble is not in that copy, so the one phrase quoted from it is marked as not yet compared."),
    ("The Second London Baptist Confession (1677)", "Chapter 24, found by script in the Text Creation Partnership text (A34255, public domain) held on this PC. That text reads “occasions” where the study has “occasion”; the page marks it."),
    ("The Westminster Confession, the Augsburg Confession, the Schleitheim Confession, Dignitatis Humanae", "Each quoted in a short phrase as that tradition's own words. None is held on this PC: each quotation is marked as not yet compared."),
    ("Thomas Helwys, E. Y. Mullins, the Talmud, the Mishnah, Augustine, Thomas Aquinas, the Mennonite confession (1995)", "Named or paraphrased by the study, not quoted. Not read for this page."),
]
