"""The study's hand-kept lists for build-data.py: promise-to-call rows, first-pages-to-last-pages rows, the order-of-events
maps, the facts the page states, and the sources. Change them here and rerun build-data.py; it tests every one."""

# Phrases from the Baptist Faith and Message. Those in DOCTRINAL-FOUNDATION.md are checked there; the rest were consulted at
# bfm.sbc.net on 2026-10-30 through a tool that returns extracts, are not held, and are reported as unchecked.
QUOTED_CONFESSION = {
    "will return personally and visibly in glory to the earth", "Christ will judge all men in righteousness",
    "The unrighteous will be consigned to Hell, the place of everlasting punishment", "in His own time and in His own way",
    "the dead will be raised", "There is no salvation apart from personal faith in Jesus Christ as Lord",
}
# The words a call may be joined to its promise by. Each must be in the call's verse, as written.
LINK_WORDS = {"Therefore", "therefore", "So then", "Since", "For this reason", "because", "as we await", "this hope", "all the more as", "if we hope"}
# Promise and call: (promise verse, phrase in it, call verse, phrase in it, the word that joins them).
# Chosen because they show the pattern, so they cannot prove it is everywhere. The page says so and names passages without it.
THEREFORE = [
    ("Matthew 24:44", "the Son of Man will come at an hour you do not expect", "Matthew 24:44", "you also must be ready", "For this reason"),
    ("Matthew 25:13", "you do not know the day or the hour", "Matthew 25:13", "keep watch", "Therefore"),
    ("Romans 8:23", "the redemption of our bodies", "Romans 8:25", "we wait for it patiently", "if we hope"),
    ("1 Corinthians 15:57", "gives us the victory through our Lord Jesus Christ", "1 Corinthians 15:58", "Always excel in the work of the Lord", "Therefore"),
    ("2 Corinthians 5:10", "we must all appear before the judgment seat of Christ", "2 Corinthians 5:11", "we try to persuade men", "Therefore"),
    ("Philippians 3:21", "will transform our lowly bodies", "Philippians 4:1", "stand firm in the Lord", "Therefore"),
    ("Colossians 3:4", "you also will appear with Him in glory", "Colossians 3:5", "Put to death", "therefore"),
    ("1 Thessalonians 4:17", "we will always be with the Lord", "1 Thessalonians 4:18", "encourage one another with these words", "Therefore"),
    ("1 Thessalonians 5:10", "we may live together with Him", "1 Thessalonians 5:11", "encourage and build one another up", "Therefore"),
    ("Titus 2:13", "the blessed hope and glorious appearance", "Titus 2:12–13", "live sensible, upright, and godly lives", "as we await"),
    ("Hebrews 10:25", "the Day approaching", "Hebrews 10:25", "let us encourage one another", "all the more as"),
    ("James 5:8", "the Lord's coming is near", "James 5:8", "be patient and strengthen your hearts", "because"),
    ("1 Peter 1:13", "the grace to be given you at the revelation of Jesus Christ", "1 Peter 1:13", "prepare your minds for action", "Therefore"),
    ("1 Peter 4:7", "The end of all things is near", "1 Peter 4:7", "be clear-minded and sober", "Therefore"),
    ("2 Peter 3:10", "the earth and its works will be laid bare", "2 Peter 3:11", "what kind of people ought you to be", "Since"),
    ("2 Peter 3:13", "a new heaven and a new earth, where righteousness dwells", "2 Peter 3:14", "make every effort to be found at peace", "Therefore"),
    ("1 John 3:2", "we will be like Him", "1 John 3:3", "purifies himself", "this hope"),
]
# Passages in or near the readings where no call follows in the passage itself. The page names them. Each is tested to lack "therefore".
NO_CALL = {"Revelation 20:11–15": "the great white throne gives no command", "Matthew 25:31–46": "the sheep and goats is its own warning, and gives none"}
# First pages to last pages: (name, start verse, phrase, middle verses as [(verse, phrase)], Revelation verse, phrase, kind, shared word).
# shares = the English word given is in both the start and the Revelation phrase. echo = this study's matching and nothing more.
# Compared in the Berean's English only. Revelation uses no quotation formula, and no check was made in Hebrew or Greek.
BOOKENDS = [
    ("The deceiver", "Genesis 3:13", "The serpent deceived me", [], "Revelation 20:2", "that ancient serpent", "shares", "serpent"),
    ("The sky", "Genesis 1:1", "created the heavens and the earth", [("Isaiah 65:17", "new heavens and a new earth")], "Revelation 21:1", "a new heaven and a new earth", "shares", "earth"),
    ("The light", "Genesis 1:16", "the greater light to rule the day", [("Isaiah 60:19", "the LORD will be your everlasting light")], "Revelation 21:23", "has no need of sun or moon", "echo", ""),
    ("The river", "Genesis 2:10", "a river flowed out of Eden", [("Ezekiel 47:1", "water flowing from under the threshold"), ("Zechariah 14:8", "living water will flow out from Jerusalem")], "Revelation 22:1", "a river of the water of life", "shares", "river"),
    ("The tree", "Genesis 3:24", "guard the way to the tree of life", [("Ezekiel 47:12", "their leaves for healing")], "Revelation 22:2", "a tree of life", "shares", "tree of life"),
    ("The curse", "Genesis 3:17", "cursed is the ground because of you", [], "Revelation 22:3", "No longer will there be any curse", "echo", ""),
    ("Death", "Genesis 2:17", "you will surely die", [("Isaiah 25:8", "He will swallow up death forever")], "Revelation 21:4", "no more death", "echo", ""),
    ("Pain and tears", "Genesis 3:16", "in pain you will bring forth children", [("Isaiah 25:8", "wipe away the tears from every face")], "Revelation 21:4", "He will wipe away every tear", "shares", "pain"),
    ("The presence", "Genesis 3:8", "they hid themselves from the presence of the LORD God", [("Ezekiel 37:27", "My dwelling place will be with them")], "Revelation 21:3", "the dwelling place of God is with man", "echo", ""),
    ("The way in", "Genesis 3:24", "He drove out the man", [("Isaiah 60:11", "Your gates will always stand open")], "Revelation 21:25", "Its gates will never be shut", "echo", ""),
    ("The face", "Exodus 33:20", "You cannot see My face", [], "Revelation 22:4", "They will see His face", "shares", "face"),
]
# Order of events. One step of kind "return" in each. "reign" marks where the thousand years sit. Order only, never length.
MAPS = [
    {"name": "Taken up first, then the thousand years", "reads": "A literal reign of a thousand years on earth, after the return.",
     "steps": [("Believers taken up", ""), ("The tribulation", ""), ("Christ returns with His saints", "return"), ("A thousand years on earth", "reign"), ("The last judgment", ""), ("New heaven and earth", "")]},
    {"name": "One coming, then the thousand years", "reads": "A reign on earth after the return, which is one event with the taking up.",
     "steps": [("The tribulation", ""), ("Christ returns, and the saints rise to meet Him", "return"), ("A thousand years on earth", "reign"), ("The last judgment", ""), ("New heaven and earth", "")]},
    {"name": "The thousand years are now", "reads": "Not a future age: the reign that began with Christ's first coming and resurrection.",
     "steps": [("Christ's first coming and resurrection", ""), ("The gospel age, read as the thousand years", "reign"), ("Christ returns", "return"), ("Resurrection and judgment", ""), ("New heaven and earth", "")]},
    {"name": "A golden age, then the return", "reads": "A long age of peace on earth as the gospel spreads, before the return.",
     "steps": [("The gospel spreads through the world", ""), ("A long age of peace, read as the thousand years", "reign"), ("Christ returns", "return"), ("Resurrection and judgment", ""), ("New heaven and earth", "")]},
]
# Verses the page itself links to outside content.md, so the sheet can open them.
PAGE_REFERENCES = ["Revelation 12:9", "Revelation 20:2", "1 Corinthians 15:45"]
# Facts the page states, tested: (what the page says, reference, word or phrase, should it be there).
FACTS = [
    ("Revelation 20's throne scene gives no therefore", "Revelation 20:11–15", "therefore", False),
    ("The sheep and goats gives no therefore", "Matthew 25:31–46", "therefore", False),
    ("Paul speaks of a body in the raising", "1 Corinthians 15:44", "spiritual body", True),
    ("John saw no temple", "Revelation 21:22", "no temple", True),
    ("Revelation names the ancient serpent in chapter 12", "Revelation 12:9", "ancient serpent", True),
    ("Revelation names the ancient serpent in chapter 20", "Revelation 20:2", "ancient serpent", True),
    ("Paul calls Christ the last Adam", "1 Corinthians 15:45", "last adam", True),
]
PUBLIC_DOMAIN = "Public domain."
SOURCES = [
    {"id": "bsb", "name": "The Holy Bible, Berean Standard Bible", "note": "Every verse quoted and opened on this page. Public domain, dedicated 2023. Courtesy credit: Berean Standard Bible, berean.bible. Read here from the site's own data/plain/bsb.", "href": "https://berean.bible"},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 4 and 10", "note": "Consulted at bfm.sbc.net on 2026-10-30 through a tool that returned extracts, and in the site's doctrinal foundation file: these phrases only. Copyright Southern Baptist Convention, so short phrases only, with a link. A witness to what Baptists hold; Scripture remains the authority.", "href": "https://bfm.sbc.net/bfm2000/"},
    {"id": "abstract", "name": "The Abstract of Principles (1858), article 20", "note": f"Read directly from the site's creeds collection: this article only. A Baptist confession, not the Baptist Faith and Message. {PUBLIC_DOMAIN}", "href": "/study/creeds/abstract-of-principles-1858"},
    {"id": "boyce", "name": "James P. Boyce, Abstract of Systematic Theology (1887), chapters 40 and 42", "note": f"Read directly: chapter 40 on Revelation 20 and part of chapter 42 on the final states. First president of the Southern Baptist Theological Seminary. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/boyce/theology.html"},
    {"id": "calvin-peter", "name": "John Calvin, Commentary on 2 Peter, trans. John Owen", "note": f"Read directly: part of his comment on 2 Peter 3:9 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom45.html"},
    {"id": "criswell", "name": "W. A. Criswell, sermons “The Glory of the Premillennial Faith” (1987) and “Understanding Prophecy”, with shorter passages from “Watchman, What of the Night?”", "note": "Read directly: the opening of the first, one passage of the second, one of the third. Not the whole sermons. Rights are restricted, so he is told in this site's words and not quoted.", "href": "https://wacriswell.com/sermons/1987/the-glory-of-the-premillennial-faith/"},
    {"id": "piper", "name": "John Piper, “Definitions and Observations Concerning the Second Coming of Christ” (1987), Desiring God", "note": "Read directly: the definitions and his first two arguments; one further passage from “How to Live Wisely in the End Times”. Rights kept by the publisher, so he is told in this site's words and not quoted.", "href": "https://www.desiringgod.org/articles/definitions-and-observations-concerning-the-second-coming-of-christ"},
    {"id": "akin", "name": "Daniel L. Akin, “The Millennial Kingdom of Jesus Christ”, sermon manuscript on Revelation 20:1–10, with a table of views", "note": "Read directly: the table and the first section of the manuscript. He holds a return before the thousand years, so his account of the others is a critic's. Rights kept by the author, so he is told in this site's words and not quoted.", "href": "https://www.danielakin.com/wp-content/uploads/2016/03/Revelation-20.1-10-The-Millennial-Kingdom-of-Jesus-Christ-manuscript-mjh.pdf"},
    {"id": "waldron", "name": "Sam Waldron, “Questions Asked at an Eschatology Conference: Part 3”, 2026", "note": "Consulted through a tool that returned a summary, one article of a series, not read in full, so check it against the original. Told in this site's words and not quoted.", "href": "https://content.cbtseminary.org/questions-asked-at-an-eschatology-conference-part-3-sam-waldron/"},
    {"id": "pinnock", "name": "Clark H. Pinnock, “The Destruction of the Finally Impenitent”, first published in Criswell Theological Review 4.2 (1990)", "note": "Read through two passages of a reprint, not the whole article. Not the view of this site or of the Baptist Faith and Message. Rights kept, so he is told in this site's words and not quoted.", "href": "https://www.onthewing.org/user/Esc_Annihilationism%20-%20Pinnock.pdf"},
]
