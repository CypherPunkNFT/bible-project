"""The lists the Children and the home page draws beside the study's own text. build-data.py and figures.py check
every phrase here against the Berean or the held Baptist Faith and Message, so a row cannot claim words its verse does
not hold. These are this page's choices, not a count of everything Scripture says about families."""

TITLE = ("Children", "and the home")  # ink, then the turn in gold italic; joined they must equal the study's title
TRAIL = ("Living the Christian Life", "/study/theology?area=life")

# The four kinds of sentence the study names in its frame. "sample" is the frame's own example, checked in "ref".
# "asks" is the frame's own verb for what each kind asks of the reader; "way" is the close's wording.
KINDS = {
    "command": {"name": "Command", "sample": "teach them diligently to your children", "ref": "Deuteronomy 6:7",
                "asks": "obeyed", "way": "yours to obey", "mark": "doorpost"},
    "song": {"name": "Song", "sample": "Children are indeed a heritage from the LORD", "ref": "Psalm 127:3",
             "asks": "sung and trusted", "way": "yours to sing and trust", "mark": "steps"},
    "story": {"name": "Story", "sample": "Isaac … loved Esau; but Rebekah loved Jacob", "ref": "Genesis 25:28",
              "asks": "learned from", "way": "yours to learn from", "mark": "road"},
    "saying": {"name": "Saying", "sample": "Train up a child in the way he should go", "ref": "Proverbs 22:6",
               "asks": "applied with wisdom", "way": "wisdom about how things usually go", "mark": "scales"},
}

# The kind of sentence each block quotation is, by its reference. This is the page's reading of the study, which names
# the kind for most of them in its own words; the README says so. None means none of the four, with the reason shown.
QUOTE_KINDS = {
    "Deuteronomy 6:6–7": "command",
    "Deuteronomy 6:4–5": "command",
    "Deuteronomy 6:7": "command",
    "Deuteronomy 6:20": "command",
    "Psalm 78:4": "song",
    "2 Timothy 1:5": None,
    "Psalm 127:1–2": "song",
    "Psalm 128:3": "song",
    "Genesis 25:27–28": "story",
    "Genesis 37:3–4": "story",
    "1 Samuel 2:23–24": "story",
    "1 Samuel 3:13": "story",
    "Proverbs 22:6": "saying",
    "Ephesians 6:1–4": "command",
    "Colossians 3:21": "command",
    "Luke 15:20": "story",
}
NO_KIND = {"2 Timothy 1:5": "A letter remembering a family's faith: none of the four kinds"}

# Quotations whose verse the paragraph does not cite: (section, phrase) → the reference the phrase must be in.
PINNED = {
    ("opening", "Children are indeed a heritage from the LORD"): "Psalm 127:3",
    ("opening", "Isaac … loved Esau; but Rebekah loved Jacob"): "Genesis 25:28",
    ("opening", "Train up a child in the way he should go"): "Proverbs 22:6",
}

# A quotation that differs from the Berean only in British spelling: (section, phrase) → (reference, Berean words).
# The build proves that the two differ only by the spellings in BRITISH, and that the Berean words are in the verse.
SPELLING = {("q1", "honour your father and mother"): ("Ephesians 6:2", "Honor your father and mother")}
BRITISH = {"honour": "honor"}

# Quoted words that are the study's own terms or translations, keyed by where they stand. Every entry must be used.
OWN_TERMS = {
    ("01", "Hear"): "the meaning of the Hebrew word Shema",
    ("02", "wise son"): "a name from the Passover Haggadah",
    ("03", "songs of ascents"): "the psalms' headings, which the site's Berean text does not hold as verses",
    ("03", "house"): "a word the study explains",
    ("06", "according to his way"): "the study's word-for-word rendering of the Hebrew of Proverbs 22:6",
}

# Quoted words that are not Scripture: (source shown on the page, held source key, part searched).
OUTSIDE_QUOTES = {
    "to teach their children spiritual and moral values": ("Baptist Faith and Message 2000, article XVIII", "bfm", "XVIII"),
    "from the moment of conception, are a blessing and heritage from the Lord": ("Baptist Faith and Message 2000, article XVIII", "bfm", "XVIII"),
    "through consistent lifestyle example and loving discipline": ("Baptist Faith and Message 2000, article XVIII", "bfm", "XVIII"),
}
HELD = {"bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"}}

# Studies the text names in italics, each a folder under design/. The build warns for a folder with no index.html yet;
# data.js does not depend on it. Every entry must be used.
STUDY_LINKS = {
    "Saved by grace: how God forgives and changes us": "grace-faith-and-salvation-directions",
    "The book of Psalms": "praying-the-psalms-directions",
    "Sexuality, singleness and divorce": "marriage-sexuality-and-singleness-directions",
    "Grief and dying": "grief-and-dying-directions",
    "God: who He is and what He does": "knowing-god-directions",
    "The wisdom books": "the-wisdom-books-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
    "The Ten Commandments": "the-ten-commandments-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "Life together: belonging to a church": "life-together-directions",
}
# Every other italic: words explained where they stand. An italic on neither list fails the build.
ITALIC_TERMS = {"Shema", "mezuzah", "tefillin", "seder"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Article XVIII (the family), quoted in three short phrases, each found by script in that article in the copy held on this PC. The study still asks for a check against bfm.sbc.net, because the convention can amend the confession."),
    ("Jewish practice", "The Shema, the mezuzah, tefillin and the Passover Haggadah are described in the study's words, not quoted."),
]
