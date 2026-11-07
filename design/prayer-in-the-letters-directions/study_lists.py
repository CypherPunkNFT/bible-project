"""The lists behind the Prayer across Scripture mock-up. build-data.py checks every phrase here against its verse, as whole
words, and fails on an entry the study no longer uses."""

# Baptist Faith and Message 2000: each phrase the study quotes, and the article it must be found in, in the held copy below.
BFM_HELD = "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"
BFM_QUOTES = {
    "cheerfully, regularly, systematically, proportionately, and liberally": "XIII",
    "Growth in grace should continue throughout the regenerate person's life": "IV",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "IV",
    "consistent with the free agency of man": "V",
    "the One Mediator": "II",
    "render loyal obedience": "XVII",
    "A free church in a free state is the Christian ideal": "XVII",
}

# Phrases that differ from the held article. The page keeps the study's words and marks the held wording; the build proves
# the study's words are NOT in the article and the held wording IS, so an entry can neither hide a match nor invent a reading.
BFM_MISQUOTES = {
    "offered freely to all who accept Jesus Christ as Lord and Savior": ("IV", "offered freely to all who accept Jesus Christ as Lord and Saviour"),
}

# Scripture quoted in words the Berean does not have. Same rule: the study's words are NOT in the verse, the Berean's ARE.
SCRIPTURE_MISQUOTES = {
    "thorn in the flesh": ("2 Corinthians 12:7", "thorn in my flesh"),
}

# Words the study names in order to say a passage does NOT contain them. The build proves each is absent from that passage.
ABSENT_WORDS = {
    ("06", "I"): "Matthew 6:9–13",
    ("06", "my"): "Matthew 6:9–13",
}

# Quoted words that are not Scripture and not a source: the study's own glosses and names, keyed by where they stand.
# Reached only after Scripture has failed. At most five words each; every entry must be used.
OWN_TERMS = {
    ("01", "standing prayer"): "the meaning of the name Amidah",
    ("01", "Our Father, our King"): "the meaning of the name Avinu Malkeinu",
    ("01", "hypocrite"): "the word the study explains; the verse has the plural",
    ("02", "so it is"): "a meaning of Amen",
    ("02", "let it be"): "a meaning of Amen",
}

# Parts of the text the build knows to be wrong, word for word. The page shows them as written; the build fails if one
# changes, so a corrected text cannot keep a stale entry. Each needs the owner's word.
KNOWN_TEXT_ISSUES = {
    "ten passages from the letters: six where a writer reports what he prays for his readers, and four where he tells them to pray or asks for their prayers":
        "The study reads nine letter passages: six reported prayers and three instructions (1 Timothy 2:1–6, Ephesians 6:18–20, Colossians 4:2–4).",
    "ten passages where His apostles prayed and asked for prayer": "Nine, as above.",
}

# Studies the text names in italics, and the folder of each one's mock-up. The build fails if a listed folder is missing.
STUDY_LINKS = {
    "The Holy Spirit": "the-holy-spirit",
    "Chosen and kept: can I be sure?": "chosen-and-kept",
    "Fear, anxiety and despair": "fear-anxiety-and-despair",
    "What Scripture promises the sick": "illness-and-healing",
    "Witness and the nations: telling others about Jesus": "bearing-witness",
    "Faith under pressure": "faith-under-pressure",
    "Angels, demons and spiritual powers": "angels-demons-and-spiritual-powers",
    "The hope to come": "the-hope-to-come",
    "The Christian and the state": "the-christian-and-the-state",
    "A new creation: what changes when you believe": "a-new-creation",
    "Grief and dying": "grief-and-dying",
    "The good news: how a person is made right with God": "the-good-news",
}
NAMED_STUDIES = {"The wisdom books"}  # named in the text; its page was not built when this was written, so it shows as a name
ITALIC_TERMS = {"so that what?", "Experiencing God", "Decision Making and the Will of God", "Just Do Something"}

KIND_LABELS = {"thanks": "Thanks", "asks": "Asks", "so": "So that", "ends": "Arrives at"}
ROLES = {"reported": "A reported prayer", "instruction": "An instruction to pray", "both": "An instruction, and a request for prayer"}

# Section 01, the spine. The prayer Jesus taught, one line at a time, each line's words found once in its verse. `part` is the
# part of the study that reads the line; `letters` are the letters' passages this study sets beside it (its pairing, not an
# apostle's), each inside a passage the study cites. `band` groups the lines as the text does.
SPINE = [
    {"id": "teach", "ref": "Luke 11:1", "words": "Lord, teach us to pray", "part": "01", "band": "ask", "letters": []},
    {"id": "father", "ref": "Matthew 6:9", "words": "Our Father in heaven", "part": "06", "band": "address", "letters": ["1 Timothy 2:1–6", "Ephesians 6:18–20"]},
    {"id": "name", "ref": "Matthew 6:9", "words": "hallowed be Your name", "part": "02", "band": "god", "letters": ["Ephesians 1:15–23", "Ephesians 3:14–21", "2 Thessalonians 1:12"]},
    {"id": "kingdom", "ref": "Matthew 6:10", "words": "Your kingdom come", "part": "02", "band": "god", "letters": ["Colossians 1:13"]},
    {"id": "will", "ref": "Matthew 6:10", "words": "Your will be done, on earth as it is in heaven", "part": "02", "band": "god", "letters": ["Colossians 1:9"]},
    {"id": "bread", "ref": "Matthew 6:11", "words": "Give us this day our daily bread", "part": "03", "band": "us", "letters": ["1 Thessalonians 3:9–13", "Colossians 4:2–4"]},
    {"id": "forgive", "ref": "Matthew 6:12", "words": "And forgive us our debts, as we also have forgiven our debtors", "part": "04", "band": "us", "letters": ["Philippians 1:3–11"]},
    {"id": "deliver", "ref": "Matthew 6:13", "words": "And lead us not into temptation, but deliver us from the evil one", "part": "05", "band": "us", "letters": ["Colossians 1:3–14", "2 Thessalonians 1:3–12"]},
]
BANDS = {"ask": "Luke 11:1 · the request", "address": "Matthew 6:9–13 · the prayer", "god": "About God", "us": "About us"}

# Sources. `href` may only be a page on this site; the rest are named, with what was read.
SOURCES = [
    {"id": "bsb", "short": "Berean", "name": "Berean Standard Bible", "href": None, "note": "Every verse quoted and opened, from the site's own copy. Public domain; courtesy credit berean.bible."},
    {"id": "bfm", "short": "Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, Articles II, IV, V, XIII and XVII", "href": None, "note": "Short phrases. Each is checked by script inside its article of the copy held in the site's question sources."},
    {"id": "lbc", "short": "Second London Confession", "name": "Second London Baptist Confession (1677), chapter 22 paragraph 2", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "One short quotation. Read: chapter 22, in the site's creeds collection."},
    {"id": "boyce", "short": "Boyce", "name": "James P. Boyce, Abstract of Systematic Theology, on effectual calling", "href": None, "note": "One short quotation. Read: the passage on the sincerity of the outward call only. Public domain."},
    {"id": "calvin-eph", "short": "Calvin", "name": "John Calvin, Commentary on Galatians and Ephesians, on Ephesians 1:17 and 3:20", "href": None, "note": "Short quotations. Read: those comments only. Public domain. Reformed, not Baptist."},
    {"id": "calvin-tim", "short": "Calvin", "name": "John Calvin, Commentary on Timothy, Titus and Philemon, on 1 Timothy 2:2–4", "href": None, "note": "Short quotations. Read: those comments only. Public domain. Reformed, not Baptist."},
    {"id": "calvin-cor", "short": "Calvin", "name": "John Calvin, Commentary on Corinthians, volume 2, on 2 Corinthians 12:8", "href": None, "note": "One short quotation. Read: that comment only. Public domain. Reformed, not Baptist."},
    {"id": "barnes", "short": "Barnes", "name": "Albert Barnes, Notes on the New Testament, on Ephesians 1:17", "href": None, "note": "Told in the site's words, not quoted. Read: that note only. Public domain. Presbyterian."},
    {"id": "wesley", "short": "Wesley", "name": "John Wesley, Explanatory Notes upon the New Testament, on 1 Timothy 2:4", "href": None, "note": "One short quotation. Read: that note only. Public domain. Methodist, not Baptist."},
    {"id": "trent", "short": "Council of Trent", "name": "Council of Trent, on the invocation, veneration and relics of saints", "href": "/study/creeds/council-of-trent-canons-and-decrees-1563", "note": "Short quotations, shown as Roman Catholic teaching. Read: that decree's opening, in the site's creeds collection."},
    {"id": "named", "short": "Named, not quoted", "name": "The Amidah, the Kaddish and Avinu Malkeinu; the Didache; Henry Blackaby and Claude King, Experiencing God; Garry Friesen, Decision Making and the Will of God; Kevin DeYoung, Just Do Something", "href": None, "note": "Described in the site's words, not quoted, and not read for this page. The study marks the dates and details still to check."},
]

# Each passage whole, with the phrases that break it into lines. A phrase is (kind, reference of one verse, its words). `who` and `sure` are this site's words.
LEAVES = {
    "Ephesians 1:15–23": {"role": "reported", "who": "The readers of this letter, whose faith and love Paul has heard about (Ephesians 1:15).",
        "sure": "God's power, shown when He raised Christ and set Him over every power (Ephesians 1:19–22).",
        "marks": [("thanks", "Ephesians 1:15", "your faith in the Lord Jesus and your love for all the saints"), ("thanks", "Ephesians 1:16", "I have not stopped giving thanks for you"),
                  ("asks", "Ephesians 1:17", "may give you a spirit of wisdom and revelation in your knowledge of Him"), ("asks", "Ephesians 1:18", "the eyes of your heart may be enlightened"),
                  ("so", "Ephesians 1:18", "so that you may know the hope of His calling"), ("ends", "Ephesians 1:23", "the fullness of Him who fills all in all")]},
    "Ephesians 3:14–21": {"role": "reported", "who": "The same readers, and with them all the saints (Ephesians 3:18).",
        "sure": "The Father, the riches of His glory, and His power at work within us (Ephesians 3:16–20).",
        "note": "No thanks is given in these verses. Paul's thanks for these readers is in Ephesians 1:15–16.",
        "marks": [("asks", "Ephesians 3:16", "He may strengthen you with power through His Spirit in your inner being"), ("so", "Ephesians 3:17", "so that Christ may dwell in your hearts through faith"),
                  ("so", "Ephesians 3:19", "to know this love that surpasses knowledge"), ("so", "Ephesians 3:19", "that you may be filled with all the fullness of God"), ("ends", "Ephesians 3:21", "to Him be the glory in the church and in Christ Jesus")]},
    "Philippians 1:3–11": {"role": "reported", "who": "All the believers at Philippi, his partners in the gospel (Philippians 1:5–7).",
        "sure": "He who began a good work will carry it on to completion (Philippians 1:6).",
        "marks": [("thanks", "Philippians 1:3", "I thank my God every time I remember you"), ("thanks", "Philippians 1:5", "your partnership in the gospel from the first day until now"),
                  ("asks", "Philippians 1:9", "your love may abound more and more in knowledge and depth of insight"), ("so", "Philippians 1:10", "so that you may be able to test and prove what is best"),
                  ("so", "Philippians 1:10", "may be pure and blameless for the day of Christ"), ("ends", "Philippians 1:11", "to the glory and praise of God")]},
    "1 Thessalonians 3:9–13": {"role": "reported", "who": "The believers at Thessalonica, whom Paul longs to see (1 Thessalonians 3:10).",
        "sure": "God the Father and the Lord Jesus, who are asked by name, and the coming of the Lord (1 Thessalonians 3:11–13).",
        "marks": [("thanks", "1 Thessalonians 3:9", "How can we adequately thank God for you"), ("asks", "1 Thessalonians 3:10", "we may see you face to face and supply what is lacking from your faith"),
                  ("asks", "1 Thessalonians 3:11", "direct our way to you"), ("asks", "1 Thessalonians 3:12", "cause you to increase and overflow with love for one another and for everyone else"),
                  ("so", "1 Thessalonians 3:13", "so that He may establish your hearts in blamelessness and holiness"), ("ends", "1 Thessalonians 3:13", "at the coming of our Lord Jesus with all His saints")]},
    "Colossians 1:3–14": {"role": "reported", "who": "The believers at Colossae, whom Paul knows of through Epaphras (Colossians 1:7–8).",
        "sure": "What the Father has already done: qualified, rescued, brought in, forgiven (Colossians 1:12–14).",
        "marks": [("thanks", "Colossians 1:3", "We always thank God"), ("thanks", "Colossians 1:4", "your faith in Christ Jesus and your love for all the saints"), ("thanks", "Colossians 1:6", "this gospel is bearing fruit and growing"),
                  ("asks", "Colossians 1:9", "to fill you with the knowledge of His will in all spiritual wisdom and understanding"), ("so", "Colossians 1:10", "so that you may walk in a manner worthy of the Lord"),
                  ("so", "Colossians 1:11", "so that you may have full endurance and patience"), ("ends", "Colossians 1:12", "giving thanks to the Father")]},
    "2 Thessalonians 1:3–12": {"role": "reported", "who": "Believers enduring persecution and affliction (2 Thessalonians 1:4).",
        "sure": "God's righteous judgment, and the day the Lord comes (2 Thessalonians 1:5–10).",
        "marks": [("thanks", "2 Thessalonians 1:3", "We are obligated to thank God for you"), ("thanks", "2 Thessalonians 1:3", "your faith is growing more and more"),
                  ("asks", "2 Thessalonians 1:11", "our God will count you worthy of His calling"), ("asks", "2 Thessalonians 1:11", "He will powerfully fulfill your every good desire and work of faith"),
                  ("so", "2 Thessalonians 1:12", "so that the name of our Lord Jesus will be glorified in you"), ("ends", "2 Thessalonians 1:12", "according to the grace of our God and of the Lord Jesus Christ")]},
    "1 Timothy 2:1–6": {"role": "instruction", "who": "Everyone, with kings and all those in authority named (1 Timothy 2:1–2).",
        "sure": "God our Savior, the one mediator, and the ransom He gave (1 Timothy 2:3–6).",
        "marks": [("asks", "1 Timothy 2:1", "petitions, prayers, intercessions"), ("thanks", "1 Timothy 2:1", "thanksgiving"), ("so", "1 Timothy 2:2", "so that we may lead tranquil and quiet lives in all godliness and dignity")]},
    "Ephesians 6:18–20": {"role": "both", "who": "All the saints, and then Paul himself (Ephesians 6:18–19).",
        "sure": "Nothing is named here beyond the Spirit in whom they pray (Ephesians 6:18).",
        "marks": [("asks", "Ephesians 6:18", "Pray in the Spirit at all times"), ("asks", "Ephesians 6:19", "words may be given me"), ("so", "Ephesians 6:19", "so that I will boldly make known the mystery of the gospel")]},
    "Colossians 4:2–4": {"role": "both", "who": "Paul and those with him (Colossians 4:3).",
        "sure": "It is God who may open the door (Colossians 4:3).",
        "marks": [("asks", "Colossians 4:2", "Devote yourselves to prayer"), ("thanks", "Colossians 4:2", "being watchful and thankful"), ("asks", "Colossians 4:3", "God may open to us a door for the word"),
                  ("so", "Colossians 4:3", "so that we may proclaim the mystery of Christ"), ("asks", "Colossians 4:4", "I may declare it clearly")]},
}

# Section 02. Six columns, read upward. `part` is the part of the study that reads the passage. Each station must lie inside a phrase of the same kind on that leaf, in verse order.
CLIMBS = [
    {"id": "eph1", "name": "Ephesians 1", "leaf": "Ephesians 1:15–23", "part": "02", "stations": [
        ("thanks", "Ephesians 1:15", "your faith in the Lord Jesus"), ("asks", "Ephesians 1:17", "a spirit of wisdom and revelation"), ("asks", "Ephesians 1:18", "the eyes of your heart may be enlightened"),
        ("so", "Ephesians 1:18", "so that you may know the hope of His calling"), ("ends", "Ephesians 1:23", "the fullness of Him who fills all in all")]},
    {"id": "eph3", "name": "Ephesians 3", "leaf": "Ephesians 3:14–21", "part": "02", "stations": [
        ("asks", "Ephesians 3:16", "strengthen you with power through His Spirit"), ("so", "Ephesians 3:17", "so that Christ may dwell in your hearts"), ("so", "Ephesians 3:19", "to know this love that surpasses knowledge"),
        ("ends", "Ephesians 3:21", "to Him be the glory")]},
    {"id": "php", "name": "Philippians 1", "leaf": "Philippians 1:3–11", "part": "04", "stations": [
        ("thanks", "Philippians 1:5", "your partnership in the gospel"), ("asks", "Philippians 1:9", "your love may abound more and more"), ("so", "Philippians 1:10", "so that you may be able to test and prove what is best"),
        ("so", "Philippians 1:10", "pure and blameless for the day of Christ"), ("ends", "Philippians 1:11", "to the glory and praise of God")]},
    {"id": "1th", "name": "1 Thessalonians 3", "leaf": "1 Thessalonians 3:9–13", "part": "03", "stations": [
        ("thanks", "1 Thessalonians 3:9", "thank God for you"), ("asks", "1 Thessalonians 3:11", "direct our way to you"), ("asks", "1 Thessalonians 3:12", "increase and overflow with love"),
        ("so", "1 Thessalonians 3:13", "so that He may establish your hearts"), ("ends", "1 Thessalonians 3:13", "at the coming of our Lord Jesus")]},
    {"id": "col", "name": "Colossians 1", "leaf": "Colossians 1:3–14", "part": "05", "stations": [
        ("thanks", "Colossians 1:4", "your faith in Christ Jesus"), ("asks", "Colossians 1:9", "to fill you with the knowledge of His will"), ("so", "Colossians 1:10", "so that you may walk in a manner worthy of the Lord"),
        ("so", "Colossians 1:11", "so that you may have full endurance and patience"), ("ends", "Colossians 1:12", "giving thanks to the Father")]},
    {"id": "2th", "name": "2 Thessalonians 1", "leaf": "2 Thessalonians 1:3–12", "part": "05", "stations": [
        ("thanks", "2 Thessalonians 1:3", "your faith is growing more and more"), ("asks", "2 Thessalonians 1:11", "count you worthy of His calling"), ("asks", "2 Thessalonians 1:11", "fulfill your every good desire and work of faith"),
        ("so", "2 Thessalonians 1:12", "so that the name of our Lord Jesus will be glorified in you"), ("ends", "2 Thessalonians 1:12", "the grace of our God")]},
]

