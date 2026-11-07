"""The lists The kingdom he announced page draws beside the study's own text. build-data.py checks every phrase here
against the Berean (or, for the confession, against the held copy of its text), so a line cannot claim words its
verse does not hold. These are this page's choices and reading aids, not a count of every kingdom saying."""

# The kingdom in its tenses: one line per part, set like a verb in a grammar book. "verb" must sit inside "clause",
# and "clause" inside the verse, as whole words. "reads" is this page's plain name for the line, in the study's own
# words where it has them; it is a reading aid, not a claim the verse makes. "differ" marks a line the study itself
# says readers take two ways.
TENSES = [
    {"id": "reigns", "part": "01", "verbs": [
        {"verb": "reigns", "clause": "The LORD reigns", "ref": "Psalm 93:1"},
        {"verb": "reigns", "clause": "Your God reigns", "ref": "Isaiah 52:7"}],
     "name": "Always", "reads": "God reigns now, over the whole world. His rule is disputed."},
    {"id": "near", "part": "02", "verbs": [
        {"verb": "is near", "clause": "the kingdom of God is near", "ref": "Mark 1:15"}],
     "name": "Come close", "reads": "God's reign has come close, right up to the hearers."},
    {"id": "like", "part": "03", "verbs": [
        {"verb": "is like", "clause": "The kingdom of heaven is like a mustard seed", "ref": "Matthew 13:31"}],
     "name": "Like a seed", "reads": "Small at the start. Do not judge the end by the beginning."},
    {"id": "come", "part": "04", "verbs": [
        {"verb": "has come upon you", "clause": "the kingdom of God has come upon you", "ref": "Luke 11:20"},
        {"verb": "is in your midst", "clause": "the kingdom of God is in your midst", "ref": "Luke 17:21",
         "differ": "The Greek can also be read “inside you”. The study gives its reason for the Berean’s wording."}],
     "name": "Already here", "reads": "Not “will come”. It is standing among them, because the King is."},
    {"id": "belongs", "part": "05", "verbs": [
        {"verb": "belongs to", "clause": "the kingdom of God belongs to such as these", "ref": "Luke 18:16"}],
     "name": "Received", "reads": "Entered by receiving, empty-handed, not by credentials."},
    {"id": "will", "part": "06", "verbs": [
        {"verb": "will be like", "clause": "the kingdom of heaven will be like ten virgins", "ref": "Matthew 25:1"}],
     "name": "Still to come", "reads": "At the end of the age: a door that opens, and then shuts."},
]

# Matthew 13 in order. Each parable's opening words must be in its first verse. "kind" is one of the three the part's
# own Consider question names, and build-data.py checks that question still names all three. "explained" is where
# Jesus explains it himself, with words that prove it.
KINDS = [("hearing", "Hearing"), ("growth", "Growth or worth"), ("end", "The end")]
PARABLES = [
    {"id": "sower", "name": "The sower", "ref": "Matthew 13:3–9", "kind": "hearing",
     "opening": "A farmer went out to sow his seed",
     "explained": {"ref": "Matthew 13:18–23", "proof": "Consider, then, the parable of the sower"}},
    {"id": "weeds", "name": "The weeds", "ref": "Matthew 13:24–30", "kind": "end",
     "opening": "The kingdom of heaven is like a man who sowed good seed in his field",
     "explained": {"ref": "Matthew 13:36–43", "proof": "Explain to us the parable of the weeds in the field"}},
    {"id": "mustard", "name": "The mustard seed", "ref": "Matthew 13:31–32", "kind": "growth",
     "opening": "The kingdom of heaven is like a mustard seed"},
    {"id": "leaven", "name": "The leaven", "ref": "Matthew 13:33", "kind": "growth",
     "opening": "The kingdom of heaven is like leaven",
     "differ": "Some read the leaven as evil spreading. The study gives both readings and says why it follows growth."},
    {"id": "treasure", "name": "The treasure", "ref": "Matthew 13:44", "kind": "growth",
     "opening": "The kingdom of heaven is like treasure hidden in a field"},
    {"id": "pearl", "name": "The pearl", "ref": "Matthew 13:45–46", "kind": "growth",
     "opening": "the kingdom of heaven is like a merchant in search of fine pearls"},
    {"id": "net", "name": "The net", "ref": "Matthew 13:47–50", "kind": "end",
     "opening": "the kingdom of heaven is like a net",
     "explained": {"ref": "Matthew 13:49–50", "proof": "So will it be at the end of the age"}},
]
# Where the chapter turns. Each phrase must be in its verse. "hard ground" is the study's reading, and says so.
CHAPTER_MARKS = [
    {"id": "sea", "ref": "Matthew 13:1–2", "phrase": "sat by the sea", "label": "By the sea, to the crowds"},
    {"id": "house", "ref": "Matthew 13:36", "phrase": "went into the house", "label": "Into the house, to the disciples"},
    {"id": "home", "ref": "Matthew 13:54–58", "phrase": "because of their unbelief", "proof_ref": "Matthew 13:58",
     "also": ("Matthew 13:54", "hometown"), "label": "His hometown",
     "reads": "The study reads it as the sower happening in front of the reader: the seed fell, and the ground was hard."},
]
MATTHEW_13_LAST_VERSE = 58

# Waiting, in Jesus' own stories: shown with the question whether Jesus expected the end at once.
WAITING = [
    {"ref": "Matthew 13:30", "phrase": "Let both grow together until the harvest"},
    {"ref": "Matthew 25:5", "phrase": "When the bridegroom was delayed"},
    {"ref": "Matthew 25:19", "phrase": "After a long time the master of those servants returned"},
]
WAITING_QUESTION = "Did Jesus expect the end to come at once?"

# The Way's three asks, shown in the close. Each must be in the Way paragraph word for word.
ASKS = ["to trust what God has already done", "to turn toward what is near", "to be ready for what is coming"]

# Studies the text names in italics. One with a mock-up folder on this PC links to it (build-data.py checks the
# folder's index.html exists); the rest are named only. Two of the None entries are being designed beside this one
# in the same run (Following Jesus; God: who He is), and the run's last step adds their links.
STUDY_LINKS = {
    "Following Jesus and the Sermon on the Mount": None,
    "Prayer across Scripture: learning to pray": "/mockups/prayer-in-the-letters-directions/",
    "Encounters with Jesus": "/mockups/encounters-with-jesus-directions/",
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "Reading Daniel and Revelation": "/mockups/reading-daniel-and-revelation-directions/",
    "God: who He is and what He does": None,
    "Leviticus: holiness and sacrifice": "/mockups/the-law-of-moses-and-the-christian-directions/",
    "Saved by grace: how God forgives and changes us": "/mockups/grace-faith-and-salvation-directions/",
    "What Scripture promises the sick": "/mockups/illness-and-healing-directions/",
    "Angels, demons and spiritual powers": "/mockups/angels-demons-and-spiritual-powers-directions/",
    "Chosen and kept: can I be sure?": None,
    "Fear, anxiety and despair": None,
    "Grief and dying": None,
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
}

# Quoted words from the Baptist Faith and Message 2000, each with its article. build-data.py checks each one, word for
# word, inside that article of the confession text held on this PC (see CONFESSION_FILE).
CONFESSION_FILE = "content/questions/sources/extracted/baptist-know-the-truth-catechism.json"
CONFESSION_TITLE = "The 2000 Baptist Faith and Message"
CONFESSION_QUOTES = {
    "the realm of salvation into which men enter by trustful, childlike commitment to Jesus Christ": "IX",
    "pray and to labor that the Kingdom may come": "IX",
    "The full consummation of the Kingdom awaits the return of Jesus Christ and the end of this age": "IX",
    "as soon as they are capable of moral action": "III",
    "will never fall away from the state of grace": "V",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "IV",
}
# Other quoted words that are not this study's Scripture. Each is named with what it is. Not checked by script; the
# study marks each with a note to check, and the README says so. build-data.py refuses any of them found in a verse
# the same paragraph cites, so a misquoted verse cannot hide here.
OUTSIDE_QUOTES = {
    "the yoke of the kingdom of heaven": "Mishnah Berakhot 2:2, as the study gives it; not held on this PC",
    "inside you": "the wording of some older translations at Luke 17:21, named by the study as theirs",
}
# Scripture quoted outside the passages the paragraph cites, each tied to the one verse that holds it.
SCRIPTURE_ELSEWHERE = {
    "Hear, O Israel": "Deuteronomy 6:4",
    "One like the Son of Man coming with the clouds of heaven": "Daniel 7:13",
}
# Words the study uses as its own terms, in quotation marks, that are not quotations of anything.
OWN_TERMS = {"good news", "heaven", "will come", "work out the date", "realized eschatology", "already and not yet", "millennium"}

# The labels the page gives the study's marked notes. Outside views are labelled by name.
NOTE_LABELS = {
    "read": "This study reads", "open": "Readers differ", "other": "Another reading", "care": "With care",
    "source:augustine": "Augustine; Roman Catholic teaching", "source:rauschenbusch": "Walter Rauschenbusch",
    "source:scholars": "Three scholars",
}
MARGIN_NOTES = {"read", "open", "other"}

SOURCES = [
    ["Berean Standard Bible.", "Every verse quoted and every verse that opens, from the site's copy of the text. Public domain."],
    ["The Baptist Faith and Message 2000.", "Articles III, IV, V, VI, IX, X, XIII and XV are named; the six phrases quoted were checked by script against the text held on this PC."],
    ["Named in the study, not read for this page.", "The Kaddish; the Mishnah, Berakhot 2:2; 11QMelchizedek; the Scofield Reference Bible note at Matthew 13:33; Augustine, The City of God 20.9; Lumen Gentium 5; Walter Rauschenbusch, A Theology for the Social Gospel (1917); Albert Schweitzer, The Quest of the Historical Jesus (1906); C. H. Dodd, The Parables of the Kingdom (1935); George Eldon Ladd, The Presence of the Future (1974). Each is marked in the text as still to be checked."],
]
