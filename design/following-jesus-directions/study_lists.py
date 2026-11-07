"""The lists the Following Jesus page draws beside the study's own text. build-data.py checks every phrase here against
the Berean, so a row cannot claim words its verse does not hold. These are this study's choices, not a count."""

# The whole sermon, as Matthew sets it out: the map at the top of the page draws these verses.
SERMON = "Matthew 5:1–7:29"
# The study reads the sermon through except the prayer, which has its own study.
NOT_READ = "Matthew 6:5–15"
# The two frames Matthew built, which the map draws as arches. Each phrase is checked in both its verses.
FRAMES = [
    {"id": "listeners", "name": "Who is listening", "open": "Matthew 5:1–2", "open_words": "His disciples came to Him",
     "shut": "Matthew 7:28–29", "shut_words": "the crowds were astonished at His teaching"},
    {"id": "law", "name": "The Law and the Prophets", "open": "Matthew 5:17", "open_words": "the Law or the Prophets",
     "shut": "Matthew 7:12", "shut_words": "the Law and the Prophets"},
]
# The six reading parts and the verses of the sermon each one reads, in order, with no gap but the prayer.
PART_RANGES = {"01": "Matthew 5:1–16", "02": "Matthew 5:17–48", "03": "Matthew 6:1–18", "04": "Matthew 6:19–34",
               "05": "Matthew 7:1–12", "06": "Matthew 7:13–29"}

# Ten famous lines, each put back inside its whole. "who", "before" and "after" are the three questions of the habit.
# Every *_phrase must be in its verse, and every verse must be inside "whole". "reading" is the study's own point,
# in the site's voice, taken from content.md.
LINES = [
    {"id": "light", "says": "Let your light shine", "ref": "Matthew 5:16", "phrase": "let your light shine before men",
     "whole": SERMON, "who_ref": "Matthew 5:1", "who_phrase": "His disciples came to Him",
     "who": "His disciples, with the crowds listening",
     "before_ref": "Matthew 5:14", "before_phrase": "You are the light of the world",
     "after_ref": "Matthew 6:1", "after_phrase": "Be careful not to perform your righteous acts before men to be seen by them",
     "reading": "The point of the light is the Father’s glory, not the disciple’s. Chapter 6 warns against good deeds done to be seen."},
    {"id": "cheek", "says": "Turn the other cheek", "ref": "Matthew 5:39", "phrase": "turn to him the other also",
     "whole": SERMON, "who_ref": "Matthew 5:39", "who_phrase": "If someone slaps you on your right cheek",
     "who": "The one who has been wronged",
     "before_ref": "Matthew 5:38", "before_phrase": "Eye for eye and tooth for tooth",
     "after_ref": "Matthew 5:44", "after_phrase": "love your enemies and pray for those who persecute you",
     "reading": "Jesus speaks to people who have been wronged, not setting out how a government should work. It never means staying where you are being harmed."},
    {"id": "perfect", "says": "Be perfect", "ref": "Matthew 5:48", "phrase": "Be perfect, therefore",
     "whole": SERMON, "who_ref": "Matthew 5:1", "who_phrase": "His disciples came to Him",
     "who": "His disciples, with the crowds listening",
     "before_ref": "Matthew 5:45", "before_phrase": "He causes His sun to rise on the evil and the good",
     "after_ref": "Matthew 6:1", "after_phrase": "Be careful not to perform your righteous acts before men",
     "reading": "“Therefore” points back to the Father who is kind to enemies. Perfect means complete, whole and undivided."},
    {"id": "worry", "says": "Do not worry", "ref": "Matthew 6:25", "phrase": "do not worry about your life",
     "whole": SERMON, "who_ref": "Matthew 5:1", "who_phrase": "His disciples came to Him",
     "who": "His disciples, with the crowds listening",
     "before_ref": "Matthew 6:24", "before_phrase": "You cannot serve both God and money",
     "after_ref": "Matthew 6:33", "after_phrase": "But seek first the kingdom of God and His righteousness",
     "reading": "“Do not worry” comes straight after treasure and money, and it goes on to seeking the kingdom first."},
    {"id": "judge", "says": "Do not judge", "ref": "Matthew 7:1", "phrase": "Do not judge, or you will be judged",
     "whole": SERMON, "who_ref": "Matthew 5:1", "who_phrase": "His disciples came to Him",
     "who": "His disciples, with the crowds listening",
     "before_ref": "Matthew 6:34", "before_phrase": "Therefore do not worry about tomorrow",
     "after_ref": "Matthew 7:5", "after_phrase": "First take the beam out of your own eye",
     "reading": "It forbids condemning others while refusing to look at yourself. The aim is still to help the brother, and the next verse asks for discernment."},
    {"id": "ask", "says": "Ask, and it will be given", "ref": "Matthew 7:7", "phrase": "Ask, and it will be given to you",
     "whole": SERMON, "who_ref": "Matthew 5:1", "who_phrase": "His disciples came to Him",
     "who": "His disciples, with the crowds listening",
     "before_ref": "Matthew 7:6", "before_phrase": "Do not give dogs what is holy",
     "after_ref": "Matthew 7:11", "after_phrase": "how much more will your Father in heaven give good things to those who ask Him",
     "reading": "The ground is the Father’s character, not a method. It is not a formula that obliges God to give whatever we name."},
    {"id": "gate", "says": "The narrow gate", "ref": "Matthew 7:13", "phrase": "Enter through the narrow gate",
     "whole": SERMON, "who_ref": "Matthew 7:28", "who_phrase": "the crowds were astonished at His teaching",
     "who": "His disciples, and the crowds who heard it to the end",
     "before_ref": "Matthew 7:12", "before_phrase": "this is the essence of the Law and the Prophets",
     "after_ref": "Matthew 7:24", "after_phrase": "everyone who hears these words of Mine and acts on them",
     "reading": "The sermon ends in pairs, and each pair asks the same question: has the hearing turned into a life?"},
    {"id": "hate", "says": "Hate his father and mother", "ref": "Luke 14:26", "phrase": "does not hate his father and mother",
     "whole": "Luke 14:25–35", "who_ref": "Luke 14:25", "who_phrase": "Large crowds were now traveling with Jesus",
     "who": "Large crowds travelling with Him",
     "before_ref": "Luke 14:25", "before_phrase": "He turned and said to them",
     "after_ref": "Luke 14:28", "after_phrase": "count the cost",
     "reading": "“Hate” is a Hebrew way of saying which loyalty comes first. Christ’s claim comes before every other claim, and it is never a licence to control or abuse."},
    {"id": "rest", "says": "Come to Me, all you who are weary", "ref": "Matthew 11:28", "phrase": "Come to Me, all you who are weary and burdened",
     "whole": "Matthew 11:20–30", "who_ref": "Matthew 11:28", "who_phrase": "all you who are weary and burdened",
     "who": "Anyone weary and burdened",
     "before_ref": "Matthew 11:27", "before_phrase": "no one knows the Father except the Son",
     "after_ref": "Matthew 11:29", "after_phrase": "Take My yoke upon you and learn from Me",
     "reading": "The invitation stands on a claim no ordinary teacher makes. The rest is not idleness: it is a yoke, worn with Him."},
    {"id": "whatever", "says": "Ask whatever you wish", "ref": "John 15:7", "phrase": "ask whatever you wish",
     "whole": "John 14:31–15:17", "who_ref": "John 14:31", "who_phrase": "Get up! Let us go on from here",
     "who": "His disciples, the night before the cross",
     "before_ref": "John 15:7", "before_phrase": "If you remain in Me and My words remain in you",
     "after_ref": "John 15:12", "after_phrase": "love one another as I have loved you",
     "reading": "The asking belongs to people whose wishes are being shaped by His words. It is not an open cheque."},
]

# Part 01: the nine sayings that begin "Blessed are", who is blessed and what is promised, each in its verse.
BEATITUDES = [
    ("Matthew 5:3", "the poor in spirit", "theirs is the kingdom of heaven"),
    ("Matthew 5:4", "those who mourn", "they will be comforted"),
    ("Matthew 5:5", "the meek", "they will inherit the earth"),
    ("Matthew 5:6", "those who hunger and thirst for righteousness", "they will be filled"),
    ("Matthew 5:7", "the merciful", "they will be shown mercy"),
    ("Matthew 5:8", "the pure in heart", "they will see God"),
    ("Matthew 5:9", "the peacemakers", "they will be called sons of God"),
    ("Matthew 5:10", "those who are persecuted because of righteousness", "theirs is the kingdom of heaven"),
    ("Matthew 5:11–12", "you when people insult you, persecute you", "great is your reward in heaven"),
]

# Part 02: six times what was said, set beside "But I tell you". Each half is checked in its own verse.
SAYINGS = [
    {"topic": "Murder", "said_ref": "Matthew 5:21", "said": "Do not murder", "tell_ref": "Matthew 5:22", "tell": "anyone who is angry with his brother will be subject to judgment"},
    {"topic": "Adultery", "said_ref": "Matthew 5:27", "said": "Do not commit adultery", "tell_ref": "Matthew 5:28", "tell": "has already committed adultery with her in his heart"},
    {"topic": "Divorce", "said_ref": "Matthew 5:31", "said": "Whoever divorces his wife must give her a certificate of divorce", "tell_ref": "Matthew 5:32", "tell": "anyone who divorces his wife, except for sexual immorality, brings adultery upon her"},
    {"topic": "Oaths", "said_ref": "Matthew 5:33", "said": "Do not break your oath", "tell_ref": "Matthew 5:34", "tell": "not to swear at all"},
    {"topic": "Eye for eye", "said_ref": "Matthew 5:38", "said": "Eye for eye and tooth for tooth", "tell_ref": "Matthew 5:39", "tell": "not to resist an evil person"},
    {"topic": "Enemies", "said_ref": "Matthew 5:43", "said": "Love your neighbor", "tell_ref": "Matthew 5:44", "tell": "love your enemies and pray for those who persecute you"},
]

# Part 03: the three practices, each with the same refrain. Prayer is read in its own study, so it is marked as such.
PRACTICES = [
    {"id": "give", "name": "Giving", "when_ref": "Matthew 6:2", "when": "when you give to the needy", "secret_ref": "Matthew 6:3", "secret": "do not let your left hand know what your right hand is doing", "refrain_ref": "Matthew 6:4", "read_here": True},
    {"id": "pray", "name": "Prayer", "when_ref": "Matthew 6:5", "when": "when you pray", "secret_ref": "Matthew 6:6", "secret": "go into your inner room, shut your door", "refrain_ref": "Matthew 6:6", "read_here": False},
    {"id": "fast", "name": "Fasting", "when_ref": "Matthew 6:16", "when": "When you fast", "secret_ref": "Matthew 6:17", "secret": "anoint your head and wash your face", "refrain_ref": "Matthew 6:18", "read_here": True},
]
REFRAIN = "your Father, who sees what is done in secret, will reward you"
HYPOCRITES = "hypocrites"  # checked in all three "when" verses

# Part 04: the rich man's own words, and God's answer. The first-person words are counted by script.
RICH_MAN = {"words": "Luke 12:17–19", "answer_ref": "Luke 12:20", "answer": "You fool! This very night your life will be required of you"}

# Part 06: four pairs at the end of the sermon. Each side is checked in its verse.
PAIRS = [
    {"id": "gates", "name": "Two gates", "one_ref": "Matthew 7:14", "one": "small is the gate and narrow the way that leads to life",
     "two_ref": "Matthew 7:13", "two": "wide is the gate and broad is the way that leads to destruction"},
    {"id": "trees", "name": "Two trees", "one_ref": "Matthew 7:17", "one": "every good tree bears good fruit",
     "two_ref": "Matthew 7:17", "two": "a bad tree bears bad fruit"},
    {"id": "lords", "name": "Two who say “Lord”", "one_ref": "Matthew 7:21", "one": "he who does the will of My Father in heaven",
     "two_ref": "Matthew 7:23", "two": "I never knew you"},
    {"id": "builders", "name": "Two builders", "one_ref": "Matthew 7:24", "one": "a wise man who built his house on the rock",
     "two_ref": "Matthew 7:26", "two": "a foolish man who built his house on sand"},
]

# Part 07 beside part 08: the two key verses the page sets side by side.
BESIDE = [("Luke 14:28", "count the cost"), ("Matthew 11:28", "Come to Me")]

# Part 09: the vine is drawn from every verse of this passage that says "remain".
VINE = {"passage": "John 15:1–17", "word": "remain"}

# Facts the page states in its own voice, each tested: (says, reference, phrase, exact count). Case-sensitive.
FACTS = [
    ("“But I tell you” six times in Matthew 5", "Matthew 5:21–48", "But I tell you", 6),
    ("“have heard that it was said” five times; 5:31 has “It has also been said”", "Matthew 5:21–48", "have heard that it was said", 5),
    ("“It has also been said” once, at 5:31", "Matthew 5:31", "It has also been said", 1),
    ("Nine sayings begin “Blessed are”", "Matthew 5:3–11", "Blessed are", 9),
    ("“The Law and the Prophets” wording at 7:12", "Matthew 7:12", "the Law and the Prophets", 1),
]
# Every crisis number named in the study's care notes must be one of the site's checked help lines.
CRISIS_NUMBERS = ["988", "024", "800 911 2000", "188"]
# Every care note in the study, by its opening words. Each must be drawn as a care note, so none can quietly become a
# plain paragraph or vanish. Adding a care note to content.md means adding its opening words here.
CARE_NOTES = ["If you are thinking of hurting yourself", "“But I tell you not to resist an evil person” does not",
              "Anxiety can be an illness", "“All these things will be added” is not a promise of wealth",
              "This promise is about a good Father", "This warning strips away false confidence",
              "If someone uses this verse", "What about the branch"]

# The few places where content.md's wording is not the Berean's (found on 2026-11-07 and listed in the README for the
# owner). The page shows the Berean's words. The build fails if an original no longer appears in content.md, so a
# fix that is no longer needed cannot linger, and the replacement is checked against its verse like any quotation.
MISQUOTE_FIXES = [
    {"was": "I write these things to you who believe", "now": "I have written these things to you who believe", "ref": "1 John 5:13"},
    {"was": "be holy, for I am holy", "now": "Be holy because I, the LORD your God, am holy", "ref": "Leviticus 19:2"},
    {"was": "\"Do not resist an evil person\" does not", "now": "\"But I tell you not to resist an evil person\" does not", "ref": "Matthew 5:39", "check": "But I tell you not to resist an evil person"},
]

# Studies the text names in italics. A study with a mock-up on this PC links to it; the rest are named only.
STUDY_LINKS = {
    "Prayer across Scripture: learning to pray": "/mockups/prayer-in-the-letters-directions/",  # built 2026-10-30 from this study's earlier text
    "The kingdom he announced": "/mockups/the-kingdom-he-announced-directions/",
    "Sexuality, singleness and divorce": "/mockups/marriage-sexuality-and-singleness-directions/",
    "The Christian and the state": None,
    "Leviticus: holiness and sacrifice": "/mockups/the-law-of-moses-and-the-christian-directions/",
    "The Ten Commandments": None,
    "Fear, anxiety and despair": None,
    "Money, possessions and generosity": None,
    "Chosen and kept: can I be sure?": None,
    "Who do you say that I am? Who Jesus really is": "/mockups/who-do-you-say-that-i-am-directions/",
    "Saved by grace: how God forgives and changes us": "/mockups/grace-faith-and-salvation-directions/",
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "/mockups/what-the-cross-accomplishes-directions/",
    "Witness and the nations: telling others about Jesus": "/mockups/bearing-witness-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "The Cost of Discipleship": False,  # a book, not a study: shown in italics, never linked
}

# Quoted words that are not Scripture. Each is named with where it comes from. None of these sources is held in full on
# this PC, so they are compared by eye, not by script; the README says so.
OUTSIDE_QUOTES = {
    "on principles of righteousness": "Baptist Faith and Message 2000, article XVI",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "Baptist Faith and Message 2000, article IV",
    "will never fall away from the state of grace": "Baptist Faith and Message 2000, article V",
    "cheerfully, regularly, systematically, proportionately, and liberally": "Baptist Faith and Message 2000, article XIII",
    "chamber of secrets": "Mishnah, Shekalim 5:6 (marked in the study as still to check)",
    "What is hateful to you, do not do to your neighbour": "Babylonian Talmud, Shabbat 31a (translation marked as still to check)",
    "the yoke of the kingdom of heaven": "Mishnah, Berakhot 2:2 (marked in the study as still to check)",
    "the yoke of the commandments": "Mishnah, Berakhot 2:2 (marked in the study as still to check)",
    "cheap grace": "Dietrich Bonhoeffer, The Cost of Discipleship (1937)",
    "bad eye": "the Hebrew of Deuteronomy 15:9, word for word; the Berean has “begrudgingly” (marked in the study as still to check)",
}

# Quoted words that are the study's own terms, not quotations from anywhere. Kept empty unless a real case needs it.
OWN_TERMS = {"empty-head",  # the study's own gloss of "Raca", not a quotation
             "I stopped knowing you"}  # part 06 asks why Jesus did not say this; the words are the study's

# Quotations whose verse the paragraph does not cite (a callback, or a reference given only as a chapter). Each phrase
# is checked in the verse named here, so the callback cannot drift from the Berean either.
QUOTE_HOMES = {
    "take up his cross": "Mark 8:34",
    "But I tell you": "Matthew 5:22",
    "count the cost": "Luke 14:28",
    "Count the cost": "Luke 14:28",
    "Do not judge": "Matthew 7:1",
    "Do not worry": "Matthew 6:25",
    "where your treasure is": "Matthew 6:21",
    "come to Me": "Matthew 11:28",
}
# The study's close names three of its lessons. Each opens its famous line in the map at the top of the page.
CLOSE_CALLBACKS = {"Do not judge": "judge", "Do not worry": "worry", "Count the cost": "hate"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site’s copy."),
    ("The Baptist Faith and Message 2000", "Articles IV, V, XIII and XVI, quoted in short phrases. The site’s doctrinal standard. Compared by eye; not held in full on this PC."),
    ("The Mishnah and the Babylonian Talmud", "Four short phrases and one saying of Hillel, reported. Each is marked in the study as still to check."),
    ("The Schleitheim Confession (1527), the Second London Confession, Luther, Bonhoeffer", "Named and described, not quoted at length. The study says plainly that it has not read them directly."),
    ("The site’s help lines", "The four crisis numbers in part 02, checked by script against the site’s own checked list."),
]
