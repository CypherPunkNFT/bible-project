"""The lists the Learning to discern page draws beside the study's own text. build-data.py checks every phrase here
against the Berean (or, for the few outside sources held on this PC, against that copy), so a drawing cannot claim
words its verse does not hold. These are this page's choices, not a count."""
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
PROJECT = WEBSITE.parent

TITLE = ("Learning", "to discern")

# The study's frame names three checks: the message, the Scriptures, and the one doing the testing. Each station's
# question is taken word for word from content.md ("from_text"), and each verse phrase is checked in its verse.
CHECKS = [
    {"n": 1, "name": "The message", "ask": "What does this teaching say about Jesus?",
     "from_text": "What does this teaching say about Jesus?",
     "means": "Not who brings it, how confident they sound, or how it arrived.",
     "verses": [("1 John 4:2", "confesses that Jesus Christ has come in the flesh"),
                ("Galatians 1:8", "a gospel contrary to the one we preached to you")]},
    {"n": 2, "name": "The Scriptures", "ask": "Is it so, in the passage read whole?",
     "from_text": "open the passage to see whether it is so",
     "means": "Open the verse it rests on and read the paragraph around it.",
     "verses": [("Acts 17:11", "examined the Scriptures every day to see if these teachings were true")]},
    {"n": 3, "name": "The one testing", "ask": "What is driving me as I judge it?",
     "from_text": "What is driving me as I judge it?",
     "means": "The test turns back on the one doing the testing.",
     "verses": [("James 3:14", "bitter jealousy and selfish ambition"),
                ("James 3:17", "the wisdom from above is first of all pure")]},
]
# Which of the three questions each part trains. Part 05 asks the first and third together; the study says so in
# its own words ("together" is checked in content.md), and part 06 applies all three.
PART_CHECKS = {"01": [1], "02": [1], "03": [2], "04": [3], "05": [1, 3], "06": [1, 2, 3]}
TOGETHER = ("05", "Fruit and doctrine are tested together.")

# 1 John 4:2–4: the test as two clauses, each with where it comes from, and the ground the testers stand on.
CLAUSES = [("1 John 4:2", "Every spirit that confesses that Jesus Christ has come in the flesh", "is from God"),
           ("1 John 4:3", "every spirit that does not confess Jesus", "is not from God")]
GROUND = ("1 John 4:4", "greater is He who is in you than he who is in the world")

# Galatians 1:8–9: who falls under the warning, and the line that does not move.
MESSENGERS = {
    "who": [("Galatians 1:8", "we", "Paul himself, and those with him"),
            ("Galatians 1:8", "an angel from heaven", "A messenger from heaven itself"),
            ("Galatians 1:9", "anyone", "Whoever it is")],
    "line": [("Galatians 1:8", "the one we preached to you"), ("Galatians 1:9", "the one you received")],
    "verdict": ("Galatians 1:9", "let him be under a curse"),
}

# Acts 17: one verse, then its paragraph, then the account it belongs to. Each step must hold the step before it.
WIDEN = [("Acts 17:11", "The verse"), ("Acts 17:10–12", "Its paragraph"), ("Acts 17:1–15", "The account in two towns")]
HALVES = [("Acts 17:11", "received the message with great eagerness", "Eager"),
          ("Acts 17:11", "examined the Scriptures every day", "Careful"),
          ("Acts 17:12", "many of them believed", "The result")]

# James 3:14–17: wisdom from below, in James's words, and the seven qualities of wisdom from above, in his order.
WISDOM = {
    "below": [("James 3:14", "bitter jealousy"), ("James 3:14", "selfish ambition"),
              ("James 3:15", "earthly, unspiritual, demonic"), ("James 3:16", "disorder and every evil practice")],
    "above_ref": "James 3:17",
    "first": "pure",
    "then": ["peace-loving", "gentle", "accommodating", "full of mercy and good fruit", "impartial", "sincere"],
}

# 2 Peter 2:1–3: the five marks of part 05, by their labels in content.md, each lit in the passage by its phrase.
MARKS_REF = "2 Peter 2:1–3"
MARKS = [("They are inside", "2 Peter 2:1", "among you"),
         ("They come quietly", "2 Peter 2:1", "secretly introduce"),
         ("They deny the Master", "2 Peter 2:1", "denying the Master who bought them"),
         ("They gather followers", "2 Peter 2:2", "Many will follow"),
         ("They want something", "2 Peter 2:3", "In their greed")]

# Part 06's five questions, by label, and the part each comes from. A question that names a part must cite a verse
# inside that part's main readings; build-data.py checks it.
LISTEN = {"God": None, "Jesus": "01", "The Holy Spirit": None, "Scripture": "03", "The gospel": "02"}

# Studies the text names in italics. A study with a mock-up on this PC links to it (build-data.py checks the
# index.html exists); the rest are named only, because they are not pages yet.
STUDY_NAMES = {
    "God: who He is and what He does": None,
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "Saved by grace: how God forgives and changes us": "/mockups/grace-faith-and-salvation-directions/",
    "Reading the Bible well: where to start and how to keep going": None,
    "What the Bible says about itself": None,
    "The church and its calling": "/mockups/the-church-and-its-calling-directions/",
    "Chosen and kept: can I be sure?": None,
    "Following Jesus and the Sermon on the Mount": None,
    "Who do you say that I am? Who Jesus really is": "/mockups/who-do-you-say-that-i-am-directions/",
    "Faith in daily life": "/mockups/faith-in-daily-life-directions/",
    "Witness and the nations: telling others about Jesus": "/mockups/bearing-witness-directions/",
}

# Outside sources held on this PC. A quotation tied to one of these is checked by script against it.
SOURCE_ROOTS = [PROJECT]
SOURCES_HELD = {
    "foundation": {"name": "the site's doctrinal foundation, which quotes the Baptist Faith and Message 2000", "path": PROJECT / "DOCTRINAL-FOUNDATION.md"},
}
# Quoted words from outside Scripture: (part, phrase) -> (where it is from, held source key or None). None means no
# copy is held here, so the words are compared by eye, not by script; the page and the README say so.
OUTSIDE_QUOTES = {
    ("05", "will never fall away"): ("Baptist Faith and Message 2000, article V", "foundation"),
    ("05", "cheerfully, regularly, systematically, proportionately, and liberally"): ("Baptist Faith and Message 2000, article XIII", "foundation"),
    ("06", "There is one and only one living and true God"): ("Baptist Faith and Message 2000, article II", None),
    ("06", "The eternal triune God reveals Himself to us as Father, Son, and Holy Spirit, with distinct personal attributes, but without division of nature, essence, or being."): ("Baptist Faith and Message 2000, article II", None),
    ("06", "Christ is the eternal Son of God."): ("Baptist Faith and Message 2000, article II", None),
    # The site's creeds collection holds the older English wording ("very God of very God"), so this modern wording
    # cannot be checked against it; the README records this for the owner.
    ("06", "true God from true God"): ("the Nicene Creed, in a modern English wording not held on this PC", None),
    ("06", "We believe in God, the Eternal Father, and in His Son, Jesus Christ, and in the Holy Ghost."): ("Articles of Faith 1, the Church of Jesus Christ of Latter-day Saints", None),
    ("06", "The Father has a body of flesh and bones as tangible as man's; the Son also; but the Holy Ghost has not a body of flesh and bones, but is a personage of Spirit."): ("Doctrine and Covenants 130:22", None),
    ("06", "Godhead"): ("the Latter-day Saints' Gospel Topics, an entry title", None),
    ("06", "As man now is, God once was: As God now is, man may be"): ("Lorenzo Snow, as quoted in the church's manuals", None),
    ("06", "We believe the Bible to be the word of God as far as it is translated correctly; we also believe the Book of Mormon to be the word of God."): ("Articles of Faith 8, the Church of Jesus Christ of Latter-day Saints", None),
    ("06", "In the beginning was the Word, and the Word was with God, and the Word was a god."): ("New World Translation, John 1:1", None),
    ("06", "God's active force"): ("Jehovah's Witnesses' publications", None),
    ("06", "There is one God: Father, Son, and Holy Spirit, a unity of three coeternal Persons."): ("Seventh-day Adventist Fundamental Belief 2", None),
    ("06", "possesses full dignity and is worthy of respect and Christian love"): ("Baptist Faith and Message 2000, article III", "foundation"),
}

# Quoted words that are this study's own: questions a reader might ask, glosses of a word, a sentence no one says.
OWN_TERMS = {
    ("01", "Is this teacher impressive?"), ("01", "Did something powerful happen in the meeting?"),
    ("01", "What does this teaching say about Jesus?"), ("01", "seeming"), ("02", "good news"),
    ("04", "Is this teaching true?"), ("04", "What is driving me as I judge it?"), ("05", "I am about to deny Christ."),
    ("06", "God"), ("questions", "I don't know yet"), ("questions", "God"), ("questions", "Jesus"),
}

# Short quotations (under three words) or quotes with no reference beside them, pinned to the verse that holds them.
PINNED_QUOTES = {
    ("01", "we"): "1 John 1:1–3",
    ("03", "every day"): "Acts 17:11",
    ("05", "Among you."): "2 Peter 2:1",
    ("05", "Secretly introduce"): "2 Peter 2:1",
    ("05", "bought"): "2 Peter 2:1",
    ("05", "among you"): "2 Peter 2:1",
    ("close", "test the spirits"): "1 John 4:1",
}

# Short references with no book named beside them: (part, text) -> book. Text after these prefixes is not Scripture.
SHORT_REFS: dict = {}
NOT_SCRIPTURE = ("Doctrine and Covenants ",)

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles II, III, V, XIII and XVII. The site's doctrinal standard. Three phrases were checked by script against the site's doctrinal foundation, which quotes it; the full confession is not held on this PC."),
    ("The Nicene Creed", "One phrase in a modern English wording. The site's creeds collection holds the older wording, \"very God of very God\", so the phrase was not checked by script."),
    ("The Church of Jesus Christ of Latter-day Saints", "Articles of Faith 1 and 8, Doctrine and Covenants 130:22, and a saying of Lorenzo Snow, quoted in the study's draft and marked to be confirmed. Not held on this PC."),
    ("Jehovah's Witnesses", "The New World Translation at John 1:1 and two phrases from their publications, marked to be confirmed. Not held on this PC."),
    ("Seventh-day Adventists", "Fundamental Belief 2, quoted once. Not held on this PC."),
]
