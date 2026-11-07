"""The lists the Christ in the Old Testament page draws beside the study's own text. build-data.py checks every phrase
here against the Berean, so a line cannot claim words its verse does not hold. These are this page's choices, not a
count of every line the New Testament draws."""

# The standard heading. The concepts are the three parts Jesus names in Luke 24:44, the motto is Luke 24:27's own words.
TRAIL = [("Study", "/study"), ("Jesus Christ", "/study/theology?area=jesus")]
TITLE = ("Christ in the", "Old Testament")
CONCEPTS = {"ref": "Luke 24:44", "words": ["the Law of Moses", "the Prophets", "the Psalms"]}
MOTTO = {"ref": "Luke 24:27", "lines": ["beginning with Moses", "and all the Prophets"]}
CLOSE_PASSAGE = "Luke 24:13–35"

# The three parts of the Old Testament as Luke 24:44 names them. Samuel, Kings, Joshua and Jonah stand among the
# Prophets in the order the Hebrew Bible keeps; "the Psalms" is drawn as the Psalter only, the book Jesus names.
BANDS = [
    {"id": "law", "name": "The Law of Moses", "books": ["GEN", "EXO", "LEV", "NUM", "DEU"]},
    {"id": "prophets", "name": "The Prophets", "books": ["JOS", "JDG", "1SA", "2SA", "1KI", "2KI", "ISA", "JER", "EZK",
                                                          "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP",
                                                          "HAG", "ZEC", "MAL"]},
    {"id": "psalms", "name": "The Psalms", "books": ["PSA"]},
]

FIGURES = [("01", "The lamb"), ("02", "The temple"), ("03", "The priest"), ("04", "The king"), ("05", "The servant"),
           ("06", "More lines")]

# One entry per line a New Testament verse draws to an Old Testament one. "nt_words" must be in the New Testament verse
# and "ot_words" in the Old Testament verse, both as whole words, exact case. kind: "quote" (the verse quotes it),
# "names" (it names the figure or event), "either" (one of several possible sources; the text does not say which).
MAP_LINES = [
    {"fig": "01", "nt": "1 Corinthians 5:7", "nt_words": "Christ, our Passover lamb", "ot": "Exodus 12:21", "ot_words": "slaughter the Passover lamb", "kind": "names"},
    {"fig": "01", "nt": "1 Peter 1:19", "nt_words": "a lamb without blemish or spot", "ot": "Exodus 12:5", "ot_words": "an unblemished year-old male", "kind": "names"},
    {"fig": "01", "nt": "John 1:29", "nt_words": "the Lamb of God", "ot": "Exodus 12:5", "ot_words": "Your lamb must be an unblemished", "kind": "either"},
    {"fig": "01", "nt": "John 1:29", "nt_words": "who takes away the sin of the world", "ot": "Isaiah 53:7", "ot_words": "led like a lamb to the slaughter", "kind": "either"},
    {"fig": "01", "nt": "John 19:36", "nt_words": "Not one of His bones will be broken", "ot": "Exodus 12:46", "ot_words": "you may not break any of the bones", "kind": "either"},
    {"fig": "01", "nt": "John 19:36", "nt_words": "Not one of His bones will be broken", "ot": "Psalm 34:20", "ot_words": "not one of them will be broken", "kind": "either"},
    {"fig": "02", "nt": "John 1:14", "nt_words": "made His dwelling among us", "ot": "Exodus 25:8", "ot_words": "so that I may dwell among them", "kind": "names"},
    {"fig": "02", "nt": "John 1:14", "nt_words": "We have seen His glory", "ot": "Exodus 40:34", "ot_words": "the glory of the LORD filled the tabernacle", "kind": "names"},
    {"fig": "03", "nt": "Hebrews 7:17", "nt_words": "You are a priest forever in the order of Melchizedek", "ot": "Psalm 110:4", "ot_words": "You are a priest forever in the order of Melchizedek", "kind": "quote"},
    {"fig": "03", "nt": "Hebrews 7:3", "nt_words": "like the Son of God", "ot": "Genesis 14:18", "ot_words": "Melchizedek king of Salem", "kind": "names"},
    {"fig": "03", "nt": "Hebrews 10:4", "nt_words": "the blood of bulls and goats", "ot": "Leviticus 16:15", "ot_words": "the goat for the sin offering", "kind": "names"},
    {"fig": "04", "nt": "Hebrews 1:5", "nt_words": "I will be His Father, and He will be My Son", "ot": "2 Samuel 7:14", "ot_words": "I will be his Father, and he will be My son", "kind": "quote"},
    {"fig": "04", "nt": "Hebrews 1:5", "nt_words": "You are My Son; today I have become Your Father", "ot": "Psalm 2:7", "ot_words": "You are My Son; today I have become Your Father", "kind": "quote"},
    {"fig": "04", "nt": "Luke 1:32", "nt_words": "the throne of His father David", "ot": "2 Samuel 7:13", "ot_words": "the throne of his kingdom forever", "kind": "names"},
    {"fig": "04", "nt": "Matthew 22:44", "nt_words": "The Lord said to my Lord", "ot": "Psalm 110:1", "ot_words": "The LORD said to my Lord", "kind": "quote"},
    {"fig": "05", "nt": "Acts 8:32", "nt_words": "He was led like a sheep to the slaughter", "ot": "Isaiah 53:7", "ot_words": "He was led like a lamb to the slaughter", "kind": "quote"},
    {"fig": "05", "nt": "1 Peter 2:24", "nt_words": "By His stripes you are healed", "ot": "Isaiah 53:5", "ot_words": "by His stripes we are healed", "kind": "quote"},
    {"fig": "05", "nt": "1 Peter 2:22", "nt_words": "no deceit was found in His mouth", "ot": "Isaiah 53:9", "ot_words": "nor was any deceit in His mouth", "kind": "quote"},
    {"fig": "05", "nt": "Matthew 8:17", "nt_words": "He took on our infirmities", "ot": "Isaiah 53:4", "ot_words": "He took on our infirmities", "kind": "quote"},
    {"fig": "06", "nt": "Romans 5:14", "nt_words": "a pattern of the One to come", "ot": "Genesis 2:17", "ot_words": "you must not eat from the tree", "kind": "names"},
    {"fig": "06", "nt": "1 Corinthians 10:1", "nt_words": "they all passed through the sea", "ot": "Exodus 14:22", "ot_words": "the Israelites went through the sea", "kind": "names"},
    {"fig": "06", "nt": "1 Peter 3:20", "nt_words": "in the days of Noah", "ot": "Genesis 7:13", "ot_words": "Noah entered the ark", "kind": "names"},
    {"fig": "06", "nt": "Matthew 12:40", "nt_words": "three days and three nights in the belly of the great fish", "ot": "Jonah 1:17", "ot_words": "three days and three nights in the belly of the fish", "kind": "names"},
    {"fig": "06", "nt": "John 3:14", "nt_words": "Moses lifted up the snake in the wilderness", "ot": "Numbers 21:9", "ot_words": "Moses made a bronze snake and mounted it on a pole", "kind": "names"},
    {"fig": "06", "nt": "John 6:32", "nt_words": "the bread from heaven", "ot": "Exodus 16:4", "ot_words": "I will rain down bread from heaven", "kind": "names"},
]

# The first meaning, drawn at the top of each part's line: what the figure was before it pointed anywhere else.
FIRST = {
    "01": {"ref": "Exodus 12:13", "words": "when I see the blood, I will pass over you"},
    "02": {"ref": "Exodus 25:8", "words": "so that I may dwell among them"},
    "03": {"ref": "Leviticus 16:15", "words": "bring its blood behind the veil"},
    "04": {"ref": "2 Samuel 7:12", "words": "I will establish his kingdom"},
    "05": {"ref": "Isaiah 52:13", "words": "My Servant will prosper"},
}

# Where each picture stops, or runs on. "words" must be in "ref"; "absent" proves a phrase is NOT in a passage.
STOPS = {
    "01": [{"ref": "Exodus 12:27", "words": "the Passover sacrifice to the LORD", "note": "Exodus never calls it a sin offering.",
            "absent": ("Exodus 12:1–51", "sin offering")}],
    "02": [{"ref": "1 Corinthians 3:16", "words": "you yourselves are God’s temple", "note": "The line runs on to His people.", "runs_on": True},
           {"ref": "Revelation 21:22", "words": "I saw no temple in the city", "note": "And at last to God’s presence filling everything.", "runs_on": True}],
    "03": [{"ref": "Hebrews 7:27", "words": "Unlike the other high priests", "note": "Read by contrast as much as by likeness."},
           {"ref": "Hebrews 7:24", "words": "Jesus lives forever", "note": "The old priests died; He does not."}],
    "04": [{"ref": "2 Samuel 7:14", "words": "When he does wrong, I will discipline him", "note": "Hebrews quotes the first half of the verse and stops here.",
            "absent": ("Hebrews 1:5", "discipline")}],
    "05": [{"ref": "Acts 8:34", "words": "himself or someone else", "note": "The song names no one; the New Testament answers."},
           {"ref": "Isaiah 53:11", "words": "He will see the light of life", "note": "The song ends past the servant’s death."}],
}

# Part 06: a reading beyond the lines the New Testament draws. Drawn dotted, reaching no New Testament verse.
BEYOND = {"ref": "Joshua 2:18", "words": "this scarlet cord", "source": "First Clement 12:7",
          "note": "First Clement reads the cord as the Lord’s blood. Joshua 2 does not say it."}
WARNING = {"ref": "2 Kings 18:4", "words": "the bronze snake called Nehushtan"}

# Bare "chapter:verse" references in the text, by part, with the book each belongs to. None marks a reference that is
# not Scripture (First Clement). The build fails on a bare reference with no entry and on an entry the text no longer has.
SHORT_REFS = {
    ("01", "12:27"): "Exodus",
    ("03", "16:16"): "Leviticus", ("03", "10:4"): "Hebrews", ("03", "7:24"): "Hebrews", ("03", "10:12"): "Hebrews",
    ("03", "7:3"): "Hebrews", ("03", "7:25"): "Hebrews",
    ("04", "7:13"): "2 Samuel", ("04", "7:14"): "2 Samuel",
    ("05", "49:5–6"): "Isaiah", ("05", "53:10"): "Isaiah", ("05", "53:12"): "Isaiah", ("05", "52:15"): "Isaiah",
    ("05", "52:13"): "Isaiah", ("05", "53:6"): "Isaiah", ("05", "53:9"): "Isaiah", ("05", "53:8"): "Isaiah",
    ("05", "53:11"): "Isaiah",
    ("06", "12:7"): None,
}

# Quoted words that are not Scripture, each found by script in a copy held on this PC, after the marker named.
OUTSIDE_QUOTES = {
    "All Scripture is a testimony to Christ, who is Himself the focus of divine revelation": {
        "source": "Baptist Faith and Message 2000, Article I", "path": "content/questions/sources/normalized/baptist-know-the-truth-catechism.json",
        "marker": "Holy Bible was written by men divinely inspired"},
    "and tabernacled among us": {
        "source": "The Berean's footnote on John 1:14", "path": "data/text/bsb/JHN/0.json", "marker": "The Word became flesh"},
    "that through the blood of the Lord there shall be redemption": {
        "source": "First Clement 12:7, J. B. Lightfoot's translation", "path": "../sources/library/bulk/ccel/lightfoot_fathers.xml",
        "marker": 'id="ii.i-p72"'},
}

# Words the text quotes as words of its own, not quotations from anywhere.
OWN_TERMS = {"type"}

# Studies the text names in italics. A study with a mock-up on this PC links to it; the build fails if that folder has
# no index.html. Studies being designed in this same run, or not yet pages, are named only.
STUDY_LINKS = {
    "Who do you say that I am? Who Jesus really is": "who-do-you-say-that-i-am-directions",
    "Leviticus: holiness and sacrifice": None,
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "what-the-cross-accomplishes-directions",
    "Covenants and promises": "covenants-and-promises-directions",
    "The book of Psalms": "praying-the-psalms-directions",
    "What Scripture promises the sick": None,
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy. One footnote (John 1:14) quoted as the Berean's own note."),
    ("The Baptist Faith and Message 2000", "Article I, one sentence, checked against the copy held in the site's question sources. The site's doctrinal standard."),
    ("First Clement 12:7", "J. B. Lightfoot's translation, The Apostolic Fathers (CCEL text). One phrase, checked against the local copy."),
    ("Patrick Fairbairn, The Typology of Scripture", "Vol. 1, 4th ed. (Edinburgh, 1876), pp. 37–38, 43–45, read in the local copy; Herbert Marsh is known here only through Fairbairn's quotation."),
    ("Rashi and David Kimchi", "Named, not quoted, for the Jewish reading of Isaiah's servant. Not yet read for this study; marked on the page as still to be checked."),
]
