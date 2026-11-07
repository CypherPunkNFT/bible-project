"""The lists the Fear, anxiety and despair page draws beside the study's own text. build-data.py checks every phrase
here against the Berean (or, for the one outside source held on this PC, against that copy), so a drawing cannot claim
words its verse does not hold. These are this page's choices, not a count."""
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
PROJECT = WEBSITE.parent

TITLE = ("Fear, anxiety", "and despair")

# The signature: someone's darkest words, and the next thing the text records. "next" None means the passage has no
# turn: the row runs to "end" and stops. The distance is counted by script, in verses of the Berean, never typed.
# The cry is the complaint itself, not a wish to die: the page never headlines those words (safe messaging), so
# Jonah 4:3 is read in part 03 but has no row here.
ROWS = [
    {"id": "moses", "who": "Moses", "part": "01", "cry_ref": "Numbers 11:14", "cry": "I cannot carry all these people by myself",
     "next_ref": "Numbers 11:16", "next": "Bring Me seventy of the elders of Israel", "actor": "God answers"},
    {"id": "elijah", "who": "Elijah", "part": "02", "cry_ref": "1 Kings 19:4", "cry": "I have had enough, LORD",
     "next_ref": "1 Kings 19:5", "next": "Suddenly an angel touched him and said, Get up and eat", "actor": "God answers"},
    {"id": "job", "who": "Job", "part": "03", "cry_ref": "Job 3:20", "cry": "Why is light given to the miserable",
     "next_ref": "Job 38:1", "next": "Then the LORD answered Job out of the whirlwind", "actor": "God answers"},
    {"id": "jeremiah", "who": "Jeremiah", "part": "03", "cry_ref": "Jeremiah 20:14", "cry": "Cursed be the day I was born",
     "next_ref": "Jeremiah 21:1", "next": "This is the word that came to Jeremiah from the LORD", "actor": "The word still comes"},
    {"id": "korah", "who": "The sons of Korah", "part": "04", "cry_ref": "Psalm 42:3", "cry": "Where is your God?",
     "next_ref": "Psalm 42:5", "next": "Put your hope in God", "actor": "The singer answers his own soul"},
    {"id": "heman", "who": "Heman", "part": "04", "cry_ref": "Psalm 88:14", "cry": "Why do You hide Your face from me?",
     "next_ref": None, "end": "Psalm 88:18", "next": "darkness is my closest companion", "actor": "No turn in the psalm"},
    {"id": "david", "who": "David", "part": "05", "cry_ref": "Psalm 56:3", "cry": "When I am afraid",
     "next_ref": "Psalm 56:3", "next": "I put my trust in You", "actor": "Trust in the same sentence"},
    {"id": "paul", "who": "Paul", "part": "close", "cry_ref": "2 Corinthians 1:8", "cry": "we despaired even of life",
     "next_ref": "2 Corinthians 1:9", "next": "but in God, who raises the dead", "actor": "God who raises the dead"},
]

# Part 01: what Moses says he cannot do, and God's answer, word against word (the part's own Consider question).
MATCH = {"cry": "Numbers 11:14", "answer": "Numbers 11:17", "pairs": [
    ("I cannot carry", "They will help you bear"),
    ("too burdensome for me", "the burden of the people"),
    ("by myself", "by yourself"),
]}

# Part 02: the order of God's care for Elijah, each step in its verse's own words (the part's Consider question).
CARE = [
    ("1 Kings 19:5", "fell asleep", "Sleep"),
    ("1 Kings 19:6", "a cake of bread baked over hot coals, and a jar of water", "Bread and water"),
    ("1 Kings 19:7", "A second time", "Again"),
    ("1 Kings 19:8", "strengthened by that food", "The road"),
    ("1 Kings 19:9", "What are you doing here, Elijah?", "A question"),
    ("1 Kings 19:12", "a still, small voice", "Quiet"),
    ("1 Kings 19:13", "What are you doing here, Elijah?", "The question again"),
    ("1 Kings 19:15", "Go back by the way you came", "Work"),
    ("1 Kings 19:16", "Elisha son of Shaphat", "A companion"),
    ("1 Kings 19:18", "I have reserved seven thousand in Israel", "Not alone"),
]

# Part 03: Jeremiah 20:7–18 verse by verse. The verses named here are the ones the study quotes, each with this
# study's one-word reading of it; the rest are drawn as unlabelled verses (20:17 is deliberately never quoted).
SWING = {"range": "Jeremiah 20:7–18", "marks": [
    ("Jeremiah 20:7", "You have deceived me", "Accusation"),
    ("Jeremiah 20:9", "a fire burning in my heart", "The word he cannot hold in"),
    ("Jeremiah 20:11", "the LORD is with me like a fearsome warrior", "Trust"),
    ("Jeremiah 20:13", "Sing to the LORD! Praise the LORD!", "Praise"),
    ("Jeremiah 20:14", "Cursed be the day I was born!", "Curse"),
    ("Jeremiah 20:18", "Why did I come out of the womb", "A question, and the chapter ends"),
], "adjacent": ("Jeremiah 20:13", "Jeremiah 20:14")}

# Part 04: the refrain is found by script, never typed as verse numbers; it must come exactly three times.
REFRAIN = {"range": "Psalm 42:1–43:5", "words": "Why are you downcast, O my soul?", "times": 3}
DARK = {"range": "Psalm 88:1–18", "trust": [
    ("Psalm 88:1", "the God of my salvation"),
    ("Psalm 88:1", "day and night I cry out before You"),
    ("Psalm 88:13", "in the morning my prayer comes before You"),
]}

# Part 05: Psalm 46's "though" clauses, and the refrain that answers them.
THOUGH = {"ref": "Psalm 46:2–3", "lead": "Therefore we will not fear", "clauses": [
    "the earth is transformed", "the mountains are toppled into the depths of the seas",
    "their waters roar and foam", "the mountains quake in the surge"],
    "refrain": ("The LORD of Hosts is with us", ["Psalm 46:7", "Psalm 46:11"]),
    "afraid": ("Psalm 56:3", "When I am afraid", "I put my trust in You")}

# Part 06: every "do not fear" in the two readings, with the reason that follows it in the same verse. The script
# finds every such command in the readings and fails if one is missing here.
REASONS = {"ranges": ["Isaiah 41:8–13", "Isaiah 43:1–7"], "items": [
    ("Isaiah 41:10", "Do not fear", "for I am with you"),
    ("Isaiah 41:10", "do not be afraid", "for I am your God"),
    ("Isaiah 41:13", "Do not fear", "I will help you"),
    ("Isaiah 43:1", "Do not fear", "for I have redeemed you"),
    ("Isaiah 43:5", "Do not be afraid", "for I am with you"),
], "when": ("Isaiah 43:2", "When you pass through the waters, I will be with you")}

# Drawn on the hero: the motto's words, each checked in its verse.
MOTTO_FROM = [("1 Kings 19:6", "by his head was a cake of bread"), ("1 Kings 19:13", "a voice came to him and said")]
ELDERS = ("Numbers 11:16", "seventy of the elders of Israel", 70)

# Studies the text names in italics. A study with a mock-up on this PC links to it; the build fails if the folder has
# no index.html. Two are being designed beside this one in the same run, so they are named only; the last step links them.
STUDY_NAMES = {
    "What Scripture promises the sick": "/mockups/illness-and-healing-directions/",
    "The wisdom books": None,
    "Following Jesus and the Sermon on the Mount": "/mockups/following-jesus-directions/",
    "Reading the Bible well: where to start and how to keep going": None,
    "Covenants and promises": "/mockups/covenants-and-promises-directions/",
    "Faith under pressure": "/mockups/faith-under-pressure-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "Grief and dying": None,
}

# Quotations the study gives that are not the Berean's wording at the verse it names. The build proves each is NOT in
# that verse and that the Berean's own words given here ARE, so a corrected text makes the entry stale and fails.
# The page shows each with a mark and the Berean's words; the owner decides the wording.
WORDING = {
    ("01", "Kill me now"): ("Numbers 11:15", "please kill me right now"),
    ("06", "Do not fear, I am with you"): ("Isaiah 41:10", "Do not fear, for I am with you"),
    ("questions", "deeply grieved"): ("Mark 14:34", "My soul is consumed with sorrow to the point of death"),
}

# Short quotations pinned to their verse, because two words alone could be found almost anywhere.
PINNED_QUOTES = {
    ("05", "Be still"): "Psalm 46:10",
    ("06", "do not fear"): "Isaiah 41:10",
    ("close", "do not fear"): "Isaiah 41:10",
}

# Quoted words that are the study's own, not a quotation from anywhere.
OWN_TERMS = {
    ("01", "I cannot carry this by myself"), ("01", "I cannot do this alone"), ("01", "I can't do this anymore"),
    ("03", "why"), ("05", "I am never afraid"), ("06", "When you pass through"),
    ("06", "I will"), ("06", "if you pass through the waters"), ("close", "We despaired... but God."),
}

# Quoted words from outside Scripture: (name, key of a held copy or None).
SOURCE_ROOTS = [PROJECT]
SOURCES_HELD = {
    "foundation": {"name": "the site's doctrinal foundation, which quotes the Baptist Faith and Message 2000",
                   "path": PROJECT / "DOCTRINAL-FOUNDATION.md"},
}
OUTSIDE_QUOTES = {
    ("questions", "contend for the sanctity of all human life from conception to natural death"):
        ("Baptist Faith and Message 2000, article XV", "foundation"),
    ("02", "The Minister's Fainting Fits"): ("Charles Spurgeon, Lectures to My Students (title of a lecture)", None),
    ("05", "A Mighty Fortress Is Our God"): ("Martin Luther's hymn, by its English title", None),
}

# The study's two "[source:…]" notes, by key.
NOTE_SOURCES = {
    "spurgeon-lectures": "Charles Spurgeon, Lectures to My Students",
    "luther-hymn": "Martin Luther, Ein feste Burg (A Mighty Fortress Is Our God)",
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Article XV, quoted in one phrase, checked against the site's doctrinal foundation. The site's doctrinal standard."),
    ("Charles Spurgeon, Lectures to My Students", "Named for the lecture “The Minister's Fainting Fits”; not quoted, not held on this PC."),
    ("Martin Luther, “A Mighty Fortress Is Our God”", "Named as drawing on Psalm 46; not quoted, not held on this PC."),
]

NOT_SCRIPTURE: tuple = ()
