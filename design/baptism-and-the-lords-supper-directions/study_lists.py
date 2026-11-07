"""The lists the Baptism and the Lord's Supper page draws beside the study's own text. build-data.py checks every Bible
phrase here against the Berean, as whole words in the one verse named, and every outside quotation against the copy
held on this PC where there is one. Which words answer "what it points to" and "what came before" is the study's own
reading, quoted in "study_says"; a script proves the words and that the study says it, not the reading."""

# Quotations that stand just after a "not" in their verse but do not reverse it (a question expecting "yes").
NEGATED_ON_PURPOSE = {"Cup of blessing": "1 Corinthians 10:16 asks, “Is not the cup of blessing that we bless a participation…?”"}

# 00 Two signs, two questions. Each answer is a phrase in one verse. "study_says" is the study's own sentence that
# gives this answer, and build-data.py proves it is in content.md word for word.
SIGNS = [
    {"id": "water", "name": "The water", "rhythm": "Once",
     "points": [("Colossians 2:12", "having been buried with Him in baptism"), ("Colossians 2:12", "you were raised with Him through your faith")],
     "before": ("Acts 8:12", "when they believed Philip as he preached"),
     "study_says": "The water points to a burial and a rising, Christ's and yours. Before it, every time, came hearing and believing."},
    {"id": "table", "name": "The bread and the cup", "rhythm": "Again and again",
     "points": [("1 Corinthians 11:24", "This is My body, which is for you"), ("1 Corinthians 11:26", "you proclaim the Lord’s death until He comes")],
     "before": ("1 Corinthians 11:23", "on the night He was betrayed"),
     "study_says": "Before them came the night He was betrayed."},
]

# Part 03: one entry per row of the study's panel, in its order. "kind" is the page's one-line name for what the
# passage names first; "word" must stand in that row's own text in content.md, so the name cannot drift from the row.
# "household": "believed" draws a household the verse says believed (the phrase is proved in its verse); "silent"
# draws one the passage leaves open, and build-data.py proves no verse of the row says the household believed.
PANEL = [
    {"kind": "embraced the message", "word": "embraced his message"},
    {"kind": "believed", "word": "believed Philip"},
    {"kind": "believed", "word": "believed"},
    {"kind": "told the good news", "word": "good news"},
    {"kind": "the Lord appeared", "word": "appeared to Saul"},
    {"kind": "the Spirit fell", "word": "Holy Spirit fell"},
    {"kind": "her heart opened", "word": "opened her heart", "household": "silent"},
    {"kind": "the word spoken", "word": "the word spoken", "household": ("Acts 16:34", "he and all his household rejoiced that they had come to believe in God")},
    {"kind": "heard and believed", "word": "heard the message believed", "household": ("Acts 18:8", "Crispus, the synagogue leader, and his whole household believed in the Lord")},
    {"kind": "heard", "word": "On hearing this"},
]

# Parts 05 and 06: the meal looks two ways. Each strip follows the block quotation it is drawn from.
DIRECTIONS = [
    {"part": "05", "after": "Mark 14:22–24", "back": ("Mark 14:24", "This is My blood of the covenant, which is poured out for many"),
     "forward": ("Mark 14:25", "until that day when I drink it anew in the kingdom of God")},
    {"part": "06", "after": "1 Corinthians 11:26", "back": ("1 Corinthians 11:26", "you proclaim the Lord’s death"),
     "forward": ("1 Corinthians 11:26", "until He comes")},
]

# Part 07: Acts 2:41–42 in its own order. Reading "the breaking of bread" as the Supper is an interpretation; the page
# says so, and the study's glossary gives it as one of the Supper's names.
ORDER = {"part": "07", "study_says": "So the order is faith, then baptism, then the table.",
         "steps": [("Embraced the message", "Acts 2:41", "Those who embraced his message"), ("Baptized", "Acts 2:41", "were baptized"),
                   ("Added", "Acts 2:41", "added to the believers"), ("The breaking of bread", "Acts 2:42", "the breaking of bread")]}

# Corrections made in memory, never written to content.md; the page names each. Each must match exactly once.
TEXT_PATCHES = [
    {"old": '"Paul and Paul and Silas spoke the word', "new": '"Paul and Silas spoke the word',
     "why": "content.md doubles a word in Acts 16:32 (“Paul and Paul and Silas”); the page quotes the Berean, “Paul and Silas”."},
]

# Crisis numbers in part 03, each matched to the site's checked list (life.json) where it holds one; None = not held.
CRISIS = [("988", "988-lifeline"), ("024", "spain-024"), ("800 911 2000", "mexico-linea-de-la-vida"), ("135", None), ("188", "brazil-cvv")]

# Studies named in italics, with the mock-up folder that holds each (None = not yet a page on this PC).
STUDY_LINKS = {
    "Who do you say that I am? Who Jesus really is": "who-do-you-say-that-i-am-directions",
    "Witness and the nations: telling others about Jesus": "bearing-witness-directions",
    "A new creation: what changes when you believe": "a-new-creation-directions",
    "Saved by grace: how God forgives and changes us": "grace-faith-and-salvation-directions",
    "The good news: how a person is made right with God": "the-good-news-directions",
    "Angels, demons and spiritual powers": "angels-demons-and-spiritual-powers-directions",
    "Children and the home": None,
    "Covenants and promises": "covenants-and-promises-directions",
    "Christ in the Old Testament": "christ-in-the-old-testament-directions",
    "The church and its calling": "the-church-and-its-calling-directions",
    "What Scripture promises the sick": "illness-and-healing-directions",
    "Chosen and kept: can I be sure?": "chosen-and-kept-directions",
    "Life together: belonging to a church": "life-together-directions",
}

# Quoted words that are not Scripture: phrase -> (source shown on the page, held key or None, part searched).
# For a creed the part is a section number ("29.2") or None for the whole document; for a commentary it is a phrase
# that must stand in the same paragraph, so the quotation is found in the note on the right verse. None = not held.
OUTSIDE_QUOTES = {
    "a church ordinance": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "an act of obedience symbolizing the believer's faith in a crucified, buried, and risen Saviour, the believer's death to sin, the burial of the old life, and the resurrection to walk in newness of life in Christ Jesus.": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "a testimony to his faith in the final resurrection of the dead": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "Christian baptism is the immersion of a believer in water in the name of the Father, the Son, and the Holy Spirit.": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "The Lord's Supper is a symbolic act of obedience whereby members of the church, through partaking of the bread and the fruit of the vine, memorialize the death of the Redeemer and anticipate His second coming.": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "Being a church ordinance... is prerequisite to the privileges of church membership and to the Lord's Supper.": ("Baptist Faith and Message 2000, article VII", "bfm", "VII"),
    "do actually profess repentance towards God, faith in, and obedience to, our Lord Jesus, are the only proper subjects of this ordinance": ("Second London Baptist Confession (1677), 29.2", "lbc", "29.2"),
    "is necessary to the due administration of this ordinance": ("Second London Baptist Confession (1677), 29.4", "lbc", "29.4"),
    "the immersion in water of a believer": ("New Hampshire Confession (1833)", "nh", None),
    "Not only those that do actually profess faith in and obedience unto Christ, but also the infants of one or both believing parents, are to be baptized": ("Westminster Confession, 28.4", "wcf", "28.4"),
    "Dipping of the person into the water is not necessary; but Baptism is rightly administered by pouring or sprinkling water upon the person": ("Westminster Confession, 28.3", "wcf", "28.3"),
    "spiritually, receive and feed upon Christ crucified": ("Westminster Confession, 29.7", "wcf", "29.7"),
    "not corporally or carnally in, with, or under the bread and wine; yet as really, but spiritually, present to the faith of believers": ("Westminster Confession, 29.7", "wcf", "29.7"),
    "is truly, really, and substantially contained": ("Council of Trent, session 13", "trent", None),
    "Transubstantiation": ("Council of Trent, session 13", "trent", None),
    "the true body and blood of our Lord Jesus Christ, under the bread and wine": ("Luther's Small Catechism", "luther", None),
    "a strong presumptive proof that this was an instance of household or infant baptism": ("Albert Barnes, on Acts 16:15", "barnes", "her household"),
    "is not explicitly stated": ("Jamieson, Fausset and Brown, on Acts 16:15", "jfb", "and her household -probably without much delay"),
    "the question of infant baptism must be determined on other grounds": ("Jamieson, Fausset and Brown, on Acts 16:15", "jfb", "and her household -probably without much delay"),
    "between the bread which is used on this occasion, and common and ordinary food": ("Albert Barnes, on 1 Corinthians 11:29", "barnes", "Not discerning the Lord's body"),
    "Through Baptism we are freed from sin and reborn as sons of God": ("Catechism of the Catholic Church, paragraph 1213", None, None),
    "works forgiveness of sins, delivers from death and the devil, and gives eternal salvation to all who believe this": ("Luther's Small Catechism, in a modern translation not held here", None, None),
    "in, with and under": ("Formula of Concord, Solid Declaration VII", None, None),
}

# Facts about the held sources that answer two of the study's own check notes; build-data.py proves each.
# ("words", phrase, key, part): the phrase is in that part. ("proof", osis, key, part): the part cites that passage.
HELD_FACTS = [
    ("proof", "Col.2.11-Col.2.12", "wcf", "28.4", "Colossians 2:11–12 is printed among the Bible verses cited for Westminster 28.4."),
    ("words", "spiritually receive, and feed upon Christ crucified", "lbc", "30.7", "The 1677 confession, 30.7, uses Westminster 29.7's words on spiritual feeding, without its “in, with, or under”."),
    ("words", "thrice plunged in water", "orthodox", "277", "The Longer Catechism of the Orthodox Church (1839) describes baptism as a body “thrice plunged in water”."),
]

# The 1677 confession's own spelling, read as the study modernises it. Nothing else is changed.
OLD_SPELLINGS = {"professe": "profess"}

# Quoted words that are the study's own terms, a word's meaning, or a label, keyed by the phrase; every one must be used.
OWN_TERMS = {
    "order": "the meaning of seder",
    "telling": "the meaning of Haggadah",
    "re-baptism": "a word some use, which most Baptists would not",
    "consubstantiation": "a label others give the Lutheran view",
    "what came first": "the study's own name for the left side of its panel",
}

SOURCES = [
    ("The Baptist Faith and Message 2000, article VII", "Quoted in six places. Each quotation is found by script in article VII of the copy held on this PC. The site's doctrinal standard."),
    ("The Second London Baptist Confession (1677)", "Chapter 29, sections 2 and 4, found by script in the creeds collection held on this PC (Creeds.json, public domain). The held text spells “professe”; the study modernises it."),
    ("The New Hampshire Confession (1833)", "One phrase, found by script in the held text."),
    ("The Westminster Confession of Faith (1647)", "Chapter 28, sections 3 and 4, and chapter 29, section 7, each found by script in its own section of the held text. Reformed and Presbyterian."),
    ("The Council of Trent, session 13 (1551)", "Two phrases, found by script in the held canons and decrees. Roman Catholic."),
    ("Luther's Small Catechism", "The words on the Supper are found in the held translation. The words on baptism are from a modern translation that is not held here; the held older one reads “It worketh forgiveness of sins … gives everlasting salvation to all who believe”. Lutheran."),
    ("Albert Barnes, Notes on the New Testament", "His notes on Acts 16:15 and 1 Corinthians 11:29 only, each quotation found by script in that note in the copy held on this PC (CCEL). Presbyterian."),
    ("Jamieson, Fausset and Brown, Commentary", "The note on Acts 16:15 only, found by script in the held copy (CCEL). Not Baptists."),
    ("Catechism of the Catholic Church", "Paragraph 1213, one sentence. Not held on this PC: not compared by script."),
    ("Formula of Concord, Solid Declaration VII", "Three words. Only the Epitome is held here, and the words are not in it: not compared by script."),
]
