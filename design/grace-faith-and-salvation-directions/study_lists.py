"""The lists the Saved by grace page draws beside the study's own text. build-data.py checks every phrase here against
the Berean, word for word and in the verse named, so a row cannot claim words its verse does not hold. Which actor a
verb is filed under is this study's reading of the verse; a script can prove the words are there, not the reading."""

# Who acts. "people": what people were doing on their own. "ruled": named in the verse only to be ruled out.
# "god": God acts, and the verse says so. "passive": the verse uses the passive voice and names no actor; the study
# reads God as the one who acts, as Romans 4:5 says outright ("Him who justifies the wicked"). "reply": what people do.
KINDS = {
    "people": "What people were doing",
    "ruled": "Named only to be ruled out",
    "god": "What God does",
    "passive": "What God does (the verse names no actor)",
    "reply": "What people do",
}

# The verb chart: the six passages walked in parts 01 to 06. Each phrase is copied exactly from the Berean, in the
# verse named. "hinge" is the verse where the passage turns, and build-data.py proves it begins with "But".
VERB_CHART = [
    {"part": "01", "reading": "Ephesians 2:1–10", "hinge": ("Ephesians 2:4", "But because of His great love for us"), "verbs": [
        ("Ephesians 2:2", "you used to walk", "people"),
        ("Ephesians 2:3", "lived among them", "people"),
        ("Ephesians 2:3", "fulfilling the cravings of our flesh", "people"),
        ("Ephesians 2:5", "made us alive with Christ", "god"),
        ("Ephesians 2:6", "raised us up with Christ", "god"),
        ("Ephesians 2:6", "seated us with Him", "god"),
        ("Ephesians 2:8", "by grace you have been saved", "passive"),
        ("Ephesians 2:9", "not by works", "ruled"),
        ("Ephesians 2:10", "God prepared in advance", "god"),
        ("Ephesians 2:10", "to do good works", "reply"),
    ]},
    {"part": "02", "reading": "Luke 18:9–14", "hinge": ("Luke 18:13", "But the tax collector stood at a distance"), "verbs": [
        ("Luke 18:9", "trusted in their own righteousness", "people"),
        ("Luke 18:12", "I fast twice a week", "people"),
        ("Luke 18:13", "he beat his breast", "reply"),
        ("Luke 18:13", "God, have mercy on me, a sinner!", "reply"),
        ("Luke 18:14", "went home justified", "passive"),
    ]},
    {"part": "03", "reading": "Titus 3:3–7", "hinge": ("Titus 3:4", "But when the kindness of God our Savior"), "verbs": [
        ("Titus 3:3", "we too were foolish, disobedient, misled", "people"),
        ("Titus 3:3", "being hated and hating one another", "people"),
        ("Titus 3:4", "His love for mankind appeared", "god"),
        ("Titus 3:5", "He saved us", "god"),
        ("Titus 3:5", "not by the righteous deeds we had done", "ruled"),
        ("Titus 3:6", "He poured out on us abundantly", "god"),
        ("Titus 3:7", "having been justified by His grace", "passive"),
    ]},
    {"part": "04", "reading": "Romans 3:21–4:8", "hinge": ("Romans 3:21", "But now"), "verbs": [
        ("Romans 3:23", "all have sinned and fall short", "people"),
        ("Romans 3:24", "are justified freely by His grace", "passive"),
        ("Romans 3:25", "God presented Him", "god"),
        ("Romans 3:28", "apart from works of the law", "ruled"),
        ("Romans 4:3", "Abraham believed God", "reply"),
        ("Romans 4:5", "Him who justifies the wicked", "god"),
        ("Romans 4:6", "God credits righteousness apart from works", "god"),
        ("Romans 4:7", "whose lawless acts are forgiven", "passive"),
    ]},
    {"part": "05", "reading": "Galatians 4:4–7", "hinge": ("Galatians 4:4", "But when the time had fully come"), "verbs": [
        ("Galatians 4:3", "we were enslaved under the basic principles of the world", "people"),
        ("Galatians 4:4", "God sent His Son", "god"),
        ("Galatians 4:5", "to redeem those under the law", "god"),
        ("Galatians 4:5", "receive our adoption as sons", "reply"),
        ("Galatians 4:6", "God sent the Spirit of His Son into our hearts", "god"),
        ("Galatians 4:6", "crying out, “Abba, Father!”", "god", "It is the Spirit of His Son, in our hearts, who cries it."),
    ]},
    {"part": "06", "reading": "James 2:14–26", "hinge": None, "verbs": [
        ("James 2:14", "claims to have faith, but has no deeds", "people"),
        ("James 2:16", "does not provide for his physical needs", "people"),
        ("James 2:21", "offered his son Isaac on the altar", "reply"),
        ("James 2:22", "his faith was working with his actions", "reply"),
        ("James 2:23", "it was credited to him as righteousness", "passive", "James quotes Genesis 15:6, the verdict that came first."),
        ("James 2:25", "welcomed the spies", "reply"),
    ]},
]
NO_TURN = {"06": "James has no such turn. His one “But” (James 2:18) brings in someone who disagrees."}

# Part 02: the two prayers, taken by build-data.py from inside the quotation marks of the verses, and the "I"s counted.
PRAYERS = [
    {"who": "The Pharisee", "ref": "Luke 18:11–12", "mark": r"\bI\b"},
    {"who": "The tax collector", "ref": "Luke 18:13", "mark": r"\bGod\b|have mercy"},
]

# Part 04: the bookkeeping words of Romans 4:3–8.
DECLARING = [("Romans 4:3", "credited"), ("Romans 4:7", "forgiven"), ("Romans 4:7", "covered"), ("Romans 4:8", "never count against him")]

# Part 05: three standings in one verse.
STANDING = [("Galatians 4:7", "no longer a slave"), ("Galatians 4:7", "but a son"), ("Galatians 4:7", "also an heir")]

# Part 06: Abraham's two moments. Genesis 15 comes before Ishmael's birth (Abram eighty-six), Genesis 22 after Isaac's
# (Abraham a hundred), so at least fourteen years lie between them. Each phrase is checked in its verse.
ABRAHAM = {
    "believed": ("Genesis 15:6", "Abram believed the LORD, and it was credited to him as righteousness"),
    "quoted_by": [("Romans 4:3", "Abraham believed God, and it was credited to him as righteousness"),
                  ("James 2:23", "Abraham believed God, and it was credited to him as righteousness")],
    "offered": ("Genesis 22:9", "placed him on the altar"),
    "pointed_by": ("James 2:21", "offered his son Isaac on the altar"),
    "ages": [("Genesis 16:16", "eighty-six years old", 86), ("Genesis 21:5", "a hundred years old", 100)],
}

# Part 07: the chain of Romans 8:29–30, and the two verbs of Philippians 2:12–13.
CHAIN = [("Romans 8:29", "foreknew"), ("Romans 8:29", "predestined"), ("Romans 8:30", "called"), ("Romans 8:30", "justified"), ("Romans 8:30", "glorified")]
TWO_VERBS = [("Philippians 2:12", "continue to work out your salvation", "reply"), ("Philippians 2:13", "it is God who works in you", "god")]

# Crisis lines named in the care note of part 02: (country as written, number as written, entry id in the site's
# checked list src/data/resources/life.json, or None where that list does not hold it).
CRISIS = [("United States", "988", "988-lifeline"), ("Spain", "024", "spain-024"), ("Mexico", "800 911 2000", "mexico-linea-de-la-vida"),
          ("Argentina", "135", None), ("Brazil", "188", "brazil-cvv")]

# Corrections applied in memory before the build, never written to content.md (the design brief does not allow
# this job to change the study's words). Each must match exactly once, so a fix made in content.md retires it.
TEXT_PATCHES = [
    {"old": '"there is neither male nor female, for you are all one in Christ Jesus" (Galatians 3:28)',
     "new": '"There is neither ... male nor female, for you are all one in Christ Jesus" (Galatians 3:28)',
     "why": "The Berean reads “There is neither Jew nor Greek, slave nor free, male nor female”; the study's quotation "
            "dropped words without marking it. The ellipsis marks the omission. Needs the owner's word, then a fix in content.md."},
    {"old": 'look down on people still "dead in trespasses",',
     "new": "look down on people still dead in trespasses,",
     "why": "Ephesians 2:1 reads “dead in your trespasses” and 2:5 “dead in our trespasses”; neither is “dead in trespasses”. "
            "The quotation marks are dropped so the words read as the study's own summary."},
    {"old": '"I fast", "I pay" (Luke 18:11–12)',
     "new": '"I fast", "pay tithes" (Luke 18:11–12)',
     "why": "Luke 18:12 reads “I fast twice a week and pay tithes”; “I pay” is not in the verse. The quotation now holds the verse's own words."},
    {"old": 'What does someone "claim" in verse 14?',
     "new": "What does someone claim in verse 14?",
     "why": "James 2:14 reads “claims”, not “claim”. The quotation marks are dropped; the question still points to the word."},
]

# Studies the text names in italics. A study with a mock-up on this PC links to it (build-data.py proves the folder
# exists); the rest are named only, because they are not pages yet.
STUDY_LINKS = {
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "Encounters with Jesus": "/mockups/encounters-with-jesus-directions/",
    "Who do you say that I am": "/mockups/who-do-you-say-that-i-am-directions/",
    "Faith under pressure": "/mockups/faith-under-pressure-directions/",
    "A new creation": "/mockups/a-new-creation-directions/",
    "The good news": "/mockups/the-good-news-directions/",
    "What the cross accomplishes": None,
    "Chosen and kept": None,
    "The kingdom he announced": None,
    "The Holy Spirit": None,
    "Baptism and the Lord’s Supper": None,
}

# Quoted words that are not Scripture, each with where it comes from. None of these is held in full on this PC, so
# they are compared by eye, not by script; the README says so.
BFM = "Baptist Faith and Message 2000"
OUTSIDE_QUOTES = {
    "Repentance and faith are inseparable experiences of grace": f"{BFM}, article IV",
    "a work of God's grace whereby believers become new creatures in Christ Jesus": f"{BFM}, article IV",
    "a change of heart wrought by the Holy Spirit": f"{BFM}, article IV",
    "God's gracious and full acquittal upon principles of His righteousness of all sinners who repent and believe in Christ": f"{BFM}, article IV",
    "brings the believer unto a relationship of peace and favor with God": f"{BFM}, article IV",
    "the experience, beginning in regeneration": f"{BFM}, article IV",
    "enabled to progress toward moral and spiritual maturity through the presence and power of the Holy Spirit dwelling in him": f"{BFM}, article IV",
    "the culmination of salvation": f"{BFM}, article IV",
    "the final blessed and abiding state of the redeemed": f"{BFM}, article IV",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": f"{BFM}, article IV",
    "an act of obedience symbolizing the believer's faith": f"{BFM}, article VII",
    "will never fall away from the state of grace": f"{BFM}, article V",
    "truth, without any mixture of error": f"{BFM}, article I",
    "wherein he pardoneth all our sins, and accepteth us as righteous in his sight, only for the righteousness of Christ imputed to us, and received by faith alone": "The Baptist Catechism (1693)",
    "is not remission of sins merely, but also the sanctification and renewal of the inward man": "Council of Trent, session 6, chapter 7 (Waterworth, 1848)",
    "the sacrament of baptism, which is the sacrament of faith": "Council of Trent, session 6, chapter 7 (Waterworth, 1848)",
    "faith is the beginning of human salvation, the foundation, and the root of all Justification": "Council of Trent, session 6, chapter 8 (Waterworth, 1848)",
    "none of those things which precede justification—whether faith or works—merit the grace itself of justification": "Council of Trent, session 6, chapter 8 (Waterworth, 1848)",
    "is not only the remission of sins, but also the sanctification and renewal of the interior man": "Catechism of the Catholic Church, 1989",
    "has been merited for us by the Passion of Christ": "Catechism of the Catholic Church, 1992",
    "is conferred in Baptism, the sacrament of faith": "Catechism of the Catholic Church, 1992",
    "establishes cooperation between God's grace and man's freedom": "Catechism of the Catholic Church, 1993",
    "What is justification?": "The Baptist Catechism (1693), its question",
}

# Quoted words that are the study's own terms or words it names, not quotations from anywhere.
OWN_TERMS = {"faith alone", "work for your salvation", "father", "Am I guilty?", "Do I belong?", "Can I live as I like?",
             "Can I lose it?", "God, I thank You that I am not like this Pharisee"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse, every quoted phrase and every verb on the chart, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles I, IV, V and VII, quoted in short phrases. The site's doctrinal standard. Compared by eye."),
    ("The Baptist Catechism (1693)", "One answer, on justification. Wording still to be checked against the site's creeds collection."),
    ("The Council of Trent, session 6 (1547)", "Chapters 7, 8 and 10, shown as Roman Catholic teaching, not this site's. Waterworth's English (1848), still to be checked."),
    ("The Catechism of the Catholic Church", "Paragraphs 1989, 1992 and 1993, shown as Roman Catholic teaching. Still to be checked against the Vatican's English text."),
    ("John Calvin, Antidote to the Council of Trent (1547)", "One line, given in paraphrase without quotation marks until its wording is checked."),
]
