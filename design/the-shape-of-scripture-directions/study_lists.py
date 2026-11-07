"""The lists behind The shape of Scripture mock-up. Every word here is tested by build-data.py against the Berean.

FORMS: each passage typeset in its own form. Each zone's lines, rejoined, must be its reference's whole Berean text.
  marks = phrases to pick out; each must be found in a line of that zone. The layout comes from the block's "type" in css/ss.css.
MARKS: kind of writing inside a book that is mainly something else: (reference, whole word in the verse, what happens).
STEPS: (later part, earlier part, later ref, phrase in later, earlier ref, phrase in earlier, kind, what it does).
  names: phrase in the later verse names the person or book. retells, shares: the same phrase must be in both verses.
"""

FORMS = {
    "law": [{"type": "stone", "caption": "One stone, two sentences. The layout is this page's: Scripture does not say how the words sat on the tablets, and verse 2 is not itself a command.", "zones": [
        {"label": "First, what He has done", "ref": "Exodus 20:2", "lines": ["“I am the LORD your God,", "who brought you out of the land of Egypt,", "out of the house of slavery."], "marks": ["who brought you out"]},
        {"label": "Then, what He asks", "ref": "Exodus 20:3", "lines": ["You shall have no other gods before Me."], "marks": []},
    ]}],
    "history": [{"type": "voices", "caption": "A narrative has speakers. The margin says whose words you are hearing; the mark shows where the narrator points you to another book.", "zones": [
        {"label": "The narrator", "ref": "Ezra 1:1", "lines": ["In the first year of Cyrus king of Persia, to fulfill the word of the LORD spoken through Jeremiah, the LORD stirred the spirit of Cyrus king of Persia to send a proclamation throughout his kingdom and to put it in writing as follows:"], "marks": ["the word of the LORD spoken through Jeremiah"]},
        {"label": "Cyrus, as quoted", "ref": "Ezra 1:2–3", "lines": ["“This is what Cyrus king of Persia says: ‘The LORD, the God of heaven, who has given me all the kingdoms of the earth, has appointed me to build a house for Him at Jerusalem in Judah.", "Whoever among you belongs to His people, may his God be with him, and may he go to Jerusalem in Judah and build the house of the LORD, the God of Israel; He is the God who is in Jerusalem."], "marks": []},
    ]}],
    "poetry": [
        {"type": "steps", "caption": "All six verses, climbing as the prayer does. The names of the three steps are this study's.", "zones": [
            {"label": "Complaint", "ref": "Psalm 13:1–2", "lines": ["How long, O LORD?", "Will You forget me forever?", "How long will You hide Your face from me?", "How long must I wrestle in my soul,", "with sorrow in my heart each day?", "How long will my enemy dominate me?"], "marks": ["How long"]},
            {"label": "Petition", "ref": "Psalm 13:3–4", "lines": ["Consider me and respond, O LORD my God.", "Give light to my eyes, lest I sleep in death,", "lest my enemy say, “I have overcome him,”", "and my foes rejoice when I fall."], "marks": ["Consider me", "Give light"]},
            {"label": "Trust", "ref": "Psalm 13:5–6", "lines": ["But I have trusted in Your loving devotion;", "my heart will rejoice in Your salvation.", "I will sing to the LORD,", "for He has been good to me."], "marks": ["But", "I will sing"]},
        ]},
        {"type": "facing", "caption": "Two proverbs that stand one after the other. The instructions differ and so do their reasons; the reasons are marked.", "zones": [
            {"label": "Proverbs 26:4", "ref": "Proverbs 26:4", "lines": ["Do not answer a fool according to his folly,", "or you yourself will be like him."], "marks": ["or you yourself will be like him"]},
            {"label": "Proverbs 26:5", "ref": "Proverbs 26:5", "lines": ["Answer a fool according to his folly,", "lest he become wise in his own eyes."], "marks": ["lest he become wise in his own eyes"]},
        ]},
    ],
    "prophets": [{"type": "verbs", "caption": "The commands run on, one after another, and the verbs are marked. Set apart at the end, the LORD's own offer. The line breaks are this page's.", "zones": [
        {"label": "The call", "ref": "Isaiah 1:16–17", "lines": ["Wash and cleanse yourselves.", "Remove your evil deeds from My sight.", "Stop doing evil!", "Learn to do right;", "seek justice", "and correct the oppressor.", "Defend the fatherless", "and plead the case of the widow.”"], "marks": ["Wash", "cleanse", "Remove", "Stop", "Learn", "seek", "correct", "Defend", "plead"]},
        {"label": "The LORD's offer", "ref": "Isaiah 1:18", "lines": ["“Come now, let us reason together,” says the LORD.", "“Though your sins are like scarlet,", "they will be as white as snow;", "though they are as red as crimson,", "they will become like wool."], "marks": ["Come now"]},
    ]}],
    "gospels": [{"type": "pages", "caption": "The last page of one book and the first of the next, by the same writer. The words they share are marked.", "zones": [
        {"label": "The last page of Luke", "ref": "Luke 24:48–49", "lines": ["You are witnesses of these things.", "And behold, I am sending the promise of My Father upon you. But remain in the city until you have been clothed with power from on high.”"], "marks": ["witnesses", "power"]},
        {"label": "The first page of Acts", "ref": "Acts 1:8", "lines": ["But you will receive power when the Holy Spirit comes upon you, and you will be My witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.”"], "marks": ["witnesses", "power"]},
    ]}],
    "letters": [
        {"type": "letter", "caption": "Set as what they are: a letter's appeal, and the way Revelation opens. The rest of each is in the reading.", "tone": "epistles", "zones": [
            {"label": "A letter's appeal", "ref": "Ephesians 4:1–3", "lines": ["As a prisoner in the Lord, then, I urge you", "to walk in a manner worthy of the calling you have received:", "with all humility and gentleness, with patience, bearing with one another in love,", "and with diligence to preserve the unity of the Spirit through the bond of peace."], "marks": ["I urge you"]},
            {"label": "How Revelation opens", "ref": "Revelation 1:4", "lines": ["John,", "To the seven churches in the province of Asia:", "Grace and peace to you from Him who is and was and is to come, and from the seven Spirits before His throne,"], "marks": ["John,", "To the seven churches", "Grace and peace to you"]},
        ]},
        {"type": "facing", "caption": "The first pages and the last. The marks show shared words, and the comparison is this study's: no verse here says it is quoting.", "tone": "revelation", "zones": [
            {"label": "A garden", "ref": "Genesis 2:9–10", "lines": ["Out of the ground the LORD God gave growth to every tree that is pleasing to the eye and good for food. And in the middle of the garden were the tree of life and the tree of the knowledge of good and evil.", "Now a river flowed out of Eden to water the garden, and from there it branched into four headwaters:"], "marks": ["tree of life", "river"]},
            {"label": "A city", "ref": "Revelation 22:1–2", "lines": ["Then the angel showed me a river of the water of life, as clear as crystal, flowing from the throne of God and of the Lamb", "down the middle of the main street of the city. On either side of the river stood a tree of life, bearing twelve kinds of fruit and yielding a fresh crop for each month. And the leaves of the tree are for the healing of the nations."], "marks": ["tree of life", "river"]},
        ]},
    ],
}

# Books where each kind is at home, so a mark there would prove nothing.
KINDS = [
    {"id": "song", "name": "A song", "line": "A story or a prophecy stops, and someone sings.", "home": ["PSA", "SNG"]},
    {"id": "prayer", "name": "A prayer", "line": "Someone in the story turns and speaks to God.", "home": ["PSA"]},
    {"id": "law", "name": "A law", "line": "The story stops to give a rule that is meant to last.", "home": ["LEV", "DEU"]},
    {"id": "family", "name": "A family line", "line": "Names and more names, set in the middle of the account.", "home": []},
    {"id": "saying", "name": "A proverb", "line": "A saying people already know, quoted in passing.", "home": ["PRO", "ECC"]},
    {"id": "vision", "name": "A vision", "line": "Someone is shown what others cannot see.", "home": ["REV", "DAN", "EZK", "ZEC"]},
    {"id": "letter", "name": "A letter", "line": "A real letter is named, copied or dictated in a book.", "home": ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"]},
    {"id": "story", "name": "A story within a story", "line": "Someone in the account tells a made-up story to make a point.", "home": []},
]
MARKS = {
    "song": [
        ("Exodus 15:1", "song", "Moses and Israel sing after the sea"), ("Numbers 21:17", "song", "Israel sings to a well"),
        ("Deuteronomy 31:30", "song", "Moses recites a song to the whole assembly"), ("Judges 5:1", "sang", "Deborah and Barak sing the victory"),
        ("2 Samuel 22:1", "song", "David sings after his rescue"), ("1 Chronicles 16:7", "song", "David gives Asaph a psalm of thanks"),
        ("Isaiah 5:1", "sing", "Isaiah sings of a vineyard"), ("Isaiah 26:1", "song", "A song for the land of Judah"),
        ("Habakkuk 3:19", "stringed", "A prophet's book ends with instructions for the musicians"), ("Luke 1:46", "magnifies", "Mary's song"),
        ("Revelation 5:9", "sang", "A new song in the vision"), ("Revelation 15:3", "song", "The song of Moses and the Lamb"),
    ],
    "prayer": [
        ("1 Samuel 2:1", "prayed", "Hannah prays at Shiloh"), ("1 Kings 8:22", "Solomon", "Solomon prays at the temple"),
        ("2 Kings 19:15", "prayed", "Hezekiah prays with the letter before him"), ("Ezra 9:6", "ashamed", "Ezra confesses the people's sin"),
        ("Nehemiah 1:5", "LORD", "Nehemiah prays before going to the king"), ("Jeremiah 32:16", "prayed", "Jeremiah prays after buying a field"),
        ("Daniel 9:4", "prayed", "Daniel confesses for his people"), ("Jonah 2:1", "prayed", "Jonah prays from inside the fish"),
        ("Habakkuk 3:1", "prayer", "Habakkuk's book ends in a prayer"), ("Matthew 6:9", "pray", "Jesus teaches His disciples how to pray"),
        ("John 17:1", "Father", "Jesus prays before His arrest"), ("Acts 4:24", "God", "The church prays under threat"),
        ("Ephesians 3:14", "bow", "A letter breaks off to pray"),
    ],
    "law": [
        ("Genesis 9:6", "Whoever", "A rule given to Noah"), ("Genesis 17:10", "circumcised", "A sign commanded to Abraham"),
        ("Exodus 12:14", "statute", "The Passover, commanded in the middle of the escape"), ("Exodus 20:3", "shall", "The commandments, inside the journey"),
        ("Numbers 15:38", "tassels", "A law in the middle of the wilderness years"),
        ("Jeremiah 34:14", "Hebrew", "A prophet recites the law on releasing slaves"), ("Ezekiel 43:12", "law", "A prophet receives the law of the temple"),
    ],
    "family": [
        ("Genesis 5:1", "book", "From Adam to Noah"), ("Ruth 4:18", "Perez", "A short story ends in David's family line"),
        ("1 Chronicles 1:1", "Adam", "A history opens with nine chapters of names, starting at Adam"), ("Ezra 2:1", "province", "The list of those who came back"),
        ("Nehemiah 7:6", "province", "The same people, listed again"), ("Matthew 1:1", "genealogy", "A Gospel opens with a family line"),
        ("Luke 3:23", "Joseph", "A Gospel pauses the story for one"),
    ],
    "saying": [
        ("1 Samuel 24:13", "proverb", "David quotes an old saying to Saul"), ("1 Kings 20:11", "armor", "Ahab answers a threat with a saying"),
        ("Ezekiel 18:2", "proverb", "The LORD challenges a proverb people repeat"), ("Luke 4:23", "proverb", "Jesus names a proverb they will quote at Him"),
        ("John 4:37", "saying", "Jesus quotes a saying about sowing and reaping"), ("Titus 1:12", "prophets", "Paul quotes a Cretan's saying about Crete"),
        ("2 Peter 2:22", "proverbs", "A letter ends a warning with two proverbs"),
    ],
    "vision": [
        ("Genesis 15:1", "vision", "Abram, after the battle"), ("Numbers 24:4", "vision", "Balaam, hired to curse, who sees it anyway"),
        ("1 Samuel 3:15", "vision", "The boy Samuel, afraid to tell it"), ("1 Kings 22:19", "saw", "Micaiah sees the LORD's court"),
        ("Isaiah 6:1", "saw", "Isaiah, in the year Uzziah died"), ("Amos 7:1", "showed", "Locusts, shown to a herdsman"),
        ("Obadiah 1:1", "vision", "A whole book called a vision"), ("Luke 1:22", "vision", "Zechariah comes out unable to speak"),
        ("Acts 9:10", "vision", "Ananias is sent to Saul"), ("Acts 16:9", "vision", "A man of Macedonia calls Paul over"),
        ("2 Corinthians 12:1", "visions", "Paul speaks of them reluctantly"),
    ],
    "letter": [
        ("2 Samuel 11:14", "letter", "David's letter that ordered a death"), ("1 Kings 21:8", "letters", "Jezebel's letters, in the king's name"),
        ("2 Kings 19:14", "letter", "Hezekiah spreads a threat before the LORD"), ("2 Chronicles 21:12", "letter", "A letter from Elijah to a king"),
        ("2 Chronicles 30:1", "letters", "Hezekiah invites the north to Passover"), ("Ezra 4:11", "letter", "A copy of a complaint to the king"),
        ("Nehemiah 6:5", "letter", "An open letter meant to frighten"), ("Esther 9:20", "letters", "Mordecai sends out the feast of Purim"),
        ("Jeremiah 29:1", "letter", "A prophet writes to the exiles"), ("Acts 15:23", "letter", "The Jerusalem council writes to the churches"),
        ("Acts 23:25", "letter", "A Roman officer's report on Paul"), ("Revelation 2:1", "write", "Seven messages, each dictated, inside a vision"),
    ],
    "story": [
        ("Judges 9:8", "trees", "Jotham's trees choose a king"), ("2 Samuel 12:1", "men", "Nathan's poor man and his lamb"),
        ("2 Samuel 14:6", "sons", "A woman's made-up family, told to David"), ("1 Kings 20:39", "battle", "A prophet in disguise traps a king"),
        ("2 Kings 14:9", "thistle", "A king answers with a thistle and a cedar"), ("Isaiah 5:1", "vineyard", "A vineyard that yields bad grapes"),
        ("Ezekiel 17:2", "parable", "Two eagles and a vine"), ("Ezekiel 24:3", "parable", "A cooking pot on the fire"),
    ],
}

PARTS = [
    {"id": "law", "name": "Law", "tone": "history", "first": "GEN", "last": "DEU"},
    {"id": "history", "name": "History", "tone": "history", "first": "JOS", "last": "EST"},
    {"id": "poetry", "name": "Poetry & Wisdom", "tone": "poetry", "first": "JOB", "last": "SNG"},
    {"id": "prophets", "name": "Prophets", "tone": "prophets", "first": "ISA", "last": "MAL"},
    {"id": "gospels", "name": "Gospels & Acts", "tone": "gospels", "first": "MAT", "last": "ACT"},
    {"id": "letters", "name": "Letters", "tone": "epistles", "first": "ROM", "last": "JUD"},
    {"id": "revelation", "name": "Revelation", "tone": "revelation", "first": "REV", "last": "REV"},
]
STEPS = [
    ("history", "law", "Joshua 1:7", "My servant Moses", "Deuteronomy 31:7", "Be strong and courageous", "names", "The LORD charges Joshua with what Moses commanded."),
    ("poetry", "law", "Psalm 103:7", "Moses", "Exodus 33:13", "let me know Your ways", "names", "A psalm remembers what Moses asked for and received."),
    ("poetry", "history", "Proverbs 25:1", "Solomon", "1 Kings 4:32", "Solomon", "names", "Proverbs names the king of its sayings and the later men who copied them."),
    ("prophets", "law", "Malachi 4:4", "law of My servant Moses", "Deuteronomy 5:2", "Horeb", "names", "The last of the prophets, in the Bible's order, sends you back to Horeb."),
    ("prophets", "history", "Isaiah 36:1", "In the fourteenth year of Hezekiah", "2 Kings 18:13", "In the fourteenth year of Hezekiah", "retells", "Isaiah and Kings give the same sentence, word for word in English."),
    ("prophets", "poetry", "Jeremiah 33:11", "His loving devotion endures forever", "Psalm 136:1", "His loving devotion endures forever", "shares", "Jeremiah hears a psalm's refrain sung again after the ruin."),
    ("gospels", "law", "Mark 12:26", "Book of Moses", "Exodus 3:6", "the God of Abraham, the God of Isaac, and the God of Jacob", "names", "Jesus answers a question from the passage about the burning bush."),
    ("gospels", "history", "Luke 4:26", "Elijah", "1 Kings 17:9", "Zarephath", "names", "Jesus reminds His hometown where Elijah was sent."),
    ("gospels", "poetry", "Luke 20:42", "book of Psalms", "Psalm 110:1", "Sit at My right hand", "names", "Jesus quotes a psalm and names the book."),
    ("gospels", "prophets", "Luke 4:17", "scroll of the prophet Isaiah", "Isaiah 61:1", "The Spirit of the Lord", "names", "Jesus unrolls the scroll and finds the place."),
    ("letters", "law", "Romans 10:5", "Moses writes", "Leviticus 18:5", "the man who does these things will live by them", "names", "Paul names who wrote the sentence he quotes."),
    ("letters", "history", "Romans 11:2", "Elijah", "1 Kings 19:10", "I am the only one left", "names", "Paul asks whether they know this story."),
    ("letters", "poetry", "Romans 4:6", "David", "Psalm 32:1", "whose sins are covered", "names", "Paul names David and quotes his psalm in the next verse."),
    ("letters", "prophets", "Romans 9:27", "Isaiah cries out", "Isaiah 10:22", "like the sand of the sea", "names", "Paul gives the prophet's name and the prophet's words."),
    ("letters", "gospels", "1 Corinthians 11:24", "This is My body", "Luke 22:19", "This is My body", "retells", "Paul passes on that night, as he had received it."),
    ("revelation", "law", "Revelation 15:3", "Moses", "Exodus 15:1", "Moses", "names", "The redeemed sing the song of Moses and of the Lamb."),
    ("revelation", "history", "Revelation 22:16", "David", "2 Samuel 7:12", "your descendant", "names", "Jesus calls Himself David's offspring, the promise of 2 Samuel."),
    ("revelation", "poetry", "Revelation 2:27", "iron scepter", "Psalm 2:9", "iron scepter", "shares", "The psalm's picture, without its name."),
    ("revelation", "prophets", "Revelation 21:4", "wipe away", "Isaiah 25:8", "wipe away", "shares", "Isaiah's promise about tears, without his name."),
    ("revelation", "gospels", "Revelation 3:3", "thief", "Luke 12:39", "thief", "shares", "Jesus' picture of the thief, used again."),
    ("revelation", "letters", "Revelation 1:4", "Grace and peace to you", "Romans 1:7", "Grace and peace to you", "shares", "Revelation opens with the words the letters use."),
]

TRY = [
    {"ref": "Judges 9:8–15", "answer": "A story within a story", "options": ["An account of what happened", "A story within a story", "A law", "A prayer"],
     "why": "Trees do not hold elections. Jotham tells this from a mountain, to the men of Shechem, about the king they have just made (the verses around it say so). The history is real and the trees are his way of making the point, so you should ask what he wants them to see."},
    {"ref": "Jeremiah 29:4–7", "answer": "A letter", "options": ["A letter", "A proverb", "A vision", "A song"],
     "why": "It stands in a prophet's book, and 29:1 calls it a letter: Jeremiah writes to people already in Babylon. So \"Seek the prosperity of the city\" is spoken to those exiles, in that city, and you should begin there before asking what it means for you."},
    {"ref": "Luke 1:46–55", "answer": "A song", "options": ["A sermon", "A family line", "A song", "A letter"],
     "why": "It is in a Gospel, and the account stops. Mary speaks in matched pairs of lines, the way the psalms do, and ends on what God promised \"to Abraham and his descendants\". The site's reading is that you hear it best as praise, and not as a list of events."},
]

PAGE_REFERENCES = ["Exodus 14:28", "Judges 5:26"]
QUOTED_CONFESSION = {"truth, without any mixture of error", "There is no salvation apart from personal faith in Jesus Christ as Lord", "All Scripture is a testimony to Christ"}
SOURCES = [
    {"id": "maclaren", "name": "Alexander Maclaren, Expositions of Holy Scripture, on Exodus 20", "href": "https://ccel.org/ccel/maclaren", "note": "One short quotation. Read: the opening of his exposition of the commandments only. Public domain."},
    {"id": "calvin-psalms", "name": "John Calvin, Commentary on the Psalms, vol. 1, trans. James Anderson", "href": "https://ccel.org/ccel/calvin/calcom08.html", "note": "One short quotation. Read: his comment on Psalm 13:1 only. Public domain."},
    {"id": "calvin-isaiah", "name": "John Calvin, Commentary on Isaiah, vol. 1, trans. William Pringle", "href": "https://ccel.org/ccel/calvin/calcom13.html", "note": "One short quotation. Read: his comments on Isaiah 1:16 and 1:18, in part. Public domain."},
    {"id": "henry-rev", "name": "Matthew Henry, Commentary on the Whole Bible, on Revelation 22", "href": "https://ccel.org/ccel/henry/mhc6.html", "note": "Two short quotations. Read: his comment on the tree of life in Revelation 22 only. Public domain."},
    {"id": "jfb", "name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory", "href": "https://ccel.org/ccel/jamieson/jfb.html", "note": "Short quotations and one summary. Read: the introduction to Job in part, and the notes on Job 42:7, Proverbs 26:4–5 and Luke 24:45 only. Public domain."},
    {"id": "london", "name": "Second London Baptist Confession (1677/1689), 19.3–5", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "Short quotations in its own spelling. Read: these three paragraphs, from the site's creeds collection. Public domain."},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 1 and 4", "href": "https://bfm.sbc.net/bfm2000/", "note": "Three short phrases, with a link. Consulted 2026-10-30 through a web tool that returns extracts, and in the site's doctrinal foundation file. Copyright Southern Baptist Convention; short phrases only."},
    {"id": "canon", "name": "This site's research record, How the canon took shape", "href": "/study/how-the-canon-took-shape", "note": "Used for the sentence on how the Hebrew Bible is arranged. That record gives its own sources. Written by this site."},
]
