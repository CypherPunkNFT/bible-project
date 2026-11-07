"""The lists The book of Psalms page draws beside the study's own text. build-data.py checks every phrase and count here
against the Berean, so the page cannot claim what the text does not hold. These are this page's choices, not a census."""

CONCEPTS = ["The five books", "The kinds", "The reading of Christ"]
MOTTO = ["A gate. Five books.", "A last word of praise."]

# Counts the study states in its own voice. Each "says" must be in content.md word for word, and each value is
# recomputed from the site's Berean by build-data.py. A list value is compared as a set of psalm numbers.
CLAIMS = [
    {"says": "The Psalms have more chapters than any other book of the Bible", "fact": "most_chapters", "value": True},
    {"says": "Its last five psalms each begin and end with \"Hallelujah\"", "fact": "hallelujah_frame", "value": [146, 147, 148, 149, 150]},
    {"says": "two of only four psalms in Book I with no heading (10 and 33 are the others)", "fact": "book1_unheaded", "value": [1, 2, 10, 33]},
    {"says": "116 of the 150 psalms carry a heading and 34 do not", "fact": "headed", "value": 116},
    {"says": "**David**, in 73 headings", "fact": "David", "value": 73},
    {"says": "**Asaph**, in 12 (Psalms 50 and 73–83)", "fact": "Asaph", "value": [50] + list(range(73, 84))},
    {"says": "in 11 (Psalms 42, 44–49, 84–85, 87–88)", "fact": "sons of Korah", "value": [42, 44, 45, 46, 47, 48, 49, 84, 85, 87, 88]},
    {"says": "**Solomon** in 2 (72, 127)", "fact": "Solomon", "value": [72, 127]},
    {"says": "**Moses** in 1 (90)", "fact": "Moses", "value": [90]},
    {"says": "**Heman** and **Ethan** in 1 each (88, 89)", "fact": "Heman_Ethan", "value": [88, 89]},
    {"says": "Thirteen headings tie a psalm to a day in David's life", "fact": "events", "value": 13},
    {"says": "\"For the choirmaster\" (55 headings)", "fact": "choirmaster", "value": 55},
    {"says": "fifteen are headed \"A song of ascents\" (120–134)", "fact": "ascents", "value": list(range(120, 135))},
    {"says": "The Berean's notes mark Psalms 25, 34, 37, 111, 112, 119 and 145, and 9 and 10 together", "fact": "acrostics", "value": [9, 25, 34, 37, 111, 112, 119, 145]},
    {"says": "Psalm 119, the longest chapter in the Bible", "fact": "longest_119", "value": True},
    {"says": "twenty-two letters, eight verses each, 176 verses on God's word", "fact": "stanzas_119", "value": 22},
    {"says": "Counted, 40 psalms are cited", "fact": "cited_psalms", "value": 40},
    {"says": "Psalm 118 leads, in 13 New Testament passages", "fact": "cited_118", "value": 13},
    {"says": "Psalm 110 follows with 8", "fact": "cited_110", "value": 8},
    {"says": "Psalms 2 and 22 have 5 each (as do 69 and 95)", "fact": "cited_five", "value": [2, 22, 69, 95]},
    {"says": "Psalm 16 is cited only twice", "fact": "cited_16", "value": 2},
]

# How each book closes, as part 01 quotes it. build-data.py checks each verse is in its book's last psalm, that the
# first four bless the LORD, and that the fifth is Hallelujah.
CLOSINGS = ["Psalm 41:13", "Psalm 72:19", "Psalm 89:52", "Psalm 106:48", "Psalm 150:6"]

# The thirteen headings that tie a psalm to a day in David's life. build-data.py checks each names David.
EVENTS = [3, 7, 18, 34, 51, 52, 54, 56, 57, 59, 60, 63, 142]

# Part 02, the gate: one word frames two psalms, and Psalm 1:1's man moves from walking to sitting.
GATE = {
    "open": ("Psalm 1:1", "Blessed is the man"), "close": ("Psalm 2:12", "Blessed are all who take refuge in Him"),
    "steps": [("walks", "walk in the counsel of the wicked"), ("sets foot", "set foot on the path of sinners"),
              ("sits", "sit in the seat of mockers")],
}

# Part 04, Psalm 13's shape, in the three movements the study names. Each phrase is checked in its verses.
PSALM_13 = [
    {"name": "Complaint", "ref": "Psalm 13:1–2", "words": "How long, O LORD? Will You forget me forever?", "level": 0},
    {"name": "Request", "ref": "Psalm 13:3–4", "words": "Consider me and respond", "level": 1},
    {"name": "Trust and praise", "ref": "Psalm 13:5–6", "words": "But I have trusted in Your loving devotion", "level": 2},
]

# Words the study quotes from the Berean's own footnotes, with the psalm whose notes hold them.
NOTE_QUOTES = {
    "probably a musical or liturgical term": 32,
    "another name for Achish": 34,
    "an acrostic poem of twenty-two stanzas, following the letters of the Hebrew alphabet; within a stanza, each verse begins with the same Hebrew letter": 119,
    "supplied by one MT manuscript, LXX, Syriac, and DSS": 145,
    "save, we pray": 118,
}

# Quoted words bound to one reference because nothing beside them names it (one word, or a heading phrase).
QUOTE_REFS = {
    "Blessed": "Psalm 1:1", "Hallelujah": "Psalm 150:6", "Abimelech": "Psalm 34", "The Doe of the Dawn": "Psalm 22",
    "For the choirmaster": "Psalm 4", "Of David": "Psalm 3", "A prayer of Moses the man of God": "Psalm 90",
    "hymn": "Matthew 26:30", "His loving devotion endures forever": "Psalm 136", "Blessed be the LORD": "Psalm 41:13",
    "Praise the LORD": "Psalm 150:1", "The LORD reigns!": "Psalm 93:1",
    "Blessed is the man": "Psalm 1:1", "Let everything that has breath praise the LORD": "Psalm 150:6",
}

# Quoted words that are not Scripture, with the held copy on this PC each is checked against (path from BibleProject/).
OUTSIDE_QUOTES = {
    "set in the forefront of the entire book": ("Spurgeon, The Treasury of David, on Psalm 119:1", "sources/library/bulk/ia/treasurydavidvo00spurgoog.txt"),
    "foreshadowings of the Son of David, who began his great sermon as David began his great psalm": ("Spurgeon, The Treasury of David, on Psalm 119:1", "sources/library/bulk/ia/treasurydavidvo00spurgoog.txt"),
    "We shall be wise to view this passage as a prophecy": ("Spurgeon, The Treasury of David, on Psalm 137:9", "sources/library/bulk/ia/treasurydavidco04spurgoog.txt"),
    "the desire for righteous retribution is rather the spirit of the law than of the gospel": ("Spurgeon, The Treasury of David, on Psalm 137:9", "sources/library/bulk/ia/treasurydavidco04spurgoog.txt"),
    "A feeling of universal love is admirable, but it must not be divorced from a keen sense of justice": ("Spurgeon, The Treasury of David, on Psalm 137:9", "sources/library/bulk/ia/treasurydavidco04spurgoog.txt"),
    "Where the Psalmist uses sharp invectives against his personal enemies, I have endeavoured to turn the edge of them against our spiritual adversaries, sin, Satan, and temptation.": ("Isaac Watts, preface to The Psalms of David Imitated (1719), as printed in 1824", "sources/library/bulk/ia/psal00watt.txt"),
    "the second portion of the 'Hallel' was sung, consisting of Psalms 115, 116, 117, and 118": ("Edersheim, The Temple, chapter 12", "sources/library/bulk/ccel/edersheim_temple.xml"),
    "comparatively very few relics from New Testament times": ("Edersheim, The Temple, chapter 12", "sources/library/bulk/ccel/edersheim_temple.xml"),
    "An Anatomy of all the Parts of the Soul": ("Calvin, Commentary on the Book of Psalms, the author's preface", "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-08/calcom08.xml"),
    "for there is not an emotion of which any one can be conscious that is not here represented as in a mirror": ("Calvin, Commentary on the Book of Psalms, the author's preface", "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-08/calcom08.xml"),
}

# Outside words with no full copy on this PC: compared by eye, and the README says so.
OUTSIDE_BY_EYE = {"truth, without any mixture of error": "Baptist Faith and Message 2000, article I"}

# Quoted words that are the study's own terms or a word being explained, not quotations from anywhere.
OWN_TERMS = {"Hallel", "for", "belonging to", "by David", "Of David", "Of Solomon", "great Hallel"}

# A chapter:verse with no book and no quotation before it must be named here, by the words just before it.
BARE_REFS = {"Hebrews of the Son above the angels (1:5)": "Hebrews"}

# Psalm numbers in brackets with no book named, read as psalms only when listed here word for word.
PSALM_LISTS = ["(42–72)", "(73–89)", "(90–106)", "(107–150)", "(120–134)", "(145)", "(100)", "(1, 37, 49, 73)", "(2, 110)", "(45)", "(72)", "(35, 69, 109, 137)", "(72, 127)", "(90)", "(88, 89)"]

# Named studies. Italic names in the text link here when they are pages; the close lists the ones that exist.
STUDY_LINKS = {
    "How Hebrew works": "/study/how-hebrew-works",
    "The Dead Sea Scrolls": "/study/dead-sea-scrolls",
}
RELATED = [
    ("Hymns", "/study/hymns", "How the church has sung the psalms, Watts's among them."),
    ("Long Memory", "/study/long-memory", "Peter's Pentecost sermon walked in full."),
    ("How Hebrew works", "/study/how-hebrew-works", "The alphabet behind the acrostics."),
    ("The Dead Sea Scrolls", "/study/dead-sea-scrolls", "The psalms scrolls and the line for nun."),
    ("Prayer in the letters", "/mockups/prayer-in-the-letters-directions/", "Prayer as a subject. A mock-up on this PC."),
]

SOURCES = [
    ("The Berean Standard Bible", "Every verse, heading and quoted phrase, and the notes the study quotes, checked by script against the site's copy. Every count on the page is computed from it."),
    ("C. H. Spurgeon, The Treasury of David", "On Psalms 119:1 and 137:9. Five phrases, checked against the scanned volumes held on this PC."),
    ("Alfred Edersheim, The Temple: Its Ministry and Services", "Chapter 12, on the Hallel at Passover. Two phrases, checked against the held text."),
    ("Isaac Watts, The Psalms of David Imitated (1719)", "One sentence of his preface, as an 1824 edition prints it; the first edition was not seen."),
    ("John Calvin, Commentary on the Book of Psalms", "The author's preface, in James Anderson's translation. Two phrases, checked against the held text."),
    ("The Baptist Faith and Message 2000", "Article I, one phrase, compared by eye. The site's doctrinal standard."),
]
