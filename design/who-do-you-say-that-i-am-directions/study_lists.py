"""The lists behind the Who do you say I am mock-up: the answers and who said them, the forms, the pairs, and who changed their answer. build-data.py checks every phrase here against its verse."""

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
    {"id": "son", "label": "Son of God", "text": "WordSon", "pattern": r"\bSon of (?:God|the (?:living God|Blessed One|Most High))\b|\bMy (?:beloved )?Son\b",
     "expect": {"tempter", "spiritsson", "highpriest", "martha", "centurion", "peter", "markone", "gabriel", "river", "mountain"}, "never": ["Son of Man", "Son of David", "son of Joseph"]},
    {"id": "christ", "label": "Christ", "text": "WordChrist", "pattern": r"\bChrist\b|\bMessiah\b", "expect": {"highpriest", "taunt", "woman", "martha", "andrew", "peter", "markone", "angels"}, "never": ["Christian"]},
    {"id": "king", "label": "King", "text": "WordKing", "pattern": r"\bKing\b|\bKING\b", "expect": {"pilate", "salute", "notice", "taunt", "nathanael"}, "never": ["kingdom", "king of Assyria"]},
    {"id": "lord", "label": "Lord", "text": "WordLord", "pattern": r"\bLord\b", "expect": {"blindlord", "thomas", "angels"}, "never": ["LORD", "lord"]},
    {"id": "prophet", "label": "Prophet", "text": "WordProphet", "pattern": r"\b[Pp]rophets?\b", "expect": {"prophets", "greatprophet", "blindprophet"}, "never": ["prophecy"]},
    {"id": "holy", "label": "Holy One", "text": "WordHoly", "pattern": r"\bHoly One of God\b", "expect": {"spiritholy", "peterholy"}, "never": ["Holy Spirit"]},
    {"id": "teacher", "label": "Teacher", "text": "WordTeacher", "pattern": r"\b[Tt]eacher\b", "expect": {"nicodemus", "goodteacher"}, "never": ["teaching", "Rabbi"]},
    {"id": "david", "label": "Son of David", "text": "WordDavid", "pattern": r"\bSon of David\b", "expect": {"hosanna", "bartimaeus"}, "never": ["son of Joseph"]},
]

WAY_IN = {"asks": ("Matthew 16:13", "Who do people say the Son of Man is?"), "reports": [("Matthew 16:14", "John the Baptist"), ("Matthew 16:14", "Elijah"), ("Matthew 16:14", "Jeremiah"), ("Matthew 16:14", "one of the prophets")],
          "turns": ("Matthew 16:15", "But what about you?"), "then": ("Matthew 16:15", "Who do you say I am?")}

PAIRS = [
    {"word": "The Holy One of God", "left": {"answer": "spiritholy", "around": ("Mark 1:24", "Have You come to destroy us?")}, "right": {"answer": "peterholy", "around": ("John 6:68", "Lord, to whom would we go?")}},
    {"word": "The King", "left": {"answer": "salute", "around": ("Mark 15:19", "They kept striking His head with a staff")}, "right": {"answer": "nathanael", "around": ("John 1:50", "You will see greater things than these.")}},
    {"word": "The Son of God", "left": {"answer": "tempter", "around": ("Matthew 4:11", "Then the devil left Him")}, "right": {"answer": "centurion", "around": ("Mark 15:39", "saw how He had breathed His last")}},
]

READING_ORDER = ["road", "turn", "council", "voice", "thomas", "written"]
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
    "thomas": {"kind": "mirror", "name": "His terms, and the answer", "leftTitle": "Thomas, to his friends", "rightTitle": "Jesus, eight days later", "rows": [
        (("John 20:25", "I see the nail marks in His hands"), ("John 20:27", "look at My hands")), (("John 20:25", "put my finger where the nails have been"), ("John 20:27", "Put your finger here")),
        (("John 20:25", "put my hand into His side"), ("John 20:27", "Reach out your hand and put it into My side.")), (("John 20:25", "I will never believe."), ("John 20:27", "Stop doubting and believe."))],
        "result": ("John 20:28", "My Lord and my God!"), "note": "He says this. The record does not say he touched anything."},
    "written": {"kind": "line", "name": "John's answers in order, to the last stop", "stops": [
        ("The writer", "John 1:1", "the Word was God"), ("John the Baptist", "John 1:29", "the Lamb of God"), ("Andrew", "John 1:41", "We have found the Messiah"), ("Nathanael", "John 1:49", "You are the King of Israel!"), ("A town in Samaria", "John 4:42", "the Savior of the world"),
        ("Simon Peter", "John 6:69", "the Holy One of God"), ("A man who had been blind", "John 9:38", "Lord, I believe"), ("Martha", "John 11:27", "You are the Christ, the Son of God"), ("Thomas", "John 20:28", "My Lord and my God!"), ("The writer, to you", "John 20:31", "so that you may believe")],
        "last": "You"},
}

CHANGED = [
    {"who": "His brothers", "before": ("John 7:5", "even His own brothers did not believe in Him"), "between": ("1 Corinthians 15:7", "Then He appeared to James"), "after": [("Acts 1:14", "with His brothers"), ("James 1:1", "a servant of God and of the Lord Jesus Christ")]},
    {"who": "Simon Peter", "before": ("Mark 14:71", "I do not know this man of whom you speak!"), "between": ("Luke 24:34", "has appeared to Simon"), "after": [("Acts 2:36", "both Lord and Christ"), ("1 Peter 2:4", "the living stone")]},
    {"who": "Saul, later called Paul", "before": ("Acts 26:9", "oppose the name of Jesus of Nazareth"), "between": ("Acts 9:5", "Who are You, Lord?"), "after": [("Acts 9:20", "He is the Son of God.")]},
    {"who": "A man who had been blind", "before": ("John 9:17", "He is a prophet"), "between": ("John 9:37", "He is the One speaking with you."), "after": [("John 9:38", "Lord, I believe")]},
    {"who": "A town in Samaria", "before": ("John 4:29", "Could this be the Christ?"), "between": ("John 4:42", "we have heard for ourselves"), "after": [("John 4:42", "the Savior of the world")]},
    {"who": "Two on a road", "before": ("Luke 24:21", "But we were hoping He was the One who would redeem Israel."), "between": ("Luke 24:32", "as He spoke with us on the road"), "after": [("Luke 24:34", "The Lord has indeed risen")]},
]
OLDER = [
    {"by": "Jesus uses these words to the high priest. Mark does not name Daniel, so the link is this study's.", "then": ("Daniel 7:13", "coming with the clouds of heaven"), "now": ("Mark 14:62", "coming with the clouds of heaven")},
    {"by": "Jesus quotes it, in the temple courts.", "then": ("Psalm 110:1", "Sit at My right hand"), "now": ("Mark 12:36", "Sit at My right hand")},
    {"by": "Paul quotes it, of the resurrection.", "then": ("Psalm 2:7", "You are My Son"), "now": ("Acts 13:33", "You are My Son")},
    {"by": "Peter quotes it, of Jesus.", "then": ("Deuteronomy 18:15", "You must listen to him."), "now": ("Acts 3:22", "You must listen to Him in everything He tells you.")},
    {"by": "Matthew quotes it, of Jesus.", "then": ("Isaiah 42:1", "in whom My soul delights"), "now": ("Matthew 12:18", "in whom My soul delights")},
]

SOURCE_ANCHORS = {
    "We cannot take refuge from it in the general opinion.": "MATT. xvi. 13-28",
    "True, the speaker did not know all which lay in His words. Do we?": "MATT. xvi. 13-28",
    "Unquestionably, the apostle is the rock on which the Church is built.": "MATT. xvi. 13-28",
    "wherever that faith is, there are these gifts": "MATT. xvi. 13-28",
    "The object of the Christian's faith is not a proposition; it is not a dogma nor a truth, but a Person.": "My Lord and my God",
    "In that sense the Jews plainly understood Him": "Before Abraham was, I am",
    "not on the man Simon Bar-jona; but on him as the heavenly-taught confessor of a faith": "and upon this rock",
    "This is the obvious meaning of the passage": "MATTHEW - Chapter 16 - Verse 18",
    "The reason of this seems to be that his time had not fully come": "MATTHEW - Chapter 16 - Verse 20",
    "There is no evidence that this was a mere expression, as some have supposed, of surprise or astonishment.": "JOHN - Chapter 20 - Verse 28",
    "though a servant, he was still the Lord": "How could Thomas cry out",
    "the primacy of jurisdiction over the universal Church of God was immediately and directly promised and given to blessed Peter the Apostle by Christ the Lord.": "We therefore teach and declare",
}
QUOTED_CONFESSION = {
    "every person of every race possesses full dignity and is worthy of respect and Christian love": "3",
    "truth, without any mixture of error": "1",
    "fully God, fully man": "2",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "4",
    "an autonomous local congregation of baptized believers": "6",
    "God alone is Lord of the conscience": "17",
}
# Words named as words, and not quoted as a passage. Each must be in the verse given here.
MENTIONS = {"Son of God": "Mark 3:11"}
# What the page says is not in a book. The same pattern must find something in the control verse, or the search is proved blind.
ABSENT_BOOKS = [{"books": ["MAT", "MRK", "LUK", "JHN"], "pattern": r"\bI am God\b", "control": "Isaiah 46:9", "says": "the exact sentence is not in the four Gospels"}]
ABSENT_MENTIONS = {"I am God"}
ABSENT_RANGES = [{"label": "John 20:28–31", "pattern": r"\btouch|\bput\b|\bfinger", "control": "John 20:27", "says": "the record does not say Thomas touched anything"}]

INTERNAL = {"Was Jesus simply a great teacher?": "/apologetics/study/jesus", "Surviving witnesses": "/study/surviving-witnesses"}
RELATED = [("/apologetics/study/jesus", "Was Jesus simply a great teacher?"), ("/study/gospels", "Jesus & the Gospels"), ("../encounters-with-jesus-directions/", "Encounters with Jesus"), ("../the-signs-and-works-of-jesus-directions/", "The signs and works of Jesus")]
SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 1, 2, 3, 4, 6 and 17", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Read: these articles. Six short phrases, quoted with a link and not hosted. Compared on 2026-10-30 against what a web tool returned from the page, because the page refused a direct download. Compare by eye before release."},
    {"id": "maclaren", "short": "Alexander Maclaren", "name": "Alexander Maclaren, Expositions of Holy Scripture (Matthew, John)", "href": "https://www.ccel.org/ccel/maclaren",
     "note": "Baptist. Public domain. Read: his exposition of Matthew 16:13-28 and his sermon on Thomas in John 20 only."},
    {"id": "boyce", "short": "James P. Boyce", "name": "James P. Boyce, Abstract of Systematic Theology (1887)", "href": "https://www.ccel.org/ccel/boyce/theology.html",
     "note": "First president of Southern Baptist Theological Seminary. Public domain. Read: the one passage on the person of Christ quoted here, and not the whole book."},
    {"id": "barnes", "short": "Albert Barnes", "name": "Albert Barnes, Notes on the New Testament", "href": "https://www.ccel.org/ccel/barnes/ntnotes.html",
     "note": "Presbyterian. Public domain. Read: the notes on Matthew 16:18, Matthew 16:20 and John 20:28 only."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory", "href": "https://www.ccel.org/ccel/jamieson/jfb.html",
     "note": "Not Baptist. Public domain. Read: the notes on Matthew 16:18 and John 8:58 only."},
    {"id": "vatican", "short": "The First Vatican Council", "name": "The First Vatican Council, dogmatic decrees (1870)", "href": "/study/creeds/vatican-council-dogmatic-decrees-1870",
     "note": "Catholic teaching, shown as theirs. Public domain by age, from the site's creeds collection. Read: the chapters on the primacy of Peter only."},
]
