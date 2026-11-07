"""The lists behind the signs and works of Jesus mock-up: each verse's kind, the forms, the responses and the Scripture voices. build-data.py checks every phrase here against its verse."""

KINDS = [
    {"id": "deed", "name": "The deed", "short": "the deed", "lens": "LensDeed"},
    {"id": "jesus", "name": "Jesus", "short": "Jesus speaks, asks or shows His heart", "lens": "LensJesus"},
    {"id": "writer", "name": "The writer", "short": "the writer explains", "lens": "LensWriter"},
    {"id": "others", "name": "Others", "short": "others speak or respond", "lens": "LensOthers"},
    {"id": "setting", "name": "The setting", "short": "the setting and the need", "lens": "LensSetting"},
]


def spread(**kinds: str) -> dict:
    """setting="1-5,11" into {1: "setting", 2: "setting", ...}. A verse named twice is refused."""
    out: dict = {}
    for kind, text in kinds.items():
        for piece in text.split(","):
            first, _, last = piece.partition("-")
            for verse in range(int(first), int(last or first) + 1):
                if verse in out:
                    raise ValueError(f"verse {verse} has two kinds: {out[verse]} and {kind}")
                out[verse] = kind
    return out


ACCOUNTS = [
    {"id": "storm", "name": "The storm", "read": "Mark 4:35–41", "reading": "sea", "kinds": spread(jesus="35,40", setting="36,37", others="38,41", deed="39")},
    {"id": "legion", "name": "The man among the tombs", "read": "Mark 5:1–20", "reading": "told", "kinds": spread(setting="1-5,11", others="6,7,10,12,14-18,20", jesus="8,9,19", deed="13")},
    {"id": "fold", "name": "The woman and Jairus' daughter", "read": "Mark 5:21–43", "reading": "peace", "kinds": spread(setting="21,25,26,38", others="22,23,27,28,31,33,35,40", deed="29,41,42", jesus="24,30,32,34,36,37,39,43")},
    {"id": "loaves", "name": "The five thousand", "read": "Mark 6:30–44", "reading": "fed", "kinds": spread(others="30,33,35,36,40", jesus="31,34,37,38,39", setting="32", deed="41-44")},
    {"id": "walking", "name": "Walking on the sea", "read": "Mark 6:45–52", "reading": "sea", "kinds": spread(jesus="45,46,50", setting="47", deed="48,51", others="49", writer="52")},
    {"id": "cana", "name": "The wine at Cana", "read": "John 2:1–12", "reading": "fed", "kinds": spread(setting="1,2,6,12", others="3,5,10", jesus="4,7,8", deed="9", writer="11")},
    {"id": "blind", "name": "The man born blind", "read": "John 9:1–41", "reading": "believe", "kinds": spread(setting="1", others="2,8-13,15-21,24-34,36,38,40", jesus="3-5,35,37,39,41", deed="6,7", writer="14,22,23")},
    {"id": "lazarus", "name": "Lazarus", "read": "John 11:1–53", "reading": "raised", "kinds": spread(setting="1,17,18,19,30", writer="2,5,13,51,52", others="3,8,12,16,20,21,22,24,27,28,29,31,32,36,37,45-50,53", jesus="4,6,7,9,10,11,14,15,23,25,26,33,34,35,38-42", deed="43,44")},
]

# The account from the site's catalogue that each work in these accounts is, under the site's own titles.
WORKS = {"The Stilling of the Storm": "storm", "The Gadarene Demoniacs": "legion", "The Woman with an Issue of Blood": "fold", "Jairus' Daughter": "fold", "The Five Thousand Fed": "loaves",
         "Jesus Walking on the Water": "walking", "The Water Made Wine": "cana", "The Man Born Blind": "blind", "The Raising of Lazarus": "lazarus"}

TRIES = [
    {"id": "nain", "name": "The widow's son", "read": "Luke 7:11–17", "kinds": spread(setting="11,12", jesus="13", deed="14,15", others="16,17")},
    {"id": "lepers", "name": "The ten lepers", "read": "Luke 17:11–19", "kinds": spread(setting="11,12", others="13,15,16", deed="14", jesus="17-19")},
    {"id": "bent", "name": "The woman bent over", "read": "Luke 13:10–17", "kinds": spread(setting="10,11", jesus="12,15,16", deed="13", others="14,17")},
]

READING_ORDER = ["peace", "told", "fed", "sea", "raised", "believe"]

FORMS = {
    "peace": {"kind": "steps", "name": "What came after the healing", "cured": ("Mark 5:29", "Immediately her bleeding stopped"), "note": "If the story were only a cure, it could end at the first step.",
              "steps": [("Jesus asks", "Mark 5:30", "Who touched My garments?"), ("His disciples answer", "Mark 5:31", "You can see the crowd pressing in on You"), ("He keeps looking", "Mark 5:32", "But He kept looking around"),
                        ("She comes", "Mark 5:33", "she told Him the whole truth"), ("He speaks", "Mark 5:34", "Daughter")]},
    "told": {"kind": "begs", "name": "Five who begged, and what came of it", "rows": [
        {"who": "The voice in the man", "ask": ("Mark 5:7", "I beg You before God not to torture me!"), "answer": None},
        {"who": "The man, for the spirits", "ask": ("Mark 5:10", "he begged Jesus repeatedly not to send them out of that region"), "answer": None},
        {"who": "The demons", "ask": ("Mark 5:12", "So the demons begged Jesus"), "answer": ("Mark 5:13", "He gave them permission")},
        {"who": "The people of the region", "ask": ("Mark 5:17", "the people began to beg Jesus to leave their region"), "answer": ("Mark 5:18", "As He was getting into the boat")},
        {"who": "The freed man", "ask": ("Mark 5:18", "begged to go with Him"), "answer": ("Mark 5:19", "But Jesus would not allow him")},
    ]},
    "fed": {"kind": "counts", "name": "What is counted, what is not shown, and who knew",
            "counts": [("Mark 6:37", "two hundred denarii"), ("Mark 6:38", "Five"), ("Mark 6:38", "two fish"), ("Mark 6:40", "in groups of hundreds and fifties"), ("Mark 6:43", "twelve basketfuls"), ("Mark 6:44", "five thousand men")],
            "before": ("Mark 6:41", "Then He gave them to His disciples"), "after": ("Mark 6:42", "They all ate and were satisfied"), "gap": "Mark does not show the bread growing.",
            "knew": [("The master of the banquet", "John 2:9", "He did not know where it was from"), ("The servants", "John 2:9", "the servants who had drawn the water knew"), ("His disciples", "John 2:11", "His disciples believed in Him")]},
    "sea": {"kind": "crossings", "name": "Two crossings, row by row", "heads": ["The first crossing", "The second crossing"], "rows": [
        ("Where Jesus is", ("Mark 4:38", "in the stern, sleeping on the cushion"), ("Mark 6:47", "Jesus was alone on land")),
        ("The trouble", ("Mark 4:37", "the waves were breaking over the boat"), ("Mark 6:48", "the wind was against them")),
        ("What He says", ("Mark 4:39", "Be still!"), ("Mark 6:50", "Take courage! It is I.")),
        ("The wind", ("Mark 4:39", "the wind died down"), ("Mark 6:51", "the wind died down")),
        ("The men in the boat", ("Mark 4:41", "Overwhelmed with fear"), ("Mark 6:51", "utterly astounded")),
        ("What the writer adds", None, ("Mark 6:52", "they had not understood about the loaves")),
    ], "later": ("Mark 8:21", "Do you still not understand?")},
    "raised": {"kind": "speaks", "name": "To whom He speaks in John 11, in order", "rows": [
        ("Those who brought the news", "John 11:4", "This sickness will not end in death."),
        ("His disciples", "John 11:15", "so that you may believe"),
        ("Martha", "John 11:25", "I am the resurrection and the life."),
        ("Those at the house", "John 11:34", "Where have you put him?"),
        ("Those at the tomb", "John 11:39", "Take away the stone,"),
        ("Martha again", "John 11:40", "you would see the glory of God"),
        ("The Father", "John 11:41", "Father, I thank You that You have heard Me."),
        ("Lazarus", "John 11:43", "Lazarus, come out!"),
        ("Those around him", "John 11:44", "Unwrap him and let him go,"),
    ], "deed": "Lazarus"},
    "believe": {"kind": "stairs", "name": "Two stairs in John 9, going opposite ways", "up": "What the man says of Jesus", "down": "What His examiners say",
                "man": [("John 9:11", "The man they call Jesus"), ("John 9:17", "He is a prophet,"), ("John 9:33", "If this man were not from God, He could do no such thing."), ("John 9:38", "Lord, I believe,")],
                "them": [("John 9:16", "This man is not from God"), ("John 9:24", "We know that this man is a sinner."), ("John 9:29", "we do not know where this man is from"), ("John 9:34", "they threw him out")]},
}

ROAD_COLUMNS = [{"id": "toward", "name": "Believed or came to Him"}, {"id": "fear", "name": "Afraid or amazed"}, {"id": "away", "name": "Turned against or sent away"}]
ROADS = [
    {"account": "storm", "toward": [], "fear": [("Mark 4:41", "Overwhelmed with fear")], "away": []},
    {"account": "legion", "toward": [("Mark 5:18", "begged to go with Him")], "fear": [("Mark 5:15", "they were afraid"), ("Mark 5:20", "everyone was amazed")], "away": [("Mark 5:17", "began to beg Jesus to leave their region")]},
    {"account": "fold", "toward": [("Mark 5:34", "your faith has healed you")], "fear": [("Mark 5:33", "trembling in fear"), ("Mark 5:42", "utterly astounded")], "away": [("Mark 5:40", "they laughed at Him")]},
    {"account": "loaves", "toward": [], "fear": [], "away": []},
    {"account": "walking", "toward": [], "fear": [("Mark 6:50", "were terrified"), ("Mark 6:51", "utterly astounded")], "away": []},
    {"account": "cana", "toward": [("John 2:11", "His disciples believed in Him")], "fear": [], "away": []},
    {"account": "blind", "toward": [("John 9:38", "Lord, I believe,")], "fear": [("John 9:22", "because they were afraid")], "away": [("John 9:34", "they threw him out")]},
    {"account": "lazarus", "toward": [("John 11:45", "believed in Him")], "fear": [("John 11:48", "the Romans will come")], "away": [("John 11:46", "went to the Pharisees"), ("John 11:53", "they plotted to kill Him")]},
]

VOICES = {
    "jesus": {"title": "Jesus on His works", "items": [("Matthew 11:5", "The blind receive sight, the lame walk"), ("John 10:38", "believe the works themselves"), ("John 14:11", "believe on account of the works themselves"), ("Matthew 12:39", "A wicked and adulterous generation demands a sign")]},
    "older": {"title": "Older Scripture behind them", "items": [
        {"by": "The Gospel writer draws this link", "now": ("Matthew 8:17", "He took on our infirmities"), "then": ("Isaiah 53:4", "Surely He took on our infirmities")},
        {"by": "The Gospel writer draws this link", "now": ("John 12:38", "Lord, who has believed our message?"), "then": ("Isaiah 53:1", "Who has believed our message?")},
        {"by": "The crowd quotes it, and Jesus answers", "now": ("John 6:32", "it was not Moses who gave you the bread from heaven"), "then": ("Exodus 16:4", "I will rain down bread from heaven for you")},
        {"by": "This study sets these side by side", "now": ("Matthew 11:5", "The blind receive sight"), "then": ("Isaiah 35:5", "Then the eyes of the blind will be opened")},
        {"by": "This study sets these side by side", "now": ("Mark 4:39", "the wind died down"), "then": ("Psalm 107:29", "He calmed the storm to a whisper")},
        {"by": "This study sets these side by side", "now": ("Mark 6:34", "like sheep without a shepherd"), "then": ("Numbers 27:17", "like sheep without a shepherd")},
        {"by": "This study sets these side by side", "now": ("Mark 6:43", "twelve basketfuls of broken pieces"), "then": ("2 Kings 4:43", "They will eat and have some left over.")},
    ]},
    "apostles": {"title": "The apostles preach them", "items": [("Acts 2:22", "certified by God to you by miracles, wonders, and signs"), ("Acts 10:38", "healing all who were oppressed by the devil"), ("Hebrews 2:4", "affirmed by God through signs, wonders, various miracles")]},
}

SOURCE_ANCHORS = {
    "but simply, that they were slow to perceive his power": "MARK - Chapter 6 - Verse 52",
    "He had raised her by extraordinary power, but he willed that she should be sustained by ordinary means.": "MARK - Chapter 5 - Verse 43",
    "We are not to suppose that his power was limited by the belief, or unbelief, of men.": "MATTHEW - Chapter 13 - Verse 58",
    "neither Mark nor Luke say that there was no more than one": "MATTHEW - Chapter 8 - Verse 28",
    "The word 'besought' occurs four times in it, and we may group the details round each instance.": "My name is Legion",
    "It paints for us not merely a maniac, but a demoniac.": "My name is Legion",
    "Startling as the expression is, it is not to be weakened down because it is startling": "Mark vi. 5,6",
}
QUOTED_CONFESSION = {
    "every person of every race possesses full dignity and is worthy of respect and Christian love": "3",
    "the dead will be raised": "10",
    "bestows the spiritual gifts by which they serve God through His church": "2",
    "truth, without any mixture of error": "1",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "4",
}
# Words the page says are not in a passage, with controls proving the same search can see such words.
ABSENT = [
    ("Mark 6:41–44", r"\bgrew\b|\bgrow|multipl|increas", "Mark does not show the bread growing"),
    ("Mark 6:30–44", r"\bshar(e|ed|ing)\b|\bhidden\b|\blunch", "the text gives no hint of people sharing hidden lunches"),
    ("John 2:6–9", r"\bbless|\bprayed\b", "no word is spoken over the jars"),
]
CONTROLS = [("Acts 6:7", "grew"), ("Mark 6:41", "blessing"), ("Mark 5:34", "Daughter")]

# Named accounts that have rights reserved: told in this study's words, with a link, and no words quoted from them.
RETOLD = {"schreiner", "piper"}
SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 1, 2, 3, 4 and 10", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Short phrases, with this link. Its text is the Southern Baptist Convention's, so it is not hosted here."},
    {"id": "maclaren", "short": "Alexander Maclaren, a Baptist", "name": "Alexander Maclaren, Expositions of Holy Scripture (Mark)", "href": "https://www.ccel.org/ccel/maclaren",
     "note": "Short quotations. Read: his expositions of Mark 5:1–20 and Mark 6:5–6 only. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "barnes", "short": "Albert Barnes, a Presbyterian", "name": "Albert Barnes, Notes on the New Testament", "href": "https://www.ccel.org/ccel/barnes/ntnotes.html",
     "note": "Short quotations. Read: his notes on Matthew 8:28, Matthew 13:58, Mark 5:43 and Mark 6:52 only. Not a Baptist work. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "schreiner", "short": "Thomas Schreiner, a Southern Baptist", "name": "Thomas Schreiner, Why I Am a Cessationist (The Gospel Coalition)", "href": "https://www.thegospelcoalition.org/article/cessationist/",
     "note": "Told in this study's own words, with no words quoted, because its rights are reserved. Read: this one article."},
    {"id": "piper", "short": "John Piper, a Baptist pastor", "name": "John Piper, Are Signs and Wonders for Today? (1990)", "href": "https://www.desiringgod.org/messages/are-signs-and-wonders-for-today",
     "note": "Told in this study's own words, with no words quoted, because its rights are reserved. Read: this one sermon, in a copy held by a third party, because the publisher's page refused the fetch."},
]
INTERNAL = {"Miracles": "/study/miracles", "Encounters": "../encounters-with-jesus-directions/"}
RELATED = [("/study/miracles", "Miracles in the Bible"), ("/study/gospels", "Jesus & the Gospels"), ("../encounters-with-jesus-directions/", "Encounters with Jesus")]
