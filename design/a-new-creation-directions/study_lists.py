"""The lists behind the A new creation mock-up. build-data.py checks every phrase here against its verse, as whole words,
and fails if an entry is never used."""

# The address of each part (?reading=…), in the text's order. The first two keep the earlier mock-up's addresses.
PART_SLUGS = ["in-christ", "dead-to-sin", "off-and-on", "truth-and-love", "growing-up", "pressing-on"]

# One line across the fold for each part: what the letter says is already so, the letter's own joining word (None if it
# has none) and what it then says to do or to live. (verse, words). `who` says whose act or state the first half is,
# because it is not always God's. Which place each part turns on is this study's reading, not the text's.
PART_FOLDS = [
    {"done": ("2 Corinthians 5:15", "He died for all"), "join": ("2 Corinthians 5:15", "that"), "now": ("2 Corinthians 5:15", "those who live should no longer live for themselves"), "who": "Christ’s act", "span": "2 Corinthians 5:14–15"},
    {"done": ("Romans 6:10", "He died to sin once for all"), "join": ("Romans 6:11", "So"), "now": ("Romans 6:11", "count yourselves dead to sin"), "who": "Christ’s act, and theirs with Him", "span": "Romans 6:10–11"},
    {"done": ("Colossians 3:9", "you have taken off the old self"), "join": ("Colossians 3:9", "since"), "now": ("Colossians 3:9", "Do not lie to one another"), "who": "Already done by the readers", "span": "Colossians 3:9–10"},
    {"done": ("Ephesians 4:32", "in Christ God forgave you"), "join": ("Ephesians 4:32", "just as"), "now": ("Ephesians 4:32", "forgiving each other"), "who": "God’s act", "span": "Ephesians 4:32"},
    {"done": ("2 Peter 1:3", "His divine power has given us everything we need"), "join": ("2 Peter 1:5", "For this very reason"), "now": ("2 Peter 1:5", "make every effort"), "who": "God’s gift", "span": "2 Peter 1:3–5"},
    {"done": ("Philippians 3:12", "Christ Jesus took hold of me"), "join": None, "now": ("Philippians 3:12", "I press on"), "who": "Christ’s act", "span": "Philippians 3:12"},
]

# The six places the text's FoldReads names, in its order. The build reads FoldReads and fails unless each joining verse
# it names is the joining verse here, in the same order.
TEXT_FOLDS = [
    {"done": ("Colossians 3:1", "you have been raised with Christ"), "join": ("Colossians 3:1", "since"), "now": ("Colossians 3:1", "strive for the things above"), "who": "Done to them", "span": "Colossians 3:1"},
    {"done": ("Romans 6:10", "The death He died, He died to sin once for all"), "join": ("Romans 6:11", "So"), "now": ("Romans 6:11", "count yourselves dead to sin"), "who": "Christ’s act", "span": "Romans 6:10–11"},
    {"done": ("Romans 12:1", "God’s mercy"), "join": ("Romans 12:1", "on account of"), "now": ("Romans 12:1", "offer your bodies as living sacrifices"), "who": "God’s act", "span": "Romans 12:1"},
    {"done": ("Ephesians 4:24", "put on the new self, created to be like God"), "join": ("Ephesians 4:25", "Therefore"), "now": ("Ephesians 4:25", "speak truthfully to his neighbor"), "who": "What they were taught they are", "span": "Ephesians 4:24–25"},
    {"done": ("Colossians 3:12", "the elect of God, holy and beloved"), "join": ("Colossians 3:12", "as"), "now": ("Colossians 3:12", "clothe yourselves"), "who": "God’s choosing", "span": "Colossians 3:12"},
    {"done": ("2 Peter 1:3", "His divine power has given us everything"), "join": ("2 Peter 1:5", "For this very reason"), "now": ("2 Peter 1:5", "make every effort"), "who": "God’s gift", "span": "2 Peter 1:3–5"},
]

# The part that carries Ephesians' four lines, and the lines: what to stop, what to do instead, and why.
LINES_PART = "04"
FOUR_LINES = [
    {"ref": "Ephesians 4:25", "stop": "put off falsehood", "instead": "speak truthfully to his neighbor", "because": "we are all members of one another"},
    {"ref": "Ephesians 4:28", "stop": "must steal no longer", "instead": "doing good with his own hands", "because": "that he may have something to share with the one in need"},
    {"ref": "Ephesians 4:29", "stop": "Let no unwholesome talk come out of your mouths", "instead": "only what is helpful for building up the one in need", "because": "bringing grace to those who listen"},
    {"ref": "Ephesians 4:31–32", "stop": "Get rid of all bitterness, rage and anger", "instead": "Be kind and tenderhearted to one another", "because": "just as in Christ God forgave you"},
]

# The close says five things God has already done, each with what it means to live. The verse each one rests on, in order.
CLOSE_PAIR_REFS = ["Romans 6:8–11", "Colossians 3:1–2", "Ephesians 4:32", "2 Peter 1:3–5", "Philippians 3:12"]

# Block quotations that stop at the end of a sentence inside their last verse. The page shows how the verse goes on.
PARTIAL_BLOCKS = {"Romans 12:18–19"}

# A quotation whose sentence goes on to cite a verse that is not its own. It is checked instead against the verses its
# paragraph may quote. (words, the reference wrongly beside it): why. Every entry must be used.
QUOTE_EXCEPTIONS = {
    ("a foothold", "Ephesians 4:31"): "Ephesians 4:27, the question's own verse; the later reference belongs to the next clause",
}

# Studies the text names in italics, each a folder under design/. The build fails if a folder has no index.html.
STUDY_LINKS = {
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "what-the-cross-accomplishes-directions",
    "Saved by grace: how God forgives and changes us": "grace-faith-and-salvation-directions",
    "The Ten Commandments": "the-ten-commandments-directions",
    "Every life in God's image": "every-life-in-gods-image-directions",
    "Fear, anxiety and despair": "fear-anxiety-and-despair-directions",
    "The Holy Spirit": "the-holy-spirit-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
    "Life together: belonging to a church": "life-together-directions",
    "Learning to discern": "learning-to-discern-directions",
    "Chosen and kept: can I be sure?": "chosen-and-kept-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "The hope to come": "the-hope-to-come-directions",
    "Baptism and the Lord's Supper: the two things Jesus told His church to do": "baptism-and-the-lords-supper-directions",
}
# Every other italic in the text: a book title.
ITALIC_TERMS = {"Explanatory Notes upon the New Testament"}

# Quoted words that are not Scripture: (source shown on the page, held source key, the part searched). A Baptist Faith and
# Message phrase is searched only in the article the sentence names; a confession only in its own paragraph.
BFM4, BFM5, BFM7 = ("Baptist Faith and Message 2000, article IV", "bfm", "IV"), ("Baptist Faith and Message 2000, article V", "bfm", "V"), ("Baptist Faith and Message 2000, article VII", "bfm", "VII")
OUTSIDE_QUOTES = {
    "a work of God's grace whereby believers become new creatures in Christ Jesus": BFM4,
    "become new creatures in Christ Jesus": BFM4,
    "is enabled to progress toward moral and spiritual maturity through the presence and power of the Holy Spirit dwelling in him": BFM4,
    "Growth in grace should continue throughout the regenerate person's life": BFM4,
    "There is no salvation apart from personal faith in Jesus Christ as Lord": BFM4,
    "All true believers endure to the end": BFM5,
    "will never fall away from the state of grace": BFM5,
    "Believers may fall into sin through neglect and temptation, whereby they grieve the Spirit": BFM5,
    "an act of obedience symbolizing the believer's faith in a crucified, buried, and risen Saviour, the believer's death to sin, the burial of the old life, and the resurrection to walk in newness of life in Christ Jesus": BFM7,
    "yet imperfect in this life": ("Second London Baptist Confession, chapter 13", "lbc", "13.2"),
    "a sign of his fellowship with him, in his death and resurrection": ("Second London Baptist Confession, chapter 29", "lbc", "29.1"),
    "worketh forgiveness of sins, delivers from death and the devil, and gives everlasting salvation to all who believe": ("Luther's Small Catechism, on baptism", "luther", "47"),
}
# Held sources, relative to the BibleProject folder. "bfm" is a text file whose articles start "X. Title"; the creeds are
# the site's JSON, one section per paragraph.
HELD = {
    "bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt", "kind": "bfm"},
    "lbc": {"path": "Website/data/creeds/doc/1689-london-baptist-confession-1677.b1.json", "kind": "creed"},
    "luther": {"path": "Website/data/creeds/doc/luthers-small-catechism-1529.b1.json", "kind": "creed"},
}

# Quoted words that are not in any verse their paragraph may quote: the text's own terms or another wording, keyed by
# part number, question id, "top" or "close". Every entry must be used.
OWN_TERMS = {
    ("top", "since"): "a joining word the study names, in lower case",
    ("top", "for this very reason"): "a joining word the study names, in lower case",
    ("01", "try to be new"): "what the hook says Paul does not say",
    ("new", "there is a new creation"): "the wording of some other translations, not the Berean",
}

# What each [source:…] note is labelled on the page.
SOURCE_LABELS = {"calvin-rom12": "Calvin", "calvin-eph": "Calvin", "lbc": "Second London Confession", "luther": "Luther’s Small Catechism"}

SOURCES = [
    {"name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened, and every quoted phrase, checked by script against the site’s copy. Public domain."},
    {"name": "The Baptist Faith and Message 2000, articles IV, V and VII", "href": "https://bfm.sbc.net/bfm2000/", "note": "Quoted in phrases. Each is found by script in the article the sentence names, in the copy held on this PC. The site’s doctrinal standard."},
    {"name": "Second London Baptist Confession (1677), chapter 13 paragraph 2 and chapter 29 paragraph 1", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "Two short quotations, each found by script in its own paragraph of the site’s copy. Punctuation is not compared: the held copy has a comma after “death” that the study leaves out."},
    {"name": "Luther’s Small Catechism (1529), on baptism", "href": "/study/creeds/luthers-small-catechism-1529", "note": "One short quotation, shown as Lutheran teaching, found by script in its own answer in the site’s copy."},
    {"name": "John Calvin, Commentary on Romans and Commentary on Ephesians", "href": "https://www.ccel.org/ccel/calvin/calcom38.html", "note": "Described, not quoted, on Romans 7, Romans 12:1 and Ephesians 4:26. Not checked by script; each place is marked to check."},
    {"name": "John Wesley, Explanatory Notes upon the New Testament", "href": "https://www.ccel.org/ccel/wesley/notes.html", "note": "Described, not quoted, on Romans 7. Not checked by script; marked to check."},
]
