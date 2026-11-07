"""The Women of the Bible mock-up's own lists: what the page draws beyond the study text. build-data.py checks every one.

Every Scripture phrase here must be in its verse, as whole words. Every remembering verse must be cited in content.md,
and a "named" memory must hold the woman's name. Every outside quotation in content.md is listed here with its source;
where this PC holds the source, the build finds the words in it.
"""

# The heading. The motto is Mark 14:9, the verse the study opens with.
CONCEPTS = ["What she did", "What God did", "How Scripture remembers her"]
MOTTO = {"lines": ["What she has done", "will also be told."], "ref": "Mark 14:9"}
TITLE = {"plain": "Women of", "turn": "the Bible"}
TRAIL = [("/study", "Study"), ("/study/theology?area=people", "People of Scripture")]
CLOSE_PASSAGE = "Mark 14:3–9"  # printed at the close: the anointing the study begins with

# The three questions of the frame, each with the mark that labels its strand on every woman.
MARKS = ["did", "god", "memory"]

# The sixteen stories in the study's order. "h3" are the sub-heads in content.md that tell her story. "book" places her
# on the memory chart. "line" is one phrase of her story, in the verse's own words. "memory" is how later Scripture
# looks back on her, as this study reads it: "named" (the verse names her), "echo" (an echo, not a naming) or
# "aside" (named, but a use the study sets aside). "name_in" is the word the verse must hold for a "named" memory.
WOMEN = [
    {"id": "sarah", "name": "Sarah", "part": "01", "h3": ["Sarah: laughter, then a son"], "book": "Genesis",
     "line": ("laughed to herself", "Genesis 18:12"),
     "memory": [("Hebrews 11:11", "named", "Sarah", "By faith Sarah"), ("1 Peter 3:6", "named", "Sarah", "Sarah obeyed Abraham")]},
    {"id": "hagar", "name": "Hagar", "part": "01", "h3": ["Hagar: the woman who named the LORD"], "book": "Genesis",
     "line": ("You are the God who sees me", "Genesis 16:13"),
     "memory": [("Galatians 4:21–31", "aside", "Hagar", "This is Hagar")]},
    {"id": "miriam", "name": "Miriam", "part": "02", "h3": ["Miriam: a prophetess, and a warning"], "book": "Exodus",
     "line": ("Sing to the LORD, for He is highly exalted", "Exodus 15:21"),
     "memory": [("Micah 6:4", "named", "Miriam", "as well as Aaron and Miriam")]},
    {"id": "rahab", "name": "Rahab", "part": "02", "h3": ["Rahab: faith from outside"], "book": "Joshua",
     "line": ("the LORD your God is God in the heavens above", "Joshua 2:11"),
     "memory": [("Matthew 1:5", "named", "Rahab", "Salmon was the father of Boaz by Rahab"),
                ("Hebrews 11:31", "named", "Rahab", "By faith the prostitute Rahab"),
                ("James 2:25", "named", "Rahab", "when she welcomed the spies")]},
    {"id": "deborah", "name": "Deborah", "part": "03", "h3": ["Deborah: prophetess and judge"], "book": "Judges",
     "line": ("a mother in Israel", "Judges 5:7"), "memory": []},
    {"id": "huldah", "name": "Huldah", "part": "03", "h3": ["Huldah: the word of God for a king"], "book": "2 Kings",
     "line": ("because your heart was tender", "2 Kings 22:19"), "memory": []},
    {"id": "ruth", "name": "Ruth", "part": "04", "h3": ["Ruth: \"your God will be my God\""], "book": "Ruth",
     "line": ("your God will be my God", "Ruth 1:16"),
     "memory": [("Matthew 1:5", "named", "Ruth", "Boaz the father of Obed by Ruth")]},
    {"id": "hannah", "name": "Hannah", "part": "04", "h3": ["Hannah: a prayer poured out"], "book": "1 Samuel",
     "line": ("I have poured out my soul before the LORD", "1 Samuel 1:15"),
     "memory": [("Luke 1:47", "echo", None, "my spirit rejoices in God my Savior")],
     "echo_of": ("1 Samuel 2:1", "My heart rejoices in the LORD")},
    {"id": "abigail", "name": "Abigail", "part": "04", "h3": ["Abigail: discernment that stopped a massacre"], "book": "1 Samuel",
     "line": ("Blessed is your discernment", "1 Samuel 25:33"), "memory": []},
    {"id": "esther", "name": "Esther", "part": "05", "h3": [], "book": "Esther",
     "line": ("if I perish, I perish", "Esther 4:16"), "memory": []},
    {"id": "mary", "name": "Mary, the mother of Jesus", "short": "Mary", "part": "06", "h3": [], "book": "Luke",
     "line": ("I am the Lord's servant", "Luke 1:38"), "memory": []},
    {"id": "magdalene", "name": "Mary Magdalene", "part": "07", "h3": ["Women on the road with Him", "The first witness of the risen Lord"], "book": "John",
     "line": ("I have seen the Lord", "John 20:18"), "memory": []},
    {"id": "bethany", "name": "Martha and Mary", "part": "07", "h3": ["Martha and Mary of Bethany"], "book": "John",
     "line": ("I believe that You are the Christ", "John 11:27"), "women": 2,
     "memory": [("Mark 14:9", "echo", None, "in memory of her")],
     "memory_note": "Mark does not name her; most readers take it to be the same anointing"},
    {"id": "lydia", "name": "Lydia", "part": "08", "h3": ["Lydia: an open heart and an open house"], "book": "Acts",
     "line": ("The Lord opened her heart", "Acts 16:14"), "memory": []},
    {"id": "priscilla", "name": "Priscilla", "part": "08", "h3": ["Priscilla: a teacher at home, a risk-taker for Paul"], "book": "Acts",
     "line": ("explained to him the way of God more accurately", "Acts 18:26"),
     "memory": [("Romans 16:3–4", "named", "Prisca", "Greet Prisca and Aquila"), ("1 Corinthians 16:19", "named", "Prisca", "Aquila and Prisca greet you warmly")]},
    {"id": "phoebe", "name": "Phoebe", "part": "08", "h3": ["Phoebe: a servant of the church"], "book": "Romans",
     "line": ("a servant of the church in Cenchrea", "Romans 16:1"), "memory": []},
]
# Junia has one verse, not a story; the study says she is not counted among the sixteen.
EXTRA = {"id": "junia", "name": "Junia", "part": "08", "h3": "Junia: in Christ before Paul", "line": ("in Christ before I was", "Romans 16:7")}
STORIES, WOMEN_NAMED = 16, 17

# The close read as a list: each clause of the last paragraph, with the stories it names. Each must be in that paragraph.
LITANY = [
    ("kept His word to", "a laughing Sarah", ["sarah"]),
    ("saw", "a runaway slave", ["hagar"]),
    ("brought", "a Canaanite and a Moabite into the family line of His Son", ["rahab", "ruth"]),
    ("spoke through", "Deborah and Huldah", ["deborah", "huldah"]),
    ("heard", "Hannah", ["hannah"]),
    ("used", "Abigail's wisdom and Esther's courage", ["abigail", "esther"]),
    ("chose", "Mary to bear His Son and Mary Magdalene to announce His rising", ["mary", "magdalene"]),
    ("opened", "Lydia's heart", ["lydia"]),
]

# Named studies in content.md: a mock-up link only where its folder holds an index.html (checked on every build).
STUDY_LINKS = {
    "The signs and works of Jesus": "../the-signs-and-works-of-jesus-directions/",
    "The church and its calling": "../the-church-and-its-calling-directions/",
}

# Held sources: where this PC keeps a copy, relative to the BibleProject folder.
HELD = {
    "bfm": "Website/content/questions/sources/raw/baptist-know-the-truth-catechism/catechism-bfm-2000.txt",
    "criswell-1960": "sources/library/source-criswell/asset-sermons-criswell-15060/original.html",
    "criswell-1984": "sources/library/source-criswell/asset-sermons-criswell-12400/original.html",
    "piper-2006": "sources/library/source-desiring-god/asset-modern-piper-syq8ktzw-html/original.html",
    "calvin-1tim": "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-43/calcom43.xml",
    "calvin-rom": "sources/library/source-ccel/asset-ready-text-edition-l06-calvin-38/calcom38.xml",
    "henry-2kgs": "sources/library/source-ccel/asset-rb03-39c87fe47cbc40131dfd/original.xml",
    "henry-john": "sources/library/bulk/ccel/henry_mhc5.xml",
    "henry-acts": "sources/library/bulk/ccel/henry_mhc6.xml",
    "chalcedon": "Website/content/seo/pages/study__creeds__chalcedonian-definition-451.json",
    "bsb-note-rom": "Website/data/text/bsb/ROM",
    "bsb-note-1ti": "Website/data/text/bsb/1TI",
}

# Every quotation in content.md from outside Scripture: phrase -> held source key, or None where no copy is held.
OUTSIDE_QUOTES = {
    "God created man in His own image": "bfm",
    "While both men and women are gifted for service in the church, the office of pastor is limited to men as qualified by Scripture": "bfm",
    "the office of pastor is limited to men as qualified by Scripture": "bfm",
    "pastors and deacons": "bfm",
    "servant leadership": "bfm",
    "of equal worth before God, since both are created in God's image": "bfm",
    "as Christ loved the church": "bfm",
    "graciously to the servant leadership of her husband": "bfm",
    "an unusual leader, with great faith and tremendous heart and spirit": "criswell-1960",
    "If a man cannot be found, if a man fails, then seek out a woman; a consecrated, godly woman that can pray and that knows the Lord": "criswell-1960",
    "Mary of Magdala, to whom the Lord first appeared, raised from the dead – to a woman, to a woman": "criswell-1984",
    "Because of the biblical interdiction against the ordination of a woman as a pastor or as a deacon, I am going to create in the church a pastor's council that will include women along with dedicated men.": "criswell-1984",
    "She may well have been an official deacon in that church,": "piper-2006",
    "There is no reason why (as I read the qualifications in 1 Timothy 3) women cannot be deacons.": "piper-2006",
    "The elders are men and are charged with the governance and teaching of the church": "piper-2006",
    "Extraordinary acts done by God do not overturn the ordinary rules of government, by which he intended that we should be bound": "calvin-1tim",
    "performed a most honorable and a most holy function in the Church": "calvin-rom",
    "her being a wife was no prejudice at all to her being a prophetess": "henry-2kgs",
    "she becomes an apostle to the apostles": "henry-john",
    "a piece of very good service, both to them and to the church": "henry-acts",
    "Mary the Virgin, the God-bearer": "chalcedon",
    "Or deaconess": "bsb-note-rom",
    "Or their wives": "bsb-note-1ti",
    # Not held on this PC: the study itself marks the first three "[check: …]".
    "in the first instance of her conception, by a singular grace and privilege granted by Almighty God, in view of the merits of Jesus Christ, the Savior of the human race, was preserved free from all stain of original sin": None,
    "more honourable than the cherubim": None,
    "This rule is positive: explicit and universal": None,
    "their example is no warrant now": None,
    "well known to the apostles": None,
}
OUTSIDE_NAMES = {None: "not held on this PC", "bfm": "Baptist Faith and Message 2000", "criswell-1960": "W. A. Criswell, \"By Faith Deborah\" (1960)",
                 "criswell-1984": "W. A. Criswell, \"Woman's Work in the Church\" (1984)", "piper-2006": "John Piper, sermon on Romans 16 (2006)",
                 "calvin-1tim": "Calvin on 1 Timothy", "calvin-rom": "Calvin on Romans", "henry-2kgs": "Matthew Henry, vol. 2",
                 "henry-john": "Matthew Henry, vol. 5", "henry-acts": "Matthew Henry, vol. 6", "chalcedon": "The Chalcedonian Definition (451)",
                 "bsb-note-rom": "the Berean's note on Romans 16:1", "bsb-note-1ti": "the Berean's note on 1 Timothy 3:11"}

# Words the study uses as its own terms or names, in quotation marks, not quoting a verse.
OWN_TERMS = {"God-bearer", "the all-holy", "all-holy", "The Christ", "Messiah", "servant", "deacon", "Apostle", "one who is sent", "pastor"}

# Sources named on the page, under the close.
SOURCES = [
    ("Scripture:", "Berean Standard Bible, from this site's text; every quotation and reference checked by script."),
    ("Baptist Faith and Message 2000:", "Articles III, VI and XVIII, from the copy held on this PC (bfm.sbc.net to be re-read before release)."),
    ("Sermons:", "W. A. Criswell, \"By Faith Deborah\" (1960) and \"Woman's Work in the Church\" (1984); John Piper, sermon on Romans 16 (2006)."),
    ("Commentaries:", "John Calvin on Romans 16:1 and 1 Timothy 2:12; Matthew Henry on 2 Kings 22:14, John 20:17 and Acts 18:26; Albert Barnes on 1 Corinthians 11:5 and 14:34."),
    ("Councils and churches:", "The Chalcedonian Definition (451); Pius IX, Ineffabilis Deus (1854); the Liturgy of St John Chrysostom."),
]
