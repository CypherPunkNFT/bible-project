"""The lists The wisdom books page draws beside the study's own text. figures.py checks every Berean phrase here against
its verse, and every verse here must lie inside a passage the study itself cites, so a figure cannot claim words its
source does not hold or bring in a verse the study does not read. These are this page's choices, not a census.

"name" and "label" are always the page's own short words; "words" is always the Berean's own wording at "ref"."""

TITLE = ("The wisdom", "books")  # ink, then the turn in gold italic; joined they must equal the title

# The speaker line over every printed passage: who speaks, what kind of saying it is, and, where Scripture itself
# judges the speaker, that verdict in Scripture's words. Keyed by the passage's reference; every one must be used.
SPEAKERS = {
    "Job 28:28": {"who": "God, as the poem reports Him", "kind": "The poem's last word"},
    "Job 28:12": {"who": "The poem of Job 28", "kind": "A searching question"},
    "Job 1:21": {"who": "Job, on the day of his losses", "kind": "A report: worship"},
    "Job 38:4": {"who": "God, from the whirlwind", "kind": "A question"},
    "Job 42:5": {"who": "Job, after God has spoken", "kind": "A report: his answer",
                 "verdict": {"words": "as My servant Job has", "ref": "Job 42:7"}},
    "Proverbs 1:7": {"who": "The book's own motto", "kind": "A proverb"},
    "Proverbs 3:5–6": {"who": "A father, to his son", "kind": "A talk"},
    "Proverbs 26:4–5": {"who": "Two proverbs, side by side", "kind": "Proverbs that need judgement"},
    "Proverbs 16:9": {"who": "A proverb", "kind": "How life usually goes"},
    "Proverbs 22:6": {"who": "A proverb", "kind": "A proverb, not a promise"},
    "Ecclesiastes 3:11": {"who": "The Teacher", "kind": "What he sees"},
    "Ecclesiastes 12:13–14": {"who": "The closing voice", "kind": "The conclusion"},
    "Song of Songs 8:6–7": {"who": "The Song, near its end", "kind": "A song"},
    "Job 28:20–28": {"who": "The poem of Job 28", "kind": "A searching question, and its answer"},
}

# 00 Who is speaking? Four books, each a kind of saying with its voices. "shape" is the mark drawn for the kind, so
# colour is never the only carrier. "floor" is where the column meets the shared line; the Song has "end" instead.
FLOOR_NAME = "The fear of the LORD"  # the page's name for the shared line; each point quotes its own verse
BOOKS = [
    {"book": "Job", "kind": "A report of a debate", "shape": "debate", "voices": [
        {"name": "Job", "words": "May the day of my birth perish", "ref": "Job 3:3"},
        {"name": "Eliphaz and his two friends", "words": "you have not spoken about Me accurately", "ref": "Job 42:7",
         "verdict": True},
        {"name": "Elihu", "words": "Elihu son of Barachel the Buzite", "ref": "Job 32:2"},
        {"name": "God, from the whirlwind", "words": "Then the LORD answered Job out of the whirlwind", "ref": "Job 38:1"},
        {"name": "The narrator", "words": "the LORD restored his prosperity", "ref": "Job 42:10"}],
     "floor": [{"words": "the fear of the Lord", "ref": "Job 28:28"}]},
    {"book": "Proverbs", "kind": "Proverbs", "shape": "pair", "voices": [
        {"name": "A father", "words": "Listen, my son, to your father’s instruction", "ref": "Proverbs 1:8"},
        {"name": "Wisdom", "words": "Wisdom calls out in the street", "ref": "Proverbs 1:20"},
        {"name": "Folly", "words": "Stolen water is sweet", "ref": "Proverbs 9:17"},
        {"name": "The sayings", "words": "The proverbs of Solomon", "ref": "Proverbs 10:1"}],
     "floor": [{"words": "The fear of the LORD", "ref": "Proverbs 1:7"}, {"words": "The fear of the LORD", "ref": "Proverbs 9:10"}]},
    {"book": "Ecclesiastes", "kind": "A searching question", "shape": "arc", "voices": [
        {"name": "The Teacher", "words": "What does a man gain from all his labor", "ref": "Ecclesiastes 1:3"},
        {"name": "The closing voice", "words": "pondered, searched out, and arranged many proverbs", "ref": "Ecclesiastes 12:9"}],
     "floor": [{"words": "Fear God", "ref": "Ecclesiastes 12:13"}]},
    {"book": "Song of Songs", "kind": "A song", "shape": "wave", "voices": [
        {"name": "The woman", "words": "Let him kiss me with the kisses of his mouth", "ref": "Song of Songs 1:2"},
        {"name": "The man", "words": "My sister, my bride", "ref": "Song of Songs 4:12"},
        {"name": "The daughters of Jerusalem", "words": "How is your beloved better than others", "ref": "Song of Songs 5:9"}],
     "end": {"words": "love is as strong as death", "ref": "Song of Songs 8:6"}},
]
SONG_NOTE = "The Song does not name the fear of the LORD, and this page does not add it."  # the page's own words

# 01 The shaft: the poem's own order going down (verse order is checked), then the line that rises.
SHAFT_RANGE = "Job 28:1–28"
SHAFT = [
    {"label": "A mine for silver", "words": "a mine for silver", "ref": "Job 28:1"},
    {"label": "The farthest darkness", "words": "he probes the farthest recesses for ore in deepest darkness", "ref": "Job 28:3"},
    {"label": "A path no falcon has seen", "words": "no falcon’s eye has seen it", "ref": "Job 28:7"},
    {"label": "The ocean depths", "words": "It is not in me", "ref": "Job 28:14"},
    {"label": "Gold", "words": "It cannot be bought with gold", "ref": "Job 28:15"},
    {"label": "Abaddon and Death", "words": "We have heard a rumor about it", "ref": "Job 28:22"},
]
SHAFT_UP = [{"label": "God knows the way", "words": "But God understands its way, and He knows its place", "ref": "Job 28:23"},
            {"label": "For us", "words": "the fear of the Lord, that is wisdom", "ref": "Job 28:28"}]
SHAFT_BOTTOM = "Wisdom is not down there."  # must be the study's own words

# 02 What God asks: each word must be in its verse; the order must be the text's order.
QUESTIONS = [
    ("foundations", "Job 38:4"), ("morning stars", "Job 38:7"), ("proud waves", "Job 38:11"), ("dawn", "Job 38:12"),
    ("snow", "Job 38:22"), ("desert", "Job 38:26"), ("lioness", "Job 38:39"), ("raven", "Job 38:41"),
    ("mountain goats", "Job 39:1"), ("wild donkey", "Job 39:5"), ("wild ox", "Job 39:9"), ("ostrich", "Job 39:13"),
    ("horse", "Job 39:19"), ("eagle", "Job 39:27"), ("Behemoth", "Job 40:15"), ("Leviathan", "Job 41:1"),
]
KNOWS = {"reader": {"words": "the sons of God came to present themselves before the LORD", "ref": "Job 1:6"},
         "reader_line": "The reader is let into the council in heaven.",   # the page's own words
         "job_line": "Job is never told about this, not even in God's speeches."}  # must be the study's own words
VERDICTS = [
    {"who": "Job", "lines": [{"words": "Would you really annul My justice?", "ref": "Job 40:8"},
                             {"words": "as My servant Job has", "ref": "Job 42:7"}]},
    {"who": "Eliphaz and his two friends", "lines": [{"words": "you have not spoken about Me accurately", "ref": "Job 42:7"}]},
]

# 03 Two doors and two tables.
DOORS = [{"label": "The front door", "words": "The fear of the LORD is the beginning of knowledge", "ref": "Proverbs 1:7"},
         {"label": "The back door", "words": "The fear of the LORD is the beginning of wisdom", "ref": "Proverbs 9:10"}]
TABLES = [
    {"host": "Wisdom", "call": "Proverbs 9:4", "offers": [{"words": "Come, eat my bread and drink the wine I have mixed", "ref": "Proverbs 9:5"},
                                                         {"words": "Leave your folly behind, and you will live", "ref": "Proverbs 9:6"}]},
    {"host": "Folly", "call": "Proverbs 9:16", "offers": [{"words": "Stolen water is sweet, and bread eaten in secret is tasty", "ref": "Proverbs 9:17"}],
     "unsaid": {"words": "But they do not know that the dead are there", "ref": "Proverbs 9:18"}},
]

# 04 The pair, and three sayings set beside what Scripture or the study puts next to them.
PAIR = [{"head": "Do not answer", "ref": "Proverbs 26:4"}, {"head": "Answer", "ref": "Proverbs 26:5"}]
BESIDE = [
    {"saying": {"words": "The LORD does not let the righteous go hungry", "ref": "Proverbs 10:3"},
     "beside": {"words": "Better a little with righteousness than great gain with injustice", "ref": "Proverbs 16:8"}},
    {"saying": {"words": "The fear of the LORD prolongs life", "ref": "Proverbs 10:27"},
     "beside": {"words": "A righteous man perishing in his righteousness", "ref": "Ecclesiastes 7:15"}},
    {"saying": {"words": "Train up a child in the way he should go", "ref": "Proverbs 22:6"},
     "beside": {"study": "It is not a guarantee that every child raised in faith will follow Christ"}},
]

# 05 Fourteen pairs, read out of the verses by the build; the study must say how many.
TIMES_RANGE = "Ecclesiastes 3:2–8"
TIMES_STUDY = "Fourteen pairs"
TIMES_COUNT = 14

# 06 The refrains. The clause must be the same in each verse, and the study must say "Three times".
REFRAIN = {"words": "Do not arouse or awaken love until the time is right",
           "refs": ["Song of Songs 2:7", "Song of Songs 3:5", "Song of Songs 8:4"], "range": "Song of Songs 1:1–8:14"}
BELONGING = [("My beloved is mine", "I am his", "Song of Songs 2:16"),
             ("I belong to my beloved", "he belongs to me", "Song of Songs 6:3"),
             ("I belong to my beloved,", "his desire is for me", "Song of Songs 7:10")]
# A subheading followed by exactly two notes of the same kind, which the page sets side by side at equal size.
PAIRED_HEADS = {"Two readings, both Baptist": "read"}

STUDY_LINKS = {
    "What Scripture promises the sick": "illness-and-healing-directions",
    "Fear, anxiety and despair": "fear-anxiety-and-despair-directions",
    "Angels, demons and spiritual powers": "angels-demons-and-spiritual-powers-directions",
    "Sexuality, singleness and divorce": "marriage-sexuality-and-singleness-directions",
    "Christ in the Old Testament": "christ-in-the-old-testament-directions",
    "Money, possessions and generosity": "money-possessions-and-generosity-directions",
    "Grief and dying": "grief-and-dying-directions",
    "Children and the home": "children-and-the-home-directions",
    "The hope to come": "the-hope-to-come-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
}
ITALIC_TERMS = {"Orations against the Arians"}

# Quotations from outside Scripture: phrase → (source name, held key or None, article). None means not held on this
# PC: the page marks it as not yet compared.
OUTSIDE_QUOTES = {
    "begotten, not made": ("the Nicene Creed", None, None),
    "cheerfully, regularly, systematically, proportionately, and liberally": ("the Baptist Faith and Message 2000, article XIII", "bfm", "XIII"),
    "There is no salvation apart from personal faith in Jesus Christ as Lord": ("the Baptist Faith and Message 2000, article IV", "bfm", "IV"),
    "one man and one woman in covenant commitment for a lifetime": ("the Baptist Faith and Message 2000, article XVIII", "bfm", "XVIII"),
}
HELD = {"bfm": {"path": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"}}

# Quoted words that are the study's own terms, keyed by the section they stand in. Every entry must be used.
OWN_TERMS = {
    ("01", "LORD"): "the printed form of God's name, explained where it stands",
    ("01", "Lord"): "the printed form of the word for master, explained where it stands",
}

SOURCE_LABELS = {"talmud-shabbat": "In Jewish reading"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles IV, XIII and XVIII, quoted in short phrases, each found by script in its own article in the copy held on this PC. The site's doctrinal standard."),
    ("The Nicene Creed", "One phrase, “begotten, not made”. Not held on this PC: marked on the page as not yet compared."),
    ("Athanasius, the Talmud, the Mishnah, the Targum, Origen, Bernard of Clairvaux, John Gill, Charles Spurgeon, Daniel Akin", "Named or paraphrased by the study, not quoted. Not read for this page; each still carries the study's note to check."),
]
