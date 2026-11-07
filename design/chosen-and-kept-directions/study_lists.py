"""The lists the Chosen and kept page draws beside the study's own text. build-data.py checks every phrase here against
the Berean, as whole words in exact case, and every sentence said to be the study's against content.md, so a figure
cannot claim words its verse or its study does not hold. These are this page's choices, not a count of every verse that
could serve."""

TRAIL = [("Study", "/study"), ("God & Christian Faith", "/study/theology?area=doctrine")]
TITLE = ("Chosen and kept:", "can I be sure?")  # ink, then the turn in gold italic
CLOSE_TITLE = ("Held, and", "knowing it")
BACK = ("/study/theology?area=doctrine", "Back to God & Christian Faith")

# The study's one habit: ask what a passage was written to do. Its frame names four purposes, each with a sentence, and
# warns against three misreadings. "says" and "misread" must be the study's own words.
PURPOSES = [
    {"id": "praise", "name": "Praise", "says": "Paul sings about being chosen before he explains anything.",
     "misread": "A song is not a sorting machine."},
    {"id": "comfort", "name": "Comfort", "says": "Jesus speaks about His sheep to people who need to know they are safe.",
     "misread": "A promise is not a riddle."},
    {"id": "warn", "name": "Warning", "says": "Hebrews shakes readers who are drifting.",
     "misread": "A warning is not a verdict."},
    {"id": "answer", "name": "Answer", "says": "Paul argues with a voice that says God is unfair.", "misread": None},
]

# What each part's passage was written to do, with the close's own sentence for it. Mark 3 both warns and promises,
# as the close says, so it carries two purposes, the first being the one it leads with.
PURPOSE_OF_PART = {
    "01": (["praise"], "Ephesians 1 was written to make you praise."),
    "02": (["comfort"], "Romans 8 was written so that you would know nothing can separate you from God's love."),
    "03": (["answer"], "Romans 9 answers the charge that God is unfair, and it humbles everyone who reads it."),
    "04": (["comfort"], "John 6 and 10 were spoken so that sheep would know they are safe."),
    "05": (["warn"], "Hebrews 6 warns drifters so that they stay."),
    "06": (["comfort"], 'First John was written "so that you may know".'),
    "07": (["warn", "comfort"], "Mark 3 shows that the One who warns of a single unforgiven sin also promises forgiveness for all the rest."),
}

# 01. Ephesians 1:3-14: one sentence in three movements, as the study's own sentence names them. The verse ranges are
# this page's division (the passage notes give it); the refrain is shown in each verse's own words.
STANZAS = [("The Father chooses", "Ephesians 1:3–6"), ("The Son redeems", "Ephesians 1:7–12"),
           ("The Spirit seals and guarantees", "Ephesians 1:13–14")]
STANZA_SENTENCE = "The Father chooses, the Son redeems, and the Spirit seals and guarantees."
REFRAIN = [("Ephesians 1:6", "to the praise of His glorious grace"), ("Ephesians 1:12", "for the praise of His glory"),
           ("Ephesians 1:14", "to the praise of His glory")]
IN_HIM = r"\b[Ii]n (?:Christ|Him|the Beloved One)\b"  # the build finds every one in Ephesians 1:3-14

# 02. Romans 8:29-30, the five links; the study names them in this order. Then everything Paul says cannot separate.
CHAIN_SENTENCE = "foreknew, predestined, called, justified, glorified"
CHAIN = [("foreknew", "Romans 8:29", "those God foreknew"), ("predestined", "Romans 8:29", "He also predestined"),
         ("called", "Romans 8:30", "He also called"), ("justified", "Romans 8:30", "He also justified"),
         ("glorified", "Romans 8:30", "He also glorified")]
DANGERS = [("Romans 8:35", ["trouble", "distress", "persecution", "famine", "nakedness", "danger", "sword"]),
           ("Romans 8:38–39", ["death", "life", "angels", "principalities", "the present", "the future", "any powers",
                               "height", "depth", "anything else in all creation"])]
LOVE = ("Romans 8:39", "the love of God that is in Christ Jesus our Lord")

# 03. Romans 9: the three questions Paul answers. The first is put in the study's words; the others are the verse's.
OBJECTIONS = [
    {"ask": "has God's promise to Israel failed?", "ask_ref": None,
     "answer": ("Romans 9:6", "not all who are descended from Israel are Israel")},
    {"ask": "Is God unjust?", "ask_ref": "Romans 9:14", "answer": ("Romans 9:15", "I will have mercy on whom I have mercy")},
    {"ask": "Then why does God still find fault?", "ask_ref": "Romans 9:19",
     "answer": ("Romans 9:21", "Does not the potter have the right")},
]
READINGS_HEAD = "Two Baptist readings"  # the sub-head whose two named readings are set side by side

# 04. John 6:37 in its two halves, as the study reads it; John 10:28-29, a hand inside a hand.
HALVES = [("From God's side", "John 6:37", "Everyone the Father gives Me will come to Me"),
          ("From yours", "John 6:37", "the one who comes to Me I will never drive away")]
HALVES_SENTENCE = ("The first looks from God's side", "The second looks from yours")
HANDS = [("The Son's hand", "John 10:28", "No one can snatch them out of My hand"),
         ("The Father's hand", "John 10:29", "No one can snatch them out of My Father's hand")]
HANDS_SENTENCE = "The believer is held in the Son's hand, and that hand is inside the Father's hand."
HELD = ("John 10:28", "they will never perish")

# 05. Hebrews 6:7-9: one rain, two fields, then the turn.
RAIN = ("Hebrews 6:7", "the rain often falling on it")
FIELDS = [{"name": "Crop", "ref": "Hebrews 6:7", "grows": "produces a crop useful", "end": "receives the blessing of God"},
          {"name": "Thorns", "ref": "Hebrews 6:8", "grows": "produces thorns and thistles", "end": "its curse is imminent"}]
TURN = ("Hebrews 6:9", "we are convinced of better things in your case")
OTHER_TRADITION = "Wesleyan and Arminian"  # the numbered reading in part 05 shown as another tradition's, in its words

# 06. 1 John 5: what assurance rests on, and what confirms it, under the study's own two bold headings.
GROUND = [
    {"head": "Assurance rests first on what God has said.", "lines": [("1 John 5:11", "God has given us eternal life, and this life is in His Son")]},
    {"head": "The Spirit and a changed life confirm it.", "lines": [
        ("1 John 5:6", "it is the Spirit who testifies"), ("1 John 5:10", "has this testimony within him"),
        ("1 John 5:1", "everyone who loves the Father also loves those born of Him"), ("1 John 5:2", "keep His commandments")]},
]
GROUND_NOTE = "They are not the price of it."
PURPOSE_LINE = ("1 John 5:13", "so that you may know that you have eternal life")

# 07. Mark 3:28-30 in its own order, and the two the study names who were restored.
FIRST = [("All", "Mark 3:28", "will be forgiven all sins and blasphemies, as many as they utter"),
         ("One", "Mark 3:29", "whoever blasphemes against the Holy Spirit will never be forgiven"),
         ("Why", "Mark 3:30", "because they were saying")]
RESTORED = [("Peter", "John 21:15", "Feed My lambs"), ("Paul", "1 Timothy 1:13", "I was shown mercy")]

# The close: the fears the study names, each in its own words where it names them, and the promise that part sends
# the reader to. "says" must be in content.md; "promise" must be in its verse.
FEARS = [
    {"part": "01", "says": "If you are worried that you may not be chosen", "promise": ("Ephesians 1:13", "having heard and believed the word of truth")},
    {"part": "02", "says": "What are you afraid could separate you from God?", "promise": ("Romans 8:39", "nor anything else in all creation, will be able to separate us from the love of God")},
    {"part": "05", "says": "If you fear you have fallen away and you want to come back", "promise": ("John 6:37", "the one who comes to Me I will never drive away")},
    {"part": "06", "says": "When you doubt, where do you look first", "promise": ("1 John 5:13", "so that you may know that you have eternal life")},
    {"part": "07", "says": "If this question is keeping you awake", "promise": ("John 6:37", "the one who comes to Me I will never drive away")},
]

READINGS_CLAIMED = 8  # "The study walks eight passages"
CLOSE_PASSAGE = "John 10:27–30"

# Studies the text names in italics. A study whose mock-up folder has an index.html links to it; the rest are named
# only. Folders being designed in this same run are left unlinked, so this build never depends on a job in progress.
STUDY_LINKS = {
    "The Holy Spirit": "the-holy-spirit-directions",
    "The hope to come": "the-hope-to-come-directions",
    "Who do you say that I am?": "who-do-you-say-that-i-am-directions",
    "A new creation": "a-new-creation-directions",
    "The good news": "the-good-news-directions",
    "Saved by grace": "grace-faith-and-salvation-directions",
    "A new creation: what changes when you believe": "a-new-creation-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "Saved by grace: how God forgives and changes us": "grace-faith-and-salvation-directions",
    "Who do you say that I am? Who Jesus really is": "who-do-you-say-that-i-am-directions",
    "Fear, anxiety and despair": None,
    "Life together: belonging to a church": "life-together-directions",
}
BOOK_TITLES = {"Whosoever Will", "Salvation and Sovereignty", "The Race Set Before Us", "Grace, Faith, Free Will"}

# Quoted words that are not Scripture and are held on this PC: each is found by script within 1,500 characters after
# its marker in the held copy of the Baptist Faith and Message 2000.
BFM = "content/questions/sources/normalized/baptist-know-the-truth-catechism.json"
_V = {"source": "Baptist Faith and Message 2000, article V", "path": BFM, "marker": "V. God's Purpose of Grace"}
HELD_QUOTES = {
    "the gracious purpose of God, according to which He regenerates, justifies, sanctifies, and glorifies sinners": _V,
    "is consistent with the free agency of man": _V,
    "excludes boasting and promotes humility": _V,
    "comprehends all the means in connection with the end": _V,
    "All true believers endure to the end. Those whom God has accepted in Christ, and sanctified by His Spirit, will never fall away from the state of grace, but shall persevere to the end.": _V,
    "may fall into sin through neglect and temptation": _V,
    "yet they shall be kept by the power of God through faith unto salvation": _V,
    "impair their graces and comforts": _V,
    "There is no salvation apart from personal faith in Jesus Christ as Lord.": {"source": "Baptist Faith and Message 2000, article IV", "path": BFM, "marker": "IV. Salvation"},
}
# Quoted words that are not Scripture and are not held on this PC. The study marks each one to be checked.
NOT_HELD_QUOTES = {
    "Election is God's eternal choice of some persons unto everlasting life—not because of foreseen merit in them, but of His mere mercy in Christ": "Abstract of Principles (1858), article V",
    "A Statement of the Traditional Southern Baptist Understanding of God's Plan of Salvation": "title of the 2012 statement",
    "Truth, Trust, and Testimony in a Time of Tension": "title of the 2013 report",
    "can neither totally nor finally fall from the state of grace": "Second London Baptist Confession (1677/1689), chapter 17",
    "Not every sin willingly committed after justification is the sin against the Holy Ghost, and unpardonable. … After we have received the Holy Ghost, we may depart from grace given, and fall into sin, and, by the grace of God, rise again and amend our lives": "Methodist Articles of Religion, article 12",
    "rise again": "Methodist Articles of Religion, article 12",
}
# Words in quotation marks that are the study's own, not quotations from anywhere.
OWN_TERMS = {"know", "chose the one and not the other", "traditional", "Once saved, always saved", "How much do I feel?",
             "Do I have the Son?"}
# Scripture quoted in under three words: too short to trust a search of a whole paragraph, so pinned to its verse.
# The first letter may differ in case, as when a quotation starts a sentence.
PINNED_SHORT = {"in Him": "Ephesians 1:4", "in love": "Ephesians 1:4", "freely given": "Ephesians 1:6", "sealed": "Ephesians 1:13",
                "good": "Romans 8:28", "hated": "Romans 9:13", "two nations": "Genesis 25:23", "what if": "Romans 9:22",
                "great patience": "Romans 9:22", "Never perish": "John 10:28", "listen": "John 10:27", "follow": "John 10:27",
                "Water and blood": "1 John 5:6", "foreknew": "Romans 8:29", "believes": "1 John 5:10", "so that you may know": "1 John 5:13"}

# Quotations in the study that are not word for word the Berean. The text may only be changed by its editor, so the
# page marks each with the Berean's own words. The build fails as soon as the study is corrected.
MISQUOTED = {
    "great sorrow and unceasing anguish": {"ref": "Romans 9:2", "berean": "deep sorrow and unceasing anguish"},
    "I … will draw all men to Myself": {"ref": "John 12:32", "berean": "I, when I am lifted up from the earth, will draw everyone to Myself"},
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles IV and V, quoted in short phrases and found by script in the copy held in the site's question sources. The site's doctrinal standard."),
    ("The Abstract of Principles (1858); the Second London Baptist Confession (1677/1689)", "One sentence from each, quoted as Baptist witnesses. Not held on this PC; still to be checked."),
    ("The Methodist Articles of Religion, article 12", "Quoted as the Wesleyan view, in its own words, not this site's. Not held on this PC; still to be checked."),
    ("Named holders of each reading", "Mohler, Schreiner, Ascol, Hankins, Allen and Lemke, Keathley, Hobbs, Calvin, Owen, Schreiner and Caneday, Picirilli, Augustine: named for their views, not quoted. Each is still to be checked."),
]
