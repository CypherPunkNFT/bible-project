"""The lists behind the Prayer in the letters mock-up. build-data.py checks every phrase here against its verse, as whole words."""

# Baptist Faith and Message 2000. Compared 2026-10-30 at https://bfm.sbc.net/bfm2000/ through a web tool that returns extracts.
# Those not in the site's doctrinal foundation file are listed by the build on each run.
QUOTED_CONFESSION = {
    "is offered freely to all who accept Jesus Christ as Lord and Saviour",
    "Growth in grace should continue throughout the regenerate person's life",
    "There is no salvation apart from personal faith in Jesus Christ as Lord",
    "consistent with the free agency of man",
    "the One Mediator",
    "render loyal obedience",
    "A free church in a free state is the Christian ideal",
}

READING_ORDER = ["wisdom", "strength", "love", "walk", "thanks", "others"]
KIND_LABELS = {"thanks": "Thanks", "asks": "Asks", "so": "So that", "ends": "Arrives at"}
ROLES = {"reported": "A reported prayer", "instruction": "An instruction to pray", "both": "An instruction, and a request for prayer"}

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
    "Colossians 4:2–6": {"role": "both", "who": "Paul and those with him (Colossians 4:3).",
        "sure": "It is God who may open the door (Colossians 4:3).",
        "marks": [("asks", "Colossians 4:2", "Devote yourselves to prayer"), ("thanks", "Colossians 4:2", "being watchful and thankful"), ("asks", "Colossians 4:3", "God may open to us a door for the word"),
                  ("so", "Colossians 4:3", "so that we may proclaim the mystery of Christ"), ("asks", "Colossians 4:4", "I may declare it clearly")]},
    "Romans 15:5–6": {"role": "reported", "who": "The believers at Rome (Romans 15:5).", "sure": "The God who gives endurance and encouragement (Romans 15:5).",
        "marks": [("asks", "Romans 15:5", "grant you harmony with one another in Christ Jesus"), ("so", "Romans 15:6", "so that with one mind and one voice you may glorify"), ("ends", "Romans 15:6", "the God and Father of our Lord Jesus Christ")]},
    "Romans 15:13": {"role": "reported", "who": "The same readers (Romans 15:13).", "sure": "The God of hope, and the power of the Holy Spirit (Romans 15:13).",
        "marks": [("asks", "Romans 15:13", "fill you with all joy and peace as you believe in Him"), ("so", "Romans 15:13", "so that you may overflow with hope"), ("ends", "Romans 15:13", "by the power of the Holy Spirit")]},
    "Hebrews 13:20–21": {"role": "reported", "who": "The readers of this letter (Hebrews 13:21).", "sure": "The God of peace, who brought back from the dead our Lord Jesus (Hebrews 13:20).",
        "marks": [("asks", "Hebrews 13:21", "equip you with every good thing"), ("so", "Hebrews 13:21", "to do His will"), ("asks", "Hebrews 13:21", "accomplish in us what is pleasing in His sight"), ("ends", "Hebrews 13:21", "to whom be glory forever and ever")]},
}

READ_FIRST_OPEN = {"others": True, "thanks": True}  # second passages start open in these readings; closed elsewhere
TRY = ["Romans 15:5–6", "Romans 15:13", "Hebrews 13:20–21"]

# Section 01. Six columns, read upward. Each station must lie inside a phrase of the same kind on that leaf, in verse order.
CLIMBS = [
    {"id": "eph1", "name": "Ephesians 1", "leaf": "Ephesians 1:15–23", "reading": "wisdom", "stations": [
        ("thanks", "Ephesians 1:15", "your faith in the Lord Jesus"), ("asks", "Ephesians 1:17", "a spirit of wisdom and revelation"), ("asks", "Ephesians 1:18", "the eyes of your heart may be enlightened"),
        ("so", "Ephesians 1:18", "so that you may know the hope of His calling"), ("ends", "Ephesians 1:23", "the fullness of Him who fills all in all")]},
    {"id": "eph3", "name": "Ephesians 3", "leaf": "Ephesians 3:14–21", "reading": "strength", "stations": [
        ("asks", "Ephesians 3:16", "strengthen you with power through His Spirit"), ("so", "Ephesians 3:17", "so that Christ may dwell in your hearts"), ("so", "Ephesians 3:19", "to know this love that surpasses knowledge"),
        ("ends", "Ephesians 3:21", "to Him be the glory")]},
    {"id": "php", "name": "Philippians 1", "leaf": "Philippians 1:3–11", "reading": "love", "stations": [
        ("thanks", "Philippians 1:5", "your partnership in the gospel"), ("asks", "Philippians 1:9", "your love may abound more and more"), ("so", "Philippians 1:10", "so that you may be able to test and prove what is best"),
        ("so", "Philippians 1:10", "pure and blameless for the day of Christ"), ("ends", "Philippians 1:11", "to the glory and praise of God")]},
    {"id": "1th", "name": "1 Thessalonians 3", "leaf": "1 Thessalonians 3:9–13", "reading": "love", "stations": [
        ("thanks", "1 Thessalonians 3:9", "thank God for you"), ("asks", "1 Thessalonians 3:11", "direct our way to you"), ("asks", "1 Thessalonians 3:12", "increase and overflow with love"),
        ("so", "1 Thessalonians 3:13", "so that He may establish your hearts"), ("ends", "1 Thessalonians 3:13", "at the coming of our Lord Jesus")]},
    {"id": "col", "name": "Colossians 1", "leaf": "Colossians 1:3–14", "reading": "walk", "stations": [
        ("thanks", "Colossians 1:4", "your faith in Christ Jesus"), ("asks", "Colossians 1:9", "to fill you with the knowledge of His will"), ("so", "Colossians 1:10", "so that you may walk in a manner worthy of the Lord"),
        ("so", "Colossians 1:11", "so that you may have full endurance and patience"), ("ends", "Colossians 1:12", "giving thanks to the Father")]},
    {"id": "2th", "name": "2 Thessalonians 1", "leaf": "2 Thessalonians 1:3–12", "reading": "walk", "stations": [
        ("thanks", "2 Thessalonians 1:3", "your faith is growing more and more"), ("asks", "2 Thessalonians 1:11", "count you worthy of His calling"), ("asks", "2 Thessalonians 1:11", "fulfill your every good desire and work of faith"),
        ("so", "2 Thessalonians 1:12", "so that the name of our Lord Jesus will be glorified in you"), ("ends", "2 Thessalonians 1:12", "the grace of our God")]},
]

# Section 03. The three requests about circumstances in these nine passages, and where each goes. `aim` is what the request is for.
AIMED = [
    {"id": "road", "name": "A road", "ask": ("1 Thessalonians 3:11", "direct our way to you"), "aim": ("1 Thessalonians 3:10", "supply what is lacking from your faith"), "span": "1 Thessalonians 3:10–11"},
    {"id": "door", "name": "A door", "ask": ("Colossians 4:3", "God may open to us a door"), "aim": ("Colossians 4:3", "so that we may proclaim the mystery of Christ"), "span": "Colossians 4:3"},
    {"id": "quiet", "name": "A quiet life", "ask": ("1 Timothy 2:2", "tranquil and quiet lives"), "aim": ("1 Timothy 2:2", "in all godliness and dignity"), "span": "1 Timothy 2:1–2"},
]

# Section 04. An older line beside a line in these passages. `how` says how close the two are, and on whose word.
OLDER = [
    {"old": ("Psalm 110:1", "Sit at My right hand"), "new": ("Ephesians 1:20", "seated Him at His right hand"), "shared": "right hand", "how": "Shares words"},
    {"old": ("Psalm 8:6", "You have placed everything under his feet"), "new": ("Ephesians 1:22", "God put everything under His feet"), "shared": "everything under his feet", "how": "Shares words"},
    {"old": ("Jeremiah 29:7", "Pray to the LORD on its behalf"), "new": ("1 Timothy 2:2", "kings and all those in authority"), "shared": None, "how": "Calvin sets them side by side"},
    {"old": ("Zechariah 14:5", "all the holy ones with Him"), "new": ("1 Thessalonians 3:13", "with all His saints"), "shared": None, "how": "Jamieson, Fausset and Brown list it here"},
    {"old": ("1 Samuel 12:23", "ceasing to pray for you"), "new": ("Colossians 1:9", "we have not stopped praying for you"), "shared": None, "how": "This study's pairing"},
    {"old": ("Daniel 6:10", "got down on his knees"), "new": ("Ephesians 3:14", "I bow my knees"), "shared": None, "how": "This study's pairing"},
]

SOURCES = [
    {"id": "bsb", "short": "Berean", "name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened. Public domain."},
    {"id": "bfm", "short": "Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, Articles 2, 4, 5 and 17", "href": "https://bfm.sbc.net/bfm2000/", "note": "Short phrases, with a link. Compared on 2026-10-30 through a web tool that returns extracts. Those not in this site's doctrinal foundation file are not checked by script."},
    {"id": "lbc", "short": "Second London Confession", "name": "Second London Baptist Confession (1677), chapter 22 paragraph 2", "href": "/study/creeds/1689-london-baptist-confession-1677", "note": "One short quotation. Read: chapter 22, in the site's creeds collection."},
    {"id": "boyce", "short": "Boyce", "name": "James P. Boyce, Abstract of Systematic Theology, on effectual calling", "href": "https://www.ccel.org/ccel/boyce/theology.html", "note": "One short quotation. Read: the passage on the sincerity of the outward call only. Public domain."},
    {"id": "traditional", "short": "2012 statement", "name": "A Statement of the Traditional Southern Baptist Understanding of God's Plan of Salvation (2012)", "href": None, "note": "Told in this site's words, not quoted. Not read for this page: the wording follows what the Bearing witness mock-up recorded from a reprint seen through a web tool. A second attempt to reach it failed. Its authors hold the rights. Its full text and its critics were not read."},
    {"id": "calvin-eph", "short": "Calvin", "name": "John Calvin, Commentary on Galatians and Ephesians, on Ephesians 1:17 and 3:20", "href": "https://www.ccel.org/ccel/calvin/calcom41.html", "note": "Short quotations. Read: those comments only. Public domain. Reformed, not Baptist."},
    {"id": "calvin-tim", "short": "Calvin", "name": "John Calvin, Commentary on Timothy, Titus and Philemon, on 1 Timothy 2:2–5", "href": "https://www.ccel.org/ccel/calvin/calcom43.html", "note": "Short quotations. Read: those comments only. Public domain. Reformed, not Baptist."},
    {"id": "calvin-cor", "short": "Calvin", "name": "John Calvin, Commentary on Corinthians, volume 2, on 2 Corinthians 12:8", "href": "https://www.ccel.org/ccel/calvin/calcom40.html", "note": "Short quotations. Read: that comment only. Public domain. Reformed, not Baptist."},
    {"id": "barnes", "short": "Barnes, and Jamieson, Fausset and Brown", "name": "Albert Barnes, Notes on the New Testament, and Jamieson, Fausset and Brown, Commentary Critical and Explanatory, on Ephesians 1:17", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Short quotations. Read: those notes only, and the Jamieson note on 1 Thessalonians 3:13. Public domain. Neither is Baptist. The link is to Jamieson, Fausset and Brown; Barnes is held in the site's library."},
    {"id": "wesley", "short": "Wesley", "name": "John Wesley, Explanatory Notes upon the New Testament, on 1 Timothy 2:4", "href": "https://www.ccel.org/ccel/wesley/notes.html", "note": "One short quotation. Read: that note only. Public domain. Methodist, not Baptist."},
    {"id": "trent", "short": "Council of Trent", "name": "Council of Trent, on the invocation, veneration and relics of saints", "href": "/study/creeds/council-of-trent-canons-and-decrees-1563", "note": "Short quotations, shown as Catholic teaching. Read: that decree's opening, in the site's creeds collection."},
]
