"""The lists the What Scripture promises the sick page draws beside the study's own text. build-data.py checks every
phrase here against the Berean, so a row cannot claim words its verse does not hold. These are this study's choices,
not a census of Scripture."""

HERO = {
    "trail": [("Study", "/study"), ("Living the Christian Life", "/study/theology?area=life")],
    "concepts": ["Promise", "Prayer", "Story", "Now and not yet"],
    # The title is split into its ink part and its gold italic turn; build-data.py checks they rejoin to the title.
    "ink": "What Scripture",
    "turn": "promises the sick",
    "motto": ["I have heard your prayer;", "I have seen your tears."],
    "motto_ref": "Isaiah 38:5",
}

# The sick Scripture leaves in the story, in the order the study reads them. Each phrase is checked in its verse.
# "kind" sets the mark's shape and its word; "recovered" is the only kind counted as recovered.
KINDS = {
    "recovered": "Recovered",
    "heard": "Heard; recovery not told",
    "kept": "Not taken away",
    "left": "Left ill",
    "untold": "Not told",
    "dark": "Ends in the dark",
}
REGISTER = [
    {"who": "Publius's father", "part": "00",
     "ill": ("Acts 28:8", "sick in bed, suffering from fever and dysentery"),
     "said": ("Acts 28:8", "after praying and placing his hands on him"),
     "then": ("Acts 28:8", "he healed the man"), "kind": "recovered"},
    {"who": "Job", "part": "01",
     "ill": ("Job 2:7", "terrible boils from the soles of his feet to the crown of his head"),
     "said": ("Job 13:15", "Though He slay me, I will hope in Him"),
     "then": ("Job 42:7", "you have not spoken about Me accurately, as My servant Job has"), "kind": "untold",
     "label": "Never told why"},
    {"who": "The psalmist of Psalm 6", "part": "02",
     "ill": ("Psalm 6:2", "my bones are in agony"),
     "said": ("Psalm 6:2", "heal me, O LORD"),
     "then": ("Psalm 6:9", "The LORD has heard my cry for mercy"), "kind": "heard"},
    {"who": "The psalmist of Psalm 88", "part": "02",
     "ill": ("Psalm 88:15", "From my youth I was afflicted and near death"),
     "said": ("Psalm 88:1", "the God of my salvation"),
     "then": ("Psalm 88:18", "darkness is my closest companion"), "kind": "dark"},
    {"who": "Hezekiah", "part": "03",
     "ill": ("Isaiah 38:1", "Hezekiah became mortally ill"),
     "said": ("Isaiah 38:3", "And Hezekiah wept bitterly"),
     "then": ("Isaiah 38:5", "I will add fifteen years to your life"), "kind": "recovered",
     "later": ("2 Kings 20:21", "Hezekiah rested with his fathers"), "label": "Recovered; later died"},
    {"who": "Timothy", "part": "03",
     "ill": ("1 Timothy 5:23", "your stomach and your frequent ailments"),
     "said": ("1 Timothy 5:23", "use a little wine instead"),
     "then": None, "kind": "untold"},
    {"who": "Paul", "part": "04",
     "ill": ("2 Corinthians 12:7", "a thorn in my flesh"),
     "said": ("2 Corinthians 12:8", "Three times I pleaded with the Lord to take it away from me"),
     "then": ("2 Corinthians 12:9", "My grace is sufficient for you"), "kind": "kept"},
    {"who": "Epaphroditus", "part": "04",
     "ill": ("Philippians 2:27", "He was sick indeed, nearly unto death"),
     "said": None,
     "then": ("Philippians 2:27", "But God had mercy on him"), "kind": "recovered"},
    {"who": "Trophimus", "part": "04",
     "ill": ("2 Timothy 4:20", "Trophimus I left sick in Miletus"),
     "said": None, "then": None, "kind": "left"},
    {"who": "The woman who touched His cloak", "part": "05",
     "ill": ("Mark 5:25", "had suffered from bleeding for twelve years"),
     "said": ("Mark 5:28", "If only I touch His garments, I will be healed"),
     "then": ("Mark 5:29", "Immediately her bleeding stopped"), "kind": "recovered"},
]

# Words a sick believer is likely to be handed. Each answer is this study's reading, drawn from the part named.
# A row with "ref" is checked in its verse; a row with "source" must appear word for word in content.md.
OFFERED = [
    {"ref": "Psalm 103:3", "says": "heals all your diseases", "part": "07",
     "kind": "Praise, sung to God, not a contract", "when": "Often now; in full in the age to come",
     "who": "A psalmist praising the LORD. It is true, and it is praise."},
    {"ref": "Isaiah 53:5", "says": "by His stripes we are healed", "part": "07",
     "kind": "A prophecy of the servant who suffers for others", "when": "Won at the cross; given in full at the resurrection",
     "who": "The prophet. Matthew applies it to healings, Peter to sins."},
    {"ref": "Mark 5:34", "says": "your faith has healed you", "part": "05",
     "kind": "A story: said to her, of her", "when": "That day, to one woman",
     "who": "Jesus. He gives no amount of faith and no rule for everyone."},
    {"ref": "James 5:15", "says": "the prayer offered in faith will restore the one who is sick", "part": "06",
     "kind": "A promise, with what to do", "when": "Often now; at the last for every believer",
     "who": "James, to the church. The sick person calls; the Lord heals."},
    {"ref": "2 Corinthians 12:9", "says": "My grace is sufficient for you", "part": "04",
     "kind": "A promise, given when the answer was no", "when": "Now",
     "who": "The Lord, to Paul, who kept his thorn."},
    {"ref": "3 John 1:2", "says": "I pray that in every way you may prosper and enjoy good health", "part": "07",
     "kind": "A prayer, in a letter's greeting", "when": "A wish for now, not a guarantee",
     "who": "John, to his friend Gaius."},
    {"ref": "Revelation 21:4", "says": "He will wipe away every tear from their eyes", "part": "07",
     "kind": "A promise without conditions", "when": "Not yet: when God dwells with His people",
     "who": "A loud voice from the throne."},
    {"source": "Job's friends, in this study's paraphrase", "says": "God is just, so a man who suffers this much must have sinned",
     "part": "01", "kind": "An argument about someone else", "when": "Applied now, to Job's boils",
     "who": "Job's friends. God says they were wrong.", "answer_ref": "Job 42:7"},
    {"source": "A tract Criswell read to his church, 1966", "says": "When you make up your mind to obey God, you will be healed.",
     "part": "07", "kind": "A condition, and not Scripture", "when": "Now, it claims",
     "who": "Not Scripture. Paul's thorn and Trophimus answer it.", "answer_ref": "2 Timothy 4:20"},
]

# Part 02: where each prayer of sickness ends. The verse count is taken from the Berean on every build.
PSALM_ENDS = [
    {"psalm": 6, "marked": ("Psalm 6:9", "The LORD has heard my cry for mercy"),
     "last": "All my enemies will be ashamed and dismayed", "ends": "Heard before it ends"},
    {"psalm": 38, "marked": ("Psalm 38:3", "there is no rest in my bones because of my sin"),
     "last": "Come quickly to help me, O Lord my Savior", "ends": "Still asking"},
    {"psalm": 41, "marked": ("Psalm 41:4", "heal me, for I have sinned against You"),
     "last": "Blessed be the LORD, the God of Israel", "ends": "Ends blessing the LORD"},
    {"psalm": 102, "marked": ("Psalm 102:27", "But You remain the same, and Your years will never end"),
     "last": "The children of Your servants will dwell securely", "ends": "Ends with the God who remains"},
    {"psalm": 88, "marked": ("Psalm 88:1", "the God of my salvation"),
     "last": "darkness is my closest companion", "ends": "Ends in the dark"},
]

# Part 03: Hezekiah in five steps. The fifteen years run from the answer to his death.
HEZEKIAH = [
    {"step": "The word", "ref": "Isaiah 38:1", "says": "you will not recover"},
    {"step": "The prayer", "ref": "Isaiah 38:3", "says": "Hezekiah wept bitterly"},
    {"step": "The answer", "ref": "Isaiah 38:5", "says": "I will add fifteen years to your life"},
    {"step": "The remedy", "ref": "Isaiah 38:21", "says": "apply it to the boil, and he will recover"},
    {"step": "The end", "ref": "2 Kings 20:21", "says": "Hezekiah rested with his fathers"},
]

# Part 04: the two verses its Consider asks the reader to set side by side, and the answer given to Paul beneath.
PAIR = [
    {"who": "Epaphroditus", "ref": "Philippians 2:27", "says": "But God had mercy on him"},
    {"who": "Trophimus", "ref": "2 Timothy 4:20", "says": "Trophimus I left sick in Miletus"},
]
PAIR_BENEATH = {"ref": "2 Corinthians 12:9", "says": "My grace is sufficient for you"}

# Part 05: four prayers in their own words, and what followed each.
FAITH = [
    {"who": "The woman", "asked": ("Mark 5:28", "If only I touch His garments, I will be healed"),
     "followed": ("Mark 5:29", "Immediately her bleeding stopped")},
    {"who": "The boy's father", "asked": ("Mark 9:24", "I do believe; help my unbelief!"),
     "followed": ("Mark 9:27", "he stood up")},
    {"who": "Paul", "asked": ("2 Corinthians 12:8", "Three times I pleaded with the Lord"),
     "followed": ("2 Corinthians 12:9", "My grace is sufficient for you")},
    {"who": "Jesus, in the garden", "asked": ("Mark 14:36", "Yet not what I will, but what You will"),
     "followed": ("Mark 15:24", "And they crucified Him")},
]
# The sentence that interprets the figure, taken word for word from the study's part 05.
FAITH_LINE = "Healing comes from Christ's power and mercy; it is not paid for with a quantity of faith."

# Part 06: who acts in James 5:14-16, each in the verse's words.
ACTORS = [
    {"who": "The sick person", "ref": "James 5:14", "does": "He should call the elders of the church"},
    {"who": "The elders", "ref": "James 5:14", "does": "pray over him and anoint him with oil in the name of the Lord"},
    {"who": "The church", "ref": "James 5:16", "does": "confess your sins to each other and pray for each other"},
    {"who": "The Lord", "ref": "James 5:15", "does": "The Lord will raise him up"},
]

# Part 07: one song, read two ways by the New Testament.
SONG = [
    {"from": ("Isaiah 53:4", "Surely He took on our infirmities and carried our sorrows"),
     "to": ("Matthew 8:17", "He took on our infirmities and carried our diseases"),
     "context": ("Matthew 8:16", "healed all the sick"), "applied": "To an evening of healings, before the cross"},
    {"from": ("Isaiah 53:5", "by His stripes we are healed"),
     "to": ("1 Peter 2:24", "He Himself bore our sins in His body on the tree"),
     "context": ("1 Peter 2:24", "so that we might die to sin and live to righteousness"), "applied": "To sins borne on the tree"},
]

# The close: what He does not promise and what He does. Each "line" must be in the close paragraph word for word;
# each promise's verse phrase is checked in its verse.
NOT_PROMISED = ["that every illness will end in this life", "that healing follows enough faith or a large enough gift",
                "that you will be told why"]
PROMISES = [
    {"line": "that He hears", "ref": "Psalm 6:9", "says": "The LORD has heard my cry for mercy"},
    {"line": "that His grace is enough", "ref": "2 Corinthians 12:9", "says": "My grace is sufficient for you"},
    {"line": "that His church will pray", "ref": "James 5:14", "says": "call the elders of the church to pray over him"},
    {"line": "that He often restores now", "ref": "Philippians 2:27", "says": "But God had mercy on him"},
    {"line": "that your body will be redeemed", "ref": "Romans 8:23", "says": "the redemption of our bodies"},
    {"line": "every tear wiped away", "ref": "Revelation 21:4", "says": "He will wipe away every tear from their eyes"},
]

# A bare "chapter:verse" in the text takes its book only from here, keyed by part. Any other bare one fails the build.
SHORT_REFS = {("07", "52:13"): "Isaiah", ("07", "53:4–6"): "Isaiah", ("07", "8:18–25"): "Romans"}

# Studies the text names in italics. A study with a mock-up on this PC links to it, and the build fails if that
# folder has no index.html; None means the study is named only, because it is not a page yet.
STUDY_LINKS = {
    "The signs and works of Jesus": "the-signs-and-works-of-jesus-directions",
    "Christ in the Old Testament": None,
    "The cross, the empty tomb and the throne: what Jesus’ death and rising did": "what-the-cross-accomplishes-directions",
    "The hope to come": "the-hope-to-come-directions",
}

# Quoted words that are not Scripture. Each names its source and, where the source is held on this PC, the file
# (relative to the BibleProject folder) the words must be found in. None means not held: the page marks it.
CRISWELL_1974 = "sources/library/source-criswell/asset-sermons-criswell-13020/original.html"
CRISWELL_1966 = "sources/library/source-criswell/asset-sermons-criswell-17800/original.html"
CALVIN = "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-45/calcom45.xml"
PIPER_1990 = "sources/library/source-desiring-god/asset-modern-piper-krh36l3y-html/original.html"
PIPER_2014 = "sources/library/source-desiring-god/asset-modern-piper-o7cegug0-html/original.html"
BFM = "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt"
TRENT = "Website/content/seo/pages/study__creeds__council-of-trent-canons-and-decrees-1563.json"
OUTSIDE_QUOTES = {
    "let us use all of the means that we can, for they also are of God": ("W. A. Criswell, “Divine Healing”, 1974", CRISWELL_1974),
    "a bedlam of differing voices": ("W. A. Criswell, “Divine Healing”, 1974", CRISWELL_1974),
    "A part of the atonement of Christ is for the healing of our bodies": ("W. A. Criswell, “Divine Healing”, 1974", CRISWELL_1974),
    "God does not always heal.": ("W. A. Criswell, “Divine Healing”, 1974", CRISWELL_1974),
    "paid healers—men who make money off of the illnesses of the people": ("W. A. Criswell, “Divine Healing”, 1974", CRISWELL_1974),
    "Even the apostles had not the gifts of healing indiscriminately": ("W. A. Criswell, “The Gifts of Healing”, 1966", CRISWELL_1966),
    "God heals. God healed yesterday. God heals today.": ("W. A. Criswell, “The Gifts of Healing”, 1966", CRISWELL_1966),
    "a sign gift": ("W. A. Criswell, “The Gifts of Healing”, 1966", CRISWELL_1966),
    "When the office passed away, the sign passed away": ("W. A. Criswell, “The Gifts of Healing”, 1966", CRISWELL_1966),
    "When you make up your mind to obey God, you will be healed.": ("A tract read by W. A. Criswell, “The Gifts of Healing”, 1966", CRISWELL_1966),
    "It is, indeed, certain that they were not all healed": ("John Calvin, on James 5:14", CALVIN),
    "as often and as far as he knew it would be expedient": ("John Calvin, on James 5:15", CALVIN),
    "That the gift of healing was temporary": ("John Calvin, on James 5:14", CALVIN),
    "So I believe that 'gifts of healings' and 'workings of miracles' are for the church today": ("John Piper, sermon, 1990", PIPER_1990),
    "The greatest need is to care that people are sick": ("John Piper, sermon, 1990", PIPER_1990),
    "will heal them in the age to come. He heals them often now. And when he doesn't, they will get healing that is even better": ("John Piper, 2014", PIPER_2014),
    "bestows the spiritual gifts by which they serve God through His church": ("Baptist Faith and Message 2000, Article II", BFM),
    "involves the redemption of the whole man": ("Baptist Faith and Message 2000, Article IV", BFM),
    "Glorification is the culmination of salvation": ("Baptist Faith and Message 2000, Article IV", BFM),
    "Extreme Unction": ("Council of Trent, seventh session, canon I", TRENT),
    "Divine healing is an integral part of the gospel. Deliverance from sickness is provided for in the atonement, and is the privilege of all believers": ("Assemblies of God, Statement of Fundamental Truths, 12", None),
    "Deliverance from sickness is provided for in the atonement.": ("Assemblies of God, Statement of Fundamental Truths, 12", None),
    "the privilege of all believers": ("Assemblies of God, Statement of Fundamental Truths, 12", None),
    "Provision is made in the redemption of Jesus Christ for the healing of the mortal body": ("Christian and Missionary Alliance, statement of faith", None),
}

# Quoted words that are titles or the study's own terms, not quotations from anywhere.
OWN_TERMS = {"Divine Healing", "The Gifts of Healing", "God Heals All Our Diseases, Really?", "The Believer and Positive Confession",
             "positive confession", "Health is guaranteed now.", "What if the answer is no?", "How much do I believe?",
             "Whom do I trust?", "we"}

SOURCES = [
    ("The Berean Standard Bible", "Every Bible verse and every quoted phrase, checked by script against the site's copy."),
    ("The Baptist Faith and Message 2000", "Articles II and IV, quoted in short phrases and found by script in the copy held on this PC. The site's doctrinal standard."),
    ("W. A. Criswell", "Sermons “The Gifts of Healing” (1966) and “Divine Healing” (1974), First Baptist Church, Dallas. Read in full; every quotation found by script."),
    ("John Calvin", "Commentary on James 5:14–15, Calvin Translation Society text. Read; every quotation found by script."),
    ("John Piper", "Sermon “Gifts of Healings and Workings of Miracles” (1990) and “God Heals All Our Diseases, Really?” (2014). Read; every quotation found by script."),
    ("The Council of Trent", "Seventh session, canon I, for “Extreme Unction”, from the site's own copy."),
    ("Assemblies of God; Christian and Missionary Alliance", "Quoted from their statements of faith. Not held on this PC: the wording is marked as not yet confirmed."),
    ("Rashi; the Targum Jonathan", "Named, not quoted, for the Jewish readings of Isaiah's servant."),
]
