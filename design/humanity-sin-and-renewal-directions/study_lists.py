"""The lists behind the Humanity, sin and renewal mock-up. build-data.py checks every phrase here against its verse."""

# One body, two uses. Rows in Paul's order (Romans 3:11-18). `word` is the body word in the sin line; `new` is a verse where
# the same body is used well, or None when this study found no matching verse. x and y are this figure's points, not anatomy.
BODY = [
    {"id": "understanding", "part": "Understanding", "x": 100, "y": 20,
     "sin": ("Romans 3:11", "no one who understands"), "word": "understands",
     "from": ("Psalm 14:2", "if any understand"),
     "new": ("Colossians 3:10", "being renewed in knowledge"), "newWord": None},
    {"id": "throat", "part": "Throat", "x": 100, "y": 79,
     "sin": ("Romans 3:13", "Their throats are open graves"), "word": "throats",
     "from": ("Psalm 5:9", "Their throats are open graves"),
     "new": None, "newWord": None},
    {"id": "tongue", "part": "Tongue", "x": 110, "y": 60,
     "sin": ("Romans 3:13", "their tongues practice deceit"), "word": "tongues",
     "from": ("Psalm 5:9", "their tongues practice deceit"),
     "new": ("Philippians 2:11", "every tongue confess that Jesus Christ is Lord"), "newWord": "tongue"},
    {"id": "lips", "part": "Lips", "x": 88, "y": 58,
     "sin": ("Romans 3:13", "The venom of vipers is on their lips"), "word": "lips",
     "from": ("Psalm 140:3", "the venom of vipers is on their lips"),
     "new": ("Hebrews 13:15", "the fruit of lips that confess His name"), "newWord": "lips"},
    {"id": "mouth", "part": "Mouth", "x": 100, "y": 56,
     "sin": ("Romans 3:14", "Their mouths are full of cursing and bitterness"), "word": "mouths",
     "from": ("Psalm 10:7", "His mouth is full of cursing"),
     "new": ("Romans 10:9", "if you confess with your mouth"), "newWord": "mouth"},
    {"id": "feet", "part": "Feet", "x": 130, "y": 400,
     "sin": ("Romans 3:15", "Their feet are swift to shed blood"), "word": "feet",
     "from": ("Isaiah 59:7", "Their feet run to evil"),
     "new": ("Romans 10:15", "How beautiful are the feet of those who bring good news"), "newWord": "feet"},
    {"id": "eyes", "part": "Eyes", "x": 112, "y": 40,
     "sin": ("Romans 3:18", "There is no fear of God before their eyes"), "word": "eyes",
     "from": ("Psalm 36:1", "There is no fear of God before his eyes"),
     "new": ("Hebrews 12:2", "Let us fix our eyes on Jesus"), "newWord": "eyes"},
]
BODY_ANCHOR = ("Romans 6:13", "Do not present the parts of your body to sin as instruments of wickedness",
               "present the parts of your body to Him as instruments of righteousness")

# Paul's own side by side. `step` marks the rows where he says the two sides are not equal; the right side is set one fixed
# step larger there, and the caption says this is not a ratio.
LEAVES = [
    {"ref": "Romans 5:15", "hinge": "not like", "left": "the trespass", "right": "the gift", "step": False},
    {"ref": "Romans 5:15", "hinge": "how much more", "left": "the many died by the trespass of the one man",
     "right": "God's grace and the gift that came by the grace of the one man, Jesus Christ, abound to the many", "step": True},
    {"ref": "Romans 5:16", "hinge": "not like", "left": "The judgment that followed one sin brought condemnation",
     "right": "the gift that followed many trespasses brought justification", "step": False},
    {"ref": "Romans 5:17", "hinge": "how much more", "left": "death reigned through that one man",
     "right": "those who receive an abundance of grace and of the gift of righteousness reign in life", "step": True},
    {"ref": "Romans 5:18", "hinge": "just as", "left": "one trespass brought condemnation for all men",
     "right": "one act of righteousness brought justification and life for all men", "step": False},
    {"ref": "Romans 5:19", "hinge": "just as", "left": "through the disobedience of the one man the many were made sinners",
     "right": "through the obedience of the one man the many will be made righteous", "step": False},
    {"ref": "Romans 5:20", "hinge": "all the more", "left": "where sin increased", "right": "grace increased all the more", "step": True},
    {"ref": "Romans 5:21", "hinge": "just as", "left": "sin reigned in death",
     "right": "grace might reign through righteousness to bring eternal life", "step": False},
]
LEAVES_ALSO = [
    {"ref": "1 Corinthians 15:22", "hinge": "so", "left": "as in Adam all die", "right": "in Christ all will be made alive", "step": False},
    {"ref": "1 Corinthians 15:47", "hinge": "the second", "left": "The first man was of the dust of the earth", "right": "man from heaven", "step": False},
    {"ref": "1 Corinthians 15:49", "hinge": "so also", "left": "we have borne the likeness of the earthly man",
     "right": "shall we bear the likeness of the heavenly man", "step": False},
]

# Genesis 3, in the order spoken. Who is asked, and who is spoken to.
GARDEN = {
    "asked": [("The man", "Genesis 3:9", "Where are you?"), ("The woman", "Genesis 3:13", "What is this you have done?"), ("The serpent", None, None)],
    "spoken": [("The serpent", "Genesis 3:14", "cursed are you"), ("The woman", "Genesis 3:16", "To the woman He said"), ("The man", "Genesis 3:17", "to Adam He said")],
    "then": ("Genesis 3:21", "He clothed them"),
}

# The image thread. `mark` names the one thing that changes in the small drawing, and `markText` says it in words.
IMAGE_STATES = [
    {"id": "made", "title": "Made", "mark": "crown", "markText": "a crown, from Psalm 8:5",
     "line": "Male and female, and crowned.",
     "places": [("Genesis 1:27", "in the image of God He created him"), ("Genesis 5:1", "He made him in His own likeness"),
                ("Psalm 8:5", "You crowned him with glory and honor")]},
    {"id": "handed-on", "title": "Handed on", "mark": "child", "markText": "a child beside the figure",
     "line": "Adam has a son in his own likeness. That is all the verse says about what passed on.",
     "places": [("Genesis 5:3", "he had a son in his own likeness, after his own image")]},
    {"id": "still-there", "title": "Still there", "mark": "plain", "markText": "nothing added",
     "line": "After the flood, and in a letter about cursing, people are still said to bear it.",
     "places": [("Genesis 9:6", "in His own image God has made mankind"), ("James 3:9", "who have been made in God's likeness")]},
    {"id": "exchanged", "title": "Exchanged", "mark": "leaves", "markText": "leaves, the covering people make for themselves",
     "line": "The glory of God traded for images, and falling short of it.",
     "places": [("Romans 1:23", "exchanged the glory of the immortal God for images"), ("Romans 3:23", "fall short of the glory of God")]},
    {"id": "not-yet", "title": "Not yet seen", "mark": "gap", "markText": "an unfinished ring",
     "line": "Psalm 8 promises all things under his feet. Hebrews says we do not see that yet.",
     "places": [("Hebrews 2:8", "at present we do not see everything subject to him")]},
    {"id": "christ", "title": "Seen in Christ", "mark": "light", "markText": "light alone, with no figure at all, because this page draws no likeness of Christ",
     "line": "The Son is the image. Here the small drawing leaves the figure out.",
     "places": [("Hebrews 2:9", "But we see Jesus"), ("Colossians 1:15", "The Son is the image of the invisible God"),
                ("2 Corinthians 4:4", "Christ, who is the image of God"), ("Hebrews 1:3", "the exact representation of His nature")]},
    {"id": "renewed", "title": "Being renewed", "mark": "garment", "markText": "a garment, from put on in Colossians 3:10",
     "line": "Now, and not finished: the verbs are still moving.",
     "places": [("Colossians 3:10", "being renewed in knowledge in the image of its Creator"), ("2 Corinthians 3:18", "being transformed into His image"),
                ("Ephesians 4:24", "created to be like God in true righteousness and holiness")]},
    {"id": "finished", "title": "Finished", "mark": "ring", "markText": "a closed ring of light",
     "line": "Promised, and still ahead of every reader of this page.",
     "places": [("Romans 8:29", "conformed to the image of His Son"), ("1 Corinthians 15:49", "shall we bear the likeness of the heavenly man"),
                ("1 John 3:2", "we will be like Him")]},
]

# Every quoted confession phrase on the page. The Baptist Faith and Message 2000 is not held in full, so what is not in the
# site's foundation file is reported by the build as not checked by script.
QUOTED_CONFESSION = {
    "every person of every race possesses full dignity and is worthy of respect and Christian love",
    "the sanctity of all human life from conception to natural death",
    "The gift of gender is thus part of the goodness of God's creation",
    "There is no salvation apart from personal faith in Jesus Christ as Lord",
    "inherit a nature and an environment inclined toward sin",
    "as soon as they are capable of moral action, they become transgressors and are under condemnation",
    "Only the grace of God can bring man into His holy fellowship",
    "capable of moral action",
    "made in His own image",
}

PAGE_REFERENCES = ["Romans 3:9-26", "Romans 5:12-21", "Romans 3:10", "Ecclesiastes 7:20", "Psalm 14:3"]

SOURCES = [
    {"id": "bsb", "name": "Berean Standard Bible", "short": "Berean", "href": "https://berean.bible/",
     "note": "Every verse quoted or opened, from the site's own copy. Public domain."},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 3, 4 and 15", "short": "Baptist Faith and Message", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "This site's confession. Short phrases, read through a web tool and in the site's doctrinal foundation file. Phrases not in that file were not checked by script."},
    {"id": "boyce", "name": "James P. Boyce, Abstract of Systematic Theology", "short": "James P. Boyce", "href": "https://www.ccel.org/ccel/boyce/theology.html",
     "note": "Read: his chapters on the image of God and on the imputation of Adam's sin, in part. Public domain."},
    {"id": "london", "name": "Second London Baptist Confession (1677), 6.3", "short": "Second London Confession", "href": "/study/creeds/1689-london-baptist-confession-1677",
     "note": "Read: that paragraph only, in its own spelling, from the site's creeds collection. Public domain."},
    {"id": "abstract", "name": "Abstract of Principles (1858)", "short": "Abstract of Principles", "href": "/study/creeds/abstract-of-principles-1858",
     "note": "Read: the article on the fall of man only, from the site's creeds collection. Public domain."},
    {"id": "traditional", "name": "A Statement of the Traditional Southern Baptist Understanding of God's Plan of Salvation (2012), Article 2", "short": "A 2012 Southern Baptist statement", "href": None,
     "note": "Seen only as an extract returned by a search tool. Rights are held by its authors, so it is told in this site's words and not quoted. Not adopted by the convention."},
    {"id": "calvin-gen", "name": "John Calvin, Commentary on Genesis, vol. 1, trans. John King", "short": "John Calvin", "href": "https://www.ccel.org/ccel/calvin/calcom01.html",
     "note": "Read: his comments on Genesis 1:26 and 9:6 only. Reformed, not Baptist. Public domain."},
    {"id": "henry-gen", "name": "Matthew Henry, Commentary on the Whole Bible, on Genesis 3", "short": "Matthew Henry", "href": "https://www.ccel.org/ccel/henry/mhc1.html",
     "note": "Read: his comment on Genesis 3:15 only. Presbyterian, not Baptist. Public domain."},
    {"id": "westminster", "name": "Westminster Confession of Faith (1647), 6.3", "short": "Westminster Confession", "href": "/study/creeds/westminster-confession-of-faith-1647",
     "note": "Read: that paragraph only. Labelled as Presbyterian. Public domain."},
    {"id": "trent", "name": "Council of Trent, Decree on Original Sin (1546)", "short": "Council of Trent", "href": "/study/creeds/council-of-trent-canons-and-decrees-1563",
     "note": "Read: that decree only. Labelled as Roman Catholic. Public domain."},
    {"id": "orthodox", "name": "Longer Catechism of the Orthodox Church (1839), question 168", "short": "Longer Catechism", "href": "/study/creeds/longer-catechism-of-the-orthodox-church-1839",
     "note": "Read: that question only. Labelled as Orthodox. Public domain."},
]
