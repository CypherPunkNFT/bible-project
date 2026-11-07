"""The lists behind The church and its calling mock-up. build-data.py checks every phrase here against its verse, as whole words."""

# Baptist Faith and Message 2000, as amended 14 June 2023. Each phrase was compared by script on 2026-10-30 against the printable PDF linked from
# https://bfm.sbc.net/bfm2000/ (sha256 below). The PDF is not kept in this folder, because the confession's rights are the SBC's, so this compare cannot be rerun here.
BFM_PDF_SHA256 = "92eb2d8868db03271a40d1575eb50b0313c81d56c882daad5fbced5ba0cc3ab0"
QUOTED_CONFESSION = {
    "autonomous local congregation of baptized believers",
    "all of the redeemed of all the ages",
    "the immersion of a believer in water",
    "an act of obedience symbolizing the believer's faith",
    "a symbolic act of obedience",
    "memorialize the death of the Redeemer and anticipate His second coming",
    "operates under the Lordship of Christ through democratic processes",
    "While both men and women are gifted for service in the church, the office of pastor/elder/overseer is limited to men as qualified by Scripture",
    "There is no salvation apart from personal faith in Jesus Christ as Lord",
    "endeavor to make disciples of all nations",
}

READING_ORDER = ["body", "house", "order", "flock", "water", "sent"]

RINGS = [
    {"id": "house", "name": "A house", "line": "A church that meets at someone's house. The word is used this way four times, and each one is a greeting."},
    {"id": "place", "name": "A place", "line": "One people in one town, or the people of a church gathered or spoken of as one congregation."},
    {"id": "many", "name": "Many places", "line": "Many congregations counted together, usually in the plural: the churches of a region, or all of them."},
    {"id": "all", "name": "All who are Christ's", "line": "Not any one town. Christ's church, His body, the one He loved and gave Himself for."},
]

# Every verse in the Berean New Testament with the word church or churches, in order, with one ring for each use in the verse.
WORD = [
    ("Matthew 16:18", ["all"]), ("Matthew 18:17", ["place", "place"]),
    ("Acts 5:11", ["place"]), ("Acts 8:1", ["place"]), ("Acts 8:3", ["place"]), ("Acts 9:31", ["many"]), ("Acts 11:22", ["place"]), ("Acts 11:26", ["place"]),
    ("Acts 12:1", ["place"]), ("Acts 12:5", ["place"]), ("Acts 13:1", ["place"]), ("Acts 14:23", ["many"]), ("Acts 14:27", ["place"]), ("Acts 15:3", ["place"]),
    ("Acts 15:4", ["place"]), ("Acts 15:22", ["place"]), ("Acts 15:41", ["many"]), ("Acts 16:5", ["many"]), ("Acts 18:22", ["place"]), ("Acts 20:17", ["place"]), ("Acts 20:28", ["place"]),
    ("Romans 16:1", ["place"]), ("Romans 16:4", ["many"]), ("Romans 16:5", ["house"]), ("Romans 16:16", ["many"]), ("Romans 16:23", ["place"]),
    ("1 Corinthians 1:2", ["place"]), ("1 Corinthians 4:17", ["many"]), ("1 Corinthians 5:12", ["place"]), ("1 Corinthians 6:4", ["place"]), ("1 Corinthians 7:17", ["many"]),
    ("1 Corinthians 10:32", ["all"]), ("1 Corinthians 11:16", ["many"]), ("1 Corinthians 11:18", ["place"]), ("1 Corinthians 11:22", ["place"]), ("1 Corinthians 12:28", ["all"]),
    ("1 Corinthians 14:4", ["place"]), ("1 Corinthians 14:5", ["place"]), ("1 Corinthians 14:12", ["place"]), ("1 Corinthians 14:19", ["place"]), ("1 Corinthians 14:23", ["place"]),
    ("1 Corinthians 14:26", ["place"]), ("1 Corinthians 14:28", ["place"]), ("1 Corinthians 14:33", ["many"]), ("1 Corinthians 14:34", ["many"]), ("1 Corinthians 14:35", ["place"]),
    ("1 Corinthians 15:9", ["all"]), ("1 Corinthians 16:1", ["many"]), ("1 Corinthians 16:19", ["many", "house"]),
    ("2 Corinthians 1:1", ["place"]), ("2 Corinthians 8:1", ["many"]), ("2 Corinthians 8:18", ["many"]), ("2 Corinthians 8:19", ["many"]), ("2 Corinthians 8:23", ["many"]), ("2 Corinthians 8:24", ["many"]),
    ("2 Corinthians 11:8", ["many"]), ("2 Corinthians 11:28", ["many"]), ("2 Corinthians 12:13", ["many"]),
    ("Galatians 1:2", ["many"]), ("Galatians 1:13", ["all"]), ("Galatians 1:22", ["many"]),
    ("Ephesians 1:22", ["all"]), ("Ephesians 3:10", ["all"]), ("Ephesians 3:21", ["all"]), ("Ephesians 5:23", ["all"]), ("Ephesians 5:24", ["all"]), ("Ephesians 5:25", ["all"]),
    ("Ephesians 5:27", ["all"]), ("Ephesians 5:29", ["all"]), ("Ephesians 5:32", ["all"]),
    ("Philippians 3:6", ["all"]), ("Philippians 4:15", ["place"]), ("Colossians 1:18", ["all"]), ("Colossians 1:24", ["all"]), ("Colossians 4:15", ["house"]), ("Colossians 4:16", ["place"]),
    ("1 Thessalonians 1:1", ["place"]), ("1 Thessalonians 2:14", ["many"]), ("2 Thessalonians 1:1", ["place"]), ("2 Thessalonians 1:4", ["many"]),
    ("1 Timothy 3:5", ["place"]), ("1 Timothy 3:15", ["all"]), ("1 Timothy 5:16", ["place"]), ("Philemon 1:2", ["house"]), ("James 5:14", ["place"]), ("1 Peter 5:13", ["place"]),
    ("3 John 1:6", ["place"]), ("3 John 1:9", ["place"]), ("3 John 1:10", ["place"]),
    ("Revelation 1:4", ["many"]), ("Revelation 1:11", ["many"]), ("Revelation 1:20", ["many", "many"]), ("Revelation 2:1", ["place"]), ("Revelation 2:7", ["many"]), ("Revelation 2:8", ["place"]),
    ("Revelation 2:11", ["many"]), ("Revelation 2:12", ["place"]), ("Revelation 2:17", ["many"]), ("Revelation 2:18", ["place"]), ("Revelation 2:23", ["many"]), ("Revelation 2:29", ["many"]),
    ("Revelation 3:1", ["place"]), ("Revelation 3:6", ["many"]), ("Revelation 3:7", ["place"]), ("Revelation 3:13", ["many"]), ("Revelation 3:14", ["place"]), ("Revelation 3:22", ["many"]), ("Revelation 22:16", ["many"]),
]
# The singular word used of many congregations. Named, because the plural rule would otherwise refuse them.
MANY_SINGULAR = {"Acts 9:31", "Acts 14:23", "1 Corinthians 4:17"}
# Close calls. These are hollow on the rings, and each says why.
CLOSE = {
    "Matthew 18:17": "Any congregation a disciple belongs to, and not one named town.",
    "Acts 9:31": "The singular word, over three regions. It could be read as one people, and so as the widest ring.",
    "Acts 20:28": "Said to the elders of one town, but the purchase in blood reaches further than Ephesus.",
    "Romans 16:23": "Gaius hosted all the church. It may mean all the church in that town, or every believer who passed through.",
    "1 Corinthians 10:32": "Set beside Jews and Greeks, so read here of all God's people. It could mean the church at Corinth.",
    "1 Corinthians 12:28": "God's appointments reach past one town, so read here of all. It could mean the church as it gathers.",
    "1 Corinthians 15:9": "He harmed particular congregations. He names it the church of God, so it is read here of all.",
    "Galatians 1:13": "He harmed particular congregations. He names it the church of God, so it is read here of all.",
    "Philippians 3:6": "He harmed particular congregations. He says the church with no town, so it is read here of all.",
    "1 Timothy 3:5": "The congregation any overseer cares for, and not one named town.",
    "1 Timothy 3:15": "God's household, said in a letter about conduct in one congregation. It could sit on the ring for a place.",
}

# Who was in the room, for each reading. (reference of one verse, its words, this site's note on who that is.)
ROOMS = {
    "body": [("1 Corinthians 1:2", "To the church of God in Corinth", "A divided congregation, hearing this read out together."),
             ("Ephesians 1:1", "To the saints in Ephesus", "All of them. The one faith and one body are said to the whole room.")],
    "house": [("Ephesians 2:11", "you who are Gentiles in the flesh", "A group, addressed as a group, and told what has happened to them together."),
              ("1 Peter 1:1", "To the elect who are exiles of the Dispersion", "People scattered over five regions, told they are one house.")],
    "order": [("1 Corinthians 14:26", "When you come together", "The chapter is about the room itself: who speaks, who listens, who is lost."),
              ("1 Corinthians 11:18", "when you come together as a church", "Paul's own phrase. The word names people, here, on the point of gathering.")],
    "flock": [("1 Timothy 1:2", "To Timothy, my true child in the faith", "This one is to one man, and it says why: so that each one will know how to live in the household."),
              ("1 Peter 5:1", "the elders among you", "A part of the room is spoken to, with the rest listening. Every verse on this is heard by the flock too.")],
    "water": [("Matthew 28:16", "the eleven disciples", "The commission is first given to those who were there. Its reach is all nations and the end of the age."),
              ("1 Corinthians 11:20", "when you come together", "The Supper is never told as something done alone.")],
    "sent": [("1 Peter 2:9", "But you are a chosen people", "Every name in this sentence is a name for a people. None is said of one person."),
             ("Acts 1:6", "So when they came together", "The disciples, asking one question together, and given one task.")],
}

# Each baptism Acts tells. before and water are (reference of one verse, its words). A row with open says what is not told.
WATER = [
    {"id": "pentecost", "who": "About three thousand", "before": ("Acts 2:41", "Those who embraced his message"), "water": ("Acts 2:41", "were baptized")},
    {"id": "samaria", "who": "Men and women of Samaria", "before": ("Acts 8:12", "they believed Philip"), "water": ("Acts 8:12", "they were baptized, both men and women")},
    {"id": "simon", "who": "Simon", "before": ("Acts 8:13", "Simon himself believed"), "water": ("Acts 8:13", "was baptized")},
    {"id": "eunuch", "who": "The Ethiopian official", "before": ("Acts 8:35", "told him the good news about Jesus"), "water": ("Acts 8:38", "went down into the water, and Philip baptized him")},
    {"id": "saul", "who": "Saul", "before": ("Acts 9:11", "he is praying"), "water": ("Acts 9:18", "He got up and was baptized")},
    {"id": "cornelius", "who": "Cornelius' house", "before": ("Acts 10:47", "They have received the Holy Spirit"), "water": ("Acts 10:48", "be baptized in the name of Jesus Christ")},
    {"id": "lydia", "who": "Lydia and her household", "before": ("Acts 16:14", "The Lord opened her heart"), "water": ("Acts 16:15", "she and her household had been baptized"), "open": "Of her household, Acts says nothing about faith or age."},
    {"id": "jailer", "who": "The jailer and his household", "before": ("Acts 16:32", "spoke the word of the Lord to him and to everyone in his house"), "water": ("Acts 16:33", "he and all his household were baptized")},
    {"id": "corinth", "who": "Many in Corinth", "before": ("Acts 18:8", "who heard the message believed"), "water": ("Acts 18:8", "were baptized")},
    {"id": "ephesus", "who": "About twelve at Ephesus", "before": ("Acts 19:5", "On hearing this"), "water": ("Acts 19:5", "they were baptized into the name of the Lord Jesus")},
]
# Other verses in Acts with baptize or baptism: commands, John's baptism, retellings and the talk around a baptism already shown.
WATER_OTHER = {"1:5", "1:22", "2:38", "8:16", "8:36", "10:37", "11:16", "13:24", "18:25", "19:3", "19:4", "22:16"}

# Six phrases in 1 Peter 2:9–10, in order, each beside an older verse. The older verse is not claimed to be the earliest. how is either "Same words" (checked) or a plain statement of the distance.
NAMES = [
    {"id": "chosen", "name": ("1 Peter 2:9", "a chosen people"), "old": ("Isaiah 43:20", "My chosen people"), "how": "Same words but for one", "said": "Said of Israel, as God promises a way home through the desert."},
    {"id": "priests", "name": ("1 Peter 2:9", "a royal priesthood"), "old": ("Exodus 19:6", "a kingdom of priests"), "how": "Close, in other words", "said": "Said to Israel at Sinai, before the covenant was made."},
    {"id": "nation", "name": ("1 Peter 2:9", "a holy nation"), "old": ("Exodus 19:6", "a holy nation"), "how": "Same words", "shared": "a holy nation", "said": "The next phrase of the same promise at Sinai."},
    {"id": "possession", "name": ("1 Peter 2:9", "a people for God's own possession"), "old": ("Exodus 19:5", "My treasured possession"), "how": "One word shared", "shared": "possession", "said": "Said to Israel, out of all the nations, for the whole earth is His."},
    {"id": "virtues", "name": ("1 Peter 2:9", "to proclaim the virtues"), "old": ("Isaiah 43:21", "will declare My praise"), "how": "An echo, this study's pairing", "said": "The purpose God gave the people He formed for Himself."},
    {"id": "notpeople", "name": ("1 Peter 2:10", "Once you were not a people"), "old": ("Hosea 2:23", "I will say to those called 'Not My People,' 'You are My people,'"), "how": "An echo, this study's pairing", "said": "Said of Israel after judgment, through a prophet's own family."},
]

# Three lines often read alone. reading is what people commonly take them to say, in this site's words; room and answer are checked like the rest of the page.
LINES = [
    {"id": "two", "verse": "Matthew 18:20", "alone": "Often said over a small prayer meeting, as a promise that the Lord comes when few do.",
     "room": ("Matthew 18:17", "tell it to the church"), "answer": "Three verses earlier a brother has refused to listen, and the matter goes to the church. The two or three stand in that setting, and the next verse goes on to forgiving. This reading does not say He is absent otherwise. He has promised \"I am with you always\" in Matthew 28:20."},
    {"id": "temple", "verse": "1 Corinthians 3:16", "alone": "Often read as a line about looking after your own body.",
     "room": ("1 Corinthians 3:9", "you are God's field, God's building"), "answer": "Paul has been speaking to the whole divided congregation. Here the temple is all of them, and anyone who wrecks that congregation is under the warning of 1 Corinthians 3:17. The line about one person's body is 1 Corinthians 6:19, and it is true too. They are two different lines."},
    {"id": "work", "verse": "Philippians 1:6", "alone": "Often taken as a private promise about one person's life.",
     "room": ("Philippians 1:1", "To all the saints in Christ Jesus at Philippi"), "answer": "The good work is named just before, \"your partnership in the gospel\" in Philippians 1:5. It is a work among them together. The promise also holds for each believer, because Baptists confess that true believers will never fall away. Reading it together adds to the promise and takes nothing from it."},
]

SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 4, 6, 7 and 11", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Short phrases, with this link. Read: those articles, in the printable PDF linked from that page. Its text is the Southern Baptist Convention's, so it is not hosted here."},
    {"id": "nh", "short": "New Hampshire Confession (Baptist)", "name": "The New Hampshire Baptist Confession (1833)", "href": "/study/creeds/new-hampshire-baptist-confession-1833", "note": "One phrase, on baptism. Read: that article."},
    {"id": "lbc", "short": "Second London Confession (Baptist)", "name": "The Second London Baptist Confession (1677), chapter 26", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "Two phrases. Read: those paragraphs."},
    {"id": "wcf", "short": "Westminster Confession (Presbyterian and Reformed)", "name": "The Westminster Confession of Faith (1647), chapters 28, 29 and 31", "href": "/study/creeds/westminster-confession-of-faith-1647", "note": "Shown as their teaching. Read: those paragraphs."},
    {"id": "trent", "short": "Council of Trent (Roman Catholic)", "name": "The Council of Trent, on the Eucharist", "href": "/study/creeds/council-of-trent-canons-and-decrees-1563", "note": "One phrase, shown as their teaching. Read: that paragraph."},
    {"id": "luther", "short": "Luther's Small Catechism (Lutheran)", "name": "Luther's Small Catechism (1529)", "href": "/study/creeds/luthers-small-catechism-1529", "note": "Two phrases, shown as their teaching. Read: the answers on baptism and on the Sacrament of the Altar."},
    {"id": "barnes", "short": "Albert Barnes (Presbyterian)", "name": "Albert Barnes, Notes on the New Testament", "href": "https://www.ccel.org/ccel/barnes/ntnotes.html", "note": "Short quotations. Read: his notes on Acts 16:15, Acts 20:28, 1 Corinthians 11:5, 11:29 and 14:34 only. Not a Baptist."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Short quotations. Read: the note on Acts 16:15 only. Not Baptists."},
    {"id": "bsb", "short": "Berean Standard Bible", "name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened. Public domain since 2023. No Greek or Hebrew was compared."},
]
# A commentary quotation must fall soon after this words of its own verse's note, so a line from another comment in the same file cannot pass.
SOURCE_ANCHORS = {
    "a strong presumptive proof that this was an instance of household or infant baptism": "Chapter 16 - Verse 15",
    "given to the same class of officers": "Chapter 20 - Verse 28",
    "This rule is positive: explicit and universal": "Chapter 14 - Verse 34",
    "their example is no warrant now": "Chapter 11 - Verse 5",
    "between the bread which is used on this occasion, and common and ordinary food": "Chapter 11 - Verse 29",
    "is not explicitly stated": "first mention of a Christian household",
    "the question of infant baptism must be determined on other grounds": "first mention of a Christian household",
}
