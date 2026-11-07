"""The lists the Life together page draws beside the study's own text. build-data.py checks every phrase here against
the Berean, as whole words in the one verse named, so a row cannot claim words its verse does not hold. Which words are
"the gift" and which "the command" is the study's own reading, quoted in "study_says"; a script proves the words and
the distance between them, not the reading."""

# How far the gift stands from its command, counted in verses in book order. build-data.py computes the distance from
# the references and refuses a row whose stated depth does not match it. A gift in another book is refused.
DEPTHS = {0: "In the same verse", 1: "One verse away", 2: "Two verses away"}

# The ground under the command. Only pairs the study itself names are drawn with a root; "study_says" is the study's
# own sentence naming the pair, and build-data.py proves it is in content.md word for word. A command whose ground the
# study does not name is drawn with no root ("gift": None), so the page does not supply one the text does not give.
ROOTS = [
    {"part": "01", "command": ("John 13:34", "Love one another"), "gift": ("John 13:34", "As I have loved you"), "depth": 0,
     "study_says": 'The command is "Love one another." The ground under it is "As I have loved you."'},
    {"part": "02", "command": ("Galatians 6:2", "Carry one another’s burdens"), "gift": None, "depth": None, "study_says": None},
    {"part": "03", "command": ("1 John 2:1", "so that you will not sin"), "gift": ("1 John 1:9", "He is faithful and just to forgive us our sins"), "depth": 2,
     "study_says": "The command is real. But it comes after the light, the blood and the promise."},
    {"part": "04", "command": ("Matthew 18:15", "go and confront him privately"), "gift": None, "depth": None, "study_says": None},
    {"part": "05", "command": ("Hebrews 10:24", "let us consider how to spur one another on"), "gift": ("Hebrews 10:23", "He who promised is faithful"), "depth": 1,
     "study_says": "Before any instruction about each other, there is the faithfulness of God."},
    {"part": "06", "command": ("Philippians 2:2", "being like-minded, having the same love"), "gift": ("Philippians 2:1", "any comfort from His love"), "depth": 1,
     "study_says": "This is the gift, and it comes first."},
    {"part": "06", "command": ("Ephesians 4:3", "with diligence to preserve"), "gift": ("Ephesians 4:3", "the unity of the Spirit"), "depth": 0,
     "study_says": "The Spirit has given it. Their part is to keep it"},
    {"part": "06", "command": ("Romans 15:7", "Accept one another"), "gift": ("Romans 15:7", "just as Christ accepted you"), "depth": 0,
     "study_says": "he ends with the gift under the command"},
]

# Matthew 18:15-17: four steps and the one aim, each phrase in its verse. "people" is how far the matter goes, in the
# page's own words; it is drawn, not counted from the verse.
STEPS = {
    "aim": ("Matthew 18:15", "you have won your brother over"),
    "steps": [
        {"name": "Privately", "said": ("Matthew 18:15", "go and confront him privately"), "if": ("Matthew 18:15", "If he listens to you"), "people": "the two of you"},
        {"name": "One or two others", "said": ("Matthew 18:16", "take one or two others along"), "if": ("Matthew 18:16", "But if he will not listen"), "people": "two or three witnesses"},
        {"name": "The church", "said": ("Matthew 18:17", "tell it to the church"), "if": ("Matthew 18:17", "If he refuses to listen to them"), "people": "the congregation"},
        {"name": "Outside the fellowship", "said": ("Matthew 18:17", "regard him as you would a pagan or a tax collector"),
         "if": ("Matthew 18:17", "if he refuses to listen even to the church"), "people": "still someone to win back"},
    ],
    "still": ("2 Thessalonians 3:15", "warn him as a brother"),
}

# Quoted phrases that the verse puts after "not" and the study quotes on purpose, to name what the verse warns
# against. Each is named with why; any other phrase that drops its verse's "not" is refused.
NEGATED_ON_PURPOSE = {
    "overwhelmed by excessive sorrow": "2 Corinthians 2:7 says the church should forgive \"so that he will not be overwhelmed\"; the study names that danger.",
    "meeting together": "Hebrews 10:25 reads \"Let us not neglect meeting together\": the \"not\" belongs to \"neglect\", so the verse asks for meeting together.",
}

# Corrections applied in memory before the build, never written to content.md (the design brief does not allow this
# job to change the study's words). Each must match exactly once, so a fix made in content.md retires it.
TEXT_PATCHES = [
    {"old": '"to agree in the Lord" (Philippians 4:2)', "new": '"to agree with each other in the Lord" (Philippians 4:2)',
     "why": "The Berean reads “I urge Euodia and Syntyche to agree with each other in the Lord”; the study's quotation dropped "
            "“with each other” without marking it. The page shows the verse's own words. Needs the owner's word, then a fix in content.md."},
]

# Crisis numbers in the care notes: (number, life.json entry that holds it, or None if the site's list does not hold it
# yet). Each number must be in content.md as a whole number; a held one must match life.json.
CRISIS = [
    ("988", "988-lifeline"), ("024", "spain-024"), ("800 911 2000", "mexico-linea-de-la-vida"), ("188", "brazil-cvv"),
    ("911", "emergency-911"), ("1-800-799-7233", "domestic-violence-hotline"), ("1-800-422-4453", "childhelp-hotline"),
    ("112", None), ("190", None), ("016", None), ("180", None), ("100", None),
]

# Studies the text names in italics, mapped to a mock-up folder in design/ that existed when this list was written
# (2026-11-07), or None. build-data.py proves each listed folder exists and writes the link itself. This map is fixed by
# hand: a folder another job adds later changes nothing until this list is edited.
STUDY_LINKS = {
    "The church and its calling": "the-church-and-its-calling-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
    "Baptism and the Lord's Supper: the two things Jesus told His church to do": None,
    "The Holy Spirit": None,
    "Money, possessions and generosity": None,
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "what-the-cross-accomplishes-directions",
    "Chosen and kept: can I be sure?": None,
    "What Scripture promises the sick": "illness-and-healing-directions",
    "A new creation: what changes when you believe": "a-new-creation-directions",
    "The hope to come": "the-hope-to-come-directions",
    "Who do you say that I am? Who Jesus really is": "who-do-you-say-that-i-am-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
}

# Quoted words that are not Scripture, each named with where it comes from. Neither confession is held in full on this
# PC, so these are compared by eye, not by script; the README says so. They pass only where no Bible reference follows.
OUTSIDE_QUOTES = {
    "autonomous local congregation of baptized believers": "Baptist Faith and Message 2000, article VI",
    "operates under the Lordship of Christ through democratic processes": "Baptist Faith and Message 2000, article VI",
    "is prerequisite to the privileges of church membership and to the Lord's Supper": "Baptist Faith and Message 2000, article VII",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "Baptist Faith and Message 2000, article IV",
    "under the Censures and Government thereof, according to the Rule of Christ": "Second London Baptist Confession (1677), chapter 26",
    "all Believers are bound to joyn themselves to particular Churches, when and where they have opportunity so to do": "Second London Baptist Confession (1677), chapter 26",
}

# Quoted words that are the study's own terms or examples, not quotations from anywhere, each with where it is used.
# They pass only where no Bible reference follows them.
OWN_TERMS = {
    "one another": "the study's name for the commands it reads (lead)",
    "because": "the word the habit tells the reader to look for (frame)",
    "some": "the word 1 John 1:9 does not say (part 03)",
    "encourage everyone in the same way": "what Hebrews 10:24 does not say, in the study's words (part 05)",
    "ifs": "the four \"if\" clauses of Philippians 2:1, counted (part 06)",
}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles IV, VI and VII, quoted in short phrases. The site's doctrinal standard. Compared by eye, not by script."),
    ("The Second London Baptist Confession (1677)", "Chapter 26, two phrases in the old spelling. Compared by eye, not by script."),
    ("The Roman Catholic Church; Luther's Small Catechism", "Described, not quoted, as their own teaching on confession."),
]
