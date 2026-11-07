"""The lists behind the Encounters with Jesus mock-up. build-data.py checks every phrase here against its verse, as whole words."""

# Baptist Faith and Message 2000, as amended 14 June 2023. Each phrase was compared by script on 2026-10-30 against the text served at
# https://bfm.sbc.net/bfm2000/ (sha256 of the page below). The page is not kept in this folder, because the confession's rights are the SBC's, so this compare cannot be rerun here.
BFM_PAGE_SHA256 = "15b1496bf19cf64648d97added2bb82f8635f1f0c04cd4541810463a764d6647"
QUOTED_CONFESSION = {  # phrase: the article the page cites it to
    "every person of every race possesses full dignity and is worthy of respect and Christian love": "3",
    "all that we have and are we owe to Him": "13",
    "Regeneration, or the new birth, is a work of God's grace": "4",
    "an act of obedience symbolizing the believer's faith": "7",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "4",
    "a genuine turning from sin toward God": "4",
    "the acceptance of Jesus Christ and commitment of the entire personality to Him as Lord and Saviour": "4",
}

# Each commentary quotation names the heading of the note it comes from; the build fails if the quotation is not within reach after that heading.
SOURCE_ANCHORS = {
    "very imperfect faith may be genuine faith": "imperfect faith",
    "Faith had no power to open the eyes, but it led them to Jesus": "MATTHEW - Chapter 20 - Verse 34",
    "to test his character, and to show him that he had not kept the law as he pretended": "MATTHEW - Chapter 19 - Verse 21",
    "He is too sure of himself; for he thinks that he is ready and able to do all good deeds, if only they are pointed out to him.": "Mark x. 17-27",
    "By water, here, is evidently signified baptism": "JOHN - Chapter 3 - Verse 5",
    "a thorough spiritual purification by the operation of the Holy Ghost": "of water and of the Spirit",
    "that there might not be the possibility of doubt that he was dead": "JOHN - Chapter 11 - Verse 6",
    "stayed—strange as it would appear—for reasons closely connected with the highest well-being of all the beloved three, and because He loved them.": "JOHN xi. 5, 6",
    "This was not a proclamation of his own righteousness, nor the ground of his righteousness, but it was the evidence of the sincerity of his repentance": "LUKE - Chapter 19 - Verse 8",
    "Let us see your faith by your works": "half of my goods",
    "could not make up his mind to part with wealth in order to follow Christ": "half of my goods",
}

ROWS = [
    {"id": "he", "title": "Jesus began it", "note": "He saw them, or spoke first."},
    {"id": "both", "title": "Each toward the other", "note": "One man climbed. Jesus looked up."},
    {"id": "they", "title": "They came to Him", "note": "To plead, to touch, to ask, to catch Him out."},
]
COLUMNS = [
    {"id": "with", "title": "Went with Him, or went to tell", "note": "The narrator reports them going."},
    {"id": "silent", "title": "No further word", "note": "The record gives them nothing more to say or do."},
    {"id": "astonished", "title": "Left astonished", "note": "The scene closes on their amazement."},
    {"id": "away", "title": "Went away", "note": "The narrator reports them leaving."},
]
CARRY = [
    {"id": "illness", "title": "Illness", "art": "cloak"},
    {"id": "grief", "title": "Grief", "art": "tears"},
    {"id": "money", "title": "Money", "art": "coin"},
    {"id": "doubt", "title": "Questions and doubt", "art": "lamp"},
    {"id": "work", "title": "Work", "art": "nets"},
    {"id": "name", "title": "A name others gave you", "art": "booth"},
    {"id": "opposition", "title": "Opposition", "art": "eye"},
]

MEETINGS = [
    {"id": "nets", "name": "Four at their nets", "who": "Simon, Andrew, James and John", "art": "nets", "read": "Mark 1:16–20", "group": "called", "row": "he", "column": "with",
     "first": ("Mark 1:16", "He saw Simon and his brother Andrew"), "asked": None, "said": ("Mark 1:17", "Come, follow Me"), "end": ("Mark 1:18", "left their nets and followed Him"),
     "unsaid": "What they already knew of Him. John 1:40–42 tells of Andrew and Simon meeting Him at another time.",
     "carry": [("work", "Mark 1:16", "for they were fishermen")], "later": [("Acts 1:13", "Peter and John, James and Andrew"), ("Acts 12:2", "James, the brother of John, put to death with the sword")], "people": [("Peter", "peter-mat-4-18"), ("Andrew", "andrew-mat-4-18")]},
    {"id": "levi", "name": "Levi", "who": "Levi son of Alphaeus", "art": "booth", "read": "Mark 2:13–17", "group": "called", "row": "he", "column": "with",
     "first": ("Mark 2:14", "He saw Levi son of Alphaeus"), "asked": ("Mark 2:16", "Why does He eat with tax collectors and sinners?"), "said": ("Mark 2:17", "I have not come to call the righteous, but sinners"), "end": ("Mark 2:14", "Levi got up and followed Him"),
     "unsaid": "How he came to be at the booth, or what his guests made of the meal. The question at the table comes from the scribes who were Pharisees, and it goes to the disciples.",
     "carry": [("work", "Mark 2:14", "sitting at the tax booth"), ("name", "Mark 2:16", "tax collectors and sinners")], "later": [("Matthew 10:3", "Matthew the tax collector")], "laterNote": "Matthew 9:9 tells the same call and names the man Matthew, so this study reads Matthew 10:3 as Levi coming back. Mark does not say so.", "people": [("Matthew", "matthew-mat-9-9")]},
    {"id": "well", "name": "The woman at the well", "who": "A Samaritan woman, not named", "art": "jar", "read": "John 4:4–42", "group": "seekers", "row": "he", "column": "with",
     "first": ("John 4:7", "Give Me a drink"), "asked": ("John 4:9", "How can You ask for a drink from me"), "said": ("John 4:26", "I who speak to you am He"), "end": ("John 4:28", "went back into the town"),
     "unsaid": "Her name, how her marriages ended, or why she came at that hour. John gives her question to the town, and the town's answer in John 4:42.",
     "carry": [("name", "John 4:9", "a Samaritan woman"), ("doubt", "John 4:29", "Could this be the Christ?")], "later": [], "people": []},
    {"id": "hand", "name": "The man with the withered hand", "who": "A man, not named", "art": "hand", "read": "Mark 3:1–6", "group": "opponents", "row": "he", "column": "silent",
     "first": ("Mark 3:3", "Stand up among us"), "asked": None, "said": ("Mark 3:5", "Stretch out your hand"), "end": ("Mark 3:5", "it was restored"),
     "unsaid": "Whether he wanted any of this. He asks nothing and says nothing. Mark does not say what he did next.",
     "carry": [("illness", "Mark 3:1", "a man with a withered hand")], "later": [], "people": []},
    {"id": "thomas", "name": "Thomas", "who": "Thomas, called Didymus", "art": "door", "read": "John 20:24–29", "group": "grief", "row": "he", "column": "silent",
     "first": ("John 20:26", "Jesus came and stood among them"), "asked": ("John 20:25", "I will never believe"), "said": ("John 20:29", "blessed are those who have not seen and yet have believed"), "end": ("John 20:28", "My Lord and my God!"),
     "unsaid": "Whether he ever touched Him. John moves straight from the invitation to what Thomas said.",
     "carry": [("doubt", "John 20:25", "I will never believe")], "later": [("John 21:2", "Thomas called Didymus"), ("Acts 1:13", "Philip and Thomas")], "people": [("Thomas", "thomas-mat-10-3")]},
    {"id": "tree", "name": "Zacchaeus", "who": "Zacchaeus, a chief tax collector", "art": "tree", "read": "Luke 19:1–10", "group": "sinners", "row": "both", "column": "silent",
     "first": ("Luke 19:4", "climbed a sycamore tree to see Him"), "alsoFirst": ("Luke 19:5", "He looked up and said"), "asked": None, "said": ("Luke 19:9", "Today salvation has come to this house"), "end": ("Luke 19:8", "half of my possessions I give to the poor"),
     "unsaid": "What he had done, or whether he kept his word. Luke stops on what Jesus said.",
     "carry": [("money", "Luke 19:2", "who was very wealthy"), ("name", "Luke 19:7", "a sinful man")], "later": [], "people": [("Zacchaeus", "zacchaeus-luk-19-2")]},
    {"id": "jairus", "name": "Jairus", "who": "Jairus, a synagogue leader", "art": "bowl", "read": "Mark 5:21–43", "group": "sick", "row": "they", "column": "astonished",
     "first": ("Mark 5:22", "he fell at His feet"), "asked": ("Mark 5:23", "Please come and place Your hands on her"), "said": ("Mark 5:36", "Do not be afraid; just believe"), "end": ("Mark 5:42", "they were utterly astounded"),
     "unsaid": "What became of the girl or her father afterward. Jesus' last recorded word there is about her food.",
     "carry": [("illness", "Mark 5:23", "My little daughter is near death"), ("grief", "Mark 5:35", "Your daughter is dead")], "later": [], "people": [("Jairus", "jairus-mrk-5-22")]},
    {"id": "cloak", "name": "The woman who touched His cloak", "who": "A woman, not named", "art": "cloak", "read": "Mark 5:25–34", "group": "sick", "row": "they", "column": "silent",
     "first": ("Mark 5:27", "she came up through the crowd behind Him"), "asked": ("Mark 5:28", "If only I touch His garments"), "said": ("Mark 5:34", "Go in peace"), "end": ("Mark 5:33", "told Him the whole truth"),
     "unsaid": "Her name, or where she went. Mark gives us Jesus' words to her and goes straight back to Jairus.",
     "carry": [("illness", "Mark 5:25", "suffered from bleeding for twelve years"), ("money", "Mark 5:26", "had spent all she had")], "later": [], "people": []},
    {"id": "night", "name": "Nicodemus", "who": "Nicodemus, a leader of the Jews", "art": "lamp", "read": "John 3:1–21", "group": "seekers", "row": "they", "column": "silent",
     "first": ("John 3:2", "He came to Jesus at night"), "asked": ("John 3:9", "How can this be?"), "said": ("John 3:3", "no one can see the kingdom of God unless he is born again"), "end": ("John 3:9", "How can this be?"),
     "unsaid": "Why he came at night, how he took the answer, or what he came to believe. John comes back to him twice and still does not say.",
     "carry": [("doubt", "John 3:9", "How can this be?")], "later": [("John 7:50", "who had gone to Jesus earlier"), ("John 19:39", "who had previously come to Jesus at night")], "people": [("Nicodemus", "nicodemus-jhn-3-1")]},
    {"id": "watchers", "name": "The watchers in the synagogue", "who": "They are named at the end: Pharisees, with Herodians", "art": "eye", "read": "Mark 3:1–6", "group": "opponents", "row": "they", "column": "away",
     "first": ("Mark 3:2", "they were watching to see if He would heal"), "asked": None, "said": ("Mark 3:4", "to save life or to destroy it"), "end": ("Mark 3:6", "went out and began plotting"),
     "unsaid": "A single word from them in the scene. Mark gives their motive, and says they were silent.",
     "carry": [("opposition", "Mark 3:2", "In order to accuse Jesus")], "later": [], "people": []},
    {"id": "coin", "name": "The men with the tax question", "who": "Some of the Pharisees and Herodians", "art": "coin", "read": "Mark 12:13–17", "group": "opponents", "row": "they", "column": "astonished",
     "first": ("Mark 12:13", "to catch Jesus in His words"), "asked": ("Mark 12:14", "Is it lawful to pay taxes to Caesar or not?"), "said": ("Mark 12:17", "to God what is God’s"), "end": ("Mark 12:17", "they marveled at Him"),
     "unsaid": "What each of them went on to think. Mark gives their purpose once, and their marvelling once.",
     "carry": [("opposition", "Mark 12:13", "to catch Jesus in His words")], "later": [], "people": []},
    {"id": "road", "name": "The man who went away", "who": "A man, not named in Mark", "art": "road", "read": "Mark 10:17–31", "group": "away", "row": "they", "column": "away",
     "first": ("Mark 10:17", "a man ran up and knelt before Him"), "asked": ("Mark 10:17", "what must I do to inherit eternal life?"), "said": ("Mark 10:21", "There is one thing you lack"), "end": ("Mark 10:22", "went away in sorrow"),
     "unsaid": "His name, or his later life. We cannot say that he never came back.",
     "carry": [("money", "Mark 10:22", "he had great wealth")], "later": [], "people": []},
    {"id": "bart", "name": "Bartimaeus", "who": "Bartimaeus, son of Timaeus, a blind beggar", "art": "thrown", "read": "Mark 10:46–52", "group": "away", "row": "they", "column": "with",
     "first": ("Mark 10:47", "he began to cry out"), "asked": ("Mark 10:51", "let me see again"), "said": ("Mark 10:51", "What do you want Me to do for you?"), "end": ("Mark 10:52", "followed Jesus along the road"),
     "unsaid": "How far he followed. Mark's account of him stops on that road.",
     "carry": [("illness", "Mark 10:46", "a blind beggar")], "later": [], "people": [("Bartimaeus", "bartimaeus-mrk-10-46")]},
    {"id": "martha", "name": "Martha", "who": "Martha of Bethany", "art": "stone", "read": "John 11:17–40", "group": "grief", "row": "they", "column": "silent",
     "first": ("John 11:20", "she went out to meet Him"), "asked": ("John 11:22", "God will give You whatever You ask of Him"), "said": ("John 11:25", "I am the resurrection and the life"), "end": ("John 11:39", "Lord, by now he stinks"),
     "unsaid": "Her reply when Jesus answered that last word, or what she said when her brother came out.",
     "carry": [("grief", "John 11:21", "my brother would not have died"), ("doubt", "John 11:39", "Lord, by now he stinks")], "later": [("John 12:2", "Martha served")], "people": [("Martha", "martha-luk-10-38")]},
    {"id": "mary", "name": "Mary", "who": "Mary of Bethany", "art": "tears", "read": "John 11:28–37", "group": "grief", "row": "they", "column": "silent",
     "first": ("John 11:29", "she got up quickly and went to Him"), "asked": ("John 11:32", "Lord, if You had been here"), "said": ("John 11:34", "Where have you put him?"), "end": ("John 11:32", "my brother would not have died"),
     "unsaid": "Anything more from her that day. She had stayed at home until she was told He was asking for her, and the sisters had already sent word to Him in John 11:3.",
     "carry": [("grief", "John 11:32", "my brother would not have died")], "later": [("John 12:3", "Mary took about a pint of expensive perfume")], "people": [("Mary", "mary-luk-10-39")]},
]

GROUP_ORDER = ["called", "sinners", "sick", "seekers", "opponents", "away", "grief"]
GROUP_ART = {"called": "nets", "sinners": "tree", "sick": "bowl", "seekers": "lamp", "opponents": "hand", "away": "road", "grief": "tears"}

FORMS = {
    "called": {"kind": "left", "name": "What was left",
               "left": [("Mark 1:18", "left their nets"), ("Mark 1:20", "left their father Zebedee in the boat"), ("Mark 2:14", "got up and followed Him")],
               "arrive": ("Mark 2:15", "dining at Levi’s house")},
    "sinners": {"kind": "names", "name": "Who calls him what",
                "names": [("Luke", "Luke 19:2", "a chief tax collector"), ("Luke", "Luke 19:2", "very wealthy"), ("Jesus", "Luke 19:5", "Zacchaeus"), ("The crowd", "Luke 19:7", "a sinful man"), ("Himself", "Luke 19:8", "if I have cheated anyone"), ("Jesus", "Luke 19:9", "a son of Abraham")]},
    "sick": {"kind": "braid", "name": "One story folded in another",
             "strands": [("j", "Mark 5:22", "he fell at His feet"), ("j", "Mark 5:24", "So Jesus went with him"), ("w", "Mark 5:25", "for twelve years"), ("w", "Mark 5:27", "touched His cloak"), ("w", "Mark 5:30", "Who touched My garments?"), ("w", "Mark 5:34", "Daughter"),
                         ("join", "Mark 5:35", "While He was still speaking"), ("j", "Mark 5:35", "Your daughter is dead"), ("j", "Mark 5:36", "Do not be afraid; just believe"), ("j", "Mark 5:41", "Taking her by the hand"), ("j", "Mark 5:42", "She was twelve years old"), ("j", "Mark 5:43", "give her something to eat")]},
    "seekers": {"kind": "paths", "name": "Two conversations, two last lines",
                "night": [("John 3:2", "at night"), ("John 3:2", "we know"), ("John 3:4", "How can a man be born when he is old?")],
                "day": [("John 4:6", "about the sixth hour"), ("John 4:9", "How can You ask for a drink from me"), ("John 4:12", "Are You greater than our father Jacob"), ("John 4:19", "I see that You are a prophet")],
                "nightEnd": ("John 3:9", "How can this be?"), "dayEnd": ("John 4:29", "Could this be the Christ?"), "dayAfter": ("John 4:42", "this man truly is the Savior of the world")},
    "opponents": {"kind": "motive", "name": "Who gives the reason",
                  "narrator": [("Mark 3:2", "In order to accuse Jesus"), ("Mark 3:5", "with anger and sorrow at their hardness of heart"), ("Mark 3:6", "began plotting"), ("Mark 12:13", "to catch Jesus in His words"), ("Mark 12:15", "saw through their hypocrisy")],
                  "jesus": [("Mark 3:3", "Stand up among us"), ("Mark 3:5", "Stretch out your hand"), ("Mark 12:15", "Bring Me a denarius to inspect")], "hand": ("Mark 3:5", "it was restored")},
    "away": {"kind": "turn", "name": "One line turns off",
             "before": [("Mark 10:17", "a man ran up and knelt before Him"), ("Mark 10:21", "loved him"), ("Mark 10:21", "There is one thing you lack")],
             "turn": ("Mark 10:22", "went away in sorrow"),
             "on": [("Mark 10:26", "Who then can be saved?"), ("Mark 10:27", "but not with God"), ("Mark 10:28", "we have left everything"), ("Mark 10:49", "Jesus stopped"), ("Mark 10:50", "Throwing off his cloak"), ("Mark 10:52", "followed Jesus along the road")]},
    "grief": {"kind": "same", "name": "The same words, and terms handed back",
              "sentence": "Lord, if You had been here, my brother would not have died",
              "martha": [("John 11:22", "But even now I know"), ("John 11:25", "I am the resurrection and the life"), ("John 11:27", "I believe that You are the Christ")],
              "mary": [("John 11:32", "she fell at His feet"), ("John 11:34", "Where have you put him?"), ("John 11:35", "Jesus wept")],
              "pairs": [(("John 20:25", "the nail marks in His hands"), ("John 20:27", "look at My hands")), (("John 20:25", "put my finger"), ("John 20:27", "Put your finger here")),
                        (("John 20:25", "put my hand into His side"), ("John 20:27", "Reach out your hand and put it into My side")), (("John 20:25", "I will never believe"), ("John 20:27", "Stop doubting and believe"))]},
}

OLDER = [
    {"by": "Jesus", "note": "He draws it Himself, to Nicodemus.", "now": ("John 3:14", "Just as Moses lifted up the snake in the wilderness"), "then": ("Numbers 21:9", "So Moses made a bronze snake and mounted it on a pole")},
    {"by": "Jesus", "note": "He names the commandments to the man who ran up.", "now": ("Mark 10:19", "do not bear false witness"), "then": ("Exodus 20:16", "You shall not bear false witness")},
    {"by": "John", "note": "He sets the scene on ground from Genesis, and she names Jacob herself in John 4:12.", "now": ("John 4:5", "the plot of ground that Jacob had given to his son Joseph"), "then": ("Genesis 33:19", "the plot of ground where he pitched his tent")},
    {"by": "This study", "note": "Luke cites no law here. Exodus sets fourfold for a stolen sheep, and the link is this study's.", "now": ("Luke 19:8", "I will repay it fourfold"), "then": ("Exodus 22:1", "four sheep for a sheep")},
    {"by": "This study", "note": "A possible echo, and Luke does not cite it. Ezekiel's words are God's own, as shepherd of His people.", "now": ("Luke 19:10", "to seek and to save the lost"), "then": ("Ezekiel 34:16", "I will seek the lost")},
]

# verdict: says / part / not. Answers are prose with references, checked like any other prose.
TEST = [
    {"id": "short", "saying": "Zacchaeus was short.", "verdict": "says", "answer": "Luke says so: \"he was small in stature\" (Luke 19:3)."},
    {"id": "cheat", "saying": "Zacchaeus had been cheating people.", "verdict": "not", "answer": "Luke gives only his own words, \"if I have cheated anyone\" (Luke 19:8), and the crowd's word for him. There is no audit."},
    {"id": "prostitute", "saying": "The woman at the well was a prostitute.", "verdict": "not", "answer": "Jesus says \"you have had five husbands\" (John 4:18). John does not say how those marriages ended, and that word is not in the passage."},
    {"id": "noon", "saying": "She came at midday because the town shunned her.", "verdict": "part", "answer": "The hour is there: \"about the sixth hour\" (John 4:6), which many readers take as about noon. The reason is not, and when she speaks the town comes out (John 4:30)."},
    {"id": "afraid", "saying": "Nicodemus came at night because he was afraid.", "verdict": "part", "answer": "\"At night\" is there (John 3:2). The reason is not. John does say \"secretly for fear of the Jews\" of Joseph of Arimathea (John 19:38), and he does not say it of Nicodemus."},
    {"id": "young", "saying": "The man who went away was young.", "verdict": "part", "answer": "Not in Mark, who has him say \"from my youth\" (Mark 10:20). Matthew has \"the young man\" (Matthew 19:20). Say which Gospel you are reading."},
    {"id": "loved", "saying": "Jesus loved the man who went away.", "verdict": "says", "answer": "Mark says so, before the demand and before he leaves: \"Jesus looked at him, loved him\" (Mark 10:21)."},
    {"id": "never", "saying": "He never came back.", "verdict": "not", "answer": "Mark says he \"went away in sorrow\" (Mark 10:22), and then says nothing more of him. We cannot claim to know the rest."},
    {"id": "touch", "saying": "Thomas put his finger in the wounds.", "verdict": "not", "answer": "He is invited to: \"Put your finger here\" (John 20:27). The next thing John records is what he said, and Jesus' reply speaks of having seen (John 20:29)."},
]
VERDICTS = {"says": "The passage says it", "part": "Part of it", "not": "The passage does not say it"}

# What the absent details rest on: (reference, pattern that must not be there, why it matters). Each has a control proving the test can see such words.
ABSENT = [
    ("John 4:4–42", r"prostitut|harlot|immoral|adulter", "John 4 never calls her this"),
    ("John 3:1–2", r"\bfear|\bafraid", "John does not give fear as Nicodemus's reason"),
    ("Mark 10:17–31", r"\byoung\b|\bruler\b", "Mark does not call him young or a ruler"),
    ("John 20:27–29", r"\btouch|\bfelt\b|\bhandled?\b", "John does not say Thomas touched Him"),
]
CONTROLS = [("Matthew 19:20", "young"), ("Luke 18:18", "ruler"), ("John 19:38", "fear"), ("Mark 5:27", "touched")]

SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 3, 4, 7 and 13", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Short phrases, with this link. Read: those articles on that page. Its text is the Southern Baptist Convention's, so it is not hosted here."},
    {"id": "maclaren", "short": "Alexander Maclaren, a Baptist", "name": "Alexander Maclaren, Expositions of Holy Scripture (Mark, Luke, John)", "href": "https://www.ccel.org/ccel/maclaren",
     "note": "Short quotations. Read: his expositions of the bleeding woman in Mark 5, of Mark 10:17–27, of Luke 19, of John 11:5–6, only. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "barnes", "short": "Albert Barnes, a Presbyterian", "name": "Albert Barnes, Notes on the New Testament", "href": "https://www.ccel.org/ccel/barnes/ntnotes.html",
     "note": "Short quotations. Read: his notes on Matthew 19:21, Matthew 20:34, Luke 19:8, John 3:5 and John 11:6 only. Not a Baptist work. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary (1871)", "href": "https://www.ccel.org/ccel/jamieson/jfb.html",
     "note": "One short quotation. Read: their note on John 3:5 only. Not a Baptist work. Public domain text, held from the Christian Classics Ethereal Library."},
]
RELATED = [("/study/miracles", "Miracles in the Bible"), ("/study/gospels", "Jesus & the Gospels"), ("/study/gospels?guide=parables", "The parables of Christ")]
