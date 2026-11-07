"""The lists The cross, the empty tomb and the throne draws beside the study's own text. build-data.py checks every
phrase here: Scripture phrases against the Berean at their reference, and the "stops" sentences against the study's own
content.md, so a picture cannot claim a limit the study does not state. These are this study's choices, not a count."""

# The six pictures, in the order the Lead names their homes. "phrase" must be in "ref"; "stops" must be, word for word,
# in that part of content.md. "did" is this page's one-line summary, in the site's voice.
PICTURES = [
    {"n": "01", "word": "Sacrifice", "home": "the temple", "ref": "Hebrews 9:26", "phrase": "the sacrifice of Himself",
     "did": "Offered himself once, as both the priest and the offering.",
     "stops": "Hebrews does not describe what the heavenly sanctuary looks like, and it does not call Israel's worship meaningless."},
    {"n": "02", "word": "Ransom", "home": "the slave market", "ref": "Mark 10:45", "phrase": "a ransom for many",
     "did": "Gave his life as the price of other people's freedom.",
     "stops": "Mark does not say to whom the ransom was paid."},
    {"n": "03", "word": "Peace", "home": "a broken friendship", "ref": "2 Corinthians 5:20", "phrase": "Be reconciled to God",
     "did": "Made peace with God, and God, the one wronged, moved first.",
     "stops": "Reconciliation is not God simply deciding the quarrel no longer matters."},
    {"n": "04", "word": "In our place", "home": "a law court", "ref": "1 Peter 2:24", "phrase": "bore our sins in His body on the tree",
     "did": "Bore the punishment our sins deserved, in our place.",
     "stops": "His bearing of sins is something no follower can copy."},
    {"n": "05", "word": "Victory", "home": "a battlefield", "ref": "Colossians 2:15", "phrase": "triumphing over them by the cross",
     "did": "Disarmed the powers, and freed those held by the fear of death.",
     "stops": "The victory does not mean that believers no longer face temptation, grief or death."},
    {"n": "06", "word": "Love", "home": "a family", "ref": "Romans 5:8", "phrase": "God proves His love for us",
     "did": "Showed the Father's own love by dying for enemies, and rescued them.",
     "stops": "A love that only inspired us, and left us under wrath, would not be the love of Romans 5."},
]
# The picture the study names as the centre (Close: "Christ died in our place, for our sins").
CENTRE = {"n": "04", "words": "In our place, for our sins", "ref": "1 Corinthians 15:3", "phrase": "Christ died for our sins"}

# 1 Corinthians 15:3–5 in its four lines, each with the page part that reads it, then the throne (Philippians 2:9).
FOUR_LINES = {
    "ref": "1 Corinthians 15:3–5",
    "lines": [
        {"event": "Christ died", "why": "for our sins", "scripture": True, "to": "pictures", "parts": "01–06"},
        {"event": "He was buried", "why": None, "scripture": False, "to": "part-07", "parts": "07"},
        {"event": "He was raised", "why": "on the third day", "scripture": True, "to": "part-07", "parts": "07"},
        {"event": "He appeared", "why": "to Cephas and then to the Twelve", "scripture": False, "to": "part-08", "parts": "08"},
    ],
    "after": {"ref": "Philippians 2:9", "event": "God exalted Him", "to": "part-09", "parts": "09"},
}

# Who saw what: Luke's report and Paul's list. Each name and each "saw" phrase is checked in its verse.
# "joins" pairs the same people across the two lists.
WITNESSES = {
    "luke": [
        {"id": "women", "who": "Mary Magdalene, Joanna, Mary the mother of James, and the other women", "ref": "Luke 24:10",
         "saw": "who told this to the apostles", "kind": "The empty tomb, and the word of the two men"},
        {"id": "peter", "who": "Peter", "ref": "Luke 24:12", "saw": "seeing only the linen cloths", "kind": "The empty tomb"},
        {"id": "simon", "who": "Simon", "ref": "Luke 24:34", "saw": "has appeared to Simon", "kind": "The risen Lord"},
        {"id": "eleven", "who": "the Eleven and those with them", "ref": "Luke 24:33", "saw": "Jesus Himself stood among them",
         "saw_ref": "Luke 24:36", "kind": "The risen Lord, with his hands and feet"},
    ],
    "paul": [
        {"id": "cephas", "who": "Cephas", "ref": "1 Corinthians 15:5"},
        {"id": "twelve", "who": "the Twelve", "ref": "1 Corinthians 15:5"},
        {"id": "five-hundred", "who": "more than five hundred brothers at once", "ref": "1 Corinthians 15:6"},
        {"id": "james", "who": "James", "ref": "1 Corinthians 15:7"},
        {"id": "apostles", "who": "all the apostles", "ref": "1 Corinthians 15:7"},
        {"id": "paul", "who": "me also", "ref": "1 Corinthians 15:8"},
    ],
    "joins": [("simon", "cephas"), ("eleven", "twelve")],
}

# Scripture remembering Scripture: the words Philippians 2 takes from Isaiah 45:23. Each shared phrase is checked in both.
ECHO = {"from": "Isaiah 45:23", "to": "Philippians 2:10–11", "shared": ["every knee", "every tongue"]}

# Facts the page states in its own voice, each tested: phrases that must be in a verse, and words that must not.
FACTS = [
    {"says": "Hebrews says nearly everything, not everything, was purified with blood.",
     "in": [("Hebrews 9:22", "nearly everything")], "not_in": []},
    {"says": "The law let a very poor person bring flour.", "in": [("Leviticus 5:11", "fine flour")], "not_in": []},
    {"says": "Every year the high priest went in; Christ appeared once for all.",
     "in": [("Hebrews 9:25", "every year"), ("Hebrews 9:26", "once for all")], "not_in": []},
    {"says": "Mark names no one the ransom was paid to.", "in": [("Mark 10:45", "ransom")],
     "not_in": [("Mark 10:35–45", "devil"), ("Mark 10:35–45", "satan")]},
    {"says": "Luke tells of two men at the tomb; Mark tells of one young man.",
     "in": [("Luke 24:4", "two men"), ("Mark 16:5", "a young man")], "not_in": []},
    {"says": "Paul's witness list names no women.", "in": [("1 Corinthians 15:5", "Cephas")],
     "not_in": [("1 Corinthians 15:3–8", "women"), ("1 Corinthians 15:3–8", "mary")]},
    {"says": "Philippians 2:10–11 does not say that everyone will be saved.", "in": [("Philippians 2:10–11", "every knee")],
     "not_in": [("Philippians 2:9–11", "saved"), ("Philippians 2:9–11", "salvation")]},
]
# Romans 5:6–10: Paul's four words for the people Christ died for, each worse than the one before, in this order.
ROMANS_FIVE = {"ref": "Romans 5:6–10", "words": ["powerless", "ungodly", "sinners", "enemies"]}

# Studies the text names in italics. Fixed: a link is a mock-up that existed on this PC when this was written, so a
# sister study finishing later cannot change the build. None means "not yet a page" (named in italics, not linked).
STUDY_LINKS = {
    "Covenants and promises": "/mockups/covenants-and-promises-directions/",
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "Faith under pressure": "/mockups/faith-under-pressure-directions/",
    "A new creation": "/mockups/a-new-creation-directions/",
    "The church and its calling": "/mockups/the-church-and-its-calling-directions/",
    "Who do you say that I am": "/mockups/who-do-you-say-that-i-am-directions/",
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "Prayer in the letters": "/mockups/prayer-in-the-letters-directions/",
    "Leviticus: holiness and sacrifice": None,
    "Grace, faith and salvation": None,
    "Angels, demons and spiritual powers": None,
    "Christ in the Old Testament": None,
    "What Scripture promises the sick": None,
    "Knowing God": None,
    "Chosen and kept": None,
    "Women of the Bible": None,
    "Scripture and its witness": None,
}

# Quoted words that are not Scripture, each with where it comes from. None of these texts is held in full on this PC,
# so they are compared by eye, not by script, and the README says so. Several carry a [check] note in the text.
OUTSIDE_QUOTES = {
    "His substitutionary death on the cross": "Baptist Faith and Message 2000, article II",
    "hath fully satisfied the justice of God": "Second London Baptist Confession (1677/1689), 8.5",
    "all those whom the Father hath given unto him": "Second London Baptist Confession (1677/1689), 8.5",
    "Deliverance from sickness is provided for in the atonement": "Assemblies of God, Statement of Fundamental Truths, 12",
    "offered freely to all who accept Jesus Christ as Lord and Saviour": "Baptist Faith and Message 2000, article IV",
    "will never fall away from the state of grace": "Baptist Faith and Message 2000, article V",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "Baptist Faith and Message 2000, article IV",
}

# Quoted words that are the study's own terms or a reader's question, not quotations from anywhere.
OWN_TERMS = {"good news", "returning", "Did Jesus really rise?", "priest", "received", "passed on", "Therefore",
             "according to the Scriptures", "for our sins", "every year", "once for all", "nearly", "Lord", "we"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles II, IV, V and X, quoted in short phrases or named. The site's doctrinal standard. Compared by eye; not held on this PC."),
    ("The Second London Baptist Confession (1677/1689)", "Chapter 8.5, two short phrases, marked in the text to be checked against the site's creeds collection."),
    ("Assemblies of God, Statement of Fundamental Truths", "Section 12, one sentence, shown as a classical Pentecostal view, not this site's. Marked to be checked."),
    ("Named, not quoted", "Rashi (Isaiah's servant as Israel), Anselm's Why God Became Man, Gustaf Aulén's Christus Victor (1931), Peter Abelard, Steve Chalke and Alan Mann's The Lost Message of Jesus (2003), and the 2012 Traditional Southern Baptist statement. None was read for this page; the text marks the ones still to be checked."),
]
