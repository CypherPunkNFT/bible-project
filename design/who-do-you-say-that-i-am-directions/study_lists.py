"""The lists behind the Who do you say that I am mock-up: the answers and who said them, the words that join them, the forms of the readings, and the closed lists the text is checked against. build-data.py checks every phrase here against its verse."""

GROUPS = [
    {"id": "crowds", "name": "The crowds"},
    {"id": "home", "name": "Home and family"},
    {"id": "accusers", "name": "His accusers"},
    {"id": "powers", "name": "The tempter and the spirits"},
    {"id": "rulers", "name": "Rulers, soldiers and mockers"},
    {"id": "met", "name": "People who met Him"},
    {"id": "disciples", "name": "John and the disciples"},
    {"id": "writers", "name": "The writers and the angels"},
    {"id": "voice", "name": "The voice from heaven"},
    {"id": "himself", "name": "Jesus Himself"},
]
HOW = {"said": "stated", "asked": "asked", "dared": "said as a dare", "mocked": "said in mockery", "charged": "said as a charge", "reported": "reported by others"}


def answer(identity: str, group: str, who: str, how: str, reference: str, words: str, after: tuple | None, read: str, span: int = 0, narrated: bool = False) -> dict:
    return {"id": identity, "group": group, "who": who, "how": how, "ref": reference, "words": words, "next": after, "read": read, "span": span, "narrated": narrated}


# span: which quoted speech in the verse holds the words, counted from 0. narrated: the verse has no speech marks for these words, so the span check does not apply.
ANSWERS = [
    answer("prophets", "crowds", "Some, as the disciples report", "reported", "Matthew 16:14", "one of the prophets", ("Matthew 16:15", "But what about you?"), "Matthew 16:13–16"),
    answer("goodman", "crowds", "Some in the crowds", "said", "John 7:12", "He is a good man.", ("John 7:13", "no one would speak publicly about Him"), "John 7:10–13"),
    answer("deceives", "crowds", "Others in the crowds", "said", "John 7:12", "He deceives the people.", ("John 7:13", "no one would speak publicly about Him"), "John 7:10–13", span=1),
    answer("greatprophet", "crowds", "The crowd at Nain", "said", "Luke 7:16", "A great prophet has appeared among us!", ("Luke 7:16", "they glorified God"), "Luke 7:11–17"),
    answer("hosanna", "crowds", "The crowds at Jerusalem", "said", "Matthew 21:9", "Hosanna to the Son of David!", ("Matthew 21:10", "the whole city was stirred"), "Matthew 21:8–11"),
    answer("carpenter", "home", "His home town", "asked", "Mark 6:3", "Isn't this the carpenter", ("Mark 6:3", "And they took offense at Him."), "Mark 6:1–6"),
    answer("mind", "home", "His family", "said", "Mark 3:21", "He is out of His mind.", ("Mark 3:21", "they went out to take custody of Him"), "Mark 3:20–21"),
    answer("blaspheming", "accusers", "Some scribes, in their hearts", "charged", "Mark 2:7", "He is blaspheming!", ("Mark 2:10", "the Son of Man has authority on earth to forgive sins"), "Mark 2:5–12"),
    answer("beelzebul", "accusers", "Scribes from Jerusalem", "charged", "Mark 3:22", "He is possessed by Beelzebul", ("Mark 3:23", "How can Satan drive out Satan?"), "Mark 3:22–27"),
    answer("friend", "accusers", "Others, as Jesus reports", "mocked", "Matthew 11:19", "a friend of tax collectors and sinners", None, "Matthew 11:16–19"),
    answer("samaritan", "accusers", "Opponents at the temple", "charged", "John 8:48", "You are a Samaritan and You have a demon", ("John 8:49", "I do not have a demon"), "John 8:48–50"),
    answer("tempter", "powers", "The tempter", "dared", "Matthew 4:3", "If You are the Son of God", ("Matthew 4:11", "Then the devil left Him"), "Matthew 4:1–11"),
    answer("spiritholy", "powers", "An unclean spirit", "said", "Mark 1:24", "the Holy One of God", ("Mark 1:25", "Be silent!"), "Mark 1:23–27"),
    answer("spiritsson", "powers", "Unclean spirits", "said", "Mark 3:11", "You are the Son of God!", ("Mark 3:12", "He warned them sternly not to make Him known"), "Mark 3:11–12"),
    answer("highpriest", "rulers", "The high priest", "asked", "Mark 14:61", "Are You the Christ, the Son of the Blessed One?", ("Mark 14:64", "You have heard the blasphemy."), "Mark 14:60–64"),
    answer("pilate", "rulers", "Pilate", "asked", "Mark 15:2", "Are You the King of the Jews?", ("Mark 15:2", "You have said so"), "Mark 15:1–5"),
    answer("salute", "rulers", "The soldiers", "mocked", "Mark 15:18", "Hail, King of the Jews!", ("Mark 15:19", "They kept striking His head with a staff"), "Mark 15:16–20"),
    answer("notice", "rulers", "The charge over the cross", "charged", "Mark 15:26", "THE KING OF THE JEWS", None, "Mark 15:25–27", narrated=True),
    answer("taunt", "rulers", "Chief priests and scribes", "mocked", "Mark 15:32", "Let the Christ, the King of Israel, come down now from the cross", ("Mark 15:32", "even those who were crucified with Him berated Him"), "Mark 15:29–32"),
    answer("nicodemus", "met", "Nicodemus", "said", "John 3:2", "a teacher who has come from God", ("John 3:3", "no one can see the kingdom of God unless he is born again"), "John 3:1–3"),
    answer("goodteacher", "met", "A man who ran up", "said", "Mark 10:17", "Good Teacher", ("Mark 10:22", "went away in sorrow"), "Mark 10:17–22"),
    answer("bartimaeus", "met", "A blind beggar", "said", "Mark 10:47", "Jesus, Son of David", ("Mark 10:52", "followed Jesus along the road"), "Mark 10:46–52"),
    answer("woman", "met", "A woman at a well", "asked", "John 4:29", "Could this be the Christ?", ("John 4:39", "Many of the Samaritans from that town believed in Jesus"), "John 4:28–42"),
    answer("samaritans", "met", "Her town", "said", "John 4:42", "the Savior of the world", None, "John 4:39–42"),
    answer("blindprophet", "met", "A man who had been blind", "said", "John 9:17", "He is a prophet", ("John 9:38", "he worshiped Jesus"), "John 9:13–38", span=1),
    answer("blindlord", "met", "The same man, later", "said", "John 9:38", "Lord, I believe", ("John 9:38", "he worshiped Jesus"), "John 9:35–38"),
    answer("martha", "met", "Martha", "said", "John 11:27", "You are the Christ, the Son of God, who was to come into the world", ("John 11:28", "she went back and called her sister Mary"), "John 11:25–28", span=1),
    answer("centurion", "met", "A centurion, at the cross", "said", "Mark 15:39", "Truly this man was the Son of God!", None, "Mark 15:37–39"),
    answer("lamb", "disciples", "John the Baptist", "said", "John 1:29", "the Lamb of God", None, "John 1:29–34"),
    answer("andrew", "disciples", "Andrew", "said", "John 1:41", "We have found the Messiah", ("John 1:42", "Andrew brought him to Jesus"), "John 1:40–42"),
    answer("nathanael", "disciples", "Nathanael", "said", "John 1:49", "You are the King of Israel!", ("John 1:50", "You will see greater things than these."), "John 1:47–51", span=1),
    answer("boat", "disciples", "The disciples, in the boat", "asked", "Mark 4:41", "Who is this", None, "Mark 4:39–41"),
    answer("peterholy", "disciples", "Simon Peter", "said", "John 6:69", "the Holy One of God", None, "John 6:66–69"),
    answer("peter", "disciples", "Simon Peter, on the road", "said", "Matthew 16:16", "You are the Christ, the Son of the living God.", ("Matthew 16:22", "This shall never happen to You!"), "Matthew 16:13–23"),
    answer("thomas", "disciples", "Thomas", "said", "John 20:28", "My Lord and my God!", ("John 20:29", "blessed are those who have not seen and yet have believed"), "John 20:24–29"),
    answer("markone", "writers", "Mark, opening his book", "said", "Mark 1:1", "Jesus Christ, the Son of God", None, "Mark 1:1–3", narrated=True),
    answer("johnone", "writers", "John, opening his book", "said", "John 1:1", "the Word was God", None, "John 1:1–5", narrated=True),
    answer("gabriel", "writers", "The angel, to Mary", "said", "Luke 1:32", "the Son of the Most High", None, "Luke 1:30–33", narrated=True),
    answer("angels", "writers", "An angel, to shepherds", "said", "Luke 2:11", "Christ the Lord", None, "Luke 2:8–14", narrated=True),
    answer("river", "voice", "At the river", "said", "Mark 1:11", "You are My beloved Son", None, "Mark 1:9–11"),
    answer("mountain", "voice", "On the mountain", "said", "Matthew 17:5", "This is My beloved Son, in whom I am well pleased. Listen to Him!", ("Matthew 17:6", "they fell facedown in terror"), "Matthew 17:1–8"),
    answer("abraham", "himself", "To His opponents", "said", "John 8:58", "before Abraham was born, I am!", ("John 8:59", "they picked up stones to throw at Him"), "John 8:56–59", span=1),
    answer("one", "himself", "At the temple", "said", "John 10:30", "I and the Father are one", ("John 10:31", "again picked up stones to stone Him"), "John 10:30–33"),
    answer("iam", "himself", "To the high priest", "said", "Mark 14:62", "I am", ("Mark 14:64", "they all condemned Him as deserving of death"), "Mark 14:62–64"),
    answer("resurrection", "himself", "To Martha", "said", "John 11:25", "I am the resurrection and the life", ("John 11:27", "Yes, Lord"), "John 11:25–27"),
    answer("way", "himself", "To Thomas", "said", "John 14:6", "I am the way and the truth and the life", None, "John 14:5–7"),
    answer("serve", "himself", "To the disciples", "said", "Mark 10:45", "did not come to be served, but to serve", None, "Mark 10:42–45"),
]

# A word's lines are found by searching the words themselves, and must equal the list typed here, so that a change to either one fails the build.
WORD_LENSES = [
    {"id": "son", "label": "Son of God", "pattern": r"\bSon of (?:God|the (?:living God|Blessed One|Most High))\b|\bMy (?:beloved )?Son\b",
     "expect": {"tempter", "spiritsson", "highpriest", "martha", "centurion", "peter", "markone", "gabriel", "river", "mountain"}, "never": ["Son of Man", "Son of David", "son of Joseph"]},
    {"id": "christ", "label": "Christ", "pattern": r"\bChrist\b|\bMessiah\b", "expect": {"highpriest", "taunt", "woman", "martha", "andrew", "peter", "markone", "angels"}, "never": ["Christian"]},
    {"id": "king", "label": "King", "pattern": r"\bKing\b|\bKING\b", "expect": {"pilate", "salute", "notice", "taunt", "nathanael"}, "never": ["kingdom", "king of Assyria"]},
    {"id": "lord", "label": "Lord", "pattern": r"\bLord\b", "expect": {"blindlord", "thomas", "angels"}, "never": ["LORD", "lord"]},
    {"id": "prophet", "label": "Prophet", "pattern": r"\b[Pp]rophets?\b", "expect": {"prophets", "greatprophet", "blindprophet"}, "never": ["prophecy"]},
    {"id": "holy", "label": "Holy One", "pattern": r"\bHoly One of God\b", "expect": {"spiritholy", "peterholy"}, "never": ["Holy Spirit"]},
    {"id": "teacher", "label": "Teacher", "pattern": r"\b[Tt]eacher\b", "expect": {"nicodemus", "goodteacher"}, "never": ["teaching", "Rabbi"]},
    {"id": "david", "label": "Son of David", "pattern": r"\bSon of David\b", "expect": {"hosanna", "bartimaeus"}, "never": ["son of Joseph"]},
]
# The wall's readout is labelled with two of the four questions in the text's Habit, which must be in the Habit. The third field is what came next in the
# passage, often someone else's words, so it is not labelled with the Habit's "What do they do next?".
READOUT_LABELS = {"who": "Who is speaking?", "words": "What exactly do they say?", "next": "What came next"}

# The readings, by number and title as the text has them. A changed title or order fails the build, so a form cannot land on the wrong reading.
READINGS = [("01", "The question on the road", "road"), ("02", "Blessed, and then rebuked", "turn"), ("03", "Before the council", "council"), ("04", "The voice from heaven", "voice"),
            ("05", "The Word became flesh: how God became a man", "word"), ("06", "Thomas sets his terms", "thomas")]
READING_FORMS = {"road": ["road"], "turn": ["turn"], "council": ["council"], "voice": ["voice"], "word": ["word"], "thomas": ["thomas", "written"]}
# Where the text points to another part by number, the part it names must be the reading meant.
PART_MENTIONS = {"Part 03 shows where Jesus takes it further": "council", "(part 04)": "voice", "Part 06 shows one of them doing so": "thomas"}
SECOND_QUESTION = "Who do you say I am?"
SECOND_QUESTION_AT = ["Matthew 16:15", "Mark 8:29", "Luke 9:20"]

FORMS = {
    "road": {"kind": "three", "name": "One moment, three accounts", "columns": [
        {"book": "Matthew", "where": ("Matthew 16:13", "the region of Caesarea Philippi"), "first": ("Matthew 16:13", "Who do people say the Son of Man is?"), "reports": ("Matthew 16:14", "Some say John the Baptist; others say Elijah; and still others, Jeremiah or one of the prophets."), "second": ("Matthew 16:15", SECOND_QUESTION), "answer": ("Matthew 16:16", "You are the Christ, the Son of the living God.")},
        {"book": "Mark", "where": ("Mark 8:27", "the villages around Caesarea Philippi"), "first": ("Mark 8:27", "Who do people say I am?"), "reports": ("Mark 8:28", "Some say John the Baptist; others say Elijah; and still others, one of the prophets."), "second": ("Mark 8:29", SECOND_QUESTION), "answer": ("Mark 8:29", "You are the Christ.")},
        {"book": "Luke", "where": ("Luke 9:18", "praying in private"), "first": ("Luke 9:18", "Who do the crowds say I am?"), "reports": ("Luke 9:19", "Some say John the Baptist; others say Elijah; and still others, that a prophet of old has arisen."), "second": ("Luke 9:20", SECOND_QUESTION), "answer": ("Luke 9:20", "The Christ of God.")},
    ], "rows": [["where", "Where"], ["first", "The first question"], ["reports", "The reports"], ["second", "The second question"], ["answer", "Peter's answer"]], "same": "second"},
    "turn": {"kind": "steps", "name": "Six verses, down and back", "steps": [
        ("Peter", "Matthew 16:16", "You are the Christ, the Son of the living God."), ("Jesus", "Matthew 16:17", "Blessed are you, Simon son of Jonah!"), ("Jesus", "Matthew 16:20", "not to tell anyone that He was the Christ"),
        ("Jesus", "Matthew 16:21", "He must be killed and on the third day be raised to life"), ("Peter", "Matthew 16:22", "This shall never happen to You!"), ("Jesus", "Matthew 16:23", "Get behind Me, Satan!"), ("Jesus", "Matthew 16:24", "he must deny himself and take up his cross and follow Me")],
        "blessed": "Matthew 16:17", "rebuked": "Matthew 16:23"},
    "council": {"kind": "record", "name": "What was said in the room, and the witnesses He names", "steps": [
        ("Witnesses", "Mark 14:56", "their testimony was inconsistent"), ("More witnesses", "Mark 14:59", "even their testimony was inconsistent"), ("Jesus", "Mark 14:61", "But Jesus remained silent and made no reply."),
        ("The high priest", "Mark 14:61", "Are You the Christ, the Son of the Blessed One?"), ("Jesus", "Mark 14:62", "I am"), ("The high priest", "Mark 14:64", "You have heard the blasphemy."), ("The council", "Mark 14:64", "they all condemned Him as deserving of death")],
        "witnessesTitle": "In John 5, the witnesses He names", "witnesses": [("John", "John 5:33", "he has testified to the truth"), ("The works", "John 5:36", "the very works I am doing"), ("The Father", "John 5:37", "the Father who sent Me has Himself testified about Me"), ("The Scriptures", "John 5:39", "These are the very words that testify about Me"), ("Moses", "John 5:46", "he wrote about Me")]},
    "voice": {"kind": "aligned", "name": "The two sentences, laid one above the other", "first": ("Matthew 3:17", "This is My beloved Son, in whom I am well pleased!"), "second": ("Matthew 17:5", "This is My beloved Son, in whom I am well pleased. Listen to Him!"),
              "shared": "This is My beloved Son, in whom I am well pleased", "added": "Listen to Him!", "firstPlace": "At the river", "secondPlace": "On the mountain",
              "others": [("Mark 1:11", "You are My beloved Son; in You I am well pleased."), ("Luke 3:22", "You are My beloved Son; in You I am well pleased."), ("Mark 9:7", "This is My beloved Son. Listen to Him!"), ("Luke 9:35", "This is My Son, whom I have chosen. Listen to Him!")]},
    # Who says it, and to whom: one row per speaker, each in their own verse. No columns sort the words into two sides. The church rows are marked as not Scripture.
    "word": {"kind": "ledger", "name": "Who says it, and to whom", "rows": [
        {"who": "John, opening his Gospel", "said": [("John 1:1", "the Word was God"), ("John 1:14", "The Word became flesh")], "gold": "became"},
        {"who": "The angel, to Joseph", "said": [("Matthew 1:20", "the One conceived in her is from the Holy Spirit")], "gold": None},
        {"who": "The angel, to Mary", "said": [("Luke 1:35", "the Holy One to be born will be called the Son of God")], "gold": None},
        {"who": "Isaiah, to King Ahaz, and Matthew after him", "said": [("Isaiah 7:14", "the virgin will be with child"), ("Matthew 1:23", "God with us")], "gold": None},
        {"who": "Paul, to the church at Philippi", "said": [("Philippians 2:6", "existing in the form of God"), ("Philippians 2:7", "taking the form of a servant")], "gold": "taking"},
        {"who": "The letter to the Hebrews", "said": [("Hebrews 2:17", "He had to be made like His brothers in every way")], "gold": None},
        {"who": "Paul, to the Colossians", "said": [("Colossians 1:15", "the image of the invisible God"), ("Colossians 1:20", "making peace through the blood of His cross")], "gold": None}],
        "churchTitle": "Later, the church. Not Scripture", "church": [("The Council of Chalcedon, 451", "truly God and truly man"), ("The Baptist Faith and Message", "fully God, fully man")],
        "closing": "They do not explain *how* God and man are one person."},
    "thomas": {"kind": "mirror", "name": "His terms, and the answer", "leftTitle": "Thomas, to his friends", "rightTitle": "Jesus, eight days later", "rows": [
        (("John 20:25", "I see the nail marks in His hands"), ("John 20:27", "look at My hands")), (("John 20:25", "put my finger where the nails have been"), ("John 20:27", "Put your finger here")),
        (("John 20:25", "put my hand into His side"), ("John 20:27", "Reach out your hand and put it into My side.")), (("John 20:25", "I will never believe."), ("John 20:27", "Stop doubting and believe."))],
        "result": ("John 20:28", "My Lord and my God!"), "note": "He says this. The record does not say he touched anything."},
    "written": {"kind": "line", "name": "John's answers in order, from his first page to his last", "stops": [
        ("The writer", "John 1:1", "the Word was God"), ("John the Baptist", "John 1:29", "the Lamb of God"), ("Andrew", "John 1:41", "We have found the Messiah"), ("Nathanael", "John 1:49", "You are the King of Israel!"), ("A town in Samaria", "John 4:42", "the Savior of the world"),
        ("Simon Peter", "John 6:69", "the Holy One of God"), ("A man who had been blind", "John 9:38", "Lord, I believe"), ("Martha", "John 11:27", "You are the Christ, the Son of God"), ("Thomas", "John 20:28", "My Lord and my God!"), ("The writer, to you", "John 20:31", "so that you may believe")],
        "last": "You"},
}

# Commentary quotations: the heading the quote must sit under in the held file (None for a short creed), and the chapter and verse of the note it is in (None for
# sermons and books). "named" is the chapter, and verse if any, that content.md itself says the quote is on. A held place that differs from it fails the build
# unless KNOWN_ISSUES records the difference.
SOURCE_PLACES = {
    "We cannot take refuge from it in the general opinion.": {"anchor": "MATT. xvi. 13-28", "place": None, "named": None},
    "The reason of this seems to be that his time had not fully come": {"anchor": "MATTHEW - Chapter 16 - Verse 20", "place": (16, 20), "named": None},
    "The object of the Christian's faith is not a proposition; it is not a dogma nor a truth, but a Person.": {"anchor": "My Lord and my God", "place": None, "named": None},
    "In that sense the Jews plainly understood Him": {"anchor": "Before Abraham was, I am", "place": (8, 58), "named": ("in John 10", 10), "issue": "jfb-verse"},
    "There is no evidence that this was a mere expression, as some have supposed, of surprise or astonishment.": {"anchor": "JOHN - Chapter 20 - Verse 28", "place": (20, 28), "named": None},
    "though a servant, he was still the Lord": {"anchor": "How could Thomas cry out", "place": None, "named": None},
    "the primacy of jurisdiction over the universal Church of God was immediately and directly promised and given to blessed Peter the Apostle by Christ the Lord.": {"anchor": "We therefore teach and declare", "place": None, "named": None},
    "Unquestionably, the apostle is the rock on which the Church is built.": {"anchor": "MATT. xvi. 13-28", "place": None, "named": None},
    "not on the man Simon Bar-jona; but on him as the heavenly-taught confessor of a faith": {"anchor": "and upon this rock", "place": (16, 18), "named": None},
    "begotten, not made, being of one substance with the Father": {"anchor": None, "place": None, "named": None},
}
# Short documents held whole on this PC and quoted in plain prose. A quote must be in one paragraph, and its sentence must name the document.
OUTSIDE_QUOTES = {"truly God and truly man": ("chalcedon", "Chalcedon"), "in two natures, inconfusedly, unchangeably, indivisibly, inseparably": ("chalcedon", "Chalcedon")}
# The Baptist Faith and Message is not held on this PC. Each phrase must be cited to its own article, by number and, where the text names it, by name.
QUOTED_CONFESSION = {
    "possesses full dignity and is worthy of respect and Christian love": ("3", "man"),
    "truth, without any mixture of error": ("1", "the Scriptures"),
    "fully God, fully man": ("2", None),
    "was conceived of the Holy Spirit and born of the virgin Mary": ("2", "God the Son"),
    "There is no salvation apart from personal faith in Jesus Christ as Lord": ("4", "salvation"),
    "an autonomous local congregation of baptized believers": ("6", "the church"),
    "God alone is Lord of the conscience": ("17", "religious liberty"),
}
# The study's own words and glosses, in quotation marks but not quoted from a verse. A gloss is never accepted as Scripture: it is only allowed as itself.
GLOSSES = {"God", "a human being", "good news", "anointed one", "accuser", "adversary", "in flesh", "the LORD saves", "virgin birth"}
# Words named as words, each in the verse given here.
MENTIONS = {"The Christ": "Luke 9:20", "Word": "John 1:1", "Listen to Him!": "Matthew 17:5"}
# A quotation whose sentence has no reference and no block quotation above it in its part: the one verse it is from.
IMPLIED = {"At the right hand": "Mark 14:62", "the Word was God": "John 1:1", "We have seen the Lord!": "John 20:25", "Stop doubting and believe": "John 20:27"}
ABSENT_BOOKS = [{"books": ["MAT", "MRK", "LUK", "JHN"], "pattern": r"\bI am God\b", "control": "Isaiah 46:9", "says": "The exact sentence \"I am God\" is not in the four Gospels"}]
ABSENT_MENTIONS = {"I am God"}
ABSENT_RANGES = [{"label": "John 20:28–31", "pattern": r"\btouch|\bput\b|\bfinger", "control": "John 20:27", "says": "The record does not say Thomas touched anything"}]
# What the text says only one Gospel has, or one leaves out. The pattern must be found where the text says it is, and nowhere it says it is not.
ONLY_CLAIMS = [
    {"says": "Only Matthew adds Jeremiah", "pattern": r"\bJeremiah\b", "in": ["Matthew 16:14"], "not_in": ["Mark 8:28", "Luke 9:19"]},
    {"says": "Only Luke has the word \"daily\"", "pattern": r"\bdaily\b", "in": ["Luke 9:23"], "not_in": ["Matthew 16:24", "Mark 8:34"]},
    {"says": "Luke does not record the rebuke", "pattern": r"\bSatan\b", "in": ["Matthew 16:23", "Mark 8:33"], "not_in": ["Luke 9:18–27"]},
    {"says": "Luke gives no place", "pattern": r"\bCaesarea\b", "in": ["Matthew 16:13", "Mark 8:27"], "not_in": ["Luke 9:18–21"]},
]
# Every number written as a word in content.md, and how it is checked: "computed" against a count this build makes, "verse" against the words of a verse,
# "known" as a fault on KNOWN_ISSUES, or "plain" with the reason it needs no count. A number word not on this list fails the build.
COUNTS = {
    "ask four things": ("computed", "habitQuestions"), "Six scenes": ("known", "six-scenes"), "Three titles": ("computed", "titles"), "Three Gospels tell": ("computed", "roadColumns"),
    "same in all three Gospels": ("computed", "secondQuestion"), "three accounts": ("computed", "roadColumns"), "Six verses later": ("computed", "turnGap"),
    "six days later": ("verse", "Matthew 17:1", "After six days"), "two older passages": ("plain", "Psalm 110:1 and Daniel 7, both named in the next sentences"),
    "three terrified men": ("verse", "Matthew 17:1", "Peter, James, and John"), "three shelters": ("verse", "Matthew 17:4", "three shelters"), "all three together": ("plain", "Father, Son and Spirit, named in the same paragraph"),
    "Two church words": ("computed", "churchWords"), "two threatening kings": ("plain", "the kings of Aram and Israel, named in the same paragraph"), "two centuries": ("plain", "a date, not a count"),
    "two Christian readings": ("plain", "the Some and Others of the same paragraph"), "two who were at odds": ("plain", "a definition, not a count"), "in two natures": ("plain", "inside the Chalcedon quotation"),
    "four words": ("computed", "bfmWords"), "Eight days later the doors": ("verse", "John 20:26", "Eight days later"), "Eight days later Jesus": ("verse", "John 20:26", "Eight days later"), "four Gospels": ("plain", "Matthew, Mark, Luke and John"),
}
# Faults in the text that this build has found and may not hide. Each must still be true, so that once the text is fixed the entry has to be removed.
KNOWN_ISSUES = {
    "six-scenes": "The Selection says six scenes and a seventh reading at the centre, and lists \"the Gospel writers' own\" answer. The text now has six parts in all, five scenes and the reading on the incarnation, and the Gospel writers' own answer was the old part 06, now folded into Thomas.",
    "jfb-verse": "The text gives the Jamieson, Fausset and Brown quotation as on the stones in John 10. The held commentary has it in its note on John 8:58.",
}
# Every [check: ...] note in content.md, with what this build did about it. "verified": the quotation in the same line passed its held-source check here.
# "mismatch": the check found a fault, on KNOWN_ISSUES. "open": nothing here can check it. Notes never show on the page; the README lists them all.
CHECK_NOTES = {
    "confirm wording and locate in Maclaren's *Expositions of Holy Scripture*, on Matthew 16": "verified",
    "confirm wording in Barnes' *Notes on the New Testament*, on Matthew 16:20": "verified",
    "date commonly given, about 735–734 BC": "open",
    "which commentators hold which identification; Rashi is often cited for Isaiah's wife": "open",
    "wording against bfm.sbc.net": "open",
    "wording against the standard English translation of the Definition of Chalcedon, e.g. Schaff, *Creeds of Christendom*": "verified",
    "confirm wording and locate in Maclaren's *Expositions*, on John 20": "verified",
    "wording against the English translation used in the site's creeds collection": "verified",
    "confirm wording and verse": "mismatch",
    "confirm wording, on John 20:28": "verified",
    "confirm wording and locate, probably in Boyce's *Abstract of Systematic Theology*": "verified",
    "wording against the English text of *Pastor Aeternus*, chapter 1": "verified",
    "confirm wording, on Matthew 16:18": "verified",
    "confirm wording": "verified",
}

# Italic titles of other studies. The gate is only that a title is on this list and its link stays on this site; whether its mock-up exists is reported by
# --links and never failed on, because other jobs change those folders.
STUDY_LINKS = {
    "Encounters with Jesus": "../encounters-with-jesus-directions/", "The signs and works of Jesus": "../the-signs-and-works-of-jesus-directions/",
    "Following Jesus and the Sermon on the Mount": "../following-jesus-directions/", "Reading Daniel and Revelation": "../reading-daniel-and-revelation-directions/",
    "The hope to come": "../the-hope-to-come-horizon/", "Women of the Bible": "../women-of-the-bible-directions/",
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "../what-the-cross-accomplishes-directions/",
    "The church and its calling": "../the-church-and-its-calling-directions/", "The surviving witnesses": "/study/surviving-witnesses",
    "What the Bible says about itself": "../scripture-and-its-witness-directions/", "The good news: how a person is made right with God": "/study/the-good-news",
}
# Site links written into content.md as [text](/path).
SITE_LINKS = {"/study/names", "/study/theology-articles/the-trinity", "/apologetics/study/miracles", "/apologetics/study/jesus"}
RELATED = [("/apologetics/study/jesus", "Was Jesus simply a great teacher?"), ("/study/gospels", "Jesus & the Gospels"), ("../encounters-with-jesus-directions/", "Encounters with Jesus"), ("../the-signs-and-works-of-jesus-directions/", "The signs and works of Jesus")]
SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 1, 2, 3, 4, 6 and 17", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Read: these articles. Seven short phrases, quoted with a link and not hosted. Not held on this PC: the build checks only that each is cited to its own article. Compare by eye before release."},
    {"id": "maclaren", "short": "Alexander Maclaren", "name": "Alexander Maclaren, Expositions of Holy Scripture (Matthew, John)", "href": "https://www.ccel.org/ccel/maclaren",
     "note": "Baptist. Public domain. Read: his exposition of Matthew 16:13-28 and his sermon on Thomas in John 20 only."},
    {"id": "boyce", "short": "James P. Boyce", "name": "James P. Boyce, Abstract of Systematic Theology (1887)", "href": "https://www.ccel.org/ccel/boyce/theology.html",
     "note": "First president of Southern Baptist Theological Seminary. Public domain. Read: the one passage on the person of Christ quoted here, and not the whole book."},
    {"id": "barnes", "short": "Albert Barnes", "name": "Albert Barnes, Notes on the New Testament", "href": "https://www.ccel.org/ccel/barnes/ntnotes.html",
     "note": "Presbyterian. Public domain. Read: the notes on Matthew 16:20 and John 20:28 only."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory", "href": "https://www.ccel.org/ccel/jamieson/jfb.html",
     "note": "Not Baptist. Public domain. Read: the notes on Matthew 16:18 and John 8:58 only."},
    {"id": "vatican", "short": "The First Vatican Council", "name": "The First Vatican Council, dogmatic decrees (1870)", "href": "/study/creeds/vatican-council-dogmatic-decrees-1870",
     "note": "Catholic teaching, shown as theirs. Public domain by age, from the site's creeds collection. Read: the chapters on the primacy of Peter only."},
    {"id": "nicene", "short": "The Nicene Creed", "name": "The Nicene Creed (381)", "href": "/study/creeds/nicene-creed-381",
     "note": "Confessed by Catholic, Orthodox and Protestant churches. From the site's creeds collection. Read: the article on the Son."},
    {"id": "chalcedon", "short": "The Definition of Chalcedon", "name": "The Definition of Chalcedon (451), in Philip Schaff's translation", "href": "/study/creeds/chalcedonian-definition-451-schaff",
     "note": "From the site's creeds collection. Read: the one paragraph of the definition."},
]
