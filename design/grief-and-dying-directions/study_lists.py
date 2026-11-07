"""The lists the Grief and dying page draws beside the study's own text. build-data.py checks every phrase here against
the Berean or a held source, so a row cannot claim words its verse does not hold. These are this page's choices, not a
count of every grief in Scripture."""

TITLE = ("Grief", "and dying")  # ink, then the turn in gold italic; joined they must equal the study's title

# 00 Who is weeping, and to whom. Each row is one thing a mourner does or says, in the verse's own words, and where it
# is aimed. "to" is one of ADDRESSEES. "section" is the book's section, which gives the line its colour.
ADDRESSEES = {
    "dead": "The one who died",
    "living": "The people standing by",
    "lord": "The Lord",
}
VOICES = [
    {"part": "01", "who": "Abraham", "act": "weeps for", "to": "dead", "whom": "Sarah", "section": "history",
     "ref": "Genesis 23:2", "words": "to mourn and to weep for her"},
    {"part": "01", "who": "Abraham", "act": "speaks to", "to": "living", "whom": "the Hittites", "section": "history",
     "ref": "Genesis 23:3–4", "words": "Give me a burial site among you so that I can bury my dead"},
    {"part": "01", "who": "Joseph", "act": "weeps over", "to": "dead", "whom": "his father", "section": "history",
     "ref": "Genesis 50:1", "words": "wept over him, and kissed him"},
    {"part": "01", "who": "Joseph", "act": "speaks to", "to": "living", "whom": "Pharaoh's court", "section": "history",
     "ref": "Genesis 50:4–5", "words": "Now let me go and bury my father, and then return"},
    {"part": "02", "who": "David", "act": "has a people taught", "to": "living", "whom": "the sons of Judah", "section": "history",
     "ref": "2 Samuel 1:18", "words": "ordered that the sons of Judah be taught the Song of the Bow"},
    {"part": "02", "who": "David", "act": "sings to", "to": "dead", "whom": "Jonathan", "section": "history",
     "ref": "2 Samuel 1:26", "words": "I grieve for you, Jonathan, my brother"},
    {"part": "02", "who": "David", "act": "cries out to", "to": "dead", "whom": "Absalom", "section": "history",
     "ref": "2 Samuel 18:33", "words": "O my son Absalom!"},
    {"part": "03", "who": "Jerusalem", "act": "calls to", "to": "living", "whom": "all who pass by", "section": "prophets",
     "ref": "Lamentations 1:12", "words": "Is this nothing to you, all you who pass by?"},
    {"part": "03", "who": "Jerusalem", "act": "prays to", "to": "lord", "whom": "the LORD", "section": "prophets",
     "ref": "Lamentations 1:20", "words": "See, O LORD, how distressed I am!"},
    {"part": "03", "who": "The poet", "act": "speaks to", "to": "lord", "whom": "the LORD", "section": "prophets",
     "ref": "Lamentations 3:23", "words": "great is Your faithfulness!"},
    {"part": "04", "who": "The dying man", "act": "asks", "to": "lord", "whom": "Jesus", "section": "gospels",
     "ref": "Luke 23:42", "words": "Jesus, remember me when You come into Your kingdom!"},
]
SECTION_NAMES = {"history": "History", "prophets": "Prophets", "gospels": "Gospels"}
# The one sentence that reads the picture. build-data.py proves it from VOICES: no Genesis or 2 Samuel voice drawn here
# goes to the Lord, and Lamentations and Luke each have one that does.
VOICES_READ = ("In the voices drawn here, Genesis and 2 Samuel speak grief to the dead and to the people standing by. "
               "Lamentations and Luke also speak it to the Lord.")
VOICES_FACT = {"none_to_lord": ("Genesis", "2 Samuel"), "some_to_lord": ("Lamentations", "Luke")}

# 01 The days of mourning Genesis records. "n" must be what "words" says, and "words" must be in the verse.
NUMBER_WORDS = {"seven": 7, "forty": 40, "seventy": 70}
DAYS = [
    {"label": "Embalming Jacob", "words": "forty days", "ref": "Genesis 50:3"},
    {"label": "The Egyptians mourn him", "words": "seventy days", "ref": "Genesis 50:3"},
    {"label": "Joseph mourns at Atad", "words": "seven days", "ref": "Genesis 50:10"},
]
NO_COUNT = {"label": "Abraham mourns Sarah", "ref": "Genesis 23:2–3", "absent": "days"}  # proved to hold no number of days
CAVE = [
    {"ref": "Genesis 23:16", "words": "four hundred shekels of silver", "note": "Abraham pays for the field"},
    {"ref": "Genesis 23:19", "words": "buried his wife Sarah in the cave", "note": "Sarah is buried"},
    {"ref": "Genesis 50:13", "words": "which Abraham had purchased", "note": "Jacob is laid in the same cave"},
]

# 02 The Song of the Bow and the cry at the gate. The refrain's verses are found by script and must be the ones the
# study cites (1:19, 25, 27). The cry's "my son" is counted by script.
SONG = {"ref": "2 Samuel 1:19–27", "refrain": "How the mighty have fallen", "cited": [19, 25, 27]}
CRY = {"ref": "2 Samuel 18:33", "phrase": "my son"}

# 03 The alphabet of grief. Lamentations whole. Marks are found by script; "expect" is the study's own count.
LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"]
LAMENT = {
    "chapters": {1: 22, 2: 22, 3: 66, 4: 22, 5: 22},
    "not_alphabet": [5],  # passage-notes.md: "Chapter 5 has 22 lines but is not an acrostic."
    "comfort": {"pattern": r"no one (?:nearby )?to comfort", "chapter": 1, "expect": [2, 9, 16, 17, 21]},
    "marks": [
        {"id": "perished", "ref": "Lamentations 3:18", "words": "My strength has perished, along with my hope from the LORD", "name": "Hope has perished"},
        {"id": "hope", "ref": "Lamentations 3:21–33", "words": "Yet I call this to mind, and therefore I have hope", "name": "The hope"},
        {"id": "unforgiven", "ref": "Lamentations 3:42", "words": "You have not forgiven", "name": "Not yet forgiven"},
    ],
}

# 04 The two men beside Jesus, and the comma. Jesus is named, never drawn.
TWO_MEN = {
    "mocks": {"ref": "Luke 23:39", "words": "Save Yourself and us!"},
    "says": [
        {"ref": "Luke 23:40", "words": "Do you not even fear God"},
        {"ref": "Luke 23:41", "words": "We are punished justly"},
        {"ref": "Luke 23:41", "words": "this man has done nothing wrong"},
    ],
    "asks": {"ref": "Luke 23:42", "words": "Jesus, remember me when You come into Your kingdom!"},
    "answer": {"ref": "Luke 23:43", "words": "Truly I tell you, today you will be with Me in Paradise"},
}
# The reading with the comma moved, as the study prints it. It is not the Berean: build-data.py proves it has the same
# words as the Berean sentence in the same order, and differs only in its punctuation.
COMMA = {"ref": "Luke 23:43", "berean": "Truly I tell you, today you will be with Me in Paradise",
         "moved": "Truly I tell you today, you will be with Me in Paradise"}
TRULY = {"book": "Luke", "phrase": "Truly I tell you", "with_today": "Truly I tell you, today", "only_in": "23:43"}

# 05 Now and then: the Bible's own words for each stage, each in its verse.
NOW_THEN = [
    {"stage": "Now", "name": "With Christ", "items": [("Luke 23:43", "today you will be with Me in Paradise"),
                                                      ("2 Corinthians 5:8", "at home with the Lord"),
                                                      ("Philippians 1:23", "far better indeed")]},
    {"stage": "The body", "name": "Asleep", "items": [("1 Thessalonians 4:13", "those who sleep in death")]},
    {"stage": "Then", "name": "Raised", "items": [("John 11:25", "Whoever believes in Me will live, even though he dies"),
                                                  ("1 Thessalonians 4:14", "God will bring with Jesus those who have fallen asleep in Him")]},
]

# A block quotation that prints a speaker's words without the verse's opening frame. The build proves the frame is
# exactly this and that the rest is word for word. The verse sheet shows the whole verse.
SPOKEN_BLOCKS = {"John 11:25–26": "Jesus said to her,"}

# Named exceptions to "a quote cited to several verses is in every one of them". Each must be used, or the build fails.
QUOTE_EXCEPTIONS = {("no one to comfort", "Lamentations 1:16"): "Lamentations 1:16 reads “no one nearby to comfort me”."}

# Quotations in the study that are not word for word the Berean. A design job may not change the study's words, so
# the page keeps them and marks each with the Berean's wording. The build proves the study's words are NOT in the
# verse and the Berean's are, so an entry cannot hide a real match or a wrong correction. Every entry must be used.
MISQUOTES = {
    ("05", "to be with Christ, which is far better indeed"): ("Philippians 1:23", "to depart and be with Christ, which is far better indeed"),
}

# Studies the text names in italics, each a folder under design/. data.js never depends on whether the folder exists;
# the build prints a warning for one without index.html. Every entry must be used.
STUDY_LINKS = {
    "The signs and works of Jesus": "the-signs-and-works-of-jesus-directions",
    "The hope to come": "the-hope-to-come-directions",
    "The book of Psalms": "praying-the-psalms-directions",
    "Fear, anxiety and despair": "fear-anxiety-and-despair-directions",
    "Covenants and promises": "covenants-and-promises-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "Witness and the nations: telling others about Jesus": "bearing-witness-directions",
    "What Scripture promises the sick": "illness-and-healing-directions",
    "Rulers and their choices": "rulers-and-their-choices-directions",
    "Chosen and kept: can I be sure?": "chosen-and-kept-directions",
}
# Every other italic in the text: words explained where they stand, and book titles. An italic on neither list fails.
ITALIC_TERMS = {"shiva", "lament", "Eikhah", "Tisha B'Av", "hesed", "providence", "gospel", "grace", "repent",
                "Ars moriendi", "The Rule and Exercises of Holy Dying", "intermediate state", "age of accountability",
                "election"}

# Quoted words that are not Scripture: (source shown on the page, held source key or None, the part of it searched).
# The held key names a file in HELD; the part is a BFM article or a confession chapter, so a quotation cannot pass on
# words from elsewhere in the document. None means not held on this PC: the page marks it.
OUTSIDE_QUOTES = {
    "contend for the sanctity of all human life from conception to natural death": ("Baptist Faith and Message 2000, article XV", "bfm", "XV"),
    "the righteous in their resurrected and glorified bodies": ("Baptist Faith and Message 2000, article X", "bfm", "X"),
    "as soon as they are capable of moral action": ("Baptist Faith and Message 2000, article III", "bfm", "III"),
    "will never fall away from the state of grace": ("Baptist Faith and Message 2000, article V", "bfm", "V"),
    "There is no salvation apart from personal faith in Jesus Christ as Lord": ("Baptist Faith and Message 2000, article IV", "bfm", "IV"),
    "neither die nor sleep": ("Second London Baptist Confession (1677), chapter 31", "lbc", "XXXI"),
    "received into paradise where they are with Christ": ("Second London Baptist Confession (1677), chapter 31", "lbc", "XXXI"),
    "Elect infants dying in infancy are regenerated and saved by Christ through the Spirit": ("Second London Baptist Confession (1677), chapter 10", "lbc", "X"),
    "in God's grace and friendship, but still imperfectly purified": ("Catechism of the Catholic Church, paragraph 1030", None, None),
    "undergo purification": ("Catechism of the Catholic Church, paragraph 1030", None, None),
    "We should not despair of the eternal salvation of persons who have taken their own lives": ("Catechism of the Catholic Church, paragraph 2283", None, None),
}
# Held sources, relative to the BibleProject folder. "bfm" is a text file whose articles start "X. Title"; "lbc" is
# the Text Creation Partnership's 1677 confession (A34255, CC0), held in parts under one key in a library page file.
HELD = {
    "bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"},
    "lbc": {"path": "Website/public/content/teacher-library/pages/cb8d39754a612df2924fe02750d9e7d3b6bb47e673dbad6df312f8929919cbf4.json",
            "key": "held-c2323649049725fade9d6516655dab79"},
}

# Quoted words that are the study's own terms or titles, keyed by where they stand. Every entry must be used.
OWN_TERMS = {
    ("01", "seven"): "the meaning of shiva",
    ("03", "How"): "the meaning of Eikhah",
    ("03", "call to mind"): "the study's echo of Lamentations 3:21, where the Berean has \"I call this to mind\"",
    ("04", "the art of dying"): "the meaning of Ars moriendi",
    ("q1", "Infant Salvation"): "a sermon title",
    ("q1", "The Salvation of the 'Little Ones'"): "an article title",
    ("q2", "selfish"): "a word some say of the dead",
}

# What each [source:…] note in the text is labelled on the page.
SOURCE_LABELS = {"lbc": "Older Baptists", "holders": "Who has held this hope", "ccc": "The Catholic Church"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles III, IV, V, X and XV, quoted in short phrases, each found by script in its own article in the copy held on this PC. The site's doctrinal standard."),
    ("The Second London Baptist Confession (1677)", "Chapters 10 and 31, quoted in short phrases, each found by script in its own chapter in the Text Creation Partnership text (A34255, public domain) held on this PC. Spelling there is of its time (“holyness”); the study modernises it."),
    ("The Catechism of the Catholic Church", "Paragraphs 1030 and 2283, quoted in short phrases. Not held on this PC: the page marks each quotation as not yet compared."),
    ("Seventh-day Adventist and Jehovah's Witness teaching", "Described, not quoted."),
    ("C. H. Spurgeon; R. Albert Mohler and Daniel Akin", "Named with the titles of a sermon and an article. Not read for this page."),
    ("Jeremy Taylor; the Ars moriendi", "Named, not quoted."),
]
