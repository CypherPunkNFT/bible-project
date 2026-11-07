"""The lists the Witness and the nations page draws beside the study's own text. build-data.py checks every Berean phrase
here against its verse, and every sentence taken from the study against content.md, so a figure cannot claim words its
source does not hold. Which place a phrase is put in is this page's judgment, and the page says so.

"words" is always the Berean's own wording at "ref". "study" is always the study's own wording, word for word."""

TITLE = ("Witness and the nations", "telling others about Jesus")  # ink, then the turn in gold italic; joined by ": "

# 01 The chain of Romans 10:14–15, in Paul's order, which he reads backward from calling to being sent. The build
# derives the four "how can they …" verbs from the verses and requires them to be the first four links, in order.
CHAIN_RANGE = "Romans 10:14–15"
CHAIN = [
    {"id": "call", "word": "Call", "words": "How then can they call on the One", "ref": "Romans 10:14",
     "whose": "hears", "study": "What belongs to the one who hears? To believe and call on the name of the Lord."},
    {"id": "believe", "word": "Believe", "words": "in whom they have not believed", "ref": "Romans 10:14",
     "whose": "hears", "study": "What belongs to the one who hears? To believe and call on the name of the Lord."},
    {"id": "hear", "word": "Hear", "words": "of whom they have not heard", "ref": "Romans 10:14",
     "whose": None, "note": "The study does not put hearing in anyone's part. It says why it matters: faith comes by hearing."},
    {"id": "preach", "word": "Preach", "words": "without someone to preach", "ref": "Romans 10:14",
     "whose": "speaks", "study": "The sent one preaches."},
    {"id": "sent", "word": "Sent", "words": "unless they are sent", "ref": "Romans 10:15",
     "whose": "god", "study": "He has the authority, sends, shines the light and gives the growth.",
     "note": "The verse does not say who sends. The study's close counts sending among what God does, and its "
             "question on missions shows churches sending missionaries."},
]
CHAIN_VERBS = ("call", "believe", "hear", "preach")
CHAIN_END = {"words": "faith comes by hearing, and hearing by the word of Christ", "ref": "Romans 10:17"}

# In part 01, Acts 1:8 "with its map attached": its three places, in the verse's order. Only this verse is drawn as rings.
RINGS = [
    {"label": "Jerusalem", "words": "in Jerusalem"},
    {"label": "Judea and Samaria", "words": "in all Judea and Samaria"},
    {"label": "The ends of the earth", "words": "to the ends of the earth"},
]
RINGS_REF = "Acts 1:8"

# 03 Whose part is whose: the seven passages against the close's three questions. Each (ref, words) is a phrase of that
# passage. "study" is the study's own line for the passage, when it gives one. "other" is a hand that is none of the three.
COLUMNS = [
    ("god", "What does God do?"),
    ("speaks", "What is given to the one who speaks?"),
    ("hears", "What belongs to the one who hears?"),
]
PLACES = [
    {"part": "01",
     "god": [("Matthew 28:18", "All authority in heaven and on earth has been given to Me"), ("Matthew 28:20", "I am with you always")],
     "speaks": [("Matthew 28:19", "go and make disciples of all nations"), ("Matthew 28:19", "baptizing them"), ("Matthew 28:20", "teaching them")],
     "hears": [("Matthew 28:20", "to obey all that I have commanded you")],
     "study": "the authority and the presence are Christ's. The going, baptizing and teaching are given to His people."},
    {"part": "02",
     "god": [("Romans 10:12", "gives richly to all who call on Him")],
     "speaks": [("Romans 10:14", "someone to preach"), ("Romans 10:15", "those who bring good news")],
     "hears": [("Romans 10:9", "confess with your mouth"), ("Romans 10:9", "believe in your heart"), ("Romans 10:13", "calls on the name of the Lord")],
     "study": "God gives richly to all who call. The sent one preaches. The hearer is to believe and call on Him."},
    {"part": "03",
     "god": [("Romans 15:18", "what Christ has accomplished through me"), ("Romans 15:19", "by the power of the Spirit of God")],
     "speaks": [("Romans 15:20", "preach the gospel where Christ was not known")],
     "hears": [("Romans 15:21", "Those who were not told about Him will see"), ("Romans 15:21", "those who have not heard will understand")],
     "study": "Christ does the work; Paul is the one He works through."},
    {"part": "04",
     "god": [("2 Corinthians 4:1", "God in His mercy has given us this ministry"), ("2 Corinthians 4:6", "made His light shine in our hearts"),
             ("2 Corinthians 4:7", "this surpassingly great power is from God")],
     "speaks": [("2 Corinthians 4:2", "renounced secret and shameful ways"), ("2 Corinthians 4:2", "open proclamation of the truth"),
                ("2 Corinthians 4:5", "we do not proclaim ourselves")],
     "hears": [("2 Corinthians 4:2", "every man's conscience")],
     "other": {"label": "Another hand", "ref": "2 Corinthians 4:4", "words": "The god of this age has blinded the minds of unbelievers",
               "study": "An enemy blinds."},
     "study": "God shines the light. An enemy blinds. The messenger tells the truth openly and steps aside."},
    {"part": "05",
     "god": [("1 Corinthians 3:5", "as the Lord has assigned to each his role"), ("1 Corinthians 3:6", "God made it grow")],
     "speaks": [("1 Corinthians 3:6", "I planted the seed"), ("1 Corinthians 3:6", "Apollos watered it")],
     "hears": [("1 Corinthians 3:5", "through whom you believed")],
     "study": "Planting and watering are yours to do. The growth was never yours."},
    {"part": "06",
     "god": [("Philippians 1:19", "the provision of the Spirit of Jesus Christ"), ("Philippians 1:29", "it has been granted to you")],
     "speaks": [("Philippians 1:14", "speak the word without fear"), ("Philippians 1:27", "stand firm in one spirit")],
     "hears": [],
     "study": "God holds the outcome. The believers' part is to stand together and not be frightened."},
    {"part": "07",
     "god": [],
     "speaks": [("Colossians 4:5", "Act wisely toward outsiders"), ("Colossians 4:5", "redeeming the time"),
                ("Colossians 4:6", "Let your speech always be gracious, seasoned with salt")],
     "hears": [],
     "study": None},
]
# The page's own words, shown as its own.
PLACES_READ = ("Each phrase is in its verse; which column it stands in is this page's sort. An empty place means these "
               "verses do not name that part, and the page adds nothing to fill it.")

STUDY_LINKS = {
    "Prayer across Scripture: learning to pray": "prayer-in-the-letters-directions",
    "Faith under pressure": "faith-under-pressure-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "Baptism and the Lord's Supper: the two things Jesus told His church to do": "baptism-and-the-lords-supper-directions",
    "Covenants and promises": "covenants-and-promises-directions",
    "The church and its calling": "the-church-and-its-calling-directions",
    "Saved by grace: how God forgives and changes us": "grace-faith-and-salvation-directions",
    "Christ in the Old Testament": "christ-in-the-old-testament-directions",
    "Genesis 1–11: the questions readers bring": "creation-to-babel-directions",
    "The Holy Spirit": "the-holy-spirit-directions",
    "Angels, demons and spiritual powers": "angels-demons-and-spiritual-powers-directions",
    "Grief and dying": "grief-and-dying-directions",
    "Fear, anxiety and despair": "fear-anxiety-and-despair-directions",
    "Faith in daily life": "faith-in-daily-life-directions",
}
# Every other italic in the text: a word explained where it stands, or a title. Every entry must be used.
ITALIC_TERMS = {"commission", "An Enquiry into the Obligations of Christians to Use Means for the Conversion of the Heathens",
                "Lumen Gentium", "A Wideness in God's Mercy"}

# Quotations of the Baptist Faith and Message 2000, held on this PC: phrase → the article it must be in. A line that
# names an article for a quotation must name this one.
BFM_PATH = "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"
BFM_QUOTES = {
    "the duty and privilege of every follower of Christ and of every church of the Lord Jesus Christ to endeavor to make disciples of all nations": "XI",
    "verbal witness undergirded by a Christian lifestyle": "XI",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "IV",
    "God alone is Lord of the conscience": "XVII",
    "comprehends all the means in connection with the end": "V",
    "as occasion requires": "XIV",
    "voluntary and advisory bodies": "XIV",
}
# Quotations of sources not held on this PC. The page marks each one as not yet compared, and the build counts the marks.
NOT_HELD_QUOTES = {
    "God's eternal choice of some persons unto everlasting life": "the Abstract of Principles (1858)",
    "encourages the use of means in the highest degree": "the New Hampshire Confession (1833)",
}
# Quotations of Scripture that are not word for word the Berean: the study's words → (reference, the Berean's own words).
# The build confirms the study's words are NOT in the verse and the Berean's are; the page marks each one beside it.
SCRIPTURE_MISQUOTES = {
    "to add to the distress of my chains": ("Philippians 1:17", "can add to the distress of my chains"),
}
# Quoted words that are neither Scripture nor a source: a plain word the study explains or a sample sentence. (section, phrase).
OWN_TERMS = {
    ("opening", "good news"): "what the old word gospel means",
    ("07", "made right with God"): "plain words offered in place of a technical term",
    ("07", "justified"): "the technical term itself",
    ("07", "I need to go and read about that"): "a sample sentence",
}

SOURCES = [
    {"id": "bsb", "name": "Berean Standard Bible", "href": "https://berean.bible/",
     "note": "Every verse quoted and opened. Public domain."},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, articles IV, V, XI, XIV and XVII", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Short quotations, each checked by script in its own article of the copy held on this PC. Article VII is named, not quoted."},
    {"id": "abstract", "name": "Abstract of Principles (1858), on election", "href": None,
     "note": "One short quotation. No copy is held on this PC, so the wording has not been compared; the page marks it."},
    {"id": "nh", "name": "New Hampshire Baptist Confession (1833), on election", "href": None,
     "note": "One short quotation. No copy is held on this PC, so the wording has not been compared; the page marks it."},
    {"id": "traditional", "name": "A Statement of the Traditional Southern Baptist Understanding of God's Plan of Salvation (2012)", "href": None,
     "note": "Told in this site's words, not quoted. The study marks its wording to be checked against the original."},
    {"id": "carey", "name": "William Carey, An Enquiry into the Obligations of Christians to Use Means for the Conversion of the Heathens (1792)", "href": None,
     "note": "Named, not quoted."},
    {"id": "lumen", "name": "Second Vatican Council, Lumen Gentium, paragraph 16 (1964)",
     "href": "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_en.html",
     "note": "Described, not quoted, and labelled as another tradition's view."},
    {"id": "pinnock", "name": "Clark Pinnock, A Wideness in God's Mercy (1992)", "href": None,
     "note": "Described, not quoted, and labelled as another view."},
]
