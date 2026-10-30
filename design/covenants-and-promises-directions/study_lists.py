"""The study's hand-kept lists for build-data.py: the later-Scripture lines, the named exceptions, the facts the page
states, and the sources. Change them here and rerun build-data.py; it tests every one."""

# Phrases from the Baptist Faith and Message. Those in DOCTRINAL-FOUNDATION.md are checked there; the rest were consulted at
# bfm.sbc.net on 2026-10-30 through a tool that returns extracts, are not held, and are reported as unchecked.
QUOTED_CONFESSION = {
    "All Scripture is a testimony to Christ", "all of the redeemed of all the ages", "symbolic act of obedience",
    "the immersion of a believer in water", "There is no salvation apart from personal faith in Jesus Christ as Lord",
}
# Later Scripture: (covenant, origin, later verse, kind, word that proves the kind).
# quoted = quotation marks in the Berean and a shared run of three words with a content word, inside the marks.
# names = the verse itself uses the word given. recalls = the verse names the person or takes up the words given.
LINES = [
    ("noah", "Genesis 9:11", "Isaiah 54:9", "names", "swore"), ("noah", "Genesis 9:11", "Hebrews 11:7", "recalls", "Noah"),
    ("noah", "Genesis 9:11", "1 Peter 3:20", "recalls", "Noah"), ("noah", "Genesis 9:11", "2 Peter 2:5", "recalls", "Noah"),
    ("abraham", "Genesis 17:7", "Exodus 2:24", "names", "covenant"), ("abraham", "Genesis 17:7", "Psalm 105:9", "names", "covenant"),
    ("abraham", "Genesis 12:3", "Luke 1:55", "names", "promised"), ("abraham", "Genesis 17:7", "Luke 1:72", "names", "covenant"),
    ("abraham", "Genesis 12:3", "Acts 3:25", "quoted", ""), ("abraham", "Genesis 15:6", "Romans 4:3", "quoted", ""),
    ("abraham", "Genesis 12:7", "Romans 4:13", "names", "promise"), ("abraham", "Genesis 15:6", "Galatians 3:6", "quoted", ""),
    ("abraham", "Genesis 12:3", "Galatians 3:8", "quoted", ""), ("abraham", "Genesis 17:7", "Galatians 3:16", "names", "promises"),
    ("abraham", "Genesis 17:7", "Galatians 3:29", "names", "promise"), ("abraham", "Genesis 15:6", "James 2:23", "quoted", ""),
    ("abraham", "Genesis 12:3", "Matthew 1:1", "recalls", "Abraham"),
    ("sinai", "Exodus 24:8", "Deuteronomy 5:2", "names", "covenant"), ("sinai", "Exodus 24:8", "2 Kings 23:3", "names", "covenant"),
    ("sinai", "Exodus 24:8", "Jeremiah 11:10", "names", "covenant"), ("sinai", "Exodus 24:8", "Jeremiah 31:32", "names", "covenant"),
    ("sinai", "Exodus 24:8", "Matthew 26:28", "names", "covenant"), ("sinai", "Exodus 24:8", "2 Corinthians 3:14", "names", "covenant"),
    ("sinai", "Exodus 24:8", "Hebrews 9:20", "quoted", ""), ("sinai", "Exodus 19:6", "1 Peter 2:9", "recalls", "a holy nation"),
    ("sinai", "Exodus 19:6", "Revelation 1:6", "recalls", "priests"),
    ("david", "2 Samuel 7:14", "1 Chronicles 17:13", "recalls", "I will be his Father"), ("david", "2 Samuel 7:16", "Psalm 89:3", "names", "covenant"),
    ("david", "2 Samuel 7:16", "Psalm 89:39", "names", "covenant"), ("david", "2 Samuel 7:16", "Psalm 132:11", "names", "swore"),
    ("david", "2 Samuel 7:16", "Isaiah 9:7", "recalls", "throne of David"), ("david", "2 Samuel 7:16", "Isaiah 55:3", "names", "covenant"),
    ("david", "2 Samuel 7:16", "Jeremiah 33:21", "names", "covenant"), ("david", "2 Samuel 7:16", "Matthew 1:1", "recalls", "David"),
    ("david", "2 Samuel 7:16", "Luke 1:32", "recalls", "throne of His father David"), ("david", "2 Samuel 7:16", "Acts 2:30", "names", "promised"),
    ("david", "2 Samuel 7:16", "Acts 13:34", "names", "promised"), ("david", "2 Samuel 7:16", "Romans 1:3", "recalls", "David"),
    ("david", "2 Samuel 7:14", "Hebrews 1:5", "quoted", ""), ("david", "2 Samuel 7:16", "Revelation 22:16", "recalls", "David"),
    ("new", "Jeremiah 31:31", "Luke 22:20", "names", "new covenant"), ("new", "Jeremiah 31:31", "1 Corinthians 11:25", "names", "new covenant"),
    ("new", "Jeremiah 31:31", "2 Corinthians 3:6", "names", "new covenant"), ("new", "Jeremiah 31:31", "Hebrews 8:8", "quoted", ""),
    ("new", "Jeremiah 31:31", "Hebrews 9:15", "names", "new covenant"), ("new", "Jeremiah 31:33", "Hebrews 10:16", "quoted", ""),
    ("new", "Jeremiah 31:34", "Hebrews 10:17", "quoted", ""), ("new", "Jeremiah 31:31", "Hebrews 12:24", "names", "new covenant"),
]
# Quotations whose Berean wording differs too far for a shared run of three words. The page says so; they still need the marks.
LOOSE = {"Hebrews 10:17"}
COVENANT_NAMES = {"noah": "Noah", "abraham": "Abraham", "sinai": "Sinai", "david": "David", "new": "The new covenant"}
STOP_WORDS = {"the", "a", "an", "and", "of", "to", "in", "on", "not", "do", "is", "be", "you", "i", "will", "my", "me",
              "at", "for", "it", "they", "their", "what", "who", "that", "with", "if", "up", "this", "he", "his", "him", "as"}
# Verses in the walked letters with quotation marks that the page does not draw as a line. The page names each.
LETTER_QUOTES_NOT_DRAWN = {
    "Galatians 3:10": "quotes Deuteronomy, on the curse", "Galatians 3:11": "quotes Habakkuk", "Galatians 3:12": "quotes Leviticus",
    "Galatians 3:13": "quotes Deuteronomy, on the tree", "Romans 11:19": "is an objector Paul imagines, not Scripture",
    "Romans 11:26": "quotes Isaiah, with the next verse", "Romans 11:27": "ends that quotation of Isaiah",
    "Hebrews 8:5": "quotes Exodus on the tabernacle's pattern", "Hebrews 8:11": "continues the quotation of Jeremiah drawn from Hebrews 8:8",
    "Hebrews 8:12": "ends that same quotation",
}
LETTER_BOOKS = {"GAL", "2CO", "ROM", "HEB"}
# Facts the page states, tested: (what the page says, reference, word or phrase, should it be there).
FACTS = [
    ("Genesis 12's promises do not use the word", "Genesis 12:1–7", "covenant", False),
    ("the word comes on the day of the split animals", "Genesis 15:18", "covenant", True),
    ("2 Samuel 7 names no sign", "2 Samuel 7:1–29", "sign", False),
    ("Hebrews stops before the discipline", "Hebrews 1:5", "wrong", False),
    ("1 Chronicles stops before the discipline", "1 Chronicles 17:13", "wrong", False),
    ("2 Samuel has the discipline", "2 Samuel 7:14", "wrong", True),
    ("Jeremiah's new covenant names no sign", "Jeremiah 31:31–34", "sign", False),
]
PUBLIC_DOMAIN = "Public domain."
SOURCES = [
    {"id": "bsb", "name": "The Holy Bible, Berean Standard Bible", "note": "Every verse quoted and opened on this page. Public domain, dedicated 2023. Courtesy credit: Berean Standard Bible, berean.bible. Read here from the site's own data/plain/bsb.", "href": "https://berean.bible"},
    {"id": "calvin-gen", "name": "John Calvin, Commentaries on Genesis, vol. 1, trans. John King", "note": f"Read directly: his comment on Genesis 15:17 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom01.html"},
    {"id": "calvin-jer", "name": "John Calvin, Commentaries on Jeremiah, trans. John Owen", "note": f"Read directly: parts of his comments on Jeremiah 31:31–32 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom20.html"},
    {"id": "calvin-rom", "name": "John Calvin, Commentary on Romans, trans. John Owen", "note": f"Read directly: his comment on Romans 11:26 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom38.html"},
    {"id": "calvin-gal", "name": "John Calvin, Commentary on Galatians and Ephesians, trans. William Pringle", "note": f"Read directly: his comment on Galatians 3:16 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom41.html"},
    {"id": "calvin-heb", "name": "John Calvin, Commentary on Hebrews, trans. John Owen", "note": f"Read directly: part of his comment on Hebrews 1:5 only. Reformed, not Baptist. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/calvin/calcom44.html"},
    {"id": "maclaren-gen", "name": "Alexander Maclaren, Expositions of Holy Scripture, on Genesis 15", "note": f"Read directly: one paragraph on the smoking furnace only. A Baptist preacher. {PUBLIC_DOMAIN}", "href": "https://ccel.org/ccel/maclaren"},
    {"id": "london", "name": "The Second London Baptist Confession (1677/1689), chapter 7 paragraph 3", "note": f"Read directly from the site's creeds collection: this paragraph, with chapter 29. A Baptist confession. {PUBLIC_DOMAIN} It is not the Southern Baptist confession.", "href": "/study/creeds/1689-london-baptist-confession-1677"},
    {"id": "westminster", "name": "The Westminster Confession of Faith (1647), chapters 7 and 28", "note": f"Read directly from the site's creeds collection: 7.5, 7.6 and 28.4 with its proof-texts. Presbyterian, not Baptist. {PUBLIC_DOMAIN}", "href": "/study/creeds/westminster-confession-of-faith-1647"},
    {"id": "scheiderer", "name": "Daniel Scheiderer, “Progressive Covenantalism and the ‘1689’”, Baptist Dogmatics, 2023", "note": "Read directly, whole article; it is a critic's account of progressive covenantalism. Copyright retained, so it is told in this site's words and not quoted.", "href": "https://www.baptistdogmatics.com/articles/progressive-covenantalism-and-the-1689"},
    {"id": "semrad", "name": "Rexford Semrad, “Covenant Theology, the 2LBC & CBTS”, 2020", "note": "Read directly: most of the article. Copyright retained, so it is told in this site's words and not quoted.", "href": "https://content.cbtseminary.org/covenant-theology-the-2lbc-cbts/"},
    {"id": "criswell", "name": "W. A. Criswell, sermons “The Shining Saints of God” (1972), “Paul to the Church at Rome” (1992) and “The Final Day of Judgment” (1978)", "note": "Read directly: only the passages on Romans 11 and the dispensations, not the whole sermons. Rights are restricted, so he is told in this site's words and not quoted.", "href": "https://wacriswell.com/sermons/1972/the-shining-saints-of-god/"},
    {"id": "wellum", "name": "Stephen Wellum, “What is Progressive Covenantalism? Part 1”, Christ Over All, 2023", "note": "Consulted through a tool that returned a summary, not read in full, so check it against the original. Told in this site's words and not quoted.", "href": "https://christoverall.com/article/longform/what-is-progressive-covenantalism-part-1/"},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 1, 4, 6 and 7", "note": "Consulted at bfm.sbc.net on 2026-10-30 through a tool that returned extracts, and in the site's doctrinal foundation file: these articles only. Copyright Southern Baptist Convention, so short phrases only, with a link. A witness to what Baptists hold; Scripture remains the authority.", "href": "https://bfm.sbc.net/bfm2000/"},
]
