"""The lists behind the A new creation mock-up. build-data.py checks every phrase here against its verse, as whole words."""

QUOTED_CONFESSION = {
    "a work of God's grace whereby believers become new creatures in Christ Jesus",
    "believers",
    "become new creatures",
    "Growth in grace should continue throughout the regenerate person's life",
    "All true believers endure to the end",
    "will never fall away from the state of grace",
    "Believers may fall into sin through neglect and temptation",
    "grieve the Spirit",
    "an act of obedience",
    "the believer's death to sin, the burial of the old life, and the resurrection to walk in newness of life",
    "There is no salvation apart from personal faith in Jesus Christ as Lord",
}

READING_ORDER = ["in-christ", "old-and-new", "words", "forgiveness", "desires", "love"]

# A fold: what the letter says is already so, the letter's own joining word (None if it has none), and what it then tells you to do.
# (verse, words). `who` says whose act or state the first half is, because it is not always God's.
READING_FOLDS = [
    {"id": "in-christ", "done": ("2 Corinthians 5:18", "who reconciled us to Himself"), "join": ("2 Corinthians 5:20", "Therefore"), "now": ("2 Corinthians 5:20", "Be reconciled to God"), "who": "God's act", "span": "2 Corinthians 5:18–20"},
    {"id": "old-and-new", "done": ("Colossians 3:10", "have put on the new self"), "join": ("Colossians 3:12", "Therefore"), "now": ("Colossians 3:14", "put on love"), "who": "Already done by the readers", "span": "Colossians 3:9–14"},
    {"id": "words", "done": ("Ephesians 4:25", "we are all members of one another"), "join": ("Ephesians 4:25", "for"), "now": ("Ephesians 4:25", "speak truthfully to his neighbor"), "who": "True of them", "span": "Ephesians 4:25"},
    {"id": "forgiveness", "done": ("Ephesians 4:32", "in Christ God forgave you"), "join": ("Ephesians 4:32", "just as"), "now": ("Ephesians 4:32", "forgiving each other"), "who": "God's act", "span": "Ephesians 4:32"},
    {"id": "desires", "done": ("Galatians 5:25", "we live by the Spirit"), "join": ("Galatians 5:25", "Since"), "now": ("Galatians 5:25", "let us walk in step with the Spirit"), "who": "True of them", "span": "Galatians 5:25"},
    {"id": "love", "done": ("Ephesians 5:2", "Christ loved us and gave Himself up for us"), "join": ("Ephesians 5:2", "just as"), "now": ("Ephesians 5:2", "walk in love"), "who": "Christ's act", "span": "Ephesians 5:2"},
]

MORE_FOLDS = [
    {"id": "died", "done": ("Romans 6:2", "we who died to sin"), "join": ("Romans 6:11", "So"), "now": ("Romans 6:11", "count yourselves dead to sin"), "who": "True of them, with Christ", "span": "Romans 6:2–11"},
    {"id": "put-to-death", "done": ("Colossians 3:3", "you died"), "join": ("Colossians 3:5", "therefore"), "now": ("Colossians 3:5", "Put to death"), "who": "True of them", "span": "Colossians 3:3–5"},
    {"id": "raised", "done": ("Colossians 3:1", "you have been raised with Christ"), "join": ("Colossians 3:1", "since"), "now": ("Colossians 3:1", "strive for the things above"), "who": "Done to them", "span": "Colossians 3:1"},
    {"id": "received", "done": ("Colossians 2:6", "you have received Christ Jesus as Lord"), "join": ("Colossians 2:6", "just as"), "now": ("Colossians 2:6", "continue to walk in Him"), "who": "Already done by the readers", "span": "Colossians 2:6"},
    {"id": "light", "done": ("Ephesians 5:8", "now you are light in the Lord"), "join": None, "now": ("Ephesians 5:8", "Walk as children of light"), "who": "True of them", "span": "Ephesians 5:8"},
    {"id": "free", "done": ("Galatians 5:1", "Christ has set us free"), "join": ("Galatians 5:1", "then"), "now": ("Galatians 5:1", "Stand firm"), "who": "Christ's act", "span": "Galatians 5:1"},
    {"id": "leaven", "done": ("1 Corinthians 5:7", "you really are"), "join": ("1 Corinthians 5:7", "as"), "now": ("1 Corinthians 5:7", "Get rid of the old leaven"), "who": "True of them", "span": "1 Corinthians 5:7"},
    {"id": "works", "done": ("Philippians 2:13", "it is God who works in you"), "join": ("Philippians 2:13", "For"), "now": ("Philippians 2:12", "continue to work out your salvation"), "who": "God's act", "span": "Philippians 2:12–13"},
]

# Five letters as lines. `turn` is this study's reading of where the letter turns; James has none.
LETTERS = [
    {"name": "Romans", "code": "ROM", "turn": ("Romans 12:1", "Therefore I urge you"), "marks": [("Romans 6:11", "count yourselves dead to sin"), ("Romans 11:20", "Do not be arrogant")], "note": None},
    {"name": "Galatians", "code": "GAL", "turn": ("Galatians 5:1", "Stand firm, then"), "marks": [("Galatians 4:12", "become like me")], "note": "The mark could also go a little later, at the call to serve in Galatians 5:13."},
    {"name": "Ephesians", "code": "EPH", "turn": ("Ephesians 4:1", "I urge you to walk in a manner worthy"), "marks": [("Ephesians 2:11", "Therefore remember")], "note": None},
    {"name": "Colossians", "code": "COL", "turn": ("Colossians 3:1", "Therefore, since you have been raised with Christ"), "marks": [("Colossians 2:6", "continue to walk in Him"), ("Colossians 2:8", "See to it"), ("Colossians 2:16", "let no one judge you")], "note": None},
    {"name": "James", "code": "JAS", "turn": None, "marks": [("James 1:2", "Consider it pure joy"), ("James 1:18", "He chose to give us birth"), ("James 1:19", "Everyone should be quick to listen")], "note": "No turn is marked. Its first command is in its second verse."},
]

# Reading 01. Verses that say Behold about something new from God. The build counts every verse in the Berean with both words and compares it with BEHOLD_NEW_COUNT.
BEHOLDS = [
    {"ref": "Isaiah 43:19", "words": "Behold, I am about to do something new", "tense": "About to"},
    {"ref": "Isaiah 65:17", "words": "I will create new heavens and a new earth", "tense": "Will"},
    {"ref": "2 Corinthians 5:17", "words": "Behold, the new has come!", "tense": "Has come"},
    {"ref": "Revelation 21:5", "words": "Behold, I make all things new", "tense": "I make"},
]
BEHOLD_NEW_COUNT = 10

# Reading 02. Colossians 3's own lists, in its order.
RAILS = {
    "off": [("Colossians 3:5", ["sexual immorality", "impurity", "lust", "evil desires", "greed"]), ("Colossians 3:8", ["anger", "rage", "malice", "slander", "filthy language"]), ("Colossians 3:9", ["Do not lie"])],
    "on": [("Colossians 3:12", ["hearts of compassion", "kindness", "humility", "gentleness", "patience"]), ("Colossians 3:13", ["Bear with one another", "forgive"])],
    "over": ("Colossians 3:14", "over all these virtues put on love"),
}

# Reading 03. The four lines in Ephesians 4 that have all three parts: stop, instead, and the reason.
FOUR_LINES = [
    {"ref": "Ephesians 4:25", "stop": "put off falsehood", "instead": "speak truthfully to his neighbor", "because": "we are all members of one another"},
    {"ref": "Ephesians 4:28", "stop": "must steal no longer", "instead": "doing good with his own hands", "because": "that he may have something to share with the one in need"},
    {"ref": "Ephesians 4:29", "stop": "Let no unwholesome talk come out of your mouths", "instead": "only what is helpful for building up the one in need", "because": "bringing grace to those who listen"},
    {"ref": "Ephesians 4:31–32", "stop": "Get rid of all bitterness, rage and anger", "instead": "Be kind and tenderhearted to one another", "because": "just as in Christ God forgave you"},
]

# Section 04. A command, and what its own context says is already so.
LOOK_BACK = [
    {"id": "bought", "command": ("1 Corinthians 6:18", "Flee from sexual immorality"), "done": ("1 Corinthians 6:20", "you were bought at a price"), "span": "1 Corinthians 6:18–20",
     "said": "Two verses on, in the same argument. And the next word is Paul's own: Therefore glorify God with your body."},
    {"id": "loved", "command": ("1 John 4:11", "we also ought to love one another"), "done": ("1 John 4:11", "God so loved us"), "span": "1 John 4:10–11",
     "said": "The same verse. The if here is not a doubt, because verse 10 has just said it happened."},
    {"id": "saved", "command": ("Titus 3:2", "to malign no one"), "done": ("Titus 3:5", "He saved us"), "span": "Titus 3:1–5",
     "said": "Three verses on. In between, Titus is reminded that we too were once as those he is to be gentle with."},
]

SOURCES = [
    {"id": "bsb", "short": "Berean", "name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened. Public domain."},
    {"id": "bfm", "short": "Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, Articles 4, 5 and 7", "href": "https://bfm.sbc.net/bfm2000/", "note": "Short phrases, with a link. Compared on 2026-10-30 through a web tool that returns extracts. Those not in this site's doctrinal foundation file are not checked by script."},
    {"id": "lbc", "short": "Second London Confession", "name": "Second London Baptist Confession (1677), chapter 13 paragraph 2 and chapter 29 paragraph 1", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "Short quotations. Read: those paragraphs, in the site's creeds collection."},
    {"id": "boyce", "short": "Boyce", "name": "James P. Boyce, Abstract of Systematic Theology, the passage on progressive sanctification", "href": "https://www.ccel.org/ccel/boyce/theology.html", "note": "Short quotations. Read: that passage only. Public domain."},
    {"id": "calvin-2co", "short": "Calvin", "name": "John Calvin, Commentary on Corinthians, volume 2, on 2 Corinthians 5:17", "href": "https://www.ccel.org/ccel/calvin/calcom40.html", "note": "Short quotations. Read: that comment and the next. Public domain. Reformed, not Baptist."},
    {"id": "calvin-rom", "short": "Calvin", "name": "John Calvin, Commentary on Romans, on Romans 7:14–15 and 12:1", "href": "https://www.ccel.org/ccel/calvin/calcom38.html", "note": "Short quotations. Read: those comments only. Public domain."},
    {"id": "calvin-gal", "short": "Calvin", "name": "John Calvin, Commentary on Galatians and Ephesians, on Galatians 5:21", "href": "https://www.ccel.org/ccel/calvin/calcom41.html", "note": "One short quotation. Read: that comment only. Public domain."},
    {"id": "calvin-eph", "short": "Calvin", "name": "John Calvin, the same volume, on Ephesians 4:26", "href": "https://www.ccel.org/ccel/calvin/calcom41.html", "note": "Short quotations. Read: that comment only. Public domain."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory, on 2 Corinthians 5:17 and Ephesians 4:26", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Short quotations. Read: those notes only. Public domain."},
    {"id": "wesley", "short": "Wesley", "name": "John Wesley, Explanatory Notes upon the New Testament, on Romans 7:14", "href": "https://www.ccel.org/ccel/wesley/notes.html", "note": "One short quotation. Read: that note only. Public domain. Methodist, not Baptist."},
    {"id": "methodist", "short": "Methodist Articles", "name": "Methodist Articles of Religion (1784), article 12", "href": "/study/creeds/methodist-articles-of-religion-1784", "note": "One short quotation, shown as their teaching. Read: that article, in the site's creeds collection."},
    {"id": "luther", "short": "Luther's Small Catechism", "name": "Luther's Small Catechism (1529), on baptism", "href": "/study/creeds/luthers-small-catechism-1529", "note": "One short quotation, shown as their teaching. Read: that part, in the site's creeds collection."},
]
