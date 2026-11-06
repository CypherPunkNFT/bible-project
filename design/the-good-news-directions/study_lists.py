"""The lists The good news page draws beside the study's own text. build-data.py checks every phrase here against
the Berean, so a row cannot claim words its verse does not hold. These are this study's choices, not a count."""

# News, then response: what God has done, and what it calls for, each in the words of the verse that holds both.
# "response" None means the passage leaves the answer open, and build-data.py proves the words named in
# "open_check" are not in the verses that follow.
NEWS_ROWS = [
    {"ref": "John 3:16", "news": "God so loved the world that He gave His one and only Son",
     "response": "everyone who believes in Him", "note": "The giving comes before the believing, in the same sentence."},
    {"ref": "Luke 15:28", "news": "his father came out and pleaded with him", "response": None,
     "open_ref": "Luke 15:29–32", "open_check": "went in",
     "note": "The father goes out to the son who will not come in. Jesus does not say what the son did."},
    {"ref": "Acts 2:36", "news": "God has made this Jesus, whom you crucified, both Lord and Christ",
     "then_ref": "Acts 2:38", "response": "Repent and be baptized", "note": "The crowd asks what to do only after Peter has told them what God has done."},
    {"ref": "Romans 10:9", "news": "God raised Him from the dead",
     "response": "believe in your heart", "note": "What you believe is something God has already done."},
    {"ref": "Ephesians 2:8", "news": "it is the gift of God", "response": "through faith",
     "note": "Faith receives a gift. It does not earn one."},
    {"ref": "Romans 3:25", "news": "God presented Him as the atoning sacrifice",
     "then_ref": "Romans 3:26", "response": "the one who has faith in Jesus", "note": "God keeps His justice and still justifies."},
    {"ref": "1 John 5:11", "news": "God has given us eternal life",
     "then_ref": "1 John 5:13", "response": "so that you may know that you have eternal life", "note": "Assurance rests on what God has given, not on a feeling."},
]

# Luke 15's three lost things, drawn as dots. Each count and each phrase is checked in its verse.
LOST_THINGS = [
    {"id": "sheep", "name": "The sheep", "ref": "Luke 15:4", "count": 100, "count_words": "a hundred sheep",
     "who": "The shepherd goes after it", "search": "until he finds it", "end_ref": "Luke 15:6", "end": "Rejoice with me"},
    {"id": "coin", "name": "The coin", "ref": "Luke 15:8", "count": 10, "count_words": "ten silver coins",
     "who": "The woman lights a lamp and sweeps", "search": "until she finds it", "end_ref": "Luke 15:9", "end": "Rejoice with me"},
    {"id": "sons", "name": "The sons", "ref": "Luke 15:11", "count": 2, "count_words": "two sons",
     "who": "The father runs, then goes out", "search": "He ran to his son", "search_ref": "Luke 15:20",
     "end_ref": "Luke 15:32", "end": "it was fitting to celebrate and be glad"},
]

# Facts the page states in its own voice, each tested.
FACTS = [
    {"says": "The son's speech is cut short: the hired-servant request is in his plan, and not in what he says.",
     "in": [("Luke 15:19", "hired servants")], "not_in": [("Luke 15:21", "hired")]},
    {"says": "Luke records no baptism of the man on the cross.",
     "in": [("Luke 23:43", "Paradise")], "not_in": [("Luke 23:39–49", "baptiz")]},
]

# Studies the text names in italics. A study with a mock-up on this PC links to it; the rest are named only.
STUDY_LINKS = {
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "The church and its calling": "/mockups/the-church-and-its-calling-directions/",
    "Bearing witness": "/mockups/bearing-witness-directions/",
    "Who do you say that I am": "/mockups/who-do-you-say-that-i-am-directions/",
    "Christ in the Old Testament": None,
    "The parables of Christ": None,
    "The Holy Spirit": None,
    "What the cross accomplishes": None,
    "The book of Psalms": None,
    "Grace, faith and salvation": None,
    "Chosen and kept": None,
}

# Quoted words that are not Scripture. Each is named with where it comes from. The confession is not held in full on
# this PC, so these are compared by eye, not by script; the README says so.
OUTSIDE_QUOTES = {
    "the immersion of a believer in water": "Baptist Faith and Message 2000, article VII",
    "an act of obedience symbolizing the believer's faith": "Baptist Faith and Message 2000, article VII",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "Baptist Faith and Message 2000, article IV",
    "endeavor to make disciples of all nations": "Baptist Faith and Message 2000, article XI",
    "It worketh forgiveness of sins": "Luther's Small Catechism, part IV",
}

# Quoted words that are the study's own terms, not quotations from anywhere.
OWN_TERMS = {"good news", "servant", "Jesus is Lord", "turned to your own way", "both Lord and Christ", "you crucified",
             "everyone", "know", "All", "anointed one"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles IV, VII, XI and XVII, quoted in short phrases. The site's doctrinal standard."),
    ("Luther's Small Catechism", "One sentence on baptism, shown as the Lutheran view, not this site's."),
    ("Rashi", "Named, not quoted, for the Jewish reading of Isaiah's servant."),
]
