"""The lists behind the Bearing witness mock-up. build-data.py checks every phrase here against its verse, as whole words."""

QUOTED_CONFESSION = {
    "There is no salvation apart from personal faith in Jesus Christ as Lord",
    "God alone is Lord of the conscience",
    "to seek constantly to win the lost to Christ",
    "by verbal witness undergirded by a Christian lifestyle",
    "comprehends all the means in connection with the end",
}

# Section 01. Colossians 4:2-6 as it stands, with phrases that open a door. Marked in text order per verse; the build refuses any other.
PHRASE_MAP = [
    ("Colossians 4:2", "Devote yourselves to prayer", "prayer"),
    ("Colossians 4:3", "a door for the word", "prayer"),
    ("Colossians 4:3", "the mystery of Christ", "ready"),
    ("Colossians 4:3", "for which I am in chains", "courage"),
    ("Colossians 4:4", "declare it clearly", "prayer"),
    ("Colossians 4:5", "Act wisely toward outsiders", "conduct"),
    ("Colossians 4:5", "redeeming the time", "speech"),
    ("Colossians 4:6", "gracious, seasoned with salt", "speech"),
    ("Colossians 4:6", "how to answer everyone", "ready"),
]
READING_ORDER = ["prayer", "courage", "conduct", "speech", "ready", "gentleness"]
# Reading whose chief word is not in Colossians 4:2-6, and the word. The build confirms it is absent.
NOT_IN_PARAGRAPH = {"gentleness": "gentle", "courage": "courage"}

# Section 02. Each phrase has one place. A place may be empty, and the page then says "not named". Flag: "asked" or "hoped".
# (verse, words) or (verse, words, flag).
THRESHOLD = [
    {"id": "colossians", "label": "Colossians 4:2–6", "name": "Colossians 4",
     "speaker": [("Colossians 4:2", "Devote yourselves to prayer"), ("Colossians 4:4", "declare it clearly"), ("Colossians 4:6", "Let your speech always be gracious")],
     "other": [("Colossians 4:5", "outsiders"), ("Colossians 4:6", "answer everyone")],
     "god": [("Colossians 4:3", "God may open to us a door for the word", "asked")]},
    {"id": "peter-hope", "label": "1 Peter 3:15–17", "name": "1 Peter 3",
     "speaker": [("1 Peter 3:15", "sanctify Christ as Lord"), ("1 Peter 3:15", "Always be prepared to give a defense"), ("1 Peter 3:15", "respond with gentleness and respect"), ("1 Peter 3:16", "keeping a clear conscience")],
     "other": [("1 Peter 3:15", "everyone who asks you the reason for the hope"), ("1 Peter 3:16", "those who slander you may be put to shame")],
     "god": [("1 Peter 3:17", "if it is God's will")]},
    {"id": "corinthians-light", "label": "2 Corinthians 4:2–7", "name": "2 Corinthians 4",
     "speaker": [("2 Corinthians 4:2", "renounced secret and shameful ways"), ("2 Corinthians 4:5", "we do not proclaim ourselves"), ("2 Corinthians 4:5", "ourselves as your servants")],
     "other": [("2 Corinthians 4:4", "blinded the minds of unbelievers")],
     "god": [("2 Corinthians 4:6", "made His light shine in our hearts"), ("2 Corinthians 4:7", "this surpassingly great power is from God")]},
    {"id": "timothy", "label": "2 Timothy 2:24–26", "name": "2 Timothy 2",
     "speaker": [("2 Timothy 2:24", "must not be quarrelsome"), ("2 Timothy 2:24", "must be kind to everyone"), ("2 Timothy 2:25", "gently reprove")],
     "other": [("2 Timothy 2:25", "those who oppose him"), ("2 Timothy 2:26", "come to their senses")],
     "god": [("2 Timothy 2:25", "God may grant them repentance", "hoped")]},
    {"id": "peter-honor", "label": "1 Peter 2:11–12", "name": "1 Peter 2",
     "speaker": [("1 Peter 2:11", "abstain from the desires of the flesh"), ("1 Peter 2:12", "Conduct yourselves with such honor")],
     "other": [("1 Peter 2:12", "they slander you as evildoers"), ("1 Peter 2:12", "see your good deeds and glorify God")],
     "god": [("1 Peter 2:12", "the day He visits us")]},
    {"id": "thessalonians", "label": "1 Thessalonians 4:9–12", "name": "1 Thessalonians 4",
     "speaker": [("1 Thessalonians 4:11", "live quietly"), ("1 Thessalonians 4:11", "attend to your own matters"), ("1 Thessalonians 4:11", "work with your own hands")],
     "other": [("1 Thessalonians 4:12", "outsiders")],
     "god": [("1 Thessalonians 4:9", "taught by God to love one another")]},
    {"id": "philippians", "label": "Philippians 1:12–29", "name": "Philippians 1",
     "speaker": [("Philippians 1:14", "speak the word without fear"), ("Philippians 1:27", "stand firm in one spirit")],
     "other": [("Philippians 1:13", "the whole palace guard"), ("Philippians 1:28", "those who oppose you")],
     "god": [("Philippians 1:28", "it is from God"), ("Philippians 1:29", "it has been granted to you")]},
    {"id": "ephesians", "label": "Ephesians 6:18–20", "name": "Ephesians 6",
     "speaker": [("Ephesians 6:18", "stay alert with all perseverance in your prayers"), ("Ephesians 6:19", "boldly make known the mystery of the gospel"), ("Ephesians 6:20", "an ambassador in chains")],
     "other": [],
     "god": [("Ephesians 6:19", "words may be given me", "asked")]},
    {"id": "corinthians-field", "label": "1 Corinthians 3:5–7", "name": "1 Corinthians 3",
     "speaker": [("1 Corinthians 3:6", "I planted the seed"), ("1 Corinthians 3:6", "Apollos watered it")],
     "other": [("1 Corinthians 3:5", "through whom you believed")],
     "god": [("1 Corinthians 3:5", "as the Lord has assigned to each his role"), ("1 Corinthians 3:7", "only God, who makes things grow")]},
    {"id": "lydia", "label": "Acts 16:14", "name": "Acts 16",
     "speaker": [("Acts 16:14", "Paul's message")],
     "other": [("Acts 16:14", "Among those listening"), ("Acts 16:14", "to respond")],
     "god": [("Acts 16:14", "The Lord opened her heart")]},
]

# Section 03. Five doors, in the New Testament's order. `opener` is said in the text's terms and tested by `opener_words`.
DOORS = [
    {"id": "faith", "ref": "Acts 14:27", "words": "He had opened the door of faith to the Gentiles", "head": "Opened to the Gentiles.",
     "opener": "God opened it", "opener_words": "He had opened", "beside_ref": "Acts 14:22", "beside": "We must endure many hardships",
     "note": "A door for those who hear, not for the one who speaks. Paul and Barnabas report it after a journey that included a stoning (Acts 14:19)."},
    {"id": "ephesus", "ref": "1 Corinthians 16:9", "words": "a great door for effective work has opened to me", "head": "Open, and opposed.",
     "opener": "No opener is named", "opener_words": "has opened to me", "beside_ref": "1 Corinthians 16:9", "beside": "even though many oppose me",
     "note": "He stays in Ephesus because of it (1 Corinthians 16:8)."},
    {"id": "troas", "ref": "2 Corinthians 2:12", "words": "a door stood open for me in the Lord", "head": "Open, and he left.",
     "opener": "No opener is named; it stood open in the Lord", "opener_words": "stood open for me in the Lord", "beside_ref": "2 Corinthians 2:13", "beside": "I had no peace in my spirit",
     "note": "He went on to Macedonia. The text does not call that a failure, and it does not explain it further."},
    {"id": "chains", "ref": "Colossians 4:3", "words": "God may open to us a door for the word", "head": "Asked for, in chains.",
     "opener": "Only asked of God", "opener_words": "that God may open", "beside_ref": "Colossians 4:3", "beside": "for which I am in chains",
     "note": "The text does not report an answer here."},
    {"id": "philadelphia", "ref": "Revelation 3:8", "words": "I have placed before you an open door", "head": "Open, with little strength.",
     "opener": "Christ placed it", "opener_words": "I have placed", "beside_ref": "Revelation 3:8", "beside": "you have only a little strength",
     "note": "The verse does not say the door is for witness. Jamieson, Fausset and Brown read it as \"a door of spiritual usefulness\"; only that commentary was read."},
]

# Section 05. Three passages to sort. Marks in verse order. Some are chosen so that a place stays empty.
SORTS = [
    {"id": "light", "label": "Matthew 5:16", "marks": [("let your light shine before men", "speaker"), ("see your good deeds and glorify your Father in heaven", "other")],
     "said": "No act of God is named here. God is the one glorified. Jesus is speaking, so this is not one of the letters, and it fits their pattern."},
    {"id": "jailer", "label": "Acts 16:30–32", "marks": [("what must I do to be saved", "other"), ("Believe in the Lord Jesus", "speaker"), ("spoke the word of the Lord", "speaker")],
     "said": "No act of God is named in these lines. Just before them the doors flew open (Acts 16:26), which the text ties to an earthquake and does not call a door for the word. The answer given is the jailer’s to believe."},
    {"id": "titus", "label": "Titus 2:7–8", "marks": [("show yourself to be an example by doing good works", "speaker"), ("wholesome speech that is above reproach", "speaker"), ("anyone who opposes us will be ashamed", "other")],
     "said": "No act of God is named here at all, and this page does not add one."},
]

SOURCES = [
    {"id": "bsb", "short": "Berean", "name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened. Public domain."},
    {"id": "bfm", "short": "Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, Articles 4, 5, 11 and 17", "href": "https://bfm.sbc.net/bfm2000/", "note": "Short phrases, with a link. Compared on 2026-10-30 through a web tool that returns extracts. Those not in this site's doctrinal foundation file are not checked by script."},
    {"id": "abstract", "short": "Abstract of Principles", "name": "Abstract of Principles (1858), article 5", "href": "/study/creeds/abstract-of-principles-1858", "note": "One short quotation. Read: that article, in the site's creeds collection."},
    {"id": "nh", "short": "New Hampshire Confession", "name": "New Hampshire Baptist Confession (1833), on election", "href": "/study/creeds/new-hampshire-baptist-confession-1833", "note": "One short quotation. Read: that article, in the site's creeds collection."},
    {"id": "traditional", "short": "2012 statement", "name": "A Statement of the Traditional Southern Baptist Understanding of God's Plan of Salvation (2012), Articles 5, 6 and 10", "href": None, "note": "Told in this site's words, not quoted. Seen only in a reprint through a web tool returning extracts. Its authors hold the rights. Its full text and its critics were not read."},
    {"id": "calvin-1pe", "short": "Calvin", "name": "John Calvin, Commentaries on the Catholic Epistles, on 1 Peter 2:12 and 3:15–16", "href": "https://www.ccel.org/ccel/calvin/calcom45.html", "note": "Short quotations. Read: those comments only. Public domain. Reformed, not Baptist."},
    {"id": "calvin-col", "short": "Calvin", "name": "John Calvin, Commentary on Philippians, Colossians and Thessalonians, on Colossians 4:3 and 4:6", "href": "https://www.ccel.org/ccel/calvin/calcom42.html", "note": "Short quotations. Read: those comments only. Public domain."},
    {"id": "calvin-php", "short": "Calvin", "name": "John Calvin, the same volume, on Philippians 1:15–18", "href": "https://www.ccel.org/ccel/calvin/calcom42.html", "note": "Short quotations. Read: those comments only. Public domain."},
    {"id": "calvin-2ti", "short": "Calvin", "name": "John Calvin, Commentary on Timothy, Titus and Philemon, on 2 Timothy 2:25", "href": "https://www.ccel.org/ccel/calvin/calcom43.html", "note": "Short quotations. Read: that comment only. Public domain."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary Critical and Explanatory, on Colossians 4:3 and 4:6, 1 Peter 2:12 and 3:15, and Revelation 3:8", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Short quotations. Read: those notes only. Public domain."},
]
