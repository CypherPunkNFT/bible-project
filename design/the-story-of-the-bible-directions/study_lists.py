"""The lists The story of the Bible page draws beside the study's own text. build-data.py checks every phrase here: a
verse phrase against the Berean at its reference, a "study" phrase against content.md word for word, so a mark on the
map cannot say more than the study says. These are this page's reading aids, not a census of every promise."""

# Where each movement sits in the Bible, as the site's fixed section colours. build-data.py checks that the part has at
# least one main reading inside the section's books (first and last book of the section, in canon order).
SECTIONS = {
    "history": ("History", "GEN", "EST"),
    "prophets": ("The Prophets", "ISA", "MAL"),
    "gospels": ("The Gospels", "MAT", "JHN"),
    "acts": ("Acts", "ACT", "ACT"),
    "revelation": ("Revelation", "REV", "REV"),
}
MOVEMENT_SECTION = {"01": "history", "02": "history", "03": "history", "04": "history",
                    "05": "prophets", "06": "gospels", "07": "acts", "08": "revelation"}
# Short names for the eight stations, each a word of the study's own concepts line, in order (checked).
STATION_NAMES = ["Garden", "Promise", "People", "King", "Exile", "Christ", "Nations", "City"]

# The marks a thread can carry. Shape carries the meaning as well as the words.
STATES = {
    "lost": "lost from view",
    "made": "promised",
    "again": "promised again",
    "part": "kept in part",
    "kept": "kept",
    "full": "kept in full",
}

# Six threads under the road. Each mark: the movement it stands in, its state, a Berean reference and words that must be
# in that verse, and "study": words that must be in content.md word for word, which are the study's own warrant for the
# mark. "reading": the study gives this as a reading, not as what the verse says; the page labels it so everywhere.
# The reference's chapter must be one the study itself points to. "ends" names a thread the study follows no further.
# "waits" gives, for a movement with no mark, the study's own words for what is still waiting there (checked).
THREADS = [
    {"id": "nations", "name": "The nations", "gold": True,
     "about": "The study's own thread: God's purpose for all the peoples of the world.",
     "marks": [
         {"at": "01", "state": "lost", "ref": "Genesis 11:9", "phrase": "scattered them over the face of all the earth",
          "study": "The nations are now on the page, and they are far from God."},
         {"at": "02", "state": "made", "ref": "Genesis 12:3", "phrase": "all the families of the earth will be blessed through you",
          "study": "One family is chosen so that every family can be reached."},
         {"at": "03", "state": "again", "ref": "Exodus 19:5", "phrase": "for the whole earth is Mine",
          "study": "showing the world what God is like"},
         {"at": "04", "state": "part", "ref": "Ruth 4:17", "phrase": "the father of David",
          "study": "The nations thread runs right through the darkest times."},
         {"at": "05", "state": "again", "ref": "Isaiah 49:6", "phrase": "a light for the nations, to bring My salvation to the ends of the earth",
          "study": "Salvation is meant for \"the ends of the earth\"."},
         {"at": "06", "state": "part", "ref": "Luke 2:32", "phrase": "a light for revelation to the Gentiles", "reading": True,
          "study": "The New Testament hears Jesus in it."},
         {"at": "07", "state": "part", "ref": "Acts 1:8", "phrase": "to the ends of the earth",
          "study": "The light for the nations is now to be carried by His people."},
         {"at": "08", "state": "full", "ref": "Revelation 22:2", "phrase": "for the healing of the nations",
          "study": "The thread of the nations ends here, in a city with gates that are never shut."},
     ]},
    {"id": "first", "name": "The first promise",
     "about": "The serpent's head crushed. The verse names no person; Christians read it of Christ.",
     "marks": [
         {"at": "01", "state": "made", "ref": "Genesis 3:15", "phrase": "He will crush your head", "reading": True,
          "study": "Read in the light of the whole story, Christians take it as a promise"},
         {"at": "06", "state": "kept", "ref": "Galatians 4:4", "phrase": "born of a woman", "reading": True,
          "study": "the serpent's head crushed"},
         {"at": "07", "state": "part", "ref": "Romans 16:20", "phrase": "will soon crush Satan under your feet",
          "study": "God will soon crush Satan under their feet"},
         {"at": "08", "state": "full", "ref": "Revelation 22:3", "phrase": "No longer will there be any curse",
          "study": "the curse is no more"},
     ]},
    {"id": "land", "name": "A land", "ends": "05",
     "about": "The land promised to Abraham. The study follows it as far as the return from exile.",
     "marks": [
         {"at": "02", "state": "made", "ref": "Genesis 12:1", "phrase": "go to the land I will show you",
          "study": "still waiting for the land"},
         {"at": "04", "state": "kept", "ref": "Joshua 21:45", "phrase": "everything was fulfilled",
          "study": "God kept faith, and that Israel did not finish what He gave them to do"},
         {"at": "05", "state": "part", "ref": "2 Chronicles 36:23", "phrase": "may he go up",
          "study": "The people are home, but under foreign rulers"},
     ]},
    {"id": "dwelling", "name": "God among His people",
     "about": "The God of the garden near again: the tent, the Word made flesh, the city.",
     "marks": [
         {"at": "01", "state": "lost", "ref": "Genesis 3:24", "phrase": "to guard the way to the tree of life",
          "study": "its way back guarded"},
         {"at": "03", "state": "made", "ref": "Exodus 25:8", "phrase": "so that I may dwell among them",
          "study": "The God of the garden is near again, though now behind curtains and sacrifices."},
         {"at": "06", "state": "kept", "ref": "John 1:14", "phrase": "made His dwelling among us", "reading": True,
          "study": "now lives among people as one of them"},
         {"at": "08", "state": "full", "ref": "Revelation 21:3", "phrase": "the dwelling place of God is with man",
          "study": "with no curtain left"},
     ]},
    {"id": "king", "name": "A king from David's line", "waits": {"05": "with no son of David on the throne"},
     "about": "A throne promised forever, and the question it leaves over every king that follows.",
     "marks": [
         {"at": "04", "state": "made", "ref": "2 Samuel 7:16", "phrase": "your throne will be established forever",
          "study": "which son of David will finally keep it?"},
         {"at": "06", "state": "kept", "ref": "Matthew 1:1", "phrase": "the son of David",
          "study": "The New Testament answers that the son is Jesus"},
     ]},
    {"id": "people", "name": "“They will be My people”",
     "about": "The covenant promise, from Sinai to Jeremiah to the city.",
     "marks": [
         {"at": "03", "state": "made", "ref": "Exodus 19:5", "phrase": "you will be My treasured possession",
          "study": "Rescue comes first"},
         {"at": "05", "state": "again", "ref": "Jeremiah 31:33", "phrase": "I will be their God, and they will be My people",
          "study": "the new covenant promises a change inside"},
         {"at": "06", "state": "part", "ref": "Luke 22:20", "phrase": "the new covenant in My blood",
          "study": "Jesus spoke of \"the new covenant\" in His blood"},
         {"at": "08", "state": "full", "ref": "Revelation 21:3", "phrase": "They will be His people",
          "study": "now kept in full"},
     ]},
]

# Two maps of the same country: the study names the four-part summary in its selection paragraph (checked there). How
# its four parts fall across the eight movements is this page's alignment, and the page says so.
FOUR_PART = [("creation", ["01"]), ("fall", ["01"]), ("redemption", ["02", "03", "04", "05", "06", "07"]), ("new creation", ["08"])]

# The study's three questions. Each must be in the frame and the Way paragraph, word for word as given here.
QUESTIONS = {
    "frame": ["Where am I in the story?", "What has God promised by this point?", "What is still waiting to happen?"],
    "way": ["Ask where you are in the story.", "Ask what God has promised by that point.", "Ask what is still waiting."],
}

# Studies the text names in italics. One with a mock-up folder on this PC links to it (build-data.py checks the folder's
# index.html exists); the rest are named only. Grief and dying is being designed beside this one in the same run, and
# The Ten Commandments has no mock-up yet; the run's last step adds their links.
STUDY_LINKS = {
    "Humanity, sin and renewal": "/mockups/humanity-sin-and-renewal-directions/",
    "Genesis 1–11: the questions readers bring": "/mockups/creation-to-babel-directions/",
    "Covenants and promises": "/mockups/covenants-and-promises-directions/",
    "The Ten Commandments": None,
    "Christ in the Old Testament": "/mockups/christ-in-the-old-testament-directions/",
    "Rulers and their choices": "/mockups/rulers-and-their-choices-directions/",
    "Prophets in their times": "/mockups/prophets-in-their-times-directions/",
    "Reading Daniel and Revelation": "/mockups/reading-daniel-and-revelation-directions/",
    "Who do you say that I am? Who Jesus really is": "/mockups/who-do-you-say-that-i-am-directions/",
    "The kingdom he announced": "/mockups/the-kingdom-he-announced-directions/",
    "The cross, the empty tomb and the throne: what Jesus' death and rising did": "/mockups/what-the-cross-accomplishes-directions/",
    "Saved by grace: how God forgives and changes us": "/mockups/grace-faith-and-salvation-directions/",
    "The church and its calling": "/mockups/the-church-and-its-calling-directions/",
    "Witness and the nations: telling others about Jesus": "/mockups/bearing-witness-directions/",
    "The Holy Spirit": "/mockups/the-holy-spirit-directions/",
    "The hope to come": "/mockups/the-hope-to-come-directions/",
    "The good news: how a person is made right with God": "/mockups/the-good-news-directions/",
    "Grief and dying": None,
}
# Book titles the text sets in italics. They are named, not linked.
BOOK_TITLES = {"The Drama of Scripture", "Against Heresies", "Kingdom through Covenant"}

# Quoted words from the Baptist Faith and Message 2000, each with its article. build-data.py checks each one, word for
# word, inside that article of the confession text held on this PC (see CONFESSION_FILE).
CONFESSION_FILE = "content/questions/sources/extracted/baptist-know-the-truth-catechism.json"
CONFESSION_TITLE = "The 2000 Baptist Faith and Message"
CONFESSION_QUOTES = {
    "possesses full dignity and is worthy of respect and Christian love": "III",
    "endeavor to make disciples of all nations": "XI",
    "There is no salvation apart from personal faith in Jesus Christ as Lord": "IV",
}
# Scripture quoted outside the passages the paragraph cites, each tied to the one verse that holds it.
SCRIPTURE_ELSEWHERE = {"no king in Israel": "Judges 21:25"}
# Quotations the study gives with a word left out, each with its own reference and what the Berean has. The build still
# requires every word, in order, in that reference; the README lists them so the editor can restore the missing words.
LOOSE_QUOTES = {
    "in His image": ("Genesis 1:26–27", "the Berean has \"in His own image\" (Genesis 1:27)"),
}
# Words the study uses as its own terms, in quotation marks, that are not quotations of anything.
OWN_TERMS = {
    "The fall": "the church's short name, which the study explains",
    "Sin": "a word the study defines",
    "first gospel": "a name for Genesis 3:15, which the study explains",
    "covenant": "a word the study defines",
    "going out": "the meaning of the name Exodus",
    "Torah": "a Hebrew word the study defines",
    "judge": "a word the study defines",
    "witness": "a word the study defines",
    "obey Me and I will save you": "what the hook says God does not say; not a quotation",
    "what is right in your own eyes": "the study's own question, turning Judges 21:25 (\"what was right in his own eyes\") to the reader",
}

# The labels the page gives the study's marked notes, and words each note's text must hold for its label to stay true.
NOTE_LABELS = {"read": "This study reads", "open": "Where Baptists differ", "other": "In Jewish tradition", "care": "With care"}
NOTE_MUST_SAY = {"open": "Baptists", "other": "Jewish"}

SOURCES = [
    ["Berean Standard Bible.", "Every verse quoted and every verse that opens, from the site's copy of the text. Public domain."],
    ["The Baptist Faith and Message 2000.", "Articles III, IV, X and XI are named; the three phrases quoted were checked by script against the text held on this PC. Article X is summarised by the study, not quoted."],
    ["Named in the study, not read for this page.", "Craig Bartholomew and Michael Goheen, The Drama of Scripture; Irenaeus of Lyon, Against Heresies; the Targums on Genesis 3:15; the Mishnah, Pesachim 10:5; the Amidah; the Apostles' Creed; the Second London Baptist Confession, chapter 7; Peter Gentry and Stephen Wellum, Kingdom through Covenant. Where the study marks one for checking, the note is listed below."],
]
