"""The lists the Every life in God's image page draws beside the study's own text. build-data.py checks every phrase
here against the Berean, a held source or the study's own content.md, so a mark cannot claim words its verse or the
study does not hold. These are this page's choices, not a census of everyone in Scripture who cannot speak."""

TITLE = ("Every life", "in God's image")  # ink, then the turn in gold italic; joined they must equal the study's title

# The verse the lead quotes before any reference is printed: "in the image of God" is Genesis 1:27, read in part 01.
OPENING_READINGS = ["Genesis 1:27"]

# 01 Said twice. The same reason, before anyone had done anything and after the world was broken by violence.
TWICE = {
    "phrase": "in His own image",
    "rows": [
        {"ref": "Genesis 1:27", "when": "Before anyone had done anything"},
        {"ref": "Genesis 9:6", "when": "After the flood"},
    ],
    # The study: "It does not say it of the strong, the clever, the useful or the healthy." Proved absent from 1:26–27.
    "not_named": {"ref": "Genesis 1:26–27", "words": ["strong", "clever", "useful", "healthy"]},
}

# 02–06 Who is in the room? One plan per walked passage. Each mark is a person or a thing in the scene, at (x, y) in
# the room's 640 by 320 drawing. A mark's words are either the verse's own ("ref") or the study's own ("study", proved
# to be in content.md). Exactly one mark in each room is the one who cannot speak ("silent": True), and its "why" is in
# the study's own words. "kind": "person" is a ring, "thing" a small square, "words" a label with no mark: the LORD is
# named in words and never drawn. "lp" (optional) puts the label "right", "left" or "below" the mark instead of above or below.
ROOMS = [
    {"part": "02", "name": "Made in secret", "place": "The womb", "art": "womb",
     "silent_name": "the child in the womb",
     "marks": [
         {"id": "child", "label": "The child", "kind": "person", "x": 320, "y": 168, "silent": True,
          "words": "You knit me together in my mother’s womb", "ref": "Psalm 139:13",
          "why": "He does not speak of something that later became him. He speaks of himself."},
         {"id": "mother", "label": "His mother", "kind": "person", "x": 148, "y": 250,
          "words": "my mother’s womb", "ref": "Psalm 139:13"},
         {"id": "man", "label": "The grown man praying", "kind": "person", "x": 520, "y": 254,
          "words": "I praise You, for I am fearfully and wonderfully made", "ref": "Psalm 139:14"},
         {"id": "lord", "label": "You (the LORD)", "kind": "words", "x": 320, "y": 44,
          "words": "Your eyes saw my unformed body", "ref": "Psalm 139:16"},
     ]},
    {"part": "03", "name": "At the king's table", "place": "The table", "art": "table",
     "silent_name": "the man from Lo-debar",
     "marks": [
         {"id": "meph", "label": "Mephibosheth", "kind": "person", "x": 352, "y": 190, "silent": True,
          "words": "So Mephibosheth ate at David’s table like one of the king’s own sons", "ref": "2 Samuel 9:11",
          "why": "He has been living in Lo-debar, far from the court, in another man's house"},
         {"id": "king", "label": "King David", "kind": "person", "x": 518, "y": 160, "lp": "right",
          "words": "you will always eat at my table", "ref": "2 Samuel 9:7"},
         {"id": "ziba", "label": "Ziba", "kind": "person", "x": 470, "y": 266,
          "words": "There is still Jonathan’s son, who is lame in both feet", "ref": "2 Samuel 9:3"},
         {"id": "sons", "label": "The king's sons", "kind": "person", "x": 304, "y": 130,
          "words": "like one of the king’s own sons", "ref": "2 Samuel 9:11"},
         {"id": "lodebar", "label": "Lo-debar", "kind": "thing", "x": 70, "y": 60,
          "words": "he is in Lo-debar at the house of Machir son of Ammiel", "ref": "2 Samuel 9:4"},
     ]},
    {"part": "04", "name": "Your meeting", "place": "The meeting", "art": "meeting",
     "silent_name": "the poor man asked to stand",
     "marks": [
         {"id": "poor", "label": "The poor man", "kind": "person", "x": 140, "y": 196, "lp": "right", "silent": True,
          "words": "a poor man in shabby clothes also comes in", "ref": "James 2:2",
          "why": "One came to church in shabby clothes."},
         {"id": "rich", "label": "The man in fine clothes", "kind": "person", "x": 470, "y": 120,
          "words": "a man comes into your meeting wearing a gold ring and fine clothes", "ref": "James 2:2"},
         {"id": "honor", "label": "The seat of honour", "kind": "thing", "x": 560, "y": 76,
          "words": "Here is a seat of honor", "ref": "James 2:3"},
         {"id": "stand", "label": "Where he is told to stand", "kind": "thing", "x": 60, "y": 120,
          "words": "You must stand", "ref": "James 2:3"},
         {"id": "feet", "label": "Where he is told to sit", "kind": "thing", "x": 240, "y": 250,
          "words": "Sit at my feet", "ref": "James 2:3"},
         {"id": "you", "label": "The welcomers", "kind": "person", "x": 330, "y": 200,
          "words": "have you not discriminated among yourselves and become judges with evil thoughts?", "ref": "James 2:4"},
     ]},
    {"part": "05", "name": "Justice in the gate", "place": "The gate", "art": "gate",
     "silent_name": "the foreigner in the lawsuit",
     "marks": [
         {"id": "foreigner", "label": "The foreign resident", "kind": "person", "x": 500, "y": 250, "silent": True,
          "words": "Do not oppress a foreign resident", "ref": "Exodus 23:9",
          "why": "who does not belong to any family in town"},
         {"id": "poor", "label": "The poor man in a lawsuit", "kind": "person", "x": 150, "y": 250,
          "words": "You shall not deny justice to the poor in their lawsuits", "ref": "Exodus 23:6"},
         {"id": "innocent", "label": "The innocent", "kind": "person", "x": 330, "y": 270,
          "words": "Do not kill the innocent or the just", "ref": "Exodus 23:7"},
         {"id": "judges", "label": "Those who judge", "kind": "person", "x": 320, "y": 116, "lp": "below",
          "words": "a bribe blinds those who see", "ref": "Exodus 23:8"},
         {"id": "lie", "label": "A false accusation", "kind": "thing", "x": 196, "y": 168,
          "words": "Stay far away from a false accusation", "ref": "Exodus 23:7"},
         {"id": "bribe", "label": "A bribe", "kind": "thing", "x": 450, "y": 168,
          "words": "Do not accept a bribe", "ref": "Exodus 23:8"},
     ]},
    {"part": "06", "name": "At the bedside", "place": "The bedside", "art": "bedside",
     "silent_name": "the patient at the bedside",
     "marks": [
         {"id": "patient", "label": "The patient", "kind": "person", "x": 320, "y": 160, "silent": True,
          "words": "Open your mouth for those with no voice", "ref": "Proverbs 31:8",
          "why": "who can no longer say what they want"},
         {"id": "family", "label": "The family", "kind": "person", "x": 150, "y": 110,
          "study": "These decisions belong with the patient, the family, the doctors and, where it helps, a pastor."},
         {"id": "doctors", "label": "The doctors", "kind": "person", "x": 500, "y": 104,
          "study": "a doctor's instruction not to attempt to restart the heart if it stops"},
         {"id": "pastor", "label": "A pastor", "kind": "person", "x": 160, "y": 258,
          "study": "These decisions belong with the patient, the family, the doctors and, where it helps, a pastor."},
         {"id": "hospice", "label": "Hospice care", "kind": "thing", "x": 500, "y": 262,
          "study": "hospice care, which looks after comfort, pain and the whole person rather than trying to cure"},
     ]},
]
# Room 06 is the study's application of Proverbs 31:8–9, marked as one in its own words. The page says so above it.
APPLIED = {"06": "This site's application, marked as one"}

# 03 The chapter's table. Found by script in 2 Samuel 9: the verses with "table", those with "always" beside it, and
# those with "lame in both feet". The study says "three times" and cites four verses (7, 10, 11, 13); the page shows
# what the verses hold and reports the difference to the editor.
TABLE = {"chapter": "2 Samuel 9", "table": "table", "always": "always", "lame": "lame in both feet",
         "study_cites": [7, 10, 11, 13], "study_says": "the chapter says three times"}

# 02 Who is speaking? The first-person words of Psalm 139:13–16, counted by script.
SPEAKER = {"ref": "Psalm 139:13–16", "words": ["I", "me", "my", "My"]}

# 06 What a king's mouth is for: "Open your mouth", counted by script in Proverbs 31:8–9.
MOUTH = {"ref": "Proverbs 31:8–9", "phrase": "Open your mouth", "expect": 2}

# The close: the five people the Way paragraph names, each the silent one of a room, and the four things it says the
# answer will often be. Each must be in the Way paragraph word for word.
CLOSE_ACTS = ["a seat", "a meal", "a word spoken in the right room", "a refusal to be bought"]

# A block quotation that prints a speaker's words without the verse's opening frame. None in this study.
SPOKEN_BLOCKS: dict = {}

# Block quotations that print only the first sentence of their verse. The build proves the page's words are the start
# of the verse, word for word, and stop at the end of a sentence; the page says the verse goes on, and the verse sheet
# shows it whole. Every entry must be used.
PARTIAL_BLOCKS = {"Revelation 7:9": "The verse goes on: “They were wearing white robes and holding palm branches in their hands.”"}

# Named exceptions to "a quote cited to several verses is in every one of them". Every entry must be used.
QUOTE_EXCEPTIONS: dict = {}

# Quotations in the study that are not word for word the Berean. None in this study; kept so the selftest can prove
# the check still refuses a wrong entry.
MISQUOTES: dict = {}

# Studies the text names in italics, each a folder under design/. data.js never depends on whether the folder exists;
# the build prints a warning for one without index.html. Every entry must be used.
STUDY_LINKS = {
    "Humanity, sin and renewal": "humanity-sin-and-renewal-directions",
    "Genesis 1–11: the questions readers bring": "creation-to-babel-directions",
    "The signs and works of Jesus": "the-signs-and-works-of-jesus-directions",
    "The church and its calling": "the-church-and-its-calling-directions",
    "God: who He is and what He does": "knowing-god-directions",
    "Prophets in their times": "prophets-in-their-times-directions",
    "Leviticus: holiness and sacrifice": "the-law-of-moses-and-the-christian-directions",
    "Grief and dying": "grief-and-dying-directions",
    "What Scripture promises the sick": "illness-and-healing-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
}
# Every other italic in the text. An italic on neither list fails. None in this study.
ITALIC_TERMS: set = set()

# Quoted words that are not Scripture: (source shown on the page, held source key or None, the part of it searched).
# None means not held on this PC: the page marks it as not yet compared.
OUTSIDE_QUOTES = {
    "every person of every race possesses full dignity and is worthy of respect and Christian love": ("Baptist Faith and Message 2000, article III", "bfm", "III"),
    "of every race": ("Baptist Faith and Message 2000, article III", "bfm", "III"),
    "speak on behalf of the unborn and contend for the sanctity of all human life from conception to natural death": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "from conception": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "from conception to natural death": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "natural death": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "should oppose racism": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "provide for... the helpless, and the sick": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "provide for the orphaned, the needy, the abused, the aged, the helpless, and the sick": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "Discontinuing medical procedures that are burdensome, dangerous, extraordinary, or disproportionate to the expected outcome can be legitimate": ("Catechism of the Catholic Church, paragraph 2278", None, None),
    "one does not will to cause death; one's inability to impede it is merely accepted": ("Catechism of the Catholic Church, paragraph 2278", None, None),
}
# Outside quotations that a held source has in other words. The study's words are kept and marked with the held
# wording; the build proves the study's words are NOT in the held part and the held words are. Every entry must be used.
OUTSIDE_DIFFERS = {
    "and some say forty-six": ("Babylonian Talmud, Bava Metzia 59b", "talmud", "59b", "and some say in forty-six places"),
}
# Held sources, relative to the BibleProject folder. "bfm" is a text file whose articles start "X. Title"; "talmud" is
# the English Bava Metzia held in the knowledge base, one numbered paragraph a line ("118.14" is folio 59b).
HELD = {
    "bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"},
    "talmud": {"path": "KnowledgeBase/False Religions/Judaism/Babylonian Talmud/english/Bava-Metzia.txt", "pages": {"59b": "118."}},
}

# Quoted words that are the study's own terms, keyed by where they stand. Every entry must be used.
OWN_TERMS = {
    ("01", "Sanctity"): "the term the study explains",
    ("03", "and so his feet no longer mattered"): "what the narrator does not say",
    ("03", "but he was lame"): "what the narrator does not say",
}

# What each [source:…] note in the text is labelled on the page.
SOURCE_LABELS = {"ccc": "The Catholic Church"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles III and XV, quoted in phrases, each found by script in its own article in the copy held on this PC. The site's doctrinal standard."),
    ("The Babylonian Talmud, Bava Metzia 59b", "One short saying, compared by script with the English translation held on this PC, which words it differently; the page shows both."),
    ("The Catechism of the Catholic Church", "Paragraph 2278, quoted in two phrases. Not held on this PC: the page marks each as not yet compared."),
    ("Southern Baptist Convention resolutions (1995, 2024, 2026)", "Described, not quoted. Titles and wording still to be checked at sbc.net."),
]
