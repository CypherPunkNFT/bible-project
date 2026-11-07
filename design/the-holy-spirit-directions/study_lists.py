"""The lists The Holy Spirit page draws beside the study's own text. build-data.py checks every phrase here against the
Berean, as whole words in exact case, so a drawing cannot claim words its verse does not hold. These are this page's
choices, not a count of every verse that could serve."""

TRAIL = [("Study", "/study"), ("God & Christian Faith", "/study/theology?area=doctrine")]
TITLE = ("The Holy", "Spirit")  # ink, then the turn in gold italic
CLOSE_TITLE = ("Following", "the light")
BACK = ("/study/theology?area=doctrine", "Back to God & Christian Faith")

# The four concepts in the heading, each a direction the Spirit moves in these readings. Every part carries one.
CONCEPT_OF_PART = {"01": "Promised", "02": "Poured out", "03": "Living within", "04": "Living within",
                   "05": "Given for others", "06": "Given for others"}

# Where the Spirit points: the three places the study names ("to Jesus, to new life ... and outward to other people").
TARGETS = [
    {"id": "jesus", "name": "Jesus", "words": "to Jesus"},
    {"id": "life", "name": "New life", "words": "to new life in a person who was dead toward God"},
    {"id": "others", "name": "Other people", "words": "outward to other people"},
]

# One beam per part: the close's own sentence, a phrase from the part's reading that shows the direction, and where
# it lands. The section is the Bible section the verse belongs to, for its colour.
BEAMS = [
    {"part": "01", "target": "jesus", "ref": "John 16:14", "words": "He will glorify Me", "section": "gospels",
     "close": "In John He points to Jesus and His words."},
    {"part": "02", "target": "jesus", "ref": "Acts 2:11", "words": "declaring the wonders of God", "section": "acts",
     "close": "At Pentecost He points the nations to the wonders of God.",
     "why": "and Peter's explanation leads to Jesus."},
    {"part": "03", "target": "life", "ref": "Ezekiel 36:26", "words": "I will give you a new heart", "section": "prophets",
     "close": "In Ezekiel and John 3 He points to a new heart no one can give themselves."},
    {"part": "04", "target": "life", "ref": "Romans 8:15", "words": "by whom we cry", "section": "epistles",
     "close": "In Romans He points a frightened person to a Father."},
    {"part": "05", "target": "others", "ref": "Galatians 5:22", "words": "love, joy, peace, patience, kindness", "section": "epistles",
     "close": "In Galatians He points to the person you find hard to love."},
    {"part": "06", "target": "others", "ref": "1 Corinthians 12:7", "words": "for the common good", "section": "epistles",
     "close": "In Corinth and Rome He points to the common good."},
]

# What each part's reading says the Spirit does, or how He is given. "verb" marks the things only a person does;
# those are gathered again in the first question ("a person, or a power?").
DOES = [
    {"part": "01", "ref": "John 14:17", "words": "He abides with you", "verb": "abides"},
    {"part": "01", "ref": "John 14:26", "words": "will teach you all things", "verb": "teaches"},
    {"part": "01", "ref": "John 14:26", "words": "will remind you of everything I have told you", "verb": "reminds"},
    {"part": "01", "ref": "John 16:8", "words": "He will convict the world", "verb": "convicts"},
    {"part": "01", "ref": "John 16:13", "words": "He will guide you into all truth", "verb": "guides"},
    {"part": "01", "ref": "John 16:13", "words": "He will speak what He hears", "verb": "speaks and hears"},
    {"part": "01", "ref": "John 16:14", "words": "disclosing it to you", "verb": "discloses"},
    {"part": "02", "ref": "Acts 2:4", "words": "as the Spirit enabled them", "verb": "enables"},
    {"part": "02", "ref": "Acts 2:17", "words": "I will pour out My Spirit on all people"},
    {"part": "03", "ref": "Ezekiel 36:27", "words": "I will put My Spirit within you"},
    {"part": "03", "ref": "John 3:8", "words": "everyone born of the Spirit"},
    {"part": "04", "ref": "Romans 8:2", "words": "the law of the Spirit of life set you free"},
    {"part": "04", "ref": "Romans 8:11", "words": "will also give life to your mortal bodies through His Spirit"},
    {"part": "04", "ref": "Romans 8:16", "words": "The Spirit Himself testifies with our spirit", "verb": "testifies"},
    {"part": "05", "ref": "Galatians 5:16", "words": "walk by the Spirit"},
    {"part": "05", "ref": "Galatians 5:25", "words": "let us walk in step with the Spirit"},
    {"part": "06", "ref": "1 Corinthians 12:7", "words": "the manifestation of the Spirit is given for the common good"},
    {"part": "06", "ref": "1 Corinthians 12:11", "words": "who apportions them to each one as He determines", "verb": "apportions and determines"},
]

# Father, Son and Spirit named together, or a passage's own order, drawn as a short strip of phrases.
STRIPS = {
    "01": {"kind": "together", "title": "Named together at a supper table",
           "steps": [("The Son asks", "John 14:16", "I will ask the Father"),
                     ("The Father gives", "John 14:16", "He will give you another Advocate"),
                     ("The Spirit comes", "John 14:17", "He abides with you and will be in you"),
                     ("Father and Son at home", "John 14:23", "make Our home with him")]},
    "03": {"kind": "order", "title": "Which comes first",
           "steps": [("The gift", "Ezekiel 36:27", "I will put My Spirit within you"),
                     ("Then the walking", "Ezekiel 36:27", "cause you to walk in My statutes")],
           "note": "The obedience comes from the gift."},
    "04": {"kind": "together", "title": "Two names in one verse",
           "steps": [("Of the Father", "Romans 8:9", "the Spirit of God"), ("Of the Son", "Romans 8:9", "the Spirit of Christ")],
           "note": "One Spirit, belonging to Father and Son."},
    "06": {"kind": "together", "title": "Named together over the gifts",
           "steps": [("Gifts", "1 Corinthians 12:4", "the same Spirit"), ("Ministries", "1 Corinthians 12:5", "the same Lord"),
                     ("Ways of working", "1 Corinthians 12:6", "the same God")]},
}

# Acts 2:9-11: the peoples and places the crowd names, in Luke's order.
NATIONS = {"ref": "Acts 2:9–11", "words": ["Parthians", "Medes", "Elamites", "Mesopotamia", "Judea", "Cappadocia", "Pontus",
                                            "Asia", "Phrygia", "Pamphylia", "Egypt", "Libya", "Rome", "Cretans", "Arabs"],
           "heard": ("Acts 2:11", "declaring the wonders of God in our own tongues")}

# Galatians 5: the flesh's acts and the Spirit's fruit, word for word. "middle" is the run the study itself quotes;
# "named" are the four the study says stand out in a quarrelling church.
FLESH = {"ref": "Galatians 5:19–21", "words": ["sexual immorality", "impurity", "debauchery", "idolatry", "sorcery", "hatred",
                                              "discord", "jealousy", "rage", "rivalries", "divisions", "factions", "envy",
                                              "drunkenness", "orgies"],
         "middle": ("Galatians 5:20–21", "hatred, discord, jealousy, and rage; rivalries, divisions, factions, and envy")}
FRUIT = {"ref": "Galatians 5:22–23", "words": ["love", "joy", "peace", "patience", "kindness", "goodness", "faithfulness",
                                              "gentleness", "self-control"],
         "named": ["patience", "kindness", "gentleness", "self-control"], "singular": ("Galatians 5:22", "the fruit of the Spirit is")}

# The two lists of gifts read in part 06, each in its letter's order. The build computes which are on both.
GIFTS = [
    {"ref": "1 Corinthians 12:8–10", "name": "1 Corinthians 12",
     "words": ["message of wisdom", "message of knowledge", "faith", "gifts of healing", "working of miracles", "prophecy",
               "distinguishing between spirits", "speaking in various tongues", "interpretation of tongues"]},
    {"ref": "Romans 12:6–8", "name": "Romans 12",
     "words": ["prophecy", "serving", "teaching", "encouraging", "giving", "leading", "showing mercy"]},
]

# The study says "These eight passages"; the build counts the main readings of parts 01 to 06 and must find eight.
READINGS_CLAIMED = 8

# Bare words a part's figure would otherwise leave as a paraphrase of the text, quoted from the text itself.
CLOSE_PASSAGE = "John 16:7–15"

# Studies the text names in italics. A study whose mock-up folder has an index.html links to it; the rest are named
# only. Folders being designed in this same run are left unlinked, so this build never depends on a job in progress.
STUDY_LINKS = {
    "What the Bible says about itself": None,
    "Genesis 1–11: the questions readers bring": "creation-to-babel-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "The church and its calling": "the-church-and-its-calling-directions",
    "Encounters with Jesus": "encounters-with-jesus-directions",
    "Baptism and the Lord's Supper: the two things Jesus told His church to do": None,
    "A new creation: what changes when you believe": "a-new-creation-directions",
    "Covenants and promises": "covenants-and-promises-directions",
    "The cross, the empty tomb and the throne": "what-the-cross-accomplishes-directions",
    "The hope to come": "the-hope-to-come-directions",
    "Chosen and kept: can I be sure?": None,
    "Life together: belonging to a church": None,
    "What Scripture promises the sick": "illness-and-healing-directions",
    "Fear, anxiety and despair": None,
}
# Book titles in italics: named as books, never linked.
BOOK_TITLES = {"Keep in Step with the Spirit", "Spiritual Gifts: What They Are and Why They Matter"}

# Quoted words that are not Scripture and are held on this PC: each is found by script within 1,500 characters after
# its marker in the held copy of the Baptist Faith and Message 2000.
BFM = "content/questions/sources/normalized/baptist-know-the-truth-catechism.json"
HELD_QUOTES = {
    "the Spirit of God, fully divine": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit"},
    "inspired holy men of old to write the Scriptures": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit"},
    "effects regeneration": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit"},
    "bestows the spiritual gifts by which they serve God through His church": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit"},
    "At the moment of regeneration He baptizes every believer into the Body of Christ.": {"source": "Baptist Faith and Message 2000, article II C", "path": BFM, "marker": "C. God the Holy Spirit"},
    "will never fall away from the state of grace": {"source": "Baptist Faith and Message 2000, article V", "path": BFM, "marker": "V. God's Purpose of Grace"},
    "an act of obedience symbolizing the believer's faith": {"source": "Baptist Faith and Message 2000, article VII", "path": BFM, "marker": "VII. Baptism and the Lord's Supper"},
    "There is no salvation apart from personal faith in Jesus Christ as Lord.": {"source": "Baptist Faith and Message 2000, article IV", "path": BFM, "marker": "IV. Salvation"},
}
# Quoted words that are not Scripture and are not held on this PC. The study marks each one to be checked; the page
# shows that mark, and the README says these were compared by no script.
NOT_HELD_QUOTES = {
    "the season of the giving of our Torah": "Jewish festival prayer for Shavuot",
    "active force": "a Watch Tower publication (Jehovah's Witnesses)",
    "distinct from and subsequent to the experience of the new birth": "Assemblies of God, Statement of Fundamental Truths, section 7",
    "the initial physical sign of speaking with other tongues": "Assemblies of God, Statement of Fundamental Truths, section 8",
}
# Words in quotation marks that are the study's own, not quotations from anywhere.
OWN_TERMS = {"Obey, and then I will give you My Spirit.", "word", "fiftieth", "Word of Faith"}
# Scripture quoted in under three words: too short to trust a search of a whole paragraph, so pinned to its verse.
PINNED_SHORT = {"all people": "Acts 2:17"}

# Three quotations in the study that are not word for word the Berean. The text may only be changed by its editor, so
# the page marks each with the Berean's own words. The build fails as soon as the study is corrected, so this list
# cannot outlive the fault.
MISQUOTED = {
    "bite and devour": {"ref": "Galatians 5:15", "berean": "biting and devouring"},
    "the teacher of Israel": {"ref": "John 3:10", "berean": "You are Israel's teacher"},
    "your daughters will prophesy": {"ref": "Acts 2:17", "berean": "Your sons and daughters will prophesy"},
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles II, IV, V and VII, quoted in short phrases and found by script in the copy held in the site's question sources. The site's doctrinal standard."),
    ("J. I. Packer, Keep in Step with the Spirit (1984)", "The floodlight picture, given in the study's own words, not quoted. Its wording and page are still to be checked."),
    ("Assemblies of God, Statement of Fundamental Truths", "Sections 7 and 8, two short phrases, shown as Classical Pentecostal teaching, not this site's. Not held on this PC; still to be checked."),
    ("Watch Tower publications", "Two words, shown as the teaching of Jehovah's Witnesses, not this site's. Not held on this PC; still to be checked."),
    ("Thomas Schreiner; an Orthodox Presbyterian Church report; John Piper; the International Mission Board", "Named for the views on the miraculous gifts, not quoted. Each is still to be checked."),
]
